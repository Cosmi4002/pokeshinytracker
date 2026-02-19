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
    primary: '#DEE3EA', // Light silver
    secondary: '#A8B2C2', // Soft metallic shadow
    accent: '#F5F8FC', // Bright silver highlight
  },
  crystal: {
    primary: '#62D5E8', // Suicune cyan
    secondary: '#4A66B4', // Violet-blue note
    accent: '#B7A7F2', // Soft violet highlight
  },

  // Gen 3
  ruby: {
    primary: '#C61F3A', // Ruby red
    secondary: '#851329', // Deep ruby shadow
    accent: '#F36A85', // Gem highlight
  },
  sapphire: {
    primary: '#1E63C6', // Sapphire blue
    secondary: '#153C8A', // Deep sapphire
    accent: '#6FA8FF', // Light reflection
  },
  firered: {
    primary: '#FF6A2E', // Bonfire flame orange
    secondary: '#B93A12', // Ember red
    accent: '#FFB26B', // Fire glow
  },
  leafgreen: {
    primary: '#48BB78',
    secondary: '#2F855A',
    accent: '#9AE6B4',
  },
  emerald: {
    primary: '#14A36D', // Emerald green
    secondary: '#0D6E4D', // Deep emerald
    accent: '#6FE0B2', // Gem reflection
  },

  // Gen 4
  diamond: {
    primary: '#4C7FEA', // Dialga-like metallic blue
    secondary: '#2B4FAD', // Deep steel blue
    accent: '#AFC8FF', // Crystal reflection
  },
  pearl: {
    primary: '#F9A8D4',
    secondary: '#F472B6',
    accent: '#FCE7F3',
  },
  platinum: {
    primary: '#D9D5CC', // Soft platinum
    secondary: '#9A7A3A', // Muted ochre
    accent: '#C2A26A', // Faded ochre highlight
  },
  heartgold: {
    primary: '#E4B33C', // Rich gold
    secondary: '#A87919', // Dark gold
    accent: '#FFD978', // Golden shine
  },
  soulsilver: {
    primary: '#CBD5E0',
    secondary: '#718096',
    accent: '#E2E8F0',
  },

  // Gen 5
  black: {
    primary: '#ECEFF4', // Off-white
    secondary: '#BFC7D4', // Cool light gray
    accent: '#FFFFFF', // Bright highlight
  },
  white: {
    primary: '#1F2A26', // Jade black
    secondary: '#131A18', // Deep dark jade
    accent: '#4F6B61', // Jade reflection
  },
  black2: {
    primary: '#0B0B0D', // Rich black
    secondary: '#191F3F', // Midnight blue
    accent: '#5D74C8', // Blue glow
  },
  white2: {
    primary: '#E34234', // Cinnabar red
    secondary: '#8E1F18', // Deep cinnabar
    accent: '#FF9A7A', // Warm glow
  },

  // Gen 6
  x: {
    primary: '#5F9BEA',
    secondary: '#2E5FA8',
    accent: '#EAF2FF', // Light white nuance
  },
  y: {
    primary: '#A61E2E',
    secondary: '#6F1320',
    accent: '#E05A70',
  },
  omegaruby: {
    primary: '#E53E3E',
    secondary: '#9B2C2C',
    accent: '#FC8181',
  },
  alphasapphire: {
    primary: '#2C79D6', // Sapphire base
    secondary: '#1F4F9B', // Deep ocean blue
    accent: '#58D1D4', // Aqua-green note
  },

  // Gen 7
  sun: {
    primary: '#FFB14A',
    secondary: '#E97A1F',
    accent: '#FFD089',
  },
  moon: {
    primary: '#5B78D6', // Royal blue note
    secondary: '#324EAA', // Deep royal
    accent: '#AFC1FF', // Moonlight reflection
  },
  ultrasun: {
    primary: '#D9721E',
    secondary: '#A64717',
    accent: '#F2B066',
  },
  ultramoon: {
    primary: '#274C77', // Yale blue
    secondary: '#1B3558', // Dark Yale
    accent: '#6C8FC4', // Cold moon highlight
  },
  lgp: {
    primary: '#F2C230', // Pikachu yellow
    secondary: '#8B5A2B', // Brown tone
    accent: '#FFE28A',
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
    primary: '#73C2FB', // Maya blue
    secondary: '#3F86C6', // Maya blue deep
    accent: '#BFE6FF', // Crystal reflection
  },
  shiningpearl: {
    primary: '#F2E7DF', // Pearl white
    secondary: '#C9B6C2', // Rosy pearl shadow
    accent: '#FFF6FB', // Bright pearl shine
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
  black: 'https://archives.bulbagarden.net/media/upload/thumb/a/ae/Pok%C3%A9mon_Black_EN_logo.png/120px-Pok%C3%A9mon_Black_EN_logo.png',
  white: 'https://archives.bulbagarden.net/media/upload/3/3e/Pok%C3%A9mon_White_EN_logo.png',
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
