import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '../src/lib/showdown-shiny-mapping.json');
const GEN9_START = 906;
const GEN9_END = 1025;

async function fetchGen9Pokemon() {
  console.log('Fetching Gen 9 Pokémon from PokeAPI...');
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=2000`);
  const data = await response.json();

  return data.results
    .map(p => {
      const idMatch = p.url.match(/\/pokemon\/(\d+)\/?$/);
      const id = idMatch ? parseInt(idMatch[1]) : 0;
      return { id, name: p.name };
    })
    .filter(p => p.id >= GEN9_START && p.id <= GEN9_END);
}

function toPokemondbSlug(name) {
  // Pokemondb uses similar slugs but some differences
  // e.g. "oinkologne-masculine" -> "oinkologne"
  // "tauros-paldea-combat-breed" -> "tauros-paldean-combat"

  let slug = name.toLowerCase()
    .replace('oinkologne-masculine', 'oinkologne')
    .replace('oinkologne-feminine', 'oinkologne-f')
    .replace('tauros-paldea-combat-breed', 'tauros-paldean-combat')
    .replace('tauros-paldea-blaze-breed', 'tauros-paldean-blaze')
    .replace('tauros-paldea-aqua-breed', 'tauros-paldean-aqua')
    .replace('-paldea', '-paldean')
    .replace('maushold-family-of-three', 'maushold-family-3')
    .replace('maushold-family-of-four', 'maushold')
    .replace('squawkabilly-green-plumage', 'squawkabilly')
    .replace('squawkabilly-blue-plumage', 'squawkabilly-blue')
    .replace('squawkabilly-yellow-plumage', 'squawkabilly-yellow')
    .replace('squawkabilly-white-plumage', 'squawkabilly-white')
    .replace('palafin-zero', 'palafin')
    .replace('palafin-hero', 'palafin-hero')
    .replace('tatsugiri-curly', 'tatsugiri')
    .replace('tatsugiri-droopy', 'tatsugiri-droopy')
    .replace('tatsugiri-stretchy', 'tatsugiri-stretchy')
    .replace('dudunsparce-two-segment', 'dudunsparce')
    .replace('dudunsparce-three-segment', 'dudunsparce-3-segment')
    .replace('gimmighoul-chest', 'gimmighoul')
    .replace('gimmighoul-roaming', 'gimmighoul-roaming')
    .replace('ogerpon-wellspring-mask', 'ogerpon-wellspring')
    .replace('ogerpon-hearthflame-mask', 'ogerpon-hearthflame')
    .replace('ogerpon-cornerstone-mask', 'ogerpon-cornerstone')
    .replace('terapagos-stellar', 'terapagos-stellar');

  return slug;
}

async function run() {
  try {
    const gen9Pokemon = await fetchGen9Pokemon();
    console.log(`Found ${gen9Pokemon.length} Gen 9 Pokémon.`);

    const mapping = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    let updatedCount = 0;

    gen9Pokemon.forEach(p => {
      const slug = p.name; // Use raw name for PokeDB usually works better with minor fixes
      const pokeDbSlug = toPokemondbSlug(slug);

      // Pokemon Showdown shiny sprite URL (more reliable than Pokemondb)
      const url = `https://play.pokemonshowdown.com/sprites/home-shiny/${p.name}.png`;

      mapping[p.id.toString()] = url;
      updatedCount++;
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
    console.log(`✅ Updated ${updatedCount} Gen 9 entries in ${OUTPUT_PATH}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
