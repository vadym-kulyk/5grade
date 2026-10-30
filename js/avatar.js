// Блоковий 3D-персонаж і каталог речей.
import * as THREE from "three";

// ---------- Каталог ----------
// price: 0 — безкоштовно; rank — потрібне звання (номер рівня, див. RANKS у game.js)
const C = (cat, id, name, price, data = {}, rank = 0) => ({ cat, id: `${cat}.${id}`, name, price, data, rank });

export const CATEGORIES = [
  { id: "skin", title: "Шкіра", icon: "✋" },
  { id: "eyes", title: "Очі", icon: "👀" },
  { id: "eyeColor", title: "Колір очей", icon: "🔵" },
  { id: "lashes", title: "Вії", icon: "👁️" },
  { id: "brows", title: "Брови", icon: "〰️" },
  { id: "mouth", title: "Рот", icon: "👄" },
  { id: "lips", title: "Губи", icon: "💋" },
  { id: "facedeco", title: "Прикраси обличчя", icon: "🌟" },
  { id: "hair", title: "Зачіска", icon: "💇" },
  { id: "hairColor", title: "Колір волосся", icon: "🎨" },
  { id: "hairAcc", title: "Для волосся", icon: "🎀" },
  { id: "earrings", title: "Сережки", icon: "💎" },
  { id: "neck", title: "Намиста й шарфи", icon: "📿" },
  { id: "top", title: "Верх", icon: "👕" },
  { id: "bottom", title: "Низ", icon: "👖" },
  { id: "tights", title: "Колготи", icon: "🧦" },
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
  // ---------- Обличчя ----------
  ...[["black", "Чорні", "#1e1b26", 0], ["brown", "Карі", "#5b3a26", 0], ["blue", "Блакитні", "#2f7fc4", 80], ["green", "Зелені", "#3f8f3a", 80], ["gray", "Сірі", "#6f7787", 60], ["hazel", "Горіхові", "#8a6a2a", 60], ["amber", "Бурштинові", "#c98a1a", 150], ["violet", "Фіалкові", "#7d4fc4", 200]]
    .map(([id, n, c, p]) => C("eyeColor", id, n, p, { color: c })),
  ...[["none", "Без вій", 0], ["short", "Короткі", 0], ["long", "Довгі", 60], ["fluffy", "Пухнасті", 150], ["doll", "Лялькові", 250], ["color", "Фіолетові", 300]]
    .map(([id, n, p]) => C("lashes", id, n, p, { style: id })),
  ...[["natural", "Звичайні", 0], ["thin", "Тонкі", 0], ["thick", "Густі", 60], ["arched", "Дугою", 80], ["raised", "Здивовані", 100], ["angry", "Насуплені", 100]]
    .map(([id, n, p]) => C("brows", id, n, p, { style: id })),
  ...[["natural", "Природні", "", 0], ["pink", "Рожеві", "#e86a9a", 60], ["coral", "Коралові", "#f0735a", 80], ["berry", "Ягідні", "#9b1d5a", 120], ["red", "Червоні", "#c8102e", 150], ["gloss", "З блиском", "#f08fc0", 250]]
    .map(([id, n, c, p]) => C("lips", id, n, p, { color: c, gloss: id === "gloss" })),
  ...[["blush", "Рум’янець", 0], ["none", "Без прикрас", 0], ["freckles", "Веснянки", 0], ["blush2", "Яскравий рум’янець", 60], ["heart", "Наліпка-сердечко", 150], ["star", "Наліпка-зірочка", 150], ["whiskers", "Котячі вусики", 200], ["sparkle", "Блискітки", 250], ["flag", "Прапорець на щоці", 300], ["rainbow", "Веселка", 350]]
    .map(([id, n, p]) => C("facedeco", id, n, p, { style: id })),
  // ---------- Прикраси ----------
  ...[["none", "Нічого", 0], ["bow-pink", "Рожевий бантик", 80], ["bow-red", "Червоний бантик", 80], ["bow-violet", "Фіолетовий бант", 120], ["headband", "Обідок", 100], ["clips", "Заколки-зірочки", 150], ["flower", "Квітка за вухом", 150], ["flowerband", "Обідок із квіточками", 200], ["catears", "Котячі вушка", 250], ["bunnyears", "Заячі вушка", 250], ["ribbons", "Стрічки-кісники", 300], ["tiara", "Діадема", 900, 4], ["unicorn", "Ріжок єдинорога", 1200, 5]]
    .map(([id, n, p, rk]) => C("hairAcc", id, n, p, { style: id }, rk || 0)),
  ...[["none", "Без сережок", 0], ["studs", "Гвоздики", 80], ["hoops", "Кільця", 150], ["pearls", "Перлинки", 200], ["stars", "Зірочки", 200], ["hearts", "Сердечка", 200], ["cherries", "Вишеньки", 250]]
    .map(([id, n, p]) => C("earrings", id, n, p, { style: id })),
  ...[["none", "Нічого", 0], ["choker", "Чокер", 100], ["bowtie", "Метелик", 120], ["scarf", "Шарф", 150], ["pendant", "Кулон-сердечко", 200], ["korali", "Коралі", 400], ["pearls", "Намисто з перлів", 500], ["medal", "Медаль", 600, 3]]
    .map(([id, n, p, rk]) => C("neck", id, n, p, { style: id }, rk || 0)),
  // ---------- Нове в наявних розділах ----------
  ...[["twobraids", "Дві коси", 200], ["highpony", "Високий хвіст", 150], ["wavy", "Довге хвилясте", 180], ["bangs", "Довге з чубчиком", 150], ["sidepony", "Хвіст набік", 150], ["crownbraid", "Коса-корона", 350]]
    .map(([id, n, p]) => C("hair", id, n, p, { style: id })),
  ...[["platinum", "Платиновий", "#efe6d2", 150], ["rose", "Рожеве золото", "#e8a598", 250], ["cherry", "Вишневий", "#9b1d3a", 300], ["mint", "М’ятний", "#8fe3c8", 400], ["lavender", "Лавандовий", "#c3a6ef", 400]]
    .map(([id, n, c, p]) => C("hairColor", id, n, p, { color: c })),
  ...[["frill", "Кофтинка з рюшами", "frill", "#fbe3ef", 250], ["heart-sweater", "Светр із сердечком", "heart", "#c3a6ef", 300], ["cardigan", "Кардиган", "cardigan", "#f7c915", 300],
    ["dress-dots", "Сукня в горошок", "dots", "#e2445c", 400, 0, 1], ["dress-summer", "Літня сукня", "flowers", "#8fd3f0", 450, 0, 1], ["dress-vysh", "Вишита сукня", "vysh", "#fbfaf5", 900, 0, 1], ["dress-princess", "Сукня принцеси", "princess", "#f08fc0", 1500, 4, 2]]
    .map(([id, n, pat, c, p, rk, dress]) => C("top", id, n, p, { pattern: pat, color: c, dress: dress || 0 }, rk || 0)),
  ...[["leggings", "Рожеві легінси", "#f08fc0", 100, 0], ["denim-skirt", "Джинсова спідниця", "#4a6fa5", 150, 2], ["plaid", "Спідниця в клітинку", "#b8323a", 180, 2], ["tutu", "Спідниця-пачка", "#f6a5c8", 300, 3]]
    .map(([id, n, c, p, kind]) => C("bottom", id, n, p, { color: c, kind })),
  ...[["pink", "Рожеві кеди", "#f6a5c8", 80], ["mint", "М’ятні кеди", "#8fe3c8", 80], ["ballet", "Балетки", "#e8a598", 120], ["violet", "Фіолетові чобітки", "#9d6bdb", 200], ["silver", "Срібні черевички", "#d9d9e6", 250]]
    .map(([id, n, c, p]) => C("shoes", id, n, p, { color: c })),
  ...[["cateye", "Котячі", 250], ["heart", "Сердечка", 300]].map(([id, n, p]) => C("glasses", id, n, p, { style: id })),
  ...[["bag", "Сумочка", 200], ["unicorn-bag", "Рюкзак-єдиноріг", 450], ["butterfly", "Крила метелика", 900, 3]]
    .map(([id, n, p, rk]) => C("back", id, n, p, { style: id }, rk || 0)),
  ...[["hamster", "Хом’ячок", 400], ["panda", "Панда", 700], ["unicorn", "Єдиноріг", 1500, 5]]
    .map(([id, n, p, rk]) => C("pet", id, n, p, { style: id }, rk || 0)),
  // ---------- Яскраве: принти, неон, пухнасті спідниці ----------
  ...[["neon-pink", "Ядерно-рожева футболка", "plain", "#ff1fa9", 100], ["neon-lime", "Ядерно-лаймова футболка", "plain", "#b6ff1a", 100],
    ["pr-skull", "Футболка з черепом", "skull", "#1e1b26", 250], ["pr-skull-pink", "Рожева з черепом", "skull", "#ff1fa9", 300], ["pr-lime-bolt", "Лаймова з блискавкою", "bolt", "#99cc00", 250],
    ["pr-star", "Футболка із зіркою", "bigstar", "#2f3b6b", 200], ["pr-cat", "Футболка з котиком", "cat", "#f4f1f9", 250], ["pr-smile", "Футболка зі смайлом", "smile", "#f7c915", 200],
    ["pr-heart-neon", "Неонове серце", "heart", "#1e1b26", 300], ["pr-ua", "Футболка «Україна»", "ua", "#f4f1f9", 300], ["pr-rainbow", "Райдужна футболка", "rainbow", "#f4f1f9", 350], ["pr-leopard", "Леопардова", "leopard", "#e8b47a", 400]]
    .map(([id, n, pat, c, p]) => C("top", id, n, p, { pattern: pat, color: c })),
  ...[["fluffy-pink", "Пухнаста яскраво-рожева спідниця", "#ff1fa9", 350, 5], ["fluffy-lime", "Пухнаста лаймова спідниця", "#b6ff1a", 350, 5], ["fluffy-violet", "Пухнаста фіолетова спідниця", "#9d6bdb", 350, 5],
    ["hot-denim", "Короткі джинсові шорти", "#4a6fa5", 120, 6], ["hot-pink", "Короткі рожеві шорти", "#ff1fa9", 150, 6], ["hot-black", "Короткі чорні шорти", "#1e1b26", 120, 6],
    ["skull-shorts", "Короткі шорти з черепом", "#1e1b26", 300, 6, "skull"], ["skull-shorts-pink", "Рожеві шорти з черепом", "#ff1fa9", 350, 6, "skull"]]
    .map(([id, n, c, p, kind, print]) => C("bottom", id, n, p, { color: c, kind, print })),
  ...[["none", "Без колгот", 0, "", ""], ["neon-stripes", "Ядерно-рожеві в смужку", 150, "#ff1fa9", "#1e1b26"], ["pink-white", "Рожево-білі в смужку", 150, "#ff1fa9", "#ffffff"],
    ["neon", "Ядерно-рожеві", 100, "#ff1fa9", ""], ["bw", "Чорно-білі в смужку", 120, "#1e1b26", "#ffffff"], ["lime-stripes", "Лаймові в смужку", 150, "#b6ff1a", "#1e1b26"],
    ["rainbow", "Райдужні", 300, "rainbow", ""], ["black", "Чорні", 0, "#1e1b26", ""], ["white", "Білі", 0, "#f4f1f9", ""], ["fishnet", "Сіточка", 250, "fishnet", ""]]
    .map(([id, n, p, c, c2]) => C("tights", id, n, p, { color: c, stripe: c2 })),
  ...[["mega", "Довжелезні", 300], ["mega-color", "Довжелезні рожеві", 400]].map(([id, n, p]) => C("lashes", id, n, p, { style: id })),
  ...[["huge", "Величезні губи", "#ff2b8a", 300], ["huge-red", "Величезні червоні губи", "#d1102e", 300], ["huge-neon", "Величезні ядерно-рожеві", "#ff1fa9", 400]]
    .map(([id, n, c, p]) => C("lips", id, n, p, { color: c, big: true, gloss: true })),
  // ---------- 🎃 Геловін (позначка hw — окрема вкладка в магазині) ----------
  ...[
    C("skin", "zombie", "Зомбі", 400, { color: "#9db58f" }), C("skin", "ghost", "Блідий привид", 300, { color: "#eef0f6" }),
    C("eyes", "glow", "Сяючі гарбузові очі", 250, { style: "glow" }), C("mouth", "fangs", "Ікла вампіра", 200, { style: "fangs" }),
    C("facedeco", "skull", "Грим черепа", 300, { style: "skull" }), C("facedeco", "web", "Павутинка на щоці", 150, { style: "web" }), C("facedeco", "scar", "Шрам Франкенштейна", 200, { style: "scar" }),
    C("hat", "pumpkin-head", "Гарбузова голова", 700, { style: "pumpkin-head" }), C("hat", "witch", "Капелюх відьми", 450, { style: "witch" }), C("hat", "pumpkin", "Гарбузик на голові", 250, { style: "pumpkin" }),
    C("hairAcc", "horns", "Ріжки чортика", 200, { style: "horns" }), C("hairAcc", "bat-band", "Обідок із кажанчиком", 180, { style: "bat-band" }),
    C("top", "skeleton", "Костюм скелета", 500, { pattern: "skeleton", color: "#1e1b26" }), C("top", "jack-tee", "Футболка з гарбузом", 200, { pattern: "jack", color: "#1e1b26" }),
    C("top", "vampire", "Костюм вампіра", 550, { pattern: "vampire", color: "#1e1b26" }), C("top", "mummy", "Костюм мумії", 450, { pattern: "mummy", color: "#e8dcc0" }),
    C("top", "web-tee", "Футболка з павутиною", 220, { pattern: "web", color: "#4a2a6b" }), C("top", "witch-dress", "Сукня відьми", 700, { pattern: "witch", color: "#3a2a6b", dress: 2 }),
    C("bottom", "pumpkin-skirt", "Гарбузова пухнаста спідниця", 350, { color: "#ff7a1a", kind: 5 }), C("bottom", "bone-shorts", "Шорти з кісточками", 250, { color: "#1e1b26", kind: 6, print: "skull" }),
    C("tights", "hw-stripes", "Гарбузові в смужку", 150, { color: "#ff7a1a", stripe: "#1e1b26" }), C("tights", "violet-black", "Фіолетово-чорні в смужку", 150, { color: "#7d4fc4", stripe: "#1e1b26" }),
    C("shoes", "witch-boots", "Черевики відьми", 200, { color: "#3a2a6b" }),
    C("back", "vampire-cape", "Плащ вампіра", 600, { style: "vampire-cape" }), C("back", "bat-wings", "Крила кажана", 900, { style: "bat-wings" }), C("back", "broom", "Мітла відьми", 650, { style: "broom" }),
    C("pet", "blackcat", "Чорний кіт", 600, { style: "blackcat" }), C("pet", "bat", "Кажанчик", 700, { style: "bat" }), C("pet", "ghost", "Привидик", 800, { style: "ghost" }), C("pet", "pumpkin", "Гарбузик-джек", 600, { style: "pumpkin" }),
    C("aura", "halloween", "Моторошне сяйво", 1200, { color: "halloween" }),
  ].map((it) => ({ ...it, hw: true })),
];
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_AVATAR = {
  skin: "skin.s2", eyes: "eyes.round", mouth: "mouth.smile", hair: "hair.short", hairColor: "hairColor.brown",
  top: "top.tee-lime", bottom: "bottom.jeans", shoes: "shoes.sneakers", hat: "hat.none", glasses: "glasses.none",
  back: "back.none", pet: "pet.none", aura: "aura.none",
  eyeColor: "eyeColor.black", lashes: "lashes.none", brows: "brows.natural", lips: "lips.natural", facedeco: "facedeco.blush",
  hairAcc: "hairAcc.none", earrings: "earrings.none", neck: "neck.none", tights: "tights.none",
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

function faceTexture(skin, eyes, mouth, f = {}) {
  return canvasTex(128, 128, (g) => {
    g.scale(2, 2); // малюємо в координатах 64×64, але з удвічі більшою деталізацією
    g.fillStyle = skin; g.fillRect(0, 0, 64, 64);
    const iris = f.iris || "#1e1b26", lip = f.lips || "#1e1b26";
    drawDeco(g, f.deco || "blush");
    drawBrows(g, f.brows || "natural", f.browColor || "#3a2a20");
    g.fillStyle = iris; g.strokeStyle = "#1e1b26"; g.lineWidth = 3; g.lineCap = "round";
    const E = (x) => {
      switch (eyes) {
        case "dot": g.fillRect(x - 3, 24, 6, 6); break;
        case "round": g.beginPath(); g.arc(x, 27, 5, 0, 7); g.fill(); g.fillStyle = "#1e1b26"; g.beginPath(); g.arc(x, 27, 2.2, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(x + 1, 24, 2, 2); g.fillStyle = iris; break;
        case "happy": g.beginPath(); g.arc(x, 30, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
        case "sleepy": g.beginPath(); g.moveTo(x - 5, 28); g.lineTo(x + 5, 28); g.stroke(); break;
        case "cool": g.beginPath(); g.moveTo(x - 6, 25); g.lineTo(x + 5, 28); g.stroke(); g.fillRect(x - 2, 28, 4, 3); break;
        case "big": g.beginPath(); g.ellipse(x, 27, 6, 8, 0, 0, 7); g.fill(); g.fillStyle = "#1e1b26"; g.beginPath(); g.ellipse(x, 28, 3, 4, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(x, 22, 3, 4); g.fillStyle = iris; break;
        case "star": star(g, x, 27, 7, "#f7c915"); break;
        case "heart": heart(g, x, 27, "#e2445c"); break;
        case "robot": g.fillStyle = "#58f0e0"; g.fillRect(x - 6, 23, 12, 7); g.fillStyle = iris; break;
        case "glow": g.fillStyle = "#ff7a1a"; g.beginPath(); g.moveTo(x - 6, 31); g.lineTo(x, 21); g.lineTo(x + 6, 31); g.closePath(); g.fill(); g.fillStyle = "#ffd54a"; g.beginPath(); g.arc(x, 28, 1.8, 0, 7); g.fill(); g.fillStyle = iris; break;
        default: g.fillRect(x - 3, 24, 6, 6);
      }
    };
    if (eyes === "wink") { g.beginPath(); g.arc(20, 27, 5, 0, 7); g.fill(); g.beginPath(); g.moveTo(39, 28); g.lineTo(49, 28); g.stroke(); }
    else { E(20); E(44); }
    drawLashes(g, f.lashes || "none", eyes);
    g.fillStyle = lip; g.strokeStyle = lip;
    if (f.big) { bigLips(g, lip); if (f.gloss) { g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(21, 40, 6, 2.5); g.fillRect(34, 52, 6, 2); } return; }
    switch (mouth) {
      case "grin": g.beginPath(); g.arc(32, 40, 10, 0.15 * Math.PI, 0.85 * Math.PI); g.fill(); break;
      case "o": g.beginPath(); g.arc(32, 45, 4, 0, 7); g.fill(); break;
      case "tongue": g.beginPath(); g.arc(32, 41, 8, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); g.fillStyle = "#e2445c"; g.fillRect(29, 46, 7, 6); break;
      case "cat": g.beginPath(); g.moveTo(24, 44); g.quadraticCurveTo(28, 49, 32, 44); g.quadraticCurveTo(36, 49, 40, 44); g.stroke(); break;
      case "fangs": g.beginPath(); g.arc(32, 38, 9, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); g.fillStyle = "#fff"; g.strokeStyle = "#1e1b26"; g.lineWidth = 0.8; for (const x of [26, 38]) { g.beginPath(); g.moveTo(x - 3.5, 44); g.lineTo(x + 3.5, 44); g.lineTo(x, 53); g.closePath(); g.fill(); g.stroke(); } break;
      case "teeth": g.beginPath(); g.arc(32, 40, 10, 0.15 * Math.PI, 0.85 * Math.PI); g.fill(); g.fillStyle = "#fff"; g.fillRect(25, 43, 14, 3); break;
      default: g.beginPath(); g.arc(32, 38, 9, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
    if (f.gloss) { g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(28, 45, 3, 1.5); g.fillRect(34, 44, 2, 1.5); }
  });
}

// Величезні губи: верхня «пташка» й пухка нижня
function bigLips(g, c) {
  g.save(); g.fillStyle = c;
  g.beginPath(); g.moveTo(13, 46); g.bezierCurveTo(18, 33, 27, 34, 32, 39); g.bezierCurveTo(37, 34, 46, 33, 51, 46); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(13, 46); g.bezierCurveTo(17, 62, 47, 62, 51, 46); g.closePath(); g.fill();
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(14, 46); g.quadraticCurveTo(32, 49, 50, 46); g.stroke();
  g.restore();
}

// Вії: короткі штрихи над оком
function drawLashes(g, style, eyes) {
  if (style === "none" || eyes === "robot") return;
  const cfg = { short: [3, 2], long: [3, 4], fluffy: [5, 3.5], doll: [5, 5], color: [4, 4.5], mega: [7, 13], "mega-color": [7, 13] }[style];
  if (!cfg) return;
  const [n, L] = cfg;
  g.save(); g.strokeStyle = style === "color" ? "#9d6bdb" : style === "mega-color" ? "#ff1fa9" : "#1e1b26"; g.lineWidth = style.startsWith("mega") ? 2.2 : 1.3; g.lineCap = "round";
  for (const [x, side] of [[20, -1], [44, 1]]) {
    for (let k = 0; k < n; k++) {
      // віяло зверху ока, довші — назовні
      const a = -Math.PI / 2 + side * (0.15 + (k / Math.max(1, n - 1)) * 1.1);
      const len = L * (0.7 + 0.3 * (k / Math.max(1, n - 1)));
      g.beginPath(); g.moveTo(x + Math.cos(a) * 5, 27 + Math.sin(a) * 5); g.lineTo(x + Math.cos(a) * (5 + len), 27 + Math.sin(a) * (5 + len)); g.stroke();
    }
    if (style === "doll") for (const k of [0, 1, 2]) { const a = Math.PI / 2 + side * (0.4 + k * 0.4); g.beginPath(); g.moveTo(x + Math.cos(a) * 5, 27 + Math.sin(a) * 5); g.lineTo(x + Math.cos(a) * 7, 27 + Math.sin(a) * 7); g.stroke(); }
  }
  g.restore();
}

// Брови — кольору волосся
function drawBrows(g, style, color) {
  g.save(); g.strokeStyle = color; g.lineCap = "round";
  g.lineWidth = { thin: 1.3, thick: 4 }[style] || 2.5;
  for (const [x, inner] of [[20, 1], [44, -1]]) {
    g.beginPath();
    if (style === "arched") { g.moveTo(x - 6, 18); g.quadraticCurveTo(x, 12, x + 6, 18); }
    else if (style === "raised") { g.moveTo(x - 6, 15); g.quadraticCurveTo(x, 10, x + 6, 15); }
    else if (style === "angry") { g.moveTo(x - 6 * inner, 15); g.lineTo(x + 5 * inner, 19); }
    else { g.moveTo(x - 6, 18); g.quadraticCurveTo(x, 15.5, x + 6, 18); }
    g.stroke();
  }
  g.restore();
}

// Прикраси обличчя: рум’янець, веснянки, наліпки
function drawDeco(g, style) {
  g.save();
  const blush = (a) => { g.fillStyle = `rgba(235,95,120,${a})`; for (const x of [14, 50]) { g.beginPath(); g.ellipse(x, 38, 5, 2.6, 0, 0, 7); g.fill(); } };
  switch (style) {
    case "none": break;
    case "blush": blush(0.35); break;
    case "blush2": blush(0.65); break;
    case "freckles": blush(0.2); g.fillStyle = "#a0603a"; for (const x of [14, 50]) for (const [dx, dy] of [[-3, -1], [0, 1], [3, -1], [-1, 3], [2, 3]]) g.fillRect(x + dx, 37 + dy, 1.4, 1.4); break;
    case "heart": blush(0.3); heart(g, 51, 40, "#e2445c"); break;
    case "star": blush(0.3); star(g, 51, 40, 5, "#f7c915"); break;
    case "whiskers": g.strokeStyle = "#1e1b26"; g.lineWidth = 1; for (const [x, s] of [[12, -1], [52, 1]]) for (const dy of [-2, 1, 4]) { g.beginPath(); g.moveTo(x - 3 * s, 39); g.lineTo(x + 5 * s, 39 + dy); g.stroke(); } break;
    case "sparkle": blush(0.3); for (const [x, y, r] of [[9, 20, 2.5], [55, 20, 2.5], [12, 46, 1.8], [52, 46, 1.8], [8, 33, 1.6], [56, 33, 1.6]]) star(g, x, y, r, "#f7c915"); break;
    case "flag": blush(0.25); g.fillStyle = "#0057b7"; g.fillRect(46, 36, 9, 3); g.fillStyle = "#ffd700"; g.fillRect(46, 39, 9, 3); break;
    case "skull": g.fillStyle = "rgba(255,255,255,.75)"; g.fillRect(4, 8, 56, 50); g.fillStyle = "#1e1b26"; for (const x of [20, 44]) { g.beginPath(); g.arc(x, 27, 9, 0, 7); g.fill(); } g.beginPath(); g.moveTo(32, 33); g.lineTo(29, 39); g.lineTo(35, 39); g.closePath(); g.fill(); g.lineWidth = 1; g.strokeStyle = "#1e1b26"; for (let x = 22; x <= 42; x += 4) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 48); g.stroke(); } break;
    case "web": g.strokeStyle = "rgba(30,27,38,.8)"; g.lineWidth = 0.7; for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + (k / 5) * (Math.PI / 2); g.beginPath(); g.moveTo(58, 52); g.lineTo(58 + Math.cos(a) * 16, 52 - Math.sin(a) * 16); g.stroke(); } for (const r of [5, 10, 15]) { g.beginPath(); g.arc(58, 52, r, Math.PI, 1.5 * Math.PI); g.stroke(); } break;
    case "scar": blush(0.15); g.strokeStyle = "#5a3a2a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(8, 14); g.lineTo(26, 18); g.stroke(); for (let x = 10; x <= 24; x += 4) { g.beginPath(); g.moveTo(x, 12.5); g.lineTo(x + 1, 19.5); g.stroke(); } break;
    case "rainbow": blush(0.25); ["#e2445c", "#f7a51a", "#f7c915", "#99cc00", "#58b4f0", "#9d6bdb"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 1.1; g.beginPath(); g.arc(51, 44, 7 - i * 1.1, Math.PI, 2 * Math.PI); g.stroke(); }); break;
  }
  g.restore();
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

function skull(g, x, y, k, c, bg) {
  g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = c;
  g.beginPath(); g.arc(0, -4, 13, 0, 7); g.fill(); g.fillRect(-8, 4, 16, 9);
  g.fillStyle = bg; g.beginPath(); g.arc(-5, -3, 3.8, 0, 7); g.arc(5, -3, 3.8, 0, 7); g.fill();
  g.beginPath(); g.moveTo(0, 2); g.lineTo(-2, 6); g.lineTo(2, 6); g.fill();
  for (const dx of [-5, -1.5, 2]) g.fillRect(dx, 9, 2, 4);
  g.restore();
}

// Колготи / принт на шортах
function tightsMat(t) {
  if (!t.color) return null;
  if (!t.stripe && t.color[0] === "#") return mat(t.color);
  return new THREE.MeshLambertMaterial({ map: canvasTex(32, 32, (g) => {
    if (t.color === "rainbow") { ["#e2445c", "#f7a51a", "#f7c915", "#99cc00", "#58b4f0", "#9d6bdb"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 32 / 6, 32, 32 / 6 + 1); }); return; }
    if (t.color === "fishnet") { g.fillStyle = "#f1c19c"; g.fillRect(0, 0, 32, 32); g.strokeStyle = "#1e1b26"; g.lineWidth = 1; for (let k = -32; k < 64; k += 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 32, 32); g.moveTo(k + 32, 0); g.lineTo(k, 32); g.stroke(); } return; }
    g.fillStyle = t.color; g.fillRect(0, 0, 32, 32); g.fillStyle = t.stripe; for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 4);
  }) });
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
      case "dots": g.fillStyle = "#fff"; for (let y = 4; y < 64; y += 10) for (let x = (y / 10) % 2 ? 2 : 7; x < 64; x += 10) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } break;
      case "flowers": for (let y = 6; y < 64; y += 16) for (let x = (y / 16) % 2 ? 4 : 12; x < 64; x += 16) { g.fillStyle = "#fff"; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.2, 0, 7); g.fill(); } g.fillStyle = "#f7c915"; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } break;
      case "princess": g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(0, 0, 64, 8); g.fillStyle = "#fbe3ef"; g.beginPath(); g.moveTo(16, 8); g.lineTo(32, 40); g.lineTo(48, 8); g.fill(); for (const [x, y] of [[32, 14], [26, 22], [38, 22], [32, 30]]) star(g, x, y, 3, "#f7c915"); break;
      case "frill": g.fillStyle = "#f08fc0"; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 6, 4, 0, Math.PI); g.fill(); } for (let y = 18; y < 64; y += 14) for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, y, 3, 0, Math.PI); g.fill(); } break;
      case "heart": heart(g, 32, 32, "#e2445c"); g.save(); g.translate(32, 32); g.scale(2.2, 2.2); g.translate(-32, -32); heart(g, 32, 32, "#e2445c"); g.restore(); break;
      case "cardigan": g.fillStyle = "#fff"; g.fillRect(26, 0, 12, 64); g.fillStyle = "#9d6bdb"; for (let y = 12; y < 64; y += 14) { g.beginPath(); g.arc(24, y, 2.2, 0, 7); g.fill(); } g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(6, 40, 14, 12); g.fillRect(44, 40, 14, 12); break;
      case "skull": skull(g, 32, 30, 1, color === "#1e1b26" ? "#f4f1f9" : "#1e1b26", color); break;
      case "bolt": g.fillStyle = "#1e1b26"; g.beginPath(); for (const [x, y] of [[36, 6], [20, 34], [31, 34], [26, 58], [44, 26], [33, 26], [40, 6]]) g.lineTo(x, y); g.fill(); break;
      case "bigstar": star(g, 32, 32, 22, "#f7c915"); break;
      case "cat": { g.fillStyle = "#1e1b26"; g.beginPath(); g.arc(32, 34, 14, 0, 7); g.fill(); g.beginPath(); g.moveTo(19, 28); g.lineTo(21, 12); g.lineTo(30, 22); g.fill(); g.beginPath(); g.moveTo(45, 28); g.lineTo(43, 12); g.lineTo(34, 22); g.fill(); g.fillStyle = "#b6ff1a"; g.fillRect(25, 30, 4, 4); g.fillRect(35, 30, 4, 4); g.fillStyle = "#ff1fa9"; g.fillRect(30, 37, 4, 3); break; }
      case "smile": g.fillStyle = "#1e1b26"; g.fillRect(23, 22, 5, 8); g.fillRect(36, 22, 5, 8); g.lineWidth = 4; g.strokeStyle = "#1e1b26"; g.beginPath(); g.arc(32, 32, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); break;
      case "ua": g.fillStyle = "#0057b7"; g.fillRect(12, 18, 40, 14); g.fillStyle = "#ffd700"; g.fillRect(12, 32, 40, 14); heart(g, 32, 54, "#e2445c"); break;
      case "rainbow": ["#e2445c", "#f7a51a", "#f7c915", "#99cc00", "#58b4f0", "#9d6bdb"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(32, 46, 22 - i * 3, Math.PI, 2 * Math.PI); g.stroke(); }); break;
      case "leopard": g.fillStyle = "#3a2a1a"; for (let y = 4; y < 64; y += 12) for (let x = (y / 12) % 2 ? 2 : 8; x < 64; x += 12) { g.beginPath(); g.ellipse(x, y, 3.5, 2.5, 0.6, 0, 7); g.fill(); } break;
      case "skeleton": g.fillStyle = "#f4f1f9"; g.fillRect(30, 4, 4, 52); for (let y = 12; y < 44; y += 7) { g.fillRect(14, y, 36, 3); } g.beginPath(); g.ellipse(32, 52, 10, 5, 0, 0, 7); g.fill(); break;
      case "jack": { g.fillStyle = "#ff7a1a"; g.beginPath(); g.ellipse(32, 34, 20, 17, 0, 0, 7); g.fill(); g.fillStyle = "#3f7a16"; g.fillRect(30, 13, 4, 6); g.fillStyle = "#1e1b26"; for (const x of [24, 40]) { g.beginPath(); g.moveTo(x - 4, 32); g.lineTo(x, 25); g.lineTo(x + 4, 32); g.fill(); } g.beginPath(); g.moveTo(20, 38); for (let k = 0; k <= 6; k++) g.lineTo(20 + k * 4, k % 2 ? 46 : 40); g.lineTo(44, 38); g.fill(); break; }
      case "vampire": g.fillStyle = "#f4f1f9"; g.beginPath(); g.moveTo(22, 0); g.lineTo(32, 30); g.lineTo(42, 0); g.fill(); g.fillStyle = "#c8102e"; g.beginPath(); g.moveTo(10, 0); g.lineTo(22, 0); g.lineTo(28, 22); g.fill(); g.beginPath(); g.moveTo(54, 0); g.lineTo(42, 0); g.lineTo(36, 22); g.fill(); g.fillStyle = "#c8102e"; g.beginPath(); g.arc(32, 8, 3, 0, 7); g.fill(); break;
      case "mummy": g.strokeStyle = "#b8a882"; g.lineWidth = 3; for (let y = -10; y < 80; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 14); g.stroke(); } break;
      case "web": g.strokeStyle = "#e8e4f4"; g.lineWidth = 1.2; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.cos(a) * 40, 32 + Math.sin(a) * 40); g.stroke(); } for (const r of [7, 14, 21, 28]) { g.beginPath(); for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.stroke(); } g.fillStyle = "#1e1b26"; g.beginPath(); g.arc(44, 40, 3.5, 0, 7); g.fill(); break;
      case "witch": g.fillStyle = "#1e1b26"; g.fillRect(0, 0, 64, 8); for (const [x, y, r] of [[16, 24, 4], [44, 34, 5], [24, 50, 3], [50, 14, 3]]) star(g, x, y, r, "#f7c915"); g.fillStyle = "#ff7a1a"; g.fillRect(0, 56, 64, 8); break;
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
  const mTights = tightsMat(get("tights"));
  const mSkin = mat(skin), mHair = mat(hairC), mTop = mat(top.color), mBottom = mat(bottom.color), mShoes = mat(shoes.color);

  // Ноги (низ + взуття)
  const legs = new THREE.Group();
  for (const x of [-0.15, 0.15]) {
    const leg = new THREE.Group();
    const short = bottom.kind === 1, hot = bottom.kind === 6;
    // спідниці/сукні: ноги в колготах, якщо їх вдягнено
    const legM = (bottom.kind === 2 || bottom.kind === 3 || bottom.kind === 5) && mTights ? mTights : mBottom;
    if (hot) {
      const print = bottom.print && x > 0 ? new THREE.MeshLambertMaterial({ map: canvasTex(32, 32, (c) => { c.fillStyle = bottom.color; c.fillRect(0, 0, 32, 32); skull(c, 16, 16, 0.85, bottom.color === "#1e1b26" ? "#f4f1f9" : "#1e1b26", bottom.color); }) }) : mBottom;
      leg.add(at(box(0.27, 0.16, 0.31, [mBottom, mBottom, mBottom, mBottom, print, mBottom]), 0, 0.62, 0));
      leg.add(at(box(0.24, 0.46, 0.28, mTights || mSkin), 0, 0.31, 0));
    } else {
      leg.add(at(box(0.26, short ? 0.32 : 0.62, 0.3, legM), 0, short ? 0.54 : 0.39, 0));
      if (short) leg.add(at(box(0.24, 0.3, 0.28, mTights || mSkin), 0, 0.23, 0));
    }
    leg.add(at(box(0.28, 0.12, 0.36, mShoes), 0, 0.06, 0.03));
    leg.position.x = x;
    legs.add(leg);
  }
  g.add(legs);
  if (bottom.kind === 2) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.44, 0.36, 8), mBottom), 0, 0.58, 0));
  if (bottom.kind === 5) { const fl = mat(bottom.color, { transparent: true, opacity: 0.95 }), fl2 = mat(shade(bottom.color, 0.35), { transparent: true, opacity: 0.9 });
    [[0.75, 0.16, 0.7, fl], [0.86, 0.16, 0.6, fl2], [0.8, 0.14, 0.5, fl]].forEach(([r, hh, y, m]) => g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.33, r, hh, 16), m), 0, y, 0))); }
  if (bottom.kind === 3) { const tutu = mat(bottom.color, { transparent: true, opacity: 0.92 }); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.58, 0.14, 12), tutu), 0, 0.68, 0)); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.5, 0.12, 12), tutu), 0, 0.6, 0)); }
  // Сукня: колготи на ногах (якщо штани — їх не видно)
  if (top.dress && mTights && ![1, 6].includes(bottom.kind)) legs.children.forEach((l) => (l.children[0].material = mTights));
  // Сукня: спідниця кольору верху поверх ніг
  if (top.dress) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.33, top.dress === 2 ? 0.62 : 0.48, top.dress === 2 ? 0.62 : 0.46, 12), mTop), 0, top.dress === 2 ? 0.42 : 0.5, 0));

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
  const fTex = faceTexture(skin, get("eyes").style, get("mouth").style, {
    iris: get("eyeColor").color, lashes: get("lashes").style, brows: get("brows").style, browColor: shade(hairC, -0.25),
    lips: get("lips").color, gloss: get("lips").gloss, big: get("lips").big, deco: get("facedeco").style,
  });
  const mFace = new THREE.MeshLambertMaterial({ map: fTex });
  const head = new THREE.Group();
  head.add(box(0.56, 0.56, 0.56, [mSkin, mSkin, mSkin, mSkin, mFace, mSkin]));
  head.position.set(0, 1.7, 0);
  g.add(head);
  addHair(head, get("hair").style, mHair);
  addHairAcc(head, get("hairAcc").style);
  addEarrings(head, get("earrings").style);
  addNeck(g, get("neck").style);
  addHat(head, get("hat").style);
  addGlasses(head, get("glasses").style);
  addBack(g, get("back").style);
  const pet = addPet(g, get("pet").style);
  const aura = addAura(g, get("aura").color);

  g.userData = {
    arms, legs: legs.children, head, pet,
    animate(t, moving = 0) {
      const sw = Math.sin(t * 9) * 0.6 * moving;
      legs.children[0].rotation.x = sw; legs.children[1].rotation.x = -sw;
      arms[0].rotation.x = -sw; arms[1].rotation.x = sw;
      head.position.y = 1.7 + Math.sin(t * 2) * 0.012;
      if (pet) pet.userData.wings?.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 14) * 0.6));
      if (pet && g.userData.pet === pet) { pet.position.y = pet.userData.fly ? 0.05 + pet.userData.fly + Math.sin(t * 2) * 0.05 : 0.05 + Math.abs(Math.sin(t * 4)) * 0.08; pet.rotation.y = Math.sin(t) * 0.3; }
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
    case "twobraids": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.6, 0.08, 0.1, 0, 0.24, 0.27); for (const x of [-0.31, 0.31]) for (let i = 0; i < 4; i++) add(0.13 - i * 0.01, 0.15, 0.13, x, -0.08 - i * 0.15, 0.08); break;
    case "highpony": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.18, 0.16, 0.18, 0, 0.42, -0.2); add(0.16, 0.6, 0.12, 0, 0.1, -0.36); break;
    case "wavy": add(0.62, 0.16, 0.62, 0, 0.3, 0); for (let i = 0; i < 5; i++) { const o = i % 2 ? 0.03 : -0.03; add(0.66, 0.18, 0.12, o, 0.16 - i * 0.18, -0.27); add(0.1, 0.18, 0.6, -0.31 - o, 0.12 - i * 0.16, -0.02); add(0.1, 0.18, 0.6, 0.31 + o, 0.12 - i * 0.16, -0.02); } break;
    case "bangs": add(0.62, 0.16, 0.62, 0, 0.3, 0); add(0.62, 0.9, 0.12, 0, -0.18, -0.27); add(0.1, 0.7, 0.6, -0.3, -0.08, -0.02); add(0.1, 0.7, 0.6, 0.3, -0.08, -0.02); add(0.62, 0.14, 0.08, 0, 0.18, 0.29); break;
    case "sidepony": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); add(0.16, 0.16, 0.16, 0.34, 0.1, -0.06); add(0.14, 0.5, 0.14, 0.38, -0.2, -0.06); break;
    case "crownbraid": add(0.6, 0.14, 0.6, 0, 0.3, 0); add(0.6, 0.3, 0.1, 0, 0.12, -0.26); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; add(0.1, 0.1, 0.1, Math.cos(a) * 0.3, 0.34, Math.sin(a) * 0.3); } break;
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
    case "pumpkin-head": {
      const t = canvasTex(64, 64, (c) => { c.fillStyle = "#ff7a1a"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#ffd54a"; for (const x of [18, 46]) { c.beginPath(); c.moveTo(x - 9, 30); c.lineTo(x, 15); c.lineTo(x + 9, 30); c.fill(); } c.beginPath(); c.moveTo(12, 40); for (let k = 0; k <= 8; k++) c.lineTo(12 + k * 5, k % 2 ? 54 : 44); c.lineTo(52, 40); c.fill(); });
      const o = mat("#ff7a1a"), face = new THREE.MeshLambertMaterial({ map: t, emissive: "#3a1500" });
      add(box(0.7, 0.66, 0.7, [o, o, o, o, face, o]), 0, 0.02, 0);
      for (const x of [-0.2, 0.2]) add(box(0.04, 0.62, 0.72, mat("#e0661a")), x, 0.02, 0);
      add(box(0.08, 0.16, 0.08, mat("#3f7a16")), 0, 0.42, 0); break;
    }
    case "pumpkin": add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8).scale(1.2, 0.8, 1.2), mat("#ff7a1a")), 0.08, 0.38, 0); add(box(0.04, 0.1, 0.04, mat("#3f7a16")), 0.08, 0.53, 0); break;
    case "witch": add(new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 18), mat("#2a1f3d")), 0, 0.3, 0); add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 14), mat("#ff7a1a")), 0, 0.36, 0); { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 14), mat("#2a1f3d")); c.rotation.z = 0.25; add(c, 0.08, 0.76, 0); } break;
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
  if (style === "heart") { const m = mat("#e2445c"); for (const x of [-0.12, 0.12]) { const d = box(0.12, 0.12, 0.03, m); d.rotation.z = Math.PI / 4; add(d, x, 0.03, z); add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m), x - 0.04, 0.07, z); add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m), x + 0.04, 0.07, z); } add(box(0.08, 0.02, 0.02, m), 0, 0.06, z); return; }
  if (style === "cateye") { const m = mat("#9d6bdb"); for (const [x, s] of [[-0.12, -1], [0.12, 1]]) { add(box(0.18, 0.1, 0.03, m), x, 0.04, z); const t = box(0.07, 0.04, 0.03, m); t.rotation.z = s * 0.6; add(t, x + s * 0.1, 0.1, z); } add(box(0.08, 0.02, 0.02, m), 0, 0.06, z); return; }
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
    case "bag": add(box(0.18, 0.16, 0.08, mat("#f08fc0")), 0.38, 0.78, 0.06); { const st = box(0.03, 0.8, 0.03, mat("#9d6bdb")); st.rotation.z = 0.55; add(st, 0.1, 1.08, 0.18); } break;
    case "unicorn-bag": add(box(0.46, 0.5, 0.18, mat("#fbe3ef")), 0, 1.05, -0.26); add(box(0.3, 0.06, 0.04, mat("#c3a6ef")), 0, 1.2, -0.36); { const h = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 8), mat("#f7c915", { emissive: "#5a4500" })); add(h, 0, 1.42, -0.3); } add(box(0.08, 0.3, 0.06, mat("#c3a6ef")), 0.22, 1.18, -0.3); break;
    case "butterfly": for (const s of [-1, 1]) { const top = box(0.44, 0.38, 0.03, mat(s < 0 ? "#f08fc0" : "#c3a6ef", { transparent: true, opacity: 0.9 })); top.position.set(s * 0.32, 1.3, -0.22); top.rotation.z = s * 0.3; g.add(top); const low = box(0.3, 0.26, 0.03, mat("#8fe3c8", { transparent: true, opacity: 0.9 })); low.position.set(s * 0.26, 0.98, -0.22); low.rotation.z = s * -0.3; g.add(low); } break;
    case "vampire-cape": { const cape = new THREE.Group(); cape.name = "cape"; cape.position.set(0, 1.4, -0.2); cape.add(at(box(0.66, 1.25, 0.04, mat("#1e1b26")), 0, -0.62, 0)); cape.add(at(box(0.6, 1.15, 0.02, mat("#8a1020")), 0, -0.6, 0.03)); g.add(cape); } for (const s of [-1, 1]) { const c = box(0.22, 0.3, 0.04, mat("#1e1b26")); c.rotation.z = s * 0.5; add(c, s * 0.3, 1.5, -0.12); } break;
    case "bat-wings": for (const s of [-1, 1]) { const w = new THREE.Group(); for (let k = 0; k < 3; k++) { const f = box(0.36, 0.18, 0.03, mat("#2a2440")); f.position.set(s * (0.2 + k * 0.18), -k * 0.1, 0); f.rotation.z = s * (0.5 - k * 0.35); w.add(f); } w.name = s < 0 ? "wingL" : "wingR"; w.position.set(s * 0.12, 1.35, -0.24); g.add(w); } break;
    case "broom": { const b = new THREE.Group(); b.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), mat("#6b4426")), 0, 0, 0)); b.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), mat("#e8b84a")), 0, -0.8, 0)); b.name = "broom"; b.rotation.z = 0.7; b.position.set(0, 1.0, -0.28); g.add(b); break; }
    case "jetpack": for (const x of [-0.13, 0.13]) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10), mat("#b9bcc7")), x, 1.05, -0.28); add(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 8).rotateX(Math.PI), mat("#ff7a2e", { emissive: "#c13f2c" })), x, 0.7, -0.28); } break;
  }
}

function addPet(g, style) {
  if (style === "none") return null;
  const p = new THREE.Group();
  const add = (mesh, x, y, z) => p.add(at(mesh, x, y, z));
  if (["bat", "ghost", "pumpkin"].includes(style)) {
    if (style === "pumpkin") {
      const m = mat("#ff7a1a", { emissive: "#401800" });
      add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10).scale(1.2, 0.85, 1.2), m), 0, 0.24, 0);
      add(box(0.05, 0.12, 0.05, mat("#3f7a16")), 0, 0.5, 0);
      for (const x of [-0.08, 0.08]) add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.06, 3), mat("#ffd54a", { emissive: "#806000" })), x, 0.28, 0.3);
      add(box(0.18, 0.04, 0.02, mat("#ffd54a", { emissive: "#806000" })), 0, 0.16, 0.31);
    } else if (style === "ghost") {
      const m = mat("#f4f6fb", { transparent: true, opacity: 0.88, emissive: "#30303a" });
      add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), m), 0, 0.42, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.34, 14, 1, true), m), 0, 0.26, 0);
      for (const x of [-0.07, 0.07]) add(box(0.06, 0.09, 0.02, mat("#1e1b26")), x, 0.46, 0.21);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.035), mat("#1e1b26")), 0, 0.36, 0.21);
      p.userData.fly = 0.35;
    } else {
      const m = mat("#2a2440");
      add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), m), 0, 0.3, 0);
      for (const x of [-0.07, 0.07]) { add(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), m), x, 0.44, 0); add(box(0.035, 0.035, 0.02, mat("#ffd54a", { emissive: "#806000" })), x * 0.8, 0.33, 0.12); }
      for (const s of [-1, 1]) { const w = box(0.3, 0.14, 0.02, m); w.position.set(s * 0.25, 0.32, 0); p.add(w); (p.userData.wings ||= []).push([w, s]); }
      p.userData.fly = 0.9;
    }
    p.position.set(0.85, 0.05 + (p.userData.fly || 0), 0.25); p.scale.setScalar(0.9); g.add(p); return p;
  }
  const body = { blackcat: "#1e1b26", cat: "#e08a3c", dog: "#c9a36b", hedgehog: "#6b4426", owl: "#8a6a4a", fox: "#e0662a", bunny: "#f4f1f9", dragon: "#99cc00", hamster: "#e8b47a", panda: "#f4f1f9", unicorn: "#fbfaf5" }[style];
  const m = mat(body), eye = mat("#1e1b26");
  add(box(0.34, 0.24, 0.44, m), 0, 0.2, 0);
  add(box(0.28, 0.26, 0.26, m), 0, 0.42, 0.22);
  add(box(0.05, 0.05, 0.02, eye), -0.07, 0.46, 0.36); add(box(0.05, 0.05, 0.02, eye), 0.07, 0.46, 0.36);
  for (const [x, z] of [[-0.11, 0.14], [0.11, 0.14], [-0.11, -0.14], [0.11, -0.14]]) add(box(0.08, 0.1, 0.08, m), x, 0.04, z);
  if (style === "blackcat") { add(box(0.07, 0.07, 0.02, mat("#ffd54a", { emissive: "#806000" })), -0.07, 0.46, 0.365); add(box(0.07, 0.07, 0.02, mat("#ffd54a", { emissive: "#806000" })), 0.07, 0.46, 0.365); }
  if (["cat", "fox", "dog", "blackcat"].includes(style)) { add(box(0.07, 0.1, 0.05, m), -0.09, 0.59, 0.2); add(box(0.07, 0.1, 0.05, m), 0.09, 0.59, 0.2); add(box(0.06, 0.06, 0.3, style === "fox" ? mat("#fff") : m), 0, 0.3, -0.32); }
  if (style === "bunny") { add(box(0.06, 0.24, 0.05, m), -0.07, 0.66, 0.2); add(box(0.06, 0.24, 0.05, m), 0.07, 0.66, 0.2); }
  if (style === "hedgehog") for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), mat("#3a2a1a")); c.rotation.x = -0.6; add(c, (i % 3 - 1) * 0.1, 0.36, -0.05 - Math.floor(i / 3) * 0.14); }
  if (style === "owl") { add(box(0.1, 0.1, 0.02, mat("#f7c915")), -0.07, 0.46, 0.36); add(box(0.1, 0.1, 0.02, mat("#f7c915")), 0.07, 0.46, 0.36); }
  if (style === "panda") { const blk = mat("#1e1b26"); add(box(0.08, 0.08, 0.05, blk), -0.1, 0.57, 0.2); add(box(0.08, 0.08, 0.05, blk), 0.1, 0.57, 0.2); add(box(0.09, 0.08, 0.02, blk), -0.07, 0.46, 0.355); add(box(0.09, 0.08, 0.02, blk), 0.07, 0.46, 0.355); for (const [x, z] of [[-0.11, 0.14], [0.11, 0.14], [-0.11, -0.14], [0.11, -0.14]]) add(box(0.085, 0.1, 0.085, blk), x, 0.04, z); }
  if (style === "hamster") { add(box(0.07, 0.06, 0.04, m), -0.1, 0.57, 0.2); add(box(0.07, 0.06, 0.04, m), 0.1, 0.57, 0.2); add(box(0.2, 0.08, 0.02, mat("#fbf3e6")), 0, 0.36, 0.355); }
  if (style === "unicorn") { add(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 8), mat("#f7c915", { emissive: "#5a4500" })), 0, 0.64, 0.3); add(box(0.06, 0.22, 0.3, mat("#f08fc0")), 0, 0.5, 0.08); add(box(0.06, 0.06, 0.3, mat("#c3a6ef")), 0, 0.3, -0.34); }
  if (style === "dragon") { for (const s of [-1, 1]) { const w = box(0.3, 0.02, 0.24, mat("#9d6bdb")); w.position.set(s * 0.3, 0.36, 0); w.rotation.z = s * 0.4; p.add(w); } add(box(0.08, 0.08, 0.3, m), 0, 0.22, -0.34); }
  p.position.set(0.85, 0.05, 0.25);
  p.scale.setScalar(0.9);
  g.add(p);
  return p;
}

// Колір трохи темніший/світліший (для брів)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(c + (k < 0 ? c : 255 - c) * k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function addHairAcc(head, style) {
  if (style === "none") return;
  const add = (mesh, x, y, z) => head.add(at(mesh, x, y, z));
  const sph = (r, c) => new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(c));
  const bow = (c, x, y, z, s = 1) => { const b = new THREE.Group(); const m = mat(c); for (const k of [-1, 1]) { const w = box(0.12 * s, 0.1 * s, 0.05, m); w.rotation.z = k * 0.35; w.position.x = k * 0.08 * s; b.add(w); } b.add(box(0.05 * s, 0.06 * s, 0.06, m)); b.position.set(x, y, z); head.add(b); };
  const band = (c) => { const m = mat(c); add(box(0.64, 0.05, 0.1, m), 0, 0.39, 0.06); add(box(0.04, 0.2, 0.1, m), -0.33, 0.28, 0.06); add(box(0.04, 0.2, 0.1, m), 0.33, 0.28, 0.06); };
  switch (style) {
    case "bow-pink": bow("#f08fc0", 0.18, 0.38, 0.12); break;
    case "bow-red": bow("#c8102e", 0.18, 0.38, 0.12); break;
    case "bow-violet": bow("#9d6bdb", 0, 0.42, -0.12, 1.5); break;
    case "headband": band("#9d6bdb"); break;
    case "flowerband": band("#99cc00"); ["#e2445c", "#f7c915", "#f08fc0", "#58b4f0", "#fff"].forEach((c, i) => add(sph(0.05, c), -0.24 + i * 0.12, 0.43, 0.08)); break;
    case "clips": for (const [x, y, z] of [[0.24, 0.32, 0.18], [0.29, 0.24, 0.12], [-0.25, 0.3, 0.16]]) add(new THREE.Mesh(new THREE.OctahedronGeometry(0.045), mat("#f7c915", { emissive: "#5a4500" })), x, y, z); break;
    case "flower": add(sph(0.035, "#f7c915"), 0.31, 0.18, 0.12); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; add(sph(0.04, "#f08fc0"), 0.33, 0.18 + Math.sin(a) * 0.06, 0.12 + Math.cos(a) * 0.06); } break;
    case "catears": band("#1e1b26"); for (const x of [-0.18, 0.18]) { add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), mat("#1e1b26")), x, 0.5, 0.04); add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), mat("#f08fc0")), x, 0.49, 0.08); } break;
    case "bunnyears": band("#f4f1f9"); for (const x of [-0.12, 0.12]) { add(box(0.09, 0.34, 0.05, mat("#f4f1f9")), x, 0.58, 0.02); add(box(0.04, 0.24, 0.02, mat("#f08fc0")), x, 0.58, 0.05); } break;
    case "ribbons": bow("#f7c915", 0, 0.2, -0.33); add(box(0.05, 0.7, 0.02, mat("#0057b7")), -0.05, -0.18, -0.34); add(box(0.05, 0.7, 0.02, mat("#ffd700")), 0.05, -0.18, -0.34); break;
    case "tiara": { const m = mat("#f7c915", { emissive: "#6b5300" }); add(box(0.5, 0.04, 0.04, m), 0, 0.4, 0.18); for (const [x, h] of [[-0.16, 0.08], [0, 0.14], [0.16, 0.08]]) add(new THREE.Mesh(new THREE.ConeGeometry(0.04, h, 4), m), x, 0.44 + h / 2, 0.18); add(sph(0.035, "#e2445c"), 0, 0.46, 0.21); break; }
    case "horns": band("#8a1020"); for (const x of [-0.18, 0.18]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), mat("#d1102e")); c.rotation.z = -x * 1.5; add(c, x, 0.5, 0.08); } break;
    case "bat-band": band("#1e1b26"); add(box(0.08, 0.08, 0.06, mat("#1e1b26")), 0, 0.46, 0.08); for (const k of [-1, 1]) { const w = box(0.16, 0.07, 0.03, mat("#2a2440")); w.rotation.z = k * 0.3; add(w, k * 0.12, 0.48, 0.08); } break;
    case "unicorn": band("#c3a6ef"); { const h = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 8), mat("#f7c915", { emissive: "#5a4500" })); h.rotation.x = 0.35; add(h, 0, 0.56, 0.14); } add(sph(0.05, "#f08fc0"), -0.12, 0.42, 0.12); add(sph(0.05, "#8fe3c8"), 0.12, 0.42, 0.12); break;
  }
}

function addEarrings(head, style) {
  if (style === "none") return;
  const gold = mat("#e8c25a", { emissive: "#4a3800" });
  for (const x of [-0.295, 0.295]) {
    const add = (mesh, y, z = 0.02) => head.add(at(mesh, x, y, z));
    switch (style) {
      case "studs": add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), gold), -0.08); break;
      case "hoops": { const r = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 16), gold); r.rotation.y = Math.PI / 2; add(r, -0.15); break; }
      case "pearls": add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), gold), -0.08); add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat("#fbf7ee")), -0.14); break;
      case "stars": add(new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat("#f7c915", { emissive: "#5a4500" })), -0.13); break;
      case "hearts": { const h = box(0.06, 0.06, 0.02, mat("#e2445c")); h.rotation.z = Math.PI / 4; add(h, -0.14); break; }
      case "cherries": add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat("#c8102e")), -0.15, 0.04); add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat("#c8102e")), -0.15, -0.03); add(box(0.015, 0.07, 0.015, mat("#3f8f3a")), -0.09); break;
    }
  }
}

function addNeck(g, style) {
  if (style === "none") return;
  const add = (mesh, x, y, z) => g.add(at(mesh, x, y, z));
  const beads = (c, r, rows) => rows.forEach((dy) => { for (let i = -5; i <= 5; i++) add(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(c)), i * 0.045, 1.37 - dy - i * i * 0.004, 0.18); });
  switch (style) {
    case "korali": beads("#c8102e", 0.028, [0, 0.06, 0.12]); break;
    case "pearls": beads("#fbf7ee", 0.026, [0.02]); break;
    case "choker": add(box(0.32, 0.04, 0.02, mat("#1e1b26")), 0, 1.38, 0.175); add(new THREE.Mesh(new THREE.OctahedronGeometry(0.03), mat("#9d6bdb")), 0, 1.34, 0.19); break;
    case "pendant": { const gold = mat("#e8c25a"); for (let i = -4; i <= 4; i++) add(box(0.03, 0.015, 0.01, gold), i * 0.035, 1.38 - i * i * 0.006, 0.176); const h = box(0.07, 0.07, 0.02, mat("#e2445c")); h.rotation.z = Math.PI / 4; add(h, 0, 1.24, 0.185); break; }
    case "scarf": add(box(0.66, 0.14, 0.4, mat("#e2445c")), 0, 1.36, 0); add(box(0.14, 0.4, 0.05, mat("#e2445c")), 0.16, 1.14, 0.2); for (let y = 1.0; y < 1.3; y += 0.08) add(box(0.145, 0.03, 0.055, mat("#fff")), 0.16, y, 0.2); break;
    case "bowtie": { const m = mat("#9d6bdb"); for (const k of [-1, 1]) { const w = box(0.1, 0.08, 0.04, m); w.rotation.z = k * 0.3; add(w, k * 0.06, 1.33, 0.19); } add(box(0.04, 0.05, 0.05, m), 0, 1.33, 0.19); break; }
    case "medal": { for (const [x, c, r] of [[-0.05, "#0057b7", 0.35], [0.05, "#ffd700", -0.35]]) { const s = box(0.05, 0.22, 0.01, mat(c)); s.rotation.z = r; add(s, x, 1.28, 0.178); } add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16).rotateX(Math.PI / 2), mat("#e8c25a", { emissive: "#4a3800" })), 0, 1.13, 0.19); break; }
  }
}

function addAura(g, color) {
  if (!color) return null;
  const grp = new THREE.Group();
  const rainbow = ["#e2445c", "#f7c915", "#99cc00", "#58b4f0", "#9d6bdb"];
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const c = color === "rainbow" ? rainbow[i % rainbow.length] : color === "halloween" ? ["#ff7a1a", "#9d6bdb", "#1e1b26"][i % 3] : color;
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

// Улюбленець ходить слідом за власником (3D-школа): відчіпляємо від персонажа й ведемо окремо
export function petFollower(model, scene) {
  const p = model.userData.pet;
  if (!p) return null;
  model.remove(p); model.userData.pet = null; scene.add(p);
  const f = { x: model.position.x + 0.8, z: model.position.z + 0.6, ry: model.rotation.y };
  return {
    update(dt, t, ox, oz, ory, oy = 0) {
      // місце трохи позаду й праворуч від власника
      const tx = ox - Math.sin(ory) * 1.0 + Math.cos(ory) * 0.75, tz = oz - Math.cos(ory) * 1.0 - Math.sin(ory) * 0.75;
      const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
      const moving = d > 0.12;
      if (d > 8) { f.x = tx; f.z = tz; } // телепорт, якщо загубився
      else if (moving) { const k = Math.min(1, dt * 5); f.x += dx * k; f.z += dz * k; }
      const want = moving ? Math.atan2(dx, dz) : ory;
      let a = (want - f.ry) % (Math.PI * 2); if (a > Math.PI) a -= Math.PI * 2; if (a < -Math.PI) a += Math.PI * 2;
      f.ry += a * Math.min(1, dt * 8);
      p.userData.wings?.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 14) * 0.6));
      p.position.set(f.x, oy + 0.05 + (p.userData.fly ? p.userData.fly + Math.sin(t * 2) * 0.08 : moving ? Math.abs(Math.sin(t * 12)) * 0.12 : Math.abs(Math.sin(t * 3)) * 0.04), f.z);
      p.rotation.set(0, f.ry, moving ? Math.sin(t * 12) * 0.08 : 0);
    },
    dispose() { scene.remove(p); },
  };
}
