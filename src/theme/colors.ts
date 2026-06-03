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

  // Mesh — 3 цвета фоновых «пятен», которые blur размывает за карточками.
  // Создают живой glassmorphism-фон вместо плоского background.
  mesh: [string, string, string];
}

// Emerald & Gold — Light. Мятно-зелёный off-white фон, изумруд + золото.
// Гамма «деньги/успех/luxury». WCAG AA ≥4.5:1 для текста.
export const lightColors: ColorScheme = {
  // Мятно-зелёный off-white — свежий, не белый-стерильный
  background: '#F2F7F4',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.85)',
  surfaceElevated: '#E6F0EA',

  // Primary — насыщенный изумруд (темнее для контраста на белом)
  primary: '#059669',
  primarySoft: 'rgba(5,150,105,0.12)',
  // Accent — золото/амбер
  accent: '#D9A21B',
  accentSoft: 'rgba(217,162,27,0.14)',

  // Text — глубокий графит с зелёным undertone
  text: '#0E1A14',
  textSecondary: '#4A5A51',
  textTertiary: '#6B7C72',

  border: 'rgba(5,150,105,0.14)',
  borderLight: 'rgba(5,150,105,0.06)',

  success: '#059669',
  successSoft: 'rgba(5,150,105,0.13)',
  warning: '#D9A21B',
  warningSoft: 'rgba(217,162,27,0.14)',
  danger: '#E5484D',
  dangerSoft: 'rgba(229,72,77,0.13)',

  white: '#FFFFFF',
  black: '#000000',

  // Mesh пятна для светлой темы — мягкие но заметные сквозь стекло
  mesh: ['rgba(16,185,129,0.22)', 'rgba(217,162,27,0.18)', 'rgba(5,150,105,0.14)'],
};

// Emerald & Gold — Dark. Глубокий графит с зелёным undertone,
// изумруд + золото. Luxury / деньги / статус. Mesh-фон оживляет blur.
export const darkColors: ColorScheme = {
  // Графитово-зелёный почти-чёрный (OLED-friendly), тёплее чем серый
  background: '#0A0F0C',
  // Заметная ступень — карточки читаются как elevated
  surface: '#172019',
  surfaceGlass: 'rgba(23,32,25,0.86)',
  surfaceElevated: '#1F2B23',

  // Primary — яркий изумруд (viewer-friendly на тёмном)
  primary: '#2EE6A6',
  primarySoft: 'rgba(46,230,166,0.16)',
  // Accent — тёплое золото
  accent: '#F5C147',
  accentSoft: 'rgba(245,193,71,0.18)',

  // Off-white с лёгким зелёным undertone (меньше eye-strain)
  text: '#F0F5F2',
  textSecondary: '#9CB0A4',
  textTertiary: '#67786E',

  // Borders с изумрудным undertone — единство гаммы
  border: 'rgba(46,230,166,0.16)',
  borderLight: 'rgba(46,230,166,0.08)',

  success: '#2EE6A6',
  successSoft: 'rgba(46,230,166,0.16)',
  warning: '#F5C147',
  warningSoft: 'rgba(245,193,71,0.18)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.18)',

  white: '#FFFFFF',
  black: '#000000',

  // Mesh — изумруд / золото / тёмно-зелёный. Эти пятна blur размывает
  // за карточками → живой стеклянный фон. Насыщеннее чтобы стекло играло.
  mesh: ['rgba(46,230,166,0.32)', 'rgba(245,193,71,0.22)', 'rgba(4,120,87,0.34)'],
};
