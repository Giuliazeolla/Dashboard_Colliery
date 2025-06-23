const express = require('express');
const Assegnazione = require('../models/Assegnazione');

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.commessaId) filter.commessaId = req.query.commessaId;
  try {
    const assegnazioni = await Assegnazione.find(filter)
      .populate('commessaId')
      .populate('operai')
      .populate('mezzi');
    res.json(assegnazioni);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { commessaId, attivita, dataInizio, dataFine, operai, mezzi } = req.body;
  const assegnazione = new Assegnazione({ commessaId, attivita, dataInizio, dataFine, operai, mezzi });
  try {
    const nuova = await assegnazione.save();
    res.status(201).json(nuova);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const assegnazione = await Assegnazione.findById(req.params.id);
    if (!assegnazione) return res.status(404).json({ message: 'Assegnazione non trovata' });

    ['commessaId', 'attivita', 'dataInizio', 'dataFine', 'operai', 'mezzi'].forEach(field => {
      if (req.body[field] !== undefined) assegnazione[field] = req.body[field];
    });

    const aggiornata = await assegnazione.save();
    res.json(aggiornata);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const assegnazione = await Assegnazione.findById(req.params.id);
    if (!assegnazione) return res.status(404).json({ message: 'Assegnazione non trovata' });
    await assegnazione.remove();
    res.json({ message: 'Assegnazione eliminata' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
