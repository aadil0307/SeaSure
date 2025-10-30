import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ViewStyle,
  TextStyle,
  Switch,
  ActivityIndicator,
  TextInput
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { theme } from "../theme/colors";

const { width } = Dimensions.get('window');

// Enhanced Card with gradient and shadow
export function EnhancedCard(props: { 
  children: React.ReactNode; 
  style?: ViewStyle;
  gradient?: boolean;
  elevation?: number;
}) {
  const { gradient = false, elevation = 3 } = props;
  
  if (gradient) {
    return (
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={[styles.enhancedCard, { elevation }, props.style]}
      >
        {props.children}
      </LinearGradient>
    );
  }
  
  return (
    <View style={[styles.enhancedCard, { elevation }, props.style]}>
      {props.children}
    </View>
  );
}

// Modern Button with haptic feedback and loading states
export function ModernButton(props: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const { 
    variant = "primary", 
    size = "medium", 
    loading = false, 
    disabled = false,
    icon
  } = props;
  
  const [scale] = useState(new Animated.Value(1));
  const [opacity] = useState(new Animated.Value(1));

  const animatePress = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const animateRelease = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const buttonStyle = [
    styles.modernButton,
    modernButtonVariants[variant],
    modernButtonSizes[size],
    (disabled || loading) && styles.modernButtonDisabled,
    props.style
  ];

  const textStyle = [
    styles.modernButtonText,
    modernButtonTextVariants[variant],
    modernButtonTextSizes[size],
    props.textStyle
  ];

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={props.onPress}
        onPressIn={animatePress}
        onPressOut={animateRelease}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'ghost' ? theme.primary : '#ffffff'} 
            size="small" 
          />
        ) : (
          <View style={styles.buttonContent}>
            {icon && (
              <Ionicons 
                name={icon as any} 
                size={20} 
                color={variant === 'ghost' ? theme.primary : '#ffffff'}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={textStyle}>{props.title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Modern Input Field with floating labels
export function ModernInput(props: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  icon?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(new Animated.Value(props.value ? 1 : 0));

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || props.value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, props.value]);

  return (
    <View style={[styles.inputContainer, props.style]}>
      {props.label && (
        <Animated.Text
          style={[
            styles.inputLabel,
            {
              top: labelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
              fontSize: labelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: props.error ? theme.danger : isFocused ? theme.primary : '#64748B',
            },
          ]}
        >
          {props.label}
        </Animated.Text>
      )}
      
      <View style={styles.inputWrapper}>
        {props.icon && (
          <Ionicons 
            name={props.icon as any} 
            size={20} 
            color={props.error ? theme.danger : isFocused ? theme.primary : '#94A3B8'}
            style={styles.inputIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.modernInput,
            props.icon && { paddingLeft: 40 },
            props.error && styles.inputError,
            isFocused && styles.inputFocused,
            props.multiline && { height: 80, textAlignVertical: 'top' }
          ]}
          placeholder={isFocused ? '' : props.placeholder}
          placeholderTextColor="#94A3B8"
          value={props.value}
          onChangeText={props.onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={props.secureTextEntry}
          multiline={props.multiline}
        />
      </View>
      
      {props.error && (
        <Text style={styles.inputErrorText}>{props.error}</Text>
      )}
    </View>
  );
}

// Professional Badge with animations
export function ProfessionalBadge(props: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "premium";
  size?: "small" | "medium" | "large";
  animated?: boolean;
  pulse?: boolean;
}) {
  const { variant = "default", size = "medium", animated = false, pulse = false } = props;
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (pulse) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [pulse]);

  const badgeStyle = [
    styles.professionalBadge,
    professionalBadgeVariants[variant],
    professionalBadgeSizes[size],
  ];

  const textStyle = [
    styles.professionalBadgeText,
    professionalBadgeTextVariants[variant],
    professionalBadgeTextSizes[size],
  ];

  const BadgeWrapper = pulse ? Animated.View : View;
  const wrapperProps = pulse ? { style: { transform: [{ scale: pulseAnimation }] } } : {};

  return (
    <BadgeWrapper {...wrapperProps}>
      <View style={badgeStyle}>
        <Text style={textStyle}>{props.label}</Text>
      </View>
    </BadgeWrapper>
  );
}

// Modern Toggle Switch
export function ModernToggle(props: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleContent}>
        {props.label && (
          <Text style={styles.toggleLabel}>{props.label}</Text>
        )}
        {props.description && (
          <Text style={styles.toggleDescription}>{props.description}</Text>
        )}
      </View>
      
      <Switch
        value={props.value}
        onValueChange={props.onValueChange}
        disabled={props.disabled}
        trackColor={{ false: '#E2E8F0', true: theme.primary + '40' }}
        thumbColor={props.value ? theme.primary : '#ffffff'}
        ios_backgroundColor="#E2E8F0"
        style={styles.toggle}
      />
    </View>
  );
}

// Professional Slider
export function ProfessionalSlider(props: {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label?: string;
  unit?: string;
  showValue?: boolean;
}) {
  const { showValue = true } = props;
  
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        {props.label && (
          <Text style={styles.sliderLabel}>{props.label}</Text>
        )}
        {showValue && (
          <Text style={styles.sliderValue}>
            {props.value}{props.unit || ''}
          </Text>
        )}
      </View>
      
      <Slider
        style={styles.slider}
        value={props.value}
        onValueChange={props.onValueChange}
        minimumValue={props.minimumValue}
        maximumValue={props.maximumValue}
        step={props.step}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor="#E2E8F0"
      />
    </View>
  );
}

// Loading Overlay
export function LoadingOverlay(props: {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: props.visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [props.visible]);

  if (!props.visible) return null;

  return (
    <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
      <View style={[
        styles.loadingContainer,
        props.transparent && { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
      ]}>
        <ActivityIndicator size="large" color={theme.primary} />
        {props.message && (
          <Text style={styles.loadingText}>{props.message}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// Professional Stats Card
export function StatsCard(props: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}) {
  const { trend, color = theme.primary } = props;
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  return (
    <EnhancedCard style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View style={styles.statsIconContainer}>
          {props.icon && (
            <Ionicons name={props.icon as any} size={24} color={color} />
          )}
        </View>
        
        {props.trend && (
          <View style={[styles.trendContainer, { backgroundColor: getTrendColor() + '20' }]}>
            <Ionicons 
              name={getTrendIcon() as any} 
              size={12} 
              color={getTrendColor()} 
            />
            {props.trendValue && (
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {props.trendValue}
              </Text>
            )}
          </View>
        )}
      </View>
      
      <Text style={styles.statsValue}>{props.value}</Text>
      <Text style={styles.statsTitle}>{props.title}</Text>
      {props.subtitle && (
        <Text style={styles.statsSubtitle}>{props.subtitle}</Text>
      )}
    </EnhancedCard>
  );
}

const styles = StyleSheet.create({
  // Enhanced Card Styles
  enhancedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Modern Button Styles
  modernButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  modernButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modernButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Input Styles
  inputContainer: {
    marginVertical: 12,
  },
  
  inputLabel: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  
  inputWrapper: {
    position: 'relative',
  },
  
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 1,
  },
  
  modernInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  
  inputFocused: {
    borderColor: theme.primary,
  },
  
  inputError: {
    borderColor: theme.danger,
  },
  
  inputErrorText: {
    color: theme.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },

  // Badge Styles
  professionalBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  
  professionalBadgeText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Toggle Styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  
  toggleDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  
  toggle: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },

  // Slider Styles
  sliderContainer: {
    marginVertical: 16,
  },
  
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  
  slider: {
    height: 40,
  },
  
  sliderThumb: {
    backgroundColor: theme.primary,
    width: 24,
    height: 24,
  },
  
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },

  // Loading Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  // Stats Card Styles
  statsCard: {
    minHeight: 120,
    flex: 1,
    marginHorizontal: 4,
  },
  
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  statsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  
  statsSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

// Button Variants
const modernButtonVariants = StyleSheet.create({
  primary: { backgroundColor: theme.primary },
  secondary: { backgroundColor: '#64748B' },
  success: { backgroundColor: '#10B981' },
  warning: { backgroundColor: '#F59E0B' },
  danger: { backgroundColor: '#EF4444' },
  ghost: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary },
});

const modernButtonTextVariants = StyleSheet.create({
  primary: { color: '#FFFFFF' },
  secondary: { color: '#FFFFFF' },
  success: { color: '#FFFFFF' },
  warning: { color: '#FFFFFF' },
  danger: { color: '#FFFFFF' },
  ghost: { color: theme.primary },
});

const modernButtonSizes = StyleSheet.create({
  small: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 },
  medium: { paddingHorizontal: 24, paddingVertical: 14, minHeight: 48 },
  large: { paddingHorizontal: 32, paddingVertical: 18, minHeight: 56 },
});

const modernButtonTextSizes = StyleSheet.create({
  small: { fontSize: 14 },
  medium: { fontSize: 16 },
  large: { fontSize: 18 },
});

// Badge Variants
const professionalBadgeVariants = StyleSheet.create({
  default: { backgroundColor: '#F1F5F9' },
  success: { backgroundColor: '#DCFCE7' },
  warning: { backgroundColor: '#FEF3C7' },
  danger: { backgroundColor: '#FEE2E2' },
  info: { backgroundColor: '#DBEAFE' },
  premium: { backgroundColor: '#F3E8FF' },
});

const professionalBadgeTextVariants = StyleSheet.create({
  default: { color: '#64748B' },
  success: { color: '#166534' },
  warning: { color: '#92400E' },
  danger: { color: '#991B1B' },
  info: { color: '#1E40AF' },
  premium: { color: '#7C3AED' },
});

const professionalBadgeSizes = StyleSheet.create({
  small: { paddingHorizontal: 8, paddingVertical: 4 },
  medium: { paddingHorizontal: 12, paddingVertical: 6 },
  large: { paddingHorizontal: 16, paddingVertical: 8 },
});

const professionalBadgeTextSizes = StyleSheet.create({
  small: { fontSize: 11 },
  medium: { fontSize: 12 },
  large: { fontSize: 14 },
});