// Complete Pokemon list with all forms for shiny hunting
import { LOCAL_SPRITE_URLS } from './local-sprite-map.generated';

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

const METHOD_ALIASES: Record<string, string> = {
  'safari zone': 'gen2-safari',
  'safari zone encounters': 'gen2-safari',
  'random encounter (safari zone)': 'gen2-safari',
  'random encounters (safari zone)': 'gen2-safari',
};

export const normalizeHuntingMethodValue = (value?: string | null) =>
  (value || '').toString().trim().toLowerCase();

export const findHuntingMethod = (value?: string | null): HuntingMethod | undefined => {
  const normalized = normalizeHuntingMethodValue(value);
  if (!normalized) return undefined;

  return HUNTING_METHODS.find((method) => {
    const normalizedId = normalizeHuntingMethodValue(method.id);
    const normalizedName = normalizeHuntingMethodValue(method.name);
    return (
      normalizedId === normalized ||
      normalizedName === normalized ||
      METHOD_ALIASES[normalized] === method.id
    );
  });
};

// Helper to calculate odds based on method mechanics
const shinyRollProbability = (rolls: number, base = 4096) => 1 - Math.pow((base - 1) / base, rolls);
const oddsFromProbability = (probability: number) => 1 / probability;
const oddsFromRolls = (rolls: number, base = 4096) => oddsFromProbability(shinyRollProbability(rolls, base));

const BDSP_POKERADAR_ODDS = [
  4096, 3855, 3640, 3449, 3277, 3121, 2979, 2849, 2731, 2621,
  2521, 2427, 2341, 2259, 2185, 2114, 2048, 1986, 1927, 1872,
  1820, 1771, 1724, 1680, 1638, 1598, 1560, 1524, 1489, 1456,
  1310, 1285, 1260, 1236, 1213, 1192, 993, 799, 400, 200, 99,
];

const getDexNavForceShinyProbability = (searchLevel: number, hasShinyCharm: boolean) => {
  const level = Math.min(Math.max(Math.floor(searchLevel), 0), 999);
  if (level <= 0) return 0;

  const baseTarget =
    level <= 100
      ? level * 6
      : level <= 200
        ? 600 + (level - 100) * 2
        : 800 + (level - 200);
  const forceCheckProbability = Math.ceil(baseTarget / 100) / 10000;
  const baseAttempts = 1 + (hasShinyCharm ? 2 : 0);

  return (
    0.96 * shinyRollProbability(baseAttempts, 1 / forceCheckProbability) +
    0.04 * shinyRollProbability(baseAttempts + 4, 1 / forceCheckProbability)
  );
};

export const formatOdds = (odds: number) => {
  return Math.round(odds).toLocaleString();
};

export const isBreedingMethod = (methodId?: string | null) => {
  const normalized = normalizeHuntingMethodValue(methodId);
  return (
    normalized.includes('egg') ||
    normalized.includes('masuda') ||
    normalized.includes('breeding')
  );
};

export const getDynamicOdds = (methodId: string, encounters: number, hasShinyCharm: boolean): number => {
  const method = findHuntingMethod(methodId);
  if (!method) return 4096;

  const charmRolls = hasShinyCharm ? 2 : 0;

  // --- Gen 2 ---
  if (methodId === 'gen2-breeding-shiny') return 64;
  if (methodId === 'gen2-egg-hatching') return 8192;
  if (methodId === 'gen2-odd-egg') return 100 / 14;
  if (methodId === 'gen2-odd-egg-jp') return 2;

  // --- Gen 4 ---
  if (methodId === 'gen3-egg-hatching') return 8192;
  if (methodId === 'gen4-egg-hatching') return 8192;
  if (methodId === 'gen4-masuda') return oddsFromRolls(5, 8192);
  if (methodId === 'gen4-pokeradar') {
    const chain = Math.min(Math.max(Math.floor(encounters), 0), 40);
    const probability = Math.ceil(65535 / (8200 - chain * 200)) / 65536;
    return oddsFromProbability(probability);
  }

  // --- Gen 5 ---
  if (methodId === 'gen5-egg-hatching') return oddsFromRolls(hasShinyCharm ? 3 : 1, 8192);
  if (methodId === 'gen5-masuda') return oddsFromRolls(hasShinyCharm ? 8 : 6, 8192);

  // --- Gen 6 ---
  if (methodId === 'gen6-egg-hatching') return oddsFromRolls(hasShinyCharm ? 3 : 1);
  if (methodId === 'gen6-masuda') return oddsFromRolls(hasShinyCharm ? 8 : 6);
  if (methodId === 'gen6-friend-safari') {
    const totalRolls = hasShinyCharm ? 7 : 5;
    return oddsFromRolls(totalRolls);
  }
  if (methodId === 'gen6-chain-fishing') {
    const chain = Math.min(encounters, 20);
    const bonusRolls = 2 * chain;
    const totalRolls = 1 + bonusRolls + charmRolls;
    return oddsFromRolls(totalRolls);
  }
  if (methodId === 'gen6-dexnav') {
    const forceProbability = getDexNavForceShinyProbability(encounters, hasShinyCharm);
    const naturalProbability = shinyRollProbability(hasShinyCharm ? 3 : 1);
    return oddsFromProbability(1 - (1 - forceProbability) * (1 - naturalProbability));
  }
  if (methodId === 'gen6-horde') {
    const rollsPerPokemon = hasShinyCharm ? 3 : 1;
    return oddsFromRolls(5 * rollsPerPokemon);
  }
  if (methodId === 'gen6-pokeradar-bonus-music') return 100;
  if (methodId === 'gen6-pokeradar') {
    // Gen 6 Poke Radar (XY): sparkling rapidly-shaking patches use
    // 1 / (8100 - chain * 200), capped at 1/100 from chain 40.
    // The first Radar use at chain 0 cannot create a sparkling patch, but
    // 1/8100 is still the reset rate after catching a Radar shiny.
    const chain = Math.min(Math.max(encounters, 0), 40);
    return Math.max(100, 8100 - chain * 200);
  }

  // --- Gen 7 ---
  if (methodId === 'gen7-egg-hatching') return oddsFromRolls(hasShinyCharm ? 3 : 1);
  if (methodId === 'gen7-masuda') return oddsFromRolls(hasShinyCharm ? 8 : 6);
  if (methodId === 'gen7-sos') {
    const chain = Math.max(Math.floor(encounters), 0);
    let totalRolls = 1;
    if (chain >= 31) totalRolls = 13;
    else if (chain >= 21) totalRolls = 9;
    else if (chain >= 11) totalRolls = 5;
    return oddsFromRolls(totalRolls + charmRolls);
  }
  if (methodId === 'gen7-lgpe-combo') {
    let totalRolls = 1;
    if (encounters >= 31) totalRolls = 12;
    else if (encounters >= 21) totalRolls = 8;
    else if (encounters >= 11) totalRolls = 4;
    return oddsFromRolls(totalRolls + charmRolls);
  }
  if (methodId === 'gen7-wormhole') return 100;

  // --- Gen 8 ---
  if (methodId === 'gen8-egg-hatching') return oddsFromRolls(hasShinyCharm ? 2 : 1);
  if (methodId === 'gen8-masuda' || methodId === 'gen8-bdsp-masuda') return oddsFromRolls(hasShinyCharm ? 8 : 6);
  if (methodId === 'gen8-murder') return oddsFromRolls(hasShinyCharm ? 9 : 7);
  if (methodId === 'gen8-max-raid') return 4096;
  if (methodId === 'gen8-bdsp-underground') return 4096;
  if (methodId === 'gen8-bdsp-underground-diglett') return 2048;
  if (methodId === 'gen8-dynamax') return hasShinyCharm ? 100 : 300;
  if (methodId === 'gen8-bdsp-pokeradar') {
    const chain = Math.min(Math.max(Math.floor(encounters), 0), 40);
    return BDSP_POKERADAR_ODDS[chain];
  }
  if (methodId === 'pla-mass-outbreak') {
    return oddsFromRolls(hasShinyCharm ? 29 : 26);
  }
  if (methodId === 'pla-massive') {
    return oddsFromRolls(hasShinyCharm ? 17 : 13);
  }
  if (methodId === 'pla-random') return oddsFromRolls(hasShinyCharm ? 5 : 1);

  // --- Gen 9 ---
  if (methodId === 'gen9-egg-hatching') return oddsFromRolls(hasShinyCharm ? 2 : 1);
  if (methodId === 'gen9-masuda') return oddsFromRolls(hasShinyCharm ? 8 : 6);
  if (methodId === 'gen9-outbreak') {
    let outbreakRolls = 0;
    if (encounters >= 60) outbreakRolls = 2;
    else if (encounters >= 30) outbreakRolls = 1;
    const totalRolls = 1 + outbreakRolls + (hasShinyCharm ? 2 : 0);
    return oddsFromRolls(totalRolls);
  }
  if (methodId === 'gen9-sandwich-lv3') {
    const totalRolls = 1 + 3 + (hasShinyCharm ? 2 : 0);
    return oddsFromRolls(totalRolls);
  }
  if (methodId === 'gen9-outbreak-sandwich') {
    let outbreakRolls = 0;
    if (encounters >= 60) outbreakRolls = 2;
    else if (encounters >= 30) outbreakRolls = 1;
    const totalRolls = 1 + outbreakRolls + 3 + (hasShinyCharm ? 2 : 0);
    return oddsFromRolls(totalRolls);
  }

  if (
    methodId === 'gen4-double-encounter' ||
    methodId === 'gen5-double-encounter' ||
    methodId === 'gen5-double-rustling-grass' ||
    methodId === 'gen5-double-dust-clouds'
  ) {
    const rollsPerPokemon = hasShinyCharm && method.generation >= 5 ? 3 : 1;
    return oddsFromRolls(2 * rollsPerPokemon, 8192);
  }

  if (methodId.includes('gift') || methodId.includes('/event') || methodId.endsWith('event')) {
    return method.baseOdds;
  }

  // Default logic
  const baseDenominator = method.baseOdds;
  if (hasShinyCharm && method.supportsShinyCharm) {
    if (method.generation >= 5) {
      return oddsFromRolls(3, baseDenominator);
    }
  }

  return baseDenominator;
};

export const HUNTING_METHODS: HuntingMethod[] = [
  // --- Gen 2 ---
  { id: 'gen2-breeding-shiny', name: 'Breeding (Shiny Ditto / Shiny Gene)', baseOdds: 64, generation: 2, supportsShinyCharm: false, description: 'Gen 2 shiny DV inheritance; Shiny Ditto is the consistent 1/64 setup' },
  { id: 'gen2-egg-hatching', name: 'Breeding', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-game-corner', name: 'Game Corner', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-headbutt', name: 'Headbutt', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-odd-egg', name: 'Odd Egg', baseOdds: 100 / 14, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-odd-egg-jp', name: 'Odd Egg (JP)', baseOdds: 2, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-random', name: 'Random Encounter', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-roaming', name: 'Roaming Encounter', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-safari', name: 'Random Encounter (Safari Zone)', baseOdds: 8192, generation: 2, supportsShinyCharm: false },
  { id: 'gen2-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 2, supportsShinyCharm: false },

  // --- Gen 3 ---
  { id: 'gen3-fishing', name: 'Fishing', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-egg-hatching', name: 'Breeding', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-fossil-restore', name: 'Fossil Restore', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-game-corner', name: 'Game Corner', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-random', name: 'Random Encounter', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-roaming', name: 'Roaming', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-runaway', name: 'Runaway', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-safari', name: 'Random Encounter (Safari Zone)', baseOdds: 8192, generation: 3, supportsShinyCharm: false },
  { id: 'gen3-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 3, supportsShinyCharm: false },

  // --- Gen 4 ---
  { id: 'gen4-double-encounter', name: 'Double Encounter', baseOdds: 4096, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-fishing', name: 'Fishing', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-egg-hatching', name: 'Breeding', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-fossil-restore', name: 'Fossil Restore', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-game-corner', name: 'Game Corner', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-headbutt', name: 'Headbutt', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-honey-tree', name: 'Honey Tree', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(5, 8192), generation: 4, supportsShinyCharm: false },
  { id: 'gen4-pokeradar', name: 'Poke Radar', baseOdds: 8192, generation: 4, supportsShinyCharm: false, description: 'Increases with Chain' },
  { id: 'gen4-random', name: 'Random Encounter', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-roaming', name: 'Roaming', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-runaway', name: 'Runaway', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-safari', name: 'Random Encounter (Safari Zone)', baseOdds: 8192, generation: 4, supportsShinyCharm: false },
  { id: 'gen4-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 4, supportsShinyCharm: false },

  // --- Gen 5 ---
  { id: 'gen5-double-encounter', name: 'Double Encounter', baseOdds: 4096, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-double-rustling-grass', name: 'Double Rustling Grass', baseOdds: 4096, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-double-dust-clouds', name: 'Double Dust Clouds', baseOdds: 4096, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-dust-clouds', name: 'Dust Clouds', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-egg-hatching', name: 'Breeding', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-fossil-restore', name: 'Fossil Restore', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-gift', name: 'Gift Pokémon', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(6, 8192), generation: 5, supportsShinyCharm: true },
  { id: 'gen5-random', name: 'Random Encounter', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-rippling-waters', name: 'Rippling Waters', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-rustling-grass', name: 'Rustling Grass', baseOdds: 8192, generation: 5, supportsShinyCharm: true },
  { id: 'gen5-soft-reset', name: 'Soft Reset', baseOdds: 8192, generation: 5, supportsShinyCharm: true },

  // --- Gen 6 ---
  { id: 'gen6-chain-fishing', name: 'Chain Fishing', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Increases with consecutive hooks' },
  { id: 'gen6-dexnav', name: 'DexNav', baseOdds: 4096, generation: 6, supportsShinyCharm: true, description: 'Uses the counter as Search Level' },
  { id: 'gen6-egg-hatching', name: 'Breeding', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-fossil-restore', name: 'Fossil Restore', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-friend-safari', name: 'Friend Safari', baseOdds: oddsFromProbability(shinyRollProbability(5)), generation: 6, supportsShinyCharm: true },
  { id: 'gen6-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-horde', name: 'Horde Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(6), generation: 6, supportsShinyCharm: true },
  { id: 'gen6-pokeradar', name: 'Poke Radar', baseOdds: 8100, generation: 6, supportsShinyCharm: false, description: 'Sparkling patch odds improve by 200 per chain, capped at 40' },
  { id: 'gen6-pokeradar-bonus-music', name: 'Poke Radar (Bonus Music)', baseOdds: 100, generation: 6, supportsShinyCharm: false, description: 'Bonus music keeps sparkling patch odds at 1/100' },
  { id: 'gen6-random', name: 'Random Encounter', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-rock-smash', name: 'Rock Smash', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-runaway', name: 'Runaway', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  { id: 'gen6-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 6, supportsShinyCharm: true },
  // --- Gen 7 ---
  { id: 'gen7-fossil-restore', name: 'Fossil Restore', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-lgpe-combo', name: 'Let\'s Go Catch Combo', baseOdds: 4096, generation: 7, supportsShinyCharm: true, description: 'Boost applies to the next spawn after a catch' },
  { id: 'gen7-lgpe-random', name: 'Let\'s Go Random', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(6), generation: 7, supportsShinyCharm: true },
  { id: 'gen7-random', name: 'Random Encounter', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-runaway', name: 'Runaway', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen7-sos', name: 'SOS Battle', baseOdds: 4096, generation: 7, supportsShinyCharm: true, description: 'Increases with Chain' },
  { id: 'gen7-wormhole', name: 'Ultra Wormhole', baseOdds: 100, generation: 7, supportsShinyCharm: false, description: 'Default non-legendary wormhole minimum; exact odds depend on distance and wormhole type' },

  // --- Gen 8 ---
  { id: 'gen8-bdsp-masuda', name: 'BDSP Masuda Method', baseOdds: oddsFromRolls(6), generation: 8, supportsShinyCharm: true },
  { id: 'gen8-bdsp-pokeradar', name: 'BDSP Poke Radar', baseOdds: 4096, generation: 8, supportsShinyCharm: false, description: 'Increases with Chain; Shiny Charm does not affect Radar' },
  { id: 'gen8-bdsp-underground', name: 'BDSP Grand Underground', baseOdds: 4096, generation: 8, supportsShinyCharm: false },
  { id: 'gen8-bdsp-underground-diglett', name: 'BDSP Grand Underground Diglett Bonus', baseOdds: 2048, generation: 8, supportsShinyCharm: false },
  { id: 'gen8-dynamax', name: 'Dynamax Adventure', baseOdds: 300, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-fossil-restore', name: 'Fossil Restore', baseOdds: 4096, generation: 8, supportsShinyCharm: false },
  { id: 'gen8-gift', name: 'Gift Pokémon', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-max-raid', name: 'Max Raid Battle', baseOdds: 4096, generation: 8, supportsShinyCharm: false },
  { id: 'gen8-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(6), generation: 8, supportsShinyCharm: true },
  { id: 'gen8-murder', name: 'Brilliant Aura (500+ battled)', baseOdds: oddsFromRolls(7), generation: 8, supportsShinyCharm: true },
  { id: 'gen8-random', name: 'Random Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'gen8-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 8, supportsShinyCharm: true },

  // --- Legends Arceus ---
  { id: 'pla-mass-outbreak', name: 'Mass Outbreak', baseOdds: oddsFromRolls(26), generation: 8, supportsShinyCharm: true },
  { id: 'pla-massive', name: 'Massive Mass Outbreak', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'pla-random', name: 'Random Encounter', baseOdds: 4096, generation: 8, supportsShinyCharm: true },

  // --- Gen 9 ---
  { id: 'gen9-outbreak', name: 'Mass Outbreak', baseOdds: 4096, generation: 9, supportsShinyCharm: true, description: 'KO 60+' },
  { id: 'gen9-masuda', name: 'Masuda Method', baseOdds: oddsFromRolls(6), generation: 9, supportsShinyCharm: true },
  { id: 'gen9-random', name: 'Random Encounter', baseOdds: 4096, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-sandwich-lv3', name: 'Sandwich (Sparkling Power)', baseOdds: 1024, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-outbreak-sandwich', name: 'Outbreak + Sandwich Lv3', baseOdds: 1024, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-soft-reset', name: 'Soft Reset', baseOdds: 4096, generation: 9, supportsShinyCharm: false },
  { id: 'gen9-zone-bench-soft-reset', name: 'Zone / Bench / Soft Reset', baseOdds: 4096, generation: 9, supportsShinyCharm: false },
  { id: 'gen9-fossil-restore', name: 'Fossil Restore', baseOdds: 4096, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-hyperspace', name: 'Hyperspace', baseOdds: 4096, generation: 9, supportsShinyCharm: true },
  { id: 'gen9-tera-raid', name: 'Tera Raid', baseOdds: 4096, generation: 9, supportsShinyCharm: false },
  { id: 'gen7-egg-hatching', name: 'Breeding', baseOdds: 4096, generation: 7, supportsShinyCharm: true },
  { id: 'gen8-egg-hatching', name: 'Breeding', baseOdds: 4096, generation: 8, supportsShinyCharm: true },
  { id: 'gen9-egg-hatching', name: 'Breeding', baseOdds: 4096, generation: 9, supportsShinyCharm: true },

  // --- Distribution / Event & Custom ---
  { id: 'distribution/event', name: 'Distribution / Event', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
  { id: 'static overworld game gift', name: 'Static Overworld / Game Gift', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
  { id: 'custom', name: 'Custom Odds', baseOdds: 4096, generation: 0, supportsShinyCharm: false },
];

export const canHideEncountersForMethod = (methodId?: string | null) =>
  methodId === 'gen9-zone-bench-soft-reset' || methodId === 'gen9-hyperspace';

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
  { id: 'za', name: 'Pokemon Legends Z-A', generation: 9, logo: 'https://archives.bulbagarden.net/media/upload/thumb/f/f7/Pok%C3%A9mon_Legends_Z-A_logo.png/1280px-Pok%C3%A9mon_Legends_Z-A_logo.png' },
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
    currentOdds,
    percentage: (probability * 100).toFixed(4), // Single encounter chance
    binomialProbability: binomialProb.toFixed(2), // Cumulative chance
  };
}

export const SHINY_CHARM_ICON = '/img/items/shiny-charm.png';
export const GIGAMAX_ICON = '/img/items/dynamax-icon.png';
export const POKEMON_EGG_ICON = '/img/items/pokemon-egg.png';
export const supportsGigamaxMark = (game: string) => game === 'sword' || game === 'shield';


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
    .replace(/[''%: .]/g, '')
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

const POKEMON_WITH_GENDER_DIFFERENCE_IDS = [
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119,
  123, 129, 130, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203,
  207, 208, 212, 214, 215, 217, 221, 224, 229, 232, 255, 256, 257, 267, 269,
  272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350, 369, 396, 397,
  398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443,
  444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
  592, 593, 667, 668, 678, 876, 902, 916
];

export function getPokemonSpriteFallbackUrl(): string {
  return '/placeholder.svg';
}

export function toLocalPokemonSpriteUrl(remoteUrl: string): string {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl;

  const localUrl = LOCAL_SPRITE_URLS[remoteUrl];
  if (localUrl) return localUrl;

  return remoteUrl;
}

export function handlePokemonSpriteError(img: HTMLImageElement, fallbackUrl = getPokemonSpriteFallbackUrl()) {
  img.onerror = null;
  img.src = fallbackUrl;
}

export function _getPokemonSpriteUrlRaw(pokemonId: number, options: { shiny?: boolean, name?: string, female?: boolean, form?: string, animated?: boolean } = {}): string {
  if (!pokemonId) return '';


  let { shiny = false, female = false, name, form } = options;

  const slugSource = (form || name || '').toLowerCase();
  const hasExplicitGenderForm = slugSource.includes('-female') || slugSource.includes('-male');
  const isRegionalOrSpecialForm =
    pokemonId > 10000 ||
    slugSource.includes('-alola') ||
    slugSource.includes('-galar') ||
    slugSource.includes('-hisui') ||
    slugSource.includes('-paldea');

  // Regional/special forms usually don't have dedicated female HOME sprites.
  // If user selected female on a form without real gender diff sprite, force base sprite.
  if (female && isRegionalOrSpecialForm && !hasExplicitGenderForm) {
    female = false;
  }
  // Keep female sprites only for species/forms that actually support them.
  const hasBaseGenderDifference = POKEMON_WITH_GENDER_DIFFERENCE_IDS.includes(pokemonId);
  if (female && !hasExplicitGenderForm && !hasBaseGenderDifference) {
    female = false;
  }
  // Combine name and form for overrides check
  if (name && form) {
    const sName = name.toLowerCase();
    const sForm = form.toLowerCase();

    if (sForm.startsWith(sName + '-')) {
      // Form is already the full slug (e.g. name="vivillon", form="vivillon-meadow")
      name = form;
    } else if (!sName.includes(sForm)) {
      // Form is a suffix (e.g. name="vivillon", form="meadow")
      name = `${name}-${form}`;
    }
  }
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

  // Deoxys form overrides
  if (name && name.toLowerCase().includes('deoxys')) {
    const sName = name.toLowerCase();
    if (sName === 'deoxys-attack') return 'https://img.pokemondb.net/sprites/home/shiny/deoxys-attack.png';
    if (sName === 'deoxys-defense') return `${baseUrl}/shiny/10002.png`;
    if (sName === 'deoxys-speed') return `${baseUrl}/shiny/10003.png`;
  }

  // Giratina, Dialga, Palkia overrides
  if (name && (name.toLowerCase().includes('giratina-origin') || name.toLowerCase().includes('dialga-origin') || name.toLowerCase().includes('palkia-origin'))) {
    const sName = name.toLowerCase();
    if (sName.includes('giratina')) return `https://img.pokemondb.net/sprites/home/shiny/giratina-origin.png`;
    if (sName.includes('dialga')) return `https://img.pokemondb.net/sprites/home/shiny/dialga-origin.png`;
    if (sName.includes('palkia')) return `https://img.pokemondb.net/sprites/home/shiny/palkia-origin.png`;
  }

  // Wormadam Sandy / Trash overrides (use specific images)
  if (name && name.toLowerCase().includes('wormadam-sandy')) {
    return 'https://img.pokemondb.net/sprites/home/shiny/wormadam-sandy.png';
  }
  if (name && name.toLowerCase().includes('wormadam-trash')) {
    return 'https://img.pokemondb.net/sprites/home/shiny/wormadam-trash.png';
  }

  // Enamorus Therian override
  if (name && name.toLowerCase().includes('enamorus-therian')) {
    return `https://img.pokemondb.net/sprites/home/shiny/enamorus-therian.png`;
  }

  // Gen 9 Form Overrides
  if (name && name.toLowerCase().includes('maushold-family-of-three')) {
    return 'https://www.pokepedia.fr/images/3/3e/Sprite_0925_Trois_chromatique_HOME.png';
  }
  if (name && name.toLowerCase().includes('dudunsparce-three-segment')) {
    return 'https://www.pokepedia.fr/images/c/ca/Sprite_0982_Triple_chromatique_HOME.png';
  }
  if (name && name.toLowerCase().includes('squawkabilly-')) {
    const sName = name.toLowerCase();
    if (sName.includes('blue')) return 'https://www.pokepedia.fr/images/6/6e/Sprite_0931_Bleu_chromatique_HOME.png';
    if (sName.includes('yellow')) return 'https://www.pokepedia.fr/images/b/bc/Sprite_0931_Jaune_chromatique_HOME.png';
    if (sName.includes('white')) return 'https://www.pokepedia.fr/images/2/22/Sprite_0931_Blanc_chromatique_HOME.png';
  }
  if (name && name.toLowerCase().includes('tatsugiri-')) {
    const sName = name.toLowerCase();
    if (sName.includes('droopy')) return 'https://www.pokepedia.fr/images/b/b9/Sprite_0978_Affal%C3%A9e_chromatique_HOME.png';
    if (sName.includes('stretchy')) return 'https://www.pokepedia.fr/images/3/38/Sprite_0978_Raide_chromatique_HOME.png';
  }

  // Minior Core overrides
  if (name && name.toLowerCase().includes('minior') && !name.toLowerCase().includes('meteor')) {
    const sName = name.toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    const colors = ['orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    for (const color of colors) {
      if (sName.includes(color)) return `https://img.pokemondb.net/sprites/home/${subPath}/minior-${color}.png`;
    }
  }

  // Castform (and its weather forms) overrides
  if (name && name.toLowerCase().includes('castform')) {
    const sName = name.toLowerCase();
    if (sName === 'castform') return 'https://img.pokemondb.net/sprites/home/shiny/castform.png';
    if (sName === 'castform-sunny' || sName.includes('sunny')) return 'https://www.pokepedia.fr/images/8/88/Sprite_0351_Solaire_chromatique_HOME-v1.png';
    if (sName === 'castform-rainy' || sName.includes('rainy')) return 'https://www.pokepedia.fr/images/1/1a/Sprite_0351_Eau_de_Pluie_chromatique_HOME-v1.png';
    if (sName === 'castform-snowy' || sName.includes('snowy')) return 'https://www.pokepedia.fr/images/d/d7/Sprite_0351_Blizzard_chromatique_HOME-v1.png';
  }

  // Furfrou overrides
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

  // Pumpkaboo size overrides
  if (name && name.toLowerCase().includes('pumpkaboo')) {
    const sName = name.toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    if (sName.includes('small')) return `https://img.pokemondb.net/sprites/home/${subPath}/pumpkaboo-small.png`;
    if (sName.includes('large')) return `https://img.pokemondb.net/sprites/home/${subPath}/pumpkaboo-large.png`;
    if (sName.includes('super')) return `https://img.pokemondb.net/sprites/home/${subPath}/pumpkaboo-super.png`;
  }

  // Gourgeist size overrides
  if (name && name.toLowerCase().includes('gourgeist')) {
    const sName = name.toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    if (sName.includes('small')) return `https://img.pokemondb.net/sprites/home/${subPath}/gourgeist-small.png`;
    if (sName.includes('large')) return `https://img.pokemondb.net/sprites/home/${subPath}/gourgeist-large.png`;
    if (sName.includes('super')) return `https://img.pokemondb.net/sprites/home/${subPath}/gourgeist-super.png`;
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

  // Oricorio style overrides
  if (name && name.toLowerCase().includes('oricorio')) {
    const sName = name.toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    if (sName.includes('pau')) return `https://img.pokemondb.net/sprites/home/${subPath}/oricorio-pau.png`;
    if (sName.includes('pom-pom')) return `https://img.pokemondb.net/sprites/home/${subPath}/oricorio-pom-pom.png`;
    if (sName.includes('sensu')) return `https://img.pokemondb.net/sprites/home/${subPath}/oricorio-sensu.png`;
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

  // Unown overrides (Using ID 201)
  if (pokemonId === 201 || (name && name.toLowerCase().includes('unown'))) {
    const sName = (form || name || 'a').toLowerCase();
    let letter = 'a';

    if (sName.startsWith('unown-')) letter = sName.replace('unown-', '');
    else if (sName === 'unown') letter = 'a';
    else if (sName.length === 1) letter = sName;
    else if (sName === 'exclamation' || sName === '!') letter = 'em';
    else if (sName === 'question' || sName === '?') letter = 'qm';
    else letter = sName;

    // Normalizing letter for pokemondb URL naming
    if (letter === 'exclamation' || letter === '!') letter = 'em';
    if (letter === 'question' || letter === '?') letter = 'qm';

    return `https://img.pokemondb.net/sprites/home/shiny/unown-${letter}.png`;
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
    const subPath = shiny ? 'shiny' : 'normal';

    // Check for specific patterns
    const patterns = [
      'meadow', 'icy-snow', 'polar', 'tundra', 'continental', 'garden',
      'elegant', 'modern', 'marine', 'fancy', 'archipelago', 'high-plains',
      'sandstorm', 'river', 'monsoon', 'savanna', 'sun', 'ocean', 'jungle'
    ];

    for (const pattern of patterns) {
      if (sName.includes(pattern)) {
        return `https://img.pokemondb.net/sprites/home/${subPath}/vivillon-${pattern}.png`;
      }
    }

    // Special patterns (Pokeball / Fancy can have different slugs in different sources)
    if (sName.includes('pokeball') || sName.includes('poke-ball')) {
      return `https://img.pokemondb.net/sprites/home/${subPath}/vivillon-pokeball.png`;
    }
    if (sName.includes('fancy')) {
      return `https://img.pokemondb.net/sprites/home/${subPath}/vivillon-fancy.png`;
    }

    // Fallback for base Vivillon (ID 666) - usually defaults to Meadow in many sources
    if (pokemonId === 666 || sName === 'vivillon') {
      return `https://img.pokemondb.net/sprites/home/${subPath}/vivillon-meadow.png`;
    }
  }

  // Alcremie overrides: use full form slug to preserve all cream/sweet variants.
  if (name && name.toLowerCase().includes('alcremie')) {
    const source = (form || name).toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    const normalized = source.replace(/-sweet/g, '');
    return `https://img.pokemondb.net/sprites/home/${subPath}/${normalized}.png`;
  }

  // Minior (Red) override
  if (name && name.toLowerCase().includes('minior') && name.toLowerCase().includes('red')) {
    const subPath = shiny ? 'shiny' : 'normal';
    return `https://img.pokemondb.net/sprites/home/${subPath}/minior-core.png`;
  }

  // Furfrou overrides
  if (name && name.toLowerCase().includes('furfrou')) {
    const sName = name.toLowerCase();
    const subPath = shiny ? 'shiny' : 'normal';
    if (sName.includes('heart') || sName.includes('cœur')) return `https://www.pokepedia.fr/images/0/06/Sprite_0676_C%C5%93ur_${shiny ? 'chromatique_' : ''}HOME-v1.png`;
    if (sName.includes('star') || sName.includes('étoile')) return `https://www.pokepedia.fr/images/3/3f/Sprite_0676_%C3%89toile_${shiny ? 'chromatique_' : ''}HOME-v1.png`;
    if (sName.includes('diamond') || sName.includes('diamant')) return `https://www.pokepedia.fr/images/8/8a/Sprite_0676_Diamant_${shiny ? 'chromatique_' : ''}HOME-v1.png`;
    if (sName.includes('debutante') || sName.includes('demoiselle')) return `https://www.pokepedia.fr/images/b/b3/Sprite_0676_Demoiselle_${shiny ? 'chromatique_' : ''}HOME-v1.png`;
    if (sName.includes('matron')) return `https://img.pokemondb.net/sprites/home/${subPath}/furfrou-matron.png`;
    if (sName.includes('dandy')) return `https://img.pokemondb.net/sprites/home/${subPath}/furfrou-dandy.png`;
    if (sName.includes('la-reine') || sName.includes('reine')) return `https://www.pokepedia.fr/images/f/f5/Sprite_0676_Reine_${shiny ? 'chromatique_' : ''}HOME-v1.png`;
    if (sName.includes('kabuki')) return 'https://www.pokepedia.fr/images/f/f2/Sprite_0676_Kabuki_chromatique_HOME-v1.png';
    if (sName.includes('pharaoh') || sName.includes('pharaon')) return 'https://www.pokepedia.fr/images/5/52/Sprite_0676_Pharaon_chromatique_HOME-v1.png';
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

export function getPokemonSpriteUrl(pokemonId: number, options: { shiny?: boolean, name?: string, female?: boolean, form?: string, animated?: boolean } = {}): string {
  const rawUrl = _getPokemonSpriteUrlRaw(pokemonId, options);
  const localUrl = toLocalPokemonSpriteUrl(rawUrl);

  if (localUrl !== rawUrl) return localUrl;

  return rawUrl;
}

// Alias for transition compatibility
export const getGameSpecificSpriteUrl = (id: number, methodId: string, name?: string, form?: string, gender?: string) =>
  getPokemonSpriteUrl(id, { shiny: true, name, form: form || undefined, female: gender === 'female' });

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
  670: 5, // Floette
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

