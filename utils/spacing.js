import { Platform } from 'react-native';

// Modern Spacing System
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Modern Border Radius System
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Modern Shadow System
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  lg: {
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 16,
  },
  xl: {
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 24,
  },
};

// Modern Layout Utilities
export const LAYOUT = {
  // Container padding
  containerPadding: SPACING.lg,
  
  // Card padding
  cardPadding: SPACING.lg,
  
  // Button padding
  buttonPadding: {
    sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
    lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  },
  
  // Input padding
  inputPadding: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  
  // Section spacing
  sectionSpacing: SPACING['3xl'],
  
  // Item spacing
  itemSpacing: SPACING.md,
};

// Modern Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Modern Z-Index System
export const Z_INDEX = {
  base: 0,
  card: 1,
  dropdown: 10,
  modal: 100,
  tooltip: 200,
  toast: 300,
  overlay: 400,
}; 