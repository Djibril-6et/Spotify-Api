const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const mongoose = require('mongoose');

require('dotenv').config();

const serverBaseURL = 'https://tracksbucket.s3.eu-west-3.amazonaws.com';
const directoryPath = '../../sonzak/uploads';

const ArtistSchema = new mongoose.Schema({
  name: String,
  albums: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}],
  tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
});

const Artist = mongoose.model('Artist', ArtistSchema);

const AlbumSchema = new mongoose.Schema({
  title: String,
  artist: {type: mongoose.Schema.Types.ObjectId, ref: 'Artist'},
  cover: String,
  tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
});

const Album = mongoose.model('Album', AlbumSchema);

const TrackSchema = new mongoose.Schema({
  title: String,
  duration: String,
  url: String,
  cover: String, // Nouveau champ ajouté
  album: {type: mongoose.Schema.Types.ObjectId, ref: 'Album'},
  artist: {type: mongoose.Schema.Types.ObjectId, ref: 'Artist'},
});

const Track = mongoose.model('Track', TrackSchema);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
  )
  .then(async () => {
    console.log('Successfully connect to database');

    await processDirectory(directoryPath);

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

const processDirectory = async currentPath => {
  try {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const serverFileURL = `${serverBaseURL}/${encodeURIComponent(
        file,
      ).replace(/%2F/g, '/')}`;

      let trackInstance;

      if (fs.statSync(filePath).isDirectory()) {
        await processDirectory(filePath);
      } else if (path.extname(filePath).toLowerCase() === '.m4a') {
        try {
          const metadata = await mm.parseFile(filePath);

          const artistInstance = await Artist.findOneAndUpdate(
            {name: metadata.common.artist},
            {
              $setOnInsert: {name: metadata.common.artist},
            },
            {upsert: true, new: true},
          );

          const albumInstance = await Album.findOneAndUpdate(
            {title: metadata.common.album, artist: artistInstance._id},
            {
              $setOnInsert: {
                title: metadata.common.album,
                artist: artistInstance._id,
                cover: `${serverBaseURL}/${encodeURIComponent(
                  metadata.common.album,
                )}/cover.jpg`,
              },
            },
            {upsert: true, new: true},
          );

          trackInstance = new Track({
            title: metadata.common.title,
            duration: metadata.format.duration,
            url: `${serverBaseURL}/${encodeURIComponent(
              metadata.common.album,
            )}/${encodeURIComponent(file)}`,
            cover: albumInstance.cover, // Ajout du champ cover
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

          console.log('Metadata inserted:', metadata.common.title);
        } catch (error) {
          console.error('Error parsing file:', error);
        }
      } else {
        console.log('Skipping non-MP3 file:', file);
      }
    }
  } catch (error) {
    console.error('Error processing directory:', error);
  }
};
