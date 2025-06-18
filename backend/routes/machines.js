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

module.exports = router;
