const Album = require('../models/album.model');

//Get all albums
exports.getAlbum = (req, res) => {
  Album.find()
    .then(albums => res.status(200).send(albums))
    .catch(err => res.status(400).send(err));
};

//Get one album
exports.getOneAlbum = (req, res) => {
  Album.findById(req.params.id)
    .then(album => res.status(200).send(album))
    .catch(err => res.status(400).send(err));
};

//Create new album
exports.createAlbum = (req, res) => {
  Album.create(req.body)
    .then(album => {
      console.log(album._id);
      res.status(200).send(album);
    })
    .catch(err => res.status(400).send(err));
};

//Modify album
exports.updateAlbum = (req, res) => {
  Album.findByIdAndUpdate(req.params.id, req.body, {new: true})
    .then(album => {
      if (!album) {
        return res.status(404).send({
          message: 'Album not found',
        });
      }
      res.send(album);
    })
    .catch(err => {
      res.status(400).send(err);
    });
};

//Delete one album
exports.deleteAlbum = (req, res) => {
  Album.findByIdAndDelete(req.params.id)
    .then(album => {
      if (!album) {
        return res.status(404).send({
          message: 'Album not found',
        });
      }
      res.send({
        message: 'Album deleted successfully',
      });
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error deleting album',
        error: err.message,
      });
    });
};
