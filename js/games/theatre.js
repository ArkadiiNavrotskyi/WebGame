'use strict';
// «Театр теней» — театр теней «Фонарь», 14 февраля 1958 года, премьера пьесы «Двое». Актриса Ольга ушла за экран и не вернулась.
// Один — за кулисами (сцена за экраном, гримёрка, мастерская, суфлёрская, колосники), другой — в зале (зал, фойе, гардероб, осветительная, трюм).
// Тени на экране видны только из зала — и зеркально. Предметы ходят подъёмным трапом.
(() => {
  const HA = window.HouseArt;
  const PUPPETS = [{ id: 'on', n: 'Он' }, { id: 'ona', n: 'Она' }, { id: 'bird', n: 'Птица' }];
  const POS = ['L', 'C', 'R'], POS_N = { L: 'слева', C: 'в центре', R: 'справа' }, FACE = ['<', '>'], FACE_N = { '<': 'смотрит ←', '>': 'смотрит →' };
  // как выглядит финальная сцена ИЗ ЗАЛА (на афише)
  const HALL_GOAL = { ona: ['L', '>'], on: ['R', '<'], bird: ['C', '>'] };
  const mirror = (p, f) => [p === 'L' ? 'R' : p === 'R' ? 'L' : 'C', f === '<' ? '>' : '<'];
  const enc = (cfg) => PUPPETS.map((p) => `${p.id}:${cfg[p.id][0]}:${cfg[p.id][1]}`).join(',');
  const FINAL_CFG = { ona: [0.42, '>'], on: [0.58, '<'], bird: [0.5, '>', -0.3] };
  const UP_GOAL = enc(Object.fromEntries(PUPPETS.map((p) => [p.id, mirror(...HALL_GOAL[p.id])])));
  const HOOKS = ['7', '9', '12', '13', '14', '21', '27', '31'];
  const LIGHT_CH = ['Рампа', 'Софит', 'Контровой', 'Фонарь за экраном'];
  const LIGHT_COL = ['белый', 'синий', 'красный', 'янтарный'];
  const LIGHTS = 'синий,синий,красный,белый';
  const FLY = [{ id: '1', l: 'Штанкет 1 · «Небо»' }, { id: '2', l: 'Штанкет 2 · «Стена»' }, { id: '3', l: 'Штанкет 3 · «Луна»' }, { id: '4', l: 'Штанкет 4 · «Город»' }, { id: '5', l: 'Штанкет 5 · «Дом»' }];
  const FLY_ORDER = ['2', '5', '1'];
  const NOTES = [['До', 262], ['Ре', 294], ['Ми', 330], ['Фа', 349], ['Соль', 392], ['Ля', 440], ['Си', 494]];
  const MELODY = ['Ми', 'Соль', 'Ля', 'Соль', 'Ми', 'Ре'];

  const ROOM_NAME = { stage: 'Сцена за экраном', dressing: 'Гримёрка Ольги', workshop: 'Мастерская кукол', prompter: 'Суфлёрская будка', flies: 'Колосники', hall: 'Зрительный зал', foyer: 'Фойе', cloak: 'Гардероб', booth: 'Осветительная', trap: 'Трюм под сценой', finale: 'Финал' };
  const AREA = { up: ['stage', 'dressing', 'workshop', 'prompter', 'flies'], down: ['hall', 'foyer', 'cloak', 'booth', 'trap'] };
  const OPEN = { stage: () => true, dressing: (S) => S.f.dressing, workshop: (S) => S.f.workshop, prompter: (S) => S.f.shadow, flies: (S) => S.f.lights, hall: () => true, foyer: () => true, cloak: () => true, booth: (S) => S.f.booth, trap: (S) => S.f.trap };
  const CH = ['', 'Глава I. Премьера', 'Глава II. Тени', 'Глава III. Суфлёр', 'Глава IV. Ольга', 'Глава V. Финал'];

  const INTRO = [
    ['street', 'Ленинград, февраль. В переулке за Фонтанкой — облупленный особняк с вывеской «Театр теней „Фонарь“». Закрыт с 1958 года. Сегодня в окнах горит свет.'],
    ['ticket', 'В почтовом ящике — два билета: «Премьера. „Двое“. Пьеса для теней и двух голосов. 14 февраля 1958 года. Ряд 7, места 13 и 14». На обороте — женским почерком: «Досмотрите за нас».'],
    ['screen', 'Пьеса «Двое» — о влюблённых, которых разделила стена. Они видели только тени друг друга. В ночь премьеры актриса Ольга Лурье ушла за экран в последней сцене — и больше её никто не видел.'],
    ['split', 'Вы вошли вместе, но в темноте разошлись. {up} — за экраном, на сцене. {down} — в зрительном зале. Между вами — белое полотно. Вы видите только тени друг друга.'],
  ];
  const OUTRO = [
    ['finale', 'Фонарь за экраном вспыхнул, и в ту же секунду граммофон в оркестровой яме запел. На полотне снова пошёл последний акт «Двоих».'],
    ['finale', 'Две тени шли друг к другу через весь экран — Он и Она. Птица взлетела над ними. Тени встретились посередине — и стены между ними больше не было.'],
    ['bow', 'Экран поднялся. На пустой сцене стояли двое — мужчина с куклой в руке и женщина в платье 1958 года. Они поклонились пустому залу. Вам двоим.'],
    ['bow', '«Спасибо, что досмотрели», — сказала Ольга. Яков взял её за руку, и они ушли за кулисы — туда, где их всё это время ждал свет.'],
    ['end', ''],
  ];

  // ================= Предметы =================
  const ITEMS = {
    key_booth: { n: 'Ключ от осветительной', d: 'Ключ на кольце с пластмассовой биркой «Свет».' },
    key_workshop: { n: 'Ключ от мастерской', d: 'Маленький ключ, завязанный красной ниткой.' },
    puppets: { n: 'Куклы-тени', d: 'Три плоские куклы из чёрного картона на тростях: Он, Она и Птица.' },
    key_trap: { n: 'Ключ от трюма', d: 'Ключ с биркой «Трюм. Только для машиниста сцены».' },
    key_a: { n: 'Линза волшебного фонаря', d: 'Тяжёлая линза в латунной оправе. Без неё фонарь за экраном не даст тени.' },
    key_b: { n: 'Пластинка «Двое»', d: 'Граммофонная пластинка. На этикетке от руки: «Финал. Яков и Оля».' },
  };
  const TAKE = { key_booth: (S) => S.f.cloak, key_workshop: (S) => S.f.case, puppets: (S) => S.f.workshop, key_trap: (S) => S.f.shadow, key_a: (S) => S.f.flies, key_b: (S) => S.f.piano };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const metal = (a, b) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const key = (c, tag) => { g.fillStyle = c; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill(); g.fillStyle = c; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12); if (tag) { g.strokeStyle = tag; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(s * 0.18, s * 0.4); g.quadraticCurveTo(s * 0.05, s * 0.2, s * 0.2, s * 0.1); g.stroke(); } };
    switch (id) {
      case 'key_booth': key(metal('#a8a8b0', '#2a2a30')); g.fillStyle = '#f0d040'; g.fillRect(s * 0.1, s * 0.1, s * 0.2, s * 0.14); break;
      case 'key_workshop': key(metal('#f0d890', '#5a4214'), '#c83030'); break;
      case 'key_trap': key(metal('#7a7a7a', '#1a1a1a')); break;
      case 'puppets': g.fillStyle = '#121212'; g.beginPath(); g.arc(s * 0.3, s * 0.3, s * 0.08, 0, TAU); g.fill(); g.fillRect(s * 0.26, s * 0.38, s * 0.08, s * 0.3); g.beginPath(); g.moveTo(s * 0.55, s * 0.68); g.lineTo(s * 0.65, s * 0.38); g.lineTo(s * 0.75, s * 0.68); g.fill(); g.beginPath(); g.arc(s * 0.65, s * 0.3, s * 0.07, 0, TAU); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 0.3, s * 0.68); g.lineTo(s * 0.3, s * 0.92); g.moveTo(s * 0.65, s * 0.68); g.lineTo(s * 0.65, s * 0.92); g.stroke(); break;
      case 'key_a': g.fillStyle = metal('#f0d890', '#5a4214'); g.beginPath(); g.arc(s / 2, s / 2, s * 0.34, 0, TAU); g.fill(); g.fillStyle = metal('#e8f4ff', '#6a88a8'); g.beginPath(); g.arc(s / 2, s / 2, s * 0.26, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(s * 0.42, s * 0.4, s * 0.08, s * 0.04, -0.6, 0, TAU); g.fill(); break;
      case 'key_b': g.fillStyle = '#121212'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.4, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(s / 2, s / 2, s * (0.18 + i * 0.045), 0, TAU); g.stroke(); } g.fillStyle = '#c83030'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.12, 0, TAU); g.fill(); break;
    }
  }

  // ================= Силуэты =================
  const sil = (g, kind, x, y, h, face, col = '#0a0a0a') => {
    const d = face === '>' ? 1 : -1; g.fillStyle = col; g.strokeStyle = col;
    if (kind === 'bird') {
      g.beginPath(); g.ellipse(x, y - h * 0.55, h * 0.18, h * 0.08, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + d * h * 0.17, y - h * 0.6, h * 0.06, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x + d * h * 0.22, y - h * 0.62); g.lineTo(x + d * h * 0.32, y - h * 0.6); g.lineTo(x + d * h * 0.22, y - h * 0.57); g.fill();
      g.beginPath(); g.moveTo(x - d * h * 0.05, y - h * 0.58); g.quadraticCurveTo(x - d * h * 0.1, y - h * 0.95, x - d * h * 0.3, y - h * 0.9); g.lineTo(x - d * h * 0.02, y - h * 0.55); g.fill();
      g.beginPath(); g.moveTo(x - d * h * 0.16, y - h * 0.55); g.lineTo(x - d * h * 0.32, y - h * 0.45); g.lineTo(x - d * h * 0.3, y - h * 0.58); g.fill();
      return;
    }
    const hr = h * 0.09; g.beginPath(); g.arc(x, y - h + hr, hr, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x + d * hr * 0.8, y - h + hr * 0.9); g.lineTo(x + d * hr * 1.35, y - h + hr * 1.15); g.lineTo(x + d * hr * 0.8, y - h + hr * 1.3); g.fill();
    if (kind === 'ona') { g.beginPath(); g.moveTo(x - d * hr * 0.7, y - h + hr * 0.4); g.quadraticCurveTo(x - d * hr * 2.2, y - h + hr * 2.5, x - d * hr * 1.4, y - h * 0.62); g.lineTo(x - d * hr * 0.6, y - h + hr * 1.6); g.fill(); }
    g.fillRect(x - hr * 0.35, y - h + hr * 1.9, hr * 0.7, hr * 0.5);
    if (kind === 'ona') { g.beginPath(); g.moveTo(x - hr * 0.8, y - h + hr * 2.3); g.lineTo(x + hr * 0.8, y - h + hr * 2.3); g.lineTo(x + hr * 2.2, y - h * 0.12); g.lineTo(x - hr * 2.2, y - h * 0.12); g.fill(); }
    else { g.fillRect(x - hr * 0.9, y - h + hr * 2.3, hr * 1.8, h * 0.42); g.fillRect(x - hr * 0.8, y - h * 0.42, hr * 0.6, h * 0.3); g.fillRect(x + hr * 0.2, y - h * 0.42, hr * 0.6, h * 0.3); g.beginPath(); g.moveTo(x - hr * 0.9, y - h + hr * 1.9); g.lineTo(x - hr * 0.9, y - h + hr * 1.9); g.lineTo(x - hr * 1.6, y - h + hr * 2.2); g.lineTo(x - hr * 0.6, y - h + hr * 2.6); g.fill(); }
    g.lineWidth = hr * 0.45; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - h + hr * 2.8); g.lineTo(x + d * hr * 2.6, y - h + hr * 3.6); g.stroke();
    g.fillRect(x - hr * 0.3, y - h * 0.12, hr * 0.25, h * 0.12); g.fillRect(x + hr * 0.1, y - h * 0.12, hr * 0.25, h * 0.12);
  };
  // рисует экран: cfg = { id: [pos, face] } в координатах зрителя
  const screenDraw = (g, w, h, cfg, lit = true) => {
    const gr = g.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.6); gr.addColorStop(0, lit ? '#f8ecd0' : '#5a5448'); gr.addColorStop(1, lit ? '#c8b088' : '#2a2620'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h * 0.86, w, h * 0.14);
    if (!cfg) return;
    const X = { L: 0.22, C: 0.5, R: 0.78 };
    PUPPETS.forEach((p) => { const c = cfg[p.id]; if (!c) return; sil(g, p.id, w * (typeof c[0] === 'number' ? c[0] : X[c[0]]), h * (0.88 + (c[2] || 0)), h * 0.62, c[1], 'rgba(10,8,6,0.92)'); });
  };
  const parse = (s) => { if (!s) return null; const o = {}; s.split(',').forEach((t) => { const [id, p, f] = t.split(':'); o[id] = [p, f]; }); return o; };
  const toHall = (cfg) => cfg && Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, mirror(...v)]));

  // ================= Иллюстрации =================
  const paper = (g, w, h, c = '#d8ccb0') => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,20,0.06)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * w * 0.06, 0, TAU); g.fill(); } };
  const IMG = {
    afisha: (g, w, h) => {
      g.fillStyle = '#1a1414'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8d8b0'; g.textAlign = 'center'; g.font = `700 ${h * 0.05}px 'PT Mono', monospace`; g.fillText('ТЕАТР ТЕНЕЙ «ФОНАРЬ»', w / 2, h * 0.07);
      g.font = `700 ${h * 0.12}px 'Cormorant Garamond', serif`; g.fillStyle = '#d8a050'; g.fillText('ДВОЕ', w / 2, h * 0.2);
      g.font = `italic ${h * 0.04}px 'Cormorant Garamond', serif`; g.fillStyle = '#e8d8b0'; g.fillText('пьеса для теней и двух голосов', w / 2, h * 0.26);
      g.save(); g.translate(w * 0.1, h * 0.31); screenDraw(g, w * 0.8, h * 0.42, HALL_GOAL); g.restore();
      g.strokeStyle = '#d8a050'; g.lineWidth = 3; g.strokeRect(w * 0.1, h * 0.31, w * 0.8, h * 0.42);
      g.fillStyle = '#e8d8b0'; g.font = `${h * 0.035}px 'PT Mono', monospace`; g.fillText('финальная сцена · вид из зала', w / 2, h * 0.77);
      g.font = `700 ${h * 0.05}px 'PT Mono', monospace`; g.fillText('ПРЕМЬЕРА 14 ФЕВРАЛЯ 1958', w / 2, h * 0.86);
      g.font = `${h * 0.035}px 'PT Mono', monospace`; g.fillText('Куклы — Я. Лурье · Голос — О. Лурье', w / 2, h * 0.93);
    },
    tickets: (g, w, h) => {
      g.fillStyle = '#1a1614'; g.fillRect(0, 0, w, h);
      const tk = (x, seat) => { g.fillStyle = '#e8c890'; g.fillRect(x, h * 0.12, w * 0.42, h * 0.76); g.fillStyle = '#5a1a1a'; g.textAlign = 'center'; g.font = `700 ${h * 0.07}px 'PT Mono', monospace`; g.fillText('«ФОНАРЬ»', x + w * 0.21, h * 0.25); g.fillStyle = '#2a1e14'; g.font = `${h * 0.055}px 'PT Mono', monospace`; ['Премьера «Двое»', '14.02.1958 · 19:00', 'Партер', 'Ряд 7 · Место ' + seat].forEach((l, i) => g.fillText(l, x + w * 0.21, h * (0.38 + i * 0.1))); g.setLineDash([4, 4]); g.strokeStyle = '#5a1a1a'; g.beginPath(); g.moveTo(x, h * 0.78); g.lineTo(x + w * 0.42, h * 0.78); g.stroke(); g.setLineDash([]); };
      tk(w * 0.05, 13); tk(w * 0.53, 14);
    },
    music: (g, w, h) => {
      paper(g, w, h, '#ece4cc');
      g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `${h * 0.08}px 'Marck Script', cursive`; g.fillText('Колыбельная Оли (для финала)', w / 2, h * 0.13);
      g.strokeStyle = '#2a1e14'; g.lineWidth = 1.2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w * 0.06, h * (0.38 + i * 0.06)); g.lineTo(w * 0.94, h * (0.38 + i * 0.06)); g.stroke(); }
      const ypos = { 'До': 0.68, 'Ре': 0.65, 'Ми': 0.62, 'Фа': 0.59, 'Соль': 0.56, 'Ля': 0.53, 'Си': 0.5 };
      MELODY.forEach((n, i) => { const x = w * (0.16 + i * 0.13), y = h * ypos[n]; g.fillStyle = '#2a1e14'; g.beginPath(); g.ellipse(x, y, w * 0.022, h * 0.025, -0.3, 0, TAU); g.fill(); g.fillRect(x + w * 0.018, y - h * 0.18, 2, h * 0.18); g.font = `${h * 0.05}px 'Marck Script', cursive`; g.fillText(n, x, h * 0.85); });
      g.font = `${h * 0.045}px 'Marck Script', cursive`; g.fillText('— Яше. Играй медленно.', w * 0.7, h * 0.96);
    },
  };

  // ================= Документы =================
  const DOCS = {
    tickets: { t: 'Ваши билеты', k: 'img', img: 'tickets', ratio: 0.5, cap: 'Билеты оказались у тебя в кармане. Корешки не оторваны.' },
    afisha: { t: 'Афиша в фойе', k: 'img', img: 'afisha', ratio: 1.35, cap: 'Большая афиша под стеклом. Финальная сцена нарисована так, как её видят из зала.' },
    dresslock: { t: 'Дверь гримёрки', k: 'hand', text: 'На двери — латунная звезда и табличка «О. Лурье». Под ручкой — замок с четырьмя колёсиками.\n\nМелом на двери: «Открывать только в день премьеры».' },
    mirror: { t: 'Зеркало в гримёрке', k: 'hand', text: 'Помадой по стеклу, торопливо:\n\n«Яша, прости. Я не уйду со сцены, пока мы не доиграем. Я буду за экраном. Найди меня в последней сцене».' },
    letter: { t: 'Записка на гримёрном столике', k: 'hand', text: 'Яша!\n\nКлюч от мастерской я спрятала в витрине с Птицей, в фойе. Код ты помнишь — наш первый спектакль: третий ряд, места пять и шесть.\n\nБез кукол финала не будет.\nТвоя О.' },
    diary: { t: 'Тетрадь Якова', k: 'hand', text: '14.II.58, ночь.\n\nОна ушла за экран в последней сцене — так и было задумано: Она уходит в свет, Он идёт за ней. Но фонарь погас, пластинка оборвалась, и когда я поднял экран — её там не было.\n\nЯ спрятал линзу фонаря на колосниках и пластинку — в пианино. Пусть никто не играет этот финал без неё.\n\nЕсли кто-то когда-нибудь доиграет — пусть сначала расставит нас правильно. Помни: из-за экрана всё наоборот.' },
    cue: { t: 'Суфлёрский экземпляр', k: 'typed', text: '«ДВОЕ» · СУФЛЁРСКИЙ ЭКЗЕМПЛЯР\n\nФинал. Свет:\nРампа — синий\nСофит — синий\nКонтровой — красный\nФонарь за экраном — белый\n\nПотом — музыка (пластинка), и Она уходит в свет.\n\nНа полях карандашом: «Последнюю реплику Оля скажет сама».' },
    stagelog: { t: 'Журнал машиниста сцены', k: 'typed', text: 'ЖУРНАЛ МАШИНИСТА СЦЕНЫ\n\nФинал «Двоих»:\nсначала поднять «Стену» (шт. 2),\nпотом «Дом» (шт. 5),\nпотом «Небо» (шт. 1) — и за «Небом» Я. Л. держит что-то своё. Не трогать!\n\n14.II.58 — последняя запись: «Экран подняли. Пусто»' },
    trunk: { t: 'Сундук с костюмами', k: 'paper', text: 'Платье Ольги для финала: серое, лёгкое, будто из тени. Оно пахнет духами «Красная Москва» — как будто его только что сняли.' },
    music: { t: 'Ноты на стене мастерской', k: 'img', img: 'music', ratio: 0.72, cap: 'Ноты приколоты к стене булавками. Почерк Ольги.' },
    hallnote: { t: 'Табличка у оркестровой ямы', k: 'paper', text: 'ОРКЕСТРОВАЯ ЯМА\n\nПианино настроено. Граммофон — для финала «Двоих».' },
  };

  // ================= Логика =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { booth: 'key_booth', workshop: 'key_workshop', trap: 'key_trap' };
  const ACT = {
    unlock(S, who, door) { const n = UNLOCK[door]; if (!n || S.f[door] || !has(S, who, n)) return null; rm(S, who, n); S.f[door] = 1; return ok(who, 'Ключ повернулся.', 'door'); },
    cloak(S, who, v) { if (S.f.cloak) return null; if (v === '13,14') { S.f.cloak = 1; return ok(who, 'На крючках 13 и 14 — два пальто 1958 года. В кармане одного звякнул ключ.', 'take'); } return bad(who); },
    power(S, who) { if (S.f.power || !S.f.booth) return null; S.f.power = 1; return { a: 'power', who }; },
    dressing(S, who, v) { if (S.f.dressing) return null; if (v === '1402') { S.f.dressing = 1; return ok(who, 'Замок гримёрки щёлкнул.', 'door'); } return bad(who); },
    case(S, who, v) { if (S.f.case) return null; if (v === '356') { S.f.case = 1; return ok(who, 'Стекло витрины отъехало. Птица смотрит на тебя бусиной глаза.', 'click'); } return bad(who); },
    shadow(S, who, v) { if (S.f.shadow || !has(S, who, 'puppets')) return null; S.f.sh = v; if (v === UP_GOAL) { S.f.shadow = 1; rm(S, who, 'puppets'); return { a: 'shadow', who }; } return { a: 'shtry', who }; },
    lights(S, who, v) { if (S.f.lights || !S.f.power) return null; if (v === LIGHTS) { S.f.lights = 1; return { a: 'lights', who }; } return bad(who); },
    flies(S, who, v) { if (S.f.flies) return null; if (Array.isArray(v) && v.join() === FLY_ORDER.join()) { S.f.flies = 1; return ok(who, 'Штанкеты поползли вверх. За «Небом» что-то блеснуло и упало на настил.', 'rope'); } return bad(who); },
    piano(S, who, v) { if (S.f.piano || !S.f.trap) return null; if (Array.isArray(v) && v.join() === MELODY.join()) { S.f.piano = 1; return { a: 'piano', who }; } return bad(who); },
  };
  const chapterOf = (S) => (!(S.f.power && S.f.dressing) ? 1 : !S.f.shadow ? 2 : !S.f.lights ? 3 : !(S.f.flies && S.f.piano) ? 4 : 5);
  const HINTS = [
    [(S) => !S.f.cloak, 'Твои билеты — у тебя. Скажи в зал номера мест: там гардероб с номерками.', 'Гардероб: на каких крючках ваши пальто? Номера мест — на билетах у того, кто за экраном.'],
    [(S) => !S.f.power, 'В зале нужно включить свет в осветительной (ключ — в гардеробе).', 'Ключ от осветительной — в кармане пальто. Там рубильник.'],
    [(S) => !S.f.dressing, 'Гримёрка открывается «в день премьеры». Дата — на афише в фойе.', 'Прочитай за экран дату премьеры с афиши в фойе.'],
    [(S) => !S.f.case, 'На гримёрном столике записка с кодом витрины в фойе. Продиктуй в зал.', 'Витрина с Птицей в фойе: код — в записке Ольги за экраном.'],
    [(S) => !S.f.workshop, 'Ключ от мастерской — в витрине в фойе. Его пришлют трапом.', 'Отправь ключ от мастерской на сцену подъёмным трапом.'],
    [(S) => !S.f.shadow, 'Расставь кукол. Из зала видно тени — и афишу финала. Но из-за экрана всё наоборот: лево — право, и куда смотрят — тоже.', 'Смотри на экран в зале и сравнивай с афишей финала. Подсказывай, кого куда переставить.'],
    [(S) => !S.f.lights, 'В суфлёрской — суфлёрский экземпляр со светом финала. Продиктуй в зал.', 'Пульт в осветительной: цвета финала — в суфлёрском экземпляре за экраном.'],
    [(S) => !S.f.trap, 'Ключ от трюма — в суфлёрской. Отправь в зал.', 'Ключ от трюма придёт со сцены.'],
    [(S) => !S.f.flies, 'Колосники: порядок штанкетов — в журнале машиниста сцены (трюм, в зале).', 'В трюме журнал машиниста сцены. Прочитай за экран, в каком порядке поднимать штанкеты.'],
    [(S) => !S.f.piano, 'В мастерской — ноты «Колыбельной Оли». Продиктуй в зал: там пианино.', 'Пианино в оркестровой яме: мелодия — в нотах из мастерской за экраном.'],
    [(S) => !(S.f.insA && S.f.insB), 'Линзу — в волшебный фонарь за экраном.', 'Пластинку — на граммофон в оркестровой яме.'],
    [() => true, 'Одновременно: фонарь и музыка! «Три, два, один — сейчас!»', 'Одновременно: фонарь и музыка! «Три, два, один — сейчас!»'],
  ];

  // ================= Сцены =================
  const ART = (g, w, hh, key, K) => {
    const { fog, sky } = K;
    switch (key) {
      case 'street': {
        sky('#0a0c14', '#1a1a24');
        g.fillStyle = '#14141a'; g.fillRect(w * 0.15, hh * 0.2, w * 0.7, hh * 0.65);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const on = j === 2 && (i === 2 || i === 3); g.fillStyle = on ? '#f0c878' : '#1e1e28'; g.fillRect(w * (0.2 + i * 0.105), hh * (0.28 + j * 0.17), w * 0.06, hh * 0.11); }
        g.fillStyle = '#d8a050'; g.font = `700 ${hh * 0.035}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('ТЕАТР ТЕНЕЙ «ФОНАРЬ»', w / 2, hh * 0.25);
        g.fillStyle = '#0a0a0e'; g.fillRect(0, hh * 0.85, w, hh * 0.15); g.fillStyle = 'rgba(240,200,120,0.15)'; g.fillRect(w * 0.4, hh * 0.85, w * 0.2, hh * 0.15);
        g.fillStyle = '#1a1a1a'; g.fillRect(w * 0.08, hh * 0.35, 5, hh * 0.5); const gl = g.createRadialGradient(w * 0.085, hh * 0.35, 0, w * 0.085, hh * 0.35, 80); gl.addColorStop(0, 'rgba(255,220,150,0.5)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, hh);
        g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 200; i++) g.fillRect(Math.random() * w, Math.random() * hh, 1.5, 1.5);
        fog(); break;
      }
      case 'ticket': sky('#14100c', '#0a0806'); g.save(); g.translate(w * 0.15, hh * 0.15); IMG.tickets(g, w * 0.7, hh * 0.7); g.restore(); break;
      case 'screen': case 'finale': {
        g.fillStyle = '#0a0606'; g.fillRect(0, 0, w, hh);
        g.fillStyle = '#5a1418'; g.fillRect(0, 0, w * 0.12, hh); g.fillRect(w * 0.88, 0, w * 0.12, hh); g.fillRect(0, 0, w, hh * 0.1);
        g.save(); g.translate(w * 0.14, hh * 0.13); const fin = key === 'finale';
        screenDraw(g, w * 0.72, hh * 0.62, fin ? FINAL_CFG : { on: ['L', '<'], ona: ['R', '>'], bird: ['C', '<'] }, true);
        if (fin) { g.globalCompositeOperation = 'source-over'; } g.restore();
        g.fillStyle = '#0a0606'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(w * (0.12 + i * 0.095), hh * 0.95, hh * 0.05, Math.PI, 0); g.fill(); }
        break;
      }
      case 'split': {
        g.fillStyle = '#0a0606'; g.fillRect(0, 0, w, hh);
        g.fillStyle = '#d8c8a8'; g.fillRect(w * 0.49, hh * 0.08, w * 0.02, hh * 0.84);
        const L = (x, c) => { const gr = g.createRadialGradient(x, hh * 0.5, 0, x, hh * 0.5, 200); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }; L(w * 0.3, 'rgba(255,220,160,0.3)'); L(w * 0.7, 'rgba(160,180,220,0.2)');
        sil(g, 'on', w * 0.3, hh * 0.85, hh * 0.5, '>', '#000'); sil(g, 'ona', w * 0.7, hh * 0.85, hh * 0.5, '<', '#000');
        break;
      }
      case 'bow': {
        g.fillStyle = '#0a0606'; g.fillRect(0, 0, w, hh);
        const gr = g.createRadialGradient(w / 2, hh * 0.6, 0, w / 2, hh * 0.6, w * 0.4); gr.addColorStop(0, 'rgba(255,220,160,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
        g.fillStyle = '#5a1418'; g.fillRect(0, 0, w * 0.15, hh); g.fillRect(w * 0.85, 0, w * 0.15, hh); g.fillStyle = '#3a2418'; g.fillRect(0, hh * 0.82, w, hh * 0.18);
        g.globalAlpha = 0.7; HA.figure(g, w * 0.44, hh * 0.82, hh * 0.13, '#1a1a22', '#d8c8b0'); HA.figure(g, w * 0.56, hh * 0.82, hh * 0.13, '#5a5a6a', '#e8d8c0'); g.globalAlpha = 1;
        break;
      }
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  let _lit = null; const litMat = () => _lit || (_lit = new THREE.MeshBasicMaterial({ color: '#ffe0b0' }));
  const bulbSet = (b, on, v = 1.2) => { b.userData.b.material = on ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = on ? 0.7 : 0; lightOn(b.userData.l, on, v); };
  let _velvet = null; const velvet = () => _velvet || (_velvet = new THREE.MeshStandardMaterial({ color: '#5a1418', roughness: 0.95 }));
  const curtain = (A, T, w, h) => { const g = new T.Group(), m = velvet(); for (let i = 0; i < Math.round(w / 0.25); i++) { const c = A.C(0.13, 0.13, h, m, -w / 2 + i * 0.25 + 0.12, h / 2, 0, 8); g.add(c); } return g; };
  const screenTex = (fn) => { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const redraw = (...a) => { fn(c.getContext('2d'), 512, 300, ...a); t.needsUpdate = true; }; return { t, redraw }; };
  const seat = (A, T) => { const g = new T.Group(), m = velvet(); g.add(A.B(0.5, 0.1, 0.45, m, 0, 0.45, 0), A.B(0.5, 0.55, 0.08, m, 0, 0.75, 0.2), A.B(0.04, 0.45, 0.4, A.mat('woodMid'), -0.26, 0.22, 0), A.B(0.04, 0.45, 0.4, A.mat('woodMid'), 0.26, 0.22, 0)); return g; };
  const ROOMS = {
    stage: {
      size: [8, 5, 7], wall: 'wood_panel', floor: 'wood_floor', ceil: 'wood_attic', fog: 0.06, amb: ['#3a3028', '#0a0606', 0.24], yaw: 0, cam: [0, 2.2],
      build(R, A, T) {
        const st = screenTex((g, w, h, cfg, lit) => { g.fillStyle = lit ? '#e8dcc0' : '#6a645a'; g.fillRect(0, 0, w, h); if (cfg) { const X = { L: 0.22, C: 0.5, R: 0.78 }; PUPPETS.forEach((p) => { const c = cfg[p.id]; if (c) { g.save(); g.globalAlpha = 0.5; sil(g, p.id, w * X[c[0]], h * 0.88, h * 0.62, c[1], '#2a2420'); g.restore(); } }); } });
        R.o.st = st; const scr = new T.Mesh(new T.PlaneGeometry(5.5, 3.2), new T.MeshStandardMaterial({ map: st.t, roughness: 0.9, side: T.DoubleSide })); scr.position.set(0, 2.1, -2.8); R.g.add(scr); R.hot('p_screen', scr);
        R.g.add(curtain(A, T, 1.2, 5).translateX(-3.4).translateZ(-2.9)); R.g.add(curtain(A, T, 1.2, 5).translateX(3.4).translateZ(-2.9));
        const lantern = new T.Group(); lantern.add(A.B(0.5, 0.5, 0.7, A.mat('brass'), 0, 1.3, 0), A.C(0.04, 0.06, 1.1, A.mat('iron'), 0, 0.55, 0, 8), A.C(0.12, 0.12, 0.15, A.mat('black'), 0, 1.3, -0.42, 16)); lantern.children[2].rotation.x = Math.PI / 2;
        const lens = A.C(0.11, 0.11, 0.04, new T.MeshStandardMaterial({ color: '#c8e0f0', metalness: 0.3, roughness: 0.05 }), 0, 1.3, -0.5, 16); lens.rotation.x = Math.PI / 2; lens.visible = false; lantern.add(lens); R.o.lens = lens;
        const lamp = new T.PointLight('#ffe8c0', 0, 7, 2); lamp.position.set(0, 1.4, -0.8); lantern.add(lamp); R.o.lamp = lamp;
        R.hot('p_lantern', R.at(lantern, -1.3, 0, 0.6, -0.35));
        const rack = new T.Group(); rack.add(A.B(1.2, 0.05, 0.3, A.mat('woodMid'), 0, 1.6, 0)); R.o.pup = []; for (let i = 0; i < 3; i++) { const p = A.B(0.25, 0.5, 0.01, A.mat('black'), -0.4 + i * 0.4, 1.25, 0.1); rack.add(p); R.o.pup.push(p); }
        R.hot('p_rack', R.put(rack, 'w', 0.8, 0.2));
        const trap = new T.Group(); trap.add(A.B(1.2, 0.06, 1.2, A.mat('woodMid'), 0, 0.03, 0)); R.o.trap = trap; R.hot('p_trap', R.at(trap, 2.6, 0, 1.6));
        R.hot('p_dressing', R.put(A.door(1.0, 2.2), 'w', -1.8, 0.06));
        R.hot('p_workshop', R.put(A.door(1.0, 2.2, A.mat('woodMid')), 'e', -1.2, 0.06));
        R.hot('p_prompter', R.at(new T.Group().add(A.B(0.9, 0.5, 0.6, A.mat('wood'), 0, 0.25, 0)), -2.2, 0, -2.0));
        R.hot('p_ladder', R.put(A.ladder(4.8), 'e', 1.6, 0.3));
        R.hot('p_tickets', R.at(new T.Group().add(A.B(0.3, 0.02, 0.15, new T.MeshStandardMaterial({ color: '#e8c890' }), 0, 0, 0)), 1.0, 0.9, 1.8));
        R.at(new T.Group().add(A.B(0.8, 0.85, 0.5, A.mat('wood'), 0, 0.42, 0)), 1.0, 0, 1.8);
        R.o.work = new T.PointLight('#ffc070', 0.9, 6, 2); R.o.work.position.set(-2, 3, 2); R.g.add(R.o.work);
      },
      update(R, S) { const lit = !!S.f.final, cfg = parse(S.f.sh); R.o.st.redraw(S.f.shadow ? parse(UP_GOAL) : cfg, !!S.f.lights || lit); lightOn(R.o.lamp, lit || !!S.f.lights, lit ? 2.5 : 0.8); R.o.lens.visible = !!S.f.insA; R.o.pup.forEach((p) => (p.visible = !S.f.t_puppets && !!S.f.workshop)); },
    },
    dressing: {
      size: [4, 2.8, 4], wall: 'damask_red', floor: 'wood_floor', ceil: 'plaster', fog: 0.07, amb: ['#4a3430', '#0a0606', 0.28], yaw: 0, cam: [0, 0.8],
      build(R, A, T) {
        const tbl = new T.Group(); tbl.add(A.B(1.6, 0.05, 0.5, A.mat('wood'), 0, 0.75, 0), A.B(1.6, 0.75, 0.04, A.mat('woodMid'), 0, 0.37, -0.23));
        const mir = new T.Mesh(new T.PlaneGeometry(1.0, 0.8), new T.MeshStandardMaterial({ color: '#8a9aa8', metalness: 0.9, roughness: 0.12 })); mir.position.set(0, 1.35, -0.22); tbl.add(mir);
        const ink = A.paperOn(0.9, 0.5, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(200,30,40,0.85)'; g.font = `${H * 0.16}px 'Marck Script', cursive`; g.textAlign = 'center'; g.fillText('Яша, прости.', W / 2, H * 0.3); g.fillText('Я за экраном.', W / 2, H * 0.6); }); ink.material.transparent = true; ink.position.set(0, 1.35, -0.21); tbl.add(ink);
        R.o.bulbs = []; for (let i = 0; i < 8; i++) { const b = new T.Mesh(new T.SphereGeometry(0.035, 8, 6), new T.MeshBasicMaterial({ color: '#ffe0a0' })); const a = i / 8; b.position.set(i < 4 ? -0.56 : 0.56, 1.0 + (i % 4) * 0.22, -0.2); tbl.add(b); R.o.bulbs.push(b); }
        R.hot('d_mirror', R.put(tbl, 'n', 0, 0.3));
        R.hot('d_note', R.at(new T.Group().add(A.B(0.2, 0.01, 0.15, A.mat('paper'), 0, 0, 0)), 0.4, 0.79, -1.5));
        const dress = A.mannequin(); R.hot('d_dress', R.put(dress, 'w', 0.4, 0.5));
        R.hot('d_door', R.put(A.door(1.0, 2.2), 's', 0.8, 0.06));
        const l = new T.PointLight('#ffd8a0', 0.9, 5, 2); l.position.set(0, 1.5, -1.2); R.g.add(l);
      },
    },
    workshop: {
      size: [5, 3, 5], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.08, amb: ['#3a3028', '#0a0606', 0.24], yaw: 0, cam: [0, 1.0],
      build(R, A, T) {
        const wb = A.workbench(); R.hot('w_bench', R.put(wb, 'n', 0, 0.4));
        for (let i = 0; i < 7; i++) { const p = new T.Group(); p.add(A.C(0.005, 0.005, 0.8, A.mat('cloth'), 0, 0.4, 0, 4), A.B(0.22, 0.4, 0.01, A.mat('black'), 0, -0.1, 0)); p.position.set(-1.8 + i * 0.6, 2.2, -1.6 + (i % 2) * 0.3); p.rotation.y = i * 0.7; R.g.add(p); }
        const rack = new T.Group(); rack.add(A.B(1.4, 1.6, 0.3, A.mat('woodMid'), 0, 0.8, 0)); R.o.pp = []; for (let i = 0; i < 3; i++) { const s = A.B(0.3, 0.6, 0.01, A.mat('black'), -0.45 + i * 0.45, 1.0, 0.16); rack.add(s); R.o.pp.push(s); }
        R.hot('w_rack', R.put(rack, 'w', 0, 0.2));
        R.hot('w_music', R.put(A.paperOn(0.5, 0.36, (g, W, H) => IMG.music(g, W, H)), 'e', -0.6, 0.02, 1.5));
        R.hot('w_diary', R.at(new T.Group().add(A.B(0.25, 0.04, 0.32, A.mat('green'), 0, 0, 0)), 0.5, 0.96, -1.9));
        R.hot('w_door', R.put(A.door(1.0, 2.2, A.mat('woodMid')), 's', 0, 0.06));
        R.at(new T.PointLight('#ffc070', 1.1, 5, 2), 0, 2.2, -1);
      },
      update(R, S) { R.o.pp.forEach((p) => (p.visible = !S.f.t_puppets)); },
    },
    prompter: {
      size: [2.4, 1.8, 2.2], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.1, amb: ['#3a3028', '#0a0606', 0.28], yaw: 0, cam: [0, 0.6], trim: false,
      build(R, A, T) {
        const stand = new T.Group(); stand.add(A.B(0.6, 0.04, 0.4, A.mat('woodMid'), 0, 0.7, 0), A.B(0.04, 0.7, 0.04, A.mat('woodMid'), 0, 0.35, 0)); const book = A.B(0.4, 0.04, 0.3, A.mat('red'), 0, 0.74, 0); book.rotation.x = -0.3; stand.add(book);
        R.hot('r_book', R.put(stand, 'n', 0, 0.4));
        const hook = A.B(0.12, 0.03, 0.04, A.mat('iron'), 0, 0, 0); R.o.hook = hook; R.hot('r_hook', R.put(new T.Group().add(hook), 'w', 0, 0.04, 1.2));
        const slit = new T.Mesh(new T.PlaneGeometry(1.4, 0.15), new T.MeshBasicMaterial({ color: '#f0d8a0' })); R.put(slit, 'n', 0, 0.01, 1.4);
        R.hot('r_back', R.put(A.door(0.8, 1.6), 's', 0, 0.06));
        R.at(A.candles(1, 0, true), 0.6, 0.72, -0.6);
      },
      update(R, S) { R.o.hook.visible = !S.f.t_key_trap; },
    },
    flies: {
      size: [8, 3, 3], wall: 'wood_attic', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.09, amb: ['#3a3028', '#0a0606', 0.22], yaw: 0, cam: [0, 0.8], trim: false,
      build(R, A, T) {
        const rail = new T.Group(); rail.add(A.B(6, 0.12, 0.2, A.mat('wood'), 0, 1.0, 0)); R.o.ropes = [];
        for (let i = 0; i < 5; i++) { const r = A.C(0.015, 0.015, 2.2, A.mat('cloth'), -2.4 + i * 1.2, 1.1, 0.12, 4); rail.add(r); const bag = A.C(0.12, 0.15, 0.3, new T.MeshStandardMaterial({ color: '#8a7a5a', roughness: 1 }), -2.4 + i * 1.2, 0.3, 0.12, 10); rail.add(bag); R.o.ropes.push(bag); rail.add(A.paperOn(0.25, 0.12, (g, W, H) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; g.font = `700 ${H * 0.6}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText(String(i + 1), W / 2, H * 0.75); }).translateX(-2.4 + i * 1.2).translateY(1.25).translateZ(0.11)); }
        R.hot('f_rail', R.put(rail, 'n', 0, 0.3));
        R.o.glint = A.glow('#c8e0ff', 0.4, 0); R.o.glint.position.set(-2.4, 0.2, -0.6); R.g.add(R.o.glint);
        R.hot('f_ladder', R.put(A.ladder(3), 's', 2.6, 0.3));
        const l = new T.PointLight('#ffc070', 0.8, 6, 2); l.position.set(0, 2.6, 0.5); R.g.add(l);
      },
      update(R, S) { R.o.ropes.forEach((b, i) => (b.position.y = S.f.flies && FLY_ORDER.includes(String(i + 1)) ? 0.9 : 0.3)); R.o.glint.material.opacity = S.f.flies && !S.f.t_key_a ? 0.9 : 0; },
    },
    hall: {
      size: [10, 6, 12], wall: 'damask_red', floor: 'wood_floor', ceil: 'plaster', fog: 0.05, amb: ['#3a2828', '#0a0606', 0.22], yaw: 0, cam: [1.1, 2.2],
      build(R, A, T) {
        const st = screenTex((g, w, h, cfg, lit) => screenDraw(g, w, h, cfg, lit)); R.o.st = st;
        const scr = new T.Mesh(new T.PlaneGeometry(5.5, 3.2), new T.MeshBasicMaterial({ map: st.t })); scr.position.set(0, 2.8, -5.0); R.g.add(scr); R.hot('h_screen', scr);
        const stageBox = A.B(9, 1.0, 2.0, A.mat('wood'), 0, 0.5, -5.0); R.g.add(stageBox);
        R.g.add(curtain(A, T, 1.8, 6).translateX(-3.8).translateZ(-4.2)); R.g.add(curtain(A, T, 1.8, 6).translateX(3.8).translateZ(-4.2));
        for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { if (c === 4 || c === 5) continue; R.at(seat(A, T), -3.2 + c * 0.7, 0, -0.9 + r * 1.0); }
        const pit = new T.Group(); pit.add(A.B(3, 0.9, 0.08, A.mat('wood'), 0, 0.45, 0.6)); const piano = new T.Group(); piano.add(A.B(1.3, 1.1, 0.55, A.mat('black'), 0, 0.55, 0), A.B(1.2, 0.06, 0.3, new T.MeshStandardMaterial({ color: '#e8e4dc' }), 0, 0.75, 0.38)); const pl = A.B(1.3, 0.04, 0.55, A.mat('black'), 0, 1.12, 0); piano.add(pl); R.o.pl = pl; piano.position.x = -0.8; pit.add(piano);
        const ph = A.phonograph(); ph.position.set(1.0, 0.8, 0); pit.add(ph); ph.add(A.B(0.4, 0.8, 0.4, A.mat('woodMid'), 0, -0.4, 0)); R.o.ph = ph;
        R.hot('h_pit', R.at(pit, 0, 0, -3.3));
        R.hot('h_note', R.at(A.paperOn(0.4, 0.26, (g, W, H) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; g.font = `700 ${H * 0.18}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('ОРКЕСТР', W / 2, H * 0.4); }), 1.6, 0.7, -2.68));
        R.hot('h_dw', R.at(new T.Group().add(A.B(1.0, 0.1, 1.0, A.mat('woodMid'), 0, 0, 0)), 3.6, 1.0, -3.7));
        R.hot('h_foyer', R.put(A.door(1.4, 2.6, velvet()), 's', 0, 0.06));
        R.hot('h_booth', R.put(A.door(0.9, 2.0), 'e', 4.5, 0.06));
        R.hot('h_trap', R.put(A.door(0.9, 2.0, A.mat('woodMid')), 'w', -3.0, 0.06));
        const ch = A.chandelier(); ch.position.set(0, 6, 1); R.g.add(ch); R.o.ch = ch;
        R.o.rampa = new T.PointLight('#8ab0ff', 0, 10, 2); R.o.rampa.position.set(0, 1.4, -3.8); R.g.add(R.o.rampa);
      },
      update(R, S) {
        const f = S.f, lit = !!f.lights || !!f.final;
        R.o.st.redraw(f.final ? FINAL_CFG : toHall(parse(f.sh)), lit || !!f.power);
        lightOn(R.o.ch.userData.light, !!f.power, 1.4); R.o.ch.userData.flames.forEach((m) => (m.visible = !!f.power)); lightOn(R.o.rampa, lit, 1.6);
        R.o.pl.rotation.x = f.piano ? -1.0 : 0; R.o.pl.position.z = f.piano ? -0.3 : 0;
      },
      tick(R, G) { if (G.S.f.final) R.o.ph.userData.disc.rotation.y += 0.06; },
    },
    foyer: {
      size: [7, 3.4, 6], wall: 'damask_green', floor: 'wood_floor', ceil: 'plaster', fog: 0.07, amb: ['#3a3a30', '#0a0806', 0.26], yaw: 0, cam: [0, 1.4],
      build(R, A, T) {
        R.hot('o_afisha', R.put(A.painting(1.0, 1.35, (g, W, H) => IMG.afisha(g, W, H)), 'n', -1.6, 0.04, 1.7));
        const cs = new T.Group(); cs.add(A.B(0.9, 0.9, 0.6, A.mat('wood'), 0, 0.45, 0)); const glass = A.B(0.9, 0.7, 0.6, new T.MeshStandardMaterial({ color: '#a8c0c8', transparent: true, opacity: 0.25, roughness: 0.05 }), 0, 1.25, 0); cs.add(glass); R.o.glass = glass;
        const bird = new T.Mesh(new T.ConeGeometry(0.12, 0.4, 4), A.mat('black')); bird.rotation.z = Math.PI / 2; bird.position.set(0, 1.2, 0); cs.add(bird);
        R.hot('o_case', R.put(cs, 'n', 1.4, 0.5));
        const bar = new T.Group(); bar.add(A.B(2.4, 1.0, 0.5, A.mat('wood'), 0, 0.5, 0), A.B(2.5, 0.05, 0.6, A.mat('woodMid'), 0, 1.02, 0)); for (let i = 0; i < 5; i++) bar.add(A.C(0.04, 0.035, 0.12, new T.MeshStandardMaterial({ color: '#a8c8d8', transparent: true, opacity: 0.6 }), -0.8 + i * 0.4, 1.1, 0, 8)); R.put(bar, 'w', 0.6, 0.4);
        R.hot('o_hall', R.put(A.door(1.4, 2.6, velvet()), 'n', 2.6, 0.06));
        R.hot('o_cloak', R.put(A.door(1.0, 2.2), 'e', 0.6, 0.06));
        const ch = A.chandelier(); ch.position.set(0, 3.4, 0); R.g.add(ch); R.o.ch = ch;
        R.at(A.candles(3, 0.15, true), -0.4, 1.05, -2.6);
      },
      update(R, S) { lightOn(R.o.ch.userData.light, !!S.f.power, 1.3); R.o.ch.userData.flames.forEach((m) => (m.visible = !!S.f.power)); R.o.glass.visible = !S.f.case; },
    },
    cloak: {
      size: [5, 3, 4], wall: 'wood_panel', floor: 'wood_floor', ceil: 'plaster', fog: 0.08, amb: ['#3a3028', '#0a0606', 0.24], yaw: 0, cam: [0, 1.0],
      build(R, A, T) {
        const counter = A.B(4.4, 1.0, 0.5, A.mat('wood'), 0, 0.5, 0); R.put(counter, 'n', 0, 1.2);
        const rack = new T.Group(); rack.add(A.B(4.2, 0.06, 0.06, A.mat('brass'), 0, 1.9, 0)); for (let i = 0; i < 8; i++) { const x = -1.8 + i * 0.52; rack.add(A.B(0.02, 0.1, 0.02, A.mat('brass'), x, 1.84, 0)); if (i === 3 || i === 4) rack.add(A.B(0.45, 1.0, 0.18, new T.MeshStandardMaterial({ color: i === 3 ? '#3a3a4a' : '#5a3a2a', roughness: 0.95 }), x, 1.3, 0.05)); rack.add(A.paperOn(0.12, 0.12, (g, W, H) => { g.fillStyle = '#c8a050'; g.beginPath(); g.arc(W / 2, H / 2, W / 2, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; g.font = `700 ${H * 0.45}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText(HOOKS[i], W / 2, H * 0.66); }).translateX(x).translateY(2.0).translateZ(0.04)); }
        R.hot('k_rack', R.put(rack, 'n', 0, 0.3));
        R.hot('k_back', R.put(A.door(1.0, 2.2), 's', 0, 0.06));
        R.at(A.candles(1, 0, true), 1.6, 1.0, -0.9);
      },
    },
    booth: {
      size: [3.4, 2.6, 3], wall: 'metal_plate', floor: 'concrete', ceil: 'concrete', fog: 0.08, amb: ['#2a2a30', '#060606', 0.2], yaw: 0, cam: [0, 0.6], trim: false,
      build(R, A, T) {
        const con = new T.Group(); con.add(A.B(2.0, 0.9, 0.6, A.mat('iron'), 0, 0.45, 0)); R.o.knobs = []; for (let i = 0; i < 4; i++) { const k = A.C(0.06, 0.06, 0.05, A.mat('black'), -0.6 + i * 0.4, 0.92, 0.1, 12); con.add(k); const lamp = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ color: '#202020' })); lamp.position.set(-0.6 + i * 0.4, 0.95, -0.15); con.add(lamp); R.o.knobs.push(lamp); }
        R.hot('b_console', R.put(con, 'n', 0.3, 0.5));
        const win = new T.Mesh(new T.PlaneGeometry(1.4, 0.5), new T.MeshBasicMaterial({ color: '#2a1a14' })); R.put(win, 'n', 0.3, 0.01, 1.5);
        const br = new T.Group(); br.add(A.B(0.4, 0.6, 0.15, A.mat('iron'), 0, 0, 0)); const hd = A.B(0.05, 0.3, 0.05, new T.MeshStandardMaterial({ color: '#c83030' }), 0, 0.05, 0.1); br.add(hd); R.o.hd = hd;
        R.hot('b_breaker', R.put(br, 'w', -0.4, 0.08, 1.3));
        const proj = new T.Group(); proj.add(A.B(0.5, 0.5, 0.8, A.mat('black'), 0, 0.25, 0), A.C(0.1, 0.1, 0.2, A.mat('brass'), 0, 0.3, -0.5, 12)); proj.children[1].rotation.x = Math.PI / 2; R.put(proj, 'e', -0.6, 0.6, 0.9);
        R.hot('b_back', R.put(A.door(0.9, 2.0), 's', 0, 0.06));
        R.o.b = A.bulb(); R.at(R.o.b, 0, 2.6, 0.4);
      },
      update(R, S) { bulbSet(R.o.b, !!S.f.power, 0.9); R.o.hd.rotation.x = S.f.power ? 0.9 : -0.6; const cols = { 'белый': '#ffffff', 'синий': '#4a7aff', 'красный': '#ff3a3a', 'янтарный': '#ffb040' }; LIGHTS.split(',').forEach((c, i) => R.o.knobs[i].material.color.set(S.f.lights ? cols[c] : S.f.power ? '#403020' : '#202020')); },
    },
    trap: {
      size: [6, 2.2, 6], wall: 'bricks', floor: 'concrete', ceil: 'wood_attic', fog: 0.1, amb: ['#2a2420', '#060404', 0.16], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        for (let i = 0; i < 5; i++) R.at(A.B(0.2, 0.2, 6, A.mat('wood'), 0, 2.1, 0), -2.4 + i * 1.2, 0, 0);
        const lift = new T.Group(); lift.add(A.B(1.2, 0.06, 1.2, A.mat('woodMid'), 0, 0.03, 0)); for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) lift.add(A.B(0.06, 2.2, 0.06, A.mat('iron'), x, 1.1, z)); R.at(lift, 1.8, 0, -1.6);
        const trunk = A.chest(); R.hot('t_trunk', R.put(trunk, 'w', 0.6, 0.45));
        R.hot('t_log', R.put(A.paperOn(0.4, 0.3, (g, W, H) => { g.fillStyle = '#d4cab2'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; for (let i = 0; i < 8; i++) g.fillRect(W * 0.08, H * (0.12 + i * 0.1), W * 0.8, 2); }), 'n', -1.2, 0.02, 1.4));
        for (let i = 0; i < 4; i++) { const w = A.C(0.4, 0.4, 0.1, A.mat('iron'), 0, 0, 0, 16); w.rotation.z = Math.PI / 2; R.at(new T.Group().add(w), -2.4, 0.6 + i * 0.3, 1.5 - i * 0.2); }
        R.hot('t_back', R.put(A.door(0.9, 2.0), 's', -1.6, 0.06));
        R.at(A.candles(2, 0.1, true), 0.4, 0, -2.4);
      },
    },
    finale: {
      size: [10, 6, 10], wall: 'damask_red', floor: 'wood_floor', ceil: 'plaster', fog: 0.03, amb: ['#c8a888', '#2a1a14', 0.8], yaw: 0, cam: [0, 3],
      build(R, A, T) {
        const st = screenTex((g, w, h) => screenDraw(g, w, h, FINAL_CFG, true)); st.redraw();
        const scr = new T.Mesh(new T.PlaneGeometry(6, 3.5), new T.MeshBasicMaterial({ map: st.t })); scr.position.set(0, 3, -4.8); R.g.add(scr);
        R.hot('q_any', scr);
        const l = new T.PointLight('#ffe0b0', 2, 12, 2); l.position.set(0, 3, -2); R.g.add(l);
      },
    },
  };

  // ================= Точки интереса =================
  function hot(G, { use, bindUse, P }) {
    const seqPanel = (t, desc, items, key, act, n) => () => {
      const p = G.ps; p.seq = p.seq || [];
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${items.map((it) => `<button data-s="${it.id}" class="${p.seq.includes(it.id) ? 'sel' : ''}">${it.l}</button>`).join('')}</div><p class="hs-cap">Выбрано: ${p.seq.length} из ${n}</p><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => { el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.s)) return; p.seq.push(b.dataset.s); G.snd(key); if (p.seq.length === n) G.act(act, p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } };
    };
    const screenPanel = (title, cfg, lit, txt) => ({ t: title, html: `<canvas class="hs-scr" width="512" height="300" style="width:100%;border-radius:6px;display:block;margin-bottom:10px"></canvas><p class="hs-txt">${txt}</p>`, bind: (el) => screenDraw($('.hs-scr', el).getContext('2d'), 512, 300, cfg, lit) });
    return {
      // ---------- Сцена ----------
      p_tickets: (o) => G.doc('tickets', o),
      p_screen: (o, S, f) => G.say('Экран', f.shadow ? 'Тени застыли в последней сцене. С этой стороны полотна видны только их бледные отражения.' : 'Белое полотно во всю сцену. С этой стороны тени видны бледно и наоборот — по-настоящему их видно только из зала.'),
      p_rack: (o, S, f) => P(() => ({ t: 'Стойка для кукол', html: f.workshop ? `<p class="hs-txt">Пустая стойка с крючками для тростей. Куклы — в мастерской.</p>` : '<p class="hs-txt">Пустая стойка для кукол. Подписи на крючках: «Он», «Она», «Птица». Самих кукол нет.</p>' }), o),
      p_lantern: (o, S, f) => {
        if (!f.shadow) {
          if (!G.has('puppets')) return G.say('Волшебный фонарь', 'Проекционный фонарь за экраном. Он отбрасывает тени кукол на полотно. Линзы нет — горит только рабочая лампа. Куклы держат перед ним на тростях.');
          return P(() => {
            const p = G.ps; p.cfg = p.cfg || { on: ['C', '>'], ona: ['L', '>'], bird: ['R', '<'] };
            const row = (pp) => `<div class="hs-srow" style="display:flex;gap:6px;justify-content:center;align-items:center;margin-bottom:6px"><b style="min-width:70px">${pp.n}</b><button class="hs-btn ghost small" data-pos="${pp.id}">${POS_N[p.cfg[pp.id][0]]}</button><button class="hs-btn ghost small" data-face="${pp.id}">${FACE_N[p.cfg[pp.id][1]]}</button></div>`;
            return { t: 'Куклы перед фонарём', html: `<p class="hs-txt">Ты стоишь за экраном. Расставь кукол перед фонарём и покажи тени залу. Как это выглядит из зала — знает только тот, кто там.</p>${PUPPETS.map(row).join('')}<button class="hs-btn" id="hsShow">Показать тени</button>`,
              bind: (el) => { el.querySelectorAll('[data-pos]').forEach((b) => (b.onclick = () => { const c = p.cfg[b.dataset.pos]; c[0] = POS[(POS.indexOf(c[0]) + 1) % 3]; G.snd('tick2'); G.renderPanel(); })); el.querySelectorAll('[data-face]').forEach((b) => (b.onclick = () => { const c = p.cfg[b.dataset.face]; c[1] = c[1] === '<' ? '>' : '<'; G.snd('tick2'); G.renderPanel(); })); $('#hsShow', el).onclick = () => { const used = new Set(PUPPETS.map((pp) => p.cfg[pp.id][0])); if (used.size < 3) return G.toast('Две куклы на одном месте — тени сольются. Разведи их.'); G.act('shadow', enc(p.cfg)); }; } };
          }, o);
        }
        P(() => G.finalPanel(), o);
      },
      p_trap: (o) => P(() => G.dwPanel(), o),
      p_dressing: (o, S, f) => { if (f.dressing) return G.go('dressing'); P(() => { const sp = G.wheelsPanel({ t: 'Гримёрка Ольги', desc: 'Замок с четырьмя колёсиками: день и месяц.', n: 4, chars: '0123456789', act: 'dressing', top: ['день', 'день', 'мес', 'мес'] }); sp.html = '<button class="hs-btn ghost" data-doc="dresslock">Надпись на двери</button>' + sp.html; return sp; }, o); },
      p_workshop: (o, S, f) => { if (f.workshop) return G.go('workshop'); P(() => ({ t: 'Мастерская кукол', html: `<p class="hs-txt">Дверь с табличкой «Я. Лурье. Не входить!». Заперто.</p>${use('key_workshop', 'Отпереть ключом с красной ниткой', 'unlock', 'workshop')}`, bind: bindUse }), o); },
      p_prompter: (o, S, f) => (f.shadow ? G.go('prompter') : G.say('Суфлёрская будка', 'Крышка суфлёрской будки на краю сцены. Заперта изнутри механизмом — как будто ждёт чего-то. Может, нужной сцены?')),
      p_ladder: (o, S, f) => (f.lights ? G.go('flies') : G.say('Лестница на колосники', 'Узкая лестница уходит под потолок сцены, в полную темноту. Без света наверх лезть страшно — колосники держатся на честном слове.')),
      // ---------- Гримёрка ----------
      d_door: () => G.go('stage'),
      d_mirror: (o) => G.doc('mirror', o),
      d_note: (o) => G.doc('letter', o),
      d_dress: (o) => G.say('Платье', 'Платье на манекене — запасное, для премьеры. На подоле пришита бирка: «О. Л. — финал».'),
      // ---------- Мастерская ----------
      w_door: () => G.go('stage'),
      w_bench: (o) => G.say('Верстак', 'Ножницы, картон, клей, тонкие трости. Недоделанная кукла: девушка с поднятой рукой, как будто машет кому-то.'),
      w_rack: (o) => P(() => ({ t: 'Куклы на стойке', html: `<p class="hs-txt">Три куклы из чёрного картона на тростях — главные герои «Двоих».</p>${G.takeHtml(['puppets']) || '<p class="hs-cap">Стойка пуста.</p>'}` }), o),
      w_music: (o) => G.doc('music', o),
      w_diary: (o) => G.doc('diary', o),
      // ---------- Суфлёрская ----------
      r_back: () => G.go('stage'),
      r_book: (o) => G.doc('cue', o),
      r_hook: (o) => P(() => ({ t: 'Крючок', html: `<p class="hs-txt">На гвоздике у двери будки висит ключ.</p>${G.takeHtml(['key_trap']) || '<p class="hs-cap">Пусто.</p>'}` }), o),
      // ---------- Колосники ----------
      f_ladder: () => G.go('stage'),
      f_rail: (o, S, f) => {
        if (f.flies) return P(() => ({ t: 'Штанкеты', html: `<p class="hs-txt">Три декорации подняты. На настиле, где висело «Небо», лежит линза в латунной оправе.</p>${G.takeHtml(['key_a']) || '<p class="hs-cap">Тросы натянуты.</p>'}` }), o);
        P(seqPanel('Штанкеты', 'Пять тросов с мешками-противовесами. Каждый поднимает свою декорацию. Поднимать — по одному, в нужном порядке.', FLY, 'rope', 'flies', 3), o);
      },
      // ---------- Зал ----------
      h_screen: (o, S, f) => P(() => screenPanel('Экран', f.final ? null : toHall(parse(f.sh)), !!f.power || !!f.lights, f.shadow ? 'Тени встали точно как на афише финала. Экран будто вздохнул — а на сцене щёлкнул замок суфлёрской будки.' : f.sh ? 'Так тени выглядят из зала. Сравни с афишей финала в фойе — и подскажи, что переставить.' : 'Белый экран. Пока на нём ничего нет — за экраном не расставили кукол.'), o),
      h_pit: (o, S, f) => {
        if (f.piano) return P(() => ({ t: 'Оркестровая яма', html: `<p class="hs-txt">Крышка пианино поднята. Внутри, на струнах, лежала пластинка.</p>${G.takeHtml(['key_b']) || ''}<button class="hs-btn" id="hsGram">К граммофону</button>`, bind: (el) => ($('#hsGram', el).onclick = () => G.openPanel(() => G.finalPanel(), o)) }), o);
        if (!f.trap) return G.say('Оркестровая яма', 'Пианино и граммофон. Крышка пианино заперта на ключик, которого нет… Нет, не заперта — она поднимется, если сыграть. Только что играть? И зачем — пока непонятно.');
        P(() => { const p = G.ps; p.seq = p.seq || [];
          return { t: 'Пианино', html: `<p class="hs-txt">Старое пианино «Красный Октябрь». Сыграй мелодию — крышка откроется, если она правильная.</p><div class="hs-mline">${p.seq.join(' ') || '…'}</div><div class="hs-dolls">${NOTES.map(([n]) => `<button data-n="${n}">${n}</button>`).join('')}</div><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
            bind: (el) => { el.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => { const nn = b.dataset.n; p.seq.push(nn); G.note(NOTES.find((x) => x[0] === nn)[1], 'bell', 1.2); if (p.seq.length === MELODY.length) G.act('piano', p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } }; }, o);
      },
      h_note: (o) => G.doc('hallnote', o),
      h_dw: (o) => P(() => G.dwPanel(), o),
      h_foyer: () => G.go('foyer'),
      h_booth: (o, S, f) => { if (f.booth) return G.go('booth'); P(() => ({ t: 'Осветительная', html: `<p class="hs-txt">Узкая дверь в стене: «Осветительная. Посторонним вход воспрещён».</p>${use('key_booth', 'Отпереть ключом', 'unlock', 'booth')}`, bind: bindUse }), o); },
      h_trap: (o, S, f) => { if (f.trap) return G.go('trap'); P(() => ({ t: 'Дверь в трюм', html: `<p class="hs-txt">Низкая дверь под сценой: «Трюм».</p>${use('key_trap', 'Отпереть ключом', 'unlock', 'trap')}`, bind: bindUse }), o); },
      // ---------- Фойе ----------
      o_hall: () => G.go('hall'),
      o_cloak: () => G.go('cloak'),
      o_afisha: (o) => G.doc('afisha', o),
      o_case: (o, S, f) => {
        if (f.case) return P(() => ({ t: 'Витрина', html: `<p class="hs-txt">Витрина открыта. Под картонной Птицей — ключ с красной ниткой.</p>${G.takeHtml(['key_workshop']) || '<p class="hs-cap">Пусто.</p>'}` }), o);
        P(() => G.wheelsPanel({ t: 'Витрина с Птицей', desc: 'Стеклянная витрина: картонная кукла-Птица. Замок с тремя колёсиками.', n: 3, chars: '0123456789', act: 'case' }), o);
      },
      // ---------- Гардероб ----------
      k_back: () => G.go('foyer'),
      k_rack: (o, S, f) => P(() => {
        if (f.cloak) return { t: 'Вешалка', html: `<p class="hs-txt">Два пальто — мужское и женское, 1958 года, ещё влажные от снега.</p>${G.takeHtml(['key_booth']) || '<p class="hs-cap">Карманы пусты.</p>'}` };
        const p = G.ps; p.on = p.on || {};
        return { t: 'Вешалка гардероба', html: '<p class="hs-txt">Латунные номерки над крючками. Почти все пусты — кроме двух. Чьи это пальто? Сними номерки с ваших мест.</p><div class="hs-dolls">' + HOOKS.map((h) => `<button data-j="${h}" class="${p.on[h] ? 'sel' : ''}">№ ${h}</button>`).join('') + '</div><button class="hs-btn" id="hsGo">Снять номерки</button>',
          bind: (el) => { el.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => { p.on[b.dataset.j] = !p.on[b.dataset.j]; G.snd('click'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('cloak', HOOKS.filter((h) => p.on[h]).join()); } };
      }, o),
      // ---------- Осветительная ----------
      b_back: () => G.go('hall'),
      b_breaker: (o, S, f) => P(() => f.power ? { t: 'Рубильник', html: '<p class="hs-txt">Рубильник поднят. В зале — дежурный свет.</p>' } : { t: 'Рубильник', html: '<p class="hs-txt">Главный рубильник театра.</p><button class="hs-btn" data-use="power">Поднять рубильник</button>', bind: bindUse }, o),
      b_console: (o, S, f) => {
        if (f.lights) return G.say('Пульт', 'Свет финала выставлен. Сцена залита синим, контровой — красный, фонарь за экраном — белый.');
        if (!f.power) return G.say('Пульт', 'Осветительный пульт. Без тока — мёртв.');
        P(() => { const p = G.ps; p.c = p.c || [0, 0, 0, 0];
          return { t: 'Осветительный пульт', html: `<p class="hs-txt">Четыре прибора, у каждого — светофильтр. Выставь свет финала.</p><div class="hs-dolls">${LIGHT_CH.map((l, i) => `<button data-c="${i}">${l}: <b>${LIGHT_COL[p.c[i]]}</b></button>`).join('')}</div><button class="hs-btn" id="hsGo">Дать свет</button>`,
            bind: (el) => { el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { const i = +b.dataset.c; p.c[i] = (p.c[i] + 1) % LIGHT_COL.length; G.snd('tick2'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('lights', p.c.map((ci) => LIGHT_COL[ci]).join()); } }; }, o);
      },
      // ---------- Трюм ----------
      t_back: () => G.go('hall'),
      t_log: (o) => G.doc('stagelog', o),
      t_trunk: (o) => G.doc('trunk', o),
      q_any: () => G.say('Финал', 'Тени встретились.'),
    };
  }

  StoryEngine.define({
    id: 'theatre', title: 'Театр теней', icon: '🎭', color: '#c85a5a',
    tagline: 'Детектив-кошмар: театр, где доигрывают премьеру 1958 года',
    infoDefault: 'новая история · 3D',
    roles: [
      { id: 'up', name: 'За экраном', icon: '🕯️', desc: 'Ты за кулисами: сцена за экраном, гримёрка, мастерская кукол, суфлёрская, колосники.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'В зале', icon: '🔦', desc: 'Ты в зрительном зале: зал, фойе, гардероб, осветительная, трюм под сценой.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Шестая мрачная история: 5 глав, 11 комнат, около 20 загадок. 1,5 часа. Лучше в наушниках.',
      'Вы по разные стороны экрана. Тени, которые делает один, видит только другой — и зеркально.',
      'Предметы поднимает подъёмный трап из оркестровой ямы на сцену — когда в театре дадут ток.',
      'Прогресс сохраняется. Застряли — кнопка 💡.',
    ],
    sub: 'детектив-кошмар для двоих · 5 глав',
    warn: 'Наденьте наушники. Говорите обо всём, что видите: часть ответа всегда у другого.',
    roleLabel: { up: '🕯️ Ты — <b>за экраном</b>', down: '🔦 Ты — <b>в зале</b>' },
    enterLabel: 'Войти в театр', menuArt: 'street', endArt: 'bow', endSub: 'доиграли «Двоих»', finalRoom: 'finale', introSound: { 2: 'sting' },
    chapters: CH, ITEMS, DOCS, IMG, ACT, HINTS, TAKE, chapterOf, drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART, hot,
    dw: {
      name: 'Подъёмный трап', cabin: 'Площадка', empty: 'площадка пуста', putIn: 'Положить на площадку:', called: 'Трап с гулом подъехал к вам.', call: 'Вызвать трап', send: { up: 'в зал ↓', down: 'на сцену ↑' },
      room: { up: 'stage', down: 'hall' }, need: 'power',
      broken: { up: 'Люк подъёмного трапа в полу сцены. Мотор не работает — в театре нет тока.', down: 'Подъёмный трап у оркестровой ямы. Без тока не сдвинется — рубильник в осветительной.' },
    },
    final: {
      title: 'Финал «Двоих»', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Волшебный фонарь за экраном. Линза встанет — и тени снова оживут. Но финал случится, только если в ту же секунду в зале заиграет музыка.', down: 'Граммофон в оркестровой яме. Пластинка встанет — и зазвучит финал. Но он случится, только если в ту же секунду за экраном вспыхнет фонарь.' },
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'power': G.snd('power'); G.toast('Щёлкнул рубильник — в зале зажглась люстра, на сцене — дежурный свет. Загудел мотор трапа.', 4000); break;
        case 'shtry': G.snd('book'); if (me) G.toast('Тени легли на экран. Как они выглядят — видно только из зала.', 2600); else G.toast('На экране зашевелились тени.', 2000); break;
        case 'shadow': G.snd('sting2'); G.toast(me ? 'Где-то у края сцены щёлкнул замок суфлёрской будки.' : 'Тени на экране встали точно как на афише. И на миг между ними мелькнула ещё одна — женская.', 5000); break;
        case 'lights': G.snd('power'); G.toast('Свет финала: сцена залита синим, по краю экрана — красная полоса. Наверху, над сценой, проступили колосники.', 4500); break;
        case 'piano': G.snd('chime'); G.toast(me ? 'Последняя нота — и крышка пианино сама поднялась.' : 'Из зала донеслась мелодия на пианино. Колыбельная.', 4000); break;
      }
    },
  });
})();
