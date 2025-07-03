const mongoose = require('mongoose');

const attivitaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa' },
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operaio' }],
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mezzo' }],
  attrezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attrezzo' }],
});

module.exports = mongoose.model('Attivita', attivitaSchema);
