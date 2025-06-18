const express = require('express');
const auth = require('../middleware/auth');
const Commessa = require('../models/Commessa');

const fixedActivities = require('../static/activities');
const workersData = require('../static/workers');
const machinesData = require('../static/machines');

module.exports = (io) => {
  const router = express.Router();

  // Crea una nuova commessa
  router.post('/', auth, async (req, res) => {
    try {
      const { name, workers, machines, location } = req.body;

      const activities = fixedActivities.map((_, index) => ({
        sequenceIndex: index + 1,
        startDate: null,
        endDate: null,
        workers: [],
        machines: [],
      }));

      const newCommessa = new Commessa({
        name,
        createdBy: req.user._id,
        workers,
        machines,
        location,
        activities,
      });

      await newCommessa.save();
      io.emit('new_commessa', newCommessa); // Emit globale

      return res.status(201).json(newCommessa);
    } catch (error) {
      console.error('Errore in POST /api/commesse:', error);
      return res.status(500).json({ message: 'Errore nella creazione della commessa', error: error.message });
    }
  });

  // Ottieni tutte le commesse dell’utente
  router.get('/', auth, async (req, res) => {
    try {
      const commesse = await Commessa.find({ createdBy: req.user._id });
      return res.json(commesse);
    } catch (error) {
      console.error('Errore in GET /api/commesse:', error);
      return res.status(500).json({ message: 'Errore nel recupero delle commesse', error: error.message });
    }
  });

  // Aggiorna una commessa
  router.put('/:id', auth, async (req, res) => {
    try {
      const { name, workers, machines, activities, location } = req.body;
      const commessa = await Commessa.findById(req.params.id);

      if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

      if (name !== undefined) commessa.name = name;
      if (workers !== undefined) commessa.workers = workers;
      if (machines !== undefined) commessa.machines = machines;
      if (location !== undefined) commessa.location = location;
      if (activities !== undefined) commessa.activities = activities;

      const updated = await commessa.save();
      io.emit('update_commessa', updated);

      return res.json(updated);
    } catch (error) {
      console.error('Errore in PUT /api/commesse/:id:', error);
      return res.status(500).json({ message: 'Errore nell\'aggiornamento della commessa', error: error.message });
    }
  });

  // Elimina una commessa
  router.delete('/:id', auth, async (req, res) => {
    try {
      const commessa = await Commessa.findById(req.params.id);
      if (!commessa) return res.status(404).json({ message: 'Commessa non trovata' });

      await commessa.remove();
      io.emit('delete_commessa', { id: req.params.id });

      return res.json({ message: 'Commessa eliminata' });
    } catch (error) {
      console.error('Errore in DELETE /api/commesse/:id:', error);
      return res.status(500).json({ message: 'Errore nell\'eliminazione della commessa', error: error.message });
    }
  });

  return router;
};
