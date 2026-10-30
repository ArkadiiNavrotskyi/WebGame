'use strict';
// «Хроники трёх королевств» — карточная дуэль на трёх линиях. Солнце, Луна и Лес.
(() => {
  const W = 1600, H = 900;
  const LANES = [640, 860, 1080];
  const SLOT = { w: 150, h: 196 };
  const MY_Y = 548, EN_Y = 262;
  const CASTLE = { me: { x: 250, y: 650 }, en: { x: 250, y: 200 } };
  const MAX_HP = 25;

  // kw: shield щит, rush рывок, archer стрелок, fury ярость, vamp вампир, thorns шипы
  const CARDS = {
    squire: { n: 'Оруженосец', c: 1, t: 'u', a: 2, h: 1, art: '🗡️', d: '' },
    archer: { n: 'Солнечный лучник', c: 2, t: 'u', a: 1, h: 2, kw: ['archer'], art: '🏹', d: 'Стреляет прямо в замок' },
    fox: { n: 'Огненный лис', c: 2, t: 'u', a: 3, h: 1, kw: ['rush'], art: '🦊', d: 'Атакует сразу' },
    knight: { n: 'Рыцарь рассвета', c: 3, t: 'u', a: 3, h: 3, kw: ['shield'], art: '🛡️', d: 'Первый урон — мимо' },
    griffin: { n: 'Грифон', c: 4, t: 'u', a: 2, h: 3, kw: ['rush', 'fury'], art: '🦅', d: 'Атакует сразу и дважды' },
    paladin: { n: 'Паладин', c: 5, t: 'u', a: 4, h: 5, kw: ['shield'], art: '⚜️', d: 'Первый урон — мимо' },
    phoenix: { n: 'Феникс', c: 6, t: 'u', a: 5, h: 4, kw: ['rush', 'vamp'], art: '🔥', d: 'Атакует сразу, лечит замок' },
    sundragon: { n: 'Солнечный дракон', c: 7, t: 'u', a: 6, h: 6, kw: ['fury'], art: '🐉', d: 'Атакует дважды' },
    fireball: { n: 'Огненный шар', c: 2, t: 's', tg: 'enemyAny', art: '☄️', d: '3 урона юниту или замку' },
    warcry: { n: 'Боевой клич', c: 1, t: 's', tg: 'none', art: '📯', d: 'Все твои юниты: +1 атаки' },
    bless: { n: 'Благословение', c: 2, t: 's', tg: 'allyUnit', art: '✨', d: 'Юниту +2/+2' },
    owl: { n: 'Совёнок', c: 1, t: 'u', a: 1, h: 2, art: '🦉', d: '' },
    shade: { n: 'Лунная тень', c: 2, t: 'u', a: 2, h: 2, kw: ['vamp'], art: '👤', d: 'Лечит замок уроном' },
    hedgehog: { n: 'Колючий ёж', c: 2, t: 'u', a: 1, h: 4, kw: ['thorns'], art: '🦔', d: 'Шипы: ударившему −2' },
    witch: { n: 'Ночная ведьма', c: 3, t: 'u', a: 2, h: 3, bc: 'hex', art: '🧙', d: 'При выходе: 2 урона врагу на линии' },
    ghostwolf: { n: 'Волк-призрак', c: 4, t: 'u', a: 4, h: 3, kw: ['rush'], art: '🐺', d: 'Атакует сразу' },
    starkeeper: { n: 'Хранитель звёзд', c: 5, t: 'u', a: 3, h: 7, kw: ['thorns'], art: '🌟', d: 'Шипы: ударившему −2' },
    whale: { n: 'Лунный кит', c: 7, t: 'u', a: 5, h: 9, kw: ['vamp'], art: '🐋', d: 'Лечит замок уроном' },
    sleep: { n: 'Сон', c: 2, t: 's', tg: 'enemyUnit', art: '💤', d: 'Враг пропускает атаку' },
    moonlight: { n: 'Лунный свет', c: 3, t: 's', tg: 'none', art: '🌙', d: 'Замку +6' },
    eclipse: { n: 'Затмение', c: 5, t: 's', tg: 'enemyUnit', art: '🌑', d: 'Уничтожить юнита' },
    starfall: { n: 'Звездопад', c: 4, t: 's', tg: 'none', art: '🌠', d: '2 урона всем врагам' },
    mirror: { n: 'Отражение', c: 1, t: 's', tg: 'none', art: '🪞', d: 'Взять 2 карты' },
    herald: { n: 'Глашатай', c: 3, t: 'u', a: 2, h: 3, bc: 'rally', art: '📣', d: 'При выходе: союзникам +1 атаки' },
    bat: { n: 'Ночная мышь', c: 2, t: 'u', a: 2, h: 1, kw: ['rush', 'vamp'], art: '🦇', d: 'Атакует сразу, лечит замок' },
    sprout: { n: 'Росток', c: 1, t: 'u', a: 1, h: 2, kw: ['grow'], art: '🌱', d: 'Растёт: +1/+1 каждый ход' },
    elf: { n: 'Лесная лучница', c: 2, t: 'u', a: 2, h: 1, kw: ['archer'], art: '🧝', d: 'Стреляет прямо в замок' },
    deer: { n: 'Олень', c: 3, t: 'u', a: 3, h: 2, kw: ['rush'], art: '🦌', d: 'Атакует сразу' },
    dryad: { n: 'Дриада', c: 3, t: 'u', a: 2, h: 3, bc: 'heal3', art: '🧚', d: 'При выходе: замку +3' },
    boar: { n: 'Вепрь', c: 3, t: 'u', a: 3, h: 3, kw: ['thorns'], art: '🐗', d: 'Шипы: ударившему −2' },
    bear: { n: 'Медведь', c: 4, t: 'u', a: 4, h: 5, art: '🐻', d: '' },
    ent: { n: 'Древень', c: 6, t: 'u', a: 3, h: 8, kw: ['grow', 'thorns'], art: '🌳', d: 'Растёт и колется' },
    roots: { n: 'Корни', c: 2, t: 's', tg: 'enemyUnit', art: '🌿', d: '1 урон и враг спит ход' },
    bloom: { n: 'Цветение', c: 3, t: 's', tg: 'none', art: '🌸', d: 'Все твои юниты: +1/+1' },
    rain: { n: 'Тёплый дождь', c: 2, t: 's', tg: 'none', art: '🌧️', d: 'Замку +3, взять карту' },
    wild: { n: 'Зов леса', c: 5, t: 's', tg: 'none', art: '🍃', d: 'Росток в каждую пустую линию' },
  };
  const DECKS = {
    sun: { squire: 2, archer: 2, fox: 3, knight: 2, griffin: 2, paladin: 2, phoenix: 1, sundragon: 1, fireball: 2, warcry: 1, bless: 1, herald: 1 },
    moon: { owl: 2, shade: 2, hedgehog: 2, witch: 2, ghostwolf: 2, starkeeper: 2, whale: 1, sleep: 2, moonlight: 1, eclipse: 1, starfall: 1, mirror: 1, bat: 1 },
    forest: { sprout: 3, elf: 2, deer: 2, dryad: 2, boar: 2, bear: 2, ent: 1, roots: 2, bloom: 1, rain: 2, wild: 1 },
  };
  const FAC = {
    sun: { name: 'Солнце', c1: '#c86a32', c2: '#5a2416', edge: '#ffd27a', glow: '#ffb35c', icon: 'sun' },
    moon: { name: 'Луна', c1: '#3b3d93', c2: '#151640', edge: '#c9d4ff', glow: '#8fa8ff', icon: 'moon' },
    forest: { name: 'Лес', c1: '#2f7a4a', c2: '#10301f', edge: '#c4f5c8', glow: '#7be08a', icon: 'tree' },
  };
  // силы героев: раз в ход за 2 маны
  const POWERS = {
    sun: { n: 'Искра', d: '1 урон любой цели', tg: 'enemyAny', icon: '✴️' },
    moon: { n: 'Лунный бальзам', d: 'Замку +3', tg: 'none', icon: '🌙' },
    forest: { n: 'Семечко', d: 'Росток в свою пустую линию', tg: 'lane', icon: '🌱' },
  };
  const POWER_COST = 2;
  const KW_NAMES = { shield: 'Щит', rush: 'Рывок', archer: 'Стрелок', fury: 'Ярость', vamp: 'Вампир', thorns: 'Шипы', grow: 'Рост' };
  const has = (u, k) => (CARDS[u.cid].kw || []).includes(k);

  GAMES.cards = {
    id: 'cards', title: 'Хроники', icon: '🃏', color: '#ffc35c',
    tagline: 'Дуэль королевств: Солнце, Луна и Лес',
    roles: null, landscape: true,
    rules: [
      'У каждого замок с 25 ❤. Разрушь замок соперника!',
      'Каждый ход растёт мана 💧 (до 8). Ставь юнитов на 3 линии и применяй заклинания.',
      'В конце твоего хода юниты бьют врага на своей линии — а если линия пуста, бьют прямо в замок.',
      'Новые юниты атакуют со следующего хода (кроме «Рывка»). Солнце — напор, Луна — хитрость, Лес — рост.',
      'Раз в ход можно использовать <b>силу героя</b> за 2 💧. Кончилась колода — замок слабеет.',
    ],
    info() { const s = Store.get('cards_score', { w: 0, l: 0 }); return s.w + s.l ? `счёт ${s.w} : ${s.l}` : 'карточная дуэль'; },
    create(ctx) { return new Cards(ctx); },
  };

  class Cards {
    constructor(ctx) {
      this.ctx = ctx;
      this.me = ctx.isHost ? 'h' : 'g'; this.op = ctx.isHost ? 'g' : 'h';
      this.st = new Stage(ctx.canvas, W, H);
      this.parts = new Particles();
      this.fx = []; this.floats = []; this.shakes = {}; this.banner = null;
      this.sel = null; this.hover = null; this.lockUntil = 0; this.t = 0;
      this.facPick = { h: null, g: null };
      this.handAnim = {};
      this.bgStars = Array.from({ length: 90 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.8), ph: rand(0, TAU) }));
      this.buildUI();
      this.bindInput();
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ================= ХОСТ: правила =================
    startMatch() {
      const mk = (fac) => {
        const deck = [];
        for (const [cid, n] of Object.entries(DECKS[fac])) for (let i = 0; i < n; i++) deck.push(cid);
        RNG(Math.random() * 1e9).shuffle(deck);
        return { hp: MAX_HP, mana: 0, max: 0, turns: 0, fac, deck, hand: [], board: [null, null, null] };
      };
      this.uid = 1;
      const G = this.G = { P: { h: mk(this.facPick.h), g: mk(this.facPick.g) }, turn: Math.random() < 0.5 ? 'h' : 'g', winner: null, n: 0 };
      this.ev = [];
      for (let i = 0; i < 4; i++) { this.draw('h', true); this.draw('g', true); }
      this.draw(G.turn === 'h' ? 'g' : 'h', true);
      this.beginTurn(G.turn);
      this.push();
    }
    push() { const m = { a: 'st', G: JSON.parse(JSON.stringify(this.G)), fx: this.ev }; this.ev = []; this.ctx.send(m); this.applyState(m.G, m.fx); }
    e(o) { o.d = this.evT; this.ev.push(o); }
    draw(side, silent) {
      const p = this.G.P[side];
      if (!p.deck.length) { p.fatigue = (p.fatigue || 0) + 1; p.hp -= p.fatigue; this.e({ t: 'dmg', side, lane: -1, n: p.fatigue }); this.e({ t: 'fatigue', side }); return; }
      const cid = p.deck.pop();
      if (p.hand.length >= 8) { if (!silent) this.e({ t: 'burn', side, cid }); return; }
      p.hand.push({ uid: this.uid++, cid });
    }
    beginTurn(side) {
      const G = this.G, p = G.P[side];
      G.turn = side; G.n++;
      p.turns++; p.max = Math.min(8, p.turns); p.mana = p.max; p.powerUsed = false;
      this.evT = 0;
      this.draw(side);
      this.e({ t: 'turn', side });
    }
    dmg(side, lane, n, src) {
      // lane === -1 → замок
      const p = this.G.P[side];
      if (lane === -1) {
        p.hp -= n;
        this.e({ t: 'dmg', side, lane, n });
        if (src && has(src.u, 'vamp')) this.heal(src.side, n);
        return;
      }
      const u = p.board[lane]; if (!u) return;
      if (u.shield) { u.shield = false; this.e({ t: 'shield', side, lane }); return; }
      u.hp -= n;
      this.e({ t: 'dmg', side, lane, n });
      if (src && has(src.u, 'vamp')) this.heal(src.side, n);
      if (src && has(u, 'thorns') && src.lane != null) { this.evT += 0.15; this.dmg(src.side, src.lane, 2); }
      if (u.hp <= 0) { p.board[lane] = null; this.e({ t: 'die', side, lane, cid: u.cid }); }
    }
    mkUnit(cid, uid) { const C = CARDS[cid]; return { uid: uid || this.uid++, cid, atk: C.a, hp: C.h, max: C.h, shield: (C.kw || []).includes('shield'), fresh: true, sleep: 0 }; }
    heal(side, n) { const p = this.G.P[side]; p.hp = Math.min(30, p.hp + n); this.e({ t: 'heal', side, n }); }
    check() {
      const G = this.G;
      if (G.P.h.hp <= 0 || G.P.g.hp <= 0) G.winner = G.P.h.hp <= 0 && G.P.g.hp <= 0 ? 'draw' : G.P.h.hp <= 0 ? 'g' : 'h';
      return !!G.winner;
    }
    act(side, m) {
      const G = this.G; if (!G || G.winner || G.turn !== side) return;
      const p = G.P[side], os = side === 'h' ? 'g' : 'h', o = G.P[os];
      this.evT = 0;
      if (m.a === 'play') {
        const hi = p.hand.findIndex((c) => c.uid === m.uid); if (hi < 0) return;
        const cid = p.hand[hi].cid, C = CARDS[cid];
        if (C.c > p.mana) return;
        if (C.t === 'u') {
          if (m.lane == null || p.board[m.lane]) return;
          p.hand.splice(hi, 1); p.mana -= C.c;
          const u = this.mkUnit(cid, m.uid);
          p.board[m.lane] = u;
          this.e({ t: 'play', side, lane: m.lane, cid });
          if (C.bc === 'rally') p.board.forEach((x, l) => { if (x && l !== m.lane) { x.atk += 1; this.e({ t: 'buff', side, lane: l }); } });
          if (C.bc === 'heal3') { this.evT += 0.3; this.heal(side, 3); }
          if (C.bc === 'hex' && o.board[m.lane]) { this.evT += 0.35; this.e({ t: 'bolt', from: [side, m.lane], to: [os, m.lane], color: '#c58bff' }); this.evT += 0.3; this.dmg(os, m.lane, 2); }
        } else {
          const tg = C.tg, T = m.target;
          const okUnit = (s, l) => T && T.side === s && T.lane >= 0 && G.P[s].board[T.lane];
          if (tg === 'enemyAny' && !(T && T.side === os && (T.lane === -1 || o.board[T.lane]))) return;
          if (tg === 'enemyUnit' && !okUnit(os)) return;
          if (tg === 'allyUnit' && !okUnit(side)) return;
          p.hand.splice(hi, 1); p.mana -= C.c;
          this.e({ t: 'spell', side, cid, target: T || null });
          this.evT += 0.45;
          switch (cid) {
            case 'fireball': this.dmg(os, T.lane, 3); break;
            case 'warcry': p.board.forEach((u, l) => { if (u) { u.atk += 1; this.e({ t: 'buff', side, lane: l }); } }); break;
            case 'bless': { const u = p.board[T.lane]; u.atk += 2; u.hp += 2; u.max += 2; this.e({ t: 'buff', side, lane: T.lane }); break; }
            case 'sleep': { o.board[T.lane].sleep = 1; this.e({ t: 'sleep', side: os, lane: T.lane }); break; }
            case 'moonlight': this.heal(side, 6); break;
            case 'eclipse': { const u = o.board[T.lane]; o.board[T.lane] = null; this.e({ t: 'die', side: os, lane: T.lane, cid: u.cid }); break; }
            case 'starfall': o.board.forEach((u, l) => { if (u) this.dmg(os, l, 2); }); break;
            case 'mirror': this.draw(side); this.draw(side); break;
            case 'roots': { const u = o.board[T.lane]; u.sleep = 1; this.e({ t: 'sleep', side: os, lane: T.lane }); this.dmg(os, T.lane, 1); break; }
            case 'bloom': p.board.forEach((u, l) => { if (u) { u.atk++; u.hp++; u.max++; this.e({ t: 'buff', side, lane: l }); } }); break;
            case 'rain': this.heal(side, 3); this.draw(side); break;
            case 'wild': p.board.forEach((u, l) => { if (!u) { p.board[l] = this.mkUnit('sprout'); this.e({ t: 'play', side, lane: l, cid: 'sprout' }); } }); break;
          }
        }
        this.check();
        this.push();
      } else if (m.a === 'power') {
        const pw = POWERS[p.fac], T = m.target;
        if (p.powerUsed || p.mana < POWER_COST) return;
        if (pw.tg === 'enemyAny' && !(T && T.side === os && (T.lane === -1 || o.board[T.lane]))) return;
        if (pw.tg === 'lane' && !(T && T.side === side && T.lane >= 0 && !p.board[T.lane])) return;
        p.powerUsed = true; p.mana -= POWER_COST;
        this.e({ t: 'power', side, fac: p.fac });
        this.evT += 0.35;
        if (p.fac === 'sun') this.dmg(os, T.lane, 1);
        if (p.fac === 'moon') this.heal(side, 3);
        if (p.fac === 'forest') { p.board[T.lane] = this.mkUnit('sprout'); this.e({ t: 'play', side, lane: T.lane, cid: 'sprout' }); }
        this.check();
        this.push();
      } else if (m.a === 'end') {
        // битва
        for (let l = 0; l < 3; l++) {
          const u = p.board[l]; if (!u) continue;
          if (u.sleep > 0) { u.sleep--; this.e({ t: 'zzz', side, lane: l }); this.evT += 0.3; continue; }
          if ((u.fresh && !has(u, 'rush')) || u.atk <= 0) continue;
          const hits = has(u, 'fury') ? 2 : 1;
          for (let k = 0; k < hits; k++) {
            if (!p.board[l]) break;
            const target = has(u, 'archer') || !o.board[l] ? -1 : l;
            this.e({ t: 'atk', side, lane: l, tside: os, tlane: target });
            this.evT += 0.32;
            this.dmg(os, target, u.atk, { side, lane: l, u });
            this.evT += 0.25;
            if (this.check()) break;
          }
          if (G.winner) break;
        }
        p.board.forEach((u, l) => { if (!u) return; u.fresh = false; if (has(u, 'grow') && !G.winner) { u.atk++; u.hp++; u.max++; this.e({ t: 'buff', side, lane: l }); } });
        if (!this.check()) { const saved = this.evT; this.beginTurn(os); this.ev[this.ev.length - 1].d = saved + 0.2; }
        this.push();
      }
    }

    // ================= Сообщения =================
    onMsg(d) {
      switch (d.a) {
        case 'fac': this.facPick[d.side] = d.fac; this.updateFacUI(); if (this.ctx.isHost) this.maybeStart(); break;
        case 'act': if (this.ctx.isHost) this.act('g', d.m); break;
        case 'st': this.applyState(d.G, d.fx); break;
        case 'again': if (this.ctx.isHost) this.rematch(); break;
        case 'rematch': this.resetLocal(); break;
      }
    }
    send(m) { if (this.ctx.isHost) this.act('h', m); else this.ctx.send({ a: 'act', m }); }
    maybeStart() { if (this.facPick.h && this.facPick.g && !this.G) this.startMatch(); }
    rematch() { this.ctx.send({ a: 'rematch' }); this.resetLocal(); }
    resetLocal() { this.G = null; this.view = null; this.facPick = { h: null, g: null }; this.recorded = false; this.sel = null; $('#cdEnd', this.el)?.remove(); this.showFacUI(); }

    applyState(G, fx) {
      if (!this.view) { this.view = G; $('#cdFac', this.el)?.remove(); }
      this.pendingG = G;
      
      let maxD = 0;
      const now = this.t;
      for (const f of fx || []) { maxD = Math.max(maxD, f.d || 0); this.fx.push({ ...f, at: now + (f.d || 0), done: false }); }
      this.lockUntil = now + maxD + 0.35;
      this.swapAt = now + maxD + 0.3;
      this.sel = null;
    }

    // ================= Анимации событий =================
    runFx(f) {
      const pos = (side, lane) => this.slotPos(side, lane);
      switch (f.t) {
        case 'turn': {
          const mine = f.side === this.me;
          this.banner = { text: mine ? 'Твой ход' : `Ход: ${this.ctx.peer.name}`, t: 0, mine };
          SFX.play(mine ? 'chime' : 'card');
          break;
        }
        case 'play': { const p = pos(f.side, f.lane); SFX.play('card'); this.parts.emit(p.x, p.y, { n: 26, speed: 200, life: 0.8, size: 10, color: [FAC[this.facOf(f.side)].glow, '#fff'] }); this.shakes[`${f.side}${f.lane}`] = 0.25; break; }
        case 'spell': { SFX.play('magic'); const tp = f.target ? pos(f.target.side, f.target.lane) : (f.side === this.me ? { x: 860, y: 700 } : { x: 860, y: 140 }); this.parts.emit(tp.x, tp.y, { n: 40, speed: 240, life: 1, size: 12, color: [FAC[this.facOf(f.side)].glow, '#fff', '#ffe7a6'] }); this.floats.push({ x: 860, y: 420, text: `${CARDS[f.cid].art} ${CARDS[f.cid].n}`, t: 0, color: '#fff', big: true }); break; }
        case 'atk': { const a = pos(f.side, f.lane), b = pos(f.tside, f.tlane); this.bolts = this.bolts || []; this.bolts.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, color: FAC[this.facOf(f.side)].glow }); SFX.play('whoosh'); this.shakes[`${f.side}${f.lane}`] = 0.15; break; }
        case 'bolt': { const a = pos(f.from[0], f.from[1]), b = pos(f.to[0], f.to[1]); (this.bolts ||= []).push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, color: f.color }); break; }
        case 'dmg': { const p = pos(f.side, f.lane); SFX.play('hit'); this.floats.push({ x: p.x, y: p.y - 20, text: `−${f.n}`, t: 0, color: '#ff7b7b' }); this.parts.emit(p.x, p.y, { n: 18, speed: 220, life: 0.6, size: 8, color: ['#ff9c6b', '#ffd27a'] }); this.shakes[`${f.side}${f.lane}`] = 0.4; if (f.lane === -1) this.parts.emit(p.x, p.y + 40, { n: 14, speed: 160, life: 1, size: 6, color: '#8a7a6a', glow: false, gravity: 400 }); break; }
        case 'heal': { const p = pos(f.side, -1); SFX.play('chime'); this.floats.push({ x: p.x, y: p.y - 20, text: `+${f.n}`, t: 0, color: '#7dffb5' }); this.parts.emit(p.x, p.y, { n: 16, speed: 90, life: 1, size: 8, color: '#7dffb5' }); break; }
        case 'shield': { const p = pos(f.side, f.lane); SFX.play('bell'); this.floats.push({ x: p.x, y: p.y - 20, text: 'щит!', t: 0, color: '#9fdcff' }); this.parts.emit(p.x, p.y, { n: 20, speed: 160, life: 0.6, size: 8, color: '#9fdcff' }); break; }
        case 'die': { const p = pos(f.side, f.lane); SFX.play('fail'); this.parts.emit(p.x, p.y, { n: 40, speed: 260, life: 1.1, size: 10, color: ['#ffffff', FAC[this.facOf(f.side)].glow, '#888'] }); break; }
        case 'buff': { const p = pos(f.side, f.lane); SFX.play('grow'); this.floats.push({ x: p.x, y: p.y - 30, text: '▲', t: 0, color: '#ffe7a6' }); break; }
        case 'sleep': case 'zzz': { const p = pos(f.side, f.lane); this.floats.push({ x: p.x, y: p.y - 30, text: 'zZz', t: 0, color: '#c9b8ff' }); break; }
        case 'burn': if (f.side === this.me) this.ctx.toast('Рука полна — карта сгорела 🔥'); break;
        case 'fatigue': if (f.side === this.me) this.ctx.toast('Колода пуста — замок слабеет 🍂'); break;
        case 'power': { const p = this.slotPos(f.side, -1); SFX.play('magic'); this.parts.emit(p.x, p.y - 60, { n: 36, speed: 220, life: 1, size: 11, color: [FAC[f.fac].glow, '#fff'] }); this.floats.push({ x: 860, y: 420, text: POWERS[f.fac].icon + ' ' + POWERS[f.fac].n, t: 0, color: '#fff', big: true }); break; }
      }
    }
    facOf(side) { const G = this.view || this.G; return G ? G.P[side].fac : 'sun'; }
    slotPos(side, lane) {
      const mine = side === this.me;
      if (lane === -1) return mine ? { x: CASTLE.me.x, y: CASTLE.me.y } : { x: CASTLE.en.x, y: CASTLE.en.y };
      return { x: LANES[lane], y: mine ? MY_Y : EN_Y };
    }

    // ================= Ввод =================
    handLayout() {
      const G = this.view; if (!G) return [];
      const hand = G.P[this.me].hand, n = hand.length;
      const cw = 132, ch = 184, gap = Math.min(cw + 10, 760 / Math.max(1, n));
      const x0 = 860 - ((n - 1) * gap) / 2;
      return hand.map((c, i) => {
        const sel = this.sel === c.uid, hov = this.hover === c.uid;
        const lift = sel ? 70 : hov ? 40 : 0;
        const a = (i - (n - 1) / 2) * 0.04;
        return { c, x: x0 + i * gap, y: H - 70 - lift + Math.abs(i - (n - 1) / 2) * 6, w: cw, h: ch, a: sel ? 0 : a };
      });
    }
    hitCard(p) { const L = this.handLayout(); for (let i = L.length - 1; i >= 0; i--) { const r = L[i]; if (Math.abs(p.x - r.x) < r.w / 2 && Math.abs(p.y - r.y) < r.h / 2) return r.c; } return null; }
    hitTarget(p) {
      for (const side of [this.me, this.op]) {
        for (let l = 0; l < 3; l++) { const s = this.slotPos(side, l); if (Math.abs(p.x - s.x) < SLOT.w / 2 && Math.abs(p.y - s.y) < SLOT.h / 2) return { side, lane: l }; }
        const c = this.slotPos(side, -1); if (dist(p.x, p.y, c.x, c.y) < 110) return { side, lane: -1 };
      }
      return null;
    }
    validTargets(cid) {
      const G = this.view, me = G.P[this.me], op = G.P[this.op], T = [];
      if (cid === 'power') {
        const tg = POWERS[me.fac].tg;
        if (tg === 'enemyAny') { T.push({ side: this.op, lane: -1 }); op.board.forEach((u, l) => u && T.push({ side: this.op, lane: l })); }
        if (tg === 'lane') me.board.forEach((u, l) => !u && T.push({ side: this.me, lane: l }));
        return T;
      }
      const C = CARDS[cid];
      if (C.t === 'u') { me.board.forEach((u, l) => !u && T.push({ side: this.me, lane: l })); return T; }
      if (C.tg === 'enemyAny') { T.push({ side: this.op, lane: -1 }); op.board.forEach((u, l) => u && T.push({ side: this.op, lane: l })); }
      if (C.tg === 'enemyUnit') op.board.forEach((u, l) => u && T.push({ side: this.op, lane: l }));
      if (C.tg === 'allyUnit') me.board.forEach((u, l) => u && T.push({ side: this.me, lane: l }));
      return T;
    }
    myTurn() { return this.view && this.view.turn === this.me && !this.view.winner && this.t >= this.lockUntil; }

    bindInput() {
      const c = this.ctx.canvas;
      c.addEventListener('pointermove', (e) => { const p = this.st.pt(e); const card = this.hitCard(p); this.hover = card ? card.uid : null; c.style.cursor = card || (this.sel && this.hitTarget(p)) ? 'pointer' : 'default'; });
      c.addEventListener('pointerdown', (e) => {
        if (!this.view) return;
        const p = this.st.pt(e);
        const card = this.hitCard(p);
        const G = this.view, me = G.P[this.me];
        if (card) {
          if (!this.myTurn()) { this.sel = this.sel === card.uid ? null : card.uid; return; }
          const C = CARDS[card.cid];
          if (this.sel === card.uid && C.t === 's' && C.tg === 'none' && C.c <= me.mana) { this.send({ a: 'play', uid: card.uid }); this.sel = null; return; }
          this.sel = this.sel === card.uid ? null : card.uid; SFX.play('click');
          if (this.sel && C.c > me.mana) this.ctx.toast('Не хватает маны 💧');
          return;
        }
        if (this.sel === 'power' && this.myTurn()) {
          const tgt = this.hitTarget(p);
          if (tgt && this.validTargets('power').some((v) => v.side === tgt.side && v.lane === tgt.lane)) this.send({ a: 'power', target: tgt });
          this.sel = null; return;
        }
        if (this.sel && this.myTurn()) {
          const tgt = this.hitTarget(p), cardObj = me.hand.find((c2) => c2.uid === this.sel);
          if (tgt && cardObj) {
            const C = CARDS[cardObj.cid];
            const ok = this.validTargets(cardObj.cid).some((v) => v.side === tgt.side && v.lane === tgt.lane);
            if (ok && C.c <= me.mana) {
              if (C.t === 'u') this.send({ a: 'play', uid: this.sel, lane: tgt.lane });
              else this.send({ a: 'play', uid: this.sel, target: tgt });
              this.sel = null; return;
            }
          }
        }
        // нажатие на юнита на поле — показать его карту крупно
        const tgt = this.hitTarget(p);
        if (!this.sel && tgt && tgt.lane >= 0) { const u = G.P[tgt.side].board[tgt.lane]; if (u) { this.inspect = { cid: u.cid, unit: u, fac: G.P[tgt.side].fac, t: this.t }; SFX.play('click'); } }
        else this.inspect = null;
        this.sel = null;
      });
    }

    // ================= Интерфейс =================
    buildUI() {
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div style="position:absolute;right:20px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;align-items:center">
          <button class="btn" id="cdEndTurn" style="width:150px;padding:18px 10px;font-size:16px">Конец хода ⚔</button>
          <button class="btn ghost" id="cdPower" style="display:block;width:150px;padding:10px;font-size:13px;line-height:1.35;text-align:center"></button>
        </div></div>`);
      this.ctx.ui.appendChild(this.el);
      $('#cdEndTurn', this.el).onclick = () => { if (this.myTurn()) { SFX.play('click'); this.send({ a: 'end' }); } };
      $('#cdPower', this.el).onclick = () => {
        if (!this.myTurn()) return;
        const me = this.view.P[this.me], pw = POWERS[me.fac];
        if (me.powerUsed || me.mana < POWER_COST) { this.ctx.toast(me.powerUsed ? 'Сила уже использована в этот ход' : 'Нужно 2 💧'); return; }
        SFX.play('click');
        if (pw.tg === 'none') this.send({ a: 'power' });
        else { this.sel = this.sel === 'power' ? null : 'power'; }
      };
      this.showFacUI();
    }
    showFacUI() {
      const p = h(`<div id="cdFac" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,6,26,.55)">
        <div class="panel" style="max-width:820px;text-align:center">
          <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:48px">Выбери королевство</h2>
          <div class="roles" style="margin-top:14px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
            <div class="role" id="fsun" style="cursor:pointer"><div class="ico">☀️</div><h3>Солнце</h3><p>Напор и огонь: рывки, двойные удары, огненные шары. Бей быстро!</p></div>
            <div class="role" id="fmoon" style="cursor:pointer"><div class="ico">🌙</div><h3>Луна</h3><p>Хитрость и терпение: шипы, сон, вампиризм, затмения. Выживи и победи.</p></div>
            <div class="role" id="fforest" style="cursor:pointer"><div class="ico">🌳</div><h3>Лес</h3><p>Рост и стойкость: ростки становятся великанами, дриады лечат, корни держат врага.</p></div>
          </div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:10px">Сила героя (2 💧, раз в ход): ☀️ Искра — 1 урон · 🌙 Бальзам — замку +3 · 🌳 Семечко — Росток</div>
          <div class="readyline" id="facLine"></div>
        </div></div>`);
      this.el.appendChild(p);
      const choose = (fac) => { SFX.play('click'); this.facPick[this.me] = fac; this.ctx.send({ a: 'fac', side: this.me, fac }); this.updateFacUI(); if (this.ctx.isHost) this.maybeStart(); };
      $('#fsun', p).onclick = () => choose('sun'); $('#fmoon', p).onclick = () => choose('moon'); $('#fforest', p).onclick = () => choose('forest');
      this.updateFacUI();
    }
    updateFacUI() {
      const line = $('#facLine', this.el); if (!line) return;
      const m = this.facPick[this.me], o = this.facPick[this.op];
      for (const k of ['sun', 'moon', 'forest']) $('#f' + k, this.el).classList.toggle('mine', m === k);
      line.innerHTML = `<span>Ты: ${m ? `<b>${FAC[m].name}</b>` : 'выбираешь…'}</span><span>${esc(this.ctx.peer.name)}: ${o ? '<b>готов(а) ✓</b>' : 'выбирает…'}</span>`;
    }
    showEnd() {
      const G = this.view;
      const win = G.winner === this.me, draw = G.winner === 'draw';
      if (!this.recorded) {
        this.recorded = true;
        const s = Store.get('cards_score', { w: 0, l: 0 });
        if (!draw) { win ? s.w++ : s.l++; Store.set('cards_score', s); }
        SFX.play(win ? 'win' : 'fail');
      }
      const s = Store.get('cards_score', { w: 0, l: 0 });
      const p = h(`<div id="cdEnd" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,6,26,.5)"><div class="panel" style="max-width:380px;text-align:center">
        <div style="font-size:60px">${draw ? '🤝' : win ? '👑' : '🏳️'}</div>
        <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:50px">${draw ? 'Ничья!' : win ? 'Победа!' : 'Поражение'}</h2>
        <p style="color:var(--muted)">${draw ? 'Оба замка пали одновременно' : win ? `Замок ${esc(this.ctx.peer.name)} пал` : `${esc(this.ctx.peer.name)} взял(а) твой замок`}</p>
        <p>Общий счёт: <b>${s.w} : ${s.l}</b></p>
        <button class="btn" id="again">Реванш ⚔</button></div></div>`);
      $('#again', p).onclick = () => (this.ctx.isHost ? this.rematch() : this.ctx.send({ a: 'again' }));
      this.el.appendChild(p);
    }

    // ================= Кадр =================
    frame(dt, t) {
      this.t = t;
      for (const f of this.fx) if (!f.done && t >= f.at) { f.done = true; this.runFx(f); }
      this.fx = this.fx.filter((f) => !f.done);
      if (this.pendingG && t >= this.swapAt) { this.view = this.pendingG; this.pendingG = null; if (this.view.winner && !$('#cdEnd', this.el)) this.showEnd(); }
      this.parts.update(dt);
      for (const k in this.shakes) { this.shakes[k] -= dt; if (this.shakes[k] <= 0) delete this.shakes[k]; }
      const btn = $('#cdEndTurn', this.el);
      const pb = $('#cdPower', this.el);
      if (pb && this.view) { const me = this.view.P[this.me], pw = POWERS[me.fac], ok = this.myTurn() && !me.powerUsed && me.mana >= POWER_COST; const txt = `${pw.icon} ${pw.n} · 2💧\n${pw.d}`; if (pb._t !== txt + ok + this.sel) { pb._t = txt + ok + this.sel; pb.innerHTML = `<b>${pw.icon} ${pw.n}</b> · 2💧<br><span style="font-size:11px;opacity:.8">${pw.d}</span>`; pb.style.opacity = ok ? 1 : 0.45; pb.style.boxShadow = this.sel === 'power' ? '0 0 0 2px #ffd27a, 0 0 20px rgba(255,210,120,.5)' : ''; } }
      if (btn) { const on = this.myTurn(); btn.disabled = !on; btn.textContent = !this.view ? '…' : on ? 'Конец хода ⚔' : this.view.winner ? 'Конец' : 'Ход соперника…'; }
      this.render(dt, t);
    }

    render(dt, t) {
      const st = this.st, g = st.g;
      st.screen();
      g.fillStyle = '#0a0a22'; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      const bg = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000);
      bg.addColorStop(0, '#2a2156'); bg.addColorStop(0.6, '#15123a'); bg.addColorStop(1, '#08071c');
      g.fillStyle = bg; g.fillRect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0);
      for (const s of this.bgStars) { g.globalAlpha = 0.4 + Math.sin(t * 1.5 + s.ph) * 0.3; g.fillStyle = '#fff'; g.fillRect(s.x, s.y, s.r, s.r); }
      g.globalAlpha = 1;
      // рамка-орнамент
      g.strokeStyle = 'rgba(255,215,140,0.25)'; g.lineWidth = 2; roundRect(g, 20, 20, W - 40, H - 40, 26); g.stroke();
      g.strokeStyle = 'rgba(255,215,140,0.1)'; g.lineWidth = 1; roundRect(g, 30, 30, W - 60, H - 60, 22); g.stroke();
      // река посередине
      const ry = (EN_Y + MY_Y) / 2;
      const rv = g.createLinearGradient(0, ry - 26, 0, ry + 26); rv.addColorStop(0, 'rgba(90,160,255,0)'); rv.addColorStop(0.5, 'rgba(120,190,255,0.22)'); rv.addColorStop(1, 'rgba(90,160,255,0)');
      g.fillStyle = rv; g.fillRect(420, ry - 26, 820, 52);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) { const x = 430 + ((t * 40 + i * 61) % 800); Glow.draw(g, x, ry + Math.sin(t * 2 + i) * 10, 8, '#9fdcff', 0.5); }
      g.globalCompositeOperation = 'source-over';

      const G = this.view;
      if (!G) { this.parts.draw(g); return; }
      const me = G.P[this.me], op = G.P[this.op];
      // замки
      this.drawCastle(g, CASTLE.en.x, CASTLE.en.y, op, false, t, this.shakes[`${this.op}-1`]);
      this.drawCastle(g, CASTLE.me.x, CASTLE.me.y, me, true, t, this.shakes[`${this.me}-1`]);
      // слоты и юниты
      const selCard = this.sel && me.hand.find((c) => c.uid === this.sel);
      const targets = this.sel === 'power' && this.myTurn() ? this.validTargets('power') : selCard && this.myTurn() ? this.validTargets(selCard.cid) : [];
      const isTarget = (s, l) => targets.some((v) => v.side === s && v.lane === l);
      for (const side of [this.op, this.me]) {
        const P = G.P[side];
        for (let l = 0; l < 3; l++) {
          const p = this.slotPos(side, l);
          const tg = isTarget(side, l);
          g.save();
          g.strokeStyle = tg ? `rgba(255,230,150,${0.6 + Math.sin(t * 6) * 0.3})` : 'rgba(255,255,255,0.1)';
          g.lineWidth = tg ? 3 : 1.5; g.setLineDash(P.board[l] ? [] : [8, 8]);
          roundRect(g, p.x - SLOT.w / 2, p.y - SLOT.h / 2, SLOT.w, SLOT.h, 16); g.stroke();
          g.restore();
          if (tg) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, p.x, p.y, 120, '#ffd27a', 0.25); g.globalCompositeOperation = 'source-over'; }
          const u = P.board[l];
          if (u) {
            const sh = this.shakes[`${side}${l}`] || 0;
            g.save(); g.translate(p.x + rand(-1, 1) * sh * 14, p.y + rand(-1, 1) * sh * 14);
            this.drawCard(g, u.cid, 0, 0, SLOT.w, SLOT.h, { unit: u, fac: P.fac, t });
            g.restore();
          }
        }
        if (isTarget(side, -1)) { const c = this.slotPos(side, -1); g.strokeStyle = `rgba(255,230,150,${0.6 + Math.sin(t * 6) * 0.3})`; g.lineWidth = 3; g.beginPath(); g.arc(c.x, c.y, 110, 0, TAU); g.stroke(); }
      }
      // снаряды
      for (const b of this.bolts || []) {
        b.t += dt * 3.2;
        const k = Math.min(1, b.t), x = lerp(b.ax, b.bx, Ease.inOutSine(k)), y = lerp(b.ay, b.by, Ease.inOutSine(k)) - Math.sin(k * Math.PI) * 60;
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, x, y, 40, b.color, 1); Glow.draw(g, x, y, 14, '#ffffff', 1);
        g.globalCompositeOperation = 'source-over';
        if (Math.random() < 0.7) this.parts.emit(x, y, { n: 1, speed: 30, life: 0.4, size: 8, color: b.color });
      }
      this.bolts = (this.bolts || []).filter((b) => b.t < 1);
      // рука соперника (рубашки)
      const on = op.hand.length;
      for (let i = 0; i < on; i++) {
        const x = 860 + (i - (on - 1) / 2) * 46;
        g.save(); g.translate(x, 52); g.rotate((i - (on - 1) / 2) * 0.06);
        this.drawBack(g, 0, 0, 70, 98, op.fac);
        g.restore();
      }
      // мана и колоды
      this.drawMana(g, 1310, 790, me, true);
      this.drawMana(g, 1310, 110, op, false);
      // моя рука
      for (const r of this.handLayout()) {
        g.save(); g.translate(r.x, r.y); g.rotate(r.a);
        const C = CARDS[r.c.cid];
        const playable = this.myTurn() && C.c <= me.mana;
        if (this.sel === r.c.uid) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, 160, FAC[me.fac].glow, 0.5); g.globalCompositeOperation = 'source-over'; }
        this.drawCard(g, r.c.cid, 0, 0, r.w, r.h, { fac: me.fac, t, playable, dim: !playable && this.myTurn() });
        g.restore();
      }
      if (selCard && CARDS[selCard.cid].t === 's' && CARDS[selCard.cid].tg === 'none' && this.myTurn()) {
        g.font = '700 20px Comfortaa'; g.textAlign = 'center'; g.fillStyle = '#ffe7a6';
        g.fillText('нажми на карту ещё раз, чтобы применить', 860, 650);
      } else if (selCard && this.myTurn()) {
        g.font = '600 18px Comfortaa'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,240,200,0.8)';
        g.fillText(CARDS[selCard.cid].t === 'u' ? 'выбери свободную линию' : 'выбери цель', 860, 650);
      }
      // крупный просмотр карты: выбранная, под курсором или нажатый юнит
      const hovCard = !selCard && this.hover && me.hand.find((c) => c.uid === this.hover);
      const insp = !selCard && !hovCard && this.inspect && this.t - this.inspect.t < 3.5 ? this.inspect : null;
      const pv = selCard ? { cid: selCard.cid, fac: me.fac } : hovCard ? { cid: hovCard.cid, fac: me.fac } : insp;
      if (pv) {
        g.save(); g.globalAlpha = insp ? Math.min(1, (3.5 - (this.t - insp.t)) * 2) : 1;
        g.fillStyle = 'rgba(5,4,20,0.45)'; roundRect(g, 337, 268, 236, 316, 22); g.fill();
        this.drawCard(g, pv.cid, 455, 426, 220, 300, { fac: pv.fac, t, unit: insp ? insp.unit : null });
        g.restore();
      }
      this.parts.draw(g);
      // плавающие цифры
      g.textAlign = 'center';
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i]; f.t += dt;
        const life = f.big ? 1.6 : 1.1;
        if (f.t > life) { this.floats.splice(i, 1); continue; }
        g.globalAlpha = Math.min(1, (life - f.t) * 3);
        g.font = f.big ? '700 34px Comfortaa' : '700 40px Comfortaa';
        g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.6)';
        const y = f.y - f.t * (f.big ? 20 : 60);
        g.strokeText(f.text, f.x, y); g.fillStyle = f.color; g.fillText(f.text, f.x, y);
        g.globalAlpha = 1;
      }
      // баннер хода
      if (this.banner) {
        const b = this.banner; b.t += dt;
        if (b.t > 1.8) this.banner = null;
        else {
          const a = Math.min(1, b.t * 4) * Math.min(1, (1.8 - b.t) * 3);
          g.globalAlpha = a;
          g.fillStyle = 'rgba(10,8,30,0.6)'; g.fillRect(st.x0, H / 2 - 60, st.x1 - st.x0, 120);
          g.font = `${80 + Ease.outBack(Math.min(1, b.t * 2)) * 6}px 'Marck Script', cursive`;
          g.fillStyle = b.mine ? '#ffe7a6' : '#c9d4ff'; g.shadowColor = b.mine ? '#ffb35c' : '#8fa8ff'; g.shadowBlur = 30;
          g.fillText(b.text, W / 2, H / 2 + 26);
          g.shadowBlur = 0; g.globalAlpha = 1;
        }
      }
    }

    drawMana(g, x, y, p, mine) {
      g.textAlign = 'left';
      for (let i = 0; i < p.max; i++) {
        const cx = x + i * 30, full = i < p.mana;
        g.fillStyle = full ? '#5fb8ff' : 'rgba(95,184,255,0.18)';
        g.beginPath(); g.moveTo(cx, y - 12); g.quadraticCurveTo(cx + 11, y + 2, cx, y + 12); g.quadraticCurveTo(cx - 11, y + 2, cx, y - 12); g.fill();
        if (full) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, cx, y, 18, '#5fb8ff', 0.6); g.globalCompositeOperation = 'source-over'; }
      }
      g.font = '600 15px Comfortaa'; g.fillStyle = '#cfe6ff';
      g.fillText(`${p.mana}/${p.max} 💧   колода ${p.deck.length}`, x - 10, y + (mine ? 36 : -24));
    }

    drawCastle(g, x, y, p, mine, t, sh) {
      const f = FAC[p.fac];
      g.save();
      g.translate(x + (sh ? rand(-1, 1) * sh * 16 : 0), y);
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, 170, f.glow, 0.22); g.globalCompositeOperation = 'source-over';
      const dmg = 1 - clamp(p.hp / MAX_HP, 0, 1);
      // стены
      const wall = g.createLinearGradient(0, -80, 0, 80); wall.addColorStop(0, mixColor(f.c1, '#ffffff', 0.25)); wall.addColorStop(1, f.c2);
      g.fillStyle = wall;
      g.fillRect(-90, -20, 180, 80);
      const tower = (tx, th, w) => {
        g.fillRect(tx - w / 2, 60 - th, w, th);
        for (let i = 0; i < 3; i++) g.fillRect(tx - w / 2 + i * (w / 2.5), 60 - th - 12, w / 5, 12);
      };
      tower(-80, 120, 46); tower(80, 120, 46); tower(0, 160, 56);
      // крыша и флаг
      g.fillStyle = f.edge; g.beginPath(); g.moveTo(-34, -100); g.lineTo(0, -150); g.lineTo(34, -100); g.fill();
      g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -150); g.lineTo(0, -185); g.stroke();
      g.fillStyle = f.glow; g.beginPath(); g.moveTo(0, -185);
      for (let i = 0; i <= 8; i++) g.lineTo(i * 4, -185 + Math.sin(t * 5 + i * 0.7) * 3 + (i === 8 ? 8 : 0));
      g.lineTo(0, -170); g.fill();
      // окна
      g.globalCompositeOperation = 'lighter';
      for (const [wx, wy] of [[-80, 0], [80, 0], [0, -40], [0, 10]]) Glow.draw(g, wx, wy, 16, '#ffd27a', 0.7 + Math.sin(t * 3 + wx) * 0.2);
      g.globalCompositeOperation = 'source-over';
      // ворота
      g.fillStyle = '#1a1020'; g.beginPath(); g.moveTo(-18, 60); g.lineTo(-18, 30); g.arc(0, 30, 18, Math.PI, 0); g.lineTo(18, 60); g.fill();
      // трещины
      if (dmg > 0.3) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-60, -10); g.lineTo(-45, 15); g.lineTo(-55, 35); if (dmg > 0.6) { g.moveTo(40, -60); g.lineTo(28, -30); g.lineTo(42, -5); } g.stroke(); }
      // HP
      g.fillStyle = 'rgba(10,8,30,0.75)'; roundRect(g, -56, 70, 112, 40, 20); g.fill();
      g.strokeStyle = f.edge; g.lineWidth = 2; roundRect(g, -56, 70, 112, 40, 20); g.stroke();
      g.font = '700 22px Comfortaa'; g.textAlign = 'center'; g.fillStyle = p.hp <= 8 ? '#ff8c8c' : '#fff';
      g.fillText(`❤ ${Math.max(0, p.hp)}`, 0, 98);
      g.font = '600 14px Comfortaa'; g.fillStyle = '#d8d0ff';
      g.fillText(mine ? `${this.ctx.me.name} · ${f.name}` : `${this.ctx.peer.name} · ${f.name}`, 0, 136);
      g.restore();
    }

    drawBack(g, x, y, w, hh, fac) {
      const f = FAC[fac];
      const gr = g.createLinearGradient(0, -hh / 2, 0, hh / 2); gr.addColorStop(0, f.c1); gr.addColorStop(1, f.c2);
      g.fillStyle = gr; roundRect(g, x - w / 2, y - hh / 2, w, hh, 8); g.fill();
      g.strokeStyle = f.edge; g.lineWidth = 1.5; roundRect(g, x - w / 2 + 4, y - hh / 2 + 4, w - 8, hh - 8, 6); g.stroke();
      drawGlyph(g, f.icon, x, y, w * 0.45, f.edge, 2);
    }

    drawCard(g, cid, x, y, w, hh, o = {}) {
      const C = CARDS[cid], f = FAC[o.fac || 'sun'], u = o.unit;
      const s = w / 150;
      g.save(); g.translate(x, y);
      if (o.dim) g.globalAlpha = 0.6;
      // тень
      g.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(g, -w / 2 + 4, -hh / 2 + 6, w, hh, 14 * s); g.fill();
      const gr = g.createLinearGradient(0, -hh / 2, 0, hh / 2); gr.addColorStop(0, f.c1); gr.addColorStop(1, f.c2);
      g.fillStyle = gr; roundRect(g, -w / 2, -hh / 2, w, hh, 14 * s); g.fill();
      g.strokeStyle = o.playable ? '#fff3c4' : f.edge; g.lineWidth = o.playable ? 3 : 2;
      roundRect(g, -w / 2 + 4 * s, -hh / 2 + 4 * s, w - 8 * s, hh - 8 * s, 11 * s); g.stroke();
      if (o.playable) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, w * 0.8, f.glow, 0.25 + Math.sin((o.t || 0) * 4) * 0.1); g.globalCompositeOperation = 'source-over'; }
      // арт
      const ay = -hh * 0.16, ar = w * 0.3;
      const ag = g.createRadialGradient(0, ay - ar * 0.3, 2, 0, ay, ar); ag.addColorStop(0, mixColor(f.glow, '#ffffff', 0.5)); ag.addColorStop(1, f.c2);
      g.fillStyle = ag; g.beginPath(); g.arc(0, ay, ar, 0, TAU); g.fill();
      g.strokeStyle = f.edge; g.lineWidth = 1.5 * s; g.stroke();
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, ay, ar * 1.3, f.glow, 0.35 + Math.sin((o.t || 0) * 2 + w) * 0.1); g.globalCompositeOperation = 'source-over';
      g.font = `${ar * 1.15}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(C.art, 0, ay + ar * 0.06);
      g.textBaseline = 'alphabetic';
      // имя
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 6 * s, hh * 0.08, w - 12 * s, 24 * s);
      g.fillStyle = '#fff'; g.font = `700 ${Math.min(13.5 * s, (w - 16 * s) / (C.n.length * 0.62))}px Comfortaa`;
      g.fillText(C.n, 0, hh * 0.08 + 17 * s);
      // описание
      const kwText = (C.kw || []).map((k) => KW_NAMES[k]).join(' · ');
      g.font = `600 ${10.5 * s}px Comfortaa`; g.fillStyle = '#ffe7b8';
      let ty = hh * 0.08 + 40 * s;
      if (kwText) { g.fillText(kwText, 0, ty); ty += 14 * s; }
      g.font = `400 ${10 * s}px Comfortaa`; g.fillStyle = '#e8e2ff';
      if (C.d && !(u && kwText)) wrapText(g, C.d, 0, ty, w - 20 * s, 12.5 * s);
      // стоимость
      if (!u) {
        g.fillStyle = '#2a7bdc'; g.beginPath(); g.arc(-w / 2 + 16 * s, -hh / 2 + 16 * s, 15 * s, 0, TAU); g.fill();
        g.strokeStyle = '#bfe0ff'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff'; g.font = `700 ${17 * s}px Comfortaa`; g.fillText(C.c, -w / 2 + 16 * s, -hh / 2 + 22 * s);
      }
      // атака / здоровье
      if (C.t === 'u') {
        const atk = u ? u.atk : C.a, hp = u ? u.hp : C.h;
        const badge = (bx, col, txt, buffed) => {
          g.fillStyle = col; g.beginPath(); g.arc(bx, hh / 2 - 16 * s, 16 * s, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
          g.fillStyle = buffed ? '#c8ffd8' : '#fff'; g.font = `700 ${17 * s}px Comfortaa`; g.fillText(txt, bx, hh / 2 - 10 * s);
        };
        badge(-w / 2 + 18 * s, '#d9822b', atk, u && atk > C.a);
        badge(w / 2 - 18 * s, u && hp < u.max ? '#b8323c' : '#c9424d', hp, u && u.max > C.h);
      }
      // состояния юнита
      if (u) {
        if (u.shield) { g.strokeStyle = `rgba(150,220,255,${0.6 + Math.sin((o.t || 0) * 4) * 0.25})`; g.lineWidth = 4; roundRect(g, -w / 2 - 5, -hh / 2 - 5, w + 10, hh + 10, 18 * s); g.stroke(); }
        if ((u.fresh && !(C.kw || []).includes('rush')) || u.sleep > 0) {
          g.font = `700 ${18 * s}px Comfortaa`; g.fillStyle = '#c9b8ff';
          g.fillText('z', w / 2 - 16 * s, -hh / 2 + 22 * s + Math.sin((o.t || 0) * 3) * 3);
          g.font = `700 ${13 * s}px Comfortaa`; g.fillText('z', w / 2 - 6 * s, -hh / 2 + 10 * s + Math.sin((o.t || 0) * 3 + 1) * 3);
        }
      }
      g.restore();
    }

    resync() { if (this.G) this.ctx.send({ a: 'st', G: JSON.parse(JSON.stringify(this.G)), fx: [] }); else if (this.facPick.h) this.ctx.send({ a: 'fac', side: 'h', fac: this.facPick.h }); }
    destroy() { this.st.destroy(); }
  }
})();
