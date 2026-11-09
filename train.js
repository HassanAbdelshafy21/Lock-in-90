// Train v2: programs for gym, dumbbells or no equipment, a guided workout logger, cardio after lifting,
// and a library of 873 exercises (free-exercise-db, public domain) with start/end photos.
import * as C from './core.js';

let X = null;                       // app context (state + helpers), set by initTrain
export function initTrain(ctx) { X = ctx; }
const $ = id => document.getElementById(id);
const esc = s => X.esc(s);

/* ---------- exercise library ---------- */
let DB = null, dbP = null, HOW = null, howP = null;
export function loadDB() {
  if (DB) return Promise.resolve(DB);
  return dbP = dbP || fetch('ex/db.json').then(r => r.json()).then(a => {
    DB = { list: a.map(r => ({ id: r[0], name: r[1], eq: r[2], pm: r[3], sm: r[4], lv: r[5], cat: r[6], mech: r[7], img: r[8] })), by: {} };
    DB.list.forEach(e => DB.by[e.id] = e); X.draw(); return DB;
  }).catch(() => { dbP = null; return null; });
}
function loadHow() { return howP = howP || fetch('ex/howto.json').then(r => r.json()).then(j => HOW = j).catch(() => { howP = null; return null; }); }
const ex = id => { if (CX[id]) { const c = CX[id], ph = c.ph && DB && DB.by[c.ph]; return { id, name: c.name, eq: 'body only', pm: c.pm || [], sm: [], img: ph ? ph.img : 0, mech: 'compound', cat: 'strength', lv: 'i', cx: true }; } return (DB && DB.by[id]) || { id, name: ((X && X.S.settings && X.S.settings.train && (X.S.settings.train.custom || {})[id]) || {}).name || String(id).replace(/^x-/, '').replace(/[_-]/g, ' '), eq: '', pm: [], sm: [], img: 0 }; };
const img = (id, i) => `ex/${encodeURIComponent((CX[id] && CX[id].ph) || id)}-${i}.webp`;
const CX = {}; // calisthenics steps that have no entry of their own in the library (filled from PATHS below)

export const MUSCLES = ['chest', 'shoulders', 'lats', 'middle back', 'traps', 'biceps', 'triceps', 'forearms', 'abdominals', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'lower back', 'adductors', 'abductors', 'neck'];
const MUS_L = { 'chest': 'Chest', 'shoulders': 'Shoulders', 'lats': 'Lats', 'middle back': 'Middle back', 'traps': 'Traps', 'biceps': 'Biceps', 'triceps': 'Triceps', 'forearms': 'Forearms', 'abdominals': 'Abs', 'quadriceps': 'Quads', 'hamstrings': 'Hamstrings', 'glutes': 'Glutes', 'calves': 'Calves', 'lower back': 'Lower back', 'adductors': 'Inner thighs', 'abductors': 'Outer hips', 'neck': 'Neck' };
const EQ_L = { 'barbell': 'Barbell', 'dumbbell': 'Dumbbells', 'cable': 'Cable', 'machine': 'Machine', 'body only': 'Bodyweight', 'kettlebells': 'Kettlebell', 'bands': 'Bands', 'medicine ball': 'Medicine ball', 'exercise ball': 'Exercise ball', 'foam roll': 'Foam roller', 'e-z curl bar': 'EZ bar', 'other': 'Other', '': 'Bodyweight' };
const musL = m => MUS_L[m] || m, eqL = e => EQ_L[e || ''] || e;
const TIMED = new Set(['Plank', 'Side_Bridge', 'Push_Up_to_Side_Plank', 'Superman']);
const isTimed = id => TIMED.has(id) || !!(CX[id] && CX[id].hold);
const BW = e => !e.eq || e.eq === 'body only' || e.eq === 'other' && /Pull|Chin|Dip|Row/.test(e.id);

/* ---------- movement patterns: candidates for a full gym, dumbbells + bench, and no equipment ---------- */
const PAT = {
  squat: [['Barbell_Squat', 'Hack_Squat', 'Smith_Machine_Squat', 'Goblet_Squat'], ['Goblet_Squat', 'Dumbbell_Squat'], ['Bodyweight_Squat', 'Freehand_Jump_Squat']],
  legpress: [['Leg_Press', 'Hack_Squat', 'Smith_Machine_Squat'], ['Dumbbell_Step_Ups', 'Dumbbell_Squat'], ['Step-up_with_Knee_Raise', 'Bodyweight_Squat']],
  hinge: [['Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Smith_Machine_Stiff-Legged_Deadlift'], ['Stiff-Legged_Dumbbell_Deadlift'], ['Single_Leg_Glute_Bridge', 'Hyperextensions_With_No_Hyperextension_Bench']],
  deadlift: [['Barbell_Deadlift', 'Trap_Bar_Deadlift', 'Romanian_Deadlift'], ['Stiff-Legged_Dumbbell_Deadlift'], ['Hyperextensions_With_No_Hyperextension_Bench', 'Single_Leg_Glute_Bridge']],
  lunge: [['Barbell_Walking_Lunge', 'Dumbbell_Lunges', 'Dumbbell_Rear_Lunge'], ['Dumbbell_Lunges', 'Dumbbell_Rear_Lunge', 'Dumbbell_Step_Ups'], ['Bodyweight_Walking_Lunge', 'Crossover_Reverse_Lunge']],
  hipthrust: [['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge'], ['Single_Leg_Glute_Bridge'], ['Single_Leg_Glute_Bridge', 'Butt_Lift_Bridge']],
  legext: [['Leg_Extensions', 'Single-Leg_Leg_Extension'], [], []],
  legcurl: [['Lying_Leg_Curls', 'Seated_Leg_Curl', 'Standing_Leg_Curl'], [], ['Floor_Glute-Ham_Raise']],
  calf: [['Standing_Calf_Raises', 'Seated_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine'], ['Standing_Dumbbell_Calf_Raise', 'Dumbbell_Seated_One-Leg_Calf_Raise'], ['Standing_Dumbbell_Calf_Raise']],
  hpush: [['Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Bench_Press', 'Machine_Bench_Press', 'Smith_Machine_Bench_Press'], ['Dumbbell_Bench_Press'], ['Pushups', 'Push-Up_Wide', 'Incline_Push-Up']],
  incpush: [['Incline_Dumbbell_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Smith_Machine_Incline_Bench_Press'], ['Incline_Dumbbell_Press'], ['Decline_Push-Up', 'Push-Ups_With_Feet_Elevated']],
  dips: [['Dips_-_Chest_Version', 'Dip_Machine', 'Decline_Barbell_Bench_Press'], ['Decline_Dumbbell_Bench_Press'], ['Bench_Dips']],
  fly: [['Butterfly', 'Cable_Crossover', 'Dumbbell_Flyes', 'Low_Cable_Crossover'], ['Dumbbell_Flyes', 'Incline_Dumbbell_Flyes'], ['Push-Up_Wide']],
  vpush: [['Dumbbell_Shoulder_Press', 'Standing_Military_Press', 'Machine_Shoulder_Military_Press', 'Arnold_Dumbbell_Press'], ['Dumbbell_Shoulder_Press', 'Arnold_Dumbbell_Press'], ['Handstand_Push-Ups', 'Decline_Push-Up']],
  lateral: [['Side_Lateral_Raise', 'Cable_Seated_Lateral_Raise', 'Seated_Side_Lateral_Raise'], ['Side_Lateral_Raise', 'Seated_Side_Lateral_Raise'], ['Lateral_Raise_-_With_Bands']],
  frontraise: [['Front_Dumbbell_Raise', 'Front_Cable_Raise', 'Front_Plate_Raise'], ['Front_Dumbbell_Raise'], []],
  reardelt: [['Reverse_Machine_Flyes', 'Face_Pull', 'Cable_Rear_Delt_Fly'], ['Reverse_Flyes'], ['Back_Flyes_-_With_Bands']],
  vpull: [['Wide-Grip_Lat_Pulldown', 'Close-Grip_Front_Lat_Pulldown', 'Pullups', 'V-Bar_Pulldown'], ['One-Arm_Dumbbell_Row'], ['Pullups', 'Chin-Up', 'Inverted_Row']],
  hpull: [['Seated_Cable_Rows', 'Bent_Over_Barbell_Row', 'One-Arm_Dumbbell_Row', 'Leverage_Iso_Row', 'Lying_T-Bar_Row'], ['One-Arm_Dumbbell_Row', 'Bent_Over_Two-Dumbbell_Row'], ['Inverted_Row']],
  pullover: [['Straight-Arm_Pulldown', 'Rope_Straight-Arm_Pulldown', 'Bent-Arm_Dumbbell_Pullover'], ['Bent-Arm_Dumbbell_Pullover'], ['Superman']],
  shrug: [['Barbell_Shrug', 'Dumbbell_Shrug', 'Leverage_Shrug'], ['Dumbbell_Shrug'], []],
  biceps: [['Barbell_Curl', 'EZ-Bar_Curl', 'Preacher_Curl', 'Incline_Dumbbell_Curl'], ['Dumbbell_Bicep_Curl', 'Incline_Dumbbell_Curl'], ['Chin-Up']],
  hammer: [['Hammer_Curls', 'Cable_Hammer_Curls_-_Rope_Attachment', 'Concentration_Curls'], ['Hammer_Curls', 'Concentration_Curls'], []],
  triceps: [['Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown', 'Triceps_Pushdown_-_V-Bar_Attachment'], ['Standing_Dumbbell_Triceps_Extension', 'Seated_Triceps_Press'], ['Bench_Dips', 'Push-Ups_-_Close_Triceps_Position']],
  triover: [['Cable_Rope_Overhead_Triceps_Extension', 'Lying_Triceps_Press', 'Close-Grip_Barbell_Bench_Press'], ['Seated_Triceps_Press'], ['Push-Ups_-_Close_Triceps_Position']],
  abs: [['Cable_Crunch', 'Hanging_Leg_Raise', 'Plank', 'Ab_Roller'], ['Plank', 'Reverse_Crunch'], ['Plank', 'Reverse_Crunch', 'Mountain_Climbers']]
};
const EQI = { gym: 0, db: 1, home: 2 };
const R_TPL = {
  FBA: ['Full body A', [['squat', 'main'], ['hpush', 'main'], ['hpull', 'acc'], ['hinge', 'acc'], ['lateral', 'iso'], ['abs', 'iso']]],
  FBB: ['Full body B', [['deadlift', 'main'], ['vpush', 'main'], ['vpull', 'acc'], ['lunge', 'acc'], ['biceps', 'iso'], ['triceps', 'iso']]],
  FBC: ['Full body C', [['legpress', 'acc'], ['incpush', 'acc'], ['hpull', 'acc', 1], ['legcurl', 'iso'], ['reardelt', 'iso'], ['calf', 'iso']]],
  UA: ['Upper A', [['hpush', 'main'], ['hpull', 'main'], ['vpush', 'acc'], ['vpull', 'acc'], ['lateral', 'iso'], ['biceps', 'iso'], ['triceps', 'iso']]],
  UB: ['Upper B', [['incpush', 'main'], ['vpull', 'main', 1], ['hpull', 'acc', 1], ['fly', 'iso'], ['reardelt', 'iso'], ['hammer', 'iso'], ['triover', 'iso']]],
  LA: ['Lower A', [['squat', 'main'], ['hinge', 'acc'], ['legext', 'iso'], ['legcurl', 'iso'], ['calf', 'iso'], ['abs', 'iso']]],
  LB: ['Lower B', [['deadlift', 'main'], ['lunge', 'acc'], ['hipthrust', 'acc'], ['legcurl', 'iso', 1], ['calf', 'iso', 1], ['abs', 'iso', 1]]],
  PUSH: ['Push', [['hpush', 'main'], ['incpush', 'acc'], ['vpush', 'acc'], ['lateral', 'iso'], ['fly', 'iso'], ['triceps', 'iso'], ['triover', 'iso']]],
  PULL: ['Pull', [['vpull', 'main'], ['hpull', 'acc'], ['hpull', 'acc', 1], ['pullover', 'iso'], ['reardelt', 'iso'], ['biceps', 'iso'], ['hammer', 'iso']]],
  LEGS: ['Legs', [['squat', 'main'], ['hinge', 'acc'], ['legpress', 'acc'], ['legcurl', 'iso'], ['legext', 'iso'], ['calf', 'iso'], ['abs', 'iso']]],
  PUSH2: ['Push B', [['incpush', 'main', 1], ['hpush', 'acc', 1], ['vpush', 'acc', 1], ['lateral', 'iso', 1], ['dips', 'acc'], ['triover', 'iso', 1]]],
  PULL2: ['Pull B', [['hpull', 'main', 1], ['vpull', 'acc', 1], ['shrug', 'iso'], ['reardelt', 'iso', 1], ['biceps', 'iso', 1], ['hammer', 'iso', 1]]],
  LEGS2: ['Legs B', [['deadlift', 'main'], ['legpress', 'acc', 1], ['lunge', 'acc'], ['hipthrust', 'acc'], ['legcurl', 'iso', 1], ['calf', 'iso', 1]]],
  CHEST: ['Chest day', [['hpush', 'main'], ['incpush', 'acc'], ['dips', 'acc'], ['fly', 'iso'], ['fly', 'iso', 1], ['triceps', 'iso']]],
  BACK: ['Back day', [['vpull', 'main'], ['hpull', 'acc'], ['hpull', 'acc', 1], ['pullover', 'iso'], ['shrug', 'iso'], ['biceps', 'iso']]],
  SHO: ['Shoulder day', [['vpush', 'main'], ['lateral', 'iso'], ['lateral', 'iso', 1], ['frontraise', 'iso'], ['reardelt', 'iso'], ['abs', 'iso']]],
  ARMS: ['Arm day', [['biceps', 'acc'], ['triceps', 'acc'], ['hammer', 'iso'], ['triover', 'iso'], ['biceps', 'iso', 1], ['triceps', 'iso', 1], ['abs', 'iso']]]
};
export const SPLITS = {
  fb2: { name: 'Full body, 2 days', days: 2, r: ['FBA', 'FBB'], why: 'Every muscle twice a week in two sessions. Best when time is short.' },
  fb3: { name: 'Full body, 3 days', days: 3, r: ['FBA', 'FBB', 'FBC'], why: 'The classic start: big lifts three times a week, easy to recover from.' },
  ppl3: { name: 'Push / Pull / Legs', days: 3, r: ['PUSH', 'PULL', 'LEGS'], why: 'Each session focuses on one movement type. Each muscle once a week.' },
  ul4: { name: 'Upper / Lower', days: 4, r: ['UA', 'LA', 'UB', 'LB'], why: 'Every muscle twice a week with room for more sets. Great second-year plan.' },
  pplul: { name: 'Push / Pull / Legs / Upper / Lower', days: 5, r: ['PUSH', 'PULL', 'LEGS', 'UA', 'LB'], why: 'Five days, most muscles twice a week.' },
  bro5: { name: 'Body-part split', days: 5, r: ['CHEST', 'BACK', 'SHO', 'LEGS', 'ARMS'], why: 'One body part per day, lots of volume each time. The common gym split.' },
  ppl6: { name: 'Push / Pull / Legs × 2', days: 6, r: ['PUSH', 'PULL', 'LEGS', 'PUSH2', 'PULL2', 'LEGS2'], why: 'Six days, every muscle twice a week. For people who love the gym.' }
};
export function recSplit(days, level) { return days <= 2 ? 'fb2' : days === 3 ? (level === 'new' ? 'fb3' : 'ppl3') : days === 4 ? 'ul4' : days === 5 ? 'pplul' : 'ppl6'; }
const DOSE = {
  muscle: { main: [3, 6, 10, 150], acc: [3, 8, 12, 120], iso: [3, 10, 15, 75] },
  strength: { main: [4, 4, 6, 180], acc: [3, 6, 10, 120], iso: [2, 10, 12, 75] },
  fat: { main: [3, 8, 12, 120], acc: [3, 10, 12, 90], iso: [3, 12, 15, 60] },
  fit: { main: [3, 8, 12, 120], acc: [3, 10, 15, 90], iso: [2, 12, 15, 60] }
};
export const GOALS = [['fat', 'Lose fat'], ['muscle', 'Build muscle'], ['strength', 'Get stronger'], ['fit', 'Get fit and healthy']];
export const LEVELS = [['new', 'New to the gym', 'Under 6 months'], ['some', 'Some experience', '6 months to 2 years'], ['exp', 'Experienced', 'Over 2 years']];
export const EQUIP = [['gym', 'Full gym', 'Machines, cables, barbells, dumbbells'], ['db', 'Dumbbells and a bench', 'Home or a small gym'], ['home', 'No equipment', 'Bodyweight only, anywhere']];
function buildRoutine(key, cfg) {
  const [name, slots] = R_TPL[key], used = new Set(), e = EQI[cfg.equip] ?? 0, dose = DOSE[cfg.goal] || DOSE.muscle, out = [];
  for (const [pat, kind, vi = 0] of slots) {
    const tiers = PAT[pat]; let cand = tiers[e].length ? tiers[e] : e === 2 ? [] : tiers[Math.min(2, e + 1)];
    const pool = cand.slice(vi % Math.max(1, cand.length)).concat(cand.slice(0, vi % Math.max(1, cand.length)));
    const id = pool.find(x => !used.has(x)); if (!id) continue; used.add(id);
    let [sets, lo, hi, rest] = dose[kind];
    if (cfg.level === 'new') sets = Math.min(sets, kind === 'iso' ? 2 : 3); else if (cfg.level === 'exp' && kind !== 'iso') sets += 1;
    if (isTimed(id)) { lo = 20; hi = 45; }
    out.push({ id, sets, lo, hi, rest });
  }
  return { id: key + '-' + Math.random().toString(36).slice(2, 6), name, ex: out };
}
export function makePlan(cfg) { const sp = SPLITS[cfg.split] || SPLITS.fb3; return sp.r.map(k => buildRoutine(k, cfg)); }
const WEEKDAYS = { 2: [0, 3], 3: [6, 1, 3], 4: [6, 0, 2, 3], 5: [6, 0, 1, 2, 3], 6: [6, 0, 1, 2, 3, 4] };

/* ---------- cardio after lifting ---------- */
export const CARDIO = [
  ['Walking_Treadmill', 'Incline walk', 'Treadmill at 8–12% incline, 5–6 km/h. Easy on the joints, burns well.'],
  ['Bicycling_Stationary', 'Bike', 'Steady pace you could talk at.'],
  ['Elliptical_Trainer', 'Elliptical', 'Steady pace you could talk at.'],
  ['Stairmaster', 'Stair climber', 'Slow and steady, hands off the rails.'],
  ['Rowing_Stationary', 'Rowing', 'Legs, then body, then arms.'],
  ['Jogging_Treadmill', 'Jog', 'Easy jog.'],
  ['Rope_Jumping', 'Jump rope', 'Rounds of 1 minute on, 30 seconds off.']
];
const CARDIO_KIND = { z2: 'Easy, steady (Zone 2)', int: 'Intervals: 30 s hard, 60 s easy' };
export function cardioDefault(goal) { return goal === 'fat' ? { on: true, min: 20, mode: 'Walking_Treadmill', kind: 'z2' } : goal === 'fit' ? { on: true, min: 15, mode: 'Bicycling_Stationary', kind: 'z2' } : { on: true, min: 10, mode: 'Bicycling_Stationary', kind: 'z2' }; }


/* ---------- the owner's own Lyfta program (ULTIMATE PPL/UL), offered only to the owner ---------- */
const LYFTA_PLAN = [
  ['Push 1', null, [['Dumbbell_Bench_Press', 3, 15, 15], ['Dumbbell_Shoulder_Press', 3, 12, 12, 'Seated Shoulder Press'], ['Dumbbell_Flyes', 3, 15, 15], ['Cable_Seated_Lateral_Raise', 3, 15, 15, 'Lever Lateral Raise'], ['Triceps_Pushdown', 3, 15, 15], ['Triceps_Pushdown_-_Rope_Attachment', 2, 12, 12, 'Single-Arm Rope Pushdown']]],
  ['Pull 1', null, [['Wide-Grip_Lat_Pulldown', 4, 15, 20], ['Leverage_Iso_Row', 3, 15, 15, 'Lever Narrow Grip Seated Row'], ['Straight-Arm_Pulldown', 3, 12, 15], ['Face_Pull', 3, 12, 15], ['Dumbbell_Bicep_Curl', 2, 12, 15, 'Biceps Curl'], ['One_Arm_Dumbbell_Preacher_Curl', 2, 15, 15, 'Dumbbell Preacher Curl'], ['Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench', 2, 25, 25, 'One-Arm Reverse Wrist Curl'], ['Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench', 2, 25, 25, 'One-Arm Wrist Curl']]],
  ['Leg 1', null, [['Smith_Machine_Squat', 4, 12, 15, 'Smith Full Squat'], ['Barbell_Full_Squat', 2, 5, 5, 'Barbell Pause Full Squat'], ['Romanian_Deadlift', 3, 10, 12], ['Bodyweight_Walking_Lunge', 2, 14, 14, 'Walking Lunge'], ['Seated_Leg_Curl', 2, 12, 12], ['Calf_Press_On_The_Leg_Press_Machine', 3, 25, 30], ['Ab_Crunch_Machine', 3, 20, 20, 'Lever Total Abdominal Crunch']]],
  ['Upper 1', null, [['Band_Assisted_Pull-Up', 3, 10, 12, 'Assisted Pull-up'], ['Incline_Dumbbell_Press', 3, 12, 15], ['Leverage_Iso_Row', 3, 12, 15, 'Lever Narrow Grip Seated Row'], ['Cable_Seated_Lateral_Raise', 3, 12, 12, 'Cable One-Arm Lateral Raise'], ['Dumbbell_Bicep_Curl', 3, 12, 12, 'Biceps Curl'], ['Triceps_Pushdown', 3, 12, 15]]],
  ['Lower', 'Stairmaster', [['Thigh_Adductor', 3, 25, 25, 'Lever Seated Hip Adduction'], ['Thigh_Abductor', 3, 20, 25, 'Lever Seated Hip Abduction'], ['Romanian_Deadlift', 3, 12, 12], ['Leg_Extensions', 3, 15, 15], ['Standing_Calf_Raises', 2, 20, 20], ['Ab_Crunch_Machine', 3, 20, 20, 'Lever Total Abdominal Crunch']]]
];
function lyftaRoutines() { return LYFTA_PLAN.map(([name, cd, list], i) => ({ id: 'LY' + i + '-' + Math.random().toString(36).slice(2, 5), name, lyfta: true, ...(cd ? { cd } : {}), ex: list.map(([id, sets, lo, hi, nm]) => ({ id, sets, lo, hi, ...(nm ? { nm } : {}) })) })); }

/* ---------- history ---------- */
const isW = s => s && s.t === 'w';
function sessions(before) { const S = X.S; return Object.keys(S.days).filter(k => S.days[k].wo && S.days[k].wo.ex && (S.days[k].wo.t1 || S.days[k].wo.imported) && (!before || k < before)).sort(); }
function hist(id, before) {
  const S = X.S, out = [];
  for (const k of sessions(before)) { const w = S.days[k].wo; (w.ex || []).filter(x => x.id === id).forEach(e => { const sets = (e.sets || []).filter(s => s.done && (s.r || s.kg)); if (sets.length) out.push({ date: k, sets, w }); }); }
  return out;
}
const e1rm = s => (s.kg || 0) * (1 + Math.min(s.r || 0, 30) / 30);
function bestSet(sets) { let b = null; sets.filter(s => !isW(s)).forEach(s => { if (!b || e1rm(s) > e1rm(b) + 1e-9 || (!s.kg && !b.kg && (s.r || 0) > (b.r || 0))) b = s; }); return b; }
function best(id, before) { return bestSet(hist(id, before).flatMap(h => h.sets)); }
const beats = (s, b) => !isW(s) && b && ((s.kg && e1rm(s) > e1rm(b) + 0.01) || (!s.kg && !b.kg && (s.r || 0) > (b.r || 0)));
const setTxt = s => s.kg ? `${C.round(s.kg, 2)}×${s.r || 0}` : `${s.r || 0}`;
const exName = e => (e && e.nm) || ex(e.id || e).name;
function suggest(e, x) {
  const h = hist(e.id, D()), last = h[h.length - 1]; if (!last) return '';
  const work = last.sets.filter(s => !isW(s)); if (!work.length) return '';
  const top = work.filter(s => s.kg).map(s => s.kg), w = top.length ? Math.max(...top) : 0, n = e.sets.filter(s => !isW(s)).length || work.length;
  const allTop = work.length >= n && work.slice(0, n).every(s => (s.r || 0) >= e.hi), easy = work.every(s => s.rpe && s.rpe <= 7);
  const inc = x.eq === 'dumbbell' || x.eq === 'kettlebells' ? 2 : /barbell|machine|cable|e-z/.test(x.eq) ? 2.5 : 0;
  if ((allTop || easy) && w && inc) return `Last time ${C.round(w, 2)} kg ${easy && !allTop ? 'felt easy' : 'hit the top of the range'}. Try ${C.round(w + inc, 2)} kg.`;
  if (allTop) return 'Last time you hit the top of the range. Add reps, slow the lowering, or add weight.';
  return `Last time: ${work.map(setTxt).join(', ')}. Beat it by one rep somewhere.`;
}
// records set in one workout (normal sets only, max 3 counted)
export function prCount(date) {
  const d = X.S.days[date], w = d && d.wo; if (!w || !w.ex || w.imported) return 0;
  let n = 0; w.ex.forEach(e => { const b0 = best(e.id, date), top = bestSet((e.sets || []).filter(s => s.done)); if (top && beats(top, b0)) n++; });
  return Math.min(3, n);
}

/* ---------- state helpers ---------- */
const T = () => X.S.settings.train;
const D = () => X.editDate();
const wo = () => { const d = X.S.days[D()]; return d && d.wo; };
const active = () => { const w = wo(); return w && !w.t1 && !w.imported ? w : null; };
export const hasActive = () => !!(X && X.S.settings && T() && active());
function nextRoutine() { const t = T(); if (!t || !t.routines || !t.routines.length) return null; return t.routines[(t.next || 0) % t.routines.length]; }
const thumb = (id, cls = '') => DB && !ex(id).img ? `<span class="exthumb none ${cls}" aria-hidden="true">${CX[id] ? '◇' : ''}</span>` : `<img class="exthumb ${cls}" src="${img(id, 0)}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">`;
const photos = id => { const x = ex(id); return x.img > 1 ? `<div class="exph" data-act="tr-flip"><img src="${img(id, 0)}" alt="${esc(x.name)}, start" decoding="async"><img class="b" src="${img(id, 1)}" alt="${esc(x.name)}, end" decoding="async"><span class="exph-l"><i></i><i></i></span></div>` : x.img ? `<div class="exph one"><img src="${img(id, 0)}" alt="${esc(x.name)}"></div>` : ''; };
const meta = x => [...x.pm.map(musL), eqL(x.eq)].filter(Boolean).join(' · ');
const restFor = id => { const t = T() || {}; const v = (t.restBy || {})[id]; return v != null ? v : (t.restDefault != null ? t.restDefault : 30); };
const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
const isOwner = () => X.isOwner && X.isOwner();

/* ---------- views ---------- */
export function trainHTML() {
  loadDB();
  const def = !X.S.trainTab && CA() && C.trainType(X.S.settings, D()) === 'cali' && !(active() && !isCaliW(active())) ? 'cali' : 'wo';
  const tab = X.S.trainTab === 'stamina' || X.S.trainTab === 'cardio' ? 'cardio' : X.S.trainTab === 'lib' ? 'lib' : X.S.trainTab === 'cali' ? 'cali' : X.S.trainTab ? 'wo' : def;
  let h = `<div class="seg wide trtabs" role="tablist" aria-label="Train sections">${[['wo', 'Workout'], ['cali', 'Calisthenics'], ['cardio', 'Cardio'], ['lib', 'Exercises']].map(([k, l]) => `<button data-act="traintab" data-v="${k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div>`;
  if (tab === 'cardio') return h + X.staminaHTML();
  if (tab === 'lib') return h + libHTML();
  if (tab === 'cali') return h + (active() ? liveHTML(active()) : caliTabHTML());
  if (!T() || !T().routines) return h + setupHTML();
  const a = active(); if (a) return h + liveHTML(a);
  return h + homeHTML();
}
function lyftaCard() { return isOwner() && !(T() && T().routines && T().routines.some(r => r.lyfta)) ? `<section class="card lyfta"><span class="sub">From your Lyfta</span><h3>ULTIMATE PPL/UL</h3><p class="hint">Push 1, Pull 1, Leg 1, Upper 1 and Lower, with your sets and reps, plus incline walk or stairs after each one.</p><button class="btn primary block" data-act="tr-lyfta">Use my program</button></section>` : ''; }
function setupHTML() {
  const w = X.S.trWiz = X.S.trWiz || { step: 0, equip: 'gym', goal: 'muscle', level: 'some', days: 4 };
  const opt = (k, v, label, sub) => `<button class="opt" data-act="tr-wiz" data-v="${k}:${v}" aria-pressed="${String(w[k]) === String(v)}"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</button>`;
  const steps = [
    ['Where do you train?', EQUIP.map(([v, l, s]) => opt('equip', v, l, s)).join('')],
    ['What’s your main goal?', GOALS.map(([v, l]) => opt('goal', v, l)).join('')],
    ['How much experience?', LEVELS.map(([v, l, s]) => opt('level', v, l, s)).join('')],
    ['How many days a week?', `<div class="daysel">${[2, 3, 4, 5, 6].map(n => `<button data-act="tr-wiz" data-v="days:${n}" aria-pressed="${w.days === n}">${n}</button>`).join('')}</div><p class="hint">Pick what you can keep up every week, not your best week.</p>`],
    ['Your split', Object.entries(SPLITS).filter(([, s]) => Math.abs(s.days - w.days) <= 1).sort(([a], [b]) => (b === recSplit(w.days, w.level)) - (a === recSplit(w.days, w.level))).map(([k, s]) => opt('split', k, s.name + (k === recSplit(w.days, w.level) ? ' · recommended' : ''), `${s.days} days. ${s.why}`)).join('')]
  ];
  if (w.step === 4 && !w.split) w.split = recSplit(w.days, w.level);
  const [q, body] = steps[w.step];
  return (w.step === 0 ? lyftaCard() : '') + `<section class="card trsetup"><span class="sub">Step ${w.step + 1} of ${steps.length}</span><h3>${esc(q)}</h3><div class="opts">${body}</div>
  <div class="row">${w.step ? `<button class="btn ghost" data-act="tr-wizback">Back</button>` : ''}${w.step < steps.length - 1 ? `<button class="btn primary grow" data-act="tr-wiznext">Next</button>` : `<button class="btn primary grow" data-act="tr-wizdone">Create my plan</button>`}</div></section>
  <p class="hint center">Exercises and photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (public domain).</p>`;
}
function routineList(r) { return `<div class="exlist">${r.ex.map((e, i) => { const link = e.ss && r.ex[i + 1] && r.ex[i + 1].ss === e.ss; return `<div class="exrow${e.ss ? ' ssr' : ''}">${thumb(e.id)}<span><b>${esc(exName(e))}</b><small>${e.sets} × ${e.lo === e.hi ? e.lo : e.lo + '–' + e.hi}${isTimed(e.id) ? ' s' : ''}${link ? ' · superset' : ''}</small></span></div>`; }).join('')}</div>`; }
function homeHTML() {
  const t = T(), date = D(), tt = C.trainType(X.S.settings, date), d = X.S.days[date] || {}, r = nextRoutine(), done = d.wo && d.wo.t1 && !d.wo.imported;
  let h = lyftaCard();
  if (done) h += `<section class="card trtoday done"><span class="sub">${date === X.today() ? 'Today' : 'Yesterday'}</span><h3>${esc(d.wo.name)} done</h3><p class="hint">${woSummary(d.wo)}</p><div class="row"><button class="btn" data-act="tr-summary">See summary</button>${t.cardio && t.cardio.on && !cardioDone(d) ? `<button class="btn primary" data-act="tr-cardio">Cardio: ${t.cardio.min} min</button>` : ''}</div></section>`;
  else if (r) {
    const rest = tt === 'rest' || tt === 'recovery';
    h += `<section class="card trtoday"><span class="sub">${rest ? (tt === 'rest' ? 'Rest day · next workout' : 'Mobility day · next workout') : 'Today’s workout'}</span><div class="spread"><h3>${esc(r.name)}</h3><button class="btn small ghost" data-act="tr-pick">Change</button></div>
    ${routineList(r)}<button class="btn ${rest ? '' : 'primary'} block" data-act="tr-start" data-v="${r.id}">${rest ? 'Start anyway' : 'Start workout'}</button></section>`;
  }
  h += `<section class="card list2">${rankRow()}
  <button class="lrow" data-act="tr-import"><span class="lic">⇩</span><span class="lt"><b>Import history</b><small>From Lyfta, Hevy or Strong</small></span><span class="le">›</span></button></section>`;
  h += `<section class="card"><div class="card-h"><h2>Your plan</h2><button class="btn small ghost" data-act="tr-redo">Change plan</button></div><p class="hint">${esc(t.split === 'lyfta' ? 'ULTIMATE PPL/UL (from Lyfta)' : (SPLITS[t.split] || {}).name || 'Custom')} · ${esc((EQUIP.find(e => e[0] === t.equip) || [, ''])[1])}. Workouts go in order. Missed one? The next one waits for you.</p>
  <div class="card list2 flat">${t.routines.map((rr, i) => `<button class="lrow" data-act="tr-edit" data-v="${rr.id}"><span class="lic${rr.id === (r && r.id) ? ' on' : ''}">${i + 1}</span><span class="lt"><b>${esc(rr.name)}</b><small>${rr.ex.length} exercises · ${esc(focusOf(rr))}</small></span><span class="le">›</span></button>`).join('')}
  <button class="lrow" data-act="tr-new"><span class="lic">+</span><span class="lt"><b>New workout</b><small>Build your own from 873 exercises</small></span></button></div>
  <div class="setup-r"><span>Default rest</span><button class="btn small" data-act="tr-restpick" data-v="*">⏱ ${mmss(restFor('*'))}</button></div>
  ${'Notification' in window && Notification.maxActions > 0 ? `<div class="setup-r"><span>Lock-screen controls<small class="sub" style="display:block">Tick sets and run the rest from the notification</small></span><div class="seg"><button data-act="tr-notif" data-v="1" aria-pressed="${t.notif !== false}">On</button><button data-act="tr-notif" data-v="0" aria-pressed="${t.notif === false}">Off</button></div></div>` : ''}</section>`;
  const cd = t.cardio || { on: false };
  h += `<section class="card"><div class="card-h"><h2>Cardio after lifting</h2><div class="seg"><button data-act="tr-cdon" data-v="1" aria-pressed="${!!cd.on}">On</button><button data-act="tr-cdon" data-v="0" aria-pressed="${!cd.on}">Off</button></div></div>
  ${cd.on ? `<p class="hint">Offered when you finish a workout. Doing it after weights keeps your lifting strong, and the minutes count toward the WHO 150 a week.</p><div class="form"><label>Machine<select class="in" data-trc="mode">${CARDIO.map(([k, l]) => `<option value="${k}" ${cd.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label>Minutes<select class="in" data-trc="min">${[10, 15, 20, 25, 30, 40].map(m => `<option ${cd.min === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label><label class="full">Type<select class="in" data-trc="kind">${Object.entries(CARDIO_KIND).map(([k, l]) => `<option value="${k}" ${cd.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>` : `<p class="hint">Turn on to get a short cardio block after each workout.</p>`}</section>`;
  const ss = sessions().slice(-8).reverse();
  if (ss.length) h += `<section class="card"><div class="card-h"><h2>Recent workouts</h2></div><div class="card list2 flat">${ss.map(k => { const w = X.S.days[k].wo; return `<div class="lrow"><span class="lic ok">✓</span><button class="lt bare" data-act="tr-summary" data-v="${k}"><b>${esc(w.name)}</b><small>${X.fmt(k)} · ${woSummary(w)}${w.imported ? ' · imported' : ''}</small></button><button class="more" data-act="tr-wmenu" data-v="${k}" aria-label="Options for ${esc(w.name)}, ${X.fmt(k)}">⋯</button></div>`; }).join('')}</div></section>`;
  return h;
}
function focusOf(r) { const c = {}; r.ex.forEach(e => { const m = ex(e.id).pm[0]; if (m) c[m] = (c[m] || 0) + (+e.sets || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => musL(m)).join(', ') || '—'; }
function woStats(w) { let sets = 0, vol = 0; (w.ex || []).forEach(e => (e.sets || []).forEach(s => { if (s.done && !isW(s)) { sets++; vol += (s.kg || 0) * (s.r || 0); } })); const min = w.t1 && w.t0 ? Math.max(1, Math.round((w.t1 - w.t0) / 60000)) : 0; return { sets, vol: Math.round(vol), min }; }
function woSummary(w) { const s = woStats(w); return [s.min && `${s.min} min`, `${s.sets} sets`, s.vol && `${C.round(s.vol / 1000, 1)} t lifted`].filter(Boolean).join(' · '); }
const cardioDone = d => (d.stamina || []).some(s => s.src === 'finisher');

/* ---------- live workout ---------- */
function group(w, i) { const e = w.ex[i]; if (!e || !e.ss) return [i]; let a = i, b = i; while (a > 0 && w.ex[a - 1].ss === e.ss) a--; while (b < w.ex.length - 1 && w.ex[b + 1].ss === e.ss) b++; return Array.from({ length: b - a + 1 }, (_, k) => a + k); }
const curSet = e => e.sets.findIndex(s => !s.done);
function liveHTML(w) {
  const i = Math.min(w.cur || 0, Math.max(0, w.ex.length - 1)), G = group(w, i);
  let h = `<section class="card live"><div class="spread"><div><span class="sub">${esc(w.name)} · ${w.ex.filter(e => e.sets.length && e.sets.every(s => s.done)).length} of ${w.ex.length} done</span><b class="num clock" id="wo-clock">${clock(w)}</b></div><button class="btn small primary" data-act="tr-finish">Finish</button></div>
  <div class="exstrip" role="tablist" aria-label="Exercises">${w.ex.map((x, j) => { const dn = x.sets.length && x.sets.every(s => s.done); return `<button role="tab" data-act="tr-go" data-v="${j}" aria-selected="${G.includes(j)}" class="${dn ? 'dn' : ''}${x.ss ? ' ss' : ''}" aria-label="${esc(exName(x))}">${thumb(x.id)}<i>${dn ? '✓' : j + 1}</i></button>`; }).join('')}<button class="addx" data-act="tr-add" aria-label="Add exercise">+</button></div></section>`;
  if (!w.ex.length) return h + `<p class="hint center">No exercises yet. Tap + to add one.</p>` + restBarHTML();
  if (G.length > 1) h += `<p class="sslab">Superset · rest ${mmss(restFor(w.ex[G[G.length - 1]].id))} after both</p><div class="ssg">`;
  G.forEach((k, gi) => h += exCardHTML(w, k, G.length > 1 ? `${String.fromCharCode(65 + (w.ex[k].ss ? 0 : 0))}${gi + 1} · ` : '', G.length > 1 && gi > 0));
  if (G.length > 1) h += `</div>`;
  const after = G[G.length - 1] + 1;
  h += `<div class="row nav2">${G[0] > 0 ? `<button class="btn" data-act="tr-go" data-v="${G[0] - 1}">‹ Back</button>` : ''}${after < w.ex.length ? `<button class="btn primary grow" data-act="tr-go" data-v="${after}">Next: ${esc(exName(w.ex[after]))} ›</button>` : `<button class="btn primary grow" data-act="tr-finish">Finish workout</button>`}</div>`;
  return h + restBarHTML();
}
function exCardHTML(w, i, pre, compact) {
  const e = w.ex[i], x = ex(e.id), last = hist(e.id, D()).pop(), timed = isTimed(e.id), bw = BW(x), b = best(e.id, D()), tip = suggest(e, x), cs = curSet(e), note = (((T() || {}).notes || {})[e.id] || '').trim();
  const running = RS && RS.ex === i && !RS.hold;
  const lastWork = last ? last.sets.filter(s => !isW(s)) : [];
  let n = 0;
  return `<section class="card excard${compact ? ' compact' : ''}">${compact ? '' : photos(e.id)}<div class="exhd"><div class="exhd-t">${compact ? thumb(e.id) : ''}<div><h3>${esc(pre + exName(e))}</h3><span class="sub">${esc(meta(x))} · ${e.sets.filter(s => !isW(s)).length} × ${e.lo === e.hi ? e.lo : e.lo + '–' + e.hi}${timed ? ' s' : ''}</span></div></div>
  <button class="rchip${running ? ' run' : ''}" data-act="tr-restpick" data-v="${e.id}" aria-label="Rest time ${mmss(restFor(e.id))}, tap to change">${running ? `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" class="rt"/><circle cx="18" cy="18" r="14" class="rf" id="rchip-ring" stroke-dasharray="88 88"/></svg><span class="num" id="rchip-t">${mmss(restLeft())}</span>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg><span class="num">${restFor(e.id) ? mmss(restFor(e.id)) : 'Off'}</span>`}</button></div>
  ${note ? `<button class="note" data-act="tr-note" data-v="${e.id}">📌 ${esc(note)}</button>` : ''}
  ${tip && !compact ? `<p class="tip">${esc(tip)}</p>` : ''}
  <div class="setgrid" role="table"><div class="sg-h" role="row"><span>#</span><span>Last</span><span>${bw ? '+kg' : 'kg'}</span><span>${timed ? 'sec' : 'reps'}</span><span>RPE</span><span></span></div>
  ${e.sets.map((s, j) => { const p = isW(s) ? null : lastWork[n]; if (!isW(s)) n++; const lbl = s.t === 'w' ? 'W' : s.t === 'd' ? 'D' : s.t === 'f' ? 'F' : String(n); return `<div class="sg-r${s.done ? ' done' : ''}${j === cs ? ' cur' : ''}" role="row"><button class="sn ${s.t || ''}" data-act="tr-smenu" data-v="${i}:${j}" aria-label="Set ${j + 1} options">${lbl}</button><span class="num prev">${p ? setTxt(p) : '–'}</span><input class="in num" type="number" inputmode="decimal" step="0.5" min="0" data-wo="${i}:${j}:kg" placeholder="${s.kg == null ? (p && p.kg ? C.round(p.kg, 2) : bw ? '0' : '') : ''}" value="${s.kg ?? ''}" aria-label="Set ${j + 1} weight"><input class="in num" type="number" inputmode="numeric" min="0" data-wo="${i}:${j}:r" placeholder="${p ? p.r : e.lo}" value="${s.r ?? ''}" aria-label="Set ${j + 1} ${timed ? 'seconds' : 'reps'}"><button class="rpe" data-act="tr-smenu" data-v="${i}:${j}" aria-label="Set ${j + 1} effort">${s.rpe || '–'}</button><button class="sgtick" data-act="tr-set" data-v="${i}:${j}" aria-pressed="${!!s.done}" aria-label="Set ${j + 1} done">✓</button></div>`; }).join('')}</div>
  ${levelUpHTML(e)}
  <div class="row exbtns"><button class="btn small" data-act="tr-addset" data-v="${i}">+ Set</button>${timed ? `<button class="btn small primary" data-act="tr-hold" data-v="${i}">Hold timer</button>` : /barbell|dumbbell|machine|cable|e-z|kettle/.test(x.eq) ? `<button class="btn small" data-act="tr-warm" data-v="${i}">Warm-up</button>` : ''}<button class="btn small ghost" data-act="tr-swap" data-v="${i}">Swap</button><button class="btn small ghost" data-act="tr-exinfo" data-v="${e.id}">Info</button>${note ? '' : `<button class="btn small ghost" data-act="tr-note" data-v="${e.id}">Note</button>`}<button class="btn small ghost" data-act="tr-rmex" data-v="${i}">Remove</button></div>
  ${b && !compact ? `<p class="hint">Best: ${setTxt(b)}${b.kg ? ` (≈ ${Math.round(e1rm(b))} kg 1-rep max)` : ''}</p>` : ''}</section>`;
}
function clock(w) { const s = Math.max(0, Math.floor((Date.now() - w.t0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

/* ---------- rest timer (inline chip + bar above the tabs) ---------- */
let RS = null, overT = null; // {end, total, ex, set, hold, start}
try { const j = JSON.parse(localStorage.getItem('lk-rest') || 'null'); if (j && j.end > Date.now()) RS = j; } catch (e) { }
const saveRS = () => { try { RS ? localStorage.setItem('lk-rest', JSON.stringify(RS)) : localStorage.removeItem('lk-rest'); } catch (e) { } };
const restLeft = () => RS ? Math.max(0, Math.ceil((RS.end - Date.now()) / 1000)) : 0;
function nextUp() {
  const w = active(); if (!w) return null;
  const order = [...Array(w.ex.length).keys()], start = w.cur || 0, idx = order.slice(start).concat(order.slice(0, start));
  for (const i of idx) { const e = w.ex[i], j = curSet(e); if (j >= 0) { const s = e.sets[j], last = hist(e.id, D()).pop(), p = last && last.sets.filter(x => !isW(x))[e.sets.slice(0, j).filter(x => !isW(x)).length]; const pv = e.sets.slice(0, j).reverse().find(x => x.done && !isW(x)), kg = s.kg ?? (p && p.kg) ?? (pv && pv.kg), r = s.r ?? (p ? p.r : pv && pv.r ? pv.r : e.lo); return { i, j, e, txt: `${exName(e)} · set ${j + 1}${kg ? ` · ${C.round(kg, 2)} kg × ${r}` : ` · ${r}`}` }; } }
  return null;
}
function restBarHTML() {
  if (!RS && !overT) return '';
  if (!RS) { const nx = nextUp(); return `<div class="restbar go" id="restbar" role="status"><div class="r"><div><small>Rest over</small><div class="big">Go${nx ? `: set ${nx.j + 1}` : ''}</div></div><button class="b2 sk" data-act="tr-rest" data-v="close">OK</button></div></div>`; }
  if (RS.hold) return `<div class="restbar hold" id="restbar" role="timer"><div class="r"><div><small>Hold · target ${RS.total} s</small><div class="big num" id="rest-big">${Math.floor((Date.now() - RS.start) / 1000)} s</div></div><div class="rb"><button class="b2" data-act="tr-rest" data-v="cancel">Cancel</button><button class="b2 sk" data-act="tr-rest" data-v="holdstop">Stop and log</button></div></div></div>`;
  const nx = nextUp(), left = restLeft();
  return `<div class="restbar" id="restbar" role="timer" aria-label="Rest"><div class="r"><div class="rbt"><small>Rest${nx ? ' · next: ' + esc(nx.txt) : ''}</small><div class="big num" id="rest-big">${mmss(left)}</div></div><div class="rb"><button class="b2" data-act="tr-rest" data-v="-15" aria-label="15 seconds less">−15</button><button class="b2" data-act="tr-rest" data-v="15" aria-label="15 seconds more">+15</button><button class="b2 sk" data-act="tr-rest" data-v="skip">Skip</button></div></div><div class="bar"><i id="rest-fill" style="width:${RS.total ? Math.round(left / RS.total * 100) : 0}%"></i></div></div>`;
}
function startRest(i, sec) { if (!sec) { RS = null; saveRS(); notifyWorking(); return; } clearTimeout(overT); overT = null; RS = { end: Date.now() + sec * 1000, total: sec, ex: i }; saveRS(); notifyRest(); }
function restDone(silent) {
  RS = null; saveRS();
  if (!silent) { X.beep(2); try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) { } notifyOver(); clearTimeout(overT); overT = setTimeout(() => { overT = null; X.draw(); }, 6000); }
  else notifyWorking();
  X.draw();
}
setInterval(() => {
  if (!X || !X.S.settings) return;
  const el = $('wo-clock'), w = T() && active(); if (el && w) el.textContent = clock(w);
  if (!RS) return;
  if (RS.hold) { const s = Math.floor((Date.now() - RS.start) / 1000), b = $('rest-big'); if (b) b.textContent = s + ' s'; if (s === RS.total && !RS.hit) { RS.hit = true; X.beep(2); } return; }
  const left = restLeft(), big = $('rest-big'), f = $('rest-fill'), ct = $('rchip-t'), ring = $('rchip-ring');
  if (big) big.textContent = mmss(left); if (f) f.style.width = (RS.total ? left / RS.total * 100 : 0) + '%'; if (ct) ct.textContent = mmss(left); if (ring) ring.setAttribute('stroke-dasharray', `${(RS.total ? left / RS.total : 0) * 88} 88`);
  if (left <= 0) restDone(false);
}, 250);

/* ---------- lock-screen notification (Android; iPhone web apps can't show buttons) ---------- */
const canNotif = () => 'Notification' in window && Notification.permission === 'granted' && Notification.maxActions > 0 && T() && T().notif !== false && 'serviceWorker' in navigator;
async function showWo(title, body, actions, loud) {
  if (!canNotif()) return;
  try { const reg = await navigator.serviceWorker.ready; await reg.showNotification(title, { body, tag: 'wo', renotify: !!loud, silent: !loud, requireInteraction: true, icon: 'icons/icon-192.png', badge: 'icons/favicon.png', actions, data: { wo: true, url: './#train' }, ...(loud ? { vibrate: [250, 120, 250] } : {}) }); } catch (e) { }
}
function woHead() { const w = active(); return w ? `Lock In 90 · ${w.name} · ${Math.max(1, Math.round((Date.now() - w.t0) / 60000))} min` : 'Lock In 90'; }
function notifyWorking() { const nx = nextUp(); if (!nx) return; showWo(nx.txt.split(' · ').slice(0, 2).join(' · '), `${woHead()}${nx.txt.split(' · ')[2] ? ' · ' + nx.txt.split(' · ')[2] : ''}`, [{ action: 'done', title: '✓ Set done' }, { action: 'open', title: 'Open' }]); }
function notifyRest() { const nx = nextUp(), at = new Date(RS.end); showWo(`Rest until ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}:${String(at.getSeconds()).padStart(2, '0')}`, `${nx ? 'Next: ' + nx.txt : woHead()}`, [{ action: 'add15', title: '+15 s' }, { action: 'skip', title: 'Skip rest' }]); }
function notifyOver() { const nx = nextUp(); if (!nx) return; showWo(`Rest over. Go: set ${nx.j + 1}`, nx.txt, [{ action: 'done', title: '✓ Set done' }, { action: 'add15', title: '+15 s' }], true); }
async function notifyClear() { try { const reg = await navigator.serviceWorker.ready; (await reg.getNotifications({ tag: 'wo' })).forEach(n => n.close()); } catch (e) { } }
export function notifAction(a) {
  if (!active()) return notifyClear();
  if (a === 'done') { const nx = nextUp(); if (nx) tickSet(nx.i, nx.j, true); return; }
  if (a === 'add15' && RS) { RS.end += 15000; RS.total += 15; saveRS(); notifyRest(); return X.draw(); }
  if (a === 'add15' && !RS) { const w = active(); return startRest(w.cur || 0, 15); }
  if (a === 'skip') return restDone(true);
}

/* ---------- strength rank ---------- */
// e1RM ÷ bodyweight at Beginner, Novice, Intermediate, Advanced, Elite (men; women use the second row).
const STD = {
  squat: ['Squat', ['Barbell_Squat', 'Barbell_Full_Squat', 'Smith_Machine_Squat'], [0.75, 1.25, 1.5, 2, 2.5], [0.5, 0.8, 1.1, 1.5, 1.9]],
  bench: ['Bench Press', ['Barbell_Bench_Press_-_Medium_Grip', 'Smith_Machine_Bench_Press', 'Bench_Press_-_Powerlifting'], [0.5, 0.75, 1, 1.5, 2], [0.25, 0.45, 0.65, 0.95, 1.25]],
  dead: ['Deadlift', ['Barbell_Deadlift', 'Trap_Bar_Deadlift'], [1, 1.5, 2, 2.5, 3], [0.6, 0.95, 1.3, 1.75, 2.2]],
  ohp: ['Overhead Press', ['Standing_Military_Press', 'Seated_Barbell_Military_Press', 'Barbell_Shoulder_Press'], [0.35, 0.55, 0.75, 1, 1.25], [0.2, 0.35, 0.5, 0.7, 0.9]],
  row: ['Barbell Row', ['Bent_Over_Barbell_Row'], [0.5, 0.75, 1, 1.25, 1.5], [0.3, 0.45, 0.65, 0.9, 1.15]],
  incline: ['Incline Bench', ['Barbell_Incline_Bench_Press_-_Medium_Grip'], [0.4, 0.65, 0.85, 1.2, 1.6], [0.2, 0.35, 0.55, 0.8, 1.05]],
  dbbench: ['Dumbbell Bench (each)', ['Dumbbell_Bench_Press'], [0.15, 0.25, 0.37, 0.5, 0.65], [0.08, 0.15, 0.22, 0.32, 0.42]],
  dbsp: ['Dumbbell Shoulder Press (each)', ['Dumbbell_Shoulder_Press'], [0.1, 0.17, 0.25, 0.35, 0.45], [0.06, 0.1, 0.15, 0.22, 0.3]],
  pulldown: ['Lat Pulldown', ['Wide-Grip_Lat_Pulldown', 'Close-Grip_Front_Lat_Pulldown', 'V-Bar_Pulldown'], [0.5, 0.75, 1, 1.2, 1.5], [0.3, 0.5, 0.7, 0.9, 1.1]],
  crow: ['Seated Cable Row', ['Seated_Cable_Rows'], [0.5, 0.75, 1, 1.25, 1.5], [0.3, 0.5, 0.7, 0.9, 1.1]],
  legpress: ['Leg Press', ['Leg_Press'], [1.5, 2.25, 3, 4, 5], [1, 1.6, 2.3, 3.1, 4]],
  curl: ['Barbell Curl', ['Barbell_Curl', 'EZ-Bar_Curl'], [0.2, 0.4, 0.6, 0.85, 1.1], [0.1, 0.2, 0.35, 0.5, 0.65]],
  hip: ['Hip Thrust', ['Barbell_Hip_Thrust'], [0.75, 1.25, 1.75, 2.5, 3.25], [0.5, 1, 1.5, 2.1, 2.8]],
  pullup: ['Pull-up (reps)', ['Pullups', 'Chin-Up'], [1, 5, 10, 15, 22], [1, 2, 5, 9, 14], true],
  dips: ['Dips (reps)', ['Dips_-_Chest_Version', 'Dips_-_Triceps_Version', 'Parallel_Bar_Dip'], [2, 8, 15, 25, 35], [1, 3, 8, 14, 22], true],
  pushup: ['Push-ups (reps)', ['Pushups'], [5, 15, 30, 45, 60], [2, 8, 18, 30, 42], true]
};
export const TIERS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
const TIER_C = ['#7C8798', '#B87333', '#A9B4C2', '#E0A21F', '#52B7C9', '#5E7BFF', '#14213D'];
const ANCH = [150, 300, 500, 750, 950];
function scoreOf(v, lv) { if (v <= 0) return 0; if (v < lv[0]) return Math.round(ANCH[0] * v / lv[0]); for (let k = 1; k < 5; k++) if (v < lv[k]) return Math.round(ANCH[k - 1] + (ANCH[k] - ANCH[k - 1]) * (v - lv[k - 1]) / (lv[k] - lv[k - 1])); return Math.min(1050, Math.round(950 + 100 * (v - lv[4]) / (lv[4] * 0.15))); }
export function tierOf(score) { const ti = Math.min(6, Math.floor(score / 150)), step = ti === 6 ? '' : ['I', 'II', 'III'][Math.min(2, Math.floor((score - ti * 150) / 50))]; return { ti, name: TIERS[ti] + (step ? ' ' + step : ''), next: ti === 6 ? 0 : (ti * 150 + (Math.min(2, Math.floor((score - ti * 150) / 50)) + 1) * 50) - score }; }
const LEVEL_N = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
function liftBest(ids, before) {
  let b = null; for (const id of ids) hist(id, before).forEach(h => h.sets.forEach(s => { if (isW(s) || (s.r || 0) > 12 || !s.r) return; if (!b || e1rm(s) > e1rm(b) || (!s.kg && s.r > b.r)) b = { ...s, id }; }));
  return b;
}
export function rankOf(before) {
  if (!X || !X.S.settings) return null;
  const bwKg = X.curWeight(before) || X.S.settings.startWeight || 80, fem = X.S.settings.sex === 'f', lifts = [];
  for (const [k, [name, ids, m, f, reps]] of Object.entries(STD)) {
    const b = reps ? (() => { let r = null; ids.forEach(id => hist(id, before).forEach(h => h.sets.forEach(s => { if (!isW(s) && (s.r || 0) > ((r && r.r) || 0)) r = { ...s, id }; }))); return r; })() : liftBest(ids, before);
    if (!b) continue;
    const v = reps ? (b.r || 0) : e1rm(b) / bwKg, lv = fem ? f : m, sc = scoreOf(v, lv), lvl = lv.filter(x => v >= x).length;
    lifts.push({ k, sc, ...tierOf(sc), name, e1: reps ? null : Math.round(e1rm(b)), reps: reps ? b.r : null, ratio: reps ? null : C.round(v, 2), level: lvl ? LEVEL_N[lvl - 1] : 'Below beginner', dots: reps ? null : Math.round(dots(e1rm(b), bwKg, fem)) });
  }
  if (!lifts.length) return null;
  const score = Math.round(lifts.reduce((s, l) => s + l.sc, 0) / lifts.length);
  return { score, ...tierOf(score), lifts: lifts.length, list: lifts.sort((a, b) => b.sc - a.sc) };
}
// DOTS: compares lifters of different bodyweights (used for the friends strength board)
export function dots(kg, bw, fem) { const c = fem ? [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706] : [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093]; const x = Math.max(40, Math.min(fem ? 150 : 210, bw)); return 500 / (c[0] + c[1] * x + c[2] * x * x + c[3] * x ** 3 + c[4] * x ** 4) * kg; }
function badgeSVG(rk, size = 96) { const col = TIER_C[rk.ti]; return `<svg class="badge" width="${size}" height="${size * 1.12}" viewBox="0 0 96 108" aria-hidden="true"><path d="M48 4l40 16v34c0 26-18 42-40 50C26 96 8 80 8 54V20z" fill="${col}"/><path d="M48 14l30 12v28c0 20-13 33-30 40-17-7-30-20-30-40V26z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><text x="48" y="64" text-anchor="middle" font-family="Alexandria,sans-serif" font-weight="800" font-size="${rk.ti === 6 ? 15 : 24}" fill="#fff">${rk.ti === 6 ? 'LGND' : rk.name.split(' ')[1] || ''}</text></svg>`; }
/* ---------- muscles this week ---------- */
const MAJOR = ['chest', 'shoulders', 'lats', 'middle back', 'traps', 'biceps', 'triceps', 'forearms', 'abdominals', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'lower back'];
export function muscleSets(from, to) {
  const out = {}, lastAt = {};
  MAJOR.forEach(m => { out[m] = 0; });
  for (const k of sessions()) { if (k < from || k > to) continue; const w = X.S.days[k].wo; (w.ex || []).forEach(e => { const x = ex(e.id), n = (e.sets || []).filter(s => s.done && !isW(s)).length; if (!n) return; x.pm.forEach(m => { out[m] = (out[m] || 0) + n; lastAt[m] = Math.max(lastAt[m] || 0, w.t1 || Date.parse(k)); }); x.sm.forEach(m => { out[m] = (out[m] || 0) + n / 2; }); }); }
  return { sets: out, lastAt };
}
function recoverDays(m, sets, lastAt) { if (!lastAt[m]) return 0; const need = (sets[m] >= 6 ? 72 : 48) * 3600e3, left = lastAt[m] + need - Date.now(); return left > 0 ? Math.ceil(left / 86400e3) : 0; }
const heat = v => v <= 0 ? 'var(--mm0)' : v < 5 ? 'var(--mm1)' : v < 10 ? 'var(--mm2)' : v < 16 ? 'var(--mm3)' : 'var(--mm4)';
function bodySVG(sets) {
  const c = m => heat(sets[m] || 0), g = (m, inner) => `<g data-act="tr-muscle" data-v="${m}" fill="${c(m)}"><title>${esc(musL(m))}: ${C.round(sets[m] || 0, 1)} sets</title>${inner}</g>`;
  const base = 'var(--mm0)';
  const front = `<g transform="translate(18,6)"><circle cx="55" cy="16" r="13" fill="${base}"/><rect x="49" y="28" width="12" height="9" rx="3" fill="${base}"/>
  ${g('shoulders', '<ellipse cx="30" cy="46" rx="12" ry="10"/><ellipse cx="80" cy="46" rx="12" ry="10"/>')}${g('chest', '<path d="M42 40h26l3 24-16 6-16-6z"/>')}
  ${g('abdominals', '<rect x="44" y="72" width="22" height="44" rx="6"/>')}<path d="M36 70l7 2v42l-8-6z" fill="${base}"/><path d="M74 70l-7 2v42l8-6z" fill="${base}"/>
  ${g('biceps', '<rect x="17" y="56" width="11" height="34" rx="5.5" transform="rotate(8 22 56)"/><rect x="82" y="56" width="11" height="34" rx="5.5" transform="rotate(-8 88 56)"/>')}
  ${g('forearms', '<rect x="11" y="92" width="10" height="34" rx="5" transform="rotate(8 16 92)"/><rect x="89" y="92" width="10" height="34" rx="5" transform="rotate(-8 94 92)"/>')}
  ${g('quadriceps', '<path d="M38 120h16l-1 64h-14z"/><path d="M56 120h16l-1 64h-14z"/>')}${g('calves', '<rect x="38" y="190" width="13" height="44" rx="6"/><rect x="59" y="190" width="13" height="44" rx="6"/>')}
  <g stroke="var(--surface)" stroke-width="1.6"><line x1="55" y1="40" x2="55" y2="68"/><line x1="55" y1="72" x2="55" y2="116"/><line x1="44" y1="86" x2="66" y2="86"/><line x1="44" y1="100" x2="66" y2="100"/></g>
  <text x="55" y="246" text-anchor="middle" font-size="11" fill="var(--muted)">Front</text></g>`;
  const back = `<g transform="translate(168,6)"><circle cx="55" cy="16" r="13" fill="${base}"/>${g('traps', '<path d="M40 32h30l6 14-21 14-21-14z"/>')}
  ${g('shoulders', '<ellipse cx="30" cy="46" rx="12" ry="10"/><ellipse cx="80" cy="46" rx="12" ry="10"/>')}${g('lats', '<path d="M34 56l20 8v38l-14-8z"/><path d="M76 56l-20 8v38l14-8z"/>')}
  ${g('middle back', '<rect x="47" y="64" width="16" height="20" rx="4"/>')}${g('lower back', '<rect x="46" y="96" width="18" height="20" rx="5"/>')}
  ${g('triceps', '<rect x="17" y="56" width="11" height="34" rx="5.5" transform="rotate(8 22 56)"/><rect x="82" y="56" width="11" height="34" rx="5.5" transform="rotate(-8 88 56)"/>')}
  ${g('forearms', '<rect x="11" y="92" width="10" height="34" rx="5" transform="rotate(8 16 92)"/><rect x="89" y="92" width="10" height="34" rx="5" transform="rotate(-8 94 92)"/>')}
  ${g('glutes', '<ellipse cx="46" cy="128" rx="10" ry="12"/><ellipse cx="64" cy="128" rx="10" ry="12"/>')}${g('hamstrings', '<path d="M38 142h15l-1 42h-13z"/><path d="M57 142h15l-1 42h-13z"/>')}
  ${g('calves', '<ellipse cx="45" cy="204" rx="7" ry="16"/><ellipse cx="65" cy="204" rx="7" ry="16"/>')}<text x="55" y="246" text-anchor="middle" font-size="11" fill="var(--muted)">Rear</text></g>`;
  return `<svg class="bodymap" viewBox="0 0 300 254" role="img" aria-label="Muscles trained this week">${front}${back}</svg>`;
}
export function musclesHTML(from, to) {
  const { sets, lastAt } = muscleSets(from, to), list = MAJOR.slice().sort((a, b) => (sets[b] || 0) - (sets[a] || 0));
  return `<section class="card"><div class="spread"><h2 style="margin:0">This week</h2><span class="sub">${X.fmt(from)} – ${X.fmt(to)}</span></div>${bodySVG(sets)}
  <div class="mmleg"><span>0 sets</span><i></i><span>16+</span></div></section>
  <section class="card"><div class="card-h"><h2>Sets per muscle</h2></div><p class="hint">The dashed zone is 10–20 hard sets a week, the usual range for growth. Secondary muscles count half. Tap a muscle for its exercises.</p>
  ${list.map(m => { const v = C.round(sets[m] || 0, 1), r = recoverDays(m, sets, lastAt); return `<button class="mb" data-act="tr-muscle" data-v="${m}"><span>${esc(musL(m))}</span><span class="tr"><i style="width:${Math.min(100, v / 24 * 100)}%;background:${heat(v)}"></i></span><small class="num">${v} · ${r ? `${r} day${r > 1 ? 's' : ''}` : 'ready'}</small></button>`; }).join('')}</section>`;
}
function openMuscle(m, from, to) {
  const rows = [];
  for (const k of sessions()) { if (k < from || k > to) continue; (X.S.days[k].wo.ex || []).forEach(e => { const x = ex(e.id), n = (e.sets || []).filter(s => s.done && !isW(s)).length; if (n && (x.pm.includes(m) || x.sm.includes(m))) rows.push({ k, e, n, prim: x.pm.includes(m) }); }); }
  sheet(rows.length ? `<div class="card list2 flat">${rows.map(r => `<button class="lrow exr" data-act="tr-exinfo" data-v="${r.e.id}">${thumb(r.e.id)}<span class="lt"><b>${esc(exName(r.e))}</b><small>${X.fmt(r.k)} · ${r.n} sets${r.prim ? '' : ' (counts half)'}</small></span><span class="le">›</span></button>`).join('')}</div>` : `<p class="hint">Nothing for ${esc(musL(m))} this week yet.</p>`, musL(m));
}
let MUSW = null;
export function setMuscleWeek(from, to) { MUSW = [from, to]; }

/* ---------- league points (Saturday to Friday) ---------- */
export function leagueWeek(from) {
  const S = X.S, t = X.today(); let pts = 0, days = 0, wos = 0, rec = 0, cd = 0;
  for (let i = 0; i < 7; i++) {
    const dt = C.addDays(from, i); if (dt > t) break; const d = S.days[dt] || {};
    if (C.evalDay(S.settings, d, dt).complete) { pts += 10; days++; }
    if (d.wo && d.wo.t1 && !d.wo.imported) { pts += 5; wos++; const p = prCount(dt); pts += p * 3; rec += p; }
    if ((d.stamina || []).some(s => s.src === 'finisher') || (d.sports || []).length) { pts += 2; cd++; }
    if ((S.settings.cheered || {})[dt]) pts += 1;
  }
  if (X.focusHit && X.focusHit(from)) pts += 5;
  return { pts, days, wo: wos, rec, cd };
}

/* ---------- library ---------- */
function libHTML() {
  if (!DB) return `<p class="hint center">Loading exercises…</p>`;
  const f = X.S.trLib = X.S.trLib || { q: '', m: '', e: '' };
  return `<section class="card lib"><input class="in" id="tr-q" type="search" placeholder="Search 873 exercises" value="${esc(f.q)}" autocomplete="off">
  <div class="chips">${['', ...MUSCLES.slice(0, 14)].map(m => `<button data-act="tr-fm" data-v="${m}" aria-pressed="${f.m === m}">${m ? esc(musL(m)) : 'All'}</button>`).join('')}</div>
  <select class="in" id="tr-fe" aria-label="Equipment"><option value="">Any equipment</option>${Object.keys(EQ_L).filter(Boolean).map(k => `<option value="${k}" ${f.e === k ? 'selected' : ''}>${esc(eqL(k))}</option>`).join('')}</select></section>
  <div id="tr-res">${resHTML(filterLib(f), X.S.trPick ? 'tr-pickex' : 'tr-exinfo')}</div>`;
}
function filterLib(f) {
  const q = (f.q || '').toLowerCase().trim(), words = q.split(/\s+/).filter(Boolean);
  return DB.list.filter(x => (!f.m || x.pm.includes(f.m)) && (!f.e || x.eq === f.e) && (!words.length || words.every(w => x.name.toLowerCase().includes(w))))
    .sort((a, b) => (a.cat === 'strength' ? 0 : 1) - (b.cat === 'strength' ? 0 : 1) || (a.lv === 'b' ? 0 : 1) - (b.lv === 'b' ? 0 : 1) || a.name.localeCompare(b.name)).slice(0, 60);
}
function resHTML(res, act) {
  if (!res.length) return `<p class="hint center">No exercises match.</p>`;
  return `<div class="card list2">${res.map(x => `<button class="lrow exr" data-act="${act}" data-v="${x.id}">${thumb(x.id)}<span class="lt"><b>${esc(x.name)}</b><small>${esc(meta(x))}</small></span><span class="le">›</span></button>`).join('')}</div>`;
}

/* ---------- sheets ---------- */
function sheet(html, label, scope = 'tr') {
  X.setSH({ scope }); const s = $('sheet'); s.hidden = false;
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="grab" aria-hidden="true"></div><div class="spread"><h2>${esc(label)}</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>${html}</div>`;
}
function chartSVG(pts, unit) {
  if (pts.length < 2) return `<p class="hint">The chart appears after two sessions.</p>`;
  const W = 330, H = 120, vs = pts.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs), sp = mx - mn || 1;
  const xy = pts.map((p, i) => [8 + i * (W - 40) / (pts.length - 1), 12 + (H - 34) * (1 - (p.v - mn) / sp)]);
  const L = xy[xy.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Progress chart"><g stroke="var(--line)"><line x1="0" y1="12" x2="${W}" y2="12"/><line x1="0" y1="${H - 22}" x2="${W}" y2="${H - 22}"/></g><polyline fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" points="${xy.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/><circle cx="${L[0]}" cy="${L[1]}" r="5" fill="var(--gold)"/><text x="${Math.min(L[0], W - 50)}" y="${Math.max(10, L[1] - 9)}" font-size="11" font-weight="700" fill="var(--ink)">${C.round(pts[pts.length - 1].v, 1)} ${unit}</text><text x="0" y="${H - 4}" font-size="9.5" fill="var(--muted)">${esc(X.fmt(pts[0].d))}</text><text x="${W}" y="${H - 4}" text-anchor="end" font-size="9.5" fill="var(--muted)">${esc(X.fmt(pts[pts.length - 1].d))}</text></svg>`;
}
async function openExercise(id) {
  await loadDB(); const x = ex(id), H = hist(id), mode = X.S.trChart || 'e1';
  const per = H.map(h => { const ws = h.sets.filter(s => !isW(s)); return { d: h.date, e1: Math.max(0, ...ws.map(e1rm)), heavy: Math.max(0, ...ws.map(s => s.kg || 0)), vol: ws.reduce((a, s) => a + (s.kg || 0) * (s.r || 0), 0), reps: Math.max(0, ...ws.map(s => s.r || 0)) }; });
  const all = H.flatMap(h => h.sets.filter(s => !isW(s))), b = bestSet(all), heavy = all.reduce((a, s) => !a || (s.kg || 0) > (a.kg || 0) || ((s.kg || 0) === (a.kg || 0) && (s.r || 0) > (a.r || 0)) ? s : a, null), mostR = all.reduce((a, s) => !a || (s.r || 0) > (a.r || 0) ? s : a, null), bv = per.reduce((a, p) => Math.max(a, p.vol), 0);
  const rkL = (() => { const rk = rankOf(); return rk && rk.list.find(l => STD[l.k][1].includes(id)); })(), note = (T() && (T().notes || {})[id]) || '';
  const body = () => `${photos(id)}<p class="sub">${esc(x.pm.map(musL).join(', '))}${x.sm.length ? ` · also ${esc(x.sm.map(musL).join(', '))}` : ''} · ${esc(eqL(x.eq))} · ${x.lv === 'b' ? 'Beginner' : x.lv === 'i' ? 'Intermediate' : 'Advanced'}</p>
  ${H.length ? `<div class="chips">${[['e1', 'Best 1-rep max'], ['heavy', 'Heaviest'], ['vol', 'Volume']].map(([k, l]) => `<button data-act="tr-chart" data-v="${k}:${id}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>${chartSVG(per.filter(p => p[mode === 'e1' ? 'e1' : mode] > 0).map(p => ({ d: p.d, v: p[mode === 'e1' ? 'e1' : mode] })), mode === 'vol' ? 'kg' : 'kg')}
  <div class="rec"><div><b class="num">${b && b.kg ? Math.round(e1rm(b)) + ' kg' : '–'}</b><span>Best est. 1-rep max</span></div><div><b class="num">${heavy && heavy.kg ? setTxt(heavy) : '–'}</b><span>Heaviest set</span></div><div><b class="num">${mostR ? setTxt(mostR) : '–'}</b><span>Most reps</span></div><div><b class="num">${bv ? Math.round(bv).toLocaleString('en') + ' kg' : '–'}</b><span>Best session volume</span></div></div>` : `<p class="hint">No sets logged yet.</p>`}
  ${rkL ? `<div class="card list2 flat"><div class="lrow static"><span class="lic" style="background:${TIER_C[rkL.ti]};color:#fff">★</span><span class="lt"><b>${esc(tierOf(rkL.sc).name)} on this lift</b><small>${rkL.e1 ? `${rkL.ratio} × bodyweight · ${esc(rkL.level)}` : `${rkL.reps} reps · ${esc(rkL.level)}`}</small></span></div></div>` : ''}
  <label class="full">Note (shows every time you do it)<textarea class="in" rows="2" maxlength="140" data-trnote="${esc(id)}" placeholder="Seat height, grip, cues…">${esc(note)}</textarea></label>
  ${CX[id] ? '' : `<details class="howd"><summary>How to do it</summary>${HOW ? `<ol class="howto">${(HOW[id] || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : `<p class="hint">Loading steps…</p>`}</details>`}
  <a class="btn block" href="${ytURL(x.name)}" target="_blank" rel="noopener">▶ Watch form videos</a>
  ${H.length ? `<h3 class="grp">History</h3><div class="card list2 flat">${H.slice(-8).reverse().map(s => `<div class="lrow static"><span class="lic">•</span><span class="lt"><b class="num">${s.sets.map(z => (isW(z) ? 'W ' : '') + setTxt(z)).join(', ')}</b><small>${X.fmt(s.date)}</small></span></div>`).join('')}</div>` : ''}
  ${active() ? `<button class="btn primary block" data-act="tr-pickex" data-v="${id}">Add to this workout</button>` : ''}`;
  sheet(body(), x.name);
  if (!HOW) { await loadHow(); const s = $('sheet'); if (s && !s.hidden && s.querySelector('.howd')) sheet(body(), x.name); }
}
function openLibPick(target) {
  X.S.trPick = target; loadDB().then(() => {
    const f = X.S.trLib = X.S.trLib || { q: '', m: '', e: '' };
    sheet(`<input class="in" id="tr-q" type="search" placeholder="Search 873 exercises" value="${esc(f.q)}" autocomplete="off"><div class="chips">${['', ...MUSCLES.slice(0, 14)].map(m => `<button data-act="tr-fm" data-v="${m}" aria-pressed="${f.m === m}">${m ? esc(musL(m)) : 'All'}</button>`).join('')}</div><div id="tr-res">${resHTML(filterLib(f), 'tr-pickex')}</div>`, 'Add exercise', 'trpick');
  });
}
function openSwap(i) {
  const w = active(), e = w.ex[i], x = ex(e.id), alts = new Set();
  Object.values(PAT).forEach(t => { const all = t.flat(); if (all.includes(e.id)) all.forEach(id => id !== e.id && alts.add(id)); });
  DB.list.filter(y => y.id !== e.id && y.pm[0] === x.pm[0] && y.cat === 'strength').sort((a, b) => (a.eq === x.eq) - (b.eq === x.eq) || (a.lv === 'b' ? -1 : 1)).slice(0, 25).forEach(y => alts.add(y.id));
  X.S.trSwap = i;
  sheet(`<p class="hint">Same muscles, different machine or tool. Handy when the gym is busy.</p>${resHTML([...alts].map(ex), 'tr-swapto')}`, `Swap ${exName(e)}`);
}
function prevSame(date, w) { const ks = sessions(date).filter(k => { const p = X.S.days[k].wo; return p.rid === w.rid || p.name === w.name; }); return ks.length ? { k: ks[ks.length - 1], w: X.S.days[ks[ks.length - 1]].wo } : null; }
function openSummary(date) {
  const d = X.S.days[date || D()], w = d && d.wo; if (!w) return; date = date || D();
  const st = woStats(w), prev = prevSame(date, w), ps = prev && woStats(prev.w);
  const rows = w.ex.filter(e => (e.sets || []).some(s => s.done && !isW(s))).map(e => {
    const work = e.sets.filter(s => s.done && !isW(s)), top = bestSet(work), b0 = best(e.id, date), pe = prev && prev.w.ex.find(z => z.id === e.id), pw = pe ? pe.sets.filter(s => s.done && !isW(s)) : [];
    let tag = '';
    if (top && beats(top, b0)) tag = `<span class="up">▲ record</span>`;
    else if (pw.length) { const k1 = Math.max(0, ...work.map(s => s.kg || 0)), k0 = Math.max(0, ...pw.map(s => s.kg || 0)), r1 = work.reduce((a, s) => a + (s.r || 0), 0), r0 = pw.reduce((a, s) => a + (s.r || 0), 0); tag = k1 > k0 ? `<span class="up">▲ +${C.round(k1 - k0, 2)} kg</span>` : k1 < k0 ? `<span class="dn">▼ −${C.round(k0 - k1, 2)} kg</span>` : r1 > r0 ? `<span class="up">▲ +${r1 - r0} rep${r1 - r0 > 1 ? 's' : ''}</span>` : r1 < r0 ? `<span class="dn">▼ −${r0 - r1} rep${r0 - r1 > 1 ? 's' : ''}</span>` : `<span class="eq">= same</span>`; }
    return `<div class="cmp"><span>${esc(exName(e))}</span><span class="sub num">${work.map(setTxt).join(', ')}</span>${tag}</div>`;
  }).join('');
  const prs = w.imported ? 0 : prCount(date), cd = (T() || {}).cardio, routine = T() && T().routines && T().routines.find(r => r.id === w.rid);
  const pct = ps && ps.vol ? Math.round((st.vol - ps.vol) / ps.vol * 100) : null, dm = ps && ps.min && st.min ? st.min - ps.min : null;
  sheet(`<p class="hint">${woSummary(w)}${prev ? ` · vs last ${esc(prev.w.name)} on ${X.fmt(prev.k)}` : ''}</p>
  <div class="rec three"><div><b class="num ${pct > 0 ? 'up' : pct < 0 ? 'dn' : ''}">${pct == null ? C.round(st.vol / 1000, 2) + ' t' : (pct > 0 ? '+' : '') + pct + '%'}</b><span>${pct == null ? 'Total lifted' : 'Volume'}</span></div><div><b class="num">${prs}</b><span>New records</span></div><div><b class="num">${dm == null ? (st.min || '–') : (dm > 0 ? '+' : '') + dm + ' min'}</b><span>${dm == null ? 'Minutes' : dm <= 0 ? 'Faster' : 'Longer'}</span></div></div>
  ${rows ? `<h3 class="grp">${prev ? 'Compared with last time' : 'Your sets'}</h3><div class="cmps">${rows}</div>` : ''}
  ${!w.imported && X.S.settings.group ? `<div class="note2 warn"><b>League</b><span>+5 for the workout${prs ? `, +${prs * 3} for ${prs} record${prs > 1 ? 's' : ''}` : ''}.</span></div>` : ''}
  ${cd && cd.on && !cardioDone(d) && date === D() && !w.imported ? cardioBlock(cd, routine && routine.cd) : ''}`, `${w.name} · ${w.t1 || w.imported ? 'done' : 'in progress'}`);
}
function cardioBlock(cd, mode) {
  const m = CARDIO.find(c => c[0] === (mode || cd.mode)) || CARDIO[0];
  return `<section class="card cdblock">${photos(m[0])}<span class="sub">Cardio after lifting</span><h3>${cd.min} min · ${esc(m[1])}</h3><p class="hint">${esc(cd.kind === 'int' ? CARDIO_KIND.int + '. ' : 'Easy, steady pace: you can still talk. ')}${esc(m[2])}</p>
  <div class="row"><button class="btn primary grow" data-act="tr-cdlog" data-v="${cd.min}:${m[0]}">Done: ${cd.min} min</button><button class="btn" data-act="tr-cdlog" data-v="${Math.round(cd.min / 2)}:${m[0]}">Only ${Math.round(cd.min / 2)} min</button></div></section>`;
}
function openEdit(rid) {
  const t = T(), r = rid === 'new' ? null : t.routines.find(x => x.id === rid);
  X.S.trEdit = r ? JSON.parse(JSON.stringify(r)) : { id: 'C-' + Math.random().toString(36).slice(2, 7), name: 'My workout', ex: [] };
  drawEdit();
}
function drawEdit() {
  const r = X.S.trEdit, isNew = !T().routines.some(x => x.id === r.id);
  sheet(`<label class="full">Name<input class="in" id="tr-rname" value="${esc(r.name)}" maxlength="40"></label>
  <div class="card list2 flat edlist">${r.ex.map((e, i) => `<div class="lrow static ed${e.ss ? ' ssr' : ''}">${thumb(e.id)}<span class="lt"><b>${esc(exName(e))}</b><span class="edn"><input class="in num" type="number" inputmode="numeric" min="1" max="10" data-tre="${i}:sets" value="${e.sets}" aria-label="Sets"><em>sets of</em><input class="in num" type="number" inputmode="numeric" min="1" data-tre="${i}:lo" value="${e.lo}" aria-label="Fewest reps"><em>–</em><input class="in num" type="number" inputmode="numeric" min="1" data-tre="${i}:hi" value="${e.hi}" aria-label="Most reps"></span></span><span class="edb"><button class="x" data-act="tr-eup" data-v="${i}" aria-label="Move up">↑</button><button class="x" data-act="tr-erm" data-v="${i}" aria-label="Remove">×</button></span></div>${i < r.ex.length - 1 ? `<button class="sslink${e.ss && r.ex[i + 1].ss === e.ss ? ' on' : ''}" data-act="tr-elink" data-v="${i}">${e.ss && r.ex[i + 1].ss === e.ss ? '⛓ Superset · tap to unlink' : '+ Link as superset'}</button>` : ''}`).join('') || `<p class="hint">No exercises yet.</p>`}</div>
  <button class="btn block" data-act="tr-eadd">+ Add exercise</button>
  <div class="row"><button class="btn primary grow" data-act="tr-esave">${isNew ? 'Add to my plan' : 'Save'}</button>${isNew ? '' : `<button class="btn ghost danger" data-act="tr-edel">Delete</button>`}</div>`, isNew ? 'New workout' : 'Edit workout', 'tredit');
}
function openRestPick(id) {
  X.S.trRest = { id, v: id === '*' ? restFor('*') : restFor(id), all: id === '*' };
  drawRestPick();
}
function drawRestPick() {
  const r = X.S.trRest;
  sheet(`<p class="hint">${r.id === '*' ? 'Used for every exercise unless you set one for it.' : esc(exName(r.id))}</p>
  <div class="ropts">${[0, 15, 30, 45, 60, 90, 120, 180].map(v => `<button data-act="tr-rv" data-v="${v}" aria-pressed="${r.v === v}">${v ? mmss(v) : 'Off'}</button>`).join('')}</div>
  <div class="spread"><span class="hint">Custom</span><span class="row"><button class="btn small" data-act="tr-rv" data-v="${Math.max(0, r.v - 5)}">−5 s</button><b class="num" style="font-size:20px;min-width:56px;text-align:center">${r.v ? mmss(r.v) : 'Off'}</b><button class="btn small" data-act="tr-rv" data-v="${Math.min(600, r.v + 5)}">+5 s</button></span></div>
  ${r.id === '*' ? '' : `<p class="hint" style="margin-top:10px">Use this for</p><div class="seg wide"><button data-act="tr-rall" data-v="0" aria-pressed="${!r.all}">This exercise, every time</button><button data-act="tr-rall" data-v="1" aria-pressed="${r.all}">All exercises</button></div>`}
  <p class="hint" style="margin-top:10px">Heavy compound lifts usually need 1:30–3:00 for full strength; 0:30–1:00 suits isolation work and fat-loss circuits.</p>
  <button class="btn primary block" data-act="tr-rsave">Save</button>`, 'Rest time');
}
function openSetMenu(i, j) {
  const w = active(); if (!w) return; const s = w.ex[i].sets[j]; X.S.trSM = [i, j];
  const it = (t, l, d, n) => `<button class="mrow" data-act="tr-stype" data-v="${t}" aria-pressed="${(s.t || '') === t}"><span class="sn ${t}">${n}</span><span><b>${l}</b><small>${d}</small></span></button>`;
  sheet(`<div class="mlist">${it('', 'Normal set', 'Counts toward records and rank', '1')}${it('w', 'Warm-up', 'Doesn’t count toward records', 'W')}${it('d', 'Drop set', 'Lower the weight and keep going, no rest', 'D')}${it('f', 'To failure', 'Last rep was the last one possible', 'F')}</div>
  <p class="hint" style="margin-top:12px">How hard was it? (RPE, optional)</p><div class="rp">${[6, 7, 8, 9, 10].map(v => `<button data-act="tr-rpe" data-v="${v}" aria-pressed="${s.rpe === v}">${v}</button>`).join('')}</div>
  <p class="hint" style="margin-top:6px">10 = nothing left · 9 = 1 more rep · 8 = about 2 more · 7 = about 3 more.</p>
  <button class="btn block danger-soft" data-act="tr-rmset">Remove this set</button>`, `Set ${j + 1} · ${exName(w.ex[i])}`);
}
const PL_C = { 25: '#D9534F', 20: '#3D8BFD', 15: '#F2B33D', 10: '#2FA36B', 5: '#E8ECF2', 2.5: '#14213D', 1.25: '#A9B4C2' };
function plates(perSide, avail) { const out = []; let left = C.round(perSide, 3); for (const p of avail) while (left >= p - 1e-6) { out.push(p); left = C.round(left - p, 3); } return { out, left }; }
function openWarm(i) {
  const w = active(), e = w.ex[i], x = ex(e.id), t = T(), last = hist(e.id, D()).pop(), lastTop = last ? Math.max(0, ...last.sets.filter(s => !isW(s)).map(s => s.kg || 0)) : 0;
  const first = e.sets.find(s => !isW(s) && s.kg), S = X.S; S.trWarm = S.trWarm && S.trWarm.i === i ? S.trWarm : { i, kg: (first && first.kg) || lastTop || 0 };
  const kg = S.trWarm.kg, isBar = /barbell|e-z/.test(x.eq), bar = isBar ? (t.bar ?? 20) : 0, avail = t.plates || [25, 20, 15, 10, 5, 2.5, 1.25];
  const rnd = v => isBar ? Math.max(bar, Math.round((v - bar) / 2.5) * 2.5 + bar) : x.eq === 'dumbbell' ? Math.round(v / 2) * 2 : Math.round(v / 2.5) * 2.5;
  const steps = (isBar ? [[1, 10, 'Bar'], [0.4, 5], [0.6, 3], [0.8, 1]] : [[0.5, 8], [0.75, 4]]).map(([p, r, l]) => ({ kg: l ? bar : rnd(kg * p), r, l: l || Math.round(p * 100) + '%' })).filter((s, k, a) => kg && s.kg < kg && (k === 0 || s.kg > a[k - 1].kg));
  const ps = isBar && kg > bar ? plates((kg - bar) / 2, avail) : null;
  const side = v => { const p = plates((v - bar) / 2, avail); return p.out.length ? p.out.join(' + ') + ' a side' : 'empty bar'; };
  let px = 0;
  sheet(`<div class="spread"><span class="hint">Work weight</span><span class="row"><button class="btn small" data-act="tr-wkg" data-v="${Math.max(0, kg - 2.5)}">−2.5</button><input class="in num" id="tr-wkg" type="number" inputmode="decimal" step="0.5" value="${kg || ''}" style="width:84px;text-align:center;font-weight:700"><button class="btn small" data-act="tr-wkg" data-v="${kg + 2.5}">+2.5</button></span></div>
  ${ps ? `<p class="hint" style="margin-top:12px;font-weight:700;color:var(--ink)">Plates on each side</p><div class="plbar"><span class="rod"></span><span class="sl"></span>${ps.out.map(p => { const h = 26 + Math.min(34, p * 1.4), el = `<span class="pl" style="left:${110 + px}px;width:${p >= 10 ? 18 : 11}px;height:${h}px;top:${(60 - h) / 2}px;background:${PL_C[p] || '#56627A'};color:${p === 5 || p === 1.25 ? '#14213D' : '#fff'}">${p}</span>`; px += (p >= 10 ? 18 : 11) + 2; return el; }).join('')}</div><p class="hint">${ps.out.join(' + ')} on each side of a ${bar} kg bar${ps.left > 0.01 ? ` (${C.round(ps.left, 2)} kg can't be loaded)` : ''}. <label class="inl">Bar <select class="in" data-trbar="1">${[20, 15, 10, 7].map(b => `<option ${b === bar ? 'selected' : ''}>${b}</option>`).join('')}</select> kg</label></p>` : ''}
  ${steps.length ? `<p class="hint" style="margin-top:12px;font-weight:700;color:var(--ink)">Warm-up</p><div class="wu">${steps.map(s => `<div><b>${esc(s.l)}</b><span class="num">${C.round(s.kg, 2)} kg × ${s.r}</span><small>${isBar ? esc(side(s.kg)) : ''}</small></div>`).join('')}</div><button class="btn primary block" data-act="tr-addwarm" data-v="${i}">Add ${steps.length} warm-up sets</button>` : `<p class="hint">Enter your work weight to get warm-up sets.</p>`}`, `${exName(e)}${kg ? ' · ' + C.round(kg, 2) + ' kg' : ''}`);
  S.trWarmSteps = steps;
}
function openNote(id) { sheet(`<textarea class="in" rows="3" maxlength="140" data-trnote="${esc(id)}" placeholder="Seat height, grip, cues…">${esc(((T().notes || {})[id]) || '')}</textarea><p class="hint">Shows every time you do this exercise.</p><button class="btn primary block" data-act="closesheet">Done</button>`, `Note · ${exName(id)}`); }
function openWMenu(date) {
  const w = X.S.days[date].wo; X.S.trDel = null;
  sheet(`<p class="hint">${woSummary(w)}</p><button class="btn block" data-act="tr-summary" data-v="${date}">See summary</button><button class="btn block" data-act="tr-wedit" data-v="${date}">Edit sets</button><button class="btn block danger-soft" data-act="tr-wdel" data-v="${date}" id="tr-wdel">Delete this workout</button>
  <p class="hint" style="margin-top:10px">Deleting removes its sets and records. If it was that day's training, the day's training tick goes too, and your plan goes back to this workout.</p>`, `${w.name} · ${X.fmt(date)}`);
}
function openWEdit(date) {
  const w = X.S.days[date].wo;
  sheet(`${w.ex.map((e, i) => `<h3 class="grp">${esc(exName(e))}</h3>${e.sets.map((s, j) => `<div class="weed"><span class="sn ${s.t || ''}">${s.t ? s.t.toUpperCase() : j + 1}</span><input class="in num" type="number" inputmode="decimal" step="0.5" data-woe="${date}:${i}:${j}:kg" value="${s.kg ?? ''}" aria-label="Weight"><em>kg ×</em><input class="in num" type="number" inputmode="numeric" data-woe="${date}:${i}:${j}:r" value="${s.r ?? ''}" aria-label="Reps"><button class="x" data-act="tr-wesrm" data-v="${date}:${i}:${j}" aria-label="Remove set">×</button></div>`).join('')}`).join('')}<button class="btn primary block" data-act="closesheet">Done</button>`, `Edit ${w.name}`);
}

/* ---------- import from Lyfta, Hevy or Strong (CSV) ---------- */
function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || '', delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i]; if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const ALIAS = { 'bench press': 'Barbell_Bench_Press_-_Medium_Grip', 'squat': 'Barbell_Squat', 'deadlift': 'Barbell_Deadlift', 'lat pulldown': 'Wide-Grip_Lat_Pulldown', 'seated row': 'Seated_Cable_Rows', 'overhead press': 'Standing_Military_Press', 'shoulder press': 'Dumbbell_Shoulder_Press', 'leg press': 'Leg_Press', 'leg extension': 'Leg_Extensions', 'lying leg curl': 'Lying_Leg_Curls', 'seated leg curl': 'Seated_Leg_Curl', 'bicep curl': 'Dumbbell_Bicep_Curl', 'biceps curl': 'Dumbbell_Bicep_Curl', 'hammer curl': 'Hammer_Curls', 'triceps pushdown': 'Triceps_Pushdown', 'tricep pushdown': 'Triceps_Pushdown', 'lateral raise': 'Side_Lateral_Raise', 'face pull': 'Face_Pull', 'pull up': 'Pullups', 'chin up': 'Chin-Up', 'push up': 'Pushups', 'plank': 'Plank', 'romanian deadlift': 'Romanian_Deadlift', 'hip thrust': 'Barbell_Hip_Thrust', 'incline bench press': 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'dumbbell fly': 'Dumbbell_Flyes', 'pec deck': 'Butterfly', 'chest fly': 'Butterfly', 'calf raise': 'Standing_Calf_Raises', 'cable crunch': 'Cable_Crunch', 'walking lunge': 'Bodyweight_Walking_Lunge', 'hip adduction': 'Thigh_Adductor', 'hip abduction': 'Thigh_Abductor', 'stair machine': 'Stairmaster', 'incline treadmill': 'Walking_Treadmill', 'treadmill': 'Jogging_Treadmill', 'assisted pull up': 'Band_Assisted_Pull-Up', 'preacher curl': 'Preacher_Curl', 'smith squat': 'Smith_Machine_Squat', 'straight arm pulldown': 'Straight-Arm_Pulldown', 'wrist curl': 'Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench', 'reverse wrist curl': 'Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench', 'abdominal crunch': 'Ab_Crunch_Machine' };
LYFTA_PLAN.forEach(([, , l]) => l.forEach(([id, , , , nm]) => { if (nm) ALIAS[norm(nm)] = id; }));
function matchEx(name) {
  const n = norm(name); if (!n) return { id: null, sc: 0 };
  if (ALIAS[n]) return { id: ALIAS[n], sc: 1 };
  const words = new Set(n.split(' ').map(w => w.replace(/s$/, '')).filter(w => w.length > 1));
  const eqHint = /\b(lever|machine)\b/.test(n) ? 'machine' : /\bcable\b/.test(n) ? 'cable' : /\bdumbbell\b/.test(n) ? 'dumbbell' : /\bbarbell\b/.test(n) ? 'barbell' : /\bsmith\b/.test(n) ? 'machine' : null;
  let bestM = null, bs = 0;
  for (const x of DB.list) { const xw = new Set(norm(x.name).split(' ').map(w => w.replace(/s$/, '')).filter(w => w.length > 1)); let inter = 0; words.forEach(w => { if (xw.has(w)) inter++; }); let sc = inter / Math.max(words.size, xw.size); if (eqHint && x.eq === eqHint) sc += 0.08; if (x.cat !== 'strength') sc -= 0.05; for (const [a, id] of Object.entries(ALIAS)) if (n.includes(a) && id === x.id) sc += 0.3; if (sc > bs) { bs = sc; bestM = x.id; } }
  return { id: bestM, sc: bs };
}
function parseWhen(s) {
  s = String(s || '').trim(); if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/); if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, t: new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0)).getTime() };
  m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/); if (m) return { date: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, t: new Date(+m[3], m[2] - 1, +m[1], +(m[4] || 12), +(m[5] || 0)).getTime() };
  const t = Date.parse(s.replace(/,/g, '')); if (!isNaN(t)) { const d = new Date(t); return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, t }; }
  return null;
}
async function readImport(file) {
  await loadDB();
  const rows = parseCSV(await file.text()); if (rows.length < 2) return X.toast('That file looks empty.');
  const H = rows[0].map(h => h.trim().toLowerCase()), col = (...res) => H.findIndex(h => res.some(r => r.test(h)));
  const cDate = col(/^start_time$/, /^date$/, /date/, /start/), cTitle = col(/^title$/, /workout name/, /^workout$/, /routine/), cEx = col(/exercise_title/, /exercise name/, /^exercise$/, /exercise/), cKg = col(/weight_kg/, /^weight$/, /weight/), cR = col(/^reps$/, /reps/), cType = col(/set_type/, /set type/), cRpe = col(/^rpe$/), cSec = col(/duration_seconds/, /^seconds$/, /duration/), cDur = col(/^duration$/), cEnd = col(/end_time/);
  if (cDate < 0 || cEx < 0) return X.toast('Couldn’t find the date and exercise columns in that file.');
  const lbs = cKg >= 0 && /lb/.test(H[cKg]), byDay = {}, names = {};
  for (const r of rows.slice(1)) {
    const when = parseWhen(r[cDate]), exn = (r[cEx] || '').trim(); if (!when || !exn) continue;
    const day = byDay[when.date] = byDay[when.date] || { names: new Set(), t0: when.t, t1: null, ex: [] };
    if (cTitle >= 0 && r[cTitle]) day.names.add(r[cTitle].trim());
    if (cEnd >= 0) { const e = parseWhen(r[cEnd]); if (e) day.t1 = Math.max(day.t1 || 0, e.t); }
    let e = day.ex[day.ex.length - 1]; if (!e || e.raw !== exn) { e = { raw: exn, sets: [] }; day.ex.push(e); }
    let kg = parseFloat(String(r[cKg] || '').replace(',', '.')) || 0; if (lbs) kg = C.round(kg * 0.4536, 1);
    const reps = parseInt(r[cR], 10) || (cSec >= 0 ? parseInt(r[cSec], 10) || 0 : 0), ty = cType >= 0 ? String(r[cType] || '').toLowerCase() : '';
    e.sets.push({ kg: kg || null, r: reps || null, done: true, ...(/warm/.test(ty) ? { t: 'w' } : /drop/.test(ty) ? { t: 'd' } : /fail/.test(ty) ? { t: 'f' } : {}), ...(cRpe >= 0 && parseFloat(r[cRpe]) ? { rpe: Math.round(parseFloat(r[cRpe])) } : {}) });
    names[exn] = names[exn] || matchEx(exn);
  }
  const days = Object.keys(byDay).sort(); if (!days.length) return X.toast('No workouts found in that file.');
  X.S.trImp = { file: file.name, byDay, names, days };
  drawImport();
}
function drawImport() {
  const I = X.S.trImp; if (!I) return sheet(`<p class="hint">Export your workouts as a CSV file in Lyfta, Hevy or Strong (usually Settings → Export data), then pick the file here. Only your own account gets the data.</p><label class="btn primary block filebtn">Choose file<input type="file" id="tr-csv" accept=".csv,text/csv" hidden></label>`, 'Import history');
  const sets = I.days.reduce((a, k) => a + I.byDay[k].ex.reduce((b, e) => b + e.sets.length, 0), 0), ns = Object.entries(I.names), weak = ns.filter(([, m]) => m.sc < 0.6);
  sheet(`<div class="rec three"><div><b class="num">${I.days.length}</b><span>Workouts</span></div><div><b class="num">${sets.toLocaleString('en')}</b><span>Sets</span></div><div><b class="num">${ns.length - weak.length}/${ns.length}</b><span>Exercises matched</span></div></div>
  <p class="hint">${X.fmt(I.days[0])} – ${X.fmt(I.days[I.days.length - 1])} · ${esc(I.file)}</p>
  ${weak.length ? `<h3 class="grp">Check these (${weak.length})</h3>` : ''}<div class="card list2 flat">${weak.concat(ns.filter(([, m]) => m.sc >= 0.6)).slice(0, 80).map(([raw, m]) => `<button class="lrow exr" data-act="tr-impfix" data-v="${esc(raw)}">${m.id ? thumb(m.id) : '<span class="exthumb"></span>'}<span class="lt"><b>“${esc(raw)}”</b><small>→ ${m.id ? esc(ex(m.id).name) : 'No match, kept as your own exercise'} · tap to change</small></span>${m.sc < 0.6 ? '<span class="pill warn">Check</span>' : ''}</button>`).join('')}</div>
  <button class="btn primary block" data-act="tr-impgo">Import ${I.days.length} workouts</button><p class="hint center">Days that already have a workout here are skipped. Imported workouts don't change past streak days or league points.</p>`, 'Import history');
}
function doImport() {
  const I = X.S.trImp, t = T(); let n = 0;
  t.custom = t.custom || {};
  for (const k of I.days) {
    const day = I.byDay[k], d = X.dayDoc(k); if (d.wo && !d.wo.imported) continue;
    d.wo = { name: [...day.names].join(' + ') || 'Workout', imported: true, t0: day.t0, ...(day.t1 ? { t1: day.t1 } : {}), ex: day.ex.map(e => { const m = I.names[e.raw]; let id = m && m.sc >= 0.35 && m.id; if (!id) { id = 'x-' + norm(e.raw).replace(/ /g, '-').slice(0, 40); t.custom[id] = { name: e.raw }; } return { id, nm: e.raw !== ex(id).name ? e.raw : undefined, lo: 8, hi: 12, sets: e.sets }; }).map(e => { if (!e.nm) delete e.nm; return e; }) };
    X.saveDay(k); n++;
  }
  X.saveSettings(); X.S.trImp = null; X.closeSheet(); X.toast(`Imported ${n} workouts. Records and ranks now include them.`); X.draw();
}

/* ---------- actions ---------- */
function startWorkout(r) {
  const d = X.dayDoc(D());
  d.wo = { rid: r.id, name: r.name, t0: Date.now(), cur: 0, ex: r.ex.map(e => ({ id: e.id, ...(e.nm ? { nm: e.nm } : {}), ...(e.ss ? { ss: e.ss } : {}), lo: e.lo, hi: e.hi, sets: Array.from({ length: e.sets }, () => ({})) })) };
  X.saveDay(D()); X.toast(`${r.name} started. Tick each set as you finish it.`); X.draw(); window.scrollTo(0, 0); notifyWorking();
}
function finishWorkout() {
  const date = D(), d = X.dayDoc(date), w = d.wo; if (!w) return;
  if (!w.ex.some(e => e.sets.some(s => s.done))) { if (!confirm('No sets ticked. End this workout without saving it?')) return; delete d.wo; X.saveDay(date); RS = null; saveRS(); notifyClear(); return X.draw(); }
  w.t1 = Date.now(); w.ex.forEach(e => e.sets = e.sets.filter(s => s.done || s.kg || s.r)); w.ex = w.ex.filter(e => e.sets.length);
  const t = T() || {}, idx = t.routines ? t.routines.findIndex(r => r.id === w.rid) : -1; if (idx >= 0) { t.next = (idx + 1) % t.routines.length; X.saveSettings(); }
  if (!d.trainingDone) { d.trainingDone = true; d.trainingSource = 'workout'; }
  RS = null; overT = null; saveRS(); notifyClear(); RKC = null;
  X.saveDay(date); X.buzz([30, 40, 80]); X.draw(); openSummary(date);
}
function tickSet(i, j, fromNotif) {
  const w = active(); if (!w || !w.ex[i]) return; const e = w.ex[i], s = e.sets[j]; if (!s) return;
  const last = hist(e.id, D()).pop(), lw = last ? last.sets.filter(x => !isW(x)) : [], p = isW(s) ? null : lw[e.sets.slice(0, j).filter(x => !isW(x)).length];
  s.done = !s.done;
  const prevSet = e.sets.slice(0, j).reverse().find(x => x.done && !isW(x));
  if (s.done) { if (s.r == null || s.r === '') s.r = p ? p.r : prevSet && prevSet.r ? prevSet.r : e.lo; if ((s.kg == null || s.kg === '') && (p && p.kg || prevSet && prevSet.kg)) s.kg = p && p.kg ? p.kg : prevSet.kg; }
  X.saveDay(D()); X.buzz(12);
  const b0 = best(e.id, D()); if (s.done && beats(s, b0)) X.toast(`New record on ${exName(e)}: ${setTxt(s)}`);
  if (!s.done) { X.draw(); return; }
  // supersets: go to the partner first, rest after the last one in the group
  const G = group(w, i), partner = G.find(k => k > i && curSet(w.ex[k]) >= 0);
  if (G.length > 1 && partner != null) { X.draw(); notifyWorking(); return; }
  const more = G.some(k => curSet(w.ex[k]) >= 0);
  if (!more) { const nx = G[G.length - 1] + 1; if (nx < w.ex.length) w.cur = nx; X.saveDay(D()); }
  const anyLeft = w.ex.some(x => curSet(x) >= 0);
  if (anyLeft && s.t !== 'd') startRest(i, restFor(w.ex[G[G.length - 1]].id)); else { RS = null; saveRS(); if (anyLeft) notifyWorking(); }
  X.draw();
}
export async function act(a, v, b) {
  const S = X.S, t = T();
  switch (a) {
    case 'tr-wiz': { const [k, val] = v.split(':'); S.trWiz[k] = k === 'days' ? +val : val; if (k === 'days' || k === 'level') S.trWiz.split = null; return X.draw(); }
    case 'tr-wiznext': S.trWiz.step++; return X.draw();
    case 'tr-wizback': S.trWiz.step = Math.max(0, S.trWiz.step - 1); return X.draw();
    case 'tr-wizdone': {
      await loadDB(); const w = S.trWiz, cfg = { equip: w.equip, goal: w.goal, level: w.level, days: w.days, split: w.split || recSplit(w.days, w.level) };
      S.settings.train = { ...(t || {}), ...cfg, routines: makePlan(cfg), next: 0, cardio: (t && t.cardio) || cardioDefault(cfg.goal) };
      const wd = WEEKDAYS[SPLITS[cfg.split].days] || WEEKDAYS[3], kind = cfg.equip === 'home' ? 'cali' : 'gym', plan = { ...(S.settings.plan || C.DEFAULT_PLAN) };
      const have = Object.values(plan).filter(x => x === 'gym' || x === 'cali').length;
      if (have !== SPLITS[cfg.split].days) for (let i = 0; i < 7; i++) plan[i] = wd.includes(i) ? kind : (plan[i] === 'cardio' ? 'cardio' : i === 5 ? 'rest' : (plan[i] === 'gym' || plan[i] === 'cali' ? 'rest' : plan[i]));
      S.settings.plan = plan; S.trWiz = null; X.saveSettings(); X.toast('Your plan is ready. Training days are set in Me → Weekly training.'); return X.draw();
    }
    case 'tr-lyfta': {
      await loadDB(); S.settings.train = { ...(t || { equip: 'gym', goal: 'fat', level: 'some' }), days: 5, split: 'lyfta', routines: lyftaRoutines(), next: 0, cardio: { on: true, min: 15, mode: 'Walking_Treadmill', kind: 'z2', ...((t && t.cardio) || {}), on: true } };
      S.trWiz = null; X.saveSettings(); X.toast('ULTIMATE PPL/UL is your plan. Cardio after each workout is on.'); return X.draw();
    }
    case 'tr-redo': { if (!confirm('Make a new plan? Your workout history stays.')) return; S.trWiz = { step: 0, equip: t.equip || 'gym', goal: t.goal || 'muscle', level: t.level || 'some', days: t.days || 4, split: null }; S.settings.train = { ...t, routines: null }; X.saveSettings(); return X.draw(); }
    case 'tr-start': { await loadDB(); const r = t.routines.find(x => x.id === v) || nextRoutine(); if (wo() && wo().t1 && !wo().imported && !confirm('You already finished a workout today. Start another?')) return; return startWorkout(r); }
    case 'tr-pick': return sheet(`<div class="card list2 flat">${t.routines.map((r, i) => `<button class="lrow" data-act="tr-setnext" data-v="${r.id}"><span class="lic">${i + 1}</span><span class="lt"><b>${esc(r.name)}</b><small>${esc(focusOf(r))}</small></span></button>`).join('')}</div>`, 'Pick today’s workout');
    case 'tr-setnext': t.next = t.routines.findIndex(r => r.id === v); X.saveSettings(); X.closeSheet(); return X.draw();
    case 'tr-go': { const w = active(); w.cur = +v; X.saveDay(D()); X.draw(); window.scrollTo(0, 0); return; }
    case 'tr-set': { const [i, j] = v.split(':').map(Number); return tickSet(i, j); }
    case 'tr-rest': {
      if (v === 'close') { clearTimeout(overT); overT = null; notifyWorking(); return X.draw(); }
      if (v === 'skip') return restDone(true);
      if (v === 'cancel') { RS = null; saveRS(); return X.draw(); }
      if (v === 'holdstop') { const w = active(), secs = Math.floor((Date.now() - RS.start) / 1000), e = w.ex[RS.ex], j = curSet(e); RS = null; saveRS(); if (j >= 0) { e.sets[j].r = secs; X.saveDay(D()); tickSet(w.ex.indexOf(e), j); } return X.draw(); }
      if (RS) { RS.end += (+v) * 1000; RS.total = Math.max(1, RS.total + (+v)); saveRS(); notifyRest(); if (restLeft() <= 0) return restDone(true); }
      return X.draw();
    }
    case 'tr-restpick': return openRestPick(v);
    case 'tr-rv': S.trRest.v = +v; return drawRestPick();
    case 'tr-rall': S.trRest.all = v === '1'; return drawRestPick();
    case 'tr-rsave': { const r = S.trRest; if (r.all || r.id === '*') { t.restDefault = r.v; if (r.id !== '*' && t.restBy) delete t.restBy[r.id]; } else t.restBy = { ...(t.restBy || {}), [r.id]: r.v }; X.saveSettings(); X.closeSheet(); X.toast(`Rest set to ${r.v ? mmss(r.v) : 'off'}${r.all || r.id === '*' ? ' for all exercises' : ''}.`); return X.draw(); }
    case 'tr-smenu': { const [i, j] = v.split(':').map(Number); return openSetMenu(i, j); }
    case 'tr-stype': { const [i, j] = S.trSM, s = active().ex[i].sets[j]; if (v) s.t = v; else delete s.t; X.saveDay(D()); X.closeSheet(); return X.draw(); }
    case 'tr-rpe': { const [i, j] = S.trSM, s = active().ex[i].sets[j]; s.rpe = s.rpe === +v ? undefined : +v; if (!s.rpe) delete s.rpe; X.saveDay(D()); X.closeSheet(); return X.draw(); }
    case 'tr-rmset': { const [i, j] = S.trSM, e = active().ex[i]; e.sets.splice(j, 1); X.saveDay(D()); X.closeSheet(); return X.draw(); }
    case 'tr-addset': { const e = active().ex[+v], l = [...e.sets].reverse().find(s => !isW(s)) || {}; e.sets.push(l.kg != null ? { kg: l.kg } : {}); X.saveDay(D()); return X.draw(); }
    case 'tr-rmex': { const w = active(); if (!confirm(`Remove ${exName(w.ex[+v])} from this workout?`)) return; w.ex.splice(+v, 1); w.cur = Math.max(0, Math.min(w.cur, w.ex.length - 1)); X.saveDay(D()); return X.draw(); }
    case 'tr-hold': { const e = active().ex[+v]; RS = { hold: true, start: Date.now(), total: e.hi, ex: +v }; saveRS(); return X.draw(); }
    case 'tr-warm': S.trWarm = null; return openWarm(+v);
    case 'tr-wkg': S.trWarm.kg = Math.max(0, +v); return openWarm(S.trWarm.i);
    case 'tr-addwarm': { const e = active().ex[+v]; e.sets.unshift(...S.trWarmSteps.map(s => ({ t: 'w', kg: s.kg, r: s.r }))); const fw = e.sets.find(s => !isW(s)); if (fw && fw.kg == null) fw.kg = S.trWarm.kg; X.saveDay(D()); X.closeSheet(); X.toast(`${S.trWarmSteps.length} warm-up sets added.`); return X.draw(); }
    case 'tr-note': return openNote(v);
    case 'tr-swap': await loadDB(); return openSwap(+v);
    case 'tr-swapto': { const w = active(), e = w.ex[S.trSwap]; e.id = v; delete e.nm; e.sets.forEach(s => { delete s.kg; }); X.saveDay(D()); X.closeSheet(); X.toast(`Swapped to ${ex(v).name}.`); return X.draw(); }
    case 'tr-exinfo': case 'tr-how': return openExercise(v);
    case 'tr-chart': { const [m, id] = v.split(':'); S.trChart = m; return openExercise(id); }
    case 'tr-flip': b.classList.toggle('flip'); return;
    case 'tr-add': return openLibPick('wo');
    case 'tr-eadd': return openLibPick('edit');
    case 'tr-pickex': {
      if (S.trImpFix) { S.trImp.names[S.trImpFix] = { id: v, sc: 1 }; S.trImpFix = null; S.trPick = null; return drawImport(); }
      if (S.trPick === 'edit' && S.trEdit) { const x = ex(v), iso = x.mech === 'isolation'; S.trEdit.ex.push({ id: v, sets: 3, lo: isTimed(v) ? 20 : iso ? 10 : 8, hi: isTimed(v) ? 45 : iso ? 15 : 12 }); S.trPick = null; return drawEdit(); }
      const w = active(); if (!w) return X.closeSheet();
      const x = ex(v), iso = x.mech === 'isolation'; w.ex.push({ id: v, lo: iso ? 10 : 8, hi: iso ? 15 : 12, sets: [{}, {}, {}] }); w.cur = w.ex.length - 1; S.trPick = null; X.saveDay(D()); X.closeSheet(); return X.draw();
    }
    case 'tr-fm': { S.trLib.m = v; const el = $('tr-res'); if (el) { el.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-exinfo'); document.querySelectorAll('[data-act="tr-fm"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v)); } return; }
    case 'tr-finish': return finishWorkout();
    case 'tr-summary': return openSummary(v || D());
    case 'tr-wmenu': return openWMenu(v);
    case 'tr-wedit': return openWEdit(v);
    case 'tr-wesrm': { const [dt, i, j] = v.split(':'), w = S.days[dt].wo; w.ex[+i].sets.splice(+j, 1); if (!w.ex[+i].sets.length) w.ex.splice(+i, 1); X.saveDay(dt); return openWEdit(dt); }
    case 'tr-wdel': {
      if (S.trDel !== v) { S.trDel = v; if (b) b.textContent = 'Tap again to delete'; return; }
      const d = S.days[v], w = d.wo; S.trDel = null;
      const ri = t.routines ? t.routines.findIndex(r => r.id === w.rid) : -1; if (ri >= 0 && t.next === (ri + 1) % t.routines.length) t.next = ri;
      delete d.wo; if (d.trainingSource === 'workout') { d.trainingDone = false; d.trainingSource = null; }
      X.saveDay(v); X.saveSettings(); X.closeSheet(); X.toast('Workout deleted.'); return X.draw();
    }
    case 'tr-cardio': { const r = t.routines && t.routines.find(x => x.id === (wo() || {}).rid); return sheet(cardioBlock(t.cardio, r && r.cd), 'Cardio after lifting'); }
    case 'tr-cdlog': {
      const [min, mode] = v.split(':'), d = X.dayDoc(D()), m = CARDIO.find(c => c[0] === mode) || CARDIO[0];
      d.stamina.push({ mode: m[1], min: +min, kind: t.cardio.kind === 'int' ? 'intervals' : 'easy', src: 'finisher' }); X.saveDay(D()); X.closeSheet(); X.toast(`${min} min of cardio logged.`); return X.draw();
    }
    case 'tr-cdon': t.cardio = { ...(t.cardio || cardioDefault(t.goal)), on: v === '1' }; X.saveSettings(); return X.draw();
    case 'tr-notif': t.notif = v === '1'; X.saveSettings(); if (t.notif && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) { } } return X.draw();
    case 'tr-edit': await loadDB(); return openEdit(v);
    case 'tr-new': await loadDB(); return openEdit('new');
    case 'tr-eup': { const r = S.trEdit, i = +v; if (i > 0) [r.ex[i - 1], r.ex[i]] = [r.ex[i], r.ex[i - 1]]; return drawEdit(); }
    case 'tr-erm': S.trEdit.ex.splice(+v, 1); return drawEdit();
    case 'tr-elink': { const r = S.trEdit, i = +v, a1 = r.ex[i], a2 = r.ex[i + 1]; if (a1.ss && a2.ss === a1.ss) { delete a2.ss; if (!(r.ex[i - 1] && r.ex[i - 1].ss === a1.ss)) delete a1.ss; } else { const g = a1.ss || a2.ss || 'S' + Math.random().toString(36).slice(2, 5); a1.ss = g; a2.ss = g; } return drawEdit(); }
    case 'tr-esave': { const r = S.trEdit; if (!r.ex.length) return X.toast('Add at least one exercise.'); const i = t.routines.findIndex(x => x.id === r.id); if (i >= 0) t.routines[i] = r; else t.routines.push(r); S.trEdit = null; X.saveSettings(); X.closeSheet(); X.toast('Workout saved.'); return X.draw(); }
    case 'tr-edel': { if (t.routines.length < 2) return X.toast('Keep at least one workout in your plan.'); if (!confirm('Delete this workout from your plan?')) return; t.routines = t.routines.filter(x => x.id !== S.trEdit.id); t.next = 0; S.trEdit = null; X.saveSettings(); X.closeSheet(); return X.draw(); }
    case 'tr-rank': return openRank();
    case 'tr-muscle': return openMuscle(v, ...(MUSW || [X.today(), X.today()]));
    case 'tr-import': await loadDB(); S.trImp = null; return drawImport();
    case 'tr-impfix': S.trImpFix = v; return openLibPick('imp');
    case 'tr-impgo': return doImport();
  }
}
export function input(el) {
  const S = X.S;
  if (el.dataset.wo) {
    const [i, j, f] = el.dataset.wo.split(':'), w = active(); if (!w) return true;
    const val = el.value === '' ? null : Math.max(0, parseFloat(el.value) || 0);
    w.ex[+i].sets[+j][f] = val; X.saveDay(D()); return true;
  }
  if (el.dataset.woe) { const [dt, i, j, f] = el.dataset.woe.split(':'), s = S.days[dt].wo.ex[+i].sets[+j]; s[f] = el.value === '' ? null : Math.max(0, parseFloat(el.value) || 0); X.saveDay(dt); return true; }
  if (el.dataset.tre) { const [i, f] = el.dataset.tre.split(':'); S.trEdit.ex[+i][f] = Math.max(1, parseInt(el.value, 10) || 1); return true; }
  if (el.dataset.trnote) { const t = T(); t.notes = { ...(t.notes || {}), [el.dataset.trnote]: el.value.slice(0, 140) }; if (!t.notes[el.dataset.trnote]) delete t.notes[el.dataset.trnote]; X.saveSettings(); return true; }
  if (el.id === 'tr-wkg') { S.trWarm.kg = Math.max(0, parseFloat(el.value) || 0); return true; }
  if (el.id === 'tr-rname') { S.trEdit.name = el.value.slice(0, 40) || 'My workout'; return true; }
  if (el.id === 'tr-q') { S.trLib = S.trLib || { q: '', m: '', e: '' }; S.trLib.q = el.value; const r = $('tr-res'); if (r && DB) r.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-exinfo'); return true; }
  return false;
}
export function change(el) {
  const S = X.S;
  if (el.id === 'tr-fe') { S.trLib.e = el.value; const r = $('tr-res'); if (r) r.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-exinfo'); return true; }
  if (el.id === 'tr-wkg') { setTimeout(() => openWarm(S.trWarm.i), 0); return true; }
  if (el.dataset.trbar) { T().bar = +el.value; X.saveSettings(); setTimeout(() => openWarm(S.trWarm.i), 0); return true; }
  if (el.id === 'tr-csv') { const f = el.files && el.files[0]; if (f) readImport(f).catch(() => X.toast('Couldn’t read that file.')); return true; }
  if (el.dataset.trc) { const t = T(), k = el.dataset.trc; t.cardio[k] = k === 'min' ? +el.value : el.value; X.saveSettings(); return true; }
  return false;
}
export function todayLine() { const t = T(), d = X.S.days[D()] || {}; if (CA() && C.trainType(X.S.settings, D()) === 'cali') { if (d.wo && d.wo.t1 && isCaliW(d.wo)) return { done: true, name: 'Calisthenics' }; if (active()) return { live: true, name: active().name }; return { name: 'Calisthenics', n: caliSession().length, cali: true }; } if (!t || !t.routines) return null; if (d.wo && d.wo.t1 && !d.wo.imported) return { done: true, name: d.wo.name }; if (active()) return { live: true, name: active().name }; const r = nextRoutine(); return r ? { name: r.name, n: r.ex.length } : null; }
// month stats for the monthly report
export function monthStats(from, to) {
  let wos = 0, vol = 0, recs = [], cmin = 0;
  for (const k of sessions()) { if (k < from || k > to) continue; const w = X.S.days[k].wo; wos++; vol += woStats(w).vol; if (!w.imported) w.ex.forEach(e => { const top = bestSet((e.sets || []).filter(s => s.done)), b0 = best(e.id, k); if (top && beats(top, b0)) recs.push({ name: exName(e), s: top, k }); }); }
  for (let d = from; d <= to; d = C.addDays(d, 1)) { const x = X.S.days[d]; if (!x) continue; (x.stamina || []).forEach(s => cmin += s.min || 0); (x.sports || []).forEach(s => cmin += s.min || 0); }
  const { sets } = muscleSets(from, to), major = ['chest', 'lats', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'calves', 'abdominals'].map(m => [m, sets[m] || 0]).sort((a, b) => b[1] - a[1]);
  const best3 = recs.sort((a, b) => e1rm(b.s) - e1rm(a.s)).filter((r, i, a) => a.findIndex(z => z.name === r.name) === i).slice(0, 3);
  return { wos, vol, recs: recs.length, best3: best3.map(r => `${r.name} ${setTxt(r.s)}`), cmin, most: major.slice(0, 3).filter(m => m[1]).map(m => musL(m[0])), least: major.slice(-2).map(m => musL(m[0])) };
}
export { ex as exInfo, MUS_L, EQ_L, TIER_C };

/* =====================================================================
   Calisthenics: skill paths, a Recommended-Routine style session, level-ups, placement test
   ===================================================================== */
const S_ = (id, sets, lo, hi, extra = {}) => ({ id, sets, lo, hi, ...extra });
const cx = (id, name, ph, pm, hold) => { CX[id] = { name, ph, pm, hold: !!hold }; return id; };
export const PATHS = {
  pull: { name: 'Pull', kind: 's', steps: [S_(cx('cx-hang', 'Dead hang + scap pulls', 'Scapular_Pull-Up', ['lats'], 1), 3, 20, 40), S_(cx('cx-negpull', 'Negative pull-up (5 s down)', 'Pullups', ['lats', 'biceps']), 3, 3, 5), S_('Band_Assisted_Pull-Up', 3, 5, 8), S_('Pullups', 3, 5, 8), S_(cx('cx-lpull', 'L-sit pull-up', null, ['lats', 'abdominals']), 3, 5, 8), S_(cx('cx-archpull', 'Archer pull-up', null, ['lats']), 3, 3, 5), S_(cx('cx-oapneg', 'One-arm pull-up negative', null, ['lats', 'biceps']), 3, 1, 3)] },
  dip: { name: 'Dip', kind: 's', steps: [S_('Bench_Dips', 3, 8, 12), S_(cx('cx-negdip', 'Negative dip (5 s down)', 'Parallel_Bar_Dip', ['chest', 'triceps']), 3, 3, 5), S_('Parallel_Bar_Dip', 3, 5, 8), S_('Ring_Dips', 3, 5, 8), S_(cx('cx-wdip', 'Weighted dip', 'Dips_-_Chest_Version', ['chest', 'triceps']), 3, 5, 8)] },
  legs: { name: 'Legs', kind: 's', steps: [S_('Bodyweight_Squat', 3, 10, 20), S_('Split_Squats', 3, 8, 12), S_(cx('cx-bss', 'Bulgarian split squat', 'Split_Squats', ['quadriceps', 'glutes']), 3, 8, 12), S_('Freehand_Jump_Squat', 3, 8, 12), S_(cx('cx-shrimp', 'Shrimp squat', null, ['quadriceps', 'glutes']), 3, 5, 8), S_(cx('cx-pistol', 'Pistol squat', null, ['quadriceps', 'glutes']), 3, 5, 8)] },
  hinge: { name: 'Hinge', kind: 's', steps: [S_(cx('cx-bridge', 'Glute bridge', 'Butt_Lift_Bridge', ['glutes', 'hamstrings']), 3, 10, 15), S_('Single_Leg_Glute_Bridge', 3, 8, 12), S_('Hyperextensions_With_No_Hyperextension_Bench', 3, 8, 12), S_(cx('cx-nordneg', 'Nordic curl negative', null, ['hamstrings']), 3, 3, 5), S_(cx('cx-nordic', 'Nordic curl', null, ['hamstrings']), 3, 3, 5)] },
  push: { name: 'Push', kind: 's', steps: [S_('Incline_Push-Up', 3, 8, 12), S_('Pushups', 3, 8, 12), S_(cx('cx-diamond', 'Diamond push-up', 'Push-Ups_-_Close_Triceps_Position', ['chest', 'triceps']), 3, 5, 8), S_('Decline_Push-Up', 3, 5, 8), S_(cx('cx-ppp', 'Pseudo planche push-up', null, ['chest', 'shoulders']), 3, 5, 8), S_(cx('cx-archpush', 'Archer push-up (each side)', null, ['chest']), 3, 4, 6), S_(cx('cx-oap', 'One-arm push-up', null, ['chest', 'triceps']), 3, 1, 5)] },
  row: { name: 'Row', kind: 's', steps: [S_(cx('cx-incrow', 'Incline row (high bar)', 'Inverted_Row', ['middle back', 'lats']), 3, 8, 12), S_('Inverted_Row', 3, 8, 12), S_(cx('cx-ringrow', 'Ring row', 'Inverted_Row_with_Straps', ['middle back', 'lats']), 3, 8, 12), S_(cx('cx-archrow', 'Archer row (each side)', null, ['middle back', 'lats']), 3, 4, 6), S_(cx('cx-tflrow', 'Tuck front lever row', null, ['lats', 'middle back']), 3, 3, 5)] },
  core: { name: 'Core', kind: 's', steps: [S_('Plank', 3, 30, 60), S_('Side_Bridge', 3, 20, 40), S_(cx('cx-hollow', 'Hollow body hold', null, ['abdominals'], 1), 3, 15, 30), S_(cx('cx-hkr', 'Hanging knee raise', 'Hanging_Leg_Raise', ['abdominals']), 3, 8, 12), S_('Hanging_Leg_Raise', 3, 5, 10), S_(cx('cx-dflag', 'Dragon flag negative', null, ['abdominals']), 3, 3, 5)] },
  handstand: { name: 'Handstand', kind: 'k', steps: [S_(cx('cx-wallplank', 'Wall plank (feet on wall)', null, ['shoulders'], 1), 3, 20, 40), S_(cx('cx-c2w', 'Chest-to-wall handstand', null, ['shoulders'], 1), 3, 20, 45), S_(cx('cx-kick', 'Kick-up to freestanding (attempts)', null, ['shoulders']), 3, 5, 10), S_(cx('cx-free', 'Freestanding handstand', null, ['shoulders'], 1), 3, 10, 30), S_(cx('cx-hspu', 'Wall handstand push-up', 'Handstand_Push-Ups', ['shoulders', 'triceps']), 3, 3, 5)] },
  lsit: { name: 'L-sit', kind: 'k', steps: [S_(cx('cx-supl', 'Foot-supported L-sit', null, ['abdominals'], 1), 3, 10, 20), S_(cx('cx-tuckl', 'Tuck L-sit', null, ['abdominals'], 1), 3, 10, 20), S_(cx('cx-onel', 'One-leg L-sit', null, ['abdominals'], 1), 3, 10, 20), S_(cx('cx-lsit', 'L-sit', null, ['abdominals'], 1), 3, 10, 20), S_(cx('cx-vsit', 'V-sit', null, ['abdominals'], 1), 3, 5, 10)] },
  flever: { name: 'Front lever', kind: 'k', steps: [S_(cx('cx-tfl', 'Tuck front lever', null, ['lats'], 1), 3, 8, 15), S_(cx('cx-atfl', 'Advanced tuck front lever', null, ['lats'], 1), 3, 8, 15), S_(cx('cx-olfl', 'One-leg front lever', null, ['lats'], 1), 3, 6, 12), S_(cx('cx-sfl', 'Straddle front lever', null, ['lats'], 1), 3, 5, 10), S_(cx('cx-ffl', 'Front lever', null, ['lats'], 1), 3, 3, 8)] },
  planche: { name: 'Planche', kind: 'k', steps: [S_(cx('cx-plean', 'Planche lean', null, ['shoulders'], 1), 3, 15, 30), S_(cx('cx-frog', 'Frog stand', null, ['shoulders'], 1), 3, 15, 30), S_(cx('cx-tpl', 'Tuck planche', null, ['shoulders'], 1), 3, 8, 15), S_(cx('cx-atpl', 'Advanced tuck planche', null, ['shoulders'], 1), 3, 8, 15), S_(cx('cx-spl', 'Straddle planche', null, ['shoulders'], 1), 3, 5, 10)] },
  muscleup: { name: 'Muscle-up', kind: 'k', steps: [S_(cx('cx-hipull', 'Explosive high pull-up', 'Pullups', ['lats']), 3, 3, 5), S_(cx('cx-c2b', 'Chest-to-bar pull-up', 'Pullups', ['lats']), 3, 3, 5), S_(cx('cx-muneg', 'Muscle-up negative', 'Muscle_Up', ['lats', 'triceps']), 3, 2, 3), S_('Kipping_Muscle_Up', 3, 1, 3), S_(cx('cx-mu', 'Strict muscle-up', 'Muscle_Up', ['lats', 'triceps']), 3, 1, 3)] }
};
const STRENGTH_P = ['pull', 'dip', 'legs', 'hinge', 'push', 'row', 'core'], SKILL_P = ['handstand', 'lsit', 'flever', 'planche', 'muscleup'];
const PAIRS = [['pull', 'dip'], ['legs', 'hinge'], ['push', 'row']];
const CA = () => X.S.settings.cali;
const atStep = p => Math.min((CA().at || {})[p] || 0, PATHS[p].steps.length - 1);
const ytURL = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' calisthenics tutorial form')}`;
const stepName = st => ex(st.id).name;
const targetTxt = st => `${st.sets} × ${st.lo === st.hi ? st.lo : st.lo + '–' + st.hi}${isTimed(st.id) ? ' s' : ''}`;
const isCaliW = w => w && w.rid === 'cali';
function stepBest(st) { const b = hist(st.id).flatMap(h => h.sets.filter(s => !isW(s))).reduce((a, s) => Math.max(a, s.r || 0), 0); return b || null; }
function nodesHTML(p) {
  const n = PATHS[p].steps.length, at = atStep(p);
  return `<div class="nodes">${PATHS[p].steps.map((s, i) => `${i ? `<span class="ln${i <= at ? ' ok' : ''}"></span>` : ''}<span class="nd${i < at ? ' ok' : i === at ? ' cur' : ''}">${i + 1}</span>`).join('')}</div>`;
}
function caliTabHTML() {
  const S = X.S;
  if (!CA()) return `<section class="card trsetup"><span class="sub">Calisthenics</span><h3>Skill paths with your bodyweight</h3><p class="hint">Push, pull, legs and core, each as a path of steps from easy to hard, plus skills like handstand, L-sit, front lever, planche and muscle-up. You move up a step when you hit the top of the range on every set.</p>
  <button class="btn primary block" data-act="ca-test">Take the 5-minute placement test</button><button class="btn block" data-act="ca-start1">Start everything at step 1</button></section>`;
  const sess = caliSession(), mins = 10 + sess.length * 5;
  let h = `<section class="cahero"><span class="sub">${esc(X.today() === D() ? 'Today' : 'Yesterday')}</span><h3>Calisthenics session · about ${mins} min</h3><div class="chipr">${PAIRS.map(([a, b]) => `<span>${esc(PATHS[a].name)} + ${esc(PATHS[b].name)}</span>`).join('')}<span>Core</span>${(CA().skills || []).map(k => `<span>${esc(PATHS[k].name)}</span>`).join('')}</div><button class="btn block gold" data-act="ca-go">Start session</button></section>`;
  h += `<section class="card"><div class="spread"><h2 style="margin:0">Your skill paths</h2><button class="btn small ghost" data-act="ca-test">Retest</button></div>
  ${[...STRENGTH_P, ...(CA().skills || [])].map(p => { const st = PATHS[p].steps[atStep(p)]; return `<button class="path" data-act="ca-path" data-v="${p}"><span class="ph2"><b>${esc(PATHS[p].name)}</b><small>step ${atStep(p) + 1} of ${PATHS[p].steps.length}${PATHS[p].kind === 'k' ? ' · skill' : ''}</small></span>${nodesHTML(p)}<span class="curname">Now: <b>${esc(stepName(st))}</b> · ${targetTxt(st)}</span></button>`; }).join('')}
  ${SKILL_P.filter(k => !(CA().skills || []).includes(k)).length ? `<p class="hint" style="margin-top:10px">Add a skill path</p><div class="chips">${SKILL_P.filter(k => !(CA().skills || []).includes(k)).map(k => `<button data-act="ca-addskill" data-v="${k}">+ ${esc(PATHS[k].name)}</button>`).join('')}</div>` : ''}</section>`;
  return h;
}
function caliSession() {
  const out = [], push = (p, ss) => { const i = atStep(p), st = PATHS[p].steps[i]; out.push({ id: st.id, sets: st.sets, lo: st.lo, hi: st.hi, cp: p, cs: i, ...(ss ? { ss } : {}) }); };
  (CA().skills || []).forEach(k => push(k));
  PAIRS.forEach(([a, b], gi) => { push(a, 'P' + gi); push(b, 'P' + gi); });
  push('core');
  return out;
}
function startCali() {
  if (!X.S.settings.train) { X.S.settings.train = { routines: null, cardio: cardioDefault('fit') }; X.saveSettings(); }
  const d = X.dayDoc(D()), list = caliSession();
  d.wo = { rid: 'cali', name: 'Calisthenics', t0: Date.now(), cur: 0, ex: list.map(e => ({ id: e.id, lo: e.lo, hi: e.hi, cp: e.cp, cs: e.cs, ...(e.ss ? { ss: e.ss } : {}), sets: Array.from({ length: e.sets }, () => ({})) })) };
  X.saveDay(D()); X.toast('Calisthenics session started. Warm up for 5 minutes first: joint circles, scap shrugs, hollow rocks.'); X.draw(); window.scrollTo(0, 0); notifyWorking();
}
// shown inside the exercise card when a path step was beaten
function levelUpHTML(e) {
  if (!e.cp || !CA()) return '';
  const work = e.sets.filter(s => !isW(s)); if (!work.length || !work.every(s => s.done && (s.r || 0) >= e.hi)) return '';
  const P = PATHS[e.cp], at = atStep(e.cp);
  if (at !== e.cs) return at > e.cs ? `<div class="lvup"><b>⬆ Moved up to step ${at + 1}</b><small>${esc(stepName(P.steps[at]))} from next session.</small></div>` : '';
  if (e.cs >= P.steps.length - 1) return `<div class="lvup"><b>🏆 ${esc(P.name)} path complete</b><small>You hit the final step. Add reps or a harder variation.</small></div>`;
  const nx = P.steps[e.cs + 1];
  return `<div class="lvup"><b>⬆ Step ${e.cs + 2} unlocked: ${esc(stepName(nx))}</b><small>You hit ${targetTxt({ ...nx, sets: work.length, lo: e.hi, hi: e.hi, id: e.id })}. Move up for next session, or keep this step a little longer.</small><div class="row"><button class="btn small white" data-act="ca-up" data-v="${e.cp}:${e.cs + 1}">Move up</button><button class="btn small clear" data-act="ca-stay">Stay for now</button></div></div>`;
}
function openPath(p) {
  const P = PATHS[p], at = atStep(p);
  sheet(`<p class="hint">${P.kind === 'k' ? 'A skill path. Practise it at the start of the session while you are fresh.' : 'Unlock each step by hitting the top of the range on every set.'}</p>
  <div class="card list2 flat steps">${P.steps.map((st, i) => { const x = ex(st.id), b = stepBest(st); return `<div class="step${i === at ? ' cur' : ''}"><span class="nd${i < at ? ' ok' : i === at ? ' cur' : ''}">${i + 1}</span>${x.img ? `<span class="sph${i > at ? ' lock' : ''}">${thumb(st.id)}</span>` : `<span class="sph none">no photo</span>`}<span class="lt"><b>${esc(x.name)}</b><small>${targetTxt(st)}${b ? ` · best ${b}${isTimed(st.id) ? ' s' : ''}` : ''}${i < at ? ' · done' : ''}</small><span class="row">${x.img ? `<button class="link" data-act="tr-exinfo" data-v="${st.id}">How to</button>` : ''}<a class="link" href="${ytURL(x.name)}" target="_blank" rel="noopener">▶ Form video</a>${i !== at ? `<button class="link" data-act="ca-set" data-v="${p}:${i}">Make this my step</button>` : ''}</span></span></div>`; }).join('')}</div>
  ${P.kind === 'k' ? `<button class="btn block ghost danger" data-act="ca-rmskill" data-v="${p}">Remove this path</button>` : ''}`, `${P.name} path`);
}
function openTest() {
  const f = (id, l, ph) => `<label class="tst"><span><b>${l}</b><small>${ph}</small></span><input class="in num" id="${id}" type="number" inputmode="numeric" min="0" placeholder="0"></label>`;
  sheet(`<p class="hint">Do each one once, as many good reps as you can (or hold as long as you can), resting 2 minutes between. Leave a box empty if you can't do it.</p>
  ${f('ct-push', 'Push-ups', 'max reps, chest to fist height')}${f('ct-pull', 'Pull-ups', 'max reps, chin over bar')}${f('ct-row', 'Inverted rows', 'only if you got 0 pull-ups')}${f('ct-dip', 'Dips', 'max reps on bars or chairs')}${f('ct-squat', 'Squats', 'max reps, thighs parallel')}${f('ct-plank', 'Plank', 'max seconds')}${f('ct-hang', 'Dead hang', 'max seconds')}
  <button class="btn primary block" data-act="ca-place">Place me on every path</button>`, 'Placement test');
}
function place() {
  const v = id => parseInt(($(id) || {}).value, 10) || 0, pu = v('ct-push'), pl = v('ct-pull'), rw = v('ct-row'), dp = v('ct-dip'), sq = v('ct-squat'), pk = v('ct-plank'), hg = v('ct-hang');
  const at = {
    push: pu === 0 ? 0 : pu < 10 ? 1 : pu < 20 ? 2 : pu < 30 ? 3 : 4,
    pull: pl === 0 ? (hg < 20 ? 0 : rw >= 8 ? 2 : 1) : pl < 5 ? 3 : pl < 10 ? 3 : pl < 15 ? 4 : 5,
    dip: dp === 0 ? 0 : dp < 5 ? 1 : dp < 12 ? 2 : 3,
    row: pl >= 5 ? 2 : rw >= 8 || pl > 0 ? 1 : 0,
    legs: sq < 20 ? 0 : sq < 40 ? 1 : 2,
    hinge: sq >= 40 ? 1 : 0,
    core: pk < 30 ? 0 : pk < 60 ? 1 : 2
  };
  X.S.settings.cali = { ...(CA() || {}), at, skills: (CA() && CA().skills) || [], placed: X.today() };
  X.saveSettings(); X.closeSheet(); X.toast('Placed on every path. Your first session is ready.'); X.draw();
}
export async function caliAct(a, v) {
  const S = X.S;
  switch (a) {
    case 'ca-test': return openTest();
    case 'ca-place': return place();
    case 'ca-start1': S.settings.cali = { at: {}, skills: [], placed: X.today() }; X.saveSettings(); return X.draw();
    case 'ca-go': { await loadDB(); if (active() && !confirm(`Finish or end “${active().name}” first? This replaces it.`)) return; return startCali(); }
    case 'ca-path': return openPath(v);
    case 'ca-set': { const [p, i] = v.split(':'); CA().at = { ...(CA().at || {}), [p]: +i }; X.saveSettings(); X.toast(`${PATHS[p].name}: step ${+i + 1}.`); openPath(p); return X.draw(); }
    case 'ca-addskill': CA().skills = [...new Set([...(CA().skills || []), v])]; X.saveSettings(); X.toast(`${PATHS[v].name} added. It goes at the start of each session.`); return X.draw();
    case 'ca-rmskill': CA().skills = (CA().skills || []).filter(k => k !== v); X.saveSettings(); X.closeSheet(); return X.draw();
    case 'ca-up': { const [p, i] = v.split(':'); CA().at = { ...(CA().at || {}), [p]: +i }; X.saveSettings(); X.buzz([30, 40, 80]); X.toast(`Step ${+i + 1}: ${stepName(PATHS[p].steps[+i])}. Next session uses it.`); return X.draw(); }
    case 'ca-stay': X.toast('Staying on this step. Aim for clean reps.'); return;
  }
}

/* =====================================================================
   Ranks page: every rank, what it takes at your bodyweight, friends
   ===================================================================== */
const TSTART = [0, 150, 300, 450, 600, 750, 900], TRANGE = ['0–149', '150–299', '300–449', '450–599', '600–749', '750–899', '900+'];
const TDESC = ['Just started. Log any main lift.', 'Beginner. Usually the first months of training.', 'Novice. Consistent training for a while.', 'Intermediate. Usually 1–2 years of steady training.', 'Advanced-intermediate. Usually 2–4 years of steady training.', 'Advanced. Years of focused training.', 'Elite. Competitive-level strength.'];
function ratioAt(score, lv) { const A = [0, ...ANCH], R = [0, ...lv]; if (score >= 950) return lv[4] * (1 + 0.15 * (score - 950) / 100); for (let k = 1; k < A.length; k++) if (score <= A[k]) return R[k - 1] + (R[k] - R[k - 1]) * (score - A[k - 1]) / (A[k] - A[k - 1]); return lv[4]; }
let RKC = null;
const rankNow = () => { if (!RKC || Date.now() - RKC.t > 1500) RKC = { t: Date.now(), r: rankOf() }; return RKC.r; };
export function rankChip() { const rk = X && X.S.settings && rankNow(); return rk ? `<button class="rkchip" data-act="tr-rank" style="--tc:${TIER_C[rk.ti]}" aria-label="Strength rank ${esc(rk.name)}">${miniShield(rk.ti)}<span>${esc(rk.name)}</span></button>` : ''; }
export function rankRow() { const rk = rankNow(); return `<button class="lrow" data-act="tr-rank"><span class="lic rk" style="background:${rk ? TIER_C[rk.ti] : 'var(--surface-2)'}">${miniShield(rk ? rk.ti : 0, 16)}</span><span class="lt"><b>Strength rank${rk ? ': ' + esc(rk.name) : ''}</b><small>${rk ? (rk.next ? `${rk.next} points to the next step · ${rk.lifts} lifts ranked` : 'Top rank') : 'Log a main lift to get ranked'}</small></span><span class="le">›</span></button>`; }
const miniShield = (ti, s = 15) => `<svg width="${s}" height="${s * 1.12}" viewBox="0 0 96 108" aria-hidden="true"><path d="M48 4l40 16v34c0 26-18 42-40 50C26 96 8 80 8 54V20z" fill="${ti == null ? '#C5CDDB' : TIER_C[ti]}" stroke="#fff" stroke-width="6"/></svg>`;
function needsFor(ti) {
  const bwKg = X.curWeight() || X.S.settings.startWeight || 80, fem = X.S.settings.sex === 'f', rk = rankNow(), mine = {};
  (rk ? rk.list : []).forEach(l => mine[l.k] = l);
  const sc = TSTART[ti] || 1;
  return ['bench', 'squat', 'dead', 'ohp', 'row', 'pulldown', 'legpress', 'dbbench', 'dbsp', 'pullup', 'dips', 'pushup'].map(k => { const [name, , m, f, reps] = STD[k], r = ratioAt(sc, fem ? f : m), need = reps ? Math.max(1, Math.round(r)) : Math.round(r * bwKg / 2.5) * 2.5, me = mine[k], you = me ? (reps ? me.reps : me.e1) : null; return { name, need, reps, you, ok: you != null && you >= need }; });
}
function openRank(tab, tier) {
  const S = X.S; S.rkTab = tab || S.rkTab || 'all';
  const rk = rankNow(), t = S.rkTab;
  if (tier != null) {
    const bw = X.curWeight() || S.settings.startWeight || 80;
    return sheet(`<div class="tierhd">${badgeSVG({ ti: tier, name: TIERS[tier] }, 58)}<div><p class="hint">Score ${TRANGE[tier]} · ${esc(TDESC[tier])}</p></div></div>
    <p class="hint" style="margin:12px 0 4px;font-weight:700;color:var(--ink)">What ${esc(TIERS[tier])} needs at ${C.round(bw, 1)} kg bodyweight</p>
    <div class="needs">${needsFor(tier).map(n => `<div class="need"><span>${esc(n.name)}</span><span class="sub">${n.you != null ? `you ${n.you}` : '—'}</span><b class="${n.ok ? 'up' : n.you != null ? 'dn' : ''}">${n.ok ? '✓ ' : ''}${n.need}${n.reps ? ' reps' : ' kg'}</b></div>`).join('')}</div>
    <p class="hint" style="margin-top:10px">Weights are estimated 1-rep maxes. Your overall rank is the average of the lifts you have logged, so adding lifts you are good at counts too.</p>
    <button class="btn block" data-act="rk-tab" data-v="all">‹ All ranks</button>`, TIERS[tier]);
  }
  const head = rk ? `<div class="rkhead">${badgeSVG(rk, 74)}<h3>${esc(rk.name)}</h3><p class="hint">Score ${rk.score} of 1,000 · average of ${rk.lifts} lift${rk.lifts > 1 ? 's' : ''}</p><div class="rkbar"><i style="width:${Math.min(100, (rk.score - TSTART[rk.ti]) / 150 * 100)}%;background:${TIER_C[rk.ti]}"></i></div><p class="hint">${rk.next ? `${rk.next} points to the next step${rk.ti < 6 ? ` · ${TSTART[rk.ti + 1] - rk.score} to ${TIERS[rk.ti + 1]}` : ''}` : 'Top rank'}</p></div>` : `<div class="rkhead"><p class="hint">Log a main lift (bench, squat, deadlift, rows, presses, pull-ups, dips or push-ups) in a workout to get your rank.</p></div>`;
  const tabs = `<div class="seg wide">${[['all', 'All ranks'], ['mine', 'My lifts'], ['friends', 'Friends']].map(([k, l]) => `<button data-act="rk-tab" data-v="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (t === 'all') {
    const fr = (X.friends ? X.friends() : []).filter(m => !m.me && m.rk), bw = X.curWeight() || S.settings.startWeight || 80, fem = S.settings.sex === 'f';
    body = `<div class="card list2 flat">${[6, 5, 4, 3, 2, 1, 0].map(i => { const ex3 = i ? ['bench', 'squat', 'dead'].map(k => `${STD[k][0].split(' ')[0]} ${Math.round(ratioAt(TSTART[i], fem ? STD[k][3] : STD[k][2]) * bw / 2.5) * 2.5}`).join(' · ') + ' kg' : 'Any logged main lift'; const here = rk && rk.ti === i, fs = fr.filter(m => m.rk.ti === i); return `<button class="lad${here ? ' me' : ''}" data-act="rk-tier" data-v="${i}">${badgeSVG({ ti: i, name: TIERS[i] }, 34)}<span class="lt"><b>${TIERS[i]} <em>${TRANGE[i]}</em></b><small>${esc(ex3)}</small></span><span class="lade">${here ? `<span class="here">You · ${esc(rk.name.split(' ')[1] || '')}</span>` : ''}${fs.map(m => `<span class="av">${esc((m.name || '?')[0].toUpperCase())}</span>`).join('')}${!here && !fs.length ? '›' : ''}</span></button>`; }).join('')}</div><p class="hint">Example weights are estimated 1-rep maxes at your bodyweight. Tap a rank for every lift.</p>`;
  } else if (t === 'mine') {
    body = rk ? `<div class="card list2 flat">${rk.list.map(l => `<div class="liftr"><b>${esc(l.name)}</b><span class="tag" style="background:${TIER_C[l.ti]}">${esc(tierOf(l.sc).name)}</span><span class="tb"><i style="width:${Math.min(100, l.sc / 10.5)}%;background:${TIER_C[l.ti]}"></i></span><small>${l.e1 ? `${l.e1} kg 1-rep max est. · ${l.ratio} × bodyweight` : `${l.reps} reps`} · ${esc(l.level)}</small></div>`).join('')}</div><p class="hint">Warm-ups and sets over 12 reps don't count. Bodyweight comes from your latest weigh-in. Levels follow common strength standards and are a guide, not a test.</p>` : '';
  } else {
    const fr = (X.friends ? X.friends() : []).filter(m => m.rk).sort((a, b) => b.rk.score - a.rk.score);
    body = !X.S.settings.group ? `<p class="hint">Join or create a group in Progress → Friends to compare ranks.</p>` : fr.length ? `<div class="card list2 flat">${fr.map(m => `<div class="lad static${m.me ? ' me' : ''}">${badgeSVG({ ti: m.rk.ti, name: m.rk.name }, 34)}<span class="lt"><b>${esc(m.name)}${m.me ? ' (you)' : ''}</b><small>${m.rk.best ? 'Best: ' + esc(m.rk.best) : ''}</small></span><b class="num">${esc(m.rk.name)} · ${m.rk.score}</b></div>`).join('')}</div>` : `<p class="hint">No one in your group has a rank yet.</p>`;
  }
  sheet(head + tabs + body, 'Strength rank', 'rank');
}
export function rankAct(a, v) { if (a === 'rk-tab') return openRank(v); if (a === 'rk-tier') return openRank(null, +v); }
