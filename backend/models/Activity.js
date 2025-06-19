const mongoose = require('mongoose');

const AttivitaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
});

module.exports = mongoose.model('Attivita', AttivitaSchema);
