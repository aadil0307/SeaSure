import { CONFIG } from "../config"
import type { Forecast } from "../types"
import { Storage } from "./storage"

// Marine weather conditions critical for fishing
export interface MarineWeather {
  temperature: number
  windSpeed: number
  windDirection: number
  waveHeight: number
  visibility: number
  pressure: number
  humidity: number
  uvIndex: number
  tideInfo?: {
    highTide: string
    lowTide: string
  }
  fishingConditions: "Excellent" | "Good" | "Fair" | "Poor" | "Dangerous"
  warnings: string[]
}

// Extended forecast for trip planning
export interface ExtendedForecast {
  date: string
  weather: MarineWeather
  moonPhase: string
  sunrise: string
  sunset: string
  optimalFishingHours: string[]
}

class WeatherService {
  private baseUrl = CONFIG.OPENWEATHER_BASE_URL
  private apiKey = CONFIG.OPENWEATHER_API_KEY

  // Get current marine weather conditions
  async getCurrentWeather(lat: number, lon: number): Promise<MarineWeather> {
    try {
      console.log('Fetching weather for location:', lat, lon)
      
      // Validate inputs
      if (!lat || !lon || typeof lat !== 'number' || typeof lon !== 'number') {
        console.warn('Invalid coordinates provided to getCurrentWeather:', lat, lon)
        return this.getFallbackWeather()
      }
      
      // Check API configuration
      if (!this.baseUrl || !this.apiKey) {
        console.warn('Weather API not configured, using fallback data')
        return this.getFallbackWeather()
      }

      // Get current weather with timeout
      const currentResponse = await Promise.race([
        fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Weather API timeout')), 10000))
      ]) as Response
      
      if (!currentResponse.ok) {
        console.warn(`Weather API returned ${currentResponse.status}: ${currentResponse.statusText}`)
        return this.getFallbackWeather()
      }
      
      const currentData = await currentResponse.json()
      
      if (!currentData || !currentData.main) {
        console.warn('Invalid weather data received:', currentData)
        return this.getFallbackWeather()
      }

      // Get UV Index (optional, fallback if fails)
      let uvData = { value: 5 } // Default UV index
      try {
        const uvResponse = await Promise.race([
          fetch(`${this.baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('UV API timeout')), 5000))
        ]) as Response
        
        if (uvResponse.ok) {
          uvData = await uvResponse.json()
        }
      } catch (uvError) {
        console.warn('UV index fetch failed, using default:', uvError)
      }

      // Calculate fishing conditions based on weather parameters
      const fishingConditions = this.calculateFishingConditions(currentData, uvData)
      const warnings = this.generateWeatherWarnings(currentData)

      const weather = {
        temperature: Math.round(currentData.main?.temp || 28),
        windSpeed: Math.round((currentData.wind?.speed || 0) * 3.6), // Convert m/s to km/h
        windDirection: currentData.wind?.deg || 0,
        waveHeight: this.estimateWaveHeight(currentData.wind?.speed || 0),
        visibility: currentData.visibility ? currentData.visibility / 1000 : 10, // Convert to km
        pressure: currentData.main?.pressure || 1013,
        humidity: currentData.main?.humidity || 70,
        uvIndex: uvData.value || 5,
        fishingConditions,
        warnings
      }
      
      console.log('Weather data fetched successfully:', weather)
      return weather
      
    } catch (error) {
      console.error("Error fetching weather data:", error)
      console.log("Using fallback weather data")
      return this.getFallbackWeather()
    }
  }

  // Get 5-day marine forecast for trip planning
  async getExtendedForecast(lat: number, lon: number): Promise<ExtendedForecast[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      )
      const data = await response.json()

      // Group forecasts by day and get daily summary
      const dailyForecasts: ExtendedForecast[] = []
      const processedDates = new Set()

      for (const item of data.list) {
        const date = new Date(item.dt * 1000).toDateString()
        
        if (!processedDates.has(date)) {
          processedDates.add(date)
          
          const weather: MarineWeather = {
            temperature: Math.round(item.main.temp),
            windSpeed: Math.round(item.wind.speed * 3.6),
            windDirection: item.wind.deg || 0,
            waveHeight: this.estimateWaveHeight(item.wind.speed),
            visibility: item.visibility ? item.visibility / 1000 : 10,
            pressure: item.main.pressure,
            humidity: item.main.humidity,
            uvIndex: 0, // Would need separate API call for each day
            fishingConditions: this.calculateFishingConditions(item),
            warnings: this.generateWeatherWarnings(item)
          }

          dailyForecasts.push({
            date,
            weather,
            moonPhase: this.getMoonPhase(new Date(item.dt * 1000)),
            sunrise: this.formatTime(data.city.sunrise),
            sunset: this.formatTime(data.city.sunset),
            optimalFishingHours: this.getOptimalFishingHours(weather, data.city.sunrise, data.city.sunset)
          })
        }
      }

      return dailyForecasts.slice(0, 5) // Return 5 days
    } catch (error) {
      console.error("Error fetching extended forecast:", error)
      throw new Error("Failed to fetch extended forecast")
    }
  }

  // Calculate fishing conditions based on weather parameters
  private calculateFishingConditions(weatherData: any, uvData?: any): MarineWeather["fishingConditions"] {
    const windSpeed = weatherData.wind.speed * 3.6 // km/h
    const visibility = weatherData.visibility ? weatherData.visibility / 1000 : 10
    const pressure = weatherData.main.pressure
    const weatherCode = weatherData.weather[0].id

    // Dangerous conditions
    if (windSpeed > 40 || visibility < 1 || weatherCode >= 200 && weatherCode < 600) {
      return "Dangerous"
    }

    // Poor conditions
    if (windSpeed > 25 || visibility < 3 || pressure < 1000) {
      return "Poor"
    }

    // Fair conditions
    if (windSpeed > 15 || visibility < 5 || pressure < 1010) {
      return "Fair"
    }

    // Good conditions
    if (windSpeed > 10 || pressure < 1020) {
      return "Good"
    }

    // Excellent conditions
    return "Excellent"
  }

  // Generate weather warnings for fishermen
  private generateWeatherWarnings(weatherData: any): string[] {
    const warnings: string[] = []
    const windSpeed = weatherData.wind.speed * 3.6
    const weatherCode = weatherData.weather[0].id
    const visibility = weatherData.visibility ? weatherData.visibility / 1000 : 10

    if (windSpeed > 30) {
      warnings.push("High wind warning - Consider postponing trip")
    }

    if (weatherCode >= 200 && weatherCode < 300) {
      warnings.push("Thunderstorm alert - Return to shore immediately")
    }

    if (weatherCode >= 500 && weatherCode < 600) {
      warnings.push("Heavy rain expected - Reduced visibility")
    }

    if (visibility < 2) {
      warnings.push("Poor visibility - Navigation hazard")
    }

    if (weatherData.main.pressure < 1000) {
      warnings.push("Low pressure system - Weather may deteriorate")
    }

    return warnings
  }

  // Estimate wave height based on wind speed (simplified Beaufort scale)
  private estimateWaveHeight(windSpeedMs: number): number {
    const windKmh = windSpeedMs * 3.6
    
    if (windKmh < 6) return 0.1
    if (windKmh < 12) return 0.3
    if (windKmh < 20) return 0.6
    if (windKmh < 29) return 1.0
    if (windKmh < 39) return 1.8
    if (windKmh < 50) return 2.5
    if (windKmh < 62) return 4.0
    return 6.0
  }

  // Get moon phase for fishing planning
  private getMoonPhase(date: Date): string {
    const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", 
                   "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"]
    
    // Simplified moon phase calculation
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const phase = Math.floor((dayOfYear % 29.5) / 29.5 * 8)
    
    return phases[phase] || "Unknown"
  }

  // Get optimal fishing hours based on weather and astronomical data
  private getOptimalFishingHours(weather: MarineWeather, sunrise: number, sunset: number): string[] {
    const hours: string[] = []
    
    // Dawn fishing (traditionally best)
    if (weather.fishingConditions !== "Dangerous" && weather.fishingConditions !== "Poor") {
      hours.push("05:30 - 07:30")
    }
    
    // Dusk fishing
    if (weather.fishingConditions === "Excellent" || weather.fishingConditions === "Good") {
      hours.push("17:30 - 19:30")
    }
    
    // Night fishing (if conditions are favorable)
    if (weather.fishingConditions === "Excellent" && weather.visibility > 5) {
      hours.push("20:00 - 22:00")
    }
    
    return hours
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Fallback weather data when API fails
  private getFallbackWeather(): MarineWeather {
    return {
      temperature: 28,
      windSpeed: 15,
      windDirection: 180,
      waveHeight: 1.5,
      visibility: 10,
      pressure: 1013,
      humidity: 70,
      uvIndex: 6,
      fishingConditions: "Good",
      warnings: ["Using offline weather data"]
    }
  }
}

export const weatherService = new WeatherService()

// Legacy compatibility functions
export async function getCachedForecast(): Promise<Forecast | null> {
  return Storage.getForecast()
}

export async function refreshForecast(): Promise<Forecast> {
  try {
    // Use real weather data for forecast
    const weather = await weatherService.getCurrentWeather(19.0760, 72.8777) // Default to Mumbai
    
    const forecast: Forecast = {
      id: `weather_${Date.now()}`,
      fetchedAt: Date.now(),
      validTo: Date.now() + (6 * 60 * 60 * 1000), // 6 hours
      summary: `${weather.temperature}°C, Wind: ${weather.windSpeed} km/h, ${weather.fishingConditions} fishing conditions`,
      hourly: [
        {
          time: Date.now(),
          windKts: Math.round(weather.windSpeed * 0.539957), // Convert km/h to knots
          waveM: weather.waveHeight,
          visibilityKm: weather.visibility
        }
      ],
      source: "network"
    }
    
    await Storage.saveForecast(forecast)
    return forecast
  } catch (error) {
    console.error("Error in refreshForecast:", error)
    
    // Fallback to mock data if API fails
    const now = Date.now()
    const fallback: Forecast = {
      id: `${now}`,
      fetchedAt: now,
      validTo: now + 6 * 60 * 60 * 1000,
      summary: "Weather data unavailable - Using offline mode",
      source: "network",
      hourly: Array.from({ length: 12 }).map((_, i) => ({
        time: now + i * 60 * 60 * 1000,
        windKts: 6 + Math.round(Math.random() * 6),
        waveM: 0.6 + Math.random() * 0.8,
        visibilityKm: 8 + Math.round(Math.random() * 4),
      })),
    }
    await Storage.saveForecast(fallback)
    return fallback
  }
}
