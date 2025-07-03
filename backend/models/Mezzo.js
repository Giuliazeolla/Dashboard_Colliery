const mongoose = require('mongoose');

const mezzoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  attivita: { type: mongoose.Schema.Types.ObjectId, ref: 'Attivita' }
});

module.exports = mongoose.model('Mezzo', mezzoSchema);
