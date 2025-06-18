const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true }],
  machines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true }],
  activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true }],
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }); // <-- questa è la sintassi corretta

module.exports = mongoose.model('Job', jobSchema);
