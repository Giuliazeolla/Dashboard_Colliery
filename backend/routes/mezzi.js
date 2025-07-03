// mezzi.js
const express = require('express');
const Mezzo = require('../models/Mezzo');

module.exports = function(io) {
  const router = express.Router();

  // Crea mezzo con attività opzionale
  router.post('/', async (req, res) => {
    try {
      const { nome, attivita } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome richiesto' });

      let mezzo = await Mezzo.findOne({ nome });
      if (mezzo) return res.status(409).json({ error: 'Mezzo già esistente' });

      mezzo = new Mezzo({ nome, attivita });
      await mezzo.save();

      io.emit('mezzoCreato', mezzo);
      res.status(201).json(mezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore creazione mezzo' });
    }
  });

  // Prendi tutti mezzi, con filtro opzionale per attività
  router.get('/', async (req, res) => {
    try {
      const { attivitaId } = req.query;
      let filter = {};
      if (attivitaId) filter.attivita = attivitaId;

      const mezzi = await Mezzo.find(filter);
      res.status(200).json(mezzi);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero mezzi' });
    }
  });

  // Prendi mezzo per ID
  router.get('/:id', async (req, res) => {
    try {
      const mezzo = await Mezzo.findById(req.params.id);
      if (!mezzo) return res.status(404).json({ error: 'Mezzo non trovato' });
      res.status(200).json(mezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero mezzo' });
    }
  });

  // Modifica mezzo, incluso campo attività
  router.put('/:id', async (req, res) => {
    try {
      const aggiornata = await Mezzo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ error: 'Mezzo non trovato' });
      io.emit('mezzoAggiornato', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiornamento mezzo' });
    }
  });

  // Elimina mezzo
  router.delete('/:id', async (req, res) => {
    try {
      const eliminata = await Mezzo.findByIdAndDelete(req.params.id);
      if (!eliminata) return res.status(404).json({ error: 'Mezzo non trovato' });
      io.emit('mezzoEliminato', eliminata._id);
      res.status(200).json({ message: 'Mezzo eliminato' });
    } catch (err) {
      res.status(500).json({ error: 'Errore eliminazione mezzo' });
    }
  });

  return router;
};
