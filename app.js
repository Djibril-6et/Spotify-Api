const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

require('dotenv').config()

const app = express();
const port = process.env.PORT || 9000;

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`);
const db = mongoose.connection;

// Middleware
app.use(bodyParser.json());

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Define Mongoose schema and model
const trackSchema = new mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  filePath: String
});

const Track = mongoose.model('Track', trackSchema);

// API Routes
app.get('/tracks', async (req, res) => {
  try {
    const tracks = await Track.find();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tracks', upload.single('audio'), async (req, res) => {
  try {
    const { title, artist, album } = req.body;
    const filePath = req.file.path;

    const newTrack = new Track({ title, artist, album, filePath });
    await newTrack.save();

    res.status(201).json(newTrack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
