import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl, getGameSpecificSpriteScaleClass, getGameSpecificSpriteScaleFactor } from './game-sprites';
import { toLocalPokemonSpriteUrl } from './pokemon-data';

const expectedSpriteUrl = (url: string) => toLocalPokemonSpriteUrl(url);

describe('game-specific shiny sprites', () => {
  it.each([
    ['diamond', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['platinum', 'https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png'],
    ['heartgold', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['black2', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
  ])('resolves Bulbasaur for %s', (gameId, expected) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' })).toBe(expectedSpriteUrl(expected));
  });

  it('resolves Giratina Origin in Platinum through the archive media URL', () => {
    expect(getGameSpecificShinySpriteUrl(487, 'platinum', { name: 'giratina-origin', form: 'giratina-origin' }))
      .toBe(expectedSpriteUrl('https://archives.bulbagarden.net/media/upload/2/2f/Spr_4p_487O_s.png'));
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
    ['heartgold', 'Female', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['black2', 'f', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
  ])('resolves gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

  it.each([
    ['https://archives.bulbagarden.net/media/upload/7/7c/Spr_4d_001_s.png', 'scale-[var(--sprite-scale)]'],
    ['/img/game-sprites/hgss/Spr_4h_001_s.png', 'scale-[var(--sprite-scale)]'],
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
});
