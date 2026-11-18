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

/* ---------- daily summary: raw readings -> users/{uid}/health/{date} (schema v1) ----------
   One doc per local date. Sleep belongs to the morning you wake up; naps (< 3 h, starting 10:00–20:00) are listed apart.
   HRV, oxygen and temperature use the night's sleep window when there is one, otherwise the whole day.
   Nothing here is derived across days (no recovery score): that needs a baseline and is the agent's job. */
const STAGE = { awake: [1, 3, 7], light: [4], deep: [5], rem: [6] };
const LOC = { 1: 'armpit', 2: 'finger', 3: 'forehead', 4: 'mouth', 6: 'temple', 7: 'toe', 8: 'ear', 9: 'wrist' };
// Health Connect ExerciseSessionRecord.EXERCISE_TYPE_* values
export const EX_TYPES = { 0: 'other_workout', 2: 'badminton', 4: 'baseball', 5: 'basketball', 8: 'biking', 9: 'biking_stationary', 10: 'boot_camp', 11: 'boxing', 13: 'calisthenics', 14: 'cricket', 16: 'dancing', 25: 'elliptical', 26: 'exercise_class', 27: 'fencing', 28: 'football_american', 29: 'football_australian', 31: 'frisbee_disc', 32: 'golf', 33: 'guided_breathing', 34: 'gymnastics', 35: 'handball', 36: 'hiit', 37: 'hiking', 38: 'ice_hockey', 39: 'ice_skating', 44: 'martial_arts', 46: 'paddling', 47: 'paragliding', 48: 'pilates', 50: 'racquetball', 51: 'rock_climbing', 52: 'roller_hockey', 53: 'rowing', 54: 'rowing_machine', 55: 'rugby', 56: 'running', 57: 'running_treadmill', 58: 'sailing', 59: 'scuba_diving', 60: 'skating', 61: 'skiing', 62: 'snowboarding', 63: 'snowshoeing', 64: 'soccer', 65: 'softball', 66: 'squash', 68: 'stair_climbing', 69: 'stair_climbing_machine', 70: 'strength_training', 71: 'stretching', 72: 'surfing', 73: 'swimming_open_water', 74: 'swimming_pool', 75: 'table_tennis', 76: 'tennis', 78: 'volleyball', 79: 'walking', 80: 'water_polo', 81: 'weightlifting', 82: 'wheelchair', 83: 'yoga' };
// what "missing" can report: types where no data usually means the band wasn't worn (no workout is normal)
const WORN = ['sleep', 'hrv', 'rhr', 'hr', 'spo2', 'temp', 'steps'];

const pad = n => String(n).padStart(2, '0');
export const localDate = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const hm = ms => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const isoMin = ms => `${localDate(ms)}T${hm(ms)}`;
const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
const mins = ms => Math.round(ms / 60000);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const top = a => { const c = {}; a.forEach(x => { if (x) c[x] = (c[x] || 0) + 1; }); return Object.keys(c).sort((x, y) => c[y] - c[x])[0] || null; };
const uniqBy = (a, k) => { const m = new Map(); a.forEach(x => m.set(k(x), x)); return [...m.values()]; };
const isNap = s => (s.e - s.s) < 3 * 3600e3 && new Date(s.s).getHours() >= 10 && new Date(s.s).getHours() < 20;

function sleepOf(sessions) { // one night, possibly split into several sessions
  const s = Math.min(...sessions.map(x => x.s)), e = Math.max(...sessions.map(x => x.e)), st = sessions.flatMap(x => x.stages || []);
  const dur = list => mins(st.filter(x => list.includes(x.stage)).reduce((a, x) => a + (x.e - x.s), 0));
  const hasStages = st.some(x => [4, 5, 6].includes(x.stage)), awakeMin = dur(STAGE.awake), inBedMin = mins(sessions.reduce((a, x) => a + (x.e - x.s), 0));
  return {
    start: isoMin(s), end: isoMin(e), inBedMin, awakeMin, asleepMin: st.length ? Math.max(0, inBedMin - awakeMin - dur([0])) : inBedMin,
    stages: hasStages ? { deepMin: dur(STAGE.deep), lightMin: dur(STAGE.light), remMin: dur(STAGE.rem) } : null,
    naps: [], src: top(sessions.map(x => x.src)), _s: s, _e: e
  };
}
// samples in the sleep window if there are any, else the whole day
function windowed(list, date, sl) {
  const night = sl ? list.filter(x => x.t >= sl._s && x.t <= sl._e) : [];
  return night.length ? { pts: night, window: 'sleep' } : { pts: list.filter(x => localDate(x.t) === date), window: 'day' };
}

/** raw = health.read() output; returns { [date]: doc } for every date that has any data */
export function summarize(raw, opts = {}) {
  const out = {}, granted = raw.granted || [], tz = opts.tz || raw.zone || (Intl.DateTimeFormat().resolvedOptions().timeZone);
  const day = date => out[date] || (out[date] = { date, v: 1, tz, sleep: null, hrv: null, rhr: null, hr: null, spo2: null, temp: null, steps: null, kcal: null, exercise: [], sources: [] });
  const sleeps = uniqBy(raw.sleep || [], x => x.s + '|' + x.src);
  const nights = {};
  sleeps.filter(x => !isNap(x)).forEach(x => { const d = localDate(x.e); (nights[d] = nights[d] || []).push(x); });
  Object.entries(nights).forEach(([d, list]) => { day(d).sleep = sleepOf(list); });
  sleeps.filter(isNap).forEach(x => { const d = day(localDate(x.e)); if (!d.sleep) d.sleep = { start: null, end: null, inBedMin: 0, awakeMin: 0, asleepMin: 0, stages: null, naps: [], src: x.src }; d.sleep.naps.push({ start: hm(x.s), min: mins(x.e - x.s) }); });
  (raw.days || []).forEach(a => {
    if (a.steps == null && a.activeKcal == null && a.totalKcal == null && a.hrAvg == null) return;
    const d = day(a.date);
    if (a.steps != null) d.steps = Math.round(a.steps);
    if (a.activeKcal != null || a.totalKcal != null) d.kcal = { active: a.activeKcal != null ? Math.round(a.activeKcal) : null, total: a.totalKcal != null ? Math.round(a.totalKcal) : null };
    if (a.hrAvg != null) d.hr = { avg: Math.round(a.hrAvg), min: a.hrMin != null ? Math.round(a.hrMin) : null, max: a.hrMax != null ? Math.round(a.hrMax) : null };
    d.sources.push(...(a.origins || []));
  });
  const dates = new Set([...Object.keys(out), ...[raw.hrv, raw.rhr, raw.spo2, raw.temp].flatMap(l => (l || []).map(x => localDate(x.t))), ...(raw.exercise || []).map(x => localDate(x.s))]);
  dates.forEach(date => {
    const d = day(date), sl = d.sleep && d.sleep._s ? d.sleep : null;
    const hv = windowed(uniqBy(raw.hrv || [], x => x.t), date, sl);
    if (hv.pts.length) d.hrv = { rmssd: r1(mean(hv.pts.map(x => x.ms))), n: hv.pts.length, window: hv.window, src: top(hv.pts.map(x => x.src)) };
    const rh = (raw.rhr || []).filter(x => localDate(x.t) === date).sort((a, b) => a.t - b.t);
    if (rh.length) d.rhr = { bpm: Math.round(rh[rh.length - 1].bpm), src: rh[rh.length - 1].src };
    const ox = windowed(uniqBy(raw.spo2 || [], x => x.t), date, sl);
    if (ox.pts.length) d.spo2 = { avg: r1(mean(ox.pts.map(x => x.pct))), min: r1(Math.min(...ox.pts.map(x => x.pct))), n: ox.pts.length, window: ox.window };
    const tp = windowed(uniqBy(raw.temp || [], x => x.t), date, sl);
    if (tp.pts.length) d.temp = { avgC: r2(mean(tp.pts.map(x => x.c))), loc: LOC[top(tp.pts.map(x => x.loc))] || 'unknown', n: tp.pts.length, window: tp.window };
    d.exercise = uniqBy(raw.exercise || [], x => x.s + '|' + x.src).filter(x => localDate(x.s) === date).sort((a, b) => a.s - b.s)
      .map(x => ({ start: hm(x.s), min: mins(x.e - x.s), type: EX_TYPES[x.type] || 'other_workout', ...(x.title ? { title: String(x.title).slice(0, 60) } : {}), src: x.src }));
    [d.sleep, d.hrv, d.rhr, ...d.exercise].forEach(x => x && x.src && d.sources.push(x.src));
  });
  Object.values(out).forEach(d => {
    if (d.sleep) { delete d.sleep._s; delete d.sleep._e; }
    d.sources = [...new Set(d.sources)].sort();
    d.missing = WORN.filter(k => granted.includes(k) && d[k] == null);
  });
  return out;
}
