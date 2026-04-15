export interface ColorScheme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceGlass: string;
  surfaceElevated: string;

  // Brand
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Borders
  border: string;
  borderLight: string;

  // Semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;

  // Absolute
  white: string;
  black: string;
}

// Warm Premium Light — тёплый бежевый фон, мягкий индиго + коралл
export const lightColors: ColorScheme = {
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  surfaceElevated: '#F5F3F0',

  primary: '#7C5DFA',
  primarySoft: 'rgba(124,93,250,0.12)',
  accent: '#FF6B6B',
  accentSoft: 'rgba(255,107,107,0.12)',

  text: '#1E1E2E',
  textSecondary: '#6E6E80',
  textTertiary: '#A0A0B0',

  border: 'rgba(30,30,46,0.08)',
  borderLight: 'rgba(30,30,46,0.04)',

  success: '#2ED573',
  successSoft: 'rgba(46,213,115,0.12)',
  warning: '#FFA502',
  warningSoft: 'rgba(255,165,2,0.12)',
  danger: '#FF4757',
  dangerSoft: 'rgba(255,71,87,0.12)',

  white: '#FFFFFF',
  black: '#000000',
};

// Deep Luxury Dark — глубокий фиолетово-чёрный, яркие акценты
export const darkColors: ColorScheme = {
  background: '#13131A',
  surface: '#1E1E2E',
  surfaceGlass: 'rgba(30,30,46,0.82)',
  surfaceElevated: '#252536',

  primary: '#9B8AFB',
  primarySoft: 'rgba(155,138,251,0.15)',
  accent: '#FF8A80',
  accentSoft: 'rgba(255,138,128,0.15)',

  text: '#F0F0F5',
  textSecondary: '#8888A0',
  textTertiary: '#5A5A70',

  border: 'rgba(240,240,245,0.08)',
  borderLight: 'rgba(240,240,245,0.04)',

  success: '#5AF78E',
  successSoft: 'rgba(90,247,142,0.15)',
  warning: '#FFD93D',
  warningSoft: 'rgba(255,217,61,0.15)',
  danger: '#FF6B81',
  dangerSoft: 'rgba(255,107,129,0.15)',

  white: '#FFFFFF',
  black: '#000000',
};
