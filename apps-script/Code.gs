/**
 * Українська мова · 5 клас — таблиця результатів для вчителя.
 * Скрипт сам забирає дані з Firebase (кожні 10 хвилин) і будує аркуші:
 *   «Спроби» (кожна спроба — рядок, з фільтрами), «Учні», «Прогрес» (учень × тема),
 *   «Теми» (обери тему — результати всіх учнів), «Моніторингові» (учень × робота), «Найдовші питання», «Дашборд» (графіки) і звіти учнів у PDF.
 * Встановлення — див. README.md у репозиторії.
 */

const DB_URL = 'https://grade-2addb-default-rtdb.europe-west1.firebasedatabase.app';
const LIME = '#99cc00', VIOLET = '#9d6bdb', YELLOW = '#f7c915', INK = '#1e1b26', SURFACE = '#f1ecf7';

const TOPICS = [
  ['mova', 'Мова в житті людини й держави'], ['znachennia', 'Лексичне значення слова'], ['synonimy', 'Синоніми. Антоніми'],
  ['omonimy', 'Омоніми. Пароніми'], ['zapozycheni', 'Запозичені слова'], ['arhaizmy', 'Архаїзми, історизми, неологізми'],
  ['vzhyvannia', 'Слова обмеженого вживання'], ['surzhyk', 'Лексична помилка. Суржик'], ['frazeolohizmy', 'Фразеологізми. Афоризми'],
  ['frazslovnyk', 'Джерела фразеологізмів'], ['zvuky', 'Голосні й приголосні звуки'], ['hrafika', 'Графіка: я, ю, є, ї, щ'],
  ['naholos', 'Наголос'], ['eta', 'Ненаголошені е, и'], ['cherhuvannia', 'Чергування голосних'], ['dzvinki', 'Дзвінкі й глухі'],
  ['vymova', 'Вимова приголосних'], ['miaki', 'Тверді й м’які'], ['miakyiznak', 'М’який знак'], ['apostrof', 'Апостроф'],
  ['pereniesennia', 'Склад. Перенесення слів'], ['mylozvuchnist', 'Милозвучність'], ['sproshchennia', 'Спрощення'],
  ['pomylky', 'Види помилок. Словники'], ['slovospoluchennia', 'Словосполучення'], ['vydyrechen', 'Види речень'],
  ['osnova', 'Підмет і присудок'], ['odnoskladni', 'Речення з одним головним членом'], ['oznachennia', 'Означення'],
  ['dodatok', 'Додаток'], ['obstavyna', 'Обставина'], ['odnoridni', 'Однорідні члени'], ['skladne', 'Складне речення'],
  ['priamamova', 'Пряма мова'], ['dialoh', 'Діалог'], ['punktuatsiia', 'Пунктуаційна помилка'], ['spilkuvannia', 'Спілкування'],
  ['informatsiia', 'Інформація'], ['typymovlennia', 'Типи мовлення'], ['chytannia', 'Читання'], ['zhanry', 'Жанри мовлення'],
];
const TOPIC_TITLE = Object.fromEntries(TOPICS);
const MAX_SEC = 180; // довше — учень, мабуть, відійшов; не псуємо середній час
const TYPE = { level: 'Рівень теми', review: 'Робота над помилками', monitoring: 'Моніторингова робота' };
const RANKS = [[0, 'Новачок'], [150, 'Писар'], [500, 'Буквознавець'], [1200, 'Словознавець'], [2500, 'Грамотій'], [4500, 'Книжник'], [7000, 'Літописець'], [10000, 'Мовознавець'], [14000, 'Хранитель Слова'], [19000, 'Майстер Мови']];
const rankOf = (xp) => RANKS.filter((r) => (xp || 0) >= r[0]).pop()[1];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 Українська 5')
    .addItem('Оновити зараз', 'sync')
    .addItem('Увімкнути автооновлення (кожні 10 хв)', 'installTrigger')
    .addSeparator()
    .addItem('Звіт учня в PDF…', 'reportDialog')
    .addToUi();
}

function installTrigger() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'sync').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sync').timeBased().everyMinutes(10).create();
  sync();
  SpreadsheetApp.getActive().toast('Автооновлення увімкнено: таблиця оновлюватиметься кожні 10 хвилин.', 'Українська 5', 6);
}

function fetchDb(path) {
  const res = UrlFetchApp.fetch(DB_URL + '/' + path + '.json?access_token=' + ScriptApp.getOAuthToken(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Firebase: ' + res.getResponseCode() + ' ' + res.getContentText());
  return JSON.parse(res.getContentText()) || {};
}

function sheet(name, index) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = index === undefined ? ss.insertSheet(name) : ss.insertSheet(name, index);
  return sh;
}

function header(sh, cols, color) {
  sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground(color || INK).setFontColor('#ffffff').setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 38);
}

function sync() {
  const users = fetchDb('users');
  const attemptsRaw = fetchDb('attempts');
  const progress = fetchDb('progress');
  const tz = Session.getScriptTimeZone();

  const attempts = [];
  Object.keys(attemptsRaw).forEach((uid) => Object.keys(attemptsRaw[uid]).forEach((id) => attempts.push(Object.assign({ uid: uid }, attemptsRaw[uid][id]))));
  attempts.sort((a, b) => b.end - a.end);

  // ---------- Спроби ----------
  const sA = sheet('Спроби', 0);
  sA.getFilter() && sA.getFilter().remove(); sA.getBandings().forEach((b) => b.remove());
  sA.clear(); sA.clearConditionalFormatRules();
  const colsA = ['Дата', 'Час', 'Клас', 'Учень', 'Тип', 'Тема / робота', 'Рівень', 'Спроба №', 'Правильно', 'Усього', '%', 'Тривалість, хв', 'Сер. час на завдання, с', 'Швидких відповідей', 'Позначка', 'Підказок', 'Монети', 'Досвід'];
  header(sA, colsA);
  const rowsA = attempts.map((a) => [
    Utilities.formatDate(new Date(a.end), tz, 'dd.MM.yyyy'), Utilities.formatDate(new Date(a.end), tz, 'HH:mm'),
    a.cls, a.name, TYPE[a.type] || a.type, a.topic ? (TOPIC_TITLE[a.topic] || a.topicTitle) : a.topicTitle, a.level || '', a.attemptNo || 1,
    a.correct, a.total, (a.pct || 0) / 100, Math.round((a.durSec || 0) / 6) / 10, a.avgSec, a.fast || 0, a.flagged ? '⚡ швидко' : '', a.hints || 0, a.coins || 0, a.xp || 0]);
  if (rowsA.length) {
    sA.getRange(2, 1, rowsA.length, colsA.length).setValues(rowsA);
    sA.getRange(2, 11, rowsA.length, 1).setNumberFormat('0%');
    sA.getRange(1, 1, rowsA.length + 1, colsA.length).createFilter();
    sA.getRange(2, 1, rowsA.length, colsA.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    const pctR = sA.getRange(2, 11, rowsA.length, 1), flagR = sA.getRange(2, 15, rowsA.length, 1);
    sA.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#f4c7c0', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMidpointWithValue('#fbe9a6', SpreadsheetApp.InterpolationType.NUMBER, '0.6').setGradientMaxpointWithValue('#c9e88a', SpreadsheetApp.InterpolationType.NUMBER, '1').setRanges([pctR]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextContains('⚡').setBackground('#fff1b8').setFontColor('#8a4b00').setBold(true).setRanges([flagR]).build(),
    ]);
  }
  sA.setColumnWidths(1, colsA.length, 105); sA.setColumnWidth(4, 140); sA.setColumnWidth(6, 230); sA.setColumnWidth(5, 170);

  // ---------- Учні ----------
  const sU = sheet('Учні', 1);
  sU.clear(); sU.getFilter() && sU.getFilter().remove(); sU.clearConditionalFormatRules();
  const colsU = ['Клас', 'Учень', 'Звання', 'Досвід', 'Монети', 'Тем на 100 %', 'Середній % тем', 'Спроб', 'Спроб із ⚡', 'Сер. час на завдання, с', 'Серія днів (найкраща)', 'Значків', 'Остання активність'];
  header(sU, colsU, VIOLET);
  const uids = Object.keys(users).sort((a, b) => (users[a].cls + users[a].name).localeCompare(users[b].cls + users[b].name, 'uk'));
  const touchedTopics = TOPICS.map((t) => t[0]).filter((id) => uids.some((u) => progress[u] && progress[u][id]));
  const rowsU = uids.map((uid) => {
    const u = users[uid], my = attempts.filter((a) => a.uid === uid), p = progress[uid] || {};
    const pcts = touchedTopics.map((id) => (p[id] && p[id].pct) || 0);
    return [u.cls, u.name, rankOf(u.xp), u.xp || 0, u.coins || 0, pcts.filter((v) => v === 100).length,
      pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length / 100 : 0, my.length, my.filter((a) => a.flagged).length,
      my.length ? Math.round(my.reduce((s, a) => s + (a.avgSec || 0), 0) / my.length * 10) / 10 : '',
      (u.streak && u.streak.best) || 0, Object.keys(u.badges || {}).length,
      u.lastSeen ? Utilities.formatDate(new Date(u.lastSeen), tz, 'dd.MM.yyyy HH:mm') : '—'];
  });
  if (rowsU.length) {
    sU.getRange(2, 1, rowsU.length, colsU.length).setValues(rowsU);
    sU.getRange(2, 7, rowsU.length, 1).setNumberFormat('0%');
    sU.getRange(1, 1, rowsU.length + 1, colsU.length).createFilter();
    sU.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#f4c7c0', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMaxpointWithValue('#c9e88a', SpreadsheetApp.InterpolationType.NUMBER, '1').setRanges([sU.getRange(2, 7, rowsU.length, 1)]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setBackground('#fff1b8').setRanges([sU.getRange(2, 9, rowsU.length, 1)]).build(),
    ]);
  }
  sU.setColumnWidths(1, colsU.length, 110); sU.setColumnWidth(2, 150);

  // ---------- Прогрес (учень × тема) ----------
  const sP = sheet('Прогрес', 2);
  sP.clear(); sP.clearConditionalFormatRules();
  const colsP = ['Клас', 'Учень'].concat(touchedTopics.map((id) => TOPIC_TITLE[id]));
  header(sP, colsP, '#3f7a16');
  sP.getRange(1, 3, 1, Math.max(1, touchedTopics.length)).setTextRotation(60);
  sP.setRowHeight(1, 150);
  const rowsP = uids.map((uid) => [users[uid].cls, users[uid].name].concat(touchedTopics.map((id) => (((progress[uid] || {})[id] || {}).pct || 0) / 100)));
  if (rowsP.length && touchedTopics.length) {
    const r = sP.getRange(2, 3, rowsP.length, touchedTopics.length);
    sP.getRange(2, 1, rowsP.length, colsP.length).setValues(rowsP);
    r.setNumberFormat('0%').setHorizontalAlignment('center');
    sP.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#fdecea', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMidpointWithValue('#fbe9a6', SpreadsheetApp.InterpolationType.NUMBER, '0.6').setGradientMaxpointWithValue('#9fd36b', SpreadsheetApp.InterpolationType.NUMBER, '1').setRanges([r]).build()]);
  }
  sP.setColumnWidth(2, 150); touchedTopics.length && sP.setColumnWidths(3, touchedTopics.length, 64);

  // ---------- Теми: обери тему — побачиш результати всіх учнів ----------
  const sTD = sheet('Теми (дані)');
  sTD.clear();
  const colsT = ['Клас', 'Учень', '% теми', 'Рівень 1', 'Рівень 2', 'Рівень 3', 'Рівень 4', 'Рівень 5', 'Спроб', 'Спроб із ⚡', 'Сер. час на завдання, с', 'Остання спроба'];
  const rowsT = [];
  touchedTopics.forEach((id) => uids.forEach((uid) => {
    const p = (progress[uid] || {})[id] || {}, lv = p.levels || {};
    const my = attempts.filter((a) => a.uid === uid && a.topic === id);
    rowsT.push([TOPIC_TITLE[id], users[uid].cls, users[uid].name, (p.pct || 0) / 100]
      .concat([1, 2, 3, 4, 5].map((n) => (lv[n] ? lv[n].best : '')))
      .concat([my.length, my.filter((a) => a.flagged).length,
        my.length ? Math.round(my.reduce((s, a) => s + (a.avgSec || 0), 0) / my.length * 10) / 10 : '',
        my.length ? Utilities.formatDate(new Date(my[0].end), tz, 'dd.MM.yyyy HH:mm') : '']));
  }));
  sTD.getRange(1, 1, 1, colsT.length + 1).setValues([['Тема'].concat(colsT)]);
  if (rowsT.length) sTD.getRange(2, 1, rowsT.length, colsT.length + 1).setValues(rowsT);
  sTD.hideSheet();

  const sT = sheet('Теми', 2);
  const chosen = sT.getRange('B1').getValue() || (touchedTopics.length ? TOPIC_TITLE[touchedTopics[0]] : TOPICS[0][1]);
  sT.clear(); sT.clearConditionalFormatRules();
  sT.getRange('A1').setValue('Тема:').setFontWeight('bold').setFontSize(14);
  sT.getRange('B1').setValue(chosen).setFontWeight('bold').setFontSize(14).setBackground('#eef7d6')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TOPICS.map((t) => t[1]), true).build());
  sT.getRange('D1').setValue('← обери тему зі списку').setFontColor('#6b6577');
  sT.getRange(3, 1, 1, colsT.length).setValues([colsT]).setFontWeight('bold').setBackground('#3f7a16').setFontColor('#ffffff').setWrap(true).setVerticalAlignment('middle');
  sT.setFrozenRows(3); sT.setRowHeight(3, 38);
  renderTopic(sT);
  const nT = Math.max(uids.length, 1);
  sT.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#fdecea', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMidpointWithValue('#fbe9a6', SpreadsheetApp.InterpolationType.NUMBER, '0.6').setGradientMaxpointWithValue('#9fd36b', SpreadsheetApp.InterpolationType.NUMBER, '1').setRanges([sT.getRange(4, 3, nT, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#fdecea', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMidpointWithValue('#fbe9a6', SpreadsheetApp.InterpolationType.NUMBER, '6').setGradientMaxpointWithValue('#9fd36b', SpreadsheetApp.InterpolationType.NUMBER, '10').setRanges([sT.getRange(4, 4, nT, 5)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setBackground('#fff1b8').setRanges([sT.getRange(4, 10, nT, 1)]).build(),
  ]);
  sT.setColumnWidths(1, colsT.length, 95); sT.setColumnWidth(2, 260); sT.setColumnWidth(12, 140);

  // ---------- Моніторингові: учень × робота ----------
  const sM = sheet('Моніторингові', 3);
  sM.getFilter() && sM.getFilter().remove(); sM.clear(); sM.clearConditionalFormatRules();
  const colsM = ['Робота', 'Клас', 'Учень', 'Найкращий %', 'Останній %', 'Спроб', 'Спроб із ⚡', 'Сер. час на завдання, с', 'Остання спроба'];
  header(sM, colsM, '#7a3fb0');
  const mAgg = {};
  attempts.filter((a) => a.type === 'monitoring').forEach((a) => {
    const k = a.monitoringId + '~' + a.uid;
    const g = mAgg[k] || (mAgg[k] = { title: String(a.topicTitle || a.monitoringId).replace(/^Моніторингова робота:\s*/, ''), uid: a.uid, best: 0, n: 0, fast: 0, sec: 0, last: null });
    g.best = Math.max(g.best, a.pct || 0); g.n++; g.fast += a.flagged ? 1 : 0; g.sec += a.avgSec || 0;
    if (!g.last || a.end > g.last.end) g.last = a;
  });
  const rowsM = Object.keys(mAgg).map((k) => mAgg[k]).filter((g) => users[g.uid])
    .sort((a, b) => a.title.localeCompare(b.title, 'uk') || b.best - a.best)
    .map((g) => [g.title, users[g.uid].cls, users[g.uid].name, g.best / 100, (g.last.pct || 0) / 100, g.n, g.fast, Math.round(g.sec / g.n * 10) / 10, new Date(g.last.end)]);
  if (rowsM.length) {
    sM.getRange(2, 1, rowsM.length, colsM.length).setValues(rowsM);
    sM.getRange(2, 4, rowsM.length, 2).setNumberFormat('0%');
    sM.getRange(2, 9, rowsM.length, 1).setNumberFormat('dd.MM.yyyy HH:mm');
    sM.getRange(1, 1, rowsM.length + 1, colsM.length).createFilter();
    sM.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#fdecea', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMidpointWithValue('#fbe9a6', SpreadsheetApp.InterpolationType.NUMBER, '0.6').setGradientMaxpointWithValue('#9fd36b', SpreadsheetApp.InterpolationType.NUMBER, '1').setRanges([sM.getRange(2, 4, rowsM.length, 2)]).build()]);
  } else sM.getRange('A2').setValue('Моніторингових спроб ще немає');
  sM.setColumnWidths(1, colsM.length, 110); sM.setColumnWidth(1, 220); sM.setColumnWidth(3, 150); sM.setColumnWidth(9, 140);

  // ---------- Найдовші питання ----------
  const sQ = sheet('Найдовші питання', 3);
  sQ.clear(); sQ.getFilter() && sQ.getFilter().remove(); sQ.clearConditionalFormatRules();
  const colsQ = ['Тема', 'Завдання', 'Сер. час, с', 'Відповідей', 'Учнів', '% правильних'];
  header(sQ, colsQ, '#8a4b00');
  const agg = {};
  attempts.forEach((a) => (a.answers || []).forEach((x) => {
    const k = x.topic + '~' + x.id;
    const g = agg[k] || (agg[k] = { topic: x.topic, q: x.q, n: 0, sec: 0, ok: 0, us: {} });
    g.n++; g.sec += Math.min(x.sec || 0, MAX_SEC); g.ok += x.ok ? 1 : 0; g.us[a.uid] = 1;
  }));
  const rowsQ = Object.keys(agg).map((k) => agg[k]).map((g) => [TOPIC_TITLE[g.topic] || g.topic, g.q, Math.round(g.sec / g.n * 10) / 10, g.n, Object.keys(g.us).length, g.ok / g.n]).sort((a, b) => b[2] - a[2]).slice(0, 100);
  if (rowsQ.length) {
    sQ.getRange(2, 1, rowsQ.length, colsQ.length).setValues(rowsQ);
    sQ.getRange(2, 6, rowsQ.length, 1).setNumberFormat('0%');
    sQ.getRange(1, 1, rowsQ.length + 1, colsQ.length).createFilter();
    sQ.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().setGradientMinpoint('#ffffff').setGradientMaxpoint('#d9c4f2').setRanges([sQ.getRange(2, 3, rowsQ.length, 1)]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0.5).setFontColor('#c13f2c').setBold(true).setRanges([sQ.getRange(2, 6, rowsQ.length, 1)]).build(),
    ]);
  }
  sQ.setColumnWidth(1, 180); sQ.setColumnWidth(2, 520); sQ.getRange('B:B').setWrap(true);

  // ---------- Дашборд ----------
  const sD = sheet('Дашборд', 0);
  sD.clear(); sD.getCharts().forEach((c) => sD.removeChart(c));
  sD.getRange('A1').setValue('Українська мова · 5 клас — дашборд').setFontSize(18).setFontWeight('bold').setFontColor(INK);
  sD.getRange('A2').setValue('Оновлено: ' + Utilities.formatDate(new Date(), tz, 'dd.MM.yyyy HH:mm') + ' · учнів: ' + uids.length + ' · спроб: ' + attempts.length).setFontColor('#6b6577');
  // дані для графіків
  sD.getRange('A4:B4').setValues([['Тема', 'Середній %']]).setFontWeight('bold').setBackground(SURFACE);
  const byTopic = touchedTopics.map((id) => [TOPIC_TITLE[id], uids.length ? uids.reduce((s, u) => s + ((((progress[u] || {})[id] || {}).pct) || 0), 0) / uids.length / 100 : 0]);
  if (byTopic.length) sD.getRange(5, 1, byTopic.length, 2).setValues(byTopic).offset(0, 1, byTopic.length, 1).setNumberFormat('0%');
  const days = [];
  for (let i = 27; i >= 0; i--) days.push(Utilities.formatDate(new Date(Date.now() - i * 864e5), tz, 'dd.MM'));
  const cnt = {}; days.forEach((d) => (cnt[d] = 0));
  attempts.forEach((a) => { const d = Utilities.formatDate(new Date(a.end), tz, 'dd.MM'); if (d in cnt) cnt[d]++; });
  sD.getRange('D4:E4').setValues([['День', 'Спроб']]).setFontWeight('bold').setBackground(SURFACE);
  sD.getRange(5, 4, days.length, 2).setValues(days.map((d) => [d, cnt[d]]));
  const cls = {}; uids.forEach((u) => { const c = users[u].cls; (cls[c] = cls[c] || []).push(u); });
  sD.getRange('G4:H4').setValues([['Клас', 'Середній досвід']]).setFontWeight('bold').setBackground(SURFACE);
  const clsRows = Object.keys(cls).map((c) => [c, Math.round(cls[c].reduce((s, u) => s + (users[u].xp || 0), 0) / cls[c].length)]);
  if (clsRows.length) sD.getRange(5, 7, clsRows.length, 2).setValues(clsRows);

  if (byTopic.length) sD.insertChart(sD.newChart().asBarChart().addRange(sD.getRange(4, 1, byTopic.length + 1, 2)).setPosition(4, 10, 0, 0)
    .setOption('title', 'Середній прогрес за темами').setOption('colors', [LIME]).setOption('legend', { position: 'none' }).setOption('hAxis', { format: 'percent', viewWindow: { min: 0, max: 1 } }).setOption('width', 620).setOption('height', 320).build());
  sD.insertChart(sD.newChart().asColumnChart().addRange(sD.getRange(4, 4, days.length + 1, 2)).setPosition(22, 10, 0, 0)
    .setOption('title', 'Активність: спроб на день (4 тижні)').setOption('colors', [VIOLET]).setOption('legend', { position: 'none' }).setOption('width', 620).setOption('height', 300).build());
  if (clsRows.length) sD.insertChart(sD.newChart().asColumnChart().addRange(sD.getRange(4, 7, clsRows.length + 1, 2)).setPosition(38, 10, 0, 0)
    .setOption('title', 'Середній досвід класу').setOption('colors', [YELLOW]).setOption('legend', { position: 'none' }).setOption('width', 620).setOption('height', 280).build());
  sD.setColumnWidth(1, 220);
}

// Вкладка «Теми»: показати рядки обраної в B1 теми (без формул — вони ламаються від мовних налаштувань)
function renderTopic(sT) {
  const title = sT.getRange('B1').getValue();
  const data = SpreadsheetApp.getActive().getSheetByName('Теми (дані)').getDataRange().getValues().slice(1);
  const rows = data.filter((r) => r[0] === title).map((r) => r.slice(1));
  const last = Math.max(sT.getLastRow(), 4);
  sT.getRange(4, 1, last - 3, 12).clearContent();
  if (rows.length) {
    sT.getRange(4, 1, rows.length, rows[0].length).setValues(rows);
    sT.getRange(4, 3, rows.length, 1).setNumberFormat('0%');
    sT.getRange(4, 12, rows.length, 1).setNumberFormat('dd.MM.yyyy HH:mm');
  } else sT.getRange('A4').setValue('З цієї теми ще немає результатів');
}

// Коли вчитель обирає іншу тему в B1 — одразу перемальовуємо
function onEdit(e) {
  if (!e || !e.range) return; // запуск вручну з редактора — нічого не робимо
  const sh = e.range.getSheet();
  if (sh.getName() === 'Теми' && e.range.getA1Notation() === 'B1') renderTopic(sh);
}

// ---------- Звіт одного учня в PDF ----------
function reportDialog() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Звіт учня', 'Впиши ім’я учня так, як у таблиці (наприклад: Оля К.)', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const url = makeReport(r.getResponseText().trim());
  ui.alert('Звіт готовий', 'PDF збережено на твоєму Диску в теці «Звіти учнів»:\n' + url, ui.ButtonSet.OK);
}

function makeReport(name) {
  const ss = SpreadsheetApp.getActive(), tz = Session.getScriptTimeZone();
  const users = fetchDb('users'), progress = fetchDb('progress'), attemptsRaw = fetchDb('attempts');
  const uid = Object.keys(users).find((k) => users[k].name.toLowerCase() === name.toLowerCase());
  if (!uid) throw new Error('Учня «' + name + '» не знайдено');
  const u = users[uid], p = progress[uid] || {};
  const at = Object.keys(attemptsRaw[uid] || {}).map((k) => attemptsRaw[uid][k]).sort((a, b) => b.end - a.end);
  const topics = TOPICS.filter((t) => p[t[0]]);

  const sh = ss.insertSheet('Звіт · ' + u.name);
  sh.setHiddenGridlines(true);
  sh.setColumnWidths(1, 4, 160);
  sh.getRange('A1:D1').merge().setValue('Звіт про навчання · Українська мова, 5 клас').setFontColor('#6b6577');
  sh.getRange('A2:D2').merge().setValue(u.name + ' · клас ' + u.cls).setFontSize(22).setFontWeight('bold');
  sh.getRange('A3:D3').merge().setValue('Звання: ' + rankOf(u.xp) + ' · досвід: ' + (u.xp || 0) + ' · сформовано ' + Utilities.formatDate(new Date(), tz, 'dd.MM.yyyy')).setFontColor(VIOLET).setFontWeight('bold');
  sh.getRange('A4:D4').merge().setBackground(LIME);
  sh.setRowHeight(4, 6);
  let row = 6;
  sh.getRange(row, 1, 1, 4).setValues([['Тема', 'Прогрес', 'Спроб', 'Оцінка']]).setFontWeight('bold').setBackground(SURFACE); row++;
  topics.forEach((t) => {
    const v = p[t[0]].pct || 0;
    const n = at.filter((a) => a.topic === t[0]).length;
    sh.getRange(row, 1, 1, 4).setValues([[t[1], v / 100, n, v >= 80 ? '💪 сильна тема' : v >= 60 ? '👍 добре' : '🎯 повторити']]);
    sh.getRange(row, 2).setNumberFormat('0%').setBackground(v >= 80 ? '#c9e88a' : v >= 60 ? '#fbe9a6' : '#f4c7c0');
    row++;
  });
  row++;
  sh.getRange(row, 1, 1, 4).setValues([['Дата', 'Що', 'Результат', 'Швидкість']]).setFontWeight('bold').setBackground(SURFACE); row++;
  at.slice(0, 20).forEach((a) => {
    sh.getRange(row, 1, 1, 4).setValues([[Utilities.formatDate(new Date(a.end), tz, 'dd.MM.yyyy'), (a.topic ? (TOPIC_TITLE[a.topic] || a.topicTitle) + (a.level ? ', рівень ' + a.level : '') : a.topicTitle), a.pct + '% (' + a.correct + '/' + a.total + ')', a.avgSec + ' с/завд.' + (a.flagged ? ' ⚡' : '')]]);
    row++;
  });
  SpreadsheetApp.flush();

  const exportUrl = ss.getUrl().replace(/edit.*$/, '') + 'export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&printtitle=false&sheetnames=false&gid=' + sh.getSheetId();
  const blob = UrlFetchApp.fetch(exportUrl, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob().setName('Звіт — ' + u.name + '.pdf');
  const folders = DriveApp.getFoldersByName('Звіти учнів');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Звіти учнів');
  const file = folder.createFile(blob);
  ss.deleteSheet(sh);
  return file.getUrl();
}
