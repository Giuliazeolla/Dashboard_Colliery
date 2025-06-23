const mongoose = require('mongoose');

const mezzoSchema = new mongoose.Schema({
  nome: { type: String, required: true }
});

module.exports = mongoose.model('Mezzo', mezzoSchema);
