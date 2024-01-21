const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const musicMetadata = require('music-metadata-browser');
dotenv.config();

const Track = require('../models/track.model');
const Album = require('../models/album.model');
const Artist = require('../models/artist.model');

const serverBaseURL = 'https://tracksbucket.s3.eu-west-3.amazonaws.com';

// if (mongoose.models && mongoose.models.Artist) {
//   // Model already defined
//   Artist = mongoose.models.Artist;
//   Album = mongoose.models.Album;
//   Track = mongoose.models.Track;
// } else {
//   const ArtistSchema = new mongoose.Schema({
//     name: String,
//     albums: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}],
//     tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
//   });

//   const Artist = mongoose.model('Artist', ArtistSchema);

//   const AlbumSchema = new mongoose.Schema({
//     title: String,
//     artist: {type: mongoose.Schema.Types.ObjectId, ref: 'Artist'},
//     cover: String,
//     tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
//   });

//   const Album = mongoose.model('Album', AlbumSchema);

//   const TrackSchema = new mongoose.Schema({
//     title: String,
//     duration: String,
//     url: String,
//     cover: String, // Nouveau champ ajouté
//     album: {type: mongoose.Schema.Types.ObjectId, ref: 'Album'},
//     artist: {type: mongoose.Schema.Types.ObjectId, ref: 'Artist'},
//   });

//   const Track = mongoose.model('Track', TrackSchema);
// }

// mongoose
//   .connect(
//     `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
//   )
//   .then(async () => {
//     console.log('Successfully connect to database');

//     await addTrackToBase(
//       req.params.title,
//       req.params.duration,
//       req.params.album,
//       req.params.artist,
//     );

//     mongoose.connection.close();
//   })
//   .catch(err => {
//     console.error('Error connecting to database:', err);
//   });

exports.addTrackToBase = async (req, res) => {
  try {
    const serverFileURL = `${serverBaseURL}/${encodeURIComponent(
      req.params.album,
    ).replace(/%2F/g, '/')}/${encodeURIComponent(req.params.file).replace(
      /%2F/g,
      '/',
    )}`;

    const artistInstance = await Artist.findOneAndUpdate(
      {name: req.params.artist},
      {
        $setOnInsert: {name: req.params.artist},
      },
      {upsert: true, new: true},
    );

    const albumInstance = await Album.findOneAndUpdate(
      {title: req.params.album, artist: artistInstance._id},
      {
        $setOnInsert: {
          title: req.params.album,
          artist: artistInstance._id,
          cover: `${serverBaseURL}/${encodeURIComponent(
            req.params.album,
          )}/cover.jpg`,
        },
      },
      {upsert: true, new: true},
    );

    const trackInstance = new Track({
      title: req.params.title,
      duration: req.params.duration,
      url: serverFileURL,
      cover: albumInstance.cover,
      album: albumInstance._id,
      artist: artistInstance._id,
    });

    await trackInstance.save();

    await Album.findOneAndUpdate(
      {_id: albumInstance._id},
      {$push: {tracks: trackInstance._id}},
      {new: true},
    );

    await Artist.findOneAndUpdate(
      {_id: artistInstance._id},
      {
        $addToSet: {
          albums: albumInstance._id,
          tracks: trackInstance._id,
        },
      },
      {new: true},
    );

    console.log('Metadata inserted:', req.params.title);
    res.send({
      message: 'Track inserted successfully',
    });
  } catch (error) {
    console.error('Error processing track:', error);
    res.status(500).send({
      message: 'Error inserting track',
      error: err.message,
    });
  }
};

// module.exports = {
//   addTrackToBase: async (req, res) => {
//     // This is where your existing code for handling the API request/response would go
//   },
// };
