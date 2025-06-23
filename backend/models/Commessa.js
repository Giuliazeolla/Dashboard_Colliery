const mongoose = require('mongoose');

const commessaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID personalizzato
  nome: { type: String, required: true }
});

module.exports = mongoose.model('Commessa', commessaSchema);
