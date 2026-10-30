// 🎃 Таємна кімната в 3D-школі: спільний квест класу.
// Портал у стіні холу → кімната з котлом і шістьма скринями. Кожна скриня — 3 завдання поспіль без помилок,
// нагорода — літера. Із шести літер клас складає чарівне слово й промовляє його над котлом.
import * as THREE from "three";
import { h, toast, modal, shuffle } from "./ui.js";
import { r, ref, db, onValue, off, set, update, errText } from "./fb.js";
import { renderTask, kindLabel } from "./quiz.js";
import { state, awardBadges } from "./store.js";
import { QUEST } from "../content/quest/halloween.js";

export const ROOM = { x0: 18, x1: 30, z0: 18, z1: 30 };
const C = { x: 24, z: 23.2 }; // котел
const ENTRY = { x: 24, z: 27.6, ry: Math.PI }; // поява в кімнаті (обличчям до котла)
const HALL = { x: 11.8, z: 8, ry: -Math.PI / 2 }; // поява в холі біля порталу
const PORTAL = { x: 13.7, z: 8 };
const EXIT = { x: 24, z: 29.7 };
const REWARD = { coins: 150, xp: 60 };
const ONE_PER = 120000; // друга скриня тому самому учневі — через 2 хв

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
  const { x0, x1, z0, z1 } = ROOM, H = 4.2, T = 0.4, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const floorT = tex(64, 64, (g) => { g.fillStyle = "#2b2238"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#3a2d4d"; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(6, 6); floorT.magFilter = THREE.NearestFilter;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0.02, cz); scene.add(fl);
  const stone = L("#3b3150");
  box(x1 - x0 + T * 2, H, T, cx, H / 2, z0 - T / 2, stone); box(x1 - x0 + T * 2, H, T, cx, H / 2, z1 + T / 2, stone);
  box(T, H, z1 - z0, x0 - T / 2, H / 2, cz, stone); box(T, H, z1 - z0, x1 + T / 2, H / 2, cz, stone);
  const title = label(["Таємна кімната", "відьми Граматихи"], { w: 640, hgt: 160, font: "bold 52px Manrope, sans-serif" }); title.position.set(cx, 3.5, z0 + 0.3); title.scale.multiplyScalar(1.2); scene.add(title);
  // Свічки
  for (const [x, z] of [[x0 + 0.6, z0 + 0.6], [x1 - 0.6, z0 + 0.6], [x0 + 0.6, z1 - 0.6], [x1 - 0.6, z1 - 0.6], [x0 + 0.6, cz], [x1 - 0.6, cz]]) {
    box(0.18, 0.7, 0.18, x, 0.35, z, L("#f4ead2"), false);
    const fm = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), B("#ffb347")); fm.position.set(x, 0.82, z); scene.add(fm);
    anim.push((t) => { fm.scale.y = 1 + Math.sin(t * 15 + x * 3) * 0.2; });
  }
  const roomLight = new THREE.PointLight(0xffa860, 3, 14, 1.2); roomLight.position.set(cx, 3.2, cz + 2); scene.add(roomLight);

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
    const x = C.x + Math.cos(a) * 4.2, z = C.z + Math.sin(a) * 4.2;
    const g = new THREE.Group();
    const wood = L("#6b4426"), gold = L("#e8c25a", { emissive: "#3a2a00" });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), wood); base.position.y = 0.3; g.add(base);
    for (const bx of [-0.4, 0.4]) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.72), gold); band.position.set(bx, 0.3, 0); g.add(band); }
    const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.35);
    const lidM = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.7), wood); lidM.position.set(0, 0.12, 0.35); lid.add(lidM);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.06), gold); lock.position.set(0, 0.05, 0.72); lid.add(lock);
    g.add(lid);
    g.position.set(x, 0, z); g.lookAt(C.x, 0, C.z); scene.add(g);
    walls.push([x - 0.55, x + 0.55, z - 0.55, z + 0.55]);
    const name = label([`${st.icon} ${st.name}`, st.topic], { w: 560, hgt: 140, k: 0.65 }); name.position.set(x, 1.6, z); scene.add(name);
    const letter = bigLetter(st.letter.toUpperCase()); letter.position.set(x, 2.5, z); letter.visible = false; scene.add(letter);
    const glow = new THREE.PointLight(0xffb347, 0, 4, 1.6); glow.position.set(x, 1.2, z); scene.add(glow);
    return { st, x, z, lid, name, letter, glow, solved: null };
  });
  anim.push((t) => chests.forEach((c, i) => { if (c.solved) { c.letter.position.y = 2.5 + Math.sin(t * 2 + i) * 0.12; c.lid.rotation.x += (-1.15 - c.lid.rotation.x) * 0.08; } }));

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
      if (c.solved && !was) { scene.remove(c.name); c.name = label([`${c.st.icon} Літера «${c.st.letter.toUpperCase()}»`, `відкрив(-ла): ${c.solved.name}`], { w: 560, hgt: 140, k: 0.65 }); c.name.position.set(c.x, 1.6, c.z); scene.add(c.name); }
      if (!c.solved && was) { scene.remove(c.name); c.name = label([`${c.st.icon} ${c.st.name}`, c.st.topic], { w: 560, hgt: 140, k: 0.65 }); c.name.position.set(c.x, 1.6, c.z); scene.add(c.name); }
    });
    const n = Object.keys(S).length;
    liquidM.color.set(qs.done ? "#ffd54a" : n === 6 ? "#b06bff" : "#5cff6a");
    cLight.color.set(qs.done ? 0xffd54a : n === 6 ? 0xb06bff : 0x5cff6a);
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
        : h("p.note", n < 6 ? "Кожен відкриває свою скриню: 3 завдання поспіль без помилки. Розкажіть одне одному, яку літеру отримали!" : "Усі літери зібрано! Складіть слово (порядок інший!) і промовте його над котлом."),
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
      } catch { body.replaceChildren(h("p", "Цю скриню щойно відкрив інший учень. Спробуй іншу!"), h("button.btn", { onclick: close }, "Гаразд")); }
    };
    step();
  }

  // ---------- Котел: фінальне слово ----------
  function openCauldron() {
    const S = qs.stations || {}, n = Object.keys(S).length;
    if (qs.done) return toast(`✨ Заклинання вже промовлено: «${QUEST.word.toUpperCase()}». Квест виконано!`, "win", 3500);
    if (n < 6) return modal(h("div.center", h("div.result__big", "🧪"), h("h2", "Котел ще не готовий"), h("p", QUEST.intro), h("p", h("b", `Відкрито скринь: ${n} з 6.`))));
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
    clampCam(cam) { cam.position.x = Math.max(x0 + 0.3, Math.min(x1 - 0.3, cam.position.x)); cam.position.z = Math.max(z0 + 0.3, Math.min(z1 - 0.3, cam.position.z)); cam.position.y = Math.min(cam.position.y, 4); },
    interacts(me) {
      const list = [
        { x: PORTAL.x - 0.6, z: PORTAL.z, r: 2.2, label: "🔮 Дивна тріщина в стіні…", sub: "Натисни E або сюди — увійти в таємну кімнату", act: () => teleport(ENTRY) },
        { x: EXIT.x, z: EXIT.z - 0.8, r: 1.8, label: "🚪 Портал назад", sub: "Натисни E — повернутися в хол", act: () => teleport(HALL) },
        { x: C.x, z: C.z, r: 2.4, label: "🧪 Котел відьми", sub: qs.done ? "Квест виконано!" : Object.keys(qs.stations || {}).length === 6 ? "Натисни E — промовити заклинання" : "Натисни E — що тут?", act: openCauldron },
        ...chests.map((c) => ({ x: c.x, z: c.z, r: 1.9, label: `${c.st.icon} ${c.st.name}`, sub: c.solved ? `Відкрито: ${c.solved.name}` : "Натисни E — відкрити скриню", act: () => openChest(c) })),
      ];
      let best = null, bd = 1e9;
      for (const it of list) { const d = Math.hypot(it.x - me.x, it.z - me.z); if (d < it.r && d < bd) { best = it; bd = d; } }
      return best;
    },
    tick(t) { anim.forEach((f) => f(t)); },
    dispose() { off(qRef); },
  };
}
