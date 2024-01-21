const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/track.controller');
const AddTrackBackOffice = require('../Functions/AddFileToBase');
const AddTrackAWS = require('../Functions/AddFileToAWS');

router.get('/', TrackController.getTrack);
router.get('/:id', TrackController.getOneTrack);
router.get('/name/:title', TrackController.getOneTrackByName);
router.get(
  '/add/:title/:duration/:file/:album/:artist',
  AddTrackBackOffice.addTrackToBase,
);
router.post('/post-aws', AddTrackAWS.processUploadedTrack);
router.post('/new-track', TrackController.createTrack);
router.put('/update/:id', TrackController.updateTrack);
router.delete('/delete/:id', TrackController.deleteTrack);

module.exports = router;
