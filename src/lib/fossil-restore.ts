type FossilRestoreIcon = {
  id: string;
  name: string;
  url: string;
};

type FossilDefinition = Omit<FossilRestoreIcon, 'url'> & {
  asset: string;
};

const FOSSIL_IMAGE_BASE_URL = '/img/Fossil png';

const FOSSILS: Record<string, FossilDefinition> = {
  helix: { id: 'helix-fossil', name: 'Helix Fossil', asset: 'helix' },
  dome: { id: 'dome-fossil', name: 'Dome Fossil', asset: 'dome' },
  amber: { id: 'old-amber', name: 'Old Amber', asset: 'old-amber' },
  root: { id: 'root-fossil', name: 'Root Fossil', asset: 'root' },
  claw: { id: 'claw-fossil', name: 'Claw Fossil', asset: 'claw' },
  skull: { id: 'skull-fossil', name: 'Skull Fossil', asset: 'skull' },
  armor: { id: 'armor-fossil', name: 'Armor Fossil', asset: 'armor' },
  cover: { id: 'cover-fossil', name: 'Cover Fossil', asset: 'cover' },
  plume: { id: 'plume-fossil', name: 'Plume Fossil', asset: 'plume' },
  jaw: { id: 'jaw-fossil', name: 'Jaw Fossil', asset: 'jaw' },
  sail: { id: 'sail-fossil', name: 'Sail Fossil', asset: 'sail' },
  bird: { id: 'fossilized-bird', name: 'Fossilized Bird', asset: 'bird' },
  dino: { id: 'fossilized-dino', name: 'Fossilized Dino', asset: 'dino' },
  drake: { id: 'fossilized-drake', name: 'Fossilized Drake', asset: 'drake' },
  fish: { id: 'fossilized-fish', name: 'Fossilized Fish', asset: 'fish' },
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

/** Returns the bundled fossil images used to revive the selected Pokémon. */
export const getFossilRestoreIcons = (pokemonId: number): FossilRestoreIcon[] =>
  (FOSSILS_BY_POKEMON_ID[pokemonId] || []).map(({ asset, ...fossil }) => ({
    ...fossil,
    url: `${FOSSIL_IMAGE_BASE_URL}/${asset}.png`,
  }));
