import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl } from './game-sprites';

describe('game-specific shiny sprites', () => {
  it.each([
    ['heartgold', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['soulsilver', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['black', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
    ['white', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
    ['black2', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
    ['white2', '/img/game-sprites/bw/Spr_5b_001_s.webp'],
  ])('resolves Bulbasaur for %s', (gameId, expected) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' })).toBe(expected);
  });

  it('uses a Black 2 / White 2 override when one exists', () => {
    expect(getGameSpecificShinySpriteUrl(495, 'black2', { name: 'snivy' }))
      .toBe('/img/game-sprites/bw2/Spr_5b2_495_s.webp');
  });
  it.each([
    ['heartgold', 'Female', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['soulsilver', 'f', '/img/game-sprites/hgss/Spr_4h_003_f_s.png'],
    ['black', '♀', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
    ['white', 'female', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
    ['black2', 'Female', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
    ['white2', 'f', '/img/game-sprites/bw/Spr_5b_003_f_s.webp'],
  ])('resolves gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

  it.each([
    ['heartgold', 'Male', '/img/game-sprites/hgss/Spr_4h_003_m_s.png'],
    ['black', 'm', '/img/game-sprites/bw/Spr_5b_003_m_s.webp'],
    ['black2', '♂', '/img/game-sprites/bw/Spr_5b_003_m_s.webp'],
  ])('resolves male gender-specific variants for %s', (gameId, gender, expected) => {
    expect(getGameSpecificShinySpriteUrl(3, gameId, { name: 'venusaur', gender })).toBe(expected);
  });

});
