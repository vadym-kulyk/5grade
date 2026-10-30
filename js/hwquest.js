// 🎃 Таємна кімната в 3D-школі: спільний квест класу.
// Портал у стіні холу → кімната з котлом і шістьма скринями. Кожна скриня — 3 завдання поспіль без помилок,
// нагорода — літера. Із шести літер клас складає чарівне слово й промовляє його над котлом.
import * as THREE from "three";
import { h, toast, modal, shuffle } from "./ui.js";
import { r, ref, db, onValue, off, set, update, runTransaction, errText } from "./fb.js";
import { renderTask, kindLabel } from "./quiz.js";
import { state, awardBadges, onChange } from "./store.js";
import { QUEST } from "../content/quest/halloween.js";

export const ROOM = { x0: 18, x1: 50, z0: 18, z1: 50 }; // велика зала 32 × 32 м
const C = { x: 34, z: 32 }; // котел у центрі
const ENTRY = { x: 34, z: 46.5, ry: Math.PI }; // поява в кімнаті (обличчям до котла)
const HALL = { x: 11.8, z: 8, ry: -Math.PI / 2 }; // поява в холі біля порталу
const PORTAL = { x: 13.7, z: 8 };
const EXIT = { x: 34, z: 49.7 };
const REWARD = { coins: 150, xp: 60 };
const ONE_PER = 120000; // друга скриня тому самому учневі — через 2 хв
const TOWER = { x: 28, z: 21, y: 10 }; // Вежа графіки: скриня на висоті 10 м — дістати можна лише на мітлі
const RANGE = 24; // дальність кидка кулі світла
export const LIGHT_PACKS = [[1, 15], [5, 60], [10, 110]]; // [кулі, монети]

const tex = (w, hh, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = hh; draw(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const label = (lines, { w = 512, hgt = 128, bg = "rgba(30,20,50,.85)", fg = "#ffd9a0", font = "bold 40px Manrope, sans-serif", k = 1 } = {}) => {
  const t = tex(w, hgt, (g) => { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, hgt - 8, 28); g.fill(); g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; [].concat(lines).forEach((l, i, a) => g.fillText(l, w / 2, hgt / 2 + (i - (a.length - 1) / 2) * 46)); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set((w / 200) * k, (hgt / 200) * k, 1); return s;
};
const bigLetter = (ch) => { const t = tex(128, 128, (g) => { g.shadowColor = "#ff9d00"; g.shadowBlur = 24; g.fillStyle = "#ffd54a"; g.font = "900 100px Unbounded, Manrope, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 64, 70); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(1.1, 1.1, 1); return s; };

export function setupQuest({ scene, walls, uid, teleport }) {
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const B = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
  const anim = [];
  const box = (w, hh, d, x, y, z, m, solid = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); scene.add(b); if (solid) walls.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2]); return b; };

  // ---------- Портал у холі (на східній стіні) ----------
  const swirl = tex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "#fff0ff"); gr.addColorStop(0.35, "#b06bff"); gr.addColorStop(1, "rgba(60,10,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 5; for (let k = 0; k < 4; k++) { g.beginPath(); for (let a = 0; a < 9; a += 0.1) g.lineTo(128 + Math.cos(a + k * 1.57) * a * 12, 128 + Math.sin(a + k * 1.57) * a * 12); g.stroke(); } });
  const portal = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), B("#ffffff", { map: swirl, transparent: true }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 8, 32), B("#b06bff"));
  portal.add(disc, ring); portal.position.set(PORTAL.x, 1.5, PORTAL.z); portal.rotation.y = -Math.PI / 2; scene.add(portal);
  const exitP = portal.clone(); exitP.position.set(EXIT.x, 1.5, EXIT.z); exitP.rotation.y = Math.PI; scene.add(exitP);
  const pl = new THREE.PointLight(0xb06bff, 4, 6, 1.6); pl.position.set(PORTAL.x - 0.8, 1.6, PORTAL.z); scene.add(pl);
  anim.push((t) => { disc.rotation.z = -t * 1.5; exitP.children[0].rotation.z = t * 1.5; const s = 1 + Math.sin(t * 2.5) * 0.05; portal.scale.set(s, s, s); });

  // ---------- Кімната ----------
  const { x0, x1, z0, z1 } = ROOM, H = 7, T = 0.4, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const floorT = tex(64, 64, (g) => { g.fillStyle = "#2b2238"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#3a2d4d"; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(16, 16); floorT.magFilter = THREE.NearestFilter;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0.02, cz); scene.add(fl);
  const stone = L("#3b3150");
  box(x1 - x0 + T * 2, H, T, cx, H / 2, z0 - T / 2, stone); box(x1 - x0 + T * 2, H, T, cx, H / 2, z1 + T / 2, stone);
  box(T, H, z1 - z0, x0 - T / 2, H / 2, cz, stone); box(T, H, z1 - z0, x1 + T / 2, H / 2, cz, stone);
  const title = label(["Таємна кімната", "відьми Граматихи"], { w: 640, hgt: 160, font: "bold 52px Manrope, sans-serif" }); title.position.set(cx, 5.6, z0 + 0.3); title.scale.multiplyScalar(2); scene.add(title);
  // Свічки
  const candleSpots = [];
  for (let k = 0; k <= 8; k++) { const f = x0 + 0.6 + (k * (x1 - x0 - 1.2)) / 8; candleSpots.push([f, z0 + 0.6], [f, z1 - 0.6]); }
  for (let k = 1; k < 8; k++) { const f = z0 + 0.6 + (k * (z1 - z0 - 1.2)) / 8; candleSpots.push([x0 + 0.6, f], [x1 - 0.6, f]); }
  for (const [x, z] of candleSpots) {
    box(0.18, 0.7, 0.18, x, 0.35, z, L("#f4ead2"), false);
    const fm = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), B("#ffb347")); fm.position.set(x, 0.82, z); scene.add(fm);
    anim.push((t) => { fm.scale.y = 1 + Math.sin(t * 15 + x * 3) * 0.2; });
  }
  const roomLight = new THREE.PointLight(0xffa860, 4, 46, 1); roomLight.position.set(cx, 6, cz + 4); scene.add(roomLight);
  for (const [x, z] of [[x0 + 2, z0 + 2], [x1 - 2, z1 - 2]]) { const tl = new THREE.PointLight(0xff8a2a, 3, 22, 1.2); tl.position.set(x, 4, z); scene.add(tl); }
  // Прикраси великої зали: колони, надгробки, гарбузи, ширяючі свічки
  for (const [x, z] of [[x0 + 6, z0 + 6], [x1 - 6, z0 + 6], [x0 + 6, z1 - 6], [x1 - 6, z1 - 6]]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, H, 10), stone); col.position.set(x, H / 2, z); scene.add(col); walls.push([x - 0.9, x + 0.9, z - 0.9, z + 0.9]);
  }
  const graveT = (w) => tex(128, 160, (g) => { g.fillStyle = "#6f6a7d"; g.beginPath(); g.moveTo(8, 160); g.lineTo(8, 60); g.arc(64, 60, 56, Math.PI, 0); g.lineTo(120, 160); g.fill(); g.fillStyle = "#2a2433"; g.font = "bold 22px Manrope, sans-serif"; g.textAlign = "center"; g.fillText("Тут спочиває", 64, 70); g.font = "bold 24px Manrope, sans-serif"; g.fillText(w, 64, 104); });
  [["«ложить»", x0 + 3, cz - 4], ["«булочна»", x0 + 3, cz + 4], ["«вобщем»", x1 - 3, cz - 4], ["«прийшлось»", x1 - 3, cz + 4], ["«согласен»", cx - 6, z1 - 3], ["«на протязі»", cx + 6, z1 - 3]].forEach(([w, x, z]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.75), new THREE.MeshLambertMaterial({ map: graveT(w), transparent: true, side: THREE.DoubleSide })); m.position.set(x, 0.88, z); m.lookAt(cx, 0.88, cz); scene.add(m);
  });
  for (const [x, z, s] of [[x0 + 2.5, z0 + 9, 0.8], [x1 - 2.5, z0 + 12, 0.7], [cx - 3, z1 - 1.5, 0.6], [cx + 3, z1 - 1.5, 0.6], [x0 + 10, z1 - 2, 0.9], [x1 - 10, z0 + 2, 0.8]]) {
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 12, 10).scale(1.25, 0.9, 1.15), L("#ff7a1a", { emissive: "#4a1c00" })); pk.position.set(x, 0.45 * s, z); scene.add(pk);
  }
  const floatC = Array.from({ length: 14 }, (_, k) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), L("#f4ead2"))); const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), B("#ffb347")); f.position.y = 0.28; g.add(f); scene.add(g); return { g, x: x0 + 3 + ((k * 7.3) % (x1 - x0 - 6)), z: z0 + 3 + ((k * 11.7) % (z1 - z0 - 6)), ph: k }; });
  anim.push((t) => floatC.forEach((c) => c.g.position.set(c.x, 4.5 + Math.sin(t + c.ph) * 0.4, c.z)));

  // Котел
  const cauldron = new THREE.Group();
  cauldron.add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), L("#18141f", { side: THREE.DoubleSide })));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.09, 8, 28), L("#2a2433")); rim.rotation.x = Math.PI / 2; rim.position.y = 0.45; cauldron.add(rim);
  const liquidM = B("#5cff6a"); const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.8, 28), liquidM); liquid.rotation.x = -Math.PI / 2; liquid.position.y = 0.42; cauldron.add(liquid);
  for (const a of [0, 2.1, 4.2]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), L("#18141f")); leg.position.set(Math.cos(a) * 0.6, -0.75, Math.sin(a) * 0.6); cauldron.add(leg); }
  cauldron.position.set(C.x, 1, C.z); scene.add(cauldron);
  walls.push([C.x - 1, C.x + 1, C.z - 1, C.z + 1]);
  const cLight = new THREE.PointLight(0x5cff6a, 5, 7, 1.5); cLight.position.set(C.x, 2.2, C.z); scene.add(cLight);
  const bubbles = Array.from({ length: 10 }, (_, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 3) * 0.03, 8, 6), B("#8dff96", { transparent: true, opacity: 0.85 })); scene.add(b); return { b, ph: i * 0.37, a: i * 2.4 }; });
  anim.push((t) => bubbles.forEach(({ b, ph, a }) => { const k = (t * 0.6 + ph) % 1; b.position.set(C.x + Math.cos(a + t) * 0.45 * (1 - k), 1.45 + k * 1.6, C.z + Math.sin(a + t) * 0.45 * (1 - k)); b.scale.setScalar(1 - k * 0.6); }));
  let doneSprite = null;

  // Скрині по колу навколо котла (вхід — з півдня)
  const chests = QUEST.stations.map((st, i) => {
    const a = (([150, 195, 240, 300, 345, 30][i]) * Math.PI) / 180;
    const hi = st.high ? TOWER.y : 0;
    const x = st.high ? TOWER.x : C.x + Math.cos(a) * 8.5, z = st.high ? TOWER.z : C.z + Math.sin(a) * 8.5;
    const g = new THREE.Group();
    const wood = L("#6b4426"), gold = L("#e8c25a", { emissive: "#3a2a00" });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), wood); base.position.y = 0.3; g.add(base);
    for (const bx of [-0.4, 0.4]) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.72), gold); band.position.set(bx, 0.3, 0); g.add(band); }
    const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.35);
    const lidM = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.7), wood); lidM.position.set(0, 0.12, 0.35); lid.add(lidM);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.06), gold); lock.position.set(0, 0.05, 0.72); lid.add(lock);
    g.add(lid);
    g.position.set(x, hi, z); g.lookAt(C.x, hi, C.z); scene.add(g);
    if (st.high) {
      // Вежа: кам’яна колона з рунами й майданчиком нагорі
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, hi - 0.15, 10), L("#2e2640")); col.position.set(x, (hi - 0.15) / 2, z); scene.add(col);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.8, 0.3, 14), L("#4a3d66")); top.position.set(x, hi - 0.15, z); scene.add(top);
      for (let k = 0; k < 6; k++) { const rune = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.02), B("#b06bff")); const an = k * 1.05; rune.position.set(x + Math.cos(an) * 0.66, 1.5 + k * 1.3, z + Math.sin(an) * 0.66); rune.lookAt(x, rune.position.y, z); scene.add(rune); }
      walls.push([x - 0.7, x + 0.7, z - 0.7, z + 0.7]);
      const tl = label(["🧹 Вежа графіки", "лише на мітлі!"], { w: 520, hgt: 140, k: 0.7 }); tl.position.set(x, 3.2, z + 0.9); scene.add(tl);
    } else walls.push([x - 0.55, x + 0.55, z - 0.55, z + 0.55]);
    const name = label([`${st.icon} ${st.name}`, st.topic], { w: 560, hgt: 140, k: 0.95 }); name.position.set(x, hi + 1.6, z); scene.add(name);
    const letter = bigLetter(st.letter.toUpperCase()); letter.position.set(x, hi + 2.5, z); letter.visible = false; scene.add(letter);
    const glow = new THREE.PointLight(0xffb347, 0, 4, 1.6); glow.position.set(x, hi + 1.2, z); scene.add(glow);
    return { st, x, z, hi, lid, name, letter, glow, solved: null };
  });
  anim.push((t) => chests.forEach((c, i) => { if (c.solved) { c.letter.position.y = c.hi + 2.5 + Math.sin(t * 2 + i) * 0.12; c.lid.rotation.x += (-1.15 - c.lid.rotation.x) * 0.08; } }));

  // ---------- Боси Темряви ----------
  const hpBar = (name, left, max) => tex(512, 120, (g) => {
    g.fillStyle = "rgba(10,6,20,.85)"; g.beginPath(); g.roundRect(4, 4, 504, 112, 24); g.fill();
    g.fillStyle = "#ffb3c8"; g.font = "bold 34px Manrope, sans-serif"; g.textAlign = "center"; g.fillText(left > 0 ? name : `${name} — розвіяна!`, 256, 46);
    g.fillStyle = "#3a2a4d"; g.fillRect(40, 70, 432, 26); g.fillStyle = left > 0 ? "#ff3b5c" : "#ffd54a"; g.fillRect(40, 70, 432 * Math.max(0, left) / max, 26);
    g.fillStyle = "#fff"; g.font = "bold 22px Manrope, sans-serif"; g.fillText(`${Math.max(0, left)} / ${max}`, 256, 91);
  });
  const darkM = new THREE.MeshBasicMaterial({ color: "#05020a", transparent: true, opacity: 0.92 });
  const flashM = new THREE.MeshBasicMaterial({ color: "#fff6c9" });
  const bosses = QUEST.bosses.map((b, i) => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), darkM.clone()); g.add(core);
    const smoke = Array.from({ length: 9 }, (_, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.45 + (k % 3) * 0.15, 10, 8), new THREE.MeshBasicMaterial({ color: "#140a24", transparent: true, opacity: 0.7 })); g.add(m); return m; });
    for (const x of [-0.32, 0.32]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8).scale(1.4, 0.7, 0.5), new THREE.MeshBasicMaterial({ color: "#ff2b4a" })); e.position.set(x, 0.15, 0.92); g.add(e); }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: "#ff2b4a" })); mouth.position.set(0, -0.25, 0.93); mouth.rotation.z = Math.PI; g.add(mouth);
    const bar = new THREE.Sprite(new THREE.SpriteMaterial({ map: hpBar(b.name, b.hp, b.hp), transparent: true, depthWrite: false })); bar.scale.set(2.6, 0.6, 1); bar.position.y = 1.9; g.add(bar);
    const bx = C.x + b.dx, bz = C.z + b.dz;
    g.position.set(bx, b.y, bz); g.scale.setScalar(1.4); scene.add(g);
    return { ...b, x: bx, z: bz, g, core, dark: core.material, smoke, bar, left: b.hp, hit: 0, ph: i * 2.1 };
  });
  anim.push((t) => bosses.forEach((b) => {
    if (b.left <= 0) { b.g.visible = b.hit > 0; if (b.hit > 0) { b.hit -= 0.03; b.g.scale.setScalar(1.4 + (1 - b.hit) * 2.5); b.core.material = flashM; b.g.traverse((o) => o.material && o.material !== flashM && (o.material.transparent = true, o.material.opacity = Math.max(0, b.hit))); } return; }
    b.g.position.set(b.x + Math.cos(t * 0.35 + b.ph) * 3, b.y + Math.sin(t * 1.3 + b.ph) * 0.5, b.z + Math.sin(t * 0.35 + b.ph) * 2.2);
    b.g.rotation.y = Math.sin(t * 0.7 + b.ph) * 0.5;
    b.smoke.forEach((m, k) => { const a = t * (0.8 + k * 0.07) + k; m.position.set(Math.cos(a) * 0.9, Math.sin(a * 1.3) * 0.6, Math.sin(a) * 0.9); });
    if (b.hit > 0) { b.hit -= 0.05; b.core.material = b.hit > 0 ? flashM : b.dark; }
  }));
  const bossesDown = () => bosses.every((b) => b.left <= 0);

  // Кулі світла: обмін монет і кидок у найближчого боса
  const lightCount = () => state.user?.light || 0;
  const lightBtn = h("button.btn.btn--small.lightbtn", { onclick: () => throwLight() });
  const exBtn = h("button.btn.btn--small.lightbtn", { onclick: () => openExchange() }, "🪙→✨");
  const lightUi = h("div.lightui", lightBtn, exBtn);
  const drawLight = () => (lightBtn.textContent = `✨ Кинути світло (${lightCount()})`);
  const offCh = onChange(drawLight); drawLight();
  function openExchange() {
    const u = state.user;
    const close = modal(h("div.center.qst", h("div.result__big", "✨"), h("h2", "Обміняй монети на світло"),
      h("p", "Кулі світла розвіюють босів Темряви. Обмін діє лише сьогодні — на Геловін!"),
      h("p", `У тебе: ${u.coins || 0} 🪙 · ${lightCount()} ✨`),
      h("div.row.gap.center", LIGHT_PACKS.map(([n, price]) => h("button.btn.btn--primary", { disabled: (u.coins || 0) < price, onclick: async () => {
        try { await update(r(`users/${uid}`), { coins: (state.user.coins || 0) - price, light: lightCount() + n }); toast(`+${n} ✨ за ${price} 🪙`, "win"); close(); } catch (e) { toast(errText(e), "warn"); }
      } }, `${n} ✨ за ${price} 🪙`)))));
  }
  let shotBusy = false;
  async function throwLight() {
    const me = meRef?.();
    if (!me || shotBusy) return;
    const alive = bosses.filter((b) => b.left > 0).map((b) => ({ b, d: b.g.position.distanceTo(new THREE.Vector3(me.x, me.y + 1.4, me.z)) })).sort((a, b) => a.d - b.d);
    if (!alive.length) return toast("Темряву вже розвіяно! ✨", "info");
    if (alive[0].d > RANGE) return toast("Підійди ближче до Темряви — вона в таємній кімнаті 🔮", "info");
    if (lightCount() < 1) { toast("Немає куль світла — обміняй монети ✨", "warn"); return openExchange(); }
    shotBusy = true;
    const target = alive[0].b;
    try { await update(r(`users/${uid}`), { light: lightCount() - 1 }); } catch (e) { shotBusy = false; return toast(errText(e), "warn"); }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: "#fff6a8" }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), new THREE.MeshBasicMaterial({ color: "#ffd54a", transparent: true, opacity: 0.35 }));
    ball.add(halo); const from = new THREE.Vector3(me.x, me.y + 1.5, me.z); ball.position.copy(from); scene.add(ball);
    const t0 = performance.now(), dur = 450;
    const fly = () => {
      const k = Math.min(1, (performance.now() - t0) / dur), to = target.g.position;
      ball.position.lerpVectors(from, to, k); ball.position.y += Math.sin(k * Math.PI) * 0.8;
      if (k < 1) return requestAnimationFrame(fly);
      scene.remove(ball); shotBusy = false; target.hit = 1;
      runTransaction(r(`quest/${QUEST.id}/bosses/${target.id}/dmg`), (v) => ((v || 0) >= target.hp ? undefined : (v || 0) + 1))
        .then(() => set(r(`quest/${QUEST.id}/players/${uid}`), true))
        .catch(async (e) => {
          // кидок не зарахувався — повертаємо кулю
          await update(r(`users/${uid}`), { light: lightCount() + 1 }).catch(() => {});
          toast(/permission/i.test(e?.message || e?.code || "") ? "База ще не готова до квесту: учитель має опублікувати нові правила бази даних. Кулю світла повернено ✨" : errText(e), "warn", 7000);
        });
    };
    fly();
  }
  let meRef = null;

  // ---------- Стан квесту (спільний для всього класу) ----------
  let qs = {};
  const qRef = r(`quest/${QUEST.id}`);
  const panel = h("div.qpanel");
  onValue(qRef, (s) => { qs = s.val() || {}; sync(); });

  function sync() {
    const S = qs.stations || {};
    chests.forEach((c) => {
      const was = c.solved; c.solved = S[c.st.id] || null;
      c.letter.visible = !!c.solved; c.glow.intensity = c.solved ? 3 : 0;
      if (!c.solved) c.lid.rotation.x = 0;
      if (c.solved && !was) { scene.remove(c.name); c.name = label([`${c.st.icon} Літера «${c.st.letter.toUpperCase()}»`, `відкрив(-ла): ${c.solved.name}`], { w: 560, hgt: 140, k: 0.95 }); c.name.position.set(c.x, c.hi + 1.6, c.z); scene.add(c.name); }
      if (!c.solved && was) { scene.remove(c.name); c.name = label([`${c.st.icon} ${c.st.name}`, c.st.topic], { w: 560, hgt: 140, k: 0.95 }); c.name.position.set(c.x, c.hi + 1.6, c.z); scene.add(c.name); }
    });
    bosses.forEach((b) => {
      const left = b.hp - (qs.bosses?.[b.id]?.dmg || 0);
      if (left !== b.left) { if (left <= 0 && b.left > 0) { b.hit = 1; toast(`✨ ${b.name} розвіяна!`, "win", 3500); } b.left = left; b.bar.material.map = hpBar(b.name, left, b.hp); b.bar.material.needsUpdate = true; }
    });
    roomLight.intensity = 3 + bosses.filter((b) => b.left <= 0).length * 2;
    const n = Object.keys(S).length, ready = n === 6 && bossesDown();
    liquidM.color.set(qs.done ? "#ffd54a" : ready ? "#b06bff" : "#5cff6a");
    cLight.color.set(qs.done ? 0xffd54a : ready ? 0xb06bff : 0x5cff6a);
    if (qs.done && !doneSprite) { doneSprite = label(`✨ ${QUEST.word.toUpperCase()} ✨`, { w: 700, hgt: 170, font: "900 76px Unbounded, Manrope, sans-serif", fg: "#ffd54a" }); doneSprite.position.set(C.x, 3.4, C.z); doneSprite.scale.multiplyScalar(1.3); scene.add(doneSprite); }
    if (!qs.done && doneSprite) { scene.remove(doneSprite); doneSprite = null; }
    drawPanel();
    claim();
  }

  function drawPanel() {
    const S = qs.stations || {}, n = Object.keys(S).length;
    panel.replaceChildren(
      h("div.qpanel__head", h("b", "🔮 Квест: зілля Граматихи"), h("span.mono", qs.done ? "✅ виконано" : `${n} / 6`)),
      qs.done ? h("p.qpanel__win", `🎉 Заклинання «${QUEST.word.toUpperCase()}» промовив(-ла) ${qs.done.name}! Кожен учасник отримав +${REWARD.coins} 🪙.`)
        : h("p.note", n < 6 ? "Кожен відкриває свою скриню: 3 завдання поспіль без помилки. Скриня на Вежі — лише для того, хто на мітлі! Розкажіть одне одному, яку літеру отримали." : !bossesDown() ? "Усі літери зібрано! Тепер розвійте Темряву кулями світла." : "Усі літери зібрано й Темряву розвіяно! Складіть слово (порядок інший!) і промовте його над котлом."),
      h("div.qpanel__bosses", bosses.map((b) => h(`div.qboss${b.left <= 0 ? ".off" : ""}`, h("span", b.left > 0 ? `👁️ ${b.name}` : `✨ ${b.name}`), h("i", h("em", { style: { width: `${(Math.max(0, b.left) / b.hp) * 100}%` } })), h("small.mono", `${Math.max(0, b.left)}/${b.hp}`)))),
      h("div.qpanel__letters", QUEST.stations.map((st) => { const s = S[st.id]; return h(`div.qletter${s ? ".on" : ""}`, h("span", st.icon), h("b", s ? st.letter.toUpperCase() : "?"), h("small", s ? s.name : st.topic)); })));
  }

  // Нагорода всім, хто відкрив скриню або промовив слово
  let claiming = false;
  async function claim() {
    const u = state.user;
    if (!qs.done || !qs.players?.[uid] || !u || claiming) return;
    const key = `${QUEST.id}_${qs.done.at}`;
    if (u.quests?.[key]) return;
    claiming = true;
    try {
      const xp = (u.xp || 0) + REWARD.xp;
      await update(ref(db), { [`users/${uid}/coins`]: (u.coins || 0) + REWARD.coins, [`users/${uid}/xp`]: xp, [`users/${uid}/quests/${key}`]: Date.now(), [`public/${uid}/xp`]: xp });
      modal(h("div.center", h("div.result__big", "🎃"), h("h2", "Квест виконано!"), h("p", `Клас разом промовив заклинання «${QUEST.word.toUpperCase()}». Твоя нагорода: +${REWARD.coins} 🪙 і +${REWARD.xp} досвіду.`)));
      setTimeout(() => awardBadges({ hwQuest: true }), 400);
    } catch (e) { toast(errText(e), "warn"); }
    claiming = false;
  }

  // ---------- Скриня: 3 завдання поспіль без помилок ----------
  function openChest(c) {
    if (c.solved) return toast(`${c.st.icon} Цю скриню вже відкрив(-ла) ${c.solved.name}. Літера — «${c.st.letter.toUpperCase()}».`, "info", 3500);
    const mine = Object.values(qs.stations || {}).filter((x) => x.uid === uid);
    const wait = mine.length ? ONE_PER - (Date.now() - Math.max(...mine.map((x) => x.at))) : 0;
    if (wait > 0) return toast(`Ти вже відкрив(-ла) скриню! Дай шанс однокласникам 🙂 Якщо вас менше шести — можна ще одну через ${Math.ceil(wait / 1000)} с.`, "warn", 5000);
    if (c.st.high && !(meRef?.()?.broom)) return toast("🧹 Ця скриня — лише для того, хто летить на мітлі відьми!", "warn", 4000);
    const body = h("div.qst");
    const close = modal(body, { wide: true });
    let tasks = shuffle(c.st.tasks).slice(0, 3), i = 0;
    const step = () => {
      if (i >= tasks.length) return win();
      const t = tasks[i], v = renderTask(t), out = h("div");
      let done = false;
      const check = () => {
        if (done) return; if (!v.ready()) return toast("Спершу дай відповідь 🙂", "info");
        done = true; const ok = v.check(); v.reveal(ok);
        if (ok) { out.replaceChildren(h("div.verdict.verdict--ok", h("b", "Правильно! ✨"))); setTimeout(() => { i++; step(); }, 900); return; }
        let left = 10;
        const again = h("button.btn.btn--primary", { disabled: true, onclick: () => { tasks = shuffle(c.st.tasks).slice(0, 3); i = 0; step(); } }, `Спробувати знову (${left})`);
        const tm = setInterval(() => { left--; again.textContent = left > 0 ? `Спробувати знову (${left})` : "Спробувати знову"; if (left <= 0) { clearInterval(tm); again.disabled = false; } }, 1000);
        out.replaceChildren(h("div.verdict.verdict--bad", h("b", "Ой! Закляття не спрацювало — скриня знову замкнулася."), h("div.explain", { html: t.explain }), h("p.note", "Завдання будуть інші. Перечитай правило й спробуй ще раз!")), again);
      };
      v.setOnPick?.(() => setTimeout(check, 180));
      body.replaceChildren(...[
        h("div.qst__head", h("b", `${c.st.icon} ${c.st.name}`), h("span.note", `${c.st.topic} · завдання ${i + 1} з 3`)),
        h("div.task__kind", kindLabel(t)), t.q && h("h2.task__q", { html: t.q }), v.el,
        !v.autoSubmit && h("div.task__actions", h("button.btn.btn--primary", { onclick: check }, "Перевірити")), out].filter(Boolean));
    };
    const win = async () => {
      try {
        await set(r(`quest/${QUEST.id}/stations/${c.st.id}`), { uid, name: state.user.name, at: Date.now() });
        await set(r(`quest/${QUEST.id}/players/${uid}`), true);
        body.replaceChildren(h("div.center", h("div.result__big", c.st.icon), h("h2", "Скриня відкрилася!"), h("div.qbig", c.st.letter.toUpperCase()), h("p", "Це твоя літера чарівного слова. Скажи її команді! Коли всі шість скринь відкриються — складіть слово й промовте його над котлом."), h("button.btn.btn--primary", { onclick: close }, "До котла!")));
      } catch (e) {
        const perm = /permission/i.test(e?.message || e?.code || "") && !qs.stations?.[c.st.id];
        body.replaceChildren(h("p", perm ? "База ще не готова до квесту: учитель має опублікувати нові правила бази даних. Спробуй трохи згодом!" : "Цю скриню щойно відкрив інший учень. Спробуй іншу!"), h("button.btn", { onclick: close }, "Гаразд"));
      }
    };
    step();
  }

  // ---------- Котел: фінальне слово ----------
  function openCauldron() {
    const S = qs.stations || {}, n = Object.keys(S).length;
    if (qs.done) return toast(`✨ Заклинання вже промовлено: «${QUEST.word.toUpperCase()}». Квест виконано!`, "win", 3500);
    if (n < 6 || !bossesDown()) return modal(h("div.center", h("div.result__big", "🧪"), h("h2", "Котел ще не готовий"), h("p", QUEST.intro), h("p", h("b", `Відкрито скринь: ${n} з 6. Розвіяно босів Темряви: ${bosses.filter((b) => b.left <= 0).length} з ${bosses.length}.`))));
    const inp = h("input.input", { placeholder: "Чарівне слово…", maxlength: 20, autocomplete: "off" });
    const err = h("p.err");
    const close = modal(h("div.center.qst",
      h("div.result__big", "🔮"), h("h2", "Промов заклинання"),
      h("p", "Ось літери зі скринь (у чарівному слові вони стоять в іншому порядку):"),
      h("div.qbig", QUEST.stations.map((st) => st.letter.toUpperCase()).join(" ")),
      inp, err,
      h("button.btn.btn--primary", { onclick: async () => {
        if (inp.value.trim().toLowerCase().replace(/ґ/g, "г") !== QUEST.word) { err.textContent = "Котел забулькотів… але нічого не сталося. Порадьтеся разом і спробуйте ще!"; return; }
        try { await set(r(`quest/${QUEST.id}/players/${uid}`), true); await set(r(`quest/${QUEST.id}/done`), { uid, name: state.user.name, at: Date.now() }); close(); toast("✨ Котел засяяв золотом!", "win", 4000); } catch (e) { err.textContent = errText(e); }
      } }, "✨ Промовити")));
    inp.focus();
  }

  return {
    panel,
    inRoom: (p) => p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1,
    // Камера не виходить за стіни кімнати
    clampCam(cam) { cam.position.x = Math.max(x0 + 0.3, Math.min(x1 - 0.3, cam.position.x)); cam.position.z = Math.max(z0 + 0.3, Math.min(z1 - 0.3, cam.position.z)); },
    lightUi, throwLight,
    setMe(fn) { meRef = fn; },
    interacts(me) {
      const list = [
        { x: PORTAL.x - 0.6, z: PORTAL.z, r: 2.2, label: "🔮 Дивна тріщина в стіні…", sub: "Натисни E або сюди — увійти в таємну кімнату", act: () => teleport(ENTRY) },
        { x: EXIT.x, z: EXIT.z - 0.8, r: 1.8, label: "🚪 Портал назад", sub: "Натисни E — повернутися в хол", act: () => teleport(HALL) },
        { x: C.x, z: C.z, r: 2.4, label: "🧪 Котел відьми", sub: qs.done ? "Квест виконано!" : Object.keys(qs.stations || {}).length === 6 && bossesDown() ? "Натисни E — промовити заклинання" : "Натисни E — що тут?", act: openCauldron },
        ...chests.map((c) => ({ x: c.x, z: c.z, y: c.hi, r: c.hi ? 2.4 : 1.9, label: `${c.st.icon} ${c.st.name}`, sub: c.solved ? `Відкрито: ${c.solved.name}` : "Натисни E — відкрити скриню", act: () => openChest(c) })),
      ];
      let best = null, bd = 1e9;
      for (const it of list) { const d = Math.hypot(it.x - me.x, it.z - me.z); const yOk = it.y ? Math.abs(me.y - it.y) < 2.2 : me.y < 2.5; if (yOk && d < it.r && d < bd) { best = it; bd = d; } }
      return best;
    },
    tick(t) { anim.forEach((f) => f(t)); },
    dispose() { off(qRef); offCh(); },
  };
}
