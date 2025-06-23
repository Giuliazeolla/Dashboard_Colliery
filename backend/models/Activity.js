const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descrizione: String,
  dataInizio: Date,
  dataFine: Date,
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa' },
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],
});

module.exports = mongoose.model('Activity', activitySchema);
