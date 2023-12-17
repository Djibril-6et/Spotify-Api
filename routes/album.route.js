const express = require('express');
const router = express.Router();
const AlbumController = require('../controllers/album.controller');

router.get('/', AlbumController.getAlbum);
router.get('/:id', AlbumController.getOneAlbum);
router.post('/new-artist', AlbumController.createAlbum);
router.put('/update/:id', AlbumController.updateAlbum);
router.delete('/delete/:id', AlbumController.deleteAlbum);

module.exports = router;
