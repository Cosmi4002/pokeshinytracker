export type CardFilterId = 'none' | 'holo' | 'cosmic' | 'frost' | 'ember' | 'shadow';

export type CardFilterOption = {
  id: CardFilterId;
  name: string;
  description: string;
};

export const CARD_FILTER_OPTIONS: CardFilterOption[] = [
  { id: 'none', name: 'No filter', description: 'Card pulita, senza overlay.' },
  { id: 'holo', name: 'Holo', description: 'Riflessi cromati e piccoli sparkle.' },
  { id: 'cosmic', name: 'Cosmic', description: 'Bagliore freddo viola/blu con stelle leggere.' },
  { id: 'frost', name: 'Frost', description: 'Velatura chiara e cristallina.' },
  { id: 'ember', name: 'Ember', description: 'Luce calda con particelle morbide.' },
  { id: 'shadow', name: 'Shadow', description: 'Contrasto scuro e vignettatura.' },
];

export const isCardFilterId = (value: unknown): value is CardFilterId =>
  typeof value === 'string' && CARD_FILTER_OPTIONS.some((option) => option.id === value);

export const getCardFilterOption = (id: CardFilterId) =>
  CARD_FILTER_OPTIONS.find((option) => option.id === id) || CARD_FILTER_OPTIONS[0];
