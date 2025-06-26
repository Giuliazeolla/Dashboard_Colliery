const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descrizione: String,
  dataInizio: Date,
  dataFine: Date,
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa', required: true },  // singola commessa selezionata
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],    // array di operai selezionati
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],    // array di mezzi selezionati
});

module.exports = mongoose.model('Activity', activitySchema);

