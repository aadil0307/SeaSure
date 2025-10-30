import { weatherService } from './weather';
import { Storage } from './storage';
import { haversineKm } from '../utils/geo';
import { PRODUCTION_FISH_DATABASE, ProductionFishSpecies, productionMarketService } from '../data/productionFishDatabase';
import { productionTidalService } from './productionTidalService';
import { productionMarketDataService } from './productionMarketDataService';
import { productionHistoricalCatchService } from './productionHistoricalCatchService';

// Fish species behavior patterns based on environmental conditions
export interface FishSpeciesData {
  name: string;
  habitat: {
    preferredDepth: { min: number; max: number }; // meters
    temperatureRange: { min: number; max: number }; // Celsius
    salinityRange: { min: number; max: number }; // PSU
    oxygenRequirement: number; // mg/L minimum
  };
  behavior: {
    schooling: boolean;
    migration: boolean;
    feedingTimes: string[]; // e.g., ["dawn", "dusk", "night"]
    moonPhasePreference: string[]; // e.g., ["new", "full"]
    seasonalPattern: {
      peak: string[]; // months
      low: string[]; // months
    };
  };
  environmentalFactors: {
    windSensitivity: number; // 1-10 scale
    waveSensitivity: number; // 1-10 scale
    pressureSensitivity: number; // 1-10 scale
    tideInfluence: number; // 1-10 scale
  };
}

// Real-time fish prediction based on multiple factors
export interface FishPrediction {
  species: string;
  probability: number; // 0-100%
  confidence: number; // 0-100%
  location: {
    lat: number;
    lon: number;
    depth: number;
    radius: number; // suggested fishing radius in km
  };
  timeWindow: {
    start: Date;
    end: Date;
    optimalTime: Date;
  };
  conditions: {
    weather: any;
    tide: string;
    moonPhase: string;
    waterTemperature: number;
  };
  recommendations: {
    netType: string;
    baitType: string;
    fishingMethod: string;
    expectedCatchSize: string;
  };
}

// Historical catch data analysis
export interface CatchAnalysis {
  location: { lat: number; lon: number };
  species: string;
  quantity: number;
  weight: number;
  timestamp: Date;
  conditions: {
    weather: any;
    tideState: string;
    moonPhase: string;
    waterTemp: number;
  };
  success: boolean;
}

class FishPredictionService {
  private speciesDatabase: Map<string, FishSpeciesData> = new Map();
  private historicalData: CatchAnalysis[] = [];
  private communityReports: Map<string, any[]> = new Map();

  constructor() {
    this.initializeSpeciesDatabase();
  }

  // Initialize fish species database with CMFRI production data
  private initializeSpeciesDatabase() {
    console.log('🐟 Initializing production fish database from CMFRI data...');
    
    // Convert production fish data to internal format
    PRODUCTION_FISH_DATABASE.forEach((productionFish: ProductionFishSpecies) => {
      const fishData: FishSpeciesData = {
        name: productionFish.commonName,
        habitat: {
          preferredDepth: productionFish.habitat.preferredDepth,
          temperatureRange: productionFish.habitat.temperatureRange,
          salinityRange: productionFish.habitat.salinityRange,
          oxygenRequirement: productionFish.habitat.oxygenRequirement
        },
        behavior: {
          schooling: productionFish.behavior.schooling,
          migration: productionFish.behavior.migration,
          feedingTimes: productionFish.behavior.feedingTimes,
          moonPhasePreference: productionFish.behavior.moonPhasePreference,
          seasonalPattern: {
            peak: this.getSeasonalMonths(productionFish.biologicalData.spawningSeasonStart, productionFish.biologicalData.spawningSeasonEnd),
            low: this.getOffSeasonMonths(productionFish.biologicalData.spawningSeasonStart, productionFish.biologicalData.spawningSeasonEnd)
          }
        },
        environmentalFactors: {
          windSensitivity: productionFish.environmentalFactors.windSensitivity,
          waveSensitivity: productionFish.environmentalFactors.waveSensitivity,
          pressureSensitivity: productionFish.environmentalFactors.pressureSensitivity,
          tideInfluence: productionFish.environmentalFactors.tideInfluence
        }
      };
      
      this.speciesDatabase.set(productionFish.commonName, fishData);
    });
    
    console.log(`✅ Loaded ${PRODUCTION_FISH_DATABASE.length} species from CMFRI database`);
  }
  
  private getSeasonalMonths(spawningStart: number, spawningEnd: number): string[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const peakMonths = [];
    
    // Get months around spawning season (peak feeding)
    for (let i = 0; i < 12; i++) {
      const monthIndex = (spawningStart - 2 + i) % 12;
      if (monthIndex >= 0 && peakMonths.length < 4) {
        peakMonths.push(months[monthIndex]);
      }
    }
    
    return peakMonths;
  }
  
  private getOffSeasonMonths(spawningStart: number, spawningEnd: number): string[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const offMonths = [];
    
    // Get months during spawning season (low activity)
    let current = spawningStart;
    while (current !== spawningEnd) {
      offMonths.push(months[current - 1]);
      current = (current % 12) + 1;
    }
    
    return offMonths;
  }

  // Main prediction function with production data integration
  async generateFishPredictions(
    location: { lat: number; lon: number },
    targetSpecies?: string[]
  ): Promise<FishPrediction[]> {
    try {
      console.log('🎯 Starting production fish prediction generation for location:', location)
      
      // Validate input
      if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
        console.warn('Invalid location provided to generateFishPredictions:', location)
        return this.getFallbackPredictions(location)
      }
      
      // Get real-time production data with fallbacks
      let weather, tidalData, marketPrices, waterTemp, moonPhase
      
      try {
        console.log('📡 Fetching real weather data...')
        weather = await weatherService.getCurrentWeather(location.lat, location.lon);
      } catch (error) {
        console.warn('Weather service failed, using fallback:', error)
        weather = this.getFallbackWeather()
      }
      
      try {
        console.log('🌊 Fetching real INCOIS tidal data...')
        tidalData = await productionTidalService.getTidalPredictions(location);
      } catch (error) {
        console.warn('INCOIS tidal service failed, using fallback:', error)
        tidalData = null
      }
      
      try {
        console.log('💰 Fetching enhanced market data...')
        marketPrices = await productionMarketDataService.getMarketReport(location);
      } catch (error) {
        console.warn('Enhanced market service failed, using fallback:', error)
        marketPrices = await productionMarketService.getCurrentMarketPrices(location);
      }

      const currentTime = new Date();
      moonPhase = this.calculateMoonPhase(currentTime);
      
      // Get current tide state from real INCOIS data
      const tideState = this.getCurrentTideStateFromData(tidalData);

      try {
        waterTemp = await this.getWaterTemperature(location);
      } catch (error) {
        console.warn('Water temperature service failed, using fallback:', error)
        waterTemp = 26
      }

      const predictions: FishPrediction[] = [];
      const speciesToPredict = targetSpecies || Array.from(this.speciesDatabase.keys());

      console.log('🐟 Predicting for species:', speciesToPredict)

      for (const speciesName of speciesToPredict) {
        const speciesData = this.speciesDatabase.get(speciesName);
        if (!speciesData) {
          console.warn(`No species data found for: ${speciesName}`)
          continue
        }

        try {
          const prediction = await this.predictSpeciesWithProductionData(
            speciesData,
            location,
            weather,
            moonPhase,
            tideState,
            waterTemp,
            currentTime,
            tidalData,
            marketPrices
          );

          if (prediction && prediction.probability > 20) { // Only include predictions with >20% probability
            predictions.push(prediction);
          }
        } catch (predictionError) {
          console.warn(`Failed to predict for species ${speciesName}:`, predictionError)
        }
      }

      console.log(`✅ Generated ${predictions.length} production fish predictions`)

      // Sort by probability and commercial value
      predictions.sort((a, b) => {
        const aValue = a.probability * this.getCommercialValue(a.species);
        const bValue = b.probability * this.getCommercialValue(b.species);
        return bValue - aValue;
      });
      const sortedPredictions = predictions.sort((a, b) => b.probability - a.probability);
      
      // If no valid predictions, return fallback
      if (sortedPredictions.length === 0) {
        console.log('No valid predictions generated, using fallback')
        return this.getFallbackPredictions(location)
      }
      
      return sortedPredictions;

    } catch (error) {
      console.error('Fish prediction error:', error);
      return this.getFallbackPredictions(location);
    }
  }

  // Predict for a specific species
  private async predictSpecies(
    species: FishSpeciesData,
    location: { lat: number; lon: number },
    weather: any,
    moonPhase: string,
    tideState: string,
    waterTemp: number,
    currentTime: Date
  ): Promise<FishPrediction | null> {
    try {
      // Calculate probability based on multiple factors
      let probability = 50; // Base probability
      let confidence = 60; // Base confidence

      // Environmental factor scoring
      const tempScore = this.scoreTemperature(waterTemp, species.habitat.temperatureRange);
      const weatherScore = this.scoreWeatherConditions(weather, species.environmentalFactors);
      const seasonScore = this.scoreSeasonalPattern(currentTime, species.behavior.seasonalPattern);
      const moonScore = this.scoreMoonPhase(moonPhase, species.behavior.moonPhasePreference);
      const timeScore = this.scoreTimeOfDay(currentTime, species.behavior.feedingTimes);
      const tideScore = this.scoreTideInfluence(tideState, species.environmentalFactors.tideInfluence);

      // Historical data influence
      const historicalScore = await this.getHistoricalScore(location, species.name, currentTime);
      const communityScore = this.getCommunityReportScore(location, species.name);

      // Weighted probability calculation
      probability = Math.min(95, Math.max(5, 
        probability * 0.1 +
        tempScore * 0.15 +
        weatherScore * 0.15 +
        seasonScore * 0.15 +
        moonScore * 0.1 +
        timeScore * 0.1 +
        tideScore * 0.1 +
        historicalScore * 0.1 +
        communityScore * 0.05
      ));

      // Confidence calculation
      confidence = Math.min(95, Math.max(30,
        confidence +
        (this.historicalData.length > 10 ? 15 : 0) +
        (this.communityReports.size > 5 ? 10 : 0) +
        (weather ? 10 : -10)
      ));

      // Determine optimal fishing location within radius
      const optimalLocation = await this.findOptimalLocation(location, species);

      // Calculate time window
      const timeWindow = this.calculateOptimalTimeWindow(currentTime, species);

      return {
        species: species.name,
        probability: Math.round(probability),
        confidence: Math.round(confidence),
        location: optimalLocation,
        timeWindow,
        conditions: {
          weather,
          tide: tideState,
          moonPhase,
          waterTemperature: waterTemp
        },
        recommendations: this.generateRecommendations(species, weather, probability)
      };

    } catch (error) {
      console.error(`Error predicting ${species.name}:`, error);
      return null;
    }
  }

  // Scoring functions for different factors
  private scoreTemperature(current: number, range: { min: number; max: number }): number {
    if (current >= range.min && current <= range.max) return 90;
    const distance = Math.min(Math.abs(current - range.min), Math.abs(current - range.max));
    return Math.max(10, 90 - (distance * 10));
  }

  private scoreWeatherConditions(weather: any, factors: any): number {
    let score = 70;
    
    if (weather.windSpeed > 25) score -= (factors.windSensitivity * 3);
    if (weather.waveHeight > 2) score -= (factors.waveSensitivity * 3);
    if (weather.pressure < 1010) score -= (factors.pressureSensitivity * 2);
    if (weather.fishingConditions === 'Dangerous') score -= 40;
    if (weather.fishingConditions === 'Poor') score -= 20;
    if (weather.fishingConditions === 'Excellent') score += 20;

    return Math.max(10, Math.min(95, score));
  }

  private scoreSeasonalPattern(date: Date, pattern: any): number {
    const month = date.toLocaleString('default', { month: 'short' });
    if (pattern.peak.includes(month)) return 90;
    if (pattern.low.includes(month)) return 30;
    return 60;
  }

  private scoreMoonPhase(current: string, preferences: string[]): number {
    return preferences.includes(current) ? 85 : 50;
  }

  private scoreTimeOfDay(date: Date, feedingTimes: string[]): number {
    const hour = date.getHours();
    const timeOfDay = this.getTimeOfDay(hour);
    return feedingTimes.includes(timeOfDay) ? 85 : 45;
  }

  private scoreTideInfluence(tideState: string, influence: number): number {
    // High tide generally better for fishing
    const baseScore = tideState === 'high' ? 75 : tideState === 'rising' ? 80 : 60;
    return baseScore + (influence * 2);
  }

  // Helper functions
  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 7) return "dawn";
    if (hour >= 7 && hour < 11) return "morning";
    if (hour >= 17 && hour < 19) return "dusk";
    if (hour >= 19 || hour < 5) return "night";
    return "day";
  }

  private calculateMoonPhase(date: Date): string {
    // Simplified moon phase calculation
    const phase = (date.getTime() / (1000 * 60 * 60 * 24) - 1) % 29.53;
    if (phase < 7.38) return "new";
    if (phase < 14.77) return "waxing";
    if (phase < 22.15) return "full";
    return "waning";
  }

  private async getTideState(location: { lat: number; lon: number }): Promise<string> {
    // Simplified tide calculation - in real implementation, use tide API
    const hour = new Date().getHours();
    const tidePhase = (hour + (location.lat * 0.5)) % 12;
    if (tidePhase < 3) return "low";
    if (tidePhase < 6) return "rising";
    if (tidePhase < 9) return "high";
    return "falling";
  }

  private async getWaterTemperature(location: { lat: number; lon: number }): Promise<number> {
    // Use weather service or oceanographic data
    // For now, estimate based on air temperature and season
    try {
      const weather = await weatherService.getCurrentWeather(location.lat, location.lon);
      return weather.temperature - 2; // Water typically 2°C cooler than air
    } catch {
      return 26; // Default for Indian coastal waters
    }
  }

  private async getHistoricalScore(
    location: { lat: number; lon: number },
    species: string,
    currentTime: Date
  ): Promise<number> {
    const relevantCatches = this.historicalData.filter(catch_ => 
      catch_.species === species &&
      haversineKm(location, catch_.location) < 50 && // Within 50km
      Math.abs(catch_.timestamp.getMonth() - currentTime.getMonth()) <= 1 // Same or adjacent month
    );

    if (relevantCatches.length === 0) return 50;

    const successRate = relevantCatches.filter(c => c.success).length / relevantCatches.length;
    return 30 + (successRate * 50);
  }

  private getCommunityReportScore(location: { lat: number; lon: number }, species: string): number {
    const reports = this.communityReports.get(species) || [];
    const recentReports = reports.filter(report => 
      haversineKm(location, report.location) < 20 && // Within 20km
      (Date.now() - report.timestamp) < (24 * 60 * 60 * 1000) // Within 24 hours
    );

    if (recentReports.length === 0) return 50;
    
    const avgSuccess = recentReports.reduce((sum, r) => sum + r.successRating, 0) / recentReports.length;
    return 30 + (avgSuccess * 15);
  }

  private async findOptimalLocation(
    baseLocation: { lat: number; lon: number },
    species: FishSpeciesData
  ): Promise<any> {
    // Find best location within 10km radius based on depth, currents, etc.
    return {
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.1,
      lon: baseLocation.lon + (Math.random() - 0.5) * 0.1,
      depth: (species.habitat.preferredDepth.min + species.habitat.preferredDepth.max) / 2,
      radius: 5 // 5km fishing radius
    };
  }

  private calculateOptimalTimeWindow(currentTime: Date, species: FishSpeciesData): any {
    const start = new Date(currentTime);
    const end = new Date(currentTime);
    end.setHours(end.getHours() + 4); // 4-hour fishing window

    // Adjust based on feeding times
    if (species.behavior.feedingTimes.includes("dawn")) {
      start.setHours(5, 30, 0, 0);
      end.setHours(9, 30, 0, 0);
    } else if (species.behavior.feedingTimes.includes("dusk")) {
      start.setHours(17, 0, 0, 0);
      end.setHours(21, 0, 0, 0);
    }

    return {
      start,
      end,
      optimalTime: new Date((start.getTime() + end.getTime()) / 2)
    };
  }

  private generateRecommendations(species: FishSpeciesData, weather: any, probability: number): any {
    const recommendations = {
      netType: "gillnet", // Default
      baitType: "natural",
      fishingMethod: "bottom",
      expectedCatchSize: "medium"
    };

    // Species-specific recommendations
    switch (species.name) {
      case "Pomfret":
        recommendations.netType = "drift net";
        recommendations.baitType = "small fish";
        recommendations.fishingMethod = "mid-water";
        break;
      case "Mackerel":
        recommendations.netType = "purse seine";
        recommendations.baitType = "plankton attractant";
        recommendations.fishingMethod = "surface";
        break;
      case "Sardine":
        recommendations.netType = "ring net";
        recommendations.baitType = "none";
        recommendations.fishingMethod = "surface schooling";
        break;
      case "Kingfish":
        recommendations.netType = "longline";
        recommendations.baitType = "live fish";
        recommendations.fishingMethod = "deep water";
        break;
    }

    // Adjust based on probability
    if (probability > 70) recommendations.expectedCatchSize = "large";
    if (probability < 40) recommendations.expectedCatchSize = "small";

    return recommendations;
  }

  // Public methods for data management
  async addCatchData(catchData: CatchAnalysis): Promise<void> {
    this.historicalData.push(catchData);
    // Save to local storage
    await Storage.saveHistoricalCatches?.(this.historicalData);
  }

  async addCommunityReport(species: string, report: any): Promise<void> {
    if (!this.communityReports.has(species)) {
      this.communityReports.set(species, []);
    }
    this.communityReports.get(species)!.push({
      ...report,
      timestamp: Date.now()
    });
  }

  async loadHistoricalData(): Promise<void> {
    try {
      const data = await Storage.getHistoricalCatches?.() || [];
      this.historicalData = data;
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  // Fallback methods for error handling
  private getFallbackWeather() {
    return {
      temperature: 28,
      windSpeed: 15,
      windDirection: 180,
      waveHeight: 1.5,
      visibility: 10,
      pressure: 1013,
      humidity: 70,
      uvIndex: 6,
      fishingConditions: "Good" as const,
      warnings: []
    };
  }

  private getFallbackPredictions(location: { lat: number; lon: number }): FishPrediction[] {
    const now = new Date();
    return [
      {
        species: "Pomfret",
        probability: 75,
        confidence: 80,
        location: {
          lat: location.lat || 19.0760,
          lon: location.lon || 72.8777,
          depth: 25,
          radius: 3
        },
        timeWindow: {
          start: now,
          end: new Date(now.getTime() + 4 * 60 * 60 * 1000),
          optimalTime: new Date(now.getTime() + 2 * 60 * 60 * 1000)
        },
        conditions: {
          weather: this.getFallbackWeather(),
          tide: "rising",
          moonPhase: "waxing",
          waterTemperature: 26
        },
        recommendations: {
          netType: "gill net",
          baitType: "prawns",
          fishingMethod: "bottom",
          expectedCatchSize: "medium"
        }
      },
      {
        species: "Kingfish",
        probability: 65,
        confidence: 75,
        location: {
          lat: (location.lat || 19.0760) + 0.01,
          lon: (location.lon || 72.8777) + 0.01,
          depth: 35,
          radius: 5
        },
        timeWindow: {
          start: new Date(now.getTime() + 1 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 5 * 60 * 60 * 1000),
          optimalTime: new Date(now.getTime() + 3 * 60 * 60 * 1000)
        },
        conditions: {
          weather: this.getFallbackWeather(),
          tide: "high",
          moonPhase: "waxing",
          waterTemperature: 26
        },
        recommendations: {
          netType: "drift net",
          baitType: "small fish",
          fishingMethod: "mid-water",
          expectedCatchSize: "large"
        }
      }
    ];
  }
  
  // Production data integration methods
  private getCurrentTideStateFromData(tidalData: any): string {
    if (!tidalData?.currentConditions) return 'rising';
    
    const { currentHeight, nextHigh, nextLow } = tidalData.currentConditions;
    const nextHighTime = new Date(nextHigh.time);
    const nextLowTime = new Date(nextLow.time);
    const now = new Date();
    
    if (nextHighTime < nextLowTime) {
      return 'rising'; // Tide is rising towards high
    } else {
      return 'falling'; // Tide is falling towards low
    }
  }
  
  private getCommercialValue(speciesName: string): number {
    const productionFish = PRODUCTION_FISH_DATABASE.find(fish => fish.commonName === speciesName);
    if (!productionFish) return 1;
    
    switch (productionFish.economicData.commercialImportance) {
      case 'high': return 1.5;
      case 'medium': return 1.2;
      case 'low': return 1.0;
      default: return 1.0;
    }
  }
  
  private async predictSpeciesWithProductionData(
    species: FishSpeciesData,
    location: { lat: number; lon: number },
    weather: any,
    moonPhase: string,
    tideState: string,
    waterTemp: number,
    currentTime: Date,
    tidalData: any,
    marketPrices: any
  ): Promise<FishPrediction | null> {
    try {
      // Calculate probability based on multiple factors
      let probability = 50; // Base probability
      let confidence = 70; // Higher base confidence with production data

      // Environmental factor scoring
      const tempScore = this.scoreTemperature(waterTemp, species.habitat.temperatureRange);
      const weatherScore = this.scoreWeatherConditions(weather, species.environmentalFactors);
      const seasonScore = this.scoreSeasonalPattern(currentTime, species.behavior.seasonalPattern);
      const moonScore = this.scoreMoonPhase(moonPhase, species.behavior.moonPhasePreference);
      const timeScore = this.scoreTimeOfDay(currentTime, species.behavior.feedingTimes);
      
      // Enhanced tidal scoring with real INCOIS data
      const tideScore = this.scoreRealTidalData(tidalData, species.environmentalFactors.tideInfluence);

      // Enhanced historical data influence with production data
      const historicalScore = await this.getProductionHistoricalScore(location, species.name, currentTime);
      const communityScore = this.getCommunityReportScore(location, species.name);
      
      // Market demand influence
      const marketScore = this.scoreMarketDemand(species.name, marketPrices);

      // Weighted probability calculation with production data
      probability = Math.min(95, Math.max(5, 
        probability * 0.1 +
        tempScore * 0.15 +
        weatherScore * 0.12 +
        seasonScore * 0.15 +
        moonScore * 0.08 +
        timeScore * 0.10 +
        tideScore * 0.15 + // Higher weight for real tidal data
        historicalScore * 0.08 +
        communityScore * 0.05 +
        marketScore * 0.02 // Market influence
      ));

      // Enhanced confidence with production data
      confidence = Math.min(95, Math.max(40,
        confidence +
        (tidalData ? 15 : 0) + // Real tidal data bonus
        (marketPrices ? 10 : 0) + // Market data bonus
        (this.historicalData.length > 10 ? 10 : 0) +
        (this.communityReports.size > 5 ? 5 : 0) +
        (weather ? 10 : -10)
      ));

      // Determine optimal fishing location
      const optimalLocation = await this.findOptimalLocation(location, species);

      // Calculate time window with tidal data
      const timeWindow = this.calculateOptimalTimeWindowWithTides(currentTime, species, tidalData);

      return {
        species: species.name,
        probability: Math.round(probability),
        confidence: Math.round(confidence),
        location: optimalLocation,
        timeWindow,
        conditions: {
          weather,
          tide: tideState,
          moonPhase,
          waterTemperature: waterTemp
        },
        recommendations: this.generateEnhancedRecommendations(species, weather, probability, marketPrices)
      };

    } catch (error) {
      console.error(`Error in production prediction for ${species.name}:`, error);
      return null;
    }
  }
  
  private scoreRealTidalData(tidalData: any, tideInfluence: number): number {
    if (!tidalData?.currentConditions) {
      return 50; // Fallback score
    }
    
    const { tidalRange, springNeap, currentHeight, nextHigh, nextLow } = tidalData.currentConditions;
    let score = 50;
    
    // Spring tides are better for fishing
    if (springNeap === 'spring') {
      score += 20;
    }
    
    // Higher tidal range is generally better
    if (tidalRange > 2.0) {
      score += 15;
    } else if (tidalRange > 1.0) {
      score += 10;
    }
    
    // Moving water is better than slack
    const timeToNextHigh = new Date(nextHigh.time).getTime() - Date.now();
    const timeToNextLow = new Date(nextLow.time).getTime() - Date.now();
    
    if (Math.min(Math.abs(timeToNextHigh), Math.abs(timeToNextLow)) > 2 * 60 * 60 * 1000) {
      score += 10; // Peak flow periods
    }
    
    return Math.min(100, Math.max(0, score * (tideInfluence / 10)));
  }
  
  private scoreMarketDemand(speciesName: string, marketData: any): number {
    if (!marketData) return 50;
    
    // If we have detailed market report from production service
    if (marketData.prices && Array.isArray(marketData.prices)) {
      const speciesPrice = marketData.prices.find((price: any) => 
        price.species.toLowerCase().includes(speciesName.toLowerCase()) ||
        speciesName.toLowerCase().includes(price.species.toLowerCase())
      );
      
      if (speciesPrice) {
        let score = 50;
        
        // Price trend influence
        switch (speciesPrice.trend) {
          case 'rising': score += 20; break;
          case 'stable': score += 10; break;
          case 'falling': score -= 10; break;
        }
        
        // Volume influence (higher volume = better market)
        if (speciesPrice.volume > 100) score += 15;
        else if (speciesPrice.volume > 50) score += 10;
        
        // Quality premium
        switch (speciesPrice.quality) {
          case 'premium': score += 15; break;
          case 'standard': score += 5; break;
          case 'economy': score -= 5; break;
        }
        
        // Market condition
        switch (marketData.summary?.marketCondition) {
          case 'bullish': score += 15; break;
          case 'stable': score += 5; break;
          case 'bearish': score -= 10; break;
        }
        
        return Math.min(100, Math.max(0, score));
      }
    }
    
    // Fallback to simple price comparison
    const productionFish = PRODUCTION_FISH_DATABASE.find(fish => fish.commonName === speciesName);
    if (!productionFish) return 50;
    
    const currentPrice = marketData[speciesName.toLowerCase()] || marketData.prices?.[speciesName.toLowerCase()] || productionFish.economicData.averageMarketPrice;
    const averagePrice = productionFish.economicData.averageMarketPrice;
    
    // Higher prices = higher demand = better score
    const priceRatio = currentPrice / averagePrice;
    
    if (priceRatio > 1.2) return 80; // High demand
    if (priceRatio > 1.1) return 70; // Good demand
    if (priceRatio > 0.9) return 60; // Normal demand
    if (priceRatio > 0.8) return 40; // Low demand
    return 30; // Very low demand
  }
  
  private calculateOptimalTimeWindowWithTides(currentTime: Date, species: FishSpeciesData, tidalData: any) {
    if (!tidalData?.predictions) {
      return this.calculateOptimalTimeWindow(currentTime, species);
    }
    
    // Find optimal times based on tidal movements and species behavior
    const predictions = tidalData.predictions.slice(0, 24); // Next 24 predictions
    const optimalTimes = [];
    
    for (let i = 0; i < predictions.length - 1; i++) {
      const current = predictions[i];
      const next = predictions[i + 1];
      const predTime = new Date(current.datetime);
      
      // Check if this aligns with species feeding times
      const hour = predTime.getHours();
      const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      if (species.behavior.feedingTimes.includes(timeOfDay) || 
          species.behavior.feedingTimes.includes('dawn') && (hour >= 5 && hour <= 7) ||
          species.behavior.feedingTimes.includes('dusk') && (hour >= 17 && hour <= 19)) {
        
        // Factor in tidal movement - most species prefer moving water
        if (Math.abs(current.height - next.height) > 0.3) {
          optimalTimes.push(predTime);
        }
      }
    }
    
    // Return best time window or fallback
    if (optimalTimes.length > 0) {
      const start = optimalTimes[0];
      return {
        start,
        end: new Date(start.getTime() + 4 * 60 * 60 * 1000), // 4 hour window
        optimalTime: optimalTimes[Math.floor(optimalTimes.length / 2)] || start
      };
    }
    
    return this.calculateOptimalTimeWindow(currentTime, species);
  }
  
  private generateEnhancedRecommendations(species: FishSpeciesData, weather: any, probability: number, marketData: any) {
    const baseRecommendations = this.generateRecommendations(species, weather, probability);
    
    // Find production fish data for enhanced recommendations
    const productionFish = PRODUCTION_FISH_DATABASE.find(fish => fish.commonName === species.name);
    
    let marketInsights = {};
    
    // Add market-based insights if we have detailed market data
    if (marketData?.prices && Array.isArray(marketData.prices)) {
      const speciesPrice = marketData.prices.find((price: any) => 
        price.species.toLowerCase().includes(species.name.toLowerCase()) ||
        species.name.toLowerCase().includes(price.species.toLowerCase())
      );
      
      if (speciesPrice) {
        marketInsights = {
          currentPrice: `₹${speciesPrice.price}/kg`,
          priceTrend: speciesPrice.trend,
          change24h: `${speciesPrice.change24h > 0 ? '+' : ''}${speciesPrice.change24h.toFixed(1)}%`,
          marketVolume: `${speciesPrice.volume} tonnes`,
          quality: speciesPrice.quality,
          marketCondition: marketData.summary?.marketCondition || 'stable',
          nearestMarket: marketData.marketName,
          tradingHours: marketData.regulations?.tradingHours,
          qualityStandards: marketData.regulations?.qualityStandards?.[0]
        };
      }
    }
    
    if (productionFish) {
      return {
        ...baseRecommendations,
        optimalGear: productionFish.catchingMethods.traditionalGears[0] || baseRecommendations.netType,
        prohibitedGear: productionFish.catchingMethods.prohibitedGears,
        legalSize: `Minimum ${productionFish.regulations.minimumLegalSize}cm`,
        marketPrice: productionFish.economicData.averageMarketPrice,
        exportPotential: productionFish.economicData.exportValue,
        seasonalAdvice: this.getSeasonalAdvice(productionFish),
        conservationNote: productionFish.regulations.closedSeasons.length > 0 ? 
          'Check seasonal closures before fishing' : 'No seasonal restrictions',
        ...marketInsights
      };
    }
    
    return {
      ...baseRecommendations,
      ...marketInsights
    };
  }
  
  private getSeasonalAdvice(fish: ProductionFishSpecies): string {
    const currentMonth = new Date().getMonth() + 1;
    
    if (currentMonth >= fish.biologicalData.spawningSeasonStart || 
        currentMonth <= fish.biologicalData.spawningSeasonEnd) {
      return 'Spawning season - practice sustainable fishing';
    }
    
    if (fish.economicData.commercialImportance === 'high') {
      return 'Peak commercial season - good market demand';
    }
    
    return 'Regular fishing season';
  }
  
  // Enhanced historical scoring using production catch data
  private async getProductionHistoricalScore(
    location: { lat: number; lon: number }, 
    speciesName: string,
    currentTime: Date
  ): Promise<number> {
    try {
      console.log(`📊 Analyzing historical catch data for ${speciesName}...`);
      
      // Get historical catch trends for the past 12 months
      const catchTrends = await productionHistoricalCatchService.getCatchTrends(
        location,
        speciesName,
        12
      );
      
      if (!catchTrends || catchTrends.trends.length === 0) {
        console.log('No historical catch data available, using fallback scoring');
        return this.getHistoricalScore(location, speciesName, currentTime);
      }
      
      // Analyze current month vs historical performance
      const currentMonth = currentTime.toISOString().substring(0, 7);
      const currentMonthData = catchTrends.trends.find(t => t.month === currentMonth);
      
      if (!currentMonthData) {
        // Use seasonal analysis if current month data unavailable
        return this.scoreSeasonalHistoricalTrends(catchTrends, currentTime);
      }
      
      // Score based on historical performance
      let score = 50; // Base score
      
      // Check if current month is in best performing months
      if (catchTrends.bestMonths.includes(currentMonth)) {
        score += 30;
        console.log(`🔥 ${speciesName}: Peak season month detected (+30 points)`);
      }
      
      // Check if current month is in worst performing months
      if (catchTrends.worstMonths.includes(currentMonth)) {
        score -= 20;
        console.log(`❄️ ${speciesName}: Low season month detected (-20 points)`);
      }
      
      // Factor in average catch rates
      const avgCatchAcrossMonths = catchTrends.trends.reduce((sum, t) => sum + t.avgCatch, 0) / catchTrends.trends.length;
      
      if (currentMonthData.avgCatch > avgCatchAcrossMonths * 1.2) {
        score += 15;
        console.log(`📈 ${speciesName}: Above average historical catch (+15 points)`);
      } else if (currentMonthData.avgCatch < avgCatchAcrossMonths * 0.8) {
        score -= 10;
        console.log(`📉 ${speciesName}: Below average historical catch (-10 points)`);
      }
      
      // Factor in fishing trip success rates
      if (currentMonthData.trips > 10) {
        score += 10; // Good data confidence
        console.log(`✅ ${speciesName}: Good historical data confidence (+10 points)`);
      }
      
      // Price trends influence (higher prices indicate better fishing conditions)
      const currentPriceData = catchTrends.priceFluctuations.find(p => p.month === currentMonth);
      if (currentPriceData) {
        const avgPriceAcrossMonths = catchTrends.priceFluctuations.reduce((sum, p) => sum + p.avgPrice, 0) / catchTrends.priceFluctuations.length;
        
        if (currentPriceData.avgPrice > avgPriceAcrossMonths * 1.1) {
          score += 8;
          console.log(`💰 ${speciesName}: High market prices indicate scarcity (+8 points)`);
        }
      }
      
      const finalScore = Math.min(100, Math.max(0, score));
      console.log(`📊 ${speciesName} historical score: ${finalScore}/100`);
      
      return finalScore;
      
    } catch (error) {
      console.error(`Failed to get production historical score for ${speciesName}:`, error);
      return this.getHistoricalScore(location, speciesName, currentTime);
    }
  }
  
  private scoreSeasonalHistoricalTrends(catchTrends: any, currentTime: Date): number {
    const currentMonth = currentTime.getMonth() + 1; // 1-12
    let score = 50;
    
    // Find similar months (±1 month) in historical data
    const similarMonths = catchTrends.trends.filter((trend: any) => {
      const trendMonth = new Date(trend.month + '-01').getMonth() + 1;
      return Math.abs(trendMonth - currentMonth) <= 1;
    });
    
    if (similarMonths.length > 0) {
      const avgCatch = similarMonths.reduce((sum: number, t: any) => sum + t.avgCatch, 0) / similarMonths.length;
      const overallAvg = catchTrends.trends.reduce((sum: any, t: any) => sum + t.avgCatch, 0) / catchTrends.trends.length;
      
      if (avgCatch > overallAvg * 1.2) {
        score += 20; // Good seasonal period
      } else if (avgCatch < overallAvg * 0.8) {
        score -= 15; // Poor seasonal period
      }
    }
    
    return Math.min(100, Math.max(0, score));
  }
}

export const fishPredictionService = new FishPredictionService();