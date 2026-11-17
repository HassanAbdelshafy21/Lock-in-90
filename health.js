// Health Connect bridge (Android app only). Wraps the native HealthBridge plugin in native/health-bridge.
// Reading only: nothing here writes to Health Connect or to Firestore. Saving daily summaries comes next,
// once the summary format is agreed.

const plugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.HealthBridge;

/** True inside the Android app, where Health Connect can be used. */
export const supported = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && plugin());

/** All the types the app asks for, in the order they're shown. */
export const TYPES = ['sleep', 'hrv', 'rhr', 'hr', 'spo2', 'temp', 'steps', 'activeKcal', 'totalKcal', 'exercise'];

/** { available: 'yes' | 'update' | 'no', granted: [type…] } */
export async function status() {
  if (!supported()) return { available: 'no', granted: [] };
  const r = await plugin().status();
  return { available: r.available, granted: r.granted || [] };
}

/** Opens the Health Connect permission screen; resolves with the new status. */
export async function connect() {
  const r = await plugin().connect();
  return { available: r.available, granted: r.granted || [] };
}

/** Health Connect settings, or its Play Store page when it's missing or out of date. */
export const openSettings = () => plugin().openSettings();

const iso = d => d.toISOString().slice(0, 10);
const addDays = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

/**
 * Raw readings for local dates start..end (inclusive). Ranges over 35 days are read in chunks.
 * Returns { zone, granted, days: [{date, steps, activeKcal, totalKcal, hrAvg, hrMin, hrMax, origins}],
 *           sleep: [{s, e, src, title?, stages: [{s, e, stage}]}], hrv: [{t, ms, src}], rhr: [{t, bpm, src}],
 *           spo2: [{t, pct, src}], temp: [{t, c, loc, src}], exercise: [{s, e, type, title?, src}] }
 * Times are epoch milliseconds. Records near the edges can repeat between chunks; callers key them by start time.
 */
export async function read(start, end) {
  const out = { zone: null, granted: [], days: [], sleep: [], hrv: [], rhr: [], spo2: [], temp: [], exercise: [] };
  for (let a = start; a <= end; a = addDays(a, 35)) {
    const b = addDays(a, 34) < end ? addDays(a, 34) : end;
    const r = await plugin().read({ start: a, end: b });
    out.zone = r.zone; out.granted = r.granted || [];
    for (const k of ['days', 'sleep', 'hrv', 'rhr', 'spo2', 'temp', 'exercise']) out[k].push(...(r[k] || []));
  }
  return out;
}
