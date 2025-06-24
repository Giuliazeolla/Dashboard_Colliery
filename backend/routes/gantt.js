// server/routes/gantt.js
const express = require('express');
const router = express.Router();
const Commesse = require('../models/Commessa');
const Assegnazioni = require('../models/Assegnazione');

router.get('/gantt-data', async (req, res) => {
  try {
    const commesse = await Commesse.find();

    const data = await Promise.all(commesse.map(async (commessa) => {
      const activities = await Assegnazioni.find({ commessaId: commessa._id });

      if (activities.length === 0) {
        return {
          id: commessa._id.toString(),
          name: commessa.name,
          start: commessa.startDate ? commessa.startDate.toISOString().substring(0,10) : new Date().toISOString().substring(0,10),
          end: commessa.endDate ? commessa.endDate.toISOString().substring(0,10) : new Date().toISOString().substring(0,10),
          color: '#4CAF50',
          type: 'commessa',
          activities: []
        };
      }

      const startDates = activities.map(a => a.startDate);
      const endDates = activities.map(a => a.endDate);

      const start = new Date(Math.min(...startDates));
      const end = new Date(Math.max(...endDates));

      return {
        id: commessa._id.toString(),
        name: commessa.name,
        start: start.toISOString().substring(0,10),
        end: end.toISOString().substring(0,10),
        color: '#4CAF50',
        type: 'commessa',
        activities: activities.map(a => ({
          id: a._id.toString(),
          name: a.name,
          start: a.startDate.toISOString().substring(0,10),
          end: a.endDate.toISOString().substring(0,10),
          color: '#81C784',
          details: a.description || '',
          type: 'activity',
        }))
      }
    }));

    res.json(data);

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
