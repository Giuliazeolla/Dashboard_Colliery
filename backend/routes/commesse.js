const express = require('express');
const Commessa = require('../models/Commessa');
const Activity = require('../models/Activity');

module.exports = function (io) {
  const router = express.Router();

  // ✅ 1. Crea una nuova commessa
  router.post('/', async (req, res) => {
    try {
      const nuovaCommessa = new Commessa(req.body);
      const salvata = await nuovaCommessa.save();

      io.emit('commessaCreata', salvata);
      res.status(201).json(salvata);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante la creazione della commessa' });
    }
  });

  // ✅ 2. Ottieni tutte le commesse
  router.get('/', async (req, res) => {
    try {
      const commesse = await Commessa.find();
      res.status(200).json(commesse);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante il recupero delle commesse' });
    }
  });

  // ✅ 3. Ottieni una commessa specifica
  router.get('/:id', async (req, res) => {
    try {
      const commessa = await Commessa.findById(req.params.id);
      if (!commessa) return res.status(404).json({ error: 'Commessa non trovata' });
      res.status(200).json(commessa);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante il recupero della commessa' });
    }
  });

  // ✅ 4. Modifica una commessa
  router.put('/:id', async (req, res) => {
    try {
      const aggiornata = await Commessa.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ error: 'Commessa non trovata' });

      io.emit('commessaAggiornata', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della commessa' });
    }
  });

  // ✅ 5. Elimina una commessa
  router.delete('/:id', async (req, res) => {
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
    try {
      const attivita = await Activity.find({ commessaId: req.params.id })
        .populate('operai')
        .populate('mezzi')
        .populate('attrezzi'); // se previsto
      res.status(200).json(attivita);
    } catch (err) {
      res.status(500).json({ error: 'Errore durante il recupero delle attività della commessa' });
    }
  });

  return router;
};
