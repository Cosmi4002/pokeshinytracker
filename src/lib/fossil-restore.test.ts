import { describe, expect, it } from 'vitest';
import { getFossilRestoreIcons } from './fossil-restore';

describe('fossil restore icons', () => {
  it('maps fossil Pokémon and their evolutions to the correct fossil', () => {
    expect(getFossilRestoreIcons(408)).toEqual([
      expect.objectContaining({
        id: 'skull-fossil',
        name: 'Skull Fossil',
        url: '/img/Fossil png/skull.png',
      }),
    ]);
    expect(getFossilRestoreIcons(409)).toEqual([
      expect.objectContaining({ id: 'skull-fossil', name: 'Skull Fossil' }),
    ]);
    expect(getFossilRestoreIcons(142)).toEqual([
      expect.objectContaining({
        id: 'old-amber',
        name: 'Old Amber',
        url: '/img/Fossil png/old-amber.png',
      }),
    ]);
  });

  it('returns both bundled Galar fossil images for the revived hybrid Pokémon', () => {
    expect(getFossilRestoreIcons(883)).toEqual([
      expect.objectContaining({ id: 'fossilized-drake', url: '/img/Fossil png/drake.png' }),
      expect.objectContaining({ id: 'fossilized-fish', url: '/img/Fossil png/fish.png' }),
    ]);
  });
});
