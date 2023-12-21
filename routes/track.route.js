const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/track.controller');

router.get('/', TrackController.getTrack);
router.get('/:id', TrackController.getOneTrack);
// router.get('/metadata/:fileName', TrackController.getTrackMetadata);
// router.get('/total', TrackController.getTrackCount);
router.post('/new-track', TrackController.createTrack);
router.put('/update/:id', TrackController.updateTrack);
router.delete('/delete/:id', TrackController.deleteTrack);

module.exports = router;
