import { useState, useEffect } from 'react';

export interface PokemonBasic {
  id: number;
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
  formName: string;
  displayName: string;
  sprites: {
    default: string;
    shiny: string;
  };
}

// All Pokemon up to Gen 9 (1025 Pokemon)
const TOTAL_POKEMON = 1025;

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
  for (const [gen, [start, end]] of Object.entries(GENERATION_RANGES)) {
    if (id >= start && id <= end) return parseInt(gen);
  }
  return 1;
}

function formatPokemonName(name: string): string {
  return name
    .split('-')
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
        
        const pokemonList: PokemonBasic[] = data.results.map((p: { name: string }, index: number) => ({
          id: index + 1,
          name: p.name,
          displayName: formatPokemonName(p.name),
        }));
        
        setPokemon(pokemonList);
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
        
        // Also fetch species data for forms
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();
        
        const hasGenderDiff = POKEMON_WITH_GENDER_DIFF.includes(pokemonId);
        
        const sprites = {
          default: data.sprites.front_default,
          shiny: data.sprites.front_shiny,
          femaleDefault: hasGenderDiff ? data.sprites.front_female : undefined,
          femaleShiny: hasGenderDiff ? data.sprites.front_shiny_female : undefined,
        };
        
        // Fetch form data
        const forms: PokemonFormDetailed[] = [];
        if (speciesData.varieties && speciesData.varieties.length > 1) {
          for (const variety of speciesData.varieties) {
            if (!variety.is_default) {
              try {
                const formResponse = await fetch(variety.pokemon.url);
                const formData = await formResponse.json();
                forms.push({
                  formName: variety.pokemon.name,
                  displayName: formatPokemonName(variety.pokemon.name),
                  sprites: {
                    default: formData.sprites.front_default,
                    shiny: formData.sprites.front_shiny,
                  },
                });
              } catch (e) {
                // Some forms may not have sprites
              }
            }
          }
        }
        
        setPokemon({
          id: pokemonId,
          name: data.name,
          displayName: formatPokemonName(data.name),
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
