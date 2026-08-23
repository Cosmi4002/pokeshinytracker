
const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

(async () => {
    try {
        console.log("Fetching Minior (774)...");
        const data = await fetchJson('https://pokeapi.co/api/v2/pokemon/774');
        console.log(`Name: ${data.name}`);
        console.log("Forms from /pokemon/774:");
        data.forms.forEach(f => console.log(` - ${f.name}`));

        console.log("Varieties from species:");
        const species = await fetchJson(data.species.url);
        species.varieties.forEach(v => console.log(` - ${v.pokemon.name} (is_default: ${v.is_default})`));

    } catch (e) {
        console.error(e);
    }
})();
