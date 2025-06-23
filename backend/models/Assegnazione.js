const mongoose = require('mongoose');

const ATTIVITA = [
  "Progettazione",
  "Consegna materiale",
  "Installazione",
  "Collaudo",
  "Manutenzione"
];

const assegnazioneSchema = new mongoose.Schema({
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa', required: true },
  attivita: { type: String, enum: ATTIVITA, required: true },
  dataInizio: { type: Date, required: true },
  dataFine: { type: Date, required: true },
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operaio' }],
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mezzo' }]
});

module.exports = {
  Assegnazione: mongoose.model('Assegnazione', assegnazioneSchema),
  ATTIVITA
};
