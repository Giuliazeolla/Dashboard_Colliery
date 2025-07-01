const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa', required: true },
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],
  attrezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attrezzo' }],
});

module.exports = mongoose.model('Activity', activitySchema);
