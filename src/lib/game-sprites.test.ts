import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl, getGameSpecificSpriteImageRendering, getGameSpecificSpriteScaleClass, getGameSpecificSpriteScaleFactor, getGameSpecificSpriteScaleStyle } from './game-sprites';
import { toLocalPokemonSpriteUrl } from './pokemon-data';
import { GAME_SPRITE_LONG_SIDE_BY_FILE } from '@/data/game-sprite-long-sides.generated';
import { BW_SHINY_SPRITE_FILES } from '@/data/bw-shiny-sprite-manifest';
import { BW2_SHINY_SPRITE_FILES } from '@/data/bw2-shiny-sprite-manifest';

const expectedSpriteUrl = (url: string) => toLocalPokemonSpriteUrl(url);

describe('game-specific shiny sprites', () => {
  it.each([
    ['diamond', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['platinum', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['gold', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2g_001_s.png'],
    ['silver', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2s_001_s.png'],
    ['crystal', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2c_001_s.png'],
    ['ruby', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3r_001_s.png'],
    ['sapphire', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3r_001_s.png'],
    ['firered', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3f_001_s.png'],
    ['leafgreen', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3f_001_s.png'],
    ['emerald', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3e_001_s.png'],
    ['heartgold', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['black2', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
  ])('resolves Bulbasaur for %s', (gameId, expected) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' })).toBe(expectedSpriteUrl(expected));
  });

  it.each([
    [641, 'tornadus-therian', 'https://archives.bulbagarden.net/media/upload/3/3c/Spr_5b2_641T_s.png'],
    [642, 'thundurus-therian', 'https://archives.bulbagarden.net/media/upload/2/21/Spr_5b2_642T_s.png'],
    [645, 'landorus-therian', 'https://archives.bulbagarden.net/media/upload/3/36/Spr_5b2_645T_s.png'],
  ])('uses the B2W2 archive sprite for %s (%s)', (pokemonId, form, expected) => {
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'black2', { name: form, form })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'white2', { name: form, form })).toBe(expected);
  });

  it('resolves Giratina Origin in Platinum through the archive media URL', () => {
    expect(getGameSpecificShinySpriteUrl(487, 'platinum', { name: 'giratina-origin', form: 'giratina-origin' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/2/2f/Spr_4p_487O_s.png'));
  });

  it.each([
    [487, 'giratina-origin'],
    [492, 'shaymin-sky'],
  ])('does not substitute the base form for %s (%s) in Diamond or Pearl', (pokemonId, form) => {
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'diamond', { name: form, form })).toBeNull();
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'pearl', { name: form, form })).toBeNull();
  });

  it('resolves Mismagius in Platinum through the archive media URL', () => {
    expect(getGameSpecificShinySpriteUrl(429, 'platinum', { name: 'mismagius' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/3/38/Spr_4p_429_s.png'));
  });

  it.each([
    [458, 'mantyke', 'https://archives.bulbagarden.net/media/upload/9/9b/Spr_4p_458_s.png'],
    [462, 'magnezone', 'https://archives.bulbagarden.net/media/upload/b/b8/Spr_4p_462_s.png'],
  ])('resolves Platinum-only sprite %s through the archive media URL', (pokemonId, name, expected) => {
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'platinum', { name })).toBe(expectedSpriteUrl(expected));
  });

  it.each([
    ['diamond', 'male', 'https://archives.bulbagarden.net/media/upload/0/0d/Spr_4d_445_m_s.png'],
    ['platinum', 'male', 'https://archives.bulbagarden.net/media/upload/8/87/Spr_4p_445_m_s.png'],
    ['platinum', 'female', 'https://archives.bulbagarden.net/media/upload/f/f5/Spr_4p_445_f_s.png'],
  ])('resolves Garchomp gender-specific sprite for %s %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(445, gameId, { name: 'garchomp', gender })).toBe(expectedSpriteUrl(expected));
  });

  it('resolves Deoxys forms in Diamond, Pearl, and Platinum', () => {
    expect(getGameSpecificShinySpriteUrl(386, 'diamond', { name: 'deoxys', form: 'deoxys' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/2/29/Spr_4d_386_s.png'));
    expect(getGameSpecificShinySpriteUrl(386, 'pearl', { name: 'deoxys-attack', form: 'deoxys-attack' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/9/99/Spr_4d_386A_s.png'));
    expect(getGameSpecificShinySpriteUrl(386, 'platinum', { name: 'deoxys-defense', form: 'deoxys-defense' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/5/5c/Spr_4d_386D_s.png'));
    expect(getGameSpecificShinySpriteUrl(386, 'platinum', { name: 'deoxys-speed', form: 'deoxys-speed' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/0/05/Spr_4d_386S_s.png'));
  });

  it.each([
    ['gold', 'Spr_2g_003_s.png'],
    ['silver', 'Spr_2s_003_s.png'],
    ['crystal', 'Spr_2c_003_s.png'],
  ])('uses the same Gen II sprite for every gender selection in %s', (gameId, filename) => {
    const expected = `https://archives.bulbagarden.net/wiki/Special:Redirect/file/${filename}`;

    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'male' })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'female' })).toBe(expected);
  });

  it.each(['ruby', 'sapphire'])('uses a gender-neutral shared Ruby/Sapphire sprite for %s', (gameId) => {
    const expected = 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3r_003_s.png';

    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'male' })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'female' })).toBe(expected);
  });

  it.each([
    ['firered', 'Spr_3f_003_s.png'],
    ['leafgreen', 'Spr_3f_003_s.png'],
    ['emerald', 'Spr_3e_003_s.png'],
  ])('uses a gender-neutral Gen III sprite for %s', (gameId, filename) => {
    const expected = `https://archives.bulbagarden.net/wiki/Special:Redirect/file/${filename}`;

    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'male' })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'female' })).toBe(expected);
  });

  it.each(['ruby', 'sapphire', 'firered', 'leafgreen', 'emerald'])(
    'does not resolve Castform weather transformations in %s',
    (gameId) => {
      expect(getGameSpecificShinySpriteUrl(351, gameId, { name: 'castform-sunny', form: 'castform-sunny' }))
        .toBeNull();
    },
  );
  it.each(['gold', 'silver', 'crystal', 'ruby', 'sapphire', 'firered', 'leafgreen', 'emerald'])(
    'does not substitute a regional form with the base sprite in %s',
    (gameId) => {
      expect(getGameSpecificShinySpriteUrl(20, gameId, { name: 'raticate-alola', form: 'raticate-alola' }))
        .toBeNull();
    },
  );

  it('resolves Crystal Unown forms', () => {
    expect(getGameSpecificShinySpriteUrl(201, 'crystal', { name: 'unown-b', form: 'unown-b' }))
      .toBe('https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2c_201B_s.png');
  });

  it.each([
    ['heartgold', 'Female', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['black2', 'f', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
  ])('resolves gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

  it.each(['x', 'y', 'omegaruby', 'alphasapphire', 'sun', 'moon', 'ultrasun', 'ultramoon'])
    ('uses the shared Gen 6/7 set for %s', (gameId) => {
      expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' }))
        .toBe('/img/game-sprites/gen6-7/bulbasaur.webp');
    });

  it('resolves shared Gen 6/7 aliases and female variants', () => {
    expect(getGameSpecificShinySpriteUrl(550, 'x', { name: 'basculin-red-striped' }))
      .toBe('/img/game-sprites/gen6-7/basculin-red-striped.webp');
    expect(getGameSpecificShinySpriteUrl(550, 'x', { name: 'basculin-blue-striped' }))
      .toBe('/img/game-sprites/gen6-7/basculin-blue-striped.webp');
    expect(getGameSpecificShinySpriteUrl(718, 'sun', { name: 'zygarde-50' }))
      .toBe('/img/game-sprites/gen6-7/zygarde-50.webp');
    expect(getGameSpecificShinySpriteUrl(669, 'moon', { name: 'flabebe' }))
      .toBe('/img/game-sprites/gen6-7/flabebe.webp');
    expect(getGameSpecificShinySpriteUrl(678, 'ultrasun', { name: 'meowstic-male', gender: 'female' }))
      .toBe('/img/game-sprites/gen6-7/meowstic-male-f.webp');
  });

  it('uses Gen 7 additions for Sun/Moon and keeps USUM-only sprites exclusive', () => {
    expect(getGameSpecificShinySpriteUrl(752, 'sun', { name: 'araquanid' }))
      .toBe('/img/game-sprites/gen6-7/araquanid.webp');
    expect(getGameSpecificShinySpriteUrl(806, 'sun', { name: 'blacephalon' }))
      .toBeNull();
    expect(getGameSpecificShinySpriteUrl(806, 'ultrasun', { name: 'blacephalon' }))
      .toBe('/img/game-sprites/gen6-7/blacephalon-usum.webp');
  });

  it.each(['sun', 'moon', 'ultrasun', 'ultramoon'])(
    'resolves Alolan Vulpix by its form ID for %s',
    (gameId) => {
      expect(getGameSpecificShinySpriteUrl(10103, gameId, { name: 'vulpix-alola', form: 'vulpix-alola' }))
        .toBe('/img/game-sprites/gen6-7/vulpix-alola.webp');
    },
  );

  it.each([
    ['https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/5/54/Spr_4d_200_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/6/6d/Spr_4d_399_m_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/game-sprites/hgss/Spr_4h_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2g_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2s_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_2c_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3r_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3f_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_3e_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/1.png', ''],
  ])('uses the right display scale for %s', (url, expected) => {
    expect(getGameSpecificSpriteScaleClass(url)).toBe(expected);
  });

  it.each([
    ['https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png', 0],
    ['/img/game-sprites/hgss/Spr_4h_001_s.png', 0],
    ['/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/1.png', 1],
  ])('uses the right numeric scale for %s', (url, expected) => {
    if (expected === 1) {
      expect(getGameSpecificSpriteScaleFactor(url)).toBe(1);
    } else {
      expect(getGameSpecificSpriteScaleFactor(url)).toBeGreaterThan(0.6);
    }
  });

  it('uses the same fixed reduction for every Gen V sprite canvas', () => {
    const genVSprites = [
      ...BW_SHINY_SPRITE_FILES.map((filename) => `/img/game-sprites/bw/${filename}`),
      ...BW2_SHINY_SPRITE_FILES.map((filename) => `/img/game-sprites/bw2/${filename}`),
    ];

    for (const url of genVSprites) {
      expect(getGameSpecificSpriteScaleFactor(url)).toBe(0.75);
    }
  });

  it.each([
    ['/img/game-sprites/xy/Spr_6x_001_s.webp'],
    ['/img/game-sprites/oras/Spr_6o_001_s.webp'],
    ['/img/game-sprites/sm/Spr_7s_001_s.webp'],
    ['/img/game-sprites/usum/Spr_7u_001_s.webp'],
    ['/img/game-sprites/gen6-7/bulbasaur.webp'],
  ])('reduces newer game sprites by 15%%: %s', (url) => {
    expect(getGameSpecificSpriteScaleFactor(url)).toBe(0.85);
  });

  it('uses smoother rendering for the shared Gen VI/VII sprite set only', () => {
    expect(getGameSpecificSpriteImageRendering('/img/game-sprites/gen6-7/bulbasaur.webp')).toBe('auto');
    expect(getGameSpecificSpriteImageRendering('/img/game-sprites/bw/Spr_5b_001_s.webp')).toBe('pixelated');
  });

  it('keeps Gen V sprites smaller than the shared HGSS sprite footprint', () => {
    const samples = [
      ['hgss/Spr_4h_001_s.png', '/img/game-sprites/hgss/Spr_4h_001_s.png', 88],
      ['dp/Spr_4d_001_s.png', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png', 88],
      ['pt/Spr_4p_429_s.png', 'https://archives.bulbagarden.net/media/upload/3/38/Spr_4p_429_s.png', 88],
      ['bw/Spr_5b_001_s.webp', '/img/game-sprites/bw/Spr_5b_001_s.webp', 66],
      ['bw2/Spr_5b2_495_s.webp', '/img/game-sprites/bw2/Spr_5b2_495_s.webp', 66],
    ] as const;

    for (const [filePath, url, expectedLongSide] of samples) {
      const longSide = GAME_SPRITE_LONG_SIDE_BY_FILE[filePath];
      expect(longSide * getGameSpecificSpriteScaleFactor(url)).toBeLessThanOrEqual(expectedLongSide);
    }
  });

  it('uses the shared normalized scale directly in the rendered style', () => {
    const url = '/img/game-sprites/bw2/Spr_5b2_495_s.webp';

    expect(getGameSpecificSpriteScaleStyle(url)['--sprite-scale'])
      .toBe(String(getGameSpecificSpriteScaleFactor(url)));
  });
});
