const mongoose = require('mongoose');

const commessaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID personalizzato
  nome: { type: String, required: true },
  localita: { type: String, required: true },
  coordinate: {
    type: String,
    validate: {
      validator: function (val) {
        const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
        const urlRegex = /^https?:\/\/(www\.)?(google\.(com|it)|earth\.google\.com)\/.+/;
        return coordRegex.test(val) || urlRegex.test(val);
      },
      message: "Inserisci coordinate valide (es: '41.8902,12.4922') o un link Google valido."
    }
  },
  numeroPali: { type: Number, required: true, min: 0 },
  numeroStrutture: { type: Number, required: true, min: 0 },
  numeroModuli: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Commessa', commessaSchema);
