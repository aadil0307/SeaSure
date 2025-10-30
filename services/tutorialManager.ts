import AsyncStorage from '@react-native-async-storage/async-storage';

interface TutorialState {
  onboardingCompleted: boolean;
  featuresIntroduced: {
    mapModes: boolean;
    smartTrips: boolean;
    weatherAlerts: boolean;
    aiPredictions: boolean;
  };
  lastTutorialVersion: string;
}

const TUTORIAL_STORAGE_KEY = 'seasure_tutorial_state';
const CURRENT_TUTORIAL_VERSION = '1.0.0';

class TutorialManager {
  private state: TutorialState = {
    onboardingCompleted: false,
    featuresIntroduced: {
      mapModes: false,
      smartTrips: false,
      weatherAlerts: false,
      aiPredictions: false,
    },
    lastTutorialVersion: '',
  };

  async loadTutorialState(): Promise<TutorialState> {
    try {
      const stored = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading tutorial state:', error);
    }
    return this.state;
  }

  async saveTutorialState(): Promise<void> {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  }

  async completeOnboarding(): Promise<void> {
    this.state.onboardingCompleted = true;
    this.state.lastTutorialVersion = CURRENT_TUTORIAL_VERSION;
    await this.saveTutorialState();
  }

  async markFeatureIntroduced(feature: keyof TutorialState['featuresIntroduced']): Promise<void> {
    this.state.featuresIntroduced[feature] = true;
    await this.saveTutorialState();
  }

  shouldShowOnboarding(): boolean {
    return !this.state.onboardingCompleted || 
           this.state.lastTutorialVersion !== CURRENT_TUTORIAL_VERSION;
  }

  shouldShowFeatureTutorial(feature: keyof TutorialState['featuresIntroduced']): boolean {
    return this.state.onboardingCompleted && !this.state.featuresIntroduced[feature];
  }

  async resetTutorials(): Promise<void> {
    this.state = {
      onboardingCompleted: false,
      featuresIntroduced: {
        mapModes: false,
        smartTrips: false,
        weatherAlerts: false,
        aiPredictions: false,
      },
      lastTutorialVersion: '',
    };
    await this.saveTutorialState();
  }

  getTutorialState(): TutorialState {
    return { ...this.state };
  }
}

export const tutorialManager = new TutorialManager();

// Feature tutorial definitions
export const FeatureTutorials = {
  mapModes: {
    title: 'Discover Map Modes',
    description: 'Tap the map mode buttons to switch between Fishing Zones, AI Fish Predictions, and Maritime Boundaries. Each mode provides unique insights for your fishing success.',
  },
  smartTrips: {
    title: 'AI Smart Trip Planning',
    description: 'Use the "AI Smart Plan" button to let our artificial intelligence create optimized fishing trips based on current conditions, weather, and fish predictions.',
  },
  weatherAlerts: {
    title: 'Weather Condition Alerts',
    description: 'Check the fishing condition badge for real-time safety ratings. Red means dangerous conditions - return to shore immediately!',
  },
  aiPredictions: {
    title: 'AI Fish Predictions',
    description: 'The colored zones on the map show AI-predicted fish activity. Green areas have higher probability of successful catches.',
  },
};

export type FeatureTutorialKey = keyof typeof FeatureTutorials;