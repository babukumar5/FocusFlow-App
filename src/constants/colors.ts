/**
 * FocusFlow Design Tokens — Colors
 *
 * Premium HSL-based palette with three theme variants.
 * Curated to feel warm, focused, and professional —
 * inspired by Forest, Todoist, and Apple's design language.
 */

export const palette = {
  // Primary — Deep teal/green (focus & productivity)
  primary: {
    50: '#E8F5F0',
    100: '#C6E7DB',
    200: '#A0D8C4',
    300: '#7AC9AD',
    400: '#5DBE9C',
    500: '#40B38B', // Main primary
    600: '#38A47E',
    700: '#2E916D',
    800: '#257F5E',
    900: '#155F42',
  },

  // Secondary — Warm amber (energy & motivation)
  secondary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107', // Main secondary
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Accent — Soft purple (creativity & reflection)
  accent: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0',
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#EF5350',
  info: '#42A5F5',

  // Neutral grays
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#121212',
    1000: '#000000',
  },
} as const;

/** Light theme color tokens */
export const lightColors = {
  // Surfaces
  background: '#F8FAF9',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F2',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1C1B',
  textSecondary: '#49514E',
  textTertiary: '#79807D',
  textDisabled: '#A8ADA9',
  textInverse: '#FFFFFF',

  // Primary
  primary: palette.primary[500],
  primaryContainer: palette.primary[50],
  onPrimary: '#FFFFFF',
  onPrimaryContainer: palette.primary[900],

  // Secondary
  secondary: palette.secondary[600],
  secondaryContainer: palette.secondary[50],
  onSecondary: '#FFFFFF',
  onSecondaryContainer: palette.secondary[900],

  // Accent
  accent: palette.accent[500],
  accentContainer: palette.accent[50],

  // Semantic
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  successContainer: '#E8F5E9',
  warningContainer: '#FFF3E0',
  errorContainer: '#FFEBEE',

  // Borders & Dividers
  border: '#E2E6E4',
  borderLight: '#F0F2F1',
  divider: '#EEF0EF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.3)',

  // Timer mode colors
  timerFocus: palette.primary[500],
  timerShortBreak: palette.success,
  timerLongBreak: palette.secondary[600],

  // Card
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#F0F2F1',
  tabBarActive: palette.primary[500],
  tabBarInactive: palette.neutral[500],

  // Status bar
  statusBar: 'dark' as 'dark' | 'light' | 'auto',
};

/** Dark theme color tokens */
export const darkColors = {
  // Surfaces
  background: '#111715',
  surface: '#1A201E',
  surfaceVariant: '#222A27',
  surfaceElevated: '#253330',

  // Text
  textPrimary: '#E4E8E6',
  textSecondary: '#B0B8B4',
  textTertiary: '#7D857F',
  textDisabled: '#505854',
  textInverse: '#1A1C1B',

  // Primary
  primary: palette.primary[400],
  primaryContainer: '#1A3D2E',
  onPrimary: '#003822',
  onPrimaryContainer: palette.primary[200],

  // Secondary
  secondary: palette.secondary[400],
  secondaryContainer: '#3D3000',
  onSecondary: '#3E2D00',
  onSecondaryContainer: palette.secondary[200],

  // Accent
  accent: palette.accent[300],
  accentContainer: '#3D1A47',

  // Semantic
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',
  successContainer: '#1B3D1E',
  warningContainer: '#3D2E00',
  errorContainer: '#3D1A1A',

  // Borders & Dividers
  border: '#2E3633',
  borderLight: '#232B28',
  divider: '#2A322F',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.5)',

  // Timer mode colors
  timerFocus: palette.primary[400],
  timerShortBreak: '#66BB6A',
  timerLongBreak: palette.secondary[400],

  // Card
  card: '#1A201E',
  cardElevated: '#222A27',

  // Tab bar
  tabBar: '#141A18',
  tabBarBorder: '#1E2624',
  tabBarActive: palette.primary[400],
  tabBarInactive: '#6B736F',

  // Status bar
  statusBar: 'light' as 'dark' | 'light' | 'auto',
};


export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark';
