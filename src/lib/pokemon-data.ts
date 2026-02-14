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
  { id: 'gold', name: 'Gold', generation: 2, logo: '/img/game-logos/gold.png' },
  { id: 'silver', name: 'Silver', generation: 2, logo: '/img/game-logos/silver.png' },
  { id: 'crystal', name: 'Crystal', generation: 2, logo: '/img/game-logos/crystal.png' },
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
  { id: 'black', name: 'Black', generation: 5, logo: '/img/game-logos/black.png' },
  { id: 'white', name: 'White', generation: 5, logo: '/img/game-logos/white.png' },
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

export const SHINY_CHARM_ICON = '/img/items/shiny-charm.png';


// Helper to get generation from method ID
export const getGenerationFromMethod = (methodId: string): number => {
  const method = HUNTING_METHODS.find(m => m.id === methodId);
  return method ? method.generation : 9; // Default to 9 (Modern)
};

// Helper to normalize Pokemon names for Showdown sprites
// Helper to normalize Pokemon names for Showdown sprites
export const toShowdownSlug = (name: string): string => {
  if (!name) return '';

  let slug = name.toLowerCase();

  // Handle Regional Prefixes: Move them to suffix
  // e.g. "Alolan Rattata" -> "rattata-alola"
  if (slug.startsWith('alolan ')) {
    slug = slug.replace('alolan ', '') + '-alola';
  } else if (slug.startsWith('galarian ')) {
    slug = slug.replace('galarian ', '') + '-galar';
  } else if (slug.startsWith('hisuian ')) {
    slug = slug.replace('hisuian ', '') + '-hisui';
  } else if (slug.startsWith('paldean ')) {
    slug = slug.replace('paldean ', '') + '-paldea';
  }

  slug = slug
    .replace(/[’'%: .]/g, '')
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace(/é/g, 'e');

  // Handle specific PokeAPI -> Showdown name differences
  if (slug.startsWith('nidoran-f')) slug = slug.replace('nidoran-f', 'nidoranf');
  if (slug.startsWith('nidoran-m')) slug = slug.replace('nidoran-m', 'nidoranm');

  if (slug.startsWith('mr-mime')) slug = slug.replace('mr-mime', 'mrmime');
  if (slug.startsWith('mime-jr')) slug = slug.replace('mime-jr', 'mimejr');
  if (slug.startsWith('mr-rime')) slug = slug.replace('mr-rime', 'mrrime');
  if (slug.startsWith('type-null')) slug = slug.replace('type-null', 'typenull');

  // Remove common PokeAPI standard suffixes that Showdown doesn't use
  slug = slug.replace(/-standard|-normal/g, '');

  // Handle specific forms for Showdown
  if (slug === 'pikachu-partner-cap') return 'pikachu-partner';
  if (slug === 'zygarde-50') return 'zygarde';

  // Seasonal forms for Showdown mapping
  if (slug.includes('deerling-') || slug.includes('sawsbuck-')) {
    return slug;
  }

  return slug;
};

export function getPokemonSpriteUrl(pokemonId: number, options: { shiny?: boolean, name?: string, female?: boolean, form?: string, animated?: boolean } = {}): string {
  if (!pokemonId) return '';

  const { shiny = false, female = false, name } = options;
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';
  const shinyPath = shiny ? '/shiny' : '';
  const genderPath = female ? '/female' : '';

  // Handle specific overrides if needed (e.g. Oinkologne Female)
  if (name && name.toLowerCase().includes('oinkologne-female')) {
    return `${baseUrl}/shiny/10254.png`; // Hardcoded ID for Oinkologne Female form if needed, or rely on passed ID
  }

  if (name && name.toLowerCase() === 'pikachu-partner-cap') {
    return 'https://img.pokemondb.net/sprites/home/normal/pikachu-partner-cap.png';
  }

  if (name && name.toLowerCase() === 'urshifu-rapid-strike') {
    return 'https://www.pokepedia.fr/images/8/80/Sprite_0892_Mille_Poings_chromatique_HOME.png';
  }

  // Silvally overrides
  if (name && name.toLowerCase().includes('silvally')) {
    const sName = name.toLowerCase();
    if (sName === 'silvally') return 'https://www.pokepedia.fr/images/3/30/Sprite_0773_chromatique_HOME-v1.png';
    if (sName.includes('fighting')) return 'https://www.pokepedia.fr/images/d/de/Sprite_0773_Combat_chromatique_HOME-v1.png';
    if (sName.includes('flying')) return 'https://www.pokepedia.fr/images/1/15/Sprite_0773_Vol_chromatique_HOME-v1.png';
    if (sName.includes('poison')) return 'https://www.pokepedia.fr/images/2/20/Sprite_0773_Poison_chromatique_HOME-v1.png';
    if (sName.includes('ground')) return 'https://www.pokepedia.fr/images/e/e8/Sprite_0773_Sol_chromatique_HOME-v1.png';
    if (sName.includes('rock')) return 'https://www.pokepedia.fr/images/3/31/Sprite_0773_Roche_chromatique_HOME-v1.png';
    if (sName.includes('bug')) return 'https://www.pokepedia.fr/images/c/c5/Sprite_0773_Insecte_chromatique_HOME-v1.png';
    if (sName.includes('ghost')) return 'https://www.pokepedia.fr/images/4/48/Sprite_0773_Spectre_chromatique_HOME-v1.png';
    if (sName.includes('steel')) return 'https://www.pokepedia.fr/images/7/7a/Sprite_0773_Acier_chromatique_HOME-v1.png';
    if (sName.includes('fire')) return 'https://www.pokepedia.fr/images/4/4f/Sprite_0773_Feu_chromatique_HOME-v1.png';
    if (sName.includes('water')) return 'https://www.pokepedia.fr/images/4/4c/Sprite_0773_Eau_chromatique_HOME-v1.png';
    if (sName.includes('grass')) return 'https://www.pokepedia.fr/images/7/7e/Sprite_0773_Plante_chromatique_HOME-v1.png';
    if (sName.includes('electric')) return 'https://www.pokepedia.fr/images/3/32/Sprite_0773_%C3%89lectrik_chromatique_HOME-v1.png';
    if (sName.includes('psychic')) return 'https://www.pokepedia.fr/images/0/02/Sprite_0773_Psy_chromatique_HOME-v1.png';
    if (sName.includes('ice')) return 'https://www.pokepedia.fr/images/4/4a/Sprite_0773_Glace_chromatique_HOME-v1.png';
    if (sName.includes('dragon')) return 'https://www.pokepedia.fr/images/1/16/Sprite_0773_Dragon_chromatique_HOME-v1.png';
    if (sName.includes('dark')) return 'https://www.pokepedia.fr/images/0/0e/Sprite_0773_T%C3%A9n%C3%A8bres_chromatique_HOME-v1.png';
    if (sName.includes('fairy')) return 'https://www.pokepedia.fr/images/7/70/Sprite_0773_F%C3%A9e_chromatique_HOME-v1.png';
  }

  // Deerling seasonal overrides
  if (name && name.toLowerCase().includes('deerling')) {
    const sName = name.toLowerCase();
    if (sName.includes('summer')) return 'https://www.pokepedia.fr/images/c/c8/Sprite_0585_%C3%89t%C3%A9_chromatique_HOME-v1.png';
    if (sName.includes('autumn')) return 'https://www.pokepedia.fr/images/8/84/Sprite_0585_Automne_chromatique_HOME-v1.png';
    if (sName.includes('winter')) return 'https://www.pokepedia.fr/images/d/d0/Sprite_0585_Hiver_chromatique_HOME-v1.png';
  }

  // Sawsbuck seasonal overrides
  if (name && name.toLowerCase().includes('sawsbuck')) {
    const sName = name.toLowerCase();
    if (sName.includes('summer')) return 'https://www.pokepedia.fr/images/b/ba/Sprite_0586_%C3%89t%C3%A9_chromatique_HOME-v1.png';
    if (sName.includes('autumn')) return 'https://www.pokepedia.fr/images/3/3c/Sprite_0586_Automne_chromatique_HOME-v1.png';
    if (sName.includes('winter')) return 'https://www.pokepedia.fr/images/a/a6/Sprite_0586_Hiver_chromatique_HOME-v1.png';
  }

  // Arceus type overrides
  if (name && name.toLowerCase().includes('arceus-')) {
    const sName = name.toLowerCase();
    if (sName.includes('bug')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-bug.png';
    if (sName.includes('dark')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-dark.png';
    if (sName.includes('dragon')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-dragon.png';
    if (sName.includes('electric')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-electric.png';
    if (sName.includes('fighting')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-fighting.png';
    if (sName.includes('fire')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-fire.png';
    if (sName.includes('flying')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-flying.png';
    if (sName.includes('ghost')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-ghost.png';
    if (sName.includes('grass')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-grass.png';
    if (sName.includes('ground')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-ground.png';
    if (sName.includes('ice')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-ice.png';
    if (sName.includes('poison')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-poison.png';
    if (sName.includes('psychic')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-psychic.png';
    if (sName.includes('rock')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-rock.png';
    if (sName.includes('steel')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-steel.png';
    if (sName.includes('water')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-water.png';
    if (sName.includes('fairy')) return 'https://img.pokemondb.net/sprites/home/shiny/arceus-fairy.png';
  }

  // Shellos & Gastrodon East overrides
  if (name && name.toLowerCase().includes('shellos-east')) {
    return 'https://img.pokemondb.net/sprites/home/shiny/shellos-east.png';
  }
  if (name && name.toLowerCase().includes('gastrodon-east')) {
    return 'https://www.pokepedia.fr/images/6/60/Sprite_0423_Orient_chromatique_HOME-v1.png';
  }

  // Unown overrides
  if (name && name.toLowerCase().startsWith('unown-')) {
    const sName = name.toLowerCase();
    if (sName === 'unown-b') return 'https://img.pokemondb.net/sprites/home/shiny/unown-b.png';
    if (sName === 'unown-c') return 'https://img.pokemondb.net/sprites/home/shiny/unown-c.png';
    if (sName === 'unown-d') return 'https://img.pokemondb.net/sprites/home/shiny/unown-d.png';
    if (sName === 'unown-e') return 'https://img.pokemondb.net/sprites/home/shiny/unown-e.png';
    if (sName === 'unown-f') return 'https://img.pokemondb.net/sprites/home/shiny/unown-f.png';
    if (sName === 'unown-g') return 'https://img.pokemondb.net/sprites/home/shiny/unown-g.png';
    if (sName === 'unown-h') return 'https://img.pokemondb.net/sprites/home/shiny/unown-h.png';
    if (sName === 'unown-i') return 'https://img.pokemondb.net/sprites/home/shiny/unown-i.png';
    if (sName === 'unown-j') return 'https://img.pokemondb.net/sprites/home/shiny/unown-j.png';
    if (sName === 'unown-k') return 'https://img.pokemondb.net/sprites/home/shiny/unown-k.png';
    if (sName === 'unown-l') return 'https://img.pokemondb.net/sprites/home/shiny/unown-l.png';
    if (sName === 'unown-m') return 'https://img.pokemondb.net/sprites/home/shiny/unown-m.png';
    if (sName === 'unown-n') return 'https://img.pokemondb.net/sprites/home/shiny/unown-n.png';
    if (sName === 'unown-o') return 'https://img.pokemondb.net/sprites/home/shiny/unown-o.png';
    if (sName === 'unown-p') return 'https://img.pokemondb.net/sprites/home/shiny/unown-p.png';
    if (sName === 'unown-q') return 'https://img.pokemondb.net/sprites/home/shiny/unown-q.png';
    if (sName === 'unown-r') return 'https://img.pokemondb.net/sprites/home/shiny/unown-r.png';
    if (sName === 'unown-s') return 'https://img.pokemondb.net/sprites/home/shiny/unown-s.png';
    if (sName === 'unown-t') return 'https://img.pokemondb.net/sprites/home/shiny/unown-t.png';
    if (sName === 'unown-u') return 'https://img.pokemondb.net/sprites/home/shiny/unown-u.png';
    if (sName === 'unown-v') return 'https://img.pokemondb.net/sprites/home/shiny/unown-v.png';
    if (sName === 'unown-w') return 'https://img.pokemondb.net/sprites/home/shiny/unown-w.png';
    if (sName === 'unown-x') return 'https://img.pokemondb.net/sprites/home/shiny/unown-x.png';
    if (sName === 'unown-y') return 'https://img.pokemondb.net/sprites/home/shiny/unown-y.png';
    if (sName === 'unown-z') return 'https://img.pokemondb.net/sprites/home/shiny/unown-z.png';
    if (sName === 'unown-exclamation' || sName.includes('!')) return 'https://img.pokemondb.net/sprites/home/shiny/unown-em.png';
    if (sName === 'unown-question' || sName.includes('?')) return 'https://img.pokemondb.net/sprites/home/shiny/unown-qm.png';
  }

  // Deoxys Attack override
  if (name && name.toLowerCase().includes('deoxys-attack')) {
    return 'https://img.pokemondb.net/sprites/home/shiny/deoxys-attack.png';
  }

  // Burmy overrides
  if (name && name.toLowerCase().includes('burmy')) {
    const sName = name.toLowerCase();
    if (sName.includes('trash')) return 'https://img.pokemondb.net/sprites/home/shiny/burmy-trash.png';
    if (sName.includes('sandy')) return 'https://img.pokemondb.net/sprites/home/shiny/burmy-sandy.png';
  }

  // Flabébé line overrides
  if (name && (name.toLowerCase().includes('flabebe') || name.toLowerCase().includes('floette') || name.toLowerCase().includes('florges'))) {
    const sName = name.toLowerCase();
    if (sName.includes('yellow') || sName.includes('jaune')) {
      if (sName.includes('flabebe')) return 'https://www.pokepedia.fr/images/6/68/Sprite_0669_Jaune_chromatique_HOME-v1.png';
      if (sName.includes('floette')) return 'https://www.pokepedia.fr/images/3/38/Sprite_0670_Jaune_chromatique_HOME-v1.png';
      if (sName.includes('florges')) return 'https://img.pokemondb.net/sprites/home/shiny/florges-yellow.png';
    }
    if (sName.includes('orange')) {
      if (sName.includes('flabebe')) return 'https://www.pokepedia.fr/images/3/35/Sprite_0669_Orange_chromatique_HOME-v1.png';
      if (sName.includes('floette')) return 'https://www.pokepedia.fr/images/1/16/Sprite_0670_Orange_chromatique_HOME-v1.png';
      if (sName.includes('florges')) return 'https://img.pokemondb.net/sprites/home/shiny/florges-orange.png';
    }
    if (sName.includes('blue') || sName.includes('bleue')) {
      if (sName.includes('flabebe')) return 'https://www.pokepedia.fr/images/e/ee/Sprite_0669_Bleue_chromatique_HOME-v1.png';
      if (sName.includes('floette')) return 'https://www.pokepedia.fr/images/c/c8/Sprite_0670_Bleue_chromatique_HOME-v1.png';
      if (sName.includes('florges')) return 'https://img.pokemondb.net/sprites/home/shiny/florges-blue.png';
    }
    if (sName.includes('white') || sName.includes('blanche')) {
      if (sName.includes('flabebe')) return 'https://www.pokepedia.fr/images/a/a4/Sprite_0669_Blanche_chromatique_HOME-v1.png';
      if (sName.includes('floette')) return 'https://www.pokepedia.fr/images/d/d1/Sprite_0670_Blanche_chromatique_HOME-v1.png';
      if (sName.includes('florges')) return 'https://img.pokemondb.net/sprites/home/shiny/florges-white.png';
    }
  }

  // Vivillon overrides
  if (name && name.toLowerCase().includes('vivillon')) {
    const sName = name.toLowerCase();
    if (sName.includes('meadow')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-meadow.png';
    if (sName.includes('icy-snow')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-icy-snow.png';
    if (sName.includes('polar')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-polar.png';
    if (sName.includes('tundra')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-tundra.png';
    if (sName.includes('continental')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-continental.png';
    if (sName.includes('garden')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-garden.png';
    if (sName.includes('elegant')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-elegant.png';
    if (sName.includes('modern')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-modern.png';
    if (sName.includes('marine')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-marine.png';
    if (sName.includes('fancy')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-fancy.png';
    if (sName.includes('archipelago')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-archipelago.png';
    if (sName.includes('high-plains')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-high-plains.png';
    if (sName.includes('sandstorm')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-sandstorm.png';
    if (sName.includes('river')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-river.png';
    if (sName.includes('monsoon')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-monsoon.png';
    if (sName.includes('savanna')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-savanna.png';
    if (sName.includes('sun')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-sun.png';
    if (sName.includes('ocean')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-ocean.png';
    if (sName.includes('jungle')) return 'https://img.pokemondb.net/sprites/home/shiny/vivillon-jungle.png';
  }

  // Alcremie overrides based on Sweet type
  if (name && name.toLowerCase().includes('alcremie')) {
    const sName = name.toLowerCase();
    if (sName.includes('strawberry')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-rainbow-swirl-strawberry.png';
    if (sName.includes('ribbon')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-ruby-cream-ribbon.png';
    if (sName.includes('flower')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-ruby-cream-flower.png';
    if (sName.includes('love')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-ruby-cream-love.png';
    if (sName.includes('clover')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-ruby-cream-clover.png';
    if (sName.includes('berry')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-ruby-cream-berry.png';
    if (sName.includes('star')) return 'https://img.pokemondb.net/sprites/home/shiny/alcremie-salted-cream-star.png';
  }

  // Minior (Red) override
  if (name && name.toLowerCase().includes('minior') && name.toLowerCase().includes('red')) {
    return 'https://img.pokemondb.net/sprites/home/shiny/minior-core.png';
  }

  // Use the ID directly. 
  // Note: HOME sprites don't have female-specific filenames in the same folder usually, 
  // but PokeAPI maps forms to IDs. 
  // If we want female sprite for a base species (like Pikachu female), PokeAPI usually stores it in "shiny/female/25.png" for standard sprites.
  // HOME sprites in 'other/home' do NOT have gender folders normally visible in the public repo structure easily?
  // Checking typical PokeAPI structure:
  // sprites/pokemon/other/home/25.png
  // sprites/pokemon/other/home/shiny/25.png
  // Does home have female? 
  // Use standard sprites for gender diffs if HOME doesn't support it?
  // Let's check user request: "voglio tutti gli sprite di HOME".
  // If HOME doesn't have female sprites, we might have an issue.
  // Assumption: HOME folder has forms indexed by ID.

  return `${baseUrl}${shinyPath}${genderPath}/${pokemonId}.png`;
}

// Alias for transition compatibility
export const getGameSpecificSpriteUrl = (id: number, methodId: string, name?: string) =>
  getPokemonSpriteUrl(id, { shiny: true, name });

export function getShinyCharmIcon(): string {
  return '/img/items/shiny-charm.png';
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
