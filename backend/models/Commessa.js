const mongoose = require('mongoose');

const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/; // decimale
const dmsRegex = /^(\d{1,3})°\d{1,2}'\d{1,2}"[NS]\s+(\d{1,3})°\d{1,2}'\d{1,2}"[EW]$/; // gradi, minuti, secondi
const urlRegex = /^https?:\/\/(www\.)?(google\.(com|it)|earth\.google\.com)\/.+/;

const commessaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  localita: { type: String, required: true },
  coordinate: {
    type: String,
    validate: {
      validator: function (val) {
        return coordRegex.test(val) || dmsRegex.test(val) || urlRegex.test(val);
      },
      message:
        "Inserisci coordinate valide: decimali ('41.8902,12.4922'), DMS ('41°07'03\"N 14°46'51\"E') o un link Google valido.",
    },
  },
  numeroPali: { type: Number, required: true, min: 0 },
  numeroStrutture: { type: Number, required: true, min: 0 },
  numeroModuli: { type: Number, required: true, min: 0 },

  dataInizio: { type: Date, required: true },
  dataFine: { type: Date, required: true },

  attivita: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attivita' }],
}, { timestamps: true });

module.exports = mongoose.model('Commessa', commessaSchema);
