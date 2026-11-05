// Будівельні блоки для схем-ілюстрацій до правил (SVG у стилі «Зошит»).
export const F = "font-family='Fixel Text, sans-serif'";
export const D = "font-family='Fixel Display, Fixel Text, sans-serif'";
export const C = { lime: "#94aef3", violet: "#2440c2", yellow: "#ffd43b", ink: "#23262d", muted: "#5e6372", right: "#2a8c4a", wrong: "#d9342b", line: "#d6deeb" };
const BG = { lime: "#eef2fd", violet: "#e8edfb", yellow: "#fff8d6", ink: "#f7f9fd" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const svg = (h, body, label) => `<svg viewBox="0 0 400 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const supT = (s, size) => { const up = Math.round(size * 0.42); let lift = 0;
  return String(s).split(/(<sup>.*?<\/sup>)/).filter(Boolean).map((p) => { const m = p.match(/^<sup>(.*)<\/sup>$/);
    const dy = m ? -up - lift : -lift; lift = m ? -up : 0;
    return `<tspan${dy ? ` dy="${dy}"` : ""}${m ? ` font-size="${Math.round(size * 0.68)}"` : ""}>${esc(m ? m[1] : p)}</tspan>`; }).join(""); };
const T = (x, y, s, { size = 15, w = 700, fill = C.ink, anchor = "middle", font = F } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" ${font} font-size="${size}" font-weight="${w}" fill="${fill}">${String(s).includes("<sup>") ? supT(s, size) : esc(s)}</text>`;

// Центральне поняття і до 6 «пелюсток»
export function mind(center, items, color = "lime", note = "") {
  const col = C[color], n = items.length;
  const pos = n <= 4 ? [[90, 55], [310, 55], [90, 195], [310, 195]] : [[80, 50], [320, 50], [55, 125], [345, 125], [80, 200], [320, 200]];
  const body = items.map((w, i) => { const [x, y] = pos[i]; return `<line x1="200" y1="125" x2="${x}" y2="${y}" stroke="${col}" stroke-width="3"/>
    <rect x="${x - 68}" y="${y - 20}" width="136" height="40" rx="20" fill="#fff" stroke="${col}" stroke-width="2.5"/>${T(x, y + 5, w, { size: w.length > 14 ? 12 : 14 })}`; }).join("");
  return svg(250, `<rect width="400" height="250" rx="18" fill="${BG[color]}"/>${body}
    <circle cx="200" cy="125" r="48" fill="${col}"/>${center.split("\n").map((l, i, a) => T(200, 130 + (i - (a.length - 1) / 2) * 18, l, { size: 15, w: 800, font: D, fill: color === "violet" ? "#fff" : C.ink })).join("")}
    ${note ? T(200, 243, note, { size: 12, fill: C.muted }) : ""}`, center + ": " + items.join(", "));
}

// Колонки з заголовками й прикладами: [{h, words:[], color}]
export function cols(columns, title = "") {
  const n = columns.length, w = (380 - (n - 1) * 10) / n, top = title ? 36 : 12;
  const rows = Math.max(...columns.map((c) => c.words.length));
  const H = top + 52 + rows * 26 + 16;
  const body = columns.map((c, i) => { const x = 10 + i * (w + 10), col = C[c.color || "lime"];
    return `<rect x="${x}" y="${top}" width="${w}" height="${H - top - 10}" rx="14" fill="#fff" stroke="${col}" stroke-width="2.5"/>
      <rect x="${x}" y="${top}" width="${w}" height="40" rx="14" fill="${col}"/><rect x="${x}" y="${top + 26}" width="${w}" height="14" fill="${col}"/>
      ${T(x + w / 2, top + 26, c.h, { size: c.h.length > 14 ? 11.5 : 14, w: 800, fill: c.color === "violet" || c.color === "wrong" || c.color === "right" ? "#fff" : C.ink })}
      ${c.words.map((wd, k) => T(x + w / 2, top + 66 + k * 26, wd, { size: wd.length > 16 ? 12 : 14 })).join("")}`; }).join("");
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="${BG.ink}"/>${title ? T(200, 25, title, { size: 15, w: 800, font: D }) : ""}${body}`, title || columns.map((c) => c.h).join(", "));
}

// Алгоритм: кроки зверху вниз
export function steps(list, title = "", color = "violet") {
  const H = (title ? 40 : 14) + list.length * 52 + 6;
  const top = title ? 40 : 14;
  const body = list.map((s, i) => { const y = top + i * 52;
    return `<rect x="20" y="${y}" width="360" height="42" rx="21" fill="#fff" stroke="${C[color]}" stroke-width="2.5"/>
      <circle cx="41" cy="${y + 21}" r="15" fill="${C[color]}"/>${T(41, y + 27, i + 1, { size: 15, w: 800, fill: color === "violet" ? "#fff" : C.ink })}
      ${T(66, y + 26, s, { size: s.length > 40 ? 12 : 14, anchor: "start" })}
      ${i < list.length - 1 ? `<path d="M41 ${y + 38} l0 12" stroke="${C[color]}" stroke-width="3"/>` : ""}`; }).join("");
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="${BG[color] || BG.ink}"/>${title ? T(200, 27, title, { size: 15, w: 800, font: D }) : ""}${body}`, title || list.join("; "));
}

// Пари «неправильно → правильно» або «слово → пояснення»
export function pairs(list, title = "", { wrong = true } = {}) {
  const top = title ? 40 : 14, H = top + list.length * 40 + 8;
  const body = list.map(([a, b], i) => { const y = top + i * 40;
    return `<rect x="16" y="${y}" width="164" height="32" rx="10" fill="${wrong ? "#fbe3df" : "#fff"}" stroke="${wrong ? "none" : C.line}"/>
      ${T(98, y + 21, a, { size: a.length > 18 ? 12 : 14, fill: wrong ? C.wrong : C.ink })}
      ${wrong ? `<line x1="${98 - Math.min(76, a.length * 4)}" y1="${y + 16}" x2="${98 + Math.min(76, a.length * 4)}" y2="${y + 16}" stroke="${C.wrong}" stroke-width="2"/>` : ""}
      ${T(200, y + 22, "→", { size: 18, fill: C.muted })}
      <rect x="220" y="${y}" width="164" height="32" rx="10" fill="#dcefe2"/>${T(302, y + 21, b, { size: b.length > 18 ? 12 : 14, fill: C.right })}`; }).join("");
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="#fff"/>${title ? T(200, 27, title, { size: 15, w: 800, font: D }) : ""}${body}`, title || "пари");
}

// Велика «формула»: блоки в рядок + підпис
export function formula(parts, caption = "", examples = []) {
  const n = parts.length, gap = 8, w = (370 - (n - 1) * gap) / n;
  const H = 120 + examples.length * 24 + (caption ? 10 : 0);
  const body = parts.map((p, i) => { const x = 15 + i * (w + gap), col = C[p.color || "lime"];
    return `<rect x="${x}" y="22" width="${w}" height="58" rx="14" fill="${p.fill === false ? "#fff" : col}" stroke="${col}" stroke-width="2.5"/>
      ${T(x + w / 2, 58, p.t, { size: p.t.length > 10 ? 13 : 18, w: 800, font: D, fill: p.color === "violet" && p.fill !== false ? "#fff" : C.ink })}`; }).join("");
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="${BG.violet}"/>${body}
    ${caption ? T(200, 104, caption, { size: 13, fill: C.muted }) : ""}
    ${examples.map((e, i) => T(200, 128 + i * 24, e, { size: 15 })).join("")}`, parts.map((p) => p.t).join(" + "));
}

// Речення з підкресленням членів речення: [[слово, тип]] тип: pidmet|prysudok|oznach|dodatok|obst|null
export function sentence(words, legend = true) {
  const st = {
    pidmet: (x, w, y) => `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${C.ink}" stroke-width="2.5"/>`,
    prysudok: (x, w, y) => `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${C.ink}" stroke-width="2.5"/><line x1="${x}" y1="${y + 5}" x2="${x + w}" y2="${y + 5}" stroke="${C.ink}" stroke-width="2.5"/>`,
    oznach: (x, w, y) => `<path d="M${x} ${y + 2} ${Array.from({ length: Math.ceil(w / 8) }, (_, i) => `q2 ${i % 2 ? 5 : -5} 4 0 q2 ${i % 2 ? -5 : 5} 4 0`).join(" ")}" stroke="${C.violet}" stroke-width="2" fill="none"/>`,
    dodatok: (x, w, y) => `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${C.wrong}" stroke-width="2.5" stroke-dasharray="7 5"/>`,
    obst: (x, w, y) => `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${C.right}" stroke-width="2.5" stroke-dasharray="10 4 2 4"/>`,
  };
  let x = 14, y = 50, out = "";
  const lineH = 50;
  for (const [wd, t] of words) {
    const w = wd.length * 9.2;
    if (x + w > 390) { x = 14; y += lineH; }
    out += T(x, y, wd, { size: 17, anchor: "start" });
    if (t) out += st[t](x, w - 4, y + 8);
    x += w + 8;
  }
  const leg = legend ? [["pidmet", "підмет"], ["prysudok", "присудок"], ["oznach", "означення"], ["dodatok", "додаток"], ["obst", "обставина"]] : [];
  const ly = y + 44;
  const legend_ = leg.map(([k, l], i) => { const lx = 14 + (i % 3) * 128, yy = ly + Math.floor(i / 3) * 28; return st[k](lx, 36, yy) + T(lx + 44, yy + 5, l, { size: 13, anchor: "start", fill: C.muted }); }).join("");
  const H = ly + (leg.length ? 50 : 0);
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="#fff" stroke="${C.line}"/>${out}${legend_}`, words.map((w) => w[0]).join(" "));
}

// Картка-підказка з великим словом/знаком і прикладами
export function card(big, sub, lines = [], color = "yellow") {
  const H = 130 + lines.length * 26;
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="${BG[color] || BG.yellow}" stroke="${C[color]}" stroke-width="2"/>
    ${T(200, 62, big, { size: big.length > 14 ? 22 : 34, w: 800, font: D })}
    ${T(200, 92, sub, { size: 14, fill: C.muted })}
    ${lines.map((l, i) => T(200, 124 + i * 26, l, { size: 15 })).join("")}`, big + " " + sub);
}

// Дерево-карта: корінь угорі, гілки з листками: tree("Звуки", [{h, leaves:[], color}], note)
export function tree(root, branches, note = "") {
  const n = branches.length, w = (380 - (n - 1) * 10) / n;
  const rows = Math.max(...branches.map((b) => b.leaves.length));
  const top = 92, H = top + 44 + rows * 24 + 16 + (note ? 22 : 0);
  const rw = Math.min(260, 40 + root.length * 11);
  const body = branches.map((b, i) => { const x = 10 + i * (w + 10), cx = x + w / 2, col = C[b.color || "lime"];
    return `<path d="M200 60 C200 76 ${cx} 70 ${cx} ${top}" stroke="${col}" stroke-width="3" fill="none"/>
      <rect x="${x}" y="${top}" width="${w}" height="${H - top - 10 - (note ? 22 : 0)}" rx="14" fill="#fff" stroke="${col}" stroke-width="2.5"/>
      <rect x="${x}" y="${top}" width="${w}" height="34" rx="14" fill="${col}"/><rect x="${x}" y="${top + 20}" width="${w}" height="14" fill="${col}"/>
      ${T(cx, top + 23, b.h, { size: Math.min(b.h.length > 13 ? 11.5 : 13.5, (w - 8) / (b.h.length * 0.6)), w: 800, fill: ["violet", "wrong", "right"].includes(b.color) ? "#fff" : C.ink })}
      ${b.leaves.map((l, k) => T(cx, top + 56 + k * 24, l, { size: Math.min(l.length > 15 ? 11.5 : 13, (w - 8) / (l.length * 0.56)) })).join("")}`; }).join("");
  return svg(H, `<rect width="400" height="${H}" rx="18" fill="${BG.ink}"/>
    <rect x="${200 - rw / 2}" y="16" width="${rw}" height="44" rx="22" fill="${C.ink}"/>${T(200, 44, root, { size: 16, w: 800, font: D, fill: "#fff" })}
    ${body}${note ? T(200, H - 12, note, { size: 12, fill: C.muted }) : ""}`, root + ": " + branches.map((b) => b.h + " (" + b.leaves.join(", ") + ")").join("; "));
}

// ---------- Мнемонічні картинки ----------
// Потяг слова: [{t:"за", h:"префікс", color}] — локомотив, вагони, колеса
export function train(parts, caption = "") {
  const n = parts.length, gap = 10, w = Math.min(92, (360 - (n - 1) * gap) / n), total = n * w + (n - 1) * gap, x0 = (400 - total) / 2;
  const cars = parts.map((p, i) => { const x = x0 + i * (w + gap), col = C[p.color || "lime"], first = i === 0;
    return `${i ? `<rect x="${x - gap}" y="128" width="${gap}" height="5" fill="${C.ink}"/>` : ""}
      ${first ? `<rect x="${x + w * 0.55}" y="58" width="${w * 0.22}" height="26" rx="4" fill="${C.ink}"/><circle cx="${x + w * 0.66}" cy="46" r="9" fill="#d6deeb" opacity=".8"/><circle cx="${x + w * 0.8}" cy="32" r="7" fill="#d6deeb" opacity=".6"/>` : ""}
      <rect x="${x}" y="80" width="${w}" height="60" rx="12" fill="${col}" stroke="${C.ink}" stroke-width="2"/>
      <rect x="${x + 8}" y="88" width="${w - 16}" height="20" rx="5" fill="#fff" opacity=".9"/>
      ${T(x + w / 2, 103, p.h, { size: Math.min(12, (w - 16) / (p.h.length * 0.55)), w: 800, fill: C.muted })}
      ${T(x + w / 2, 131, p.t, { size: Math.min(20, (w - 8) / (p.t.length * 0.62)), w: 800, font: D, fill: ["violet", "right", "wrong"].includes(p.color) ? "#fff" : C.ink })}
      <circle cx="${x + w * 0.25}" cy="146" r="9" fill="${C.ink}"/><circle cx="${x + w * 0.75}" cy="146" r="9" fill="${C.ink}"/>
      <circle cx="${x + w * 0.25}" cy="146" r="3.5" fill="#fff"/><circle cx="${x + w * 0.75}" cy="146" r="3.5" fill="#fff"/>`; }).join("");
  return svg(caption ? 200 : 172, `<rect width="400" height="${caption ? 200 : 172}" rx="18" fill="#e8edfb"/>
    <rect x="10" y="155" width="380" height="4" fill="#b8c3d8"/>${Array.from({ length: 19 }, (_, k) => `<rect x="${14 + k * 20}" y="159" width="10" height="4" fill="#b8c3d8"/>`).join("")}
    ${cars}${caption ? T(200, 188, caption, { size: 13, fill: C.muted }) : ""}`, "Потяг слова: " + parts.map((p) => `${p.h} ${p.t}`).join(", "));
}

// Дерево слів: корінь під землею, на гілках — споріднені слова
export function wordtree(root, words, note = "") {
  const leaves = words.slice(0, 6), pos = [[72, 92], [328, 92], [52, 158], [348, 158], [128, 50], [272, 50]];
  const body = leaves.map((w, i) => { const [x, y] = pos[i];
    return `<path d="M200 150 Q${(200 + x) / 2} ${y + 40} ${x} ${y}" stroke="#7a5230" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${x}" cy="${y}" rx="${Math.max(44, w.length * 5.4)}" ry="18" fill="#cbd8fa" stroke="#94aef3" stroke-width="2"/>${T(x, y + 5, w, { size: w.length > 12 ? 11.5 : 13.5 })}`; }).join("");
  return svg(290, `<rect width="400" height="290" rx="18" fill="#eef2fd"/>
    <rect x="0" y="205" width="400" height="85" rx="0" fill="#8a6a4a"/><rect x="0" y="205" width="400" height="6" fill="#6b4f35"/>
    <path d="M188 210 L192 150 L208 150 L212 210 Z" fill="#7a5230"/>
    ${body}
    <path d="M200 212 q-30 20 -60 30 M200 212 q30 20 60 30 M200 212 l0 30" stroke="#5a3a20" stroke-width="3" fill="none"/>
    <rect x="${200 - Math.max(48, root.length * 7)}" y="238" width="${Math.max(96, root.length * 14)}" height="36" rx="18" fill="#2a1f12" stroke="#ffd43b" stroke-width="2"/>
    ${T(200, 262, root, { size: 16, w: 800, font: D, fill: "#ffd43b" })}
    ${note ? T(200, 18, note, { size: 11.5, fill: C.muted }) : ""}`, `Дерево слів: корінь ${root}; ${leaves.join(", ")}`);
}

// Ментальна карта з картинками: picmind("Тема", [["🦊", "слово"], ...], color, note)
export function picmind(center, items, color = "violet", note = "") {
  const col = C[color], n = items.length;
  const pos = n <= 4 ? [[92, 62], [308, 62], [92, 198], [308, 198]] : [[84, 55], [316, 55], [72, 132], [328, 132], [84, 210], [316, 210]];
  const body = items.map(([ic, w], i) => { const [x, y] = pos[i];
    return `<line x1="200" y1="132" x2="${x}" y2="${y}" stroke="${col}" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>
      <rect x="${x - 67}" y="${y - 24}" width="134" height="48" rx="24" fill="#fff" stroke="${col}" stroke-width="2.5"/>
      <circle cx="${x - 44}" cy="${y}" r="18" fill="${BG[color] || BG.violet}"/><text x="${x - 44}" y="${y + 7}" text-anchor="middle" font-size="19">${ic}</text>
      ${T(x + 12, y + 5, w, { size: Math.min(w.length > 12 ? 11 : 13, 84 / (w.length * 0.56)) })}`; }).join("");
  return svg(262, `<rect width="400" height="262" rx="18" fill="${BG[color] || BG.violet}"/>${body}
    <circle cx="200" cy="132" r="50" fill="${col}"/>${center.split("\n").map((l, i, a) => T(200, 137 + (i - (a.length - 1) / 2) * 18, l, { size: 14, w: 800, font: D, fill: color === "violet" ? "#fff" : C.ink })).join("")}
    ${note ? T(200, 255, note, { size: 12, fill: C.muted }) : ""}`, center + ": " + items.map((x) => x.join(" ")).join(", "));
}
