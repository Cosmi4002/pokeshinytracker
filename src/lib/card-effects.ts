export type CardFilterId = 'none' | 'holo' | 'cosmic' | 'pixel' | 'comic' | 'neon' | 'prism' | 'ember' | 'shadow';

export type CardFilterOption = {
  id: CardFilterId;
  name: string;
  description: string;
};

export const CARD_FILTER_OPTIONS: CardFilterOption[] = [
  { id: 'none', name: 'No filter', description: 'Card pulita, senza overlay.' },
  { id: 'holo', name: 'Holo', description: 'Riflessi cromati senza stelline.' },
  { id: 'cosmic', name: 'Cosmic', description: 'Nebulosa viola/blu con campo stellato.' },
  { id: 'pixel', name: 'Pixel Pop', description: 'Micro pixel luminosi, stile retro arcade.' },
  { id: 'comic', name: 'Comic Ink', description: 'Bordo inchiostrato e texture da fumetto leggera.' },
  { id: 'neon', name: 'Neon Grid', description: 'Griglia neon sottile, futuristica ma discreta.' },
  { id: 'prism', name: 'Prism', description: 'Lame di luce colorata stile cristallo.' },
  { id: 'ember', name: 'Ember', description: 'Fiamma calda piu intensa e visibile.' },
  { id: 'shadow', name: 'Shadow', description: 'Contrasto scuro e vignettatura.' },
];

export const isCardFilterId = (value: unknown): value is CardFilterId =>
  typeof value === 'string' && CARD_FILTER_OPTIONS.some((option) => option.id === value);

export const getCardFilterOption = (id: CardFilterId) =>
  CARD_FILTER_OPTIONS.find((option) => option.id === id) || CARD_FILTER_OPTIONS[0];
