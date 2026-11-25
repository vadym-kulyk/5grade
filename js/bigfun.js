// 🏔️ Велика гірка (18 м): нагору — сходинками з тилу, донизу — на санчатах.
// ⛸️ Велика ковзанка за річкою: збери 15 зірок за 90 с, не сходячи з льоду, — приз 300 🪙.
import * as THREE from "three";
import { mergeStatic } from "./merge.js";
import { sledModel } from "./winter.js";

// Гірка: спуск у бік −x (від x0 до top0 — траса, top0…top1 — майданчик, top1…x1 — підйом зі сходинками)
export const BIG = {
  x0: 60, top0: 104, top1: 112, x1: 132, z0: 30, z1: 42, H: 18, vmax: 22,
  gates: [{ x: 98, z: 33 }, { x: 90, z: 39 }, { x: 82, z: 33 }, { x: 74, z: 39 }, { x: 66, z: 33 }], gateW: 1.4,
  h(x) {
    if (x <= this.x0 || x >= this.x1) return 0;
    if (x < this.top0) return this.H * ((x - this.x0) / (this.top0 - this.x0)) ** 1.6;
    if (x <= this.top1) return this.H;
    return this.H * (this.x1 - x) / (this.x1 - this.top1);
  },
};
BIG.h = BIG.h.bind(BIG);
// Без дерев: гірка з виїздом
export const BIG_ZONE = { x0: 34, x1: 136, z0: 24, z1: 48 };
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
  solids.push({ x0: S.x0, x1: S.x1, z0: S.z0, z1: S.z1, b: 0, t: S.H, h: (x) => S.h(x) });
  S.gates.forEach((q, i) => {
    const col = M(i % 2 ? "#9d6bdb" : "#ff7a1a"), y = S.h(q.x);
    for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2), col); pole.position.set(q.x, y + 1.1, q.z + s * S.gateW); hg.add(pole); }
    const ban = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, S.gateW * 2), col); ban.position.set(q.x, y + 2.05, q.z); hg.add(ban);
  });
  // сходинки на підйомі з тилу
  const wood = M("#a0703f");
  for (let x = S.top1 + 0.25; x < S.x1; x += 0.5) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 3), wood); st.position.set(x, S.h(x) + 0.04, (S.z0 + S.z1) / 2); hg.add(st); }
  // санчата нагорі
  for (let i = 0; i < 3; i++) { const sl = sledModel(["#c8102e", "#2440c2", "#2a8c4a"][i]); sl.position.set(S.top1 - 0.8, S.H, S.z0 + 2 + i * 1.6); sl.rotation.y = Math.PI / 2; hg.add(sl); }
  mergeStatic(hg);
  const sign = labelSprite("🏔️ Велика гірка · 18 м", "#9d6bdb"); sign.position.set((S.top0 + S.top1) / 2, S.H + 3.2, S.z1 - 1); scene.add(sign);
  const sledSpot = { x: (S.top0 + S.top1) / 2, z: (S.z0 + S.z1) / 2, r: 4, floor: 0, label: "🏔️ Велика гірка", sub: "Натисни E — з’їхати на санчатах!" };
  return { sledSpot };
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
