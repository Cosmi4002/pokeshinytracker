import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ShinyCard } from './src/components/collection/ShinyCard';

describe('ShinyCard runtime', () => {
  it('renders without crashing for a standard entry', () => {
    const entry = {
      id: 1,
      pokemon_id: 445,
      pokemon_name: 'Garchomp',
      game: 'diamond',
      secondary_game: null,
      gender: 'male',
      form: null,
      method: 'gen4-random',
      is_fail: false,
      is_evolved: false,
      is_gigamax: false,
      is_legends_arceus: false,
      is_unobtainable: false,
      attempts: 1,
      has_shiny_charm: false,
      pokeball: 'pokeball',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_legendary: false,
      is_mythical: false,
      caught_date: null,
      notes: null,
      comment: null,
      sprite_url: '',
      location: null,
      image_url: null,
      species: 'garchomp',
      nickname: null,
      shiny_value: null,
      hunt_id: null,
      user_id: null,
      caught_count: 1,
    } as any;

    expect(() => render(
      <ShinyCard
        entry={entry}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleEvolved={() => {}}
      />
    )).not.toThrow();
  });
});
