import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { pointInPolygon, haversineKm } from '../utils/geo';
import { ZONES } from '../data/zones';
import { Storage } from './storage';

// Maritime boundary types and restrictions
export interface MaritimeBoundary {
  id: string;
  name: string;
  type: 'territorial_waters' | 'eez' | 'international_boundary' | 'restricted_military' | 'marine_protected' | 'seasonal_ban';
  coordinates: { lat: number; lon: number }[];
  restrictions: {
    fishingAllowed: boolean;
    requiresPermit: boolean;
    seasonalRestrictions: {
      banned: { start: string; end: string }[];
      permitted: { start: string; end: string }[];
    };
    timeRestrictions: {
      allowedHours: { start: string; end: string }[];
      bannedHours: { start: string; end: string }[];
    };
    gearRestrictions: string[];
    speciesRestrictions: string[];
  };
  penalties: {
    fine: { min: number; max: number; currency: string };
    imprisonment: { min: number; max: number; unit: 'days' | 'months' | 'years' };
    vesselSeizure: boolean;
    licenseRevocation: boolean;
  };
  warningDistance: number; // km from boundary to start warnings
  criticalDistance: number; // km from boundary for critical alerts
}

// Real-time boundary violation tracking
export interface BoundaryViolation {
  id: string;
  timestamp: Date;
  location: { lat: number; lon: number };
  boundary: MaritimeBoundary;
  violationType: 'entry' | 'fishing' | 'gear_violation' | 'time_violation' | 'species_violation';
  severity: 'warning' | 'critical' | 'emergency';
  fisherDetails: {
    boatId: string;
    licenseNumber: string;
    contactNumber: string;
  };
  automaticReported: boolean;
  acknowledged: boolean;
  resolved: boolean;
}

// GPS tracking and geofencing
export interface GPSTrackingData {
  timestamp: Date;
  location: { lat: number; lon: number };
  speed: number; // knots
  heading: number; // degrees
  accuracy: number; // meters
  insideBoundary: string | null; // boundary ID if inside restricted area
  distanceToNearestBoundary: number; // km
  estimatedTimeToViolation: number | null; // minutes
}

class MaritimeBoundaryService {
  private boundaries: MaritimeBoundary[] = [];
  private trackingData: GPSTrackingData[] = [];
  private violations: BoundaryViolation[] = [];
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private lastPosition: { lat: number; lon: number } | null = null;

  constructor() {
    this.initializeBoundaries();
    this.loadViolationHistory();
  }

  // Initialize Indian maritime boundaries
  private initializeBoundaries() {
    this.boundaries = [
      {
        id: 'india_pakistan_boundary',
        name: 'India-Pakistan Maritime Boundary',
        type: 'international_boundary',
        coordinates: [
          { lat: 24.0, lon: 68.0 },
          { lat: 23.5, lon: 68.2 },
          { lat: 23.0, lon: 68.5 },
          { lat: 22.5, lon: 69.0 }
        ],
        restrictions: {
          fishingAllowed: false,
          requiresPermit: false,
          seasonalRestrictions: { banned: [], permitted: [] },
          timeRestrictions: { allowedHours: [], bannedHours: [] },
          gearRestrictions: [],
          speciesRestrictions: []
        },
        penalties: {
          fine: { min: 500000, max: 2000000, currency: 'INR' },
          imprisonment: { min: 6, max: 24, unit: 'months' },
          vesselSeizure: true,
          licenseRevocation: true
        },
        warningDistance: 10,
        criticalDistance: 2
      },
      {
        id: 'mumbai_naval_zone',
        name: 'Mumbai Naval Restricted Zone',
        type: 'restricted_military',
        coordinates: [
          { lat: 18.95, lon: 72.8 },
          { lat: 18.95, lon: 72.85 },
          { lat: 18.92, lon: 72.85 },
          { lat: 18.92, lon: 72.8 }
        ],
        restrictions: {
          fishingAllowed: false,
          requiresPermit: false,
          seasonalRestrictions: { banned: [], permitted: [] },
          timeRestrictions: { allowedHours: [], bannedHours: [] },
          gearRestrictions: [],
          speciesRestrictions: []
        },
        penalties: {
          fine: { min: 100000, max: 500000, currency: 'INR' },
          imprisonment: { min: 1, max: 6, unit: 'months' },
          vesselSeizure: true,
          licenseRevocation: false
        },
        warningDistance: 5,
        criticalDistance: 1
      },
      {
        id: 'goa_monsoon_ban',
        name: 'Goa Monsoon Fishing Ban Zone',
        type: 'seasonal_ban',
        coordinates: [
          { lat: 15.8, lon: 73.5 },
          { lat: 15.8, lon: 74.2 },
          { lat: 15.0, lon: 74.2 },
          { lat: 15.0, lon: 73.5 }
        ],
        restrictions: {
          fishingAllowed: true,
          requiresPermit: true,
          seasonalRestrictions: {
            banned: [{ start: '2024-06-01', end: '2024-07-31' }],
            permitted: [{ start: '2024-08-01', end: '2024-05-31' }]
          },
          timeRestrictions: { allowedHours: [], bannedHours: [] },
          gearRestrictions: ['purse_seine', 'trawl_net'],
          speciesRestrictions: ['juvenile_fish']
        },
        penalties: {
          fine: { min: 50000, max: 200000, currency: 'INR' },
          imprisonment: { min: 15, max: 90, unit: 'days' },
          vesselSeizure: false,
          licenseRevocation: false
        },
        warningDistance: 15,
        criticalDistance: 5
      },
      {
        id: 'kerala_marine_sanctuary',
        name: 'Kerala Marine Protected Area',
        type: 'marine_protected',
        coordinates: [
          { lat: 10.2, lon: 76.0 },
          { lat: 10.2, lon: 76.3 },
          { lat: 9.8, lon: 76.3 },
          { lat: 9.8, lon: 76.0 }
        ],
        restrictions: {
          fishingAllowed: true,
          requiresPermit: true,
          seasonalRestrictions: {
            banned: [{ start: '2024-04-01', end: '2024-06-30' }],
            permitted: []
          },
          timeRestrictions: {
            allowedHours: [{ start: '06:00', end: '18:00' }],
            bannedHours: [{ start: '18:00', end: '06:00' }]
          },
          gearRestrictions: ['bottom_trawl', 'dynamite_fishing'],
          speciesRestrictions: ['turtle', 'shark', 'ray']
        },
        penalties: {
          fine: { min: 75000, max: 300000, currency: 'INR' },
          imprisonment: { min: 1, max: 12, unit: 'months' },
          vesselSeizure: false,
          licenseRevocation: true
        },
        warningDistance: 8,
        criticalDistance: 2
      }
    ];
  }

  // Start real-time GPS tracking and boundary monitoring
  async startBoundaryMonitoring(options: {
    trackingInterval: number; // seconds
    highAccuracy: boolean;
    backgroundTracking: boolean;
  }): Promise<boolean> {
    try {
      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required for boundary monitoring.');
        return false;
      }

      if (options.backgroundTracking) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert('Background Location', 'Background location access recommended for continuous monitoring.');
        }
      }

      this.isTracking = true;

      // Start periodic tracking
      this.trackingInterval = setInterval(async () => {
        await this.trackCurrentPosition(options.highAccuracy);
      }, options.trackingInterval * 1000);

      // Initial position check
      await this.trackCurrentPosition(options.highAccuracy);

      return true;
    } catch (error) {
      console.error('Failed to start boundary monitoring:', error);
      return false;
    }
  }

  // Stop GPS tracking
  stopBoundaryMonitoring(): void {
    this.isTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // Track current position and check for violations
  private async trackCurrentPosition(highAccuracy: boolean): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced
      });

      const currentPos = {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };

      // Calculate speed and heading if we have previous position
      let speed = 0;
      let heading = 0;
      if (this.lastPosition) {
        const distance = haversineKm(this.lastPosition, currentPos);
        const timeDiff = 1; // 1 minute intervals
        speed = (distance / timeDiff) * 60; // Convert to km/h, then to knots
        speed = speed * 0.539957; // Convert km/h to knots

        // Calculate heading (simplified)
        const deltaLon = currentPos.lon - this.lastPosition.lon;
        const deltaLat = currentPos.lat - this.lastPosition.lat;
        heading = Math.atan2(deltaLon, deltaLat) * (180 / Math.PI);
        if (heading < 0) heading += 360;
      }

      // Check boundary violations
      const boundaryCheck = this.checkBoundaryViolations(currentPos);
      
      // Create tracking data
      const trackingData: GPSTrackingData = {
        timestamp: new Date(),
        location: currentPos,
        speed,
        heading,
        accuracy: location.coords.accuracy || 0,
        insideBoundary: boundaryCheck.insideBoundary,
        distanceToNearestBoundary: boundaryCheck.distanceToNearest,
        estimatedTimeToViolation: boundaryCheck.timeToViolation
      };

      this.trackingData.push(trackingData);
      this.lastPosition = currentPos;

      // Handle violations
      if (boundaryCheck.violations.length > 0) {
        await this.handleBoundaryViolations(boundaryCheck.violations, currentPos);
      }

      // Save tracking data (keep last 1000 points)
      if (this.trackingData.length > 1000) {
        this.trackingData = this.trackingData.slice(-1000);
      }

      await this.saveTrackingData();

    } catch (error) {
      console.error('Position tracking error:', error);
    }
  }

  // Check for boundary violations
  private checkBoundaryViolations(position: { lat: number; lon: number }): {
    insideBoundary: string | null;
    distanceToNearest: number;
    timeToViolation: number | null;
    violations: { boundary: MaritimeBoundary; type: string; severity: string }[];
  } {
    let insideBoundary: string | null = null;
    let distanceToNearest = Infinity;
    let timeToViolation: number | null = null;
    const violations: { boundary: MaritimeBoundary; type: string; severity: string }[] = [];

    for (const boundary of this.boundaries) {
      const isInside = pointInPolygon(position, boundary.coordinates);
      const distance = this.distanceToBoundary(position, boundary);

      if (distance < distanceToNearest) {
        distanceToNearest = distance;
      }

      // Check if inside restricted boundary
      if (isInside) {
        insideBoundary = boundary.id;
        
        if (!this.isFishingAllowed(boundary)) {
          violations.push({
            boundary,
            type: 'entry',
            severity: 'critical'
          });
        }
      }

      // Check warning distances
      if (distance <= boundary.criticalDistance) {
        violations.push({
          boundary,
          type: 'proximity_critical',
          severity: 'emergency'
        });
      } else if (distance <= boundary.warningDistance) {
        violations.push({
          boundary,
          type: 'proximity_warning',
          severity: 'warning'
        });

        // Calculate time to violation based on current speed
        if (this.lastPosition && this.trackingData.length > 0) {
          const lastTracking = this.trackingData[this.trackingData.length - 1];
          if (lastTracking.speed > 0) {
            timeToViolation = (distance / lastTracking.speed) * 60; // minutes
          }
        }
      }
    }

    return {
      insideBoundary,
      distanceToNearest,
      timeToViolation,
      violations
    };
  }

  // Calculate distance to boundary
  private distanceToBoundary(position: { lat: number; lon: number }, boundary: MaritimeBoundary): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < boundary.coordinates.length; i++) {
      const distance = haversineKm(position, boundary.coordinates[i]);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    return minDistance;
  }

  // Check if fishing is currently allowed in a boundary
  private isFishingAllowed(boundary: MaritimeBoundary): boolean {
    if (!boundary.restrictions.fishingAllowed) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDate = now.toISOString().split('T')[0];

    // Check seasonal restrictions
    for (const ban of boundary.restrictions.seasonalRestrictions.banned) {
      if (currentDate >= ban.start && currentDate <= ban.end) {
        return false;
      }
    }

    // Check time restrictions
    for (const bannedHour of boundary.restrictions.timeRestrictions.bannedHours) {
      if (currentTime >= bannedHour.start && currentTime <= bannedHour.end) {
        return false;
      }
    }

    return true;
  }

  // Handle boundary violations
  private async handleBoundaryViolations(
    violations: { boundary: MaritimeBoundary; type: string; severity: string }[],
    position: { lat: number; lon: number }
  ): Promise<void> {
    for (const violation of violations) {
      const violationRecord: BoundaryViolation = {
        id: `violation_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        location: position,
        boundary: violation.boundary,
        violationType: violation.type as any,
        severity: violation.severity as any,
        fisherDetails: {
          boatId: await this.getBoatId(),
          licenseNumber: await this.getLicenseNumber(),
          contactNumber: await this.getContactNumber()
        },
        automaticReported: false,
        acknowledged: false,
        resolved: false
      };

      this.violations.push(violationRecord);

      // Show alert to user
      await this.showViolationAlert(violationRecord);

      // Auto-report critical violations
      if (violation.severity === 'critical' || violation.severity === 'emergency') {
        await this.reportViolationToAuthorities(violationRecord);
        violationRecord.automaticReported = true;
      }
    }

    await this.saveViolations();
  }

  // Show violation alert to user
  private async showViolationAlert(violation: BoundaryViolation): Promise<void> {
    let title = '';
    let message = '';

    switch (violation.severity) {
      case 'warning':
        title = '⚠️ Boundary Warning';
        message = `You are approaching ${violation.boundary.name}. Current distance: ${violation.boundary.warningDistance}km`;
        break;
      case 'critical':
        title = '🚨 Critical Boundary Alert';
        message = `You are very close to ${violation.boundary.name}. Immediate course correction required!`;
        break;
      case 'emergency':
        title = '🚨 EMERGENCY - BOUNDARY VIOLATION';
        message = `You have entered ${violation.boundary.name}. This is a restricted area. Exit immediately!`;
        break;
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Acknowledge',
          onPress: () => {
            violation.acknowledged = true;
            this.saveViolations();
          }
        },
        {
          text: 'Get Directions',
          onPress: () => this.provideExitDirections(violation)
        }
      ],
      { cancelable: false }
    );
  }

  // Provide directions to exit restricted area
  private async provideExitDirections(violation: BoundaryViolation): Promise<void> {
    const currentPos = violation.location;
    const boundary = violation.boundary;
    
    // Find nearest exit point
    let nearestExit = boundary.coordinates[0];
    let minDistance = Infinity;
    
    for (const point of boundary.coordinates) {
      const distance = haversineKm(currentPos, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestExit = point;
      }
    }

    // Calculate bearing to exit
    const bearing = this.calculateBearing(currentPos, nearestExit);
    const distance = haversineKm(currentPos, nearestExit);

    Alert.alert(
      '📍 Exit Directions',
      `Head ${this.bearingToCompass(bearing)} for ${distance.toFixed(2)}km to exit the restricted area.`,
      [{ text: 'OK' }]
    );
  }

  // Calculate bearing between two points
  private calculateBearing(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
    const deltaLon = (to.lon - from.lon) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Convert bearing to compass direction
  private bearingToCompass(bearing: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  // Report violation to authorities
  private async reportViolationToAuthorities(violation: BoundaryViolation): Promise<void> {
    try {
      // In real implementation, this would send to Coast Guard API
      const reportData = {
        violationId: violation.id,
        timestamp: violation.timestamp.toISOString(),
        location: violation.location,
        boundaryId: violation.boundary.id,
        severity: violation.severity,
        boatDetails: violation.fisherDetails
      };

      console.log('Reporting to authorities:', reportData);
      // await coastGuardAPI.reportViolation(reportData);
      
    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  }

  // Helper methods to get boat/fisher details
  private async getBoatId(): Promise<string> {
    return await Storage.getBoatId?.() || 'UNKNOWN';
  }

  private async getLicenseNumber(): Promise<string> {
    return await Storage.getLicenseNumber?.() || 'UNKNOWN';
  }

  private async getContactNumber(): Promise<string> {
    return await Storage.getContactNumber?.() || 'UNKNOWN';
  }

  // Data persistence methods
  private async saveTrackingData(): Promise<void> {
    try {
      await Storage.saveTrackingData?.(this.trackingData.slice(-100)); // Save last 100 points
    } catch (error) {
      console.error('Failed to save tracking data:', error);
    }
  }

  private async saveViolations(): Promise<void> {
    try {
      await Storage.saveViolations?.(this.violations);
    } catch (error) {
      console.error('Failed to save violations:', error);
    }
  }

  private async loadViolationHistory(): Promise<void> {
    try {
      const violations = await Storage.getViolations?.() || [];
      this.violations = violations;
    } catch (error) {
      console.error('Failed to load violation history:', error);
    }
  }

  // Public API methods
  getBoundaries(): MaritimeBoundary[] {
    return this.boundaries;
  }

  getViolations(): BoundaryViolation[] {
    return this.violations;
  }

  getTrackingData(): GPSTrackingData[] {
    return this.trackingData;
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  async checkCurrentLocation(): Promise<any> {
    try {
      const location = await Location.getCurrentPositionAsync();
      const position = {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };
      return this.checkBoundaryViolations(position);
    } catch (error) {
      console.error('Failed to check current location:', error);
      return null;
    }
  }
}

export const maritimeBoundaryService = new MaritimeBoundaryService();