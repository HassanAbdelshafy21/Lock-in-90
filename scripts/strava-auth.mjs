// One-time: exchanges the Strava authorization code for a refresh token and stores it privately in Firestore.
import admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

let code = (process.env.STRAVA_CODE || '').trim();
const m = code.match(/[?&]code=([^&]+)/);
if (m) code = m[1];
if (!code) { console.error('No code given.'); process.exit(1); }

const r = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' })
});
const j = await r.json();
if (!r.ok) { console.error('Strava refused the code:', j.message || r.status, '- codes expire after a few minutes and work once. Get a fresh one and run this again.'); process.exit(1); }

const users = await db.collection('users').listDocuments();
if (!users.length) { console.error('No app user found. Sign in to the app once and finish the welcome screen first.'); process.exit(1); }
for (const u of users) {
  await db.doc(`private/strava_${u.id}`).set({ refresh_token: j.refresh_token, access_token: j.access_token, expires_at: j.expires_at, athlete: { id: j.athlete && j.athlete.id, name: j.athlete && j.athlete.firstname } });
  await db.doc(`users/${u.id}/meta/strava`).set({ ok: true, connected: new Date().toISOString() }, { merge: true });
}
console.log('Strava connected for', j.athlete && j.athlete.firstname, '- activities sync on the next run of the tick job.');
