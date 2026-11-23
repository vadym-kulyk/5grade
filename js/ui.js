// Дрібні помічники для інтерфейсу.

// h("div.card#id", {onclick}, children...) — створює елемент
export function h(sel, attrs, ...kids) {
  if (attrs == null || typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs)) {
    if (attrs != null) kids.unshift(attrs);
    attrs = {};
  }
  const [tag, ...rest] = sel.split(/(?=[.#])/);
  const el = document.createElement(tag || "div");
  for (const p of rest) {
    if (p[0] === ".") el.classList.add(p.slice(1));
    else el.id = p.slice(1);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Назва сайту замість логотипа
export const wordmark = (cls = "") => h(`span.wordmark${cls}`, "Дослівно");

export function mount(...kids) {
  const app = $("#app");
  app.replaceChildren();
  add(app, kids);
  window.scrollTo(0, 0);
}

export function toast(text, kind = "info", ms = 2600) {
  let box = $("#toasts");
  if (!box) { box = h("div#toasts"); document.body.append(box); }
  while (box.children.length >= 2) box.firstChild.remove();
  const t = h(`div.toast.toast--${kind}`, text);
  box.append(t);
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function modal(content, { closable = true, wide = false } = {}) {
  const close = () => wrap.remove();
  const wrap = h("div.modal", { onclick: (e) => { if (closable && e.target === wrap) close(); } },
    h(`div.modal__box${wide ? ".modal__box--wide" : ""}`,
      closable && h("button.modal__x", { onclick: close, "aria-label": "Закрити" }, "×"),
      content));
  document.body.append(wrap);
  return close;
}

export function confirmBox(text, okText = "Так") {
  return new Promise((res) => {
    const close = modal(h("div",
      h("p.lead", text),
      h("div.row.gap",
        h("button.btn.btn--primary", { onclick: () => { close(); res(true); } }, okText),
        h("button.btn", { onclick: () => { close(); res(false); } }, "Скасувати"))), { closable: false });
  });
}

export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const num = (n) => Number(n || 0).toLocaleString("uk-UA");
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const fmtDate = (t) => new Date(t).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtTime = (t) => new Date(t).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
export const today = (t = Date.now()) => new Date(t).toLocaleDateString("sv-SE"); // РРРР-ММ-ДД за місцевим часом

// Кругова діаграма прогресу (SVG)
export function ring(value, size = 64, stroke = 8, color = "var(--lime)") {
  const rr = (size - stroke) / 2, c = 2 * Math.PI * rr, off = c * (1 - Math.min(100, value) / 100);
  return h("div.ring", { style: { width: size + "px", height: size + "px" }, html:
    `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${rr}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${rr}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg><span class="ring__v">${Math.round(value)}<small>%</small></span>` });
}

// Діамант складнішого варіанта у фірмових кольорах (чорнило сайту), замість кольорового емодзі
export function gem(size = 18) {
  return h("span.gem", { "aria-hidden": "true", html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 3h12l4 6-10 12L2 9z" fill="var(--ink-soft, #e8edfb)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 9h20M9 3 7.5 9 12 21l4.5-12L15 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>` });
}

export function bar(value, color = "var(--lime)") {
  return h("div.bar", h("div.bar__fill", { style: { width: Math.min(100, value) + "%", background: color } }));
}

// Озвучення українською (якщо браузер має український голос)
export function say(text) {
  if (!("speechSynthesis" in window)) return toast("Браузер не вміє озвучувати текст", "warn");
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "uk-UA";
  const v = speechSynthesis.getVoices().find((v) => v.lang.startsWith("uk"));
  if (v) u.voice = v;
  u.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// Прогрес за розділами: компактні плитки тем, розділ згортається. groups: [{title, items:[{label, v, href?}]}]
export function groupedBars(groups, { color = (v) => (v === 100 ? "var(--right)" : "var(--lime)") } = {}) {
  return h("div.gbars", groups.filter((g) => g.items.length).map((g) => {
    const avg = Math.round(g.items.reduce((s, x) => s + x.v, 0) / g.items.length);
    return h(`details.gbars__g.card${avg ? "" : ".gbars__g--empty"}`, { open: avg > 0 },
      h("summary.gbars__sum", h("b", g.title), h("span.gbars__avg.mono", avg + "%"), bar(avg, color(avg))),
      h("div.gbars__grid", g.items.map((x) => h(x.href ? "a.gtile" : "div.gtile", x.href ? { href: x.href } : {},
        h("span.gtile__l", x.label), h("b.gtile__v.mono", x.v + "%"), bar(x.v, color(x.v)), x.sub ? h("small.gtile__s", x.sub) : null))));
  }));
}

// iPhone/iPad: другий швидкий тап Safari перетворює на збільшення екрана (CSS touch-action там спрацьовує не завжди).
// Скасовуємо збільшення, а сам натиск виконуємо як звичайне клацання.
let lastTap = 0, tapX = 0, tapY = 0;
document.addEventListener("touchstart", (e) => { tapX = e.touches[0].clientX; tapY = e.touches[0].clientY; }, { passive: true });
document.addEventListener("touchend", (e) => {
  const t = e.target, now = e.timeStamp, p = e.changedTouches[0];
  const still = Math.hypot(p.clientX - tapX, p.clientY - tapY) < 10;
  if (still && now - lastTap < 350 && e.touches.length === 0 && e.changedTouches.length === 1 && t instanceof Element && !t.closest("input, textarea, select, [contenteditable]")) {
    e.preventDefault();
    if (t.tagName !== "CANVAS") t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }
  lastTap = still ? now : 0;
}, { passive: false });
