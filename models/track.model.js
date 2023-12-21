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
  url: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
  },
  album: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Album',
  },
  artist: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Artist',
  },
});

module.exports = mongoose.model('Track', trackSchema);
