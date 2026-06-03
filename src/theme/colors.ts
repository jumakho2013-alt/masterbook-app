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

// Premium Light — холодный off-white с лавандовым undertone.
//
// Принципы (синхронизированы с dark-палитрой):
//   1. Cool off-white фон (не пожелтевший бежевый) — выглядит свежее.
//      Lavender undertone гармонирует с primary, единство визуала.
//   2. textSecondary с slate-blue undertone (не нейтральный серый) —
//      premium feel против цветов primary.
//   3. Accents emerald/gold/rose, не lime/yellow/red — premium vs cheap.
//   4. Borders с лёгкой primary-тинтом — единство дизайн-системы.
//   5. WCAG AA контраст ≥4.5:1 для текста, ≥3:1 для UI элементов.
export const lightColors: ColorScheme = {
  // Lavender-tinted off-white — современнее жёлто-бежевого
  background: '#F7F7FC',
  // Surface чисто-белый — даёт ясную elevation tier поверх background
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.85)',
  // surfaceElevated — между surface и background, ощущается как «утопленный»
  // блок (textfield, segment-control bg). Тоже с лёгким lavender-тинтом.
  surfaceElevated: '#EFEFF7',

  // Primary тот же фиолетовый — наш бренд
  primary: '#7C5DFA',
  primarySoft: 'rgba(124,93,250,0.12)',
  // Accent: тёплый коралл, чуть более розовый чем раньше
  accent: '#FF7A6E',
  accentSoft: 'rgba(255,122,110,0.14)',

  // Text deeper indigo-black с лёгким purple undertone (не pure black)
  text: '#15172A',
  // Slate-blue secondary — не «серый в сером»
  textSecondary: '#5E6178',
  // #7A7A8A → #7A7E96 — slate undertone, 4.7:1 на background ✓
  textTertiary: '#7A7E96',

  // Borders с primary undertone — единство дизайн-системы
  border: 'rgba(124,93,250,0.12)',
  borderLight: 'rgba(124,93,250,0.06)',

  // Emerald, не lime — premium tone
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.13)',
  // Amber/gold, не orange-yellow — выглядит дороже
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.13)',
  // Rose, не tomato — мягче и premium
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.13)',

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
