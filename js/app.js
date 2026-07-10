/* SEVENTY-FIVE — a 75 Hard companion.
   All data lives on this device: localStorage for state, IndexedDB for proof photos. */
'use strict';

/* ───────────────────────── Tasks ───────────────────────── */

const TASKS = [
  { id: 'workout1', title: 'First Workout', sub: '45 minutes. Give it everything.', proof: true, icon: 'dumbbell' },
  { id: 'workout2', title: 'Second Workout', sub: '45 minutes, outdoors — whatever the weather.', proof: true, icon: 'sun' },
  { id: 'water', title: 'One Gallon of Water', sub: '', proof: false, icon: 'drop', type: 'water' },
  { id: 'read', title: 'Read Ten Pages', sub: 'Non-fiction. Real pages — no audiobooks.', proof: true, icon: 'book', type: 'read' },
  { id: 'diet', title: 'Hold the Diet', sub: 'No alcohol. No slips.', proof: false, icon: 'fork', type: 'diet' },
  { id: 'photo', title: 'Progress Photo', sub: 'One photo, every single day.', proof: true, icon: 'camera', type: 'photo' },
];

const STORE_KEY = '75hard.v1';
const CODE_PREFIX = '75H:';

/* ───────────────────────── Utilities ───────────────────────── */

const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function todayStr() {
  const dev = localStorage.getItem('75hard.devToday');
  return dev || fmtDate(new Date());
}
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return fmtDate(d); }
function diffDays(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 864e5); }
function prettyDate(s) {
  return parseDate(s).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function shortDate(s) {
  return parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function roman(n) {
  const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let out = '';
  for (const [v, sym] of map) while (n >= v) { out += sym; n -= v; }
  return out || 'I';
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

/* ───────────────────────── Icons ───────────────────────── */

const ICONS = {
  dumbbell: '<path d="M4 9v6M7.5 6v12M16.5 6v12M20 9v6M7.5 12h9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  drop: '<path d="M12 3.2s6 6.6 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.2 12 3.2z"/>',
  book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17.5H7.5A2.5 2.5 0 0 0 5 22V4.5z"/><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19"/>',
  fork: '<path d="M7 3v5.5a2.5 2.5 0 0 0 5 0V3M9.5 3v18M16.5 12.5c-1.6 0-2.5-2-2.5-4.5s1.2-5 2.5-5v18"/>',
  camera: '<path d="M3 8.2A2.2 2.2 0 0 1 5.2 6h2.1l1.5-2.2h6.4L16.7 6h2.1A2.2 2.2 0 0 1 21 8.2v9.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8V8.2z"/><circle cx="12" cy="12.8" r="3.4"/>',
  check: '<path d="M5 12.5l4.3 4.3L19 7.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  rings: '<circle cx="9" cy="12" r="5.6"/><circle cx="15" cy="12" r="5.6"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<path d="M12 3v12M8 6.5L12 3l4 3.5"/><path d="M5 11v8.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V11"/>',
  trash: '<path d="M4 6.5h16M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7M6.5 6.5l.8 13a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-13"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  seal: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.7 2.7 5-5.4"/>',
};

function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ───────────────────────── State ───────────────────────── */

function blankPerson() {
  return { checks: {}, proofs: {}, water: 0, pages: 0, cheat: null };
}

function defaultState() {
  return {
    v: 1,
    onboarded: false,
    profile: { name: '', mode: 'solo', partnerName: '', coupleRule: 'together' },
    attempt: { n: 1, startDate: todayStr(), status: 'active' },
    history: [],
    days: {},
    books: [],
    currentBookId: null,
    cheat: { allowance: 10, used: [] },
    settings: { strictProof: true, waterGoalOz: 128, pagesGoal: 10, installHintDismissed: false },
  };
}

let S = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch {
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
  } catch (e) {
    showToast('Storage is full — free space or export a backup.');
  }
}

/* UI-only state (never persisted) */
const UI = {
  tab: 'today',
  sheet: null,       // { type, ...props }
  fixing: null,      // date being retro-completed
  obStep: 0,
  ob: { name: '', mode: 'solo', partnerName: '', coupleRule: 'together', startOpt: 'today' },
  lastToday: todayStr(),
  galleryFor: null,
};

const proofURLs = new Map();
let pendingCapture = null;

/* ───────────────────────── Derived helpers ───────────────────────── */

const isCouple = () => S.profile.mode === 'couple';
const startDate = () => S.attempt.startDate;
const dayNumberOf = date => diffDays(startDate(), date) + 1;
const currentDayN = () => dayNumberOf(todayStr());

function ensureDay(date) {
  if (!S.days[date]) S.days[date] = { me: blankPerson() };
  if (isCouple() && !S.days[date].partner) S.days[date].partner = blankPerson();
  if (!S.days[date].me) S.days[date].me = blankPerson();
  return S.days[date];
}

function getDay(date) {
  return S.days[date] || { me: blankPerson(), partner: blankPerson() };
}

function proofOk(person, who, taskId) {
  if (who !== 'me') return true;
  if (!S.settings.strictProof) return true;
  return !!person.proofs[taskId];
}

function taskDone(day, who, task) {
  const p = day[who];
  if (!p) return false;
  switch (task.type) {
    case 'water': return p.water >= S.settings.waterGoalOz;
    case 'read': return p.pages >= S.settings.pagesGoal && proofOk(p, who, 'read');
    case 'photo': return who === 'me' ? !!p.proofs.photo : !!p.checks.photo;
    case 'diet': return !!p.checks.diet;
    default: return !!p.checks[task.id] && proofOk(p, who, task.id);
  }
}

function personDone(day, who) {
  return TASKS.every(t => taskDone(day, who, t));
}

function dayComplete(date) {
  const day = getDay(date);
  if (!personDone(day, 'me')) return false;
  if (isCouple() && S.profile.coupleRule === 'together') return personDone(day, 'partner');
  return true;
}

function missedTasks(date, who) {
  const day = getDay(date);
  return TASKS.filter(t => !taskDone(day, who, t));
}

function cheatUsed(who) {
  return S.cheat.used.filter(u => u.who === who).length;
}
function cheatRemaining(who) {
  return Math.max(0, S.cheat.allowance - cheatUsed(who));
}

function currentBook() {
  return S.books.find(b => b.id === S.currentBookId) || null;
}

function doneCount(date, who) {
  const day = getDay(date);
  return TASKS.filter(t => taskDone(day, who, t)).length;
}

/* ───────────────────────── Failure / victory engine ───────────────────────── */

function computeFail() {
  if (!S.onboarded || S.attempt.status !== 'active') return null;
  const today = todayStr();
  const start = startDate();
  if (diffDays(start, today) <= 0) return null;
  const lastCheck = Math.min(diffDays(start, today) - 1, 74);
  for (let i = 0; i <= lastCheck; i++) {
    const date = addDays(start, i);
    if (!dayComplete(date)) {
      const whoMissed = [];
      if (!personDone(getDay(date), 'me')) whoMissed.push('me');
      if (isCouple() && S.profile.coupleRule === 'together' && !personDone(getDay(date), 'partner')) whoMissed.push('partner');
      return {
        date,
        dayN: i + 1,
        whoMissed,
        fixable: date === addDays(today, -1),
      };
    }
  }
  return null;
}

function checkVictory() {
  if (S.attempt.status !== 'active') return;
  const today = todayStr();
  if (diffDays(startDate(), today) < 74) return;
  for (let i = 0; i < 75; i++) {
    if (!dayComplete(addDays(startDate(), i))) return;
  }
  S.attempt.status = 'complete';
  S.history.push({
    n: S.attempt.n,
    start: startDate(),
    end: addDays(startDate(), 74),
    days: 75,
    note: 'Completed',
  });
  save();
}

function doRestart(note) {
  const fail = computeFail();
  const completed = fail ? fail.dayN - 1 : Math.max(0, Math.min(currentDayN() - 1, 75));
  S.history.push({
    n: S.attempt.n,
    start: startDate(),
    end: todayStr(),
    days: completed,
    note: note || 'Restarted',
  });
  S.attempt = { n: S.attempt.n + 1, startDate: todayStr(), status: 'active' };
  S.days = {};
  S.cheat.used = [];
  UI.fixing = null;
  UI.sheet = null;
  save();
  showToast(`Attempt ${roman(S.attempt.n)}. Day 1 starts now.`);
}

/* ───────────────────────── Photos ───────────────────────── */

function proofId(date, who, taskId) {
  return `${S.attempt.n}|${date}|${who}|${taskId}`;
}

function openCapture(date, who, taskId) {
  pendingCapture = { date, who, taskId };
  let input = $('#fileInput');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.id = 'fileInput';
    input.style.display = 'none';
    input.addEventListener('change', onFileChosen);
    document.body.appendChild(input);
  }
  input.value = '';
  input.click();
}

function onFileChosen(e) {
  const file = e.target.files && e.target.files[0];
  const ctx = pendingCapture;
  pendingCapture = null;
  if (!file || !ctx) return;
  downscaleImage(file).then(blob => {
    const id = proofId(ctx.date, ctx.who, ctx.taskId);
    return DB.putProof({
      id, blob,
      date: ctx.date, who: ctx.who, taskId: ctx.taskId,
      attempt: S.attempt.n, ts: Date.now(),
    }).then(() => {
      const old = proofURLs.get(id);
      if (old) { URL.revokeObjectURL(old); proofURLs.delete(id); }
      const day = ensureDay(ctx.date);
      day[ctx.who].proofs[ctx.taskId] = id;
      save();
      evaluateAndRender();
      showToast(ctx.taskId === 'photo' ? 'Progress photo saved.' : 'Proof attached.');
    });
  }).catch(() => showToast('Could not read that image.'));
}

function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('encode failed')), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
  });
}

function proofURL(id) {
  if (proofURLs.has(id)) return Promise.resolve(proofURLs.get(id));
  return DB.getProof(id).then(rec => {
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    proofURLs.set(id, url);
    return url;
  });
}

function deleteProof(date, who, taskId) {
  const id = proofId(date, who, taskId);
  const day = ensureDay(date);
  delete day[who].proofs[taskId];
  save();
  DB.deleteProof(id).then(() => {
    const old = proofURLs.get(id);
    if (old) { URL.revokeObjectURL(old); proofURLs.delete(id); }
    evaluateAndRender();
  });
}

/* ───────────────────────── Rendering ───────────────────────── */

function renderApp() {
  const root = $('#app');
  const content = $('.content');
  const scrollY = content ? content.scrollTop : 0;
  const prevTab = root.dataset.tab;

  let html;
  if (!S.onboarded) {
    html = renderOnboarding();
  } else if (S.attempt.status === 'complete' && !UI.browsingAfterWin) {
    html = renderVictory();
  } else {
    html = renderMain();
  }
  root.innerHTML = html;
  root.dataset.tab = UI.tab;

  if (prevTab === UI.tab) {
    const c = $('.content');
    if (c) c.scrollTop = scrollY;
  }
  hydrateProofImages();
}

/* ── Onboarding ── */

function renderOnboarding() {
  const ob = UI.ob;
  const steps = [];

  steps.push(`
    <div class="ob-step">
      <div class="ob-brand">
        <div class="kicker">The Challenge</div>
        <h1 class="serif ob-title">SEVENTY&#8211;FIVE</h1>
        <p class="ob-lede">Seventy-five days. Six commitments. Miss one and you start again from zero. No negotiation — that is the entire point.</p>
      </div>
      <ul class="ob-rules">
        ${TASKS.map(t => `<li>${icon(t.icon)}<span>${t.title}</span></li>`).join('')}
      </ul>
      <p class="ob-fine">Ten cheat-meal passes are granted for life's true occasions. Everything else is non-negotiable.</p>
      <button class="btn primary" data-action="obNext">Begin</button>
    </div>`);

  steps.push(`
    <div class="ob-step">
      <div class="kicker">Step one</div>
      <h2 class="serif ob-h2">Your name</h2>
      <p class="ob-lede">This challenge is a promise you make to yourself. Sign it.</p>
      <input class="input big" id="obName" type="text" placeholder="Your name" autocomplete="off" value="${esc(ob.name)}" maxlength="30">
      <div class="ob-actions">
        <button class="btn ghost" data-action="obBack">Back</button>
        <button class="btn primary" data-action="obNext">Continue</button>
      </div>
    </div>`);

  steps.push(`
    <div class="ob-step">
      <div class="kicker">Step two</div>
      <h2 class="serif ob-h2">Alone, or together</h2>
      <div class="mode-cards">
        <button class="mode-card ${ob.mode === 'solo' ? 'on' : ''}" data-action="obMode" data-mode="solo">
          ${icon('target')}
          <strong>Solo</strong>
          <span>Just you against the calendar.</span>
        </button>
        <button class="mode-card ${ob.mode === 'couple' ? 'on' : ''}" data-action="obMode" data-mode="couple">
          ${icon('rings')}
          <strong>As a couple</strong>
          <span>Two people, one challenge.</span>
        </button>
      </div>
      ${ob.mode === 'couple' ? `
        <input class="input big" id="obPartner" type="text" placeholder="Partner's name" autocomplete="off" value="${esc(ob.partnerName)}" maxlength="30">
        <div class="rule-pick">
          <button class="rule-opt ${ob.coupleRule === 'together' ? 'on' : ''}" data-action="obRule" data-rule="together">
            <strong>Bound together</strong>
            <span>If one of you misses a day, you both restart. The honest way.</span>
          </button>
          <button class="rule-opt ${ob.coupleRule === 'own' ? 'on' : ''}" data-action="obRule" data-rule="own">
            <strong>Side by side</strong>
            <span>You share the journey, but a partner's miss doesn't reset yours.</span>
          </button>
        </div>` : ''}
      <div class="ob-actions">
        <button class="btn ghost" data-action="obBack">Back</button>
        <button class="btn primary" data-action="obNext">Continue</button>
      </div>
    </div>`);

  steps.push(`
    <div class="ob-step">
      <div class="kicker">Step three</div>
      <h2 class="serif ob-h2">Day One</h2>
      <div class="seg">
        <button class="seg-opt ${ob.startOpt === 'today' ? 'on' : ''}" data-action="obStart" data-start="today">Today</button>
        <button class="seg-opt ${ob.startOpt === 'tomorrow' ? 'on' : ''}" data-action="obStart" data-start="tomorrow">Tomorrow</button>
      </div>
      <div class="commit-card">
        <p>“For the next seventy-five days I will keep every commitment on this list, every day, with proof — or I will go back to Day One and begin again.”</p>
        <div class="commit-sig serif">${esc(ob.name || 'Signed')}${ob.mode === 'couple' && ob.partnerName ? ` &amp; ${esc(ob.partnerName)}` : ''}</div>
      </div>
      <div class="ob-actions">
        <button class="btn ghost" data-action="obBack">Back</button>
        <button class="btn primary" data-action="obFinish">I'm in</button>
      </div>
    </div>`);

  return `
    <div class="ob">
      ${steps[UI.obStep]}
      <div class="dots">${steps.map((_, i) => `<span class="${i === UI.obStep ? 'on' : ''}"></span>`).join('')}</div>
    </div>`;
}

/* ── Main shell ── */

function renderMain() {
  const fail = computeFail();
  const showFail = fail && !(UI.fixing === fail.date && fail.fixable);
  const tabs = [
    { id: 'today', label: 'Today', icon: 'target' },
    { id: 'journey', label: 'Journey', icon: 'grid' },
    { id: 'reading', label: 'Reading', icon: 'book' },
    ...(isCouple() ? [{ id: 'couple', label: 'Together', icon: 'rings' }] : []),
    { id: 'more', label: 'More', icon: 'more' },
  ];

  let body = '';
  switch (UI.tab) {
    case 'today': body = renderToday(); break;
    case 'journey': body = renderJourney(); break;
    case 'reading': body = renderReading(); break;
    case 'couple': body = renderCouple(); break;
    case 'more': body = renderMore(); break;
  }

  return `
    <div class="screen">
      <main class="content">${body}</main>
      <nav class="tabbar">
        ${tabs.map(t => `
          <button class="tab-item ${UI.tab === t.id ? 'active' : ''}" data-action="tab" data-tab="${t.id}">
            ${icon(t.icon)}<span>${t.label}</span>
          </button>`).join('')}
      </nav>
      ${showFail ? renderFailOverlay(fail) : ''}
      ${UI.sheet ? renderSheet() : ''}
    </div>`;
}

/* ── Today ── */

function renderToday() {
  const today = todayStr();
  const editDate = UI.fixing || today;
  const isFixing = editDate !== today;
  const dayN = dayNumberOf(editDate);
  const preStart = dayN < 1;

  if (preStart) {
    return `
      <header class="appheader">
        <div class="kicker">${prettyDate(today)}</div>
        <h1 class="serif hero-num">Eve</h1>
        <p class="muted">Day One begins tomorrow. Sleep well — it's the last easy night for seventy-five days.</p>
      </header>`;
  }
  if (dayN > 75) {
    return `<header class="appheader"><h1 class="serif hero-num">75</h1><p class="muted">The challenge window has passed.</p></header>`;
  }

  const day = ensureDay(editDate);
  const me = day.me;
  const done = doneCount(editDate, 'me');
  const allDone = personDone(day, 'me');
  const partnerDone = isCouple() ? personDone(day, 'partner') : true;
  const sealed = dayComplete(editDate);
  const pct = done / TASKS.length;
  const R = 54, C = 2 * Math.PI * R;

  const installHint = shouldShowInstallHint() ? `
    <div class="card hint-card">
      <div>
        <strong>Put it on your Home Screen</strong>
        <p class="muted small">In Safari, tap ${icon('share', 'inline')} then “Add to Home Screen”. It becomes a real app — full screen, works offline.</p>
      </div>
      <button class="iconbtn" data-action="dismissInstallHint" aria-label="Dismiss">${icon('close')}</button>
    </div>` : '';

  return `
    ${isFixing ? `
      <div class="fixing-banner">
        <strong>Completing yesterday's log</strong> — be honest with yourself.
        <button class="btn small ghost" data-action="stopFixing">Back to today</button>
      </div>` : ''}
    <header class="appheader">
      <div class="header-row">
        <div>
          <div class="kicker">${prettyDate(editDate)} · Attempt ${roman(S.attempt.n)}</div>
          <h1 class="serif hero-num">Day ${dayN}</h1>
          <div class="muted">${allDone ? 'Everything is done. Sealed.' : `${done} of ${TASKS.length} complete · <span id="countdown">${countdownText()}</span>`}</div>
        </div>
        <div class="ring-wrap" aria-hidden="true">
          <svg class="ring" viewBox="0 0 120 120">
            <circle class="ring-track" cx="60" cy="60" r="${R}"/>
            <circle class="ring-fill" cx="60" cy="60" r="${R}"
              stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
          </svg>
          <div class="ring-label"><span class="serif">${dayN}</span><small>of 75</small></div>
        </div>
      </div>
    </header>
    ${installHint}
    ${sealed ? `
      <div class="card seal-card">
        ${icon('seal', 'seal-ic')}
        <div>
          <strong class="serif">Day ${dayN} sealed.</strong>
          <p class="muted small">${dayN === 75 ? 'This was the last one.' : `${75 - dayN} days remain. See you tomorrow.`}</p>
        </div>
      </div>` :
    allDone && isCouple() && S.profile.coupleRule === 'together' ? `
      <div class="card wait-card">
        ${icon('rings')}
        <div>
          <strong>Your side is done.</strong>
          <p class="muted small">Waiting on ${esc(S.profile.partnerName || 'your partner')} — the day seals when you both finish.</p>
        </div>
      </div>` : ''}
    <ul class="tasklist">
      ${TASKS.map(t => renderTaskRow(editDate, me, t)).join('')}
    </ul>
    <p class="footnote">Miss a single item and the count returns to zero. The rules are the rules.</p>`;
}

function renderTaskRow(date, me, t) {
  const day = getDay(date);
  const isDone = taskDone(day, 'me', t);
  const pid = me.proofs[t.id];

  let extra = '';
  let side = '';

  if (t.type === 'water') {
    const goal = S.settings.waterGoalOz;
    const oz = me.water;
    const p = Math.min(1, oz / goal);
    extra = `
      <div class="water-wrap">
        <div class="bar"><div class="bar-fill" style="width:${(p * 100).toFixed(1)}%"></div></div>
        <div class="water-row">
          <span class="water-count">${oz} <small>/ ${goal} oz</small></span>
          <span class="chips">
            <button class="chip" data-action="water" data-date="${date}" data-oz="8">+8</button>
            <button class="chip" data-action="water" data-date="${date}" data-oz="16">+16</button>
            <button class="chip" data-action="water" data-date="${date}" data-oz="32">+32</button>
            <button class="chip minus" data-action="water" data-date="${date}" data-oz="-8">−8</button>
          </span>
        </div>
      </div>`;
  }

  if (t.type === 'read') {
    const book = currentBook();
    const goal = S.settings.pagesGoal;
    extra = `
      <div class="read-wrap">
        ${book ? `
          <button class="book-chip" data-action="tab" data-tab="reading">
            ${icon('book')} <span>${esc(book.title)}</span> ${icon('chev', 'chev')}
          </button>` : `
          <button class="book-chip empty" data-action="sheet" data-sheet="addBook">
            ${icon('plus')} <span>Add the book you're reading</span>
          </button>`}
        <div class="water-row">
          <span class="water-count">${me.pages} <small>/ ${goal} pages</small></span>
          <span class="chips">
            <button class="chip" data-action="pages" data-date="${date}" data-n="1">+1</button>
            <button class="chip" data-action="pages" data-date="${date}" data-n="5">+5</button>
            <button class="chip minus" data-action="pages" data-date="${date}" data-n="-1">−1</button>
          </span>
        </div>
      </div>`;
  }

  if (t.type === 'diet') {
    if (me.cheat) {
      extra = `
        <button class="cheat-badge" data-action="sheet" data-sheet="cheatDetail" data-date="${date}">
          Cheat pass used — ${esc(me.cheat.occasion || 'special occasion')}
        </button>`;
    } else if (!isDone) {
      extra = `
        <button class="cheat-link" data-action="sheet" data-sheet="cheat" data-date="${date}">
          A true occasion? Use one of your ${cheatRemaining('me')} passes
        </button>`;
    }
  }

  if (t.proof) {
    if (pid) {
      side = `<button class="proof-thumb" data-action="viewProof" data-date="${date}" data-task="${t.id}" aria-label="View proof">
        <img data-proof-src="${esc(pid)}" alt="">
      </button>`;
    } else {
      side = `<button class="proof-btn" data-action="capture" data-date="${date}" data-task="${t.id}" aria-label="Attach proof">
        ${icon('camera')}
      </button>`;
    }
  }

  const subline = t.type === 'water'
    ? `${S.settings.waterGoalOz} oz across the day — about ${(S.settings.waterGoalOz * 0.0296).toFixed(1)} litres.`
    : t.sub;

  return `
    <li class="card task ${isDone ? 'done' : ''}">
      <div class="task-main">
        <button class="task-check ${isDone ? 'on' : ''}" data-action="toggle" data-date="${date}" data-task="${t.id}" aria-label="${esc(t.title)}">
          ${icon('check')}
        </button>
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          <div class="task-sub">${subline}</div>
        </div>
        <div class="task-side">${side}</div>
      </div>
      ${extra ? `<div class="task-extra">${extra}</div>` : ''}
    </li>`;
}

/* ── Journey ── */

function renderJourney() {
  const today = todayStr();
  const curN = Math.min(Math.max(currentDayN(), 0), 76);
  let cells = '';
  for (let i = 1; i <= 75; i++) {
    const date = addDays(startDate(), i - 1);
    let cls = 'future';
    if (i < curN && dayComplete(date)) cls = 'done';
    else if (i === curN) cls = dayComplete(date) ? 'done today' : 'today';
    cells += `<div class="cell ${cls}" title="Day ${i}">${i === curN ? i : ''}</div>`;
  }

  const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);
  const sealedDays = countSealedDays();

  return `
    <header class="appheader">
      <div class="kicker">The record</div>
      <h1 class="serif page-title">Journey</h1>
    </header>
    <div class="card">
      <div class="grid75">${cells}</div>
      <div class="grid-legend">
        <span><i class="dot done"></i>Sealed</span>
        <span><i class="dot today"></i>Today</span>
        <span><i class="dot"></i>Ahead</span>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-v serif">${sealedDays}</div><div class="stat-l">Days sealed</div></div>
      <div class="stat"><div class="stat-v serif">${Math.max(0, 75 - Math.min(Math.max(currentDayN(), 0), 75))}</div><div class="stat-l">Days ahead</div></div>
      <div class="stat"><div class="stat-v serif">${cheatRemaining('me')}</div><div class="stat-l">Passes left</div></div>
      <div class="stat"><div class="stat-v serif">${totalPages}</div><div class="stat-l">Pages read</div></div>
    </div>
    <div class="card">
      <div class="card-head">
        <strong>Progress photos</strong>
        <span class="muted small">Day by day</span>
      </div>
      <div class="strip" id="photoStrip"><span class="muted small strip-empty">Your daily photos will line up here.</span></div>
    </div>
    ${S.history.length ? `
      <div class="card">
        <div class="card-head"><strong>Past attempts</strong></div>
        <ul class="list">
          ${S.history.slice().reverse().map(h => `
            <li class="row">
              <div>
                <strong>Attempt ${roman(h.n)}</strong>
                <div class="muted small">${shortDate(h.start)} — ${shortDate(h.end)} · ${h.days} day${h.days === 1 ? '' : 's'}</div>
              </div>
              <span class="muted small">${esc(h.note)}</span>
            </li>`).join('')}
        </ul>
      </div>` : ''}`;
}

function countSealedDays() {
  let n = 0;
  const cur = currentDayN();
  for (let i = 1; i <= Math.min(cur, 75); i++) {
    if (dayComplete(addDays(startDate(), i - 1))) n++;
  }
  return n;
}

/* ── Reading ── */

function renderReading() {
  const book = currentBook();
  const finished = S.books.filter(b => b.done);
  const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);

  return `
    <header class="appheader">
      <div class="kicker">Ten pages, every day</div>
      <h1 class="serif page-title">Reading</h1>
    </header>
    ${book ? `
      <div class="card book-card">
        <div class="kicker">Now reading</div>
        <h2 class="serif book-title">${esc(book.title)}</h2>
        ${book.author ? `<div class="muted">${esc(book.author)}</div>` : ''}
        <div class="bar big"><div class="bar-fill" style="width:${Math.min(100, (book.pagesRead / book.totalPages) * 100).toFixed(1)}%"></div></div>
        <div class="book-meta">
          <span>${book.pagesRead} of ${book.totalPages} pages</span>
          <span>${Math.max(0, book.totalPages - book.pagesRead)} to go</span>
        </div>
        ${book.pagesRead >= book.totalPages ? `
          <button class="btn primary" data-action="finishBook" data-id="${esc(book.id)}">Mark as finished</button>` : `
          <p class="muted small">Log today's pages from the Today screen — they count toward this book automatically.</p>`}
      </div>` : `
      <div class="card empty-card">
        <p class="muted">No book on the nightstand. Ten pages of non-fiction a day — pick something worth seventy-five days.</p>
      </div>`}
    <button class="btn ghost wide" data-action="sheet" data-sheet="addBook">${icon('plus')} ${book ? 'Start a different book' : 'Add your book'}</button>
    ${finished.length ? `
      <div class="card">
        <div class="card-head"><strong>Finished</strong><span class="muted small">${finished.length} book${finished.length === 1 ? '' : 's'}</span></div>
        <ul class="list">
          ${finished.map(b => `
            <li class="row">
              <div><strong>${esc(b.title)}</strong>${b.author ? `<div class="muted small">${esc(b.author)}</div>` : ''}</div>
              <span class="badge-gold">${b.totalPages} pp</span>
            </li>`).join('')}
        </ul>
      </div>` : ''}
    <div class="stat-row">
      <div class="stat"><div class="stat-v serif">${totalPages}</div><div class="stat-l">Pages, all time</div></div>
      <div class="stat"><div class="stat-v serif">${finished.length}</div><div class="stat-l">Books finished</div></div>
    </div>`;
}

/* ── Couple ── */

function renderCouple() {
  const today = todayStr();
  const day = ensureDay(today);
  const partner = S.profile.partnerName || 'Your partner';
  const pDone = doneCount(today, 'partner');
  const pAll = personDone(day, 'partner');

  return `
    <header class="appheader">
      <div class="kicker">${S.profile.coupleRule === 'together' ? 'Bound together — one misses, both restart' : 'Side by side'}</div>
      <h1 class="serif page-title">${esc(partner)}</h1>
      <p class="muted">${pAll ? `${esc(partner)} has sealed the day.` : `${pDone} of ${TASKS.length} complete today.`}</p>
    </header>
    <div class="card">
      <div class="card-head"><strong>${esc(partner)}'s day</strong><span class="muted small">${prettyDate(today)}</span></div>
      <ul class="plist">
        ${TASKS.map(t => {
          const isDone = taskDone(day, 'partner', t);
          return `
            <li class="prow">
              <button class="task-check small ${isDone ? 'on' : ''}" data-action="partnerToggle" data-date="${today}" data-task="${t.id}">${icon('check')}</button>
              <span class="${isDone ? '' : 'muted'}">${t.title}</span>
              ${t.type === 'water' ? `<span class="muted small pdetail">${day.partner.water} oz</span>` : ''}
              ${t.type === 'read' ? `<span class="muted small pdetail">${day.partner.pages} pp</span>` : ''}
              ${t.type === 'diet' && day.partner.cheat ? `<span class="muted small pdetail">pass: ${esc(day.partner.cheat.occasion || '')}</span>` : ''}
            </li>`;
        }).join('')}
      </ul>
      <p class="muted small">Sharing one phone? Tap their list directly — their word is their bond. On two phones, trade day codes below.</p>
    </div>
    <div class="duo">
      <button class="btn primary" data-action="shareDay">${icon('share')} Share my day</button>
      <button class="btn ghost" data-action="sheet" data-sheet="importPartner">Enter their code</button>
    </div>
    <div class="card">
      <div class="card-head"><strong>The pact</strong></div>
      <div class="rule-pick">
        <button class="rule-opt ${S.profile.coupleRule === 'together' ? 'on' : ''}" data-action="setCoupleRule" data-rule="together">
          <strong>Bound together</strong>
          <span>If one of you misses a day, you both go back to Day One.</span>
        </button>
        <button class="rule-opt ${S.profile.coupleRule === 'own' ? 'on' : ''}" data-action="setCoupleRule" data-rule="own">
          <strong>Side by side</strong>
          <span>Their miss is noted, but only your own miss resets you.</span>
        </button>
      </div>
    </div>`;
}

/* ── More ── */

function renderMore() {
  const usedList = S.cheat.used.filter(u => u.who === 'me');
  return `
    <header class="appheader">
      <div class="kicker">Everything else</div>
      <h1 class="serif page-title">More</h1>
    </header>

    <div class="card">
      <div class="card-head"><strong>Profile</strong></div>
      <div class="field"><label>Your name</label>
        <input class="input" type="text" data-field="name" value="${esc(S.profile.name)}" maxlength="30">
      </div>
      <div class="field"><label>Mode</label>
        <div class="seg">
          <button class="seg-opt ${!isCouple() ? 'on' : ''}" data-action="setMode" data-mode="solo">Solo</button>
          <button class="seg-opt ${isCouple() ? 'on' : ''}" data-action="setMode" data-mode="couple">Couple</button>
        </div>
      </div>
      ${isCouple() ? `
        <div class="field"><label>Partner's name</label>
          <input class="input" type="text" data-field="partnerName" value="${esc(S.profile.partnerName)}" maxlength="30">
        </div>` : ''}
    </div>

    <div class="card">
      <div class="card-head"><strong>Cheat-meal passes</strong><span class="badge-gold">${cheatRemaining('me')} left</span></div>
      <div class="pass-dots">${Array.from({ length: S.cheat.allowance }, (_, i) =>
        `<span class="pass-dot ${i < usedList.length ? 'used' : ''}"></span>`).join('')}</div>
      ${usedList.length ? `
        <ul class="list">
          ${usedList.map(u => `
            <li class="row">
              <div><strong>${esc(u.occasion || 'Special occasion')}</strong>
              <div class="muted small">${shortDate(u.date)}</div></div>
            </li>`).join('')}
        </ul>` : `<p class="muted small">None used. Save them for the moments that matter — a wedding, a birthday, an anniversary.</p>`}
    </div>

    <div class="card">
      <div class="card-head"><strong>Rules</strong></div>
      <div class="row-setting">
        <div><strong>Require proof</strong><div class="muted small">Workouts and reading need a photo before they count.</div></div>
        <button class="switch ${S.settings.strictProof ? 'on' : ''}" data-action="toggleStrict" role="switch" aria-checked="${S.settings.strictProof}"><i></i></button>
      </div>
      <div class="row-setting">
        <div><strong>Water goal</strong><div class="muted small">One gallon is the standard.</div></div>
        <div class="seg tight">
          ${[96, 128].map(v => `<button class="seg-opt ${S.settings.waterGoalOz === v ? 'on' : ''}" data-action="setWaterGoal" data-v="${v}">${v} oz</button>`).join('')}
        </div>
      </div>
      <div class="row-setting">
        <div><strong>Pages per day</strong></div>
        <div class="seg tight">
          ${[10, 15, 20].map(v => `<button class="seg-opt ${S.settings.pagesGoal === v ? 'on' : ''}" data-action="setPagesGoal" data-v="${v}">${v}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><strong>The commitments</strong></div>
      <ol class="rules-list">
        <li>Two 45-minute workouts a day — one of them outdoors.</li>
        <li>Drink one gallon of water.</li>
        <li>Read ten pages of a non-fiction book.</li>
        <li>Follow your chosen diet. No alcohol.</li>
        <li>Take a progress photo, every day.</li>
        <li>Miss any item, any day — return to Day One.</li>
      </ol>
      <p class="muted small">House rule: ten cheat-meal passes for genuine occasions across the seventy-five days. Use them like they're gold, because they are.</p>
    </div>

    <div class="card">
      <div class="card-head"><strong>Install on iPhone</strong></div>
      <ol class="rules-list">
        <li>Open this page in <strong>Safari</strong>.</li>
        <li>Tap the share button ${icon('share', 'inline')} in the toolbar.</li>
        <li>Choose <strong>“Add to Home Screen”</strong>, then <strong>Add</strong>.</li>
      </ol>
      <p class="muted small">It opens full-screen like a native app and works offline. Your data never leaves the phone.</p>
    </div>

    <div class="card">
      <div class="card-head"><strong>Data</strong></div>
      <div class="duo">
        <button class="btn ghost" data-action="exportData">Export backup</button>
        <button class="btn ghost" data-action="importData">Import backup</button>
      </div>
      <p class="muted small">Backups carry your log and settings. Proof photos stay on the device they were taken on.</p>
    </div>

    <div class="card danger-card">
      <div class="card-head"><strong>Danger</strong></div>
      <button class="btn danger wide" data-action="confirmRestart">Restart from Day One</button>
      <button class="btn ghost wide dim" data-action="confirmErase">Erase everything</button>
    </div>
    <p class="footnote">Built for the disciplined. No accounts, no cloud, no excuses.</p>`;
}

/* ── Failure overlay ── */

function renderFailOverlay(fail) {
  const names = fail.whoMissed.map(w => w === 'me' ? (S.profile.name || 'You') : (S.profile.partnerName || 'Your partner'));
  const missed = missedTasks(fail.date, fail.whoMissed[0]);
  return `
    <div class="overlay fail">
      <div class="overlay-inner">
        <div class="kicker">Day ${fail.dayN} — ${prettyDate(fail.date)}</div>
        <h1 class="serif">The chain is broken.</h1>
        <p class="overlay-lede">${esc(names.join(' and '))} left the day unfinished:</p>
        <ul class="missed-list">
          ${missed.map(t => `<li>${icon(t.icon)}<span>${t.title}</span></li>`).join('')}
        </ul>
        <p class="overlay-lede muted">Seventy-five means seventy-five. It starts again — and that's not failure, it's practice.</p>
        <button class="btn primary wide" data-action="restartNow">Back to Day One</button>
        ${fail.fixable ? `
          <button class="btn ghost wide" data-action="fixYesterday" data-date="${fail.date}">
            It was done — complete yesterday's log
          </button>` : ''}
      </div>
    </div>`;
}

/* ── Victory ── */

function renderVictory() {
  const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);
  const passes = cheatUsed('me');
  return `
    <div class="overlay win">
      <div class="overlay-inner">
        <div class="kicker">${shortDate(startDate())} — ${shortDate(addDays(startDate(), 74))}</div>
        <h1 class="serif win-num">75</h1>
        <h2 class="serif">Done. All of it.</h2>
        <p class="overlay-lede">Seventy-five days, ${150 * 45 / 60} hours of training, a gallon a day, ${totalPages} pages read${passes ? `, and ${passes} pass${passes === 1 ? '' : 'es'} spent well` : ''}. You are not the person who started this.</p>
        <button class="btn primary wide" data-action="shareWin">${icon('share')} Tell the world</button>
        <button class="btn ghost wide" data-action="newChallenge">Begin another 75</button>
        <button class="btn ghost wide dim" data-action="browseAfterWin">Just let me look around</button>
      </div>
    </div>`;
}

/* ── Sheets ── */

function renderSheet() {
  const sh = UI.sheet;
  let inner = '';

  if (sh.type === 'cheat') {
    const left = cheatRemaining('me');
    inner = `
      <div class="sheet-title serif">A true occasion</div>
      <p class="muted">You hold ${left} pass${left === 1 ? '' : 'es'}. One covers a single cheat meal — the diet stands for the rest of the day.</p>
      <div class="pass-dots">${Array.from({ length: S.cheat.allowance }, (_, i) =>
        `<span class="pass-dot ${i < cheatUsed('me') ? 'used' : ''}"></span>`).join('')}</div>
      <input class="input" id="cheatOccasion" type="text" placeholder="The occasion — e.g. Mom's birthday" maxlength="60">
      ${left > 0
        ? `<button class="btn primary wide" data-action="useCheat" data-date="${esc(sh.date)}">Use a pass</button>`
        : `<p class="muted">None left. The diet stands.</p>`}
      <button class="btn ghost wide" data-action="closeSheet">Not today</button>`;
  }

  if (sh.type === 'cheatDetail') {
    const day = getDay(sh.date);
    const c = day.me.cheat;
    inner = `
      <div class="sheet-title serif">Cheat pass</div>
      <p class="muted">${esc(c && c.occasion || 'Special occasion')} · ${prettyDate(sh.date)}</p>
      <button class="btn danger wide" data-action="removeCheat" data-date="${esc(sh.date)}">Take the pass back</button>
      <button class="btn ghost wide" data-action="closeSheet">Close</button>`;
  }

  if (sh.type === 'addBook') {
    inner = `
      <div class="sheet-title serif">A new book</div>
      <input class="input" id="bookTitle" type="text" placeholder="Title" maxlength="80">
      <input class="input" id="bookAuthor" type="text" placeholder="Author (optional)" maxlength="60">
      <input class="input" id="bookPages" type="number" inputmode="numeric" placeholder="Total pages" min="1" max="9999">
      <button class="btn primary wide" data-action="addBook">Start reading</button>
      <button class="btn ghost wide" data-action="closeSheet">Cancel</button>`;
  }

  if (sh.type === 'importPartner') {
    inner = `
      <div class="sheet-title serif">Partner's day code</div>
      <p class="muted">Paste the code ${esc(S.profile.partnerName || 'your partner')} sent you. It updates their side of the ledger.</p>
      <textarea class="input" id="partnerCode" rows="4" placeholder="75H:…"></textarea>
      <button class="btn primary wide" data-action="applyPartnerCode">Apply</button>
      <button class="btn ghost wide" data-action="closeSheet">Cancel</button>`;
  }

  if (sh.type === 'proofViewer') {
    const day = getDay(sh.date);
    const pid = day[sh.who || 'me'].proofs[sh.task];
    const t = TASKS.find(x => x.id === sh.task);
    inner = `
      <div class="sheet-title serif">${t ? t.title : 'Proof'}</div>
      <p class="muted small">Day ${dayNumberOf(sh.date)} · ${prettyDate(sh.date)}</p>
      <div class="proof-view">${pid ? `<img data-proof-src="${esc(pid)}" alt="Proof photo">` : ''}</div>
      <div class="duo">
        <button class="btn ghost" data-action="retakeProof" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}">Retake</button>
        <button class="btn danger" data-action="deleteProofBtn" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}">${icon('trash')} Remove</button>
      </div>
      <button class="btn ghost wide" data-action="closeSheet">Close</button>`;
  }

  if (sh.type === 'confirm') {
    inner = `
      <div class="sheet-title serif">${esc(sh.title)}</div>
      <p class="muted">${esc(sh.body)}</p>
      <button class="btn ${sh.danger ? 'danger' : 'primary'} wide" data-action="${esc(sh.confirmAction)}">${esc(sh.confirmLabel)}</button>
      <button class="btn ghost wide" data-action="closeSheet">Cancel</button>`;
  }

  if (sh.type === 'shareCode') {
    inner = `
      <div class="sheet-title serif">Your day code</div>
      <p class="muted">Send this to ${esc(S.profile.partnerName || 'your partner')} — they paste it under “Enter their code”.</p>
      <textarea class="input mono" rows="5" readonly id="myCode">${esc(sh.code)}</textarea>
      <button class="btn primary wide" data-action="copyCode">Copy code</button>
      <button class="btn ghost wide" data-action="closeSheet">Done</button>`;
  }

  return `
    <div class="sheet-backdrop" data-action="closeSheet">
      <div class="sheet" data-stop>
        <div class="sheet-handle"></div>
        ${inner}
      </div>
    </div>`;
}

/* ───────────────────────── Async hydration ───────────────────────── */

function hydrateProofImages() {
  document.querySelectorAll('img[data-proof-src]').forEach(img => {
    const id = img.getAttribute('data-proof-src');
    proofURL(id).then(url => { if (url) img.src = url; });
  });
  const strip = $('#photoStrip');
  if (strip) hydrateGallery(strip);
}

function hydrateGallery(strip) {
  DB.allProofs().then(all => {
    const photos = all
      .filter(r => r.taskId === 'photo' && r.who === 'me' && r.attempt === S.attempt.n)
      .sort((a, b) => a.date < b.date ? -1 : 1);
    if (!photos.length) return;
    strip.innerHTML = photos.map(r => `
      <button class="strip-item" data-action="viewProof" data-date="${esc(r.date)}" data-task="photo">
        <img data-proof-src="${esc(r.id)}" alt="">
        <span>Day ${dayNumberOf(r.date)}</span>
      </button>`).join('');
    strip.querySelectorAll('img[data-proof-src]').forEach(img => {
      proofURL(img.getAttribute('data-proof-src')).then(url => { if (url) img.src = url; });
    });
  });
}

/* ───────────────────────── Countdown ───────────────────────── */

function countdownText() {
  const now = new Date();
  const mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.floor((mid - now) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

/* ───────────────────────── Couple codes ───────────────────────── */

function buildDayCode() {
  const today = todayStr();
  const day = ensureDay(today);
  const me = day.me;
  const payload = {
    v: 1,
    n: S.profile.name || '',
    d: today,
    c: TASKS.filter(t => taskDone(day, 'me', t)).map(t => t.id),
    w: me.water,
    p: me.pages,
    m: me.cheat ? (me.cheat.occasion || 'occasion') : null,
  };
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function applyDayCode(text) {
  const trimmed = (text || '').trim();
  const idx = trimmed.indexOf(CODE_PREFIX);
  if (idx === -1) throw new Error('That does not look like a day code.');
  const b64 = trimmed.slice(idx + CODE_PREFIX.length).split(/\s/)[0];
  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    throw new Error('That code could not be read.');
  }
  if (!payload || payload.v !== 1 || !payload.d) throw new Error('That code could not be read.');
  if (diffDays(startDate(), payload.d) < 0 || diffDays(payload.d, todayStr()) < 0) {
    throw new Error('That code is for a day outside this attempt.');
  }
  const day = ensureDay(payload.d);
  const p = day.partner;
  p.checks = {};
  (payload.c || []).forEach(id => { p.checks[id] = true; });
  p.water = Math.max(0, Math.min(999, Number(payload.w) || 0));
  p.pages = Math.max(0, Math.min(999, Number(payload.p) || 0));
  p.cheat = payload.m ? { occasion: String(payload.m).slice(0, 60) } : null;
  if (p.checks.water && p.water < S.settings.waterGoalOz) p.water = S.settings.waterGoalOz;
  if (p.checks.read && p.pages < S.settings.pagesGoal) p.pages = S.settings.pagesGoal;
  save();
  return payload;
}

/* ───────────────────────── Backup ───────────────────────── */

function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'seventyfive', exported: new Date().toISOString(), state: S }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `seventyfive-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  showToast('Backup downloaded.');
}

function importBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    file.text().then(text => {
      const parsed = JSON.parse(text);
      if (!parsed || parsed.app !== 'seventyfive' || !parsed.state) throw new Error('bad');
      S = Object.assign(defaultState(), parsed.state);
      save();
      evaluateAndRender();
      showToast('Backup restored.');
    }).catch(() => showToast('That file is not a valid backup.'));
  });
  document.body.appendChild(input);
  input.click();
}

/* ───────────────────────── Toast ───────────────────────── */

let toastTimer = null;
function showToast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ───────────────────────── Install hint ───────────────────────── */

function shouldShowInstallHint() {
  if (S.settings.installHintDismissed) return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/* ───────────────────────── Actions ───────────────────────── */

function setPages(date, newPages) {
  const day = ensureDay(date);
  const me = day.me;
  const clamped = Math.max(0, Math.min(999, newPages));
  const delta = clamped - me.pages;
  me.pages = clamped;
  const book = currentBook();
  if (book && !book.done) {
    book.pagesRead = Math.max(0, Math.min(book.totalPages, (book.pagesRead || 0) + delta));
  }
}

const ACTIONS = {
  tab(d) { UI.tab = d.tab; renderApp(); },
  dismissInstallHint() { S.settings.installHintDismissed = true; save(); renderApp(); },

  /* onboarding */
  obNext() {
    if (UI.obStep === 1) {
      const v = ($('#obName') || {}).value || '';
      if (!v.trim()) { showToast('Sign your name first.'); return; }
      UI.ob.name = v.trim();
    }
    if (UI.obStep === 2) {
      if (UI.ob.mode === 'couple') {
        const v = ($('#obPartner') || {}).value || '';
        if (!v.trim()) { showToast("Add your partner's name."); return; }
        UI.ob.partnerName = v.trim();
      }
    }
    UI.obStep++;
    renderApp();
  },
  obBack() {
    if (UI.obStep === 2) {
      const p = $('#obPartner'); if (p) UI.ob.partnerName = p.value.trim();
    }
    UI.obStep = Math.max(0, UI.obStep - 1);
    renderApp();
  },
  obMode(d) {
    const p = $('#obPartner'); if (p) UI.ob.partnerName = p.value.trim();
    UI.ob.mode = d.mode; renderApp();
  },
  obRule(d) {
    const p = $('#obPartner'); if (p) UI.ob.partnerName = p.value.trim();
    UI.ob.coupleRule = d.rule; renderApp();
  },
  obStart(d) { UI.ob.startOpt = d.start; renderApp(); },
  obFinish() {
    const ob = UI.ob;
    S.profile.name = ob.name;
    S.profile.mode = ob.mode;
    S.profile.partnerName = ob.mode === 'couple' ? ob.partnerName : '';
    S.profile.coupleRule = ob.coupleRule;
    S.attempt = {
      n: 1,
      startDate: ob.startOpt === 'tomorrow' ? addDays(todayStr(), 1) : todayStr(),
      status: 'active',
    };
    S.onboarded = true;
    save();
    UI.tab = 'today';
    renderApp();
    showToast(ob.startOpt === 'tomorrow' ? 'Day One begins tomorrow.' : 'Day One. It has begun.');
  },

  /* checklist */
  toggle(d) {
    const date = d.date, taskId = d.task;
    const t = TASKS.find(x => x.id === taskId);
    const day = ensureDay(date);
    const me = day.me;
    const done = taskDone(day, 'me', t);

    if (t.type === 'photo') {
      if (me.proofs.photo) { UI.sheet = { type: 'proofViewer', date, task: 'photo', who: 'me' }; renderApp(); }
      else openCapture(date, 'me', 'photo');
      return;
    }
    if (t.type === 'water') {
      me.water = done ? 0 : Math.max(me.water, S.settings.waterGoalOz);
    } else if (t.type === 'read') {
      if (!done) {
        if (S.settings.strictProof && !me.proofs.read) { nudgeProof(date, 'read'); return; }
        setPages(date, Math.max(me.pages, S.settings.pagesGoal));
      } else { showToast('Adjust pages with the counters below.'); return; }
    } else if (t.proof && !done) {
      if (S.settings.strictProof && !me.proofs[taskId]) { nudgeProof(date, taskId); return; }
      me.checks[taskId] = true;
    } else if (t.type === 'diet') {
      if (me.cheat) { UI.sheet = { type: 'cheatDetail', date }; renderApp(); return; }
      me.checks.diet = !me.checks.diet;
    } else {
      me.checks[taskId] = !me.checks[taskId];
    }
    save();
    evaluateAndRender();
    const now = personDone(ensureDay(date), 'me');
    if (now && !done) celebrateDay(date);
  },

  water(d) {
    const day = ensureDay(d.date);
    const before = taskDone(day, 'me', TASKS.find(t => t.type === 'water'));
    day.me.water = Math.max(0, Math.min(999, day.me.water + Number(d.oz)));
    save();
    evaluateAndRender();
    if (!before && day.me.water >= S.settings.waterGoalOz) showToast('A full gallon. Well done.');
    if (personDone(day, 'me') && !before) celebrateDay(d.date);
  },

  pages(d) {
    const day = ensureDay(d.date);
    setPages(d.date, day.me.pages + Number(d.n));
    save();
    evaluateAndRender();
    const book = currentBook();
    if (book && !book.done && book.pagesRead >= book.totalPages) {
      showToast(`You reached the last page of “${book.title}”.`);
    }
  },

  capture(d) { openCapture(d.date, 'me', d.task); },
  viewProof(d) { UI.sheet = { type: 'proofViewer', date: d.date, task: d.task, who: 'me' }; renderApp(); },
  retakeProof(d) { UI.sheet = null; renderApp(); openCapture(d.date, 'me', d.task); },
  deleteProofBtn(d) {
    UI.sheet = null;
    deleteProof(d.date, 'me', d.task);
    showToast('Proof removed.');
  },

  /* cheat passes */
  sheet(d) {
    UI.sheet = { type: d.sheet, date: d.date };
    renderApp();
  },
  closeSheet() { UI.sheet = null; renderApp(); },
  useCheat(d) {
    if (cheatRemaining('me') <= 0) { showToast('No passes left.'); return; }
    const occasion = (($('#cheatOccasion') || {}).value || '').trim();
    const day = ensureDay(d.date);
    day.me.cheat = { occasion };
    day.me.checks.diet = true;
    S.cheat.used.push({ date: d.date, occasion, who: 'me' });
    UI.sheet = null;
    save();
    evaluateAndRender();
    showToast(`Pass used. ${cheatRemaining('me')} remain. Enjoy it properly.`);
  },
  removeCheat(d) {
    const day = ensureDay(d.date);
    day.me.cheat = null;
    day.me.checks.diet = false;
    const i = S.cheat.used.findIndex(u => u.date === d.date && u.who === 'me');
    if (i >= 0) S.cheat.used.splice(i, 1);
    UI.sheet = null;
    save();
    evaluateAndRender();
    showToast('Pass returned.');
  },

  /* books */
  addBook() {
    const title = (($('#bookTitle') || {}).value || '').trim();
    const pages = parseInt(($('#bookPages') || {}).value, 10);
    if (!title) { showToast('Give the book a title.'); return; }
    if (!pages || pages < 1) { showToast('How many pages does it have?'); return; }
    const book = {
      id: uid(),
      title,
      author: (($('#bookAuthor') || {}).value || '').trim(),
      totalPages: Math.min(9999, pages),
      pagesRead: 0,
      done: false,
      started: todayStr(),
    };
    S.books.push(book);
    S.currentBookId = book.id;
    UI.sheet = null;
    save();
    renderApp();
    showToast(`“${book.title}” is on the nightstand.`);
  },
  finishBook(d) {
    const book = S.books.find(b => b.id === d.id);
    if (!book) return;
    book.done = true;
    book.finished = todayStr();
    if (S.currentBookId === book.id) S.currentBookId = null;
    save();
    renderApp();
    showToast('Finished. Pick the next one.');
  },

  /* couple */
  partnerToggle(d) {
    const day = ensureDay(d.date);
    const p = day.partner;
    const t = TASKS.find(x => x.id === d.task);
    const isDone = taskDone(day, 'partner', t);
    if (t.type === 'water') p.water = isDone ? 0 : S.settings.waterGoalOz;
    else if (t.type === 'read') p.pages = isDone ? 0 : S.settings.pagesGoal;
    else p.checks[t.id] = !isDone;
    save();
    evaluateAndRender();
  },
  setCoupleRule(d) { S.profile.coupleRule = d.rule; save(); evaluateAndRender(); },
  shareDay() {
    const code = buildDayCode();
    const day = ensureDay(todayStr());
    const n = dayNumberOf(todayStr());
    const text = `${S.profile.name || 'I'} — Day ${n} of 75: ${doneCount(todayStr(), 'me')}/${TASKS.length} done${personDone(day, 'me') ? '. Sealed.' : '.'}\n\n${code}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      UI.sheet = { type: 'shareCode', code };
      renderApp();
    }
  },
  copyCode() {
    const el = $('#myCode');
    if (!el) return;
    navigator.clipboard.writeText(el.value)
      .then(() => showToast('Copied.'))
      .catch(() => { el.select(); document.execCommand('copy'); showToast('Copied.'); });
  },
  applyPartnerCode() {
    const text = ($('#partnerCode') || {}).value || '';
    try {
      const payload = applyDayCode(text);
      UI.sheet = null;
      evaluateAndRender();
      showToast(`${payload.n || 'Partner'}'s Day ${dayNumberOf(payload.d)} updated.`);
    } catch (e) {
      showToast(e.message || 'That code could not be read.');
    }
  },

  /* failure / victory */
  restartNow() { doRestart('The chain broke'); renderApp(); },
  fixYesterday(d) { UI.fixing = d.date; UI.tab = 'today'; renderApp(); },
  stopFixing() { UI.fixing = null; renderApp(); },
  shareWin() {
    const text = 'Seventy-five days. Every workout, every page, every drop, every photo. 75 Hard — done.';
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard.writeText(text).then(() => showToast('Copied — paste it anywhere.'));
  },
  newChallenge() {
    S.attempt = { n: S.attempt.n + 1, startDate: todayStr(), status: 'active' };
    S.days = {};
    S.cheat.used = [];
    UI.browsingAfterWin = false;
    save();
    renderApp();
    showToast(`Attempt ${roman(S.attempt.n)}. Day One again — by choice this time.`);
  },
  browseAfterWin() { UI.browsingAfterWin = true; renderApp(); },

  /* settings */
  setMode(d) {
    S.profile.mode = d.mode;
    save();
    evaluateAndRender();
  },
  toggleStrict() { S.settings.strictProof = !S.settings.strictProof; save(); evaluateAndRender(); },
  setWaterGoal(d) { S.settings.waterGoalOz = Number(d.v); save(); evaluateAndRender(); },
  setPagesGoal(d) { S.settings.pagesGoal = Number(d.v); save(); evaluateAndRender(); },
  exportData() { exportBackup(); },
  importData() { importBackup(); },
  confirmRestart() {
    UI.sheet = {
      type: 'confirm',
      title: 'Back to Day One?',
      body: 'The count returns to zero, your passes are restored, and the record keeps this attempt. Books and photos stay.',
      confirmLabel: 'Restart from Day One',
      confirmAction: 'doManualRestart',
      danger: true,
    };
    renderApp();
  },
  doManualRestart() { doRestart('Restarted by choice'); renderApp(); },
  confirmErase() {
    UI.sheet = {
      type: 'confirm',
      title: 'Erase everything?',
      body: 'Every day, every photo, every book — gone from this device. There is no undo.',
      confirmLabel: 'Erase it all',
      confirmAction: 'doErase',
      danger: true,
    };
    renderApp();
  },
  doErase() {
    localStorage.removeItem(STORE_KEY);
    DB.clearProofs().finally(() => location.reload());
  },
};

function nudgeProof(date, taskId) {
  showToast('Proof first — attach the photo, then check it off.');
  const btn = document.querySelector(`.proof-btn[data-date="${date}"][data-task="${taskId}"]`);
  if (btn) { btn.classList.add('pulse'); setTimeout(() => btn.classList.remove('pulse'), 1200); }
}

function celebrateDay(date) {
  if (dayComplete(date)) {
    showToast(`Day ${dayNumberOf(date)} sealed.`);
    if (UI.fixing === date) UI.fixing = null;
  } else if (isCouple() && S.profile.coupleRule === 'together') {
    showToast(`Your side is done — waiting on ${S.profile.partnerName || 'your partner'}.`);
  }
  evaluateAndRender();
}

function evaluateAndRender() {
  checkVictory();
  renderApp();
}

/* ───────────────────────── Events ───────────────────────── */

document.addEventListener('click', e => {
  const stop = e.target.closest('[data-stop]');
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (stop && !stop.contains(el)) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  const f = el.dataset.field;
  if (f === 'name') S.profile.name = el.value.trim().slice(0, 30);
  if (f === 'partnerName') S.profile.partnerName = el.value.trim().slice(0, 30);
  save();
});

/* Day rollover + countdown tick */
setInterval(() => {
  const t = todayStr();
  if (t !== UI.lastToday) {
    UI.lastToday = t;
    UI.fixing = null;
    evaluateAndRender();
  } else {
    const el = $('#countdown');
    if (el) el.textContent = countdownText();
  }
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const t = todayStr();
    if (t !== UI.lastToday) { UI.lastToday = t; UI.fixing = null; }
    evaluateAndRender();
  }
});

/* ───────────────────────── Boot ───────────────────────── */

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

window.__75 = { get state() { return S; }, save, render: renderApp };

evaluateAndRender();
