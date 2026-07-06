/**
 * Sprite Fallback Service
 * Tries multiple sources to load Pokemon sprites with graceful degradation
 * Priority: PokemonDB → PokeAPI HOME → Showdown → Official Artwork → Placeholder
 */

// Map of Pokemon IDs to verified working sprite URLs (for forms with known issues)
const SPRITE_OVERRIDES: Record<string, string> = {
  // Gen 7 Shiny sprite overrides (sourced from pokemondb when PokeAPI fails)
  '745-midday': 'https://img.pokemondb.net/sprites/home/shiny/lycanroc-midday.png',
  '745-midnight': 'https://img.pokemondb.net/sprites/home/shiny/lycanroc-midnight.png',
  '745-dusk': 'https://img.pokemondb.net/sprites/home/shiny/lycanroc-dusk.png',
  '741-baile': 'https://img.pokemondb.net/sprites/home/shiny/oricorio-baile.png',
  '741-pom-pom': 'https://img.pokemondb.net/sprites/home/shiny/oricorio-pom-pom.png',
  '741-pau': 'https://img.pokemondb.net/sprites/home/shiny/oricorio-pau.png',
  '741-sensu': 'https://img.pokemondb.net/sprites/home/shiny/oricorio-sensu.png',
};

/**
 * Build a fallback chain of sprite URLs
 * Returns an array of URLs to try in order
 */
export function getSpriteFallbackChain(
  pokemonId: number,
  options: {
    shiny?: boolean;
    female?: boolean;
    name?: string;
    form?: string;
  } = {}
): string[] {
  const urls: string[] = [];
  const { shiny = false, female = false, name = '', form = '' } = options;

  // 1. Check for exact override first
  const formKey = form || (name ? name.split('-').slice(1).join('-') : '');
  const overrideKey = formKey ? `${pokemonId}-${formKey}` : pokemonId.toString();
  if (SPRITE_OVERRIDES[overrideKey]) {
    urls.push(SPRITE_OVERRIDES[overrideKey]);
  }

  // 2. Primary: PokemonDB (often more complete for forms)
  if (name) {
    const slug = normalizePokemonSlug(name);
    const subPath = shiny ? 'shiny' : 'normal';
    urls.push(`https://img.pokemondb.net/sprites/home/${subPath}/${slug}.png`);
  }

  // 3. Fallback: PokeAPI HOME sprite (official)
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';
  const shinyPath = shiny ? '/shiny' : '';
  const genderPath = female ? '/female' : '';
  urls.push(`${baseUrl}${shinyPath}${genderPath}/${pokemonId}.png`);

  // 4. Fallback: Showdown sprite (usually has most forms)
  if (name) {
    const showdownSlug = normalizeShowdownSlug(name);
    urls.push(`https://play.pokemonshowdown.com/sprites/pokemon${shiny ? '-shiny' : ''}/${showdownSlug}.png`);
  }

  // 5. Fallback: PokePedia (French source, good for special forms)
  if (name) {
    const slug = normalizePokemonSlug(name);
    urls.push(`https://www.pokepedia.fr/images/a/a0/${slug.replace(/-/g, '_')}.png`);
  }

  // 6. Last resort: Official Artwork from PokeAPI
  urls.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork${shiny ? '/shiny' : ''}/${pokemonId}.png`);

  // 7. Absolute fallback
  urls.push('/placeholder.svg');

  // Remove duplicates while preserving order
  return Array.from(new Set(urls));
}

/**
 * Normalize Pokemon name to pokemondb slug format
 */
function normalizePokemonSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['%: .]/g, '')
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace(/é/g, 'e')
    .replace('nidoran-f', 'nidoranf')
    .replace('nidoran-m', 'nidoranm')
    .replace('mr-mime', 'mrmime')
    .replace('mime-jr', 'mimejr')
    .replace('mr-rime', 'mrrime')
    .replace('type-null', 'typenull');
}

/**
 * Normalize Pokemon name to Showdown slug format
 */
function normalizeShowdownSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['%: .]/g, '')
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace('nidoran-f', 'nidoranf')
    .replace('nidoran-m', 'nidoranm')
    .replace('mr-mime', 'mrmime')
    .replace('type-null', 'typenull');
}

/**
 * Get a single sprite URL with fallback chain embedded as a data attribute
 * This allows the frontend to retry on error
 */
export function buildSpriteUrlWithFallback(
  pokemonId: number,
  options: {
    shiny?: boolean;
    female?: boolean;
    name?: string;
    form?: string;
  } = {}
): {
  primary: string;
  fallbacks: string[];
  all: string[];
} {
  const fallbacks = getSpriteFallbackChain(pokemonId, options);
  return {
    primary: fallbacks[0],
    fallbacks: fallbacks.slice(1),
    all: fallbacks,
  };
}

/**
 * Image error handler that tries the next fallback URL
 * Usage: onError={(e) => handleSpriteError(e, allFallbackUrls)}
 */
export function handleSpriteError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrls: string[]
): void {
  const img = event.currentTarget as HTMLImageElement;
  const currentUrl = img.src;

  // Find current URL index
  const currentIndex = fallbackUrls.indexOf(currentUrl);

  // Try next URL if available
  if (currentIndex < fallbackUrls.length - 1) {
    img.src = fallbackUrls[currentIndex + 1];
  } else {
    // All fallbacks exhausted, use placeholder
    img.src = '/placeholder.svg';
  }
}
