export type CatchLog = {
  id: string
  species: string
  weightKg?: number
  quantity?: number
  notes?: string
  timestamp: number // epoch ms
  location?: { lat: number; lon: number }
  syncStatus: "pending" | "synced" | "failed"
}

export type TripPlan = {
  id: string
  name: string
  waypoints: { lat: number; lon: number; label?: string }[]
  optimizedOrder?: number[] // indexes referencing waypoints
  createdAt: number
  syncStatus: "pending" | "synced" | "failed"
}

export type Forecast = {
  id: string
  fetchedAt: number
  validTo: number
  summary: string
  hourly: { time: number; windKts: number; waveM: number; visibilityKm: number }[]
  source: "cache" | "network"
}

export type AlertItem = {
  id: string
  type: "weather" | "seasonal-ban" | "boundary"
  title: string
  message: string
  severity: "info" | "warn" | "danger"
  timestamp: number
  read: boolean
}

export type ZonePolygon = {
  id: string
  kind: "safe" | "restricted"
  name: string
  coordinates: { lat: number; lon: number }[] // closed polygon assumed
}

export type AppSettings = {
  lowPowerMode: boolean
  gpsPollSeconds: number // e.g., 30-180
}
