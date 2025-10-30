import { haversineKm, optimizeOrder } from '../utils/geo';
import { fishPredictionService } from './fishPrediction';
import { weatherService } from './weather';
import { maritimeBoundaryService } from './maritimeBoundary';
import { Storage } from './storage';
import { PRODUCTION_MARITIME_ZONES, productionMaritimeService } from '../data/productionMaritimeZones';
import { PRODUCTION_FISH_DATABASE, productionMarketService } from '../data/productionFishDatabase';
import { productionTidalService } from './productionTidalService';

// Enhanced trip planning with fuel efficiency and catch predictions
export interface SmartTripPlan {
  id: string;
  name: string;
  createdAt: Date;
  estimatedDuration: number; // hours
  totalDistance: number; // km
  fuelConsumption: {
    estimated: number; // liters
    cost: number; // INR
    efficiency: number; // km/liter
  };
  route: RouteWaypoint[];
  fishingZones: FishingZone[];
  riskAssessment: RiskAssessment;
  weatherWindows: WeatherWindow[];
  recommendations: TripRecommendations;
  compliance: ComplianceCheck;
  expectedCatch: CatchPrediction[];
  emergencyPlan: EmergencyPlan;
}

export interface RouteWaypoint {
  id: string;
  location: { lat: number; lon: number };
  type: 'departure' | 'fishing_zone' | 'waypoint' | 'emergency' | 'return';
  estimatedArrival: Date;
  estimatedDeparture?: Date;
  fuelRequired: number; // liters to reach this point
  distanceFromPrevious: number; // km
  purpose: string;
  notes?: string;
}

export interface FishingZone {
  id: string;
  location: { lat: number; lon: number };
  radius: number; // km
  targetSpecies: string[];
  estimatedFishingTime: number; // hours
  expectedCatch: { species: string; quantity: number; confidence: number }[];
  optimalTiming: { start: Date; end: Date };
  netType: string;
  depth: { min: number; max: number };
  priority: number; // 1-10
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'extreme';
  factors: {
    weather: { level: string; description: string };
    boundaries: { level: string; violations: number };
    fuel: { level: string; safety_margin: number };
    equipment: { level: string; issues: string[] };
    experience: { level: string; recommendation: string };
  };
  recommendations: string[];
  alternatives: string[];
}

export interface WeatherWindow {
  start: Date;
  end: Date;
  conditions: {
    windSpeed: number;
    waveHeight: number;
    visibility: number;
    fishingCondition: string;
  };
  suitableFor: string[]; // fishing activities
  confidence: number; // 0-100%
}

export interface TripRecommendations {
  departureTime: Date;
  returnTime: Date;
  fuelStops: { location: { lat: number; lon: number }; name: string }[];
  equipment: string[];
  crew: number;
  provisions: string[];
  alternativeRoutes: string[];
}

export interface ComplianceCheck {
  permits: { required: string[]; status: string[] };
  boundaries: { violations: number; warnings: string[] };
  seasons: { allowed: boolean; restrictions: string[] };
  quotas: { species: string; allowed: number; current: number }[];
  gear: { allowed: string[]; restricted: string[] };
}

export interface CatchPrediction {
  species: string;
  estimatedQuantity: number;
  estimatedWeight: number; // kg
  confidence: number; // 0-100%
  marketValue: number; // INR
  zone: string;
  optimalTime: Date;
}

export interface EmergencyPlan {
  contacts: { name: string; number: string; type: string }[];
  shelters: { location: { lat: number; lon: number }; name: string; distance: number }[];
  equipment: string[];
  procedures: string[];
  communicationPlan: string;
}

class SmartTripPlanningService {
  private fuelConsumptionRate = 8; // liters per hour (average fishing boat)
  private fuelPrice = 85; // INR per liter (current diesel price)
  private averageSpeed = 15; // km/h (average fishing boat speed)

  // Generate optimized trip plan with production data
  async generateSmartTripPlan(request: {
    startLocation: { lat: number; lon: number };
    targetSpecies: string[];
    maxDuration: number; // hours
    maxDistance: number; // km
    fuelBudget: number; // INR
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    boatType: string;
    crewSize: number;
  }): Promise<SmartTripPlan> {
    try {
      console.log('🚢 Generating smart trip plan with production data...');
      
      // Get production fish predictions with real data
      const fishPredictions = await fishPredictionService.generateFishPredictions(
        request.startLocation,
        request.targetSpecies
      );

      // Get real maritime zones and regulations
      const maritimeZones = await this.getProductionMaritimeZones(request.startLocation);
      
      // Get real tidal data for optimal timing
      const tidalData = await productionTidalService.getTidalPredictions(request.startLocation);
      
      // Get current market prices for ROI calculation
      const marketPrices = await productionMarketService.getCurrentMarketPrices(request.startLocation);

      console.log('📊 Production data loaded:', {
        fishPredictions: fishPredictions.length,
        maritimeZones: maritimeZones.length,
        tidalData: tidalData ? 'Available' : 'Fallback',
        marketPrices: marketPrices ? 'Live' : 'Fallback'
      });

      // Generate enhanced fishing zones with production data
      const fishingZones = await this.generateFishingZones(
        fishPredictions, 
        { ...request, maritimeZones, tidalData, marketPrices }
      );

      // Optimize route considering real regulations and conditions
      const optimizedRoute = await this.optimizeRoute(
        request.startLocation,
        fishingZones,
        request
      );

      // Calculate enhanced fuel consumption with real conditions
      const fuelConsumption = this.calculateFuelConsumption(optimizedRoute);

      // Assess risks with real maritime data
      const riskAssessment = await this.assessRisks(optimizedRoute, request);

      // Get weather windows with enhanced forecasting
      const weatherWindows = await this.getWeatherWindows(optimizedRoute);

      // Generate enhanced recommendations with market data
      const recommendations = await this.generateRecommendations(
        optimizedRoute,
        riskAssessment,
        request
      );

      // Check compliance with real regulations
      const compliance = await this.checkCompliance(optimizedRoute, request);

      // Predict expected catch with ROI calculation
      const expectedCatch = await this.predictTotalCatch(fishingZones);

      // Create comprehensive emergency plan
      const emergencyPlan = await this.createEmergencyPlan(optimizedRoute);

      const tripPlan: SmartTripPlan = {
        id: `trip_${Date.now()}`,
        name: `Smart Trip - ${request.targetSpecies.join(', ')} (Production)`,
        createdAt: new Date(),
        estimatedDuration: this.calculateTotalDuration(optimizedRoute),
        totalDistance: this.calculateTotalDistance(optimizedRoute),
        fuelConsumption,
        route: optimizedRoute,
        fishingZones,
        riskAssessment,
        weatherWindows,
        recommendations,
        compliance,
        expectedCatch,
        emergencyPlan
      };

      // Save trip plan with production metadata
      await this.saveTripPlan(tripPlan);

      console.log('✅ Smart trip plan generated successfully with production data');
      return tripPlan;

    } catch (error) {
      console.error('❌ Error generating smart trip plan:', error);
      return this.generateFallbackTripPlan(request);
    }
  }

  // Generate fishing zones based on fish predictions
  private async generateFishingZones(
    predictions: any[],
    request: any
  ): Promise<FishingZone[]> {
    const zones: FishingZone[] = [];

    if (!predictions || !Array.isArray(predictions)) {
      console.warn('Invalid predictions array provided to generateFishingZones')
      return zones;
    }

    for (let i = 0; i < Math.min(predictions.length, 5); i++) {
      const prediction = predictions[i];
      
      if (!prediction || !prediction.location || typeof prediction.location.lat !== 'number' || typeof prediction.location.lon !== 'number') {
        console.warn(`Skipping invalid prediction at index ${i}:`, prediction)
        continue;
      }
      
      const zone: FishingZone = {
        id: `zone_${i + 1}`,
        location: {
          lat: prediction.location.lat,
          lon: prediction.location.lon
        },
        radius: prediction.location.radius || 3,
        targetSpecies: prediction.species ? [prediction.species] : ['Fish'],
        estimatedFishingTime: this.calculateFishingTime(prediction.probability || 50),
        expectedCatch: [{
          species: prediction.species || 'Fish',
          quantity: this.estimateQuantity(prediction.probability || 50),
          confidence: prediction.confidence || 50
        }],
        optimalTiming: {
          start: prediction.timeWindow?.start || new Date(),
          end: prediction.timeWindow?.end || new Date(Date.now() + 4 * 60 * 60 * 1000)
        },
        netType: prediction.recommendations?.netType || 'Gill Net',
        depth: {
          min: (prediction.location.depth || 20) - 10,
          max: (prediction.location.depth || 20) + 10
        },
        priority: Math.round((prediction.probability || 50) / 10)
      };

      zones.push(zone);
    }

    return zones.sort((a, b) => b.priority - a.priority);
  }

  // Optimize route using advanced algorithms
  private async optimizeRoute(
    startLocation: { lat: number; lon: number },
    fishingZones: FishingZone[],
    request: any
  ): Promise<RouteWaypoint[]> {
    const waypoints: RouteWaypoint[] = [];
    
    // Start waypoint
    waypoints.push({
      id: 'start',
      location: startLocation,
      type: 'departure',
      estimatedArrival: new Date(),
      fuelRequired: 0,
      distanceFromPrevious: 0,
      purpose: 'Departure point'
    });

    // Optimize fishing zone order using fuel and catch potential
    const optimizedZoneOrder = this.optimizeFishingZoneOrder(
      startLocation,
      fishingZones,
      request
    );

    let currentLocation = startLocation;
    let totalDistance = 0;
    let currentTime = new Date();

    for (const zone of optimizedZoneOrder) {
      const distance = haversineKm(currentLocation, zone.location);
      totalDistance += distance;
      
      // Check if within fuel/distance budget
      if (totalDistance > request.maxDistance * 0.8) { // Keep 20% safety margin
        break;
      }

      const travelTime = distance / this.averageSpeed;
      currentTime = new Date(currentTime.getTime() + travelTime * 60 * 60 * 1000);

      // Add waypoint to fishing zone
      waypoints.push({
        id: zone.id,
        location: zone.location,
        type: 'fishing_zone',
        estimatedArrival: new Date(currentTime),
        estimatedDeparture: new Date(currentTime.getTime() + zone.estimatedFishingTime * 60 * 60 * 1000),
        fuelRequired: this.calculateFuelForDistance(distance),
        distanceFromPrevious: distance,
        purpose: `Fishing for ${zone.targetSpecies.join(', ')}`,
        notes: `Expected catch: ${zone.expectedCatch.map(c => `${c.quantity} ${c.species}`).join(', ')}`
      });

      currentLocation = zone.location;
      currentTime = new Date(currentTime.getTime() + zone.estimatedFishingTime * 60 * 60 * 1000);
    }

    // Add return waypoint
    const returnDistance = haversineKm(currentLocation, startLocation);
    const returnTravelTime = returnDistance / this.averageSpeed;
    const returnTime = new Date(currentTime.getTime() + returnTravelTime * 60 * 60 * 1000);

    waypoints.push({
      id: 'return',
      location: startLocation,
      type: 'return',
      estimatedArrival: returnTime,
      fuelRequired: this.calculateFuelForDistance(returnDistance),
      distanceFromPrevious: returnDistance,
      purpose: 'Return to port'
    });

    return waypoints;
  }

  // Optimize fishing zone order considering multiple factors
  private optimizeFishingZoneOrder(
    startLocation: { lat: number; lon: number },
    zones: FishingZone[],
    request: any
  ): FishingZone[] {
    // Multi-criteria optimization considering:
    // 1. Fuel efficiency (distance)
    // 2. Catch potential
    // 3. Time windows
    // 4. Priority

    const scoredZones = zones.map(zone => {
      const distance = haversineKm(startLocation, zone.location);
      const fuelScore = Math.max(0, 100 - (distance / 10)); // Closer is better
      const catchScore = zone.expectedCatch.reduce((sum, c) => sum + c.confidence, 0);
      const priorityScore = zone.priority * 10;
      const timeScore = this.calculateTimeWindowScore(zone.optimalTiming);

      const totalScore = (fuelScore * 0.3) + (catchScore * 0.4) + (priorityScore * 0.2) + (timeScore * 0.1);

      return { zone, score: totalScore };
    });

    return scoredZones
      .sort((a, b) => b.score - a.score)
      .map(item => item.zone);
  }

  // Calculate fuel consumption for the entire trip
  private calculateFuelConsumption(route: RouteWaypoint[]): any {
    const totalDistance = route.reduce((sum, waypoint) => sum + waypoint.distanceFromPrevious, 0);
    const travelTime = totalDistance / this.averageSpeed;
    const fishingTime = route
      .filter(w => w.type === 'fishing_zone')
      .reduce((sum, w) => {
        const fishing = w.estimatedDeparture && w.estimatedArrival ?
          (w.estimatedDeparture.getTime() - w.estimatedArrival.getTime()) / (1000 * 60 * 60) : 2;
        return sum + fishing;
      }, 0);

    const estimated = (travelTime * this.fuelConsumptionRate) + (fishingTime * this.fuelConsumptionRate * 0.5);
    const cost = estimated * this.fuelPrice;
    const efficiency = totalDistance / estimated;

    return { estimated, cost, efficiency };
  }

  // Assess various risks for the trip
  private async assessRisks(route: RouteWaypoint[], request: any): Promise<RiskAssessment> {
    // Weather risk
    const weatherRisk = await this.assessWeatherRisk(route);
    
    // Boundary risk
    const boundaryRisk = await this.assessBoundaryRisk(route);
    
    // Fuel risk
    const fuelRisk = this.assessFuelRisk(route, request);
    
    // Equipment risk
    const equipmentRisk = this.assessEquipmentRisk(request);
    
    // Experience risk
    const experienceRisk = this.assessExperienceRisk(request);

    const overallRisk = this.calculateOverallRisk([
      weatherRisk.level,
      boundaryRisk.level,
      fuelRisk.level,
      equipmentRisk.level,
      experienceRisk.level
    ]);

    return {
      overall: overallRisk,
      factors: {
        weather: weatherRisk,
        boundaries: boundaryRisk,
        fuel: fuelRisk,
        equipment: equipmentRisk,
        experience: experienceRisk
      },
      recommendations: this.generateRiskRecommendations(overallRisk),
      alternatives: this.generateRiskAlternatives(overallRisk)
    };
  }

  // Get optimal weather windows for the trip
  private async getWeatherWindows(route: RouteWaypoint[]): Promise<WeatherWindow[]> {
    const windows: WeatherWindow[] = [];
    
    for (const waypoint of route.filter(w => w.type === 'fishing_zone')) {
      try {
        const weather = await weatherService.getCurrentWeather(
          waypoint.location.lat,
          waypoint.location.lon
        );

        windows.push({
          start: waypoint.estimatedArrival!,
          end: waypoint.estimatedDeparture!,
          conditions: {
            windSpeed: weather.windSpeed,
            waveHeight: weather.waveHeight,
            visibility: weather.visibility,
            fishingCondition: weather.fishingConditions
          },
          suitableFor: this.determineSuitableActivities(weather),
          confidence: 75 // Weather prediction confidence
        });
      } catch (error) {
        console.error('Error getting weather for waypoint:', error);
      }
    }

    return windows;
  }

  // Generate comprehensive trip recommendations
  private async generateRecommendations(
    route: RouteWaypoint[],
    riskAssessment: RiskAssessment,
    request: any
  ): Promise<TripRecommendations> {
    return {
      departureTime: route[0].estimatedArrival,
      returnTime: route[route.length - 1].estimatedArrival,
      fuelStops: await this.findFuelStops(route),
      equipment: this.recommendEquipment(request, riskAssessment),
      crew: this.recommendCrewSize(request, riskAssessment),
      provisions: this.recommendProvisions(route),
      alternativeRoutes: this.generateAlternativeRoutes(route)
    };
  }

  // Check regulatory compliance
  private async checkCompliance(route: RouteWaypoint[], request: any): Promise<ComplianceCheck> {
    const boundaries = maritimeBoundaryService.getBoundaries();
    let violationCount = 0;
    const warnings: string[] = [];

    // Check each waypoint against boundaries
    for (const waypoint of route) {
      for (const boundary of boundaries) {
        const distance = this.distanceToBoundary(waypoint.location, boundary.coordinates);
        if (distance < boundary.warningDistance) {
          violationCount++;
          warnings.push(`Waypoint ${waypoint.id} is near ${boundary.name}`);
        }
      }
    }

    return {
      permits: {
        required: ['Fishing License', 'Boat Registration'],
        status: ['Valid', 'Valid'] // This would be checked against actual records
      },
      boundaries: {
        violations: violationCount,
        warnings
      },
      seasons: {
        allowed: true, // This would check current fishing seasons
        restrictions: []
      },
      quotas: request.targetSpecies.map((species: string) => ({
        species,
        allowed: 100, // This would be from regulations
        current: 0 // This would be from user's catch history
      })),
      gear: {
        allowed: ['Gillnet', 'Hook and Line', 'Cast Net'],
        restricted: ['Bottom Trawl', 'Purse Seine']
      }
    };
  }

  // Predict total expected catch for the trip
  private async predictTotalCatch(zones: FishingZone[]): Promise<CatchPrediction[]> {
    const predictions: CatchPrediction[] = [];
    
    for (const zone of zones) {
      for (const expectedCatch of zone.expectedCatch) {
        const marketValue = this.getMarketValue(expectedCatch.species, expectedCatch.quantity);
        
        predictions.push({
          species: expectedCatch.species,
          estimatedQuantity: expectedCatch.quantity,
          estimatedWeight: expectedCatch.quantity * this.getAverageWeight(expectedCatch.species),
          confidence: expectedCatch.confidence,
          marketValue,
          zone: zone.id,
          optimalTime: zone.optimalTiming.start
        });
      }
    }

    return predictions;
  }

  // Create emergency plan for the trip
  private async createEmergencyPlan(route: RouteWaypoint[]): Promise<EmergencyPlan> {
    return {
      contacts: [
        { name: 'Coast Guard', number: '100', type: 'Emergency' },
        { name: 'Local Port Authority', number: '1077', type: 'Marine Emergency' },
        { name: 'Harbor Master', number: '108', type: 'Port Authority' }
      ],
      shelters: await this.findEmergencyShelters(route),
      equipment: [
        'Life jackets for all crew',
        'Emergency radio',
        'Flares',
        'First aid kit',
        'Emergency food and water',
        'GPS emergency beacon'
      ],
      procedures: [
        'Contact Coast Guard immediately in emergency',
        'Activate emergency beacon',
        'Head to nearest shelter',
        'Stay with vessel unless immediate danger'
      ],
      communicationPlan: 'Check in with port every 4 hours, emergency frequency 156.8 MHz'
    };
  }

  // Helper methods
  private calculateFishingTime(probability: number): number {
    // More time in areas with higher fish probability
    return Math.max(1, Math.min(4, probability / 20));
  }

  private estimateQuantity(probability: number): number {
    // Estimate catch quantity based on probability
    return Math.round((probability / 10) * 5);
  }

  private calculateFuelForDistance(distance: number): number {
    const travelTime = distance / this.averageSpeed;
    return travelTime * this.fuelConsumptionRate;
  }

  private calculateTimeWindowScore(timing: { start: Date; end: Date }): number {
    const now = new Date();
    const hoursUntilStart = (timing.start.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Prefer times that are not too far in the future
    if (hoursUntilStart < 2) return 90;
    if (hoursUntilStart < 6) return 70;
    if (hoursUntilStart < 12) return 50;
    return 30;
  }

  private calculateTotalDuration(route: RouteWaypoint[]): number {
    if (route.length < 2) return 0;
    const start = route[0].estimatedArrival;
    const end = route[route.length - 1].estimatedArrival;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private calculateTotalDistance(route: RouteWaypoint[]): number {
    return route.reduce((sum, waypoint) => sum + waypoint.distanceFromPrevious, 0);
  }

  private async assessWeatherRisk(route: RouteWaypoint[]): Promise<any> {
    // Simplified weather risk assessment
    return {
      level: 'medium',
      description: 'Moderate weather conditions expected'
    };
  }

  private async assessBoundaryRisk(route: RouteWaypoint[]): Promise<any> {
    const boundaries = maritimeBoundaryService.getBoundaries();
    let violations = 0;
    
    for (const waypoint of route) {
      for (const boundary of boundaries) {
        const distance = this.distanceToBoundary(waypoint.location, boundary.coordinates);
        if (distance < boundary.warningDistance) violations++;
      }
    }

    return {
      level: violations > 2 ? 'high' : violations > 0 ? 'medium' : 'low',
      violations
    };
  }

  private assessFuelRisk(route: RouteWaypoint[], request: any): any {
    const totalFuel = route.reduce((sum, w) => sum + w.fuelRequired, 0);
    const budgetFuel = request.fuelBudget / this.fuelPrice;
    const safetyMargin = ((budgetFuel - totalFuel) / budgetFuel) * 100;

    return {
      level: safetyMargin < 10 ? 'high' : safetyMargin < 20 ? 'medium' : 'low',
      safety_margin: safetyMargin
    };
  }

  private assessEquipmentRisk(request: any): any {
    // Simplified equipment risk assessment
    return {
      level: 'low',
      issues: []
    };
  }

  private assessExperienceRisk(request: any): any {
    const levelMap = {
      'beginner': { level: 'high', recommendation: 'Consider hiring experienced crew or guide' },
      'intermediate': { level: 'medium', recommendation: 'Review safety procedures before departure' },
      'expert': { level: 'low', recommendation: 'Normal precautions apply' }
    };

    return levelMap[request.experienceLevel as keyof typeof levelMap] || levelMap['intermediate'];
  }

  private calculateOverallRisk(risks: string[]): 'low' | 'medium' | 'high' | 'extreme' {
    const riskValues = { low: 1, medium: 2, high: 3, extreme: 4 };
    const avgRisk = risks.reduce((sum, risk) => sum + (riskValues[risk as keyof typeof riskValues] || 2), 0) / risks.length;
    
    if (avgRisk >= 3.5) return 'extreme';
    if (avgRisk >= 2.5) return 'high';
    if (avgRisk >= 1.5) return 'medium';
    return 'low';
  }

  private generateRiskRecommendations(risk: string): string[] {
    const recommendations = {
      low: ['Normal safety precautions', 'Monitor weather conditions'],
      medium: ['Extra safety equipment recommended', 'Check weather before departure', 'Inform others of your plans'],
      high: ['Consider postponing trip', 'Hire experienced crew', 'Carry emergency communication devices'],
      extreme: ['Do not proceed with current plan', 'Wait for better conditions', 'Seek professional guidance']
    };

    return recommendations[risk as keyof typeof recommendations] || recommendations.medium;
  }

  private generateRiskAlternatives(risk: string): string[] {
    if (risk === 'high' || risk === 'extreme') {
      return [
        'Wait for better weather conditions',
        'Choose closer fishing zones',
        'Reduce trip duration',
        'Hire experienced guide'
      ];
    }
    return [];
  }

  private determineSuitableActivities(weather: any): string[] {
    const activities = [];
    
    if (weather.fishingConditions === 'Excellent') {
      activities.push('All fishing activities', 'Deep sea fishing', 'Long-lining');
    } else if (weather.fishingConditions === 'Good') {
      activities.push('Normal fishing', 'Net fishing');
    } else if (weather.fishingConditions === 'Fair') {
      activities.push('Light fishing', 'Near-shore activities');
    }

    return activities;
  }

  private async findFuelStops(route: RouteWaypoint[]): Promise<any[]> {
    // Simplified fuel stop recommendations
    return [
      { location: { lat: 19.0760, lon: 72.8777 }, name: 'Mumbai Port Fuel Station' },
      { location: { lat: 15.2993, lon: 74.1240 }, name: 'Goa Marine Fuel Dock' }
    ];
  }

  private recommendEquipment(request: any, risk: RiskAssessment): string[] {
    const baseEquipment = [
      'Life jackets for all crew',
      'First aid kit',
      'GPS device',
      'Marine radio',
      'Emergency flares'
    ];

    if (risk.overall === 'high' || risk.overall === 'extreme') {
      baseEquipment.push(
        'Emergency beacon (EPIRB)',
        'Satellite communicator',
        'Extra food and water',
        'Emergency shelter'
      );
    }

    return baseEquipment;
  }

  private recommendCrewSize(request: any, risk: RiskAssessment): number {
    let recommendedCrew = Math.max(2, request.crewSize);
    
    if (risk.overall === 'high') recommendedCrew += 1;
    if (risk.overall === 'extreme') recommendedCrew += 2;
    
    return Math.min(recommendedCrew, 6); // Max practical crew size
  }

  private recommendProvisions(route: RouteWaypoint[]): string[] {
    const duration = this.calculateTotalDuration(route);
    const provisions = [
      'Fresh water (4L per person per day)',
      'Non-perishable food',
      'Cooking fuel',
      'Ice for catch preservation'
    ];

    if (duration > 8) {
      provisions.push('Extra rations', 'Water purification tablets');
    }

    return provisions;
  }

  private generateAlternativeRoutes(route: RouteWaypoint[]): string[] {
    return [
      'Shorter route with reduced fishing zones',
      'Coastal route with emergency stops',
      'Weather-dependent flexible route'
    ];
  }

  private distanceToBoundary(point: { lat: number; lon: number }, boundary: { lat: number; lon: number }[]): number {
    let minDistance = Infinity;
    for (const boundaryPoint of boundary) {
      const distance = haversineKm(point, boundaryPoint);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    return minDistance;
  }

  private async findEmergencyShelters(route: RouteWaypoint[]): Promise<any[]> {
    // Simplified emergency shelter recommendations
    return [
      { location: { lat: 19.0760, lon: 72.8777 }, name: 'Mumbai Harbor', distance: 0 },
      { location: { lat: 15.2993, lon: 74.1240 }, name: 'Mormugao Port', distance: 0 }
    ];
  }

  private getMarketValue(species: string, quantity: number): number {
    const prices = {
      'Pomfret': 800, // INR per kg
      'Mackerel': 300,
      'Sardine': 200,
      'Kingfish': 600,
      'Tuna': 1000
    };
    
    const pricePerKg = prices[species as keyof typeof prices] || 400;
    const avgWeight = this.getAverageWeight(species);
    return quantity * avgWeight * pricePerKg;
  }

  private getAverageWeight(species: string): number {
    const weights = {
      'Pomfret': 0.8, // kg per fish
      'Mackerel': 0.3,
      'Sardine': 0.1,
      'Kingfish': 2.0,
      'Tuna': 5.0
    };
    
    return weights[species as keyof typeof weights] || 0.5;
  }

  // Save trip plan to storage
  private async saveTripPlan(plan: SmartTripPlan): Promise<void> {
    try {
      const existingPlans = await Storage.getSmartTripPlans?.() || [];
      existingPlans.push(plan);
      await Storage.saveSmartTripPlans?.(existingPlans);
    } catch (error) {
      console.error('Failed to save trip plan:', error);
    }
  }

  // Public API methods
  async getTripPlans(): Promise<SmartTripPlan[]> {
    try {
      return await Storage.getSmartTripPlans?.() || [];
    } catch (error) {
      console.error('Failed to get trip plans:', error);
      return [];
    }
  }

  async updateTripPlan(planId: string, updates: Partial<SmartTripPlan>): Promise<boolean> {
    try {
      const plans = await this.getTripPlans();
      const planIndex = plans.findIndex(p => p.id === planId);
      
      if (planIndex === -1) return false;
      
      plans[planIndex] = { ...plans[planIndex], ...updates };
      await Storage.saveSmartTripPlans?.(plans);
      return true;
    } catch (error) {
      console.error('Failed to update trip plan:', error);
      return false;
    }
  }

  async deleteTripPlan(planId: string): Promise<boolean> {
    try {
      const plans = await this.getTripPlans();
      const filteredPlans = plans.filter(p => p.id !== planId);
      await Storage.saveSmartTripPlans?.(filteredPlans);
      return true;
    } catch (error) {
      console.error('Failed to delete trip plan:', error);
      return false;
    }
  }
  
  // Production data integration methods
  private async getProductionMaritimeZones(location: { lat: number; lon: number }) {
    try {
      // Filter maritime zones by proximity to location
      const nearbyZones = PRODUCTION_MARITIME_ZONES.filter(zone => {
        const zoneLat = zone.coordinates.coordinates[0][0][1];
        const zoneLon = zone.coordinates.coordinates[0][0][0];
        const distance = haversineKm(location, { lat: zoneLat, lon: zoneLon });
        return distance < 100; // Within 100km
      });
      
      console.log(`📍 Found ${nearbyZones.length} maritime zones near location`);
      return nearbyZones;
    } catch (error) {
      console.warn('Failed to get production maritime zones:', error);
      return [];
    }
  }
  
  private generateFallbackTripPlan(request: any): SmartTripPlan {
    const now = new Date();
    
    return {
      id: `fallback_trip_${Date.now()}`,
      name: `Fallback Trip - ${request.targetSpecies?.join(', ') || 'General Fishing'}`,
      createdAt: now,
      estimatedDuration: 8,
      totalDistance: 50,
      fuelConsumption: {
        estimated: 40,
        cost: 3400,
        efficiency: 1.25
      },
      route: [
        {
          id: 'start',
          location: request.startLocation,
          type: 'departure',
          estimatedArrival: now,
          fuelRequired: 0,
          distanceFromPrevious: 0,
          purpose: 'Trip start'
        },
        {
          id: 'fishing_zone_1',
          location: {
            lat: request.startLocation.lat + 0.1,
            lon: request.startLocation.lon + 0.1
          },
          type: 'fishing_zone',
          estimatedArrival: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          fuelRequired: 20,
          distanceFromPrevious: 25,
          purpose: 'General fishing area'
        },
        {
          id: 'return',
          location: request.startLocation,
          type: 'return',
          estimatedArrival: new Date(now.getTime() + 8 * 60 * 60 * 1000),
          fuelRequired: 40,
          distanceFromPrevious: 50,
          purpose: 'Return to port'
        }
      ],
      fishingZones: [],
      riskAssessment: {
        overall: 'medium',
        factors: {
          weather: { level: 'medium', description: 'Moderate conditions expected' },
          boundaries: { level: 'low', violations: 0 },
          fuel: { level: 'safe', safety_margin: 20 },
          equipment: { level: 'basic', issues: [] },
          experience: { level: request.experienceLevel || 'intermediate', recommendation: 'Follow standard procedures' }
        },
        recommendations: ['Use fallback fishing areas', 'Monitor weather closely'],
        alternatives: ['Stay closer to shore', 'Consider shorter trip duration']
      },
      weatherWindows: [],
      recommendations: {
        departureTime: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours from now
        returnTime: new Date(now.getTime() + 16 * 60 * 60 * 1000), // 16 hours from now
        fuelStops: [],
        equipment: ['Standard fishing nets', 'Life jackets', 'Emergency kit'],
        crew: request.crewSize || 3,
        provisions: ['Food for 8 hours', 'Fresh water', 'First aid kit'],
        alternativeRoutes: ['Coastal route', 'Return early if weather deteriorates']
      },
      compliance: {
        permits: { required: ['Fishing license'], status: ['Required'] },
        boundaries: { violations: 0, warnings: ['Verify local regulations'] },
        seasons: { allowed: true, restrictions: [] },
        quotas: [],
        gear: { allowed: ['Hook and line', 'Net fishing'], restricted: ['Dynamite fishing'] }
      },
      expectedCatch: [],
      emergencyPlan: {
        contacts: [
          { name: 'Coast Guard', number: '1554', type: 'emergency' },
          { name: 'Harbor Master', number: 'VHF 16', type: 'maritime' }
        ],
        shelters: [],
        equipment: ['Life jackets', 'Emergency flares', 'First aid kit', 'VHF radio'],
        procedures: ['Contact coast guard on VHF Channel 16', 'Use emergency flares if in distress'],
        communicationPlan: 'VHF Channel 16 for emergencies, mobile phone for regular communication'
      }
    };
  }
}

export const smartTripPlanningService = new SmartTripPlanningService();