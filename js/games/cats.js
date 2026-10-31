'use strict';
// «Кошачий турнир» — оба тайно выбирают кота, карты переворачиваются одновременно. У каждого кота своё умение.
(() => {
  const CATS = [
    null,
    { v: 1, name: 'Котёнок', fur: '#f4c99d', fur2: '#e2a873', eye: '#5fb7ff', acc: 'bow', ab: 'Побеждает Льва' },
    { v: 2, name: 'Соня', fur: '#c4bcd6', fur2: '#a49bbb', eye: '#9b8cff', acc: 'cap', sleepy: true, ab: 'Если проиграла — вернётся в руку' },
    { v: 3, name: 'Воришка', fur: '#76768a', fur2: '#55556a', eye: '#ffd36b', acc: 'mask', ab: 'Если победил — крадёт 2 очка' },
    { v: 4, name: 'Двойник', fur: '#a98ee0', fur2: '#8a6fcb', eye: '#7dffd2', acc: 'swirl', ab: 'Сила такая же, как у кота соперника' },
    { v: 5, name: 'Рыбак', fur: '#eba663', fur2: '#cf8540', eye: '#6bd66b', acc: 'hat', stripes: true, ab: 'Выигранная рыба +2' },
    { v: 6, name: 'Пушистик', fur: '#fbf6ee', fur2: '#e9dfd0', eye: '#7ab6ff', acc: 'none', fluffy: true, ab: 'Без умения. Зато какой милый!' },
    { v: 7, name: 'Счастливчик', fur: '#2e2d38', fur2: '#1d1c25', eye: '#9dff6b', acc: 'clover', ab: 'При ничьей побеждает' },
    { v: 8, name: 'Укротитель', fur: '#cf9563', fur2: '#ad7442', eye: '#5fb7ff', acc: 'tophat', stripes: true, ab: 'Собаку забирает соперник' },
    { v: 9, name: 'Ниндзя', fur: '#3d3d4c', fur2: '#2a2a36', eye: '#ff6b8a', acc: 'ninja', ab: 'Против 10, 11, 12 — сила 13' },
    { v: 10, name: 'Капитан', fur: '#ded6c4', fur2: '#c5b99f', eye: '#5fb7ff', acc: 'captain', spots: true, ab: 'Без умения. Надёжный' },
    { v: 11, name: 'Королева', fur: '#f6d6e6', fur2: '#e5b3cc', eye: '#b06bff', acc: 'tiara', fluffy: true, ab: 'Выигранный приз ×2' },
    { v: 12, name: 'Лев', fur: '#ecba55', fur2: '#c98f2a', eye: '#a5622a', acc: 'mane', ab: 'Самый сильный. Но боится котят' },
  ];
  // призы: рыбки и собаки
  const PRIZES = [
    { id: 'f1', v: 1 }, { id: 'f2', v: 2 }, { id: 'f3', v: 3 }, { id: 'f4', v: 4 }, { id: 'f5', v: 5 }, { id: 'f6', v: 6 }, { id: 'f7', v: 7 }, { id: 'f8', v: 8 }, { id: 'g10', v: 10, gold: true },
    { id: 'd2', v: -2 }, { id: 'd3', v: -3 }, { id: 'd5', v: -5 },
  ];
  const MODS = {
    none: { icon: '☀️', name: 'Обычный день', desc: 'Никаких сюрпризов' },
    fish: { icon: '🐟', name: 'Рыбный праздник', desc: 'Каждая рыбка +1' },
    dogs: { icon: '🐶', name: 'Собачий день', desc: 'Две маленькие рыбки стали собаками' },
    fog: { icon: '🌫️', name: 'Туман', desc: 'Приз не видно, пока карты не откроются' },
    flip: { icon: '🙃', name: 'Наоборот', desc: 'Рыбу берёт слабейший, собаку — сильнейший' },
    bank: { icon: '💰', name: 'Жадный банк', desc: 'При ничьей банк удваивается' },
  };
  const prizeOf = (id) => PRIZES.find((p) => p.id === id) || { id, v: id.startsWith('x') ? -4 : 0 };

  // ---------- Рисунки карт ----------
  function drawCat(g, cx, cy, s, c, t = 0) {
    g.save(); g.translate(cx, cy);
    const ear = (sx) => {
      g.fillStyle = c.fur2; g.beginPath(); g.moveTo(sx * s * 0.82, -s * 0.35); g.lineTo(sx * s * 0.62, -s * 1.12); g.lineTo(sx * s * 0.12, -s * 0.78); g.closePath(); g.fill();
      g.fillStyle = '#ffb3c8'; g.beginPath(); g.moveTo(sx * s * 0.66, -s * 0.48); g.lineTo(sx * s * 0.58, -s * 0.92); g.lineTo(sx * s * 0.3, -s * 0.72); g.closePath(); g.fill();
    };
    // грива льва
    if (c.acc === 'mane') {
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; g.fillStyle = i % 2 ? '#c46a1e' : '#e08a2e'; g.beginPath(); g.ellipse(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.85 + s * 0.05, s * 0.42, s * 0.3, a, 0, TAU); g.fill(); }
    }
    // тело
    const bg = g.createLinearGradient(0, s * 0.5, 0, s * 2); bg.addColorStop(0, c.fur); bg.addColorStop(1, c.fur2);
    g.fillStyle = bg; g.beginPath(); g.ellipse(0, s * 1.35, s * 0.85, s * 0.75, 0, Math.PI, 0); g.lineTo(s * 0.85, s * 2.1); g.lineTo(-s * 0.85, s * 2.1); g.closePath(); g.fill();
    g.fillStyle = hexA('#ffffff', 0.35); g.beginPath(); g.ellipse(0, s * 1.55, s * 0.4, s * 0.45, 0, 0, TAU); g.fill();
    // хвост
    g.strokeStyle = c.fur2; g.lineWidth = s * 0.22; g.lineCap = 'round';
    g.beginPath(); g.moveTo(s * 0.7, s * 1.9); g.quadraticCurveTo(s * 1.45, s * 1.6, s * 1.2, s * (0.9 + Math.sin(t * 2) * 0.08)); g.stroke();
    ear(-1); ear(1);
    // голова
    const hg = g.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, 0, s * 1.1); hg.addColorStop(0, mixColor(c.fur, '#ffffff', 0.3)); hg.addColorStop(1, c.fur);
    g.fillStyle = hg; g.beginPath(); g.ellipse(0, 0, s * 0.95, s * 0.82, 0, 0, TAU); g.fill();
    if (c.fluffy) for (let i = 0; i < 10; i++) { const a = Math.PI * 0.15 + (i / 9) * Math.PI * 0.7; g.fillStyle = c.fur; g.beginPath(); g.arc(Math.cos(a) * s * 0.88, Math.sin(a) * s * 0.74, s * 0.16, 0, TAU); g.fill(); }
    if (c.stripes) { g.strokeStyle = hexA(c.fur2, 0.9); g.lineWidth = s * 0.08; for (const dx of [-0.22, 0, 0.22]) { g.beginPath(); g.moveTo(dx * s, -s * 0.8); g.lineTo(dx * s * 0.8, -s * 0.5); g.stroke(); } for (const sx of [-1, 1]) for (const dy of [0, 0.18]) { g.beginPath(); g.moveTo(sx * s * 0.95, dy * s); g.lineTo(sx * s * 0.68, dy * s + s * 0.04); g.stroke(); } }
    if (c.spots) { g.fillStyle = hexA('#8a6a4a', 0.6); g.beginPath(); g.ellipse(-s * 0.45, -s * 0.4, s * 0.3, s * 0.22, -0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(s * 0.55, s * 0.3, s * 0.18, s * 0.14, 0.3, 0, TAU); g.fill(); }
    // маска воришки / ниндзя
    if (c.acc === 'mask') { g.fillStyle = '#1c1b26'; roundRect(g, -s * 0.85, -s * 0.32, s * 1.7, s * 0.38, s * 0.18); g.fill(); }
    if (c.acc === 'ninja') {
      g.fillStyle = '#16151f'; g.beginPath(); g.ellipse(0, -s * 0.25, s * 0.98, s * 0.62, 0, Math.PI, 0); g.fill();
      g.beginPath(); g.ellipse(0, s * 0.35, s * 0.96, s * 0.5, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#d94a6a'; g.fillRect(-s * 0.95, -s * 0.48, s * 1.9, s * 0.13);
      g.strokeStyle = '#d94a6a'; g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(s * 0.9, -s * 0.42); g.quadraticCurveTo(s * 1.3, -s * 0.3, s * 1.35, -s * 0.05 + Math.sin(t * 4) * s * 0.05); g.stroke();
    }
    // глаза
    for (const sx of [-1, 1]) {
      const ex = sx * s * 0.36, ey = -s * 0.12;
      if (c.sleepy) { g.strokeStyle = '#3a2f4a'; g.lineWidth = s * 0.07; g.beginPath(); g.arc(ex, ey - s * 0.02, s * 0.15, 0.2, Math.PI - 0.2); g.stroke(); continue; }
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, s * 0.2, s * 0.23, 0, 0, TAU); g.fill();
      g.fillStyle = c.eye; g.beginPath(); g.ellipse(ex, ey + s * 0.02, s * 0.15, s * 0.19, 0, 0, TAU); g.fill();
      g.fillStyle = '#1b1426'; g.beginPath(); g.ellipse(ex, ey + s * 0.03, s * (c.acc === 'ninja' ? 0.04 : 0.08), s * 0.15, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - s * 0.06, ey - s * 0.07, s * 0.055, 0, TAU); g.fill();
    }
    if (c.acc !== 'ninja') {
      g.fillStyle = '#ff8fab'; g.beginPath(); g.moveTo(-s * 0.08, s * 0.12); g.lineTo(s * 0.08, s * 0.12); g.lineTo(0, s * 0.22); g.closePath(); g.fill();
      g.strokeStyle = '#4a3448'; g.lineWidth = s * 0.045; g.lineCap = 'round';
      g.beginPath(); g.arc(-s * 0.09, s * 0.24, s * 0.09, 0.1, Math.PI - 0.3); g.stroke(); g.beginPath(); g.arc(s * 0.09, s * 0.24, s * 0.09, 0.3, Math.PI - 0.1); g.stroke();
      g.fillStyle = 'rgba(255,120,150,0.35)'; g.beginPath(); g.ellipse(-s * 0.55, s * 0.18, s * 0.14, s * 0.08, 0, 0, TAU); g.ellipse(s * 0.55, s * 0.18, s * 0.14, s * 0.08, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = s * 0.025;
      for (const sx of [-1, 1]) for (const dy of [-0.04, 0.06]) { g.beginPath(); g.moveTo(sx * s * 0.3, s * 0.18 + dy * s); g.lineTo(sx * s * 1.05, s * 0.1 + dy * s * 2.5); g.stroke(); }
    }
    // аксессуары
    const acc = c.acc;
    if (acc === 'bow') { g.fillStyle = '#ff6b9c'; g.beginPath(); g.moveTo(s * 0.35, -s * 0.72); g.lineTo(s * 0.05, -s * 0.92); g.lineTo(s * 0.05, -s * 0.52); g.closePath(); g.moveTo(s * 0.35, -s * 0.72); g.lineTo(s * 0.65, -s * 0.92); g.lineTo(s * 0.65, -s * 0.52); g.closePath(); g.fill(); g.beginPath(); g.arc(s * 0.35, -s * 0.72, s * 0.09, 0, TAU); g.fill(); }
    if (acc === 'cap') { g.fillStyle = '#6b7bd6'; g.beginPath(); g.moveTo(-s * 0.85, -s * 0.5); g.quadraticCurveTo(0, -s * 1.3, s * 0.95, -s * 1.15); g.quadraticCurveTo(s * 0.4, -s * 0.6, s * 0.85, -s * 0.5); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.98, -s * 1.12, s * 0.14, 0, TAU); g.fill(); g.font = `700 ${s * 0.3}px Comfortaa`; g.fillStyle = '#d9d4ff'; g.fillText('z', s * 0.9, -s * 1.35); g.fillText('z', s * 1.15, -s * 1.6); }
    if (acc === 'swirl') { g.strokeStyle = '#7dffd2'; g.lineWidth = s * 0.06; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.35 + t, r = s * 0.02 * i; i ? g.lineTo(Math.cos(a) * r, -s * 1.05 + Math.sin(a) * r * 0.5) : g.moveTo(0, -s * 1.05); } g.stroke(); }
    if (acc === 'hat') { g.fillStyle = '#e8d38a'; g.beginPath(); g.ellipse(0, -s * 0.72, s * 0.95, s * 0.18, 0, 0, TAU); g.fill(); g.fillStyle = '#d9bf62'; g.beginPath(); g.ellipse(0, -s * 0.85, s * 0.5, s * 0.35, 0, Math.PI, 0); g.fill(); g.fillStyle = '#5fb7ff'; g.beginPath(); g.ellipse(s * 0.25, -s * 0.95, s * 0.16, s * 0.07, 0, 0, TAU); g.fill(); }
    if (acc === 'clover') { g.fillStyle = '#6bdc6b'; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.3; g.beginPath(); g.arc(s * 0.55 + Math.cos(a) * s * 0.12, -s * 0.72 + Math.sin(a) * s * 0.12, s * 0.11, 0, TAU); g.fill(); } }
    if (acc === 'tophat') { g.fillStyle = '#2a2236'; g.fillRect(-s * 0.42, -s * 1.45, s * 0.84, s * 0.75); g.beginPath(); g.ellipse(0, -s * 0.72, s * 0.75, s * 0.14, 0, 0, TAU); g.fill(); g.fillStyle = '#d94a6a'; g.fillRect(-s * 0.42, -s * 0.92, s * 0.84, s * 0.12); }
    if (acc === 'captain') { g.fillStyle = '#f4f4f8'; g.beginPath(); g.ellipse(0, -s * 0.85, s * 0.8, s * 0.32, 0, Math.PI, 0); g.fill(); g.fillStyle = '#1f2a5a'; g.fillRect(-s * 0.8, -s * 0.88, s * 1.6, s * 0.16); g.beginPath(); g.ellipse(s * 0.1, -s * 0.72, s * 0.62, s * 0.1, 0, 0, Math.PI); g.fill(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(0, -s * 0.98, s * 0.1, 0, TAU); g.fill(); }
    if (acc === 'tiara') { g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.72); for (let i = 0; i <= 4; i++) { g.lineTo(-s * 0.5 + i * s * 0.25, i % 2 ? -s * 0.92 : -s * 1.12); } g.lineTo(s * 0.5, -s * 0.72); g.closePath(); g.fill(); g.fillStyle = '#ff6bb5'; g.beginPath(); g.arc(0, -s * 0.95, s * 0.08, 0, TAU); g.fill(); }
    g.restore();
  }
  function drawFish(g, cx, cy, s, gold) {
    g.save(); g.translate(cx, cy);
    const col = gold ? ['#fff3b0', '#f2b631'] : ['#bfe9ff', '#4fa3e8'];
    const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-s * 0.9, 0); g.lineTo(-s * 1.4, -s * 0.5); g.lineTo(-s * 1.3, 0); g.lineTo(-s * 1.4, s * 0.5); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = s * 0.05;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-s * 0.3 + i * s * 0.28, 0, s * 0.3, -1, 1); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.55, -s * 0.12, s * 0.16, 0, TAU); g.fill();
    g.fillStyle = '#1b1426'; g.beginPath(); g.arc(s * 0.58, -s * 0.12, s * 0.08, 0, TAU); g.fill();
    g.restore();
  }
  function drawDog(g, cx, cy, s) {
    g.save(); g.translate(cx, cy);
    g.fillStyle = '#7a5236'; g.beginPath(); g.ellipse(-s * 0.85, -s * 0.1, s * 0.3, s * 0.6, 0.3, 0, TAU); g.ellipse(s * 0.85, -s * 0.1, s * 0.3, s * 0.6, -0.3, 0, TAU); g.fill();
    const gr = g.createRadialGradient(-s * 0.3, -s * 0.3, 1, 0, 0, s); gr.addColorStop(0, '#e9c39a'); gr.addColorStop(1, '#c08e5e');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s * 0.85, s * 0.8, 0, 0, TAU); g.fill();
    g.fillStyle = '#5a3a28'; g.beginPath(); g.ellipse(0, s * 0.3, s * 0.45, s * 0.33, 0, 0, TAU); g.fill();
    g.fillStyle = '#1b1426'; g.beginPath(); g.ellipse(0, s * 0.15, s * 0.16, s * 0.1, 0, 0, TAU); g.fill();
    for (const sx of [-1, 1]) { g.fillStyle = '#1b1426'; g.beginPath(); g.arc(sx * s * 0.32, -s * 0.15, s * 0.1, 0, TAU); g.fill(); g.strokeStyle = '#3a2418'; g.lineWidth = s * 0.07; g.beginPath(); g.moveTo(sx * s * 0.5, -s * 0.42); g.lineTo(sx * s * 0.18, -s * 0.3); g.stroke(); }
    g.strokeStyle = '#1b1426'; g.lineWidth = s * 0.06; g.beginPath(); g.arc(0, s * 0.5, s * 0.15, Math.PI + 0.4, -0.4); g.stroke();
    g.restore();
  }
  const cardCache = new Map();
  const CW = 180, CH = 252;
  function cardImg(key) {
    if (cardCache.has(key)) return cardCache.get(key);
    const c = document.createElement('canvas'); c.width = CW * 2; c.height = CH * 2;
    const g = c.getContext('2d'); g.scale(2, 2);
    const frame = (c1, c2, edge) => {
      const gr = g.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; roundRect(g, 2, 2, CW - 4, CH - 4, 16); g.fill();
      g.strokeStyle = edge; g.lineWidth = 3; roundRect(g, 7, 7, CW - 14, CH - 14, 12); g.stroke();
    };
    if (key === 'back') {
      frame('#4a2f7a', '#241640', '#ffd36b');
      g.strokeStyle = 'rgba(255,211,107,0.25)'; g.lineWidth = 1.5;
      for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(i * 18, 0); g.lineTo(i * 18 + CH, CH); g.stroke(); g.beginPath(); g.moveTo(i * 18 + CH, 0); g.lineTo(i * 18, CH); g.stroke(); }
      g.fillStyle = '#2a1a48'; g.beginPath(); g.arc(CW / 2, CH / 2, 42, 0, TAU); g.fill();
      g.strokeStyle = '#ffd36b'; g.lineWidth = 3; g.beginPath(); g.arc(CW / 2, CH / 2, 42, 0, TAU); g.stroke();
      // лапка
      g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(CW / 2, CH / 2 + 10, 16, 13, 0, 0, TAU); g.fill();
      for (const [dx, dy] of [[-18, -10], [-6, -20], [6, -20], [18, -10]]) { g.beginPath(); g.ellipse(CW / 2 + dx, CH / 2 + dy, 6.5, 8, 0, 0, TAU); g.fill(); }
    } else if (key.startsWith('c')) {
      const cat = CATS[+key.slice(1)];
      const tier = cat.v >= 10 ? ['#ffe39a', '#c98a2a', '#fff3c4'] : cat.v >= 6 ? ['#c7b5ff', '#6a4fc0', '#efe6ff'] : ['#a8e6ff', '#3a7fc0', '#e6f7ff'];
      frame(tier[0], tier[1], tier[2]);
      g.save(); roundRect(g, 14, 40, CW - 28, 128, 10); g.clip();
      const bg = g.createRadialGradient(CW / 2, 90, 5, CW / 2, 110, 110); bg.addColorStop(0, '#fff8ee'); bg.addColorStop(1, mixColor(cat.fur, '#7a6aa0', 0.55));
      g.fillStyle = bg; g.fillRect(14, 40, CW - 28, 128);
      drawCat(g, CW / 2, 102, 34, cat);
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; roundRect(g, 14, 40, CW - 28, 128, 10); g.stroke();
      // сила
      g.fillStyle = '#1d1430'; g.beginPath(); g.arc(30, 28, 20, 0, TAU); g.fill();
      g.strokeStyle = tier[2]; g.lineWidth = 2.5; g.beginPath(); g.arc(30, 28, 20, 0, TAU); g.stroke();
      g.fillStyle = '#fff'; g.font = '700 22px Comfortaa'; g.textAlign = 'center'; g.fillText(cat.v, 30, 36);
      g.fillStyle = '#1d1430'; g.font = '700 16px Comfortaa'; g.textAlign = 'left'; g.fillText(cat.name, 56, 33);
      g.fillStyle = 'rgba(20,12,40,0.7)'; roundRect(g, 14, 176, CW - 28, 62, 10); g.fill();
      g.fillStyle = '#fff4dc'; g.font = '600 12px Comfortaa'; g.textAlign = 'center';
      wrapText(g, cat.ab, CW / 2, 198, CW - 40, 15);
    } else {
      const p = prizeOf(key.replace(/^p/, ''));
      const dog = p.v < 0;
      frame(dog ? '#f2a3a3' : p.gold ? '#ffe7a0' : '#bfe6ff', dog ? '#9c3a4a' : p.gold ? '#c98a2a' : '#3f7fc8', '#fff');
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(CW / 2, 110, 66, 0, TAU); g.fill();
      if (dog) drawDog(g, CW / 2, 110, 48); else drawFish(g, CW / 2 + 10, 110, 44, p.gold);
      g.fillStyle = dog ? '#5a1424' : '#14284a'; g.font = '700 46px Comfortaa'; g.textAlign = 'center';
      g.fillText((p.v > 0 ? '+' : '') + p.v, CW / 2, 222);
      g.font = '700 13px Comfortaa'; g.fillText(dog ? 'СОБАКА' : p.gold ? 'ЗОЛОТАЯ РЫБКА' : 'РЫБКА', CW / 2, 34);
    }
    const url = c.toDataURL();
    cardCache.set(key, url);
    return url;
  }

  // ---------- Правила одного раунда ----------
  function resolve(prizeV, a, b, mod) {
    // сила с учётом умений
    let pa = a === 9 && b >= 10 ? 13 : a, pb = b === 9 && a >= 10 ? 13 : b;
    if (a === 4 && b !== 4) pa = pb; if (b === 4 && a !== 4) pb = pa;
    let cmp = pa - pb;
    if (a === 1 && b === 12) cmp = 1; if (b === 1 && a === 12) cmp = -1;
    if (cmp === 0 && a === 7 && b !== 7) cmp = 1; if (cmp === 0 && b === 7 && a !== 7) cmp = -1;
    if (cmp === 0) return { tie: true, pa, pb };
    const stronger = cmp > 0 ? 'A' : 'B';
    let neg = prizeV < 0;
    if (mod === 'flip') neg = !neg;
    let taker = neg ? (stronger === 'A' ? 'B' : 'A') : stronger;
    const card = { A: a, B: b };
    const other = (k) => (k === 'A' ? 'B' : 'A');
    if (prizeV < 0 && card[taker] === 8) taker = other(taker);
    return { tie: false, pa, pb, stronger, taker };
  }

  GAMES.cats = {
    id: 'cats', title: 'Кошачий турнир', icon: '🐱', color: '#ffb36b',
    tagline: 'Карточная дуэль котов: кто кого перехитрит?',
    rules: [
      'У каждого 12 котов с силой от 1 до 12 и своим умением. Каждый раунд открывается приз: рыбка (+очки) или собака (−очки).',
      'Оба тайно выбирают кота — карты переворачиваются одновременно. Рыбку забирает сильнейший, собаку — слабейший.',
      'Ничья — приз уходит в банк и достаётся победителю следующего раунда. Читайте умения: Котёнок побеждает Льва!',
      'Турнир — до двух побед, у каждого матча свой «день» с особым правилом.',
    ],
    info() { const w = Store.get('cats_cups', 0); return w ? `кубков: ${w} 🏆` : 'карточная дуэль'; },
    create(ctx) { return new Cats(ctx); },
  };

  class Cats {
    constructor(ctx) {
      this.ctx = ctx;
      this.side = ctx.isHost ? 'A' : 'B';
      this.names = ctx.isHost ? { A: ctx.me.name, B: ctx.peer.name } : { A: ctx.peer.name, B: ctx.me.name };
      this.g = ctx.canvas.getContext('2d');
      this.sky = new Sky({ density: 0.6, palette: ['#7a3d6b', '#3d2a7a', '#b05a3a'] });
      this.parts = new Particles();
      this.sel = null; this.picks = { A: null, B: null };
      this.el = h('<div class="ct-root"></div>');
      ctx.ui.appendChild(this.el);
      if (ctx.isHost) { this.S = { phase: 'menu' }; this.broadcast(); }
      ctx.loop((dt, t) => this.frame(dt, t));
    }
    nm(k) { return esc(this.names[k] || (k === 'A' ? 'Хост' : 'Гость')); }
    other(k) { return k === 'A' ? 'B' : 'A'; }

    // ================= Хост =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.apply(this.S); }
    newTour(mode) {
      this.S = { phase: 'menu', mode, match: 0, wins: { A: 0, B: 0 }, total: { A: 0, B: 0 } };
      this.newMatch();
    }
    newMatch() {
      const S = this.S;
      S.match++;
      const modIds = Object.keys(MODS);
      S.mod = S.mode === 'quick' ? 'none' : (S.match === 1 ? pick(['none', 'fish']) : pick(modIds));
      let deck = PRIZES.map((p) => p.id);
      if (S.mod === 'dogs') deck = deck.filter((id) => id !== 'f1' && id !== 'f2').concat(['x1', 'x2']);
      deck.sort(() => Math.random() - 0.5);
      Object.assign(S, { phase: 'pick', deck, ri: 0, pot: [], hands: { A: [...Array(12)].map((_, i) => i + 1), B: [...Array(12)].map((_, i) => i + 1) }, score: { A: 0, B: 0 }, picked: { A: false, B: false }, rev: null });
      S.prize = S.deck[0];
      this.picks = { A: null, B: null };
      this.broadcast();
    }
    pickCard(side, v) {
      const S = this.S; if (S.phase !== 'pick' || S.picked[side] || !S.hands[side].includes(v)) return;
      this.picks[side] = v; S.picked[side] = true;
      if (S.picked.A && S.picked.B) return this.reveal();
      this.broadcast();
    }
    reveal() {
      const S = this.S, a = this.picks.A, b = this.picks.B;
      const pv = (id) => { const p = prizeOf(id); return p.v > 0 && S.mod === 'fish' ? p.v + 1 : p.v; };
      const prizes = S.pot.concat([S.prize]);
      const r = resolve(prizeOf(S.prize).v, a, b, S.mod);
      S.hands.A = S.hands.A.filter((x) => x !== a); S.hands.B = S.hands.B.filter((x) => x !== b);
      const rev = { a, b, prizes, tie: r.tie, pa: r.pa, pb: r.pb, notes: [] };
      if (r.tie) {
        S.pot = prizes;
        if (S.mod === 'bank') { S.potX = (S.potX || 1) * 2; rev.notes.push('Банк удвоен! 💰'); }
        rev.notes.push('Ничья — приз уходит в банк');
      } else {
        const tk = r.taker, card = { A: a, B: b };
        let sum = prizes.reduce((s, id) => s + pv(id), 0) * (S.potX || 1);
        const fishWon = prizes.some((id) => prizeOf(id).v > 0);
        if (sum > 0 && card[tk] === 5 && fishWon) { sum += 2; rev.notes.push('Рыбак: +2 🎣'); }
        if (sum > 0 && card[tk] === 11) { sum *= 2; rev.notes.push('Королева: ×2 👑'); }
        if (prizeOf(S.prize).v < 0 && card[this.other(tk)] === 8) rev.notes.push('Укротитель отдал собаку сопернику 🎩');
        S.score[tk] += sum;
        if (card[r.stronger] === 3) { S.score[r.stronger] += 2; S.score[this.other(r.stronger)] -= 2; rev.notes.push('Воришка украл 2 очка 🦝'); }
        if (a === 1 && b === 12 || b === 1 && a === 12) rev.notes.unshift('Котёнок победил Льва! 🐾');
        if ((a === 9 && b >= 10) || (b === 9 && a >= 10)) rev.notes.push('Ниндзя: сила 13 🥷');
        if (a === 4 || b === 4) rev.notes.push('Двойник скопировал силу 🪞');
        if (r.pa === r.pb && (a === 7 || b === 7)) rev.notes.push('Счастливчик выиграл ничью 🍀');
        const lost = this.other(r.stronger);
        if (card[lost] === 2) { S.hands[lost].push(2); S.hands[lost].sort((x, y) => x - y); rev.notes.push('Соня вернулась в руку 💤'); }
        rev.taker = tk; rev.sum = sum; rev.stronger = r.stronger;
        S.pot = []; S.potX = 1;
      }
      S.rev = rev; S.phase = 'reveal';
      this.picks = { A: null, B: null };
      this.broadcast();
      clearTimeout(this.revT);
      this.revT = setTimeout(() => this.nextRound(), 3600);
    }
    nextRound() {
      const S = this.S; if (S.phase !== 'reveal') return;
      S.ri++;
      if (S.ri >= S.deck.length || !S.hands.A.length || !S.hands.B.length) {
        const w = S.score.A === S.score.B ? null : S.score.A > S.score.B ? 'A' : 'B';
        if (w) S.wins[w]++;
        S.total.A += S.score.A; S.total.B += S.score.B;
        S.lastWin = w;
        S.phase = S.mode === 'quick' || S.wins.A >= 2 || S.wins.B >= 2 ? 'end' : 'matchEnd';
        return this.broadcast();
      }
      S.prize = S.deck[S.ri]; S.picked = { A: false, B: false }; S.rev = null; S.phase = 'pick';
      this.broadcast();
    }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost;
      switch (d.a) {
        case 'S': this.apply(d.S); break;
        case 'mode': if (host && (this.S.phase === 'menu' || this.S.phase === 'end')) this.newTour(d.mode); break;
        case 'pick': if (host) this.pickCard(d.side, d.v); break;
        case 'unpick': if (host && this.S.phase === 'pick' && this.S.picked[d.side]) { this.S.picked[d.side] = false; this.picks[d.side] = null; this.broadcast(); } break;
        case 'nextMatch': if (host && this.S.phase === 'matchEnd') this.newMatch(); break;
        case 'menu': if (host) { clearTimeout(this.revT); this.S = { phase: 'menu' }; this.broadcast(); } break;
      }
    }
    ask(a, extra = {}) { const m = { a, side: this.side, ...extra }; if (this.ctx.isHost) this.onMsg(m); else this.ctx.send(m); }
    apply(S) {
      const prev = this.S && this.S !== S ? this.S : this._prevS;
      this.S = S;
      const key = `${S.phase}:${S.match}:${S.ri}:${S.picked ? S.picked.A + '' + S.picked.B : ''}`;
      if (key === this._key) return;
      const wasPhase = this._key ? this._key.split(':')[0] : '';
      this._key = key;
      if (S.phase === 'pick' && (wasPhase !== 'pick')) { this.sel = null; SFX.play('card'); }
      if (S.phase === 'reveal' && wasPhase !== 'reveal') this.onReveal();
      if ((S.phase === 'matchEnd' || S.phase === 'end') && wasPhase !== S.phase) this.onMatchEnd();
      this._prevS = JSON.parse(JSON.stringify(S));
      this.render();
    }
    onReveal() {
      SFX.play('whoosh');
      setTimeout(() => {
        const r = this.S.rev; if (!r) return;
        if (r.tie) SFX.play('bellLow');
        else if (r.taker === this.side) { SFX.play(r.sum > 0 ? 'coin' : 'fail'); if (r.sum > 0) this.burst('#ffe27a'); }
        else SFX.play(r.sum > 0 ? 'pop' : 'chime');
      }, 650);
    }
    onMatchEnd() {
      const S = this.S, me = this.side;
      if (S.lastWin === me) { SFX.play('win'); this.burst('#ffe27a', 60); }
      else SFX.play(S.lastWin ? 'fail' : 'chime');
      if (S.phase === 'end' && S.mode === 'tour' && (S.wins[me] >= 2)) Store.set('cats_cups', Store.get('cats_cups', 0) + 1);
    }
    burst(c, n = 30) { this.parts.emit(innerWidth / 2, innerHeight * 0.4, { n, speed: 320, life: 1.4, size: 12, color: [c, '#fff', '#ffb3d6'] }); }

    // ================= Экран =================
    render() {
      const S = this.S, el = this.el, me = this.side, op = this.other(me);
      if (S.phase === 'menu') {
        el.innerHTML = `<div class="panel ct-menu"><h2>🐱 Кошачий турнир</h2>
          <p class="sub">${this.nm('A')} против ${this.nm('B')}. У каждого 12 котов — выбирайте с умом!</p>
          <div class="ct-preview">${[1, 12, 9, 11].map((v) => `<img src="${cardImg('c' + v)}" alt="">`).join('')}</div>
          <div class="us-modes"><button class="us-mode" data-mode="tour"><span class="i">🏆</span><b>Турнир</b><span>до двух побед, особые дни</span></button>
          <button class="us-mode" data-mode="quick"><span class="i">⚡</span><b>Быстрый матч</b><span>12 раундов, обычные правила</span></button></div>
          <details class="ct-rules"><summary>Все коты и их умения</summary><div class="ct-all">${CATS.slice(1).map((c) => `<img src="${cardImg('c' + c.v)}" alt="">`).join('')}</div></details></div>`;
        el.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.ask('mode', { mode: b.dataset.mode }); }));
        return;
      }
      if (S.phase === 'matchEnd' || S.phase === 'end') {
        const w = S.lastWin, fin = S.phase === 'end';
        const champ = fin && S.mode === 'tour' ? (S.wins.A > S.wins.B ? 'A' : 'B') : w;
        el.innerHTML = `<div class="panel lv-end ct-end"><div style="font-size:58px">${champ === me ? '🏆' : champ ? '🐾' : '🤝'}</div>
          <h2>${fin ? (champ ? `${champ === me ? 'Ты победил(а)!' : `Победа: ${this.nm(champ)}`}` : 'Ничья!') : (w ? `Матч за ${this.nm(w)}` : 'Ничья в матче')}</h2>
          <p>Счёт матча: ${this.nm('A')} <b>${S.score.A}</b> — <b>${S.score.B}</b> ${this.nm('B')}${S.mode === 'tour' ? `<br>Победы в турнире: ${S.wins.A} : ${S.wins.B}` : ''}</p>
          ${fin ? '<button class="btn" data-a="menu">Ещё турнир ✦</button>' : '<button class="btn" data-a="nextMatch">Следующий матч →</button>'}</div>`;
        el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.ask(b.dataset.a); }));
        return;
      }
      const M = MODS[S.mod], rev = S.rev, fog = S.mod === 'fog' && S.phase === 'pick';
      const potV = S.pot.length ? S.pot.map((id) => prizeOf(id).v).reduce((a, b) => a + b, 0) : 0;
      const myCard = S.phase === 'reveal' ? rev[me === 'A' ? 'a' : 'b'] : this.sel;
      const opCard = S.phase === 'reveal' ? rev[op === 'A' ? 'a' : 'b'] : null;
      const result = rev ? (rev.tie ? '<b>Ничья!</b>' : `${rev.taker === me ? '<b class="g">Тебе</b>' : `<b class="o">${this.nm(rev.taker)}</b>`} ${rev.sum >= 0 ? '+' : ''}${rev.sum}`) : '';
      el.innerHTML = `
        <div class="ct-top">
          <div class="ct-sc ${me === 'A' ? 'me' : ''}"><span>${this.nm('A')}</span><b>${S.score.A}</b></div>
          <div class="ct-mid"><div class="ct-mod">${M.icon} ${M.name}</div><div class="ct-sub">${M.desc} · раунд ${S.ri + 1}/${S.deck.length}${S.mode === 'tour' ? ` · победы ${S.wins.A}:${S.wins.B}` : ''}</div></div>
          <div class="ct-sc ${me === 'B' ? 'me' : ''}"><b>${S.score.B}</b><span>${this.nm('B')}</span></div>
        </div>
        <div class="ct-table">
          <div class="ct-slot op"><div class="ct-who">${this.nm(op)}</div>
            <div class="ct-card ${opCard ? 'flip' : ''}">${opCard ? `<img src="${cardImg('c' + opCard)}" alt="">` : S.picked[op] ? `<img src="${cardImg('back')}" alt="" class="ready">` : '<div class="ct-empty">думает…</div>'}</div></div>
          <div class="ct-prize"><div class="ct-card big ${fog ? '' : 'flip'}"><img src="${cardImg(fog ? 'back' : 'p' + S.prize)}" alt=""></div>
            ${S.pot.length ? `<div class="ct-pot">в банке: ${potV > 0 ? '+' : ''}${potV}${(S.potX || 1) > 1 ? ` ×${S.potX}` : ''}</div>` : ''}
            ${rev ? `<div class="ct-res">${result}${rev.notes.length ? `<div class="ct-notes">${rev.notes.join('<br>')}</div>` : ''}</div>` : ''}</div>
          <div class="ct-slot me"><div class="ct-who">ты</div>
            <div class="ct-card ${myCard ? 'flip' : ''}">${myCard ? `<img src="${cardImg('c' + myCard)}" alt="">` : '<div class="ct-empty">выбери кота ↓</div>'}</div></div>
        </div>
        <div class="ct-bar">${S.phase === 'pick' ? (S.picked[me] ? `<span>Ждём ${this.nm(op)}…</span><button class="btn ghost small" id="ctUn">Передумать</button>` : (this.sel ? `<button class="btn small" id="ctPlay">Сыграть: ${CATS[this.sel].name} ✦</button>` : '<span>Выбери кота в руке</span>')) : '<span>&nbsp;</span>'}</div>
        <div class="ct-hand scroll-x">${S.hands[me].map((v) => `<button class="ct-hc ${this.sel === v ? 'sel' : ''}" data-v="${v}" ${S.phase !== 'pick' || S.picked[me] ? 'disabled' : ''}><img src="${cardImg('c' + v)}" alt="${CATS[v].name}"></button>`).join('')}</div>`;
      el.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => {
        const v = +b.dataset.v;
        if (this.sel === v) { this.play(); return; }
        SFX.play('card'); this.sel = v; this.render();
      }));
      const pl = $('#ctPlay', el); if (pl) pl.onclick = () => this.play();
      const un = $('#ctUn', el); if (un) un.onclick = () => { SFX.play('click'); this.ask('unpick'); };
      // прокрутить руку к выбранной карте
      const s = el.querySelector('.ct-hc.sel'); if (s && this._scrollSel !== this.sel) { this._scrollSel = this.sel; s.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }
    }
    play() { if (!this.sel) return; SFX.play('pop'); this.ask('pick', { v: this.sel }); }

    frame(dt, t) {
      const g = this.g, cv = this.ctx.canvas, dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.sky.resize(w, hh); this.sky.draw(g, t, dt);
      // тёплый стол-сцена
      const gr = g.createRadialGradient(w / 2, hh * 0.45, 10, w / 2, hh * 0.45, Math.max(w, hh) * 0.6);
      gr.addColorStop(0, 'rgba(255,190,120,0.18)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const x = (i + 0.5) * w / 7, y = 24 + Math.sin(t * 1.5 + i) * 4; Glow.draw(g, x, y, 26, i % 2 ? '#ffd27a' : '#ff9ccd', 0.6 + Math.sin(t * 3 + i) * 0.2); }
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(255,220,160,0.25)'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i <= 7; i++) { const x = i * w / 7; g.quadraticCurveTo(x - w / 14, 34, x, 22); }
      g.stroke();
      this.parts.update(dt); this.parts.draw(g);
    }
    resync() { if (this.ctx.isHost && this.S) this.broadcast(); }
    destroy() { clearTimeout(this.revT); }
  }
})();
