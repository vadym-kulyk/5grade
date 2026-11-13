// ❄️ Зима в 3D-школі: сніг падає, велика ялинка, сніговики, олені, сани Санти в небі, ялинка в холі.
// Також сніжки: летять дугою, розбиваються об землю; хто влучив — дізнається.
import * as THREE from "three";
import { buildAvatar, buildSleigh, petModel } from "./avatar.js";

export function buildWinter(scene, solids, labelSprite) {
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const anim = [];
  // Сніг довкола камери
  const N = 1800, area = 70, hgt = 30;
  const pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * area; pos[i * 3 + 1] = Math.random() * hgt; pos[i * 3 + 2] = (Math.random() - 0.5) * area; spd[i] = 1.2 + Math.random() * 1.6; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const flake = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const snow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.35, map: flake, transparent: true, depthWrite: false }));
  snow.frustumCulled = false; scene.add(snow);

  // Велика ялинка біля площі
  const TX = -16, TZ = 60;
  const tree = new THREE.Group(); tree.position.set(TX, 0, TZ); scene.add(tree);
  { const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2), M("#6b4426")); trunk.position.y = 1; tree.add(trunk); }
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(4.6 - i * 0.8, 3.4, 10), M(i % 2 ? "#2a7a45" : "#256c3d")); c.position.y = 2.6 + i * 2.1; tree.add(c); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshBasicMaterial({ color: "#ffd43b" })); star.position.y = 13.6; tree.add(star);
  const bulbs = [];
  for (let i = 0; i < 70; i++) {
    const lvl = Math.random(), y = 2 + lvl * 10, r = (1 - lvl) * 4.2 + 0.4, a = Math.random() * Math.PI * 2;
    const m = new THREE.MeshBasicMaterial({ color: ["#d9342b", "#ffd43b", "#58b4f0", "#f08fc0", "#2a8c4a"][i % 5] });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), m); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); tree.add(b); bulbs.push(m);
  }
  solids.push({ x0: TX - 2, x1: TX + 2, z0: TZ - 2, z1: TZ + 2, b: 0, t: 99 });
  const tl = labelSprite("🎄 З Різдвом і Новим роком!", "#d9342b"); tl.position.set(TX, 16, TZ); tl.scale.multiplyScalar(1.4); scene.add(tl);
  anim.push((t) => { star.rotation.y = t; bulbs.forEach((m, i) => m.color.setHSL(((i * 0.13 + t * 0.15) % 1), 0.85, 0.55 + 0.15 * Math.sin(t * 3 + i))); });

  // Сніговики
  const snowman = (x, z, s = 1) => {
    const g = new THREE.Group(); const w = M("#fbfdff");
    for (const [y, r] of [[0.7, 0.75], [1.75, 0.55], [2.6, 0.4]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), w); b.position.y = y; g.add(b); }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 8), M("#ff7a1a")); nose.rotation.x = Math.PI / 2; nose.position.set(0, 2.6, 0.45); g.add(nose);
    for (const x of [-0.14, 0.14]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05), M("#23262d")); e.position.set(x, 2.72, 0.35); g.add(e); }
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), M("#23262d")); hat.position.y = 3.15; g.add(hat);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 16), M("#d9342b")); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.25; g.add(scarf);
    g.scale.setScalar(s); g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; scene.add(g);
    solids.push({ x0: x - 0.7 * s, x1: x + 0.7 * s, z0: z - 0.7 * s, z1: z + 0.7 * s, b: 0, t: 3.3 * s });
  };
  for (const [x, z] of [[10, 46], [-8, 70], [20, 64], [-40, 44], [30, 100], [-60, 80], [40, 40]]) snowman(x, z);

  // Олені біля ялинки
  for (const [x, z, r] of [[-22, 52, 0.6], [-10, 50, -0.8], [-25, 66, 2.2]]) { const d = petModel(Math.random() < 0.3 ? "rudolf" : "reindeer", 2.4); d.position.set(x, 0, z); d.rotation.y = r; scene.add(d); }

  // Сани Санти з оленями в небі
  const santa = buildAvatar({ hat: "hat.santa", top: "top.santa", bottom: "bottom.santa-pants", shoes: "shoes.santa-boots", facedeco: "facedeco.beard" });
  const rig = buildSleigh(); rig.position.set(0, 0.02, 0.2); santa.add(rig);
  for (const leg of santa.userData.legs) { leg.rotation.x = -1.4; leg.position.y = 0.5; leg.position.z = 0.6; }
  santa.userData.arms.forEach((a) => (a.rotation.x = -1));
  santa.scale.setScalar(2.2); scene.add(santa);
  anim.push((t) => {
    const a = t * 0.12, R = 110;
    santa.position.set(Math.cos(a) * R, 42 + Math.sin(t * 0.7) * 3, Math.sin(a) * R);
    santa.rotation.y = -a; // летить по колу
    rig.userData.deer.forEach((d, k) => (d.position.y = 0.1 + Math.sin(t * 6 + k) * 0.12));
  });

  function tick(t, dt, cam) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] -= spd[i] * dt; p[i * 3] += Math.sin(t + i) * dt * 0.3;
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] += hgt;
    }
    geo.attributes.position.needsUpdate = true;
    snow.position.set(Math.round(cam.position.x / 10) * 10, Math.max(0, cam.position.y - hgt / 2), Math.round(cam.position.z / 10) * 10);
    for (const f of anim) f(t);
  }
  return { tick };
}

// Ялинка в холі школи
export function hallTree(scene, solids, x = 8, z = -9) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.4, 1.5, 10), new THREE.MeshLambertMaterial({ color: "#2a7a45" })); c.position.y = 1 + i * 0.9; g.add(c); }
  const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: "#ffd43b" })); st.position.y = 3.6; g.add(st);
  for (let i = 0; i < 18; i++) { const a = i * 2.1, l = (i % 6) / 6, b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshBasicMaterial({ color: ["#d9342b", "#ffd43b", "#58b4f0"][i % 3] })); b.position.set(Math.cos(a) * (1.4 - l * 1.1), 0.6 + l * 2.6, Math.sin(a) * (1.4 - l * 1.1)); g.add(b); }
  solids.push({ x0: x - 1.4, x1: x + 1.4, z0: z - 1.4, z1: z + 1.4, b: 0, t: 99 });
}

// ---------- Сніжки ----------
export function snowballs(scene) {
  const list = [], splats = [];
  const geo = new THREE.SphereGeometry(0.18, 10, 8), mat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
  const splatGeo = new THREE.SphereGeometry(0.08, 6, 4);
  function spawn(owner, x, y, z, ry) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x + Math.sin(ry) * 0.6, y, z + Math.cos(ry) * 0.6); scene.add(m);
    list.push({ m, owner, vx: Math.sin(ry) * 17, vz: Math.cos(ry) * 17, vy: 2.4, life: 1.6 });
  }
  function burst(x, y, z) {
    for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(splatGeo, mat); s.position.set(x, y, z); scene.add(s); splats.push({ s, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, life: 0.6 }); }
  }
  // hitTest(x, y, z, owner) → true, якщо сніжка в когось влучила (тоді вона зникає)
  function tick(dt, groundAt, hitTest) {
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i], p = b.m.position;
      b.vy -= 9 * dt; p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.life -= dt;
      const hit = hitTest(p.x, p.y, p.z, b.owner);
      if (hit || p.y <= groundAt(p.x, p.z, p.y) || b.life <= 0) { burst(p.x, p.y, p.z); scene.remove(b.m); list.splice(i, 1); }
    }
    for (let i = splats.length - 1; i >= 0; i--) {
      const q = splats[i]; q.vy -= 9 * dt; q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt; q.s.position.z += q.vz * dt; q.life -= dt;
      if (q.life <= 0) { scene.remove(q.s); splats.splice(i, 1); }
    }
  }
  return { spawn, tick };
}
