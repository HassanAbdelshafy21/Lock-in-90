import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import * as C from './core.js';
import { EX, POSE, figSVG, YT, LINES, FOODS, COACH_MEALS, DEFAULT_SUPPS, SLOTS, CARDIO_MODES } from './data.js';

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
const REMINDERS = [['morning', '9:00 · Plan for the day'], ['water', 'Every 2 h, 11:00–19:00 · Water pace (only if behind)'], ['burner', '15:30 · Fat burner cutoff (only if cap 1 taken)'], ['stamina', '17:00 · Stamina session (stamina days, if not done)'], ['evening', '20:40 · What’s still missing'], ['final', '23:00 · Last hour warning (only if incomplete)'], ['meals', '45 min after each meal time · Log reminder (off by default)']];

const fbApp = initializeApp(FIREBASE);
const auth = getAuth(fbApp);
let db;
try { db = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = getFirestore(fbApp); }

/* ---------- state ---------- */
const S = {
  user: null, authReady: false, settings: null, days: {}, checkins: {}, foods: {}, acts: {}, photos: {}, meta: {},
  got: { settings: false, days: false }, pend: { s: false, d: false }, online: navigator.onLine,
  view: 'today', trainTab: 'cali', phase: null, editDate: null, openMeal: null, confirm: null, deferred: false, unsub: [], photosOn: false, cut: 50
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o ?? {}));
const L = ml => String(C.round(ml / 1000, 2));
const now = () => C.nowIn();
const today = () => now().date;
const fmt = s => C.parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const editDate = () => { const g = now().hour < 3 ? C.addDays(today(), -1) : null; return S.editDate && S.editDate === g ? g : today(); };
const uid = () => S.user && S.user.uid;
const up = p => `users/${uid()}/${p}`;
const kc = v => Math.round(v || 0);

/* ---------- writes (debounced, one per document, queued offline by Firestore) ---------- */
const timers = {};
function save(path, get, delay = 400) {
  clearTimeout(timers[path]);
  timers[path] = setTimeout(() => {
    delete timers[path];
    setDoc(doc(db, up(path)), clone(get())).catch(e => toast(e && e.code === 'permission-denied' ? 'Saving was refused. Check the Firestore rules.' : 'Couldn’t save that change.'));
  }, delay);
}
const busy = path => !!timers[path];
function dayDoc(date) {
  const d = S.days[date] || (S.days[date] = { date });
  d.meals = d.meals || {}; d.skip = d.skip || {}; d.extras = d.extras || []; d.supps = d.supps || {}; d.cali = d.cali || {}; d.stamina = d.stamina || []; d.water = d.water || 0;
  return d;
}
const saveDay = date => save('days/' + date, () => dayDoc(date));
const saveSettings = () => save('settings/main', () => S.settings);
function savePlan() { S.settings.planLog = S.settings.planLog || {}; S.settings.planLog[today()] = clone(S.settings.meals); saveSettings(); }
function planHistoryHTML(st) {
  const keys = Object.keys(st.planLog || {}).sort();
  if (keys.length < 2) return '';
  return `<details><summary class="hint">Plan history (${keys.length} versions)</summary><ul class="list">${keys.slice().reverse().map(k => { const s = C.sumItems((st.planLog[k] || []).flatMap(m => m.items || [])); return `<li><span>From ${fmt(k)}</span><span class="num">${(st.planLog[k] || []).length} meals · ${kc(s.k)} kcal · ${kc(s.p)} g protein</span></li>`; }).join('')}</ul></details>`;
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
  if (a && a.closest && a.closest('main') && a.matches('input:not([type=file]):not([type=range]),textarea,select')) { S.deferred = true; return; }
  draw();
}
document.addEventListener('focusout', () => setTimeout(() => { if (S.deferred) { S.deferred = false; render(); } }, 0));

/* ---------- top-level draw ---------- */
function draw() {
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.v === S.view ? 'page' : 'false'));
  $('tabs').hidden = !S.user || !S.settings;
  const m = $('main');
  if (!S.authReady) { $('top').innerHTML = topIdle(); m.innerHTML = `<div class="card hint">Loading…</div>`; return; }
  if (!S.user) { $('top').innerHTML = topIdle(); m.innerHTML = signinHTML(); return; }
  if (!S.got.settings) { $('top').innerHTML = topIdle(); m.innerHTML = `<div class="card hint">Loading your challenge…</div>`; return; }
  if (!S.settings) { $('top').innerHTML = topIdle(); m.innerHTML = welcomeHTML(); return; }
  if (S.quickWater && S.got.days) { S.quickWater = false; const dd = dayDoc(today()); dd.water = (dd.water || 0) + 250; saveDay(today()); S.view = 'today'; history.replaceState(null, '', '#today'); toast(`+250 ml · ${L(C.waterTotal(dd))} L today`); }
  const R = C.computeRun(S.settings, S.days, now());
  $('top').innerHTML = topHTML(R);
  if (S.view === 'progress') photosOn();
  m.innerHTML = bannersHTML(R) + (S.view === 'train' ? trainHTML(R) : S.view === 'progress' ? progressHTML(R) : S.view === 'setup' ? setupHTML(R) : todayHTML(R));
}
const topIdle = () => `<div class="top-row"><div><div class="daylabel">90-day challenge</div><div class="daynum">LOCK IN</div></div></div>`;
function syncChip() {
  if (!S.online) return `<span class="chip sync off">Offline · saved on phone</span>`;
  if (S.pend.s || S.pend.d || Object.keys(timers).length) return `<span class="chip sync pend">Syncing</span>`;
  return `<span class="chip sync">Synced</span>`;
}
function topHTML(R) {
  const t = today();
  return `<div class="top-row"><div><div class="daylabel">Day · attempt ${R.attemptNo}</div><div class="daynum num">${Math.min(R.dayNum, 90)}<small>/ 90</small></div></div>
  <div class="chips"><span class="chip hot">Streak <b class="num">${R.done}</b></span>${syncChip()}</div></div>
  <div class="strip" role="img" aria-label="${R.done} of 90 days locked in">${Array.from({ length: 90 }, (_, i) => { const d = C.addDays(R.attemptStart, i); return `<i class="${d <= t && C.evalDay(S.settings, S.days[d], d).complete ? 'd' : d === t ? 't' : ''}"></i>`; }).join('')}</div>`;
}
function bannersHTML(R) {
  let h = '';
  const n = now();
  if (R.victory) return banner('good', '90 days. Done.', `You completed all 90 days on attempt ${R.attemptNo}. Take your Day 90 photo and compare it with Day 1 in Progress.`);
  const ev = R.todayEval;
  if (R.critical && !ev.complete) h += banner('bad', 'Never miss twice', 'Yesterday broke the chain and reset you to Day 1. Today is non-negotiable.');
  if (ev.offPlan) h += banner('bad', 'Today can’t count right now', 'Something off-plan is logged. If it was a mistake, change it back.');
  else if (!ev.complete && n.hour >= 21 && S.view === 'today') { const left = 24 - n.hour; h += banner('warn', `${left} hour${left === 1 ? '' : 's'} left to lock in today`, 'Still missing:', ev.missing); }
  const m = C.MILES.find(x => x[0] === R.done);
  if (ev.complete && m) h += banner('good', `Milestone: Day ${m[0]}`, `${m[1]}. Keep the chain going.`);
  if (C.weekday(today()) === 5 && S.view === 'today') h += `<div class="banner b-info"><strong>Weekly review is ready</strong><p><button class="link" data-act="tab" data-v="progress">Open it in Progress</button></p></div>`;
  return h;
}

/* ---------- sign-in and welcome ---------- */
function signinHTML() {
  return `<section class="signin"><h1>LOCK<br><span>IN 90</span></h1><p class="hint">Sign in once. After that the app works offline and syncs when you’re back online.</p>
  <button class="btn primary block" data-act="signin">Sign in with Google</button>
  <span class="sub">or with email (works in every browser, best on iPhone)</span>
  <form class="form" id="email-form" style="text-align:left"><label class="full">Email<input class="in" id="si-email" type="email" autocomplete="email" required></label>
  <label class="full">Password<input class="in" id="si-pass" type="password" autocomplete="current-password" minlength="6" required></label>
  <button class="btn primary" type="submit" data-mode="in">Sign in</button><button class="btn" type="button" data-act="signup">Create account</button></form>
  <button class="link" data-act="resetpw">Forgot password?</button></section>`;
}
function waterSelect(id, attr, val) { return `<select class="in" id="${id}" ${attr}>${WATER_OPTS.map(v => `<option value="${v}" ${v === val ? 'selected' : ''}>${L(v)} L</option>`).join('')}</select>`; }
function welcomeHTML() {
  return `<section class="card"><div class="card-h"><h2>Start your 90 days</h2></div>
  <p class="hint">Every day needs every planned meal on plan, your water goal, that day’s training and your core supplements. Miss any of them and the counter goes back to Day 1. Your coach’s meal plan is already loaded; edit it in Setup.</p>
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
function newSettings(o = {}) {
  return {
    startDate: o.startDate || today(), waterGoal: o.waterGoal || 4000, startWeight: o.startWeight || null, goalWeight: o.goalWeight || null,
    plan: { ...C.DEFAULT_PLAN }, gymTime: 'am',
    meals: clone(COACH_MEALS), planLog: { [o.startDate || today()]: clone(COACH_MEALS) }, supps: clone(DEFAULT_SUPPS), stamina: { on: true, days: [1, 3, 5] },
    reminders: Object.fromEntries(REMINDERS.map(r => [r[0], r[0] !== 'meals'])), created: new Date().toISOString()
  };
}

/* ---------- TODAY ---------- */
function arc(cx, cy, r, a0, a1) { const R2 = a => a * Math.PI / 180; const x0 = cx + r * Math.cos(R2(a0)), y0 = cy + r * Math.sin(R2(a0)), x1 = cx + r * Math.cos(R2(a1)), y1 = cy + r * Math.sin(R2(a1)); return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`; }
function todayHTML(R) {
  const t = today(), n = now(), grace = n.hour < 3 ? C.addDays(t, -1) : null, date = editDate();
  const st = S.settings, d = S.days[date] || {}, ev = C.evalDay(st, d, date), P = ev.P;
  const line = LINES[((R.dayNum - 1) % LINES.length + LINES.length) % LINES.length];
  const mealsBad = P.off.length || P.offExtra.length;
  const parts = [
    { v: P.pm.length ? P.clean / P.pm.length : 0, c: mealsBad ? 'bad' : P.mealsOk ? 'done' : '' },
    { v: Math.min(1, P.w / P.goal), c: P.w >= P.goal ? 'done' : 'water' },
    { v: P.trained ? 1 : 0, c: 'done' },
    { v: P.req.length ? P.sDone / P.req.length : 1, c: P.sDone === P.req.length ? 'done' : '' }
  ];
  const pdone = [P.mealsOk, P.w >= P.goal, P.trained, P.sDone === P.req.length].filter(Boolean).length;
  let ring = `<svg viewBox="0 0 150 150" aria-hidden="true">`;
  parts.forEach((pt, i) => { const a0 = -90 + i * 90 + 7, a1 = a0 + 76; ring += `<path class="rt" d="${arc(75, 75, 62, a0, a1)}"/>`; if (pt.v > 0) ring += `<path class="rf ${pt.c}" d="${arc(75, 75, 62, a0, a0 + Math.max(.5, (a1 - a0) * Math.min(1, pt.v)))}"/>`; });
  ring += `</svg>`;
  let h = '';
  if (grace) h += `<div class="phases" role="group" aria-label="Day being edited"><button data-act="editdate" data-v="${grace}" aria-pressed="${date === grace}">Yesterday · until 3 AM</button><button data-act="editdate" data-v="${t}" aria-pressed="${date === t}">Today</button></div>`;
  h += `<section class="card"><div class="hero-in"><div class="ringbox">${ring}<div class="ringc"><b class="num">${pdone}<span style="font-size:20px;color:var(--muted)">/4</span></b><span>${ev.complete ? 'locked in' : 'done'}</span></div></div>
  <div class="hero-side"><span class="sub">${esc(C.DAYNAMES[C.weekday(date)])} · ${fmt(date)}</span><p class="quote">${esc(line)}</p></div></div>
  <div class="legend">
   <button data-act="jump" data-v="sec-meals" class="${mealsBad ? 'no' : P.mealsOk ? 'ok' : ''}"><b>Meals</b><span class="num">${P.clean}/${P.pm.length}</span></button>
   <button data-act="jump" data-v="sec-water" class="${P.w >= P.goal ? 'ok' : 'wt'}"><b>Water</b><span class="num">${L(P.w)}/${L(P.goal)} L</span></button>
   <button data-act="jump" data-v="sec-train" class="${P.trained ? 'ok' : ''}"><b>Train</b><span>${P.tt === 'rest' ? 'Rest' : P.trained ? 'Done' : 'To do'}</span></button>
   <button data-act="jump" data-v="sec-supps" class="${P.sDone === P.req.length ? 'ok' : 'pr'}"><b>Supps</b><span class="num">${P.sDone}/${P.req.length}</span></button>
  </div>
  ${ev.complete ? `<div class="lockline">Every box is checked. This day counts.</div>` : `<ul class="missing">${ev.missing.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`}</section>`;
  h += mealsHTML(date, d, P);
  h += waterHTML(P);
  h += trainCardHTML(date, d, P);
  h += suppsHTML(date, d, P);
  h += bodyHTML(date, d);
  return h;
}
function macrosHTML(tot, target) {
  const tk = kc(target.k), tp = kc(target.p);
  const cell = (label, v, unit, target) => `<div class="mac"><span>${label}</span><b class="num">${kc(v)}<small>${target ? ' / ' + target : ''} ${unit}</small></b>${target ? `<div class="mbar"><i class="${v > target * 1.05 ? 'over' : ''}" style="width:${Math.min(100, v / target * 100)}%"></i></div>` : ''}</div>`;
  return `<div class="macros">${cell('Calories', tot.k, 'kcal', tk)}${cell('Protein', tot.p, 'g', tp)}${cell('Carbs', tot.c, 'g')}${cell('Fat', tot.f, 'g')}</div>`;
}
const dropTag = it => C.isDrink(it) ? ' <span class="state s-water">counts as water</span>' : '';
function itemsEditor(items, scope) {
  return `<div class="items">${items.length ? items.map((it, i) => { const m = C.itemMacros(it); return `<div class="itm"><div class="nm">${esc(it.name)}${dropTag(it)}<small>${kc(m.k)} kcal · ${C.round(m.p, 1)} g protein</small></div><label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(it.g, 1)}" data-grams="${scope}:${i}" aria-label="${esc(it.name)} ${C.isDrink(it) ? 'millilitres' : 'grams'}">${C.isDrink(it) ? 'ml' : 'g'}</label><button class="x" data-act="rmitem" data-v="${scope}:${i}" aria-label="Remove ${esc(it.name)}">×</button></div>`; }).join('') : '<p class="hint">No foods yet.</p>'}
  <button class="btn small" data-act="addfood" data-v="${scope}">+ Add food</button></div>`;
}
function mealsHTML(date, d, P) {
  const st = S.settings, meals = d.meals || {}, tot = C.dayTotals(st, d), plan = C.mealsOn(st, date);
  const unl = plan.filter(m => !(d.skip || {})[m.id] && !(meals[m.id] && meals[m.id].status)).length;
  let h = `<section class="card" id="sec-meals"><div class="card-h"><h2>Meals</h2>${pill(P.off.length || P.offExtra.length ? 'bad' : P.mealsOk ? 'done' : 'todo', P.off.length || P.offExtra.length ? 'Off-plan' : `${P.clean} / ${P.pm.length} on plan`)}</div>
  ${macrosHTML(tot, C.planTargets(st, d, date))}${unl ? `<button class="btn good" data-act="allplan">Log ${unl === plan.length ? 'all meals' : 'the other ' + unl} as planned</button>` : ''}<div class="tl">`;
  plan.forEach((m, i) => {
    const md = meals[m.id] || {}, skip = d.skip && d.skip[m.id], status = skip ? 'skip' : md.status || '';
    const plan = C.sumItems(m.items);
    const logged = md.status ? C.sumItems(md.items || []) : null;
    const open = S.openMeal === m.id && (md.status === 'swap' || md.status === 'off');
    h += `<div class="meal ${status}"><div class="mi">${svgI(mealIcon(m, i))}</div><div class="mbody">
      <div class="spread"><div class="meal-n">${esc(m.name)} <span>${esc(m.time || '')}</span></div>${skip ? `<button class="link" data-act="unskip" data-v="${m.id}">Undo</button>` : `<button class="link" data-act="skip" data-v="${m.id}">Not today</button>`}</div>`;
    if (skip) { h += `<p class="meal-sum">Not part of today’s plan.</p></div></div>`; return; }
    h += `<div class="meal-sum">${md.status ? `Logged <b>${kc(logged.k)} kcal · ${C.round(logged.p, 1)} g protein</b>` : `Plan: ${esc(m.items.map(x => x.name.split(',')[0]).join(', ')) || 'no foods set'} · <b>${kc(plan.k)} kcal</b>`}</div>
      <div class="seg wide" role="group" aria-label="${esc(m.name)}"><button class="clean" data-act="meal" data-id="${m.id}" data-v="plan" aria-pressed="${md.status === 'plan'}">As planned</button><button class="clean" data-act="meal" data-id="${m.id}" data-v="swap" aria-pressed="${md.status === 'swap'}">Changed</button><button class="off" data-act="meal" data-id="${m.id}" data-v="off" aria-pressed="${md.status === 'off'}">Off-plan</button></div>`;
    if (md.status === 'swap' || md.status === 'off') {
      h += open ? `${itemsEditor(md.items || [], 'meal:' + m.id)}<input class="note" id="note-${m.id}" data-note="${m.id}" placeholder="Note (optional)" value="${esc(md.note || '')}"><button class="link" data-act="closemeal">Done editing</button>`
        : `<button class="link" data-act="openmeal" data-v="${m.id}">Edit foods (${(md.items || []).length})</button>`;
    }
    h += `</div></div>`;
  });
  h += `</div>`;
  const ex = d.extras || [];
  h += `<div class="sgrp"><span class="sub">Extras outside your meals</span>${ex.length ? `<div class="items">${ex.map((it, i) => { const mm = C.itemMacros(it); return `<div class="itm"><div class="nm">${esc(it.name)} ${it.off ? '<span class="state s-bad">off-plan</span>' : ''}${dropTag(it)}<small>${kc(mm.k)} kcal · ${C.round(mm.p, 1)} g protein</small></div><label class="g"><input type="number" inputmode="decimal" min="0" step="any" value="${C.round(it.g, 1)}" data-grams="extra:${i}" aria-label="${esc(it.name)} ${C.isDrink(it) ? 'millilitres' : 'grams'}">${C.isDrink(it) ? 'ml' : 'g'}</label><button class="x" data-act="rmitem" data-v="extra:${i}" aria-label="Remove">×</button></div>`; }).join('')}</div>` : ''}
  <button class="btn small" data-act="addfood" data-v="extra">+ Log an extra (drink, snack, cheat)</button></div></section>`;
  return h;
}
function waterHTML(P) {
  const pct = Math.min(100, P.w / P.goal * 100); let ticks = '';
  for (let l = 1; l * 1000 < P.goal; l++) ticks += `<i class="tick${l * 1000 <= P.w ? ' in' : ''}" style="bottom:${(l * 1000 / P.goal * 100).toFixed(1)}%"><span>${l}L</span></i>`;
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
  if (P.tt === 'rest') h += `<p class="hint">${C.TT.rest.sub}. Change your weekly plan in Setup.</p>`;
  else h += `<button class="check" data-act="train" aria-pressed="${!!d.trainingDone}"><span class="box"></span><span><b>${C.TT[P.tt].label}</b><span>${C.TT[P.tt].sub}</span></span></button>${P.tt === 'cali' ? `<button class="btn primary block" data-act="tab" data-v="train">Open today’s session</button>` : ''}`;
  if (acts.length) h += `<div class="acts">${acts.map(a => `<div class="act"><span><b>${esc(a.name || a.type)}</b> · from Strava</span><span class="num">${a.min} min${a.dist ? ' · ' + C.round(a.dist / 1000, 2) + ' km' : ''}</span></div>`).join('')}</div>`;
  h += `<div class="spread"><span class="hint">Gym time today</span><div class="seg" role="group" aria-label="Gym time"><button data-act="gymtime" data-v="am" aria-pressed="${gym === 'am'}">Morning</button><button data-act="gymtime" data-v="pm" aria-pressed="${gym === 'pm'}">Night</button></div></div></section>`;
  return h;
}
function suppsHTML(date, d, P) {
  const gym = d.gymTime || S.settings.gymTime || 'am', supps = S.settings.supps || [];
  const groups = {};
  supps.forEach(s => { const slot = s[gym] || 'Any time'; (groups[slot] = groups[slot] || []).push(s); });
  const order = Object.keys(groups).sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b));
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
  return `<section class="card"><div class="card-h"><h2>Body &amp; recovery</h2>${pill('opt', 'Optional')}</div>
  <div class="form"><label>Morning weight (kg)<input class="in" id="b-weight" type="number" inputmode="decimal" step="0.1" data-dayfield="weight" value="${d.weight || ''}"></label>
  <label>Sleep last night<select class="in" id="b-sleep" data-dayfield="sleep"><option value="">–</option>${sleeps.map(v => `<option value="${v}" ${d.sleep === v ? 'selected' : ''}>${v} h</option>`).join('')}</select></label>
  <label>Resting heart rate<input class="in" id="b-rhr" type="number" inputmode="numeric" data-dayfield="rhr" placeholder="bpm, on waking" value="${d.rhr || ''}"></label></div>
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
function trainHTML(R) {
  let h = `<div class="seg wide" role="group" aria-label="Training type"><button data-act="traintab" data-v="cali" aria-pressed="${S.trainTab === 'cali'}">Calisthenics</button><button data-act="traintab" data-v="stamina" aria-pressed="${S.trainTab === 'stamina'}">Stamina</button></div>`;
  return h + (S.trainTab === 'stamina' ? staminaHTML() : caliHTML());
}
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
    <div class="sets">${Array.from({ length: n }, (_, i) => `<label for="set-${e.id}-${i}">Set ${i + 1}<input id="set-${e.id}-${i}" class="${vals[i] >= e.top ? 'hit' : ''}" type="number" inputmode="numeric" min="0" data-set="${e.id}" data-i="${i}" placeholder="${e.unit === 's' ? 'sec' : 'reps'}" value="${vals[i] > 0 ? vals[i] : ''}"></label>`).join('')}
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
function barsHTML(vals, unit, label) {
  const W = 320, H = 120, pb = 18, max = Math.max(1, ...vals), bw = (W - 10) / Math.max(vals.length, 1);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${vals.map((v, i) => { const hh = (H - pb - 14) * v / max; return `<rect x="${5 + i * bw + 3}" y="${H - pb - hh}" width="${bw - 6}" height="${Math.max(hh, v ? 2 : 0)}" rx="3" fill="${i === vals.length - 1 ? 'var(--spark)' : 'var(--accent)'}"/><text x="${5 + i * bw + bw / 2}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="IBM Plex Mono,monospace">W${i + 1}</text>${v ? `<text x="${5 + i * bw + bw / 2}" y="${H - pb - hh - 3}" text-anchor="middle" font-size="9" fill="var(--ink-2)" font-family="IBM Plex Mono,monospace">${v}</text>` : ''}`; }).join('')}</svg><p class="hint">${esc(label)}</p></div>`;
}

/* ---------- PROGRESS ---------- */
function weekReview() {
  const t = today(), st = S.settings, days = [];
  for (let i = 6; i >= 0; i--) days.push(C.addDays(t, -i));
  const valid = days.filter(d => d >= st.startDate && d < t || (d === t));
  let locked = 0; const miss = { Meals: 0, Water: 0, Training: 0, Supplements: 0 };
  let kS = 0, pS = 0, tkS = 0, tpS = 0, nN = 0, sl = 0, slN = 0;
  valid.forEach(d => {
    const day = S.days[d] || {}, ev = C.evalDay(st, day, d);
    if (ev.complete) locked++;
    if (d < t) { if (!ev.P.mealsOk) miss.Meals++; if (ev.P.w < ev.P.goal) miss.Water++; if (!ev.P.trained) miss.Training++; if (ev.P.sDone < ev.P.req.length) miss.Supplements++; }
    const tot = C.dayTotals(st, day); if (tot.k > 0) { const tg = C.planTargets(st, day, d); kS += tot.k; pS += tot.p; tkS += tg.k; tpS += tg.p; nN++; }
    if (day.sleep) { sl += day.sleep; slN++; }
  });
  const cardio = stamSessions(days[0], t).reduce((s, x) => s + (x.min || 0), 0);
  const worst = Object.entries(miss).sort((a, b) => b[1] - a[1])[0];
  const wAvg = (end) => { const v = []; for (let i = 0; i < 7; i++) { const dd = S.days[C.addDays(end, -i)]; if (dd && dd.weight) v.push(dd.weight); } return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const wNow = wAvg(t), wPrev = wAvg(C.addDays(t, -7));
  return { locked, miss, past: valid.filter(x => x < t).length, wNow, n: valid.length, worst, kcal: nN ? kS / nN : null, prot: nN ? pS / nN : null, tk: nN ? tkS / nN : null, tp: nN ? tpS / nN : null, sleep: slN ? sl / slN : null, cardio, wDelta: wNow && wPrev ? wNow - wPrev : null };
}
function progressHTML(R) {
  const st = S.settings, t = today(), rv = weekReview();
  let h = `<section class="card"><div class="card-h"><h2>Last 7 days</h2>${pill(rv.locked === rv.n ? 'done' : 'todo', `${rv.locked} / ${rv.n} locked in`)}</div>
  <div class="review"><div><b>${rv.worst && rv.worst[1] ? esc(rv.worst[0]) : 'None'}</b><span>${rv.worst && rv.worst[1] ? `Most missed (${rv.worst[1]} day${rv.worst[1] === 1 ? '' : 's'})` : 'Nothing missed'}</span></div>
  <div><b class="num">${rv.prot ? kc(rv.prot) + ' g' : '—'}</b><span>Avg protein${rv.tp ? ` · plan ${kc(rv.tp)} g` : ''}</span></div>
  <div><b class="num">${rv.kcal ? kc(rv.kcal) : '—'}</b><span>Avg calories${rv.tk ? ` · plan ${kc(rv.tk)}` : ''}</span></div>
  <div><b class="num">${rv.cardio} min</b><span>Cardio</span></div>
  <div><b class="num">${rv.sleep ? C.round(rv.sleep, 1) + ' h' : '—'}</b><span>Avg sleep</span></div>
  <div><b class="num">${rv.wDelta == null ? '—' : (rv.wDelta > 0 ? '+' : '') + C.round(rv.wDelta, 1) + ' kg'}</b><span>Weight trend (7-day avg)</span></div></div>
  <button class="btn" data-act="share">Share this week with my coach</button></section>`;
  h += `<div class="stats"><div class="stat feature"><div class="big num">${R.done}</div><span>Days locked in</span></div><div class="stat"><div class="big num">${Math.min(R.dayNum, 90)}</div><span>Day now</span></div><div class="stat"><div class="big num">${R.best}</div><span>Best streak</span></div><div class="stat"><div class="big num">${Math.floor(R.done / 7)}</div><span>Perfect weeks</span></div></div>`;
  const ms = C.MILES.map(m => m[0]);
  h += `<section class="card"><div class="card-h"><h2>The chain</h2><span class="hint">Since ${fmt(R.attemptStart)}</span></div><div class="grid90">${Array.from({ length: 90 }, (_, i) => { const dt = C.addDays(R.attemptStart, i); let c = ''; if (dt <= t && C.evalDay(st, S.days[dt], dt).complete) c = 'done'; else if (dt === t) c = 'today'; else if (dt === R.grace) c = 'open'; if (ms.includes(i + 1)) c += ' m'; return `<i class="${c}" title="Day ${i + 1} · ${fmt(dt)}">${i + 1}</i>`; }).join('')}</div></section>`;
  h += `<section class="card"><div class="card-h"><h2>Milestones</h2>${pill('todo', `${C.MILES.filter(m => R.done >= m[0]).length} / ${C.MILES.length}`)}</div><div class="miles">${C.MILES.map(m => `<div class="mile ${R.done >= m[0] ? 'got' : ''}"><b class="num">${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div></section>`;
  if (R.attempts.length) h += `<section class="card"><div class="card-h"><h2>Attempts</h2></div><ul class="list">${R.attempts.map((a, i) => `<li><span>Attempt ${i + 1}</span><span class="num">${a.len} day${a.len === 1 ? '' : 's'} · broke ${fmt(a.fail)}</span></li>`).join('')}<li><span>Attempt ${R.attemptNo}</span><span class="num">${R.done} days and counting</span></li></ul></section>`;
  // weight
  const pts = {};
  if (st.startWeight) pts[st.startDate] = st.startWeight;
  Object.values(S.checkins).forEach(c => { if (c.weight) pts[c.date] = c.weight; });
  Object.keys(S.days).forEach(k => { if (S.days[k].weight) pts[k] = S.days[k].weight; });
  const arr = Object.keys(pts).sort().map(k => ({ date: k, weight: pts[k] }));
  h += `<section class="card"><div class="card-h"><h2>Weight</h2>${arr.length ? pill('todo', `${arr[arr.length - 1].weight} kg`) : ''}</div>${arr.length >= 2 ? weightChart(arr, st.goalWeight) + projHTML(arr, st, R.attemptStart) : '<p class="hint">Log your morning weight in Today, or a weekly check-in below. The trend appears after two weigh-ins.</p>'}</section>`;
  // nutrition 14 days
  const kd = []; for (let i = 13; i >= 0; i--) { const dd = C.addDays(t, -i); kd.push(kc(C.dayTotals(st, S.days[dd] || {}).k)); }
  if (kd.some(v => v)) h += `<section class="card"><div class="card-h"><h2>Calories</h2><span class="hint">Last 14 days</span></div>${barsHTML(kd, 'kcal', 'Calories per day, oldest to today').replace(/>W(\d+)</g, (m, n) => `>${n}<`)}</section>`;
  // check-in
  const cks = Object.values(S.checkins).sort((a, b) => a.date < b.date ? -1 : 1);
  h += `<section class="card"><div class="card-h"><h2>Weekly check-in</h2><span class="hint">Same time, same light</span></div>
  <div class="form"><label>Date<input class="in" id="ck-date" type="date" value="${t}" max="${t}"></label><label>Weight (kg)<input class="in" id="ck-weight" type="number" inputmode="decimal" step="0.1"></label>
  <label>Waist (cm)<input class="in" id="ck-waist" type="number" inputmode="decimal" step="0.5"></label><label>Chest (cm)<input class="in" id="ck-chest" type="number" inputmode="decimal" step="0.5"></label>
  <label>Arm (cm)<input class="in" id="ck-arm" type="number" inputmode="decimal" step="0.5"></label><label>Hips (cm)<input class="in" id="ck-hips" type="number" inputmode="decimal" step="0.5"></label>
  <label class="full">Progress photo<input class="in" id="ck-photo" type="file" accept="image/*"></label>
  <button class="btn primary full" data-act="checkin">Save check-in</button></div>`;
  const ph = Object.values(S.photos).sort((a, b) => a.date < b.date ? -1 : 1);
  if (ph.length >= 2) {
    const a = ph[0], b = ph[ph.length - 1];
    h += `<div class="compare" style="--cut:${S.cut}%"><img src="${b.data}" alt="Latest photo ${fmt(b.date)}"><img class="top-img" src="${a.data}" alt="First photo ${fmt(a.date)}"><span class="bar-line"></span><span class="lbl" style="left:8px">${fmt(a.date)}</span><span class="lbl" style="right:8px">${fmt(b.date)}</span></div>
    <input class="range" type="range" min="0" max="100" value="${S.cut}" id="cut" aria-label="Compare photos">`;
  } else if (ph.length === 1) h += `<img src="${ph[0].data}" alt="First photo" style="border-radius:12px"><p class="hint">Add next week’s photo to unlock the before/after slider.</p>`;
  if (cks.length) h += `<ul class="list">${cks.slice().reverse().map(c => `<li><span>${fmt(c.date)}</span><span class="num">${[c.weight && c.weight + ' kg', c.waist && 'waist ' + c.waist, c.chest && 'chest ' + c.chest, c.arm && 'arm ' + c.arm, c.hips && 'hips ' + c.hips].filter(Boolean).join(' · ') || 'photo'}</span></li>`).join('')}</ul>`;
  return h + `</section>`;
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
  const ws = pts.map(p => p.weight).concat(goal > 0 ? [goal] : []);
  const lo = Math.floor(Math.min(...ws) - 1), hi = Math.ceil(Math.max(...ws) + 1);
  const t0 = C.parse(pts[0].date).getTime(), t1 = Math.max(t0 + 864e5, C.parse(pts[pts.length - 1].date).getTime());
  const x = d => pl + (C.parse(d).getTime() - t0) / (t1 - t0) * (W - pl - pr), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const path = a => a.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');
  const last = avg[avg.length - 1], T = v => Math.round(v * 10) / 10, mono = 'font-family="IBM Plex Mono,monospace"';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
  ${[hi, (hi + lo) / 2, lo].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 3.5}" text-anchor="end" font-size="10" fill="var(--muted)" ${mono}>${T(v)}</text>`).join('')}
  ${goal > 0 ? `<line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--good)" stroke-dasharray="4 4"/><text x="${W - pr}" y="${y(goal) - 4}" text-anchor="end" font-size="10" fill="var(--good)" ${mono}>goal ${goal}</text>` : ''}
  ${pts.map(p => `<circle cx="${x(p.date)}" cy="${y(p.weight)}" r="2.2" fill="var(--muted)"/>`).join('')}
  <path d="${path(avg)}" fill="none" stroke="var(--accent-strong)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${x(last.date)}" cy="${y(last.weight)}" r="4" fill="var(--spark)"/>
  <text x="${pl}" y="${H - 6}" font-size="10" fill="var(--muted)" ${mono}>${fmt(pts[0].date)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--muted)" ${mono}>7-day avg ${T(last.weight)} kg</text></svg>
  <p class="hint">Dots are single weigh-ins. The line is the 7-day average, which is the number to trust.</p></div>`;
}

async function shareWeek() {
  const rv = weekReview(), t = today(), hit = k => rv.past - rv.miss[k];
  const lines = [`Lock In 90 · week ending ${fmt(t)}`, `Days fully on plan: ${rv.locked}/${rv.n}`];
  if (rv.wNow) lines.push(`Weight (7-day avg): ${C.round(rv.wNow, 1)} kg${rv.wDelta != null ? ` (${rv.wDelta > 0 ? '+' : ''}${C.round(rv.wDelta, 1)} vs last week)` : ''}`);
  if (rv.kcal) lines.push(`Avg calories: ${kc(rv.kcal)}${rv.tk ? ` (plan ${kc(rv.tk)})` : ''} · protein ${kc(rv.prot)} g${rv.tp ? ` (plan ${kc(rv.tp)} g)` : ''}`);
  if (rv.past) lines.push(`Meals on plan ${hit('Meals')}/${rv.past} · water ${hit('Water')}/${rv.past} · training ${hit('Training')}/${rv.past} · supplements ${hit('Supplements')}/${rv.past}`);
  lines.push(`Cardio: ${rv.cardio} min${rv.sleep ? ` · avg sleep ${C.round(rv.sleep, 1)} h` : ''}`);
  const text = lines.join('\n');
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Summary copied. Paste it into your chat with your coach.'); } catch (e) { toast('Couldn’t share from here.'); }
}

/* ---------- SETUP ---------- */
function setupHTML(R) {
  const st = S.settings, plan = st.plan || C.DEFAULT_PLAN, wg = st.waterGoal || 3500, sta = st.stamina || { on: true, days: [] };
  let h = `<section class="card"><div class="card-h"><h2>Challenge</h2></div>
  <div class="setup-r"><span>Started</span><span class="num">${fmt(st.startDate)} · attempt ${R.attemptNo}</span></div>
  <div class="setup-r"><label for="s-water">Water goal</label>${waterSelect('s-water', 'data-setting="waterGoal"', wg)}</div>
  ${wg > 5000 ? '<p class="safety">Above 5 L, spread it out: no more than about 1 L per hour, and add salt or electrolytes on heavy-sweat days.</p>' : ''}
  <div class="setup-r"><label for="s-sw">Start weight (kg)</label><input class="in" id="s-sw" type="number" inputmode="decimal" step="0.1" data-setting="startWeight" value="${st.startWeight || ''}"></div>
  <div class="setup-r"><label for="s-gw">Goal weight (kg)</label><input class="in" id="s-gw" type="number" inputmode="decimal" step="0.1" data-setting="goalWeight" value="${st.goalWeight || ''}"></div>
  <div class="setup-r"><span>Usual gym time</span><div class="seg"><button data-act="defgym" data-v="am" aria-pressed="${(st.gymTime || 'am') === 'am'}">Morning</button><button data-act="defgym" data-v="pm" aria-pressed="${st.gymTime === 'pm'}">Night</button></div></div></section>`;
  // meal plan
  const planTot = C.sumItems((st.meals || []).flatMap(m => m.items || []));
  h += `<section class="card"><div class="card-h"><h2>Meal plan</h2>${pill('todo', `${kc(planTot.k)} kcal · ${kc(planTot.p)} g protein`)}</div><p class="hint">Your coach’s plan, in cooked weights. Its totals are your daily calorie and protein targets. When your coach changes it, edit it here: the change applies from today, and earlier days keep the plan they had.</p>${planHistoryHTML(st)}`;
  (st.meals || []).forEach((m, i) => {
    const s = C.sumItems(m.items);
    h += `<div class="planmeal"><div class="row"><input class="in grow" id="pm-n-${m.id}" data-mealname="${m.id}" value="${esc(m.name)}" aria-label="Meal name"><input class="in sm" id="pm-t-${m.id}" type="time" data-mealtime="${m.id}" value="${esc(m.time || '')}" aria-label="Time" style="width:110px"></div>
    <span class="hint num">${kc(s.k)} kcal · ${C.round(s.p, 1)} g protein · ${C.round(s.c, 1)} g carbs · ${C.round(s.f, 1)} g fat</span>
    ${itemsEditor(m.items || [], 'plan:' + m.id)}
    <div class="row"><button class="btn small" data-act="mealup" data-v="${m.id}" ${i === 0 ? 'disabled' : ''}>Move up</button><button class="btn small" data-act="mealdown" data-v="${m.id}" ${i === st.meals.length - 1 ? 'disabled' : ''}>Move down</button><button class="btn small danger" data-act="mealdel" data-v="${m.id}">Delete meal</button></div></div>`;
  });
  h += `<button class="btn" data-act="mealadd">+ Add a meal</button>${shoppingHTML(st)}</section>`;
  // weekly plan
  h += `<section class="card"><div class="card-h"><h2>Weekly training</h2></div><p class="hint">What counts as training each day. Tick gym days on Today after you log the workout in Lyfta.</p>
  ${[6, 0, 1, 2, 3, 4, 5].map(i => `<div class="setup-r"><label for="p-${i}">${C.DAYNAMES[i]}</label><select class="in" id="p-${i}" data-plan="${i}">${Object.keys(C.TT).map(k => `<option value="${k}" ${plan[i] === k ? 'selected' : ''}>${C.TT[k].label}</option>`).join('')}</select></div>`).join('')}</section>`;
  // stamina
  h += `<section class="card"><div class="card-h"><h2>Stamina track</h2>${pill('opt', 'Bonus')}</div>
  <div class="setup-r"><span>Show stamina reminders</span><div class="seg"><button data-act="stamon" data-v="1" aria-pressed="${sta.on !== false}">On</button><button data-act="stamon" data-v="0" aria-pressed="${sta.on === false}">Off</button></div></div>
  <span class="hint">Cardio days (after lifting)</span><div class="daychecks">${[6, 0, 1, 2, 3, 4, 5].map(i => `<button data-act="stamday" data-v="${i}" aria-pressed="${(sta.days || []).includes(i)}">${C.DAYNAMES[i].slice(0, 3)}</button>`).join('')}</div></section>`;
  // supplements
  h += `<section class="card"><div class="card-h"><h2>Supplements</h2></div><p class="hint">Core ones are required for the day to count. Timing changes with your gym time.</p>
  ${(st.supps || []).map(s => `<div class="sup-r"><div class="spread"><b>${esc(s.name)}</b><div class="row"><button class="btn small" data-act="sreq" data-id="${esc(s.id)}">${s.req ? 'Core' : 'Optional'}</button><button class="btn small danger" data-act="sdel" data-id="${esc(s.id)}">Remove</button></div></div>
  <div class="form"><label>Morning gym day<select class="in" data-stime="${esc(s.id)}:am">${SLOTS.map(o => `<option ${s.am === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label><label>Night gym day<select class="in" data-stime="${esc(s.id)}:pm">${SLOTS.map(o => `<option ${s.pm === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div></div>`).join('')}
  <div class="row"><input class="in grow" id="s-new" placeholder="Add a supplement"><button class="btn small" data-act="sadd">Add</button></div></section>`;
  // reminders + strava
  const rm = st.reminders || {}, sv = S.meta.strava;
  h += `<section class="card"><div class="card-h"><h2>Reminders</h2></div><p class="hint">Sent to the ntfy app on your phone. Each one checks your day first and stays quiet if there’s nothing to do. Times can run 5 to 15 minutes late.</p>
  <div class="sup-r"><span class="sub">Your ntfy topic</span><div class="row"><input class="in grow" id="s-topic" data-topic="1" value="${esc(st.ntfyTopic || '')}" placeholder="e.g. lockin90-a1b2c3d4e5f6" autocomplete="off" spellcheck="false"><button class="btn small" data-act="gentopic">New</button></div><p class="hint">Subscribe to this exact name in the ntfy app. Treat it like a password. Leave it empty and no reminders are sent.</p></div>
  ${REMINDERS.map(([k, label]) => { const on = k === 'meals' ? rm[k] === true : rm[k] !== false; return `<div class="setup-r"><span>${esc(label)}</span><div class="seg"><button data-act="remind" data-v="${k}:1" aria-pressed="${on}">On</button><button data-act="remind" data-v="${k}:0" aria-pressed="${!on}">Off</button></div></div>`; }).join('')}</section>`;
  if (sv) h += `<section class="card"><div class="card-h"><h2>Strava</h2>${sv && sv.ok ? pill('done', 'Connected') : pill('todo', 'Not connected')}</div>
  <p class="hint">${sv && sv.lastSync ? `Last sync ${new Date(sv.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. ${sv.count ? sv.count + ' activities synced.' : ''}` : 'Connects once the Strava step in the setup guide is done. Checks every 30 minutes.'}</p></section>`;
  // account and data
  h += `<section class="card"><div class="card-h"><h2>Data</h2></div>
  <div class="row"><button class="btn" data-act="export">Export backup</button><label class="btn" for="imp-file2">Import backup</label><input id="imp-file2" type="file" accept="application/json,.json" hidden></div>
  <p class="hint">Signed in as ${esc(S.user.email || '')}. <button class="link" data-act="signout">Sign out</button></p></section>`;
  h += `<section class="card"><div class="card-h"><h2>Restart</h2></div><p class="hint">Starts a fresh 90 days from today and clears the attempt history. Logged days stay saved.</p>
  ${S.confirm === 'restart' ? `<div class="wbtns"><button class="btn danger" data-act="restart2">Yes, restart today</button><button class="btn ghost" data-act="cancel">Cancel</button></div>` : `<button class="btn danger" data-act="restart1">Restart challenge</button>`}</section>`;
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
function openSheet(scope) {
  SH = { scope, picked: null, results: [], off: scope === 'extra', mode: 'search', usda: [], stream: null };
  $('sheet').hidden = false;
  $('sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Add food"><div class="spread"><h2>Add food</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>
  <input class="in" id="fs-q" placeholder="Search foods (English or عربي)" autocomplete="off">
  <div class="row"><button class="btn small" data-act="usda">Search online (USDA)</button><button class="btn small" data-act="scan">Scan barcode</button><button class="btn small" data-act="custom">New custom food</button></div>
  <div id="fs-body"></div></div>`;
  $('fs-q').addEventListener('input', sheetSearch);
  sheetSearch();
  setTimeout(() => $('fs-q') && $('fs-q').focus(), 50);
}
function closeSheet() { stopCam(); SH = null; $('sheet').hidden = true; $('sheet').innerHTML = ''; }
function libMatches(q) {
  const all = [...Object.values(S.foods).map(f => ({ ...f, src: 'custom' })), ...FOODS];
  if (!q) return all.slice(0, 30);
  const ql = q.toLowerCase();
  return all.filter(f => f.name.toLowerCase().includes(ql) || (f.ar && f.ar.includes(q))).slice(0, 40);
}
function resRow(f, i, src) { return `<button class="res" data-act="pick" data-v="${src}:${i}"><span><b>${esc(f.name)}</b><small>${src === 'usda' ? 'USDA' : f.src === 'custom' ? 'your food' : f.ar || ''}</small></span><span class="k num">${kc(f.per.k)} kcal · ${C.round(f.per.p, 1)} P<br><small>per 100 g</small></span></button>`; }
function sheetSearch() {
  if (!SH) return;
  SH.results = libMatches(($('fs-q') || {}).value || '');
  if (SH.picked) return drawPicked();
  $('fs-body').innerHTML = `<div class="results">${SH.results.map((f, i) => resRow(f, i, 'lib')).join('') || '<p class="hint">Nothing in the library. Try “Search online”.</p>'}${SH.usda.length ? '<span class="sub">USDA results</span>' + SH.usda.map((f, i) => resRow(f, i, 'usda')).join('') : ''}</div>`;
}
function drawPicked() {
  const f = SH.picked, g = SH.g;
  const m = C.itemMacros({ g, per: f.per });
  $('fs-body').innerHTML = `<div class="picked"><div><b>${esc(f.name)}</b><div class="hint num">Per 100 g: ${kc(f.per.k)} kcal · ${C.round(f.per.p, 1)} P · ${C.round(f.per.c, 1)} C · ${C.round(f.per.f, 1)} F</div></div>
  <div class="row"><label class="g" style="display:flex;gap:6px;align-items:center">${SH.drink ? 'Millilitres' : 'Grams'} <input class="in sm" id="fs-g" type="number" inputmode="decimal" step="any" value="${C.round(g, 1)}"></label>${(f.units || []).map(u => `<button class="btn small" data-act="unit" data-v="${u[1]}">1 ${esc(u[0])} · ${u[1]} ${SH.drink ? 'ml' : 'g'}</button>`).join('')}</div>
  <div class="hint num" id="fs-m">${kc(m.k)} kcal · ${C.round(m.p, 1)} g protein · ${C.round(m.c, 1)} g carbs · ${C.round(m.f, 1)} g fat</div>
  <label class="chk"><input type="checkbox" id="fs-drink" ${SH.drink ? 'checked' : ''}> It’s a drink: count it toward my water</label>
  ${SH.scope === 'extra' ? `<div class="seg wide" role="group" aria-label="Plan status"><button class="clean" data-act="extraoff" data-v="0" aria-pressed="${!SH.off}">Allowed by plan</button><button class="off" data-act="extraoff" data-v="1" aria-pressed="${SH.off}">Off-plan</button></div>` : ''}
  <div class="row"><button class="btn primary grow" data-act="addpicked">Add</button><button class="btn ghost" data-act="unpick">Back</button>${f.src === 'usda' || f.src === 'off' ? '<button class="btn small" data-act="savefood">Save to my foods</button>' : ''}</div></div>`;
  $('fs-g').addEventListener('input', e => { SH.g = parseFloat(e.target.value) || 0; const mm = C.itemMacros({ g: SH.g, per: f.per }); $('fs-m').textContent = `${kc(mm.k)} kcal · ${C.round(mm.p, 1)} g protein · ${C.round(mm.c, 1)} g carbs · ${C.round(mm.f, 1)} g fat`; });
}
async function usdaSearch() {
  const q = ($('fs-q').value || '').trim();
  if (!q) { toast('Type what you’re looking for first.'); return; }
  if (!navigator.onLine) { toast('Online search needs internet. The built-in library works offline.'); return; }
  $('fs-body').innerHTML = '<p class="hint">Searching…</p>';
  try {
    const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(q)}&pageSize=20&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS),Branded')}`);
    const j = await r.json();
    const get = (fn, nums) => { const n = (fn || []).find(x => nums.includes(String(x.nutrientNumber)) || nums.includes(String(x.nutrientId))); return n ? n.value : 0; };
    SH.usda = (j.foods || []).map(f => ({ id: 'usda_' + f.fdcId, name: (f.description || '').toLowerCase().replace(/^\w/, c => c.toUpperCase()) + (f.brandOwner ? ` (${f.brandOwner})` : ''), per: { k: get(f.foodNutrients, ['208', '1008']), p: get(f.foodNutrients, ['203', '1003']), c: get(f.foodNutrients, ['205', '1005']), f: get(f.foodNutrients, ['204', '1004']) }, units: [], src: 'usda' })).filter(f => f.per.k > 0);
    sheetSearch();
  } catch (e) { $('fs-body').innerHTML = '<p class="hint">Online search failed. Check your connection and try again.</p>'; }
}
async function lookupBarcode(code) {
  $('fs-body').innerHTML = '<p class="hint">Looking up ' + esc(code) + '…</p>';
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments`);
    const j = await r.json(), p = j.product, n = p && p.nutriments;
    if (!p || !n) { $('fs-body').innerHTML = `<p class="hint">No product found for ${esc(code)}. Add it as a custom food from the label.</p>`; return; }
    const kcal = n['energy-kcal_100g'] != null ? n['energy-kcal_100g'] : (n.energy_100g || 0) / 4.184;
    SH.picked = { id: 'off_' + code, name: `${p.product_name || 'Product'}${p.brands ? ' (' + p.brands.split(',')[0] + ')' : ''}`, per: { k: +kcal || 0, p: +n.proteins_100g || 0, c: +n.carbohydrates_100g || 0, f: +n.fat_100g || 0 }, units: [], src: 'off' };
    SH.drink = false; SH.g = 100; drawPicked();
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
function customForm() {
  $('fs-body').innerHTML = `<div class="picked"><b>New custom food</b><p class="hint">Copy the “per 100 g” values from the label.</p><div class="form"><label class="full">Name<input class="in" id="cf-n"></label><label>Calories<input class="in" id="cf-k" type="number" inputmode="decimal"></label><label>Protein (g)<input class="in" id="cf-p" type="number" inputmode="decimal"></label><label>Carbs (g)<input class="in" id="cf-c" type="number" inputmode="decimal"></label><label>Fat (g)<input class="in" id="cf-f" type="number" inputmode="decimal"></label><label class="full">Serving name and grams (optional)<input class="in" id="cf-u" placeholder="e.g. bar = 40 or bottle = 500"></label><label class="chk full"><input type="checkbox" id="cf-drink"> It’s a drink (counts toward water)</label></div><button class="btn primary" data-act="cfsave">Save and use</button></div>`;
}
function addItemTo(scope, item) {
  const [kind, id] = scope.split(':');
  if (kind === 'plan') { const m = S.settings.meals.find(x => x.id === id); m.items.push(item); savePlan(); }
  else if (kind === 'meal') { const d = dayDoc(editDate()); const md = d.meals[id] || (d.meals[id] = { status: 'swap', items: [] }); md.items = md.items || []; md.items.push(item); saveDay(editDate()); }
  else if (kind === 'extra') { const d = dayDoc(editDate()); d.extras.push(item); saveDay(editDate()); }
}
function itemList(scope) {
  const [kind, id] = scope.split(':');
  if (kind === 'plan') return S.settings.meals.find(x => x.id === id).items;
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
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, v = b.dataset.v, D = editDate();
  switch (act) {
    case 'signin': return signin();
    case 'signup': return emailAuth(true);
    case 'resetpw': { const em = ($('si-email') && $('si-email').value || '').trim(); if (!em) return toast('Type your email above first.'); try { await sendPasswordResetEmail(auth, em); toast('Reset link sent. Check your email.'); } catch (e) { toast(AUTH_MSG[e && e.code] || 'Couldn’t send the reset email.'); } return; }
    case 'signout': S.unsub.forEach(u => u()); S.unsub = []; S.photosOn = false; S.photos = {}; await signOut(auth); return;
    case 'tab': return go(v);
    case 'jump': { const el = $(v); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
    case 'start': {
      const num = id => parseFloat($(id).value) || null;
      const sd = $('w-start').value || today();
      S.settings = newSettings({ startDate: sd > today() ? today() : sd, waterGoal: +$('w-water').value, startWeight: num('w-weight'), goalWeight: num('w-goal') });
      saveSettings(); toast('Day 1 starts now.'); return draw();
    }
  }
  if (act === 'closesheet') return closeSheet();
  if (act === 'usda') return usdaSearch();
  if (act === 'scan') return startScan();
  if (act === 'codego') { const c = ($('fs-code').value || '').trim(); if (c) lookupBarcode(c); return; }
  if (act === 'custom') return customForm();
  if (act === 'cfsave') {
    const n = $('cf-n').value.trim(); if (!n) return toast('Give the food a name.');
    const num = id => parseFloat($(id).value) || 0, um = ($('cf-u').value || '').match(/^(.+?)\s*=\s*([\d.]+)/);
    const f = { id: 'c' + Date.now().toString(36), name: n.slice(0, 60), per: { k: num('cf-k'), p: num('cf-p'), c: num('cf-c'), f: num('cf-f') }, units: um ? [[um[1].trim(), +um[2]]] : [], src: 'custom', drink: $('cf-drink').checked };
    S.foods[f.id] = f; setDoc(doc(db, up('foods/' + f.id)), clone(f)).catch(() => { });
    SH.picked = f; SH.drink = !!f.drink; SH.g = f.units[0] ? f.units[0][1] : 100; return drawPicked();
  }
  if (act === 'pick') { const [src, i] = v.split(':'); SH.picked = (src === 'usda' ? SH.usda : SH.results)[+i]; SH.drink = !!SH.picked.drink; if (SH.scope === 'extra') SH.off = !(SH.drink && (SH.picked.per.k || 0) < 5); SH.g = SH.picked.units && SH.picked.units[0] ? SH.picked.units[0][1] : 100; return drawPicked(); }
  if (act === 'unpick') { SH.picked = null; return sheetSearch(); }
  if (act === 'unit') { SH.g = +v; return drawPicked(); }
  if (act === 'extraoff') { SH.off = v === '1'; return drawPicked(); }
  if (act === 'savefood') { const f = { ...SH.picked, drink: !!SH.drink, id: 'c' + Date.now().toString(36), src: 'custom' }; S.foods[f.id] = f; setDoc(doc(db, up('foods/' + f.id)), clone(f)).catch(() => { }); return toast('Saved to your foods.'); }
  if (act === 'addpicked') {
    const f = SH.picked, item = { fid: f.id, name: f.name, g: C.round(SH.g, 1), per: { ...f.per }, drink: !!SH.drink };
    if (SH.scope === 'extra') item.off = SH.off;
    addItemTo(SH.scope, item); closeSheet(); toast(`Added ${f.name.split(',')[0]}`); return draw();
  }
  if (act === 'tmstop') return closeTimer(true);
  if (act === 'tmcancel') return closeTimer(false);
  if (!S.settings) return;
  const d = () => dayDoc(D);
  switch (act) {
    case 'editdate': S.editDate = v; break;
    case 'meal': {
      const id = b.dataset.id, dd = d(), m = C.mealsOn(S.settings, D).find(x => x.id === id), cur = dd.meals[id] || {};
      if (cur.status === v) { delete dd.meals[id]; S.openMeal = null; }
      else if (v === 'plan') { dd.meals[id] = { status: 'plan', items: clone(m.items), note: cur.note || '' }; S.openMeal = null; }
      else if (v === 'swap') { dd.meals[id] = { status: 'swap', items: cur.items && cur.items.length ? cur.items : clone(m.items), note: cur.note || '' }; S.openMeal = id; }
      else { dd.meals[id] = { status: 'off', items: cur.status === 'off' ? cur.items : [], note: cur.note || '' }; S.openMeal = id; }
      saveDay(D); break;
    }
    case 'openmeal': S.openMeal = v; break;
    case 'allplan': { const dd = d(); C.mealsOn(S.settings, D).forEach(m => { if (!dd.skip[m.id] && !(dd.meals[m.id] && dd.meals[m.id].status)) dd.meals[m.id] = { status: 'plan', items: clone(m.items), note: '' }; }); saveDay(D); toast('Meals logged as planned.'); break; }
    case 'share': return shareWeek();
    case 'closemeal': S.openMeal = null; break;
    case 'skip': d().skip[v] = true; saveDay(D); break;
    case 'unskip': delete d().skip[v]; saveDay(D); break;
    case 'addfood': return openSheet(v);
    case 'rmitem': { const i = v.lastIndexOf(':'), scope = v.slice(0, i); itemList(scope).splice(+v.slice(i + 1), 1); saveScope(scope); break; }
    case 'water': { const dd = d(); dd.water = Math.max(0, Math.min(12000, (dd.water || 0) + (+b.dataset.n))); saveDay(D); break; }
    case 'train': { const dd = d(); dd.trainingDone = !dd.trainingDone; dd.trainingSource = dd.trainingDone ? 'manual' : null; saveDay(D); break; }
    case 'gymtime': d().gymTime = v; saveDay(D); break;
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
    case 'defgym': S.settings.gymTime = v; saveSettings(); break;
    case 'mealup': case 'mealdown': { const ms = S.settings.meals, i = ms.findIndex(x => x.id === v), j = act === 'mealup' ? i - 1 : i + 1; if (j >= 0 && j < ms.length) { [ms[i], ms[j]] = [ms[j], ms[i]]; savePlan(); } break; }
    case 'mealdel': if (S.confirm === 'meal:' + v) { S.settings.meals = S.settings.meals.filter(x => x.id !== v); S.confirm = null; savePlan(); } else { S.confirm = 'meal:' + v; b.textContent = 'Tap again to delete'; return; } break;
    case 'mealadd': { const ms = S.settings.meals; ms.push({ id: 'm' + Date.now().toString(36), name: `Meal ${ms.length + 1}`, time: '', items: [] }); savePlan(); break; }
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
  const D = editDate();
  if (t.id === 'cut') { S.cut = +t.value; const c = document.querySelector('.compare'); if (c) c.style.setProperty('--cut', S.cut + '%'); return; }
  if (t.dataset.note) { dayDoc(D).meals[t.dataset.note].note = t.value.slice(0, 140); saveDay(D); return; }
  if (t.dataset.grams) { const v = t.dataset.grams, i = v.lastIndexOf(':'), scope = v.slice(0, i), it = itemList(scope)[+v.slice(i + 1)]; if (it) { it.g = Math.max(0, parseFloat(t.value) || 0); saveScope(scope); } return; }
  if (t.dataset.set) {
    const dd = dayDoc(D), e = EX.find(x => x.id === t.dataset.set), a = Array.isArray(dd.cali[e.id]) ? dd.cali[e.id] : [];
    while (a.length <= +t.dataset.i) a.push(0);
    const val = Math.max(0, Math.min(999, parseInt(t.value, 10) || 0)), prev = bestOf(e.id, D);
    a[+t.dataset.i] = val; dd.cali[e.id] = a; t.classList.toggle('hit', val >= e.top); saveDay(D);
    clearTimeout(t._pb); if (prev && val > prev) t._pb = setTimeout(() => toast(`New best on ${e.name}: ${val}${e.unit === 's' ? ' s' : ''}`), 900);
    return;
  }
  if (t.dataset.mealname) { S.settings.meals.find(x => x.id === t.dataset.mealname).name = t.value.slice(0, 40); savePlan(); return; }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'imp-file' || t.id === 'imp-file2') return importBackup(t.files[0]);
  if (t.id === 'fs-drink' && SH) { SH.drink = t.checked; if (SH.scope === 'extra') SH.off = !(SH.drink && (SH.picked.per.k || 0) < 5); return drawPicked(); }
  if (t.dataset && t.dataset.grams && S.settings) { const v = t.dataset.grams, i = v.lastIndexOf(':'), it = itemList(v.slice(0, i))[+v.slice(i + 1)]; if (C.isDrink(it)) return draw(); }
  if (!S.settings) return;
  const D = editDate();
  if (t.dataset.dayfield) { const v = parseFloat(t.value); dayDoc(D)[t.dataset.dayfield] = isNaN(v) ? null : v; saveDay(D); return; }
  if (t.dataset.plan !== undefined) { S.settings.plan = { ...(S.settings.plan || C.DEFAULT_PLAN), [t.dataset.plan]: t.value }; saveSettings(); return; }
  if (t.dataset.setting) { const v = parseFloat(t.value); S.settings[t.dataset.setting] = isNaN(v) ? null : v; saveSettings(); if (t.dataset.setting === 'waterGoal') { t.blur(); draw(); } return; }
  if (t.dataset.topic) { S.settings.ntfyTopic = t.value.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); saveSettings(); return; }
  if (t.dataset.target) { const v = parseFloat(t.value); S.settings.targets = { ...(S.settings.targets || {}), [t.dataset.target]: isNaN(v) ? null : v }; saveSettings(); return; }
  if (t.dataset.mealtime) { S.settings.meals.find(x => x.id === t.dataset.mealtime).time = t.value; savePlan(); return; }
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
  const c = { date, weight: num('ck-weight') ?? prev.weight ?? null, waist: num('ck-waist') ?? prev.waist ?? null, chest: num('ck-chest') ?? prev.chest ?? null, arm: num('ck-arm') ?? prev.arm ?? null, hips: num('ck-hips') ?? prev.hips ?? null };
  const f = $('ck-photo').files[0];
  if (!f && !c.weight && !c.waist && !c.chest && !c.arm && !c.hips) return toast('Add a measurement or a photo first.');
  S.checkins[date] = c; setDoc(doc(db, up('checkins/' + date)), clone(c)).catch(() => toast('Couldn’t save the check-in.'));
  if (f) {
    try { const data = await compress(f); if (data.length > 900000) return toast('That photo is too large even after shrinking. Try another.'); S.photos[date] = { date, data }; setDoc(doc(db, up('photos/' + date)), { date, data }).catch(() => toast('Couldn’t save the photo.')); }
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
    for (let i = 0; i < writes.length; i += 400) { const b = writeBatch(db); writes.slice(i, i + 400).forEach(([p, v]) => b.set(doc(db, up(p)), clone(v))); b.commit().catch(() => toast('Part of the import didn’t save.')); }
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
function subscribe() {
  S.unsub.forEach(u => u()); S.unsub = [];
  const opt = { includeMetadataChanges: true };
  S.unsub.push(onSnapshot(doc(db, up('settings/main')), opt, snap => {
    if (!busy('settings/main')) S.settings = snap.exists() ? snap.data() : null;
    S.pend.s = snap.metadata.hasPendingWrites;
    if (!snap.metadata.fromCache || snap.exists()) S.got.settings = true;
    render();
  }, () => { S.got.settings = true; render(); }));
  S.unsub.push(onSnapshot(collection(db, up('days')), opt, qs => {
    qs.docs.forEach(x => { if (!busy('days/' + x.id)) S.days[x.id] = x.data(); });
    S.pend.d = qs.metadata.hasPendingWrites; S.got.days = true; render();
  }));
  S.unsub.push(onSnapshot(collection(db, up('checkins')), qs => { qs.docs.forEach(x => S.checkins[x.id] = x.data()); render(); }));
  S.unsub.push(onSnapshot(collection(db, up('foods')), qs => { qs.docs.forEach(x => S.foods[x.id] = x.data()); }));
  S.unsub.push(onSnapshot(collection(db, up('activities')), qs => { qs.docs.forEach(x => S.acts[x.id] = x.data()); render(); }));
  S.unsub.push(onSnapshot(collection(db, up('meta')), qs => { qs.docs.forEach(x => S.meta[x.id] = x.data()); render(); }));
}
// photos are large: load them only when Progress is opened
function photosOn() {
  if (S.photosOn || !S.user) return;
  S.photosOn = true;
  S.unsub.push(onSnapshot(collection(db, up('photos')), qs => { qs.docs.forEach(x => S.photos[x.id] = x.data()); if (S.view === 'progress') render(); }));
}
onAuthStateChanged(auth, u => {
  S.user = u; S.authReady = true;
  if (u) subscribe(); else { S.settings = null; S.days = {}; S.got = { settings: false, days: false }; }
  draw();
});
function go(v) { S.view = VIEWS.includes(v) ? v : 'today'; if (location.hash !== '#' + S.view) history.replaceState(null, '', '#' + S.view); window.scrollTo(0, 0); draw(); }
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v === 'water') { S.quickWater = true; return draw(); } if (VIEWS.includes(v) && v !== S.view) { S.view = v; draw(); } });
window.addEventListener('online', () => { S.online = true; render(); });
window.addEventListener('offline', () => { S.online = false; render(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
setInterval(render, 60000);
{ const h = location.hash.slice(1); if (VIEWS.includes(h)) S.view = h; if (h === 'water') S.quickWater = true; }
draw();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => { });
