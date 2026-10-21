// Звання, значки, підрахунок відсотків і нарахування нагород.
import { LEVELS_PER_TOPIC, TASKS_PER_LEVEL, ECONOMY, XP } from "./config.js";
import { TOPICS } from "../content/index.js";
import { today } from "./ui.js";

export const RANKS = [
  { xp: 0, title: "Новачок", icon: "🌱" },
  { xp: 150, title: "Писар", icon: "✒️" },
  { xp: 500, title: "Буквознавець", icon: "🔤" },
  { xp: 1200, title: "Словознавець", icon: "📗" },
  { xp: 2500, title: "Грамотій", icon: "🎓" },
  { xp: 4500, title: "Книжник", icon: "📚" },
  { xp: 7000, title: "Літописець", icon: "📜" },
  { xp: 10000, title: "Мовознавець", icon: "🔎" },
  { xp: 14000, title: "Хранитель Слова", icon: "🛡️" },
  { xp: 19000, title: "Майстер Мови", icon: "👑" },
];

export function rankOf(xp = 0) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  const toNext = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100;
  return { ...cur, level: i + 1, next, toNext };
}

export const BADGES = [
  { id: "first", icon: "🚀", title: "Перший крок", text: "Пройти перший рівень" },
  { id: "perfectLevel", icon: "🎯", title: "Влучно!", text: "10 з 10 на будь-якому рівні" },
  { id: "topic100", icon: "💯", title: "Сто зі ста", text: "Тема на 100 %" },
  { id: "topics5", icon: "🏅", title: "П’ять вершин", text: "5 тем на 100 %" },
  { id: "topics10", icon: "🏆", title: "Десять вершин", text: "10 тем на 100 %" },
  { id: "topicsAll", icon: "🌟", title: "Уся програма", text: "Усі теми на 100 %" },
  { id: "noHints", icon: "🧠", title: "Сам собі підказка", text: "Тема на 100 % без жодної підказки" },
  { id: "streak3", icon: "🔥", title: "Три дні поспіль", text: "Займатися 3 дні поспіль" },
  { id: "streak7", icon: "☄️", title: "Тиждень вогню", text: "Займатися 7 днів поспіль" },
  { id: "earlyBird", icon: "🐦", title: "Рання пташка", text: "Пройти рівень до 8:00" },
  { id: "careful", icon: "🐢", title: "Без поспіху", text: "Рівень без жодної занадто швидкої відповіді на 10 з 10" },
  { id: "review10", icon: "🔁", title: "Робота над помилками", text: "Виправити 10 своїх помилок" },
  { id: "monitoring", icon: "📋", title: "Моніторинг пройдено", text: "Моніторингова робота на 90 % і більше" },
  { id: "shopper", icon: "🛍️", title: "Перша обновка", text: "Купити першу річ для персонажа" },
  { id: "stylist", icon: "👗", title: "Стиліст", text: "Мати 15 речей" },
  { id: "explorer", icon: "🏫", title: "Дослідник школи", text: "Зайти в 3D-школу" },
];
export const badgeById = Object.fromEntries(BADGES.map((b) => [b.id, b]));

// Відсоток теми = сума найкращих результатів п’яти рівнів / 50
export function topicPct(p) {
  if (!p?.levels) return 0;
  let s = 0;
  for (let i = 1; i <= LEVELS_PER_TOPIC; i++) s += p.levels[i]?.best || 0;
  return Math.round((s / (LEVELS_PER_TOPIC * TASKS_PER_LEVEL)) * 100);
}

export function overall(progress = {}) {
  const ready = TOPICS.filter((t) => t.ready);
  const pcts = ready.map((t) => topicPct(progress[t.id]));
  const done = pcts.filter((p) => p === 100).length;
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  return { ready: ready.length, done, avg, pcts };
}

// Щоденна серія: повертає нову серію і бонус (якщо сьогодні перший раз)
export function streakUpdate(streak = {}) {
  const d = today();
  if (streak.last === d) return { streak, bonus: 0 };
  const y = today(Date.now() - 864e5);
  const count = streak.last === y ? (streak.count || 0) + 1 : 1;
  return { streak: { last: d, count, best: Math.max(count, streak.best || 0) }, bonus: ECONOMY.streakPerDay * Math.min(count, 7) };
}

// Які значки здобуто (повертає лише нові)
export function newBadges(user, progress, extra = {}) {
  const has = user.badges || {};
  const got = [];
  const give = (id, cond) => { if (cond && !has[id]) got.push(id); };
  const o = overall(progress);
  give("first", extra.levelDone);
  give("perfectLevel", extra.perfect);
  give("topic100", o.done >= 1);
  give("topics5", o.done >= 5);
  give("topics10", o.done >= 10);
  give("topicsAll", o.ready >= 30 && o.done === o.ready);
  give("noHints", extra.topicPerfectNoHints);
  give("streak3", (user.streak?.count || 0) >= 3);
  give("streak7", (user.streak?.count || 0) >= 7);
  give("earlyBird", extra.levelDone && new Date().getHours() < 8);
  give("careful", extra.careful);
  give("review10", (user.reviewFixed || 0) >= 10);
  give("monitoring", extra.monitoringPct >= 90);
  give("shopper", Object.keys(user.owned || {}).length >= 1);
  give("stylist", Object.keys(user.owned || {}).length >= 15);
  give("explorer", extra.explorer);
  return got;
}

export { ECONOMY, XP };
