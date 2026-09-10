import { describe, expect, it } from 'vitest';
import { clampSpriteScale, isSpriteScaleManager, isSwordShieldSpriteUrl } from './sprite-scale-context';

describe('sprite scale editor helpers', () => {
  it('keeps manually entered scales inside the supported range', () => {
    expect(clampSpriteScale(0.1)).toBe(0.25);
    expect(clampSpriteScale(1.75)).toBe(1.75);
    expect(clampSpriteScale(3)).toBe(2.5);
  });

  it('recognizes the manager email without case sensitivity', () => {
    expect(isSpriteScaleManager('CHRIteL04@gmail.com')).toBe(true);
    expect(isSpriteScaleManager('other@example.com')).toBe(false);
  });

  it('recognizes only proxied Sword/Shield sprite URLs', () => {
    expect(isSwordShieldSpriteUrl('/api/game-sprite?file=Spr_8s_025_s.png')).toBe(true);
    expect(isSwordShieldSpriteUrl('/api/game-sprite?file=Spr_7u_025_s.png')).toBe(false);
    expect(isSwordShieldSpriteUrl('/img/game-sprites/hgss/Spr_4h_025_s.png')).toBe(false);
  });
});
