// Спільна 3D-школа: учні бачать одне одного й ходять коридорами. Кожні двері — майбутня гра з теми.
import * as THREE from "three";
import { h, mount, toast } from "./ui.js";
import { r, set, push, onValue, off, onDisconnect, remove, query, limitToLast } from "./fb.js";
import { buildAvatar } from "./avatar.js";
import { awardBadges } from "./store.js";
import { SECTIONS, TOPICS, shortTitle } from "../content/index.js";
import { rankOf } from "./game.js";

const PHRASES = ["Привіт! 👋", "Ходімо вчитися! 📚", "Молодець! 👍", "Дякую! 🙏", "У мене 100 %! 💯", "Хто зі мною? 🙋", "До зустрічі! 👋"];
const EMOTES = [["👋", "wave"], ["💃", "dance"], ["🦘", "jump"]];
const BAD = /(бля|сук|хуй|хуя|пізд|пизд|єба|еба|йоба|залуп|дебіл|ідіот|идиот|лох)/gi;

export function openWorld(state) {
  const u = state.user, uid = state.uid;
  // ---------- Інтерфейс поверх сцени ----------
  const canvasWrap = h("div.world__canvas");
  const prompt = h("div.world__prompt");
  const chatLog = h("div.chat__log");
  const chatInput = h("input.input", { maxlength: 120, placeholder: "Написати в чат…" });
  const chatBox = h("div.chat", chatLog, h("form.chat__form", { onsubmit: (e) => { e.preventDefault(); sendChat(); } }, chatInput, h("button.btn.btn--primary.btn--small", "→")));
  const online = h("div.world__online");
  const stick = h("div.stick", h("div.stick__knob"));
  mount(h("div.world",
    canvasWrap,
    h("div.world__top",
      h("a.btn.btn--small", { href: "#/" }, "← Вийти зі школи"),
      online),
    prompt,
    h("div.world__bottom",
      h("div.phrases", PHRASES.map((p) => h("button.chipbtn", { onclick: () => emote(p) }, p)),
        EMOTES.map(([ic, a]) => h("button.chipbtn", { onclick: () => emote(null, a) }, ic))),
      chatBox),
    stick,
    h("div.world__help", "WASD / стрілки — ходити · тягни мишкою — повертати камеру · на телефоні — джойстик ліворуч")));

  // ---------- Сцена ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasWrap.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#eef5ff");
  scene.fog = new THREE.Fog("#eef5ff", 30, 75);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6dd, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(10, 20, 8); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);

  const walls = [];   // [minX, maxX, minZ, maxZ]
  const doors = [];   // { x, z, label, topic, nx, nz }
  buildSchool(scene, walls, doors);

  // ---------- Мій персонаж ----------
  const me = { x: (Math.random() - 0.5) * 8, z: 6 + Math.random() * 4, ry: Math.PI, mv: 0, model: buildAvatar(u.avatar), action: null, actionT: 0 };
  scene.add(me.model);
  me.model.add(nameSprite(u.name, rankOf(u.xp).icon));
  let camYaw = 0, camPitch = 0.35;

  // ---------- Інші учні ----------
  const others = new Map();
  const presRef = r("presence");
  const myRef = r(`presence/${uid}`);
  onDisconnect(myRef).remove();
  onValue(presRef, (s) => {
    const all = s.val() || {};
    const now = Date.now();
    for (const [id, p] of Object.entries(all)) {
      if (id === uid || now - (p.t || 0) > 60000) continue;
      let o = others.get(id);
      const avKey = JSON.stringify(p.av || {});
      if (!o || o.avKey !== avKey) {
        if (o) scene.remove(o.model);
        o = { model: buildAvatar(p.av), avKey, x: p.x, z: p.z, ry: p.ry, tx: p.x, tz: p.z, tr: p.ry };
        o.model.add(nameSprite(p.name, p.rk || ""));
        scene.add(o.model);
        others.set(id, o);
      }
      Object.assign(o, { tx: p.x, tz: p.z, tr: p.ry, mv: p.mv, name: p.name });
      if (p.e && p.e.t !== o.eT) { o.eT = p.e.t; if (now - p.e.t < 5000) { if (p.e.text) bubble(o.model, p.e.text); if (p.e.a) { o.action = p.e.a; o.actionT = 0; } } }
    }
    for (const [id, o] of others) if (!all[id] || now - (all[id].t || 0) > 60000) { scene.remove(o.model); others.delete(id); }
    online.textContent = `🟢 У школі: ${others.size + 1}`;
  });

  let lastSent = 0, lastKey = "";
  function sendPresence(force) {
    const now = Date.now();
    const key = `${me.x.toFixed(2)},${me.z.toFixed(2)},${me.ry.toFixed(2)},${me.mv}`;
    if (!force && (now - lastSent < 120 || (key === lastKey && now - lastSent < 4000))) return;
    lastSent = now; lastKey = key;
    set(myRef, { name: u.name, cls: u.cls, rk: rankOf(u.xp).icon, av: u.avatar || null, x: +me.x.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2), mv: me.mv, t: now, e: me.e || null });
  }
  function emote(text, action) {
    me.e = { text: text || null, a: action || null, t: Date.now() };
    if (text) bubble(me.model, text);
    if (action) { me.action = action; me.actionT = 0; }
    sendPresence(true);
  }

  // ---------- Чат (вмикає вчитель) ----------
  const chatRef = query(r("chat"), limitToLast(30));
  onValue(chatRef, (s) => {
    const msgs = Object.values(s.val() || {});
    chatLog.replaceChildren(...msgs.map((m) => h("div.chat__m", h("b", m.name + ": "), m.text)));
    chatLog.scrollTop = chatLog.scrollHeight;
  });
  const setsRef = r("settings/chatEnabled");
  onValue(setsRef, (s) => chatBox.classList.toggle("off", s.val() !== true));
  function sendChat() {
    const text = chatInput.value.trim().replace(BAD, "***").slice(0, 120);
    if (!text) return;
    chatInput.value = "";
    push(r("chat"), { uid, name: u.name, text, t: Date.now() }).catch(() => toast("Чат вимкнено вчителем", "warn"));
    bubble(me.model, text);
  }

  // ---------- Керування ----------
  const keys = new Set();
  const kd = (e) => { if (e.target.tagName === "INPUT") return; keys.add(e.code); if (e.code === "KeyE" || e.code === "Enter") useDoor(); };
  const ku = (e) => keys.delete(e.code);
  addEventListener("keydown", kd); addEventListener("keyup", ku);
  let drag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  const pm = (e) => { if (!drag || drag.id !== e.pointerId) return; camYaw -= (e.clientX - drag.x) * 0.006; camPitch = Math.max(0.05, Math.min(1.1, camPitch + (e.clientY - drag.y) * 0.004)); drag.x = e.clientX; drag.y = e.clientY; };
  const pu = (e) => { if (drag?.id === e.pointerId) drag = null; };
  addEventListener("pointermove", pm); addEventListener("pointerup", pu);
  // Джойстик
  const joy = { x: 0, y: 0, id: null };
  stick.addEventListener("pointerdown", (e) => { joy.id = e.pointerId; stick.setPointerCapture(e.pointerId); moveJoy(e); });
  stick.addEventListener("pointermove", (e) => { if (joy.id === e.pointerId) moveJoy(e); });
  stick.addEventListener("pointerup", () => { joy.id = null; joy.x = joy.y = 0; stick.firstChild.style.transform = ""; });
  function moveJoy(e) {
    const b = stick.getBoundingClientRect();
    let dx = (e.clientX - b.left - b.width / 2) / (b.width / 2), dy = (e.clientY - b.top - b.height / 2) / (b.height / 2);
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    joy.x = dx; joy.y = dy;
    stick.firstChild.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
  }

  let nearDoor = null;
  function useDoor() {
    if (!nearDoor) return;
    if (nearDoor.topic?.ready) location.hash = `#/topic/${nearDoor.topic.id}`;
    else toast("🚧 Тут з’явиться 3D-гра з цієї теми. Незабаром!", "info", 3000);
  }
  prompt.addEventListener("click", useDoor);

  // ---------- Цикл ----------
  const clock = new THREE.Clock();
  let alive = true;
  function resize() { const w = canvasWrap.clientWidth, hh = canvasWrap.clientHeight; renderer.setSize(w, hh); cam.aspect = w / hh; cam.updateProjectionMatrix(); }
  addEventListener("resize", resize); resize();

  function collide(x, z) {
    const R = 0.45;
    for (const [a, b, c, d] of walls) if (x + R > a && x - R < b && z + R > c && z - R < d) return true;
    return false;
  }

  function loop() {
    if (!alive) return;
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    // напрям руху відносно камери
    let fx = 0, fz = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) fz -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) fz += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) fx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) fx += 1;
    fx += joy.x; fz += joy.y;
    const len = Math.hypot(fx, fz);
    me.mv = len > 0.1 ? 1 : 0;
    if (me.mv) {
      fx /= Math.max(1, len); fz /= Math.max(1, len);
      const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
      const wx = fx * cos + fz * sin, wz = -fx * sin + fz * cos;
      const sp = 5.5 * dt;
      const nx = me.x + wx * sp, nz = me.z + wz * sp;
      if (!collide(nx, me.z)) me.x = nx;
      if (!collide(me.x, nz)) me.z = nz;
      const target = Math.atan2(wx, wz);
      me.ry += angDiff(me.ry, target) * Math.min(1, dt * 12);
    }
    applyAction(me, dt);
    me.model.position.set(me.x, me.model.position.y, me.z);
    me.model.rotation.y = me.ry;
    me.model.userData.animate(t, me.mv);

    for (const o of others.values()) {
      o.x += (o.tx - o.x) * Math.min(1, dt * 8);
      o.z += (o.tz - o.z) * Math.min(1, dt * 8);
      o.ry += angDiff(o.ry, o.tr) * Math.min(1, dt * 8);
      applyAction(o, dt);
      o.model.position.set(o.x, o.model.position.y, o.z);
      o.model.rotation.y = o.ry;
      o.model.userData.animate(t, o.mv || 0);
    }

    // камера позаду персонажа
    const dist = 6.5;
    cam.position.set(me.x + Math.sin(camYaw) * dist * Math.cos(camPitch), 1.6 + Math.sin(camPitch) * dist, me.z + Math.cos(camYaw) * dist * Math.cos(camPitch));
    cam.lookAt(me.x, 1.5, me.z);

    // двері поруч?
    nearDoor = null;
    for (const d of doors) if (Math.hypot(d.x - me.x, d.z - me.z) < 2.2) { nearDoor = d; break; }
    prompt.classList.toggle("on", !!nearDoor);
    if (nearDoor) prompt.replaceChildren(h("b", nearDoor.label), h("span", nearDoor.topic?.ready ? "Натисни E або сюди — відкрити тему" : "🚧 3D-гра незабаром"));

    sendPresence();
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
  sendPresence(true);
  awardBadges({ explorer: true });

  // Прибирання при виході
  const cleanup = () => {
    alive = false;
    removeEventListener("hashchange", cleanup);
    removeEventListener("keydown", kd); removeEventListener("keyup", ku);
    removeEventListener("pointermove", pm); removeEventListener("pointerup", pu);
    removeEventListener("resize", resize);
    off(presRef); off(setsRef); off(r("chat"));
    remove(myRef);
    renderer.dispose();
  };
  addEventListener("hashchange", cleanup);
}

function applyAction(o, dt) {
  if (!o.action) return;
  o.actionT += dt;
  const ud = o.model.userData, k = o.actionT;
  if (o.action === "wave") ud.arms[1].rotation.z = -2.6 + Math.sin(k * 12) * 0.4;
  if (o.action === "dance") { o.model.rotation.y += Math.sin(k * 8) * 0.3; ud.arms[0].rotation.z = Math.sin(k * 10) * 1.5; ud.arms[1].rotation.z = -Math.sin(k * 10) * 1.5; }
  if (o.action === "jump") o.model.position.y = Math.max(0, Math.sin(k * 6) * 1.2);
  if (k > 2) { o.action = null; ud.arms.forEach((a) => (a.rotation.z = 0)); o.model.position.y = 0; }
}
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------- Написи ----------
function textCanvas(lines, { w = 512, hgt = 128, bg = "#ffffff", fg = "#1e1b26", font = "bold 44px Manrope, sans-serif", radius = 24, border = "#99cc00" } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = hgt;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, hgt - 8, radius); g.fill();
  if (border) { g.strokeStyle = border; g.lineWidth = 8; g.stroke(); }
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.font = font;
  const L = [].concat(lines);
  L.forEach((s, i) => g.fillText(s, w / 2, hgt / 2 + (i - (L.length - 1) / 2) * (hgt / (L.length + 0.6)), w - 30));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function nameSprite(name, icon) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(`${icon} ${name}`, { w: 512, hgt: 110, font: "bold 52px Manrope, sans-serif" }), depthTest: false }));
  s.scale.set(1.8, 0.39, 1); s.position.y = 2.45; s.renderOrder = 10;
  return s;
}
function bubble(model, text) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(text, { w: 640, hgt: 130, bg: "#fffbe6", border: "#f7c915", font: "bold 48px Manrope, sans-serif" }), depthTest: false }));
  s.scale.set(2.6, 0.53, 1); s.position.y = 3.05; s.renderOrder = 11;
  model.add(s);
  setTimeout(() => model.remove(s), 4500);
}
function wrapWords(s, n = 18) {
  const out = []; let line = "";
  for (const w of s.split(" ")) { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + " " + w).trim(); }
  if (line) out.push(line);
  return out.slice(0, 3);
}

// ---------- Будівля ----------
function buildSchool(scene, walls, doors) {
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const wallM = M("#fbf9f4"), trimM = M("#99cc00"), floorM = M("#e9e3d6"), hallFloor = M("#f3efe6");
  const H = 4.2, T = 0.4;
  const addBox = (w, hh, d, x, y, z, m, solid = true) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); scene.add(b);
    if (solid) walls.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2]);
    return b;
  };

  // Підлога: шахова плитка в холі
  const tileTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
    g.fillStyle = "#f6f2ea"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#e3ead0"; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
  })();
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshLambertMaterial({ map: tileTex }));
  hall.rotation.x = -Math.PI / 2; scene.add(hall);

  // Хол 28×28 з чотирма проходами (ширина 6) у коридори
  const S = 14, G = 3; // половина холу, половина проходу
  for (const [sx, sz, horiz] of [[0, -S, true], [0, S, true], [-S, 0, false], [S, 0, false]]) {
    // дві частини стіни обабіч проходу
    const len = S - G;
    if (horiz) { addBox(len, H, T, -G - len / 2, H / 2, sz, wallM); addBox(len, H, T, G + len / 2, H / 2, sz, wallM); addBox(len, 0.3, T + 0.05, -G - len / 2, 0.15, sz, trimM, false); addBox(len, 0.3, T + 0.05, G + len / 2, 0.15, sz, trimM, false); }
    else { addBox(T, H, len, sx, H / 2, -G - len / 2, wallM); addBox(T, H, len, sx, H / 2, G + len / 2, wallM); addBox(T + 0.05, 0.3, len, sx, 0.15, -G - len / 2, trimM, false); addBox(T + 0.05, 0.3, len, sx, 0.15, G + len / 2, trimM, false); }
  }

  // Центр холу: великі літери Ї і Ґ та клумби
  const letter = (ch, x, z, color) => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    g.fillStyle = color; g.font = "900 220px Unbounded, Manrope, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 128, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(3, 3, 1); s.position.set(x, 2.4, z); scene.add(s);
    addBox(2.2, 0.8, 2.2, x, 0.4, z, M("#e5e0ee"));
  };
  letter("Ї", -4, -3, "#9d6bdb"); letter("Ґ", 4, -3, "#99cc00");
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) {
    addBox(1.6, 0.6, 1.6, x, 0.3, z, M("#c9a36b"));
    const tree = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), M("#7fb83a")); tree.position.set(x, 1.7, z); scene.add(tree);
  }
  // Вивіска з логотипом над входом (південна стіна позаду старту)
  new THREE.TextureLoader().load("assets/logo-wordmark.png", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.95), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.set(-8.5, 2.8, S - 0.25); m.rotation.y = Math.PI; scene.add(m);
  });
  const welcome = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.7), new THREE.MeshBasicMaterial({ map: textCanvas(["Школа української мови", "5 клас"], { w: 700, hgt: 170, font: "bold 50px Manrope, sans-serif" }) }));
  welcome.position.set(8.5, 2.8, S - 0.25); welcome.rotation.y = Math.PI; scene.add(welcome);

  // Коридори: [напрям, розділи]
  const wings = [
    { dir: [0, -1], label: "Лексикологія · Фразеологія", topics: TOPICS.filter((t) => t.s === "s2" || t.s === "s3") },
    { dir: [1, 0], label: "Фонетика · Орфографія", topics: TOPICS.filter((t) => t.s === "s4" || t.s === "s5") },
    { dir: [-1, 0], label: "Синтаксис і пунктуація", topics: TOPICS.filter((t) => t.s === "s6") },
    { dir: [0, 1], label: "Мова · Розвиток мовлення", topics: TOPICS.filter((t) => t.s === "s1" || t.s === "s7"), extra: ["Бібліотека", "Спортзал", "Їдальня", "Актова зала"] },
  ];
  const doorColors = { s1: "#f7c915", s2: "#99cc00", s3: "#9d6bdb", s4: "#f7c915", s5: "#99cc00", s6: "#9d6bdb", s7: "#f7c915" };

  for (const w of wings) {
    const items = [...w.topics.map((t) => ({ label: shortTitle(t), topic: t, color: doorColors[t.s] })), ...(w.extra || []).map((l) => ({ label: l, color: "#c9a36b" }))];
    const perSide = Math.ceil(items.length / 2);
    const step = 5;
    const L = perSide * step + 6; // довжина коридору
    const [dx, dz] = w.dir;
    // Локальні координати: u — уздовж коридору (від холу), v — поперек
    const toW = (u, v) => (dx !== 0 ? [dx * (S + u), v * dx] : [-v * dz, dz * (S + u)]);
    const cw = 2 * G; // ширина = ширина проходу
    // Підлога
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(dx ? L : cw, dx ? cw : L), floorM);
    const [fx, fz] = toW(L / 2, 0); fl.position.set(fx, 0.01, fz); fl.rotation.x = -Math.PI / 2; scene.add(fl);
    // Бічні стіни й торцева
    for (const side of [-1, 1]) {
      const [x, z] = toW(L / 2, side * (G + T / 2));
      addBox(dx ? L : T, H, dx ? T : L, x, H / 2, z, wallM);
      addBox(dx ? L : T + 0.05, 0.3, dx ? T + 0.05 : L, x, 0.15, z, trimM, false);
    }
    const [ex, ez] = toW(L + T / 2, 0); addBox(dx ? T : cw + 2 * T, H, dx ? cw + 2 * T : T, ex, H / 2, ez, wallM);
    // Табличка над входом у коридор
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1), new THREE.MeshBasicMaterial({ map: textCanvas(w.label, { w: 900, hgt: 160, font: "bold 64px Manrope, sans-serif", bg: "#1e1b26", fg: "#ffffff" }) }));
    const [sx, sz] = toW(-0.3, 0); sign.position.set(sx, 3.5, sz); sign.lookAt(0, 3.5, 0); scene.add(sign);
    // Лампи
    for (let u = 4; u < L; u += 8) { const [lx, lz] = toW(u, 0); const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), new THREE.MeshBasicMaterial({ color: "#fff6c9" })); lamp.position.set(lx, H - 0.1, lz); scene.add(lamp); }

    // Двері
    items.forEach((it, i) => {
      const side = i % 2 ? 1 : -1;
      const u = 4 + Math.floor(i / 2) * step;
      const [x, z] = toW(u, side * (G - 0.02));
      const door = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.12), M("#2a2733"));
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.8, 0.14), M(it.color));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08), M("#f4f1f9"));
      frame.position.y = 1.5; leaf.position.set(0, 1.42, 0.02); knob.position.set(0.6, 1.4, 0.12);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: textCanvas(wrapWords(it.label), { w: 640, hgt: 240, font: "bold 46px Manrope, sans-serif", border: it.color }) }));
      plate.position.set(0, 3.55, 0.08);
      door.add(frame, leaf, knob, plate);
      door.position.set(x, 0, z);
      // повертаємо двері лицем до коридору
      const [cx, cz] = toW(u, 0);
      door.lookAt(cx, 0, cz);
      scene.add(door);
      doors.push({ x: x + (cx - x) * 0.35, z: z + (cz - z) * 0.35, label: it.label, topic: it.topic });
    });
  }
}
