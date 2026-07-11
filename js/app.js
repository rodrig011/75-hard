/* SEVENTY-FIVE — a 75 Hard companion.
   All data lives on this device: localStorage for state, IndexedDB for proof photos. */
'use strict';

/* ───────────────────────── Tasks ───────────────────────── */

const TASKS = [
  { id: 'workout1', title: 'First Workout', sub: '45 minutes — the first of two, at least 3 hours apart.', proof: true, icon: 'dumbbell' },
  { id: 'workout2', title: 'Second Workout', sub: '45 minutes outdoors — whatever the weather.', proof: true, icon: 'sun' },
  { id: 'water', title: 'One Gallon of Water', sub: '', proof: false, icon: 'drop', type: 'water' },
  { id: 'read', title: 'Read Ten Pages', sub: 'Non-fiction only. Physical pages — audiobooks don’t count.', proof: true, icon: 'book', type: 'read' },
  { id: 'diet', title: 'Hold the Diet', sub: 'Zero alcohol. Zero deviations.', proof: false, icon: 'fork', type: 'diet' },
  { id: 'photo', title: 'Progress Picture', sub: 'Same spot, same light — your future self will thank you.', proof: true, icon: 'camera', type: 'photo' },
];

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const ACTIVITIES = [
  ['sedentary', 'Mostly seated', 1.2],
  ['light', 'Lightly active', 1.375],
  ['moderate', 'Active most days', 1.55],
  ['very', 'Hard training daily', 1.725],
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
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8L21 21"/>',
  barcode: '<path d="M4 7v10M8 7v10M11 7v6M11 16v1M14 7v10M17.5 7v6M17.5 16v1M20 7v10"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5z"/>',
};

function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ───────────────────────── State ───────────────────────── */

function blankPerson() {
  return { checks: {}, proofs: {}, water: 0, pages: 0, cheat: null, food: [], workouts: {}, note: '' };
}

function defaultState() {
  return {
    v: 1,
    onboarded: false,
    profile: { name: '', mode: 'solo', partnerName: '', coupleRule: 'together', dietName: '', why: '' },
    attempt: { n: 1, startDate: todayStr(), status: 'active' },
    history: [],
    days: {},
    books: [],
    currentBookId: null,
    cheat: { allowance: 10, used: [] },
    myFoods: [],
    foodRecents: [],
    fridge: '',
    reflections: [],
    milestonesSeen: [],
    lastBackup: null,
    customTasks: [],
    lifeLog: {},
    settings: {
      strictProof: true, waterGoalOz: 128, pagesGoal: 10, installHintDismissed: false,
      nutrition: null, challengeMode: 'hard', theme: 'system',
      reminders: { on: false, am: '08:00', pm: '18:30' },
      bannedWords: '', sound: true, accent: 'volt',
    },
  };
}

let S = loadState();

function loadState() {
  const def = defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw);
    const s = Object.assign({}, def, p);
    s.profile = Object.assign({}, def.profile, p.profile);
    s.attempt = Object.assign({}, def.attempt, p.attempt);
    s.cheat = Object.assign({}, def.cheat, p.cheat);
    s.settings = Object.assign({}, def.settings, p.settings);
    return s;
  } catch {
    return def;
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
  ob: { name: '', mode: 'solo', partnerName: '', coupleRule: 'together', startOpt: 'today', dietName: '', challengeMode: 'hard', why: '' },
  lastToday: todayStr(),
  galleryFor: null,
  foodMeal: 0,
  foodQuery: '',
  foodCustomOpen: false,
  nutriDraft: null,
};

/* Current rows shown in the food-search results list (local + web). */
let FOOD_RESULTS = [];
let CHEF_RESULTS = [];
let offAbort = null;

const proofURLs = new Map();
let pendingCapture = null;

/* ───────────────────────── Derived helpers ───────────────────────── */

const isCouple = () => S.profile.mode === 'couple';
const startDate = () => S.attempt.startDate;
const dayNumberOf = date => diffDays(startDate(), date) + 1;
const currentDayN = () => dayNumberOf(todayStr());

function normalizePerson(p) {
  if (!p.food) p.food = [];
  if (!p.workouts) p.workouts = {};
  if (p.note == null) p.note = '';
  return p;
}

function ensureDay(date) {
  if (!S.days[date]) S.days[date] = { me: blankPerson() };
  if (isCouple() && !S.days[date].partner) S.days[date].partner = blankPerson();
  if (!S.days[date].me) S.days[date].me = blankPerson();
  normalizePerson(S.days[date].me);
  if (S.days[date].partner) normalizePerson(S.days[date].partner);
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

function activeTasksFor(date) {
  const customs = (S.customTasks || []).filter(c => !date || c.since <= date);
  if (!customs.length) return TASKS;
  return TASKS.concat(customs.map(c => ({
    id: c.id, title: c.title, sub: 'Your own rule. It counts like the rest.',
    proof: false, icon: 'target', custom: true, since: c.since,
  })));
}
const activeTasks = () => activeTasksFor(todayStr());

function taskDone(date, who, task) {
  const day = getDay(date);
  const p = day[who];
  if (!p) return false;
  if (task.custom) return !!p.checks[task.id];
  switch (task.type) {
    case 'water': return p.water >= S.settings.waterGoalOz;
    case 'read': return p.pages >= S.settings.pagesGoal && proofOk(p, who, 'read');
    case 'photo': return who === 'me' ? !!p.proofs.photo : !!p.checks.photo;
    case 'diet': return !!p.checks.diet;
    default: return !!p.checks[task.id] && proofOk(p, who, task.id);
  }
}

function personDone(date, who) {
  return activeTasksFor(date).every(t => taskDone(date, who, t));
}

function dayComplete(date) {
  if (!personDone(date, 'me')) return false;
  if (isCouple() && S.profile.coupleRule === 'together') return personDone(date, 'partner');
  return true;
}

function missedTasks(date, who) {
  return activeTasksFor(date).filter(t => !taskDone(date, who, t));
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

/* Nutrition — Mifflin–St Jeor estimate */
function entryKcal(f) {
  return Math.round((Number(f.kcal) || 0) * (Number(f.qty) || 1));
}
function kcalEaten(p) {
  return (p.food || []).reduce((a, f) => a + entryKcal(f), 0);
}
function macrosEaten(person) {
  return (person.food || []).reduce((m, f) => {
    const q = Number(f.qty) || 1;
    m.p += (Number(f.p) || 0) * q;
    m.c += (Number(f.c) || 0) * q;
    m.f += (Number(f.f) || 0) * q;
    return m;
  }, { p: 0, c: 0, f: 0 });
}
function kcalTarget() {
  const n = S.settings.nutrition;
  return n && n.targetKcal ? n.targetKcal : null;
}
function computeTargetKcal(n) {
  const bmr = 10 * n.kg + 6.25 * n.cm - 5 * n.age + (n.sex === 'male' ? 5 : -161);
  const act = ACTIVITIES.find(a => a[0] === n.activity);
  const adj = { lose: -500, maintain: 0, gain: 300 }[n.goal] || 0;
  return Math.max(1200, Math.round((bmr * (act ? act[2] : 1.375) + adj) / 10) * 10);
}

/* ── Diet compliance ── */

const DIET_RULES = {
  always: ['beer', 'wine', 'vodka', 'whiskey', 'tequila', 'cocktail', 'margarita', 'alcohol'],
  keto: ['sugar', 'bread', 'bagel', 'rice', 'pasta', 'noodle', 'tortilla', 'donut', 'cake', 'cookie', 'brownie', 'soda', 'juice', 'candy', 'cereal', 'oatmeal', 'granola', 'banana', 'potato', 'fries', 'beans', 'pancake', 'waffle', 'muffin', 'churro', 'ice cream', 'honey', 'syrup', 'horchata'],
  paleo: ['bread', 'bagel', 'pasta', 'noodle', 'cheese', 'milk', 'yogurt', 'beans', 'lentil', 'rice', 'soda', 'candy', 'donut', 'cereal', 'sugar', 'ice cream', 'peanut'],
  vegan: ['chicken', 'beef', 'steak', 'pork', 'bacon', 'ham', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'egg', 'milk', 'cheese', 'yogurt', 'butter', 'honey'],
  vegetarian: ['chicken', 'beef', 'steak', 'pork', 'bacon', 'ham', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'jerky', 'carnitas', 'asada'],
};

const FOOD_SWAPS = [
  ['soda', 'Sparkling water or a zero-sugar soda scratches the same itch.'],
  ['juice', 'Whole fruit gives you the fiber the juice threw away.'],
  ['fries', 'Roasted potatoes or a baked sweet potato get close.'],
  ['chips', 'Air-popped popcorn — a tenth of the fat.'],
  ['candy', 'A couple of dates or a square of dark chocolate.'],
  ['ice cream', 'Frozen Greek yogurt with berries.'],
  ['donut', 'A protein muffin keeps the morning on track.'],
  ['cake', 'Greek yogurt with honey and walnuts.'],
  ['cookie', 'A protein bar handles the sweet tooth.'],
  ['pizza', 'A cauliflower-crust slice halves the carbs.'],
  ['bread', 'Lettuce wraps or keto bread hold everything a slice does.'],
  ['pasta', 'Zucchini noodles carry the same sauce.'],
  ['rice', 'Cauliflower rice — a tenth of the carbs.'],
  ['beer', 'A kombucha or sparkling water with lime. The rules say zero anyway.'],
  ['wine', 'Alcohol resets the challenge. Sparkling water in a nice glass.'],
];

function dietProfile() {
  const d = (S.profile.dietName || '').toLowerCase();
  if (d.includes('keto') || d.includes('low carb')) return 'keto';
  if (d.includes('paleo') || d.includes('whole30')) return 'paleo';
  if (d.includes('vegan')) return 'vegan';
  if (d.includes('vegetarian')) return 'vegetarian';
  return null;
}

function checkDietCompliance(food) {
  const name = (food.name || '').toLowerCase();
  const hit = list => list.find(w => name.includes(w));
  const custom = (S.settings.bannedWords || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);

  let word = hit(DIET_RULES.always);
  if (word) return { flag: true, reason: `Alcohol is a hard rule — zero for all seventy-five days.`, word };
  word = hit(custom);
  if (word) return { flag: true, reason: `“${word}” is on your banned list.`, word };
  const prof = dietProfile();
  if (prof) {
    word = hit(DIET_RULES[prof]);
    if (word) return { flag: true, reason: `“${word}” usually breaks a ${S.profile.dietName} plan.`, word };
    if (prof === 'keto' && (Number(food.c) || 0) > 15) {
      return { flag: true, reason: `${Math.round(food.c)}g of carbs in one serving is a lot for ${S.profile.dietName}.`, word: null };
    }
  }
  return { flag: false };
}

function foodSwapFor(word) {
  if (!word) return null;
  const row = FOOD_SWAPS.find(([k]) => word.includes(k) || k.includes(word));
  return row ? row[1] : null;
}

/* ── Streak / milestones ── */

function currentChain() {
  const today = todayStr();
  let n = dayComplete(today) ? 1 : 0;
  let d = addDays(today, -1);
  while (dayNumberOf(d) >= 1 && dayComplete(d)) { n++; d = addDays(d, -1); }
  return n;
}

const MILESTONES = [
  [7, 'One week.', 'Seven days without a single excuse. The chain has begun.'],
  [30, 'Thirty.', 'A month of kept promises. Most people quit by day five.'],
  [50, 'Fifty.', 'Two thirds through. The person in the Day 1 photo would not recognize you.'],
];

/* ── Lifetime record / discipline score ── */

const LEVELS = [
  [0, 'Beginner'], [100, 'Committed'], [300, 'Disciplined'],
  [700, 'Relentless'], [1250, 'Unbreakable'], [2000, 'Legend'],
];

function recordLifeLog() {
  if (!S.onboarded) return;
  const today = todayStr();
  const start = startDate();
  const last = Math.min(diffDays(start, today), 74);
  for (let i = 0; i <= last; i++) {
    const date = addDays(start, i);
    if (diffDays(date, today) < 0) break;
    const f = dayComplete(date) ? 1 : doneCount(date, 'me') / activeTasksFor(date).length;
    if (!S.lifeLog) S.lifeLog = {};
    if ((S.lifeLog[date] || 0) < f) S.lifeLog[date] = Math.round(f * 100) / 100;
  }
}

function lifetimeStats() {
  const log = S.lifeLog || {};
  const sealed = Object.values(log).filter(v => v >= 1).length;
  const completions = S.history.filter(h => /Completed/.test(h.note || '')).length;
  const score = sealed * 10 + completions * 500 + currentChain() * 5;
  let level = LEVELS[0][1], next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (score >= LEVELS[i][0]) level = LEVELS[i][1];
    else { next = LEVELS[i]; break; }
  }
  return { sealed, completions, score, level, next };
}

const ACCENTS = [
  ['volt', 'Volt', 0],
  ['ember', 'Ember', 7],
  ['ocean', 'Ocean', 30],
  ['royal', 'Royal', 50],
  ['legend', 'Legend', 75],
];

/* ── Time of day ── */

function daypart() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

function applyDaypart() {
  document.documentElement.dataset.daypart = daypart();
}

function heroPhrase(allDone, dayN) {
  if (allDone) return dayN >= 75 ? 'The last page is written.' : `Day ${dayN} is in the archive. Rest.`;
  switch (daypart()) {
    case 'morning': return 'The day is unwritten. Start with the hard thing.';
    case 'day': return 'Midday. Stay on schedule — the evening should be easy.';
    case 'evening': return 'Evenings decide challenges. Finish clean.';
    default: return 'Almost midnight. Seal it, then sleep.';
  }
}

/* ── Theme ── */

function applyTheme() {
  const t = S.settings.theme || 'dark';
  if (t === 'light' || t === 'hardcore') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const a = S.settings.accent || 'volt';
  if (a === 'volt') delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = a;
  if (typeof FX !== 'undefined') FX.setEnabled(S.settings.sound !== false);
}

function doneCount(date, who) {
  return activeTasksFor(date).filter(t => taskDone(date, who, t)).length;
}

/* ───────────────────────── Failure / victory engine ───────────────────────── */

const isFlex = () => S.settings.challengeMode === 'flex';

function computeFail() {
  if (!S.onboarded || S.attempt.status !== 'active' || isFlex()) return null;
  const today = todayStr();
  const start = startDate();
  if (diffDays(start, today) <= 0) return null;
  const lastCheck = Math.min(diffDays(start, today) - 1, 74);
  for (let i = 0; i <= lastCheck; i++) {
    const date = addDays(start, i);
    if (!dayComplete(date)) {
      const whoMissed = [];
      if (!personDone(date, 'me')) whoMissed.push('me');
      if (isCouple() && S.profile.coupleRule === 'together' && !personDone(date, 'partner')) whoMissed.push('partner');
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
  const dayN = diffDays(startDate(), today) + 1;
  if (dayN < 75) return;
  if (isFlex()) {
    if (dayN === 75 && !dayComplete(today)) return;
    const sealed = countSealedDays();
    S.attempt.status = 'complete';
    S.history.push({
      n: S.attempt.n, start: startDate(), end: addDays(startDate(), 74),
      days: sealed, note: `Completed — ${sealed} of 75 sealed`,
    });
    save();
    return;
  }
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
      const wasDone = personDone(ctx.date, 'me');
      day[ctx.who].proofs[ctx.taskId] = id;
      save();
      evaluateAndRender();
      showToast(ctx.taskId === 'photo' ? 'Progress photo saved.' : 'Proof attached.');
      if (ctx.who === 'me' && !wasDone && personDone(ctx.date, 'me')) celebrateDay(ctx.date);
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
    if (!UI.winFxDone) {
      UI.winFxDone = true;
      setTimeout(() => FX.confetti(['#e9d5a6', '#d5b87f', getComputedStyle(document.documentElement).getPropertyValue('--green').trim()]), 600);
      setTimeout(() => FX.confetti(['#e9d5a6', '#ffffff']), 1400);
    }
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
  if (UI.sheet && UI.sheet.type === 'food') updateFoodResults();
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
      <p class="ob-fine">House rule, if you want it: a few cheat-meal passes for life's true occasions. Or run it official — zero. Everything else is non-negotiable.</p>
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

  const target = kcalTarget();
  steps.push(`
    <div class="ob-step">
      <div class="kicker">Step three</div>
      <h2 class="serif ob-h2">Fuel</h2>
      <p class="ob-lede">Rule one: a structured diet geared toward your goals, held for seventy-five days. Name it — then let the app size your plate.</p>
      <input class="input big" id="obDiet" type="text" placeholder="Your diet — Keto, Paleo, your own" autocomplete="off" value="${esc(ob.dietName)}" maxlength="30">
      ${target ? `
        <div class="commit-card slim">
          <div class="kicker">Daily target</div>
          <div class="commit-sig serif">${target.toLocaleString()} kcal</div>
        </div>` : ''}
      <button class="btn ghost" data-action="openNutrition">${target ? 'Recalculate my calories' : 'Calculate my daily calories'}</button>
      <div class="ob-actions">
        <button class="btn ghost" data-action="obBack">Back</button>
        <button class="btn primary" data-action="obNext">Continue</button>
      </div>
    </div>`);

  steps.push(`
    <div class="ob-step">
      <div class="kicker">Step four</div>
      <h2 class="serif ob-h2">Day One</h2>
      <div class="seg">
        <button class="seg-opt ${ob.startOpt === 'today' ? 'on' : ''}" data-action="obStart" data-start="today">Today</button>
        <button class="seg-opt ${ob.startOpt === 'tomorrow' ? 'on' : ''}" data-action="obStart" data-start="tomorrow">Tomorrow</button>
      </div>
      <div class="rule-pick">
        <button class="rule-opt ${ob.challengeMode !== 'flex' ? 'on' : ''}" data-action="obChallengeMode" data-v="hard">
          <strong>75 Hard — the real thing</strong>
          <span>Miss a single task and you go back to Day One. No mercy.</span>
        </button>
        <button class="rule-opt ${ob.challengeMode === 'flex' ? 'on' : ''}" data-action="obChallengeMode" data-v="flex">
          <strong>Flexible — keep the streak human</strong>
          <span>A missed day is recorded, not punished. The 75 days keep counting.</span>
        </button>
      </div>
      <textarea class="input" id="obWhy" rows="2" placeholder="Why are you doing this? One honest sentence — you'll see it every day." maxlength="140">${esc(ob.why || '')}</textarea>
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
      ${UI.sheet ? renderSheet() : ''}
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
      <main class="content ${UI.enterAnim ? 'enter' : ''}">${body}</main>
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
  const dayTasks = activeTasksFor(editDate);
  const done = doneCount(editDate, 'me');
  const allDone = personDone(editDate, 'me');
  const partnerDone = isCouple() ? personDone(editDate, 'partner') : true;
  const sealed = dayComplete(editDate);
  const pct = done / dayTasks.length;
  const R = 54, C = 2 * Math.PI * R;

  const installHint = shouldShowInstallHint() ? `
    <div class="card hint-card">
      <div>
        <strong>Put it on your Home Screen</strong>
        <p class="muted small">In Safari, tap ${icon('share', 'inline')} then “Add to Home Screen”. It becomes a real app — full screen, works offline.</p>
      </div>
      <button class="iconbtn" data-action="dismissInstallHint" aria-label="Dismiss">${icon('close')}</button>
    </div>` : '';

  const yesterday = addDays(today, -1);
  const flexSlip = !isFixing && isFlex() && dayNumberOf(yesterday) >= 1 && !dayComplete(yesterday);

  return `
    ${isFixing ? `
      <div class="fixing-banner">
        <strong>Completing yesterday's log</strong> — be honest with yourself.
        <button class="btn small ghost" data-action="stopFixing">Back to today</button>
      </div>` : ''}
    ${flexSlip ? `
      <div class="fixing-banner">
        <span><strong>Yesterday slipped.</strong> It's recorded — today is what counts.</span>
        <button class="btn small ghost" data-action="fixYesterday" data-date="${yesterday}">Fix the log</button>
      </div>` : ''}
    <section class="hero ${sealed ? 'is-sealed' : ''}" style="--p:${pct.toFixed(3)};--chain:${Math.min(currentChain(), 30)}">
      <div class="kicker">${prettyDate(editDate)} · Attempt ${roman(S.attempt.n)}</div>
      <div class="hero-mid">
        <div class="hero-left">
          <h1 class="serif hero-num">Day ${dayN}</h1>
          <div class="muted hero-status">${sealed ? 'Sealed.' :
            allDone && isCouple() && S.profile.coupleRule === 'together'
              ? `Your side is done.<br>Waiting on ${esc(S.profile.partnerName || 'your partner')}.`
              : `${done} of ${dayTasks.length} complete<br><span id="countdown">${countdownText()}</span>`}</div>
          ${currentChain() >= 2 ? `<div class="chain-line">${icon('seal')} ${currentChain()}-day chain</div>` : ''}
        </div>
        <div class="ring-wrap hero-ring" aria-hidden="true">
          <svg class="ring" viewBox="0 0 120 120">
            <circle class="ring-track" cx="60" cy="60" r="${R}"/>
            <circle class="ring-fill" cx="60" cy="60" r="${R}"
              stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
          </svg>
          <div class="ring-label"><span class="serif">${done}/${dayTasks.length}</span><small>today</small></div>
        </div>
      </div>
      <div class="hero-foot">
        <p class="hero-phrase">${heroPhrase(sealed, dayN)}</p>
        ${S.profile.why ? `<p class="hero-why">“${esc(S.profile.why)}”</p>` : ''}
      </div>
    </section>
    ${installHint}
    <ul class="tasklist">
      ${dayTasks.map(t => renderTaskRow(editDate, me, t)).join('')}
    </ul>
    <div class="card journal-card">
      <div class="card-head"><strong>Tonight's page</strong><span class="muted small">the archive remembers</span></div>
      <textarea class="input" data-journal="${editDate}" rows="3" placeholder="How did the day actually go?">${esc(me.note || '')}</textarea>
      <div class="mood-row">
        ${[['1', 'Rough'], ['2', 'Low'], ['3', 'Steady'], ['4', 'Good'], ['5', 'Strong']].map(([v, l]) => `
          <button class="mood-dot ${String(me.mood) === v ? 'on' : ''}" data-action="setMood" data-date="${editDate}" data-v="${v}" aria-label="${l}">
            <i style="opacity:${0.25 + Number(v) * 0.15}"></i><span>${l}</span>
          </button>`).join('')}
      </div>
      <div class="weight-row">
        <label class="muted small" for="dayWeight">Weight today (optional)</label>
        <input class="input slim" id="dayWeight" type="number" inputmode="decimal" placeholder="—"
          data-weight="${editDate}" value="${me.weight || ''}" min="50" max="700"> <span class="muted small">lb</span>
      </div>
    </div>`;
}

function renderTaskRow(date, me, t) {
  const isDone = taskDone(date, 'me', t);
  const pid = me.proofs[t.id];

  let extra = '';
  let side = '';

  if (t.id === 'workout1' || t.id === 'workout2') {
    const w = me.workouts[t.id];
    extra = `
      <button class="book-chip ${w && w.kind ? 'logged' : 'empty'}" data-action="workoutSheet" data-date="${date}" data-task="${t.id}">
        ${icon('dumbbell')} <span>${w && w.kind ? `${esc(w.kind)} · ${w.mins || 45} min${w.note ? ` — ${esc(w.note)}` : ''}` : 'Log what you did'}</span>
      </button>`;
  }

  if (t.type === 'water') {
    const goal = S.settings.waterGoalOz;
    const oz = me.water;
    const p = Math.min(1, oz / goal);
    extra = `
      <div class="water-wrap">
        <div class="bar"><div class="bar-fill water" style="width:${(p * 100).toFixed(1)}%"></div></div>
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
    const target = kcalTarget();
    const eaten = kcalEaten(me);
    let cheatBit = '';
    if (me.cheat) {
      cheatBit = `
        <button class="cheat-badge" data-action="sheet" data-sheet="cheatDetail" data-date="${date}">
          Cheat pass used — ${esc(me.cheat.occasion || 'special occasion')}
        </button>`;
    } else if (!isDone && cheatRemaining('me') > 0) {
      cheatBit = `
        <button class="cheat-link" data-action="sheet" data-sheet="cheat" data-date="${date}">
          A true occasion? Use one of your ${cheatRemaining('me')} passes
        </button>`;
    }
    const mm = macrosEaten(me);
    extra = `
      <div class="food-wrap">
        ${target ? `
          <div class="bar"><div class="bar-fill ${eaten > target ? 'over' : ''}" style="width:${Math.min(100, (eaten / target) * 100).toFixed(1)}%"></div></div>
          <div class="water-row">
            <span class="water-count">${eaten.toLocaleString()} <small>/ ${target.toLocaleString()} kcal</small></span>
            <span class="chips">
              <button class="chip" data-action="openChef" data-date="${date}">Chef</button>
              <button class="chip" data-action="sheet" data-sheet="food" data-date="${date}">Log food</button>
            </span>
          </div>
          ${(mm.p || mm.c || mm.f) ? `<div class="macro-row"><span>P <b>${Math.round(mm.p)}g</b></span><span>C <b>${Math.round(mm.c)}g</b></span><span>F <b>${Math.round(mm.f)}g</b></span></div>` : ''}` : `
          <div class="water-row">
            <button class="book-chip empty" data-action="openNutrition">${icon('plus')} <span>Set your daily calories</span></button>
            <button class="chip" data-action="sheet" data-sheet="food" data-date="${date}">Log food</button>
          </div>`}
        ${cheatBit}
      </div>`;
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

  let subline = t.sub;
  if (t.type === 'water') {
    subline = `${S.settings.waterGoalOz} oz across the day — about ${(S.settings.waterGoalOz * 0.0296).toFixed(1)} litres.`;
  } else if (t.type === 'diet') {
    subline = S.profile.dietName
      ? `Your ${esc(S.profile.dietName)} plan — zero alcohol, zero deviations.`
      : 'Your structured diet — zero alcohol, zero deviations.';
  }

  const tint = t.custom ? 'custom'
    : (t.id === 'workout1' || t.id === 'workout2') ? 'workout'
    : (t.type || 'workout');
  return `
    <li class="card task tint-${tint} ${isDone ? 'done' : ''}">
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
  let missedCount = 0;
  for (let i = 1; i <= 75; i++) {
    const date = addDays(startDate(), i - 1);
    let cls = 'future';
    let style = '';
    if (i < curN) {
      if (dayComplete(date)) cls = 'done';
      else {
        cls = 'missed';
        missedCount++;
        const f = doneCount(date, 'me') / activeTasksFor(date).length;
        if (f > 0) style = ` style="background:color-mix(in srgb, var(--green) ${Math.round(f * 55)}%, var(--red-dim))"`;
      }
    } else if (i === curN) {
      cls = dayComplete(date) ? 'done today' : 'today';
    }
    cells += `<div class="cell ${cls}"${style} title="Day ${i}">${i === curN ? i : ''}</div>`;
  }

  const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);
  const sealedDays = countSealedDays();

  const life = lifetimeStats();

  return `
    <header class="appheader">
      <div class="kicker">The record · ${esc(life.level)}</div>
      <h1 class="serif page-title">Journey</h1>
      <p class="muted">${life.score.toLocaleString()} discipline${life.next ? ` — ${(life.next[0] - life.score).toLocaleString()} to ${life.next[1]}` : ' — the top of the mountain'}</p>
    </header>
    <div class="card">
      <div class="grid75">${cells}</div>
      <div class="grid-legend">
        <span><i class="dot done"></i>Sealed</span>
        <span><i class="dot today"></i>Today</span>
        ${missedCount ? `<span><i class="dot missed"></i>Missed</span>` : ''}
        <span><i class="dot"></i>Ahead</span>
      </div>
    </div>
    <div class="card" id="transformBox" hidden></div>
    <div class="card">
      <div class="card-head">
        <strong>Progress pictures</strong>
        <span class="muted small">Day by day</span>
      </div>
      <div class="strip" id="photoStrip"><span class="muted small strip-empty">Your daily pictures will line up here.</span></div>
    </div>
    ${renderNutriInsights()}
    ${renderCoach()}
    <div class="duo">
      <button class="btn primary" data-action="sheet" data-sheet="legacy">Open the archive</button>
      <button class="btn ghost" data-action="shareCardBtn">${icon('share')} Share my card</button>
    </div>
    ${renderTrophyRoom()}`;
}

function renderNutriInsights() {
  const today = todayStr();
  const target = kcalTarget();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    if (dayNumberOf(date) < 1) continue;
    const me = getDay(date).me || blankPerson();
    days.push({ date, kcal: kcalEaten(me), items: (me.food || []).length });
  }
  const logged = days.filter(d => d.items > 0);
  if (!logged.length) return '';
  const max = Math.max(target || 0, ...days.map(d => d.kcal), 1);
  const avg = Math.round(logged.reduce((a, d) => a + d.kcal, 0) / logged.length);
  const onTarget = target ? logged.filter(d => d.kcal <= target).length : 0;
  return `
    <div class="card">
      <div class="card-head"><strong>Fuel — last 7 days</strong>
        <span class="muted small">${target ? `${onTarget} of ${logged.length} on target` : `avg ${avg.toLocaleString()} kcal`}</span>
      </div>
      <div class="nutri-bars">
        ${days.map(d => `
          <button class="nutri-col" data-action="sheet" data-sheet="food" data-date="${d.date}" aria-label="${prettyDate(d.date)}">
            <span class="nutri-val">${d.kcal ? (d.kcal >= 1000 ? (d.kcal / 1000).toFixed(1) + 'k' : d.kcal) : ''}</span>
            <span class="nutri-bar ${target && d.kcal > target ? 'over' : ''}" style="height:${Math.max(4, Math.round((d.kcal / max) * 72))}px"></span>
            <span class="nutri-day">${parseDate(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
          </button>`).join('')}
        ${target && target < max * 0.95 ? `<div class="nutri-target" style="bottom:${Math.round((target / max) * 72) + 20}px"></div>` : ''}
      </div>
      ${target ? `<p class="muted small">Average ${avg.toLocaleString()} kcal against a ${target.toLocaleString()} target. Tap a day to see its plate.</p>`
        : `<p class="muted small">Tap a day to see its plate. Set a calorie target in More for the full picture.</p>`}
    </div>`;
}

/* Rule-based coach — pattern insights over the current attempt. */
function renderCoach() {
  const today = todayStr();
  const dayN = Math.min(currentDayN(), 75);
  if (dayN < 5) return '';
  const insights = [];

  const missCounts = {};
  let pastDays = 0;
  for (let i = 1; i < dayN; i++) {
    const date = addDays(startDate(), i - 1);
    pastDays++;
    missedTasks(date, 'me').forEach(t => { missCounts[t.title] = (missCounts[t.title] || 0) + 1; });
  }
  const worst = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] >= 2) {
    insights.push(`“${worst[0]}” is the task that slips most (${worst[1]} times). Schedule it before noon and it stops slipping.`);
  }

  const weekday = {};
  for (let i = 1; i < dayN; i++) {
    const date = addDays(startDate(), i - 1);
    const d = parseDate(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!weekday[d]) weekday[d] = [0, 0];
    weekday[d][1]++;
    if (dayComplete(date)) weekday[d][0]++;
  }
  const days = Object.entries(weekday).filter(([, v]) => v[1] >= 2);
  if (days.length >= 3) {
    const hard = days.sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0];
    if (hard && hard[1][0] < hard[1][1]) {
      insights.push(`${hard[0]}s are your weak spot — ${hard[1][0]} of ${hard[1][1]} sealed. Plan those the night before.`);
    }
  }

  const target = kcalTarget();
  if (target) {
    let over = 0, logged = 0;
    for (let i = Math.max(1, dayN - 7); i <= dayN; i++) {
      const me = getDay(addDays(startDate(), i - 1)).me;
      if (me && (me.food || []).length) { logged++; if (kcalEaten(me) > target) over++; }
    }
    if (logged >= 3 && over >= 2) insights.push(`You went over your ${target.toLocaleString()} kcal target ${over} of the last ${logged} logged days — dinner is usually where it happens.`);
    else if (logged >= 3 && over === 0) insights.push(`Every logged day this week landed under your calorie target. That's how the photo changes.`);
  }

  const weights = [];
  for (let i = 1; i <= dayN; i++) {
    const me = getDay(addDays(startDate(), i - 1)).me;
    if (me && me.weight) weights.push(me.weight);
  }
  if (weights.length >= 4) {
    const delta = Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10;
    if (Math.abs(delta) >= 1) insights.push(`${Math.abs(delta)} lb ${delta < 0 ? 'down' : 'up'} since Day 1. The proof is on the scale too.`);
  }

  if (!insights.length && pastDays >= 5 && currentChain() >= 5) {
    insights.push(`${currentChain()} clean days in a row and no weak pattern to report. Boring is what winning looks like.`);
  }
  if (!insights.length) return '';
  return `
    <div class="card">
      <div class="card-head"><strong>Coach</strong><span class="muted small">patterns in your data</span></div>
      <ul class="coach-list">${insights.slice(0, 3).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>`;
}

/* GitHub-style heatmap of the last 26 weeks, across all attempts. */
function renderYearHeatmap() {
  const log = S.lifeLog || {};
  if (!Object.keys(log).length) return '';
  const today = todayStr();
  const cols = [];
  const todayD = parseDate(today);
  const end = new Date(todayD);
  end.setDate(end.getDate() + (6 - end.getDay()));
  for (let w = 25; w >= 0; w--) {
    let col = '';
    for (let d = 0; d < 7; d++) {
      const dt = new Date(end);
      dt.setDate(dt.getDate() - w * 7 - (6 - d));
      const key = fmtDate(dt);
      const v = dt > todayD ? -1 : (log[key] || 0);
      const cls = v < 0 ? 'hx' : v >= 1 ? 'h3' : v >= 0.5 ? 'h2' : v > 0 ? 'h1' : 'h0';
      col += `<i class="${cls}"></i>`;
    }
    cols.push(`<div class="hm-col">${col}</div>`);
  }
  return `
    <div class="card">
      <div class="card-head"><strong>Six months of showing up</strong><span class="muted small">every attempt counts</span></div>
      <div class="hm-grid">${cols.join('')}</div>
      <div class="grid-legend" style="margin-top:10px">
        <span><i class="dot" style="background:var(--surface-2)"></i>Nothing</span>
        <span><i class="dot" style="background:color-mix(in srgb, var(--green) 35%, transparent)"></i>Partial</span>
        <span><i class="dot done"></i>Sealed</span>
      </div>
    </div>`;
}

function renderTrophyRoom() {
  const life = lifetimeStats();
  const finishedBooks = S.books.filter(b => b.done).length;
  const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);
  const trophies = [
    ['First Seal', 'The first day you finished everything.', life.sealed >= 1],
    ['One Week', 'Seven sealed days. The chain exists.', life.sealed >= 7],
    ['Iron Month', 'Thirty days of kept promises.', life.sealed >= 30],
    ['Half Century', 'Fifty. Past the point of doubt.', life.sealed >= 50],
    ['The 75', 'A full run, start to finish.', life.completions >= 1],
    ['Chainsmith', 'Fourteen days without a single miss.', currentChain() >= 14],
    ['Bookworm', 'A book finished inside the challenge.', finishedBooks >= 1],
    ['Scholar', 'Five hundred pages while everyone scrolled.', totalPages >= 500],
  ];
  return `
    <div class="card">
      <div class="card-head"><strong>Trophy Room</strong><span class="muted small">${trophies.filter(t => t[2]).length} of ${trophies.length}</span></div>
      <div class="trophies">
        ${trophies.map(([name, story, earned]) => `
          <div class="trophy ${earned ? 'earned' : ''}">
            <div class="trophy-cup">${icon('seal')}</div>
            <strong>${name}</strong>
            <span>${earned ? story : '· · ·'}</span>
          </div>`).join('')}
      </div>
    </div>`;
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
        <div class="bar big"><div class="bar-fill gold" style="width:${Math.min(100, (book.pagesRead / book.totalPages) * 100).toFixed(1)}%"></div></div>
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
  const pAll = personDone(today, 'partner');

  return `
    <header class="appheader">
      <div class="kicker">${S.profile.coupleRule === 'together' ? 'Bound together — one misses, both restart' : 'Side by side'}</div>
      <h1 class="serif page-title">${esc(partner)}</h1>
      <p class="muted">${pAll ? `${esc(partner)} has sealed the day.` : `${pDone} of ${activeTasksFor(today).length} complete today.`}</p>
    </header>
    <div class="card">
      <div class="card-head"><strong>${esc(partner)}'s day</strong><span class="muted small">${prettyDate(today)}</span></div>
      <ul class="plist">
        ${activeTasksFor(today).map(t => {
          const isDone = taskDone(today, 'partner', t);
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
      <div class="field"><label>Your why — shown every day</label>
        <input class="input" type="text" data-field="why" placeholder="One honest sentence" value="${esc(S.profile.why)}" maxlength="140">
      </div>
    </div>

    <div class="card">
      <div class="card-head"><strong>Appearance</strong></div>
      <div class="seg">
        ${[['dark', 'Dark'], ['light', 'Light'], ['hardcore', 'Hardcore']].map(([v, l]) => {
          const cur = S.settings.theme === 'system' ? 'dark' : (S.settings.theme || 'dark');
          return `<button class="seg-opt ${cur === v ? 'on' : ''}" data-action="setTheme" data-v="${v}">${l}</button>`;
        }).join('')}
      </div>
      <p class="muted small" style="margin-top:10px">Dark is the signature look. Hardcore is black and gold — no softness anywhere.</p>
      <div class="row-setting">
        <div><strong>Accent</strong><div class="muted small">New colors unlock as your lifetime sealed days grow.</div></div>
        <div class="accent-row">
          ${ACCENTS.map(([id, label, need]) => {
            const unlocked = lifetimeStats().sealed >= need;
            const cur = S.settings.accent || 'volt';
            return `<button class="accent-dot a-${id} ${cur === id ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-action="setAccent" data-v="${id}" aria-label="${label}">${unlocked ? '' : need}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="row-setting">
        <div><strong>Sound &amp; haptics</strong><div class="muted small">Ticks, fanfares, and the seal coin.</div></div>
        <button class="switch ${S.settings.sound !== false ? 'on' : ''}" data-action="toggleSound" role="switch" aria-checked="${S.settings.sound !== false}"><i></i></button>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><strong>Reminders</strong></div>
      <div class="row-setting">
        <div><strong>Nudge me</strong><div class="muted small">“The second workout is still open.”</div></div>
        <button class="switch ${S.settings.reminders.on ? 'on' : ''}" data-action="toggleReminders" role="switch" aria-checked="${S.settings.reminders.on}"><i></i></button>
      </div>
      ${S.settings.reminders.on ? `
        <div class="duo tight">
          <div class="field"><label>Morning</label><input class="input" type="time" data-rtime="am" value="${esc(S.settings.reminders.am)}"></div>
          <div class="field"><label>Evening</label><input class="input" type="time" data-rtime="pm" value="${esc(S.settings.reminders.pm)}"></div>
        </div>
        <p class="muted small">Reminders fire while the app is open or in a tab — iPhones don't let web apps ring on their own. The evening one is the one that saves challenges.</p>` : ''}
    </div>

    <div class="card">
      <div class="card-head"><strong>Nutrition</strong>${kcalTarget() ? `<span class="badge-gold">${kcalTarget().toLocaleString()} kcal/day</span>` : ''}</div>
      <div class="field"><label>Your diet</label>
        <input class="input" type="text" data-field="dietName" placeholder="Keto, Paleo, your own…" value="${esc(S.profile.dietName)}" maxlength="30">
      </div>
      <p class="muted small">${kcalTarget()
        ? 'Your daily target feeds the food log on the Today screen.'
        : 'Answer a few questions and the app computes the calories your goal needs.'}</p>
      <button class="btn ghost wide" data-action="openNutrition">${kcalTarget() ? 'Recalculate my calories' : 'Set up my daily calories'}</button>
      <div class="field" style="margin-top:12px"><label>Banned foods — warn me when I log these</label>
        <input class="input" type="text" data-field="bannedWords" placeholder="soda, chips, energy drink" value="${esc(S.settings.bannedWords)}" maxlength="200">
      </div>
      <p class="muted small">Alcohol is always flagged. Name a diet above (Keto, Paleo, Vegan…) and the log warns about foods that break it, with a better swap.</p>
    </div>

    <div class="card">
      <div class="card-head"><strong>Cheat-meal passes</strong>${S.cheat.allowance > 0 ? `<span class="badge-gold">${cheatRemaining('me')} left</span>` : ''}</div>
      <div class="row-setting">
        <div><strong>Passes per attempt</strong><div class="muted small">Official 75 Hard allows none. Your challenge, your call.</div></div>
        <div class="seg tight">
          ${[0, 5, 10].map(v => `<button class="seg-opt ${S.cheat.allowance === v ? 'on' : ''}" data-action="setCheatAllowance" data-v="${v}">${v === 0 ? 'None' : v}</button>`).join('')}
        </div>
      </div>
      ${S.cheat.allowance > 0 ? `
        <div class="pass-dots">${Array.from({ length: S.cheat.allowance }, (_, i) =>
          `<span class="pass-dot ${i < usedList.length ? 'used' : ''}"></span>`).join('')}</div>
        ${usedList.length ? `
          <ul class="list">
            ${usedList.map(u => `
              <li class="row">
                <div><strong>${esc(u.occasion || 'Special occasion')}</strong>
                <div class="muted small">${shortDate(u.date)}</div></div>
              </li>`).join('')}
          </ul>` : `<p class="muted small">None used. Save them for the moments that matter — a wedding, a birthday, an anniversary.</p>`}` : `
        <p class="muted small">Official mode. The diet stands, all seventy-five days.</p>`}
    </div>

    <div class="card">
      <div class="card-head"><strong>Rules</strong></div>
      <div class="rule-pick">
        <button class="rule-opt ${!isFlex() ? 'on' : ''}" data-action="setChallengeMode" data-v="hard">
          <strong>75 Hard — the real thing</strong>
          <span>Miss a single task and you go back to Day One.</span>
        </button>
        <button class="rule-opt ${isFlex() ? 'on' : ''}" data-action="setChallengeMode" data-v="flex">
          <strong>Flexible — keep the streak human</strong>
          <span>A missed day is recorded, not punished. The count continues.</span>
        </button>
      </div>
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
      <div class="card-head"><strong>Your own commitments</strong><span class="muted small">${(S.customTasks || []).length}/4</span></div>
      ${(S.customTasks || []).length ? `
        <ul class="list">
          ${S.customTasks.map(c => `
            <li class="row">
              <div><strong>${esc(c.title)}</strong><div class="muted small">since ${shortDate(c.since)}</div></div>
              <button class="iconbtn" data-action="removeCustomTask" data-id="${esc(c.id)}" aria-label="Remove">${icon('trash')}</button>
            </li>`).join('')}
        </ul>` : ''}
      ${(S.customTasks || []).length < 4 ? `
        <div class="food-form">
          <input class="input" id="ctTitle" type="text" placeholder="e.g. 10 minutes of stretching" maxlength="40">
          <button class="btn primary" data-action="addCustomTask">Add</button>
        </div>` : ''}
      <p class="muted small">Extra rules join the daily list from today onward and count toward sealing the day — same stakes as the rest.</p>
    </div>

    <div class="card">
      <div class="card-head"><strong>The rules of 75 Hard</strong></div>
      <ol class="rules-list">
        <li><strong>Follow a structured diet</strong> geared toward your goals — zero deviations, zero excuses, zero alcohol.</li>
        <li><strong>Two 45-minute workouts</strong> a day, at least 3 hours apart — one of them must be outside, whatever the weather.</li>
        <li><strong>Drink a gallon of water</strong>, every day.</li>
        <li><strong>Read 10 pages</strong> of non-fiction that improves your life — physical pages, audiobooks don't count.</li>
        <li><strong>Take a progress picture</strong>, every day. Every detail matters.</li>
        <li>Miss any task, any day — <strong>return to Day One.</strong></li>
      </ol>
      <p class="muted small">${S.cheat.allowance > 0
        ? `House rule in effect: ${S.cheat.allowance} cheat-meal passes for genuine occasions. Use them like they're gold, because they are.`
        : 'Running official — no cheat meals, no passes, no exceptions.'}</p>
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
      <p class="muted small" id="storageStatus">${S.lastBackup ? `Last backup: ${shortDate(S.lastBackup)}.` : 'No backup yet — one tap keeps 75 days safe.'}</p>
    </div>

    <div class="card">
      <div class="card-head"><strong>Spread it</strong></div>
      <p class="muted small">Know someone who talks about doing 75 Hard? Send them the page — it installs in ten seconds.</p>
      <button class="btn ghost wide" data-action="shareApp">${icon('share')} Share the app</button>
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
        ${S.profile.why ? `<p class="why-quote serif">You wrote: “${esc(S.profile.why)}”</p>` : ''}
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
        <div class="card win-transform" id="transformBox" hidden></div>
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

  if (sh.type === 'food') {
    const day = ensureDay(sh.date);
    const me = day.me;
    const target = kcalTarget();
    const eaten = kcalEaten(me);
    const m = macrosEaten(me);
    inner = `
      <div class="sheet-title serif">Food log</div>
      <p class="muted small">${prettyDate(sh.date)}${target ? ` · ${eaten > target ? `${(eaten - target).toLocaleString()} kcal over` : `${(target - eaten).toLocaleString()} kcal left`}` : ''}</p>
      ${target ? `<div class="bar"><div class="bar-fill ${eaten > target ? 'over' : ''}" style="width:${Math.min(100, (eaten / target) * 100).toFixed(1)}%"></div></div>
        <div class="food-total"><span>${eaten.toLocaleString()} kcal</span><span class="muted small">target ${target.toLocaleString()}</span></div>` : `
        <div class="food-total"><span>${eaten.toLocaleString()} kcal</span></div>`}
      ${(m.p || m.c || m.f) ? `<div class="macro-row"><span>Protein <b>${Math.round(m.p)}g</b></span><span>Carbs <b>${Math.round(m.c)}g</b></span><span>Fat <b>${Math.round(m.f)}g</b></span></div>` : ''}
      <div class="food-sect">Add to</div>
      <div class="seg" id="foodMealSeg">
        ${MEALS.map((meal, i) => `<button class="seg-opt ${i === (UI.foodMeal || 0) ? 'on' : ''}" data-action="foodMeal" data-i="${i}">${meal}</button>`).join('')}
      </div>
      <div class="food-search-wrap">
        ${icon('search')}
        <input class="input" id="foodSearch" type="search" placeholder="Search foods — chicken, latte, tacos…" maxlength="60" autocomplete="off" value="${esc(UI.foodQuery || '')}">
        <button class="scan-btn" data-action="openScanner" aria-label="Scan a barcode">${icon('barcode')}</button>
      </div>
      <ul class="food-results" id="foodResults"></ul>
      ${UI.foodCustomOpen ? `
        <div class="food-sect">Create your own</div>
        <input class="input" id="cfName" type="text" placeholder="Name — e.g. Mom's pozole" maxlength="40" value="${esc(UI.foodQuery || '')}">
        <div class="food-form">
          <input class="input" id="cfServing" type="text" placeholder="Serving — e.g. 1 bowl" maxlength="30">
          <input class="input" id="cfKcal" type="number" inputmode="numeric" placeholder="kcal" min="0" max="5000">
        </div>
        <div class="macro-form">
          <input class="input" id="cfP" type="number" inputmode="numeric" placeholder="Protein g">
          <input class="input" id="cfC" type="number" inputmode="numeric" placeholder="Carbs g">
          <input class="input" id="cfF" type="number" inputmode="numeric" placeholder="Fat g">
        </div>
        <button class="btn primary wide" data-action="saveCustomFood" data-date="${esc(sh.date)}">Save &amp; log it</button>
        <button class="btn ghost wide" data-action="hideCustomFood">Cancel</button>` : ''}
      ${me.food.length ? `
        <div class="food-sect">Logged · ${prettyDate(sh.date)}</div>
        <ul class="food-list">
          ${me.food.map(f => `
            <li class="food-row">
              <div><strong>${esc(f.name)}</strong><div class="muted small">${esc(f.meal)}${f.serving ? ` · ${esc(f.serving)}` : ''}</div></div>
              <span class="qty-ctl">
                <button data-action="foodQty" data-date="${esc(sh.date)}" data-id="${esc(f.id)}" data-d="-0.5" aria-label="Less">−</button>
                <span>${Number(f.qty) && Number(f.qty) !== 1 ? Number(f.qty) + '×' : '1×'}</span>
                <button data-action="foodQty" data-date="${esc(sh.date)}" data-id="${esc(f.id)}" data-d="0.5" aria-label="More">+</button>
              </span>
              <span class="food-kcal">${entryKcal(f).toLocaleString()}</span>
              <button class="iconbtn" data-action="delFood" data-date="${esc(sh.date)}" data-id="${esc(f.id)}" aria-label="Remove">${icon('close')}</button>
            </li>`).join('')}
        </ul>` : ''}
      ${!target ? `<button class="btn ghost wide" data-action="openNutrition">Calculate my daily calories</button>` : ''}
      <button class="btn ghost wide" data-action="closeSheet">Done</button>`;
  }

  if (sh.type === 'nutrition') {
    const d = UI.nutriDraft;
    inner = `
      <div class="sheet-title serif">Your numbers</div>
      <p class="muted small">A Mifflin–St Jeor estimate of your daily calories. Tune it later to how your body responds.</p>
      <div class="seg">
        ${[['male', 'Male'], ['female', 'Female']].map(([k, l]) =>
          `<button class="seg-opt ${d.sex === k ? 'on' : ''}" data-action="nutriSet" data-k="sex" data-v="${k}">${l}</button>`).join('')}
      </div>
      <div class="duo tight">
        <input class="input" data-nfield="age" type="number" inputmode="numeric" placeholder="Age" min="10" max="100" value="${esc(d.age)}">
        ${d.unit === 'imperial'
          ? `<input class="input" data-nfield="lbs" type="number" inputmode="decimal" placeholder="Weight (lb)" value="${esc(d.lbs)}">`
          : `<input class="input" data-nfield="kg" type="number" inputmode="decimal" placeholder="Weight (kg)" value="${esc(d.kg)}">`}
      </div>
      ${d.unit === 'imperial' ? `
        <div class="duo tight">
          <input class="input" data-nfield="ft" type="number" inputmode="numeric" placeholder="Height (ft)" value="${esc(d.ft)}">
          <input class="input" data-nfield="inch" type="number" inputmode="numeric" placeholder="Height (in)" value="${esc(d.inch)}">
        </div>` : `
        <input class="input" data-nfield="cm" type="number" inputmode="numeric" placeholder="Height (cm)" value="${esc(d.cm)}">`}
      <button class="cheat-link" data-action="nutriUnit">${d.unit === 'imperial' ? 'Switch to metric' : 'Switch to feet & pounds'}</button>
      <div class="field"><label>How active are you?</label>
        <div class="rule-pick">
          ${ACTIVITIES.map(([k, l]) => `<button class="rule-opt slim ${d.activity === k ? 'on' : ''}" data-action="nutriSet" data-k="activity" data-v="${k}"><strong>${l}</strong></button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Goal</label>
        <div class="seg">
          ${[['lose', 'Lose fat'], ['maintain', 'Maintain'], ['gain', 'Build']].map(([k, l]) =>
            `<button class="seg-opt ${d.goal === k ? 'on' : ''}" data-action="nutriSet" data-k="goal" data-v="${k}">${l}</button>`).join('')}
        </div>
      </div>
      <button class="btn primary wide" data-action="saveNutrition">Calculate &amp; save</button>
      <button class="btn ghost wide" data-action="closeSheet">Cancel</button>`;
  }

  if (sh.type === 'dietWarn') {
    const pend = UI.pendingFood || {};
    inner = `
      <div class="sheet-title serif">Hold on.</div>
      <p class="muted">${esc(pend.reason || 'This may break your diet.')}</p>
      ${pend.food ? `<div class="warn-food"><strong>${esc(pend.food.name)}</strong><span class="muted small">${esc(pend.food.serving || '')} · ${Math.round(pend.food.kcal)} kcal</span></div>` : ''}
      ${pend.swap ? `<p class="swap-tip">${esc(pend.swap)}</p>` : ''}
      ${cheatRemaining('me') > 0 ? `<p class="muted small">A true occasion? You still hold ${cheatRemaining('me')} cheat pass${cheatRemaining('me') === 1 ? '' : 'es'}.</p>` : ''}
      <button class="btn primary wide" data-action="skipFood">Skip it — stay clean</button>
      <button class="btn ghost wide" data-action="logAnyway">Log it anyway</button>`;
  }

  if (sh.type === 'workoutLog') {
    const day = ensureDay(sh.date);
    const w = day.me.workouts[sh.task] || {};
    const KINDS = ['Lift', 'Run', 'Walk', 'HIIT', 'Yoga', 'Swim', 'Bike', 'Other'];
    const t = TASKS.find(x => x.id === sh.task);
    inner = `
      <div class="sheet-title serif">${t ? t.title : 'Workout'}</div>
      <p class="muted small">What did you actually do? Future you will want the record.</p>
      <div class="kind-chips">
        ${KINDS.map(k => `<button class="chip ${w.kind === k ? 'on' : ''}" data-action="setWorkoutKind" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}" data-k="${k}">${k}</button>`).join('')}
      </div>
      <div class="water-row" style="margin:14px 0 6px">
        <span class="water-count">${w.mins || 45} <small>minutes</small></span>
        <span class="chips">
          <button class="chip" data-action="workoutMins" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}" data-d="-5">−5</button>
          <button class="chip" data-action="workoutMins" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}" data-d="5">+5</button>
        </span>
      </div>
      <input class="input" id="woNote" type="text" placeholder="Notes — 5x5 squats, new PR…" maxlength="80" value="${esc(w.note || '')}">
      <button class="btn primary wide" data-action="saveWorkout" data-date="${esc(sh.date)}" data-task="${esc(sh.task)}">Save</button>
      <button class="btn ghost wide" data-action="closeSheet">Close</button>`;
  }

  if (sh.type === 'milestone') {
    const m = MILESTONES.find(x => x[0] === sh.n) || [sh.n, `Day ${sh.n}.`, ''];
    inner = `
      <div class="milestone-num serif">${m[0]}</div>
      <div class="sheet-title serif" style="text-align:center">${esc(m[1])}</div>
      <p class="muted" style="text-align:center">${esc(m[2])}</p>
      ${S.profile.why ? `<p class="why-quote serif">“${esc(S.profile.why)}”</p>` : ''}
      <button class="btn primary wide" data-action="closeSheet">Keep going</button>`;
  }

  if (sh.type === 'reflect') {
    inner = `
      <div class="sheet-title serif">Week ${sh.week} — look back</div>
      <p class="muted small">Seven days sealed. Two minutes of honesty: what worked, what nearly broke you, what changes next week?</p>
      <textarea class="input" id="reflectText" rows="5" placeholder="This week I…"></textarea>
      <button class="btn primary wide" data-action="saveReflection" data-week="${Number(sh.week) || 0}">Save the reflection</button>
      <button class="btn ghost wide" data-action="closeSheet">Not now</button>`;
  }

  if (sh.type === 'chef') {
    const date = sh.date || todayStr();
    const me = ensureDay(date).me;
    const target = kcalTarget();
    const left = target ? Math.max(0, target - kcalEaten(me)) : null;
    const results = Chef.match(S.fridge)
      .map(m => ({ ...m, comply: checkDietCompliance({ name: m.r.n + ' ' + m.r.i.join(' '), c: m.r.c }) }))
      .sort((a, b) => (a.comply.flag ? 1 : 0) - (b.comply.flag ? 1 : 0));
    CHEF_RESULTS = results;
    inner = `
      <div class="sheet-title serif">The Chef</div>
      <p class="muted small">Tell it what's in the fridge — it finds real meals${left != null ? ` that fit the <b>${left.toLocaleString()} kcal</b> you have left today` : ''}. English or Spanish, all on your phone.</p>
      <textarea class="input" id="fridgeText" rows="3" data-field="fridge"
        placeholder="pollo, arroz, huevos, aguacate, queso…">${esc(S.fridge)}</textarea>
      <button class="btn primary wide" data-action="chefFind">Find recipes</button>
      ${results.length ? `
        <div class="food-sect">From your fridge</div>
        <ul class="chef-list">
          ${results.map((m, idx) => {
            const r = m.r;
            let qty = 1;
            if (left != null && r.k > left && left >= 220) qty = Math.max(0.5, Math.floor((left / r.k) * 2) / 2);
            const fits = left == null || r.k * qty <= left;
            const comply = m.comply;
            return `
              <li class="chef-card">
                <div class="chef-head">
                  <strong>${esc(r.n)}</strong>
                  <span class="chef-kcal ${fits ? 'ok' : 'no'}">${Math.round(r.k * qty).toLocaleString()} kcal</span>
                </div>
                <div class="muted small">P${Math.round(r.p * qty)} · C${Math.round(r.c * qty)} · F${Math.round(r.f * qty)} · ${r.t} min${qty !== 1 ? ` · ${qty}× portion to fit your day` : ''}</div>
                ${m.missing.length ? `<div class="chef-miss">Missing: ${m.missing.map(esc).join(', ')}</div>` : `<div class="chef-have">You have everything.</div>`}
                ${comply.flag ? `<div class="chef-warn">${esc(comply.reason)}</div>` : ''}
                <ol class="chef-steps">${r.s.map(st => `<li>${esc(st)}</li>`).join('')}</ol>
                <button class="btn ghost wide small-log" data-action="chefLog" data-idx="${idx}" data-qty="${qty}" data-date="${esc(date)}">
                  Cook it — log ${qty !== 1 ? qty + '× ' : ''}to ${MEALS[UI.foodMeal || 0]}
                </button>
              </li>`;
          }).join('')}
        </ul>` : (S.fridge.trim() ? `<p class="food-empty">Nothing matches yet — add a protein (chicken, eggs, tuna…) and a base (rice, tortilla, potato…).</p>` : '')}
      <button class="btn ghost wide" data-action="backToFood" data-date="${esc(date)}">Back to the log</button>`;
  }

  if (sh.type === 'legacy') {
    const MOOD_WORDS = { 1: 'A rough one', 2: 'A low day', 3: 'Steady', 4: 'A good day', 5: 'Strong' };
    const dayN = Math.max(1, Math.min(currentDayN(), 75));
    const rows = [];
    for (let i = dayN; i >= 1; i--) {
      const date = addDays(startDate(), i - 1);
      const me = getDay(date).me;
      if (!me) continue;
      const pid = me.proofs && me.proofs.photo;
      const workouts = Object.values(me.workouts || {}).filter(w => w.kind)
        .map(w => `${w.kind} ${w.mins || 45}′`).join(' + ');
      const meta = [
        me.mood ? MOOD_WORDS[me.mood] : '',
        workouts,
        me.weight ? `${me.weight} lb` : '',
        (me.food || []).length ? `${kcalEaten(me).toLocaleString()} kcal` : '',
        me.water ? `${me.water} oz` : '',
      ].filter(Boolean).join(' · ');
      const refl = i % 7 === 0 ? S.reflections.find(r => r.week === i / 7) : null;
      rows.push(`
        <li class="tl-row ${pid ? 'has-photo' : ''}">
          <div class="tl-day ${dayComplete(date) ? 'done' : ''}"><span class="serif">${i}</span></div>
          <div class="tl-body">
            <div class="tl-date">${prettyDate(date)}</div>
            ${meta ? `<div class="muted small">${meta}</div>` : ''}
            ${pid ? `<img class="tl-photo-big" data-proof-src="${esc(pid)}" alt="Day ${i}">` : ''}
            ${me.note ? `<div class="tl-note">${esc(me.note)}</div>` : ''}
          </div>
        </li>
        ${refl ? `
          <li class="tl-reflect">
            <div class="kicker">Week ${refl.week} — looking back</div>
            <p>“${esc(refl.text)}”</p>
          </li>` : ''}`);
    }
    inner = `
      <div class="sheet-title serif">The Archive</div>
      <p class="muted small">Attempt ${roman(S.attempt.n)} — every picture, every word, every number. Nothing is lost here.</p>
      ${S.history.length ? `
        <div class="sanctuary">
          ${S.history.slice().reverse().map(h => `
            <div class="plaque">
              <div class="plaque-num serif">${/Completed/.test(h.note || '') ? '75' : h.days}</div>
              <div><strong>Attempt ${roman(h.n)}</strong>
              <div class="muted small">${shortDate(h.start)} — ${shortDate(h.end)} · ${esc(h.note)}</div></div>
            </div>`).join('')}
        </div>` : ''}
      <ul class="tl">${rows.join('')}</ul>
      ${renderYearHeatmap()}
      <button class="btn ghost wide" data-action="closeSheet">Close the archive</button>`;
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

function fillProofImgs(root) {
  root.querySelectorAll('img[data-proof-src]').forEach(img => {
    proofURL(img.getAttribute('data-proof-src')).then(url => { if (url) img.src = url; });
  });
}

function hydrateProofImages() {
  fillProofImgs(document);
  if ($('#photoStrip') || $('#transformBox')) hydrateGallery();
}

function myPhotos() {
  return DB.allProofs().then(all => all
    .filter(r => r.taskId === 'photo' && r.who === 'me' && r.attempt === S.attempt.n)
    .sort((a, b) => a.date < b.date ? -1 : 1));
}

function hydrateGallery() {
  myPhotos().then(photos => {
    const strip = $('#photoStrip');
    if (strip && photos.length) {
      strip.innerHTML = photos.map(r => `
        <button class="strip-item" data-action="viewProof" data-date="${esc(r.date)}" data-task="photo">
          <img data-proof-src="${esc(r.id)}" alt="">
          <span>Day ${dayNumberOf(r.date)}</span>
        </button>`).join('');
      fillProofImgs(strip);
    }
    const tf = $('#transformBox');
    if (tf && photos.length >= 2) {
      const a = photos[0], b = photos[photos.length - 1];
      tf.hidden = false;
      tf.innerHTML = `
        <div class="card-head"><strong>The change</strong><span class="muted small">drag to compare</span></div>
        <div class="ba-wrap">
          <img class="ba-under" data-proof-src="${esc(b.id)}" alt="">
          <div class="ba-top"><img data-proof-src="${esc(a.id)}" alt=""></div>
          <div class="ba-line"><i></i></div>
          <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Compare Day ${dayNumberOf(a.date)} and Day ${dayNumberOf(b.date)}">
          <span class="ba-tag l">Day ${dayNumberOf(a.date)}</span>
          <span class="ba-tag r">Day ${dayNumberOf(b.date)}</span>
        </div>
        <div class="duo" style="margin-top:14px">
          <button class="btn ghost" data-action="playLapse">Play the reel</button>
          ${FX.filmSupported() ? `<button class="btn ghost" data-action="exportFilmBtn">Export the film</button>` : `<span></span>`}
        </div>`;
      fillProofImgs(tf);
      wireBASlider(tf.querySelector('.ba-wrap'));
    }
  });
}

function wireBASlider(wrap) {
  if (!wrap) return;
  const top = wrap.querySelector('.ba-top');
  const topImg = top.querySelector('img');
  const line = wrap.querySelector('.ba-line');
  const range = wrap.querySelector('.ba-range');
  const sync = () => { topImg.style.width = wrap.clientWidth + 'px'; };
  const move = v => {
    top.style.width = v + '%';
    line.style.left = v + '%';
  };
  range.addEventListener('input', () => move(range.value));
  new ResizeObserver(sync).observe(wrap);
  sync();
  move(50);
}

/* Full-screen time-lapse of progress pictures */
function openTimelapse(photos) {
  const ov = document.createElement('div');
  ov.className = 'lapse';
  ov.innerHTML = `<img alt=""><div class="lapse-label serif"></div><div class="lapse-hint">Tap anywhere to close</div>`;
  document.body.appendChild(ov);
  const img = ov.querySelector('img');
  const label = ov.querySelector('.lapse-label');
  let i = 0;
  const step = () => {
    const p = photos[i % photos.length];
    proofURL(p.id).then(url => { if (url) img.src = url; });
    label.textContent = `Day ${dayNumberOf(p.date)}`;
    i++;
  };
  step();
  const timer = setInterval(step, 700);
  ov.addEventListener('click', () => { clearInterval(timer); ov.remove(); });
}

/* ───────────────────────── Food search ───────────────────────── */

function foodResultRow(r, idx) {
  return `
    <li>
      <button class="food-result ${r.src === 'web' ? 'web' : ''}" data-action="addFoodResult" data-idx="${idx}">
        <span class="fr-add">${icon(r.src === 'web' ? 'globe' : 'plus')}</span>
        <span class="fr-body">
          <span class="fr-name">${esc(r.name)}</span>
          <span class="fr-sub">${esc(r.serving)}${(r.p || r.c || r.f) ? ` · P${Math.round(r.p)} C${Math.round(r.c)} F${Math.round(r.f)}` : ''}${r.src === 'mine' ? ' · my food' : ''}</span>
        </span>
        <span class="fr-kcal">${Math.round(r.kcal).toLocaleString()}</span>
      </button>
    </li>`;
}

function updateFoodResults(webRows) {
  const box = $('#foodResults');
  if (!box) return;
  const q = (UI.foodQuery || '').trim();

  if (q.length < 2) {
    FOOD_RESULTS = (S.foodRecents || []).slice(0, 8);
    const chefRow = `
      <li>
        <button class="food-result" data-action="openChef">
          <span class="fr-add">${icon('fork')}</span>
          <span class="fr-body"><span class="fr-name">Cook from your fridge</span>
          <span class="fr-sub">The Chef — real meals that fit today's calories</span></span>
        </button>
      </li>`;
    box.innerHTML = chefRow + (FOOD_RESULTS.length
      ? `<div class="food-sect">Recent</div>` + FOOD_RESULTS.map(foodResultRow).join('')
      : `<p class="food-empty">Search the built-in food library, or your own saved foods. Recents will appear here.</p>`);
    return;
  }

  if (/^\d{8,14}$/.test(q)) {
    FOOD_RESULTS = webRows || [];
    box.innerHTML =
      FOOD_RESULTS.map(foodResultRow).join('') +
      (FOOD_RESULTS.length ? '' : `
        <li>
          <button class="food-result web" data-action="lookupCode" id="codeLookupBtn">
            <span class="fr-add">${icon('barcode')}</span>
            <span class="fr-body"><span class="fr-name">Look up barcode ${esc(q)}</span>
            <span class="fr-sub">Open Food Facts product database</span></span>
          </button>
        </li>`);
    return;
  }

  FOOD_RESULTS = searchFoods(q, S.myFoods);
  if (webRows && webRows.length) FOOD_RESULTS = FOOD_RESULTS.concat(webRows);

  box.innerHTML =
    FOOD_RESULTS.map(foodResultRow).join('') +
    (webRows ? '' : `
      <li>
        <button class="food-result web" data-action="searchOnline" id="webSearchBtn">
          <span class="fr-add">${icon('globe')}</span>
          <span class="fr-body"><span class="fr-name">Search the web for “${esc(q)}”</span>
          <span class="fr-sub">Open Food Facts — millions of products</span></span>
        </button>
      </li>`) +
    `<li>
      <button class="food-result" data-action="showCustomFood">
        <span class="fr-add">${icon('plus')}</span>
        <span class="fr-body"><span class="fr-name">Create “${esc(q)}”</span>
        <span class="fr-sub">Your own food, saved for next time</span></span>
      </button>
    </li>`;
}

function searchOpenFoodFacts(q) {
  if (offAbort) offAbort.abort();
  offAbort = new AbortController();
  const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=8'
    + '&fields=product_name,brands,serving_size,nutriments&search_terms=' + encodeURIComponent(q);
  const timer = setTimeout(() => offAbort.abort(), 8000);
  return fetch(url, { signal: offAbort.signal })
    .then(r => r.json())
    .then(data => (data.products || []).map(p => {
      const n = p.nutriments || {};
      const perServing = n['energy-kcal_serving'];
      const kcal = perServing != null ? perServing : n['energy-kcal_100g'];
      if (kcal == null || !p.product_name) return null;
      const suffix = perServing != null ? '_serving' : '_100g';
      return {
        name: p.brands ? `${p.product_name} (${p.brands.split(',')[0].trim()})` : p.product_name,
        serving: perServing != null ? (p.serving_size || '1 serving') : '100 g',
        kcal: Math.round(Number(kcal)),
        p: Number(n['proteins' + suffix]) || 0,
        c: Number(n['carbohydrates' + suffix]) || 0,
        f: Number(n['fat' + suffix]) || 0,
        src: 'web',
      };
    }).filter(Boolean))
    .finally(() => clearTimeout(timer));
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
    c: activeTasksFor(today).filter(t => taskDone(today, 'me', t)).map(t => t.id),
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
  S.lastBackup = todayStr();
  save();
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
  tab(d) {
    if (UI.tab !== d.tab) UI.enterAnim = true;
    UI.tab = d.tab;
    renderApp();
    UI.enterAnim = false;
  },
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
    if (UI.obStep === 3) {
      const v = $('#obDiet'); if (v) UI.ob.dietName = v.value.trim();
    }
    UI.obStep++;
    renderApp();
  },
  obBack() {
    if (UI.obStep === 2) {
      const p = $('#obPartner'); if (p) UI.ob.partnerName = p.value.trim();
    }
    if (UI.obStep === 3) {
      const v = $('#obDiet'); if (v) UI.ob.dietName = v.value.trim();
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
  obChallengeMode(d) { UI.ob.challengeMode = d.v; renderApp(); },
  obFinish() {
    const ob = UI.ob;
    S.profile.name = ob.name;
    S.profile.mode = ob.mode;
    S.profile.partnerName = ob.mode === 'couple' ? ob.partnerName : '';
    S.profile.coupleRule = ob.coupleRule;
    S.profile.dietName = ob.dietName;
    S.profile.why = (($('#obWhy') || {}).value || '').trim().slice(0, 140);
    S.settings.challengeMode = ob.challengeMode;
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
  toggle(d, el) {
    const date = d.date, taskId = d.task;
    const t = activeTasksFor(date).find(x => x.id === taskId);
    if (!t) return;
    const day = ensureDay(date);
    const me = day.me;
    const done = taskDone(date, 'me', t);

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
    if (!done && taskDone(date, 'me', t) && el) {
      FX.tick();
      const li = el.closest('.task');
      FX.burst(el, li ? getComputedStyle(li).getPropertyValue('--tint').trim() : null);
    }
    save();
    evaluateAndRender();
    const now = personDone(date, 'me');
    if (now && !done) celebrateDay(date);
  },

  water(d, el) {
    const day = ensureDay(d.date);
    const before = taskDone(d.date, 'me', TASKS.find(t => t.type === 'water'));
    day.me.water = Math.max(0, Math.min(999, day.me.water + Number(d.oz)));
    if (!before && day.me.water >= S.settings.waterGoalOz && el) { FX.tick(); FX.burst(el, 'var(--t-water)'); }
    save();
    evaluateAndRender();
    if (!before && day.me.water >= S.settings.waterGoalOz) showToast('A full gallon. Well done.');
    if (personDone(d.date, 'me') && !before) celebrateDay(d.date);
  },

  pages(d) {
    const day = ensureDay(d.date);
    const wasDone = personDone(d.date, 'me');
    setPages(d.date, day.me.pages + Number(d.n));
    save();
    evaluateAndRender();
    const book = currentBook();
    if (book && !book.done && book.pagesRead >= book.totalPages) {
      showToast(`You reached the last page of “${book.title}”.`);
    }
    if (!wasDone && personDone(d.date, 'me')) celebrateDay(d.date);
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

  /* food log */
  foodMeal(d, el) {
    UI.foodMeal = Number(d.i) || 0;
    const seg = $('#foodMealSeg');
    if (seg) seg.querySelectorAll('.seg-opt').forEach((b, i) => b.classList.toggle('on', i === UI.foodMeal));
  },
  addFoodResult(d) {
    const r = FOOD_RESULTS[Number(d.idx)];
    if (!r) return;
    const date = (UI.sheet && UI.sheet.date) || todayStr();
    tryLogFood(date, r);
  },
  logAnyway() {
    const pend = UI.pendingFood;
    UI.pendingFood = null;
    if (!pend) { UI.sheet = null; renderApp(); return; }
    UI.sheet = { type: 'food', date: pend.date };
    doLogFood(pend.date, pend.food);
  },
  skipFood() {
    const pend = UI.pendingFood;
    UI.pendingFood = null;
    UI.sheet = pend ? { type: 'food', date: pend.date } : null;
    renderApp();
    showToast('Good call.');
  },
  foodQty(d) {
    const day = ensureDay(d.date);
    const f = day.me.food.find(x => x.id === d.id);
    if (!f) return;
    f.qty = Math.min(20, Math.max(0.5, (Number(f.qty) || 1) + Number(d.d)));
    save();
    renderApp();
  },
  delFood(d) {
    const day = ensureDay(d.date);
    const i = day.me.food.findIndex(f => f.id === d.id);
    if (i >= 0) day.me.food.splice(i, 1);
    save();
    renderApp();
  },
  chefFind() {
    const el = $('#fridgeText');
    if (el) S.fridge = el.value.slice(0, 400);
    save();
    renderApp();
    if (!Chef.match(S.fridge).length && S.fridge.trim()) {
      showToast('Add a protein and a base — chicken and rice, eggs and tortilla…');
    }
  },
  chefLog(d) {
    const m = CHEF_RESULTS[Number(d.idx)];
    if (!m) return;
    const qty = Number(d.qty) || 1;
    UI.sheet = { type: 'food', date: d.date };
    tryLogFood(d.date, {
      name: m.r.n, serving: '1 serving', qty,
      kcal: m.r.k, p: m.r.p, c: m.r.c, f: m.r.f,
    });
  },
  backToFood(d) { UI.sheet = { type: 'food', date: d.date }; renderApp(); },
  openChef(d) {
    UI.sheet = { type: 'chef', date: (UI.sheet && UI.sheet.date) || d.date || todayStr() };
    renderApp();
  },
  showCustomFood() { UI.foodCustomOpen = true; renderApp(); },
  hideCustomFood() { UI.foodCustomOpen = false; renderApp(); },
  saveCustomFood(d) {
    const name = (($('#cfName') || {}).value || '').trim();
    const kcal = parseInt(($('#cfKcal') || {}).value, 10);
    if (!name) { showToast('Give it a name.'); return; }
    if (!(kcal >= 0)) { showToast('Add the calories.'); return; }
    const food = {
      name,
      serving: (($('#cfServing') || {}).value || '').trim() || '1 serving',
      kcal: Math.min(5000, kcal),
      p: Math.max(0, parseFloat(($('#cfP') || {}).value) || 0),
      c: Math.max(0, parseFloat(($('#cfC') || {}).value) || 0),
      f: Math.max(0, parseFloat(($('#cfF') || {}).value) || 0),
    };
    S.myFoods.unshift(food);
    if (S.myFoods.length > 200) S.myFoods.pop();
    UI.foodCustomOpen = false;
    save();
    tryLogFood(d.date, { ...food, src: 'mine' });
  },
  openScanner() {
    const date = (UI.sheet && UI.sheet.date) || todayStr();
    Scanner.open(food => tryLogFood(date, food), showToast);
  },
  lookupCode() {
    const q = (UI.foodQuery || '').trim();
    const btn = $('#codeLookupBtn');
    if (btn) btn.querySelector('.fr-name').textContent = 'Looking it up…';
    Scanner.lookupBarcode(q).then(food => {
      if ((UI.foodQuery || '').trim() !== q) return;
      if (!food) { showToast('No product found for that barcode.'); updateFoodResults([]); return; }
      updateFoodResults([food]);
    }).catch(() => showToast('No connection — the built-in library still works.'));
  },
  searchOnline() {
    const btn = $('#webSearchBtn');
    if (btn) btn.querySelector('.fr-name').textContent = 'Searching…';
    const q = (UI.foodQuery || '').trim();
    searchOpenFoodFacts(q)
      .then(rows => {
        if ((UI.foodQuery || '').trim() !== q) return;
        if (!rows.length) showToast('Nothing found online for that.');
        updateFoodResults(rows);
      })
      .catch(err => {
        if (err && err.name === 'AbortError') return;
        showToast('No connection — the built-in library still works.');
        updateFoodResults([]);
      });
  },

  /* nutrition calculator */
  openNutrition() {
    const ob = $('#obDiet');
    if (ob) UI.ob.dietName = ob.value.trim();
    if (!UI.nutriDraft) {
      const n = S.settings.nutrition;
      if (n) {
        const totalIn = n.cm / 2.54;
        UI.nutriDraft = {
          sex: n.sex, age: n.age, activity: n.activity, goal: n.goal, unit: 'imperial',
          ft: Math.floor(totalIn / 12), inch: Math.round(totalIn % 12),
          lbs: Math.round(n.kg / 0.45359), cm: Math.round(n.cm), kg: Math.round(n.kg),
        };
      } else {
        UI.nutriDraft = { sex: 'male', age: '', ft: '', inch: '', lbs: '', cm: '', kg: '', unit: 'imperial', activity: 'light', goal: 'maintain' };
      }
    }
    UI.sheet = { type: 'nutrition' };
    renderApp();
  },
  nutriSet(d) {
    UI.nutriDraft[d.k] = d.v;
    renderApp();
  },
  nutriUnit() {
    const d = UI.nutriDraft;
    if (d.unit === 'imperial') {
      d.unit = 'metric';
      if (d.ft || d.inch) d.cm = Math.round((Number(d.ft) || 0) * 30.48 + (Number(d.inch) || 0) * 2.54);
      if (d.lbs) d.kg = Math.round(Number(d.lbs) * 0.45359);
    } else {
      d.unit = 'imperial';
      if (d.cm) { const t = Number(d.cm) / 2.54; d.ft = Math.floor(t / 12); d.inch = Math.round(t % 12); }
      if (d.kg) d.lbs = Math.round(Number(d.kg) / 0.45359);
    }
    renderApp();
  },
  saveNutrition() {
    const d = UI.nutriDraft;
    const age = Number(d.age);
    const cm = d.unit === 'imperial'
      ? (Number(d.ft) || 0) * 30.48 + (Number(d.inch) || 0) * 2.54
      : Number(d.cm);
    const kg = d.unit === 'imperial' ? Number(d.lbs) * 0.45359 : Number(d.kg);
    if (!(age >= 10 && age <= 100)) { showToast('Check the age.'); return; }
    if (!(cm >= 90 && cm <= 250)) { showToast('Check the height.'); return; }
    if (!(kg >= 30 && kg <= 350)) { showToast('Check the weight.'); return; }
    const n = { sex: d.sex, age, cm: Math.round(cm * 10) / 10, kg: Math.round(kg * 10) / 10, activity: d.activity, goal: d.goal };
    n.targetKcal = computeTargetKcal(n);
    S.settings.nutrition = n;
    UI.sheet = null;
    save();
    renderApp();
    showToast(`Your day: ${n.targetKcal.toLocaleString()} kcal.`);
  },
  setMood(d) {
    const day = ensureDay(d.date);
    day.me.mood = day.me.mood === Number(d.v) ? null : Number(d.v);
    save();
    renderApp();
  },
  setWorkoutKind(d) {
    const day = ensureDay(d.date);
    const w = day.me.workouts[d.task] || (day.me.workouts[d.task] = { mins: 45 });
    w.kind = d.k;
    const note = $('#woNote'); if (note) w.note = note.value.trim();
    save();
    renderApp();
  },
  workoutMins(d) {
    const day = ensureDay(d.date);
    const w = day.me.workouts[d.task] || (day.me.workouts[d.task] = { mins: 45 });
    w.mins = Math.max(5, Math.min(240, (w.mins || 45) + Number(d.d)));
    const note = $('#woNote'); if (note) w.note = note.value.trim();
    save();
    renderApp();
  },
  saveWorkout(d) {
    const day = ensureDay(d.date);
    const w = day.me.workouts[d.task] || (day.me.workouts[d.task] = { mins: 45 });
    const note = $('#woNote'); if (note) w.note = note.value.trim();
    UI.sheet = null;
    save();
    renderApp();
    showToast('Logged. That counts.');
  },
  workoutSheet(d) { UI.sheet = { type: 'workoutLog', date: d.date, task: d.task }; renderApp(); },
  saveReflection(d) {
    const text = (($('#reflectText') || {}).value || '').trim();
    if (!text) { showToast('A sentence is enough.'); return; }
    S.reflections.push({ week: Number(d.week), date: todayStr(), text: text.slice(0, 600) });
    UI.sheet = null;
    save();
    renderApp();
    showToast('Reflection kept.');
  },
  setTheme(d) {
    S.settings.theme = d.v;
    save();
    applyTheme();
    renderApp();
  },
  toggleReminders() {
    const r = S.settings.reminders;
    if (r.on) { r.on = false; save(); renderApp(); return; }
    if (!('Notification' in window)) { showToast('This browser has no notifications.'); return; }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        r.on = true;
        save();
        renderApp();
        showToast('Reminders on — while the app is open or in a tab.');
      } else {
        showToast('Notifications were not allowed.');
      }
    });
  },
  addCustomTask() {
    const title = (($('#ctTitle') || {}).value || '').trim();
    if (!title) { showToast('Name the commitment first.'); return; }
    if ((S.customTasks || []).length >= 4) { showToast('Four extra rules is plenty.'); return; }
    S.customTasks.push({ id: 'c' + uid(), title: title.slice(0, 40), since: todayStr() });
    save();
    evaluateAndRender();
    showToast(`“${title}” joins the list — starting today.`);
  },
  removeCustomTask(d) {
    const i = (S.customTasks || []).findIndex(c => c.id === d.id);
    if (i >= 0) S.customTasks.splice(i, 1);
    save();
    evaluateAndRender();
  },
  setChallengeMode(d) {
    S.settings.challengeMode = d.v;
    save();
    evaluateAndRender();
    showToast(d.v === 'flex' ? 'Flexible mode — misses are recorded, not punished.' : 'Hard mode. The rules are the rules.');
  },
  setCheatAllowance(d) {
    const v = Number(d.v);
    if (v < cheatUsed('me')) { showToast(`You've already used ${cheatUsed('me')} this attempt.`); return; }
    S.cheat.allowance = v;
    save();
    renderApp();
  },
  playLapse() {
    myPhotos().then(photos => {
      if (photos.length < 2) { showToast('Two or more pictures make a reel.'); return; }
      openTimelapse(photos);
    });
  },
  shareCardBtn() {
    const life = lifetimeStats();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
    const totalPages = S.books.reduce((a, b) => a + (b.pagesRead || 0), 0);
    const week = [];
    for (let i = 6; i >= 0; i--) week.push(dayComplete(addDays(todayStr(), -i)));
    FX.shareCard({
      week,
      dayN: Math.max(0, Math.min(currentDayN(), 75)),
      accent,
      name: S.profile.name,
      title: currentChain() >= 2 ? `${currentChain()}-day chain.` : 'Still standing.',
      quote: S.profile.why,
      kicker: `SEVENTY-FIVE · ATTEMPT ${roman(S.attempt.n)}`,
      stats: [
        { v: String(life.sealed), l: 'days sealed', color: accent },
        { v: String(currentChain()), l: 'chain', color: '#ff9d0a' },
        { v: String(totalPages), l: 'pages read', color: '#c084f5' },
        { v: life.score.toLocaleString(), l: 'discipline', color: '#e9d5a6' },
      ],
    }).then(blob => shareBlob(blob, 'seventyfive-card.png', 'image/png'));
  },
  exportFilmBtn() {
    myPhotos().then(async photos => {
      if (photos.length < 2) { showToast('Two or more pictures make a film.'); return; }
      showToast('Rendering your film — hold on a few seconds…');
      const frames = [];
      for (const p of photos) {
        const url = await proofURL(p.id);
        if (url) frames.push({ url, label: `DAY ${dayNumberOf(p.date)}` });
      }
      try {
        const blob = await FX.exportFilm(frames);
        shareBlob(blob, `seventyfive-transformation.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`, blob.type);
      } catch {
        showToast('This device cannot render video — the reel still plays.');
      }
    });
  },
  setAccent(d) {
    const acc = ACCENTS.find(a => a[0] === d.v);
    if (!acc) return;
    const life = lifetimeStats();
    if (life.sealed < acc[2]) { showToast(`“${acc[1]}” unlocks at ${acc[2]} lifetime sealed days.`); return; }
    S.settings.accent = d.v;
    save();
    applyTheme();
    renderApp();
    showToast(`${acc[1]} equipped.`);
  },
  toggleSound() {
    S.settings.sound = S.settings.sound === false;
    save();
    applyTheme();
    renderApp();
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
    const t = activeTasksFor(d.date).find(x => x.id === d.task);
    if (!t) return;
    const isDone = taskDone(d.date, 'partner', t);
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
    const text = `${S.profile.name || 'I'} — Day ${n} of 75: ${doneCount(todayStr(), 'me')}/${activeTasks().length} done${personDone(todayStr(), 'me') ? '. Sealed.' : '.'}\n\n${code}`;
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
  shareApp() {
    const url = new URL('./welcome.html', location.href).href;
    const text = 'Seventy-five days. Six commitments. No mercy. The 75 Hard app we use:';
    if (navigator.share) navigator.share({ title: 'SEVENTY-FIVE', text, url }).catch(() => {});
    else navigator.clipboard.writeText(`${text} ${url}`).then(() => showToast('Link copied — send it anywhere.'));
  },
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

function doLogFood(date, food) {
  const day = ensureDay(date);
  day.me.food.push({
    id: uid(), name: food.name, serving: food.serving, qty: food.qty || 1,
    kcal: Math.round(food.kcal), p: food.p || 0, c: food.c || 0, f: food.f || 0,
    meal: MEALS[UI.foodMeal || 0],
  });
  pushRecentFood(food);
  save();
  renderApp();
  showToast(`${food.name} — logged.`);
}

function tryLogFood(date, food) {
  const check = checkDietCompliance(food);
  if (check.flag) {
    UI.pendingFood = { date, food, reason: check.reason, swap: foodSwapFor(check.word) };
    UI.sheet = { type: 'dietWarn', date };
    renderApp();
    return;
  }
  doLogFood(date, food);
}

function pushRecentFood(r) {
  const key = `${r.name}|${r.serving}`;
  S.foodRecents = (S.foodRecents || []).filter(x => `${x.name}|${x.serving}` !== key);
  S.foodRecents.unshift({ name: r.name, serving: r.serving, kcal: Math.round(r.kcal), p: r.p || 0, c: r.c || 0, f: r.f || 0 });
  if (S.foodRecents.length > 14) S.foodRecents.length = 14;
}

function shareBlob(blob, filename, type) {
  const file = new File([blob], filename, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    showToast('Saved to your downloads.');
  }
}

function nudgeProof(date, taskId) {
  showToast('Proof first — attach the photo, then check it off.');
  const btn = document.querySelector(`.proof-btn[data-date="${date}"][data-task="${taskId}"]`);
  if (btn) { btn.classList.add('pulse'); setTimeout(() => btn.classList.remove('pulse'), 1200); }
}

function celebrateDay(date) {
  if (dayComplete(date)) {
    const n = dayNumberOf(date);
    if (UI.fixing === date) UI.fixing = null;
    const ms = MILESTONES.find(m => m[0] === n);
    if (ms && !S.milestonesSeen.includes(n)) {
      S.milestonesSeen.push(n);
      save();
      UI.sheet = { type: 'milestone', n };
    } else if (n % 7 === 0 && n < 75 && !S.reflections.some(r => r.week === n / 7)) {
      UI.sheet = { type: 'reflect', week: n / 7 };
    }
    const tier = ms ? (n === 7 ? 1 : n === 30 ? 2 : 3) : 0;
    FX.sealDay(n, ms ? { milestone: ms[1], sub: ms[2], tier } : { tier }, () => evaluateAndRender());
    recordLifeLog();
    checkVictory();
    save();
    return;
  } else if (isCouple() && S.profile.coupleRule === 'together') {
    showToast(`Your side is done — waiting on ${S.profile.partnerName || 'your partner'}.`);
  }
  evaluateAndRender();
}

function evaluateAndRender() {
  recordLifeLog();
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
  const journal = e.target.closest('[data-journal]');
  if (journal) {
    const day = ensureDay(journal.dataset.journal);
    day.me.note = journal.value.slice(0, 2000);
    save();
    return;
  }
  const wEl = e.target.closest('[data-weight]');
  if (wEl) {
    const day = ensureDay(wEl.dataset.weight);
    const v = parseFloat(wEl.value);
    day.me.weight = v >= 50 && v <= 700 ? Math.round(v * 10) / 10 : null;
    save();
    return;
  }
  const rtime = e.target.closest('[data-rtime]');
  if (rtime) {
    if (/^\d{2}:\d{2}$/.test(rtime.value)) S.settings.reminders[rtime.dataset.rtime] = rtime.value;
    save();
    return;
  }
  const el = e.target.closest('[data-field]');
  if (!el) return;
  const f = el.dataset.field;
  if (f === 'name') S.profile.name = el.value.trim().slice(0, 30);
  if (f === 'partnerName') S.profile.partnerName = el.value.trim().slice(0, 30);
  if (f === 'dietName') S.profile.dietName = el.value.trim().slice(0, 30);
  if (f === 'why') S.profile.why = el.value.trim().slice(0, 140);
  if (f === 'bannedWords') S.settings.bannedWords = el.value.trim().slice(0, 200);
  if (f === 'fridge') S.fridge = el.value.slice(0, 400);
  save();
});

document.addEventListener('input', e => {
  const el = e.target.closest('[data-nfield]');
  if (el && UI.nutriDraft) UI.nutriDraft[el.dataset.nfield] = el.value;
  if (e.target.id === 'foodSearch') {
    UI.foodQuery = e.target.value;
    updateFoodResults();
  }
});

/* Reminders — fire while the app is open or backgrounded in a tab. */
function checkReminders() {
  const r = S.settings.reminders;
  if (!r || !r.on || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (!S.onboarded || S.attempt.status !== 'active') return;
  const now = new Date();
  const hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (hhmm !== r.am && hhmm !== r.pm) return;
  const key = todayStr() + hhmm;
  if (UI.lastReminder === key) return;
  UI.lastReminder = key;
  const missing = activeTasks().filter(t => !taskDone(todayStr(), 'me', t));
  if (!missing.length) return;
  try {
    new Notification('SEVENTY-FIVE', {
      body: missing.length === 1
        ? `${missing[0].title} is still open — ${countdownText()}.`
        : `${missing.length} tasks still open — ${countdownText()}. ${missing[0].title} first?`,
      icon: './icons/icon-192.png',
      tag: 'seventyfive-reminder',
    });
  } catch { /* some platforms only allow notifications from a service worker */ }
}

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
  checkReminders();
  applyDaypart();
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

applyTheme();
applyDaypart();
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}
evaluateAndRender();
