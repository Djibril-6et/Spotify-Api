const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");
const mongoose = require("mongoose");

require("dotenv").config();

const directoryPath = "../../Uploads";

// Define Artist Schema
const ArtistSchema = new mongoose.Schema({
  name: String,
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
});

const Artist = mongoose.model("Artist", ArtistSchema);

//  Define Album Schema
const AlbumSchema = new mongoose.Schema({
  title: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  cover: String,
});

const Album = mongoose.model("Album", AlbumSchema);

//  Define Track Schema
const TrackSchema = new mongoose.Schema({
  title: String,
  duration: String,
  cover: String,
  url: String,
});

const Track = mongoose.model("Track", TrackSchema);

// Connection to MongoDB with Mongoose
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Successfully connect to database");

    processDirectory().then(() => {
      mongoose.connection.close();
    });
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

const processDirectory = async () => {
  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const serverFileURL = "http://localhost:9000/music/" + file;
      const coverFileURL = "http://localhost:9000/covers/" + path.parse(file).name + ".jpg";

      if (path.extname(filePath).toLowerCase() === ".mp3") {
        try {
          const metadata = await mm.parseFile(filePath);

          const coverData = coverFileURL;

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
                cover: coverData,
              },
            },
            { upsert: true, new: true }
          );

          // Check if track already exists
          const existingTrack = await Track.findOne({
            title: metadata.common.title,
          });

          if (!existingTrack) {
            const trackInstance = new Track({
              title: metadata.common.title,
              duration: metadata.format.duration,
              cover: coverData,
              url: serverFileURL,
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
