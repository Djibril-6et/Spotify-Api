const mongoose = require('mongoose');

const trackSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Track', trackSchema);
