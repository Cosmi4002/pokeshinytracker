// Game-specific color themes for collection cards
// Each game has a unique gradient to match its branding

export interface GameTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  // Gen 2
  gold: {
    primary: '#F7D02C',
    secondary: '#D4A017',
    accent: '#FFE55C',
  },
  silver: {
    primary: '#C0C0C0',
    secondary: '#8C92AC',
    accent: '#E8E8E8',
  },
  crystal: {
    primary: '#4FD1C5',
    secondary: '#2C7A7B',
    accent: '#81E6D9',
  },

  // Gen 3
  ruby: {
    primary: '#E53E3E',
    secondary: '#9B2C2C',
    accent: '#FC8181',
  },
  sapphire: {
    primary: '#3182CE',
    secondary: '#2C5282',
    accent: '#63B3ED',
  },
  firered: {
    primary: '#F56565',
    secondary: '#C53030',
    accent: '#FEB2B2',
  },
  leafgreen: {
    primary: '#48BB78',
    secondary: '#2F855A',
    accent: '#9AE6B4',
  },
  emerald: {
    primary: '#38B2AC',
    secondary: '#2C7A7B',
    accent: '#81E6D9',
  },

  // Gen 4
  diamond: {
    primary: '#4299E1',
    secondary: '#2B6CB0',
    accent: '#90CDF4',
  },
  pearl: {
    primary: '#F9A8D4',
    secondary: '#F472B6',
    accent: '#FCE7F3',
  },
  platinum: {
    primary: '#E5E4E2', // Platinum
    secondary: '#B8860B', // Dark Goldenrod (Ochre accent)
    accent: '#DAA520', // Goldenrod
  },
  heartgold: {
    primary: '#F6AD55',
    secondary: '#C05621',
    accent: '#FBD38D',
  },
  soulsilver: {
    primary: '#CBD5E0',
    secondary: '#718096',
    accent: '#E2E8F0',
  },

  // Gen 5
  black: {
    primary: '#2D3748',
    secondary: '#1A202C',
    accent: '#4A5568',
  },
  white: {
    primary: '#E2E8F0',
    secondary: '#A0AEC0',
    accent: '#F7FAFC',
  },
  black2: {
    primary: '#2D3748',
    secondary: '#1A202C',
    accent: '#4A5568',
  },
  white2: {
    primary: '#E2E8F0',
    secondary: '#A0AEC0',
    accent: '#F7FAFC',
  },

  // Gen 6
  x: {
    primary: '#4299E1',
    secondary: '#2C5282',
    accent: '#90CDF4',
  },
  y: {
    primary: '#E53E3E',
    secondary: '#9B2C2C',
    accent: '#FC8181',
  },
  omegaruby: {
    primary: '#E53E3E',
    secondary: '#9B2C2C',
    accent: '#FC8181',
  },
  alphasapphire: {
    primary: '#3182CE',
    secondary: '#2C5282',
    accent: '#63B3ED',
  },

  // Gen 7
  sun: {
    primary: '#F6AD55',
    secondary: '#DD6B20',
    accent: '#FBD38D',
  },
  moon: {
    primary: '#9F7AEA',
    secondary: '#6B46C1',
    accent: '#D6BCFA',
  },
  ultrasun: {
    primary: '#ED8936',
    secondary: '#C05621',
    accent: '#FBD38D',
  },
  ultramoon: {
    primary: '#805AD5',
    secondary: '#553C9A',
    accent: '#D6BCFA',
  },
  lgp: {
    primary: '#F6AD55',
    secondary: '#DD6B20',
    accent: '#FBD38D',
  },
  lge: {
    primary: '#8B4513', // Saddle Brown
    secondary: '#5D4037', // Darker Brown
    accent: '#D2691E', // Chocolate
  },

  // Gen 8
  sword: {
    primary: '#4299E1',
    secondary: '#2B6CB0',
    accent: '#90CDF4',
  },
  shield: {
    primary: '#D53F8C',
    secondary: '#97266D',
    accent: '#FBB6CE',
  },
  brilliantdiamond: {
    primary: '#4299E1',
    secondary: '#2B6CB0',
    accent: '#90CDF4',
  },
  shiningpearl: {
    primary: '#ED8936',
    secondary: '#C05621',
    accent: '#FBD38D',
  },
  pla: {
    primary: '#38B2AC',
    secondary: '#2C7A7B',
    accent: '#81E6D9',
  },

  // Gen 9
  scarlet: {
    primary: '#F56565',
    secondary: '#C53030',
    accent: '#FEB2B2',
  },
  violet: {
    primary: '#9F7AEA',
    secondary: '#6B46C1',
    accent: '#D6BCFA',
  },
};

// Helper function to get theme for a game
export function getGameTheme(gameId: string): GameTheme {
  return GAME_THEMES[gameId] || {
    primary: '#4299E1',
    secondary: '#2B6CB0',
    accent: '#90CDF4',
  };
}
// Game icons mapping (using Pokesprite via GitHub CDN)
export const GAME_ICONS: Record<string, string> = {
  // Gen 2
  gold: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/gold.png',
  silver: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/silver.png',
  crystal: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/crystal.png',
  // Gen 3
  ruby: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/ruby.png',
  sapphire: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/sapphire.png',
  emerald: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/emerald.png',
  firered: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/firered.png',
  leafgreen: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/leafgreen.png',
  // Gen 4
  diamond: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/diamond.png',
  pearl: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/pearl.png',
  platinum: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/platinum.png',
  heartgold: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/heartgold.png',
  soulsilver: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/soulsilver.png',
  // Gen 5
  black: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/black.png',
  white: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/white.png',
  black2: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/black-2.png',
  white2: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/white-2.png',
  // Gen 6
  x: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/x.png',
  y: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/y.png',
  omegaruby: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/omega-ruby.png',
  alphasapphire: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/alpha-sapphire.png',
  // Gen 7
  sun: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/sun.png',
  moon: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/moon.png',
  ultrasun: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/ultra-sun.png',
  ultramoon: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/ultra-moon.png',
  lgp: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/lets-go-pikachu.png',
  lge: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/lets-go-eevee.png',
  // Gen 8
  sword: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/sword.png',
  shield: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/shield.png',
  brilliantdiamond: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/brilliant-diamond.png',
  shiningpearl: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/shining-pearl.png',
  pla: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/legends-arceus.png',
  // Gen 9
  scarlet: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/scarlet.png',
  violet: 'https://raw.githubusercontent.com/msikma/pokesprite/master/icons/software/pkg/violet.png',
};
// Game cover art mapping
export const GAME_COVER_ART: Record<string, string> = {
  // Gen 2
  gold: 'https://img.pokemondb.net/boxes/gold.jpg',
  silver: 'https://img.pokemondb.net/boxes/silver.jpg',
  crystal: 'https://img.pokemondb.net/boxes/crystal.jpg',
  // Gen 3
  ruby: 'https://img.pokemondb.net/boxes/ruby.jpg',
  sapphire: 'https://img.pokemondb.net/boxes/sapphire.jpg',
  emerald: 'https://img.pokemondb.net/boxes/emerald.jpg',
  firered: 'https://img.pokemondb.net/boxes/firered.jpg',
  leafgreen: 'https://img.pokemondb.net/boxes/leafgreen.jpg',
  // Gen 4
  diamond: 'https://img.pokemondb.net/boxes/diamond.jpg',
  pearl: 'https://img.pokemondb.net/boxes/pearl.jpg',
  platinum: 'https://img.pokemondb.net/boxes/platinum.jpg',
  heartgold: 'https://img.pokemondb.net/boxes/heartgold.jpg',
  soulsilver: 'https://img.pokemondb.net/boxes/soulsilver.jpg',
  // Gen 5
  black: 'https://img.pokemondb.net/boxes/black.jpg',
  white: 'https://img.pokemondb.net/boxes/white.jpg',
  black2: 'https://img.pokemondb.net/boxes/black-2.jpg',
  white2: 'https://img.pokemondb.net/boxes/white-2.jpg',
  // Gen 6
  x: 'https://img.pokemondb.net/boxes/x.jpg',
  y: 'https://img.pokemondb.net/boxes/y.jpg',
  omegaruby: 'https://img.pokemondb.net/boxes/omega-ruby.jpg',
  alphasapphire: 'https://img.pokemondb.net/boxes/alpha-sapphire.jpg',
  // Gen 7
  sun: 'https://img.pokemondb.net/boxes/sun.jpg',
  moon: 'https://img.pokemondb.net/boxes/moon.jpg',
  ultrasun: 'https://img.pokemondb.net/boxes/ultra-sun.jpg',
  ultramoon: 'https://img.pokemondb.net/boxes/ultra-moon.jpg',
  lgp: 'https://img.pokemondb.net/boxes/lets-go-pikachu.jpg',
  lge: 'https://img.pokemondb.net/boxes/lets-go-eevee.jpg',
  // Gen 8
  sword: 'https://img.pokemondb.net/boxes/sword.jpg',
  shield: 'https://img.pokemondb.net/boxes/shield.jpg',
  brilliantdiamond: 'https://img.pokemondb.net/boxes/brilliant-diamond.jpg',
  shiningpearl: 'https://img.pokemondb.net/boxes/shining-pearl.jpg',
  pla: 'https://img.pokemondb.net/boxes/legends-arceus.jpg',
  // Gen 9
  scarlet: 'https://img.pokemondb.net/boxes/scarlet.jpg',
  violet: 'https://img.pokemondb.net/boxes/violet.jpg',
};

// High-quality game logos from Bulbagarden (Local Hosting)
export const GAME_LOGOS: Record<string, string> = {
  // Gen 2
  gold: 'https://static.wikia.nocookie.net/logopedia/images/c/c9/PokemonGoldLogo.png/revision/latest?cb=20190526232149',
  silver: 'https://static.wikia.nocookie.net/logopedia/images/d/d3/SilverLogo.png/revision/latest?cb=20190526233701',
  crystal: 'https://static.wikia.nocookie.net/logopedia/images/a/a3/Pokemon_-_Crystal_Version_logo.png/revision/latest?cb=20190526234340',
  // Gen 3
  ruby: '/img/game-logos/ruby.png',
  sapphire: '/img/game-logos/sapphire.png',
  emerald: '/img/game-logos/emerald.png',
  firered: '/img/game-logos/firered.png',
  leafgreen: '/img/game-logos/leafgreen.png',
  // Gen 4
  diamond: '/img/game-logos/diamond.png',
  pearl: '/img/game-logos/pearl.png',
  platinum: '/img/game-logos/platinum.png',
  heartgold: '/img/game-logos/heartgold.png',
  soulsilver: '/img/game-logos/soulsilver.png',
  // Gen 5
  black: 'https://archives.bulbagarden.net/wiki/Special:FilePath/Pok%C3%A9mon_Black_EN_logo.png',
  white: 'https://m.archives.bulbagarden.net/media/upload/3/3e/Pok%C3%A9mon_White_EN_logo.png',
  black2: '/img/game-logos/black2.png',
  white2: '/img/game-logos/white2.png',
  // Gen 6
  x: '/img/game-logos/x.png',
  y: '/img/game-logos/y.png',
  omegaruby: '/img/game-logos/omegaruby.png',
  alphasapphire: '/img/game-logos/alphasapphire.png',
  // Gen 7
  sun: '/img/game-logos/sun.png',
  moon: '/img/game-logos/moon.png',
  ultrasun: '/img/game-logos/ultrasun.png',
  ultramoon: '/img/game-logos/ultramoon.png',
  lgp: '/img/game-logos/lgp.png',
  lge: '/img/game-logos/lge.png',
  // Gen 8
  sword: '/img/game-logos/sword.png',
  shield: '/img/game-logos/shield.png',
  brilliantdiamond: '/img/game-logos/brilliantdiamond.png',
  shiningpearl: '/img/game-logos/shiningpearl.png',
  pla: '/img/game-logos/pla.png',
  // Gen 9
  scarlet: '/img/game-logos/scarlet.png',
  violet: '/img/game-logos/violet.png',
};
