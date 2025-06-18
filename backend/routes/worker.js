const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero operai' });
  }
});

module.exports = router;
