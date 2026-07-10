import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { darkColors, typography, fontFamily } from '../constants';

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: darkColors.primary,
    onPrimary: darkColors.onPrimary,
    primaryContainer: darkColors.primaryContainer,
    onPrimaryContainer: darkColors.onPrimaryContainer,
    secondary: darkColors.secondary,
    onSecondary: darkColors.onSecondary,
    secondaryContainer: darkColors.secondaryContainer,
    onSecondaryContainer: darkColors.onSecondaryContainer,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    error: darkColors.error,
    errorContainer: darkColors.errorContainer,
    onSurface: darkColors.textPrimary,
    onSurfaceVariant: darkColors.textSecondary,
    outline: darkColors.border,
    outlineVariant: darkColors.borderLight,
    elevation: {
      level0: 'transparent',
      level1: darkColors.surfaceElevated,
      level2: darkColors.surfaceElevated,
      level3: darkColors.surfaceElevated,
      level4: darkColors.surfaceElevated,
      level5: darkColors.surfaceElevated,
    }
  },
  fonts: {
    ...DefaultTheme.fonts,
    default: {
      fontFamily: fontFamily.regular,
      fontWeight: '400' as const,
    },
    displayLarge: { ...typography.displayLarge, fontWeight: '700' as const },
    displayMedium: { ...typography.displayMedium, fontWeight: '700' as const },
    displaySmall: { ...typography.displaySmall, fontWeight: '600' as const },
    headlineLarge: { ...typography.headlineLarge, fontWeight: '600' as const },
    headlineMedium: { ...typography.headlineMedium, fontWeight: '600' as const },
    headlineSmall: { ...typography.headlineSmall, fontWeight: '600' as const },
    bodyLarge: { ...typography.bodyLarge, fontWeight: '400' as const },
    bodyMedium: { ...typography.bodyMedium, fontWeight: '400' as const },
    bodySmall: { ...typography.bodySmall, fontWeight: '400' as const },
    labelLarge: { ...typography.labelLarge, fontWeight: '500' as const },
    labelMedium: { ...typography.labelMedium, fontWeight: '500' as const },
    labelSmall: { ...typography.labelSmall, fontWeight: '500' as const },
  },
};
