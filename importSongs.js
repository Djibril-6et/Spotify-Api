const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");
const mongoose = require("mongoose");

require("dotenv").config();

const mongoUrl = "mongodb://localhost:27017";
const dbName = "nomDeVotreBase";

const directoryPath = "../../Uploads";

// Définir le schéma Mongoose pour l'artiste
const ArtistSchema = new mongoose.Schema({
  name: String,
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
});

const Artist = mongoose.model("Artist", ArtistSchema);

// Définir le schéma Mongoose pour l'album
const AlbumSchema = new mongoose.Schema({
  title: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  cover: String,
});

const Album = mongoose.model("Album", AlbumSchema);

// Définir le schéma Mongoose pour la piste
const TrackSchema = new mongoose.Schema({
  title: String,
  duration: String,
  cover: String,
});

const Track = mongoose.model("Track", TrackSchema);

// Connexion à MongoDB avec Mongoose
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Successfully connect to database");

    // Appel de la fonction pour traiter le dossier
    processDirectory().then(() => {
      // Fermer la connexion à la base de données après avoir traité tous les fichiers
      mongoose.connection.close();
    });
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

// Fonction pour parcourir le dossier et extraire les métadonnées
const processDirectory = async () => {
  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      if (path.extname(filePath).toLowerCase() === ".mp3") {
        try {
          const metadata = await mm.parseFile(filePath);

          const coverData =
            metadata.common && metadata.common.picture
              ? metadata.common.picture[0].data
              : null;

          const artistInstance = await Artist.findOneAndUpdate(
            { name: metadata.common.artist },
            { $setOnInsert: { name: metadata.common.artist } },
            { upsert: true, new: true }
          );

          const albumInstance = await Album.findOneAndUpdate(
            { title: metadata.common.album },
            {
              $setOnInsert: {
                title: metadata.common.album,
                cover: coverData
                  ? `data:image/jpeg;base64,${coverData.toString("base64")}`
                  : null,
              },
            },
            { upsert: true, new: true }
          );

          // Vérifier si la piste existe déjà
          const existingTrack = await Track.findOne({
            title: metadata.common.title,
          });

          if (!existingTrack) {
            const trackInstance = new Track({
              title: metadata.common.title,
              duration: metadata.format.duration,
              cover: coverData
                ? `data:image/jpeg;base64,${coverData.toString("base64")}`
                : null,
            });

            await trackInstance.save();

            await Album.findOneAndUpdate(
              { _id: albumInstance._id },
              { $push: { tracks: trackInstance._id } },
              { new: true }
            );

            await Artist.findOneAndUpdate(
              { _id: artistInstance._id },
              {
                $addToSet: {
                  albums: albumInstance._id,
                  tracks: trackInstance._id,
                },
              },
              { new: true }
            );

          } else {
            console.log("Skipping existing track:", metadata.common.title);
          }
        } catch (error) {
          console.error("Error parsing file:", error);
        }
      } else {
        console.log("Skipping non-MP3 file:", file);
      }
    }
  } catch (error) {
    console.error("Error processing directory:", error);
  }
};

