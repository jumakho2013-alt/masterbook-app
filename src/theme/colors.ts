// Atelier (редакционная роскошь).
// Light = «Warm Ivory», Dark = «Noir» (баклажаново-чёрный + золото).
// Значения 1:1 из хэндоффа Atelier; сохранены наши доп-поля info/infoSoft/mesh
// (их нет в хэндоффе, но код их использует) и добавлены gold/goldSoft.
export interface ColorScheme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceGlass: string;
  surfaceElevated: string;

  // Brand
  primary: string;        // плам — основной акцент, кнопки, активные табы
  primarySoft: string;
  accent: string;         // = gold (совместимость со старым кодом)
  accentSoft: string;

  // Atelier — золотой металлик-акцент
  gold: string;
  goldSoft: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Borders (хайрлайны)
  border: string;
  borderLight: string;

  // Semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  // Информационный/«запланировано» — отдельный от brand-плама, чтобы статусы
  // (scheduled vs completed) не сливались. Atelier его не задаёт — подобран в тон.
  info: string;
  infoSoft: string;

  // Absolute
  white: string;
  black: string;

  // Mesh — 3 цвета фоновых «пятен» под AppBackground. В Atelier они очень мягкие
  // (плоский ivory важнее живого стекла) — едва читаемые gold/plum шёпоты.
  mesh: [string, string, string];
}

// ── Atelier Light — «Warm Ivory» ───────────────────────
export const lightColors: ColorScheme = {
  background: '#F6F2EB',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.86)',
  surfaceElevated: '#F1ECE4',

  primary: '#6B4E71',
  primarySoft: '#EFE8F0',
  accent: '#B08D57',
  accentSoft: '#EFE6D6',

  gold: '#B08D57',
  goldSoft: '#EFE6D6',

  text: '#241E29',
  textSecondary: '#6E6576',
  textTertiary: '#A89FB0',

  border: 'rgba(36,30,41,0.10)',
  borderLight: 'rgba(36,30,41,0.05)',

  success: '#3C7A5E',
  successSoft: 'rgba(60,122,94,0.10)',
  warning: '#B08D57',
  warningSoft: 'rgba(176,141,87,0.14)',
  danger: '#B3403F',
  dangerSoft: 'rgba(179,64,63,0.10)',
  info: '#4A6B8A',
  infoSoft: 'rgba(74,107,138,0.12)',

  white: '#FFFFFF',
  black: '#000000',

  mesh: ['rgba(176,141,87,0.10)', 'rgba(107,78,113,0.08)', 'rgba(176,141,87,0.05)'],
};

// ── Atelier Dark — «Noir» ──────────────────────────────
export const darkColors: ColorScheme = {
  background: '#16121A',
  surface: '#211B26',
  surfaceGlass: 'rgba(33,27,38,0.86)',
  surfaceElevated: '#2A2230',

  primary: '#CBAED2',
  primarySoft: 'rgba(203,174,210,0.16)',
  accent: '#DBBA7C',
  accentSoft: 'rgba(219,186,124,0.18)',

  gold: '#DBBA7C',
  goldSoft: 'rgba(219,186,124,0.18)',

  text: '#F4EFE9',
  textSecondary: '#A99FAB',
  textTertiary: '#736A77',

  border: 'rgba(244,239,233,0.12)',
  borderLight: 'rgba(244,239,233,0.06)',

  success: '#82C9A6',
  successSoft: 'rgba(130,201,166,0.16)',
  warning: '#DBBA7C',
  warningSoft: 'rgba(219,186,124,0.18)',
  danger: '#E2796F',
  dangerSoft: 'rgba(226,121,111,0.16)',
  info: '#8FB3D9',
  infoSoft: 'rgba(143,179,217,0.16)',

  white: '#FFFFFF',
  black: '#000000',

  mesh: ['rgba(219,186,124,0.14)', 'rgba(203,174,210,0.12)', 'rgba(176,141,87,0.10)'],
};
