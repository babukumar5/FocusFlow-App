import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { lightColors, typography, fontFamily } from '../constants';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,
    onPrimary: lightColors.onPrimary,
    primaryContainer: lightColors.primaryContainer,
    onPrimaryContainer: lightColors.onPrimaryContainer,
    secondary: lightColors.secondary,
    onSecondary: lightColors.onSecondary,
    secondaryContainer: lightColors.secondaryContainer,
    onSecondaryContainer: lightColors.onSecondaryContainer,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    error: lightColors.error,
    errorContainer: lightColors.errorContainer,
    onSurface: lightColors.textPrimary,
    onSurfaceVariant: lightColors.textSecondary,
    outline: lightColors.border,
    outlineVariant: lightColors.borderLight,
    elevation: {
      level0: 'transparent',
      level1: lightColors.surfaceElevated,
      level2: lightColors.surfaceElevated,
      level3: lightColors.surfaceElevated,
      level4: lightColors.surfaceElevated,
      level5: lightColors.surfaceElevated,
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
