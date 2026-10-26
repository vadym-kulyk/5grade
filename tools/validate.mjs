// Перевірка тем: node tools/validate.mjs
import { TOPICS } from "../content/index.js";
import { MONITORING, MON_EXTRA } from "../content/monitoring/index.js";
import fs from "node:fs";
let bad = 0;
const err = (t, m) => { bad++; console.log(`✗ [${t}] ${m}`); };
// Перевірка одного завдання
function checkTask(T, w, t) {
    if (!t.explain) err(w, "немає пояснення");
    if (!T.rules[t.rule]) err(w, `невідоме правило ${t.rule}`);
    const opts = [...(t.options || []), ...(t.pairs || []).flat(), ...(t.items || []).map((x) => (Array.isArray(x) ? x[0] : x))];
    if (opts.some((o) => /\? ні|— ні[,.;!: ]|— ні$|(^|\s)ні!/.test(String(o)))) err(w, "підозрілий коментар у варіанті: " + opts.find((o) => /\? ні|— ні[,.;!: ]|— ні$|(^|\s)ні!/.test(String(o))));
    if (/(^|\s)ні!|стоп:|— ні!/.test(t.explain || "")) err(w, "сумнівне пояснення");
    if (/\? ні|(^|\s)ні —|стоп:/.test((t.text || "") + " " + (t.q || "") + " " + (t.word || ""))) err(w, "сумнівний текст завдання");
    switch (t.type) {
      case "choice": if (!(t.answer >= 0 && t.answer < t.options.length)) err(w, "answer поза варіантами"); if (new Set(t.options).size !== t.options.length) err(w, "однакові варіанти"); break;
      case "multi": if (!t.answer.every((a) => a >= 0 && a < t.options.length) || !t.answer.length) err(w, "multi answer"); break;
      case "tf": if (typeof t.answer !== "boolean") err(w, "tf answer"); break;
      case "gap": if (!t.word.includes("_") || !t.options.includes(t.answer)) err(w, "gap"); break;
      case "input": if (!Array.isArray(t.answer) || !t.answer.length) err(w, "input answer"); break;
      case "match": if (new Set([...t.pairs.map((p) => p[1]), ...(t.extra || [])]).size !== t.pairs.length + (t.extra || []).length) err(w, "match: однакові праві частини або пастки"); break;
      case "sort": if (!t.items.every(([, g]) => g >= 0 && g < t.groups.length)) err(w, "sort group"); break;
      case "pick": if (!t.text.includes("*")) err(w, "pick без *"); break;
      case "order": if (!t.items?.length) err(w, "order"); break;
      default: err(w, `невідомий тип ${t.type}`);
    }
}

for (const meta of TOPICS.filter((t) => t.ready)) {
  const T = (await import(`../content/topics/${meta.id}.js`)).default;
  const ids = new Set();
  if (T.id !== meta.id) err(meta.id, "id не збігається");
  if (T.levels.length !== 5) err(meta.id, `рівнів ${T.levels.length}`);
  const blocks = new Set(T.theory.map((b) => b.id));
  for (const [k, r] of Object.entries(T.rules)) if (!blocks.has(r.block)) err(meta.id, `правило ${k} → немає блоку ${r.block}`);
  T.levels.forEach((L, li) => {
    if (L.tasks.length !== 10) err(meta.id, `рівень ${li + 1}: завдань ${L.tasks.length}`);
    for (const t of L.tasks) {
      const w = `${meta.id}/${t.id}`;
      if (ids.has(t.id)) err(w, "повтор id"); ids.add(t.id);
      checkTask(T, w, t);
    }
  });
  const types = {};
  T.levels.flatMap((L) => L.tasks).forEach((t) => (types[t.type] = (types[t.type] || 0) + 1));
  console.log(`✓ ${meta.id}: ${ids.size} завдань`, JSON.stringify(types));
  // Моніторингова робота теми
  const monFile = new URL(`../content/monitoring/${meta.id}.js`, import.meta.url);
  if (fs.existsSync(monFile)) {
    if (!MONITORING.includes(meta.id)) console.log(`  ⚠ ${meta.id}: моніторингова є, але не додана в content/monitoring/index.js`);
    const M = (await import(`../content/monitoring/${meta.id}.js`)).default;
    if (M.tasks.length < 15) err(meta.id, `моніторингова: лише ${M.tasks.length} завдань`);
    for (const t of M.tasks) { const w = `${meta.id}/мон/${t.id}`; if (ids.has(t.id)) err(w, "повтор id"); ids.add(t.id); checkTask(T, w, t); }
    console.log(`  📋 моніторингова: ${M.tasks.length} завдань`);
  }
  for (const x of MON_EXTRA.filter((x) => x.topic === meta.id)) {
    const M = (await import(`../content/monitoring/${x.id}.js`)).default;
    if (M.tasks.length < 15) err(meta.id, `моніторингова, варіант ${x.n}: лише ${M.tasks.length} завдань`);
    for (const t of M.tasks) { const w = `${meta.id}/мон${x.n}/${t.id}`; if (ids.has(t.id)) err(w, "повтор id"); ids.add(t.id); checkTask(T, w, t); }
    console.log(`  📋 моніторингова, варіант ${x.n}: ${M.tasks.length} завдань`);
  }
}
process.exit(bad ? 1 : 0);
