// Блоковий 3D-персонаж і каталог речей (123 варіанти).
import * as THREE from "three";

// ---------- Каталог ----------
// price: 0 — безкоштовно; rank — потрібне звання (номер рівня, див. RANKS у game.js)
const C = (cat, id, name, price, data = {}, rank = 0) => ({ cat, id: `${cat}.${id}`, name, price, data, rank });

export const CATEGORIES = [
  { id: "skin", title: "Шкіра", icon: "✋" },
  { id: "eyes", title: "Очі", icon: "👀" },
  { id: "mouth", title: "Рот", icon: "👄" },
  { id: "hair", title: "Зачіска", icon: "💇" },
  { id: "hairColor", title: "Колір волосся", icon: "🎨" },
  { id: "top", title: "Верх", icon: "👕" },
  { id: "bottom", title: "Низ", icon: "👖" },
  { id: "shoes", title: "Взуття", icon: "👟" },
  { id: "hat", title: "Головний убір", icon: "🎩" },
  { id: "glasses", title: "Окуляри", icon: "🕶️" },
  { id: "back", title: "За спиною", icon: "🎒" },
  { id: "pet", title: "Улюбленець", icon: "🐾" },
  { id: "aura", title: "Сяйво", icon: "✨" },
];

export const ITEMS = [
  // Шкіра (8, безкоштовно)
  ...[["s1", "Світла", "#f9d9c0"], ["s2", "Персикова", "#f1c19c"], ["s3", "Пісочна", "#e0ac7e"], ["s4", "Медова", "#c98d5a"], ["s5", "Карамельна", "#a86b3d"], ["s6", "Шоколадна", "#7a4a29"], ["s7", "Темна", "#583420"], ["s8", "Зелена (прибулець)", "#9fd36b"]]
    .map(([id, n, c], i) => C("skin", id, n, i === 7 ? 500 : 0, { color: c })),
  // Очі (10)
  ...[["dot", "Крапки", 0], ["round", "Круглі", 0], ["happy", "Усміхнені", 60], ["wink", "Підморгування", 120], ["sleepy", "Сонні", 80], ["star", "Зірочки", 300], ["heart", "Сердечка", 300], ["cool", "Хитрі", 150], ["big", "Аніме", 250], ["robot", "Робот", 600]]
    .map(([id, n, p]) => C("eyes", id, n, p, { style: id })),
  // Рот (6)
  ...[["smile", "Усмішка", 0], ["grin", "Широка усмішка", 0], ["o", "Здивування", 60], ["tongue", "Язик", 120], ["cat", "Котячий", 200], ["teeth", "Зубаста усмішка", 150]]
    .map(([id, n, p]) => C("mouth", id, n, p, { style: id })),
  // Зачіски (14)
  ...[["none", "Без волосся", 0], ["short", "Коротка", 0], ["buzz", "Їжачок", 0], ["bob", "Каре", 80], ["long", "Довге", 0], ["ponytail", "Хвостик", 150], ["pigtails", "Два хвостики", 180], ["buns", "Дві гульки", 200], ["curly", "Кучері", 220], ["spiky", "Шипи", 250], ["mohawk", "Ірокез", 350], ["afro", "Афро", 300], ["side", "Чубчик набік", 120], ["braid", "Коса", 400]]
    .map(([id, n, p]) => C("hair", id, n, p, { style: id })),
  // Колір волосся (10)
  ...[["black", "Чорний", "#231c1a", 0], ["brown", "Каштановий", "#5b3a26", 0], ["blond", "Русявий", "#c9a36b", 0], ["golden", "Золотий", "#e8c25a", 100], ["red", "Рудий", "#b4502a", 100], ["gray", "Сивий", "#b9b6c2", 150], ["lime", "Лаймовий", "#99cc00", 400], ["violet", "Фіолетовий", "#9d6bdb", 400], ["pink", "Рожевий", "#f08fc0", 400], ["blue", "Блакитний", "#58b4f0", 400]]
    .map(([id, n, c, p]) => C("hairColor", id, n, p, { color: c })),
  // Верх (18)
  ...[["tee-white", "Біла футболка", "plain", "#f4f1f9", 0], ["tee-lime", "Лаймова футболка", "plain", "#99cc00", 0], ["tee-violet", "Фіолетова футболка", "plain", "#9d6bdb", 0], ["tee-yellow", "Жовта футболка", "plain", "#f7c915", 60],
    ["tee-navy", "Темно-синя футболка", "plain", "#2f3b6b", 60], ["stripes", "Тільняшка", "stripes", "#ffffff", 150], ["stripes-lime", "Смугаста лаймова", "stripes2", "#99cc00", 200], ["hoodie", "Худі", "hoodie", "#7b7f8e", 250],
    ["hoodie-violet", "Фіолетове худі", "hoodie", "#9d6bdb", 300], ["sweater", "Светр з оленями", "sweater", "#b8323a", 350], ["jacket", "Джинсова куртка", "jacket", "#4a6fa5", 400], ["vyshyvanka", "Вишиванка", "vysh", "#fbfaf5", 600],
    ["vyshyvanka-blue", "Вишиванка синя", "vyshb", "#fbfaf5", 700], ["jersey", "Форма «5»", "jersey", "#f7c915", 450], ["hero", "Костюм супергероя", "hero", "#c13f2c", 800], ["tux", "Смокінг", "tux", "#1e1b26", 900],
    ["knight", "Обладунки", "armor", "#b9bcc7", 1500, 5], ["scholar", "Мантія Майстра Мови", "robe", "#2c2240", 2500, 9]]
    .map(([id, n, pat, c, p, rk]) => C("top", id, n, p, { pattern: pat, color: c }, rk || 0)),
  // Низ (10)
  ...[["jeans", "Джинси", "#3c5a8a", 0, 0], ["black", "Чорні штани", "#2a2733", 0, 0], ["khaki", "Хакі", "#8d8a5c", 50, 0], ["shorts", "Шорти", "#3c5a8a", 80, 1], ["shorts-lime", "Лаймові шорти", "#99cc00", 120, 1],
    ["skirt", "Спідниця", "#9d6bdb", 120, 2], ["skirt-red", "Червона спідниця", "#c13f2c", 150, 2], ["sport", "Спортивні штани", "#5d6170", 100, 0], ["sharovary", "Шаровари", "#b8323a", 500, 3], ["galaxy", "Космічні штани", "#3a2a6b", 700, 4]]
    .map(([id, n, c, p, kind]) => C("bottom", id, n, p, { color: c, kind })),
  // Взуття (8)
  ...[["sneakers", "Кросівки", "#f4f1f9", 0], ["black", "Черевики", "#231c1a", 0], ["red", "Червоні кеди", "#c13f2c", 60], ["lime", "Лаймові кеди", "#99cc00", 80], ["boots", "Чоботи", "#6b4426", 150], ["gold", "Золоті кросівки", "#e8c25a", 500], ["rainbow", "Райдужні", "#ff7ab6", 400], ["chervoni", "Червоні чобітки", "#a5221c", 300]]
    .map(([id, n, c, p]) => C("shoes", id, n, p, { color: c })),
  // Головні убори (12)
  ...[["none", "Без убору", 0], ["cap", "Кепка", 100], ["beanie", "Шапка", 120], ["beret", "Берет", 150], ["headphones", "Навушники", 250], ["party", "Святковий ковпак", 200], ["bandana", "Бандана", 180],
    ["vinok", "Вінок", 600], ["kozak", "Козацька шапка", 700], ["wizard", "Капелюх чарівника", 900, 4], ["helmet", "Шолом лицаря", 1200, 5], ["crown", "Корона", 3000, 8]]
    .map(([id, n, p, rk]) => C("hat", id, n, p, { style: id }, rk || 0)),
  // Окуляри (6)
  ...[["none", "Без окулярів", 0], ["round", "Круглі", 100], ["square", "Квадратні", 100], ["sun", "Сонцезахисні", 200], ["star", "Зіркові", 350], ["monocle", "Монокль", 500]]
    .map(([id, n, p]) => C("glasses", id, n, p, { style: id })),
  // За спиною (8)
  ...[["none", "Нічого", 0], ["backpack", "Рюкзак", 150], ["cape-red", "Червоний плащ", 400], ["cape-ua", "Синьо-жовтий плащ", 600], ["guitar", "Гітара", 500], ["shield", "Щит", 800, 3], ["wings", "Крила", 1500, 5], ["jetpack", "Реактивний ранець", 2000, 6]]
    .map(([id, n, p, rk]) => C("back", id, n, p, { style: id }, rk || 0)),
  // Улюбленці (8)
  ...[["none", "Без улюбленця", 0], ["cat", "Кіт Лук’ян", 500], ["dog", "Песик", 500], ["hedgehog", "Їжачок", 600], ["owl", "Сова", 700], ["fox", "Лисичка", 800], ["bunny", "Зайчик", 600], ["dragon", "Дракончик", 2500, 7]]
    .map(([id, n, p, rk]) => C("pet", id, n, p, { style: id }, rk || 0)),
  // Сяйво (5)
  ...[["none", "Без сяйва", 0], ["lime", "Лаймові іскри", 800, 2], ["violet", "Фіолетові іскри", 800, 2], ["gold", "Золоте сяйво", 1500, 4], ["rainbow", "Райдужне сяйво", 2500, 6]]
    .map(([id, n, p, rk]) => C("aura", id, n, p, { color: { lime: "#99cc00", violet: "#9d6bdb", gold: "#f7c915", rainbow: "rainbow" }[id] }, rk || 0)),
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_AVATAR = {
  skin: "skin.s2", eyes: "eyes.round", mouth: "mouth.smile", hair: "hair.short", hairColor: "hairColor.brown",
  top: "top.tee-lime", bottom: "bottom.jeans", shoes: "shoes.sneakers", hat: "hat.none", glasses: "glasses.none",
  back: "back.none", pet: "pet.none", aura: "aura.none",
};
export const isFree = (it) => it.price === 0 && !it.rank;
export const fullAvatar = (a) => ({ ...DEFAULT_AVATAR, ...(a || {}) });

// ---------- Побудова моделі ----------
const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const at = (mesh, x, y, z) => (mesh.position.set(x, y, z), mesh);

function canvasTex(w, hgt, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = hgt;
  draw(c.getContext("2d"), w, hgt);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

function faceTexture(skin, eyes, mouth) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = skin; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#1e1b26"; g.strokeStyle = "#1e1b26"; g.lineWidth = 3; g.lineCap = "round";
    const E = (x) => {
      switch (eyes) {
        case "dot": g.fillRect(x - 3, 24, 6, 6); break;
        case "round": g.beginPath(); g.arc(x, 27, 5, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(x + 1, 24, 2, 2); g.fillStyle = "#1e1b26"; break;
        case "happy": g.beginPath(); g.arc(x, 30, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
        case "sleepy": g.beginPath(); g.moveTo(x - 5, 28); g.lineTo(x + 5, 28); g.stroke(); break;
        case "cool": g.beginPath(); g.moveTo(x - 6, 25); g.lineTo(x + 5, 28); g.stroke(); g.fillRect(x - 2, 28, 4, 3); break;
        case "big": g.beginPath(); g.ellipse(x, 27, 6, 8, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(x, 22, 3, 4); g.fillStyle = "#1e1b26"; break;
        case "star": star(g, x, 27, 7, "#f7c915"); break;
        case "heart": heart(g, x, 27, "#e2445c"); break;
        case "robot": g.fillStyle = "#58f0e0"; g.fillRect(x - 6, 23, 12, 7); g.fillStyle = "#1e1b26"; break;
        default: g.fillRect(x - 3, 24, 6, 6);
      }
    };
    if (eyes === "wink") { g.beginPath(); g.arc(20, 27, 5, 0, 7); g.fill(); g.beginPath(); g.moveTo(39, 28); g.lineTo(49, 28); g.stroke(); }
    else { E(20); E(44); }
    g.fillStyle = "rgba(230,100,110,.35)"; g.fillRect(10, 36, 8, 4); g.fillRect(46, 36, 8, 4);
    g.fillStyle = "#1e1b26";
    switch (mouth) {
      case "grin": g.beginPath(); g.arc(32, 40, 10, 0.15 * Math.PI, 0.85 * Math.PI); g.fill(); break;
      case "o": g.beginPath(); g.arc(32, 45, 4, 0, 7); g.fill(); break;
      case "tongue": g.beginPath(); g.arc(32, 41, 8, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); g.fillStyle = "#e2445c"; g.fillRect(29, 46, 7, 6); break;
      case "cat": g.beginPath(); g.moveTo(24, 44); g.quadraticCurveTo(28, 49, 32, 44); g.quadraticCurveTo(36, 49, 40, 44); g.stroke(); break;
      case "teeth": g.beginPath(); g.arc(32, 40, 10, 0.15 * Math.PI, 0.85 * Math.PI); g.fill(); g.fillStyle = "#fff"; g.fillRect(25, 43, 14, 3); break;
      default: g.beginPath(); g.arc(32, 38, 9, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
  });
}
function star(g, x, y, r, c) {
  g.save(); g.fillStyle = c; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r / 2.2 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.fill(); g.restore();
}
function heart(g, x, y, c) {
  g.save(); g.fillStyle = c; g.beginPath(); g.moveTo(x, y + 6);
  g.bezierCurveTo(x - 9, y - 1, x - 4, y - 8, x, y - 3); g.bezierCurveTo(x + 4, y - 8, x + 9, y - 1, x, y + 6); g.fill(); g.restore();
}

function topTexture(pattern, color) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = color; g.fillRect(0, 0, 64, 64);
    const red = "#b8323a", blk = "#1e1b26";
    switch (pattern) {
      case "stripes": g.fillStyle = "#2f3b6b"; for (let y = 4; y < 64; y += 10) g.fillRect(0, y, 64, 4); break;
      case "stripes2": g.fillStyle = "#1e1b26"; for (let y = 6; y < 64; y += 14) g.fillRect(0, y, 64, 6); break;
      case "hoodie": g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(16, 40, 32, 14); g.fillStyle = "#fff"; g.fillRect(26, 4, 2, 14); g.fillRect(36, 4, 2, 14); break;
      case "sweater": g.fillStyle = "#fff"; for (let x = 2; x < 64; x += 8) { g.fillRect(x, 10, 4, 4); g.fillRect(x + 4, 50, 4, 4); } g.fillRect(24, 26, 16, 10); g.fillRect(22, 22, 4, 4); g.fillRect(38, 22, 4, 4); break;
      case "jacket": g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(30, 0, 4, 64); g.fillStyle = "#f4f1f9"; g.fillRect(24, 0, 16, 10); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(8, 20, 12, 8); g.fillRect(44, 20, 12, 8); break;
      case "vysh": case "vyshb": {
        const c1 = pattern === "vysh" ? red : "#2f4fa0";
        // Вишитий комір і смуги на грудях — хрестики
        for (let x = 22; x < 42; x += 4) for (let y = 2; y < 40; y += 4) if ((x + y) % 8 === 0) { g.fillStyle = (y / 4) % 3 ? c1 : blk; g.fillRect(x, y, 3, 3); }
        g.fillStyle = c1; for (let x = 0; x < 64; x += 6) { g.fillRect(x, 56, 3, 3); g.fillRect(x + 3, 59, 3, 3); }
        break;
      }
      case "jersey": g.fillStyle = "#2f3b6b"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.fillText("5", 32, 46); g.fillRect(0, 0, 64, 5); break;
      case "hero": g.fillStyle = "#f7c915"; g.beginPath(); g.arc(32, 28, 14, 0, 7); g.fill(); star(g, 32, 28, 10, "#c13f2c"); g.fillStyle = "#2f3b6b"; g.fillRect(0, 54, 64, 10); break;
      case "tux": g.fillStyle = "#fff"; g.beginPath(); g.moveTo(22, 0); g.lineTo(32, 40); g.lineTo(42, 0); g.fill(); g.fillStyle = "#c13f2c"; g.fillRect(27, 4, 10, 5); break;
      case "armor": g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(6, 6, 52, 6); g.fillStyle = "rgba(0,0,0,.2)"; for (let y = 18; y < 64; y += 12) g.fillRect(0, y, 64, 2); g.fillStyle = "#f7c915"; g.fillRect(28, 20, 8, 24); g.fillRect(20, 28, 24, 8); break;
      case "robe": g.fillStyle = "#99cc00"; g.fillRect(0, 0, 64, 6); g.fillRect(29, 0, 6, 64); star(g, 16, 30, 6, "#f7c915"); star(g, 48, 40, 5, "#f7c915"); break;
    }
  });
}

// Будує персонажа. Повертає групу; group.userData.animate(t) — легке «дихання» і рух улюбленця
export function buildAvatar(cfg) {
  const a = fullAvatar(cfg);
  const get = (cat) => itemById[a[cat]]?.data || itemById[DEFAULT_AVATAR[cat]].data;
  const skin = get("skin").color;
  const hairC = get("hairColor").color;
  const top = get("top"), bottom = get("bottom"), shoes = get("shoes");
  const g = new THREE.Group();
  const mSkin = mat(skin), mHair = mat(hairC), mTop = mat(top.color), mBottom = mat(bottom.color), mShoes = mat(shoes.color);

  // Ноги (низ + взуття)
  const legs = new THREE.Group();
  for (const x of [-0.15, 0.15]) {
    const leg = new THREE.Group();
    const short = bottom.kind === 1;
    leg.add(at(box(0.26, short ? 0.32 : 0.62, 0.3, mBottom), 0, short ? 0.54 : 0.39, 0));
    if (short) leg.add(at(box(0.24, 0.3, 0.28, mSkin), 0, 0.23, 0));
    leg.add(at(box(0.28, 0.12, 0.36, mShoes), 0, 0.06, 0.03));
    leg.position.x = x;
    legs.add(leg);
  }
  g.add(legs);
  if (bottom.kind === 2) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.44, 0.36, 8), mBottom), 0, 0.58, 0));

  // Тулуб
  const tTex = topTexture(top.pattern, top.color);
  const mFront = new THREE.MeshLambertMaterial({ map: tTex });
  const torso = box(0.62, 0.7, 0.34, [mTop, mTop, mTop, mTop, mFront, mTop]);
  at(torso, 0, 1.05, 0);
  g.add(torso);
  if (top.pattern === "robe") g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 0.6, 8), mTop), 0, 0.5, 0));

  // Руки
  const arms = [];
  for (const x of [-0.42, 0.42]) {
    const arm = new THREE.Group();
    arm.add(at(box(0.2, 0.5, 0.24, mTop), 0, -0.22, 0));
    arm.add(at(box(0.18, 0.16, 0.22, mSkin), 0, -0.55, 0));
    arm.position.set(x, 1.38, 0);
    g.add(arm); arms.push(arm);
  }

  // Голова з обличчям
  const fTex = faceTexture(skin, get("eyes").style, get("mouth").style);
  const mFace = new THREE.MeshLambertMaterial({ map: fTex });
  const head = new THREE.Group();
  head.add(box(0.56, 0.56, 0.56, [mSkin, mSkin, mSkin, mSkin, mFace, mSkin]));
  head.position.set(0, 1.7, 0);
  g.add(head);
  addHair(head, get("hair").style, mHair);
  addHat(head, get("hat").style);
  addGlasses(head, get("glasses").style);
  addBack(g, get("back").style);
  const pet = addPet(g, get("pet").style);
  const aura = addAura(g, get("aura").color);

  g.userData = {
    arms, legs: legs.children, head,
    animate(t, moving = 0) {
      const sw = Math.sin(t * 9) * 0.6 * moving;
      legs.children[0].rotation.x = sw; legs.children[1].rotation.x = -sw;
      arms[0].rotation.x = -sw; arms[1].rotation.x = sw;
      head.position.y = 1.7 + Math.sin(t * 2) * 0.012;
      if (pet) { pet.position.y = 0.05 + Math.abs(Math.sin(t * 4)) * 0.08; pet.rotation.y = Math.sin(t) * 0.3; }
      if (aura) aura.rotation.y = t * 0.8;
    },
  };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function addHair(head, style, m) {
  const add = (w, h, d, x, y, z) => head.add(at(box(w, h, d, m), x, y, z));
  switch (style) {
    case "none": return;
    case "buzz": add(0.58, 0.1, 0.58, 0, 0.27, 0); break;
    case "short": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.08, 0.2, 0.5, -0.28, 0.16, -0.02); add(0.08, 0.2, 0.5, 0.28, 0.16, -0.02); add(0.6, 0.08, 0.1, 0, 0.24, 0.27); break;
    case "side": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.36, 0.12, 0.1, 0.12, 0.2, 0.28); break;
    case "bob": add(0.62, 0.16, 0.62, 0, 0.3, 0); add(0.62, 0.5, 0.12, 0, 0.02, -0.26); add(0.1, 0.5, 0.6, -0.3, 0.02, 0); add(0.1, 0.5, 0.6, 0.3, 0.02, 0); add(0.62, 0.1, 0.1, 0, 0.22, 0.28); break;
    case "long": add(0.62, 0.16, 0.62, 0, 0.3, 0); add(0.62, 0.9, 0.12, 0, -0.18, -0.27); add(0.1, 0.7, 0.6, -0.3, -0.08, -0.02); add(0.1, 0.7, 0.6, 0.3, -0.08, -0.02); break;
    case "ponytail": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.16, 0.5, 0.16, 0, -0.05, -0.38); break;
    case "pigtails": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.16, 0.45, 0.16, -0.38, -0.05, -0.1); add(0.16, 0.45, 0.16, 0.38, -0.05, -0.1); break;
    case "buns": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.2, 0.2, 0.2, -0.2, 0.42, -0.1); add(0.2, 0.2, 0.2, 0.2, 0.42, -0.1); break;
    case "braid": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); for (let i = 0; i < 4; i++) add(0.14 - i * 0.01, 0.16, 0.14, 0, -0.05 - i * 0.17, -0.34); break;
    case "curly": for (let x = -0.24; x <= 0.25; x += 0.16) for (let z = -0.24; z <= 0.25; z += 0.16) add(0.18, 0.18, 0.18, x, 0.33, z); add(0.62, 0.36, 0.14, 0, 0.1, -0.26); break;
    case "afro": head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), m), 0, 0.22, -0.08)); break;
    case "spiky": add(0.6, 0.12, 0.6, 0, 0.3, 0); for (const [x, z] of [[-0.18, -0.1], [0, 0.05], [0.18, -0.1], [-0.1, -0.22], [0.1, -0.22]]) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), m); head.add(at(s, x, 0.48, z)); } break;
    case "mohawk": add(0.58, 0.06, 0.58, 0, 0.28, 0); add(0.1, 0.26, 0.6, 0, 0.42, -0.02); break;
  }
}

function addHat(head, style) {
  const add = (mesh, x, y, z) => head.add(at(mesh, x, y, z));
  switch (style) {
    case "cap": add(box(0.62, 0.16, 0.62, mat("#c13f2c")), 0, 0.33, 0); add(box(0.5, 0.04, 0.3, mat("#c13f2c")), 0, 0.27, 0.42); break;
    case "beanie": add(box(0.62, 0.24, 0.62, mat("#9d6bdb")), 0, 0.34, 0); add(new THREE.Mesh(new THREE.SphereGeometry(0.09), mat("#f7c915")), 0, 0.52, 0); break;
    case "beret": { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.1, 12), mat("#c13f2c")); b.rotation.z = 0.2; add(b, 0.05, 0.33, 0); break; }
    case "headphones": add(box(0.66, 0.06, 0.14, mat("#2a2733")), 0, 0.32, 0); add(box(0.08, 0.22, 0.22, mat("#99cc00")), -0.32, 0.05, 0); add(box(0.08, 0.22, 0.22, mat("#99cc00")), 0.32, 0.05, 0); break;
    case "party": { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 12), mat("#f7c915")); c.rotation.z = -0.15; add(c, 0.04, 0.5, 0); break; }
    case "bandana": add(box(0.6, 0.12, 0.6, mat("#c13f2c")), 0, 0.24, 0); add(box(0.12, 0.12, 0.2, mat("#c13f2c")), 0, 0.2, -0.36); break;
    case "vinok": {
      const cols = ["#e2445c", "#f7c915", "#9d6bdb", "#58b4f0", "#ffffff", "#99cc00"];
      for (let i = 0; i < 12; i++) { const ang = (i / 12) * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), mat(cols[i % cols.length])), Math.cos(ang) * 0.32, 0.3, Math.sin(ang) * 0.32); }
      for (const [x, c] of [[-0.08, "#e2445c"], [0, "#f7c915"], [0.08, "#58b4f0"]]) add(box(0.05, 0.6, 0.02, mat(c)), x, -0.02, -0.34);
      break;
    }
    case "kozak": add(new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.32, 12), mat("#2a2420")), 0, 0.42, 0); { const t = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 8), mat("#b8323a")); t.rotation.z = 1.2; add(t, -0.25, 0.55, 0); } break;
    case "wizard": add(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 16), mat("#3a2a6b")), 0, 0.3, 0); add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 12), mat("#3a2a6b")), 0, 0.66, 0); add(box(0.1, 0.1, 0.02, mat("#f7c915")), 0.05, 0.55, 0.22); break;
    case "helmet": add(box(0.66, 0.66, 0.66, mat("#b9bcc7")), 0, 0.03, 0); add(box(0.5, 0.06, 0.02, mat("#1e1b26")), 0, 0.05, 0.34); add(box(0.08, 0.3, 0.3, mat("#c13f2c")), 0, 0.45, -0.05); break;
    case "crown": {
      const m = mat("#f7c915", { emissive: "#6b5300" });
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 10, 1, true), m), 0, 0.36, 0);
      for (let i = 0; i < 5; i++) { const ang = (i / 5) * Math.PI * 2; add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), m), Math.cos(ang) * 0.27, 0.5, Math.sin(ang) * 0.27); }
      add(new THREE.Mesh(new THREE.SphereGeometry(0.05), mat("#e2445c")), 0, 0.38, 0.3);
      break;
    }
  }
}

function addGlasses(head, style) {
  if (style === "none") return;
  const add = (mesh, x, y, z) => head.add(at(mesh, x, y, z));
  const z = 0.29;
  if (style === "monocle") { const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 16), mat("#e8c25a")); add(r, 0.12, 0.04, z); return; }
  const colors = { round: "#2a2733", square: "#2a2733", sun: "#1e1b26", star: "#f08fc0" };
  const m = mat(colors[style]);
  for (const x of [-0.12, 0.12]) {
    if (style === "round") add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16), m), x, 0.04, z);
    else if (style === "star") add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 5).rotateX(Math.PI / 2), m), x, 0.04, z);
    else add(box(0.18, style === "sun" ? 0.1 : 0.14, 0.03, style === "sun" ? m : mat("#2a2733", { transparent: true, opacity: 0.55 })), x, 0.04, z);
  }
  add(box(0.08, 0.02, 0.02, m), 0, 0.06, z);
}

function addBack(g, style) {
  const add = (mesh, x, y, z) => g.add(at(mesh, x, y, z));
  switch (style) {
    case "backpack": add(box(0.46, 0.5, 0.18, mat("#9d6bdb")), 0, 1.05, -0.26); add(box(0.3, 0.18, 0.06, mat("#99cc00")), 0, 0.92, -0.37); break;
    case "cape-red": case "cape-ua": {
      if (style === "cape-red") add(box(0.6, 1.2, 0.04, mat("#c13f2c")), 0, 0.8, -0.2);
      else { add(box(0.6, 0.6, 0.04, mat("#0057b7")), 0, 1.1, -0.2); add(box(0.6, 0.6, 0.04, mat("#ffd700")), 0, 0.5, -0.2); }
      break;
    }
    case "guitar": { const b = new THREE.Group(); b.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12).rotateX(Math.PI / 2), mat("#b4502a")), 0, -0.2, 0)); b.add(at(box(0.08, 0.6, 0.06, mat("#4a2e1a")), 0, 0.2, 0)); b.rotation.z = 0.6; b.position.set(0, 1.0, -0.26); g.add(b); break; }
    case "shield": add(box(0.5, 0.6, 0.06, mat("#2f4fa0")), 0, 1.05, -0.24); add(box(0.08, 0.4, 0.02, mat("#f7c915")), 0, 1.05, -0.28); add(box(0.3, 0.08, 0.02, mat("#f7c915")), 0, 1.12, -0.28); break;
    case "wings": for (const s of [-1, 1]) { const w = box(0.7, 0.5, 0.04, mat("#ffffff", { emissive: "#333" })); w.position.set(s * 0.45, 1.25, -0.24); w.rotation.z = s * 0.4; w.rotation.y = s * -0.4; g.add(w); } break;
    case "jetpack": for (const x of [-0.13, 0.13]) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10), mat("#b9bcc7")), x, 1.05, -0.28); add(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 8).rotateX(Math.PI), mat("#ff7a2e", { emissive: "#c13f2c" })), x, 0.7, -0.28); } break;
  }
}

function addPet(g, style) {
  if (style === "none") return null;
  const p = new THREE.Group();
  const add = (mesh, x, y, z) => p.add(at(mesh, x, y, z));
  const body = { cat: "#e08a3c", dog: "#c9a36b", hedgehog: "#6b4426", owl: "#8a6a4a", fox: "#e0662a", bunny: "#f4f1f9", dragon: "#99cc00" }[style];
  const m = mat(body), eye = mat("#1e1b26");
  add(box(0.34, 0.24, 0.44, m), 0, 0.2, 0);
  add(box(0.28, 0.26, 0.26, m), 0, 0.42, 0.22);
  add(box(0.05, 0.05, 0.02, eye), -0.07, 0.46, 0.36); add(box(0.05, 0.05, 0.02, eye), 0.07, 0.46, 0.36);
  for (const [x, z] of [[-0.11, 0.14], [0.11, 0.14], [-0.11, -0.14], [0.11, -0.14]]) add(box(0.08, 0.1, 0.08, m), x, 0.04, z);
  if (["cat", "fox", "dog"].includes(style)) { add(box(0.07, 0.1, 0.05, m), -0.09, 0.59, 0.2); add(box(0.07, 0.1, 0.05, m), 0.09, 0.59, 0.2); add(box(0.06, 0.06, 0.3, style === "fox" ? mat("#fff") : m), 0, 0.3, -0.32); }
  if (style === "bunny") { add(box(0.06, 0.24, 0.05, m), -0.07, 0.66, 0.2); add(box(0.06, 0.24, 0.05, m), 0.07, 0.66, 0.2); }
  if (style === "hedgehog") for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), mat("#3a2a1a")); c.rotation.x = -0.6; add(c, (i % 3 - 1) * 0.1, 0.36, -0.05 - Math.floor(i / 3) * 0.14); }
  if (style === "owl") { add(box(0.1, 0.1, 0.02, mat("#f7c915")), -0.07, 0.46, 0.36); add(box(0.1, 0.1, 0.02, mat("#f7c915")), 0.07, 0.46, 0.36); }
  if (style === "dragon") { for (const s of [-1, 1]) { const w = box(0.3, 0.02, 0.24, mat("#9d6bdb")); w.position.set(s * 0.3, 0.36, 0); w.rotation.z = s * 0.4; p.add(w); } add(box(0.08, 0.08, 0.3, m), 0, 0.22, -0.34); }
  p.position.set(0.85, 0.05, 0.25);
  p.scale.setScalar(0.9);
  g.add(p);
  return p;
}

function addAura(g, color) {
  if (!color) return null;
  const grp = new THREE.Group();
  const rainbow = ["#e2445c", "#f7c915", "#99cc00", "#58b4f0", "#9d6bdb"];
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const c = color === "rainbow" ? rainbow[i % rainbow.length] : color;
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: c }));
    s.position.set(Math.cos(ang) * 0.7, 0.3 + ((i * 7) % 18) / 10, Math.sin(ang) * 0.7);
    grp.add(s);
  }
  g.add(grp);
  return grp;
}

// ---------- Попередній перегляд у профілі / магазині ----------
export function avatarPreview(container, cfg, { size = 280, spin = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(size, size);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2e6, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(2, 4, 3); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  cam.position.set(0, 1.4, 5.2); cam.lookAt(0, 1.05, 0);
  let model = buildAvatar(cfg);
  scene.add(model);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), new THREE.MeshBasicMaterial({ color: 0x99cc00, transparent: true, opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  let rot = 0.5, drag = null, alive = true;
  renderer.domElement.addEventListener("pointerdown", (e) => (drag = e.clientX));
  addEventListener("pointerup", () => (drag = null));
  renderer.domElement.addEventListener("pointermove", (e) => { if (drag != null) { rot += (e.clientX - drag) * 0.01; drag = e.clientX; } });
  const clock = new THREE.Clock();
  (function loop() {
    if (!alive || !renderer.domElement.isConnected) { renderer.dispose(); return; }
    const t = clock.getElapsedTime();
    if (spin && drag == null) rot += 0.006;
    model.rotation.y = rot;
    model.userData.animate(t);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
  return {
    set(newCfg) { scene.remove(model); model = buildAvatar(newCfg); scene.add(model); },
    stop() { alive = false; },
  };
}
