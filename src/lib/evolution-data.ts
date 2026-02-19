import generatedEvolutionData from '@/lib/evolution-data.generated.json';
import pokedexData from '@/lib/pokedex.json';

export interface EvolutionData {
  prev: number[];
  next: number[];
}

const BASE_EVOLUTION_DATA: Record<number, EvolutionData> = Object.fromEntries(
  Object.entries(generatedEvolutionData as Record<string, EvolutionData>).map(([id, data]) => [
    Number(id),
    {
      prev: [...new Set(data.prev)].sort((a, b) => a - b),
      next: [...new Set(data.next)].sort((a, b) => a - b),
    },
  ])
);

// Regional/special forms that evolve into a different line than their base species.
const FORM_EVOLUTION_OVERRIDES: Record<number, EvolutionData> = {
  10107: { prev: [], next: [10108] },      // Meowth-Alola -> Persian-Alola
  10108: { prev: [10107], next: [] },      // Persian-Alola
  10161: { prev: [], next: [863] },        // Meowth-Galar -> Perrserker
  10166: { prev: [], next: [865] },        // Farfetch'd-Galar -> Sirfetch'd
  10168: { prev: [], next: [866] },        // Mr. Mime-Galar -> Mr. Rime
  10173: { prev: [], next: [864] },        // Corsola-Galar -> Cursola
  10174: { prev: [], next: [10175] },      // Zigzagoon-Galar -> Linoone-Galar
  10175: { prev: [10174], next: [862] },   // Linoone-Galar -> Obstagoon
  10176: { prev: [], next: [10177] },      // Darumaka-Galar -> Darmanitan-Galar
  10177: { prev: [10176], next: [] },      // Darmanitan-Galar
  10179: { prev: [], next: [867] },        // Yamask-Galar -> Runerigus
  10234: { prev: [], next: [904] },        // Qwilfish-Hisui -> Overqwil
  10235: { prev: [], next: [903] },        // Sneasel-Hisui -> Sneasler
  10253: { prev: [], next: [980] },        // Wooper-Paldea -> Clodsire
};

const BASE_ID_BY_POKEMON_ID: Record<number, number> = (pokedexData as Array<{ id: number; baseId: number }>)
  .reduce<Record<number, number>>((acc, p) => {
    acc[p.id] = p.baseId || p.id;
    return acc;
  }, {});

function getEvolutionData(pokemonId: number): EvolutionData | undefined {
  if (FORM_EVOLUTION_OVERRIDES[pokemonId]) {
    return FORM_EVOLUTION_OVERRIDES[pokemonId];
  }

  if (BASE_EVOLUTION_DATA[pokemonId]) {
    return BASE_EVOLUTION_DATA[pokemonId];
  }

  const baseId = BASE_ID_BY_POKEMON_ID[pokemonId];
  if (baseId && BASE_EVOLUTION_DATA[baseId]) {
    return BASE_EVOLUTION_DATA[baseId];
  }

  return undefined;
}

export function getEvolutionChain(pokemonId: number): number[] {
  const chain: number[] = [];
  const visited = new Set<number>();

  const addPrev = (id: number) => {
    const data = getEvolutionData(id);
    if (!data) return;

    data.prev.forEach((prevId) => {
      if (visited.has(prevId)) return;
      visited.add(prevId);
      chain.push(prevId);
      addPrev(prevId);
    });
  };

  const addNext = (id: number) => {
    const data = getEvolutionData(id);
    if (!data) return;

    data.next.forEach((nextId) => {
      if (visited.has(nextId)) return;
      visited.add(nextId);
      chain.push(nextId);
      addNext(nextId);
    });
  };

  addPrev(pokemonId);
  addNext(pokemonId);

  return chain;
}

export function canEvolve(pokemonId: number): boolean {
  const data = getEvolutionData(pokemonId);
  return !!data && data.next.length > 0;
}

export function getNextEvolutions(pokemonId: number): number[] {
  const data = getEvolutionData(pokemonId);
  return data?.next || [];
}

export function getPrevEvolutions(pokemonId: number): number[] {
  const data = getEvolutionData(pokemonId);
  return data?.prev || [];
}

