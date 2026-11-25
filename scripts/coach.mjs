// The coach: a short morning briefing and evening review, written by Claude through Claude Code (headless) with the
// owner's Claude subscription token (GitHub secret CLAUDE_CODE_OAUTH_TOKEN, from `claude setup-token`). Never an API key
// in the app. Claude gets a compact summary (daily numbers, never raw samples), no tools, no files, and only advises.
// The recovery score is plain code (core.js recovery()); Claude explains it, it doesn't compute it.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../core.js';

const CLAUDE_CODE = '@anthropic-ai/claude-code@2.1.332'; // pinned: bump on purpose
const MODEL = 'sonnet';                                   // plenty for a few sentences, light on the subscription
const MAX_TRIES = 3;

let NAMES = null; // exercise library names (ex/db.json rows: [id, name, ...])
function exName(id, settings, nm) {
  if (nm) return nm;
  const c = ((settings.train || {}).custom || {})[id]; if (c && c.name) return c.name;
  if (!NAMES) { try { NAMES = Object.fromEntries(JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../ex/db.json'), 'utf8')).map(r => [r[0], r[1]])); } catch (e) { NAMES = {}; } }
  return NAMES[id] || String(id).replace(/^x-/, '').replace(/[_-]+/g, ' ').trim();
}
const r1 = x => Math.round(x * 10) / 10;

/** A finished workout in a few lines: name, minutes, sets, volume, each exercise's sets. */
export function woBrief(w, settings) {
  if (!w || !w.ex) return null;
  const isW = s => s && s.t === 'w';
  let sets = 0, vol = 0;
  const ex = w.ex.map(e => {
    const nm = exName(e.id, settings, e.nm);
    if (e.cd) return e.sets[0] && e.sets[0].done ? `${nm}: ${e.cd.min} min cardio` : null;
    const done = (e.sets || []).filter(s => s.done && !isW(s)); if (!done.length) return null;
    done.forEach(s => { sets++; vol += (s.kg || 0) * (s.r || 0); });
    return `${nm}: ${done.map(s => s.kg ? `${r1(s.kg)}kg×${s.r || 0}` : `${s.r || 0}`).join(', ')}`;
  }).filter(Boolean);
  return { name: w.name || 'Workout', min: w.t1 && w.t0 ? Math.round((w.t1 - w.t0) / 60000) : null, sets, volumeKg: Math.round(vol), exercises: ex.slice(0, 12), imported: !!w.imported };
}
function healthRow(h) {
  if (!h) return null;
  const sl = h.sleep;
  return {
    date: h.date,
    sleep: sl && sl.asleepMin ? { asleepMin: sl.asleepMin, bed: sl.start && sl.start.slice(11), wake: sl.end && sl.end.slice(11), deep: sl.stages && sl.stages.deepMin, rem: sl.stages && sl.stages.remMin, awake: sl.awakeMin, naps: (sl.naps || []).length || undefined } : null,
    hrv: h.hrv ? Math.round(h.hrv.rmssd) : null, rhr: h.rhr ? h.rhr.bpm : null, steps: h.steps, activeKcal: h.kcal && h.kcal.active,
    spo2: h.spo2 ? h.spo2.avg : null, hrAvg: h.hr ? h.hr.avg : null
  };
}

/** Everything Claude sees, as one small JSON object. kind = 'morning' | 'evening'. */
export function buildInput({ kind, date, nowHM, settings, days, health, run }) {
  const goal = settings.sleepGoal || 7.5, day = days[date] || {};
  const rc = C.recovery(health, date, goal);
  const ev = C.evalDay(settings, day, date);
  const last7 = Array.from({ length: 7 }, (_, i) => C.addDays(date, -6 + i));
  const training = last7.map(d => { const x = days[d] || {}; return { date: d, planned: C.trainType(settings, d), done: !!x.trainingDone, workout: woBrief(x.wo, settings), cardio: (x.stamina || []).map(s => `${s.mode} ${s.min} min${s.kind && s.kind !== 'easy' ? ' ' + s.kind : ''}`) }; });
  const band = Array.from({ length: 14 }, (_, i) => healthRow(health[C.addDays(date, -13 + i)])).filter(Boolean);
  // the last time the same routine was done, so the evening review can compare like with like
  let prevSame = null;
  if (kind === 'evening' && day.wo && day.wo.rid) {
    const k = Object.keys(days).filter(d => d < date && days[d].wo && days[d].wo.rid === day.wo.rid && days[d].wo.t1).sort().pop();
    if (k) prevSame = { date: k, ...woBrief(days[k].wo, settings) };
  }
  return {
    kind, date, time: nowHM, weekday: C.DAYNAMES[C.weekday(date)],
    challenge: run ? { day: Math.min(run.dayNum, 90), of: 90, streak: run.done, attempt: run.attemptNo } : null,
    sleepGoalHours: goal,
    recovery: rc && rc.score != null ? { score: rc.score, level: rc.level, parts: rc.parts /* each: today's value, the 14-day average, z, part score */,cappedBySleep: rc.capped === 'sleep' || undefined } : { score: null, baselineDays: rc ? rc.baseDays : 0, needs: C.RECOVERY_MIN_DAYS },
    today: { planned: C.trainType(settings, date), trainingDone: !!day.trainingDone, stillMissing: ev.missing, complete: ev.complete, offPlan: ev.offPlan },
    training, sameWorkoutLastTime: prevSame, band
  };
}

const LANG = { ar: 'Write in Egyptian Arabic (colloquial, like the app), Arabic script, Western digits.', en: 'Write in plain English.' };
export function systemPrompt(kind, lang) {
  return [
    'You are the coach inside Locked In, a 90-day fitness challenge app (meals, water, gym, cardio, sleep). You write for one person.',
    kind === 'morning'
      ? 'Write the MORNING BRIEFING: how recovered they are and what that means for today’s planned training (push, train normally, or keep it lighter), plus one concrete thing to get right today.'
      : 'Write the EVENING REVIEW: how today’s training went (compare with sameWorkoutLastTime when given), what is still missing today and can still be done, and one thing for tonight (sleep, food or water).',
    'Rules: use only the data given. Judge against this person’s own recent numbers (the 14-day band history), not population norms, and never react to a single reading as if it were a trend. You only advise: never change their plan, never say a day does not count, never diagnose. If something looks worrying for several days (e.g. resting HR far above their usual, oxygen repeatedly under 92%), calmly suggest checking with a doctor. The band is worn on the upper arm, also while lifting. Recovery is the app’s own score (HRV 45%, resting HR 25%, sleep vs goal 30%); explain it, don’t recompute it. Missing data: say so briefly, don’t guess.',
    'Style: direct and specific, like a good coach texting. No greeting, no sign-off, no emojis, no markdown, no lists.',
    LANG[lang === 'ar' ? 'ar' : 'en'],
    'Reply with JSON only, nothing else: {"head": "...", "text": "..."}. head: at most 8 words. text: 2–4 short sentences, at most 450 characters.'
  ].join('\n');
}

/** Runs Claude Code once, headless, with no tools, in an empty folder, with only the token in its environment. */
export function askClaude(system, input) {
  const dir = mkdtempSync(join(tmpdir(), 'coach-'));
  try {
    const r = spawnSync('npx', ['-y', CLAUDE_CODE, '-p', '--model', MODEL, '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--output-format', 'json', '--system-prompt', system], {
      cwd: dir, input: JSON.stringify(input), encoding: 'utf8', timeout: 240000, maxBuffer: 4 << 20,
      env: { PATH: process.env.PATH, HOME: dir, CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN, DISABLE_AUTOUPDATER: '1', CI: '1' }
    });
    let j = null; try { j = JSON.parse(r.stdout); } catch (e) { }
    if (r.status !== 0 || !j || j.is_error) throw new Error(`claude: ${(j && j.result) || r.stderr || r.stdout || r.error || 'exit ' + r.status}`.slice(0, 300));
    return parseReply(j.result);
  } finally { try { rmSync(dir, { recursive: true, force: true }); } catch (e) { } }
}
export function parseReply(txt) {
  const m = String(txt || '').match(/\{[\s\S]*\}/); if (!m) throw new Error('no JSON in reply');
  const o = JSON.parse(m[0]); const head = String(o.head || '').trim(), text = String(o.text || '').trim();
  if (!head || !text) throw new Error('empty reply');
  return { head: head.slice(0, 80), text: text.slice(0, 700) };
}

/** Is a briefing due now? Morning: once the band has synced last night (05:00–13:00). Evening: 30 min after a workout,
 *  or from 21:30 if anything was trained or logged. Each at most once a day; off in Me > Reminders. */
// band: whether the user has a band connected (optional). With one, the morning waits for its night data; without, 07:30.
export function due({ n, b, rm, day, health, nowMs, band = true }) {
  const mins = n.hour * 60 + n.minute, h = health[n.date];
  const tried = k => (b[k + 'Tries'] || 0) >= MAX_TRIES;
  const ready = band ? h && ((h.sleep && h.sleep.asleepMin) || h.hrv) : mins >= 450;
  if (rm.coachAm !== false && !b.morning && !tried('morning') && mins >= 300 && mins < 780 && ready) return 'morning';
  const w = day.wo, woDone = w && w.t1 && !w.imported;
  const did = woDone || day.trainingDone || (day.stamina || []).length;
  if (rm.coachPm !== false && !b.evening && !tried('evening') && ((woDone && nowMs - w.t1 >= 30 * 60e3) || (mins >= 21 * 60 + 30 && did))) return 'evening';
  return null;
}

/** Called from tick.mjs for each user. */
export async function coach({ db, admin, uid, settings, TZ, push }) {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) return;
  if (settings.aiCoach !== true) return; // optional: only for people who switched it on (You > Optional extras > Coach)
  const n = C.nowIn(TZ, settings.dayStart), date = n.date;
  const ref = db.doc(`users/${uid}/briefings/${date}`), b = (await ref.get()).data() || {};
  const rm = settings.reminders || {};
  const from = C.addDays(date, -21);
  const health = {}; (await db.collection(`users/${uid}/health`).where('date', '>=', from).get()).forEach(d => { const v = d.data(); if (!v.deleted) health[d.id] = v; });
  const today = (await db.doc(`users/${uid}/days/${date}`).get()).data() || {};
  const kind = due({ n, b, rm, day: today, health, nowMs: Date.now(), band: !!(settings.band && settings.band.on) });
  if (!kind) return;
  const days = {}; (await db.collection(`users/${uid}/days`).where('date', '>=', C.addDays(settings.startDate || from, -1)).get()).forEach(d => { days[d.id] = d.data(); });
  const run = C.computeRun(settings, days, n);
  const input = buildInput({ kind, date, nowHM: `${String(n.clock ?? n.hour).padStart(2, '0')}:${String(n.minute).padStart(2, '0')}`, settings, days, health, run });
  try {
    const out = askClaude(systemPrompt(kind, settings.lang), input);
    await ref.set({ date, [kind]: { ...out, at: new Date().toISOString(), rec: input.recovery.score != null ? { score: input.recovery.score, level: input.recovery.level } : null }, u: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    console.log('coach', kind, 'written');
    await db.doc(`users/${uid}/meta/coach`).set({ ok: true, at: new Date().toISOString(), kind, err: null }, { merge: true });
    await push(out.head, out.text, { tags: 'coach' });
  } catch (e) {
    console.log('coach failed', kind, e.message);
    await db.doc(`users/${uid}/meta/coach`).set({ ok: false, at: new Date().toISOString(), kind, err: String(e.message).slice(0, 200) }, { merge: true });
    await ref.set({ date, [kind + 'Tries']: (b[kind + 'Tries'] || 0) + 1, [kind + 'Err']: String(e.message).slice(0, 200), u: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
}
