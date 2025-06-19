import express from 'express';
import authenticateToken from '../middleware/auth.js';
import Commessa from '../models/Commessa.js';

const commesseRoutes = (io) => {
  const router = express.Router();

  // GET tutte le commesse (nessun filtro)
  router.get('/', authenticateToken, async (req, res, next) => {
    try {
      const commesse = await Commessa.find();
      res.json(commesse);
    } catch (error) {
      console.error('Errore GET /commesse:', error);
      next(error);
    }
  });

  // POST crea nuova commessa (nessun campo createdBy)
  router.post('/', authenticateToken, async (req, res, next) => {
    try {
      const nuovaCommessa = new Commessa({
        ...req.body,
      });

      await nuovaCommessa.save();
      io.emit('new_commessa', nuovaCommessa);

      res.status(201).json({ message: 'Commessa salvata con successo', commessa: nuovaCommessa });
    } catch (error) {
      console.error('Errore nel salvataggio della commessa:', error);
      next(error);
    }
  });

  // PUT aggiorna commessa senza controlli su createdBy
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { name, workers, machines, activities, startDate, endDate } = req.body;

    const commessa = await Commessa.findById(req.params.id);
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Il campo 'name' non può essere vuoto" });
      }
      commessa.name = name.trim();
    }

    if (workers !== undefined) commessa.workers = Array.isArray(workers) ? workers : [];
    if (machines !== undefined) commessa.machines = Array.isArray(machines) ? machines : [];
    if (activities !== undefined) commessa.activities = Array.isArray(activities) ? activities : [];

    if (startDate !== undefined) {
      commessa.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      commessa.endDate = endDate ? new Date(endDate) : null;
    }

    await commessa.save();
    io.emit('update_commessa', commessa);

    res.json(commessa);
  } catch (error) {
    console.error('Errore PUT /commesse/:id:', error);
    next(error);
  }
});


  // DELETE commessa senza controlli su createdBy
 router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Commessa.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    res.status(200).json({ message: 'Commessa eliminata con successo' });
  } catch (error) {
    console.error('Errore DELETE /commesse/:id:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});



  // Middleware gestione errori
  router.use((err, req, res, next) => {
    console.error('Errore interno del server:', err);
    res.status(500).json({ message: 'Errore interno del server', error: err.message });
  });

  return router;
};

export default commesseRoutes;
