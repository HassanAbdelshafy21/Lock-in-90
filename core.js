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

export function nowIn(tz) {
  if (!tz) { const d = new Date(); return { date: ymd(d), hour: d.getHours(), minute: d.getMinutes() }; }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour, minute: +parts.minute };
}

/* nutrition */
export const round = (v, d = 0) => { const m = 10 ** d; return Math.round((v || 0) * m) / m; };
export function itemMacros(it) {
  const f = (it.g || 0) / 100, p = it.per || {};
  return { k: (p.k || 0) * f, p: (p.p || 0) * f, c: (p.c || 0) * f, f: (p.f || 0) * f };
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
  const r = ramadanOf(settings), fajr = hm(r.fajr) ?? 285, iftar = hm(r.iftar) ?? 1050, total = fajr + (1440 - iftar);
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
export const DRINK_IDS = ['coffee', 'coffee_milk', 'tea', 'green_tea', 'cola', 'cola_zero', 'sparkling', 'juice_orange', 'milk_skim', 'milk_full'];
export const isDrink = it => !!it && (it.drink === true || (it.drink !== false && DRINK_IDS.includes(it.fid)));
export function drinkMl(day) {
  if (!day) return 0;
  let ml = 0;
  const meals = day.meals || {}, skip = day.skip || {};
  Object.keys(meals).forEach(id => { const md = meals[id]; if (!md || !md.status || skip[id]) return; (md.items || []).forEach(it => { if (isDrink(it)) ml += it.g || 0; }); });
  (day.extras || []).forEach(it => { if (isDrink(it)) ml += it.g || 0; });
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
  const isClean = id => meals[id] && (meals[id].status === 'plan' || meals[id].status === 'swap');
  const off = pm.filter(m => meals[m.id] && meals[m.id].status === 'off');
  const clean = pm.filter(m => isClean(m.id)).length;
  const goal = settings.waterGoal || 3500, wDrinks = drinkMl(day), w = (day.water || 0) + wDrinks;
  const tt = trainType(settings, date);
  const req = (settings.supps || []).filter(s => s.req);
  const sDone = req.filter(s => (day.supps || {})[s.id]).length;
  const offExtra = (day.extras || []).filter(x => x.off);
  return { pm, clean, off, offExtra, wDrinks, mealsOk: pm.length > 0 && clean === pm.length && !offExtra.length, goal, w, tt, trained: tt === 'rest' || !!day.trainingDone, req, sDone };
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
  const grace = now.hour < 3 && addDays(today, -1) >= attemptStart ? addDays(today, -1) : null;
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
