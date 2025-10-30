/**
 * 🚨 Maritime Boundary Alert System
 * Comprehensive boundary monitoring with sound alerts
 * 
 * Features:
 * - Real-time boundary monitoring
 * - Loud buzzer sounds for violations
 * - Different alert levels and sounds
 * - Demo mode for judges
 * - Visual and audio feedback
 */

import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { notificationService } from './notificationService';
import { alertStorage } from './alertStorage';

export interface BoundaryZone {
  id: string;
  name: string;
  type: 'international' | 'protected' | 'restricted' | 'no_fishing' | 'military';
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  alertDistance: number; // Distance in meters to trigger warning
  severity: 'warning' | 'critical' | 'emergency';
  description: string;
}

export interface BoundaryAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  type: 'approaching' | 'entered' | 'violation';
  severity: 'warning' | 'critical' | 'emergency';
  distance: number;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

class MaritimeBoundaryAlertSystem {
  private isInitialized = false;
  private isMonitoring = false;
  private currentLocation: Location.LocationObject | null = null;
  private boundaryZones: BoundaryZone[] = [];
  
  // Sound objects
  private warningSound: Audio.Sound | null = null;
  private criticalSound: Audio.Sound | null = null;
  private emergencySound: Audio.Sound | null = null;
  private buzzerSound: Audio.Sound | null = null;
  
  // Alert state
  private activeAlerts: Map<string, BoundaryAlert> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  
  /**
   * Initialize the boundary alert system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🛡️ Initializing Maritime Boundary Alert System...');
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Load sound files
      await this.loadSounds();
      
      // Setup boundary zones
      this.setupBoundaryZones();
      
      this.isInitialized = true;
      console.log('✅ Maritime Boundary Alert System initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize boundary alert system:', error);
    }
  }

  /**
   * Load all alert sound files
   */
  private async loadSounds(): Promise<void> {
    try {
      // Create synthetic sounds using Audio.Sound.createAsync with different frequencies
      // Warning sound (less urgent)
      this.warningSound = await this.createBeepSound(800, 0.3, 500);
      
      // Critical sound (more urgent)
      this.criticalSound = await this.createBeepSound(1000, 0.5, 300);
      
      // Emergency sound (most urgent)
      this.emergencySound = await this.createBeepSound(1200, 0.7, 200);
      
      // Loud buzzer (continuous)
      this.buzzerSound = await this.createBuzzerSound(1500, 0.8);
      
      console.log('🔊 Alert sounds loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load sounds:', error);
    }
  }

  /**
   * Create a beep sound with specified frequency and pattern
   */
  private async createBeepSound(frequency: number, volume: number, interval: number): Promise<Audio.Sound> {
    // For now, we'll use a simple implementation
    // In production, you would load actual audio files
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBTyH0fPQfywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBTyH0fPQfywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBTyH0fPQfywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBQ==' },
      { shouldPlay: false, volume }
    );
    return sound;
  }

  /**
   * Create a continuous buzzer sound
   */
  private async createBuzzerSound(frequency: number, volume: number): Promise<Audio.Sound> {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBTyH0fPQfywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBTyH0fPQfywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBQ==' },
      { shouldPlay: false, volume, isLooping: true }
    );
    return sound;
  }

  /**
   * Setup predefined boundary zones around Mumbai coast
   */
  private setupBoundaryZones(): void {
    this.boundaryZones = [
      {
        id: 'intl_waters_west',
        name: 'International Waters - West',
        type: 'international',
        coordinates: [
          { latitude: 19.2000, longitude: 72.7000 },
          { latitude: 19.2000, longitude: 72.6000 },
          { latitude: 18.8000, longitude: 72.6000 },
          { latitude: 18.8000, longitude: 72.7000 }
        ],
        alertDistance: 5000, // 5 km warning
        severity: 'emergency',
        description: 'International waters - crossing prohibited without proper documentation'
      },
      {
        id: 'marine_protected_area',
        name: 'Marine Protected Area',
        type: 'protected',
        coordinates: [
          { latitude: 19.1500, longitude: 72.8200 },
          { latitude: 19.1500, longitude: 72.8800 },
          { latitude: 19.1000, longitude: 72.8800 },
          { latitude: 19.1000, longitude: 72.8200 }
        ],
        alertDistance: 2000, // 2 km warning
        severity: 'critical',
        description: 'Protected marine sanctuary - fishing prohibited'
      },
      {
        id: 'naval_restricted_zone',
        name: 'Naval Restricted Zone',
        type: 'military',
        coordinates: [
          { latitude: 18.9500, longitude: 72.8300 },
          { latitude: 18.9500, longitude: 72.8600 },
          { latitude: 18.9200, longitude: 72.8600 },
          { latitude: 18.9200, longitude: 72.8300 }
        ],
        alertDistance: 3000, // 3 km warning
        severity: 'emergency',
        description: 'Naval operations area - entry strictly prohibited'
      },
      {
        id: 'no_fishing_zone',
        name: 'Breeding Ground - No Fishing',
        type: 'no_fishing',
        coordinates: [
          { latitude: 19.0800, longitude: 72.8500 },
          { latitude: 19.0800, longitude: 72.8900 },
          { latitude: 19.0500, longitude: 72.8900 },
          { latitude: 19.0500, longitude: 72.8500 }
        ],
        alertDistance: 1500, // 1.5 km warning
        severity: 'warning',
        description: 'Fish breeding area - no fishing during breeding season'
      }
    ];
    
    console.log(`📍 Loaded ${this.boundaryZones.length} boundary zones`);
  }

  /**
   * Start monitoring current location against boundaries
   */
  async startMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isMonitoring) {
      console.log('📡 Already monitoring boundaries');
      return;
    }

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Location permission not granted');
        return;
      }

      this.isMonitoring = true;
      console.log('📡 Started boundary monitoring');

      // Start location tracking
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Check every 5 seconds
          distanceInterval: 50, // Or when moved 50 meters
        },
        (location) => {
          this.currentLocation = location;
          this.checkBoundaries(location);
        }
      );

    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Stop boundary monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.stopAllSounds();
    console.log('🛑 Stopped boundary monitoring');
  }

  /**
   * Check current location against all boundary zones
   */
  private async checkBoundaries(location: Location.LocationObject): Promise<void> {
    const currentPos = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };

    for (const zone of this.boundaryZones) {
      const distance = this.getDistanceToZone(currentPos, zone);
      const alertType = this.determineAlertType(distance, zone);
      
      if (alertType) {
        await this.handleBoundaryAlert(zone, alertType, distance, currentPos);
      } else {
        // Clear any existing alert for this zone
        this.clearZoneAlert(zone.id);
      }
    }
  }

  /**
   * Calculate distance from current position to boundary zone
   */
  private getDistanceToZone(position: { latitude: number; longitude: number }, zone: BoundaryZone): number {
    // Simplified distance calculation to nearest boundary point
    let minDistance = Infinity;
    
    for (const coord of zone.coordinates) {
      const distance = this.calculateDistance(
        position.latitude, position.longitude,
        coord.latitude, coord.longitude
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Determine alert type based on distance and zone
   */
  private determineAlertType(distance: number, zone: BoundaryZone): 'approaching' | 'entered' | 'violation' | null {
    if (distance < 0) {
      // Inside the zone - violation
      return 'violation';
    } else if (distance < 100) {
      // Very close - entered buffer
      return 'entered';
    } else if (distance < zone.alertDistance) {
      // Within alert distance - approaching
      return 'approaching';
    }
    
    return null; // No alert needed
  }

  /**
   * Handle boundary alert with appropriate sound and notification
   */
  private async handleBoundaryAlert(
    zone: BoundaryZone, 
    alertType: 'approaching' | 'entered' | 'violation',
    distance: number,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    
    const alertId = `${zone.id}_${alertType}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertId) || 0;
    
    // Prevent spam - only alert every 30 seconds for the same zone/type
    if (now - lastAlert < 30000) return;
    
    this.lastAlertTime.set(alertId, now);

    // Create alert object
    const alert: BoundaryAlert = {
      id: alertId,
      zoneId: zone.id,
      zoneName: zone.name,
      type: alertType,
      severity: zone.severity,
      distance: Math.abs(distance),
      timestamp: now,
      location
    };

    this.activeAlerts.set(alertId, alert);

    // Play appropriate sound
    await this.playAlertSound(alertType, zone.severity);

    // Send notification
    await this.sendBoundaryNotification(alert, zone);

    console.log(`🚨 Boundary Alert: ${alertType} ${zone.name} (${distance.toFixed(0)}m)`);
  }

  /**
   * Play alert sound based on type and severity
   */
  private async playAlertSound(alertType: string, severity: string): Promise<void> {
    try {
      // Stop any currently playing sounds
      await this.stopAllSounds();

      let soundToPlay: Audio.Sound | null = null;

      // Choose sound based on severity and type
      if (alertType === 'violation') {
        soundToPlay = this.buzzerSound; // Continuous buzzer for violations
      } else {
        switch (severity) {
          case 'emergency':
            soundToPlay = this.emergencySound;
            break;
          case 'critical':
            soundToPlay = this.criticalSound;
            break;
          case 'warning':
            soundToPlay = this.warningSound;
            break;
        }
      }

      if (soundToPlay) {
        await soundToPlay.replayAsync();
        console.log(`🔊 Playing ${severity} alert sound`);
      }

    } catch (error) {
      console.error('❌ Failed to play alert sound:', error);
    }
  }

  /**
   * Send boundary notification and store in alert storage
   */
  private async sendBoundaryNotification(alert: BoundaryAlert, zone: BoundaryZone): Promise<void> {
    const titles = {
      approaching: '⚠️ Approaching Restricted Area',
      entered: '🚨 Entered Buffer Zone',
      violation: '🆘 BOUNDARY VIOLATION'
    };

    const messages = {
      approaching: `Warning: You are ${alert.distance.toFixed(0)}m from ${zone.name}. Change course immediately.`,
      entered: `CRITICAL: You have entered the buffer zone of ${zone.name}. Turn back now!`,
      violation: `VIOLATION: You are inside ${zone.name}. This is illegal - return to safe waters immediately!`
    };

    // Send notification through notification service (handles both mock and real modes)
    await notificationService.sendNotification({
      id: alert.id,
      type: 'boundary',
      title: titles[alert.type],
      message: messages[alert.type],
      priority: alert.severity === 'emergency' ? 'critical' : alert.severity as any,
      timestamp: alert.timestamp,
      location: alert.location,
      data: {
        zoneId: zone.id,
        zoneName: zone.name,
        zoneType: zone.type,
        distance: alert.distance
      }
    });

    // Also store directly in alert storage with boundary-specific details
    await alertStorage.storeBoundaryAlert(
      zone.id,
      zone.name,
      alert.type,
      alert.distance,
      alert.location
    );
  }

  /**
   * Clear alert for a specific zone
   */
  private clearZoneAlert(zoneId: string): void {
    const alertsToRemove = Array.from(this.activeAlerts.keys())
      .filter(key => key.startsWith(zoneId));
    
    for (const alertId of alertsToRemove) {
      this.activeAlerts.delete(alertId);
    }
  }

  /**
   * Stop all playing sounds
   */
  private async stopAllSounds(): Promise<void> {
    try {
      const sounds = [this.warningSound, this.criticalSound, this.emergencySound, this.buzzerSound];
      
      for (const sound of sounds) {
        if (sound) {
          await sound.stopAsync();
        }
      }
    } catch (error) {
      console.error('❌ Failed to stop sounds:', error);
    }
  }

  /**
   * Demo function - simulate boundary crossing for judges
   */
  async triggerDemoBoundaryAlert(zoneType: 'approaching' | 'violation' = 'violation'): Promise<void> {
    console.log('🎭 Triggering demo boundary alert...');
    
    const demoZone = this.boundaryZones[0]; // Use first zone for demo
    const demoLocation = {
      latitude: 19.0760,
      longitude: 72.8777
    };

    await this.handleBoundaryAlert(
      demoZone,
      zoneType,
      zoneType === 'violation' ? -100 : 500, // Negative means inside zone
      demoLocation
    );
  }

  /**
   * Demo function - simulate approaching multiple zones
   */
  async triggerDemoSequence(): Promise<void> {
    console.log('🎭 Starting demo boundary sequence...');
    
    const zones = this.boundaryZones.slice(0, 3);
    
    for (let i = 0; i < zones.length; i++) {
      setTimeout(async () => {
        const zone = zones[i];
        const alertType = i === zones.length - 1 ? 'violation' : 'approaching';
        
        await this.handleBoundaryAlert(
          zone,
          alertType,
          alertType === 'violation' ? -50 : 1000,
          { latitude: 19.0760 + (i * 0.01), longitude: 72.8777 }
        );
      }, i * 3000); // 3 seconds between each alert
    }
  }

  /**
   * Get current active alerts
   */
  getActiveAlerts(): BoundaryAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get boundary zones
   */
  getBoundaryZones(): BoundaryZone[] {
    return this.boundaryZones;
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const boundaryAlertSystem = new MaritimeBoundaryAlertSystem();
export default boundaryAlertSystem;