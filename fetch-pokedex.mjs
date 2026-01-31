import fs from 'fs';
import https from 'https';

const url = 'https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json';
const dest = 'src/lib/raw-pokedex.json';

console.log(`Downloading ${url} to ${dest}...`);

const file = fs.createWriteStream(dest);
https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log('Download completed.');
        });
    });
}).on('error', function (err) {
    console.error('Error downloading:', err.message);
});
