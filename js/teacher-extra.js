// Кабінет учителя: перегляд будь-якого завдання і живі питання учням.
import { h, toast, fmtTime, fmtDate, confirmBox, num } from "./ui.js";
import { r, push, update, remove, onValue } from "./fb.js";
import { renderTask, kindLabel } from "./quiz.js";
import { topicById, shortTitle } from "../content/index.js";
import { monWorks, monWork } from "../content/monitoring/index.js";

// Виходи зі сторінки під час спроби
export const awayFmt = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)} хв ${sec % 60} с` : `${sec || 0} с`);
export const awayDetail = (a) => (a.answers || []).map((x, k) => (x.leaves ? `№${k + 1}: ${x.leaves}× · ${awayFmt(x.away || 0)}${x.ok ? " · правильно" : " · помилка"}` : null)).filter(Boolean).join("\n");

// ---------- 📖 Перегляд завдань ----------
const pv = { topic: null, i: 0 };
const topicCache = {};
// Тема разом із моніторинговою роботою (як шостий «рівень» для перегляду)
const loadTopic = async (id) => (topicCache[id] ??= await (async () => {
  const T = (await import(`../content/topics/${id}.js`)).default;
  const extra = [];
  for (const w of monWorks(id)) extra.push({ title: `📋 Моніторингова${w.n > 1 ? ` · варіант ${w.n}` : ""}`, tasks: (await import(`../content/monitoring/${w.id}.js`)).default.tasks, mon: w.n });
  return { ...T, levels: [...T.levels, ...extra] };
})());

export function previewView({ ready }) {
  const rt = ready();
  if (!pv.topic || !topicById[pv.topic]) pv.topic = rt[0]?.id;
  const grid = h("div.pv__grid"), card = h("div.pv__card.card");
  const sel = h("select.select", { onchange: (e) => { pv.topic = e.target.value; pv.i = 0; draw(); } }, rt.map((t, k) => h("option", { value: t.id, selected: t.id === pv.topic }, `${k + 1}. ${shortTitle(t)}`)));
  const ti = () => rt.findIndex((t) => t.id === pv.topic);
  // Перехід на іншу тему: на її перше (end=false) або останнє (end=true) завдання
  const goTopic = (k, end = false) => { pv.topic = rt[k].id; pv.i = end ? 1e9 : 0; sel.value = pv.topic; draw(); };
  const found = h("div.pv__found");
  const q = h("input.input", { type: "search", placeholder: "🔍 Пошук у всіх темах: слово з завдання або код (напр. m306)", oninput: () => search(q.value) });
  let sq = 0;
  async function search(text) {
    const s = text.trim().toLowerCase(), my = ++sq;
    if (s.length < 2) return found.replaceChildren();
    found.replaceChildren(h("p.note", "Шукаю…"));
    const res = [];
    for (const t of rt) {
      const T = await loadTopic(t.id);
      if (my !== sq) return;
      let n = 0;
      for (const L of T.levels) for (const x of L.tasks) {
        const txt = (x.id + " " + (x.q || "") + " " + JSON.stringify(x.items || x.options || x.pairs || x.text || "")).replace(/<[^>]+>/g, "").toLowerCase();
        if (x.id.toLowerCase() === s || txt.includes(s)) res.push({ topic: t.id, i: n, id: x.id, q: (x.q || "").replace(/<[^>]+>/g, "").slice(0, 90), mon: L.mon });
        n++;
      }
    }
    res.sort((a, b) => (b.id.toLowerCase() === s) - (a.id.toLowerCase() === s));
    found.replaceChildren(res.length ? h("div.pv__res", h("p.note", `Знайдено: ${res.length}${res.length > 40 ? " (показано 40)" : ""}`),
      res.slice(0, 40).map((x) => h("button.pv__hit", { onclick: () => { pv.topic = x.topic; pv.i = x.i; sel.value = x.topic; q.value = ""; found.replaceChildren(); draw(); card.scrollIntoView({ block: "start" }); } },
        h("b", shortTitle(topicById[x.topic])), h("span.note", ` · №${x.i + 1}${x.mon ? " · моніторингова" : ""} · ${x.id}`), h("div", x.q || "…")))) : h("p.note", "Нічого не знайдено."));
  }

  async function draw() {
    card.replaceChildren(h("p.note", "Завантаження…"));
    const T = await loadTopic(pv.topic);
    const tasks = T.levels.flatMap((L, li) => L.tasks.map((t) => ({ ...t, topic: T.id, lv: li + 1, lvTitle: L.title })));
    pv.i = Math.max(0, Math.min(pv.i, tasks.length - 1));
    grid.replaceChildren(...T.levels.map((L, li) => h("div.pv__row",
      h("span.pv__lv", L.mon ? (L.mon > 1 ? `Моніторингова · варіант ${L.mon}` : "Моніторингова") : `Рівень ${li + 1}`, h("small", L.mon ? `${L.tasks.length} завдань` : L.title)),
      h("div.pv__nums", L.tasks.map((_, k) => { const n = T.levels.slice(0, li).reduce((s, x) => s + x.tasks.length, 0) + k; return h(`button.pv__n${n === pv.i ? ".on" : ""}`, { onclick: () => { pv.i = n; draw(); } }, n + 1); })))));
    const t = tasks[pv.i];
    const view = renderTask(t);
    const out = h("div");
    let done = false;
    const finish = (show) => {
      if (done) return; done = true;
      const ok = show ? null : view.check();
      view.reveal(show ? false : ok);
      out.replaceChildren(h(`div.verdict.verdict--${show || ok ? "ok" : "bad"}`,
        h("div.verdict__top", h("b", show ? "Правильна відповідь" : ok ? "Правильно" : "Помилка")),
        h("div.explain", { html: t.explain }),
        T.rules?.[t.rule] && h("p.note", "Правило: ", h("b", T.rules[t.rule].title))));
    };
    view.setOnPick?.(() => setTimeout(() => finish(false), 150));
    card.replaceChildren(
      h("div.pv__meta", h("span.note", `${shortTitle(topicById[T.id])} · ${T.levels[t.lv - 1].mon ? `моніторингова робота${T.levels[t.lv - 1].mon > 1 ? `, варіант ${T.levels[t.lv - 1].mon}` : ""}` : `рівень ${t.lv} «${t.lvTitle}»`} · завдання ${pv.i + 1} з ${tasks.length} · ${t.id}`)),
      h("div.task__kind", kindLabel(t)), t.q && h("h2.task__q", { html: t.q }), view.el,
      h("div.task__actions",
        view.autoSubmit ? null : h("button.btn.btn--primary", { onclick: () => (view.ready() ? finish(false) : toast("Спершу дай відповідь або натисни «Показати відповідь»", "info")) }, "Перевірити"),
        h("button.btn", { onclick: () => finish(true) }, "👁 Показати відповідь")),
      out,
      h("div.row.gap.pv__nav",
        pv.i > 0 ? h("button.btn", { onclick: () => { pv.i--; draw(); } }, "← Попереднє")
          : h("button.btn", { disabled: ti() === 0, onclick: () => goTopic(ti() - 1, true) }, "← Попередня тема"),
        pv.i < tasks.length - 1 ? h("button.btn", { onclick: () => { pv.i++; draw(); } }, "Наступне →")
          : h("button.btn", { disabled: ti() === rt.length - 1, onclick: () => goTopic(ti() + 1) }, "Наступна тема →")));
  }
  draw();
  return [h("div.filters.card.pv__top",
      h("div.row.gap", h("button.btn.btn--small", { title: "Попередня тема", onclick: () => ti() > 0 && goTopic(ti() - 1) }, "◀"), sel, h("button.btn.btn--small", { title: "Наступна тема", onclick: () => ti() < rt.length - 1 && goTopic(ti() + 1) }, "▶")),
      q, found, h("span.note", "Обери тему або знайди завдання пошуком, далі натисни номер. Тут нічого не зараховується.")),
    h("section.card", grid), card];
}

// ---------- 🎤 Живі питання ----------
const live = { data: {}, online: {}, started: false, refresh: null, sel: new Set(), topic: null };
const oralCache = {};
const loadOral = async (id) => { try { return (oralCache[id] ??= (await import(`../content/oral/${id}.js`)).default); } catch { return null; } };

export function startTeacherLive() {
  if (live.started) return;
  live.started = true;
  onValue(r("live"), (s) => { live.data = s.val() || {}; live.refresh?.(); });
  onValue(r("online"), (s) => { live.online = s.val() || {}; live.refresh?.(); });
}

const PAGES = { "головна": "на головній", topic: "читає тему", level: "виконує завдання", review: "робота над помилками", monitoring: "моніторингова", shop: "у магазині", school: "у 3D-школі", profile: "у профілі", results: "дивиться результати" };
const isOnline = (uid) => live.online[uid] && Date.now() - (live.online[uid].at || 0) < 6 * 3600e3;

export function liveView({ students, ready }) {
  const st = students();
  const rt = ready();
  if (!live.topic) live.topic = rt[0]?.id;
  const who = h("div.lv__who"), lib = h("div.lv__lib"), feed = h("div.lv__feed");
  const custom = h("textarea.input", { rows: 2, maxlength: 300, placeholder: "Своє питання, напр.: Поясни, чому в слові «м’ята» пишемо апостроф." });

  async function send(q, topic = null, k = null) {
    if (!live.sel.size) return toast("Спершу обери учня (або кількох) зліва", "warn");
    const at = Date.now();
    await Promise.all([...live.sel].map((uid) => push(r(`live/${uid}`), { q, topic, k, at })));
    toast(`Надіслано: ${live.sel.size} учн.`, "win");
  }

  function drawWho() {
    const on = st.filter(([id]) => isOnline(id));
    who.replaceChildren(
      h("div.row.gap", h("b", `Онлайн: ${on.length} з ${st.length}`),
        h("button.btn.btn--small", { onclick: () => { on.forEach(([id]) => live.sel.add(id)); drawWho(); } }, "Обрати всіх онлайн"),
        h("button.btn.btn--small", { onclick: () => { live.sel.clear(); drawWho(); } }, "Зняти вибір")),
      ...st.map(([id, u]) => {
        const o = live.online[id];
        return h(`label.lv__st${live.sel.has(id) ? ".on" : ""}`,
          h("input", { type: "checkbox", checked: live.sel.has(id), onchange: (e) => { e.target.checked ? live.sel.add(id) : live.sel.delete(id); drawWho(); } }),
          h(`span.lv__dot${isOnline(id) ? ".on" : ""}`), h("b", u.name), h("span.note", ` ${u.cls}`),
          h("span.note.lv__page", isOnline(id) ? (PAGES[o.page] || o.page) + (o.away ? " · 🙈 не на сторінці" : "") : "не в мережі"));
      }));
  }

  async function drawLib() {
    const sel = h("select.select", { onchange: (e) => { live.topic = e.target.value; drawLib(); } }, rt.map((t) => h("option", { value: t.id, selected: t.id === live.topic }, shortTitle(t))));
    lib.replaceChildren(sel, h("p.note", "Завантаження…"));
    const qs = await loadOral(live.topic);
    lib.replaceChildren(sel, ...(qs ? qs.map((x, k) => h("div.lv__q",
      h("div", h("b", x.q), h("details", h("summary.note", "Ключ відповіді"), h("p.note", x.a))),
      h("button.btn.btn--primary.btn--small", { onclick: () => send(x.q, live.topic, k) }, "Надіслати"))) : [h("p.note", "Для цієї теми бібліотеки ще немає — напиши своє питання нижче.")]),
      h("div.lv__custom", custom, h("button.btn.btn--primary", { onclick: async () => { const q = custom.value.trim(); if (q.length < 5) return toast("Напиши питання", "info"); await send(q); custom.value = ""; } }, "Надіслати своє питання")));
  }

  async function drawFeed() {
    const names = Object.fromEntries(st);
    const items = [];
    for (const [uid, qs] of Object.entries(live.data)) if (names[uid]) for (const [id, x] of Object.entries(qs)) items.push({ uid, id, ...x });
    items.sort((a, b) => b.at - a.at);
    const keyOf = (x) => (x.topic && x.k != null ? oralCache[x.topic]?.[x.k]?.a : null);
    await Promise.all([...new Set(items.map((x) => x.topic).filter(Boolean))].map(loadOral));
    feed.replaceChildren(items.length ? h("div.tablewrap", h("table.tbl",
      h("thead", h("tr", ["Час", "Учень", "Питання", "Відповідь", "Оцінка", ""].map((c) => h("th", c)))),
      h("tbody", items.slice(0, 80).map((x) => h("tr",
        h("td.note", `${fmtDate(x.at)} ${fmtTime(x.at)}`), h("td", h("b", names[x.uid].name)),
        h("td", x.q, keyOf(x) && h("details", h("summary.note", "Ключ"), h("p.note", keyOf(x)))),
        h("td", !x.ans ? h("span.note", "⏳ чекаємо…") : x.ans.oral ? h("b", "🗣️ відповідатиме усно") : h("span.lv__ans", "✍️ ", x.ans.text)),
        h("td.lv__mark", x.ans ? [
          h(`button.btn.btn--small${x.mark === 1 ? ".btn--primary" : ""}`, { onclick: () => update(r(`live/${x.uid}/${x.id}`), { mark: 1 }) }, "✓"),
          h(`button.btn.btn--small${x.mark === 0 ? ".lv__bad" : ""}`, { onclick: () => update(r(`live/${x.uid}/${x.id}`), { mark: 0 }) }, "✗")] : null),
        h("td", h("button.btn.btn--small", { title: "Прибрати", onclick: async () => { if (await confirmBox("Прибрати це питання? Якщо учень ще не відповів, вікно в нього зникне.", "Прибрати")) remove(r(`live/${x.uid}/${x.id}`)); } }, "🗑")))))))
      : h("p.note", "Ще не надіслано жодного питання."));
  }

  live.refresh = () => { if (who.isConnected) { drawWho(); drawFeed(); } };
  drawWho(); drawLib(); drawFeed();
  return [
    h("div.lv",
      h("section.card", h("h2", "1. Кому"), h("p.note", "🟢 — учень зараз на сайті. Питання з’явиться на його екрані поверх будь-якої сторінки."), who),
      h("section.card", h("h2", "2. Питання за теорією"), lib)),
    h("section.card", h("h2", "3. Відповіді учнів"), h("p.note", "Оновлюється сама. ✓ — зараховано, ✗ — подумати ще; учень одразу бачить оцінку."), feed),
  ];
}

// ---------- 📋 Статистика моніторингових робіт ----------
let monSel = null;
const heatC = (v) => (v == null ? "" : `hsl(${Math.round(v * 1.1)}, 70%, ${88 - v * 0.25}%)`);
const short = (t = "") => t.replace(/^Моніторингова робота:\s*/, "");

export function monitoringView({ students, data, openStudent, redraw }) {
  const st = students();
  const ids = new Set(st.map(([id]) => id));
  const at = data.attempts.filter((a) => a.type === "monitoring" && ids.has(a.uid));
  const works = {};
  for (const a of at) {
    const w = (works[a.monitoringId] ||= { id: a.monitoringId, title: short(a.topicTitle), list: [], by: {} });
    w.list.push(a);
    const s = (w.by[a.uid] ||= { best: 0, n: 0, last: null, sec: 0, fast: 0, leaves: 0, awaySec: 0 });
    s.best = Math.max(s.best, a.pct); s.n++; s.sec += a.avgSec || 0; s.fast += a.flagged ? 1 : 0; s.leaves += a.leaves || 0; s.awaySec += a.awaySec || 0;
    if (!s.last || a.end > s.last.end) s.last = a;
  }
  // відкриті, але ще не написані
  for (const [mid, m] of Object.entries(data.settings.monitoring || {})) {
    if (!m?.open || works[mid]) continue;
    const mw = mid.startsWith("t_") ? monWork(mid.slice(2)) : null;
    const t = mw ? topicById[mw.topic] : null;
    works[mid] = { id: mid, title: t ? shortTitle(t) + (mw.n > 1 ? ` · варіант ${mw.n}` : "") : mid === "diag" ? "Вхідна діагностика" : mid, list: [], by: {} };
  }
  const W = Object.values(works).map((w) => {
    const bests = Object.values(w.by).map((s) => s.best);
    return { ...w, open: !!data.settings.monitoring?.[w.id]?.open, done: bests.length, avg: bests.length ? Math.round(bests.reduce((x, y) => x + y, 0) / bests.length) : null, lastAt: Math.max(0, ...w.list.map((a) => a.end)) };
  }).sort((a, b) => b.lastAt - a.lastAt || a.title.localeCompare(b.title, "uk"));
  if (!W.length) return h("section.card", h("h2", "📋 Моніторингові роботи"), h("p.note", "Ще немає відкритих або написаних робіт. Відкрий роботу в «⚙️ Налаштування» → «Моніторингові роботи»."));
  if (!monSel || !works[monSel]) monSel = W[0].id;
  const w = W.find((x) => x.id === monSel);

  // найважчі завдання вибраної роботи
  const agg = {};
  w.list.forEach((a) => (a.answers || []).forEach((x) => { const g = (agg[x.id] ||= { q: x.q, n: 0, ok: 0, sec: 0 }); g.n++; g.ok += x.ok ? 1 : 0; g.sec += Math.min(x.sec || 0, 180); }));
  const hard = Object.values(agg).sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n).slice(0, 10);
  const rows = st.map(([uid, u]) => ({ uid, u, s: w.by[uid] })).sort((a, b) => (b.s?.best ?? -1) - (a.s?.best ?? -1) || a.u.name.localeCompare(b.u.name, "uk"));
  const kpi = (ic, v, l) => h("div.kpi.card", h("span", ic), h("b", v), h("small", l));
  const pctCell = (v) => h("td.mono.center", { style: { background: heatC(v) } }, v == null ? "—" : v + "%");

  return [
    h("section.card", h("h2", "📋 Усі моніторингові роботи"),
      h("p.note", "Натисни на роботу, щоб побачити результати кожного учня й найважчі завдання. Відсоток — середнє з найкращих спроб учнів."),
      h("div.tablewrap", h("table.tbl.mon",
        h("thead", h("tr", ["Робота", "Статус", "Написали", "Середній %", "Спроб", "Остання спроба"].map((x) => h("th", x)))),
        h("tbody", W.map((x) => h(`tr.mon__row${x.id === monSel ? ".on" : ""}`, { onclick: () => { monSel = x.id; redraw(); } },
          h("td", h("b", x.title)), h("td", x.open ? h("span.tag.tag--on", "відкрита") : h("span.tag", "закрита")),
          h("td.mono.center", `${x.done}/${st.length}`), pctCell(x.avg), h("td.mono.center", x.list.length),
          h("td.note", x.lastAt ? `${fmtDate(x.lastAt)} ${fmtTime(x.lastAt)}` : "—"))))))),
    W.length > 1 ? h("section.card", h("h2", "Учень × робота (найкращий %)"),
      h("div.tablewrap", h("table.tbl.heat",
        h("thead", h("tr", h("th", "Учень"), W.map((x) => h("th.rot", h("span", x.title))))),
        h("tbody", st.map(([uid, u]) => h("tr", h("td", h("a", { href: "#/teacher", onclick: (e) => { e.preventDefault(); openStudent(uid); } }, u.name), h("span.note", ` ${u.cls}`)), W.map((x) => pctCell(x.by[uid]?.best)))))))) : null,
    h("h2.sec__title", `📋 ${w.title}`),
    h("div.kpis",
      kpi("👩‍🎓", `${w.done}/${st.length}`, "написали"), kpi("📈", w.avg == null ? "—" : w.avg + "%", "середній найкращий"),
      kpi("🏆", w.done ? Math.max(...Object.values(w.by).map((s) => s.best)) + "%" : "—", "найкращий"),
      kpi("🗂️", w.list.length, "спроб"), kpi("⚡", w.list.filter((a) => a.flagged).length, "спроб із ⚡"), kpi("👀", w.list.filter((a) => a.leaves).length, "спроб із виходами")),
    h("section.card", h("h2", "Результати учнів"),
      h("div.tablewrap", h("table.tbl",
        h("thead", h("tr", ["Учень", "Клас", "Найкращий", "Останній", "Спроб", "Сер. на завдання", "⚡", "👀 Виходи", "Остання спроба"].map((x) => h("th", x)))),
        h("tbody", rows.map(({ uid, u, s }) => h(`tr${s ? "" : ".mon__none"}`,
          h("td", h("a", { href: "#/teacher", onclick: (e) => { e.preventDefault(); openStudent(uid); } }, u.name)), h("td", u.cls),
          s ? pctCell(s.best) : h("td.note", "не писав(-ла)"), s ? pctCell(s.last.pct) : h("td"),
          h("td.mono.center", s?.n || ""), h("td.mono", s ? `${num(Math.round((s.sec / s.n) * 10) / 10)} с` : ""), h("td.center", s?.fast || ""),
          h("td.center", { title: s?.last ? awayDetail(s.last) : "" }, s?.leaves ? `${s.leaves} · ${awayFmt(s.awaySec)}` : ""),
          h("td.note", s ? `${fmtDate(s.last.end)} ${fmtTime(s.last.end)}` : ""))))))),
    h("section.card", h("h2", "🧩 Найважчі завдання"),
      hard.length ? h("div.hist", hard.map((g) => { const v = Math.round((g.ok / g.n) * 100); return h("div.hist__row",
        h("span.hist__pct.mono", { style: { background: heatC(v) } }, v + "%"),
        h("div.hist__main", h("b", g.q), h("span.note", `правильно ${g.ok} з ${g.n} · сер. час ${num(Math.round((g.sec / g.n) * 10) / 10)} с`)), h("span")); }))
        : h("p.note", "Цю роботу ще ніхто не писав.")),
  ];
}
