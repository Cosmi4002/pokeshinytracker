/**
 * Form Elimination System
 * 
 * Add Pokemon names or keywords to these lists to permanently eliminate
 * them from the Pokedex, details page, and total completion counts.
 */

/**
 * EXACT NAMES to eliminate.
 * Example: 'pikachu-partner-cap', 'unown-b'
 */
export const BANNED_FORM_NAMES: string[] = [
    // Add specific forms to eliminate here
    'oinkologne-female',
    'urshifu-rapid-strike',
    'meowstic-female',
    'indeedee-female',
];

/**
 * KEYWORDS to eliminate across all Pokemon.
 * Any form matching These will be deleted.
 * Example: '-totem', '-starter', '-mega', '-gmax'
 */
export const BANNED_FORM_KEYWORDS: string[] = [
    '-galar',
    '-paldea',
    '-hisui',   // Matching PokeAPI slug exactly
    '-alola',   // Matching PokeAPI slug exactly
    '-totem',
    '-starter',
    '-mega',
    '-gmax',
    '-primal',
    '-eternal',
];

/**
 * MANUAL DATA OVERRIDES
 * Use this to change names, types, or any other detail for a specific Pokemon by ID.
 * Example: 25: { displayName: 'Super Pikachu', types: ['electric', 'flying'] }
 */
export interface PokemonOverride {
    displayName?: string;
    types?: string[];
}

export const POKEMON_DATA_OVERRIDES: Record<number, PokemonOverride> = {
    // Add manual overrides here
    // 25: { displayName: 'Pikachu Special' },
};

/**
 * Helper to check if a form should be eliminated
 */
export function isFormEliminated(name: string): boolean {
    const slug = name.toLowerCase();

    // Check exact names
    if (BANNED_FORM_NAMES.includes(slug)) return true;

    // Check keywords
    if (BANNED_FORM_KEYWORDS.some(kw => slug.includes(kw.toLowerCase()))) return true;

    return false;
}
