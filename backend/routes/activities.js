const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle attività' });
  }
});

module.exports = router;
