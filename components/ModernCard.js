import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../utils';

export const ModernCard = ({ 
  children, 
  variant = 'default', 
  padding = 'md',
  style,
  ...props 
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    if (variant === 'elevated') {
      baseStyle.push(styles.elevated);
    } else if (variant === 'outlined') {
      baseStyle.push(styles.outlined);
    } else if (variant === 'flat') {
      baseStyle.push(styles.flat);
    }
    
    if (padding === 'sm') {
      baseStyle.push(styles.paddingSm);
    } else if (padding === 'lg') {
      baseStyle.push(styles.paddingLg);
    } else if (padding === 'xl') {
      baseStyle.push(styles.paddingXl);
    } else {
      baseStyle.push(styles.paddingMd);
    }
    
    return baseStyle;
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  
  // Variants
  elevated: {
    ...SHADOWS.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.sm,
  },
  flat: {
    backgroundColor: COLORS.background.secondary,
  },
  
  // Padding variants
  paddingSm: {
    padding: SPACING.md,
  },
  paddingMd: {
    padding: SPACING.lg,
  },
  paddingLg: {
    padding: SPACING.xl,
  },
  paddingXl: {
    padding: SPACING['2xl'],
  },
});

export const PostCard = ({ 
  children, 
  style,
  ...props 
}) => {
  return (
    <ModernCard 
      variant="elevated" 
      padding="lg"
      style={[styles.postCard, style]}
      {...props}
    >
      {children}
    </ModernCard>
  );
};

const postCardStyles = StyleSheet.create({
  postCard: {
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
});

export const ProfileCard = ({ 
  children, 
  style,
  ...props 
}) => {
  return (
    <ModernCard 
      variant="outlined" 
      padding="xl"
      style={[styles.profileCard, style]}
      {...props}
    >
      {children}
    </ModernCard>
  );
};

const profileCardStyles = StyleSheet.create({
  profileCard: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
}); 