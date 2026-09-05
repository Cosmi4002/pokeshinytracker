import { describe, expect, it } from 'vitest';
import { clampSpriteScale, isSpriteScaleManager } from './sprite-scale-context';

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
});
