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
    'pikachu-partner-cap',
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
    '-hisuian',
    '-totem',
    '-starter',
    '-mega',
    '-gmax',
    '-primal',
    '-eternal',
    '-alolan',// '-meteor', // Minior forms are already filtered in hook but can be added here
];

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
