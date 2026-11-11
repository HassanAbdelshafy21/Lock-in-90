import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, getDoc, deleteDoc, writeBatch, query, where, getDocsFromCache, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import * as C from './core.js';
import { trText, addFoodNames } from './i18n.js';
import * as TR from './train.js';
const APP_VERSION = '30.1 · coach page shows today';
import { EX, POSE, figSVG, YT, LINES, FOODS, COACH_MEALS, DEFAULT_SUPPS, COACH_ENC, SLOTS, CARDIO_MODES } from './data.js';
import { BRANDS, BRAND_BY_CODE } from './brands.js';
addFoodNames(FOODS); addFoodNames(BRANDS);

/* ---------- config ---------- */
const FIREBASE = {
  apiKey: 'AIzaSyDXdQS4eSuuPv375gE18jCze_0or8U3MNk',
  authDomain: 'lock-in-90.firebaseapp.com',
  projectId: 'lock-in-90',
  storageBucket: 'lock-in-90.firebasestorage.app',
  messagingSenderId: '656413235174',
  appId: '1:656413235174:web:0c1d56b230dd6e4c61e827'
};
const USDA_KEY = 'cDpNk6dkgCQwwgfqNQrcP8N7W9JmCtQnPNjFQPNP';
const WATER_OPTS = [3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000];
const VIEWS = ['today', 'train', 'progress', 'setup'];
const REMINDERS = [['morning', '9:00 · Plan for the day'], ['water', 'Every 2 h, 11:00–19:00 · Water pace (only if behind)'], ['burner', '15:30 · Fat burner cutoff (only if cap 1 taken)'], ['stamina', '17:00 · Stamina session (stamina days, if not done)'], ['evening', '20:40 · What’s still missing'], ['final', '23:00 · Last hour warning (only if incomplete)'], ['meals', '45 min after each meal time · Log reminder (off by default)'], ['bedtime', '30 min before bedtime · Wind down (sleep goal)']];

const FBV = '10.14.1', fbApp = initializeApp(FIREBASE);
const auth = getAuth(fbApp);
let db;
try { db = initializeFirestore(fbApp, { ignoreUndefinedProperties: true, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = getFirestore(fbApp); }

/* ---------- state ---------- */
const S = {
  user: null, authReady: false, settings: null, days: {}, checkins: {}, foods: {}, acts: {}, photos: {}, meta: {},
  got: { settings: false, days: false }, pend: { s: false, d: false }, online: navigator.onLine,
  view: 'today', trainTab: null, phase: null, editDate: null, openMeal: null, confirm: null, deferred: false, unsub: [], photosOn: false, cut: 50, board: {}, boardCode: null, boardUnsub: null, boardLast: null
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o ?? {}));
// Firestore rejects arrays inside arrays (food servings are [['cup', 240], ...]); wrap inner arrays on write, unwrap on read
const plainObj = v => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const fsEnc = v => Array.isArray(v) ? v.map(x => Array.isArray(x) ? { _a: fsEnc(x) } : fsEnc(x)) : plainObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fsEnc(x)])) : v;
const fsDec = v => Array.isArray(v) ? v.map(fsDec) : plainObj(v) ? (Object.keys(v).length === 1 && Array.isArray(v._a) ? v._a.map(fsDec) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fsDec(x)]))) : v;
const L = ml => String(C.round(ml / 1000, 2));
const now = () => C.nowIn(undefined, S.settings && S.settings.dayStart);
const dsMode = () => C.dayStartMode(S.settings && S.settings.dayStart);
const hoursLeft = n => Math.max(0, Math.ceil((n.end - (n.hour * 60 + n.minute)) / 60));
// label for when the day ends: "Fajr 4:47" or "5:00"
const dayEndTxt = n => `${dsMode() === 'fajr' ? 'Fajr ' : ''}${C.minTxt(n.end - 1440)}`;
const today = () => now().date;
const fmt = s => C.parse(s).toLocaleDateString(LANG() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: LANG() === 'ar' ? 'long' : 'short' });
/* language: Arabic is applied by translating rendered text, so every screen and message is covered without two copies of the UI */
const LANG = () => (S.settings && S.settings.lang) || (() => { try { return localStorage.getItem('lk-lang'); } catch (e) { return null; } })() || 'en';
function trNode(n) {
  if (n.nodeType === 3) { const v = n.nodeValue, core = v.trim(); if (core && /[A-Za-z]/.test(core)) { const r = trText(core); if (r != null) n.nodeValue = v.replace(core, r); } return; }
  if (n.nodeType !== 1 || n.matches('script,style,svg,canvas')) return;
  ['placeholder', 'aria-label', 'title'].forEach(a => { const v = n.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const r = trText(v.trim()); if (r != null) n.setAttribute(a, r); } });
  for (const c of n.childNodes) trNode(c);
}
function applyLang() {
  const ar = LANG() === 'ar';
  document.documentElement.lang = ar ? 'ar' : 'en'; document.documentElement.dir = ar ? 'rtl' : 'ltr';
  if (ar) trNode(document.body);
}
new MutationObserver(ms => { if (LANG() !== 'ar') return; ms.forEach(m => m.addedNodes.forEach(trNode)); }).observe(document.body, { childList: true, subtree: true });
const graceDay = () => { const st = S.settings, y = C.addDays(today(), -1); if (dsMode() !== 'midnight' || now().hour >= 3 || !st || !st.startDate) return null; const a = st.attemptStart && st.attemptStart > st.startDate ? st.attemptStart : st.startDate; return y >= a ? y : null; };
const editDate = () => { const g = graceDay(); return S.editDate && S.editDate === g ? g : today(); };
const uid = () => S.user && S.user.uid;
const up = p => `users/${uid()}/${p}`;
const kc = v => Math.round(v || 0);
const P0 = date => C.pillars(S.settings, S.days[date] || {}, date);
const buzz = p => { try { if (S.settings && S.settings.haptics === false) return; if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } };

/* ---------- writes (debounced, one per document, queued offline by Firestore) ---------- */
const timers = {};
function save(path, get, delay = 400) {
  clearTimeout(timers[path]);
  timers[path] = setTimeout(() => {
    delete timers[path];
    const fail = e => { console.warn('save', path, e); toast(e && e.code === 'permission-denied' ? 'Saving was refused. Check the Firestore rules.' : 'Couldn’t save that change.'); };
    try { setDoc(doc(db, up(path)), stamp(path, fsEnc(clone(get())))).catch(fail); } catch (e) { fail(e); }
  }, delay);
}
const busy = path => !!timers[path];
const SYNCED = ['days/', 'checkins/', 'foods/', 'photos/'];
const stamp = (path, data) => SYNCED.some(p => path.startsWith(p)) ? { ...data, u: serverTimestamp() } : data;
function dayDoc(date) {
  const d = S.days[date] || (S.days[date] = { date });
  d.meals = d.meals || {}; d.skip = d.skip || {}; d.extras = d.extras || []; d.supps = d.supps || {}; d.cali = d.cali || {}; d.stamina = d.stamina || []; d.water = d.water || 0;
  return d;
}
const saveDay = date => save('days/' + date, () => dayDoc(date));
const saveSettings = () => save('settings/main', () => S.settings);
/* ---------- app notifications (Firebase Cloud Messaging, free) ---------- */
const VAPID = 'BGGjjx6TLhuJ1YCGlLJHamFrFtJvMVXL9TkFoMqtu578tH3NupkdLUHZ_P05tUa9KGr995u_RZF5zEDkdjMxKmI';
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function pushState() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return isIOS && !standalone ? 'install' : 'none';
  if (Notification.permission === 'denied') return 'blocked';
  let mine = null; try { mine = localStorage.getItem('lk-push'); } catch (e) { }
  return Notification.permission === 'granted' && mine && ((S.settings.push || {}).tokens || []).includes(mine) ? 'on' : 'off';
}
async function pushOn() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Notifications weren’t allowed.'); return draw(); }
    const reg = await navigator.serviceWorker.ready;
    const { getMessaging, getToken } = await import(`https://www.gstatic.com/firebasejs/${FBV}/firebase-messaging.js`);
    const token = await getToken(getMessaging(fbApp), { vapidKey: VAPID, serviceWorkerRegistration: reg });
    if (!token) throw new Error('no token');
    const p = S.settings.push = S.settings.push || {}; p.tokens = [...new Set([...(p.tokens || []), token])].slice(-5);
    try { localStorage.setItem('lk-push', token); } catch (e) { }
    saveSettings(); toast('Notifications are on for this phone.'); draw();
  } catch (e) { console.warn(e); toast('Couldn’t turn on notifications. Check your internet and try again.'); }
}
function pushOff() {
  let mine = null; try { mine = localStorage.getItem('lk-push'); localStorage.removeItem('lk-push'); } catch (e) { }
  const p = S.settings.push || {}; p.tokens = (p.tokens || []).filter(t => t !== mine); S.settings.push = p; saveSettings(); toast('Notifications off on this phone.'); draw();
}
async function pushTest() {
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification('Lock In 90', { body: 'This is how reminders will look. Real ones come from the reminder job.', icon: 'icons/icon-192.png', badge: 'icons/favicon.png', tag: 'test' });
}
// the plan editor works on the normal plan or the Ramadan plan
const editingRamadan = () => S.planEdit === 'ramadan';
function planMeals() { const st = S.settings; if (editingRamadan()) return st.ramadanMeals || (st.ramadanMeals = clone(C.RAMADAN_MEALS)); return st.meals || (st.meals = []); }
function setPlanMeals(ms) { if (editingRamadan()) S.settings.ramadanMeals = ms; else S.settings.meals = ms; }
function savePlan() {
  const st = S.settings;
  if (editingRamadan()) { st.ramadanLog = st.ramadanLog || {}; st.ramadanLog[today()] = clone(st.ramadanMeals); }
  else { st.planLog = st.planLog || {}; st.planLog[today()] = clone(st.meals); }
  saveSettings();
}
const planHasFood = ms => (ms || []).some(m => (m.items || []).length);
// the most recent saved plan that actually had food in it (kept in the person's own account data)
function lastFullPlan(st) { const log = st.planLog || {}, k = Object.keys(log).sort().reverse().find(d => planHasFood(log[d])); return k ? { k, meals: log[k] } : null; }
async function coachPlan() {
  try {
    const [iv, ct] = COACH_ENC.split('.').map(b => Uint8Array.from(atob(b), c => c.charCodeAt(0)));
    const key = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode(S.user.email.trim().toLowerCase() + '|lockin-coach-v1')), 'AES-GCM', false, ['decrypt']);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)));
  } catch (e) { return null; }
}
async function restoreCoach() {
  const c = isOwner() && await coachPlan(); if (!c) return toast('Couldn’t unlock the coach plan on this account.');
  if (planHasFood(S.settings.meals) && !confirm('Replace your current meal plan with your coach’s plan?')) return;
  S.settings.meals = c.meals; S.settings.planNoted = true; if (!(S.settings.supps || []).length) S.settings.supps = c.supps;
  savePlan(); toast('Your coach’s meal plan is back' + ((S.settings.supps || []).length ? ', with your supplements.' : '.')); draw();
}
function restorePlanCard(st) {
  if (editingRamadan() || planHasFood(st.meals)) return '';
  const lp = lastFullPlan(st); if (!lp) return isOwner() ? `<div class="note2 good restore"><b>Bring back your coach’s plan?</b><span>Your 5 meals and supplement stack, stored privately for your account.</span><button class="btn primary small" data-act="coachrestore">Restore it</button></div>` : '';
  const s = C.sumItems(lp.meals.flatMap(m => m.items || []));
  return `<div class="note2 good restore"><b>Bring back your previous plan?</b><span>${lp.meals.length} meals · ${kc(s.k)} kcal · ${kc(s.p)} g protein, saved ${fmt(lp.k)}</span><button class="btn primary small" data-act="planrestore" data-v="${lp.k}">Restore it</button></div>`;
}
function planHistoryHTML(st) {
  const keys = Object.keys(st.planLog || {}).filter(k => planHasFood(st.planLog[k])).sort();
  if (!keys.length || (keys.length < 2 && planHasFood(st.meals))) return '';
  return `<details><summary class="hint">Plan history (${keys.length} version${keys.length > 1 ? 's' : ''})</summary><ul class="list">${keys.slice().reverse().map(k => { const s = C.sumItems((st.planLog[k] || []).flatMap(m => m.items || [])); return `<li><span>From ${fmt(k)}<small class="sub" style="display:block">${(st.planLog[k] || []).length} meals · ${kc(s.k)} kcal · ${kc(s.p)} g protein</small></span><button class="btn small" data-act="planrestore" data-v="${k}">Use this</button></li>`; }).join('')}</ul></details>`;
}

/* ---------- ui helpers ---------- */
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3400); }
const banner = (kind, title, body, list) => `<div class="banner b-${kind}"><strong>${esc(title)}</strong>${body ? `<p>${esc(body)}</p>` : ''}${list && list.length ? `<ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
const pill = (kind, txt) => `<span class="state s-${kind}">${esc(txt)}</span>`;
const ICON = {
  sun: '<path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 7V4M5.6 10.6 4.2 9.2M18.4 10.6l1.4-1.4"/>',
  plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  apple: '<path d="M12 8.5c-2.2-1.6-6.5-1-6.5 4 0 4 3 8 6.5 7 3.5 1 6.5-3 6.5-7 0-5-4.3-5.6-6.5-4z"/><path d="M12 8.5c0-2.2 1.2-3.8 3.2-4.5"/>',
  cup: '<path d="M5 8h14l-1.6 10.8a2 2 0 0 1-2 1.7H8.6a2 2 0 0 1-2-1.7z"/><path d="M4 8h16M9 5h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const svgI = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
function mealIcon(m, i) {
  const n = (m.items || []).map(x => x.name.toLowerCase()).join(' ');
  if (/yogurt|milk|labneh/.test(n)) return 'cup';
  if (/fruit|apple|banana|orange|guava|mango|grape|berr|melon|kiwi|pear|date/.test(n)) return 'apple';
  return i === 0 ? 'sun' : 'plate';
}
function render() {
  const a = document.activeElement;
  if (a && a.closest && a.closest('main, #panel') && a.matches('input:not([type=file]):not([type=range]),textarea,select')) { S.deferred = true; return; }
  draw();
}
document.addEventListener('focusout', () => setTimeout(() => { if (S.deferred) { S.deferred = false; render(); } }, 0));

/* ---------- top-level draw ---------- */
function draw() {
  if (document.documentElement.lang !== (LANG() === 'ar' ? 'ar' : 'en')) applyLang();
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.v === S.view ? 'page' : 'false'));
  $('tabs').hidden = !S.user || !S.settings;
  const m = $('main');
  if (!S.authReady) { $('top').innerHTML = topIdle(); $('top').parentElement.hidden = false; m.innerHTML = `<div class="card hint">Loading…</div>`; return; }
  if (!S.user) { $('top').innerHTML = topIdle(); $('top').parentElement.hidden = false; m.innerHTML = signinHTML(); return; }
  if (!S.got.settings) { $('top').innerHTML = topIdle(); $('top').parentElement.hidden = false; m.innerHTML = `<div class="card hint">Loading your challenge…</div>`; return; }
  if (!S.settings) { $('top').innerHTML = topIdle(); $('top').parentElement.hidden = false; m.innerHTML = welcomeHTML(); return; }
  if (S.quickWater && S.got.days) { S.quickWater = false; const dd = dayDoc(today()); dd.water = (dd.water || 0) + 250; saveDay(today()); S.view = 'today'; history.replaceState(null, '', '#today'); toast(`+250 ml · ${L(C.waterTotal(dd))} L today`); }
  privacyMigrate();
  if (S.quickSport && S.got.days) { S.quickSport = false; S.view = 'today'; history.replaceState(null, '', '#today'); setTimeout(openSport, 50); }
  const R = C.computeRun(S.settings, S.days, now());
  $('top').innerHTML = ''; $('top').parentElement.hidden = true;
  boardOn(); boardPublish(R); coachPublish(R);
  setTimeout(() => maybeCelebrate(R), 350);
  if (S.view === 'progress' && S.ptab === 'body') photosOn();
  m.innerHTML = S.view === 'train' ? pageHead('Train', R) + trainHTML(R) : S.view === 'progress' ? pageHead('Progress', R) + progressHTML(R) : S.view === 'setup' ? meHTML(R) : todayHTML(R);
  drawPanel();
}
const topIdle = () => `<div class="top-row"><div class="brand"><img src="icons/logo.svg" alt=""><div><div class="daylabel">90-day challenge</div><div class="daynum">LOCK IN</div></div></div></div>`;
function syncDot() { const s = !S.online ? 'off' : (S.pend.s || S.pend.d || Object.keys(timers).length) ? 'pend' : 'ok'; return `<span class="syncdot ${s}" title="${s === 'off' ? 'Offline · saved on phone' : s === 'pend' ? 'Syncing' : 'Synced'}" aria-label="${s === 'off' ? 'Offline, saved on phone' : s === 'pend' ? 'Syncing' : 'Synced'}"></span>`; }
function syncChip() {
  if (!S.online) return `<span class="chip sync off">Offline · saved on phone</span>`;
  if (S.pend.s || S.pend.d || Object.keys(timers).length) return `<span class="chip sync pend">Syncing</span>`;
  return `<span class="chip sync">Synced</span>`;
}
const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 4.7 5.6 4.7 10.3A4.7 4.7 0 0 1 12 17.5a4.7 4.7 0 0 1-4.7-4.7c0-2 1-3.4 2-4.4.2 1.5.9 2.6 2 3.1-.4-3.4.3-6.4.7-9z"/><path d="M12 21.5c-3.9 0-6.5-2.6-6.5-6.2 0-1 .2-2 .6-2.8" opacity=".55"/></svg>';
function flameChip(R) {
  const ev = R.todayEval, risk = hoursLeft(now()) <= 3;
  const st = ev.complete ? 'lit' : risk ? 'risk' : '';
  const tip = ev.complete ? 'Today is locked in' : risk ? 'Streak at risk: finish today' : 'Streak';
  return `<span class="chip flame ${st}" title="${tip}" aria-label="${tip}, streak ${R.done}">${FLAME}<b class="num">${R.done}</b></span>`;
}
function topHTML(R) {
  const t = today();
  return `<div class="top-row"><div><div class="daylabel">Day · attempt ${R.attemptNo}</div><div class="daynum num">${Math.min(R.dayNum, 90)}<small>/ 90</small></div></div>
  <div class="chips">${flameChip(R)}${syncChip()}</div></div>
  <div class="strip" role="img" aria-label="${R.done} of 90 days locked in">${Array.from({ length: 90 }, (_, i) => { const d = C.addDays(R.attemptStart, i); return `<i class="${d <= t && C.evalDay(S.settings, S.days[d], d).complete ? 'd' : d === t ? 't' : ''}"></i>`; }).join('')}</div>`;
}
function bannersHTML(R) {
  let h = '';
  const n = now();
  if (R.victory) return banner('good', '90 days. Done.', `You completed all 90 days on attempt ${R.attemptNo}. Take your Day 90 photo and compare it with Day 1 in Progress.`);
  const ev = R.todayEval;
  if (R.critical && !ev.complete) h += banner('bad', 'Never miss twice', 'Yesterday broke the chain and reset you to Day 1. Today is non-negotiable.');
  if (ev.offPlan) h += banner('bad', 'Today can’t count right now', 'Something off-plan is logged. If it was a mistake, change it back.');
  else if (!ev.complete && n.late && S.view === 'today') { const m = n.end - (n.hour * 60 + n.minute); h += banner('warn', `Still ${C.DAYNAMES[C.weekday(n.date)]} until ${dayEndTxt(n)} (${Math.floor(m / 60)} h ${m % 60} min)`, 'Finish it now and the day locks in. Still missing:', ev.missing); }
  else if (!ev.complete && hoursLeft(n) <= 3 && S.view === 'today') { const left = hoursLeft(n); h += banner('warn', `${left} hour${left === 1 ? '' : 's'} left to lock in today`, 'Still missing:', ev.missing); }
  const m = C.MILES.find(x => x[0] === R.done);
  if (ev.complete && m) h += banner('good', `Milestone: Day ${m[0]}`, `${m[1]}. Keep the chain going.`);
  const rcp = [30, 60].find(c => R.dayNum === c + 1 || (R.dayNum === c && ev.complete));
  if (rcp && S.view === 'today') h += `<div class="banner b-good"><strong>Your Day ${rcp} recap is ready</strong><p><button class="link" data-act="tab" data-v="progress">See it in Progress</button></p></div>`;
  { const b = budgetAt(today()); if (b && b.cut && S.view === 'today') h += `<div class="banner b-info"><strong>Calories today: ${kc(b.target)} instead of ${kc(b.base)}</strong><p>Paying back ${b.debtIn} kcal over plan this week, a little each day. <button class="link" data-act="panel" data-v="meals">See today’s portions</button></p></div>`; }
  if (C.addDays(myWS(today()), 6) === today() && S.view === 'today') h += `<div class="banner b-info"><strong>Weekly review is ready</strong><p><button class="link" data-act="tab" data-v="progress">Open it in Progress</button></p></div>`;
  return h;
}

/* ---------- sign-in and welcome ---------- */
function signinHTML() {
  return `<section class="signin"><button class="langbtn" data-act="lang" data-v="${LANG() === 'ar' ? 'en' : 'ar'}">${LANG() === 'ar' ? 'English' : 'العربية'}</button><img class="signin-logo" src="icons/logo.svg" alt=""><h1>LOCK<br><span>IN 90</span></h1><p class="hint">Sign in once. After that the app works offline and syncs when you’re back online.</p>
  <button class="btn primary block" data-act="signin">Sign in with Google</button>
  <span class="sub">or with email (works in every browser, best on iPhone)</span>
  <form class="form" id="email-form" style="text-align:left"><label class="full">Email<input class="in" id="si-email" type="email" autocomplete="email" required></label>
  <label class="full">Password<input class="in" id="si-pass" type="password" autocomplete="current-password" minlength="6" required></label>
  <button class="btn primary" type="submit" data-mode="in">Sign in</button><button class="btn" type="button" data-act="signup">Create account</button></form>
  <button class="link" data-act="resetpw">Forgot password?</button></section>`;
}
function waterSelect(id, attr, val) { return `<select class="in" id="${id}" ${attr}>${WATER_OPTS.map(v => `<option value="${v}" ${v === val ? 'selected' : ''}>${L(v)} L</option>`).join('')}</select>`; }
function welcomeHTML() {
  return `<section class="card"><div class="card-h"><h2>Start your 90 days</h2><button class="langbtn" data-act="lang" data-v="${LANG() === 'ar' ? 'en' : 'ar'}">${LANG() === 'ar' ? 'English' : 'العربية'}</button></div>
  <p class="hint">Every day needs every planned meal on plan, your water goal, that day’s training and your core supplements. Miss any of them and the counter goes back to Day 1. ${isOwner() ? 'Your coach’s meal plan is already loaded; edit it in Me.' : 'You start with Breakfast, Lunch and Dinner. Add your own meal plan and supplements in Me, or just log what you eat and the app counts the calories.'}</p>
  <div class="form"><label>Start date<input class="in" id="w-start" type="date" value="${today()}" max="${today()}"></label>
  <label>Water goal${waterSelect('w-water', '', 4000)}</label>
  <label>Current weight (kg)<input class="in" id="w-weight" type="number" inputmode="decimal" step="0.1"></label>
  <label>Goal weight (kg)<input class="in" id="w-goal" type="number" inputmode="decimal" step="0.1"></label>
</div>
  <p class="hint">Your daily calorie and protein targets come from the meal plan automatically.</p>
  <button class="btn primary block" data-act="start">Start Day 1</button>
  <p class="hint">Moving from the old app? <label class="link" for="imp-file">Import a backup file</label> instead.</p>
  <input id="imp-file" type="file" accept="application/json,.json" hidden></section>`;
}
/* The coach's meal plan and supplement stack are Hassan's. Everyone else starts blank and builds their own. */
// the owner is recognised by a hash of their email, so the address never appears in this public code
const OWNER_H = '25bbdd0985a3bd037c694f00ed3a9ee8b2d6536e26a917f230affc7600ec1f2e';
const isOwner = () => !!(S.user && S.ownerFor === S.user.uid && S.ownerOk);
async function checkOwner(u) { S.ownerFor = u ? u.uid : null; S.ownerOk = false; if (!u || !u.email || !crypto.subtle) return; try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(u.email.trim().toLowerCase())); S.ownerOk = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('') === OWNER_H; if (S.ownerOk) draw(); } catch (e) { } }
const BLANK_MEALS = () => { const ar = LANG() === 'ar'; return [{ id: 'b', name: ar ? 'الفطار' : 'Breakfast', time: '09:00', items: [] }, { id: 'l', name: ar ? 'الغدا' : 'Lunch', time: '14:00', items: [] }, { id: 'd', name: ar ? 'العشا' : 'Dinner', time: '20:00', items: [] }]; };
const STARTER_SUPPS = ['Creatine', 'Omega 3', 'Multivitamin', 'Vitamin D', 'Whey protein', 'Magnesium'];
const mealSig = ms => JSON.stringify((ms || []).map(m => [m.id, (m.items || []).map(i => `${i.fid}:${i.g}`)]));
const COACH_SIG = mealSig(COACH_MEALS);
// one-time clean-up for friends who signed up when the coach plan was the default: keep the meal slots (so past days still count) but drop the foods
function privacyMigrate() {
  const st = S.settings;
  if (isOwner() || !st || st.privMig || !S.got.days) return;
  if (!COACH_MEALS.length) { st.privMig = 1; saveSettings(); return; }
  const strip = ms => ms.map(m => ({ ...m, items: [] }));
  if (mealSig(st.meals) === COACH_SIG) st.meals = strip(st.meals);
  Object.keys(st.planLog || {}).forEach(k => { if (mealSig(st.planLog[k]) === COACH_SIG) st.planLog[k] = strip(st.planLog[k]); });
  const coach = Object.fromEntries(COACH_MEALS.map(m => [m.id, JSON.stringify((m.items || []).map(i => `${i.fid}:${i.g}`))]));
  Object.keys(S.days).forEach(k => {
    const d = S.days[k]; let ch = false;
    Object.entries(d.meals || {}).forEach(([id, md]) => { if (md && md.status === 'plan' && coach[id] && JSON.stringify((md.items || []).map(i => `${i.fid}:${i.g}`)) === coach[id]) { md.items = []; ch = true; } });
    if (ch) saveDay(k);
  });
  st.privMig = 1; saveSettings();
}
function newSettings(o = {}) {
  return {
    startDate: o.startDate || today(), waterGoal: o.waterGoal || 4000, startWeight: o.startWeight || null, goalWeight: o.goalWeight || null,
    plan: { ...C.DEFAULT_PLAN }, gymTime: 'am',
    meals: isOwner() && COACH_MEALS.length ? clone(COACH_MEALS) : BLANK_MEALS(), planLog: { [o.startDate || today()]: isOwner() && COACH_MEALS.length ? clone(COACH_MEALS) : BLANK_MEALS() }, supps: isOwner() ? clone(DEFAULT_SUPPS) : [], stamina: { on: true, days: [1, 3, 5] }, privMig: 1,
    reminders: Object.fromEntries(REMINDERS.map(r => [r[0], r[0] !== 'meals'])), created: new Date().toISOString(), lang: LANG()
  };
}

/* ---------- insights: patterns from your own history ---------- */
function insightsHTML() {
  const st = S.settings, t = today(), from = C.addDays(t, -60) > st.startDate ? C.addDays(t, -60) : st.startDate, days = [];
  for (let dt = from; dt < t; dt = C.addDays(dt, 1)) { const d = S.days[dt] || {}, ev = C.evalDay(st, d, dt); days.push({ dt, d, ev, ok: ev.complete }); }
  const pct = a => a.length ? Math.round(a.filter(x => x.ok).length / a.length * 100) : 0, out = [];
  if (days.length < 10) return `<section class="card"><div class="card-h"><h2>Insights</h2></div><p class="hint">Patterns from your own data appear after about 2 weeks. Log sleep and energy in Body &amp; notes to unlock the sleep ones.</p></section>`;
  // sleep vs locking in
  const sl = days.filter(x => x.d.sleep), hi = sl.filter(x => x.d.sleep >= 7), lo = sl.filter(x => x.d.sleep < 7);
  if (hi.length >= 3 && lo.length >= 3 && Math.abs(pct(hi) - pct(lo)) >= 10) out.push(['😴', `After 7+ hours of sleep you lock in ${pct(hi)}% of days, vs ${pct(lo)}% after less.`]);
  const en = a => { const v = a.filter(x => x.d.energy); return v.length ? v.reduce((s, x) => s + x.d.energy, 0) / v.length : null; }, eh = en(hi), el = en(lo);
  if (eh && el && eh - el >= 0.5) out.push(['⚡', `Your energy averages ${C.round(eh, 1)}/5 after 7+ hours of sleep and ${C.round(el, 1)}/5 after less.`]);
  // commitment
  const cm = days.filter(x => x.d.commit), nc = days.filter(x => !x.d.commit);
  if (cm.length >= 3 && nc.length >= 3 && pct(cm) - pct(nc) >= 10) out.push(['🤝', `Days you tap “Commit”: ${pct(cm)}% locked in, vs ${pct(nc)}% when you skip it.`]);
  // what breaks days
  const miss = { Meals: 0, Water: 0, Training: 0, Supplements: 0 }, bad = days.filter(x => !x.ok);
  bad.forEach(x => { const P = x.ev.P; if (!P.mealsOk) miss.Meals++; if (P.w < P.goal) miss.Water++; if (!P.trained) miss.Training++; if (P.sDone < P.req.length) miss.Supplements++; });
  const worst = Object.entries(miss).sort((a, b) => b[1] - a[1])[0];
  if (bad.length >= 2 && worst[1]) out.push(['🎯', `${worst[0]} is what breaks most of your days (${worst[1]} of ${bad.length} missed days).`]);
  // hardest weekday
  if (days.length >= 14) {
    const by = Array.from({ length: 7 }, () => []); days.forEach(x => by[C.weekday(x.dt)].push(x));
    const all = pct(days), w = by.map((a, i) => [i, a]).filter(([, a]) => a.length >= 2).sort((a, b) => pct(a[1]) - pct(b[1]))[0];
    if (w && pct(w[1]) <= all - 15) out.push(['📅', `${C.DAYNAMES[w[0]]}s are your hardest day: ${w[1].filter(x => x.ok).length} of ${w[1].length} locked in. Plan them the night before.`]);
  }
  // protein target
  const pt = days.filter(x => { const tg = C.planTargets(st, x.d, x.dt).p; return tg > 0 && C.dayTotals(st, x.d).k > 0; });
  if (pt.length >= 7) { const hit = pt.filter(x => C.dayTotals(st, x.d).p >= C.planTargets(st, x.d, x.dt).p * 0.95).length; out.push(['🥩', `You hit your protein target on ${hit} of ${pt.length} logged days.`]); }
  // weekend calories (Fri/Sat)
  const kd = days.filter(x => C.dayTotals(st, x.d).k > 0), we = kd.filter(x => [5, 6].includes(C.weekday(x.dt))), wd = kd.filter(x => ![5, 6].includes(C.weekday(x.dt)));
  const avg = a => a.reduce((s, x) => s + C.dayTotals(st, x.d).k, 0) / a.length;
  if (we.length >= 2 && wd.length >= 4 && Math.abs(avg(we) - avg(wd)) >= 150) out.push(['🍽️', `You eat about ${kc(Math.abs(avg(we) - avg(wd)))} kcal ${avg(we) > avg(wd) ? 'more' : 'less'} on Fri/Sat than on other days.`]);
  // reasons for missed days and craving outcomes
  const why = {}; days.forEach(x => { if (!x.ok && x.d.missWhy && x.d.missWhy !== 'skip') why[x.d.missWhy] = (why[x.d.missWhy] || 0) + 1; });
  const tw = Object.entries(why).sort((a, b) => b[1] - a[1])[0];
  if (tw && tw[1] >= 2) out.push(['🧭', `Your most common reason for a missed day: ${(MISS_WHY.find(m => m[0] === tw[0]) || [, tw[0]])[1]} (${tw[1]} times). Add an if-then plan for it in Me.`]);
  const cr = days.flatMap(x => x.d.cravings || []);
  if (cr.length >= 3) out.push(['🌊', `You used the craving tool ${cr.length} times and it passed ${cr.filter(c => c.out === 'passed').length} times.`]);
  return `<section class="card"><div class="card-h"><h2>Insights</h2><span class="hint">Last ${days.length} days</span></div>${out.length ? `<div class="insights">${out.slice(0, 5).map(([i, s]) => `<div class="ins"><span>${i}</span><p>${esc(s)}</p></div>`).join('')}</div>` : '<p class="hint">No strong patterns yet. Keep logging sleep and energy; insights show up when the difference is real.</p>'}</section>`;
}
function measuresHTML(cks) {
  const keys = [['waist', 'Waist'], ['chest', 'Chest'], ['arm', 'Arm'], ['hips', 'Hips'], ['neck', 'Neck']];
  const rows = keys.map(([k, lbl]) => {
    const pts = cks.filter(c => c[k] > 0).map(c => [c.date, c[k]]); if (pts.length < 2) return '';
    const vs = pts.map(p => p[1]), lo = Math.min(...vs), hi = Math.max(...vs), W = 120, H = 32, x = i => 4 + i / (pts.length - 1) * (W - 8), y = v => hi === lo ? H / 2 : 4 + (hi - v) / (hi - lo) * (H - 8);
    const dl = vs[vs.length - 1] - vs[0], tone = k === 'waist' || k === 'hips' ? (dl <= 0 ? 'up' : 'down') : k === 'arm' && dl > 0 ? 'up' : '';
    return `<div class="meas"><b>${lbl}</b><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--accent-strong)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(pts.length - 1)}" cy="${y(vs[vs.length - 1])}" r="3" fill="var(--spark)"/></svg><span class="num">${vs[0]} → ${vs[vs.length - 1]} cm</span><span class="num ${tone}">${dl > 0 ? '+' : dl < 0 ? '−' : ''}${C.round(Math.abs(dl), 1)}</span></div>`;
  }).join('');
  return rows ? `<div class="measures"><span class="sub">Measurements since ${fmt(cks[0].date)}</span>${rows}</div>` : '';
}
async function shareWeekImage() {
  const rv = weekReview(), aw = activityWeek(), t = today(), st = S.settings, hit = k => rv.past - rv.miss[k];
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  try { await document.fonts.load('800 40px Alexandria'); await document.fonts.ready; } catch (e) { }
  const NAVY = '#14213D', NAVY2 = '#1F2E52', SPARK = '#F2B33D', GOOD = '#4ADE9B', CREAM = '#FFFFFF', MUTE = '#9FB0D0', DISP = 'Alexandria,sans-serif', MONO = 'Alexandria,sans-serif', BODY = 'Alexandria,sans-serif';
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, NAVY2); grd.addColorStop(1, NAVY); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = MUTE; g.font = `500 30px ${MONO}`; g.fillText('LOCK IN 90 · WEEKLY REPORT', 80, 110);
  g.fillStyle = CREAM; let fs = 64; const head = `${boardName().toUpperCase()} · WEEK ENDING ${fmt(t).toUpperCase()}`; do { g.font = `700 ${fs}px ${DISP}`; fs -= 2; } while (g.measureText(head).width > W - 160 && fs > 30); g.fillText(head, 80, 190);
  g.fillStyle = SPARK; g.font = `800 230px ${DISP}`; g.fillText(`${rv.locked}/${rv.n}`, 72, 420);
  g.fillStyle = CREAM; g.font = `700 52px ${DISP}`; g.fillText('DAYS FULLY ON PLAN', 80, 490);
  for (let i = 6; i >= 0; i--) { const dt = C.addDays(t, -i), ok = C.evalDay(st, S.days[dt], dt).complete, x = 80 + (6 - i) * 132; g.fillStyle = ok ? GOOD : dt === t ? 'rgba(232,174,79,.35)' : 'rgba(255,255,255,.12)'; rr(g, x, 530, 112, 112, 22); g.fill(); g.fillStyle = ok ? '#0E2A1B' : MUTE; g.font = `600 28px ${MONO}`; g.textAlign = 'center'; g.fillText(C.DAYNAMES[C.weekday(dt)].slice(0, 3).toUpperCase(), x + 56, 596); g.textAlign = 'left'; }
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '') + C.round(Math.abs(v), 1);
  const cells = [
    ['WEIGHT (7-DAY AVG)', rv.wNow ? `${C.round(rv.wNow, 1)} kg` : '—', rv.wDelta != null ? `${sg(rv.wDelta)} kg vs last week` : ''],
    ['AVG CALORIES', rv.kcal ? `${kc(rv.kcal)}` : '—', rv.tk ? `plan ${kc(rv.tk)}` : ''],
    ['AVG PROTEIN', rv.prot ? `${kc(rv.prot)} g` : '—', rv.tp ? `plan ${kc(rv.tp)} g` : ''],
    ['PILLARS HIT', rv.past ? `${hit('Meals')}·${hit('Water')}·${hit('Training')}·${hit('Supplements')}` : '—', rv.past ? `meals·water·train·supps of ${rv.past}` : ''],
    ['ACTIVITY', aw.min ? `${aw.min} min` : '—', aw.kcal ? `sports ≈ ${kc(aw.kcal)} kcal` : rv.cardio ? `${rv.cardio} min cardio` : 'no sports or cardio logged'],
    ['AVG SLEEP', rv.sleep ? `${C.round(rv.sleep, 1)} h` : '—', '']
  ];
  cells.forEach(([k, v, s], i) => { const x = 80 + (i % 2) * 470, y = 720 + Math.floor(i / 2) * 190; g.fillStyle = 'rgba(255,255,255,.07)'; rr(g, x, y, 450, 170, 22); g.fill(); g.fillStyle = MUTE; g.font = `500 24px ${MONO}`; g.fillText(k, x + 28, y + 46); g.fillStyle = CREAM; g.font = `700 64px ${DISP}`; g.fillText(v, x + 28, y + 116); g.fillStyle = MUTE; g.font = `400 24px ${BODY}`; g.fillText(s, x + 28, y + 152); });
  const blob = await new Promise(r => cv.toBlob(r, 'image/png')), file = new File([blob], `lock-in-week-${t}.png`, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `Week ending ${fmt(t)}` }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Image saved. Send it from your gallery.');
}

/* ---------- monthly report ---------- */
const prevMonth = () => { const d = C.parse(today()); d.setDate(0); return `${d.getFullYear()}-${C.pad(d.getMonth() + 1)}`; };
const monthName = mk => new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1, 1).toLocaleDateString(LANG() === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long' });
function monthData(mk) {
  const from = mk + '-01', end = (() => { const d = new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0); return `${mk}-${C.pad(d.getDate())}`; })(), to = end > today() ? today() : end, st = S.settings;
  let locked = 0, n = 0; const ws = [];
  for (let d = from; d <= to; d = C.addDays(d, 1)) { if (d < st.startDate) continue; n++; if (C.evalDay(st, S.days[d], d).complete) locked++; if (S.days[d] && S.days[d].weight) ws.push(S.days[d].weight); }
  const ms = TR.monthStats(from, to), r1 = TR.rankOf(C.addDays(to, 1)), r0 = TR.rankOf(from);
  return { mk, from, to, locked, n, wDelta: ws.length > 1 ? C.round(ws[ws.length - 1] - ws[0], 1) : null, ...ms, rank: r1 && r1.name, rank0: r0 && r0.name };
}
function monthCardHTML() {
  const mk = prevMonth(); if (mk + '-31' < S.settings.startDate) return '';
  return `<section class="card monthcard"><div class="spread"><div><span class="sub">Monthly report</span><h3>${esc(monthName(mk))}</h3></div><button class="btn primary small" data-act="monthrep" data-v="${mk}">Share image</button></div></section>`;
}
async function shareMonthImage(mk) {
  const m = monthData(mk), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  try { await document.fonts.load('800 40px Alexandria'); await document.fonts.ready; } catch (e) { }
  const F = 'Alexandria,sans-serif', grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#1F2E52'); grd.addColorStop(1, '#14213D'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = '#9FB0D0'; g.font = `500 30px ${F}`; g.fillText(`LOCK IN 90 · ${monthName(mk).toUpperCase()}`, 80, 110);
  g.fillStyle = '#fff'; { const tt = `${boardName()}'s month`; let fs = 76; do { g.font = `800 ${fs}px ${F}`; fs -= 4; } while (g.measureText(tt).width > W - 160 && fs > 36); g.fillText(tt, 80, 205); }
  const cells = [[`${m.locked}`, `Days locked in (of ${m.n})`], [`${m.wos}`, 'Workouts'], [`${C.round(m.vol / 1000, 1)} t`, 'Total lifted'], [m.wDelta == null ? '—' : `${m.wDelta > 0 ? '+' : ''}${m.wDelta} kg`, 'Weight change'], [`${m.cmin}`, 'Cardio and sport minutes'], [m.rank || '—', m.rank0 && m.rank0 !== m.rank ? `Strength rank (was ${m.rank0})` : 'Strength rank']];
  cells.forEach(([v, k], i) => { const x = 80 + (i % 2) * 470, y = 270 + Math.floor(i / 2) * 200; g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, x, y, 450, 176, 26); g.fill(); g.fillStyle = '#fff'; let fs = 72; do { g.font = `800 ${fs}px ${F}`; fs -= 4; } while (g.measureText(v).width > 390 && fs > 30); g.fillText(v, x + 30, y + 98); g.fillStyle = '#9FB0D0'; g.font = `500 26px ${F}`; g.fillText(k, x + 30, y + 145); });
  let y = 900; g.fillStyle = 'rgba(242,179,61,.16)'; rr(g, 80, y, 920, 190, 26); g.fill(); g.fillStyle = '#F2B33D'; g.font = `800 40px ${F}`; g.fillText(`${m.recs} new record${m.recs === 1 ? '' : 's'}`, 112, y + 62);
  g.fillStyle = '#fff'; g.font = `500 28px ${F}`; (m.best3.length ? m.best3 : ['Keep logging your sets']).forEach((t, i) => { let s = t; while (g.measureText(s).width > 850 && s.length > 4) s = s.slice(0, -2); g.fillText(s, 112, y + 110 + i * 36); });
  y = 1140; g.fillStyle = '#C9D3E8'; g.font = `500 28px ${F}`; if (m.most.length) g.fillText(`Most trained: ${m.most.join(', ').toLowerCase()}`, 80, y); g.fillText(`Least trained: ${m.least.join(', ').toLowerCase()}`, 80, y + 44);
  g.fillStyle = '#F2B33D'; rr(g, 80, 1240, 250, 64, 32); g.fill(); g.fillStyle = '#14213D'; g.font = `800 30px ${F}`; g.fillText(`Day ${Math.min(C.computeRun(S.settings, S.days, now()).dayNum, 90)}`, 112, 1283);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png')), file = new File([blob], `lock-in-${mk}.png`, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `${monthName(mk)} on Lock In 90` }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Image saved. Send it from your gallery.');
}

/* ---------- start over (choose what to clear) ---------- */
function openStartOver() { S.so = { preset: 'attempt', days: false, wo: false, body: false, plans: false, attempts: false, tell: !!S.settings.group, typed: '' }; drawStartOver(); }
function soCounts() {
  const t = today(); let days = 0, wos = 0;
  Object.entries(S.days).forEach(([k, d]) => { if (k > t) return; if ((d.meals && Object.keys(d.meals).length) || d.water || (d.extras || []).length) days++; if (d.wo) wos++; });
  return { days, wos, photos: Object.keys(S.photos || {}).length, checkins: Object.keys(S.checkins || {}).length };
}
function drawStartOver() {
  const o = S.so, R = C.computeRun(S.settings, S.days, now()), del = o.days || o.wo || o.body || o.plans, n = soCounts();
  const ck = (k, l, d) => `<button class="ck" data-act="so-tog" data-v="${k}" aria-pressed="${!!o[k]}"><i>${o[k] ? '✓' : ''}</i><span><b>${l}</b><small>${d}</small></span></button>`;
  SH = { scope: 'so' }; $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Start over"><div class="grab" aria-hidden="true"></div><div class="spread"><h2>Start over</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div><p class="hint">Pick what to clear. You’re on attempt ${R.attemptNo}, day ${Math.min(R.dayNum, 90)}.</p>
  <div class="pre"><button data-act="so-pre" data-v="attempt" aria-pressed="${o.preset === 'attempt'}"><b>New attempt</b><small>Day 1 again, keep all history</small></button><button data-act="so-pre" data-v="clean" aria-pressed="${o.preset === 'clean'}"><b>Clean slate</b><small>Clear everything except your group</small></button></div>
  <div class="ck lockd"><i>✓</i><span><b>Restart the 90 days</b><small>Day 1 starts today. Always included.</small></span></div>
  ${ck('attempts', 'Reset the attempt count', 'Back to attempt 1, as if you never started (good after testing)')}
  ${ck('days', 'Logged days', 'Meals, water, supplements, notes, sleep')}${ck('wo', 'Workouts', 'Sets, records, cardio and sports')}${ck('body', 'Body', 'Weight, measurements, check-ins and progress photos')}${ck('plans', 'My plans', 'Meal plan, supplements, training plan, if-then plans')}
  ${S.settings.group ? ck('tell', 'Tell my group', `Friends see “${esc(boardName())} started over” and get a notification`) : ''}
  <div class="keep"><b>Always kept:</b> your account, ${S.settings.group ? `group ${esc(S.settings.group)} and friends, ` : ''}notifications, language and coach link.</div>
  ${del ? `<p class="hint danger-t"><b>This deletes ${[o.days && `${n.days} logged days`, o.wo && `${n.wos} workouts`, o.body && `${n.photos} photos and ${n.checkins} check-ins`, o.plans && 'your plans'].filter(Boolean).join(', ')} for good.</b> <button class="link" data-act="export">Download a backup first</button></p><input class="in" id="so-type" placeholder="Type DELETE to confirm" autocomplete="off" autocapitalize="characters" value="${esc(o.typed)}">` : ''}
  <button class="btn ${del ? 'danger' : 'primary'} block" data-act="so-go" ${del && o.typed.trim().toUpperCase() !== 'DELETE' ? 'disabled' : ''} id="so-go">${del ? 'Delete and start over' : `Start attempt ${o.attempts ? 1 : R.attemptNo + 1}`}</button></div>`;
}
async function startOverAct(act, v) {
  const o = S.so; if (!o) return;
  if (act === 'so-pre') { Object.assign(o, v === 'clean' ? { preset: 'clean', days: true, wo: true, body: true, plans: true, attempts: true } : { preset: 'attempt', days: false, wo: false, body: false, plans: false, attempts: false }); o.typed = ''; return drawStartOver(); }
  if (act === 'so-tog') { o[v] = !o[v]; o.preset = o.days && o.wo && o.body && o.plans ? 'clean' : !o.days && !o.wo && !o.body && !o.plans ? 'attempt' : 'custom'; return drawStartOver(); }
  if (act !== 'so-go') return;
  const del = o.days || o.wo || o.body || o.plans; if (del && o.typed.trim().toUpperCase() !== 'DELETE') return;
  const R = C.computeRun(S.settings, S.days, now()), st = S.settings, t = today(), writes = [];
  if (o.days || o.wo || o.body) {
    Object.entries(S.days).forEach(([k, d]) => {
      const nd = { date: k };
      const KEEP_WO = ['wo', 'stamina', 'sports', 'cali'], KEEP_BODY = ['weight', 'waist', 'rhr'];
      if (!o.days) Object.keys(d).forEach(f => { if (!KEEP_WO.includes(f) && !KEEP_BODY.includes(f)) nd[f] = d[f]; });
      if (!o.wo) KEEP_WO.forEach(f => { if (d[f] != null) nd[f] = d[f]; });
      if (!o.body) KEEP_BODY.forEach(f => { if (d[f] != null) nd[f] = d[f]; });
      S.days[k] = nd; writes.push(['days/' + k, nd]);
    });
  }
  if (o.wo) { Object.keys(S.acts || {}).forEach(k => { deleteDoc(doc(db, up('activities/' + k))).catch(() => { }); delete S.acts[k]; }); }
  if (o.body) { Object.keys(S.checkins || {}).forEach(k => { writes.push(['checkins/' + k, { deleted: true }]); delete S.checkins[k]; }); Object.keys(S.photos || {}).forEach(k => { writes.push(['photos/' + k, { deleted: true }]); delete S.photos[k]; }); }
  if (o.plans) { st.meals = BLANK_MEALS(); st.planLog = { ...(st.planLog || {}), [t]: BLANK_MEALS() }; st.supps = []; st.train = null; st.ifthen = []; st.focus = {}; st.planNoted = false; }
  st.attemptBase = o.attempts ? 0 : R.attemptNo; st.startDate = t; delete st.attemptStart;
  if (o.days || o.wo) { st.cheered = {}; }
  const newAttempt = o.attempts ? 1 : R.attemptNo + 1;
  if (o.tell && st.group) st.resetNote = { date: t, attempt: newAttempt }; else delete st.resetNote;
  for (let i = 0; i < writes.length; i += 400) { const bt = writeBatch(db); writes.slice(i, i + 400).forEach(([p, v]) => bt.set(doc(db, up(p)), stamp(p, clone(v)))); try { await bt.commit(); } catch (e) { toast('Part of the reset didn’t save. Try again online.'); } }
  saveSettings();
  if (o.tell && st.group) { Object.keys(S.board || {}).filter(id => id !== uid()).forEach(id => setDoc(doc(db, `groups/${st.group}/members/${id}/cheers/${uid()}_${t}_reset`), { from: uid(), name: boardName(), kind: 'reset', date: t, at: Date.now(), pushed: false, attempt: newAttempt }).catch(() => { })); S.boardLast = null; }
  S.so = null; S.meSec = null; closeSheet(); toast(`Attempt ${newAttempt}. Day 1 is today.`); go('today');
}

/* ---------- if-then plans (implementation intentions) + reflection after a miss ---------- */
const IFT_SUGGEST = [
  ['there’s a family lunch or an invitation', 'I eat my plan portion first, take one small plate and skip seconds'],
  ['I eat out with friends', 'I order grilled protein with salad and drink water or zero soda'],
  ['I get hungry late at night', 'I drink 500 ml of water and have my planned snack, or wait 10 minutes'],
  ['there are sweets at work or a birthday', 'I say “no thanks, I’m on a challenge” and have tea or coffee'],
  ['it’s a travel day', 'I pack my meals and supplements the night before'],
  ['I’m too tired to train', 'I do the warm-up only; if I still want to stop after 10 minutes, I can']
];
const MISS_WHY = [['social', 'Social event'], ['travel', 'Travel'], ['hunger', 'Hunger or cravings'], ['time', 'No time'], ['forgot', 'Forgot to log'], ['motivation', 'Low motivation'], ['sick', 'Sick'], ['other', 'Other']];
const WHY_SUGGEST = { social: 0, hunger: 2, travel: 4, motivation: 5, time: 5 };
const dayPlans = date => (S.settings.ifthen || []).filter(p => p.day !== null && p.day !== undefined && p.day !== '' && +p.day === C.weekday(date));
const anyPlans = () => (S.settings.ifthen || []).filter(p => p.day === null || p.day === undefined || p.day === '');
function ifThenTodayHTML(date) {
  const list = dayPlans(date);
  if (!list.length) return '';
  return `<section class="card ifthen"><span class="sub">Your plan for ${C.DAYNAMES[C.weekday(date)]}</span>${list.map(p => `<p><b>If</b> ${esc(p.when)}, <b>then</b> ${esc(p.then)}.</p>`).join('')}</section>`;
}
function reflectHTML(R) {
  const n = now(), t = today(), y = C.addDays(t, -1);
  if ((dsMode() === 'midnight' && n.hour < 3) || y < S.settings.startDate) return '';
  const yd = S.days[y] || {};
  if (C.evalDay(S.settings, yd, y).complete) return '';
  if (yd.missWhy && yd.missWhy !== 'pending') {
    const si = WHY_SUGGEST[yd.missWhy];
    if (si == null || yd.missPlanned || (S.settings.ifthen || []).some(p => p.when === IFT_SUGGEST[si][0])) return '';
    const [w, th] = IFT_SUGGEST[si];
    return `<section class="card reflect"><span class="sub">Plan for next time</span><p><b>If</b> ${esc(w)}, <b>then</b> ${esc(th)}.</p><div class="row"><button class="btn primary" data-act="iftsugadd" data-v="${si}">Save this if-then plan</button><button class="btn ghost" data-act="missplanned">No thanks</button></div></section>`;
  }
  if (yd.missWhy) return '';
  return `<section class="card reflect"><span class="sub">Yesterday didn’t count</span><h3>What got in the way?</h3><p class="hint">One tap. No judgement: it’s data for your next plan.</p><div class="chips">${MISS_WHY.map(([k, l]) => `<button class="chip2" data-act="misswhy" data-v="${k}">${esc(l)}</button>`).join('')}</div><button class="link" data-act="misswhy" data-v="skip">Skip</button></section>`;
}
function ifThenSetupHTML(st) {
  const list = st.ifthen || [];
  return `<section class="card" id="sec-ift"><div class="card-h"><h2>If-then plans</h2>${pill('opt', `${list.length} saved`)}</div>
  <p class="hint">Decide now what you’ll do in your riskiest moments. Plans tied to a weekday show up on Today that day; “any day” plans show in the craving tool.</p>
  ${list.length ? `<ul class="list">${list.map((p, i) => `<li><span><b>If</b> ${esc(p.when)}, <b>then</b> ${esc(p.then)}.<small>${p.day === null || p.day === undefined || p.day === '' ? 'Any day' : C.DAYNAMES[+p.day]}</small></span><button class="link danger" data-act="iftdel" data-v="${i}">Delete</button></li>`).join('')}</ul>` : ''}
  <span class="sub">Ideas</span><div class="chips">${IFT_SUGGEST.map(([w], i) => `<button class="chip2" data-act="iftsug" data-v="${i}">${esc(w)}</button>`).join('')}</div>
  <div class="form"><label class="full">If…<input class="in" id="ift-when" maxlength="80" placeholder="e.g. there’s koshari at family lunch"></label><label class="full">Then I will…<input class="in" id="ift-then" maxlength="120" placeholder="e.g. eat my plan first and take one small plate"></label>
  <label>Which day<select class="in" id="ift-day"><option value="">Any day</option>${[6, 0, 1, 2, 3, 4, 5].map(i => `<option value="${i}">${C.DAYNAMES[i]}</option>`).join('')}</select></label><button class="btn primary" data-act="iftnew">Save plan</button></div></section>`;
}

/* ---------- craving tool: a 10-minute guided wait ---------- */
const CRAVE = [['sweets', '🍫', 'Sweets'], ['fastfood', '🍔', 'Fast food'], ['salty', '🥨', 'Salty snacks'], ['bread', '🥖', 'Bread or carbs'], ['soda', '🥤', 'Soda or juice'], ['other', '❓', 'Something else']];
const CRAVE_TIPS = ['Drink a big glass of water first. Thirst often feels like hunger.', 'Breathe in for 4, out for 6. Do it five times.', 'Notice where you feel the craving. Name it; don’t fight it.', 'Cravings rise and fall like a wave. Most fade within 10 to 15 minutes.', 'Ask yourself: what would Day 90 me do right now?'];
function openCrave() { if (SH && SH.iv) clearInterval(SH.iv); SH = { scope: 'crave', step: 'pick', what: 'sweets', lvl: 3 }; $('sheet').hidden = false; drawCrave(); }
function drawCrave() {
  const s = SH, head = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Craving"><div class="spread"><h2>Craving</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>`;
  if (s.step === 'pick') {
    $('sheet').innerHTML = head + `<p class="hint">Give it 10 minutes before you decide. Most cravings pass on their own.</p>
    <div class="sgrid">${CRAVE.map(([k, ic, l]) => `<button class="sp" data-act="crwhat" data-v="${k}" aria-pressed="${s.what === k}"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>
    <span class="sub">How strong</span><div class="seg wide" role="group" aria-label="Strength">${[1, 2, 3, 4, 5].map(v => `<button data-act="crlvl" data-v="${v}" aria-pressed="${s.lvl === v}">${v}</button>`).join('')}</div>
    <button class="btn primary block" data-act="crstart" style="margin-top:12px">Start the 10-minute wait</button></div>`;
    return;
  }
  if (s.step === 'wait') {
    const plans = anyPlans().slice(0, 2);
    $('sheet').innerHTML = head + `<div class="crwait"><div class="crt num" id="cr-t">10:00</div><p class="crtip" id="cr-tip">${esc(CRAVE_TIPS[0])}</p></div>
    <div class="row"><button class="btn wat" data-act="crwater">+ 500 ml water</button></div>
    ${plans.length ? `<span class="sub">Your plans</span>${plans.map(p => `<p class="hint"><b>If</b> ${esc(p.when)}, <b>then</b> ${esc(p.then)}.</p>`).join('')}` : ''}
    <div class="row"><button class="btn good" data-act="crend" data-v="passed">It passed</button><button class="btn ghost" data-act="crend" data-v="ate">I’m going to eat it</button></div></div>`;
    s.start = s.start || Date.now();
    clearInterval(s.iv);
    s.iv = setInterval(() => {
      if (!SH || SH !== s) return clearInterval(s.iv);
      const left = Math.max(0, 600 - Math.floor((Date.now() - s.start) / 1000)), el = $('cr-t'), tip = $('cr-tip');
      if (el) el.textContent = `${Math.floor(left / 60)}:${C.pad(left % 60)}`;
      if (tip) { const txt = CRAVE_TIPS[Math.min(CRAVE_TIPS.length - 1, Math.floor((600 - left) / 120))]; if (tip.dataset.k !== txt) { tip.dataset.k = txt; tip.textContent = txt; } }
      if (!left) { clearInterval(s.iv); beep(2); buzz([60, 60, 60]); s.step = 'ask'; drawCrave(); }
    }, 500);
    return;
  }
  $('sheet').innerHTML = head + `<h3 class="crq">10 minutes done. Is it still there?</h3><div class="row"><button class="btn good" data-act="crend" data-v="passed">It passed</button><button class="btn ghost" data-act="crend" data-v="ate">I still want it</button></div></div>`;
}
function cravingLog(out) {
  const date = editDate(), dd = dayDoc(date), s = SH, n = now();
  dd.cravings = [...(dd.cravings || []), { what: s.what, lvl: s.lvl, out, min: Math.round((Date.now() - (s.start || Date.now())) / 60000), at: `${C.pad(n.clock)}:${C.pad(n.minute)}` }];
  saveDay(date);
}

/* ---------- weekly focus goal ---------- */
const FOCUS = {
  sleep: { name: 'Sleep 7+ hours on 5 nights', target: 5, count: ds => ds.filter(([, d]) => d.sleep >= 7).length },
  cardio: { name: '3 cardio or sport sessions', target: 3, count: (ds, from, to) => stamSessions(from, to).length + ds.reduce((s, [, d]) => s + (d.sports || []).length, 0) },
  commit: { name: 'Tap Commit every morning', target: 7, count: ds => ds.filter(([, d]) => d.commit).length },
  weigh: { name: 'Weigh in on 5 mornings', target: 5, count: ds => ds.filter(([, d]) => d.weight).length },
  clean: { name: 'No off-plan food all week', target: 7, count: ds => ds.filter(([dt, d]) => dt <= today() && (d.meals || d.extras) && !(d.extras || []).some(x => x.off) && !Object.values(d.meals || {}).some(m => m && m.status === 'off')).length },
  protein: { name: 'Hit your protein target on 5 days', target: 5, count: ds => ds.filter(([dt, d]) => { const tg = C.planTargets(S.settings, d, dt).p; return tg > 0 && C.dayTotals(S.settings, d).p >= tg * 0.95; }).length },
  note: { name: 'Write a short note every evening', target: 7, count: ds => ds.filter(([, d]) => d.note).length },
  craving: { name: 'Use the craving tool instead of giving in', target: 3, count: ds => ds.reduce((s, [, d]) => s + (d.cravings || []).filter(c => c.out === 'passed').length, 0) }
};
const myWS = d => C.myWeekStart(S.settings, d);
const myWeekNo = d => Math.floor(C.diffDays(myWS(S.settings.startDate), myWS(d)) / 7) + 1;
function focusWeek() { const w = myWeekNo(today()), from = myWS(today()), to = C.addDays(from, 6); const ds = []; for (let dt = from; dt <= to; dt = C.addDays(dt, 1)) ds.push([dt, S.days[dt] || {}]); return { w, from, to, ds, key: 'w' + w }; }
function focusHit(from) { const end = C.addDays(from, 6) > today() ? today() : C.addDays(from, 6), w = myWeekNo(end), a = myWS(end), b = C.addDays(a, 6), cur = (S.settings.focus || {})['w' + w], f = cur && FOCUS[cur.id]; if (!f) return false; const ds = []; for (let dt = a; dt <= b; dt = C.addDays(dt, 1)) ds.push([dt, S.days[dt] || {}]); return f.count(ds, a, b) >= f.target; }
function focusSuggest() {
  const t = today(), last = []; for (let i = 1; i <= 7; i++) last.push(S.days[C.addDays(t, -i)] || {});
  const sl = last.filter(d => d.sleep); if (!sl.length || sl.reduce((a, d) => a + d.sleep, 0) / sl.length < 7) return 'sleep';
  if (last.reduce((s, d) => s + (d.sports || []).length + (d.stamina || []).length, 0) < 3) return 'cardio';
  if (last.filter(d => d.commit).length < 5) return 'commit';
  return 'clean';
}
function focusHTML() {
  const fw = focusWeek(), cur = (S.settings.focus || {})[fw.key];
  if (!cur) { const sg = focusSuggest(); return `<section class="card focus"><span class="sub">Week ${fw.w} focus</span><h3>Pick one extra goal for this week</h3><p class="hint">Suggested from your last 7 days: <b>${esc(FOCUS[sg].name)}</b></p><div class="row"><button class="btn primary" data-act="focusset" data-v="${sg}">Use this</button><button class="btn ghost" data-act="focuspick">Choose another</button></div></section>`; }
  const f = FOCUS[cur.id]; if (!f) return '';
  const n = f.count(fw.ds, fw.from, fw.to), done = n >= f.target;
  return `<button class="focusline${done ? ' done' : ''}" data-act="focuspick"><span class="sub">Week ${fw.w} focus</span><b>${esc(f.name)}</b><span class="num">${Math.min(n, f.target)} / ${f.target}${done ? ' ✓' : ''}</span><div class="mbar"><i style="width:${Math.min(100, n / f.target * 100)}%"></i></div></button>`;
}
function openFocusPick() {
  const fw = focusWeek(), cur = (S.settings.focus || {})[fw.key];
  SH = { scope: 'focus' }; $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Weekly focus"><div class="spread"><h2>This week’s focus</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div><p class="hint">One extra goal on top of your four pillars. It never breaks your streak.</p>
  <div class="results">${(() => { const sg = focusSuggest(); return Object.entries(FOCUS).sort(([a], [b]) => (b === sg) - (a === sg)).map(([k, f]) => `<button class="res" data-act="focusset" data-v="${k}" aria-pressed="${cur && cur.id === k}"><span><b>${esc(f.name)}</b>${k === sg ? '<small>Suggested from your last 7 days</small>' : ''}</span><span class="k num">${f.target}×</span></button>`).join(''); })()}</div></div>`;
}

/* ---------- photo guide (camera with last photo as a faded overlay) ---------- */
let CAM = null;
async function openCamGuide() {
  const ph = Object.values(S.photos).sort((a, b) => a.date < b.date ? -1 : 1), last = ph[ph.length - 1];
  CAM = { facing: 'user', timer: 5, stream: null, last };
  $('timer').hidden = false;
  $('timer').innerHTML = `<div class="camwrap"><video id="cg-v" playsinline muted></video>${last ? `<img class="cg-ghost" src="${last.data}" alt="">` : ''}<div class="cg-count num" id="cg-c"></div></div>
  <p class="l">${last ? `Line yourself up with your ${fmt(last.date)} photo` : 'Stand 2–3 m away, same spot and light every week'}</p>
  <div class="row"><button class="btn" data-act="cgflip" style="color:var(--hdr-fg)">Switch camera</button><button class="btn" data-act="cgtimer" style="color:var(--hdr-fg)" id="cg-tb">Timer: 5 s</button></div>
  <div class="row"><button class="btn primary" data-act="cgshot">Take photo</button><button class="btn ghost" data-act="cgclose" style="color:var(--hdr-fg)">Close</button></div>`;
  await camStart();
}
async function camStart() {
  try {
    if (CAM.stream) CAM.stream.getTracks().forEach(t => t.stop());
    CAM.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: CAM.facing, width: { ideal: 1440 }, height: { ideal: 1920 } } });
    const v = $('cg-v'); v.srcObject = CAM.stream; await v.play();
  } catch (e) { toast('Camera permission was refused. Allow the camera for this app, or choose a photo instead.'); camClose(); }
}
function camClose() { if (CAM && CAM.stream) CAM.stream.getTracks().forEach(t => t.stop()); CAM = null; $('timer').hidden = true; $('timer').innerHTML = ''; }
async function camShoot() {
  const v = $('cg-v'), c = $('cg-c'); if (!v || !v.videoWidth) return;
  for (let s = CAM.timer; s > 0; s--) { c.textContent = s; beep(1); await new Promise(r => setTimeout(r, 1000)); if (!CAM) return; }
  c.textContent = '';
  const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
  const data = await compress(new File([blob], 'guide.jpg', { type: 'image/jpeg' }));
  S.pendingPhoto = data; camClose(); buzz(30);
  const n = $('ck-photo-name'); if (n) n.textContent = 'Photo ready (camera). Tap Save check-in.';
  toast('Photo taken. Tap Save check-in to keep it.');
}

/* ---------- body numbers: waist-to-height (NICE 2022) and US Navy body-fat estimate ---------- */
function bodyNumbersHTML(cks) {
  const st = S.settings, h = st.height;
  const last = k => { for (let i = cks.length - 1; i >= 0; i--) if (cks[i][k] > 0) return cks[i][k]; return null; };
  const waist = last('waist'), neck = last('neck'), hips = last('hips');
  if (!h) return `<p class="hint">Add your height in Me (and neck in a check-in) to see your waist-to-height ratio and a body-fat estimate.</p>`;
  if (!waist) return '';
  const r = waist / h, band = r < 0.4 ? ['low', 'Below the healthy range'] : r < 0.5 ? ['ok', 'Healthy (NICE)'] : r < 0.6 ? ['mid', 'Increased health risk (NICE: take care)'] : ['high', 'High health risk (NICE: take action)'];
  let bf = null; const L10 = Math.log10, inch = x => x / 2.54;
  if (neck && waist > neck) bf = st.sex === 'f' ? (hips ? 163.205 * L10(inch(waist + hips - neck)) - 97.684 * L10(inch(h)) - 78.387 : null) : 86.010 * L10(inch(waist - neck)) - 70.041 * L10(inch(h)) + 36.76;
  const w = curWeight();
  return `<div class="bodynum"><div><b class="num">${C.round(r, 2)}</b><span>Waist ÷ height</span><em class="wb ${band[0]}">${esc(band[1])}</em>${r >= 0.5 ? `<small>Under 0.5 means a waist below ${Math.floor(h / 2)} cm</small>` : ''}</div>
  <div><b class="num">${bf != null && bf > 2 && bf < 70 ? C.round(bf, 1) + '%' : '—'}</b><span>Body fat (estimate)</span>${bf != null && w ? `<small>≈ ${C.round(w * bf / 100, 1)} kg fat · ${C.round(w * (1 - bf / 100), 1)} kg lean</small>` : `<small>${neck ? '' : 'Add your neck in a check-in'}</small>`}</div></div>
  <p class="hint">Body fat uses the US Navy tape formula, usually within about 3–4% of a lab scan. Measure the same way every time.</p>`;
}

/* ---------- weekly group challenge (Sat–Fri) ---------- */
const CHAL = [['locked', 'Most days locked in', v => `${v} days`], ['water', 'Most water', v => `${v} L`], ['active', 'Most active minutes', v => `${v} min`], ['sleep', 'Best average sleep', v => `${v} h`]];
const weekStart = d => C.addDays(d, -((C.weekday(d) + 1) % 7));
function chalNow() { const ws = weekStart(today()), i = Math.floor(C.diffDays('2026-01-03', ws) / 7) % CHAL.length; return { ws, c: CHAL[(i + CHAL.length) % CHAL.length] }; }
function myWeekStats() {
  const ws = weekStart(today()); let water = 0, active = 0, locked = 0, sl = 0, sn = 0;
  for (let dt = ws > S.settings.startDate ? ws : S.settings.startDate; dt <= today(); dt = C.addDays(dt, 1)) { const d = S.days[dt] || {}; water += C.waterTotal(d); active += (d.sports || []).reduce((s, x) => s + (x.min || 0), 0) + (d.stamina || []).reduce((s, x) => s + (x.min || 0), 0); if (C.evalDay(S.settings, d, dt).complete) locked++; if (d.sleep) { sl += d.sleep; sn++; } }
  return { k: ws, water: Math.round(water / 500) / 2, active, locked, sleep: sn ? Math.round(sl / sn * 2) / 2 : 0 };
}
function challengeHTML() {
  const { ws, c } = chalNow(), rows = Object.entries(S.board).map(([id, m]) => ({ id, name: m.name, v: m.wk && m.wk.k === ws ? m.wk[c[0]] || 0 : 0, me: id === uid() })).sort((a, b) => b.v - a.v);
  if (rows.length < 2) return '';
  const medal = ['🥇', '🥈', '🥉'];
  return `<div class="chal"><span class="sub">This week’s challenge · ${fmt(ws)} – ${fmt(C.addDays(ws, 6))}</span><b>${esc(c[1])}</b>${rows.map((r, i) => `<div class="crow${r.me ? ' me' : ''}"><span>${r.v > 0 && i < 3 ? medal[i] : `${i + 1}.`}</span><span>${esc(r.name)}${r.me ? ' (you)' : ''}</span><span class="num">${esc(c[2](r.v))}</span></div>`).join('')}</div>`;
}

/* ---------- coach live link: a read-only summary at shares/{token} ---------- */
let coachT;
function coachWo(d, dt) {
  const w = d.wo; if (!w || !(w.t1 || w.imported) || !w.ex) return null;
  let sets = 0, vol = 0; w.ex.forEach(e => (e.sets || []).forEach(x => { if (x.done && x.t !== 'w') { sets++; vol += (x.kg || 0) * (x.r || 0); } }));
  return { n: w.name, m: w.t1 && w.t0 ? Math.round((w.t1 - w.t0) / 60000) : null, s: sets, v: Math.round(vol), pr: w.imported ? 0 : TR.prCount(dt), cali: w.rid === 'cali' };
}
function coachData(R) {
  const st = S.settings, t = today(), days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = C.addDays(t, -i); if (dt < st.startDate) continue;
    const d = S.days[dt] || {}, ev = C.evalDay(st, d, dt), P = ev.P, tot = C.dayTotals(st, d), tg = C.planTargets(st, d, dt);
    days.push({ d: dt, now: dt === t, ok: ev.complete, k: Math.round(tot.k), p: Math.round(tot.p), tk: Math.round(tg.k), tp: Math.round(tg.p), w: C.round(P.w / 1000, 2), wg: C.round(P.goal / 1000, 2), tr: P.tt === 'rest' ? 'rest' : d.trainingDone ? 'done' : 'no', tt: C.TT[P.tt].label, sup: [P.sDone, P.req.length], wt: d.weight || null, sl: d.sleep || null, sp: (d.sports || []).reduce((s, x) => s + (x.min || 0), 0), off: P.off.length + P.offExtra.length, miss: ev.complete ? [] : ev.missing, ...(st.coach && st.coach.notes && d.note ? { note: d.note } : {}),
      ms: !P.pm.length ? 'none' : P.off.length || P.offExtra.length ? 'off' : P.cheats && P.mealsOk ? 'cheat' : P.mealsOk ? 'ok' : P.clean ? 'part' : 'none', sw: Object.values(d.meals || {}).filter(m => m && m.status === 'swap').length, mc: [P.clean.length, P.pm.length],
      ss: !P.req.length ? 'none' : P.sDone >= P.req.length ? 'ok' : P.sDone ? 'part' : 'miss', wo: coachWo(d, dt), cd: (d.stamina || []).reduce((a, x) => a + (x.min || 0), 0), spl: (d.sports || []).map(x => ({ n: (C.SPORTS.find(z => z.id === x.sport) || {}).name || x.name || 'Sport', m: x.min || 0, k: Math.round(x.kcal || 0) })) });
  }
  const pts = []; if (st.startWeight) pts.push([st.startDate, st.startWeight]);
  Object.values(S.checkins).forEach(c => c.weight && pts.push([c.date, c.weight])); Object.keys(S.days).forEach(k => S.days[k].weight && pts.push([k, S.days[k].weight]));
  pts.sort((a, b) => a[0] < b[0] ? -1 : 1);
  const cks = Object.values(S.checkins).sort((a, b) => a.date < b.date ? -1 : 1).slice(-6).map(c => ({ date: c.date, waist: c.waist || null, chest: c.chest || null, arm: c.arm || null, hips: c.hips || null, neck: c.neck || null, weight: c.weight || null }));
  return { name: boardName(), lang: LANG(), day: Math.min(R.dayNum, 90), streak: R.done, best: R.best, attempt: R.attemptNo, startDate: st.startDate, startWeight: st.startWeight || null, goalWeight: st.goalWeight || null, height: st.height || null, sleepGoal: st.sleepGoal || 7.5, ws: C.weekStartDay(st), rank: (() => { const r = TR.rankOf(); return r ? r.name : null; })(), days, weights: pts.slice(-90).map(([d, w]) => ({ d, w })), checkins: cks };
}
function coachPublish(R) {
  const c = S.settings && S.settings.coach;
  if (!c || !c.token || !S.got.days || !R) return;
  const data = coachData(R), key = JSON.stringify(data);
  if (key === S.coachLast) return;
  S.coachLast = key; clearTimeout(coachT);
  coachT = setTimeout(() => setDoc(doc(db, `shares/${c.token}`), { ...data, owner: uid(), updated: Date.now() }).then(() => { S.coachOk = Date.now(); }).catch(e => { S.coachLast = null; console.warn('coach link', e); if (e && e.code !== 'permission-denied') toast('Couldn’t update the coach link. It retries automatically.'); if (e && e.code === 'permission-denied') toast('The coach link needs the updated Firestore rules (see the README).'); }), 2500);
}
const coachURL = () => `${location.origin}${location.pathname.replace(/index\.html$/, '')}coach.html?t=${S.settings.coach.token}`;
function coachSetupHTML(st) {
  const c = st.coach;
  return `<section class="card" id="sec-coach"><div class="card-h"><h2>Coach link</h2>${pill(c ? 'done' : 'opt', c ? 'Sharing' : 'Off')}</div>
  <p class="hint">A private, read-only page for your coach: the last 14 days (meals vs plan, water, training, supplements, sleep, sports), your weight trend and measurements. It updates by itself. Anyone with the link can view it, so only send it to your coach.</p>
  ${c ? `<div class="linkbox num">${esc(coachURL())}</div><div class="row"><button class="btn primary" data-act="coachshare">Send to coach</button><button class="btn" data-act="coachopen">Open</button></div>
  <div class="setup-r"><span>Include my daily notes</span><div class="seg"><button data-act="coachnotes" data-v="1" aria-pressed="${!!c.notes}">On</button><button data-act="coachnotes" data-v="0" aria-pressed="${!c.notes}">Off</button></div></div>
  <button class="link danger" data-act="coachoff">Stop sharing (the link stops working)</button>` : `<button class="btn primary" data-act="coachon">Create coach link</button>`}</section>`;
}

/* ---------- Ramadan ---------- */
function ramadanSetupHTML(st) {
  const r = C.ramadanOf(st), on = !!(st.ramadan && st.ramadan.on);
  return `<section class="card" id="sec-ramadan"><div class="card-h"><h2>Ramadan mode</h2>${pill(on ? 'done' : 'opt', on ? 'On' : 'Off')}</div>
  <p class="hint">During Ramadan the app switches to your Ramadan meal plan (Suhoor, Iftar, after Taraweeh), paces water between iftar and fajr, and moves the water reminders to the evening. Expected dates: 8 Feb – 8 Mar 2027 (astronomical estimate; change them once confirmed).</p>
  <div class="setup-r"><span>Ramadan mode</span><div class="seg"><button data-act="ramon" data-v="1" aria-pressed="${on}">On</button><button data-act="ramon" data-v="0" aria-pressed="${!on}">Off</button></div></div>
  <div class="form"><label>First day<input class="in" type="date" data-ram="from" value="${r.from}"></label><label>Last day<input class="in" type="date" data-ram="to" value="${r.to}"></label>
  <label>Iftar (Maghrib)<input class="in" type="time" data-ram="iftar" value="${r.iftar}"></label><label>Fajr (fast starts)<input class="in" type="time" data-ram="fajr" value="${r.fajr}"></label></div>
  <p class="hint">Iftar moves from about 17:25 to 17:50 in Cairo over the month; update it weekly so the countdown and water pace stay right.</p>
  ${on ? `<button class="btn small" data-act="planedit" data-v="ramadan">Edit the Ramadan meal plan</button>` : ''}</section>`;
}
function ramadanHTML(date) {
  const st = S.settings, t = today(), r = C.ramadanOf(st), n = now(), mins = n.clock * 60 + n.minute;
  const hm = s => { const [a, b] = String(s).split(':').map(Number); return a * 60 + (b || 0); };
  if (C.inRamadan(st, date) && date === t) {
    const day = C.diffDays(r.from, date) + 1, ift = hm(r.iftar), fj = hm(r.fajr);
    const fasting = mins >= fj && mins < ift, left = ift - mins;
    return `<section class="card ramadan"><span class="sub">Ramadan · day ${day}</span><h3>${fasting ? `Iftar in ${Math.floor(left / 60)} h ${left % 60} min` : mins < fj ? `Suhoor: fast starts at ${esc(r.fajr)}` : 'Iftar time. Ramadan Kareem'}</h3><p class="hint">${fasting ? 'Fasting now. Water and meals start counting again at iftar.' : 'Drinking window: spread your water from iftar to suhoor, about 250 ml every 30–45 minutes.'}${C.trainType(st, date) === 'gym' ? ' Best gym time: 60–90 minutes before iftar (light) or 1–2 hours after it (heavy).' : ''}</p></section>`;
  }
  const until = C.diffDays(t, r.from);
  if (!(st.ramadan && st.ramadan.on) && until > 0 && until <= 14) return `<section class="card ramadan"><span class="sub">Ramadan in ${until} day${until === 1 ? '' : 's'}</span><h3>Set up Ramadan mode</h3><p class="hint">Switch to a Suhoor / Iftar meal plan and evening water reminders for the month, without breaking your streak.</p><div class="row"><button class="btn primary" data-act="ramsetup">Set it up</button></div></section>`;
  return '';
}

/* ---------- page shells ---------- */
const pageHead = (title, R) => `<header class="ph"><h1>${esc(title)}</h1><span class="hero-chips">${syncDot()}${TR.rankChip()}${flameChip(R)}</span></header>`;
const PTABS = [['week', 'Week'], ['muscles', 'Muscles'], ['body', 'Body'], ['chain', 'Chain'], ['friends', 'Friends']];
function progressShell(G) {
  const tab = PTABS.some(p => p[0] === S.ptab) ? S.ptab : 'week';
  return `<div class="seg wide ptabs" role="tablist" aria-label="Progress sections">${PTABS.map(([k, l]) => `<button role="tab" data-act="ptab" data-v="${k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div>` + (G[tab] || '');
}
const ME_GROUPS = [
  ['Plan', [['Day and week', '📅'], ['Meal plan', '🍽️'], ['Weekly training', '🏋️'], ['Supplements', '💊'], ['Stamina track', '🚴'], ['Ramadan mode', '☾']]],
  ['Habits', [['If-then plans', '⇢'], ['Reminders', '🔔']]],
  ['Sharing', [['Coach link', '🔗'], ['Strava', '↻']]],
  ['App', [['Data', '⚙️'], ['Restart', '↺']]]
];
function meHTML(R) {
  const full = setupHTML(R), parts = full.split(/(?=<section )/).filter(Boolean);
  const title = s => { const m = s.match(/<h2>(.*?)<\/h2>/); return m ? m[1].replace(/&amp;/g, '&') : ''; };
  const byTitle = Object.fromEntries(parts.map(p => [title(p), p]));
  if (S.meSec && byTitle[S.meSec]) return `<header class="ph sub2"><button class="back" data-act="mesec" data-v="" aria-label="Back to Me">‹</button><h1>${esc(S.meSec)}</h1></header>` + byTitle[S.meSec];
  const st = S.settings, w = curWeight();
  const sum = { 'Meal plan': `${kc(C.sumItems((st.meals || []).flatMap(m => m.items || [])).k)} kcal · ${(st.meals || []).length} meals`, 'Supplements': `${(st.supps || []).filter(s => s.req).length} core`, 'Ramadan mode': st.ramadan && st.ramadan.on ? 'On' : 'Off', 'If-then plans': `${(st.ifthen || []).length} saved`, 'Coach link': st.coach ? 'Sharing' : 'Off', 'Reminders': pushState() === 'on' ? 'App notifications on' : st.ntfyTopic ? 'ntfy' : 'Not set up', 'Stamina track': (st.stamina || {}).on === false ? 'Off' : 'On', 'Weekly training': '' };
  let h = `<header class="ph"><h1>Me</h1><span class="hero-chips">${syncDot()}${TR.rankChip()}${flameChip(R)}</span></header>
  <section class="card me-card"><div class="me-top"><span class="avatar">${esc((boardName() || '?').slice(0, 1).toUpperCase())}</span><span><b>${esc(boardName())}</b><small>Day ${Math.min(R.dayNum, 90)} of 90 · attempt ${R.attemptNo}</small></span></div>
  <div class="me-stats"><span><b class="num">${w ? C.round(w, 1) : '—'}</b><small>kg now</small></span><span><b class="num">${st.goalWeight || '—'}</b><small>kg goal</small></span><span><b class="num">${L(st.waterGoal || 3500)}</b><small>L water</small></span></div>
  <button class="btn block" data-act="mesec" data-v="Challenge">Edit goals and body</button><div class="card list2 flat">${TR.rankRow()}</div></section>`;
  ME_GROUPS.forEach(([g, items]) => { const its = items.filter(([k]) => byTitle[k]); if (!its.length) return; h += `<h3 class="grp">${g}</h3><section class="card list2">${its.map(([k, ic]) => `<button class="lrow" data-act="mesec" data-v="${esc(k)}"><span class="lic">${ic}</span><span class="lt"><b>${esc(k)}</b>${sum[k] ? `<small>${esc(sum[k])}</small>` : ''}</span><span class="le">›</span></button>`).join('')}</section>`; });
  return h + `<p class="hint center">Signed in as ${esc(S.user.email || '')} · <button class="link" data-act="signout">Sign out</button><br><span class="num">App version ${APP_VERSION}</span></p>`;
}

/* ---------- day history (read-only) ---------- */
function openDay(date) { SH = { scope: 'day', date }; $('sheet').hidden = false; drawDay(); }
function drawDay() {
  const date = SH.date, st = S.settings, d = S.days[date] || {}, ev = C.evalDay(st, d, date), P = ev.P, tot = C.dayTotals(st, d), tgt = C.planTargets(st, d, date);
  const R = C.computeRun(st, S.days, now()), dayNo = C.diffDays(R.attemptStart, date) + 1, t = today();
  const meals = C.mealsOn(st, date).map(m => {
    const md = (d.meals || {})[m.id] || {}, skip = (d.skip || {})[m.id], s = C.sumItems(md.items || []);
    const lbl = skip ? 'Not part of the plan' : !md.status ? 'Not logged' : md.status === 'plan' ? 'As planned' : md.status === 'swap' ? 'Changed' : 'Off-plan';
    return `<li><span><b>${esc(m.name)}</b> <span class="mstat ${md.status || ''}">${lbl}</span>${(md.items || []).length && md.status !== 'plan' ? `<small>${esc(md.items.map(x => `${x.name.split(',')[0]} ${C.round(x.g)}${C.isDrink(x) ? ' ml' : ' g'}`).join(', '))}</small>` : ''}</span><span class="num">${md.status ? kc(s.k) + ' kcal' : ''}</span></li>`;
  }).join('');
  const ex = (d.extras || []).map(x => `<li><span>${esc(x.name)}${x.off ? ' <span class="mstat off">off-plan</span>' : ''}</span><span class="num">${C.round(x.g)} ${C.isDrink(x) ? 'ml' : 'g'} · ${kc(C.itemMacros(x).k)} kcal</span></li>`).join('');
  const sp = (d.sports || []).map(s => `${C.sportById(s.sport).ic} ${C.sportById(s.sport).name} ${s.min} min (${kc(s.kcal)} kcal)`).join(', ');
  const cali = Object.entries(d.cali || {}).filter(([, a]) => Array.isArray(a) && a.some(v => v > 0)).map(([id, a]) => { const e = EX.find(x => x.id === id); return `${e ? e.name : id}: ${a.filter(v => v > 0).join(' · ')}`; }).join('; ');
  const prev = C.addDays(date, -1), next = C.addDays(date, 1);
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Day ${fmt(date)}"><div class="spread"><h2>${dayNo >= 1 && dayNo <= 90 ? `Day ${dayNo} · ` : ''}${fmt(date)}</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <div class="row dnav"><button class="btn small" data-act="daynav" data-v="${prev}" ${prev < st.startDate ? 'disabled' : ''}>‹ Previous</button><span class="state ${ev.complete ? 's-done' : date === t ? 's-todo' : 's-bad'}">${ev.complete ? 'Locked in' : date === t ? 'In progress' : 'Missed'}</span><button class="btn small" data-act="daynav" data-v="${next}" ${next > t ? 'disabled' : ''}>Next ›</button></div>
  ${!ev.complete && ev.missing.length ? `<ul class="missing">${ev.missing.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  <div class="review"><div><b class="num">${kc(tot.k)}${tgt.k ? `<small> / ${kc(tgt.k)}</small>` : ''}</b><span>Calories</span></div><div><b class="num">${kc(tot.p)} g</b><span>Protein</span></div><div><b class="num">${L(P.w)} L</b><span>Water${P.wDrinks ? ` · ${L(P.wDrinks)} L from drinks` : ''}</span></div><div><b>${P.tt === 'rest' ? 'Rest' : d.trainingDone ? 'Done' : 'Not done'}</b><span>${esc(C.TT[P.tt].label)}</span></div></div>
  <span class="sub">Meals</span><ul class="list">${meals}${ex}</ul>
  ${sp ? `<p class="hint"><b>Sports:</b> ${esc(sp)}</p>` : ''}${cali ? `<p class="hint"><b>Calisthenics:</b> ${esc(cali)}</p>` : ''}
  <p class="hint"><b>Supplements:</b> ${P.req.length ? `${P.sDone} of ${P.req.length} core` : 'none required'}${d.weight ? ` · <b>Weight:</b> ${d.weight} kg` : ''}${d.sleep ? ` · <b>Sleep:</b> ${d.sleep} h` : ''}${d.energy ? ` · <b>Energy:</b> ${d.energy}/5` : ''}${d.commit ? ` · committed ${esc(d.commit)}` : ''}</p>
  ${d.note ? `<div class="daynote">“${esc(d.note)}”</div>` : ''}</div>`;
}

/* ---------- sports ---------- */
function curWeight(before) {
  const pts = [];
  if (S.settings.startWeight) pts.push([S.settings.startDate, S.settings.startWeight]);
  Object.values(S.checkins).forEach(c => c.weight && pts.push([c.date, c.weight]));
  Object.keys(S.days).forEach(k => S.days[k].weight && pts.push([k, S.days[k].weight]));
  const ok = pts.filter(p => !before || p[0] <= before).sort((a, b) => a[0] < b[0] ? -1 : 1);
  return ok.length ? ok[ok.length - 1][1] : null;
}
const prof = () => ({ age: S.settings.age || null, sex: S.settings.sex || 'm' });
const LVL_HINT = ['Relaxed, lots of breaks, you can chat easily', 'A proper game: breathing hard at times', 'Competitive, full pace, you can barely talk'];
function openSport() {
  const P = P0(editDate()), d = S.days[editDate()] || {};
  SH = { scope: 'sport', sp: (S.settings.lastSport || 'football'), min: 60, lvl: 1, hr: null, counts: false, canCount: P.tt !== 'rest' && !d.trainingDone };
  $('sheet').hidden = false; drawSport();
}
function drawSport() {
  const s = SH, sp = C.sportById(s.sp), kg = curWeight(editDate()) || 80, kcal = C.sportKcal({ sport: s.sp, min: s.min, lvl: s.lvl, hr: s.hr }, kg, prof());
  const usingHR = s.hr >= 90 && s.hr <= 200 && S.settings.age;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Log a sport"><div class="spread"><h2>Log a sport</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <div class="sgrid">${C.SPORTS.map(x => `<button class="sp" data-act="sppick" data-v="${x.id}" aria-pressed="${x.id === s.sp}"><span>${x.ic}</span>${esc(x.name)}</button>`).join('')}</div>
  <span class="sub">How long</span><div class="row">${[30, 45, 60, 90, 120].map(m => `<button class="btn small" data-act="spmin" data-v="${m}" aria-pressed="${s.min === m}">${{ 30: '30 min', 45: '45 min', 60: '1 h', 90: '1 h 30', 120: '2 h' }[m]}</button>`).join('')}<label class="g">or <input class="in sm" id="sp-min" type="number" inputmode="numeric" min="5" max="600" value="${s.min}"> min</label></div>
  <span class="sub">How hard</span><div class="seg wide" role="group" aria-label="Intensity">${C.LEVELS.map((l, i) => `<button data-act="splvl" data-v="${i}" aria-pressed="${s.lvl === i}">${l}</button>`).join('')}</div><p class="hint">${LVL_HINT[s.lvl]}.</p>
  <label class="full-note">Average heart rate (optional, from your watch)<input class="in" id="sp-hr" type="number" inputmode="numeric" min="60" max="210" placeholder="e.g. 145" value="${s.hr || ''}"></label>
  ${s.hr && !S.settings.age ? '<p class="hint">Add your age in Me to use heart rate. Until then it uses the sport and intensity.</p>' : ''}
  ${s.canCount ? `<label class="chk"><input type="checkbox" id="sp-count" ${s.counts ? 'checked' : ''}> Count this as today’s training</label>` : ''}
  <div class="spest"><b class="num">≈ ${kc(kcal)} kcal</b><span>${esc(sp.name)} · ${s.min} min · ${C.LEVELS[s.lvl].toLowerCase()} · ${usingHR ? `heart rate ${s.hr} bpm` : `${C.round(kg, 1)} kg`}</span></div>
  <button class="btn primary block" data-act="spsave">Save</button></div>`;
}
function sportsListHTML(date, d) {
  const list = d.sports || [];
  if (!list.length) return `<button class="btn small" data-act="sport">+ Played a sport? Log it</button>`;
  const min = list.reduce((a, s) => a + (s.min || 0), 0), kcal = list.reduce((a, s) => a + (s.kcal || 0), 0), extraL = Math.round(min / 60 * 0.6 * 4) / 4;
  return `<div class="sgrp"><span class="sub">Sports today · ${min} min · ≈ ${kc(kcal)} kcal</span><div class="acts">${list.map((s, i) => { const sp = C.sportById(s.sport); return `<div class="act"><span>${sp.ic} <b>${esc(sp.name)}</b> · ${s.min} min · ${C.LEVELS[s.lvl ?? 1].toLowerCase()}${s.counts ? ' · counts as training' : ''}</span><span class="num">${kc(s.kcal)} kcal <button class="x" data-act="sprm" data-v="${i}" aria-label="Remove ${esc(sp.name)}">×</button></span></div>`; }).join('')}</div>
  ${extraL >= 0.25 ? `<p class="hint">You sweat a lot in ${min} minutes: drink about ${L(extraL * 1000)} L on top of your usual water today.</p>` : ''}
  <button class="btn small" data-act="sport">+ Log another</button></div>`;
}
function activityWeek() {
  const t = today(); let min = 0, kcal = 0, mod = 0, n = 0;
  // only the current attempt counts, so a fresh start begins at 0
  const st0 = S.settings.startDate || t, from = C.addDays(t, -6) > st0 ? C.addDays(t, -6) : st0;
  for (let i = 0; i < 7; i++) { const dt = C.addDays(t, -i); if (dt < from) break; const d = S.days[dt]; (d && d.sports || []).forEach(s => { n++; min += s.min || 0; kcal += s.kcal || 0; mod += C.sportModMin(s); }); }
  stamSessions(from, t).forEach(s => { min += s.min || 0; mod += (s.min || 0) * (s.kind === 'intervals' ? 2 : 1); });
  return { n, min, kcal, mod };
}
function openQuick() {
  SH = { scope: 'quick' }; $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Quick add"><div class="spread"><h2>Quick add</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <div class="qgrid"><button class="qbtn wat" data-act="qwater" data-v="250"><span class="qi">💧</span>+ 250 ml</button><button class="qbtn wat" data-act="qwater" data-v="500"><span class="qi">💧</span>+ 500 ml</button><button class="qbtn wat" data-act="qwater" data-v="1000"><span class="qi">💧</span>+ 1 L</button>
  <button class="qbtn" data-act="qsport"><span class="qi">⚽</span>Sport</button><button class="qbtn" data-act="qextra"><span class="qi">🍎</span>Food or drink</button><button class="qbtn" data-act="qfocus" data-v="b-weight"><span class="qi">⚖️</span>Weight</button>
  <button class="qbtn" data-act="qcrave"><span class="qi">🌊</span>Craving</button><button class="qbtn" data-act="qtab" data-v="train"><span class="qi">💪</span>Train</button><button class="qbtn" data-act="qfocus" data-v="b-note"><span class="qi">📝</span>Note</button></div></div>`;
}

/* ---------- celebration + share card ---------- */
function maybeCelebrate(R) {
  const t = today();
  if (!S.got.days || !R || !R.todayEval.complete || editDate() !== t || S.view !== 'today') return;
  const d = dayDoc(t);
  if (d.celebrated) return;
  d.celebrated = true; saveDay(t);
  showCelebration(R);
}
function celebData(R) {
  const t = today(), d = S.days[t] || {}, P = R.todayEval.P, tot = C.dayTotals(S.settings, d);
  return { day: Math.min(R.dayNum, 90), streak: R.done, mile: C.MILES.find(m => m[0] === R.done), victory: R.victory, water: P.w, prot: tot.p, date: t, attemptStart: R.attemptStart, done: R.todayEval.complete };
}
function showCelebration(R) {
  const c = celebData(R);
  buzz(c.mile ? [40, 60, 40, 60, 140] : [30, 50, 90]);
  const big = c.victory ? '90 days. Done.' : c.mile ? c.mile[1] : 'Locked in';
  const sub = c.mile ? `Milestone: Day ${c.mile[0]}` : 'Every box checked. This day counts.';
  $('cele').hidden = false;
  $('cele').innerHTML = `<div class="cele-in${c.mile ? ' mile' : ''}" role="dialog" aria-modal="true" aria-label="Day ${c.day} locked in">
   <div class="burst" aria-hidden="true">${Array.from({ length: 20 }, (_, i) => `<i style="--a:${i * 18}deg;--d:${(i % 4) * 70}ms;--c:${['var(--spark)', 'var(--good)', 'var(--water)', '#fff'][i % 4]}"></i>`).join('')}</div>
   <span class="cele-k">Day</span><div class="cele-n num">${c.day}</div><div class="cele-t">${esc(big)}</div>
   <p class="cele-s">${esc(sub)}</p><p class="cele-s num">Streak ${c.streak} · ${L(c.water)} L water · ${kc(c.prot)} g protein</p>
   <div class="row"><button class="btn primary" data-act="sharecard">Share image</button><button class="btn ghost" data-act="celeclose">Close</button></div></div>`;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function shareCard() {
  const R = C.computeRun(S.settings, S.days, now()), c = celebData(R);
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await document.fonts.load('800 40px Alexandria'); await document.fonts.ready; } catch (e) { }
  const NAVY = '#14213D', NAVY2 = '#1F2E52', SPARK = '#F2B33D', CREAM = '#FFFFFF', MUTE = '#9FB0D0', DISP = 'Alexandria,sans-serif', MONO = 'Alexandria,sans-serif';
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, NAVY2); grd.addColorStop(1, NAVY); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = MUTE; g.font = `500 32px ${MONO}`; g.fillText('LOCK IN 90', 90, 130); g.textAlign = 'right'; g.fillText(fmt(c.date).toUpperCase(), W - 90, 130); g.textAlign = 'left';
  g.fillStyle = CREAM; g.font = `800 110px ${DISP}`; g.fillText('DAY', 90, 300);
  g.fillStyle = SPARK; g.font = `800 380px ${DISP}`; g.fillText(String(c.day), 72, 650);
  g.fillStyle = CREAM; g.font = `700 92px ${DISP}`; g.fillText((c.victory ? '90 days. Done.' : c.mile ? c.mile[1] : c.done ? 'Locked in' : 'In progress').toUpperCase(), 90, 770);
  const gap = 12, cell = (W - 180 - 14 * gap) / 15, x0 = 90, y0 = 820;
  for (let i = 0; i < 90; i++) { const dt = C.addDays(c.attemptStart, i), ok = dt <= c.date && C.evalDay(S.settings, S.days[dt], dt).complete; g.fillStyle = ok ? SPARK : 'rgba(255,255,255,.13)'; rr(g, x0 + (i % 15) * (cell + gap), y0 + Math.floor(i / 15) * (cell + gap), cell, cell, 10); g.fill(); }
  [[String(c.streak), 'STREAK'], [L(c.water) + ' L', 'WATER'], [kc(c.prot) + ' g', 'PROTEIN']].forEach(([v, k], i) => { const x = 90 + i * 320; g.fillStyle = CREAM; g.font = `700 78px ${DISP}`; g.fillText(v, x, 1262); g.fillStyle = MUTE; g.font = `500 26px ${MONO}`; g.fillText(k, x, 1300); });
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const file = new File([blob], `lock-in-day-${c.day}.png`, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `Day ${c.day} of 90 locked in.` }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Image saved. Post it from your gallery.');
}
function commitHTML(R, d, date) {
  const n = now();
  if (date !== today() || d.commit || R.todayEval.complete || n.hour < 4 || n.hour >= 14) return '';
  return `<button class="commitbar" data-act="commit"><span>Commit to Day ${Math.min(R.dayNum, 90)}</span><small>A promise that all four get done today</small></button>`;
}

/* ---------- TODAY ---------- */
function arc(cx, cy, r, a0, a1) { const R2 = a => a * Math.PI / 180; const x0 = cx + r * Math.cos(R2(a0)), y0 = cy + r * Math.sin(R2(a0)), x1 = cx + r * Math.cos(R2(a1)), y1 = cy + r * Math.sin(R2(a1)); return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`; }
function ringsSVG(parts, mealsBad) {
  const cls = ['meal', 'water', 'train', 'supp'], R0 = [70, 59, 48, 37], sw = 8;
  let s = `<svg viewBox="0 0 150 150" aria-hidden="true">`;
  parts.forEach((pt, i) => {
    const r = R0[i], c = 2 * Math.PI * r, v = Math.min(1, Math.max(0, pt.v));
    s += `<circle cx="75" cy="75" r="${r}" fill="none" class="rtrack ${cls[i]}" stroke-width="${sw}"/>`;
    if (v > 0) s += `<circle cx="75" cy="75" r="${r}" fill="none" class="rfill ${cls[i]}${i === 0 && mealsBad ? ' bad' : ''}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 75 75)"/>`;
  });
  return s + `</svg>`;
}
function upNextHTML(R, d, date, P) {
  const ev = R.todayEval && date === today() ? R.todayEval : C.evalDay(S.settings, d, date), n = now();
  const mins = date === today() ? n.hour * 60 + n.minute : 24 * 60;
  const card = (title, body, actions, kind = '') => `<section class="card upnext ${kind}"><span class="sub">${kind === 'done' ? 'Today' : 'Up next'}</span><h3>${title}</h3>${body ? `<p class="hint">${body}</p>` : ''}${actions ? `<div class="row">${actions}</div>` : ''}</section>`;
  if (ev.complete) return card('Locked in. This day counts.', `Streak ${R.done}. Rest well, tomorrow is a separate problem.`, `<button class="btn" data-act="sharecard">Share image</button><button class="btn ghost" data-act="sport">+ Log a sport</button>`, 'done');
  const meals = d.meals || {}, tm = m => { const [a, b] = String(m.time || '').split(':').map(Number); return isNaN(a) ? null : a * 60 + (b || 0); };
  const open = P.pm.filter(m => !(meals[m.id] && meals[m.id].status));
  const due = open.filter(m => tm(m) != null && tm(m) <= mins).sort((a, b) => tm(a) - tm(b))[0];
  const mealCard = (m, early) => { if (!(m.items || []).length) return card(`${esc(m.name)} · ${esc(m.time || '')}${early ? ' (coming up)' : ''}`, 'No foods planned for this meal yet. Log what you ate and the app works out the calories.', `<button class="btn good" data-act="meal" data-id="${m.id}" data-v="swap">Log what I ate</button><button class="btn ghost" data-act="planset">Set up my plan</button>`); const s = C.sumItems(m.items); return card(`${esc(m.name)} · ${esc(m.time || '')}${early ? ' (coming up)' : ''}`, `${esc(m.items.map(x => x.name.split(',')[0]).join(', '))} · ${kc(s.k)} kcal · ${C.round(s.p, 1)} g protein`, `<button class="btn good" data-act="meal" data-id="${m.id}" data-v="plan">Ate it as planned</button><button class="btn" data-act="meal" data-id="${m.id}" data-v="swap">Changed</button>`); };
  if (due) return mealCard(due);
  const expected = P.goal * C.waterPace(S.settings, date, mins), behind = expected - P.w;
  if (behind >= 500) return card(`Water: ${L(Math.round(behind / 250) * 250)} L behind pace`, `${L(P.w)} of ${L(P.goal)} L so far. Aim for about ${L(Math.round(expected / 250) * 250)} L by now.`, `<button class="btn wat" data-act="water" data-n="500">+ 500 ml</button><button class="btn" data-act="water" data-n="250">+ 250 ml</button>`);
  const trainCard = () => { const tl = (P.tt === 'gym' || P.tt === 'cali') && TR.todayLine(); return tl ? card(esc(tl.live ? `${tl.name}: in progress` : `${tl.name} workout`), tl.live ? 'Pick up where you left off.' : `${tl.n} exercises. Start it in Train and tick each set.`, `<button class="btn primary" data-act="tab" data-v="train">${tl.live ? 'Back to workout' : 'Start workout'}</button><button class="btn ghost" data-act="sport">Played a sport instead?</button>`) : P.tt === 'cali' && !S.settings.train ? card(C.TT.cali.label, 'Set up your plan in Train, then start it from there.', `<button class="btn primary" data-act="tab" data-v="train">Open Train</button>`) : card(C.TT[P.tt].label, C.TT[P.tt].sub, `<button class="btn primary" data-act="train">Mark done</button><button class="btn ghost" data-act="sport">Played a sport instead?</button>`); };
  if (!P.trained && mins >= 17 * 60) return trainCard();
  const left = P.req.filter(s => !(d.supps || {})[s.id]);
  if (left.length && mins >= 12 * 60) return card(`Supplements: ${left.length} left`, esc(left.map(s => s.name).join(', ')), `<button class="btn primary" data-act="suppall">I took them</button>`);
  const next = open.filter(m => tm(m) != null).sort((a, b) => tm(a) - tm(b))[0];
  if (next) return mealCard(next, true);
  if (P.w < P.goal) return card(`Water: ${L(P.goal - P.w)} L to go`, '', `<button class="btn wat" data-act="water" data-n="500">+ 500 ml</button><button class="btn" data-act="water" data-n="250">+ 250 ml</button>`);
  if (!P.trained) return trainCard();
  if (left.length) return card(`Supplements: ${left.length} left`, esc(left.map(s => s.name).join(', ')), `<button class="btn primary" data-act="suppall">I took them</button>`);
  if (open.length) return mealCard(open[0]);
  return '';
}
function todayHTML(R) {
  const t = today(), n = now(), grace = graceDay(), date = editDate();
  const st = S.settings, d = S.days[date] || {}, ev = C.evalDay(st, d, date), P = ev.P;
  const line = LINES[((R.dayNum - 1) % LINES.length + LINES.length) % LINES.length];
  const mealsBad = P.off.length || P.offExtra.length;
  const parts = [
    { v: P.pm.length ? P.clean / P.pm.length : 0 },
    { v: Math.min(1, P.w / P.goal) },
    { v: P.trained ? 1 : 0 },
    { v: P.req.length ? P.sDone / P.req.length : 1 }
  ];
  const supLeft = P.req.filter(s => !(d.supps || {})[s.id]).length;
  const pills = [
    { k: 'meals', name: 'Meals', ok: P.mealsOk, bad: mealsBad, val: mealsBad ? 'Off-plan' : `${P.clean} / ${P.pm.length}` },
    { k: 'water', name: 'Water', ok: P.w >= P.goal, val: `${L(P.w)} / ${L(P.goal)} L` },
    { k: 'train', name: P.tt === 'gym' ? 'Gym' : P.tt === 'cali' ? 'Home workout' : P.tt === 'cardio' ? 'Cardio' : P.tt === 'recovery' ? 'Mobility' : 'Rest', ok: P.trained, val: P.tt === 'rest' ? 'Rest day' : P.trained ? 'Done' : 'To do' },
    { k: 'supps', name: 'Supps', ok: P.sDone === P.req.length, val: !P.req.length ? 'None' : `${P.sDone} / ${P.req.length}` }
  ];
  const dayNo = Math.min(R.dayNum, 90);
  let h = `<section class="hero${ev.complete ? ' locked' : ''}">
  <div class="hero-top"><span>${esc(C.DAYNAMES[C.weekday(date)])}, ${fmt(date)}</span><span class="hero-chips">${syncDot()}${TR.rankChip()}${flameChip(R)}</span></div>
  ${n.late && date === t ? `<span class="until">☾ <span class="num">${C.minTxt(n.clock * 60 + n.minute)}</span> · your day runs until ${esc(dayEndTxt(n))}</span>` : ''}
  ${grace ? `<div class="hero-seg" role="group" aria-label="Day being edited"><button data-act="editdate" data-v="${grace}" aria-pressed="${date === grace}">Yesterday</button><button data-act="editdate" data-v="${t}" aria-pressed="${date === t}">Today</button></div>` : ''}
  <div class="hero-row"><div class="rings" role="img" aria-label="Day ${dayNo} of 90, ${pills.filter(p => p.ok).length} of 4 pillars done">${ringsSVG(parts, mealsBad)}<div class="rings-c"><b class="num">${dayNo}</b><span>of 90</span></div></div>
  <div class="pills">${pills.map(p => `<button class="pill2 ${p.k}${p.ok ? ' ok' : ''}${p.bad ? ' bad' : ''}" data-act="panel" data-v="${p.k}"><i aria-hidden="true"></i><span>${esc(p.name)}</span><em class="num">${p.ok ? '✓ ' : ''}${esc(p.val)}</em></button>`).join('')}</div></div>
  ${commitHTML(R, d, date)}</section>`;
  // one lifted card: the most useful thing to do right now
  let lift = date === t ? reflectHTML(R) : '';
  if (!lift && !st.planNoted && P.pm.length && P.pm.every(m => !(m.items || []).length)) lift = !C.inRamadan(st, date) && !lastFullPlan(st) && isOwner() ? `<section class="card setupnudge"><h3>Your meal plan is empty</h3><p class="hint">Bring back your coach’s plan (5 meals and your supplements) in one tap.</p><div class="row"><button class="btn primary" data-act="coachrestore">Restore my coach’s plan</button><button class="btn ghost" data-act="planset">Set up a new one</button></div></section>` : !C.inRamadan(st, date) && lastFullPlan(st) ? `<section class="card setupnudge"><h3>Your meal plan is empty</h3><p class="hint">Bring back the plan you saved on ${fmt(lastFullPlan(st).k)} (${lastFullPlan(st).meals.length} meals), or set up a new one.</p><div class="row"><button class="btn primary" data-act="planrestore" data-v="${lastFullPlan(st).k}">Restore my plan</button><button class="btn ghost" data-act="planset">Set up a new one</button></div></section>` : `<section class="card setupnudge"><h3>Add your ${C.inRamadan(st, date) ? 'Ramadan ' : ''}meal plan</h3><p class="hint">Add your coach’s plan or your own in Me → Meal plan. Then one tap logs a meal and your calorie targets appear. No plan? Log what you eat in each meal.</p><div class="row"><button class="btn primary" data-act="planset">Set up my plan</button><button class="btn ghost" data-act="plannoted">I’ll log as I go</button></div></section>`;
  const next = upNextHTML(R, d, date, P);
  h += `<div class="lift">${lift || next}</div>`;
  if (lift && next) h += next;
  h += todayNotesHTML(R);
  const shown = ((lift ? '' : next).match(/data-act="meal" data-id="([^"]+)"/) || [])[1];
  h += todayListHTML(R, date, d, P, line, shown);
  return h;
}
// alerts that used to be banners, as quiet rows
function todayNotesHTML(R) {
  const n = now(), ev = R.todayEval, out = [];
  if (R.victory) out.push(['good', '90 days. Done.', `You finished all 90 days on attempt ${R.attemptNo}.`]);
  if (R.critical && !ev.complete) out.push(['bad', 'Never miss twice', 'Yesterday reset you to Day 1. Today is non-negotiable.']);
  if (ev.offPlan) out.push(['bad', 'Today can’t count yet', 'Something off-plan is logged. If it was a mistake, change it back.']);
  else if (!ev.complete && n.late) { const mm = n.end - (n.hour * 60 + n.minute); out.push(['warn', `Still ${C.DAYNAMES[C.weekday(n.date)]} until ${dayEndTxt(n)} (${Math.floor(mm / 60)} h ${mm % 60} min)`, 'Finish it now and the day locks in. Still missing: ' + ev.missing.join(' · ')]); }
  else if (!ev.complete && hoursLeft(n) <= 3) { const left = hoursLeft(n); out.push(['warn', `${left} hour${left === 1 ? '' : 's'} left to lock in today`, ev.missing.join(' · ')]); }
  { const b = budgetAt(today()); if (b && b.cut) out.push(['info', `Calories today: ${kc(b.target)} instead of ${kc(b.base)}`, `Paying back ${b.debtIn} kcal over plan this week, a little each day. Meals shows the smaller portions.`]); }
  const m = C.MILES.find(x => x[0] === R.done);
  if (ev.complete && m) out.push(['good', `Milestone: Day ${m[0]}`, `${m[1]}. Keep the chain going.`]);
  const rcp = [30, 60].find(c => R.dayNum === c + 1 || (R.dayNum === c && ev.complete));
  if (rcp) out.push(['good', `Your Day ${rcp} recap is ready`, 'See it in Progress.']);
  if (+today().slice(8) <= 3 && prevMonth() + '-31' >= S.settings.startDate) out.push(['good', `Your ${monthName(prevMonth())} report is ready`, 'Progress → Week → Share image.']);
  return out.map(([k, t, b]) => `<div class="note2 ${k}"><b>${esc(t)}</b><span>${esc(b)}</span></div>`).join('');
}
function todayListHTML(R, date, d, P, line, shown) {
  const st = S.settings, t = today(), meals = d.meals || {}, plan = C.plannedMeals(st, d, date), rows = [];
  const row = (act, v, ic, cls, title, sub, end) => `<button class="lrow${cls ? ' ' + cls : ''}" data-act="${act}" data-v="${v}"><span class="lic">${ic}</span><span class="lt"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="le num">${end || ''}</span></button>`;
  const logged = plan.filter(m => meals[m.id] && meals[m.id].status), open = plan.filter(m => !(meals[m.id] && meals[m.id].status) && m.id !== shown);
  if (logged.length) { const k = logged.reduce((s, m) => s + C.sumItems(meals[m.id].items || []).k, 0), off = logged.some(m => meals[m.id].status === 'off'); rows.push(row('panel', 'meals', off ? '!' : '✓', off ? 'bad' : 'ok', logged.length === plan.length ? 'All meals logged' : logged.map(m => m.name).join(', '), off ? 'Includes an off-plan meal' : '', `${kc(k)} kcal`)); }
  open.slice(0, 3).forEach(m => rows.push(row('panel', 'meals', esc(String(m.name).replace(/\D/g, '').slice(0, 2) || '•'), '', m.name, m.time || '', (m.items || []).length ? `${kc(C.sumItems(m.items).k)} kcal` : '')));
  if ((d.extras || []).length) rows.push(row('panel', 'meals', '+', '', `${d.extras.length} extra${d.extras.length === 1 ? '' : 's'}`, d.extras.map(x => x.name.split(',')[0]).join(', '), `${kc(d.extras.reduce((s, x) => s + C.itemMacros(x).k, 0))} kcal`));
  if (C.inRamadan(st, date) && date === t) { const r = C.ramadanOf(st), [ih, im] = r.iftar.split(':').map(Number), mins = now().clock * 60 + now().minute, left = ih * 60 + im - mins; rows.push(row('ramsetup', '', '☾', 'ram', left > 0 ? `Iftar in ${Math.floor(left / 60)} h ${left % 60} min` : 'Iftar time. Ramadan Kareem', `Ramadan day ${C.diffDays(r.from, date) + 1}`, '')); }
  dayPlans(date).forEach(p => rows.push(`<div class="lrow static"><span class="lic">⇢</span><span class="lt"><b>If ${esc(p.when)}</b><small>then ${esc(p.then)}</small></span></div>`));
  if (date === t) { const fw = focusWeek(), cur = (st.focus || {})[fw.key], f = cur && FOCUS[cur.id]; if (f) { const nn = Math.min(f.count(fw.ds, fw.from, fw.to), f.target); rows.push(row('focuspick', '', '⚑', nn >= f.target ? 'ok' : 'gold', f.name, 'This week’s focus', `${nn} / ${f.target}`)); } else rows.push(row('focuspick', '', '⚑', 'gold', 'Pick this week’s focus', 'One extra goal, never breaks your streak', '')); }
  const cheers = Object.values(S.cheers || {});
  if (cheers.length) rows.push(`<div class="lrow static cheer2"><span class="lic">👏</span><span class="lt"><b>${esc(cheers.map(c => c.name).join(', '))}</b><small>${esc(CHEER_TXT[cheers[0].kind] || CHEER_TXT.cheer)}</small></span><button class="btn small" data-act="cheersok">Thanks</button></div>`);
  if (st.group) { const fr = friendRows().filter(m => !m.me); if (fr.length) { const done = fr.filter(m => m.fresh && m.done).length, gs = groupStreak(); rows.push(row('ptab', 'friends', '★', 'water', `${done} of ${fr.length} friends locked in`, gs && gs.n ? `Group chain ${gs.n}` : fr.map(m => m.name).join(', '), '')); } }
  const bodyDone = d.weight || d.sleep;
  rows.push(row('panel', 'body', '☼', bodyDone ? 'ok' : '', 'Weight, sleep and note', bodyDone ? [d.weight && `${d.weight} kg`, d.sleep && `${d.sleep} h sleep`].filter(Boolean).join(' · ') : 'Morning check-in', ''));
  return `<section class="card list2">${rows.join('')}</section><p class="quote2">${esc(line)}</p>`;
}
const PANEL_T = { meals: 'Meals', water: 'Water', train: 'Training', supps: 'Supplements', body: 'Weight, sleep and note' };
function panelHTML() {
  const date = editDate(), d = S.days[date] || {}, P = C.evalDay(S.settings, d, date).P;
  const body = S.panel === 'meals' ? mealsHTML(date, d, P) + nutrientsHTML(date, d) : S.panel === 'water' ? waterHTML(P) : S.panel === 'train' ? trainCardHTML(date, d, P) : S.panel === 'supps' ? suppsHTML(date, d, P) : bodyHTML(date, d);
  return `<div class="sheet panelsheet" role="dialog" aria-modal="true" aria-label="${esc(PANEL_T[S.panel])}"><div class="grab" aria-hidden="true"></div><div class="spread"><h2>${esc(PANEL_T[S.panel])}</h2><button class="x" data-act="panelclose" aria-label="Close">×</button></div>${body}</div>`;
}
function drawPanel() {
  const el = $('panel'); if (!el) return;
  if (!S.panel || S.view !== 'today' || !S.settings) { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; } return; }
  const sc = el.firstElementChild ? el.firstElementChild.scrollTop : 0;
  el.hidden = false; el.innerHTML = panelHTML();
  if (el.firstElementChild) el.firstElementChild.scrollTop = sc;
}

function macrosHTML(tot, target) {
  const tk = kc(target.k), tp = kc(target.p);
  const cell = (label, v, unit, target) => `<div class="mac"><span>${label}</span><b class="num">${kc(v)}<small>${target ? ' / ' + target : ''} ${unit}</small></b>${target ? `<div class="mbar"><i class="${v > target * 1.05 && unit === 'kcal' ? 'over' : ''}" style="width:${Math.min(100, v / target * 100)}%"></i></div>` : ''}</div>`;
  return `<div class="macros">${cell('Calories', tot.k, 'kcal', tk)}${cell('Protein', tot.p, 'g', tp)}${cell('Carbs', tot.c, 'g')}${cell('Fat', tot.f, 'g')}</div>`;
}
const dropTag = it => C.isDrink(it) ? ' <span class="state s-water">counts as water</span>' : '';
function itemsEditor(items, scope) {
  return `<div class="items">${items.length ? items.map((it, i) => { const m = C.itemMacros(it); return `<div class="itm"><div class="nm">${it.meal ? '🍔 ' : ''}${esc(it.name)}${it.cheat ? ' <span class="state s-cheat">🍕 cheat meal</span>' : ''}${dropTag(it)}${comboPartsHTML(it)}${it.meal ? `<button class="link" data-act="mbedit" data-v="${scope}|${i}">Edit meal</button>` : ''}<small>${it.su ? esc(amountTxt(it)) + ' · ' : ''}${kc(m.k)} kcal · ${C.round(m.p, 1)} g protein</small></div>${it.meal ? '<span class="g"></span>' : `<label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(it.g, 1)}" data-grams="${scope}:${i}" aria-label="${esc(it.name)} ${C.isDrink(it) ? 'millilitres' : 'grams'}">${C.isDrink(it) ? 'ml' : 'g'}</label>`}<button class="x" data-act="rmitem" data-v="${scope}:${i}" aria-label="Remove ${esc(it.name)}">×</button></div>`; }).join('') : '<p class="hint">No foods yet.</p>'}
  <div class="row"><button class="btn small" data-act="addfood" data-v="${scope}">+ Add food</button>${/^(plan|meal):/.test(scope) ? `<button class="btn small" data-act="mealfat" data-v="${scope}">${mealFatItem(items) ? '🧈 Change cooking fat' : '🧈 + Cooking fat'}</button>` : ''}</div></div>`;
}
function mealsHTML(date, d, P) {
  const st = S.settings, meals = d.meals || {}, tot = C.dayTotals(st, d), plan = C.mealsOn(st, date);
  const unl = plan.filter(m => (m.items || []).length && !(d.skip || {})[m.id] && !(meals[m.id] && meals[m.id].status)).length;
  let h = `<section class="card" id="sec-meals"><div class="card-h"><h2>Meals</h2>${pill(P.off.length || P.offExtra.length ? 'bad' : P.mealsOk ? 'done' : 'todo', P.off.length || P.offExtra.length ? 'Off-plan' : `${P.clean} / ${P.pm.length} on plan`)}</div>
  ${macrosHTML(tot, dayTarget(date, d))}${trimCardHTML(date)}${unl ? `<button class="btn good" data-act="allplan">Log ${unl === plan.length ? 'all meals' : unl === 1 ? 'the last planned meal' : 'the other ' + unl} as planned</button>` : ''}<div class="tl">`;
  const cs = st.cheat && st.cheat.on ? C.cheatsUsed(st, S.days, date, date) : null;
  const CH = cs ? { ...cs, kind: st.cheat.kind || 'meal', left: Math.max(0, cs.max - cs.used - (P.cheats || 0)), usedTxt: [...cs.on, ...(P.cheats ? [date] : [])].map(x => x === today() ? 'today' : C.DAYNAMES[C.weekday(x)].slice(0, 3) + ' ' + C.parse(x).getDate()).join(', ') } : null;
  if (CH && CH.kind === 'day') h += `<div class="cheatday">${d.cheatDay ? `<button class="btn cheat" data-act="cheatday" aria-pressed="true">🍕 Free cheat day ✓ · tap to undo</button><p class="hint">Every meal and extra today counts as on plan. Going over your calories is fine.</p>` : CH.left ? `<button class="btn cheat" data-act="cheatday">🍕 Use your free cheat day</button>` : `<p class="hint">🍕 Free cheat day used ${esc(CH.usedTxt)}. The next one is free from ${fmt(C.addDays(CH.to, 1))}.</p>`}</div>`;
  plan.forEach((m, i) => {
    const md = meals[m.id] || {}, skip = d.skip && d.skip[m.id], status = skip ? 'skip' : md.status || '';
    const plan = C.sumItems(m.items);
    const logged = md.status ? C.sumItems(md.items || []) : null;
    const open = S.openMeal === m.id && (md.status === 'swap' || md.status === 'off' || md.status === 'cheat');
    if (md.status && !open && S.expandMeal !== m.id) {
      const lbl = md.status === 'plan' ? 'As planned' : md.status === 'swap' ? 'Changed' : md.status === 'cheat' ? '🍕 Cheat meal' : 'Off-plan';
      h += `<div class="meal ${status} compact"><div class="mi">${svgI(mealIcon(m, i))}</div><button class="mrow" data-act="expandmeal" data-v="${m.id}" aria-label="${esc(m.name)}: ${lbl}. Tap to change"><span class="meal-n">${esc(m.name)} <span>${esc(m.time || '')}</span></span><span class="meal-sum"><span class="mstat ${md.status}">${lbl}</span> <b>${kc(logged.k)} kcal · ${C.round(logged.p, 1)} g P</b></span></button></div>`;
      return;
    }
    h += `<div class="meal ${status}"><div class="mi">${svgI(mealIcon(m, i))}</div><div class="mbody">
      <div class="spread"><div class="meal-n">${esc(m.name)} <span>${esc(m.time || '')}</span></div>${skip ? `<button class="link" data-act="unskip" data-v="${m.id}">Undo</button>` : `<button class="link" data-act="skip" data-v="${m.id}">Not today</button>`}</div>`;
    if (skip) { h += `<p class="meal-sum">Not part of today’s plan.</p></div></div>`; return; }
    h += `<div class="meal-sum">${md.status ? `Logged <b>${kc(logged.k)} kcal · ${C.round(logged.p, 1)} g protein</b>` : m.items.length ? `Plan: ${esc(m.items.map(x => x.name.split(',')[0]).join(', '))} · <b>${kc(plan.k)} kcal</b>` : 'No plan set for this meal. Log what you ate.'}</div>
      <div class="seg wide" role="group" aria-label="${esc(m.name)}">${m.items.length ? `<button class="clean" data-act="meal" data-id="${m.id}" data-v="plan" aria-pressed="${md.status === 'plan'}">As planned</button><button class="clean" data-act="meal" data-id="${m.id}" data-v="swap" aria-pressed="${md.status === 'swap'}">Changed</button>` : `<button class="clean" data-act="meal" data-id="${m.id}" data-v="swap" aria-pressed="${md.status === 'swap'}">Log what I ate</button>`}<button class="off" data-act="meal" data-id="${m.id}" data-v="off" aria-pressed="${md.status === 'off'}">Off-plan</button>${CH && CH.kind === 'meal' ? `<button class="cheat" data-act="meal" data-id="${m.id}" data-v="cheat" aria-pressed="${md.status === 'cheat'}" ${!CH.left && md.status !== 'cheat' ? 'disabled' : ''}>${CH.left || md.status === 'cheat' ? '🍕 Cheat (free)' : `🍕 Used ${esc(CH.usedTxt)}`}</button>` : ''}</div>${CH && CH.kind === 'meal' && !CH.left && md.status !== 'cheat' && !md.status ? `<p class="hint">This week’s free cheat meal was ${esc(CH.usedTxt)}. The next one is free from ${fmt(C.addDays(CH.to, 1))}.</p>` : ''}${md.status === 'cheat' ? '<p class="hint">Free cheat meal: counts as on plan. Logging what you ate is optional but keeps your calories honest.</p>' : ''}`;
    if (!md.status) h += `<button class="link" data-act="copymeal" data-v="${m.id}">Copy a past meal</button>`;
    if (md.status === 'plan' && S.expandMeal === m.id) { const fi = mealFatItem(md.items); h += `<div class="row"><button class="btn small" data-act="mealfat" data-v="meal:${m.id}">🧈 ${fi ? `Cooked with ${esc(fatAmt(fi.fid, fi.sq || 1))} ${esc((FATS.find(x => x.k === fi.fid) || { label: '' }).label.toLowerCase())} · +${kc(fi.per.k * fi.g / 100)} kcal` : '+ Cooking fat'}</button><button class="link" data-act="expandmeal" data-v="${m.id}">Done</button></div>`; }
    if (md.status === 'swap' || md.status === 'off' || md.status === 'cheat') {
      h += open ? `${itemsEditor(md.items || [], 'meal:' + m.id)}<input class="note" id="note-${m.id}" data-note="${m.id}" placeholder="Note (optional)" value="${esc(md.note || '')}"><div class="row"><button class="link" data-act="closemeal">Done editing</button><button class="link" data-act="copymeal" data-v="${m.id}">Copy a past meal</button></div>`
        : `<button class="link" data-act="openmeal" data-v="${m.id}">Edit foods (${(md.items || []).length})</button>`;
    }
    h += `</div></div>`;
  });
  h += `</div>`;
  const ex = d.extras || [];
  h += `<div class="sgrp"><span class="sub">Extras outside your meals</span>${ex.length ? `<div class="items">${ex.map((it, i) => { const mm = C.itemMacros(it); return `<div class="itm"><div class="nm">${it.meal ? '🍔 ' : ''}${esc(it.name)} ${it.cheat ? '<span class="state s-cheat">🍕 cheat meal</span>' : it.off ? '<span class="state s-bad">off-plan</span>' : ''}${dropTag(it)}${comboPartsHTML(it)}${it.meal ? `<button class="link" data-act="mbedit" data-v="extra|${i}">Edit meal</button>` : ''}<small>${it.su ? esc(amountTxt(it)) + ' · ' : ''}${kc(mm.k)} kcal · ${C.round(mm.p, 1)} g protein</small></div>${it.meal ? '<span class="g"></span>' : `<label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(it.g, 1)}" data-grams="extra:${i}" aria-label="${esc(it.name)} ${C.isDrink(it) ? 'millilitres' : 'grams'}">${C.isDrink(it) ? 'ml' : 'g'}</label>`}<button class="x" data-act="rmitem" data-v="extra:${i}" aria-label="Remove">×</button></div>`; }).join('')}</div>` : ''}
  <div class="row"><button class="btn small" data-act="addfood" data-v="extra">+ Log an extra (drink, snack, cheat)</button><button class="btn small" data-act="crave">🌊 Craving? Wait 10 minutes</button></div></div></section>`;
  return h;
}
function waterHTML(P) {
  const pct = Math.min(100, P.w / P.goal * 100); let ticks = '';
  for (let l = 1; l * 1000 < P.goal; l++) ticks += `<i class="tick${l * 1000 <= P.w ? ' on' : ''}" style="bottom:${(l * 1000 / P.goal * 100).toFixed(1)}%"><span>${l}L</span></i>`;
  const left = Math.max(0, P.goal - P.w);
  return `<section class="card" id="sec-water"><div class="card-h"><h2>Water</h2>${pill(P.w >= P.goal ? 'done' : 'todo', P.w >= P.goal ? 'Goal hit' : `${L(left)} L to go`)}</div>
  <div class="water-row"><div class="bottle" role="img" aria-label="${L(P.w)} of ${L(P.goal)} litres"><div class="fill" style="height:${pct}%"></div>${ticks}</div>
  <div class="water-info"><div class="big num">${L(P.w)}<small> / ${L(P.goal)} L</small></div><p class="hint num">${left ? `${Math.ceil(left / 250)} glasses of 250 ml left` : 'Done for today'}</p>${P.wDrinks ? `<p class="hint num">Includes ${L(P.wDrinks)} L from drinks you logged in meals and extras.</p>` : ''}
  <div class="wbtns"><button class="btn wat" data-act="water" data-n="250">+ 250 ml</button><button class="btn wat" data-act="water" data-n="500">+ 500 ml</button><button class="btn" data-act="water" data-n="1000">+ 1 L</button><button class="btn ghost" data-act="water" data-n="-250">− 250 ml</button></div></div></div>
  ${P.goal > 5000 ? '<p class="safety">At this goal, spread it across the day: no more than about 1 L per hour.</p>' : ''}</section>`;
}
const actsOn = date => Object.values(S.acts).filter(a => a.date === date);
function trainCardHTML(date, d, P) {
  const gym = d.gymTime || S.settings.gymTime || 'am';
  const acts = actsOn(date);
  let h = `<section class="card" id="sec-train"><div class="card-h"><h2>Training</h2>${pill(P.trained ? 'done' : 'todo', P.tt === 'rest' ? 'Rest' : P.trained ? (d.trainingSource === 'strava' ? 'Done · Strava' : 'Done') : 'Not yet')}</div>`;
  if (P.tt === 'rest') h += `<p class="hint">${C.TT.rest.sub}. Change your weekly plan in Me.</p>`;
  else h += `<button class="check" data-act="train" aria-pressed="${!!d.trainingDone}"><span class="box"></span><span><b>${C.TT[P.tt].label}</b><span>${C.TT[P.tt].sub}</span></span></button>${(P.tt === 'gym' || P.tt === 'cali') ? (() => { const tl = TR.todayLine(); return tl ? `<button class="btn ${tl.done ? '' : 'primary'} block" data-act="tab" data-v="train">${esc(tl.done ? `${tl.name} done · see summary` : tl.live ? `Back to ${tl.name}` : `Start ${tl.name}`)}</button>` : `<button class="btn primary block" data-act="tab" data-v="train">Set up your training plan</button>`; })() : ''}`;
  if (acts.length) h += `<div class="acts">${acts.map(a => `<div class="act"><span><b>${esc(a.name || a.type)}</b> · from Strava</span><span class="num">${a.min} min${a.dist ? ' · ' + C.round(a.dist / 1000, 2) + ' km' : ''}</span></div>`).join('')}</div>`;
  h += sportsListHTML(date, d);
  h += `<div class="spread"><span class="hint">Gym time today</span><div class="seg" role="group" aria-label="Gym time"><button data-act="gymtime" data-v="am" aria-pressed="${gym === 'am'}">Morning</button><button data-act="gymtime" data-v="pm" aria-pressed="${gym === 'pm'}">Night</button></div></div></section>`;
  return h;
}
function suppsHTML(date, d, P) {
  const gym = d.gymTime || S.settings.gymTime || 'am', supps = S.settings.supps || [];
  const groups = {};
  supps.forEach(s => { const slot = s[gym] || 'Any time'; (groups[slot] = groups[slot] || []).push(s); });
  const order = Object.keys(groups).sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b));
  if (!supps.length) return `<section class="card" id="sec-supps"><div class="card-h"><h2>Supplements</h2>${pill('done', 'None required')}</div><p class="hint">No supplements set. If you take any, add them in Me and pick which ones are required each day.</p><button class="btn small" data-act="tab" data-v="setup">Add in Me</button></section>`;
  return `<section class="card" id="sec-supps"><div class="card-h"><h2>Supplements</h2>${pill(P.sDone === P.req.length ? 'done' : 'todo', `${P.sDone} / ${P.req.length} core`)}</div>
  <p class="hint">${gym === 'am' ? 'Morning gym day timing.' : 'Night gym day: no fat burner within 5 hours of bed.'}</p>${cafHTML(d)}
  ${order.map(slot => `<div class="sgrp"><span class="sub">${esc(slot)}</span><div class="supps">${groups[slot].map(s => `<button class="supp" data-act="supp" data-id="${esc(s.id)}" aria-pressed="${!!(d.supps || {})[s.id]}">${esc(s.name)}${s.req ? '' : ' <em>optional</em>'}</button>`).join('')}</div></div>`).join('')}</section>`;
}
function cafHTML(d) {
  const sp = d.supps || {}, coffee = it => { const n = it.name || '', g = it.g || 0; if (/coffee|espresso|cappuccino|latte|nescaf|قهوة/i.test(n)) return g / 240 * 95; if (/\btea\b|شاي/i.test(n)) return g / 240 * (/green|أخضر/i.test(n) ? 28 : 47); if (/cola|pepsi|coke|كولا|بيبسي/i.test(n)) return g / 330 * 34; return 0; };
  let mg = (sp.burner ? 125 : 0) + (sp.burner2 ? 125 : 0);
  (d.extras || []).forEach(it => mg += coffee(it));
  Object.values(d.meals || {}).forEach(md => (md.items || []).forEach(it => mg += coffee(it)));
  mg = Math.round(mg);
  if (!mg) return '';
  return mg > 400 ? `<p class="safety">Caffeine today ≈ ${mg} mg, above the 400 mg daily limit. Skip more coffee or the second cap.</p>` : `<p class="hint">Caffeine today ≈ ${mg} mg of a 400 mg daily limit (fat burner caps + coffee, tea and cola you logged).</p>`;
}
function bodyHTML(date, d) {
  const sleeps = [4, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
  return `<section class="card"><div class="card-h"><h2>Body &amp; notes</h2>${pill('opt', 'Optional')}</div>
  <div class="form"><label>Morning weight (kg)<input class="in" id="b-weight" type="number" inputmode="decimal" step="0.1" data-dayfield="weight" value="${d.weight || ''}"></label>
  <label>Sleep last night · goal ${S.settings.sleepGoal || 7.5} h<select class="in" id="b-sleep" data-dayfield="sleep"><option value="">–</option>${sleeps.map(v => `<option value="${v}" ${d.sleep === v ? 'selected' : ''}>${v} h</option>`).join('')}</select></label>
  <label>Resting heart rate<input class="in" id="b-rhr" type="number" inputmode="numeric" data-dayfield="rhr" placeholder="bpm, on waking" value="${d.rhr || ''}"></label></div>
  <label class="full-note">Note for today<textarea class="in" id="b-note" rows="2" maxlength="400" data-daynote="1" placeholder="How it went, cravings, wins. Only you see this.">${esc(d.note || '')}</textarea></label>
  <div class="spread"><span class="hint">Energy today</span><div class="dots" role="group" aria-label="Energy 1 to 5">${[1, 2, 3, 4, 5].map(v => `<button data-act="energy" data-v="${v}" aria-pressed="${d.energy === v}">${v}</button>`).join('')}</div></div></section>`;
}

/* ---------- TRAIN ---------- */
const weekNo = () => Math.floor(C.diffDays(S.settings.startDate, today()) / 7) + 1;
const suggestedPhase = () => { const w = weekNo(); return w <= 4 ? 1 : w <= 10 ? 2 : 3; };
function exHistory(exId, before) {
  return Object.keys(S.days).filter(k => (!before || k < before) && S.days[k].cali && Array.isArray(S.days[k].cali[exId]) && S.days[k].cali[exId].some(v => v > 0)).sort();
}
function bestOf(exId, before) { let b = 0; exHistory(exId, before).forEach(k => S.days[k].cali[exId].forEach(v => { if (v > b) b = v; })); return b; }
function framesHTML(e) {
  if (e.fr.length === 1) return `<div class="frames one"><div class="frame">${figSVG(POSE[e.fr[0]], e.pr, e.name)}<em>${esc(e.lb[0])}</em></div></div>`;
  return `<div class="frames"><div class="frame">${figSVG(POSE[e.fr[0]], e.pr, e.name + ' start')}<em>${esc(e.lb[0])}</em></div><svg class="arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M14 7l5 5-5 5"/></svg><div class="frame">${figSVG(POSE[e.fr[1]], e.pr, e.name + ' finish')}<em>${esc(e.lb[1])}</em></div></div>`;
}
function trainHTML(R) { return TR.trainHTML(); }
function caliHTML() {
  const date = editDate(), ph = S.phase || suggestedPhase(), d = S.days[date] || {}, cali = d.cali || {}, tt = C.trainType(S.settings, date);
  let h = `<section class="card"><div class="card-h"><h2>Calisthenics</h2>${pill(d.trainingDone ? 'done' : 'todo', d.trainingDone ? 'Session done' : fmt(date))}</div>
  <p class="hint">No bar needed. Week ${weekNo()} suggests Phase ${suggestedPhase()}. Move up when an exercise shows “Ready for the next step”.</p>
  <div class="phases" role="group" aria-label="Phase">${[1, 2, 3].map(p => `<button data-act="phase" data-v="${p}" aria-pressed="${p === ph}">Phase ${p}</button>`).join('')}</div></section>`;
  EX.filter(e => e.ph === ph).forEach(e => {
    const vals = Array.isArray(cali[e.id]) ? cali[e.id] : [], n = Math.max(e.sets, vals.length);
    const hist = exHistory(e.id, date), lastK = hist[hist.length - 1], last = lastK ? S.days[lastK].cali[e.id].filter(v => v > 0) : null;
    const best = bestOf(e.id), cur = vals.filter(v => v > 0);
    const ready = (cur.length >= e.sets && cur.slice(0, e.sets).every(v => v >= e.top)) || (last && last.length >= e.sets && last.slice(0, e.sets).every(v => v >= e.top));
    const u = e.unit === 's' ? ' s' : '';
    h += `<section class="card ex"><div class="ex-h"><div><h3>${esc(e.name)}</h3><span class="tag">${esc(e.tag)}</span></div><span class="target">${e.sets} × ${e.lo}–${e.top}${u}</span></div>
    ${framesHTML(e)}<p class="cue">${esc(e.cue)}</p>
    <div class="sets">${Array.from({ length: n }, (_, i) => `<label for="set-${e.id}-${i}">Set ${i + 1}<input id="set-${e.id}-${i}" class="${vals[i] >= e.top ? 'hit' : ''}${last && vals[i] > (last[i] || 0) ? ' beat' : ''}" type="number" inputmode="numeric" min="0" data-set="${e.id}" data-i="${i}" placeholder="${last && last[i] ? 'last ' + last[i] : e.unit === 's' ? 'sec' : 'reps'}" value="${vals[i] > 0 ? vals[i] : ''}"></label>`).join('')}
    <button class="mini" data-act="addset" data-id="${e.id}">+ set</button></div>
    <div class="row">${e.unit === 's' ? `<button class="btn small primary" data-act="hold" data-id="${e.id}">Start hold timer</button>` : ''}<button class="btn small" data-act="rest" data-v="${e.unit === 's' ? 60 : 90}">Rest ${e.unit === 's' ? 60 : 90} s</button></div>
    <div class="ex-f"><span class="num">${last ? `Last (${fmt(lastK)}): ${last.join(' · ')}${u}` : 'No previous session yet'}${best ? ` · Best ${best}${u}` : ''}</span>${ready ? '<span class="earned">Ready for the next step</span>' : ''}<a href="${YT + e.yt}" target="_blank" rel="noopener">Form video</a></div></section>`;
  });
  h += `<button class="btn primary block" data-act="finish">${d.trainingDone ? 'Session marked done' : 'Finish session'}</button>`;
  if (tt !== 'cali' && tt !== 'recovery') h += `<p class="hint">Today is set as “${esc(C.TT[tt].label)}”. Finishing a session here also ticks today’s training.</p>`;
  return h;
}
function stamWeekRange(w) { const s = C.addDays(S.settings.startDate, (w - 1) * 7); return [s, C.addDays(s, 6)]; }
function stamSessions(from, to) {
  const out = [];
  Object.keys(S.days).filter(k => k >= from && k <= to).sort().forEach(k => (S.days[k].stamina || []).forEach((s, i) => out.push({ ...s, date: k, idx: i, src: 'manual' })));
  Object.values(S.acts).filter(a => a.date >= from && a.date <= to && C.CARDIO_TYPES.includes(a.type)).forEach(a => out.push({ date: a.date, mode: a.name || a.type, min: a.min, kind: 'easy', dist: a.dist, hr: a.hr, src: 'strava' }));
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}
function staminaHTML() {
  const w = weekNo(), wk = C.staminaWeek(Math.min(w, 12)), [from, to] = stamWeekRange(w), ses = stamSessions(from, to), date = editDate();
  const st = S.settings.stamina || { on: true, days: [1, 3, 5] };
  let streak = 0; for (let k = w - 1; k >= 1; k--) { const [a, b] = stamWeekRange(k); if (stamSessions(a, b).length >= 3) streak++; else break; }
  if (ses.length >= 3) streak++;
  let h = `<section class="card"><div class="card-h"><h2>Stamina · week ${w}</h2>${pill('opt', 'Bonus · never breaks the streak')}</div>
  <p class="hint"><b>${wk.phase} phase.</b> ${esc(wk.how)}</p>
  <div class="slots">${wk.sessions.map((s, i) => { const done = ses[i]; return `<div class="slot ${done ? 'done' : ''}"><b>${done ? 'Done' : 'Session ' + (i + 1)}</b><span>${esc(done ? `${done.mode} · ${done.min} min` : s.text)}</span></div>`; }).join('')}</div>
  <div class="spread"><span class="hint">Stamina streak: <b class="num">${streak}</b> full week${streak === 1 ? '' : 's'}</span><span class="hint">Days: ${(st.days || []).map(i => C.DAYNAMES[i].slice(0, 3)).join(', ') || 'none set'}</span></div>
  ${C.isTestWeek(w) ? `<div class="banner b-info"><strong>Test week</strong><p>Do the 12-minute test once this week: same machine as last time, cover as much distance as you can in 12 minutes, then log it as a Test.</p></div>` : ''}</section>`;
  h += `<section class="card"><div class="card-h"><h2>Log a session</h2></div>
  <div class="form"><label>Machine<select class="in" id="st-mode">${CARDIO_MODES.map(m => `<option>${m}</option>`).join('')}</select></label>
  <label>Type<select class="in" id="st-kind"><option value="easy">Easy</option><option value="intervals">Intervals</option><option value="test">12-min test</option></select></label>
  <label>Minutes<input class="in" id="st-min" type="number" inputmode="numeric" value="${wk.sessions[0].min}"></label>
  <label>Distance (km, for tests)<input class="in" id="st-dist" type="number" inputmode="decimal" step="0.01"></label>
  <label class="full">Average heart rate (optional)<input class="in" id="st-hr" type="number" inputmode="numeric"></label></div>
  <button class="btn primary block" data-act="stamlog">Save session for ${date === today() ? 'today' : 'yesterday'}</button>
  ${ses.length ? `<ul class="list">${ses.map(s => `<li><span>${fmt(s.date)} · ${esc(s.mode)}${s.kind === 'test' ? ' · test' : s.kind === 'intervals' ? ' · intervals' : ''}</span><span class="num">${s.min} min${s.dist ? ' · ' + C.round(s.dist > 100 ? s.dist / 1000 : s.dist, 2) + ' km' : ''}${s.src === 'manual' ? ` <button class="x" data-act="stamdel" data-v="${s.date}:${s.idx}" aria-label="Delete">×</button>` : ''}</span></li>`).join('')}</ul>` : ''}</section>`;
  // weekly minutes and tests
  const weeks = Array.from({ length: Math.min(Math.max(w, 1), 12) }, (_, i) => { const [a, b] = stamWeekRange(i + 1); return stamSessions(a, b).reduce((s, x) => s + (x.min || 0), 0); });
  const tests = []; Object.keys(S.days).sort().forEach(k => (S.days[k].stamina || []).forEach(s => { if (s.kind === 'test' && s.dist) tests.push({ date: k, dist: s.dist, mode: s.mode }); }));
  const rhr = Object.keys(S.days).sort().filter(k => S.days[k].rhr).map(k => ({ date: k, v: S.days[k].rhr }));
  h += `<section class="card"><div class="card-h"><h2>Stamina progress</h2></div>${barsHTML(weeks, 'min', 'Cardio minutes per week')}
  <div class="review"><div><b class="num">${tests.length ? C.round(tests[tests.length - 1].dist, 2) + ' km' : '—'}</b><span>Latest 12-min test${tests.length > 1 ? ` (first ${C.round(tests[0].dist, 2)} km)` : ''}</span></div><div><b class="num">${rhr.length ? rhr[rhr.length - 1].v : '—'}</b><span>Resting heart rate${rhr.length > 1 ? ` (first ${rhr[0].v})` : ' · log it in Body & recovery'}</span></div></div></section>`;
  return h;
}
function barsHTML(vals, unit, label, labels) {
  const W = 320, H = 120, pb = 18, max = Math.max(1, ...vals), bw = (W - 10) / Math.max(vals.length, 1);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${vals.map((v, i) => { const hh = (H - pb - 14) * v / max; return `<rect x="${5 + i * bw + 3}" y="${H - pb - hh}" width="${bw - 6}" height="${Math.max(hh, v ? 2 : 0)}" rx="3" fill="${i === vals.length - 1 ? 'var(--spark)' : 'var(--accent)'}"/><text x="${5 + i * bw + bw / 2}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="Alexandria,sans-serif">${labels ? esc(labels[i]) : 'W' + (i + 1)}</text>${v && (vals.length <= 8 || i === vals.length - 1) ? `<text x="${5 + i * bw + bw / 2}" y="${H - pb - hh - 3}" text-anchor="middle" font-size="9" fill="var(--ink-2)" font-family="Alexandria,sans-serif">${v}</text>` : ''}`; }).join('')}</svg><p class="hint">${esc(label)}</p></div>`;
}

/* ---------- PROGRESS ---------- */
function weekReview() {
  const t = today(), st = S.settings, days = [];
  for (let i = 6; i >= 0; i--) days.push(C.addDays(t, -i));
  const valid = days.filter(d => d >= st.startDate && d < t || (d === t));
  let locked = 0; const miss = { Meals: 0, Water: 0, Training: 0, Supplements: 0 };
  let kS = 0, pS = 0, tkS = 0, tpS = 0, nN = 0, sl = 0, slN = 0, slG = 0;
  valid.forEach(d => {
    const day = S.days[d] || {}, ev = C.evalDay(st, day, d);
    if (ev.complete) locked++;
    if (d < t) { if (!ev.P.mealsOk) miss.Meals++; if (ev.P.w < ev.P.goal) miss.Water++; if (!ev.P.trained) miss.Training++; if (ev.P.sDone < ev.P.req.length) miss.Supplements++; }
    const tot = C.dayTotals(st, day); if (tot.k > 0) { const tg = C.planTargets(st, day, d); kS += tot.k; pS += tot.p; tkS += tg.k; tpS += tg.p; nN++; }
    if (day.sleep) { sl += day.sleep; slN++; if (day.sleep >= (st.sleepGoal || 7.5)) slG++; }
  });
  const cardio = stamSessions(days[0] > st.startDate ? days[0] : st.startDate, t).reduce((s, x) => s + (x.min || 0), 0);
  const worst = Object.entries(miss).sort((a, b) => b[1] - a[1])[0];
  const wAvg = (end) => { const v = []; for (let i = 0; i < 7; i++) { const dd = S.days[C.addDays(end, -i)]; if (dd && dd.weight) v.push(dd.weight); } return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const wNow = wAvg(t), wPrev = wAvg(C.addDays(t, -7));
  const cheats = valid.map(x => [x, C.pillars(st, S.days[x] || {}, x).cheats]).filter(x => x[1] && st.cheat && st.cheat.on);
  return { cheats, locked, miss, past: valid.filter(x => x < t).length, wNow, n: valid.length, worst, kcal: nN ? kS / nN : null, prot: nN ? pS / nN : null, tk: nN ? tkS / nN : null, tp: nN ? tpS / nN : null, sleep: slN ? sl / slN : null, slG, slN, cardio, wDelta: wNow && wPrev ? wNow - wPrev : null };
}
function progressHTML(R) {
  const st = S.settings, t = today(), rv = weekReview();
  const G = { friends: friendsTabsHTML() };
  let h = recapHTML(R) + weeklyCalHTML() + `<section class="card"><div class="card-h"><h2>Last 7 days</h2>${pill(rv.locked === rv.n ? 'done' : 'todo', `${rv.locked} / ${rv.n} locked in`)}</div>
  <div class="review"><div><b>${rv.worst && rv.worst[1] ? esc(rv.worst[0]) : 'None'}</b><span>${rv.worst && rv.worst[1] ? `Most missed (${rv.worst[1]} day${rv.worst[1] === 1 ? '' : 's'})` : 'Nothing missed'}</span></div>
  <div><b class="num">${rv.prot ? kc(rv.prot) + ' g' : '—'}</b><span>Avg protein${rv.tp ? ` · plan ${kc(rv.tp)} g` : ''}</span></div>
  <div><b class="num">${rv.kcal ? kc(rv.kcal) : '—'}</b><span>Avg calories${rv.tk ? ` · plan ${kc(rv.tk)}` : ''}</span></div>
  <div><b class="num">${rv.cardio} min</b><span>Cardio</span></div>
  <div><b class="num">${rv.sleep ? C.round(rv.sleep, 1) + ' h' : '—'}</b><span>Avg sleep${rv.slN ? ` · goal met ${rv.slG}/${rv.slN}` : ''}</span></div>
  <div><b class="num">${rv.wDelta == null ? '—' : (rv.wDelta > 0 ? '+' : '') + C.round(rv.wDelta, 1) + ' kg'}</b><span>Weight trend (7-day avg)</span></div></div>${rv.cheats.length ? `<p class="hint">🍕 Free cheat ${rv.cheats.some(x => (S.days[x[0]] || {}).cheatDay) ? 'day' : 'meal'}: ${rv.cheats.map(x => esc(C.DAYNAMES[C.weekday(x[0])].slice(0, 3)) + ' ' + C.parse(x[0]).getDate()).join(', ')}</p>` : ''}
  ${(() => { const aw = activityWeek(), pct = Math.min(100, aw.mod / 150 * 100); return `<div class="actweek"><div class="spread"><span><b>Activity</b> · ${aw.min} min${aw.n ? ` · ${aw.n} sport session${aw.n === 1 ? '' : 's'} · ≈ ${kc(aw.kcal)} kcal` : ''}</span><span class="num">${kc(aw.mod)} / 150</span></div><div class="mbar"><i style="width:${pct}%"></i></div><p class="hint">Sports and cardio, as moderate-effort minutes (hard minutes count double). The WHO recommends 150–300 a week on top of strength training.</p></div>`; })()}
  <div class="row"><button class="btn primary" data-act="shareweekimg">Send coach report (image)</button><button class="btn" data-act="share">As text</button></div></section>` + insightsHTML();
  G.week = monthCardHTML() + h; h = '';
  { const ws = myWS(today()); TR.setMuscleWeek(ws, C.addDays(ws, 6)); G.muscles = TR.musclesHTML(ws, C.addDays(ws, 6)); }
  h += `<div class="stats"><div class="stat feature"><div class="big num">${R.done}</div><span>Days locked in</span></div><div class="stat"><div class="big num">${Math.min(R.dayNum, 90)}</div><span>Day now</span></div><div class="stat"><div class="big num">${R.best}</div><span>Best streak</span></div><div class="stat"><div class="big num">${Math.floor(R.done / 7)}</div><span>Perfect weeks</span></div></div>`;
  const ms = C.MILES.map(m => m[0]);
  h += `<section class="card"><div class="card-h"><h2>The chain</h2><span class="hint">Tap a day to see it</span></div><div class="grid90">${Array.from({ length: 90 }, (_, i) => { const dt = C.addDays(R.attemptStart, i); let c = ''; if (dt <= t && C.evalDay(st, S.days[dt], dt).complete) c = 'done'; else if (dt === t) c = 'today'; else if (dt === R.grace) c = 'open'; if (ms.includes(i + 1)) c += ' m'; return dt <= t ? `<button class="${c}" data-act="dayview" data-v="${dt}" aria-label="Day ${i + 1}, ${fmt(dt)}">${i + 1}</button>` : `<i class="${c}" title="Day ${i + 1} · ${fmt(dt)}">${i + 1}</i>`; }).join('')}</div></section>`;
  h += `<section class="card"><div class="card-h"><h2>Milestones</h2>${pill('todo', `${C.MILES.filter(m => R.done >= m[0]).length} / ${C.MILES.length}`)}</div><div class="miles">${C.MILES.map(m => `<div class="mile ${R.done >= m[0] ? 'got' : ''}"><b class="num">${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div></section>`;
  if (R.attempts.length) h += `<section class="card"><div class="card-h"><h2>Attempts</h2></div><ul class="list">${R.attempts.map((a, i) => `<li><span>Attempt ${i + 1}</span><span class="num">${a.len} day${a.len === 1 ? '' : 's'} · broke ${fmt(a.fail)}</span></li>`).join('')}<li><span>Attempt ${R.attemptNo}</span><span class="num">${R.done} days and counting</span></li></ul></section>`;
  G.chain = h; h = '';
  // weight
  const pts = {};
  if (st.startWeight) pts[st.startDate] = st.startWeight;
  Object.values(S.checkins).forEach(c => { if (c.weight) pts[c.date] = c.weight; });
  Object.keys(S.days).forEach(k => { if (S.days[k].weight) pts[k] = S.days[k].weight; });
  const arr = Object.keys(pts).sort().map(k => ({ date: k, weight: pts[k] }));
  h += `<section class="card"><div class="card-h"><h2>Weight</h2>${arr.length ? pill('todo', `${arr[arr.length - 1].weight} kg`) : ''}</div>${arr.length >= 2 ? winsHTML(arr, st, rv) + weightChart(arr, st.goalWeight) + projHTML(arr, st, R.attemptStart) : '<p class="hint">Log your morning weight in Today, or a weekly check-in below. The trend appears after two weigh-ins.</p>'}</section>`;
  if (arr.length >= 2) h += burnHTML(arr, st);
  // nutrition 14 days
  const kd = [], kl = []; for (let i = 13; i >= 0; i--) { const dd = C.addDays(t, -i); kd.push(kc(C.dayTotals(st, S.days[dd] || {}).k)); kl.push(i === 0 ? 'Now' : String(C.parse(dd).getDate())); }
  if (kd.some(v => v)) h += `<section class="card"><div class="card-h"><h2>Calories</h2><span class="hint">${fmt(C.addDays(t, -13))} – today</span></div>${barsHTML(kd, 'kcal', `Calories per day. The orange bar is today.${kd.slice(0, 13).filter(Boolean).length ? ` Average of logged days: ${kc(kd.slice(0, 13).filter(Boolean).reduce((a, b) => a + b, 0) / kd.slice(0, 13).filter(Boolean).length)} kcal.` : ''}`, kl)}</section>`;
  // check-in
  const cks = Object.values(S.checkins).sort((a, b) => a.date < b.date ? -1 : 1);
  h += `<section class="card"><div class="card-h"><h2>Weekly check-in</h2><span class="hint">Same time, same light</span></div>
  <div class="form"><label>Date<input class="in" id="ck-date" type="date" value="${t}" max="${t}"></label><label>Weight (kg)<input class="in" id="ck-weight" type="number" inputmode="decimal" step="0.1"></label>
  <label>Waist (cm)<input class="in" id="ck-waist" type="number" inputmode="decimal" step="0.5"></label><label>Chest (cm)<input class="in" id="ck-chest" type="number" inputmode="decimal" step="0.5"></label>
  <label>Arm (cm)<input class="in" id="ck-arm" type="number" inputmode="decimal" step="0.5"></label><label>Hips (cm)<input class="in" id="ck-hips" type="number" inputmode="decimal" step="0.5"></label><label>Neck (cm)<input class="in" id="ck-neck" type="number" inputmode="decimal" step="0.5"></label>
  <div class="full"><span class="flabel">Progress photo</span><label class="btn photo-btn" for="ck-photo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg><span id="ck-photo-name">${S.pendingPhoto ? 'Photo ready (camera). Tap Save check-in.' : 'Choose a photo'}</span></label><input id="ck-photo" class="vh" type="file" accept="image/*"><button class="btn photo-btn guide" data-act="camguide">📷 Take with photo guide</button></div>
  <button class="btn primary full" data-act="checkin">Save check-in</button></div>`;
  const ph = Object.values(S.photos).sort((a, b) => a.date < b.date ? -1 : 1);
  if (ph.length >= 2) {
    const a = ph[0], b = ph[ph.length - 1];
    h += `<div class="compare" style="--cut:${S.cut}%"><img src="${b.data}" alt="Latest photo ${fmt(b.date)}"><img class="top-img" src="${a.data}" alt="First photo ${fmt(a.date)}"><span class="bar-line"></span><span class="lbl" style="left:8px">${fmt(a.date)}</span><span class="lbl" style="right:8px">${fmt(b.date)}</span></div>
    <input class="range" type="range" min="0" max="100" value="${S.cut}" id="cut" aria-label="Compare photos">`;
  } else if (ph.length === 1) h += `<img src="${ph[0].data}" alt="First photo" style="border-radius:12px"><p class="hint">Add next week’s photo to unlock the before/after slider.</p>`;
  h += bodyNumbersHTML(cks) + measuresHTML(cks);
  const ckDates = [...new Set([...cks.map(c => c.date), ...Object.keys(S.photos)])].sort().reverse();
  if (ckDates.length) h += `<ul class="list ckl">${ckDates.map(dt => { const c = S.checkins[dt] || {}; return `<li><span>${fmt(dt)}</span><span class="num">${[c.weight && c.weight + ' kg', c.waist && 'waist ' + c.waist, c.chest && 'chest ' + c.chest, c.arm && 'arm ' + c.arm, c.hips && 'hips ' + c.hips, c.neck && 'neck ' + c.neck, S.photos[dt] && 'photo'].filter(Boolean).join(' · ') || 'photo'}</span><button class="link danger" data-act="ckdel" data-v="${dt}">${S.confirm === 'ck:' + dt ? 'Tap again to delete' : 'Delete'}</button></li>`; }).join('')}</ul>`;
  G.body = h + `</section>`;
  return progressShell(G);
}
/* real maintenance: average intake minus the energy in your weight change (≈7,700 kcal per kg), over the last 4 weeks */
function burnHTML(arr, st) {
  const t = today(), from = C.addDays(t, -28) > st.startDate ? C.addDays(t, -28) : st.startDate;
  const intake = [];
  for (let dt = from; dt < t; dt = C.addDays(dt, 1)) {
    const d = S.days[dt]; if (!d) continue;
    const pm = C.plannedMeals(st, d, dt); if (!pm.length || !pm.every(m => d.meals && d.meals[m.id] && d.meals[m.id].status)) continue;
    intake.push(C.dayTotals(st, d).k);
  }
  const w = arr.filter(p => p.date >= from && p.date <= t), span = w.length ? C.diffDays(w[0].date, w[w.length - 1].date) : 0;
  const head = `<section class="card"><div class="card-h"><h2>Real burn</h2>${pill('opt', 'Estimate')}</div>`;
  if (intake.length < 10 || w.length < 5 || span < 14) return head + `<p class="hint">Works out how many calories you actually burn a day from your food logs and weight trend. Unlocks after about 2 weeks: ${Math.min(intake.length, 10)}/10 fully logged days · ${Math.min(w.length, 5)}/5 weigh-ins over ${Math.min(span, 14)}/14 days.</p></section>`;
  const xs = w.map(p => C.diffDays(w[0].date, p.date)), ys = w.map(p => p.weight), n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
  const avgIn = intake.reduce((a, b) => a + b, 0) / intake.length, burn = avgIn - slope * 7700, gap = burn - avgIn;
  const early = C.diffDays(st.startDate, t) < 28;
  const K = v => (Math.round(v / 10) * 10).toLocaleString('en-US');
  return head + `<div class="burn"><b class="num">≈ ${K(burn)}</b><span>kcal a day</span></div>
  <p class="hint">You’re eating about ${K(avgIn)} kcal a day (${intake.length} fully logged days) and your weight trend is ${slope < 0 ? 'down' : 'up'} ${C.round(Math.abs(slope * 7), 2)} kg a week, so your body burns roughly ${K(burn)} kcal a day: a ${gap > 0 ? 'deficit' : 'surplus'} of about ${K(Math.abs(gap))} kcal a day.</p>
  ${early ? '<p class="hint">The first weeks include water weight, so this reads high at first and settles after week 4.</p>' : ''}</section>`;
}
function recapData(R, cp) {
  const st = S.settings, a = R.attemptStart, end = C.addDays(a, cp - 1), t = today();
  let locked = 0, kS = 0, pS = 0, nN = 0, water = 0, trained = 0;
  for (let i = 0; i < cp; i++) {
    const dt = C.addDays(a, i); if (dt > t) break; const d = S.days[dt] || {}, ev = C.evalDay(st, d, dt);
    if (ev.complete) locked++; water += C.waterTotal(d); if (d.trainingDone) trained++;
    const tot = C.dayTotals(st, d); if (tot.k > 0) { kS += tot.k; pS += tot.p; nN++; }
  }
  const ws = []; Object.keys(S.days).forEach(k => { if (k >= a && k <= end && S.days[k].weight) ws.push([k, S.days[k].weight]); }); Object.values(S.checkins).forEach(c => { if (c.date >= a && c.date <= end && c.weight) ws.push([c.date, c.weight]); });
  ws.sort((x, y) => x[0] < y[0] ? -1 : 1);
  const first = st.startWeight && a === st.startDate ? st.startWeight : ws.length ? ws[0][1] : null, last = ws.length ? ws[ws.length - 1][1] : null;
  const cardio = stamSessions(a, end).reduce((s, x) => s + (x.min || 0), 0);
  return { cp, locked, kcal: nN ? kS / nN : null, prot: nN ? pS / nN : null, water, trained, cardio, wChange: first && last ? last - first : null, end };
}
function recapHTML(R) {
  const dn = R.dayNum, cp = [90, 60, 30].find(c => dn > c || (dn === c && R.todayEval.complete));
  if (!cp) return '';
  const r = recapData(R, cp), sg = v => (v > 0 ? '+' : v < 0 ? '−' : '') + C.round(Math.abs(v), 1);
  return `<section class="card recap"><div class="card-h"><h2>Day ${cp} recap</h2><span class="hint">${fmt(R.attemptStart)} – ${fmt(r.end)}</span></div>
  <div class="review"><div><b class="num">${r.locked}/${cp}</b><span>Days locked in</span></div><div><b class="num">${r.wChange == null ? '—' : sg(r.wChange) + ' kg'}</b><span>Weight</span></div>
  <div><b class="num">${r.prot ? kc(r.prot) + ' g' : '—'}</b><span>Avg protein</span></div><div><b class="num">${r.kcal ? kc(r.kcal) : '—'}</b><span>Avg calories</span></div>
  <div><b class="num">${C.round(r.water / 1000)} L</b><span>Water drunk</span></div><div><b class="num">${r.trained}</b><span>Training days · ${r.cardio} min cardio</span></div></div>
  <button class="btn" data-act="sharerecap" data-v="${cp}">Share recap</button></section>`;
}
function winsHTML(arr, st, rv) {
  const low = arr.reduce((a, p) => p.weight < a.weight ? p : a, arr[0]);
  const last7 = arr.filter(p => C.diffDays(p.date, today()) < 7), cur = last7.length ? last7.reduce((s, p) => s + p.weight, 0) / last7.length : arr[arr.length - 1].weight;
  const start = st.startWeight || arr[0].weight, lost = cur - start, toGo = st.goalWeight ? cur - st.goalWeight : null;
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '') + C.round(Math.abs(v), 1);
  return `<div class="wins"><div><b class="num">${sg(lost)} kg</b><span>Since start</span></div><div><b class="num">${low.weight} kg</b><span>Lowest · ${fmt(low.date)}</span></div><div><b class="num">${rv.wDelta == null ? '—' : sg(rv.wDelta) + ' kg'}</b><span>This week</span></div>${toGo != null && toGo > 0 ? `<div><b class="num">${C.round(toGo, 1)} kg</b><span>To goal</span></div>` : ''}</div>`;
}
function projHTML(arr, st, attemptStart) {
  const t = today(), recent = arr.filter(p => C.diffDays(p.date, t) <= 28);
  if (recent.length < 4 || C.diffDays(recent[0].date, recent[recent.length - 1].date) < 10) return '<p class="hint">A pace projection appears after about two weeks of weigh-ins.</p>';
  const xs = recent.map(p => C.diffDays(recent[0].date, p.date)), ys = recent.map(p => p.weight), n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
  const last = recent[n - 1].date, cur = my + slope * (xs[n - 1] - mx), perWeek = slope * 7, day90 = C.addDays(attemptStart, 89);
  let txt = `Pace: ${perWeek > 0 ? '+' : ''}${C.round(perWeek, 1)} kg per week.`;
  if (st.goalWeight && slope < 0 && cur > st.goalWeight) txt += ` At this pace you reach ${st.goalWeight} kg around ${fmt(C.addDays(last, Math.round((st.goalWeight - cur) / slope)))}.`;
  if (C.diffDays(t, day90) > 0) txt += ` Projected weight on Day 90: about ${C.round(cur + slope * C.diffDays(last, day90), 1)} kg.`;
  const fast = perWeek < -(cur * 0.01) && C.diffDays(st.startDate, t) > 21;
  return `<p class="hint">${txt}</p>${fast ? '<p class="safety">That’s faster than about 1% of your body weight per week, which usually costs muscle. Worth raising with your coach.</p>' : ''}`;
}
function weightChart(pts, goal) {
  const W = 320, H = 160, pl = 34, pr = 12, pt = 12, pb = 24;
  const avg = pts.map((p, i) => { const win = pts.filter(q => C.diffDays(q.date, p.date) >= 0 && C.diffDays(q.date, p.date) < 7); return { date: p.date, weight: win.reduce((s, q) => s + q.weight, 0) / win.length }; });
  const near = goal > 0 && Math.min(...pts.map(p => p.weight)) - goal <= 6, ws = pts.map(p => p.weight).concat(near ? [goal] : []);
  const lo = Math.floor(Math.min(...ws) - 1), hi = Math.ceil(Math.max(...ws) + 1);
  const t0 = C.parse(pts[0].date).getTime(), t1 = Math.max(t0 + 864e5, C.parse(pts[pts.length - 1].date).getTime());
  const x = d => pl + (C.parse(d).getTime() - t0) / (t1 - t0) * (W - pl - pr), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const path = a => a.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');
  const last = avg[avg.length - 1], T = v => Math.round(v * 10) / 10, mono = 'font-family="Alexandria,sans-serif"';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
  ${[hi, (hi + lo) / 2, lo].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 3.5}" text-anchor="end" font-size="10" fill="var(--muted)" ${mono}>${T(v)}</text>`).join('')}
  ${near ? `<line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--good)" stroke-dasharray="4 4"/><text x="${W - pr}" y="${y(goal) - 4}" text-anchor="end" font-size="10" fill="var(--good)" ${mono}>goal ${goal}</text>` : ''}
  ${(() => { let lo = Infinity; return pts.map((p, i) => { const win = i > 0 && p.weight < lo; lo = Math.min(lo, p.weight); return `<circle cx="${x(p.date)}" cy="${y(p.weight)}" r="${win ? 3.4 : 2.2}" fill="${win ? 'var(--good)' : 'var(--muted)'}"/>`; }).join(''); })()}
  <path d="${path(avg)}" fill="none" stroke="var(--accent-strong)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${x(last.date)}" cy="${y(last.weight)}" r="4" fill="var(--spark)"/>
  <text x="${pl}" y="${H - 6}" font-size="10" fill="var(--muted)" ${mono}>${fmt(pts[0].date)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--muted)" ${mono}>7-day avg ${T(last.weight)} kg</text></svg>
  <p class="hint">${goal > 0 && !near ? `Goal ${goal} kg is below this chart; it appears once you’re within 6 kg. ` : ''}Dots are single weigh-ins (green = a new lowest). The line is the 7-day average, which is the number to trust.</p></div>`;
}

async function shareWeek() {
  const rv = weekReview(), t = today(), hit = k => rv.past - rv.miss[k];
  const lines = [`Lock In 90 · week ending ${fmt(t)}`, `Days fully on plan: ${rv.locked}/${rv.n}`];
  if (rv.wNow) lines.push(`Weight (7-day avg): ${C.round(rv.wNow, 1)} kg${rv.wDelta != null ? ` (${rv.wDelta > 0 ? '+' : ''}${C.round(rv.wDelta, 1)} vs last week)` : ''}`);
  if (rv.kcal) lines.push(`Avg calories: ${kc(rv.kcal)}${rv.tk ? ` (plan ${kc(rv.tk)})` : ''} · protein ${kc(rv.prot)} g${rv.tp ? ` (plan ${kc(rv.tp)} g)` : ''}`);
  if (rv.past) lines.push(`Meals on plan ${hit('Meals')}/${rv.past} · water ${hit('Water')}/${rv.past} · training ${hit('Training')}/${rv.past} · supplements ${hit('Supplements')}/${rv.past}`);
  lines.push(`Cardio: ${rv.cardio} min${rv.sleep ? ` · avg sleep ${C.round(rv.sleep, 1)} h` : ''}`);
  { const aw = activityWeek(); if (aw.n) lines.push(`Sports: ${aw.n} session${aw.n === 1 ? '' : 's'} · ≈ ${kc(aw.kcal)} kcal`); }
  const text = lines.join('\n');
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Summary copied. Paste it into your chat with your coach.'); } catch (e) { toast('Couldn’t share from here.'); }
}

/* ---------- SETUP ---------- */
/* weekly calorie budget */
const budgetOn = () => !!(S.settings && S.settings.budget && S.settings.budget.on);
const budgetAt = date => budgetOn() ? C.budgetDay(S.settings, S.days, date) : null;
function dayTarget(date, d) { const t = C.planTargets(S.settings, d, date), b = budgetAt(date); return b && b.cut ? { ...t, k: b.target, base: t.k, cut: b.cut } : t; }
// today's planned meals with smaller carb and fat portions (only when the budget is paying back)
function trimsFor(date) { const b = budgetAt(date); if (!b || !b.cut || !C.budgetOf(S.settings).trim) return {}; const d = S.days[date] || {}; return C.trimPlan(C.plannedMeals(S.settings, d, date), b.cut); }
function trimmedItems(m, trims) { const tr = trims[m.id]; if (!tr) return clone(m.items); return clone(m.items).map((it, i) => { const x = tr.find(z => z.i === i); return x ? { ...it, g: x.to, trimmed: x.from } : it; }); }
function trimCardHTML(date) {
  const b = budgetAt(date); if (!b || !b.cut) return '';
  const tr = trimsFor(date), meals = C.plannedMeals(S.settings, S.days[date] || {}, date), rows = meals.filter(m => tr[m.id]).map(m => `<div class="trim"><b>${esc(m.name)}${m.time ? ' · ' + esc(m.time) : ''}</b>${tr[m.id].map(x => `<div class="spread"><span>${esc(x.name.split(',')[0])} <span class="num">${C.round(x.from, 1)} g → ${C.round(x.to, 1)} g</span></span><em class="num">−${x.kcal}</em></div>`).join('')}</div>`).join('');
  return `<div class="trimcard"><div class="spread"><b>Calories today: <span class="num">${kc(b.target)}</span></b><s class="num">${kc(b.base)}</s></div><p class="hint">−${b.cut} kcal, paying back ${b.debtIn} kcal over plan this week (${C.diffDays(date, b.to) + 1} days left).</p>
  ${C.budgetOf(S.settings).trim ? (rows ? `<span class="sub">Today’s plan, trimmed. Only carbs and fats get smaller; protein stays the same.</span>${rows}` : '') : ''}
  <label class="chk"><input type="checkbox" id="bud-trim" ${C.budgetOf(S.settings).trim ? 'checked' : ''}> Use the trimmed portions for “As planned”</label></div>`;
}
function weeklyCalHTML() {
  if (!budgetOn()) return '';
  const t = today(), b = C.budgetDay(S.settings, S.days, t), rows = [];
  for (let i = 0; i < 7; i++) { const dt = C.addDays(b.from, i), past = dt < t, r = b.log.find(x => x.d === dt), d = S.days[dt] || {}, base = r ? r.base : Math.round(C.planTargets(S.settings, d, dt).k || 0), eaten = dt <= t ? Math.round(C.dayTotals(S.settings, d).k || 0) : null; rows.push({ dt, past, base, target: r ? r.target : base, eaten }); }
  const mx = Math.max(1, ...rows.map(r => Math.max(r.base, r.eaten || 0))) * 1.08, H = 110, y = v => Math.round(v / mx * H);
  const eatenSum = rows.reduce((a, r) => a + (r.eaten || 0), 0), over = b.log.reduce((a, r) => a + (r.over || 0), 0);
  return `<section class="card" id="sec-budget"><div class="card-h"><h2>Weekly calories</h2>${pill(b.debt >= 50 ? 'todo' : 'done', b.debt >= 50 ? `${b.debt} kcal to pay back` : 'On budget')}</div>
  <span class="sub">${fmt(b.from)} – ${fmt(b.to)} · budget <b class="num">${b.budget.toLocaleString('en-US')}</b> kcal</span>
  <div class="wbars" style="height:${H + 22}px">${rows.map(r => `<div title="${fmt(r.dt)}: ${r.eaten != null ? kc(r.eaten) + ' / ' : ''}${kc(r.target)} kcal"><i class="tgt" style="bottom:${y(r.target) + 18}px"></i><em class="${r.eaten == null ? 'fut' : r.eaten > r.target + 50 ? 'over' : ''}" style="height:${Math.max(4, y(r.eaten != null ? r.eaten : r.target))}px"></em><span>${esc(C.DAYNAMES[C.weekday(r.dt)].slice(0, 2))}</span></div>`).join('')}</div>
  <div class="setup-r"><span>Eaten so far</span><b class="num">${eatenSum.toLocaleString('en-US')}</b></div>${over ? `<div class="setup-r"><span>Over plan this week</span><b class="num" style="color:var(--bad)">+${over}</b></div>` : ''}
  ${b.cut ? `<div class="setup-r"><span>Today’s target</span><b class="num">${kc(b.target)} <small class="sub">(−${b.cut})</small></b></div>` : ''}</section>`;
}
function budgetHTML(st) {
  const b = C.budgetOf(st), base = C.planTargets(st, S.days[today()] || {}, today()).k || 0, room = Math.max(0, Math.min(base * b.maxPct / 100, base - b.floor));
  return `<div class="cheatset"><div class="spread"><span><b>Weekly calorie budget</b><small class="sub" style="display:block">Pay back days you go over</small></span><button class="switch" role="switch" data-act="budon" aria-checked="${b.on}" aria-label="Weekly calorie budget"><i></i></button></div>
  ${b.on ? `<div class="seg wide" role="group" aria-label="How to pay back"><button data-act="budmode" data-v="spread" aria-pressed="${b.mode !== 'asap'}">Spread over the week</button><button data-act="budmode" data-v="asap" aria-pressed="${b.mode === 'asap'}">As soon as possible</button></div>
  <div class="setup-r"><label for="bud-pct">Most off one day</label><select class="in" id="bud-pct">${[10, 15, 20, 25].map(v => `<option value="${v}" ${b.maxPct === v ? 'selected' : ''}>${v}%${base ? ` (${Math.round(base * v / 100)} kcal)` : ''}</option>`).join('')}</select></div>
  <div class="setup-r"><label for="bud-floor">Never below</label><select class="in" id="bud-floor">${[1200, 1300, 1400, 1500, 1600, 1800].map(v => `<option value="${v}" ${b.floor === v ? 'selected' : ''}>${v.toLocaleString('en-US')} kcal</option>`).join('')}</select></div>
  ${st.cheat && st.cheat.on ? `<label class="chk"><input type="checkbox" id="bud-cheat" ${b.cheat ? 'checked' : ''}> Count free cheat meals</label>` : ''}
  <p class="hint">${base && room < 50 ? `Your plan (${kc(base)} kcal) is close to the ${b.floor.toLocaleString('en-US')} floor, so little can come off one day. ` : ''}Eating less than plan isn’t saved up for later, so there’s no reason to skip meals now and binge later. A new week starts fresh.</p>` : ''}</div>`;
}
function weekStartHTML(st) {
  const w = st.weekStart || {}, mode = w.mode === 'sat' || w.mode === 'day' ? w.mode : 'start', wd = C.weekStartDay(st), ws = C.myWeekStart(st, today()), sd = C.weekday(st.startDate);
  const DS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], order = [6, 0, 1, 2, 3, 4, 5];
  return `<div class="dstart" id="sec-weekstart"><h3 class="grp">Your week starts on</h3>
  <p class="hint">Used for your weekly review, weekly focus, muscle sets, free cheat meal and the coach page.</p>
  <div class="seg wide" role="group" aria-label="Week starts on"><button data-act="wkmode" data-v="sat" aria-pressed="${mode === 'sat'}">Saturday</button><button data-act="wkmode" data-v="start" aria-pressed="${mode === 'start'}">The day I started (${esc(C.DAYNAMES[sd].slice(0, 3))})</button><button data-act="wkmode" data-v="day" aria-pressed="${mode === 'day'}">Pick a day</button></div>
  ${mode === 'day' ? `<div class="wdays" role="group" aria-label="First day of the week">${order.map(i => `<button data-act="wkday" data-v="${i}" aria-pressed="${wd === i}">${DS[i]}</button>`).join('')}</div>` : ''}
  <div class="wkrow" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => C.addDays(ws, i)).map(d => `<span class="${d === today() ? 'on' : ''}"><em>${DS[C.weekday(d)]}</em><b class="num">${C.parse(d).getDate()}</b></span>`).join('')}</div>
  <p class="hint"><b>Week ${myWeekNo(today())}: ${fmt(ws)} – ${fmt(C.addDays(ws, 6))}.</b> The next week starts ${esc(C.DAYNAMES[wd])} ${fmt(C.addDays(ws, 7))}.</p>
  <p class="hint">The friends league stays Saturday to Friday, so everyone in the group competes on the same week.</p></div>`;
}
function cheatHTML(st) {
  const c = st.cheat || {}, info = c.on ? C.cheatsUsed(st, S.days, today()) : null;
  return `<div class="cheatset"><div class="spread"><span><b>Free cheat meal</b><small class="sub" style="display:block">If your coach allows one</small></span><button class="switch" role="switch" data-act="cheaton" aria-checked="${!!c.on}" aria-label="Free cheat meal"><i></i></button></div>
  ${c.on ? `<div class="seg wide" role="group" aria-label="How often"><button data-act="cheatper" data-v="1w" aria-pressed="${(c.per || '1w') === '1w'}">1 per week</button><button data-act="cheatper" data-v="2w" aria-pressed="${c.per === '2w'}">2 per week</button><button data-act="cheatper" data-v="1of2w" aria-pressed="${c.per === '1of2w'}">1 every 2 weeks</button></div>
  <div class="seg wide" role="group" aria-label="Cheat meal or day"><button data-act="cheatkind" data-v="meal" aria-pressed="${(c.kind || 'meal') === 'meal'}">One meal</button><button data-act="cheatkind" data-v="day" aria-pressed="${c.kind === 'day'}">A whole day</button></div>
  <p class="hint">${c.kind === 'day' ? 'Your free cheat day: every meal and extra that day counts as on plan.' : 'One meal of your choice replaces a planned meal and the day still counts.'} Going over your calories that day is fine. Another one past the limit is off-plan as usual.</p>
  <div class="cheatst ${info.left ? '' : 'used'}">🍕 <span><b>${info.left ? (info.max > 1 && info.used ? `${info.left} of ${info.max} left` : 'Available') : 'Used'}</b> <small>${fmt(info.from)} – ${fmt(info.to)}${info.on.length ? ` · used ${info.on.map(d => esc(C.DAYNAMES[C.weekday(d)].slice(0, 3)) + ' ' + C.parse(d).getDate()).join(', ')}` : ''}</small></span></div>` : ''}</div>`;
}
function dayStartHTML(st) {
  const ds = st.dayStart || {}, mode = C.dayStartMode(ds), t = today(), city = ds.city || 'cairo', fm = C.fajrMin(t, city);
  const pos = m => (Math.max(0, Math.min(840, m + 360)) / 840 * 100).toFixed(1); // timeline 6 pm .. 8 am
  const startM = mode === 'midnight' ? 0 : mode === 'fajr' ? fm : C.dayStartMin(ds, t);
  return `<div class="dstart" id="sec-daystart"><h3 class="grp">Your day starts at</h3>
  <p class="hint">When the next day begins in the app. Anything you log before then counts for the day you’re still in.</p>
  <div class="seg wide" role="group" aria-label="Day starts at"><button data-act="daystart" data-v="midnight" aria-pressed="${mode === 'midnight'}">Midnight</button><button data-act="daystart" data-v="fajr" aria-pressed="${mode === 'fajr'}">Fajr</button><button data-act="daystart" data-v="time" aria-pressed="${mode === 'time'}">Set a time</button></div>
  ${mode === 'fajr' ? `<div class="setup-r"><label for="ds-city">City for Fajr</label><select class="in" id="ds-city">${Object.entries(C.CITIES).map(([k, c]) => `<option value="${k}" ${k === city ? 'selected' : ''}>${c[0]}</option>`).join('')}</select></div>
  <div class="ds-today"><span class="sub">Today in ${esc(C.CITIES[city][0])}</span><b class="num">Fajr ${C.minTxt(fm)}</b><p class="hint">Changes a minute or two each day with the season (about 4 am in April to 5:20 am in January in Cairo, summer time included). Egyptian General Authority of Survey method.</p></div>` : ''}
  ${mode === 'time' ? `<div class="setup-r"><label for="ds-time">New day at<small class="sub" style="display:block">Between midnight and 6 am</small></label><input class="in" id="ds-time" type="time" min="00:00" max="06:00" value="${esc(ds.t || '04:00')}" style="width:120px"></div>` : ''}
  <div class="ds-line" aria-hidden="true"><i style="width:${pos(startM)}%"></i><em style="left:${pos(startM)}%"></em></div>
  <div class="ds-ticks" aria-hidden="true"><span style="left:0">6 pm</span><span class="c" style="left:42.9%">midnight</span><span class="c" style="left:71.4%">4 am</span><span style="right:0">8 am</span></div>
  <p class="hint">${mode === 'midnight' ? 'Grey: the day you’re in. Green: the next day. Until 3 am you can still switch to “Yesterday” on Today.' : `Grey: still the day you’re in. Green: the next day starts at ${C.minTxt(startM)}. Reminders and the friends board follow this.`}</p></div>`;
}
function setupHTML(R) {
  const st = S.settings, plan = st.plan || C.DEFAULT_PLAN, wg = st.waterGoal || 3500, sta = st.stamina || { on: true, days: [] };
  let h = `<section class="card"><div class="card-h"><h2>Challenge</h2></div>
  <div class="setup-r"><span>Started</span><span class="num">${fmt(st.startDate)} · attempt ${R.attemptNo}</span></div>
  <div class="setup-r"><label for="fb-name">Your name<small class="sub" style="display:block">Shown to friends and your coach</small></label><input class="in" id="fb-name" maxlength="24" value="${esc(st.boardName || '')}" placeholder="${esc(boardName())}" style="max-width:160px"></div>
  <div class="setup-r"><label for="s-water">Water goal</label>${waterSelect('s-water', 'data-setting="waterGoal"', wg)}</div>
  ${wg > 5000 ? '<p class="safety">Above 5 L, spread it out: no more than about 1 L per hour, and add salt or electrolytes on heavy-sweat days.</p>' : ''}
  <div class="setup-r"><label for="s-sw">Start weight (kg)</label><input class="in" id="s-sw" type="number" inputmode="decimal" step="0.1" data-setting="startWeight" value="${st.startWeight || ''}"></div>
  <div class="setup-r"><label for="s-gw">Goal weight (kg)</label><input class="in" id="s-gw" type="number" inputmode="decimal" step="0.1" data-setting="goalWeight" value="${st.goalWeight || ''}"></div>
  <div class="setup-r"><label for="s-height">Height (cm)</label><input class="in" id="s-height" type="number" inputmode="numeric" min="120" max="230" data-setting="height" placeholder="for body numbers" value="${st.height || ''}"></div>
  <div class="setup-r"><label for="s-sg">Sleep goal</label><select class="in" id="s-sg" data-setting="sleepGoal">${[6.5, 7, 7.5, 8, 8.5, 9].map(v => `<option value="${v}" ${(st.sleepGoal || 7.5) === v ? 'selected' : ''}>${v} h</option>`).join('')}</select></div>
  <div class="setup-r"><label for="s-bed">Bedtime</label><input class="in" id="s-bed" type="time" data-bedtime="1" value="${esc(st.bedtime || '23:30')}" style="width:120px"></div>
  <div class="setup-r"><label for="s-age">Age (optional)</label><input class="in" id="s-age" type="number" inputmode="numeric" min="16" max="90" data-setting="age" placeholder="for heart-rate calories" value="${st.age || ''}"></div>
  <div class="setup-r"><span>Calorie formula</span><div class="seg" role="group" aria-label="Sex for calorie formula"><button data-act="sex" data-v="m" aria-pressed="${st.sex !== 'f'}">Male</button><button data-act="sex" data-v="f" aria-pressed="${st.sex === 'f'}">Female</button></div></div>
  <div class="setup-r"><span>Usual gym time</span><div class="seg"><button data-act="defgym" data-v="am" aria-pressed="${(st.gymTime || 'am') === 'am'}">Morning</button><button data-act="defgym" data-v="pm" aria-pressed="${st.gymTime === 'pm'}">Night</button></div></div></section>`;
  h += `<section class="card" id="sec-dayweek"><div class="card-h"><h2>Day and week</h2></div><p class="hint">When your day ends and when your week starts.</p>${dayStartHTML(st)}${weekStartHTML(st)}</section>`;
  // meal plan
  const PM = planMeals(), planTot = C.sumItems(PM.flatMap(m => m.items || []));
  h += `<section class="card" id="sec-plan"><div class="card-h"><h2>Meal plan</h2>${pill('todo', `${kc(planTot.k)} kcal · ${kc(planTot.p)} g protein`)}</div>
  ${(st.ramadan && st.ramadan.on) || editingRamadan() ? `<div class="seg wide" role="group" aria-label="Which plan"><button data-act="planedit" data-v="normal" aria-pressed="${!editingRamadan()}">Normal days</button><button data-act="planedit" data-v="ramadan" aria-pressed="${editingRamadan()}">Ramadan</button></div>` : ''}<p class="hint">${isOwner() ? 'Your coach’s plan' : 'Your meal plan (from your coach, or your own)'}, in cooked weights. Add the foods and grams for each meal; the totals become your daily calorie and protein targets. When your coach changes it, edit it here: the change applies from today, and earlier days keep the plan they had.</p>${planHistoryHTML(st)}`;
  h += restorePlanCard(st);
  h += cheatHTML(st) + budgetHTML(st);
  PM.forEach((m, i) => {
    const s = C.sumItems(m.items);
    h += `<div class="planmeal"><div class="row"><input class="in grow" id="pm-n-${m.id}" data-mealname="${m.id}" value="${esc(m.name)}" aria-label="Meal name"><input class="in sm" id="pm-t-${m.id}" type="time" data-mealtime="${m.id}" value="${esc(m.time || '')}" aria-label="Time" style="width:110px"></div>
    <span class="hint num">${kc(s.k)} kcal · ${C.round(s.p, 1)} g protein · ${C.round(s.c, 1)} g carbs · ${C.round(s.f, 1)} g fat</span>
    ${itemsEditor(m.items || [], 'plan:' + m.id)}
    <button class="btn small block" data-act="plancopy" data-v="${m.id}">↺ Use a meal you ate before</button>
    <div class="row"><button class="btn small" data-act="mealup" data-v="${m.id}" ${i === 0 ? 'disabled' : ''}>Move up</button><button class="btn small" data-act="mealdown" data-v="${m.id}" ${i === PM.length - 1 ? 'disabled' : ''}>Move down</button><button class="btn small danger" data-act="mealdel" data-v="${m.id}">Delete meal</button></div></div>`;
  });
  h += `<button class="btn" data-act="mealadd">+ Add a meal</button>${shoppingHTML({ meals: PM })}</section>`;
  h += ramadanSetupHTML(st);
  h += ifThenSetupHTML(st);
  h += coachSetupHTML(st);
  // weekly plan
  h += `<section class="card"><div class="card-h"><h2>Weekly training</h2></div><p class="hint">What counts as training each day. Gym and home days use the workouts in Train. Finishing one ticks the day.</p>
  ${[6, 0, 1, 2, 3, 4, 5].map(i => `<div class="setup-r"><label for="p-${i}">${C.DAYNAMES[i]}</label><select class="in" id="p-${i}" data-plan="${i}">${Object.keys(C.TT).map(k => `<option value="${k}" ${plan[i] === k ? 'selected' : ''}>${C.TT[k].label}</option>`).join('')}</select></div>`).join('')}</section>`;
  // stamina
  h += `<section class="card"><div class="card-h"><h2>Stamina track</h2>${pill('opt', 'Bonus')}</div>
  <div class="setup-r"><span>Show stamina reminders</span><div class="seg"><button data-act="stamon" data-v="1" aria-pressed="${sta.on !== false}">On</button><button data-act="stamon" data-v="0" aria-pressed="${sta.on === false}">Off</button></div></div>
  <span class="hint">Cardio days (after lifting)</span><div class="daychecks">${[6, 0, 1, 2, 3, 4, 5].map(i => `<button data-act="stamday" data-v="${i}" aria-pressed="${(sta.days || []).includes(i)}">${C.DAYNAMES[i].slice(0, 3)}</button>`).join('')}</div></section>`;
  // supplements
  h += `<section class="card"><div class="card-h"><h2>Supplements</h2></div><p class="hint">Core ones are required for the day to count. Timing changes with your gym time.</p>
  ${(st.supps || []).map(s => `<div class="sup-r"><div class="spread"><b>${esc(s.name)}</b><div class="row"><button class="btn small" data-act="sreq" data-id="${esc(s.id)}">${s.req ? 'Core' : 'Optional'}</button><button class="btn small danger" data-act="sdel" data-id="${esc(s.id)}">Remove</button></div></div>
  <div class="form"><label>Morning gym day<select class="in" data-stime="${esc(s.id)}:am">${SLOTS.map(o => `<option ${s.am === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label><label>Night gym day<select class="in" data-stime="${esc(s.id)}:pm">${SLOTS.map(o => `<option ${s.pm === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div></div>`).join('')}
  <div class="row"><input class="in grow" id="s-new" placeholder="Add a supplement"><button class="btn small" data-act="sadd">Add</button></div>
  ${(() => { const have = new Set((st.supps || []).map(s => s.name)), left = STARTER_SUPPS.filter(n => !have.has(n)); return left.length ? `<span class="sub">Quick add</span><div class="supps">${left.map(n => `<button class="supp" data-act="sstarter" data-v="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>` : ''; })()}</section>`;
  // reminders + strava
  const rm = st.reminders || {}, sv = S.meta.strava;
  const pushOn = pushState() === 'on';
  h += `<section class="card"><div class="card-h"><h2>Reminders</h2>${pushOn ? pill('done', 'On this phone') : ''}</div><p class="hint">Each reminder checks your day first and stays quiet if there’s nothing to do. Times can run 5 to 15 minutes late.</p>
  ${pushOn ? `<div class="row"><button class="btn small" data-act="pushtest">Send a test</button><button class="btn small ghost" data-act="pushoff">Turn off on this phone</button></div>` : pushState() === 'blocked' ? `<p class="safety">Notifications are blocked for this app. Allow them in your phone’s settings for Lock In 90, then come back.</p>` : pushState() === 'install' ? `<p class="hint"><b>iPhone:</b> add the app to your Home Screen first (Share → Add to Home Screen), open it from there, then turn notifications on.</p>` : pushState() === 'none' ? `<p class="hint">This browser can’t show app notifications. Use the ntfy app below instead.</p>` : `<button class="btn primary block" data-act="pushon">Turn on notifications</button>`}
  <details${st.ntfyTopic && !pushOn ? ' open' : ''}><summary class="hint">Use the ntfy app instead</summary><p class="hint">Only used when app notifications are off on all your phones.</p>
  <div class="sup-r"><span class="sub">Your ntfy topic</span><div class="row"><input class="in grow" id="s-topic" data-topic="1" value="${esc(st.ntfyTopic || '')}" placeholder="e.g. lockin90-a1b2c3d4e5f6" autocomplete="off" spellcheck="false"><button class="btn small" data-act="gentopic">New</button></div><p class="hint">Subscribe to this exact name in the ntfy app. Treat it like a password. Leave it empty and no reminders are sent.</p></div></details>
  ${REMINDERS.map(([k, label]) => { const on = k === 'meals' ? rm[k] === true : rm[k] !== false; return `<div class="setup-r"><span>${esc(label)}</span><div class="seg"><button data-act="remind" data-v="${k}:1" aria-pressed="${on}">On</button><button data-act="remind" data-v="${k}:0" aria-pressed="${!on}">Off</button></div></div>`; }).join('')}</section>`;
  if (sv) h += `<section class="card"><div class="card-h"><h2>Strava</h2>${sv && sv.ok ? pill('done', 'Connected') : pill('todo', 'Not connected')}</div>
  <p class="hint">${sv && sv.lastSync ? `Last sync ${new Date(sv.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. ${sv.count ? sv.count + ' activities synced.' : ''}` : 'Connects once the Strava step in the setup guide is done. Checks every 30 minutes.'}</p></section>`;
  // account and data
  h += `<section class="card"><div class="card-h"><h2>Data</h2></div>
  <div class="row"><button class="btn" data-act="export">Export backup</button><label class="btn" for="imp-file2">Import backup</label><input id="imp-file2" type="file" accept="application/json,.json" hidden></div>
  <div class="setup-r"><span>Language</span><div class="seg" role="group" aria-label="Language"><button data-act="lang" data-v="en" aria-pressed="${LANG() !== 'ar'}">English</button><button data-act="lang" data-v="ar" aria-pressed="${LANG() === 'ar'}">العربية</button></div></div>
  <div class="setup-r"><span>Vibration on taps</span><div class="seg" role="group" aria-label="Vibration"><button data-act="haptics" data-v="1" aria-pressed="${st.haptics !== false}">On</button><button data-act="haptics" data-v="0" aria-pressed="${st.haptics === false}">Off</button></div></div>
  </section>`;
  h += `<section class="card"><div class="card-h"><h2>Restart</h2></div><p class="hint">Start a new attempt, or clear exactly what you want. Your group and account always stay.</p><button class="btn danger block" data-act="startover">Start over…</button></section>`;
  return h;
}

const RAWF = { chicken_breast: [1.33, 'raw'], chicken_thigh: [1.33, 'raw'], beef_lean: [1.35, 'raw'], beef_mince: [1.35, 'raw'], kofta: [1.3, 'raw'], liver: [1.3, 'raw'], salmon: [1.25, 'raw'], tilapia: [1.25, 'raw'], shrimp: [1.25, 'raw'], rice_white: [0.36, 'dry'], rice_brown: [0.38, 'dry'], pasta: [0.42, 'dry'], lentils: [0.4, 'dry'], chickpeas: [0.45, 'dry'] };
const fmtG = g => g >= 1000 ? C.round(g / 1000, 2) + ' kg' : Math.round(g) + ' g';
function shoppingHTML(st) {
  const tot = {};
  (st.meals || []).forEach(m => (m.items || []).forEach(it => { const k = it.fid || it.name; (tot[k] = tot[k] || { name: it.name, fid: it.fid, g: 0 }).g += (it.g || 0) * 7; }));
  const rows = Object.values(tot).filter(x => x.g > 0).sort((a, b) => b.g - a.g).map(x => {
    const f = FOODS.find(y => y.id === x.fid), u = f && f.units && f.units[0], cv = RAWF[x.fid];
    let amt = fmtG(x.g);
    if (cv) amt = `≈ ${fmtG(x.g * cv[0])} ${cv[1]} (${fmtG(x.g)} cooked)`;
    else if (u && !/cup|tbsp|tsp|slice|bowl|plate|handful|portion|glass|box|bar/.test(u[0])) amt += ` · about ${Math.ceil(x.g / u[1])} × ${u[0]}`;
    return `<li><span>${esc(x.name.split(',')[0].split(' (')[0])}</span><span class="num">${amt}</span></li>`;
  }).join('');
  return rows ? `<details><summary class="hint">Weekly shopping list (7 days of this plan)</summary><ul class="list">${rows}</ul><p class="hint">Meat is shown as raw weight to buy, rice and pasta as dry weight.</p></details>` : '';
}

/* ---------- food sheet ---------- */
let SH = null; // {scope, picked, results, off}
TR.initTrain({ get S() { return S; }, esc, toast, draw: () => draw(), saveDay: d => saveDay(d), saveSettings: () => saveSettings(), dayDoc: d => dayDoc(d), editDate: () => editDate(), today: () => today(), fmt: d => fmt(d), openTimer: (m, sec, e) => openTimer(m, sec, e), buzz: p => buzz(p), staminaHTML: () => staminaHTML(), beep: n => beep(n), curWeight: d => curWeight(d), isOwner: () => !!(S.user && isOwner()), focusHit: f => focusHit(f), friends: () => friendRows(), setSH: o => { if (SH && SH.iv) clearInterval(SH.iv); SH = o; }, closeSheet: () => closeSheet() });
function openSheet(scope) {
  SH = { scope, picked: null, results: [], off: scope === 'extra', mode: 'search', usda: [], offr: [], stream: null, filt: 'all' };
  $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Add food"><div class="spread"><h2>Add food</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <input class="in" id="fs-q" placeholder="Search foods or brands (English or عربي)" autocomplete="off">
  <div class="fchips" id="fs-chips" role="group" aria-label="Show"></div>
  <div class="row"><button class="btn small mbb" data-act="mealbuild">🍔 Add a meal</button><button class="btn small" data-act="scan">Scan barcode</button><button class="btn small" data-act="custom">From a label</button><button class="btn small" data-act="recipe">New recipe</button></div>
  <div id="fs-body"></div></div>`;
  $('fs-q').addEventListener('input', () => { if (SH && SH.recipe) SH.recipeAdd = true; if (SH && SH.mb) SH.mbAdd = true; SH.usda = []; SH.offr = []; SH.offMsg = ''; sheetSearch(); });
  sheetSearch();
  setTimeout(() => $('fs-q') && $('fs-q').focus(), 50);
}

function pastMeals(mealId, back = 21, withToday) {
  const t = today(), out = [], seen = new Set();
  for (let i = withToday ? 0 : 1; i <= back; i++) {
    const dt = C.addDays(t, -i), d = S.days[dt]; if (!d || !d.meals) continue;
    const names = Object.fromEntries(C.mealsOn(S.settings, dt).map(m => [m.id, m.name]));
    Object.entries(d.meals).forEach(([id, md]) => {
      if (!md || (md.status !== 'swap' && md.status !== 'off') || !(md.items || []).length || (d.skip || {})[id]) return;
      const sig = md.items.map(x => `${x.fid || x.name}:${x.g}`).sort().join('|'); if (seen.has(sig)) return; seen.add(sig);
      out.push({ date: dt, id, name: names[id] || 'Meal', status: md.status, items: md.items, same: id === mealId });
    });
  }
  return out.sort((a, b) => (b.same - a.same) || (a.date < b.date ? 1 : -1)).slice(0, back > 21 ? 60 : 25);
}
// meal plan: fill a planned meal from something you already ate (or another meal in the plan)
function openPlanCopy(mealId) {
  const PM = planMeals(), target = PM.find(m => m.id === mealId); if (!target) return;
  const others = PM.filter(m => m.id !== mealId && (m.items || []).length).map(m => ({ name: m.name, items: m.items, plan: true }));
  const past = pastMeals(mealId, 90, true).map(m => ({ name: `${m.name} · ${fmt(m.date)}`, items: m.items, off: m.status === 'off' }));
  const extras = []; const seen = new Set();
  for (let i = 0; i <= 30; i++) { const dt = C.addDays(today(), -i), d = S.days[dt]; ((d && d.extras) || []).forEach(x => { const k = x.fid || x.name; if (x.drink || seen.has(k)) return; seen.add(k); extras.push({ name: `${x.name.split(',')[0]} · ${fmt(dt)}`, items: [x], extra: true }); }); }
  const list = [...others, ...past, ...extras.slice(0, 15)];
  SH = { scope: 'plancopy', mealId, list, q: '' };
  drawPlanCopy();
}
function drawPlanCopy(onlyRes) {
  const { list, mealId, q } = SH, target = planMeals().find(m => m.id === mealId), qq = (q || '').toLowerCase().trim();
  const row = (m, i) => { const sm = C.sumItems(m.items); return `<button class="res" data-act="plancopypick" data-v="${i}"><span><b>${esc(m.name)}</b><small>${esc(m.items.map(x => x.name.split(',')[0]).join(', '))}${m.off ? ' · off-plan' : ''}</small></span><span class="k num">${kc(sm.k)} kcal</span></button>`; };
  const pick = (f) => list.map((m, i) => [m, i]).filter(([m]) => f(m) && (!qq || m.name.toLowerCase().includes(qq) || m.items.some(x => x.name.toLowerCase().includes(qq))));
  const grp = (t, rows) => rows.length ? `<h3 class="grp">${t}</h3><div class="results">${rows.map(([m, i]) => row(m, i)).join('')}</div>` : '';
  const g1 = pick(m => m.plan), g2 = pick(m => !m.plan && !m.extra), g3 = pick(m => m.extra);
  const res = `${grp('Other meals in your plan', g1)}${grp('Meals you logged (last 90 days)', g2)}${grp('Single foods you added', g3)}${!g1.length && !g2.length && !g3.length ? `<p class="hint">${qq ? 'Nothing matches.' : 'Nothing yet. When you log a meal as “Changed” or “Off-plan”, it shows up here to reuse.'}</p>` : ''}`;
  if (onlyRes && $('plancopy-res')) { $('plancopy-res').innerHTML = res; return; }
  $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Use a meal you ate before"><div class="grab" aria-hidden="true"></div><div class="spread"><h2>Fill ${esc(target.name)}</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <p class="hint">Pick a meal and its foods and grams go into ${esc(target.name)} in your plan. ${(target.items || []).length ? 'Choose to replace what’s there or add to it.' : ''} You can edit the grams after.</p>
  ${(target.items || []).length ? `<div class="seg wide" role="group" aria-label="Replace or add"><button data-act="plancopymode" data-v="replace" aria-pressed="${SH.mode !== 'add'}">Replace</button><button data-act="plancopymode" data-v="add" aria-pressed="${SH.mode === 'add'}">Add to it</button></div>` : ''}
  <input class="in" id="plancopy-q" type="search" placeholder="Search meals or foods" value="${esc(q || '')}" autocomplete="off">
  <div id="plancopy-res">${res}</div></div>`;
}
function openCopy(mealId) {
  const list = pastMeals(mealId);
  SH = { scope: 'copy', mealId, list };
  $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Copy a past meal"><div class="spread"><h2>Copy a meal</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <p class="hint">Meals you changed in the last 3 weeks. Tap one to use the same foods now; you can still edit the grams after.</p>
  <div class="results">${list.length ? list.map((m, i) => { const s = C.sumItems(m.items); return `<button class="res" data-act="copypick" data-v="${i}"><span><b>${esc(m.name)} · ${fmt(m.date)}</b><small>${esc(m.items.map(x => x.name.split(',')[0]).join(', '))}${m.status === 'off' ? ' · off-plan' : ''}</small></span><span class="k num">${kc(s.k)} kcal<br><small>${C.round(s.p, 1)} g P</small></span></button>`; }).join('') : '<p class="hint">No changed meals in the last 3 weeks yet. Once you log a meal as “Changed”, it shows up here.</p>'}</div></div>`;
}
function closeSheet() { if (SH && SH.iv) clearInterval(SH.iv); stopCam(); SH = null; $('sheet').hidden = true; $('sheet').innerHTML = ''; }
/* favourites (starred) and recent foods: foods you logged yourself in changed/off-plan meals and extras, newest first, with the amount you used last time */
const favs = () => (S.settings && S.settings.favFoods) || [];
const isFav = f => favs().some(x => x.id === f.id);
/* ---------- foods: Egyptian brands, servings, more nutrients ---------- */
const FOOD_BY_ID = Object.fromEntries([...FOODS, ...BRANDS].map(f => [f.id, f]));
const unitsOf = f => ((f && f.units) || []).map(u => Array.isArray(u) ? u : u && [u.n, u.g]).filter(u => u && u[0] && +u[1] > 0).map(u => [String(u[0]), +u[1]]);
// foods friends chose to share with the group (published on their friends-board summary)
function friendFoods() {
  const out = {};
  Object.entries(S.board || {}).forEach(([id, m]) => { if (id === uid() || !m || !Array.isArray(m.foods)) return; m.foods.forEach(f => { if (f && f.id && f.per && f.name && !out[f.id] && !S.foods[f.id]) out[f.id] = { ...f, units: unitsOf(f), src: 'friend', by: m.name || 'A friend' }; }); });
  return Object.values(out);
}
function baseFood(fid) { if (!fid) return null; return S.foods[fid] || FOOD_BY_ID[fid] || friendFoods().find(f => f.id === fid) || null; }
// one nutrient of a logged item, per 100 g: from the item, else from its food, else from the similar basic food it points to (an estimate)
function microOf(it, k) {
  if (it.parts && it.parts.length) { let v = 0, est = false; for (const x of it.parts) { const m = microOf(x, k); if (!m) { if ((x.per.k || 0) > 5) return null; continue; } v += m.v * x.g / 100; est = est || m.est; } return { v: v / (it.g || 1) * 100, est }; }
  const p = it.per || {}; if (p[k] != null) return { v: +p[k], est: false };
  const b = baseFood(it.fid); if (b && b.per && b.per[k] != null) return { v: +b.per[k], est: false };
  const lk = it.like || (b && b.like), l = lk && FOOD_BY_ID[lk];
  return l && l.per[k] != null ? { v: +l.per[k], est: true } : null;
}
function loggedItems(d) {
  const out = [], meals = (d && d.meals) || {};
  Object.keys(meals).forEach(id => { const md = meals[id]; if (!md || !md.status || (d.skip && d.skip[id])) return; (md.items || []).forEach(it => out.push(it)); });
  ((d && d.extras) || []).forEach(it => out.push(it));
  return out;
}
function dayMicros(d) {
  const tot = {}, miss = {}, est = {}, has = {}, src = [], items = loggedItems(d);
  C.MICROS.forEach(({ k }) => { tot[k] = 0; miss[k] = 0; est[k] = false; has[k] = 0; });
  items.forEach(it => {
    const g = it.g || 0; if (!g) return;
    C.MICROS.forEach(({ k }) => {
      const m = microOf(it, k);
      if (!m) { if (((it.per || {}).k || 0) > 5) miss[k]++; return; }
      tot[k] += m.v * g / 100; has[k]++; if (m.est) est[k] = true;
      if (k === 'na' && m.v * g / 100 >= 1) src.push({ name: it.name, g, v: m.v * g / 100, it });
    });
  });
  return { tot, miss, est, has, n: items.length, src: src.sort((a, b) => b.v - a.v).slice(0, 3) };
}
const nfm = v => v >= 100 ? Math.round(v).toLocaleString('en-US') : String(C.round(v, 1));
const qtyTxt = q => q === 0.5 ? '½' : q === 0.25 ? '¼' : q === 1.5 ? '1½' : String(C.round(q, 2));
const amountTxt = it => it.su ? `${qtyTxt(it.sq || 1)} ${it.su}` : `${C.round(it.g, 1)} ${C.isDrink(it) ? 'ml' : 'g'}`;
function microRow(x, v, lim, est, none) {
  if (none) return `<div class="mic na"><span>${x.name}</span><i aria-hidden="true"></i><span>no data yet</span></div>`;
  const f = lim ? v / lim : 0, col = x.max ? (f > 1 ? 'var(--bad)' : f > 0.8 ? 'var(--gold)' : 'var(--good)') : (f >= 1 ? 'var(--good)' : 'var(--water)');
  return `<div class="mic"><span>${x.name}</span><i aria-hidden="true"><em style="width:${Math.min(100, f * 100).toFixed(0)}%;background:${col}"></em></i><span class="num"><b>${est && v >= 0.5 ? '~' : ''}${nfm(v)}</b><small> / ${nfm(lim)} ${x.u}</small></span></div>`;
}
function nutrientsHTML(date, d) {
  const m = dayMicros(d); if (!m.n) return '';
  const kcal = C.planTargets(S.settings, d, date).k || C.dayTotals(S.settings, d).k || 2000;
  const rows = C.MICROS.map(x => microRow(x, m.tot[x.k], x.max ? x.max(kcal) : x.min(kcal), m.est[x.k], !m.has[x.k])).join('');
  const na = m.tot.na, naLim = 2000, notes = [];
  if (na > naLim) notes.push(`Sodium is over the 2,000 mg daily limit (about ${C.round(C.saltFromNa(na), 1)} g of salt).`);
  else if (na > naLim * 0.8) notes.push(`Sodium is close to the 2,000 mg daily limit.`);
  const mx = m.miss.na; if (mx) notes.push(mx === 1 ? '1 food has no sodium on its label, so the real total may be higher.' : `${mx} foods have no sodium on their labels, so the real total may be higher.`);
  if (Object.values(m.est).some(Boolean)) notes.push('~ includes estimates for brand foods whose labels left a value out.');
  const src = m.src.length ? `<div class="nsrc"><span class="sub">Most sodium today</span>${m.src.map(x => `<div class="sv"><span>${esc(x.name.split(',')[0])} · ${esc(amountTxt(x.it))}</span><b class="num">${nfm(x.v)} mg</b></div>`).join('')}</div>` : '';
  return `<section class="card" id="sec-nutri"><h3 class="ntitle">More nutrients today</h3>${rows}${notes.length ? `<p class="hint">${notes.map(n => `<span>${esc(n)}</span>`).join(' ')}</p>` : ''}${src}
  <details class="why"><summary class="hint">Where do these limits come from?</summary><p class="hint">WHO: sodium under 2,000 mg a day (5 g of salt), sugar and saturated fat each under 10% of your calories, potassium at least 3,500 mg. Fiber 30 g and calcium 1,000 mg are typical adult targets. Sugar here is total sugar from labels, so fruit and milk count too.</p></details></section>`;
}

/* search: favourites, recent, my foods, Egyptian brands, basics, friends' foods; plus online (Open Food Facts Egypt, USDA) */
const FILTS = [['all', 'All'], ['eg', 'Egyptian brands'], ['basic', 'Basics'], ['mine', 'My foods'], ['friends', 'Friends’ foods']];
function recentFoods() {
  const map = {};
  Object.values(S.days).forEach(d => {
    const add = it => { if (!it || !it.name || !it.per) return; const k = it.fid || it.name, r = map[k] || (map[k] = { n: 0, last: '', it }); r.n++; if ((d.date || '') >= r.last) { r.last = d.date || ''; r.it = it; } };
    const plan = S.settings ? C.mealsOn(S.settings, d.date) : [];
    Object.entries(d.meals || {}).forEach(([id, md]) => {
      if (!md || (md.status !== 'swap' && md.status !== 'off')) return;
      const pm = (plan.find(m => m.id === id) || {}).items || [];
      (md.items || []).forEach(it => { if (!pm.some(p => p.fid === it.fid && p.name === it.name && p.g === it.g)) add(it); }); // skip untouched plan foods
    });
    (d.extras || []).forEach(add);
  });
  return Object.values(map).sort((a, b) => b.last.localeCompare(a.last) || b.n - a.n).slice(0, 15).map(r => {
    const it = r.it, b = baseFood(it.fid), base = b ? { ...b, src: S.foods[it.fid] ? 'custom' : b.src } : { id: it.fid || 'r_' + it.name, name: it.name, per: it.per, units: [], src: 'recent', like: it.like };
    return { ...base, drink: C.isDrink(it), lastG: it.g, lastSu: it.su, lastSq: it.sq, recent: true };
  });
}
function libMatches(q, filt = 'all') {
  const ql = (q || '').toLowerCase().trim(), words = ql.split(/\s+/).filter(Boolean);
  const hit = f => !ql || words.every(w => f.name.toLowerCase().includes(w) || (f.brand && f.brand.toLowerCase().includes(w))) || (f.ar && f.ar.includes(q.trim()));
  const tag = (arr, sec) => arr.map(f => ({ ...f, sec }));
  const mine = Object.values(S.foods).map(f => ({ ...f, src: 'custom' }));
  if (filt === 'eg') return tag(BRANDS.filter(hit), 'Egyptian brands');
  if (filt === 'basic') return tag(FOODS.filter(hit), 'Basics');
  if (filt === 'mine') return tag(mine.filter(hit), 'My foods');
  if (filt === 'friends') return tag(friendFoods().filter(hit), 'Friends’ foods');
  const fv = favs().map(f => ({ ...f, fav: true })), rc = recentFoods().filter(f => !fv.some(x => x.id === f.id));
  const seen = new Set([...fv, ...rc].map(f => f.id)), rest = (arr) => arr.filter(f => !seen.has(f.id) && hit(f));
  if (!ql) return [...tag(fv, 'Favourites'), ...tag(rc.slice(0, 8), 'Recent'), ...tag(rest([...mine, ...FOODS]).slice(0, 30), 'All foods')];
  return [...tag(fv.filter(hit), 'Favourites'), ...tag(rc.filter(hit).slice(0, 15), 'Recent'), ...tag(rest(mine), 'My foods'), ...tag(rest(BRANDS).slice(0, 25), 'Egyptian brands'), ...tag(rest(FOODS).slice(0, 40), 'Basics'), ...tag(rest(friendFoods()).slice(0, 15), 'Friends’ foods')];
}
function resRow(f, i, src) {
  const u = unitsOf(f)[0], badge = f.chk === true || f.chk === 'ok' ? ' <span class="ok-b">Label ✓</span>' : (f.src === 'off' && f.chk === 'warn') ? ' <span class="warn-b">check label</span>' : '';
  const sub = [f.fav ? '★ favourite' : '', f.recent && f.lastG ? `last time ${esc(amountTxt({ g: f.lastG, su: f.lastSu, sq: f.lastSq, drink: f.drink }))}` : '',
    src === 'usda' ? 'USDA' : src === 'off' ? 'Open Food Facts · Egypt' : f.src === 'friend' ? `from ${esc(f.by)}` : f.recipe ? 'your recipe' : f.src === 'custom' ? 'your food' : '',
    f.brand && !f.recent ? esc(f.brand) : '', u ? `${esc(u[0])} ${u[1]} ${f.drink ? 'ml' : 'g'}` : '', !f.brand && f.ar ? esc(f.ar) : ''].filter(Boolean).join(' · ');
  const right = u ? `${kc(f.per.k * u[1] / 100)} kcal · ${C.round(f.per.p * u[1] / 100, 1)} P<br><small>per ${esc(u[0])}</small>` : `${kc(f.per.k)} kcal · ${C.round(f.per.p, 1)} P<br><small>per 100 g</small>`;
  return `<button class="res" data-act="pick" data-v="${src}:${i}"><span><b>${esc(f.name)}${badge}</b><small>${sub}</small></span><span class="k num">${right}</span></button>`;
}
function sheetSearch() {
  if (!SH) return;
  if (SH.recipe && !SH.recipeAdd && !SH.picked) return drawRecipe();
  if (SH.mb && !SH.mbAdd && !SH.picked) return drawMealBuild();
  const q = ($('fs-q') || {}).value || '';
  SH.results = libMatches(q, SH.filt);
  if (SH.picked) return drawPicked();
  const ch = $('fs-chips'); if (ch) ch.innerHTML = FILTS.filter(([k]) => k !== 'friends' || friendFoods().length || SH.filt === 'friends').map(([k, l]) => `<button data-act="ffilt" data-v="${k}" aria-pressed="${SH.filt === k}">${l}</button>`).join('');
  const lib = SH.results.map((f, i) => (f.sec && (i === 0 || SH.results[i - 1].sec !== f.sec) ? `<span class="sub">${f.sec}</span>` : '') + resRow(f, i, 'lib')).join('');
  const online = q.trim() ? `<div class="online"><button class="btn small" data-act="offsearch">🛒 Search Egyptian products online</button><button class="btn small" data-act="usda">Search USDA</button></div>${SH.offMsg ? `<p class="hint">${esc(SH.offMsg)}</p>` : ''}` : `<p class="hint">Type a food or a brand (Balance, Juhayna, Rich Bake…). Products sold in Egypt can also be searched online.</p>`;
  $('fs-body').innerHTML = (!q.trim() && !SH.recipe && !SH.mb && SH.scope !== 'focus' ? usualsHTML() : '') + (SH.mb ? `<div class="rc-banner"><span>Pick a food for <b>${esc(SH.mb.name || 'your meal')}</b></span><button class="link" data-act="mbback">Back to the meal</button></div>` : '') + (SH.recipe ? `<div class="rc-banner"><span>Pick an ingredient for <b>${esc(SH.recipe.name || 'your recipe')}</b></span><button class="link" data-act="rcback">Back to recipe</button></div>` : '')
    + `<div class="results">${lib || (q.trim() ? '<p class="hint">Nothing in the app’s foods. Try searching online below, scan the barcode, or add it from the label.</p>' : '')}
    ${SH.offr.length ? '<span class="sub">Sold in Egypt · Open Food Facts</span>' + SH.offr.map((f, i) => resRow(f, i, 'off')).join('') : ''}
    ${SH.usda.length ? '<span class="sub">USDA results</span>' + SH.usda.map((f, i) => resRow(f, i, 'usda')).join('') : ''}</div>${online}`;
}
function pickFood(f) {
  SH.picked = f; SH.drink = !!f.drink; SH.warned = false; SH.add = {}; SH.saveUsual = false; SH.tspEdit = false;
  const ff = ((S.settings && S.settings.fatFor) || {})[f.id]; SH.fat = ff && canCook(f) ? { ...ff } : null; SH.remFat = !!ff;
  const us = unitsOf(f);
  if (SH.scope === 'extra') SH.off = !(SH.drink && (f.per.k || 0) < 5);
  let ui = f.lastSu ? us.findIndex(u => u[0] === f.lastSu) : -1;
  if (ui >= 0) { SH.u = ui; SH.q = f.lastSq || 1; }
  else if (f.lastG) { const j = us.findIndex(u => Math.abs(f.lastG / u[1] - Math.round(f.lastG / u[1] * 2) / 2) < 0.01 && f.lastG / u[1] >= 0.5); if (j >= 0) { SH.u = j; SH.q = Math.round(f.lastG / us[j][1] * 2) / 2; } else { SH.u = -1; SH.g = f.lastG; } }
  else if (us.length) { SH.u = 0; SH.q = 1; }
  else { SH.u = -1; SH.g = 100; }
  drawPicked();
}
function pickedNums() {
  const f = SH.picked, it = pickedItem(), g = it.g || 0, m = C.itemMacros(it);
  const date = editDate(), d = S.days[date] || {}, kcal = C.planTargets(S.settings, d, date).k || 2000;
  const mic = C.MICROS.slice(0, 4).map(x => { const r = microOf(it, x.k), lim = x.max ? x.max(kcal) : x.min(kcal); if (!r) return `<div class="mic na"><span>${x.name}</span><i aria-hidden="true"></i><span>not on label</span></div>`; const v = r.v * g / 100; return `<div class="mic"><span>${x.name}</span><i aria-hidden="true"><em style="width:${Math.min(100, v / lim * 100).toFixed(0)}%;background:${x.max ? 'var(--gold)' : 'var(--good)'}"></em></i><span class="num"><b>${r.est && v >= 0.5 ? '~' : ''}${nfm(v)} ${x.u}</b> <small>${Math.round(v / lim * 100)}%</small></span></div>`; }).join('');
  const na = microOf(it, 'na');
  return `<div class="mac4 num"><div><b>${kc(m.k)}</b><span>kcal</span></div><div><b>${C.round(m.p, 1)} g</b><span>protein</span></div><div><b>${C.round(m.c, 1)} g</b><span>carbs</span></div><div><b>${C.round(m.f, 1)} g</b><span>fat</span></div></div>
  <div class="mics"><span class="sub">More nutrients · share of your day</span>${mic}${na ? `<div class="mic"><span>Salt</span><i aria-hidden="true"></i><span class="num">${na.est ? '~' : ''}${C.round(C.saltFromNa(na.v * g / 100), 2)} g</span></div>` : ''}</div>`;
}
function drawPicked() {
  const f = SH.picked, us = unitsOf(f), unit = SH.drink ? 'ml' : 'g', u = SH.u >= 0 ? us[SH.u] : null;
  if (u) SH.g = C.round(u[1] * (SH.q || 1), 1);
  const ck = C.checkPer(f.per), code = f.code ? ' · ' + f.code : '';
  const srcTxt = f.src === 'brand' ? (f.rest ? 'From the restaurant’s published nutrition table' : (f.chk ? '✓ From the pack label' : 'From the pack label; values it left out are estimates (~)') + code)
    : f.src === 'off' ? 'Open Food Facts, entered by volunteers: compare with the pack' + code : f.src === 'usda' ? 'USDA FoodData Central' : f.src === 'friend' ? `Shared by · ${f.by}` : f.src === 'custom' ? (f.recipe ? 'Your recipe' : 'Your food') : f.src === 'lib' ? 'Built-in food' : '';
  const inGroup = !!(S.settings && S.settings.group), mineF = S.foods[f.id];
  $('fs-body').innerHTML = `<div class="picked"><div class="spread"><span><b>${esc(f.name)}</b>${f.brand ? `<small class="sub" style="display:block">${esc(f.brand)}</small>` : ''}</span><button class="star" data-act="fav" aria-pressed="${isFav(f)}" aria-label="${isFav(f) ? 'Remove from favourites' : 'Add to favourites'}">${isFav(f) ? '★' : '☆'}</button></div>
  ${u ? `<div class="amt"><button data-act="uq" data-v="-1" aria-label="Less">−</button><div><b class="num">${qtyTxt(SH.q)}</b><small>${esc(u[0])} · ${C.round(SH.g, 1)} ${unit}</small></div><button data-act="uq" data-v="1" aria-label="More">+</button></div>`
      : `<label class="g amt-g">${SH.drink ? 'Millilitres' : 'Grams'} <input class="in sm" id="fs-g" type="number" inputmode="decimal" step="any" value="${C.round(SH.g, 1)}"></label>`}
  <div class="units" role="group" aria-label="Serving">${us.map((x, i) => `<button data-act="uunit" data-v="${i}" aria-pressed="${SH.u === i}">${esc(x[0])} · ${C.round(x[1], 1)} ${unit}</button>`).join('')}<button data-act="uunit" data-v="-1" aria-pressed="${SH.u < 0}">${SH.drink ? 'Millilitres' : 'Grams'}</button></div>
  ${canAddIns(f) ? addinsHTML() : ''}${canCook(f) ? fatPickHTML(SH.fat) : ''}
  <div id="fs-nums">${pickedNums()}</div>
  ${(() => { const it = pickedItem(); return it.parts ? `<p class="hint combo-n"><b>${esc(it.name)}</b> · one item in your log${it.ml ? ` · ${it.ml} ml toward water` : ''}</p>` : ''; })()}
  ${canAddIns(f) || canCook(f) ? `<label class="chk"><input type="checkbox" id="fs-usual" ${SH.saveUsual ? 'checked' : ''}> Save as one of my usuals</label>${SH.saveUsual ? `<input class="in" id="fs-usual-n" maxlength="24" value="${esc(SH.usualName || (canAddIns(f) ? 'My ' + (/tea|شاي/i.test(f.name) ? 'tea' : 'coffee') : f.name.split(',')[0] + (SH.fat && SH.fat.k ? ' in ' + FATS.find(x => x.k === SH.fat.k).label.toLowerCase() : '')))}" aria-label="Name">` : ''}` : ''}
  ${canCook(f) && SH.fat && SH.fat.k ? `<label class="chk"><input type="checkbox" id="fs-remfat" ${SH.remFat ? 'checked' : ''}> Remember ${esc(FATS.find(x => x.k === SH.fat.k).label.toLowerCase())} for ${esc(f.name.split(',')[0].toLowerCase())}</label>` : ''}
  ${ck.level !== 'ok' ? `<p class="warnbox">⚠ The calories (${kc(f.per.k)} per 100 g) don’t match protein, carbs and fat (about ${ck.calc}). Check the pack before you rely on it.</p>` : ''}
  ${srcTxt ? `<p class="hint src">${esc(srcTxt)}</p>` : ''}
  <label class="chk"><input type="checkbox" id="fs-drink" ${SH.drink ? 'checked' : ''}> It’s a drink: count it toward my water</label>
  ${SH.scope === 'extra' ? `<div class="seg wide" role="group" aria-label="Plan status"><button class="clean" data-act="extraoff" data-v="0" aria-pressed="${!SH.off}">Allowed by plan</button><button class="off" data-act="extraoff" data-v="1" aria-pressed="${SH.off}">Off-plan</button></div>` : ''}
  <div class="row"><button class="btn primary grow" data-act="addpicked">${SH.recipe && SH.recipeAdd ? 'Add to recipe' : SH.mb && SH.mbAdd ? 'Add to meal' : 'Add'}</button><button class="btn ghost" data-act="unpick">Back</button>${f.src === 'usda' || f.src === 'off' || f.src === 'friend' ? '<button class="btn small" data-act="savefood">Save to my foods</button>' : ''}${mineF && inGroup ? `<button class="btn small" data-act="sharefood">${mineF.shared ? 'Shared with group ✓' : 'Share with my group'}</button>` : ''}</div></div>`;
  const gi = $('fs-g'); if (gi) gi.addEventListener('input', e => { SH.g = parseFloat(e.target.value) || 0; $('fs-nums').innerHTML = pickedNums(); });
}
function saveFood(f) {
  S.foods[f.id] = f;
  try { setDoc(doc(db, up('foods/' + f.id)), stamp('foods/', fsEnc(clone(f)))).catch(e => { console.warn('food', e); toast('Couldn’t save the food to your account. It stays on this phone.'); }); } catch (e) { console.warn('food', e); }
  if (f.shared) S.boardLast = null;
}

/* ---------- add-ins for drinks and cooking fat: logged as one combined item with its parts ---------- */
const ADDINS = [
  { k: 'milk', label: 'Milk', ic: '🥛', ml: true, opts: ['milk_full', 'milk_skim', 'juh_milk_full', 'juh_milk_skim', 'lamar_skim', 'almarai_milk'], chips: [30, 60, 100, 150], step: 10, def: 60 },
  { k: 'sugar', label: 'Sugar', fid: 'sugar', u: 'tsp', g: 4, chips: [0.5, 1, 2, 3], step: 0.5, def: 1 },
  { k: 'honey', label: 'Honey', fid: 'honey', u: 'tsp', g: 7, chips: [0.5, 1, 2], step: 0.5, def: 1 },
  { k: 'creamer', label: 'Creamer', fid: 'creamer', u: 'tsp', g: 2, chips: [1, 2, 3], step: 1, def: 2 },
  { k: 'sweetener', label: 'Sweetener', fid: 'sweetener', u: 'tablet', g: 0.1, chips: [1, 2], step: 1, def: 1 },
  { k: 'cinnamon', label: 'Cinnamon', fid: 'cinnamon', u: 'tsp', g: 2.6, chips: [0.25, 0.5, 1], step: 0.25, def: 0.5 },
];
const FATS = [{ k: 'ghee', label: 'Ghee' }, { k: 'oil', label: 'Oil' }, { k: 'olive_oil', label: 'Olive oil' }, { k: 'butter', label: 'Butter' }, { k: 'spray', label: 'Spray', u: 's', g: 0.75 }];
const COOKABLE = new Set(['chicken_breast', 'chicken_thigh', 'beef_lean', 'beef_mince', 'kofta', 'liver', 'salmon', 'tilapia', 'shrimp', 'egg', 'egg_fried', 'egg_white', 'turkey', 'tuna_water', 'areesh', 'rice_white', 'rice_brown', 'pasta', 'oats', 'potato', 'sweet_potato', 'lentils', 'foul', 'chickpeas', 'salad', 'tomato', 'carrot', 'broccoli', 'green_beans', 'zucchini', 'spinach', 'molokhia', 'vegetable_stew']);
const canAddIns = f => !!f && (['coffee', 'coffee_instant', 'tea', 'green_tea'].includes(f.id) || (!!f.drink && (f.per.k || 0) <= 20 && /coffee|tea|nescaf|espresso|latte|قهوة|شاي|نسكافيه/i.test(f.name + ' ' + (f.ar || ''))));
const canCook = f => !!f && !f.drink && (COOKABLE.has(f.id) || ((f.src === 'custom' || f.src === 'usda') && !f.recipe));
const fatTsp = () => +(S.settings && S.settings.fatTsp) || 4.5;
const fatG = (fk, n) => { const F = FATS.find(x => x.k === fk); return F && F.g ? n * F.g : n * fatTsp(); };
const fatAmt = (fk, n) => fk === 'spray' ? `${qtyTxt(n)} s spray` : n === 3 ? '1 tbsp' : `${qtyTxt(n)} tsp`;
function partOf(fid, g, extra = {}) { const f = FOOD_BY_ID[fid]; return f ? { fid, name: f.name, g: C.round(g, 2), per: { ...f.per }, ...extra } : null; }
function addinParts(add) {
  return ADDINS.filter(a => add[a.k]).map(a => {
    const v = add[a.k];
    if (a.k === 'milk') { const f = FOOD_BY_ID[v.fid] || FOOD_BY_ID.milk_full, kind = /skim|0%/i.test(f.name) ? 'skimmed milk' : /1\.5|low/i.test(f.name) ? 'low-fat milk' : 'milk'; return partOf(f.id, v.n, { drink: true, add: `${v.n} ml ${kind}` }); }
    return partOf(a.fid, v.n * a.g, { su: a.u, sq: v.n, add: `${qtyTxt(v.n)} ${a.u} ${a.label.toLowerCase()}` });
  }).filter(Boolean);
}
function fatPart(fat) { if (!fat || !fat.k || !(fat.n > 0)) return null; const F = FATS.find(x => x.k === fat.k); return partOf(fat.k, fatG(fat.k, fat.n), { fat: true, su: fat.k === 'spray' ? 's' : 'tsp', sq: fat.n, add: `${fatAmt(fat.k, fat.n)} ${F.label.toLowerCase()}` }); }
// main item + parts -> one item with combined per-100 g values
function makeCombo(main, extras) {
  extras = extras.filter(Boolean); if (!extras.length) return main;
  const parts = [{ ...main }, ...extras], g = parts.reduce((a, x) => a + (x.g || 0), 0) || 1, per = {};
  ['k', 'p', 'c', 'f'].forEach(k => per[k] = C.round(parts.reduce((a, x) => a + (x.per[k] || 0) * x.g / 100, 0) / g * 100, 3));
  const ml = main.drink ? parts.filter(x => x === parts[0] || x.drink).reduce((a, x) => a + x.g, 0) : undefined;
  const name = `${main.name.split(',')[0].replace(/\s*\(.*\)$/, '')} + ${extras.map(x => x.add).join(' + ')}`.slice(0, 80);
  return { fid: main.fid, name, g: C.round(g, 1), per, parts: parts.map(({ add, ...x }) => ({ ...x, ...(add ? { add } : {}) })), drink: !!main.drink, ...(ml != null ? { ml: Math.round(ml) } : {}), ...(main.su ? { su: main.su, sq: main.sq } : {}), ...(main.like ? { like: main.like } : {}) };
}
function scaleCombo(it, g) { const r = it.g ? g / it.g : 1; it.parts = it.parts.map(x => ({ ...x, g: C.round(x.g * r, 2) })); if (it.ml != null) it.ml = Math.round(it.ml * r); delete it.su; delete it.sq; }
function comboPartsHTML(it) { return it.parts ? `<div class="parts">${it.parts.map(x => `<span>${esc(x.add || amountTxt(x) + ' · ' + x.name.split(',')[0])}<b class="num">${kc((x.per.k || 0) * x.g / 100)}</b></span>`).join('')}</div>` : ''; }
function addinsHTML() {
  const add = SH.add || (SH.add = {});
  const on = ADDINS.filter(a => add[a.k]);
  return `<div class="addins"><span class="sub">Add to it</span><div class="units" role="group" aria-label="Add to it">${ADDINS.map(a => `<button data-act="addin" data-v="${a.k}" aria-pressed="${!!add[a.k]}">${a.ic ? a.ic + ' ' : ''}${a.label}</button>`).join('')}</div>
  ${on.map(a => { const v = add[a.k]; const milk = a.k === 'milk' ? FOOD_BY_ID[v.fid] : null;
    return `<div class="addrow"><div class="spread"><span><b>${milk ? esc(milk.name) : a.label}</b>${milk ? `<select class="in sm" data-addmilk="1" aria-label="Which milk">${a.opts.map(id => `<option value="${id}" ${id === v.fid ? 'selected' : ''}>${esc(FOOD_BY_ID[id].name)}</option>`).join('')}</select>` : `<small class="sub">1 ${a.u} = ${a.g} g</small>`}</span>
    <span class="mini"><button data-act="addinq" data-v="${a.k}:-1" aria-label="Less">−</button><b class="num">${a.ml ? v.n + ' ml' : qtyTxt(v.n) + ' ' + a.u}</b><button data-act="addinq" data-v="${a.k}:1" aria-label="More">+</button></span></div>
    <div class="units">${a.chips.map(c => `<button data-act="addinset" data-v="${a.k}:${c}" aria-pressed="${v.n === c}">${a.ml ? c + ' ml' : qtyTxt(c) + ' ' + a.u}</button>`).join('')}</div></div>`; }).join('')}</div>`;
}
function fatPickHTML(fat, withNone = true) {
  const F = fat && FATS.find(x => x.k === fat.k), chips = fat && fat.k === 'spray' ? [1, 2, 3] : [0.5, 1, 2, 3];
  return `<div class="fats"><span class="sub">Cooked with</span><div class="units" role="group" aria-label="Cooked with">${withNone ? `<button data-act="fatk" data-v="" aria-pressed="${!fat || !fat.k}">Nothing</button>` : ''}${FATS.map(x => `<button data-act="fatk" data-v="${x.k}" aria-pressed="${!!fat && fat.k === x.k}">${x.label}</button>`).join('')}</div>
  ${F ? `<div class="addrow"><div class="spread"><span><b>${F.label}</b><small class="sub">${F.k === 'spray' ? 'about 6 kcal per 1-second spray, even if the can says 0' : `your teaspoon = ${fatTsp()} g · <button class="link" data-act="tspedit">edit</button>`}</small>${SH.tspEdit && F.k !== 'spray' ? `<label class="g">1 tsp = <input class="in sm" id="fat-tsp" type="number" inputmode="decimal" step="0.5" min="1" max="15" value="${fatTsp()}"> g</label>` : ''}</span>
  <span class="mini"><button data-act="fatq" data-v="-1" aria-label="Less">−</button><b class="num">${esc(fatAmt(F.k, fat.n))}</b><button data-act="fatq" data-v="1" aria-label="More">+</button></span></div>
  <div class="units">${chips.map(c => `<button data-act="fatn" data-v="${c}" aria-pressed="${fat.n === c}">${esc(fatAmt(F.k, c))}</button>`).join('')}</div></div>` : ''}</div>`;
}
// what the picker would add right now (the combined item), or null
function pickedItem() {
  const f = SH.picked, u = SH.u >= 0 ? unitsOf(f)[SH.u] : null;
  const main = { fid: f.id, name: f.name, g: C.round(SH.g, 1), per: { ...f.per }, drink: !!SH.drink, ...(f.like ? { like: f.like } : {}), ...(u ? { su: u[0], sq: SH.q || 1 } : {}) };
  return makeCombo(main, [...(canAddIns(f) ? addinParts(SH.add || {}) : []), canCook(f) ? fatPart(SH.fat) : null]);
}
function usualsHTML() {
  const us = (S.settings.usuals || []); if (!us.length) return '';
  return `<div class="usuals"><span class="sub">Your usuals · one tap</span><div class="ulist">${us.map((u, i) => `<span class="uchip"><button data-act="usual" data-v="${i}">${esc(u.name)} · <span class="num">${kc(C.itemMacros(u.item).k)}</span></button>${SH.usualEdit ? `<button class="x" data-act="usualrm" data-v="${i}" aria-label="Remove ${esc(u.name)}">×</button>` : ''}</span>`).join('')}<button class="link" data-act="usualedit">${SH.usualEdit ? 'Done' : 'Edit'}</button></div></div>`;
}
// meal-level cooking fat: one fat item inside the meal's foods (a planned meal or a logged one); never makes a meal off-plan
function mealFatItem(items) { return (items || []).find(x => x.fat && !x.parts); }
function openFatSheet(scope) {
  const items = itemList(scope) || [], cur = mealFatItem(items);
  SH = { scope, fatSheet: true, fat: cur ? { k: cur.fid, n: cur.sq || 1 } : { k: 'ghee', n: 1 } };
  $('sheet').hidden = false;
  drawFatSheet();
}
function drawFatSheet() {
  const p = fatPart(SH.fat), cur = mealFatItem(itemList(SH.scope) || []);
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Cooking fat"><div class="spread"><h2>Cooking fat</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <p class="hint">Ghee, oil or butter you cook this meal with. It adds calories but never makes the meal off-plan.</p>${fatPickHTML(SH.fat, false)}
  ${p ? `<p class="hint">Adds <b class="num">${kc(p.per.k * p.g / 100)} kcal</b> and <b class="num">${C.round(p.per.f * p.g / 100, 1)} g</b> fat.</p>` : ''}
  <div class="row"><button class="btn primary grow" data-act="fatsave">${cur ? 'Update' : 'Add to meal'}</button>${cur ? '<button class="btn ghost" data-act="fatrm">Remove</button>' : ''}</div></div>`;
}

/* online: USDA FoodData Central and Open Food Facts (products sold in Egypt) */
async function usdaSearch() {
  const q = ($('fs-q').value || '').trim();
  if (!q) { toast('Type what you’re looking for first.'); return; }
  if (!navigator.onLine) { toast('Online search needs internet. The built-in foods work offline.'); return; }
  $('fs-body').innerHTML = '<p class="hint">Searching USDA…</p>';
  try {
    const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(q)}&pageSize=20&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS),Branded')}`);
    const j = await r.json();
    const NUM = { k: ['208', '1008'], p: ['203', '1003'], c: ['205', '1005'], f: ['204', '1004'], na: ['307', '1093'], sug: ['269', '2000'], sat: ['606', '1258'], fib: ['291', '1079'], pot: ['306', '1092'], ca: ['301', '1087'] };
    const get = (fn, nums) => { const n = (fn || []).find(x => nums.includes(String(x.nutrientNumber)) || nums.includes(String(x.nutrientId))); return n && n.value != null ? +n.value : null; };
    SH.usda = (j.foods || []).map(f => {
      const per = {}; Object.entries(NUM).forEach(([k, n]) => { const v = get(f.foodNutrients, n); if (v != null) per[k] = v; else if ('kpcf'.includes(k)) per[k] = 0; });
      const units = [];
      if (f.servingSize > 0 && /^(g|grm|ml|mlt)$/i.test(f.servingSizeUnit || '')) units.push([(f.householdServingFullText || 'serving').slice(0, 30), C.round(f.servingSize, 1)]);
      (f.foodMeasures || []).filter(m => m.gramWeight > 0 && m.disseminationText && !/not specified/i.test(m.disseminationText)).slice(0, 4).forEach(m => units.push([m.disseminationText.slice(0, 30), C.round(m.gramWeight, 1)]));
      return { id: 'usda_' + f.fdcId, name: (f.description || '').toLowerCase().replace(/^\w/, c => c.toUpperCase()) + (f.brandOwner ? ` (${f.brandOwner})` : ''), per: C.cleanPer(per), units, src: 'usda' };
    }).filter(f => f.per.k > 0);
    sheetSearch();
  } catch (e) { $('fs-body').innerHTML = '<p class="hint">Online search failed. Check your connection and try again.</p>'; }
}
const OFF_FIELDS = 'code,product_name,product_name_en,product_name_ar,brands,quantity,serving_quantity,product_quantity,nutriments';
function offFood(p) {
  const n = p.nutriments || {}, v = k => n[k] != null && n[k] !== '' && isFinite(+n[k]) ? +n[k] : null;
  let k = v('energy-kcal_100g'); if (k == null && v('energy_100g') != null) k = v('energy_100g') / 4.184;
  const per = { k: k || 0, p: v('proteins_100g') || 0, c: v('carbohydrates_100g') || 0, f: v('fat_100g') || 0 };
  const na = v('sodium_100g') != null ? v('sodium_100g') * 1000 : v('salt_100g') != null ? C.naFromSalt(v('salt_100g')) : null;
  if (na != null && v('sodium_100g') != null && v('salt_100g') != null && Math.abs(C.naFromSalt(v('salt_100g')) - na) > Math.max(30, na * 0.3)) { /* salt and sodium disagree: trust neither */ } else if (na != null) per.na = na;
  [['sug', 'sugars_100g'], ['sat', 'saturated-fat_100g'], ['fib', 'fiber_100g'], ['pot', 'potassium_100g', 1000], ['ca', 'calcium_100g', 1000]].forEach(([key, f, m]) => { const x = v(f); if (x != null) per[key] = x * (m || 1); });
  const units = [], sq = +p.serving_quantity, pq = +p.product_quantity;
  if (sq > 0 && sq <= 2000) units.push(['serving', C.round(sq, 1)]);
  if (pq > 0 && pq <= 2000 && Math.abs(pq - (sq || 0)) > 1) units.push(['pack', C.round(pq, 1)]);
  const nm = String(p.product_name_en || p.product_name || p.product_name_ar || 'Product').trim().slice(0, 60), brand = String(p.brands || '').split(',')[0].trim().slice(0, 30);
  const clean = C.cleanPer(per);
  return { id: 'off_' + p.code, code: p.code, name: brand && !nm.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${nm}` : nm, brand, ar: p.product_name_ar || '', per: clean, units, src: 'off', chk: C.checkPer(clean).level };
}
async function offSearch() {
  const q = ($('fs-q').value || '').trim();
  if (!q) { toast('Type a product or brand first.'); return; }
  if (!navigator.onLine) { toast('Online search needs internet.'); return; }
  $('fs-body').innerHTML = '<p class="hint">Searching products sold in Egypt…</p>';
  let prods = null;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=40&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent('en:egypt')}&fields=${OFF_FIELDS}`);
    if (r.ok) prods = (await r.json()).products;
  } catch (e) { }
  if (!prods) {
    try { const r = await fetch(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(`${q} countries_tags:"en:egypt"`)}&page_size=40&fields=${OFF_FIELDS}`); if (r.ok) prods = (await r.json()).hits; } catch (e) { }
  }
  if (!prods) { SH.offr = []; SH.offMsg = 'Open Food Facts didn’t answer. Try again in a minute.'; return sheetSearch(); }
  const seen = new Set(BRANDS.map(b => b.code).filter(Boolean));
  SH.offr = prods.filter(p => p && p.code && !seen.has(p.code) && (seen.add(p.code), true)).map(offFood).filter(f => f.per.k > 0 && f.chk !== 'bad').slice(0, 25);
  SH.offMsg = SH.offr.length ? (prods.length > SH.offr.length ? 'Entries whose calories don’t add up were left out.' : '') : 'Nothing usable found. Scan the barcode, or add it from the label.';
  sheetSearch();
}
async function lookupBarcode(code) {
  const local = BRAND_BY_CODE[code]; if (local) return pickFood(local);
  const mine = Object.values(S.foods).find(f => f.code === code); if (mine) return pickFood({ ...mine, src: 'custom' });
  $('fs-body').innerHTML = '<p class="hint">Looking up ' + esc(code) + '…</p>';
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
    const j = await r.json(), p = j.product;
    if (!p || !p.nutriments || !(p.nutriments['energy-kcal_100g'] != null || p.nutriments.energy_100g != null)) { $('fs-body').innerHTML = `<p class="hint">No nutrition found for ${esc(code)}. Add it from the label (you can type or photograph it).</p><button class="btn small" data-act="custom" data-v="${esc(code)}">Add from the label</button>`; return; }
    pickFood(offFood({ ...p, code }));
  } catch (e) { $('fs-body').innerHTML = '<p class="hint">Lookup failed. Check your connection.</p>'; }
}

async function startScan() {
  if (!navigator.onLine) { toast('Barcode lookup needs internet.'); return; }
  if (!('BarcodeDetector' in window)) {
    $('fs-body').innerHTML = `<div class="picked"><p class="hint">This browser can’t scan. Type the barcode number instead.</p><div class="row"><input class="in grow" id="fs-code" inputmode="numeric" placeholder="Barcode number"><button class="btn small primary" data-act="codego">Look up</button></div></div>`;
    return;
  }
  $('fs-body').innerHTML = `<video class="cam" id="cam" playsinline muted></video><p class="hint">Point the camera at the barcode.</p>`;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    SH.stream = stream; const v = $('cam'); v.srcObject = stream; await v.play();
    const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    const loop = async () => {
      if (!SH || !SH.stream) return;
      try { const codes = await det.detect(v); if (codes.length) { const c = codes[0].rawValue; stopCam(); lookupBarcode(c); return; } } catch (e) { }
      setTimeout(loop, 250);
    };
    loop();
  } catch (e) { $('fs-body').innerHTML = '<p class="hint">Camera permission was refused. Allow the camera for this app in Chrome’s site settings, or type the barcode number.</p>'; }
}
function stopCam() { if (SH && SH.stream) { SH.stream.getTracks().forEach(t => t.stop()); SH.stream = null; } }
/* recipe builder: ingredients (cooked or raw, as you weigh them) + the finished dish weight -> one food per 100 g */
/* a whole meal (burger + fries + drink) logged as one item, as an extra or instead of a planned meal */
function mbItem(mb) {
  const items = mb.items, g = items.reduce((a, x) => a + (x.g || 0), 0) || 1, per = {};
  ['k', 'p', 'c', 'f'].forEach(k => per[k] = C.round(items.reduce((a, x) => a + (x.per[k] || 0) * x.g / 100, 0) / g * 100, 3));
  const ml = items.reduce((a, x) => a + (C.isDrink(x) ? (x.ml ?? x.g ?? 0) : x.meal ? (x.ml || 0) : 0), 0);
  return { name: (mb.name || 'Meal').trim().slice(0, 40), g: C.round(g, 1), per, parts: clone(items), meal: true, ...(ml ? { ml: Math.round(ml) } : {}) };
}
function mbRead() { const mb = SH.mb; if (!mb) return mb; const n = $('mb-n'); if (n) mb.name = n.value; const sv = $('mb-save'); if (sv) mb.save = sv.checked; document.querySelectorAll('[data-mbg]').forEach(e => { const it = mb.items[+e.dataset.mbg], g = parseFloat(e.value); if (it && g > 0 && g !== it.g) { if (it.parts) scaleCombo(it, g); it.g = g; delete it.su; delete it.sq; } }); return mb; }
function drawMealBuild() {
  const mb = SH.mb, st = S.settings, date = editDate(), d = S.days[date] || {}, plan = C.plannedMeals(st, d, date), it = mb.items.length ? mbItem(mb) : null, tot = it ? C.itemMacros(it) : null, na = it ? microOf(it, 'na') : null;
  const cheatOn = !!(st.cheat && st.cheat.on), cu = cheatOn ? C.cheatsUsed(st, S.days, date, date) : null, todayUsed = C.pillars(st, d, date).cheats - (mb.edit && mb.wasCheat ? 1 : 0), left = cu ? Math.max(0, cu.max - cu.used - todayUsed) : 0;
  if (mb.counts === 'cheat' && !left) mb.counts = 'ok';
  $('fs-body').innerHTML = `<div class="picked mbuild"><b>${mb.edit ? 'Edit meal' : 'Add a meal'}</b>
  <input class="in" id="mb-n" maxlength="40" placeholder="e.g. Burger meal" value="${esc(mb.name)}" aria-label="Meal name">
  <div class="items">${mb.items.map((x, i) => `<div class="itm"><div class="nm">${esc(x.name.split(' + ')[0])}${comboPartsHTML(x)}<small>${esc(amountTxt(x))} · ${kc(C.itemMacros(x).k)} kcal</small></div><label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(x.g, 1)}" data-mbg="${i}" aria-label="Amount of ${esc(x.name)}"><span>${C.isDrink(x) ? 'ml' : 'g'}</span></label><button class="x" data-act="mbrm" data-v="${i}" aria-label="Remove ${esc(x.name)}">×</button></div>`).join('') || '<p class="hint">Add each food you ate, with its serving.</p>'}</div>
  <button class="btn small" data-act="mbadd">+ Add a food to this meal</button>
  ${tot ? `<div class="mbtot"><b class="num">${kc(tot.k)} kcal</b><div class="mac4 num"><div><b>${C.round(tot.p, 1)} g</b><span>protein</span></div><div><b>${C.round(tot.c, 1)} g</b><span>carbs</span></div><div><b>${C.round(tot.f, 1)} g</b><span>fat</span></div><div><b>${na ? nfm(na.v * it.g / 100) + ' mg' : '—'}</b><span>sodium</span></div></div></div>` : ''}
  ${mb.edit ? '' : `<label class="setup-r"><span>Where</span><select class="in" id="mb-where"><option value="extra" ${mb.where === 'extra' ? 'selected' : ''}>Extra meal</option>${plan.map(m => `<option value="${esc(m.id)}" ${mb.where === m.id ? 'selected' : ''}>Instead of ${esc(m.name)}${m.time ? ' · ' + esc(m.time) : ''}</option>`).join('')}</select></label>`}
  ${!mb.edit || mb.where === 'extra' ? `<span class="sub">Counts as</span><div class="seg wide" role="group" aria-label="Counts as"><button class="clean" data-act="mbcount" data-v="ok" aria-pressed="${mb.counts === 'ok'}">Allowed by plan</button><button class="off" data-act="mbcount" data-v="off" aria-pressed="${mb.counts === 'off'}">Off-plan</button>${cheatOn ? `<button class="cheat" data-act="mbcount" data-v="cheat" aria-pressed="${mb.counts === 'cheat'}" ${left || mb.counts === 'cheat' ? '' : 'disabled'}>🍕 Free cheat meal</button>` : ''}</div>
  ${cheatOn ? `<p class="hint">${left ? (left === 1 ? '1 free cheat meal left this week.' : `${left} free cheat meals left this week.`) + ' The day still counts.' : 'No free cheat meal left this week.'}</p>` : ''}
  ${mb.counts === 'off' ? '<p class="hint">Off-plan means today won’t count.</p>' : ''}` : ''}
  ${mb.edit ? '' : `<label class="chk"><input type="checkbox" id="mb-save" ${mb.save ? 'checked' : ''}> Save to my usuals</label>`}
  <div class="row"><button class="btn primary grow" data-act="mbsave" ${mb.items.length ? '' : 'disabled'}>${mb.edit ? 'Save changes' : `Add ${esc((mb.name || 'meal').trim().toLowerCase() || 'meal')}`}</button><button class="btn ghost" data-act="mbcancel">Cancel</button></div></div>`;
}
function drawRecipe() {
  const r = SH.recipe, sumG = r.items.reduce((s, it) => s + (it.g || 0), 0), tot = C.sumItems(r.items), W = r.total || sumG;
  const per = W ? { k: tot.k / W * 100, p: tot.p / W * 100 } : { k: 0, p: 0 };
  $('fs-body').innerHTML = `<div class="picked"><b>New recipe</b><p class="hint">Add every ingredient with the amount that went into the pot, then weigh the finished dish. You can then log any portion of it in grams.</p>
  <label class="full-note">Recipe name<input class="in" id="rc-n" maxlength="60" placeholder="e.g. Mom’s molokhia" value="${esc(r.name)}"></label>
  <div class="items">${r.items.length ? r.items.map((it, i) => { const m = C.itemMacros(it); return `<div class="itm"><div class="nm">${esc(it.name)}<small>${kc(m.k)} kcal · ${C.round(m.p, 1)} g protein</small></div><label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(it.g, 1)}" data-rcg="${i}" aria-label="${esc(it.name)} grams">g</label><button class="x" data-act="rcrm" data-v="${i}" aria-label="Remove ${esc(it.name)}">×</button></div>`; }).join('') : '<p class="hint">No ingredients yet.</p>'}
  <button class="btn small" data-act="rcadd">+ Add ingredient</button></div>
  <div class="form"><label>Finished dish weight (g)<input class="in" id="rc-w" type="number" inputmode="decimal" placeholder="${sumG ? C.round(sumG) : 'weigh the pot'}" value="${r.total || ''}"></label><label>Servings (optional)<input class="in" id="rc-s" type="number" inputmode="numeric" min="1" placeholder="e.g. 4" value="${r.serv || ''}"></label></div>
  <p class="hint num" id="rc-sum">${r.items.length ? `Whole dish ${kc(tot.k)} kcal · ${kc(tot.p)} g protein · per 100 g: ${kc(per.k)} kcal, ${C.round(per.p, 1)} g protein` : ''}</p>
  <div class="row"><button class="btn primary grow" data-act="rcsave">Save recipe</button><button class="btn ghost" data-act="rccancel">Cancel</button></div></div>`;
}
/* add a food from its label: per 100 g or per serving, sodium or salt, your own servings, a typo check, optional camera reading */
const CF_FIELDS = [['k', 'Calories', 'kcal'], ['p', 'Protein', 'g'], ['c', 'Carbs', 'g'], ['f', 'Fat', 'g'], ['na', 'Sodium', 'mg'], ['salt', 'or Salt', 'g'], ['sug', 'Sugar', 'g'], ['sat', 'Saturated fat', 'g'], ['fib', 'Fiber', 'g'], ['pot', 'Potassium', 'mg'], ['ca', 'Calcium', 'mg']];
function cfRead() {
  const c = SH.cf; if (!c || !$('cf-n')) return c;
  const val = id => { const e = $(id); return e ? e.value : ''; };
  c.name = val('cf-n'); c.brand = val('cf-b'); c.ss = val('cf-ss'); c.drink = !!($('cf-drink') && $('cf-drink').checked); c.share = !!($('cf-share') && $('cf-share').checked);
  CF_FIELDS.forEach(([k]) => { c.v[k] = val('cf-' + k); });
  c.sv = c.sv.map((x, i) => ({ n: val(`cf-svn-${i}`), g: val(`cf-svg-${i}`) }));
  return c;
}
function customForm(code) {
  if (!SH.cf) SH.cf = { mode: 'g100', v: {}, sv: [{ n: '', g: '' }], name: '', brand: '', ss: '', drink: false, share: false, warned: false, code: code || null };
  const c = SH.cf, inGroup = !!(S.settings && S.settings.group), fld = ([k, l, u]) => `<label class="fld${'kpcf'.includes(k) ? ' req' : ''}">${l} (${u})<input class="in" id="cf-${k}" type="number" inputmode="decimal" step="any" value="${esc(c.v[k] || '')}"></label>`;
  $('fs-body').innerHTML = `<div class="picked lform"><b>Add from a label</b><p class="hint">Copy the numbers from the pack, or photograph the nutrition table and check what it reads.</p>
  <div class="row"><label class="btn small photo">📷 Read the label<input type="file" accept="image/*" capture="environment" id="cf-photo" hidden></label><span class="hint" id="cf-ocr" aria-live="polite">${esc(c.ocrMsg || '')}</span></div>
  <div class="seg wide" role="group" aria-label="Values are"><button data-act="cfmode" data-v="g100" aria-pressed="${c.mode === 'g100'}">Per 100 g</button><button data-act="cfmode" data-v="serv" aria-pressed="${c.mode === 'serv'}">Per serving</button></div>
  <div class="form"><label class="full">Name<input class="in" id="cf-n" maxlength="50" value="${esc(c.name)}" placeholder="e.g. Greek yogurt, plain"></label><label class="full">Brand (optional)<input class="in" id="cf-b" maxlength="30" value="${esc(c.brand)}" placeholder="e.g. Juhayna"></label>
  ${c.mode === 'serv' ? `<label class="full">One serving is (g or ml)<input class="in" id="cf-ss" type="number" inputmode="decimal" step="any" value="${esc(c.ss)}" placeholder="e.g. 70"></label>` : ''}
  ${CF_FIELDS.slice(0, 9).map(fld).join('')}</div>
  <details${c.v.pot || c.v.ca ? ' open' : ''}><summary class="hint">Potassium and calcium (optional)</summary><div class="form">${CF_FIELDS.slice(9).map(fld).join('')}</div></details>
  <span class="sub">Servings (optional)</span><div class="svs">${c.sv.map((x, i) => `<div class="svr"><input class="in" id="cf-svn-${i}" maxlength="20" placeholder="pack, bar, cup…" value="${esc(x.n)}" aria-label="Serving name"><input class="in sm" id="cf-svg-${i}" type="number" inputmode="decimal" step="any" placeholder="g" value="${esc(x.g)}" aria-label="Serving grams"><button class="x" data-act="cfrmsv" data-v="${i}" aria-label="Remove serving">×</button></div>`).join('')}</div>
  ${c.sv.length < 4 ? '<button class="link" data-act="cfaddsv">+ Add serving</button>' : ''}
  <label class="chk"><input type="checkbox" id="cf-drink" ${c.drink ? 'checked' : ''}> It’s a drink (counts toward water)</label>
  ${inGroup ? `<label class="chk"><input type="checkbox" id="cf-share" ${c.share ? 'checked' : ''}> Share with my friends group</label>` : ''}
  <div id="cf-warn">${c.warnTxt ? `<p class="warnbox">${esc(c.warnTxt)}</p>` : ''}</div>
  <div class="row"><button class="btn primary grow" data-act="cfsave">${c.warned ? 'Save anyway' : 'Save and use'}</button><button class="btn ghost" data-act="cfcancel">Cancel</button></div></div>`;
  const na = $('cf-na'), sa = $('cf-salt');
  if (na && sa) {
    na.addEventListener('input', () => { const x = parseFloat(na.value); sa.value = isFinite(x) ? C.round(C.saltFromNa(x), 2) : ''; });
    sa.addEventListener('input', () => { const x = parseFloat(sa.value); na.value = isFinite(x) ? Math.round(C.naFromSalt(x)) : ''; });
  }
  const ph = $('cf-photo'); if (ph) ph.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) ocrLabel(f); });
}
function cfSave() {
  const c = cfRead(), name = (c.name || '').trim(); if (!name) return toast('Give the food a name.');
  const num = k => { const x = parseFloat(c.v[k]); return isFinite(x) ? x : null; };
  let fac = 1, ss = null;
  if (c.mode === 'serv') { ss = parseFloat(c.ss); if (!(ss > 0)) return toast('Enter how many grams one serving is.'); fac = 100 / ss; }
  if (num('k') == null) return toast('Enter the calories.');
  const per = {}; ['k', 'p', 'c', 'f'].forEach(k => per[k] = (num(k) || 0) * fac);
  const na = num('na') != null ? num('na') : num('salt') != null ? C.naFromSalt(num('salt')) : null; if (na != null) per.na = na * fac;
  ['sug', 'sat', 'fib', 'pot', 'ca'].forEach(k => { if (num(k) != null) per[k] = num(k) * fac; });
  const ck = C.checkPer(per);
  if (ck.level !== 'ok' && !c.warned) { c.warned = true; c.warnTxt = `⚠ ${C.round(num('k'), 1)} kcal doesn’t match protein, carbs and fat (about ${C.round(ck.calc / fac, 0)}). Check the label for a typo, or save anyway.`; return customForm(); }
  const sv = c.sv.map(x => [String(x.n || '').trim(), parseFloat(x.g)]).filter(x => x[0] && x[1] > 0);
  if (ss && !sv.some(x => Math.abs(x[1] - ss) < 0.5)) sv.unshift(['serving', ss]);
  const brand = (c.brand || '').trim(), full = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
  const f = { id: 'c' + Date.now().toString(36), name: full.slice(0, 60), ...(brand ? { brand } : {}), ...(c.code ? { code: c.code } : {}), per: C.cleanPer(Object.fromEntries(Object.entries(per).map(([k, x]) => [k, C.round(x, 2)]))), units: sv, src: 'custom', drink: !!c.drink, ...(c.share ? { shared: true } : {}) };
  saveFood(f); SH.cf = null; toast(f.shared ? 'Saved and shared with your group.' : 'Saved to your foods.');
  pickFood(f);
}
let OCR_LOAD = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function ocrLabel(file) {
  cfRead(); const msg = t => { SH.cf.ocrMsg = t; const e = $('cf-ocr'); if (e) e.textContent = t; };
  if (!navigator.onLine && !window.Tesseract) return msg('Reading labels needs internet the first time.');
  try {
    msg('Getting the label reader ready (about 15 MB the first time)…');
    if (!window.Tesseract) OCR_LOAD = OCR_LOAD || loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    await OCR_LOAD;
    msg('Reading the label…');
    const { data } = await window.Tesseract.recognize(file, 'eng+ara');
    const r = C.parseLabel(data && data.text);
    const got = Object.keys(r.vals);
    if (!got.length) return msg('Couldn’t read numbers from that photo. Try closer, flat and in good light, or type them.');
    got.forEach(k => { SH.cf.v[k] = String(r.vals[k]); });
    if (r.vals.na != null && r.vals.salt == null) SH.cf.v.salt = String(C.round(C.saltFromNa(r.vals.na), 2));
    if (r.vals.salt != null && r.vals.na == null) SH.cf.v.na = String(Math.round(C.naFromSalt(r.vals.salt)));
    SH.cf.mode = r.per100 || !r.serv ? 'g100' : 'serv'; if (r.serv) SH.cf.ss = String(r.serv);
    if (r.serv && !SH.cf.sv.some(x => x.g)) SH.cf.sv = [{ n: 'serving', g: String(r.serv) }];
    SH.cf.ocrMsg = `Read ${got.length} values. Check each one against the pack before saving.`; SH.cf.warned = false; SH.cf.warnTxt = '';
    customForm();
  } catch (e) { console.warn('ocr', e); msg('The label reader couldn’t start. Check your connection, or type the numbers.'); }
}

function addItemTo(scope, item) {
  const [kind, id] = scope.split(':');
  if (kind === 'plan') { const m = planMeals().find(x => x.id === id); m.items.push(item); savePlan(); }
  else if (kind === 'meal') { const d = dayDoc(editDate()); const md = d.meals[id] || (d.meals[id] = { status: 'swap', items: [] }); md.items = md.items || []; md.items.push(item); saveDay(editDate()); }
  else if (kind === 'extra') { const d = dayDoc(editDate()); d.extras.push(item); saveDay(editDate()); }
}
function itemList(scope) {
  const [kind, id] = scope.split(':');
  if (kind === 'plan') return planMeals().find(x => x.id === id).items;
  if (kind === 'meal') return dayDoc(editDate()).meals[id].items;
  return dayDoc(editDate()).extras;
}
function saveScope(scope) { scope.startsWith('plan') ? savePlan() : saveDay(editDate()); }

/* ---------- timers ---------- */
let TM = null, audio;
function beep(n = 2) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); for (let i = 0; i < n; i++) { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination); const t0 = audio.currentTime + i * 0.3; g.gain.setValueAtTime(0.25, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25); o.start(t0); o.stop(t0 + 0.26); } } catch (e) { }
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { }
}
function openTimer(mode, sec, ex) {
  TM = { mode, sec, ex, start: Date.now(), hit: false, iv: null };
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { }
  const e = ex && EX.find(x => x.id === ex);
  $('timer').hidden = false;
  $('timer').innerHTML = `<span class="l">${mode === 'hold' ? esc(e.name) + ' · target ' + sec + ' s' : 'Rest'}</span><div class="t num" id="tm-t">${mode === 'hold' ? 0 : sec}</div><span class="l" id="tm-s">${mode === 'hold' ? 'Hold. Tap stop when you drop.' : 'Next set when it hits zero'}</span>
  <button class="btn ${mode === 'hold' ? 'good' : 'primary'}" data-act="tmstop">${mode === 'hold' ? 'Stop and log' : 'Skip rest'}</button><button class="btn ghost" data-act="tmcancel" style="color:var(--hdr-fg)">Cancel</button>`;
  TM.iv = setInterval(tick, 200);
}
function tick() {
  if (!TM) return;
  const el = (Date.now() - TM.start) / 1000, t = $('tm-t');
  if (TM.mode === 'hold') { t.textContent = Math.floor(el); if (!TM.hit && el >= TM.sec) { TM.hit = true; t.classList.add('hit'); $('tm-s').textContent = 'Target hit. Keep going or stop.'; beep(2); } }
  else { const left = Math.max(0, Math.ceil(TM.sec - el)); t.textContent = left; if (left === 0 && !TM.hit) { TM.hit = true; beep(3); setTimeout(closeTimer, 1500); } }
}
function closeTimer(log) {
  if (!TM) return;
  if (log && TM.mode === 'hold') {
    const secs = Math.floor((Date.now() - TM.start) / 1000), date = editDate(), d = dayDoc(date), e = EX.find(x => x.id === TM.ex);
    const a = Array.isArray(d.cali[e.id]) ? d.cali[e.id] : []; while (a.length < e.sets) a.push(0);
    let i = a.findIndex(v => !v); if (i < 0) { a.push(0); i = a.length - 1; }
    const prev = bestOf(e.id); a[i] = secs; d.cali[e.id] = a; saveDay(date);
    toast(secs > prev && prev ? `New best: ${secs} s` : `Logged ${secs} s in set ${i + 1}`);
  }
  clearInterval(TM.iv); TM = null; $('timer').hidden = true; $('timer').innerHTML = ''; draw();
}

/* ---------- events ---------- */
document.addEventListener('click', ev => { if (ev.target && ev.target.id === 'panel') { S.panel = null; draw(); } else if (ev.target && ev.target.id === 'sheet' && SH && SH.scope !== 'crave') closeSheet(); });
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.tagName === 'BUTTON') buzz(8);
  const act = b.dataset.act, v = b.dataset.v, D = editDate();
  if (act.startsWith('tr-')) return TR.act(act, v, b);
  if (act.startsWith('ca-')) return TR.caliAct(act, v);
  if (act.startsWith('rk-')) return TR.rankAct(act, v);
  switch (act) {
    case 'signin': return signin();
    case 'signup': return emailAuth(true);
    case 'resetpw': { const em = ($('si-email') && $('si-email').value || '').trim(); if (!em) return toast('Type your email above first.'); try { await sendPasswordResetEmail(auth, em); toast('Reset link sent. Check your email.'); } catch (e) { toast(AUTH_MSG[e && e.code] || 'Couldn’t send the reset email.'); } return; }
    case 'signout': S.unsub.forEach(u => u()); S.unsub = []; S.photosOn = false; S.photos = {}; if (S.boardUnsub) S.boardUnsub(); S.boardUnsub = null; S.boardCode = null; S.board = {}; S.boardLast = null; await signOut(auth); return;
    case 'tab': return go(v);
    case 'jump': { if (v.startsWith('sec-') && S.view === 'today') { S.panel = v.slice(4); return draw(); } const el = $(v); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
    case 'start': {
      const num = id => parseFloat($(id).value) || null;
      const sd = $('w-start').value || today();
      S.settings = newSettings({ startDate: sd > today() ? today() : sd, waterGoal: +$('w-water').value, startWeight: num('w-weight'), goalWeight: num('w-goal') });
      saveSettings(); toast('Day 1 starts now.'); return draw();
    }
  }
  if (act === 'lang') { const was = LANG(); try { localStorage.setItem('lk-lang', v); } catch (e) { } if (S.settings) { S.settings.lang = v; saveSettings(); } if (was === 'ar' && v !== 'ar') { setTimeout(() => location.reload(), 500); return; } applyLang(); return draw(); }
  if (act === 'panel') { S.panel = v; buzz(6); return draw(); }
  if (act === 'panelclose') { S.panel = null; return draw(); }
  if (act === 'ptab') { S.ptab = v; S.panel = null; if (S.view !== 'progress') return go('progress'); window.scrollTo(0, 0); return draw(); }
  if (act === 'mesec') { S.meSec = v || null; window.scrollTo(0, 0); return draw(); }
  if (act === 'closesheet') return closeSheet();
  if (act === 'ftab') { S.ftab = v; return draw(); }
  if (act === 'fstr') { S.fstr = v; return draw(); }
  if (act === 'lghelp') return leagueHelp();
  if (act === 'rankvis') { S.settings.hideRank = v === '0'; saveSettings(); S.boardLast = null; return draw(); }
  if (act === 'showkg') { S.settings.showKg = v === '1'; saveSettings(); S.boardLast = null; return draw(); }
  if (act === 'monthrep') return shareMonthImage(v);
  if (act === 'startover') return openStartOver();
  if (act.startsWith('so-')) return startOverAct(act, v, b);
  if (act === 'pushon') return pushOn();
  if (act === 'pushoff') return pushOff();
  if (act === 'pushtest') return pushTest();
  if (act === 'daynav' && SH && SH.scope === 'day') { SH.date = v; return drawDay(); }
  if (SH && SH.scope === 'sport') {
    if (act === 'sppick') { SH.sp = v; return drawSport(); }
    if (act === 'spmin') { SH.min = +v; return drawSport(); }
    if (act === 'splvl') { SH.lvl = +v; return drawSport(); }
    if (act === 'spsave') {
      const date = editDate(), dd = dayDoc(date), kg = curWeight(date) || 80, s = SH;
      if (!(s.min > 0)) return toast('Enter how many minutes you played.');
      const rec = { sport: s.sp, min: s.min, lvl: s.lvl, ...(s.hr ? { hr: s.hr } : {}), kcal: Math.round(C.sportKcal({ sport: s.sp, min: s.min, lvl: s.lvl, hr: s.hr }, kg, prof())), counts: !!(s.counts && s.canCount), at: `${C.pad(now().clock)}:${C.pad(now().minute)}` };
      dd.sports = [...(dd.sports || []), rec];
      if (rec.counts) { dd.trainingDone = true; dd.trainingSource = 'sport'; }
      S.settings.lastSport = s.sp; saveSettings(); saveDay(date); closeSheet(); buzz([20, 40, 60]);
      toast(`${C.sportById(s.sp).name} logged: ${s.min} min, about ${rec.kcal} kcal`); return draw();
    }
  }
  if (SH && SH.scope === 'crave') {
    if (act === 'crwhat') { SH.what = v; return drawCrave(); }
    if (act === 'crlvl') { SH.lvl = +v; return drawCrave(); }
    if (act === 'crstart') { SH.step = 'wait'; SH.start = Date.now(); return drawCrave(); }
    if (act === 'crwater') { const date = editDate(), dd = dayDoc(date); dd.water = Math.min(12000, (dd.water || 0) + 500); saveDay(date); toast(`+500 ml · ${L(C.waterTotal(dd))} L today`); return; }
    if (act === 'crend') { cravingLog(v); const ate = v === 'ate'; closeSheet(); if (ate) { toast('Okay. Log it honestly so the day stays accurate.'); return openSheet('extra'); } buzz([20, 40, 80]); toast('Craving beaten. That’s a real win.'); return draw(); }
  }
  if (SH && SH.scope === 'focus' && act === 'focusset') { const fw = focusWeek(); S.settings.focus = { ...(S.settings.focus || {}), [fw.key]: { id: v } }; saveSettings(); closeSheet(); toast('Focus set for this week.'); return draw(); }
  if (SH && SH.scope === 'quick') {
    if (act === 'qwater') { const date = editDate(), dd = dayDoc(date); dd.water = Math.max(0, Math.min(12000, (dd.water || 0) + +v)); saveDay(date); closeSheet(); toast(`+${+v >= 1000 ? '1 L' : v + ' ml'} · ${L(C.waterTotal(dd))} L today`); return draw(); }
    if (act === 'qsport') return openSport();
    if (act === 'qcrave') return openCrave();
    if (act === 'qextra') { closeSheet(); return openSheet('extra'); }
    if (act === 'qtab') { closeSheet(); return go(v); }
    if (act === 'qstam') { closeSheet(); S.trainTab = 'stamina'; return go('train'); }
    if (act === 'qfocus') { closeSheet(); if (S.view !== 'today') go('today'); setTimeout(() => { const el = $(v); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 80); return; }
  }
  if (act === 'plancopy') return openPlanCopy(v);
  if (act === 'coachrestore') return restoreCoach();
  if (act === 'planrestore') { const src = (S.settings.planLog || {})[v]; if (!planHasFood(src)) return; if (planHasFood(S.settings.meals) && !confirm('Replace your current meal plan with this one?')) return; S.settings.meals = clone(src); S.settings.planNoted = true; savePlan(); toast(`Meal plan restored from ${fmt(v)}.`); return draw(); }
  if (act === 'plancopymode' && SH && SH.scope === 'plancopy') { SH.mode = v; return drawPlanCopy(); }
  if (act === 'plancopypick' && SH && SH.scope === 'plancopy') {
    const src = SH.list[+v], m = planMeals().find(x => x.id === SH.mealId); if (!src || !m) return;
    const items = clone(src.items).map(x => { const y = { ...x }; delete y.done; return y; });
    const add = SH.mode === 'add' && (m.items || []).length; m.items = add ? [...(m.items || []), ...items] : items; savePlan();
    closeSheet(); toast(`${add ? 'Added to' : 'Filled'} ${m.name} from ${src.name.split(' · ')[0]}. Edit grams any time.`); return draw();
  }
  if (act === 'copypick' && SH && SH.scope === 'copy') {
    const src = SH.list[+v], id = SH.mealId, date = editDate(), dd = dayDoc(date);
    dd.meals[id] = { status: src.status, items: clone(src.items), note: '' }; saveDay(date);
    S.openMeal = id; S.expandMeal = null; closeSheet(); toast(`Copied ${src.name} from ${fmt(src.date)}`); return draw();
  }
  if (act === 'usda') return usdaSearch();
  if (act === 'offsearch') return offSearch();
  if (act === 'addin') { const a = ADDINS.find(x => x.k === v); SH.add = SH.add || {}; if (SH.add[v]) delete SH.add[v]; else SH.add[v] = { n: a.def, ...(a.k === 'milk' ? { fid: (S.settings.lastMilk) || 'milk_full' } : {}) }; return drawPicked(); }
  if (act === 'addinq' || act === 'addinset') { const [k, x] = v.split(':'), a = ADDINS.find(z => z.k === k), cur = SH.add[k]; if (!cur) return; cur.n = act === 'addinset' ? +x : Math.max(a.step, C.round(cur.n + (+x) * a.step, 2)); return drawPicked(); }
  if (act === 'fatk' || act === 'fatq' || act === 'fatn' || act === 'tspedit') {
    if (act === 'fatk') SH.fat = v ? { k: v, n: (SH.fat && SH.fat.k && (v === 'spray') === (SH.fat.k === 'spray') ? SH.fat.n : 1) } : null;
    else if (act === 'fatn' && SH.fat) SH.fat.n = +v;
    else if (act === 'fatq' && SH.fat) { const st = SH.fat.k === 'spray' ? 1 : 0.5; SH.fat.n = Math.max(st, SH.fat.n + (+v) * st); }
    else if (act === 'tspedit') SH.tspEdit = !SH.tspEdit;
    return SH.fatSheet ? drawFatSheet() : drawPicked();
  }
  if (act === 'usual') { const u = (S.settings.usuals || [])[+v]; if (!u) return; const item = { ...clone(u.item) }; if (SH.scope === 'extra') item.off = !!u.off; else delete item.off; addItemTo(SH.scope, item); closeSheet(); toast(`Added ${u.name}.`); return draw(); }
  if (act === 'fatsave') { const items = itemList(SH.scope); if (!items) return closeSheet(); const i = items.findIndex(x => x.fat && !x.parts), p = fatPart(SH.fat); if (!p) return; const F = FATS.find(x => x.k === SH.fat.k), it = { ...p, name: `${F.label} (cooking)` }; delete it.add; if (i >= 0) items[i] = it; else items.push(it); saveScope(SH.scope); closeSheet(); toast(`${F.label} added: +${kc(p.per.k * p.g / 100)} kcal.`); return draw(); }
  if (act === 'fatrm') { const items = itemList(SH.scope); const i = items ? items.findIndex(x => x.fat && !x.parts) : -1; if (i >= 0) { items.splice(i, 1); saveScope(SH.scope); } closeSheet(); return draw(); }
  if (act === 'usualedit') { SH.usualEdit = !SH.usualEdit; return sheetSearch(); }
  if (act === 'usualrm') { S.settings.usuals = (S.settings.usuals || []).filter((_, i) => i !== +v); saveSettings(); return sheetSearch(); }
  if (act === 'ffilt') { SH.filt = v; return sheetSearch(); }
  if (act === 'uq') { const q = SH.q || 1, st = +v; SH.q = st > 0 ? (q < 1 ? q + 0.25 : q + 0.5) : (q <= 1 ? Math.max(0.25, q - 0.25) : q - 0.5); return drawPicked(); }
  if (act === 'uunit') { const i = +v, us = unitsOf(SH.picked); if (i >= 0 && us[i]) { SH.u = i; SH.q = 1; } else { SH.u = -1; } return drawPicked(); }
  if (act === 'cfmode') { cfRead(); SH.cf.mode = v; SH.cf.warned = false; SH.cf.warnTxt = ''; return customForm(); }
  if (act === 'cfaddsv') { cfRead(); SH.cf.sv.push({ n: '', g: '' }); return customForm(); }
  if (act === 'cfrmsv') { cfRead(); SH.cf.sv.splice(+v, 1); if (!SH.cf.sv.length) SH.cf.sv.push({ n: '', g: '' }); return customForm(); }
  if (act === 'cfcancel') { SH.cf = null; return sheetSearch(); }
  if (act === 'sharefood') { const f = S.foods[SH.picked.id]; if (!f) return; f.shared = !f.shared; saveFood(f); SH.picked = { ...SH.picked, shared: f.shared }; toast(f.shared ? 'Your group can now use this food.' : 'No longer shared.'); return drawPicked(); }
  if (act === 'scan') return startScan();
  if (act === 'codego') { const c = ($('fs-code').value || '').trim(); if (c) lookupBarcode(c); return; }
  if (act === 'custom') { SH.cf = null; SH.picked = null; return customForm(v || null); }
  if (act === 'mealbuild') { SH.mb = { name: '', items: [], where: SH.scope === 'extra' || !/^meal:/.test(SH.scope) ? 'extra' : SH.scope.slice(5), counts: 'ok', save: false }; SH.mbAdd = false; SH.picked = null; $('fs-q').value = ''; return drawMealBuild(); }
  if (act === 'mbadd') { mbRead(); SH.mbAdd = true; SH.picked = null; $('fs-q').value = ''; sheetSearch(); $('fs-q').focus(); return; }
  if (act === 'mbback') { SH.mbAdd = false; SH.picked = null; $('fs-q').value = ''; return drawMealBuild(); }
  if (act === 'mbrm') { mbRead(); SH.mb.items.splice(+v, 1); return drawMealBuild(); }
  if (act === 'mbwhere') { mbRead(); SH.mb.where = v; return drawMealBuild(); }
  if (act === 'mbcount') { mbRead(); SH.mb.counts = v; return drawMealBuild(); }
  if (act === 'mbcancel') { if (SH.mb && SH.mb.edit) return closeSheet(); SH.mb = null; SH.mbAdd = false; $('fs-q').value = ''; return sheetSearch(); }
  if (act === 'mbsave') {
    const mb = mbRead(); if (!mb.items.length) return;
    if (!(mb.name || '').trim()) mb.name = mb.items.map(x => x.name.split(',')[0].split(' + ')[0]).slice(0, 2).join(' + ');
    const item = mbItem(mb), D = editDate(), dd = S.days[D] = S.days[D] || { date: D };
    if (mb.counts === 'cheat') item.cheat = true;
    if (mb.edit) { const list = itemList(mb.edit.scope); if (list && list[mb.edit.i]) { const old = list[mb.edit.i]; list[mb.edit.i] = { ...item, ...(old.off ? { off: true } : {}), ...(old.cheat ? { cheat: true } : {}), ...(mb.edit.scope === 'extra' ? { off: mb.counts === 'off', cheat: mb.counts === 'cheat' } : {}) }; saveScope(mb.edit.scope); } closeSheet(); toast('Meal updated.'); return draw(); }
    if (mb.save) { S.settings.usuals = [{ id: 'u' + Date.now().toString(36), name: item.name, item: clone(item), off: mb.counts === 'off' }, ...(S.settings.usuals || []).filter(x => x.name !== item.name)].slice(0, 8); delete S.settings.usuals[0].item.cheat; saveSettings(); }
    if (mb.where === 'extra') { addItemTo('extra', { ...item, off: mb.counts === 'off' }); }
    else { dd.meals = dd.meals || {}; const cur = dd.meals[mb.where] || {}; dd.meals[mb.where] = { status: mb.counts === 'cheat' ? 'cheat' : mb.counts === 'off' ? 'off' : 'swap', items: [item], note: cur.note || '' }; delete item.cheat; if (dd.skip) delete dd.skip[mb.where]; saveDay(D); }
    closeSheet(); toast(mb.counts === 'cheat' ? 'Added as your free cheat meal. The day still counts.' : `Added ${item.name}.`); return draw();
  }
  if (act === 'recipe') { SH.recipe = { name: '', items: [], total: null, serv: null }; SH.recipeAdd = false; SH.picked = null; $('fs-q').value = ''; return drawRecipe(); }
  if (act === 'rcadd') { SH.recipeAdd = true; SH.picked = null; $('fs-q').value = ''; sheetSearch(); $('fs-q').focus(); return; }
  if (act === 'rcback') { SH.recipeAdd = false; SH.picked = null; $('fs-q').value = ''; return drawRecipe(); }
  if (act === 'rccancel') { SH.recipe = null; SH.recipeAdd = false; $('fs-q').value = ''; return sheetSearch(); }
  if (act === 'rcrm') { SH.recipe.items.splice(+v, 1); return drawRecipe(); }
  if (act === 'rcsave') {
    const r = SH.recipe, name = (r.name || '').trim();
    if (!name) return toast('Give the recipe a name.');
    if (!r.items.length) return toast('Add at least one ingredient.');
    const sumG = r.items.reduce((s, it) => s + (it.g || 0), 0), W = r.total || sumG, tot = C.sumItems(r.items);
    if (!W) return toast('Enter the finished dish weight.');
    const units = []; if (r.serv > 1) units.push(['serving', C.round(W / r.serv)]); units.push(['whole dish', C.round(W)]);
    const per = { k: tot.k / W * 100, p: tot.p / W * 100, c: tot.c / W * 100, f: tot.f / W * 100 };
    C.MICROS.forEach(({ k }) => { let sum = 0, ok = true; r.items.forEach(it => { const m = microOf(it, k); if (m) sum += m.v * (it.g || 0) / 100; else if ((it.per.k || 0) > 5) ok = false; }); if (ok) per[k] = C.round(sum / W * 100, 2); });
    const f = { id: 'c' + Date.now().toString(36), name: name.slice(0, 60), per, units, src: 'custom', recipe: r.items.map(it => ({ name: it.name, g: it.g })), drink: false };
    saveFood(f);
    SH.recipe = null; SH.recipeAdd = false; toast('Recipe saved to your foods.'); return pickFood(f);
  }
  if (act === 'cfsave') return cfSave();
  if (act === 'pick') { const [src, i] = v.split(':'), f = (src === 'usda' ? SH.usda : src === 'off' ? SH.offr : SH.results)[+i]; if (f) pickFood(f); return; }
  if (act === 'unpick') { SH.picked = null; return sheetSearch(); }
  if (act === 'fav') {
    const f = SH.picked, list = favs().filter(x => x.id !== f.id);
    if (!isFav(f)) list.unshift({ id: f.id, name: f.name, per: { ...f.per }, units: unitsOf(f), drink: !!SH.drink, src: f.src || 'lib', ...(f.ar ? { ar: f.ar } : {}), ...(f.brand ? { brand: f.brand } : {}), ...(f.like ? { like: f.like } : {}), ...(f.chk ? { chk: f.chk } : {}) });
    S.settings.favFoods = list.slice(0, 30); saveSettings(); toast(isFav(f) ? 'Added to favourites' : 'Removed from favourites'); return drawPicked();
  }
  if (act === 'extraoff') { SH.off = v === '1'; return drawPicked(); }
  if (act === 'savefood') { const { sec, fav, recent, lastG, lastSu, lastSq, by, ...b } = SH.picked; const f = { ...b, units: unitsOf(b), drink: !!SH.drink, id: 'c' + Date.now().toString(36), src: 'custom', from: b.src }; delete f.shared; saveFood(f); SH.picked = { ...f }; toast('Saved to your foods.'); return drawPicked(); }
  if (act === 'addpicked' && SH.mb && SH.mbAdd) {
    const item = pickedItem(); if (!(item.g > 0)) return toast('Enter an amount first.');
    SH.mb.items.push(item); SH.picked = null; SH.mbAdd = false; $('fs-q').value = ''; return drawMealBuild();
  }
  if (act === 'addpicked' && SH.recipe && SH.recipeAdd) {
    const f = SH.picked; SH.recipe.items.push({ fid: f.id, name: f.name, g: C.round(SH.g, 1), per: { ...f.per }, ...(f.like ? { like: f.like } : {}) });
    SH.picked = null; SH.recipeAdd = false; $('fs-q').value = ''; return drawRecipe();
  }
  if (act === 'addpicked') {
    const f = SH.picked, item = pickedItem();
    if (!(item.g > 0)) return toast('Enter an amount first.');
    if (SH.saveUsual) { const nm = (($('fs-usual-n') || {}).value || SH.usualName || f.name).trim().slice(0, 24); S.settings.usuals = [{ id: 'u' + Date.now().toString(36), name: nm, item: clone(item), ...(SH.scope === 'extra' ? { off: !!SH.off } : {}) }, ...(S.settings.usuals || []).filter(x => x.name !== nm)].slice(0, 8); saveSettings(); }
    if (canCook(f)) { const ff = { ...((S.settings.fatFor) || {}) }; if (SH.remFat && SH.fat && SH.fat.k) ff[f.id] = { k: SH.fat.k, n: SH.fat.n }; else if (!SH.remFat) delete ff[f.id]; if (JSON.stringify(ff) !== JSON.stringify(S.settings.fatFor || {})) { S.settings.fatFor = ff; saveSettings(); } }
    if (SH.scope === 'extra') item.off = SH.off;
    addItemTo(SH.scope, item); closeSheet(); toast(`Added ${f.name.split(',')[0]}`); return draw();
  }
  if (act === 'cgclose') return camClose();
  if (act === 'cgflip' && CAM) { CAM.facing = CAM.facing === 'user' ? 'environment' : 'user'; return camStart(); }
  if (act === 'cgtimer' && CAM) { CAM.timer = CAM.timer === 5 ? 10 : CAM.timer === 10 ? 0 : 5; b.textContent = CAM.timer ? `Timer: ${CAM.timer} s` : 'Timer: off'; return; }
  if (act === 'cgshot' && CAM) return camShoot();
  if (act === 'tmstop') return closeTimer(true);
  if (act === 'tmcancel') return closeTimer(false);
  if (!S.settings) return;
  const d = () => dayDoc(D);
  switch (act) {
    case 'editdate': S.editDate = v; break;
    case 'meal': {
      const id = b.dataset.id, dd = d(), m = C.mealsOn(S.settings, D).find(x => x.id === id), cur = dd.meals[id] || {};
      if (cur.status === v) { delete dd.meals[id]; S.openMeal = null; }
      else if (v === 'plan') { dd.meals[id] = { status: 'plan', items: trimmedItems(m, trimsFor(D)), note: cur.note || '' }; S.openMeal = null; S.expandMeal = null; }
      else if (v === 'swap') { dd.meals[id] = { status: 'swap', items: cur.items && cur.items.length ? cur.items : clone(m.items), note: cur.note || '' }; S.openMeal = id; }
      else if (v === 'cheat') { const st = S.settings, cu = C.cheatsUsed(st, S.days, D, D), mine = Object.entries(dd.meals).filter(([k, x]) => k !== id && x && x.status === 'cheat').length; if (!(st.cheat && st.cheat.on) || cu.used + mine >= cu.max) { toast('No free cheat meal left this week.'); break; } dd.meals[id] = { status: 'cheat', items: cur.items || [], note: cur.note || '' }; S.openMeal = id; toast('Free cheat meal. The day still counts.'); }
      else { dd.meals[id] = { status: 'off', items: cur.status === 'off' ? cur.items : [], note: cur.note || '' }; S.openMeal = id; }
      saveDay(D); break;
    }
    case 'openmeal': S.openMeal = v; break;
    case 'copymeal': return openCopy(v);
    case 'expandmeal': S.expandMeal = S.expandMeal === v ? null : v; break;
    case 'allplan': { const dd = d(), trs = trimsFor(D); C.mealsOn(S.settings, D).forEach(m => { if ((m.items || []).length && !dd.skip[m.id] && !(dd.meals[m.id] && dd.meals[m.id].status)) dd.meals[m.id] = { status: 'plan', items: trimmedItems(m, trs), note: '' }; }); saveDay(D); toast('Meals logged as planned.'); break; }
    case 'share': return shareWeek();
    case 'sharecard': return shareCard();
    case 'sharerecap': {
      const R2 = C.computeRun(S.settings, S.days, now()), r = recapData(R2, +v);
      const text = [`Lock In 90 · Day ${r.cp} recap`, `Days locked in: ${r.locked}/${r.cp}`, r.wChange != null ? `Weight: ${r.wChange > 0 ? '+' : ''}${C.round(r.wChange, 1)} kg` : '', r.prot ? `Avg protein ${kc(r.prot)} g · avg calories ${kc(r.kcal)}` : '', `Water: ${C.round(r.water / 1000)} L · training days: ${r.trained} · cardio ${r.cardio} min`].filter(Boolean).join('\n');
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Recap copied.'); } catch (e) { toast('Couldn’t share the recap.'); }
      return;
    }
    case 'celeclose': $('cele').hidden = true; $('cele').innerHTML = ''; return;
    case 'commit': { const dd = d(), n = now(); dd.commit = `${C.pad(n.clock)}:${C.pad(n.minute)}`; saveDay(D); buzz([20, 40, 60]); toast(`Committed to Day ${Math.min(C.computeRun(S.settings, S.days, now()).dayNum, 90)}. Go get it.`); break; }
    case 'haptics': S.settings.haptics = v === '1'; saveSettings(); if (v === '1') buzz(30); break;
    case 'grpnew': {
      if (!navigator.onLine) return toast('Creating a group needs internet.');
      const code = newCode();
      try { await setDoc(doc(db, `groups/${code}`), { owner: uid(), created: new Date().toISOString() }); }
      catch (e) { return toast(e && e.code === 'permission-denied' ? 'The Firestore rules need publishing first (see the README).' : 'Couldn’t create the group. Try again.'); }
      S.settings.group = code; saveSettings(); toast(`Group ${code} created. Tap Invite friends.`); break;
    }
    case 'grpjoin': {
      const code = (($('fb-code') || {}).value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length !== 6) return toast('Group codes are 6 letters and numbers.');
      if (!navigator.onLine) return toast('Joining a group needs internet.');
      try { const g = await getDoc(doc(db, `groups/${code}`)); if (!g.exists()) return toast('No group with that code. Check it with your friend.'); }
      catch (e) { return toast(e && e.code === 'permission-denied' ? 'The Firestore rules need publishing first (see the README).' : 'Couldn’t check that code. Try again.'); }
      S.settings.group = code; saveSettings(); toast('Joined. Your friends can see you now.'); break;
    }
    case 'grpinvite': {
      const text = `Join my Lock In 90 group. Open the app, go to Progress → Friends → Join, and enter the code ${S.settings.group}\n${location.origin + location.pathname}`;
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Invite copied. Paste it in WhatsApp.'); } catch (e) { toast(`Your group code is ${S.settings.group}`); }
      return;
    }
    case 'grpleave': {
      const code = S.settings.group; if (!code) return;
      deleteDoc(doc(db, `groups/${code}/members/${uid()}`)).catch(() => { });
      S.settings.group = null; saveSettings(); toast('You left the group.'); break;
    }
    case 'closemeal': S.expandMeal = null; S.openMeal = null; break;
    case 'skip': d().skip[v] = true; saveDay(D); break;
    case 'unskip': delete d().skip[v]; saveDay(D); break;
    case 'addfood': return openSheet(v);
    case 'mealfat': return openFatSheet(v);
    case 'mbedit': { const [sc, ix] = v.split('|'), list = itemList(sc), it = list && list[+ix]; if (!it) return; openSheet(sc); SH.mb = { name: it.name, items: clone(it.parts || []), where: 'extra', counts: it.cheat ? 'cheat' : it.off ? 'off' : 'ok', edit: { scope: sc, i: +ix }, wasCheat: !!it.cheat }; if (sc !== 'extra') SH.mb.where = 'meal'; return drawMealBuild(); }
    case 'rmitem': { const i = v.lastIndexOf(':'), scope = v.slice(0, i); itemList(scope).splice(+v.slice(i + 1), 1); saveScope(scope); break; }
    case 'water': { const dd = d(); dd.water = Math.max(0, Math.min(12000, (dd.water || 0) + (+b.dataset.n))); saveDay(D); break; }
    case 'train': { const dd = d(); dd.trainingDone = !dd.trainingDone; dd.trainingSource = dd.trainingDone ? 'manual' : null; saveDay(D); break; }
    case 'gymtime': d().gymTime = v; saveDay(D); break;
    case 'sport': return openSport();
    case 'crave': return openCrave();
    case 'focuspick': return openFocusPick();
    case 'focusset': { const fw = focusWeek(); S.settings.focus = { ...(S.settings.focus || {}), [fw.key]: { id: v } }; saveSettings(); toast('Focus set for this week.'); break; }
    case 'misswhy': { const y = C.addDays(today(), -1), yd = dayDoc(y); yd.missWhy = v === 'skip' ? 'skip' : v; saveDay(y); break; }
    case 'missplanned': { const y = C.addDays(today(), -1), yd = dayDoc(y); yd.missPlanned = true; saveDay(y); break; }
    case 'iftsugadd': { const [w, th] = IFT_SUGGEST[+v]; S.settings.ifthen = [...(S.settings.ifthen || []), { when: w, then: th, day: null }]; saveSettings(); const y = C.addDays(today(), -1), yd = dayDoc(y); yd.missPlanned = true; saveDay(y); toast('Plan saved. Edit it any time in Me.'); break; }
    case 'iftsug': { const [w, th] = IFT_SUGGEST[+v]; $('ift-when').value = w; $('ift-then').value = th; $('ift-when').focus(); return; }
    case 'iftnew': { const w = $('ift-when').value.trim(), th = $('ift-then').value.trim(), dy = $('ift-day').value; if (!w || !th) return toast('Fill in both the “if” and the “then”.'); S.settings.ifthen = [...(S.settings.ifthen || []), { when: w.slice(0, 80), then: th.slice(0, 120), day: dy === '' ? null : +dy }]; saveSettings(); toast('Plan saved.'); break; }
    case 'iftdel': S.settings.ifthen = (S.settings.ifthen || []).filter((_, i) => i !== +v); saveSettings(); break;
    case 'camguide': return openCamGuide();
    case 'coachon': { const r = new Uint8Array(15); crypto.getRandomValues(r); S.settings.coach = { token: [...r].map(x => x.toString(36).padStart(2, '0')).join('').slice(0, 24), notes: false }; S.coachLast = null; saveSettings(); toast('Coach link created.'); break; }
    case 'coachoff': { if (S.confirm !== 'coachoff') { S.confirm = 'coachoff'; b.textContent = 'Tap again to stop sharing'; return; } S.confirm = null; const tk = S.settings.coach && S.settings.coach.token; if (tk) deleteDoc(doc(db, `shares/${tk}`)).catch(() => { }); S.settings.coach = null; S.coachLast = null; saveSettings(); toast('Coach link turned off.'); break; }
    case 'coachnotes': S.settings.coach = { ...S.settings.coach, notes: v === '1' }; S.coachLast = null; saveSettings(); break;
    case 'coachopen': window.open(coachURL(), '_blank'); return;
    case 'coachshare': { const text = `My Lock In 90 progress (live, read-only):\n${coachURL()}`; try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText(text); toast('Link copied. Paste it to your coach.'); } catch (e) { toast('Copy the link above.'); } return; }
    case 'shareweekimg': return shareWeekImage();
    case 'cheer': { const [to, kind] = v.split(':'); return sendCheer(to, kind); }
    case 'cheersok': { const code = S.settings.group; Object.keys(S.cheers || {}).forEach(id => deleteDoc(doc(db, `groups/${code}/members/${uid()}/cheers/${id}`)).catch(() => { })); S.cheers = {}; break; }
    case 'planedit': S.planEdit = v; if (v === 'ramadan') setTimeout(() => { const el = $('sec-plan'); if (el) el.scrollIntoView({ block: 'start' }); }, 60); break;
    case 'ramon': { const r0 = C.ramadanOf(S.settings); S.settings.ramadan = v === '1' ? { ...r0, on: true, onSince: r0.onSince && !r0.offFrom ? r0.onSince : today(), offFrom: null } : { ...r0, on: false, offFrom: today() }; } if (v === '1' && !S.settings.ramadanMeals) S.settings.ramadanMeals = clone(C.RAMADAN_MEALS); saveSettings(); toast(v === '1' ? 'Ramadan mode on. Add your Ramadan meal plan below.' : 'Ramadan mode off.'); break;
    case 'ramsetup': go('setup'); setTimeout(() => { const el = $('sec-ramadan'); if (el) el.scrollIntoView({ block: 'start' }); }, 60); return;
    case 'dayview': return openDay(v);
    case 'planset': S.planEdit = C.inRamadan(S.settings, editDate()) ? 'ramadan' : 'normal'; go('setup'); setTimeout(() => { const el = $('sec-plan'); if (el) el.scrollIntoView({ block: 'start' }); }, 60); return;
    case 'plannoted': S.settings.planNoted = true; saveSettings(); break;
    case 'sstarter': if (!S.settings.supps.some(s => s.name === v)) { S.settings.supps.push({ id: 's' + Date.now().toString(36), name: v, req: true, am: 'Any time', pm: 'Any time' }); saveSettings(); toast(`${v} added as a core supplement. Tap “core” to make it optional.`); } break;
    case 'quick': return openQuick();
    case 'sex': S.settings.sex = v; saveSettings(); break;
    case 'sprm': { const dd = d(), s = dd.sports.splice(+v, 1)[0]; if (s && s.counts && dd.trainingSource === 'sport' && !dd.sports.some(x => x.counts)) { dd.trainingDone = false; dd.trainingSource = null; } saveDay(D); break; }
    case 'suppall': { const dd = d(); P0(D).req.forEach(s => dd.supps[s.id] = true); saveDay(D); toast('Core supplements ticked.'); break; }
    case 'supp': { const dd = d(); dd.supps[b.dataset.id] = !dd.supps[b.dataset.id]; saveDay(D); break; }
    case 'energy': { const dd = d(); dd.energy = dd.energy === +v ? null : +v; saveDay(D); break; }
    case 'traintab': S.trainTab = v; break;
    case 'phase': S.phase = +v; break;
    case 'addset': { const dd = d(), e = EX.find(x => x.id === b.dataset.id), a = Array.isArray(dd.cali[e.id]) ? dd.cali[e.id] : []; while (a.length < e.sets) a.push(0); a.push(0); dd.cali[e.id] = a; saveDay(D); break; }
    case 'hold': { const e = EX.find(x => x.id === b.dataset.id); return openTimer('hold', e.top, e.id); }
    case 'rest': return openTimer('rest', +v);
    case 'finish': { const dd = d(); if (!dd.trainingDone) { dd.trainingDone = true; dd.trainingSource = 'manual'; saveDay(D); toast('Session logged. Training is ticked for today.'); } break; }
    case 'stamlog': {
      const min = parseInt($('st-min').value, 10); if (!min) return toast('Enter the minutes.');
      const kind = $('st-kind').value, dist = parseFloat($('st-dist').value) || null;
      if (kind === 'test' && !dist) return toast('Enter the distance you covered in the 12 minutes.');
      d().stamina.push({ mode: $('st-mode').value, kind, min, dist, hr: parseInt($('st-hr').value, 10) || null }); saveDay(D); toast('Session saved.'); break;
    }
    case 'stamdel': { const [dt, i] = v.split(':'); const dd = dayDoc(dt); dd.stamina.splice(+i, 1); saveDay(dt); break; }
    case 'checkin': return saveCheckin();
    case 'ckdel': {
      if (S.confirm !== 'ck:' + v) { S.confirm = 'ck:' + v; break; }
      S.confirm = null;
      if (S.checkins[v]) { delete S.checkins[v]; setDoc(doc(db, up('checkins/' + v)), stamp('checkins/', { date: v, deleted: true })).catch(() => toast('Couldn’t delete the check-in.')); }
      if (S.photos[v]) { delete S.photos[v]; setDoc(doc(db, up('photos/' + v)), stamp('photos/', { date: v, deleted: true })).catch(() => { }); }
      toast('Check-in deleted.'); break;
    }
    case 'defgym': S.settings.gymTime = v; saveSettings(); break;
    case 'wkmode': S.settings.weekStart = { ...(S.settings.weekStart || {}), mode: v, ...(v === 'day' && !(S.settings.weekStart || {}).d && (S.settings.weekStart || {}).d !== 0 ? { d: C.weekday(S.settings.startDate) } : {}) }; saveSettings(); S.boardLast = null; break;
    case 'wkday': S.settings.weekStart = { mode: 'day', d: +v }; saveSettings(); S.boardLast = null; break;
    case 'budon': S.settings.budget = { ...C.budgetOf(S.settings), on: !C.budgetOf(S.settings).on }; saveSettings(); break;
    case 'budmode': S.settings.budget = { ...C.budgetOf(S.settings), mode: v }; saveSettings(); break;
    case 'cheaton': S.settings.cheat = { per: '1w', kind: 'meal', ...(S.settings.cheat || {}), on: !(S.settings.cheat && S.settings.cheat.on) }; saveSettings(); break;
    case 'cheatper': S.settings.cheat = { ...(S.settings.cheat || {}), per: v }; saveSettings(); break;
    case 'cheatkind': S.settings.cheat = { ...(S.settings.cheat || {}), kind: v }; saveSettings(); break;
    case 'cheatday': { const dd = d(), st = S.settings; if (dd.cheatDay) { delete dd.cheatDay; saveDay(D); break; } const cu = C.cheatsUsed(st, S.days, D, D); if (cu.used >= cu.max) { toast('Your free cheat day is used for this week.'); break; } dd.cheatDay = true; saveDay(D); toast('Free cheat day. Enjoy it, the day still counts.'); break; }
    case 'daystart': { const ds = { ...(S.settings.dayStart || {}), mode: v }; if (v === 'fajr' && !ds.city) ds.city = 'cairo'; if (v === 'time' && !ds.t) ds.t = '04:00'; S.settings.dayStart = ds; saveSettings(); S.boardLast = null; toast(v === 'midnight' ? 'Your day starts at midnight.' : v === 'fajr' ? `Your day now runs until Fajr (${C.minTxt(C.fajrMin(C.addDays(today(), 1), ds.city))} tomorrow).` : `Your day now starts at ${ds.t}.`); break; }
    case 'mealup': case 'mealdown': { const ms = planMeals(), i = ms.findIndex(x => x.id === v), j = act === 'mealup' ? i - 1 : i + 1; if (j >= 0 && j < ms.length) { [ms[i], ms[j]] = [ms[j], ms[i]]; savePlan(); } break; }
    case 'mealdel': if (S.confirm === 'meal:' + v) { setPlanMeals(planMeals().filter(x => x.id !== v)); S.confirm = null; savePlan(); } else { S.confirm = 'meal:' + v; b.textContent = 'Tap again to delete'; return; } break;
    case 'mealadd': { const ms = planMeals(); ms.push({ id: 'm' + Date.now().toString(36), name: `Meal ${ms.length + 1}`, time: '', items: [] }); savePlan(); break; }
    case 'stamon': S.settings.stamina = { ...(S.settings.stamina || { days: [] }), on: v === '1' }; saveSettings(); break;
    case 'stamday': { const st = S.settings.stamina = S.settings.stamina || { on: true, days: [] }; const i = +v; st.days = st.days.includes(i) ? st.days.filter(x => x !== i) : [...st.days, i]; saveSettings(); break; }
    case 'sreq': { const s = S.settings.supps.find(x => x.id === b.dataset.id); s.req = !s.req; saveSettings(); break; }
    case 'sdel': S.settings.supps = S.settings.supps.filter(x => x.id !== b.dataset.id); saveSettings(); break;
    case 'sadd': { const n = $('s-new').value.trim(); if (!n) return; S.settings.supps.push({ id: 's' + Date.now().toString(36), name: n.slice(0, 40), req: false, am: 'Any time', pm: 'Any time' }); $('s-new').value = ''; $('s-new').blur(); saveSettings(); break; }
    case 'remind': { const [k, on] = v.split(':'); S.settings.reminders = { ...(S.settings.reminders || {}), [k]: on === '1' }; saveSettings(); break; }
    case 'gentopic': { const r = new Uint8Array(6); crypto.getRandomValues(r); S.settings.ntfyTopic = 'lockin90-' + [...r].map(x => x.toString(16).padStart(2, '0')).join(''); saveSettings(); toast('New topic created. Subscribe to it in ntfy.'); break; }
    case 'export': return exportBackup();
    case 'restart1': S.confirm = 'restart'; break;
    case 'cancel': S.confirm = null; break;
    case 'restart2': S.settings.startDate = today(); delete S.settings.attemptStart; S.confirm = null; saveSettings(); toast('Fresh start. Day 1 is today.'); return go('today');
    default: return;
  }
  draw();
});
document.addEventListener('input', ev => {
  const t = ev.target; if (!S.settings) return;
  if (TR.input(t)) return;
  if (t.id === 'plancopy-q' && SH && SH.scope === 'plancopy') { SH.q = t.value; drawPlanCopy(true); return; }
  if (t.id === 'so-type' && S.so) { S.so.typed = t.value; const bt = $('so-go'); if (bt) bt.disabled = t.value.trim().toUpperCase() !== 'DELETE'; return; }
  if (SH && SH.recipe && (t.id === 'rc-n' || t.id === 'rc-w' || t.id === 'rc-s' || t.dataset.rcg)) {
    const r = SH.recipe;
    if (t.id === 'rc-n') r.name = t.value; else if (t.id === 'rc-w') r.total = parseFloat(t.value) || null; else if (t.id === 'rc-s') r.serv = parseInt(t.value, 10) || null; else r.items[+t.dataset.rcg].g = Math.max(0, parseFloat(t.value) || 0);
    const sumG = r.items.reduce((s, it) => s + (it.g || 0), 0), tot = C.sumItems(r.items), W = r.total || sumG, el = $('rc-sum');
    if (el && r.items.length) el.textContent = `Whole dish ${kc(tot.k)} kcal · ${kc(tot.p)} g protein · per 100 g: ${kc(W ? tot.k / W * 100 : 0)} kcal, ${C.round(W ? tot.p / W * 100 : 0, 1)} g protein`;
    return;
  }
  const D = editDate();
  if (t.id === 'cut') { S.cut = +t.value; const c = document.querySelector('.compare'); if (c) c.style.setProperty('--cut', S.cut + '%'); return; }
  if (t.dataset.daynote) { dayDoc(D).note = t.value.slice(0, 400); saveDay(D); return; }
  if (t.dataset.note) { dayDoc(D).meals[t.dataset.note].note = t.value.slice(0, 140); saveDay(D); return; }
  if (t.dataset.grams) { const v = t.dataset.grams, i = v.lastIndexOf(':'), scope = v.slice(0, i), it = itemList(scope)[+v.slice(i + 1)]; if (it) { const g = Math.max(0, parseFloat(t.value) || 0); if (it.parts) scaleCombo(it, g); it.g = g; delete it.su; delete it.sq; saveScope(scope); } return; }
  if (t.dataset.set) {
    const dd = dayDoc(D), e = EX.find(x => x.id === t.dataset.set), a = Array.isArray(dd.cali[e.id]) ? dd.cali[e.id] : [];
    while (a.length <= +t.dataset.i) a.push(0);
    const val = Math.max(0, Math.min(999, parseInt(t.value, 10) || 0)), prev = bestOf(e.id, D);
    a[+t.dataset.i] = val; dd.cali[e.id] = a; t.classList.toggle('hit', val >= e.top); saveDay(D);
    const hk = exHistory(e.id, D), lk = hk[hk.length - 1], lastV = lk ? (S.days[lk].cali[e.id].filter(x => x > 0)[+t.dataset.i] || 0) : 0;
    t.classList.toggle('beat', !!lk && val > lastV);
    clearTimeout(t._pb); if (prev && val > prev) t._pb = setTimeout(() => { buzz([30, 40, 70]); toast(`New record on ${e.name}: ${val}${e.unit === 's' ? ' s' : ''} (was ${prev})`); }, 900);
    return;
  }
  if (t.dataset.mealname) { planMeals().find(x => x.id === t.dataset.mealname).name = t.value.slice(0, 40); savePlan(); return; }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (S.settings && TR.change(t)) return;
  if (t.id === 'imp-file' || t.id === 'imp-file2') return importBackup(t.files[0]);
  if (SH && SH.scope === 'sport' && (t.id === 'sp-min' || t.id === 'sp-hr' || t.id === 'sp-count')) { if (t.id === 'sp-min') SH.min = Math.max(0, Math.min(600, parseInt(t.value, 10) || 0)); else if (t.id === 'sp-hr') SH.hr = parseInt(t.value, 10) || null; else SH.counts = t.checked; return drawSport(); }
  if (t.id === 'ck-photo') { const f = t.files && t.files[0], n = $('ck-photo-name'); if (n) n.textContent = f ? 'Photo ready: ' + f.name.slice(0, 28) : 'Take or choose a photo'; return; }
  if (t.id === 'bud-pct' || t.id === 'bud-floor' || t.id === 'bud-cheat' || t.id === 'bud-trim') { const b = C.budgetOf(S.settings); if (t.id === 'bud-pct') b.maxPct = +t.value; else if (t.id === 'bud-floor') b.floor = +t.value; else if (t.id === 'bud-cheat') b.cheat = t.checked; else b.trim = t.checked; S.settings.budget = b; saveSettings(); return draw(); }
  if (t.id === 'mb-save' && SH && SH.mb) { SH.mb.save = t.checked; return; }
  if (t.id === 'mb-where' && SH && SH.mb) { mbRead(); SH.mb.where = t.value; return drawMealBuild(); }
  if (t.id === 'fs-usual' && SH) { SH.saveUsual = t.checked; return drawPicked(); }
  if (t.id === 'fs-usual-n' && SH) { SH.usualName = t.value; return; }
  if (t.id === 'fs-remfat' && SH) { SH.remFat = t.checked; return; }
  if (t.dataset && t.dataset.addmilk && SH && SH.add && SH.add.milk) { SH.add.milk.fid = t.value; S.settings.lastMilk = t.value; saveSettings(); return drawPicked(); }
  if (t.id === 'fat-tsp' && SH) { const x = parseFloat(t.value); if (x >= 1 && x <= 15) { S.settings.fatTsp = x; saveSettings(); } SH.tspEdit = false; return SH.fatSheet ? drawFatSheet() : drawPicked(); }
  if (t.id === 'fs-drink' && SH) { SH.drink = t.checked; if (SH.scope === 'extra') SH.off = !(SH.drink && (SH.picked.per.k || 0) < 5); return drawPicked(); }
  if (t.dataset && t.dataset.grams && S.settings) { const v = t.dataset.grams, i = v.lastIndexOf(':'), it = itemList(v.slice(0, i))[+v.slice(i + 1)]; if (C.isDrink(it)) return draw(); }
  if (!S.settings) return;
  const D = editDate();
  if (t.dataset.dayfield) {
    const v = parseFloat(t.value), f = t.dataset.dayfield;
    if (f === 'weight' && !isNaN(v)) {
      const prev = [S.settings.startWeight, ...Object.values(S.checkins).map(c => c.weight), ...Object.keys(S.days).filter(k => k !== D).map(k => S.days[k].weight)].filter(x => x > 0);
      if (prev.length && v < Math.min(...prev)) { buzz([30, 40, 70]); toast(`New lowest weight: ${v} kg. Down ${C.round(Math.min(...prev) - v, 1)} kg from your previous low.`); }
    }
    dayDoc(D)[f] = isNaN(v) ? null : v; saveDay(D); return;
  }
  if (t.dataset.plan !== undefined) { S.settings.plan = { ...(S.settings.plan || C.DEFAULT_PLAN), [t.dataset.plan]: t.value }; saveSettings(); return; }
  if (t.dataset.setting) { const v = parseFloat(t.value); S.settings[t.dataset.setting] = isNaN(v) ? null : v; saveSettings(); if (t.dataset.setting === 'waterGoal') { t.blur(); draw(); } return; }
  if (t.id === 'ds-city' || t.id === 'ds-time') { const ds = { ...(S.settings.dayStart || {}) }; if (t.id === 'ds-city') ds.city = t.value; else if (/^\d\d:\d\d$/.test(t.value)) ds.t = t.value > '06:00' ? '06:00' : t.value; S.settings.dayStart = ds; saveSettings(); return draw(); }
  if (t.id === 'fb-name') { S.settings.boardName = t.value.trim().slice(0, 24) || null; saveSettings(); S.boardLast = null; return draw(); }
  if (t.dataset.topic) { S.settings.ntfyTopic = t.value.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); saveSettings(); return; }
  if (t.dataset.target) { const v = parseFloat(t.value); S.settings.targets = { ...(S.settings.targets || {}), [t.dataset.target]: isNaN(v) ? null : v }; saveSettings(); return; }
  if (t.dataset.bedtime) { S.settings.bedtime = t.value || '23:30'; saveSettings(); return; }
  if (t.dataset.ram) { S.settings.ramadan = { ...C.ramadanOf(S.settings), [t.dataset.ram]: t.value }; saveSettings(); return; }
  if (t.dataset.mealtime) { planMeals().find(x => x.id === t.dataset.mealtime).time = t.value; savePlan(); return; }
  if (t.dataset.stime) { const [id, k] = t.dataset.stime.split(':'); S.settings.supps.find(x => x.id === id)[k] = t.value; saveSettings(); return; }
});

/* ---------- check-ins, photos, backup ---------- */
async function compress(file) {
  const url = URL.createObjectURL(file), img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const s = Math.min(1, 1080 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.72);
}
async function saveCheckin() {
  const date = $('ck-date').value || today(), num = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
  const prev = S.checkins[date] || {};
  const c = { date, weight: num('ck-weight') ?? prev.weight ?? null, waist: num('ck-waist') ?? prev.waist ?? null, chest: num('ck-chest') ?? prev.chest ?? null, arm: num('ck-arm') ?? prev.arm ?? null, hips: num('ck-hips') ?? prev.hips ?? null, neck: num('ck-neck') ?? prev.neck ?? null };
  const f = $('ck-photo').files[0], pre = S.pendingPhoto;
  if (!f && !pre && !c.weight && !c.waist && !c.chest && !c.arm && !c.hips && !c.neck) return toast('Add a measurement or a photo first.');
  S.checkins[date] = c; setDoc(doc(db, up('checkins/' + date)), stamp('checkins/', clone(c))).catch(() => toast('Couldn’t save the check-in.'));
  if (f || pre) {
    try { const data = pre || await compress(f); S.pendingPhoto = null; if (data.length > 900000) return toast('That photo is too large even after shrinking. Try another.'); S.photos[date] = { date, data }; setDoc(doc(db, up('photos/' + date)), stamp('photos/', { date, data })).catch(() => toast('Couldn’t save the photo.')); }
    catch (e) { return toast('Couldn’t read that photo. Try a JPG or PNG.'); }
  }
  toast('Check-in saved.'); draw();
}
function exportBackup() {
  const data = { app: 'lock-in-90', version: 2, exported: new Date().toISOString(), settings: S.settings, days: S.days, checkins: S.checkins, foods: S.foods, photos: S.photos };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = `lock-in-90-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
  toast('Backup saved to your downloads.');
}
async function importBackup(file) {
  if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== 'lock-in-90' || !j.settings) return toast('That file isn’t a Lock In 90 backup.');
    const writes = [['settings/main', j.settings], ...Object.entries(j.days || {}).map(([k, v]) => ['days/' + k, v]), ...Object.entries(j.checkins || {}).map(([k, v]) => ['checkins/' + k, v]), ...Object.entries(j.foods || {}).map(([k, v]) => ['foods/' + k, v]), ...Object.entries(j.photos || {}).map(([k, v]) => ['photos/' + k, v])];
    for (let i = 0; i < writes.length; i += 400) { const b = writeBatch(db); writes.slice(i, i + 400).forEach(([p, v]) => b.set(doc(db, up(p)), stamp(p, clone(v)))); b.commit().catch(() => toast('Part of the import didn’t save.')); }
    S.settings = clone(j.settings); Object.assign(S.days, clone(j.days || {})); Object.assign(S.checkins, clone(j.checkins || {}));
    toast(`Imported ${Object.keys(j.days || {}).length} days.`); draw();
  } catch (e) { toast('Couldn’t read that file.'); }
}

/* ---------- auth + data ---------- */
async function signin() {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) {
    const c = e && e.code;
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
    if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment' || c === 'auth/web-storage-unsupported') toast('Google sign-in doesn’t work in this browser. Use email sign-in below.');
    else if (c === 'auth/unauthorized-domain') toast('This address isn’t authorized in Firebase yet.');
    else toast('Google sign-in failed. Try email sign-in below.');
  }
}
const AUTH_MSG = { 'auth/invalid-email': 'That email address isn’t valid.', 'auth/missing-password': 'Enter a password.', 'auth/weak-password': 'Use a password of at least 6 characters.', 'auth/email-already-in-use': 'That email already has an account. Tap Sign in instead.', 'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'No account with that email. Tap Create account.', 'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.', 'auth/operation-not-allowed': 'Email sign-in isn’t switched on in Firebase yet.', 'auth/network-request-failed': 'No connection. Sign-in needs internet the first time.' };
async function emailAuth(create) {
  const email = ($('si-email').value || '').trim(), pass = $('si-pass').value || '';
  if (!email || !pass) return toast('Enter your email and a password.');
  try { create ? await createUserWithEmailAndPassword(auth, email, pass) : await signInWithEmailAndPassword(auth, email, pass); }
  catch (e) { toast(AUTH_MSG[e && e.code] || 'Sign-in failed. Try again.'); }
}
document.addEventListener('submit', e => { if (e.target.id === 'email-form') { e.preventDefault(); emailAuth(false); } });
getRedirectResult(auth).catch(() => { });
/* Firestore bills a full re-read when a listener reconnects after 30+ minutes. To keep reads low, each synced
   collection loads from the phone's cache first, then listens only for documents changed since the last sync. */
function syncCol(name, onDocs, meta) {
  const key = `lk-sync:${uid()}:${name}`, col = collection(db, up(name)), opt = meta ? { includeMetadataChanges: true } : {};
  let since = 0; try { since = +localStorage.getItem(key) || 0; } catch (e) { }
  const handle = qs => {
    onDocs(qs);
    if (qs.metadata.fromCache) return;
    let mx = since; qs.docs.forEach(x => { const u = x.data().u; const ms = u && u.toMillis ? u.toMillis() : 0; if (ms > mx) mx = ms; });
    mx = Math.max(mx, Date.now() - 10 * 60e3); since = mx;
    try { localStorage.setItem(key, String(mx)); } catch (e) { }
  };
  const full = () => S.unsub.push(onSnapshot(col, opt, handle, () => { if (meta) { S.got.days = true; render(); } }));
  if (!since) return full();
  getDocsFromCache(col).then(qs => {
    if (!qs.size && name === 'days') { since = 0; return full(); } // cache was cleared: do one full load
    onDocs(qs);
    S.unsub.push(onSnapshot(query(col, where('u', '>', Timestamp.fromMillis(since - 10 * 60e3))), opt, handle, () => full()));
  }).catch(() => full());
}
function subscribe() {
  S.unsub.forEach(u => u()); S.unsub = [];
  const opt = { includeMetadataChanges: true };
  S.unsub.push(onSnapshot(doc(db, up('settings/main')), opt, snap => {
    if (!busy('settings/main')) S.settings = snap.exists() ? fsDec(snap.data()) : null;
    S.pend.s = snap.metadata.hasPendingWrites;
    if (!snap.metadata.fromCache || snap.exists()) S.got.settings = true;
    render();
  }, () => { S.got.settings = true; render(); }));
  syncCol('days', qs => {
    qs.docs.forEach(x => { if (!busy('days/' + x.id)) S.days[x.id] = fsDec(x.data()); });
    S.pend.d = qs.metadata.hasPendingWrites; S.got.days = true; render();
  }, true);
  syncCol('checkins', qs => { qs.docs.forEach(x => { const v = x.data(); if (v.deleted) delete S.checkins[x.id]; else S.checkins[x.id] = v; }); render(); });
  syncCol('foods', qs => { qs.docs.forEach(x => { const v = fsDec(x.data()); if (v.deleted) delete S.foods[x.id]; else S.foods[x.id] = v; }); });
  S.unsub.push(onSnapshot(collection(db, up('activities')), qs => { qs.docs.forEach(x => S.acts[x.id] = x.data()); render(); }));
  S.unsub.push(onSnapshot(collection(db, up('meta')), qs => { qs.docs.forEach(x => S.meta[x.id] = x.data()); render(); }));
}
/* friends board: a group is a short code; each member publishes a small summary (name, day, streak, today) to groups/{code}/members/{uid} */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
const boardName = () => (S.settings && S.settings.boardName) || (S.user && (S.user.displayName || '').split(' ')[0]) || (S.user && (S.user.email || '').split('@')[0]) || 'Me';
function boardOn() {
  const code = S.settings && S.settings.group;
  if (code === S.boardCode) return;
  if (S.boardUnsub) S.boardUnsub();
  S.boardUnsub = null; S.board = {}; S.boardCode = code || null; S.boardLast = null;
  if (!code) return;
  const u1 = onSnapshot(collection(db, `groups/${code}/members`), qs => { S.board = {}; qs.docs.forEach(x => S.board[x.id] = fsDec(x.data())); if (S.view === 'progress' || S.view === 'today') render(); }, () => { });
  const u2 = onSnapshot(collection(db, `groups/${code}/members/${uid()}/cheers`), qs => {
    const before = new Set(Object.keys(S.cheers || {})); S.cheers = {};
    qs.docs.forEach(x => S.cheers[x.id] = x.data());
    const fresh = Object.keys(S.cheers).filter(k => !before.has(k));
    if (fresh.length && before.size + fresh.length > 0 && S.cheersSeen) { const c = S.cheers[fresh[0]]; buzz([30, 50, 30]); toast(c.kind === 'nudge' ? `${c.name}: finish today, you’ve got this` : `${c.name} cheered you 👏`); }
    S.cheersSeen = true; if (S.view === 'today') render();
  }, () => { });
  S.boardUnsub = () => { u1(); u2(); S.cheers = {}; S.cheersSeen = false; };
}
let boardT;
// foods you chose to share: published with your board summary so friends can log them too (servings as objects: Firestore has no arrays in arrays)
const sharedFoods = () => Object.values(S.foods).filter(f => f && f.shared && f.per).slice(0, 40).map(f => ({ id: f.id, name: f.name, per: f.per, units: unitsOf(f).map(([n, g]) => ({ n, g })), ...(f.brand ? { brand: f.brand } : {}), ...(f.drink ? { drink: true } : {}) }));
function boardPublish(R) {
  const code = S.settings && S.settings.group;
  if (!code || !S.got.days || !R) return;
  const ev = R.todayEval, P = ev.P;
  const doneDates = []; for (let i = 0; i < 30; i++) { const dt = C.addDays(today(), -i); if (C.evalDay(S.settings, S.days[dt], dt).complete) doneDates.push(dt); }
  const sum = { doneDates, wk: myWeekStats(), name: boardName(), day: Math.min(R.dayNum, 90), streak: R.done, best: R.best, attempt: R.attemptNo, parts: [P.mealsOk, P.w >= P.goal, P.trained, P.sDone === P.req.length].filter(Boolean).length, done: ev.complete, date: today(), victory: !!R.victory, ...leagueSummary(R), foods: sharedFoods() };
  const key = code + JSON.stringify(sum);
  if (key === S.boardLast) return;
  S.boardLast = key; clearTimeout(boardT);
  boardT = setTimeout(() => setDoc(doc(db, `groups/${code}/members/${uid()}`), { ...sum, updated: Date.now() }).catch(e => { S.boardLast = null; if (e && e.code === 'permission-denied') toast('Friends board refused the update. The Firestore rules need publishing.'); }), 1500);
}
// group chain: consecutive days on which every member locked in (today counts once everyone is done)
function groupStreak() {
  const ms = Object.values(S.board); if (ms.length < 2) return null;
  const has = (m, dt) => (m.doneDates || []).includes(dt), t = today();
  let n = ms.every(m => has(m, t)) ? 1 : 0;
  for (let i = 1; i <= 30; i++) { const dt = C.addDays(t, -i); if (ms.every(m => has(m, dt))) n++; else break; }
  return { n, todayAll: ms.every(m => has(m, t)) };
}
function friendRows() {
  const t = today();
  return Object.entries(S.board).map(([id, m]) => ({ id, ...m, me: id === uid(), fresh: m.date === t })).sort((a, b) => (b.fresh && b.done) - (a.fresh && a.done) || b.streak - a.streak || a.name.localeCompare(b.name));
}
const CHEER_TXT = { cheer: '👏 Keep going!', nudge: '⏰ Finish today, you’ve got this', fire: '🔥 Locked in, respect', reset: '↺ Started over today. Send a cheer?' };
function cheersHTML() {
  const list = Object.entries(S.cheers || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  if (!list.length) return '';
  return `<section class="card cheers"><span class="sub">From your friends</span>${list.slice(0, 4).map(([, c]) => `<div class="cheer"><b>${esc(c.name || 'A friend')}</b><span>${esc(CHEER_TXT[c.kind] || CHEER_TXT.cheer)}</span></div>`).join('')}<button class="btn small" data-act="cheersok">Thanks</button></section>`;
}
async function sendCheer(to, kind) {
  const code = S.settings.group, key = `lk-cheer:${today()}:${to}:${kind}`;
  try { if (localStorage.getItem(key)) return toast('Already sent today.'); } catch (e) { }
  try {
    await setDoc(doc(db, `groups/${code}/members/${to}/cheers/${uid()}_${today()}_${kind}`), { from: uid(), name: boardName(), kind, date: today(), at: Date.now(), pushed: false });
    try { localStorage.setItem(key, '1'); } catch (e) { }
    { const c = S.settings.cheered = S.settings.cheered || {}; c[today()] = true; Object.keys(c).filter(k => k < C.addDays(today(), -14)).forEach(k => delete c[k]); saveSettings(); }
    buzz(20); toast(kind === 'nudge' ? 'Nudge sent.' : 'Sent 👏'); draw();
  } catch (e) { toast(e && e.code === 'permission-denied' ? 'Cheers need the updated Firestore rules (see the README).' : 'Couldn’t send that. Try again online.'); }
}
const cheerSent = (to, kind) => { try { return !!localStorage.getItem(`lk-cheer:${today()}:${to}:${kind}`); } catch (e) { return false; } };
function friendsLineHTML() {
  if (!S.settings.group) return '';
  const fr = friendRows().filter(m => !m.me);
  if (!fr.length) return '';
  const done = fr.filter(m => m.fresh && m.done).length;
  const gs = groupStreak();
  return `<button class="friendline" data-act="tab" data-v="progress"><b>Friends</b><span>${done} of ${fr.length} locked in today${gs && gs.n ? ` · group chain ${gs.n}` : ''}</span>${fr.slice(0, 5).map(m => `<i class="${m.fresh && m.done ? 'd' : m.fresh ? 'p' : ''}" title="${esc(m.name)}">${esc((m.name || '?').slice(0, 1).toUpperCase())}</i>`).join('')}</button>`;
}
/* ---------- weekly league, strength boards (friends) ---------- */
const SEASON0 = '2026-01-03'; // a Saturday; seasons are 4 weeks
const seasonOf = from => Math.floor(C.diffDays(SEASON0, from) / 28);
function leagueSummary(R) {
  const st = S.settings; if (st.hideRank) return { lg: null, lgh: null, rk: null, dt: null, imp: null, reset: st.resetNote || null };
  const from = weekStart(today()), lg = { k: from, ...TR.leagueWeek(from) }, lgh = {};
  for (let i = 1; i <= 8; i++) { const f = C.addDays(from, -7 * i); if (f < C.addDays(st.startDate, -7) && i > 1) break; lgh[f] = TR.leagueWeek(f).pts; }
  lgh[from] = lg.pts;
  const rk = TR.rankOf(), ms = today().slice(0, 8) + '01', rk0 = TR.rankOf(ms), dt = {};
  if (rk) rk.list.forEach(l => { if (['bench', 'squat', 'dead'].includes(l.k)) dt[l.k] = { d: l.dots, ...(st.showKg ? { kg: l.e1 } : {}) }; });
  return { lg, lgh, rk: rk ? { score: rk.score, name: rk.name, ti: rk.ti, best: rk.list[0] && rk.list[0].name } : null, dt, imp: rk && rk0 && rk0.score ? Math.round((rk.score - rk0.score) / rk0.score * 100) : rk && !rk0 ? null : 0, reset: st.resetNote || null };
}
const FTABS = [['league', 'League'], ['strength', 'Strength'], ['improved', 'Improved'], ['board', 'Board']];
function friendsTabsHTML() {
  if (!S.settings.group) return friendsHTML();
  const tab = FTABS.some(f => f[0] === S.ftab) ? S.ftab : 'league';
  let h = `<div class="seg wide ftabs" role="tablist" aria-label="Friends sections">${FTABS.map(([k, l]) => `<button role="tab" data-act="ftab" data-v="${k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div>`;
  if (tab === 'board') return h + friendsHTML();
  const rows = friendRows(), from = weekStart(today()), av = m => `<span class="av">${esc((m.name || '?').slice(0, 1).toUpperCase())}${m.rk ? `<em style="background:${TR.TIER_C[m.rk.ti]}">${esc(TR.TIERS[m.rk.ti][0])}</em>` : ''}</span>`;
  const hidden = S.settings.hideRank;
  if (tab === 'league') {
    const pts = m => m.lg && m.lg.k === from ? m.lg.pts : 0, list = rows.filter(m => !(m.me && hidden)).sort((a, b) => pts(b) - pts(a)), ends = 6 - C.diffDays(from, today());
    const sn = seasonOf(from), sFrom = C.addDays(SEASON0, sn * 28), wkIn = Math.floor(C.diffDays(sFrom, from) / 7) + 1;
    const seasonPts = m => Object.entries(m.lgh || {}).reduce((a, [k, v]) => a + (seasonOf(k) === sn ? v : 0), 0);
    const prevW = (() => { const ps = sn - 1, tot = rows.map(m => [m, Object.entries(m.lgh || {}).reduce((a, [k, v]) => a + (seasonOf(k) === ps ? v : 0), 0)]).sort((a, b) => b[1] - a[1]); return tot[0] && tot[0][1] > 0 ? tot[0][0].id : null; })();
    const me = list.findIndex(m => m.me), above = me > 0 ? list[me - 1] : null;
    h += `<section class="card"><div class="spread"><div><h2 style="margin:0">Week ${wkIn} of 4 · season ${sn + 1}</h2><span class="sub">Ends ${ends ? `in ${ends} day${ends > 1 ? 's' : ''}` : 'tonight'} (Friday 23:59)</span></div><button class="btn small ghost" data-act="lghelp">Points</button></div>
    ${list.map((m, i) => `<div class="lg${m.me ? ' me' : ''}"><span class="n${i === 0 && pts(m) ? ' first' : ''}">${i + 1}</span>${av(m)}<span><b>${esc(m.name)}${m.me ? ' (you)' : ''}${m.id === prevW ? ' 🏆' : ''}</b><small>${m.lg && m.lg.k === from ? `${m.lg.days} day${m.lg.days === 1 ? '' : 's'} locked in · ${m.lg.wo} workout${m.lg.wo === 1 ? '' : 's'}${m.lg.rec ? ` · ${m.lg.rec} record${m.lg.rec > 1 ? 's' : ''}` : ''}` : 'No points yet this week'}</small></span><span class="pts num">${pts(m)}<small>${seasonPts(m)} season</small></span></div>`).join('')}</section>
    ${above && pts(above) > pts(list[me]) ? `<section class="card"><p class="hint"><b style="color:var(--ink)">${pts(above) - pts(list[me]) + 1} points to pass ${esc(above.name)}.</b> A locked-in day is worth 10.</p></section>` : me === 0 && list.length > 1 && pts(list[0]) ? `<section class="card"><p class="hint"><b style="color:var(--ink)">You're leading this week.</b> Keep locking in.</p></section>` : ''}
    ${prevW ? `<p class="hint center">🏆 ${esc((rows.find(m => m.id === prevW) || {}).name || '')} won last season.</p>` : ''}`;
  }
  if (tab === 'strength') {
    const k = S.fstr || 'all', chips = [['all', 'Overall'], ['bench', 'Bench'], ['squat', 'Squat'], ['dead', 'Deadlift']];
    const val = m => k === 'all' ? (m.rk ? m.rk.score : -1) : (m.dt && m.dt[k] ? m.dt[k].d : -1);
    const list = rows.filter(m => val(m) >= 0).sort((a, b) => val(b) - val(a));
    h += `<section class="card"><div class="chips">${chips.map(([c, l]) => `<button data-act="fstr" data-v="${c}" aria-pressed="${k === c}">${l}</button>`).join('')}</div>
    <p class="hint">${k === 'all' ? 'Strength rank from each person’s main lifts, relative to bodyweight.' : 'Compared by DOTS score, so bodyweight is taken into account. Weights show only if a friend chooses to share them.'}</p>
    ${list.length ? list.map((m, i) => `<div class="lg${m.me ? ' me' : ''}"><span class="n">${i + 1}</span>${av(m)}<span><b>${esc(m.name)}${m.me ? ' (you)' : ''}</b><small>${m.rk ? esc(m.rk.name) : ''}${k !== 'all' && m.dt[k].kg ? ` · ${m.dt[k].kg} kg 1-rep max` : ''}</small></span><span class="pts num">${val(m)}</span></div>`).join('') : `<p class="hint">Nobody has logged ${k === 'all' ? 'a main lift' : 'this lift'} yet.</p>`}</section>`;
  }
  if (tab === 'improved') {
    const list = rows.filter(m => m.imp != null && m.rk).sort((a, b) => b.imp - a.imp);
    h += `<section class="card"><h2>Most improved · ${new Date().toLocaleDateString(LANG() === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long' })}</h2><p class="hint">Strength score gained this month. Fair for every level.</p>
    ${list.length ? list.map((m, i) => `<div class="lg${m.me ? ' me' : ''}"><span class="n">${i + 1}</span>${av(m)}<span><b>${esc(m.name)}${m.me ? ' (you)' : ''}</b><small>${esc(m.rk.name)}</small></span><span class="pts num ${m.imp > 0 ? 'up' : ''}">${m.imp > 0 ? '+' : ''}${m.imp}%</span></div>`).join('') : `<p class="hint">Starts once friends have logged main lifts.</p>`}</section>`;
  }
  h += `<section class="card"><div class="setup-r"><span>Show me in leagues and ranks</span><div class="seg"><button data-act="rankvis" data-v="1" aria-pressed="${!hidden}">On</button><button data-act="rankvis" data-v="0" aria-pressed="${!!hidden}">Off</button></div></div>
  ${hidden ? '' : `<div class="setup-r"><span>Show my weights to friends</span><div class="seg"><button data-act="showkg" data-v="1" aria-pressed="${!!S.settings.showKg}">On</button><button data-act="showkg" data-v="0" aria-pressed="${!S.settings.showKg}">Off</button></div></div>`}</section>`;
  return h;
}
function leagueHelp() {
  SH = { scope: 'lg' }; $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="How league points work"><div class="grab" aria-hidden="true"></div><div class="spread"><h2>How league points work</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div><p class="hint">Same rules for everyone. Weeks run Saturday to Friday; a season is 4 weeks.</p>
  <div class="prow"><span>Locked-in day (all four pillars)</span><b>+10</b></div><div class="prow"><span>Finished workout</span><b>+5</b></div><div class="prow"><span>Cardio after lifting, or a sport (once a day)</span><b>+2</b></div><div class="prow"><span>New record (normal sets, max 3 a workout)</span><b>+3</b></div><div class="prow"><span>Hit this week’s focus</span><b>+5</b></div><div class="prow"><span>Cheer a friend (once a day)</span><b>+1</b></div>
  <p class="hint" style="margin-top:10px">Imported workouts don’t earn points. You can hide yourself from leagues and ranks at the bottom of the Friends tab.</p><button class="btn primary block" data-act="closesheet">Got it</button></div>`;
}
function friendsHTML() {
  const st = S.settings;
  if (!st.group) return `<section class="card" id="sec-friends"><div class="card-h"><h2>Friends</h2></div>
  <p class="hint">Make a group, send the code to your friends, and you all see each other’s day count, streak and whether today is locked in. Only those numbers are shared, never your food, weight or photos.</p>
  <div class="setup-r"><label for="fb-name">Your name on the board</label><input class="in" id="fb-name" maxlength="24" value="${esc(boardName())}"></div>
  <div class="row"><button class="btn primary" data-act="grpnew">Create a group</button></div>
  <div class="row"><input class="in grow" id="fb-code" maxlength="8" placeholder="Friend’s group code" autocapitalize="characters" autocomplete="off"><button class="btn" data-act="grpjoin">Join</button></div></section>`;
  const rows = friendRows(), t = today(), gs = groupStreak();
  return `<section class="card" id="sec-friends"><div class="card-h"><h2>Friends</h2><span class="state s-opt num">${esc(st.group)}</span></div>
  ${challengeHTML()}${gs ? `<div class="gchain${gs.todayAll ? ' all' : ''}"><b class="num">${gs.n}</b><span>${gs.n === 1 ? 'day' : 'days'} in a row that <em>everyone</em> locked in${gs.todayAll ? ' · all of you are done today' : ''}</span></div>` : ''}
  <div class="board">${rows.length ? rows.map(m => `<div class="brow${m.me ? ' me' : ''}"><div class="bn"><b>${esc(m.name)}${m.me ? ' (you)' : ''}</b><small class="num">${m.reset && m.reset.date === t ? `Started over today · attempt ${m.reset.attempt} · ` : ''}Day ${m.day} · streak ${m.streak}${m.attempt > 1 && !(m.reset && m.reset.date === t) ? ` · attempt ${m.attempt}` : ''}</small></div>
    <div class="bend">${m.victory ? pill('done', '90 days done') : !m.fresh ? `<span class="state s-todo">Last seen ${m.date ? fmt(m.date) : '—'}</span>` : m.done ? pill('done', 'Locked in') : `<span class="state s-todo num">${m.parts}/4 today</span>`}
    ${m.me ? '' : `<div class="cbtns">${m.fresh && m.done ? `<button class="cb" data-act="cheer" data-v="${m.id}:fire" ${cheerSent(m.id, 'fire') ? 'disabled' : ''} aria-label="Send respect to ${esc(m.name)}">🔥</button>` : `<button class="cb" data-act="cheer" data-v="${m.id}:cheer" ${cheerSent(m.id, 'cheer') ? 'disabled' : ''} aria-label="Cheer ${esc(m.name)}">👏</button>`}${!m.done ? `<button class="cb" data-act="cheer" data-v="${m.id}:nudge" ${cheerSent(m.id, 'nudge') ? 'disabled' : ''} aria-label="Nudge ${esc(m.name)} to finish today">⏰</button>` : ''}</div>`}</div></div>`).join('') : '<p class="hint">Loading the board… (needs internet the first time)</p>'}</div>
  <div class="row"><button class="btn" data-act="grpinvite">Invite friends</button><button class="link" data-act="grpleave">Leave group</button></div>
  <div class="setup-r"><label for="fb-name">Your name on the board</label><input class="in" id="fb-name" maxlength="24" value="${esc(boardName())}"></div></section>`;
}
// photos are large: load them only when Progress is opened
function photosOn() {
  if (S.photosOn || !S.user) return;
  S.photosOn = true;
  syncCol('photos', qs => { qs.docs.forEach(x => { const v = x.data(); if (v.deleted || !v.data) delete S.photos[x.id]; else S.photos[x.id] = v; }); if (S.view === 'progress') render(); });
}
// buttons on the workout notification (Android)
let pendingWo = new URLSearchParams(location.search).get('wo');
if (pendingWo) history.replaceState(null, '', location.pathname + location.hash);
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.wo) { if (S.settings && S.got.days) TR.notifAction(e.data.wo); else pendingWo = e.data.wo; } });
setInterval(() => { if (pendingWo && S.settings && S.got.days) { const a = pendingWo; pendingWo = null; TR.notifAction(a); } }, 500);
onAuthStateChanged(auth, u => {
  S.user = u; S.authReady = true; checkOwner(u);
  if (u) subscribe(); else { S.settings = null; S.days = {}; S.got = { settings: false, days: false }; }
  draw();
});
function go(v) { S.panel = null; S.view = VIEWS.includes(v) ? v : 'today'; if (location.hash !== '#' + S.view) history.replaceState(null, '', '#' + S.view); window.scrollTo(0, 0); draw(); }
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v === 'water') { S.quickWater = true; return draw(); } if (v === 'sport') { S.quickSport = true; return draw(); } if (VIEWS.includes(v) && v !== S.view) { S.view = v; draw(); } });
window.addEventListener('online', () => { S.online = true; render(); });
window.addEventListener('offline', () => { S.online = false; render(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
setInterval(render, 60000);
{ const h = location.hash.slice(1); if (VIEWS.includes(h)) S.view = h; if (h === 'water') S.quickWater = true; if (h === 'sport') S.quickSport = true; }
draw();
// updates: check whenever the app is opened; when a new version takes over, reload once so it shows straight away
if ('serviceWorker' in navigator) {
  const hadCtl = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtl && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => { }); });
  }).catch(() => { });
}
