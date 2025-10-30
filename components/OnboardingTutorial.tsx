import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedCard, ModernButton } from './modernUI';
import { theme } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SeaSure',
    description: 'Your AI-powered fishing companion for safer, smarter fishing adventures.',
    icon: 'fish',
    features: [
      'AI-powered fish predictions',
      'Smart trip planning',
      'Real-time weather alerts',
      'Maritime boundary awareness'
    ]
  },
  {
    id: 'map',
    title: 'Smart Map Features',
    description: 'Explore three powerful map modes designed for modern fishermen.',
    icon: 'map',
    features: [
      'Fishing Zones: Discover productive fishing areas',
      'Fish Predictions: AI-generated species probability maps',
      'Maritime Boundaries: Stay legal with boundary alerts',
      'Real-time Alerts: Weather and safety notifications'
    ]
  },
  {
    id: 'trips',
    title: 'AI Trip Planning',
    description: 'Let artificial intelligence optimize your fishing trips for maximum success.',
    icon: 'navigate',
    features: [
      'Smart Route Optimization: AI calculates best paths',
      'Fuel Cost Estimation: Budget your trips effectively',
      'Catch Predictions: Estimated catch weight and species',
      'Duration Planning: Optimal trip timing suggestions'
    ]
  },
  {
    id: 'weather',
    title: 'Marine Weather Intelligence',
    description: 'Professional-grade weather data tailored for fishing conditions.',
    icon: 'cloud',
    features: [
      'Fishing Condition Ratings: Excellent, Good, Poor, Dangerous',
      'Marine-specific Data: Wave height, wind, visibility',
      'Safety Alerts: Real-time weather warnings',
      'UV Index & Pressure: Complete environmental picture'
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Compliance',
    description: 'Fish responsibly with built-in safety and legal compliance features.',
    icon: 'shield-checkmark',
    features: [
      'Maritime Boundary Warnings: Avoid restricted areas',
      'Emergency Weather Alerts: Return-to-shore notifications',
      'Legal Fishing Zones: Stay compliant with regulations',
      'Community Safety Reports: Shared knowledge network'
    ]
  }
];

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = onboardingSteps[currentStep];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {onboardingSteps.length}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <EnhancedCard style={styles.stepCard}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={step.icon} size={64} color={theme.primary} />
            </View>

            {/* Title & Description */}
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {step.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </EnhancedCard>
        </View>

        {/* Navigation Controls */}
        <View style={styles.controls}>
          <View style={styles.leftControls}>
            {currentStep > 0 && (
              <ModernButton
                title="Previous"
                onPress={handlePrevious}
                variant="ghost"
                icon="arrow-back"
              />
            )}
          </View>

          <View style={styles.rightControls}>
            <ModernButton
              title="Skip"
              onPress={handleSkip}
              variant="ghost"
              style={styles.skipButton}
            />
            <ModernButton
              title={currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
              onPress={handleNext}
              icon={currentStep === onboardingSteps.length - 1 ? "rocket" : "arrow-forward"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Feature Highlight Component for in-app tutorials
interface FeatureHighlightProps {
  title: string;
  description: string;
  targetComponent?: string;
  onDismiss: () => void;
}

export function FeatureHighlight({ title, description, onDismiss }: FeatureHighlightProps) {
  return (
    <View style={styles.highlightOverlay}>
      <View style={styles.highlightContent}>
        <EnhancedCard style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>{title}</Text>
          <Text style={styles.highlightDescription}>{description}</Text>
          <ModernButton
            title="Got it"
            onPress={onDismiss}
            style={styles.highlightButton}
          />
        </EnhancedCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.card,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: theme.muted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  stepCard: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.fg,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: theme.fg,
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  leftControls: {
    flex: 1,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skipButton: {
    marginRight: 8,
  },
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  highlightContent: {
    margin: 24,
  },
  highlightCard: {
    padding: 24,
    maxWidth: width * 0.9,
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 12,
  },
  highlightDescription: {
    fontSize: 16,
    color: theme.muted,
    lineHeight: 22,
    marginBottom: 20,
  },
  highlightButton: {
    alignSelf: 'flex-end',
  },
});