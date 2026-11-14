// Розваги 3D-школи: табла рекордів (гірка, ковзанка), бій сніжками клас на клас,
// адвент-календар біля ялинки, приручення диких звірів у лісі.
import * as THREE from "three";
import { h, toast, modal, shuffle } from "./ui.js";
import { r, set, onValue, off, update, ref, db } from "./fb.js";
import { state, owns, ownKey } from "./store.js";
import { quiz } from "./minigames.js";

export const kyivDay = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Kyiv" });
export const fmtT = (s) => s.toFixed(2).replace(".", ",") + " с";
const solved = (q) => (q.answer === "—" ? q.word.replace("_", "") : q.word.replace("_", q.answer));

// ---------- Табло: дошка на стовпчиках, текст малюємо на канві ----------
export function board(scene, x, z, ry) {
  const W = 6, H = 3.6, c = document.createElement("canvas"); c.width = 768; c.height = 460;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex })); face.position.set(0, 3.3, 0.06); g.add(face);
  const wood = new THREE.MeshLambertMaterial({ color: "#7a4f2a" });
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.1), wood); back.position.y = 3.3; g.add(back);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), wood); p.position.set(s * (W / 2 - 0.4), 0.8, 0); g.add(p); }
  function draw(title, lines) {
    const k = c.getContext("2d");
    k.fillStyle = "#1e2a44"; k.fillRect(0, 0, c.width, c.height);
    k.fillStyle = "#ffd43b"; k.font = "bold 40px Fixel Text, sans-serif"; k.textAlign = "center"; k.fillText(title, c.width / 2, 54, c.width - 30);
    k.fillStyle = "#ffffff"; k.font = "30px Fixel Text, sans-serif"; k.textAlign = "left";
    lines.forEach((l, i) => k.fillText(l, 28, 108 + i * 40, c.width - 50));
    tex.needsUpdate = true;
  }
  return { draw };
}

// ---------- Рекорди дня (гірка, ковзанка): records/{kind}/{день}/{uid} = { t, n, c } ----------
export function recordBoard(scene, kind, title, empty, x, z, ry) {
  const b = board(scene, x, z, ry), day = kyivDay(), R = r(`records/${kind}/${day}`);
  let all = {};
  const draw = () => {
    const list = Object.values(all).filter((v) => v && typeof v.t === "number").sort((a, b) => a.t - b.t);
    if (!list.length) return b.draw(title, ["Сьогодні ще ніхто не встановив рекорд.", empty]);
    const best = {}; for (const v of list) if (!(v.c in best)) best[v.c] = v.t;
    b.draw(title, [...list.slice(0, 6).map((v, i) => `${i + 1}. ${v.n}${v.c ? ` (${v.c})` : ""} — ${fmtT(v.t)}`), "",
      "Найкраще в класах: " + Object.entries(best).map(([c, t]) => `${c || "—"} ${fmtT(t)}`).join(" · ")]);
  };
  onValue(R, (s) => { all = s.val() || {}; draw(); });
  draw();
  return {
    // повертає { better, prev, place }
    async submit(t) {
      const uid = state.uid, u = state.user, prev = all[uid]?.t;
      const better = !(prev <= t);
      if (better) await set(r(`records/${kind}/${day}/${uid}`), { t: +t.toFixed(2), n: String(u.name || "").slice(0, 24), c: u.cls || "" }).catch(() => {});
      const place = 1 + Object.entries(all).filter(([id, v]) => id !== uid && v?.t < t).length;
      return { better, prev, place };
    },
    dispose: () => off(R),
  };
}

// ---------- ⛸️ Ковзанка: 4 конуси по колу озера; коло — пройти їх по черзі й повернутися до першого ----------
export function rink(scene, labelSprite, L) {
  const cps = [-60, 30, 120, 210].map((deg, i) => {
    const a = (deg * Math.PI) / 180, x = L.x + Math.cos(a) * L.rx * 0.62, z = L.z + Math.sin(a) * L.rz * 0.62;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 10), new THREE.MeshLambertMaterial({ color: "#ff7a1a", emissive: "#3a1500" }));
    cone.position.set(x, 0.55, z); scene.add(cone);
    const lab = labelSprite(i ? `⛸️ ${i + 1}` : "⛸️ Старт", i ? "#ff7a1a" : "#99cc00"); lab.position.set(x, 2.4, z); lab.scale.multiplyScalar(0.6); scene.add(lab);
    return { x, z, cone };
  });
  let lap = null; // { next, t, off }
  function tick(dt, t, me, onIce, on) {
    cps.forEach((c, i) => c.cone.scale.setScalar(i === (lap ? lap.next : 0) ? 1.25 + Math.sin(t * 6) * 0.15 : 1));
    if (lap) {
      lap.t += dt;
      lap.off = onIce ? 0 : lap.off + dt;
      if (lap.off > 2) { lap = null; on("lost"); return null; } // зійшов з льоду — коло не зараховано
    }
    const c = cps[lap ? lap.next : 0];
    if (Math.hypot(me.x - c.x, me.z - c.z) < 3.5) {
      if (!lap) { lap = { next: 1, t: 0, off: 0 }; on("start"); }
      else if (lap.next === 0) { const tt = lap.t; lap = { next: 1, t: 0, off: 0 }; on("done", tt); }
      else { lap.next = (lap.next + 1) % 4; on("cp", lap.next); }
    }
    return lap;
  }
  return { tick };
}

// ---------- ❄️ Бій сніжками: snowfight/{день}/{клас}/{uid} = скільки разів учень влучив у гравців іншого класу ----------
export function snowFight(scene, x, z, ry) {
  const b = board(scene, x, z, ry), day = kyivDay(), R = r(`snowfight/${day}`);
  let all = {};
  const totals = () => Object.entries(all).map(([c, us]) => [c, Object.values(us || {}).reduce((a, n) => a + (+n || 0), 0)]).sort((a, b) => b[1] - a[1]);
  const draw = () => {
    const t = totals();
    b.draw("❄️ Бій сніжками: клас на клас", t.length ? [...t.map(([c, n]) => `${c} — ${n} влучань`), "", "Влучай (Q) у гравців іншого класу!"] : ["Сьогодні ще ніхто не влучив.", "Кидай сніжки (Q) у гравців іншого класу —", "кожне влучання приносить очко твоєму класу!"]);
  };
  onValue(R, (s) => { all = s.val() || {}; draw(); });
  draw();
  return {
    hit() {
      const c = state.user?.cls; if (!c) return "";
      const mine = (+all[c]?.[state.uid] || 0) + 1;
      set(r(`snowfight/${day}/${c}/${state.uid}`), mine).catch(() => {});
      ((all[c] ||= {})[state.uid] = mine);
      return totals().map(([k, n]) => `${k} ${n}`).join(" : ");
    },
    dispose: () => off(R),
  };
}

// ---------- 🎁 Адвент-календар: 24 віконця грудня; users/{uid}/advent/{n} = скільки монет отримано ----------
const ADVENT_COINS = 30;
function adventToday() {
  const m = location.search.match(/[?&]adv=(\d+)/);
  if (m && location.search.includes("emu=1")) return +m[1]; // лише для тестів в емуляторі
  const [, mo, d] = kyivDay().split("-").map(Number);
  if (mo === 12) return Math.min(d, 25);
  if (mo === 1 && d <= 20) return 25; // після Святвечора ще можна відкрити пропущені віконця
  return 0;
}
export function openAdvent() {
  const today = adventToday(), got = state.user?.advent || {};
  const body = h("div.advent");
  const close = modal(body, { wide: true });
  body.append(h("h2", "🎁 Адвент-календар"),
    h("p.note", today ? `Щодня до Святвечора відкривається нове віконце. Правильна відповідь — +${ADVENT_COINS} 🪙. Пропущені віконця можна відкрити пізніше.` : `Віконця почнуть відкриватися 1 грудня — щодня по одному аж до Святвечора (24 грудня). За кожну правильну відповідь — +${ADVENT_COINS} 🪙.`),
    h("div.advent__grid", Array.from({ length: 24 }, (_, i) => {
      const n = i + 1, done = n in got, open = !done && n <= today;
      return h(`button.advent__day${done ? ".done" : ""}${open ? ".open" : ""}`, { disabled: !open, onclick: () => { close(); ask(n); } },
        h("b", n), h("span", done ? (got[n] ? "✓ +" + got[n] : "✗") : open ? "🎁" : "🔒"));
    })));
}
async function ask(n) {
  const [q] = await quiz(1);
  if (!q) return toast("Не вдалося завантажити завдання. Спробуй ще раз.", "warn");
  const body = h("div.center");
  const close = modal(body);
  const answer = async (o) => {
    const ok = o === q.answer, gain = ok ? ADVENT_COINS : 0, uid = state.uid;
    await update(ref(db), { [`users/${uid}/advent/${n}`]: gain, ...(gain ? { [`users/${uid}/coins`]: (state.user.coins || 0) + gain } : {}) });
    body.replaceChildren(h("div.mg__big", ok ? "🎉" : "🙈"), h("h2", ok ? `Правильно! +${gain} 🪙` : "Цього разу ні"),
      h("p", "Правильно: ", h("b", solved(q))), h("button.btn.btn--primary", { onclick: close }, "Далі"));
  };
  body.append(h("div.mg__big", "🎁"), h("h2", `Віконце ${n}`), h("p", "Яка буква пропущена?"), h("p.mg__q", q.word.replace(/_/g, "…")),
    h("div.row.gap.center", shuffle([...q.options]).map((o) => h("button.btn", { onclick: () => answer(o) }, o))));
}

// ---------- 🐾 Приручення: N правильних відповідей поспіль — і звір твій (з’являється в магазині як улюбленець) ----------
export const TAME = {
  "pet.elk": { n: 5, icon: "🦌", name: "Олень Велет", who: "Олень" },
  "pet.wolf": { n: 4, icon: "🐺", name: "Вовк Сірко", who: "Вовк" },
  "pet.wildfox": { n: 3, icon: "🦊", name: "Лисичка Вогник", who: "Лисичка" },
};
const cool = {};
export async function openTame(petId) {
  const T = TAME[petId];
  if (owns(petId)) return toast(`${T.icon} ${T.name} уже твій! Візьми його з собою: магазин → 🐾 Улюбленець.`, "info", 5000);
  if (cool[petId] > Date.now()) return toast(`${T.icon} ${T.who} ще насторожі. Спробуй за ${Math.ceil((cool[petId] - Date.now()) / 1000)} с.`, "warn", 3000);
  const qs = await quiz(T.n);
  if (qs.length < T.n) return toast("Не вдалося завантажити завдання. Спробуй ще раз.", "warn");
  const body = h("div.center"), close = modal(body);
  let i = 0;
  const step = () => {
    if (i === T.n) {
      update(ref(db), { [`users/${state.uid}/owned/${ownKey(petId)}`]: Date.now() }).catch(() => {});
      return body.replaceChildren(h("div.mg__big", T.icon), h("h2", `${T.name} тепер твій!`),
        h("p", "Візьми його з собою: магазин → 🐾 Улюбленець (можна до трьох улюбленців)."), h("button.btn.btn--primary", { onclick: close }, "Ура!"));
    }
    const q = qs[i];
    body.replaceChildren(h("div.mg__big", T.icon), h("p", `Щоб приручити, дай ${T.n} правильних відповідей поспіль.`), h("p.note", `Питання ${i + 1} з ${T.n} · Яка буква пропущена?`),
      h("p.mg__q", q.word.replace(/_/g, "…")),
      h("div.row.gap.center", shuffle([...q.options]).map((o) => h("button.btn", { onclick: () => (o === q.answer ? (i++, step()) : fail(q)) }, o))));
  };
  const fail = (q) => {
    cool[petId] = Date.now() + 60000;
    body.replaceChildren(h("div.mg__big", "💨"), h("h2", `${T.who} утік у ліс`), h("p", "Правильно: ", h("b", solved(q))), h("p.note", "Спробуй ще раз за хвилину."), h("button.btn", { onclick: close }, "Гаразд"));
  };
  step();
}

// Купка подарунків біля ялинки (тут адвент-календар)
export function giftPile(scene, labelSprite, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  [[0, 0, 0.9, "#d9342b"], [0.9, 0.2, 0.7, "#2440c2"], [-0.8, 0.3, 0.6, "#2a8c4a"], [0.2, -0.8, 0.55, "#f08fc0"], [0.1, 0.1, 0.5, "#f7c915"]].forEach(([dx, dz, s, c], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: c })); b.position.set(dx, s / 2 + (i === 4 ? 0.9 : 0), dz); b.rotation.y = i * 0.7; g.add(b);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 1.02, s * 0.18), new THREE.MeshLambertMaterial({ color: "#ffd43b" })); rib.position.copy(b.position); rib.rotation.y = b.rotation.y; g.add(rib);
  });
  const lab = labelSprite("🎁 Адвент-календар", "#d9342b"); lab.position.set(0, 3, 0); lab.scale.multiplyScalar(0.8); g.add(lab);
}
