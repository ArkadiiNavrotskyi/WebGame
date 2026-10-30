'use strict';
// «Бомба» — Сапёр видит бомбу с таймером, Эксперт читает инструкцию. 8 уровней, потом «Без конца».
(() => {
  const W = 1600, H = 900;
  const MW = 420, MH = 300;
  const SLOTS = [[140, 215], [590, 215], [1040, 215], [140, 535], [590, 535], [1040, 535]];
  const CASES = {
    pink: { name: 'розовый', c1: '#f59ac0', c2: '#8f3d63' },
    blue: { name: 'синий', c1: '#7fa8ff', c2: '#2c3f94' },
    gold: { name: 'золотой', c1: '#f3cf7a', c2: '#8c5d1c' },
    mint: { name: 'мятный', c1: '#8fe8c8', c2: '#2a7c61' },
  };
  const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУХ';
  const WCOL = { red: ['#ff4d5e', 'красный'], blue: ['#4d8dff', 'синий'], yellow: ['#ffd84d', 'жёлтый'], white: ['#f2f2f7', 'белый'], black: ['#2a2933', 'чёрный'], green: ['#4dde8a', 'зелёный'] };
  const WCOL_IDS = Object.keys(WCOL);
  const cnt = (w, c) => w.filter((x) => x === c).length;

  // ---------- Правила (одна и та же таблица для проверки и для инструкции) ----------
  const WIRE_RULES = {
    3: [
      ['Если среди проводов нет жёлтого — режь <b>первый</b>.', (w) => (cnt(w, 'yellow') === 0 ? 0 : -1)],
      ['Если первый и последний провод одного цвета — режь <b>средний</b>.', (w) => (w[0] === w[2] ? 1 : -1)],
      ['Если на бомбе больше одной батарейки — режь <b>последний</b>.', (w, E) => (E.bat > 1 ? 2 : -1)],
      ['Иначе режь <b>первый синий</b>, а если синих нет — <b>второй</b>.', (w) => (w.includes('blue') ? w.indexOf('blue') : 1)],
    ],
    4: [
      ['Если красных проводов больше одного — режь <b>последний красный</b>.', (w) => (cnt(w, 'red') > 1 ? w.lastIndexOf('red') : -1)],
      ['Если последняя цифра серийного номера нечётная и есть белый провод — режь <b>первый белый</b>.', (w, E) => (E.odd && w.includes('white') ? w.indexOf('white') : -1)],
      ['Если нет ни одного чёрного провода — режь <b>третий</b>.', (w) => (!w.includes('black') ? 2 : -1)],
      ['Иначе режь <b>первый</b>.', () => 0],
    ],
    5: [
      ['Если последний провод чёрный — режь <b>четвёртый</b>.', (w) => (w[4] === 'black' ? 3 : -1)],
      ['Если зелёный провод ровно один — режь <b>зелёный</b>.', (w) => (cnt(w, 'green') === 1 ? w.indexOf('green') : -1)],
      ['Если в серийном номере есть буква «Р», «С» или «Т» — режь <b>второй</b>.', (w, E) => (/[РСТ]/.test(E.serial) ? 1 : -1)],
      ['Если батареек нет совсем — режь <b>последний</b>.', (w, E) => (E.bat === 0 ? 4 : -1)],
      ['Иначе режь <b>третий</b>.', () => 2],
    ],
    6: [
      ['Если нет ни красных, ни белых проводов — режь <b>пятый</b>.', (w) => (!w.includes('red') && !w.includes('white') ? 4 : -1)],
      ['Если синих проводов больше, чем жёлтых — режь <b>последний синий</b>.', (w) => (cnt(w, 'blue') > cnt(w, 'yellow') ? w.lastIndexOf('blue') : -1)],
      ['Если корпус бомбы золотой — режь <b>второй</b>.', (w, E) => (E.case === 'gold' ? 1 : -1)],
      ['Если батареек три или больше — режь <b>первый</b>.', (w, E) => (E.bat >= 3 ? 0 : -1)],
      ['Иначе режь <b>последний</b>.', () => 5],
    ],
  };
  const HEART_WORDS = { 'ЛЮБОВЬ': 3, 'НЕЖНОСТЬ': 5, 'МЕЧТА': 2, 'МЕЧТЫ': 6, 'ТАЙНА': 4, 'ТАЙНЫ': 1, 'ЗВЕЗДА': 5, 'ЗВЁЗДЫ': 2, 'РАССВЕТ': 3, 'ОБЛАКО': 6, 'ПОЦЕЛУЙ': 4, 'ОБЪЯТИЯ': 1 };
  const DIAL_GLYPHS = { moon: [3, 8], sun: [7, 2], eye: [1, 6], snake: [9, 4], star: [5, 0], fish: [2, 7], key: [8, 3], tree: [4, 9], wave: [6, 1], crown: [0, 5], flame: [7, 4], bird: [2, 9] };
  const MOON_NAMES = ['Новолуние', 'Молодой серп', 'Первая четверть', 'Растущая луна', 'Полнолуние', 'Убывающая луна', 'Последняя четверть', 'Старый серп'];
  const MOON_HINT = ['весь круг тёмный', 'узкий светлый серп справа', 'светится правая половина', 'светится почти всё, тёмный край слева', 'светится весь круг', 'светится почти всё, тёмный край справа', 'светится левая половина', 'узкий светлый серп слева'];
  const MOON_TABLE = [[5, 2, 8], [1, 7, 4], [8, 3, 1], [3, 6, 7], [7, 1, 5], [2, 8, 3], [6, 4, 2], [4, 5, 6]];
  const LED = [['#ff4d5e', 'красная'], ['#4d8dff', 'синяя'], ['#4dde8a', 'зелёная']];
  const FREQS = ['3.1', '3.4', '3.7', '4.2', '4.5', '4.9', '5.3', '5.6', '6.0', '6.4', '6.8', '7.1', '7.5', '7.9', '8.3'];
  const WAVES = {
    sine: { name: 'Плавная волна', hint: 'мягкие округлые горки', f: [4, 11, 1] },
    square: { name: 'Ступеньки', hint: 'прямоугольные зубцы: вверх-ровно-вниз', f: [8, 0, 13] },
    saw: { name: 'Пила', hint: 'плавно вверх, потом резко вниз', f: [2, 9, 6] },
    tri: { name: 'Горки', hint: 'острые треугольные пики', f: [14, 5, 10] },
    heart: { name: 'Сердцебиение', hint: 'ровная линия с резким всплеском, как пульс', f: [7, 12, 3] },
  };
  const WAVE_IDS = Object.keys(WAVES);
  const LABEL = { wires: 'ПРОВОДА', heart: 'СЕРДЦЕ', dial: 'ЗВЁЗДНЫЙ ЗАМОК', moons: 'ЛУНЫ', wave: 'ВОЛНА' };

  const LEVELS = [
    { name: 'Учебная бомба', mods: ['wires'], time: 180, strikes: 3, wires: [3, 3] },
    { name: 'Сердечко', mods: ['wires', 'heart'], time: 180, strikes: 3, wires: [3, 4] },
    { name: 'Звёздный замок', mods: ['wires', 'heart', 'dial'], time: 240, strikes: 3, wires: [3, 5] },
    { name: 'Лунная ночь', mods: ['moons', 'dial', 'wires'], time: 240, strikes: 3, wires: [4, 5] },
    { name: 'На одной волне', mods: ['wave', 'moons', 'heart', 'wires'], time: 300, strikes: 3, wires: [4, 6] },
    { name: 'Полный набор', mods: ['wave', 'moons', 'dial', 'heart', 'wires'], time: 330, strikes: 3, wires: [5, 6] },
    { name: 'Двойные провода', mods: ['wires', 'wave', 'moons', 'dial', 'heart', 'wires'], time: 360, strikes: 2, wires: [4, 6] },
    { name: 'Финал', mods: ['wires', 'wave', 'moons', 'dial', 'heart', 'wires'], time: 300, strikes: 2, wires: [5, 6] },
  ];
  const levelDef = (n) => (n <= LEVELS.length ? LEVELS[n - 1] : { name: `Без конца · ${n - LEVELS.length}`, mods: ['wires', 'heart', 'dial', 'moons', 'wave', 'wires'], time: Math.max(170, 320 - (n - LEVELS.length - 1) * 15), strikes: 2, wires: [5, 6] });

  // ---------- Генерация бомбы: одинаковая у обоих по seed ----------
  function makeBomb(seed, lvl, att) {
    const r = RNG((seed ^ (lvl * 1009 + att * 7919)) >>> 0);
    const L = levelDef(lvl);
    let serial = '';
    for (let i = 0; i < 3; i++) serial += r.pick(LETTERS.split(''));
    serial += r.int(0, 9) + r.pick(LETTERS.split('')) + r.int(0, 9);
    const E = { serial, bat: r.int(0, 4), case: r.pick(Object.keys(CASES)) };
    E.odd = +serial[5] % 2 === 1;
    const slots = r.shuffle([0, 1, 2, 3, 4, 5]);
    const mods = L.mods.map((type, i) => {
      const m = { type, slot: slots[i] };
      if (type === 'wires') { const n = r.int(L.wires[0], L.wires[1]); m.ws = Array.from({ length: n }, () => r.pick(WCOL_IDS)); m.sag = m.ws.map(() => r.range(-22, 22)); }
      if (type === 'heart') { m.word = r.pick(Object.keys(HEART_WORDS)); m.purple = r() < 0.4; }
      if (type === 'dial') { m.gl = r.shuffle(Object.keys(DIAL_GLYPHS).slice()).slice(0, 3); m.start = r.int(0, 9); }
      if (type === 'moons') { m.ph = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4); m.led = r.int(0, 2); }
      if (type === 'wave') { m.shape = r.pick(WAVE_IDS); m.cyc = r.int(2, 4); m.start = r.int(0, 14); }
      m.sol = solve(m, E);
      return m;
    });
    return { E, mods, L };
  }
  function solve(m, E) {
    switch (m.type) {
      case 'wires': for (const [, f] of WIRE_RULES[m.ws.length]) { const v = f(m.ws, E); if (v >= 0) return v; } return 0;
      case 'heart': { let n = HEART_WORDS[m.word]; if (m.purple) n *= 2; if (E.case === 'pink') n += 1; if (E.bat >= 3) n -= 1; return Math.max(1, n); }
      case 'dial': return m.gl.reduce((s, k) => s + DIAL_GLYPHS[k][E.case === 'pink' || E.case === 'gold' ? 0 : 1], 0) % 10;
      case 'moons': { const o = [0, 1, 2, 3].sort((a, b) => MOON_TABLE[m.ph[a]][m.led] - MOON_TABLE[m.ph[b]][m.led]); return E.bat === 0 ? o.reverse() : o; }
      case 'wave': return (WAVES[m.shape].f[m.cyc - 2] + (E.case === 'mint' ? 1 : 0)) % FREQS.length;
    }
  }

  // ---------- Рисование общих вещей ----------
  function drawMoon(g, x, y, r, k, lit = '#f4efd6') {
    const th = (k / 8) * TAU, c = Math.cos(th);
    g.save();
    g.fillStyle = '#23263d'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    const waxing = k > 0 && k < 4 || k === 0;
    if (k !== 0) {
      g.fillStyle = lit; g.beginPath();
      if (k === 4) g.arc(x, y, r, 0, TAU);
      else if (waxing) g.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
      else g.arc(x, y, r, Math.PI / 2, Math.PI * 1.5);
      g.fill();
      if (k !== 4) {
        g.fillStyle = c < 0 ? lit : '#23263d';
        g.beginPath(); g.ellipse(x, y, Math.max(0.5, r * Math.abs(c)), r, 0, 0, TAU); g.fill();
      }
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  }
  const ECG = [[0, 0], [0.28, 0], [0.33, 0.22], [0.38, 0], [0.42, -0.25], [0.47, 1], [0.52, -0.7], [0.57, 0], [0.7, 0], [0.76, 0.25], [0.84, 0], [1, 0]];
  function waveY(shape, u) {
    u = ((u % 1) + 1) % 1;
    switch (shape) {
      case 'sine': return Math.sin(u * TAU);
      case 'square': return u < 0.5 ? 0.85 : -0.85;
      case 'saw': return u * 2 - 1;
      case 'tri': return u < 0.5 ? -1 + u * 4 : 3 - u * 4;
      case 'heart': for (let i = 1; i < ECG.length; i++) if (u <= ECG[i][0]) { const [a, b] = [ECG[i - 1], ECG[i]]; return lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0])); } return 0;
    }
    return 0;
  }
  function drawWave(g, x, y, w, h, shape, cyc, shift, color, lw = 3) {
    g.strokeStyle = color; g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath();
    for (let i = 0; i <= 160; i++) { const s = i / 160; const yy = y + h / 2 - waveY(shape, s * cyc + shift) * h * 0.38; i ? g.lineTo(x + s * w, yy) : g.moveTo(x + s * w, yy); }
    g.stroke();
  }
  function heartPath(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.95);
    g.bezierCurveTo(x - s * 1.4, y + s * 0.1, x - s * 1.05, y - s * 1.05, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 1.05, y - s * 1.05, x + s * 1.4, y + s * 0.1, x, y + s * 0.95);
    g.closePath();
  }
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const inR = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  // картинки для инструкции
  function pic(w, h, fn) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g); return c.toDataURL(); }

  GAMES.bomb = {
    id: 'bomb', title: 'Бомба', icon: '💣', color: '#ff7a6b',
    tagline: 'Один видит бомбу, другой читает инструкцию. Тик-так…',
    roles: [
      { id: 'expert', name: 'Эксперт', icon: '📖', desc: 'Бомбу не видишь. Зато у тебя инструкция по обезвреживанию — расспрашивай Сапёра и говори, что делать.', ctrl: { pc: 'вкладки сверху, прокрутка колёсиком', touch: 'вкладки сверху, листай пальцем' } },
      { id: 'defuser', name: 'Сапёр', icon: '🧨', desc: 'Видишь бомбу и таймер, но правил не знаешь. Описывай всё, что видишь, и делай ровно то, что скажет Эксперт.', ctrl: { pc: 'мышь — резать провода и жать кнопки', touch: 'нажми на модуль — он увеличится, «⤢» — снова вся бомба' } },
    ],
    rules: [
      'Сапёр видит бомбу: серийный номер, батарейки, цвет корпуса и модули. Эксперт видит только инструкцию.',
      'Модули: провода, сердце, звёздный замок, луны и волна. Каждый обезвреживается по правилам из инструкции.',
      'Ошибка — красный крестик, и таймер начинает спешить. Много ошибок или ноль на таймере — бах 💥',
      '8 уровней, каждый сложнее. Если взорвалось — новая бомба того же уровня. После финала — режим «Без конца».',
      'Говорите в Discord: Сапёр описывает, Эксперт ищет правило.',
    ],
    info() { const m = Store.get('bomb_max', 1); return m > LEVELS.length ? 'все 8 пройдены ✦' : `уровень ${m} из ${LEVELS.length}`; },
    create(ctx) { document.body.classList.toggle('landscape', ctx.role === 'defuser'); return new Bomb(ctx); },
  };

  class Bomb {
    constructor(ctx) {
      this.ctx = ctx;
      this.def = ctx.role === 'defuser';
      this.touch = ctx.me.touch;
      this.parts = new Particles();
      this.S = null; this.bomb = null; this.bombKey = '';
      this.loc = {}; this.fx = { flash: 0, red: 0, shake: 0, led: {} };
      this.cam = { x: W / 2, y: H / 2, z: 1 }; this.focus = -1;
      this.press = null; this.lastSec = -1;
      if (this.def) this.st = new Stage(ctx.canvas, W, H);
      else { this.sky = new Sky(); this.g = ctx.canvas.getContext('2d'); }
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) {
        this.S = { phase: 'menu', lvl: 1, att: -1, max: Store.get('bomb_max', 1), time: 0, strikes: 0, solved: [], cuts: {}, mp: {} };
        this.hostT = setInterval(() => this.hostTick(), 200);
        this.lastTick = performance.now();
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
      if (S.phase === 'intro') { S.cd -= dt; if (S.cd <= 0) { S.phase = 'play'; this.broadcast(); } }
      else if (S.phase === 'play') {
        S.time -= dt * (1 + S.strikes * 0.25);
        if (S.time <= 0) { S.time = 0; this.boom(); return; }
        if ((this._sync = (this._sync || 0) + dt) > 1) { this._sync = 0; this.broadcast(); }
      }
    }
    startLevel(lvl) {
      const S = this.S;
      // каждая попытка — новая бомба
      S.att = lvl === S.lvl ? S.att + 1 : 0;
      S.lvl = lvl;
      const L = levelDef(lvl);
      Object.assign(S, { phase: 'intro', cd: 3.5, time: L.time, strikes: 0, solved: [], cuts: {}, mp: {} });
      this.broadcast();
    }
    act(slot, v) {
      const S = this.S; if (S.phase !== 'play' || S.solved.includes(slot)) return;
      const b = this.getBomb(S); const m = b.mods.find((x) => x.slot === slot); if (!m) return;
      let ok = false, done = false;
      if (m.type === 'wires') {
        S.cuts[slot] = S.cuts[slot] || [];
        if (S.cuts[slot].includes(v)) return;
        S.cuts[slot].push(v); ok = v === m.sol; done = ok;
      } else if (m.type === 'moons') {
        const p = S.mp[slot] || 0;
        if (v === m.sol[p]) { ok = true; S.mp[slot] = p + 1; done = p + 1 >= 4; } else S.mp[slot] = 0;
      } else { ok = v === m.sol; done = ok; }
      if (done) { S.solved.push(slot); this.event({ a: 'solve', slot }); }
      else if (!ok) {
        S.strikes++;
        this.event({ a: 'strike', slot });
        if (S.strikes >= b.L.strikes) return this.boom();
      }
      if (S.solved.length >= b.mods.length) {
        S.phase = 'win';
        S.max = Math.max(S.max, S.lvl + 1);
        Store.set('bomb_max', Math.max(Store.get('bomb_max', 1), S.lvl + 1));
      }
      this.broadcast();
    }
    boom() { this.S.phase = 'boom'; this.broadcast(); }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost;
      switch (d.a) {
        case 'S': this.applyS(d.S); break;
        case 'ev': this.onEvent(d.e); break;
        case 'act': if (host) this.act(d.slot, d.v); break;
        case 'pick': if (host && d.lvl <= this.S.max && this.S.phase !== 'play') this.startLevel(d.lvl); break;
        case 'retry': if (host && (this.S.phase === 'boom' || this.S.phase === 'win')) this.startLevel(this.S.lvl); break;
        case 'next': if (host && this.S.phase === 'win') this.startLevel(this.S.lvl + 1); break;
        case 'menu': if (host) { this.S.phase = 'menu'; this.broadcast(); } break;
      }
    }
    ask(a, extra = {}) { if (this.ctx.isHost) this.onMsg({ a, ...extra }); else this.ctx.send({ a, ...extra }); }
    doAct(slot, v) { if (this.ctx.isHost) this.act(slot, v); else this.ctx.send({ a: 'act', slot, v }); }
    getBomb(S) {
      const key = `${S.lvl}:${S.att}`;
      if (key !== this.bombKey) { this.bombKey = key; this.bomb = makeBomb(this.ctx.seed, S.lvl, S.att); this.loc = {}; this.focus = -1; }
      return this.bomb;
    }
    applyS(S) {
      const prev = this.S && this.S !== S ? this.S.phase : this._prevPhase;
      this.S = S; this.recvAt = performance.now();
      if (S.phase !== 'menu') this.getBomb(S);
      if (S.max > Store.get('bomb_max', 1)) Store.set('bomb_max', S.max);
      if (prev !== S.phase || this._shownKey !== `${S.lvl}:${S.att}:${S.phase}`) {
        this._shownKey = `${S.lvl}:${S.att}:${S.phase}`;
        this.onPhase(S.phase, prev);
      }
      this._prevPhase = S.phase;
      this.updateHud();
    }
    onEvent(e) {
      if (e.a === 'strike') {
        SFX.tone(150, 0.45, { type: 'square', vol: 0.18, slide: 0.6 }); SFX.play('hit');
        this.fx.red = 1; this.fx.shake = 0.35; this.fx.led[e.slot] = { c: '#ff4d5e', t: 1.2 };
        if (!this.def) this.ctx.toast('✖ Ошибка! Таймер ускорился');
      }
      if (e.a === 'solve') {
        SFX.play('chime');
        const p = this.slotCenter(e.slot); this.parts.emit(p.x, p.y, { n: 30, speed: 220, life: 1.1, size: 10, color: ['#7dffb5', '#ffe7a6', '#bff7ff'] });
        if (!this.def) this.ctx.toast('✓ Модуль обезврежен');
        if (this.focus === e.slot) setTimeout(() => { if (this.focus === e.slot) this.setFocus(-1); }, 700);
      }
    }
    slotCenter(s) { return { x: SLOTS[s][0] + MW / 2, y: SLOTS[s][1] + MH / 2 }; }

    // ================= Экраны =================
    onPhase(ph) {
      const L = levelDef(this.S.lvl);
      this.overlay(null);
      if (ph === 'menu') this.showMenu();
      if (ph === 'intro') {
        SFX.play('whoosh');
        this.overlay(`<div class="lv-intro"><div class="lv-k">УРОВЕНЬ ${this.S.lvl}${this.S.att ? ` · попытка ${this.S.att + 1}` : ''}</div><div class="lv-n">${L.name}</div>
          <div class="lv-k2">⏱ ${fmt(L.time)} · модулей: ${L.mods.length} · ошибок можно: ${L.strikes - 1}</div>
          <div class="lv-k2" style="color:#ffe7a6">${this.def ? 'Ты — Сапёр: опиши Эксперту бомбу' : 'Ты — Эксперт: спроси, что видит Сапёр'}</div><div class="lv-cd"></div></div>`, true);
      }
      if (ph === 'play') { SFX.play('bellLow'); }
      if (ph === 'boom') {
        SFX.play('thunder'); SFX.noise(1.2, { vol: 0.6, freq: 700, sweep: 0.1 });
        this.fx.flash = 1; this.fx.shake = 1.2; this.setFocus(-1);
        for (let i = 0; i < 5; i++) setTimeout(() => this.parts.emit(rand(300, 1300), rand(250, 700), { n: 50, speed: 420, life: 1.5, size: 14, color: ['#ff9d5c', '#ffd27a', '#ff5c7a', '#fff'] }), i * 120);
        setTimeout(() => this.overlay(`<div class="panel lv-end"><div style="font-size:64px">💥</div><h2>Бах!</h2>
          <p>${this.S.time <= 0 ? 'Время вышло…' : 'Слишком много ошибок…'}<br>Ничего, сапёры тоже учатся. Будет новая бомба.</p>
          <button class="btn" data-a="retry">Ещё раз ⟳</button><button class="btn ghost" data-a="menu">К уровням</button></div>`), 1300);
      }
      if (ph === 'win') {
        SFX.play('win'); setTimeout(() => SFX.play('chime'), 900);
        for (let i = 0; i < 6; i++) setTimeout(() => this.parts.emit(rand(300, 1300), rand(200, 650), { n: 40, speed: 300, life: 1.6, size: 12, color: ['#7dffb5', '#ffe7a6', '#ffb3d6', '#9fe7ff'] }), i * 250);
        const last = this.S.lvl === LEVELS.length;
        const left = fmt(this.S.time);
        this.overlay(`<div class="panel lv-end"><div style="font-size:60px">${last ? '🏆' : '✨'}</div><h2>${last ? 'Финал пройден!' : 'Обезврежено!'}</h2>
          <p>Осталось времени: <b style="color:#ffe7a6">${left}</b>${this.S.strikes ? ` · ошибок: ${this.S.strikes}` : ' · без единой ошибки!'}${last ? '<br>Вы — лучшая команда сапёров. Дальше — режим «Без конца».' : ''}</p>
          <button class="btn" data-a="next">${last ? 'Без конца →' : 'Следующий уровень →'}</button><button class="btn ghost" data-a="menu">К уровням</button></div>`);
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
      const max = this.S.max;
      const tiles = [];
      for (let i = 1; i <= LEVELS.length + 1; i++) {
        const L = levelDef(i), open = i <= max;
        const endless = i > LEVELS.length;
        tiles.push(`<button class="lv-tile ${open ? '' : 'locked'} ${i < max ? 'done' : ''}" ${open ? `data-l="${i}"` : 'disabled'}>
          <span class="n">${endless ? '∞' : i}</span><span class="t">${endless ? 'Без конца' : L.name}</span><span class="m">${open ? `${fmt(L.time)} · ${L.mods.length} мод.` : '🔒'}</span></button>`);
      }
      this.overlay(`<div class="panel lv-menu"><h2>💣 Бомба</h2>
        <p class="sub">${this.def ? 'Ты — <b>Сапёр</b>: видишь бомбу' : 'Ты — <b>Эксперт</b>: у тебя инструкция'} · выберите уровень</p>
        <div class="lv-grid">${tiles.join('')}</div></div>`);
    }

    // ================= Интерфейс =================
    buildUI() {
      this.ui = h(`<div class="passthru bm-root ${this.def ? 'is-def' : 'is-exp'}" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel bm-hud"><span id="bmLvl"></span><b id="bmTime">—</b><span id="bmStr"></span><span id="bmMods"></span></div></div>
        ${this.def ? '<button class="iconbtn bm-zoom" id="bmZoom" title="Вся бомба">⤢</button>' : this.manualHtml()}
      </div>`);
      this.ctx.ui.appendChild(this.ui);
      if (this.def) $('#bmZoom', this.ui).onclick = () => this.setFocus(-1);
      else {
        const tabs = this.ui.querySelectorAll('.bm-tab');
        tabs.forEach((t) => (t.onclick = () => {
          SFX.play('card');
          tabs.forEach((x) => x.classList.toggle('on', x === t));
          this.ui.querySelectorAll('.bm-page').forEach((p) => (p.style.display = p.dataset.p === t.dataset.p ? '' : 'none'));
          this.ui.querySelector('.bm-book').scrollTop = 0;
        }));
      }
    }
    updateHud() {
      const S = this.S; if (!S || !this.ui) return;
      const hud = $('.bm-hud', this.ui);
      hud.style.visibility = S.phase === 'menu' ? 'hidden' : '';
      if (S.phase === 'menu') return;
      const L = levelDef(S.lvl), b = this.bomb;
      $('#bmLvl', this.ui).textContent = `ур. ${S.lvl}`;
      $('#bmStr', this.ui).innerHTML = Array.from({ length: L.strikes - 1 }, (_, i) => `<i class="${i < S.strikes ? 'x' : ''}">✖</i>`).join('');
      $('#bmMods', this.ui).textContent = b ? `✓ ${S.solved.length}/${b.mods.length}` : '';
    }
    shownTime() {
      const S = this.S; if (!S) return 0;
      if (S.phase !== 'play') return S.time;
      return S.time - ((performance.now() - this.recvAt) / 1000) * (1 + S.strikes * 0.25);
    }

    manualHtml() {
      const gl = (k) => pic(54, 54, (g) => { g.fillStyle = '#2b2236'; roundRect(g, 1, 1, 52, 52, 10); g.fill(); drawGlyph(g, k, 27, 27, 34, '#fff3d6', 2.6); });
      const mn = (k) => pic(50, 50, (g) => drawMoon(g, 25, 25, 21, k));
      const wv = (s, c) => pic(130, 46, (g) => { g.fillStyle = '#0f2a22'; roundRect(g, 0, 0, 130, 46, 8); g.fill(); drawWave(g, 6, 2, 118, 42, s, c, 0, '#7dffb5', 2.2); });
      const wireRows = (n) => WIRE_RULES[n].map(([t]) => `<li>${t}</li>`).join('');
      const tabs = [['base', '📘', 'Основы'], ['wires', '🔌', 'Провода'], ['heart', '💗', 'Сердце'], ['dial', '✴️', 'Замок'], ['moons', '🌙', 'Луны'], ['wave', '〰️', 'Волна']];
      return `<div class="bm-manual">
        <div class="bm-tabs">${tabs.map(([id, ic, n], i) => `<button class="bm-tab ${i ? '' : 'on'}" data-p="${id}"><span>${ic}</span>${n}</button>`).join('')}</div>
        <div class="bm-book scroll-y">
        <div class="bm-page" data-p="base">
          <h2>Инструкция сапёра</h2>
          <p>Сапёр видит бомбу, ты — эту книгу. Бомба состоит из <b>модулей</b>, у каждого своя табличка с названием. Обезвредьте все модули, пока не кончился таймер.</p>
          <h3>Что нужно узнать сразу</h3>
          <ul><li><b>Серийный номер</b> — белая табличка слева сверху, 6 символов. Последний — всегда цифра.</li>
          <li><b>Батарейки</b> — справа сверху, от 0 до 4.</li>
          <li><b>Цвет корпуса</b> — розовый, синий, золотой или мятный.</li></ul>
          <h3>Ошибки</h3>
          <p>Неверное действие — <b class="red">красный крестик</b>. После каждой ошибки таймер идёт на четверть быстрее. Превысили лимит ошибок — взрыв.</p>
          <p>Обезвреженный модуль загорается <b class="green">зелёной лампочкой</b>.</p>
          <div class="tip">Совет: попроси Сапёра назвать все модули на бомбе и начинайте с проводов — они самые простые.</div>
        </div>
        <div class="bm-page" data-p="wires" style="display:none">
          <h2>🔌 Провода</h2>
          <p>От 3 до 6 проводов. Считай их <b>сверху вниз</b>. Найди таблицу по числу проводов и выполни <b>первое подходящее правило</b>. Резать нужно ровно один провод.</p>
          <p class="small">Цвета: красный, синий, жёлтый, белый, чёрный, зелёный.</p>
          ${[3, 4, 5, 6].map((n) => `<h3>${n} провода${n > 4 ? '' : ''}</h3><ol>${wireRows(n)}</ol>`).join('').replace('<h3>5 провода', '<h3>5 проводов').replace('<h3>6 провода', '<h3>6 проводов')}
        </div>
        <div class="bm-page" data-p="heart" style="display:none">
          <h2>💗 Сердце</h2>
          <p>Большое сердце и экранчик со словом. Нужно нажать на сердце <b>нужное число раз</b> и нажать <b>✓</b>. Кнопка ↺ сбрасывает счёт.</p>
          <ol><li>Найди число для слова в таблице. Внимательно: некоторые слова похожи!</li>
          <li>Если сердце <b style="color:#9b59ff">фиолетовое</b> — удвой число.</li>
          <li>Если корпус бомбы <b>розовый</b> — прибавь 1.</li>
          <li>Если батареек <b>3 или больше</b> — отними 1. Меньше 1 не бывает.</li></ol>
          <table><tr><th>Слово</th><th>Число</th><th>Слово</th><th>Число</th></tr>
          ${(() => { const e = Object.entries(HEART_WORDS); let s = ''; for (let i = 0; i < e.length; i += 2) s += `<tr><td>${e[i][0]}</td><td>${e[i][1]}</td><td>${e[i + 1][0]}</td><td>${e[i + 1][1]}</td></tr>`; return s; })()}</table>
        </div>
        <div class="bm-page" data-p="dial" style="display:none">
          <h2>✴️ Звёздный замок</h2>
          <p>Три окошка с символами и колесо с цифрой. Найди значение каждого символа — столбец зависит от <b>цвета корпуса</b>. Сложи три значения и возьми <b>последнюю цифру</b> суммы. Выставь её стрелками и нажми <b>ВВОД</b>.</p>
          <p class="small">Пример: 7 + 9 + 5 = 21 → цифра 1.</p>
          <table class="pics"><tr><th>Символ</th><th>Тёплый корпус<br><span class="small">розовый, золотой</span></th><th>Холодный корпус<br><span class="small">синий, мятный</span></th></tr>
          ${Object.entries(DIAL_GLYPHS).map(([k, [a, b]]) => `<tr><td><img src="${gl(k)}" width="54" height="54" alt=""><span class="small">${GLYPH_NAMES[k]}</span></td><td class="big">${a}</td><td class="big">${b}</td></tr>`).join('')}</table>
        </div>
        <div class="bm-page" data-p="moons" style="display:none">
          <h2>🌙 Луны</h2>
          <p>Четыре луны в разных фазах и маленькая лампочка-индикатор. Найди номер каждой луны в столбце <b>цвета лампочки</b> и нажимай луны <b>от меньшего номера к большему</b>.</p>
          <p>Если на бомбе <b>нет батареек</b> — наоборот, от большего к меньшему.</p>
          <p class="small">Ошибка сбрасывает модуль — начинайте с первой луны.</p>
          <table class="pics"><tr><th>Луна</th><th>Как выглядит</th><th style="color:#ff4d5e">красн.</th><th style="color:#3b78f0">син.</th><th style="color:#21a865">зел.</th></tr>
          ${MOON_TABLE.map((row, k) => `<tr><td><img src="${mn(k)}" width="50" height="50" alt=""></td><td class="l"><b>${MOON_NAMES[k]}</b><br><span class="small">${MOON_HINT[k]}</span></td>${row.map((v) => `<td class="big">${v}</td>`).join('')}</tr>`).join('')}</table>
        </div>
        <div class="bm-page" data-p="wave" style="display:none">
          <h2>〰️ Волна</h2>
          <p>Экран показывает сигнал. Узнай <b>форму волны</b> и посчитай, сколько раз узор <b>повторяется</b> на экране — 2, 3 или 4. Выставь частоту стрелками и нажми <b>ПЕРЕДАТЬ</b>.</p>
          <p>Если корпус <b>мятный</b> — бери частоту на одну ступень выше по шкале (после 8.3 идёт 3.1).</p>
          <table class="pics"><tr><th>Форма</th><th>2</th><th>3</th><th>4</th></tr>
          ${WAVE_IDS.map((s) => `<tr><td class="l"><img src="${wv(s, 2)}" width="130" height="46" alt=""><br><b>${WAVES[s].name}</b> <span class="small">— ${WAVES[s].hint}</span></td>${WAVES[s].f.map((i) => `<td class="big">${FREQS[i]}</td>`).join('')}</tr>`).join('')}</table>
          <p class="small">Шкала: ${FREQS.join(' → ')}</p>
        </div>
        </div></div>`;
    }

    // ================= Ввод Сапёра =================
    bindInput() {
      if (!this.def) return;
      const c = this.ctx.canvas;
      c.style.cursor = 'pointer';
      c.addEventListener('pointerdown', (e) => this.onTap(this.toWorld(this.st.pt(e))));
    }
    toWorld(p) { const C = this.cam; return { x: (p.x - W / 2) / C.z + C.x, y: (p.y - H / 2) / C.z + C.y }; }
    setFocus(s) {
      this.focus = s;
      $('#bmZoom', this.ui)?.classList.toggle('show', s >= 0);
      this.ui.classList.toggle('zoomed', s >= 0);
      if (s >= 0) SFX.play('whoosh');
    }
    onTap(p) {
      const S = this.S; if (!S || S.phase !== 'play' || !this.bomb) return;
      SFX.unlock();
      const hitSlot = SLOTS.findIndex(([x, y]) => inR(p, x, y, MW, MH));
      const m = this.bomb.mods.find((x) => x.slot === hitSlot);
      if (this.touch && this.focus !== hitSlot) {
        if (m && !S.solved.includes(m.slot)) this.setFocus(hitSlot); else if (this.focus >= 0) this.setFocus(-1);
        return;
      }
      if (!m || S.solved.includes(m.slot)) return;
      const [x, y] = SLOTS[m.slot];
      const q = { x: p.x - x, y: p.y - y };
      const L = (this.loc[m.slot] = this.loc[m.slot] || {});
      const pr = (id) => { this.press = { slot: m.slot, id, t: 0.18 }; SFX.play('click'); };
      switch (m.type) {
        case 'wires': {
          const cut = S.cuts[m.slot] || [];
          let best = -1, bd = 26;
          m.ws.forEach((_, i) => { if (cut.includes(i)) return; for (const [px, py] of this.wirePts(m, i)) { const d = Math.hypot(px - q.x, py - q.y); if (d < bd) { bd = d; best = i; } } });
          if (best >= 0) { SFX.noise(0.12, { vol: 0.4, freq: 4000, type: 'highpass' }); this.parts.emit(p.x, p.y, { n: 12, speed: 160, life: 0.5, size: 6, color: ['#ffd27a', '#fff'] }); this.doAct(m.slot, best); }
          break;
        }
        case 'heart':
          if (Math.hypot(q.x - 140, q.y - 185) < 95) { L.taps = Math.min(12, (L.taps || 0) + 1); L.beat = 1; SFX.tone(220 + L.taps * 30, 0.15, { vol: 0.25 }); }
          else if (inR(q, 290, 125, 100, 70)) { pr('ok'); this.doAct(m.slot, L.taps || 0); L.taps = 0; }
          else if (inR(q, 290, 210, 100, 60)) { pr('rs'); L.taps = 0; }
          break;
        case 'dial':
          if (L.d == null) L.d = m.start;
          if (inR(q, 180, 160, 90, 56)) { pr('up'); L.d = (L.d + 1) % 10; }
          else if (inR(q, 180, 222, 90, 56)) { pr('dn'); L.d = (L.d + 9) % 10; }
          else if (inR(q, 285, 160, 105, 118)) { pr('ok'); this.doAct(m.slot, L.d); }
          break;
        case 'moons':
          for (let i = 0; i < 4; i++) if (Math.hypot(q.x - (75 + i * 90), q.y - 175) < 44) { pr('m' + i); this.doAct(m.slot, i); }
          break;
        case 'wave':
          if (L.f == null) L.f = m.start;
          if (inR(q, 25, 178, 85, 58)) { pr('l'); L.f = (L.f + FREQS.length - 1) % FREQS.length; }
          else if (inR(q, 310, 178, 85, 58)) { pr('r'); L.f = (L.f + 1) % FREQS.length; }
          else if (inR(q, 90, 244, 240, 46)) { pr('ok'); this.doAct(m.slot, L.f); }
          break;
      }
    }
    wirePts(m, i) {
      const n = m.ws.length, y0 = 70 + (i * (MH - 108)) / (n - 1), sag = m.sag[i];
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const s = k / 24, u = 1 - s;
        const x = u * u * u * 78 + 3 * u * u * s * 170 + 3 * u * s * s * (MW - 170) + s * s * s * (MW - 78);
        const y = y0 + (3 * u * u * s * sag - 3 * u * s * s * sag * 0.6);
        pts.push([x, y]);
      }
      return pts;
    }

    // ================= Кадр =================
    frame(dt, t) {
      this.parts.update(dt);
      const F = this.fx;
      F.flash = Math.max(0, F.flash - dt * 1.2); F.red = Math.max(0, F.red - dt * 2); F.shake = Math.max(0, F.shake - dt);
      for (const k in F.led) { F.led[k].t -= dt; if (F.led[k].t <= 0) delete F.led[k]; }
      if (this.press) { this.press.t -= dt; if (this.press.t <= 0) this.press = null; }
      // таймер и тиканье
      const S = this.S;
      if (S && S.phase !== 'menu') {
        const tl = this.shownTime(), sec = Math.ceil(tl);
        const el = $('#bmTime', this.ui); if (el) { el.textContent = fmt(tl); el.classList.toggle('hot', tl < 30 && S.phase === 'play'); }
        if (S.phase === 'play' && sec !== this.lastSec) { this.lastSec = sec; SFX.tone(tl < 30 ? 1800 : 1300, 0.04, { type: 'square', vol: tl < 30 ? 0.06 : 0.035 }); }
        if (S.phase === 'intro') { const o = this.ui.querySelector('.lv-cd'); if (o) o.textContent = Math.max(1, Math.ceil(S.cd - (performance.now() - this.recvAt) / 1000)); }
      }
      if (this.def) this.drawDefuser(dt, t); else this.drawExpert(dt, t);
    }
    drawExpert(dt, t) {
      const g = this.g, c = this.ctx.canvas, dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(hh * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.sky.resize(w, hh); this.sky.draw(g, t, dt);
      if (this.fx.red > 0) { g.fillStyle = `rgba(255,40,70,${this.fx.red * 0.35})`; g.fillRect(0, 0, w, hh); }
      if (this.fx.flash > 0) { g.fillStyle = `rgba(255,220,180,${this.fx.flash * 0.8})`; g.fillRect(0, 0, w, hh); }
    }

    drawDefuser(dt, t) {
      const st = this.st, g = st.g, S = this.S;
      // камера
      const C = this.cam;
      let tx = W / 2, ty = H / 2, tz = 1;
      if (this.focus >= 0) { const p = this.slotCenter(this.focus); tx = p.x; ty = p.y; tz = Math.min((st.x1 - st.x0) / (MW + 50), (st.y1 - st.y0 - 70) / (MH + 40)); }
      const k = 1 - Math.exp(-dt * 9);
      C.x = lerp(C.x, tx, k); C.y = lerp(C.y, ty, k); C.z = lerp(C.z, tz, k);
      st.screen();
      // фон: стол под лампой
      const bg = g.createRadialGradient(st.vw / 2, st.vh * 0.35, 0, st.vw / 2, st.vh / 2, Math.max(st.vw, st.vh) * 0.8);
      bg.addColorStop(0, '#2c2440'); bg.addColorStop(1, '#07060f');
      g.fillStyle = bg; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      g.save();
      if (this.fx.shake > 0) g.translate(rand(-1, 1) * this.fx.shake * 22, rand(-1, 1) * this.fx.shake * 22);
      g.translate(W / 2, H / 2); g.scale(C.z, C.z); g.translate(-C.x, -C.y);
      if (!S || S.phase === 'menu' || !this.bomb) { this.drawCase(g, t, null); }
      else {
        this.drawCase(g, t, this.bomb);
        for (let s = 0; s < 6; s++) {
          const m = this.bomb.mods.find((x) => x.slot === s);
          this.drawModule(g, s, m, t);
        }
      }
      this.parts.draw(g);
      g.restore();
      st.screen();
      if (this.fx.red > 0) { g.fillStyle = `rgba(255,40,70,${this.fx.red * 0.35})`; g.fillRect(0, 0, st.vw, st.vh); }
      if (this.fx.flash > 0) { g.fillStyle = `rgba(255,230,190,${this.fx.flash})`; g.fillRect(0, 0, st.vw, st.vh); }
      // виньетка
      const vg = g.createRadialGradient(st.vw / 2, st.vh / 2, Math.min(st.vw, st.vh) * 0.4, st.vw / 2, st.vh / 2, Math.max(st.vw, st.vh) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = vg; g.fillRect(0, 0, st.vw, st.vh);
    }

    drawCase(g, t, b) {
      const cs = CASES[b ? b.E.case : 'pink'];
      // тень
      g.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(g, 104, 92, 1410, 800, 46); g.fill();
      const gr = g.createLinearGradient(0, 70, 0, 880);
      gr.addColorStop(0, cs.c1); gr.addColorStop(0.08, mixColor(cs.c1, cs.c2, 0.35)); gr.addColorStop(1, cs.c2);
      g.fillStyle = gr; roundRect(g, 90, 70, 1420, 800, 44); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; roundRect(g, 92, 72, 1416, 796, 43); g.stroke();
      // блик
      g.save(); roundRect(g, 90, 70, 1420, 800, 44); g.clip();
      const sh = g.createLinearGradient(90, 70, 900, 600); sh.addColorStop(0, 'rgba(255,255,255,0.22)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)');
      g.fillStyle = sh; g.fillRect(90, 70, 1420, 800); g.restore();
      // болты по углам
      for (const [bx, by] of [[124, 104], [1476, 104], [124, 836], [1476, 836]]) this.bolt(g, bx, by, 13);
      // верхняя полоса
      g.fillStyle = 'rgba(10,8,20,0.35)'; roundRect(g, 140, 100, 1320, 96, 22); g.fill();
      if (!b) { g.font = "700 40px Comfortaa"; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('выберите уровень…', W / 2, 160); return; }
      // серийный номер
      g.fillStyle = '#f4f1e8'; roundRect(g, 165, 116, 300, 64, 8); g.fill();
      g.fillStyle = '#8a8478'; g.font = '700 13px Comfortaa'; g.textAlign = 'left'; g.fillText('СЕРИЙНЫЙ №', 178, 134);
      g.fillStyle = '#1d1a24'; g.font = '700 34px "Courier New", monospace'; g.fillText(b.E.serial, 178, 170);
      // таймер
      const tl = this.shownTime(), hot = tl < 30 && this.S.phase === 'play';
      g.fillStyle = '#0b0a10'; roundRect(g, 640, 108, 320, 82, 14); g.fill();
      g.strokeStyle = '#3c3650'; g.lineWidth = 3; roundRect(g, 640, 108, 320, 82, 14); g.stroke();
      g.textAlign = 'center'; g.font = '700 64px "Courier New", monospace';
      g.fillStyle = 'rgba(255,60,60,0.12)'; g.fillText('8:88', 800, 172);
      const blink = hot && Math.floor(t * 4) % 2;
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 800, 150, 170, hot ? '#ff3b3b' : '#ff6b5c', blink ? 0.5 : 0.28); g.globalCompositeOperation = 'source-over';
      g.fillStyle = hot ? '#ff4b4b' : '#ff8a6e'; g.fillText(fmt(tl), 800, 172);
      // ошибки
      const L = b.L;
      for (let i = 0; i < L.strikes - 1; i++) {
        const x = 1000 + i * 52, on = i < this.S.strikes;
        g.fillStyle = '#0b0a10'; roundRect(g, x, 122, 42, 54, 8); g.fill();
        g.font = '700 32px Comfortaa'; g.fillStyle = on ? '#ff4b5c' : 'rgba(255,255,255,0.12)'; g.fillText('✖', x + 21, 161);
        if (on) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, x + 21, 150, 34, '#ff4b5c', 0.6); g.globalCompositeOperation = 'source-over'; }
      }
      // батарейки
      g.textAlign = 'left'; g.font = '700 13px Comfortaa'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText('БАТАРЕЙКИ', 1180, 124);
      for (let i = 0; i < 4; i++) {
        const x = 1180 + i * 66, y = 134;
        g.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(g, x, y, 56, 46, 8); g.fill();
        if (i < b.E.bat) {
          const bg2 = g.createLinearGradient(0, y + 8, 0, y + 38); bg2.addColorStop(0, '#ffe58a'); bg2.addColorStop(1, '#c48a1c');
          g.fillStyle = bg2; roundRect(g, x + 6, y + 9, 40, 28, 5); g.fill();
          g.fillStyle = '#2b2a35'; g.fillRect(x + 6, y + 9, 13, 28);
          g.fillStyle = '#d9d6cc'; g.fillRect(x + 46, y + 17, 5, 12);
        }
      }
    }
    bolt(g, x, y, r) {
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      gr.addColorStop(0, '#f5f3ff'); gr.addColorStop(1, '#7a7590');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(40,36,60,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.2); g.lineTo(x + r * 0.6, y + r * 0.2); g.stroke();
    }
    btn(g, x, y, w, hh, label, slot, id, color = '#3a3550', fs = 26) {
      const down = this.press && this.press.slot === slot && this.press.id === id;
      const oy = down ? 3 : 0;
      g.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(g, x, y + 5, w, hh, 12); g.fill();
      const gr = g.createLinearGradient(0, y + oy, 0, y + hh + oy); gr.addColorStop(0, mixColor(color, '#ffffff', 0.25)); gr.addColorStop(1, color);
      g.fillStyle = gr; roundRect(g, x, y + oy, w, hh, 12); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; roundRect(g, x + 1, y + oy + 1, w - 2, hh - 2, 11); g.stroke();
      g.fillStyle = '#fff'; g.font = `700 ${fs}px Comfortaa`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, x + w / 2, y + hh / 2 + oy + 1); g.textBaseline = 'alphabetic';
    }

    drawModule(g, s, m, t) {
      const [x, y] = SLOTS[s];
      const S = this.S, solved = m && S.solved.includes(s);
      // панель
      g.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(g, x + 4, y + 8, MW, MH, 22); g.fill();
      const pg = g.createLinearGradient(0, y, 0, y + MH);
      pg.addColorStop(0, m ? '#4a4560' : '#3a3648'); pg.addColorStop(1, m ? '#24212f' : '#1f1d28');
      g.fillStyle = pg; roundRect(g, x, y, MW, MH, 22); g.fill();
      g.strokeStyle = this.focus === s ? 'rgba(255,220,150,0.8)' : 'rgba(255,255,255,0.14)'; g.lineWidth = this.focus === s ? 4 : 2; roundRect(g, x + 1, y + 1, MW - 2, MH - 2, 21); g.stroke();
      for (const [bx, by] of [[x + 16, y + 16], [x + MW - 16, y + MH - 16], [x + 16, y + MH - 16]]) this.bolt(g, bx, by, 6);
      if (!m) {
        g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3;
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x + 60, y + 70 + i * 40); g.lineTo(x + MW - 60, y + 70 + i * 40); g.stroke(); }
        return;
      }
      // табличка и лампочка
      g.font = '700 15px Comfortaa'; g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText(LABEL[m.type], x + 32, y + 30);
      const led = this.fx.led[s];
      const lc = solved ? '#4dff9a' : led ? led.c : '#3b2b2f';
      g.fillStyle = lc; g.beginPath(); g.arc(x + MW - 30, y + 26, 11, 0, TAU); g.fill();
      if (solved || led) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, x + MW - 30, y + 26, 40, lc, 0.9); g.globalCompositeOperation = 'source-over'; }
      g.save(); g.translate(x, y);
      this['m_' + m.type](g, m, s, t, solved);
      g.restore();
      if (solved) { g.fillStyle = 'rgba(30,80,50,0.25)'; roundRect(g, x, y, MW, MH, 22); g.fill(); }
      if (this.touch && this.focus !== s && !solved && S.phase === 'play') {
        const a = 0.25 + Math.sin(t * 3 + s) * 0.15;
        g.strokeStyle = `rgba(255,230,170,${a})`; g.lineWidth = 3; roundRect(g, x + 6, y + 6, MW - 12, MH - 12, 18); g.stroke();
      }
    }

    m_wires(g, m, s, t) {
      const cut = this.S.cuts[s] || [];
      // светлая подложка, чтобы тёмные провода было видно
      const bp = g.createLinearGradient(0, 44, 0, MH - 24); bp.addColorStop(0, '#8a84a3'); bp.addColorStop(1, '#5e5875');
      g.fillStyle = bp; roundRect(g, 70, 44, MW - 140, MH - 66, 10); g.fill();
      g.fillStyle = '#16141e'; roundRect(g, 38, 44, 40, MH - 66, 8); g.fill(); roundRect(g, MW - 78, 44, 40, MH - 66, 8); g.fill();
      m.ws.forEach((c, i) => {
        const pts = this.wirePts(m, i), col = WCOL[c][0], isCut = cut.includes(i);
        const seg = (a, b) => {
          for (const [lw, cc] of [[24, 'rgba(0,0,0,0.45)'], [17, col], [4, 'rgba(255,255,255,0.4)']]) {
            g.strokeStyle = cc; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
            for (let k = a; k <= b; k++) { const [px, py] = pts[k]; k === a ? g.moveTo(px, py + (lw === 4 ? -4 : lw === 24 ? 4 : 0)) : g.lineTo(px, py + (lw === 4 ? -4 : lw === 24 ? 4 : 0)); }
            g.stroke();
          }
        };
        if (isCut) {
          seg(0, 10); seg(14, 24);
          for (const k of [10, 14]) { g.fillStyle = '#e8a35a'; g.beginPath(); g.arc(pts[k][0], pts[k][1], 7, 0, TAU); g.fill(); }
        } else seg(0, 24);
        for (const k of [0, 24]) { this.bolt(g, pts[k][0] + (k ? 18 : -18), pts[k][1], 8); }
      });
    }
    m_heart(g, m, s, t) {
      const L = this.loc[s] || {};
      L.beat = Math.max(0, (L.beat || 0) - 0.05);
      // экран со словом
      g.fillStyle = '#0d1a14'; roundRect(g, 30, 48, MW - 60, 58, 10); g.fill();
      g.font = '700 32px "Courier New", monospace'; g.textAlign = 'center'; g.fillStyle = '#7dffb5';
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, MW / 2, 77, 120, '#3dff9a', 0.18); g.globalCompositeOperation = 'source-over';
      g.fillText(m.word, MW / 2, 88);
      // сердце
      const col = m.purple ? '#9b59ff' : '#ff4d7a';
      const sc = 1 + Math.sin(t * 5) * 0.03 + (L.beat || 0) * 0.15;
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 140, 185, 130, col, 0.35 + (L.beat || 0) * 0.5); g.globalCompositeOperation = 'source-over';
      g.save(); g.translate(140, 185); g.scale(sc, sc);
      const hg = g.createRadialGradient(-25, -25, 5, 0, 0, 90); hg.addColorStop(0, mixColor(col, '#ffffff', 0.5)); hg.addColorStop(1, mixColor(col, '#000000', 0.25));
      g.fillStyle = hg; heartPath(g, 0, 0, 62); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; heartPath(g, 0, 0, 62); g.stroke();
      g.restore();
      this.btn(g, 290, 125, 100, 70, '✓', s, 'ok', '#2f8a5c', 38);
      this.btn(g, 290, 210, 100, 60, '↺', s, 'rs', '#5a4a66', 30);
      // счётчик нажатий
      for (let i = 0; i < 12; i++) {
        const on = i < (L.taps || 0);
        g.fillStyle = on ? '#ffd27a' : 'rgba(255,255,255,0.12)';
        g.beginPath(); g.arc(40 + i * 19, MH - 18, 6, 0, TAU); g.fill();
      }
    }
    m_dial(g, m, s, t) {
      const L = this.loc[s] || {}; const d = L.d == null ? m.start : L.d;
      m.gl.forEach((k, i) => {
        const x = 40 + i * 120;
        g.fillStyle = '#1a1424'; roundRect(g, x, 48, 100, 92, 12); g.fill();
        g.strokeStyle = 'rgba(255,220,160,0.35)'; g.lineWidth = 2; roundRect(g, x, 48, 100, 92, 12); g.stroke();
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, x + 50, 94, 60, '#ffcf7a', 0.2 + Math.sin(t * 2 + i) * 0.08); g.globalCompositeOperation = 'source-over';
        drawGlyph(g, k, x + 50, 94, 62, '#fff1d0', 4);
      });
      g.fillStyle = '#0b0a10'; roundRect(g, 40, 160, 120, 118, 14); g.fill();
      g.font = '700 92px "Courier New", monospace'; g.textAlign = 'center'; g.fillStyle = '#ffd27a';
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 100, 218, 80, '#ffb347', 0.3); g.globalCompositeOperation = 'source-over';
      g.fillText(d, 100, 250);
      this.btn(g, 180, 160, 90, 56, '▲', s, 'up');
      this.btn(g, 180, 222, 90, 56, '▼', s, 'dn');
      this.btn(g, 285, 160, 105, 118, 'ВВОД', s, 'ok', '#2f8a5c', 22);
    }
    m_moons(g, m, s, t) {
      const lc = LED[m.led][0];
      g.font = '700 12px Comfortaa'; g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText('ИНДИКАТОР', 62, 78);
      g.fillStyle = lc; g.beginPath(); g.arc(44, 73, 11, 0, TAU); g.fill();
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 44, 73, 38, lc, 0.7 + Math.sin(t * 3) * 0.2); g.globalCompositeOperation = 'source-over';
      m.ph.forEach((k, i) => {
        const cx = 75 + i * 90, down = this.press && this.press.slot === s && this.press.id === 'm' + i;
        g.fillStyle = '#100e18'; g.beginPath(); g.arc(cx, 180, 46, 0, TAU); g.fill();
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, 175, 70, '#cfd8ff', 0.15); g.globalCompositeOperation = 'source-over';
        drawMoon(g, cx, 175 + (down ? 3 : 0), 38, k);
      });
      const p = this.S.mp[s] || 0;
      for (let i = 0; i < 4; i++) { g.fillStyle = i < p ? '#7dffb5' : 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(MW / 2 - 45 + i * 30, MH - 26, 7, 0, TAU); g.fill(); }
    }
    m_wave(g, m, s, t) {
      const L = this.loc[s] || {}; const f = L.f == null ? m.start : L.f;
      g.fillStyle = '#0c201a'; roundRect(g, 25, 44, MW - 50, 122, 12); g.fill();
      g.strokeStyle = 'rgba(125,255,181,0.1)'; g.lineWidth = 1;
      for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(25 + i * (MW - 50) / 8, 48); g.lineTo(25 + i * (MW - 50) / 8, 162); g.stroke(); }
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(29, 44 + i * 30.5); g.lineTo(MW - 29, 44 + i * 30.5); g.stroke(); }
      g.save(); roundRect(g, 25, 44, MW - 50, 122, 12); g.clip();
      g.globalCompositeOperation = 'lighter';
      drawWave(g, 30, 48, MW - 60, 114, m.shape, m.cyc, t * 0.35, 'rgba(125,255,181,0.25)', 9);
      drawWave(g, 30, 48, MW - 60, 114, m.shape, m.cyc, t * 0.35, '#9dffcb', 3);
      g.restore(); g.globalCompositeOperation = 'source-over';
      this.btn(g, 25, 178, 85, 58, '◀', s, 'l');
      this.btn(g, 310, 178, 85, 58, '▶', s, 'r');
      g.fillStyle = '#0b0a10'; roundRect(g, 120, 178, 180, 58, 10); g.fill();
      g.font = '700 38px "Courier New", monospace'; g.textAlign = 'center'; g.fillStyle = '#9fe7ff';
      g.fillText(FREQS[f], 192, 220); g.font = '700 16px Comfortaa'; g.fillStyle = 'rgba(159,231,255,0.6)'; g.fillText('МГц', 262, 218);
      this.btn(g, 90, 244, 240, 46, 'ПЕРЕДАТЬ', s, 'ok', '#2f8a5c', 20);
    }

    resync() { if (this.S && this.ctx.isHost) this.broadcast(); }
    destroy() { clearInterval(this.hostT); this.st && this.st.destroy(); }
  }
})();
