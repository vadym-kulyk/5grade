// Кабінет учителя: перегляд будь-якого завдання і живі питання учням.
import { h, toast, fmtTime, fmtDate, confirmBox } from "./ui.js";
import { r, push, update, remove, onValue } from "./fb.js";
import { renderTask, kindLabel } from "./quiz.js";
import { topicById, shortTitle } from "../content/index.js";
import { MONITORING } from "../content/monitoring/index.js";

// ---------- 📖 Перегляд завдань ----------
const pv = { topic: null, i: 0 };
const topicCache = {};
// Тема разом із моніторинговою роботою (як шостий «рівень» для перегляду)
const loadTopic = async (id) => (topicCache[id] ??= await (async () => {
  const T = (await import(`../content/topics/${id}.js`)).default;
  if (!MONITORING.includes(id)) return T;
  const M = (await import(`../content/monitoring/${id}.js`)).default;
  return { ...T, levels: [...T.levels, { title: "📋 Моніторингова робота", tasks: M.tasks, mon: true }] };
})());

export function previewView({ ready }) {
  const rt = ready();
  if (!pv.topic || !topicById[pv.topic]) pv.topic = rt[0]?.id;
  const grid = h("div.pv__grid"), card = h("div.pv__card.card");
  const sel = h("select.select", { onchange: (e) => { pv.topic = e.target.value; pv.i = 0; draw(); } }, rt.map((t) => h("option", { value: t.id, selected: t.id === pv.topic }, shortTitle(t))));

  async function draw() {
    card.replaceChildren(h("p.note", "Завантаження…"));
    const T = await loadTopic(pv.topic);
    const tasks = T.levels.flatMap((L, li) => L.tasks.map((t) => ({ ...t, topic: T.id, lv: li + 1, lvTitle: L.title })));
    pv.i = Math.max(0, Math.min(pv.i, tasks.length - 1));
    grid.replaceChildren(...T.levels.map((L, li) => h("div.pv__row",
      h("span.pv__lv", L.mon ? "Моніторингова" : `Рівень ${li + 1}`, h("small", L.mon ? `${L.tasks.length} завдань` : L.title)),
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
      h("div.pv__meta", h("span.note", `${shortTitle(topicById[T.id])} · ${T.levels[t.lv - 1].mon ? "моніторингова робота" : `рівень ${t.lv} «${t.lvTitle}»`} · завдання ${pv.i + 1} з ${tasks.length} · ${t.id}`)),
      h("div.task__kind", kindLabel(t)), t.q && h("h2.task__q", { html: t.q }), view.el,
      h("div.task__actions",
        view.autoSubmit ? null : h("button.btn.btn--primary", { onclick: () => (view.ready() ? finish(false) : toast("Спершу дай відповідь або натисни «Показати відповідь»", "info")) }, "Перевірити"),
        h("button.btn", { onclick: () => finish(true) }, "👁 Показати відповідь")),
      out,
      h("div.row.gap.pv__nav",
        h("button.btn", { disabled: pv.i === 0, onclick: () => { pv.i--; draw(); } }, "← Попереднє"),
        h("button.btn", { disabled: pv.i === tasks.length - 1, onclick: () => { pv.i++; draw(); } }, "Наступне →")));
  }
  draw();
  return [h("div.filters.card", sel, h("span.note", "Натисни номер, щоб перейти до будь-якого завдання. Тут нічого не зараховується.")), h("section.card", grid), card];
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
          h("span.note.lv__page", isOnline(id) ? PAGES[o.page] || o.page : "не в мережі"));
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
