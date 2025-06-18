const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model('Worker', WorkerSchema);
