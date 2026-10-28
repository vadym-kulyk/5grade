// Живі питання від учителя: учень бачить вікно з питанням поверх будь-якої сторінки.
// Також позначка «я онлайн», щоб учитель бачив, кому можна надіслати питання.
import { h, toast, say } from "./ui.js";
import { r, update, onValue, off, set, onDisconnect, serverTimestamp } from "./fb.js";

let liveRef = null, onlineRef = null, box = null, shownId = null, marksSeen = null;
const pageName = () => location.hash.replace(/^#\/?/, "").split("/")[0] || "головна";
const onHash = () => onlineRef && update(onlineRef, { page: pageName(), at: serverTimestamp() });
const onVis = () => onlineRef && update(onlineRef, { away: document.hidden, at: serverTimestamp() }).catch(() => {});

export function startLive(uid, user) {
  stopLive();
  onlineRef = r(`online/${uid}`);
  onDisconnect(onlineRef).remove();
  set(onlineRef, { name: user.name, cls: user.cls, page: pageName(), at: serverTimestamp() });
  addEventListener("hashchange", onHash);
  document.addEventListener("visibilitychange", onVis);

  liveRef = r(`live/${uid}`);
  onValue(liveRef, (s) => {
    const all = Object.entries(s.val() || {}).sort((a, b) => a[1].at - b[1].at);
    // Оцінки вчителя: показуємо лише нові
    const marked = all.filter(([, x]) => x.mark !== undefined);
    if (marksSeen) marked.filter(([id]) => !marksSeen.has(id)).forEach(([, x]) =>
      toast(x.mark ? `✅ Учитель зарахував твою відповідь: «${x.q.slice(0, 60)}»` : `🔁 Учитель просить подумати ще: «${x.q.slice(0, 60)}»`, x.mark ? "win" : "warn", 6000));
    marksSeen = new Set(marked.map(([id]) => id));
    const open = all.find(([, x]) => !x.ans);
    if (!open) return hide();
    if (shownId !== open[0]) show(uid, open[0], open[1]);
  });
}

export function stopLive() {
  if (liveRef) off(liveRef);
  if (onlineRef) set(onlineRef, null).catch(() => {});
  removeEventListener("hashchange", onHash);
  document.removeEventListener("visibilitychange", onVis);
  liveRef = onlineRef = null; marksSeen = null;
  hide();
}

function hide() { box?.remove(); box = null; shownId = null; }

function show(uid, id, x) {
  hide();
  shownId = id;
  const text = h("textarea.input.liveq__text", { rows: 3, maxlength: 500, placeholder: "Напиши відповідь…" });
  const err = h("p.err");
  const send = async (oral) => {
    const t = text.value.trim();
    if (!oral && t.length < 2) return (err.textContent = "Напиши відповідь або натисни «Відповім усно».");
    await update(r(`live/${uid}/${id}/ans`), { text: oral ? "" : t.slice(0, 500), oral: !!oral, at: Date.now() });
    toast(oral ? "Готуйся відповісти вчителю усно 🗣️" : "Відповідь надіслано ✉️", "win");
  };
  box = h("div.liveq", h("div.liveq__card", { role: "dialog", "aria-modal": "true" },
    h("div.liveq__head", h("span.liveq__badge", "🎤 Питання від учителя"), h("button.btn.btn--small", { onclick: () => say(x.q), title: "Прочитати вголос" }, "🔊")),
    h("h2.liveq__q", x.q),
    text, err,
    h("div.row.gap", h("button.btn.btn--primary", { onclick: () => send(false) }, "✍️ Надіслати письмово"), h("button.btn", { onclick: () => send(true) }, "🗣️ Відповім усно"))));
  document.body.append(box);
  navigator.vibrate?.(150);
  text.focus();
}
