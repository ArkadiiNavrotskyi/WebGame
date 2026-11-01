'use strict';
// «Два ключа» — асимметричная головоломка. Путник видит руины, Хранитель держит Книгу и управляет механизмами.
(() => {
  const W = 1600, H = 900, FLOOR = 780;
  const GRAV = 2300, JUMP = 920, SPEED = 340;
  const BELLS = ['round', 'tall', 'crown', 'star'];
  const BELL_NAMES = { round: 'Круглый', tall: 'Высокий', crown: 'Корона', star: 'Звёздный' };
  const CRYSTAL = { red: '#ff6b6b', blue: '#6fb8ff', green: '#6bffb0', gold: '#ffd25c' };
  const FLAME = { blue: '#6fb8ff', red: '#ff7a5c' };
  const CHAPTERS = ['Затонувший храм', 'Ледяная обсерватория', 'Кристальные пещеры', 'Сад светлячков'];
  const CONST_NAMES = ['Лебедь', 'Кит', 'Корона', 'Лира', 'Змей', 'Дракон', 'Рыбы', 'Арфа', 'Лис', 'Сова', 'Парус', 'Олень', 'Чаша', 'Стрела'];

  // Комнаты: ch — глава, kind — тип загадки, hard — усложнённый вариант
  const ROOMS = [
    { ch: 0, kind: 'plates', title: 'Зал плит', start: 120, steps: 3 },
    { ch: 0, kind: 'stars', title: 'Окно в небо', start: 120, steps: 3 },
    { ch: 0, kind: 'rings', title: 'Кольцевая дверь', start: 120 },
    { ch: 1, kind: 'bells', title: 'Колокола звёзд', start: 120, len: 5 },
    { ch: 1, kind: 'bridges', title: 'Ледяные мосты', start: 140, set: 0 },
    { ch: 1, kind: 'lifts', title: 'Подъёмники', start: 120 },
    { ch: 2, kind: 'plates', title: 'Плиты пламени', start: 120, steps: 5, hard: true },
    { ch: 2, kind: 'rings', title: 'Зеркальные кольца', start: 120, hard: true },
    { ch: 2, kind: 'stars', title: 'Перевёрнутое небо', start: 120, steps: 4, hard: true },
    { ch: 2, kind: 'bridges', title: 'Кристальная пропасть', start: 120, set: 1 },
    { ch: 3, kind: 'bells', title: 'Песня сада', start: 120, len: 7, hard: true },
    { ch: 3, kind: 'dark', title: 'Тёмная тропа', start: 100, set: 0 },
    { ch: 3, kind: 'dark', title: 'Чаща', start: 90, set: 1 },
    { ch: 3, kind: 'heart', title: 'Сердце сада', start: 160 },
  ];
  const BRIDGE_SETS = [
    { startW: 300, end: { x: 1300, y: 520 }, list: [{ x: 330, y: 700, w: 150 }, { x: 545, y: 640, w: 140 }, { x: 760, y: 585, w: 140 }, { x: 975, y: 545, w: 140 }, { x: 1170, y: 520, w: 110 }] },
    { startW: 270, end: { x: 1360, y: 460 }, list: [{ x: 300, y: 710, w: 110 }, { x: 460, y: 640, w: 110 }, { x: 620, y: 590, w: 110 }, { x: 790, y: 650, w: 110 }, { x: 950, y: 590, w: 110 }, { x: 1100, y: 530, w: 110 }, { x: 1240, y: 480, w: 100 }] },
  ];
  const DARK_SETS = [
    {
      solids: [{ x: 0, y: FLOOR, w: 430, h: 120 }, { x: 540, y: FLOOR, w: 380, h: 120 }, { x: 960, y: 650, w: 170, h: 26 }, { x: 1160, y: 560, w: 150, h: 26 }, { x: 1340, y: FLOOR, w: 260, h: 120 }],
      hazards: [{ x: 430, y: 850, w: 110, h: 50 }, { x: 690, y: 748, w: 70, h: 32 }, { x: 920, y: 850, w: 420, h: 50 }, { x: 1040, y: 622, w: 40, h: 28 }],
    },
    {
      solids: [{ x: 0, y: FLOOR, w: 300, h: 120 }, { x: 360, y: 700, w: 120, h: 26 }, { x: 540, y: 620, w: 120, h: 26 }, { x: 720, y: 540, w: 130, h: 26 }, { x: 910, y: 620, w: 120, h: 26 }, { x: 1060, y: FLOOR, w: 200, h: 120 }, { x: 1300, y: 680, w: 100, h: 26 }, { x: 1420, y: FLOOR, w: 180, h: 120 }],
      hazards: [{ x: 300, y: 860, w: 760, h: 40 }, { x: 1260, y: 860, w: 160, h: 40 }, { x: 765, y: 512, w: 40, h: 28 }, { x: 1135, y: 748, w: 46, h: 32, mx: 70, sp: 1.6 }],
    },
  ];
  const LIFTS = [{ x: 540, w: 140, bottom: 780, top: 400 }, { x: 980, w: 140, bottom: 760, top: 210 }];
  const LEVERS = [360, 600, 1000, 1240];
  // комнаты-переходы: дверь открывается, когда Путник до неё добрался
  const TRAVERSE = ['bridges', 'lifts', 'dark'];

  GAMES.keys = {
    id: 'keys', title: 'Два ключа', icon: '🗝️', color: '#6fc3ff',
    tagline: 'Один видит руины, другой — держит Книгу. Говорите!',
    landscape: true,
    roles: [
      { id: 'explorer', name: 'Путник', icon: '🧭', desc: 'Ты исследуешь древние руины: двери, плиты, колокола, созвездия, тьма. Видишь всё — но не понимаешь знаков. Описывай!', ctrl: { pc: 'A/D ←/→ — идти, W/Пробел — прыжок, E/↓ — действие', touch: 'джойстик — идти, ⤒ — прыжок, ✋ — действие' } },
      { id: 'keeper', name: 'Хранитель', icon: '📖', desc: 'У тебя Книга Хранителя: разгадки, шифры и механизмы. Мир ты не видишь — только то, что расскажет Путник.', ctrl: { pc: 'мышь: листать книгу, крутить кольца, двигать рычаги', touch: 'пальцем: листать, крутить кольца, двигать рычаги' } },
    ],
    rules: [
      'Путник видит комнату, Хранитель — Книгу. Решение есть только у вас двоих вместе.',
      'Путник описывает, что видит («тут змея и луна!»), Хранитель ищет ответ в Книге и говорит, что делать.',
      'В некоторых комнатах Хранитель сам управляет механизмами: кольцами, мостами, подъёмниками, светлячком.',
      '4 главы, 14 комнат — около часа приключений. Прогресс сохраняется. А в конце — сюрприз ✦',
    ],
    info() { const r = Store.get('keys_room', 0); return Store.get('keys_done', false) && !r ? 'пройдено ✦' : r ? `комната ${r + 1} из ${ROOMS.length}` : 'кооп-головоломка'; },
    create(ctx) { return new Keys2(ctx); },
  };

  // ---------- Генерация загадок: одинаковая у обоих (seed + номер комнаты) ----------
  function makeConstellation(r) {
    const n = r.int(5, 7), pts = [[0, 0]];
    let guard = 0;
    while (pts.length < n && guard++ < 400) {
      const base = pts[pts.length - 1], a = r.range(0, TAU), d = r.range(0.45, 0.8);
      const p = [base[0] + Math.cos(a) * d, base[1] + Math.sin(a) * d];
      if (Math.abs(p[0]) > 1.3 || Math.abs(p[1]) > 1.3) continue;
      if (pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.38)) continue;
      pts.push(p);
    }
    const edges = pts.slice(1).map((_, i) => [i, i + 1]);
    if (pts.length > 4 && r() < 0.6) edges.push([r.int(0, 1), r.int(3, pts.length - 1)]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const R = Math.max(...pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy))) || 1;
    return { pts: pts.map((p) => [(p[0] - cx) / R, (p[1] - cy) / R]), edges, big: r.int(0, pts.length - 1) };
  }

  function makePuzzle(seed, idx) {
    const room = ROOMS[idx], r = RNG(seed * 31 + idx * 7919 + 1);
    const P = { room };
    switch (room.kind) {
      case 'plates': {
        const gl = r.shuffle([...GLYPHS]);
        P.plates = gl.slice(0, 4); P.doors = gl.slice(4, 10);
        const mk = () => { const pl = r.shuffle([...P.plates]), m = {}; r.shuffle([...P.doors]).forEach((d, i) => (m[d] = pl[i % 4])); return m; };
        P.mapA = mk(); P.mapB = mk();
        const pool = r.shuffle([...P.doors]);
        P.questions = Array.from({ length: room.steps }, (_, i) => ({ g: pool[i % pool.length], f: room.hard ? r.pick(['blue', 'red']) : 'blue' }));
        P.want = P.questions.map((q) => (q.f === 'blue' ? P.mapA : P.mapB)[q.g]);
        break;
      }
      case 'stars': {
        P.levers = r.shuffle([...GLYPHS]).slice(0, 4);
        const names = r.shuffle([...CONST_NAMES]);
        const glyphOrder = r.shuffle([0, 1, 2, 3, r.int(0, 3), r.int(0, 3)]);
        P.consts = Array.from({ length: 6 }, (_, i) => ({ ...makeConstellation(r), name: names[i], glyph: P.levers[glyphOrder[i]] }));
        const order = r.shuffle([0, 1, 2, 3, 4, 5]);
        P.questions = Array.from({ length: room.steps }, (_, i) => ({ c: order[i], rot: room.hard ? r.pick([Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI * 0.75]) : 0 }));
        P.want = P.questions.map((q) => P.consts[q.c].glyph);
        break;
      }
      case 'rings': {
        P.rings = [0, 1, 2].map(() => r.shuffle([...GLYPHS]).slice(0, 8));
        P.code = [r.int(2, 7), r.int(2, 7), r.int(1, 7)];
        // в зеркальном зале фреска показывает знак на шаг раньше
        P.mural = P.code.map((c, k) => P.rings[k][room.hard ? (c + 7) % 8 : c]);
        break;
      }
      case 'bells': {
        P.bellOrder = r.shuffle([...BELLS]);
        P.melody = Array.from({ length: room.len }, () => r.pick(BELLS));
        for (let i = 1; i < P.melody.length; i++) if (P.melody[i] === P.melody[i - 1]) P.melody[i] = BELLS[(BELLS.indexOf(P.melody[i]) + 1) % 4];
        P.crystal = r.pick(room.hard ? ['red', 'blue', 'green', 'gold'] : ['red', 'blue', 'green']);
        let s = [...P.melody];
        if (P.crystal === 'blue') s.reverse();
        if (P.crystal === 'green') s.splice(2, 1);
        if (P.crystal === 'gold') s = s.filter((_, i) => i % 2 === 0);
        P.sequence = s;
        break;
      }
    }
    return P;
  }

  class Keys2 {
    constructor(ctx) {
      this.ctx = ctx;
      this.exp = ctx.role === 'explorer';
      this.st = new Stage(ctx.canvas, W, H);
      this.cache = {};
      this.parts = new Particles();
      this.keys = new Keys();
      this.R = null; this.P = null;
      this.pl = { x: 120, y: FLOOR, vx: 0, vy: 0, ground: false, f: 1, walk: 0 };
      this.rp = { x: 120, y: FLOOR, f: 1 };
      this.ff = { x: 300, y: 600 }; this.rff = { x: 300, y: 600 };
      this.ringLocal = [0, 0, 0]; this.ringDrag = null;
      this.liftCur = [0, 0]; this.liftLocal = null; this.liftDrag = -1; this.liftSendT = 0;
      this.leverT = [0, 0, 0, 0];
      this.page = 0; this.flash = 0; this.shake = 0; this.sendT = 0; this.hint = '';
      this.bubbles = Array.from({ length: 40 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(2, 6), s: rand(20, 60) }));
      this.snow = Array.from({ length: 120 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1, 3), s: rand(30, 80) }));
      this.flies = Array.from({ length: 30 }, () => ({ x: rand(0, W), y: rand(200, 800), ph: rand(0, TAU) }));
      this.crystals = Array.from({ length: 9 }, (_, i) => ({ x: 60 + i * 185 + rand(-30, 30), s: rand(0.6, 1.3), c: pick(['#b98cff', '#7ff0e0', '#ff9ce0']), top: Math.random() < 0.4 }));
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) {
        const saved = Store.get('keys_room', 0);
        if (saved > 0 && saved < ROOMS.length) {
          ctx.modal({ title: '🗝️ Продолжить путь?', text: `Вы остановились в комнате ${saved + 1} из ${ROOMS.length}: «${ROOMS[saved].title}»`, buttons: [
            { label: 'Продолжить ✦', onClick: () => this.goRoom(saved) },
            { label: 'Начать сначала', ghost: true, onClick: () => this.goRoom(0) },
          ] });
        } else this.goRoom(0);
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }
    puz(i) { return (this.cache[i] ||= makePuzzle(this.ctx.seed, i)); }

    // ============ Хост: состояние комнаты ============
    goRoom(i) {
      this.R = { room: i, open: false, prog: 0, rings: [0, 0, 0], bridges: [], border: [], lifts: [0, 0], heart: false, altar: false, hold: 0, done: false };
      Store.set('keys_room', i);
      this.push();
      this.fx({ t: 'room' });
    }
    push() { this.ctx.send({ a: 'R', R: this.R }); this.applyR(this.R); }
    fx(f) { this.ctx.send({ a: 'fx', f }); this.runFx(f); }
    hostMsg(m) {
      const R = this.R; if (!R) return;
      const room = ROOMS[R.room], P = this.puz(R.room);
      switch (m.a) {
        case 'use': {
          if (R.open) return;
          let ok = null;
          if (room.kind === 'plates' && m.kind === 'plate') ok = P.plates[m.i] === P.want[R.prog];
          if (room.kind === 'stars' && m.kind === 'lever') { ok = P.levers[m.i] === P.want[R.prog]; this.fx({ t: 'lever', i: m.i }); }
          if (room.kind === 'bells' && m.kind === 'bell') { this.fx({ t: 'bell', i: m.i }); ok = P.bellOrder[m.i] === P.sequence[R.prog]; }
          if (ok === null) return;
          const total = room.kind === 'bells' ? P.sequence.length : P.want.length;
          if (ok) {
            R.prog++;
            if (room.kind !== 'bells') this.fx({ t: 'good', i: m.i });
            if (R.prog >= total) { R.open = true; setTimeout(() => this.fx({ t: 'open' }), room.kind === 'bells' ? 600 : 0); }
          } else { R.prog = 0; this.fx({ t: room.kind === 'bells' ? 'wrongbell' : 'trap' }); }
          this.push();
          break;
        }
        case 'rings':
          if (room.kind !== 'rings' || R.open) return;
          R.rings[m.i] = ((m.step % 8) + 8) % 8;
          this.fx({ t: 'click' });
          if (R.rings.every((s, k) => s === P.code[k])) { R.open = true; this.fx({ t: 'open' }); }
          this.push();
          break;
        case 'bridge': {
          if (room.kind !== 'bridges') return;
          const i = m.i;
          if (R.bridges[i]) { R.bridges[i] = false; R.border = R.border.filter((x) => x !== i); }
          else { R.bridges[i] = true; R.border.push(i); if (R.border.length > 2) { const off = R.border.shift(); R.bridges[off] = false; } }
          this.fx({ t: 'ice' });
          this.push();
          break;
        }
        case 'lift': if (room.kind === 'lifts') { R.lifts[m.i] = clamp(m.v, 0, 1); this.push(); } break;
        case 'heart': R.heart = !!m.on; this.push(); break;
        case 'altar': R.altar = !!m.on; this.push(); break;
        case 'exit':
          if (!R.open && TRAVERSE.includes(room.kind) && !R.leaving) { R.open = true; R.leaving = true; this.fx({ t: 'open' }); this.push(); const at = R.room; setTimeout(() => { if (this.R && this.R.room === at && at + 1 < ROOMS.length) this.goRoom(at + 1); }, 1100); return; }
          if (!R.open || R.leaving) return;
          if (R.room + 1 < ROOMS.length) this.goRoom(R.room + 1);
          break;
      }
    }
    hostTick(dt) {
      const R = this.R; if (!R || ROOMS[R.room].kind !== 'heart' || R.done) return;
      if (R.heart && R.altar) {
        R.hold += dt;
        if (Math.floor(R.hold * 4) !== Math.floor((R.hold - dt) * 4)) this.push();
        if (R.hold >= 3) { R.done = true; R.open = true; Store.set('keys_done', true); Store.set('keys_room', 0); this.push(); this.fx({ t: 'finale' }); }
      } else if (R.hold > 0) { R.hold = 0; this.push(); }
    }

    // ============ Сообщения ============
    onMsg(d) {
      switch (d.a) {
        case 'R': this.applyR(d.R); break;
        case 'fx': this.runFx(d.f); break;
        case 'p': this.rp = d.p; break;
        case 'ff': this.rff = d.p; break;
        default: if (this.ctx.isHost) this.hostMsg(d);
      }
    }
    toHost(m) { if (this.ctx.isHost) this.hostMsg(m); else this.ctx.send(m); }
    applyR(R) {
      const prevRoom = this.R ? this.R.room : -1;
      this.R = JSON.parse(JSON.stringify(R));
      this.P = this.puz(R.room);
      if (R.room !== prevRoom) {
        this.pl = { x: ROOMS[R.room].start, y: FLOOR, vx: 0, vy: 0, ground: false, f: 1, walk: 0 };
        this.page = R.room + 1;
        this.ringLocal = [...R.rings];
        this.liftCur = [...R.lifts];
        this.onAltar = false; this.roomT = 0; this.openT = null;
        this.sffx = this.sffy = undefined;
      }
      if (ROOMS[R.room].kind === 'rings' && !this.ringDrag) this.ringLocal = this.ringLocal.map((v, i) => (((Math.round(v) % 8) + 8) % 8 === R.rings[i] ? v : R.rings[i]));
    }
    runFx(f) {
      switch (f.t) {
        case 'room': {
          const R = this.R; if (!R) break;
          const room = ROOMS[R.room];
          SFX.play('door');
          const newCh = R.room === 0 || ROOMS[R.room - 1].ch !== room.ch;
          this.banner = { t: 0, text: room.title, sub: `${newCh ? '✦ Новая глава · ' : ''}Глава ${room.ch + 1} · ${CHAPTERS[room.ch]} · комната ${R.room + 1}/${ROOMS.length}` };
          break;
        }
        case 'good': SFX.play('chime'); if (this.exp) { const x = ROOMS[this.R.room].kind === 'stars' ? LEVERS[f.i] : this.platePos(f.i); this.parts.emit(x, FLOOR - 10, { n: 24, speed: 160, life: 1, size: 9, color: '#9ff0ff' }); } break;
        case 'trap': SFX.play('hit'); this.shake = 0.5; this.flash = 0.6; if (this.exp) { this.darts = 1; this.pl.vx = -900; this.pl.vy = -400; } else this.ctx.toast('💥 Ловушка! Всё сбросилось — начинаем заново'); break;
        case 'open': SFX.play('win'); this.openT = 0; if (!this.exp) this.ctx.toast('🗝 Дверь открылась!'); break;
        case 'bell': SFX.play(['bell', 'bellLow', 'bell', 'bellLow'][f.i]); this.bellRing = this.bellRing || {}; this.bellRing[f.i] = 1; break;
        case 'wrongbell': setTimeout(() => SFX.play('fail'), 300); if (!this.exp) this.ctx.toast('🔕 Мелодия сбилась — сначала'); break;
        case 'lever': SFX.play('click'); this.leverT[f.i] = 1; break;
        case 'click': SFX.play('tick'); break;
        case 'ice': SFX.play('magic'); break;
        case 'finale': this.finale(); break;
      }
    }

    // ============ Геометрия комнат ============
    bridgeSet() { return BRIDGE_SETS[ROOMS[this.R.room].set || 0]; }
    darkSet() { return DARK_SETS[ROOMS[this.R.room].set || 0]; }
    liftY(i) { const L = LIFTS[i]; return lerp(L.bottom, L.top, this.liftCur[i]); }
    solids() {
      const R = this.R, room = ROOMS[R.room], kind = room.kind, S = [];
      if (kind === 'bridges') {
        const B = this.bridgeSet();
        S.push({ x: 0, y: FLOOR, w: B.startW, h: 120 }, { x: B.end.x, y: B.end.y, w: W - B.end.x, h: H - B.end.y });
        B.list.forEach((b, i) => R.bridges[i] && S.push({ x: b.x, y: b.y, w: b.w, h: 22 }));
      } else if (kind === 'dark') S.push(...this.darkSet().solids);
      else if (kind === 'lifts') {
        S.push({ x: 0, y: FLOOR, w: 520, h: 120 }, { x: 700, y: 420, w: 260, h: 480 }, { x: 1140, y: 220, w: 460, h: 680 });
        LIFTS.forEach((L, i) => S.push({ x: L.x, y: this.liftY(i), w: L.w, h: 24, lift: i }));
      } else {
        S.push({ x: 0, y: FLOOR, w: W, h: 120 });
        if (kind === 'rings') S.push({ x: 380, y: 640, w: 220, h: 24 }, { x: 700, y: 540, w: 200, h: 24 });
        if (kind === 'heart') S.push({ x: 740, y: 750, w: 120, h: 30 });
      }
      S.push({ x: -40, y: 0, w: 40, h: H }, { x: W, y: 0, w: 40, h: H });
      return S;
    }
    hazards() {
      const kind = ROOMS[this.R.room].kind;
      if (kind === 'bridges') { const B = this.bridgeSet(); return [{ x: B.startW, y: 860, w: B.end.x - B.startW, h: 40 }]; }
      if (kind === 'lifts') return [{ x: 520, y: 860, w: 180, h: 40 }, { x: 960, y: 860, w: 180, h: 40 }];
      if (kind === 'dark') { const t = this.roomT || 0; return this.darkSet().hazards.map((z) => (z.mx ? { ...z, x: z.x + Math.sin(t * z.sp) * z.mx } : z)); }
      return [];
    }
    platePos(i) { return 360 + i * 240; }
    bellPos(i) { return 400 + i * 260; }
    doorRect() {
      const kind = ROOMS[this.R.room].kind;
      if (kind === 'bridges') { const e = this.bridgeSet().end; return { x: 1440, y: e.y - 160, w: 90, h: 160 }; }
      if (kind === 'lifts') return { x: 1440, y: 60, w: 90, h: 160 };
      return { x: 1440, y: FLOOR - 170, w: 90, h: 170 };
    }

    // ============ Путник: физика ============
    updateExplorer(dt) {
      const p = this.pl, k = this.keys, pad = this.pad, R = this.R;
      let mx = 0;
      if (k.any('KeyA', 'ArrowLeft')) mx -= 1;
      if (k.any('KeyD', 'ArrowRight')) mx += 1;
      if (pad && Math.abs(pad.ax) > 0.2) mx = Math.sign(pad.ax);
      const jump = k.once('KeyW', 'ArrowUp', 'Space') || (pad && pad.once('jump'));
      const use = k.once('KeyE', 'ArrowDown', 'KeyS') || (pad && pad.once('use'));
      p.vx = lerp(p.vx, mx * SPEED, Math.min(1, dt * (p.ground ? 14 : 5)));
      if (mx) p.f = mx;
      // подъёмник везёт стоящего на нём
      if (this.liftOn != null && this.liftPrev) { const dy = this.liftY(this.liftOn) - this.liftPrev[this.liftOn]; if (dy < 0) p.y += dy; }
      if (jump && p.ground) { p.vy = -JUMP; p.ground = false; SFX.play('whoosh'); this.parts.emit(p.x, p.y, { n: 6, speed: 60, life: 0.4, size: 5, color: 'rgba(255,255,255,0.5)', glow: false }); }
      p.vy += GRAV * dt;
      const S = this.solids(), hw = 15, hh = 56;
      p.x += p.vx * dt;
      for (const s of S) if (p.x + hw > s.x && p.x - hw < s.x + s.w && p.y > s.y + 2 && p.y - hh < s.y + s.h) { if (p.vx > 0) p.x = s.x - hw; else if (p.vx < 0) p.x = s.x + s.w + hw; p.vx = 0; }
      const wasGround = p.ground; p.ground = false; this.liftOn = null;
      p.y += p.vy * dt;
      for (const s of S) if (p.x + hw > s.x && p.x - hw < s.x + s.w && p.y > s.y && p.y - hh < s.y + s.h) {
        if (p.vy > 0 && p.y - p.vy * dt <= s.y + 8) { p.y = s.y; p.vy = 0; p.ground = true; if (s.lift != null) this.liftOn = s.lift; }
        else if (p.vy < 0) { p.y = s.y + s.h + hh; p.vy = 0; }
      }
      if (p.ground && !wasGround) this.parts.emit(p.x, p.y, { n: 4, speed: 40, life: 0.3, size: 4, color: 'rgba(255,255,255,0.4)', glow: false });
      p.walk += Math.abs(p.vx) * dt * 0.05;
      for (const z of this.hazards()) if (p.x + hw > z.x && p.x - hw < z.x + z.w && p.y > z.y && p.y - hh < z.y + z.h) return this.die();
      if (p.y > H + 100) return this.die();
      // взаимодействие
      const kind = ROOMS[R.room].kind;
      const near = (xs, r) => xs.findIndex((x) => Math.abs(p.x - x) < r);
      this.hint = '';
      if (kind === 'plates' && !R.open && p.ground) { const i = near([0, 1, 2, 3].map((j) => this.platePos(j)), 55); if (i >= 0) { this.hint = 'нажать плиту'; if (use) { this.toHost({ a: 'use', kind: 'plate', i }); this.pressT = { i, t: 0.3 }; } } }
      if (kind === 'stars' && !R.open && p.ground) { const i = near(LEVERS, 55); if (i >= 0) { this.hint = 'потянуть рычаг'; if (use) this.toHost({ a: 'use', kind: 'lever', i }); } }
      if (kind === 'bells' && !R.open) { const i = near([0, 1, 2, 3].map((j) => this.bellPos(j)), 60); if (i >= 0) { this.hint = 'ударить в колокол'; if (use) this.toHost({ a: 'use', kind: 'bell', i }); } }
      if (kind === 'heart') { const on = Math.abs(p.x - 800) < 60 && p.ground && p.y <= 752; if (on !== this.onAltar) { this.onAltar = on; this.toHost({ a: 'altar', on }); } if (on) this.hint = R.done ? '' : 'стой на алтаре…'; }
      const d = this.doorRect();
      const canGo = R.open || TRAVERSE.includes(kind);
      if (canGo && !R.done && p.x > d.x + 20 && p.y > d.y && p.y - hh < d.y + d.h) { if (!this.exiting) { this.exiting = true; this.toHost({ a: 'exit' }); setTimeout(() => (this.exiting = false), 1500); } }
      else if (!canGo && p.x > d.x - 30 && p.x < d.x + d.w && Math.abs(p.y - (d.y + d.h)) < 10) this.hint = this.hint || 'дверь заперта';
    }
    die() {
      SFX.play('fail'); this.flash = 0.7; this.shake = 0.3;
      this.parts.emit(this.pl.x, this.pl.y - 30, { n: 30, speed: 200, life: 0.8, size: 8, color: ['#9ff0ff', '#fff'] });
      this.pl = { x: ROOMS[this.R.room].start, y: FLOOR, vx: 0, vy: 0, ground: false, f: 1, walk: 0 };
    }

    // ============ Ввод Хранителя ============
    mapW() { return ROOMS[this.R.room].kind === 'lifts' ? 470 : 580; }
    mapPt(x, y) { return { x: 860 + (x / W) * this.mapW(), y: 260 + (y / H) * 326 }; }
    bindInput() {
      if (this.exp) return;
      const c = this.ctx.canvas;
      c.addEventListener('pointerdown', (e) => {
        if (!this.R) return;
        const p = this.st.pt(e);
        c.setPointerCapture(e.pointerId);
        if (p.x < 820) { if (p.x < 300 && this.page > 0) { this.page--; SFX.play('card'); } else if (p.x > 640 && this.page < this.R.room + 1) { this.page++; SFX.play('card'); } return; }
        const kind = ROOMS[this.R.room].kind;
        if (kind === 'rings' && !this.R.open) {
          const d = dist(p.x, p.y, 1150, 470);
          const ring = d > 170 ? 0 : d > 115 ? 1 : d > 55 ? 2 : -1;
          if (ring >= 0 && d < 240) this.ringDrag = { ring, a0: Math.atan2(p.y - 470, p.x - 1150), v0: this.ringLocal[ring] };
        }
        if (kind === 'bridges') { let best = -1, bd = 1e9; this.bridgeSet().list.forEach((b, i) => { const s = this.mapPt(b.x + b.w / 2, b.y), d = Math.hypot(p.x - s.x, (p.y - s.y) * 1.3); if (d < bd) { bd = d; best = i; } }); if (best >= 0 && bd < 60) this.toHost({ a: 'bridge', i: best }); }
        if (kind === 'lifts') { for (let i = 0; i < 2; i++) if (Math.abs(p.x - (1375 + i * 65)) < 32 && p.y > 230 && p.y < 616) { this.liftDrag = i; this.liftLocal = [...this.R.lifts]; this.dragLift(p); } }
        if (kind === 'dark') this.moveFirefly(p);
        if (kind === 'heart' && dist(p.x, p.y, 1150, 470) < 140) { this.heartDown = true; this.toHost({ a: 'heart', on: true }); }
      });
      c.addEventListener('pointermove', (e) => {
        if (!this.R) return;
        const p = this.st.pt(e);
        if (this.ringDrag) {
          const a = Math.atan2(p.y - 470, p.x - 1150), d = angDiff(this.ringDrag.a0, a);
          this.ringLocal[this.ringDrag.ring] = this.ringDrag.v0 - d / (TAU / 8);
        }
        if (this.liftDrag >= 0) this.dragLift(p);
        if (ROOMS[this.R.room].kind === 'dark' && (e.buttons || e.pointerType === 'touch')) this.moveFirefly(p);
      });
      const up = () => {
        if (this.ringDrag) {
          const r = this.ringDrag.ring, v = Math.round(this.ringLocal[r]);
          this.ringLocal[r] = v; this.toHost({ a: 'rings', i: r, step: ((v % 8) + 8) % 8 });
          this.ringDrag = null;
        }
        if (this.liftDrag >= 0) { this.toHost({ a: 'lift', i: this.liftDrag, v: this.liftLocal[this.liftDrag] }); this.liftDrag = -1; this.liftLocal = null; }
        if (this.heartDown) { this.heartDown = false; this.toHost({ a: 'heart', on: false }); }
      };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
    dragLift(p) {
      const v = clamp(1 - (p.y - 260) / 326, 0, 1);
      this.liftLocal[this.liftDrag] = v;
      const now = performance.now();
      if (now - this.liftSendT > 90) { this.liftSendT = now; this.toHost({ a: 'lift', i: this.liftDrag, v: +v.toFixed(3) }); }
    }
    moveFirefly(p) {
      const x = ((p.x - 860) / 580) * W, y = ((p.y - 260) / 326) * H;
      if (x < -50 || x > W + 50 || y < -50 || y > H + 50) return;
      this.ff = { x: clamp(x, 0, W), y: clamp(y, 0, H) };
    }

    buildUI() {
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div id="kHint" style="position:absolute;left:50%;bottom:${this.ctx.me.touch && this.exp ? 190 : 24}px;transform:translateX(-50%);pointer-events:none"></div>
        <div id="kRoom" style="position:absolute;top:16px;left:64px;font-size:13px;color:#e8e2ff;text-shadow:0 2px 6px #000;pointer-events:none"></div>
      </div>`);
      this.ctx.ui.appendChild(this.el);
      if (this.exp && this.ctx.me.touch) this.pad = new TouchPad(this.ctx.ui, [{ id: 'use', label: '✋' }, { id: 'jump', label: '⤒' }], { horizontalOnly: true });
    }

    finale() {
      SFX.play('win'); setTimeout(() => SFX.play('chime'), 1200);
      this.finaleT = 0;
      setTimeout(() => {
        const lines = String(CONFIG.finalMessage).split('\n').map((l, i) => `<div style="opacity:0;animation:rise 1.4s ${0.6 + i * 1.1}s both">${esc(l)}</div>`).join('');
        const p = h(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(20,10,40,.35),rgba(5,3,15,.75));animation:fade 2s both">
          <div style="text-align:center;padding:20px;max-width:900px">
            <div style="font-family:var(--script);font-size:clamp(28px,5vw,52px);line-height:1.35;color:#fff;text-shadow:0 0 30px #ffb3d6,0 0 60px #b28cff">${lines}</div>
            <div style="margin-top:30px;opacity:0;animation:rise 1s ${1 + String(CONFIG.finalMessage).split('\n').length * 1.1}s both"><div style="color:#d6ccff;font-size:14px;margin-bottom:10px">Два ключа найдены: ${esc(this.ctx.me.name)} и ${esc(this.ctx.peer.name)} ✦</div>
            <button class="btn" style="width:auto;padding:14px 30px;margin:0 auto" id="kHub">Вернуться под наше небо</button></div>
          </div></div>`);
        $('#kHub', p).onclick = () => this.ctx.exit();
        this.el.appendChild(p);
      }, 2600);
    }

    // ============ Кадр ============
    frame(dt, t) {
      if (this.ctx.isHost) this.hostTick(dt);
      this.parts.update(dt);
      this.flash = Math.max(0, this.flash - dt * 2); this.shake = Math.max(0, this.shake - dt);
      this.roomT = (this.roomT || 0) + dt;
      if (this.openT != null) this.openT += dt;
      for (let i = 0; i < 4; i++) this.leverT[i] = Math.max(0, this.leverT[i] - dt * 1.5);
      if (this.R) {
        // подъёмники плавно едут к цели
        this.liftPrev = [this.liftY(0), this.liftY(1)];
        const tgt = this.liftDrag >= 0 && this.liftLocal ? this.liftLocal : this.R.lifts;
        for (let i = 0; i < 2; i++) { const d = tgt[i] - this.liftCur[i]; this.liftCur[i] += clamp(d, -dt * 0.5, dt * 0.5); }
        if (this.exp) this.updateExplorer(dt);
        this.sendT += dt;
        if (this.sendT > 0.05) {
          this.sendT = 0;
          if (this.exp) this.ctx.send({ a: 'p', p: { x: Math.round(this.pl.x), y: Math.round(this.pl.y), f: this.pl.f } });
          else if (ROOMS[this.R.room].kind === 'dark') this.ctx.send({ a: 'ff', p: { x: Math.round(this.ff.x), y: Math.round(this.ff.y) } });
        }
        const rl = $('#kRoom', this.el), rt = `🗝 ${this.R.room + 1}/${ROOMS.length} · ${CHAPTERS[ROOMS[this.R.room].ch]}`;
        if (rl.textContent !== rt) rl.textContent = rt;
      }
      const hint = $('#kHint', this.el);
      const ht = this.exp && this.hint ? `<div class="g-panel" style="font-size:14px">${this.ctx.me.touch ? '✋' : 'E'} — ${this.hint}</div>` : '';
      if (hint._h !== ht) { hint._h = ht; hint.innerHTML = ht; }
      if (this.exp) this.renderWorld(dt, t); else this.renderBook(dt, t);
      if (this.banner) {
        const g = this.st.g, b = this.banner; b.t += dt;
        if (b.t > 3.4) this.banner = null;
        else {
          this.st.begin();
          const a = Math.min(1, b.t * 2) * Math.min(1, (3.4 - b.t) * 2);
          g.globalAlpha = a; g.textAlign = 'center';
          g.fillStyle = 'rgba(5,6,20,0.5)'; g.fillRect(this.st.x0, 120, this.st.x1 - this.st.x0, 150);
          g.font = "76px 'Marck Script', cursive"; g.fillStyle = '#fff'; g.shadowColor = '#7fd4ff'; g.shadowBlur = 24;
          g.fillText(b.text, W / 2, 205); g.shadowBlur = 0;
          g.font = '600 20px Comfortaa'; g.fillStyle = '#cfe6ff'; g.fillText(b.sub, W / 2, 245);
          g.globalAlpha = 1;
        }
      }
    }

    // ============ Отрисовка: мир Путника ============
    renderWorld(dt, t) {
      const st = this.st, g = st.g, R = this.R;
      st.screen(); g.fillStyle = '#000'; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      if (!R) return;
      if (this.shake) g.translate(rand(-1, 1) * this.shake * 16, rand(-1, 1) * this.shake * 16);
      const room = ROOMS[R.room], kind = room.kind, P = this.P;
      this.drawBackdrop(g, room.ch, t, dt);
      for (const s of this.solids()) if (s.x >= 0 && s.x < W) this.drawSolid(g, s, room.ch);
      this.drawDoor(g, t);
      const d = this.doorRect();
      const progress = (n) => { for (let i = 0; i < n; i++) { g.fillStyle = i < R.prog ? '#7ff0ff' : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(d.x + d.w / 2 - (n - 1) * 12 + i * 24, d.y - 8, 7, 0, TAU); g.fill(); } };
      if (kind === 'plates') {
        const q = P.questions[Math.min(R.prog, P.questions.length - 1)];
        g.fillStyle = 'rgba(20,40,50,0.85)'; roundRect(g, d.x - 10, d.y - 120, d.w + 20, 100, 14); g.fill();
        g.strokeStyle = room.hard ? FLAME[q.f] : '#7fd4e8'; g.lineWidth = 2; g.stroke();
        if (!R.open) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, d.x + d.w / 2, d.y - 70, 70, '#7ff0ff', 0.5 + Math.sin(t * 3) * 0.2); g.globalCompositeOperation = 'source-over'; drawGlyph(g, q.g, d.x + d.w / 2, d.y - 70, 60, '#e6fdff', 4); }
        if (room.hard && !R.open) for (const tx of [d.x - 40, d.x + d.w + 40]) this.drawTorch(g, tx, d.y + 40, FLAME[q.f], t);
        progress(P.questions.length);
        for (let i = 0; i < 4; i++) {
          const x = this.platePos(i), pressed = this.pressT && this.pressT.i === i && this.pressT.t > 0;
          g.fillStyle = pressed ? '#3d6b70' : '#57858a'; roundRect(g, x - 55, FLOOR - (pressed ? 6 : 12), 110, 14, 4); g.fill();
          g.strokeStyle = 'rgba(160,240,255,0.4)'; g.lineWidth = 2; g.stroke();
          g.fillStyle = 'rgba(30,60,70,0.7)'; g.beginPath(); g.arc(x, FLOOR - 120, 42, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(160,240,255,0.35)'; g.stroke();
          drawGlyph(g, P.plates[i], x, FLOOR - 120, 50, '#c8f6ff', 3.5);
        }
        if (this.pressT) this.pressT.t -= dt;
      }
      if (kind === 'stars') {
        const q = P.questions[Math.min(R.prog, P.questions.length - 1)], C = P.consts[q.c];
        const wx = 800, wy = 330, wr = 185;
        g.fillStyle = '#2a3e48'; g.beginPath(); g.arc(wx, wy, wr + 26, 0, TAU); g.fill();
        g.strokeStyle = '#8fd8e8'; g.lineWidth = 3; g.stroke();
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; g.fillStyle = '#3f5a66'; g.beginPath(); g.arc(wx + Math.cos(a) * (wr + 13), wy + Math.sin(a) * (wr + 13), 7, 0, TAU); g.fill(); }
        const sky = g.createRadialGradient(wx, wy - 40, 10, wx, wy, wr); sky.addColorStop(0, '#1b2a6a'); sky.addColorStop(1, '#060a24');
        g.fillStyle = sky; g.beginPath(); g.arc(wx, wy, wr, 0, TAU); g.fill();
        g.save(); g.beginPath(); g.arc(wx, wy, wr, 0, TAU); g.clip();
        const rr = RNG(R.room * 100 + R.prog);
        for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(255,255,255,${rr() * 0.5})`; g.fillRect(wx - wr + rr() * wr * 2, wy - wr + rr() * wr * 2, 1.5, 1.5); }
        if (!R.open) this.drawConst(g, C, wx, wy, 125, q.rot, t, false);
        g.restore();
        progress(P.questions.length);
        LEVERS.forEach((lx, i) => this.drawLever(g, lx, P.levers[i], this.leverT[i], t));
      }
      if (kind === 'rings') {
        const mx = 300, my = 260;
        g.fillStyle = room.hard ? '#3a2e58' : '#334f58'; roundRect(g, mx - 70, my - 40, 140, 300, 20); g.fill();
        g.strokeStyle = room.hard ? '#d9a8ff' : '#8fd8e8'; g.lineWidth = 3; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(g, mx - 58, my - 28, 116, 276, 14); g.fill();
        [2, 1, 0].forEach((ring, k) => drawGlyph(g, P.mural[ring], mx, my + 30 + k * 85, 54, '#e6fdff', 4));
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, mx, my + 110, 150, room.hard ? '#d9a8ff' : '#7ff0ff', 0.2); g.globalCompositeOperation = 'source-over';
      }
      if (kind === 'bells') {
        for (let i = 0; i < 4; i++) this.drawBell(g, this.bellPos(i), 560, P.bellOrder[i], t, i);
        const cc = CRYSTAL[P.crystal], cx = d.x + d.w / 2;
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, d.y - 80, 90, cc, 0.7 + Math.sin(t * 2) * 0.2); g.globalCompositeOperation = 'source-over';
        g.fillStyle = cc; g.beginPath(); g.moveTo(cx, d.y - 130); g.lineTo(cx + 22, d.y - 80); g.lineTo(cx, d.y - 30); g.lineTo(cx - 22, d.y - 80); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(cx, d.y - 130); g.lineTo(cx + 22, d.y - 80); g.lineTo(cx, d.y - 80); g.closePath(); g.fill();
        progress(P.sequence.length);
      }
      if (kind === 'bridges') {
        const B = this.bridgeSet();
        B.list.forEach((b, i) => { if (!R.bridges[i]) { g.strokeStyle = `rgba(190,230,255,${0.12 + Math.sin(t * 2 + i) * 0.06})`; g.setLineDash([6, 8]); g.lineWidth = 2; roundRect(g, b.x, b.y, b.w, 22, 8); g.stroke(); g.setLineDash([]); } });
        g.fillStyle = room.ch === 2 ? '#d9a8ff' : '#bfe6ff';
        for (let x = B.startW; x < B.end.x; x += 24) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x + 12, 852 + Math.sin(x) * 6); g.lineTo(x + 24, 900); g.fill(); }
      }
      if (kind === 'lifts') {
        g.fillStyle = '#bfe6ff';
        for (const z of this.hazards()) for (let x = z.x; x < z.x + z.w; x += 24) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x + 12, 852); g.lineTo(x + 24, 900); g.fill(); }
        LIFTS.forEach((L, i) => {
          const y = this.liftY(i);
          g.strokeStyle = 'rgba(200,220,255,0.5)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(L.x + 14, 0); g.lineTo(L.x + 14, y); g.moveTo(L.x + L.w - 14, 0); g.lineTo(L.x + L.w - 14, y); g.stroke();
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, L.x + L.w / 2, y + 12, 70, '#9fdcff', 0.35); g.globalCompositeOperation = 'source-over';
          g.fillStyle = '#e6c27a'; g.font = '700 22px Comfortaa'; g.textAlign = 'center'; g.fillText(i ? 'II' : 'I', L.x + L.w / 2, y + 52);
        });
      }
      if (kind === 'dark') for (const z of this.hazards()) this.drawThorns(g, z, t);
      if (kind === 'heart') this.drawAltar(g, t);
      if (this.darts > 0) { this.darts -= dt * 1.5; for (let k = 0; k < 6; k++) { const dx = (1 - this.darts) * W * 1.2 - k * 90, dy = 520 + k * 40; g.strokeStyle = '#d8c8a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx - 40, dy); g.stroke(); g.fillStyle = '#aaa'; g.beginPath(); g.moveTo(dx + 8, dy); g.lineTo(dx, dy - 5); g.lineTo(dx, dy + 5); g.fill(); } }
      this.drawExplorer(g, this.pl, t);
      this.parts.draw(g);
      if (kind === 'dark') this.drawDarkness(g, t);
      if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; g.fillRect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0); }
      if (R.done) this.drawFinaleFx(g, t, dt);
    }

    drawDarkness(g) {
      const st = this.st;
      const dc = this.dark ||= document.createElement('canvas'), dg = dc.getContext('2d');
      if (dc.width !== this.ctx.canvas.width || dc.height !== this.ctx.canvas.height) { dc.width = this.ctx.canvas.width; dc.height = this.ctx.canvas.height; }
      dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, dc.width, dc.height);
      dg.fillStyle = 'rgba(3,2,10,0.97)'; dg.fillRect(0, 0, dc.width, dc.height);
      const s = st.dpr * st.scale; dg.setTransform(s, 0, 0, s, st.dpr * st.ox, st.dpr * st.oy);
      dg.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r) => { const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.beginPath(); dg.arc(x, y, r, 0, TAU); dg.fill(); };
      hole(this.pl.x, this.pl.y - 30, 95);
      this.sffx = lerp(this.sffx ?? this.rff.x, this.rff.x, 0.25); this.sffy = lerp(this.sffy ?? this.rff.y, this.rff.y, 0.25);
      hole(this.sffx, this.sffy, 240);
      hole(1480, FLOOR - 90, 120);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dc, 0, 0); g.restore();
      g.globalCompositeOperation = 'lighter';
      Glow.draw(g, this.sffx, this.sffy, 60, '#e8ff9a', 0.9); Glow.draw(g, this.sffx, this.sffy, 14, '#ffffff', 1);
      g.globalCompositeOperation = 'source-over';
    }

    drawConst(g, C, cx, cy, sc, rot, t, ink) {
      const pts = C.pts.map(([x, y]) => { const c = Math.cos(rot), s = Math.sin(rot); return [cx + (x * c - y * s) * sc, cy + (x * s + y * c) * sc]; });
      g.save();
      if (!ink) g.globalCompositeOperation = 'lighter';
      g.strokeStyle = ink ? 'rgba(59,36,20,0.75)' : 'rgba(190,210,255,0.55)'; g.lineWidth = ink ? 1.6 : 2;
      for (const [a, b] of C.edges) { g.beginPath(); g.moveTo(pts[a][0], pts[a][1]); g.lineTo(pts[b][0], pts[b][1]); g.stroke(); }
      pts.forEach((p, i) => {
        const big = i === C.big;
        if (ink) { g.fillStyle = '#3b2414'; g.beginPath(); g.arc(p[0], p[1], big ? 5 : 3.2, 0, TAU); g.fill(); }
        else { Glow.draw(g, p[0], p[1], big ? 30 : 18, big ? '#ffe7a6' : '#cfe0ff', 0.75 + Math.sin(t * 3 + i) * 0.25); g.fillStyle = '#fff'; g.beginPath(); g.arc(p[0], p[1], big ? 4 : 2.6, 0, TAU); g.fill(); }
      });
      g.restore();
    }
    drawLever(g, x, glyph, pull, t) {
      g.fillStyle = 'rgba(25,45,55,0.85)'; roundRect(g, x - 40, FLOOR - 220, 80, 80, 14); g.fill();
      g.strokeStyle = 'rgba(160,240,255,0.35)'; g.lineWidth = 2; g.stroke();
      drawGlyph(g, glyph, x, FLOOR - 180, 46, '#c8f6ff', 3.5);
      g.fillStyle = '#3f5560'; roundRect(g, x - 26, FLOOR - 30, 52, 30, 8); g.fill();
      const a = -0.6 + pull * 1.2;
      g.save(); g.translate(x, FLOOR - 22); g.rotate(a);
      g.strokeStyle = '#c9a65a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -70); g.stroke();
      g.fillStyle = '#ff9a6b'; g.beginPath(); g.arc(0, -74, 10, 0, TAU); g.fill();
      g.restore();
    }
    drawTorch(g, x, y, col, t) {
      g.fillStyle = '#4a3a2a'; g.fillRect(x - 5, y, 10, 40);
      g.globalCompositeOperation = 'lighter';
      Glow.draw(g, x, y - 10, 70 + Math.sin(t * 9) * 6, col, 0.9);
      Glow.draw(g, x, y - 6, 20, '#ffffff', 0.9);
      g.globalCompositeOperation = 'source-over';
      if (Math.random() < 0.3) this.parts.emit(x, y - 10, { n: 1, angle: -Math.PI / 2, spread: 0.4, speed: 60, life: 0.6, size: 7, color: col });
    }

    drawBackdrop(g, ch, t, dt) {
      const st = this.st, x0 = st.x0, y0 = st.y0, x1 = st.x1, y1 = st.y1;
      if (ch === 0) {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#0b4a5a'); gr.addColorStop(0.6, '#07303f'); gr.addColorStop(1, '#041a24');
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const x = 200 + i * 260 + Math.sin(t * 0.3 + i) * 60; const lg = g.createLinearGradient(x, 0, x + 200, H); lg.addColorStop(0, 'rgba(140,240,255,0.10)'); lg.addColorStop(1, 'rgba(140,240,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + 80, -10); g.lineTo(x + 340, H); g.lineTo(x + 180, H); g.closePath(); g.fill(); }
        g.restore();
        for (const cx of [140, 480, 1120, 1340]) { const cg = g.createLinearGradient(cx - 40, 0, cx + 40, 0); cg.addColorStop(0, '#173f48'); cg.addColorStop(0.5, '#24606a'); cg.addColorStop(1, '#123138'); g.fillStyle = cg; g.fillRect(cx - 36, 60, 72, FLOOR - 60); g.fillStyle = '#2a6a74'; g.fillRect(cx - 48, 50, 96, 24); g.fillRect(cx - 48, FLOOR - 24, 96, 24); g.strokeStyle = 'rgba(160,240,255,0.1)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(cx - 24 + k * 16, 80); g.lineTo(cx - 24 + k * 16, FLOOR - 30); g.stroke(); } }
        g.strokeStyle = '#1f7a5e'; g.lineWidth = 6; g.lineCap = 'round';
        for (let i = 0; i < 14; i++) { const bx = 40 + i * 115; g.beginPath(); g.moveTo(bx, FLOOR); for (let k = 1; k <= 5; k++) g.lineTo(bx + Math.sin(t * 1.5 + i + k * 0.7) * 10, FLOOR - k * 18); g.stroke(); }
        g.strokeStyle = 'rgba(200,250,255,0.4)'; g.lineWidth = 1.5;
        for (const b of this.bubbles) { b.y -= b.s * dt; b.x += Math.sin(t * 2 + b.r) * 0.3; if (b.y < -10) { b.y = H + 10; b.x = rand(0, W); } g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke(); }
      } else if (ch === 1) {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#060b2a'); gr.addColorStop(0.6, '#13244e'); gr.addColorStop(1, '#2a3d6e');
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const col = ['rgba(90,255,180,', 'rgba(120,180,255,', 'rgba(200,120,255,'][k];
          for (let x = -40; x < W + 40; x += 16) {
            const y = 140 + k * 50 + Math.sin(x * 0.004 + t * 0.5 + k) * 60 + Math.sin(x * 0.011 - t * 0.7) * 20;
            const lg = g.createLinearGradient(0, y, 0, y + 180); lg.addColorStop(0, col + '0.0)'); lg.addColorStop(0.3, col + '0.10)'); lg.addColorStop(1, col + '0)');
            g.fillStyle = lg; g.fillRect(x, y, 17, 180);
          }
        }
        g.restore();
        g.fillStyle = '#1a2850'; g.beginPath(); g.arc(800, FLOOR, 520, Math.PI, 0); g.fill();
        g.strokeStyle = 'rgba(180,220,255,0.12)'; g.lineWidth = 2; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(800, FLOOR - 520); g.quadraticCurveTo(800 + (k - 4) * 160, FLOOR - 300, 800 + (k - 4) * 130, FLOOR); g.stroke(); }
        g.fillStyle = '#0d1736'; g.save(); g.translate(800, FLOOR - 150); g.rotate(-0.7); g.fillRect(-40, -30, 340, 60); g.fillRect(290, -40, 30, 80); g.restore();
        g.fillStyle = '#e8f4ff';
        for (const s of this.snow) { s.y += s.s * dt; s.x += Math.sin(t + s.r * 3) * 0.4; if (s.y > H) { s.y = -5; s.x = rand(0, W); } g.globalAlpha = 0.7; g.beginPath(); g.arc(s.x, s.y, s.r, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
      } else if (ch === 2) {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#0c0620'); gr.addColorStop(0.5, '#1d0d36'); gr.addColorStop(1, '#0a1a2a');
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        // сталактиты
        g.fillStyle = '#160b2a';
        for (let i = 0; i < 22; i++) { const x = i * 76 + ((i * 37) % 30), l = 60 + ((i * 53) % 120); g.beginPath(); g.moveTo(x - 26, y0); g.lineTo(x + 26, y0); g.lineTo(x, l); g.fill(); }
        // кристаллы
        for (const c of this.crystals) {
          const by = c.top ? 0 : FLOOR, dir = c.top ? 1 : -1;
          g.save(); g.translate(c.x, by); g.scale(c.s, c.s * dir);
          const pulse = 0.5 + Math.sin(t * 1.5 + c.x) * 0.3;
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 90, 140, c.c, 0.25 * pulse); g.globalCompositeOperation = 'source-over';
          for (const [ox, hh, w, a] of [[-30, 120, 26, -0.25], [0, 180, 34, 0], [32, 110, 24, 0.3]]) {
            g.save(); g.rotate(a);
            const cg = g.createLinearGradient(-w, 0, w, 0); cg.addColorStop(0, mixColor(c.c, '#000000', 0.45)); cg.addColorStop(0.5, c.c); cg.addColorStop(1, mixColor(c.c, '#000000', 0.25));
            g.fillStyle = cg; g.globalAlpha = 0.85;
            g.beginPath(); g.moveTo(ox - w / 2, 0); g.lineTo(ox - w / 2, hh * 0.75); g.lineTo(ox, hh); g.lineTo(ox + w / 2, hh * 0.75); g.lineTo(ox + w / 2, 0); g.closePath(); g.fill();
            g.globalAlpha = 1; g.restore();
          }
          g.restore();
        }
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const b of this.bubbles) { b.y -= b.s * dt * 0.5; if (b.y < -10) { b.y = H + 10; b.x = rand(0, W); } Glow.draw(g, b.x + Math.sin(t + b.r) * 10, b.y, b.r * 2, '#d9b8ff', 0.5); }
        g.restore();
      } else {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#0d0820'); gr.addColorStop(0.6, '#1d1238'); gr.addColorStop(1, '#2a1a3a');
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.fillStyle = '#140c26';
        for (const [tx, ts] of [[120, 1.2], [420, 0.9], [1250, 1.1], [1520, 1.3]]) { g.fillRect(tx - 12 * ts, FLOOR - 300 * ts, 24 * ts, 300 * ts); g.beginPath(); g.arc(tx, FLOOR - 320 * ts, 110 * ts, 0, TAU); g.arc(tx - 80 * ts, FLOOR - 260 * ts, 80 * ts, 0, TAU); g.arc(tx + 80 * ts, FLOOR - 270 * ts, 80 * ts, 0, TAU); g.fill(); }
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const f of this.flies) { f.ph += dt * 0.6; Glow.draw(g, f.x + Math.sin(f.ph) * 30, f.y + Math.cos(f.ph * 1.3) * 20, 12, '#e8ff9a', 0.4 + Math.sin(t * 4 + f.ph * 3) * 0.4); }
        for (let i = 0; i < 12; i++) Glow.draw(g, 60 + i * 135, FLOOR - 10, 26, i % 2 ? '#ff9ccd' : '#9fc4ff', 0.5 + Math.sin(t * 2 + i) * 0.2);
        g.restore();
      }
    }

    drawSolid(g, s, ch) {
      const top = ['#3f7f88', '#cfe8ff', '#8a68c8', '#4a3a6a'][ch], body = ['#1d4048', '#4f6a9a', '#2a1a48', '#21183a'][ch];
      const gr = g.createLinearGradient(0, s.y, 0, s.y + Math.min(120, s.h)); gr.addColorStop(0, top); gr.addColorStop(0.15, body); gr.addColorStop(1, mixColor(body, '#000000', 0.4));
      g.fillStyle = gr; g.fillRect(s.x, s.y, s.w, s.h);
      g.fillStyle = ch === 1 ? 'rgba(255,255,255,0.6)' : ch === 2 ? 'rgba(220,180,255,0.5)' : 'rgba(255,255,255,0.12)'; g.fillRect(s.x, s.y, s.w, 3);
      if (ch === 3) { g.fillStyle = '#3a8a5a'; for (let x = s.x; x < s.x + s.w; x += 12) { g.beginPath(); g.moveTo(x, s.y); g.lineTo(x + 6, s.y - 7); g.lineTo(x + 12, s.y); g.fill(); } }
      if (ch === 1) { g.fillStyle = 'rgba(200,235,255,0.7)'; for (let x = s.x + 10; x < s.x + s.w - 10; x += 30) { g.beginPath(); g.moveTo(x, s.y + s.h); g.lineTo(x + 5, s.y + s.h + 14); g.lineTo(x + 10, s.y + s.h); g.fill(); } }
      if (ch === 2 && s.h < 40) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, s.x + s.w / 2, s.y + 10, s.w * 0.6, '#b98cff', 0.25); g.globalCompositeOperation = 'source-over'; }
    }

    drawDoor(g, t) {
      const d = this.doorRect(), R = this.R, ch = ROOMS[R.room].ch;
      const open = R.open ? Math.min(1, (this.openT ?? 1) * 0.8) : 0;
      if (ROOMS[R.room].kind === 'heart') return;
      const glow = ['#7ff0ff', '#cfe8ff', '#d9a8ff', '#ffb3d6'][ch];
      g.fillStyle = '#05080c'; roundRect(g, d.x, d.y, d.w, d.h, 40); g.fill();
      if (open > 0) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, d.x + d.w / 2, d.y + d.h / 2, 140 * open, glow, 0.8); g.globalCompositeOperation = 'source-over'; }
      const doorH = d.h * (1 - open);
      if (doorH > 2) {
        g.save(); roundRect(g, d.x, d.y, d.w, d.h, 40); g.clip();
        const gr = g.createLinearGradient(d.x, 0, d.x + d.w, 0); gr.addColorStop(0, ['#2c5a62', '#5d79a8', '#5a3a8a', '#4a3266'][ch]); gr.addColorStop(1, ['#173a40', '#34486e', '#2a1a48', '#2a1a40'][ch]);
        g.fillStyle = gr; g.fillRect(d.x, d.y, d.w, doorH);
        g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 2; g.strokeRect(d.x + 10, d.y + 10, d.w - 20, doorH - 20);
        if (ROOMS[R.room].kind === 'rings') {
          const cx = d.x + d.w / 2, cy = d.y + doorH / 2;
          [36, 26, 16].forEach((rr, k) => { g.strokeStyle = R.rings[k] === this.P.code[k] ? '#7ff0ff' : 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); });
        }
        g.restore();
        if (ROOMS[R.room].kind === 'rings') for (let k = 0; k < 3; k++) {
          const gx = this.P.rings[k][R.rings[k]], x = d.x - 125 + k * 85;
          g.fillStyle = 'rgba(10,30,40,0.7)'; g.beginPath(); g.arc(x, d.y - 50, 30, 0, TAU); g.fill();
          g.strokeStyle = R.rings[k] === this.P.code[k] ? '#7ff0ff' : 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.stroke();
          drawGlyph(g, gx, x, d.y - 50, 34, '#e6fdff', 3);
        }
      }
    }

    drawBell(g, x, y, shape, t, i) {
      const ring = this.bellRing && this.bellRing[i] ? this.bellRing[i] : 0;
      if (ring > 0) this.bellRing[i] = Math.max(0, ring - 0.016);
      const sw = Math.sin(t * 18) * ring * 0.4;
      g.strokeStyle = '#8aa6c8'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 70); g.stroke();
      g.save(); g.translate(x, y - 70); g.rotate(sw);
      const gr = g.createLinearGradient(-50, 0, 50, 0); gr.addColorStop(0, '#b8862f'); gr.addColorStop(0.5, '#ffd98a'); gr.addColorStop(1, '#9a6a20');
      g.fillStyle = gr; bellPath(g, shape); g.fill();
      g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#6a4a1a'; g.beginPath(); g.arc(0, shape === 'tall' ? 126 : 88, 8, 0, TAU); g.fill();
      if (ring > 0) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 60, 120, '#ffe7a6', ring); g.globalCompositeOperation = 'source-over'; }
      g.restore();
      if (ring > 0) { g.strokeStyle = `rgba(255,240,200,${ring})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, (1 - ring) * 180 + 30, 0, TAU); g.stroke(); }
    }

    drawThorns(g, z, t) {
      g.fillStyle = '#5a2a4a';
      for (let x = z.x; x < z.x + z.w; x += 14) { g.beginPath(); g.moveTo(x, z.y + z.h); g.lineTo(x + 7, z.y + Math.sin(x * 3) * 4); g.lineTo(x + 14, z.y + z.h); g.fill(); }
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, z.x + z.w / 2, z.y + z.h / 2, Math.max(z.w, 40) * 0.7, '#ff4f8a', 0.18 + Math.sin(t * 3) * 0.06); g.globalCompositeOperation = 'source-over';
    }

    drawAltar(g, t) {
      const R = this.R;
      const bloom = R.done ? Math.min(1, (this.finaleT || 0) / 3) : (R.hold / 3) * 0.4;
      g.fillStyle = '#2a1a3a'; g.beginPath(); g.moveTo(760, FLOOR - 30); g.quadraticCurveTo(780, 420, 720, 260); g.lineTo(880, 260); g.quadraticCurveTo(820, 420, 840, FLOOR - 30); g.fill();
      for (const [bx, by, br] of [[800, 220, 170], [640, 290, 120], [960, 290, 120], [700, 170, 100], [900, 170, 100]]) {
        const gr = g.createRadialGradient(bx, by, 10, bx, by, br); gr.addColorStop(0, mixColor('#2e2050', '#ffb3d6', bloom)); gr.addColorStop(1, mixColor('#1a1230', '#b28cff', bloom * 0.6));
        g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
      }
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 40 + (i * 37) % 150; Glow.draw(g, 800 + Math.cos(a) * r * 1.3, 230 + Math.sin(a) * r * 0.6, 16, i % 2 ? '#ffb3d6' : '#fff3c4', 0.15 + bloom * 0.85 * (0.6 + Math.sin(t * 3 + i) * 0.4)); }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#4a3a6a'; roundRect(g, 740, 750, 120, 30, 6); g.fill();
      g.strokeStyle = R.altar ? '#ffb3d6' : 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.stroke();
      drawGlyph(g, 'key', 770, 765, 26, R.altar ? '#ffe7a6' : '#8a7aaa', 2.5);
      drawGlyph(g, 'key', 830, 765, 26, R.heart ? '#ffe7a6' : '#8a7aaa', 2.5);
      if (R.hold > 0 && !R.done) { g.strokeStyle = '#ffb3d6'; g.lineWidth = 6; g.beginPath(); g.arc(800, 640, 60, -Math.PI / 2, -Math.PI / 2 + (R.hold / 3) * TAU); g.stroke(); }
      g.textAlign = 'center'; g.font = '600 18px Comfortaa'; g.fillStyle = '#e8dcff';
      if (!R.done) g.fillText(R.altar && R.heart ? 'держите… вместе…' : R.altar ? 'ключ Путника на месте. Нужен ключ Хранителя' : 'встань на алтарь', 800, 560);
    }

    drawFinaleFx(g, t, dt) {
      this.finaleT = (this.finaleT || 0) + dt;
      if (Math.random() < 0.6) this.parts.emit(rand(500, 1100), rand(100, 300), { n: 1, angle: Math.PI / 2, spread: 0.6, speed: 60, life: 4, size: 10, color: ['#ffb3d6', '#fff3c4', '#ffd1e8'], gravity: 20, drag: 0.3 });
    }

    drawExplorer(g, p, t) {
      const walk = Math.sin(p.walk * 2) * (Math.abs(p.vx || 0) > 20 ? 1 : 0);
      g.save(); g.translate(p.x, p.y); g.scale((p.f || 1) * 1.25, 1.25);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 0, 18, 5, 0, 0, TAU); g.fill();
      g.strokeStyle = '#2a2040'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-5, -14); g.lineTo(-5 + walk * 6, 0); g.moveTo(5, -14); g.lineTo(5 - walk * 6, 0); g.stroke();
      const cg = g.createLinearGradient(0, -56, 0, -10); cg.addColorStop(0, '#3fb8c9'); cg.addColorStop(1, '#1f6a8a');
      g.fillStyle = cg; g.beginPath(); g.moveTo(0, -58); g.quadraticCurveTo(20, -40, 18 - walk * 2, -12); g.lineTo(-18 - walk * 2, -12); g.quadraticCurveTo(-20, -40, 0, -58); g.fill();
      g.fillStyle = '#ffe2c8'; g.beginPath(); g.arc(3, -42, 9, 0, TAU); g.fill();
      g.fillStyle = '#2a1a30'; g.beginPath(); g.arc(6, -43, 1.8, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,130,160,0.5)'; g.beginPath(); g.arc(9, -39, 2.2, 0, TAU); g.fill();
      g.fillStyle = '#2d8fa8'; g.beginPath(); g.arc(0, -46, 13, Math.PI * 1.05, Math.PI * 2.05); g.fill();
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, -30); g.lineTo(20, -22); g.stroke();
      g.fillStyle = '#ffe7a6'; g.fillRect(16, -22, 8, 10);
      g.restore();
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, p.x + 25 * (p.f || 1), p.y - 21, 60, '#ffd27a', 0.7 + Math.sin(t * 6) * 0.08); g.globalCompositeOperation = 'source-over';
    }

    // ============ Отрисовка: Книга Хранителя ============
    renderBook(dt, t) {
      const st = this.st, g = st.g, R = this.R;
      st.screen(); g.fillStyle = '#120a08'; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      const desk = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000); desk.addColorStop(0, '#3a2418'); desk.addColorStop(1, '#120a08');
      g.fillStyle = desk; g.fillRect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0);
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 1500, 120, 260, '#ffb35c', 0.25 + Math.sin(t * 7) * 0.02 + Math.sin(t * 13) * 0.02); g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#4a1f1a'; roundRect(g, 70, 40, 1460, 820, 26); g.fill();
      g.strokeStyle = '#c9a65a'; g.lineWidth = 3; roundRect(g, 84, 54, 1432, 792, 20); g.stroke();
      for (const [px, flip] of [[100, false], [800, true]]) {
        const pg = g.createLinearGradient(px, 0, px + 700, 0);
        if (flip) { pg.addColorStop(0, '#d9c49a'); pg.addColorStop(0.06, '#f3e6c4'); pg.addColorStop(1, '#ead8ae'); }
        else { pg.addColorStop(0, '#ead8ae'); pg.addColorStop(0.94, '#f3e6c4'); pg.addColorStop(1, '#d9c49a'); }
        g.fillStyle = pg; g.fillRect(px, 70, 700, 760);
      }
      g.fillStyle = 'rgba(80,50,20,0.25)'; g.fillRect(796, 70, 8, 760);
      if (!R) return;
      g.fillStyle = '#3b2414'; g.strokeStyle = '#3b2414';
      this.drawPage(g, this.page, t);
      g.font = '700 34px Comfortaa'; g.textAlign = 'center';
      g.fillStyle = this.page > 0 ? 'rgba(59,36,20,0.7)' : 'rgba(59,36,20,0.15)'; g.fillText('‹', 140, 805);
      g.fillStyle = this.page < R.room + 1 ? 'rgba(59,36,20,0.7)' : 'rgba(59,36,20,0.15)'; g.fillText('›', 760, 805);
      g.font = "26px 'Marck Script', cursive"; g.fillStyle = 'rgba(59,36,20,0.6)'; g.fillText(`— ${this.page + 1} —`, 450, 805);
      if (this.page !== R.room + 1) { g.font = '600 15px Comfortaa'; g.fillStyle = '#8a3a2a'; g.fillText(`Путник сейчас: стр. ${R.room + 2}  ›`, 450, 110); }
      this.drawMechanism(g, t);
    }

    title(g, text, x, y) { g.font = "48px 'Marck Script', cursive"; g.textAlign = 'center'; g.fillStyle = '#3b2414'; g.fillText(text, x, y); g.strokeStyle = 'rgba(59,36,20,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 160, y + 16); g.lineTo(x + 160, y + 16); g.stroke(); }
    text(g, s, x, y, w = 560, size = 27) { g.font = `${size}px 'Marck Script', cursive`; g.textAlign = 'left'; g.fillStyle = '#3b2414'; return wrapText(g, s, x, y, w, size * 1.18); }

    drawPage(g, page, t) {
      const cx = 450;
      if (page === 0) {
        this.title(g, 'Книга Хранителя', cx, 170);
        this.text(g, 'Путник войдёт в руины, где знаки говорят на забытом языке. Он увидит всё — но не поймёт ничего. Ты не увидишь ничего — но поймёшь всё.\n\nЧетыре главы: затонувший храм, ледяная обсерватория, кристальные пещеры и сад светлячков.\n\nСлушай его голос. Ищи ответы на этих страницах. Листай стрелками внизу.', 150, 250);
        drawGlyph(g, 'key', 380, 720, 60, '#6a4020', 3); drawGlyph(g, 'key', 520, 720, 60, '#6a4020', 3);
        return;
      }
      const room = ROOMS[page - 1]; if (!room) return;
      const P = this.puz(page - 1);
      this.title(g, room.title, cx, 160);
      g.font = '600 14px Comfortaa'; g.textAlign = 'center'; g.fillStyle = 'rgba(59,36,20,0.55)'; g.fillText(`глава ${room.ch + 1} · ${CHAPTERS[room.ch]}`, cx, 205);
      switch (room.kind) {
        case 'plates': {
          if (!room.hard) {
            this.text(g, 'Над дверью горит знак. Найди его слева — и скажи Путнику, на какую плиту встать. Три верных шага откроют дверь. Ошибка — и стены выпустят стрелы.', 150, 245, 580, 24);
            this.plateTable(g, P.doors, P.mapA, 200, 700, 400, 58);
          } else {
            this.text(g, 'Здесь у двери горят факелы. Спроси Путника, какого цвета пламя — от этого зависит таблица. Пять шагов без ошибки.', 150, 245, 580, 23);
            g.font = "26px 'Marck Script', cursive"; g.textAlign = 'center';
            g.fillStyle = '#2a5a9a'; g.fillText('Синее пламя', 290, 380); g.fillStyle = '#a03a2a'; g.fillText('Алое пламя', 610, 380);
            this.plateTable(g, P.doors, P.mapA, 160, 420, 425, 52, true);
            this.plateTable(g, P.doors, P.mapB, 480, 740, 425, 52, true);
          }
          break;
        }
        case 'stars': {
          this.text(g, room.hard ? 'Небо в этом зале перевёрнуто: созвездие в окне может быть повёрнуто как угодно. Ищи его по форме и по яркой звезде.' : 'В окне над залом — созвездие. Пусть Путник опишет его форму. Найди его здесь и назови знак рычага.', 150, 245, 580, 23);
          P.consts.forEach((C, i) => {
            const x = 230 + (i % 3) * 220, y = 430 + Math.floor(i / 3) * 190;
            g.fillStyle = 'rgba(120,80,40,0.07)'; roundRect(g, x - 95, y - 85, 190, 175, 14); g.fill();
            this.drawConst(g, C, x, y - 15, 52, 0, t, true);
            g.font = "22px 'Marck Script', cursive"; g.textAlign = 'center'; g.fillStyle = '#3b2414'; g.fillText(C.name, x - 22, y + 70);
            g.fillStyle = 'rgba(160,110,40,0.15)'; g.beginPath(); g.arc(x + 55, y + 62, 18, 0, TAU); g.fill();
            drawGlyph(g, C.glyph, x + 55, y + 62, 26, '#8a3a1a', 2.2);
          });
          break;
        }
        case 'rings':
          this.text(g, room.hard
            ? 'Это зеркальный зал. Фреска здесь лжёт на один шаг.\n\nЧитай её снизу вверх: нижний знак — внешнее кольцо, верхний — самое маленькое. Найди этот знак на кольце — и поставь под метку СЛЕДУЮЩИЙ знак по часовой стрелке.'
            : 'Дверь заперта тремя кольцами. На стене рядом — фреска с тремя знаками.\n\nЧитай фреску снизу вверх: нижний знак — для внешнего кольца, средний — для среднего, верхний — для самого маленького.\n\nПоверни кольца справа так, чтобы нужные знаки встали под золотую метку.', 150, 250, 580, 26);
          break;
        case 'bells': {
          this.text(g, `${room.len === 7 ? 'Семь нот' : 'Четыре колокола поют мелодию'} звёзд:`, 150, 250, 580, 26);
          const n = P.melody.length, sp = Math.min(120, 560 / n);
          P.melody.forEach((b, i) => { const x = 450 - ((n - 1) * sp) / 2 + i * sp; this.drawBellIcon(g, x, 370, b); g.font = "18px 'Marck Script', cursive"; g.textAlign = 'center'; g.fillStyle = '#3b2414'; g.fillText(BELL_NAMES[b], x, 432); g.fillText(i + 1, x, 300); });
          this.text(g, 'Кристалл над дверью меняет песню:', 150, 490, 580, 25);
          this.text(g, '• алый — играй как написано\n• синий — играй с конца к началу\n• зелёный — пропусти третью ноту' + (room.hard ? '\n• золотой — играй только нечётные ноты (1-ю, 3-ю, 5-ю…)' : ''), 170, 545, 560, 24);
          this.text(g, 'Ошибка — и мелодия начнётся заново.', 150, 740, 580, 22);
          break;
        }
        case 'bridges':
          this.text(g, `Над пропастью висят ${this.bridgeSetFor(room).list.length} мостов. Ты зажигаешь их справа, но холод силён: держаться могут только два моста сразу. Зажжёшь третий — погаснет самый первый.\n\nСледи за точкой Путника. Не погаси мост у него под ногами!` + (room.set ? '\n\nМосты здесь идут то вверх, то вниз — смотри внимательно.' : ''), 150, 250, 580, 26);
          break;
        case 'lifts':
          this.text(g, 'Два подъёмника — I и II. Их рычаги справа: тяни вверх, чтобы поднять, вниз — чтобы опустить.\n\nПутник встанет на подъёмник, а ты поднимешь его к выступу. Внизу — шипы, будь осторожен.\n\nСлушай: «выше!», «стоп!», «чуть ниже!»', 150, 250, 580, 26);
          break;
        case 'dark':
          this.text(g, room.set
            ? 'Чаща ещё темнее тропы. Ямы, колючки на уступе и куст, который ползает туда-сюда по земле.\n\nВеди светлячка по карте справа. Скажи, когда куст отползёт!'
            : 'В саду погасли все огни. Путник видит лишь шаг перед собой.\n\nСправа — карта тропы: красным отмечены колючки и ямы. Веди пальцем светлячка — он осветит Путнику путь.\n\nГовори: «прыгай!», «стой!», «левее!»', 150, 250, 580, 26);
          break;
        case 'heart':
          this.text(g, 'Вот и сердце сада. Здесь нужны оба ключа сразу.\n\nКогда Путник встанет на алтарь — прижми сердце справа и держи. Три удара сердца — и сад проснётся.', 150, 250, 580, 26);
          drawGlyph(g, 'key', 380, 650, 70, '#6a4020', 3); drawGlyph(g, 'key', 520, 650, 70, '#6a4020', 3);
          break;
      }
    }
    bridgeSetFor(room) { return BRIDGE_SETS[room.set || 0]; }
    plateTable(g, doors, map, x0, x1, y0, step, compact) {
      doors.forEach((d, i) => {
        const y = y0 + i * step;
        if (i % 2) { g.fillStyle = 'rgba(120,80,40,0.08)'; g.fillRect(x0, y - step / 2, x1 - x0, step); }
        const s = compact ? 34 : 44;
        drawGlyph(g, d, x0 + (x1 - x0) * 0.18, y, s, '#3b2414', compact ? 2.4 : 3);
        g.font = '26px Comfortaa'; g.textAlign = 'center'; g.fillStyle = '#6a4020'; g.fillText('→', (x0 + x1) / 2, y + 9);
        g.fillStyle = 'rgba(160,110,40,0.15)'; g.beginPath(); g.arc(x0 + (x1 - x0) * 0.82, y, s * 0.62, 0, TAU); g.fill();
        drawGlyph(g, map[d], x0 + (x1 - x0) * 0.82, y, s * 0.9, '#8a3a1a', compact ? 2.4 : 3);
      });
      if (!compact) { g.font = "22px 'Marck Script', cursive"; g.fillStyle = '#6a4020'; g.textAlign = 'center'; g.fillText('знак двери              плита', (x0 + x1) / 2, y0 + doors.length * step - 4); }
    }

    drawBellIcon(g, x, y, shape) {
      g.save(); g.translate(x, y - 30); g.scale(0.45, 0.45);
      g.strokeStyle = '#3b2414'; g.lineWidth = 5; bellPath(g, shape); g.stroke();
      g.restore();
    }

    drawMechanism(g, t) {
      const R = this.R, room = ROOMS[R.room], kind = room.kind, cx = 1150;
      g.textAlign = 'center';
      const status = (s) => { g.font = '600 17px Comfortaa'; g.fillStyle = '#6a4020'; g.textAlign = 'center'; g.fillText(s, cx, 800); };
      if (R.open && !R.done && kind !== 'heart') {
        this.title(g, 'Дверь открыта!', cx, 400);
        g.font = "28px 'Marck Script', cursive"; g.fillStyle = '#3b2414'; g.fillText('Скажи Путнику: «иди вперёд, в дверь»', cx, 470);
        drawGlyph(g, 'key', cx, 580, 80, '#8a5a20', 4);
        return;
      }
      switch (kind) {
        case 'plates': case 'bells': case 'stars': {
          this.title(g, kind === 'bells' ? 'Ноты' : 'Шаги', cx, 170);
          const n = kind === 'bells' ? this.P.sequence.length : this.P.want.length;
          for (let i = 0; i < n; i++) { const x = cx - (n - 1) * 40 + i * 80; g.strokeStyle = '#3b2414'; g.lineWidth = 3; g.beginPath(); g.arc(x, 300, 24, 0, TAU); g.stroke(); if (i < R.prog) { g.fillStyle = '#c9862a'; g.beginPath(); g.arc(x, 300, 16, 0, TAU); g.fill(); } }
          g.font = "28px 'Marck Script', cursive"; g.fillStyle = '#3b2414';
          const tip = { plates: room.hard ? 'Спроси: какой знак над дверью и какого цвета пламя факелов?' : 'Спроси Путника, какой знак горит над дверью. Найди его в таблице слева.', bells: 'Спроси Путника, какого цвета кристалл над дверью и где какой колокол висит.', stars: 'Пусть Путник опишет созвездие в окне: сколько звёзд, какая форма, где самая яркая.' }[kind];
          wrapText(g, tip, cx, 420, 560, 34);
          g.font = '600 15px Comfortaa'; g.fillStyle = '#6a4020'; g.fillText(`${this.ctx.peer.name} где-то в руинах…`, cx, 760);
          break;
        }
        case 'rings': {
          g.font = '600 16px Comfortaa'; g.fillStyle = '#6a4020'; g.fillText('крути кольца пальцем', cx, 150);
          const radii = [200, 142, 86];
          for (let k = 0; k < 3; k++) {
            const r = radii[k], rot = -this.ringLocal[k] * (TAU / 8);
            g.fillStyle = ['#c9a87a', '#d8bb8c', '#e6cfa2'][k]; g.beginPath(); g.arc(cx, 470, r + 28, 0, TAU); g.fill();
            g.strokeStyle = '#6a4020'; g.lineWidth = 2; g.stroke();
            for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * (TAU / 8) + rot; drawGlyph(g, this.P.rings[k][i], cx + Math.cos(a) * r, 470 + Math.sin(a) * r, k === 2 ? 34 : 40, '#3b2414', 2.6); }
          }
          g.fillStyle = '#e8d7b0'; g.beginPath(); g.arc(cx, 470, 50, 0, TAU); g.fill();
          drawGlyph(g, 'key', cx, 470, 50, '#8a5a20', 3);
          g.fillStyle = '#c9862a'; g.beginPath(); g.moveTo(cx - 16, 220); g.lineTo(cx + 16, 220); g.lineTo(cx, 248); g.closePath(); g.fill();
          if (room.hard) { g.strokeStyle = 'rgba(138,58,26,0.6)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, 470, 236, -Math.PI / 2 + 0.15, -Math.PI / 2 + 0.6); g.stroke(); g.fillStyle = 'rgba(138,58,26,0.6)'; g.font = '600 13px Comfortaa'; g.fillText('по часовой →', cx + 150, 232); }
          status('метка — сверху ▼');
          break;
        }
        case 'bridges': {
          this.title(g, 'Карта мостов', cx, 170);
          this.drawMapFrame(g);
          const B = this.bridgeSet(), m = (x, y) => this.mapPt(x, y);
          g.fillStyle = '#7a5a3a';
          const a = m(0, FLOOR), b = m(B.startW, FLOOR); g.fillRect(a.x, a.y, b.x - a.x, 8);
          const c = m(B.end.x, B.end.y), d = m(W, B.end.y); g.fillRect(c.x, c.y, d.x - c.x, 8);
          g.fillStyle = '#8a3a2a'; const s0 = m(B.startW, 870), s1 = m(B.end.x, 870); for (let x = s0.x; x < s1.x; x += 10) { g.beginPath(); g.moveTo(x, s0.y + 8); g.lineTo(x + 5, s0.y - 4); g.lineTo(x + 10, s0.y + 8); g.fill(); }
          B.list.forEach((br, i) => {
            const p = m(br.x, br.y), q = m(br.x + br.w, br.y), on = R.bridges[i];
            g.fillStyle = on ? '#6fb8e8' : 'rgba(59,36,20,0.18)'; roundRect(g, p.x, p.y - 6, q.x - p.x, 14, 6); g.fill();
            if (on) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, (p.x + q.x) / 2, p.y, 50, '#9fdcff', 0.6); g.globalCompositeOperation = 'source-over'; }
            g.fillStyle = on ? '#2a6a9a' : '#6a4020'; g.font = '700 16px Comfortaa'; g.fillText(i + 1, (p.x + q.x) / 2, p.y - 14);
          });
          const door = m(1480, B.end.y - 80); g.fillStyle = '#3b2414'; g.fillRect(door.x - 6, door.y - 12, 14, 24);
          this.dotExplorer(g, t);
          status('нажимай на мосты · горят максимум два');
          break;
        }
        case 'lifts': {
          this.title(g, 'Подъёмники', cx - 40, 170);
          this.drawMapFrame(g);
          const m = (x, y) => this.mapPt(x, y);
          g.fillStyle = '#7a5a3a';
          for (const s of [{ x: 0, y: FLOOR, w: 520, h: 120 }, { x: 700, y: 420, w: 260, h: 480 }, { x: 1140, y: 220, w: 460, h: 680 }]) { const a = m(s.x, s.y), b = m(s.x + s.w, Math.min(H, s.y + s.h)); g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); }
          g.fillStyle = '#8a3a2a'; for (const z of this.hazards()) { const a = m(z.x, z.y), b = m(z.x + z.w, z.y + z.h); g.fillRect(a.x, a.y, b.x - a.x, Math.max(5, b.y - a.y)); }
          LIFTS.forEach((L, i) => { const a = m(L.x, this.liftY(i)), b = m(L.x + L.w, this.liftY(i)); g.fillStyle = '#c9862a'; g.fillRect(a.x, a.y - 3, b.x - a.x, 8); g.font = '700 14px Comfortaa'; g.fillStyle = '#6a4020'; g.fillText(i ? 'II' : 'I', (a.x + b.x) / 2, a.y + 22); });
          const door = m(1480, 140); g.fillStyle = '#3b2414'; g.fillRect(door.x - 5, door.y - 10, 12, 22);
          this.dotExplorer(g, t);
          // рычаги
          const vals = this.liftDrag >= 0 && this.liftLocal ? this.liftLocal : R.lifts;
          for (let i = 0; i < 2; i++) {
            const x = 1375 + i * 65;
            g.fillStyle = 'rgba(59,36,20,0.15)'; roundRect(g, x - 10, 250, 20, 346, 10); g.fill();
            const y = 260 + (1 - vals[i]) * 326;
            g.fillStyle = '#c9862a'; roundRect(g, x - 26, y - 16, 52, 32, 10); g.fill();
            g.strokeStyle = '#6a4020'; g.lineWidth = 2; g.stroke();
            g.fillStyle = '#fff6dc'; g.font = '700 15px Comfortaa'; g.fillText(i ? 'II' : 'I', x, y + 6);
          }
          status('тяни рычаги вверх и вниз');
          break;
        }
        case 'dark': {
          this.title(g, 'Тропа', cx, 170);
          this.drawMapFrame(g);
          const m = (x, y) => this.mapPt(x, y), D = this.darkSet();
          g.fillStyle = '#7a5a3a';
          for (const s of D.solids) { const a = m(s.x, s.y), b = m(s.x + s.w, s.y + Math.min(s.h, 40)); g.fillRect(a.x, a.y, b.x - a.x, Math.max(6, b.y - a.y)); }
          g.fillStyle = 'rgba(200,40,60,0.7)';
          for (const z of this.hazards()) { const a = m(z.x, z.y), b = m(z.x + z.w, z.y + z.h); g.fillRect(a.x, a.y, b.x - a.x, Math.max(6, b.y - a.y)); }
          const door = m(1480, FLOOR - 80); g.fillStyle = '#3b2414'; g.fillRect(door.x - 6, door.y - 12, 14, 24);
          const f = m(this.ff.x, this.ff.y);
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, f.x, f.y, 60, '#e8ff9a', 0.9); g.globalCompositeOperation = 'source-over';
          g.strokeStyle = 'rgba(120,140,40,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(f.x, f.y, (240 / W) * 580, 0, TAU); g.stroke();
          this.dotExplorer(g, t);
          status('веди светлячка пальцем по карте');
          break;
        }
        case 'heart': {
          const hold = R.hold / 3, pressed = this.heartDown;
          const s = 1 + (pressed ? 0.06 + Math.sin(t * 8) * 0.04 : Math.sin(t * 2) * 0.03);
          g.save(); g.translate(cx, 470); g.scale(s * 1.4, s * 1.4);
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, 160, '#ff7eb6', pressed ? 0.7 : 0.3); g.globalCompositeOperation = 'source-over';
          const hg = g.createLinearGradient(0, -80, 0, 80); hg.addColorStop(0, '#ff9cc4'); hg.addColorStop(1, '#c2305e');
          g.fillStyle = hg; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-110, 0, -70, -90, 0, -40); g.bezierCurveTo(70, -90, 110, 0, 0, 70); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-35, -30, 18, 10, -0.6, 0, TAU); g.fill();
          g.restore();
          if (hold > 0) { g.strokeStyle = '#c2305e'; g.lineWidth = 8; g.beginPath(); g.arc(cx, 470, 175, -Math.PI / 2, -Math.PI / 2 + hold * TAU); g.stroke(); }
          g.font = "30px 'Marck Script', cursive"; g.fillStyle = '#3b2414';
          g.fillText(R.done ? 'Сад проснулся ✦' : R.altar ? (pressed ? 'держи…' : 'Путник на алтаре! Прижми сердце') : 'жди, пока Путник встанет на алтарь', cx, 730);
          break;
        }
      }
    }
    drawMapFrame(g) { g.strokeStyle = 'rgba(59,36,20,0.4)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeRect(855, 255, this.mapW() + 10, 336); g.setLineDash([]); }
    dotExplorer(g, t) {
      const p = this.mapPt(this.rp.x, this.rp.y - 30);
      g.fillStyle = '#1f6a8a'; g.beginPath(); g.arc(p.x, p.y, 9, 0, TAU); g.fill();
      g.strokeStyle = `rgba(31,106,138,${0.5 + Math.sin(t * 5) * 0.4})`; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 16, 0, TAU); g.stroke();
    }

    resync() { if (this.R) this.ctx.send({ a: 'R', R: this.R }); }
    destroy() { this.st.destroy(); this.keys.destroy(); this.pad && this.pad.destroy(); }
  }

  function bellPath(g, shape) {
    g.beginPath();
    if (shape === 'round') { g.arc(0, 50, 46, Math.PI, 0); g.lineTo(52, 80); g.lineTo(-52, 80); }
    else if (shape === 'tall') { g.moveTo(-22, 0); g.lineTo(22, 0); g.lineTo(30, 100); g.lineTo(44, 120); g.lineTo(-44, 120); g.lineTo(-30, 100); }
    else if (shape === 'crown') { g.moveTo(-34, 0); g.lineTo(-20, 18); g.lineTo(0, 0); g.lineTo(20, 18); g.lineTo(34, 0); g.lineTo(46, 80); g.lineTo(-46, 80); }
    else { g.moveTo(0, -4); for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI, r = k % 2 ? 30 : 46; g.lineTo(Math.cos(a) * r, 46 + Math.sin(a) * r); } g.lineTo(50, 86); g.lineTo(-50, 86); }
    g.closePath();
  }
})();
