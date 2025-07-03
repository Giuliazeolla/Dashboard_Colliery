// attrezzi.js
const express = require('express');
const Attrezzo = require('../models/Attrezzo');

module.exports = function(io) {
  const router = express.Router();

  // Crea attrezzo con attività opzionale
  router.post('/', async (req, res) => {
    try {
      const { nome, attivita } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome richiesto' });

      let attrezzo = await Attrezzo.findOne({ nome });
      if (attrezzo) return res.status(409).json({ error: 'Attrezzo già esistente' });

      attrezzo = new Attrezzo({ nome, attivita });
      await attrezzo.save();

      io.emit('attrezzoCreato', attrezzo);
      res.status(201).json(attrezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore creazione attrezzo' });
    }
  });

  // Prendi tutti attrezzi, con filtro opzionale per attività
  router.get('/', async (req, res) => {
    try {
      const { attivitaId } = req.query;
      let filter = {};
      if (attivitaId) filter.attivita = attivitaId;

      const attrezzi = await Attrezzo.find(filter);
      res.status(200).json(attrezzi);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero attrezzi' });
    }
  });

  // Prendi attrezzo per ID
  router.get('/:id', async (req, res) => {
    try {
      const attrezzo = await Attrezzo.findById(req.params.id);
      if (!attrezzo) return res.status(404).json({ error: 'Attrezzo non trovato' });
      res.status(200).json(attrezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero attrezzo' });
    }
  });

  // Modifica attrezzo, incluso campo attività
  router.put('/:id', async (req, res) => {
    try {
      const aggiornata = await Attrezzo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ error: 'Attrezzo non trovato' });
      io.emit('attrezzoAggiornato', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiornamento attrezzo' });
    }
  });

  // Elimina attrezzo
  router.delete('/:id', async (req, res) => {
    try {
      const eliminata = await Attrezzo.findByIdAndDelete(req.params.id);
      if (!eliminata) return res.status(404).json({ error: 'Attrezzo non trovato' });
      io.emit('attrezzoEliminato', eliminata._id);
      res.status(200).json({ message: 'Attrezzo eliminato' });
    } catch (err) {
      res.status(500).json({ error: 'Errore eliminazione attrezzo' });
    }
  });

  return router;
};
