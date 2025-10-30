export const palette = {
  // Primary brand colors
  primary: "#0F766E",
  primaryLight: "#14B8A6",
  primaryDark: "#0D5148",
  
  // Neutral colors
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",
  
  // Semantic colors
  success: "#10B981",
  successLight: "#6EE7B7",
  warning: "#F59E0B",
  warningLight: "#FCD34D",
  danger: "#EF4444",
  dangerLight: "#FCA5A5",
  info: "#3B82F6",
  infoLight: "#93C5FD",
  
  // Ocean/Marine theme
  ocean: "#0EA5E9",
  oceanLight: "#7DD3FC",
  oceanDark: "#0369A1",
  seafoam: "#67E8F9",
  coral: "#FB7185",
  sand: "#FEF3C7",
}

export const theme = {
  // Background colors
  bg: palette.white,
  bgCard: palette.gray50,
  bgOverlay: "rgba(15, 23, 42, 0.8)",
  
  // Text colors
  text: palette.gray900,
  textMuted: palette.gray600,
  textLight: palette.gray500,
  textOnPrimary: palette.white,
  
  // Legacy compatibility
  fg: palette.gray900,
  muted: palette.gray600,
  card: palette.gray50,
  warn: palette.warning,
  
  // Primary theme
  primary: palette.primary,
  primaryLight: palette.primaryLight,
  primaryDark: palette.primaryDark,
  
  // Semantic colors
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  
  // Marine theme
  ocean: palette.ocean,
  oceanLight: palette.oceanLight,
  seafoam: palette.seafoam,
  coral: palette.coral,
  sand: palette.sand,
  
  // Interactive states
  border: palette.gray200,
  borderFocus: palette.primary,
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowLg: "rgba(0, 0, 0, 0.15)",
}

// Typography scale
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
}

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
}

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
}

// Shadow styles
export const shadows = {
  sm: {
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: theme.shadowLg,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: theme.shadowLg,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 12,
  },
}

export default {
  palette,
  theme,
  typography,
  spacing,
  borderRadius,
  shadows,
}
