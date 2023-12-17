const express = require('express');
const router = express.Router();
const ArtistController = require('../controllers/artist.controller');

router.get('/', ArtistController.getArtist);
router.get('/:id', ArtistController.getOneArtist);
router.post('/new-artist', ArtistController.createArtist);
router.put('/update/:id', ArtistController.updateArtist);
router.delete('/delete/:id', ArtistController.deleteArtist);

module.exports = router;
