import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { amoledColors, typography, fontFamily } from '../constants';

export const amoledTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: amoledColors.primary,
    onPrimary: amoledColors.onPrimary,
    primaryContainer: amoledColors.primaryContainer,
    onPrimaryContainer: amoledColors.onPrimaryContainer,
    secondary: amoledColors.secondary,
    onSecondary: amoledColors.onSecondary,
    secondaryContainer: amoledColors.secondaryContainer,
    onSecondaryContainer: amoledColors.onSecondaryContainer,
    background: amoledColors.background,
    surface: amoledColors.surface,
    surfaceVariant: amoledColors.surfaceVariant,
    error: amoledColors.error,
    errorContainer: amoledColors.errorContainer,
    onSurface: amoledColors.textPrimary,
    onSurfaceVariant: amoledColors.textSecondary,
    outline: amoledColors.border,
    outlineVariant: amoledColors.borderLight,
    elevation: {
      level0: 'transparent',
      level1: amoledColors.surfaceElevated,
      level2: amoledColors.surfaceElevated,
      level3: amoledColors.surfaceElevated,
      level4: amoledColors.surfaceElevated,
      level5: amoledColors.surfaceElevated,
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
