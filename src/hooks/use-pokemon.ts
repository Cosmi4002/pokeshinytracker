import { useState, useEffect } from 'react';
import { usePokedexOverrides } from './use-pokedex-overrides';
import { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';
export { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import pokedexData from '@/lib/pokedex.json';
import { isFormEliminated, POKEMON_DATA_OVERRIDES } from '@/lib/form-filters';

export interface PokemonBasic {
  id: number;
  baseId: number;
  name: string;
  displayName: string;
  generation: number;
  hideFromPokedex?: boolean;
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

// Manual Varieties to force inclusion for specific species
export const MANUAL_VARIETIES: Record<number, { id: number, name: string }[]> = {
  // 386: Deoxys removed, to be handled via standard API/JSON
};

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

function getGeneration(id: number, name?: string): number {
  if (name) {
    const slug = name.toLowerCase();
    if (slug.includes('-alola')) return 7;
    if (slug.includes('-galar')) return 8;
    if (slug.includes('-hisui')) return 8; // Legends Arceus is considered Gen 8 technically, or proximity
    if (slug.includes('-paldea')) return 9;
  }

  if (id > 10000) {
    return 9;
  }
  for (const [gen, [start, end]] of Object.entries(GENERATION_RANGES)) {
    if (id >= start && id <= end) return parseInt(gen);
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
  if (name.toLowerCase().includes('meowstic-female')) return 'Meowstic Femmina';

  // Oinkologne name overrides
  if (name.toLowerCase().includes('oinkologne-male')) return 'Oinkologne';
  if (name.toLowerCase().includes('oinkologne-female')) return 'Oinkologne Femmina';

  // Indeedee name overrides
  if (name.toLowerCase().includes('indeedee-male')) return 'Indeedee';
  if (name.toLowerCase().includes('indeedee-female')) return 'Indeedee Femmina';

  // Urshifu name overrides
  if (name.toLowerCase().includes('urshifu-single-strike')) return 'Urshifu';
  if (name.toLowerCase().includes('urshifu-rapid-strike')) return 'Urshifu';

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

  // Silvally type naming
  if (name.toLowerCase().includes('silvally')) {
    const parts = name.split('-');
    if (parts.length > 1) {
      const type = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `Silvally ${type}`;
    }
    return 'Silvally';
  }

  // Vivillon pattern naming
  if (name.toLowerCase().includes('vivillon')) {
    const sName = name.toLowerCase();

    // Check for patterns and return "Vivillon (Pattern)"
    const patterns: Record<string, string> = {
      'meadow': 'Prato',
      'icy-snow': 'Innevato',
      'polar': 'Polare',
      'tundra': 'Tundra',
      'continental': 'Continentale',
      'garden': 'Giardino',
      'elegant': 'Elegante',
      'modern': 'Moderno',
      'marine': 'Marino',
      'fancy': 'Sbarazzino',
      'archipelago': 'Arcipelago',
      'high-plains': 'Montana',
      'sandstorm': 'Sabbia',
      'river': 'Fluviale',
      'monsoon': 'Monsone',
      'savanna': 'Savana',
      'sun': 'Solare',
      'ocean': 'Oceanico',
      'jungle': 'Giungla',
      'pokeball': 'Poké Ball',
      'poke-ball': 'Poké Ball'
    };

    for (const [key, label] of Object.entries(patterns)) {
      if (sName.includes(key)) return `Vivillon (${label})`;
    }

    if (sName === 'vivillon') return 'Vivillon (Prato)';
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
              displayName: override?.custom_display_name || formatPokemonName(p.name, p.id, p.baseId),
              hideFromPokedex: isExcluded,
            };
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
        const entry = pokedexData.find((p: any) => p.id === pokemonId);
        if (!entry) {
          setError('Pokemon not found in local pokedex');
          setLoading(false);
          return;
        }

        const baseId = entry.baseId || entry.id;
        const name = entry.name;

        // Find all local relatives (varieties/forms) sharing the same baseId
        const relatives = pokedexData.filter((p: any) => p.baseId === baseId);

        const isRegionalForm = name && (
          name.includes('-alola') || name.includes('-galar') ||
          name.includes('-hisui') || name.includes('-paldea')
        );
        const hasGenderDiff = !isRegionalForm && POKEMON_WITH_GENDER_DIFF.includes(baseId);

        const sprites = {
          default: getPokemonSpriteUrl(pokemonId!, { name: name, animated: true }),
          shiny: getPokemonSpriteUrl(pokemonId!, { shiny: true, name: name, animated: true }),
          femaleDefault: hasGenderDiff ? getPokemonSpriteUrl(pokemonId!, { female: true, name: name, animated: true }) : undefined,
          femaleShiny: hasGenderDiff ? getPokemonSpriteUrl(pokemonId!, { shiny: true, female: true, name: name, animated: true }) : undefined,
        };

        const forms: PokemonFormDetailed[] = relatives
          .filter(r => r.id !== pokemonId)
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
          generation: entry.generation || getGeneration(pokemonId!, name),
          forms,
          varieties,
          hasGenderDifference: hasGenderDiff,
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
