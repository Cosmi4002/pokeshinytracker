import * as fs from 'fs';
import * as path from 'path';

// Load the Gen 7 shiny links
const gen7LinksPath = path.join(__dirname, 'gen7_shiny_links_COMPLETE_FINAL.txt');
const gen7Links = fs.readFileSync(gen7LinksPath, 'utf-8').split('\n').filter(line => line.trim());

// Load raw pokedex to map names to IDs
const rawPokedexPath = path.join(__dirname, 'src', 'lib', 'raw-pokedex.json');
const rawPokedex = JSON.parse(fs.readFileSync(rawPokedexPath, 'utf-8'));

// Load existing showdown mapping
const mappingPath = path.join(__dirname, 'src', 'lib', 'showdown-shiny-mapping.json');
const existingMapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Create a name-to-ID map from the pokedex
const nameToId: Record<string, number> = {};
rawPokedex.forEach((pokemon: any) => {
    const name = pokemon.name.english.toLowerCase();
    nameToId[name] = pokemon.id;
});

// Process the Gen 7 links
const newMapping: Record<string, string> = { ...existingMapping };
const processedPokemon = new Set<string>();

gen7Links.forEach(line => {
    const match = line.match(/^(.+?)(?:\s+\((.+?)\))?\s*:\s*(.+)$/);
    if (!match) return;

    const [, pokemonName, form, url] = match;
    const cleanName = pokemonName.trim().toLowerCase();

    // Skip if not a home-shiny URL (prefer highest quality)
    if (!url.includes('/home/shiny/')) return;

    // Get Pokemon ID
    const pokemonId = nameToId[cleanName];
    if (!pokemonId) {
        console.log(`⚠️  Pokemon not found: ${cleanName}`);
        return;
    }

    // Handle special forms
    if (form) {
        const formLower = form.toLowerCase();

        // Oricorio forms
        if (cleanName === 'oricorio') {
            if (formLower.includes('baile')) {
                newMapping[`${pokemonId}-baile`] = url;
            } else if (formLower.includes('pom-pom') || formLower.includes('pompom')) {
                newMapping[`${pokemonId}-pompom`] = url;
            } else if (formLower.includes("pa'u") || formLower.includes('pau')) {
                newMapping[`${pokemonId}-pau`] = url;
            } else if (formLower.includes('sensu')) {
                newMapping[`${pokemonId}-sensu`] = url;
            }
            processedPokemon.add(`${cleanName}-${formLower}`);
            return;
        }

        // Lycanroc forms
        if (cleanName === 'lycanroc') {
            if (formLower.includes('midday')) {
                newMapping[`${pokemonId}-midday`] = url;
            } else if (formLower.includes('midnight')) {
                newMapping[`${pokemonId}-midnight`] = url;
            } else if (formLower.includes('dusk')) {
                newMapping[`${pokemonId}-dusk`] = url;
            }
            processedPokemon.add(`${cleanName}-${formLower}`);
            return;
        }

        // Minior forms (remove "Core" from the form name)
        if (cleanName === 'minior') {
            const colorMatch = formLower.match(/(red|orange|yellow|green|blue|indigo|violet)/);
            if (colorMatch) {
                const color = colorMatch[1];
                newMapping[`${pokemonId}-${color}`] = url;
                processedPokemon.add(`${cleanName}-${color}`);
            }
            return;
        }

        // Silvally types
        if (cleanName === 'silvally') {
            const typeMatch = formLower.match(/(normal|bug|dark|dragon|electric|fairy|fighting|fire|flying|ghost|grass|ground|ice|poison|psychic|rock|steel|water)/);
            if (typeMatch) {
                const type = typeMatch[1];
                newMapping[`${pokemonId}-${type}`] = url;
                processedPokemon.add(`${cleanName}-${type}`);
            }
            return;
        }

        // Other forms (Necrozma, Magearna, etc.)
        const formSlug = formLower
            .replace(/\s+/g, '-')
            .replace(/'/g, '')
            .replace(/:/g, '');
        newMapping[`${pokemonId}-${formSlug}`] = url;
        processedPokemon.add(`${cleanName}-${formSlug}`);
    } else {
        // Base form
        newMapping[pokemonId.toString()] = url;
        processedPokemon.add(cleanName);
    }
});

// Write updated mapping
fs.writeFileSync(mappingPath, JSON.stringify(newMapping, null, 2), 'utf-8');

console.log('✅ Sprite mapping updated successfully!');
console.log(`📊 Total entries in mapping: ${Object.keys(newMapping).length}`);
console.log(`🆕 Processed ${processedPokemon.size} unique Pokemon/forms from Gen 7`);
console.log(`📝 Updated file: ${mappingPath}`);
