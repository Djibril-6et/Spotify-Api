const Track = require('../models/track.model');

//Get all tracks
exports.getTrack = (req, res) => {
  Track.find()
    .then(tracks => res.status(200).send(tracks))
    .catch(err => res.status(400).send(err));
};

//Get one track
exports.getOneTrack = (req, res) => {
  Track.findById(req.params.id)
    .then(track => res.status(200).send(track))
    .catch(err => res.status(400).send(err));
};

//Create new track
exports.createTrack = (req, res) => {
  Track.create(req.body)
    .then(track => {
      console.log(track._id);
      res.status(200).send(track);
    })
    .catch(err => res.status(400).send(err));
};

//Modify track
exports.updateTrack = (req, res) => {
  Track.findByIdAndUpdate(req.params.id, req.body, {new: true})
    .then(track => {
      if (!track) {
        return res.status(404).send({
          message: 'Track not found',
        });
      }
      res.send(track);
    })
    .catch(err => {
      res.status(400).send(err);
    });
};

//Delete one track
exports.deleteTrack = (req, res) => {
  Track.findByIdAndDelete(req.params.id)
    .then(track => {
      if (!track) {
        return res.status(404).send({
          message: 'Track not found',
        });
      }
      res.send({
        message: 'Track deleted successfully',
      });
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error deleting track',
        error: err.message,
      });
    });
};

// // Get the number of tracks
// exports.getTrackCount = (req, res) => {
//   Track.estimatedDocumentCount()
//     .then(count => res.status(200).json({count}))
//     .catch(err => {
//       console.error(err); // Affichez l'erreur complète dans la console
//       res.status(400).send(err);
//     });
// };
