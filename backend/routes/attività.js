const express = require('express');
const Activity = require('../models/Attività');
const Commessa = require('../models/Commessa');
const Operaio = require('../models/Operaio');
const Mezzo = require('../models/Mezzo');
const Attrezzo = require('../models/Attrezzo');

module.exports = function(io) {
  const router = express.Router();

  // Crea una nuova attività (deve avere commessaId)
  router.post('/', async (req, res) => {
    try {
      const { nome, commessaId } = req.body;
      if (!commessaId) return res.status(400).json({ error: 'commessaId obbligatorio' });

      // Creo attività
      const nuovaActivity = new Activity({ nome, commessaId });
      const salvata = await nuovaActivity.save();

      // Aggiungo l'id attività nella commessa
      await Commessa.findByIdAndUpdate(commessaId, { $push: { attività: salvata._id } });

      io.emit('attivitaCreata', salvata);
      res.status(201).json(salvata);
    } catch (err) {
      res.status(500).json({ error: 'Errore nella creazione attività' });
    }
  });

  // Prendi tutte le attività
  router.get('/', async (req, res) => {
    try {
      const attività = await Activity.find()
        .populate('operai')
        .populate('mezzi')
        .populate('attrezzi');
      res.status(200).json(attività);
    } catch (err) {
      res.status(500).json({ error: 'Errore nel recupero attività' });
    }
  });

  // Prendi attività per ID
  router.get('/:id', async (req, res) => {
    try {
      const attività = await Activity.findById(req.params.id)
        .populate('operai')
        .populate('mezzi')
        .populate('attrezzi');
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });
      res.status(200).json(attività);
    } catch (err) {
      res.status(500).json({ error: 'Errore nel recupero attività' });
    }
  });

  
  // Prendi tutte le attività di una commessa specifica
router.get('/commessa/:commessaId', async (req, res) => {
  try {
    const attività = await Activity.find({ commessaId: req.params.commessaId })
      .populate('operai')
      .populate('mezzi')
      .populate('attrezzi');
    res.status(200).json(attività);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero attività per commessa' });
  }
});


  // Modifica attività (nome)
  router.put('/:id', async (req, res) => {
    try {
      const aggiornata = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!aggiornata) return res.status(404).json({ error: 'Attività non trovata' });
      io.emit('attivitaAggiornata', aggiornata);
      res.status(200).json(aggiornata);
    } catch (err) {
      res.status(500).json({ error: 'Errore nell\'aggiornamento attività' });
    }
  });

  // Elimina attività e la rimuove dalla commessa
  router.delete('/:id', async (req, res) => {
    try {
      const attività = await Activity.findByIdAndDelete(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      // Rimuovo id attività da commessa
      await Commessa.findByIdAndUpdate(attività.commessaId, { $pull: { attività: attività._id } });

      io.emit('attivitaEliminata', attività._id);
      res.status(200).json({ message: 'Attività eliminata' });
    } catch (err) {
      res.status(500).json({ error: 'Errore nell\'eliminazione attività' });
    }
  });

  // --- Gestione operai, mezzi e attrezzi in attività ---

  // Aggiungi operaio a attività
  router.post('/:id/operai', async (req, res) => {
    try {
      const { nome } = req.body;
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      // Creo operaio nuovo o prendo già esistente (nome unico?)
      let operaio = await Operaio.findOne({ nome });
      if (!operaio) {
        operaio = new Operaio({ nome });
        await operaio.save();
      }

      // Associo operaio all'attività (se non già presente)
      if (!attività.operai.includes(operaio._id)) {
        attività.operai.push(operaio._id);
        await attività.save();
      }

      io.emit('operaioAggiunto', { attivitàId: attività._id, operaio });
      res.status(201).json(operaio);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiunta operaio' });
    }
  });

  // Stesso schema per mezzi
  router.post('/:id/mezzi', async (req, res) => {
    try {
      const { nome } = req.body;
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      let mezzo = await Mezzo.findOne({ nome });
      if (!mezzo) {
        mezzo = new Mezzo({ nome });
        await mezzo.save();
      }

      if (!attività.mezzi.includes(mezzo._id)) {
        attività.mezzi.push(mezzo._id);
        await attività.save();
      }

      io.emit('mezzoAggiunto', { attivitàId: attività._id, mezzo });
      res.status(201).json(mezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiunta mezzo' });
    }
  });

  // Stesso schema per attrezzi
  router.post('/:id/attrezzi', async (req, res) => {
    try {
      const { nome } = req.body;
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      let attrezzo = await Attrezzo.findOne({ nome });
      if (!attrezzo) {
        attrezzo = new Attrezzo({ nome });
        await attrezzo.save();
      }

      if (!attività.attrezzi.includes(attrezzo._id)) {
        attività.attrezzi.push(attrezzo._id);
        await attività.save();
      }

      io.emit('attrezzoAggiunto', { attivitàId: attività._id, attrezzo });
      res.status(201).json(attrezzo);
    } catch (err) {
      res.status(500).json({ error: 'Errore aggiunta attrezzo' });
    }
  });

  // Rimuovi operaio da attività
  router.delete('/:id/operai/:opId', async (req, res) => {
    try {
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      attività.operai.pull(req.params.opId);
      await attività.save();

      io.emit('operaioRimosso', { attivitàId: attività._id, operaioId: req.params.opId });
      res.status(200).json({ message: 'Operaio rimosso' });
    } catch (err) {
      res.status(500).json({ error: 'Errore rimozione operaio' });
    }
  });

  // Rimuovi mezzo da attività
  router.delete('/:id/mezzi/:mezId', async (req, res) => {
    try {
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      attività.mezzi.pull(req.params.mezId);
      await attività.save();

      io.emit('mezzoRimosso', { attivitàId: attività._id, mezzoId: req.params.mezId });
      res.status(200).json({ message: 'Mezzo rimosso' });
    } catch (err) {
      res.status(500).json({ error: 'Errore rimozione mezzo' });
    }
  });

  // Rimuovi attrezzo da attività
  router.delete('/:id/attrezzi/:attId', async (req, res) => {
    try {
      const attività = await Activity.findById(req.params.id);
      if (!attività) return res.status(404).json({ error: 'Attività non trovata' });

      attività.attrezzi.pull(req.params.attId);
      await attività.save();

      io.emit('attrezzoRimosso', { attivitàId: attività._id, attrezzoId: req.params.attId });
      res.status(200).json({ message: 'Attrezzo rimosso' });
    } catch (err) {
      res.status(500).json({ error: 'Errore rimozione attrezzo' });
    }
  });

  return router;
};
