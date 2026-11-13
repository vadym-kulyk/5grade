// Спільна 3D-школа: учні бачать одне одного й ходять коридорами. Кожні двері — майбутня гра з теми.
import * as THREE from "three";
import { h, mount, toast, modal } from "./ui.js";
import { r, set, push, onValue, off, onDisconnect, remove, query, limitToLast, update, ref, db } from "./fb.js";
import { buildAvatar, petFollower, buildSleigh, santaDressed, SLEIGH_NEEDS } from "./avatar.js";
import { awardBadges, owns } from "./store.js";
import { SECTIONS, TOPICS, shortTitle } from "../content/index.js";
import { rankOf } from "./game.js";
import { halloweenOn, winterOn } from "./config.js";
import { setupQuest } from "./hwquest.js";
import { buildOutdoor, labelSprite } from "./outdoor.js";
import { buildWinter, hallTree, snowballs } from "./winter.js";
import { buildParkour } from "./parkour.js";
import { buildVillage, HOUSE_PRICE, WALLS, ROOFS, FURN, canPlace } from "./houses.js";
import { mergeStatic } from "./merge.js";
import { openGame, huntWord, reward, GAMES } from "./minigames.js";

// Політ: мітла — найвище й найшвидше; крила й плащ — нижче. Пішки — 5,5 м/с.
// Кожен поверх — хол 28×28 і до чотирьох крил. Поверхи стоять один на одному (висота поверху FH).
const FH = 4.6;
// Справжні сходи між поверхами (ходиш ногами): A — з 1-го на 2-й (вгору на північ), B — з 2-го на 3-й (вгору на південь)
const SA = { x0: -13.6, x1: -10.4, z0: -11.2, z1: 0 }, SB = { x0: -10.0, x1: -6.8, z0: -11.2, z1: 0 };
const STEPS = 14, RISE = FH / STEPS, TREAD = 11.2 / STEPS;
const LANDING = [{ x: -12, z: 2.2 }, { x: -12, z: -12.5 }, { x: -8.4, z: 1.6 }]; // куди ставимо на кожному поверсі
const STEP_UP = 0.45; // на скільки можна ступити вгору без стрибка
// прямокутник мінус отвір → до 4 прямокутників
const rectMinus = ([x0, x1, z0, z1], hRect) => [[x0, hRect.x0, z0, z1], [hRect.x1, x1, z0, z1], [hRect.x0, hRect.x1, z0, hRect.z0], [hRect.x0, hRect.x1, hRect.z1, z1]].filter(([a, b, c, d]) => b - a > 0.01 && d - c > 0.01);
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
  const WINTER = winterOn(state.settings);
  let jumpReq = false;
  const jumpBtn = h("button.jumpbtn", { onpointerdown: (e) => { e.preventDefault(); jumpReq = true; } }, "⤒", h("small", "стрибок"));
  const snowBtn = WINTER ? h("button.snowbtn", { onpointerdown: (e) => { e.preventDefault(); throwSnow(); } }, "❄️", h("small", "сніжка")) : null;
  const cpBtn = h("button.btn.btn--small.cpbtn", { onclick: () => toCheckpoint() }, "🚩 До контрольної точки");
  const houseBar = h("div.housebar");
  mount(h("div.world",
    canvasWrap,
    h("div.world__top",
      h("a.btn.btn--small", { href: "#/" }, "← Вийти зі школи"),
      flyBtn, online),
    flyPad, jumpBtn, snowBtn, cpBtn, houseBar,
    h("div.frost"),
    prompt,
    h("div.world__bottom",
      h("div.phrases", PHRASES.map((p) => h("button.chipbtn", { onclick: () => emote(p) }, p)),
        EMOTES.map(([ic, a]) => h("button.chipbtn", { onclick: () => emote(null, a) }, ic))),
      chatBox),
    stick,
    h("div.world__help", "WASD / стрілки — ходити · пробіл — стрибок · E — двері й ігри · Q — сніжка · тягни мишкою — повертати камеру · на телефоні — джойстик ліворуч")));

  // ---------- Сцена ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasWrap.append(renderer.domElement);
  const scene = new THREE.Scene();
  const HW = halloweenOn(state.settings);
  const SKY = HW ? "#2a2140" : WINTER ? "#d9e6f2" : "#bfe3ff";
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, HW ? 40 : 70, HW ? 150 : 240);
  scene.add(new THREE.HemisphereLight(HW ? 0xd9ccff : 0xffffff, HW ? 0x6a4a3a : 0xcfc6dd, HW ? 1.25 : 1.7));
  const sun = new THREE.DirectionalLight(HW ? 0xffd2a0 : 0xffffff, HW ? 0.85 : 1.2); sun.position.set(10, 20, 8); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 420);

  const walls = [];   // [minX, maxX, minZ, maxZ]
  const doors = [];   // { x, z, label, topic, nx, nz }
  const solids = []; // тверді тіла: сходинки, підлоги, платформи, будинки, меблі — на них можна стояти
  const school = buildSchool(scene, walls, doors, HW, solids);
  const out = buildOutdoor(scene, HW, WINTER);
  const winter = WINTER ? buildWinter(scene, solids, labelSprite) : null;
  if (WINTER) hallTree(scene, solids);
  const parkour = buildParkour(scene, solids, labelSprite);
  const village = buildVillage(scene, solids, labelSprite);
  const sb = snowballs(scene);
  const hwTick = HW ? decorateHalloween(scene, doors.filter((d) => !d.floor && !d.stairs)) : null;
  // Таємна кімната з квестом (лише в геловінський час)
  const quest = HW ? setupQuest({ scene, walls, uid, teleport: (p) => { me.floor = 0; me.x = p.x; me.z = p.z; me.ry = p.ry; camYaw = p.ry + Math.PI; sendPresence(true); } }) : null;
  if (quest) { document.querySelector(".world")?.append(quest.panel); document.querySelector(".world__bottom")?.prepend(quest.lightUi); quest.setMe(() => ({ x: me.x, y: me.y, z: me.z, broom: me.fly && u.avatar?.back === "back.broom" })); }

  // ---------- Мій персонаж ----------
  const me = { x: (Math.random() - 0.5) * 8, z: 6 + Math.random() * 4, ry: Math.PI, mv: 0, y: 0, vy: 0, sup: 0, grounded: true, on: null, floor: 0, base: 0, fly: false, model: buildAvatar(u.avatar), action: null, actionT: 0 };
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
        o = { model: buildAvatar(p.av), avKey, x: p.x, z: p.z, ry: p.ry, tx: p.x, tz: p.z, tr: p.ry, y: p.y || 0, sbT: o?.sbT ?? p.sb?.t ?? 0, hitT: o?.hitT ?? p.hit?.t ?? 0, blT: o?.blT ?? p.bl?.t ?? 0 };
        o.model.add(nameSprite(p.name, p.rk || ""));
        o.model.position.set(p.x, 0, p.z);
        scene.add(o.model);
        o.pet = petFollower(o.model, scene);
        others.set(id, o);
      }
      if (p.sb && p.sb.t !== o.sbT) { sb.spawn(id, p.sb.x, p.sb.y, p.sb.z, p.sb.ry); o.sbT = p.sb.t; }
      if (p.hit && p.hit.t !== o.hitT) { if (p.hit.by === uid) { myHits++; toast(`🎯 Влучання в ${p.name}! Усього: ${myHits}`, "win", 2500); } o.hitT = p.hit.t; }
      if (p.bl && p.bl.t !== o.blT) { o.blT = p.bl.t; out.setBall(p.bl); }
      Object.assign(o, { tx: p.x, tz: p.z, tr: p.ry, mv: p.mv, name: p.name, ty: p.y || 0, f: p.f || 0, fly: !!p.fl, sl: p.fl === "s" });
      if (p.e && p.e.t !== o.eT) { o.eT = p.e.t; if (now - p.e.t < 5000) { if (p.e.text) bubble(o.model, p.e.text); if (p.e.a) { o.action = p.e.a; o.actionT = 0; } } }
    }
    for (const [id, o] of others) if (!all[id] || now - (all[id].t || 0) > 60000) { scene.remove(o.model); o.pet?.dispose(); others.delete(id); }
    online.textContent = `🟢 У школі: ${others.size + 1}`;
  });

  let lastSent = 0, lastKey = "", myHits = 0;
  function sendPresence(force) {
    const now = Date.now();
    const key = `${me.x.toFixed(2)},${me.z.toFixed(2)},${me.ry.toFixed(2)},${me.mv},${me.y.toFixed(1)},${me.floor}`;
    if (!force && (now - lastSent < 120 || (key === lastKey && now - lastSent < 4000))) return;
    lastSent = now; lastKey = key;
    set(myRef, { name: u.name, cls: u.cls, rk: rankOf(u.xp).icon, av: u.avatar || null, x: +me.x.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2), mv: me.mv, y: +me.y.toFixed(2), f: me.floor || null, fl: me.fly ? (SLEIGH ? "s" : true) : null, t: now, e: me.e || null, sb: me.sb || null, hit: me.hit || null, bl: me.bl || null });
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
  const kd = (e) => { if (e.target.tagName === "INPUT" || document.body.classList.contains("mg-open")) return; keys.add(e.code); if (e.code === "KeyE" || e.code === "Enter") useDoor(); if (e.code === "KeyF" && canFly) toggleFly(); if (e.code === "KeyG") quest?.throwLight(); if (e.code === "Space") { e.preventDefault(); if (!me.fly) jumpReq = true; } if (e.code === "KeyQ") throwSnow(); };
  function toggleFly() {
    me.fly = !me.fly;
    flyBtn.textContent = me.fly ? "🛬 Приземлитися" : `${flyIcon} Летіти`;
    flyPad.classList.toggle("on", me.fly);
    if (me.fly && parkour.zone(me.x, me.z)) { me.fly = false; flyBtn.textContent = `${flyIcon} Летіти`; flyPad.classList.remove("on"); return toast("❄️ Біля Крижаної вежі літати не можна — тільки стрибати!", "warn", 3500); }
    if (me.fly) { me.y = Math.max(me.y, me.sup + 1.2); toast(`Пробіл / ⬆️ — вгору, C / ⬇️ — вниз, WASD — у будь-який бік, F — приземлитися. Висота до ${flyCfg.maxY} м${u.avatar?.back === "back.broom" ? " — на мітлі найвище!" : ""}`, "info", 4500); }
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

  // Висота me.y — справжня (від землі). Стіни школи: поверх f займає висоти [f·FH, (f+1)·FH)
  function collide(x, z) {
    const R = 0.45, y = me.y, head = y + 1.7;
    for (const w of walls) {
      const f = w[4] ?? 0, b = f * FH, tp = f === 0 ? (w[5] ?? Infinity) : (f + 1) * FH;
      if (y >= tp || head <= b) continue;
      if (x + R > w[0] && x - R < w[1] && z + R > w[2] && z - R < w[3]) return true;
    }
    for (const q of solids) {
      if (y >= q.t - STEP_UP || head <= q.b) continue; // на низьку сходинку просто ступаємо
      if (x + R > q.x0 && x - R < q.x1 && z + R > q.z0 && z - R < q.z1) return true;
    }
    return !school.inside(x, z, 0) && out.blocked(x, z, y);
  }
  // Найвища поверхня під ногами, на яку можна стати (земля — 0)
  function support(x, z, y) {
    let top = 0, on = null;
    for (const q of solids) if (q.t <= y + STEP_UP && q.t > top && x > q.x0 - 0.2 && x < q.x1 + 0.2 && z > q.z0 - 0.2 && z < q.z1 + 0.2) { top = q.t; on = q; }
    return [top, on];
  }
  // Поверхи: вище за мій ховаємо, коли я в будівлі (щоб не заважала стеля)
  const insideB = () => me.floor > 0 || school.inside(me.x, me.z, 0);
  function goFloor(n) {
    if (me.fly) toggleFly();
    me.floor = n; me.x = LANDING[n].x; me.z = LANDING[n].z; me.y = n * FH; me.vy = 0; me.ry = Math.PI * 0.75; camYaw = me.ry + Math.PI;
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
  if (location.search.includes("emu=1")) window.__w = { me, goFloor, out, school, startHunt, renderer, collide, solids, parkour, village, support, get throwSnow() { return throwSnow; }, get run() { return run; }, get myHits() { return myHits; }, setCam: (y, p) => { camYaw = y; camPitch = p; } }; // лише для тестів в емуляторі
  out.setOnGoal((sc) => { toast(`⚽ ГОЛ! Рахунок ${sc[0]} : ${sc[1]}`, "win", 3000); if (out.nearField(me.x, me.z)) emote("⚽ Гол!", "jump"); });
  // Спільний м’яч: хто вдарив — той розсилає стан м’яча, решта його підхоплює
  out.setOnKick((b) => { me.bl = { ...b, t: Date.now() }; sendPresence(true); });
  // ---------- ❄️ Сніжки ----------
  let snowCd = 0;
  function throwSnow() {
    if (!WINTER) return;
    const now = performance.now(); if (now < snowCd) return; snowCd = now + 550;
    me.ry = camYaw + Math.PI; // кидаємо туди, куди дивиться камера
    const y = me.y + 1.5;
    sb.spawn(uid, me.x, y, me.z, me.ry);
    me.sb = { t: Date.now(), x: +me.x.toFixed(2), y: +y.toFixed(2), z: +me.z.toFixed(2), ry: +me.ry.toFixed(2) };
    emote(null, "wave");
  }
  const frost = () => document.querySelector(".world .frost");
  function snowHit(x, y, z, owner) {
    if (owner !== uid && Math.hypot(x - me.x, z - me.z) < 0.75 && y > me.y && y < me.y + 2.1) {
      me.hit = { by: owner, t: Date.now() };
      const f = frost(); f?.classList.remove("on"); void f?.offsetWidth; f?.classList.add("on");
      emote("❄️ Ой! Влучили!", null);
      return true;
    }
    for (const [id, o] of others) if (id !== owner && Math.hypot(x - o.x, z - o.z) < 0.75 && y > o.y && y < o.y + 2.1) return true;
    return false;
  }
  // ---------- ❄️ Крижана вежа: забіг до призу ----------
  const run = { started: false, cp: 0, done: false };
  function parkourRun() {
    const inZone = parkour.zone(me.x, me.z);
    cpBtn.classList.toggle("on", inZone && run.started && run.cp > 0 && !run.done && me.grounded && me.y < 1);
    if (!me.grounded || !me.on) return;
    // Забіг починається, щойно стаєш на будь-яку крижину вежі (зі старту, з першої, з другої — байдуже);
    // після призу — новий забіг, коли знову стаєш на нижні крижини
    if (me.on.pk && (!run.started || (run.done && me.y < 4) || (me.on === parkour.start && run.cp))) { Object.assign(run, { started: true, cp: 0, done: false }); toast("❄️ Забіг почався! Стрибай з крижини на крижину до подарунка. Пробіл / ⤒ — стрибок", "info", 4500); }
    const ci = parkour.cps.indexOf(me.on);
    if (ci >= 0 && run.started && ci + 1 > run.cp) { run.cp = ci + 1; toast(`🚩 Контрольна точка ${run.cp}! Якщо впадеш — повернешся сюди`, "win", 3000); }
    if (me.on === parkour.top && run.started && !run.done && run.cp >= parkour.cps.length) { run.done = true; claimPrize(); }
    else if (me.on === parkour.top && !run.done && !run.hinted) { run.hinted = true; toast(`Щоб отримати приз, пройди вежу від старту через обидві контрольні точки з прапорцями (зараз пройдено: ${run.started ? run.cp : 0} з ${parkour.cps.length})`, "info", 6000); }
    if (me.on !== parkour.top) run.hinted = false;
  }
  function toCheckpoint() {
    const [x, y, z] = parkour.cpPos[run.cp - 1] || parkour.startPos;
    me.x = x; me.z = z; me.y = y + 0.05; me.vy = 0; sendPresence(true);
  }
  async function claimPrize() {
    emote("🏆 Я на вершині!", "dance");
    if (state.user.parkourPrize) return toast("🏆 Ти знову на вершині! Приз ти вже отримав(-ла) раніше — але це круто!", "win", 5000);
    try {
      await update(ref(db), { [`users/${uid}/coins`]: (state.user.coins || 0) + 500, [`users/${uid}/parkourPrize`]: Date.now() });
      toast("🏆 Вершина Крижаної вежі! +500 🪙", "win", 7000);
    } catch { toast("Не вдалося записати приз. Спробуй ще раз пізніше.", "warn"); run.done = false; }
  }
  // ---------- 🏡 Містечко ----------
  let housesAll = {}, housesOk = true;
  onValue(r("houses"), (sn) => { housesAll = sn.val() || {}; village.sync(housesAll, uid); }, () => { housesOk = false; });
  function plotSpot() {
    const P = village.plotAt(me.x, me.z); if (!P) return null;
    const ownerId = Object.keys(housesAll).find((k) => housesAll[k].plot === P.n);
    if (ownerId) return { label: `🏡 Дім: ${housesAll[ownerId].name}`, sub: ownerId === uid ? "Твій дім! Заходь — меблі ставлять усередині" : "Заходь у гості 🙂", act: () => {} };
    if (housesAll[uid]) return { label: `Ділянка ${P.n} · вільна`, sub: "У тебе вже є дім 🙂" , act: () => {} };
    return { label: `Ділянка ${P.n} · вільна`, sub: `Натисни E або сюди — збудувати дім за ${HOUSE_PRICE} 🪙`, act: () => buildHouseDialog(P) };
  }
  function buildHouseDialog(P) {
    if (!housesOk) return toast("Будівництво ще не ввімкнено: учитель має оновити правила бази даних.", "warn", 5000);
    let wall = WALLS[0], roof = ROOFS[0];
    const sw = (list, get, setv) => h("div.swatches", list.map((c) => h(`button.swatch${get() === c ? ".on" : ""}`, { style: { background: c }, onclick: (e) => { setv(c); e.target.parentNode.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("on", b === e.target)); } })));
    const close = modal(h("div.center", h("h2", `🏡 Дім на ділянці ${P.n}`),
      h("p", "Двоповерховий будинок зі сходами. Меблі купуватимеш і ставитимеш усередині."),
      h("b", "Колір стін"), sw(WALLS, () => wall, (c) => (wall = c)),
      h("b", "Колір даху"), sw(ROOFS, () => roof, (c) => (roof = c)),
      h("div.row.gap.center", h("button.btn.btn--primary", { onclick: async () => {
        const coins = state.user.coins || 0;
        if (coins < HOUSE_PRICE) return toast(`Потрібно ${HOUSE_PRICE} 🪙, а в тебе ${coins}. Порозв’язуй завдання 🙂`, "warn");
        if (Object.values(housesAll).some((x) => x.plot === P.n)) { close(); return toast("Цю ділянку щойно зайняли 🙈 Обери іншу", "warn"); }
        try {
          await update(ref(db), { [`houses/${uid}`]: { plot: P.n, wall, roof, name: u.name, cls: u.cls, at: Date.now() }, [`users/${uid}/coins`]: coins - HOUSE_PRICE });
          close(); toast(`🎉 Дім збудовано! −${HOUSE_PRICE} 🪙 Заходь і став меблі`, "win", 5000);
        } catch { toast("Не вдалося збудувати. Можливо, учитель ще не оновив правила бази даних.", "warn", 5000); }
      } }, `Збудувати за ${HOUSE_PRICE} 🪙`))));
  }
  // Панель «Мій дім»: з’являється, коли ти у своєму будинку
  let barKey = "";
  function drawHouseBar(ins) {
    const mine = ins && ins.uid === uid;
    const key = mine ? `m${ins.f}` : ins ? "g" : "";
    if (key === barKey) return; barKey = key;
    houseBar.classList.toggle("on", !!ins);
    if (!ins) return houseBar.replaceChildren();
    if (!mine) return houseBar.replaceChildren(h("b", `🏡 У гостях: ${ins.b.h.name}`));
    houseBar.replaceChildren(h("b", `🏡 Мій дім · ${ins.f + 1} поверх`),
      h("button.btn.btn--small.btn--primary", { onclick: furnitureDialog }, "🛋️ Меблі"),
      h("button.btn.btn--small", { onclick: () => editNearest("rotate") }, "↻ Повернути"),
      h("button.btn.btn--small", { onclick: () => editNearest("remove") }, "🗑 Прибрати"));
  }
  function furnitureDialog() {
    const close = modal(h("div", h("h2", "🛋️ Меблі"), h("p.note", "Річ з’явиться перед тобою. Стань туди, де хочеш її поставити, і обирай."),
      h("div.furngrid", Object.entries(FURN).map(([k, f]) => h("button.btn", { onclick: () => { close(); placeItem(k); } }, h("b", f.name), h("small", `${f.price} 🪙`))))), { wide: true });
  }
  async function placeItem(k) {
    const ins = village.at(me.x, me.z, me.y); if (!ins || ins.uid !== uid) return toast("Зайди у свій дім", "info");
    const f = FURN[k], dist = 0.7 + Math.max(f.w, f.d) / 2;
    const lx = ins.lx + Math.sin(me.ry) * dist, lz = ins.lz + Math.cos(me.ry) * dist;
    const err = canPlace(k, lx, lz, ins.f); if (err) return toast(err, "warn");
    const items = housesAll[uid]?.items || {};
    if (Object.keys(items).length >= 40) return toast("У домі вже 40 речей — це максимум", "warn");
    const coins = state.user.coins || 0; if (coins < f.price) return toast(`Потрібно ${f.price} 🪙`, "warn");
    const ry = Math.round((me.ry + Math.PI) / (Math.PI / 2)) * (Math.PI / 2);
    const id = push(r(`houses/${uid}/items`)).key;
    try { await update(ref(db), { [`houses/${uid}/items/${id}`]: { k, x: +lx.toFixed(2), z: +lz.toFixed(2), f: ins.f, ry: +ry.toFixed(3) }, [`users/${uid}/coins`]: coins - f.price }); toast(`${f.name}: −${f.price} 🪙`, "win"); }
    catch { toast("Не вдалося поставити", "warn"); }
  }
  async function editNearest(mode) {
    const ins = village.at(me.x, me.z, me.y); if (!ins || ins.uid !== uid) return;
    const items = Object.entries(housesAll[uid]?.items || {}).filter(([, it]) => (it.f || 0) === ins.f);
    if (!items.length) return toast("Тут ще немає меблів", "info");
    const [id, it] = items.sort((a, b) => Math.hypot(a[1].x - ins.lx, a[1].z - ins.lz) - Math.hypot(b[1].x - ins.lx, b[1].z - ins.lz))[0];
    if (mode === "rotate") return update(ref(db), { [`houses/${uid}/items/${id}/ry`]: +(((it.ry || 0) + Math.PI / 2) % (Math.PI * 2)).toFixed(3) });
    const back = Math.floor((FURN[it.k]?.price || 0) / 2);
    await update(ref(db), { [`houses/${uid}/items/${id}`]: null, [`users/${uid}/coins`]: (state.user.coins || 0) + back });
    toast(`Прибрано. Повернуто ${back} 🪙`, "info");
  }
  try { if (!localStorage.getItem("winter26")) { localStorage.setItem("winter26", "1"); setTimeout(() => toast("🆕 Сходи на 2-й і 3-й поверх тепер справжні — просто йди ними (ліворуч від літери Ї). Надворі: 🏡 містечко (будуй дім!), ❄️ Крижана вежа з призом, сніжки (Q) і стрибки (пробіл)!", "info", 9000), 1500); } } catch {}

  const lods = [...school.lod, ...out.lod], tmpV = new THREE.Vector3(); let lodT = -1;
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
    // Вертикаль: політ або гравітація + стрибок; на рухомій платформі їдемо разом із нею
    parkour.tick(t);
    if (me.fly) {
      const vy = (keys.has("Space") || pad.up ? 1 : 0) - (keys.has("KeyC") || keys.has("ShiftLeft") || pad.down ? 1 : 0);
      const [sup] = support(me.x, me.z, me.y);
      me.y = Math.max(sup, Math.min(insideB() ? (me.floor + 1) * FH - 2.4 : flyCfg.maxY, me.y + vy * 4 * dt));
      me.grounded = false; me.on = null; me.vy = 0; me.sup = sup;
      if (parkour.zone(me.x, me.z)) toggleFly();
    } else {
      if (jumpReq && me.grounded) { me.vy = 9.5; me.grounded = false; }
      me.vy -= 25 * dt; me.y += me.vy * dt;
      const [sup, on] = support(me.x, me.z, me.y);
      if (me.y <= sup) { me.y = sup; me.vy = 0; me.grounded = true; me.on = on; } else { me.grounded = false; me.on = null; }
      if (me.grounded && me.on && (me.on.dx || me.on.dz)) { const nx = me.x + me.on.dx, nz = me.z + me.on.dz; if (!collide(nx, me.z)) me.x = nx; if (!collide(me.x, nz)) me.z = nz; }
      me.sup = sup;
      if (me.y < -20) { me.y = 0; me.x = 0; me.z = 8; } // про всяк випадок
    }
    jumpReq = false;
    me.floor = school.inside(me.x, me.z, 0) ? Math.max(0, Math.min(2, Math.floor((me.y + 1.2) / FH))) : 0;
    me.base = 0;
    parkourRun();
    const inHouse = village.tick(t, me.x, me.z, me.y);
    drawHouseBar(inHouse);
    winter?.tick(t, dt, cam);
    sb.tick(dt, (x, z, y) => support(x, z, y)[0], snowHit);
    const inB = insideB();
    if (t - lodT > 0.4) { lodT = t; for (const L of lods) { L.o.getWorldPosition(tmpV); L.o.visible = (!L.out || !inB) && (tmpV.x - me.x) ** 2 + (tmpV.z - me.z) ** 2 < L.d * L.d && (L.out || Math.abs(tmpV.y - me.floor * FH) < 6); } }
    school.groups.forEach((g, f) => (g.visible = !inB || f <= me.floor));
    applyAction(me, dt);
    me.model.position.set(me.x, me.action ? me.model.position.y : me.y + (me.fly ? Math.sin(t * 2) * 0.08 : 0), me.z);
    me.model.rotation.y = me.ry;
    me.model.userData.animate(t, me.fly ? 0 : me.mv);
    flyPose(me.model, me.fly, t, SLEIGH && me.fly);
    me.pet?.update(dt, t, me.x, me.z, me.ry, me.fly ? me.y * 0.85 : me.sup);
    out.tick(t, dt, me.floor === 0 ? me : null);
    hwTick?.(t, me);
    quest?.tick(t);

    for (const o of others.values()) {
      o.x += (o.tx - o.x) * Math.min(1, dt * 8);
      o.z += (o.tz - o.z) * Math.min(1, dt * 8);
      o.ry += angDiff(o.ry, o.tr) * Math.min(1, dt * 8);
      o.y += ((o.ty || 0) - o.y) * Math.min(1, dt * 8);
      o.base = 0;
      const vis = !inB || (o.f || 0) <= me.floor;
      o.model.visible = vis; (o.model.userData.pets || []).forEach((p) => (p.visible = vis));
      applyAction(o, dt);
      o.model.position.set(o.x, o.action ? o.model.position.y : o.y + (o.fly ? Math.sin(t * 2 + o.x) * 0.08 : 0), o.z);
      o.model.rotation.y = o.ry;
      o.model.userData.animate(t, o.fly ? 0 : o.mv || 0);
      flyPose(o.model, o.fly, t, o.sl && o.fly);
      o.pet?.update(dt, t, o.x, o.z, o.ry, o.fly ? o.y * 0.85 : o.y);
    }

    // камера позаду персонажа
    const dist = 6.5;
    cam.position.set(me.x + Math.sin(camYaw) * dist * Math.cos(camPitch), me.y + 1.6 + Math.sin(camPitch) * dist, me.z + Math.cos(camYaw) * dist * Math.cos(camPitch));
    if (me.floor === 0 && quest?.inRoom(me)) quest.clampCam(cam);
    cam.lookAt(me.x, me.y + 1.5, me.z);

    // двері поруч?
    nearDoor = null;
    for (const d of doors) if ((d.floor || 0) === me.floor && Math.hypot(d.x - me.x, d.z - me.z) < (d.r || 2.2)) { nearDoor = d; break; }
    if (!nearDoor && me.floor === 0 && !inB) nearDoor = plotSpot();
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
    off(presRef); off(setsRef); off(r("chat")); off(r("houses"));
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
  if (o.action === "jump") o.model.position.y = (o.y || 0) + Math.max(0, Math.sin(k * 6) * 1.2);
  if (k > 2) { o.action = null; ud.arms.forEach((a) => (a.rotation.z = 0)); o.model.position.y = o.y || 0; }
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
function buildSchool(scene, walls, doors, hw = false, solids = []) {
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
    // Підлога холу; на 2-му й 3-му поверсі — з отвором над сходами
    const hole = [null, SA, SB][f];
    const HALL = [-S - 0.4, S + 0.4, -S - 0.4, S + 0.4];
    for (const [x0, x1, z0, z1] of hole ? rectMinus(HALL, hole) : [HALL]) {
      const tx = tileTex.clone(); tx.repeat.set(14 * (x1 - x0) / 28.8, 14 * (z1 - z0) / 28.8); tx.needsUpdate = true;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: tx }));
      pl.rotation.x = -Math.PI / 2; pl.position.set((x0 + x1) / 2, 0.005, (z0 + z1) / 2); grp.add(pl);
      if (f) solids.push({ x0, x1, z0, z1, b: f * FH - 0.3, t: f * FH });
    }
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
    // Сходи вгору (з 1-го і з 2-го поверху): кожна сходинка — тверде тіло, на яке ступаєш
    const stM = [M("#c9a36b"), M("#b88f5a")], railM = M("#2440c2");
    const rail = (x0, x1, z0, z1) => { const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 1.1, z1 - z0), railM); b.position.set((x0 + x1) / 2, 0.55, (z0 + z1) / 2); grp.add(b); solids.push({ x0, x1, z0, z1, b: f * FH, t: f * FH + 1.1 }); };
    if (f < 2) {
      const R = f === 0 ? SA : SB, north = f === 0;
      for (let k = 1; k <= STEPS; k++) {
        const zA = north ? R.z1 - k * TREAD : R.z0 + (k - 1) * TREAD, zB = zA + TREAD, top = k * RISE;
        const st = new THREE.Mesh(new THREE.BoxGeometry(R.x1 - R.x0, top, TREAD), stM[k % 2]); st.position.set((R.x0 + R.x1) / 2, top / 2, (zA + zB) / 2); grp.add(st);
        solids.push({ x0: R.x0, x1: R.x1, z0: zA, z1: zB, b: f * FH, t: f * FH + top });
      }
      const up = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(`⬆ на ${f + 2} поверх`, { w: 480, hgt: 128, font: "bold 54px Fixel Text, sans-serif", border: "#2440c2" }) }));
      up.scale.set(2.6, 0.7, 1); up.position.set((R.x0 + R.x1) / 2, 2.2, north ? R.z1 + 0.6 : R.z0 - 0.6); grp.add(up);
    }
    // Поручні навколо отвору (вихід зі сходів лишається відкритим)
    if (f === 1) { rail(SA.x1, SA.x1 + 0.12, SA.z0, SA.z1); rail(SA.x0, SA.x1 + 0.12, SA.z1, SA.z1 + 0.12); }
    if (f === 2) { rail(SB.x0 - 0.12, SB.x0, SB.z0, SB.z1); rail(SB.x1, SB.x1 + 0.12, SB.z0, SB.z1); rail(SB.x0 - 0.12, SB.x1 + 0.12, SB.z0 - 0.12, SB.z0); }
    if (f > 0) { const dn = new THREE.Sprite(new THREE.SpriteMaterial({ map: textCanvas(`⬇ на ${f} поверх`, { w: 480, hgt: 128, font: "bold 54px Fixel Text, sans-serif", border: "#2440c2" }) })); const R = f === 1 ? SA : SB; dn.scale.set(2.6, 0.7, 1); dn.position.set((R.x0 + R.x1) / 2, 2.2, f === 1 ? R.z0 - 1.2 : R.z1 + 1.2); grp.add(dn); }

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
      { const [x0, z0] = toW(0, -G - T), [x1, z1] = toW(L + T, G + T); const rr = [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]; rects[f].push(rr); if (f) solids.push({ x0: rr[0], x1: rr[1], z0: rr[2], z1: rr[3], b: f * FH - 0.3, t: f * FH }); }
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
