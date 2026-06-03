import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { makeShadows, type Shadows } from './shadows';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: Shadows;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themeSetting = useSettingsStore((s) => s.theme);

  const isDark =
    themeSetting === 'system'
      ? systemScheme === 'dark'
      : themeSetting === 'dark';

  const theme = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      borderRadius,
      // Theme-aware shadows: чёрный с высоким opacity на dark, мягкий
      // тёмный с низким opacity на light. Иначе тени невидимы на dark.
      shadows: makeShadows(isDark),
      isDark,
    }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
