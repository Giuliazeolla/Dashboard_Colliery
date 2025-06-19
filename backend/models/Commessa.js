import mongoose from 'mongoose';

const commessaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  workers: {
    type: [String],
    default: [],
  },
  activities: {
    type: [String],
    default: [],
  },
  machines: {
    type: [String],
    default: [],
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
}, {
  timestamps: true,
});

const Commessa = mongoose.model('Commessa', commessaSchema);

export default Commessa;
