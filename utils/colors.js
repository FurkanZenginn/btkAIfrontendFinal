// Modern Color Palette
export const COLORS = {
  // Primary Colors (Ana Renkler)
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Neutral Colors (Nötr Renkler)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Success Colors (Başarı Renkleri)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning Colors (Uyarı Renkleri)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Colors (Hata Renkleri)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Background Colors (Arka Plan Renkleri)
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
  },

  // Text Colors (Metin Renkleri)
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },

  // Border Colors (Kenarlık Renkleri)
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
  },

  // Shadow Colors (Gölge Renkleri)
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
  },
};

// Gradient Colors
export const GRADIENTS = {
  primary: ['#8b5cf6', '#a855f7', '#c084fc'],
  secondary: ['#f1f5f9', '#e2e8f0'],
  success: ['#22c55e', '#16a34a'],
  warning: ['#f59e0b', '#d97706'],
  error: ['#ef4444', '#dc2626'],
  dark: ['#1e293b', '#0f172a'],
};

// Modern Color Utilities
export const getColor = (colorName, shade = 500) => {
  const colorPath = colorName.split('.');
  let color = COLORS;
  
  for (const path of colorPath) {
    color = color[path];
  }
  
  return color[shade] || color;
}; 