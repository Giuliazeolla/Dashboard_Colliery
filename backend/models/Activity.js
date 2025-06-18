const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model('Activity', activitySchema);