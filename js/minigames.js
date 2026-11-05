// Міні-ігри в 3D-школі. Завдання беруться з тем сайту. За гру — монети (не більше DAY_CAP на день).
import { h, toast, shuffle } from "./ui.js";
import { state } from "./store.js";
import { db, ref, update } from "./fb.js";
import { TOPICS } from "../content/index.js";

const DAY_CAP = 40;
export const GAMES = {
  fish: { icon: "🎣", title: "Рибалка", hint: "Лови рибку з правильною буквою! Помилка — мінус 3 секунди.", sec: 60 },
  blitz: { icon: "⚡", title: "Бліц «Правда чи ні»", hint: "Правильне твердження чи ні? Клавіші ← і → теж працюють.", sec: 60 },
  gap: { icon: "🧩", title: "Вставка букви", hint: "Яка буква пропущена? Відповідай якомога швидше.", sec: 60 },
  anagram: { icon: "🔤", title: "Анаграми", hint: "Склади слово з розсипаних букв.", sec: 90 },
  typing: { icon: "💻", title: "Друкарик", hint: "Надрукуй слово без помилок — і далі!", sec: 60 },
  pairs: { icon: "🧠", title: "Знайди пари", hint: "Відкривай картки й шукай пари, що підходять одна до одної.", sec: 0 },
  hunt: { icon: "🔎", title: "Знайди букви" },
};

// ---------- Завдання з тем ----------
const strip = (s) => String(s ?? "").replace(/<[^>]+>/g, "").trim();
let poolP = null;
function loadPool() {
  return (poolP ??= (async () => {
    const ids = shuffle(TOPICS.filter((t) => t.ready).map((t) => t.id)).slice(0, 18);
    const P = { gap: [], tf: [], pairs: [], words: new Set() };
    await Promise.all(ids.map(async (id) => {
      const T = (await import(`../content/topics/${id}.js`)).default;
      for (const L of T.levels) for (const t of L.tasks) {
        if (t.type === "gap" && /_/.test(t.word) && !/[<>]/.test(t.word) && t.options?.length <= 4 && t.word.length <= 26) {
          P.gap.push({ word: t.word, options: t.options, answer: t.answer });
          const w = t.answer === "—" ? t.word.replace("_", "") : t.word.replace("_", t.answer);
          if (/^[а-щьюяєіїґ]{4,9}$/i.test(w)) P.words.add(w.toLowerCase());
        }
        if (t.type === "tf" && strip(t.q).length < 170) { const q = strip(t.q).replace(/^Правильно чи ні:\s*/i, ""); P.tf.push({ q: q.charAt(0).toUpperCase() + q.slice(1), answer: !!t.answer }); }
        if (t.type === "match" && t.pairs?.length >= 3 && t.pairs.every((p) => strip(p[0]).length < 26 && strip(p[1]).length < 34)) P.pairs.push(t.pairs.map((p) => [strip(p[0]), strip(p[1])]));
      }
    }));
    P.words = [...P.words];
    return P;
  })());
}
export const huntWord = async () => { const P = await loadPool(); const w = shuffle(P.words.filter((x) => x.length >= 4 && x.length <= 6)); return w[0] || "слово"; };

// ---------- Монети й рекорди ----------
const today = () => new Date().toISOString().slice(0, 10);
export async function reward(game, score) {
  const u = state.user; if (!u || !state.uid) return { gain: 0, best: score, left: 0 };
  const mini = u.mini || {};
  const got = mini.day === today() ? mini.got || 0 : 0;
  const gain = Math.max(0, Math.min(DAY_CAP - got, Math.floor(score / 2)));
  const best = Math.max(mini.best?.[game] || 0, score);
  const upd = { [`users/${state.uid}/mini/day`]: today(), [`users/${state.uid}/mini/got`]: got + gain, [`users/${state.uid}/mini/best/${game}`]: best };
  if (gain) upd[`users/${state.uid}/coins`] = (u.coins || 0) + gain;
  await update(ref(db), upd).catch(() => {});
  return { gain, best, left: DAY_CAP - got - gain, newBest: best === score && score > (mini.best?.[game] || 0) };
}

// ---------- Оболонка гри ----------
export function openGame(id) {
  const G = GAMES[id];
  document.body.classList.add("mg-open");
  const scoreEl = h("b.mg__score", "0"), timeEl = h("b.mg__time"), body = h("div.mg__body");
  const box = h("div.mg", h("div.mg__card",
    h("div.mg__head", h("span.mg__t", `${G.icon} ${G.title}`), h("span.mg__stat", "⭐ ", scoreEl), G.sec ? h("span.mg__stat", "⏱ ", timeEl) : null, h("button.btn.btn--small", { onclick: () => close() }, "✕")),
    body));
  document.body.append(box);
  let timer = null, done = false, score = 0, left = G.sec, keyFn = null;
  const close = () => { clearInterval(timer); if (keyFn) removeEventListener("keydown", keyFn); box.remove(); document.body.classList.remove("mg-open"); };
  const ctx = {
    body,
    add(n = 1) { score += n; scoreEl.textContent = score; scoreEl.classList.remove("pop"); void scoreEl.offsetWidth; scoreEl.classList.add("pop"); },
    penalty(s = 3) { left = Math.max(0, left - s); timeEl.textContent = left; box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); },
    onKey(f) { keyFn = f; addEventListener("keydown", f); },
    finish: () => finish(),
  };
  async function finish() {
    if (done) return; done = true; clearInterval(timer); if (keyFn) removeEventListener("keydown", keyFn);
    body.replaceChildren(h("p.note.center", "Рахуємо…"));
    const r = await reward(id, score);
    body.replaceChildren(h("div.mg__end",
      h("div.mg__big", score >= 20 ? "🏆" : score >= 10 ? "🎉" : "👍"),
      h("h2", `Рахунок: ${score}`),
      h("p", r.newBest ? "🔥 Новий рекорд!" : `Твій рекорд: ${r.best}`),
      h("p", r.gain ? `+${r.gain} 🪙` : r.left <= 0 ? "Монети за ігри на сьогодні вже зібрано — грай для рекорду!" : "Набери більше, щоб отримати монети"),
      h("div.row.gap.center", h("button.btn.btn--primary", { onclick: () => { close(); openGame(id); } }, "Ще раз"), h("button.btn", { onclick: close }, "Вийти"))));
  }
  body.replaceChildren(h("div.mg__intro", h("div.mg__big", G.icon), h("p", G.hint), h("button.btn.btn--primary", { onclick: start }, "Почати")));
  async function start() {
    body.replaceChildren(h("p.note.center", "Готуємо завдання…"));
    const P = await loadPool();
    if (G.sec) { timeEl.textContent = left; timer = setInterval(() => { left--; timeEl.textContent = left; if (left <= 0) finish(); }, 1000); }
    ({ fish: fishGame, blitz: blitzGame, gap: gapGame, anagram: anagramGame, typing: typingGame, pairs: pairsGame })[id](ctx, P);
  }
  return close;
}

// 🎣 Рибалка: варіанти пливуть рибками, клацни правильну
function fishGame(ctx, P) {
  const tasks = shuffle([...P.gap]); let i = 0;
  const q = h("div.mg__q"), pond = h("div.mg__pond");
  ctx.body.replaceChildren(q, pond);
  function next() {
    const t = tasks[i++ % tasks.length];
    q.replaceChildren("Злови букву: ", h("b", t.word.replace(/_/g, "…")));
    pond.replaceChildren(...shuffle([...t.options]).map((o, k) => {
      const f = h("button.mg__fish", { style: { top: 12 + k * (70 / t.options.length) + "%", animationDuration: 5 + Math.random() * 3 + "s", animationDelay: -Math.random() * 4 + "s" }, onclick: () => {
        if (o === t.answer) { ctx.add(); f.classList.add("ok"); setTimeout(next, 250); } else { ctx.penalty(); f.classList.add("bad"); }
      } }, h("span", "🐟"), h("b", o));
      return f;
    }));
  }
  next();
}
// ⚡ Бліц
function blitzGame(ctx, P) {
  const tasks = shuffle([...P.tf]); let i = 0, cur;
  const q = h("div.mg__q.mg__q--big");
  const ans = (v) => { if (v === cur.answer) { ctx.add(); flash("ok"); } else { ctx.penalty(); flash("bad"); } next(); };
  const flash = (c) => { q.classList.remove("ok", "bad"); void q.offsetWidth; q.classList.add(c); };
  ctx.body.replaceChildren(q, h("div.mg__yn", h("button.btn.mg__yes", { onclick: () => ans(true) }, "✅ Правильно"), h("button.btn.mg__no", { onclick: () => ans(false) }, "❌ Неправильно")));
  ctx.onKey((e) => { if (e.key === "ArrowLeft") ans(true); if (e.key === "ArrowRight") ans(false); });
  const next = () => { cur = tasks[i++ % tasks.length]; q.textContent = cur.q; };
  next();
}
// 🧩 Вставка букви
function gapGame(ctx, P) {
  const tasks = shuffle([...P.gap]); let i = 0;
  const q = h("div.mg__q.mg__q--big"), opts = h("div.mg__opts");
  ctx.body.replaceChildren(q, opts);
  function next() {
    const t = tasks[i++ % tasks.length];
    q.textContent = t.word.replace(/_/g, "…");
    opts.replaceChildren(...t.options.map((o) => h("button.btn.mg__opt", { onclick: (e) => { if (o === t.answer) { ctx.add(); next(); } else { ctx.penalty(); e.target.disabled = true; } } }, o)));
  }
  next();
}
// 🔤 Анаграми
function anagramGame(ctx, P) {
  const words = shuffle([...P.words]); let i = 0, w = "", mix = [], picked = [];
  const tiles = h("div.mg__tiles"), slot = h("div.mg__slot");
  ctx.body.replaceChildren(h("p.note.center", "Натискай букви по черзі. Помилився — натисни букву вгорі, щоб повернути."), slot, tiles,
    h("div.row.gap.center", h("button.btn.btn--small", { onclick: () => next() }, "Пропустити →")));
  function draw() {
    slot.replaceChildren(...[...w].map((_, k) => h(`button.mg__cell${picked[k] != null ? ".on" : ""}`, { onclick: () => { if (picked[k] != null) { picked.splice(k, 1); draw(); } } }, picked[k] != null ? mix[picked[k]].toUpperCase() : "")));
    tiles.replaceChildren(...mix.map((ch, idx) => h("button.mg__tile", { disabled: picked.includes(idx), onclick: () => { picked.push(idx); draw(); check(); } }, ch.toUpperCase())));
  }
  function check() {
    if (picked.length < w.length) return;
    if (picked.map((k) => mix[k]).join("") === w) { ctx.add(2); slot.classList.add("ok"); setTimeout(next, 450); }
    else { slot.classList.add("bad"); setTimeout(() => { slot.classList.remove("bad"); picked = []; draw(); }, 450); }
  }
  function next() {
    slot.classList.remove("ok");
    w = words[i++ % words.length];
    let k = 0; do mix = shuffle(w.split("")); while (mix.join("") === w && k++ < 20);
    picked = []; draw();
  }
  next();
}
// 💻 Друкарик
function typingGame(ctx, P) {
  const words = shuffle([...P.words]); let i = 0;
  const q = h("div.mg__q.mg__q--big"), inp = h("input.input.mg__type", { autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Друкуй тут…" });
  ctx.body.replaceChildren(q, inp, h("p.note.center", "Апостроф: ’ або '"));
  let w;
  const next = () => { w = words[i++ % words.length]; q.textContent = w; inp.value = ""; inp.classList.remove("bad"); };
  inp.addEventListener("input", () => {
    const v = inp.value.toLowerCase().replace(/'/g, "’").trim();
    if (v === w) { ctx.add(); next(); } else inp.classList.toggle("bad", !w.startsWith(v));
  });
  next(); setTimeout(() => inp.focus(), 50);
}
// 🧠 Пари
function pairsGame(ctx, P) {
  // 6 пар без повторів ліворуч і праворуч (щоб пара була одна-єдина)
  const set = [], L = new Set(), R = new Set();
  for (const task of shuffle([...P.pairs])) for (const [a, b] of shuffle([...task])) {
    if (set.length >= 6 || L.has(a) || R.has(b) || L.has(b) || R.has(a)) continue;
    set.push([a, b]); L.add(a); R.add(b);
  }
  const cards = shuffle(set.flatMap(([a, b], k) => [{ t: a, k }, { t: b, k }]));
  let open = [], found = 0, moves = 0, lock = false;
  const grid = h("div.mg__cards", cards.map((c) => {
    const el = h("button.mg__mem", { onclick: () => {
      if (lock || el.classList.contains("up")) return;
      el.classList.add("up"); open.push([c, el]);
      if (open.length < 2) return;
      moves++; lock = true;
      const [[a, ea], [b, eb]] = open; open = [];
      if (a.k === b.k) { ea.classList.add("ok"); eb.classList.add("ok"); found++; ctx.add(Math.max(1, 4 - Math.floor(moves / 6))); lock = false; if (found === set.length) setTimeout(ctx.finish, 500); }
      else setTimeout(() => { ea.classList.remove("up"); eb.classList.remove("up"); lock = false; }, 800);
    } }, h("span.mg__back", "?"), h("span.mg__face", c.t));
    return el;
  }));
  ctx.body.replaceChildren(h("p.note.center", "Знайди пари: слово і те, що до нього підходить."), grid);
}
