import React, { useRef, useEffect } from 'react';
import { 
  Animated, 
  Pressable, 
  ViewStyle, 
  TextStyle, 
  PressableProps,
  View,
  Text
} from 'react-native';
import { theme } from '../theme/colors';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'scale' | 'opacity' | 'bounce' | 'pulse';
  disabled?: boolean;
}

export function AnimatedPressable({ 
  children, 
  style, 
  animationType = 'scale',
  disabled = false,
  onPress,
  ...props 
}: AnimatedPressableProps) {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animationType === 'pulse') {
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.current.start();
    }

    return () => {
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
      }
    };
  }, [animationType]);

  const handlePressIn = () => {
    if (disabled) return;
    
    const toValue = animationType === 'scale' ? 0.95 : animationType === 'opacity' ? 0.7 : 1.1;
    
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'scale':
      case 'bounce':
      case 'pulse':
        return { transform: [{ scale: animatedValue }] };
      case 'opacity':
        return { opacity: animatedValue };
      default:
        return {};
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, getAnimatedStyle(), disabled && { opacity: 0.5 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

interface SmartButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function SmartButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  ...props
}: SmartButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size variations
    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 16 },
      medium: { paddingVertical: 12, paddingHorizontal: 20 },
      large: { paddingVertical: 16, paddingHorizontal: 24 },
    };

    // Color variations
    const colorStyles = {
      primary: { backgroundColor: theme.primary },
      secondary: { backgroundColor: theme.muted, borderWidth: 1, borderColor: theme.primary },
      success: { backgroundColor: theme.success },
      warning: { backgroundColor: theme.warn },
      danger: { backgroundColor: '#EF4444' },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...colorStyles[variant],
      ...(fullWidth && { width: '100%' }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    };

    const colorStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: theme.primary },
      success: { color: '#FFFFFF' },
      warning: { color: '#FFFFFF' },
      danger: { color: '#FFFFFF' },
    };

    return {
      ...baseStyle,
      ...colorStyles[variant],
    };
  };

  return (
    <AnimatedPressable
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      animationType="scale"
    >
      {loading ? (
        <Text style={getTextStyle()}>Loading...</Text>
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: ViewStyle;
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  style 
}: SwipeableCardProps) {
  const panX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(panX, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const animateSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -300 : 300;
    
    Animated.parallel([
      Animated.timing(panX, { toValue, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
      resetPosition();
    });
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX: panX }],
          opacity,
        },
        style,
      ]}
    >
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
        {children}
      </View>
    </Animated.View>
  );
}

interface PulseIconProps {
  name: string;
  size?: number;
  color?: string;
  pulseColor?: string;
}

export function PulseIcon({ 
  name, 
  size = 24, 
  color = theme.primary, 
  pulseColor = theme.primary 
}: PulseIconProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: (size * 1.5) / 2,
          backgroundColor: pulseColor,
          opacity: 0.3,
          transform: [{ scale: pulseAnim }],
        }}
      />
      <Text style={{ fontSize: size, color }}>⚡</Text>
    </View>
  );
}