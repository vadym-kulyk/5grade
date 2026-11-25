// 🏔️ Велика гірка (18 м): нагору — лише стрибками по крижинах-спіралі, донизу — на санчатах.
// ⛸️ Велика ковзанка за річкою: збери 15 зірок за 90 с, не сходячи з льоду, — приз 300 🪙.
import * as THREE from "three";
import { mergeStatic } from "./merge.js";

// Гірка: спуск у бік −x (від x0 до top0 — траса, top0…top1 — майданчик, top1…x1 — прямовисна стіна)
export const BIG = {
  x0: 60, top0: 104, top1: 112, x1: 112.6, z0: 30, z1: 42, H: 18, vmax: 22,
  gates: [{ x: 98, z: 33 }, { x: 90, z: 39 }, { x: 82, z: 33 }, { x: 74, z: 39 }, { x: 66, z: 33 }], gateW: 1.4,
  h(x) {
    if (x <= this.x0 || x >= this.x1) return 0;
    if (x < this.top0) return this.H * ((x - this.x0) / (this.top0 - this.x0)) ** 1.6;
    if (x <= this.top1) return this.H;
    return this.H * (this.x1 - x) / (this.x1 - this.top1);
  },
};
BIG.h = BIG.h.bind(BIG);
const SP = { x: 118, z: 49, R: 6.8, N: 22, rise: 0.8 }; // спіраль крижин біля вершини
// Без дерев: гірка з виїздом і спіраль; і там же не можна літати
export const BIG_ZONE = { x0: 34, x1: 128, z0: 24, z1: 58 };
export const NOFLY = { x0: 56, x1: 128, z0: 26, z1: 58 };
// Велика ковзанка (еліпс)
export const RINK = { x: -30, z: -138, rx: 42, rz: 20 };
export const inRink = (x, z, pad = 0) => ((x - RINK.x) / (RINK.rx + pad)) ** 2 + ((z - RINK.z) / (RINK.rz + pad)) ** 2 < 1;
const RINK_PRIZE = 300, RINK_TIME = 90, STARS = 15;

const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });

export function buildBigHill(scene, solids, labelSprite) {
  const S = BIG, hg = new THREE.Group(); scene.add(hg);
  const shape = new THREE.Shape();
  shape.moveTo(S.x0, 0);
  for (let x = S.x0 + 1; x <= S.top0; x++) shape.lineTo(x, S.h(x));
  shape.lineTo(S.top1, S.H); shape.lineTo(S.x1, 0); shape.lineTo(S.x0, 0);
  const hill = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: S.z1 - S.z0, bevelEnabled: false }), M("#eef6ff"));
  hill.position.z = S.z0; hg.add(hill);
  { // крижана траса
    const L = S.top0 - S.x0 + 14, tg = new THREE.PlaneGeometry(L, 3.6, Math.round(L), 1);
    tg.rotateX(-Math.PI / 2); tg.translate(S.x0 - 14 + L / 2, 0, (S.z0 + S.z1) / 2);
    const pa = tg.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, S.h(pa.getX(i)) + 0.03);
    tg.computeVertexNormals(); hg.add(new THREE.Mesh(tg, M("#a9d4f2", { emissive: "#10304a" })));
  }
  solids.push({ x0: S.x0, x1: S.x1, z0: S.z0, z1: S.z1, b: 0, t: S.H, h: (x) => S.h(x), big: true });
  S.gates.forEach((q, i) => {
    const col = M(i % 2 ? "#9d6bdb" : "#ff7a1a"), y = S.h(q.x);
    for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2), col); pole.position.set(q.x, y + 1.1, q.z + s * S.gateW); hg.add(pole); }
    const ban = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, S.gateW * 2), col); ban.position.set(q.x, y + 2.05, q.z); hg.add(ban);
  });
  // огорожа на вершині (з трьох боків), щоб не впасти зі стіни
  const rail = M("#a0703f");
  for (const [x, z, w, d] of [[S.top1 - 0.1, (S.z0 + S.z1) / 2, 0.15, S.z1 - S.z0], [(S.top0 + S.top1) / 2, S.z0 + 0.1, S.top1 - S.top0, 0.15]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, d), rail); b.position.set(x, S.H + 0.45, z); hg.add(b);
  }
  solids.push({ x0: S.top1 - 0.2, x1: S.top1, z0: S.z0, z1: S.z1, b: S.H, t: S.H + 0.9 });
  solids.push({ x0: S.top0, x1: S.top1, z0: S.z0, z1: S.z0 + 0.2, b: S.H, t: S.H + 0.9 });
  mergeStatic(hg);
  const sign = labelSprite("🏔️ Велика гірка · 18 м · нагору — лише стрибками!", "#9d6bdb"); sign.position.set(SP.x, 6, SP.z + SP.R + 4); sign.scale.multiplyScalar(0.9); scene.add(sign);
  const topSign = labelSprite("🏔️ Велика гірка", "#9d6bdb"); topSign.position.set((S.top0 + S.top1) / 2, S.H + 3.2, S.z1 - 1); scene.add(topSign);

  // Крижини спіраллю вгору: маленькі, рухомі, ліфти й ті, що зникають
  const KIND = { still: "#bfe3ff", move: "#ffd43b", lift: "#94aef3", blink: "#f08a80", rest: "#ffffff" };
  const plats = [];
  const add = (x, y, z, w, kind = "still", o = {}) => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, w), M(KIND[kind])); top.position.y = -0.225; g.add(top);
    const ice = new THREE.Mesh(new THREE.ConeGeometry(w * 0.3, 0.9, 6), M("#d9efff", { transparent: true, opacity: 0.85 })); ice.rotation.x = Math.PI; ice.position.y = -0.9; g.add(ice);
    g.position.set(x, y, z); scene.add(g);
    const s = { x0: x - w / 2, x1: x + w / 2, z0: z - w / 2, z1: z + w / 2, b: y - 0.45, t: y, dx: 0, dz: 0 };
    solids.push(s);
    const p = { g, s, x, y, z, w, kind, ...o }; plats.push(p); return p;
  };
  const aEnd = Math.PI + 0.9, step = 0.55;
  const start = add(SP.x + Math.cos(aEnd - SP.N * step) * (SP.R + 3), 0.35, SP.z + Math.sin(aEnd - SP.N * step) * (SP.R + 3), 3.5, "rest");
  let cp = null;
  for (let i = 1; i <= SP.N; i++) {
    const a = aEnd - (SP.N - i) * step, x = SP.x + Math.cos(a) * SP.R, z = SP.z + Math.sin(a) * SP.R, y = 0.35 + i * SP.rise;
    if (i === 11) { cp = add(x, y, z, 2.6, "rest"); flag(cp); continue; }
    if (i === SP.N) { add(x, S.H, z, 2.2, "rest"); continue; }
    if (i % 7 === 0) { add(x, y, z, 1.6, "lift", { amp: 0.8, per: 3, ph: i }); continue; }
    if (i % 5 === 0) { add(x, y, z, 1.6, "move", { amp: 1.4, per: 3.2, ph: i, a }); continue; }
    if (i % 4 === 0) { add(x, y, z, 1.8, "blink", { ph: i }); continue; }
    add(x, y, z, i % 3 === 0 ? 1.2 : 1.5, "still");
  }
  // місток уздовж краю вершини: з останньої крижини — на майданчик гірки
  const last = plats[plats.length - 1];
  const bx0 = S.top1 - 2.5, bx1 = last.x + last.w / 2, bz0 = S.z1 - 0.4, bz1 = last.z - last.w / 2 + 0.3;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0, 0.3, bz1 - bz0), M("#a0703f"));
  bridge.position.set((bx0 + bx1) / 2, S.H - 0.15, (bz0 + bz1) / 2); scene.add(bridge);
  solids.push({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, b: S.H - 0.3, t: S.H });

  function flag(p) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), M("#5e6372")); pole.position.set(p.w / 2 - 0.3, 1.1, 0); p.g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: "#9d6bdb", side: THREE.DoubleSide })); fl.position.set(p.w / 2 - 0.75, 1.9, 0); p.g.add(fl);
  }
  function tick(t) {
    for (const p of plats) {
      const s = p.s; let x = p.x, y = p.y, z = p.z;
      if (p.kind === "move") { const k = Math.sin((t / p.per) * Math.PI * 2 + p.ph) * p.amp; x += -Math.sin(p.a) * k; z += Math.cos(p.a) * k; }
      if (p.kind === "lift") y += Math.sin((t / p.per) * Math.PI * 2 + p.ph) * p.amp;
      if (p.kind === "blink") {
        const ph = (t + p.ph) % 3.4, on = ph < 2.2;
        p.g.visible = on || (Math.floor(t * 8) % 2 === 0 && ph < 2.6);
        s.t = on ? p.y : -99; s.b = on ? p.y - 0.45 : -100;
        continue;
      }
      s.dx = x - (s.x0 + s.x1) / 2; s.dz = z - (s.z0 + s.z1) / 2;
      s.x0 = x - p.w / 2; s.x1 = x + p.w / 2; s.z0 = z - p.w / 2; s.z1 = z + p.w / 2; s.t = y; s.b = y - 0.45;
      p.g.position.set(x, y, z);
    }
  }
  const sledSpot = { x: (S.top0 + S.top1) / 2, z: (S.z0 + S.z1) / 2, r: 4, floor: 0, label: "🏔️ Велика гірка", sub: "Натисни E — з’їхати на санчатах! (швидко й круто)" };
  const noFly = (x, z) => x > NOFLY.x0 && x < NOFLY.x1 && z > NOFLY.z0 && z < NOFLY.z1;
  // Слизький схил: пішки чи стрибками по ньому нагору не піднятися — лише крижинами
  const slope = (me) => me.on?.big && me.x < S.top0 - 0.3;
  return { tick, sledSpot, noFly, slope, cp: cp.s, cpPos: [cp.x, cp.y, cp.z], startPos: [start.x, start.y, start.z] };
}

export function buildBigRink(scene, labelSprite) {
  const R = RINK;
  const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 64), M("#cfe9fb", { emissive: "#163a55" }));
  ice.rotation.x = -Math.PI / 2; ice.scale.set(R.rx, R.rz, 1); ice.position.set(R.x, 0.02, R.z); scene.add(ice);
  // сніговий бортик
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 96), M("#ffffff"));
  rim.rotation.x = -Math.PI / 2; rim.scale.set(R.rx + 0.6, R.rz + 0.6, 30); rim.position.set(R.x, 0.15, R.z); scene.add(rim);
  const sign = labelSprite(`⛸️ Велика ковзанка: збери ${STARS} зірок за ${RINK_TIME} с — приз ${RINK_PRIZE} 🪙`, "#58b4f0");
  sign.position.set(R.x, 5, R.z - R.rz - 3); sign.scale.multiplyScalar(1.1); scene.add(sign);
  // Зірки: по еліпсах різного розміру, щоб треба було кермувати по всій ковзанці
  const starM = new THREE.MeshBasicMaterial({ color: "#ffd43b" });
  const stars = Array.from({ length: STARS }, (_, i) => {
    const k = [0.82, 0.5, 0.2][i % 3], a = i * 2.39996; // «золотий кут» — рівномірно, але вперемішку
    const x = R.x + Math.cos(a) * R.rx * k, z = R.z + Math.sin(a) * R.rz * k;
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), starM); m.position.set(x, 1.1, z); scene.add(m);
    return { x, z, m, got: false };
  });
  let run = null; // { t, off, n }
  const reset = () => { stars.forEach((s) => { s.got = false; s.m.visible = true; }); run = null; };
  function tick(dt, t, me, onIce, on) {
    stars.forEach((s, i) => { s.m.rotation.y = t * 2 + i; s.m.position.y = 1.1 + Math.sin(t * 3 + i) * 0.15; });
    if (run) {
      run.t += dt; run.off = onIce ? 0 : run.off + dt;
      if (run.off > 2) { reset(); on("lost"); return null; }
      if (run.t > RINK_TIME) { const n = run.n; reset(); on("time", n); return null; }
    }
    if (!onIce) return run;
    for (const s of stars) {
      if (s.got || Math.hypot(me.x - s.x, me.z - s.z) > 1.4) continue;
      if (!run) { run = { t: 0, off: 0, n: 0 }; on("start"); }
      s.got = true; s.m.visible = false; run.n++;
      if (run.n === STARS) { const tt = run.t; reset(); on("done", tt); return null; }
      on("star", run.n);
    }
    return run;
  }
  return { tick, onIce: (x, z) => inRink(x, z), STARS, RINK_TIME, RINK_PRIZE };
}
