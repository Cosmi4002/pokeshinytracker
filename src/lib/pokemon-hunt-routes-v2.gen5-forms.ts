import type { PokemonEntityKey } from './pokemon-catalog-v2';
import { POKEMON_CATALOG_V2_BY_KEY } from './pokemon-catalog-v2.registry';
import type { TrackedGameId } from './pokemon-game-availability';
import type { HuntRouteId, PokemonHuntRoute } from './pokemon-hunt-routes-v2';

const verifiedAt = '2026-08-23';
const gen5Games = ['black', 'white', 'black2', 'white2'] as const;
const gen2Games = ['gold', 'silver', 'crystal'] as const;

function entity(key: PokemonEntityKey) {
  const value = POKEMON_CATALOG_V2_BY_KEY.get(key);
  if (!value) throw new Error(`Missing catalog entity ${key}`);
  return value;
}

function sourcesFor(key: PokemonEntityKey): PokemonHuntRoute['sources'] {
  const current = entity(key);
  const pageName = (current.displayName || current.canonicalName).replace(/ /gu, '_');
  return [
    {
      provider: 'Serebii',
      url: `https://www.serebii.net/pokedex-bw/${String(current.speciesId).padStart(3, '0')}.shtml`,
      note: `Serebii is used to cross-check ${current.displayName}'s Generation V form availability and game/method context.`,
    },
    {
      provider: 'Bulbapedia',
      url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(pageName)}_(Pok%C3%A9mon)`,
      note: `Bulbapedia is used to cross-check ${current.displayName}'s form mechanics, version availability and shiny eligibility.`,
    },
    {
      provider: 'Pokémon Central Wiki',
      url: `https://wiki.pokemoncentral.it/${encodeURIComponent(pageName)}`,
      note: `Pokémon Central Wiki is used as the Italian cross-check for Generation V form names, availability and method/location distinctions.`,
    },
  ];
}

function unavailable(key: PokemonEntityKey, gameId: TrackedGameId, explanation: string, access: PokemonHuntRoute['access'] = 'unobtainable'): PokemonHuntRoute {
  return {
    id: `${key}:${gameId}:form-coverage-unavailable` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'unavailable',
    huntingMethodId: 'custom',
    access,
    recommendation: 'not-eligible',
    directEncounter: false,
    locations: [],
    prerequisites: [],
    explanation,
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function basculinRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  if (key === 'pokemon:550:white-striped') {
    return unavailable(key, gameId, `${current.displayName} is a later regional form and is not obtainable in Generation V.`, 'unobtainable');
  }
  const nativeGames = key === 'pokemon:550:red-striped'
    ? ['black', 'black2']
    : ['white', 'white2'];
  const native = nativeGames.includes(gameId);
  return {
    id: `${key}:${gameId}:gen5-form-coverage-basculin-${native ? 'native' : 'external-parent'}` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: native ? 'wild-random-encounter' : 'breeding',
    huntingMethodId: native ? 'gen5-random' : 'gen5-egg-hatching',
    access: native ? 'native' : 'external-parent-breeding',
    recommendation: native ? 'eligible-native' : 'eligible-with-external-setup',
    directEncounter: native,
    eggResultEntityKey: native ? undefined : key,
    locations: [native ? 'Unova water encounters — version-striped Basculin form' : 'Route 3 Day Care'],
    prerequisites: native
      ? []
      : [{ type: 'external-parent', entityKey: key, sourceGameIds: nativeGames as TrackedGameId[], note: `Use a ${current.displayName} parent from ${nativeGames.map((item) => item.toUpperCase()).join('/')} or another compatible source.` }],
    explanation: `${current.displayName} is tracked separately from the other Basculin stripe. Its Gen V native availability follows the Black/White and Black 2/White 2 version stripe split.`,
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function deerlingRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  return {
    id: `${key}:${gameId}:gen5-form-coverage-season` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'wild-random-encounter',
    huntingMethodId: 'gen5-random',
    access: 'native',
    recommendation: 'eligible-native',
    directEncounter: true,
    locations: [`Unova seasonal grass encounters — ${current.displayName}`],
    prerequisites: [{ type: 'game-progression', note: 'Use the matching in-game season/month for this Deerling form.' }],
    explanation: `${current.displayName} is a distinct seasonal Deerling form and is hunted as its own Gen V random encounter when the matching season is active.`,
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function sawsbuckRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  const deerlingKey = key.replace('pokemon:586:', 'pokemon:585:') as PokemonEntityKey;
  return {
    id: `${key}:${gameId}:gen5-form-coverage-season-evolution` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'evolution-from-hunted-shiny',
    huntingMethodId: 'gen5-random',
    access: 'same-save-evolution',
    recommendation: 'eligible-native',
    directEncounter: false,
    evolveFromEntityKey: deerlingKey,
    locations: [`Unova seasonal Deerling line — ${current.displayName}`],
    prerequisites: [{ type: 'evolve-shiny', entityKey: deerlingKey, note: `Hunt the matching shiny Deerling seasonal form, then evolve it into ${current.displayName}.` }],
    explanation: `${current.displayName} is tracked as a separate seasonal form and comes from evolving the matching shiny Deerling form.`,
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function darmanitanRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  if (key.includes('galar')) return unavailable(key, gameId, `${current.displayName} is a later regional form and is not obtainable in Generation V.`, 'unobtainable');
  if (key === 'pokemon:555:zen') {
    return {
      id: `${key}:${gameId}:gen5-form-coverage-zen-mode` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'form-change-from-hunted-shiny',
      huntingMethodId: 'gen5-random',
      access: 'same-save-form-change',
      recommendation: 'eligible-native',
      directEncounter: false,
      locations: ['Battle form change from shiny Darmanitan with Zen Mode'],
      prerequisites: [{ type: 'change-form', entityKey: 'pokemon:555:standard', note: 'Use a shiny Darmanitan with Zen Mode and trigger the in-battle HP condition; Zen Mode is not a separate wild shiny roll.' }],
      explanation: `${current.displayName} is a battle/form-change state of the same shiny Darmanitan and must not be treated as a separate random encounter.`,
      sources: sourcesFor(key),
      verifiedAt,
    };
  }
  return {
    id: `${key}:${gameId}:gen5-form-coverage-standard` as HuntRouteId,
    targetEntityKey: key,
    gameId,
    method: 'evolution-from-hunted-shiny',
    huntingMethodId: 'gen5-random',
    access: 'same-save-evolution',
    recommendation: 'eligible-native',
    directEncounter: false,
    evolveFromEntityKey: 'pokemon:554:base',
    locations: ['Unova Darumaka line'],
    prerequisites: [{ type: 'evolve-shiny', entityKey: 'pokemon:554:base', note: `Hunt shiny Darumaka, then evolve it into ${current.displayName}.` }],
    explanation: `${current.displayName} is tracked separately from Zen Mode and Galarian forms; in Gen V it comes from evolving shiny Unovan Darumaka.`,
    sources: sourcesFor(key),
    verifiedAt,
  };
}

function legendaryFormRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  if (['pokemon:647:ordinary', 'pokemon:647:resolute', 'pokemon:648:aria', 'pokemon:648:pirouette'].includes(key)) {
    return unavailable(key, gameId, `${current.displayName} is event-only in Generation V and is not exposed as a repeatable shiny hunt.`, 'event-only');
  }
  if (key.startsWith('pokemon:649:')) {
    return unavailable(key, gameId, `${current.displayName} is an event-only Genesect drive form in Generation V and is not exposed as a repeatable shiny hunt.`, 'event-only');
  }
  if (key.endsWith(':therian')) {
    const incarnateKey = key.replace(':therian', ':incarnate') as PokemonEntityKey;
    return {
      id: `${key}:${gameId}:gen5-form-coverage-therian-form-change` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'form-change-from-hunted-shiny',
      huntingMethodId: 'custom',
      access: 'external-game-feature',
      recommendation: 'eligible-with-external-setup',
      directEncounter: false,
      locations: ['Reveal Glass form change'],
      prerequisites: [{ type: 'external-game-feature', entityKey: incarnateKey, note: 'Use the Reveal Glass/form-change setup on the same shiny Incarnate Forme Pokémon; Therian Forme is not a separate wild shiny roll.' }],
      explanation: `${current.displayName} is a form-change state of the same shiny Forces of Nature Pokémon, not an independent Gen V encounter.`,
      sources: sourcesFor(key),
      verifiedAt,
    };
  }
  if (key === 'pokemon:641:incarnate') {
    const native = gameId === 'black';
    return native ? {
      id: `${key}:${gameId}:gen5-form-coverage-roaming` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'roaming-encounter',
      huntingMethodId: 'gen5-roaming',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: true,
      locations: ['Roaming Unova'],
      prerequisites: [],
      explanation: `${current.displayName} is the Black roaming Force of Nature and is tracked separately from Therian Forme.`,
      sources: sourcesFor(key),
      verifiedAt,
    } : unavailable(key, gameId, `${current.displayName} is not a native own-origin shiny hunt in ${gameId}; its paired roaming counterpart belongs to the opposite version or external setup.`, 'trade-only');
  }
  if (key === 'pokemon:642:incarnate') {
    const native = gameId === 'white';
    return native ? {
      id: `${key}:${gameId}:gen5-form-coverage-roaming` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'roaming-encounter',
      huntingMethodId: 'gen5-roaming',
      access: 'native',
      recommendation: 'eligible-native',
      directEncounter: true,
      locations: ['Roaming Unova'],
      prerequisites: [],
      explanation: `${current.displayName} is the White roaming Force of Nature and is tracked separately from Therian Forme.`,
      sources: sourcesFor(key),
      verifiedAt,
    } : unavailable(key, gameId, `${current.displayName} is not a native own-origin shiny hunt in ${gameId}; its paired roaming counterpart belongs to the opposite version or external setup.`, 'trade-only');
  }
  if (key === 'pokemon:645:incarnate') {
    const native = gameId === 'black' || gameId === 'white';
    return native ? {
      id: `${key}:${gameId}:gen5-form-coverage-abundant-shrine` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'static-encounter',
      huntingMethodId: 'gen5-soft-reset',
      access: 'external-game-feature',
      recommendation: 'eligible-with-external-setup',
      directEncounter: false,
      locations: ['Abundant Shrine'],
      prerequisites: [{ type: 'external-game-feature', note: 'Bring both Tornadus and Thundurus to Abundant Shrine to unlock Landorus.' }],
      explanation: `${current.displayName} is the Abundant Shrine encounter in Black/White and is tracked separately from Therian Forme.`,
      sources: sourcesFor(key),
      verifiedAt,
    } : unavailable(key, gameId, `${current.displayName} has no native own-origin shiny hunt in ${gameId}; Dream Radar-style setup is not a normal repeatable shiny route.`, 'shiny-locked');
  }
  if (key === 'pokemon:646:black' || key === 'pokemon:646:white') {
    return {
      id: `${key}:${gameId}:gen5-form-coverage-dna-splicers` as HuntRouteId,
      targetEntityKey: key,
      gameId,
      method: 'form-change-from-hunted-shiny',
      huntingMethodId: 'custom',
      access: 'same-save-form-change',
      recommendation: 'eligible-native',
      directEncounter: false,
      locations: ['DNA Splicers fusion form'],
      prerequisites: [{ type: 'change-form', entityKey: 'pokemon:646:base', note: `Use the same shiny Kyurem with DNA Splicers to obtain ${current.displayName}; this is not a separate shiny encounter.` }],
      explanation: `${current.displayName} is a Kyurem fusion/form-change route from the same shiny Kyurem, not an independent wild/static shiny roll.`,
      sources: sourcesFor(key),
      verifiedAt,
    };
  }
  return unavailable(key, gameId, `${current.displayName} has no configured Generation V form hunt.`, 'unobtainable');
}

function buildGen5FormRoute(key: PokemonEntityKey, gameId: (typeof gen5Games)[number]): PokemonHuntRoute {
  const current = entity(key);
  if ([503, 549, 554, 562, 570, 571, 618, 628].includes(current.speciesId)) {
    return unavailable(key, gameId, `${current.displayName} is a later regional form and is unobtainable in Generation V.`, 'unobtainable');
  }
  if (current.speciesId === 550) return basculinRoute(key, gameId);
  if (current.speciesId === 585) return deerlingRoute(key, gameId);
  if (current.speciesId === 586) return sawsbuckRoute(key, gameId);
  if (current.speciesId === 555) return darmanitanRoute(key, gameId);
  if ([641, 642, 645, 646, 647, 648, 649].includes(current.speciesId)) return legendaryFormRoute(key, gameId);
  return unavailable(key, gameId, `${current.displayName} is not obtainable as a distinct Generation V form hunt.`, 'unobtainable');
}

export const GEN5_FORM_HUNT_COVERAGE_ROUTES: PokemonHuntRoute[] = [];

for (const key of [
  'pokemon:503:samurott-hisui', 'pokemon:549:lilligant-hisui',
  'pokemon:550:blue-striped', 'pokemon:550:red-striped', 'pokemon:550:white-striped',
  'pokemon:554:darumaka-galar', 'pokemon:555:galar-standard', 'pokemon:555:galar-zen', 'pokemon:555:standard', 'pokemon:555:zen',
  'pokemon:562:yamask-galar', 'pokemon:570:zorua-hisui', 'pokemon:571:zoroark-hisui',
  'pokemon:585:autumn', 'pokemon:585:spring', 'pokemon:585:summer', 'pokemon:585:winter',
  'pokemon:586:autumn', 'pokemon:586:spring', 'pokemon:586:summer', 'pokemon:586:winter',
  'pokemon:618:stunfisk-galar', 'pokemon:628:braviary-hisui',
  'pokemon:641:incarnate', 'pokemon:641:therian', 'pokemon:642:incarnate', 'pokemon:642:therian',
  'pokemon:645:incarnate', 'pokemon:645:therian', 'pokemon:646:black', 'pokemon:646:white',
  'pokemon:647:ordinary', 'pokemon:647:resolute', 'pokemon:648:aria', 'pokemon:648:pirouette',
  'pokemon:649:burn-drive', 'pokemon:649:chill-drive', 'pokemon:649:douse-drive', 'pokemon:649:no-drive', 'pokemon:649:shock-drive',
] as PokemonEntityKey[]) {
  for (const gameId of gen5Games) GEN5_FORM_HUNT_COVERAGE_ROUTES.push(buildGen5FormRoute(key, gameId));
}

for (const key of [
  'pokemon:157:typhlosion-hisui',
  'pokemon:194:wooper-paldea',
  'pokemon:199:slowking-galar',
  'pokemon:211:qwilfish-hisui',
  'pokemon:215:sneasel-hisui',
  'pokemon:222:corsola-galar',
] as PokemonEntityKey[]) {
  for (const gameId of gen2Games) {
    GEN5_FORM_HUNT_COVERAGE_ROUTES.push(unavailable(key, gameId, `${entity(key).displayName} is a later regional form and is unobtainable in Generation II.`, 'unobtainable'));
  }
}
