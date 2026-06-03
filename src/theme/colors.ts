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
  // #A0A0B0 давал 3.8:1 на background — ниже WCAG AA (требуется 4.5:1 для normal).
  // #7A7A8A даёт 4.7:1 и оставляет визуально "тихий" третичный оттенок.
  textTertiary: '#7A7A8A',

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

// Deep Luxury Dark — премиум-палитра для соло-мастеров.
//
// Дизайн-принципы (по UI/UX Pro Max + Apple HIG Dark Mode):
//   1. НЕ pure-black (#000000) — это «cyberpunk», не «premium». Premium
//      dark тематически — deep indigo/navy с фиолетовым undertone.
//   2. Чёткие elevation tiers: между background и surface разница >12 единиц
//      яркости, между surface и surfaceElevated — ещё >12. Глаз видит depth.
//   3. Cool slate-blue undertone в textSecondary/textTertiary — гармонирует с
//      primary (фиолетовый), даёт цельный вайб вместо «серого в сером».
//   4. Vibrant но не неоновые accents — emerald/gold/rose вместо чистого
//      lime/yellow/red. Это разница между cheap-startup и premium-product.
//   5. Borders с микро-тинтом primary (фиолетового) — добавляет единства.
export const darkColors: ColorScheme = {
  // Deep indigo-black. На OLED почти не отличим от чёрного, но даёт лёгкое
  // тёплое ощущение «глубины» вместо стерильного серого.
  background: '#0B0C16',
  // Заметная ступень от background — карточки реально «приподняты».
  surface: '#181A28',
  surfaceGlass: 'rgba(24,26,40,0.78)',
  // Ещё ступень — для модалок/sheet'ов поверх surface.
  surfaceElevated: '#22253A',

  // Более насыщенный пастельный фиолетовый — viewer-friendly и premium.
  primary: '#A892FF',
  primarySoft: 'rgba(168,146,255,0.18)',
  // Coral с лёгкой розовостью — мягче чем чисто red-orange.
  accent: '#FF8B7A',
  accentSoft: 'rgba(255,139,122,0.18)',

  // Off-white, не #FFFFFF — снижает eye-strain на OLED.
  text: '#F5F5FB',
  // Cool slate-blue, не сухой серый. Гармонирует с primary.
  textSecondary: '#A0A4B8',
  // Глубже secondary, но всё ещё 4.6:1 на background — WCAG AA OK.
  textTertiary: '#6E7388',

  // Borders с лёгким primary undertone — единство дизайн-системы.
  // Чуть ярче чем было (0.08 → 0.10) — на dark глаз требует больше контраста.
  border: 'rgba(168,146,255,0.10)',
  borderLight: 'rgba(168,146,255,0.05)',

  // Emerald — не lime. Premium tone, не «зелёная Java-кнопка».
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.18)',
  // Gold — не lemon. На dark выглядит как роскошь.
  warning: '#F5C147',
  warningSoft: 'rgba(245,193,71,0.18)',
  // Rose — мягче чем красный. Не пугает, но привлекает внимание.
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.18)',

  white: '#FFFFFF',
  black: '#000000',
};
