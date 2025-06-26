const mongoose = require('mongoose');

const attrezziSchema = new mongoose.Schema({
  nome: { type: [String], required: true }
});

module.exports = mongoose.model('Attrezzi', attrezziSchema);