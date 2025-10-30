/**
 * 🚀 SeaSure App Initialization
 * Initialize all services for the maritime safety application
 */

import { notificationService } from '../services/notificationService';
import { boundaryAlertSystem } from '../services/boundaryAlertSystem';
import { modeConfig } from '../services/modeConfig';

export class AppInitializer {
  private static initialized = false;

  /**
   * Initialize all app services
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ SeaSure services already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing SeaSure services...');

      // Initialize mode configuration first
      await modeConfig.initialize();
      console.log(`✅ Mode configuration initialized: ${modeConfig.getCurrentMode()}`);

      // Initialize notification service
      await notificationService.initialize();
      console.log('✅ Notification service initialized');

      // Initialize boundary alert system
      await boundaryAlertSystem.initialize();
      console.log('✅ Boundary alert system initialized');

      this.initialized = true;
      console.log('🎉 SeaSure fully initialized and ready for demo!');

    } catch (error) {
      console.error('❌ Failed to initialize SeaSure services:', error);
    }
  }

  /**
   * Check if services are initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get initialization status
   */
  static getStatus(): {
    initialized: boolean;
    mode: string;
    notifications: boolean;
    boundaries: boolean;
  } {
    return {
      initialized: this.initialized,
      mode: modeConfig.getCurrentMode(),
      notifications: notificationService.isServiceInitialized(),
      boundaries: boundaryAlertSystem.isMonitoringActive()
    };
  }
}

export default AppInitializer;