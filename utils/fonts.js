import { Platform } from 'react-native';

// Modern Font Sistemi
export const FONTS = {
  // Ana başlıklar için
  heading: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  
  // Alt başlıklar için
  subheading: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  
  // Normal metin için
  body: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  
  // Butonlar için
  button: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  
  // Caption'lar için
  caption: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  
  // Sayılar için
  numeric: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
};

// Font Weight Sistemi
export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

// Font Size Sistemi
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

// Hazır font stilleri
export const FONT_STYLES = {
  // Başlık stilleri
  h1: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.bold,
  },
  h2: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.semibold,
  },
  h3: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.semibold,
  },
  
  // Metin stilleri
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
  },
  bodyBold: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  bodyMedium: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Caption stilleri
  caption: {
    fontFamily: FONTS.caption,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
  },
  captionBold: {
    fontFamily: FONTS.caption,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  captionMedium: {
    fontFamily: FONTS.caption,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Buton stilleri
  button: {
    fontFamily: FONTS.button,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  
  // Sayı stilleri
  numeric: {
    fontFamily: FONTS.numeric,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
  },
}; 