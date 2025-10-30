/**
 * 🗄️ Alert Storage Service
 * Manages alert persistence and retrieval for Alerts screen
 * 
 * Features:
 * - Store triggered alerts from demo and real scenarios
 * - Retrieve alerts for Alerts screen display  
 * - Alert categorization and filtering
 * - Cleanup old alerts
 * - Cross-session persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredAlert {
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
  source: 'demo' | 'real' | 'boundary_system';
  isRead: boolean;
  dismissedAt?: number;
}

export interface AlertFilter {
  type?: string[];
  priority?: string[];
  source?: string[];
  isRead?: boolean;
  startDate?: number;
  endDate?: number;
}

class AlertStorageService {
  private static readonly STORAGE_KEY = 'seasure_alerts';
  private static readonly MAX_ALERTS = 100; // Maximum alerts to store
  private static readonly CLEANUP_DAYS = 7; // Days to keep alerts
  
  private alerts: StoredAlert[] = [];
  private listeners: ((alerts: StoredAlert[]) => void)[] = [];

  /**
   * Initialize the alert storage service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAlertsFromStorage();
      await this.cleanupOldAlerts();
      console.log('✅ Alert storage service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize alert storage:', error);
    }
  }

  /**
   * Store a new alert
   */
  async storeAlert(alert: Omit<StoredAlert, 'isRead' | 'timestamp'> & { timestamp?: number }): Promise<void> {
    const newAlert: StoredAlert = {
      ...alert,
      timestamp: alert.timestamp || Date.now(),
      isRead: false
    };

    this.alerts.unshift(newAlert); // Add to beginning
    
    // Limit number of stored alerts
    if (this.alerts.length > AlertStorageService.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, AlertStorageService.MAX_ALERTS);
    }

    await this.saveAlertsToStorage();
    this.notifyListeners();

    console.log(`📦 Stored alert: ${alert.type} - ${alert.title}`);
  }

  /**
   * Get all alerts with optional filtering
   */
  getAlerts(filter?: AlertFilter): StoredAlert[] {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.type && filter.type.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert => filter.type!.includes(alert.type));
      }
      
      if (filter.priority && filter.priority.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert => filter.priority!.includes(alert.priority));
      }
      
      if (filter.source && filter.source.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert => filter.source!.includes(alert.source));
      }
      
      if (filter.isRead !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.isRead === filter.isRead);
      }
      
      if (filter.startDate) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= filter.startDate!);
      }
      
      if (filter.endDate) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= filter.endDate!);
      }
    }

    return filteredAlerts;
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.isRead) {
      alert.isRead = true;
      await this.saveAlertsToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Mark all alerts as read
   */
  async markAllAsRead(): Promise<void> {
    let hasChanges = false;
    this.alerts.forEach(alert => {
      if (!alert.isRead) {
        alert.isRead = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await this.saveAlertsToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.dismissedAt = Date.now();
      await this.saveAlertsToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Clear all alerts
   */
  async clearAllAlerts(): Promise<void> {
    this.alerts = [];
    await this.saveAlertsToStorage();
    this.notifyListeners();
    console.log('🗑️ All alerts cleared');
  }

  /**
   * Get unread alert count
   */
  getUnreadCount(): number {
    return this.alerts.filter(alert => !alert.isRead).length;
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const stats = {
      total: this.alerts.length,
      unread: this.getUnreadCount(),
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      bySource: {} as Record<string, number>
    };

    this.alerts.forEach(alert => {
      // Count by type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
      
      // Count by source
      stats.bySource[alert.source] = (stats.bySource[alert.source] || 0) + 1;
    });

    return stats;
  }

  /**
   * Add listener for alert updates
   */
  addListener(callback: (alerts: StoredAlert[]) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Load alerts from AsyncStorage
   */
  private async loadAlertsFromStorage(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(AlertStorageService.STORAGE_KEY);
      if (storedData) {
        this.alerts = JSON.parse(storedData);
        console.log(`📱 Loaded ${this.alerts.length} alerts from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load alerts from storage:', error);
    }
  }

  /**
   * Save alerts to AsyncStorage
   */
  private async saveAlertsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(AlertStorageService.STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('❌ Failed to save alerts to storage:', error);
    }
  }

  /**
   * Clean up old alerts
   */
  private async cleanupOldAlerts(): Promise<void> {
    const cutoffTime = Date.now() - (AlertStorageService.CLEANUP_DAYS * 24 * 60 * 60 * 1000);
    const originalCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    
    if (this.alerts.length < originalCount) {
      await this.saveAlertsToStorage();
      console.log(`🧹 Cleaned up ${originalCount - this.alerts.length} old alerts`);
    }
  }

  /**
   * Notify all listeners of alert changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.alerts]);
      } catch (error) {
        console.error('❌ Error in alert listener:', error);
      }
    });
  }

  /**
   * Store demo alert from judges panel
   */
  async storeDemoAlert(type: string, title: string, message: string, priority: string): Promise<void> {
    await this.storeAlert({
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      title: `🎭 DEMO: ${title}`,
      message: `[Judge Demo] ${message}`,
      priority: priority as any,
      source: 'demo'
    });
  }

  /**
   * Store boundary alert from boundary system
   */
  async storeBoundaryAlert(
    zoneId: string, 
    zoneName: string, 
    alertType: string, 
    distance: number,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    const titles = {
      approaching: '⚠️ Approaching Restricted Area',
      entered: '🚨 Entered Buffer Zone', 
      violation: '🆘 BOUNDARY VIOLATION'
    };

    const priorities = {
      approaching: 'medium',
      entered: 'high',
      violation: 'critical'
    };

    await this.storeAlert({
      id: `boundary_${zoneId}_${Date.now()}`,
      type: 'boundary',
      title: titles[alertType as keyof typeof titles] || 'Boundary Alert',
      message: `${zoneName}: ${distance.toFixed(0)}m away`,
      priority: priorities[alertType as keyof typeof priorities] as any || 'medium',
      location,
      source: 'boundary_system',
      data: {
        zoneId,
        zoneName,
        alertType,
        distance
      }
    });
  }
}

// Export singleton instance
export const alertStorage = new AlertStorageService();
export default alertStorage;