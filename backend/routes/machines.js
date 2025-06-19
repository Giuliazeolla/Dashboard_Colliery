const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');

router.get('/', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero macchine' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMachine) return res.status(404).json({ message: 'Macchina non trovata' });
    res.json(updatedMachine);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornamento della macchina' });
  }
});


module.exports = router;
