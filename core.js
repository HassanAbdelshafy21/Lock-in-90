// Shared rules for Lock In 90: used by the app (browser) and by the cloud job (Node).
// No DOM access in this file.

export const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TT = {
  gym: { label: 'Gym session', sub: 'Your PPLUL day in Lyfta. Ticks itself when it reaches Strava.' },
  cali: { label: 'Calisthenics session', sub: 'Log your sets in the Train tab' },
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
export function plannedMeals(settings, day) {
  const skip = (day && day.skip) || {};
  return (settings.meals || []).filter(m => !skip[m.id]);
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

/* the four required pillars */
export function trainType(settings, date) {
  const p = (settings && settings.plan) || DEFAULT_PLAN;
  return p[weekday(date)] || 'rest';
}
export function pillars(settings, day, date) {
  day = day || {};
  const pm = plannedMeals(settings, day);
  const meals = day.meals || {};
  const isClean = id => meals[id] && (meals[id].status === 'plan' || meals[id].status === 'swap');
  const off = pm.filter(m => meals[m.id] && meals[m.id].status === 'off');
  const clean = pm.filter(m => isClean(m.id)).length;
  const goal = settings.waterGoal || 3500, w = day.water || 0;
  const tt = trainType(settings, date);
  const req = (settings.supps || []).filter(s => s.req);
  const sDone = req.filter(s => (day.supps || {})[s.id]).length;
  const offExtra = (day.extras || []).filter(x => x.off);
  return { pm, clean, off, offExtra, mealsOk: pm.length > 0 && clean === pm.length && !offExtra.length, goal, w, tt, trained: tt === 'rest' || !!day.trainingDone, req, sDone };
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

/* strict run: any closed day that is incomplete resets the attempt */
export function computeRun(settings, days, now) {
  if (!settings || !settings.startDate) return null;
  const today = now.date;
  const grace = now.hour < 3 ? addDays(today, -1) : null;
  let attemptStart = settings.attemptStart && settings.attemptStart > settings.startDate ? settings.attemptStart : settings.startDate;
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
  return { attemptStart, attempts, dayNum: diffDays(attemptStart, today) + 1, done, todayEval, best, grace, critical: lastFail === addDays(today, -1), attemptNo: attempts.length + 1, victory: done >= 90 };
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
