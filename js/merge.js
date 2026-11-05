// Оптимізація 3D: зливаємо нерухомі деталі однакового кольору в один меш (менше викликів малювання — швидше на телефонах).
import * as THREE from "three";
import { mergeGeometries } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js";

const isDyn = (o, root) => { for (let p = o; p && p !== root; p = p.parent) if (p.userData.dyn) return true; return false; };
const keyOf = (m) => [m.type, m.color?.getHexString(), m.emissive?.getHexString(), m.transparent, m.opacity, m.side, m.flatShading].join("|");

export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), done = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.material.map || isDyn(o, root)) return;
    const k = keyOf(o.material);
    let g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (g.index) g = g.toNonIndexed();
    for (const a of Object.keys(g.attributes)) if (a !== "position" && a !== "normal") g.deleteAttribute(a);
    if (!buckets.has(k)) buckets.set(k, { mat: o.material, list: [] });
    buckets.get(k).list.push(g); done.push(o);
  });
  done.forEach((o) => o.parent?.remove(o));
  for (const { mat, list } of buckets.values()) {
    const g = mergeGeometries(list); if (!g) continue;
    const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; root.add(m);
  }
  return done.length;
}
