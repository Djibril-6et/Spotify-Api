const AWS = require('aws-sdk');
const musicMetadata = require('music-metadata');
const fluentFfmpeg = require('fluent-ffmpeg');
const dotenv = require('dotenv');
dotenv.config();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const fs = require('fs');
const fsPromises = require('fs').promises;

AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: 'eu-west-3',
});

const s3 = new AWS.S3();
const bucketName = 'tracksbucket';
const processedAlbums = {};

const tempDir = './temp';

exports.processUploadedTrack = async (req, res) => {
  upload.single('audio')(req, res, async err => {
    try {
      // Vérifier si le répertoire temporaire existe, sinon le créer
      await fsPromises.access(tempDir, fsPromises.constants.F_OK);
    } catch (error) {
      try {
        await fsPromises.mkdir(tempDir);
        console.log(`Répertoire ${tempDir} créé avec succès.`);
      } catch (error) {
        console.error(
          `Erreur lors de la création du répertoire ${tempDir} :`,
          error,
        );
      }
    }

    if (err) {
      console.error("Erreur lors de l'upload du fichier audio :", err);
      return res.status(400).json({
        error: "Une erreur est survenue lors de l'upload du fichier audio.",
      });
    }

    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({error: 'Aucun fichier audio reçu.'});
    }

    console.log('Fichier audio reçu :', audioFile);

    try {
      const metadata = await musicMetadata.parseBuffer(
        audioFile.buffer,
        audioFile.mimetype,
      );

      const albumName =
        req.body.album || (metadata.common && metadata.common.album);

      if (!processedAlbums[albumName]) {
        processedAlbums[albumName] = true;

        if (
          metadata.common &&
          metadata.common.picture &&
          metadata.common.picture.length > 0
        ) {
          const coverData = metadata.common.picture[0].data;
          const coverStream = Buffer.from(coverData);
          const coverKey = albumName + '/cover.jpg';

          const coverUploadParams = {
            Bucket: bucketName,
            Key: coverKey,
            Body: coverStream,
          };

          const coverUploadResult = await s3
            .upload(coverUploadParams)
            .promise();

          console.log(
            `Couverture pour l'album ${albumName} uploadée avec succès. URL S3 :`,
            coverUploadResult.Location,
          );
        }
      }

      const fileExtension = audioFile.originalname
        .split('.')
        .pop()
        .toLowerCase();

      if (fileExtension !== 'm4a') {
        // const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
        // const convertedFilePath = `${tempDir}/${audioFile.originalname.replace(
        //   /\.[^/.]+$/,
        //   '',
        // )}.m4a`;

        // await new Promise((resolve, reject) => {
        //   fluentFfmpeg({ffmpegPath: ffmpegPath})
        //     .input(audioFile.buffer)
        //     .inputFormat('mp3') // Spécifiez le format d'entrée comme MP3
        //     .audioCodec('libfdk_aac')
        //     .audioBitrate('192k')
        //     .format('m4a')
        //     .on('end', () => {
        //       console.log('Conversion terminée');
        //       resolve();
        //     })
        //     .on('error', err => {
        //       console.error('Erreur lors de la conversion : ' + err);
        //       reject(err);
        //     })
        //     .save(convertedFilePath);
        // });

        // const convertedFile = {
        //   name: `${audioFile.originalname.replace(/\.[^/.]+$/, '')}.m4a`,
        //   path: convertedFilePath,
        // };

        // const uploadParams = {
        //   Bucket: bucketName,
        //   Key: albumName + '/' + convertedFile.name,
        //   Body: fs.createReadStream(convertedFile.path),
        // };

        // const data = await s3.upload(uploadParams).promise();

        const uploadParams = {
          Bucket: bucketName,
          Key: albumName + '/' + audioFile.originalname,
          Body: audioFile.buffer,
        };

        const data = await s3.upload(uploadParams).promise();

        console.log(`Fichier uploadé avec succès. URL S3 :`, data.Location);
      } else {
        const uploadParams = {
          Bucket: bucketName,
          Key: albumName + '/' + audioFile.originalname,
          Body: audioFile.buffer,
        };

        const data = await s3.upload(uploadParams).promise();

        console.log(`Fichier uploadé avec succès. URL S3 :`, data.Location);
      }
    } catch (error) {
      console.error(
        `Erreur lors de la lecture des métadonnées du fichier :`,
        error,
      );
      res.status(500).json({
        error:
          "Une erreur est survenue lors de l'analyse des métadonnées audio.",
        details: error.message,
      });
    }
  });
};
