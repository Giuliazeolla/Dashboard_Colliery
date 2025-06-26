const express = require('express');
const router = express.Router();
const Assegnazione = require('../models/Assegnazione');
const { STATIC_ATTIVITA } = require('../staticsData');

router.get('/', async (req, res) => {
  try {
    console.log("GET /assegnazioni chiamato");
    const assegnazioni = await Assegnazione.find();
    console.log("Assegnazioni trovate:", assegnazioni);
    res.json(assegnazioni);
  } catch (error) {
    console.error("Errore nel recupero:", error);
    res.status(500).json({ message: "Errore nel recupero assegnazioni" });
  }
});


router.post('/', async (req, res) => {
  console.log("Richiesta ricevuta:", req.body);
  const { commessaId, attivita, dataInizio, dataFine, operai, mezzi, attrezzi } = req.body;

  if (!commessaId || !attivita || !dataInizio || !dataFine) {
    return res.status(400).json({ message: "Campi obbligatori mancanti" });
  }

  if (!STATIC_ATTIVITA.includes(attivita)) {
    return res.status(400).json({ message: "Attività non valida" });
  }

  const inizio = new Date(dataInizio);
  const fine = new Date(dataFine);
  if (isNaN(inizio) || isNaN(fine)) {
    return res.status(400).json({ message: "Date non valide" });
  }
  if (fine < inizio) {
    return res.status(400).json({ message: "La data di fine deve essere uguale o successiva a quella di inizio" });
  }

  if ((!Array.isArray(operai) || operai.length === 0) && (!Array.isArray(mezzi) || mezzi.length === 0)) {
    return res.status(400).json({ message: "Deve essere presente almeno un operaio o un mezzo" });
  }

  try {
    const nuovaAssegnazione = new Assegnazione({
      commessaId,
      attivita,
      dataInizio: inizio,
      dataFine: fine,
      operai: Array.isArray(operai) ? operai : [],
      mezzi: Array.isArray(mezzi) ? mezzi : [],
      attrezzi: Array.isArray(attrezzi) ? attrezzi : []
    });

    const saved = await nuovaAssegnazione.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Errore salvataggio assegnazione:", error);
    res.status(500).json({ message: "Errore nel salvataggio assegnazione", error: error.message });
  }
});

// --- ROTTA DELETE per eliminare un'assegnazione ---
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Assegnazione.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Assegnazione non trovata' });
    res.json({ message: 'Assegnazione eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel server durante eliminazione', error: error.message });
  }
});


// DELETE tutte le assegnazioni collegate a una commessa
router.delete('/commessa/:commessaId', async (req, res) => {
  try {
    const { commessaId } = req.params;

    // Elimina tutte le assegnazioni che hanno commessaId uguale a questo
    const result = await Assegnazione.deleteMany({ commessaId });

    res.json({ message: `Eliminate ${result.deletedCount} assegnazioni per la commessa ${commessaId}` });
  } catch (error) {
    res.status(500).json({ message: "Errore nell'eliminazione delle assegnazioni", error: error.message });
  }
});


// --- ROTTA PUT per aggiornare un'assegnazione ---
router.put('/:id', async (req, res) => {
  const { commessaId, dataInizio, dataFine, operai, mezzi, attrezzi } = req.body;

  if (!commessaId || !dataInizio || !dataFine || !operai || !mezzi || !attrezzi) {
    return res.status(400).json({ message: "Campi obbligatori mancanti" });
  }

  if (!STATIC_ATTIVITA.includes(attivita)) {
    return res.status(400).json({ message: "Attività non valida" });
  }

  const inizio = new Date(dataInizio);
  const fine = new Date(dataFine);
  if (isNaN(inizio) || isNaN(fine)) {
    return res.status(400).json({ message: "Date non valide" });
  }
  if (fine < inizio) {
    return res.status(400).json({ message: "La data di fine deve essere uguale o successiva a quella di inizio" });
  }

  if ((!Array.isArray(operai) || operai.length === 0) && (!Array.isArray(mezzi) || mezzi.length === 0) && (!Array.isArray(attrezzi) || attrezzi.length === 0)) {
    return res.status(400).json({ message: "Deve essere presente almeno un operaio o un mezzo" });
  }

  try {
    const updated = await Assegnazione.findByIdAndUpdate(
      req.params.id,
      {
        commessaId,
        dataInizio: inizio,
        dataFine: fine,
        operai: Array.isArray(operai) ? operai : [],
        mezzi: Array.isArray(mezzi) ? mezzi : [],
        attrezzi: Array.isArray(attrezzi) ? attrezzi : []
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Assegnazione non trovata" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Errore nel server durante aggiornamento", error: error.message });
  }
});

module.exports = router;
