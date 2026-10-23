// Кабінет учителя: огляд, спроби, найдовші питання, звіт учня, налаштування.
import { h, mount, toast, pct, bar, ring, fmtDate, fmtTime, confirmBox, today, num } from "./ui.js";
import { watchAuth, teacherLogin, teacherRegister, logout, isTeacher, read, patch, write, r, remove, errText } from "./fb.js";
import { TEACHER_EMAIL, CLASSES, LEVELS_PER_TOPIC, TASKS_PER_LEVEL } from "./config.js";
import { SECTIONS, TOPICS, topicById, shortTitle } from "../content/index.js";
import { rankOf, topicPct, BADGES } from "./game.js";
import { previewView, liveView, startTeacherLive } from "./teacher-extra.js";
import { MONITORING } from "../content/monitoring/index.js";

let data = null;
let tab = "overview", cls = "all", studentId = null, topicId = null;
let stopAuth = null;

export function teacherApp() {
  stopAuth?.();
  stopAuth = watchAuth(async (u) => {
    if (location.hash !== "#/teacher") return;
    if (!isTeacher(u)) return loginView(u);
    mount(h("div.loading", "Завантаження даних класу…"));
    try { await load(); startTeacherLive(); draw(); } catch (e) { mount(h("main.page", h("p.err", errText(e)))); }
  });
}

function loginView(u) {
  const email = h("input.input", { type: "email", value: TEACHER_EMAIL, autocomplete: "username" });
  const pass = h("input.input", { type: "password", placeholder: "Пароль (щонайменше 6 символів)", autocomplete: "current-password" });
  const err = h("p.err");
  const doIt = async (fn) => { err.textContent = ""; try { await fn(email.value.trim(), pass.value); } catch (e) { err.textContent = errText(e); } };
  mount(h("main.login", h("div.login__box",
    h("img.mg-logo", { src: "assets/logo-wordmark.png", alt: "Midgard" }),
    h("h1", "Кабінет учителя"),
    u && !isTeacher(u) ? h("p.warnbox", "Зараз увійшов учень. Щоб відкрити кабінет, спершу вийди.", h("button.btn.btn--small", { onclick: () => logout() }, "Вийти")) : null,
    h("label.lbl", "Пошта"), email, h("label.lbl", "Пароль"), pass, err,
    h("div.row.gap", h("button.btn.btn--primary", { onclick: () => doIt(teacherLogin) }, "Увійти"),
      h("button.btn", { onclick: () => doIt(teacherRegister) }, "Перший вхід: створити пароль")),
    h("p.note", "Кабінет відкривається лише для пошти вчителя, вказаної в налаштуваннях сайту."),
    h("a.teacherlink", { href: "#/" }, "← На сторінку учнів"))));
  pass.addEventListener("keydown", (e) => e.key === "Enter" && doIt(teacherLogin));
}

async function load() {
  const [users, progress, attempts, settings, pins] = await Promise.all(["users", "progress", "attempts", "settings", "pins"].map((p) => read(p)));
  const list = [];
  for (const [uid, a] of Object.entries(attempts || {})) for (const [id, x] of Object.entries(a)) list.push({ ...x, uid, id });
  list.sort((a, b) => b.end - a.end);
  data = { users: users || {}, progress: progress || {}, attempts: list, settings: settings || {}, pins: pins || {} };
}

const students = () => Object.entries(data.users).filter(([, u]) => cls === "all" || u.cls === cls).sort((a, b) => (a[1].cls + a[1].name).localeCompare(b[1].cls + b[1].name, "uk"));
const ready = () => TOPICS.filter((t) => t.ready);
const heat = (v) => `hsl(${Math.round(v * 1.1)}, 70%, ${v ? 88 - v * 0.25 : 96}%)`;

function draw() {
  const tabs = [["overview", "📊 Огляд"], ["attempts", "🗂️ Спроби"], ["topic", "📚 Тема"], ["live", "🎤 Питання"], ["preview", "📖 Завдання"], ["slow", "⏱️ Найдовші питання"], ["student", "👤 Учень"], ["settings", "⚙️ Налаштування"]];
  mount(
    h("header.topbar.topbar--teacher",
      h("a.topbar__logo", { href: "#/teacher" }, h("img", { src: "assets/logo-wordmark.png", alt: "Midgard" })),
      h("nav.topbar__nav", tabs.map(([id, t]) => h(`a${tab === id ? ".on" : ""}`, { href: "#/teacher", onclick: (e) => { e.preventDefault(); tab = id; draw(); } }, t))),
      h("div.topbar__me",
        h("select.select", { onchange: (e) => { cls = e.target.value; draw(); } }, h("option", { value: "all" }, "Усі класи"), CLASSES.map((c) => h("option", { value: c, selected: c === cls }, c))),
        h("button.btn.btn--small", { onclick: async () => { await load(); draw(); toast("Оновлено"); } }, "↻"),
        h("button.btn.btn--small", { onclick: () => logout() }, "Вийти"))),
    h("main.page.page--wide", { overview, attempts: attemptsView, topic: topicView, live: () => liveView({ students, ready }), preview: () => previewView({ ready }), slow, student: studentView, settings: settingsView }[tab]()));
}

// ---------- Огляд ----------
function overview() {
  const st = students();
  const ids = new Set(st.map(([id]) => id));
  const at = data.attempts.filter((a) => ids.has(a.uid));
  const week = at.filter((a) => a.end > Date.now() - 7 * 864e5);
  const avg = at.length ? Math.round(at.reduce((s, a) => s + a.pct, 0) / at.length) : 0;
  const flagged = at.filter((a) => a.flagged).length;
  const rt = ready();
  // середній % по темах
  const byTopic = rt.map((t) => ({ t, v: st.length ? Math.round(st.reduce((s, [id]) => s + topicPct(data.progress[id]?.[t.id]), 0) / st.length) : 0 }));
  return [
    h("div.kpis",
      kpi("👩‍🎓", st.length, "учнів"), kpi("🗂️", at.length, "спроб усього"), kpi("📅", week.length, "спроб за тиждень"),
      kpi("🎯", avg + "%", "середній результат"), kpi("⚡", flagged, "спроб із позначкою швидкості")),
    h("section.card", h("h2", "Середній прогрес за темами"),
      h("div.chart", byTopic.map(({ t, v }) => h("div.chart__row", h("span", shortTitle(t)), bar(v), h("b.mono", v + "%"))))),
    h("section.card", h("h2", "Теплова карта: учень × тема"),
      h("p.note", "Клітинка — відсоток теми. Натисни на ім’я, щоб відкрити звіт учня."),
      h("div.tablewrap", h("table.tbl.heat",
        h("thead", h("tr", h("th", "Учень"), h("th", "Клас"), h("th", "Звання"), rt.map((t) => h("th.rot", h("span", shortTitle(t)))), h("th", "Спроб"), h("th", "⚡"), h("th", "Активність"))),
        h("tbody", st.map(([id, u]) => {
          const mine = at.filter((a) => a.uid === id);
          return h("tr",
            h("td", h("a", { href: "#/teacher", onclick: (e) => { e.preventDefault(); studentId = id; tab = "student"; draw(); } }, u.name)),
            h("td", u.cls), h("td", `${rankOf(u.xp).icon} ${rankOf(u.xp).title}`),
            rt.map((t) => { const v = topicPct(data.progress[id]?.[t.id]); return h("td.mono.center", { style: { background: heat(v) } }, v); }),
            h("td.mono.center", mine.length), h("td.mono.center", mine.filter((a) => a.flagged).length || ""),
            h("td.note", u.lastSeen ? `${fmtDate(u.lastSeen)} ${fmtTime(u.lastSeen)}` : "—"));
        }))))),
    activityChart(at),
  ];
}
const kpi = (ic, v, l) => h("div.kpi.card", h("span", ic), h("b", v), h("small", l));

function activityChart(at) {
  const days = [...Array(28)].map((_, i) => today(Date.now() - (27 - i) * 864e5));
  const cnt = Object.fromEntries(days.map((d) => [d, 0]));
  at.forEach((a) => { const d = today(a.end); if (d in cnt) cnt[d]++; });
  const max = Math.max(1, ...Object.values(cnt));
  return h("section.card", h("h2", "Активність за 4 тижні (спроб на день)"),
    h("div.cols", days.map((d) => h("div.cols__c", { title: `${fmtDate(d)}: ${cnt[d]}` }, h("div.cols__b", { style: { height: (cnt[d] / max) * 100 + "%" } }), h("small", d.slice(8))))));
}

// ---------- Спроби ----------
// ---------- Тема: результати всіх учнів ----------
function topicView() {
  const rt = ready();
  if (!topicId || !topicById[topicId]) topicId = rt[0]?.id;
  const st = students();
  const ids = new Set(st.map(([id]) => id));
  const at = data.attempts.filter((a) => ids.has(a.uid) && a.topic === topicId);
  const rows = st.map(([id, u]) => {
    const p = data.progress[id]?.[topicId] || {};
    const mine = at.filter((a) => a.uid === id);
    return { id, u, p, v: topicPct(p), mine, avgSec: mine.length ? Math.round((mine.reduce((s, a) => s + a.avgSec, 0) / mine.length) * 10) / 10 : null };
  }).sort((a, b) => b.v - a.v || a.u.name.localeCompare(b.u.name, "uk"));
  const started = rows.filter((x) => x.mine.length || x.v);
  const avg = st.length ? Math.round(rows.reduce((s, x) => s + x.v, 0) / st.length) : 0;
  // питання теми з найбільшою кількістю помилок
  const agg = {};
  at.forEach((a) => (a.answers || []).forEach((x) => { const g = agg[x.id] || (agg[x.id] = { q: x.q, n: 0, ok: 0 }); g.n++; g.ok += x.ok ? 1 : 0; }));
  const hard = Object.values(agg).filter((g) => g.ok < g.n).sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n).slice(0, 10);
  const lv = Array.from({ length: LEVELS_PER_TOPIC }, (_, i) => i + 1);
  return [
    h("div.filters.card",
      h("select.select", { onchange: (e) => { topicId = e.target.value; draw(); } }, rt.map((t) => h("option", { value: t.id, selected: t.id === topicId }, shortTitle(t)))),
      h("button.btn.btn--small", { onclick: () => csv(at) }, "⬇ CSV спроб теми")),
    h("div.kpis",
      kpi("📈", avg + "%", "середній % теми"), kpi("👩‍🎓", `${started.length}/${st.length}`, "почали тему"),
      kpi("💯", rows.filter((x) => x.v === 100).length, "на 100 %"), kpi("🗂️", at.length, "спроб"), kpi("⚡", at.filter((a) => a.flagged).length, "спроб із ⚡")),
    h("section.card", h("h2", `Результати учнів: ${shortTitle(topicById[topicId])}`),
      h("p.note", `Рівень — найкращий результат із ${TASKS_PER_LEVEL}. Натисни на ім’я, щоб відкрити звіт учня.`),
      h("div.tablewrap", h("table.tbl.heat",
        h("thead", h("tr", h("th", "Учень"), h("th", "Клас"), h("th", "% теми"), lv.map((n) => h("th", `Р${n}`)), h("th", "Спроб"), h("th", "⚡"), h("th", "Сер. на завдання"), h("th", "Остання спроба"))),
        h("tbody", rows.map(({ id, u, p, v, mine, avgSec }) => h("tr",
          h("td", h("a", { href: "#/teacher", onclick: (e) => { e.preventDefault(); studentId = id; tab = "student"; draw(); } }, u.name)),
          h("td", u.cls), h("td.mono.center", { style: { background: heat(v) } }, v + "%"),
          lv.map((n) => { const L = p.levels?.[n]; return h("td.mono.center", { style: { background: L ? heat((L.best / TASKS_PER_LEVEL) * 100) : "" } }, L ? `${L.best}` : "—"); }),
          h("td.mono.center", mine.length || ""), h("td.mono.center", mine.filter((a) => a.flagged).length || ""),
          h("td.mono", avgSec == null ? "—" : `${num(avgSec)} с`),
          h("td.note", mine[0] ? `${fmtDate(mine[0].end)} ${fmtTime(mine[0].end)}` : "—"))))))),
    h("section.card", h("h2", "🧩 Де найчастіше помиляються"),
      hard.length ? h("div.tablewrap", h("table.tbl", h("thead", h("tr", ["Завдання", "Відповідей", "% правильних"].map((x) => h("th", x)))),
        h("tbody", hard.map((g) => h("tr", h("td", g.q), h("td.mono.center", g.n), h("td.mono.center", pct(g.ok, g.n) + "%"))))))
        : h("p.note", "Помилок у цій темі ще немає.")),
  ];
}

function attemptsView() {
  const f = { student: "", topic: "", type: "", flagged: false };
  const box = h("div");
  const st = students();
  const ids = new Set(st.map(([id]) => id));
  const sel = (key, opts) => h("select.select", { onchange: (e) => { f[key] = e.target.value; drawT(); } }, opts.map(([v, l]) => h("option", { value: v }, l)));
  function rows() {
    return data.attempts.filter((a) => ids.has(a.uid) && (!f.student || a.uid === f.student) && (!f.topic || a.topic === f.topic) && (!f.type || a.type === f.type) && (!f.flagged || a.flagged));
  }
  function drawT() {
    const rs = rows();
    box.replaceChildren(h("p.note", `Знайдено спроб: ${rs.length}`), h("div.tablewrap", h("table.tbl",
      h("thead", h("tr", ["Дата", "Учень", "Клас", "Що", "Спроба №", "Результат", "Тривалість", "Сер. на завдання", "Швидких", "Підказок", "Монети"].map((x) => h("th", x)))),
      h("tbody", rs.slice(0, 500).map((a) => h(`tr${a.flagged ? ".flag" : ""}`,
        h("td", `${fmtDate(a.end)} ${fmtTime(a.end)}`), h("td", a.name), h("td", a.cls),
        h("td", what(a)), h("td.mono.center", a.attemptNo),
        h("td", h("b", `${a.pct}%`), ` ${a.correct}/${a.total}`),
        h("td.mono", `${Math.floor(a.durSec / 60)}:${String(a.durSec % 60).padStart(2, "0")}`),
        h("td.mono", `${num(a.avgSec)} с`), h("td.center", a.fast ? `⚡ ${a.fast}` : ""), h("td.center", a.hints || ""), h("td.mono", a.coins)))))));
  }
  const view = [
    h("div.filters.card",
      sel("student", [["", "Усі учні"], ...st.map(([id, u]) => [id, `${u.name} (${u.cls})`])]),
      sel("topic", [["", "Усі теми"], ...ready().map((t) => [t.id, shortTitle(t)])]),
      sel("type", [["", "Усі типи"], ["level", "Рівні тем"], ["review", "Робота над помилками"], ["monitoring", "Моніторингові"]]),
      h("label.check", h("input", { type: "checkbox", onchange: (e) => { f.flagged = e.target.checked; drawT(); } }), " Лише ⚡ швидкі"),
      h("button.btn.btn--small", { onclick: () => csv(rows()) }, "⬇ CSV")),
    h("p.note", "Повна таблиця з фільтрами й графіками також оновлюється автоматично в Google Таблиці на твоєму Диску."),
    box];
  drawT();
  return view;
}
const what = (a) => (a.type === "level" ? `${shortTitle(topicById[a.topic] || { title: a.topicTitle })} · рівень ${a.level}` : a.topicTitle);

function csv(rows) {
  const head = ["Дата", "Час", "Учень", "Клас", "Тип", "Тема", "Рівень", "Спроба", "Правильно", "Усього", "%", "Тривалість, с", "Сер. на завдання, с", "Швидких", "Позначка", "Підказок", "Монети"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((a) => [fmtDate(a.end), fmtTime(a.end), a.name, a.cls, a.type, a.topicTitle, a.level, a.attemptNo, a.correct, a.total, a.pct, a.durSec, a.avgSec, a.fast, a.flagged ? "⚡" : "", a.hints, a.coins].map(esc).join(";"));
  const blob = new Blob(["﻿" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `rezultaty-${today()}.csv` });
  document.body.append(a); a.click(); a.remove();
}

// ---------- Найдовші питання ----------
function slow() {
  const ids = new Set(students().map(([id]) => id));
  const agg = {};
  for (const a of data.attempts) {
    if (!ids.has(a.uid)) continue;
    for (const x of a.answers || []) {
      const k = `${x.topic}~${x.id}`;
      const g = (agg[k] ||= { topic: x.topic, q: x.q, n: 0, sec: 0, ok: 0, students: new Set() });
      g.n++; g.sec += Math.min(x.sec, 180); // довше — учень, мабуть, відійшов g.ok += x.ok ? 1 : 0; g.students.add(a.uid);
    }
  }
  const list = Object.values(agg).filter((g) => g.n >= 1).map((g) => ({ ...g, avg: Math.round((g.sec / g.n) * 10) / 10, okp: pct(g.ok, g.n) }));
  const byTime = [...list].sort((a, b) => b.avg - a.avg).slice(0, 30);
  const byHard = [...list].filter((g) => g.n >= 2).sort((a, b) => a.okp - b.okp).slice(0, 20);
  const maxAvg = Math.max(1, ...byTime.map((g) => g.avg));
  const table = (rows) => h("div.tablewrap", h("table.tbl",
    h("thead", h("tr", ["Тема", "Завдання", "Сер. час", "", "Відповідей", "Учнів", "Правильно"].map((x) => h("th", x)))),
    h("tbody", rows.map((g) => h("tr", h("td", shortTitle(topicById[g.topic] || { title: g.topic })), h("td", g.q), h("td.mono", `${num(g.avg)} с`), h("td", { style: { minWidth: "90px" } }, bar((g.avg / maxAvg) * 100, "var(--violet)")), h("td.mono.center", g.n), h("td.mono.center", g.students.size), h("td.mono", { style: { color: g.okp < 50 ? "var(--wrong)" : "" } }, g.okp + "%"))))));
  return [
    h("section.card", h("h2", "⏱️ Питання, над якими учні думали найдовше"), h("p.note", "Середній час відповіді на завдання (без пауз). Довгий час + низький відсоток правильних — сигнал, що тему треба пояснити ще раз."), table(byTime)),
    h("section.card", h("h2", "🧩 Найскладніші питання (найменше правильних)"), table(byHard)),
  ];
}

// ---------- Учень + звіт для друку ----------
function studentView() {
  const st = students();
  if (!studentId || !data.users[studentId]) studentId = st[0]?.[0];
  if (!studentId) return h("p.card", "Учнів ще немає.");
  const u = data.users[studentId];
  const p = data.progress[studentId] || {};
  const at = data.attempts.filter((a) => a.uid === studentId);
  const rk = rankOf(u.xp);
  const rt = ready();
  const pcts = rt.map((t) => ({ t, v: topicPct(p[t.id]) }));
  const avg = pcts.length ? Math.round(pcts.reduce((s, x) => s + x.v, 0) / pcts.length) : 0;
  const strong = pcts.filter((x) => x.v >= 80).map((x) => shortTitle(x.t));
  const weak = pcts.filter((x) => x.v < 60).map((x) => shortTitle(x.t));
  // помилки за темами — для рекомендацій
  const wrongBy = {};
  at.forEach((a) => (a.answers || []).forEach((x) => { if (!x.ok) wrongBy[x.topic] = (wrongBy[x.topic] || 0) + 1; }));
  const fastTotal = at.reduce((s, a) => s + (a.fast || 0), 0);
  const avgSec = at.length ? Math.round((at.reduce((s, a) => s + a.avgSec, 0) / at.length) * 10) / 10 : 0;

  return [
    h("div.filters.card.noprint",
      h("select.select", { onchange: (e) => { studentId = e.target.value; draw(); } }, st.map(([id, x]) => h("option", { value: id, selected: id === studentId }, `${x.name} (${x.cls})`))),
      h("button.btn.btn--primary", { onclick: () => print() }, "🖨️ Звіт у PDF"),
      h("span.note", "У вікні друку обери «Зберегти як PDF».")),
    h("article.report",
      h("header.report__head",
        h("img", { src: "assets/logo-wordmark.png", alt: "Midgard" }),
        h("div", h("div.note", "Звіт про навчання · Українська мова, 5 клас"), h("h1", u.name), h("div", `Клас ${u.cls} · сформовано ${fmtDate(Date.now())}`)),
        h("div.report__rank", h("span", rk.icon), h("b", rk.title), h("small", `${u.xp || 0} досвіду`))),
      h("div.kpis",
        kpi("📈", avg + "%", "середній прогрес"), kpi("💯", pcts.filter((x) => x.v === 100).length, "тем на 100 %"),
        kpi("🗂️", at.length, "спроб"), kpi("⏱️", num(avgSec) + " с", "сер. час на завдання"), kpi("🔥", u.streak?.best || 0, "найдовша серія днів")),
      h("section", h("h2", "Прогрес за темами"), h("div.chart", pcts.map(({ t, v }) => h("div.chart__row", h("span", shortTitle(t)), bar(v, v >= 80 ? "var(--right)" : v >= 60 ? "var(--yellow)" : "var(--wrong)"), h("b.mono", v + "%"))))),
      h("section.report__two",
        h("div.card", h("h3", "💪 Сильні сторони"), strong.length ? h("ul", strong.map((x) => h("li", x))) : h("p.note", "Ще немає тем на 80 %+.")),
        h("div.card", h("h3", "🎯 Що повторити"), weak.length ? h("ul", weak.map((x) => h("li", x, wrongBy[topicByShort(x)] ? ` — помилок: ${wrongBy[topicByShort(x)]}` : ""))) : h("p.note", "Усі теми на 60 %+ 👏"))),
      fastTotal ? h("p.warnbox", `⚡ Занадто швидких відповідей: ${fastTotal}. Спроб із позначкою швидкості: ${at.filter((a) => a.flagged).length}.`) : null,
      h("section", h("h2", "Значки"), h("div.badges.badges--small", BADGES.filter((b) => u.badges?.[b.id]).map((b) => h("div.badgecard.got", h("span.badgecard__i", b.icon), h("b", b.title)))), !Object.keys(u.badges || {}).length && h("p.note", "Ще немає.")),
      h("section", h("h2", "Останні спроби"), h("table.tbl",
        h("thead", h("tr", ["Дата", "Що", "Результат", "Час", "Сер. на завдання", "⚡"].map((x) => h("th", x)))),
        h("tbody", at.slice(0, 25).map((a) => h("tr", h("td", fmtDate(a.end)), h("td", what(a)), h("td", `${a.pct}% (${a.correct}/${a.total})`), h("td.mono", `${Math.round(a.durSec / 60)} хв`), h("td.mono", `${num(a.avgSec)} с`), h("td", a.flagged ? "⚡" : "")))))),
      h("footer.report__foot", "Midgard · Українська мова 5 клас · за підручником А. Онатій, Т. Ткачук")),
  ];
}
const topicByShort = (s) => ready().find((t) => shortTitle(t) === s)?.id;

// ---------- Налаштування ----------
function settingsView() {
  const s = data.settings;
  const save = async (path, val, msg = "Збережено") => { try { await write(`settings/${path}`, val); await load(); draw(); toast(msg); } catch (e) { toast(errText(e), "warn"); } };
  const sw = (on, fn, label) => h("label.switch", h("input", { type: "checkbox", checked: on, onchange: (e) => fn(e.target.checked) }), h("span"), label);
  const st = students();
  return [
    h("section.card", h("h2", "💬 3D-школа і рейтинг"),
      sw(s.chatEnabled === true, (v) => save("chatEnabled", v, v ? "Чат увімкнено" : "Чат вимкнено"), "Дозволити учням писати в чат у 3D-школі"),
      h("p.note", "Готові фрази й емоції працюють завжди. Вільний чат — лише коли ти дозволиш. Нецензурні слова автоматично замінюються на ***."),
      h("button.btn.btn--small", { onclick: async () => { if (await confirmBox("Очистити всю історію чату?")) { await remove(r("chat")); toast("Чат очищено"); } } }, "🧹 Очистити чат"),
      sw(s.leaderboard === true, (v) => save("leaderboard", v), "Показувати рейтинг класу (п’ятірка лідерів, інші бачать лише своє місце)")),
    h("section.card", h("h2", "📋 Моніторингові роботи"),
      h("p.note", "Відкрий роботу — учні побачать її на головній. Завдання беруться з усіх готових тем розділу (до 25 штук)."),
      sw(s.monitoring?.diag?.open === true, (v) => save("monitoring/diag/open", v), "Вхідна діагностика (з усіх готових тем)"),
      SECTIONS.map((x) => sw(s.monitoring?.[x.id]?.open === true, (v) => save(`monitoring/${x.id}/open`, v), `Розділ ${x.n}. ${x.title}`)),
      h("h3", "За темами (складні, без підказок)"),
      h("p.note", "Кожна робота закрита, доки ти її не відкриєш. Учні побачать її на головній і на сторінці теми. Переглянути завдання можна у вкладці «📖 Завдання»."),
      TOPICS.filter((t) => t.ready && MONITORING.includes(t.id)).map((t) => sw(s.monitoring?.[`t_${t.id}`]?.open === true, (v) => save(`monitoring/t_${t.id}/open`, v), shortTitle(t)))),
    h("section.card", h("h2", "📌 Теми: відкрити, закрити, задати з дедлайном"),
      h("div.tablewrap", h("table.tbl",
        h("thead", h("tr", ["Тема", "Готова", "Відкрита", "Задано", "Дедлайн"].map((x) => h("th", x)))),
        h("tbody", TOPICS.map((t) => {
          const ts = s.topics?.[t.id] || {};
          return h("tr", h("td", shortTitle(t)), h("td.center", t.ready ? "✅" : "—"),
            h("td.center", h("input", { type: "checkbox", checked: !ts.closed, onchange: (e) => save(`topics/${t.id}/closed`, !e.target.checked) })),
            h("td.center", h("input", { type: "checkbox", checked: !!ts.assigned, onchange: (e) => save(`topics/${t.id}/assigned`, e.target.checked) })),
            h("td", h("input.input.input--small", { type: "date", value: ts.deadline || "", onchange: (e) => save(`topics/${t.id}/deadline`, e.target.value || null) })));
        }))))),
    h("section.card", h("h2", "🔑 Учні та PIN-коди"),
      h("p.note", "Якщо учень забув PIN — подивись його тут. Учень може змінити PIN у своєму профілі."),
      h("div.tablewrap", h("table.tbl",
        h("thead", h("tr", ["Учень", "Клас", "PIN", "Монети", ""].map((x) => h("th", x)))),
        h("tbody", st.map(([id, u]) => {
          const pinCell = h("td.mono", h("button.btn.btn--small", { onclick: () => pinCell.replaceChildren(data.pins[id] || "—") }, "показати"));
          return h("tr", h("td", u.name), h("td", u.cls), pinCell, h("td.mono", u.coins || 0),
            h("td", h("button.btn.btn--small.btn--danger", { onclick: async () => {
              if (!(await confirmBox(`Прибрати ${u.name} зі списку класу? Результати в таблиці залишаться.`, "Прибрати"))) return;
              await patch("", { [`roster/${u.cls}/${id}`]: null, [`public/${id}`]: null });
              toast("Учня прибрано зі списку входу");
            } }, "Прибрати")));
        }))))),
  ];
}
