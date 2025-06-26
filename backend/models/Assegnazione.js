const mongoose = require('mongoose');
const { STATIC_ATTIVITA } = require('../staticsData');

const assegnazioneSchema = new mongoose.Schema({
  commessaId: { type: String, ref: 'Commessa', required: true },
  attivita: { type: String, enum: STATIC_ATTIVITA, required: true },
  dataInizio: { type: Date, required: true },
  dataFine: { type: Date, required: true },
  operai: { type: Array, default: [] },
  mezzi: { type: Array, default: [] },
  attrezzi: { type: Array, default: [] }

}, { timestamps: true });

module.exports = mongoose.model('Assegnazione', assegnazioneSchema);
