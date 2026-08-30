import { describe, expect, it } from 'vitest';
import { getGameSpecificShinySpriteUrl } from './game-sprites';

describe('game-specific shiny sprites', () => {
  it.each([
    ['heartgold', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['soulsilver', '/img/game-sprites/hgss/Spr_4h_001_s.png'],
    ['black', '/img/game-sprites/bw/Spr_5b_001_s.png'],
    ['white', '/img/game-sprites/bw/Spr_5b_001_s.png'],
    ['black2', '/img/game-sprites/bw2/Spr_5b_001_s.png'],
    ['white2', '/img/game-sprites/bw2/Spr_5b_001_s.png'],
  ])('resolves Bulbasaur for %s', (gameId, expected) => {
    expect(getGameSpecificShinySpriteUrl(1, gameId, { name: 'bulbasaur' })).toBe(expected);
  });

  it('uses a Black 2 / White 2 override when one exists', () => {
    expect(getGameSpecificShinySpriteUrl(17, 'black2', { name: 'pidgeotto' }))
      .toBe('/img/game-sprites/bw2/Spr_5b2_017_s.png');
  });
});
