export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDlat = Math.sin(dLat / 2)
  const sinDlon = Math.sin(dLon / 2)
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Ray-casting algorithm
export function pointInPolygon(point: { lat: number; lon: number }, polygon: { lat: number; lon: number }[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon,
      yi = polygon[i].lat
    const xj = polygon[j].lon,
      yj = polygon[j].lat
    const intersect = yi > point.lat !== yj > point.lat && point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Simple nearest-neighbor path order (greedy)
export function optimizeOrder(start: { lat: number; lon: number }, points: { lat: number; lon: number }[]) {
  const remaining = points.map((p, idx) => ({ p, idx }))
  const order: number[] = []
  let current = start
  while (remaining.length) {
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i].p)
      if (d < bestDist) {
        best = i
        bestDist = d
      }
    }
    const next = remaining.splice(best, 1)[0]
    order.push(next.idx)
    current = next.p
  }
  return order
}
