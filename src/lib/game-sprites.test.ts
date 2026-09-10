import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl, getGameSpecificSpriteImageRendering, getGameSpecificSpriteScaleClass, getGameSpecificSpriteScaleFactor, getGameSpecificSpriteScaleStyle } from './game-sprites';
import { toLocalPokemonSpriteUrl } from './pokemon-data';
import { GAME_SPRITE_LONG_SIDE_BY_FILE } from '@/data/game-sprite-long-sides.generated';
import { BW_SHINY_SPRITE_FILES } from '@/data/bw-shiny-sprite-manifest';
import { BW2_SHINY_SPRITE_FILES } from '@/data/bw2-shiny-sprite-manifest';
import { SWORD_SHIELD_SHINY_MODEL_ENTRIES } from '@/data/sword-shield-shiny-model-manifest';
import { getCuratedShinyOriginGameIds } from './pokemon-game-availability';

const expectedSpriteUrl = (url: string) => toLocalPokemonSpriteUrl(url);

describe('game-specific shiny sprites', () => {
  it.each([
    ['diamond', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['platinum', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['gold', '/api/game-sprite?file=Spr_2g_001_s.png'],
    ['silver', '/api/game-sprite?file=Spr_2s_001_s.png'],
    ['crystal', '/api/game-sprite?file=Spr_2c_001_s.png'],
    ['ruby', '/api/game-sprite?file=Spr_3r_001_s.png'],
    ['sapphire', '/api/game-sprite?file=Spr_3r_001_s.png'],
    ['firered', '/api/game-sprite?file=Spr_3f_001_s.png'],
    ['leafgreen', '/api/game-sprite?file=Spr_3f_001_s.png'],
    ['emerald', '/api/game-sprite?file=Spr_3e_001_s.png'],
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
    const expected = `/api/game-sprite?file=${filename}`;

    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'male' })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'female' })).toBe(expected);
  });

  it('keeps Gold and Silver artwork distinct', () => {
    const goldSprite = getGameSpecificShinySpriteUrl(3, 'gold', { name: 'venusaur' });
    const silverSprite = getGameSpecificShinySpriteUrl(3, 'silver', { name: 'venusaur' });

    expect(goldSprite).toBe('/api/game-sprite?file=Spr_2g_003_s.png');
    expect(silverSprite).toBe('/api/game-sprite?file=Spr_2s_003_s.png');
    expect(goldSprite).not.toBe(silverSprite);
  });

  it.each(['ruby', 'sapphire'])('uses a gender-neutral shared Ruby/Sapphire sprite for %s', (gameId) => {
    const expected = '/api/game-sprite?file=Spr_3r_003_s.png';

    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'male' })).toBe(expected);
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender: 'female' })).toBe(expected);
  });

  it.each([
    ['firered', 'Spr_3f_003_s.png'],
    ['leafgreen', 'Spr_3f_003_s.png'],
    ['emerald', 'Spr_3e_003_s.png'],
  ])('uses a gender-neutral Gen III sprite for %s', (gameId, filename) => {
    const expected = `/api/game-sprite?file=${filename}`;

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
  it('resolves Crystal Unown forms', () => {
    expect(getGameSpecificShinySpriteUrl(201, 'crystal', { name: 'unown-b', form: 'unown-b' }))
      .toBe('/api/game-sprite?file=Spr_2c_201B_s.png');
  });

  it.each([
    ['heartgold', 'Female', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['black2', 'f', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
  ])('resolves gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

  it.each(['x', 'y', 'omegaruby', 'alphasapphire', 'sun', 'moon', 'ultrasun', 'ultramoon'])('uses the shared Gen 6/7 set for %s', (gameId) => {
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

  it.each(['x', 'y', 'omegaruby', 'alphasapphire', 'sun', 'moon', 'ultrasun', 'ultramoon'])(
    'resolves Furfrou alternate trims for %s',
    (gameId) => {
      expect(getGameSpecificShinySpriteUrl(10083, gameId, { name: 'furfrou-la-reine', form: 'furfrou-la-reine' }))
        .toMatch(/furfrou-lareine.*\.gif$/);
      expect(getGameSpecificShinySpriteUrl(10085, gameId, { name: 'furfrou-pharaoh', form: 'furfrou-pharaoh' }))
        .toMatch(/furfrou-pharaoh.*\.gif$/);
    },
  );

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

  it.each(['sword', 'shield'])('proxies base Sword/Shield models through the app origin for %s', (gameId) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' }))
      .toBe('/api/game-sprite?file=Spr_8s_001_s.png');
    expect(getGameSpecificShinySpriteUrl(810, gameId, { name: 'grookey' }))
      .toBe('/api/game-sprite?file=Spr_8s_810_s.png');
    expect(getGameSpecificShinySpriteUrl(6, gameId, { name: 'charizard' }))
      .toBe('/api/game-sprite?file=Spr_8s_006_s.png');
  });

  it.each([
    ['raichu-alola', 26, 'Spr_8s_026A_s.png'],
    ['sandshrew-alola', 27, 'Spr_8s_027A_s.png'],
    ['sandslash-alola', 28, 'Spr_8s_028A_s.png'],
    ['vulpix-alola', 37, 'Spr_8s_037A_s.png'],
    ['ninetales-alola', 38, 'Spr_8s_038A_s.png'],
    ['diglett-alola', 50, 'Spr_8s_050A_s.png'],
    ['dugtrio-alola', 51, 'Spr_8s_051A_s.png'],
    ['meowth-alola', 52, 'Spr_8s_052A_s.png'],
    ['persian-alola', 53, 'Spr_8s_053A_s.png'],
    ['exeggutor-alola', 103, 'Spr_8s_103A_s.png'],
    ['marowak-alola', 105, 'Spr_8s_105A_s.png'],
    ['meowth-galar', 52, 'Spr_8s_052G_s.png'],
    ['ponyta-galar', 77, 'Spr_8s_077G_s.png'],
    ['rapidash-galar', 78, 'Spr_8s_078G_s.png'],
    ['slowpoke-galar', 79, 'Spr_8s_079G_s.png'],
    ['slowbro-galar', 80, 'Spr_8s_080G_s.png'],
    ['farfetchd-galar', 83, 'Spr_8s_083G_s.png'],
    ['weezing-galar', 110, 'Spr_8s_110G_s.png'],
    ['mr-mime-galar', 122, 'Spr_8s_122G_s.png'],
    ['articuno-galar', 144, 'Spr_8s_144G_s.png'],
    ['zapdos-galar', 145, 'Spr_8s_145G_s.png'],
    ['moltres-galar', 146, 'Spr_8s_146G_s.png'],
    ['slowking-galar', 199, 'Spr_8s_199G_s.png'],
    ['corsola-galar', 222, 'Spr_8s_222G_s.png'],
    ['zigzagoon-galar', 263, 'Spr_8s_263G_s.png'],
    ['linoone-galar', 264, 'Spr_8s_264G_s.png'],
    ['darumaka-galar', 554, 'Spr_8s_554G_s.png'],
    ['darmanitan-galar', 555, 'Spr_8s_555G_s.png'],
    ['yamask-galar', 562, 'Spr_8s_562G_s.png'],
    ['stunfisk-galar', 618, 'Spr_8s_618G_s.png'],
  ])('records the verified redirect filename for %s', (canonicalName, speciesId, filename) => {
    expect(SWORD_SHIELD_SHINY_MODEL_ENTRIES.find((entry) => (
      entry.speciesId === speciesId && entry.canonicalName === canonicalName
    ))?.filename).toBe(filename);
  });

  it.each([
    [3, 'Spr_8s_003_m_s.png'],
    [12, 'Spr_8s_012_m_s.png'],
    [25, 'Spr_8s_025_m_s.png'],
    [26, 'Spr_8s_026_m_s.png'],
    [41, 'Spr_8s_041_m_s.png'],
    [42, 'Spr_8s_042_m_s.png'],
    [44, 'Spr_8s_044_m_s.png'],
    [45, 'Spr_8s_045_m_s.png'],
    [64, 'Spr_8s_064_m_s.png'],
    [65, 'Spr_8s_065_m_s.png'],
    [111, 'Spr_8s_111_m_s.png'],
    [112, 'Spr_8s_112_m_s.png'],
    [118, 'Spr_8s_118_m_s.png'],
    [119, 'Spr_8s_119_m_s.png'],
    [123, 'Spr_8s_123_m_s.png'],
    [129, 'Spr_8s_129_m_s.png'],
    [130, 'Spr_8s_130_m_s.png'],
    [133, 'Spr_8s_133_m_s.png'],
    [185, 'Spr_8s_185_m_s.png'],
    [186, 'Spr_8s_186_m_s.png'],
    [194, 'Spr_8s_194_m_s.png'],
    [195, 'Spr_8s_195_m_s.png'],
    [202, 'Spr_8s_202_m_s.png'],
    [208, 'Spr_8s_208_m_s.png'],
    [212, 'Spr_8s_212_m_s.png'],
    [214, 'Spr_8s_214_m_s.png'],
    [215, 'Spr_8s_215_m_s.png'],
    [221, 'Spr_8s_221_m_s.png'],
    [224, 'Spr_8s_224_m_s.png'],
    [272, 'Spr_8s_272_m_s.png'],
    [274, 'Spr_8s_274_m_s.png'],
    [275, 'Spr_8s_275_m_s.png'],
    [307, 'Spr_8s_307_m_s.png'],
    [308, 'Spr_8s_308_m_s.png'],
    [315, 'Spr_8s_315_m_s.png'],
    [316, 'Spr_8s_316_m_s.png'],
    [317, 'Spr_8s_317_m_s.png'],
    [322, 'Spr_8s_322_m_s.png'],
    [323, 'Spr_8s_323_m_s.png'],
    [332, 'Spr_8s_332_m_s.png'],
    [350, 'Spr_8s_350_m_s.png'],
    [369, 'Spr_8s_369_m_s.png'],
    [403, 'Spr_8s_403_m_s.png'],
    [404, 'Spr_8s_404_m_s.png'],
    [405, 'Spr_8s_405_m_s.png'],
    [407, 'Spr_8s_407_m_s.png'],
    [415, 'Spr_8s_415_m_s.png'],
    [417, 'Spr_8s_417_m_s.png'],
    [418, 'Spr_8s_418_m_s.png'],
    [419, 'Spr_8s_419_m_s.png'],
    [443, 'Spr_8s_443_m_s.png'],
    [444, 'Spr_8s_444_m_s.png'],
    [445, 'Spr_8s_445_m_s.png'],
    [449, 'Spr_8s_449_m_s.png'],
    [450, 'Spr_8s_450_m_s.png'],
    [453, 'Spr_8s_453_m_s.png'],
    [454, 'Spr_8s_454_m_s.png'],
    [456, 'Spr_8s_456_m_s.png'],
    [457, 'Spr_8s_457_m_s.png'],
    [459, 'Spr_8s_459_m_s.png'],
    [460, 'Spr_8s_460_m_s.png'],
    [461, 'Spr_8s_461_m_s.png'],
    [464, 'Spr_8s_464_m_s.png'],
    [465, 'Spr_8s_465_m_s.png'],
    [473, 'Spr_8s_473_m_s.png'],
    [521, 'Spr_8s_521_m_s.png'],
    [592, 'Spr_8s_592_m_s.png'],
    [593, 'Spr_8s_593_m_s.png'],
    [668, 'Spr_8s_668_m_s.png'],
    [678, 'Spr_8s_678_m_s.png'],
    [876, 'Spr_8s_876_m_s.png'],
  ])('records the verified male redirect filename for species %s', (speciesId, filename) => {
    expect(SWORD_SHIELD_SHINY_MODEL_ENTRIES.find((entry) => (
      entry.speciesId === speciesId && entry.gender === 'male'
    ))?.filename).toBe(filename);
  });

  it.each([
    3,
    12,
    25,
    26,
    44,
    45,
    64,
    65,
    111,
    112,
    118,
    119,
    123,
    129,
    130,
    133,
    185,
    186,
    202,
    208,
    212,
    214,
    215,
    217,
    221,
    224,
    229,
    232,
    255,
    256,
    257,
    267,
    269,
    272,
    274,
    275,
    307,
    308,
    315,
    316,
    317,
    322,
    323,
    332,
    350,
    369,
    403,
    404,
    405,
    407,
    415,
    417,
    418,
    419,
    424,
    443,
    444,
    445,
    449,
    450,
    453,
    454,
    456,
    457,
    459,
    460,
    461,
    464,
    465,
    473,
    521,
    592,
    593,
    678,
    876,
  ])('records the verified female redirect filename for species %s', (speciesId) => {
    expect(SWORD_SHIELD_SHINY_MODEL_ENTRIES.find((entry) => (
      entry.speciesId === speciesId && entry.gender === 'female'
    ))?.filename).toBe(`Spr_8s_${String(speciesId).padStart(3, '0')}_f_s.png`);
  });

  it('maps Sword/Shield male and female models without base-form fallback', () => {
    expect(getGameSpecificShinySpriteUrl(445, 'shield', { name: 'garchomp' }))
      .toBe('/api/game-sprite?file=Spr_8s_445_m_s.png');
    expect(getGameSpecificShinySpriteUrl(445, 'shield', { name: 'garchomp', gender: 'male' }))
      .toBe('/api/game-sprite?file=Spr_8s_445_m_s.png');
    expect(getGameSpecificShinySpriteUrl(445, 'shield', { name: 'garchomp', gender: 'female' }))
      .toBe('/api/game-sprite?file=Spr_8s_445_f_s.png');
  });

  it.each([
    [854, 'sinistea-antique', 'Spr_8s_854_s.png'],
    [855, 'polteageist-antique', 'Spr_8s_855_s.png'],
  ])('uses the Phony Sword/Shield model for %s', (pokemonId, canonicalName, filename) => {
    expect(getGameSpecificShinySpriteUrl(pokemonId, 'sword', { name: canonicalName, form: canonicalName }))
      .toBe(`/api/game-sprite?file=${filename}`);
  });

  it.each([
    ['rotom-heat', 'Spr_8s_479O_s.png'], ['giratina-origin', 'Spr_8s_487O_s.png'],
    ['shellos-east', 'Spr_8s_422E_s.png'], ['basculin-blue-striped', 'Spr_8s_550B_s.png'],
    ['tornadus-therian', 'Spr_8s_641T_s.png'], ['kyurem-black', 'Spr_8s_646B_s.png'],
    ['pumpkaboo-small', 'Spr_8s_710Sm_s.png'], ['gourgeist-super', 'Spr_8s_711Su_s.png'],
    ['zygarde-10', 'Spr_8s_718T_s.png'], ['lycanroc-midnight', 'Spr_8s_745Mn_s.png'],
    ['silvally-fire', 'Spr_8s_773Fire_s.png'], ['necrozma-dawn', 'Spr_8s_800DW_s.png'],
    ['toxtricity-low-key', 'Spr_8s_849L_s.png'], ['alcremie-vanilla-cream-berry-sweet', 'Spr_8s_869B_s.png'],
    ['urshifu-rapid-strike', 'Spr_8s_892R_s.png'], ['zacian-crowned', 'Spr_8s_888C_s.png'],
    ['zarude-dada', 'Spr_8s_893D_s.png'], ['calyrex-shadow', 'Spr_8s_898S_s.png'],
  ])('records the verified Sword/Shield form sprite for %s', (canonicalName, filename) => {
    expect(SWORD_SHIELD_SHINY_MODEL_ENTRIES.find((entry) => entry.canonicalName === canonicalName)?.filename)
      .toBe(filename);
  });

  it('does not resolve Sword/Shield models for Pokémon absent from their Obtained in list', () => {
    expect(getGameSpecificShinySpriteUrl(15, 'sword', { name: 'beedrill' })).toBeNull();
    expect(getGameSpecificShinySpriteUrl(19, 'shield', { name: 'rattata', gender: 'female' })).toBeNull();
  });

  it('applies the Obtained in availability list to every Sword/Shield archive model', () => {
    for (const entry of SWORD_SHIELD_SHINY_MODEL_ENTRIES) {
      const availableGames = getCuratedShinyOriginGameIds(entry.speciesId, entry.canonicalName) || [];

      for (const gameId of ['sword', 'shield'] as const) {
        const actual = getGameSpecificShinySpriteUrl(entry.speciesId, gameId, {
          name: entry.canonicalName,
          form: entry.canonicalName,
          gender: entry.gender || undefined,
        });
        const expected = availableGames.includes(gameId)
          ? `/api/game-sprite?file=${entry.filename}`
          : null;

        expect(actual, `${entry.canonicalName} in ${gameId}`).toBe(expected);
      }
    }
  });

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
    ['/api/game-sprite?file=Spr_8s_001_s.png'],
  ])('reduces Gen VI/VII game sprites by 15%%: %s', (url) => {
    expect(getGameSpecificSpriteScaleFactor(url)).toBe(0.85);
  });

  it('uses smoother rendering for the shared Gen VI/VII sprite set only', () => {
    expect(getGameSpecificSpriteImageRendering('/img/game-sprites/gen6-7/bulbasaur.webp')).toBe('auto');
    expect(getGameSpecificSpriteImageRendering('/api/game-sprite?file=Spr_8s_001_s.png')).toBe('auto');
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
