const express = require('express');
const Commessa = require('../models/Commessa');

module.exports = function(io) {
  const router = express.Router();

  // GET tutte le commesse
  router.get('/', async (req, res) => {
    try {
      const commesse = await Commessa.find();
      res.json(commesse);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST nuova commessa
  router.post('/', async (req, res) => {
    const { id, nome } = req.body;

    if (!id || !nome) {
      return res.status(400).json({ message: 'ID e nome sono obbligatori' });
    }

    const commessa = new Commessa({ id, nome });

    try {
      const nuovaCommessa = await commessa.save();

      io.emit('commessaAggiornata', { action: 'creata', commessa: nuovaCommessa });

      res.status(201).json(nuovaCommessa);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // PUT modifica commessa tramite ID personalizzato
  router.put('/:id', async (req, res) => {
    try {
      const commessa = await Commessa.findOne({ id: req.params.id });
      if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

      if (req.body.nome) commessa.nome = req.body.nome;

      const aggiornata = await commessa.save();

      io.emit('commessaAggiornata', { action: 'modificata', commessa: aggiornata });

      res.json(aggiornata);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE commessa tramite ID personalizzato
  router.delete('/:id', async (req, res) => {
    try {
      const commessa = await Commessa.findOne({ id: req.params.id });
      if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

      await commessa.deleteOne();

      io.emit('commessaAggiornata', { action: 'eliminata', id: req.params.id });

      res.json({ message: 'Commessa eliminata' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
