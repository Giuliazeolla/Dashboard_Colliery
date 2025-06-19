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

router.put('/:id', async (req, res) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedActivity) return res.status(404).json({ message: 'Attività non trovata' });
    res.json(updatedActivity);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'attività' });
  }
});

module.exports = router;

