const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Track', trackSchema)
