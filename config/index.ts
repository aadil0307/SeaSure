// Configuration file for API keys and environment variables
import {
  GOOGLE_MAPS_API_KEY,
  OPENWEATHER_API_KEY,
  IMGBB_API_KEY,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  OPENWEATHER_BASE_URL,
  OPENWEATHER_MARINE_URL,
} from '@env';

export const CONFIG = {
  // API Keys from environment variables
  GOOGLE_MAPS_API_KEY,
  OPENWEATHER_API_KEY,
  IMGBB_API_KEY,
  
  // Firebase Configuration
  FIREBASE: {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  },
  
  // API Endpoints
  OPENWEATHER_BASE_URL: OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5",
  OPENWEATHER_MARINE_URL: OPENWEATHER_MARINE_URL || "https://api.openweathermap.org/data/2.5/marine",
  
  // Indian Coastal Waters - Maritime Boundaries
  INDIAN_EEZ_BOUNDARIES: {
    // Exclusive Economic Zone limits (200 nautical miles)
    WEST_COAST: {
      lat: { min: 8.0, max: 23.5 },
      lon: { min: 68.0, max: 75.0 }
    },
    EAST_COAST: {
      lat: { min: 8.0, max: 22.0 },
      lon: { min: 80.0, max: 94.0 }
    }
  },
  
  // Fishing Seasons (Indian Coast)
  FISHING_SEASONS: {
    // Monsoon fishing ban periods
    WEST_COAST_BAN: {
      start: "2024-06-01", // June 1st
      end: "2024-07-31"    // July 31st
    },
    EAST_COAST_BAN: {
      start: "2024-04-15", // April 15th
      end: "2024-06-14"    // June 14th
    }
  },
  
  // Fish migration patterns (simplified)
  FISH_SPECIES_SEASONS: {
    "Pomfret": { peak: ["Nov", "Dec", "Jan", "Feb"] },
    "Mackerel": { peak: ["Oct", "Nov", "Dec", "Jan"] },
    "Sardine": { peak: ["Sep", "Oct", "Nov"] },
    "Tuna": { peak: ["Dec", "Jan", "Feb", "Mar"] },
    "Kingfish": { peak: ["Oct", "Nov", "Dec", "Jan", "Feb"] },
    "Prawns": { peak: ["Nov", "Dec", "Jan", "Feb", "Mar"] }
  },
  
  // Default locations for different coastal states
  DEFAULT_LOCATIONS: {
    "Mumbai": { lat: 19.0760, lon: 72.8777 },
    "Kochi": { lat: 9.9312, lon: 76.2673 },
    "Chennai": { lat: 13.0827, lon: 80.2707 },
    "Visakhapatnam": { lat: 17.6868, lon: 83.2185 },
    "Mangalore": { lat: 12.9141, lon: 74.8560 },
    "Goa": { lat: 15.2993, lon: 74.1240 }
  }
}

// Helper function to check if current date is in fishing ban period
export const isInFishingBan = (location: "west" | "east"): boolean => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentDay = now.getDate()
  
  if (location === "west") {
    // June 1 to July 31
    return (currentMonth === 6 && currentDay >= 1) || 
           (currentMonth === 7) ||
           (currentMonth === 8 && currentDay <= 31)
  } else {
    // April 15 to June 14
    return (currentMonth === 4 && currentDay >= 15) || 
           (currentMonth === 5) ||
           (currentMonth === 6 && currentDay <= 14)
  }
}

// Helper function to get optimal fishing times
export const getOptimalFishingTimes = () => {
  return {
    dawn: "05:00 - 07:00",
    dusk: "17:30 - 19:30",
    night: "20:00 - 23:00"
  }
}
