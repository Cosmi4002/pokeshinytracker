import type { PokemonHuntRoute } from './pokemon-hunt-routes-v2';

export const HUNT_ROUTE_METHOD_WEIGHTS = {
  standard: 1,
  masuda: 0.25,
  breeding: 0.05,
} as const;

type HuntRouteMethodClass = keyof typeof HUNT_ROUTE_METHOD_WEIGHTS;

export function getHuntRouteMethodClass(route: PokemonHuntRoute): HuntRouteMethodClass {
  if (route.huntingMethodId.includes('masuda')) return 'masuda';
  if (route.method === 'breeding' || route.method === 'breeding-and-evolution') {
    return 'breeding';
  }
  return 'standard';
}

export function getHuntRouteMethodWeight(route: PokemonHuntRoute): number {
  return HUNT_ROUTE_METHOD_WEIGHTS[getHuntRouteMethodClass(route)];
}

function pickUniform<T>(items: readonly T[], random: () => number): T | null {
  if (items.length === 0) return null;
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index];
}

/**
 * Method classes are selected before games. This prevents the many game-specific
 * Breeding and Masuda records from drowning native encounter methods. Within the
 * chosen class, method, game and equivalent location variants are uniform.
 */
export function chooseRandomHuntRoute(
  routes: readonly PokemonHuntRoute[],
  random: () => number = Math.random,
): PokemonHuntRoute | null {
  if (routes.length === 0) return null;

  const routesByClass = new Map<HuntRouteMethodClass, PokemonHuntRoute[]>();
  for (const route of routes) {
    const methodClass = getHuntRouteMethodClass(route);
    const classRoutes = routesByClass.get(methodClass);
    if (classRoutes) classRoutes.push(route);
    else routesByClass.set(methodClass, [route]);
  }

  const classGroups = Array.from(routesByClass.entries());
  const totalClassWeight = classGroups.reduce((sum, [methodClass]) => sum + HUNT_ROUTE_METHOD_WEIGHTS[methodClass], 0);
  let classThreshold = random() * totalClassWeight;
  let selectedClassRoutes = classGroups[classGroups.length - 1][1];
  for (const [methodClass, classRoutes] of classGroups) {
    classThreshold -= HUNT_ROUTE_METHOD_WEIGHTS[methodClass];
    if (classThreshold < 0) {
      selectedClassRoutes = classRoutes;
      break;
    }
  }

  const routesByMethod = new Map<string, PokemonHuntRoute[]>();
  for (const route of selectedClassRoutes) {
    const methodRoutes = routesByMethod.get(route.huntingMethodId);
    if (methodRoutes) methodRoutes.push(route);
    else routesByMethod.set(route.huntingMethodId, [route]);
  }

  const selectedMethodRoutes = pickUniform(Array.from(routesByMethod.values()), random);
  if (!selectedMethodRoutes) return null;

  const routesByGame = new Map<PokemonHuntRoute['gameId'], PokemonHuntRoute[]>();
  for (const route of selectedMethodRoutes) {
    const gameRoutes = routesByGame.get(route.gameId);
    if (gameRoutes) gameRoutes.push(route);
    else routesByGame.set(route.gameId, [route]);
  }

  const selectedGameRoutes = pickUniform(Array.from(routesByGame.values()), random);
  return selectedGameRoutes ? pickUniform(selectedGameRoutes, random) : null;
}
