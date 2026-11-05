// Спільна 3D-школа: учні бачать одне одного й ходять коридорами. Кожні двері — майбутня гра з теми.
import * as THREE from "three";
import { h, mount, toast, modal } from "./ui.js";
import { r, set, push, onValue, off, onDisconnect, remove, query, limitToLast } from "./fb.js";
import { buildAvatar, petFollower, buildSleigh, santaDressed, SLEIGH_NEEDS } from "./avatar.js";
import { awardBadges, owns } from "./store.js";
import { SECTIONS, TOPICS, shortTitle } from "../content/index.js";
import { rankOf } from "./game.js";
import { halloweenOn } from "./config.js";
import { setupQuest } from "./hwquest.js";
import { buildOutdoor } from "./outdoor.js";
import { mergeStatic } from "./merge.js";
import { openGame, huntWord, reward, GAMES } from "./minigames.js";

// Політ: мітла — найвище й найшвидше; крила й плащ — нижче. Пішки — 5,5 м/с.
// Кожен поверх — хол 28×28 і до чотирьох крил. Поверхи стоять один на одному (висота поверху FH).
const FH = 4.6;
const STAIRS = { x: -10.5, z: -10.5, land: { x: -7, z: -7.5 } };
const MUSEUM = [
  "В українській абетці 33 букви.",
  "Апостроф — не буква, а знак: він показує, що букви я, ю, є, ї після нього позначають два звуки.",
  "Тільки в українській серед слов’янських мов є кличний відмінок у звертаннях: Олено! Тарасе! Друже!",
  "Буква Ґ повернулася до українського правопису 1990 року: ґанок, ґудзик, ґава.",
  "Слова «привіт» і «вітати» — спільнокореневі: обидва про те, щоб побажати добра.",
  "Буква Ї завжди позначає два звуки [йі]: їжак, Україна.",
];
const INFO = {
  canteen: "🍲 Смачного! А міні-гра «Рибалка» чекає на пристані біля озера за школою.",
  hall: "🎭 Тут проходять свята й виступи. Скоро — шкільний концерт!",
  teachers: "☕ Тссс… тут учителі перевіряють зошити 🤫",
  museum: () => "🏛️ Музей мови: " + MUSEUM[Math.floor(Math.random() * MUSEUM.length)],
  med: "🩺 Медпункт: пий воду й роби перерви, коли довго сидиш за екраном 💧",
  music: "🎵 Музична зала: пісня — теж текст! Спробуй знайти в улюбленій пісні звертання.",
  art: "🎨 Мистецька студія: тут малюють ментальні карти до правил.",
  chess: "♟️ Шаховий клуб: шахи тренують увагу — так само, як пошук орфограм.",
  stars: "🔭 Обсерваторія: «зоря — зірка — зоряний» — спільнокореневі слова ✨",
  pets: "🌱 Живий куточок: «кіт — котик — котячий»: у корені чергуються і та о 🐱",
};
const FLOORS = [
  { W: { label: "Синтаксис і пунктуація", sec: ["s6"] }, N: { label: "Лексикологія · Фразеологія", sec: ["s2", "s3"] },
    E: { label: "Бібліотека · Спортзал · Ігри", extra: [["📚 Бібліотека", "game", "anagram"], ["🏀 Спортзал", "game", "blitz"], ["🍲 Їдальня", "info", "canteen"], ["🎭 Актова зала", "info", "hall"], ["🎲 Ігрова кімната", "game", "pairs"]] },
    S: { label: "Мова · Розвиток мовлення", sec: ["s1", "s7"], exit: true } },
  { W: { label: "Фонетика · Графіка · Орфоепія", sec: ["s4"] }, N: { label: "Будова слова. Орфографія", sec: ["s8"] }, E: { label: "Орфографія", sec: ["s5"] },
    S: { label: "Учительська · Музей мови", extra: [["☕ Учительська", "info", "teachers"], ["🏛️ Музей мови", "info", "museum"], ["🩺 Медпункт", "info", "med"]] } },
  { W: { label: "Клуби й студії", extra: [["💻 Комп’ютерний клас", "game", "typing"], ["🎵 Музична зала", "info", "music"], ["🎨 Мистецька студія", "info", "art"], ["♟️ Шаховий клуб", "info", "chess"]] },
    N: { label: "Обсерваторія", extra: [["🔭 Обсерваторія", "info", "stars"], ["🌱 Живий куточок", "info", "pets"]] },
    E: { label: "Кімната головоломок", extra: [["🧩 Кімната головоломок", "game", "gap"]] } },
];
const infoText = (k) => (typeof INFO[k] === "function" ? INFO[k]() : INFO[k]);


const SLEIGH_FLY = { maxY: 16, speed: 12 };
const FLY = { "back.broom": { maxY: 14, speed: 10.5 }, "back.bat-wings": { maxY: 6, speed: 9 }, "back.vampire-cape": { maxY: 6, speed: 8.5 } };

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
  // Сани Санти: у костюмі й шапці Санти, якщо куплено обох оленів і сани
  const SLEIGH = santaDressed(u.avatar) && SLEIGH_NEEDS.every(owns);
  const flyCfg = SLEIGH ? SLEIGH_FLY : FLY[u.avatar?.back];
  const canFly = !!flyCfg;
  const flyIcon = SLEIGH ? "🛷" : { "back.broom": "🧹", "back.bat-wings": "🦇", "back.vampire-cape": "🧛" }[u.avatar?.back] || "🪽";
  const flyBtn = canFly ? h("button.btn.btn--small.flybtn", { onclick: () => toggleFly() }, SLEIGH ? "🛷 Сани з оленями" : `${flyIcon} Летіти`) : null;
  const pad = { up: false, down: false };
  const padBtn = (txt, k) => h("button.flypad__b", { onpointerdown: (e) => { e.preventDefault(); pad[k] = true; }, onpointerup: () => (pad[k] = false), onpointerleave: () => (pad[k] = false) }, txt);
  const flyPad = h("div.flypad", padBtn("⬆️", "up"), padBtn("⬇️", "down"));
  mount(h("div.world",
    canvasWrap,
    h("div.world__top",
      h("a.btn.btn--small", { href: "#/" }, "← Вийти зі школи"),
      flyBtn, online),
    flyPad,
    prompt,
    h("div.world__bottom",
      h("div.phrases", PHRASES.map((p) => h("button.chipbtn", { onclick: () => emote(p) }, p)),
        EMOTES.map(([ic, a]) => h("button.chipbtn", { onclick: () => emote(null, a) }, ic))),
      chatBox),
    stick,
    h("div.world__help", "WASD / стрілки — ходити · E — двері, сходи, ігри · тягни мишкою — повертати камеру · на телефоні — джойстик ліворуч")));

  // ---------- Сцена ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasWrap.append(renderer.domElement);
  const scene = new THREE.Scene();
  const HW = halloweenOn(state.settings);
  scene.background = new THREE.Color(HW ? "#2a2140" : "#bfe3ff");
  scene.fog = new THREE.Fog(HW ? "#2a2140" : "#bfe3ff", HW ? 40 : 70, HW ? 150 : 240);
  scene.add(new THREE.HemisphereLight(HW ? 0xd9ccff : 0xffffff, HW ? 0x6a4a3a : 0xcfc6dd, HW ? 1.25 : 1.7));
  const sun = new THREE.DirectionalLight(HW ? 0xffd2a0 : 0xffffff, HW ? 0.85 : 1.2); sun.position.set(10, 20, 8); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 420);

  const walls = [];   // [minX, maxX, minZ, maxZ]
  const doors = [];   // { x, z, label, topic, nx, nz }
  const school = buildSchool(scene, walls, doors, HW);
  const out = buildOutdoor(scene, HW);
  const hwTick = HW ? decorateHalloween(scene, doors.filter((d) => !d.floor && !d.stairs)) : null;
  // Таємна кімната з квестом (лише в геловінський час)
  const quest = HW ? setupQuest({ scene, walls, uid, teleport: (p) => { me.floor = 0; me.x = p.x; me.z = p.z; me.ry = p.ry; camYaw = p.ry + Math.PI; sendPresence(true); } }) : null;
  if (quest) { document.querySelector(".world")?.append(quest.panel); document.querySelector(".world__bottom")?.prepend(quest.lightUi); quest.setMe(() => ({ x: me.x, y: me.y, z: me.z, broom: me.fly && u.avatar?.back === "back.broom" })); }

  // ---------- Мій персонаж ----------
  const me = { x: (Math.random() - 0.5) * 8, z: 6 + Math.random() * 4, ry: Math.PI, mv: 0, y: 0, floor: 0, base: 0, fly: false, model: buildAvatar(u.avatar), action: null, actionT: 0 };
  scene.add(me.model);
  me.pet = petFollower(me.model, scene);
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
        if (o) { scene.remove(o.model); o.pet?.dispose(); }
        o = { model: buildAvatar(p.av), avKey, x: p.x, z: p.z, ry: p.ry, tx: p.x, tz: p.z, tr: p.ry, y: p.y || 0 };
        o.model.add(nameSprite(p.name, p.rk || ""));
        o.model.position.set(p.x, 0, p.z);
        scene.add(o.model);
        o.pet = petFollower(o.model, scene);
        others.set(id, o);
      }
      Object.assign(o, { tx: p.x, tz: p.z, tr: p.ry, mv: p.mv, name: p.name, ty: p.y || 0, f: p.f || 0, fly: !!p.fl, sl: p.fl === "s" });
      if (p.e && p.e.t !== o.eT) { o.eT = p.e.t; if (now - p.e.t < 5000) { if (p.e.text) bubble(o.model, p.e.text); if (p.e.a) { o.action = p.e.a; o.actionT = 0; } } }
    }
    for (const [id, o] of others) if (!all[id] || now - (all[id].t || 0) > 60000) { scene.remove(o.model); o.pet?.dispose(); others.delete(id); }
    online.textContent = `🟢 У школі: ${others.size + 1}`;
  });

  let lastSent = 0, lastKey = "";
  function sendPresence(force) {
    const now = Date.now();
    const key = `${me.x.toFixed(2)},${me.z.toFixed(2)},${me.ry.toFixed(2)},${me.mv},${me.y.toFixed(1)},${me.floor}`;
    if (!force && (now - lastSent < 120 || (key === lastKey && now - lastSent < 4000))) return;
    lastSent = now; lastKey = key;
    set(myRef, { name: u.name, cls: u.cls, rk: rankOf(u.xp).icon, av: u.avatar || null, x: +me.x.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2), mv: me.mv, y: +me.y.toFixed(2), f: me.floor || null, fl: me.fly ? (SLEIGH ? "s" : true) : null, t: now, e: me.e || null });
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
  const kd = (e) => { if (e.target.tagName === "INPUT" || document.body.classList.contains("mg-open")) return; keys.add(e.code); if (e.code === "KeyE" || e.code === "Enter") useDoor(); if (e.code === "KeyF" && canFly) toggleFly(); if (e.code === "KeyG") quest?.throwLight(); if (e.code === "Space" && me.fly) e.preventDefault(); };
  function toggleFly() {
    me.fly = !me.fly;
    flyBtn.textContent = me.fly ? "🛬 Приземлитися" : `${flyIcon} Летіти`;
    flyPad.classList.toggle("on", me.fly);
    if (me.fly) { me.y = Math.max(me.y, 1.2); toast(`Пробіл / ⬆️ — вгору, C / ⬇️ — вниз, WASD — у будь-який бік, F — приземлитися. Висота до ${flyCfg.maxY} м${u.avatar?.back === "back.broom" ? " — на мітлі найвище!" : ""}`, "info", 4500); }
    sendPresence(true);
  }
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
    if (nearDoor.act) return nearDoor.act();
    if (nearDoor.stairs) return chooseFloor();
    if (nearDoor.game) return openGame(nearDoor.game);
    if (nearDoor.hunt) return startHunt();
    if (nearDoor.info) return toast(infoText(nearDoor.info) ?? nearDoor.info, "info", 7000);
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
    const R = 0.45, y = me.y, f = me.floor;
    for (const w of walls) {
      if ((w[4] ?? 0) !== f || y > (w[5] ?? Infinity)) continue;
      if (x + R > w[0] && x - R < w[1] && z + R > w[2] && z - R < w[3]) return true;
    }
    return f === 0 && out.blocked(x, z, y);
  }
  // Поверхи: вище за мій ховаємо, коли я в будівлі (щоб не заважала стеля)
  const insideB = () => me.floor > 0 || school.inside(me.x, me.z, 0);
  const FLOOR_NAMES = ["хол, синтаксис, лексика, бібліотека, спортзал, вихід надвір", "фонетика, орфографія, будова слова, музей мови", "клуби, комп’ютерний клас, кімната головоломок"];
  function chooseFloor() {
    const close = modal(h("div.center", h("h2", "🪜 Куди йдемо?"),
      h("div.floors", [0, 1, 2].map((n) => h(`button.btn${n === me.floor ? "" : ".btn--primary"}`, { disabled: n === me.floor, onclick: () => { close(); goFloor(n); } }, h("b", `${n + 1} поверх`), h("small", FLOOR_NAMES[n]))))));
  }
  function goFloor(n) {
    if (me.fly) toggleFly();
    me.floor = n; me.x = STAIRS.land.x; me.z = STAIRS.land.z + 1; me.y = 0; me.ry = Math.PI * 0.75; camYaw = me.ry + Math.PI;
    sendPresence(true);
    toast(`🪜 ${n + 1} поверх`, "info", 1500);
  }
  // Квест «Знайди букви»
  const huntBox = h("div.hunt");
  document.querySelector(".world")?.append(huntBox);
  function drawHunt() {
    const H = out.hunt;
    huntBox.classList.toggle("on", H.on);
    if (!H.on) return;
    const d = out.huntNearest(me);
    huntBox.replaceChildren(h("b", "🔎 Знайди букви"), h("div.hunt__w", H.word.split("").map((ch, i) => h(`span${H.got[i] ? ".on" : ""}`, H.got[i] ? ch.toUpperCase() : "?"))),
      h("small", d < 12 ? "🔥 Гаряче!" : d < 30 ? "🌤 Тепліше" : "❄️ Холодно — шукай у парку й лісі"), h("button.btn.btn--small", { onclick: () => { out.stopHunt(); drawHunt(); } }, "✕"));
  }
  async function startHunt() {
    if (out.hunt.on) return toast("Квест уже триває — шукай букви!", "info");
    out.startHunt(await huntWord());
    toast("🔎 Букви сховано в парку й лісі. Підійди до букви — і вона твоя!", "info", 5000);
    drawHunt();
  }
  out.hunt.onGot = async () => {
    drawHunt();
    if (out.hunt.got.every(Boolean)) {
      const w = out.hunt.word; out.stopHunt(); drawHunt();
      const r = await reward("hunt", w.length * 4);
      toast(`🎉 Слово «${w}» зібрано!${r.gain ? ` +${r.gain} 🪙` : ""}`, "win", 5000);
    }
  };
  if (location.search.includes("emu=1")) window.__w = { me, goFloor, out, school, startHunt, renderer, collide, setCam: (y, p) => { camYaw = y; camPitch = p; } }; // лише для тестів в емуляторі
  out.setOnGoal(() => { toast("⚽ ГО-О-ОЛ! 🎉", "win", 2500); emote("⚽ Гол!", "jump"); });
  try { if (!localStorage.getItem("school3f")) { localStorage.setItem("school3f", "1"); setTimeout(() => toast("🆕 У школі тепер 3 поверхи: сходи — у дальньому лівому кутку холу, за літерою Ї, а через південне крило — вихід надвір: ліс, озера, тварини й міні-ігри!", "info", 8000), 1500); } } catch {}

  const lods = [...school.lod, ...out.lod], tmpV = new THREE.Vector3(); let lodT = -1, stairsCd = 0;
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
      const sp = (me.fly ? flyCfg.speed : insideB() ? 5.5 : 7) * dt;
      const nx = me.x + wx * sp, nz = me.z + wz * sp;
      if (!collide(nx, me.z)) me.x = nx;
      if (!collide(me.x, nz)) me.z = nz;
      const target = Math.atan2(wx, wz);
      me.ry += angDiff(me.ry, target) * Math.min(1, dt * 12);
    }
    // Політ: висота від 0 до 7 м
    if (me.fly) {
      const vy = (keys.has("Space") || pad.up ? 1 : 0) - (keys.has("KeyC") || keys.has("ShiftLeft") || pad.down ? 1 : 0);
      me.y = Math.max(0.6, Math.min(insideB() ? FH - 2.4 : flyCfg.maxY, me.y + vy * 4 * dt));
    } else me.y = Math.max(0, me.y - 5 * dt);
    me.base = me.floor * FH;
    const inB = insideB();
    if (t - lodT > 0.4) { lodT = t; for (const L of lods) { L.o.getWorldPosition(tmpV); L.o.visible = (!L.out || !inB) && (tmpV.x - me.x) ** 2 + (tmpV.z - me.z) ** 2 < L.d * L.d && (L.out || Math.abs(tmpV.y - me.base) < 6); } }
    school.groups.forEach((g, f) => (g.visible = !inB || f <= me.floor));
    applyAction(me, dt);
    me.model.position.set(me.x, me.action ? me.model.position.y : me.base + me.y + (me.fly ? Math.sin(t * 2) * 0.08 : 0), me.z);
    me.model.rotation.y = me.ry;
    me.model.userData.animate(t, me.fly ? 0 : me.mv);
    flyPose(me.model, me.fly || me.y > 0.05, t, SLEIGH && (me.fly || me.y > 0.05));
    me.pet?.update(dt, t, me.x, me.z, me.ry, me.base + me.y * 0.85);
    out.tick(t, dt, me.floor === 0 ? me : null);
    hwTick?.(t, me);
    quest?.tick(t);

    for (const o of others.values()) {
      o.x += (o.tx - o.x) * Math.min(1, dt * 8);
      o.z += (o.tz - o.z) * Math.min(1, dt * 8);
      o.ry += angDiff(o.ry, o.tr) * Math.min(1, dt * 8);
      o.y += ((o.ty || 0) - o.y) * Math.min(1, dt * 8);
      o.base = (o.f || 0) * FH;
      const vis = !inB || (o.f || 0) <= me.floor;
      o.model.visible = vis; (o.model.userData.pets || []).forEach((p) => (p.visible = vis));
      applyAction(o, dt);
      o.model.position.set(o.x, o.action ? o.model.position.y : o.base + o.y + (o.fly ? Math.sin(t * 2 + o.x) * 0.08 : 0), o.z);
      o.model.rotation.y = o.ry;
      o.model.userData.animate(t, o.fly ? 0 : o.mv || 0);
      flyPose(o.model, o.fly || o.y > 0.05, t, o.sl && (o.fly || o.y > 0.05));
      o.pet?.update(dt, t, o.x, o.z, o.ry, o.base + o.y * 0.85);
    }

    // камера позаду персонажа
    const dist = 6.5;
    cam.position.set(me.x + Math.sin(camYaw) * dist * Math.cos(camPitch), me.base + me.y + 1.6 + Math.sin(camPitch) * dist, me.z + Math.cos(camYaw) * dist * Math.cos(camPitch));
    if (me.floor === 0 && quest?.inRoom(me)) quest.clampCam(cam);
    cam.lookAt(me.x, me.base + me.y + 1.5, me.z);

    // двері поруч?
    nearDoor = null;
    for (const d of doors) if ((d.floor || 0) === me.floor && Math.hypot(d.x - me.x, d.z - me.z) < (d.r || 2.2)) { nearDoor = d; break; }
    // Пішов на сходи — одразу питаємо, на який поверх
    if (me.mv && !me.fly && t > stairsCd && Math.abs(me.x - STAIRS.x) < 2.5 && Math.abs(me.z - STAIRS.z) < 2.5 && !document.querySelector(".modal")) { stairsCd = t + 4; chooseFloor(); }
    if (!nearDoor && me.floor === 0 && !inB) for (const s of out.spots) { const [sx, sz] = out.animalPos(s); if (Math.hypot(sx - me.x, sz - me.z) < s.r) { nearDoor = s; break; } }
    if (out.hunt.on && (t * 3 | 0) !== drawHunt.k) { drawHunt.k = t * 3 | 0; drawHunt(); }
    const qi = quest && me.floor === 0 ? quest.interacts(me) : null;
    if (qi) nearDoor = qi;
    quest?.panel.classList.toggle("on", me.floor === 0 && quest.inRoom(me));
    prompt.classList.toggle("on", !!nearDoor);
    if (qi) prompt.replaceChildren(h("b", qi.label), h("span", qi.sub));
    else if (nearDoor) prompt.replaceChildren(h("b", nearDoor.label), h("span", nearDoor.sub || (nearDoor.topic ? (nearDoor.topic.ready ? "Натисни E або сюди — відкрити тему" : "🚧 3D-гра незабаром") : nearDoor.game ? `Натисни E — грати «${GAMES[nearDoor.game].title}» 🎮` : nearDoor.info ? "Натисни E — дізнатися цікаве" : "")));

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
    quest?.dispose();
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
  if (o.action === "jump") o.model.position.y = (o.base || 0) + Math.max(0, Math.sin(k * 6) * 1.2);
  if (k > 2) { o.action = null; ud.arms.forEach((a) => (a.rotation.z = 0)); o.model.position.y = o.base || 0; }
}
// Поза в польоті: мітла під персонажем, крила махають, плащ розвівається
function flyPose(model, on, t, sleigh = false) {
  sleighPose(model, sleigh, t);
  if (sleigh) return;
  const broom = model.getObjectByName("broom");
  if (broom) {
    if (on) { broom.rotation.set(Math.PI / 2, 0, 0); broom.position.set(0, 0.62, 0.15); } else { broom.rotation.set(0, 0, 0.7); broom.position.set(0, 1.0, -0.28); }
    // сидимо верхи: ноги обертаємо від стегна вперед уздовж держака, руки тримають мітлу
    for (const leg of model.userData.legs) { if (on) { leg.rotation.x = -1.4; leg.position.y = 0.58; leg.position.z = 0.69; } else { leg.position.y = 0; leg.position.z = 0; } }
    if (on) model.userData.arms.forEach((a) => (a.rotation.x = -0.9));
  }
  for (const [n, s] of [["wingL", -1], ["wingR", 1]]) { const w = model.getObjectByName(n); if (w) w.rotation.y = on ? s * Math.sin(t * 10) * 0.6 : 0; }
  const cape = model.getObjectByName("cape");
  if (cape) cape.rotation.x = on ? -0.6 - Math.sin(t * 8) * 0.12 : 0;
}
// Сани з оленями: персонаж сидить у санях, олені «скачуть» у повітрі; олені-улюбленці на цей час запряжені
function sleighPose(model, on, t) {
  let rig = model.getObjectByName("sleighrig");
  if (!rig && !on) return;
  if (!rig) { rig = buildSleigh(); rig.position.set(0, 0.02, 0.2); model.add(rig); }
  rig.visible = on;
  for (const p of model.userData.pets || []) if (p.userData.petId === "pet.reindeer" || p.userData.petId === "pet.rudolf") p.visible = !on;
  for (const leg of model.userData.legs) { if (on) { leg.rotation.x = -1.4; leg.position.y = 0.5; leg.position.z = 0.6; } else if (!model.getObjectByName("broom")) { leg.position.y = 0; leg.position.z = 0; } }
  if (!on) return;
  model.userData.arms.forEach((a) => (a.rotation.x = -1.0));
  rig.userData.deer.forEach((d, k) => { d.position.y = 0.1 + Math.sin(t * 6 + k) * 0.12; d.rotation.x = Math.sin(t * 6 + k) * 0.12; });
}
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------- Написи ----------
function textCanvas(lines, { w = 512, hgt = 128, bg = "#ffffff", fg = "#1e1b26", font = "bold 44px Fixel Text, sans-serif", radius = 24, border = "#99cc00" } = {}) {
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
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(`${icon} ${name}`, { w: 512, hgt: 110, font: "bold 52px Fixel Text, sans-serif" }), depthTest: false }));
  s.scale.set(1.8, 0.39, 1); s.position.y = 2.45; s.renderOrder = 10;
  return s;
}
function bubble(model, text) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(text, { w: 640, hgt: 130, bg: "#fffbe6", border: "#f7c915", font: "bold 48px Fixel Text, sans-serif" }), depthTest: false }));
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
// Повертає { groups, inside(x, z, floor) } ; walls: [x0, x1, z0, z1, floor, top]
function buildSchool(scene, walls, doors, hw = false) {
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const wallM = M("#fbf9f4"), trimM = M("#99cc00"), floorM = M("#e9e3d6"), outerM = M("#f1e6d2");
  const H = 4.2, T = 0.4, S = 14, G = 3;
  const tileTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
    g.fillStyle = "#f6f2ea"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#e3ead0"; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
  })();
  const groups = [], rects = [[], [], []], lod = []; // відбитки поверхів (для «всередині»)
  const doorColors = { s1: "#f7c915", s2: "#99cc00", s3: "#9d6bdb", s4: "#f7c915", s5: "#99cc00", s6: "#9d6bdb", s7: "#f7c915", s8: "#f08fc0" };
  const TOP = FH * 3 + 0.5; // висота всієї будівлі: зовнішні стіни першого поверху не перелетиш нижче даху

  FLOORS.forEach((F, f) => {
    const grp = new THREE.Group(); grp.position.y = f * FH; scene.add(grp); groups.push(grp);
    const addBox = (w, hh, d, x, y, z, m, solid = true) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); grp.add(b);
      if (solid) walls.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2, f, f === 0 ? TOP : Infinity]);
      return b;
    };
    const hall = new THREE.Mesh(new THREE.PlaneGeometry(28.8, 28.8), new THREE.MeshLambertMaterial({ map: tileTex }));
    hall.rotation.x = -Math.PI / 2; hall.position.y = 0.005; grp.add(hall);
    rects[f].push([-S, S, -S, S]);
    // Стіни холу: прохід є лише туди, де на цьому поверсі є крило
    for (const [k, sx, sz, horiz] of [["N", 0, -S, true], ["S", 0, S, true], ["W", -S, 0, false], ["E", S, 0, false]]) {
      const len = S - G, open = !!F[k];
      if (horiz) {
        if (open) { addBox(len, H, T, -G - len / 2, H / 2, sz, wallM); addBox(len, H, T, G + len / 2, H / 2, sz, wallM); }
        else addBox(2 * S, H, T, 0, H / 2, sz, wallM);
        addBox(2 * S, 0.3, T + 0.05, 0, 0.15, sz, trimM, false);
      } else {
        if (open) { addBox(T, H, len, sx, H / 2, -G - len / 2, wallM); addBox(T, H, len, sx, H / 2, G + len / 2, wallM); }
        else addBox(T, H, 2 * S, sx, H / 2, 0, wallM);
        addBox(T + 0.05, 0.3, 2 * S, sx, 0.15, 0, trimM, false);
      }
    }
    // Сходи в кутку холу
    const stM = M("#c9a36b"), railM = M("#9d6bdb");
    for (let k = 0; k < 6; k++) addBox(3.4, 0.35 * (k + 1), 0.6, STAIRS.x, 0.175 * (k + 1), STAIRS.z + 1.5 - k * 0.6, stM, false);
    walls.push([STAIRS.x - 1.8, STAIRS.x + 1.8, STAIRS.z - 1.8, STAIRS.z + 1.8, f, Infinity]);
    addBox(0.12, 1, 3.6, STAIRS.x - 1.75, 1.6, STAIRS.z, railM, false); addBox(0.12, 1, 3.6, STAIRS.x + 1.75, 1.6, STAIRS.z, railM, false);
    const stSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.8), new THREE.MeshBasicMaterial({ map: textCanvas(`🪜 ${f + 1} поверх`, { w: 480, hgt: 128, font: "bold 54px Fixel Text, sans-serif", border: "#9d6bdb" }) }));
    stSign.position.set(STAIRS.x, 3.4, STAIRS.z + 1.9); grp.add(stSign);
    doors.push({ x: STAIRS.x, z: STAIRS.z, r: 4.2, floor: f, label: `🪜 Сходи · ти на ${f + 1} поверсі`, sub: "Натисни E або сюди — обрати поверх", stairs: true });

    // Прикраси холу
    if (f === 0) {
      const letter = (ch, x, z, color) => {
        const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
        g.fillStyle = color; g.font = "900 220px Fixel Display, Fixel Text, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 128, 140);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(3, 3, 1); s.position.set(x, 2.4, z); grp.add(s);
        addBox(2.2, 0.8, 2.2, x, 0.4, z, M("#e5e0ee"));
      };
      letter("Ї", -4, -3, "#9d6bdb"); letter("Ґ", 4, -3, "#99cc00");
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.7), new THREE.MeshBasicMaterial({ map: textCanvas("Дослівно", { w: 620, hgt: 176, font: "800 76px Fixel Display, Fixel Text, sans-serif" }) }));
      sign.position.set(-8.5, 2.8, S - 0.25); sign.rotation.y = Math.PI; grp.add(sign);
      const welcome = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.7), new THREE.MeshBasicMaterial({ map: textCanvas(["Школа української мови", "5 клас"], { w: 700, hgt: 170, font: "bold 50px Fixel Text, sans-serif" }) }));
      welcome.position.set(8.5, 2.8, S - 0.25); welcome.rotation.y = Math.PI; grp.add(welcome);
    } else {
      const big = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(`${f + 1} поверх`, { w: 512, hgt: 150, font: "800 70px Fixel Display, Fixel Text, sans-serif", border: f === 1 ? "#f7c915" : "#f08fc0" }) }));
      big.scale.set(5, 1.45, 1); big.position.set(0, 2.6, -3); grp.add(big);
      addBox(4, 0.5, 1.2, 0, 0.25, 4, M("#c3a6ef")); // лава
    }
    for (const [x, z] of [[-11, 11], [11, -11], [11, 11]]) {
      addBox(1.6, 0.6, 1.6, x, 0.3, z, M("#c9a36b"));
      const tree = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), M(hw ? "#d9822b" : "#7fb83a")); tree.position.set(x, 1.7, z); grp.add(tree);
    }

    // Крила
    for (const [k, dx, dz] of [["N", 0, -1], ["E", 1, 0], ["W", -1, 0], ["S", 0, 1]]) {
      const w = F[k]; if (!w) continue;
      const items = [...TOPICS.filter((t) => w.sec?.includes(t.s)).map((t) => ({ label: shortTitle(t), topic: t, color: doorColors[t.s] })),
        ...(w.extra || []).map(([label, kind, id]) => ({ label, color: kind === "game" ? "#58b4f0" : "#c9a36b", [kind]: id }))];
      const perSide = Math.ceil(items.length / 2), step = 5, L = perSide * step + 6;
      const toW = (u, v) => (dx !== 0 ? [dx * (S + u), v * dx] : [-v * dz, dz * (S + u)]);
      const cw = 2 * G;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(dx ? L : cw + 2 * T, dx ? cw + 2 * T : L), floorM);
      const [fx, fz] = toW(L / 2, 0); fl.position.set(fx, 0.01, fz); fl.rotation.x = -Math.PI / 2; grp.add(fl);
      { const [x0, z0] = toW(0, -G - T), [x1, z1] = toW(L + T, G + T); rects[f].push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]); }
      for (const side of [-1, 1]) {
        const [x, z] = toW(L / 2, side * (G + T / 2));
        addBox(dx ? L : T, H, dx ? T : L, x, H / 2, z, f === 0 ? wallM : wallM);
        addBox(dx ? L : T + 0.05, 0.3, dx ? T + 0.05 : L, x, 0.15, z, trimM, false);
        // зовнішній бік — теплий колір фасаду
        const [ox, oz] = toW(L / 2, side * (G + T + 0.03));
        const face = new THREE.Mesh(new THREE.PlaneGeometry(L, H), outerM);
        face.position.set(ox, H / 2, oz); face.lookAt(ox + (dx ? 0 : side * -dz * 10), H / 2, oz + (dx ? side * dx * 10 : 0)); grp.add(face);
      }
      if (w.exit) {
        // головний вхід: проріз у торці + вивіска
        const [ex, ez] = toW(L + T / 2, 0);
        addBox(dx ? T : 1.4, H, dx ? 1.4 : T, ex - (dx ? 0 : G - 0.3), H / 2, ez, wallM);
        addBox(dx ? T : 1.4, H, dx ? 1.4 : T, ex + (dx ? 0 : G - 0.3), H / 2, ez, wallM);
        addBox(dx ? T : cw + 2 * T, 1, dx ? cw + 2 * T : T, ex, H - 0.5, ez, wallM, false);
        const out = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), new THREE.MeshBasicMaterial({ map: textCanvas("🌳 Вихід надвір", { w: 600, hgt: 120, font: "bold 52px Fixel Text, sans-serif", border: "#2f9e44" }) }));
        out.position.set(ex, H - 0.5, ez - dz * 0.3); out.lookAt(ex, H - 0.5, ez - dz * 5); grp.add(out);
        const out2 = out.clone(); out2.position.set(ex, H - 0.5, ez + dz * 0.3); out2.lookAt(ex, H - 0.5, ez + dz * 5);
        out2.material = new THREE.MeshBasicMaterial({ map: textCanvas("🏫 Школа «Дослівно»", { w: 600, hgt: 120, font: "bold 50px Fixel Text, sans-serif" }) }); grp.add(out2);
      } else { const [ex, ez] = toW(L + T / 2, 0); addBox(dx ? T : cw + 2 * T, H, dx ? cw + 2 * T : T, ex, H / 2, ez, wallM); }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1), new THREE.MeshBasicMaterial({ map: textCanvas(w.label, { w: 900, hgt: 160, font: "bold 64px Fixel Text, sans-serif", bg: "#1e1b26", fg: "#ffffff" }) }));
      const [sx, sz] = toW(-0.3, 0); sign.position.set(sx, 3.5, sz); sign.lookAt(0, 3.5, 0); grp.add(sign);
      for (let u = 4; u < L; u += 8) { const [lx, lz] = toW(u, 0); const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), new THREE.MeshBasicMaterial({ color: hw ? "#ffb347" : "#fff6c9" })); lamp.position.set(lx, H - 0.1, lz); grp.add(lamp); }
      items.forEach((it, i) => {
        const side = i % 2 ? 1 : -1;
        const u = 4 + Math.floor(i / 2) * step;
        const [x, z] = toW(u, side * (G - 0.02));
        const door = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.12), M("#2a2733"));
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.8, 0.14), M(it.color));
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08), M("#f4f1f9"));
        frame.position.y = 1.5; leaf.position.set(0, 1.42, 0.02); knob.position.set(0.6, 1.4, 0.12);
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: textCanvas(wrapWords(it.label), { w: 640, hgt: 240, font: "bold 46px Fixel Text, sans-serif", border: it.color }) }));
        plate.position.set(0, 3.55, 0.08);
        door.add(frame, leaf, knob, plate); lod.push({ o: plate, d: 32 });
        if (it.game) { const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas("🎮", { w: 128, hgt: 128, font: "80px sans-serif", radius: 64, border: "#58b4f0" }) })); st.scale.set(0.7, 0.7, 1); st.position.set(0, 2.2, 0.4); door.add(st); lod.push({ o: st, d: 32 }); }
        door.position.set(x, 0, z);
        const [cx, cz] = toW(u, 0);
        door.lookAt(cx, 0, cz);
        grp.add(door);
        doors.push({ x: x + (cx - x) * 0.35, z: z + (cz - z) * 0.35, floor: f, label: it.label, topic: it.topic, game: it.game, info: it.info });
      });
    }
    mergeStatic(grp);
  });
  const inside = (x, z, f = 0) => rects[f].some(([a, b, c, d]) => x > a && x < b && z > c && z < d);
  return { groups, inside, lod, exit: { x: 0, z: 14 + 21 + 1 } };
}

// ---------- 🎃 Геловін: гарбузи, кажани, привиди, павутина, гірлянди, місяць ----------
function decorateHalloween(scene, doors) {
  const S = 14, H = 4.2;
  const B = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const tex = (w, hh, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = hh; draw(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const faceT = tex(128, 128, (g) => {
    g.fillStyle = "#ffd54a"; g.shadowColor = "#ff9d00"; g.shadowBlur = 12;
    for (const x of [38, 90]) { g.beginPath(); g.moveTo(x - 18, 58); g.lineTo(x, 26); g.lineTo(x + 18, 58); g.fill(); }
    g.beginPath(); g.moveTo(22, 74); for (let k = 0; k <= 8; k++) g.lineTo(22 + k * 10.5, k % 2 ? 104 : 84); g.lineTo(106, 74); g.quadraticCurveTo(64, 88, 22, 74); g.fill();
  });
  const anim = [];

  // Гарбузи-ліхтарі: обличчя дивиться в бік холу
  const jack = (x, z, s = 1, light = false) => {
    const grp = new THREE.Group();
    const o = L("#ff7a1a", { emissive: "#4a1c00" });
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12).scale(1.25, 0.9, 1.15), o));
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) { const rib = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10).scale(0.35, 0.92, 1.18), L("#e8641a", { emissive: "#3a1500" })); rib.rotation.y = a; grp.add(rib); }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.28, 6), L("#3f7a16")); stem.position.y = 0.55; grp.add(stem);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), B("#ffffff", { map: faceT, transparent: true }));
    face.position.set(0, 0, 0.6); grp.add(face);
    grp.scale.setScalar(s); grp.position.set(x, 0.45 * s, z);
    grp.lookAt(0, 0.45 * s, 0);
    if (light) { const pl = new THREE.PointLight(0xff8a2a, 6, 9, 1.6); pl.position.set(x, 1.2 * s, z); scene.add(pl); anim.push((t) => (pl.intensity = 5 + Math.sin(t * 7 + x) * 0.8 + Math.sin(t * 13 + z) * 0.5)); }
    scene.add(grp);
  };
  jack(0, -7, 1.7, true);
  for (const [x, z] of [[-9.6, -11.4], [9.6, -11.4], [-9.6, 11.4], [9.6, 11.4]]) jack(x, z, 0.9, true);
  for (const [x, z, s] of [[-1.8, -6.6, 0.7], [1.9, -6.8, 0.6], [-5.6, -3, 0.6], [5.6, -3, 0.6], [-12, -9.4, 0.5], [12, 9.4, 0.5]]) jack(x, z, s);
  doors.forEach((d, i) => { if (i % 2 === 0) jack(d.x, d.z, 0.45); });

  // Місяць і зорі
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), B("#fff3c4", { fog: false }));
  moon.position.set(-25, 34, -70); scene.add(moon);
  const starsG = new THREE.BufferGeometry(); const pos = [];
  for (let i = 0; i < 260; i++) { const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 30; pos.push(Math.cos(a) * r, 22 + Math.random() * 40, Math.sin(a) * r); }
  starsG.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(starsG, new THREE.PointsMaterial({ color: "#ffffff", size: 0.5, fog: false })));

  // Кажани над холом
  const batM = L("#1b1526");
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), batM));
    const wings = [-1, 1].map((sd) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.26), batM); w.geometry.translate(sd * 0.25, 0, 0); b.add(w); return [w, sd]; });
    scene.add(b);
    const r = 4 + Math.random() * 8, hgt = 5 + Math.random() * 3, sp = 0.35 + Math.random() * 0.4, ph = Math.random() * 7, dir = i % 2 ? 1 : -1;
    anim.push((t) => {
      const a = ph + t * sp * dir;
      b.position.set(Math.cos(a) * r, hgt + Math.sin(t * 2 + ph) * 0.4, Math.sin(a) * r);
      b.rotation.y = -a * dir + (dir > 0 ? 0 : Math.PI);
      for (const [w, sd] of wings) w.rotation.z = sd * Math.sin(t * 16 + ph) * 0.7;
    });
  }

  // Привиди: пливуть і погойдуються; підлітають ближче, коли учень поруч
  const ghostM = L("#f4f6fb", { transparent: true, opacity: 0.8, emissive: "#3a3a48" }), eyeM = B("#1e1b26");
  for (const [cx, cz, r] of [[0, 0, 6.5], [S + 14, 0, 5], [-S - 14, 0, 5], [0, -S - 14, 5], [0, S + 12, 4]]) {
    const gh = new THREE.Group();
    gh.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), ghostM));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.8, 16, 1, true), ghostM); skirt.position.y = -0.4; gh.add(skirt);
    for (const x of [-0.17, 0.17]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6).scale(1, 1.4, 0.5), eyeM); e.position.set(x, 0.08, 0.46); gh.add(e); }
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6).scale(1, 1.3, 0.4), eyeM); mouth.position.set(0, -0.18, 0.47); gh.add(mouth);
    scene.add(gh);
    const ph = Math.random() * 7;
    anim.push((t) => {
      const a = ph + t * 0.25;
      gh.position.set(cx + Math.cos(a) * r, 2 + Math.sin(t * 1.6 + ph) * 0.35, cz + Math.sin(a) * r);
      gh.rotation.y = -a; gh.rotation.z = Math.sin(t * 1.3 + ph) * 0.12;
    });
  }

  // Павутина в кутках холу
  const webT = tex(256, 256, (g) => {
    g.strokeStyle = "rgba(240,236,255,.85)"; g.lineWidth = 2;
    for (let k = 0; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); g.stroke(); }
    for (let r = 40; r < 250; r += 42) { g.beginPath(); for (let k = 0; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2), rr = r - (k % 2) * 8; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); }
    g.fillStyle = "#1e1b26"; g.beginPath(); g.arc(150, 120, 9, 0, 7); g.fill(); g.strokeStyle = "#1e1b26"; for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(150, 120); g.lineTo(150 + s * 18, 108 + k * 8); g.stroke(); }
  });
  for (const [x, z, ry] of [[-S + 0.25, -S + 0.25, Math.PI / 4], [S - 0.25, -S + 0.25, -Math.PI / 4], [-S + 0.25, S - 0.25, (3 * Math.PI) / 4], [S - 0.25, S - 0.25, (-3 * Math.PI) / 4]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), B("#ffffff", { map: webT, transparent: true, side: THREE.DoubleSide }));
    w.position.set(x, H - 1.4, z); w.rotation.y = ry; w.rotation.z = Math.PI; scene.add(w);
  }

  // Гірлянди вздовж стін холу: помаранчеві й фіолетові вогники, що мерехтять
  const bulbs = [];
  const bulbG = new THREE.SphereGeometry(0.09, 8, 6);
  const line = (x1, z1, x2, z2) => { const n = Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.7); for (let k = 0; k <= n; k++) { const f = k / n; const m = B(k % 2 ? "#ff8a1a" : "#b06bff"); const b = new THREE.Mesh(bulbG, m); b.position.set(x1 + (x2 - x1) * f, H - 0.35 - Math.sin(f * Math.PI * 3) ** 2 * 0.35, z1 + (z2 - z1) * f); scene.add(b); bulbs.push(m); } };
  for (const s of [-1, 1]) { line(-S + 0.5, s * (S - 0.3), -3.4, s * (S - 0.3)); line(3.4, s * (S - 0.3), S - 0.5, s * (S - 0.3)); line(s * (S - 0.3), -S + 0.5, s * (S - 0.3), -3.4); line(s * (S - 0.3), 3.4, s * (S - 0.3), S - 0.5); }
  anim.push((t) => bulbs.forEach((m, i) => m.color.setStyle(Math.sin(t * 3 + i * 0.7) > 0 ? (i % 2 ? "#ff8a1a" : "#b06bff") : (i % 2 ? "#7a3a10" : "#4a2a70"))));

  // Банери
  const banner = (lines, x, z, ry, bg, fg) => {
    const t = tex(800, 220, (g) => { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, 800, 220, 36); g.fill(); g.fillStyle = fg; g.textAlign = "center"; g.font = "bold 64px Fixel Text, sans-serif"; lines.forEach((l, i) => g.fillText(l, 400, 92 + i * 80)); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.76), B("#ffffff", { map: t, transparent: true })); m.position.set(x, 2.8, z); m.rotation.y = ry; scene.add(m);
  };
  banner(["Щасливого Геловіну!", "Моторошно цікавої мови"], -8.5, -S + 0.25, 0, "#ff7a1a", "#1e1b26");
  banner(["Не бійся помилок —", "бійся не вчитися!"], 8.5, -S + 0.25, 0, "#2a1f3d", "#ffb347");

  return (t) => anim.forEach((f) => f(t));
}
