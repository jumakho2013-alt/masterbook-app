// Atelier (редакционная роскошь).
// Серифный Cormorant Garamond — заголовки экранов и ВСЕ ЦИФРЫ (деньги, время,
// статистика). Manrope — интерфейсный текст. Шрифты грузятся в app/_layout.tsx.
//
// Ключи h1/h2/h3/body/bodyBold/caption/small сохранены (используются по всему
// коду, 100+ мест); добавлены серифные display / numberHero/Lg/Md и микро-label.
export const typography = {
  // ── Серифный дисплей (Cormorant) — заголовки экранов ──
  display: {
    fontSize: 40,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 29,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 19,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // ── Серифные ЦИФРЫ — деньги, время, статистика ────────
  numberHero: {
    fontSize: 56,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 56,
    letterSpacing: -1.5,
  },
  numberLg: {
    fontSize: 34,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  numberMd: {
    fontSize: 19,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // ── Интерфейсный текст (Manrope) ──────────────────────
  body: {
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12.5,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  small: {
    // 12pt — комфортный минимум для low-vision на компактных iPhone.
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  // Микро-лейбл: UPPERCASE + tracking — фирменная деталь Atelier
  // («СЕГОДНЯ», «ЧИСТАЯ ПРИБЫЛЬ · ИЮНЬ», даты над заголовками).
  label: {
    fontSize: 10.5,
    fontFamily: 'Manrope_700Bold',
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
