// Головний модуль: маршрути та сторінки учня.
import { h, $, mount, toast, modal, shuffle, pct, ring, bar, fmtDate, fmtTime, say, today, num } from "./ui.js";
import { watchAuth, logout, studentLogin, studentRegister, changePin, isTeacher, read, errText } from "./fb.js";
import { CLASSES, ECONOMY, LEVELS_PER_TOPIC, TASKS_PER_LEVEL } from "./config.js";
import { state, onChange, bindStudent, unbind, saveSession, loadAttempts, buyItem, owns, saveAvatar, awardBadges, settleAvatar } from "./store.js";
import { RANKS, rankOf, BADGES, badgeById, topicPct, overall } from "./game.js";
import { SECTIONS, TOPICS, topicById, sectionById, shortTitle, loadTopic, BOOK } from "../content/index.js";
import { runQuiz } from "./quiz.js";
import { CATEGORIES, ITEMS, itemById, fullAvatar, isFree, avatarPreview } from "./avatar.js";
import { startLive, stopLive } from "./live.js";

const LOGO = "assets/logo-wordmark.png";
const go = (hash) => (location.hash = hash);

// ---------- Маршрутизатор ----------
const routes = [
  [/^#\/?$/, () => home()],
  [/^#\/topic\/(\w+)$/, (id) => topicPage(id)],
  [/^#\/play\/(\w+)\/(\d)$/, (id, lv) => playLevel(id, +lv)],
  [/^#\/review$/, () => review()],
  [/^#\/monitoring\/(\w+)$/, (id) => monitoring(id)],
  [/^#\/shop$/, () => shop()],
  [/^#\/profile$/, () => profile()],
  [/^#\/school$/, () => import("./world.js").then((m) => m.openWorld(state))],
  [/^#\/teacher$/, () => import("./teacher.js").then((m) => m.teacherApp())],
];

let authUser = undefined;
function route() {
  const hash = location.hash || "#/";
  document.body.classList.toggle("in-world", hash === "#/school");
  if (hash === "#/teacher") return import("./teacher.js").then((m) => m.teacherApp());
  if (authUser === undefined) return mount(h("div.loading", "Завантаження…"));
  if (!authUser || isTeacher(authUser)) return loginPage();
  if (!state.user) return mount(h("div.loading", "Завантаження профілю…"));
  for (const [re, fn] of routes) { const m = hash.match(re); if (m) return fn(...m.slice(1)); }
  go("#/");
}
addEventListener("hashchange", route);

watchAuth(async (u) => {
  authUser = u;
  if (u && !isTeacher(u)) {
    route();
    await bindStudent(u.uid);
    if (state.user) startLive(u.uid, state.user);
  } else { stopLive(); unbind(); }
  route();
});

// Разове виправлення неоплачених речей (баг магазину до 22.10)
let settling = false;
onChange(async () => {
  if (settling || !state.user || state.user.shopFixed || state.teacher) return;
  settling = true;
  const res = await settleAvatar(itemById, isFree, fullAvatar).catch(() => null);
  if (res) toast(`Ми полагодили магазин 🛠️ ${res.kept.length ? `За речі на твоєму персонажі списано ${res.paid} 🪙 — тепер вони твої.` : ""}${res.removed.length ? ` Не вистачило монет на: ${res.removed.join(", ")} — це знято з персонажа.` : ""}`, "info", 9000);
  settling = false;
});

// Оновлюємо шапку (монети, звання), коли змінюються дані
onChange(() => { const t = $("#topbar"); if (t && state.user) t.replaceWith(topbar()); });

// ---------- Спільні елементи ----------
function topbar() {
  const u = state.user;
  const rk = rankOf(u.xp);
  return h("header#topbar.topbar",
    h("a.topbar__logo", { href: "#/" }, h("img", { src: LOGO, alt: "Midgard" })),
    h("nav.topbar__nav",
      h("a", { href: "#/" }, "🏠", h("span", "Теми")),
      h("a", { href: "#/school" }, "🏫", h("span", "Школа")),
      h("a", { href: "#/shop" }, "🎨", h("span", "Персонаж")),
      h("a", { href: "#/profile" }, "📊", h("span", "Прогрес"))),
    h("div.topbar__me",
      h("span.coinpill", { title: "Монети" }, "🪙 ", h("b", u.coins || 0)),
      h("span.rankpill", { title: `Звання: ${rk.title}` }, rk.icon, h("span", rk.title)),
      (u.streak?.last === today() || u.streak?.last === today(Date.now() - 864e5)) && u.streak?.count > 1 ? h("span.streakpill", { title: "Днів поспіль" }, "🔥", u.streak.count) : null));
}
const page = (...kids) => mount(topbar(), h("main.page", ...kids));
const marks = () => [h("img.mg-mark.mg-mark--top-right", { src: "assets/mark-green-wave.png", alt: "" }), h("img.mg-mark.mg-mark--bottom-left", { src: "assets/mark-purple-spiral.png", alt: "" })];
const topicOpen = (id) => !state.settings?.topics?.[id]?.closed;

// ---------- Вхід ----------
function loginPage() {
  let cls = CLASSES[0];
  const tabs = h("div.seg");
  const list = h("div.namegrid");
  const area = h("div");

  async function drawNames() {
    tabs.replaceChildren(...CLASSES.map((c) => h(`button.seg__b${c === cls ? ".on" : ""}`, { onclick: () => { cls = c; drawNames(); } }, c)));
    list.replaceChildren(h("p.note", "Завантаження списку…"));
    let roster = {};
    try { roster = (await read(`roster/${cls}`)) || {}; } catch (e) { list.replaceChildren(h("p.err", errText(e))); return; }
    const names = Object.entries(roster).sort((a, b) => a[1].name.localeCompare(b[1].name, "uk"));
    list.replaceChildren(
      ...names.map(([uid, s], i) => h("button.namebtn", { onclick: () => pinStep(s), style: { "--i": i } }, h(`span.namebtn__av.av${[...s.name].reduce((a, ch) => a + ch.codePointAt(0), 0) % 6}`, s.name[0]), s.name)),
      h("button.namebtn.namebtn--new", { onclick: registerStep }, h("span.namebtn__av", "+"), "Я тут уперше"));
  }

  function pinStep(s) {
    const pin = pinInput();
    const err = h("p.err");
    const submit = async () => {
      if (pin.value.length !== 4) return (err.textContent = "PIN — це 4 цифри.");
      try { await studentLogin(s.login, pin.value); go("#/"); } catch (e) { err.textContent = errText(e); pin.value = ""; pin.focus(); }
    };
    pin.addEventListener("keydown", (e) => e.key === "Enter" && submit());
    area.replaceChildren(h("div.card.center",
      h("h2", `Привіт, ${s.name}!`), h("p", "Введи свій PIN-код"), pin, err,
      h("div.row.gap.center", h("button.btn", { onclick: () => area.replaceChildren() }, "Назад"), h("button.btn.btn--primary", { onclick: submit }, "Увійти")),
      h("p.note", "Забув(-ла) PIN? Підійди до вчителя — тобі підкажуть.")));
    pin.focus();
    area.scrollIntoView({ behavior: "smooth" });
  }

  function registerStep() {
    const name = h("input.input", { placeholder: "Ім’я та перша літера прізвища, напр. Оля К.", maxlength: 30 });
    const pin = pinInput(), pin2 = pinInput("Повтори PIN");
    const err = h("p.err");
    const submit = async () => {
      const n = name.value.trim().replace(/\s+/g, " ");
      if (n.length < 2) return (err.textContent = "Напиши своє ім’я.");
      if (pin.value.length !== 4) return (err.textContent = "PIN — це 4 цифри.");
      if (pin.value !== pin2.value) return (err.textContent = "PIN-коди не збігаються.");
      err.textContent = "Створюю профіль…";
      try { await studentRegister({ name: n, cls, pin: pin.value }); toast("Профіль створено! Ласкаво просимо 🎉", "win"); go("#/shop"); } catch (e) { err.textContent = errText(e); }
    };
    area.replaceChildren(h("div.card",
      h("h2", `Новий учень · ${cls}`),
      h("label.lbl", "Як тебе звати?"), name,
      h("label.lbl", "Придумай PIN із 4 цифр і запам’ятай його"), h("div.row.gap", pin, pin2), err,
      h("div.row.gap", h("button.btn", { onclick: () => area.replaceChildren() }, "Назад"), h("button.btn.btn--primary", { onclick: submit }, "Створити профіль"))));
    name.focus();
    area.scrollIntoView({ behavior: "smooth" });
  }

  const letters = ["А", "Ґ", "Є", "Ї", "Ш", "Я", "’", "Ж", "Ю", "Щ", "Й", "Ь"];
  mount(h("main.login",
    h("div.login__bg", { "aria-hidden": "true" },
      h("span.blob.blob--lime"), h("span.blob.blob--violet"), h("span.blob.blob--yellow"),
      letters.map((l, i) => h("span.fly", { style: { "--x": `${(i * 37 + 7) % 96}%`, "--d": `${14 + (i % 5) * 3}s`, "--delay": `${-i * 2.3}s`, "--s": `${28 + (i % 4) * 14}px` } }, l))),
    h("div.login__box",
      h("img.mg-logo", { src: LOGO, alt: "Midgard" }),
      h("h1.login__title", "Українська мова ", h("span.hl", "5 клас")),
      h("p.lead", "Вчися, заробляй монети, підвищуй звання й гуляй 3D-школою."),
      h("div.login__chips", ["📚 41 тема", "🏅 10 звань", "🎨 123 речі для персонажа", "🏫 3D-школа"].map((t) => h("span.chip", t))),
      h("div.login__panel",
        h("p.login__step", "1. Обери свій клас"), tabs,
        h("p.login__step", "2. Натисни на своє ім’я"), list, area),
      h("a.teacherlink", { href: "#/teacher" }, "Вхід для вчителя →"))));
  drawNames();
}
function pinInput(ph = "PIN") {
  const i = h("input.input.input--pin", { type: "password", inputmode: "numeric", maxlength: 4, placeholder: ph, autocomplete: "off" });
  i.addEventListener("input", () => (i.value = i.value.replace(/\D/g, "").slice(0, 4)));
  return i;
}

// ---------- Головна ----------
function home() {
  const u = state.user, p = state.progress || {};
  const o = overall(p);
  const rk = rankOf(u.xp);
  const due = Object.values(state.mistakes || {}).filter((m) => m.due <= Date.now()).length;
  const waiting = Object.values(state.mistakes || {}).length;
  const avBox = h("div.hero__av");
  const assigned = TOPICS.filter((t) => state.settings?.topics?.[t.id]?.assigned && t.ready);
  const mon = state.settings?.monitoring || {};
  const openMon = [...SECTIONS.filter((s) => mon[s.id]?.open), ...(mon.diag?.open ? [{ id: "diag", title: "Вхідна діагностика", n: "🧭" }] : [])];

  page(
    h("section.hero.card",
      avBox,
      h("div.hero__info",
        h("h1", `Привіт, ${u.name}!`),
        h("div.rankline", h("span.rankbig", rk.icon), h("div",
          h("b", rk.title), h("div.note", rk.next ? `До звання «${rk.next.title}»: ${rk.next.xp - (u.xp || 0)} досвіду` : "Найвище звання!"),
          bar(rk.toNext, "var(--violet)"))),
        h("div.stats",
          stat("🪙", u.coins || 0, "монет"), stat("⭐", u.xp || 0, "досвіду"),
          stat("🔥", u.streak?.count || 0, "днів поспіль"), stat("💯", `${o.done}/${o.ready}`, "тем на 100 %"))),
      h("div.hero__ring", ring(o.avg, 120, 12), h("div.note", "середній прогрес"))),

    assigned.length ? h("section.card.assign",
      h("h2", "📌 Завдання від учителя"),
      h("div.assign__list", assigned.map((t) => {
        const d = state.settings.topics[t.id].deadline;
        const tp = topicPct(p[t.id]);
        const late = d && d < today() && tp < 100;
        return h("a.assign__item", { href: `#/topic/${t.id}` }, h("b", shortTitle(t)), d && h(`span.${late ? "late" : "note"}`, `до ${fmtDate(d)}`), h("span.mono", tp + "%"), bar(tp));
      }))) : null,

    h("section.quick",
      h("a.card.quick__item", { href: "#/review" }, h("span.quick__ic", "🔁"), h("b", "Робота над помилками"), h("span.note", due ? `Завдань для повторення: ${due}` : waiting ? `Наступне повторення — пізніше (${waiting})` : "Помилок немає 🎉")),
      h("a.card.quick__item", { href: "#/school" }, h("span.quick__ic", "🏫"), h("b", "3D-школа"), h("span.note", "Гуляй школою разом з однокласниками")),
      h("a.card.quick__item", { href: "#/shop" }, h("span.quick__ic", "🎨"), h("b", "Персонаж"), h("span.note", `${Object.keys(u.owned || {}).length} речей · ${ITEMS.length} у магазині`)),
      ...openMon.map((s) => h("a.card.quick__item.quick__item--mon", { href: `#/monitoring/${s.id}` }, h("span.quick__ic", "📋"), h("b", s.id === "diag" ? s.title : `Моніторингова робота: ${s.title}`), h("span.note", "Відкрив учитель")))),

    ...SECTIONS.map((s) => {
      const ts = TOPICS.filter((t) => t.s === s.id);
      return h("section.sec",
        h("h2.sec__title", h("span.sec__n", { style: { background: s.color } }, s.n), s.title),
        h("div.topics", ts.map((t) => topicCard(t, p[t.id]))));
    }),
    leaderboardBlock());
  avatarPreview(avBox, u.avatar, { size: 200 });
}
const days = (n) => (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "дні" : n % 10 === 1 && n % 100 !== 11 ? "день" : "днів");
const stat = (ic, v, l) => h("div.stat", h("span", ic), h("b", v), h("small", l));

function topicCard(t, pr) {
  const v = topicPct(pr);
  if (!t.ready) return h("div.tcard.tcard--soon", h("div.tcard__t", shortTitle(t)), h("div.note", `Уроки ${t.lessons} · незабаром`));
  if (!topicOpen(t.id)) return h("div.tcard.tcard--locked", h("div.tcard__t", shortTitle(t)), h("div.note", "🔒 Відкриє вчитель"));
  return h(`a.tcard${v === 100 ? ".tcard--done" : ""}`, { href: `#/topic/${t.id}` },
    h("div.tcard__t", shortTitle(t)),
    h("div.tcard__b", ring(v, 54, 7, v === 100 ? "var(--right)" : "var(--lime)"), h("div.note", `Уроки ${t.lessons}`, h("br"), v === 100 ? "🏆 Опановано" : `${LEVELS_PER_TOPIC} рівнів`)));
}

function leaderboardBlock() {
  if (!state.settings?.leaderboard) return null;
  const box = h("section.card.leader", h("h2", `🏆 Рейтинг класу ${state.user.cls}`), h("p.note", "Завантаження…"));
  read("public").then((all) => {
    const list = Object.entries(all || {}).filter(([, s]) => s.cls === state.user.cls).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0));
    const me = list.findIndex(([uid]) => uid === state.uid);
    box.replaceChildren(h("h2", `🏆 Рейтинг класу ${state.user.cls}`),
      h("ol.leader__list", list.slice(0, 5).map(([uid, s], i) => h(`li${uid === state.uid ? ".me" : ""}`, h("span.leader__n", ["🥇", "🥈", "🥉", "4", "5"][i]), h("b", s.name), h("span.note", rankOf(s.xp).title), h("span.mono", `${s.xp || 0} ⭐`)))),
      me >= 5 ? h("p", `Твоє місце: ${me + 1}. Кожне правильне завдання наближає тебе до п’ятірки лідерів!`) : null,
      h("p.note", "Рейтинг рахує досвід: 10 ⭐ за кожне нове розв’язане завдання й 50 ⭐ за кожен значок."));
  }).catch(() => box.remove());
  return box;
}

// ---------- Сторінка теми ----------
async function topicPage(id) {
  const t = topicById[id];
  if (!t?.ready || !topicOpen(id)) return go("#/");
  page(h("div.loading", "Завантаження теми…"));
  const T = await loadTopic(id);
  const pr = state.progress?.[id] || {};
  const v = topicPct(pr);
  const mistakesHere = Object.values(state.mistakes || {}).filter((m) => m.topic === id);

  const theory = h("section.theory", T.theory.map((b, i) => h("article.rule.card", { id: `rule-${b.id || i}` },
    h("div.rule__text", h("h3", b.title), h("div", { html: b.html }),
      b.say && h("div.sayrow", b.say.map((w) => h("button.saybtn", { onclick: () => say(w) }, "🔊 ", w)))),
    b.figure && h("figure.rule__fig", { html: b.figure }))));
  theory.addEventListener("click", (e) => { const s = e.target.closest("[data-say]"); if (s) say(s.dataset.say); });

  const levels = h("div.levels", T.levels.map((L, i) => {
    const n = i + 1, st = pr.levels?.[n];
    return h("div.lvl.card",
      h("div.lvl__n", n), h("div.lvl__info", h("b", L.title), h("div.note", st ? `Найкраще: ${st.best}/${TASKS_PER_LEVEL} · спроб: ${st.attempts}` : "Ще не пройдено"), bar(((st?.best || 0) / TASKS_PER_LEVEL) * 100, st?.best === TASKS_PER_LEVEL ? "var(--right)" : "var(--lime)")),
      h("button.btn.btn--primary", { onclick: () => go(`#/play/${id}/${n}`) }, st ? "Ще раз" : "Почати"));
  }));

  page(
    h("a.back", { href: "#/" }, "← До тем"),
    h("section.topichead.card",
      h("div", h("div.note", `${sectionById[t.s].title} · уроки ${t.lessons}`), h("h1", t.title), T.intro && h("p.lead", T.intro), h("p.note", `За підручником: ${BOOK}`)),
      ring(v, 110, 12, v === 100 ? "var(--right)" : "var(--lime)")),
    h("h2.sec__title", "📖 Теорія"),
    theory,
    h("h2.sec__title", "🎯 Рівні (по 10 завдань)"),
    h("p.note", `Відсоток теми — сума найкращих результатів усіх рівнів. Перший правильний розв’язок: +${ECONOMY.firstSolve} 🪙, 10 з 10: +${ECONOMY.levelPerfect} 🪙, тема на 100 %: +${ECONOMY.topicPerfect} 🪙.`),
    levels,
    mistakesHere.length ? h("section.card.recs", h("h3", "🔎 Що повторити"), recsFromTasks(T, mistakesHere.map((m) => m.id)), h("a.btn", { href: "#/review" }, "До роботи над помилками")) : null);
}

// Рекомендації: за правилами, у яких були помилки
function recsFromTasks(T, wrongIds) {
  const all = T.levels.flatMap((L) => L.tasks);
  const count = {};
  wrongIds.forEach((id) => { const tk = all.find((x) => x.id === id); if (tk?.rule) count[tk.rule] = (count[tk.rule] || 0) + 1; });
  const tags = Object.entries(count).sort((a, b) => b[1] - a[1]);
  if (!tags.length) return h("p", "Помилок немає — так тримати!");
  return h("ul.recs__list", tags.map(([tag, n]) => {
    const rule = T.rules[tag] || { title: tag, text: "" };
    return h("li", h("b", rule.title), h("span.badge", `помилок: ${n}`), h("div", { html: rule.text }),
      rule.block != null && h("a.note", { href: `#/topic/${T.id}`, onclick: () => setTimeout(() => document.getElementById(`rule-${rule.block}`)?.scrollIntoView({ behavior: "smooth" }), 300) }, "→ перечитати в теорії"));
  }));
}

// ---------- Проходження рівня ----------
async function playLevel(id, n) {
  const t = topicById[id];
  if (!t?.ready || !topicOpen(id)) return go("#/");
  const T = await loadTopic(id);
  const L = T.levels[n - 1];
  if (!L) return go(`#/topic/${id}`);
  runQuiz({
    title: shortTitle(t), subtitle: `Рівень ${n}: ${L.title}`, type: "level", rules: T.rules,
    tasks: shuffle(L.tasks).map((x) => ({ ...x, topic: id })),
    exit: () => go(`#/topic/${id}`),
    onFinish: async (answers, start) => {
      mount(h("div.loading", "Зберігаю результат…"));
      let res;
      try { res = await saveSession({ type: "level", topic: id, level: n, start, answers }); } catch (e) { toast(errText(e), "warn", 6000); return go(`#/topic/${id}`); }
      resultPage(res, T, { again: `#/play/${id}/${n}`, next: n < T.levels.length ? `#/play/${id}/${n + 1}` : null, back: `#/topic/${id}` });
    },
  });
}

function resultPage(res, T, links) {
  const p = res.pct;
  const wrong = res.answers.filter((a) => !a.ok);
  const mood = p === 100 ? ["🏆", "Бездоганно!"] : p >= 80 ? ["🌟", "Дуже добре!"] : p >= 60 ? ["👍", "Непогано!"] : ["💪", "Є над чим попрацювати"];
  page(
    h("section.result.card",
      h("div.result__big", mood[0]), h("h1", mood[1]),
      h("div.result__score", ring(p, 130, 12, p >= 80 ? "var(--right)" : p >= 60 ? "var(--yellow)" : "var(--wrong)"), h("div", h("b.mono", `${res.correct} / ${res.total}`), h("div.note", "правильних відповідей"))),
      h("div.stats",
        stat("🪙", `+${res.coins}`, "монет"), stat("⭐", `+${res.xp}`, "досвіду"),
        stat("⏱️", `${Math.floor(res.durSec / 60)}:${String(res.durSec % 60).padStart(2, "0")}`, "час"),
        stat("🐢", `${num(res.avgSec)} с`, "на завдання")),
      res.streakBonus ? h("p.win", res.streak > 1 ? `🔥 ${res.streak} ${days(res.streak)} поспіль! Бонус +${res.streakBonus} 🪙` : `🔥 Перший день серії! Бонус +${res.streakBonus} 🪙. Приходь завтра — бонус зросте.`) : null,
      res.topicNowPerfect ? h("p.win", `💯 Тему опановано на 100 %! Бонус +${ECONOMY.topicPerfect} 🪙`) : null,
      res.fast ? h("p.warnbox", `⚡ ${res.fast} відповідей були занадто швидкими. За них не нараховано монет і досвіду, а вчитель бачить позначку швидкості. Читай кожне завдання уважно!`) : null),
    T && h("section.card.recs",
      h("h2", "🔎 Рекомендації"),
      wrong.length ? [h("p", "Зверни увагу на ці правила:"), recsFromTasks(T, wrong.map((a) => a.id)),
        h("p.note", "Завдання з помилками потраплять у «Роботу над помилками»: повтори їх завтра.")]
        : h("p", "Помилок немає! Спробуй наступний рівень або допоможи однокласнику 🙂"),
      res.hints ? h("p.note", `Ти купив(-ла) підказок: ${res.hints}. Наступного разу спершу перечитай теорію — це безкоштовно 😉`) : null),
    h("div.row.gap.center",
      links.back && h("a.btn", { href: links.back }, "До теми"),
      links.again && h("a.btn", { href: links.again }, "Пройти ще раз"),
      links.next && h("a.btn.btn--primary", { href: links.next }, "Наступний рівень →")));
}

// ---------- Робота над помилками ----------
async function review() {
  const due = Object.values(state.mistakes || {}).filter((m) => m.due <= Date.now()).slice(0, 15);
  if (!due.length) {
    const next = Object.values(state.mistakes || {}).sort((a, b) => a.due - b.due)[0];
    return page(h("a.back", { href: "#/" }, "← На головну"), h("section.card.center",
      h("div.result__big", "🎉"), h("h1", "Зараз нічого повторювати"),
      h("p", next ? `Наступне повторення: ${fmtDate(next.due)} о ${fmtTime(next.due)}.` : "У тебе немає помилок, які треба повторити."),
      h("p.note", "Як це працює: завдання з помилкою повертається через день. Якщо розв’язуєш правильно — ще раз через тиждень. Двічі правильно — завдання засвоєно!")));
  }
  const tasks = [];
  const rules = {};
  for (const m of due) {
    if (!topicById[m.topic]?.ready) continue;
    const T = await loadTopic(m.topic);
    Object.assign(rules, T.rules);
    const tk = T.levels.flatMap((L) => L.tasks).find((x) => x.id === m.id);
    if (tk) tasks.push({ ...tk, topic: m.topic });
  }
  runQuiz({
    title: "Робота над помилками", subtitle: `${tasks.length} завдань`, type: "review", rules, tasks: shuffle(tasks),
    exit: () => go("#/"),
    onFinish: async (answers, start) => {
      mount(h("div.loading", "Зберігаю…"));
      const res = await saveSession({ type: "review", title: "Робота над помилками", start, answers });
      resultPage(res, null, { back: "#/" });
    },
  });
}

// ---------- Моніторингові роботи ----------
async function monitoring(sid) {
  const mon = state.settings?.monitoring?.[sid];
  if (!mon?.open) return go("#/");
  const isDiag = sid === "diag";
  const topics = TOPICS.filter((t) => t.ready && (isDiag || t.s === sid));
  if (!topics.length) return page(h("a.back", { href: "#/" }, "← На головну"), h("p.card", "У цьому розділі ще немає готових тем."));
  const per = isDiag ? 3 : Math.max(2, Math.ceil(25 / topics.length));
  const tasks = [], rules = {};
  for (const t of topics) {
    const T = await loadTopic(t.id);
    Object.assign(rules, T.rules);
    // беремо завдання з усіх рівнів рівномірно
    const pool = shuffle(T.levels.flatMap((L, li) => L.tasks.map((x) => ({ ...x, topic: t.id, li }))));
    tasks.push(...pool.slice(0, per));
  }
  const title = isDiag ? "Вхідна діагностика" : `Моніторингова робота: ${sectionById[sid].title}`;
  page(h("a.back", { href: "#/" }, "← На головну"), h("section.card.center",
    h("div.result__big", "📋"), h("h1", title),
    h("p", `${tasks.length} завдань із тем: ${topics.map(shortTitle).join(", ")}.`),
    h("p.note", "Підказки працюють, але коштують дорого. Результат побачить учитель. Пройти можна кілька разів — зберігаються всі спроби."),
    h("button.btn.btn--primary.btn--big", { onclick: start }, "Почати")));
  function start() {
    runQuiz({
      title, type: "monitoring", rules, tasks: shuffle(tasks).slice(0, isDiag ? 30 : 25),
      exit: () => go("#/"),
      onFinish: async (answers, st) => {
        mount(h("div.loading", "Зберігаю…"));
        const res = await saveSession({ type: "monitoring", monitoringId: sid, title, start: st, answers });
        resultPage(res, null, { back: "#/" });
      },
    });
  }
}

// ---------- Персонаж і магазин ----------
function shop() {
  const u = state.user;
  let cat = "top";
  let draft = fullAvatar(u.avatar);
  const prev = h("div.shop__prev");
  const grid = h("div.shop__grid");
  const tabs = h("div.shop__tabs");
  const rkLevel = rankOf(u.xp).level;
  const info = h("p.note");
  // Зберігаємо лише куплені або безкоштовні речі; примірене без оплати повертаємо назад
  const wearable = (d, bought) => {
    const ok = (id) => { const it = itemById[id]; return !it || isFree(it) || id === bought || owns(id); };
    const saved = fullAvatar(state.user.avatar);
    const out = { ...d }; let dropped = 0;
    for (const c of Object.keys(out)) if (!ok(out[c])) { out[c] = ok(saved[c]) ? saved[c] : fullAvatar({})[c]; dropped++; }
    return [out, dropped];
  };
  async function save(bought) {
    const [clean, dropped] = wearable(draft, bought);
    await saveAvatar(clean);
    if (dropped) { draft = clean; view.set(draft); toast("Збережено лише куплені речі. Приміряне без оплати знято 🙂", "info", 3500); }
    return dropped;
  }
  page(h("section.shop",
    h("div.shop__left.card", prev,
      h("div.note.center", "Покрути персонажа пальцем або мишкою"),
      h("button.btn.btn--primary", { onclick: async () => { if (!(await save())) toast("Образ збережено ✨", "win"); draw(); } }, "💾 Зберегти образ"),
      info),
    h("div.shop__right", tabs, grid)));
  const view = avatarPreview(prev, draft, { size: Math.min(320, innerWidth - 64) });

  function draw() {
    const owned = state.user.owned || {};
    info.textContent = `Монет: ${state.user.coins || 0} 🪙. Речей: ${Object.keys(owned).length}. Деякі речі відкриваються лише з певним званням.`;
    tabs.replaceChildren(...CATEGORIES.map((c) => h(`button.chipbtn${c.id === cat ? ".on" : ""}`, { onclick: () => { cat = c.id; draw(); } }, c.icon, " ", c.title)));
    grid.replaceChildren(...ITEMS.filter((i) => i.cat === cat).map((it) => {
      const own = isFree(it) || owns(it.id);
      const locked = it.rank > rkLevel;
      const on = draft[cat] === it.id;
      const swatch = it.data.color && it.data.color !== "rainbow" ? h("span.swatch", { style: { background: it.data.color } }) : null;
      return h(`button.item${on ? ".on" : ""}${own ? ".own" : ""}${locked ? ".locked" : ""}`, { onclick: () => pick(it, own, locked) },
        swatch, h("b", it.name),
        h("span.item__p", own ? (on ? "✓ одягнено" : "твоє") : locked ? `🔒 ${RANKS[it.rank - 1].title}` : `${it.price} 🪙`));
    }));
  }
  async function pick(it, own, locked) {
    if (!own) {
      if (locked) return toast(`Ця річ відкривається зі званням «${RANKS[it.rank - 1].title}»`, "warn");
      draft[it.cat] = it.id; view.set(draft); // примірка
      if ((state.user.coins || 0) < it.price) { draw(); return toast(`Примірка 👀 Потрібно ${it.price} 🪙, у тебе ${state.user.coins || 0}.`, "info", 3000); }
      const close = modal(h("div.center", h("h2", it.name), h("p", `Купити за ${it.price} 🪙?`),
        h("div.row.gap.center", h("button.btn.btn--primary", { onclick: async () => { close(); if (await buyItem(it)) { toast(`Куплено! −${it.price} 🪙`, "win"); await save(it.id); } draw(); } }, "Купити"),
          h("button.btn", { onclick: () => { close(); draw(); } }, "Лише приміряти"))));
      return;
    }
    draft[it.cat] = it.id; view.set(draft); draw();
  }
  draw();
}

// ---------- Профіль і прогрес ----------
async function profile() {
  const u = state.user, p = state.progress || {};
  const rk = rankOf(u.xp);
  const attemptsBox = h("div.card", h("p.note", "Завантаження історії…"));
  const pin1 = pinInput("Новий PIN"), pin2 = pinInput("Ще раз");

  page(
    h("section.card.profhead",
      h("div", h("h1", u.name), h("p.note", `Клас ${u.cls}`), h("div.rankline", h("span.rankbig", rk.icon), h("b", rk.title))),
      h("button.btn", { onclick: () => { logout(); go("#/"); } }, "Вийти")),
    h("h2.sec__title", "🪜 Звання"),
    h("div.ranks", RANKS.map((r, i) => h(`div.rankstep${i < rk.level ? ".got" : ""}${i === rk.level - 1 ? ".cur" : ""}`, h("span", r.icon), h("b", r.title), h("small", `${r.xp} ⭐`)))),
    h("h2.sec__title", "📈 Прогрес за темами"),
    h("div.card.chart", TOPICS.filter((t) => t.ready).map((t) => { const v = topicPct(p[t.id]); return h("div.chart__row", h("span", shortTitle(t)), bar(v, v === 100 ? "var(--right)" : "var(--lime)"), h("b.mono", v + "%")); })),
    h("h2.sec__title", "🏅 Значки"),
    h("div.badges", BADGES.map((b) => h(`div.badgecard${u.badges?.[b.id] ? ".got" : ""}`, h("span.badgecard__i", b.icon), h("b", b.title), h("small", b.text)))),
    h("h2.sec__title", "🗂️ Історія спроб"),
    attemptsBox,
    h("h2.sec__title", "🔑 Змінити PIN"),
    h("div.card.row.gap", pin1, pin2, h("button.btn", { onclick: async () => {
      if (pin1.value.length !== 4 || pin1.value !== pin2.value) return toast("PIN-коди мають бути з 4 цифр і збігатися", "warn");
      try { await changePin(state.uid, pin1.value); toast("PIN змінено", "win"); } catch (e) { toast(errText(e) + " Вийди й увійди знову, потім зміни PIN.", "warn", 5000); }
    } }, "Зберегти")));

  const at = Object.values(await loadAttempts()).sort((a, b) => b.end - a.end);
  attemptsBox.replaceChildren(at.length ? h("div.tablewrap", h("table.tbl",
    h("thead", h("tr", ["Дата", "Що", "Результат", "Час", "Монети"].map((x) => h("th", x)))),
    h("tbody", at.slice(0, 50).map((a) => h("tr",
      h("td", `${fmtDate(a.end)} ${fmtTime(a.end)}`),
      h("td", a.type === "level" ? `${shortTitle(topicById[a.topic] || { title: a.topicTitle })}, рівень ${a.level}` : a.topicTitle),
      h("td", h("b", `${a.pct}%`), ` (${a.correct}/${a.total})`, a.flagged ? " ⚡" : ""),
      h("td.mono", `${Math.round(a.durSec / 60)} хв`),
      h("td.mono", `+${a.coins}`)))))) : h("p.note", "Ще немає спроб."));
}

route();
