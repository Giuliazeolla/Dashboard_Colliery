const mongoose = require('mongoose');

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

const assegnazioneSchema = new mongoose.Schema({
  commessaId: { type: String, ref: 'Commessa', required: true },
  attivita: { type: String, enum: ATTIVITA, required: true },
  dataInizio: { type: Date, required: true },
  dataFine: { type: Date, required: true },
  operai: { type: [String], default: [] },
  mezzi: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Assegnazione', assegnazioneSchema);
