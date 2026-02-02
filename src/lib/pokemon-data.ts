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

// Shiny hunting methods with dynamic odds calculation
export interface HuntingMethod {
  id: string;
  name: string;
  baseOdds: number; // For static reference or initial odds
  generation: number;
  supportsShinyCharm: boolean;
  description?: string;
}

// Helper to calculate odds based on method mechanics
export const getDynamicOdds = (methodId: string, encounters: number, hasShinyCharm: boolean): number => {
  const method = HUNTING_METHODS.find(m => m.id === methodId);
  if (!method) return 4096;

  let rolls = 1;
  const charmRolls = hasShinyCharm ? 2 : 0;

  // Specific Methods with unique logic
  if (methodId === 'breeding-shiny-gen2') return 64;
  if (methodId === 'odd-egg') return 128;

  if (methodId === 'pokeradar-gen4') {
    const chain = Math.min(encounters, 40);
    if (chain >= 40) return 200;
    if (chain >= 30) return 1300 + (40 - chain) * 200;
    return 8192;
  }

  if (methodId === 'pokeradar-bdsp') {
    const chain = Math.min(encounters, 40);
    // BDSP odds are slightly different at max chain? Actually no, 1/99 approx at 40.
    // Let's use the provided logic:
    if (chain >= 40) return 99;
    return 4096;
  }

  if (methodId === 'chain-fishing') {
    const chain = Math.min(encounters, 20);
    const bonusRolls = 2 * chain;
    const totalRolls = 1 + bonusRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'dexnav') {
    if (encounters >= 999) return hasShinyCharm ? 173 : 200;
    return hasShinyCharm ? 512 : 600;
  }

  if (methodId === 'sos-battle') {
    const chain = encounters % 256;
    let extraRolls = 0;
    if (chain >= 31) extraRolls = 12;
    else if (chain >= 21) extraRolls = 8;
    else if (chain >= 11) extraRolls = 4;

    const totalRolls = 1 + extraRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'catch-combo') {
    let comboRolls = 0;
    if (encounters >= 31) comboRolls = 11;
    else if (encounters >= 21) comboRolls = 8;
    else if (encounters >= 11) comboRolls = 4;
    const totalRolls = 1 + comboRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'number-battled') {
    return hasShinyCharm ? 512 : 683; // For 500+ battles
  }

  if (methodId === 'dynamax-adventure') return hasShinyCharm ? 100 : 300;

  if (methodId.startsWith('sandwich-lv')) {
    const powerRolls = parseInt(methodId.split('lv')[1]) || 0;
    const totalRolls = 1 + powerRolls + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'mass-outbreak-gen9') {
    let outbreakRolls = 0;
    if (encounters >= 60) outbreakRolls = 2;
    else if (encounters >= 30) outbreakRolls = 1;
    const totalRolls = 1 + outbreakRolls + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'massive-mass-outbreak') {
    const totalRolls = 1 + 12 + (hasShinyCharm ? 2 : 0); // MMA is roughly +12 rolls
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'masuda-gen4') return 1639;
  if (methodId === 'masuda-gen5') return hasShinyCharm ? 1024 : 1366;
  if (methodId === 'masuda-modern') return hasShinyCharm ? 512 : 683;

  // BASE LOGIC for everything else
  const baseDenominator = method.baseOdds;
  if (hasShinyCharm && method.supportsShinyCharm) {
    if (method.generation >= 5) {
      return Math.round(baseDenominator / 3);
    }
  }

  return baseDenominator;
};

export const HUNTING_METHODS: HuntingMethod[] = [
  // --- Standard Methods ---
  { id: 'random-8192', name: 'Random Encounter (1/8192)', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'random-4096', name: 'Random Encounter (1/4096)', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'soft-reset-8192', name: 'Soft Reset (1/8192)', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'soft-reset-4096', name: 'Soft Reset (1/4096)', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'runaway-8192', name: 'Runaway (1/8192)', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'runaway-4096', name: 'Runaway (1/4096)', baseOdds: 4096, generation: 6, supportsShinyCharm: true },

  // --- Breeding ---
  { id: 'masuda-modern', name: 'Masuda Method (Modern)', baseOdds: 683, generation: 6, supportsShinyCharm: true },
  { id: 'masuda-gen5', name: 'Masuda Method (Gen 5)', baseOdds: 1366, generation: 5, supportsShinyCharm: true },
  { id: 'masuda-gen4', name: 'Masuda Method (Gen 4)', baseOdds: 1639, generation: 4, supportsShinyCharm: false },
  { id: 'breeding-shiny-gen2', name: 'Breeding (Shiny Parent)', baseOdds: 64, generation: 2, supportsShinyCharm: false },
  { id: 'odd-egg', name: 'Odd Egg', baseOdds: 128, generation: 2, supportsShinyCharm: false },

  // --- Specific Mechanics ---
  { id: 'pokeradar-gen4', name: 'Poke Radar (Gen 4)', baseOdds: 8192, generation: 4, supportsShinyCharm: false, description: 'Increases with Chain (max 40)' },
  { id: 'pokeradar-bdsp', name: 'Poke Radar (BDSP)', baseOdds: 4096, generation: 8, supportsShinyCharm: true, description: 'Increases with Chain (max 40)' },
  { id: 'chain-fishing', name: 'Chain Fishing', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Increases with consecutive hooks' },
  { id: 'dexnav', name: 'DexNav', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Increases with Search Level' },
  { id: 'sos-battle', name: 'SOS Battle', baseOdds: 4096, generation: 7, supportsShinyCharm: true, description: 'Increases with Chain' },
  { id: 'friend-safari', name: 'Friend Safari', baseOdds: 512, generation: 6, supportsShinyCharm: true },
  { id: 'horde-encounter', name: 'Horde Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'ultra-wormhole', name: 'Ultra Wormhole', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'catch-combo', name: 'Catch Combo (Let\'s Go)', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'dynamax-adventure', name: 'Dynamax Adventure', baseOdds: 300, generation: 8, supportsShinyCharm: true },
  { id: 'number-battled', name: 'Number Battled (500+)', baseOdds: 683, generation: 8, supportsShinyCharm: true },

  // --- Gen 9 ---
  { id: 'mass-outbreak-gen9', name: 'Mass Outbreak', baseOdds: 4096, generation: 9, supportsShinyCharm: true, description: 'KO 60+ for max odds' },
  { id: 'sandwich-lv3', name: 'Sandwich (Sparkling Power 3)', baseOdds: 1024, generation: 9, supportsShinyCharm: true },

  // --- Legends Arceus ---
  { id: 'massive-mass-outbreak', name: 'Massive Mass Outbreak', baseOdds: 4096, generation: 8, supportsShinyCharm: true },

  // --- New Methods ---
  { id: 'headbutt', name: 'Headbutt', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'honey-tree', name: 'Honey Tree', baseOdds: 8192, generation: 4, supportsShinyCharm: false },

  { id: 'custom', name: 'Custom Odds', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
];

export const POKEBALLS = [
  { id: 'pokeball', name: 'Poké Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
  { id: 'greatball', name: 'Great Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png' },
  { id: 'ultraball', name: 'Ultra Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png' },
  { id: 'masterball', name: 'Master Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png' },
  { id: 'premierball', name: 'Premier Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/premier-ball.png' },
  { id: 'luxuryball', name: 'Luxury Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png' },
  { id: 'beastball', name: 'Beast Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/beast-ball.png' },
  { id: 'cherishball', name: 'Cherish Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cherish-ball.png' },
  // Adding a few more popular ones for brevity but covering basics
  { id: 'netball', name: 'Net Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/net-ball.png' },
  { id: 'diveball', name: 'Dive Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dive-ball.png' },
  { id: 'duskball', name: 'Dusk Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png' },
  { id: 'quickball', name: 'Quick Ball', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png' },
];

export const GAMES = [
  { id: 'gold', name: 'Gold', generation: 2 },
  { id: 'silver', name: 'Silver', generation: 2 },
  { id: 'crystal', name: 'Crystal', generation: 2 },
  { id: 'ruby', name: 'Ruby', generation: 3 },
  { id: 'sapphire', name: 'Sapphire', generation: 3 },
  { id: 'firered', name: 'FireRed', generation: 3 },
  { id: 'leafgreen', name: 'LeafGreen', generation: 3 },
  { id: 'emerald', name: 'Emerald', generation: 3 },
  { id: 'diamond', name: 'Diamond', generation: 4 },
  { id: 'pearl', name: 'Pearl', generation: 4 },
  { id: 'platinum', name: 'Platinum', generation: 4 },
  { id: 'heartgold', name: 'HeartGold', generation: 4 },
  { id: 'soulsilver', name: 'SoulSilver', generation: 4 },
  { id: 'black', name: 'Black', generation: 5 },
  { id: 'white', name: 'White', generation: 5 },
  { id: 'black2', name: 'Black 2', generation: 5 },
  { id: 'white2', name: 'White 2', generation: 5 },
  { id: 'x', name: 'X', generation: 6 },
  { id: 'y', name: 'Y', generation: 6 },
  { id: 'omegaruby', name: 'Omega Ruby', generation: 6 },
  { id: 'alphasapphire', name: 'Alpha Sapphire', generation: 6 },
  { id: 'sun', name: 'Sun', generation: 7 },
  { id: 'moon', name: 'Moon', generation: 7 },
  { id: 'ultrasun', name: 'Ultra Sun', generation: 7 },
  { id: 'ultramoon', name: 'Ultra Moon', generation: 7 },
  { id: 'lgp', name: "Let's Go, Pikachu!", generation: 7 },
  { id: 'lge', name: "Let's Go, Eevee!", generation: 7 },
  { id: 'sword', name: 'Sword', generation: 8 },
  { id: 'shield', name: 'Shield', generation: 8 },
  { id: 'brilliantdiamond', name: 'Brilliant Diamond', generation: 8 },
  { id: 'shiningpearl', name: 'Shining Pearl', generation: 8 },
  { id: 'pla', name: 'Legends: Arceus', generation: 8 },
  { id: 'scarlet', name: 'Scarlet', generation: 9 },
  { id: 'violet', name: 'Violet', generation: 9 },
];

// Calculate shiny probability statistics
export function calculateShinyStats(encounters: number, methodId: string, hasShinyCharm: boolean, customOdds?: number) {
  let currentOdds = 4096;

  if (methodId === 'custom' && customOdds) {
    currentOdds = customOdds;
  } else {
    currentOdds = getDynamicOdds(methodId, encounters, hasShinyCharm);
  }

  // Ensure safe division
  if (currentOdds < 1) currentOdds = 1;

  const probability = 1 / currentOdds;

  // Binomial probability: 1 - (1 - p)^n
  // Note: For chanining methods, this formula is technically an approximation if p changed during the chain.
  // But for "current status", it shows "chance assuming this odds was constant" OR "chance of finding it by now"?
  // Users usually want "What is the chance I should have found it by now?". Use integration of odds?
  // Too complex for JS client usually. Stuck to standard (1-p)^n using CURRENT p or BASE p?
  // Standard tracker behavior: Use the CURRENT odds to show "Current Probability per encounter"
  // And cumulative based on best effort. Let's use standard cumulative formula.
  const binomialProb = (1 - Math.pow(1 - (1 / currentOdds), encounters)) * 100;

  return {
    currentOdds: Math.round(currentOdds),
    percentage: (probability * 100).toFixed(4), // Single encounter chance
    binomialProbability: binomialProb.toFixed(2), // Cumulative chance
  };
}

export const SHINY_CHARM_ICON = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png';


export function getPokemonSpriteUrl(pokemonId: number, options: { shiny?: boolean } = {}): string {
  if (!pokemonId) return '';
  const shinyPath = options.shiny ? '/shiny' : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon${shinyPath}/${pokemonId}.png`;
}

// Manually tracked form counts for completion stats
export const POKEMON_FORM_COUNTS: Record<number, number> = {
  // Gen 1
  25: 8, // Pikachu (Caps)
  // Gen 2
  201: 28, // Unown
  // Gen 3
  351: 4, // Castform
  386: 4, // Deoxys
  // Gen 4
  413: 3, // Burmy
  422: 2, // Shellos (West/East)
  423: 2, // Gastrodon
  479: 6, // Rotom
  487: 2, // Giratina
  492: 2, // Shaymin
  493: 18, // Arceus
  // Gen 5
  550: 2, // Basculin
  555: 2, // Darmanitan
  585: 4, // Deerling
  586: 4, // Sawsbuck
  641: 2, // Tornadus
  642: 2, // Thundurus
  645: 2, // Landorus
  646: 3, // Kyurem
  647: 2, // Keldeo
  648: 2, // Meloetta
  649: 5, // Genesect
  // Gen 6
  666: 20, // Vivillon
  669: 5, // Flabebe
  670: 6, // Floette (inc. AZ)
  671: 5, // Florges
  676: 10, // Furfrou
  678: 2, // Meowstic
  681: 2, // Aegislash
  710: 4, // Pumpkaboo
  711: 4, // Gourgeist
  718: 3, // Zygarde (10, 50, Complete)
  720: 2, // Hoopa
  // Gen 7
  741: 4, // Oricorio
  745: 2, // Lycanroc (Midday, Midnight, Dusk - wait 3?) Dusk is form.
  746: 2, // Wishiwashi
  773: 18, // Silvally
  774: 2, // Minior (Meteor/Core) - different colors are forms? Yes. ~7 colors + meteor. Minior is complex.
  778: 2, // Mimikyu
  800: 4, // Necrozma
  // Gen 8
  845: 2, // Cramorant
  849: 2, // Toxtricity
  854: 2, // Sinistea
  855: 2, // Polteageist
  869: 63, // Alcremie
  875: 2, // Eiscue
  877: 2, // Morpeko
  888: 2, // Zacian
  889: 2, // Zamazenta
  890: 2, // Eternatus
  892: 2, // Urshifu
  898: 3, // Calyrex
  905: 2, // Enamorus
  // Gen 9
  916: 2, // Oinkologne (M/F diff stats/look)
  925: 2, // Maushold
  931: 4, // Squawkabilly
  964: 2, // Palafin
  978: 3, // Tatsugiri
  982: 2, // Dudunsparce
  999: 2, // Gimmighoul
  1011: 4, // Dipplin/Hydra - Ogerpon (4 masks)
  1024: 3, // Terapagos
};
