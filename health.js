// Health Connect bridge (Android app only), on top of the @capgo/capacitor-health plugin (window.Capacitor.Plugins.Health).
// Reading only: nothing here writes to Health Connect or to Firestore. Everything plugin-specific lives in this top
// section; summarize() below works on a fixed raw shape, so swapping the plugin again only means rewriting read().

const plugin = () => { const C = window.Capacitor; return C && ((C.Plugins && C.Plugins.Health) || (C.registerPlugin && C.registerPlugin('Health'))); };

/** True inside the Android app, where Health Connect can be used. */
export const supported = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && plugin());

/** All the types the app asks for, in the order they're shown. */
export const TYPES = ['sleep', 'hrv', 'rhr', 'hr', 'spo2', 'temp', 'steps', 'activeKcal', 'totalKcal', 'exercise', 'distance', 'floors', 'resp', 'vo2', 'bp', 'weight'];
// our name -> the plugin's HealthDataType (the plugin's own manifest already declares all of these read permissions)
const CAP = { sleep: 'sleep', hrv: 'heartRateVariability', rhr: 'restingHeartRate', hr: 'heartRate', spo2: 'oxygenSaturation', temp: 'bodyTemperature', steps: 'steps', activeKcal: 'calories', totalKcal: 'totalCalories', exercise: 'workouts', distance: 'distance', floors: 'flightsClimbed', resp: 'respiratoryRate', vo2: 'vo2Max', bp: 'bloodPressure', weight: 'weight' };
/** Friendly name for the app that wrote a record (Health Connect gives package names). */
export function appName(src) {
  if (!src) return null;
  const s = String(src);
  const known = [[/kieslect|kstyle/i, 'Kieslect'], [/lyfta/i, 'Lyfta'], [/apps\.fitness|google\.android\.apps\.fit/i, 'Google Fit'], [/shealth|samsung/i, 'Samsung Health'], [/strava/i, 'Strava'], [/xiaomi|mi\.health|mifit|zepp/i, 'Zepp / Mi Fitness'], [/huawei/i, 'Huawei Health'], [/healthdata/i, 'Health Connect']];
  for (const [re, n] of known) if (re.test(s)) return n;
  return /\./.test(s) ? s.split('.').slice(-1)[0] : s;
}
const OURS = Object.fromEntries(Object.entries(CAP).map(([k, v]) => [v, k]));

async function granted() {
  const r = await plugin().checkAuthorization({ read: TYPES.map(t => CAP[t]), write: [] });
  return (r.readAuthorized || []).map(t => OURS[t]).filter(Boolean);
}

/** { available: 'yes' | 'update' | 'no', granted: [type…] } */
export async function status() {
  if (!supported()) return { available: 'no', granted: [] };
  const a = await plugin().isAvailable();
  if (!a.available) return { available: /update|outdated|install/i.test(a.reason || '') ? 'update' : 'no', granted: [] };
  return { available: 'yes', granted: await granted() };
}

/** Opens the Health Connect permission screen; resolves with the new status. */
export async function connect() {
  await plugin().requestAuthorization({ read: TYPES.map(t => CAP[t]), write: [] });
  return status();
}

/** Health Connect settings, or its Play Store page when it's missing or out of date. */
export const openSettings = () => plugin().openHealthConnectSettings();

const iso = d => d.toISOString().slice(0, 10);
const addDays = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const midnight = date => new Date(date + 'T00:00:00').toISOString(); // local midnight as an ISO instant
const ms = x => Date.parse(x);
// the plugin's sleep stages -> Health Connect stage numbers that summarize() works with
const STAGE_NUM = { unknown: 0, awake: 1, asleep: 2, inBed: 2, outOfBed: 3, light: 4, deep: 5, rem: 6, awakeInBed: 7 };
const snake = s => String(s || 'other_workout').replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const safe = async (fn, fallback) => { try { return await fn(); } catch (e) { return fallback; } };

/**
 * Raw readings for local dates start..end (inclusive). Samples are read a week at a time, daily totals a month at a time.
 * Returns { zone, granted, days: [{date, steps, activeKcal, totalKcal, hrAvg, hrMin, hrMax}],
 *           sleep: [{s, e, src, stages: [{s, e, stage}]}], hrv: [{t, ms, src}], rhr: [{t, bpm, src}],
 *           spo2: [{t, pct, src}], temp: [{t, c, loc, src}], exercise: [{s, e, type, title?, src}] }
 * Times are epoch milliseconds. Records near the edges can repeat between chunks; callers key them by start time.
 */
export async function read(start, end) {
  const P = plugin(), g = await granted(), has = t => g.includes(t);
  const out = { zone: Intl.DateTimeFormat().resolvedOptions().timeZone, granted: g, days: [], sleep: [], hrv: [], rhr: [], spo2: [], temp: [], exercise: [], resp: [], vo2: [], bp: [], weight: [] };
  const per = {}; // date -> daily totals
  const dayRow = d => per[d] || (per[d] = { date: d });
  const localDay = x => { const d = new Date(ms(x)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const agg = async (type, aggregation, a, b, field) => {
    const r = await safe(() => P.queryAggregated({ dataType: type, startDate: midnight(a), endDate: midnight(addDays(b, 1)), bucket: 'day', aggregation }), { samples: [] });
    for (const x of r.samples || []) dayRow(localDay(x.startDate))[field] = x.value;
  };
  for (let a = start; a <= end; a = addDays(a, 31)) {
    const b = addDays(a, 30) < end ? addDays(a, 30) : end;
    if (has('steps')) await agg('steps', 'sum', a, b, 'steps');
    if (has('activeKcal')) await agg('calories', 'sum', a, b, 'activeKcal');
    if (has('totalKcal')) await agg('totalCalories', 'sum', a, b, 'totalKcal');
    if (has('hr')) { await agg('heartRate', 'average', a, b, 'hrAvg'); await agg('heartRate', 'min', a, b, 'hrMin'); await agg('heartRate', 'max', a, b, 'hrMax'); }
    if (has('distance')) await agg('distance', 'sum', a, b, 'dist');
    if (has('floors')) await agg('flightsClimbed', 'sum', a, b, 'floors');
  }
  out.days = Object.values(per).sort((x, y) => x.date < y.date ? -1 : 1);
  const samples = async (type, a, b) => (await safe(() => P.readSamples({ dataType: type, startDate: midnight(a), endDate: midnight(addDays(b, 1)), limit: 5000, ascending: true }), { samples: [] })).samples || [];
  for (let a = start; a <= end; a = addDays(a, 7)) {
    const b = addDays(a, 6) < end ? addDays(a, 6) : end, src = x => x.sourceId || x.sourceName || null;
    if (has('sleep')) for (const x of await samples('sleep', addDays(a, -1), b)) // a night starts the evening before
      out.sleep.push({ s: ms(x.startDate), e: ms(x.endDate), src: src(x), stages: (x.stages || []).map(t => ({ s: ms(t.startDate), e: ms(t.endDate), stage: STAGE_NUM[t.stage] ?? 0 })) });
    if (has('hrv')) for (const x of await samples('heartRateVariability', a, b)) out.hrv.push({ t: ms(x.startDate), ms: x.value, src: src(x) });
    if (has('rhr')) for (const x of await samples('restingHeartRate', a, b)) out.rhr.push({ t: ms(x.startDate), bpm: x.value, src: src(x) });
    if (has('spo2')) for (const x of await samples('oxygenSaturation', a, b)) out.spo2.push({ t: ms(x.startDate), pct: x.value <= 1 ? x.value * 100 : x.value, src: src(x) });
    if (has('temp')) for (const x of await samples('bodyTemperature', a, b)) out.temp.push({ t: ms(x.startDate), c: x.unit === 'fahrenheit' ? (x.value - 32) * 5 / 9 : x.value, loc: null, src: src(x) });
    if (has('resp')) for (const x of await samples('respiratoryRate', a, b)) out.resp.push({ t: ms(x.startDate), v: x.value, src: src(x) });
    if (has('vo2')) for (const x of await samples('vo2Max', a, b)) out.vo2.push({ t: ms(x.startDate), v: x.value, src: src(x) });
    if (has('bp')) for (const x of await samples('bloodPressure', a, b)) if (x.systolic && x.diastolic) out.bp.push({ t: ms(x.startDate), sys: x.systolic, dia: x.diastolic, src: src(x) });
    if (has('weight')) for (const x of await samples('weight', a, b)) out.weight.push({ t: ms(x.startDate), kg: x.unit === 'gram' ? x.value / 1000 : x.value, src: src(x) });
  }
  if (has('exercise')) {
    let anchor;
    do {
      const r = await safe(() => P.queryWorkouts({ startDate: midnight(start), endDate: midnight(addDays(end, 1)), limit: 500, ascending: true, ...(anchor ? { anchor } : {}) }), { workouts: [] });
      for (const w of r.workouts || []) out.exercise.push({ s: ms(w.startDate), e: ms(w.endDate), type: snake(w.workoutType), title: (w.metadata && (w.metadata.title || w.metadata.name)) || null, src: w.sourceId || w.sourceName || null });
      anchor = r.anchor;
    } while (anchor);
  }
  return out;
}

/* ---------- daily summary: raw readings -> users/{uid}/health/{date} (schema v1) ----------
   One doc per local date. Sleep belongs to the morning you wake up; naps (< 3 h, starting 10:00–20:00) are listed apart.
   HRV, oxygen and temperature use the night's sleep window when there is one, otherwise the whole day.
   Nothing here is derived across days (no recovery score): that needs a baseline and is the agent's job. */
const STAGE = { awake: [1, 3, 7], light: [4], deep: [5], rem: [6] };
const LOC = { 1: 'armpit', 2: 'finger', 3: 'forehead', 4: 'mouth', 6: 'temple', 7: 'toe', 8: 'ear', 9: 'wrist' };
// Health Connect ExerciseSessionRecord.EXERCISE_TYPE_* values (kept for raw numeric types; the Capgo plugin sends names)
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
  const day = date => out[date] || (out[date] = { date, v: 1, tz, sleep: null, hrv: null, rhr: null, hr: null, spo2: null, temp: null, steps: null, kcal: null, dist: null, floors: null, resp: null, vo2: null, bp: null, weight: null, exercise: [], sources: [] });
  const sleeps = uniqBy(raw.sleep || [], x => x.s + '|' + x.src);
  const nights = {};
  // a night belongs to the morning you wake up; a part that ends in the evening (asleep early, woke before midnight,
  // slept again) belongs to the next morning, so the two parts count as one night
  const wakeDate = x => { const e = new Date(x.e); return localDate(e.getHours() >= 18 ? x.e + 8 * 3600e3 : x.e); };
  sleeps.filter(x => !isNap(x)).forEach(x => { const d = wakeDate(x); (nights[d] = nights[d] || []).push(x); });
  Object.entries(nights).forEach(([d, list]) => { day(d).sleep = sleepOf(list); });
  sleeps.filter(isNap).forEach(x => { const d = day(localDate(x.e)); if (!d.sleep) d.sleep = { start: null, end: null, inBedMin: 0, awakeMin: 0, asleepMin: 0, stages: null, naps: [], src: x.src }; d.sleep.naps.push({ start: hm(x.s), min: mins(x.e - x.s) }); });
  (raw.days || []).forEach(a => {
    if (a.steps == null && a.activeKcal == null && a.totalKcal == null && a.hrAvg == null && a.dist == null && a.floors == null) return;
    const d = day(a.date);
    if (a.steps != null) d.steps = Math.round(a.steps);
    if (a.dist != null && a.dist > 0) d.dist = Math.round(a.dist);   // metres
    if (a.floors != null && a.floors > 0) d.floors = Math.round(a.floors);
    if (a.activeKcal != null || a.totalKcal != null) d.kcal = { active: a.activeKcal != null ? Math.round(a.activeKcal) : null, total: a.totalKcal != null ? Math.round(a.totalKcal) : null };
    if (a.hrAvg != null) d.hr = { avg: Math.round(a.hrAvg), min: a.hrMin != null ? Math.round(a.hrMin) : null, max: a.hrMax != null ? Math.round(a.hrMax) : null };
    d.sources.push(...(a.origins || []));
  });
  const dates = new Set([...Object.keys(out), ...[raw.hrv, raw.rhr, raw.spo2, raw.temp, raw.resp, raw.vo2, raw.bp, raw.weight].flatMap(l => (l || []).map(x => localDate(x.t))), ...(raw.exercise || []).map(x => localDate(x.s))]);
  dates.forEach(date => {
    const d = day(date), sl = d.sleep && d.sleep._s ? d.sleep : null;
    const hv = windowed(uniqBy(raw.hrv || [], x => x.t), date, sl);
    if (hv.pts.length) d.hrv = { rmssd: r1(mean(hv.pts.map(x => x.ms))), n: hv.pts.length, window: hv.window, src: top(hv.pts.map(x => x.src)) };
    const rh = (raw.rhr || []).filter(x => localDate(x.t) === date).sort((a, b) => a.t - b.t);
    if (rh.length) d.rhr = { bpm: Math.round(rh[rh.length - 1].bpm), src: rh[rh.length - 1].src };
    const ox = windowed(uniqBy(raw.spo2 || [], x => x.t), date, sl);
    if (ox.pts.length) d.spo2 = { avg: r1(mean(ox.pts.map(x => x.pct))), min: r1(Math.min(...ox.pts.map(x => x.pct))), n: ox.pts.length, window: ox.window, src: top(ox.pts.map(x => x.src)) };
    const tp = windowed(uniqBy(raw.temp || [], x => x.t), date, sl);
    if (tp.pts.length) d.temp = { avgC: r2(mean(tp.pts.map(x => x.c))), loc: LOC[top(tp.pts.map(x => x.loc))] || 'unknown', n: tp.pts.length, window: tp.window, src: top(tp.pts.map(x => x.src)) };
    const rr = windowed(uniqBy(raw.resp || [], x => x.t), date, sl);
    if (rr.pts.length) d.resp = { avg: r1(mean(rr.pts.map(x => x.v))), n: rr.pts.length, window: rr.window, src: top(rr.pts.map(x => x.src)) };
    const lastOf = list => { const a = uniqBy(list || [], x => x.t).filter(x => localDate(x.t) === date).sort((p, q) => p.t - q.t); return a.length ? a[a.length - 1] : null; };
    const vo = lastOf(raw.vo2); if (vo) d.vo2 = { v: r1(vo.v), src: vo.src };
    const bps = uniqBy(raw.bp || [], x => x.t).filter(x => localDate(x.t) === date);
    if (bps.length) d.bp = { sys: Math.round(mean(bps.map(x => x.sys))), dia: Math.round(mean(bps.map(x => x.dia))), n: bps.length, src: top(bps.map(x => x.src)) };
    const wt = lastOf(raw.weight); if (wt) d.weight = { kg: r1(wt.kg), src: wt.src };
    d.exercise = uniqBy(raw.exercise || [], x => x.s + '|' + x.src).filter(x => localDate(x.s) === date).sort((a, b) => a.s - b.s)
      .map(x => ({ start: hm(x.s), min: mins(x.e - x.s), type: typeof x.type === 'string' ? x.type : (EX_TYPES[x.type] || 'other_workout'), ...(x.title ? { title: String(x.title).slice(0, 60) } : {}), src: x.src }));
    [d.sleep, d.hrv, d.rhr, d.spo2, d.temp, d.resp, d.vo2, d.bp, d.weight, ...d.exercise].forEach(x => x && x.src && d.sources.push(x.src));
  });
  Object.values(out).forEach(d => {
    if (d.sleep) { delete d.sleep._s; delete d.sleep._e; }
    d.sources = [...new Set(d.sources)].sort();
    d.missing = WORN.filter(k => granted.includes(k) && d[k] == null);
  });
  return out;
}
