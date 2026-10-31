'use strict';
// «Последний поезд» — ночной поезд № 217 Ленинград — Воркута, ноябрь 1958. Состав расцеплен в тоннеле:
// один — в голове (купе, коридор, ресторан, почтовый вагон, кабина), другой — в хвосте (плацкарт, служебка, багажный, кочегарка, хвостовой).
// Предметы — корзиной на тросе над разрывом.
(() => {
  const HA = window.HouseArt;
  const ROUTE = ['Котлас', 'Микунь', 'Ухта', 'Печора', 'Инта'];
  const ROUTE_SHOW = ['Печора', 'Котлас', 'Инта', 'Микунь', 'Ухта'];
  const TIMES = { 'Котлас': '21:40', 'Микунь': '01:15', 'Ухта': '03:30', 'Печора': '07:05', 'Инта': '10:50' };
  const TOGGLES = [{ id: 'tam', l: 'Тамбур' }, { id: 'kup', l: 'Купе' }, { id: 'kor', l: 'Коридор' }, { id: 'tit', l: 'Титан' }, { id: 'wc', l: 'Туалет' }, { id: 'av', l: 'Аварийн.' }];
  const NIGHT = 'tam,kor,av';
  const WIRE_COL = [{ id: 'r', l: 'красный', c: '#c83030' }, { id: 'y', l: 'жёлтый', c: '#d8b030' }, { id: 'b', l: 'синий', c: '#3060c8' }, { id: 'g', l: 'зелёный', c: '#30a050' }];
  const WIRES = 'r,y,b,g';
  const WHISTLE = 'К,Д,Д,Д';
  const PUNCH = [1, 0, 1, 0, 1, 0, 1, 1, 0];
  const BERTHS = ['9', '12', '14', '18', '22', '27', '31', '36'];
  const BERTH_SET = '9,14,22,36';

  const ROOM_NAME = { compartment: 'Купе № 7', corridor: 'Коридор 3-го вагона', restaurant: 'Вагон-ресторан', mail: 'Почтовый вагон', cab: 'Кабина паровоза', sleeper: 'Плацкарт, 8-й вагон', service: 'Служебное купе', luggage: 'Багажный вагон', coal: 'Кочегарка', tail: 'Хвостовой вагон', exit: 'Выход из тоннеля' };
  const AREA = { up: ['compartment', 'corridor', 'restaurant', 'mail', 'cab'], down: ['sleeper', 'service', 'luggage', 'coal', 'tail'] };
  const OPEN = { compartment: () => true, corridor: () => true, restaurant: () => true, mail: (S) => S.f.mail, cab: (S) => S.f.cab, sleeper: () => true, service: (S) => S.f.service, luggage: (S) => S.f.luggage, coal: (S) => S.f.coal, tail: (S) => S.f.whistle };
  const CH = ['', 'Глава I. Тоннель', 'Глава II. Голос машиниста', 'Глава III. Почта 1958 года', 'Глава IV. Проводница', 'Глава V. Сцепка'];

  const INTRO = [
    ['station', 'Разъезд «101-й километр». Ночь, ноябрь. Расписания на станции нет уже много лет — а поезд всё равно пришёл: тёмно-зелёный, с запотевшими окнами.'],
    ['ticket', 'Билеты вам прислали по почте, без обратного адреса. Поезд № 217, Ленинград — Воркута. Дата отправления — 14 ноября 1958 года. Проводница пробила их компостером, не сказав ни слова.'],
    ['tunnel', 'Поезд вошёл в тоннель под хребтом и встал. Лязгнула сцепка. Погас свет. Когда глаза привыкли к темноте, пассажиров в вагонах уже не было — только тёплый чай в подстаканниках.'],
    ['split', 'Состав расцеплен. {up} — в головной части, у паровоза. {down} — в хвосте, за трёхметровым провалом между вагонами. Слышно друг друга только через разрыв. Выбраться можно только вместе — и только всем поездом.'],
  ];
  const OUTRO = [
    ['exit', 'Буфера сошлись с тяжёлым стуком. Паровоз выдохнул пар, тормоза отпустили — и поезд № 217 медленно, вагон за вагоном, двинулся к выходу из тоннеля.'],
    ['exit', 'В окнах вагонов снова зажёгся свет. В плацкарте на местах 9, 14, 22 и 36 кто-то сидел — четыре тени, с чемоданами на коленях. Тени улыбались.'],
    ['platform', 'На рассвете поезд остановился у пустой платформы с надписью «Инта». Двери открылись. Из вагонов вышли люди в пальто 1958 года — и растаяли в утреннем свете, один за другим.'],
    ['platform', 'Последней вышла проводница. Она встала рядом с машинистом, взяла его под руку и обернулась к вам. «Спасибо, что не уехали без нас».'],
    ['end', ''],
  ];

  // ================= Предметы =================
  const ITEMS = {
    block: { n: 'Блок с крюком', d: 'Чугунный блок-ролик с крюком. Через него можно пустить трос.' },
    tri_key: { n: 'Трёхгранка', d: 'Трёхгранный ключ проводника. Открывает служебные двери любого вагона.' },
    rope: { n: 'Бухта троса', d: 'Стальной трос в бухте, с карабином на конце.' },
    matches: { n: 'Спички', d: 'Коробок «Балабановских» спичек. Сухие.' },
    key_mail: { n: 'Ключ почтового вагона', d: 'Ключ с сургучной пломбой «Почта СССР».' },
    crowbar: { n: 'Лом', d: 'Короткий ломик с изогнутым концом. Таким разжимают сцепку.' },
    key_coal: { n: 'Ключ кочегарки', d: 'Закопчённый ключ с биркой «Котельн. 8».' },
    coal: { n: 'Уголь', d: 'Ведро угля. Руки сразу стали чёрными.' },
    key_a: { n: 'Рукоять реверса', d: 'Съёмная рукоятка реверса паровоза. Без неё машина не тронется.' },
    key_b: { n: 'Ключ тормоза', d: 'Ключ от хвостового тормозного крана. Без него тормоза не отпустить.' },
  };
  const TAKE = {
    block: (S) => S.f.service, tri_key: (S) => S.f.service, rope: () => true, matches: () => true, key_mail: (S) => S.f.register,
    crowbar: (S) => S.f.luggage, key_coal: (S) => S.f.sort, coal: (S) => S.f.coal, key_a: (S) => S.f.dbox, key_b: (S) => S.f.berths,
  };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const metal = (a, b) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const iron = metal('#a8a8b0', '#2a2a30'), brass = metal('#f0d890', '#5a4214');
    switch (id) {
      case 'block': g.fillStyle = iron; g.beginPath(); g.arc(s / 2, s * 0.45, s * 0.24, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s / 2, s * 0.45, s * 0.08, 0, TAU); g.fill(); g.strokeStyle = iron; g.lineWidth = s * 0.07; g.beginPath(); g.arc(s / 2, s * 0.82, s * 0.1, Math.PI, 0, true); g.stroke(); break;
      case 'tri_key': g.fillStyle = brass; g.fillRect(s * 0.44, s * 0.2, s * 0.12, s * 0.62); g.beginPath(); g.moveTo(s * 0.5, s * 0.08); g.lineTo(s * 0.62, s * 0.28); g.lineTo(s * 0.38, s * 0.28); g.fill(); g.fillRect(s * 0.25, s * 0.72, s * 0.5, s * 0.1); break;
      case 'rope': g.strokeStyle = '#9a9aa0'; g.lineWidth = s * 0.05; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(s / 2, s / 2, s * (0.32 - i * 0.05), s * (0.22 - i * 0.03), 0, 0, TAU); g.stroke(); } g.fillStyle = brass; g.fillRect(s * 0.78, s * 0.42, s * 0.1, s * 0.16); break;
      case 'matches': g.fillStyle = '#c8a050'; g.fillRect(s * 0.2, s * 0.3, s * 0.6, s * 0.4); g.fillStyle = '#5a2a1a'; g.fillRect(s * 0.2, s * 0.3, s * 0.6, s * 0.08); g.fillStyle = '#2a1a10'; g.font = `700 ${s * 0.12}px sans-serif`; g.textAlign = 'center'; g.fillText('СПИЧКИ', s / 2, s * 0.58); break;
      case 'key_mail': case 'key_coal': case 'key_a': case 'key_b': {
        const c = id === 'key_coal' ? metal('#5a5a5a', '#101010') : id === 'key_mail' ? brass : iron;
        if (id === 'key_a') { g.strokeStyle = iron; g.lineWidth = s * 0.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.2, s * 0.8); g.lineTo(s * 0.6, s * 0.35); g.stroke(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(s * 0.68, s * 0.28, s * 0.13, 0, TAU); g.fill(); break; }
        g.fillStyle = c; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill(); g.fillStyle = '#16120e'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill();
        g.fillStyle = c; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12);
        if (id === 'key_mail') { g.fillStyle = '#a82020'; g.beginPath(); g.arc(s * 0.2, s * 0.24, s * 0.09, 0, TAU); g.fill(); }
        if (id === 'key_b') { g.fillStyle = '#c83030'; g.fillRect(s * 0.82, s * 0.4, s * 0.1, s * 0.2); }
        break;
      }
      case 'crowbar': g.strokeStyle = metal('#8a5a5a', '#2a1010'); g.lineWidth = s * 0.08; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.25, s * 0.85); g.lineTo(s * 0.7, s * 0.2); g.quadraticCurveTo(s * 0.78, s * 0.1, s * 0.86, s * 0.2); g.stroke(); break;
      case 'coal': g.fillStyle = '#5a5a60'; g.beginPath(); g.moveTo(s * 0.2, s * 0.4); g.lineTo(s * 0.8, s * 0.4); g.lineTo(s * 0.7, s * 0.85); g.lineTo(s * 0.3, s * 0.85); g.fill(); g.fillStyle = '#141416'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(s * (0.3 + (i % 3) * 0.2), s * (0.36 - Math.floor(i / 3) * 0.08), s * 0.09, 0, TAU); g.fill(); } break;
    }
  }

  // ================= Иллюстрации =================
  const paper = (g, w, h, c = '#d8ccb0') => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,20,0.06)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * w * 0.06, 0, TAU); g.fill(); } };
  const IMG = {
    ticket: (g, w, h) => {
      g.fillStyle = '#1a1612'; g.fillRect(0, 0, w, h);
      const tk = (x, y, seat) => {
        g.fillStyle = '#c8b88a'; g.fillRect(x, y, w * 0.44, h * 0.8);
        g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `700 ${h * 0.055}px 'PT Mono', monospace`; g.fillText('МПС СССР · БИЛЕТ', x + w * 0.22, y + h * 0.1);
        g.font = `${h * 0.05}px 'PT Mono', monospace`;
        ['Поезд № 217', 'Ленинград — Воркута', 'Вагон 3   Место ' + seat, 'Отпр. 14.11.1958', 'Цена 187 р. 40 к.'].forEach((l, i) => g.fillText(l, x + w * 0.22, y + h * (0.2 + i * 0.08)));
        const cs = w * 0.05;
        for (let i = 0; i < 9; i++) { const px = x + w * 0.22 - cs * 1.2 + (i % 3) * cs * 1.2, py = y + h * 0.6 + Math.floor(i / 3) * cs * 1.2; g.fillStyle = PUNCH[i] ? '#1a1612' : 'rgba(42,30,20,0.15)'; g.beginPath(); g.arc(px, py, cs * 0.32, 0, TAU); g.fill(); }
      };
      tk(w * 0.04, h * 0.1, 7); tk(w * 0.52, h * 0.1, 8);
    },
    menu: (g, w, h) => {
      paper(g, w, h, '#e0d4b8');
      g.fillStyle = '#5a1a1a'; g.textAlign = 'center'; g.font = `700 ${h * 0.08}px 'Cormorant Garamond', serif`; g.fillText('ВАГОН-РЕСТОРАН', w / 2, h * 0.12);
      g.font = `italic ${h * 0.05}px 'Cormorant Garamond', serif`; g.fillText('Меню на 14 ноября 1958 г.', w / 2, h * 0.2);
      g.fillStyle = '#2a1e14'; g.font = `${h * 0.055}px 'PT Mono', monospace`; g.textAlign = 'left';
      [['Борщ флотский', '48'], ['Котлета с пюре', '65'], ['Пирожок с капустой', '22'], ['Чай с лимоном', '15'], ['Компот', '12'], ['Хлеб, 2 куска', '4']].forEach(([n, p], i) => { g.fillText(n, w * 0.1, h * (0.34 + i * 0.1)); g.textAlign = 'right'; g.fillText(p + ' к.', w * 0.9, h * (0.34 + i * 0.1)); g.textAlign = 'left'; });
    },
    timetable: (g, w, h) => {
      paper(g, w, h, '#d0c8a8');
      g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `700 ${h * 0.065}px 'PT Mono', monospace`; g.fillText('РАСПИСАНИЕ ПОЕЗДА № 217', w / 2, h * 0.1);
      g.font = `${h * 0.05}px 'PT Mono', monospace`; g.textAlign = 'left';
      g.fillText('Станция', w * 0.1, h * 0.2); g.fillText('Прибытие', w * 0.62, h * 0.2);
      g.fillRect(w * 0.08, h * 0.22, w * 0.84, 2);
      const rows = [['Ленинград', 'отпр. 09:20'], ['Вологда', '17:05']].concat(ROUTE.map((s) => [s, TIMES[s]])).concat([['Воркута', '19:30']]);
      rows.forEach(([s, t], i) => { g.fillText(s, w * 0.1, h * (0.3 + i * 0.08)); g.fillText(t, w * 0.62, h * (0.3 + i * 0.08)); });
      g.font = `italic ${h * 0.045}px 'Cormorant Garamond', serif`; g.fillText('Тоннель под хребтом — между Ухтой и Печорой.', w * 0.1, h * 0.96);
    },
    scheme: (g, w, h) => {
      g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(60,90,140,0.25)'; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.fillStyle = '#1a2a4a'; g.textAlign = 'center'; g.font = `700 ${h * 0.065}px 'PT Mono', monospace`; g.fillText('АВАРИЙНОЕ ПИТАНИЕ РАЦИИ', w / 2, h * 0.11);
      g.strokeStyle = '#1a2a4a'; g.lineWidth = 3; g.strokeRect(w * 0.1, h * 0.3, w * 0.3, h * 0.45); g.font = `${h * 0.05}px 'PT Mono', monospace`; g.fillText('БАТАРЕЯ', w * 0.25, h * 0.55);
      WIRES.split(',').forEach((c, i) => { const y = h * (0.35 + i * 0.11), col = WIRE_COL.find((x) => x.id === c); g.strokeStyle = col.c; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.4, y); g.bezierCurveTo(w * 0.55, y, w * 0.55, y, w * 0.7, y); g.stroke(); g.fillStyle = '#1a2a4a'; g.textAlign = 'left'; g.fillText(`клемма ${i + 1} — ${col.l}`, w * 0.72, y + 6); });
      g.textAlign = 'center'; g.fillText('Перепутаешь — сгорит предохранитель.', w / 2, h * 0.92);
    },
    window: (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3440'); gr.addColorStop(1, '#0a0e14'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(220,230,240,0.35)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      g.fillStyle = 'rgba(10,14,20,0.9)'; g.font = `${h * 0.12}px 'Marck Script', cursive`; g.textAlign = 'center';
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillText('9 · 14 · 22 · 36', w / 2, h * 0.42); g.font = `${h * 0.08}px 'Marck Script', cursive`; g.fillText('не уезжайте без них', w / 2, h * 0.62); g.restore();
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    },
  };

  // ================= Документы =================
  const DOCS = {
    ticket: { t: 'Ваши билеты', k: 'img', img: 'ticket', ratio: 0.55, cap: 'Пробиты компостером проводницы: на каждом — один и тот же узор дырочек.' },
    paper58: { t: 'Газета на столике', k: 'paper', text: '«ПРАВДА», 14 ноября 1958 года.\n\n«Северная магистраль: пассажирские поезда пойдут до Воркуты круглый год. Новый тоннель под хребтом сокращает путь на четыре часа».\n\nНа полях кто-то обвёл слово «тоннель» карандашом.' },
    night: { t: 'Табличка у щитка', k: 'typed', text: 'ВАГОН № 3 · РЕЖИМЫ ОСВЕЩЕНИЯ\n\nДневной — всё включено.\nНочной — включены только: Тамбур, Коридор, Аварийное.\nСтоянка — только Аварийное.\n\n(такой же щиток — в служебном купе каждого вагона)' },
    menu: { t: 'Меню', k: 'img', img: 'menu', ratio: 0.8, cap: 'Меню в кожаной обложке. Касса на стойке открывается, если набрать сумму последнего чека.' },
    receipt: { t: 'Чек из ресторана', k: 'typed', text: 'ВАГОН-РЕСТОРАН П. № 217\nСтол 4 · 14.11.58 · 23:10\n\nЧай с лимоном ×2\nБорщ флотский ×1\nПирожок с капустой ×2\n\nИТОГО: ……… (цифры смазаны)\n\nНа обороте: «Аня, это тебе и Мише. Не забудь ему отнести».' },
    plate8: { t: 'Табличка у входа', k: 'paper', text: 'ВАГОН № 8\nплацкартный\n\nПроводник: А. Лебедь' },
    lock: { t: 'Дверь служебного купе', k: 'hand', text: 'Записка над кодовым замком, почерк ровный, учительский:\n\n«Код — номер поезда и номер моего вагона. Если заберёшься сюда — значит, ты свой. А. Л.»' },
    condlog: { t: 'Журнал проводника', k: 'typed', text: 'ЖУРНАЛ ПРОВОДНИКА ВАГОНА № 8 · А. ЛЕБЕДЬ\n\n14.11, 21:40 — Котлас. Сели 4 чел. с одним чемоданом на всех. Попросили разбудить в Инте.\n03:30 — Ухта. Стоянка 18 мин.\n03:55 — вошли в тоннель. Остановка. Света нет.\n04:20 — Миша (машинист) по рации: впереди завал. Связь — частота 41,8.\n05:10 — Миша сказал, что отцепит паровоз и пойдёт за помощью. Велел держать людей в тепле.\n\n…дальше записей нет.' },
    signals: { t: 'Памятка: звуковые сигналы', k: 'typed', text: 'СИГНАЛЫ СВИСТКОМ ПАРОВОЗА\n(Д — длинный, К — короткий)\n\n«Отправление» — Д\n«Внимание» — Д К К\n«Тормозить» — К К К\n«Отпустить тормоза» — Д Д\n«Вызов проводника» — К Д\n«Тревога» — серия коротких' },
    timetable: { t: 'Расписание в рамке', k: 'img', img: 'timetable', ratio: 0.9, cap: 'Висит у титана. Под стеклом — капли конденсата.' },
    scheme: { t: 'Схема на стене почтового вагона', k: 'img', img: 'scheme', ratio: 0.62, cap: 'Синька, приколотая кнопками. Батарея для рации — в багажном вагоне.' },
    radio_talk: { t: 'Голос в рации', k: 'typed', text: '— …двести семнадцатый, двести семнадцатый, ответьте…\n— Слышу. Это Михайлов. Я у завала. Прохода нет. Иду назад.\n— Миша? Миша, это Аня! Где ты?!\n— Аня… я рядом, за поворотом. Не вижу состав. Дай сигнал, чтобы я пошёл на звук. Сначала позови меня — «вызов проводника». А потом — «отпустить тормоза», чтобы я знал, что вы готовы ехать.\n— …\n\nШипение. Голоса давно нет, а рация всё повторяет и повторяет эту запись.' },
    driverlog: { t: 'Маршрутный лист машиниста', k: 'typed', text: 'МАРШРУТНЫЙ ЛИСТ · ПАРОВОЗ П36-0217\nМашинист: М. Михайлов\n\n03:55 — тоннель, 1238 км. Встали: завал.\n05:10 — отцепил паровоз с головными вагонами, чтобы проверить путь.\n05:40 — сцепку заклинило. Хвост остался за разрывом. Без лома не разжать.\n\nРукоятку реверса убрал в свой ящик — чтобы никто не уехал без хвоста. Шифр — день, когда я встретил Аню.' },
    anna_letter: { t: 'Неотправленное письмо', k: 'hand', text: 'Миша!\n\nЕсли поезд встанет, а ты уйдёшь за помощью — я сохраню им тепло. Титан в кочегарке, ключ я оставила в почтовом сейфе, на твоё имя.\n\nПомнишь, как мы познакомились — 7 ноября, на параде, ты наступил мне на ногу? Я всё ещё смеюсь.\n\nВозвращайся. Без тебя мы не поедем.\nТвоя Аня' },
    anna_diary: { t: 'Дневник проводницы', k: 'hand', text: 'Тоннель, ночь.\n\nХолодно. Я укрыла их одеялами — тех четверых, что сели в Котласе. Они спят. Я их не бужу.\n\nКлюч от тормоза спрятала под нижней полкой у одного из них. Пусть никто не сможет уехать, пока Миша не вернётся. Но если вы это читаете — значит, Миша уже не вернётся. Тогда — везите нас сами. Только всех.\n\nМеста я написала на стекле, в купе головного вагона. Пока стекло в инее — не прочитать.' },
    window: { t: 'Оттаявшее окно', k: 'img', img: 'window', ratio: 0.6, cap: 'Иней оттаял — и на стекле проступили буквы, написанные пальцем изнутри.' },
  };

  // ================= Логика =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { mail: 'key_mail', cab: 'tri_key', coal: 'key_coal' };
  const ACT = {
    unlock(S, who, door) { const n = UNLOCK[door]; if (!n || S.f[door] || !has(S, who, n)) return null; rm(S, who, n); S.f[door] = 1; return ok(who, 'Замок поддался.', 'door'); },
    service(S, who, v) { if (S.f.service) return null; if (v === '2178') { S.f.service = 1; return ok(who, 'Кодовый замок щёлкнул.', 'click'); } return bad(who); },
    panel(S, who, v) { if (S.f.light || !S.f.service) return null; if (v === NIGHT) { S.f.light = 1; return { a: 'light', who }; } return bad(who); },
    register(S, who, v) { if (S.f.register) return null; if (v === '122') { S.f.register = 1; return ok(who, 'Касса звякнула, и ящик выехал.', 'bell'); } return bad(who); },
    rope(S, who) { if (S.f.rope || !has(S, who, 'rope')) return null; rm(S, who, 'rope'); S.f.rope = 1; return { a: 'rope', who }; },
    cable(S, who) { if (S.f.cable || !S.f.rope || !has(S, who, 'block')) return null; rm(S, who, 'block'); S.f.cable = 1; return { a: 'cable', who }; },
    luggage(S, who) { if (S.f.luggage || !has(S, who, 'tri_key')) return null; S.f.luggage = 1; return ok(who, 'Трёхгранка провернулась. Дверь багажного вагона отъехала.', 'door'); },
    wires(S, who, v) { if (S.f.battery || !S.f.luggage) return null; if (v === WIRES) { S.f.battery = 1; return ok(who, 'Искра — и стрелка вольтметра дрогнула. Батарея под нагрузкой.', 'power'); } return bad(who); },
    tune(S, who, v) { if (S.f.radio || !S.f.battery) return null; if (v === '418') { S.f.radio = 1; return { a: 'radio', who }; } return bad(who); },
    whistle(S, who, v) { if (S.f.whistle || !S.f.radio) return null; if (v === WHISTLE) { S.f.whistle = 1; return { a: 'whistle', who }; } return bad(who); },
    sort(S, who, v) { if (S.f.sort) return null; if (Array.isArray(v) && v.join() === ROUTE.join()) { S.f.sort = 1; return ok(who, 'Последнее письмо легло в ячейку — и дверца почтового сейфа отщёлкнулась.', 'mech'); } return bad(who); },
    fire(S, who) { if (S.f.heat || !has(S, who, 'coal') || !has(S, who, 'matches')) return null; rm(S, who, 'coal'); rm(S, who, 'matches'); S.f.heat = 1; return { a: 'heat', who }; },
    punch(S, who, v) { if (S.f.punch) return null; if (v === PUNCH.join('')) { S.f.punch = 1; return ok(who, 'Штифты компостера легли в узор. Сундук проводницы открылся.', 'click'); } return bad(who); },
    berths(S, who, v) { if (S.f.berths || !S.f.heat) return null; if (v === BERTH_SET) { S.f.berths = 1; return { a: 'berths', who }; } return bad(who); },
    dbox(S, who, v) { if (S.f.dbox) return null; if (v === '0711') { S.f.dbox = 1; return ok(who, 'Ящик машиниста открылся. Внутри — рукоятка реверса.', 'click'); } return bad(who); },
    couple(S, who) { if (S.f.coupled || !S.f.cable || !has(S, who, 'crowbar')) return null; rm(S, who, 'crowbar'); S.f.coupled = 1; return { a: 'couple', who }; },
  };
  const chapterOf = (S) => (!(S.f.light && S.f.cable) ? 1 : !S.f.whistle ? 2 : !(S.f.heat && S.f.punch) ? 3 : !(S.f.berths && S.f.dbox) ? 4 : 5);
  const HINTS = [
    [(S) => !S.f.service, 'Внизу служебное купе заперто кодом: «номер поезда и номер моего вагона». Номер поезда — на твоём билете.', 'Код служебки: номер поезда (спроси, что на билетах в голове состава) + номер твоего вагона (табличка у входа).'],
    [(S) => !S.f.light, 'В коридоре у тебя табличка «Режимы освещения». Продиктуй вниз ночной режим.', 'Щиток в служебке: включи только то, что положено ночью. Режимы — на табличке в коридоре головного вагона.'],
    [(S) => !S.f.rope, 'Трос лежит в ресторане. Брось его через разрыв — дверь в конце коридора.', 'Попроси бросить тебе трос: он в вагоне-ресторане головной части.'],
    [(S) => !S.f.cable, 'Внизу должны закрепить трос через блок — он в служебном купе.', 'Возьми блок с крюком в служебке и закрепи трос у двери в конце плацкарта.'],
    [(S) => !S.f.register, 'Касса в ресторане открывается суммой чека. Цены — в меню у тебя, состав заказа — на чеке внизу.', 'В плацкарте лежит чек из ресторана. Прочитай наверх, что заказали: там посчитают по меню.'],
    [(S) => !S.f.luggage, 'Трёхгранка внизу открывает багажный вагон.', 'Трёхгранка из служебки открывает багажный вагон.'],
    [(S) => !S.f.mail, 'Ключ от почтового вагона — в ящике кассы.', 'Наверху открывают почтовый вагон ключом из кассы.'],
    [(S) => !S.f.battery, 'В почтовом вагоне висит схема питания рации. Продиктуй цвета проводов вниз.', 'Батарея в багажном вагоне: подключи провода к клеммам по схеме из почтового вагона.'],
    [(S) => !S.f.cab, 'Кабина паровоза открывается трёхгранкой. Попроси переслать её в корзине.', 'Отправь трёхгранку наверх: она откроет кабину паровоза.'],
    [(S) => !S.f.radio, 'Рация в кабине: нужна частота. Она записана в журнале проводника внизу.', 'В журнале проводника есть частота связи с машинистом. Скажи её наверх.'],
    [(S) => !S.f.whistle, 'Машинист просит два сигнала свистком. Как их подать — в памятке внизу.', 'Памятка сигналов — в служебке. Наверху знают, какие сигналы просил машинист.'],
    [(S) => !S.f.sort, 'Почтовые ячейки: письма надо разложить по порядку станций. Расписание висит внизу.', 'Прочитай наверх расписание поезда: станции по порядку.'],
    [(S) => !S.f.coal, 'В почтовом сейфе — ключ от кочегарки. Отправь вниз.', 'Ключ от кочегарки придёт сверху.'],
    [(S) => !S.f.heat, 'Чтобы растопить титан, внизу нужны спички — они в ресторане.', 'Растопи титан: уголь в кочегарке, спички — у того, кто в ресторане.'],
    [(S) => !S.f.punch, 'Сундук в хвосте открывается узором компостера. Опиши вниз дырочки на своём билете.', 'Сундук проводницы: штифты компостера. Узор — на билетах в голове состава.'],
    [(S) => !S.f.berths, 'Окно в купе оттаяло — на стекле номера мест. Продиктуй их вниз.', 'Под какими полками искать? Номера мест — на оттаявшем окне в купе головного вагона.'],
    [(S) => !S.f.dbox, 'Ящик машиниста: шифр — день знакомства с Аней. Это в её письме из почтового сейфа (ДДММ).', 'Шифр ящика машиниста: день и месяц, когда Миша встретил Аню. Ищите в письмах.'],
    [(S) => !S.f.coupled, 'Сцепку заклинило — нужен лом. Он внизу, в багажном вагоне.', 'Отправь наверх лом из багажного вагона: им разожмут сцепку.'],
    [(S) => !(S.f.insA && S.f.insB), 'Вставь рукоятку реверса в паровозе.', 'Вставь ключ в тормозной кран хвостового вагона.'],
    [() => true, 'Одновременно: рукоятку — вперёд, тормоз — отпустить! «Три, два, один — сейчас!»', 'Одновременно: рукоятку — вперёд, тормоз — отпустить! «Три, два, один — сейчас!»'],
  ];

  // ================= Сцены =================
  const ART = (g, w, hh, key, K) => {
    const { fog, sky } = K;
    const train = (x, y, s, lit, n = 5) => {
      g.fillStyle = '#0a0c0a';
      g.fillRect(x, y - s * 0.5, s * 0.9, s * 0.38); g.beginPath(); g.arc(x + s * 0.1, y - s * 0.5, s * 0.1, Math.PI, 0); g.fill(); g.fillRect(x + s * 0.55, y - s * 0.75, s * 0.32, s * 0.3); g.fillRect(x + s * 0.12, y - s * 0.72, s * 0.08, s * 0.22);
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + s * (0.2 + i * 0.25), y - s * 0.08, s * 0.1, 0, TAU); g.fill(); }
      if (lit) { const gr = g.createRadialGradient(x - s * 0.02, y - s * 0.35, 0, x - s * 0.02, y - s * 0.35, s * 0.8); gr.addColorStop(0, 'rgba(255,230,170,0.7)'); gr.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }
      for (let c = 0; c < n; c++) { const cx = x + s * 0.95 + c * s * 1.25; g.fillStyle = '#121a14'; g.fillRect(cx, y - s * 0.6, s * 1.2, s * 0.5); for (let i = 0; i < 6; i++) { g.fillStyle = lit && (c + i) % 3 === 0 ? '#d8b070' : '#1e2620'; g.fillRect(cx + s * 0.08 + i * s * 0.18, y - s * 0.52, s * 0.12, s * 0.14); } }
    };
    switch (key) {
      case 'station': {
        sky('#0a0e16', '#1a2230'); g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) g.fillRect(Math.random() * w, Math.random() * hh * 0.4, 1.2, 1.2);
        g.fillStyle = '#14181c'; g.fillRect(0, hh * 0.78, w, hh * 0.22); g.fillStyle = '#2a2e30'; g.fillRect(0, hh * 0.76, w, hh * 0.03);
        train(w * 0.08, hh * 0.76, hh * 0.28, true, 4);
        g.fillStyle = '#0a0a0c'; g.fillRect(w * 0.82, hh * 0.35, 6, hh * 0.42); g.fillRect(w * 0.76, hh * 0.35, w * 0.14, hh * 0.06); g.fillStyle = '#c8c0a8'; g.font = `${hh * 0.03}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('101 км', w * 0.83, hh * 0.39);
        const gl = g.createRadialGradient(w * 0.83, hh * 0.33, 0, w * 0.83, hh * 0.33, 80); gl.addColorStop(0, 'rgba(255,220,150,0.5)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, hh);
        fog(); break;
      }
      case 'ticket': sky('#14100c', '#0a0806'); g.save(); g.translate(w * 0.2, hh * 0.18); g.rotate(-0.04); IMG.ticket(g, w * 0.6, hh * 0.64); g.restore(); break;
      case 'tunnel': case 'exit': {
        g.fillStyle = '#050505'; g.fillRect(0, 0, w, hh);
        const out = key === 'exit';
        const gr = g.createRadialGradient(w / 2, hh * 0.5, 0, w / 2, hh * 0.5, hh * 0.45); gr.addColorStop(0, out ? 'rgba(255,220,170,1)' : 'rgba(30,34,40,1)'); gr.addColorStop(0.6, out ? 'rgba(200,160,120,0.6)' : 'rgba(15,17,20,1)'); gr.addColorStop(1, 'rgba(5,5,5,1)'); g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, hh * 0.55, hh * 0.4, hh * 0.45, 0, Math.PI, 0); g.lineTo(w / 2 + hh * 0.4, hh); g.lineTo(w / 2 - hh * 0.4, hh); g.fill();
        g.strokeStyle = '#2a2622'; g.lineWidth = 3; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(w / 2 + i * 12, hh * 0.62); g.lineTo(w / 2 + i * 120, hh); g.stroke(); }
        for (let i = 0; i < 6; i++) { g.fillStyle = '#1a1814'; const y = hh * (0.65 + i * i * 0.012); g.fillRect(w / 2 - (y - hh * 0.6) * 1.4, y, (y - hh * 0.6) * 2.8, 3 + i); }
        if (out) { train(w * 0.38, hh * 0.68, hh * 0.18, true, 2); for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(235,235,235,${0.18 - i * 0.02})`; g.beginPath(); g.arc(w * 0.4 - i * 8, hh * 0.6 - i * 12, 8 + i * 5, 0, TAU); g.fill(); } }
        break;
      }
      case 'split':
        sky('#0a0a0c', '#040405');
        g.fillStyle = '#1a2018'; g.fillRect(0, hh * 0.3, w * 0.42, hh * 0.45); g.fillRect(w * 0.58, hh * 0.3, w * 0.42, hh * 0.45);
        for (let i = 0; i < 3; i++) { g.fillStyle = '#d8b070'; g.globalAlpha = 0.25; g.fillRect(w * (0.05 + i * 0.12), hh * 0.38, w * 0.07, hh * 0.1); g.fillRect(w * (0.62 + i * 0.12), hh * 0.38, w * 0.07, hh * 0.1); g.globalAlpha = 1; }
        g.fillStyle = '#0a0a0a'; g.fillRect(w * 0.42, hh * 0.62, w * 0.16, hh * 0.04);
        HA.figure(g, w * 0.36, hh * 0.68, hh * 0.1, '#000', '#2a2620'); HA.figure(g, w * 0.64, hh * 0.68, hh * 0.1, '#000', '#2a2620');
        fog(); break;
      case 'platform':
        sky('#8a98a8', '#e8c8a0');
        g.fillStyle = '#4a5260'; g.beginPath(); g.moveTo(0, hh * 0.6); g.lineTo(w * 0.25, hh * 0.42); g.lineTo(w * 0.5, hh * 0.55); g.lineTo(w * 0.8, hh * 0.38); g.lineTo(w, hh * 0.5); g.lineTo(w, hh); g.lineTo(0, hh); g.fill();
        g.fillStyle = '#e8eef2'; g.fillRect(0, hh * 0.75, w, hh * 0.25); g.fillStyle = '#6a6460'; g.fillRect(0, hh * 0.72, w, hh * 0.04);
        train(w * 0.05, hh * 0.72, hh * 0.2, false, 3);
        g.fillStyle = '#20242a'; g.fillRect(w * 0.7, hh * 0.45, 5, hh * 0.28); g.fillRect(w * 0.64, hh * 0.45, w * 0.13, hh * 0.05); g.fillStyle = '#e8e0c8'; g.font = `700 ${hh * 0.03}px 'PT Mono', monospace`; g.textAlign = 'center'; g.fillText('ИНТА', w * 0.705, hh * 0.485);
        g.globalAlpha = 0.45; for (let i = 0; i < 5; i++) HA.figure(g, w * (0.48 + i * 0.05), hh * 0.74, hh * 0.06, 'rgba(60,60,70,0.8)', 'rgba(220,210,190,0.8)'); g.globalAlpha = 1;
        HA.stick(g, w * 0.86, hh * 0.84, hh * 0.04, '#20242a'); HA.stick(g, w * 0.9, hh * 0.84, hh * 0.04, '#20242a');
        break;
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  let _lit = null; const litMat = () => _lit || (_lit = new THREE.MeshBasicMaterial({ color: '#ffd8a0' }));
  const bulbSet = (b, on, v = 1.2) => { b.userData.b.material = on ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = on ? 0.7 : 0; lightOn(b.userData.l, on, v); };
  // окно вагона: рама и чёрное стекло тоннеля (без собственного света — их в составе десятки)
  let _glass = null;
  const darkWin = (w = 1.0, h = 0.8) => { const T = THREE, g = new T.Group(), fm = HA.mat('woodMid'); const gl = new T.Mesh(new T.PlaneGeometry(w, h), _glass || (_glass = new T.MeshStandardMaterial({ color: '#05070a', metalness: 0.9, roughness: 0.15 }))); gl.position.z = -0.01; g.add(gl); g.add(HA.B(w + 0.12, 0.06, 0.1, fm, 0, -h / 2, 0), HA.B(w + 0.12, 0.06, 0.1, fm, 0, h / 2, 0), HA.B(0.06, h, 0.1, fm, -w / 2 - 0.03, 0, 0), HA.B(0.06, h, 0.1, fm, w / 2 + 0.03, 0, 0), HA.B(w, 0.03, 0.05, fm, 0, h * 0.2, 0)); g.userData.glass = gl; return g; };
  const frostWin = () => { const g = darkWin(1.0, 0.8); const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.78), new THREE.MeshStandardMaterial({ map: HA.surf('ice', [1, 1]), transparent: true, opacity: 0.9 })); fr.position.z = 0.01; g.add(fr); g.userData.frost = fr; const ink = HA.paperOn(0.9, 0.5, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(220,235,245,0.75)'; c.font = `${H * 0.3}px 'Marck Script', cursive`; c.textAlign = 'center'; c.fillText('9 · 14 · 22 · 36', W / 2, H * 0.45); c.font = `${H * 0.18}px 'Marck Script', cursive`; c.fillText('не уезжайте без них', W / 2, H * 0.8); }); ink.material.transparent = true; ink.position.z = 0.005; g.add(ink); g.userData.ink = ink; return g; };
  const bunk = (A, T, len = 1.9) => { const g = new T.Group(), cl = new T.MeshStandardMaterial({ color: '#2a3a4a', roughness: 0.9 }); g.add(A.B(len, 0.06, 0.62, A.mat('woodMid'), 0, 0.45, 0), A.B(len - 0.05, 0.1, 0.6, cl, 0, 0.53, 0), A.B(len, 0.06, 0.62, A.mat('woodMid'), 0, 1.45, 0), A.B(len - 0.05, 0.08, 0.6, cl, 0, 1.52, 0), A.B(0.04, 1.5, 0.04, A.mat('iron'), len / 2 - 0.05, 0.75, 0.28)); return g; };
  const plate = (txt, w = 0.4, h = 0.12, bg = '#c9a36b', fg = '#2a1a0a') => HA.paperOn(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `700 ${H * 0.55}px Georgia`; g.textAlign = 'center'; g.fillText(txt, W / 2, H * 0.7); });
  const gapDoor = (A, T) => { const d = A.door(0.9, 2.0, A.mat('rust'), A.mat('iron')); const win = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ color: '#030304' })); win.position.set(0.45, 1.45, 0.06); d.userData.leaf.add(win); return d; };
  const basket = (A, T) => { const g = new T.Group(); g.add(A.B(0.45, 0.28, 0.35, new T.MeshStandardMaterial({ color: '#7a5a30', roughness: 0.9 }), 0, 0, 0)); g.add(A.C(0.005, 0.005, 0.9, A.mat('iron'), 0, 0.6, 0, 4)); g.visible = false; return g; };
  const ROOMS = {
    compartment: {
      size: [2.4, 2.5, 2.2], wall: 'train_wall', floor: 'lino', ceil: 'plaster', fog: 0.1, amb: ['#3a3020', '#0a0806', 0.22], yaw: 0, cam: [0, 0.75], trim: false,
      build(R, A, T) {
        const fw = frostWin(); R.o.fw = fw; R.hot('k_window', R.put(fw, 'n', 0, 0.04, 1.1));
        R.put(bunk(A, T, 2.0), 'w', 0, 0.32); R.put(bunk(A, T, 2.0), 'e', 0, 0.32);
        const tbl = new T.Group(); tbl.add(A.B(0.8, 0.04, 0.45, A.mat('woodMid'), 0, 0.72, 0));
        const glass = A.C(0.035, 0.03, 0.1, new T.MeshStandardMaterial({ color: '#c08040', transparent: true, opacity: 0.8 }), -0.15, 0.79, 0, 10); tbl.add(glass); tbl.add(A.C(0.04, 0.035, 0.08, A.mat('brass'), -0.15, 0.78, 0, 10));
        const steam = A.glow('#ffffff', 0.18, 0.15); steam.position.set(-0.15, 0.95, 0); tbl.add(steam); R.o.steam = steam;
        const np = A.paperOn(0.3, 0.22, (g, W, H) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, W, H); g.fillStyle = '#8a1a1a'; g.font = `700 ${H * 0.16}px Georgia`; g.fillText('ПРАВДА', W * 0.1, H * 0.2); g.fillStyle = '#2a1e14'; for (let i = 0; i < 9; i++) g.fillRect(W * 0.08, H * (0.32 + i * 0.07), W * 0.8, 2); }); np.rotation.x = -Math.PI / 2; np.position.set(0.15, 0.745, 0); tbl.add(np);
        R.hot('k_table', R.put(tbl, 'n', 0, 0.25));
        const tk = A.paperOn(0.16, 0.08, (g, W, H) => { g.fillStyle = '#c8b88a'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; g.fillRect(W * 0.1, H * 0.3, W * 0.6, 3); }); tk.rotation.x = -Math.PI / 2;
        R.hot('k_ticket', R.at(tk, 0.75, 0.6, -0.1));
        R.hot('k_door', R.put(A.door(0.8, 2.0), 's', 0, 0.06));
        const lamp = A.bulb(); R.at(lamp, 0, 2.5, 0.7); R.o.lamp = lamp;
      },
      update(R, S) { bulbSet(R.o.lamp, !!S.f.light, 0.9); R.o.fw.userData.frost.visible = !S.f.heat; R.o.fw.userData.ink.visible = !!S.f.heat; },
      tick(R, G, dt, t) { R.o.steam.material.opacity = 0.12 + Math.sin(t * 2) * 0.05; },
    },
    corridor: {
      size: [2.4, 2.5, 9], wall: 'train_wall', floor: 'lino', ceil: 'plaster', fog: 0.1, amb: ['#2a2a22', '#060606', 0.2], yaw: Math.PI, cam: [0.2, -3.2], trim: false,
      build(R, A, T) {
        for (const a of [-3, -1, 1, 3]) R.put(darkWin(0.9, 0.7), 'e', a, 0.04, 1.4);
        for (const [a, n] of [[-3, '5'], [-1, '6'], [1, '7'], [3, '8']]) { const d = A.door(0.8, 2.0); const p = plate(n, 0.14, 0.1); p.position.set(0.4, 1.75, 0.07); d.userData.leaf.add(p); if (n === '7') R.hot('c_door7', R.put(d, 'w', a, 0.06)); else R.put(d, 'w', a, 0.06); }
        R.hot('c_night', R.put(A.paperOn(0.32, 0.24, (g, W, H) => { g.fillStyle = '#c9b88a'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; g.font = `700 ${H * 0.13}px 'PT Mono', monospace`; g.fillText('РЕЖИМЫ', W * 0.1, H * 0.2); for (let i = 0; i < 5; i++) g.fillRect(W * 0.1, H * (0.35 + i * 0.12), W * 0.7, 2); }), 'w', -4.1, 0.02, 1.5));
        const gd = gapDoor(A, T); R.o.gd = gd; R.hot('c_gap', R.put(gd, 's', 0, 0.06));
        const bk = basket(A, T); R.o.bk = bk; R.at(bk, -0.7, 1.6, 4.1);
        R.hot('c_dw', R.at(new T.Group().add(A.B(0.5, 0.5, 0.2, A.mat('iron'), 0, 0, 0)), -0.7, 1.2, 4.38));
        R.hot('c_front', R.put(A.door(0.9, 2.0), 'n', 0, 0.06));
        R.o.bulbs = [-2.5, 0, 2.5].map((z) => { const b = A.bulb(); R.at(b, 0, 2.5, z); return b; });
        const runner = new T.Mesh(new T.PlaneGeometry(0.8, 8.8), new T.MeshStandardMaterial({ color: '#5a1a1a', roughness: 1 })); runner.rotation.x = -Math.PI / 2; runner.position.y = 0.008; R.g.add(runner);
      },
      update(R, S) { R.o.bulbs.forEach((b) => bulbSet(b, !!S.f.light, 1.0)); R.o.bk.visible = !!S.f.cable && S.dw.pos === 'up'; R.o.gd.userData.leaf.rotation.y = S.f.rope ? -1.2 : 0; },
    },
    restaurant: {
      size: [2.8, 2.6, 8], wall: 'damask_red', floor: 'wood_floor', ceil: 'plaster', fog: 0.09, amb: ['#3a2a20', '#0a0606', 0.22], yaw: 0, cam: [0, 2.6],
      build(R, A, T) {
        R.o.lamps = [];
        for (const z of [-2.2, -0.4, 1.4]) {
          for (const x of [-0.85, 0.85]) {
            const t = new T.Group(); t.add(A.B(0.7, 0.04, 0.8, new T.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.8 }), 0, 0.74, 0), A.C(0.04, 0.05, 0.72, A.mat('iron'), 0, 0.36, 0, 8));
            const lp = new T.Group(); lp.add(A.C(0.015, 0.02, 0.2, A.mat('brass'), 0, 0.86, 0, 8)); const shade = A.C(0.05, 0.1, 0.1, new T.MeshStandardMaterial({ color: '#c86a3a', emissive: '#000', roughness: 0.6 }), 0, 1.0, 0, 12); lp.add(shade); t.add(lp); R.o.lamps.push(shade);
            R.at(t, x, 0, z);
          }
          R.put(darkWin(0.9, 0.7), 'w', z, 0.04, 1.4); R.put(darkWin(0.9, 0.7), 'e', z, 0.04, 1.4);
        }
        const bar = new T.Group(); bar.add(A.B(2.6, 1.05, 0.5, A.mat('wood'), 0, 0.52, 0), A.B(2.7, 0.05, 0.6, A.mat('woodMid'), 0, 1.07, 0));
        const reg = new T.Group(); reg.add(A.B(0.36, 0.22, 0.3, A.mat('brass'), 0, 0.11, 0), A.B(0.3, 0.14, 0.04, A.mat('brass'), 0, 0.3, -0.08)); const drw = A.B(0.3, 0.06, 0.26, A.mat('brass'), 0, 0.03, 0.03); reg.add(drw); R.o.drw = drw; reg.position.set(0.7, 1.1, 0); bar.add(reg);
        R.hot('r_register', R.put(bar, 'n', 0, 0.4));
        const menu = A.paperOn(0.24, 0.32, (g, W, H) => IMG.menu(g, W, H)); R.hot('r_menu', R.at(menu, -0.85, 0.77, -0.4)); menu.rotation.x = -Math.PI / 2;
        const shelf = new T.Group(); shelf.add(A.B(0.8, 0.04, 0.3, A.mat('woodMid'), 0, 0.5, 0)); const rope = A.C(0.15, 0.15, 0.12, new T.MeshStandardMaterial({ color: '#8a8a90', metalness: 0.6, roughness: 0.4 }), -0.2, 0.58, 0, 16); shelf.add(rope); R.o.ropeM = rope;
        const mt = A.B(0.08, 0.04, 0.05, new T.MeshStandardMaterial({ color: '#c8a050' }), 0.2, 0.54, 0); shelf.add(mt); R.o.mt = mt;
        R.hot('r_shelf', R.put(shelf, 's', 0.9, 0.2));
        R.hot('r_back', R.put(A.door(0.9, 2.0), 's', -0.6, 0.06));
        R.hot('r_mailDoor', R.put(A.door(0.9, 2.0, A.mat('green')), 'n', -1.0, 0.06));
      },
      update(R, S) { R.o.lamps.forEach((m) => { m.material.emissive.set(S.f.light ? '#ff9a50' : '#000'); }); R.o.drw.position.z = S.f.register ? 0.2 : 0.03; R.o.ropeM.visible = !S.f.t_rope; R.o.mt.visible = !S.f.t_matches; },
    },
    mail: {
      size: [2.8, 2.6, 6], wall: 'wood_panel', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.09, amb: ['#2a2a22', '#060606', 0.2], yaw: 0, cam: [0, 1.4], trim: false,
      build(R, A, T) {
        const holes = new T.Group(); holes.add(A.B(2.2, 1.6, 0.35, A.mat('wood'), 0, 1.3, 0));
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { holes.add(A.B(0.32, 0.34, 0.02, A.mat('black'), -0.85 + c * 0.34, 0.68 + r * 0.38, 0.17)); if ((r * 6 + c) % 4 === 1) holes.add(A.B(0.22, 0.14, 0.02, A.mat('paper'), -0.85 + c * 0.34, 0.66 + r * 0.38, 0.19)); }
        R.hot('m_holes', R.put(holes, 'n', 0, 0.2));
        const safe = new T.Group(); safe.add(A.B(0.7, 0.9, 0.6, A.mat('iron'), 0, 0.45, 0)); const sd = new T.Group(); sd.position.set(-0.33, 0.45, 0.31); sd.add(A.B(0.64, 0.84, 0.04, new T.MeshStandardMaterial({ color: '#4a4a52', metalness: 0.6, roughness: 0.4 }), 0.32, 0, 0)); const hd = A.C(0.06, 0.06, 0.04, A.mat('brass'), 0.5, 0, 0.03, 16); hd.rotation.x = Math.PI / 2; sd.add(hd); safe.add(sd); R.o.sd = sd; R.hot('m_safe', R.put(safe, 'e', -1.6, 0.35));
        R.hot('m_scheme', R.put(A.paperOn(0.7, 0.44, (g, W, H) => IMG.scheme(g, W, H)), 'w', -0.6, 0.02, 1.5));
        for (let i = 0; i < 5; i++) { const s = A.C(0.22, 0.28, 0.5, new T.MeshStandardMaterial({ color: '#6a5a3a', roughness: 1 }), 0, 0.25, 0, 10); R.at(new T.Group().add(s), 0.6 + (i % 2) * 0.35, 0, 1.2 + i * 0.3); }
        R.hot('m_back', R.put(A.door(0.9, 2.0, A.mat('green')), 's', 0, 0.06));
        R.hot('m_cabDoor', R.put(A.ironDoor(0.9, 2.0), 'n', 1.0, 0.06));
        const b = A.bulb(); R.at(b, 0, 2.6, 0); R.o.b = b;
      },
      update(R, S) { bulbSet(R.o.b, !!S.f.light, 1.0); R.o.sd.rotation.y = S.f.sort ? -1.6 : 0; },
    },
    cab: {
      size: [3, 2.6, 2.8], wall: 'metal_plate', floor: 'metal_plate', ceil: 'metal_plate', fog: 0.08, amb: ['#2a2a30', '#080606', 0.22], yaw: 0, cam: [0, 0.7], trim: false,
      build(R, A, T) {
        const boiler = new T.Group(); const bc = A.C(0.95, 0.95, 0.5, new T.MeshStandardMaterial({ color: '#1a1a1c', metalness: 0.6, roughness: 0.4 }), 0, 1.15, 0.0, 28); bc.rotation.x = Math.PI / 2; boiler.add(bc); boiler.add(A.B(2.8, 0.5, 0.4, A.mat('iron'), 0, 0.25, 0.1));
        const fire = A.B(0.5, 0.36, 0.05, A.mat('rust'), 0, 0.72, 0.27); boiler.add(fire);
        const glow = A.glow('#ff6020', 1.0, 0.25); glow.position.set(0, 0.72, 0.4); boiler.add(glow);
        const gauges = []; for (let i = 0; i < 3; i++) { const gm = new T.Mesh(new T.CircleGeometry(0.1, 20), A.mat('porcelain')); gm.position.set(-0.4 + i * 0.4, 1.55, 0.26); boiler.add(gm); const nd = A.B(0.01, 0.08, 0.005, A.mat('red'), -0.4 + i * 0.4, 1.57, 0.27); boiler.add(nd); gauges.push(nd); }
        R.o.gauges = gauges; R.put(boiler, 'n', 0, 0.0);
        const ctrl = new T.Group(); ctrl.add(A.B(0.3, 0.9, 0.3, A.mat('iron'), 0, 0.45, 0)); const sock = A.C(0.05, 0.05, 0.1, A.mat('brass'), 0, 0.95, 0, 10); ctrl.add(sock); const rev = A.B(0.04, 0.45, 0.04, A.mat('black'), 0, 1.15, 0); rev.visible = false; ctrl.add(rev); R.o.rev = rev;
        R.hot('p_ctrl', R.at(ctrl, 0.8, 0, 0.1));
        const rad = A.radio(); rad.scale.setScalar(1.4); const lampR = new T.Mesh(new T.SphereGeometry(0.025, 8, 8), new T.MeshBasicMaterial({ color: '#202020' })); lampR.position.set(0.12, 0.3, 0.12); rad.add(lampR); R.o.lampR = lampR;
        R.hot('p_radio', R.put(rad, 'w', -0.3, 0.2, 1.1));
        const cord = new T.Group(); cord.add(A.C(0.008, 0.008, 1.0, A.mat('cloth'), 0, 0, 0, 4), A.C(0.04, 0.04, 0.1, new T.MeshStandardMaterial({ color: '#8a5a2a' }), 0, -0.5, 0, 8)); R.hot('p_whistle', R.at(cord, -0.5, 2.0, 0.2));
        const box = new T.Group(); box.add(A.B(0.5, 0.3, 0.3, A.mat('woodMid'), 0, 0.15, 0)); for (let i = 0; i < 4; i++) box.add(A.B(0.06, 0.08, 0.02, A.mat('brass'), -0.15 + i * 0.1, 0.18, 0.16)); const lid = A.B(0.52, 0.04, 0.32, A.mat('wood'), 0, 0.31, 0); box.add(lid); R.o.lid = lid;
        R.hot('p_box', R.put(box, 'e', 0.6, 0.2));
        const log = A.paperOn(0.2, 0.28, (g, W, H) => { g.fillStyle = '#d4cab2'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; for (let i = 0; i < 10; i++) g.fillRect(W * 0.1, H * (0.1 + i * 0.08), W * 0.75, 2); }); R.hot('p_log', R.put(log, 'e', -0.6, 0.02, 1.4));
        R.put(darkWin(0.7, 0.6), 'w', 0.8, 0.04, 1.6);
        R.hot('p_back', R.put(A.ironDoor(0.9, 2.0), 's', 0, 0.08));
        const l = new T.PointLight('#ff8040', 0.8, 4, 2); l.position.set(0, 0.6, -0.6); R.g.add(l);
      },
      update(R, S) { R.o.rev.visible = !!S.f.insA; R.o.lampR.material.color.set(S.f.radio ? '#30ff60' : S.f.battery ? '#ffa020' : '#202020'); R.o.gauges.forEach((n, i) => (n.rotation.z = S.f.battery ? -0.5 - i * 0.3 : 1.2)); },
    },
    sleeper: {
      size: [3, 2.5, 10], wall: 'train_wall', floor: 'lino', ceil: 'plaster', fog: 0.1, amb: ['#2a2a22', '#060606', 0.2], yaw: 0, cam: [0.5, 3.6], trim: false,
      build(R, A, T) {
        for (const z of [-3.6, -1.2, 1.2]) { R.at(bunk(A, T, 1.9), -0.55, 0, z); R.at(bunk(A, T, 1.9), -0.55, 0, z + 1.0); }
        for (const z of [-3, -0.6, 1.8]) { R.at(bunk(A, T, 1.8), 1.15, 0, z, Math.PI / 2); R.put(darkWin(0.8, 0.6), 'e', z, 0.04, 1.4); R.put(darkWin(0.8, 0.6), 'w', z + 0.4, 0.04, 1.4); }
        R.o.ghosts = [];
        for (const z of [-3.6, -1.2, 1.2, 2.2]) { const gh = A.glow('#a8c0d8', 0.7, 0); gh.position.set(-0.6, 0.85, z); R.g.add(gh); R.o.ghosts.push(gh); }
        R.hot('s_berths', R.at(new T.Group().add(A.B(1.2, 0.4, 2.0, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), -0.55, 0.4, -2.4));
        const tt = A.paperOn(0.45, 0.42, (g, W, H) => IMG.timetable(g, W, H)); R.hot('s_timetable', R.put(tt, 'n', 0.6, 0.02, 1.5));
        R.hot('s_plate', R.put(plate('ВАГОН № 8', 0.4, 0.12), 'n', -0.6, 0.02, 2.0));
        const rc = A.paperOn(0.1, 0.16, (g, W, H) => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a1e14'; for (let i = 0; i < 6; i++) g.fillRect(W * 0.1, H * (0.15 + i * 0.12), W * 0.7, 2); }); rc.rotation.x = -Math.PI / 2; R.hot('s_receipt', R.at(rc, 1.15, 0.56, -0.6));
        const sd = A.door(0.8, 2.0); R.o.sd = sd; R.hot('s_service', R.put(sd, 'w', 4.3, 0.06));
        const gd = gapDoor(A, T); R.o.gd = gd; R.hot('s_gap', R.put(gd, 'n', 0.6, 0.06));
        const bk = basket(A, T); R.o.bk = bk; R.at(bk, -0.3, 1.6, -4.6);
        R.hot('s_dw', R.at(new T.Group().add(A.B(0.5, 0.5, 0.2, A.mat('iron'), 0, 0, 0)), -0.4, 1.2, -4.9));
        R.hot('s_luggage', R.put(A.door(0.9, 2.0, A.mat('green')), 's', 0.6, 0.06));
        R.o.bulbs = [-3, 0, 3].map((z) => { const b = A.bulb(); R.at(b, 0.3, 2.5, z); return b; });
      },
      update(R, S) { R.o.bulbs.forEach((b) => bulbSet(b, !!S.f.light, 1.0)); R.o.sd.userData.leaf.rotation.y = S.f.service ? -1.2 : 0; R.o.bk.visible = !!S.f.cable && S.dw.pos === 'down'; R.o.gd.userData.leaf.rotation.y = S.f.cable ? 1.0 : 0; },
      tick(R, G, dt, t) { const on = G.S.f.heat; R.o.ghosts.forEach((g, i) => (g.material.opacity = on ? 0.18 + Math.sin(t * 0.8 + i) * 0.08 : 0)); },
    },
    service: {
      size: [2.2, 2.5, 2.2], wall: 'train_wall', floor: 'lino', ceil: 'plaster', fog: 0.1, amb: ['#3a3020', '#0a0806', 0.22], yaw: 0, cam: [0, 0.7], trim: false,
      build(R, A, T) {
        const pn = new T.Group(); pn.add(A.B(0.7, 0.5, 0.1, A.mat('iron'), 0, 0, 0)); const sw = []; for (let i = 0; i < 6; i++) { const s = A.B(0.04, 0.1, 0.04, A.mat('black'), -0.25 + i * 0.1, 0, 0.07); s.rotation.x = 0.4; pn.add(s); sw.push(s); } R.o.sw = sw;
        R.hot('v_panel', R.put(pn, 'e', -0.3, 0.05, 1.5));
        const desk = new T.Group(); desk.add(A.B(0.8, 0.04, 0.45, A.mat('woodMid'), 0, 0.72, 0)); const lg = A.B(0.24, 0.03, 0.18, A.mat('green'), -0.15, 0.75, 0); desk.add(lg); const memo = A.B(0.16, 0.005, 0.22, A.mat('paper'), 0.2, 0.745, 0); desk.add(memo);
        R.hot('v_desk', R.put(desk, 'n', 0, 0.25));
        R.put(darkWin(0.8, 0.6), 'n', 0, 0.04, 1.4);
        const hook = new T.Group(); hook.add(A.C(0.08, 0.08, 0.05, A.mat('iron'), 0, 0, 0, 12)); hook.children[0].rotation.x = Math.PI / 2; const tk = A.B(0.03, 0.12, 0.03, A.mat('brass'), 0.15, 0, 0); hook.add(tk); R.o.hk = hook;
        R.hot('v_hooks', R.put(hook, 'w', 0.3, 0.06, 1.3));
        R.put(bunk(A, T, 1.6), 'w', -0.3, 0.32);
        R.hot('v_door', R.put(A.door(0.8, 2.0), 's', 0, 0.06));
        const lamp = A.candles(1, 0, true); R.at(lamp, 0.3, 0.74, -0.85); R.o.lamp = lamp;
      },
      update(R, S) { R.o.sw.forEach((s, i) => (s.rotation.x = S.f.light && NIGHT.split(',').includes(TOGGLES[i].id) ? -0.4 : 0.4)); R.o.hk.visible = !(S.f.t_block && S.f.t_tri_key); },
    },
    luggage: {
      size: [3, 2.6, 6], wall: 'metal_plate', floor: 'wood_attic', ceil: 'metal_plate', fog: 0.1, amb: ['#2a2a2a', '#060606', 0.16], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        const r = (i) => Math.sin(i * 12.9898) * 0.5 + 0.5;
        for (let i = 0; i < 9; i++) { const gg = new T.Group(); gg.add(A.B(0.5 + r(i) * 0.4, 0.4 + r(i + 3) * 0.4, 0.5, A.mat(i % 2 ? 'woodMid' : 'wood'), 0, 0.3, 0)); R.at(gg, (i % 2 ? 1 : -1) * (0.9 + r(i + 7) * 0.2), 0, -2.2 + i * 0.5, r(i) * 0.4); }
        const bat = new T.Group(); bat.add(A.B(0.9, 0.5, 0.4, new T.MeshStandardMaterial({ color: '#2a2a20', roughness: 0.5 }), 0, 0.25, 0)); for (let i = 0; i < 4; i++) bat.add(A.C(0.03, 0.03, 0.06, A.mat('brass'), -0.3 + i * 0.2, 0.53, 0.1, 8));
        R.o.wires = []; WIRE_COL.forEach((c, i) => { const w = A.B(0.02, 0.02, 0.4, new T.MeshStandardMaterial({ color: c.c }), -0.3 + i * 0.2, 0.56, 0.32); w.visible = false; bat.add(w); R.o.wires.push(w); });
        R.hot('b_battery', R.put(bat, 'n', 0, 0.3));
        const bar = A.B(0.04, 0.04, 0.7, new T.MeshStandardMaterial({ color: '#6a3a3a', metalness: 0.5 }), 0, 0.05, 0); bar.rotation.y = 0.7; R.o.bar = bar; R.hot('b_crowbar', R.at(new T.Group().add(bar), 0.4, 0, 0.6));
        R.hot('b_back', R.put(A.door(0.9, 2.0, A.mat('green')), 's', 0, 0.06));
        R.hot('b_coalDoor', R.put(A.ironDoor(0.9, 2.0), 'e', 2.0, 0.08));
        R.hot('b_tailDoor', R.put(A.door(0.9, 2.0, A.mat('rust')), 'w', 2.0, 0.06));
        const l = A.candles(1, 0, true); R.at(l, 0, 0.55, -2.7);
      },
      update(R, S) { R.o.wires.forEach((w) => (w.visible = !!S.f.battery)); R.o.bar.visible = !S.f.t_crowbar; },
    },
    coal: {
      size: [2.6, 2.5, 3], wall: 'bricks', floor: 'concrete', ceil: 'concrete', fog: 0.12, amb: ['#2a1a14', '#060404', 0.14], yaw: 0, cam: [0, 0.9], trim: false,
      build(R, A, T) {
        const titan = new T.Group(); titan.add(A.C(0.3, 0.3, 1.2, A.mat('brass'), 0, 1.0, 0, 20), A.B(0.5, 0.4, 0.5, A.mat('iron'), 0, 0.2, 0)); const fire = A.glow('#ff6020', 0.8, 0); fire.position.set(0, 0.25, 0.3); titan.add(fire); R.o.fire = fire;
        titan.add(A.C(0.02, 0.02, 0.1, A.mat('brass'), 0.2, 0.8, 0.28, 6));
        R.hot('o_titan', R.put(titan, 'n', -0.3, 0.4));
        const bin = new T.Group(); bin.add(A.B(1.0, 0.5, 0.6, A.mat('woodMid'), 0, 0.25, 0)); for (let i = 0; i < 12; i++) bin.add(A.B(0.12, 0.1, 0.12, new T.MeshStandardMaterial({ color: '#141416', roughness: 0.4 }), -0.35 + (i % 4) * 0.23, 0.52, -0.2 + Math.floor(i / 4) * 0.2));
        R.hot('o_bin', R.put(bin, 'e', 0.3, 0.35));
        R.hot('o_back', R.put(A.ironDoor(0.9, 2.0), 's', 0, 0.08));
        const fl = new T.PointLight('#ff7030', 0, 4, 2); fl.position.set(-0.3, 0.6, -0.8); R.g.add(fl); R.o.fl = fl;
        const c = A.candles(1, 0, true); R.at(c, 0.8, 0.5, 0.6);
      },
      update(R, S) { R.o.fire.material.opacity = S.f.heat ? 0.8 : 0; R.o.fl.intensity = S.f.heat ? 1.6 : 0; },
      tick(R, G, dt, t) { if (G.S.f.heat) R.o.fl.intensity = 1.4 + Math.sin(t * 11) * 0.2 + Math.random() * 0.2; },
    },
    tail: {
      size: [2.6, 2.5, 4], wall: 'train_wall', floor: 'lino', ceil: 'plaster', fog: 0.1, amb: ['#3a1a1a', '#060404', 0.18], yaw: 0, cam: [0, 1.0], trim: false,
      build(R, A, T) {
        const rd = A.door(0.9, 2.0, A.mat('rust')); const win = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ color: '#2a0606' })); win.position.set(0.45, 1.45, 0.06); rd.userData.leaf.add(win); R.put(rd, 'n', 0.5, 0.06);
        const red = A.glow('#ff2020', 1.0, 0.6); red.position.set(0.95, 1.45, -1.9); R.g.add(red); const rl = new T.PointLight('#ff3030', 0.8, 4, 2); rl.position.set(0.5, 1.4, -1.6); R.g.add(rl);
        const trunk = A.chest ? A.chest() : A.B(0.8, 0.5, 0.5, A.mat('wood')); R.o.trunk = trunk; R.hot('t_trunk', R.put(trunk, 'w', -0.6, 0.4));
        const brake = new T.Group(); brake.add(A.C(0.04, 0.04, 1.2, A.mat('pipe'), 0, 0.6, 0, 8), A.C(0.1, 0.1, 0.12, new T.MeshStandardMaterial({ color: '#a82020', metalness: 0.4 }), 0, 1.25, 0, 12)); const kb = A.B(0.03, 0.15, 0.03, A.mat('brass'), 0.12, 1.25, 0); kb.visible = false; brake.add(kb); R.o.kb = kb;
        R.hot('t_brake', R.put(brake, 'e', -0.8, 0.25));
        R.hot('t_back', R.put(A.door(0.9, 2.0, A.mat('rust')), 's', 0, 0.06));
      },
      update(R, S) { R.o.kb.visible = !!S.f.insB; if (R.o.trunk.userData && R.o.trunk.userData.lid) R.o.trunk.userData.lid.rotation.x = S.f.punch ? -1.2 : 0; },
    },
    exit: {
      size: [8, 5, 10], wall: 'stone', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.05, amb: ['#8a7a6a', '#141010', 0.5], yaw: 0, cam: [0, 3],
      build(R, A, T) {
        const portal = A.glow('#ffe0b0', 6, 0.9); portal.position.set(0, 2.2, -4.8); R.g.add(portal);
        const sun = new T.PointLight('#ffd0a0', 2.5, 14, 2); sun.position.set(0, 2.5, -4); R.g.add(sun); R.o.sun = sun;
        for (const x of [-0.7, 0.7]) { const rail = A.B(0.08, 0.1, 10, A.mat('iron'), x, 0.05, 0); R.g.add(rail); }
        for (let z = -4.5; z < 5; z += 0.6) R.g.add(A.B(2.2, 0.06, 0.2, A.mat('woodMid'), 0, 0.02, z));
        R.hot('q_any', R.at(new T.Group().add(A.B(1, 1, 1, new T.MeshBasicMaterial({ visible: false }), 0, 0, 0)), 0, 1, -3));
      },
      tick(R, G, dt, t) { R.o.sun.intensity = 2.3 + Math.sin(t * 0.7) * 0.3; },
    },
  };

  // ================= Точки интереса =================
  function hot(G, { use, bindUse, P }) {
    const seqPanel = (t, desc, items, key, act, n) => () => {
      const p = G.ps; p.seq = p.seq || [];
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${items.map((it) => `<button data-s="${it.id}" class="${p.seq.includes(it.id) ? 'sel' : ''}">${it.l}</button>`).join('')}</div><p class="hs-cap">Выбрано: ${p.seq.length} из ${n}</p><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => { el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.s)) return; p.seq.push(b.dataset.s); G.snd(key); if (p.seq.length === n) G.act(act, p.seq.slice()); G.renderPanel(); })); $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); }; } };
    };
    const togglePanel = (t, desc, items, act, btn, join = (on) => items.filter((i) => on[i.id]).map((i) => i.id).join()) => () => {
      const p = G.ps; p.on = p.on || {};
      return { t, html: `<p class="hs-txt">${desc}</p><div class="hs-dolls">${items.map((i) => `<button data-j="${i.id}" class="${p.on[i.id] ? 'sel' : ''}">${i.l}</button>`).join('')}</div><button class="hs-btn" id="hsGo">${btn}</button>`,
        bind: (el) => { el.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => { p.on[b.dataset.j] = !p.on[b.dataset.j]; G.snd('click'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act(act, join(p.on)); } };
    };
    const final = (o, need, text) => { if (!G.S.f.coupled) return G.say(need, text); P(() => G.finalPanel(), o); };
    return {
      // ---------- Купе ----------
      k_window: (o, S, f) => { if (f.heat) return G.doc('window', o); G.say('Окно', 'Стекло затянуто толстым инеем изнутри. За ним — чёрная стена тоннеля. Под инеем угадываются какие-то линии, будто кто-то писал пальцем… Если бы потеплело.'); G.focusOn(o); },
      k_table: (o) => P(() => ({ t: 'Столик', html: '<p class="hs-txt">Два стакана в подстаканниках. Чай ещё тёплый — хотя в вагоне так холодно, что изо рта идёт пар. Рядом газета.</p><button class="hs-btn ghost" data-doc="paper58">Газета</button>' }), o),
      k_ticket: (o) => G.doc('ticket', o),
      k_door: () => G.go('corridor'),
      // ---------- Коридор ----------
      c_door7: () => G.go('compartment'),
      c_night: (o) => G.doc('night', o),
      c_front: () => G.go('restaurant'),
      c_dw: (o) => P(() => G.dwPanel(), o),
      c_gap: (o, S, f) => P(() => {
        if (f.coupled) return { t: 'Сцепка', html: '<p class="hs-txt">Буфера сомкнуты, сцепка защёлкнута. Состав снова один.</p>' };
        if (!f.rope) return { t: 'Дверь в конце вагона', html: `<p class="hs-txt">За дверью — пустота: три метра темноты, рельсы и обрывок сцепки. На той стороне — тёмный тамбур восьмого вагона. Кричишь — слышно. Перепрыгнуть — нельзя.</p>${use('rope', 'Бросить трос на ту сторону', 'rope')}`, bind: bindUse };
        if (!f.cable) return { t: 'Разрыв', html: '<p class="hs-txt">Трос переброшен. Теперь на той стороне его должны закрепить через блок.</p>' };
        return { t: 'Разрыв', html: `<p class="hs-txt">Над разрывом натянут трос с корзиной. Сцепка внизу заклинена ржавчиной — её не свести руками.</p>${use('crowbar', 'Разжать сцепку ломом', 'couple')}`, bind: bindUse };
      }, o),
      // ---------- Ресторан ----------
      r_back: () => G.go('corridor'),
      r_menu: (o) => G.doc('menu', o),
      r_shelf: (o) => P(() => ({ t: 'Подсобка буфета', html: `<p class="hs-txt">Полка за стойкой: банки, скатерти, бухта стального троса. В углу — коробок спичек.</p>${G.takeHtml(['rope', 'matches']) || '<p class="hs-cap">Больше ничего полезного.</p>'}` }), o),
      r_register: (o, S, f) => {
        if (f.register) return P(() => ({ t: 'Касса', html: `<p class="hs-txt">Ящик кассы выдвинут. Мелочь 1958 года и ключ с сургучной пломбой.</p>${G.takeHtml(['key_mail']) || '<p class="hs-cap">Только мелочь.</p>'}` }), o);
        P(() => G.wheelsPanel({ t: 'Касса «Националь»', desc: 'Тяжёлый кассовый аппарат. На ленте последнего чека цифры смазались. Чтобы открыть ящик, надо пробить ту же сумму (копейки).', n: 3, chars: '0123456789', act: 'register', label: 'Пробить' }), o);
      },
      r_mailDoor: (o, S, f) => { if (f.mail) return G.go('mail'); P(() => ({ t: 'Почтовый вагон', html: `<p class="hs-txt">Зелёная дверь с надписью «ПОЧТА. Посторонним вход воспрещён». Опломбирована.</p>${use('key_mail', 'Отпереть ключом с пломбой', 'unlock', 'mail')}`, bind: bindUse }), o); },
      // ---------- Почтовый ----------
      m_back: () => G.go('restaurant'),
      m_scheme: (o) => G.doc('scheme', o),
      m_holes: (o, S, f) => {
        if (f.sort) return G.say('Почтовые ячейки', 'Письма разложены. Где-то в глубине вагона щёлкнул замок сейфа.');
        P(seqPanel('Почтовые ячейки', 'Пять писем, не разложенных по ячейкам. Ячейки подписаны станциями. Почтальон раскладывает их по порядку следования поезда — иначе сейф не откроется. Клади письма по очереди.', ROUTE_SHOW.map((s) => ({ id: s, l: '✉ ' + s })), 'book', 'sort', 5), o);
      },
      m_safe: (o, S, f) => P(() => f.sort ? { t: 'Почтовый сейф', html: `<p class="hs-txt">Сейф открыт. Внутри — письмо без марки и ключ, подписанный «М. Михайлову».</p><button class="hs-btn ghost" data-doc="anna_letter">Письмо</button>${G.takeHtml(['key_coal'])}` } : { t: 'Почтовый сейф', html: '<p class="hs-txt">Стальной сейф. Ни скважины, ни диска — только табличка: «Открывается после сортировки».</p>' }, o),
      m_cabDoor: (o, S, f) => { if (f.cab) return G.go('cab'); P(() => ({ t: 'Дверь на паровоз', html: `<p class="hs-txt">Железная дверь к тендеру и кабине. Служебный замок под трёхгранный ключ.</p>${use('tri_key', 'Открыть трёхгранкой', 'unlock', 'cab')}`, bind: bindUse }), o); },
      // ---------- Кабина ----------
      p_back: () => G.go('mail'),
      p_log: (o) => G.doc('driverlog', o),
      p_radio: (o, S, f) => {
        if (f.radio) return G.doc('radio_talk', o);
        if (!f.battery) return G.say('Рация', 'Поездная рация «Урал». Мертва: аккумуляторы паровоза сели. Аварийная батарея — где-то в составе.');
        P(() => G.wheelsPanel({ t: 'Рация', desc: 'Рация ожила: лампа горит жёлтым, в динамике шорох. Частота — три цифры (десятые доли МГц).', n: 3, chars: '0123456789', act: 'tune', label: 'Настроить', top: ['', '', ','] }), o);
      },
      p_whistle: (o, S, f) => {
        if (f.whistle) return G.say('Свисток', 'Ты уже подал сигналы. Из глубины тоннеля, сзади, отозвался чей-то свисток.');
        if (!f.radio) return G.say('Свисток', 'Шнурок паровозного свистка. Без цели свистеть в тоннеле — страшно: кто знает, кто отзовётся.');
        P(() => { const p = G.ps; p.w = p.w || []; return { t: 'Свисток', html: `<p class="hs-txt">Тянешь шнурок — коротко или долго. Набери сигналы, которые просил машинист, и подай их.</p><div class="hs-mline">${p.w.join(' ') || '…'}</div><div class="hs-dolls"><button data-k="К">Коротко</button><button data-k="Д">Долго</button></div><button class="hs-btn" id="hsGo">Подать сигналы</button><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
          bind: (el) => { el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { p.w.push(b.dataset.k); G.toot(b.dataset.k); G.renderPanel(); })); $('#hsGo', el).onclick = () => { G.act('whistle', p.w.join()); p.w = []; }; $('#hsClr', el).onclick = () => { p.w = []; G.renderPanel(); }; } }; }, o);
      },
      p_box: (o, S, f) => {
        if (f.dbox) return P(() => ({ t: 'Ящик машиниста', html: `<p class="hs-txt">Ящик открыт. На дне — фотография девушки в форме проводника.</p>${G.takeHtml(['key_a']) || '<p class="hs-cap">Пусто.</p>'}` }), o);
        P(() => G.wheelsPanel({ t: 'Ящик машиниста', desc: 'Деревянный ящик с латунным замком на четыре цифры. На крышке выцарапано: «М.М.».', n: 4, chars: '0123456789', act: 'dbox', top: ['день', 'день', 'мес', 'мес'] }), o);
      },
      p_ctrl: (o) => final(o, 'Регулятор', 'Регулятор и гнездо реверса. Но двигаться нельзя: хвост состава не прицеплен. Машинист бы никогда не уехал без них.'),
      // ---------- Плацкарт ----------
      s_plate: (o) => G.doc('plate8', o),
      s_timetable: (o) => G.doc('timetable', o),
      s_receipt: (o) => G.doc('receipt', o),
      s_dw: (o) => P(() => G.dwPanel(), o),
      s_luggage: (o, S, f) => { if (f.luggage) return G.go('luggage'); P(() => ({ t: 'Дверь в багажный вагон', html: `<p class="hs-txt">Дверь в багажный вагон. Служебный замок под трёхгранку.</p>${G.has('tri_key') ? '<button class="hs-btn" data-use="luggage">Открыть трёхгранкой</button>' : ''}`, bind: bindUse }), o); },
      s_service: (o, S, f) => { if (f.service) return G.go('service'); P(() => { const sp = G.wheelsPanel({ t: 'Служебное купе', desc: 'Дверь проводника. Кодовый замок на четыре цифры, над ним приколота записка.', n: 4, chars: '0123456789', act: 'service' }); sp.html = '<button class="hs-btn ghost" data-doc="lock">Записка над замком</button>' + sp.html; return sp; }, o); },
      s_gap: (o, S, f) => P(() => {
        if (f.coupled) return { t: 'Сцепка', html: '<p class="hs-txt">Буфера сомкнуты. Состав снова один.</p>' };
        if (!f.rope) return { t: 'Дверь в конце вагона', html: '<p class="hs-txt">За дверью — провал между вагонами. На той стороне тамбур третьего вагона. Если оттуда бросят трос — его можно закрепить.</p>' };
        if (!f.cable) return { t: 'Трос', html: `<p class="hs-txt">Трос переброшен и висит на поручне. Чтобы по нему ходила корзина, нужен блок.</p>${use('block', 'Закрепить трос через блок', 'cable')}`, bind: bindUse };
        return { t: 'Разрыв', html: '<p class="hs-txt">Трос натянут, корзина ходит. Сцепка внизу заклинена ржавчиной.</p>' };
      }, o),
      s_berths: (o, S, f) => P(() => {
        if (f.berths) return { t: 'Нижние полки', html: `<p class="hs-txt">Под полками 9, 14, 22 и 36 — чужие чемоданы. Под 36-й, в сапоге, — ключ.</p>${G.takeHtml(['key_b'])}` };
        if (!f.heat) return { t: 'Нижние полки', html: '<p class="hs-txt">Полки плацкарта. На некоторых — смятые одеяла, будто кто-то только что встал. Под полками — ящики для багажа. Их тут десятки; искать вслепую — до утра.</p>' };
        return togglePanel('Нижние полки', 'Стало тепло, и на одеялах проступили тени — будто кто-то лежит. Под какими полками искать? Подними нужные.', BERTHS.map((b) => ({ id: b, l: 'место ' + b })), 'berths', 'Поднять полки')();
      }, o),
      // ---------- Служебка ----------
      v_door: () => G.go('sleeper'),
      v_desk: (o) => P(() => ({ t: 'Столик проводника', html: '<p class="hs-txt">Журнал в зелёной обложке, памятка сигналов, стакан с остывшим чаем.</p><button class="hs-btn ghost" data-doc="condlog">Журнал проводника</button><button class="hs-btn ghost" data-doc="signals">Памятка сигналов</button>' }), o),
      v_hooks: (o) => P(() => ({ t: 'Крючки у двери', html: `<p class="hs-txt">На крючках — инструмент проводника.</p>${G.takeHtml(['block', 'tri_key']) || '<p class="hs-cap">Крючки пусты.</p>'}` }), o),
      v_panel: (o, S, f) => {
        if (f.light) return G.say('Щиток', 'Ночной режим. По вагонам горит тусклый жёлтый свет.');
        P(togglePanel('Щиток освещения', 'Шесть тумблеров. Если включить не то — сработает защита и всё погаснет снова.', TOGGLES, 'panel', 'Подать питание', (on) => TOGGLES.filter((t) => on[t.id]).map((t) => t.id).join()), o);
      },
      // ---------- Багажный ----------
      b_back: () => G.go('sleeper'),
      b_crowbar: (o) => P(() => ({ t: 'Ящики', html: `<p class="hs-txt">Ящики с надписью «Воркутауголь». Между ними — короткий лом.</p>${G.takeHtml(['crowbar']) || '<p class="hs-cap">Пусто.</p>'}` }), o),
      b_battery: (o, S, f) => P(() => {
        if (f.battery) return { t: 'Аварийная батарея', html: '<p class="hs-txt">Провода подключены. Стрелка вольтметра — на 48 вольтах.</p>' };
        const p = G.ps; p.c = p.c || [0, 0, 0, 0];
        return { t: 'Аварийная батарея', html: `<p class="hs-txt">Четыре клеммы, от них — четыре оборванных провода разных цветов. Нажимай на клемму, чтобы сменить провод.</p><div class="hs-dolls">${p.c.map((ci, i) => `<button data-c="${i}" style="border-color:${WIRE_COL[ci].c}">${i + 1}: ${WIRE_COL[ci].l}</button>`).join('')}</div><button class="hs-btn" id="hsGo">Замкнуть рубильник</button>`,
          bind: (el) => { el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { const i = +b.dataset.c; p.c[i] = (p.c[i] + 1) % 4; G.snd('click'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('wires', p.c.map((ci) => WIRE_COL[ci].id).join()); } };
      }, o),
      b_coalDoor: (o, S, f) => { if (f.coal) return G.go('coal'); P(() => ({ t: 'Кочегарка', html: `<p class="hs-txt">Закопчённая дверь «Котельное отделение». Заперта.</p>${use('key_coal', 'Отпереть ключом', 'unlock', 'coal')}`, bind: bindUse }), o); },
      b_tailDoor: (o, S, f) => { if (f.whistle) return G.go('tail'); G.say('Дверь в хвостовой вагон', 'Дверь не открывается — будто её держат с той стороны. Из щели тянет холодом и слышно, как кто-то тихо дышит. Или это ветер в тоннеле.'); G.focusOn(o); },
      // ---------- Кочегарка ----------
      o_back: () => G.go('luggage'),
      o_bin: (o) => P(() => ({ t: 'Угольный ящик', html: `<p class="hs-txt">Ящик с углём. Совок воткнут сверху.</p>${G.takeHtml(['coal']) || '<p class="hs-cap">Ведро уже набрано.</p>'}` }), o),
      o_titan: (o, S, f) => P(() => f.heat ? { t: 'Титан', html: '<p class="hs-txt">Титан гудит, по трубам отопления идёт тепло. Во всём составе оттаивают окна.</p>' } : { t: 'Титан', html: `<p class="hs-txt">Топка титана, холодная. Чтобы растопить — нужен уголь и огонь.</p>${G.has('coal') && G.has('matches') ? '<button class="hs-btn" data-use="fire">Растопить титан</button>' : `<p class="hs-cap">${G.has('coal') ? 'Нужны спички.' : G.has('matches') ? 'Нужен уголь.' : 'Нужны уголь и спички.'}</p>`}`, bind: bindUse }, o),
      // ---------- Хвост ----------
      t_back: () => G.go('luggage'),
      t_trunk: (o, S, f) => P(() => {
        if (f.punch) return { t: 'Сундук проводницы', html: '<p class="hs-txt">Сундук открыт: форма, платок, дневник.</p><button class="hs-btn ghost" data-doc="anna_diary">Дневник</button>' };
        const p = G.ps; p.p = p.p || [0, 0, 0, 0, 0, 0, 0, 0, 0];
        return { t: 'Сундук проводницы', html: '<p class="hs-txt">Окованный сундук. Вместо замка — компостер: девять штифтов 3×3. Опусти нужные — как на пробитом билете.</p><div class="hs-tiles">' + p.p.map((v, i) => `<button data-i="${i}" class="${v ? 'sel' : ''}">${v ? '●' : '○'}</button>`).join('') + '</div><button class="hs-btn" id="hsGo">Нажать компостер</button>',
          bind: (el) => { el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { p.p[+b.dataset.i] ^= 1; G.snd('tick2'); G.renderPanel(); })); $('#hsGo', el).onclick = () => G.act('punch', p.p.join('')); } };
      }, o),
      t_brake: (o) => final(o, 'Тормозной кран', 'Хвостовой тормозной кран. Отпустить тормоза сейчас — вагоны просто покатятся под уклон, в темноту. Сначала состав должен быть сцеплен.'),
      q_any: () => G.say('Свет', 'Впереди — утро.'),
    };
  }

  StoryEngine.define({
    id: 'train', title: 'Последний поезд', icon: '🚂', color: '#7a9a6a',
    tagline: 'Хоррор-детектив: поезд, застрявший в тоннеле в 1958-м',
    infoDefault: 'новая история · 3D',
    roles: [
      { id: 'up', name: 'Голова состава', icon: '🕯️', desc: 'Ты в головной части: купе, коридор, ресторан, почтовый вагон, паровоз.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'Хвост состава', icon: '🔦', desc: 'Ты в хвосте: плацкарт, служебное купе, багажный вагон, кочегарка, хвостовой вагон.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Третья мрачная история: 5 глав, 11 вагонов и отсеков, около 25 загадок. 1,5–2 часа. Лучше в наушниках.',
      'Состав расцеплен: вы в разных половинах поезда. Улики разделены — говорите обо всём, что видите.',
      'Предметы передаются корзиной на тросе — но трос ещё надо натянуть.',
      'Прогресс сохраняется. Застряли — кнопка 💡.',
    ],
    sub: 'хоррор-детектив для двоих · 5 глав',
    warn: 'Наденьте наушники. Говорите обо всём, что видите: часть ответа всегда у другого.',
    roleLabel: { up: '🕯️ Ты — в <b>голове состава</b>', down: '🔦 Ты — в <b>хвосте состава</b>' },
    enterLabel: 'Сесть в поезд', menuArt: 'station', endArt: 'platform', endSub: 'довезли поезд № 217 до станции', finalRoom: 'exit', introSound: { 2: 'crash' },
    chapters: CH, ITEMS, DOCS, IMG, ACT, HINTS, TAKE, chapterOf, drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART, hot,
    dw: {
      name: 'Корзина на тросе', cabin: 'Корзина', empty: 'корзина пуста', putIn: 'Положить в корзину:', called: 'Корзина проехала над разрывом к вам.', call: 'Подтянуть корзину', send: { up: 'в хвост →', down: 'в голову ←' },
      room: { up: 'corridor', down: 'sleeper' }, need: 'cable',
      broken: { up: 'Между вагонами провал. Пока не натянут трос, передавать нечего и не с чем.', down: 'Между вагонами провал. Пока не натянут трос, передавать нечего и не с чем.' },
    },
    final: {
      title: 'Тронуться', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Гнездо реверса на пульте паровоза. Рукоятку вперёд — и паровоз потянет. Но только если в ту же секунду в хвосте отпустят тормоза.', down: 'Хвостовой тормозной кран. Ключ — и тормоза отпустят. Но только если в ту же секунду паровоз даст ход.' },
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'light': G.snd('power'); G.toast('Щёлкнули реле — по всему составу загорелся тусклый жёлтый свет. Даже в голове поезда.', 4000); break;
        case 'rope': G.snd('rope'); G.toast(me ? 'Трос со свистом перелетел через провал и звякнул о поручень.' : 'Из темноты прилетел трос и зацепился за поручень тамбура.', 4000); break;
        case 'cable': G.snd('mech'); G.toast('Трос натянут через блок. По нему можно гонять корзину.', 3500); break;
        case 'radio': G.snd('static'); G.toast(me ? 'Сквозь шорох — голоса.' : 'Из головы состава доносится треск рации и голоса.', 3500); if (me) setTimeout(() => G.doc('radio_talk'), 1200); break;
        case 'whistle': setTimeout(() => G.toot('Д', 0.5), 1600); setTimeout(() => G.toot('Д', 0.5), 2700); G.toast(me ? 'Где-то сзади, в хвосте, тихо отозвался чужой свисток.' : 'Из головы состава донёсся свисток. А потом — ещё один, совсем рядом. Дверь в хвостовой вагон приоткрылась сама.', 5000); break;
        case 'heat': G.snd('fire'); G.toast('Титан загудел. По трубам пошло тепло — во всём составе тают окна.', 4000); break;
        case 'berths': G.snd('drawer'); G.toast(me ? 'Полки поднялись. Под одной из них что-то блеснуло.' : 'Снизу, из хвоста, доносится стук поднимаемых полок.', 3500); break;
        case 'couple': G.snd('crash'); G.toast('Лом скрипнул, сцепка разжалась — и вагоны со стуком сошлись. Состав снова един.', 4500); break;
      }
    },
    methods: {
      toot(k, vol = 1) {
        const ac = SFX.ac; if (!ac || SFX.muted) return;
        const d = k === 'Д' ? 1.1 : 0.35;
        [440, 554, 659].forEach((f) => SFX.tone(f, d, { type: 'sawtooth', vol: 0.035 * vol, attack: 0.04 }));
        SFX.noise(d, { vol: 0.08 * vol, freq: 2400, type: 'bandpass', q: 2 });
      },
    },
  });
})();
