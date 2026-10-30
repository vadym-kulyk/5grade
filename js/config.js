// Налаштування сайту. Тут усе, що вчитель може захотіти змінити.

export const firebaseConfig = {
  apiKey: "AIzaSyBTYbZJB7Za_6YFDawFQT0Nl9FRRIOWNd4",
  authDomain: "grade-2addb.firebaseapp.com",
  databaseURL: "https://grade-2addb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grade-2addb",
  storageBucket: "grade-2addb.firebasestorage.app",
  messagingSenderId: "48670937817",
  appId: "1:48670937817:web:03f62de6dc1398d7cb64c8",
};

// Пошта вчителя: лише цей обліковий запис бачить результати й налаштування.
// Те саме значення стоїть у database.rules.json.
export const TEACHER_EMAIL = "badim1aaa@gmail.com";

export const CLASSES = ["5S", "5L"];

// Технічний домен для логінів учнів (пошта не потрібна й нікуди не надсилається).
export const STUDENT_DOMAIN = "ukr5.local";

export const ECONOMY = {
  firstSolve: 15,      // правильна відповідь на завдання, яке учень бачить уперше
  solve: 10,           // правильна відповідь на завдання, яке раніше не вдавалося
  repeatSolve: 2,      // повторне розв’язання вже зарахованого завдання
  levelPerfect: 50,    // 10 з 10 на рівні
  topicPerfect: 200,   // уся тема на 100 % (один раз)
  hintPrice: 400,      // підказка — дуже дорога
  streakPerDay: 20,    // щоденна серія: 20 × днів (до 7)
  reviewSolve: 5,      // правильна відповідь у «Роботі над помилками»
};

export const XP = { solve: 10, badge: 50, monitoringPerfect: 100 };

// Захист від «проклацування»
export const SPEED = {
  minSec: 1.5,          // відповідь швидше за 1,5 с вважаємо поспіхом
  maxMinSec: 1.5,       // однаково для всіх завдань, незалежно від довжини
  charsPerSec: 28,      // швидкість читання (з запасом, щоб не заважати швидким учням)
  pauseAfter: 3,        // стільки занадто швидких відповідей поспіль → пауза
  pauseSec: 15,
};

export const LEVELS_PER_TOPIC = 5;
export const TASKS_PER_LEVEL = 10;

// 🎃 Геловін: автоматично з 15 жовтня до 10 листопада; учитель може ввімкнути/вимкнути вручну (settings/halloween)
export const hwSeason = (d = new Date()) => (d.getMonth() === 9 && d.getDate() >= 15) || (d.getMonth() === 10 && d.getDate() <= 10);
export const halloweenOn = (settings) => settings?.halloween ?? hwSeason();
