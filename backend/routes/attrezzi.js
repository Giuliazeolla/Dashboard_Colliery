const express = require('express');
const router = express.Router();
const Attrezzi = require('../models/Attrezzi');


router.get('/', async (req, res) => {
  try {
    const attrezzi = await attrezzi.find();
    res.json(attrezzi);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero attrezzi' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedAttrezzi = await Attrezzi.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAttrezzi) return res.status(404).json({ message: 'Attrezzo non trovato' });
    res.json(updatedAttrezzi);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'attrezzo' });
  }
});


module.exports = router;
