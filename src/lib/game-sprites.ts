import { HGSS_SHINY_SPRITE_FILES } from '@/data/hgss-shiny-sprite-manifest';
import { DP_SHINY_SPRITE_FILES } from '@/data/dp-shiny-sprite-manifest';
import { DP_SHINY_SPRITE_URL_BY_FILE } from '@/data/dp-shiny-sprite-url-map.generated';
import { PT_SHINY_SPRITE_FILES } from '@/data/pt-shiny-sprite-manifest';
import { PT_SHINY_SPRITE_URL_BY_FILE } from '@/data/pt-shiny-sprite-url-map.generated';
import { BW_SHINY_SPRITE_FILES } from '@/data/bw-shiny-sprite-manifest';
import { BW2_SHINY_SPRITE_FILES } from '@/data/bw2-shiny-sprite-manifest';
import { GAME_SPRITE_LONG_SIDE_BY_FILE } from '@/data/game-sprite-long-sides.generated';
import { LOCAL_SPRITE_URLS } from './local-sprite-map.generated';

export type GameSpriteOptions = {
  shiny?: boolean;
  female?: boolean;
  name?: string | null;
  form?: string | null;
  gender?: string | null;
};

const ARCHIVE_GAME_PRIORITY = ['black2', 'white2', 'black', 'white', 'platinum', 'diamond', 'pearl', 'heartgold', 'soulsilver'] as const;

export const GAME_SPRITE_SET_BY_GAME: Readonly<Record<string, string>> = {
  diamond: 'dp',
  pearl: 'dp',
  platinum: 'pt',
  heartgold: 'hgss',
  soulsilver: 'hgss',
  black: 'bw',
  white: 'bw',
  black2: 'bw2',
  white2: 'bw2',
};

const filesBySet = {
  dp: DP_SHINY_SPRITE_FILES,
  hgss: HGSS_SHINY_SPRITE_FILES,
  pt: PT_SHINY_SPRITE_FILES,
  bw: BW_SHINY_SPRITE_FILES,
  bw2: BW2_SHINY_SPRITE_FILES,
} as const;

type ParsedGameSpriteFile = {
  filename: string;
  speciesId: number;
  formSuffix: string;
  gender: 'female' | 'male' | null;
};

const parseGameSpriteFilename = (filename: string): ParsedGameSpriteFile | null => {
  const match = filename.match(/^Spr_[^_]+_(\d{3})(.*?)\.(?:png|webp)$/i);
  if (!match) return null;

  let formSuffix = match[2] || '';
  formSuffix = formSuffix.replace(/_s$/i, '');

  let gender: ParsedGameSpriteFile['gender'] = null;
  const genderMatch = formSuffix.match(/_([fm])$/i);
  if (genderMatch) {
    gender = genderMatch[1].toLowerCase() === 'f' ? 'female' : 'male';
    formSuffix = formSuffix.slice(0, -2);
  }

  return {
    filename,
    speciesId: Number(match[1]),
    formSuffix,
    gender,
  };
};

const mapsBySet = Object.fromEntries(Object.entries(filesBySet).map(([set, files]) => {
  const map = new Map<number, ParsedGameSpriteFile[]>();
  for (const filename of files) {
    const parsed = parseGameSpriteFilename(filename);
    if (!parsed) continue;
    map.set(parsed.speciesId, [...(map.get(parsed.speciesId) || []), parsed]);
  }
  return [set, { files: new Set(files), bySpecies: map }];
})) as Record<string, { files: Set<string>; bySpecies: Map<number, ParsedGameSpriteFile[]> }>;

const DP_SHINY_SPRITE_FILE_BY_URL = new Map(
  Object.entries(DP_SHINY_SPRITE_URL_BY_FILE).map(([filename, url]) => [url, filename]),
);
const PT_SHINY_SPRITE_FILE_BY_URL = new Map(
  Object.entries(PT_SHINY_SPRITE_URL_BY_FILE).map(([filename, url]) => [url, filename]),
);

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

// Keep this module independent from pokemon-data: pokemon-data also uses the
// game sprite resolver, so importing its URL helper here would create a cycle.
const toLocalPokemonSpriteUrl = (remoteUrl: string): string => {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl;

  const localUrl = LOCAL_SPRITE_URLS[remoteUrl];
  if (localUrl) return localUrl;

  try {
    const parsed = new URL(remoteUrl);
    if (parsed.hostname === 'archives.bulbagarden.net' && parsed.pathname.includes('/media/upload/')) {
      const decodedPath = decodeURIComponent(parsed.pathname)
        .replace(/^\/+/, '')
        .replace(/[^a-zA-Z0-9._/-]/g, '-');
      return `/${['img', 'pokemon-sprites', 'remote', parsed.hostname, decodedPath].join('/')}`;
    }
  } catch {
    // Use the original URL when it cannot be normalized to a local asset.
  }

  return remoteUrl;
};

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

const normalizeGender = (gender?: string | null): 'female' | 'male' | null => {
  const normalized = normalize(gender);
  if (normalized === 'female' || normalized === 'f' || normalized === '♀') return 'female';
  if (normalized === 'male' || normalized === 'm' || normalized === '♂') return 'male';
  return null;
};

const ARCHIVE_THERIAN_SHINY_OVERRIDE_BY_FORM: Readonly<Record<string, string>> = {
  'tornadus-therian': 'https://archives.bulbagarden.net/media/upload/3/3c/Spr_5b2_641T_s.png',
  'thundurus-therian': 'https://archives.bulbagarden.net/media/upload/2/21/Spr_5b2_642T_s.png',
  'landorus-therian': 'https://archives.bulbagarden.net/media/upload/3/36/Spr_5b2_645T_s.png',
};

const HGSS_SPRITE_MEDIAN_LONG_SIDE = (() => {
  const grouped = new Map<string, number[]>();
  for (const [filePath, longSide] of Object.entries(GAME_SPRITE_LONG_SIDE_BY_FILE)) {
    const set = filePath.split('/')[0];
    const values = grouped.get(set) || [];
    values.push(longSide);
    grouped.set(set, values);
  }

  const median = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  };

  return median(grouped.get('hgss') || []);
})();

const getGameSpecificSpriteFilePath = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('/img/game-sprites/')) {
    const parts = url.split('/');
    if (parts.length < 5) return null;
    return `${parts[3]}/${parts.slice(4).join('/')}`;
  }
  // Diamond, Pearl and Platinum sprites are cached from Bulbagarden under the
  // generic remote-assets directory. Keep recognizing those local URLs as game
  // sprites, otherwise they miss the same scaling treatment as every other
  // game asset and can render as an unscaled transparent canvas on cards.
  const localArchiveMatch = url.match(/\/img\/pokemon-sprites\/remote\/archives\.bulbagarden\.net\/media\/upload\/[^/]+\/[^/]+\/(Spr_[^/?#]+)$/i);
  if (localArchiveMatch) {
    const filename = decodeURIComponent(localArchiveMatch[1]);
    if (filename.startsWith('Spr_4d_')) return `dp/${filename}`;
    if (filename.startsWith('Spr_4p_')) return `pt/${filename}`;
  }
  const mediaUploadMatch = url.match(/archives\.bulbagarden\.net\/media\/upload\/[^/]+\/[^/]+\/(Spr_[^/?#]+)$/i);
  if (mediaUploadMatch) {
    const filename = decodeURIComponent(mediaUploadMatch[1]);
    if (PT_SHINY_SPRITE_FILE_BY_URL.get(url)) return `pt/${filename}`;
    if (DP_SHINY_SPRITE_FILE_BY_URL.get(url)) return `dp/${filename}`;
    if (filename.startsWith('Spr_4d_')) return `dp/${filename}`;
    if (filename.startsWith('Spr_4p_')) return `pt/${filename}`;
  }
  const archiveMatch = url.match(/\/Special:Redirect\/file\/([^?]+)/i);
  if (archiveMatch) {
    const filename = decodeURIComponent(archiveMatch[1]);
    if (filename.startsWith('Spr_4d_') || filename.startsWith('Spr_4p_')) {
      return `${filename.startsWith('Spr_4d_') ? 'dp' : 'pt'}/${filename}`;
    }
  }
  return null;
};

const getGameSpecificSpriteScaleFactorFromFile = (filePath?: string | null) => {
  if (!filePath) return null;
  const longSide = GAME_SPRITE_LONG_SIDE_BY_FILE[filePath];
  if (!longSide) return null;
  if (!HGSS_SPRITE_MEDIAN_LONG_SIDE) return null;
  // `object-contain` gives every source canvas the same box. Scale must therefore
  // be inverse to the opaque sprite size. HGSS is the visual baseline across the
  // site, so DP, Pt, BW and BW2 sprites are normalized to the same footprint
  // rather than to a median that differs for each game set.
  return (HGSS_SPRITE_MEDIAN_LONG_SIDE / longSide) * 1.1;
};

export function getGameSpecificShinySpriteUrl(
  pokemonId: number,
  gameId?: string | null,
  options: GameSpriteOptions = {},
): string | null {
  const set = gameId ? GAME_SPRITE_SET_BY_GAME[gameId] : undefined;
  if (!set) return null;

  const slug = normalize(options.form || options.name);
  const archiveTherianOverride = slug ? ARCHIVE_THERIAN_SHINY_OVERRIDE_BY_FORM[slug] : undefined;
  if (archiveTherianOverride && ['black', 'white', 'black2', 'white2'].includes(gameId ?? '')) {
    return toLocalPokemonSpriteUrl(archiveTherianOverride) || archiveTherianOverride;
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
  let formCandidates = candidates.filter((spriteFile) => spriteFile.formSuffix === wantedFormSuffix);
  if (formCandidates.length === 0 && wantedFormSuffix) {
    formCandidates = candidates.filter((spriteFile) => spriteFile.formSuffix === '');
  }
  if (formCandidates.length === 0) formCandidates = candidates;

  const requestedGender = normalizeGender(options.gender);
  const genderMatch = requestedGender
    ? formCandidates.find((spriteFile) => spriteFile.gender === requestedGender)
    : null;
  const neutralMatch = formCandidates.find((spriteFile) => spriteFile.gender === null);
  const maleMatch = formCandidates.find((spriteFile) => spriteFile.gender === 'male');
  const filename = (genderMatch || neutralMatch || maleMatch || formCandidates[0])?.filename;
  if (!filename || !spriteSet.files.has(filename)) return null;

  let resolvedUrl: string | null = null;
  if (resolvedSet === 'dp') {
    resolvedUrl = DP_SHINY_SPRITE_URL_BY_FILE[filename] || null;
  } else if (resolvedSet === 'pt') {
    resolvedUrl = PT_SHINY_SPRITE_URL_BY_FILE[filename] || null;
  } else {
    resolvedUrl = `/img/game-sprites/${resolvedSet}/${filename}`;
  }

  if (!resolvedUrl) return null;
  return toLocalPokemonSpriteUrl(resolvedUrl) || resolvedUrl;
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
  return getGameSpecificSpriteFilePath(url) ? 'scale-[var(--sprite-scale)]' : '';
}

export function getGameSpecificSpriteScaleFactor(url?: string | null): number {
  const filePath = getGameSpecificSpriteFilePath(url);
  const scaleFromFile = getGameSpecificSpriteScaleFactorFromFile(filePath);
  if (scaleFromFile) return scaleFromFile;
  if (!filePath) return 1;
  return 1;
}

export function getGameSpecificSpriteScaleStyle(url?: string | null, multiplier = 1): any {
  return {
    '--sprite-scale': String(getGameSpecificSpriteScaleFactor(url) * multiplier),
  };
}

export const isGameSpecificShinySpriteUrl = (url?: string | null) =>
  Boolean(getGameSpecificSpriteFilePath(url));

export const hasGameSpecificSpriteSet = (gameId?: string | null) =>
  Boolean(gameId && GAME_SPRITE_SET_BY_GAME[gameId]);
