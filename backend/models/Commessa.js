const mongoose = require('mongoose');

const commessaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workers: [{ type: String }],      // lista operai selezionati per questa commessa
  machines: [{ type: String }],     // lista mezzi disponibili
  location: {
    type: String,
    required: true
  },    
  activities: [{
    sequenceIndex: Number,
    startDate: Date,
    endDate: Date,
    workers: [String],               // operai assegnati a quell'attività
    machines: [String],              // mezzi assegnati a quell'attività
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commessa', commessaSchema);
