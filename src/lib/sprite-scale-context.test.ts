import { describe, expect, it } from 'vitest';
import { clampSpriteScale, getSwordShieldSpriteScaleOverrides, isSpriteScaleManager } from './sprite-scale-context';

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

  it('creates 190% admin overrides for Sword/Shield models except Pumpkaboo and Gourgeist forms', () => {
    const overrides = getSwordShieldSpriteScaleOverrides();

    expect(overrides.length).toBeGreaterThan(1_000);
    expect(overrides.every((override) => override.scale === 1.9)).toBe(true);
    expect(overrides.some((override) => /Spr_8s_710|Spr_8s_711/.test(override.sprite_url))).toBe(false);
  });
});
