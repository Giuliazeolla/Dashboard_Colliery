const mongoose = require('mongoose');

const OperaioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
});

module.exports = mongoose.model('Operaio', OperaioSchema);
