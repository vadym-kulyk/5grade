// 🏡 Містечко: кожен учень може збудувати двоповерховий дім на своїй ділянці й поставити меблі.
// Дані: houses/{uid} = { plot, wall, roof, name, cls, at, items: { id: { k, x, z, f, ry } } } (координати — відносно ділянки)
import * as THREE from "three";

export const VILLAGE = { x0: -152, x1: -68, z0: -72, z1: 72 };
const COLS = 4, ROWS = 7, STEPP = 20;
export const PLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({ n: i + 1, x: -140 + (i % COLS) * STEPP, z: -60 + Math.floor(i / COLS) * STEPP }));
export const HOUSE_PRICE = 300;
export const WALLS = ["#f4e3c3", "#cfe0f5", "#f6c9c5", "#d7ecd0", "#e8dcf4", "#ffffff"];
export const ROOFS = ["#c8452b", "#2440c2", "#2a8c4a", "#5e6372"];
const FLH = 3.2, G0 = 0.2, G1 = G0 + FLH; // висота поверху, підлога 1-го та 2-го поверхів
const W = 9, D = 8; // розмір будинку
// Сходи на 2-й поверх: уздовж східної стіни, вгору на північ
const ST = { x0: 2.9, x1: 4.25, zb: 3.2, n: 10, tread: 0.56 };
const stTop = ST.zb - ST.n * ST.tread; // -2.4

// Меблі: розмір, ціна, висота (для тіла), як намалювати
export const FURN = {
  bed: { name: "Ліжко", price: 120, w: 1.6, d: 2.2, h: 0.6 },
  sofa: { name: "Диван", price: 100, w: 2.2, d: 0.9, h: 0.8 },
  armchair: { name: "Крісло", price: 60, w: 0.9, d: 0.9, h: 0.8 },
  table: { name: "Стіл", price: 50, w: 1.4, d: 0.9, h: 0.75 },
  chair: { name: "Стілець", price: 25, w: 0.5, d: 0.5, h: 0.9 },
  desk: { name: "Письмовий стіл", price: 60, w: 1.3, d: 0.7, h: 0.75 },
  wardrobe: { name: "Шафа", price: 90, w: 1.2, d: 0.6, h: 2 },
  shelf: { name: "Книжкова полиця", price: 80, w: 1.2, d: 0.4, h: 1.8 },
  tv: { name: "Телевізор", price: 150, w: 1.3, d: 0.4, h: 1.2 },
  lamp: { name: "Торшер", price: 30, w: 0.4, d: 0.4, h: 1.6 },
  plant: { name: "Вазон", price: 20, w: 0.5, d: 0.5, h: 0.9 },
  carpet: { name: "Килим", price: 40, w: 2, d: 1.4, h: 0, flat: true },
  fireplace: { name: "Камін", price: 200, w: 1.6, d: 0.6, h: 1.3 },
  piano: { name: "Піаніно", price: 250, w: 1.5, d: 0.6, h: 1.3 },
  aquarium: { name: "Акваріум", price: 180, w: 1.2, d: 0.5, h: 1.2 },
  xtree: { name: "Ялинка", price: 150, w: 1.2, d: 1.2, h: 2.2 },
  snowglobe: { name: "Снігова куля", price: 70, w: 0.5, d: 0.5, h: 0.9 },
  gifts: { name: "Подарунки", price: 60, w: 1, d: 0.8, h: 0.6 },
};

const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };

function furnitureMesh(k) {
  const g = new THREE.Group(), f = FURN[k];
  const wood = M("#a0703f"), dark = M("#5a3a20");
  switch (k) {
    case "bed": g.add(box(1.6, 0.4, 2.2, wood, 0, 0.2, 0), box(1.5, 0.18, 2.1, M("#f4f6fb"), 0, 0.49, 0), box(1.5, 0.12, 1.3, M("#2440c2"), 0, 0.6, 0.35), box(1.6, 0.9, 0.12, dark, 0, 0.45, -1.05), box(0.6, 0.15, 0.4, M("#ffffff"), 0, 0.65, -0.75)); break;
    case "sofa": g.add(box(2.2, 0.45, 0.9, M("#d9342b"), 0, 0.22, 0), box(2.2, 0.5, 0.2, M("#b52a22"), 0, 0.7, -0.35), box(0.2, 0.35, 0.9, M("#b52a22"), -1, 0.55, 0), box(0.2, 0.35, 0.9, M("#b52a22"), 1, 0.55, 0)); break;
    case "armchair": g.add(box(0.9, 0.45, 0.9, M("#2a8c4a"), 0, 0.22, 0), box(0.9, 0.5, 0.18, M("#22743d"), 0, 0.7, -0.36), box(0.16, 0.3, 0.9, M("#22743d"), -0.37, 0.55, 0), box(0.16, 0.3, 0.9, M("#22743d"), 0.37, 0.55, 0)); break;
    case "table": g.add(box(1.4, 0.08, 0.9, wood, 0, 0.72, 0)); for (const [x, z] of [[-0.6, -0.38], [0.6, -0.38], [-0.6, 0.38], [0.6, 0.38]]) g.add(box(0.08, 0.7, 0.08, dark, x, 0.35, z)); break;
    case "chair": g.add(box(0.5, 0.06, 0.5, wood, 0, 0.45, 0), box(0.5, 0.5, 0.06, wood, 0, 0.72, -0.22)); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) g.add(box(0.05, 0.45, 0.05, dark, x, 0.22, z)); break;
    case "desk": g.add(box(1.3, 0.07, 0.7, wood, 0, 0.72, 0), box(0.4, 0.7, 0.66, dark, 0.42, 0.35, 0), box(0.06, 0.7, 0.66, dark, -0.6, 0.35, 0), box(0.5, 0.35, 0.05, M("#23262d"), -0.1, 0.95, -0.2)); break;
    case "wardrobe": g.add(box(1.2, 2, 0.6, wood, 0, 1, 0), box(0.02, 1.9, 0.02, dark, 0, 1, 0.31), box(0.06, 0.2, 0.04, M("#ffd43b"), -0.1, 1, 0.32), box(0.06, 0.2, 0.04, M("#ffd43b"), 0.1, 1, 0.32)); break;
    case "shelf": { g.add(box(1.2, 1.8, 0.4, wood, 0, 0.9, 0)); const cols = ["#d9342b", "#2440c2", "#2a8c4a", "#ffd43b", "#94aef3"]; for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) g.add(box(0.14, 0.3, 0.3, M(cols[(r + i) % 5]), -0.45 + i * 0.18, 0.25 + r * 0.42, 0.04)); break; }
    case "tv": g.add(box(1.3, 0.5, 0.4, dark, 0, 0.25, 0), box(1.2, 0.7, 0.06, M("#23262d"), 0, 0.85, 0), box(1.1, 0.6, 0.02, new THREE.MeshBasicMaterial({ color: "#58b4f0" }), 0, 0.85, 0.04)); break;
    case "lamp": g.add(box(0.3, 0.05, 0.3, dark, 0, 0.03, 0), box(0.04, 1.4, 0.04, dark, 0, 0.72, 0)); { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.3, 12), new THREE.MeshBasicMaterial({ color: "#fff3b8" })); sh.position.y = 1.5; g.add(sh); } break;
    case "plant": { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.35, 10), M("#c8452b")); pot.position.y = 0.17; g.add(pot); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M("#2a8c4a")); lf.position.y = 0.6; g.add(lf); break; }
    case "carpet": g.add(box(2, 0.02, 1.4, M("#94aef3"), 0, 0.01, 0), box(1.6, 0.025, 1, M("#2440c2"), 0, 0.012, 0)); break;
    case "fireplace": g.add(box(1.6, 1.3, 0.6, M("#b8a99a"), 0, 0.65, 0), box(0.9, 0.7, 0.1, M("#23262d"), 0, 0.4, 0.28)); { const fire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 8), new THREE.MeshBasicMaterial({ color: "#ff8a1a" })); fire.position.set(0, 0.3, 0.2); fire.userData.flame = true; g.add(fire); } break;
    case "piano": g.add(box(1.5, 1.1, 0.5, M("#23262d"), 0, 0.75, -0.05), box(1.4, 0.06, 0.25, M("#ffffff"), 0, 0.75, 0.3), box(0.06, 0.75, 0.06, M("#23262d"), -0.65, 0.37, 0.25), box(0.06, 0.75, 0.06, M("#23262d"), 0.65, 0.37, 0.25)); break;
    case "aquarium": g.add(box(1.2, 0.5, 0.5, dark, 0, 0.25, 0), box(1.15, 0.6, 0.45, M("#58b4f0", { transparent: true, opacity: 0.55 }), 0, 0.82, 0), box(0.15, 0.08, 0.04, M("#ff8a1a"), -0.2, 0.85, 0), box(0.15, 0.08, 0.04, M("#ffd43b"), 0.25, 0.75, 0.05)); break;
    case "xtree": { for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.6 - i * 0.15, 0.8, 8), M("#2a7a45")); c.position.y = 0.6 + i * 0.5; g.add(c); } const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), new THREE.MeshBasicMaterial({ color: "#ffd43b" })); st.position.y = 2.1; g.add(st); for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: ["#d9342b", "#ffd43b", "#58b4f0"][i % 3] })); const a = i * 2.3; b.position.set(Math.cos(a) * (0.45 - (i % 4) * 0.08), 0.5 + (i % 4) * 0.4, Math.sin(a) * (0.45 - (i % 4) * 0.08)); g.add(b); } break; }
    case "snowglobe": g.add(box(0.4, 0.3, 0.4, M("#a0703f"), 0, 0.15, 0)); { const s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), M("#d9efff", { transparent: true, opacity: 0.6 })); s.position.y = 0.55; g.add(s); } break;
    case "gifts": g.add(box(0.5, 0.4, 0.5, M("#d9342b"), -0.2, 0.2, 0), box(0.4, 0.5, 0.4, M("#2440c2"), 0.25, 0.25, 0.1), box(0.3, 0.3, 0.3, M("#2a8c4a"), 0, 0.15, -0.3), box(0.52, 0.06, 0.1, M("#ffd43b"), -0.2, 0.4, 0)); break;
  }
  g.userData.k = k; g.userData.h = f.h;
  return g;
}

// Будинок. Повертає { group, upper (2-й поверх), roof, solids }
function buildHouse(h, P, labelSprite) {
  const group = new THREE.Group(); group.position.set(P.x, 0, P.z);
  const upper = new THREE.Group(), roof = new THREE.Group(), items = new THREE.Group();
  group.add(upper, roof, items);
  const wallM = M(h.wall || WALLS[0]), roofM = M(h.roof || ROOFS[0]), floorM = M("#c9a36b"), floor2M = M("#e2cfa6"), trimM = M("#ffffff");
  const solids = [];
  const sol = (x0, x1, z0, z1, b, t, extra = {}) => solids.push({ x0: P.x + x0, x1: P.x + x1, z0: P.z + z0, z1: P.z + z1, b, t, ...extra });
  const T = 0.25, H2 = G1 + FLH; // товщина стін, висота стін
  // Фундамент / підлога 1-го поверху
  group.add(box(W, G0, D, floorM, 0, G0 / 2, 0)); sol(-W / 2, W / 2, -D / 2, D / 2, 0, G0);
  // Підлога 2-го поверху з отвором для сходів
  const slab = (x0, x1, z0, z1) => { upper.add(box(x1 - x0, 0.2, z1 - z0, floor2M, (x0 + x1) / 2, G1 - 0.1, (z0 + z1) / 2)); sol(x0, x1, z0, z1, G1 - 0.2, G1); };
  slab(-W / 2 + T, ST.x0, -D / 2 + T, D / 2 - T); slab(ST.x0, W / 2 - T, -D / 2 + T, stTop); slab(ST.x0, W / 2 - T, ST.zb, D / 2 - T);
  // Поручні навколо отвору на 2-му поверсі (вихід — з півночі)
  upper.add(box(0.08, 1, ST.zb - stTop, trimM, ST.x0 - 0.04, G1 + 0.5, (ST.zb + stTop) / 2)); sol(ST.x0 - 0.1, ST.x0, stTop, ST.zb, G1, G1 + 1);
  // Сходи
  for (let k = 1; k <= ST.n; k++) {
    const z1 = ST.zb - (k - 1) * ST.tread, z0 = z1 - ST.tread, top = G0 + k * (FLH / ST.n);
    group.add(box(ST.x1 - ST.x0, top, ST.tread, M(k % 2 ? "#a0703f" : "#8a5a3c"), (ST.x0 + ST.x1) / 2, top / 2, (z0 + z1) / 2));
    sol(ST.x0, ST.x1, z0, z1, 0, top);
  }
  // Стіни: нижня і верхня половина окремо (верхню ховаємо, коли ти на 1-му поверсі)
  const wall = (x0, x1, z0, z1, b, t, target) => { target.add(box(x1 - x0, t - b, z1 - z0, wallM, (x0 + x1) / 2, (b + t) / 2, (z0 + z1) / 2)); sol(x0, x1, z0, z1, b, t, { wall: true }); };
  const hw = W / 2, hd = D / 2, dw = 0.85;
  for (const [b, t, tg] of [[0, G1, group], [G1, H2, upper]]) {
    wall(-hw, hw, -hd, -hd + T, b, t, tg); // задня
    wall(-hw, -hw + T, -hd, hd, b, t, tg); wall(hw - T, hw, -hd, hd, b, t, tg); // боки
    if (b === 0) { wall(-hw, -dw, hd - T, hd, b, t, tg); wall(dw, hw, hd - T, hd, b, t, tg); wall(-dw, dw, hd - T, hd, 2.5, t, tg); } // фасад із дверима
    else wall(-hw, hw, hd - T, hd, b, t, tg);
  }
  // Вікна (візуально)
  const glass = M("#bfe3ff", { emissive: "#24405a" });
  for (const [x, y] of [[-2.6, 1.6], [2.6, 1.6], [-2.6, G1 + 1.6], [0, G1 + 1.6], [2.6, G1 + 1.6]]) (y > G1 ? upper : group).add(box(1.1, 0.9, 0.05, glass, x, y, hd + 0.01));
  // Двері (прочинені)
  const door = box(1.6, 2.4, 0.08, M("#8a5a3c"), -1.3, 1.4, hd + 0.3); door.rotation.y = 0.9; group.add(door);
  // Дах-двосхил
  const rl = Math.hypot(hw + 0.4, 2);
  for (const s of [-1, 1]) { const p = box(rl, 0.15, D + 0.8, roofM, s * (hw + 0.4) / 2, H2 + 1, 0); p.rotation.z = -s * Math.atan2(2, hw + 0.4); roof.add(p); }
  const gable = new THREE.Shape(); gable.moveTo(-hw, 0); gable.lineTo(hw, 0); gable.lineTo(0, 2); gable.closePath();
  for (const z of [-hd, hd]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(gable), wallM); gm.position.set(0, H2, z); if (z < 0) gm.rotation.y = Math.PI; roof.add(gm); }
  // Табличка з іменем
  const lbl = labelSprite(`🏡 ${h.name || "Дім"}`, h.roof || ROOFS[0]); lbl.position.set(0, H2 + 3.6, 0); lbl.scale.multiplyScalar(0.9); group.add(lbl);
  // Меблі
  const itemSolids = [];
  for (const [id, it] of Object.entries(h.items || {})) {
    const f = FURN[it.k]; if (!f) continue;
    const m = furnitureMesh(it.k); const y = it.f ? G1 : G0;
    m.position.set(it.x, y, it.z); m.rotation.y = it.ry || 0; m.userData.id = id; m.userData.f = it.f || 0;
    (it.f ? upper : items).add(m);
    if (!f.flat) { const rot = Math.round((it.ry || 0) / (Math.PI / 2)) % 2 !== 0; const hw2 = (rot ? f.d : f.w) / 2, hd2 = (rot ? f.w : f.d) / 2; sol(it.x - hw2, it.x + hw2, it.z - hd2, it.z + hd2, y, y + f.h, { furn: id }); }
  }
  return { group, upper, roof, items, solids, flames: [] };
}

// Чи можна поставити річ сюди (локальні координати ділянки)
export function canPlace(k, x, z, f) {
  const it = FURN[k], r = Math.max(it.w, it.d) / 2;
  if (Math.abs(x) > W / 2 - 0.3 - r * 0.6 || Math.abs(z) > D / 2 - 0.3 - r * 0.6) return "Тут стіна — стань ближче до середини кімнати";
  if (x + r > ST.x0 - 0.1 && z < ST.zb + 0.3 && (f === 0 || z > stTop - 0.3)) return "Тут сходи — стань в іншому місці";
  if (f === 0 && Math.abs(x) < 1.2 && z > D / 2 - 1.6) return "Не заставляй двері 🙂";
  return null;
}

export function buildVillage(scene, solids, labelSprite) {
  const M2 = (c) => new THREE.MeshLambertMaterial({ color: c });
  // Доріжки містечка
  const road = M2("#dfe6ee");
  for (let c = 0; c <= COLS; c++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(3, VILLAGE.z1 - VILLAGE.z0), road); r.rotation.x = -Math.PI / 2; r.position.set(-150 + c * STEPP, 0.013, (VILLAGE.z0 + VILLAGE.z1) / 2); scene.add(r); }
  const sign = labelSprite("🏡 Містечко: збудуй свій дім!", "#2a8c4a"); sign.position.set(-66, 3.5, 0); sign.scale.multiplyScalar(1.3); scene.add(sign);
  const plotMarks = PLOTS.map((P) => {
    const peg = new THREE.Group();
    const fence = M2("#a0703f");
    for (const [x, z, w, d] of [[0, -8.5, 17, 0.12], [-8.5, 0, 0.12, 17], [8.5, 0, 0.12, 17], [-5.4, 8.5, 6.2, 0.12], [5.4, 8.5, 6.2, 0.12]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), fence); b.position.set(x, 0.3, z); peg.add(b); }
    peg.position.set(P.x, 0, P.z); scene.add(peg);
    const lbl = labelSprite(`Ділянка ${P.n} · вільна`, "#94aef3"); lbl.position.set(P.x, 2.2, P.z + 9.5); lbl.scale.multiplyScalar(0.7); scene.add(lbl);
    return { peg, lbl };
  });
  const built = new Map(); // uid → { key, house, P }
  function sync(all, myUid) {
    const seen = new Set();
    for (const [uid, h] of Object.entries(all || {})) {
      const P = PLOTS[(h.plot || 1) - 1]; if (!P) continue;
      seen.add(uid);
      const key = JSON.stringify(h);
      const old = built.get(uid);
      if (old?.key === key) continue;
      if (old) remove(uid);
      const house = buildHouse(h, P, labelSprite);
      scene.add(house.group); solids.push(...house.solids);
      plotMarks[P.n - 1].lbl.visible = false;
      built.set(uid, { key, house, P, h, mine: uid === myUid });
    }
    for (const uid of [...built.keys()]) if (!seen.has(uid)) remove(uid);
  }
  function remove(uid) {
    const b = built.get(uid); if (!b) return;
    scene.remove(b.house.group);
    for (const s of b.house.solids) { const i = solids.indexOf(s); if (i >= 0) solids.splice(i, 1); }
    plotMarks[b.P.n - 1].lbl.visible = true;
    built.delete(uid);
  }
  // У якому будинку я стою (і на якому поверсі)
  function at(x, z, y) {
    for (const [uid, b] of built) {
      const lx = x - b.P.x, lz = z - b.P.z;
      if (Math.abs(lx) < W / 2 && Math.abs(lz) < D / 2) return { uid, b, lx, lz, f: y > G1 - 0.6 ? 1 : 0 };
    }
    return null;
  }
  // Показуємо дах і 2-й поверх, лише коли вони не заважають бачити, де ти
  function tick(t, x, z, y) {
    const inside = at(x, z, y);
    for (const [uid, b] of built) {
      const here = inside?.uid === uid;
      b.house.roof.visible = !here;
      b.house.upper.visible = !here || inside.f === 1;
    }
    return inside;
  }
  const freePlot = (all) => PLOTS.find((P) => !Object.values(all || {}).some((h) => h.plot === P.n));
  const plotAt = (x, z) => PLOTS.find((P) => Math.abs(x - P.x) < 9 && Math.abs(z - (P.z + 9.5)) < 2.5);
  return { sync, at, tick, freePlot, plotAt, built };
}
