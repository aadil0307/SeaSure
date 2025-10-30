import { palette } from "../theme/colors"

export default function Page() {
  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <section className="mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="text-pretty text-3xl font-bold" style={{ color: palette.primary }}>
          Coastal Fishing MVP — Frontend Scaffold
        </h1>
        <p className="mt-3 text-slate-600">
          This project contains a React Native (Expo) mobile UI focused on offline-first features. The page you are
          viewing is a minimal Next.js preview to satisfy build requirements.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Features (mobile app)</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              <li>GPS map with safe/restricted zone overlays and boundary checks</li>
              <li>Offline catch logbook with local caching</li>
              <li>Weather view with cached forecasts (OpenWeather integration stubbed)</li>
              <li>Trip planning with simple route optimization</li>
              <li>Alerts for weather, seasonal bans, and boundary warnings</li>
              <li>Settings for low-power GPS polling and cache management</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Key Files</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">App.tsx</code> (Expo root, tabs)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">screens/</code> (Map, Logbook, Weather, Trip, Alerts,
                Settings)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">services/</code> (storage, weather, alerts stubs)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">utils/geo.ts</code> (haversine, point-in-polygon,
                optimization)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">data/zones.ts</code> (mock zones)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">theme/colors.ts</code> (palette)
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="mt-2 text-slate-700">
              Backend/APIs are intentionally stubbed to prioritize the offline-first UI. When ready, integrate Firebase
              Firestore for sync and OpenWeather for forecasts.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
