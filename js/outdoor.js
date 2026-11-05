// Простір навколо школи: ліс, озера, річка з мостами, тварини, поле з м’ячем, майданчик, вітряк, багаття.
// Повертає: blocked(x, z, y) — чи можна туди ступити; spots — місця, де можна щось зробити (E); tick(t, dt, me).
import * as THREE from "three";
import { petModel } from "./avatar.js";
import { mergeStatic } from "./merge.js";

const R_WORLD = 175;
const LAKES = [{ x: -70, z: 112, rx: 26, rz: 17 }, { x: 88, z: -40, rx: 16, rz: 12 }];
const PIER = { x0: -71.6, x1: -68.4, z0: 112, z1: 131 }; // пристань заходить в озеро
const riverZ = (x) => -96 + Math.sin(x / 26) * 8;
const BRIDGES = [{ x: 0, w: 4 }, { x: -62, w: 4 }, { x: 70, w: 4 }];
const QUEST = { x0: 15, x1: 53, z0: 15, z1: 53 }; // таємна кімната Геловіну
const FIELD = { x: -48, z: 66, w: 34, d: 22 };
const SCHOOL = { x0: -56, x1: 40, z0: -50, z1: 40 }; // зона школи (без дерев)

const inLake = (x, z, pad = 0) => LAKES.some((l) => ((x - l.x) / (l.rx + pad)) ** 2 + ((z - l.z) / (l.rz + pad)) ** 2 < 1);
const onPier = (x, z) => x > PIER.x0 && x < PIER.x1 && z > PIER.z0 && z < PIER.z1;
const inRiver = (x, z, pad = 0) => Math.abs(z - riverZ(x)) < 4.2 + pad;
const onBridge = (x) => BRIDGES.some((b) => Math.abs(x - b.x) < b.w / 2 - 0.3);
const inRect = (x, z, r, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;

// Факти про тварин — маленькі уроки мови
const FACTS = {
  deer: "🦌 Олень → оленя, оленятко, оленячий — спільнокореневі слова.",
  fox: "🦊 «Хитрий, як лис» — це порівняння. А лисиця, лисеня, лисячий — спільнокореневі слова.",
  bunny: "🐰 Заєць → зайчик: суфікс -ик — зменшувально-пестливий.",
  hedgehog: "🦔 У слові «їжак» буква Ї позначає два звуки: [йіжак].",
  owl: "🦉 Сова — символ мудрості. «Премудрий» = дуже мудрий: префікс пре- означає «дуже».",
  dog: "🐶 Собака і пес — синоніми. А цуценя — це маля собаки (суфікс -еня).",
  cat: "🐱 Кіт — кота: у корені чергуються і та о.",
  duck: "🦆 Качка → каченя: суфікс -еня називає малят.",
};

export function buildOutdoor(scene, hw = false) {
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const anim = [], spots = [], colliders = []; // colliders: [x, z, r, top]
  const stat = new THREE.Group(); scene.add(stat); // нерухоме — потім зіллємо
  const lod = []; // дрібниці, які малюємо лише поблизу
  const add = (m, x, y, z) => { m.position.set(x, y, z); stat.add(m); return m; };
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })(); // однаковий ліс у всіх

  // Трава
  const grass = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.fillStyle = hw ? "#4f6b3a" : "#8cc65a"; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { g.fillStyle = `hsla(${hw ? 95 : 90 + rnd() * 25}, 50%, ${(hw ? 28 : 42) + rnd() * 16}%, .55)`; g.fillRect(rnd() * 128, rnd() * 128, 2, 3); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), new THREE.MeshLambertMaterial({ map: grass }));
  ground.rotation.x = -Math.PI / 2; add(ground, 0, -0.02, 0);
  // Пагорби по краях (за межею, куди можна дійти)
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 205 + rnd() * 20; const hill = new THREE.Mesh(new THREE.SphereGeometry(30 + rnd() * 20, 16, 10), M(hw ? "#3d5530" : "#79b84c")); hill.scale.y = 0.45; add(hill, Math.cos(a) * r, -4, Math.sin(a) * r); }

  // Доріжки
  const pathM = M(hw ? "#8a7a62" : "#e2cfa6");
  const path = (x1, z1, x2, z2, w = 3.2) => { const l = Math.hypot(x2 - x1, z2 - z1); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l), pathM); p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.atan2(x2 - x1, z2 - z1); add(p, (x1 + x2) / 2, 0.012, (z1 + z2) / 2); };
  path(0, 36, 0, 58); path(0, 58, -48, 54); path(0, 58, -66, 132); path(0, 58, 46, 80); path(0, 58, 0, -70, 2.6); path(0, -70, 0, -110, 2.6); path(-62, -60, -62, -120, 2.4); path(0, 58, 105, 62, 2.6);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(7, 28), pathM); plaza.rotation.x = -Math.PI / 2; add(plaza, 0, 0.014, 58);
  // Фонтан на площі
  add(new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.7, 24), M("#c9c2d6")), 0, 0.35, 58); colliders.push([0, 58, 3.3, 2]);
  const fw = add(new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.1, 24), M("#58b4f0", { emissive: "#0d3550" })), 0, 0.68, 58);
  const jet = add(new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 10), new THREE.MeshLambertMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.7 })), 0, 1.8, 58);
  fw.userData.dyn = jet.userData.dyn = true;
  anim.push((t) => { jet.scale.y = 1 + Math.sin(t * 4) * 0.12; fw.material.emissive.setHSL(0.55, 0.6, 0.12 + Math.sin(t * 2) * 0.03); });

  // Озера з піщаним берегом
  for (const l of LAKES) {
    const sand = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M(hw ? "#7a6a52" : "#ead9a8")); sand.scale.set(l.rx + 2.5, l.rz + 2.5, 1); sand.rotation.x = -Math.PI / 2; add(sand, l.x, 0.008, l.z);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshLambertMaterial({ color: hw ? "#2d4a6b" : "#4fa8e0", emissive: "#0b2a44" })); water.scale.set(l.rx, l.rz, 1); water.rotation.x = -Math.PI / 2; add(water, l.x, 0.03, l.z);
    water.userData.dyn = true;
    anim.push((t) => water.material.emissive.setHSL(0.58, 0.6, 0.1 + Math.sin(t * 1.3 + l.x) * 0.025));
    // очерет
    for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2; const r = 0.92 + rnd() * 0.08; const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4 + rnd()), M("#5f8a3a")); add(reed, l.x + Math.cos(a) * l.rx * r, 0.7, l.z + Math.sin(a) * l.rz * r); }
  }
  // Пристань
  const wood = M("#a0703f");
  add(new THREE.Mesh(new THREE.BoxGeometry(PIER.x1 - PIER.x0, 0.25, PIER.z1 - PIER.z0), wood), (PIER.x0 + PIER.x1) / 2, 0.15, (PIER.z0 + PIER.z1) / 2);
  for (let z = PIER.z0 + 1; z < PIER.z1; z += 3) for (const x of [PIER.x0, PIER.x1]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2), wood), x, 0.4, z);
  const rod = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.4), M("#6b4426")), -70, 1.1, 112.6); rod.rotation.x = 0.6;
  spots.push({ x: -70, z: 113.5, r: 2.4, label: "🎣 Рибалка", sub: "Натисни E — лови рибу з правильними словами!", game: "fish" });
  const fishSign = labelSprite("🎣 Рибалка", "#58b4f0"); fishSign.position.set(-70, 2.6, 129); scene.add(fishSign);

  // Річка й мости
  {
    const pts = []; for (let x = -240; x <= 240; x += 6) pts.push(x);
    const geo = new THREE.BufferGeometry(); const pos = [], idx = [];
    pts.forEach((x, i) => { const z = riverZ(x); pos.push(x, 0.03, z - 4.2, x, 0.03, z + 4.2); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } });
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const river = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: hw ? "#2d4a6b" : "#4aa3dc", emissive: "#0b2a44", side: THREE.DoubleSide })); scene.add(river);
    anim.push((t) => river.material.emissive.setHSL(0.57, 0.6, 0.1 + Math.sin(t * 2) * 0.03));
    for (const b of BRIDGES) {
      const z = riverZ(b.x);
      add(new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.3, 12), wood), b.x, 0.18, z);
      for (const s of [-1, 1]) { add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 12), M("#7a4f2a")), b.x + s * (b.w / 2), 0.75, z); }
    }
  }

  // Ліс: ялини й листяні дерева (InstancedMesh — швидко навіть на телефоні)
  const free = (x, z, pad = 2) => Math.hypot(x, z) < R_WORLD - 3 && !inRect(x, z, SCHOOL, 4) && !inLake(x, z, 4) && !inRiver(x, z, 4) && !inRect(x, z, QUEST, 2) &&
    !(Math.abs(x - FIELD.x) < FIELD.w / 2 + 4 && Math.abs(z - FIELD.z) < FIELD.d / 2 + 4) && Math.hypot(x, z - 58) > 12 && !(Math.abs(x) < 4) &&
    Math.hypot(x - 46, z - 80) > 12 && Math.hypot(x - 108, z - 62) > 8 && Math.hypot(x + 22, z - 88) > 7 && !onPathish(x, z, pad);
  function onPathish(x, z) { return (Math.abs(x) < 3 && z > -110 && z < 60) || (Math.abs(z - 58) < 3 && x > -50 && x < 105); }
  const pines = [], leafy = [];
  let tries = 0;
  while (pines.length + leafy.length < 520 && tries++ < 8000) {
    const a = rnd() * Math.PI * 2, r = 40 + Math.sqrt(rnd()) * (R_WORLD - 40);
    let x = Math.cos(a) * r, z = Math.sin(a) * r;
    // густіше на півночі за річкою та на заході
    if (z > -100 && x > -95 && rnd() < 0.55) continue;
    if (!free(x, z)) continue;
    const s = 0.8 + rnd() * 0.7;
    (z < -100 || rnd() < 0.45 ? pines : leafy).push([x, z, s]);
  }
  const inst = (geo, mat, list, y, sy = 1, sxz = 1) => { const im = new THREE.InstancedMesh(geo, mat, list.length); const m4 = new THREE.Matrix4(); list.forEach(([x, z, s], i) => { m4.compose(new THREE.Vector3(x, y * s, z), new THREE.Quaternion(), new THREE.Vector3(s * sxz, s * sy, s * sxz)); im.setMatrixAt(i, m4); }); scene.add(im); return im; };
  const trunkG = new THREE.CylinderGeometry(0.25, 0.35, 2, 6), trunkM = M("#7a5232");
  inst(trunkG, trunkM, pines, 1); inst(new THREE.ConeGeometry(1.8, 4.6, 7), M(hw ? "#2f4a2a" : "#2f7d3a"), pines, 4.1); inst(new THREE.ConeGeometry(1.3, 3, 7), M(hw ? "#35562e" : "#3c9447"), pines, 6.2);
  inst(trunkG, trunkM, leafy, 1); inst(new THREE.SphereGeometry(2.1, 8, 6), M(hw ? "#b8612a" : "#5fae3e"), leafy, 3.6);
  [...pines, ...leafy].forEach(([x, z, s]) => colliders.push([x, z, 0.5 * s, 8 * s]));
  // Гриби, каміння, квіти
  const pick = (n, f) => { const out = []; let k = 0; while (out.length < n && k++ < n * 40) { const x = (rnd() - 0.5) * 2 * R_WORLD, z = (rnd() - 0.5) * 2 * R_WORLD; if (f(x, z)) out.push([x, z, 0.6 + rnd() * 0.8]); } return out; };
  const shrooms = pick(90, (x, z) => free(x, z) && Math.hypot(x, z) > 70);
  inst(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), M("#f4ead2"), shrooms, 0.17); inst(new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), M("#e2443c"), shrooms, 0.33);
  const rocks = pick(60, (x, z) => free(x, z)); inst(new THREE.DodecahedronGeometry(0.9), M("#9a97a6"), rocks, 0.35, 0.6);
  rocks.forEach(([x, z, s]) => colliders.push([x, z, 0.8 * s, 1]));
  const flowers = pick(700, (x, z) => free(x, z, 0) && ((x > 10 && x < 95 && z > 88 && z < 150) || (x < -20 && x > -110 && z > -70 && z < -20) || rnd() < 0.05));
  const fcols = ["#f08fc0", "#f7c915", "#ffffff", "#9d6bdb", "#e2445c", "#58b4f0"];
  fcols.forEach((c, k) => inst(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.15 }), flowers.filter((_, i) => i % fcols.length === k), 0.35));
  inst(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4), M("#4f8a2a"), flowers, 0.17);

  // Футбольне поле з м’ячем
  const fieldM = M(hw ? "#3f5a30" : "#5fb24a"), lineM = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.w, FIELD.d), fieldM); fp.rotation.x = -Math.PI / 2; add(fp, FIELD.x, 0.015, FIELD.z);
  const ln = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineM); m.rotation.x = -Math.PI / 2; add(m, x, 0.02, z); };
  ln(FIELD.w, 0.15, FIELD.x, FIELD.z - FIELD.d / 2); ln(FIELD.w, 0.15, FIELD.x, FIELD.z + FIELD.d / 2); ln(0.15, FIELD.d, FIELD.x - FIELD.w / 2, FIELD.z); ln(0.15, FIELD.d, FIELD.x + FIELD.w / 2, FIELD.z); ln(0.15, FIELD.d, FIELD.x, FIELD.z);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 3, 32), lineM); ring.rotation.x = -Math.PI / 2; add(ring, FIELD.x, 0.02, FIELD.z);
  const goals = [];
  for (const s of [-1, 1]) {
    const gx = FIELD.x + s * FIELD.w / 2; const gm = M("#ffffff");
    for (const dz of [-2.2, 2.2]) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2), gm), gx, 1.1, FIELD.z + dz); colliders.push([gx, FIELD.z + dz, 0.25, 2.2]); }
    add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4.6), gm), gx, 2.2, FIELD.z);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, side: THREE.DoubleSide })); net.rotation.y = Math.PI / 2; add(net, gx + s * 1.2, 1.1, FIELD.z);
    goals.push({ x: gx, s });
  }
  const ball = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true })), FIELD.x, 0.4, FIELD.z);
  ball.userData.dyn = true;
  const bv = { x: 0, z: 0 }; let goalCd = 0, onGoal = null;
  const resetBall = () => { ball.position.set(FIELD.x, 0.4, FIELD.z); bv.x = bv.z = 0; };
  spots.push({ x: FIELD.x, z: FIELD.z + FIELD.d / 2 + 1.5, r: 3, label: "⚽ Футбольне поле", sub: "Підбігай до м’яча — штовхай його у ворота!", info: "⚽ Підбіжи до м’яча, і він покотиться. Заб’єш гол — почуєш оплески!" });

  // Ігровий майданчик: гойдалки, гірка, пісочниця
  {
    const px = 46, pz = 80, metal = M("#9d6bdb");
    const sand = new THREE.Mesh(new THREE.CircleGeometry(9, 24), M("#ead9a8")); sand.rotation.x = -Math.PI / 2; add(sand, px, 0.012, pz);
    for (const x of [-2.5, 2.5]) { const leg = add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), metal), px + x, 1.5, pz - 3); leg.rotation.z = x > 0 ? 0.15 : -0.15; }
    add(new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 0.15), metal), px, 3, pz - 3);
    for (const x of [-1.2, 1.2]) { const sw = new THREE.Group(); sw.position.set(px + x, 3, pz - 3); const rope = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.04), M("#555")); rope.position.y = -1.1; const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.4), M("#f7c915")); seat.position.y = -2.2; sw.add(rope, seat); scene.add(sw); anim.push((t) => (sw.rotation.x = Math.sin(t * 1.8 + x) * 0.5)); }
    colliders.push([px - 2.5, pz - 3, 0.3, 3], [px + 2.5, pz - 3, 0.3, 3]);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 5), M("#e2445c")); slide.rotation.x = -0.5; add(slide, px + 4, 1.2, pz + 3);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1.4), M("#58b4f0")), px + 4, 1.2, pz + 0.2); colliders.push([px + 4, pz + 0.2, 0.9, 2.4]);
    add(new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 3), M("#c9a36b")), px - 3, 0.2, pz + 3);
    const s1 = labelSprite("🛝 Майданчик", "#f08fc0"); s1.position.set(px, 4, pz - 3); scene.add(s1);
  }

  // Вітряк
  {
    const wx = 108, wz = 62;
    add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 9, 8), M("#f1e6d2")), wx, 4.5, wz); colliders.push([wx, wz, 2.5, 10]);
    add(new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 8), M("#c8102e")), wx, 10, wz);
    const blades = new THREE.Group(); blades.position.set(wx, 8, wz - 2); scene.add(blades);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.5, 0.1), M("#fbf9f4")); b.position.y = 2.8; const arm = new THREE.Group(); arm.rotation.z = (k * Math.PI) / 2; arm.add(b); blades.add(arm); }
    anim.push((t) => (blades.rotation.z = t * 0.7));
    spots.push({ x: wx, z: wz + 4, r: 3, label: "🌾 Вітряк", info: "🌾 «Вітряк» від слова «вітер»: у корені чергуються е та і (вітер — вітряк)." });
  }

  // Багаття з колодами
  {
    const cx = -22, cz = 88;
    for (let k = 0; k < 4; k++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6), M("#6b4426")); lg.rotation.z = Math.PI / 2; lg.rotation.y = (k * Math.PI) / 4; add(lg, cx, 0.2, cz); }
    const fire = add(new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 8), new THREE.MeshBasicMaterial({ color: "#ff8a1a" })), cx, 0.8, cz);
    const fire2 = add(new THREE.Mesh(new THREE.ConeGeometry(0.35, 1, 8), new THREE.MeshBasicMaterial({ color: "#ffd54a" })), cx, 0.7, cz);
    fire.userData.dyn = fire2.userData.dyn = true;
    const light = new THREE.PointLight(0xff8a2a, 8, 14, 1.6); light.position.set(cx, 1.4, cz); scene.add(light);
    anim.push((t) => { const k = 1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 17) * 0.06; fire.scale.set(k, k * 1.1, k); fire2.scale.set(k, k, k); light.intensity = 7 + Math.sin(t * 11) * 1.2; });
    colliders.push([cx, cz, 1, 1.5]);
    for (const a of [0, 1.6, 3.2, 4.7]) { const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2), M("#8a5a3c")); bench.rotation.z = Math.PI / 2; bench.rotation.y = a + Math.PI / 2; add(bench, cx + Math.cos(a) * 3, 0.3, cz + Math.sin(a) * 3); }
    spots.push({ x: cx, z: cz + 3.5, r: 3, label: "🔥 Багаття", info: "🔥 Біля багаття розповідають історії. А історія — це текст: зачин, основна частина, кінцівка!" });
  }

  // Дошка оголошень біля школи: квест «Знайди букви»
  add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 2, 0.2), M("#8a5a3c")), 6, 1.8, 52);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.7), new THREE.MeshBasicMaterial({ map: textTex(["🔎 Квест", "«Знайди букви»"], "#f7c915") })); add(board, 6, 1.8, 52.12);
  for (const x of [4.6, 7.4]) add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), M("#6b4426")), x, 0.8, 52);
  colliders.push([6, 52, 1.6, 3]);
  spots.push({ x: 6, z: 53.8, r: 2.4, label: "🔎 Квест «Знайди букви»", sub: "Натисни E — у парку й лісі сховано букви слова", hunt: true });

  // Тварини: блукають своїми зонами; натиснеш E поруч — дізнаєшся мовний факт
  const animals = [];
  const animal = (style, kind, scale, zone, speed) => {
    const m = petModel(style, scale); scene.add(m);
    let x, z, k = 0; do { const a = rnd() * Math.PI * 2, r = rnd() * zone.r; x = zone.x + Math.cos(a) * r; z = zone.z + Math.sin(a) * r; } while (!walk(x, z) && k++ < 50);
    const o = { m, kind, x, z, tx: x, tz: z, zone, speed, wait: rnd() * 3, ry: 0 };
    m.position.set(x, 0, z); animals.push(o); lod.push({ o: m, d: 75, out: true });
    spots.push({ ref: o, r: 2.6 * Math.max(1, scale / 1.5), label: { deer: "🦌 Олень", fox: "🦊 Лисиця", bunny: "🐰 Зайчик", hedgehog: "🦔 Їжачок", dog: "🐶 Пес Бровко", cat: "🐱 Кіт Мурчик" }[kind], info: FACTS[kind] });
  };
  const walk = (x, z) => Math.hypot(x, z) < R_WORLD - 4 && !inLake(x, z, 1) && !inRiver(x, z, 1) && !inRect(x, z, SCHOOL, 1) && !inRect(x, z, QUEST, 1);
  for (let i = 0; i < 4; i++) animal("reindeer", "deer", 2.2, { x: 40 + i * 12, z: 120, r: 30 }, 2.2);
  for (let i = 0; i < 2; i++) animal("reindeer", "deer", 2.2, { x: -40, z: -130, r: 25 }, 2.2);
  for (let i = 0; i < 3; i++) animal("fox", "fox", 1.7, { x: -110, z: 30 + i * 30, r: 25 }, 3);
  for (let i = 0; i < 6; i++) animal("bunny", "bunny", 1.4, { x: 30 + (i % 3) * 25, z: 115, r: 30 }, 3.6);
  for (let i = 0; i < 3; i++) animal("hedgehog", "hedgehog", 1.4, { x: -70 + i * 10, z: -45, r: 20 }, 1.2);
  animal("dog", "dog", 1.6, { x: 46, z: 80, r: 14 }, 3.2);
  animal("cat", "cat", 1.4, { x: 8, z: 46, r: 9 }, 1.6);
  // Сови на деревах
  for (const [x, z] of leafy.slice(0, 5)) { const owl = petModel("owl", 1.4); owl.position.set(x, 5.4, z + 1.6); scene.add(owl); lod.push({ o: owl, d: 60, out: true }); spots.push({ x, z: z + 2.2, r: 3, label: "🦉 Сова на дереві", info: FACTS.owl }); }
  // Качки на озері
  const ducks = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Group();
    d.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8).scale(1.3, 0.8, 1), M(i === 0 ? "#f7c915" : "#8a6a4a")), 0, 0.2, 0));
    d.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M(i % 2 ? "#2f7d3a" : "#8a6a4a")), 0.38, 0.5, 0));
    d.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.12), M("#ff9d1a")), 0.6, 0.47, 0));
    scene.add(d); const l = LAKES[i % 2]; lod.push({ o: d, d: 90, out: true }); ducks.push({ d, l, a: rnd() * 6, r: 0.3 + rnd() * 0.5, sp: 0.08 + rnd() * 0.08 });
  }
  spots.push({ x: -70, z: 130.5, r: 2, label: "🦆 Качки", info: FACTS.duck });
  // Риби вистрибують із води
  const fish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6).scale(1.6, 0.7, 0.6), M("#f7a51a")); scene.add(fish);
  let fishT = 0, fishP = null;
  // Птахи й хмари
  const birds = [];
  for (let i = 0; i < 9; i++) { const b = new THREE.Group(); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.3), M("#2a2733")); w.position.x = s * 0.45; b.add(w); } scene.add(b); birds.push({ b, cx: (i % 3) * 60 - 60, cz: -40 + Math.floor(i / 3) * 60, r: 14 + rnd() * 10, ph: rnd() * 6, h: 20 + rnd() * 8 }); }
  const clouds = [];
  for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(3 + rnd() * 3, 8, 6), new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#bbbbbb" })); p.position.set(k * 4 - 6, rnd() * 1.5, rnd() * 3); c.add(p); } c.position.set((rnd() - 0.5) * 400, 45 + rnd() * 15, (rnd() - 0.5) * 400); scene.add(c); mergeStatic(c); clouds.push(c); }
  // Метелики біля квітів
  const butterflies = [];
  for (let i = 0; i < 14; i++) { const b = new THREE.Group(); const c = fcols[i % fcols.length]; for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.3), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); w.position.x = s * 0.17; b.add(w); } scene.add(b); lod.push({ o: b, d: 55, out: true }); butterflies.push({ b, cx: 20 + rnd() * 70, cz: 95 + rnd() * 50, ph: rnd() * 6 }); }

  // ---------- Квест «Знайди букви» ----------
  const hunt = { on: false, word: "", got: [], letters: [] };
  function startHunt(word) {
    stopHunt();
    hunt.on = true; hunt.word = word; hunt.got = word.split("").map(() => false);
    hunt.letters = word.split("").map((ch, i) => {
      let x, z, k = 0; do { const a = rnd() * Math.PI * 2, r = 25 + Math.random() * 85; x = Math.cos(a) * r; z = 45 + Math.sin(a) * r * 0.9; } while ((!walk(x, z) || Math.hypot(x - 6, z - 52) < 15) && k++ < 200);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex([ch.toUpperCase()], "#9d6bdb", 128, "900 86px Fixel Display, Fixel Text, sans-serif"), depthTest: true }));
      s.scale.set(1.6, 1.6, 1); s.position.set(x, 1.6, z); scene.add(s);
      return { s, i, x, z };
    });
  }
  function stopHunt() { hunt.letters.forEach((l) => scene.remove(l.s)); hunt.letters = []; hunt.on = false; }

  function blocked(x, z, y = 0) {
    if (Math.hypot(x, z) > R_WORLD) return true;
    if (y < 0.5) {
      if (inLake(x, z) && !onPier(x, z)) return true;
      if (inRiver(x, z) && !onBridge(x)) return true;
    }
    for (const [cx, cz, r, top] of colliders) if (y < top && (x - cx) ** 2 + (z - cz) ** 2 < (r + 0.4) ** 2) return true;
    return false;
  }

  function tick(t, dt, me) {
    for (const f of anim) f(t);
    // м’яч
    if (me && me.y < 0.6 && !me.fly) { const dx = ball.position.x - me.x, dz = ball.position.z - me.z, d = Math.hypot(dx, dz); if (d < 1.1 && d > 0.01) { const k = 9 / d; bv.x = dx * k; bv.z = dz * k; } }
    const nx = ball.position.x + bv.x * dt, nz = ball.position.z + bv.z * dt;
    if (Math.abs(nz - FIELD.z) > FIELD.d / 2 - 0.4) bv.z *= -0.7; else ball.position.z = nz;
    const inGoal = Math.abs(nz - FIELD.z) < 2;
    if (Math.abs(nx - FIELD.x) > FIELD.w / 2 + (inGoal ? 1.5 : -0.4)) bv.x *= -0.7; else ball.position.x = nx;
    bv.x *= Math.pow(0.35, dt); bv.z *= Math.pow(0.35, dt);
    ball.rotation.x += bv.z * dt * 2; ball.rotation.z -= bv.x * dt * 2;
    goalCd -= dt;
    if (inGoal && goalCd <= 0 && Math.abs(ball.position.x - FIELD.x) > FIELD.w / 2 + 0.3) { goalCd = 3; onGoal?.(); setTimeout(resetBall, 1500); }
    // тварини
    for (const o of animals) {
      const near = me && Math.hypot(me.x - o.x, me.z - o.z) < 4 && (o.kind === "bunny" || o.kind === "deer");
      if (near) { const a = Math.atan2(o.x - me.x, o.z - me.z); o.tx = o.x + Math.sin(a) * 8; o.tz = o.z + Math.cos(a) * 8; o.wait = 0; }
      const dx = o.tx - o.x, dz = o.tz - o.z, d = Math.hypot(dx, dz);
      if (d < 0.3) { o.wait -= dt; if (o.wait <= 0) { const a = Math.random() * Math.PI * 2, r = Math.random() * o.zone.r; o.tx = o.zone.x + Math.cos(a) * r; o.tz = o.zone.z + Math.sin(a) * r; o.wait = 2 + Math.random() * 4; if (!walk(o.tx, o.tz)) { o.tx = o.x; o.tz = o.z; } } }
      else {
        const sp = o.speed * (near ? 2 : 1) * dt, nx2 = o.x + (dx / d) * sp, nz2 = o.z + (dz / d) * sp;
        if (walk(nx2, nz2)) { o.x = nx2; o.z = nz2; } else { o.tx = o.x; o.tz = o.z; }
        o.ry = Math.atan2(dx, dz);
      }
      const moving = d >= 0.3;
      o.m.position.set(o.x, moving ? Math.abs(Math.sin(t * (o.kind === "bunny" ? 10 : 7) + o.zone.x)) * (o.kind === "bunny" ? 0.35 : 0.12) : 0, o.z);
      o.m.rotation.y += angDiff(o.m.rotation.y, o.ry) * Math.min(1, dt * 6);
    }
    for (const q of ducks) { q.a += q.sp * dt; const x = q.l.x + Math.cos(q.a) * q.l.rx * q.r, z = q.l.z + Math.sin(q.a) * q.l.rz * q.r; q.d.position.set(x, 0.05 + Math.sin(t * 2 + q.a) * 0.03, z); q.d.rotation.y = -q.a; }
    fishT -= dt;
    if (fishT <= 0) { const l = LAKES[Math.floor(Math.random() * 2)], a = Math.random() * 6, r = Math.random() * 0.6; fishP = { x: l.x + Math.cos(a) * l.rx * r, z: l.z + Math.sin(a) * l.rz * r, t: 0, dir: Math.random() * 6 }; fishT = 2 + Math.random() * 3; }
    if (fishP) { fishP.t += dt; const k = fishP.t / 0.9; if (k > 1) { fish.visible = false; fishP = null; } else { fish.visible = true; fish.position.set(fishP.x + Math.cos(fishP.dir) * k * 2, Math.sin(k * Math.PI) * 1.4, fishP.z + Math.sin(fishP.dir) * k * 2); fish.rotation.set(0, -fishP.dir, (0.5 - k) * 2); } }
    for (const q of birds) { const a = t * 0.25 + q.ph; q.b.position.set(q.cx + Math.cos(a) * q.r, q.h + Math.sin(t + q.ph) * 1.5, q.cz + Math.sin(a) * q.r); q.b.rotation.y = -a; q.b.children.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.sin(t * 8 + q.ph) * 0.5)); }
    for (const c of clouds) { c.position.x += dt * 1.2; if (c.position.x > 230) c.position.x = -230; }
    for (const q of butterflies) { const a = t * 0.6 + q.ph; q.b.position.set(q.cx + Math.cos(a) * 3, 1 + Math.sin(t * 2 + q.ph) * 0.4, q.cz + Math.sin(a * 1.3) * 3); q.b.rotation.y = a; q.b.children.forEach((w, i) => (w.rotation.y = (i ? -1 : 1) * Math.sin(t * 14 + q.ph) * 0.9)); }
    // букви квесту
    if (hunt.on && me) for (const l of hunt.letters) {
      if (!l.s.parent) continue;
      l.s.position.y = 1.6 + Math.sin(t * 2 + l.i) * 0.25;
      if (Math.hypot(me.x - l.x, me.z - l.z) < 1.8) { scene.remove(l.s); hunt.got[l.i] = true; hunt.onGot?.(l.i); }
    }
  }
  // Найближча буква — для підказки «гарячо/холодно»
  const huntNearest = (me) => Math.min(...hunt.letters.filter((l) => l.s.parent).map((l) => Math.hypot(me.x - l.x, me.z - l.z)));
  mergeStatic(stat);
  return { lod, blocked, spots, tick, hunt, startHunt, stopHunt, huntNearest, setOnGoal: (f) => (onGoal = f), animalPos: (s) => (s.ref ? [s.ref.x, s.ref.z] : [s.x, s.z]) };
}

const at = (m, x, y, z) => (m.position.set(x, y, z), m);
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
function textTex(lines, border = "#99cc00", w = 512, font = "bold 64px Fixel Text, sans-serif") {
  const hgt = w === 128 ? 128 : 280;
  const c = document.createElement("canvas"); c.width = w; c.height = hgt; const g = c.getContext("2d");
  g.fillStyle = "#fffdf6"; g.beginPath(); g.roundRect(4, 4, w - 8, hgt - 8, 24); g.fill(); g.strokeStyle = border; g.lineWidth = 8; g.stroke();
  g.fillStyle = "#1e1b26"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = font;
  lines.forEach((s, i) => g.fillText(s, w / 2, hgt / 2 + (i - (lines.length - 1) / 2) * (hgt / (lines.length + 0.5)), w - 24));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function labelSprite(text, border) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex([text], border) })); s.scale.set(3.4, 1.85, 1); return s; }
