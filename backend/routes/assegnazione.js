const express = require('express');
const router = express.Router();
const Assegnazione = require('../models/Assegnazione');

const ATTIVITA = [
  "Progettazione Esecutiva",
  "Pull-out Test",
  "Disegni Esecutivi",
  "Ordine Fornitore",
  "Consegna Pali",
  "Infissione Pali",
  "Consegna Struttura",
  "Montaggio Struttura",
  "Montaggio Moduli",
  "Collaudo"
];

router.get('/', async (req, res) => {
  try {
    const assegnazioni = await Assegnazione.find();
    res.json(assegnazioni);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero assegnazioni" });
  }
});

router.post('/', async (req, res) => {
  const { commessaId, attivita, dataInizio, dataFine, operai, mezzi } = req.body;

  if (!commessaId || !attivita || !dataInizio || !dataFine) {
    return res.status(400).json({ message: "Campi obbligatori mancanti" });
  }

  if (!ATTIVITA.includes(attivita)) {
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
      mezzi: Array.isArray(mezzi) ? mezzi : []
    });

    const saved = await nuovaAssegnazione.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Errore nel salvataggio assegnazione" });
  }
});

module.exports = router;
