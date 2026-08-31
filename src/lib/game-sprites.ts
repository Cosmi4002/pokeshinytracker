import { HGSS_SHINY_SPRITE_FILES } from '@/data/hgss-shiny-sprite-manifest';
import { BW_SHINY_SPRITE_FILES } from '@/data/bw-shiny-sprite-manifest';
import { BW2_SHINY_SPRITE_FILES } from '@/data/bw2-shiny-sprite-manifest';

export type GameSpriteOptions = {
  shiny?: boolean;
  female?: boolean;
  name?: string | null;
  form?: string | null;
  gender?: string | null;
};

const ARCHIVE_GAME_PRIORITY = ['black2', 'white2', 'black', 'white', 'heartgold', 'soulsilver'] as const;

export const GAME_SPRITE_SET_BY_GAME: Readonly<Record<string, string>> = {
  heartgold: 'hgss',
  soulsilver: 'hgss',
  black: 'bw',
  white: 'bw',
  black2: 'bw2',
  white2: 'bw2',
};

const filesBySet = {
  hgss: HGSS_SHINY_SPRITE_FILES,
  bw: BW_SHINY_SPRITE_FILES,
  bw2: BW2_SHINY_SPRITE_FILES,
} as const;
const mapsBySet = Object.fromEntries(Object.entries(filesBySet).map(([set, files]) => {
  const map = new Map<number, string[]>();
  for (const filename of files) {
    const match = filename.match(/(?:Spr_[^_]+_)(\d{3})/i);
    if (!match) continue;
    const speciesId = Number(match[1]);
    map.set(speciesId, [...(map.get(speciesId) || []), filename]);
  }
  return [set, { files: new Set(files), bySpecies: map }];
})) as Record<string, { files: Set<string>; bySpecies: Map<number, string[]> }>;

const LEGACY_FORM_SPECIES: ReadonlyArray<[RegExp, number]> = [
  [/^unown(?:-|$)/, 201],
  [/^castform(?:-|$)/, 351],
  [/^deoxys(?:-|$)/, 386],
  [/^burmy(?:-|$)/, 412],
  [/^wormadam(?:-|$)/, 413],
  [/^cherrim(?:-|$)/, 421],
  [/^shellos(?:-|$)/, 422],
  [/^gastrodon(?:-|$)/, 423],
  [/^rotom(?:-|$)/, 479],
  [/^basculin(?:-|$)/, 550],
  [/^deerling(?:-|$)/, 585],
  [/^sawsbuck(?:-|$)/, 586],
  [/^tornadus(?:-|$)/, 641],
  [/^thundurus(?:-|$)/, 642],
  [/^landorus(?:-|$)/, 645],
  [/^giratina(?:-|$)/, 487],
  [/^shaymin(?:-|$)/, 492],
  [/^arceus(?:-|$)/, 493],
];

const normalize = (value?: string | null) => (value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[()]/g, '')
  .replace(/[ _]+/g, '-');

const resolveSpeciesId = (pokemonId: number, slug: string) => {
  if (pokemonId >= 1 && pokemonId <= 649) return pokemonId;
  return LEGACY_FORM_SPECIES.find(([pattern]) => pattern.test(slug))?.[1] ?? null;
};

const getFormSuffix = (speciesId: number, slug: string) => {
  if (speciesId === 201) {
    const raw = slug.replace(/^unown-?/, '');
    if (!raw || raw === 'a') return '';
    if (raw.includes('exclamation')) return 'EX';
    if (raw.includes('question')) return 'QU';
    return raw.slice(0, 1).toUpperCase();
  }
  if (speciesId === 351) {
    if (slug.includes('sunny')) return 'S';
    if (slug.includes('rain')) return 'R';
    if (slug.includes('snow') || slug.includes('hail')) return 'H';
  }
  if (speciesId === 386) {
    if (slug.includes('attack')) return 'A';
    if (slug.includes('defense')) return 'D';
    if (slug.includes('speed')) return 'S';
  }
  if (speciesId === 550) {
    if (slug.includes('blue')) return 'B';
    if (slug.includes('white')) return 'W';
  }
  if (speciesId === 412 || speciesId === 413) {
    if (slug.includes('sandy')) return 'S';
    if (slug.includes('trash')) return 'G';
  }
  if (speciesId === 585 || speciesId === 586) {
    if (slug.includes('summer')) return 'S';
    if (slug.includes('autumn') || slug.includes('fall')) return 'A';
    if (slug.includes('winter')) return 'W';
  }
  if (speciesId === 421 && slug.includes('sunshine')) return 'S';
  if ((speciesId === 422 || speciesId === 423) && slug.includes('east')) return 'E';
  if (speciesId === 479) {
    if (slug.includes('fan')) return 'F';
    if (slug.includes('mow')) return 'L';
    if (slug.includes('heat')) return 'O';
    if (slug.includes('frost')) return 'R';
    if (slug.includes('wash')) return 'W';
  }
  if (speciesId === 487 && slug.includes('origin')) return 'O';
  if (speciesId === 492 && slug.includes('sky')) return 'S';
  if (speciesId === 493) {
    const type = ['bug', 'dark', 'dragon', 'electric', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'poison', 'psychic', 'rock', 'steel', 'unknown', 'water']
      .find((candidate) => slug.includes(candidate));
    return type ? `-${type[0].toUpperCase()}${type.slice(1)}` : '';
  }
  return '';
};

const filenameSuffix = (filename: string, speciesId: number) => {
  const token = String(speciesId).padStart(3, '0');
  const afterId = filename.slice(filename.indexOf(token) + token.length);
  return afterId.replace(/_(?:m|f)_s\.(?:png|webp)$/i, '').replace(/_s\.(?:png|webp)$/i, '').replace(/\.(?:png|webp)$/i, '');
};

const normalizeGender = (gender?: string | null): 'female' | 'male' | null => {
  const normalized = normalize(gender);
  if (normalized === 'female' || normalized === 'f' || normalized === '♀') return 'female';
  if (normalized === 'male' || normalized === 'm' || normalized === '♂') return 'male';
  return null;
};

const HOME_SHINY_OVERRIDE_BY_FORM: Readonly<Record<string, string>> = {
  'tornadus-therian': '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10019.png',
  'thundurus-therian': '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10020.png',
  'landorus-therian': '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10021.png',
};

export function getGameSpecificShinySpriteUrl(
  pokemonId: number,
  gameId?: string | null,
  options: GameSpriteOptions = {},
): string | null {
  const set = gameId ? GAME_SPRITE_SET_BY_GAME[gameId] : undefined;
  if (!set) return null;

  const slug = normalize(options.form || options.name);
  const homeOverride = slug ? HOME_SHINY_OVERRIDE_BY_FORM[slug] : undefined;
  if (homeOverride && ['black', 'white', 'black2', 'white2'].includes(gameId ?? '')) {
    return homeOverride;
  }

  const speciesId = resolveSpeciesId(pokemonId, slug);
  if (!speciesId) return null;
  let resolvedSet = set;
  let spriteSet = mapsBySet[resolvedSet];
  let candidates = spriteSet.bySpecies.get(speciesId) || [];
  if (candidates.length === 0 && set === 'bw2') {
    resolvedSet = 'bw';
    spriteSet = mapsBySet[resolvedSet];
    candidates = spriteSet.bySpecies.get(speciesId) || [];
  }
  if (candidates.length === 0) return null;

  const wantedFormSuffix = getFormSuffix(speciesId, slug);
  let formCandidates = candidates.filter((filename) => filenameSuffix(filename, speciesId) === wantedFormSuffix);
  if (formCandidates.length === 0 && wantedFormSuffix) {
    formCandidates = candidates.filter((filename) => filenameSuffix(filename, speciesId) === '');
  }
  if (formCandidates.length === 0) formCandidates = candidates;

  const requestedGender = normalizeGender(options.gender);
  const genderToken = requestedGender === 'female' ? /_f_s\.(?:png|webp)$/i : /_m_s\.(?:png|webp)$/i;
  const genderMatch = requestedGender
    ? formCandidates.find((filename) => genderToken.test(filename))
    : null;
  const neutralMatch = formCandidates.find((filename) => !/_(?:m|f)_s\.(?:png|webp)$/i.test(filename));
  const maleMatch = formCandidates.find((filename) => /_m_s\.(?:png|webp)$/i.test(filename));
  const filename = genderMatch || neutralMatch || maleMatch || formCandidates[0];
  if (!filename || !spriteSet.files.has(filename)) return null;
  return `/img/game-sprites/${resolvedSet}/${filename}`;
}

export function getArchiveShinySpriteUrl(
  pokemonId: number,
  options: GameSpriteOptions & { preferredGameIds?: Array<string | null | undefined> } = {},
): string | null {
  const orderedGameIds = [
    ...(options.preferredGameIds || []),
    ...ARCHIVE_GAME_PRIORITY,
  ].filter((gameId, index, values): gameId is string => Boolean(gameId) && values.indexOf(gameId) === index);

  for (const gameId of orderedGameIds) {
    const resolved = getGameSpecificShinySpriteUrl(pokemonId, gameId, options);
    if (resolved) return resolved;
  }

  return null;
}

export function getGameSpecificSpriteScaleClass(url?: string | null): string {
  if (!url || !url.startsWith('/img/game-sprites/')) return '';
  const set = url.split('/')[3];
  if (set === 'hgss') return 'scale-[0.98]';
  if (set === 'bw' || set === 'bw2') return 'scale-[0.82]';
  return 'scale-[0.86]';
}

export const isGameSpecificShinySpriteUrl = (url?: string | null) =>
  Boolean(url && url.startsWith('/img/game-sprites/'));

export const hasGameSpecificSpriteSet = (gameId?: string | null) =>
  Boolean(gameId && GAME_SPRITE_SET_BY_GAME[gameId]);
