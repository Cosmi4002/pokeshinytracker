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
    primary: '#ED8936',
    secondary: '#C05621',
    accent: '#FBD38D',
  },
  platinum: {
    primary: '#718096',
    secondary: '#4A5568',
    accent: '#A0AEC0',
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
    primary: '#D69E2E',
    secondary: '#975A16',
    accent: '#F6E05E',
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

// High-quality game logos from Bulbagarden
export const GAME_LOGOS: Record<string, string> = {
  // Gen 2
  gold: 'https://archives.bulbagarden.net/media/upload/a/a2/Pok%C3%A9mon_Gold_EN_logo.png',
  silver: 'https://archives.bulbagarden.net/media/upload/3/30/Pok%C3%A9mon_Silver_EN_logo.png',
  crystal: 'https://archives.bulbagarden.net/media/upload/5/5b/Pok%C3%A9mon_Crystal_EN_logo.png',
  // Gen 3
  ruby: 'https://archives.bulbagarden.net/media/upload/f/f6/Pok%C3%A9mon_Ruby_EN_logo.png',
  sapphire: 'https://archives.bulbagarden.net/media/upload/3/39/Pok%C3%A9mon_Sapphire_EN_logo.png',
  emerald: 'https://archives.bulbagarden.net/media/upload/3/35/Pok%C3%A9mon_Emerald_EN_logo.png',
  firered: 'https://archives.bulbagarden.net/media/upload/0/05/Pok%C3%A9mon_FireRed_EN_logo.png',
  leafgreen: 'https://archives.bulbagarden.net/media/upload/f/f0/Pok%C3%A9mon_LeafGreen_EN_logo.png',
  // Gen 4
  diamond: 'https://archives.bulbagarden.net/media/upload/e/e0/Pok%C3%A9mon_Diamond_EN_logo.png',
  pearl: 'https://archives.bulbagarden.net/media/upload/1/18/Pok%C3%A9mon_Pearl_EN_logo.png',
  platinum: 'https://archives.bulbagarden.net/media/upload/4/4e/Pok%C3%A9mon_Platinum_EN_logo.png',
  heartgold: 'https://archives.bulbagarden.net/media/upload/0/05/Pok%C3%A9mon_HeartGold_EN_logo.png',
  soulsilver: 'https://archives.bulbagarden.net/media/upload/d/d3/Pok%C3%A9mon_SoulSilver_EN_logo.png',
  // Gen 5
  black: 'https://archives.bulbagarden.net/media/upload/5/5b/Pok%C3%A9mon_Black_EN_logo.png',
  white: 'https://archives.bulbagarden.net/media/upload/4/48/Pok%C3%A9mon_White_EN_logo.png',
  black2: 'https://archives.bulbagarden.net/media/upload/6/60/Pok%C3%A9mon_Black_2_EN_logo.png',
  white2: 'https://archives.bulbagarden.net/media/upload/7/77/Pok%C3%A9mon_White_2_EN_logo.png',
  // Gen 6
  x: 'https://archives.bulbagarden.net/media/upload/3/3d/Pok%C3%A9mon_X_EN_logo.png',
  y: 'https://archives.bulbagarden.net/media/upload/9/97/Pok%C3%A9mon_Y_EN_logo.png',
  omegaruby: 'https://archives.bulbagarden.net/media/upload/9/97/Pok%C3%A9mon_Omega_Ruby_EN_logo.png',
  alphasapphire: 'https://archives.bulbagarden.net/media/upload/6/66/Pok%C3%A9mon_Alpha_Sapphire_EN_logo.png',
  // Gen 7
  sun: 'https://archives.bulbagarden.net/media/upload/f/f4/Pok%C3%A9mon_Sun_EN_logo.png',
  moon: 'https://archives.bulbagarden.net/media/upload/1/11/Pok%C3%A9mon_Moon_EN_logo.png',
  ultrasun: 'https://archives.bulbagarden.net/media/upload/b/b7/Pok%C3%A9mon_Ultra_Sun_EN_logo.png',
  ultramoon: 'https://archives.bulbagarden.net/media/upload/4/42/Pok%C3%A9mon_Ultra_Moon_EN_logo.png',
  lgp: 'https://archives.bulbagarden.net/media/upload/c/c7/Pok%C3%A9mon_Let%27s_Go_Pikachu_EN_logo.png',
  lge: 'https://archives.bulbagarden.net/media/upload/d/d4/Pok%C3%A9mon_Let%27s_Go_Eevee_EN_logo.png',
  // Gen 8
  sword: 'https://archives.bulbagarden.net/media/upload/2/28/Pok%C3%A9mon_Sword_EN_logo.png',
  shield: 'https://archives.bulbagarden.net/media/upload/5/52/Pok%C3%A9mon_Shield_EN_logo.png',
  brilliantdiamond: 'https://archives.bulbagarden.net/media/upload/8/8e/Pok%C3%A9mon_Brilliant_Diamond_EN_logo.png',
  shiningpearl: 'https://archives.bulbagarden.net/media/upload/6/66/Pok%C3%A9mon_Shining_Pearl_EN_logo.png',
  pla: 'https://archives.bulbagarden.net/media/upload/5/5f/Pok%C3%A9mon_Legends_Arceus_EN_logo.png',
  // Gen 9
  scarlet: 'https://archives.bulbagarden.net/media/upload/2/26/Pok%C3%A9mon_Scarlet_EN_logo.png',
  violet: 'https://archives.bulbagarden.net/media/upload/d/d0/Pok%C3%A9mon_Violet_EN_logo.png',
};
