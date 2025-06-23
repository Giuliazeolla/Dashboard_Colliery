const mongoose = require('mongoose');

const operaioSchema = new mongoose.Schema({
  nome: { type: String, required: true }
});

module.exports = mongoose.model('Operaio', operaioSchema);
