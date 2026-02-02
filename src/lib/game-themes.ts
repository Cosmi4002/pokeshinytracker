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
