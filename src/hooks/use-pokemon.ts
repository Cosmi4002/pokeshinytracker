import { useState, useEffect } from 'react';
import { usePokedexOverrides } from './use-pokedex-overrides';
import { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';
export { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import pokedexData from '@/lib/pokedex.json';
import { isFormEliminated, POKEMON_DATA_OVERRIDES } from '@/lib/form-filters';
import { getShinyAvailability, ShinyAvailability } from '@/lib/shiny-availability';

export interface PokemonBasic {
  id: number;
  baseId: number;
  name: string;
  displayName: string;
  generation: number;
  hideFromPokedex?: boolean;
  evolvesTo?: number[]; // Array of Pokémon IDs this Pokémon evolves into
  shinyAvailability?: ShinyAvailability;
}

export interface PokemonVariety {
  isDefault: boolean;
  pokemon: {
    id: number;
    name: string;
    spriteUrl: string;
  };
}

export interface PokemonDetailed {
  id: number;
  baseId: number;
  name: string;
  displayName: string;
  sprites: {
    default: string;
    shiny: string;
    femaleDefault?: string;
    femaleShiny?: string;
  };
  types: string[];
  generation: number;
  forms: PokemonFormDetailed[];
  varieties: PokemonVariety[];
  hasGenderDifference: boolean;
  shinyAvailability?: ShinyAvailability;
}

export interface PokemonFormDetailed {
  id: number;
  formName: string;
  displayName: string;
  sprites: {
    default: string;
    shiny: string;
  };
}

// All Pokemon including varieties
const TOTAL_POKEMON = 2000;

// Pokemon with visible gender differences
export const POKEMON_WITH_GENDER_DIFF = [
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119,
  123, 129, 130, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203,
  207, 208, 212, 214, 215, 217, 221, 224, 229, 232, 255, 256, 257, 267, 269,
  272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350, 369, 396, 397,
  398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443,
  444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
  592, 593, 667, 668, 678, 876, 902, 916
];

// Manual Varieties to force inclusion for specific species that aren't fully listed in pokedex.json
const RAW_MANUAL_VARIETIES: Record<number, { id: number, name: string, generation?: number }[]> = {
  201: [ // Unown
    { id: 10001, name: 'unown-b' }, { id: 10002, name: 'unown-c' }, { id: 10003, name: 'unown-d' },
    { id: 10004, name: 'unown-e' }, { id: 10005, name: 'unown-f' }, { id: 10006, name: 'unown-g' },
    { id: 10007, name: 'unown-h' }, { id: 10008, name: 'unown-i' }, { id: 10009, name: 'unown-j' },
    { id: 10010, name: 'unown-k' }, { id: 10011, name: 'unown-l' }, { id: 10012, name: 'unown-m' },
    { id: 10013, name: 'unown-n' }, { id: 10014, name: 'unown-o' }, { id: 10015, name: 'unown-p' },
    { id: 10016, name: 'unown-q' }, { id: 10017, name: 'unown-r' }, { id: 10018, name: 'unown-s' },
    { id: 10019, name: 'unown-t' }, { id: 10020, name: 'unown-u' }, { id: 10021, name: 'unown-v' },
    { id: 10022, name: 'unown-w' }, { id: 10023, name: 'unown-x' }, { id: 10024, name: 'unown-y' },
    { id: 10025, name: 'unown-z' }, { id: 10026, name: 'unown-exclamation' }, { id: 10027, name: 'unown-question' }
  ],
  386: [ // Deoxys
    { id: 10001, name: 'deoxys-attack' },
    { id: 10002, name: 'deoxys-defense' },
    { id: 10003, name: 'deoxys-speed' },
  ],
  412: [ // Burmy
    { id: 1041201, name: 'burmy-sandy' },
    { id: 1041202, name: 'burmy-trash' }
  ],
  413: [ // Wormadam
    { id: 1041301, name: 'wormadam-sandy' },
    { id: 1041302, name: 'wormadam-trash' }
  ],
  422: [ // Shellos
    { id: 10026, name: 'shellos-east' }
  ],
  423: [ // Gastrodon
    { id: 10027, name: 'gastrodon-east' }
  ],
  479: [ // Rotom
    { id: 10008, name: 'rotom-heat' },
    { id: 10009, name: 'rotom-wash' },
    { id: 10010, name: 'rotom-frost' },
    { id: 10011, name: 'rotom-fan' },
    { id: 10012, name: 'rotom-mow' },
  ],
  483: [ // Dialga
    { id: 10243, name: 'dialga-origin', generation: 8 }
  ],
  484: [ // Palkia
    { id: 10244, name: 'palkia-origin', generation: 8 }
  ],
  487: [ // Giratina
    { id: 10007, name: 'giratina-origin' },
  ],
  492: [ // Shaymin
    { id: 10006, name: 'shaymin-sky' },
  ],
  493: [ // Arceus
    { id: 10047, name: 'arceus-fighting' }, { id: 10048, name: 'arceus-flying' },
    { id: 10049, name: 'arceus-poison' }, { id: 10050, name: 'arceus-ground' },
    { id: 10051, name: 'arceus-rock' }, { id: 10052, name: 'arceus-bug' },
    { id: 10053, name: 'arceus-ghost' }, { id: 10054, name: 'arceus-steel' },
    { id: 10055, name: 'arceus-fire' }, { id: 10056, name: 'arceus-water' },
    { id: 10057, name: 'arceus-grass' }, { id: 10058, name: 'arceus-electric' },
    { id: 10059, name: 'arceus-psychic' }, { id: 10060, name: 'arceus-ice' },
    { id: 10061, name: 'arceus-dragon' }, { id: 10062, name: 'arceus-dark' },
    { id: 10063, name: 'arceus-fairy' }
  ],
  550: [ // Basculin
    { id: 10016, name: 'basculin-blue-striped' },
    { id: 10247, name: 'basculin-white-striped', generation: 8 }
  ],
  585: [ // Deerling
    // Synthetic IDs are intentional: seasonal forms do not have distinct Pokémon IDs
    // in PokeAPI, and the old 10051-10053 values collided with Arceus forms.
    { id: 1058501, name: 'deerling-summer' },
    { id: 1058502, name: 'deerling-autumn' },
    { id: 1058503, name: 'deerling-winter' }
  ],
  586: [ // Sawsbuck
    { id: 1058601, name: 'sawsbuck-summer' },
    { id: 1058602, name: 'sawsbuck-autumn' },
    { id: 1058603, name: 'sawsbuck-winter' }
  ],
  641: [ // Tornadus
    { id: 10019, name: 'tornadus-therian' }
  ],
  642: [ // Thundurus
    { id: 10020, name: 'thundurus-therian' }
  ],
  645: [ // Landorus
    { id: 10021, name: 'landorus-therian' }
  ],
  646: [ // Kyurem
    { id: 10022, name: 'kyurem-black' },
    { id: 10023, name: 'kyurem-white' }
  ],
  647: [ // Keldeo
    { id: 10024, name: 'keldeo-resolute' }
  ],
  648: [ // Meloetta
    { id: 10025, name: 'meloetta-pirouette' }
  ],
  669: [ // Flabébé
    { id: 10064, name: 'flabebe-yellow' }, { id: 10065, name: 'flabebe-orange' },
    { id: 10066, name: 'flabebe-blue' }, { id: 10067, name: 'flabebe-white' }
  ],
  670: [ // Floette
    { id: 10068, name: 'floette-yellow' }, { id: 10069, name: 'floette-orange' },
    { id: 10070, name: 'floette-blue' }, { id: 10071, name: 'floette-white' }
  ],
  671: [ // Florges
    { id: 10073, name: 'florges-yellow' }, { id: 10074, name: 'florges-orange' },
    { id: 10075, name: 'florges-blue' }, { id: 10076, name: 'florges-white' }
  ],
  676: [ // Furfrou
    { id: 10077, name: 'furfrou-heart' }, { id: 10078, name: 'furfrou-star' },
    { id: 10079, name: 'furfrou-diamond' }, { id: 10080, name: 'furfrou-debutante' },
    { id: 10081, name: 'furfrou-matron' }, { id: 10082, name: 'furfrou-dandy' },
    { id: 10083, name: 'furfrou-la-reine' }, { id: 10084, name: 'furfrou-kabuki' },
    { id: 10085, name: 'furfrou-pharaoh' }
  ],
  710: [ // Pumpkaboo
    { id: 10027, name: 'pumpkaboo-small' },
    { id: 10028, name: 'pumpkaboo-large' },
    { id: 10029, name: 'pumpkaboo-super' }
  ],
  711: [ // Gourgeist
    { id: 10030, name: 'gourgeist-small' },
    { id: 10031, name: 'gourgeist-large' },
    { id: 10032, name: 'gourgeist-super' }
  ],
  718: [ // Zygarde
    { id: 10118, name: 'zygarde-10' }
  ],
  745: [ // Lycanroc
    { id: 10126, name: 'lycanroc-midnight' },
    { id: 10152, name: 'lycanroc-dusk' }
  ],
  773: [ // Silvally
    { id: 10110, name: 'silvally-fighting' }, { id: 10111, name: 'silvally-flying' },
    { id: 10112, name: 'silvally-poison' }, { id: 10113, name: 'silvally-ground' },
    { id: 10114, name: 'silvally-rock' }, { id: 10115, name: 'silvally-bug' },
    { id: 10116, name: 'silvally-ghost' }, { id: 10117, name: 'silvally-steel' },
    { id: 10118, name: 'silvally-fire' }, { id: 10119, name: 'silvally-water' },
    { id: 10120, name: 'silvally-grass' }, { id: 10121, name: 'silvally-electric' },
    { id: 10122, name: 'silvally-psychic' }, { id: 10123, name: 'silvally-ice' },
    { id: 10124, name: 'silvally-dragon' }, { id: 10125, name: 'silvally-dark' },
    { id: 10126, name: 'silvally-fairy' }
  ],
  774: [ // Minior
    { id: 10130, name: 'minior-red' }, { id: 10131, name: 'minior-orange' },
    { id: 10132, name: 'minior-yellow' }, { id: 10133, name: 'minior-green' },
    { id: 10134, name: 'minior-blue' }, { id: 10135, name: 'minior-indigo' },
    { id: 10136, name: 'minior-violet' },
    { id: 10137, name: 'minior-orange-meteor' }, { id: 10138, name: 'minior-yellow-meteor' },
    { id: 10139, name: 'minior-green-meteor' }, { id: 10140, name: 'minior-blue-meteor' },
    { id: 10141, name: 'minior-indigo-meteor' }, { id: 10142, name: 'minior-violet-meteor' }
  ],
  800: [ // Necrozma
    { id: 10155, name: 'necrozma-dusk' },
    { id: 10156, name: 'necrozma-dawn' },
    { id: 10157, name: 'necrozma-ultra' }
  ],
  849: [ // Toxtricity
    { id: 10184, name: 'toxtricity-low-key' }
  ],
  869: [ // Alcremie
    { id: 10158, name: 'alcremie-strawberry' }, { id: 10159, name: 'alcremie-berry' },
    { id: 10160, name: 'alcremie-love' }, { id: 10161, name: 'alcremie-star' },
    { id: 10162, name: 'alcremie-clover' }, { id: 10163, name: 'alcremie-flower' },
    { id: 10164, name: 'alcremie-ribbon' }
  ],
  905: [ // Enamorus
    { id: 10249, name: 'enamorus-therian' }
  ],
  916: [ // Oinkologne
    // NOTE: female is rendered via gender-diff sprite; avoid duplicate "form" entry site-wide.
  ],
  925: [ // Maushold
    { id: 10255, name: 'maushold-family-of-three' }
  ],
  931: [ // Squawkabilly
    { id: 10256, name: 'squawkabilly-blue' },
    { id: 10257, name: 'squawkabilly-yellow' },
    { id: 10258, name: 'squawkabilly-white' }
  ],
  978: [ // Tatsugiri
    { id: 10259, name: 'tatsugiri-droopy' },
    { id: 10260, name: 'tatsugiri-stretchy' }
  ],
  982: [ // Dudunsparce
    { id: 10261, name: 'dudunsparce-three-segment' }
  ],
  1017: [ // Ogerpon
    { id: 10273, name: 'ogerpon-wellspring-mask' },
    { id: 10274, name: 'ogerpon-hearthflame-mask' },
    { id: 10275, name: 'ogerpon-cornerstone-mask' }
  ],
  1024: [ // Terapagos
    { id: 10276, name: 'terapagos-terastal' },
    { id: 10277, name: 'terapagos-stellar' }
  ],
};

// PokeAPI form IDs are only unique inside their original endpoint and several of
// the historical manual entries overlap other Pokémon in our single flat list
// (for example Giratina Origin and Vivillon Garden both used 10007). Preserve a
// canonical ID when it is free; otherwise assign a stable species-scoped ID.
export const MANUAL_VARIETIES: Record<number, { id: number, name: string, generation?: number }[]> = (() => {
  const reservedIds = new Map<number, string>(
    (pokedexData as Array<{ id: number, name: string }>).map((entry) => [entry.id, entry.name])
  );
  const normalized: Record<number, { id: number, name: string, generation?: number }[]> = {};

  Object.entries(RAW_MANUAL_VARIETIES).forEach(([baseIdText, varieties]) => {
    const baseId = Number(baseIdText);
    normalized[baseId] = varieties.map((variety, index) => {
      let id = variety.id;
      const existingName = reservedIds.get(id);
      // Keep an ID already present for this exact form: usePokemonList will skip
      // the redundant manual entry. Only remap genuine cross-species collisions.
      if (existingName && existingName !== variety.name) id = baseId * 10000 + index + 1;
      while (reservedIds.has(id) && reservedIds.get(id) !== variety.name) id += 1;
      reservedIds.set(id, variety.name);
      return { ...variety, id };
    });
  });

  return normalized;
})();

// Generation ranges
export const GENERATION_RANGES: Record<number, [number, number]> = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

function getGeneration(id: number, _name?: string, baseId?: number): number {
  const rangeId = baseId && baseId > 0 ? baseId : id;
  if (rangeId > 10000) {
    return 9;
  }
  for (const [gen, [start, end]] of Object.entries(GENERATION_RANGES)) {
    if (rangeId >= start && rangeId <= end) return parseInt(gen);
  }
  return 1;
}

export function formatPokemonName(name: string, id: number, baseId?: number): string {
  const speciesId = baseId || id;

  // If name already contains spaces, it's likely already formatted (e.g. from DB)
  if (name.includes(' ')) return name;

  // Nidoran gender symbols
  if (name === 'nidoran-f' || speciesId === 29) return 'Nidoran♀';
  if (name === 'nidoran-m' || speciesId === 32) return 'Nidoran♂';

  if (speciesId === 585 || speciesId === 586) {
    const baseName = speciesId === 585 ? 'Deerling' : 'Sawsbuck';
    if (name.includes('-summer')) return `${baseName} (Summer)`;
    if (name.includes('-autumn')) return `${baseName} (Autumn)`;
    if (name.includes('-winter')) return `${baseName} (Winter)`;
    if (name.includes('-spring') || name === 'deerling' || name === 'sawsbuck')
      return `${baseName} (Spring)`;
  }

  // Oricorio style naming
  if (name.toLowerCase().includes('oricorio')) {
    const styleMatch = name.toLowerCase().match(/baile|pom-pom|pau|sensu/);
    if (styleMatch) {
      const style = styleMatch[0].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
      return `Oricorio ${style} Style`;
    }
    return 'Oricorio';
  }

  // Ogerpon Teal Mask name override
  if (speciesId === 1017 || (id === 1017)) {
    return 'Ogerpon Teal Mask';
  }

  // Mimikyu name overrides
  if (name.toLowerCase().includes('mimikyu-disguised')) return 'Mimikyu';

  // Meowstic name overrides
  if (name.toLowerCase().includes('meowstic-male')) return 'Meowstic';
  if (name.toLowerCase().includes('meowstic-female')) return 'Meowstic Female';

  // Oinkologne name overrides
  if (name.toLowerCase().includes('oinkologne-male')) return 'Oinkologne';
  if (name.toLowerCase().includes('oinkologne-female')) return 'Oinkologne Female';

  // Indeedee name overrides
  if (name.toLowerCase().includes('indeedee-male')) return 'Indeedee';
  if (name.toLowerCase().includes('indeedee-female')) return 'Indeedee Female';

  // Urshifu name overrides
  if (name.toLowerCase().includes('urshifu-single-strike')) return 'Urshifu (Single Strike)';
  if (name.toLowerCase().includes('urshifu-rapid-strike')) return 'Urshifu (Rapid Strike)';

  // Wishiwashi name overrides
  if (name.toLowerCase().includes('wishiwashi-solo')) return 'Wishiwashi';

  // Minior color naming
  if (name.toLowerCase().includes('minior')) {
    const colorMatch = name.toLowerCase().match(/red|orange|yellow|green|blue|indigo|violet/);
    if (colorMatch) {
      const color = colorMatch[0].charAt(0).toUpperCase() + colorMatch[0].slice(1);
      return `Minior (${color})`;
    }
    return 'Minior';
  }

  // Giratina, Dialga, Palkia naming
  if (name.toLowerCase().includes('giratina') || name.toLowerCase().includes('dialga') || name.toLowerCase().includes('palkia')) {
    if (name.toLowerCase().includes('origin')) return `${name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1)} (Origin)`;
    if (name.toLowerCase().includes('altered')) return 'Giratina (Altera)';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Silvally type naming
  if (name.toLowerCase().includes('silvally')) {
    const parts = name.split('-');
    if (parts.length > 1) {
      const type = parts[1].toLowerCase();
      const typeTranslations: Record<string, string> = {
        'fighting': 'Lotta', 'flying': 'Volante', 'poison': 'Veleno', 'ground': 'Terra',
        'rock': 'Roccia', 'bug': 'Coleottero', 'ghost': 'Spettro', 'steel': 'Acciaio',
        'fire': 'Fuoco', 'water': 'Acqua', 'grass': 'Erba', 'electric': 'Elettro',
        'psychic': 'Psico', 'ice': 'Ghiaccio', 'dragon': 'Drago', 'dark': 'Buio', 'fairy': 'Folletto'
      };
      return `Silvally (${typeTranslations[type] || parts[1].charAt(0).toUpperCase() + parts[1].slice(1)})`;
    }
    return 'Silvally';
  }

  // Arceus type naming
  if (name.toLowerCase().includes('arceus-')) {
    const parts = name.split('-');
    if (parts.length > 1) {
      const type = parts[1].toLowerCase();
      const typeTranslations: Record<string, string> = {
        'fighting': 'Lotta', 'flying': 'Volante', 'poison': 'Veleno', 'ground': 'Terra',
        'rock': 'Roccia', 'bug': 'Coleottero', 'ghost': 'Spettro', 'steel': 'Acciaio',
        'fire': 'Fuoco', 'water': 'Acqua', 'grass': 'Erba', 'electric': 'Elettro',
        'psychic': 'Psico', 'ice': 'Ghiaccio', 'dragon': 'Drago', 'dark': 'Buio', 'fairy': 'Folletto'
      };
      return `Arceus (${typeTranslations[type] || parts[1].charAt(0).toUpperCase() + parts[1].slice(1)})`;
    }
    return 'Arceus';
  }

  // Unown naming
  if (name.toLowerCase().includes('unown-')) {
    const letter = name.split('-')[1].toLowerCase();
    if (letter === 'exclamation') return 'Unown (!)';
    if (letter === 'question') return 'Unown (?)';
    return `Unown (${letter.toUpperCase()})`;
  }

  // Burmy & Wormadam naming
  if (name.toLowerCase().includes('burmy') || name.toLowerCase().includes('wormadam')) {
    const parts = name.split('-');
    const base = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    if (parts.includes('plant')) return `${base} (Plant Cloak)`;
    if (parts.includes('sandy')) return `${base} (Sandy Cloak)`;
    if (parts.includes('trash')) return `${base} (Trash Cloak)`;
    return base;
  }

  // Shellos & Gastrodon naming
  if (name.toLowerCase().includes('shellos') || name.toLowerCase().includes('gastrodon')) {
    const base = name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1);
    if (name.includes('east')) return `${base} (Mare Est)`;
    if (name.includes('west')) return `${base} (Mare Ovest)`;
    return base;
  }

  // Deerling & Sawsbuck naming
  if (name.toLowerCase().includes('deerling') || name.toLowerCase().includes('sawsbuck')) {
    const base = name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1);
    if (name.includes('summer')) return `${base} (Estate)`;
    if (name.includes('autumn')) return `${base} (Autunno)`;
    if (name.includes('winter')) return `${base} (Inverno)`;
    if (name.includes('spring')) return `${base} (Primavera)`;
    return base;
  }

  // Flabébé line naming
  if (name.toLowerCase().includes('flabebe') || name.toLowerCase().includes('floette') || name.toLowerCase().includes('florges')) {
    const base = name.toLowerCase().includes('flabebe') ? 'Flabébé' : (name.toLowerCase().includes('floette') ? 'Floette' : 'Florges');
    if (name.includes('yellow')) return `${base} (Fiore Giallo)`;
    if (name.includes('orange')) return `${base} (Fiore Arancione)`;
    if (name.includes('blue')) return `${base} (Fiore Blu)`;
    if (name.includes('white')) return `${base} (Fiore Bianco)`;
    if (name.includes('red')) return `${base} (Fiore Rosso)`;
    if (name.toLowerCase() === 'floette') return 'Floette (Red)';
    return base;
  }

  // Furfrou naming
  if (name.toLowerCase().includes('furfrou-')) {
    const trim = name.split('-')[1].toLowerCase();
    const trims: Record<string, string> = {
      'heart': 'Cuore', 'star': 'Stella', 'diamond': 'Diamante', 'debutante': 'Demoiselle',
      'matron': 'Matrona', 'dandy': 'Dandy', 'la-reine': 'Regina', 'kabuki': 'Kabuki', 'pharaoh': 'Faraone'
    };
    return `Furfrou (${trims[trim] || trim.charAt(0).toUpperCase() + trim.slice(1)})`;
  }

  // Pumpkaboo & Gourgeist naming
  if (name.toLowerCase().includes('pumpkaboo') || name.toLowerCase().includes('gourgeist')) {
    const base = name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1);
    if (name.includes('small')) return `${base} (Piccolo)`;
    if (name.includes('large')) return `${base} (Grande)`;
    if (name.includes('super')) return `${base} (Maxi)`;
    if (name.includes('average')) return `${base} (Medio)`;
    return base;
  }

  // Teacup/tea form naming
  if (name.toLowerCase().includes('sinistea')) {
    if (name.includes('antique')) return 'Sinistea (Antique)';
    return 'Sinistea (Phony)';
  }

  if (name.toLowerCase().includes('polteageist')) {
    if (name.includes('antique')) return 'Polteageist (Antique)';
    return 'Polteageist (Phony)';
  }

  if (name.toLowerCase().includes('poltchageist')) {
    if (name.includes('artisan')) return 'Poltchageist (Artisan)';
    return 'Poltchageist (Counterfeit)';
  }

  if (name.toLowerCase().includes('sinistcha')) {
    if (name.includes('masterpiece')) return 'Sinistcha (Masterpiece)';
    return 'Sinistcha (Unremarkable)';
  }

  // Toxtricity naming
  if (name.toLowerCase().includes('toxtricity')) {
    if (name.includes('low-key')) return 'Toxtricity (Basso)';
    if (name.includes('amped')) return 'Toxtricity (Melodia)';
    return 'Toxtricity';
  }

  // Enamorus naming
  if (name.toLowerCase().includes('enamorus')) {
    if (name.includes('therian')) return 'Enamorus (Totem)';
    return 'Enamorus (Incarnazione)';
  }

  // Maushold naming
  if (name.toLowerCase().includes('maushold')) {
    if (name.includes('family-of-three')) return 'Maushold (Famiglia da tre)';
    return 'Maushold (Famiglia da quattro)';
  }

  // Squawkabilly naming
  if (name.toLowerCase().includes('squawkabilly')) {
    if (name.includes('blue')) return 'Squawkabilly (Blu)';
    if (name.includes('yellow')) return 'Squawkabilly (Giallo)';
    if (name.includes('white')) return 'Squawkabilly (Bianco)';
    return 'Squawkabilly (Verde)';
  }

  // Tatsugiri naming
  if (name.toLowerCase().includes('tatsugiri')) {
    if (name.includes('droopy')) return 'Tatsugiri (Adagiata)';
    if (name.includes('stretchy')) return 'Tatsugiri (Tesa)';
    return 'Tatsugiri (Arcurata)';
  }

  // Dudunsparce naming
  if (name.toLowerCase().includes('dudunsparce')) {
    if (name.includes('three-segment')) return 'Dudunsparce (Trisegmento)';
    return 'Dudunsparce (Bisegmento)';
  }

  // Minior naming
  if (name.toLowerCase().includes('minior')) {
    if (name.includes('meteor')) return 'Minior (Meteora)';
    const colors: Record<string, string> = {
      'red': 'Rosso', 'orange': 'Arancione', 'yellow': 'Giallo',
      'green': 'Verde', 'blue': 'Blu', 'indigo': 'Indaco', 'violet': 'Violetto'
    };
    const color = name.split('-').find(p => colors[p]);
    return `Minior (${colors[color || ''] || 'Nucleo'})`;
  }

// Vivillon pattern naming
  if (name.toLowerCase().includes('vivillon')) {
    const sName = name.toLowerCase();

    // Check for patterns and return "Vivillon (Pattern)"
    const patterns: Record<string, string> = {
      'meadow': 'Meadow',
      'icy-snow': 'Icy Snow',
      'polar': 'Polar',
      'tundra': 'Tundra',
      'continental': 'Continental',
      'garden': 'Garden',
      'elegant': 'Elegant',
      'modern': 'Modern',
      'marine': 'Marine',
      'fancy': 'Fancy',
      'archipelago': 'Archipelago',
      'high-plains': 'High-Plains',
      'sandstorm': 'Sandstorm',
      'river': 'River',
      'monsoon': 'Monsoon',
      'savanna': 'Savanna',
      'sun': 'Sun',
      'ocean': 'Ocean',
      'jungle': 'Jungle',
      'pokeball': 'Poké Ball',
      'poke-ball': 'Poké Ball'
    };

    for (const [key, label] of Object.entries(patterns)) {
      if (sName.includes(key)) return `Vivillon (${label})`;
    }

    if (sName === 'vivillon') return 'Vivillon (Meadow)';
    return 'Vivillon';
  }

  const regions: Record<string, string> = {
    'alola': 'Alolan',
    'galar': 'Galarian',
    'hisui': 'Hisuian',
    'paldea': 'Paldean'
  };



  const parts = name.split('-');

  // Check if any part is a region
  for (const [key, label] of Object.entries(regions)) {
    const index = parts.indexOf(key);
    if (index !== -1) {
      const baseName = parts
        .filter((_, i) => i !== index)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return `${label} ${baseName}`;
    }
  }



  return parts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function usePokemonList() {
  const { overrides, loading: overridesLoading } = usePokedexOverrides();
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (overridesLoading) return;

    function loadPokemonList() {
      try {
        const list: PokemonBasic[] = pokedexData
          .map((p: any) => {
            const override = (overrides[`${p.id}-${p.name}`] || POKEMON_DATA_OVERRIDES[p.id]) as any;
            const isExcluded = override?.is_excluded || isFormEliminated(p.name);

            return {
              ...p,
              generation: p.generation || getGeneration(p.id, p.name, p.baseId),
              displayName: override?.custom_display_name || formatPokemonName(p.name, p.id, p.baseId),
              hideFromPokedex: isExcluded,
              shinyAvailability: getShinyAvailability({ baseId: p.baseId ?? p.id, name: p.name }),
            };
          });

        const listById = new Map<number, PokemonBasic>();
        list.forEach((p) => listById.set(p.id, p));

        Object.entries(MANUAL_VARIETIES).forEach(([baseIdStr, varieties]) => {
          const baseId = parseInt(baseIdStr, 10);
          const baseEntry = listById.get(baseId);
          varieties.forEach((v) => {
            if (listById.has(v.id)) return;
            const override = (overrides[`${v.id}-${v.name}`] || POKEMON_DATA_OVERRIDES[v.id]) as any;
            const isExcluded = override?.is_excluded || isFormEliminated(v.name);
            const entry: PokemonBasic = {
              id: v.id,
              baseId,
              name: v.name,
              generation: v.generation || baseEntry?.generation || getGeneration(v.id, v.name, baseId),
              displayName: override?.custom_display_name || formatPokemonName(v.name, v.id, baseId),
              hideFromPokedex: isExcluded,
              shinyAvailability: getShinyAvailability({ baseId, name: v.name }),
            };
            list.push(entry);
            listById.set(entry.id, entry);
          });
        });

        setPokemon(list);
        setLoading(false);
      } catch (err) {
        console.error('Error loading pokedex data:', err);
        setError('Failed to load Pokedex data');
        setLoading(false);
      }
    }

    loadPokemonList();
  }, [overridesLoading, overrides]);

  return { pokemon, loading: loading || overridesLoading, error };
}

export function usePokemonDetails(pokemonId: number | null) {
  const { overrides, loading: overridesLoading } = usePokedexOverrides();
  const [pokemon, setPokemon] = useState<PokemonDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonId || overridesLoading) {
      if (!pokemonId) setPokemon(null);
      return;
    }

    function getLocalDetails() {
      setLoading(true);
      setError(null);

      try {
        let entry = pokedexData.find((p: any) => p.id === pokemonId);
        if (!entry) {
          let manualBaseId: number | null = null;
          let manualName: string | null = null;
          let manualGeneration: number | undefined;
          for (const [baseIdStr, varieties] of Object.entries(MANUAL_VARIETIES)) {
            const found = varieties.find((v) => v.id === pokemonId);
            if (found) {
              manualBaseId = parseInt(baseIdStr, 10);
              manualName = found.name;
              manualGeneration = found.generation;
              break;
            }
          }

          if (manualBaseId && manualName) {
            const baseEntry = pokedexData.find((p: any) => p.id === manualBaseId);
            if (baseEntry) {
              entry = {
                ...baseEntry,
                id: pokemonId,
                baseId: manualBaseId,
                name: manualName,
                generation: manualGeneration || baseEntry.generation,
              };
            }
          }
        }

        if (!entry) {
          setError('Pokemon not found in local pokedex');
          setLoading(false);
          return;
        }

        const baseId = entry.baseId || entry.id;
        const name = entry.name;

        // Find all local relatives (varieties/forms) sharing the same baseId
        let relatives = pokedexData.filter((p: any) => p.baseId === baseId);

        // Merge with manual varieties (discovery for purely local system)
        // Alcremie already has all 63 official cream/sweet combinations in
        // pokedex.json. The seven short sweet-only entries are legacy grouping
        // aliases and have no independent sprite, so they must not be details cards.
        const manuals = baseId === 869 ? [] : (MANUAL_VARIETIES[baseId] || []);
        manuals.forEach(m => {
          if (!relatives.some(r => r.id === m.id)) {
            relatives.push({
              id: m.id,
              baseId: baseId,
              name: m.name,
              generation: m.generation || entry.generation
            });
          }
        });

        // These short sweet-only names are grouping aliases, not official
        // Alcremie forms. Keep only the 63 full cream + sweet combinations.
        if (baseId === 869) {
          relatives = relatives.filter((r: any) => !/^alcremie-(strawberry|berry|love|star|clover|flower|ribbon)$/i.test(r.name));
        }

        const isRegionalForm = name && (
          name.includes('-alola') || name.includes('-galar') ||
          name.includes('-hisui') || name.includes('-paldea')
        );
        // Exclude specific forms that do not actually have distinct female sprites
        const excludedGenderDiffNames = ['pikachu-partner-cap'];
        const excludedGenderDiffBaseIds = [667]; // Litleo
        const isExcludedGenderForm = (name && excludedGenderDiffNames.includes(name.toLowerCase())) || excludedGenderDiffBaseIds.includes(baseId);
        const hasGenderDiff = !isRegionalForm && POKEMON_WITH_GENDER_DIFF.includes(baseId) && !isExcludedGenderForm;

        const sprites = {
          default: getPokemonSpriteUrl(pokemonId!, { name: name, animated: true }),
          shiny: getPokemonSpriteUrl(pokemonId!, { shiny: true, name: name, animated: true }),
          femaleDefault: hasGenderDiff ? getPokemonSpriteUrl(pokemonId!, { female: true, name: name, animated: true }) : undefined,
          femaleShiny: hasGenderDiff ? getPokemonSpriteUrl(pokemonId!, { shiny: true, female: true, name: name, animated: true }) : undefined,
        };

        const forms: PokemonFormDetailed[] = relatives
          .filter(r => {
            if (r.id === pokemonId) return false;
            // Avoid duplicating gender variants as "forms" (e.g. Oinkologne female id 10254).
            if (hasGenderDiff && typeof r.name === 'string') {
              const n = r.name.toLowerCase();
              if (n.endsWith('-female') || n.endsWith('-male')) return false;
            }
            return true;
          })
          .map(r => ({
            id: r.id,
            formName: r.name,
            displayName: formatPokemonName(r.name, r.id, baseId),
            sprites: {
              default: getPokemonSpriteUrl(r.id, { name: r.name }),
              shiny: getPokemonSpriteUrl(r.id, { name: r.name, shiny: true }),
            },
          }));

        // In our purely local system, Varieties and Forms are essentially the same relatives
        const varieties: PokemonVariety[] = relatives.map(r => ({
          isDefault: r.id === baseId,
          pokemon: {
            id: r.id,
            name: r.name,
            spriteUrl: getPokemonSpriteUrl(r.id, { name: r.name, shiny: true })
          }
        }));

        // Final result with overrides
        const override = (overrides[`${pokemonId}-${name}`] || POKEMON_DATA_OVERRIDES[pokemonId!]) as any;

        setPokemon({
          id: pokemonId!,
          baseId,
          name: name,
          displayName: override?.custom_display_name || override?.displayName || formatPokemonName(name, pokemonId!, baseId),
          sprites,
          types: override?.types || [], // PokeAPI types removed as requested
          generation: entry.generation || getGeneration(pokemonId!, name, baseId),
          forms,
          varieties,
          hasGenderDifference: hasGenderDiff,
          shinyAvailability: getShinyAvailability({ baseId, name }),
        });

      } catch (err) {
        setError('Failed to load local details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getLocalDetails();
  }, [pokemonId, overridesLoading, overrides]);

  return { pokemon, loading: loading || overridesLoading, error };
}
