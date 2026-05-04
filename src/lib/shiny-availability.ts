export type ShinyAvailability = 'ok' | 'unobtainable' | 'not_own_ot';

type Rule =
  | { kind: 'baseId'; baseId: number; availability: ShinyAvailability }
  | { kind: 'name'; name: string; availability: ShinyAvailability };

const RULES: Rule[] = [
  // Non ottenibili shiny al momento
  { kind: 'baseId', baseId: 494, availability: 'unobtainable' }, // Victini
  { kind: 'baseId', baseId: 720, availability: 'unobtainable' }, // Hoopa
  { kind: 'baseId', baseId: 789, availability: 'unobtainable' }, // Cosmog
  { kind: 'baseId', baseId: 790, availability: 'unobtainable' }, // Cosmoem
  { kind: 'baseId', baseId: 801, availability: 'unobtainable' }, // Magearna
  { kind: 'baseId', baseId: 802, availability: 'unobtainable' }, // Marshadow
  { kind: 'baseId', baseId: 891, availability: 'unobtainable' }, // Kubfu
  { kind: 'baseId', baseId: 892, availability: 'unobtainable' }, // Urshifu
  { kind: 'baseId', baseId: 893, availability: 'unobtainable' }, // Zarude
  { kind: 'baseId', baseId: 896, availability: 'unobtainable' }, // Glastrier
  { kind: 'baseId', baseId: 897, availability: 'unobtainable' }, // Spectrier
  { kind: 'baseId', baseId: 898, availability: 'unobtainable' }, // Calyrex
  { kind: 'baseId', baseId: 1014, availability: 'unobtainable' }, // Okidogi
  { kind: 'baseId', baseId: 1015, availability: 'unobtainable' }, // Munkidori
  { kind: 'baseId', baseId: 1016, availability: 'unobtainable' }, // Fezandipiti
  { kind: 'baseId', baseId: 1017, availability: 'unobtainable' }, // Ogerpon
  { kind: 'baseId', baseId: 1024, availability: 'unobtainable' }, // Terapagos
  { kind: 'baseId', baseId: 1025, availability: 'unobtainable' }, // Pecharunt
  { kind: 'baseId', baseId: 1009, availability: 'unobtainable' }, // Walking Wake
  { kind: 'baseId', baseId: 1010, availability: 'unobtainable' }, // Iron Leaves

  // Non Own OT (marcati con OT nella lista)
  { kind: 'baseId', baseId: 647, availability: 'not_own_ot' }, // Keldeo
  { kind: 'baseId', baseId: 648, availability: 'not_own_ot' }, // Meloetta
  { kind: 'baseId', baseId: 721, availability: 'not_own_ot' }, // Volcanion
  { kind: 'baseId', baseId: 1007, availability: 'not_own_ot' }, // Koraidon
  { kind: 'baseId', baseId: 1008, availability: 'not_own_ot' }, // Miraidon
  { kind: 'baseId', baseId: 1001, availability: 'not_own_ot' }, // Wo-Chien
  { kind: 'baseId', baseId: 1002, availability: 'not_own_ot' }, // Chien-Pao
  { kind: 'baseId', baseId: 1003, availability: 'not_own_ot' }, // Ting-Lu
  { kind: 'baseId', baseId: 1004, availability: 'not_own_ot' }, // Chi-Yu
  { kind: 'baseId', baseId: 888, availability: 'not_own_ot' }, // Zacian
  { kind: 'baseId', baseId: 889, availability: 'not_own_ot' }, // Zamazenta
  { kind: 'baseId', baseId: 890, availability: 'not_own_ot' }, // Eternatus
  { kind: 'baseId', baseId: 807, availability: 'not_own_ot' }, // Zeraora
  { kind: 'baseId', baseId: 649, availability: 'not_own_ot' }, // Genesect
  { kind: 'baseId', baseId: 808, availability: 'not_own_ot' }, // Meltan
  { kind: 'baseId', baseId: 809, availability: 'not_own_ot' }, // Melmetal
  { kind: 'name', name: 'articuno-galar', availability: 'not_own_ot' },
  { kind: 'name', name: 'zapdos-galar', availability: 'not_own_ot' },
  { kind: 'name', name: 'moltres-galar', availability: 'not_own_ot' },
  { kind: 'baseId', baseId: 719, availability: 'not_own_ot' }, // Diancie
  { kind: 'baseId', baseId: 385, availability: 'not_own_ot' }, // Jirachi
];

export function getShinyAvailability(params: { baseId: number; name: string }): ShinyAvailability {
  for (const rule of RULES) {
    if (rule.kind === 'baseId' && rule.baseId === params.baseId) return rule.availability;
    if (rule.kind === 'name' && rule.name === params.name) return rule.availability;
  }
  return 'ok';
}

