/**
 * 🎛️ Mode Configuration Service
 * Allows switching between MOCK and REAL modes for demonstration
 * 
 * Features:
 * - Runtime mode switching (for judge demos)
 * - Configuration persistence
 * - Mode status reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

type SystemMode = 'MOCK' | 'REAL';

class ModeConfigService {
  private static readonly STORAGE_KEY = 'seasure_system_mode';
  private currentMode: SystemMode = 'MOCK'; // Default to MOCK for demos
  private listeners: ((mode: SystemMode) => void)[] = [];

  /**
   * Initialize mode configuration
   */
  async initialize(): Promise<void> {
    try {
      const storedMode = await AsyncStorage.getItem(ModeConfigService.STORAGE_KEY);
      if (storedMode && (storedMode === 'MOCK' || storedMode === 'REAL')) {
        this.currentMode = storedMode as SystemMode;
      }
      console.log(`🎛️ Mode configuration initialized: ${this.currentMode}`);
    } catch (error) {
      console.error('❌ Failed to initialize mode configuration:', error);
    }
  }

  /**
   * Get current system mode
   */
  getCurrentMode(): SystemMode {
    return this.currentMode;
  }

  /**
   * Check if system is in mock mode
   */
  isMockMode(): boolean {
    return this.currentMode === 'MOCK';
  }

  /**
   * Check if system is in real mode
   */
  isRealMode(): boolean {
    return this.currentMode === 'REAL';
  }

  /**
   * Set system mode
   */
  async setMode(mode: SystemMode): Promise<void> {
    try {
      this.currentMode = mode;
      await AsyncStorage.setItem(ModeConfigService.STORAGE_KEY, mode);
      this.notifyListeners();
      console.log(`🎛️ System mode changed to: ${mode}`);
    } catch (error) {
      console.error('❌ Failed to set system mode:', error);
    }
  }

  /**
   * Toggle between MOCK and REAL modes
   */
  async toggleMode(): Promise<SystemMode> {
    const newMode = this.currentMode === 'MOCK' ? 'REAL' : 'MOCK';
    await this.setMode(newMode);
    return newMode;
  }

  /**
   * Get mode description for UI display
   */
  getModeDescription(): {
    mode: SystemMode;
    title: string;
    description: string;
    color: string;
    benefits: string[];
  } {
    if (this.currentMode === 'MOCK') {
      return {
        mode: 'MOCK',
        title: '🎭 MOCK MODE (Demo Ready)',
        description: 'Perfect for judge demonstrations and testing',
        color: '#7c3aed',
        benefits: [
          'Safe for demonstrations',
          'All notifications are logged',
          'No real push notifications sent',
          'Alerts stored in Alerts tab',
          'Immediate feedback for judges'
        ]
      };
    } else {
      return {
        mode: 'REAL',
        title: '🚀 REAL MODE (Production)',
        description: 'Full production system with real notifications',
        color: '#059669',
        benefits: [
          'Real push notifications',
          'Actual device vibrations',
          'Production-ready experience',
          'Full maritime safety features',
          'Live GPS boundary monitoring'
        ]
      };
    }
  }

  /**
   * Add listener for mode changes
   */
  addListener(callback: (mode: SystemMode) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of mode changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentMode);
      } catch (error) {
        console.error('❌ Error in mode listener:', error);
      }
    });
  }

  /**
   * Get configuration for services based on current mode
   */
  getServiceConfig(): {
    notifications: {
      sendReal: boolean;
      logOnly: boolean;
    };
    storage: {
      persistAlerts: boolean;
    };
    audio: {
      playBuzzers: boolean;
    };
  } {
    return {
      notifications: {
        sendReal: this.currentMode === 'REAL',
        logOnly: this.currentMode === 'MOCK'
      },
      storage: {
        persistAlerts: true // Always persist alerts in both modes
      },
      audio: {
        playBuzzers: true // Always play audio feedback for demos
      }
    };
  }
}

// Export singleton instance
export const modeConfig = new ModeConfigService();
export default modeConfig;