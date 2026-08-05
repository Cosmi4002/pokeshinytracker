import { describe, expect, it } from 'vitest';
import { calculateShinyStats, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from './pokemon-data';

describe('pokemon sprite helpers', () => {
  it('returns a stable fallback asset for missing sprite images', () => {
    expect(getPokemonSpriteFallbackUrl()).toBe('/placeholder.svg');
  });

  it('builds the expected HOME sprite URL for a base shiny Pokémon', () => {
    expect(getPokemonSpriteUrl(25, { shiny: true })).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/25.png'
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
});
