import { describe, expect, it } from 'vitest';
import { getFossilRestoreIcons } from './fossil-restore';

describe('fossil restore icons', () => {
  it('maps fossil Pokémon and their evolutions to the correct fossil', () => {
    expect(getFossilRestoreIcons(408)).toEqual([
      expect.objectContaining({ id: 'skull-fossil', name: 'Skull Fossil' }),
    ]);
    expect(getFossilRestoreIcons(409)).toEqual([
      expect.objectContaining({ id: 'skull-fossil', name: 'Skull Fossil' }),
    ]);
    expect(getFossilRestoreIcons(142)).toEqual([
      expect.objectContaining({ id: 'old-amber', name: 'Old Amber' }),
    ]);
  });

  it('returns both Galar fossils for the revived hybrid Pokémon', () => {
    expect(getFossilRestoreIcons(883).map((fossil) => fossil.id)).toEqual([
      'fossilized-drake',
      'fossilized-fish',
    ]);
  });
});
