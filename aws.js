const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const dotenv = require('dotenv');
dotenv.config();

// Configuration AWS avec les informations d'identification directes
AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: 'eu-west-3',
});

// Création d'une instance S3
const s3 = new AWS.S3();

// Stocker les informations des albums déjà traités
const processedAlbums = {};

// Spécifiez le chemin du dossier local que vous souhaitez uploader
const localFolderPath =
  '/Users/djibrilcisse/Projects/YNOV/CLOUD/sonzak/uploads/';

// Spécifiez le nom du bucket S3 créé sur votre compte AWS
const bucketName = 'tracksbucket';

// Fonction récursive pour parcourir le dossier et uploader les fichiers m4a
function uploadFilesInFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier :', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(folderPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(
            'Erreur lors de la lecture des informations du fichier :',
            err,
          );
          return;
        }

        if (stats.isDirectory()) {
          // Si c'est un dossier, appeler récursivement la fonction pour le dossier
          uploadFilesInFolder(filePath);
        } else if (path.extname(filePath) === '.m4a') {
          // Si c'est un fichier m4a, procéder à l'upload

          // Lire les métadonnées du fichier audio
          mm.parseFile(filePath)
            .then(metadata => {
              const albumName = metadata.common.album || 'Unknown Album';

              // Vérifier si l'album a déjà été traité
              if (!processedAlbums[albumName]) {
                // Stocker les informations de l'album pour éviter le traitement répété
                processedAlbums[albumName] = true;

                // Créer une instance avec la couverture de l'album
                if (
                  metadata.common.picture &&
                  metadata.common.picture.length > 0
                ) {
                  const coverData = metadata.common.picture[0].data;
                  const coverStream = Buffer.from(coverData);

                  const coverKey = albumName + '/cover.jpg'; // Utilisez le nom de l'album comme clé sur S3

                  const coverUploadParams = {
                    Bucket: bucketName,
                    Key: coverKey,
                    Body: coverStream,
                  };

                  s3.upload(coverUploadParams, (err, data) => {
                    if (err) {
                      console.error(
                        `Erreur lors de l'upload de la couverture pour ${albumName} :`,
                        err,
                      );
                    } else {
                      console.log(
                        `Couverture pour l'album ${albumName} uploadée avec succès. URL S3 :`,
                        data.Location,
                      );
                    }
                  });
                }
              }

              // Procéder à l'upload du fichier audio
              const fileStream = fs.createReadStream(filePath);
              const uploadParams = {
                Bucket: bucketName,
                Key: albumName + '/' + file, // Utilisez le nom du fichier local comme clé sur S3
                Body: fileStream,
              };

              s3.upload(uploadParams, (err, data) => {
                if (err) {
                  console.error(
                    `Erreur lors de l'upload du fichier ${file} :`,
                    err,
                  );
                } else {
                  console.log(
                    `Fichier ${file} uploadé avec succès. URL S3 :`,
                    data.Location,
                  );
                }
              });
            })
            .catch(error => {
              console.error(
                `Erreur lors de la lecture des métadonnées du fichier ${file} :`,
                error,
              );
            });
        }
      });
    });
  });
}

// Appeler la fonction pour commencer le processus
uploadFilesInFolder(localFolderPath);
