/**
 * FocusFlow Design Tokens — Spacing
 *
 * 4px base grid system with named constants.
 * Every spacing value in the app should come from here.
 */

export const spacing = {
  /** 2px — Hairline spacing */
  xxs: 2,
  /** 4px — Tight spacing */
  xs: 4,
  /** 8px — Small spacing */
  sm: 8,
  /** 12px — Between small and medium */
  md: 12,
  /** 16px — Standard spacing */
  lg: 16,
  /** 20px — Comfortable spacing */
  xl: 20,
  /** 24px — Section spacing */
  xxl: 24,
  /** 32px — Large section spacing */
  xxxl: 32,
  /** 40px — Major section spacing */
  huge: 40,
  /** 48px — Extra large */
  massive: 48,
} as const;

export const borderRadius = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 9999px — Fully rounded / pill */
  full: 9999,
} as const;

export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
} as const;
