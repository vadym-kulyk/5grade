// 🔬 Детальна статистика учня: кожна тема → кожен рівень → кожна спроба й кожне завдання.
import { h, pct, bar, fmtDate, fmtTime, num, today } from "./ui.js";
import { LEVELS_PER_TOPIC, TASKS_PER_LEVEL } from "./config.js";
import { SECTIONS, shortTitle } from "../content/index.js";
import { topicPct, rankOf } from "./game.js";
import { taskLabel, rightAnswer } from "./quiz.js";
import { awayFmt } from "./teacher-extra.js";

const sel = { uid: null, sec: "all", onlyStarted: true, open: new Set() };
// Відкрити звіт одразу на потрібній темі й рівні (з інших вкладок)
export function focusDetail(uid, topic, level) {
  sel.uid = uid;
  if (topic) { sel.sec = "all"; sel.open.add(topic); if (level) sel.open.add(`${topic}~${level}`); }
}

const topicCache = {};
const loadT = (id) => (topicCache[id] ??= import(`../content/topics/${id}.js`).then((m) => m.default));
const LV = Array.from({ length: LEVELS_PER_TOPIC }, (_, i) => i + 1);
const sec = (x) => Math.min(x.sec || 0, 180); // довше — учень, мабуть, відійшов
const dur = (s) => (s >= 60 ? `${Math.floor(s / 60)} хв ${String(Math.round(s % 60)).padStart(2, "0")} с` : `${Math.round(s)} с`);
const heat = (v) => (v == null ? "" : `hsl(${Math.round(v * 1.1)}, 70%, ${88 - v * 0.25}%)`);
const when = (t) => (t ? `${fmtDate(t)} ${fmtTime(t)}` : "—");


// Підсумок по набору відповідей
function sum(answers) {
  const n = answers.length, ok = answers.filter((x) => x.ok).length;
  return { n, ok, okp: pct(ok, n), sec: answers.reduce((s, x) => s + sec(x), 0), hints: answers.filter((x) => x.hint).length, fast: answers.filter((x) => x.fast).length, leaves: answers.reduce((s, x) => s + (x.leaves || 0), 0), away: answers.reduce((s, x) => s + (x.away || 0), 0) };
}

// Статистика рівня n теми з урахуванням усіх спроб учня
function levelStats(P, at, topic, n) {
  const list = at.filter((a) => a.type === "level" && a.topic === topic && +a.level === n); // від нових до старих
  const L = P.levels?.[n];
  const answers = list.flatMap((a) => a.answers || []);
  const s = sum(answers);
  return {
    ...s, ans: s.n, n, L, list,
    best: L?.best ?? (list.length ? Math.max(...list.map((a) => a.correct)) : null),
    last: L?.last ?? list[0]?.correct ?? null,
    tries: Math.max(L?.attempts || 0, list.length),
    first: list.length ? list[list.length - 1].correct : null,
    trend: list.slice(0, 12).reverse().map((a) => a.correct).join(" → "),
    avgPct: list.length ? Math.round(list.reduce((t, a) => t + a.pct, 0) / list.length) : null,
    time: list.reduce((t, a) => t + (a.durSec || 0), 0),
    lastAt: L?.lastAt || list[0]?.end || null,
    firstAt: list.length ? list[list.length - 1].end : null,
  };
}

function topicStats(uid, data, at, t) {
  const P = data.progress[uid]?.[t.id] || {};
  const levels = LV.map((n) => levelStats(P, at, t.id, n));
  const answers = at.flatMap((a) => (a.answers || []).filter((x) => x.topic === t.id));
  const other = at.filter((a) => a.type !== "level" && (a.answers || []).some((x) => x.topic === t.id));
  const s = sum(answers);
  return {
    t, P, levels, other, ...s,
    v: topicPct(P), started: !!(P.levels || answers.length),
    solved: Object.keys(P.solved || {}).length, seen: Object.keys(P.seen || {}).length,
    perfect: levels.filter((l) => l.best === TASKS_PER_LEVEL).length, begun: levels.filter((l) => l.tries).length,
    lastAt: Math.max(0, ...levels.map((l) => l.lastAt || 0), ...other.map((a) => a.end)) || null,
  };
}

const kpi = (ic, v, l) => h("div.kpi.card", h("span", ic), h("b", v), h("small", l));
const dot = (x, k) => h(`span.ddot${x.ok ? ".ok" : ".bad"}${x.fast ? ".fast" : ""}`, { title: `№${k + 1}: ${x.q}\nВідповідь учня: ${x.given || "—"}\n${x.ok ? "✓ правильно" : "✗ помилка"} · ${num(Math.round(x.sec * 10) / 10)} с${x.hint ? " · підказка" : ""}${x.fast ? " · ⚡ поспіх" : ""}${x.leaves ? ` · 👀 ${x.leaves}×` : ""}` }, x.ok ? "✓" : "✗");

export function detailView({ students, data, ready, redraw }) {
  const st = students();
  if (!sel.uid || !st.some(([id]) => id === sel.uid)) sel.uid = st[0]?.[0];
  if (!sel.uid) return h("p.card", "Учнів ще немає.");
  const uid = sel.uid, u = data.users[uid];
  const at = data.attempts.filter((a) => a.uid === uid);
  const rt = ready();
  const all = rt.map((t) => topicStats(uid, data, at, t));
  const shown = all.filter((x) => (sel.sec === "all" || x.t.s === sel.sec) && (!sel.onlyStarted || x.started || sel.open.has(x.t.id)));
  const tot = sum(at.flatMap((a) => a.answers || []));
  const lvAll = all.flatMap((x) => x.levels);
  const rk = rankOf(u.xp);
  const toggle = (k) => { sel.open.has(k) ? sel.open.delete(k) : sel.open.add(k); redraw(); };

  function levelPanel(x, l) {
    const box = h("div.dlv__tasks", h("p.note", "Завантаження завдань рівня…"));
    loadT(x.t.id).then((T) => {
      const tasks = T.levels[l.n - 1]?.tasks || [];
      const ansOf = (id) => at.flatMap((a) => (a.answers || []).filter((y) => y.topic === x.t.id && y.id === id).map((y) => ({ ...y, end: a.end, type: a.type }))); // нові спочатку
      box.replaceChildren(h("h4", `Кожне завдання рівня ${l.n} (${T.levels[l.n - 1]?.title || ""})`), h("div.tablewrap", h("table.tbl.dtask",
        h("thead", h("tr", ["№", "Завдання", "Правильна відповідь", "Статус", "Відповідав", "Правильно", "Сер. час", "Підказки", "⚡", "👀", "Відповіді учня (останні)"].map((c) => h("th", c)))),
        h("tbody", tasks.map((t, k) => {
          const A = ansOf(t.id), s = sum(A);
          const status = x.P.solved?.[t.id] ? h("span.dtag.ok", "✓ розв’язано") : x.P.seen?.[t.id] ? h("span.dtag.bad", "✗ ще не розв’язано") : h("span.dtag", "не бачив");
          return h(`tr${!A.length ? ".muted" : s.ok < s.n ? ".warnrow" : ""}`,
            h("td.mono.center", k + 1), h("td", taskLabel(t)), h("td.dright", rightAnswer(t)), h("td", status),
            h("td.mono.center", s.n || ""), h("td.mono.center", s.n ? `${s.ok} (${s.okp}%)` : ""),
            h("td.mono", s.n ? `${num(Math.round((s.sec / s.n) * 10) / 10)} с` : ""), h("td.mono.center", s.hints || ""), h("td.mono.center", s.fast || ""), h("td.mono.center", s.leaves ? `${s.leaves} · ${awayFmt(s.away)}` : ""),
            h("td.dgiven", A.slice(0, 4).map((y) => h(`div${y.ok ? ".ok" : ".bad"}`, { title: when(y.end) + (y.type === "review" ? " · робота над помилками" : y.type === "monitoring" ? " · моніторингова" : "") }, `${y.ok ? "✓" : "✗"} ${y.given || "—"}`))));
        })))));
    }).catch(() => box.replaceChildren(h("p.err", "Не вдалося завантажити завдання теми.")));
    return h("div.dlv",
      l.list.length ? h("div.tablewrap", h("table.tbl",
        h("thead", h("tr", ["Спроба", "Дата й час", "Результат", "Тривалість", "Сер. на завдання", "Підказки", "⚡", "👀 Виходи", "Відповіді по завданнях"].map((c) => h("th", c)))),
        h("tbody", l.list.map((a, i) => h(`tr${a.flagged ? ".flag" : ""}`,
          h("td.mono.center", `№${a.attemptNo || l.list.length - i}`), h("td", when(a.end)),
          h("td", { style: { background: heat(a.pct) } }, h("b", `${a.correct}/${a.total}`), ` · ${a.pct}%`),
          h("td.mono", dur(a.durSec || 0)), h("td.mono", `${num(a.avgSec)} с`), h("td.mono.center", a.hints || ""), h("td.mono.center", a.fast || ""),
          h("td.mono.center", a.leaves ? `${a.leaves} · ${awayFmt(a.awaySec)}` : ""),
          h("td", h("div.ddots", (a.answers || []).map(dot)))))))) : h("p.note", "Цей рівень учень ще не проходив."),
      box);
  }

  function levelCell(x, l) {
    const k = `${x.t.id}~${l.n}`, on = sel.open.has(k);
    const v = l.best == null ? null : (l.best / TASKS_PER_LEVEL) * 100;
    return h(`button.dcell${on ? ".on" : ""}`, { style: { background: heat(v) }, onclick: () => toggle(k), title: "Натисни, щоб побачити кожну спробу й кожне завдання" },
      h("b", `Рівень ${l.n}`),
      l.tries ? [
        h("span.dcell__big", `${l.best}/${TASKS_PER_LEVEL}`),
        h("small", `спроб: ${l.tries} · остання ${l.last}/${TASKS_PER_LEVEL}`),
        l.trend ? h("small", `динаміка: ${l.trend}`) : null,
        h("small", `час: ${dur(l.time)} · ${l.ans ? num(Math.round((l.sec / l.ans) * 10) / 10) : 0} с/завд.`),
        (l.hints || l.fast || l.leaves) ? h("small", [l.hints ? `💡${l.hints}` : "", l.fast ? `⚡${l.fast}` : "", l.leaves ? `👀${l.leaves}` : ""].filter(Boolean).join(" ")) : null,
        h("small.note", fmtDate(l.lastAt)),
      ] : h("span.dcell__none", "не почато"));
  }

  function topicCard(x) {
    const open = sel.open.has(x.t.id);
    const openLv = x.levels.filter((l) => sel.open.has(`${x.t.id}~${l.n}`));
    return h(`section.card.dtopic${open ? ".on" : ""}`,
      h("button.dtopic__head", { onclick: () => toggle(x.t.id) },
        h("span.dtopic__pct.mono", { style: { background: heat(x.started ? x.v : null) } }, x.v + "%"),
        h("span.dtopic__t", h("b", shortTitle(x.t)),
          h("small.note", x.started ? `рівнів 10/10: ${x.perfect}/${LEVELS_PER_TOPIC} · завдань розв’язано: ${x.solved}/${LEVELS_PER_TOPIC * TASKS_PER_LEVEL} · відповідей: ${x.n} (${x.okp}% правильних) · час: ${dur(x.sec)} · остання активність: ${when(x.lastAt)}` : "ще не почато")),
        h("span.dtopic__mini", x.levels.map((l) => h("i", { style: { background: l.tries ? heat((l.best / TASKS_PER_LEVEL) * 100) : "#eee" }, title: `Рівень ${l.n}: ${l.tries ? `${l.best}/${TASKS_PER_LEVEL}` : "не почато"}` }))),
        h("span.dtopic__arrow", open ? "▾" : "▸")),
      open ? [
        h("div.dcells", x.levels.map((l) => levelCell(x, l))),
        x.started ? h("p.note", `Підказок: ${x.hints} · ⚡ поспіхом: ${x.fast} · 👀 виходів зі сторінки: ${x.leaves}${x.leaves ? ` (${awayFmt(x.away)})` : ""} · завдань переглянуто: ${x.seen}`) : null,
        x.other.length ? h("p.note", `Поза рівнями: ${x.other.map((a) => `${a.type === "review" ? "робота над помилками" : "моніторингова"} ${fmtDate(a.end)} — ${(a.answers || []).filter((y) => y.topic === x.t.id && y.ok).length}/${(a.answers || []).filter((y) => y.topic === x.t.id).length}`).join("; ")}`) : null,
        openLv.map((l) => h("div.dlvwrap", h("h3", `${shortTitle(x.t)} · рівень ${l.n}`,
          h("button.btn.btn--small", { onclick: () => toggle(`${x.t.id}~${l.n}`) }, "✕ згорнути")), levelPanel(x, l))),
      ] : null);
  }

  // Зведення за розділами
  const secRows = SECTIONS.map((s) => {
    const xs = all.filter((x) => x.t.s === s.id);
    if (!xs.length) return null;
    const ls = xs.flatMap((x) => x.levels);
    return h("tr", h("td", `${s.n}. ${s.title}`), h("td.mono.center", `${xs.filter((x) => x.started).length}/${xs.length}`),
      h("td.mono.center", { style: { background: heat(Math.round(xs.reduce((t, x) => t + x.v, 0) / xs.length)) } }, Math.round(xs.reduce((t, x) => t + x.v, 0) / xs.length) + "%"),
      h("td.mono.center", `${ls.filter((l) => l.tries).length}/${ls.length}`), h("td.mono.center", ls.filter((l) => l.best === TASKS_PER_LEVEL).length),
      h("td.mono.center", xs.reduce((t, x) => t + x.n, 0)), h("td.mono.center", pct(xs.reduce((t, x) => t + x.ok, 0), xs.reduce((t, x) => t + x.n, 0)) + "%"), h("td.mono", dur(xs.reduce((t, x) => t + x.sec, 0))));
  }).filter(Boolean);

  return [
    h("div.filters.card.noprint",
      h("select.select", { onchange: (e) => { sel.uid = e.target.value; sel.open.clear(); redraw(); } }, st.map(([id, x]) => h("option", { value: id, selected: id === uid }, `${x.name} (${x.cls})`))),
      h("select.select", { onchange: (e) => { sel.sec = e.target.value; redraw(); } }, h("option", { value: "all" }, "Усі розділи"), SECTIONS.map((s) => h("option", { value: s.id, selected: s.id === sel.sec }, `${s.n}. ${s.title}`))),
      h("label.check", h("input", { type: "checkbox", checked: sel.onlyStarted, onchange: (e) => { sel.onlyStarted = e.target.checked; redraw(); } }), " Лише розпочаті теми"),
      h("button.btn.btn--small", { onclick: () => { shown.forEach((x) => sel.open.add(x.t.id)); redraw(); } }, "Розгорнути теми"),
      h("button.btn.btn--small", { onclick: () => { sel.open.clear(); redraw(); } }, "Згорнути все"),
      h("button.btn.btn--small", { onclick: () => csvDetail(u, all) }, "⬇ CSV по рівнях"),
      h("button.btn.btn--small", { onclick: () => print() }, "🖨️ Друк")),
    h("section.card.dhead", h("h2", `🔬 ${u.name} · ${u.cls}`),
      h("p.note", `${rk.icon} ${rk.title} · досвід ${u.xp || 0} · монет ${u.coins || 0} · серія днів: зараз ${u.streak?.count || 0}, найдовша ${u.streak?.best || 0} · останній вхід: ${when(u.lastSeen)}`)),
    h("div.kpis",
      kpi("📚", `${all.filter((x) => x.started).length}/${all.length}`, "тем розпочато"), kpi("💯", all.filter((x) => x.v === 100).length, "тем на 100 %"),
      kpi("🪜", `${lvAll.filter((l) => l.tries).length}/${lvAll.length}`, "рівнів розпочато"), kpi("⭐", lvAll.filter((l) => l.best === TASKS_PER_LEVEL).length, "рівнів на 10/10"),
      kpi("🗂️", at.length, "спроб усього"), kpi("✍️", tot.n, "відповідей"), kpi("🎯", tot.okp + "%", "правильних"),
      kpi("⏱️", dur(tot.sec), "час на відповіді"), kpi("🐢", tot.n ? num(Math.round((tot.sec / tot.n) * 10) / 10) + " с" : "—", "сер. на завдання"),
      kpi("💡", tot.hints, "підказок"), kpi("⚡", tot.fast, "відповідей поспіхом"), kpi("👀", tot.leaves ? `${tot.leaves} · ${awayFmt(tot.away)}` : "0", "виходів зі сторінки")),
    h("section.card", h("h2", "За розділами"), h("div.tablewrap", h("table.tbl",
      h("thead", h("tr", ["Розділ", "Тем розпочато", "Сер. %", "Рівнів розпочато", "Рівнів 10/10", "Відповідей", "Правильних", "Час"].map((c) => h("th", c)))),
      h("tbody", secRows)))),
    h("p.note", "Натисни на тему, щоб побачити її 5 рівнів. Натисни на рівень — побачиш кожну спробу (✓/✗ по кожному завданню, наведи на значок — буде відповідь учня й час) і кожне завдання рівня: правильну відповідь, скільки разів учень відповідав і що саме писав."),
    shown.length ? shown.map(topicCard) : h("p.card", "Учень ще не почав жодної теми в цьому розділі."),
  ];
}

function csvDetail(u, all) {
  const head = ["Учень", "Клас", "Тема", "% теми", "Рівень", "Найкраще", "Остання", "Перша", "Спроб", "Динаміка", "Сер. %", "Час, с", "Відповідей", "Правильних", "Підказок", "Поспіхом", "Виходів", "Перша спроба", "Остання спроба"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = all.flatMap((x) => x.levels.map((l) => [u.name, u.cls, shortTitle(x.t), x.v, l.n, l.best ?? "", l.last ?? "", l.first ?? "", l.tries || 0, l.trend, l.avgPct ?? "", l.time, l.ans, l.ok, l.hints, l.fast, l.leaves, l.firstAt ? when(l.firstAt) : "", l.lastAt ? when(l.lastAt) : ""].map(esc).join(";")));
  const blob = new Blob(["﻿" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `detalno-${u.name}-${today()}.csv` });
  document.body.append(a); a.click(); a.remove();
}
