// Стан учня в пам’яті + збереження результатів у Firebase.
import { db, r, ref, update, onValue, off, read, push } from "./fb.js";
import { ECONOMY, XP, LEVELS_PER_TOPIC } from "./config.js";
import { topicPct, newBadges, streakUpdate, badgeById } from "./game.js";
import { topicById } from "../content/index.js";
import { toast } from "./ui.js";

export const state = { uid: null, user: null, progress: {}, settings: {}, mistakes: {}, teacher: false };
const subs = [];
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(state));

export function bindStudent(uid) {
  unbind();
  state.uid = uid;
  const watch = (path, key, dflt) => {
    const rf = r(path);
    onValue(rf, (s) => { state[key] = s.val() ?? dflt; emit(); });
    subs.push(rf);
  };
  watch(`users/${uid}`, "user", null);
  watch(`progress/${uid}`, "progress", {});
  watch(`mistakes/${uid}`, "mistakes", {});
  watch(`settings`, "settings", {});
  return new Promise((res) => {
    const stop = onChange((s) => { if (s.user) { stop(); res(); } });
  });
}
export function bindSettingsOnly() {
  const rf = r("settings");
  onValue(rf, (s) => { state.settings = s.val() || {}; emit(); });
  subs.push(rf);
}
export function unbind() {
  subs.splice(0).forEach((rf) => off(rf));
  Object.assign(state, { uid: null, user: null, progress: {}, mistakes: {}, teacher: false });
}

export const isSolved = (topic, id) => !!state.progress?.[topic]?.solved?.[id];
export const isSeen = (topic, id) => !!state.progress?.[topic]?.seen?.[id];
export const coins = () => state.user?.coins || 0;

// Монети за одну правильну відповідь (рахується під час проходження)
export function coinsFor(topic, id, { fast, review }) {
  if (fast) return 0;
  if (review) return ECONOMY.reviewSolve;
  if (isSolved(topic, id)) return ECONOMY.repeatSolve;
  return isSeen(topic, id) ? ECONOMY.solve : ECONOMY.firstSolve;
}

// Купівля підказки: списуємо одразу, щоб не можна було «передумати»
export async function buyHint() {
  const c = coins();
  if (c < ECONOMY.hintPrice) return false;
  await update(ref(db), { [`users/${state.uid}/coins`]: c - ECONOMY.hintPrice, [`users/${state.uid}/hintsBought`]: (state.user.hintsBought || 0) + 1 });
  return true;
}

// У ключах бази не можна мати крапку, а id речей мають вигляд «top.tee-lime»
export const ownKey = (id) => id.replace(/\./g, "_");
export const owns = (id) => !!state.user?.owned?.[ownKey(id)];

// Разове виправлення: до 22.10 покупки не проходили, а приміряне можна було зберегти без оплати.
// Платні речі на персонажі «доплачуємо», поки вистачає монет (від дешевших); решту знімаємо.
export async function settleAvatar(itemById, isFree, fullAvatar) {
  const u = state.user;
  if (!u || u.shopFixed) return null;
  const av = fullAvatar(u.avatar), clean = fullAvatar({});
  const unpaid = Object.entries(av).map(([cat, id]) => [cat, itemById[id]])
    .filter(([, it]) => it && !isFree(it) && !owns(it.id)).sort((a, b) => a[1].price - b[1].price);
  let c = u.coins || 0, paid = 0;
  const upd = { [`users/${state.uid}/shopFixed`]: Date.now() }, kept = [], removed = [];
  for (const [cat, it] of unpaid) {
    if (c >= it.price) { c -= it.price; paid += it.price; upd[`users/${state.uid}/owned/${ownKey(it.id)}`] = Date.now(); kept.push(it.name); }
    else { av[cat] = clean[cat]; removed.push(it.name); }
  }
  if (unpaid.length) {
    upd[`users/${state.uid}/coins`] = c;
    upd[`users/${state.uid}/avatar`] = av; upd[`public/${state.uid}/avatar`] = av;
  }
  await update(ref(db), upd);
  return unpaid.length ? { paid, kept, removed } : null;
}

export async function buyItem(item) {
  const c = coins();
  if (c < item.price || owns(item.id)) return false;
  const upd = { [`users/${state.uid}/coins`]: c - item.price, [`users/${state.uid}/owned/${ownKey(item.id)}`]: Date.now() };
  await update(ref(db), upd);
  await awardBadges({});
  return true;
}

export async function saveAvatar(avatar) {
  await update(ref(db), { [`users/${state.uid}/avatar`]: avatar, [`public/${state.uid}/avatar`]: avatar });
}

export async function awardBadges(extra) {
  const u = state.user;
  const got = newBadges(u, state.progress, extra);
  if (!got.length) return [];
  const upd = {};
  got.forEach((b) => (upd[`users/${state.uid}/badges/${b}`] = Date.now()));
  const xp = (u.xp || 0) + got.length * XP.badge;
  upd[`users/${state.uid}/xp`] = xp;
  upd[`public/${state.uid}/xp`] = xp;
  upd[`public/${state.uid}/badges`] = Object.keys(u.badges || {}).length + got.length;
  await update(ref(db), upd);
  got.forEach((b, i) => setTimeout(() => toast(`${badgeById[b].icon} Новий значок: «${badgeById[b].title}»! +${XP.badge} досвіду`, "win", 4000), 600 * i));
  return got;
}

// Зберігає результат проходження (рівень, робота над помилками, моніторингова)
// s: { type, topic, level, start, answers:[{id, topic, q, ok, sec, fast, hint, coins}], monitoringId }
export async function saveSession(s) {
  const uid = state.uid, u = state.user;
  const end = Date.now();
  const correct = s.answers.filter((a) => a.ok).length;
  const total = s.answers.length;
  const fast = s.answers.filter((a) => a.fast).length;
  const hints = s.answers.filter((a) => a.hint).length;
  const leaves = s.answers.reduce((n, a) => n + (a.leaves || 0), 0);
  const awaySec = s.answers.reduce((n, a) => n + (a.away || 0), 0);
  let coinsGain = s.answers.reduce((a, b) => a + (b.coins || 0), 0);
  let xpGain = 0;
  const upd = {};
  const extra = { levelDone: s.type === "level" };
  const topicsTouched = new Set();

  // Прогрес по завданнях
  for (const a of s.answers) {
    const base = `progress/${uid}/${a.topic}`;
    topicsTouched.add(a.topic);
    upd[`${base}/seen/${a.id}`] = true;
    if (a.ok && !a.fast && !isSolved(a.topic, a.id)) {
      upd[`${base}/solved/${a.id}`] = true;
      xpGain += XP.solve;
    }
    if (a.hint) upd[`${base}/hintsUsed`] = (state.progress?.[a.topic]?.hintsUsed || 0) + 1;
    // Робота над помилками: помилка → повторити через день; виправлено → ще раз через тиждень → готово
    const mk = `${a.topic}~${a.id}`;
    const m = state.mistakes?.[mk];
    if (!a.ok) upd[`mistakes/${uid}/${mk}`] = { topic: a.topic, id: a.id, box: 0, due: end + 864e5, q: a.q };
    else if (m && s.type === "review") {
      if (m.box >= 1) { upd[`mistakes/${uid}/${mk}`] = null; upd[`users/${uid}/reviewFixed`] = (u.reviewFixed || 0) + 1; }
      else upd[`mistakes/${uid}/${mk}`] = { ...m, box: 1, due: end + 7 * 864e5 };
    }
  }

  // Рівень теми: найкращий результат
  let attemptNo = 1;
  let topicNowPerfect = false;
  if (s.type === "level") {
    const p = state.progress?.[s.topic] || {};
    const L = p.levels?.[s.level] || {};
    attemptNo = (L.attempts || 0) + 1;
    const okNoFast = s.answers.filter((a) => a.ok && !a.fast).length;
    // Прогрес рахує всі правильні відповіді; за поспіх лише не дають монет і досвіду
    const best = Math.max(L.best || 0, correct);
    upd[`progress/${uid}/${s.topic}/levels/${s.level}`] = { best, attempts: attemptNo, last: correct, lastAt: end };
    if (okNoFast === total) { coinsGain += ECONOMY.levelPerfect; extra.perfect = true; if (!fast) extra.careful = true; }
    // Чи стала тема 100 % саме зараз
    const levels = { ...(p.levels || {}), [s.level]: { best } };
    const pctNow = topicPct({ levels });
    if (pctNow === 100 && !p.perfectAwarded) {
      topicNowPerfect = true;
      coinsGain += ECONOMY.topicPerfect;
      upd[`progress/${uid}/${s.topic}/perfectAwarded`] = end;
      if (!(p.hintsUsed || hints)) extra.topicPerfectNoHints = true;
    }
    upd[`progress/${uid}/${s.topic}/pct`] = pctNow;
  } else {
    const prevKey = s.type === "monitoring" ? `monitoring/${s.monitoringId}` : s.type;
    attemptNo = ((u.counters?.[prevKey.replace("/", "_")]) || 0) + 1;
    upd[`users/${uid}/counters/${prevKey.replace("/", "_")}`] = attemptNo;
    if (s.type === "monitoring") {
      extra.monitoringPct = Math.round((correct / total) * 100);
      if (correct === total) xpGain += XP.monitoringPerfect;
    }
  }

  // Щоденна серія
  const st = streakUpdate(u.streak);
  if (st.bonus) { coinsGain += st.bonus; upd[`users/${uid}/streak`] = st.streak; }

  const xp = (u.xp || 0) + xpGain;
  upd[`users/${uid}/coins`] = (u.coins || 0) + coinsGain;
  upd[`users/${uid}/xp`] = xp;
  upd[`users/${uid}/lastSeen`] = end;
  upd[`public/${uid}/xp`] = xp;

  const durSec = Math.round((end - s.start) / 1000);
  const avgSec = total ? Math.round((s.answers.reduce((a, b) => a + b.sec, 0) / total) * 10) / 10 : 0;
  const attempt = {
    type: s.type, topic: s.topic || null, topicTitle: s.type === "monitoring" ? s.title : s.topic ? topicById[s.topic]?.title : s.title,
    level: s.level || null, monitoringId: s.monitoringId || null,
    name: u.name, cls: u.cls, start: s.start, end, durSec, avgSec,
    correct, total, pct: Math.round((correct / total) * 100),
    fast, flagged: fast >= 3 || fast / total >= 0.3, hints, leaves, awaySec, coins: coinsGain, xp: xpGain, attemptNo,
    answers: s.answers.map((a) => ({ id: a.id, topic: a.topic, q: a.q, ok: a.ok, sec: a.sec, fast: !!a.fast, hint: !!a.hint, given: a.given ?? null, ...(a.leaves ? { leaves: a.leaves, away: a.away || 0 } : {}) })),
  };
  const key = push(r(`attempts/${uid}`)).key;
  upd[`attempts/${uid}/${key}`] = attempt;
  await update(ref(db), upd);

  // Почекати, доки локальний стан оновиться, і видати значки
  await new Promise((res) => setTimeout(res, 150));
  const got = await awardBadges(extra);
  return { ...attempt, streakBonus: st.bonus, streak: st.streak?.count || u.streak?.count || 0, topicNowPerfect, badges: got };
}

export async function loadAttempts(uid = state.uid) {
  return (await read(`attempts/${uid}`)) || {};
}

export { LEVELS_PER_TOPIC };
