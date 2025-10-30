import type { AlertItem } from "../types"
import { Storage } from "./storage"

export async function listAlerts(): Promise<AlertItem[]> {
  return Storage.getAlerts()
}

export async function addAlert(item: AlertItem) {
  const items = await Storage.getAlerts()
  items.unshift(item)
  await Storage.saveAlerts(items)
}

export async function markAlertRead(id: string) {
  const items = await Storage.getAlerts()
  const updated = items.map((a) => (a.id === id ? { ...a, read: true } : a))
  await Storage.saveAlerts(updated)
}

export async function seedSeasonalBanIfEmpty() {
  const items = await Storage.getAlerts()
  if (items.length === 0) {
    await addAlert({
      id: "ban-sample",
      type: "seasonal-ban",
      title: "Seasonal Ban Notice",
      message: "Monsoon trawling ban in effect from June 1 to July 31.",
      severity: "warn",
      timestamp: Date.now(),
      read: false,
    })
  }
}
