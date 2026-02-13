import { useState, useEffect } from 'react';
export { toShowdownSlug, getPokemonSpriteUrl } from '@/lib/pokemon-data';
import pokedexData from '@/lib/pokedex.json';

export interface PokemonBasic {
  id: number;
  baseId: number;
  name: string;
  displayName: string;
  generation: number;
  hideFromPokedex?: boolean;
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
export const POKEMON_WITH_GENDER_DIFF = [
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111, 112, 118, 119,
  123, 129, 130, 154, 165, 166, 178, 185, 186, 190, 194, 195, 198, 202, 203,
  207, 208, 212, 214, 215, 217, 221, 224, 229, 232, 255, 256, 257, 267, 269,
  272, 274, 275, 307, 308, 315, 316, 317, 322, 323, 332, 350, 369, 396, 397,
  398, 399, 400, 401, 402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443,
  444, 445, 449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
  592, 593, 902
];

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
  if (name.toLowerCase().includes('urshifu-rapid-strike')) return 'Urshifu Rapid Strike';

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
    function loadPokemonList() {
      try {
        const list: PokemonBasic[] = pokedexData.map((p: any) => ({
          ...p,
          displayName: formatPokemonName(p.name, p.id, p.baseId),
          hideFromPokedex:
            p.name.includes('oinkologne-female') ||
            p.name.includes('urshifu-rapid-strike') ||
            p.name.includes('meowstic-female') ||
            p.name.includes('indeedee-female'),
        }));

        setPokemon(list);
        setLoading(false);
      } catch (err) {
        console.error('Error loading pokedex data:', err);
        setError('Failed to load Pokedex data');
        setLoading(false);
      }
    }

    loadPokemonList();
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

              // Determine if the current Pokemon (ME) is regional
              const myName = data.name.toLowerCase();
              const amIRegional = myName.includes('-alola') || myName.includes('-galar') || myName.includes('-hisui') || myName.includes('-paldea');

              if (amIRegional) {
                // If I am regional, ONLY allow varieties from my own region
                // This filters out standard/Unovan forms from Galarian pages, and other regions
                if (myName.includes('-galar') && !vn.includes('-galar')) continue;
                if (myName.includes('-alola') && !vn.includes('-alola')) continue;
                if (myName.includes('-hisui') && !vn.includes('-hisui')) continue;
                if (myName.includes('-paldea') && !vn.includes('-paldea')) continue;
              } else {
                // If I am NOT regional, skip all regional varieties (they are separate entries)
                if (vn.includes('-alola') || vn.includes('-galar') || vn.includes('-hisui') || vn.includes('-paldea')) continue;
              }

              // Skip Minior Meteor forms
              if (vn.startsWith('minior-') && vn.includes('-meteor')) continue;

              // Skip mega, totem, etc.
              if (vn.includes('-mega') || vn.includes('-totem') || vn.includes('-gmax') || vn.includes('-primal') || vn.includes('-eternal')) continue;

              const varietyIdMatch = variety.pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
              const varietyId = varietyIdMatch ? parseInt(varietyIdMatch[1]) : null;

              if (varietyId === pokemonId) continue;

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
          generation: getGeneration(pokemonId, data.name),
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
