import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../src/lib/pokedex.json');

// Helper to fetch JSON
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Generation helper
function getGeneration(id, name) {
    if (name.includes('-alola')) return 7;
    if (name.includes('-galar')) return 8;
    if (name.includes('-hisui')) return 8;
    if (name.includes('-paldea')) return 9;

    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    return 9;
}

// Name formatter for display
function formatName(name) {
    return name
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace('Alola', 'Alolan')
        .replace('Galar', 'Galarian')
        .replace('Hisui', 'Hisuian')
        .replace('Paldea', 'Paldean')
        .replace(' Totem', '')
        .trim();
}

async function main() {
    console.log('Fetching all pokemon...');
    const listData = await fetchJson('https://pokeapi.co/api/v2/pokemon?limit=10000');

    const allPokemon = [];
    const baseIds = new Map(); // species name -> id

    // 1. First pass: Identify base species IDs
    for (const p of listData.results) {
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        if (id <= 1025) {
            baseIds.set(p.name, id);
        }
    }

    // 2. Filter and build list
    for (const p of listData.results) {
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        const name = p.name;

        // --- EXCLUSION RULES ---

        // Exclude Mega, Gmax, Eternamax
        if (name.includes('-mega')) continue;
        if (name.includes('-gmax')) continue;
        if (name.includes('-eternamax')) continue;

        // Exclude Totem
        if (name.includes('-totem')) continue;

        // Exclude specific battle/temp forms
        if (name.includes('castform-') && !name.includes('castform')) { /* Keep Castform forms? usually distinct. Keep. */ }
        if (name.includes('-sunny') || name.includes('-rainy') || name.includes('-snowy')) { /* Castform/Cherrim forms. Keep? Cherrim is battle only. Castform is overworld. */ }

        // Cherrim: cherrim-sunshine is battle only. cherrim is overcast.
        if (name === 'cherrim-sunshine') continue;

        // Darmanitan: zen mode is battle only
        if (name.includes('-zen')) continue;

        // Meloetta: pirouette is battle transform? (Relic song). Keep both? Usually separate in DEX.

        // Aegislash: blade is battle only
        if (name === 'aegislash-blade') continue;

        // Wishiwashi: school is battle only
        if (name === 'wishiwashi-school') continue;

        // Minior: Meteor is default. Cores are forms.
        // Usually pokedex shows Core.
        // PokeAPI: minior-red-meteor (ID 774). minior-orange (ID 10xxx).
        // Let's keep Base (774) and maybe exclude colors to avoid clutter? Or keep all colors?
        // User said "The rest must have its own pane". 7 Miniors = 7 cards. Maybe too much?
        // Let's keep ID 774. Exclude others?
        if (name.startsWith('minior-') && name !== 'minior-red-meteor') continue;

        // Mimikyu: busted is battle only
        if (name.includes('-busted')) continue;

        // Cramorant: gulping/gorging battle only
        if (name.includes('-gulping') || name.includes('-gorging')) continue;

        // Eiscue: noice is battle only
        if (name.includes('-noice')) continue;

        // Morpeko: hangry is battle only
        if (name.includes('-hangry')) continue;

        // Zacian/Zamazenta: Crowned is item form. Hero is base.
        // Usually distinct sprites. Keep?
        // ID 888 is Hero. 10188 is Crowned. Keep both if they have different sprites.

        // Pikachu Caps:
        if (name.startsWith('pikachu-') && name !== 'pikachu-partner-cap') {
            // Exclude all caps except partner
            if (name.includes('-cap')) continue;
        }

        // Gender exclusions REMOVED to allow grouping in Pokedex.tsx
        // The app will group them by Base ID and display both sprites if hasGenderDiff is true.



        // Sizes (Pumpkaboo/Gourgeist)
        // pumpkaboo-small, large, super.
        // pumpkaboo-average (710).
        // Exclude sizes to avoid 4 cards.
        if (name.includes('-small') || name.includes('-large') || name.includes('-super')) {
            if (name.includes('pumpkaboo') || name.includes('gourgeist')) continue;
        }

        // Rockruff?
        // lycanroc-midday (745). midnight (10126). dusk (10127).
        // Keep separate cards.

        // Zarude date?
        if (name.includes('-dada')) continue; // Maybe keep? It's a scarf.

        // Palafin
        // palafin-zero (964). palafin-hero (10256).
        // Hero is battle form. Exclude.
        if (name === 'palafin-hero') continue;

        // Gimmighoul
        // gimmighoul (999) is Chest? gimmighoul-roaming (10257).
        // Roaming is distinct. Keep?

        // Koraidon/Miraidon build modes
        if (name.includes('limited-build') || name.includes('sprinting-build') || name.includes('swimming-build') || name.includes('gliding-build')) continue;
        if (name.includes('low-power-mode') || name.includes('drive-mode') || name.includes('aquatic-mode') || name.includes('glide-mode')) continue;

        // Terapagos
        if (name.includes('terapagos-terastal') || name.includes('terapagos-stellar')) continue; // Battle forms?

        // Ogerpon
        // ogerpon (1017) Teal.
        // ogerpon-wellspring-mask (10273).
        // ogerpon-hearthflame-mask (10274).
        // ogerpon-cornerstone-mask (10275).
        // Keep separate cards? Yes, different types/sprites.

        // Ursaluna Bloodmoon
        // ursaluna (901). ursaluna-bloodmoon (10272). Keep.

        // --- END EXCLUSIONS ---

        // Find Base ID
        let baseId = id;

        // Try to find base ID from name
        // e.g. rattata-alola -> rattata
        const parts = name.split('-');
        let potentialBase = parts[0];

        // Special cases for multi-word bases
        if (parts[0] === 'mr' && parts[1] === 'mime') potentialBase = 'mr-mime';
        if (parts[0] === 'mime' && parts[1] === 'jr') potentialBase = 'mime-jr';
        if (parts[0] === 'type' && parts[1] === 'null') potentialBase = 'type-null';
        if (parts[0] === 'tapu') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'iron') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'great') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'scream') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'brute') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'flutter') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'slither') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'sandy') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'roaring') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'walking') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'gouging') potentialBase = `${parts[0]}-${parts[1]}`;
        if (parts[0] === 'raging') potentialBase = `${parts[0]}-${parts[1]}`;

        if (baseIds.has(potentialBase)) {
            baseId = baseIds.get(potentialBase);
        } else if (id > 10000) {
            // Fallback for weird naming, strip suffixes
            // Check if name has known suffixes
            const knownSuffixes = ['-alola', '-galar', '-hisui', '-paldea', '-attack', '-defense', '-speed', '-sunny', '-rainy', '-snowy', '-heat', '-wash', '-frost', '-fan', '-mow', '-origin', '-sky', '-zen', '-therian', '-black', '-white', '-resolute', '-pirouette', '-midday', '-midnight', '-dusk', '-school', '-complete', '-10', '-50', '-pau', '-pom-pom', '-sensu', '-busted', '-midnight', '-dusk', '-dawn-wings', '-dusk-mane', '-ultra', '-single-strike', '-rapid-strike', '-ice', '-shadow', '-bloodmoon', '-low-key', '-hero', '-roaming', '-segmented', '-three-family', '-four-family', '-plumage', '-core', '-meteor', '-ash', '-partner-cap'];

            for (const suffix of knownSuffixes) {
                if (name.includes(suffix)) {
                    // Try removing suffix
                    const trimmed = name.replace(suffix, '');
                    if (baseIds.has(trimmed)) {
                        baseId = baseIds.get(trimmed);
                        break;
                    }
                }
            }
        }

        allPokemon.push({
            id: id,
            baseId: baseId,
            name: name,
            generation: getGeneration(baseId, name)
        });
    }

    // Sort by Base ID then ID
    allPokemon.sort((a, b) => {
        if (a.baseId !== b.baseId) return a.baseId - b.baseId;
        return a.id - b.id;
    });

    console.log(`Writing ${allPokemon.length} pokemon to file...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPokemon, null, 2));
    console.log('Done!');
}

main();
