const mongoose = require('mongoose');

const albumSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  tracks: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Track',
  },
});

module.exports = mongoose.model('Album', albumSchema);
