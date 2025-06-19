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

router.put('/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedWorker) return res.status(404).json({ message: 'Operaio non trovato' });
    res.json(updatedWorker);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'operaio' });
  }
});


module.exports = router;
