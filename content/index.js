// Перелік розділів і тем за підручником А. Онатій, Т. Ткачук «Українська мова. 5 клас» (2022).
// ready: true — тема вже має теорію й 50 завдань (файл content/topics/<id>.js).

export const BOOK = "А. Онатій, Т. Ткачук. Українська мова: підручник для 5 класу (2022)";

export const SECTIONS = [
  { id: "s1", n: 1, title: "Українська мова в житті українців", color: "#f7c915" },
  { id: "s2", n: 2, title: "Лексикологія", color: "#99cc00" },
  { id: "s3", n: 3, title: "Фразеологія", color: "#9d6bdb" },
  { id: "s4", n: 4, title: "Фонетика. Графіка. Орфоепія", color: "#f7c915" },
  { id: "s5", n: 5, title: "Орфографія", color: "#99cc00" },
  { id: "s6", n: 6, title: "Синтаксис і пунктуація", color: "#9d6bdb" },
  { id: "s7", n: 7, title: "Розвиток мовлення", color: "#f7c915" },
];

export const TOPICS = [
  { id: "mova", s: "s1", title: "Мова в житті людини й держави", lessons: "1–3", ready: true },

  { id: "znachennia", s: "s2", title: "Лексичне значення слова. Однозначні й багатозначні слова. Пряме й переносне значення", short: "Лексичне значення слова", lessons: "5–9", ready: true },
  { id: "synonimy", s: "s2", title: "Синоніми. Антоніми", lessons: "12–18", ready: true },
  { id: "omonimy", s: "s2", title: "Омоніми. Пароніми", lessons: "12–18", ready: true },
  { id: "zapozycheni", s: "s2", title: "Власне українські й запозичені слова. Написання слів іншомовного походження", short: "Запозичені слова", lessons: "21–24", ready: true },
  { id: "arhaizmy", s: "s2", title: "Архаїзми, історизми, неологізми", lessons: "25", ready: true },
  { id: "vzhyvannia", s: "s2", title: "Загальновживані слова й слова обмеженого вживання", short: "Слова обмеженого вживання", lessons: "26–28", ready: true },
  { id: "surzhyk", s: "s2", title: "Лексична помилка. Суржик", lessons: "29–31", ready: true },

  { id: "frazeolohizmy", s: "s3", title: "Фразеологізми. Афоризми", lessons: "35–36", ready: true },
  { id: "frazslovnyk", s: "s3", title: "Фразеологічний словник. Джерела фразеологізмів", short: "Джерела фразеологізмів", lessons: "37", ready: true },

  { id: "zvuky", s: "s4", title: "Голосні й приголосні звуки", lessons: "41", ready: true },
  { id: "hrafika", s: "s4", title: "Особливості графіки: я, ю, є, ї, щ", lessons: "42", ready: true },
  { id: "naholos", s: "s4", title: "Наголос", lessons: "43–44", ready: true },
  { id: "eta", s: "s4", title: "Ненаголошені [е] та [и] в коренях слів", short: "Ненаголошені е, и", lessons: "45–46", ready: true },
  { id: "cherhuvannia", s: "s4", title: "Чергування голосних", lessons: "47", ready: true },
  { id: "dzvinki", s: "s4", title: "Звук [ґ]. Дзвінкі й глухі приголосні", short: "Дзвінкі й глухі", lessons: "48–49", ready: true },
  { id: "vymova", s: "s4", title: "Вимова приголосних у корені слова", short: "Вимова приголосних", lessons: "50", ready: true },
  { id: "miaki", s: "s4", title: "Тверді й м’які приголосні. Позначення м’якості", short: "Тверді й м’які", lessons: "51–53", ready: true },

  { id: "miakyiznak", s: "s5", title: "Правила вживання м’якого знака", short: "М’який знак", lessons: "56–57", ready: true },
  { id: "apostrof", s: "s5", title: "Правила вживання апострофа", short: "Апостроф", lessons: "58–59", ready: true },
  { id: "pereniesennia", s: "s5", title: "Склад. Перенесення слів", lessons: "60", ready: true },
  { id: "mylozvuchnist", s: "s5", title: "Милозвучність: у – в, і – й, з – із – зі", short: "Милозвучність", lessons: "61", ready: true },
  { id: "sproshchennia", s: "s5", title: "Спрощення в групах приголосних", short: "Спрощення", lessons: "62", ready: true },
  { id: "pomylky", s: "s5", title: "Види помилок. Словники", lessons: "63–65", ready: true },

  { id: "slovospoluchennia", s: "s6", title: "Словосполучення і речення. Головне й залежне слово", short: "Словосполучення", lessons: "68–71", ready: true },
  { id: "vydyrechen", s: "s6", title: "Види речень за метою висловлювання та емоційним забарвленням", short: "Види речень", lessons: "72", ready: true },
  { id: "osnova", s: "s6", title: "Граматична основа речення: підмет і присудок", short: "Підмет і присудок", lessons: "75–77", ready: true },
  { id: "odnoskladni", s: "s6", title: "Речення з одним головним членом", lessons: "78–79", ready: true },
  { id: "oznachennia", s: "s6", title: "Означення", lessons: "84–85" },
  { id: "dodatok", s: "s6", title: "Додаток", lessons: "86" },
  { id: "obstavyna", s: "s6", title: "Обставина", lessons: "87–89" },
  { id: "odnoridni", s: "s6", title: "Однорідні члени речення. Кома між ними", short: "Однорідні члени", lessons: "92–96" },
  { id: "skladne", s: "s6", title: "Складне речення. Кома між його частинами", short: "Складне речення", lessons: "104–109" },
  { id: "priamamova", s: "s6", title: "Пряма мова", lessons: "114–115" },
  { id: "dialoh", s: "s6", title: "Діалог", lessons: "118–120" },
  { id: "punktuatsiia", s: "s6", title: "Пунктуаційна помилка. Узагальнення", short: "Пунктуаційна помилка", lessons: "121–123" },

  { id: "spilkuvannia", s: "s7", title: "Спілкування: види, учасники, правила, безпека в мережі", short: "Спілкування", lessons: "4, 66–67, 82–83, 90–91" },
  { id: "informatsiia", s: "s7", title: "Інформація: види, джерела, добір", short: "Інформація", lessons: "10–11, 19" },
  { id: "typymovlennia", s: "s7", title: "Опис, розповідь, роздум. Первинні й вторинні тексти", short: "Типи мовлення", lessons: "20, 74" },
  { id: "chytannia", s: "s7", title: "Види й мета читання", short: "Читання", lessons: "32–33" },
  { id: "zhanry", s: "s7", title: "Жанри мовлення: комплімент, похвала, запрошення, прохання, привітання, вибачення, подяка", short: "Жанри мовлення", lessons: "39–40, 124, 136" },
];

export const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const sectionById = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
export const shortTitle = (t) => t.short || t.title;

const cache = {};
export async function loadTopic(id) {
  if (!cache[id]) cache[id] = (await import(`./topics/${id}.js`)).default;
  return cache[id];
}
