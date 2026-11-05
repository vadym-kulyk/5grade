// Дошка з теорією: блок теорії фіксованої ширини (однаково розкладається на будь-якому екрані)
// + полотно, на якому вчитель малює. Координати штрихів — у пікселях дошки (ширина W).
import { h } from "./ui.js";

export const W = 640;

// Один блок теорії так само, як на сторінці теми, але без кнопок
export function theoryBlock(b) {
  return h("article.rule.card", h("div.rule__text", h("h3", b.title), h("div", { html: b.html })), b.figure && h("figure.rule__fig", { html: b.figure }));
}

// Дошка: обгортка масштабується під ширину контейнера, вміст завжди W пікселів
export function makeBoard(content) {
  const canvas = h("canvas.board__ink");
  const inner = h("div.board", content, canvas);
  const wrap = h("div.boardwrap", inner);
  const b = { wrap, inner, canvas, scale: 1, strokes: {}, draft: null };
  const fit = () => {
    const w = wrap.clientWidth || W;
    b.scale = Math.min(1.6, w / W);
    inner.style.transform = `scale(${b.scale})`;
    const hh = inner.offsetHeight;
    wrap.style.height = hh * b.scale + "px";
    const dpr = Math.min(2, devicePixelRatio || 1) * Math.max(1, b.scale);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(hh * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(hh * dpr); b.dpr = dpr; }
    paint(b);
  };
  b.fit = fit;
  const ro = new ResizeObserver(fit); ro.observe(wrap); ro.observe(inner);
  b.dispose = () => ro.disconnect();
  document.fonts?.ready.then(fit);
  return b;
}

export function setStrokes(b, strokes) { b.strokes = strokes || {}; paint(b); }

// Малюємо всі штрихи
export function paint(b) {
  const c = b.canvas, g = c.getContext("2d"), k = b.dpr || 1;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  const list = Object.values(b.strokes || {}).sort((x, y) => (x.at || 0) - (y.at || 0));
  if (b.draft) list.push(b.draft);
  for (const s of list) drawStroke(g, s);
}

function drawStroke(g, s) {
  const p = typeof s.p === "string" ? s.p.split(";").map((q) => q.split(",").map(Number)) : s.p || [];
  if (!p.length) return;
  g.save();
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = s.c; g.lineWidth = s.w;
  if (s.t === "mark") { g.globalAlpha = 0.35; g.lineCap = "butt"; }
  g.beginPath();
  if (s.t === "line") { const [a, z] = [p[0], p[p.length - 1]]; g.moveTo(a[0], a[1]); g.lineTo(z[0], z[1]); }
  else if (s.t === "oval") { const [a, z] = [p[0], p[p.length - 1]]; g.ellipse((a[0] + z[0]) / 2, (a[1] + z[1]) / 2, Math.abs(z[0] - a[0]) / 2 + 1, Math.abs(z[1] - a[1]) / 2 + 1, 0, 0, Math.PI * 2); }
  else { g.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) g.lineTo(q[0], q[1]); if (p.length === 1) g.lineTo(p[0][0] + 0.1, p[0][1]); }
  g.stroke();
  g.restore();
}

export const packPts = (pts) => pts.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(";");
