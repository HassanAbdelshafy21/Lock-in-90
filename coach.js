// Read-only coach page: loads the summary the athlete publishes at shares/{token}. No sign-in needed.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { trText } from './i18n.js';

const app = initializeApp({ apiKey: 'AIzaSyDXdQS4eSuuPv375gE18jCze_0or8U3MNk', authDomain: 'lock-in-90.firebaseapp.com', projectId: 'lock-in-90', appId: '1:656413235174:web:0c1d56b230dd6e4c61e827' });
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = v => Math.round(v * 10) / 10;
let LANG = (() => { try { return localStorage.getItem('lk-coach-lang'); } catch (e) { return null; } })();
const fmt = (s, o = { day: 'numeric', month: 'short' }) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString(LANG === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', o); };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

function translate(n) {
  if (LANG !== 'ar') return;
  if (n.nodeType === 3) { const v = n.nodeValue, c = v.trim(); if (c && /[A-Za-z]/.test(c)) { const r = trText(c); if (r != null) n.nodeValue = v.replace(c, r); } return; }
  if (n.nodeType !== 1 || n.matches('script,style')) return;
  for (const c of n.childNodes) translate(c);
}

function chart(pts, goal) {
  if (pts.length < 2) return '<p class="hint">Not enough weigh-ins yet.</p>';
  const W = 640, H = 200, pl = 40, pr = 12, pt = 12, pb = 26, P = pts.map(([d, w]) => ({ t: new Date(d).getTime(), w }));
  const avg7 = P.map(p => { const win = P.filter(q => q.t <= p.t && p.t - q.t < 7 * 864e5); return { t: p.t, w: avg(win.map(q => q.w)) }; });
  const ws = P.map(p => p.w), lo = Math.floor(Math.min(...ws) - 1), hi = Math.ceil(Math.max(...ws) + 1), t0 = P[0].t, t1 = Math.max(t0 + 864e5, P[P.length - 1].t);
  const x = t => pl + (t - t0) / (t1 - t0) * (W - pl - pr), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Weight trend">${[hi, (hi + lo) / 2, lo].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${r1(v)}</text>`).join('')}
  ${P.map(p => `<circle cx="${x(p.t)}" cy="${y(p.w)}" r="2.6" fill="var(--muted)"/>`).join('')}
  <path d="${avg7.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.w).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--water)" stroke-width="2.5" stroke-linejoin="round"/>
  <text x="${pl}" y="${H - 6}" font-size="11" fill="var(--muted)">${fmt(pts[0][0])}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end" font-size="11" fill="var(--muted)">${fmt(pts[pts.length - 1][0])}${goal ? ` · goal ${goal} kg` : ''}</text></svg><p class="hint">Dots are weigh-ins; the line is the 7-day average.</p>`;
}

function render(s) {
  document.documentElement.lang = LANG === 'ar' ? 'ar' : 'en'; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  const days = s.days || [], last7 = days.slice(-7), closed7 = last7.filter((d, i) => i < last7.length - 1 || d.ok);
  const logged = last7.filter(d => d.k > 0), wts = (s.weights || []);
  const wNow = avg(wts.filter(([d]) => (Date.now() - new Date(d).getTime()) < 7 * 864e5).map(([, w]) => w)), w0 = s.startWeight || (wts[0] && wts[0][1]);
  const sl = last7.filter(d => d.sl).map(d => d.sl), upd = s.updated ? new Date(s.updated) : null;
  $('hdr').innerHTML = `<div class="top"><div class="brand"><img src="icons/logo.svg" alt="">Lock In 90 · Coach view</div><button class="lang" id="lang">${LANG === 'ar' ? 'English' : 'العربية'}</button></div>
  <h1>${esc(s.name)} · Day ${s.day} / 90</h1><div class="sub">Streak ${s.streak} · attempt ${s.attempt} · started ${fmt(s.startDate)}${upd ? ` · updated ${upd.toLocaleString(LANG === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</div>`;
  const tk = avg(logged.map(d => d.tk).filter(Boolean)), tp = avg(logged.map(d => d.tp).filter(Boolean));
  let h = `<div class="kpis">
  <div class="k"><b class="num">${last7.filter(d => d.ok).length} / ${last7.length}</b><span>Days locked in</span><small>last 7 days</small></div>
  <div class="k"><b class="num">${logged.length ? Math.round(avg(logged.map(d => d.k))) : '—'}</b><span>Avg calories</span><small>${tk ? `plan ${Math.round(tk)}` : 'no plan targets'}</small></div>
  <div class="k"><b class="num">${logged.length ? Math.round(avg(logged.map(d => d.p))) + ' g' : '—'}</b><span>Avg protein</span><small>${tp ? `plan ${Math.round(tp)} g` : ''}</small></div>
  <div class="k"><b class="num">${last7.filter(d => d.w >= d.wg).length} / ${last7.length}</b><span>Water goal hit</span><small>${last7.length ? `goal ${last7[last7.length - 1].wg} L` : ''}</small></div>
  <div class="k"><b class="num">${last7.filter(d => d.tr === 'done').length}</b><span>Training days</span><small>${last7.filter(d => d.tr === 'rest').length} rest days</small></div>
  <div class="k"><b class="num">${wNow ? r1(wNow) + ' kg' : '—'}</b><span>Weight (7-day avg)</span><small>${wNow && w0 ? `${wNow - w0 > 0 ? '+' : ''}${r1(wNow - w0)} kg since start` : ''}</small></div>
  <div class="k"><b class="num">${sl.length ? r1(avg(sl)) + ' h' : '—'}</b><span>Avg sleep</span><small>${sl.length} nights logged</small></div></div>`;
  h += `<section class="card"><h2>Last 14 days</h2><div class="tw"><table><thead><tr><th>Date</th><th>Day</th><th>Calories</th><th>Protein</th><th>Water</th><th>Training</th><th>Supps</th><th>Weight</th><th>Sleep</th><th>Sport</th><th>Notes</th></tr></thead><tbody>
  ${days.slice().reverse().map(d => `<tr><td>${fmt(d.d, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${d.ok ? '<span class="pill ok">Locked in</span>' : d.now ? `<span class="pill">In progress</span>` : `<span class="pill no">Missed</span>${d.miss && d.miss.length ? `<div class="miss">${esc(d.miss.join(' · '))}</div>` : ''}`}</td>
  <td class="num">${d.k ? d.k : '—'}${d.tk ? ` <span class="mut">/ ${d.tk}</span>` : ''}${d.off ? ' <span class="no">off-plan</span>' : ''}</td><td class="num">${d.p ? d.p + ' g' : '—'}${d.tp ? ` <span class="mut">/ ${d.tp}</span>` : ''}</td>
  <td class="num ${d.w >= d.wg ? 'ok' : ''}">${d.w} L</td><td>${d.tr === 'rest' ? '<span class="mut">Rest</span>' : d.tr === 'done' ? `<span class="ok">✓</span> ${esc(d.tt)}` : `<span class="no">✗</span> ${esc(d.tt)}`}</td>
  <td class="num">${d.sup[1] ? `${d.sup[0]}/${d.sup[1]}` : '—'}</td><td class="num">${d.wt ? d.wt + ' kg' : '—'}</td><td class="num">${d.sl ? d.sl + ' h' : '—'}</td><td class="num">${d.sp ? d.sp + ' min' : '—'}</td><td class="note">${d.note ? esc(d.note) : ''}</td></tr>`).join('')}</tbody></table></div></section>`;
  h += `<section class="card"><h2>Weight</h2>${chart(wts, s.goalWeight)}</section>`;
  const ck = s.checkins || [];
  if (ck.length) h += `<section class="card"><h2>Measurements</h2><div class="tw"><table><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>Chest</th><th>Arm</th><th>Hips</th><th>Neck</th></tr></thead><tbody>${ck.slice().reverse().map(c => `<tr><td>${fmt(c.date)}</td>${['weight', 'waist', 'chest', 'arm', 'hips', 'neck'].map(k => `<td class="num">${c[k] ? c[k] + (k === 'weight' ? ' kg' : ' cm') : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${s.height && ck[ck.length - 1].waist ? `<p class="hint">Waist-to-height ratio: ${(ck[ck.length - 1].waist / s.height).toFixed(2)} (NICE: under 0.5 is healthy).</p>` : ''}</section>`;
  h += `<p class="hint">Read-only view shared by ${esc(s.name)} from the Lock In 90 app. It updates when they log.</p>`;
  $('main').innerHTML = h;
  $('lang').onclick = () => { LANG = LANG === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('lk-coach-lang', LANG); } catch (e) { } render(s); };
  translate(document.body);
}

async function load() {
  const t = new URLSearchParams(location.search).get('t');
  if (!t) { $('main').innerHTML = '<div class="err card">This link is missing its code. Ask for a new link.</div>'; return; }
  try {
    const snap = await getDoc(doc(db, 'shares/' + t));
    if (!snap.exists()) { $('main').innerHTML = '<div class="err card">This link isn’t active any more. Ask for a new one.</div>'; document.querySelector('h1').textContent = 'Link not active'; return; }
    const s = snap.data(); if (!LANG) LANG = s.lang === 'ar' ? 'ar' : 'en';
    render(s);
  } catch (e) { $('main').innerHTML = '<div class="err card">Couldn’t load right now. Check the connection and refresh.</div>'; }
}
load();
