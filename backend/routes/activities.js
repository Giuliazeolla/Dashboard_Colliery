const express = require('express');
const Activity = require('../models/Activity');
const Commessa = require('../models/Commessa');

const router = express.Router();

// GET tutte le attività
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('commessaId')
      .populate('operai')
      .populate('mezzi');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle attività' });
  }
});



// GET attività per commessa

router.get('/commessa/:id', async (req, res) => {
  try {
    const commessa = await Commessa.findOne({ id: req.params.id });
    if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

    const activities = await Activity.find({ commessaId: commessa._id })
      .populate('commessaId')
      .populate('operai')
      .populate('mezzi');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle attività della commessa' });
  }
});


// POST nuova attività
router.post('/', async (req, res) => {
  const { nome, descrizione, dataInizio, dataFine, commessaId, operai, mezzi } = req.body;

  const nuovaAttivita = new Activity({ nome, descrizione, dataInizio, dataFine, commessaId, operai, mezzi });

  try {
    const salvata = await nuovaAttivita.save();
    res.status(201).json(salvata);
  } catch (err) {
    res.status(400).json({ message: 'Errore nella creazione dell\'attività', error: err.message });
  }
});

// PUT modifica attività
router.put('/:id', async (req, res) => {
  try {
    const aggiornata = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!aggiornata) return res.status(404).json({ message: 'Attività non trovata' });
    res.json(aggiornata);
  } catch (err) {
    res.status(400).json({ message: 'Errore nella modifica dell\'attività', error: err.message });
  }
});

// DELETE attività
router.delete('/:id', async (req, res) => {
  try {
    const eliminata = await Activity.findByIdAndDelete(req.params.id);
    if (!eliminata) return res.status(404).json({ message: 'Attività non trovata' });
    res.json({ message: 'Attività eliminata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore nella cancellazione', error: err.message });
  }
});

module.exports = router;
