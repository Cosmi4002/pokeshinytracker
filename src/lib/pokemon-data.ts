// Complete Pokemon list with all forms for shiny hunting

export interface Pokemon {
  id: number;
  name: string;
  displayName: string;
  generation: number;
  hasGenderDiff: boolean;
  forms?: PokemonForm[];
}

export interface PokemonForm {
  formId: string;
  formName: string;
  displayName: string;
}

// Shiny hunting methods with their base odds - CORRECTED TO MATCH SHINYTRACKER
export interface HuntingMethod {
  id: string;
  name: string;
  baseOdds: number;
  generation: number;
  supportsShinyCharm: boolean;
  shinyCharmOdds?: number;
}

export const HUNTING_METHODS: HuntingMethod[] = [
  // Generation 2
  { id: 'gen2-random', name: 'Generation 2 Random Encounter', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-breeding-shiny', name: 'Generation 2 Breeding with Shiny Parent', baseOdds: 64, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-odd-egg-jpn', name: 'Generation 2 Japanese Odd Egg', baseOdds: 14, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-odd-egg-int', name: 'Generation 2 International Odd Egg', baseOdds: 56, generation: 2, supportsShinyCharm: false },
  
  // Generation 3
  { id: 'gen3-random', name: 'Generation 3 Random Encounter', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  
  // Generation 4
  { id: 'gen4-random', name: 'Generation 4 Random Encounter', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-double', name: 'Generation 4 Double Encounter', baseOdds: 4096, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-masuda', name: 'Generation 4 Masuda Method', baseOdds: 1639, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-pokeradar', name: 'Generation 4 Poke Radar', baseOdds: 200, generation: 4, supportsShinyCharm: false },
  
  // Generation 5
  { id: 'gen5-random', name: 'Generation 5 Random Encounter', baseOdds: 8192, generation: 5, supportsShinyCharm: true, shinyCharmOdds: 2731 },
  { id: 'gen5-double', name: 'Generation 5 Double Encounter', baseOdds: 4096, generation: 5, supportsShinyCharm: true, shinyCharmOdds: 1366 },
  { id: 'gen5-masuda', name: 'Generation 5 Masuda Method', baseOdds: 1366, generation: 5, supportsShinyCharm: true, shinyCharmOdds: 1024 },
  
  // Generation 6
  { id: 'gen6-random', name: 'Generation 6 Random Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true, shinyCharmOdds: 1365 },
  { id: 'gen6-masuda', name: 'Generation 6 Masuda Method', baseOdds: 683, generation: 6, supportsShinyCharm: true, shinyCharmOdds: 512 },
  { id: 'gen6-horde', name: 'Generation 6 Horde Encounter', baseOdds: 819, generation: 6, supportsShinyCharm: true, shinyCharmOdds: 273 },
  { id: 'gen6-friend-safari', name: 'Generation 6 Friend Safari', baseOdds: 585, generation: 6, supportsShinyCharm: false },
  { id: 'gen6-chain-fishing', name: 'Generation 6 Chain Fishing', baseOdds: 96, generation: 6, supportsShinyCharm: false },
  { id: 'gen6-dexnav', name: 'Generation 6 Dex Nav', baseOdds: 512, generation: 6, supportsShinyCharm: true, shinyCharmOdds: 465 },
  { id: 'gen6-pokeradar', name: 'Generation 6 Poke Radar', baseOdds: 200, generation: 6, supportsShinyCharm: false },
  
  // Generation 7
  { id: 'gen7-random', name: 'Generation 7 Random Encounter', baseOdds: 4096, generation: 7, supportsShinyCharm: true, shinyCharmOdds: 1365 },
  { id: 'gen7-masuda', name: 'Generation 7 Masuda Method', baseOdds: 683, generation: 7, supportsShinyCharm: true, shinyCharmOdds: 512 },
  { id: 'gen7-sos', name: 'Generation 7 SOS Encounter', baseOdds: 315, generation: 7, supportsShinyCharm: true, shinyCharmOdds: 273 },
  
  // Generation 8
  { id: 'gen8-random', name: 'Generation 8 Random Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 1365 },
  { id: 'gen8-masuda', name: 'Generation 8 Masuda Method', baseOdds: 683, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 512 },
  { id: 'gen8-ko-combo', name: 'Generation 8 KO Combo', baseOdds: 1024, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 683 },
  { id: 'gen8-dynamax', name: 'Generation 8 Dynamax Adventure', baseOdds: 100, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 100 },
  { id: 'gen8-bdsp-random', name: 'Generation 8 Random Encounter (BDSP)', baseOdds: 4096, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 1365 },
  { id: 'gen8-bdsp-double', name: 'Generation 8 Double Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 1365 },
  { id: 'gen8-bdsp-pokeradar', name: 'Generation 8 Poke Radar', baseOdds: 99, generation: 8, supportsShinyCharm: true, shinyCharmOdds: 93 },
  
  // Custom
  { id: 'custom', name: 'Custom Odds', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
];

export const POKEBALLS = [
  { id: 'pokeball', name: 'Poké Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
  { id: 'greatball', name: 'Great Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png' },
  { id: 'ultraball', name: 'Ultra Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png' },
  { id: 'masterball', name: 'Master Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png' },
  { id: 'premierball', name: 'Premier Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/premier-ball.png' },
  { id: 'luxuryball', name: 'Luxury Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png' },
  { id: 'diveball', name: 'Dive Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dive-ball.png' },
  { id: 'nestball', name: 'Nest Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nest-ball.png' },
  { id: 'repeatball', name: 'Repeat Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/repeat-ball.png' },
  { id: 'timerball', name: 'Timer Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/timer-ball.png' },
  { id: 'quickball', name: 'Quick Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png' },
  { id: 'duskball', name: 'Dusk Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png' },
  { id: 'healball', name: 'Heal Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heal-ball.png' },
  { id: 'netball', name: 'Net Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/net-ball.png' },
  { id: 'levelball', name: 'Level Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/level-ball.png' },
  { id: 'lureball', name: 'Lure Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png' },
  { id: 'moonball', name: 'Moon Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-ball.png' },
  { id: 'friendball', name: 'Friend Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/friend-ball.png' },
  { id: 'loveball', name: 'Love Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/love-ball.png' },
  { id: 'heavyball', name: 'Heavy Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heavy-ball.png' },
  { id: 'fastball', name: 'Fast Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fast-ball.png' },
  { id: 'sportball', name: 'Sport Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sport-ball.png' },
  { id: 'safariball', name: 'Safari Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/safari-ball.png' },
  { id: 'dreamball', name: 'Dream Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dream-ball.png' },
  { id: 'beastball', name: 'Beast Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/beast-ball.png' },
  { id: 'cherishball', name: 'Cherish Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cherish-ball.png' },
];

export const GAMES = [
  // Gen 2
  { id: 'gold', name: 'Pokémon Gold', generation: 2 },
  { id: 'silver', name: 'Pokémon Silver', generation: 2 },
  { id: 'crystal', name: 'Pokémon Crystal', generation: 2 },
  // Gen 3
  { id: 'ruby', name: 'Pokémon Ruby', generation: 3 },
  { id: 'sapphire', name: 'Pokémon Sapphire', generation: 3 },
  { id: 'emerald', name: 'Pokémon Emerald', generation: 3 },
  { id: 'firered', name: 'Pokémon FireRed', generation: 3 },
  { id: 'leafgreen', name: 'Pokémon LeafGreen', generation: 3 },
  // Gen 4
  { id: 'diamond', name: 'Pokémon Diamond', generation: 4 },
  { id: 'pearl', name: 'Pokémon Pearl', generation: 4 },
  { id: 'platinum', name: 'Pokémon Platinum', generation: 4 },
  { id: 'heartgold', name: 'Pokémon HeartGold', generation: 4 },
  { id: 'soulsilver', name: 'Pokémon SoulSilver', generation: 4 },
  // Gen 5
  { id: 'black', name: 'Pokémon Black', generation: 5 },
  { id: 'white', name: 'Pokémon White', generation: 5 },
  { id: 'black2', name: 'Pokémon Black 2', generation: 5 },
  { id: 'white2', name: 'Pokémon White 2', generation: 5 },
  // Gen 6
  { id: 'x', name: 'Pokémon X', generation: 6 },
  { id: 'y', name: 'Pokémon Y', generation: 6 },
  { id: 'oras', name: 'Pokémon ORAS', generation: 6 },
  // Gen 7
  { id: 'sun', name: 'Pokémon Sun', generation: 7 },
  { id: 'moon', name: 'Pokémon Moon', generation: 7 },
  { id: 'ultrasun', name: 'Pokémon Ultra Sun', generation: 7 },
  { id: 'ultramoon', name: 'Pokémon Ultra Moon', generation: 7 },
  { id: 'lgpe', name: 'Let\'s Go Pikachu/Eevee', generation: 7 },
  // Gen 8
  { id: 'sword', name: 'Pokémon Sword', generation: 8 },
  { id: 'shield', name: 'Pokémon Shield', generation: 8 },
  { id: 'bdsp', name: 'Pokémon BDSP', generation: 8 },
  { id: 'pla', name: 'Pokémon Legends: Arceus', generation: 8 },
  // Gen 9
  { id: 'scarlet', name: 'Pokémon Scarlet', generation: 9 },
  { id: 'violet', name: 'Pokémon Violet', generation: 9 },
];

// Calculate shiny probability statistics - CORRECTED FORMULAS
export function calculateShinyStats(encounters: number, odds: number) {
  if (encounters === 0 || odds === 0) {
    return {
      probability: '0',
      binomialProbability: '0',
      until50: 0,
      until90: 0,
    };
  }

  const probability = 1 / odds;
  
  // Binomial probability: 1 - (1 - p)^n
  const binomialProb = (1 - Math.pow(1 - probability, encounters)) * 100;
  
  // Encounters until X% probability using logarithms
  const until50 = Math.ceil(Math.log(0.5) / Math.log(1 - probability));
  const until90 = Math.ceil(Math.log(0.1) / Math.log(1 - probability));
  
  return {
    probability: encounters.toString(),
    binomialProbability: binomialProb.toFixed(2),
    until50,
    until90,
  };
}

// Get sprite URL for a Pokemon
export function getPokemonSpriteUrl(
  pokemonId: number, 
  shiny: boolean = true, 
  gender: 'male' | 'female' = 'male',
  form?: string
): string {
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  
  let path = shiny ? '/shiny' : '';
  
  // Handle gender differences
  if (gender === 'female') {
    path += '/female';
  }
  
  // Handle forms
  if (form && form !== 'normal') {
    // Forms are typically handled with different IDs or named sprites
    // This is a simplified version - actual implementation would need form mappings
    return `${baseUrl}${path}/${pokemonId}.png`;
  }
  
  return `${baseUrl}${path}/${pokemonId}.png`;
}

// Get shiny charm icon
export const SHINY_CHARM_ICON = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png';
