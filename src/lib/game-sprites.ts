import { HGSS_SHINY_SPRITE_FILES } from '@/data/hgss-shiny-sprite-manifest';

export type GameSpriteOptions = {
  name?: string | null;
  form?: string | null;
  gender?: string | null;
};

export const GAME_SPRITE_SET_BY_GAME: Readonly<Record<string, string>> = {
  heartgold: 'hgss',
  soulsilver: 'hgss',
};

const hgssFiles = new Set<string>(HGSS_SHINY_SPRITE_FILES);
const hgssFilesBySpecies = new Map<number, string[]>();

for (const filename of HGSS_SHINY_SPRITE_FILES) {
  const match = filename.match(/^Spr_4[dhp]_(\d{3})/i);
  if (!match) continue;
  const speciesId = Number(match[1]);
  hgssFilesBySpecies.set(speciesId, [...(hgssFilesBySpecies.get(speciesId) || []), filename]);
}

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

const resolveHgssSpeciesId = (pokemonId: number, slug: string) => {
  if (pokemonId >= 1 && pokemonId <= 493) return pokemonId;
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
  if (speciesId === 412 || speciesId === 413) {
    if (slug.includes('sandy')) return 'S';
    if (slug.includes('trash')) return 'G';
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
  return afterId.replace(/_(?:m|f)_s\.png$/i, '').replace(/_s\.png$/i, '').replace(/\.png$/i, '');
};

export function getGameSpecificShinySpriteUrl(
  pokemonId: number,
  gameId?: string | null,
  options: GameSpriteOptions = {},
): string | null {
  if (!gameId || GAME_SPRITE_SET_BY_GAME[gameId] !== 'hgss') return null;

  const slug = normalize(options.form || options.name);
  const speciesId = resolveHgssSpeciesId(pokemonId, slug);
  if (!speciesId) return null;
  const candidates = hgssFilesBySpecies.get(speciesId) || [];
  if (candidates.length === 0) return null;

  const wantedFormSuffix = getFormSuffix(speciesId, slug);
  let formCandidates = candidates.filter((filename) => filenameSuffix(filename, speciesId) === wantedFormSuffix);
  if (formCandidates.length === 0 && wantedFormSuffix) {
    formCandidates = candidates.filter((filename) => filenameSuffix(filename, speciesId) === '');
  }
  if (formCandidates.length === 0) formCandidates = candidates;

  const genderToken = options.gender === 'female' ? '_f_s.png' : '_m_s.png';
  const genderMatch = formCandidates.find((filename) => filename.toLowerCase().endsWith(genderToken));
  const neutralMatch = formCandidates.find((filename) => !/_(?:m|f)_s\.png$/i.test(filename));
  const maleMatch = formCandidates.find((filename) => filename.toLowerCase().endsWith('_m_s.png'));
  const filename = genderMatch || neutralMatch || maleMatch || formCandidates[0];
  if (!filename || !hgssFiles.has(filename)) return null;
  return `/img/game-sprites/hgss/${filename}`;
}

export const hasGameSpecificSpriteSet = (gameId?: string | null) =>
  Boolean(gameId && GAME_SPRITE_SET_BY_GAME[gameId]);
