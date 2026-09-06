const POKESPRITE_ITEM_BASE_URL = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/fossil';

type FossilRestoreIcon = {
  id: string;
  name: string;
  url: string;
};

type FossilDefinition = Omit<FossilRestoreIcon, 'url'>;

const FOSSILS: Record<string, FossilDefinition> = {
  helix: { id: 'helix', name: 'Helix Fossil' },
  dome: { id: 'dome', name: 'Dome Fossil' },
  amber: { id: 'old-amber', name: 'Old Amber' },
  root: { id: 'root', name: 'Root Fossil' },
  claw: { id: 'claw', name: 'Claw Fossil' },
  skull: { id: 'skull', name: 'Skull Fossil' },
  armor: { id: 'armor', name: 'Armor Fossil' },
  cover: { id: 'cover', name: 'Cover Fossil' },
  plume: { id: 'plume', name: 'Plume Fossil' },
  jaw: { id: 'jaw', name: 'Jaw Fossil' },
  sail: { id: 'sail', name: 'Sail Fossil' },
  bird: { id: 'fossilized-bird', name: 'Fossilized Bird' },
  dino: { id: 'fossilized-dino', name: 'Fossilized Dino' },
  drake: { id: 'fossilized-drake', name: 'Fossilized Drake' },
  fish: { id: 'fossilized-fish', name: 'Fossilized Fish' },
};

const FOSSILS_BY_POKEMON_ID: Record<number, FossilDefinition[]> = {
  138: [FOSSILS.helix], 139: [FOSSILS.helix],
  140: [FOSSILS.dome], 141: [FOSSILS.dome],
  142: [FOSSILS.amber],
  345: [FOSSILS.root], 346: [FOSSILS.root],
  347: [FOSSILS.claw], 348: [FOSSILS.claw],
  408: [FOSSILS.skull], 409: [FOSSILS.skull],
  410: [FOSSILS.armor], 411: [FOSSILS.armor],
  564: [FOSSILS.cover], 565: [FOSSILS.cover],
  566: [FOSSILS.plume], 567: [FOSSILS.plume],
  696: [FOSSILS.jaw], 697: [FOSSILS.jaw],
  698: [FOSSILS.sail], 699: [FOSSILS.sail],
  880: [FOSSILS.bird, FOSSILS.dino],
  881: [FOSSILS.bird, FOSSILS.dino],
  882: [FOSSILS.drake, FOSSILS.fish],
  883: [FOSSILS.drake, FOSSILS.fish],
};

/** Returns the PokeSprite inventory fossils used to revive the selected Pokémon. */
export const getFossilRestoreIcons = (pokemonId: number): FossilRestoreIcon[] =>
  (FOSSILS_BY_POKEMON_ID[pokemonId] || []).map((fossil) => ({
    ...fossil,
    url: `${POKESPRITE_ITEM_BASE_URL}/${fossil.id}.png`,
  }));
