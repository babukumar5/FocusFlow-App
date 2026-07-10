/**
 * FocusFlow Design Tokens — Typography
 *
 * Type scale using Inter font family. All text styles should
 * reference these presets for visual consistency.
 */
import { TextStyle, Platform } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** System font fallback for use before custom fonts load */
export const systemFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

type TypographyPreset = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight'
>;

export const typography: Record<string, TypographyPreset> = {
  /** 28px — Screen titles */
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  /** 24px — Section headers */
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  /** 20px — Card titles */
  displaySmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  /** 18px — Subsection headers */
  headlineLarge: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
  },

  /** 16px — Emphasized body text */
  headlineMedium: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },

  /** 14px — Small headings */
  headlineSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  /** 16px — Primary body text */
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },

  /** 14px — Standard body text */
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  /** 12px — Secondary body text */
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  /** 14px — Button labels */
  labelLarge: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  /** 12px — Small labels */
  labelMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  /** 11px — Captions / Overlines */
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  /** 56px — Timer display */
  timerDisplay: {
    fontFamily: fontFamily.bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
  },

  /** 40px — Large stat numbers */
  statLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  /** 28px — Medium stat numbers */
  statMedium: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
} as const;
