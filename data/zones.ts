// Indian Coastal Fishing Zones and Maritime Boundaries
// Based on real EEZ (Exclusive Economic Zone) and territorial waters

import type { ZonePolygon } from "../types"

// Extended zone interface for Indian coastal waters
export interface Zone extends ZonePolygon {
  depth?: string
  fishSpecies?: string[]
  restrictions?: string
  season?: "all_year" | "seasonal" | "banned"
  description?: string
}

export const ZONES: Zone[] = [
  // Mumbai/Maharashtra Coast - Safe Fishing Zone
  {
    id: "mumbai_safe",
    kind: "safe",
    name: "Mumbai Coastal Safe Zone",
    coordinates: [
      { lat: 19.2, lon: 72.7 },
      { lat: 19.2, lon: 72.9 },
      { lat: 18.9, lon: 72.9 },
      { lat: 18.9, lon: 72.7 }
    ],
    depth: "0-50m",
    fishSpecies: ["Pomfret", "Mackerel", "Sardine", "Bombay Duck"],
    restrictions: "Commercial fishing allowed with valid license",
    season: "all_year",
    description: "Traditional fishing grounds near Mumbai coast"
  },

  // Restricted Military Zone - Mumbai
  {
    id: "mumbai_naval_restricted",
    kind: "restricted",
    name: "Mumbai Naval Base - Restricted Zone",
    coordinates: [
      { lat: 18.95, lon: 72.8 },
      { lat: 18.95, lon: 72.85 },
      { lat: 18.92, lon: 72.85 },
      { lat: 18.92, lon: 72.8 }
    ],
    restrictions: "Entry prohibited - Naval operations area",
    description: "High security zone around naval installations"
  },

  // Kochi/Kerala Coast - Safe Fishing Zone
  {
    id: "kochi_safe",
    kind: "safe",
    name: "Kochi Traditional Fishing Grounds",
    coordinates: [
      { lat: 10.1, lon: 76.1 },
      { lat: 10.1, lon: 76.4 },
      { lat: 9.8, lon: 76.4 },
      { lat: 9.8, lon: 76.1 }
    ],
    depth: "20-100m",
    fishSpecies: ["Tuna", "Kingfish", "Snapper", "Prawns"],
    season: "all_year",
    description: "Rich fishing grounds with traditional fishing communities"
  },

  // Chennai/Tamil Nadu Coast - Restricted during breeding season
  {
    id: "chennai_restricted_breeding",
    kind: "restricted",
    name: "Chennai Marine Protected Area",
    coordinates: [
      { lat: 13.2, lon: 80.2 },
      { lat: 13.2, lon: 80.4 },
      { lat: 12.9, lon: 80.4 },
      { lat: 12.9, lon: 80.2 }
    ],
    restrictions: "No fishing during breeding season (April-June)",
    season: "banned",
    description: "Marine protected area for fish breeding"
  },

  // Goa Fishing Zone - Seasonal restrictions
  {
    id: "goa_seasonal",
    kind: "safe",
    name: "Goa Coastal Fishing Zone",
    coordinates: [
      { lat: 15.6, lon: 73.7 },
      { lat: 15.6, lon: 74.0 },
      { lat: 15.2, lon: 74.0 },
      { lat: 15.2, lon: 73.7 }
    ],
    depth: "10-80m",
    fishSpecies: ["Mackerel", "Sardine", "Kingfish", "Pomfret"],
    season: "seasonal",
    restrictions: "Banned during monsoon (June-July)",
    description: "Prime fishing area, avoid during monsoon season"
  },

  // International Maritime Boundary - India-Pakistan (Restricted)
  {
    id: "indo_pak_boundary",
    kind: "restricted",
    name: "India-Pakistan Maritime Boundary",
    coordinates: [
      { lat: 24.0, lon: 68.0 },
      { lat: 24.0, lon: 68.5 },
      { lat: 23.5, lon: 68.5 },
      { lat: 23.5, lon: 68.0 }
    ],
    restrictions: "International boundary - Entry strictly prohibited",
    description: "Maritime border area - high security zone"
  },

  // Visakhapatnam Deep Sea Zone - Safe but requires permits
  {
    id: "vizag_deep_sea",
    kind: "safe",
    name: "Visakhapatnam Deep Sea Zone",
    coordinates: [
      { lat: 17.9, lon: 83.0 },
      { lat: 17.9, lon: 83.5 },
      { lat: 17.5, lon: 83.5 },
      { lat: 17.5, lon: 83.0 }
    ],
    depth: "100-200m",
    fishSpecies: ["Tuna", "Barracuda", "Shark", "Deep sea fish"],
    season: "all_year",
    restrictions: "Deep sea fishing license required",
    description: "Deep water fishing zone - experienced fishermen only"
  },

  // India-Sri Lanka Maritime Boundary (Restricted)
  {
    id: "indo_lanka_boundary",
    kind: "restricted",
    name: "India-Sri Lanka Maritime Boundary",
    coordinates: [
      { lat: 9.5, lon: 79.5 },
      { lat: 9.5, lon: 80.0 },
      { lat: 9.0, lon: 80.0 },
      { lat: 9.0, lon: 79.5 }
    ],
    restrictions: "International boundary - Avoid crossing without permits",
    description: "Palk Strait - Boundary restrictions apply"
  }
]

// Helper functions for Indian coastal fishing
export const getZonesByType = (type: ZonePolygon["kind"]): Zone[] => {
  return ZONES.filter(zone => zone.kind === type)
}

export const getRestrictedZones = (): Zone[] => {
  return ZONES.filter(zone => 
    zone.kind === "restricted" || 
    zone.season === "banned"
  )
}

export const getFishingGrounds = (): Zone[] => {
  return ZONES.filter(zone => zone.kind === "safe")
}

// Check if fishing is allowed in current season
export const isFishingAllowed = (zone: Zone, currentDate: Date = new Date()): boolean => {
  const currentMonth = currentDate.getMonth() + 1 // 1-12
  
  if (zone.season === "banned" || zone.kind === "restricted") {
    return false
  }
  
  if (zone.season === "seasonal") {
    // Check monsoon restrictions
    if (zone.id.includes("goa") || zone.id.includes("mangalore")) {
      return currentMonth < 6 || currentMonth > 7 // West coast monsoon
    }
    if (zone.id.includes("chennai") || zone.id.includes("vizag")) {
      return currentMonth < 4 || currentMonth > 6 // East coast restrictions
    }
  }
  
  return true
}
