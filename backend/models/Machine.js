const mongoose = require('mongoose');

const MezzoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
});

module.exports = mongoose.model('Mezzo', MezzoSchema);
