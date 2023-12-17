const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const mongoose = require('mongoose');

require('dotenv').config();

// Mettez à jour la variable serverBaseURL avec le nouvel URL S3
const serverBaseURL = 'https://tracksbucket.s3.eu-west-3.amazonaws.com';

const directoryPath = '../../sonzak/uploads';

// Définir le schéma Mongoose pour l'artiste
const ArtistSchema = new mongoose.Schema({
  name: String,
  albums: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}],
  tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
});

const Artist = mongoose.model('Artist', ArtistSchema);

// Définir le schéma Mongoose pour l'album
const AlbumSchema = new mongoose.Schema({
  title: String,
  tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}],
});

const Album = mongoose.model('Album', AlbumSchema);

// Définir le schéma Mongoose pour la piste
const TrackSchema = new mongoose.Schema({
  title: String,
  duration: String,
  url: String,
});

const Track = mongoose.model('Track', TrackSchema);

// Connexion à MongoDB avec Mongoose
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
  )
  .then(() => {
    console.log('Successfully connect to database');

    // Appel de la fonction pour traiter le dossier
    processDirectory(directoryPath).then(() => {
      // Fermer la connexion à la base de données après avoir traité tous les fichiers
      mongoose.connection.close();
    });
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

// Fonction récursive pour parcourir le dossier et extraire les métadonnées
const processDirectory = async currentPath => {
  try {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);

      // Mettez à jour le serveurFileURL avec le nouveau format
      const serverFileURL = `${serverBaseURL}/${encodeURIComponent(
        file,
      ).replace(/%2F/g, '/')}`;

      if (fs.statSync(filePath).isDirectory()) {
        // Si c'est un dossier, appeler la fonction récursivement
        await processDirectory(filePath);
      } else if (path.extname(filePath).toLowerCase() === '.m4a') {
        try {
          const metadata = await mm.parseFile(filePath);

          const artistInstance = await Artist.findOneAndUpdate(
            {name: metadata.common.artist},
            {$setOnInsert: {name: metadata.common.artist}},
            {upsert: true, new: true},
          );

          const albumInstance = await Album.findOneAndUpdate(
            {title: metadata.common.album},
            {},
            {upsert: true, new: true},
          );

          // Vérifier si la piste existe déjà
          const existingTrack = await Track.findOne({
            title: metadata.common.title,
          });

          if (!existingTrack) {
            const trackInstance = new Track({
              title: metadata.common.title,
              duration: metadata.format.duration,
              url: serverFileURL,
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
          } else {
            console.log('Skipping existing track:', metadata.common.title);
          }
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
