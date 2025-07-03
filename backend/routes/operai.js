const express = require('express');
const Operaio = require('../models/Operaio');

module.exports = function(io) {
  const router = express.Router();

  // Crea operaio con possibilità di associare attività
  router.post('/', async (req, res) => {
    try {
      const { nome, attivita } = req.body; // aggiunto attivita opzionale
      if (!nome) return res.status(400).json({ error: 'Nome richiesto' });

      let operaio = await Operaio.findOne({ nome });
      if (operaio) return res.status(409).json({ error: 'Operaio già esistente' });

      operaio = new Operaio({ nome, attivita }); // salvo anche attività se presente
      await operaio.save();

      io.emit('operaioCreato', operaio);
      res.status(201).json(operaio);
    } catch (err) {
      res.status(500).json({ error: 'Errore creazione operaio' });
    }
  });

  // Prendi tutti operai, con filtro opzionale per attività
  router.get('/', async (req, res) => {
    try {
      const { attivitaId } = req.query;
      let filter = {};
      if (attivitaId) filter.attivita = attivitaId;

      const operai = await Operaio.find(filter);
      res.status(200).json(operai);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero operai' });
    }
  });

  // Prendi operaio per ID
  router.get('/:id', async (req, res) => {
    try {
      const operaio = await Operaio.findById(req.params.id);
      if (!operaio) return res.status(404).json({ error: 'Operaio non trovato' });
      res.status(200).json(operaio);
    } catch (err) {
      res.status(500).json({ error: 'Errore recupero operaio' });
    }
  });

  // Modifica operaio, incluso campo attività
  router.put('/:id', async (req, res) => {
    try {
      // attendo che nel body ci sia nome e opzionalmente attivita
      const aggiornata = await Operaio.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ error: 'Operaio non trovato' });
      io.emit('operaioAggiornato', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiornamento operaio' });
    }
  });

  // Elimina operaio
  router.delete('/:id', async (req, res) => {
    try {
      const eliminata = await Operaio.findByIdAndDelete(req.params.id);
      if (!eliminata) return res.status(404).json({ error: 'Operaio non trovato' });
      io.emit('operaioEliminato', eliminata._id);
      res.status(200).json({ message: 'Operaio eliminato' });
    } catch (err) {
      res.status(500).json({ error: 'Errore eliminazione operaio' });
    }
  });

  return router;
};
