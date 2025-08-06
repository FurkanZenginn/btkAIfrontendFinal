import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS, FONT_STYLES } from '../utils';

export const ModernButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primary);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondary);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outline);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghost);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryText);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineText);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghostText);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? COLORS.text.inverse : COLORS.primary[500]} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} 
              color={variant === 'primary' ? COLORS.text.inverse : COLORS.primary[500]} 
              style={styles.leftIcon}
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} 
              color={variant === 'primary' ? COLORS.text.inverse : COLORS.primary[500]} 
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        style={[getButtonStyle(), style]} 
        onPress={onPress} 
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[getButtonStyle(), style]} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.sm,
  },
  
  // Size variants
  sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  lg: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
  },
  
  // Style variants
  primary: {
    backgroundColor: COLORS.primary[500],
  },
  secondary: {
    backgroundColor: COLORS.neutral[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Disabled state
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    ...FONT_STYLES.button,
    textAlign: 'center',
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  
  // Text color variants
  primaryText: {
    color: COLORS.text.inverse,
  },
  secondaryText: {
    color: COLORS.text.primary,
  },
  outlineText: {
    color: COLORS.primary[500],
  },
  ghostText: {
    color: COLORS.primary[500],
  },
  disabledText: {
    color: COLORS.text.tertiary,
  },
  
  // Icon styles
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  
  // Gradient
  gradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export const FloatingActionButton = ({ 
  icon, 
  onPress, 
  size = 'md',
  style,
  ...props 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 48;
      case 'lg': return 64;
      default: return 56;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.fab,
        { width: getSize(), height: getSize(), borderRadius: getSize() / 2 },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fabGradient, { borderRadius: getSize() / 2 }]}
      >
        <Ionicons 
          name={icon} 
          size={size === 'sm' ? 20 : size === 'lg' ? 28 : 24} 
          color={COLORS.text.inverse} 
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const fabStyles = StyleSheet.create({
  fab: {
    ...SHADOWS.lg,
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    zIndex: 1000,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 