// Read-only coach page: loads the summary the athlete publishes at shares/{token}. No sign-in needed.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { trText } from './i18n.js';

const app = initializeApp({ apiKey: 'AIzaSyDXdQS4eSuuPv375gE18jCze_0or8U3MNk', authDomain: 'lock-in-90.firebaseapp.com', projectId: 'lock-in-90', appId: '1:656413235174:web:0c1d56b230dd6e4c61e827' });
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = v => Math.round(v * 10) / 10;
const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
let LANG = store.get('lk-coach-lang');
let THEME = store.get('lk-coach-theme');
const AR = () => LANG === 'ar';
const LOC = () => AR() ? 'ar-EG-u-nu-latn' : 'en-GB';
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const ds = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const addD = (s, n) => { const x = pd(s); x.setDate(x.getDate() + n); return ds(x); };
const fmt = (s, o = { day: 'numeric', month: 'short' }) => pd(s).toLocaleDateString(LOC(), o);
const wd = s => fmt(s, { weekday: 'short' });
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const nf = v => Math.round(v).toLocaleString('en-US');
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(r1(v));

// Coach-page strings. English is the key; {0}, {1}… are filled in order.
const ARS = {
  'Coach view': 'عرض الكابتن', 'Day {0} of 90': 'اليوم {0} من 90', 'Daily tracker': 'متابعة يومية', 'In a row': 'ورا بعض', 'Best run': 'أطول سلسلة', 'Updated just now': 'تم التحديث الآن', 'Updated {0} min ago': 'تم التحديث منذ {0} دقيقة', 'Updated {0} h ago': 'تم التحديث منذ {0} ساعة', 'Updated {0} days ago': 'تم التحديث منذ {0} أيام',
  'started {0}': 'البداية {0}', 'Streak': 'السلسلة', 'Best': 'الأفضل', 'Attempt {0}': 'المحاولة {0}', 'Goal {0} kg': 'الهدف {0} كجم', 'Rank': 'الرتبة',
  'This week': 'هذا الأسبوع', 'Today so far': 'اليوم حتى الآن', 'To do': 'لم يتم بعد', 'days locked in': 'أيام مكتملة', 'Meals': 'الوجبات', 'Water': 'المياه', 'Training': 'التمرين', 'Supps': 'المكملات', 'Sleep': 'النوم',
  'Needs attention': 'يحتاج انتباه', 'From the last 7 days': 'من آخر 7 أيام', 'All on track': 'كل شيء على المسار', 'Nothing to flag in the last 7 days.': 'لا شيء يستدعي الانتباه في آخر 7 أيام.',
  'Water missed {0} times': 'فاتت المياه {0} مرات', 'Water missed once': 'فاتت المياه مرة', '{0} of {1} L': '{0} من {1} لتر',
  'Protein under target {0} days': 'البروتين أقل من الهدف {0} أيام', 'Protein under target once': 'البروتين أقل من الهدف مرة', 'Avg {0} g vs {1} g plan.': 'المتوسط {0} جم مقابل {1} جم في الخطة.', 'Meals swapped {0} times.': 'تم تبديل وجبات {0} مرات.',
  'Off-plan meals on {0} days': 'وجبات خارج الخطة في {0} أيام', 'Off-plan meals once': 'وجبات خارج الخطة مرة',
  'Sleep {0} h average': 'متوسط النوم {0} ساعة', 'Goal {0} h. Shortest: {1} {2} h.': 'الهدف {0} ساعة. الأقل: {1} {2} ساعة.',
  'Supplements missed on {0} days': 'فاتت المكملات في {0} أيام', 'Supplements missed once': 'فاتت المكملات مرة',
  'Training missed {0} times': 'فات التمرين {0} مرات', 'Training missed once': 'فات التمرين مرة',
  'No weigh-ins this week': 'لا يوجد وزن هذا الأسبوع', 'Last weigh-in: {0}.': 'آخر وزن: {0}.', 'None logged yet.': 'لم يُسجل بعد.',
  'Training {0} of {1}': 'التمرين {0} من {1}', 'Training {0} of {1}, {2} new records': 'التمرين {0} من {1}، {2} أرقام جديدة', 'Training {0} of {1}, 1 new record': 'التمرين {0} من {1}، رقم جديد',
  'Weight': 'الوزن', "7-day average, so daily swings don't mislead": 'متوسط 7 أيام حتى لا تضلل التقلبات اليومية', '{0} kg since start': '{0} كجم منذ البداية',
  'per week': 'في الأسبوع', 'of body / week': 'من الجسم / أسبوع', 'to goal at this rate': 'للهدف بهذا المعدل', '~{0} wks': '~{0} أسابيع', 'goal {0}': 'الهدف {0}', 'Not enough weigh-ins yet.': 'لا توجد وزنات كافية بعد.',
  'Calories and protein': 'السعرات والبروتين', 'Bars: calories · dashes: plan · dark mark: protein · last {0} days': 'الأعمدة: السعرات · الشرطات: الخطة · العلامة الداكنة: البروتين · آخر {0} يوم',
  'avg kcal (plan {0})': 'متوسط السعرات (الخطة {0})', 'avg kcal': 'متوسط السعرات', 'avg protein (plan {0} g)': 'متوسط البروتين (الخطة {0} جم)', 'avg protein': 'متوسط البروتين', 'off-plan meals': 'وجبات خارج الخطة',
  'On plan': 'على الخطة', 'Off target': 'بعيد عن الهدف', 'Off plan': 'خارج الخطة', 'Today': 'اليوم', 'No food logged yet.': 'لم يُسجل طعام بعد.', 'kcal today so far (plan {0})': 'سعرات اليوم حتى الآن (الخطة {0})', 'kcal today so far': 'سعرات اليوم حتى الآن', 'protein so far (plan {0} g)': 'البروتين حتى الآن (الخطة {0} جم)', 'protein so far': 'البروتين حتى الآن',
  'Last 7 days · {0} sessions · {1} cardio min': 'آخر 7 أيام · {0} جلسات · {1} دقيقة كارديو', '{0} min': '{0} دقيقة', '{0} sets': '{0} مجموعة', '{0} t': '{0} طن', '+ {0} min cardio': '+ {0} دقيقة كارديو', '~{0} kcal': '~{0} سعرة',
  'Marked done': 'تم التعليم كمكتمل', 'Not done': 'لم يتم', 'Missed': 'فات', '{0} records': '{0} أرقام', '1 record': 'رقم جديد', 'Cardio': 'كارديو', 'Calisthenics': 'كاليسثينكس', 'Nothing logged in the last 7 days.': 'لا شيء مسجل في آخر 7 أيام.',
  '{0}-day overview': 'نظرة {0} يوم', 'Each square is one day. Tap a day for details.': 'كل مربع يوم. اضغط على يوم للتفاصيل.', 'Done': 'تم', 'Partly': 'جزئيًا', 'Rest / not logged': 'راحة / غير مسجل', 'Before the start': 'قبل البداية', 'Sleep {0} h': 'النوم {0} س',
  'Locked in': 'مكتمل', 'Free cheat meal': 'وجبة فري (شيت ميل)', '{0} free cheat meals': '{0} وجبات فري', 'Allowed in the plan, so the day counted.': 'مسموح بها في الخطة، فاليوم اتحسب.', 'Cheat meal': 'وجبة فري', 'In progress': 'جارٍ', 'Missed: {0}': 'فات: {0}', 'note': 'ملاحظة', 'Latest note': 'آخر ملاحظة',
  '{0} / {1} kcal': '{0} / {1} سعرة', '{0} kcal': '{0} سعرة', '{0} g protein': '{0} جم بروتين', '{0} / {1} g protein': '{0} / {1} جم بروتين', '{0} / {1} L water': '{0} / {1} لتر مياه', 'Rest day': 'يوم راحة', 'Supps {0}/{1}': 'المكملات {0}/{1}', '{0} h sleep': '{0} ساعة نوم', '{0} kg': '{0} كجم', '{0} g': '{0} جم',
  'Measurements': 'القياسات', '{0} check-ins': '{0} متابعات', '1 check-in': 'متابعة واحدة', 'waist': 'الوسط', 'chest': 'الصدر', 'hips': 'الأرداف', 'arm': 'الذراع', 'neck': 'الرقبة', 'waist ÷ height': 'الوسط ÷ الطول', 'under 0.5 is healthy': 'أقل من 0.5 صحي', '{0} cm': '{0} سم',
  'Read-only view shared from the Lock In 90 app · updates when {0} logs': 'عرض للقراءة فقط من تطبيق Lock In 90 · يتحدث عندما يسجل {0}', 'Dark mode': 'الوضع الداكن', 'Light mode': 'الوضع الفاتح',
  'This link is missing its code. Ask for a new link.': 'الرابط ناقص الكود. اطلب رابطًا جديدًا.', 'This link isn’t active any more. Ask for a new one.': 'هذا الرابط لم يعد فعالًا. اطلب رابطًا جديدًا.', 'Link not active': 'الرابط غير فعال', 'Couldn’t load right now. Check the connection and refresh.': 'تعذر التحميل الآن. تحقق من الاتصال وحدّث الصفحة.', 'Loading…': 'جارٍ التحميل…',
};
const t = (s, ...a) => (AR() && ARS[s] != null ? ARS[s] : s).replace(/\{(\d)\}/g, (_, i) => a[i] ?? '');
const tally = a => { const m = new Map(); a.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return [...m].map(([k, n]) => esc(k) + (n > 1 ? ` ×${n}` : '')).join(', '); };
const times = (n, many, once) => n === 1 && once ? t(once) : t(many, n);

// Leftover English (training labels, sport names, missing-item names) goes through the app's dictionary.
function translate(n) {
  if (!AR()) return;
  if (n.nodeType === 3) { const v = n.nodeValue, c = v.trim(); if (c && /[A-Za-z]/.test(c)) { const r = trText(c); if (r != null) n.nodeValue = v.replace(c, r); } return; }
  if (n.nodeType !== 1 || n.matches('script,style,.keep')) return;
  for (const c of n.childNodes) translate(c);
}
const trw = s => AR() ? (trText(s) ?? s) : s;

function applyTheme() {
  const r = document.documentElement;
  if (THEME) r.dataset.theme = THEME; else delete r.dataset.theme;
}
const isDark = () => THEME ? THEME === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;

function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return t('Updated just now');
  if (m < 60) return t('Updated {0} min ago', m);
  if (m < 48 * 60) return t('Updated {0} h ago', Math.round(m / 60));
  return t('Updated {0} days ago', Math.round(m / 1440));
}

/* ---------- cards ---------- */
function weekCard(s, days) {
  const last = days[days.length - 1].d, w0 = s.ws ?? 6, sat = addD(last, -((pd(last).getDay() - w0 + 7) % 7)), fri = addD(sat, 6);
  const wk = days.filter(d => d.d >= sat), closed = wk.filter(d => !d.now || d.ok), base = closed.length ? closed : wk;
  const okN = wk.filter(d => d.ok).length, of = closed.length || wk.length;
  const pct = (a, f) => { const x = a.filter(f.has); return x.length ? x.filter(f.ok).length / x.length : null; };
  const meals = pct(base, { has: d => d.ms !== 'none', ok: d => d.ms === 'ok' || d.ms === 'cheat' });
  const waterN = base.filter(d => d.w >= d.wg).length;
  const plan = base.filter(d => d.tr !== 'rest'), trN = plan.filter(d => d.tr === 'done').length;
  const sup = pct(base, { has: d => d.ss !== 'none', ok: d => d.ss === 'ok' });
  const C = 2 * Math.PI * 50, fr = of ? okN / of : 0;
  if (!closed.length && wk.length) { // first day of the week: show today so far instead of 0%
    const d = wk[wk.length - 1], mc = d.mc || [0, 0], bar2 = (lab, f, txt, col) => `<div><span>${t(lab)}</span><i><em style="width:${Math.round(Math.min(1, f || 0) * 100)}%;background:${col}"></em></i><span class="num">${txt}</span></div>`;
    return `<section class="card score"><div class="ring"><svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--s2)" stroke-width="12"/></svg><b><span class="num">${okN}/1</span><small>${t('days locked in')}</small></b></div>
    <div><h2>${t('Today so far')}</h2><span class="sub">${t('This week')} · ${wd(sat)} ${fmt(sat)} – ${wd(fri)} ${fmt(fri)}</span><div class="pb">
    ${bar2('Meals', mc[1] ? mc[0] / mc[1] : 0, mc[1] ? `${mc[0]}/${mc[1]}` : '—', 'var(--good)')}
    ${bar2('Water', d.wg ? d.w / d.wg : 0, `${d.w}/${d.wg} L`, 'var(--water)')}
    ${bar2('Training', d.tr === 'done' || d.tr === 'rest' ? 1 : 0, d.tr === 'rest' ? t('Rest day') : d.tr === 'done' ? t('Done') : t('To do'), 'var(--gold)')}
    ${bar2('Supps', d.sup && d.sup[1] ? d.sup[0] / d.sup[1] : 0, d.sup && d.sup[1] ? `${d.sup[0]}/${d.sup[1]}` : '—', 'var(--supp)')}</div></div></section>`;
  }
  const bar = (lab, f, txt, col) => `<div><span>${t(lab)}</span><i><em style="width:${Math.round((f ?? 0) * 100)}%;background:${col}"></em></i><span class="num">${txt}</span></div>`;
  return `<section class="card score"><div class="ring"><svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--s2)" stroke-width="12"/>${fr ? `<circle cx="60" cy="60" r="50" fill="none" stroke="var(--good)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C * fr).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>` : ''}</svg><b><span class="num">${okN}/${of}</span><small>${t('days locked in')}</small></b></div>
  <div><h2>${t('This week')}</h2><span class="sub">${wd(sat)} ${fmt(sat)} – ${wd(fri)} ${fmt(fri)}</span><div class="pb">
  ${bar('Meals', meals, meals == null ? '—' : Math.round(meals * 100) + '%', 'var(--good)')}
  ${bar('Water', base.length ? waterN / base.length : 0, `${waterN}/${base.length}`, 'var(--water)')}
  ${bar('Training', plan.length ? trN / plan.length : 1, plan.length ? `${trN}/${plan.length}` : '—', 'var(--gold)')}
  ${bar('Supps', sup, sup == null ? '—' : Math.round(sup * 100) + '%', 'var(--supp)')}</div></div></section>`;
}

function flagsCard(s, days, wts) {
  const last7 = days.slice(-7), c7 = last7.filter(d => !d.now || d.ok), F = [];
  const flag = (k, title, sub) => F.push(`<div class="flag"><i class="f-${k}" aria-hidden="true">${{ water: '💧', food: '◐', sleep: '☾', supp: '✚', train: '✗', scale: '⚖', ok: '✓', cheat: '🍕' }[k]}</i><span><b>${title}</b><small>${sub}</small></span></div>`);
  const wm = c7.filter(d => d.w < d.wg);
  if (wm.length) flag('water', times(wm.length, 'Water missed {0} times', 'Water missed once'), wm.map(d => `${wd(d.d)} ${t('{0} of {1} L', d.w, d.wg)}`).join(', ') + '.');
  const pu = c7.filter(d => d.k > 0 && d.tp > 0 && d.p < d.tp * 0.9);
  if (pu.length) { const lg = c7.filter(d => d.k > 0 && d.tp > 0), sw = c7.reduce((a, d) => a + (d.sw || 0), 0); flag('food', times(pu.length, 'Protein under target {0} days', 'Protein under target once'), t('Avg {0} g vs {1} g plan.', Math.round(avg(lg.map(d => d.p))), Math.round(avg(lg.map(d => d.tp)))) + (sw > 1 ? ' ' + t('Meals swapped {0} times.', sw) : '')); }
  const off = c7.filter(d => d.ms === 'off');
  if (off.length) flag('food', times(off.length, 'Off-plan meals on {0} days', 'Off-plan meals once'), off.map(d => wd(d.d)).join(', ') + '.');
  const sl = last7.filter(d => d.sl), goal = s.sleepGoal || 7.5;
  if (sl.length) { const a = avg(sl.map(d => d.sl)); if (a < goal - 0.25) { const mn = sl.reduce((x, d) => d.sl < x.sl ? d : x); flag('sleep', t('Sleep {0} h average', r1(a)), t('Goal {0} h. Shortest: {1} {2} h.', goal, wd(mn.d), mn.sl)); } }
  const sm = c7.filter(d => d.ss === 'miss' || d.ss === 'part');
  if (sm.length) flag('supp', times(sm.length, 'Supplements missed on {0} days', 'Supplements missed once'), sm.map(d => `${wd(d.d)} ${d.sup[0]}/${d.sup[1]}`).join(', ') + '.');
  const tm = c7.filter(d => d.tr === 'no');
  if (tm.length) flag('train', times(tm.length, 'Training missed {0} times', 'Training missed once'), tm.map(d => `${wd(d.d)} ${esc(trw(d.tt))}`).join(', ') + '.');
  const ch = last7.filter(d => d.ms === 'cheat');
  if (ch.length) flag('cheat', ch.length === 1 ? t('Free cheat meal') : t('{0} free cheat meals', ch.length), ch.map(d => `${wd(d.d)} ${fmt(d.d)}`).join(', ') + '. ' + t('Allowed in the plan, so the day counted.'));
  const lastW = wts.length ? wts[wts.length - 1][0] : null;
  if (days.length >= 7 && (!lastW || lastW < last7[0].d)) flag('scale', t('No weigh-ins this week'), lastW ? t('Last weigh-in: {0}.', fmt(lastW)) : t('None logged yet.'));
  const plan = c7.filter(d => d.tr !== 'rest'), done = plan.filter(d => d.tr === 'done'), prs = last7.reduce((a, d) => a + (d.wo && d.wo.pr || 0), 0);
  if (plan.length && done.length === plan.length) flag('ok', prs > 1 ? t('Training {0} of {1}, {2} new records', done.length, plan.length, prs) : prs === 1 ? t('Training {0} of {1}, 1 new record', done.length, plan.length) : t('Training {0} of {1}', done.length, plan.length), tally(done.map(d => d.wo ? (d.wo.cali ? t('Calisthenics') : d.wo.n) : trw(d.tt))));
  if (F.every(x => x.includes('f-ok') || x.includes('f-cheat'))) F.unshift(`<div class="flag"><i class="f-ok" aria-hidden="true">✓</i><span><b>${t('All on track')}</b><small>${t('Nothing to flag in the last 7 days.')}</small></span></div>`);
  return `<section class="card"><h2>${t('Needs attention')}</h2><span class="sub">${t('From the last 7 days')}</span><div class="flags">${F.join('')}</div></section>`;
}

function weightCard(s, wts) {
  const goal = s.goalWeight;
  if (wts.length < 2) return `<section class="card"><h2>${t('Weight')}</h2><p class="hint">${t('Not enough weigh-ins yet.')}</p></section>`;
  const P = wts.map(([d, w]) => ({ d, t: pd(d).getTime() / 864e5, w }));
  const A = P.map(p => ({ t: p.t, w: avg(P.filter(q => q.t <= p.t && p.t - q.t < 7).map(q => q.w)) }));
  const lastT = P[P.length - 1].t, now = avg(P.filter(p => lastT - p.t < 7).map(p => p.w)), w0 = s.startWeight || P[0].w, ch = now - w0;
  // kg per week: least-squares slope of the 7-day average over the last 28 days
  const R = A.filter(p => lastT - p.t <= 28); let rate = null;
  if (R.length >= 3 && R[R.length - 1].t - R[0].t >= 6) { const mt = avg(R.map(p => p.t)), mw = avg(R.map(p => p.w)); rate = R.reduce((a, p) => a + (p.t - mt) * (p.w - mw), 0) / R.reduce((a, p) => a + (p.t - mt) ** 2, 0) * 7; }
  const toward = goal ? Math.sign(goal - now) : Math.sign(ch) || -1;
  const good = v => goal ? Math.sign(v) === Math.sign(goal - w0) : null;
  const wks = goal && rate && Math.abs(goal - now) > 0.2 && Math.sign(rate) === toward ? Math.ceil(Math.abs(goal - now) / Math.abs(rate)) : null;
  const W = 320, H = 130, pt = 10, pb = 18, ws = P.map(p => p.w);
  let lo = Math.min(...ws), hi = Math.max(...ws); const span = Math.max(hi - lo, 2);
  const gIn = goal && goal >= lo - span * 1.2 && goal <= hi + span * 1.2; if (gIn) { lo = Math.min(lo, goal); hi = Math.max(hi, goal); }
  lo -= 0.5; hi += 0.5;
  const t0 = P[0].t, t1 = Math.max(t0 + 1, lastT), x = v => 6 + (v - t0) / (t1 - t0) * (W - 12), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const path = A.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.w).toFixed(1)}`).join(' ');
  const la = A[A.length - 1], cls = good(ch) == null ? '' : good(ch) ? 'up' : 'down';
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Weight trend">${[hi - 0.5, (hi + lo) / 2, lo + 0.5].map(v => `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="2" y="${y(v) - 3}" font-size="9" fill="var(--mut)">${r1(v)}</text>`).join('')}
  ${gIn ? `<line x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--good)" stroke-dasharray="5 5" opacity=".75"/><text x="${W - 2}" y="${y(goal) - 4}" text-anchor="end" font-size="10" fill="var(--good)">${t('goal {0}', goal)}</text>` : ''}
  <g fill="var(--mut)" opacity=".55">${P.map(p => `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.w).toFixed(1)}" r="2.5"><title>${fmt(p.d)} · ${p.w} kg</title></circle>`).join('')}</g>
  <path d="${path}" fill="none" stroke="var(--water)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(la.t)}" cy="${y(la.w)}" r="5" fill="var(--water)"/>
  <text x="6" y="${H - 3}" font-size="9.5" fill="var(--mut)">${fmt(P[0].d)}</text><text x="${W - 6}" y="${H - 3}" text-anchor="end" font-size="9.5" fill="var(--mut)">${fmt(P[P.length - 1].d)}</text></svg>`;
  return `<section class="card"><h2>${t('Weight')}</h2><span class="sub">${t("7-day average, so daily swings don't mislead")}</span>
  <div class="big"><b class="num">${t('{0} kg', r1(now))}</b><span class="d ${cls} num">${t('{0} kg since start', sgn(ch))}</span></div>${svg}
  <div class="kp"><div><b class="num">${rate == null ? '—' : t('{0} kg', sgn(rate))}</b><span>${t('per week')}</span></div><div><b class="num">${rate == null ? '—' : Math.abs(r1(rate / now * 100)) + '%'}</b><span>${t('of body / week')}</span></div><div><b class="num">${wks ? t('~{0} wks', wks) : '—'}</b><span>${t('to goal at this rate')}</span></div></div></section>`;
}

function foodCard(days) {
  const n = days.length, off = Math.max(0, 14 - n), W = 640, H = 150, base = 124, top = 10, slot = W / Math.max(14, n), bw = Math.min(28, slot * 0.6);
  const kmax = Math.max(500, ...days.map(d => Math.max(d.k, d.tk))) * 1.1, pmax = Math.max(50, ...days.map(d => Math.max(d.p, d.tp))) * 1.1;
  const yk = v => base - v / kmax * (base - top), yp = v => base - v / pmax * (base - top);
  let g = '';
  days.forEach((d, i) => {
    const cx = slot * (i + off) + slot / 2, x = cx - bw / 2, live = d.now && !d.ok;
    const col = !d.k ? 'var(--line)' : live ? 'var(--line)' : d.ms === 'off' ? 'var(--bad)' : d.tk && Math.abs(d.k - d.tk) / d.tk > 0.1 ? 'var(--gold)' : 'var(--good)';
    const h = Math.max(d.k ? 3 : 2, base - yk(d.k));
    g += `<g><title>${wd(d.d)} ${fmt(d.d)} · ${d.tk ? t('{0} / {1} kcal', nf(d.k), nf(d.tk)) : t('{0} kcal', nf(d.k))} · ${d.tp ? t('{0} / {1} g protein', d.p, d.tp) : t('{0} g protein', d.p)}</title>
    <rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="6" fill="${col}" opacity="${live ? 1 : .9}"/>
    ${d.tk ? `<line x1="${(cx - slot / 2 + 2).toFixed(1)}" x2="${(cx + slot / 2 - 2).toFixed(1)}" y1="${yk(d.tk).toFixed(1)}" y2="${yk(d.tk).toFixed(1)}" stroke="var(--ink2)" stroke-width="1.5" stroke-dasharray="4 3"/>` : ''}
    ${d.p ? `<rect x="${(cx - 6).toFixed(1)}" y="${(yp(d.p) - 2).toFixed(1)}" width="12" height="4" rx="2" fill="var(--ink)"/>` : ''}
    <text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="${d.now ? 'var(--ink)' : 'var(--mut)'}" font-weight="${d.now ? 700 : 400}">${pd(d.d).getDate()}</text></g>`;
  });
  // averages use finished days; on a first day (or with nothing else logged) today so far is shown instead
  const done = days.filter(d => d.k > 0 && (!d.now || d.ok)), td = days.find(d => d.now && d.k > 0), lg = done.length ? done : td ? [td] : [], soFar = !done.length && !!td, tk = avg(lg.map(d => d.tk).filter(Boolean)), tp = avg(lg.map(d => d.tp).filter(Boolean));
  const offN = days.reduce((a, d) => a + (d.off || 0), 0);
  return `<section class="card span2"><h2>${t('Calories and protein')}</h2><span class="sub">${t('Bars: calories · dashes: plan · dark mark: protein · last {0} days', Math.max(14, n))}</span>
  ${days.some(d => d.k > 0) ? `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Calories and protein by day">${g}</svg>` : ''}
  <div class="leg"><span><i style="background:var(--good)"></i>${t('On plan')}</span><span><i style="background:var(--gold)"></i>${t('Off target')}</span><span><i style="background:var(--bad)"></i>${t('Off plan')}</span><span><i style="background:var(--line)"></i>${t('Today')}</span></div>
  ${lg.length ? `<div class="kp"><div><b class="num">${nf(avg(lg.map(d => d.k)))}</b><span>${soFar ? (tk ? t('kcal today so far (plan {0})', nf(tk)) : t('kcal today so far')) : tk ? t('avg kcal (plan {0})', nf(tk)) : t('avg kcal')}</span></div><div><b class="num">${t('{0} g', Math.round(avg(lg.map(d => d.p))))}</b><span>${soFar ? (tp ? t('protein so far (plan {0} g)', Math.round(tp)) : t('protein so far')) : tp ? t('avg protein (plan {0} g)', Math.round(tp)) : t('avg protein')}</span></div><div><b class="num">${offN}</b><span>${t('off-plan meals')}</span></div></div>` : `<p class="hint">${t('No food logged yet.')}</p>`}</section>`;
}

function trainCard(days) {
  const last7 = days.slice(-7).reverse(), rows = []; let sess = 0, cardio = 0;
  const row = (d, name, small, chip = '') => rows.push(`<div class="wo"><span class="dt"><b class="num">${pd(d.d).getDate()}</b><span>${wd(d.d)}</span></span><span><b>${name}</b><small>${small}</small></span><span>${chip}</span></div>`);
  last7.forEach(d => {
    cardio += d.cd || 0;
    const cd = d.cd ? t('+ {0} min cardio', d.cd) : '';
    if (d.wo) {
      sess++; const w = d.wo, bits = [w.m ? t('{0} min', w.m) : '', w.s ? t('{0} sets', w.s) : '', w.v >= 100 ? t('{0} t', r1(w.v / 1000)) : '', cd].filter(Boolean);
      row(d, esc(w.cali ? t('Calisthenics') : w.n), bits.join(' · '), w.pr ? `<span class="pr">${w.pr === 1 ? t('1 record') : t('{0} records', w.pr)}</span>` : '');
    } else if (d.tr === 'done') { sess++; row(d, esc(trw(d.tt)), [t('Marked done'), cd].filter(Boolean).join(' · ')); }
    else if (d.tr === 'no' && !d.now) row(d, esc(trw(d.tt)), t('Not done'), `<span class="miss">${t('Missed')}</span>`);
    else if (d.cd) row(d, t('Cardio'), t('{0} min', d.cd));
    (d.spl || []).forEach(x => { sess++; row(d, esc(trw(x.n)), [t('{0} min', x.m), x.k ? t('~{0} kcal', nf(x.k)) : ''].filter(Boolean).join(' · ')); });
  });
  return `<section class="card"><h2>${t('Training')}</h2><span class="sub">${t('Last 7 days · {0} sessions · {1} cardio min', sess, cardio)}</span>
  ${rows.length ? `<div class="wos">${rows.join('')}</div>` : `<p class="hint">${t('Nothing logged in the last 7 days.')}</p>`}</section>`;
}

const cellOf = (d, k, goal) => {
  const live = d.now && !d.ok;
  if (k === 'm') return d.ms === 'cheat' ? 'c' : d.ms === 'ok' ? 'g' : d.ms === 'off' ? 'b' : d.ms === 'part' ? 'y' : 'n';
  if (k === 'w') return d.w >= d.wg ? 'g' : live ? (d.w > 0 ? 'y' : 'n') : d.w >= d.wg * 0.75 ? 'y' : 'b';
  if (k === 't') return d.tr === 'rest' ? 'n' : d.tr === 'done' ? 'g' : live ? 'n' : 'b';
  if (k === 's') return d.ss === 'ok' ? 'g' : d.ss === 'none' ? 'n' : d.ss === 'part' ? 'y' : live ? 'n' : 'b';
  if (k === 'z') return !d.sl ? 'n' : d.sl >= goal - 0.1 ? 'g' : d.sl >= goal - 1 ? 'y' : 'b';
};
function heatCard(s, days) {
  const goal = s.sleepGoal || 7.5, rows = [['Meals', 'm'], ['Water', 'w'], ['Training', 't'], ['Supps', 's'], [t('Sleep {0} h', goal), 'z']];
  const pad = Math.max(0, 14 - days.length), pre = Array.from({ length: pad }, (_, j) => addD(days[0].d, j - pad));
  const padH = pre.map(d => `<span class="dh pad">${wd(d).slice(0, AR() ? 3 : 1)}<em class="num">${pd(d).getDate()}</em></span>`).join(''), padC = '<span class="c pad"></span>'.repeat(pad);
  let h = `<span></span>` + padH + days.map((d, i) => `<button class="dh${d.now ? ' on' : ''}" data-i="${i}" aria-label="${fmt(d.d, { weekday: 'long', day: 'numeric', month: 'long' })}">${wd(d.d).slice(0, AR() ? 3 : 1)}<em class="num">${pd(d.d).getDate()}</em></button>`).join('');
  rows.forEach(([lab, k]) => { h += `<span class="lab">${k === 'z' ? lab : t(lab)}</span>` + padC + days.map((d, i) => { const c = cellOf(d, k, goal); return `<button class="c c-${c}${d.now ? ' today' : ''}" data-i="${i}" tabindex="-1" aria-hidden="true">${c === 'c' ? 'C' : ''}</button>`; }).join(''); });
  const ln = days.slice().reverse().find(d => d.note);
  return `<section class="card span3"><h2>${t('{0}-day overview', 14)}</h2><span class="sub">${t('Each square is one day. Tap a day for details.')}</span>
  <div class="heat" id="heat" style="grid-template-columns:minmax(56px,auto) repeat(14,minmax(0,1fr))">${h}</div>
  <div class="leg"><span><i style="background:var(--good)"></i>${t('Done')}</span><span><i style="background:var(--bad)"></i>${t('Missed')}</span><span><i style="background:var(--gold)"></i>${t('Partly')}</span><span><i style="background:var(--s2)"></i>${t('Rest / not logged')}</span><span><i style="background:var(--gold)"></i>C ${t('Free cheat meal')}</span>${pad ? `<span><i class="padk"></i>${t('Before the start')}</span>` : ''}</div>
  <div class="det" id="det"></div>${ln ? `<div class="note" id="lnote"><b>${t('Latest note')} · ${wd(ln.d)} ${fmt(ln.d)}</b><span class="keep">${esc(ln.note)}</span></div>` : ''}</section>`;
}
function dayDetail(d) {
  const st = d.ms === 'cheat' && d.ok ? `<span class="pill ok">${t('Locked in')} · 🍕 ${t('Cheat meal')}</span>` : d.ok ? `<span class="pill ok">${t('Locked in')}</span>` : d.now ? `<span class="pill">${t('In progress')}</span>` : `<span class="pill no">${d.miss && d.miss.length ? t('Missed: {0}', esc(d.miss.map(trw).join(', '))) : t('Missed')}</span>`;
  const bits = [
    d.k ? (d.tk ? t('{0} / {1} kcal', nf(d.k), nf(d.tk)) : t('{0} kcal', nf(d.k))) : '',
    d.p ? (d.tp ? t('{0} / {1} g protein', d.p, d.tp) : t('{0} g protein', d.p)) : '',
    t('{0} / {1} L water', d.w, d.wg),
    d.tr === 'rest' ? t('Rest day') : `${d.tr === 'done' ? '✓' : '✗'} ${esc(d.wo ? d.wo.n : trw(d.tt))}`,
    d.sup && d.sup[1] ? t('Supps {0}/{1}', d.sup[0], d.sup[1]) : '',
    d.sl ? t('{0} h sleep', d.sl) : '', d.wt ? t('{0} kg', d.wt) : '',
  ].filter(Boolean);
  return `<div class="dt-h"><b>${fmt(d.d, { weekday: 'long', day: 'numeric', month: 'short' })}</b>${st}</div><div class="dt-b num">${bits.map(b => `<span>${b}</span>`).join('')}</div>${d.note ? `<div class="note"><b>${t('note')}</b><span class="keep">${esc(d.note)}</span></div>` : ''}`;
}

function measureCard(s) {
  const ck = (s.checkins || []).filter(c => c.waist || c.chest || c.hips || c.arm || c.neck);
  if (!ck.length) return '';
  const L = ck[ck.length - 1], F = ck[0], keys = ['waist', 'chest', 'hips', 'arm', 'neck'].filter(k => L[k]);
  const cell = k => { const dv = F[k] && ck.length > 1 ? L[k] - F[k] : null; return `<div><b class="num">${t('{0} cm', r1(L[k]))}</b><span>${t(k)}${dv ? ` · <span class="num">${sgn(dv)}</span>` : ''}</span></div>`; };
  const cells = keys.slice(0, s.height && L.waist ? 2 : 3).map(cell);
  if (s.height && L.waist) { const r = L.waist / s.height; cells.push(`<div><b class="num ${r < 0.5 ? 'ok' : ''}">${r.toFixed(2)}</b><span>${t('waist ÷ height')}</span></div>`); }
  const sk = keys[0], pts = ck.filter(c => c[sk]);
  let spark = '';
  if (pts.length >= 2) { const v = pts.map(c => c[sk]), lo = Math.min(...v), hi = Math.max(...v), rg = Math.max(hi - lo, 1), X = i => 6 + i / (pts.length - 1) * 288, Y = x => 8 + (hi - x) / rg * 34; spark = `<svg class="chart" viewBox="0 0 300 50" width="100%" height="50" aria-hidden="true"><polyline points="${v.map((x, i) => `${X(i).toFixed(1)},${Y(x).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--good)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><g fill="var(--good)">${v.map((x, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(x).toFixed(1)}" r="3"><title>${fmt(pts[i].date)} · ${x} cm</title></circle>`).join('')}</g></svg>`; }
  return `<section class="card"><h2>${t('Measurements')}</h2><span class="sub">${ck.length === 1 ? t('1 check-in') : t('{0} check-ins', ck.length)} · ${fmt(L.date)}</span><div class="kp">${cells.join('')}</div>${spark}</section>`;
}

function render(s) {
  s.weights = (s.weights || []).map(x => Array.isArray(x) ? x : [x.d, x.w]).filter(([d, w]) => d && w).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const html = document.documentElement; html.lang = AR() ? 'ar' : 'en'; html.dir = AR() ? 'rtl' : 'ltr';
  const days = s.days || [], wts = s.weights, name = s.name || 'Athlete', upd = s.updated || null, stale = upd && Date.now() - upd > 36 * 36e5;
  document.title = `${name} · Lock In 90`;
  $('hdr').innerHTML = `<div class="brand"><span><img src="icons/logo.svg" alt="">Lock In 90 · ${t('Coach view')}</span><span class="tools"><button class="tbtn" id="theme" aria-label="${isDark() ? t('Light mode') : t('Dark mode')}" title="${isDark() ? t('Light mode') : t('Dark mode')}">${isDark() ? '☀' : '☾'}</button><button class="tbtn" id="lang">${AR() ? 'English' : 'العربية'}</button></span></div>
  <div class="who"><span class="av" aria-hidden="true">${esc([...name.trim()][0] || '?').toUpperCase()}</span><div><h1><span class="keep">${esc(name)}</span> · ${s.mode === 't' ? t('Daily tracker') : t('Day {0} of 90', s.day)}</h1><small><i class="live${stale ? ' stale' : ''}"></i>${upd ? ago(upd) + ' · ' : ''}${s.startDate ? t('started {0}', fmt(s.startDate)) : ''}</small></div></div>
  <div class="chips">${s.mode === 't' ? `<span>✓ ${t('In a row')} <b class="num">${s.streak ?? 0}</b></span><span>${t('Best run')} <b class="num">${s.best ?? 0}</b></span>` : `<span>🔥 ${t('Streak')} <b class="num">${s.streak ?? 0}</b></span><span>${t('Best')} <b class="num">${s.best ?? 0}</b></span><span>${t('Attempt {0}', s.attempt ?? 1)}</span>`}${s.goalWeight ? `<span>${t('Goal {0} kg', s.goalWeight)}</span>` : ''}${s.rank ? `<span>${t('Rank')} <b>${esc(trw(s.rank))}</b></span>` : ''}</div>`;
  if (!days.length) { $('main').innerHTML = `<section class="card span3"><p class="hint">${t('None logged yet.')}</p></section>`; bind(s, days); return; }
  $('main').innerHTML = weekCard(s, days) + flagsCard(s, days, wts) + weightCard(s, wts) + foodCard(days) + trainCard(days) + heatCard(s, days) + measureCard(s);
  $('foot').textContent = t('Read-only view shared from the Lock In 90 app · updates when {0} logs', name);
  bind(s, days);
  translate($('main'));
}
function bind(s, days) {
  $('lang').onclick = () => { LANG = AR() ? 'en' : 'ar'; store.set('lk-coach-lang', LANG); render(s); };
  $('theme').onclick = () => { THEME = isDark() ? 'light' : 'dark'; store.set('lk-coach-theme', THEME); applyTheme(); render(s); };
  const heat = $('heat'); if (!heat) return;
  const pick = i => { $('det').innerHTML = dayDetail(days[i]); translate($('det')); heat.querySelectorAll('.sel').forEach(e => e.classList.remove('sel')); heat.querySelectorAll(`[data-i="${i}"]`).forEach(e => e.classList.add('sel')); };
  heat.onclick = e => { const b = e.target.closest('[data-i]'); if (b) pick(+b.dataset.i); };
  pick(days.length - 1);
}

function fail(msg, h1) {
  $('main').innerHTML = `<div class="err card span3">${t(msg)}</div>`;
  if (h1) { const h = document.querySelector('#hdr h1'); if (h) h.textContent = t(h1); }
}
async function load() {
  applyTheme();
  const tk = new URLSearchParams(location.search).get('t');
  if (!tk) return fail('This link is missing its code. Ask for a new link.');
  try {
    const snap = await getDoc(doc(db, 'shares/' + tk));
    if (!snap.exists()) return fail('This link isn’t active any more. Ask for a new one.', 'Link not active');
    const s = snap.data(); if (!LANG) LANG = s.lang === 'ar' ? 'ar' : 'en';
    render(s);
    setInterval(() => { const sm = document.querySelector('.who small'); if (sm && s.updated) { const n = sm.childNodes[1]; if (n && n.nodeType === 3) n.nodeValue = ago(s.updated) + ' · ' + (s.startDate ? t('started {0}', fmt(s.startDate)) : ''); } }, 60000);
  } catch (e) { console.error(e); fail('Couldn’t load right now. Check the connection and refresh.'); }
}
load();
