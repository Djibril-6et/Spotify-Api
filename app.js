const express = require('express');
const path = require('path');
const mm = require('music-metadata');

const app = express();
const port = 9000;

const musicFolder = path.join(__dirname, '../../uploads');

app.use('/music', express.static(musicFolder));

app.get('/music-list', async (req, res) => {
    const fs = require('fs');
    fs.readdir(musicFolder, async (err, files) => {
        if (err) {
            return res.status(500).send('Error reading music folder');
        }

        const music = [];
        for (const file of files) {
            if (file.endsWith('.mp3') || file.endsWith('.aac')) {
                const filePath = path.join(musicFolder, file);
                const metadata = await extractMetadata(filePath);
                const coverFileName = file.replace(/\.[^/.]+$/, '') + '.jpg';

                // Créez une route pour servir la couverture en tant que ressource distincte
                app.get(`/covers/${encodeURIComponent(coverFileName)}`, (req, res) => {
                    const coverBuffer = metadata.common.picture[0].data;
                    res.writeHead(200, {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': coverBuffer.length
                    });
                    res.end(coverBuffer);
                });

                music.push({
                    name: file,
                    path: `/music/${encodeURIComponent(file)}`,
                    artist: metadata.common.artist,
                    album: metadata.common.album,
                    cover: `/covers/${encodeURIComponent(coverFileName)}`
                });
            }
        }

        res.json({ music });
    });
});

app.get('/music/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(musicFolder, fileName);

    res.sendFile(filePath, { headers: { 'Content-Type': 'audio/mpeg' } }, (err) => {
        if (err) {
            console.error('Error reading file', err);
            res.status(err.status).end();
        }
    });
});

async function extractMetadata(filePath) {
    try {
        return await mm.parseFile(filePath, { duration: true, skipCovers: false });
    } catch (error) {
        console.error('Error extracting metadata', error);
        return {};
    }
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
