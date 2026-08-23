import type { CompletionPolicy, PokemonFormKind, VerificationStatus } from './pokemon-catalog-v2';

export type SpeciesCardMode = 'single-card' | 'per-form-card';

export interface PokemonSpeciesFormPolicy {
  speciesId: number;
  cardMode: SpeciesCardMode;
  completionPolicy: CompletionPolicy;
  defaultKind: PokemonFormKind;
  expectedTrackedForms?: number;
  verificationStatus: VerificationStatus;
  rationale: string;
}

/**
 * Tracker product decisions for difficult multi-form species.
 *
 * These are intentionally separate from encounter/mechanics facts. A species
 * can use one card while still tracking each form independently in its details.
 * `partial` means the policy is deliberate but its complete form inventory is
 * still awaiting the source-backed canonical catalogue review.
 */
export const POKEMON_SPECIES_FORM_POLICIES: PokemonSpeciesFormPolicy[] = [
  { speciesId: 201, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 28, verificationStatus: 'verified', rationale: 'Track every Unown glyph inside one species card.' },
  { speciesId: 386, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Deoxys formes are persistent and intentionally visible as distinct Pokédex targets.' },
  { speciesId: 412, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'temporary', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Track each Burmy cloak independently even though Burmy can change cloak.' },
  { speciesId: 413, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Track each Wormadam cloak independently.' },
  { speciesId: 422, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track West Sea and East Sea separately.' },
  { speciesId: 423, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track West Sea and East Sea separately.' },
  { speciesId: 479, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 6, verificationStatus: 'verified', rationale: 'Keep Rotom appliances as distinct visible targets.' },
  { speciesId: 483, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Keep Altered and Origin Dialga as separate cards.' },
  { speciesId: 484, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Keep Altered and Origin Palkia as separate cards.' },
  { speciesId: 487, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Keep Altered and Origin as separate cards.' },
  { speciesId: 492, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Keep Land Forme and Sky Forme as distinct visible targets.' },
  { speciesId: 493, cardMode: 'single-card', completionPolicy: 'single', defaultKind: 'temporary', expectedTrackedForms: 1, verificationStatus: 'verified', rationale: 'Arceus types are plate-dependent states of one individual, not separate shiny catches.' },
  { speciesId: 550, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Track all three Basculin stripes separately; White-Striped also has a distinct evolution path.' },
  { speciesId: 555, cardMode: 'per-form-card', completionPolicy: 'single', defaultKind: 'base', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Unovan and Galarian Darmanitan separately; Zen Modes are battle-only information, not additional catches.' },
  { speciesId: 585, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track all seasonal appearances independently.' },
  { speciesId: 586, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track all seasonal appearances independently.' },
  { speciesId: 641, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Tornadus Incarnate and Therian Formes separately.' },
  { speciesId: 642, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Thundurus Incarnate and Therian Formes separately.' },
  { speciesId: 645, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Landorus Incarnate and Therian Formes separately.' },
  { speciesId: 646, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'fusion', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Kyurem, Black Kyurem and White Kyurem share one card while remaining selectable in details.' },
  { speciesId: 647, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Keldeo Ordinary and Resolute share one card while remaining selectable in details.' },
  { speciesId: 648, cardMode: 'single-card', completionPolicy: 'single', defaultKind: 'base', expectedTrackedForms: 1, verificationStatus: 'verified', rationale: 'Pirouette Forme is a battle transformation of the same Meloetta and is informational, not a second shiny catch.' },
  { speciesId: 649, cardMode: 'single-card', completionPolicy: 'single', defaultKind: 'base', expectedTrackedForms: 1, verificationStatus: 'verified', rationale: 'Genesect Drives alter the same individual and are informational, not separate shiny catches.' },
  { speciesId: 666, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 19, verificationStatus: 'verified', rationale: 'Track the 19 potentially Shiny patterns inside one species card; Poké Ball Pattern remains informational because its distributions were non-Shiny.' },
  { speciesId: 669, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 5, verificationStatus: 'verified', rationale: 'Track flower colours inside one species card.' },
  { speciesId: 670, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 5, verificationStatus: 'verified', rationale: 'Track flower colours inside one species card.' },
  { speciesId: 671, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 5, verificationStatus: 'verified', rationale: 'Track flower colours inside one species card.' },
  { speciesId: 676, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'cosmetic', expectedTrackedForms: 10, verificationStatus: 'verified', rationale: 'Track Furfrou trims inside one species card.' },
  { speciesId: 710, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'size', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track all four permanent Pumpkaboo sizes independently.' },
  { speciesId: 711, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'size', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track all four permanent Gourgeist sizes independently.' },
  { speciesId: 718, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track 10% and 50% Formes inside one Zygarde card; Complete Forme is a battle state.' },
  { speciesId: 741, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track all four Oricorio styles inside one species card.' },
  { speciesId: 745, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Track Midday, Midnight and Dusk Lycanroc as distinct targets.' },
  { speciesId: 773, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 18, verificationStatus: 'verified', rationale: 'Track Silvally types inside one species card.' },
  { speciesId: 774, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', verificationStatus: 'verified', rationale: 'Minior colours require a dedicated canonical review before fixing a total.' },
  { speciesId: 800, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'fusion', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Necrozma and its fusion/Ultra formes share one card while remaining selectable in details.' },
  { speciesId: 849, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Amped and Low Key Forms are nature-dependent permanent evolution results.' },
  { speciesId: 854, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Phony and Antique Sinistea independently.' },
  { speciesId: 855, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Phony and Antique Polteageist independently.' },
  { speciesId: 869, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 63, verificationStatus: 'verified', rationale: 'Track cream and Sweet combinations inside one species card.' },
  { speciesId: 892, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Single Strike and Rapid Strike Styles independently.' },
  { speciesId: 898, cardMode: 'single-card', completionPolicy: 'per-form', defaultKind: 'fusion', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Calyrex and its Ice/Shadow Rider fusions share one species card.' },
  { speciesId: 905, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Incarnate and Therian Enamorus independently.' },
  { speciesId: 925, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'size', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Family of Three and Family of Four independently.' },
  { speciesId: 931, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 4, verificationStatus: 'verified', rationale: 'Track the four Squawkabilly plumage colours independently.' },
  { speciesId: 978, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'pattern', expectedTrackedForms: 3, verificationStatus: 'verified', rationale: 'Track Curly, Droopy and Stretchy Tatsugiri independently.' },
  { speciesId: 982, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'size', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Two-Segment and rare Three-Segment Dudunsparce independently.' },
  { speciesId: 1012, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Counterfeit and Artisan Poltchageist independently.' },
  { speciesId: 1013, cardMode: 'per-form-card', completionPolicy: 'per-form', defaultKind: 'persistent', expectedTrackedForms: 2, verificationStatus: 'verified', rationale: 'Track Unremarkable and Masterpiece Sinistcha independently.' },
  { speciesId: 1017, cardMode: 'single-card', completionPolicy: 'single', defaultKind: 'temporary', expectedTrackedForms: 1, verificationStatus: 'verified', rationale: 'Ogerpon masks are interchangeable held-item states of the same individual.' },
  { speciesId: 1024, cardMode: 'single-card', completionPolicy: 'single', defaultKind: 'battle-only', expectedTrackedForms: 1, verificationStatus: 'verified', rationale: 'Terastal and Stellar Forms are transformations of the same Terapagos and are informational.' },
];

export const POKEMON_SPECIES_FORM_POLICY_BY_ID = new Map(
  POKEMON_SPECIES_FORM_POLICIES.map((policy) => [policy.speciesId, policy]),
);

export function validatePokemonSpeciesFormPolicies(
  policies: PokemonSpeciesFormPolicy[] = POKEMON_SPECIES_FORM_POLICIES,
): string[] {
  const errors: string[] = [];
  const seen = new Set<number>();

  policies.forEach((policy) => {
    if (seen.has(policy.speciesId)) errors.push(`Duplicate species policy: ${policy.speciesId}`);
    seen.add(policy.speciesId);
    if (policy.speciesId < 1 || !Number.isInteger(policy.speciesId)) {
      errors.push(`Invalid species ID: ${policy.speciesId}`);
    }
    if (policy.expectedTrackedForms !== undefined && policy.expectedTrackedForms < 1) {
      errors.push(`Invalid tracked form total for species ${policy.speciesId}`);
    }
    if (!policy.rationale.trim()) errors.push(`Missing rationale for species ${policy.speciesId}`);
  });

  return errors;
}
