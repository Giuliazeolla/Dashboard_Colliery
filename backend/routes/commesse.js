const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = function (io) {
  const router = express.Router();

  // ✅ 1. Crea una nuova commessa
  router.post('/', async (req, res) => {
    try {
      const { dataInizio, dataFine, nome, localita, coordinate, numeroPali, numeroStrutture, numeroModuli } = req.body;

      if (!dataInizio || !dataFine) {
        return res.status(400).json({ error: 'dataInizio e dataFine sono obbligatorie' });
      }

      // Validazione date
      if (isNaN(Date.parse(dataInizio)) || isNaN(Date.parse(dataFine))) {
        return res.status(400).json({ error: 'dataInizio o dataFine non sono date valide' });
      }

      const nuovaCommessa = await prisma.commessa.create({
        data: {
          nome,
          localita,
          coordinate,
          numeroPali,
          numeroStrutture,
          numeroModuli,
          dataInizio: new Date(dataInizio),
          dataFine: new Date(dataFine),
          // ATTIVITA NON INCLUSA QUI
        }
      });

      io.emit('commessaCreata', nuovaCommessa);
      res.status(201).json(nuovaCommessa);
    } catch (err) {
      console.error("❌ Errore durante la creazione della commessa:", err);
      res.status(500).json({ error: err.message });
    }
  });



  // ✅ 2. Ottieni tutte le commesse (ordinate per dataInizio desc)
  router.get('/', async (req, res) => {
    try {
      const commesse = await prisma.commessa.findMany({
        orderBy: { dataInizio: 'desc' },
        include: {
          attivita: true, // include relazioni con attività
        },
      });
      res.status(200).json(commesse);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante il recupero delle commesse' });
    }
  });


  // ✅ 3. Ottieni una commessa specifica (con attività e loro relazioni popolati)
  router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    try {
      const commessa = await prisma.commessa.findUnique({
        where: { id },
        include: {
          attivita: {
            include: {
              operai: true,
              mezzi: true,
              attrezzi: true,
            }
          }
        }
      });

      if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });
      res.status(200).json(commessa);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante il recupero della commessa' });
    }
  });


  // ✅ 4. Modifica una commessa (aggiorna solo i campi presenti, con validazione)
  router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    try {
      // Validazione date se presenti
      if (req.body.dataInizio && isNaN(Date.parse(req.body.dataInizio))) {
        return res.status(400).json({ error: 'dataInizio non è una data valida' });
      }
      if (req.body.dataFine && isNaN(Date.parse(req.body.dataFine))) {
        return res.status(400).json({ error: 'dataFine non è una data valida' });
      }

      // Preparazione dati da aggiornare, convertendo le date se presenti
      const datiAggiornati = { ...req.body };

      // Gestione corretta delle relazioni attività
      if (req.body.attivita) {
        datiAggiornati.attivita = {
          set: req.body.attivita.map((id) => ({ id })),
        };
      }

      if (req.body.dataInizio) datiAggiornati.dataInizio = new Date(req.body.dataInizio);
      if (req.body.dataFine) datiAggiornati.dataFine = new Date(req.body.dataFine);

      const aggiornata = await prisma.commessa.update({
        where: { id },
        data: datiAggiornati,
      });


      io.emit('commessaAggiornata', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      if (err.code === 'P2025') // record not found
        return res.status(404).json({ error: 'Commessa non trovata' });
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della commessa' });
    }
  });


  // ✅ 5. Elimina una commessa
  router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    try {
      const eliminata = await prisma.commessa.delete({
        where: { id },
      });

      io.emit('commessaEliminata', eliminata.id);
      res.status(200).json({ message: 'Commessa eliminata con successo' });
    } catch (err) {
      if (err.code === 'P2025') // record not found
        return res.status(404).json({ error: 'Commessa non trovata' });
      res.status(500).json({ error: 'Errore durante l\'eliminazione della commessa' });
    }
  });


  // GET /commesse/:id/attivita
  router.get('/:id/attivita', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    try {
      const commessa = await prisma.commessa.findUnique({
        where: { id },
        include: { attivita: true }
      });
      if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

      const tutteAttivita = await prisma.attivita.findMany();

      // Mappa aggiungendo associata true se presente in commessa.attivita
      const result = tutteAttivita.map(att => ({
        id: att.id,
        nome: att.nome,
        associata: commessa.attivita.some(a => a.id === att.id),
      }));

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // PATCH /commesse/:id/attivita
  // Aggiunge o rimuove un'attività dall'array commessa.attivita
  router.patch('/:id/attivita', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    const { attivitaId, associata } = req.body;
    if (!attivitaId || typeof associata !== 'boolean') {
      return res.status(400).json({ error: 'attivitaId e associata sono obbligatori' });
    }

    try {
      // Controlla esistenza commessa
      const commessa = await prisma.commessa.findUnique({
        where: { id },
        include: { attivita: true }
      });
      if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

      // Controlla esistenza attività
      const attivita = await prisma.attivita.findUnique({ where: { id: attivitaId } });
      if (!attivita) return res.status(404).json({ error: 'Attività non trovata' });

      if (associata) {
        // Aggiungi associazione se non presente
        if (!commessa.attivita.some(a => a.id === attivitaId)) {
          await prisma.commessa.update({
            where: { id },
            data: {
              attivita: {
                connect: { id: attivitaId }
              }
            }
          });
        }
      } else {
        // Rimuovi associazione se presente
        if (commessa.attivita.some(a => a.id === attivitaId)) {
          await prisma.commessa.update({
            where: { id },
            data: {
              attivita: {
                disconnect: { id: attivitaId }
              }
            }
          });
        }
      }

      res.json({ message: 'Associazione aggiornata con successo' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // GET /commesse/assegnazioni
  router.get('/assegnazioni', async (req, res) => {
    try {
      const commesse = await prisma.commessa.findMany({
        include: {
          attivita: true
        }
      });

      const assegnazioni = commesse.map(commessa => ({
        commessaId: commessa.id,
        nomeCommessa: commessa.nome,
        attivita: commessa.attivita.map(att => ({
          id: att.id,
          nome: att.nome,
        }))
      }));

      res.json(assegnazioni);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  return router;
};
