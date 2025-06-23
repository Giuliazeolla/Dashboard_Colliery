const express = require('express');
const router = express.Router();
const Commessa = require('../models/Commessa');

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
  const commessa = new Commessa({ nome: req.body.nome });
  try {
    const nuovaCommessa = await commessa.save();
    res.status(201).json(nuovaCommessa);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT modifica commessa
router.put('/:id', async (req, res) => {
  try {
    const commessa = await Commessa.findById(req.params.id);
    if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

    if (req.body.nome) commessa.nome = req.body.nome;
    const aggiornata = await commessa.save();
    res.json(aggiornata);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE commessa
router.delete('/:id', async (req, res) => {
  try {
    const commessa = await Commessa.findById(req.params.id);
    if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });
    await commessa.remove();
    res.json({ message: 'Commessa eliminata' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
