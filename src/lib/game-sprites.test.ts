import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl, getGameSpecificSpriteScaleClass, getGameSpecificSpriteScaleFactor } from './game-sprites';

describe('game-specific shiny sprites', () => {
  it.each([
    ['diamond', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_4d_001_s.png'],
    ['platinum', 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_4d_001_s.png'],
    ['heartgold', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['black2', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
  ])('resolves Bulbasaur for %s', (gameId, expected) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' })).toBe(expected);
  });

  it('resolves Giratina Origin in Platinum through the archive redirect URL', () => {
    expect(getGameSpecificShinySpriteUrl(487, 'platinum', { name: 'giratina-origin', form: 'giratina-origin' }))
      .toBe('https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_4p_487O_s.png');
  });

  it.each([
    ['heartgold', 'Female', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['black2', 'f', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
  ])('resolves gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

  it.each([
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_4d_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/game-sprites/hgss/Spr_4h_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/1.png', ''],
  ])('uses the right display scale for %s', (url, expected) => {
    expect(getGameSpecificSpriteScaleClass(url)).toBe(expected);
  });

  it.each([
    ['https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_4d_001_s.png', 0],
    ['/img/game-sprites/hgss/Spr_4h_001_s.png', 0],
    ['/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/1.png', 1],
  ])('uses the right numeric scale for %s', (url, expected) => {
    if (expected === 1) {
      expect(getGameSpecificSpriteScaleFactor(url)).toBe(1);
    } else {
      expect(getGameSpecificSpriteScaleFactor(url)).toBeGreaterThan(0.6);
    }
  });
});
