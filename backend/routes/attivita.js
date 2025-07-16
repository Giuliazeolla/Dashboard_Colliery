const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (io) => {
    const router = express.Router();

    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); 
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }


    // GET tutte le attività (con mezzi, attrezzi, operai associati)
    router.get('/', async (req, res) => {
        try {
            const attivita = await prisma.attivita.findMany({
                include: {
                    mezzi: true,
                    attrezzi: true,
                    operai: true,
                },
            });
            const attivitaFormattate = attivita.map( a => ({
                ...a,
                dataInizioFormattata: formatDate(a.dataInizio)
            }))
            res.json(attivitaFormattate);
        } catch (err) {
            res.status(500).json({ error: 'Errore caricamento attività' });
        }
    });

    // POST nuova attività
    router.post('/', async (req, res) => {
        try {
            const { nome, commessaId, durata, dataInizio } = req.body;

            if (!nome) {
                return res.status(400).json({ error: 'Nome richiesto' });
            }

            const esiste = await prisma.attivita.findUnique({ where: { nome } });
            if (esiste) return res.status(409).json({ error: 'Attività già esistente' });

            let nuova;

            const baseData = {
                nome,
                durata: durata !== undefined ? Number(durata) : undefined,
                dataInizio: dataInizio ? new Date(dataInizio) : undefined
            }

            if (commessaId) {
                const commessa = await prisma.commessa.findUnique({ where: { id: commessaId } });
                if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

                nuova = await prisma.attivita.create({
                    data: {
                        ...baseData,
                        commessa: { connect: { id: commessaId } },
                    },
                });
            } else {
                nuova = await prisma.attivita.create({
                    data: baseData
                });
            }
            nuova.dataInizioFormattata = formatDate(nuova.dataInizio);
            io.emit('nuova-attivita', nuova);
            res.status(201).json(nuova);

        } catch (err) {
            console.error('Errore creazione attività:', err);
            res.status(500).json({ error: 'Errore creazione attività' });
        }
    });


    // PUT modifica attività
    router.put('/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const { nome, durata, dataInizio } = req.body;

            if (!nome) return res.status(400).json({ error: 'Nome richiesto' });

            // Recupera l'attività corrente
            const attivitaCorrente = await prisma.attivita.findUnique({
                where: { id },
                select: { commessaId: true },
            });

            if (!attivitaCorrente) {
                return res.status(404).json({ error: 'Attività non trovata' });
            }

            // Prepara i dati da aggiornare
            const dataToUpdate = {
                nome,
                durata: durata !== undefined ? Number(durata) : undefined,
                dataInizio: dataInizio ? new Date(dataInizio) : undefined,
            };

            // Se c'è una commessa associata, riconnetti
            if (attivitaCorrente.commessaId) {
                dataToUpdate.commessa = {
                    connect: { id: attivitaCorrente.commessaId }
                };
            }

            // Aggiorna
            const aggiornata = await prisma.attivita.update({
                where: { id },
                data: dataToUpdate,
            });

            aggiornata.dataInizioFormattata = formatDate(aggiornata.dataInizio);

            res.json(aggiornata);
        } catch (err) {
            console.error(err);
            if (err.code === 'P2002') {
                return res.status(409).json({ error: 'Nome attività duplicato' });
            }
            res.status(500).json({ error: 'Errore aggiornamento attività' });
        }
    });



    // DELETE attività
    router.delete('/:id', async (req, res) => {
        try {
            await prisma.attivita.delete({
                where: { id: parseInt(req.params.id) },
            });
            res.json({ message: 'Attività eliminata' });
        } catch (err) {
            res.status(500).json({ error: 'Errore eliminazione attività' });
        }
    });


    router.put('/:id/associazioni', async (req, res) => {
        const attivitaId = Number(req.params.id);
        const { mezzi = [], attrezzi = [], operai = [] } = req.body;

        if (isNaN(attivitaId)) {
            return res.status(400).json({ error: 'ID attività non valido' });
        }

        try {
            // Filtra solo ID numerici validi
            const validMezzi = mezzi.filter(id => Number.isInteger(id));
            const validAttrezzi = attrezzi.filter(id => Number.isInteger(id));
            const validOperai = operai.filter(id => Number.isInteger(id));

            // Aggiorna le associazioni tramite 'set' (prisma) che sostituisce tutte le relazioni esistenti
            const updatedAttivita = await prisma.attivita.update({
                where: { id: attivitaId },
                data: {
                    mezzi: { set: validMezzi.map(id => ({ id })) },
                    attrezzi: { set: validAttrezzi.map(id => ({ id })) },
                    operai: { set: validOperai.map(id => ({ id })) },
                },
                include: {
                    mezzi: true,
                    attrezzi: true,
                    operai: true,
                    commessa: true,
                },
            });

            io.emit('associazioni-aggiornate', updatedAttivita);

            res.json(updatedAttivita);
        } catch (error) {
            console.error(error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Attività non trovata' });
            }
            res.status(500).json({ error: 'Errore aggiornamento associazioni' });
        }
    });


    // PUT associa/dissocia commessa
    router.put('/:id/commessa', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: 'ID attività non valido' });

            const { commessaId } = req.body;

            let data = {};
            if (commessaId === null || commessaId === undefined) {
                data.commessa = { disconnect: true };
            } else {
                const parsedCommessaId = parseInt(commessaId);
                if (isNaN(parsedCommessaId)) {
                    return res.status(400).json({ error: 'commessaId non valido' });
                }

                const esiste = await prisma.commessa.findUnique({ where: { id: parsedCommessaId } });
                if (!esiste) return res.status(404).json({ error: 'Commessa non trovata' });

                data.commessa = { connect: { id: parsedCommessaId } };
            }

            const attivita = await prisma.attivita.update({
                where: { id },
                data,
                include: {
                    mezzi: true,
                    attrezzi: true,
                    operai: true,
                    commessa: true,
                },
            });

            res.json(attivita);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Errore aggiornamento commessa' });
        }
    });

    // GET attività filtrate per commessaId, con mezzi, attrezzi e operai
    router.get('/commessa/:commessaId', async (req, res) => {
        const commessaId = parseInt(req.params.commessaId);
        if (isNaN(commessaId)) {
            return res.status(400).json({ error: 'commessaId non valido' });
        }

        try {
            const attivita = await prisma.attivita.findMany({
                where: { commessaId },
                include: {
                    mezzi: true,
                    attrezzi: true,
                    operai: true,
                },
            });
            res.json(attivita);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Errore caricamento attività per commessa' });
        }
    });

    return router;
};
