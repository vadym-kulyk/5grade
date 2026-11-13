// ❄️ Крижана вежа: стрибай з платформи на платформу вгору до призу.
// Платформи — «тверді тіла» (solids): на них можна стояти; рухомі несуть персонажа за собою.
import * as THREE from "three";

export const PK = { x: 62, z: 132, r: 34 }; // центр і зона, де не можна літати
const N = 42; // кількість сходинок-платформ до вершини

export function buildParkour(scene, solids, labelSprite) {
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const KIND = { still: "#bfe3ff", move: "#ffd43b", lift: "#94aef3", blink: "#f08a80", rest: "#ffffff" };
  const plats = [];
  const add = (x, y, z, w, d, kind = "still", o = {}) => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, d), M(KIND[kind]));
    top.position.y = -0.225; g.add(top);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.06, d * 0.96), M("#ffffff"));
    cap.position.y = 0.03; g.add(cap);
    // бурулька знизу — щоб було видно, що платформа висить
    const ice = new THREE.Mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.3, 0.9, 6), M("#d9efff", { transparent: true, opacity: 0.85 }));
    ice.rotation.x = Math.PI; ice.position.y = -0.9; g.add(ice);
    g.position.set(x, y, z); scene.add(g);
    const s = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, b: y - 0.45, t: y, dx: 0, dz: 0, pk: true };
    solids.push(s);
    const p = { g, s, x, y, z, w, d, kind, ...o };
    plats.push(p); return p;
  };

  // Старт: широка крижина біля землі й табличка
  // Старт — перша сходинка спіралі (до першої платформи легко доплигнути)
  const start = add(PK.x, 0.35, PK.z + 12, 5, 5, "rest", { start: true });
  const sign = labelSprite("❄️ Крижана вежа: приз 500 🪙", "#58b4f0"); sign.position.set(PK.x + 3, 5.5, PK.z + 17); sign.scale.multiplyScalar(0.8); scene.add(sign);
  const cps = [];
  // Спіраль угору
  for (let i = 1; i <= N; i++) {
    const a = Math.PI / 2 + i * 0.36, R = 12 + Math.sin(i * 0.5) * 3;
    const x = PK.x + Math.cos(a) * R, z = PK.z + Math.sin(a) * R, y = 0.35 + i * 0.7;
    if (i % 14 === 0 && i < N) { const cp = add(x, y, z, 4, 4, "rest", { cp: cps.length + 1 }); cps.push(cp); flag(cp); continue; }
    if (i % 9 === 0) { add(x, y, z, 2.2, 2.2, "lift", { amp: 0.9, per: 3.2, ph: i }); continue; }
    if (i % 6 === 0) { add(x, y, z, 2.2, 2.2, "move", { amp: 1.7, per: 3.6, ph: i, a }); continue; }
    if (i % 11 === 0) { add(x, y, z, 2.4, 2.4, "blink", { ph: i }); continue; }
    const small = i % 4 === 0;
    add(x, y, z, small ? 1.6 : 2.4, small ? 1.6 : 2.4, "still");
  }
  // Вершина з подарунком
  const a = Math.PI / 2 + (N + 1) * 0.36, R = 11;
  const top = add(PK.x + Math.cos(a) * R, 0.35 + (N + 1) * 0.7, PK.z + Math.sin(a) * R, 5, 5, "rest", { top: true });
  const gift = new THREE.Group();
  gift.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2), M("#d9342b")));
  gift.add(new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.02, 0.25), M("#ffd43b")));
  gift.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.02, 1.25), M("#ffd43b")));
  gift.position.set(0, 0.5, 0); top.g.add(gift);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({ color: "#ffd43b" })); star.position.y = 2.2; top.g.add(star);
  const prizeSign = labelSprite("🎁 Приз 500 🪙", "#ffd43b"); prizeSign.position.set(0, 5.5, -2); prizeSign.scale.multiplyScalar(0.8); top.g.add(prizeSign);

  function flag(p) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), M("#5e6372")); pole.position.set(p.w / 2 - 0.4, 1.1, p.d / 2 - 0.4); p.g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: "#2a8c4a", side: THREE.DoubleSide })); fl.position.set(p.w / 2 - 0.85, 1.9, p.d / 2 - 0.4); p.g.add(fl);
  }

  // Рух платформ: оновлюємо меш і межі тіла; dx/dz — на скільки зрушилась за кадр (щоб нести персонажа)
  function tick(t) {
    for (const p of plats) {
      const s = p.s;
      let x = p.x, y = p.y, z = p.z;
      if (p.kind === "move") { const k = Math.sin((t / p.per) * Math.PI * 2 + p.ph) * p.amp; x += -Math.sin(p.a) * k; z += Math.cos(p.a) * k; }
      if (p.kind === "lift") y += Math.sin((t / p.per) * Math.PI * 2 + p.ph) * p.amp;
      if (p.kind === "blink") {
        const ph = (t + p.ph) % 4; const on = ph < 2.6;
        p.g.visible = on || Math.floor(t * 8) % 2 === 0 && ph < 3; // блимає перед зникненням
        s.t = on ? p.y : -99; s.b = on ? p.y - 0.45 : -100;
        if (!on) p.g.visible = false;
        continue;
      }
      s.dx = x - (s.x0 + s.x1) / 2; s.dz = z - (s.z0 + s.z1) / 2;
      s.x0 = x - p.w / 2; s.x1 = x + p.w / 2; s.z0 = z - p.d / 2; s.z1 = z + p.d / 2; s.t = y; s.b = y - 0.45;
      p.g.position.set(x, y, z);
    }
    star.rotation.y = t * 1.5; gift.rotation.y = Math.sin(t) * 0.2;
  }
  const zone = (x, z) => Math.hypot(x - PK.x, z - PK.z) < PK.r;
  return { tick, zone, start: start.s, top: top.s, cps: cps.map((c) => c.s), cpPos: cps.map((c) => [c.x, c.y, c.z]), startPos: [start.x, start.y, start.z] };
}
