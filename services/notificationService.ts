/**
 * 🚨 SeaSure Notification Service
 * Complete notification system for fishermen safety alerts
 * 
 * Features:
 * - MOCK MODE / REAL MODE toggle (like Fishial API)
 * - Push notifications for various alert types
 * - Sound alerts with different urgency levels
 * - Demo functionality for judges
 * - Alert persistence for Alerts screen
 * - Permission handling and setup
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { alertStorage } from './alertStorage';
import { modeConfig } from './modeConfig';

// 🎛️ DYNAMIC MODE - Controlled by modeConfig service
// No longer hardcoded - judges can toggle between MOCK and REAL modes!

export interface AlertNotification {
  id: string;
  type: 'weather' | 'boundary' | 'emergency' | 'fishing' | 'regulatory' | 'demo';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  data?: any;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing notification service...');
      console.log(`🎛️ Mode: ${modeConfig.getCurrentMode()}`);
      
      // Initialize alert storage first
      await alertStorage.initialize();
      
      if (modeConfig.isMockMode()) {
        // Mock mode - just log notifications
        console.log('🎭 Mock mode enabled - notifications will be logged only');
        this.isInitialized = true;
        console.log('✅ Mock notification service initialized');
        return;
      }
      
      // Real mode - full notification setup
      // Request permissions
      const { status } = await this.requestPermissions();
      
      if (status !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return;
      }

      // Get push token for production use
      if (Device.isDevice) {
        this.expoPushToken = await this.getExpoPushToken();
        console.log('📱 Push token obtained:', this.expoPushToken);
      }

      // Set up notification categories for different alert types
      await this.setupNotificationCategories();
      
      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions() {
    let finalStatus = '';

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } else {
      // For simulator/development
      finalStatus = 'granted';
    }

    return { status: finalStatus };
  }

  /**
   * Get Expo push token for server-side notifications
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Setup notification categories for different alert types
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('weather_alert', [
      {
        identifier: 'view',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('boundary_alert', [
      {
        identifier: 'navigate',
        buttonTitle: 'Navigate Back',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'acknowledge',
        buttonTitle: 'Acknowledge',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('emergency_alert', [
      {
        identifier: 'call_help',
        buttonTitle: 'Call for Help',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'share_location',
        buttonTitle: 'Share Location',
        options: { opensAppToForeground: true }
      }
    ]);
  }

  /**
   * Send a local notification
   */
  async sendNotification(alert: AlertNotification): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🚨 Sending ${alert.type} notification:`, alert.title);

      // Store alert in persistent storage (works in both modes)
      await alertStorage.storeAlert({
        ...alert,
        source: modeConfig.isMockMode() ? 'demo' : 'real'
      });

      if (modeConfig.isMockMode()) {
        // Mock mode - just log the notification
        console.log('🎭 [MOCK MODE] Notification logged:');
        console.log(`   📱 Title: ${alert.title}`);
        console.log(`   💬 Message: ${alert.message}`);
        console.log(`   🔔 Priority: ${alert.priority}`);
        console.log(`   📍 Location: ${alert.location ? `${alert.location.latitude}, ${alert.location.longitude}` : 'N/A'}`);
        
        // Simulate notification ID
        const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return mockId;
      }

      // Real mode - send actual notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.message,
          sound: this.getSoundForPriority(alert.priority),
          priority: this.getNotificationPriority(alert.priority),
          vibrate: this.getVibrationPattern(alert.priority),
          categoryIdentifier: this.getCategoryId(alert.type),
          data: {
            alertId: alert.id,
            type: alert.type,
            priority: alert.priority,
            timestamp: alert.timestamp,
            ...alert.data
          }
        },
        trigger: null, // Send immediately
      });

      console.log(`✅ Notification sent with ID: ${notificationId}`);
      return notificationId;
      
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send individual demo alerts by type for judge demonstrations
   */
  async sendDemoAlert(alertType: 'emergency' | 'weather' | 'fishing' | 'navigation' | 'regulatory'): Promise<void> {
    const demoAlerts: Record<string, AlertNotification> = {
      emergency: {
        id: `demo_emergency_${Date.now()}`,
        type: 'emergency',
        title: '🆘 EMERGENCY ALERT',
        message: 'Distress signal received from nearby vessel. Coast Guard notified.',
        priority: 'critical',
        timestamp: Date.now(),
        location: { latitude: 19.0760, longitude: 72.8777 }
      },
      weather: {
        id: `demo_weather_${Date.now()}`,
        type: 'weather',
        title: '🌊 High Wave Warning',
        message: 'Wave heights of 4-6 meters expected. Consider returning to shore.',
        priority: 'high',
        timestamp: Date.now(),
        location: { latitude: 19.0760, longitude: 72.8777 }
      },
      fishing: {
        id: `demo_fishing_${Date.now()}`,
        type: 'fishing',
        title: '🐟 Prime Fishing Zone',
        message: 'High fish activity detected 2km northeast. Tuna and mackerel spotted.',
        priority: 'medium',
        timestamp: Date.now(),
        location: { latitude: 19.0960, longitude: 72.8977 }
      },
      navigation: {
        id: `demo_navigation_${Date.now()}`,
        type: 'regulatory', // Using regulatory type for navigation alerts
        title: '🧭 Course Correction',
        message: 'You are heading toward shallow waters. Adjust course 15° east.',
        priority: 'medium',
        timestamp: Date.now(),
        location: { latitude: 19.0760, longitude: 72.8777 }
      },
      regulatory: {
        id: `demo_regulatory_${Date.now()}`,
        type: 'regulatory',
        title: '📋 License Expiry Warning',
        message: 'Your fishing license expires in 7 days. Renew to avoid penalties.',
        priority: 'medium',
        timestamp: Date.now()
      }
    };

    const alert = demoAlerts[alertType];
    if (alert) {
      await this.sendNotification(alert);
    }
  }

  /**
   * Send multiple demo notifications for judges
   */
  async sendDemoAlerts(): Promise<void> {
    const demoAlerts: AlertNotification[] = [
      {
        id: 'demo_weather_1',
        type: 'weather',
        title: '🌊 High Wave Warning',
        message: 'Wave heights of 4-6 meters expected in your fishing area. Consider returning to shore.',
        priority: 'high',
        timestamp: Date.now(),
        location: { latitude: 19.0760, longitude: 72.8777 }
      },
      {
        id: 'demo_boundary_1',
        type: 'boundary',
        title: '🚨 Maritime Boundary Alert',
        message: 'You are approaching international waters. Turn back immediately.',
        priority: 'critical',
        timestamp: Date.now() + 2000,
        location: { latitude: 19.1000, longitude: 72.9000 }
      },
      {
        id: 'demo_fishing_1',
        type: 'fishing',
        title: '🐟 No-Fishing Zone',
        message: 'You have entered a protected marine area. Fishing is prohibited here.',
        priority: 'medium',
        timestamp: Date.now() + 4000,
        location: { latitude: 19.0500, longitude: 72.8500 }
      },
      {
        id: 'demo_regulatory_1',
        type: 'regulatory',
        title: '📋 Fishing License Alert',
        message: 'Your fishing license expires in 7 days. Renew to avoid penalties.',
        priority: 'medium',
        timestamp: Date.now() + 6000
      },
      {
        id: 'demo_emergency_1',
        type: 'emergency',
        title: '🆘 Emergency Alert',
        message: 'Distress signal detected 2.5 km from your location. Coast Guard notified.',
        priority: 'critical',
        timestamp: Date.now() + 8000,
        location: { latitude: 19.0900, longitude: 72.8900 }
      }
    ];

    console.log('🎭 Sending demo alerts for judges...');
    
    for (const alert of demoAlerts) {
      setTimeout(async () => {
        await this.sendNotification(alert);
      }, alert.timestamp - Date.now());
    }

    console.log('✨ All demo alerts scheduled!');
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🧹 All notifications cleared');
  }

  /**
   * Get sound configuration for priority level
   */
  private getSoundForPriority(priority: string): string | boolean {
    switch (priority) {
      case 'critical':
        return 'default'; // Use system default (loudest)
      case 'high':
        return 'default';
      case 'medium':
        return 'default';
      case 'low':
        return false; // No sound for low priority
      default:
        return 'default';
    }
  }

  /**
   * Get notification priority for the system
   */
  private getNotificationPriority(priority: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'critical':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'medium':
        return Notifications.AndroidNotificationPriority.DEFAULT;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Get vibration pattern for priority level
   */
  private getVibrationPattern(priority: string): number[] {
    switch (priority) {
      case 'critical':
        return [0, 1000, 500, 1000, 500, 1000]; // Long urgent pattern
      case 'high':
        return [0, 500, 200, 500]; // Medium pattern
      case 'medium':
        return [0, 250, 250, 250]; // Short pattern
      case 'low':
        return []; // No vibration
      default:
        return [0, 250];
    }
  }

  /**
   * Get category ID for notification type
   */
  private getCategoryId(type: string): string {
    switch (type) {
      case 'weather':
        return 'weather_alert';
      case 'boundary':
        return 'boundary_alert';
      case 'emergency':
        return 'emergency_alert';
      default:
        return 'default';
    }
  }

  /**
   * Get the current push token
   */
  getExpoPushTokenValue(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;