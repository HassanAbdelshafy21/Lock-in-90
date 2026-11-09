// Runs every 30 minutes on GitHub Actions: syncs Strava, then sends smart reminders through ntfy.
import admin from 'firebase-admin';
import * as C from '../core.js';
import { trText, addFoodNames } from '../i18n.js';
import { FOODS } from '../data.js';
addFoodNames(FOODS);

const TZ = 'Africa/Cairo';
const APP_URL = process.env.APP_URL || 'https://hassanabdelshafy21.github.io/Lock-in-90/';
const TOPIC = process.env.NTFY_TOPIC;
const TEST = process.env.TEST === 'true';

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

let CURRENT_TOPIC = null;
async function ntfy(title, body, { priority = 3, tags = '' } = {}) {
  if (!CURRENT_TOPIC) { console.log('[no topic for this user]', title); return; }
  const t = /^[\x20-\x7E]*$/.test(title) ? title : `=?UTF-8?B?${Buffer.from(title, 'utf8').toString('base64')}?=`;
  const r = await fetch(`https://ntfy.sh/${encodeURIComponent(CURRENT_TOPIC)}`, { method: 'POST', body, headers: { Title: t, Click: APP_URL, Priority: String(priority), Tags: tags } });
  console.log('ntfy', title, r.status);
}

/* ---------- Strava ---------- */
async function stravaToken(uid) {
  const ref = db.doc(`private/strava_${uid}`);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const s = snap.data();
  if (s.expires_at && s.expires_at > Date.now() / 1000 + 120) return s.access_token;
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: s.refresh_token })
  });
  const j = await r.json();
  if (!r.ok) { console.log('strava refresh failed', r.status, j.message); return null; }
  await ref.set({ ...s, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at }, { merge: true });
  return j.access_token;
}
async function stravaSync(uid, settings) {
  if (!process.env.STRAVA_CLIENT_ID) return;
  const token = await stravaToken(uid);
  if (!token) return;
  const after = Math.floor(Date.now() / 1000) - 4 * 86400;
  const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=60`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { console.log('strava list failed', r.status); await db.doc(`users/${uid}/meta/strava`).set({ ok: false, lastSync: new Date().toISOString(), error: r.status }, { merge: true }); return; }
  const acts = await r.json();
  const batch = db.batch();
  const gymDates = new Set();
  for (const a of acts) {
    const date = String(a.start_date_local).slice(0, 10);
    const type = a.sport_type || a.type;
    batch.set(db.doc(`users/${uid}/activities/${a.id}`), { id: a.id, date, name: a.name || type, type, min: Math.round((a.moving_time || a.elapsed_time || 0) / 60), dist: a.distance || 0, hr: a.average_heartrate || null, start: a.start_date_local });
    if (C.STRENGTH_TYPES.includes(type) && C.trainType(settings, date) === 'gym') gymDates.add(date);
  }
  await batch.commit();
  for (const date of gymDates) {
    const ref = db.doc(`users/${uid}/days/${date}`);
    const snap = await ref.get();
    if (!snap.exists || !snap.data().trainingDone) await ref.set({ date, trainingDone: true, trainingSource: 'strava', u: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  const count = (await db.collection(`users/${uid}/activities`).count().get()).data().count;
  await db.doc(`users/${uid}/meta/strava`).set({ ok: true, lastSync: new Date().toISOString(), count }, { merge: true });
  console.log('strava synced', acts.length, 'gym days ticked', [...gymDates]);
}

/* ---------- reminders ---------- */
const at = (h, m) => h * 60 + m;
const LIST = [
  { id: 'morning', key: 'morning', t: at(9, 0) },
  { id: 'w11', key: 'water', t: at(11, 0) }, { id: 'w13', key: 'water', t: at(13, 0) }, { id: 'w15', key: 'water', t: at(15, 0) }, { id: 'w17', key: 'water', t: at(17, 0) }, { id: 'w19', key: 'water', t: at(19, 0) },
  { id: 'burner', key: 'burner', t: at(15, 30) },
  { id: 'stamina', key: 'stamina', t: at(17, 0) },
  { id: 'evening', key: 'evening', t: at(20, 40) },
  { id: 'final', key: 'final', t: at(23, 0) }
];
async function reminders(uid, settings) {
  const n = C.nowIn(TZ), nowMin = n.hour * 60 + n.minute, date = n.date;
  const rm0 = settings.reminders || {};
  const logRef0 = db.doc(`users/${uid}/meta/notify`);
  const log0 = (await logRef0.get()).data() || {};
  const sent0 = log0.date === date ? log0.sent || [] : [];
  // Only the morning, evening and final messages need the full history (for the day count); otherwise read just today.
  const needRun = TEST || ['morning', 'evening', 'final'].some(k => { const r = LIST.find(x => x.key === k); return rm0[k] !== false && !sent0.includes(r.id) && nowMin >= r.t && nowMin <= r.t + 150; });
  const days = {};
  if (needRun) { (await db.collection(`users/${uid}/days`).where('date', '>=', C.addDays(settings.startDate, -1)).get()).forEach(d => { days[d.id] = d.data(); }); }
  else { const s = await db.doc(`users/${uid}/days/${date}`).get(); if (s.exists) days[date] = s.data(); }
  const day = days[date] || {};
  const R = needRun ? C.computeRun(settings, days, n) : { dayNum: 0, done: 0, critical: false };
  const ev = C.evalDay(settings, day, date);
  const rm = settings.reminders || {};
  const logRef = logRef0, sent = [...sent0];
  const L = ml => String(C.round(ml / 1000, 2));
  const ar = settings.lang === 'ar', A = (en, a) => ar ? a : en, trl = s => ar ? (trText(s) ?? s) : s;

  if (TEST) await ntfy(A('Lock In 90 test', 'تجربة Lock In 90'), A(`Notifications work. Day ${Math.min(R.dayNum, 90)} of 90, streak ${R.done}.`, `التنبيهات تعمل. اليوم ${Math.min(R.dayNum, 90)} من 90، السلسلة ${R.done}.`), { tags: 'white_check_mark' });

  // meal log reminders (opt-in): 45 min after each planned meal time if it isn't logged
  if (rm.meals === true) {
    for (const m of C.plannedMeals(settings, day, date)) {
      const [hh, mm] = String(m.time || '').split(':').map(Number);
      if (isNaN(hh)) continue;
      const due = hh * 60 + (mm || 0) + 45, id = 'meal_' + m.id;
      if (sent.includes(id) || nowMin < due || nowMin > due + 150) continue;
      sent.push(id);
      if (!(day.meals && day.meals[m.id] && day.meals[m.id].status)) await ntfy(A(`Log ${m.name}`, `سجّل ${trl(m.name)}`), A(`${m.name} (${m.time}) isn't logged yet. One tap: As planned.`, `${trl(m.name)} (${m.time}) لم تُسجَّل بعد. نقرة واحدة: حسب الخطة.`), { tags: 'fork_and_knife' });
    }
  }
  const ram = C.inRamadan(settings, date);
  const list = ram ? LIST.filter(r => r.key !== 'water' && r.key !== 'burner').concat([{ id: 'w20', key: 'water', t: at(20, 0) }, { id: 'w22', key: 'water', t: at(22, 0) }]) : LIST;
  for (const r of list) {
    if (rm[r.key] === false || sent.includes(r.id)) continue;
    if (nowMin < r.t || nowMin > r.t + 150) continue;
    let msg = null;
    if (r.key === 'morning') {
      const tt = C.trainType(settings, date);
      const dn = Math.min(R.dayNum, 90), wg = L(settings.waterGoal || 3500);
      msg = [A(`Day ${dn} of 90${ram ? ' · Ramadan Kareem' : ''}`, `اليوم ${dn} من 90${ram ? ' · رمضان كريم' : ''}`),
        A(`${C.DAYNAMES[C.weekday(date)]}: ${C.TT[tt].label}. Water goal ${wg} L.\n${R.critical ? 'Yesterday broke the chain. Never miss twice.' : `Streak ${R.done}.`}`,
          `${trl(C.DAYNAMES[C.weekday(date)])}: ${trl(C.TT[tt].label)}. هدف المياه ${wg} لتر.\n${R.critical ? 'أمس انكسرت السلسلة. لا تفوّت مرتين.' : `السلسلة ${R.done}.`}`), { tags: 'sunrise' }];
    } else if (r.key === 'water') {
      const goal = settings.waterGoal || 3500, w = C.waterTotal(day);
      const expected = goal * C.waterPace(settings, date, nowMin);
      if (w < expected - 500) msg = [A('Water check', 'تذكير المياه'), A(`${L(w)} L so far. Aim for about ${L(Math.round(expected / 250) * 250)} L by now.`, `${L(w)} لتر حتى الآن. الهدف حوالي ${L(Math.round(expected / 250) * 250)} لتر الآن.`), { tags: 'droplet' }];
    } else if (r.key === 'burner') {
      const sp = day.supps || {};
      if (sp.burner && !sp.burner2 && (settings.supps || []).some(s => s.id === 'burner2')) msg = [A('Fat burner cutoff', 'آخر موعد لحارق الدهون'), A('Last window for cap 2 today. Nothing within 5 hours of bed.', 'آخر فرصة للكبسولة 2 اليوم. لا شيء قبل النوم بـ5 ساعات.'), { tags: 'hourglass' }];
    } else if (r.key === 'stamina') {
      const st = settings.stamina || {};
      if (st.on !== false && (st.days || []).includes(C.weekday(date))) {
        const actsSnap = await db.collection(`users/${uid}/activities`).where('date', '==', date).get();
        const cardio = actsSnap.docs.some(d => C.CARDIO_TYPES.includes(d.data().type));
        if (!cardio && !(day.stamina || []).length) {
          const week = Math.floor(C.diffDays(settings.startDate, date) / 7) + 1, wk = C.staminaWeek(Math.min(week, 12));
          msg = [A('Stamina today', 'التحمل اليوم'), A(`${wk.phase} week ${week}: ${wk.sessions[0].text} on a machine after lifting. Optional, but it adds up.`, `الأسبوع ${week}: ${trl(wk.sessions[0].text)} على جهاز بعد الحديد. اختياري، لكنه يفرق.`), { tags: 'runner' }];
        }
      }
    } else if (r.key === 'evening') {
      msg = ev.complete ? [A('Locked in', 'مكتمل'), A(`Day ${Math.min(R.dayNum, 90)} is done. Streak ${R.done}.`, `اليوم ${Math.min(R.dayNum, 90)} اكتمل. السلسلة ${R.done}.`), { tags: 'lock' }]
        : [A(`${ev.missing.length} thing${ev.missing.length === 1 ? '' : 's'} left today`, `متبقٍ ${ev.missing.length} اليوم`), ev.missing.map(trl).join('\n'), { tags: 'warning', priority: 4 }];
    } else if (r.key === 'final') {
      if (!ev.complete) msg = [A('1 hour left', 'باقي ساعة'), A(`Missing: ${ev.missing.join(', ')}`, `ناقص: ${ev.missing.map(trl).join('، ')}`), { tags: 'rotating_light', priority: 5 }];
    }
    sent.push(r.id);
    if (msg) await ntfy(msg[0], msg[1], msg[2]);
  }
  if (log0.date !== date || sent.length !== sent0.length) await logRef.set({ date, sent });
}

/* ---------- main ---------- */
// Each person sets their own ntfy topic in the app (Setup → Reminders).
// The NTFY_TOPIC secret is only a fallback for the first person who started using the app.
const users = await db.collection('users').listDocuments();
const all = [];
for (const u of users) { const s = await db.doc(`users/${u.id}/settings/main`).get(); if (s.exists) all.push({ id: u.id, settings: s.data() }); }
const firstUser = all.slice().sort((a, b) => String(a.settings.created || '').localeCompare(String(b.settings.created || '')))[0];
for (const { id, settings } of all) {
  const u = { id };
  CURRENT_TOPIC = settings.ntfyTopic || (firstUser && firstUser.id === id ? TOPIC : null);
  try { await stravaSync(u.id, settings); } catch (e) { console.log('strava error', e.message); }
  try { await reminders(u.id, settings); } catch (e) { console.log('reminder error', e.message); }
}
console.log('tick done', new Date().toISOString());
