// Підключення до Firebase: вхід і база даних.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updatePassword,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, connectDatabaseEmulator, ref, get, set, update, push, remove,
  onValue, off, onDisconnect, serverTimestamp, query, orderByChild, limitToLast,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, TEACHER_EMAIL, STUDENT_DOMAIN } from "./config.js";

// ?emu=1 у адресі — працюємо з локальним емулятором (для перевірки без справжньої бази)
const EMU = new URLSearchParams(location.search).has("emu");
const app = initializeApp(EMU ? { ...firebaseConfig, databaseURL: "http://127.0.0.1:9000?ns=grade-2addb-default-rtdb" } : firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
if (EMU) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}

export { ref, get, set, update, push, remove, onValue, off, onDisconnect, serverTimestamp, query, orderByChild, limitToLast, runTransaction };

export const r = (path) => ref(db, path);
export const read = async (path) => (await get(r(path))).val();
export const write = (path, val) => set(r(path), val);
export const patch = (path, val) => update(r(path), val);

export const isTeacher = (user) => !!user && user.email === TEACHER_EMAIL;

// PIN із 4 цифр → пароль Firebase (потрібно щонайменше 6 символів)
const pinPass = (pin) => `ukr5-${pin}-pin`;
const loginEmail = (login) => `${login}@${STUDENT_DOMAIN}`;

export function watchAuth(cb) { return onAuthStateChanged(auth, cb); }
export function logout() { return signOut(auth); }

export async function studentLogin(login, pin) {
  return signInWithEmailAndPassword(auth, loginEmail(login), pinPass(pin));
}

export async function studentRegister({ name, cls, pin }) {
  const login = `${cls.toLowerCase()}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const cred = await createUserWithEmailAndPassword(auth, loginEmail(login), pinPass(pin));
  const uid = cred.user.uid;
  const now = Date.now();
  await update(ref(db), {
    [`roster/${cls}/${uid}`]: { name, login },
    [`pins/${uid}`]: pin,
    [`users/${uid}`]: { name, cls, login, createdAt: now, coins: 0, xp: 0, avatar: null, owned: null },
    [`public/${uid}`]: { name, cls, xp: 0, avatar: null },
  });
  return uid;
}

export async function changePin(uid, pin) {
  await updatePassword(auth.currentUser, pinPass(pin));
  await set(ref(db, `pins/${uid}`), pin);
}

export async function teacherLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function teacherRegister(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Зрозумілі повідомлення про помилки Firebase
export function errText(e) {
  const c = e?.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Неправильний PIN або пароль.";
  if (c.includes("too-many-requests")) return "Забагато спроб. Зачекай кілька хвилин.";
  if (c.includes("email-already-in-use")) return "Такий обліковий запис уже існує.";
  if (c.includes("weak-password")) return "Пароль закороткий (потрібно щонайменше 6 символів).";
  if (c.includes("network")) return "Немає зв’язку з інтернетом.";
  if (c.includes("PERMISSION_DENIED") || String(e).includes("ermission")) return "Немає доступу. Перевір правила бази даних.";
  return "Сталася помилка: " + (e?.message || e);
}
