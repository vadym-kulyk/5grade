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
