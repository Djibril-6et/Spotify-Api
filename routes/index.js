const express = require('express');
const router = express.Router();
const artistRouter = require('./artist.route');
const albumRouter = require('./album.route');
const trackRouter = require('./track.route');

router.use('/artist', artistRouter);
router.use('/album', albumRouter);
router.use('/track', trackRouter);

module.exports = router;
