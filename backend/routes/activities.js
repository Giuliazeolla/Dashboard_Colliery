const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Funzione factory per usare socket.io
module.exports = (io) => {
  // ✅ Crea una nuova attività
  router.post('/', async (req, res) => {
    try {
      const nuovaAttivita = new Activity(req.body);
      const attivitaSalvata = await nuovaAttivita.save();

      io.emit('attivitaCreata', attivitaSalvata); // socket.io

      res.status(201).json(attivitaSalvata);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // ✅ Ottieni tutte le attività
  router.get('/', async (req, res) => {
    try {
      const attivita = await Activity.find().populate('operai mezzi attrezzi commessaId');
      res.status(200).json(attivita);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ Ottieni una singola attività
  router.get('/:id', async (req, res) => {
    try {
      const attivita = await Activity.findById(req.params.id).populate('operai mezzi attrezzi commessaId');
      if (!attivita) return res.status(404).json({ message: 'Attività non trovata' });
      res.json(attivita);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ Modifica un’attività (nome, operai, mezzi, attrezzi, commessa)
  router.put('/:id', async (req, res) => {
    try {
      const aggiornata = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ message: 'Attività non trovata' });

      io.emit('attivitaAggiornata', aggiornata); // socket.io

      res.json(aggiornata);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // ✅ Elimina un’attività (dal DB)
  router.delete('/:id', async (req, res) => {
    try {
      const eliminata = await Activity.findByIdAndDelete(req.params.id);
      if (!eliminata) return res.status(404).json({ message: 'Attività non trovata' });

      io.emit('attivitaEliminata', eliminata); // socket.io

      res.json({ message: 'Attività eliminata' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ Elimina l’attività da una commessa (senza cancellarla dal sistema)
  router.put('/:id/rimuovi-commessa', async (req, res) => {
    try {
      const aggiornata = await Activity.findByIdAndUpdate(
        req.params.id,
        { $unset: { commessaId: "" } },
        { new: true }
      );
      if (!aggiornata) return res.status(404).json({ message: 'Attività non trovata' });

      io.emit('attivitaDisassociata', aggiornata); // socket.io

      res.json({ message: 'Attività disassociata dalla commessa', attivita: aggiornata });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ Associa attività a una commessa
router.put('/associa-commessa/:commessaId', async (req, res) => {
  const { commessaId } = req.params;
  const { attivitaIds } = req.body; // array di _id delle attività da collegare

  if (!Array.isArray(attivitaIds) || attivitaIds.length === 0) {
    return res.status(400).json({ message: 'Nessuna attività da associare' });
  }

  try {
    const result = await Activity.updateMany(
      { _id: { $in: attivitaIds } },
      { $set: { commessaId } }
    );

    io.emit('attivitaAssociateACommessa', { commessaId, attivitaIds }); // socket.io

    res.status(200).json({
      message: `Attività associate alla commessa ${commessaId}`,
      count: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Disassocia tutte le attività da una commessa
router.put('/disassocia-commessa/:commessaId', async (req, res) => {
  const { commessaId } = req.params;

  try {
    const result = await Activity.updateMany(
      { commessaId }, // tutte le attività legate a questa commessa
      { $unset: { commessaId: "" } } // rimuovi il campo
    );

    io.emit('attivitaDisassociateDaCommessa', { commessaId }); // socket.io

    res.status(200).json({
      message: `Tutte le attività disassociate dalla commessa ${commessaId}`,
      count: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

  return router;
};
