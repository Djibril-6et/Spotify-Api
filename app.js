// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const mm = require('music-metadata');
// const recursiveReaddir = require('recursive-readdir');
// const fs = require('fs');
// const apiRouter = require('./routes');
// const mongoose = require('mongoose');
// require('dotenv').config();

// const app = express();
// const port = 9000;

// const musicFolder = path.join(__dirname, '../../sonzak/test');

// app.use('/music', express.static(musicFolder));

// app.get('/music-list', async (req, res) => {
//   try {
//     const files = await recursiveReaddir(musicFolder);
//     const music = [];

//     for (const filePath of files) {
//       if (filePath.endsWith('.mp3') || filePath.endsWith('.m4a')) {
//         const metadata = await extractMetadata(filePath);
//         const fileName = path.relative(musicFolder, filePath);

//         let coverFileName;

//         if (metadata.common.picture && metadata.common.picture.length > 0) {
//           const uniqueId = fileName.replace(/\.[^/.]+$/, '');
//           coverFileName = `cover_${uniqueId}.jpg`;

//           const coverFilePath = path.join(musicFolder, coverFileName);

//           // Vérifier si le répertoire existe, sinon le créer
//           const coverDir = path.dirname(coverFilePath);
//           if (!fs.existsSync(coverDir)) {
//             fs.mkdirSync(coverDir, {recursive: true});
//           }

//           // Sauvegarder l'image de couverture si elle n'existe pas déjà
//           if (!fs.existsSync(coverFilePath)) {
//             fs.writeFileSync(coverFilePath, metadata.common.picture[0].data);
//           }
//         } else {
//           coverFileName = 'default_cover.jpg';
//         }

//         music.push({
//           name: fileName,
//           path: `/music/${encodeURIComponent(fileName)}`,
//           artist: metadata.common.artist,
//           album: metadata.common.album,
//           cover: `/cover/${encodeURIComponent(coverFileName)}`,
//         });
//       }
//     }

//     res.json({music});
//   } catch (error) {
//     console.error('Error reading music folder', error);
//     res.status(500).send('Error reading music folder');
//   }
// });

// app.get('/music/:fileName', (req, res) => {
//   const fileName = req.params.fileName;
//   const filePath = path.join(musicFolder, fileName);

//   res.sendFile(filePath, {headers: {'Content-Type': 'audio/mpeg'}}, err => {
//     if (err) {
//       console.error('Error reading file', err);
//       res.status(err.status).end();
//     }
//   });
// });

// app.get('/cover/:coverFileName', (req, res) => {
//   const coverFileName = req.params.coverFileName;
//   const coverFilePath = path.join(musicFolder, coverFileName);

//   // Ajouter une gestion d'erreur pour les fichiers non existants
//   if (!fs.existsSync(coverFilePath)) {
//     return res.status(404).send('Cover image not found');
//   }

//   res.sendFile(
//     coverFilePath,
//     {headers: {'Content-Type': 'image/jpeg'}},
//     err => {
//       if (err) {
//         console.error('Error reading cover image', err);
//         res.status(err.status).end();
//       }
//     },
//   );
// });

// async function extractMetadata(filePath) {
//   try {
//     return await mm.parseFile(filePath, {duration: true, skipCovers: false});
//   } catch (error) {
//     console.error('Error extracting metadata', error);
//     return {};
//   }
// }

// mongoose
//   .connect(
//     `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
//   )
//   .then(console.log('Succesfully connected to database ✅'));

// const corsOptions = {
//   origin: 'http://localhost:9001', // Remplacez par votre origine frontend
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(express.json());
// app.use('/api', cors(corsOptions), apiRouter);

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

const express = require('express');
const cors = require('cors');
const path = require('path');
const musicMetadata = require('music-metadata'); // Remplacez 'mm' par 'music-metadata'
const recursiveReaddir = require('recursive-readdir');
const fs = require('fs');
const apiRouter = require('./routes');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 9000;

const musicFolder = path.join(__dirname, '../../sonzak/test');

app.use('/music', express.static(musicFolder));

// Centralisation des options CORS
const corsOptions = {
  origin: 'https://m2-spotify-backoffice.netlify.app', // Remplacez par votre origine frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.get('/music-list', async (req, res) => {
  try {
    const files = await recursiveReaddir(musicFolder);
    const music = [];

    for (const filePath of files) {
      if (filePath.endsWith('.mp3') || filePath.endsWith('.m4a')) {
        const metadata = await extractMetadata(filePath);
        const fileName = path.relative(musicFolder, filePath);

        let coverFileName;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const uniqueId = fileName.replace(/\.[^/.]+$/, '');
          coverFileName = `cover_${uniqueId}.jpg`;

          const coverFilePath = path.join(musicFolder, coverFileName);

          // Vérifier si le répertoire existe, sinon le créer
          const coverDir = path.dirname(coverFilePath);
          if (!fs.existsSync(coverDir)) {
            fs.mkdirSync(coverDir, {recursive: true});
          }

          // Sauvegarder l'image de couverture si elle n'existe pas déjà
          if (!fs.existsSync(coverFilePath)) {
            fs.writeFileSync(coverFilePath, metadata.common.picture[0].data);
          }
        } else {
          coverFileName = 'default_cover.jpg';
        }

        music.push({
          name: fileName,
          path: `/music/${encodeURIComponent(fileName)}`,
          artist: metadata.common.artist,
          album: metadata.common.album,
          cover: `/cover/${encodeURIComponent(coverFileName)}`,
        });
      }
    }

    res.json({music});
  } catch (error) {
    console.error('Error reading music folder', error);
    res.status(500).send('Error reading music folder');
  }
});

app.get('/music/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(musicFolder, fileName);

  res.sendFile(filePath, {headers: {'Content-Type': 'audio/mpeg'}}, err => {
    if (err) {
      console.error('Error reading file', err);
      res.status(err.status).end();
    }
  });
});

app.get('/cover/:coverFileName', (req, res) => {
  const coverFileName = req.params.coverFileName;
  const coverFilePath = path.join(musicFolder, coverFileName);

  // Ajouter une gestion d'erreur pour les fichiers non existants
  if (!fs.existsSync(coverFilePath)) {
    return res.status(404).send('Cover image not found');
  }

  res.sendFile(
    coverFilePath,
    {headers: {'Content-Type': 'image/jpeg'}},
    err => {
      if (err) {
        console.error('Error reading cover image', err);
        res.status(err.status).end();
      }
    },
  );
});

async function extractMetadata(filePath) {
  try {
    return await musicMetadata.parseFile(filePath, {
      duration: true,
      skipCovers: false,
    });
  } catch (error) {
    console.error('Error extracting metadata', error);
    return {};
  }
}

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
  )
  .then(() => console.log('Successfully connected to the database ✅'));

app.use(express.json());
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
