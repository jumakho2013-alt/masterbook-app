export const typography = {
  h1: {
    fontSize: 34,
    fontFamily: 'Manrope_700Bold',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontFamily: 'Manrope_700Bold',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Manrope_600SemiBold',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  small: {
    // 12pt — комфортный минимум для low-vision. iOS HIG позволяет 11pt
    // для footnote, но 12pt сильно лучше читается на компактных iPhone SE.
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
