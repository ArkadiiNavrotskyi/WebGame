'use strict';
// «Звездопад» — тетрис вдвоём на одном поле: у каждого своя фигура. Уровни на время + бесконечный режим.
(() => {
  const COLS = 12, ROWS = 20;
  const TYPES = 'IOTSZJL';
  const BASE = {
    I: [4, [[0, 1], [1, 1], [2, 1], [3, 1]]], O: [2, [[0, 0], [1, 0], [0, 1], [1, 1]]], T: [3, [[1, 0], [0, 1], [1, 1], [2, 1]]],
    S: [3, [[1, 0], [2, 0], [0, 1], [1, 1]]], Z: [3, [[0, 0], [1, 0], [1, 1], [2, 1]]], J: [3, [[0, 0], [0, 1], [1, 1], [2, 1]]], L: [3, [[2, 0], [0, 1], [1, 1], [2, 1]]],
  };
  // все повороты заранее
  const SHAPES = {};
  for (const t of TYPES) {
    const [n, c] = BASE[t]; const rots = [c];
    for (let i = 1; i < 4; i++) rots.push(rots[i - 1].map(([x, y]) => [n - 1 - y, x]));
    SHAPES[t] = rots;
  }
  // цвета: хост — тёплые, гость — холодные
  const PAL = {
    A: ['#ff8fc3', '#ffd36b', '#ff9a7a', '#ffb3e0', '#ff7a9c', '#ffbe6b', '#f7a1ff'],
    B: ['#6bd6ff', '#9be7c4', '#8f9dff', '#6bffd8', '#b49cff', '#7fc4ff', '#5fe0d2'],
  };
  const LEVELS = [
    { name: 'Первые звёзды', goal: 6, time: 120, speed: 0.8, desc: 'Соберите 6 полных рядов за 2 минуты' },
    { name: 'Звездопад', goal: 8, time: 120, speed: 0.65, desc: 'Фигуры падают быстрее' },
    { name: 'Камни с неба', goal: 10, time: 150, speed: 0.6, garbage: 25, desc: 'Снизу поднимаются каменные ряды' },
    { name: 'Падающие звёзды', goal: 12, time: 150, speed: 0.55, garbage: 25, stars: true, desc: 'Ряд со звёздочкой ★ даёт +8 секунд' },
    { name: 'Ускорение', goal: 14, time: 150, speed: 0.42, garbage: 22, stars: true, desc: 'Быстро, но вы справитесь' },
    { name: 'Тёмная ночь', goal: 12, time: 150, speed: 0.5, dark: true, stars: true, desc: 'Темно! Светятся только места рядом с фигурами' },
    { name: 'Метеоритный дождь', goal: 16, time: 170, speed: 0.45, garbage: 14, stars: true, desc: 'Камни поднимаются очень часто' },
    { name: 'Буря', goal: 18, time: 170, speed: 0.34, garbage: 18, stars: true, dark: true, desc: 'Темнота, камни и скорость сразу' },
    { name: 'Финал', goal: 22, time: 200, speed: 0.28, garbage: 16, stars: true, desc: 'Последнее испытание звездопадом' },
  ];
  const ENDLESS = { name: 'Бесконечный звездопад', goal: 0, time: 0, speed: 0.6, garbage: 22, stars: true, desc: 'Без таймера. Сколько очков наберёте вместе?' };
  const levelDef = (n) => (n <= LEVELS.length ? LEVELS[n - 1] : ENDLESS);
  const EMPTY = '.'.repeat(COLS * ROWS);
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // спрайты клеток: рисуем один раз на цвет
  const cellCache = new Map();
  function cellSprite(color, star) {
    const key = color + (star ? '*' : '');
    let c = cellCache.get(key); if (c) return c;
    const S = 64; c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, S, S);
    gr.addColorStop(0, mixColor(color, '#ffffff', 0.45)); gr.addColorStop(0.5, color); gr.addColorStop(1, mixColor(color, '#1a1030', 0.45));
    g.fillStyle = gr; roundRect(g, 3, 3, S - 6, S - 6, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(g, 9, 8, S - 18, 14, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; roundRect(g, 4, 4, S - 8, S - 8, 11); g.stroke();
    if (star) { drawGlyph(g, 'star', S / 2, S / 2 + 2, 34, '#fffbe6', 4); }
    cellCache.set(key, c); return c;
  }
  function colorOf(ch) {
    if (ch === 'g') return '#6d6684';
    if (ch === '*') return '#ffe27a';
    const up = ch >= 'A' && ch <= 'Z';
    return PAL[up ? 'A' : 'B'][(up ? ch.charCodeAt(0) - 65 : ch.charCodeAt(0) - 97) % 7];
  }

  GAMES.starfall = {
    id: 'starfall', title: 'Звездопад', icon: '🧱', color: '#8fb8ff',
    tagline: 'Тетрис вдвоём на одном поле — уровни на время',
    rules: [
      'Одно поле на двоих, у каждого своя падающая фигура: у хоста — тёплые цвета, у гостя — холодные.',
      'Соберите нужное число полных рядов, пока не кончилось время. Ряд, собранный из фигур обоих, — бонус «Вместе!» ✦',
      'С 3-го уровня снизу поднимаются камни, с 4-го появляются звёздочки ★ (+8 секунд), а ещё будет тёмная ночь…',
      'Компьютер: ←/→ двигать, ↑ повернуть, ↓ ускорить, Пробел — сбросить вниз. Телефон: кнопки внизу или свайпы по полю.',
      '9 уровней, потом бесконечный режим на рекорд.',
    ],
    info() { const m = Store.get('sf_max', 1), b = Store.get('sf_best', 0); return m > LEVELS.length ? `рекорд ${b}` : `уровень ${m} из ${LEVELS.length}`; },
    create(ctx) { return new Starfall(ctx); },
  };

  class Starfall {
    constructor(ctx) {
      this.ctx = ctx;
      this.me = ctx.isHost ? 'A' : 'B';
      this.g = ctx.canvas.getContext('2d');
      this.sky = new Sky({ density: 0.8 });
      this.parts = new Particles();
      this.keys = new Keys();
      this.S = null; this.board = EMPTY; this.pending = []; this.lockId = 0;
      this.piece = null; this.queue = []; this.peerP = null; this.peerVis = null;
      this.fallT = 0; this.lockT = 0; this.lockMoves = 0; this.soft = false;
      this.clearFx = []; this.floaters = []; this.shake = 0;
      this.levelKey = '';
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) {
        this.S = { phase: 'menu', lvl: 1, att: -1, max: Store.get('sf_max', 1), time: 0, lines: 0, score: 0, ver: 0, board: EMPTY, ack: 0, gT: 0 };
        this.hostT = setInterval(() => this.hostTick(), 200); this.lastTick = performance.now();
        this.broadcast();
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ================= Хост =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.applyS(this.S); }
    event(e) { this.ctx.send({ a: 'ev', e }); this.onEvent(e); }
    hostTick() {
      const now = performance.now(), dt = (now - this.lastTick) / 1000; this.lastTick = now;
      const S = this.S; if (!S) return;
      const L = levelDef(S.lvl);
      if (S.phase === 'intro') { S.cd -= dt; if (S.cd <= 0) { S.phase = 'play'; this.broadcast(); } return; }
      if (S.phase !== 'play') return;
      if (L.time) { S.time -= dt; if (S.time <= 0) { S.time = 0; S.phase = 'lose'; S.why = 'time'; return this.broadcast(); } }
      else S.time += dt;
      if (L.garbage) { S.gT += dt; if (S.gT >= L.garbage) { S.gT = 0; this.addGarbage(L); } }
      if ((this._sync = (this._sync || 0) + dt) > 1) { this._sync = 0; this.broadcast(); }
    }
    startLevel(lvl) {
      const S = this.S;
      S.att = lvl === S.lvl ? S.att + 1 : 0; S.lvl = lvl;
      const L = levelDef(lvl);
      Object.assign(S, { phase: 'intro', cd: 3, time: L.time || 0, lines: 0, score: 0, board: EMPTY, ver: S.ver + 1, gT: 0, why: '' });
      this.broadcast();
    }
    addGarbage(L) {
      const S = this.S, b = S.board;
      if (b.slice(0, COLS) !== '.'.repeat(COLS)) { S.phase = 'lose'; S.why = 'top'; return this.broadcast(); }
      const gap = Math.floor(Math.random() * COLS);
      let row = '';
      for (let x = 0; x < COLS; x++) row += x === gap ? '.' : 'g';
      if (L.stars && Math.random() < 0.6) { let sx; do sx = Math.floor(Math.random() * COLS); while (sx === gap); row = row.slice(0, sx) + '*' + row.slice(sx + 1); }
      S.board = b.slice(COLS) + row; S.ver++;
      this.event({ a: 'garbage' });
      this.broadcast();
    }
    merge(cells, owner, id) {
      const S = this.S; if (S.phase !== 'play') return;
      const b = S.board.split('');
      const occ = (x, y) => y >= 0 && b[y * COLS + x] !== '.';
      let dy = 0;
      while (cells.some(([x, y]) => occ(x, y + dy)) && dy > -6) dy--;
      if (owner === 'B') S.ack = Math.max(S.ack, id);
      if (cells.some(([, y]) => y + dy < 0)) { S.phase = 'lose'; S.why = 'top'; return this.broadcast(); }
      for (const [x, y, ch] of cells) b[(y + dy) * COLS + x] = ch;
      // полные ряды
      const rows = [];
      let together = 0, stars = 0;
      for (let y = 0; y < ROWS; y++) {
        const r = b.slice(y * COLS, y * COLS + COLS);
        if (r.every((c) => c !== '.')) {
          rows.push(y);
          if (r.some((c) => c >= 'A' && c <= 'Z') && r.some((c) => c >= 'a' && c <= 'z')) together++;
          stars += r.filter((c) => c === '*').length;
        }
      }
      if (rows.length) {
        const keep = [];
        for (let y = 0; y < ROWS; y++) if (!rows.includes(y)) keep.push(b.slice(y * COLS, y * COLS + COLS).join(''));
        S.board = '.'.repeat(COLS * rows.length) + keep.join('');
        const L = levelDef(S.lvl);
        const pts = [0, 100, 300, 500, 800][Math.min(4, rows.length)] * Math.min(S.lvl, 10) + together * 60 + stars * 50;
        S.lines += rows.length; S.score += pts;
        if (L.time && stars) S.time += stars * 8;
        this.event({ a: 'clear', rows, together, stars, pts, n: rows.length });
        if (L.goal && S.lines >= L.goal) {
          S.phase = 'win';
          S.max = Math.max(S.max, S.lvl + 1);
          Store.set('sf_max', Math.max(Store.get('sf_max', 1), S.lvl + 1));
        }
      } else S.board = b.join('');
      S.ver++;
      this.broadcast();
    }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost;
      switch (d.a) {
        case 'S': this.applyS(d.S); break;
        case 'ev': this.onEvent(d.e); break;
        case 'p': this.peerP = d.p; break;
        case 'lock': if (host) this.merge(d.cells, 'B', d.id); break;
        case 'top': if (host && this.S.phase === 'play') { this.S.phase = 'lose'; this.S.why = 'top'; this.broadcast(); } break;
        case 'pick': if (host && d.lvl <= this.S.max && this.S.phase !== 'play') this.startLevel(d.lvl); break;
        case 'retry': if (host && (this.S.phase === 'lose' || this.S.phase === 'win')) this.startLevel(this.S.lvl); break;
        case 'next': if (host && this.S.phase === 'win') this.startLevel(this.S.lvl + 1); break;
        case 'menu': if (host) { this.S.phase = 'menu'; this.broadcast(); } break;
      }
    }
    ask(a, extra = {}) { if (this.ctx.isHost) this.onMsg({ a, ...extra }); else this.ctx.send({ a, ...extra }); }
    applyS(S) {
      const prevKey = this._phaseKey;
      this.S = S; this.recvAt = performance.now();
      this.board = S.board;
      this.pending = this.pending.filter((p) => p.id > S.ack);
      if (S.max > Store.get('sf_max', 1)) Store.set('sf_max', S.max);
      const key = `${S.lvl}:${S.att}`;
      if (key !== this.levelKey && S.phase !== 'menu') { this.levelKey = key; this.resetLevel(); }
      this._phaseKey = `${key}:${S.phase}`;
      if (prevKey !== this._phaseKey) this.onPhase(S.phase);
      // если доска сдвинулась (камни) — выталкиваем фигуру вверх
      if (this.piece) { let k = 0; while (this.collide(this.piece, 0, 0) && k++ < 6) this.piece.y--; }
      this.updateHud();
    }
    resetLevel() {
      const who = this.me === 'A' ? 1 : 2;
      this.rng = RNG((this.ctx.seed + who * 977 + this.S.lvl * 131 + this.S.att * 7) >>> 0);
      this.bag = []; this.queue = []; this.pending = []; this.piece = null; this.peerP = null;
      this.clearFx = []; this.floaters = [];
    }
    onEvent(e) {
      if (e.a === 'clear') {
        SFX.play(e.n >= 4 ? 'win' : 'chime');
        if (e.n >= 2) SFX.play('magic');
        this.shake = 0.15 + e.n * 0.08;
        const lay = this.lay;
        e.rows.forEach((y) => {
          this.clearFx.push({ y, t: 0 });
          if (lay) for (let x = 0; x < COLS; x += 2) this.parts.emit(lay.bx + (x + 0.5) * lay.c, lay.by + (y + 0.5) * lay.c, { n: 4, speed: 260, life: 0.9, size: lay.c * 0.35, color: ['#ffe7a6', '#ffb3d6', '#9fe7ff', '#fff'] });
        });
        let txt = `+${e.pts}`;
        if (e.together) txt += '  Вместе! ✦';
        if (e.stars) txt += `  ★ +${e.stars * 8}с`;
        this.floaters.push({ txt, y: e.rows[0], t: 0, big: e.n >= 4 || e.together });
        if (e.n >= 4) this.ctx.toast('🌟 Звездопад! Четыре ряда сразу!');
      }
      if (e.a === 'garbage') { SFX.play('door'); this.shake = 0.25; }
    }

    // ================= Экраны =================
    onPhase(ph) {
      const S = this.S, L = levelDef(S.lvl);
      this.overlay(null);
      if (ph === 'menu') this.showMenu();
      if (ph === 'intro') {
        SFX.play('whoosh');
        this.overlay(`<div class="lv-intro"><div class="lv-k">${S.lvl <= LEVELS.length ? `УРОВЕНЬ ${S.lvl} ИЗ ${LEVELS.length}` : 'БЕЗ ТАЙМЕРА'}</div><div class="lv-n">${L.name}</div>
          <div class="lv-k2">${L.desc}</div>${L.goal ? `<div class="lv-k2">🎯 ${L.goal} рядов · ⏱ ${fmt(L.time)}</div>` : ''}
          <div class="lv-k2" style="color:${this.me === 'A' ? '#ffb3d6' : '#9fe7ff'}">Твои фигуры — ${this.me === 'A' ? 'тёплые, розово-золотые' : 'холодные, голубые'}</div><div class="lv-cd"></div></div>`, true);
      }
      if (ph === 'play') { SFX.play('bellLow'); this.keys.hit = {}; if (!this.piece) this.spawn(); }
      if (ph === 'win') {
        SFX.play('win');
        for (let i = 0; i < 5; i++) setTimeout(() => this.lay && this.parts.emit(rand(0, innerWidth), rand(0, innerHeight * 0.6), { n: 36, speed: 300, life: 1.6, size: 12, color: ['#ffe7a6', '#9fe7ff', '#ffb3d6'] }), i * 250);
        const last = S.lvl === LEVELS.length;
        this.overlay(`<div class="panel lv-end"><div style="font-size:58px">${last ? '🏆' : '🌟'}</div><h2>${last ? 'Все уровни пройдены!' : 'Уровень пройден!'}</h2>
          <p>Рядов: <b>${S.lines}</b> · очков: <b style="color:#ffe7a6">${S.score}</b>${L.time ? ` · осталось ${fmt(S.time)}` : ''}</p>
          <button class="btn" data-a="next">${last ? 'Бесконечный звездопад →' : 'Следующий уровень →'}</button><button class="btn ghost" data-a="menu">К уровням</button></div>`);
      }
      if (ph === 'lose') {
        SFX.play('fail');
        this.piece = null;
        let rec = '';
        if (!L.goal) { const b = Store.get('sf_best', 0); if (S.score > b) { Store.set('sf_best', S.score); rec = '<br><b style="color:#7dffb5">✦ Новый рекорд! ✦</b>'; } else rec = `<br>рекорд: ${b}`; }
        this.overlay(`<div class="panel lv-end"><div style="font-size:58px">${L.goal ? (S.why === 'time' ? '⌛' : '🌌') : '✨'}</div>
          <h2>${L.goal ? (S.why === 'time' ? 'Время вышло' : 'Поле переполнено') : 'Звездопад окончен'}</h2>
          <p>${L.goal ? `Собрано ${S.lines} из ${L.goal} рядов. Ещё чуть-чуть!` : `Вы продержались ${fmt(S.time)} и собрали ${S.lines} рядов.`}<br>Очков: <b style="color:#ffe7a6">${S.score}</b>${rec}</p>
          <button class="btn" data-a="retry">Ещё раз ⟳</button><button class="btn ghost" data-a="menu">К уровням</button></div>`);
      }
    }
    overlay(html, passive) {
      const o = this.ui.querySelector('.lv-ov'); if (o) o.remove();
      if (!html) return;
      const el = h(`<div class="lv-ov ${passive ? 'passive' : ''}">${html}</div>`);
      el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.ask(b.dataset.a); }));
      el.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.ask('pick', { lvl: +b.dataset.l }); }));
      this.ui.appendChild(el);
    }
    showMenu() {
      const max = this.S.max, tiles = [];
      for (let i = 1; i <= LEVELS.length + 1; i++) {
        const L = levelDef(i), open = i <= max, endless = i > LEVELS.length;
        tiles.push(`<button class="lv-tile ${open ? '' : 'locked'} ${i < max ? 'done' : ''}" ${open ? `data-l="${i}"` : 'disabled'}>
          <span class="n">${endless ? '∞' : i}</span><span class="t">${L.name}</span><span class="m">${open ? (endless ? `рекорд ${Store.get('sf_best', 0)}` : `${L.goal} рядов · ${fmt(L.time)}`) : '🔒'}</span></button>`);
      }
      this.overlay(`<div class="panel lv-menu"><h2>🧱 Звездопад</h2>
        <p class="sub">Твои фигуры — <b style="color:${this.me === 'A' ? '#ffb3d6' : '#9fe7ff'}">${this.me === 'A' ? 'тёплые' : 'холодные'}</b>. Выберите уровень:</p>
        <div class="lv-grid">${tiles.join('')}</div></div>`);
    }
    buildUI() {
      const touch = this.ctx.me.touch;
      this.ui = h(`<div class="passthru" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel sf-hud"><span id="sfLvl"></span><b id="sfTime"></b><span id="sfLines"></span><span id="sfScore"></span></div></div>
        ${touch ? `<div class="sf-ctrl"><div class="sf-l"><button data-k="L">◀</button><button data-k="R">▶</button></div>
          <div class="sf-r"><button data-k="D">▼</button><button data-k="U">⟳</button><button data-k="H" class="hd">⤓</button></div></div>` : ''}
      </div>`);
      this.ctx.ui.appendChild(this.ui);
      this.ui.querySelectorAll('[data-k]').forEach((b) => {
        let rep = null, hold = null;
        const k = b.dataset.k;
        const stop = () => { clearTimeout(hold); clearInterval(rep); b.classList.remove('on'); if (k === 'D') this.soft = false; };
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault(); b.classList.add('on');
          if (k === 'L' || k === 'R') { this.move(k === 'L' ? -1 : 1); hold = setTimeout(() => (rep = setInterval(() => this.move(k === 'L' ? -1 : 1), 55)), 170); }
          if (k === 'U') this.rotate(1);
          if (k === 'H') this.hardDrop();
          if (k === 'D') this.soft = true;
        });
        b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop); b.addEventListener('pointerleave', stop);
      });
    }
    updateHud() {
      const S = this.S; if (!S) return;
      const hud = $('.sf-hud', this.ui); hud.style.visibility = S.phase === 'menu' ? 'hidden' : '';
      const L = levelDef(S.lvl);
      $('#sfLvl', this.ui).textContent = S.lvl <= LEVELS.length ? `ур. ${S.lvl}` : '∞';
      $('#sfLines', this.ui).textContent = L.goal ? `ряды ${S.lines}/${L.goal}` : `ряды ${S.lines}`;
      $('#sfScore', this.ui).textContent = `✦ ${S.score}`;
    }

    // ================= Своя фигура =================
    nextType() {
      if (!this.bag.length) this.bag = this.rng.shuffle(TYPES.split(''));
      const t = this.bag.pop();
      const L = levelDef(this.S.lvl);
      return { t, s: L.stars && this.rng() < 0.15 ? this.rng.int(0, 3) : -1 };
    }
    spawn() {
      while (this.queue.length < 3) this.queue.push(this.nextType());
      const q = this.queue.shift(); this.queue.push(this.nextType());
      const p = { t: q.t, s: q.s, r: 0, x: this.me === 'A' ? 1 : COLS - 5, y: q.t === 'I' ? -1 : 0 };
      this.piece = p; this.fallT = 0; this.lockT = 0; this.lockMoves = 0; this.vis = null;
      if (this.collide(p, 0, 0)) {
        p.y--;
        if (this.collide(p, 0, 0)) { this.piece = null; if (this.ctx.isHost) this.onMsg({ a: 'top' }); else this.ctx.send({ a: 'top' }); return; }
      }
      this.sendPiece();
    }
    cells(p, dx = 0, dy = 0, r = p.r) { return SHAPES[p.t][r].map(([x, y], i) => [p.x + x + dx, p.y + y + dy, i]); }
    occupied(x, y) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y < 0) return false;
      if (this.board[y * COLS + x] !== '.') return true;
      return this.pending.some((pp) => pp.cells.some(([cx, cy]) => cx === x && cy === y));
    }
    collide(p, dx, dy, r) { return this.cells(p, dx, dy, r).some(([x, y]) => this.occupied(x, y)); }
    canAct() { return this.piece && this.S && this.S.phase === 'play'; }
    move(dx) {
      if (!this.canAct() || this.collide(this.piece, dx, 0)) return;
      this.piece.x += dx; SFX.play('tick'); this.touchLock(); this.sendPiece();
    }
    rotate(dir) {
      if (!this.canAct()) return;
      const p = this.piece; if (p.t === 'O') return;
      const r = (p.r + dir + 4) % 4;
      for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) {
        if (!this.collide(p, kx, ky, r)) { p.r = r; p.x += kx; p.y += ky; SFX.tone(700, 0.06, { type: 'triangle', vol: 0.1 }); this.touchLock(); this.sendPiece(); return; }
      }
    }
    touchLock() { if (this.lockT > 0 && this.lockMoves++ < 14) this.lockT = 0; }
    hardDrop() {
      if (!this.canAct()) return;
      let d = 0; while (!this.collide(this.piece, 0, d + 1)) d++;
      this.piece.y += d;
      const lay = this.lay;
      if (lay) this.cells(this.piece).forEach(([x, y]) => this.parts.emit(lay.bx + (x + 0.5) * lay.c, lay.by + (y + 0.5) * lay.c, { n: 2, speed: 60, life: 0.5, size: lay.c * 0.3, angle: -Math.PI / 2, spread: 0.6, color: '#fff' }));
      SFX.play('pop');
      this.lock();
    }
    lock() {
      const p = this.piece; if (!p) return;
      const up = this.me === 'A';
      const ch = (up ? 'ABCDEFG' : 'abcdefg')[TYPES.indexOf(p.t)];
      const cells = this.cells(p).map(([x, y, i]) => [x, y, i === p.s ? '*' : ch]);
      this.piece = null;
      SFX.tone(160, 0.08, { type: 'sine', vol: 0.25 });
      if (this.ctx.isHost) this.merge(cells, 'A', 0);
      else { const id = ++this.lockId; this.pending.push({ id, cells }); this.ctx.send({ a: 'lock', id, cells }); }
      if (this.S.phase === 'play') this.spawn();
    }
    sendPiece() {
      const p = this.piece;
      this.ctx.send({ a: 'p', p: p ? { t: p.t, r: p.r, x: p.x, y: p.y, s: p.s, q: this.queue.slice(0, 2).map((q) => q.t) } : null });
    }
    updatePiece(dt) {
      if (!this.canAct()) return;
      const k = this.keys;
      if (k.once('ArrowLeft', 'KeyA')) { this.move(-1); this.das = -0.17; }
      if (k.once('ArrowRight', 'KeyD')) { this.move(1); this.das = -0.17; }
      const hd = k.any('ArrowLeft', 'KeyA') ? -1 : k.any('ArrowRight', 'KeyD') ? 1 : 0;
      if (hd) { this.das = (this.das || 0) + dt; while (this.das > 0.05) { this.das -= 0.05; this.move(hd); } } else this.das = 0;
      if (k.once('ArrowUp', 'KeyW', 'KeyX')) this.rotate(1);
      if (k.once('KeyZ', 'KeyQ')) this.rotate(-1);
      if (k.once('Space')) return this.hardDrop();
      const soft = this.soft || k.any('ArrowDown', 'KeyS');
      const S = this.S, L = levelDef(S.lvl);
      const speed = L.goal ? L.speed : Math.max(0.12, L.speed - S.lines * 0.012);
      const p = this.piece;
      if (this.collide(p, 0, 1)) {
        this.lockT += dt;
        if (this.lockT > 0.5) this.lock();
      } else {
        this.lockT = 0;
        this.fallT += dt;
        const step = soft ? Math.min(0.04, speed) : speed;
        while (this.fallT >= step) {
          this.fallT -= step;
          if (this.collide(p, 0, 1)) break;
          p.y++; this.sendPieceSoon = true;
        }
      }
      if (this.sendPieceSoon && (this._pT = (this._pT || 0) + dt) > 0.08) { this._pT = 0; this.sendPieceSoon = false; this.sendPiece(); }
    }

    // ================= Ввод: свайпы по полю =================
    bindInput() {
      const c = this.ctx.canvas;
      let st = null;
      c.addEventListener('pointerdown', (e) => { st = { x: e.clientX, y: e.clientY, t: performance.now(), mx: 0, moved: false }; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', (e) => {
        if (!st || !this.lay) return;
        const cw = Math.max(18, this.lay.c * 0.9);
        const dx = e.clientX - st.x, steps = Math.trunc(dx / cw);
        while (st.mx < steps) { this.move(1); st.mx++; st.moved = true; }
        while (st.mx > steps) { this.move(-1); st.mx--; st.moved = true; }
        if (e.clientY - st.y > cw * 1.2) { this.soft = true; st.moved = true; st.soft = true; }
      });
      const end = (e) => {
        if (!st) return;
        const dy = e.clientY - st.y, dt = performance.now() - st.t;
        if (st.soft) this.soft = false;
        if (dy > 70 && dt < 260) this.hardDrop();
        else if (!st.moved && dt < 300 && Math.abs(e.clientX - st.x) < 12) this.rotate(1);
        st = null;
      };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    }

    // ================= Кадр =================
    layout(w, hh) {
      const touch = this.ctx.me.touch, port = hh > w;
      const top = 62, ctrlB = touch && port ? 150 : 28, sideRes = touch && !port ? 150 : 0;
      const availW = w - sideRes * 2 - 20, availH = hh - top - ctrlB;
      // в портрете превью сверху, в ландшафте — по бокам
      let c;
      if (port) c = Math.floor(Math.min(availW / COLS, (availH - 54) / ROWS));
      else c = Math.floor(Math.min(availW / (COLS + 9), availH / ROWS));
      c = clamp(c, 10, 52);
      const bw = c * COLS, bh = c * ROWS;
      const bx = Math.round((w - bw) / 2), by = port ? Math.round(top + 54 + (availH - 54 - bh) / 2) : Math.round(top + (availH - bh) / 2);
      return { c, bx, by, bw, bh, port };
    }
    frame(dt, t) {
      const g = this.g, cv = this.ctx.canvas, dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.sky.resize(w, hh); this.sky.draw(g, t, dt);
      const lay = (this.lay = this.layout(w, hh));
      const S = this.S;
      if (S && S.phase === 'play') this.updatePiece(dt);
      if (S && S.phase !== 'menu') {
        const L = levelDef(S.lvl);
        const tl = S.phase === 'play' ? S.time + (L.time ? -1 : 1) * (performance.now() - this.recvAt) / 1000 : S.time;
        const el = $('#sfTime', this.ui); if (el) { el.textContent = `⏱ ${fmt(tl)}`; el.classList.toggle('hot', !!L.time && tl < 20 && S.phase === 'play'); }
        if (S.phase === 'intro') { const o = this.ui.querySelector('.lv-cd'); if (o) o.textContent = Math.max(1, Math.ceil(S.cd - (performance.now() - this.recvAt) / 1000)); }
      }
      this.parts.update(dt);
      this.shake = Math.max(0, this.shake - dt);
      g.save();
      if (this.shake > 0) g.translate(rand(-1, 1) * this.shake * 14, rand(-1, 1) * this.shake * 14);
      this.drawBoard(g, lay, t, dt);
      g.restore();
      this.parts.draw(g);
    }
    drawBoard(g, L, t, dt) {
      const { c, bx, by, bw, bh } = L, S = this.S;
      const lvl = S ? levelDef(S.lvl) : LEVELS[0];
      // рамка-стекло
      g.globalCompositeOperation = 'lighter';
      Glow.draw(g, bx + bw / 2, by + bh / 2, Math.max(bw, bh) * 0.75, '#6a5cff', 0.12);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(8,8,28,0.72)'; roundRect(g, bx - 8, by - 8, bw + 16, bh + 16, 16); g.fill();
      g.strokeStyle = 'rgba(190,170,255,0.35)'; g.lineWidth = 2; roundRect(g, bx - 8, by - 8, bw + 16, bh + 16, 16); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 1;
      for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(bx + x * c, by); g.lineTo(bx + x * c, by + bh); g.stroke(); }
      for (let y = 1; y < ROWS; y++) { g.beginPath(); g.moveTo(bx, by + y * c); g.lineTo(bx + bw, by + y * c); g.stroke(); }
      if (!S || S.phase === 'menu') return;
      // источники света для тёмной ночи
      const lights = [];
      const peer = this.peerP;
      if (this.piece) this.cells(this.piece).forEach(([x, y]) => lights.push([x, y]));
      if (peer) SHAPES[peer.t][peer.r].forEach(([x, y]) => lights.push([peer.x + x, peer.y + y]));
      const light = (x, y) => {
        if (!lvl.dark) return 1;
        let d = 99; for (const [lx, ly] of lights) d = Math.min(d, Math.hypot(lx - x, ly - y));
        return clamp(1.15 - d / 4.5, 0.06, 1);
      };
      // доска
      const b = this.board;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const ch = b[y * COLS + x]; if (ch === '.') continue;
        const a = light(x, y);
        g.globalAlpha = a;
        g.drawImage(cellSprite(colorOf(ch), ch === '*'), bx + x * c, by + y * c, c, c);
      }
      g.globalAlpha = 0.85;
      for (const pp of this.pending) for (const [x, y, ch] of pp.cells) if (y >= 0) g.drawImage(cellSprite(colorOf(ch), ch === '*'), bx + x * c, by + y * c, c, c);
      g.globalAlpha = 1;
      // фигура партнёра
      if (peer && S.phase === 'play') {
        if (!this.peerVis || this.peerVis.t !== peer.t) this.peerVis = { x: peer.x, y: peer.y, t: peer.t };
        const pv = this.peerVis; const k = 1 - Math.exp(-dt * 18);
        pv.x = lerp(pv.x, peer.x, k); pv.y = lerp(pv.y, peer.y, k);
        const pc = PAL[this.me === 'A' ? 'B' : 'A'][TYPES.indexOf(peer.t)];
        g.globalAlpha = 0.9;
        SHAPES[peer.t][peer.r].forEach(([x, y], i) => { const yy = pv.y + y; if (yy > -1) g.drawImage(cellSprite(pc, i === peer.s), bx + (pv.x + x) * c, by + yy * c, c, c); });
        g.globalAlpha = 1;
        const nx = bx + (pv.x + 1.5) * c, ny = by + Math.max(0, pv.y) * c - 6;
        g.font = `700 ${Math.max(10, c * 0.42)}px Comfortaa`; g.textAlign = 'center'; g.fillStyle = hexA(pc, 0.9);
        g.fillText(this.ctx.peer.name, nx, ny);
      }
      // своя фигура + тень приземления
      const p = this.piece;
      if (p && S.phase === 'play') {
        let d = 0; while (!this.collide(p, 0, d + 1) && d < ROWS) d++;
        const col = PAL[this.me][TYPES.indexOf(p.t)];
        g.strokeStyle = hexA(col, 0.55); g.lineWidth = 2;
        this.cells(p, 0, d).forEach(([x, y]) => { if (y >= 0) { roundRect(g, bx + x * c + 3, by + y * c + 3, c - 6, c - 6, c * 0.18); g.stroke(); } });
        if (!this.vis || this.vis.t !== p.t) this.vis = { x: p.x, y: p.y, t: p.t };
        const k = 1 - Math.exp(-dt * 30);
        this.vis.x = lerp(this.vis.x, p.x, k); this.vis.y = lerp(this.vis.y, p.y, k);
        g.globalCompositeOperation = 'lighter';
        const cx = bx + (this.vis.x + 1.5) * c, cy = by + (this.vis.y + 1) * c;
        Glow.draw(g, cx, cy, c * 3.2, col, 0.22);
        g.globalCompositeOperation = 'source-over';
        SHAPES[p.t][p.r].forEach(([x, y], i) => { const yy = this.vis.y + y; if (yy > -1) g.drawImage(cellSprite(col, i === p.s), bx + (this.vis.x + x) * c, by + yy * c, c, c); });
      }
      // вспышки собранных рядов
      for (let i = this.clearFx.length - 1; i >= 0; i--) {
        const f = this.clearFx[i]; f.t += dt;
        if (f.t > 0.6) { this.clearFx.splice(i, 1); continue; }
        const a = 1 - f.t / 0.6;
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(255,240,210,${a * 0.8})`; g.fillRect(bx - f.t * 40, by + f.y * c + c * 0.5 - c * 0.5 * a, bw + f.t * 80, c * a);
        g.globalCompositeOperation = 'source-over';
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i]; f.t += dt;
        if (f.t > 1.6) { this.floaters.splice(i, 1); continue; }
        g.globalAlpha = Math.min(1, (1.6 - f.t) * 2);
        g.font = `700 ${Math.max(16, c * (f.big ? 0.9 : 0.7))}px Comfortaa`; g.textAlign = 'center';
        g.fillStyle = '#fff3c4'; g.shadowColor = '#ffb347'; g.shadowBlur = 16;
        g.fillText(f.txt, bx + bw / 2, by + f.y * c - f.t * c * 1.5);
        g.shadowBlur = 0; g.globalAlpha = 1;
      }
      // превью следующих фигур
      this.drawNext(g, L, this.queue.slice(0, 2).map((q) => q.t), this.me, 'ты');
      this.drawNext(g, L, peer && peer.q ? peer.q : [], this.me === 'A' ? 'B' : 'A', this.ctx.peer.name);
      // таймер-полоса
      if (lvl.goal && S.phase === 'play') {
        const k = clamp(S.lines / lvl.goal, 0, 1);
        g.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(g, bx, by + bh + 12, bw, 6, 3); g.fill();
        const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ffb3d6'); gr.addColorStop(1, '#9fe7ff');
        g.fillStyle = gr; roundRect(g, bx, by + bh + 12, Math.max(6, bw * k), 6, 3); g.fill();
      }
    }
    drawNext(g, L, types, owner, label) {
      const { c, bx, by, bw, port } = L;
      const mine = owner === this.me;
      const s = Math.max(8, Math.round(c * (port ? 0.42 : 0.6)));
      let x, y;
      if (port) { x = mine ? bx + bw - s * 9 : bx; y = by - s * 2 - 12; }
      else { x = mine ? bx + bw + 22 : bx - 22 - s * 4.6; y = by + 10; }
      g.font = `700 ${Math.max(10, s * 0.9)}px Comfortaa`; g.textAlign = 'left';
      g.fillStyle = owner === 'A' ? '#ffb3d6' : '#9fe7ff';
      g.fillText(label.slice(0, 10), x, y - 6);
      types.forEach((t, i) => {
        const col = PAL[owner][TYPES.indexOf(t)];
        const ox = port ? x + i * s * 4.6 : x, oy = port ? y : y + i * s * 3.4;
        g.globalAlpha = i ? 0.6 : 1;
        SHAPES[t][0].forEach(([cx, cy]) => g.drawImage(cellSprite(col), ox + cx * s, oy + cy * s, s, s));
        g.globalAlpha = 1;
      });
    }

    resync() { if (this.S && this.ctx.isHost) this.broadcast(); this.sendPiece(); }
    destroy() { clearInterval(this.hostT); this.keys.destroy(); }
  }
})();
