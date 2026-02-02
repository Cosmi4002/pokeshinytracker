import { useState, useEffect } from 'react';

export interface PokemonBasic {
  id: number;
  baseId: number;
  name: string;
  displayName: string;
}

export interface PokemonDetailed {
  id: number;
  name: string;
  displayName: string;
  sprites: {
    default: string;
    shiny: string;
    femalDefault?: string;
    femaleShiny?: string;
  };
  types: string[];
  generation: number;
  forms: PokemonFormDetailed[];
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
const POKEMON_WITH_GENDER_DIFF = [
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119,
  123, 129, 130, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203,
  207, 208, 212, 214, 215, 217, 221, 224, 229, 232, 255, 256, 257, 267, 269,
  272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350, 369, 396, 397,
  398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443,
  444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
  592, 593, 668, 678, 876, 902, 916
];

// Generation ranges
const GENERATION_RANGES: Record<number, [number, number]> = {
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

function getGeneration(id: number): number {
  if (id > 10000) {
    // For regional forms, we'd ideally fetch species, but we can approximate
    // or just default to a generation.
    return 9;
  }
  for (const [gen, [start, end]] of Object.entries(GENERATION_RANGES)) {
    if (id >= start && id <= end) return parseInt(gen);
  }
  return 1;
}

function formatPokemonName(name: string, id: number, baseId?: number): string {
  const speciesId = baseId || id;

  if (speciesId === 585 || speciesId === 586) {
    if (name.includes('-summer')) return `Summer Form ${speciesId === 585 ? 'Deerling' : 'Sawsbuck'}`;
    if (name.includes('-autumn')) return `Autumn Form ${speciesId === 585 ? 'Deerling' : 'Sawsbuck'}`;
    if (name.includes('-winter')) return `Winter Form ${speciesId === 585 ? 'Deerling' : 'Sawsbuck'}`;
    if (name.includes('-spring') || name === 'deerling' || name === 'sawsbuck')
      return `Spring Form ${speciesId === 585 ? 'Deerling' : 'Sawsbuck'}`;
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
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPokemonList() {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMON}`);
        const data = await response.json();

        // Pass 1: Build base name map
        const basePokemonMap = new Map<string, number>();
        const allRaw = data.results.map((p: { name: string, url: string }) => {
          const idMatch = p.url.match(/\/pokemon\/(\d+)\/?$/);
          const id = idMatch ? parseInt(idMatch[1]) : 0;
          if (id <= 1025) basePokemonMap.set(p.name, id);
          return { id, name: p.name };
        });

        const list: PokemonBasic[] = allRaw.map((p: any) => {
          let baseId = p.id;
          if (p.id > 10000) {
            const parts = p.name.split('-');
            for (let i = parts.length - 1; i > 0; i--) {
              const prefix = parts.slice(0, i).join('-');
              if (basePokemonMap.has(prefix)) {
                baseId = basePokemonMap.get(prefix)!;
                break;
              }
            }
          }

          return {
            id: p.id,
            baseId,
            name: p.name,
            displayName: formatPokemonName(p.name, p.id, baseId),
          };
        }).filter((p: any) => {
          if (p.id <= 1025) return true;
          const n = p.name.toLowerCase();

          // Exclude Megas/GMAX to avoid confusion and incorrect sprites
          if (n.includes('-mega') || n.includes('-gmax') || n.includes('-totem') || n.includes('-cap')) return false;

          // Keep Regional forms
          if (n.endsWith('-alola') || n.endsWith('-galar') || n.endsWith('-hisui') || n.endsWith('-paldea')) return true;

          // Keep seasonal forms
          if (n.includes('deerling-') || n.includes('sawsbuck-')) return true;

          return false;
        });

        // Official order sorting
        list.sort((a, b) => {
          if (a.baseId !== b.baseId) return a.baseId - b.baseId;
          if (a.id <= 1025) return -1;
          if (b.id <= 1025) return 1;
          return a.id - b.id;
        });

        setPokemon(list);
      } catch (err) {
        setError('Failed to fetch Pokemon list');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPokemonList();
  }, []);

  return { pokemon, loading, error };
}

export function usePokemonDetails(pokemonId: number | null) {
  const [pokemon, setPokemon] = useState<PokemonDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonId) {
      setPokemon(null);
      return;
    }

    async function fetchPokemonDetails() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const data = await response.json();

        const hasGenderDiff = POKEMON_WITH_GENDER_DIFF.includes(pokemonId);

        const sprites = {
          default: data.sprites.front_default,
          shiny: data.sprites.front_shiny,
          femaleDefault: hasGenderDiff ? data.sprites.front_female : undefined,
          femaleShiny: hasGenderDiff ? data.sprites.front_shiny_female : undefined,
        };

        // Load forms from data.forms[] - these have proper sprites
        const forms: PokemonFormDetailed[] = [];
        if (data.forms && data.forms.length > 1) {
          for (const form of data.forms) {
            // Skip the default form (same as base)
            if (form.name === data.name) continue;

            // Extract form ID from URL: /pokemon-form/{id}/
            const formIdMatch = form.url.match(/\/pokemon-form\/(\d+)\/?$/);
            const formId = formIdMatch ? parseInt(formIdMatch[1]) : null;

            if (formId) {
              try {
                const formResponse = await fetch(form.url);
                const formData = await formResponse.json();
                forms.push({
                  id: formId,
                  formName: form.name,
                  displayName: formatPokemonName(form.name, formId),
                  sprites: {
                    default: formData.sprites.front_default,
                    shiny: formData.sprites.front_shiny,
                  },
                });
              } catch (e) {
                // Fallback to construction if fetch fails
                forms.push({
                  id: formId,
                  formName: form.name,
                  displayName: formatPokemonName(form.name, formId),
                  sprites: {
                    default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formId}.png`,
                    shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${formId}.png`,
                  },
                });
              }
            }
          }
        }

        // Also fetch species varieties for regional forms, megas, etc.
        try {
          const speciesResponse = await fetch(data.species.url);
          const speciesData = await speciesResponse.json();

          if (speciesData.varieties && speciesData.varieties.length > 1) {
            for (const variety of speciesData.varieties) {
              if (!variety.is_default) {
                // Extract ID from URL: /pokemon/{id}/
                const varietyIdMatch = variety.pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
                const varietyId = varietyIdMatch ? parseInt(varietyIdMatch[1]) : null;

                // Check if this variety is already in forms
                if (varietyId && !forms.some(f => f.id === varietyId)) {
                  forms.push({
                    id: varietyId,
                    formName: variety.pokemon.name,
                    displayName: formatPokemonName(variety.pokemon.name, varietyId),
                    sprites: {
                      default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${varietyId}.png`,
                      shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${varietyId}.png`,
                    },
                  });
                }
              }
            }
          }
        } catch (e) {
          // Ignore species fetch errors - forms from data.forms are enough
        }

        setPokemon({
          id: pokemonId,
          name: data.name,
          displayName: formatPokemonName(data.name, pokemonId),
          sprites,
          types: data.types.map((t: any) => t.type.name),
          generation: getGeneration(pokemonId),
          forms,
          hasGenderDifference: hasGenderDiff,
        });
      } catch (err) {
        setError('Failed to fetch Pokemon details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPokemonDetails();
  }, [pokemonId]);

  return { pokemon, loading, error };
}

export function getPokemonSpriteUrl(
  id: number,
  options: {
    shiny?: boolean;
    female?: boolean;
    form?: string;
  } = {}
): string {
  const { shiny = false, female = false, form } = options;

  // Use PokeAPI sprites
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

  let path = '';
  if (shiny) path += '/shiny';
  if (female) path += '/female';

  // Handle form IDs (like -alola, -galar, etc.)
  const pokemonId = form ? form : id.toString();

  return `${baseUrl}${path}/${pokemonId}.png`;
}

export function getShinyCharmIcon(): string {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png';
}

export { GENERATION_RANGES, POKEMON_WITH_GENDER_DIFF };
