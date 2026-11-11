// Shared rules for Lock In 90: used by the app (browser) and by the cloud job (Node).
// No DOM access in this file.

export const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TT = {
  gym: { label: 'Gym workout', sub: 'Start it in Train. Finishing the workout ticks today’s training.' },
  cali: { label: 'Home workout', sub: 'No-equipment workout. Start it in Train.' },
  cardio: { label: 'Cardio session', sub: 'Run, bike, walk or a class. Log it in Train → Cardio, or tick it here.' },
  recovery: { label: 'Mobility + light skill work', sub: '30 to 40 minutes, low intensity' },
  rest: { label: 'Rest day', sub: 'No training required today' }
};
export const DEFAULT_PLAN = { 0: 'recovery', 1: 'gym', 2: 'gym', 3: 'gym', 4: 'gym', 5: 'gym', 6: 'cali' };
export const MILES = [[7, 'First week'], [14, 'Two weeks'], [21, 'Habit set'], [30, 'One month'], [45, 'Halfway'], [60, 'Two months'], [75, 'Day 75'], [90, 'Locked in']];
export const STRENGTH_TYPES = ['WeightTraining', 'Workout', 'Crossfit', 'HighIntensityIntervalTraining'];
export const CARDIO_TYPES = ['Run', 'Walk', 'Hike', 'Ride', 'VirtualRide', 'VirtualRun', 'Rowing', 'VirtualRow', 'Elliptical', 'StairStepper', 'Swim', 'EBikeRide'];

/* dates (YYYY-MM-DD strings, calendar math in local noon to dodge DST edges) */
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const weekday = s => parse(s).getDay();

/* ---------- when a new day starts: midnight (default), Fajr for a city, or a set time ---------- */
export const CITIES = {
  cairo: ['Cairo', 30.0444, 31.2357], giza: ['Giza', 30.0131, 31.2089], alexandria: ['Alexandria', 31.2001, 29.9187], mansoura: ['Mansoura', 31.0409, 31.3785],
  tanta: ['Tanta', 30.7865, 31.0004], zagazig: ['Zagazig', 30.5877, 31.502], damietta: ['Damietta', 31.4165, 31.8133], portsaid: ['Port Said', 31.2653, 32.3019],
  ismailia: ['Ismailia', 30.5965, 32.2715], suez: ['Suez', 29.9668, 32.5498], fayoum: ['Fayoum', 29.3084, 30.8428], benisuef: ['Beni Suef', 29.0661, 31.0994],
  minya: ['Minya', 28.0871, 30.7618], asyut: ['Asyut', 27.181, 31.1837], sohag: ['Sohag', 26.5591, 31.6957], luxor: ['Luxor', 25.6872, 32.6396],
  aswan: ['Aswan', 24.0889, 32.8998], hurghada: ['Hurghada', 27.2579, 33.8116], sharm: ['Sharm El Sheikh', 27.9158, 34.33], matrouh: ['Marsa Matrouh', 31.3543, 27.2373],
};
// Fajr: the sun 19.5° below the horizon before sunrise (Egyptian General Authority of Survey). Returns hours UTC on that date.
export function fajrUTC(date, lat, lng, angle = 19.5) {
  const [y, m, d] = date.split('-').map(Number), rad = Math.PI / 180, D = Date.UTC(y, m - 1, d) / 864e5 + 2440587.5 - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360, q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad)) % 360, e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) / rad / 15, dec = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) / rad;
  const eqt = (((q / 15 - ((RA + 24) % 24)) + 12) % 24 + 24) % 24 - 12, noon = 12 - lng / 15 - eqt;
  const T = Math.acos((-Math.sin(angle * rad) - Math.sin(lat * rad) * Math.sin(dec * rad)) / (Math.cos(lat * rad) * Math.cos(dec * rad))) / rad / 15;
  return noon - T;
}
function clockOf(dt, tz) {
  if (!tz) return { date: ymd(dt), hour: dt.getHours(), minute: dt.getMinutes() };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(dt).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour % 24, minute: +parts.minute };
}
// Fajr on a calendar date as minutes after local midnight (the phone's clock, or tz on the server)
export function fajrMin(date, city, tz) {
  const c = CITIES[city] || CITIES.cairo, [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + fajrUTC(date, c[1], c[2]) * 36e5), k = clockOf(dt, tz || 'Africa/Cairo');
  return k.date === date ? k.hour * 60 + k.minute : 0;
}
export const dayStartMode = ds => ds && (ds.mode === 'fajr' || ds.mode === 'time') ? ds.mode : 'midnight';
// minutes after midnight when the day that starts on `date` begins
export function dayStartMin(ds, date, tz) {
  const mode = dayStartMode(ds);
  if (mode === 'time') return Math.min(360, Math.max(0, hmm(ds.t) ?? 240));
  if (mode === 'fajr') return fajrMin(date, ds.city, tz);
  return 0;
}
const hmm = s => { const [a, b] = String(s || '').split(':').map(Number); return isNaN(a) ? null : a * 60 + (b || 0); };
export const minTxt = m => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`;
// the app's "now": before the day starts (e.g. 1 am with Fajr chosen) it's still the previous date, with hour 24+ so
// "late in the day" logic keeps working. clock = real hour; end = minutes after that date's midnight when the day ends.
export function nowIn(tz, ds) {
  const c = clockOf(new Date(), tz), cm = c.hour * 60 + c.minute, mode = dayStartMode(ds);
  if (mode === 'midnight') return { ...c, clock: c.hour, late: false, starts: 0, end: 1440 };
  const sm = dayStartMin(ds, c.date, tz);
  if (cm < sm) { const date = addDays(c.date, -1); return { date, hour: c.hour + 24, minute: c.minute, clock: c.hour, late: true, starts: dayStartMin(ds, date, tz), end: 1440 + sm }; }
  return { ...c, clock: c.hour, late: false, starts: sm, end: 1440 + dayStartMin(ds, addDays(c.date, 1), tz) };
}

/* nutrition */
export const round = (v, d = 0) => { const m = 10 ** d; return Math.round((v || 0) * m) / m; };
export function itemMacros(it) {
  const f = (it.g || 0) / 100, p = it.per || {};
  return { k: (p.k || 0) * f, p: (p.p || 0) * f, c: (p.c || 0) * f, f: (p.f || 0) * f };
}
/* ---------- more nutrients ---------- */
// daily guides: WHO (sodium < 2,000 mg; free sugars and saturated fat each < 10% of calories; potassium >= 3,510 mg),
// fiber 30 g (EFSA/WHO adult range 25-38 g), calcium 1,000 mg (adult RDA)
export const MICROS = [
  { k: 'na', name: 'Sodium', u: 'mg', max: () => 2000 },
  { k: 'fib', name: 'Fiber', u: 'g', min: () => 30 },
  { k: 'sug', name: 'Sugar', u: 'g', max: kc => Math.round((kc || 2000) * 0.1 / 4) },
  { k: 'sat', name: 'Saturated fat', u: 'g', max: kc => Math.round((kc || 2000) * 0.1 / 9) },
  { k: 'pot', name: 'Potassium', u: 'mg', min: () => 3500 },
  { k: 'ca', name: 'Calcium', u: 'mg', min: () => 1000 },
];
export const saltFromNa = mg => mg * 2.5 / 1000; // g of salt
export const naFromSalt = g => g / 2.5 * 1000;   // mg of sodium
// label sanity: do the calories match protein, carbs and fat? (4/4/9 kcal per g; fiber may or may not be in carbs)
export function checkPer(per) {
  const k = +per.k || 0, p = +per.p || 0, c = +per.c || 0, f = +per.f || 0, a = 4 * p + 4 * c + 9 * f;
  if (k <= 0 && a <= 0) return { level: 'bad', calc: 0 };
  if (p + c + f > 105) return { level: 'bad', calc: Math.round(a) };
  if (k < 8 && a < 12) return { level: 'ok', calc: Math.round(a) }; // water, tea, diet drinks
  const r = Math.abs(a - k) / Math.max(a, k, 1);
  return { level: r > 0.35 ? 'bad' : r > 0.2 ? 'warn' : 'ok', calc: Math.round(a) };
}
// drop nutrient values that can't be right (more saturated fat than fat, more sugar or fiber than carbs, zero sodium on a protein food)
export function cleanPer(per) {
  const o = { ...per };
  if (o.sat != null && o.sat > (o.f || 0) + 0.5) delete o.sat;
  if (o.sug != null && o.sug > (o.c || 0) + 0.5) delete o.sug;
  if (o.fib != null && o.fib > (o.c || 0) + 0.5 && (o.c || 0) > 0) delete o.fib;
  if (o.na != null && (o.na < 0 || o.na > 40000 || (o.na === 0 && (o.p || 0) > 2))) delete o.na;
  ['na', 'sug', 'sat', 'fib', 'pot', 'ca'].forEach(m => { if (o[m] != null && !isFinite(o[m])) delete o[m]; });
  return o;
}
// read a nutrition table from OCR text (English or Arabic). Takes the first number on each line, which on
// Egyptian packs is usually the per-100 g column. Returns { vals: {k,p,c,f,na,salt,sug,sat,fib,pot,ca}, per100, serv }.
export function parseLabel(text) {
  const t = String(text || '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/٫/g, '.').replace(/(\d),(\d)/g, '$1.$2');
  const KEYS = [
    ['sat', /saturat|مشبع/i], ['trans', /trans|متحول/i], ['sug', /sugar|سكر|سكريات/i], ['fib', /fib(re|er)|ألياف|الياف/i], ['na', /sodium|صوديوم/i], ['salt', /\bsalt\b|ملح/i],
    ['pot', /potassium|بوتاسيوم/i], ['ca', /calcium|كالسيوم/i], ['p', /protein|بروتين/i], ['c', /carbohydrate|carbs|كربوهيدرات|نشويات/i], ['f', /\bfats?\b|total fat|دهون|الدهون/i], ['k', /energy|calories|kcal|طاقة|الطاقة|سعرات|السعرات/i]];
  const vals = {}, num = s => { const m = s.match(/\d+(?:\.\d+)?/); return m ? +m[0] : null; };
  t.split(/\n+/).forEach(line => {
    const key = KEYS.find(([, re]) => re.test(line)); if (!key || key[0] === 'trans' || vals[key[0]] != null) return;
    const k = key[0], after = line.slice(line.search(key[1]));
    if (k === 'k') {
      const kc = after.match(/(\d+(?:\.\d+)?)\s*(k?cal|سعر|كيلو\s*سعر)/i), kj = after.match(/(\d+(?:\.\d+)?)\s*(kj|كيلو\s*جول)/i);
      const v = kc ? +kc[1] : kj ? Math.round(+kj[1] / 4.184) : num(after); if (v != null && v < 1000) vals.k = v; else if (v != null && kj) vals.k = Math.round(v / 4.184);
      return;
    }
    if (k === 'na' || k === 'pot' || k === 'ca') {
      const m = after.match(/(\d+(?:\.\d+)?)\s*(mg|ملجم|مجم|مللي?جرام|g\b|جم|جرام|غ)?/i); if (!m) return;
      const g = m[2] && !/^m|^م/i.test(m[2]); vals[k] = g ? Math.round(+m[1] * 1000) : +m[1]; return;
    }
    const v = num(after); if (v != null && v < 100) vals[k] = v;
  });
  const per100 = /100\s*(g|ml|gm|جم|جرام|غ|مل)/i.test(t);
  const sm = t.match(/(serving|portion|حصة|الحصة|وجبة)[^\d\n]{0,25}(\d+(?:\.\d+)?)\s*(g|ml|gm|جم|جرام|غ|مل)/i);
  return { vals, per100, serv: sm ? +sm[2] : null };
}
export function sumItems(items) {
  const t = { k: 0, p: 0, c: 0, f: 0 };
  (items || []).forEach(it => { const m = itemMacros(it); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; });
  return t;
}
/* Ramadan mode: its own meal plan (Suhoor, Iftar, after Taraweeh) and a water window from iftar to fajr.
   Default dates: 1 Ramadan 1448 expected Mon 8 Feb 2027 (NRIAG, Egypt); edit them in Setup once confirmed. */
export const RAMADAN_DEFAULT = { on: false, from: '2027-02-08', to: '2027-03-08', iftar: '17:30', fajr: '04:45' };
export const RAMADAN_MEALS = [{ id: 'r1', name: 'Suhoor', time: '03:45', items: [] }, { id: 'r2', name: 'Iftar', time: '17:30', items: [] }, { id: 'r3', name: 'After Taraweeh', time: '21:30', items: [] }];
export const ramadanOf = settings => ({ ...RAMADAN_DEFAULT, ...((settings && settings.ramadan) || {}) });
// only from the day it was switched on, and not after it was switched off, so toggling never rewrites past days
export const inRamadan = (settings, date) => {
  const r = settings && settings.ramadan;
  if (!r || !date || !(r.on || r.offFrom) || !r.onSince) return false;
  return date >= (r.from || RAMADAN_DEFAULT.from) && date <= (r.to || RAMADAN_DEFAULT.to) && date >= r.onSince && (!r.offFrom || date < r.offFrom);
};
const hm = s => { const [a, b] = String(s || '').split(':').map(Number); return isNaN(a) ? null : a * 60 + (b || 0); };
// share of today's drinking window that has passed, for water pace (normal: 08:00-22:00; Ramadan: midnight-fajr and iftar-midnight)
export function waterPace(settings, date, mins) {
  if (!inRamadan(settings, date)) return Math.min(1, Math.max(0, (mins - 480) / 840));
  const r = ramadanOf(settings), fajr = hm(r.fajr) ?? 285, iftar = hm(r.iftar) ?? 1050;
  if (dayStartMode(settings.dayStart) !== 'midnight') return Math.min(1, Math.max(0, mins - iftar) / (1440 + fajr - iftar)); // the day runs iftar -> next Fajr
  const total = fajr + (1440 - iftar);
  return Math.min(1, (Math.min(mins, fajr) + Math.max(0, mins - iftar)) / total);
}
/* the meal plan changes over time: settings.planLog keeps a copy per change date, so each day uses the plan that was active then */
export function mealsOn(settings, date) {
  if (inRamadan(settings, date)) {
    const rl = settings.ramadanLog || {}, rk = Object.keys(rl).sort().filter(k => k <= date);
    return rk.length ? rl[rk[rk.length - 1]] || [] : settings.ramadanMeals || RAMADAN_MEALS;
  }
  const log = settings.planLog || {};
  const keys = Object.keys(log).sort();
  if (!keys.length) return settings.meals || [];
  const past = keys.filter(k => !date || k <= date);
  return log[past.length ? past[past.length - 1] : keys[0]] || [];
}
export function plannedMeals(settings, day, date) {
  const skip = (day && day.skip) || {};
  return mealsOn(settings, date || (day && day.date)).filter(m => !skip[m.id]);
}
export function planTargets(settings, day, date) {
  return sumItems(plannedMeals(settings, day, date).flatMap(m => m.items || []));
}
export function dayTotals(settings, day) {
  const t = { k: 0, p: 0, c: 0, f: 0 };
  const meals = (day && day.meals) || {};
  Object.keys(meals).forEach(id => {
    const md = meals[id];
    if (!md || !md.status) return;
    if (day.skip && day.skip[id]) return;
    const s = sumItems(md.items || []);
    t.k += s.k; t.p += s.p; t.c += s.c; t.f += s.f;
  });
  (day && day.extras || []).forEach(it => { const m = itemMacros(it); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; });
  return t;
}

/* drinks: anything you drink that you log in a meal or as an extra counts toward water (1 g ≈ 1 ml) */
export const DRINK_IDS = ['coffee', 'coffee_instant', 'coffee_milk', 'tea', 'green_tea', 'cola', 'cola_zero', 'sparkling', 'juice_orange', 'milk_skim', 'milk_full'];
export const isDrink = it => !!it && (it.drink === true || (it.drink !== false && DRINK_IDS.includes(it.fid)));
export function drinkMl(day) {
  if (!day) return 0;
  let ml = 0;
  const meals = day.meals || {}, skip = day.skip || {};
  Object.keys(meals).forEach(id => { const md = meals[id]; if (!md || !md.status || skip[id]) return; (md.items || []).forEach(it => { if (isDrink(it)) ml += it.ml ?? it.g ?? 0; else if (it.meal && it.ml) ml += it.ml; }); });
  (day.extras || []).forEach(it => { if (isDrink(it)) ml += it.ml ?? it.g ?? 0; else if (it.meal && it.ml) ml += it.ml; });
  return Math.round(ml);
}
export const waterTotal = day => ((day && day.water) || 0) + drinkMl(day);

/* the four required pillars */
export function trainType(settings, date) {
  const p = (settings && settings.plan) || DEFAULT_PLAN;
  return p[weekday(date)] || 'rest';
}
export function pillars(settings, day, date) {
  day = day || {};
  const pm = plannedMeals(settings, day, date);
  const meals = day.meals || {};
  const cheatDay = !!(day.cheatDay && settings.cheat && settings.cheat.on);
  const isClean = id => cheatDay || (meals[id] && (meals[id].status === 'plan' || meals[id].status === 'swap' || meals[id].status === 'cheat'));
  const off = cheatDay ? [] : pm.filter(m => meals[m.id] && meals[m.id].status === 'off');
  const clean = pm.filter(m => isClean(m.id)).length;
  const goal = settings.waterGoal || 3500, wDrinks = drinkMl(day), w = (day.water || 0) + wDrinks;
  const tt = trainType(settings, date);
  const req = (settings.supps || []).filter(s => s.req);
  const sDone = req.filter(s => (day.supps || {})[s.id]).length;
  const offExtra = cheatDay ? [] : (day.extras || []).filter(x => x.off && !(x.cheat && settings.cheat && settings.cheat.on));
  return { pm, clean, off, offExtra, cheatDay, cheats: cheatDay ? 1 : pm.filter(m => meals[m.id] && meals[m.id].status === 'cheat').length + (day.extras || []).filter(x => x.cheat).length, wDrinks, mealsOk: pm.length > 0 && clean === pm.length && !offExtra.length, goal, w, tt, trained: tt === 'rest' || !!day.trainingDone, req, sDone };
}
/* your own week: starts Saturday, the weekday you started the challenge (default), or a day you pick (0 = Sunday) */
export function weekStartDay(settings) {
  const w = (settings && settings.weekStart) || {};
  return w.mode === 'sat' ? 6 : w.mode === 'day' && w.d >= 0 && w.d <= 6 ? +w.d : settings && settings.startDate ? weekday(settings.startDate) : 6;
}
export const myWeekStart = (settings, date) => addDays(date, -((weekday(date) - weekStartDay(settings) + 7) % 7));
/* free cheat meals: how many are allowed in the window around `date`, and the window itself */
export function cheatWindow(settings, date) {
  const c = (settings && settings.cheat) || {}, ws = myWeekStart(settings, date);
  if (c.per === '1of2w') { const w0 = myWeekStart(settings, settings.startDate || date), k = Math.floor(diffDays(w0, ws) / 14); const from = addDays(w0, k * 14); return { from, to: addDays(from, 13), max: 1 }; }
  return { from: ws, to: addDays(ws, 6), max: c.per === '2w' ? 2 : 1 };
}
export function cheatsUsed(settings, days, date, exceptDate) {
  const win = cheatWindow(settings, date); let n = 0; const on = [];
  for (let d = win.from; d <= win.to; d = addDays(d, 1)) {
    const day = days[d]; if (!day) continue;
    const k = day.cheatDay ? 1 : Object.values(day.meals || {}).filter(m => m && m.status === 'cheat').length + (day.extras || []).filter(x => x && x.cheat).length;
    if (k && d !== exceptDate) { n += k; on.push(d); }
  }
  return { ...win, used: n, on, left: Math.max(0, win.max - n) };
}
/* weekly calorie budget: going over one day lowers the rest of your week's targets a little.
   Under-eating is never saved up. One day drops at most maxPct% and never below the floor. Debt ends with the week. */
export const BUDGET_DEFAULT = { on: false, mode: 'spread', maxPct: 20, floor: 1200, cheat: false, trim: true };
export const budgetOf = settings => ({ ...BUDGET_DEFAULT, ...((settings && settings.budget) || {}) });
export function budgetDay(settings, days, date) {
  const b = budgetOf(settings), ws = myWeekStart(settings, date), we = addDays(ws, 6), start = settings.startDate || ws;
  let debt = 0; const log = [];
  for (let d = ws; d <= date; d = addDays(d, 1)) {
    const day = (days && days[d]) || {}, base = Math.round(planTargets(settings, day, d).k || 0);
    const left = diffDays(d, we) + 1, room = Math.max(0, Math.min(base * b.maxPct / 100, base - b.floor));
    const cut = base && d >= start && debt >= 50 ? Math.round(Math.min(room, b.mode === 'asap' ? debt : debt / left)) : 0;
    const row = { d, base, cut, target: base - cut, debtIn: Math.round(debt) };
    if (d < date && d >= start && base) {
      const eaten = Math.round(dayTotals(settings, day).k || 0), logged = Object.values(day.meals || {}).some(m => m && m.status) || (day.extras || []).length;
      const cheat = !b.cheat && pillars(settings, day, d).cheats > 0;
      if (logged) { const raw = eaten - base, delta = raw > 0 && raw < 50 ? 0 : raw; /* ignore small logging noise */ row.eaten = eaten; row.over = delta > 0 && !cheat ? delta : 0; debt = Math.max(0, debt + (cheat ? Math.min(0, Math.max(delta, -cut)) : Math.max(delta, -cut))); }
    }
    log.push(row);
  }
  const today = log[log.length - 1];
  return { ...today, debt: Math.round(debt), log, from: ws, to: we, budget: log.reduce((a, r) => a + r.base, 0) + Array.from({ length: diffDays(date, we) }, (_, i) => Math.round(planTargets(settings, (days || {})[addDays(date, i + 1)] || {}, addDays(date, i + 1)).k || 0)).reduce((a, v) => a + v, 0), on: b.on };
}
// suggest smaller portions for today's planned meals that remove about `cut` kcal from carb and fat foods (never protein foods)
export function trimPlan(meals, cut) {
  const out = {}; if (!(cut > 0)) return out;
  const cand = []; meals.forEach(m => (m.items || []).forEach((it, i) => { const k = (it.per.k || 0) * (it.g || 0) / 100, pk = (it.per.p || 0) * 4 * (it.g || 0) / 100; if (k > 15 && (it.per.k || 0) >= 50 && pk / k < 0.3 && !it.fat) cand.push({ m: m.id, i, it, k }); }));
  const total = cand.reduce((a, x) => a + x.k, 0); if (!total) return out;
  cand.forEach(x => {
    const want = Math.min(x.k * 0.5, cut * x.k / total), step = x.it.g >= 50 ? 5 : 1;
    let g = Math.round((x.it.g - want / ((x.it.per.k || 1) / 100)) / step) * step; g = Math.max(step, Math.min(x.it.g, g));
    if (g < x.it.g) (out[x.m] = out[x.m] || []).push({ i: x.i, from: x.it.g, to: g, kcal: Math.round((x.it.g - g) * x.it.per.k / 100), name: x.it.name });
  });
  return out;
}
export function evalDay(settings, day, date) {
  day = day || {};
  const P = pillars(settings, day, date);
  const meals = day.meals || {};
  const missing = [];
  if (P.off.length) missing.push(P.off.length === 1 ? `${P.off[0].name} was off-plan` : `${P.off.length} meals were off-plan`);
  if (P.offExtra.length) missing.push(P.offExtra.length === 1 ? `Off-plan extra: ${P.offExtra[0].name}` : `${P.offExtra.length} off-plan extras`);
  const unlogged = P.pm.filter(m => !meals[m.id] || !meals[m.id].status);
  if (unlogged.length) missing.push(unlogged.length === P.pm.length ? `Log your ${P.pm.length} meals` : `Log ${unlogged.map(m => m.name).join(', ')}`);
  if (P.w < P.goal) missing.push(`Water at ${round(P.w / 1000, 2)} of ${round(P.goal / 1000, 2)} L`);
  if (!P.trained) missing.push(TT[P.tt].label);
  const ms = P.req.filter(s => !(day.supps || {})[s.id]);
  if (ms.length) missing.push(`Supplements: ${ms.map(s => s.name).join(', ')}`);
  return { complete: missing.length === 0, missing, offPlan: P.off.length > 0 || P.offExtra.length > 0, P };
}

/* sports: MET values from the 2024 Adult Compendium of Physical Activities (easy / normal / hard).
   Padel has no Compendium entry; it uses paddleball casual (6.0) and competitive tennis-like effort. */
export const SPORTS = [
  { id: 'football', name: 'Football', ic: '⚽', met: [7.0, 8.0, 9.5] },
  { id: 'padel', name: 'Padel', ic: '🎾', met: [6.0, 7.0, 8.0] },
  { id: 'tennis', name: 'Tennis', ic: '🎾', met: [6.0, 6.8, 8.0] },
  { id: 'basketball', name: 'Basketball', ic: '🏀', met: [6.0, 7.5, 8.0] },
  { id: 'volleyball', name: 'Volleyball', ic: '🏐', met: [3.0, 4.0, 6.0] },
  { id: 'squash', name: 'Squash', ic: '🎾', met: [7.3, 9.0, 12.0] },
  { id: 'badminton', name: 'Badminton', ic: '🏸', met: [5.5, 7.0, 9.0] },
  { id: 'tabletennis', name: 'Table tennis', ic: '🏓', met: [3.5, 4.0, 5.0] },
  { id: 'handball', name: 'Handball', ic: '🤾', met: [8.0, 10.0, 12.0] },
  { id: 'swim', name: 'Swimming', ic: '🏊', met: [5.8, 7.0, 9.8] },
  { id: 'boxing', name: 'Boxing / MMA', ic: '🥊', met: [5.8, 7.8, 12.3] },
  { id: 'run', name: 'Running', ic: '🏃', met: [7.0, 8.3, 9.8] },
  { id: 'cycle', name: 'Cycling', ic: '🚴', met: [4.0, 7.5, 10.0] },
  { id: 'walk', name: 'Walking', ic: '🚶', met: [3.0, 3.5, 5.0] },
  { id: 'hike', name: 'Hiking', ic: '🥾', met: [5.3, 6.0, 7.8] },
  { id: 'other', name: 'Other sport', ic: '➕', met: [4.0, 6.0, 8.0] }
];
export const LEVELS = ['Easy', 'Normal', 'Hard'];
export const sportById = id => SPORTS.find(s => s.id === id) || SPORTS[SPORTS.length - 1];
// kcal for one session. With an average heart rate and age it uses Keytel et al. (2005); otherwise MET × kg × hours.
export function sportKcal(s, kg, prof) {
  const min = s.min || 0;
  if (s.hr >= 90 && s.hr <= 200 && prof && prof.age >= 16 && kg > 0) {
    const kj = prof.sex === 'f' ? -20.4022 + 0.4472 * s.hr - 0.1263 * kg + 0.074 * prof.age : -55.0969 + 0.6309 * s.hr + 0.1988 * kg + 0.2017 * prof.age;
    return Math.max(0, kj / 4.184 * min);
  }
  return sportById(s.sport).met[s.lvl ?? 1] * (kg || 80) * min / 60;
}
// moderate-equivalent minutes (WHO: vigorous minutes count double; MET >= 6 is vigorous)
export const sportModMin = s => (s.min || 0) * (sportById(s.sport).met[s.lvl ?? 1] >= 6 ? 2 : 1);

/* strict run: any closed day that is incomplete resets the attempt */
export function computeRun(settings, days, now) {
  if (!settings || !settings.startDate) return null;
  const today = now.date;
  let attemptStart = settings.attemptStart && settings.attemptStart > settings.startDate ? settings.attemptStart : settings.startDate;
  // the 3 am grace window only applies to a day inside the challenge (not the day before a start or reset)
  const grace = dayStartMode(settings.dayStart) === 'midnight' && now.hour < 3 && addDays(today, -1) >= attemptStart ? addDays(today, -1) : null;
  const attempts = [];
  let lastFail = null;
  for (let d = attemptStart; d < today; d = addDays(d, 1)) {
    if (d === grace) continue;
    if (!evalDay(settings, days[d], d).complete) {
      attempts.push({ start: attemptStart, fail: d, len: diffDays(attemptStart, d) });
      attemptStart = addDays(d, 1);
      lastFail = d;
    }
  }
  let done = 0;
  for (let d = attemptStart; d <= today; d = addDays(d, 1)) if (evalDay(settings, days[d], d).complete) done++;
  const todayEval = evalDay(settings, days[today], today);
  const best = Math.max(done, ...attempts.map(a => a.len), 0);
  return { attemptStart, attempts, dayNum: diffDays(attemptStart, today) + 1, done, todayEval, best, grace, critical: lastFail === addDays(today, -1), attemptNo: attempts.length + 1 + (settings.attemptBase || 0), victory: done >= 90 };
}

/* stamina program: 12 weeks, 3 sessions a week, low impact */
export function staminaWeek(week) {
  if (week <= 4) return { phase: 'Base', week, sessions: [
    { kind: 'easy', min: 25, text: 'Easy · 25–35 min' }, { kind: 'easy', min: 25, text: 'Easy · 25–35 min' }, { kind: 'easy', min: 25, text: 'Easy · 25–35 min' }],
    how: 'Conversational pace: you can talk in full sentences. Incline treadmill, bike, rower or elliptical after lifting.' };
  if (week <= 8) return { phase: 'Build', week, sessions: [
    { kind: 'easy', min: 35, text: 'Easy · 35–45 min' }, { kind: 'easy', min: 35, text: 'Easy · 35–45 min' }, { kind: 'intervals', min: 20, text: 'Intervals · 6 × 1 min hard / 2 min easy' }],
    how: 'Two easy sessions plus one interval session. Hard = you can only say a few words. Warm up 5 min first.' };
  return { phase: 'Push', week, sessions: [
    { kind: 'easy', min: 45, text: 'Easy · 45 min' }, { kind: 'easy', min: 45, text: 'Easy · 45 min' }, { kind: 'intervals', min: 25, text: 'Intervals · 8 × 1 min or 4 × 3 min hard' }],
    how: 'Longer easy work and harder intervals. Walk-jog intervals on the treadmill are fine now if your knees feel good.' };
}
export const isTestWeek = week => week % 4 === 0;
