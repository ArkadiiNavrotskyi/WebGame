'use strict';
// «Чёрный мыс» — маяк на Белом море, ноябрь 1966-го и шторм, в котором погибла «Белуга».
// Один — в башне маяка (вахтенная, кладовая, комната смотрителя, фонарная, галерея), другой — внизу, на мысу
// (дом смотрителя, метеостанция, эллинг, туманная станция, грот). Предметы — керосиновым подъёмником в шахте башни.
(() => {
  const HA = window.HouseArt;
  const BRAKE = [{ id: 'clutch', l: 'Муфта' }, { id: 'stop', l: 'Стопор' }, { id: 'brake', l: 'Тормоз' }];
  const BRAKE_ORDER = ['stop', 'brake', 'clutch'];
  const SEW = [{ id: 'gull', l: '🕊 Чайка' }, { id: 'star', l: '★ Звезда' }, { id: 'anchor', l: '⚓ Якорь' }, { id: 'heart', l: '♥ Сердце' }, { id: 'wave', l: '〰 Волна' }];
  const SEW_ORDER = ['anchor', 'star', 'gull'];
  // флаги свода сигналов (упрощённые): фон, узор, цвет узора
  const FLAGS = {
    'А': ['#fff', 'vhalf', '#2a50b0'], 'Б': ['#c82828', 'solid', '#c82828'], 'В': ['#fff', 'cross', '#c82828'], 'Г': ['#e8c020', 'solid', '#e8c020'], 'Д': ['#e8c020', 'hband', '#2a50b0'],
    'Е': ['#2a50b0', 'hhalf', '#c82828'], 'Ж': ['#2a50b0', 'saltire', '#fff'], 'З': ['#e8c020', 'quarters', '#1a1a1a'], 'И': ['#e8c020', 'dot', '#1a1a1a'], 'К': ['#e8c020', 'vhalf', '#2a50b0'],
    'Л': ['#e8c020', 'checker', '#1a1a1a'], 'М': ['#2a50b0', 'saltire', '#fff'], 'Н': ['#2a50b0', 'checker', '#fff'], 'О': ['#c82828', 'diag', '#e8c020'], 'П': ['#2a50b0', 'border', '#fff'],
    'Р': ['#c82828', 'cross', '#e8c020'], 'С': ['#fff', 'border', '#2a50b0'], 'Т': ['#c82828', 'vstripes', '#2a50b0'],
  };
  FLAGS['М'] = ['#2a50b0', 'saltire', '#fff']; FLAGS['Ж'] = ['#fff', 'hstripes', '#2a50b0'];
  const WORD = 'СВЕТ';

  const ROOM_NAME = { watch: 'Вахтенная комната', store: 'Кладовая', bedroom: 'Комната смотрителя', lantern: 'Фонарная', gallery: 'Галерея', house: 'Дом смотрителя', weather: 'Метеостанция', boat: 'Эллинг', fog: 'Туманная станция', grotto: 'Грот под мысом', light: 'Свет' };
  const AREA = { up: ['watch', 'store', 'bedroom', 'lantern', 'gallery'], down: ['house', 'weather', 'boat', 'fog', 'grotto'] };
  const OPEN = { watch: () => true, store: () => true, bedroom: (S) => S.f.bedroom, lantern: (S) => S.f.lantern, gallery: (S) => S.f.clock, house: () => true, weather: () => true, boat: (S) => S.f.boat, fog: (S) => S.f.fog, grotto: (S) => S.f.grotto };
  const CH = ['', 'Глава I. Шторм', 'Глава II. Журнал смотрителя', 'Глава III. «Белуга»', 'Глава IV. Сын смотрителя', 'Глава V. Свет'];

  const INTRO = [
    ['cape', 'Белое море, ноябрь. Чёрный мыс — голая скала, маяк и домик смотрителя. Маяк не горит с 1966 года.'],
    ['ad', 'Объявление в газете было странным: «На маяк Чёрного мыса требуются двое смотрителей. На один сезон. Жильё и керосин — за счёт маяка». Вы позвонили. Трубку взял старик и сказал только: «Приезжайте до четырнадцатого».'],
    ['storm', 'Четырнадцатого ноября начался шторм. Волна смыла винтовую лестницу в башне — пролёт рухнул вниз, в темноту. Где-то в море, за пеленой снега, дважды мигнули ходовые огни.'],
    ['split', '{up} — наверху, в башне маяка. {down} — внизу, в доме смотрителя. Между вами — сорок метров пустой шахты и рёв ветра. Говорить можно в переговорную трубу. Корабль в море ждёт света.'],
  ];
  const OUTRO = [
    ['light', 'Линза повернулась — и белый луч ударил в шторм. В ту же секунду внизу взревел ревун: два долгих гудка, как в шестьдесят шестом.'],
    ['ship', 'Из снега вышел корабль — старый рыболовный траулер, весь в инее. На борту: «БЕЛУГА». Он прошёл мимо скал, туда, где луч ложился на воду, и за мысом зажёг огни. Дома.'],
    ['ship', 'На корме стоял молодой матрос. Он поднял руку — и на галерее маяка ему ответил кто-то третий: высокий старик в бушлате. Потом их обоих не стало видно в снегу.'],
    ['dawn', 'Утром шторм стих. На столе в вахтенной лежала последняя запись в журнале, свежими чернилами: «14.XI. Свет зажжён. Илья дома. Смену сдал. — Г. Орлов».'],
    ['end', ''],
  ];

  // ================= Предметы =================
  const ITEMS = {
    crank: { n: 'Рукоять лебёдки', d: 'Тяжёлая чугунная рукоять с квадратным гнездом.' },
    key_boat: { n: 'Ключ от эллинга', d: 'Позеленевший ключ на верёвочке с поплавком.' },
    key_lantern: { n: 'Ключ от фонарной', d: 'Длинный ключ с выбитым маячком на головке.' },
    chain: { n: 'Цепь привода', d: 'Цепь от часового механизма маяка, смазанная, в мешковине.' },
    can: { n: 'Пустой бидон', d: 'Жестяной бидон для керосина. Пустой.' },
    kerosene: { n: 'Бидон керосина', d: 'Полный бидон. Пахнет так, что слезятся глаза.' },
    oar: { n: 'Весло', d: 'Короткое весло с выжженным именем «Мария».' },
    key_a: { n: 'Калильная сетка', d: 'Запасная сетка для керосиновой лампы маяка. Без неё огонь не даст света.' },
    key_b: { n: 'Ключ ревуна', d: 'Ключ пуска туманного ревуна, тяжёлый, на цепочке.' },
  };
  const TAKE = {
    crank: () => true, key_boat: (S) => S.f.bedroom, key_lantern: (S) => S.f.tin, chain: (S) => S.f.boat, can: () => true, kerosene: () => false, oar: (S) => S.f.fog, key_a: (S) => S.f.sew, key_b: (S) => S.f.bell,
  };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const metal = (a, b) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const iron = metal('#a8a8b0', '#2a2a30'), brass = metal('#f0d890', '#5a4214');
    const key = (c) => { g.fillStyle = c; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill(); g.fillStyle = c; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12); };
    switch (id) {
      case 'crank': g.strokeStyle = iron; g.lineWidth = s * 0.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.25, s * 0.78); g.lineTo(s * 0.25, s * 0.35); g.lineTo(s * 0.72, s * 0.35); g.lineTo(s * 0.72, s * 0.15); g.stroke(); break;
      case 'key_boat': key(metal('#7aa890', '#1a3a2a')); g.fillStyle = '#e83030'; g.beginPath(); g.arc(s * 0.16, s * 0.2, s * 0.08, 0, TAU); g.fill(); break;
      case 'key_lantern': key(brass); g.fillStyle = '#fff2c8'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.04, 0, TAU); g.fill(); break;
      case 'chain': g.strokeStyle = iron; g.lineWidth = s * 0.05; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(s * (0.2 + i * 0.15), s * (0.3 + i * 0.1), s * 0.08, s * 0.05, 0.6, 0, TAU); g.stroke(); } break;
      case 'can': case 'kerosene': g.fillStyle = id === 'can' ? metal('#9aa0a8', '#4a5058') : metal('#c8a040', '#6a4a10'); g.fillRect(s * 0.28, s * 0.3, s * 0.44, s * 0.55); g.fillRect(s * 0.42, s * 0.18, s * 0.16, s * 0.14); g.strokeStyle = '#2a2a2a'; g.lineWidth = s * 0.04; g.beginPath(); g.arc(s / 2, s * 0.3, s * 0.16, Math.PI, 0); g.stroke(); break;
      case 'oar': g.save(); g.translate(s / 2, s / 2); g.rotate(-0.7); g.fillStyle = '#8a5a2a'; g.fillRect(-s * 0.03, -s * 0.45, s * 0.06, s * 0.6); g.beginPath(); g.ellipse(0, s * 0.28, s * 0.09, s * 0.18, 0, 0, TAU); g.fill(); g.restore(); break;
      case 'key_a': g.fillStyle = '#f0ece0'; g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.2, s * 0.3, 0, 0, TAU); g.fill(); g.strokeStyle = '#a8a090'; g.lineWidth = 1; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(s * 0.3, s * (0.25 + i * 0.06)); g.lineTo(s * 0.7, s * (0.25 + i * 0.06)); g.stroke(); } g.fillStyle = brass; g.fillRect(s * 0.38, s * 0.78, s * 0.24, s * 0.08); break;
      case 'key_b': key(iron); g.strokeStyle = iron; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 0.14, s * 0.5); g.lineTo(s * 0.05, s * 0.2); g.stroke(); break;
    }
  }

  // ================= Иллюстрации =================
  const paper = (g, w, h, c = '#d8ccb0') => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,20,0.06)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * w * 0.06, 0, TAU); g.fill(); } };
  const flag = (g, x, y, w, h, spec) => {
    const [bg, pat, fg] = spec; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = bg; g.fillRect(x, y, w, h); g.fillStyle = fg; g.strokeStyle = fg;
    switch (pat) {
      case 'vhalf': g.fillRect(x + w / 2, y, w / 2, h); break;
      case 'hhalf': g.fillRect(x, y + h / 2, w, h / 2); break;
      case 'hband': g.fillRect(x, y + h / 3, w, h / 3); break;
      case 'cross': g.fillRect(x + w * 0.4, y, w * 0.2, h); g.fillRect(x, y + h * 0.4, w, h * 0.2); break;
      case 'saltire': g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke(); break;
      case 'quarters': g.fillRect(x, y, w / 2, h / 2); g.fillRect(x + w / 2, y + h / 2, w / 2, h / 2); break;
      case 'checker': for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(x + i * w / 4, y + j * h / 4, w / 4, h / 4); break;
      case 'dot': g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.28, 0, TAU); g.fill(); break;
      case 'diag': g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.fill(); break;
      case 'border': g.fillRect(x, y, w, h); g.fillStyle = bg; g.fillRect(x + w * 0.22, y + h * 0.22, w * 0.56, h * 0.56); break;
      case 'vstripes': for (let i = 1; i < 5; i += 2) g.fillRect(x + i * w / 5, y, w / 5, h); break;
      case 'hstripes': for (let i = 1; i < 5; i += 2) g.fillRect(x, y + i * h / 5, w, h / 5); break;
    }
    g.restore(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h);
  };
  const IMG = {
    baro: (g, w, h) => {
      g.fillStyle = '#ece6d4'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(80,100,160,0.35)'; g.lineWidth = 1; for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo(w * 0.1, h * (0.1 + i * 0.065)); g.lineTo(w * 0.95, h * (0.1 + i * 0.065)); g.stroke(); }
      g.fillStyle = '#2a3a6a'; g.font = `${h * 0.04}px 'PT Mono', monospace`; g.textAlign = 'right';
      for (let i = 0; i <= 6; i++) g.fillText(String(1010 - i * 10), w * 0.09, h * (0.11 + i * 0.13));
      g.textAlign = 'center'; ['12:00', '16:00', '20:00', '00:00', '04:00'].forEach((t, i) => g.fillText(t, w * (0.15 + i * 0.2), h * 0.95));
      const P = (hp) => h * (0.1 + (1010 - hp) / 10 * 0.13);
      g.strokeStyle = '#7a1a1a'; g.lineWidth = 2.5; g.beginPath();
      const pts = [[0.12, 998], [0.25, 990], [0.4, 976], [0.55, 962], [0.65, 952], [0.72, 956], [0.85, 968], [0.94, 975]];
      pts.forEach(([x, p], i) => (i ? g.lineTo(w * x, P(p)) : g.moveTo(w * x, P(p)))); g.stroke();
      g.fillStyle = '#7a1a1a'; g.beginPath(); g.arc(w * 0.65, P(952), 5, 0, TAU); g.fill(); g.font = `${h * 0.045}px 'Marck Script', cursive`; g.textAlign = 'left'; g.fillText('23:40 — минимум', w * 0.66, P(952) + h * 0.07);
      g.fillStyle = '#2a3a6a'; g.font = `700 ${h * 0.05}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('БАРОГРАФ · 14 ноября 1966 · гПа', w / 2, h * 0.06);
    },
    ship: (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2028'); gr.addColorStop(1, '#0a0e12'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 250; i++) g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      g.fillStyle = '#2a3238'; g.beginPath(); g.moveTo(w * 0.08, h * 0.72); g.lineTo(w * 0.92, h * 0.72); g.lineTo(w * 0.85, h * 0.85); g.lineTo(w * 0.15, h * 0.85); g.fill(); g.fillRect(w * 0.55, h * 0.58, w * 0.18, h * 0.14);
      g.strokeStyle = '#3a4248'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.3, h * 0.72); g.lineTo(w * 0.3, h * 0.12); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.3, h * 0.14); g.lineTo(w * 0.9, h * 0.6); g.stroke();
      [...WORD].forEach((ch, i) => flag(g, w * (0.33 + i * 0.13), h * (0.18 + i * 0.1), w * 0.1, h * 0.08, FLAGS[ch]));
      g.fillStyle = 'rgba(255,240,200,0.8)'; g.beginPath(); g.arc(w * 0.62, h * 0.62, 3, 0, TAU); g.fill();
      g.fillStyle = 'rgba(200,220,230,0.3)'; g.font = `700 ${h * 0.04}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('БЕЛУГА', w * 0.5, h * 0.8);
    },
    flagtable: (g, w, h) => {
      paper(g, w, h, '#e4dcc4');
      g.fillStyle = '#1a2a4a'; g.textAlign = 'center'; g.font = `700 ${h * 0.06}px 'PT Mono', monospace`; g.fillText('СВОД СИГНАЛОВ · ФЛАГИ-БУКВЫ', w / 2, h * 0.08);
      const keys = Object.keys(FLAGS), cols = 6;
      keys.forEach((k, i) => { const c = i % cols, r = Math.floor(i / cols), x = w * (0.05 + c * 0.155), y = h * (0.15 + r * 0.27); flag(g, x, y, w * 0.11, h * 0.14, FLAGS[k]); g.fillStyle = '#1a2a4a'; g.font = `700 ${h * 0.06}px 'PT Mono', monospace`; g.fillText(k, x + w * 0.055, y + h * 0.21); });
    },
    photo: (g, w, h) => {
      g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a8a84'); gr.addColorStop(1, '#3a3a36'); g.fillStyle = gr; g.fillRect(w * 0.05, h * 0.05, w * 0.9, h * 0.7);
      g.fillStyle = '#2a2a28'; g.fillRect(w * 0.1, h * 0.5, w * 0.8, h * 0.18); g.fillRect(w * 0.6, h * 0.35, w * 0.15, h * 0.15); g.fillStyle = '#c8c8c0'; g.font = `700 ${h * 0.05}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('БЕЛУГА', w * 0.35, h * 0.62);
      HA.figure(g, w * 0.25, h * 0.48, h * 0.12, '#1a1a1a', '#b8b0a0');
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.065}px 'Marck Script', cursive`; g.fillText('Илюша, перед рейсом. 1966', w / 2, h * 0.85); g.fillText('родился 12 апреля 1944 — наш апрельский', w / 2, h * 0.94);
    },
    hoist: (g, w, h) => {
      paper(g, w, h, '#d8d0b8');
      g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `700 ${h * 0.07}px 'PT Mono', monospace`; g.fillText('КЕРОСИНОВЫЙ ПОДЪЁМНИК', w / 2, h * 0.12);
      g.font = `${h * 0.055}px 'PT Mono', monospace`; g.textAlign = 'left';
      ['Наверху, в вахтенной, перед подъёмом:', '1) снять СТОПОР,', '2) отпустить ТОРМОЗ,', '3) включить МУФТУ.', 'Внизу — вставить рукоять в лебёдку и крутить.', 'Иначе ведро сорвётся в шахту!'].forEach((l, i) => g.fillText(l, w * 0.06, h * (0.28 + i * 0.11)));
    },
    bottle: (g, w, h) => {
      paper(g, w, h, '#d8ccac');
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.065}px 'Marck Script', cursive`; g.textAlign = 'left';
      ['Отец!', 'Если ты это найдёшь — значит, мы не дошли.', 'Скажи маме: я помню её шкатулку.', 'Сначала якорь — это ты, потом звезда — это мама,', 'а потом чайка — это я. Она всегда так говорила.', 'Не гаси свет. Мы увидим. — Илья'].forEach((l, i) => g.fillText(l, w * 0.06, h * (0.14 + i * 0.14), w * 0.9));
    },
  };

  // ================= Документы =================
  const DOCS = {
    logbook: { t: 'Вахтенный журнал маяка', k: 'typed', text: 'ВАХТЕННЫЙ ЖУРНАЛ · МАЯК ЧЁРНЫЙ МЫС\n\n13.XI.66 — ветер СВ 7 баллов, огонь в норме.\n14.XI.66 — ветер СВ 11 баллов. Давление падает. Ждём «Белугу» с Ильёй к полуночи.\n14.XI.66, 23:40 — цепь часового механизма лопнула. Линза встала. Огонь не вращается — с моря его не видно.\n\nДальше страницы вырваны. На последней — карандашом:\n«Дверь в мою комнату запер. Код — давление в ту минуту, когда всё случилось. Г. О.»' },
    plaque: { t: 'Табличка у переговорной трубы', k: 'paper', text: 'ПЕРЕГОВОРНАЯ ТРУБА\nвахтенная ↔ дом смотрителя\n\nГоворить громко. В шторм — кричать.' },
    hoist: { t: 'Инструкция у шахты', k: 'img', img: 'hoist', ratio: 0.62, cap: 'Жестяная табличка у лебёдки, внизу. Буквы выбиты молотком.' },
    baro: { t: 'Лента барографа', k: 'img', img: 'baro', ratio: 0.62, cap: 'Барограф до сих пор держит ленту той ночи. Перо остановилось на минимуме.' },
    flags: { t: 'Свод сигналов', k: 'img', img: 'flagtable', ratio: 0.7, cap: 'Таблица флагов-букв на стене метеостанции.' },
    diary: { t: 'Дневник смотрителя', k: 'hand', text: '15.XI.66\nЦепь лопнула в 23:40. Я крутил линзу руками, сколько мог. Не хватило.\n\nИлья с детства, возвращаясь, бил в рынду четыре раза — «папа, я дома». В ту ночь я слышал в шторме три удара. Четвёртого не было.\n\n2.XII.66\nМария не пережила зиму. Её швейную шкатулку я запер — там лежит запасная сетка для лампы. Шифр знают только она и Илья.' },
    photo: { t: 'Фотография на стене', k: 'img', img: 'photo', ratio: 0.72, cap: 'Фото в рамке над кроватью.' },
    tin: { t: 'Жестянка на полке', k: 'hand', text: 'Жестяная коробка из-под индийского чая. На крышке наклеена бумажка: «Илюше — на день рождения». Под ней — кодовый замочек на четыре цифры: день и месяц.' },
    ship: { t: 'В подзорную трубу', k: 'img', img: 'ship', ratio: 0.7, cap: 'Луч прошёл по воде — и в снегу проступил силуэт траулера. На мачте — четыре флага.' },
    bottle: { t: 'Записка в бутылке', k: 'img', img: 'bottle', ratio: 0.7, cap: 'Бутылка застряла между камнями у обломков. Бумага почти не размокла.' },
    wreck: { t: 'Обломки', k: 'paper', text: 'Деревянная доска с остатками букв: «…ЛУГА». Обрывки сети. Рында — корабельный колокол, позеленевший, но целый, висит на обломке мачты.' },
    stormnote: { t: 'Объявление на двери', k: 'typed', text: 'ТУМАННАЯ СТАНЦИЯ\n\nВход только для смотрителей.\nЗамок буквенный. Пароль — то, о чём просит корабль.' },
  };

  // ================= Логика =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { boat: 'key_boat', lantern: 'key_lantern' };
  const ACT = {
    unlock(S, who, door) { const n = UNLOCK[door]; if (!n || S.f[door] || !has(S, who, n)) return null; rm(S, who, n); S.f[door] = 1; return ok(who, 'Ключ со скрипом повернулся.', 'door'); },
    brake(S, who, v) { if (S.f.brake) return null; if (Array.isArray(v) && v.join() === BRAKE_ORDER.join()) { S.f.brake = 1; return ok(who, 'Лязгнули рычаги. Барабан подъёмника освобождён.', 'lever'); } return bad(who); },
    winch(S, who) { if (S.f.hoist || !S.f.brake || !has(S, who, 'crank')) return null; S.f.hoist = 1; return { a: 'hoist', who }; },
    bedroom(S, who, v) { if (S.f.bedroom) return null; if (v === '952') { S.f.bedroom = 1; return ok(who, 'Замок щёлкнул. Дверь в комнату смотрителя открылась.', 'door'); } return bad(who); },
    tin(S, who, v) { if (S.f.tin) return null; if (v === '1204') { S.f.tin = 1; return ok(who, 'Крышка жестянки отскочила.', 'click'); } return bad(who); },
    chain(S, who) { if (S.f.clock || !has(S, who, 'chain')) return null; rm(S, who, 'chain'); S.f.clock = 1; return { a: 'clock', who }; },
    fogdoor(S, who, v) { if (S.f.fog) return null; if (v === WORD) { S.f.fog = 1; return ok(who, 'Буквенный замок туманной станции щёлкнул.', 'door'); } return bad(who); },
    fill(S, who) { if (!S.f.fog || !has(S, who, 'can')) return null; rm(S, who, 'can'); S.inv[who].push('kerosene'); return ok(who, 'Керосин с бульканьем полился в бидон.', 'drain'); },
    fuel(S, who) { if (S.f.fuel || !has(S, who, 'kerosene')) return null; rm(S, who, 'kerosene'); S.f.fuel = 1; return ok(who, 'Бачок лампы полон. Остаётся сетка — и огонь.', 'drain'); },
    row(S, who) { if (S.f.grotto || !has(S, who, 'oar')) return null; S.f.grotto = 1; return { a: 'row', who }; },
    bell(S, who, v) { if (S.f.bell || !S.f.grotto) return null; if (v === 4) { S.f.bell = 1; return { a: 'bell', who }; } return bad(who); },
    sew(S, who, v) { if (S.f.sew) return null; if (Array.isArray(v) && v.join() === SEW_ORDER.join()) { S.f.sew = 1; return ok(who, 'Шкатулка Марии тихо щёлкнула и открылась.', 'chime'); } return bad(who); },
  };
  const chapterOf = (S) => (!S.f.hoist ? 1 : !S.f.lantern ? 2 : !S.f.fuel ? 3 : !(S.f.bell && S.f.sew) ? 4 : 5);
  const HINTS = [
    [(S) => !S.f.brake, 'Рычаги подъёмника у шахты: порядок — в инструкции внизу, у лебёдки.', 'Прочитай наверх инструкцию у шахты подъёмника: в каком порядке рычаги.'],
    [(S) => !S.f.hoist, 'Внизу нужно вставить рукоять в лебёдку — рукоять в кладовке дома.', 'Рукоять лебёдки лежит в доме. Вставь её в лебёдку у шахты.'],
    [(S) => !S.f.bedroom, 'Комната смотрителя: код — давление в ту минуту. Лента барографа — внизу, на метеостанции.', 'На метеостанции — лента барографа той ночи. Скажи наверх минимум давления.'],
    [(S) => !S.f.boat, 'В комнате смотрителя — ключ от эллинга. Отправь его вниз подъёмником.', 'Ключ от эллинга — наверху, в комнате смотрителя.'],
    [(S) => !S.f.tin, 'На фото над кроватью — день рождения Ильи. Продиктуй вниз.', 'Жестянка в доме открывается днём и месяцем рождения Ильи. Дата — на фото наверху.'],
    [(S) => !S.f.lantern, 'Ключ от фонарной — в жестянке внизу. Попроси прислать.', 'Отправь ключ от фонарной наверх.'],
    [(S) => !S.f.clock, 'Цепь часового механизма — в эллинге внизу. Её нужно поднять наверх.', 'Цепь привода линзы лежит в лодке в эллинге. Отправь её наверх.'],
    [(S) => !S.f.fog, 'С галереи в подзорную трубу видно корабль с флагами. Опиши флаги вниз — там таблица.', 'Замок туманной станции — слово из флагов корабля. Таблица флагов — на метеостанции; флаги видят наверху, с галереи.'],
    [(S) => !S.f.fuel, 'Нужен керосин. Отправь пустой бидон из кладовки вниз — бак на туманной станции.', 'Наполни бидон на туманной станции и отправь наверх.'],
    [(S) => !S.f.grotto, 'В грот под мысом можно доплыть на лодке. Весло — на туманной станции.', 'Возьми весло на туманной станции и сядь в лодку в эллинге.'],
    [(S) => !S.f.bell, 'В дневнике смотрителя написано, сколько раз Илья бил в рынду. Скажи вниз.', 'Рында в гроте: сколько ударов? Ответ в дневнике смотрителя наверху.'],
    [(S) => !S.f.sew, 'Шкатулка Марии: порядок символов — в записке Ильи из бутылки (грот внизу).', 'Прочитай наверх записку из бутылки: там порядок для маминой шкатулки.'],
    [(S) => !(S.f.insA && S.f.insB), 'Сетку — в лампу маяка в фонарной.', 'Ключ ревуна — в пульт ревуна на туманной станции.'],
    [() => true, 'Одновременно: огонь — и ревун! «Три, два, один — сейчас!»', 'Одновременно: огонь — и ревун! «Три, два, один — сейчас!»'],
  ];

  // ================= Сцены =================
  const ART = (g, w, hh, key, K) => {
    const { fog, sky } = K;
    const sea = (y, c1, c2) => { const gr = g.createLinearGradient(0, y, 0, hh); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, y, w, hh - y); g.strokeStyle = 'rgba(200,220,230,0.25)'; g.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const yy = y + Math.random() * (hh - y), x = Math.random() * w; g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + 15, yy - 4, x + 30, yy); g.stroke(); } };
    const tower = (x, y, s, lit) => {
      g.fillStyle = '#3a3a42'; g.beginPath(); g.moveTo(x - s * 0.14, y); g.lineTo(x - s * 0.09, y - s); g.lineTo(x + s * 0.09, y - s); g.lineTo(x + s * 0.14, y); g.fill();
      g.fillStyle = '#e8e4dc'; for (let i = 0; i < 3; i++) { const yy = y - s * (0.2 + i * 0.28); g.fillRect(x - s * 0.13 + i * s * 0.013, yy, s * 0.26 - i * s * 0.026, s * 0.08); }
      g.fillStyle = '#0c0c10'; g.fillRect(x - s * 0.12, y - s * 1.04, s * 0.24, s * 0.04); g.fillRect(x - s * 0.07, y - s * 1.16, s * 0.14, s * 0.12); g.beginPath(); g.moveTo(x - s * 0.09, y - s * 1.16); g.lineTo(x, y - s * 1.24); g.lineTo(x + s * 0.09, y - s * 1.16); g.fill();
      if (lit) { g.fillStyle = 'rgba(255,240,190,0.95)'; g.fillRect(x - s * 0.06, y - s * 1.15, s * 0.12, s * 0.1); const gr = g.createLinearGradient(x, 0, x - w, 0); gr.addColorStop(0, 'rgba(255,240,190,0.55)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - s * 1.1); g.lineTo(0, y - s * 1.6); g.lineTo(0, y - s * 0.7); g.fill(); }
    };
    const cliff = (c) => { g.fillStyle = c; g.beginPath(); g.moveTo(w * 0.45, hh); g.lineTo(w * 0.5, hh * 0.72); g.lineTo(w * 0.62, hh * 0.66); g.lineTo(w * 0.85, hh * 0.68); g.lineTo(w, hh * 0.62); g.lineTo(w, hh); g.fill(); };
    const snow = (n = 300) => { g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < n; i++) { const r = Math.random() * 2; g.fillRect(Math.random() * w, Math.random() * hh, r, r); } };
    switch (key) {
      case 'cape': case 'storm': case 'light': case 'dawn': {
        const d = key === 'dawn', lit = key === 'light' || d;
        sky(d ? '#9aa8b8' : '#0c1018', d ? '#e8d0b0' : '#1a2028'); sea(hh * 0.7, d ? '#5a6a78' : '#141c24', d ? '#2a3440' : '#05080c');
        cliff(d ? '#2a2a2a' : '#0a0a0c'); tower(w * 0.7, hh * 0.67, hh * 0.45, lit && !d);
        g.fillStyle = d ? '#3a3a3a' : '#0c0c10'; g.fillRect(w * 0.78, hh * 0.6, w * 0.08, hh * 0.08); g.beginPath(); g.moveTo(w * 0.775, hh * 0.6); g.lineTo(w * 0.82, hh * 0.55); g.lineTo(w * 0.865, hh * 0.6); g.fill();
        if (!d) { g.fillStyle = 'rgba(220,180,120,0.8)'; g.fillRect(w * 0.8, hh * 0.62, w * 0.015, hh * 0.02); }
        if (key === 'storm') { snow(600); g.fillStyle = 'rgba(255,200,120,0.8)'; g.beginPath(); g.arc(w * 0.18, hh * 0.68, 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,255,140,0.8)'; g.beginPath(); g.arc(w * 0.2, hh * 0.68, 3, 0, TAU); g.fill(); }
        else if (!d) snow(200);
        if (d) { g.fillStyle = 'rgba(255,220,160,0.9)'; g.beginPath(); g.arc(w * 0.2, hh * 0.68, hh * 0.05, Math.PI, 0); g.fill(); }
        fog(); break;
      }
      case 'ad':
        sky('#14100c', '#0a0806'); g.save(); g.translate(w / 2, hh / 2); g.rotate(-0.03); g.fillStyle = '#d8d0bc'; g.fillRect(-w * 0.3, -hh * 0.38, w * 0.6, hh * 0.76);
        g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = `700 ${hh * 0.06}px 'Cormorant Garamond', serif`; g.fillText('ОБЪЯВЛЕНИЯ', 0, -hh * 0.28);
        g.font = `${hh * 0.045}px 'PT Mono', monospace`; ['На маяк Чёрного мыса', 'требуются двое смотрителей.', 'На один сезон.', 'Жильё и керосин —', 'за счёт маяка.', 'Обращаться: Г. Орлов'].forEach((l, i) => g.fillText(l, 0, -hh * (0.15 - i * 0.08)));
        g.restore(); break;
      case 'split':
        sky('#0c1018', '#1a2028'); sea(hh * 0.8, '#141c24', '#05080c');
        g.fillStyle = '#1a1a20'; g.fillRect(w * 0.42, 0, w * 0.16, hh); g.fillStyle = '#050508'; g.fillRect(w * 0.47, hh * 0.25, w * 0.06, hh * 0.6);
        { const L = (x, y, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, 120); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }; L(w * 0.5, hh * 0.15, 'rgba(255,200,130,0.4)'); L(w * 0.5, hh * 0.9, 'rgba(150,190,220,0.3)'); }
        HA.figure(g, w * 0.5, hh * 0.2, hh * 0.08, '#000', '#2a2620'); HA.figure(g, w * 0.5, hh * 0.92, hh * 0.08, '#000', '#2a2620');
        snow(300); break;
      case 'ship':
        sky('#0c1018', '#1a2028'); sea(hh * 0.62, '#1a2630', '#05080c');
        { const gr = g.createLinearGradient(w, 0, 0, 0); gr.addColorStop(0, 'rgba(255,240,190,0.35)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(w, hh * 0.3); g.lineTo(0, hh * 0.45); g.lineTo(0, hh * 0.7); g.fill(); }
        g.globalAlpha = 0.8; g.fillStyle = '#a8b4bc'; g.beginPath(); g.moveTo(w * 0.25, hh * 0.62); g.lineTo(w * 0.65, hh * 0.62); g.lineTo(w * 0.6, hh * 0.68); g.lineTo(w * 0.3, hh * 0.68); g.fill(); g.fillRect(w * 0.45, hh * 0.54, w * 0.08, hh * 0.08); g.fillRect(w * 0.36, hh * 0.38, 3, hh * 0.24); g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,230,160,0.9)'; for (const x of [0.3, 0.48, 0.6]) { g.beginPath(); g.arc(w * x, hh * 0.6, 2.5, 0, TAU); g.fill(); }
        HA.stick(g, w * 0.58, hh * 0.6, hh * 0.02, '#c8d4dc');
        snow(250); fog(); break;
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  const stormWin = (w = 0.9, h = 1.2) => HA.window(w, h, '#1a2028');
  const round = (A, T, r, h, mat) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 28, 1, true), mat); m.material.side = T.BackSide; m.position.y = h / 2; return m; };
  const shaft = (A, T) => { const g = new T.Group(); g.add(A.B(1.0, 0.05, 1.0, A.mat('iron'), 0, 0, 0)); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) g.add(A.B(0.05, 3.0, 0.05, A.mat('iron'), x, 1.5, z)); const bucket = new T.Group(); bucket.add(A.C(0.22, 0.18, 0.35, A.mat('rust'), 0, 0, 0, 12), A.C(0.005, 0.005, 1.6, A.mat('iron'), 0, 0.95, 0, 4)); bucket.position.y = 0.6; g.add(bucket); g.userData.bucket = bucket; return g; };
  const pipe = (A, T) => { const g = new T.Group(); const p = A.C(0.05, 0.05, 2.4, A.mat('brass'), 0, 1.6, 0, 10); g.add(p); const m = A.C(0.12, 0.06, 0.12, A.mat('brass'), 0, 1.0, 0.06, 12); m.rotation.x = Math.PI / 2; g.add(m); return g; };
  const ROOMS = {
    watch: {
      size: [5, 3, 5], wall: 'wood_panel', floor: 'wood_floor', ceil: 'wood_attic', fog: 0.08, amb: ['#3a4250', '#0a0808', 0.26], yaw: 0, cam: [0, 1.1],
      build(R, A, T) {
        R.put(stormWin(), 'n', -1.2, 0.04); R.put(stormWin(), 'e', 0.8, 0.04);
        const desk = A.desk(1.4, true); R.o.desk = desk; R.put(desk, 'n', 0.8, 0.45);
        const lb = A.paperOn(0.32, 0.24, (g, W, H) => { g.fillStyle = '#d4cab2'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; for (let i = 0; i < 8; i++) g.fillRect(W * 0.08, H * (0.12 + i * 0.1), W * 0.8, 2); }); lb.rotation.x = -Math.PI / 2; lb.position.set(-0.2, 0.81, 0); desk.add(lb);
        R.hot('w_log', R.at(new T.Group().add(A.B(0.4, 0.1, 0.3, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0.6, 0.85, -2.05));
        const sh = shaft(A, T); R.o.sh = sh; R.hot('w_shaft', R.put(sh, 'w', 0.6, 0.6));
        const lv = new T.Group(); lv.add(A.B(0.6, 0.4, 0.12, A.mat('iron'), 0, 0, 0)); R.o.lv = []; for (let i = 0; i < 3; i++) { const l = A.B(0.04, 0.22, 0.04, A.mat('black'), -0.18 + i * 0.18, 0.05, 0.08); lv.add(l); R.o.lv.push(l); }
        R.hot('w_levers', R.put(lv, 'w', -0.6, 0.06, 1.3));
        R.hot('w_pipe', R.put(pipe(A, T), 'e', -1.2, 0.08));
        const bd = A.door(1.0, 2.2); R.o.bd = bd; R.hot('w_bedroom', R.put(bd, 's', -1.0, 0.06));
        R.hot('w_store', R.put(A.door(0.9, 2.0), 's', 1.2, 0.06));
        const hatch = A.hatch(0.8); R.o.hatch = hatch; R.hot('w_hatch', R.at(hatch, 0.8, 2.98, 0.8));
        R.at(A.ladder(3.0), 0.8, 0, 1.5);
        R.put(A.painting(0.5, 0.4, (g, w, h) => { HA.paintDark(g, w, h, '#1a2028'); g.fillStyle = '#e8e4dc'; g.fillRect(w * 0.45, h * 0.2, w * 0.1, h * 0.6); }), 'e', 1.6, 0.04, 1.7);
      },
      update(R, S) { lightOn(R.o.desk.userData.light, true, 1.1); R.o.lv.forEach((l, i) => (l.rotation.z = S.f.brake ? 0.6 : -0.3)); R.o.sh.userData.bucket.position.y = S.dw.pos === 'up' && S.f.hoist ? 0.6 : 2.6; R.o.sh.userData.bucket.visible = !!S.f.hoist; R.o.bd.userData.leaf.rotation.y = S.f.bedroom ? -1.2 : 0; R.o.hatch.userData.lid.rotation.x = S.f.lantern ? -1.3 : 0; },
      tick(R, G, dt, t) { R.o.desk.userData.light.intensity = 1.0 + Math.sin(t * 7) * 0.05 + (Math.random() < 0.01 ? -0.6 : 0); },
    },
    store: {
      size: [3.4, 2.8, 3.4], wall: 'stone', floor: 'stone_dark', ceil: 'wood_attic', fog: 0.1, amb: ['#2a2a2a', '#060606', 0.18], yaw: 0, cam: [0, 0.6], trim: false,
      build(R, A, T) {
        const sh = new T.Group(); for (let y = 0; y < 3; y++) sh.add(A.B(2.4, 0.04, 0.4, A.mat('woodMid'), 0, 0.4 + y * 0.6, 0)); for (let i = 0; i < 6; i++) sh.add(A.C(0.12, 0.12, 0.35, new T.MeshStandardMaterial({ color: '#8a8a7a', metalness: 0.5, roughness: 0.5 }), -0.9 + i * 0.36, 0.6 + (i % 2) * 0.6, 0, 12));
        const can = A.C(0.13, 0.13, 0.36, new T.MeshStandardMaterial({ color: '#9aa0a8', metalness: 0.5 }), 0.7, 1.8, 0, 12); sh.add(can); R.o.can = can;
        R.hot('t_shelf', R.put(sh, 'n', 0, 0.25));
        R.put(A.sheeted(0.8, 0.6, 0.6), 'e', 0.6, 0.4);
        R.hot('t_back', R.put(A.door(0.9, 2.0), 's', 0, 0.06));
        R.at(A.candles(1, 0, true), -1.2, 0, 1.0);
      },
      update(R, S) { R.o.can.visible = !S.f.t_can; },
    },
    bedroom: {
      size: [4, 2.8, 4], wall: 'damask_blue', floor: 'wood_floor', ceil: 'wood_attic', fog: 0.08, amb: ['#2a3444', '#080606', 0.24], yaw: 0, cam: [0, 0.8],
      build(R, A, T) {
        R.put(stormWin(0.8, 1.0), 'n', 0.8, 0.04);
        R.put(A.bed(1.4, 2.0, false), 'w', -0.2, 1.05);
        R.hot('b_photo', R.put(A.painting(0.6, 0.45, (g, w, h) => IMG.photo(g, w, h)), 'w', -0.2, 0.04, 1.6));
        const box = new T.Group(); box.add(A.B(0.36, 0.2, 0.26, new T.MeshStandardMaterial({ color: '#5a2a3a', roughness: 0.4 }), 0, 0.1, 0)); for (let i = 0; i < 3; i++) box.add(A.B(0.06, 0.06, 0.02, A.mat('brass'), -0.1 + i * 0.1, 0.12, 0.135)); const lid = A.B(0.37, 0.03, 0.27, new T.MeshStandardMaterial({ color: '#5a2a3a' }), 0, 0.21, 0); box.add(lid); R.o.lid = lid;
        const tbl = new T.Group(); tbl.add(A.B(0.6, 0.04, 0.45, A.mat('woodMid'), 0, 0.72, 0)); for (const x of [-0.25, 0.25]) for (const z of [-0.18, 0.18]) tbl.add(A.B(0.04, 0.72, 0.04, A.mat('woodMid'), x, 0.36, z)); box.position.y = 0.74; tbl.add(box);
        R.hot('b_box', R.put(tbl, 'e', -0.6, 0.35));
        const dr = new T.Group(); dr.add(A.B(0.9, 0.9, 0.45, A.mat('wood'), 0, 0.45, 0)); const diary = A.B(0.2, 0.04, 0.26, A.mat('red'), 0.15, 0.92, 0); dr.add(diary); const kk = A.B(0.12, 0.02, 0.04, new T.MeshStandardMaterial({ color: '#4a7a5a', metalness: 0.6 }), -0.2, 0.91, 0); dr.add(kk); R.o.kk = kk;
        R.hot('b_dresser', R.put(dr, 'e', 0.9, 0.3));
        R.hot('b_door', R.put(A.door(1.0, 2.2), 's', 0.8, 0.06));
        R.at(A.candles(2, 0.1, true), 0.6, 0.92, -1.5);
      },
      update(R, S) { R.o.lid.position.y = S.f.sew ? 0.32 : 0.21; R.o.lid.rotation.x = S.f.sew ? -1.1 : 0; R.o.kk.visible = !S.f.t_key_boat; },
    },
    lantern: {
      size: [5, 3.6, 5], wall: 'metal_plate', floor: 'metal_plate', ceil: 'metal_plate', fog: 0.05, amb: ['#3a4860', '#080808', 0.35], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        const glassM = new T.MeshStandardMaterial({ color: '#0a1018', metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.85 });
        for (const s of ['n', 'e', 'w']) for (const a of [-1.2, 0, 1.2]) { const p = new T.Mesh(new T.PlaneGeometry(1.1, 2.0), glassM); R.put(p, s, a, 0.02, 1.8); }
        const lens = new T.Group(); const lm = new T.MeshStandardMaterial({ color: '#c8e0f0', metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.55, emissive: '#000' });
        for (let i = 0; i < 8; i++) { const b = A.C(0.62 - Math.abs(i - 3.5) * 0.06, 0.62 - Math.abs(i - 3.5) * 0.06, 0.12, lm, 0, 0.6 + i * 0.14, 0, 24); lens.add(b); }
        lens.add(A.C(0.7, 0.7, 0.1, A.mat('brass'), 0, 0.5, 0, 24), A.C(0.7, 0.7, 0.08, A.mat('brass'), 0, 1.75, 0, 24));
        const lamp = A.C(0.12, 0.15, 0.4, A.mat('brass'), 0, 1.1, 0, 12); lens.add(lamp);
        const flame = A.glow('#fff2c0', 1.6, 0); flame.position.y = 1.2; lens.add(flame); R.o.flame = flame; R.o.lm = lm;
        R.o.lens = lens; R.hot('l_lamp', R.at(lens, 0, 0.4, 0));
        R.at(A.C(0.8, 0.9, 0.4, A.mat('iron'), 0, 0.2, 0, 24), 0, 0, 0);
        const clk = new T.Group(); clk.add(A.B(0.6, 0.8, 0.4, A.mat('iron'), 0, 0.4, 0)); for (let i = 0; i < 3; i++) { const gr = A.C(0.14 - i * 0.03, 0.14 - i * 0.03, 0.03, A.mat('brass'), -0.15 + i * 0.15, 0.55, 0.21, 16); gr.rotation.x = Math.PI / 2; clk.add(gr); }
        const ch = A.B(0.03, 0.9, 0.03, A.mat('iron'), 0.2, -0.2, 0.22); ch.visible = false; clk.add(ch); R.o.ch = ch;
        R.hot('l_clock', R.put(clk, 's', -1.2, 0.35));
        R.hot('l_gallery', R.put(A.door(0.9, 2.0, A.mat('iron')), 's', 1.2, 0.06));
        R.hot('l_down', R.at(A.hatch(0.8), 1.6, 0.02, 1.6));
        const beam = new T.SpotLight('#fff2c0', 0, 30, 0.25, 0.4, 1); beam.position.set(0, 1.6, 0); beam.target.position.set(0, 1.4, -10); R.g.add(beam, beam.target); R.o.beam = beam;
      },
      update(R, S) { const lit = !!S.f.final; R.o.flame.material.opacity = lit ? 0.95 : 0; R.o.lm.emissive.set(lit ? '#806a30' : '#000'); R.o.beam.intensity = lit ? 3 : 0; R.o.ch.visible = !!S.f.clock; },
      tick(R, G, dt) { if (G.S.f.clock) { R.o.lens.rotation.y += dt * 0.6; R.o.beam.target.position.set(Math.sin(R.o.lens.rotation.y) * 10, 1.4, -Math.cos(R.o.lens.rotation.y) * 10); } },
    },
    gallery: {
      size: [7, 3.5, 4], wall: 'stone', floor: 'metal_plate', ceil: 'stone_dark', fog: 0.08, amb: ['#4a5a70', '#0a0e14', 0.6], yaw: 0, cam: [0, 1.4], trim: false,
      build(R, A, T) {
        const night = new T.Mesh(new T.PlaneGeometry(7, 3.5), new T.MeshBasicMaterial({ color: '#0a1018' })); R.put(night, 'n', 0, 0.02, 1.75);
        for (let i = 0; i < 15; i++) R.at(A.B(0.04, 1.1, 0.04, A.mat('iron'), 0, 0.55, 0), -3.3 + i * 0.47, 0, -1.3);
        R.at(A.B(7, 0.05, 0.06, A.mat('iron'), 0, 1.1, 0), 0, 0, -1.3);
        const sc = new T.Group(); sc.add(A.C(0.02, 0.02, 1.0, A.mat('woodMid'), 0, 0.5, 0, 6)); const tb = A.C(0.06, 0.04, 0.8, A.mat('brass'), 0, 1.1, 0, 12); tb.rotation.x = Math.PI / 2 - 0.15; sc.add(tb);
        R.hot('g_scope', R.at(sc, 0.4, 0, -0.9));
        R.o.ship = A.glow('#ffe0a0', 0.4, 0); R.o.ship.position.set(-1.5, 1.3, -1.9); R.g.add(R.o.ship);
        R.hot('g_back', R.put(A.door(0.9, 2.0, A.mat('iron')), 's', 0, 0.06));
        R.o.fl = new T.PointLight('#c8d8ff', 0, 12, 2); R.o.fl.position.set(0, 3, -1.5); R.g.add(R.o.fl);
      },
      tick(R, G, dt, t) { R.o.ship.material.opacity = 0.5 + Math.sin(t * 2) * 0.3; R.o.fl.intensity = Math.random() < 0.006 ? 4 : R.o.fl.intensity * 0.85; },
    },
    house: {
      size: [6, 2.8, 6], wall: 'wood_panel', floor: 'wood_floor', ceil: 'wood_attic', fog: 0.08, amb: ['#3a3430', '#0a0806', 0.24], yaw: 0, cam: [0, 1.3],
      build(R, A, T) {
        R.put(stormWin(), 'n', 1.6, 0.04);
        const stove = new T.Group(); stove.add(A.B(1.0, 1.4, 0.8, new T.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.7 }), 0, 0.7, 0)); const fire = A.glow('#ff8030', 0.6, 0.6); fire.position.set(0, 0.4, 0.42); stove.add(fire); R.put(stove, 'n', -1.4, 0.45);
        const fl = new T.PointLight('#ff9040', 1.2, 5, 2); fl.position.set(-1.4, 0.6, -2.2); R.g.add(fl); R.o.fl = fl;
        const sh = new T.Group(); sh.add(A.B(1.2, 0.04, 0.3, A.mat('woodMid'), 0, 0, 0)); const tin = A.B(0.14, 0.18, 0.1, new T.MeshStandardMaterial({ color: '#c83030', metalness: 0.5 }), -0.3, 0.11, 0); sh.add(tin); const cr = A.B(0.3, 0.04, 0.04, A.mat('iron'), 0.3, 0.04, 0); sh.add(cr); R.o.cr = cr;
        R.hot('h_shelf', R.put(sh, 'w', -1.0, 0.18, 1.5));
        const sh2 = shaft(A, T); R.o.sh = sh2; R.hot('h_shaft', R.put(sh2, 'e', -1.2, 0.6));
        const wch = new T.Group(); wch.add(A.C(0.2, 0.2, 0.5, A.mat('iron'), 0, 0, 0, 16)); wch.children[0].rotation.z = Math.PI / 2; const hd = A.B(0.04, 0.3, 0.04, A.mat('iron'), 0.3, -0.1, 0); hd.visible = false; wch.add(hd); R.o.hd = hd;
        R.hot('h_winch', R.put(wch, 'e', 0.2, 0.3, 0.8));
        R.hot('h_note', R.put(A.paperOn(0.34, 0.22, (g, W, H) => IMG.hoist(g, W, H)), 'e', 0.2, 0.02, 1.5));
        R.hot('h_pipe', R.put(pipe(A, T), 'w', 1.2, 0.08));
        const tbl = new T.Group(); tbl.add(A.B(1.2, 0.05, 0.8, A.mat('woodMid'), 0, 0.75, 0)); for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) tbl.add(A.B(0.05, 0.75, 0.05, A.mat('woodMid'), x, 0.37, z)); R.at(tbl, 0.4, 0, 0.4);
        R.hot('h_weather', R.put(A.door(1.0, 2.2), 's', -1.6, 0.06));
        R.hot('h_boat', R.put(A.door(1.0, 2.2, A.mat('woodMid')), 's', 0.4, 0.06));
        R.hot('h_fog', R.put(A.ironDoor(1.0, 2.2), 'w', 2.0, 0.08));
        R.at(A.candles(3, 0.15, true), 0.4, 0.78, 0.4);
      },
      update(R, S) { R.o.sh.userData.bucket.position.y = S.dw.pos === 'down' && S.f.hoist ? 0.6 : 2.6; R.o.sh.userData.bucket.visible = !!S.f.hoist; R.o.hd.visible = !!S.f.hoist; R.o.cr.visible = !S.f.t_crank; },
      tick(R, G, dt, t) { R.o.fl.intensity = 1.1 + Math.sin(t * 9) * 0.15 + Math.random() * 0.1; },
    },
    weather: {
      size: [3.6, 2.6, 3.6], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.09, amb: ['#2a3040', '#060606', 0.2], yaw: 0, cam: [0, 0.7],
      build(R, A, T) {
        R.put(stormWin(0.8, 0.9), 'n', -0.8, 0.04);
        const baro = new T.Group(); baro.add(A.B(0.5, 0.3, 0.3, A.mat('wood'), 0, 0.15, 0)); const drum = A.C(0.08, 0.08, 0.3, A.mat('paper'), 0, 0.38, 0, 16); drum.rotation.z = Math.PI / 2; baro.add(drum); const glass = A.B(0.5, 0.3, 0.3, new T.MeshStandardMaterial({ color: '#a8c0c8', transparent: true, opacity: 0.25 }), 0, 0.38, 0); baro.add(glass);
        const tbl = new T.Group(); tbl.add(A.B(1.0, 0.04, 0.6, A.mat('woodMid'), 0, 0.75, 0)); baro.position.y = 0.77; tbl.add(baro);
        R.hot('m_baro', R.put(tbl, 'n', 0.6, 0.35));
        R.hot('m_flags', R.put(A.paperOn(0.7, 0.49, (g, W, H) => IMG.flagtable(g, W, H)), 'e', 0, 0.02, 1.5));
        const an = new T.Group(); an.add(A.C(0.02, 0.02, 1.2, A.mat('iron'), 0, 0.6, 0, 6)); for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.SphereGeometry(0.06, 8, 6, 0, TAU, 0, Math.PI / 2), A.mat('iron')); c.position.set(Math.cos(i * 2.1) * 0.2, 1.2, Math.sin(i * 2.1) * 0.2); an.add(c); } R.o.an = an; R.put(an, 'w', 0.8, 0.4);
        R.hot('m_back', R.put(A.door(0.9, 2.0), 's', 0, 0.06));
        R.at(A.candles(1, 0, true), -1.2, 0.0, 1.2);
      },
      tick(R, G, dt) { R.o.an.rotation.y += dt * 6; },
    },
    boat: {
      size: [5, 3, 7], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.08, amb: ['#3a4450', '#0a0a0a', 0.38], yaw: 0, cam: [0, 2.6], trim: false,
      build(R, A, T) {
        const water = new T.Mesh(new T.PlaneGeometry(2.4, 6.6), new T.MeshStandardMaterial({ color: '#0a1820', metalness: 0.4, roughness: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.02, 0); R.g.add(water);
        const boat = new T.Group(); const hull = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 3.0, 16, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.8, side: T.DoubleSide })); hull.rotation.x = Math.PI / 2; hull.rotation.y = Math.PI; hull.scale.set(1, 1, 0.6); hull.position.y = 0.35; boat.add(hull);
        for (const z of [-0.6, 0.4]) boat.add(A.B(1.0, 0.04, 0.2, A.mat('woodMid'), 0, 0.35, z));
        const ch = A.B(0.3, 0.1, 0.2, new T.MeshStandardMaterial({ color: '#6a6a60' }), 0, 0.42, -0.6); boat.add(ch); R.o.chain = ch;
        R.hot('e_boat', R.at(boat, 0, 0, -0.4));
        const bot = A.C(0.04, 0.06, 0.3, new T.MeshStandardMaterial({ color: '#2a5a3a', transparent: true, opacity: 0.7 }), 0, 0.15, 0, 10); bot.rotation.z = Math.PI / 2;
        R.hot('e_bottle', R.put(new T.Group().add(A.B(0.6, 0.04, 0.3, A.mat('woodMid'), 0, 1.2, 0), (() => { bot.position.y = 1.38; return bot; })()), 'w', 1.6, 0.2));
        const gate = A.B(2.4, 2.4, 0.1, A.mat('woodMid'), 0, 1.2, 0); R.put(gate, 'n', 0, 0.06);
        R.hot('e_back', R.put(A.door(0.9, 2.0), 's', 1.6, 0.06));
        R.at(A.candles(1, 0, true), 1.8, 0, 2.6);
      },
      update(R, S) { R.o.chain.visible = !S.f.t_chain; },
    },
    fog: {
      size: [5, 3, 5], wall: 'bricks', floor: 'concrete', ceil: 'concrete', fog: 0.1, amb: ['#2a2a30', '#060404', 0.18], yaw: 0, cam: [0, 1.2], trim: false,
      build(R, A, T) {
        const tank = new T.Group(); tank.add(A.C(0.5, 0.5, 1.4, new T.MeshStandardMaterial({ color: '#7a6a3a', metalness: 0.4, roughness: 0.5 }), 0, 0.7, 0, 20), A.C(0.04, 0.04, 0.2, A.mat('brass'), 0.3, 0.3, 0.45, 8));
        R.hot('f_tank', R.put(tank, 'w', -1.0, 0.6));
        const horn = new T.Group(); horn.add(A.B(1.0, 1.0, 0.7, A.mat('iron'), 0, 0.5, 0)); const tr = A.C(0.15, 0.45, 1.2, new T.MeshStandardMaterial({ color: '#8a4a2a', metalness: 0.5 }), 0, 1.4, -0.1, 16); tr.rotation.x = -0.6; horn.add(tr);
        const sock = A.C(0.05, 0.05, 0.06, A.mat('brass'), 0.25, 0.8, 0.36, 10); sock.rotation.x = Math.PI / 2; horn.add(sock); const kk = A.B(0.03, 0.15, 0.03, A.mat('brass'), 0.25, 0.8, 0.42); kk.visible = false; horn.add(kk); R.o.kk = kk;
        R.hot('f_horn', R.put(horn, 'n', 0.6, 0.5));
        const oar = A.B(0.06, 1.8, 0.04, A.mat('woodMid'), 0, 0.9, 0); oar.rotation.z = 0.15; R.o.oar = oar; R.hot('f_oar', R.put(new T.Group().add(oar), 'e', -1.2, 0.08));
        R.hot('f_back', R.put(A.ironDoor(1.0, 2.2), 's', 0, 0.08));
        R.at(A.candles(2, 0.1, true), 1.6, 0, 1.6);
      },
      update(R, S) { R.o.kk.visible = !!S.f.insB; R.o.oar.visible = !S.f.t_oar; },
    },
    grotto: {
      size: [7, 3.5, 7], wall: 'stone', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.09, amb: ['#2a3a44', '#05080a', 0.24], yaw: 0, cam: [0, 2.6], trim: false,
      build(R, A, T) {
        const water = new T.Mesh(new T.PlaneGeometry(7, 3), new T.MeshStandardMaterial({ color: '#08161c', metalness: 0.5, roughness: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.03, 2); R.g.add(water);
        const wreck = new T.Group(); const hull = A.B(3.2, 1.0, 1.4, new T.MeshStandardMaterial({ color: '#3a2a1e', roughness: 0.9 }), 0, 0.5, 0); hull.rotation.z = 0.25; hull.rotation.y = 0.3; wreck.add(hull);
        const mast = A.C(0.06, 0.08, 2.6, A.mat('woodMid'), 0.6, 1.4, 0, 8); mast.rotation.z = -0.35; wreck.add(mast);
        const board = A.paperOn(0.8, 0.2, (g, W, H) => { g.fillStyle = '#2a1e14'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8c0a8'; g.font = `700 ${H * 0.7}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('…ЛУГА', W / 2, H * 0.78); }); board.position.set(-0.6, 0.6, 0.72); wreck.add(board);
        R.hot('g_wreck', R.put(wreck, 'n', 0, 1.2));
        const bell = new T.Group(); bell.add(A.C(0.12, 0.2, 0.28, new T.MeshStandardMaterial({ color: '#4a7a5a', metalness: 0.7, roughness: 0.4 }), 0, 0, 0, 16), A.C(0.02, 0.02, 0.4, A.mat('iron'), 0, 0.3, 0, 6)); R.o.bell = bell; R.hot('g_bell', R.at(bell, 1.4, 1.6, -1.6));
        const bt = A.C(0.04, 0.06, 0.3, new T.MeshStandardMaterial({ color: '#2a5a3a', transparent: true, opacity: 0.8 }), 0, 0.06, 0, 10); bt.rotation.z = Math.PI / 2; R.hot('g_bottle', R.at(new T.Group().add(bt), -1.4, 0, -0.6));
        R.o.kb = A.B(0.12, 0.03, 0.04, A.mat('iron'), 0, 0, 0); R.o.kb.visible = false; R.at(R.o.kb, 1.4, 1.4, -1.5);
        R.hot('g_boat', R.at(new T.Group().add(A.B(1.0, 0.3, 2.4, new T.MeshStandardMaterial({ color: '#5a3a22' }), 0, 0.15, 0)), 0.8, 0, 2.6));
        const l = new T.PointLight('#7aa8c8', 0.8, 8, 2); l.position.set(0, 2.5, 1.5); R.g.add(l);
        R.at(A.candles(1, 0, true), -0.4, 0, -0.4);
      },
      update(R, S) { R.o.kb.visible = !!S.f.bell && !S.f.t_key_b; },
      tick(R, G, dt, t) { R.o.bell.rotation.z = Math.sin(t * 0.8) * 0.06; },
    },
    light: {
      size: [9, 5, 9], wall: 'metal_plate', floor: 'metal_plate', ceil: 'metal_plate', fog: 0.03, amb: ['#c8c0a0', '#202020', 0.8], yaw: 0, cam: [0, 2.5], trim: false,
      build(R, A, T) {
        const glow = A.glow('#fff2c0', 5, 0.95); glow.position.set(0, 2.2, -1); R.g.add(glow);
        const l = new T.PointLight('#fff2c0', 3, 15, 2); l.position.set(0, 2.2, -1); R.g.add(l); R.o.l = l;
        R.hot('q_any', R.at(new T.Group().add(A.B(1, 1, 1, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0, 1, -2));
      },
      tick(R, G, dt, t) { R.o.l.intensity = 2.6 + Math.sin(t * 1.3) * 0.6; G.tyaw += dt * 0.15; },
    },
  };

  // ================= Точки интереса =================
  function hot(G, { use, bindUse, P }) {
    const seqPanel = (t, desc, items, key, act, n) => () => {
      const p = G.ps; p.seq = p.seq || [];
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${items.map((it) => `<button data-s="${it.id}" class="${p.seq.includes(it.id) ? 'sel' : ''}">${it.l}</button>`).join('')}</div><p class="hs-cap">Нажато: ${p.seq.length} из ${n}</p><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => { el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.s)) return; p.seq.push(b.dataset.s); G.snd(key); if (p.seq.length === n) G.act(act, p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } };
    };
    const tube = (o) => G.say('Переговорная труба', `Латунная труба уходит в стену. Если крикнуть — внизу услышат. ${G.role === 'up' ? 'Где-то там, у подножия, ' + G.nm('down') + '.' : 'Наверху, в башне, ' + G.nm('up') + '.'}`, '<button class="hs-btn ghost" data-doc="plaque">Табличка</button>');
    return {
      // ---------- Вахтенная ----------
      w_log: (o) => G.doc('logbook', o),
      w_pipe: (o) => { tube(o); G.focusOn(o); },
      w_shaft: (o, S, f) => (f.hoist ? P(() => G.dwPanel(), o) : G.say('Шахта подъёмника', 'Квадратная шахта во всю высоту башни. Ведро для керосина висит на тросе где-то внизу, в темноте. Барабан заторможен.')),
      w_levers: (o, S, f) => {
        if (f.brake) return G.say('Рычаги подъёмника', 'Стопор снят, тормоз отпущен, муфта включена. Дальше — дело лебёдки внизу.');
        P(seqPanel('Рычаги подъёмника', 'Три рычага у шахты. Если дёрнуть не в том порядке, ведро сорвётся вниз.', BRAKE, 'lever', 'brake', 3), o);
      },
      w_bedroom: (o, S, f) => { if (f.bedroom) return G.go('bedroom'); P(() => G.wheelsPanel({ t: 'Комната смотрителя', desc: 'Дверь заперта навесным замком с тремя колёсиками. На двери мелом: «Г. О.».', n: 3, chars: '0123456789', act: 'bedroom' }), o); },
      w_store: () => G.go('store'),
      w_hatch: (o, S, f) => { if (f.lantern) return G.go('lantern'); P(() => ({ t: 'Люк в фонарную', html: `<p class="hs-txt">Люк наверх, в фонарную. Заперт на длинный ключ.</p>${use('key_lantern', 'Отпереть ключом', 'unlock', 'lantern')}`, bind: bindUse }), o); },
      // ---------- Кладовая ----------
      t_back: () => G.go('watch'),
      t_shelf: (o) => P(() => ({ t: 'Полки кладовой', html: `<p class="hs-txt">Бидоны для керосина — все пустые, сухие, проржавевшие. Один целый.</p>${G.takeHtml(['can']) || '<p class="hs-cap">Остальные дырявые.</p>'}` }), o),
      // ---------- Комната смотрителя ----------
      b_door: () => G.go('watch'),
      b_photo: (o) => G.doc('photo', o),
      b_dresser: (o) => P(() => ({ t: 'Комод', html: `<p class="hs-txt">На комоде — дневник в красной обложке и ключ на верёвочке с поплавком.</p><button class="hs-btn ghost" data-doc="diary">Дневник смотрителя</button>${G.takeHtml(['key_boat'])}` }), o),
      b_box: (o, S, f) => {
        if (f.sew) return P(() => ({ t: 'Шкатулка Марии', html: `<p class="hs-txt">Нитки, напёрсток, пуговицы — и в бумажном конверте запасная калильная сетка.</p>${G.takeHtml(['key_a']) || '<p class="hs-cap">Только нитки.</p>'}` }), o);
        P(seqPanel('Шкатулка Марии', 'Швейная шкатулка. На крышке — латунные кнопки с рисунками. Нажимать надо по очереди.', SEW, 'click', 'sew', 3), o);
      },
      // ---------- Фонарная ----------
      l_down: () => G.go('watch'),
      l_gallery: () => (G.S.f.clock ? G.go('gallery') : G.say('Дверь на галерею', 'Дверь на внешнюю галерею. Снаружи ревёт ветер. Выходить в темноту без света нет смысла — в море ничего не видно.')),
      l_clock: (o, S, f) => P(() => f.clock ? { t: 'Часовой механизм', html: '<p class="hs-txt">Цепь на месте, грузы опускаются. Линза медленно вращается.</p>' } : { t: 'Часовой механизм', html: `<p class="hs-txt">Механизм вращения линзы: шестерни, грузы. Цепь лопнула — обрывок висит на звёздочке.</p>${use('chain', 'Надеть новую цепь', 'chain')}`, bind: bindUse }, o),
      l_lamp: (o, S, f) => {
        if (!f.fuel) return P(() => ({ t: 'Лампа маяка', html: `<p class="hs-txt">Керосиновая лампа внутри линзы. Бачок сухой.</p>${use('kerosene', 'Залить керосин', 'fuel')}`, bind: bindUse }), o);
        P(() => G.finalPanel(), o);
      },
      // ---------- Галерея ----------
      g_back: () => G.go('lantern'),
      g_scope: (o) => G.doc('ship', o),
      // ---------- Дом ----------
      h_pipe: (o) => { tube(o); G.focusOn(o); },
      h_note: (o) => G.doc('hoist', o),
      h_shelf: (o, S, f) => P(() => {
        if (f.tin) return { t: 'Полка', html: `<p class="hs-txt">Жестянка открыта: внутри — длинный ключ с маячком на головке.</p>${G.takeHtml(['key_lantern', 'crank']) || '<p class="hs-cap">Больше ничего.</p>'}` };
        const sp = G.wheelsPanel({ t: 'Полка над плитой', desc: 'Банки, соль — и жестянка из-под чая «Илюше». На ней кодовый замочек: день и месяц.', n: 4, chars: '0123456789', act: 'tin', top: ['день', 'день', 'мес', 'мес'] });
        const take = G.takeHtml(['crank']); sp.html = '<button class="hs-btn ghost" data-doc="tin">Жестянка</button>' + sp.html + take;
        return sp;
      }, o),
      h_shaft: (o, S, f) => (f.hoist ? P(() => G.dwPanel(), o) : G.say('Шахта подъёмника', 'Шахта уходит вверх, в темноту башни. Ведро висит на тросе. Лебёдка рядом — без рукояти.')),
      h_winch: (o, S, f) => P(() => f.hoist ? { t: 'Лебёдка', html: '<p class="hs-txt">Лебёдка работает. Ведро ходит по шахте.</p>' } : { t: 'Лебёдка', html: `<p class="hs-txt">Лебёдка подъёмника.${f.brake ? ' Барабан свободен.' : ' Барабан намертво заторможен — наверху стоит стопор.'}</p>${f.brake && G.has('crank') ? '<button class="hs-btn" data-use="winch">Вставить рукоять и крутить</button>' : ''}`, bind: bindUse }, o),
      h_weather: () => G.go('weather'),
      h_boat: (o, S, f) => { if (f.boat) return G.go('boat'); P(() => ({ t: 'Эллинг', html: `<p class="hs-txt">Дверь к эллингу — сараю для лодки у самой воды. Заперто.</p>${use('key_boat', 'Отпереть ключом', 'unlock', 'boat')}`, bind: bindUse }), o); },
      h_fog: (o, S, f) => { if (f.fog) return G.go('fog'); P(() => { const sp = G.wheelsPanel({ t: 'Туманная станция', desc: 'Тяжёлая дверь с буквенным замком на четыре буквы.', n: 4, chars: 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ', act: 'fogdoor' }); sp.html = '<button class="hs-btn ghost" data-doc="stormnote">Объявление на двери</button>' + sp.html; return sp; }, o); },
      // ---------- Метеостанция ----------
      m_back: () => G.go('house'),
      m_baro: (o) => G.doc('baro', o),
      m_flags: (o) => G.doc('flags', o),
      // ---------- Эллинг ----------
      e_back: () => G.go('house'),
      e_bottle: (o) => G.say('Корабль в бутылке', 'Модель траулера в бутылке. На борту крошечными буквами: «БЕЛУГА». Под ней бумажка: «Илья, 9 лет».'),
      e_boat: (o, S, f) => P(() => {
        let html = '<p class="hs-txt">Лодка «Мария». В носу — что-то тяжёлое в мешковине.</p>' + (G.takeHtml(['chain']) || '');
        if (!f.grotto) html += G.has('oar') ? '<button class="hs-btn" data-use="row">Сесть в лодку и грести к гроту</button>' : '<p class="hs-cap">Вёсел нет. Без весла далеко не уплыть.</p>';
        else html += '<button class="hs-btn" id="hsGrotto">Плыть в грот</button>';
        return { t: 'Лодка', html, bind: (el) => { bindUse(el); const b = $('#hsGrotto', el); if (b) b.onclick = () => G.go('grotto'); } };
      }, o),
      // ---------- Туманная станция ----------
      f_back: () => G.go('house'),
      f_tank: (o) => P(() => ({ t: 'Бак керосина', html: `<p class="hs-txt">Бак керосина для ревуна и маяка. Почти полный.</p>${G.has('can') ? '<button class="hs-btn" data-use="fill">Наполнить бидон</button>' : '<p class="hs-cap">Нужен бидон.</p>'}`, bind: bindUse }), o),
      f_oar: (o) => P(() => ({ t: 'Весло', html: `<p class="hs-txt">У стены стоит весло. На лопасти выжжено: «Мария».</p>${G.takeHtml(['oar']) || ''}` }), o),
      f_horn: (o) => P(() => G.finalPanel(), o),
      // ---------- Грот ----------
      g_boat: () => G.go('boat'),
      g_wreck: (o) => G.doc('wreck', o),
      g_bottle: (o) => G.doc('bottle', o),
      g_bell: (o, S, f) => {
        if (f.bell) return P(() => ({ t: 'Рында', html: `<p class="hs-txt">Рында отзвенела. Из колокола выпал ключ на цепочке.</p>${G.takeHtml(['key_b']) || '<p class="hs-cap">Тишина.</p>'}` }), o);
        P(() => { const p = G.ps; p.n = p.n || 0; return { t: 'Рында «Белуги»', html: `<p class="hs-txt">Корабельный колокол. Язык — на верёвке. Сколько раз ударить?</p><div class="hs-mline">${'🔔'.repeat(p.n) || '…'}</div><button class="hs-btn" id="hsHit">Ударить</button><button class="hs-btn" id="hsDone">Отпустить верёвку</button><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
          bind: (el) => { $('#hsHit', el).onclick = () => { p.n++; G.snd('bell'); G.renderPanel(); }; $('#hsDone', el).onclick = () => { G.act('bell', p.n); p.n = 0; }; $('#hsClr', el).onclick = () => { p.n = 0; G.renderPanel(); }; } }; }, o);
      },
      q_any: () => G.say('Свет', 'Луч уходит в море.'),
    };
  }

  StoryEngine.define({
    id: 'cape', title: 'Чёрный мыс', icon: '🌊', color: '#5a7a9a',
    tagline: 'Хоррор-детектив: маяк в шторм, ноябрь 1966-го',
    infoDefault: 'новая история · 3D',
    roles: [
      { id: 'up', name: 'Башня маяка', icon: '🕯️', desc: 'Ты наверху, в башне: вахтенная, кладовая, комната смотрителя, фонарная, галерея.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'Подножие мыса', icon: '🔦', desc: 'Ты внизу: дом смотрителя, метеостанция, эллинг, туманная станция, грот.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Пятая мрачная история: 5 глав, 11 комнат, около 20 загадок. 1,5 часа. Лучше в наушниках.',
      'Вы на разных высотах маяка. Улики разделены — говорите обо всём, что видите.',
      'Предметы поднимает керосиновый подъёмник в шахте башни — но его ещё нужно запустить.',
      'Прогресс сохраняется. Застряли — кнопка 💡.',
    ],
    sub: 'хоррор-детектив для двоих · 5 глав',
    warn: 'Наденьте наушники. Говорите обо всём, что видите: часть ответа всегда у другого.',
    roleLabel: { up: '🕯️ Ты — в <b>башне маяка</b>', down: '🔦 Ты — <b>у подножия</b>' },
    enterLabel: 'Подняться на мыс', menuArt: 'cape', endArt: 'dawn', endSub: 'зажгли маяк Чёрного мыса', finalRoom: 'light', introSound: { 2: 'crash' },
    chapters: CH, ITEMS, DOCS, IMG, ACT, HINTS, TAKE, chapterOf, drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART, hot,
    dw: {
      name: 'Керосиновый подъёмник', cabin: 'Ведро', empty: 'ведро пустое', putIn: 'Положить в ведро:', called: 'Трос заскрипел — ведро приехало к вам.', call: 'Подтянуть ведро', send: { up: 'вниз ↓', down: 'наверх ↑' },
      room: { up: 'watch', down: 'house' }, need: 'hoist',
      broken: { up: '', down: '' },
    },
    final: {
      title: 'Свет и ревун', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Лампа маяка, полная керосина. Сетка на месте — и огонь вспыхнет. Но корабль найдёт дорогу, только если в ту же секунду заревёт ревун.', down: 'Пульт туманного ревуна. Ключ — и ревун загудит. Но корабль найдёт дорогу, только если в ту же секунду вспыхнет маяк.' },
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'hoist': G.snd('rope'); G.toast(me ? 'Рукоять встала в гнездо. Трос заскрипел — подъёмник работает.' : 'В шахте заскрипел трос: снизу запустили подъёмник.', 4000); break;
        case 'clock': G.snd('mech'); G.toast(me ? 'Цепь натянулась, грузы пошли вниз. Линза медленно повернулась.' : 'Сверху, из фонарной, доносится тиканье механизма.', 4000); break;
        case 'row': G.snd('drain'); G.toast('Вёсла ударили по чёрной воде. Лодка вошла под скалу, в грот.', 3500); if (me) setTimeout(() => G.go('grotto'), 900); break;
        case 'bell': for (let i = 0; i < 4; i++) setTimeout(() => G.snd('bell'), i * 500); G.toast(me ? 'Четвёртый удар — и из колокола со звоном выпал ключ.' : 'Снизу, из-под мыса, четыре раза ударил колокол. Как будто кто-то вернулся домой.', 5000); break;
      }
    },
  });
})();
