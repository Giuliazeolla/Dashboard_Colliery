const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model('Machine', MachineSchema);

