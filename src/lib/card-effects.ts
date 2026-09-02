export type CardFilterId = 'none' | 'holo' | 'cosmic' | 'pixel' | 'neon' | 'prism' | 'ember' | 'shadow';

export type CardFilterOption = {
  id: CardFilterId;
  name: string;
  description: string;
};

export const CARD_FILTER_OPTIONS: CardFilterOption[] = [
  { id: 'none', name: 'No filter', description: 'Card pulita, senza overlay.' },
  { id: 'holo', name: 'Holo', description: 'Riflessi cromati senza stelline.' },
  { id: 'cosmic', name: 'Diamond', description: 'Cut light highlights with a jewel-like effect.' },
  { id: 'pixel', name: 'Pixel Pop', description: 'Pochi micro pixel luminosi, molto discreti.' },
  { id: 'neon', name: 'Neon Edge', description: 'Accenti neon sui bordi, senza griglia sul contenuto.' },
  { id: 'prism', name: 'Prism', description: 'Crystal-style blades of colored light.' },
  { id: 'ember', name: 'Ember', description: 'Fiamma calda piu intensa e visibile.' },
  { id: 'shadow', name: 'Shadow', description: 'Contrasto scuro e vignettatura.' },
];

export const POKEDEX_CARD_FILTER_OPTIONS: CardFilterOption[] = CARD_FILTER_OPTIONS.filter(
  (option) => option.id !== 'pixel' && option.id !== 'neon'
);

export const COLLECTION_CARD_FILTER_OPTIONS: CardFilterOption[] = CARD_FILTER_OPTIONS.filter(
  (option) => option.id !== 'holo' && option.id !== 'cosmic' && option.id !== 'pixel' && option.id !== 'neon'
);

export const isCardFilterId = (value: unknown): value is CardFilterId =>
  typeof value === 'string' && CARD_FILTER_OPTIONS.some((option) => option.id === value);

export const getCardFilterOption = (id: CardFilterId) =>
  CARD_FILTER_OPTIONS.find((option) => option.id === id) || CARD_FILTER_OPTIONS[0];
