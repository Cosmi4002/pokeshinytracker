import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../src/lib/pokedex.json');
const MAPPING_OUTPUT_PATH = path.join(__dirname, '../src/lib/showdown-shiny-mapping.json');

const TOTAL_POKEMON = 1025; // Base National Dex count as of Gen 9

async function generate() {
    console.log('Fetching Pokemon from PokeAPI...');
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=2000`);
    const data = await response.json();

    const basePokemonMap = new Map();
    const allRaw = data.results.map((p) => {
        const idMatch = p.url.match(/\/pokemon\/(\d+)\/?$/);
        const id = idMatch ? parseInt(idMatch[1]) : 0;
        if (id <= TOTAL_POKEMON) basePokemonMap.set(p.name, id);
        return { id, name: p.name };
    });

    const list = allRaw.map((p) => {
        let baseId = p.id;
        if (p.id > 10000) {
            const parts = p.name.split('-');
            for (let i = parts.length - 1; i > 0; i--) {
                const prefix = parts.slice(0, i).join('-');
                if (basePokemonMap.has(prefix)) {
                    baseId = basePokemonMap.get(prefix);
                    break;
                }
            }
        }

        return {
            id: p.id,
            baseId,
            name: p.name,
            generation: getGeneration(p.id, p.name)
        };
    });

    // Filter out unwanted forms (Mega, Gmax, etc.) as per previous rules
    const filtered = list.filter((p) => {
        const n = p.name.toLowerCase();
        if (n.includes('-mega') || n.includes('-totem') || n.includes('-gmax') || n.includes('-primal') || n.includes('-eternal')) return false;

        // Include all base pokemon and significant varieties
        if (p.id <= TOTAL_POKEMON) return true;

        const significantVarieties = [
            '-alola', '-galar', '-hisui', '-paldea',
            'oinkologne-female', 'urshifu-rapid-strike', 'meowstic-female', 'indeedee-female',
            'ogerpon', 'ursaluna-bloodmoon', 'enamorus-therian', 'basculegion-female'
        ];

        return significantVarieties.some(v => n.includes(v));
    });

    // Sort: Base ID first, then regional forms, then the rest
    filtered.sort((a, b) => {
        if (a.baseId !== b.baseId) return a.baseId - b.baseId;

        // Same base species, sort varieties
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const regionalSuffixes = ['-alola', '-galar', '-hisui', '-paldea'];

        const isBaseA = a.id === a.baseId;
        const isBaseB = b.id === b.baseId;

        if (isBaseA && !isBaseB) return -1;
        if (!isBaseA && isBaseB) return 1;

        const isARegional = regionalSuffixes.some(s => aName.includes(s));
        const isBRegional = regionalSuffixes.some(s => bName.includes(s));

        if (isARegional && !isBRegional) return -1; // Group regionals right after base
        if (!isARegional && isBRegional) return 1;

        return a.id - b.id;
    });

    console.log(`Saving ${filtered.length} entries to pokedex.json...`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filtered, null, 2));

    // Also update mapping if needed, but let's keep the high-quality manual one for now
    // and only add new entries if missing.
    console.log('Done!');
}

function getGeneration(id, name) {
    const GENS = {
        1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493], 5: [494, 649],
        6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
    };

    if (name) {
        if (name.includes('-alola')) return 7;
        if (name.includes('-galar')) return 8;
        if (name.includes('-hisui')) return 8;
        if (name.includes('-paldea')) return 9;
    }

    if (id > 10000) return 9;
    for (const [gen, range] of Object.entries(GENS)) {
        if (id >= range[0] && id <= range[1]) return parseInt(gen);
    }
    return 9;
}

generate();
