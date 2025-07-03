const express = require('express');
const mongoose = require('mongoose');
const Commessa = require('../models/Commessa');
const Activity = require('../models/Attività');

module.exports = function (io) {
    const router = express.Router();

    // ✅ 1. Crea una nuova commessa
    router.post('/', async (req, res) => {
        try {
            const nuovaCommessa = new Commessa(req.body);
            await nuovaCommessa.validate();
            const salvata = await nuovaCommessa.save();

            io.emit('commessaCreata', salvata);
            res.status(201).json(salvata);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante la creazione della commessa' });
        }
    });

    // ✅ 2. Ottieni tutte le commesse (ordinate per data di creazione) con attività popolati
    router.get('/', async (req, res) => {
        try {
            const commesse = await Commessa.find()
                .sort({ createdAt: -1 })
            res.status(200).json(commesse);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante il recupero delle commesse' });
        }
    });


    // ✅ 3. Ottieni una commessa specifica (con attività opzionali)
    router.get('/:id', async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID non valido' });
        }

        try {
            const commessa = await Commessa.findById(req.params.id)
                .populate({
                    path: 'attivita',
                    populate: ['operai', 'mezzi', 'attrezzi'],
                });

            if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });
            res.status(200).json(commessa);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante il recupero della commessa' });
        }
    });



    // ✅ 4. Modifica una commessa (aggiorna solo i campi presenti, con validazione)
    router.put('/:id', async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID non valido' });
        }

        try {
            const commessa = await Commessa.findById(req.params.id);
            if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

            // Aggiorna solo i campi forniti nel body
            Object.keys(req.body).forEach(key => {
                commessa[key] = req.body[key];
            });

            await commessa.validate();
            const aggiornata = await commessa.save();

            io.emit('commessaAggiornata', aggiornata);
            res.status(200).json(aggiornata);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante l\'aggiornamento della commessa' });
        }
    });

    // ✅ 5. Elimina una commessa
    router.delete('/:id', async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID non valido' });
        }

        try {
            const eliminata = await Commessa.findByIdAndDelete(req.params.id);
            if (!eliminata) return res.status(404).json({ error: 'Commessa non trovata' });

            io.emit('commessaEliminata', eliminata._id);
            res.status(200).json({ message: 'Commessa eliminata con successo' });
        } catch (err) {
            res.status(500).json({ error: 'Errore durante l\'eliminazione della commessa' });
        }
    });

    // ✅ 6. Ottieni tutte le attività collegate a una commessa
    router.get('/:id/attivita', async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID non valido' });
        }

        try {
            // Prendi la commessa con le attività popolati (con sotto-populate operai, mezzi, attrezzi)
            const commessa = await Commessa.findById(req.params.id).populate({
                path: 'attivita',
                populate: [
                    { path: 'operai' },
                    { path: 'mezzi' },
                    { path: 'attrezzi' }
                ]
            });

            if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

            res.status(200).json(commessa.attivita);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante il recupero delle attività della commessa' });
        }
    });


    // ✅ 7. Associa/disassocia attività a una commessa
    router.put('/:id/attivita', async (req, res) => {
        const { attivitaIds } = req.body;
        const commessaId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(commessaId)) {
            return res.status(400).json({ error: 'ID commessa non valido' });
        }

        try {
            const commessa = await Commessa.findById(commessaId);
            if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });

            // Aggiorna l'array attività con quello passato dal frontend (checkbox selezionate)
            commessa.attivita = attivitaIds;
            await commessa.save();

            // Popola le attività con i riferimenti interni
            const aggiornata = await Commessa.findById(commessaId);

            io.emit('commessaAggiornata', aggiornata);
            res.status(200).json(aggiornata);
        } catch (err) {
            res.status(500).json({ error: 'Errore durante l\'aggiornamento delle attività della commessa' });
        }
    });

    return router;
};
