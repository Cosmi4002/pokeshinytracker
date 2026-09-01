import { describe, expect, it } from 'vitest';
import { getCuratedShinyOriginGameIds } from './pokemon-game-availability';

describe('pokemon game availability', () => {
  it('keeps Rotom appliance forms out of Diamond and Pearl', () => {
    expect(getCuratedShinyOriginGameIds(479, 'rotom-heat')).not.toContain('diamond');
    expect(getCuratedShinyOriginGameIds(479, 'rotom-heat')).not.toContain('pearl');
    expect(getCuratedShinyOriginGameIds(479, 'rotom-wash')).not.toContain('diamond');
    expect(getCuratedShinyOriginGameIds(479, 'rotom-mow')).not.toContain('pearl');
  });

  it('still allows base Rotom in Diamond and Pearl', () => {
    expect(getCuratedShinyOriginGameIds(479, 'rotom')).toContain('diamond');
    expect(getCuratedShinyOriginGameIds(479, 'rotom')).toContain('pearl');
  });

  it('keeps Giratina Origin out of Diamond and Pearl', () => {
    expect(getCuratedShinyOriginGameIds(487, 'giratina-origin')).not.toContain('diamond');
    expect(getCuratedShinyOriginGameIds(487, 'giratina-origin')).not.toContain('pearl');
  });
});
