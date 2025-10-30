import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AlertItem, AppSettings, CatchLog, Forecast, TripPlan } from "../types"

const KEYS = {
  CATCHES: "cfm.catches",
  TRIPS: "cfm.trips",
  FORECAST: "cfm.forecast",
  ALERTS: "cfm.alerts",
  SETTINGS: "cfm.settings",
  BOAT_ID: "cfm.boat_id",
  LICENSE_NUMBER: "cfm.license_number",
  CONTACT_NUMBER: "cfm.contact_number",
  TRACKING_DATA: "cfm.tracking_data",
  VIOLATIONS: "cfm.violations",
  HISTORICAL_CATCHES: "cfm.historical_catches",
  SMART_TRIP_PLANS: "cfm.smart_trip_plans",
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

export const Storage = {
  async getCatches(): Promise<CatchLog[]> {
    return readJSON<CatchLog[]>(KEYS.CATCHES, [])
  },
  async saveCatches(items: CatchLog[]) {
    return writeJSON(KEYS.CATCHES, items)
  },
  async getTrips(): Promise<TripPlan[]> {
    return readJSON<TripPlan[]>(KEYS.TRIPS, [])
  },
  async saveTrips(items: TripPlan[]) {
    return writeJSON(KEYS.TRIPS, items)
  },
  async getForecast(): Promise<Forecast | null> {
    return readJSON<Forecast | null>(KEYS.FORECAST, null as any)
  },
  async saveForecast(f: Forecast | null) {
    return writeJSON(KEYS.FORECAST, f)
  },
  async getAlerts(): Promise<AlertItem[]> {
    return readJSON<AlertItem[]>(KEYS.ALERTS, [])
  },
  async saveAlerts(items: AlertItem[]) {
    return writeJSON(KEYS.ALERTS, items)
  },
  async getSettings(): Promise<AppSettings> {
    return readJSON<AppSettings>(KEYS.SETTINGS, { lowPowerMode: true, gpsPollSeconds: 60 })
  },
  async saveSettings(s: AppSettings) {
    return writeJSON(KEYS.SETTINGS, s)
  },
  // New methods for maritime boundary service
  async getBoatId(): Promise<string> {
    return readJSON<string>(KEYS.BOAT_ID, "")
  },
  async saveBoatId(id: string) {
    return writeJSON(KEYS.BOAT_ID, id)
  },
  async getLicenseNumber(): Promise<string> {
    return readJSON<string>(KEYS.LICENSE_NUMBER, "")
  },
  async saveLicenseNumber(license: string) {
    return writeJSON(KEYS.LICENSE_NUMBER, license)
  },
  async getContactNumber(): Promise<string> {
    return readJSON<string>(KEYS.CONTACT_NUMBER, "")
  },
  async saveContactNumber(contact: string) {
    return writeJSON(KEYS.CONTACT_NUMBER, contact)
  },
  async getTrackingData(): Promise<any[]> {
    return readJSON<any[]>(KEYS.TRACKING_DATA, [])
  },
  async saveTrackingData(data: any[]) {
    return writeJSON(KEYS.TRACKING_DATA, data)
  },
  async getViolations(): Promise<any[]> {
    return readJSON<any[]>(KEYS.VIOLATIONS, [])
  },
  async saveViolations(violations: any[]) {
    return writeJSON(KEYS.VIOLATIONS, violations)
  },
  async getHistoricalCatches(): Promise<any[]> {
    return readJSON<any[]>(KEYS.HISTORICAL_CATCHES, [])
  },
  async saveHistoricalCatches(data: any[]) {
    return writeJSON(KEYS.HISTORICAL_CATCHES, data)
  },
  async getSmartTripPlans(): Promise<any[]> {
    return readJSON<any[]>(KEYS.SMART_TRIP_PLANS, [])
  },
  async saveSmartTripPlans(plans: any[]) {
    return writeJSON(KEYS.SMART_TRIP_PLANS, plans)
  },
}
