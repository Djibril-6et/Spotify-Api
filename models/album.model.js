const mongoose = require('mongoose');

const albumSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
  },
  tracks: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Track',
  },
  artist: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Artist',
  },
});

module.exports = mongoose.model('Album', albumSchema);
