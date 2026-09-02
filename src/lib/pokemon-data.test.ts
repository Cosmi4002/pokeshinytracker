import { describe, expect, it } from 'vitest';
import { HUNTING_METHODS, calculateShinyStats, formatOdds, getArchiveShinySpriteUrl, getCaughtShinySpriteUrl, getGameGeneration, getHuntingMethodsForGame, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getSelectedGameSpriteUrl, isBreedingMethod, toLocalPokemonSpriteUrl } from './pokemon-data';

describe('pokemon sprite helpers', () => {
  it('suggests generation-appropriate methods for the selected game', () => {
    expect(getGameGeneration('pearl')).toBe(4);
    expect(getHuntingMethodsForGame('pearl')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'gen4-random', generation: 4 }),
        expect.objectContaining({ id: 'gen4-pokeradar', generation: 4 }),
      ]),
    );
    expect(getHuntingMethodsForGame('pearl')).not.toContainEqual(
      expect.objectContaining({ generation: 5 }),
    );
  });

  it('returns a stable fallback asset for missing sprite images', () => {
    expect(getPokemonSpriteFallbackUrl()).toBe('/placeholder.svg');
  });

  it('builds the expected HOME sprite URL for a base shiny Pokémon', () => {
    expect(getPokemonSpriteUrl(25, { shiny: true })).toBe(
      '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/25.png'
    );
  });

  it('uses Meloetta Pirouette shiny sprite instead of the colliding Meowstic sprite', () => {
    expect(getPokemonSpriteUrl(10025, { shiny: true, name: 'meloetta-pirouette' })).toBe(
      '/img/pokemon-sprites/remote/raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/10018.png'
    );
  });

  it('prefers archive sprites for gender-diff and seasonal forms', () => {
    expect(getArchiveShinySpriteUrl(154, { shiny: true, name: 'meganium', gender: 'female' })).toBe(
      '/img/game-sprites/bw/Spr_5b_154_f_s.webp'
    );
    expect(getArchiveShinySpriteUrl(550, { shiny: true, name: 'basculin-blue-striped', form: 'basculin-blue-striped' })).toBe(
      '/img/game-sprites/bw/Spr_5b_550B_s.webp'
    );
    expect(getArchiveShinySpriteUrl(585, { shiny: true, name: 'deerling-winter', form: 'deerling-winter' })).toBe(
      '/img/game-sprites/bw/Spr_5b_585W_s.webp'
    );
    expect(getArchiveShinySpriteUrl(10020, { shiny: true, name: 'thundurus-therian', form: 'thundurus-therian' })).toBe(
      '/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/2/21/Spr_5b2_642T_s.png'
    );
  });

  it('recomputes caught shiny sprite URLs from pokemon data instead of trusting stale saved urls', () => {
    expect(
      getCaughtShinySpriteUrl({
        pokemonId: 25,
        pokemonName: 'pikachu',
        gender: 'female',
        game: 'heartgold',
        spriteUrl: 'https://legacy.example/pikachu.png',
      })
    ).toBe('/img/game-sprites/hgss/Spr_4h_025_f_s.png');
  });

  it('prefers the selected game when rebuilding the sprite URL for save/edit flows', () => {
    expect(
      getSelectedGameSpriteUrl({
        pokemonId: 445,
        pokemonName: 'garchomp',
        gender: 'male',
        game: 'diamond',
        spriteUrl: 'https://legacy.example/old.png',
      })
    ).toBe('/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/0/0d/Spr_4d_445_m_s.png');

    expect(
      getSelectedGameSpriteUrl({
        pokemonId: 445,
        pokemonName: 'garchomp',
        gender: 'female',
        game: 'platinum',
        secondaryGame: 'diamond',
        spriteUrl: 'https://legacy.example/old.png',
      })
    ).toBe('/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/f/f5/Spr_4p_445_f_s.png');
  });

  it('remaps archive sprite URLs to a local cached path instead of depending on the browser cache', () => {
    expect(
      toLocalPokemonSpriteUrl('https://archives.bulbagarden.net/media/upload/8/87/Spr_4p_445_m_s.png')
    ).toBe('/img/pokemon-sprites/remote/archives.bulbagarden.net/media/upload/8/87/Spr_4p_445_m_s.png');
  });

  it('resolves saved form slugs to the correct sprite variant id', () => {
    expect(
      getPokemonSpriteUrl(550, { shiny: true, name: 'basculin-blue-striped', form: 'basculin-blue-striped' })
    ).toBe(
      getPokemonSpriteUrl(10016, { shiny: true, name: 'basculin-blue-striped', form: 'basculin-blue-striped' })
    );

    expect(
      getPokemonSpriteUrl(585, { shiny: true, name: 'deerling-autumn', form: 'deerling-autumn' })
    ).toBe(
      getPokemonSpriteUrl(10052, { shiny: true, name: 'deerling-autumn', form: 'deerling-autumn' })
    );
  });
});

describe('shiny odds calculations', () => {
  it('uses Gen 6 Friend Safari five-roll odds without Shiny Charm', () => {
    const stats = calculateShinyStats(1, 'gen6-friend-safari', false);

    expect(stats.currentOdds).toBeCloseTo(819.6001, 4);
    expect(stats.percentage).toBe('0.1220');
  });

  it('uses Gen 6 Friend Safari seven-roll odds with Shiny Charm', () => {
    const stats = calculateShinyStats(1, 'gen6-friend-safari', true);

    expect(stats.currentOdds).toBeCloseTo(585.5716, 4);
    expect(stats.percentage).toBe('0.1708');
  });

  it('increases cumulative probability as Friend Safari encounters increase', () => {
    const first = calculateShinyStats(1, 'gen6-friend-safari', false);
    const second = calculateShinyStats(2, 'gen6-friend-safari', false);

    expect(Number(second.binomialProbability)).toBeGreaterThan(Number(first.binomialProbability));
  });

  it('uses exact Gen 6 Poke Radar sparkling patch odds by chain length', () => {
    expect(calculateShinyStats(0, 'gen6-pokeradar', false).currentOdds).toBe(8100);
    expect(calculateShinyStats(1, 'gen6-pokeradar', false).currentOdds).toBe(7900);
    expect(calculateShinyStats(39, 'gen6-pokeradar', false).currentOdds).toBe(300);
    expect(calculateShinyStats(40, 'gen6-pokeradar', false).currentOdds).toBe(100);
    expect(calculateShinyStats(41, 'gen6-pokeradar', false).currentOdds).toBe(100);
  });

  it('does not apply Shiny Charm to Gen 6 Poke Radar sparkling patch odds', () => {
    const withoutCharm = calculateShinyStats(40, 'gen6-pokeradar', false);
    const withCharm = calculateShinyStats(40, 'gen6-pokeradar', true);

    expect(withCharm.currentOdds).toBe(withoutCharm.currentOdds);
    expect(withCharm.percentage).toBe(withoutCharm.percentage);
  });

  it('uses 1/100 for Gen 6 Poke Radar bonus music regardless of chain length', () => {
    expect(calculateShinyStats(0, 'gen6-pokeradar-bonus-music', false).currentOdds).toBe(100);
    expect(calculateShinyStats(20, 'gen6-pokeradar-bonus-music', false).currentOdds).toBe(100);
  });

  it('keeps regular egg hatching separate from Masuda odds', () => {
    expect(calculateShinyStats(1, 'gen3-egg-hatching', false).currentOdds).toBe(8192);
    expect(calculateShinyStats(1, 'gen4-egg-hatching', false).currentOdds).toBe(8192);
    expect(calculateShinyStats(1, 'gen6-egg-hatching', false).currentOdds).toBe(4096);
    expect(calculateShinyStats(1, 'gen8-egg-hatching', true).currentOdds).toBeCloseTo(2048.25, 2);
  });

  it('labels standard breeding, Masuda, and Gen 2 shiny Ditto breeding distinctly', () => {
    expect(HUNTING_METHODS.find((method) => method.id === 'gen6-egg-hatching')?.name).toBe('Breeding');
    expect(HUNTING_METHODS.find((method) => method.id === 'gen6-masuda')?.name).toBe('Masuda Method');
    expect(HUNTING_METHODS.find((method) => method.id === 'gen2-breeding-shiny')?.name).toBe('Breeding (Shiny Ditto / Shiny Gene)');
    expect(isBreedingMethod('gen2-breeding-shiny')).toBe(true);
    expect(isBreedingMethod('gen6-masuda')).toBe(true);
  });

  it('formats displayed odds without decimals', () => {
    expect(formatOdds(683.08)).toBe('683');
    expect(formatOdds(1024.38)).toBe('1,024');
  });

  it('uses generation-specific Masuda odds', () => {
    expect(calculateShinyStats(1, 'gen4-masuda', false).currentOdds).toBeCloseTo(1638.8, 1);
    expect(calculateShinyStats(1, 'gen5-masuda', false).currentOdds).toBeCloseTo(1365.75, 2);
    expect(calculateShinyStats(1, 'gen5-masuda', true).currentOdds).toBeCloseTo(1024.4, 1);
    expect(calculateShinyStats(1, 'gen6-masuda', false).currentOdds).toBeCloseTo(683.1, 1);
    expect(calculateShinyStats(1, 'gen8-masuda', true).currentOdds).toBeCloseTo(512.4, 1);
  });

  it('uses documented Gen 2 Odd Egg odds', () => {
    expect(calculateShinyStats(1, 'gen2-odd-egg', false).currentOdds).toBeCloseTo(7.1429, 4);
    expect(calculateShinyStats(1, 'gen2-odd-egg-jp', false).currentOdds).toBe(2);
  });

  it("uses SOS and Let's Go combo chain tiers", () => {
    expect(calculateShinyStats(31, 'gen7-sos', false).currentOdds).toBeCloseTo(315.54, 2);
    expect(calculateShinyStats(31, 'gen7-sos', true).currentOdds).toBeCloseTo(273.53, 2);
    expect(calculateShinyStats(31, 'gen7-lgpe-combo', false).currentOdds).toBeCloseTo(341.79, 2);
    expect(calculateShinyStats(31, 'gen7-lgpe-combo', true).currentOdds).toBeCloseTo(293.04, 2);
  });

  it('uses the BDSP Poke Radar chain table and ignores Shiny Charm', () => {
    expect(calculateShinyStats(0, 'gen8-bdsp-pokeradar', false).currentOdds).toBe(4096);
    expect(calculateShinyStats(20, 'gen8-bdsp-pokeradar', false).currentOdds).toBe(1820);
    expect(calculateShinyStats(39, 'gen8-bdsp-pokeradar', false).currentOdds).toBe(200);
    expect(calculateShinyStats(40, 'gen8-bdsp-pokeradar', true).currentOdds).toBe(99);
  });

  it('uses corrected Legends Arceus and Sword Shield special-method odds', () => {
    expect(calculateShinyStats(1, 'gen8-max-raid', true).currentOdds).toBe(4096);
    expect(calculateShinyStats(1, 'gen8-bdsp-underground', true).currentOdds).toBe(4096);
    expect(calculateShinyStats(1, 'gen8-bdsp-underground-diglett', true).currentOdds).toBe(2048);
    expect(calculateShinyStats(1, 'pla-mass-outbreak', false).currentOdds).toBeCloseTo(158.02, 2);
    expect(calculateShinyStats(1, 'pla-mass-outbreak', true).currentOdds).toBeCloseTo(141.72, 2);
    expect(calculateShinyStats(1, 'pla-massive', false).currentOdds).toBeCloseTo(315.54, 2);
    expect(calculateShinyStats(1, 'pla-massive', true).currentOdds).toBeCloseTo(241.41, 2);
    expect(calculateShinyStats(500, 'gen8-murder', false).currentOdds).toBeCloseTo(585.57, 2);
    expect(calculateShinyStats(500, 'gen8-murder', true).currentOdds).toBeCloseTo(455.56, 2);
  });

  it('stacks Scarlet and Violet outbreak, sandwich, and charm rolls', () => {
    expect(calculateShinyStats(60, 'gen9-outbreak', false).currentOdds).toBeCloseTo(1365.67, 2);
    expect(calculateShinyStats(60, 'gen9-outbreak', true).currentOdds).toBeCloseTo(819.6, 1);
    expect(calculateShinyStats(1, 'gen9-sandwich-lv3', false).currentOdds).toBeCloseTo(1024.38, 2);
    expect(calculateShinyStats(60, 'gen9-outbreak-sandwich', true).currentOdds).toBeCloseTo(512.44, 2);
  });
});
