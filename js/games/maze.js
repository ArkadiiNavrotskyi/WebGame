'use strict';
// «Слепой лабиринт» — Ходок идёт в темноте с фонариком, Штурман видит всю карту, ставит маячки и открывает ворота.
(() => {
  const LEVELS = [
    { name: 'Первые шаги', w: 5, h: 4, desc: 'Штурман видит карту, Ходок — только круг света. Найдите выход!' },
    { name: 'Извилистый путь', w: 7, h: 5, braid: 0.08, desc: 'Коридоры петляют. Штурман, ставь маячки касанием по карте.' },
    { name: 'Золотой ключ', w: 7, h: 5, keys: 1, desc: 'Дверь откроется только ключом того же цвета.' },
    { name: 'Два ключа', w: 8, h: 6, keys: 2, desc: 'Сначала один ключ, потом другой — порядок важен.' },
    { name: 'Призрак', w: 8, h: 6, ghosts: 1, desc: 'Ходок не видит призрака, пока тот не подойдёт вплотную. Предупреждай!' },
    { name: 'Шёпот в темноте', w: 9, h: 6, ghosts: 2, keys: 1, desc: 'Два призрака и ключ.' },
    { name: 'Шипы', w: 9, h: 7, spikes: 7, desc: 'Шипы то вылезают, то прячутся. Штурман командует: «3, 2, 1 — иди!»' },
    { name: 'Ворота', w: 10, h: 7, gates: 2, ghosts: 1, desc: 'Ворота открывает только Штурман — касанием, на 6 секунд.' },
    { name: 'Всё сразу', w: 11, h: 7, keys: 2, spikes: 6, ghosts: 2, desc: 'Ключи, шипы и призраки вместе.' },
    { name: 'Тьма сгущается', w: 12, h: 8, ghosts: 2, gates: 2, light: 1.5, desc: 'Фонарь Ходока светит слабее.' },
    { name: 'Глубины', w: 13, h: 8, keys: 2, spikes: 8, ghosts: 3, gates: 2, light: 1.5, desc: 'Огромный лабиринт. Не спешите.' },
    { name: 'Сердце лабиринта', w: 14, h: 9, keys: 2, spikes: 8, ghosts: 3, gates: 3, light: 1.45, desc: 'Последний лабиринт. В самом центре — свет.' },
  ];
  const levelDef = (n) => (n <= LEVELS.length ? LEVELS[n - 1] : { name: `Бесконечный · ${n - LEVELS.length}`, w: 12 + ((n * 7) % 4), h: 8 + (n % 2), keys: 2, spikes: 6 + (n % 4), ghosts: 2 + (n % 3), gates: 2, light: 1.5, desc: 'Новый лабиринт каждый раз.' });
  const KEYC = [['#ffd36b', 'золотой'], ['#7ae0ff', 'голубой']];
  const SPIKE_P = 2.6, SPIKE_ON = 1.0, GATE_T = 6;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ---------- Генерация лабиринта: одинаковая у обоих ----------
  // если двери или ворота не встали — пробуем другой вариант того же уровня
  function genMaze(seed, L) {
    let M;
    for (let a = 0; a < 20; a++) {
      M = genOnce(seed + a * 7777, L);
      if (M.keys.length === (L.keys || 0) && M.gates.length === (L.gates || 0)) return M;
    }
    return M;
  }
  function genOnce(seed, L) {
    const r = RNG(seed >>> 0);
    const TW = L.w * 2 + 1, TH = L.h * 2 + 1;
    const g = new Uint8Array(TW * TH).fill(1);
    const idx = (x, y) => y * TW + x;
    const vis = new Uint8Array(L.w * L.h);
    const st = [[0, 0]]; vis[0] = 1; g[idx(1, 1)] = 0;
    while (st.length) {
      const [cx, cy] = st[st.length - 1];
      const nb = DIRS.map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < L.w && y < L.h && !vis[y * L.w + x]);
      if (!nb.length) { st.pop(); continue; }
      const [nx, ny] = r.pick(nb);
      vis[ny * L.w + nx] = 1;
      g[idx(nx * 2 + 1, ny * 2 + 1)] = 0; g[idx(cx + nx + 1, cy + ny + 1)] = 0;
      st.push([nx, ny]);
    }
    // петли, чтобы были разные пути
    const braid = L.braid ?? 0.1;
    for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) {
      if (g[idx(x, y)] !== 1 || (x % 2) === (y % 2)) continue;
      const hz = x % 2 === 0;
      const a = hz ? g[idx(x - 1, y)] : g[idx(x, y - 1)], b = hz ? g[idx(x + 1, y)] : g[idx(x, y + 1)];
      if (a === 0 && b === 0 && r() < braid) g[idx(x, y)] = 0;
    }
    const M = { TW, TH, g, start: [1, 1] };
    const floor = (x, y) => x > 0 && y > 0 && x < TW - 1 && y < TH - 1 && g[idx(x, y)] === 0;
    M.floor = floor;
    const bfs = (sx, sy, blocked = new Set()) => {
      const d = new Int32Array(TW * TH).fill(-1), par = new Int32Array(TW * TH).fill(-1);
      const q = [idx(sx, sy)]; d[q[0]] = 0;
      for (let i = 0; i < q.length; i++) {
        const c = q[i], x = c % TW, y = (c / TW) | 0;
        for (const [dx, dy] of DIRS) {
          const n = idx(x + dx, y + dy);
          if (!floor(x + dx, y + dy) || d[n] >= 0 || blocked.has(n)) continue;
          d[n] = d[c] + 1; par[n] = c; q.push(n);
        }
      }
      return { d, par };
    };
    const B = bfs(1, 1);
    let far = idx(1, 1);
    for (let y = 1; y < TH; y += 2) for (let x = 1; x < TW; x += 2) if (B.d[idx(x, y)] > B.d[far]) far = idx(x, y);
    M.exit = [far % TW, (far / TW) | 0];
    const path = []; for (let c = far; c >= 0; c = B.par[c]) path.unshift(c);
    const reach = (blocked) => bfs(1, 1, blocked).d[far] >= 0;
    const used = new Set([idx(1, 1), far]);
    // двери и ворота ставим только туда, где их не обойти
    const blockers = [];
    const pickBridge = (frac, ok = () => true) => {
      const order = path.map((c, i) => [c, Math.abs(i / path.length - frac)]).sort((a, b) => a[1] - b[1]);
      for (const [c] of order) {
        const pi = path.indexOf(c);
        if (pi < 3 || pi > path.length - 3 || used.has(c)) continue;
        if (!reach(new Set([c])) && ok(c)) { used.add(c); blockers.push(c); return c; }
      }
      return -1;
    };
    M.doors = []; M.keys = [];
    for (let k = 0; k < (L.keys || 0); k++) {
      // новая дверь не должна отрезать уже лежащие ключи
      const c = pickBridge((k + 1) / ((L.keys || 0) + 1.3), (cand) => M.keys.every((ky) => {
        const bl = new Set(M.doors.filter((dd) => dd.k >= ky.k).map((dd) => idx(dd.x, dd.y)).concat([cand]));
        return bfs(1, 1, bl).d[idx(ky.x, ky.y)] >= 0;
      }));
      if (c < 0) break;
      // ключ — в области, куда можно дойти, не открывая эту и следующие двери
      const D = bfs(1, 1, new Set([c]));
      let best = -1, bs = -1;
      for (let y = 1; y < TH; y += 2) for (let x = 1; x < TW; x += 2) {
        const i = idx(x, y); if (D.d[i] < 0 || used.has(i)) continue;
        const nb = DIRS.filter(([dx, dy]) => floor(x + dx, y + dy)).length;
        const s = D.d[i] + (nb === 1 ? 6 : 0) + r() * 6;
        if (s > bs) { bs = s; best = i; }
      }
      if (best < 0) break;
      used.add(best);
      M.doors.push({ x: c % TW, y: (c / TW) | 0, k });
      M.keys.push({ x: best % TW, y: (best / TW) | 0, k });
    }
    M.gates = [];
    for (let k = 0; k < (L.gates || 0); k++) {
      const c = pickBridge(0.2 + (k + 0.5) * (0.7 / (L.gates || 1)));
      if (c >= 0) M.gates.push({ x: c % TW, y: (c / TW) | 0, id: k });
    }
    // звёзды — в тупиках
    const ends = [];
    for (let y = 1; y < TH; y += 2) for (let x = 1; x < TW; x += 2) {
      const i = idx(x, y); if (used.has(i)) continue;
      if (DIRS.filter(([dx, dy]) => floor(x + dx, y + dy)).length === 1) ends.push(i);
    }
    r.shuffle(ends);
    const cells = [];
    for (let y = 1; y < TH; y += 2) for (let x = 1; x < TW; x += 2) if (!used.has(idx(x, y))) cells.push(idx(x, y));
    r.shuffle(cells);
    M.stars = [];
    for (const c of ends.concat(cells)) { if (M.stars.length >= 3) break; if (used.has(c) || B.d[c] < 3) continue; used.add(c); M.stars.push({ x: c % TW, y: (c / TW) | 0, id: M.stars.length }); }
    // шипы — на коридорах, половина на главном пути
    M.spikes = [];
    const corr = path.filter((c) => !used.has(c) && path.indexOf(c) > 2);
    const pool = r.shuffle(corr.slice()).slice(0, Math.ceil((L.spikes || 0) / 2));
    const rest = []; for (let i = 0; i < TW * TH; i++) if (g[i] === 0 && !used.has(i) && B.d[i] > 3) rest.push(i);
    r.shuffle(rest);
    for (const c of pool.concat(rest)) { if (M.spikes.length >= (L.spikes || 0)) break; if (used.has(c)) continue; used.add(c); M.spikes.push({ x: c % TW, y: (c / TW) | 0, ph: r.range(0, SPIKE_P) }); }
    // призраки — подальше от старта
    M.ghosts = [];
    const gc = cells.filter((c) => B.d[c] > 10 && !used.has(c));
    for (let i = 0; i < (L.ghosts || 0) && gc.length; i++) { const c = gc.splice(r.int(0, gc.length - 1), 1)[0]; M.ghosts.push([c % TW, (c / TW) | 0]); }
    M.pathLen = path.length;
    return M;
  }
  const spikeOn = (s, T) => ((T + s.ph) % SPIKE_P) < SPIKE_ON;

  // ---------- Спрайты стен и пола ----------
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const mk = (fn) => { const c = document.createElement('canvas'); c.width = c.height = 64; fn(c.getContext('2d')); return c; };
    const floor = [0, 1, 2].map((v) => mk((g) => {
      const r = RNG(v * 99 + 5);
      g.fillStyle = '#1e1a2e'; g.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${r.int(60, 90)},${r.int(50, 80)},${r.int(90, 130)},${r.range(0.2, 0.45)})`; roundRect(g, r.range(0, 40), r.range(0, 40), r.range(14, 28), r.range(12, 24), 5); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
    }));
    const wall = mk((g) => {
      const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#5b4f7d'); gr.addColorStop(1, '#2c2442');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = 'rgba(20,14,34,0.7)'; g.lineWidth = 3;
      for (let y = 0; y < 64; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); const o = (y / 21) % 2 ? 16 : 40; g.beginPath(); g.moveTo(o, y); g.lineTo(o, y + 21); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, 64, 4);
    });
    SPR = { floor, wall };
    return SPR;
  }
  function ghostShape(g, x, y, s, t, alpha) {
    g.save(); g.globalAlpha = alpha; g.translate(x, y + Math.sin(t * 3) * s * 0.08);
    const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, 'rgba(230,220,255,0.95)'); gr.addColorStop(1, 'rgba(170,140,255,0.3)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, -s * 0.15, s * 0.55, Math.PI, 0);
    g.lineTo(s * 0.55, s * 0.55);
    for (let i = 0; i < 4; i++) { const xx = s * 0.55 - (i + 0.5) * s * 0.275; g.quadraticCurveTo(xx + s * 0.07, s * (0.35 + 0.25 * Math.sin(t * 6 + i)), xx - s * 0.137, s * 0.55); }
    g.closePath(); g.fill();
    g.fillStyle = '#2a1a4a'; g.beginPath(); g.arc(-s * 0.18, -s * 0.18, s * 0.09, 0, TAU); g.arc(s * 0.18, -s * 0.18, s * 0.09, 0, TAU); g.fill();
    g.restore();
  }

  GAMES.maze = {
    id: 'maze', title: 'Слепой лабиринт', icon: '🕯️', color: '#ffc46b',
    tagline: 'Один идёт в темноте, другой видит карту',
    roles: [
      { id: 'walker', name: 'Ходок', icon: '🕯️', desc: 'Идёшь по тёмному лабиринту с маленьким фонариком. Видишь только то, что рядом. Слушай Штурмана!', ctrl: { pc: 'WASD или стрелки — идти', touch: 'крестик справа или свайп — идти' } },
      { id: 'nav', name: 'Штурман', icon: '🗺️', desc: 'Видишь весь лабиринт сверху: Ходока, призраков, шипы, ключи и выход. Ставишь маячки и открываешь ворота.', ctrl: { pc: 'клик по карте — маячок, по воротам — открыть', touch: 'касание карты — маячок, касание ворот — открыть' } },
    ],
    rules: [
      'Ходок видит только маленький круг света. Штурман видит всю карту — объясняй дорогу: «вперёд два, потом направо».',
      'Штурман касается карты — там вспыхивает маячок, который Ходок видит сквозь темноту (и стрелку к нему).',
      'Ключи открывают двери своего цвета. Призраки и шипы отнимают сердце. Ворота открывает только Штурман — на 6 секунд.',
      'Соберите 3 звезды, если хватит смелости. 12 уровней, потом бесконечный режим.',
    ],
    info() { const m = Store.get('mz_max', 1); return m > LEVELS.length ? 'все 12 пройдены ✦' : `уровень ${m} из ${LEVELS.length}`; },
    create(ctx) { document.body.classList.toggle('landscape', ctx.role === 'nav' && ctx.me.touch); return new Maze(ctx); },
  };

  class Maze {
    constructor(ctx) {
      this.ctx = ctx;
      this.walker = ctx.role === 'walker';
      this.g = ctx.canvas.getContext('2d');
      this.keys = new Keys();
      this.parts = new Particles();
      this.dark = document.createElement('canvas'); this.dg = this.dark.getContext('2d');
      this.sky = new Sky({ density: 0.5, palette: ['#3a2a6b', '#1d3b6b', '#5a2a5b'] });
      this.S = null; this.M = null; this.mkey = '';
      this.pos = null; this.vis = null; this.ghosts = []; this.gT = 0; this.ghRecv = 0;
      this.pings = []; this.taps = []; this.trail = new Set(); this.moveCD = 0; this.inv = 0; this.hitFx = 0;
      this.buildUI(); this.bindInput();
      if (ctx.isHost) {
        this.S = { phase: 'menu', lvl: 1, att: -1, max: Store.get('mz_max', 1), T: 0, hearts: 3, stars: [], keys: [], gates: {} };
        this.hostT = setInterval(() => this.hostTick(), 100); this.lastTick = performance.now();
        this.broadcast();
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ================= Хост =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.applyS(this.S); }
    event(e) { this.ctx.send({ a: 'ev', e }); this.onEvent(e); }
    hostTick() {
      const now = performance.now(), dt = Math.min(0.5, (now - this.lastTick) / 1000); this.lastTick = now;
      const S = this.S; if (!S) return;
      if (S.phase === 'intro') { S.cd -= dt; if (S.cd <= 0) { S.phase = 'play'; S.T = 0; this.broadcast(); } return; }
      if (S.phase !== 'play' || !this.M) return;
      S.T += dt;
      const L = levelDef(S.lvl), sp = 1.35 + S.lvl * 0.05;
      for (const gh of this.hg) {
        const dx = gh.tx - gh.x, dy = gh.ty - gh.y, d = Math.hypot(dx, dy);
        if (d < sp * dt) {
          gh.x = gh.tx; gh.y = gh.ty;
          let opts = DIRS.filter(([ax, ay]) => this.M.floor(gh.x + ax, gh.y + ay) && !(gh.x + ax === gh.px && gh.y + ay === gh.py));
          if (!opts.length) opts = DIRS.filter(([ax, ay]) => this.M.floor(gh.x + ax, gh.y + ay));
          let ch = pick(opts);
          // иногда идёт в сторону Ходока
          const w = this.walker ? this.pos : this.rPos;
          if (w && Math.random() < 0.3 + (L.ghosts || 0) * 0.05) {
            ch = opts.slice().sort((a, b) => Math.hypot(gh.x + a[0] - w.x, gh.y + a[1] - w.y) - Math.hypot(gh.x + b[0] - w.x, gh.y + b[1] - w.y))[0];
          }
          gh.px = gh.x; gh.py = gh.y; gh.tx = gh.x + ch[0]; gh.ty = gh.y + ch[1];
        } else { gh.x += (dx / d) * sp * dt; gh.y += (dy / d) * sp * dt; }
      }
      const gs = this.hg.map((gh) => [+gh.x.toFixed(2), +gh.y.toFixed(2)]);
      this.ctx.send({ a: 'gh', g: gs, T: +S.T.toFixed(2) });
      this.ghosts = gs; this.ghRecv = performance.now();
      if ((this._sync = (this._sync || 0) + dt) > 2) { this._sync = 0; this.broadcast(); }
    }
    startLevel(lvl) {
      const S = this.S;
      S.att = lvl === S.lvl ? S.att + 1 : 0; S.lvl = lvl;
      Object.assign(S, { phase: 'intro', cd: 3, T: 0, hearts: 3, stars: [], keys: [], gates: {}, hits: 0 });
      this.broadcast();
    }
    hostAct(d) {
      const S = this.S; if (S.phase !== 'play') return;
      const M = this.M;
      if (d.a === 'pick') {
        if (d.kind === 'star' && !S.stars.includes(d.id)) { S.stars.push(d.id); this.event({ a: 'star' }); }
        if (d.kind === 'key' && !S.keys.includes(d.id)) { S.keys.push(d.id); this.event({ a: 'key', k: d.id }); }
      }
      if (d.a === 'hit') {
        S.hearts--; S.hits = (S.hits || 0) + 1;
        this.event({ a: 'hit' });
        if (S.hearts <= 0) S.phase = 'lose';
      }
      if (d.a === 'gate') {
        const gt = M.gates[d.id]; if (!gt) return;
        S.gates[d.id] = S.T + GATE_T; this.event({ a: 'gate', id: d.id });
      }
      if (d.a === 'exit') {
        S.phase = 'win'; S.time = S.T;
        S.max = Math.max(S.max, S.lvl + 1);
        Store.set('mz_max', Math.max(Store.get('mz_max', 1), S.lvl + 1));
      }
      this.broadcast();
    }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost;
      switch (d.a) {
        case 'S': this.applyS(d.S); break;
        case 'ev': this.onEvent(d.e); break;
        case 'gh': this.ghosts = d.g; this.ghRecv = performance.now(); if (this.S) { this.S.T = d.T; this.tRecv = performance.now(); } break;
        case 'w': this.rPos = { x: d.x, y: d.y }; if (!this.walker) this.trail.add(d.x + ',' + d.y); break;
        case 'ping': this.addPing(d.x, d.y); break;
        case 'pick': case 'hit': case 'gate': case 'exit': if (host) this.hostAct(d); break;
        case 'lvl': if (host && d.lvl <= this.S.max && this.S.phase !== 'play') this.startLevel(d.lvl); break;
        case 'retry': if (host) this.startLevel(this.S.lvl); break;
        case 'next': if (host && this.S.phase === 'win') this.startLevel(this.S.lvl + 1); break;
        case 'menu': if (host) { this.S.phase = 'menu'; this.broadcast(); } break;
      }
    }
    toHost(d) { if (this.ctx.isHost) this.onMsg(d); else this.ctx.send(d); }
    curT() { const S = this.S; if (!S) return 0; return S.phase === 'play' ? S.T + (performance.now() - (this.tRecv || performance.now())) / 1000 : S.T; }
    applyS(S) {
      const prev = this._pk;
      this.S = S; this.tRecv = performance.now();
      if (S.max > Store.get('mz_max', 1)) Store.set('mz_max', S.max);
      const key = `${S.lvl}:${S.att}`;
      if (S.phase !== 'menu' && key !== this.mkey) {
        this.mkey = key;
        this.M = genMaze(this.ctx.seed * 31 + S.lvl * 7919 + S.att * 104729, levelDef(S.lvl));
        this.pos = { x: 1, y: 1 }; this.vis = { x: 1, y: 1 }; this.cp = { x: 1, y: 1 }; this.rPos = { x: 1, y: 1 };
        this.trail = new Set(['1,1']); this.pings = []; this.ghosts = this.M.ghosts.map(([x, y]) => [x, y]);
        if (this.ctx.isHost) this.hg = this.M.ghosts.map(([x, y]) => ({ x, y, tx: x, ty: y, px: -1, py: -1 }));
      }
      this._pk = `${key}:${S.phase}`;
      if (prev !== this._pk) this.onPhase(S.phase);
      this.updateHud();
    }
    onEvent(e) {
      if (e.a === 'star') { SFX.play('coin'); SFX.play('chime'); }
      if (e.a === 'key') { SFX.play('magic'); this.ctx.toast(`🗝 ${KEYC[e.k][1]} ключ найден!`); }
      if (e.a === 'hit') { SFX.play('hit'); this.hitFx = 1; }
      if (e.a === 'gate') { SFX.play('door'); }
    }

    // ================= Экраны =================
    onPhase(ph) {
      const S = this.S, L = levelDef(S.lvl);
      this.overlay(null);
      if (ph === 'menu') this.showMenu();
      if (ph === 'intro') {
        SFX.play('whoosh');
        this.overlay(`<div class="lv-intro"><div class="lv-k">${S.lvl <= LEVELS.length ? `ЛАБИРИНТ ${S.lvl} ИЗ ${LEVELS.length}` : 'БЕСКОНЕЧНЫЙ'}</div><div class="lv-n">${L.name}</div>
          <div class="lv-k2">${L.desc}</div>
          <div class="lv-k2" style="color:#ffe7a6">${this.walker ? 'Ты — Ходок: слушай Штурмана' : 'Ты — Штурман: веди Ходока, касание — маячок'}</div><div class="lv-cd"></div></div>`, true);
      }
      if (ph === 'play') { SFX.play('bellLow'); this.keys.hit = {}; }
      if (ph === 'win') {
        SFX.play('win'); setTimeout(() => SFX.play('chime'), 800);
        for (let i = 0; i < 5; i++) setTimeout(() => this.parts.emit(rand(0, innerWidth), rand(0, innerHeight * 0.6), { n: 36, speed: 300, life: 1.6, size: 12, color: ['#ffe7a6', '#9fe7ff', '#ffb3d6'] }), i * 250);
        const st = S.stars.length, last = S.lvl === LEVELS.length;
        this.overlay(`<div class="panel lv-end"><div class="mz-stars">${[0, 1, 2].map((i) => `<span class="${i < st ? 'on' : ''}">★</span>`).join('')}</div>
          <h2>${last ? 'Сердце лабиринта найдено!' : 'Выход найден!'}</h2>
          <p>Время: <b style="color:#ffe7a6">${fmt(S.time)}</b> · звёзд: ${st}/3 · сердец осталось: ${S.hearts}${last ? '<br>Вы прошли все лабиринты. Дальше — бесконечные!' : ''}</p>
          <button class="btn" data-a="next">${last ? 'Бесконечный лабиринт →' : 'Следующий лабиринт →'}</button><button class="btn ghost" data-a="retry">Ещё раз (за звёздами)</button><button class="btn ghost" data-a="menu">К уровням</button></div>`);
      }
      if (ph === 'lose') {
        SFX.play('fail');
        this.overlay(`<div class="panel lv-end"><div style="font-size:56px">🕯️</div><h2>Фонарь погас…</h2>
          <p>Сердца кончились. Лабиринт перестроится — попробуйте снова.</p>
          <button class="btn" data-a="retry">Ещё раз ⟳</button><button class="btn ghost" data-a="menu">К уровням</button></div>`);
      }
    }
    overlay(html, passive) {
      const o = this.ui.querySelector('.lv-ov'); if (o) o.remove();
      if (!html) return;
      const el = h(`<div class="lv-ov ${passive ? 'passive' : ''}">${html}</div>`);
      el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: b.dataset.a }); }));
      el.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: 'lvl', lvl: +b.dataset.l }); }));
      this.ui.appendChild(el);
    }
    showMenu() {
      const max = this.S.max, tiles = [];
      for (let i = 1; i <= LEVELS.length + 1; i++) {
        const L = levelDef(i), open = i <= max, endless = i > LEVELS.length;
        tiles.push(`<button class="lv-tile ${open ? '' : 'locked'} ${i < max && !endless ? 'done' : ''}" ${open ? `data-l="${i}"` : 'disabled'}>
          <span class="n">${endless ? '∞' : i}</span><span class="t">${endless ? 'Бесконечный' : L.name}</span><span class="m">${open ? `${L.w}×${L.h}` : '🔒'}</span></button>`);
      }
      this.overlay(`<div class="panel lv-menu"><h2>🕯️ Слепой лабиринт</h2>
        <p class="sub">${this.walker ? 'Ты — <b>Ходок</b>: идёшь в темноте' : 'Ты — <b>Штурман</b>: видишь карту'} · выберите лабиринт</p>
        <div class="lv-grid">${tiles.join('')}</div></div>`);
    }
    buildUI() {
      const touch = this.ctx.me.touch;
      this.ui = h(`<div class="passthru" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel mz-hud"><span id="mzLvl"></span><span id="mzHearts"></span><span id="mzStars"></span><span id="mzKeys"></span><b id="mzTime"></b></div></div>
        ${this.walker && touch ? `<div class="mz-pad"><button data-d="0,-1" class="u">▲</button><button data-d="-1,0" class="l">◀</button><button data-d="1,0" class="r">▶</button><button data-d="0,1" class="d">▼</button></div>` : ''}
      </div>`);
      this.ctx.ui.appendChild(this.ui);
      this.ui.querySelectorAll('[data-d]').forEach((b) => {
        const [dx, dy] = b.dataset.d.split(',').map(Number);
        const stop = () => { b.classList.remove('on'); if (this.hold && this.hold.b === b) this.hold = null; };
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); this.hold = { b, dx, dy }; this.moveCD = 0; });
        b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop); b.addEventListener('pointerleave', stop);
      });
    }
    updateHud() {
      const S = this.S; if (!S || !this.ui) return;
      $('.mz-hud', this.ui).style.visibility = S.phase === 'menu' ? 'hidden' : '';
      if (!this.M) return;
      $('#mzLvl', this.ui).textContent = S.lvl <= LEVELS.length ? `ур. ${S.lvl}` : '∞';
      $('#mzHearts', this.ui).textContent = '❤'.repeat(Math.max(0, S.hearts)) + '♡'.repeat(Math.max(0, 3 - S.hearts));
      $('#mzStars', this.ui).textContent = `★ ${S.stars.length}/3`;
      $('#mzKeys', this.ui).innerHTML = this.M.keys.map((k) => `<i style="color:${S.keys.includes(k.k) ? KEYC[k.k][0] : 'rgba(255,255,255,.2)'}">🗝</i>`).join('');
    }

    // ================= Ввод =================
    bindInput() {
      const c = this.ctx.canvas;
      if (this.walker) {
        let st = null;
        c.addEventListener('pointerdown', (e) => { st = { x: e.clientX, y: e.clientY }; });
        c.addEventListener('pointermove', (e) => {
          if (!st) return;
          const dx = e.clientX - st.x, dy = e.clientY - st.y;
          if (Math.hypot(dx, dy) > 34) {
            const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
            this.hold = { b: null, dx: d[0], dy: d[1] }; st = { x: e.clientX, y: e.clientY };
          }
        });
        const up = () => { st = null; if (this.hold && !this.hold.b) this.hold = null; };
        c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      } else {
        c.addEventListener('pointerdown', (e) => {
          if (!this.S || this.S.phase !== 'play' || !this.nl) return;
          const { ts, ox, oy } = this.nl;
          const tx = Math.floor((e.clientX - ox) / ts), ty = Math.floor((e.clientY - oy) / ts);
          this.taps.push({ x: e.clientX, y: e.clientY, t: 0 });
          const gi = this.M.gates.findIndex((gt) => Math.abs(gt.x - tx) <= 1 && Math.abs(gt.y - ty) <= 1 && Math.hypot(gt.x + 0.5 - (e.clientX - ox) / ts, gt.y + 0.5 - (e.clientY - oy) / ts) < 1.3);
          if (gi >= 0) { SFX.play('click'); this.toHost({ a: 'gate', id: gi }); return; }
          if (!this.M.floor(tx, ty)) return;
          if (performance.now() - (this.lastPing || 0) < 600) return;
          this.lastPing = performance.now();
          this.ctx.send({ a: 'ping', x: tx, y: ty }); this.addPing(tx, ty);
        });
      }
    }
    addPing(x, y) { this.pings.push({ x, y, t: 0 }); if (this.pings.length > 3) this.pings.shift(); SFX.tone(this.walker ? 990 : 880, 0.25, { vol: 0.12 }); }
    blocked(x, y) {
      const M = this.M, S = this.S;
      if (!M.floor(x, y)) return true;
      const dr = M.doors.find((d) => d.x === x && d.y === y);
      if (dr && !S.keys.includes(dr.k)) return 'door';
      const gt = M.gates.findIndex((d) => d.x === x && d.y === y);
      if (gt >= 0 && !(S.gates[gt] > this.curT())) return 'gate';
      return false;
    }
    walkerUpdate(dt) {
      const S = this.S; if (!S || S.phase !== 'play' || !this.M) return;
      this.moveCD -= dt; this.inv -= dt;
      const k = this.keys;
      let d = null;
      if (k.any('ArrowUp', 'KeyW')) d = [0, -1]; else if (k.any('ArrowDown', 'KeyS')) d = [0, 1];
      else if (k.any('ArrowLeft', 'KeyA')) d = [-1, 0]; else if (k.any('ArrowRight', 'KeyD')) d = [1, 0];
      if (!d && this.hold) d = [this.hold.dx, this.hold.dy];
      if (d && this.moveCD <= 0) {
        const nx = this.pos.x + d[0], ny = this.pos.y + d[1];
        const b = this.blocked(nx, ny);
        if (!b) {
          this.pos = { x: nx, y: ny }; this.moveCD = 0.13;
          this.trail.add(nx + ',' + ny);
          this.ctx.send({ a: 'w', x: nx, y: ny });
          SFX.tone(rand(180, 230), 0.05, { type: 'triangle', vol: 0.05 });
          this.onStep();
        } else {
          this.moveCD = 0.18;
          if (b === 'door') { if (!this._bump) this.ctx.toast('🔒 Заперто. Нужен ключ этого цвета'); this._bump = 1; setTimeout(() => (this._bump = 0), 2000); }
          if (b === 'gate') { if (!this._bump) this.ctx.toast('⛓ Ворота закрыты — попроси Штурмана открыть'); this._bump = 1; setTimeout(() => (this._bump = 0), 2000); }
          SFX.tone(90, 0.08, { vol: 0.12 });
        }
      }
      // опасности
      if (this.inv <= 0) {
        const T = this.curT();
        const onSpike = this.M.spikes.some((s) => s.x === this.pos.x && s.y === this.pos.y && spikeOn(s, T));
        const ghost = this.ghosts.some(([gx, gy]) => Math.hypot(gx - this.vis.x, gy - this.vis.y) < 0.62);
        if (onSpike || ghost) {
          this.inv = 1.6;
          this.toHost({ a: 'hit' });
          this.parts.emit(innerWidth / 2, innerHeight / 2, { n: 24, speed: 200, life: 0.8, size: 10, color: ['#ff5c7a', '#fff'] });
          this.pos = { ...this.cp }; this.vis = { ...this.cp };
          this.ctx.send({ a: 'w', x: this.pos.x, y: this.pos.y });
          this.ctx.toast(ghost ? '👻 Призрак! Назад к последнему ключу' : '🔺 Шипы! Назад к последнему ключу');
        }
      }
    }
    onStep() {
      const { x, y } = this.pos, M = this.M, S = this.S;
      const st = M.stars.find((s) => s.x === x && s.y === y && !S.stars.includes(s.id));
      if (st) { this.toHost({ a: 'pick', kind: 'star', id: st.id }); this.burstAt(x, y, '#ffe27a'); }
      const ky = M.keys.find((s) => s.x === x && s.y === y && !S.keys.includes(s.k));
      if (ky) { this.toHost({ a: 'pick', kind: 'key', id: ky.k }); this.cp = { x, y }; this.burstAt(x, y, KEYC[ky.k][0]); }
      if (x === M.exit[0] && y === M.exit[1]) this.toHost({ a: 'exit' });
    }
    burstAt(x, y, c) { const l = this.wl; if (l) this.parts.emit(l.ox + (x + 0.5) * l.ts, l.oy + (y + 0.5) * l.ts, { n: 26, speed: 180, life: 1, size: 10, color: [c, '#fff'] }); }

    // ================= Кадр =================
    frame(dt, t) {
      const g = this.g, cv = this.ctx.canvas, dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const S = this.S;
      if (S) {
        const el = $('#mzTime', this.ui); if (el) el.textContent = `⏱ ${fmt(this.curT())}`;
        if (S.phase === 'intro') { const o = this.ui.querySelector('.lv-cd'); if (o) o.textContent = Math.max(1, Math.ceil(S.cd - (performance.now() - this.tRecv) / 1000)); }
      }
      if (this.walker) this.walkerUpdate(dt);
      for (const p of this.pings) p.t += dt;
      this.pings = this.pings.filter((p) => p.t < 4);
      this.hitFx = Math.max(0, this.hitFx - dt * 1.5);
      this.parts.update(dt);
      if (!S || !this.M || S.phase === 'menu') { this.sky.resize(w, hh); this.sky.draw(g, t, dt); this.parts.draw(g); return; }
      if (this.walker) this.drawWalker(g, w, hh, t, dt); else this.drawNav(g, w, hh, t, dt);
      if (this.hitFx > 0) { g.fillStyle = `rgba(255,40,80,${this.hitFx * 0.35})`; g.fillRect(0, 0, w, hh); }
      this.parts.draw(g);
    }
    // плавная позиция призрака: между пакетами
    ghostList(dt) {
      if (!this.gv || this.gv.length !== this.ghosts.length) this.gv = this.ghosts.map(([x, y]) => [x, y]);
      const k = 1 - Math.exp(-dt * 12);
      this.gv.forEach((p, i) => { p[0] = lerp(p[0], this.ghosts[i][0], k); p[1] = lerp(p[1], this.ghosts[i][1], k); });
      return this.gv;
    }

    drawTileThings(g, ts, ox, oy, x0, y0, x1, y1, t, forNav) {
      const M = this.M, S = this.S, T = this.curT();
      const inV = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
      // выход
      {
        const [ex, ey] = M.exit; const cx = ox + (ex + 0.5) * ts, cy = oy + (ey + 0.5) * ts;
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, cx, cy, ts * 1.4, '#9fe7ff', 0.7 + Math.sin(t * 3) * 0.2);
        g.globalCompositeOperation = 'source-over';
        g.save(); g.translate(cx, cy);
        for (let i = 0; i < 3; i++) { g.rotate(t * (1 + i * 0.4)); g.strokeStyle = `rgba(200,240,255,${0.8 - i * 0.2})`; g.lineWidth = Math.max(1.5, ts * 0.05); g.beginPath(); g.arc(0, 0, ts * (0.18 + i * 0.1), 0, Math.PI * 1.3); g.stroke(); }
        g.restore();
      }
      for (const s of M.spikes) {
        if (!inV(s.x, s.y)) continue;
        const on = spikeOn(s, T), cx = ox + s.x * ts, cy = oy + s.y * ts;
        const k = ((T + s.ph) % SPIKE_P);
        g.fillStyle = on ? 'rgba(255,60,90,0.25)' : 'rgba(255,255,255,0.04)'; g.fillRect(cx + 2, cy + 2, ts - 4, ts - 4);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
          const px = cx + ts * (0.22 + i * 0.28), py = cy + ts * (0.22 + j * 0.28), hgt = on ? ts * 0.16 : ts * 0.03;
          g.fillStyle = on ? '#ffd0d8' : '#4a3f63';
          g.beginPath(); g.moveTo(px - ts * 0.07, py + ts * 0.06); g.lineTo(px, py + ts * 0.06 - hgt * 1.4); g.lineTo(px + ts * 0.07, py + ts * 0.06); g.fill();
        }
        if (forNav) {
          // кольцо-таймер: сколько до появления шипов
          const left = on ? SPIKE_ON - k : SPIKE_P - k;
          g.strokeStyle = on ? '#ff5c7a' : 'rgba(255,200,120,0.8)'; g.lineWidth = Math.max(1.5, ts * 0.07);
          g.beginPath(); g.arc(cx + ts / 2, cy + ts / 2, ts * 0.42, -Math.PI / 2, -Math.PI / 2 + TAU * (left / (on ? SPIKE_ON : SPIKE_P - SPIKE_ON))); g.stroke();
        }
      }
      for (const d of M.doors) {
        if (!inV(d.x, d.y) || S.keys.includes(d.k)) continue;
        const cx = ox + d.x * ts, cy = oy + d.y * ts, c = KEYC[d.k][0];
        g.fillStyle = hexA(c, 0.25); g.fillRect(cx, cy, ts, ts);
        g.strokeStyle = c; g.lineWidth = Math.max(2, ts * 0.08);
        for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx + ts * i / 4, cy + 2); g.lineTo(cx + ts * i / 4, cy + ts - 2); g.stroke(); }
        g.fillStyle = c; g.beginPath(); g.arc(cx + ts / 2, cy + ts / 2, ts * 0.14, 0, TAU); g.fill();
      }
      M.gates.forEach((gt, i) => {
        if (!inV(gt.x, gt.y)) return;
        const open = S.gates[i] > T, cx = ox + gt.x * ts, cy = oy + gt.y * ts;
        if (open) {
          const left = (S.gates[i] - T) / GATE_T;
          g.strokeStyle = 'rgba(125,255,181,0.8)'; g.lineWidth = Math.max(2, ts * 0.08);
          g.beginPath(); g.arc(cx + ts / 2, cy + ts / 2, ts * 0.4, -Math.PI / 2, -Math.PI / 2 + TAU * left); g.stroke();
        } else {
          g.fillStyle = 'rgba(160,150,190,0.35)'; g.fillRect(cx, cy, ts, ts);
          g.strokeStyle = '#c9c2e0'; g.lineWidth = Math.max(2, ts * 0.1);
          for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(cx + ts * k / 4, cy); g.lineTo(cx + ts * k / 4, cy + ts); g.stroke(); }
          g.beginPath(); g.moveTo(cx, cy + ts * 0.3); g.lineTo(cx + ts, cy + ts * 0.3); g.stroke();
          if (forNav) { g.fillStyle = '#fff'; g.font = `700 ${Math.max(9, ts * 0.45)}px Comfortaa`; g.textAlign = 'center'; g.fillText('⛓', cx + ts / 2, cy + ts * 0.72); }
        }
      });
      for (const k of M.keys) {
        if (!inV(k.x, k.y) || S.keys.includes(k.k)) continue;
        const cx = ox + (k.x + 0.5) * ts, cy = oy + (k.y + 0.5) * ts + Math.sin(t * 3) * ts * 0.05;
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, cy, ts * 0.8, KEYC[k.k][0], 0.7); g.globalCompositeOperation = 'source-over';
        drawGlyph(g, 'key', cx, cy, ts * 0.6, KEYC[k.k][0], Math.max(1.5, ts * 0.07));
      }
      for (const s of M.stars) {
        if (!inV(s.x, s.y) || S.stars.includes(s.id)) continue;
        const cx = ox + (s.x + 0.5) * ts, cy = oy + (s.y + 0.5) * ts;
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, cy, ts * 0.7, '#ffe27a', 0.6 + Math.sin(t * 4 + s.id) * 0.2); g.globalCompositeOperation = 'source-over';
        g.save(); g.translate(cx, cy); g.rotate(Math.sin(t * 2 + s.id) * 0.3); drawGlyph(g, 'star', 0, 0, ts * 0.55, '#fff3c4', Math.max(1.5, ts * 0.07)); g.restore();
      }
    }

    drawWalker(g, w, hh, t, dt) {
      const M = this.M, L = levelDef(this.S.lvl);
      const ts = Math.round(Math.min(w, hh) / (this.ctx.me.touch && hh > w ? 6.5 : 7.5));
      const k = 1 - Math.exp(-dt * 18);
      this.vis.x = lerp(this.vis.x, this.pos.x, k); this.vis.y = lerp(this.vis.y, this.pos.y, k);
      const ox = Math.round(w / 2 - (this.vis.x + 0.5) * ts), oy = Math.round(hh / 2 - (this.vis.y + 0.5) * ts);
      this.wl = { ts, ox, oy };
      g.fillStyle = '#07060d'; g.fillRect(0, 0, w, hh);
      const x0 = Math.max(0, Math.floor(-ox / ts) - 1), y0 = Math.max(0, Math.floor(-oy / ts) - 1);
      const x1 = Math.min(M.TW - 1, Math.ceil((w - ox) / ts) + 1), y1 = Math.min(M.TH - 1, Math.ceil((hh - oy) / ts) + 1);
      const sp = sprites();
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const fl = M.g[y * M.TW + x] === 0;
        g.drawImage(fl ? sp.floor[(x * 7 + y * 13) % 3] : sp.wall, ox + x * ts, oy + y * ts, ts + 0.5, ts + 0.5);
      }
      this.drawTileThings(g, ts, ox, oy, x0, y0, x1, y1, t, false);
      // призраки — только совсем рядом
      const light = (L.light || 1.95);
      for (const [gx, gy] of this.ghostList(dt)) {
        const d = Math.hypot(gx - this.vis.x, gy - this.vis.y);
        if (d < light + 1.2) ghostShape(g, ox + (gx + 0.5) * ts, oy + (gy + 0.5) * ts, ts * 0.8, t, clamp(1.2 - d / (light + 1.2), 0, 0.9));
      }
      // Ходок
      const px = ox + (this.vis.x + 0.5) * ts, py = oy + (this.vis.y + 0.5) * ts;
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, px, py, ts * 1.2, '#ffc46b', 0.6); g.globalCompositeOperation = 'source-over';
      g.fillStyle = this.inv > 0 && Math.floor(t * 10) % 2 ? 'rgba(255,240,220,0.4)' : '#fff1d6';
      g.beginPath(); g.arc(px, py, ts * 0.24, 0, TAU); g.fill();
      g.fillStyle = '#ffb347'; g.beginPath(); g.arc(px + ts * 0.12, py - ts * 0.14, ts * 0.09, 0, TAU); g.fill();
      // темнота
      const D = this.dark, dg = this.dg;
      if (D.width !== Math.ceil(w / 2) || D.height !== Math.ceil(hh / 2)) { D.width = Math.ceil(w / 2); D.height = Math.ceil(hh / 2); }
      dg.setTransform(0.5, 0, 0, 0.5, 0, 0);
      dg.globalCompositeOperation = 'source-over'; dg.fillStyle = 'rgba(3,2,8,0.97)'; dg.fillRect(0, 0, w, hh);
      dg.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a = 1) => { const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.85})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.beginPath(); dg.arc(x, y, r, 0, TAU); dg.fill(); };
      hole(px, py, ts * light * (1 + Math.sin(t * 7) * 0.02));
      for (const p of this.pings) { const a = p.t < 0.3 ? p.t / 0.3 : Math.max(0, 1 - (p.t - 0.3) / 3.7); hole(ox + (p.x + 0.5) * ts, oy + (p.y + 0.5) * ts, ts * 1.1, a * 0.9); }
      g.drawImage(D, 0, 0, w, hh);
      // следы
      g.fillStyle = 'rgba(255,200,120,0.18)';
      for (const s of this.trail) { const [x, y] = s.split(',').map(Number); if (x < x0 || x > x1 || y < y0 || y > y1) continue; g.beginPath(); g.arc(ox + (x + 0.5) * ts, oy + (y + 0.5) * ts, ts * 0.06, 0, TAU); g.fill(); }
      // маячки и стрелки к ним
      for (const p of this.pings) {
        const a = p.t < 0.3 ? p.t / 0.3 : Math.max(0, 1 - (p.t - 0.3) / 3.7);
        const cx = ox + (p.x + 0.5) * ts, cy = oy + (p.y + 0.5) * ts;
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, cy, ts * 0.9, '#7ae0ff', a);
        g.strokeStyle = `rgba(150,230,255,${a})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, ts * (0.3 + (p.t % 1) * 0.5), 0, TAU); g.stroke();
        g.globalCompositeOperation = 'source-over';
        const m = 30;
        if (cx < m || cy < m + 50 || cx > w - m || cy > hh - m) {
          const ang = Math.atan2(cy - hh / 2, cx - w / 2);
          const ex = clamp(w / 2 + Math.cos(ang) * w, m, w - m), ey = clamp(hh / 2 + Math.sin(ang) * hh, m + 50, hh - m);
          g.save(); g.translate(ex, ey); g.rotate(ang); g.globalAlpha = a;
          g.fillStyle = '#9fe7ff'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-10, -11); g.lineTo(-4, 0); g.lineTo(-10, 11); g.closePath(); g.fill();
          g.restore();
        }
      }
    }

    drawNav(g, w, hh, t, dt) {
      const M = this.M, S = this.S;
      const top = 62;
      const ts = Math.max(6, Math.floor(Math.min((w - 24) / M.TW, (hh - top - 14) / M.TH)));
      const ox = Math.round((w - ts * M.TW) / 2), oy = Math.round(top + (hh - top - 8 - ts * M.TH) / 2);
      this.nl = { ts, ox, oy };
      const bg = g.createLinearGradient(0, 0, 0, hh); bg.addColorStop(0, '#0a1430'); bg.addColorStop(1, '#14103a');
      g.fillStyle = bg; g.fillRect(0, 0, w, hh);
      g.strokeStyle = 'rgba(120,170,255,0.06)'; g.lineWidth = 1;
      for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hh); g.stroke(); }
      for (let y = 0; y < hh; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      // карта
      g.fillStyle = 'rgba(8,10,30,0.8)'; roundRect(g, ox - 8, oy - 8, ts * M.TW + 16, ts * M.TH + 16, 12); g.fill();
      for (let y = 0; y < M.TH; y++) for (let x = 0; x < M.TW; x++) {
        if (M.g[y * M.TW + x] === 0) {
          g.fillStyle = this.trail.has(x + ',' + y) ? 'rgba(255,200,120,0.14)' : 'rgba(110,140,230,0.10)';
          g.fillRect(ox + x * ts, oy + y * ts, ts, ts);
        } else {
          const gr = g.createLinearGradient(0, oy + y * ts, 0, oy + (y + 1) * ts);
          gr.addColorStop(0, '#3b4c9a'); gr.addColorStop(1, '#283579');
          g.fillStyle = gr; g.fillRect(ox + x * ts, oy + y * ts, ts + 0.5, ts + 0.5);
        }
      }
      g.strokeStyle = 'rgba(150,190,255,0.35)'; g.lineWidth = 1.5; g.strokeRect(ox, oy, ts * M.TW, ts * M.TH);
      this.drawTileThings(g, ts, ox, oy, 0, 0, M.TW, M.TH, t, true);
      // призраки
      for (const [gx, gy] of this.ghostList(dt)) ghostShape(g, ox + (gx + 0.5) * ts, oy + (gy + 0.5) * ts, ts * 0.95, t, 0.85);
      // Ходок
      const wp = this.rPos || { x: 1, y: 1 };
      if (!this.nVis) this.nVis = { ...wp };
      const k = 1 - Math.exp(-dt * 14); this.nVis.x = lerp(this.nVis.x, wp.x, k); this.nVis.y = lerp(this.nVis.y, wp.y, k);
      const px = ox + (this.nVis.x + 0.5) * ts, py = oy + (this.nVis.y + 0.5) * ts;
      g.globalCompositeOperation = 'lighter';
      Glow.draw(g, px, py, ts * 2.2, '#ffc46b', 0.55 + Math.sin(t * 4) * 0.15);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(px, py, Math.max(3, ts * 0.32), 0, TAU); g.fill();
      g.strokeStyle = '#ffb347'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, ts * (0.5 + (t % 1) * 0.4), 0, TAU); g.globalAlpha = 1 - (t % 1); g.stroke(); g.globalAlpha = 1;
      // маячки
      for (const p of this.pings) {
        const a = Math.max(0, 1 - p.t / 4);
        g.strokeStyle = `rgba(150,230,255,${a})`; g.lineWidth = 2;
        g.beginPath(); g.arc(ox + (p.x + 0.5) * ts, oy + (p.y + 0.5) * ts, ts * (0.3 + (p.t % 1) * 0.6), 0, TAU); g.stroke();
      }
      for (let i = this.taps.length - 1; i >= 0; i--) {
        const f = this.taps[i]; f.t += dt; if (f.t > 0.5) { this.taps.splice(i, 1); continue; }
        g.strokeStyle = `rgba(255,230,180,${1 - f.t * 2})`; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, 6 + f.t * 50, 0, TAU); g.stroke();
      }
    }

    resync() { if (this.ctx.isHost && this.S) this.broadcast(); if (this.walker && this.pos) this.ctx.send({ a: 'w', x: this.pos.x, y: this.pos.y }); }
    destroy() { clearInterval(this.hostT); this.keys.destroy(); }
  }
})();
