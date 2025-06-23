import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descrizione: String,
  dataInizio: { type: Date, required: true },
  dataFine: { type: Date, required: true },
  commessaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commessa', required: true },
  operai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  mezzi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],
});

export default mongoose.model('Activity', activitySchema);
