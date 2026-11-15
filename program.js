// Training programs built from the equipment someone actually has.
// Pure logic (no DOM): train.js passes in `exf(id)` to look exercises up in the library.
//
// Evidence used (see README):
//  - every muscle at least twice a week, ~10+ hard sets per muscle per week (ACSM 2026 position stand)
//  - split vs full body makes no difference when weekly volume is equal (Ramos-Campo 2024 meta-analysis)
//  - indirect sets count as half (Pelland 2024 "fractional" method)
//  - light loads build as much muscle as heavy ones when sets end near failure; heavy loads build more strength
//    (Schoenfeld 2017; Lasevicius 2022) → wider, higher rep ranges at home
//  - agonist–antagonist supersets keep volume and save time (Zhang 2025 meta-analysis) → paired sets at home

/* ---------- equipment ---------- */
export const GEAR = [
  ['db', 'Dumbbells', 'Fixed or adjustable', '🏋️'],
  ['bb', 'Barbell and plates', 'Straight or EZ bar', '➖'],
  ['bands', 'Resistance bands', 'Loop or tube bands with handles', '🎗️'],
  ['bench', 'Bench', 'Flat or adjustable', '🪑'],
  ['pullup', 'Pull-up bar', 'Doorway or wall-mounted', '🚪'],
  ['rack', 'Squat rack', 'Or squat stands', '🗄️'],
  ['kb', 'Kettlebell', 'Any weight', '🔔'],
  ['dip', 'Dip bars', 'Or two sturdy chairs', '⏸️'],
  ['cable', 'Cable machine', 'Pulleys with handles', '🔗'],
  ['machine', 'Machines', 'Leg press, pulldown…', '⚙️']
];
export const GEAR_L = Object.fromEntries(GEAR.map(g => [g[0], g[1]]));
GEAR_L.anchor = 'Band anchor';
export const FULL_GYM = ['db', 'bb', 'bands', 'bench', 'pullup', 'rack', 'kb', 'dip', 'cable', 'machine', 'anchor'];
export const PRESETS = { gym: FULL_GYM, home: ['db', 'bands', 'bench', 'pullup', 'anchor'], none: [] };
// a place counts as a gym when it has cables or machines: heavy, simple programming
export const ctxOf = gear => (gear || []).some(g => g === 'cable' || g === 'machine') ? 'gym' : 'home';

// what each exercise needs. Tokens are all required; "a|b" means either. Anything not listed falls back to its library equipment.
const NEED = {
  Barbell_Squat: 'bb rack', Front_Barbell_Squat: 'bb rack', Barbell_Lunge: 'bb rack', Standing_Barbell_Calf_Raise: 'bb rack',
  'Barbell_Bench_Press_-_Medium_Grip': 'bb rack bench', 'Barbell_Incline_Bench_Press_-_Medium_Grip': 'bb rack bench', 'Close-Grip_Barbell_Bench_Press': 'bb rack bench',
  Barbell_Hip_Thrust: 'bb bench', 'EZ-Bar_Skullcrusher': 'bb bench', Lying_Triceps_Press: 'bb bench',
  Dumbbell_Bench_Press: 'db bench', Incline_Dumbbell_Press: 'db bench', Dumbbell_Flyes: 'db bench', Incline_Dumbbell_Flyes: 'db bench', Incline_Dumbbell_Curl: 'db bench', 'Bent-Arm_Dumbbell_Pullover': 'db bench', Reverse_Flyes: 'db',
  Goblet_Squat: 'db|kb', Pullups: 'pullup', 'Chin-Up': 'pullup', Hanging_Leg_Raise: 'pullup', 'Band_Assisted_Pull-Up': 'pullup bands',
  'Dips_-_Chest_Version': 'dip', 'Dips_-_Triceps_Version': 'dip', Parallel_Bar_Dip: 'dip', Knee_Hip_Raise_On_Parallel_Bars: 'dip', Inverted_Row: 'rack|pullup',
  Bench_Dips: '', Hyperextensions_With_No_Hyperextension_Bench: '', 'Wide-Grip_Lat_Pulldown': 'cable|machine', 'Close-Grip_Front_Lat_Pulldown': 'cable|machine',
  Band_Lat_Pulldown: 'bands anchor', Band_Triceps_Pushdown: 'bands anchor', Band_Chest_Press: 'bands anchor', Band_Face_Pull: 'bands anchor', 'Cross_Over_-_With_Bands': 'bands anchor', Seated_Band_Hamstring_Curl: 'bands anchor',
  Hyperextensions_Back_Extensions: 'machine', Trap_Bar_Deadlift: 'machine'
};
const EQ_TOK = { barbell: 'bb', 'e-z curl bar': 'bb', dumbbell: 'db', kettlebells: 'kb', cable: 'cable', machine: 'machine', bands: 'bands' };
export function needsOf(id, exf) { if (id in NEED) return NEED[id].split(' ').filter(Boolean); const x = exf(id); const t = x && EQ_TOK[x.eq]; return t ? [t] : []; }
export const canDo = (id, gear, exf) => needsOf(id, exf).every(tok => tok.split('|').some(g => (gear || []).includes(g)));
export function missingFor(id, gear, exf) { const m = needsOf(id, exf).find(tok => !tok.split('|').some(g => (gear || []).includes(g))); return m ? m.split('|').map(g => GEAR_L[g] || g).join(' or ') : ''; }
// the equipment token shown as a badge ("DB", "Bar", "Band"…)
export function eqTag(id, exf) { const n = needsOf(id, exf).map(t => t.split('|')[0]); return n.includes('bb') ? 'Bar' : n.includes('db') ? 'DB' : n.includes('kb') ? 'KB' : n.includes('bands') ? 'Band' : n.includes('cable') ? 'Cable' : n.includes('machine') ? 'Machine' : n.includes('pullup') ? 'Bar' : n.includes('dip') ? 'Dip bars' : 'Body'; }

/* ---------- movement patterns: best first, for a gym (g) and at home (h) ---------- */
export const PATTERNS = {
  squat: { g: ['Barbell_Squat', 'Hack_Squat', 'Smith_Machine_Squat', 'Front_Barbell_Squat', 'Goblet_Squat', 'Dumbbell_Squat', 'Split_Squat_with_Dumbbells', 'Band_Split_Squat', 'Squats_-_With_Bands', 'Bodyweight_Squat'], h: ['Goblet_Squat', 'Dumbbell_Squat', 'Front_Squats_With_Two_Kettlebells', 'Barbell_Squat', 'Split_Squat_with_Dumbbells', 'Squats_-_With_Bands', 'Band_Split_Squat', 'Bodyweight_Squat'] },
  legpress: { g: ['Leg_Press', 'Hack_Squat', 'Smith_Machine_Squat', 'Split_Squat_with_Dumbbells', 'Dumbbell_Step_Ups', 'Dumbbell_Lunges', 'Band_Split_Squat', 'Bodyweight_Walking_Lunge'], h: ['Split_Squat_with_Dumbbells', 'Dumbbell_Step_Ups', 'Dumbbell_Lunges', 'Band_Split_Squat', 'Bodyweight_Walking_Lunge'] },
  hinge: { g: ['Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Good_Morning', 'Kettlebell_One-Legged_Deadlift', 'Band_Romanian_Deadlift', 'Single_Leg_Glute_Bridge'], h: ['Stiff-Legged_Dumbbell_Deadlift', 'Romanian_Deadlift', 'Kettlebell_One-Legged_Deadlift', 'Band_Romanian_Deadlift', 'Single_Leg_Glute_Bridge'] },
  deadlift: { g: ['Barbell_Deadlift', 'Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'One-Arm_Kettlebell_Swings', 'Band_Romanian_Deadlift', 'Hyperextensions_With_No_Hyperextension_Bench'], h: ['Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'One-Arm_Kettlebell_Swings', 'Band_Romanian_Deadlift', 'Hyperextensions_With_No_Hyperextension_Bench'] },
  lunge: { g: ['Dumbbell_Lunges', 'Dumbbell_Rear_Lunge', 'Barbell_Lunge', 'Split_Squat_with_Dumbbells', 'Dumbbell_Step_Ups', 'Band_Split_Squat', 'Bodyweight_Walking_Lunge'] },
  hipthrust: { g: ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Hip_Lift_with_Band', 'Single_Leg_Glute_Bridge', 'Butt_Lift_Bridge'] },
  legext: { g: ['Leg_Extensions', 'Single-Leg_Leg_Extension'], h: [] },
  legcurl: { g: ['Seated_Leg_Curl', 'Lying_Leg_Curls', 'Standing_Leg_Curl', 'Seated_Band_Hamstring_Curl', 'Floor_Glute-Ham_Raise'], h: ['Seated_Band_Hamstring_Curl', 'Floor_Glute-Ham_Raise'] },
  calf: { g: ['Standing_Calf_Raises', 'Seated_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine', 'Standing_Dumbbell_Calf_Raise', 'Calf_Raises_-_With_Bands', 'Standing_Barbell_Calf_Raise'], h: ['Standing_Dumbbell_Calf_Raise', 'Calf_Raises_-_With_Bands', 'Dumbbell_Seated_One-Leg_Calf_Raise'] },
  hpush: { g: ['Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Bench_Press', 'Leverage_Chest_Press', 'Machine_Bench_Press', 'Floor_Press', 'Dumbbell_Floor_Press', 'Band_Chest_Press', 'Pushups'], h: ['Dumbbell_Bench_Press', 'Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Floor_Press', 'Floor_Press', 'Band_Chest_Press', 'Pushups'] },
  incpush: { g: ['Incline_Dumbbell_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Smith_Machine_Incline_Bench_Press', 'Band_Chest_Press', 'Push-Ups_With_Feet_Elevated'], h: ['Incline_Dumbbell_Press', 'Push-Ups_With_Feet_Elevated', 'Band_Chest_Press', 'Dumbbell_Floor_Press'] },
  dips: { g: ['Dips_-_Chest_Version', 'Parallel_Bar_Dip', 'Dip_Machine', 'Decline_Push-Up', 'Bench_Dips'] },
  fly: { g: ['Cable_Crossover', 'Butterfly', 'Dumbbell_Flyes', 'Cross_Over_-_With_Bands', 'Push-Up_Wide'], h: ['Dumbbell_Flyes', 'Cross_Over_-_With_Bands', 'Push-Up_Wide'] },
  vpush: { g: ['Dumbbell_Shoulder_Press', 'Standing_Military_Press', 'Machine_Shoulder_Military_Press', 'Arnold_Dumbbell_Press', 'Two-Arm_Kettlebell_Military_Press', 'Shoulder_Press_-_With_Bands', 'Decline_Push-Up', 'Handstand_Push-Ups'] },
  lateral: { g: ['Cable_Seated_Lateral_Raise', 'Side_Lateral_Raise', 'Lateral_Raise_-_With_Bands'], h: ['Side_Lateral_Raise', 'Lateral_Raise_-_With_Bands'] },
  frontraise: { g: ['Front_Dumbbell_Raise', 'Front_Cable_Raise', 'Front_Plate_Raise'] },
  reardelt: { g: ['Face_Pull', 'Reverse_Machine_Flyes', 'Reverse_Flyes', 'Band_Face_Pull', 'Band_Pull_Apart', 'Back_Flyes_-_With_Bands'], h: ['Reverse_Flyes', 'Band_Face_Pull', 'Band_Pull_Apart', 'Back_Flyes_-_With_Bands'] },
  vpull: { g: ['Wide-Grip_Lat_Pulldown', 'Pullups', 'Close-Grip_Front_Lat_Pulldown', 'Chin-Up', 'Band_Lat_Pulldown', 'Band_Assisted_Pull-Up', 'Bent-Arm_Dumbbell_Pullover', 'Inverted_Row'], h: ['Pullups', 'Chin-Up', 'Band_Assisted_Pull-Up', 'Band_Lat_Pulldown', 'Bent-Arm_Dumbbell_Pullover', 'Inverted_Row', 'One-Arm_Dumbbell_Row'] },
  hpull: { g: ['Seated_Cable_Rows', 'Bent_Over_Barbell_Row', 'One-Arm_Dumbbell_Row', 'Leverage_Iso_Row', 'Bent_Over_Two-Dumbbell_Row', 'Band_Seated_Row', 'Band_Bent_Over_Row', 'Inverted_Row', 'One-Arm_Kettlebell_Row'], h: ['One-Arm_Dumbbell_Row', 'Bent_Over_Barbell_Row', 'Bent_Over_Two-Dumbbell_Row', 'Band_Seated_Row', 'Band_Bent_Over_Row', 'One-Arm_Kettlebell_Row', 'Inverted_Row'] },
  pullover: { g: ['Straight-Arm_Pulldown', 'Rope_Straight-Arm_Pulldown', 'Bent-Arm_Dumbbell_Pullover', 'Band_Lat_Pulldown'] },
  shrug: { g: ['Barbell_Shrug', 'Dumbbell_Shrug', 'Upright_Row_-_With_Bands'] },
  biceps: { g: ['Barbell_Curl', 'Incline_Dumbbell_Curl', 'EZ-Bar_Curl', 'Dumbbell_Bicep_Curl', 'Band_Curl', 'Chin-Up'], h: ['Incline_Dumbbell_Curl', 'Dumbbell_Bicep_Curl', 'Barbell_Curl', 'Band_Curl', 'Chin-Up'] },
  hammer: { g: ['Hammer_Curls', 'Cable_Hammer_Curls_-_Rope_Attachment', 'Concentration_Curls', 'Band_Curl'] },
  triceps: { g: ['Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown', 'Band_Triceps_Pushdown', 'Dips_-_Triceps_Version', 'Close-Grip_Barbell_Bench_Press', 'Tricep_Dumbbell_Kickback', 'Push-Ups_-_Close_Triceps_Position', 'Bench_Dips'], h: ['Band_Triceps_Pushdown', 'Dips_-_Triceps_Version', 'Tricep_Dumbbell_Kickback', 'Close-Grip_Barbell_Bench_Press', 'Push-Ups_-_Close_Triceps_Position', 'Bench_Dips'] },
  triover: { g: ['Cable_Rope_Overhead_Triceps_Extension', 'Standing_Dumbbell_Triceps_Extension', 'EZ-Bar_Skullcrusher', 'Band_Overhead_Triceps_Extension', 'Kettlebell_Overhead_Triceps_Extension', 'Seated_Triceps_Press', 'Push-Ups_-_Close_Triceps_Position'], h: ['Standing_Dumbbell_Triceps_Extension', 'Band_Overhead_Triceps_Extension', 'EZ-Bar_Skullcrusher', 'Kettlebell_Overhead_Triceps_Extension', 'Push-Ups_-_Close_Triceps_Position'] },
  abs: { g: ['Cable_Crunch', 'Hanging_Leg_Raise', 'Plank', 'Reverse_Crunch', 'Knee_Hip_Raise_On_Parallel_Bars'], h: ['Hanging_Leg_Raise', 'Reverse_Crunch', 'Plank', 'Knee_Hip_Raise_On_Parallel_Bars'] }
};
const LOWER = new Set(['squat', 'legpress', 'hinge', 'deadlift', 'lunge', 'hipthrust', 'legext', 'legcurl', 'calf']);
const UNI = new Set(['Split_Squat_with_Dumbbells', 'Band_Split_Squat', 'Dumbbell_Lunges', 'Dumbbell_Step_Ups', 'Kettlebell_One-Legged_Deadlift', 'One-Arm_Dumbbell_Row']);
export const patternOf = id => Object.keys(PATTERNS).find(p => PATTERNS[p].g.includes(id) || (PATTERNS[p].h || []).includes(id)) || null;
const listFor = (pat, ctx, light) => {
  const P = PATTERNS[pat]; if (!P) return [];
  let L = ctx === 'home' && P.h ? P.h.concat(P.g.filter(x => !P.h.includes(x))) : P.g.concat((P.h || []).filter(x => !P.g.includes(x)));
  // light dumbbells at home: one leg at a time first, so the weight is enough to make sets hard
  if (light && (pat === 'squat' || pat === 'hinge')) L = L.filter(x => UNI.has(x)).concat(L.filter(x => !UNI.has(x)));
  return L;
};
export function candidates(pat, gear, ctx, exf, light) { return listFor(pat, ctx, light).filter(id => exf(id) && exf(id).name && canDo(id, gear, exf)); }
// alternatives for a slot: what you can do with your equipment, then what a missing tool would add
export function alternatives(pat, cur, gear, ctx, exf) {
  const all = listFor(pat, ctx).filter(id => id !== cur && exf(id) && exf(id).name);
  return { ok: all.filter(id => canDo(id, gear, exf)), need: all.filter(id => !canDo(id, gear, exf)).map(id => ({ id, miss: missingFor(id, gear, exf) })) };
}
// two quick alternatives shown under an exercise, preferring a different tool from the current one
export function quickAlts(pat, cur, gear, ctx, exf) {
  if (!pat) return []; const { ok } = alternatives(pat, cur, gear, ctx, exf), tag = eqTag(cur, exf);
  return ok.filter(id => eqTag(id, exf) !== tag).concat(ok.filter(id => eqTag(id, exf) === tag)).slice(0, 2);
}

/* ---------- workouts ---------- */
export const R_TPL = {
  FBA: ['Full body A', [['squat', 'main'], ['hpush', 'main'], ['hpull', 'acc'], ['hinge', 'acc'], ['lateral', 'iso'], ['triover', 'iso'], ['calf', 'iso']]],
  FBB: ['Full body B', [['deadlift', 'main'], ['vpush', 'main'], ['vpull', 'acc'], ['lunge', 'acc'], ['biceps', 'iso'], ['abs', 'iso'], ['fly', 'iso']]],
  FBC: ['Full body C', [['legpress', 'acc'], ['incpush', 'acc'], ['hpull', 'acc', 1], ['legcurl', 'iso'], ['reardelt', 'iso'], ['hammer', 'iso'], ['calf', 'iso', 1]]],
  UA: ['Upper A', [['hpush', 'main'], ['hpull', 'main'], ['vpush', 'acc'], ['vpull', 'acc'], ['lateral', 'iso'], ['biceps', 'iso'], ['triover', 'iso']]],
  UB: ['Upper B', [['incpush', 'main'], ['vpull', 'main', 1], ['hpull', 'acc', 1], ['fly', 'iso'], ['reardelt', 'iso'], ['hammer', 'iso'], ['triceps', 'iso']]],
  LA: ['Lower A', [['squat', 'main'], ['hinge', 'acc'], ['legext', 'iso'], ['legcurl', 'iso'], ['calf', 'iso'], ['abs', 'iso']]],
  LB: ['Lower B', [['deadlift', 'main'], ['lunge', 'acc'], ['hipthrust', 'acc'], ['legcurl', 'iso', 1], ['calf', 'iso', 1], ['abs', 'iso', 1]]],
  PUSH: ['Push', [['hpush', 'main'], ['incpush', 'acc'], ['vpush', 'acc'], ['lateral', 'iso'], ['fly', 'iso'], ['triceps', 'iso'], ['triover', 'iso']]],
  PULL: ['Pull', [['vpull', 'main'], ['hpull', 'acc'], ['hpull', 'acc', 1], ['pullover', 'iso'], ['reardelt', 'iso'], ['biceps', 'iso'], ['hammer', 'iso']]],
  LEGS: ['Legs', [['squat', 'main'], ['hinge', 'acc'], ['legpress', 'acc'], ['legcurl', 'iso'], ['legext', 'iso'], ['calf', 'iso'], ['abs', 'iso']]],
  PUSH2: ['Push B', [['incpush', 'main', 1], ['hpush', 'acc', 1], ['vpush', 'acc', 1], ['lateral', 'iso', 1], ['dips', 'acc'], ['triover', 'iso', 1]]],
  PULL2: ['Pull B', [['hpull', 'main', 1], ['vpull', 'acc', 1], ['shrug', 'iso'], ['reardelt', 'iso', 1], ['biceps', 'iso', 1], ['hammer', 'iso', 1]]],
  LEGS2: ['Legs B', [['deadlift', 'main'], ['legpress', 'acc', 1], ['lunge', 'acc'], ['hipthrust', 'acc'], ['legcurl', 'iso', 1], ['calf', 'iso', 1]]]
};
export const SPLITS = {
  fb2: { name: 'Full body A · B', days: 2, r: ['FBA', 'FBB'], why: 'Every muscle twice a week in two sessions.' },
  fb3: { name: 'Full body A · B · C', days: 3, r: ['FBA', 'FBB', 'FBC'], why: 'Every muscle 3 times a week, with fewer sets each time. Rest a day between sessions.' },
  ppl3: { name: 'Push · Pull · Legs', days: 3, r: ['PUSH', 'PULL', 'LEGS'], why: 'Works too, but each muscle is trained once a week, so every session has to carry all its sets. Better with 6 days.', once: true },
  fb4: { name: 'Full body × 4', days: 4, r: ['FBA', 'FBB', 'FBC', 'FBA'], why: 'Short full-body sessions, every muscle 4 times a week.' },
  ul4: { name: 'Upper · Lower, twice', days: 4, r: ['UA', 'LA', 'UB', 'LB'], why: 'Every muscle twice a week with room for more sets each time.' },
  pplul: { name: 'Upper · Lower + Push · Pull · Legs', days: 5, r: ['UA', 'LA', 'PUSH', 'PULL', 'LEGS2'], why: 'Five days, every muscle twice a week.' },
  ppl6: { name: 'Push · Pull · Legs, twice', days: 6, r: ['PUSH', 'PULL', 'LEGS', 'PUSH2', 'PULL2', 'LEGS2'], why: 'Six days, every muscle twice a week.' }
};
export const recSplit = days => days <= 2 ? 'fb2' : days === 3 ? 'fb3' : days === 4 ? 'ul4' : days === 5 ? 'pplul' : 'ppl6';
export const splitsFor = days => Object.entries(SPLITS).filter(([, s]) => s.days === days).map(([k]) => k).sort((a, b) => (b === recSplit(days)) - (a === recSplit(days)));

// [sets, lowest reps, highest reps, rest seconds]
const DOSE = {
  gym: {
    muscle: { main: [3, 6, 10, 150], acc: [3, 8, 12, 120], iso: [3, 10, 15, 75] },
    strength: { main: [4, 4, 6, 180], acc: [3, 6, 10, 120], iso: [2, 10, 12, 75] },
    fat: { main: [3, 8, 12, 120], acc: [3, 10, 12, 90], iso: [3, 12, 15, 60] },
    fit: { main: [3, 8, 12, 120], acc: [3, 10, 15, 90], iso: [2, 12, 15, 60] }
  },
  // lighter weights: higher reps taken close to failure, shorter rests (pairs rest after both)
  home: {
    muscle: { main: [3, 10, 15, 90], acc: [3, 10, 15, 90], iso: [3, 12, 20, 60] },
    strength: { main: [4, 6, 10, 120], acc: [3, 8, 12, 90], iso: [2, 12, 15, 60] },
    fat: { main: [3, 12, 15, 75], acc: [3, 12, 15, 75], iso: [3, 15, 20, 45] },
    fit: { main: [3, 10, 15, 75], acc: [3, 12, 15, 75], iso: [2, 12, 20, 45] }
  }
};
const TIMED_IDS = new Set(['Plank', 'Side_Bridge']);
export function doseFor(id, kind, cfg, exf) {
  const ctx = cfg.ctx || 'gym', d = (DOSE[ctx][cfg.goal] || DOSE[ctx].muscle)[kind] || DOSE[ctx].muscle.acc;
  let [sets, lo, hi, rest] = d;
  if (cfg.level === 'new') sets = Math.min(sets, kind === 'iso' ? 2 : 3); else if (cfg.level === 'exp' && kind !== 'iso') sets += 1;
  const x = exf(id) || {};
  if (TIMED_IDS.has(id)) { lo = 20; hi = 45; }
  else if (x.eq === 'bands' && kind === 'iso') { lo = Math.max(lo, 12); hi = Math.max(hi, 25); }
  else if ((!x.eq || x.eq === 'body only') && !/Pull|Chin|Dip/.test(id)) { lo = Math.max(lo, 8); hi = Math.max(hi, 20); }
  return { sets, lo, hi, rest };
}
const SLOTS_BY_LEN = { gym: { 45: 5, 60: 6, 75: 8 }, home: { 45: 6, 60: 7, 75: 8 } };
const TEMPO = new Set(['squat', 'legpress', 'lunge', 'hpush', 'incpush']);
function pickId(pat, vi, used, cfg, exf) {
  const L = candidates(pat, cfg.gear, cfg.ctx, exf, cfg.ctx === 'home' && (cfg.wt || {}).db && cfg.wt.db < 24);
  if (!L.length) return null;
  const k = vi % L.length, pool = L.slice(k).concat(L.slice(0, k));
  return pool.find(x => !used.has(x)) || null;
}
const groupsOf = (id, exf) => { const x = exf(id) || { pm: [], sm: [] }; return new Set(x.pm.map(m => G_OF[m]).filter(Boolean)); };
export function buildRoutine(key, cfg, exf) {
  const [name, slots] = R_TPL[key], used = new Set(), out = [], max = (SLOTS_BY_LEN[cfg.ctx] || SLOTS_BY_LEN.gym)[cfg.len || 60] || 6;
  for (const [pat, kind, vi = 0] of slots) {
    if (out.length >= max) break;
    const id = pickId(pat, vi, used, cfg, exf); if (!id) continue; used.add(id);
    const d = doseFor(id, kind, cfg, exf);
    out.push({ id, ...d, pat, kind, vi, ...(cfg.ctx === 'home' && TEMPO.has(pat) && kind !== 'iso' ? { cue: '3 s down' } : {}) });
  }
  if (cfg.ctx === 'home') pairUp(out, exf);
  return { id: key + '-' + Math.random().toString(36).slice(2, 6), key, name, ex: out };
}
// at home, pair exercises that don't compete (push with pull, upper with lower) to save time
export function pairUp(list, exf) {
  list.forEach(e => delete e.ss);
  let n = 0;
  for (let i = 0; i + 1 < list.length; i += 2) {
    const a = list[i], b = list[i + 1], ga = groupsOf(a.id, exf), gb = groupsOf(b.id, exf);
    if ([...ga].some(g => gb.has(g)) || (LOWER.has(a.pat) && LOWER.has(b.pat) && a.kind !== 'iso' && b.kind !== 'iso')) { i--; continue; }
    const id = 'p' + (++n); a.ss = id; b.ss = id; a.rest = 0; b.rest = Math.max(b.rest || 60, 90);
  }
  return list;
}
export function makePlan(cfg, exf) {
  const sp = SPLITS[cfg.split] || SPLITS[recSplit(cfg.days)];
  const seen = {}, plan = sp.r.map(k => { seen[k] = (seen[k] || 0) + 1; const r = buildRoutine(k, cfg, exf); if (seen[k] > 1) r.name += ' (2)'; return r; });
  // top up any muscle under ~8 sets a week, allowing one extra exercise per workout
  const cap = ((SLOTS_BY_LEN[cfg.ctx] || SLOTS_BY_LEN.gym)[cfg.len || 60] || 6) + 1;
  for (let pass = 0; pass < 2; pass++) coverage(plan, exf).filter(c => c.low).sort((a, b) => a.sets - b.sets).forEach(c => fixGroup(plan, c.g, cfg, exf, cap));
  return plan;
}

/* ---------- weekly coverage ---------- */
export const GROUPS = [['chest', 'Chest'], ['back', 'Back'], ['shoulders', 'Shoulders'], ['biceps', 'Biceps'], ['triceps', 'Triceps'], ['quads', 'Quads'], ['hamstrings', 'Hamstrings'], ['glutes', 'Glutes'], ['calves', 'Calves'], ['abs', 'Abs']];
const G_OF = { chest: 'chest', lats: 'back', 'middle back': 'back', shoulders: 'shoulders', biceps: 'biceps', triceps: 'triceps', quadriceps: 'quads', hamstrings: 'hamstrings', glutes: 'glutes', calves: 'calves', abdominals: 'abs' };
// sets per week per group (indirect sets count half) and how many sessions hit each group
export function coverage(routines, exf) {
  const sets = {}, days = {};
  GROUPS.forEach(([g]) => { sets[g] = 0; days[g] = 0; });
  for (const r of routines || []) {
    const inR = {};
    for (const e of r.ex || []) {
      const x = exf(e.id); if (!x || !x.pm) continue; const n = +e.sets || 0;
      const direct = new Set(x.pm.map(m => G_OF[m]).filter(Boolean)), half = new Set(x.sm.map(m => G_OF[m]).filter(g => g && !direct.has(g)));
      direct.forEach(g => { sets[g] += n; inR[g] = (inR[g] || 0) + n; });
      half.forEach(g => { sets[g] += n / 2; inR[g] = (inR[g] || 0) + n / 2; });
    }
    Object.entries(inR).forEach(([g, v]) => { if (v >= 1) days[g]++; });
  }
  return GROUPS.map(([g, label]) => ({ g, label, sets: Math.round(sets[g] * 2) / 2, days: days[g], low: sets[g] < 8 }));
}
const FIX_PAT = { chest: 'fly', back: 'hpull', shoulders: 'lateral', biceps: 'biceps', triceps: 'triover', quads: 'legpress', hamstrings: 'legcurl', glutes: 'hipthrust', calves: 'calf', abs: 'abs' };
const FIX_ALT = { hamstrings: 'hinge', quads: 'lunge', chest: 'hpush', shoulders: 'reardelt', abs: 'abs' };
const UPPER_KEYS = { chest: /^(FB|UA|UB|PUSH)/, shoulders: /^(FB|UA|UB|PUSH)/, triceps: /^(FB|UA|UB|PUSH)/, back: /^(FB|UA|UB|PULL)/, biceps: /^(FB|UA|UB|PULL)/ };
// add 2 sets for a muscle that's under target, to the best-fitting workout with the fewest exercises
export function fixGroup(routines, g, cfg, exf, cap = 99) {
  const pats = [FIX_PAT[g], FIX_ALT[g]].filter(Boolean);
  const fit = r => UPPER_KEYS[g] ? UPPER_KEYS[g].test(r.key || '') : /^(FB|LA|LB|LEGS)/.test(r.key || '');
  const ok = routines.filter(r => r.ex.length < cap), pool = ok.filter(fit).length ? ok.filter(fit) : ok;
  const r = pool.slice().sort((a, b) => a.ex.length - b.ex.length)[0]; if (!r) return null;
  const used = new Set(r.ex.map(e => e.id));
  for (const pat of pats) {
    const id = pickId(pat, 1, used, cfg, exf) || pickId(pat, 0, used, cfg, exf);
    if (id) { const d = doseFor(id, 'iso', cfg, exf); r.ex.push({ id, ...d, sets: 2, pat, kind: 'iso', vi: 1 }); if (cfg.ctx === 'home') pairUp(r.ex, exf); return { r, id }; }
  }
  return null;
}

/* ---------- the same workout somewhere else (Gym ⇄ Home) ---------- */
export function convertRoutine(r, cfg, exf) {
  const used = new Set(), out = [];
  for (const e of r.ex) {
    const pat = e.pat || patternOf(e.id), kind = e.kind || 'acc';
    let id = e.id;
    if (!canDo(id, cfg.gear, exf) || (pat && cfg.ctx !== (e.ctx || 'gym'))) {
      const c = pat ? pickId(pat, e.vi || 0, used, cfg, exf) : null;
      if (c) id = c; else if (!canDo(id, cfg.gear, exf)) continue;
    }
    used.add(id);
    const d = pat ? doseFor(id, kind, cfg, exf) : { sets: e.sets, lo: e.lo, hi: e.hi, rest: e.rest };
    out.push({ id, ...d, pat, kind, vi: e.vi || 0, ...(cfg.ctx === 'home' && TEMPO.has(pat) && kind !== 'iso' ? { cue: '3 s down' } : {}) });
  }
  if (cfg.ctx === 'home') pairUp(out, exf);
  return { ...r, ex: out, place: cfg.ctx };
}

/* ---------- outgrowing a weight at home ---------- */
// returns the next step when the last session hit the top of the range with the heaviest weight available
export function ladderStep(e, lastSets, cfg, exf) {
  if (!lastSets || !lastSets.length || cfg.ctx !== 'home') return null;
  const work = lastSets.filter(s => s.t !== 'w'); if (!work.length) return null;
  const x = exf(e.id) || {}, maxKg = x.eq === 'dumbbell' ? (cfg.wt || {}).db : x.eq === 'barbell' ? (cfg.wt || {}).bb : 0;
  const kg = Math.max(0, ...work.map(s => s.kg || 0)), allTop = work.every(s => (s.r || 0) >= e.hi);
  if (!allTop || !maxKg || kg < maxKg) return null;
  if (!e.cue) return { k: 'tempo', title: 'Slow the lowering', txt: '3 seconds down, same weight' };
  if (e.cue === '3 s down') return { k: 'pause', title: 'Pause at the bottom', txt: '1–2 seconds, same weight' };
  const pat = e.pat || patternOf(e.id), uni = pat && candidates(pat, cfg.gear, 'home', exf).find(id => UNI.has(id) && id !== e.id);
  if (uni && !UNI.has(e.id)) return { k: 'uni', id: uni, title: 'One side at a time', txt: `${exf(uni).name} with the same weight` };
  return { k: 'buy', title: 'Heavier weights', txt: `Your ${kg} kg is now too light for this exercise` };
}
