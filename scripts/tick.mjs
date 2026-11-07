// Runs every 30 minutes on GitHub Actions: syncs Strava, then sends smart reminders through ntfy.
import admin from 'firebase-admin';
import * as C from '../core.js';

const TZ = 'Africa/Cairo';
const APP_URL = process.env.APP_URL || 'https://hassanabdelshafy21.github.io/lock-in-90/';
const TOPIC = process.env.NTFY_TOPIC;
const TEST = process.env.TEST === 'true';

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

async function ntfy(title, body, { priority = 3, tags = '' } = {}) {
  if (!TOPIC) { console.log('[no NTFY_TOPIC]', title, body); return; }
  const r = await fetch(`https://ntfy.sh/${encodeURIComponent(TOPIC)}`, { method: 'POST', body, headers: { Title: title, Click: APP_URL, Priority: String(priority), Tags: tags } });
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
    if (!snap.exists || !snap.data().trainingDone) await ref.set({ date, trainingDone: true, trainingSource: 'strava' }, { merge: true });
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
  const daysSnap = await db.collection(`users/${uid}/days`).where('date', '>=', C.addDays(settings.startDate, -1)).get();
  const days = {}; daysSnap.forEach(d => { days[d.id] = d.data(); });
  const day = days[date] || {};
  const R = C.computeRun(settings, days, n);
  const ev = C.evalDay(settings, day, date);
  const rm = settings.reminders || {};
  const logRef = db.doc(`users/${uid}/meta/notify`);
  const log = (await logRef.get()).data() || {};
  const sent = log.date === date ? log.sent || [] : [];
  const L = ml => String(C.round(ml / 1000, 2));

  if (TEST) await ntfy('Lock In 90 test', `Notifications work. Day ${Math.min(R.dayNum, 90)} of 90, streak ${R.done}.`, { tags: 'white_check_mark' });

  for (const r of LIST) {
    if (rm[r.key] === false || sent.includes(r.id)) continue;
    if (nowMin < r.t || nowMin > r.t + 150) continue;
    let msg = null;
    if (r.key === 'morning') {
      const tt = C.trainType(settings, date);
      msg = [`Day ${Math.min(R.dayNum, 90)} of 90`, `${C.DAYNAMES[C.weekday(date)]}: ${C.TT[tt].label}. Water goal ${L(settings.waterGoal || 3500)} L.`, R.critical ? 'Yesterday broke the chain. Never miss twice.' : `Streak ${R.done}.`, { tags: 'sunrise' }];
    } else if (r.key === 'water') {
      const goal = settings.waterGoal || 3500, w = day.water || 0;
      const expected = goal * Math.min(1, Math.max(0, (nowMin - at(8, 0)) / (at(22, 0) - at(8, 0))));
      if (w < expected - 500) msg = ['Water check', `${L(w)} L so far. Aim for about ${L(Math.round(expected / 250) * 250)} L by now.`, { tags: 'droplet' }];
    } else if (r.key === 'burner') {
      const sp = day.supps || {};
      if (sp.burner && !sp.burner2 && (settings.supps || []).some(s => s.id === 'burner2')) msg = ['Fat burner cutoff', 'Last window for cap 2 today. Nothing within 5 hours of bed.', { tags: 'hourglass' }];
    } else if (r.key === 'stamina') {
      const st = settings.stamina || {};
      if (st.on !== false && (st.days || []).includes(C.weekday(date))) {
        const actsSnap = await db.collection(`users/${uid}/activities`).where('date', '==', date).get();
        const cardio = actsSnap.docs.some(d => C.CARDIO_TYPES.includes(d.data().type));
        if (!cardio && !(day.stamina || []).length) {
          const week = Math.floor(C.diffDays(settings.startDate, date) / 7) + 1, wk = C.staminaWeek(Math.min(week, 12));
          msg = ['Stamina today', `${wk.phase} week ${week}: ${wk.sessions[0].text} on a machine after lifting. Optional, but it adds up.`, { tags: 'runner' }];
        }
      }
    } else if (r.key === 'evening') {
      msg = ev.complete ? ['Locked in', `Day ${Math.min(R.dayNum, 90)} is done. Streak ${R.done}.`, { tags: 'lock' }]
        : [`${ev.missing.length} thing${ev.missing.length === 1 ? '' : 's'} left today`, ev.missing.join('\n'), { tags: 'warning', priority: 4 }];
    } else if (r.key === 'final') {
      if (!ev.complete) msg = ['1 hour left', `Missing: ${ev.missing.join(', ')}`, { tags: 'rotating_light', priority: 5 }];
    }
    sent.push(r.id);
    if (msg) await ntfy(msg[0], msg[1], msg[2]);
  }
  await logRef.set({ date, sent });
}

/* ---------- main ---------- */
const users = await db.collection('users').listDocuments();
for (const u of users) {
  const s = await db.doc(`users/${u.id}/settings/main`).get();
  if (!s.exists) continue;
  const settings = s.data();
  try { await stravaSync(u.id, settings); } catch (e) { console.log('strava error', e.message); }
  try { await reminders(u.id, settings); } catch (e) { console.log('reminder error', e.message); }
}
console.log('tick done', new Date().toISOString());
