// Урок: учитель ставить паузу або показує завдання — у учнів екран блокується й видно лише це.
// Дані: settings/stage = { lock, cls, show: { topic, id, label } | null, reveal, at }
import { h } from "./ui.js";
import { state, onChange } from "./store.js";
import { renderTask, kindLabel, rightAnswer } from "./quiz.js";
import { topicById, shortTitle } from "../content/index.js";
import { monWorks } from "../content/monitoring/index.js";

const MAX_AGE = 3 * 3600e3; // забута пауза сама знімається через 3 години
let el = null, key = "", started = false;

// Завдання з будь-якого рівня або моніторингової роботи теми
async function findTask(topic, id) {
  const T = (await import(`../content/topics/${topic}.js`)).default;
  for (const L of T.levels) { const t = L.tasks.find((x) => x.id === id); if (t) return { T, t }; }
  for (const w of monWorks(topic)) { const t = (await import(`../content/monitoring/${w.id}.js`)).default.tasks.find((x) => x.id === id); if (t) return { T, t }; }
  return null;
}

// Поки екран заблоковано, клавіші не доходять до сторінки (3D-школа, тест), крім вікна питання вчителя
const block = (e) => { if (el && !e.target.closest?.(".liveq")) { e.stopImmediatePropagation(); if (!e.metaKey && !e.ctrlKey) e.preventDefault(); } };

export function startStage() {
  if (started) return;
  started = true;
  onChange(apply);
  addEventListener("keydown", block, true);
  addEventListener("keyup", block, true);
  apply(state);
}

function apply(s) {
  const st = s.settings?.stage;
  const mine = !!(st && s.user && !s.teacher && (st.lock || st.show) && Date.now() - (st.at || 0) < MAX_AGE && (!st.cls || st.cls === "all" || st.cls === s.user.cls));
  const k = mine ? JSON.stringify([st.lock, st.show, st.reveal]) : "";
  if (k === key) return;
  key = k;
  if (!mine) { el?.remove(); el = null; return; }
  render(st, k);
}

async function render(st, k) {
  if (!el) { el = h("div.stage", { role: "dialog", "aria-modal": "true" }); document.body.append(el); document.activeElement?.blur?.(); navigator.vibrate?.(120); }
  if (!st.show) {
    el.replaceChildren(h("div.stage__card.stage__card--pause",
      h("div.stage__ear", "👂"), h("h2", "Учитель пояснює"),
      h("p", "Відклади мишку й телефон — слухай уважно."), h("p.note", "Сайт продовжить роботу, щойно вчитель зніме паузу. Нічого не загубиться.")));
    return;
  }
  el.replaceChildren(h("div.stage__card", h("p.note", "Завантаження завдання…")));
  const f = await findTask(st.show.topic, st.show.id).catch(() => null);
  if (k !== key || !el) return; // поки вантажили, учитель уже щось змінив
  if (!f) return el.replaceChildren(h("div.stage__card", h("h2", "Дивись на дошку 👀")));
  const { T, t } = f;
  const view = renderTask(t);
  el.replaceChildren(h("div.stage__card.stage__card--task",
    h("div.stage__top", h("span.stage__badge", "📺 Учитель показує завдання"), h("span.note", st.show.label || shortTitle(topicById[T.id] || { title: "" }))),
    h("div.task__kind", kindLabel(t)), t.q && h("h2.task__q", { html: t.q }),
    h("div.stage__task", { inert: "" }, view.el),
    st.reveal
      ? h("div.verdict.verdict--ok", h("div.verdict__top", h("b", "✓ Правильна відповідь: ", rightAnswer(t))), t.explain && h("div.explain", { html: t.explain }))
      : h("p.note.stage__think", "🤔 Подумай, яка відповідь правильна. Учитель покаже її згодом.")));
}
