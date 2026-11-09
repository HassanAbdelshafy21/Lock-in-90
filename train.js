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
const ex = id => (DB && DB.by[id]) || { id, name: String(id).replace(/_/g, ' '), eq: '', pm: [], sm: [], img: 0 };
const img = (id, i) => `ex/${encodeURIComponent(id)}-${i}.webp`;

export const MUSCLES = ['chest', 'shoulders', 'lats', 'middle back', 'traps', 'biceps', 'triceps', 'forearms', 'abdominals', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'lower back', 'adductors', 'abductors', 'neck'];
const MUS_L = { 'chest': 'Chest', 'shoulders': 'Shoulders', 'lats': 'Lats', 'middle back': 'Middle back', 'traps': 'Traps', 'biceps': 'Biceps', 'triceps': 'Triceps', 'forearms': 'Forearms', 'abdominals': 'Abs', 'quadriceps': 'Quads', 'hamstrings': 'Hamstrings', 'glutes': 'Glutes', 'calves': 'Calves', 'lower back': 'Lower back', 'adductors': 'Inner thighs', 'abductors': 'Outer hips', 'neck': 'Neck' };
const EQ_L = { 'barbell': 'Barbell', 'dumbbell': 'Dumbbells', 'cable': 'Cable', 'machine': 'Machine', 'body only': 'Bodyweight', 'kettlebells': 'Kettlebell', 'bands': 'Bands', 'medicine ball': 'Medicine ball', 'exercise ball': 'Exercise ball', 'foam roll': 'Foam roller', 'e-z curl bar': 'EZ bar', 'other': 'Other', '': 'Bodyweight' };
const musL = m => MUS_L[m] || m, eqL = e => EQ_L[e || ''] || e;
const TIMED = new Set(['Plank', 'Side_Bridge', 'Push_Up_to_Side_Plank', 'Superman']);
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
    if (TIMED.has(id)) { lo = 20; hi = 45; }
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

/* ---------- history ---------- */
function sessions() {
  const S = X.S; return Object.keys(S.days).filter(k => S.days[k].wo && S.days[k].wo.ex).sort();
}
function hist(id, before) {
  const S = X.S, out = [];
  for (const k of sessions()) { if (before && k >= before) continue; const e = S.days[k].wo.ex.find(x => x.id === id); if (e) { const sets = (e.sets || []).filter(s => s.done && (s.r || s.kg)); if (sets.length) out.push({ date: k, sets }); } }
  return out;
}
const e1rm = s => (s.kg || 0) * (1 + (s.r || 0) / 30);
function best(id, before) { let b = null; hist(id, before).forEach(h => h.sets.forEach(s => { if (!b || e1rm(s) > e1rm(b) || (!s.kg && (s.r || 0) > (b.r || 0))) b = s; })); return b; }
const setTxt = s => s.kg ? `${C.round(s.kg, 2)}×${s.r || 0}` : `${s.r || 0}`;
function suggest(e, x) {
  const h = hist(e.id, X.editDate()), last = h[h.length - 1]; if (!last) return '';
  const top = last.sets.filter(s => s.kg).map(s => s.kg), w = top.length ? Math.max(...top) : 0;
  const n = Array.isArray(e.sets) ? e.sets.length : e.sets, allTop = last.sets.length >= n && last.sets.slice(0, n).every(s => (s.r || 0) >= e.hi);
  const inc = x.eq === 'dumbbell' || x.eq === 'kettlebells' ? 2 : x.eq === 'barbell' || x.eq === 'machine' || x.eq === 'cable' || x.eq === 'e-z curl bar' ? 2.5 : 0;
  if (allTop && w && inc) return `Last time ${C.round(w, 2)} kg hit the top of the range. Try ${C.round(w + inc, 2)} kg.`;
  if (allTop) return 'Last time you hit the top of the range. Add reps, slow the lowering, or add weight.';
  return `Last time: ${last.sets.map(setTxt).join(', ')}. Beat it by one rep somewhere.`;
}

/* ---------- state helpers ---------- */
const T = () => X.S.settings.train;
const D = () => X.editDate();
const wo = () => { const d = X.S.days[D()]; return d && d.wo; };
const active = () => { const w = wo(); return w && !w.t1 ? w : null; };
function nextRoutine() { const t = T(); if (!t || !t.routines || !t.routines.length) return null; return t.routines[(t.next || 0) % t.routines.length]; }
const thumb = (id, cls = '') => `<img class="exthumb ${cls}" src="${img(id, 0)}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">`;
const photos = id => { const x = ex(id); return x.img > 1 ? `<div class="exph" data-act="tr-flip"><img src="${img(id, 0)}" alt="${esc(x.name)}, start" decoding="async"><img class="b" src="${img(id, 1)}" alt="${esc(x.name)}, end" decoding="async"><span class="exph-l"><i></i><i></i></span></div>` : x.img ? `<div class="exph one"><img src="${img(id, 0)}" alt="${esc(x.name)}"></div>` : ''; };
const meta = x => [...x.pm.map(musL), eqL(x.eq)].filter(Boolean).join(' · ');

/* ---------- views ---------- */
export function trainHTML() {
  loadDB();
  const tab = X.S.trainTab === 'stamina' || X.S.trainTab === 'cardio' ? 'cardio' : X.S.trainTab === 'lib' ? 'lib' : 'wo';
  let h = `<div class="seg wide trtabs" role="tablist" aria-label="Train sections"><button data-act="traintab" data-v="wo" aria-pressed="${tab === 'wo'}">Workout</button><button data-act="traintab" data-v="cardio" aria-pressed="${tab === 'cardio'}">Cardio</button><button data-act="traintab" data-v="lib" aria-pressed="${tab === 'lib'}">Exercises</button></div>`;
  if (tab === 'cardio') return h + X.staminaHTML();
  if (tab === 'lib') return h + libHTML();
  if (!T() || !T().routines) return h + setupHTML();
  const a = active(); if (a) return h + liveHTML(a);
  return h + homeHTML();
}
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
  return `<section class="card trsetup"><span class="sub">Step ${w.step + 1} of ${steps.length}</span><h3>${esc(q)}</h3><div class="opts">${body}</div>
  <div class="row">${w.step ? `<button class="btn ghost" data-act="tr-wizback">Back</button>` : ''}${w.step < steps.length - 1 ? `<button class="btn primary grow" data-act="tr-wiznext">Next</button>` : `<button class="btn primary grow" data-act="tr-wizdone">Create my plan</button>`}</div></section>
  <p class="hint center">Exercises and photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (public domain).</p>`;
}
function routineList(r, small) { return `<div class="exlist">${r.ex.map(e => { const x = ex(e.id); return `<div class="exrow">${thumb(e.id)}<span><b>${esc(x.name)}</b><small>${e.sets} × ${e.lo}–${e.hi}${TIMED.has(e.id) ? ' s' : ''}${small ? '' : ' · ' + esc(meta(x))}</small></span></div>`; }).join('')}</div>`; }
function homeHTML() {
  const t = T(), date = D(), tt = C.trainType(X.S.settings, date), d = X.S.days[date] || {}, r = nextRoutine(), done = d.wo && d.wo.t1;
  let h = '';
  if (done) h += `<section class="card trtoday done"><span class="sub">${date === X.today() ? 'Today' : 'Yesterday'}</span><h3>${esc(d.wo.name)} done</h3><p class="hint">${woSummary(d.wo)}</p><div class="row"><button class="btn" data-act="tr-summary">See summary</button>${t.cardio && t.cardio.on && !cardioDone(d) ? `<button class="btn primary" data-act="tr-cardio">Cardio: ${t.cardio.min} min</button>` : ''}</div></section>`;
  else if (r) {
    const rest = tt === 'rest' || tt === 'recovery';
    h += `<section class="card trtoday"><span class="sub">${rest ? (tt === 'rest' ? 'Rest day · next workout' : 'Mobility day · next workout') : 'Today’s workout'}</span><div class="spread"><h3>${esc(r.name)}</h3><button class="btn small ghost" data-act="tr-pick">Change</button></div>
    ${routineList(r, true)}<button class="btn ${rest ? '' : 'primary'} block" data-act="tr-start" data-v="${r.id}">${rest ? 'Start anyway' : 'Start workout'}</button></section>`;
  }
  // program
  h += `<section class="card"><div class="card-h"><h2>Your plan</h2><button class="btn small ghost" data-act="tr-redo">Change plan</button></div><p class="hint">${esc((SPLITS[t.split] || {}).name || 'Custom')} · ${esc((EQUIP.find(e => e[0] === t.equip) || [, ''])[1])} · ${esc((GOALS.find(g => g[0] === t.goal) || [, ''])[1])}. Workouts go in order. Missed one? The next one waits for you.</p>
  <div class="card list2 flat">${t.routines.map((rr, i) => `<button class="lrow" data-act="tr-edit" data-v="${rr.id}"><span class="lic${rr.id === (r && r.id) ? ' on' : ''}">${i + 1}</span><span class="lt"><b>${esc(rr.name)}</b><small>${rr.ex.length} exercises · ${esc(focusOf(rr))}</small></span><span class="le">›</span></button>`).join('')}
  <button class="lrow" data-act="tr-new"><span class="lic">+</span><span class="lt"><b>New workout</b><small>Build your own from 873 exercises</small></span></button></div></section>`;
  // cardio after lifting
  const cd = t.cardio || { on: false };
  h += `<section class="card"><div class="card-h"><h2>Cardio after lifting</h2><div class="seg"><button data-act="tr-cdon" data-v="1" aria-pressed="${!!cd.on}">On</button><button data-act="tr-cdon" data-v="0" aria-pressed="${!cd.on}">Off</button></div></div>
  ${cd.on ? `<p class="hint">Offered when you finish a workout. Doing it after weights keeps your lifting strong, and the minutes count toward the WHO 150 a week.</p><div class="form"><label>Machine<select class="in" data-trc="mode">${CARDIO.map(([k, l]) => `<option value="${k}" ${cd.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label>Minutes<select class="in" data-trc="min">${[10, 15, 20, 25, 30, 40].map(m => `<option ${cd.min === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label><label class="full">Type<select class="in" data-trc="kind">${Object.entries(CARDIO_KIND).map(([k, l]) => `<option value="${k}" ${cd.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>` : `<p class="hint">Turn on to get a short cardio block after each workout.</p>`}</section>`;
  // recent
  const ss = sessions().filter(k => X.S.days[k].wo.t1).slice(-6).reverse();
  if (ss.length) h += `<section class="card"><div class="card-h"><h2>Recent workouts</h2></div><div class="card list2 flat">${ss.map(k => { const w = X.S.days[k].wo; return `<button class="lrow" data-act="tr-summary" data-v="${k}"><span class="lic ok">✓</span><span class="lt"><b>${esc(w.name)}</b><small>${X.fmt(k)} · ${woSummary(w)}</small></span><span class="le">›</span></button>`; }).join('')}</div></section>`;
  return h;
}
function focusOf(r) { const c = {}; r.ex.forEach(e => { const m = ex(e.id).pm[0]; if (m) c[m] = (c[m] || 0) + e.sets; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => musL(m)).join(', ') || '—'; }
function woStats(w) { let sets = 0, vol = 0; (w.ex || []).forEach(e => (e.sets || []).forEach(s => { if (s.done) { sets++; vol += (s.kg || 0) * (s.r || 0); } })); const min = w.t1 && w.t0 ? Math.max(1, Math.round((w.t1 - w.t0) / 60000)) : 0; return { sets, vol: Math.round(vol), min }; }
function woSummary(w) { const s = woStats(w); return [s.min && `${s.min} min`, `${s.sets} sets`, s.vol && `${C.round(s.vol / 1000, 1)} t lifted`].filter(Boolean).join(' · '); }
const cardioDone = d => (d.stamina || []).some(s => s.src === 'finisher');

function liveHTML(w) {
  const i = Math.min(w.cur || 0, w.ex.length - 1), e = w.ex[i];
  let h = `<section class="card live"><div class="spread"><div><span class="sub">${esc(w.name)}</span><b class="num clock" id="wo-clock">${clock(w)}</b></div><button class="btn small primary" data-act="tr-finish">Finish</button></div>
  <div class="exstrip" role="tablist" aria-label="Exercises">${w.ex.map((x, j) => { const dn = (x.sets || []).length && x.sets.every(s => s.done); return `<button role="tab" data-act="tr-go" data-v="${j}" aria-selected="${j === i}" class="${dn ? 'dn' : ''}">${thumb(x.id)}<i>${dn ? '✓' : j + 1}</i></button>`; }).join('')}<button class="addx" data-act="tr-add" aria-label="Add exercise">+</button></div></section>`;
  if (!e) return h + `<p class="hint center">No exercises yet. Tap + to add one.</p>`;
  const x = ex(e.id), last = hist(e.id, D()).pop(), timed = TIMED.has(e.id), bw = BW(x), b = best(e.id, D()), tip = suggest(e, x);
  h += `<section class="card excard">${photos(e.id)}<div class="spread"><div><h3>${esc(x.name)}</h3><span class="sub">${esc(meta(x))}</span></div><span class="target num">${e.sets.length} × ${e.lo}–${e.hi}${timed ? ' s' : ''}</span></div>
  ${tip ? `<p class="tip">${esc(tip)}</p>` : ''}
  <div class="setgrid" role="table"><div class="sg-h" role="row"><span>#</span><span>Last</span><span>${bw ? '+kg' : 'kg'}</span><span>${timed ? 'sec' : 'reps'}</span><span></span></div>
  ${e.sets.map((s, j) => { const p = last && last.sets[j]; return `<div class="sg-r${s.done ? ' done' : ''}" role="row"><span class="num">${j + 1}</span><span class="num prev">${p ? setTxt(p) : '–'}</span><input class="in num" type="number" inputmode="decimal" step="0.5" min="0" data-wo="${i}:${j}:kg" placeholder="${p && p.kg ? C.round(p.kg, 2) : bw ? '0' : ''}" value="${s.kg ?? ''}" aria-label="Set ${j + 1} weight"><input class="in num" type="number" inputmode="numeric" min="0" data-wo="${i}:${j}:r" placeholder="${p ? p.r : e.lo}" value="${s.r ?? ''}" aria-label="Set ${j + 1} ${timed ? 'seconds' : 'reps'}"><button class="sgtick" data-act="tr-set" data-v="${i}:${j}" aria-pressed="${!!s.done}" aria-label="Set ${j + 1} done">✓</button></div>`; }).join('')}</div>
  <div class="row"><button class="btn small" data-act="tr-addset" data-v="${i}">+ Set</button>${timed ? `<button class="btn small primary" data-act="tr-hold" data-v="${i}">Hold timer</button>` : ''}<button class="btn small ghost" data-act="tr-swap" data-v="${i}">Swap</button><button class="btn small ghost" data-act="tr-how" data-v="${e.id}">How to</button><button class="btn small ghost" data-act="tr-rmex" data-v="${i}">Remove</button></div>
  <p class="hint">${b ? `Best: ${setTxt(b)}${b.kg ? ` (≈ ${Math.round(e1rm(b))} kg 1-rep max)` : ''} · ` : ''}Rest ${e.rest} s between sets</p></section>
  <div class="row nav2">${i > 0 ? `<button class="btn" data-act="tr-go" data-v="${i - 1}">‹ ${esc(ex(w.ex[i - 1].id).name)}</button>` : ''}${i < w.ex.length - 1 ? `<button class="btn primary grow" data-act="tr-go" data-v="${i + 1}">Next: ${esc(ex(w.ex[i + 1].id).name)} ›</button>` : `<button class="btn primary grow" data-act="tr-finish">Finish workout</button>`}</div>`;
  return h;
}
function clock(w) { const s = Math.max(0, Math.floor((Date.now() - w.t0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
setInterval(() => { const el = $('wo-clock'), w = X && X.S.settings && active(); if (el && w) el.textContent = clock(w); }, 1000);

/* ---------- library ---------- */
function libHTML() {
  if (!DB) return `<p class="hint center">Loading exercises…</p>`;
  const f = X.S.trLib = X.S.trLib || { q: '', m: '', e: '' };
  const res = filterLib(f);
  return `<section class="card lib"><input class="in" id="tr-q" type="search" placeholder="Search 873 exercises" value="${esc(f.q)}" autocomplete="off">
  <div class="chips">${['', ...MUSCLES.slice(0, 14)].map(m => `<button data-act="tr-fm" data-v="${m}" aria-pressed="${f.m === m}">${m ? esc(musL(m)) : 'All'}</button>`).join('')}</div>
  <select class="in" id="tr-fe" aria-label="Equipment"><option value="">Any equipment</option>${Object.keys(EQ_L).filter(Boolean).map(k => `<option value="${k}" ${f.e === k ? 'selected' : ''}>${esc(eqL(k))}</option>`).join('')}</select></section>
  <div id="tr-res">${resHTML(res, X.S.trPick ? 'tr-pickex' : 'tr-how')}</div>`;
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
async function openHow(id) {
  await loadDB(); const x = ex(id), h = hist(id), b = best(id);
  const body = () => `${photos(id)}<p class="sub">${esc([...x.pm.map(musL)].join(', '))}${x.sm.length ? ` · also ${esc(x.sm.map(musL).join(', '))}` : ''} · ${esc(eqL(x.eq))} · ${x.lv === 'b' ? 'Beginner' : x.lv === 'i' ? 'Intermediate' : 'Advanced'}</p>
  ${HOW ? `<ol class="howto">${(HOW[id] || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : `<p class="hint">Loading steps…</p>`}
  ${h.length ? `<h3 class="grp">Your history</h3><div class="card list2 flat">${h.slice(-5).reverse().map(s => `<div class="lrow static"><span class="lic">•</span><span class="lt"><b class="num">${s.sets.map(setTxt).join(', ')}</b><small>${X.fmt(s.date)}</small></span></div>`).join('')}</div>${b ? `<p class="hint">Best set ${setTxt(b)}${b.kg ? ` · estimated 1-rep max ${Math.round(e1rm(b))} kg` : ''}</p>` : ''}` : ''}
  ${active() ? `<button class="btn primary block" data-act="tr-pickex" data-v="${id}">Add to this workout</button>` : ''}`;
  sheet(body(), x.name);
  if (!HOW) { await loadHow(); const s = $('sheet'); if (s && !s.hidden) sheet(body(), x.name); }
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
  sheet(`<p class="hint">Same muscles, different machine or tool. Handy when the gym is busy.</p>${resHTML([...alts].map(ex), 'tr-swapto')}`, `Swap ${x.name}`);
}
function openSummary(date) {
  const d = X.S.days[date || D()], w = d && d.wo; if (!w) return;
  const st = woStats(w), prs = [];
  w.ex.forEach(e => { const b0 = best(e.id, date || D()), sets = (e.sets || []).filter(s => s.done && (s.r || s.kg)); if (!sets.length) return; const top = sets.reduce((a, s) => e1rm(s) > e1rm(a) || (!s.kg && s.r > a.r) ? s : a); if (b0 && (e1rm(top) > e1rm(b0) + 0.01 || (!top.kg && !b0.kg && top.r > b0.r))) prs.push(`${ex(e.id).name}: ${setTxt(top)}`); });
  const t = T(), cd = t && t.cardio;
  sheet(`<div class="review"><div><b class="num">${st.min || '–'}</b><span>Minutes</span></div><div><b class="num">${st.sets}</b><span>Sets</span></div><div><b class="num">${C.round(st.vol / 1000, 2)} t</b><span>Total lifted</span></div><div><b class="num">${prs.length}</b><span>New records</span></div></div>
  ${prs.length ? `<div class="note2 good"><b>New records</b><span>${esc(prs.join(' · '))}</span></div>` : ''}
  <div class="card list2 flat">${w.ex.filter(e => (e.sets || []).some(s => s.done)).map(e => `<div class="lrow static">${thumb(e.id)}<span class="lt"><b>${esc(ex(e.id).name)}</b><small class="num">${e.sets.filter(s => s.done).map(setTxt).join(', ')}</small></span></div>`).join('')}</div>
  ${cd && cd.on && !cardioDone(d) && (!date || date === D()) ? cardioBlock(cd) : ''}`, w.name);
}
function cardioBlock(cd) {
  const m = CARDIO.find(c => c[0] === cd.mode) || CARDIO[0];
  return `<section class="card cdblock">${photos(m[0])}<span class="sub">Cardio after lifting</span><h3>${cd.min} min · ${esc(m[1])}</h3><p class="hint">${esc(cd.kind === 'int' ? CARDIO_KIND.int + '. ' : 'Easy, steady pace: you can still talk. ')}${esc(m[2])}</p>
  <div class="row"><button class="btn primary grow" data-act="tr-cdlog" data-v="${cd.min}">Done: ${cd.min} min</button><button class="btn" data-act="tr-cdlog" data-v="${Math.round(cd.min / 2)}">Only ${Math.round(cd.min / 2)} min</button></div></section>`;
}
function openEdit(rid) {
  const t = T(), r = rid === 'new' ? null : t.routines.find(x => x.id === rid);
  X.S.trEdit = r ? JSON.parse(JSON.stringify(r)) : { id: 'C-' + Math.random().toString(36).slice(2, 7), name: 'My workout', ex: [] };
  drawEdit();
}
function drawEdit() {
  const r = X.S.trEdit, isNew = !T().routines.some(x => x.id === r.id);
  sheet(`<label class="full">Name<input class="in" id="tr-rname" value="${esc(r.name)}" maxlength="40"></label>
  <div class="card list2 flat edlist">${r.ex.map((e, i) => `<div class="lrow static ed">${thumb(e.id)}<span class="lt"><b>${esc(ex(e.id).name)}</b><span class="edn"><input class="in num" type="number" inputmode="numeric" min="1" max="10" data-tre="${i}:sets" value="${e.sets}" aria-label="Sets"><em>sets of</em><input class="in num" type="number" inputmode="numeric" min="1" data-tre="${i}:lo" value="${e.lo}" aria-label="Fewest reps"><em>–</em><input class="in num" type="number" inputmode="numeric" min="1" data-tre="${i}:hi" value="${e.hi}" aria-label="Most reps"></span></span><span class="edb"><button class="x" data-act="tr-eup" data-v="${i}" aria-label="Move up">↑</button><button class="x" data-act="tr-erm" data-v="${i}" aria-label="Remove">×</button></span></div>`).join('') || `<p class="hint">No exercises yet.</p>`}</div>
  <button class="btn block" data-act="tr-eadd">+ Add exercise</button>
  <div class="row"><button class="btn primary grow" data-act="tr-esave">${isNew ? 'Add to my plan' : 'Save'}</button>${isNew ? '' : `<button class="btn ghost danger" data-act="tr-edel">Delete</button>`}</div>`, isNew ? 'New workout' : 'Edit workout', 'tredit');
}

/* ---------- actions ---------- */
function startWorkout(r) {
  const d = X.dayDoc(D());
  d.wo = { rid: r.id, name: r.name, t0: Date.now(), cur: 0, ex: r.ex.map(e => ({ id: e.id, lo: e.lo, hi: e.hi, rest: e.rest || 90, sets: Array.from({ length: e.sets }, () => ({})) })) };
  X.saveDay(D()); X.toast(`${r.name} started. Tick each set as you finish it.`); X.draw(); window.scrollTo(0, 0);
}
function finishWorkout() {
  const date = D(), d = X.dayDoc(date), w = d.wo; if (!w) return;
  if (!w.ex.some(e => e.sets.some(s => s.done))) { if (!confirm('No sets ticked. End this workout without saving it?')) return; delete d.wo; X.saveDay(date); return X.draw(); }
  w.t1 = Date.now(); w.ex.forEach(e => e.sets = e.sets.filter(s => s.done || s.kg || s.r));
  const t = T(), idx = t.routines.findIndex(r => r.id === w.rid); if (idx >= 0) { t.next = (idx + 1) % t.routines.length; X.saveSettings(); }
  if (!d.trainingDone) { d.trainingDone = true; d.trainingSource = 'workout'; }
  X.saveDay(date); X.buzz([30, 40, 80]); X.draw(); openSummary(date);
}
export async function act(a, v, b) {
  const S = X.S, t = T();
  switch (a) {
    case 'tr-wiz': { const [k, val] = v.split(':'); S.trWiz[k] = k === 'days' ? +val : val; if (k === 'days' || k === 'level') S.trWiz.split = null; return X.draw(); }
    case 'tr-wiznext': S.trWiz.step++; return X.draw();
    case 'tr-wizback': S.trWiz.step = Math.max(0, S.trWiz.step - 1); return X.draw();
    case 'tr-wizdone': {
      await loadDB(); const w = S.trWiz, cfg = { equip: w.equip, goal: w.goal, level: w.level, days: w.days, split: w.split || recSplit(w.days, w.level) };
      S.settings.train = { ...cfg, routines: makePlan(cfg), next: 0, cardio: cardioDefault(cfg.goal) };
      const wd = WEEKDAYS[SPLITS[cfg.split].days] || WEEKDAYS[3], kind = cfg.equip === 'home' ? 'cali' : 'gym', plan = { ...(S.settings.plan || C.DEFAULT_PLAN) };
      const have = Object.values(plan).filter(x => x === 'gym' || x === 'cali').length;
      if (have !== SPLITS[cfg.split].days) for (let i = 0; i < 7; i++) plan[i] = wd.includes(i) ? kind : (plan[i] === 'cardio' ? 'cardio' : i === 5 ? 'rest' : (plan[i] === 'gym' || plan[i] === 'cali' ? 'rest' : plan[i]));
      S.settings.plan = plan; S.trWiz = null; X.saveSettings(); X.toast('Your plan is ready. Training days are set in Me → Weekly training.'); return X.draw();
    }
    case 'tr-redo': { if (!confirm('Make a new plan? Your workout history stays.')) return; S.trWiz = { step: 0, equip: t.equip, goal: t.goal, level: t.level, days: t.days, split: null }; const keep = S.settings.train; S.settings.train = { ...keep, routines: null }; X.saveSettings(); return X.draw(); }
    case 'tr-start': { await loadDB(); const r = t.routines.find(x => x.id === v) || nextRoutine(); if (wo() && wo().t1 && !confirm('You already finished a workout today. Start another?')) return; return startWorkout(r); }
    case 'tr-pick': return sheet(`<div class="card list2 flat">${t.routines.map(r => `<button class="lrow" data-act="tr-setnext" data-v="${r.id}"><span class="lic">${t.routines.indexOf(r) + 1}</span><span class="lt"><b>${esc(r.name)}</b><small>${esc(focusOf(r))}</small></span></button>`).join('')}</div>`, 'Pick today’s workout');
    case 'tr-setnext': t.next = t.routines.findIndex(r => r.id === v); X.saveSettings(); X.closeSheet(); return X.draw();
    case 'tr-go': { const w = active(); w.cur = +v; X.saveDay(D()); X.draw(); window.scrollTo(0, 0); return; }
    case 'tr-set': {
      const [i, j] = v.split(':').map(Number), w = active(), e = w.ex[i], s = e.sets[j], last = hist(e.id, D()).pop(), p = last && last.sets[j];
      s.done = !s.done;
      const prevSet = e.sets.slice(0, j).reverse().find(x => x.done);
      if (s.done) { if (s.r == null || s.r === '') s.r = p ? p.r : prevSet && prevSet.r ? prevSet.r : e.lo; if ((s.kg == null || s.kg === '') && (p && p.kg || prevSet && prevSet.kg)) s.kg = p && p.kg ? p.kg : prevSet.kg; }
      X.saveDay(D()); X.buzz(12);
      const b0 = best(e.id, D()); if (s.done && b0 && s.kg && e1rm(s) > e1rm(b0) + 0.01) X.toast(`New record on ${ex(e.id).name}: ${setTxt(s)}`);
      X.draw();
      if (s.done) { const more = e.sets.some(x => !x.done); if (more || i < w.ex.length - 1) X.openTimer('rest', e.rest || 90); if (!more && i < w.ex.length - 1) { w.cur = i + 1; X.saveDay(D()); } }
      return;
    }
    case 'tr-addset': { const e = active().ex[+v], l = e.sets[e.sets.length - 1] || {}; e.sets.push({ kg: l.kg }); X.saveDay(D()); return X.draw(); }
    case 'tr-rmex': { const w = active(); if (!confirm(`Remove ${ex(w.ex[+v].id).name} from this workout?`)) return; w.ex.splice(+v, 1); w.cur = Math.max(0, Math.min(w.cur, w.ex.length - 1)); X.saveDay(D()); return X.draw(); }
    case 'tr-hold': { const e = active().ex[+v]; return X.openTimer('rest', e.hi); }
    case 'tr-swap': await loadDB(); return openSwap(+v);
    case 'tr-swapto': { const w = active(), e = w.ex[S.trSwap]; e.id = v; e.sets.forEach(s => { delete s.kg; }); X.saveDay(D()); X.closeSheet(); X.toast(`Swapped to ${ex(v).name}.`); return X.draw(); }
    case 'tr-how': return openHow(v);
    case 'tr-flip': b.classList.toggle('flip'); return;
    case 'tr-add': return openLibPick('wo');
    case 'tr-eadd': return openLibPick('edit');
    case 'tr-pickex': {
      if (S.trPick === 'edit' && S.trEdit) { const x = ex(v), iso = x.mech === 'isolation'; S.trEdit.ex.push({ id: v, sets: 3, lo: TIMED.has(v) ? 20 : iso ? 10 : 8, hi: TIMED.has(v) ? 45 : iso ? 15 : 12, rest: iso ? 75 : 120 }); S.trPick = null; return drawEdit(); }
      const w = active(); if (!w) return X.closeSheet();
      const x = ex(v), iso = x.mech === 'isolation'; w.ex.push({ id: v, lo: iso ? 10 : 8, hi: iso ? 15 : 12, rest: iso ? 75 : 120, sets: [{}, {}, {}] }); w.cur = w.ex.length - 1; S.trPick = null; X.saveDay(D()); X.closeSheet(); return X.draw();
    }
    case 'tr-fm': { S.trLib.m = v; const el = $('tr-res'); if (el) { el.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-how'); document.querySelectorAll('[data-act="tr-fm"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v)); } return; }
    case 'tr-finish': return finishWorkout();
    case 'tr-summary': return openSummary(v || D());
    case 'tr-cardio': return sheet(cardioBlock(t.cardio), 'Cardio after lifting');
    case 'tr-cdlog': {
      const d = X.dayDoc(D()), m = CARDIO.find(c => c[0] === t.cardio.mode) || CARDIO[0];
      d.stamina.push({ mode: m[1], min: +v, kind: t.cardio.kind === 'int' ? 'intervals' : 'easy', src: 'finisher' }); X.saveDay(D()); X.closeSheet(); X.toast(`${v} min of cardio logged.`); return X.draw();
    }
    case 'tr-cdon': t.cardio = { ...(t.cardio || cardioDefault(t.goal)), on: v === '1' }; X.saveSettings(); return X.draw();
    case 'tr-edit': await loadDB(); return openEdit(v);
    case 'tr-new': await loadDB(); return openEdit('new');
    case 'tr-eup': { const r = S.trEdit, i = +v; if (i > 0) [r.ex[i - 1], r.ex[i]] = [r.ex[i], r.ex[i - 1]]; return drawEdit(); }
    case 'tr-erm': S.trEdit.ex.splice(+v, 1); return drawEdit();
    case 'tr-esave': { const r = S.trEdit; if (!r.ex.length) return X.toast('Add at least one exercise.'); const i = t.routines.findIndex(x => x.id === r.id); if (i >= 0) t.routines[i] = r; else t.routines.push(r); S.trEdit = null; X.saveSettings(); X.closeSheet(); X.toast('Workout saved.'); return X.draw(); }
    case 'tr-edel': { if (t.routines.length < 2) return X.toast('Keep at least one workout in your plan.'); if (!confirm('Delete this workout from your plan?')) return; t.routines = t.routines.filter(x => x.id !== S.trEdit.id); t.next = 0; S.trEdit = null; X.saveSettings(); X.closeSheet(); return X.draw(); }
  }
}
export function input(el) {
  const S = X.S;
  if (el.dataset.wo) {
    const [i, j, f] = el.dataset.wo.split(':'), w = active(); if (!w) return true;
    const val = el.value === '' ? null : Math.max(0, parseFloat(el.value) || 0);
    w.ex[+i].sets[+j][f] = val; X.saveDay(D()); return true;
  }
  if (el.dataset.tre) { const [i, f] = el.dataset.tre.split(':'); S.trEdit.ex[+i][f] = Math.max(1, parseInt(el.value, 10) || 1); return true; }
  if (el.id === 'tr-rname') { S.trEdit.name = el.value.slice(0, 40) || 'My workout'; return true; }
  if (el.id === 'tr-q') { S.trLib = S.trLib || { q: '', m: '', e: '' }; S.trLib.q = el.value; const r = $('tr-res'); if (r && DB) r.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-how'); return true; }
  return false;
}
export function change(el) {
  const S = X.S;
  if (el.id === 'tr-fe') { S.trLib.e = el.value; const r = $('tr-res'); if (r) r.innerHTML = resHTML(filterLib(S.trLib), S.trPick ? 'tr-pickex' : 'tr-how'); return true; }
  if (el.dataset.trc) { const t = T(), k = el.dataset.trc; t.cardio[k] = k === 'min' ? +el.value : el.value; X.saveSettings(); return true; }
  return false;
}
// for Today: what's next, in a few words
export function todayLine() { const t = T(), d = X.S.days[D()] || {}; if (!t || !t.routines) return null; if (d.wo && d.wo.t1) return { done: true, name: d.wo.name }; if (active()) return { live: true, name: active().name }; const r = nextRoutine(); return r ? { name: r.name, n: r.ex.length } : null; }
export { ex as exInfo, MUS_L, EQ_L };
