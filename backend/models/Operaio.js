const mongoose = require('mongoose');

const operaioSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  attivita: { type: mongoose.Schema.Types.ObjectId, ref: 'Attivita' }
});

module.exports = mongoose.model('Operaio', operaioSchema);
