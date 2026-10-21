// Рушій завдань: показ, перевірка, пояснення, захист від швидкого проходження, підказки.
import { h, mount, toast, shuffle, confirmBox, modal, num } from "./ui.js";
import { SPEED, ECONOMY } from "./config.js";
import { state, coinsFor, buyHint, coins } from "./store.js";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[ʼ'`´‘]/g, "’").replace(/\s+/g, " ").replace(/[.!?]$/, "").trim();

// Скільки тексту в завданні → мінімальний розумний час на відповідь
function minSecFor(t) {
  const text = [t.q, t.word, t.text, ...(t.options || []), ...(t.pairs || []).flat(), ...(t.items || []).map((i) => (Array.isArray(i) ? i[0] : i))].join(" ");
  return Math.min(SPEED.maxMinSec, Math.max(SPEED.minSec, Math.round(text.length / SPEED.charsPerSec)));
}

// Короткий текст завдання для таблиці вчителя
export function taskLabel(t) {
  const s = [t.q, t.word?.replace(/_/g, "…"), t.text].filter(Boolean).join(" ").replace(/<[^>]+>/g, "").replace(/\*/g, "").replace(/_/g, " ");
  return s.length > 140 ? s.slice(0, 137) + "…" : s;
}

// ---------- Типи завдань ----------
// Кожен рендерер повертає { el, ready(), value(), check(v), reveal(ok) }

const R = {};

R.choice = (t) => {
  const idx = t.options.map((o, i) => i);
  const order = t.noShuffle ? idx : shuffle(idx);
  let sel = null;
  const btns = order.map((i) => h("button.opt", { onclick: () => { sel = i; btns.forEach((b) => b.classList.toggle("on", b === btnByIdx[i])); onPick(); } }, t.options[i]));
  const btnByIdx = Object.fromEntries(order.map((i, k) => [i, btns[k]]));
  let onPick = () => {};
  return {
    el: h("div.opts", btns), autoSubmit: true, setOnPick: (f) => (onPick = f),
    ready: () => sel !== null, value: () => t.options[sel],
    check: () => sel === t.answer,
    reveal: () => { btnByIdx[t.answer].classList.add("right"); if (sel !== t.answer) btnByIdx[sel]?.classList.add("wrong"); },
  };
};
R.tf = (t) => R.choice({ ...t, options: ["Правильно", "Неправильно"], answer: t.answer ? 0 : 1, noShuffle: true });

R.multi = (t) => {
  const order = shuffle(t.options.map((o, i) => i));
  const sel = new Set();
  const btns = {};
  order.forEach((i) => (btns[i] = h("button.opt.opt--multi", { onclick: () => { sel.has(i) ? sel.delete(i) : sel.add(i); btns[i].classList.toggle("on"); } }, t.options[i])));
  const ans = new Set(t.answer);
  return {
    el: h("div", h("p.note", "Обери всі правильні варіанти"), h("div.opts", order.map((i) => btns[i]))),
    ready: () => sel.size > 0, value: () => [...sel].map((i) => t.options[i]).join("; "),
    check: () => sel.size === ans.size && [...sel].every((i) => ans.has(i)),
    reveal: () => order.forEach((i) => { if (ans.has(i)) btns[i].classList.add("right"); else if (sel.has(i)) btns[i].classList.add("wrong"); }),
  };
};

R.input = (t) => {
  const inp = h("input.input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: t.placeholder || "Впиши відповідь" });
  const answers = [].concat(t.answer).map(norm);
  const apo = h("button.btn.btn--small", { type: "button", onclick: () => { inp.setRangeText("’", inp.selectionStart, inp.selectionEnd, "end"); inp.focus(); } }, "’ апостроф");
  return {
    el: h("div.inputrow", inp, apo), focus: () => inp.focus(), input: inp,
    ready: () => inp.value.trim() !== "", value: () => inp.value.trim(),
    check: () => answers.includes(norm(inp.value)),
    reveal: (ok) => { inp.classList.add(ok ? "right" : "wrong"); inp.disabled = true; },
  };
};

// Слово з пропуском: «сім_я» + кнопки «’», «ь», «нічого»
R.gap = (t) => {
  let sel = null;
  const word = h("div.gapword");
  const label = (o) => (o === "—" ? "нічого" : o);
  const draw = (fill, cls = "") => word.replaceChildren(...t.word.split("_").flatMap((p, i, a) => (i < a.length - 1 ? [p, h(`span.gap${cls}`, fill ?? "…")] : [p])));
  draw(null);
  const btns = t.options.map((o) => h("button.opt.opt--gap", { "data-v": o, onclick: () => { sel = o; btns.forEach((b) => b.classList.toggle("on", b.dataset.v === o)); draw(o === "—" ? "·" : o, ".gap--on"); onPick(); } }, label(o)));
  let onPick = () => {};
  return {
    el: h("div", word, h("div.opts.opts--row", btns)), autoSubmit: true, setOnPick: (f) => (onPick = f),
    ready: () => sel !== null, value: () => t.word.replace("_", sel === "—" ? "" : sel),
    check: () => sel === t.answer,
    reveal: () => { draw(t.answer === "—" ? "" : t.answer, ".gap--right"); btns.forEach((b) => { if (b.dataset.v === t.answer) b.classList.add("right"); else if (b.dataset.v === sel) b.classList.add("wrong"); }); },
  };
};

// Відповідність: ліворуч — поняття, праворуч — вибір зі списку
R.match = (t) => {
  const rights = shuffle(t.pairs.map((p) => p[1]));
  const sels = t.pairs.map(([l]) => h("select.select", h("option", { value: "" }, "— обери —"), rights.map((x) => h("option", { value: x }, x))));
  return {
    el: h("div.match", t.pairs.map(([l], i) => h("div.match__row", h("div.match__l", l), sels[i]))),
    ready: () => sels.every((s) => s.value), value: () => sels.map((s, i) => `${t.pairs[i][0]} → ${s.value}`).join("; "),
    check: () => sels.every((s, i) => s.value === t.pairs[i][1]),
    reveal: () => sels.forEach((s, i) => { const ok = s.value === t.pairs[i][1]; s.classList.add(ok ? "right" : "wrong"); s.disabled = true; if (!ok) s.after(h("div.match__fix", "✓ " + t.pairs[i][1])); }),
  };
};

// Розподіл: кожне слово — в одну з груп
R.sort = (t) => {
  const items = shuffle(t.items.map((it, i) => i));
  const pick = {};
  const rows = {};
  items.forEach((i) => {
    const [txt] = t.items[i];
    const bs = t.groups.map((g, gi) => h("button.chipbtn", { onclick: () => { pick[i] = gi; bs.forEach((b, k) => b.classList.toggle("on", k === gi)); } }, g));
    rows[i] = h("div.sort__row", h("div.sort__w", txt), h("div.sort__g", bs));
    rows[i]._bs = bs;
  });
  return {
    el: h("div.sort", items.map((i) => rows[i])),
    ready: () => items.every((i) => pick[i] !== undefined), value: () => items.map((i) => `${t.items[i][0]}: ${t.groups[pick[i]]}`).join("; "),
    check: () => items.every((i) => pick[i] === t.items[i][1]),
    reveal: () => items.forEach((i) => { const ok = pick[i] === t.items[i][1]; rows[i].classList.add(ok ? "right" : "wrong"); rows[i]._bs[t.items[i][1]].classList.add("right"); }),
  };
};

// Познач слова в тексті: правильні позначені * у t.text
R.pick = (t) => {
  const toks = t.text.split(/\s+/).map((w) => ({ w: w.replace(/^\*/, "").replace(/_/g, " "), ok: w.startsWith("*") }));
  const sel = new Set();
  const spans = toks.map((tk, i) => h("button.word", { onclick: () => { sel.has(i) ? sel.delete(i) : sel.add(i); spans[i].classList.toggle("on"); } }, tk.w));
  return {
    el: h("div", h("p.note", "Натискай на слова в тексті"), h("div.pick", spans)),
    ready: () => sel.size > 0, value: () => [...sel].map((i) => toks[i].w).join(", "),
    check: () => toks.every((tk, i) => tk.ok === sel.has(i)),
    reveal: () => toks.forEach((tk, i) => { if (tk.ok) spans[i].classList.add("right"); else if (sel.has(i)) spans[i].classList.add("wrong"); }),
  };
};

// Порядок: натискай елементи в правильній послідовності
R.order = (t) => {
  const pool = shuffle(t.items.map((x, i) => i));
  const seq = [];
  const out = h("div.order__out");
  const btns = {};
  const draw = () => out.replaceChildren(...(seq.length ? seq.map((i) => h("button.chipbtn.on", { onclick: () => { seq.splice(seq.indexOf(i), 1); btns[i].disabled = false; draw(); } }, t.items[i])) : [h("span.note", "Натискай у правильному порядку…")]));
  pool.forEach((i) => (btns[i] = h("button.chipbtn", { onclick: () => { seq.push(i); btns[i].disabled = true; draw(); } }, t.items[i])));
  draw();
  return {
    el: h("div.order", out, h("div.order__pool", pool.map((i) => btns[i]))),
    ready: () => seq.length === t.items.length, value: () => seq.map((i) => t.items[i]).join(t.joiner ?? " "),
    check: () => seq.every((v, k) => t.items[v] === t.items[k]),
    reveal: (ok) => { out.classList.add(ok ? "right" : "wrong"); if (!ok) out.after(h("div.match__fix", "✓ " + t.items.join(t.joiner ?? " "))); },
  };
};

// ---------- Сесія ----------
// opts: { title, subtitle, tasks:[{...task, topic}], type, topic, level, rules, onFinish(answers, start) , exit() }
export function runQuiz(opts) {
  const tasks = opts.tasks;
  const answers = [];
  const start = Date.now();
  let i = 0, fastStreak = 0;

  const head = h("div.quiz__head");
  const body = h("div.quiz__body");
  const shell = h("section.quiz", head, body);
  mount(shell);
  const leave = async () => { if (answers.length === 0 || (await confirmBox("Вийти? Результат цієї спроби не збережеться."))) opts.exit(); };

  function drawHead() {
    head.replaceChildren(
      h("button.btn.btn--ghost.btn--small", { onclick: leave }, "← Вийти"),
      h("div.quiz__title", h("b", opts.title), opts.subtitle && h("span", opts.subtitle)),
      h("div.quiz__meta", h("span.mono", `${Math.min(i + 1, tasks.length)} / ${tasks.length}`), h("span.coinpill", "🪙 ", h("b", coins()))),
      h("div.quiz__dots", tasks.map((_, k) => h(`span.dot${k < answers.length ? (answers[k].ok ? ".dot--ok" : ".dot--bad") : k === i ? ".dot--cur" : ""}`))));
  }

  function show() {
    if (i >= tasks.length) return opts.onFinish(answers, start);
    drawHead();
    const t = tasks[i];
    const view = R[t.type](t);
    const shownAt = performance.now();
    const minSec = minSecFor(t);
    let hintUsed = false;
    const hintBox = h("div.hintbox");
    const check = h("button.btn.btn--primary.btn--big", { onclick: submit }, "Перевірити");
    const hintBtn = h("button.btn.btn--hint", { onclick: hint }, `💡 Підказка · ${ECONOMY.hintPrice} 🪙`);
    const card = h("div.task",
      h("div.task__kind", kindLabel(t)),
      t.q && h("h2.task__q", { html: t.q }),
      view.el, hintBox,
      h("div.task__actions", hintBtn, view.autoSubmit ? null : check));
    body.replaceChildren(card);
    view.focus?.();
    view.input?.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    view.setOnPick?.(() => setTimeout(submit, 180));
    let done = false;

    async function hint() {
      if (hintUsed) return;
      if (coins() < ECONOMY.hintPrice) return toast(`Підказка коштує ${ECONOMY.hintPrice} 🪙. У тебе ${coins()}. Розв’язуй завдання, щоб заробити!`, "warn", 3500);
      if (!(await confirmBox(`Купити підказку за ${ECONOMY.hintPrice} 🪙? Це дорого: приблизно 30 правильних відповідей. Монети за це завдання не нараховуються.`, "Купити"))) return;
      if (!(await buyHint())) return;
      hintUsed = true;
      hintBtn.disabled = true;
      const rule = opts.rules?.[t.rule];
      hintBox.replaceChildren(h("div.hint", h("b", "💡 Підказка: "), h("span", { html: t.hint || rule?.text || "Перечитай правило в теорії." })));
      drawHead();
    }

    function submit() {
      if (done) return;
      if (!view.ready()) return toast("Спершу дай відповідь 🙂", "info");
      const sec = Math.round((performance.now() - shownAt) / 100) / 10;
      const fast = sec < minSec;
      done = true;
      const ok = view.check();
      view.reveal(ok);
      if (fast) {
        fastStreak++;
        toast(fastStreak >= SPEED.pauseAfter ? "Стоп! Ти відповідаєш занадто швидко." : `⚡ Занадто швидко (${num(sec)} с)! Читай завдання уважно — за поспіх монети не нараховуються.`, "warn", 3800);
      } else fastStreak = 0;
      const earned = ok && !hintUsed ? coinsFor(t.topic, t.id, { fast, review: opts.type === "review" }) : 0;
      answers.push({ id: t.id, topic: t.topic, q: taskLabel(t), ok, sec, fast, hint: hintUsed, coins: earned, given: String(view.value()).slice(0, 120) });
      hintBtn.remove(); check.remove();
      const next = h("button.btn.btn--primary.btn--big", { onclick: goNext }, i + 1 < tasks.length ? "Далі →" : "Завершити");
      card.append(h(`div.verdict.verdict--${ok ? "ok" : "bad"}`,
        h("div.verdict__top", h("b", ok ? pickPraise() : "Помилка"), earned ? h("span.coinpill", `+${earned} 🪙`) : null),
        h("div.explain", { html: t.explain })), next);
      next.focus({ preventScroll: true });
      next.scrollIntoView({ behavior: "smooth", block: "nearest" });
      drawHead();
    }

    function goNext() {
      i++;
      if (fastStreak >= SPEED.pauseAfter) return pause();
      show();
    }
  }

  function pause() {
    fastStreak = 0;
    document.getElementById("toasts")?.replaceChildren();
    let left = SPEED.pauseSec;
    const num = h("div.pause__n", left);
    const close = modal(h("div.pause",
      h("div.pause__icon", "🐢"),
      h("h2", "Зроби паузу"),
      h("p", `Ти відповів(-ла) на ${SPEED.pauseAfter} завдання поспіль занадто швидко. Учитель бачить швидкість проходження. Подихай, а потім читай завдання уважно.`),
      num), { closable: false });
    const timer = setInterval(() => { left--; num.textContent = left; if (left <= 0) { clearInterval(timer); close(); show(); } }, 1000);
  }

  show();
}

const praise = ["Правильно!", "Чудово!", "Так тримати!", "Влучно!", "Молодець!", "Бездоганно!"];
const pickPraise = () => praise[Math.floor(Math.random() * praise.length)];
function kindLabel(t) {
  return { choice: "Обери відповідь", tf: "Правильно чи ні?", multi: "Кілька відповідей", input: "Впиши відповідь", gap: "Встав пропущене", match: "Знайди пару", sort: "Розподіли", pick: "Знайди в тексті", order: "Склади в порядку" }[t.type];
}
