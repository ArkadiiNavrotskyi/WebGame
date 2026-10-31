'use strict';
// «Ясные зори» — детский санаторий в Карелии, белые ночи 1979 года. Все часы остановились в 4:44.
// Один — в главном корпусе (палата, рекреация, игровая, кабинет Зорина, солярий), другой — в водолечебнице
// (бассейн, раздевалка, котельная, лаборатория сна, архив). Предметы ездят по монорельсу лекарственной тележкой.
(() => {
  const HA = window.HouseArt;
  const RAIL_OPT = ['←', '↑', '→'];
  const RAIL = '←,→,↑,→';
  const VALVES = [{ id: 'bottom', l: 'Донный клапан' }, { id: 'pump', l: 'Насос' }, { id: 'in', l: 'Подача воды' }, { id: 'out', l: 'Сброс' }];
  const DRAIN = ['in', 'out', 'pump', 'bottom'];
  const EEG_CH = ['Δ дельта', 'Θ тета', 'α альфа', 'β бета'];
  const EEG_VAL = ['2', '6', '10', '20'];
  const EEG = '20,10,2,6';
  const DRAWERS = ['А–Б', 'В–Г', 'Д–Ж', 'З–И', 'К–Л', 'М–Н', 'О–П', 'Р–С', 'Т–Я'];
  const WINDOWS = '1,3,4';
  const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';

  const ROOM_NAME = { ward: 'Палата № 14', corridor: 'Рекреация', playroom: 'Игровая', office: 'Кабинет доктора Зорина', solarium: 'Солярий на крыше', pool: 'Бассейн', locker: 'Раздевалка', boiler: 'Котельная', lab: 'Лаборатория сна', archive: 'Архив', dream: 'Белая комната' };
  const AREA = { up: ['ward', 'corridor', 'playroom', 'office', 'solarium'], down: ['pool', 'locker', 'boiler', 'lab', 'archive'] };
  const OPEN = { ward: () => true, corridor: () => true, playroom: () => true, solarium: () => true, office: (S) => S.f.office, pool: () => true, locker: () => true, boiler: () => true, lab: (S) => S.f.lab, archive: (S) => S.f.archive };
  const CH = ['', 'Глава I. Белая ночь', 'Глава II. Процедуры', 'Глава III. Лаборатория сна', 'Глава IV. Вера', 'Глава V. Пробуждение'];

  const INTRO = [
    ['gate', 'Карелия, июнь. Белая ночь: солнце едва касается озера и снова поднимается. За соснами — ворота детского санатория «Ясные зори». Закрыт в 1979 году.'],
    ['voucher', 'Вам пришли две путёвки. «Курс лечебного сна, заезд 21 июня 1979 года». Внизу подпись главврача: «Л. Зорин». И приписка детским почерком: «Приезжайте, пожалуйста. Я не могу проснуться».'],
    ['clock', 'Вы заснули в автобусе — и проснулись уже внутри. Все часы в санатории стоят. На всех — без шестнадцати пять. 4:44.'],
    ['split', '{up} — в главном корпусе, в детской палате. {down} — в водолечебнице, у пустого бассейна. Галерею между корпусами завалило. Слышно друг друга только по старому радиоузлу.'],
  ];
  const OUTRO = [
    ['dream', 'Метроном застучал, и в ту же секунду большие часы над бассейном пошли. По всему санаторию — в палатах, в кабинетах, в архиве — часы сдвинулись с 4:44.'],
    ['dream', 'Белая комната. На кровати — девочка в больничной рубашке. Она открыла глаза и потянулась, как будто проспала одну ночь, а не сорок семь лет.'],
    ['dawn', '«Вы пришли, — сказала Вера. — Я так долго звала». Она взяла вас обоих за руки и повела к окну. Над озером вставало солнце — настоящее, не белая ночь.'],
    ['dawn', 'Вы проснулись в автобусе у ворот. В кармане у каждого — детский рисунок: домик, солнце и три фигурки. На обороте: «Спасибо. Теперь я сплю спокойно».'],
    ['end', ''],
  ];

  // ================= Предметы =================
  const ITEMS = {
    fuse: { n: 'Пробка-предохранитель', d: 'Фарфоровая пробка на 25 ампер. Целая.' },
    trowel: { n: 'Совок', d: 'Детский металлический совок, зелёный, облупленный.' },
    key_office: { n: 'Ключ «Главврач»', d: 'Ключ с картонной биркой «Кабинет гл. врача».' },
    key_lab: { n: 'Ключ лаборатории', d: 'Ключ с биркой «Лаб. сна. Не входить во время сеанса».' },
    tape: { n: 'Бобина плёнки', d: 'Магнитофонная бобина. На коробке: «Сеанс 47. В. Л.».' },
    key_a: { n: 'Ключ метронома', d: 'Маленький латунный ключик-бабочка. Заводит метроном.' },
    key_b: { n: 'Ключ от часов', d: 'Большой заводной ключ от башенных часов.' },
  };
  const TAKE = {
    fuse: (S) => S.f.locker, trowel: (S) => S.f.locker, key_office: (S) => S.f.drain, key_lab: (S) => S.f.drawer, tape: (S) => S.f.eeg, key_a: (S) => S.f.dig, key_b: (S) => S.f.file,
  };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const metal = (a, b) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const key = (c, tag) => { g.fillStyle = c; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill(); g.fillStyle = c; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12); if (tag) { g.fillStyle = tag; g.fillRect(s * 0.1, s * 0.12, s * 0.22, s * 0.16); } };
    switch (id) {
      case 'fuse': g.fillStyle = '#e8e4dc'; g.beginPath(); g.arc(s / 2, s * 0.4, s * 0.22, 0, TAU); g.fill(); g.fillStyle = '#b08a3a'; g.fillRect(s * 0.4, s * 0.58, s * 0.2, s * 0.24); g.fillStyle = '#c83030'; g.beginPath(); g.arc(s / 2, s * 0.4, s * 0.06, 0, TAU); g.fill(); break;
      case 'trowel': g.fillStyle = '#3a8a4a'; g.beginPath(); g.moveTo(s * 0.5, s * 0.1); g.quadraticCurveTo(s * 0.78, s * 0.3, s * 0.6, s * 0.55); g.lineTo(s * 0.4, s * 0.55); g.quadraticCurveTo(s * 0.22, s * 0.3, s * 0.5, s * 0.1); g.fill(); g.fillStyle = '#8a5a2a'; g.fillRect(s * 0.45, s * 0.55, s * 0.1, s * 0.35); break;
      case 'key_office': key(metal('#f0d890', '#5a4214'), '#e8e0c8'); break;
      case 'key_lab': key(metal('#a8a8b0', '#2a2a30'), '#c83030'); break;
      case 'tape': g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.36, 0, TAU); g.fill(); g.fillStyle = '#5a3a20'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.28, 0, TAU); g.fill(); g.fillStyle = '#c8c8c8'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.1, 0, TAU); g.fill(); g.fillStyle = '#2a2a2a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s / 2 + Math.cos(i * 2.1) * s * 0.06, s / 2 + Math.sin(i * 2.1) * s * 0.06, s * 0.025, 0, TAU); g.fill(); } break;
      case 'key_a': g.fillStyle = metal('#f0d890', '#5a4214'); g.beginPath(); g.ellipse(s * 0.32, s * 0.4, s * 0.16, s * 0.1, -0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(s * 0.32, s * 0.62, s * 0.16, s * 0.1, 0.5, 0, TAU); g.fill(); g.fillRect(s * 0.4, s * 0.47, s * 0.42, s * 0.08); break;
      case 'key_b': g.fillStyle = metal('#a8a8b0', '#2a2a30'); g.fillRect(s * 0.2, s * 0.44, s * 0.6, s * 0.12); g.fillRect(s * 0.15, s * 0.25, s * 0.1, s * 0.5); g.fillRect(s * 0.75, s * 0.38, s * 0.12, s * 0.24); break;
    }
  }

  // ================= Иллюстрации =================
  const paper = (g, w, h, c = '#d8ccb0') => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,20,0.06)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * w * 0.06, 0, TAU); g.fill(); } };
  const IMG = {
    rail: (g, w, h) => {
      g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a2a4a'; g.textAlign = 'center'; g.font = `700 ${h * 0.065}px 'PT Mono', monospace`; g.fillText('ЛЕКАРСТВЕННАЯ ЛИНИЯ', w / 2, h * 0.1);
      g.font = `${h * 0.045}px 'PT Mono', monospace`; g.fillText('водолечебница → главный корпус', w / 2, h * 0.17);
      g.strokeStyle = '#1a2a4a'; g.lineWidth = 4; const y0 = h * 0.55; g.beginPath(); g.moveTo(w * 0.05, y0); g.lineTo(w * 0.95, y0); g.stroke();
      const dirs = RAIL.split(','), lab = ['прачечная', 'кухня', 'аптека', 'изолятор'];
      dirs.forEach((d, i) => {
        const x = w * (0.18 + i * 0.22); g.fillStyle = '#c83030'; g.beginPath(); g.arc(x, y0, 9, 0, TAU); g.fill(); g.fillStyle = '#1a2a4a'; g.fillText('стрелка ' + (i + 1), x, y0 - h * 0.08);
        g.strokeStyle = 'rgba(26,42,74,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (i % 2 ? -1 : 1) * w * 0.06, y0 + h * 0.2); g.stroke(); g.fillText(lab[i], x + (i % 2 ? -1 : 1) * w * 0.06, y0 + h * 0.27);
        g.font = `700 ${h * 0.08}px 'PT Mono', monospace`; g.fillStyle = '#c83030'; g.fillText(d, x, y0 + h * 0.1); g.font = `${h * 0.045}px 'PT Mono', monospace`;
      });
      g.fillStyle = '#1a2a4a'; g.fillText('Положение стрелок для главного корпуса — красным.', w / 2, h * 0.94);
    },
    drawing: (g, w, h) => {
      g.fillStyle = '#f0ece0'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#3a3aa8'; g.lineWidth = 4; g.strokeRect(w * 0.3, h * 0.42, w * 0.4, h * 0.38); g.beginPath(); g.moveTo(w * 0.26, h * 0.44); g.lineTo(w * 0.5, h * 0.2); g.lineTo(w * 0.74, h * 0.44); g.stroke();
      [[0.36, 0.5], [0.56, 0.5], [0.36, 0.64], [0.56, 0.64], [0.46, 0.5], [0.46, 0.64]].forEach(([x, y], i) => { const on = WINDOWS.split(',').includes(String(i + 1)); g.fillStyle = on ? '#f0c030' : '#f0ece0'; g.fillRect(w * x, h * y, w * 0.07, h * 0.09); g.strokeStyle = '#3a3aa8'; g.lineWidth = 2; g.strokeRect(w * x, h * y, w * 0.07, h * 0.09); g.fillStyle = '#c83030'; g.font = `${h * 0.04}px sans-serif`; g.textAlign = 'center'; g.fillText(i + 1, w * (x + 0.035), h * (y - 0.01)); });
      g.fillStyle = '#f0c030'; g.beginPath(); g.arc(w * 0.85, h * 0.15, h * 0.08, 0, TAU); g.fill();
      [0.15, 0.82, 0.88].forEach((x, i) => HA.stick(g, w * x, h * 0.85, h * (i ? 0.05 : 0.04), '#c83030'));
      g.fillStyle = '#3a3aa8'; g.font = `${h * 0.06}px 'Marck Script', cursive`; g.textAlign = 'left'; g.fillText('Вера, 12 лет', w * 0.05, h * 0.96);
    },
    secret: (g, w, h) => {
      paper(g, w, h, '#ece4cc');
      g.fillStyle = '#3a3aa8'; g.font = `${h * 0.07}px 'Marck Script', cursive`; g.textAlign = 'center'; g.fillText('где мой секретик', w / 2, h * 0.12);
      for (let i = 0; i < 5; i++) { const x = w * (0.12 + i * 0.19); g.fillStyle = '#8a5a3a'; g.fillRect(x - w * 0.06, h * 0.55, w * 0.12, h * 0.18); g.fillStyle = '#3a8a4a'; g.beginPath(); g.arc(x, h * 0.48, w * 0.07, 0, TAU); g.fill(); }
      g.strokeStyle = '#c83030'; g.lineWidth = 4; const sx = w * (0.12 + 3 * 0.19); g.beginPath(); g.moveTo(sx - 18, h * 0.78); g.lineTo(sx + 18, h * 0.9); g.moveTo(sx + 18, h * 0.78); g.lineTo(sx - 18, h * 0.9); g.stroke();
      g.fillStyle = '#3a3aa8'; g.font = `${h * 0.05}px 'Marck Script', cursive`; g.fillText('считать от двери, где солнце встаёт', w / 2, h * 0.98);
      g.fillStyle = '#f0c030'; g.beginPath(); g.arc(w * 0.06, h * 0.25, h * 0.05, 0, TAU); g.fill(); g.fillStyle = '#3a3aa8'; g.font = `${h * 0.04}px sans-serif`; g.fillText('дверь', w * 0.06, h * 0.36);
    },
    eeg: (g, w, h) => {
      g.fillStyle = '#ece8dc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(200,60,60,0.25)'; for (let x = 0; x < w; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      const word = 'РАЗБУДИТЕ МЕНЯ'; g.strokeStyle = '#1a1a3a'; g.lineWidth = 2;
      for (let ch = 0; ch < 4; ch++) { const y0 = h * (0.15 + ch * 0.17); g.beginPath(); for (let x = 0; x < w; x += 2) g.lineTo(x, y0 + Math.sin(x * (0.05 + ch * 0.07)) * (6 + ch * 2) + Math.sin(x * 0.31 + ch) * 3); g.stroke(); }
      g.fillStyle = '#1a1a3a'; g.font = `700 ${h * 0.09}px 'PT Mono', monospace`; g.textAlign = 'center'; g.globalAlpha = 0.85; g.fillText(word, w / 2, h * 0.9); g.globalAlpha = 1;
    },
  };

  // ================= Документы =================
  const DOCS = {
    clock: { t: 'Часы над дверью', k: 'paper', text: 'Круглые часы «Янтарь». Стоят. Без шестнадцати пять — 4:44.\n\nСекундная стрелка дрожит на месте, как будто пытается сдвинуться и не может.' },
    bedcard: { t: 'Карта на спинке кровати', k: 'typed', text: 'САНАТОРИЙ «ЯСНЫЕ ЗОРИ» · ПАЛАТА 14 · КОЙКА 3\n\nЛунёва Вера, 12 лет\nИстория болезни № 0714\nДиагноз: ночные страхи, бессонница.\nНазначено: курс лечебного сна (д-р Зорин Л. М.).\n\nКровать застелена. Подушка ещё тёплая.' },
    drawing: { t: 'Рисунок на тумбочке', k: 'paper', text: 'Детский рисунок фломастерами: озеро, сосны и большая белая луна. Подпись: «Белая ночь. Мне тут не страшно, только скучно спать».' },
    routine: { t: 'Распорядок дня', k: 'typed', text: 'РАСПОРЯДОК ДНЯ\n\n7:00 — подъём\n7:15 — зарядка\n8:00 — завтрак\n9:00 — процедуры (водолечебница)\n13:00 — обед\n14:00 — тихий час\n21:00 — отбой\n\nЛечебный сон — по назначению врача, в лаборатории.' },
    drain_memo: { t: 'Памятка на посту медсестры', k: 'typed', text: 'СЛИВ БАССЕЙНА (для банщика)\n\n1. Закрыть подачу воды.\n2. Открыть сброс.\n3. Включить насос.\n4. Только потом — донный клапан!\nИначе насос сорвёт.\n\n(вентили — в котельной водолечебницы)' },
    rail: { t: 'Схема на стене бассейна', k: 'img', img: 'rail', ratio: 0.6, cap: 'Схема лекарственной линии под потолком. Тележка ездит между корпусами.' },
    locker: { t: 'Табличка на шкафчике', k: 'hand', text: 'Шкафчик персонала. Кодовый замок.\n\nКто-то приписал карандашом: «Откроется в тот час, когда всё остановилось».' },
    cap: { t: 'Резиновая шапочка', k: 'paper', text: 'Белая купальная шапочка с ромашками. Изнутри, химическим карандашом: «ВЕРА Л., палата 14».' },
    journal: { t: 'Журнал опытов д-ра Зорина', k: 'typed', text: 'ЖУРНАЛ ЛЕЧЕБНОГО СНА · Л. М. ЗОРИН\n\nНорма сна: дельта — 2 Гц, тета — 6, альфа — 10, бета — 20.\n\n21.06.79, сеанс 47, В. Л.\n4:44 — ритмы перепутались: дельта — 20, тета — 10, альфа — 2, бета — 6. Девочка не реагирует на метроном.\n4:50 — все часы в корпусе остановились.\n\nЕсли повторить её ритм на энцефалографе — может быть, она услышит нас.' },
    eeg: { t: 'Лента энцефалографа', k: 'img', img: 'eeg', ratio: 0.5, cap: 'Самописец сам начал чертить. Волны сложились в буквы.' },
    session: { t: 'Плёнка «Сеанс 47»', k: 'typed', text: '— Вера, ты меня слышишь? Метроном стучит: раз… два… три… Ты засыпаешь…\n— Доктор, а если я не проснусь?\n— Проснёшься. Когда часы пойдут и метроном застучит — одновременно, слышишь? — ты откроешь глаза.\n— А если часы остановятся?\n— …\n\n(шорох, щелчок, голос Зорина — тише, как будто он один)\n— Часы встали. Все. Её история — в архиве, в карточке. Ключ от больших часов я положил туда же. Ключ метронома она спрятала сама. Куда — знает только её кукольный домик.' },
    vera_file: { t: 'История болезни № 0714', k: 'typed', text: 'ЛУНЁВА ВЕРА · 12 лет · ИСТОРИЯ БОЛЕЗНИ № 0714\n\nПоступила 1 июня 1979. Ночные страхи: боится темноты.\nДома оставляет свет в окнах кукольного домика — в окнах 1, 3 и 4 («мама, папа и я»). С этим засыпает спокойно.\n\nЗапись Зорина, 22.06.79: «Сон не прерывается. Пульс ровный. Она улыбается. Я не знаю, как её разбудить».\n\nВ конверт вложен заводной ключ от часов над бассейном.' },
    secret: { t: 'Записка из кукольного домика', k: 'img', img: 'secret', ratio: 0.6, cap: 'Сложенная вчетверо записка была на чердаке домика.' },
  };

  // ================= Логика =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { office: 'key_office', lab: 'key_lab' };
  const ACT = {
    unlock(S, who, door) { const n = UNLOCK[door]; if (!n || S.f[door] || !has(S, who, n)) return null; rm(S, who, n); S.f[door] = 1; return ok(who, 'Ключ повернулся.', 'door'); },
    locker(S, who, v) { if (S.f.locker) return null; if (v === '0444') { S.f.locker = 1; return ok(who, 'Замок шкафчика щёлкнул.', 'click'); } return bad(who); },
    power(S, who) { if (S.f.power || !has(S, who, 'fuse')) return null; rm(S, who, 'fuse'); S.f.power = 1; return { a: 'power', who }; },
    rail(S, who, v) { if (S.f.rail || !S.f.power) return null; if (v === RAIL) { S.f.rail = 1; return { a: 'rail', who }; } return bad(who); },
    drain(S, who, v) { if (S.f.drain || !S.f.power) return null; if (Array.isArray(v) && v.join() === DRAIN.join()) { S.f.drain = 1; return { a: 'drain', who }; } return bad(who); },
    drawer(S, who, v) { if (S.f.drawer) return null; if (v === 'ВЕРА') { S.f.drawer = 1; return ok(who, 'Буквенный замок ящика щёлкнул.', 'click'); } return bad(who); },
    eeg(S, who, v) { if (S.f.eeg || !S.f.power) return null; if (v === EEG) { S.f.eeg = 1; return { a: 'eeg', who }; } return bad(who); },
    tape(S, who) { if (S.f.tape || !has(S, who, 'tape')) return null; rm(S, who, 'tape'); S.f.tape = 1; return { a: 'tape', who }; },
    archive(S, who, v) { if (S.f.archive) return null; if (v === '0714') { S.f.archive = 1; return ok(who, 'Дверь архива отъехала.', 'door'); } return bad(who); },
    file(S, who, v) { if (S.f.file || !S.f.tape) return null; if (Array.isArray(v) && v[0] === 'К–Л') { S.f.file = 1; return ok(who, 'В ящике «К–Л» — пухлая карта Лунёвой В. и тяжёлый конверт.', 'drawer'); } return bad(who); },
    house(S, who, v) { if (S.f.house || !S.f.file) return null; if (v === WINDOWS) { S.f.house = 1; return ok(who, 'В окнах домика загорелся свет. Крыша приподнялась — на чердаке записка.', 'chime'); } return bad(who); },
    dig(S, who, v) { if (S.f.dig || !S.f.house || !has(S, who, 'trowel')) return null; if (v === '4') { S.f.dig = 1; return ok(who, 'Совок звякнул о стекло. Под ним — «секретик»: фантики, бусина и латунный ключик.', 'take'); } return bad(who); },
  };
  const chapterOf = (S) => (!(S.f.power && S.f.rail) ? 1 : !S.f.eeg ? 2 : !S.f.file ? 3 : !S.f.dig ? 4 : 5);
  const HINTS = [
    [(S) => !S.f.locker, 'Внизу шкафчик открывается «в тот час, когда всё остановилось». Посмотри на часы в палате.', 'Шкафчик в раздевалке: спроси, что показывают часы в палате наверху.'],
    [(S) => !S.f.power, 'Внизу нужно вкрутить пробку в щиток котельной.', 'Пробка из шкафчика — в электрощиток котельной.'],
    [(S) => !S.f.rail, 'Рычаги стрелок в рекреации. Схема с положениями висит у бассейна внизу.', 'Продиктуй наверх положения стрелок со схемы у бассейна (красные стрелки).'],
    [(S) => !S.f.drain, 'На посту медсестры памятка, как слить бассейн. Прочитай её вниз.', 'Вентили в котельной: порядок — в памятке у того, кто наверху.'],
    [(S) => !S.f.office, 'Ключ от кабинета Зорина — на дне слитого бассейна. Попроси прислать тележкой.', 'Отправь ключ «Главврач» со дна бассейна наверх тележкой.'],
    [(S) => !S.f.drawer, 'Ящик стола: буквенный замок, «имя той, кто спит». Внизу нашли шапочку с именем.', 'Прочитай наверх, что написано внутри шапочки со дна бассейна.'],
    [(S) => !S.f.lab, 'Отправь ключ лаборатории вниз.', 'Ключ от лаборатории — у того, кто открыл ящик Зорина.'],
    [(S) => !S.f.eeg, 'В журнале Зорина записаны ритмы Веры в 4:44. Продиктуй их вниз.', 'Энцефалограф: выставь ритмы так, как записано в журнале Зорина (он наверху).'],
    [(S) => !S.f.tape, 'Бобина из лаборатории — в магнитофон в кабинете Зорина. Попроси прислать.', 'Отправь бобину наверх — там магнитофон.'],
    [(S) => !S.f.archive, 'Дверь архива внизу: код — номер истории болезни. Он на карте у кровати Веры.', 'Код архива — номер истории болезни Веры. Карта висит на кровати в палате наверху.'],
    [(S) => !S.f.file, 'В архиве — ящики картотеки по буквам. Скажи вниз фамилию Веры.', 'Нужен ящик картотеки по фамилии Веры — она на карте у кровати наверху.'],
    [(S) => !S.f.house, 'Кукольный домик в игровой: какие окна светились у Веры? Это записано в её истории болезни внизу.', 'Прочитай наверх из истории болезни, какие окна домика зажигала Вера.'],
    [(S) => !S.f.dig, 'Секретик на солярии: под какой кадкой — по записке из домика. Совок внизу, в раздевалке.', 'Отправь наверх совок из раздевалки.'],
    [(S) => !(S.f.insA && S.f.insB), 'Ключ метронома — в метроном в кабинете Зорина.', 'Ключ от часов — в большие часы над бассейном.'],
    [() => true, 'Заводите одновременно: «три, два, один — сейчас!»', 'Заводите одновременно: «три, два, один — сейчас!»'],
  ];

  // ================= Сцены =================
  const ART = (g, w, hh, key, K) => {
    const { fog, sky } = K;
    const pines = (y, c, n = 14) => { g.fillStyle = c; for (let i = 0; i < n; i++) { const x = (i / n) * w + (i % 3) * 9, s = hh * (0.12 + (i % 4) * 0.03); g.beginPath(); g.moveTo(x, y - s); g.lineTo(x - s * 0.3, y); g.lineTo(x + s * 0.3, y); g.fill(); } };
    const building = (x, y, s, lit) => { g.fillStyle = '#e8e2d4'; g.fillRect(x, y - s * 0.5, s * 1.6, s * 0.5); g.fillStyle = '#c8c0b0'; g.fillRect(x + s * 0.6, y - s * 0.65, s * 0.4, s * 0.15); for (let i = 0; i < 4; i++) g.fillRect(x + s * (0.65 + i * 0.1), y - s * 0.5, s * 0.04, s * 0.5); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { g.fillStyle = lit && i === 4 && j === 0 ? '#f0d890' : '#5a6878'; g.fillRect(x + s * (0.08 + i * 0.25), y - s * (0.42 - j * 0.2), s * 0.1, s * 0.12); } };
    switch (key) {
      case 'gate': case 'dawn': {
        const d = key === 'dawn';
        sky(d ? '#f0c8a0' : '#c8c0d8', d ? '#f8e0b0' : '#e8d8d0');
        g.fillStyle = d ? 'rgba(255,220,150,0.9)' : 'rgba(255,240,220,0.6)'; g.beginPath(); g.arc(w * 0.75, hh * 0.55, hh * 0.06, 0, TAU); g.fill();
        g.fillStyle = d ? '#c8a888' : '#a8a8c0'; g.fillRect(0, hh * 0.58, w, hh * 0.1);
        pines(hh * 0.62, d ? '#3a4a3a' : '#2a3040', 18);
        building(w * 0.3, hh * 0.78, hh * 0.32, !d);
        g.fillStyle = '#20242a'; g.fillRect(0, hh * 0.78, w, hh * 0.22);
        if (!d) { g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); g.arc(w * 0.2, hh * 0.78, hh * 0.18, Math.PI, 0); g.stroke(); g.fillStyle = '#1a1a1a'; g.font = `700 ${hh * 0.03}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('ЯСНЫЕ ЗОРИ', w * 0.2, hh * 0.58); }
        else { g.globalAlpha = 0.5; HA.stick(g, w * 0.55, hh * 0.9, hh * 0.035, '#20242a'); HA.stick(g, w * 0.6, hh * 0.9, hh * 0.035, '#20242a'); HA.stick(g, w * 0.575, hh * 0.92, hh * 0.025, '#20242a'); g.globalAlpha = 1; }
        fog(); break;
      }
      case 'voucher':
        sky('#14100c', '#0a0806');
        g.save(); g.translate(w / 2, hh / 2); g.rotate(0.03); g.fillStyle = '#e8dcc0'; g.fillRect(-w * 0.32, -hh * 0.4, w * 0.64, hh * 0.8);
        g.fillStyle = '#3a6a8a'; g.fillRect(-w * 0.32, -hh * 0.4, w * 0.64, hh * 0.1); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 ${hh * 0.05}px 'PT Mono', monospace`; g.fillText('ПУТЁВКА · «ЯСНЫЕ ЗОРИ»', 0, -hh * 0.33);
        g.fillStyle = '#2a1e14'; g.font = `${hh * 0.045}px 'PT Mono', monospace`; ['Курс: лечебный сон', 'Заезд: 21.06.1979', 'Главврач: Л. Зорин'].forEach((l, i) => g.fillText(l, 0, -hh * (0.18 - i * 0.09)));
        g.fillStyle = '#3a3aa8'; g.font = `${hh * 0.06}px 'Marck Script', cursive`; g.fillText('«Приезжайте, пожалуйста.', 0, hh * 0.18); g.fillText('Я не могу проснуться»', 0, hh * 0.27);
        g.restore(); break;
      case 'clock': {
        sky('#2a2e38', '#141820');
        g.save(); g.translate(w / 2 - hh * 0.25, hh * 0.18); HA.clockFace(4, 44)(g, hh * 0.5, hh * 0.5); g.restore();
        fog(); break;
      }
      case 'split':
        sky('#a8a8c0', '#d8d0d8');
        building(w * 0.05, hh * 0.75, hh * 0.3, true); g.fillStyle = '#5a5a68'; g.fillRect(w * 0.55, hh * 0.55, w * 0.38, hh * 0.2); g.fillStyle = '#7a8a9a'; for (let i = 0; i < 5; i++) g.fillRect(w * (0.57 + i * 0.07), hh * 0.58, w * 0.04, hh * 0.08);
        g.fillStyle = '#4a4440'; g.beginPath(); g.moveTo(w * 0.53, hh * 0.75); g.lineTo(w * 0.47, hh * 0.6); g.lineTo(w * 0.44, hh * 0.68); g.lineTo(w * 0.4, hh * 0.62); g.lineTo(w * 0.38, hh * 0.75); g.fill();
        g.fillStyle = '#20242a'; g.fillRect(0, hh * 0.75, w, hh * 0.25);
        fog(); break;
      case 'dream': {
        g.fillStyle = '#e8eaf0'; g.fillRect(0, 0, w, hh);
        const gr = g.createRadialGradient(w / 2, hh * 0.55, 0, w / 2, hh * 0.55, w * 0.5); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(180,190,210,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
        g.fillStyle = '#c8ccd8'; g.fillRect(w * 0.32, hh * 0.62, w * 0.36, hh * 0.08); g.fillStyle = '#f8f8fc'; g.fillRect(w * 0.33, hh * 0.58, w * 0.34, hh * 0.05);
        g.globalAlpha = 0.6; HA.figure(g, w * 0.42, hh * 0.6, hh * 0.06, '#d8dce8', '#f0e8e0'); g.globalAlpha = 1;
        for (let i = 0; i < 9; i++) { g.save(); g.translate(w * (0.06 + i * 0.11), hh * (0.12 + (i % 3) * 0.08)); g.globalAlpha = 0.35; HA.clockFace((4 + i) % 12, (44 + i * 7) % 60)(g, hh * 0.1, hh * 0.1); g.restore(); }
        g.globalAlpha = 1; break;
      }
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  let _lit = null; const litMat = () => _lit || (_lit = new THREE.MeshBasicMaterial({ color: '#ffe8c0' }));
  const bulbSet = (b, on, v = 1.2) => { b.userData.b.material = on ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = on ? 0.7 : 0; lightOn(b.userData.l, on, v); };
  const nightWin = (w = 1.1, h = 1.5) => HA.window(w, h, '#c8c0d8');
  const wallClock = (h = 4, m = 44) => { const T = THREE, g = new T.Group(); const face = HA.canvasTex(256, 256, HA.clockFace(h, m)); const fm = new T.Mesh(new T.CircleGeometry(0.22, 32), new T.MeshStandardMaterial({ map: face, roughness: 0.5 })); fm.position.z = 0.03; g.add(fm); const rim = new T.Mesh(new T.TorusGeometry(0.22, 0.025, 8, 32), HA.mat('black')); rim.position.z = 0.03; g.add(rim); return g; };
  const ironBed = (A, T) => { const g = new T.Group(), m = new T.MeshStandardMaterial({ color: '#c8ccd0', metalness: 0.5, roughness: 0.4 }); g.add(A.B(0.8, 0.12, 1.9, new T.MeshStandardMaterial({ color: '#e8e8ec', roughness: 0.9 }), 0, 0.5, 0), A.B(0.84, 0.04, 1.94, m, 0, 0.42, 0)); for (const z of [-0.95, 0.95]) { g.add(A.B(0.84, 0.04, 0.04, m, 0, z < 0 ? 1.0 : 0.8, z)); for (const x of [-0.4, 0.4]) g.add(A.B(0.04, z < 0 ? 1.0 : 0.8, 0.04, m, x, z < 0 ? 0.5 : 0.4, z)); } g.add(A.B(0.5, 0.1, 0.3, new T.MeshStandardMaterial({ color: '#f0f0f4' }), 0, 0.62, -0.75)); return g; };
  const plate = (txt, w = 0.4, h = 0.12, bg = '#e8e4d8', fg = '#1a2a4a') => HA.paperOn(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `700 ${H * 0.5}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText(txt, W / 2, H * 0.68); });
  const trolley = (A, T) => { const g = new T.Group(); g.add(A.B(0.5, 0.25, 0.3, new T.MeshStandardMaterial({ color: '#e8e8ec', metalness: 0.3, roughness: 0.4 }), 0, -0.25, 0), A.B(0.04, 0.2, 0.04, A.mat('iron'), 0, -0.05, 0)); const red = A.B(0.08, 0.08, 0.02, new T.MeshBasicMaterial({ color: '#c83030' }), 0, -0.25, 0.16); g.add(red); return g; };
  const railBar = (A, T, len) => A.B(len, 0.06, 0.08, A.mat('iron'), 0, 0, 0);
  const ROOMS = {
    ward: {
      size: [5, 3, 5], wall: 'plaster', floor: 'lino', ceil: 'plaster', fog: 0.06, amb: ['#8a8aa8', '#2a2420', 0.5], yaw: 0, cam: [0, 1.2], trim: false,
      build(R, A, T) {
        R.put(nightWin(1.2, 1.5), 'n', -1.0, 0.04); R.put(nightWin(1.2, 1.5), 'n', 1.2, 0.04);
        R.put(ironBed(A, T), 'w', -1.2, 0.5); R.put(ironBed(A, T), 'w', 1.2, 0.5); R.put(ironBed(A, T), 'e', -1.2, 0.5);
        const vb = ironBed(A, T); R.hot('w_bed', R.put(vb, 'e', 1.2, 0.5));
        const card = A.paperOn(0.18, 0.24, (g, W, H) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a2a4a'; for (let i = 0; i < 7; i++) g.fillRect(W * 0.1, H * (0.15 + i * 0.1), W * 0.7, 2); }); card.position.set(0, 0.9, -0.97); vb.add(card);
        const nt = new T.Group(); nt.add(A.B(0.45, 0.6, 0.4, new T.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.6 }), 0, 0.3, 0)); const dr = A.paperOn(0.24, 0.18, (g, W, H) => A.childDrawing(g, W, H, 3)); dr.rotation.x = -Math.PI / 2; dr.position.y = 0.61; nt.add(dr);
        R.hot('w_drawing', R.put(nt, 'e', 0.1, 0.25));
        R.hot('w_clock', R.put(wallClock(), 's', -1.2, 0.02, 2.3));
        R.hot('w_door', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#d8d4c8', roughness: 0.6 })), 's', 0.8, 0.06));
        const l = new T.PointLight('#d8d0f0', 0.9, 8, 2); l.position.set(0, 2, -1.5); R.g.add(l);
      },
    },
    corridor: {
      size: [4, 3, 9], wall: 'plaster', floor: 'lino', ceil: 'plaster', fog: 0.07, amb: ['#7a7a98', '#1a1814', 0.42], yaw: Math.PI, cam: [0, -2.8], trim: false,
      build(R, A, T) {
        for (const a of [-2.5, 0, 2.5]) R.put(nightWin(1.2, 1.5), 'e', a, 0.04);
        R.hot('c_ward', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#d8d4c8' })), 'w', -2.6, 0.06));
        R.hot('c_play', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#c8a050' })), 'w', 0.2, 0.06));
        const od = A.door(1.0, 2.2); const op = plate('ГЛАВНЫЙ ВРАЧ', 0.5, 0.1); op.position.set(0.5, 1.9, 0.07); od.userData.leaf.add(op); R.o.od = od; R.hot('c_office', R.put(od, 'w', 2.8, 0.06));
        R.hot('c_stairs', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#8aa0b0' })), 'n', 0, 0.06));
        const post = new T.Group(); post.add(A.B(1.4, 0.9, 0.6, new T.MeshStandardMaterial({ color: '#e8e0d0' }), 0, 0.45, 0), A.B(1.5, 0.04, 0.7, A.mat('woodMid'), 0, 0.92, 0)); const memo = A.B(0.2, 0.005, 0.28, A.mat('paper'), -0.3, 0.95, 0); post.add(memo); const rt = A.B(0.24, 0.005, 0.3, A.mat('paper'), 0.3, 0.95, 0); post.add(rt);
        R.hot('c_post', R.put(post, 'e', 1.3, 0.5));
        R.put(railBar(A, T, 8.6), 'w', 0, 0.6, 2.75);
        const tr = trolley(A, T); R.o.tr = tr; R.at(tr, -1.4, 2.7, 3.6);
        const lv = new T.Group(); lv.add(A.B(0.7, 0.5, 0.15, A.mat('iron'), 0, 0, 0)); R.o.levers = []; for (let i = 0; i < 4; i++) { const l = A.B(0.04, 0.22, 0.04, new T.MeshStandardMaterial({ color: '#c83030' }), -0.24 + i * 0.16, 0.05, 0.1); lv.add(l); R.o.levers.push(l); }
        R.hot('c_levers', R.put(lv, 's', -1.4, 0.08, 1.4));
        R.hot('c_dw', R.put(new T.Group().add(A.B(0.6, 0.6, 0.3, new T.MeshStandardMaterial({ color: '#e8e8ec' }), 0, 0, 0)), 's', 1.3, 0.15, 1.0));
        R.o.bulbs = [-2.5, 0, 2.5].map((z) => { const b = A.bulb(); R.at(b, 0.3, 3, z); return b; });
        R.put(wallClock(), 'n', 1.4, 0.02, 2.4);
      },
      update(R, S) { R.o.bulbs.forEach((b) => bulbSet(b, !!S.f.power, 0.9)); RAIL.split(',').forEach((d, i) => (R.o.levers[i].rotation.z = S.f.rail ? (d === '←' ? 0.6 : d === '→' ? -0.6 : 0) : 0.9)); R.o.tr.visible = !!S.f.rail && S.dw.pos === 'up'; },
    },
    playroom: {
      size: [5, 3, 5], wall: 'damask_nursery', floor: 'wood_floor', ceil: 'plaster', fog: 0.06, amb: ['#8a8098', '#2a2420', 0.45], yaw: 0, cam: [0, 1.2],
      build(R, A, T) {
        R.put(nightWin(1.2, 1.5), 'n', 0.8, 0.04);
        const dh = A.dollhouse(); R.o.dh = dh; R.hot('p_house', R.put(dh, 'w', -0.4, 0.5));
        R.o.dwins = []; for (let i = 0; i < 6; i++) { const wg = A.glow('#ffd070', 0.18, 0); wg.position.set(0.35, 0.55 + Math.floor(i / 3) * 0.3, -0.25 + (i % 3) * 0.25); dh.add(wg); R.o.dwins.push(wg); }
        R.put(A.rockingHorse(), 'e', -1.0, 0.6);
        const tbl = new T.Group(); tbl.add(A.B(0.9, 0.04, 0.6, new T.MeshStandardMaterial({ color: '#d8a050' }), 0, 0.5, 0)); for (const x of [-0.4, 0.4]) for (const z of [-0.25, 0.25]) tbl.add(A.B(0.04, 0.5, 0.04, A.mat('woodMid'), x, 0.25, z)); tbl.add(A.musicbox ? (() => { const mb = A.musicbox(); mb.position.set(0.2, 0.52, 0); return mb; })() : new T.Group());
        R.at(tbl, 0.6, 0, 0.7);
        R.put(A.painting(0.6, 0.45, (g, w, h) => A.childDrawing(g, w, h, 7)), 's', -1.3, 0.04, 1.7);
        R.hot('p_door', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#c8a050' })), 's', 0.8, 0.06));
        R.put(wallClock(), 'e', 1.2, 0.02, 2.3);
      },
      update(R, S) { R.o.dwins.forEach((g, i) => (g.material.opacity = S.f.house && WINDOWS.split(',').includes(String(i + 1)) ? 0.9 : 0)); },
    },
    office: {
      size: [5, 3, 5], wall: 'damask_green', floor: 'wood_floor', ceil: 'plaster', fog: 0.07, amb: ['#6a7088', '#1a1410', 0.36], yaw: 0, cam: [0, 1.2],
      build(R, A, T) {
        R.put(nightWin(1.2, 1.5), 'n', -1.2, 0.04);
        const desk = A.desk(1.6, true); R.o.desk = desk; R.hot('o_desk', R.put(desk, 'n', 0.8, 0.5));
        const met = new T.Group(); met.add(A.B(0.12, 0.25, 0.1, A.mat('wood'), 0, 0.125, 0)); const arm = new T.Group(); arm.position.y = 0.05; arm.add(A.B(0.012, 0.22, 0.012, A.mat('brass'), 0, 0.11, 0), A.B(0.03, 0.03, 0.02, A.mat('brass'), 0, 0.17, 0)); met.add(arm); met.userData.arm = arm; R.o.met = met;
        met.position.set(0.5, 0.82, 0); desk.add(met);
        R.hot('o_metronome', R.at(new T.Group().add(A.B(0.3, 0.4, 0.3, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0.8 + 0.5, 1.0, -2.0));
        const rec = new T.Group(); rec.add(A.B(0.5, 0.15, 0.35, new T.MeshStandardMaterial({ color: '#4a4a48', roughness: 0.5 }), 0, 0.075, 0)); const reels = []; for (const x of [-0.12, 0.12]) { const r = A.C(0.08, 0.08, 0.02, A.mat('black'), x, 0.16, -0.03, 16); reels.push(r); rec.add(r); } R.o.reels = reels;
        const tbl = new T.Group(); tbl.add(A.B(0.7, 0.04, 0.5, A.mat('woodMid'), 0, 0.72, 0)); for (const x of [-0.3, 0.3]) for (const z of [-0.2, 0.2]) tbl.add(A.B(0.04, 0.72, 0.04, A.mat('woodMid'), x, 0.36, z)); rec.position.y = 0.74; tbl.add(rec);
        R.hot('o_recorder', R.put(tbl, 'e', -0.6, 0.4));
        R.put(A.bookshelf(1.8, 2.4), 'w', 0.2, 0.25);
        R.put(A.painting(0.6, 0.8, A.doctorPortrait), 'e', 1.2, 0.04, 1.6);
        R.hot('o_door', R.put(A.door(1.0, 2.2), 's', 1.0, 0.06));
        R.put(wallClock(), 's', -1.0, 0.02, 2.3);
      },
      update(R, S) { lightOn(R.o.desk.userData.light, !!S.f.power, 1.2); },
      tick(R, G, dt, t) { if (G.S.f.tape) R.o.reels.forEach((r) => (r.rotation.y += dt * 3)); R.o.met.userData.arm.rotation.z = G.S.f.final ? Math.sin(t * 6.3) * 0.5 : 0.3; },
    },
    solarium: {
      size: [7, 3.4, 6], wall: 'plaster', floor: 'wood_attic', ceil: 'plaster', fog: 0.04, amb: ['#d8c8d8', '#4a4040', 0.8], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        for (const a of [-2.2, 0, 2.2]) R.put(nightWin(1.6, 1.8), 'n', a, 0.04);
        for (const a of [-1.5, 1.5]) R.put(nightWin(1.6, 1.8), 'w', a, 0.04);
        R.o.pots = [];
        for (let i = 0; i < 5; i++) { const p = new T.Group(); p.add(A.C(0.25, 0.2, 0.4, new T.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.8 }), 0, 0.2, 0, 14)); const bush = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), new T.MeshStandardMaterial({ color: '#3a6a3a', roughness: 0.9 })); bush.position.y = 0.65; p.add(bush); R.o.pots.push(p); R.hot('s_pot' + (i + 1), R.at(p, 2.4 - i * 1.2, 0, -1.5)); }
        for (let i = 0; i < 3; i++) { const ch = new T.Group(); ch.add(A.B(0.6, 0.06, 1.6, new T.MeshStandardMaterial({ color: '#d8c890' }), 0, 0.35, 0), A.B(0.6, 0.06, 0.6, new T.MeshStandardMaterial({ color: '#d8c890' }), 0, 0.6, -0.8)); ch.children[1].rotation.x = 0.8; R.at(ch, -2 + i * 2, 0, 1.4); }
        R.hot('s_door', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#8aa0b0' })), 'e', 1.4, 0.06));
        const sun = new T.PointLight('#ffd8c0', 1.2, 12, 2); sun.position.set(0, 2.5, -2.5); R.g.add(sun);
      },
      update(R, S) { const p = R.o.pots[3]; p.children[1].position.y = S.f.dig ? 0.5 : 0.65; p.rotation.z = S.f.dig ? 0.1 : 0; },
    },
    pool: {
      size: [9, 4, 9], wall: 'tiles', floor: false, ceil: 'plaster', fog: 0.05, amb: ['#7a8aa0', '#1a2028', 0.45], yaw: 0, cam: [0, 3.2], trim: false,
      build(R, A, T) {
        for (const a of [-3, 0, 3]) R.put(nightWin(1.6, 2.0), 'e', a, 0.04);
        const basin = new T.Group(); const tm = new T.MeshStandardMaterial({ map: A.surf('tiles', [3, 2]), roughness: 0.3, side: T.DoubleSide });
        basin.add(A.B(5.2, 0.15, 3.6, new T.MeshStandardMaterial({ color: '#d8e0e8' }), 0, -1.8, 0));
        for (const [x, z, w2, d] of [[0, -1.8, 5.2, 0.12], [0, 1.8, 5.2, 0.12], [-2.6, 0, 0.12, 3.6], [2.6, 0, 0.12, 3.6]]) { const m = new T.Mesh(new T.BoxGeometry(w2, 1.8, d), tm); m.position.set(x, -0.9, z); basin.add(m); }
        const water = new T.Mesh(new T.PlaneGeometry(5.1, 3.5), new T.MeshStandardMaterial({ color: '#3a6a8a', transparent: true, opacity: 0.82, roughness: 0.05, metalness: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.y = -0.25; basin.add(water); R.o.water = water;
        const drainCap = new T.Group(); drainCap.add(A.C(0.2, 0.2, 0.03, A.mat('iron'), 0, -1.71, 0, 16), A.B(0.1, 0.02, 0.06, A.mat('brass'), 0.1, -1.69, 0.12)); R.hot('l_bottom', R.at(drainCap, 0.6, 0, 0.4));
        R.at(basin, 0, 0.01, -0.5);
        const floor = new T.MeshStandardMaterial({ map: A.surf('tiles', [4, 4]), roughness: 0.4 }); for (const [x, z, w2, d] of [[0, -3.4, 9, 2.2], [0, 2.9, 9, 3.2], [-3.55, -0.5, 1.9, 3.6], [3.55, -0.5, 1.9, 3.6]]) { const f = new T.Mesh(new T.BoxGeometry(w2, 0.02, d), floor); f.position.set(x, 0.01, z); R.g.add(f); }
        R.hot('l_pool', R.at(new T.Group().add(A.B(5, 0.1, 3.4, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0, 0.05, -0.5));
        const big = wallClock(); big.scale.setScalar(2.2); R.o.big = big; R.hot('l_clock', R.put(big, 'n', 0, 0.02, 3.1));
        R.hot('l_scheme', R.put(A.paperOn(0.9, 0.54, (g, W, H) => IMG.rail(g, W, H)), 'w', -2.4, 0.02, 1.6));
        R.hot('l_locker', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#a8b8c8' })), 'w', 1.0, 0.06));
        R.hot('l_boiler', R.put(A.ironDoor(1.0, 2.2), 's', -2.5, 0.08));
        const ld = A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#d8d4c8' })); const lp = plate('ЛАБОРАТОРИЯ СНА', 0.6, 0.1); lp.position.set(0.5, 1.9, 0.07); ld.userData.leaf.add(lp); R.o.ld = ld; R.hot('l_lab', R.put(ld, 's', 0, 0.06));
        const ad = A.door(1.0, 2.2, A.mat('green')); R.o.ad = ad; R.hot('l_archive', R.put(ad, 's', 2.5, 0.06));
        R.put(railBar(A, T, 8.6), 'e', 0, 0.6, 3.75);
        const tr = trolley(A, T); R.o.tr = tr; R.at(tr, 3.9, 3.7, -3.6);
        R.hot('l_dw', R.put(new T.Group().add(A.B(0.6, 0.6, 0.3, new T.MeshStandardMaterial({ color: '#e8e8ec' }), 0, 0, 0)), 'e', -3.8, 0.15, 1.2));
        R.o.bulbs = [[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z]) => { const b = A.bulb(); R.at(b, x, 4, z); return b; });
      },
      update(R, S) {
        const f = S.f; R.o.water.position.y = f.drain ? -1.7 : -0.25; R.o.water.material.opacity = f.drain ? 0.25 : 0.82;
        R.o.bulbs.forEach((b) => bulbSet(b, !!f.power, 1.3)); R.o.tr.visible = !!f.rail && S.dw.pos === 'down';
        R.o.ld.userData.leaf.rotation.y = f.lab ? -1.2 : 0; R.o.ad.userData.leaf.rotation.y = f.archive ? -1.2 : 0;
      },
    },
    locker: {
      size: [4, 2.8, 4], wall: 'tiles', floor: 'tiles', ceil: 'plaster', fog: 0.08, amb: ['#6a7a88', '#141414', 0.35], yaw: 0, cam: [0, 1.0], trim: false,
      build(R, A, T) {
        const row = new T.Group(); for (let i = 0; i < 6; i++) { const lk = A.B(0.5, 1.9, 0.5, new T.MeshStandardMaterial({ color: i === 2 ? '#7a9a7a' : '#8a98a8', metalness: 0.4, roughness: 0.5 }), -1.3 + i * 0.52, 0.95, 0); row.add(lk); row.add(A.B(0.04, 0.12, 0.02, A.mat('black'), -1.3 + i * 0.52 + 0.15, 1.0, 0.26)); }
        R.o.lkdoor = A.B(0.46, 1.8, 0.03, new T.MeshStandardMaterial({ color: '#7a9a7a', metalness: 0.4 }), -1.3 + 2 * 0.52, 0.95, 0.27); row.add(R.o.lkdoor);
        R.hot('k_locker', R.put(row, 'n', 0, 0.3));
        const bench = new T.Group(); bench.add(A.B(2.4, 0.05, 0.4, A.mat('woodMid'), 0, 0.45, 0)); for (const x of [-1.0, 1.0]) bench.add(A.B(0.05, 0.45, 0.35, A.mat('iron'), x, 0.22, 0)); R.at(bench, 0, 0, 0.3);
        R.hot('k_back', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#a8b8c8' })), 's', 0, 0.06));
        const b = A.bulb(); R.at(b, 0, 2.8, 0); R.o.b = b;
        const cand = A.candles(1, 0, true); R.at(cand, 1.2, 0.47, 0.3);
      },
      update(R, S) { bulbSet(R.o.b, !!S.f.power, 1.0); R.o.lkdoor.rotation.y = S.f.locker ? -1.4 : 0; R.o.lkdoor.position.z = S.f.locker ? 0.5 : 0.27; },
    },
    boiler: {
      size: [5, 3, 5], wall: 'bricks', floor: 'concrete', ceil: 'concrete', fog: 0.1, amb: ['#2a2a30', '#060404', 0.16], yaw: 0, cam: [0, 1.2], trim: false,
      build(R, A, T) {
        const bo = A.boiler(); R.put(bo, 'n', -0.8, 0.8);
        const fb = A.fusebox(); R.o.fb = fb; R.hot('b_fuse', R.put(fb, 'e', -0.6, 0.06, 1.3));
        const vg = new T.Group(); vg.add(A.C(0.06, 0.06, 2.2, A.mat('pipe'), 0, 0, 0, 10)); vg.children[0].rotation.z = Math.PI / 2; R.o.valves = [];
        for (let i = 0; i < 4; i++) { const v = A.C(0.12, 0.12, 0.03, new T.MeshStandardMaterial({ color: ['#c83030', '#3060c8', '#30a050', '#d8b030'][i], metalness: 0.4 }), -0.75 + i * 0.5, 0, 0.12, 16); v.rotation.x = Math.PI / 2; vg.add(v); R.o.valves.push(v); }
        R.hot('b_valves', R.put(vg, 'w', 0, 0.2, 1.4));
        R.hot('b_back', R.put(A.ironDoor(1.0, 2.2), 's', 0, 0.08));
        const c = A.candles(2, 0.1, true); R.at(c, 1.6, 0, 1.6);
        R.o.b = A.bulb(); R.at(R.o.b, 0, 3, 0);
      },
      update(R, S) { bulbSet(R.o.b, !!S.f.power, 1.2); if (R.o.fb.userData.led) R.o.fb.userData.led.material && R.o.fb.userData.led.material.color && R.o.fb.userData.led.material.color.set(S.f.power ? '#30ff60' : '#401010'); R.o.valves.forEach((v) => (v.rotation.y = S.f.drain ? 1.2 : 0)); },
    },
    lab: {
      size: [5, 3, 5], wall: 'tiles', floor: 'lino', ceil: 'plaster', fog: 0.07, amb: ['#6a7a8a', '#141414', 0.32], yaw: 0, cam: [0, 1.2], trim: false,
      build(R, A, T) {
        const bed = ironBed(A, T); R.put(bed, 'w', 0, 0.6);
        const helm = new T.Mesh(new T.SphereGeometry(0.16, 12, 8, 0, TAU, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#c8ccd0', metalness: 0.6, roughness: 0.3 })); helm.position.set(-1.9, 0.72, -0.7); R.g.add(helm);
        const eeg = new T.Group(); eeg.add(A.B(1.2, 1.1, 0.6, new T.MeshStandardMaterial({ color: '#c8c0a8', roughness: 0.5 }), 0, 0.55, 0)); for (let i = 0; i < 4; i++) { const k = A.C(0.05, 0.05, 0.04, A.mat('black'), -0.4 + i * 0.27, 0.9, 0.31, 12); k.rotation.x = Math.PI / 2; eeg.add(k); }
        const paperRoll = A.B(0.8, 0.02, 0.3, A.mat('paper'), 0, 1.12, 0); eeg.add(paperRoll);
        const pen = A.B(0.01, 0.06, 0.01, A.mat('black'), 0, 1.16, 0); eeg.add(pen); R.o.pen = pen;
        R.hot('a_eeg', R.put(eeg, 'n', 0.6, 0.4));
        const tray = new T.Group(); tray.add(A.B(0.5, 0.04, 0.35, A.mat('iron'), 0, 0.9, 0)); for (const x of [-0.2, 0.2]) tray.add(A.B(0.03, 0.9, 0.03, A.mat('iron'), x, 0.45, 0)); const reel = A.C(0.09, 0.09, 0.02, A.mat('black'), 0, 0.93, 0, 16); tray.add(reel); R.o.reel = reel;
        R.hot('a_tray', R.put(tray, 'e', 0.8, 0.4));
        R.put(A.paperOn(1.2, 0.8, (g, W, H) => { g.fillStyle = '#1a2a22'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(230,230,220,0.7)'; g.lineWidth = 2; for (let r = 0; r < 4; r++) { g.beginPath(); for (let x = 0; x < W; x += 3) g.lineTo(x, H * (0.2 + r * 0.2) + Math.sin(x * (0.03 + r * 0.04)) * 10); g.stroke(); } g.fillStyle = 'rgba(230,230,220,0.8)'; g.font = `${H * 0.07}px 'Marck Script', cursive`; g.fillText('Δ  Θ  α  β', W * 0.05, H * 0.95); }), 'e', -1.0, 0.02, 1.6);
        R.hot('a_back', R.put(A.door(1.0, 2.2, new T.MeshStandardMaterial({ color: '#d8d4c8' })), 's', 0, 0.06));
        R.o.b = A.bulb(); R.at(R.o.b, 0, 3, 0);
        R.put(wallClock(), 's', 1.4, 0.02, 2.3);
      },
      update(R, S) { bulbSet(R.o.b, !!S.f.power, 1.0); R.o.reel.visible = !S.f.t_tape && !!S.f.eeg; },
      tick(R, G, dt, t) { R.o.pen.position.x = G.S.f.eeg ? Math.sin(t * 13) * 0.3 : 0; },
    },
    archive: {
      size: [5, 3, 6], wall: 'plaster', floor: 'concrete', ceil: 'plaster', fog: 0.09, amb: ['#5a5a6a', '#141010', 0.26], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        for (const x of [-1.5, 1.5]) for (let z = -2; z <= 0; z += 2) { const sh = A.bookshelf(1.6, 2.4); sh.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; R.at(sh, x * 1.0, 0, z); }
        const cat = new T.Group(); cat.add(A.B(1.6, 1.0, 0.5, A.mat('wood'), 0, 0.5, 0)); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { cat.add(A.B(0.44, 0.26, 0.02, A.mat('woodMid'), -0.5 + c * 0.5, 0.2 + r * 0.3, 0.26)); cat.add(A.B(0.08, 0.04, 0.02, A.mat('brass'), -0.5 + c * 0.5, 0.2 + r * 0.3, 0.28)); }
        R.hot('r_catalog', R.put(cat, 'n', 0, 0.3));
        R.hot('r_back', R.put(A.door(1.0, 2.2, A.mat('green')), 's', 0, 0.06));
        const lamp = A.desk(1.0, true); R.o.desk = lamp; R.put(lamp, 'e', 1.8, 0.4);
      },
      update(R, S) { lightOn(R.o.desk.userData.light, !!S.f.power, 1.2); },
    },
    dream: {
      size: [7, 3.6, 7], wall: 'plaster', floor: 'plaster', ceil: 'plaster', fog: 0.03, amb: ['#f0f0ff', '#c8c8d8', 1.4], yaw: 0, cam: [0, 1.5], trim: false,
      build(R, A, T) {
        R.put(ironBed(A, T), 'n', 0, 0.8);
        const glow = A.glow('#ffffff', 2.4, 0.7); glow.position.set(0, 1.0, -2.2); R.g.add(glow);
        for (let i = 0; i < 12; i++) { const c = wallClock((4 + i) % 12, (44 + i * 5) % 60); const a = (i / 12) * TAU; c.position.set(Math.cos(a) * 3.3, 1.2 + (i % 3) * 0.6, Math.sin(a) * 3.3); c.lookAt(0, c.position.y, 0); R.g.add(c); }
        R.hot('q_any', R.at(new T.Group().add(A.B(1, 1, 1, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0, 1, -2));
      },
      tick(R, G, dt) { G.tyaw += dt * 0.05; },
    },
  };

  // ================= Точки интереса =================
  function hot(G, { use, bindUse, P }) {
    const cyclePanel = (t, desc, labels, opts, act, btn) => () => {
      const p = G.ps; p.c = p.c || labels.map(() => 0);
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${labels.map((l, i) => `<button data-c="${i}">${l}: <b>${opts[p.c[i]]}</b></button>`).join('')}</div><button class="hs-btn" id="hsGo">${btn}</button>`,
        bind: (el) => { el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { const i = +b.dataset.c; p.c[i] = (p.c[i] + 1) % opts.length; G.snd('tick2'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act(act, p.c.map((ci) => opts[ci]).join()); } };
    };
    const seqPanel = (t, desc, items, key, act, n) => () => {
      const p = G.ps; p.seq = p.seq || [];
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${items.map((it) => `<button data-s="${it.id}" class="${p.seq.includes(it.id) ? 'sel' : ''}">${it.l}</button>`).join('')}</div><p class="hs-cap">Выбрано: ${p.seq.length} из ${n}</p><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => { el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.s)) return; p.seq.push(b.dataset.s); G.snd(key); if (p.seq.length === n) G.act(act, p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } };
    };
    const pot = (n) => (o, S, f) => {
      if (f.dig) return n === 4 ? P(() => ({ t: 'Секретик', html: `<p class="hs-txt">Под осколком зелёного стекла — фантики, бусина и латунный ключик-бабочка.</p>${G.takeHtml(['key_a']) || '<p class="hs-cap">Ямка аккуратно присыпана.</p>'}` }), o) : G.say('Кадка', 'Кадка с фикусом. Земля нетронутая.');
      if (!f.house) return G.say('Кадка с фикусом', 'Кадка с фикусом. Земля сухая. Ничего особенного — а может, просто не знаешь, что искать.');
      P(() => ({ t: `Кадка № ${n} от двери`, html: `<p class="hs-txt">Сухая земля. Если копать — то здесь?</p>${G.has('trowel') ? `<button class="hs-btn" data-use="dig" data-v="${n}">Копать совком</button>` : '<p class="hs-cap">Руками не раскопать — нужен совок.</p>'}`, bind: bindUse }), o);
    };
    return {
      // ---------- Палата ----------
      w_clock: (o) => G.doc('clock', o),
      w_bed: (o) => G.doc('bedcard', o),
      w_drawing: (o) => G.doc('drawing', o),
      w_door: () => G.go('corridor'),
      // ---------- Рекреация ----------
      c_ward: () => G.go('ward'),
      c_play: () => G.go('playroom'),
      c_stairs: () => G.go('solarium'),
      c_office: (o, S, f) => { if (f.office) return G.go('office'); P(() => ({ t: 'Кабинет главного врача', html: `<p class="hs-txt">Обитая дерматином дверь. Табличка: «Главный врач Л. М. Зорин». Заперто.</p>${use('key_office', 'Отпереть ключом', 'unlock', 'office')}`, bind: bindUse }), o); },
      c_post: (o) => P(() => ({ t: 'Пост медсестры', html: '<p class="hs-txt">Столик дежурной: телефон без гудка, стакан с карандашами, две бумажки под стеклом.</p><button class="hs-btn ghost" data-doc="drain_memo">Памятка банщику</button><button class="hs-btn ghost" data-doc="routine">Распорядок дня</button>' }), o),
      c_dw: (o) => P(() => G.dwPanel(), o),
      c_levers: (o, S, f) => {
        if (f.rail) return G.say('Рычаги стрелок', 'Стрелки переведены. Тележка ходит между корпусами.');
        if (!f.power) return G.say('Рычаги стрелок', 'Четыре красных рычага стрелок лекарственной линии. Без тока моторчики стрелок не работают.');
        P(cyclePanel('Рычаги стрелок', 'Четыре рычага. Каждый переводит стрелку: налево, прямо или направо. Неправильно — и тележка уедет в прачечную.', ['Стрелка 1', 'Стрелка 2', 'Стрелка 3', 'Стрелка 4'], RAIL_OPT, 'rail', 'Перевести стрелки'), o);
      },
      // ---------- Игровая ----------
      p_door: () => G.go('corridor'),
      p_house: (o, S, f) => P(() => {
        if (f.house) return { t: 'Кукольный домик', html: '<p class="hs-txt">В окнах горит тёплый свет. Крыша приподнята, на чердаке — сложенная записка.</p><button class="hs-btn ghost" data-doc="secret">Записка</button>' };
        if (!f.file) return { t: 'Кукольный домик', html: '<p class="hs-txt">Деревянный кукольный домик: шесть окон, в каждом — крошечная лампочка с выключателем. Крыша заперта на защёлку. Кажется, она откроется, если зажечь правильные окна. Но какие?</p>' };
        const p = G.ps; p.on = p.on || {};
        return { t: 'Кукольный домик', html: `<p class="hs-txt">Шесть окон, у каждого — крошечный выключатель. Включи нужные.</p><div class="hs-dolls">${[1, 2, 3, 4, 5, 6].map((i) => `<button data-j="${i}" class="${p.on[i] ? 'sel' : ''}">окно ${i}</button>`).join('')}</div><button class="hs-btn" id="hsGo">Нажать на трубу</button>`,
          bind: (el) => { el.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => { p.on[b.dataset.j] = !p.on[b.dataset.j]; G.snd('click'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('house', [1, 2, 3, 4, 5, 6].filter((i) => p.on[i]).join()); } };
      }, o),
      // ---------- Кабинет ----------
      o_door: () => G.go('corridor'),
      o_desk: (o, S, f) => {
        if (f.drawer) return P(() => ({ t: 'Ящик стола', html: `<p class="hs-txt">Ящик открыт: журнал в коленкоре и ключ.</p><button class="hs-btn ghost" data-doc="journal">Журнал опытов</button>${G.takeHtml(['key_lab'])}` }), o);
        P(() => G.wheelsPanel({ t: 'Ящик стола', desc: 'Ящик заперт буквенным замком: четыре колёсика с буквами. На латунной планке выбито: «Имя той, кто спит».', n: 4, chars: LETTERS, act: 'drawer' }), o);
      },
      o_recorder: (o, S, f) => P(() => f.tape ? { t: 'Магнитофон «Яуза»', html: '<p class="hs-txt">Бобины крутятся вхолостую. Запись кончилась.</p><button class="hs-btn ghost" data-doc="session">Перечитать запись</button>' } : { t: 'Магнитофон «Яуза»', html: `<p class="hs-txt">Катушечный магнитофон. Пустой — бобины нет.</p>${use('tape', 'Поставить бобину «Сеанс 47»', 'tape')}`, bind: bindUse }, o),
      o_metronome: (o) => P(() => G.finalPanel(), o),
      // ---------- Солярий ----------
      s_door: () => G.go('corridor'),
      s_pot1: pot(1), s_pot2: pot(2), s_pot3: pot(3), s_pot4: pot(4), s_pot5: pot(5),
      // ---------- Бассейн ----------
      l_scheme: (o) => G.doc('rail', o),
      l_locker: () => G.go('locker'),
      l_boiler: () => G.go('boiler'),
      l_dw: (o) => P(() => G.dwPanel(), o),
      l_clock: (o) => P(() => G.finalPanel(), o),
      l_pool: (o, S, f) => f.drain ? P(() => ({ t: 'Дно бассейна', html: `<p class="hs-txt">Вода ушла. На кафельном дне — белая шапочка с ромашками и ключ с биркой.</p><button class="hs-btn ghost" data-doc="cap">Шапочка</button>${G.takeHtml(['key_office']) || ''}` }), o) : G.say('Бассейн', 'Тёмная неподвижная вода. На дне, у слива, что-то белеет. Нырять в эту воду не хочется — она ледяная, и в ней что-то отражается, чего нет в зале.'),
      l_bottom: (o, S, f) => (f.drain ? G.hot('l_pool', o) : G.say('Слив', 'Решётка слива на дне. Под водой.')),
      l_lab: (o, S, f) => { if (f.lab) return G.go('lab'); P(() => ({ t: 'Лаборатория сна', html: `<p class="hs-txt">Белая дверь. «Тихо! Идёт сеанс». Заперто.</p>${use('key_lab', 'Отпереть ключом', 'unlock', 'lab')}`, bind: bindUse }), o); },
      l_archive: (o, S, f) => { if (f.archive) return G.go('archive'); P(() => G.wheelsPanel({ t: 'Архив', desc: 'Зелёная дверь с кодовым замком. Табличка: «Архив. Код — номер истории болезни».', n: 4, chars: '0123456789', act: 'archive' }), o); },
      // ---------- Раздевалка ----------
      k_back: () => G.go('pool'),
      k_locker: (o, S, f) => {
        if (f.locker) return P(() => ({ t: 'Шкафчик персонала', html: `<p class="hs-txt">В шкафчике — халат, резиновые тапки и мелочь.</p>${G.takeHtml(['fuse', 'trowel']) || '<p class="hs-cap">Больше ничего.</p>'}` }), o);
        P(() => { const sp = G.wheelsPanel({ t: 'Шкафчик персонала', desc: 'Зелёный шкафчик с кодовым замком на четыре цифры.', n: 4, chars: '0123456789', act: 'locker', top: ['час', 'час', 'мин', 'мин'] }); sp.html = '<button class="hs-btn ghost" data-doc="locker">Надпись на дверце</button>' + sp.html; return sp; }, o);
      },
      // ---------- Котельная ----------
      b_back: () => G.go('pool'),
      b_fuse: (o, S, f) => P(() => f.power ? { t: 'Электрощит', html: '<p class="hs-txt">Пробка вкручена. Свет есть.</p>' } : { t: 'Электрощит', html: `<p class="hs-txt">Электрощит водолечебницы. Одного гнезда для пробки пусто.</p>${use('fuse', 'Вкрутить пробку', 'power')}`, bind: bindUse }, o),
      b_valves: (o, S, f) => {
        if (f.drain) return G.say('Вентили', 'Насос гудит. Бассейн пуст.');
        if (!f.power) return G.say('Вентили', 'Вентили бассейна и насос. Без тока насос мёртв.');
        P(seqPanel('Вентили бассейна', 'Четыре вентиля на трубе. Если ошибиться в порядке — насос сорвёт.', VALVES, 'lever', 'drain', 4), o);
      },
      // ---------- Лаборатория ----------
      a_back: () => G.go('pool'),
      a_eeg: (o, S, f) => {
        if (f.eeg) return G.doc('eeg', o);
        P(cyclePanel('Энцефалограф', 'Четыре канала ритмов, у каждого — переключатель частоты в герцах.', EEG_CH, EEG_VAL, 'eeg', 'Включить запись'), o);
      },
      a_tray: (o, S, f) => P(() => ({ t: 'Столик с бобиной', html: f.eeg ? `<p class="hs-txt">После записи на столике появилась бобина. Коробка подписана: «Сеанс 47. В. Л.»</p>${G.takeHtml(['tape']) || '<p class="hs-cap">Пусто.</p>'}` : '<p class="hs-txt">Металлический столик. Пусто, только круглый след от чего-то пыльного.</p>' }), o),
      // ---------- Архив ----------
      r_back: () => G.go('pool'),
      r_catalog: (o, S, f) => {
        if (f.file) return P(() => ({ t: 'Картотека', html: `<p class="hs-txt">Ящик «К–Л» выдвинут.</p><button class="hs-btn ghost" data-doc="vera_file">История болезни № 0714</button>${G.takeHtml(['key_b'])}` }), o);
        if (!f.tape) return G.say('Картотека', 'Картотека пациентов, сотни карточек. Без фамилии — искать можно до утра. Но и утра здесь не бывает.');
        P(seqPanel('Картотека', 'Ящики подписаны буквами. В каком искать?', DRAWERS.map((d) => ({ id: d, l: d })), 'drawer', 'file', 1), o);
      },
      q_any: () => G.say('Белая комната', 'Здесь очень тихо. И очень светло.'),
    };
  }

  StoryEngine.define({
    id: 'sanatorium', title: 'Ясные зори', icon: '🌅', color: '#c8a8c8',
    tagline: 'Детектив-кошмар: санаторий, где все часы стоят',
    infoDefault: 'новая история · 3D',
    roles: [
      { id: 'up', name: 'Главный корпус', icon: '🕯️', desc: 'Ты в главном корпусе: палата, рекреация, игровая, кабинет главврача, солярий.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'Водолечебница', icon: '🔦', desc: 'Ты в водолечебнице: бассейн, раздевалка, котельная, лаборатория сна, архив.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Четвёртая мрачная история: 5 глав, 11 комнат, около 20 загадок. 1,5 часа. Лучше в наушниках.',
      'Вы в разных корпусах санатория. Улики разделены — говорите обо всём, что видите.',
      'Предметы ездят лекарственной тележкой по монорельсу — но её ещё надо запустить.',
      'Прогресс сохраняется. Застряли — кнопка 💡.',
    ],
    sub: 'детектив-кошмар для двоих · 5 глав',
    warn: 'Наденьте наушники. Говорите обо всём, что видите: часть ответа всегда у другого.',
    roleLabel: { up: '🕯️ Ты — в <b>главном корпусе</b>', down: '🔦 Ты — в <b>водолечебнице</b>' },
    enterLabel: 'Войти в ворота', menuArt: 'gate', endArt: 'dawn', endSub: 'разбудили Веру', finalRoom: 'dream', introSound: { 2: 'sting' },
    chapters: CH, ITEMS, DOCS, IMG, ACT, HINTS, TAKE, chapterOf, drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART, hot,
    dw: {
      name: 'Лекарственная тележка', cabin: 'Тележка', empty: 'тележка пуста', putIn: 'Положить на тележку:', called: 'Тележка с жужжанием подъехала по монорельсу.', call: 'Вызвать тележку', send: { up: 'в водолечебницу →', down: 'в главный корпус ←' },
      room: { up: 'corridor', down: 'pool' }, need: 'rail',
      broken: { up: 'Белая тележка висит на монорельсе под потолком. Неподвижна: стрелки не переведены, а без тока их не перевести.', down: 'Монорельс под потолком уходит в галерею. Тележки нет — она в главном корпусе, а линия не работает.' },
    },
    final: {
      title: 'Пробуждение', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Метроном на столе Зорина. Если завести его в ту же секунду, когда пойдут большие часы, — Вера услышит.', down: 'Большие часы над бассейном стоят на 4:44. Если завести их в ту же секунду, когда застучит метроном, — время пойдёт.' },
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'power': G.snd('power'); G.toast('Щёлкнуло в щитке — по водолечебнице и по галерее загорелись лампы. В главном корпусе тоже.', 4000); break;
        case 'rail': G.snd('mech'); G.toast(me ? 'Стрелки встали на место. Тележка дёрнулась на монорельсе.' : 'Под потолком загудел монорельс: лекарственная линия ожила.', 3500); break;
        case 'drain': G.snd('drain'); G.toast(me ? 'Насос загудел. Вода в бассейне быстро уходит — на дне что-то белеет.' : 'Снизу, из водолечебницы, слышно, как с рёвом уходит вода.', 4000); break;
        case 'eeg': G.snd('static'); G.toast(me ? 'Перья самописца задёргались сами по себе.' : 'Где-то внизу застрекотал самописец.', 3500); if (me) setTimeout(() => G.doc('eeg'), 1200); break;
        case 'tape': G.snd('static'); G.toast(me ? 'Бобины закрутились. Из динамика — голос.' : 'Из главного корпуса доносится мужской голос, искажённый плёнкой.', 3500); if (me) setTimeout(() => G.doc('session'), 1200); G.tick44(); break;
      }
    },
    methods: {
      tick44() { for (let i = 0; i < 4; i++) setTimeout(() => this.snd('tick2'), 400 + i * 600); },
    },
  });
})();
