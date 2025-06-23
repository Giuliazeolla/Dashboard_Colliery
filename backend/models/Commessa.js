const mongoose = require('mongoose');

const commessaSchema = new mongoose.Schema({
  nome: { type: String, required: true }
});

module.exports = mongoose.model('Commessa', commessaSchema);
