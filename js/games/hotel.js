'use strict';
// «Полярная звезда» — заснеженный отель в Хибинах, январь 1987. Один наверху (3-й этаж, радиорубка, купол),
// другой внизу (вестибюль, кухня, генераторная, ледник, погреб). Предметы — пневмопочтой.
(() => {
  const HA = window.HouseArt;
  const CLIMBERS = ['Северов', 'Лунина', 'Громов', 'Белых', 'Ким'];
  const BOTTLES = ['Громов', 'Ким', 'Северов', 'Белых', 'Лунина'];
  const MORSE = { 'К': '-.-', 'О': '---', 'Д': '-..', '4': '....-', '0': '-----', '7': '--...' };
  const MORSE_TABLE = { 'А': '.-', 'Б': '-...', 'В': '.--', 'Г': '--.', 'Д': '-..', 'Е': '.', 'Ж': '...-', 'З': '--..', 'И': '..', 'Й': '.---', 'К': '-.-', 'Л': '.-..', 'М': '--', 'Н': '-.', 'О': '---', 'П': '.--.', 'Р': '.-.', 'С': '...', 'Т': '-', 'У': '..-', 'Ф': '..-.', 'Х': '....', 'Ц': '-.-.', 'Ч': '---.', 'Ш': '----', 'Щ': '--.-', 'Ы': '-.--', 'Ь': '-..-', 'Э': '..-..', 'Ю': '..--', 'Я': '.-.-', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----' };
  const GEN = [{ id: 'ign', l: 'ЗАЖ.' }, { id: 'start', l: 'ПУСК' }, { id: 'fuel', l: 'ТОПЛ.' }, { id: 'air', l: 'ВОЗД.' }];
  const GEN_ORDER = ['fuel', 'air', 'ign', 'start'];
  const JACKS = ['301', '302', '310', '311', '312', '314'];
  const BOX = [{ id: 'clock', s: '⌛', n: 'Песочные часы' }, { id: 'compass', s: '🧭', n: 'Компас' }, { id: 'fire', s: '🔥', n: 'Пламя' }, { id: 'star', s: '★', n: 'Звезда' }];
  const BOX_ORDER = ['fire', 'star', 'compass', 'clock'];
  const TILE_GOAL = ['▲', '★', '☾', '❄', '⌂', '♨', '✦', '✝', '☀'];
  const TILE_START = ['⌂', '☀', '▲', '✝', '★', '❄', '☾', '♨', '✦'];

  const ROOM_NAME = { corridor: 'Коридор 3-го этажа', room312: 'Номер 312', radio: 'Радиорубка', observatory: 'Купол', suite: 'Апартаменты 301', lobby: 'Вестибюль', kitchen: 'Кухня', generator: 'Генераторная', icehouse: 'Ледник', cellar: 'Винный погреб', hall: 'Каминный зал' };
  const AREA = { up: ['corridor', 'room312', 'radio', 'observatory', 'suite'], down: ['lobby', 'kitchen', 'generator', 'icehouse', 'cellar'] };
  const OPEN = { corridor: () => true, lobby: () => true, kitchen: () => true, room312: (S) => S.f.room312, radio: (S) => S.f.radio_room, observatory: (S) => S.f.radio, suite: (S) => S.f.suite, generator: (S) => S.f.generator, icehouse: (S) => S.f.icehouse, cellar: (S) => S.f.cellar };
  const CH = ['', 'Глава I. Лавина', 'Глава II. Голоса в эфире', 'Глава III. Книга гостей', 'Глава IV. Хозяйка', 'Глава V. Каминный зал'];

  const INTRO = [
    ['mountain', 'Январь 1987 года. Хибины. Последний автобус ушёл вниз, в Кировск, — дальше по серпантину только снег и старый отель «Полярная звезда».'],
    ['booking', 'Вас пригласили письмом: бронь на ваши имена, номер 312. Странно только одно: бланк брони датирован 11 января 1962 года. И подпись — «И. Ветрова, хозяйка».'],
    ['hotel', 'Отель закрыт с той самой зимы 1962-го, когда здесь пережидала непогоду группа альпинистов. Их было пятеро. Вниз не спустился никто.'],
    ['avalanche', 'Ночью сошла лавина. Перекрытие лестницы обрушилось. {up} — на третьем этаже. {down} — внизу, в тёмном вестибюле. Между вами — пролёт снега и обломков.'],
    ['split', 'Связь между этажами — только голос сквозь вентиляцию и старая пневмопочта. Если её запустить. Улики разделены. В одиночку отсюда не выбраться.'],
  ];
  const OUTRO = [
    ['hall', 'Два ключа повернулись разом, и двери каминного зала, заколоченные двадцать пять лет назад, открылись — сверху, с галереи, и снизу, из вестибюля.'],
    ['hall', 'Камин вспыхнул сам. У огня стояли пять стульев. На спинках — вязаные шапки, на столе — пять кружек. Как будто все только что вышли.'],
    ['hall', 'В тепле на стёклах проступили слова, написанные пальцем изнутри: «Спасибо. Нам наконец тепло». И снег за окнами впервые за ночь перестал падать.'],
    ['dawn', 'Под утро над перевалом застучал вертолёт спасателей. В отчёте они напишут, что нашли двоих — живых и почему-то совсем не замёрзших.'],
    ['end', ''],
  ];

  // ================= Предметы =================
  const ITEMS = {
    key_gen: { n: 'Ключ «Генераторная»', d: 'Тяжёлый ключ с алюминиевой биркой «ГЕНЕР.».' },
    key_312: { n: 'Ключ «312»', d: 'Ключ с деревянной грушей и выжженным номером 312. Ваш номер.' },
    canister: { n: 'Канистра', d: 'Жестяная канистра с бензином. Плещется на треть.' },
    hammer: { n: 'Молоток', d: 'Кухонный молоток для отбивных. Тяжёлый, с зубчатым бойком.' },
    kettle: { n: 'Чайник', d: 'Эмалированный чайник со снегом внутри. Чтобы вскипятить, нужна плита.' },
    hot_kettle: { n: 'Кипяток', d: 'Чайник кипятка. Пар валит из носика — пока горячо, надо спешить.' },
    salt: { n: 'Соль', d: 'Пачка крупной соли «Экстра». Ледник её не любит.' },
    winch: { n: 'Рукоять лебёдки', d: 'Кривая рукоять с квадратным гнездом. На ней краской: «АНТ.».' },
    knob: { n: 'Ручка плиты', d: 'Бакелитовая ручка конфорки. Без неё плиту не включить.' },
    key_hatch: { n: 'Ключ от люка', d: 'Плоский ключ на кольце с жетоном «РАДИО».' },
    key_cellar: { n: 'Ключ от погреба', d: 'Старый бронзовый ключ, пахнет вином и сыростью.' },
    key_suite: { n: 'Ключ «301»', d: 'Ключ от апартаментов хозяйки. Брелок — маленькая серебряная звезда.' },
    axe: { n: 'Пожарный топор', d: 'Красный пожарный топор. Тяжёлый и острый.' },
    key_a: { n: 'Ключ галереи', d: 'Чугунный ключ с гравировкой «Галерея. Каминный зал».' },
    key_b: { n: 'Ключ зала', d: 'Чугунный ключ с гравировкой «Каминный зал. Нижние двери».' },
  };
  const TAKE = {
    key_gen: (S) => S.f.cabinet, key_312: (S) => S.f.cabinet, canister: () => true, hammer: () => true, kettle: () => true, salt: () => true,
    winch: (S) => S.f.power, knob: () => true, key_hatch: (S) => S.f.suitcase, key_cellar: (S) => S.f.switch, key_suite: (S) => S.f.bottles,
    axe: (S) => S.f.firebox, key_a: (S) => S.f.box, key_b: (S) => S.f.tiles,
  };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const metal = (a, b) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const key = (fill, tag) => {
      g.fillStyle = fill; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill();
      g.fillStyle = fill; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12); g.fillRect(s * 0.84, s * 0.54, s * 0.05, s * 0.09);
      if (tag) { g.fillStyle = tag; g.save(); g.translate(s * 0.2, s * 0.26); g.rotate(-0.4); g.fillRect(-s * 0.09, -s * 0.12, s * 0.18, s * 0.2); g.restore(); }
    };
    const brass = metal('#f0d890', '#5a4214'), iron = metal('#a8a8b0', '#2a2a30');
    switch (id) {
      case 'key_gen': key(iron, '#9aa0a8'); break;
      case 'key_312': key(brass, '#7a4a22'); break;
      case 'key_hatch': key(iron, '#c83030'); break;
      case 'key_cellar': key(metal('#c89a5a', '#4a2a10')); break;
      case 'key_suite': key(metal('#e8e8f0', '#6a6a7a'), '#e8e8f0'); break;
      case 'key_a': case 'key_b': key(metal('#5a5a64', '#141418')); g.fillStyle = '#e8c87a'; g.font = `700 ${s * 0.16}px serif`; g.textAlign = 'center'; g.fillText(id === 'key_a' ? 'Г' : 'З', s * 0.3, s * 0.56); break;
      case 'canister': g.fillStyle = metal('#c83a2a', '#5a1410'); g.fillRect(s * 0.24, s * 0.3, s * 0.5, s * 0.56); g.fillStyle = '#2a2a2a'; g.fillRect(s * 0.3, s * 0.18, s * 0.14, s * 0.14); g.strokeStyle = '#2a2a2a'; g.lineWidth = s * 0.05; g.strokeRect(s * 0.5, s * 0.2, s * 0.2, s * 0.12); break;
      case 'hammer': g.fillStyle = '#6a4a2a'; g.save(); g.translate(s / 2, s / 2); g.rotate(-0.7); g.fillRect(-s * 0.04, -s * 0.05, s * 0.08, s * 0.5); g.fillStyle = iron; g.fillRect(-s * 0.16, -s * 0.2, s * 0.32, s * 0.16); g.restore(); break;
      case 'kettle': case 'hot_kettle': g.fillStyle = id === 'hot_kettle' ? '#d84a3a' : '#3a7ab8'; g.beginPath(); g.ellipse(s * 0.48, s * 0.6, s * 0.28, s * 0.22, 0, 0, TAU); g.fill(); g.fillRect(s * 0.7, s * 0.48, s * 0.18, s * 0.06); g.strokeStyle = '#2a2a2a'; g.lineWidth = s * 0.04; g.beginPath(); g.arc(s * 0.48, s * 0.4, s * 0.16, Math.PI, 0); g.stroke(); if (id === 'hot_kettle') { g.strokeStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(s * (0.86 + i * 0.03), s * 0.44); g.quadraticCurveTo(s * (0.8 + i * 0.04), s * 0.3, s * (0.88 + i * 0.03), s * 0.16); g.stroke(); } } break;
      case 'salt': g.fillStyle = '#e8e8f0'; g.fillRect(s * 0.28, s * 0.22, s * 0.44, s * 0.6); g.fillStyle = '#2a5aa8'; g.fillRect(s * 0.28, s * 0.4, s * 0.44, s * 0.16); g.fillStyle = '#fff'; g.font = `700 ${s * 0.1}px sans-serif`; g.textAlign = 'center'; g.fillText('СОЛЬ', s / 2, s * 0.52); break;
      case 'winch': case 'knob':
        if (id === 'knob') { g.fillStyle = '#1a1414'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.26, 0, TAU); g.fill(); g.fillStyle = '#e8e0d0'; g.fillRect(s * 0.47, s * 0.26, s * 0.06, s * 0.2); break; }
        g.strokeStyle = iron; g.lineWidth = s * 0.09; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.25, s * 0.78); g.lineTo(s * 0.25, s * 0.35); g.lineTo(s * 0.7, s * 0.35); g.lineTo(s * 0.7, s * 0.18); g.stroke(); g.fillStyle = '#c83030'; g.fillRect(s * 0.62, s * 0.06, s * 0.16, s * 0.14); break;
      case 'axe': g.save(); g.translate(s / 2, s / 2); g.rotate(-0.6); g.fillStyle = '#c83030'; g.fillRect(-s * 0.04, -s * 0.38, s * 0.08, s * 0.76); g.fillStyle = iron; g.beginPath(); g.moveTo(s * 0.04, -s * 0.36); g.lineTo(s * 0.3, -s * 0.42); g.lineTo(s * 0.3, -s * 0.14); g.lineTo(s * 0.04, -s * 0.2); g.fill(); g.restore(); break;
    }
  }

  // ================= Иллюстрации улик =================
  const paper = (g, w, h, c = '#d8ccb0') => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,20,0.06)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * w * 0.06, 0, TAU); g.fill(); } };
  const IMG = {
    morse: (g, w, h) => {
      paper(g, w, h, '#d4cab2');
      g.fillStyle = '#2a1e14'; g.font = `700 ${h * 0.055}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('АЗБУКА МОРЗЕ', w / 2, h * 0.08);
      const keys = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯ1234567890'], cols = 4, rows = Math.ceil(keys.length / cols);
      g.font = `${h * 0.042}px 'PT Mono', monospace`; g.textAlign = 'left';
      keys.forEach((k, i) => { const c = Math.floor(i / rows), r = i % rows; g.fillText(`${k}  ${MORSE_TABLE[k].replace(/\./g, '•').replace(/-/g, '—')}`, w * (0.04 + c * 0.245), h * (0.15 + r * 0.075)); });
    },
    memo: null,
    climbers: (g, w, h) => {
      g.fillStyle = '#c8c0b0'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a8a88'); gr.addColorStop(1, '#3a3a38'); g.fillStyle = gr; g.fillRect(w * 0.04, h * 0.05, w * 0.92, h * 0.68);
      g.fillStyle = '#e8e8e8'; g.beginPath(); g.moveTo(w * 0.04, h * 0.5); g.lineTo(w * 0.3, h * 0.15); g.lineTo(w * 0.55, h * 0.4); g.lineTo(w * 0.75, h * 0.12); g.lineTo(w * 0.96, h * 0.45); g.lineTo(w * 0.96, h * 0.73); g.lineTo(w * 0.04, h * 0.73); g.fill();
      for (let i = 0; i < 5; i++) HA.figure(g, w * (0.16 + i * 0.17), h * 0.48, h * 0.1, '#1a1a1a', '#b8b0a0');
      g.strokeStyle = '#8a3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.1, h * 0.6); for (let i = 0; i < 5; i++) g.quadraticCurveTo(w * (0.08 + i * 0.17 + 0.08), h * 0.66, w * (0.16 + i * 0.17), h * 0.6); g.stroke();
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.05}px 'Marck Script', cursive`; g.textAlign = 'center';
      g.fillText('На обороте: «Хибины, январь 1962. В связке слева направо:', w / 2, h * 0.82);
      g.fillText(CLIMBERS.join(', ') + '»', w / 2, h * 0.9);
    },
    ash: (g, w, h) => {
      g.fillStyle = '#1a1612'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c8b898'; g.beginPath(); g.moveTo(w * 0.1, h * 0.15); g.lineTo(w * 0.85, h * 0.1); g.lineTo(w * 0.9, h * 0.55); g.lineTo(w * 0.7, h * 0.85); g.lineTo(w * 0.4, h * 0.75); g.lineTo(w * 0.15, h * 0.9); g.closePath(); g.fill();
      const gr = g.createRadialGradient(w * 0.85, h * 0.8, 10, w * 0.85, h * 0.8, w * 0.5); gr.addColorStop(0, 'rgba(10,6,2,0.95)'); gr.addColorStop(1, 'rgba(10,6,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.075}px 'PT Mono', monospace`; g.textAlign = 'left';
      ['АВАРИЙНЫЙ СЕАНС СВЯЗИ', 'с базой КСС — только', 'по СРЕДАМ. Частоту', 'брать из журнала', 'радиор…'].forEach((l, i) => g.fillText(l, w * 0.16, h * (0.27 + i * 0.12)));
    },
    map: (g, w, h) => {
      paper(g, w, h, '#cfc6a8');
      g.strokeStyle = 'rgba(80,60,30,0.6)'; for (let i = 0; i < 9; i++) { g.beginPath(); for (let x = 0; x <= w; x += 10) g.lineTo(x, h * (0.15 + i * 0.09) + Math.sin(x * 0.02 + i) * 14); g.stroke(); }
      g.fillStyle = '#2a1e14'; g.font = `700 ${h * 0.07}px 'Cormorant Garamond', serif`; g.textAlign = 'center'; g.fillText('ХИБИНЫ', w / 2, h * 0.12);
      g.font = `${h * 0.05}px 'PT Mono', monospace`; g.fillText('67° с. ш.', w * 0.85, h * 0.5); g.fillText('▲ отель «Полярная звезда»', w * 0.42, h * 0.62);
      g.strokeStyle = '#8a1e1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w, h * 0.5); g.stroke();
    },
    postcard: (g, w, h) => {
      g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1e26'; g.fillRect(w * 0.05, h * 0.06, w * 0.55, h * 0.88);
      g.fillStyle = '#c8d4dc'; g.beginPath(); g.moveTo(w * 0.05, h * 0.7); g.lineTo(w * 0.32, h * 0.3); g.lineTo(w * 0.6, h * 0.65); g.lineTo(w * 0.6, h * 0.94); g.lineTo(w * 0.05, h * 0.94); g.fill();
      const cs = w * 0.1;
      TILE_GOAL.forEach((t, i) => { const x = w * 0.12 + (i % 3) * cs * 1.1, y = h * 0.2 + Math.floor(i / 3) * cs * 1.1; g.fillStyle = '#c9a05a'; g.fillRect(x, y, cs, cs); g.fillStyle = '#1a1208'; g.font = `${cs * 0.6}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + cs / 2, y + cs / 2); });
      g.textBaseline = 'alphabetic';
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.055}px 'Marck Script', cursive`; g.textAlign = 'left';
      ['Привет из', '«Полярной звезды»!', 'Витраж над камином —', 'наша гордость.', 'Ждём вас снова.', '— И. Ветрова, 1961'].forEach((l, i) => g.fillText(l, w * 0.63, h * (0.2 + i * 0.11), w * 0.35));
    },
    hangers: (g, w, h) => {
      g.fillStyle = '#1e1416'; g.fillRect(0, 0, w, h);
      const doors = [['301', true], ['310', true], ['311', false], ['312', false], ['314', true]];
      doors.forEach(([n, hang], i) => {
        const x = w * (0.04 + i * 0.195), dw = w * 0.17;
        g.fillStyle = '#3a2418'; g.fillRect(x, h * 0.1, dw, h * 0.85);
        g.fillStyle = '#c9a05a'; g.font = `700 ${h * 0.08}px Georgia`; g.textAlign = 'center'; g.fillText(n, x + dw / 2, h * 0.22);
        g.fillStyle = '#b08a3a'; g.beginPath(); g.arc(x + dw * 0.8, h * 0.55, h * 0.025, 0, TAU); g.fill();
        if (hang) { g.fillStyle = '#d8ccb0'; g.fillRect(x + dw * 0.55, h * 0.58, dw * 0.4, h * 0.25); g.fillStyle = '#8a1e1e'; g.font = `${h * 0.035}px sans-serif`; g.fillText('НЕ', x + dw * 0.75, h * 0.66); g.fillText('БЕСПО-', x + dw * 0.75, h * 0.71); g.fillText('КОИТЬ', x + dw * 0.75, h * 0.76); }
      });
    },
  };

  // ================= Документы =================
  const DOCS = {
    plaque: { t: 'Латунная табличка', k: 'paper', text: 'ОТЕЛЬ «ПОЛЯРНАЯ ЗВЕЗДА»\n\nоткрыт для туристов и альпинистов\n14 декабря 1958 года\n\nМинистерство туризма Кольского полуострова' },
    memo: { t: 'Памятка дежурному', k: 'typed', text: 'ПАМЯТКА ДЕЖУРНОМУ ПО ЗИМНЕМУ СЕЗОНУ\n\nПуск аварийного генератора (подвал):\n1. Открыть подачу топлива.\n2. Прикрыть воздушную заслонку.\n3. Включить зажигание.\n4. Нажать пуск и держать до устойчивой работы.\nНЕ ПУТАТЬ ПОРЯДОК — заглохнет и зальёт свечу.\n\nПневмопочта: после пуска компрессора выставить РАБОЧЕЕ ДАВЛЕНИЕ по табличке на терминале этажа.' },
    tube_plate: { t: 'Табличка на терминале', k: 'paper', text: 'ПНЕВМОПОЧТА «СТРЕЛА-2»\n\nРабочее давление: 2,4 атм.\nКапсулу закрывать до щелчка.\nПри свисте — отойти от раструба.' },
    morse: { t: 'Плакат в вестибюле', k: 'img', img: 'morse', ratio: 0.9, cap: 'Пожелтевший плакат над стойкой: «Телеграф для гостей».' },
    book87: { t: 'Книга постояльцев 1987', k: 'paper', text: 'Книга пустая. Только первая страница:\n\n«Отель откроется после реставрации весной 1987 г. Брони не принимаются».\n\nИ ниже, свежими чернилами:\n«Номер 312 — забронирован. Ждём. И. В.»' },
    receiver: { t: 'Радиоприёмник', k: 'typed', text: 'Сквозь треск — ровные писки. Точки и тире. Повторяются снова и снова, будто кто-то стучит одно и то же уже очень давно.' },
    telegram: { t: 'Телеграмма 1962 года', k: 'typed', text: 'КИРОВСК ПОЛЯРНАЯ ЗВЕЗДА ВЕТРОВОЙ =\nГРУППА СЕВЕРОВА ПЯТЬ ЧЕЛОВЕК ЗПТ ВЫХОДИМ К ВАМ 11 ЯНВАРЯ ТЧК ДЕРЖИТЕ КАМИН ТЕПЛЫМ ТЧК\nСЕВЕРОВ' },
    climbers: { t: 'Фотография из чемодана', k: 'img', img: 'climbers', ratio: 0.62, cap: 'Пятеро в связке на гребне. Лица смазаны — будто снимок долго держали в мокрых руках.' },
    mirror: { t: 'Зеркало', k: 'hand', text: 'Ты дышишь на стекло — и на запотевшем зеркале проступают буквы, написанные пальцем изнутри:\n\n«нам холодно»' },
    logbook: { t: 'Журнал радиорубки', k: 'typed', text: 'ЖУРНАЛ АВАРИЙНОЙ СВЯЗИ · ЗИМА 1961/62\n\nЧастоты дежурных сеансов с базой КСС:\nПН — 2150 кГц\nВТ — 2780 кГц\nСР — 3470 кГц\nЧТ — 4120 кГц\nПТ — 1990 кГц\nСБ, ВС — сеансов нет\n\nПоследняя запись, 12.01.62: «Антенну завалило. Лебёдку без рукояти не поднять. Рукоять унесли вниз, к генератору. Связи нет».' },
    ash: { t: 'Обгоревшая карточка', k: 'img', img: 'ash', ratio: 0.7, cap: 'Нашлась в золе плиты. Край сгорел.' },
    radio_talk: { t: 'Радиосеанс', k: 'typed', text: '— «Полярная звезда», «Полярная звезда», говорит база КСС, слышим вас…\n— …лавина, двое людей, лестница обрушена…\n— Принято. До рассвета подняться не сможем, ветер. Держитесь.\n— …\n— «Полярная звезда»… кто вы? Этот отель закрыт с шестьдесят второго. По нашим записям, последний сеанс с вами был двенадцатого января шестьдесят второго года. Голос был… похож на ваш.' },
    guestbook62: { t: 'Книга постояльцев 1962', k: 'paper', text: (G) => `11 янв. 1962 — Группа Северова, 5 чел. Номер 312 и каминный зал.\nГромов П. · Ким В. · Лунина А. · Белых С. · Северов Р. (старший)\n\nНа полях, рукой Северова: «Если потеряемся — смотрите на Полярную. Азимут — ноль, высота над горизонтом — как наша широта». \n\n13 янв. 1962 — (почерк хозяйки) «Топливо кончилось. Закрыла зал, чтобы сберечь тепло для них. Я не знала, что не смогу открыть».\n\nВнизу — две пустые строки, подписанные: «для тех, кто придёт за ними».\nИ в этих строках, свежими чернилами:\n${G.names.up}\n${G.names.down}` },
    map: { t: 'Карта Хибин', k: 'img', img: 'map', ratio: 0.6, cap: 'Карта в раме у стойки. Широта отеля отмечена красной линией.' },
    postcard: { t: 'Открытка из телескопа', k: 'img', img: 'postcard', ratio: 0.62, cap: 'Открытка была спрятана в тубусе телескопа. На витраже над камином — девять символов в квадрате 3×3.' },
    hangers: { t: 'Двери коридора', k: 'img', img: 'hangers', ratio: 0.5, cap: 'На некоторых ручках висят таблички «Не беспокоить».' },
    diary: { t: 'Дневник хозяйки', k: 'hand', text: 'Ирина Ветрова, январь 1962.\n\nЯ закрыла зал. Ключ от нижних дверей спрятала в вестибюле, за витражом-мозаикой, — его откроет только тот, кто помнит, как она выглядела. Ключ от галереи — в моей шкатулке наверху.\n\nШкатулку отпирают так: сперва то, что греет, потом то, что светит, потом то, что ведёт, и в конце — то, что ждёт.\n\nЯ стучу им в стену каждую ночь. Они не отвечают.' },
  };

  // ================= Логика =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { room312: 'key_312', radio_room: 'key_hatch', cellar: 'key_cellar', suite: 'key_suite', generator: 'key_gen' };
  const ACT = {
    unlock(S, who, door) { const n = UNLOCK[door]; if (!n || S.f[door] || !has(S, who, n)) return null; rm(S, who, n); S.f[door] = 1; return ok(who, 'Ключ повернулся.', 'door'); },
    cabinet(S, who, v) { if (S.f.cabinet) return null; if (v === '1958') { S.f.cabinet = 1; return ok(who, 'Дверца ключницы открылась.', 'click'); } return bad(who); },
    fuel(S, who) { if (S.f.fuel || !has(S, who, 'canister')) return null; rm(S, who, 'canister'); S.f.fuel = 1; return ok(who, 'Бензин с бульканьем ушёл в бак.', 'drain'); },
    gen(S, who, v) { if (S.f.power || !S.f.fuel) return null; if (Array.isArray(v) && v.join() === GEN_ORDER.join()) { S.f.power = 1; return { a: 'power', who }; } return bad(who); },
    pressure(S, who, v) { if (S.f.pressure || !S.f.power) return null; if (v === '24') { S.f.pressure = 1; return { a: 'pressure', who }; } return bad(who); },
    suitcase(S, who, v) { if (S.f.suitcase) return null; if (v === '407') { S.f.suitcase = 1; return ok(who, 'Замки чемодана щёлкнули.', 'click'); } return bad(who); },
    knob(S, who) { if (S.f.stove || !has(S, who, 'knob')) return null; rm(S, who, 'knob'); S.f.stove = 1; return ok(who, 'Ручка села на ось конфорки.', 'click'); },
    boil(S, who) { if (!S.f.stove || !S.f.power || !has(S, who, 'kettle')) return null; rm(S, who, 'kettle'); S.inv[who].push('hot_kettle'); return ok(who, 'Чайник засвистел. Кипяток готов.', 'fire'); },
    thawdoor(S, who) { if (S.f.icehouse || !has(S, who, 'hot_kettle')) return null; rm(S, who, 'hot_kettle'); S.f.icehouse = 1; return ok(who, 'Лёд на замке треснул под кипятком. Дверь ледника подалась.', 'door'); },
    winch(S, who) { if (S.f.antenna || !has(S, who, 'winch')) return null; rm(S, who, 'winch'); S.f.antenna = 1; return ok(who, 'Лебёдка заскрипела. Где-то на крыше поднялась антенна.', 'mech'); },
    radio(S, who, v) { if (S.f.radio || !S.f.antenna) return null; if (v === '3470') { S.f.radio = 1; return { a: 'radio', who }; } return bad(who); },
    salt(S, who) { if (S.f.thaw || !has(S, who, 'salt')) return null; rm(S, who, 'salt'); S.f.thaw = 1; return ok(who, 'Соль зашипела на льду. Глыба осела, и из неё показался переплёт книги.', 'drain'); },
    scope(S, who, v) { if (S.f.scope) return null; if (v === '00067') { S.f.scope = 1; return ok(who, 'В окуляре — Полярная звезда. Тубус щёлкнул, и из него выпала открытка.', 'chime'); } return bad(who); },
    switch(S, who, v) { if (S.f.switch || !S.f.power) return null; if (v === '301,310,314') { S.f.switch = 1; return { a: 'phone', who }; } return bad(who); },
    bottles(S, who, v) { if (S.f.bottles) return null; if (Array.isArray(v) && v.join() === CLIMBERS.join()) { S.f.bottles = 1; return ok(who, 'Стеллаж с бутылками отъехал в сторону. За ним — ниша.', 'mech'); } return bad(who); },
    box(S, who, v) { if (S.f.box) return null; if (Array.isArray(v) && v.join() === BOX_ORDER.join()) { S.f.box = 1; return ok(who, 'Шкатулка тихо звякнула и раскрылась.', 'chime'); } return bad(who); },
    tiles(S, who, v) { if (S.f.tiles) return null; if (v === TILE_GOAL.join('')) { S.f.tiles = 1; return ok(who, 'Мозаика сложилась. Витраж отошёл — за ним ниша с ключом.', 'mech'); } return bad(who); },
    firebox(S, who) { if (S.f.firebox || !has(S, who, 'hammer')) return null; rm(S, who, 'hammer'); S.f.firebox = 1; return ok(who, 'Стекло пожарного шкафа разлетелось.', 'crash'); },
    boards(S, who) { if (S.f.boards || !has(S, who, 'axe')) return null; rm(S, who, 'axe'); S.f.boards = 1; return ok(who, 'Доски с треском отлетели от двери галереи.', 'crash'); },
  };
  const chapterOf = (S) => (!(S.f.power && S.f.pressure) ? 1 : !S.f.radio ? 2 : !S.f.cellar ? 3 : !(S.f.box && S.f.tiles) ? 4 : 5);
  const HINTS = [
    [(S) => !S.f.cabinet, 'Внизу ключница заперта на 4 цифры: «год, когда зажглась звезда». На этаже висит латунная табличка про открытие отеля.', 'Ключница за стойкой: «год, когда зажглась звезда». Спроси, что написано на табличке наверху.'],
    [(S) => !S.f.generator, 'Внизу нашли ключ от генераторной — пусть откроют.', 'Ключ «Генераторная» из ключницы открывает дверь в генераторную.'],
    [(S) => !S.f.fuel, 'Генератору нужно топливо — канистра на кухне внизу.', 'Канистра с бензином — на кухне. Залей в бак генератора.'],
    [(S) => !S.f.power, 'В коридоре висит «Памятка дежурному» с порядком пуска генератора. Продиктуй её вниз.', 'Рычаги генератора подписаны сокращениями. Порядок — в памятке у того, кто наверху.'],
    [(S) => !S.f.pressure, 'На терминале пневмопочты у тебя табличка с рабочим давлением. Скажи цифры вниз.', 'Компрессор в генераторной: выставь давление. Цифры — на табличке терминала наверху.'],
    [(S) => !S.f.room312, 'Ключ «312» внизу, в ключнице. Пусть отправят пневмопочтой.', 'Отправь ключ «312» наверх пневмопочтой (терминал в вестибюле).'],
    [(S) => !S.f.suitcase, 'Приёмник в 312 стучит морзянкой. Опиши вниз точки и тире — там висит таблица.', 'Плакат «Азбука Морзе» в вестибюле. Переводи то, что услышат наверху: получится код для чемодана.'],
    [(S) => !S.f.radio_room, 'Ключ от люка из чемодана открывает радиорубку (люк в коридоре).', 'Наверху открывают радиорубку.'],
    [(S) => !S.f.antenna, 'Антенну поднимает лебёдка — рукоять внизу, в генераторной. Попроси прислать.', 'Рукоять лебёдки лежит на полке в генераторной. Отправь её наверх.'],
    [(S) => !S.f.radio, 'Журнал радиорубки: частоты по дням недели. День — на обгоревшей карточке в плите на кухне внизу.', 'В плите на кухне — обгоревшая карточка про день сеанса. Прочитай её наверх.'],
    [(S) => !S.f.stove, 'Ручка плиты лежит в комоде в номере 312. Отправь её вниз.', 'Плите не хватает ручки — она наверху, в номере 312.'],
    [(S) => !S.f.icehouse, 'Внизу дверь ледника примёрзла — нужен кипяток.', 'Вскипяти чайник на плите и полей замок ледника.'],
    [(S) => !S.f.thaw, 'В леднике вмёрзла книга. Соль — на кухне внизу.', 'Глыба льда с книгой — посыпь солью (кладовая на кухне).'],
    [(S) => !S.f.scope, 'Телескоп: азимут и высота. Ответ — на полях книги 1962 года и на карте внизу.', 'Прочитай вверх запись Северова на полях книги и найди широту на карте у стойки.'],
    [(S) => !S.f.switch, 'Опиши вниз, на каких дверях коридора висят таблички «Не беспокоить».', 'Коммутатор: соедини номера, где висят «Не беспокоить». Спроси наверх.'],
    [(S) => !S.f.cellar, 'Ключ от погреба — в ящике коммутатора внизу.', 'Ключ из коммутатора открывает погреб (дверь на кухне).'],
    [(S) => !S.f.bottles, 'Бутылки в погребе подписаны фамилиями. Порядок — на обороте фото из чемодана.', 'Вытягивай бутылки в том порядке, в каком альпинисты шли в связке. Фото — наверху.'],
    [(S) => !S.f.suite, 'Ключ «301» в нише погреба. Пусть отправят.', 'Отправь ключ «301» наверх пневмопочтой.'],
    [(S) => !S.f.box, 'Шкатулка хозяйки: порядок — в её дневнике (погреб внизу).', 'Прочитай вверх, как отпирают шкатулку, — в дневнике хозяйки.'],
    [(S) => !S.f.tiles, 'Опиши вниз открытку из телескопа: символы витража 3×3.', 'Мозаика за стойкой: переставь символы как на открытке у того, кто наверху.'],
    [(S) => !S.f.firebox, 'Пожарный шкаф в коридоре — нужен молоток с кухни внизу.', 'Отправь наверх кухонный молоток — там пожарный шкаф.'],
    [(S) => !S.f.boards, 'Дверь галереи в апартаментах заколочена — топор из пожарного шкафа.', 'Наверху вскрывают дверь галереи.'],
    [(S) => !(S.f.insA && S.f.insB), 'Вставь ключ галереи в дверь каминного зала.', 'Вставь ключ зала в нижние двери каминного зала (вестибюль).'],
    [() => true, 'Поверните ключи одновременно: «три, два, один — сейчас!»', 'Поверните ключи одновременно: «три, два, один — сейчас!»'],
  ];

  // ================= Рисунки сцен =================
  const ART = (g, w, hh, key, K) => {
    const { fog, sky } = K;
    const snow = (n = 260) => { g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < n; i++) { const r = Math.random() * 2.2; g.fillRect(Math.random() * w, Math.random() * hh, r, r); } };
    const hotel = (x, y, s, lit) => {
      g.fillStyle = '#080a0e'; g.fillRect(x - s * 0.7, y - s * 0.6, s * 1.4, s * 0.6);
      g.beginPath(); g.moveTo(x - s * 0.78, y - s * 0.6); g.lineTo(x, y - s * 0.95); g.lineTo(x + s * 0.78, y - s * 0.6); g.fill();
      g.beginPath(); g.arc(x + s * 0.4, y - s * 0.8, s * 0.1, Math.PI, 0); g.fill(); g.fillRect(x + s * 0.3, y - s * 0.8, s * 0.2, s * 0.12);
      for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { const on = lit && ((i * 3 + j) % 5 === 1); g.fillStyle = on ? '#d8a860' : '#141820'; g.fillRect(x - s * 0.6 + i * s * 0.18, y - s * 0.52 + j * s * 0.16, s * 0.08, s * 0.1); }
      const gr = g.createRadialGradient(x - s * 0.1, y - s * 0.95, 0, x - s * 0.1, y - s * 0.95, s * 0.3); gr.addColorStop(0, 'rgba(255,240,200,0.6)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    };
    const mountains = (c) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, hh); g.lineTo(0, hh * 0.55); g.lineTo(w * 0.2, hh * 0.28); g.lineTo(w * 0.35, hh * 0.45); g.lineTo(w * 0.55, hh * 0.18); g.lineTo(w * 0.75, hh * 0.42); g.lineTo(w * 0.9, hh * 0.3); g.lineTo(w, hh * 0.4); g.lineTo(w, hh); g.fill(); };
    switch (key) {
      case 'mountain': case 'hotel':
        sky('#0c1420', '#2a3644'); g.fillStyle = '#ffffff'; for (let i = 0; i < 80; i++) g.fillRect(Math.random() * w, Math.random() * hh * 0.4, 1.2, 1.2);
        mountains('#1a2430'); g.fillStyle = '#c8d4dc'; g.beginPath(); g.moveTo(0, hh); g.lineTo(0, hh * 0.78); for (let x = 0; x <= w; x += 20) g.lineTo(x, hh * 0.78 - Math.sin(x * 0.008) * 18); g.lineTo(w, hh); g.fill();
        hotel(w * (key === 'hotel' ? 0.5 : 0.7), hh * 0.8, hh * (key === 'hotel' ? 0.5 : 0.32), true);
        snow(); fog(); break;
      case 'booking':
        sky('#14100c', '#0a0806');
        g.save(); g.translate(w / 2, hh / 2); g.rotate(0.04); g.fillStyle = '#d4c8a8'; g.fillRect(-w * 0.3, -hh * 0.4, w * 0.6, hh * 0.8);
        g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `700 ${hh * 0.06}px 'PT Mono', monospace`; g.fillText('БЛАНК БРОНИРОВАНИЯ № 0312', 0, -hh * 0.28);
        g.font = `${hh * 0.05}px 'PT Mono', monospace`; g.fillText('Гостиница «Полярная звезда»', 0, -hh * 0.18); g.fillText('Номер: 312    Мест: 2', 0, -hh * 0.06);
        g.font = `${hh * 0.07}px 'Marck Script', cursive`; g.fillText('«для тех, кто придёт за ними»', 0, hh * 0.08);
        g.font = `${hh * 0.05}px 'PT Mono', monospace`; g.fillText('Дата: 11.01.1962', 0, hh * 0.22); g.fillText('И. Ветрова', 0, hh * 0.32);
        g.restore(); break;
      case 'avalanche':
        sky('#1a2230', '#0a0e14'); mountains('#222c38');
        g.fillStyle = 'rgba(230,236,240,0.92)'; g.beginPath(); g.moveTo(w * 0.1, hh); for (let x = w * 0.1; x <= w; x += 12) g.lineTo(x, hh * 0.45 + Math.sin(x * 0.03) * 30 + (x - w * 0.1) * 0.15); g.lineTo(w, hh); g.fill();
        snow(600); hotel(w * 0.3, hh * 0.92, hh * 0.38, false); break;
      case 'split':
        sky('#0c0e12', '#040506'); g.fillStyle = '#c8d4dc'; g.fillRect(0, hh * 0.47, w, hh * 0.07);
        { const L = (x, y, c) => { const gr2 = g.createRadialGradient(x, y, 0, x, y, 160); gr2.addColorStop(0, c); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(0, 0, w, hh); }; L(w * 0.3, hh * 0.25, 'rgba(255,200,130,0.35)'); L(w * 0.65, hh * 0.78, 'rgba(150,190,220,0.3)'); }
        HA.figure(g, w * 0.3, hh * 0.22, hh * 0.12, '#000', '#2a2620'); HA.figure(g, w * 0.65, hh * 0.72, hh * 0.12, '#000', '#2a2620');
        g.strokeStyle = '#8a7a5a'; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.85, 0); g.lineTo(w * 0.85, hh); g.stroke(); break;
      case 'hall':
        sky('#140c08', '#060404');
        { const gr2 = g.createRadialGradient(w / 2, hh * 0.65, 0, w / 2, hh * 0.65, w * 0.45); gr2.addColorStop(0, 'rgba(255,160,70,0.55)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(0, 0, w, hh); }
        g.fillStyle = '#3a2418'; g.fillRect(w * 0.34, hh * 0.38, w * 0.32, hh * 0.52); g.fillStyle = '#4a3020'; g.fillRect(w * 0.32, hh * 0.36, w * 0.36, hh * 0.04);
        g.fillStyle = '#0a0604'; g.beginPath(); g.moveTo(w * 0.39, hh * 0.9); g.lineTo(w * 0.39, hh * 0.56); g.quadraticCurveTo(w / 2, hh * 0.44, w * 0.61, hh * 0.56); g.lineTo(w * 0.61, hh * 0.9); g.fill();
        for (let i = 0; i < 7; i++) { const fx = w * (0.42 + i * 0.027), fh = hh * (0.12 + Math.sin(i * 1.7) * 0.04 + (i === 3 ? 0.06 : 0)); const fg = g.createLinearGradient(0, hh * 0.88, 0, hh * 0.88 - fh); fg.addColorStop(0, '#ffe8a0'); fg.addColorStop(0.5, '#ff8a2a'); fg.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = fg; g.beginPath(); g.moveTo(fx - w * 0.025, hh * 0.88); g.quadraticCurveTo(fx - w * 0.01, hh * 0.88 - fh * 0.6, fx, hh * 0.88 - fh); g.quadraticCurveTo(fx + w * 0.01, hh * 0.88 - fh * 0.6, fx + w * 0.025, hh * 0.88); g.fill(); }
        g.fillStyle = '#2a1a10'; g.fillRect(w * 0.41, hh * 0.875, w * 0.18, hh * 0.025);
        for (let i = 0; i < 5; i++) { g.globalAlpha = 0.35; HA.figure(g, w * (0.18 + i * 0.16 + (i > 1 ? 0.04 : 0)), hh * 0.62, hh * 0.1, 'rgba(200,190,170,0.5)', 'rgba(230,220,200,0.6)'); g.globalAlpha = 1; }
        break;
      case 'dawn':
        sky('#8a9aa8', '#e8c8a0'); mountains('#5a6878');
        g.fillStyle = '#e8eef2'; g.beginPath(); g.moveTo(0, hh); g.lineTo(0, hh * 0.8); for (let x = 0; x <= w; x += 20) g.lineTo(x, hh * 0.8 - Math.sin(x * 0.008) * 14); g.lineTo(w, hh); g.fill();
        hotel(w * 0.35, hh * 0.82, hh * 0.36, false);
        g.fillStyle = '#20242a'; g.fillRect(w * 0.7, hh * 0.22, w * 0.08, hh * 0.03); g.fillRect(w * 0.66, hh * 0.2, w * 0.16, hh * 0.008);
        HA.stick(g, w * 0.55, hh * 0.86, hh * 0.05, '#20242a'); HA.stick(g, w * 0.59, hh * 0.86, hh * 0.05, '#20242a');
        break;
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  let _lit = null; const litMat = () => _lit || (_lit = new THREE.MeshBasicMaterial({ color: '#ffd8a0' }));
  const plate = (txt, w = 0.24, h = 0.1, bg = '#c9a36b', fg = '#2a1a0a') => HA.paperOn(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `700 ${H * 0.55}px Georgia`; g.textAlign = 'center'; g.fillText(txt, W / 2, H * 0.7); });
  const numDoor = (n, hang) => { const d = HA.door(1.0, 2.2); const p = plate(n); p.position.set(0.5, 1.75, 0.07); d.userData.leaf.add(p); if (hang) { const t = HA.paperOn(0.1, 0.16, (g, W, H) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, W, H); g.fillStyle = '#8a1e1e'; g.font = `700 ${H * 0.16}px sans-serif`; g.textAlign = 'center'; g.fillText('НЕ', W / 2, H * 0.35); g.fillText('БЕСП.', W / 2, H * 0.6); }); t.position.set(0.85, 0.95, 0.09); d.userData.leaf.add(t); } return d; };
  const tube = () => {
    const g = new THREE.Group();
    g.add(HA.C(0.06, 0.06, 2.0, HA.mat('brass'), 0, 2.2, 0, 12));
    g.add(HA.B(0.4, 0.5, 0.25, HA.mat('brass'), 0, 1.25, 0));
    const hatch = HA.B(0.28, 0.32, 0.03, HA.mat('iron'), 0, 1.25, 0.13); g.add(hatch);
    const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), HA.mat('porcelain')); gauge.position.set(0.12, 1.43, 0.13); g.add(gauge);
    const cap = HA.C(0.05, 0.05, 0.18, HA.mat('brass'), 0, 1.05, 0.05, 10); cap.rotation.z = Math.PI / 2; cap.visible = false; g.add(cap);
    g.userData = { cap };
    return g;
  };
  const snowWin = (w = 1.1, h = 1.5) => HA.window(w, h, '#b8ccd8');
  const ROOMS = {
    corridor: {
      size: [5.2, 3.0, 9], wall: 'damask_red', floor: 'wood_floor', fog: 0.08, amb: ['#3a2a30', '#0a0606', 0.24], yaw: 0, cam: [0, 1.6],
      build(R, A, T) {
        R.put(snowWin(1.0, 1.4), 'n', 0, 0.04);
        R.hot('c_door312', R.put(numDoor('312', false), 'w', 0.6, 0.06));
        R.hot('c_hangers', R.put(numDoor('310', true), 'w', -2.8, 0.06)); R.put(numDoor('311', false), 'e', -2.8, 0.06);
        R.hot('c_hangers2', R.put(numDoor('314', true), 'e', 1.7, 0.06));
        const d301 = numDoor('301', true); R.o.d301 = d301; R.hot('c_door301', R.put(d301, 's', -0.9, 0.06));
        R.hot('c_plaque', R.put(plate('ОТЕЛЬ «ПОЛЯРНАЯ ЗВЕЗДА» · 1958', 0.9, 0.22), 'e', -1.5, 0.02, 1.7));
        R.hot('c_memo', R.put(HA.paperOn(0.42, 0.58, (g, W, H) => { g.fillStyle = '#d4cab2'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; g.font = `700 ${H * 0.06}px 'PT Mono', monospace`; g.fillText('ПАМЯТКА', W * 0.1, H * 0.12); for (let i = 0; i < 9; i++) g.fillRect(W * 0.1, H * (0.2 + i * 0.08), W * (0.5 + Math.random() * 0.3), 2); }), 'w', -1.4, 0.02, 1.5));
        const tb = tube(); R.o.tube = tb; R.hot('c_tube', R.put(tb, 'e', 0.2, 0.15));
        const fb = new T.Group(); fb.add(A.B(0.6, 0.9, 0.22, new T.MeshStandardMaterial({ color: '#8a1e1e', roughness: 0.6 }), 0, 0, 0));
        const glass = new T.Mesh(new T.PlaneGeometry(0.5, 0.75), new T.MeshStandardMaterial({ color: '#a8c0c8', transparent: true, opacity: 0.35, roughness: 0.05 })); glass.position.z = 0.115; fb.add(glass);
        const ax = A.B(0.06, 0.6, 0.04, new T.MeshStandardMaterial({ color: '#c83030' }), 0, 0, 0.06); fb.add(ax); R.o.fbGlass = glass; R.o.fbAxe = ax;
        R.hot('c_firebox', R.put(fb, 'e', 3.4, 0.02, 1.2));
        const hatch = A.hatch(0.8); R.o.hatch = hatch; R.hot('c_hatch', R.at(hatch, 0.6, 2.98, -3.6));
        const lad = A.ladder(3.0); lad.position.set(0.6, 0, -4.4); R.g.add(lad);
        const rub = A.rubble(); R.hot('c_stairs', R.put(rub, 's', 0.9, 0.7));
        for (const z of [-3, 0, 3]) { const b = A.bulb(); R.at(b, 0, 3.0, z); R.o['b' + z] = b; }
        const runner = new T.Mesh(new T.PlaneGeometry(1.4, 9.6), new T.MeshStandardMaterial({ color: '#3a1418', roughness: 1 })); runner.rotation.x = -Math.PI / 2; runner.position.y = 0.008; R.g.add(runner);
      },
      update(R, S) {
        const f = S.f;
        for (const z of [-3, 0, 3]) { const b = R.o['b' + z]; b.userData.b.material = f.power ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = f.power ? 0.7 : 0; lightOn(b.userData.l, !!f.power, 1.1); }
        R.o.fbGlass.visible = !f.firebox; R.o.fbAxe.visible = !f.t_axe;
        R.o.hatch.userData.lid.rotation.x = f.radio_room ? -1.3 : 0;
        R.o.tube.userData.cap.visible = S.dw.pos === 'up' && !!f.pressure;
      },
    },
    room312: {
      size: [5, 3, 5], wall: 'damask_blue', floor: 'wood_floor', fog: 0.08, amb: ['#2a3444', '#0a0808', 0.26], yaw: 0, cam: [0, 0.6],
      build(R, A, T) {
        R.put(snowWin(1.0, 1.4), 'n', -0.9, 0.04);
        const bed = A.bed(1.4, 2.0, false); R.put(bed, 'w', 0.2, 1.05);
        const suit = new T.Group(); suit.add(A.B(0.7, 0.22, 0.45, new T.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.6 }), 0, 0.11, 0)); for (const x of [-0.2, 0.2]) suit.add(A.B(0.04, 0.24, 0.47, A.mat('black'), x, 0.11, 0)); suit.add(A.B(0.06, 0.05, 0.03, A.mat('brass'), 0, 0.16, 0.24));
        const lid = A.B(0.7, 0.04, 0.45, new T.MeshStandardMaterial({ color: '#5a3a22' }), 0, 0.24, 0); suit.add(lid); R.o.lid = lid;
        R.hot('r_suitcase', R.at(suit, -1.2, 0.58, 0.6, 0.3));
        const dr = new T.Group(); dr.add(A.B(1.1, 0.85, 0.5, A.mat('wood'), 0, 0.425, 0)); for (let i = 0; i < 3; i++) dr.add(A.B(1.0, 0.22, 0.02, A.mat('woodMid'), 0, 0.15 + i * 0.26, 0.26));
        const mir = new T.Mesh(new T.PlaneGeometry(0.7, 0.9), new T.MeshStandardMaterial({ color: '#8a9aa8', metalness: 0.9, roughness: 0.12 })); mir.position.set(0, 1.4, -0.2); dr.add(mir); dr.add(A.B(0.78, 0.98, 0.04, A.mat('wood'), 0, 1.4, -0.23));
        R.hot('r_dresser', R.put(dr, 'e', -0.5, 0.3));
        const rad = A.radio(); rad.scale.setScalar(1.6); const tbl = new T.Group(); tbl.add(A.B(0.6, 0.05, 0.4, A.mat('woodMid'), 0, 0.7, 0)); for (const x of [-0.25, 0.25]) for (const z of [-0.15, 0.15]) tbl.add(A.B(0.04, 0.7, 0.04, A.mat('woodMid'), x, 0.35, z)); rad.position.y = 0.72; tbl.add(rad);
        const lamp = new T.Mesh(new T.SphereGeometry(0.03, 8, 8), new T.MeshBasicMaterial({ color: '#401010' })); lamp.position.set(0.22, 1.05, 0.17); tbl.add(lamp); R.o.lamp = lamp;
        R.hot('r_receiver', R.put(tbl, 'n', 1.3, 0.35));
        R.hot('r_door', R.put(numDoor('312', false), 's', 1.2, 0.06));
        const nl = new T.PointLight('#8aa0c0', 0.6, 4, 2); nl.position.set(-0.9, 1.6, -2.0); R.g.add(nl);
      },
      update(R, S) { R.o.lid.rotation.x = S.f.suitcase ? -1.2 : 0; R.o.lid.position.set(0, S.f.suitcase ? 0.4 : 0.24, S.f.suitcase ? -0.2 : 0); },
      tick(R, G, dt, t) { R.o.lamp.material.color.set(Math.sin(t * 9) > 0.3 ? '#ff4040' : '#401010'); },
    },
    radio: {
      size: [4, 2.8, 4], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.09, amb: ['#2a2e3a', '#080606', 0.2], yaw: 0, cam: [0, 0.4],
      build(R, A, T) {
        const tx = new T.Group(); tx.add(A.B(1.6, 1.0, 0.5, new T.MeshStandardMaterial({ color: '#3a4238', roughness: 0.5, metalness: 0.3 }), 0, 1.1, 0));
        for (let i = 0; i < 4; i++) { const d = A.C(0.07, 0.07, 0.04, A.mat('black'), -0.5 + i * 0.33, 1.2, 0.26, 16); d.rotation.x = Math.PI / 2; tx.add(d); }
        const lamp = new T.Mesh(new T.SphereGeometry(0.04, 8, 8), new T.MeshBasicMaterial({ color: '#202020' })); lamp.position.set(0.6, 1.45, 0.26); tx.add(lamp); R.o.txLamp = lamp;
        tx.add(A.B(1.8, 0.06, 0.7, A.mat('woodMid'), 0, 0.6, 0.1)); const mic = A.C(0.03, 0.04, 0.2, A.mat('black'), -0.4, 0.73, 0.25, 8); tx.add(mic);
        R.hot('d_transmitter', R.put(tx, 'n', 0, 0.3));
        const log = A.paperOn(0.3, 0.22, (g, W, H) => { g.fillStyle = '#d4cab2'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; for (let i = 0; i < 8; i++) g.fillRect(W * 0.08, H * (0.12 + i * 0.1), W * 0.7, 2); }); log.rotation.x = -Math.PI / 2; R.hot('d_log', R.at(log, 0.5, 0.64, -1.45));
        const winch = new T.Group(); winch.add(A.C(0.15, 0.15, 0.4, A.mat('iron'), 0, 0, 0, 16)); winch.children[0].rotation.z = Math.PI / 2; winch.add(A.C(0.01, 0.01, 1.5, A.mat('cloth'), 0, 0.75, 0, 4));
        const handle = A.B(0.03, 0.25, 0.03, new T.MeshStandardMaterial({ color: '#c83030' }), 0.22, -0.1, 0.05); handle.visible = false; winch.add(handle); R.o.handle = handle;
        R.hot('d_winch', R.put(winch, 'e', 0.6, 0.25, 1.2));
        const lad = A.ladder(2.8); R.hot('d_ladder', R.put(lad, 'w', -0.8, 0.3));
        const hatchD = A.hatch(0.8); hatchD.rotation.x = Math.PI; R.hot('d_down', R.at(hatchD, 0.9, 0.02, 1.3));
        const l = new T.PointLight('#ffb070', 0.7, 4, 2); l.position.set(0, 2.4, 0); R.g.add(l);
      },
      update(R, S) { R.o.handle.visible = !!S.f.antenna; R.o.txLamp.material.color.set(S.f.radio ? '#30ff60' : S.f.antenna ? '#ffa020' : '#202020'); },
    },
    observatory: {
      size: [5, 3.2, 5], wall: 'wood_panel', floor: 'wood_attic', ceil: 'snow', fog: 0.06, amb: ['#3a4a6a', '#080810', 0.35], yaw: 0, cam: [0, 1.2],
      build(R, A, T) {
        const dome = new T.Mesh(new T.SphereGeometry(2.6, 24, 12, 0, TAU, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#2a2e3a', side: T.BackSide, roughness: 0.6, metalness: 0.4 })); dome.position.y = 3.0; R.g.add(dome);
        const slit = new T.Mesh(new T.PlaneGeometry(0.6, 2.4), new T.MeshBasicMaterial({ color: '#0a1428' })); slit.position.set(0, 4.6, -1.2); slit.rotation.x = 0.9; R.g.add(slit);
        for (let i = 0; i < 40; i++) { const s = A.glow('#ffffff', 0.05 + Math.random() * 0.06, 0.9); s.position.set((Math.random() - 0.5) * 0.5, 4.5 + Math.random() * 0.6, -1.1 - Math.random() * 0.6); R.g.add(s); }
        const scope = new T.Group(); scope.add(A.C(0.03, 0.03, 1.2, A.mat('black'), 0, 0.6, 0, 6));
        const tubeM = A.C(0.12, 0.09, 1.6, new T.MeshStandardMaterial({ color: '#d8d4c8', metalness: 0.4, roughness: 0.3 }), 0, 1.35, 0, 20); tubeM.rotation.set(-0.5, 0, -0.75); tubeM.position.x = 0.35; scope.add(tubeM);
        for (let i = 0; i < 3; i++) { const lg = A.C(0.02, 0.02, 1.0, A.mat('woodMid'), Math.cos(i * 2.1) * 0.3, 0.45, Math.sin(i * 2.1) * 0.3, 6); lg.rotation.set(Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3); scope.add(lg); }
        R.hot('o_scope', R.at(scope, 0, 0, -0.8));
        const chart = HA.paperOn(0.9, 0.6, (g, W, H) => { g.fillStyle = '#10182a'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8e0c8'; for (let i = 0; i < 60; i++) g.fillRect(Math.random() * W, Math.random() * H, 2, 2); g.strokeStyle = 'rgba(232,224,200,0.5)'; g.beginPath(); g.arc(W / 2, H / 2, H * 0.4, 0, TAU); g.stroke(); g.fillStyle = '#ffe7a6'; g.beginPath(); g.arc(W / 2, H * 0.15, 5, 0, TAU); g.fill(); });
        R.hot('o_chart', R.put(chart, 'w', 0, 0.02, 1.5));
        const hatchD = A.hatch(0.8); hatchD.rotation.x = Math.PI; R.hot('o_down', R.at(hatchD, 1.4, 0.02, 1.4));
        const ml = new T.PointLight('#9ab8ff', 0.9, 7, 2); ml.position.set(0, 2.8, -1); R.g.add(ml);
      },
    },
    suite: {
      size: [6, 3.2, 6], wall: 'damask_green', floor: 'wood_floor', fog: 0.08, amb: ['#2a3a30', '#0a0806', 0.24], yaw: 0, cam: [0, 0.6],
      build(R, A, T) {
        R.put(snowWin(1.0, 1.5), 'n', 1.6, 0.04);
        const gal = numDoor('ГАЛЕРЕЯ', false); const planks = new T.Group(); for (let i = 0; i < 3; i++) { const p = A.B(1.3, 0.14, 0.05, A.mat('woodMid'), 0.5, 0.6 + i * 0.55, 0.12); p.rotation.z = (i - 1) * 0.25; planks.add(p); } gal.userData.leaf.add(planks); R.o.planks = planks;
        R.hot('s_gallery', R.put(gal, 'n', -1.3, 0.06));
        const van = new T.Group(); van.add(A.B(1.2, 0.08, 0.5, A.mat('wood'), 0, 0.78, 0)); for (const x of [-0.55, 0.55]) van.add(A.B(0.08, 0.78, 0.45, A.mat('wood'), x, 0.39, 0));
        const box = new T.Group(); box.add(A.B(0.32, 0.18, 0.22, new T.MeshStandardMaterial({ color: '#3a1a2a', roughness: 0.4 }), 0, 0.09, 0)); for (let i = 0; i < 4; i++) box.add(A.B(0.06, 0.06, 0.02, A.mat('brass'), -0.11 + i * 0.075, 0.1, 0.115));
        const blid = A.B(0.33, 0.03, 0.23, new T.MeshStandardMaterial({ color: '#3a1a2a' }), 0, 0.19, 0); box.add(blid); R.o.blid = blid; box.position.y = 0.82; van.add(box);
        R.hot('s_box', R.put(van, 'e', 0.4, 0.3));
        R.put(A.bed(1.6, 2.0, false), 'w', 0.8, 1.05);
        const port = A.painting(0.7, 0.9, (g, w, h) => { HA.paintDark(g, w, h, '#1a1612'); HA.figure(g, w / 2, h * 0.4, h * 0.3, '#2a1a22', '#c8b898', false); });
        R.hot('s_portrait', R.put(port, 'w', -1.4, 0.04, 1.7));
        R.hot('s_door', R.put(numDoor('301', true), 's', 1.5, 0.06));
        const lamp = A.desk(0.9, true); R.put(lamp, 'e', -1.8, 0.4);
      },
      update(R, S) { R.o.planks.visible = !S.f.boards; R.o.blid.position.y = S.f.box ? 0.33 : 0.19; R.o.blid.rotation.x = S.f.box ? -1 : 0; },
    },
    lobby: {
      size: [8, 3.6, 8], wall: 'damask_green', floor: 'wood_floor', fog: 0.07, amb: ['#2a3440', '#0a0806', 0.2], yaw: 0, cam: [0, 1.0],
      build(R, A, T) {
        const hallDoor = new T.Group(); const d1 = A.door(1.1, 2.6), d2 = A.door(1.1, 2.6); d1.position.x = -0.56; d2.position.x = 0.56; d2.scale.x = -1; hallDoor.add(d1, d2);
        for (let i = 0; i < 3; i++) { const p = A.B(2.4, 0.16, 0.05, A.mat('woodMid'), 0, 0.7 + i * 0.7, 0.1); p.rotation.z = (i % 2 ? 0.2 : -0.15); hallDoor.add(p); }
        hallDoor.add(plate('КАМИННЫЙ ЗАЛ', 0.8, 0.14)); hallDoor.children[hallDoor.children.length - 1].position.set(0, 2.9, 0.08);
        R.hot('l_hall', R.put(hallDoor, 'n', 0, 0.06));
        const desk = new T.Group(); desk.add(A.B(3.0, 1.1, 0.7, A.mat('wood'), 0, 0.55, 0), A.B(3.1, 0.06, 0.8, A.mat('woodMid'), 0, 1.12, 0));
        const bell = A.C(0.06, 0.08, 0.06, A.mat('brass'), 0.9, 1.18, 0.1, 12); desk.add(bell);
        R.put(desk, 'w', 0.4, 1.4);
        const book = new T.Group(); book.add(A.B(0.36, 0.05, 0.26, A.mat('green'), 0, 0.025, 0)); R.hot('l_book87', R.put(book, 'w', 0.0, 1.5, 1.15));
        const cab = new T.Group(); cab.add(A.B(0.7, 0.9, 0.12, A.mat('wood'), 0, 0, 0)); const cdoor = A.B(0.64, 0.84, 0.03, new T.MeshStandardMaterial({ color: '#2a3a2a', transparent: true, opacity: 0.85 }), 0, 0, 0.07); cab.add(cdoor); R.o.cdoor = cdoor;
        for (let i = 0; i < 8; i++) cab.add(A.B(0.02, 0.06, 0.02, A.mat('brass'), -0.24 + (i % 4) * 0.16, 0.25 - Math.floor(i / 4) * 0.3, 0.06));
        R.hot('l_cabinet', R.put(cab, 'w', -1.4, 0.04, 1.7));
        R.hot('l_morse', R.put(HA.paperOn(0.7, 0.62, (g, W, H) => IMG.morse(g, W, H)), 'w', 2.2, 0.02, 1.9));
        R.hot('l_map', R.put(A.painting(0.8, 0.5, (g, W, H) => IMG.map(g, W, H)), 'w', 1.0, 0.04, 2.3));
        const tb = tube(); R.o.tube = tb; R.hot('l_tube', R.put(tb, 'e', -2.4, 0.15));
        const sw = new T.Group(); sw.add(A.B(0.9, 0.7, 0.2, A.mat('wood'), 0, 0, 0)); for (let i = 0; i < 6; i++) { const j = A.C(0.025, 0.025, 0.05, A.mat('brass'), -0.3 + i * 0.12, 0.1, 0.11, 8); j.rotation.x = Math.PI / 2; sw.add(j); }
        const phone = A.B(0.22, 0.08, 0.12, A.mat('black'), 0, 0.4, 0.05); sw.add(phone);
        R.hot('l_switch', R.put(sw, 'e', -0.6, 0.12, 1.3));
        const mosaic = A.painting(1.0, 1.0, (g, W, H) => { g.fillStyle = '#1a1208'; g.fillRect(0, 0, W, H); const cs = W / 3; TILE_START.forEach((t, i) => { g.fillStyle = ['#5a1a2a', '#1a3a5a', '#3a4a1a'][i % 3]; g.fillRect((i % 3) * cs + 4, Math.floor(i / 3) * cs + 4, cs - 8, cs - 8); g.fillStyle = '#e8d8a8'; g.font = `${cs * 0.5}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, (i % 3) * cs + cs / 2, Math.floor(i / 3) * cs + cs / 2); }); });
        R.o.mosaic = mosaic; R.hot('l_mosaic', R.put(mosaic, 'w', -0.3, 0.04, 2.3));
        const kd = A.door(1.0, 2.2); R.hot('l_kitchen', R.put(kd, 'e', 1.6, 0.06));
        const gd = A.door(1.0, 2.2); R.o.gdoor = gd; R.hot('l_generator', R.put(gd, 's', 2.2, 0.06));
        const front = new T.Group(); const fd = A.door(1.4, 2.6); front.add(fd); const snowPile = A.B(1.6, 1.4, 0.4, new T.MeshStandardMaterial({ map: A.surf('snow', [1, 1]) }), 0, 0.7, 0.3); front.add(snowPile);
        R.hot('l_front', R.put(front, 's', -1.4, 0.06));
        const ch = A.chandelier(); ch.position.set(0, 3.6, 0); R.g.add(ch); R.o.ch = ch;
        R.put(A.sheeted(1.4, 0.8, 0.8), 'e', 3.0, 0.6);
        const lantern = A.candles(1, 0, true); R.at(lantern, -2.6, 1.13, -0.3); R.o.lantern = lantern;
      },
      update(R, S) {
        const f = S.f;
        R.o.cdoor.rotation.y = f.cabinet ? -1.6 : 0; R.o.cdoor.position.x = f.cabinet ? -0.32 : 0;
        R.o.gdoor.userData.leaf.rotation.y = f.generator ? -1.2 : 0;
        lightOn(R.o.ch.userData.light, !!f.power, 1.6); R.o.ch.userData.flames.forEach((m) => (m.visible = !!f.power));
        R.o.tube.userData.cap.visible = S.dw.pos === 'down' && !!f.pressure;
        R.o.mosaic.visible = !f.tiles;
      },
    },
    kitchen: {
      size: [6, 3, 6], wall: 'tiles', floor: 'concrete', ceil: 'plaster', fog: 0.09, amb: ['#2a3434', '#060606', 0.18], yaw: 0, cam: [0, 0.6], trim: false,
      build(R, A, T) {
        const stove = new T.Group(); stove.add(A.B(1.4, 0.9, 0.7, A.mat('porcelain'), 0, 0.45, 0)); for (let i = 0; i < 4; i++) { const b = A.C(0.13, 0.13, 0.02, A.mat('black'), -0.35 + (i % 2) * 0.7, 0.91, -0.15 + Math.floor(i / 2) * 0.3, 16); stove.add(b); }
        const oven = A.B(1.0, 0.45, 0.02, A.mat('iron'), 0, 0.35, 0.36); stove.add(oven);
        const glow = A.glow('#ff5a20', 0.5, 0); glow.position.set(-0.35, 0.95, -0.15); stove.add(glow); R.o.glow = glow;
        R.hot('k_stove', R.put(stove, 'n', -1.2, 0.4));
        const shelf = new T.Group(); for (let y = 0; y < 4; y++) shelf.add(A.B(1.6, 0.04, 0.4, A.mat('woodMid'), 0, 0.4 + y * 0.5, 0)); shelf.add(A.B(0.04, 2.0, 0.4, A.mat('woodMid'), -0.8, 1.0, 0), A.B(0.04, 2.0, 0.4, A.mat('woodMid'), 0.8, 1.0, 0));
        for (let i = 0; i < 14; i++) shelf.add(A.C(0.06, 0.06, 0.16, new T.MeshStandardMaterial({ color: ['#8a6a3a', '#5a6a7a', '#7a3a2a'][i % 3] }), -0.65 + (i % 7) * 0.21, 0.5 + Math.floor(i / 7) * 0.5, 0, 10));
        R.hot('k_pantry', R.put(shelf, 'w', 0, 0.25));
        const table = new T.Group(); table.add(A.B(1.6, 0.06, 0.8, A.mat('woodMid'), 0, 0.85, 0)); for (const x of [-0.75, 0.75]) for (const z of [-0.35, 0.35]) table.add(A.B(0.06, 0.85, 0.06, A.mat('woodMid'), x, 0.42, z));
        R.o.canister = A.B(0.25, 0.35, 0.15, new T.MeshStandardMaterial({ color: '#a82a1e', metalness: 0.4 }), -0.5, 1.05, 0); table.add(R.o.canister);
        R.o.hammer = A.B(0.3, 0.05, 0.08, A.mat('iron'), 0.1, 0.9, 0.1); table.add(R.o.hammer);
        R.o.kettle = A.C(0.12, 0.14, 0.18, new T.MeshStandardMaterial({ color: '#3a7ab8', roughness: 0.3 }), 0.5, 0.97, -0.1, 14); table.add(R.o.kettle);
        R.hot('k_table', R.at(table, 0.6, 0, 0.6));
        const icd = A.ironDoor(1.1, 2.1); R.o.icd = icd; const frost = A.B(1.2, 2.2, 0.05, new T.MeshStandardMaterial({ map: A.surf('ice', [1, 1]), transparent: true, opacity: 0.6 }), 0, 1.05, 0.08); icd.add(frost); R.o.frost = frost;
        R.hot('k_icehouse', R.put(icd, 'e', -1.2, 0.08));
        const cd = A.door(1.0, 2.1); R.o.cdoor = cd; R.hot('k_cellar', R.put(cd, 'e', 1.6, 0.06));
        R.hot('k_back', R.put(A.door(1.0, 2.2), 's', 0, 0.06));
        const b = A.bulb(); R.at(b, 0, 3, 0); R.o.bulb = b;
      },
      update(R, S) {
        const f = S.f, b = R.o.bulb;
        b.userData.b.material = f.power ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = f.power ? 0.7 : 0; lightOn(b.userData.l, !!f.power, 1.3);
        R.o.canister.visible = !f.t_canister; R.o.hammer.visible = !f.t_hammer; R.o.kettle.visible = !f.t_kettle;
        R.o.glow.material.opacity = f.stove && f.power ? 0.6 : 0;
        R.o.frost.visible = !f.icehouse; R.o.icd.userData.leaf.position.x = f.icehouse ? 1.1 : 0;
        R.o.cdoor.userData.leaf.rotation.y = f.cellar ? -1.2 : 0;
      },
    },
    generator: {
      size: [6, 3, 6.4], wall: 'bricks', floor: 'concrete', ceil: 'concrete', fog: 0.1, amb: ['#1a2a30', '#060404', 0.14], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        const gen = new T.Group(); gen.add(A.B(1.8, 1.0, 0.9, new T.MeshStandardMaterial({ color: '#3a4a3a', roughness: 0.5, metalness: 0.4 }), 0, 0.5, 0));
        const tank = A.C(0.3, 0.3, 1.6, A.mat('rust'), 0, 1.25, -0.1, 16); tank.rotation.z = Math.PI / 2; gen.add(tank);
        const levers = [];
        for (let i = 0; i < 4; i++) { const lv = A.B(0.04, 0.3, 0.04, A.mat('black'), -0.45 + i * 0.3, 0.8, 0.47); lv.rotation.x = 0.4; gen.add(lv); levers.push(lv); }
        const fire = A.glow('#ffb060', 0.6, 0); fire.position.set(0.7, 0.9, 0.5); gen.add(fire);
        gen.userData = { levers, fire };
        R.o.gen = gen; R.hot('g_gen', R.put(gen, 'n', -0.6, 0.6));
        const comp = new T.Group(); comp.add(A.C(0.3, 0.3, 1.0, new T.MeshStandardMaterial({ color: '#5a6a7a', metalness: 0.5, roughness: 0.4 }), 0, 0.5, 0, 16));
        const gauge = new T.Mesh(new T.CircleGeometry(0.1, 20), A.mat('porcelain')); gauge.position.set(0, 0.8, 0.31); comp.add(gauge);
        const needle = A.B(0.01, 0.08, 0.005, A.mat('red'), 0, 0.82, 0.32); comp.add(needle); R.o.needle = needle;
        comp.add(A.C(0.04, 0.04, 2.0, A.mat('brass'), 0, 2.0, 0, 8));
        R.hot('g_comp', R.put(comp, 'e', -0.8, 0.5));
        const shelf = new T.Group(); shelf.add(A.B(1.2, 0.04, 0.35, A.mat('woodMid'), 0, 1.3, 0)); const wh = A.B(0.25, 0.04, 0.04, new T.MeshStandardMaterial({ color: '#c83030' }), 0, 1.35, 0); shelf.add(wh); R.o.wh = wh;
        R.hot('g_shelf', R.put(shelf, 'w', 0.4, 0.2));
        R.hot('g_back', R.put(A.door(1.0, 2.2), 's', 1.4, 0.06));
        R.o.bulbs = [A.bulb(), A.bulb()]; R.at(R.o.bulbs[0], -1.2, 3, 0); R.at(R.o.bulbs[1], 1.4, 3, 0.6);
        for (const z of [-2.2, 1.0]) { const p = A.C(0.07, 0.07, 6, A.mat('pipe'), 0, 2.7, z, 10); p.rotation.z = Math.PI / 2; R.g.add(p); }
      },
      update(R, S) {
        const f = S.f;
        R.o.gen.userData.levers.forEach((l) => (l.rotation.x = f.power ? -0.4 : 0.4));
        R.o.gen.userData.fire.material.opacity = f.power ? 0.6 : 0;
        for (const b of R.o.bulbs) { b.userData.b.material = f.power ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = f.power ? 0.8 : 0; lightOn(b.userData.l, !!f.power, 1.4); }
        R.o.needle.rotation.z = f.pressure ? -0.6 : 1.2; R.o.wh.visible = f.power && !f.t_winch;
      },
      tick(R, G, dt, t) { if (G.S.f.power) R.o.gen.position.x = -0.6 + Math.sin(t * 60) * 0.004; },
    },
    icehouse: {
      size: [4, 2.6, 5], wall: 'ice', floor: 'ice', ceil: 'ice', fog: 0.06, amb: ['#6a8aa8', '#101820', 0.45], yaw: 0, cam: [0, 1.2], trim: false,
      build(R, A, T) {
        for (const x of [-1.2, -0.4, 0.4, 1.2]) { const c = new T.Group(); c.add(A.C(0.005, 0.005, 0.5, A.mat('iron'), 0, 2.35, 0, 4)); const m = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.16, 0.7, 4, 8) : new T.CylinderGeometry(0.16, 0.16, 1, 8), new T.MeshStandardMaterial({ color: '#8a4a4a', roughness: 0.7 })); m.position.y = 1.6; c.add(m); R.at(c, x, 0, -1.4); }
        const block = new T.Group(); block.add(A.B(0.9, 0.7, 0.7, new T.MeshStandardMaterial({ color: '#c8e8f8', transparent: true, opacity: 0.7, roughness: 0.05 }), 0, 0.35, 0));
        const bk = A.B(0.3, 0.06, 0.24, A.mat('red'), 0, 0.4, 0); block.add(bk); R.o.block = block.children[0];
        R.hot('i_block', R.at(block, 0.3, 0, 0.6));
        R.hot('i_back', R.put(A.ironDoor(1.1, 2.1), 's', 0, 0.08));
        const l = new T.PointLight('#a8d0ff', 0.9, 6, 2); l.position.set(0, 2.2, 0); R.g.add(l);
      },
      update(R, S) { R.o.block.scale.y = S.f.thaw ? 0.35 : 1; R.o.block.position.y = S.f.thaw ? 0.12 : 0.35; },
    },
    cellar: {
      size: [4, 2.6, 6], wall: 'stone', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.1, amb: ['#2a2420', '#060404', 0.16], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        const rack = new T.Group(); rack.add(A.B(2.4, 2.0, 0.4, A.mat('wood'), 0, 1.0, -0.05));
        for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const b = A.C(0.04, 0.04, 0.3, new T.MeshStandardMaterial({ color: r === 2 && c % 2 === 0 ? '#3a1a1e' : '#1a2a1e', roughness: 0.2 }), -1.0 + c * 0.25, 0.3 + r * 0.38, 0.2, 8); b.rotation.x = Math.PI / 2; rack.add(b); }
        R.o.rack = rack; R.hot('w_rack', R.put(rack, 'n', 0, 0.25));
        const niche = new T.Mesh(new T.PlaneGeometry(1.0, 1.4), A.mat('black')); R.put(niche, 'n', -1.2, 0.01, 0.8);
        R.hot('w_back', R.put(A.door(1.0, 2.1), 's', 0, 0.06));
        R.at(A.candles(3, 0.1, true), 1.4, 0, 2.2);
        for (let i = 0; i < 3; i++) { const barrel = A.C(0.35, 0.35, 0.8, A.mat('woodMid'), 0, 0.4, 0, 16); barrel.rotation.z = Math.PI / 2; R.at((() => { const gg = new T.Group(); gg.add(barrel); return gg; })(), 1.4, 0, -0.8 + i * 0.85); }
      },
      update(R, S) { R.o.rack.position.x = S.f.bottles ? 1.1 : 0; },
    },
    hall: {
      size: [7, 4, 7], wall: 'damask_red', floor: 'wood_floor', fog: 0.05, amb: ['#6a4a3a', '#140c08', 0.5], yaw: 0, cam: [0, 1.5],
      build(R, A, T) {
        const fp = A.fireplace(); fp.scale.setScalar(1.4); R.put(fp, 'n', 0, 0.3);
        const fire = new T.PointLight('#ff9040', 2.5, 9, 2); fire.position.set(0, 0.8, -2.7); R.g.add(fire); R.o.fire = fire;
        const fl = A.glow('#ff8030', 2.0, 0.9); fl.position.set(0, 0.7, -2.9); R.g.add(fl);
        for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; const ch = new T.Group(); ch.add(A.B(0.5, 0.06, 0.5, A.mat('woodMid'), 0, 0.48, 0), A.B(0.5, 0.6, 0.06, A.mat('woodMid'), 0, 0.8, -0.22)); const hat = A.C(0.12, 0.14, 0.12, new T.MeshStandardMaterial({ color: ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#8a7a2a', '#5a3a6a'][i] }), 0, 1.12, -0.2, 10); ch.add(hat); R.at(ch, Math.sin(a) * 2.2, 0, -0.6 + Math.cos(a) * -0.4, -a); }
        const tbl = new T.Group(); tbl.add(A.C(0.6, 0.6, 0.05, A.mat('wood'), 0, 0.7, 0, 20), A.C(0.06, 0.06, 0.7, A.mat('wood'), 0, 0.35, 0, 8)); for (let i = 0; i < 5; i++) tbl.add(A.C(0.04, 0.035, 0.1, A.mat('porcelain'), Math.cos(i * 1.26) * 0.35, 0.78, Math.sin(i * 1.26) * 0.35, 8)); R.hot('q_any', R.at(tbl, 0, 0, 0.4));
        const sg = A.stainedGlass((g, w, h) => { g.fillStyle = '#100808'; g.fillRect(0, 0, w, h); const cs = w / 3.4; TILE_GOAL.forEach((t, i) => { g.fillStyle = ['#8a2a3a', '#2a4a8a', '#4a6a2a'][i % 3]; g.fillRect(w * 0.05 + (i % 3) * cs * 1.05, h * 0.3 + Math.floor(i / 3) * cs * 1.05, cs, cs); g.fillStyle = '#fff2c8'; g.font = `${cs * 0.6}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w * 0.05 + (i % 3) * cs * 1.05 + cs / 2, h * 0.3 + Math.floor(i / 3) * cs * 1.05 + cs / 2); }); });
        R.put(sg, 'n', 0, 0.02, 2.0);
      },
      tick(R, G, dt, t) { R.o.fire.intensity = 2.3 + Math.sin(t * 9) * 0.3 + Math.random() * 0.3; G.tyaw += dt * 0.04; },
    },
  };

  // ================= Точки интереса =================
  function hot(G, { use, bindUse, P }) {
    const nm = (k) => G.nm(k);
    const seqPanel = (t, desc, items, key, act, n, cls) => () => {
      const p = G.ps; p.seq = p.seq || [];
      return { t, html: `<p class="hs-txt">${desc}</p><div class="${cls || 'hs-dolls'}">${items.map((it) => `<button data-s="${it.id}" class="${p.seq.includes(it.id) ? 'sel' : ''}">${it.l}</button>`).join('')}</div><p class="hs-cap">Нажато: ${p.seq.length} из ${n}</p><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => { el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.s)) return; p.seq.push(b.dataset.s); G.snd(key); if (p.seq.length === n) G.act(act, p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } };
    };
    return {
      // ---------- Коридор ----------
      c_door312: (o, S, f) => { if (f.room312) return G.go('room312'); P(() => ({ t: 'Номер 312', html: `<p class="hs-txt">Ваш номер. Заперт. Из-под двери тянет морозом, и слышно, как внутри что-то пищит — ровно, монотонно.</p>${use('key_312', 'Отпереть ключом «312»', 'unlock', 'room312')}`, bind: bindUse }), o); },
      c_door301: (o, S, f) => { if (f.suite) return G.go('suite'); P(() => ({ t: 'Апартаменты 301', html: `<p class="hs-txt">Дверь хозяйки в конце коридора. На ручке — табличка «Не беспокоить». Заперто.</p>${use('key_suite', 'Отпереть ключом «301»', 'unlock', 'suite')}`, bind: bindUse }), o); },
      c_hangers: (o) => G.doc('hangers', o),
      c_hangers2: (o) => G.doc('hangers', o),
      c_plaque: (o) => G.doc('plaque', o),
      c_memo: (o) => G.doc('memo', o),
      c_tube: (o, S, f) => P(() => { const sp = G.dwPanel(); sp.html = `<button class="hs-btn ghost" data-doc="tube_plate">Табличка на терминале</button>` + sp.html; return sp; }, o),
      c_firebox: (o, S, f) => P(() => f.firebox ? { t: 'Пожарный шкаф', html: `<p class="hs-txt">Стекло разбито.</p>${G.takeHtml(['axe']) || '<p class="hs-cap">Пусто.</p>'}` } : { t: 'Пожарный шкаф', html: `<p class="hs-txt">За толстым стеклом — пожарный топор. «Разбить при пожаре». Рукой не разбить — нужно что-то тяжёлое.</p>${use('hammer', 'Разбить стекло молотком', 'firebox')}`, bind: bindUse }, o),
      c_hatch: (o, S, f) => { if (f.radio_room) return G.go('radio'); P(() => ({ t: 'Люк в потолке', html: `<p class="hs-txt">Люк в радиорубку. На замке жетон «РАДИО».</p>${use('key_hatch', 'Отпереть ключом от люка', 'unlock', 'radio_room')}`, bind: bindUse }), o); },
      c_stairs: (o) => { G.say('Лестница', `Пролёт обрушился, внизу — снег и обломки. Где-то там ${nm('down')}. Слышно, если кричать в вентиляцию.`); G.focusOn(o); },
      // ---------- Номер 312 ----------
      r_door: () => G.go('corridor'),
      r_suitcase: (o, S, f) => {
        if (f.suitcase) return P(() => ({ t: 'Чемодан', html: `<p class="hs-txt">Кожаный чемодан с инициалами «Р. С.». Внутри — вещи 1962 года, аккуратно сложенные.</p><button class="hs-btn ghost" data-doc="telegram">Телеграмма</button><button class="hs-btn ghost" data-doc="climbers">Фотография</button>${G.takeHtml(['key_hatch'])}` }), o);
        P(() => G.wheelsPanel({ t: 'Чемодан', desc: 'Старый кожаный чемодан с инициалами «Р. С.» на кровати. Кодовый замок на три цифры.', n: 3, chars: '0123456789', act: 'suitcase' }), o);
      },
      r_dresser: (o, S, f) => P(() => ({ t: 'Комод', html: `<p class="hs-txt">В верхнем ящике — гостиничная Библия, пуговица и ${f.t_knob ? '…больше ничего' : 'бакелитовая ручка от кухонной плиты. Странно, что она здесь'}.</p>${G.takeHtml(['knob'])}<button class="hs-btn ghost" data-doc="mirror">Подышать на зеркало</button>` }), o),
      r_receiver: (o) => P(() => ({ t: 'Радиоприёмник', html: `<p class="hs-txt">Приёмник «Балтика» включён сам по себе. Красная лампочка мигает в такт пискам.</p><div class="hs-morse"><i id="hsLamp"></i></div><div class="hs-mline" id="hsLine"></div><button class="hs-btn" id="hsPlay">Слушать</button><p class="hs-cap">Записывай: точка — короткий писк, тире — длинный. Пробел — пауза между знаками. Таблицы здесь нет.</p>`, bind: (el) => ($('#hsPlay', el).onclick = () => G.playMorse($('#hsLamp', el), $('#hsLine', el))) }), o),
      // ---------- Радиорубка ----------
      d_down: () => G.go('corridor'),
      d_log: (o) => G.doc('logbook', o),
      d_winch: (o, S, f) => P(() => ({ t: 'Лебёдка антенны', html: f.antenna ? '<p class="hs-txt">Антенна поднята. Трос натянут и гудит на ветру.</p>' : `<p class="hs-txt">Ручная лебёдка поднимает антенну на крышу. Рукояти нет — только квадратное гнездо.</p>${use('winch', 'Вставить рукоять и крутить', 'winch')}`, bind: bindUse }), o),
      d_transmitter: (o, S, f) => {
        if (f.radio) return P(() => ({ t: 'Передатчик', html: '<p class="hs-txt">Лампа горит зелёным. База больше не отвечает — только шорох.</p><button class="hs-btn ghost" data-doc="radio_talk">Перечитать сеанс</button>' }), o);
        if (!f.antenna) return P(() => ({ t: 'Передатчик', html: '<p class="hs-txt">Ламповый передатчик «Р-104». Стрелка уровня сигнала на нуле — антенна не поднята.</p>' }), o);
        P(() => G.wheelsPanel({ t: 'Передатчик', desc: 'Антенна поднята, лампа горит жёлтым. Выставь частоту в килогерцах и нажми «Вызов».', n: 4, chars: '0123456789', act: 'radio', label: 'Вызов' }), o);
      },
      d_ladder: (o, S, f) => { if (f.radio) return G.go('observatory'); G.say('Лестница в купол', 'Люк в купол обсерватории заперт электрозамком. Рядом табличка: «Управление — с пульта радиорубки, после сеанса связи».'); G.focusOn(o); },
      // ---------- Купол ----------
      o_down: () => G.go('radio'),
      o_chart: (o) => { G.say('Звёздная карта', 'Карта северного неба. Полярная звезда обведена — от неё лучами расходятся подписи: «азимут», «высота». Высота Полярной над горизонтом всегда равна широте места.'); G.focusOn(o); },
      o_scope: (o, S, f) => {
        if (f.scope) return P(() => ({ t: 'Телескоп', html: '<p class="hs-txt">В окуляре — Полярная звезда, ровная и яркая.</p><button class="hs-btn ghost" data-doc="postcard">Открытка из тубуса</button>' }), o);
        P(() => G.wheelsPanel({ t: 'Телескоп', desc: 'Старый рефрактор на треноге. Два лимба: азимут (три цифры, градусы) и высота над горизонтом (две цифры).', n: 5, chars: '0123456789', act: 'scope', label: 'Навести', top: ['азим', 'азим', 'азим', 'выс', 'выс'] }), o);
      },
      // ---------- Апартаменты 301 ----------
      s_door: () => G.go('corridor'),
      s_portrait: (o) => { G.say('Портрет хозяйки', 'Ирина Ветрова, 1958. Строгое лицо, звёздочка-брошь на воротнике. Глаза на портрете смотрят в сторону двери галереи.'); G.focusOn(o); },
      s_box: (o, S, f) => {
        if (f.box) return P(() => ({ t: 'Шкатулка', html: `<p class="hs-txt">Шкатулка раскрыта. Внутри на бархате — чугунный ключ.</p>${G.takeHtml(['key_a'])}` }), o);
        P(seqPanel('Шкатулка хозяйки', 'Лакированная шкатулка. На крышке — четыре латунные кнопки с рисунками. Нажимать надо в определённом порядке.', BOX.map((b) => ({ id: b.id, l: `${b.s} ${b.n}` })), 'click', 'box', 4), o);
      },
      s_gallery: (o, S, f) => {
        if (!f.boards) return P(() => ({ t: 'Дверь галереи', html: `<p class="hs-txt">Дверь на галерею каминного зала заколочена крест-накрест толстыми досками. С той стороны — холод, как из могилы.</p>${use('axe', 'Сбить доски топором', 'boards')}`, bind: bindUse }), o);
        P(() => G.finalPanel(), o);
      },
      // ---------- Вестибюль ----------
      l_hall: (o) => P(() => G.finalPanel(), o),
      l_book87: (o) => G.doc('book87', o),
      l_cabinet: (o, S, f) => {
        if (f.cabinet) return P(() => ({ t: 'Ключница', html: `<p class="hs-txt">Дверца открыта. Почти все крючки пусты.</p>${G.takeHtml(['key_gen', 'key_312']) || '<p class="hs-cap">Больше ключей нет.</p>'}` }), o);
        P(() => G.wheelsPanel({ t: 'Ключница', desc: 'Застеклённая ключница за стойкой. Замок на четыре цифры, под ним гравировка: «Год, когда зажглась звезда».', n: 4, chars: '0123456789', act: 'cabinet' }), o);
      },
      l_morse: (o) => G.doc('morse', o),
      l_map: (o) => G.doc('map', o),
      l_tube: (o) => P(() => G.dwPanel(), o),
      l_switch: (o, S, f) => P(() => {
        if (f.switch) return { t: 'Коммутатор', html: `<p class="hs-txt">Нижний ящик коммутатора выдвинулся.</p>${G.takeHtml(['key_cellar']) || '<p class="hs-cap">Ящик пуст.</p>'}` };
        if (!f.power) return { t: 'Коммутатор', html: '<p class="hs-txt">Гостиничный коммутатор. Без электричества мёртвый.</p>' };
        const p = G.ps; p.on = p.on || {};
        return { t: 'Коммутатор', html: `<p class="hs-txt">Шесть гнёзд с номерами комнат. На крышке надпись хозяйки: «Звонить только тем, кто просил не беспокоить. Они поймут».</p><div class="hs-dolls">${JACKS.map((j) => `<button data-j="${j}" class="${p.on[j] ? 'sel' : ''}">${j}</button>`).join('')}</div><button class="hs-btn" id="hsGo">Позвонить</button>`,
          bind: (el) => { el.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => { p.on[b.dataset.j] = !p.on[b.dataset.j]; G.snd('click'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('switch', JACKS.filter((j) => p.on[j]).join()); } };
      }, o),
      l_mosaic: (o, S, f) => P(() => {
        if (f.tiles) return { t: 'Мозаика', html: `<p class="hs-txt">Мозаика отошла от стены. В нише — ключ.</p>${G.takeHtml(['key_b'])}` };
        const p = G.ps; p.t = p.t || TILE_START.slice();
        return { t: 'Мозаика-витраж', html: `<p class="hs-txt">Мозаика из девяти плиток за стойкой. Плитки можно менять местами: нажми одну, потом другую. Кажется, их кто-то перемешал.</p><div class="hs-tiles">${p.t.map((s, i) => `<button data-i="${i}" class="${p.sel === i ? 'sel' : ''}">${s}</button>`).join('')}</div><button class="hs-btn" id="hsGo">Нажать на центр мозаики</button>`,
          bind: (el) => { el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { const i = +b.dataset.i; if (p.sel == null) p.sel = i; else { [p.t[p.sel], p.t[i]] = [p.t[i], p.t[p.sel]]; p.sel = null; G.snd('book'); } G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('tiles', p.t.join('')); } };
      }, o),
      l_kitchen: () => G.go('kitchen'),
      l_generator: (o, S, f) => { if (f.generator) return G.go('generator'); P(() => ({ t: 'Дверь «Генераторная»', html: `<p class="hs-txt">Железная дверь в подвал. Заперта.</p>${use('key_gen', 'Отпереть ключом', 'unlock', 'generator')}`, bind: bindUse }), o); },
      l_front: (o) => { G.snd('wind'); G.say('Входная дверь', 'Дверь не открывается: снаружи навалило снега выше человеческого роста. В щели свистит ветер.'); G.focusOn(o); },
      // ---------- Кухня ----------
      k_back: () => G.go('lobby'),
      k_table: (o) => P(() => ({ t: 'Разделочный стол', html: `<p class="hs-txt">На столе — то, что бросили в спешке.</p>${G.takeHtml(['canister', 'hammer', 'kettle']) || '<p class="hs-cap">Стол пуст.</p>'}` }), o),
      k_pantry: (o) => P(() => ({ t: 'Кладовая', html: `<p class="hs-txt">Банки с тушёнкой 1961 года, сахар, мука — всё смёрзлось.</p>${G.takeHtml(['salt'])}` }), o),
      k_stove: (o, S, f) => P(() => {
        let html = '<p class="hs-txt">Электроплита «Мечта». В духовке — зола, и в ней обгоревшая карточка.</p><button class="hs-btn ghost" data-doc="ash">Обгоревшая карточка</button>';
        if (!f.stove) html += `<p class="hs-cap">У конфорки нет ручки.</p>${use('knob', 'Поставить ручку', 'knob')}`;
        else if (!f.power) html += '<p class="hs-cap">Ручка на месте, но тока нет.</p>';
        else html += G.has('kettle') ? '<button class="hs-btn" data-use="boil">Вскипятить чайник</button>' : '<p class="hs-cap">Плита работает. Нужен чайник.</p>';
        return { t: 'Плита', html, bind: bindUse };
      }, o),
      k_icehouse: (o, S, f) => { if (f.icehouse) return G.go('icehouse'); P(() => ({ t: 'Дверь ледника', html: `<p class="hs-txt">Тяжёлая дверь холодильной камеры. Замок и петли заросли толстым льдом.</p>${use('hot_kettle', 'Полить замок кипятком', 'thawdoor')}`, bind: bindUse }), o); },
      k_cellar: (o, S, f) => { if (f.cellar) return G.go('cellar'); P(() => ({ t: 'Дверь погреба', html: `<p class="hs-txt">Низкая дверь вниз, в погреб. Заперта.</p>${use('key_cellar', 'Отпереть ключом', 'unlock', 'cellar')}`, bind: bindUse }), o); },
      // ---------- Генераторная ----------
      g_back: () => G.go('lobby'),
      g_gen: (o, S, f) => {
        if (f.power) return P(() => ({ t: 'Генератор', html: '<p class="hs-txt">Генератор ровно тарахтит. Свет по всему отелю.</p>' }), o);
        if (!f.fuel) return P(() => ({ t: 'Генератор', html: `<p class="hs-txt">Дизель-генератор. Бак сухой.</p>${use('canister', 'Залить бензин', 'fuel')}`, bind: bindUse }), o);
        P(seqPanel('Генератор', 'Бак залит. Четыре рычага с сокращениями. Если перепутать порядок — двигатель захлебнётся.', GEN, 'lever', 'gen', 4), o);
      },
      g_comp: (o, S, f) => {
        if (f.pressure) return G.say('Компрессор', 'Компрессор пыхтит. Давление в норме — пневмопочта работает.');
        if (!f.power) return G.say('Компрессор', 'Компрессор пневмопочты. Без электричества не работает.');
        P(() => G.wheelsPanel({ t: 'Компрессор', desc: 'Компрессор загудел. На регуляторе давления два колёсика: атмосферы и десятые.', n: 2, chars: '0123456789', act: 'pressure', label: 'Выставить', top: ['атм', 'доли'] }), o);
      },
      g_shelf: (o, S, f) => P(() => ({ t: 'Полка', html: f.power ? `<p class="hs-txt">При свете на полке видны инструменты.</p>${G.takeHtml(['winch']) || '<p class="hs-cap">Ничего полезного.</p>'}` : '<p class="hs-txt">Слишком темно, чтобы что-то разглядеть.</p>' }), o),
      // ---------- Ледник ----------
      i_back: () => G.go('kitchen'),
      i_block: (o, S, f) => P(() => f.thaw ? { t: 'Глыба льда', html: '<p class="hs-txt">Лёд осел. Книга почти сухая — её можно прочитать.</p><button class="hs-btn ghost" data-doc="guestbook62">Книга постояльцев 1962</button>' } : { t: 'Глыба льда', html: `<p class="hs-txt">В прозрачной глыбе вмёрзла толстая книга в зелёном переплёте. Ногтями не отколупать.</p>${use('salt', 'Посыпать солью', 'salt')}`, bind: bindUse }, o),
      // ---------- Погреб ----------
      w_back: () => G.go('kitchen'),
      w_rack: (o, S, f) => {
        if (f.bottles) return P(() => ({ t: 'Ниша за стеллажом', html: `<p class="hs-txt">За отъехавшим стеллажом — ниша. В ней дневник в кожаном переплёте.</p><button class="hs-btn ghost" data-doc="diary">Дневник хозяйки</button>${G.takeHtml(['key_suite'])}` }), o);
        P(seqPanel('Винный стеллаж', 'Пять бутылок стоят отдельно, у каждой — бумажная этикетка, подписанная от руки фамилией. Бутылки можно потянуть на себя.', BOTTLES.map((b) => ({ id: b, l: `🍷 ${b}` })), 'book', 'bottles', 5), o);
      },
      q_any: () => G.say('Каминный зал', 'Тепло. Наконец-то тепло.'),
    };
  }

  StoryEngine.define({
    id: 'hotel', title: 'Полярная звезда', icon: '🏔️', color: '#9ab8d8',
    tagline: 'Хоррор-детектив: заснеженный отель, 1987 год',
    infoDefault: 'новая история · 3D',
    roles: [
      { id: 'up', name: 'Третий этаж', icon: '🕯️', desc: 'Остаёшься наверху: коридор, номер 312, радиорубка, купол обсерватории, апартаменты хозяйки.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'Внизу', icon: '🔦', desc: 'Остаёшься внизу: вестибюль, кухня, генераторная, ледник, винный погреб.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Вторая мрачная история: 5 глав, 11 комнат, около 30 загадок. 1,5–2 часа. Лучше в наушниках.',
      'Вы на разных этажах отеля. Улики разделены — говорите обо всём, что видите.',
      'Предметы передаются пневмопочтой — но её ещё надо запустить.',
      'Прогресс сохраняется. Застряли — кнопка 💡.',
    ],
    sub: 'хоррор-детектив для двоих · 5 глав',
    warn: 'Наденьте наушники. Говорите обо всём, что видите: часть ответа всегда у другого.',
    roleLabel: { up: '🕯️ Ты — на <b>третьем этаже</b>', down: '🔦 Ты — <b>внизу</b>' },
    enterLabel: 'Подняться к отелю', menuArt: 'hotel', endArt: 'dawn', endSub: 'вернули тепло в «Полярную звезду»', finalRoom: 'hall', introSound: { 3: 'crash' },
    chapters: CH, ITEMS, DOCS, IMG, ACT, HINTS, TAKE, chapterOf, drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART, hot,
    dw: {
      name: 'Пневмопочта', cabin: 'Капсула', empty: 'капсула пуста', putIn: 'Положить в капсулу:', called: 'Капсула со свистом прилетела к вам.', call: 'Вызвать капсулу', send: { up: 'вниз ↓', down: 'наверх ↑' },
      room: { up: 'corridor', down: 'lobby' }, need: 'pressure',
      broken: { up: 'Латунный раструб пневмопочты. Капсула на месте, но давления нет — компрессор внизу, в генераторной, не работает.', down: 'Терминал пневмопочты у стойки. Мёртвый: компрессор в генераторной не запущен.' },
    },
    final: {
      title: 'Каминный зал', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Дверь на галерею каминного зала. Из скважины тянет холодом. С той стороны, внизу, — вторые двери. Открыть их можно только вместе.', down: 'Двери каминного зала, заколоченные досками. Между досками — скважина. Наверху, на галерее, — вторая дверь. Открыть их можно только вместе.' },
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'power': G.snd('power'); G.toast(G.role === 'down' ? 'Генератор взревел и затарахтел. Под потолком загорелись лампы.' : 'Снизу донёсся рёв мотора. В коридоре вспыхнули лампы.', 4200); break;
        case 'pressure': G.snd('mech'); G.toast('Компрессор зашипел — в трубах пневмопочты пошёл воздух.', 3500); break;
        case 'radio': G.snd('static'); G.toast(me ? 'Сквозь треск — голос. База ответила.' : 'Сверху доносится треск рации и чей-то голос.', 4000); if (me) setTimeout(() => G.doc('radio_talk'), 1200); break;
        case 'phone': G.snd('bell'); setTimeout(() => G.snd('bell'), 700); G.toast(me ? 'Где-то наверху зазвонили три телефона. Ящик коммутатора выдвинулся.' : 'В пустых номерах на этаже вдруг зазвонили телефоны. Три раза. И замолчали.', 4500); break;
      }
    },
    methods: {
      playMorse(lamp, line) {
        const ac = SFX.ac; const msg = 'КОД 407'; let t = 0.2;
        const unit = 0.16, on = [], marks = [];
        for (const ch of msg) {
          if (ch === ' ') { t += unit * 4; marks.push([t, '/ ']); continue; }
          for (const s of MORSE[ch]) { const d = s === '.' ? unit : unit * 3; on.push([t, d]); marks.push([t, s === '.' ? '•' : '—']); if (ac && !SFX.muted) SFX.tone(720, d, { type: 'sine', vol: 0.12, when: t, attack: 0.005 }); t += d + unit; }
          t += unit * 2; marks.push([t, ' ']);
        }
        if (line) { line.textContent = ''; marks.forEach(([s, m]) => setTimeout(() => (line.textContent += m), s * 1000)); }
        if (lamp) on.forEach(([s, d]) => { setTimeout(() => lamp.classList.add('on'), s * 1000); setTimeout(() => lamp.classList.remove('on'), (s + d) * 1000); });
      },
    },
  });
})();
