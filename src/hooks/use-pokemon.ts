import { useState, useEffect } from 'react';
import { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';

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

  // Minior color naming
  if (name.toLowerCase().includes('minior')) {
    const colorMatch = name.toLowerCase().match(/red|orange|yellow|green|blue|indigo|violet/);
    if (colorMatch) {
      const color = colorMatch[0].charAt(0).toUpperCase() + colorMatch[0].slice(1);
      return `Minior ${color}`;
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
          const n = p.name.toLowerCase();

          // Rule 1: Explicitly exclude categories requested by user (Mega, Totem, Gmax, Primal, etc.)
          if (
            n.includes('-mega') ||
            n.includes('-totem') ||
            n.includes('-gmax') ||
            n.includes('-primal') ||
            n.includes('-eternal')
          ) {
            return false;
          }

          // Rule 2: Exclude all Pikachu forms except Partner Cap (user request)
          if (p.baseId === 25 && p.id > 10000 && n !== 'pikachu-partner-cap') {
            return false;
          }

          // Rule 3: Keep all standard Pokemon (Gen 1-9)
          if (p.id <= 1025) {
            return true;
          }

          // Rule 4: Keep Regional forms (and their variants like Zen Mode)
          if (
            n.includes('-alola') ||
            n.includes('-galar') ||
            n.includes('-hisui') ||
            n.includes('-paldea')
          ) {
            return true;
          }

          // Rule 5: Keep seasonal forms (Deerling & Sawsbuck)
          if (n.includes('deerling-') || n.includes('sawsbuck-')) {
            return true;
          }

          // Rule 6: Special case for Pikachu Partner Cap
          if (n === 'pikachu-partner-cap') {
            return true;
          }

          // Rule 7: Exclude Minior Meteor forms (redundant with base)
          if (n.startsWith('minior-') && n.includes('-meteor')) {
            return false;
          }

          return false;
        });

        // Official order sorting
        list.sort((a, b) => {
          if (a.baseId !== b.baseId) return a.baseId - b.baseId;
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          // Put the base form first
          if (aName === bName.split('-')[0]) return -1;
          if (bName === aName.split('-')[0]) return 1;
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
          default: getPokemonSpriteUrl(pokemonId, { name: data.name, animated: true }),
          shiny: getPokemonSpriteUrl(pokemonId, { shiny: true, name: data.name, animated: true }),
          femaleDefault: hasGenderDiff ? getPokemonSpriteUrl(pokemonId, { female: true, name: data.name, animated: true }) : undefined,
          femaleShiny: hasGenderDiff ? getPokemonSpriteUrl(pokemonId, { shiny: true, female: true, name: data.name, animated: true }) : undefined,
        };

        const forms: PokemonFormDetailed[] = [];

        // 1. Fetch form data
        if (data.forms && data.forms.length > 1) {
          for (const form of data.forms) {
            if (form.name === data.name) continue;

            // Skip regional forms here unless they match the current base form's region
            const fn = form.name.toLowerCase();
            const isRegional = fn.includes('-alola') || fn.includes('-galar') || fn.includes('-hisui') || fn.includes('-paldea');

            // If the current pokemon IS a regional variant (e.g. meowth-galar), 
            // we should allow forms that share that region (e.g. meowth-galar-something)
            // But generally, regional forms are separate entries in our list.
            if (isRegional) {
              const myName = data.name.toLowerCase();
              // If I am NOT a regional form, skip all regional forms
              if (!myName.includes('-alola') && !myName.includes('-galar') && !myName.includes('-hisui') && !myName.includes('-paldea')) {
                continue;
              }
              // If I AM a regional form, only skip forms from OTHER regions
              // (e.g. if I am meowth-galar, skip meowth-alola)
              if (myName.includes('-galar') && !fn.includes('-galar')) continue;
              if (myName.includes('-alola') && !fn.includes('-alola')) continue;
              if (myName.includes('-hisui') && !fn.includes('-hisui')) continue;
              if (myName.includes('-paldea') && !fn.includes('-paldea')) continue;
            }

            // Skip Minior Meteor forms
            if (fn.startsWith('minior-') && fn.includes('-meteor')) continue;

            const formIdMatch = form.url.match(/\/pokemon-form\/(\d+)\/?$/);
            const formId = formIdMatch ? parseInt(formIdMatch[1]) : null;

            if (formId) {
              forms.push({
                id: formId,
                formName: form.name,
                displayName: formatPokemonName(form.name, formId),
                sprites: {
                  default: getPokemonSpriteUrl(formId, { name: form.name }),
                  shiny: getPokemonSpriteUrl(formId, { shiny: true, name: form.name }),
                },
              });
            }
          }
        }

        // 2. Fetch species varieties (Megas, Regionals, etc.)
        try {
          const speciesResponse = await fetch(data.species.url);
          const speciesData = await speciesResponse.json();

          if (speciesData.varieties && speciesData.varieties.length > 1) {
            for (const variety of speciesData.varieties) {
              if (variety.is_default) continue;

              const vn = variety.pokemon.name.toLowerCase();

              // SKIP regional forms - they are handled as base pokemon now
              if (vn.includes('-alola') || vn.includes('-galar') || vn.includes('-hisui') || vn.includes('-paldea')) continue;

              // Skip Minior Meteor forms
              if (vn.startsWith('minior-') && vn.includes('-meteor')) continue;

              // Skip mega, totem, etc.
              if (vn.includes('-mega') || vn.includes('-totem') || vn.includes('-gmax') || vn.includes('-primal') || vn.includes('-eternal')) continue;

              const varietyIdMatch = variety.pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
              const varietyId = varietyIdMatch ? parseInt(varietyIdMatch[1]) : null;

              if (varietyId && !forms.some(f => f.id === varietyId)) {
                forms.push({
                  id: varietyId,
                  formName: variety.pokemon.name,
                  displayName: formatPokemonName(variety.pokemon.name, varietyId),
                  sprites: {
                    default: getPokemonSpriteUrl(varietyId, { name: variety.pokemon.name }),
                    shiny: getPokemonSpriteUrl(varietyId, { name: variety.pokemon.name, shiny: true }),
                  },
                });
              }
            }
          }
        } catch (e) {
          // Ignore species fetch errors
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

export { GENERATION_RANGES, POKEMON_WITH_GENDER_DIFF, toShowdownSlug, getPokemonSpriteUrl };
