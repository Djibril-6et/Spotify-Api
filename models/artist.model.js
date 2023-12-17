const mongoose = require('mongoose');

const artistSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  albums: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Album',
  },
  tracks: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Track',
  },
});

module.exports = mongoose.model('Artist', artistSchema);
