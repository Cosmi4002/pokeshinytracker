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

  const charmRolls = hasShinyCharm ? 2 : 0;

  // --- Gen 2 ---
  if (methodId === 'gen2-breeding-shiny') return 64;
  if (methodId === 'gen2-odd-egg') return 128;

  // --- Gen 4 ---
  if (methodId === 'gen4-masuda') return 1639;
  if (methodId === 'gen4-pokeradar') {
    const chain = Math.min(encounters, 40);
    if (chain >= 40) return 200;
    if (chain >= 30) return 1300 + (40 - chain) * 200;
    return 8192;
  }

  // --- Gen 5 ---
  if (methodId === 'gen5-masuda') return hasShinyCharm ? 1024 : 1366;

  // --- Gen 6 ---
  if (methodId === 'gen6-masuda') return hasShinyCharm ? 512 : 683;
  if (methodId === 'gen6-chain-fishing') {
    const chain = Math.min(encounters, 20);
    const bonusRolls = 2 * chain;
    const totalRolls = 1 + bonusRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }
  if (methodId === 'gen6-dexnav') {
    if (encounters >= 999) return hasShinyCharm ? 173 : 200;
    return hasShinyCharm ? 512 : 600;
  }
  if (methodId === 'gen6-horde') {
    const totalRolls = 5 + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }

  // --- Gen 7 ---
  if (methodId === 'gen7-masuda') return hasShinyCharm ? 512 : 683;
  if (methodId === 'gen7-sos') {
    const chain = encounters % 256;
    let extraRolls = 0;
    if (chain >= 31) extraRolls = 12;
    else if (chain >= 21) extraRolls = 8;
    else if (chain >= 11) extraRolls = 4;
    const totalRolls = 1 + extraRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }
  if (methodId === 'gen7-lgpe-combo') {
    let comboRolls = 0;
    if (encounters >= 31) comboRolls = 11;
    else if (encounters >= 21) comboRolls = 8;
    else if (encounters >= 11) comboRolls = 4;
    const totalRolls = 1 + comboRolls + charmRolls;
    return Math.round(4096 / totalRolls);
  }
  if (methodId === 'gen7-wormhole') return hasShinyCharm ? 100 : 300;

  // --- Gen 8 ---
  if (methodId === 'gen8-masuda' || methodId === 'gen8-bdsp-masuda') return hasShinyCharm ? 512 : 683;
  if (methodId === 'gen8-murder') return hasShinyCharm ? 512 : 683;
  if (methodId === 'gen8-dynamax') return hasShinyCharm ? 100 : 300;
  if (methodId === 'gen8-bdsp-pokeradar') {
    const chain = Math.min(encounters, 40);
    if (chain >= 40) return 99;
    return 4096;
  }
  if (methodId === 'pla-massive') {
    const totalRolls = 1 + 12 + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }

  // --- Gen 9 ---
  if (methodId === 'gen9-masuda') return hasShinyCharm ? 512 : 683;
  if (methodId === 'gen9-outbreak') {
    let outbreakRolls = 0;
    if (encounters >= 60) outbreakRolls = 2;
    else if (encounters >= 30) outbreakRolls = 1;
    const totalRolls = 1 + outbreakRolls + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }
  if (methodId === 'gen9-sandwich-lv3') {
    const totalRolls = 1 + 3 + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }
  if (methodId === 'gen9-outbreak-sandwich') {
    const totalRolls = 1 + 2 + 3 + (hasShinyCharm ? 2 : 0);
    return Math.round(4096 / totalRolls);
  }

  if (methodId === 'gen4-double-encounter' || methodId === 'gen5-double-encounter') {
    const totalRolls = 2 + (hasShinyCharm ? (method.generation >= 5 ? 2 : 0) : 0);
    return Math.round(8192 / totalRolls);
  }

  if (methodId.includes('gift') || methodId.includes('event')) {
    return method.baseOdds;
  }

  // Default logic
  const baseDenominator = method.baseOdds;
  if (hasShinyCharm && method.supportsShinyCharm) {
    if (method.generation >= 5) {
      return Math.round(baseDenominator / 3);
    }
  }

  return baseDenominator;
};

export const HUNTING_METHODS: HuntingMethod[] = [
  // --- Gen 2 ---
  { id: 'gen2-breeding-shiny', name: 'Breeding (Shiny Parent)', baseOdds: 64, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-headbutt', name: 'Headbutt', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-odd-egg', name: 'Odd Egg', baseOdds: 128, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-random', name: 'Random Encounter', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-roaming', name: 'Roaming Encounter', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 2, supportsShinyCharm: false },

  // --- Gen 3 ---
  { id: 'gen3-fishing', name: 'Fishing', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-random', name: 'Random Encounter', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-roaming', name: 'Roaming', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-runaway', name: 'Runaway', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 3, supportsShinyCharm: false },

  // --- Gen 4 ---
  { id: 'gen4-double-encounter', name: 'Double Encounter', baseOdds: 4096, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-fishing', name: 'Fishing', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-headbutt', name: 'Headbutt', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-honey-tree', name: 'Honey Tree', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-masuda', name: 'Masuda Method', baseOdds: 1639, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-pokeradar', name: 'Poke Radar', baseOdds: 8192, generation: 4, supportsShinyCharm: false, description: 'Increases with Chain' },
  { id: 'gen4-random', name: 'Random Encounter', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-roaming', name: 'Roaming', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-runaway', name: 'Runaway', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 4, supportsShinyCharm: false },

  // --- Gen 5 ---
  { id: 'gen5-double-encounter', name: 'Double Encounter', baseOdds: 4096, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-dust-clouds', name: 'Dust Clouds', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-masuda', name: 'Masuda Method', baseOdds: 1366, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-random', name: 'Random Encounter', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-rippling-waters', name: 'Rippling Waters', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-rustling-grass', name: 'Rustling Grass', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 5, supportsShinyCharm: true },

  // --- Gen 6 ---
  { id: 'gen6-chain-fishing', name: 'Chain Fishing', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Increases with consecutive hooks' },
  { id: 'gen6-dexnav', name: 'DexNav', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Increases with Search Level' },
  { id: 'gen6-friend-safari', name: 'Friend Safari', baseOdds: 512, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-horde', name: 'Horde Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-masuda', name: 'Masuda Method', baseOdds: 683, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-random', name: 'Random Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-runaway', name: 'Runaway', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 6, supportsShinyCharm: true },

  // --- Gen 7 ---
  { id: 'gen7-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-lgpe-combo', name: 'Let\'s Go Catch Combo', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-lgpe-random', name: 'Let\'s Go Random', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-masuda', name: 'Masuda Method', baseOdds: 683, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-random', name: 'Random Encounter', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-runaway', name: 'Runaway', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-sos', name: 'SOS Battle', baseOdds: 4096, generation: 7, supportsShinyCharm: true, description: 'Increases with Chain' },
  { id: 'gen7-wormhole', name: 'Ultra Wormhole', baseOdds: 4096, generation: 7, supportsShinyCharm: true },

  // --- Gen 8 ---
  { id: 'gen8-bdsp-masuda', name: 'BDSP Masuda', baseOdds: 683, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-bdsp-pokeradar', name: 'BDSP Poke Radar', baseOdds: 4096, generation: 8, supportsShinyCharm: true, description: 'Increases with Chain' },
  { id: 'gen8-dynamax', name: 'Dynamax Adventure', baseOdds: 300, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-masuda', name: 'Masuda Method', baseOdds: 683, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-murder', name: 'Number Battled (500+)', baseOdds: 683, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-random', name: 'Random Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 8, supportsShinyCharm: true },

  // --- Legends Arceus ---
  { id: 'pla-massive', name: 'Massive Mass Outbreak', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'pla-random', name: 'Random Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true },

  // --- Gen 9 ---
  { id: 'gen9-outbreak', name: 'Mass Outbreak', baseOdds: 4096, generation: 9, supportsShinyCharm: true, description: 'KO 60+' },
  { id: 'gen9-masuda', name: 'Masuda Method', baseOdds: 683, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-outbreak-sandwich', name: 'Outbreak + Sandwich Lv3', baseOdds: 683, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-random', name: 'Random Encounter', baseOdds: 4096, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-sandwich-lv3', name: 'Sandwich (Sparkling Power 3)', baseOdds: 1024, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 9, supportsShinyCharm: true },

  // --- Event & Custom ---
  { id: 'event', name: 'Event', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
  { id: 'custom', name: 'Custom Odds', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
];

export const POKEBALLS = [
  { id: 'pokeball', name: 'Poké Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/poke.png' },
  { id: 'greatball', name: 'Great Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/great.png' },
  { id: 'ultraball', name: 'Ultra Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/ultra.png' },
  { id: 'masterball', name: 'Master Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/master.png' },
  { id: 'safariball', name: 'Safari Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/safari.png' },
  { id: 'sportball', name: 'Sport Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/sport.png' },
  { id: 'netball', name: 'Net Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/net.png' },
  { id: 'diveball', name: 'Dive Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/dive.png' },
  { id: 'nestball', name: 'Nest Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/nest.png' },
  { id: 'repeatball', name: 'Repeat Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/repeat.png' },
  { id: 'timerball', name: 'Timer Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/timer.png' },
  { id: 'luxuryball', name: 'Luxury Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/luxury.png' },
  { id: 'premierball', name: 'Premier Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/premier.png' },
  { id: 'duskball', name: 'Dusk Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/dusk.png' },
  { id: 'healball', name: 'Heal Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/heal.png' },
  { id: 'quickball', name: 'Quick Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/quick.png' },
  { id: 'cherishball', name: 'Cherish Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/cherish.png' },
  { id: 'fastball', name: 'Fast Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/fast.png' },
  { id: 'levelball', name: 'Level Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/level.png' },
  { id: 'lureball', name: 'Lure Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/lure.png' },
  { id: 'heavyball', name: 'Heavy Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/heavy.png' },
  { id: 'loveball', name: 'Love Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/love.png' },
  { id: 'friendball', name: 'Friend Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/friend.png' },
  { id: 'moonball', name: 'Moon Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/moon.png' },
  { id: 'beastball', name: 'Beast Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/beast.png' },
  { id: 'dreamball', name: 'Dream Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/dream.png' },
  { id: 'featherball', name: 'Feather Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/feather.png' },
  { id: 'wingball', name: 'Wing Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/wing.png' },
  { id: 'jetball', name: 'Jet Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/jet.png' },
  { id: 'leadenball', name: 'Leaden Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/leaden.png' },
  { id: 'gigatonball', name: 'Gigaton Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/gigaton.png' },
  { id: 'originball', name: 'Origin Ball', sprite: 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/origin.png' },
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


// Helper to get generation from method ID
export const getGenerationFromMethod = (methodId: string): number => {
  const method = HUNTING_METHODS.find(m => m.id === methodId);
  return method ? method.generation : 9; // Default to 9 (Modern)
};

// Helper to normalize Pokemon names for Showdown sprites
export const toShowdownSlug = (name: string): string => {
  if (!name) return '';
  let slug = name.toLowerCase()
    .replace('’', '')
    .replace('\'', '')
    .replace('%', '')
    .replace(':', '')
    .replace(' ', '')
    .replace('.', '')
    .replace('♀', 'f')
    .replace('♂', 'm');

  // Handle specific forms for Showdown
  if (slug === 'pikachu-partner-cap') return 'pikachu-partner';
  if (slug === 'zygarde-50') return 'zygarde';

  // Seasonal forms for Showdown mapping
  if (slug.includes('deerling-') || slug.includes('sawsbuck-')) {
    // Showdown uses simple suffix if not standard
    return slug;
  }

  return slug;
};

import spriteMapping from './sprite-mapping.json';

const MAPPING: Record<string, string> = spriteMapping;

export function getPokemonSpriteUrl(pokemonId: number, options: { shiny?: boolean, name?: string, female?: boolean, form?: string, animated?: boolean } = {}): string {
  if (!pokemonId) return '';

  const { shiny = false, female = false, name, form } = options;

  // 1. Try mapping for forms first (likely missing externally)
  const keysToTry = [];
  if (form) keysToTry.push(form);
  if (name) {
    const slug = toShowdownSlug(name);
    keysToTry.push(slug);
    if (slug.includes('-')) {
      const parts = slug.split('-');
      keysToTry.push(`${pokemonId}-${parts.slice(1).join('-')}`);
    }
  }

  for (const key of keysToTry) {
    // Only use local mapping for complex forms or high IDs (Gen 9+)
    // Standard Pokédex entries are better externally (lighter/faster)
    if (MAPPING[key] && (key.includes('-') || pokemonId > 905)) {
      return `/sprites/${MAPPING[key]}`;
    }
  }

  // 2. Prefer Showdown for animated sprites (standard names)
  if (name) {
    const slug = toShowdownSlug(name);
    const prefix = shiny ? 'ani-shiny' : 'ani';
    return `https://play.pokemonshowdown.com/sprites/${prefix}/${slug}.gif`;
  }

  // 3. Last fallback: static sprites from PokeAPI
  const path = shiny ? '/shiny' : '';
  const genderPath = female ? '/female' : '';

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon${path}${genderPath}/${pokemonId}.png`;
}

// Alias for transition compatibility
export const getGameSpecificSpriteUrl = (id: number, methodId: string, name?: string) =>
  getPokemonSpriteUrl(id, { shiny: true, name });

export function getShinyCharmIcon(): string {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png';
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
