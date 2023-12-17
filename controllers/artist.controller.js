const Artist = require('../models/artist.model');

//Get all artists
exports.getArtist = (req, res) => {
  Artist.find()
    .then(artists => res.status(200).send(artists))
    .catch(err => res.status(400).send(err));
};

//Get one artist
exports.getOneArtist = (req, res) => {
  Artist.findById(req.params.id)
    .then(artist => res.status(200).send(artist))
    .catch(err => res.status(400).send(err));
};

//Create new artist
exports.createArtist = (req, res) => {
  Artist.create(req.body)
    .then(artist => {
      console.log(artist._id);
      res.status(200).send(artist);
    })
    .catch(err => res.status(400).send(err));
};

//Modify artist
exports.updateArtist = (req, res) => {
  Artist.findByIdAndUpdate(req.params.id, req.body, {new: true})
    .then(artist => {
      if (!artist) {
        return res.status(404).send({
          message: 'Artist not found',
        });
      }
      res.send(artist);
    })
    .catch(err => {
      res.status(400).send(err);
    });
};

//Delete one artist
exports.deleteArtist = (req, res) => {
  Artist.findByIdAndRemove(req.params.id)
    .then(artist => {
      if (!artist) {
        return res.status(404).send({
          message: 'Artist not found',
        });
      }
      res.send({
        message: 'Artist deleted successfully',
      });
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error deleting artist',
        error: err.message,
      });
    });
};
