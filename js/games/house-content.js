'use strict';
// Содержание «Вереска»: предметы, документы, комнаты, головоломки и логика хоста.
// Ни одна загадка не решается в одиночку: улики разделены между этажами.
window.HouseContent = (() => {
  const A = window.HouseArt;
  const SYMS = ['☀', '☾', '✦', '✿', '✝', '✋'];
  const PITCH = { '☀': 261.6, '☾': 329.6, '✦': 392, '✿': 440, '✝': 523.3 };
  const LULLABY = ['☾', '✦', '✦', '☾', '✿', '✦'];
  const RING = [['☀', '✝', '✋', '☾', '✦', '✿'], ['✿', '☀', '☾', '✦', '✋', '✝'], ['✦', '✋', '✿', '✝', '☾', '☀']];
  const RING_GOAL = ['✝', '☾', '✋'];
  const BOOKS = [{ id: 'black', c: '#141214', n: 'Чёрная' }, { id: 'red', c: '#8a1e1e', n: 'Красная' }, { id: 'white', c: '#cfc8b8', n: 'Белая' }, { id: 'green', c: '#1e6a3a', n: 'Зелёная' }, { id: 'purple', c: '#4a2a6a', n: 'Лиловая' }, { id: 'gold', c: '#b8902e', n: 'Золотая' }, { id: 'brown', c: '#5a3a1e', n: 'Коричневая' }, { id: 'blue', c: '#1e3a7a', n: 'Синяя' }];
  const DOLLS = [{ id: 'papa', n: 'Папа' }, { id: 'mama', n: 'Мама' }, { id: 'marfa', n: 'Марфа' }, { id: 'liza', n: 'Лиза' }];
  const DROOMS = [{ id: 'attic', n: 'Под крышей: игрушки', y: 0 }, { id: 'study', n: 'Кабинет: письменный стол', y: 1 }, { id: 'bedroom', n: 'Спальня: большая кровать', y: 1 }, { id: 'kitchen', n: 'Кухня: печь', y: 2 }];

  // ================= Предметы =================
  const ITEMS = {
    cane: { n: 'Трость с крюком', d: 'Чёрная трость с загнутой костяной ручкой. Длинная — до чего-нибудь достанет.' },
    fuse1: { n: 'Предохранитель', d: 'Старый стеклянный предохранитель. Нить цела.' },
    fuse2: { n: 'Предохранитель', d: 'Второй предохранитель. Был спрятан в напольных часах.' },
    crank: { n: 'Рукоять', d: 'Железная рукоять с квадратным гнездом. От какого-то механизма.' },
    key_laundry: { n: 'Ключ «Прачечная»', d: 'Ключ с картонной биркой: «Прачечная». Почерк аккуратный, женский.' },
    desk_key: { n: 'Маленький ключ', d: 'Крошечный латунный ключ — от ящика стола или шкатулки.' },
    matches: { n: 'Спички', d: 'Коробок спичек «Гигант», 1978 г. Осталось несколько штук.' },
    medal_a: { n: 'Половина медальона', d: 'Левая половина серебряного медальона. Внутри — край детской фотографии.' },
    medal_b: { n: 'Половина медальона', d: 'Правая половина медальона. Гравировка: «...ой Лизе».' },
    medal: { n: 'Медальон Лизы', d: 'Медальон целиком. На крышке: «Моей Лизе». Внутри — фото девочки. Её лицо стёрто, будто его тёрли пальцем годами.' },
    key_nursery: { n: 'Ключ «Детская»', d: 'Ключ с розовой ленточкой. Лента выцвела до серого.' },
    record: { n: 'Пластинка', d: 'Граммофонная пластинка в бумажном конверте. Чуть покороблена от воды.' },
    winding_key: { n: 'Заводной ключик', d: 'Ключик в форме бабочки — заводить музыкальные игрушки.' },
    crypt_key: { n: 'Железный ключ', d: 'Тяжёлый ржавый ключ. Пахнет землёй. Был спрятан в музыкальной шкатулке.' },
    attic_key: { n: 'Ключ от чердака', d: 'Ключ на бечёвке. На ней — узелки, как будто кто-то считал.' },
    key_a: { n: 'Ключ с луной', d: 'Резной ключ с полумесяцем. Одна из двух половин «тихой» двери.' },
    key_b: { n: 'Ключ с солнцем', d: 'Резной ключ с солнцем. Вторая половина «тихой» двери.' },
  };
  const TAKE = {
    cane: () => true, fuse1: (S) => S.f.drawer, crank: (S) => S.f.drawer, fuse2: (S) => S.f.clock, key_laundry: (S) => S.f.clock,
    desk_key: (S) => S.f.books, matches: (S) => S.f.desk, medal_a: (S) => S.f.safe, key_nursery: (S) => S.f.safe,
    record: (S) => S.f.tub, medal_b: (S) => S.f.tub, winding_key: (S) => S.f.dollhouse, crypt_key: (S) => S.f.music,
    attic_key: (S) => S.f.wardrobe, key_a: (S) => S.f.rings, key_b: (S) => S.f.levers,
  };
  function drawIcon(g, id, s) {
    g.clearRect(0, 0, s, s);
    const brass = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#f0d890'); gr.addColorStop(0.5, '#b08a3a'); gr.addColorStop(1, '#5a4214'); return gr; };
    const iron = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#9a9aa2'); gr.addColorStop(1, '#2a2a30'); return gr; };
    const key = (fill, bow, tag) => {
      g.fillStyle = fill; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.16, 0, TAU); g.fill();
      g.fillStyle = '#1a1612'; g.beginPath(); g.arc(s * 0.3, s * 0.5, s * 0.07, 0, TAU); g.fill();
      g.fillStyle = fill; g.fillRect(s * 0.42, s * 0.46, s * 0.46, s * 0.08); g.fillRect(s * 0.74, s * 0.54, s * 0.06, s * 0.12); g.fillRect(s * 0.84, s * 0.54, s * 0.05, s * 0.09);
      if (bow) { g.fillStyle = '#1a1612'; g.font = `${s * 0.16}px serif`; g.textAlign = 'center'; g.fillText(bow, s * 0.3, s * 0.56); }
      if (tag) { g.fillStyle = tag; g.save(); g.translate(s * 0.22, s * 0.28); g.rotate(-0.4); g.fillRect(-s * 0.08, -s * 0.12, s * 0.16, s * 0.2); g.restore(); }
    };
    switch (id) {
      case 'cane': g.strokeStyle = '#1a1414'; g.lineWidth = s * 0.08; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.25, s * 0.9); g.lineTo(s * 0.62, s * 0.25); g.stroke(); g.strokeStyle = '#d8ccb0'; g.beginPath(); g.arc(s * 0.72, s * 0.28, s * 0.11, Math.PI, Math.PI * 2.1); g.stroke(); break;
      case 'fuse1': case 'fuse2': g.fillStyle = iron(0, 0, s, 0); g.fillRect(s * 0.2, s * 0.4, s * 0.12, s * 0.2); g.fillRect(s * 0.68, s * 0.4, s * 0.12, s * 0.2); g.fillStyle = 'rgba(200,220,230,0.55)'; g.fillRect(s * 0.32, s * 0.38, s * 0.36, s * 0.24); g.strokeStyle = '#e8b04a'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 0.32, s * 0.5); for (let i = 0; i < 6; i++) g.lineTo(s * (0.35 + i * 0.06), s * (i % 2 ? 0.45 : 0.55)); g.stroke(); break;
      case 'crank': g.strokeStyle = iron(0, 0, s, s); g.lineWidth = s * 0.09; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.25, s * 0.75); g.lineTo(s * 0.25, s * 0.35); g.lineTo(s * 0.7, s * 0.35); g.lineTo(s * 0.7, s * 0.2); g.stroke(); g.fillStyle = '#5a3a22'; g.fillRect(s * 0.62, s * 0.08, s * 0.16, s * 0.14); break;
      case 'key_laundry': key(brass(0, 0, s, s), '', '#d8ccb0'); break;
      case 'desk_key': g.save(); g.translate(s * 0.15, s * 0.15); g.scale(0.7, 0.7); key(brass(0, 0, s, s)); g.restore(); break;
      case 'matches': g.fillStyle = '#7a2a1e'; g.fillRect(s * 0.2, s * 0.32, s * 0.6, s * 0.36); g.fillStyle = '#d8ccb0'; g.fillRect(s * 0.26, s * 0.4, s * 0.48, s * 0.2); g.fillStyle = '#1a1410'; g.font = `700 ${s * 0.1}px serif`; g.textAlign = 'center'; g.fillText('ГИГАНТ', s * 0.5, s * 0.54); break;
      case 'medal_a': case 'medal_b': case 'medal': {
        const half = id === 'medal' ? 0 : id === 'medal_a' ? -1 : 1;
        g.save(); g.beginPath(); if (half < 0) g.rect(0, 0, s / 2, s); else if (half > 0) g.rect(s / 2, 0, s / 2, s); else g.rect(0, 0, s, s); g.clip();
        g.fillStyle = iron(0, 0, s, s); g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.3, s * 0.36, 0, 0, TAU); g.fill();
        g.strokeStyle = '#d8d8e0'; g.lineWidth = 2; g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.24, s * 0.3, 0, 0, TAU); g.stroke();
        g.fillStyle = '#e8e0d0'; g.font = `${s * 0.16}px serif`; g.textAlign = 'center'; g.fillText('Л', s / 2, s * 0.56);
        g.restore(); break;
      }
      case 'key_nursery': key(brass(0, 0, s, s), '', '#9a8a9a'); break;
      case 'record': g.fillStyle = '#121012'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.38, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.12)'; for (let r = 0.12; r < 0.38; r += 0.04) { g.beginPath(); g.arc(s / 2, s / 2, s * r, 0, TAU); g.stroke(); } g.fillStyle = '#8a2a22'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.1, 0, TAU); g.fill(); break;
      case 'winding_key': g.fillStyle = brass(0, 0, s, s); for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(s / 2 + sx * s * 0.16, s * 0.35, s * 0.15, s * 0.1, sx * 0.5, 0, TAU); g.fill(); } g.fillRect(s * 0.46, s * 0.35, s * 0.08, s * 0.45); break;
      case 'crypt_key': key(iron(0, 0, s, s)); break;
      case 'attic_key': key(brass(0, 0, s, s), '', '#8a7a5a'); break;
      case 'key_a': key(brass(0, 0, s, s), '☾'); break;
      case 'key_b': key(brass(0, 0, s, s), '☀'); break;
    }
  }

  // ================= Иллюстрации улик =================
  const ink = (g) => { g.fillStyle = '#d8ccb0'; g.strokeStyle = '#d8ccb0'; };
  const IMG = {
    portrait: (g, w, h) => { A.familyPortrait(g, w, h); },
    wallclock: (g, w, h) => {
      g.fillStyle = '#0e0c0a'; g.fillRect(0, 0, w, h);
      const s = Math.min(w, h) * 0.8; g.save(); g.translate((w - s) / 2, (h - s) / 2); A.clockFace(3, 40)(g, s); g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; const cx = w / 2, cy = h / 2;
      for (let i = 0; i < 9; i++) { const a = i * 0.7; g.beginPath(); g.moveTo(cx + 10, cy - 20); g.lineTo(cx + 10 + Math.cos(a) * s * 0.4, cy - 20 + Math.sin(a) * s * 0.4); g.stroke(); }
    },
    gauges: (g, w, h, S) => {
      g.fillStyle = '#16120e'; g.fillRect(0, 0, w, h);
      const vals = [['☾', 2], ['✝', 7], ['☀', 5], ['✋', 1]], on = S.f.power;
      vals.forEach(([sym, v], i) => {
        const cx = w * (0.14 + i * 0.24), cy = h * 0.5, r = Math.min(w * 0.1, h * 0.36);
        g.fillStyle = '#7a5a26'; g.beginPath(); g.arc(cx, cy, r + 8, 0, TAU); g.fill();
        g.fillStyle = on ? '#d8ccb0' : '#4a4436'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
        g.fillStyle = '#2a2018'; g.font = `${r * 0.22}px Georgia`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let d = 0; d <= 9; d++) { const a = Math.PI * 0.75 + (d / 9) * Math.PI * 1.5; g.fillText(d, cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); }
        const a = Math.PI * 0.75 + ((on ? v : 0) / 9) * Math.PI * 1.5;
        g.strokeStyle = '#8a1e1e'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62); g.stroke();
        g.fillStyle = '#d8ccb0'; g.font = `${r * 0.5}px Georgia`; g.fillText(sym, cx, cy + r + r * 0.55);
      });
      g.textBaseline = 'alphabetic';
      if (!on) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, w, h); }
    },
    sheets: (g, w, h) => {
      g.fillStyle = '#121414'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#6a6458'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.12); g.lineTo(w, h * 0.12); g.stroke();
      const sh = [['#c9a03a', 'Л', 3], ['#a02a2a', 'С', 1], ['#2a4aa0', 'А', 4], ['#2a8a4a', 'М', 2]];
      sh.forEach(([c, l, n], i) => {
        const x = w * (0.04 + i * 0.24), sw = w * 0.2, sh2 = h * 0.78;
        g.fillStyle = '#b8b2a2'; g.beginPath(); g.moveTo(x, h * 0.12); g.lineTo(x + sw, h * 0.12); g.lineTo(x + sw - 6, h * 0.12 + sh2); g.quadraticCurveTo(x + sw / 2, h * 0.12 + sh2 + 12, x + 6, h * 0.12 + sh2); g.fill();
        g.fillStyle = 'rgba(60,40,20,0.25)'; g.fillRect(x + sw * 0.1, h * 0.5, sw * 0.6, h * 0.15);
        g.fillStyle = c; g.font = `italic 700 ${sw * 0.45}px Georgia`; g.textAlign = 'center'; g.fillText(l, x + sw / 2, h * 0.5);
        for (let k = 0; k < n; k++) { g.beginPath(); g.arc(x + sw / 2 - (n - 1) * 9 + k * 18, h * 0.66, 5, 0, TAU); g.fill(); }
        g.fillStyle = '#3a3630'; g.fillRect(x + sw * 0.15, h * 0.1, 6, 12); g.fillRect(x + sw * 0.8, h * 0.1, 6, 12);
      });
    },
    gowns: (g, w, h) => {
      g.fillStyle = '#121414'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4a4440'; g.fillRect(0, h * 0.08, w, 6);
      const gw = [['Гордеева А.', 3], ['Гордеева Е.', 8], ['Котова М.', 1], ['Гордеев С.', 5]];
      gw.forEach(([nm, n], i) => {
        const x = w * (0.13 + i * 0.245), y = h * 0.1, s = w * 0.11;
        g.fillStyle = '#9aa8a8'; g.beginPath(); g.moveTo(x - s * 0.4, y); g.lineTo(x + s * 0.4, y); g.lineTo(x + s, y + h * 0.18); g.lineTo(x + s * 0.8, y + h * 0.75); g.lineTo(x - s * 0.8, y + h * 0.75); g.lineTo(x - s, y + h * 0.18); g.fill();
        g.fillStyle = 'rgba(90,40,30,0.3)'; g.beginPath(); g.ellipse(x + s * 0.2, y + h * 0.55, s * 0.3, s * 0.5, 0.4, 0, TAU); g.fill();
        g.fillStyle = '#d8ccb0'; g.fillRect(x - s * 0.7, y + h * 0.3, s * 1.4, h * 0.14);
        g.fillStyle = '#1a1410'; g.textAlign = 'center'; g.font = `${s * 0.24}px 'PT Mono', monospace`; g.fillText(nm, x, y + h * 0.36); g.font = `700 ${s * 0.32}px 'PT Mono', monospace`; g.fillText('№ ' + n, x, y + h * 0.42);
      });
    },
    sleeve: (g, w, h) => {
      g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); A.paintDark(g, w, h * 0.0001);
      g.fillStyle = '#d6c8a6'; g.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
      g.fillStyle = '#1a1410'; g.beginPath(); g.arc(w * 0.5, h * 0.4, h * 0.26, 0, TAU); g.fill();
      g.fillStyle = '#8a2a22'; g.beginPath(); g.arc(w * 0.5, h * 0.4, h * 0.08, 0, TAU); g.fill();
      g.fillStyle = '#2a1e14'; g.textAlign = 'center'; g.font = `italic ${h * 0.07}px 'Cormorant Garamond', Georgia`; g.fillText('Колыбельная для Лизы', w / 2, h * 0.76);
      g.font = `${h * 0.045}px 'Marck Script', cursive`; g.fillText('(сыграть на органе в часовне)', w / 2, h * 0.82);
      g.font = `${h * 0.08}px Georgia`; g.fillText(LULLABY.join('  '), w / 2, h * 0.93);
    },
    glass: (g, w, h, S) => {
      const lit = S.f.candles, L = ['Т', 'Л', 'И', 'З', 'Ш', 'Е'], on = [1, 0, 1, 0, 1, 1];
      g.fillStyle = '#0a0808'; g.fillRect(0, 0, w, h);
      const cols = ['#5a1a2a', '#1a3a5a', '#3a4a1a', '#4a2a5a', '#5a3a1a', '#1a4a4a'];
      for (let i = 0; i < 6; i++) {
        const x = (i % 3) * w / 3, y = h * 0.1 + Math.floor(i / 3) * h * 0.42, pw = w / 3, ph = h * 0.4;
        const glow = lit && on[i];
        g.fillStyle = glow ? mixColor(cols[i], '#ffc070', 0.45) : cols[i]; g.fillRect(x + 6, y + 6, pw - 12, ph - 12);
        g.strokeStyle = '#0e0c0a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 6, y + ph * 0.3); g.lineTo(x + pw - 6, y + ph * 0.7); g.moveTo(x + pw * 0.4, y + 6); g.lineTo(x + pw * 0.6, y + ph - 6); g.stroke();
        A.figure(g, x + pw / 2, y + ph * 0.32, ph * 0.22, 'rgba(10,8,6,0.6)', glow ? '#f0e0b0' : '#2a2620');
        g.fillStyle = glow ? '#fff2c8' : 'rgba(30,26,22,0.9)'; g.font = `700 ${ph * 0.28}px 'Cormorant Garamond', Georgia`; g.textAlign = 'center';
        if (glow) { g.shadowColor = '#ffb050'; g.shadowBlur = 20; }
        g.fillText(lit ? L[i] : '?', x + pw / 2, y + ph * 0.9); g.shadowBlur = 0;
      }
      g.fillStyle = '#d8ccb0'; g.font = `${h * 0.045}px 'Cormorant Garamond', Georgia`; g.textAlign = 'center';
      g.fillText(lit ? 'Свет свечей проходит только через часть стёкол' : 'Слишком темно — витраж не просвечивает', w / 2, h * 0.07);
    },
    mosaic: (g, w, h) => {
      g.fillStyle = '#1a1c1a'; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.54, R = Math.min(w, h) * 0.42;
      const cols = ['#3a3428', '#2a3034', '#342a2a'];
      RING.forEach((ring, ri) => {
        const r0 = R * (1 - ri * 0.3), r1 = r0 - R * 0.28;
        g.fillStyle = cols[ri]; g.beginPath(); g.arc(cx, cy, r0, 0, TAU); g.arc(cx, cy, r1, 0, TAU, true); g.fill();
        g.strokeStyle = '#6a6250'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r0, 0, TAU); g.stroke();
        const top = ring.indexOf(RING_GOAL[ri]);
        ring.forEach((sym, k) => {
          const a = -Math.PI / 2 + ((k - top) / 6) * TAU, rr = (r0 + r1) / 2;
          g.fillStyle = k === top ? '#e8c87a' : '#8a8270'; g.font = `${R * 0.13}px Georgia`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(sym, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        });
      });
      g.fillStyle = '#8a1e1e'; g.beginPath(); g.moveTo(cx, cy - R - 4); g.lineTo(cx - 14, cy - R - 26); g.lineTo(cx + 14, cy - R - 26); g.fill();
      g.textBaseline = 'alphabetic';
      for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
    },
    tally: (g, w, h) => {
      g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(20,12,6,${0.3 + Math.random() * 0.3})`; g.lineWidth = 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 10); g.stroke(); }
      g.fillStyle = '#e8e2d4'; g.font = `${h * 0.32}px 'Cormorant Garamond', Georgia`; g.textAlign = 'center';
      ['III', 'I', 'IV', 'II'].forEach((t, i) => g.fillText(t, w * (0.14 + i * 0.24), h * 0.6));
      g.font = `${h * 0.1}px 'Marck Script', cursive`; g.fillText('рычаги — так и только так', w / 2, h * 0.88);
    },
    drawings: (g, w, h) => {
      g.fillStyle = '#1a1612'; g.fillRect(0, 0, w, h);
      g.save(); g.translate(w * 0.05, h * 0.08); A.childDrawing(g, w * 0.42, h * 0.84, 3); g.restore();
      g.save(); g.translate(w * 0.53, h * 0.08);
      g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w * 0.42, h * 0.84);
      A.stick(g, w * 0.12, h * 0.5, h * 0.06, '#2a2a6a'); A.stick(g, w * 0.3, h * 0.5, h * 0.06, '#6a2a2a');
      g.fillStyle = '#111'; g.fillRect(w * 0.18, h * 0.62, w * 0.06, h * 0.12);
      g.fillStyle = '#2a2a2a'; g.font = `${h * 0.05}px Comfortaa`; g.textAlign = 'center'; g.fillText('ПРИДУТ ДВОЕ', w * 0.21, h * 0.8);
      g.restore();
    },
  };

  // ================= Документы =================
  const DOCS = {
    letter: { t: 'Письмо без обратного адреса', k: 'hand', text: 'Пансион «Вереск», Туманный Лог.\n\nПриезжайте вдвоём. Одному здесь нельзя — дом не отпустит.\nОна всё ещё ждёт.\n\n— М.' },
    portrait: { t: 'Семейный портрет', k: 'img', img: 'portrait', cap: 'Латунная табличка под рамой:\n«Семья Гордеевых. Савелий Ильич, Анна Сергеевна и Елизавета, 8 лет.\nПисано осенью 1978 года.»\n\nЛицо девочки перечёркнуто красным — поверх лака, недавно.' },
    guestbook: { t: 'Книга постояльцев', k: 'paper', text: '12 окт. 1979 — комн. 3, Н. Ершов, агроном. «Тихо у вас. Даже слишком.»\n\n29 окт. 1979 — комн. 5, семья Литвиновых. Уехали ночью, не расплатившись. Девочка Литвиновых плакала, говорила, что под полом кто-то поёт.\n\n14 нояб. 1979 — (почерк Марфы) Хозяин велел больше не принимать гостей. Лизонька третий день не спускается к завтраку.\n\n17 нояб. 1979 — (почерк Марфы, неровно) Котёл гудит всю ночь. Хозяин говорит — так надо. Так ей лучше спится.\n\nДальше страницы пустые. Только на последней, карандашом: «простите меня».' },
    note_m: { t: 'Записка на полу котельной', k: 'hand', text: 'Не включайте котёл после полуночи.\nОн говорит, она не спит, пока гудят трубы.\nОн говорит, это лечение.\n\nЯ ему больше не верю.\n\n— М.' },
    drawer_tag: { t: 'Гравировка на замке ящика', k: 'paper', text: '«Л. — год рождения.\nТри последние цифры.»' },
    wallclock: { t: 'Часы котельной', k: 'img', img: 'wallclock', cap: 'Стекло разбито. Стрелки замерли и больше не двигаются.' },
    gauges: { t: 'Манометры котла', k: 'img', img: 'gauges', cap: 'Под каждым манометром — выбитый в металле символ.' },
    journal: { t: 'Журнал доктора Гордеева', k: 'typed', text: '3 сент. 1979. Метод глубокого сна даёт результаты. Пациенты спокойны, сны управляемы.\n\n20 сент. Решился провести сеансы в семье. Порядок сеансов строгий: сперва Анна, затем Елизавета, затем Марфа. Себя — последним.\nКаждому — свой номер, свой халат, своя запись.\n\n2 окт. Лиза видит во сне коридор между этажами. Говорит, там кто-то ждёт. Это лишь образ. Это лишь образ.\n\n19 окт. Анна просит прекратить. Анна не понимает.\n\n15 нояб. Нужна полная тишина. Без неё сон обрывается. Номера сеансов — ключ ко всему. Сейф запираю по ним.' },
    anna: { t: 'Письмо Анны', k: 'hand', text: 'Сава,\n\nона больше не плачет. Она больше не говорит.\nОна только смотрит в пол, как будто слушает, что под ним.\n\nВерни мне дочь.\nВерни мне дочь.\nВерни мне дочь.\n\n— А.' },
    sheets: { t: 'Простыни на верёвке', k: 'img', img: 'sheets', cap: 'На каждой — вышитая буква и несколько стежков-точек. Нитки разного цвета.' },
    gowns: { t: 'Больничные халаты', k: 'img', img: 'gowns', cap: 'Пришитые бирки с фамилиями и номерами. Пахнет хлоркой и чем-то сладким.' },
    sleeve: { t: 'Конверт пластинки', k: 'img', img: 'sleeve', cap: 'Пока пластинка играет, сквозь треск слышна колыбельная. Каждая нота — свой символ.' },
    diary: { t: 'Страница из дневника Лизы', k: 'child', text: 'Мой домик.\n\nПапу я посадила в кабинет, он там всегда.\nМаму — в спальню, она там плачет.\nМарфу — на кухню, у неё пирожки.\nА себя я спрятала на самый верх, под крышу.\nТам меня никто не найдёт.\nНикто-никто.' },
    drawings: { t: 'Рисунки на стене', k: 'img', img: 'drawings', cap: 'Детские рисунки цветными карандашами. На одном дом, и между этажами — чёрная комната.' },
    glass: { t: 'Витраж', k: 'img', img: 'glass', cap: '' },
    wardrobe: { t: 'Внутри шкафа', k: 'child', text: 'Стенки исцарапаны изнутри. Палочки, палочки, палочки — сотни.\nИ надпись, очень мелко:\n\nПапа сказал: если я буду тихо, он откроет.\nЯ тихо. Я очень тихо.\nЯ так тихо, что меня не слышно даже мне.' },
    niches: { t: 'Таблички в склепе', k: 'paper', text: 'ИЛЬЯ ГОРДЕЕВ · 1891 — 1955\n\nВЕРА ГОРДЕЕВА · 1899 — 1961\n\nАННА ГОРДЕЕВА · 1946 — 1980\n\nЕЛИЗАВЕТА ГОРДЕЕВА · 1970 —\n\nУ последней таблички нет второй даты. Ниша за ней пуста — и в ней чисто, будто её только что вымели.' },
    mosaic: { t: 'Мозаика на полу склепа', k: 'img', img: 'mosaic', cap: 'Три каменных кольца. Красная стрелка указывает вверх — на три символа, выложенных светлым камнем.' },
    tally: { t: 'Мел на балке', k: 'img', img: 'tally', cap: 'Римские цифры, выведенные мелом. Под ними — подпись дрожащей рукой.' },
    confession: { t: 'Последняя запись доктора', k: 'typed', text: 'Я запер её в тихой комнате, между этажами. Только на одну ночь — чтобы сон стал глубоким.\n\nЯ спустился утром. Она спала. Она спит до сих пор.\nЯ слышу её каждую ночь — как она тихо.\n\nКто бы вы ни были — откройте ей дверь.\nКлючей два: один наверху, другой внизу. Повернуть их нужно одновременно, с двух сторон.\nЯ один. Я не смог.\n\nС. Г., 1980' },
    radio: { t: 'Радиоприёмник', k: 'typed', text: '...ш-ш-ш... говорит Туманный Лог... ш-ш... в связи с туманом... ш-ш-ш... не выходите из домов...\n\n...ш-ш... если вы слышите это — не спите. Она поёт, только когда все спят...\n\n...ш-ш-ш-ш-ш...' },
  };

  // ================= Логика хоста =================
  const has = (S, who, it) => S.inv[who].includes(it);
  const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
  const ok = (who, msg, snd = 'open') => ({ a: 'ok', who, msg, snd });
  const bad = (who) => ({ a: 'wrong', who });
  const UNLOCK = { laundry: 'key_laundry', nursery: 'key_nursery', attic: 'attic_key', passage: 'crypt_key' };
  const ACT = {
    take(S, who, it) { if (!TAKE[it] || S.f['t_' + it] || !TAKE[it](S)) return null; S.f['t_' + it] = 1; S.inv[who].push(it); return { a: 'take', who, it }; },
    drawer(S, who, v) { if (S.f.drawer) return null; if (v === '970') { S.f.drawer = 1; return ok(who, 'Замок щёлкнул. Ящик выдвинулся.', 'drawer'); } return bad(who); },
    crank(S, who) { if (S.f.crank || !has(S, who, 'crank')) return null; rm(S, who, 'crank'); S.f.crank = 1; return { a: 'crank', who }; },
    clock(S, who, v) { if (S.f.clock) return null; if (v && v.h === 3 && v.m === 40) { S.f.clock = 1; return ok(who, 'Часы пробили один раз. Дверца корпуса открылась.', 'chime'); } return bad(who); },
    fuse(S, who, it) {
      if (!['fuse1', 'fuse2'].includes(it) || !has(S, who, it)) return null;
      rm(S, who, it); S.f['fs_' + it] = 1;
      if (S.f.fs_fuse1 && S.f.fs_fuse2) { S.f.power = 1; return { a: 'power', who }; }
      return ok(who, 'Предохранитель встал в гнездо.', 'click');
    },
    keypad(S, who, v) { if (!S.f.power || S.f.study) return null; if (v === '7512') { S.f.study = 1; return ok(who, 'Замок кабинета щёлкнул.', 'door'); } return bad(who); },
    unlock(S, who, door) { const need = UNLOCK[door]; if (!need || S.f[door] || !has(S, who, need)) return null; rm(S, who, need); S.f[door] = 1; return ok(who, 'Ключ повернулся.', 'door'); },
    books(S, who, v) { if (S.f.books) return null; if (Array.isArray(v) && v.join() === 'red,green,gold,blue') { S.f.books = 1; return ok(who, 'За книгами что-то щёлкнуло. Открылся тайник.', 'mech'); } return bad(who); },
    desk(S, who) { if (S.f.desk || !has(S, who, 'desk_key')) return null; rm(S, who, 'desk_key'); S.f.desk = 1; return ok(who, 'Ящик стола открыт.', 'drawer'); },
    painting(S) { if (S.f.painting) return null; S.f.painting = 1; return { a: 'ok', who: null, snd: 'creak' }; },
    safe(S, who, v) { if (S.f.safe || !S.f.painting) return null; if (v === '3815') { S.f.safe = 1; return ok(who, 'Сейф открылся с тяжёлым вздохом.', 'mech'); } return bad(who); },
    phono(S, who) { if (S.f.phono || !has(S, who, 'record')) return null; rm(S, who, 'record'); S.f.phono = 1; return { a: 'lullaby', who, src: 'phono' }; },
    replay(S, who) { return S.f.phono ? { a: 'lullaby', who, src: 'phono' } : null; },
    tub(S, who) { if (S.f.tub || !has(S, who, 'cane')) return null; rm(S, who, 'cane'); S.f.tub = 1; return ok(who, 'Крюк зацепил цепочку. Чёрная вода с бульканьем уходит.', 'drain'); },
    combine(S, who) { if (!has(S, who, 'medal_a') || !has(S, who, 'medal_b')) return null; rm(S, who, 'medal_a'); rm(S, who, 'medal_b'); S.inv[who].push('medal'); return ok(who, 'Половинки сошлись с тихим щелчком.', 'click'); },
    chapel(S, who) { if (S.f.chapel || !has(S, who, 'medal')) return null; rm(S, who, 'medal'); S.f.chapel = 1; return ok(who, 'Медальон лёг в углубление. Железная дверь поползла в сторону.', 'door'); },
    candles(S, who) { if (S.f.candles || !has(S, who, 'matches')) return null; rm(S, who, 'matches'); S.f.candles = 1; return ok(who, 'Свечи разгорелись. Витраж над алтарём ожил.', 'fire'); },
    organ(S, who, v) { if (S.f.crypt) return null; if (Array.isArray(v) && v.join('') === LULLABY.join('')) { S.f.crypt = 1; return { a: 'organ', who }; } return bad(who); },
    dollhouse(S, who, v) { if (S.f.dollhouse) return null; if (v && v.study === 'papa' && v.bedroom === 'mama' && v.kitchen === 'marfa' && v.attic === 'liza') { S.f.dollhouse = 1; return ok(who, 'Крыша кукольного домика приподнялась.', 'mech'); } return bad(who); },
    music(S, who) { if (S.f.music || !has(S, who, 'winding_key')) return null; rm(S, who, 'winding_key'); S.f.music = 1; return { a: 'musicbox', who }; },
    wardrobe(S, who, v) { if (S.f.wardrobe) return null; if (v === 'ТИШЕ') { S.f.wardrobe = 1; return ok(who, 'Замок поддался. Створки шкафа медленно разошлись.', 'creak'); } return bad(who); },
    rings(S, who, v) { if (S.f.rings) return null; if (Array.isArray(v) && v.every((k, i) => RING[i][k] === RING_GOAL[i])) { S.f.rings = 1; return ok(who, 'Кольца сошлись. Крышка сундука откинулась.', 'mech'); } return bad(who); },
    levers(S, who, v) { if (S.f.levers) return null; if (Array.isArray(v) && v.join() === '3,1,4,2') { S.f.levers = 1; return ok(who, 'Где-то в стене сдвинулся камень.', 'mech'); } return bad(who); },
    insert(S, who) { const k = who === 'up' ? 'key_a' : 'key_b', f = who === 'up' ? 'insA' : 'insB'; if (S.f[f] || !has(S, who, k)) return null; rm(S, who, k); S.f[f] = 1; return ok(who, 'Ключ вошёл в скважину до упора.', 'click'); },
    dw_put(S, who, it) { if (!S.f.crank && who === 'up') return null; if (S.dw.pos !== who || !has(S, who, it)) return null; rm(S, who, it); S.dw.items.push(it); return { a: 'dwput', who }; },
    dw_take(S, who, it) { if (S.dw.pos !== who || !S.dw.items.includes(it)) return null; S.dw.items.splice(S.dw.items.indexOf(it), 1); S.inv[who].push(it); return { a: 'take', who, it }; },
    dw_send(S, who) { if (!S.f.crank || S.dw.pos !== who) return null; S.dw.pos = who === 'up' ? 'down' : 'up'; return { a: 'dw', to: S.dw.pos, n: S.dw.items.length }; },
    dw_call(S, who) { if (!S.f.crank || S.dw.pos === who) return null; S.dw.pos = who; return { a: 'dw', to: who, n: S.dw.items.length, called: true }; },
  };
  const chapterOf = (S) => (S.f.study && S.f.laundry ? (S.f.nursery && S.f.chapel ? (S.f.attic && S.f.passage ? 4 : 3) : 2) : 1);

  // ================= Подсказки =================
  const HINTS = [
    [(S) => !S.f.drawer, 'Внизу ящик верстака заперт: «Л. — год рождения». Наверху в холле висит семейный портрет с табличкой — посчитайте.', 'Ящик верстака: «Л. — год рождения, три последние цифры». Спросите, что написано под портретом наверху.'],
    [(S) => !S.f.crank, 'Кухонный лифт не двигается. Внизу нет рукояти механизма — она в ящике верстака.', 'В ящике была рукоять. Подойдите к кухонному лифту и вставьте её в механизм.'],
    [(S) => !S.f.clock, 'Напольные часы остановились. Внизу на стене есть другие часы — на каком времени они замерли?', 'Часы на стене котельной замерли. Скажите их время тому, кто наверху.'],
    [(S) => !S.f.power, 'Из часов выпали предохранитель и ключ. Положите их в кухонный лифт и отправьте вниз.', 'В щитке не хватает двух предохранителей. Один в ящике верстака, второй — у того, кто наверху (через лифт).'],
    [(S) => !S.f.study, 'Кодовая панель кабинета: символы ✝ ☀ ✋ ☾ над ячейками. Цифры к символам — на манометрах котла внизу.', 'Манометры на котле: под каждым символ, стрелка показывает цифру. Продиктуйте наверх.'],
    [(S) => !S.f.laundry, 'Ключ «Прачечная» — для двери внизу. Отправьте его лифтом.', 'Дверь в прачечную открывает ключ, найденный наверху в часах.'],
    [(S) => !S.f.books, 'Книжный шкаф: надо вытащить 4 книги в правильном порядке цветов. Внизу на простынях — цвета и стежки.', 'Простыни в прачечной: цвет вышивки и число стежков. Стежки — это порядок. Расскажите наверх.'],
    [(S) => !S.f.desk, 'Маленький ключ из тайника открывает ящик письменного стола.', 'Наверху нашли маленький ключ — он для стола в кабинете.'],
    [(S) => !S.f.tub, 'Внизу в ванне что-то лежит, но рукой не достать. В холле стоит трость с крюком — отправьте её лифтом.', 'В ванне на дне что-то блестит. Нужен крюк — наверху в холле есть трость.'],
    [(S) => !S.f.safe, 'Сейф за портретом доктора. Журнал говорит порядок: Анна, Елизавета, Марфа, сам доктор. Номера — на халатах внизу.', 'Халаты в прачечной: фамилии и номера. Продиктуйте наверх — там знают порядок.'],
    [(S) => !S.f.chapel, 'Половина медальона из сейфа — отправьте её вниз. Вторая половина там.', 'Соедините половинки медальона (нажмите на предмет) и вставьте в железную дверь.'],
    [(S) => !S.f.nursery, 'Ключ «Детская» из сейфа открывает дверь из кабинета.', 'Наверху открывают детскую. Пока изучите часовню.'],
    [(S) => !S.f.phono, 'Пластинка со дна ванны — для граммофона в кабинете. Попросите отправить её наверх.', 'Пластинку из ванны отправьте наверх лифтом — там есть граммофон.'],
    [(S) => !S.f.crypt, 'Граммофон: на конверте пластинки — мелодия символами. Продиктуйте её вниз.', 'Орган в часовне. Мелодию знает тот, кто наверху, — на конверте пластинки.'],
    [(S) => !S.f.candles, 'Спички из стола в кабинете нужны внизу — для свечей в часовне.', 'Свечи на алтаре. Спички — наверху, в ящике стола.'],
    [(S) => !S.f.dollhouse, 'Кукольный домик: расставьте кукол по комнатам. Внизу в часовне лежит страница дневника Лизы.', 'Страница из дневника Лизы на скамье — прочитайте её наверх.'],
    [(S) => !S.f.music, 'Заводной ключик из домика — для музыкальной шкатулки.', 'Наверху заводят шкатулку. Ждите — в ней кое-что для вас.'],
    [(S) => !S.f.wardrobe, 'Шкаф заперт на 4 буквы. Внизу витраж — при свечах светятся не все буквы.', 'Витраж над алтарём: какие буквы светятся при свечах? Слева направо, сверху вниз.'],
    [(S) => !S.f.passage, 'Железный ключ из шкатулки нужен внизу — для решётки в склепе.', 'Решётку в склепе открывает железный ключ — он наверху, в шкатулке.'],
    [(S) => !S.f.attic, 'Ключ из шкафа — от люка на чердак в детской.', 'Наверху поднимаются на чердак.'],
    [(S) => !S.f.rings, 'Сундук с тремя кольцами. Нужное положение колец выложено мозаикой на полу склепа внизу.', 'Мозаика в склепе: какие символы наверху у каждого кольца? Расскажите.'],
    [(S) => !S.f.levers, 'На балке на чердаке — мелом порядок рычагов. Продиктуйте вниз.', 'Четыре рычага. Порядок знает тот, кто наверху, — на балке под крышей.'],
    [(S) => !(S.f.insA && S.f.insB), 'Тихая комната — под люком в полу чердака. Вставьте ключ с луной.', 'Тихая комната — наверху по лестнице в проходе. Вставьте ключ с солнцем.'],
    [() => true, 'Поверните ключи одновременно: «три, два, один — сейчас!»', 'Поверните ключи одновременно: «три, два, один — сейчас!»'],
  ];

  return { SYMS, PITCH, LULLABY, RING, RING_GOAL, BOOKS, DOLLS, DROOMS, ITEMS, TAKE, IMG, DOCS, ACT, chapterOf, HINTS, drawIcon, has };
})();
