const fs = require('fs');
const path = require('path');

const POKEDEX_PATH = path.join(__dirname, '../src/lib/raw-pokedex.json');
const OUTPUT_PATH = path.join(__dirname, '../src/lib/showdown-shiny-mapping.json');
const BASE_URL = 'https://play.pokemonshowdown.com/sprites/home-shiny/';

// Pokemon with visible gender differences (from use-pokemon.ts)
const POKEMON_WITH_GENDER_DIFF = [
    3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119,
    123, 129, 130, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203,
    207, 208, 212, 214, 215, 217, 221, 224, 229, 232, 255, 256, 257, 267, 269,
    272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350, 369, 396, 397,
    398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443,
    444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
    592, 593, 668, 678, 876, 902, 916
];

function toShowdownSlug(name) {
    if (!name) return '';
    let slug = name.toLowerCase()
        .replace(/[’'%: .]/g, '')
        .replace(/♀/g, 'f')
        .replace(/♂/g, 'm')
        .replace(/é/g, 'e');

    // Remove common PokeAPI standard suffixes that Showdown doesn't use
    slug = slug.replace(/-standard|-normal/g, '');

    // Handle specific forms for Showdown
    if (slug === 'pikachu-partner-cap') return 'pikachu-partner';
    if (slug === 'zygarde-50') return 'zygarde';

    return slug;
}

try {
    console.log(`Loading Pokedex from ${POKEDEX_PATH}...`);
    const pokedex = JSON.parse(fs.readFileSync(POKEDEX_PATH, 'utf8'));
    const mapping = {};

    pokedex.forEach(p => {
        const name = p.name.english;
        const slug = toShowdownSlug(name);
        const id = p.id.toString();

        // Base sprite
        mapping[id] = `${BASE_URL}${slug}.png`;

        // Gender difference sprite if applicable
        if (POKEMON_WITH_GENDER_DIFF.includes(p.id)) {
            mapping[`${id}-f`] = `${BASE_URL}${slug}-f.png`;
        }
    });

    // Manual fixes or additions for missing forms in raw-pokedex.json
    // (e.g. Gen 9 placeholders or specific variants)

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
    console.log(`✅ Success! Generated mapping with ${Object.keys(mapping).length} entries.`);
    console.log(`Saved to ${OUTPUT_PATH}`);

} catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
}
