const mongoose = require('mongoose');

const attrezzoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  attivita: { type: mongoose.Schema.Types.ObjectId, ref: 'Attivita' }
});

module.exports = mongoose.model('Attrezzo', attrezzoSchema);