'use strict';
// «Сад под звёздами» — общий парящий остров: сажаем, поливаем, приручаем ночных зверьков, выполняем задания, растим уровень острова.
(() => {
  const W = 1600, H = 900;
  const N = 8, TW = 144, TH = 72, OX = 800, OY = 180, DEPTH = 50;
  const CYCLE = 240; // секунд на сутки
  const MAX_LVL = 10;
  const WATER = new Set([6 * N + 6, 7 * N + 6, 6 * N + 7, 7 * N + 7]);

  const PLANTS = {
    bell: { n: 'Лунный колокольчик', time: 50, col: '#8fb8ff', spark: 1, icon: '🔔', fruit: 'колокольчик', lvl: 1 },
    berry: { n: 'Светоягода', time: 70, col: '#ff7eb6', spark: 2, icon: '🍓', fruit: 'ягода', lvl: 1 },
    pumpkin: { n: 'Звёздная тыква', time: 110, col: '#ffa53d', spark: 4, icon: '🎃', fruit: 'тыква', lvl: 1 },
    cotton: { n: 'Облачный хлопок', time: 80, col: '#ffffff', spark: 2, icon: '☁️', fruit: 'хлопок', lvl: 2 },
    fire: { n: 'Огнецвет', time: 90, col: '#ff8a3d', spark: 3, icon: '🔥', fruit: 'огнецвет', lvl: 3 },
    sun: { n: 'Солнечник', time: 120, col: '#ffd84a', spark: 5, icon: '🌻', fruit: 'солнечник', lvl: 4 },
    crystal: { n: 'Кристальная роза', time: 150, col: '#c9a8ff', spark: 7, icon: '💎', fruit: 'кристалл', lvl: 6 },
  };
  const CREATURES = {
    owl: { n: 'Лунная сова', want: 'bell', bonus: 'растения растут на 25% быстрее' },
    fox: { n: 'Светлячковый лис', want: 'berry', bonus: '+1 ✦ за каждый урожай' },
    bunny: { n: 'Звёздный кролик', want: 'pumpkin', bonus: '+1 плод за каждый урожай' },
    jelly: { n: 'Облачная медуза', want: 'cotton', bonus: 'иногда поливает сад дождиком' },
    dragon: { n: 'Огненный дракончик', want: 'fire', bonus: 'иногда дарит семена' },
    deer: { n: 'Лунный олень', want: 'sun', bonus: 'задания дают больше искр' },
    cat: { n: 'Звёздный кот', want: 'crystal', bonus: 'звёзды падают чаще' },
  };
  const DECOR = {
    lantern: { n: 'Фонарик', price: 8, icon: '🏮', lvl: 1 },
    mushrooms: { n: 'Грибы-светляки', price: 12, icon: '🍄', lvl: 1 },
    bench: { n: 'Скамейка', price: 15, icon: '🪑', lvl: 2 },
    arch: { n: 'Цветочная арка', price: 25, icon: '🌸', lvl: 3 },
    swing: { n: 'Качели', price: 30, icon: '🎠', lvl: 4 },
    telescope: { n: 'Телескоп', price: 40, icon: '🔭', lvl: 5 },
    starlamp: { n: 'Звёздная лампа', price: 55, icon: '⭐', lvl: 7 },
  };
  const SEED_PRICE = { bell: 2, berry: 3, pumpkin: 6, cotton: 4, fire: 6, sun: 9, crystal: 14 };
  const xpNeed = (lvl) => 25 + lvl * 25;

  const tileTop = (i, j) => ({ x: OX + (i - j) * (TW / 2), y: OY + (i + j) * (TH / 2) });
  const tileC = (idx) => { const i = idx % N, j = Math.floor(idx / N), p = tileTop(i, j); return { x: p.x, y: p.y + TH / 2 }; };
  const nightAmt = (tod) => { if (tod < 0.45) return 0; if (tod < 0.58) return (tod - 0.45) / 0.13; if (tod < 0.9) return 1; return 1 - (tod - 0.9) / 0.1; };

  GAMES.garden = {
    id: 'garden', title: 'Сад под звёздами', icon: '🌙', color: '#7be08a',
    tagline: 'Ваш общий парящий остров — растёт, даже когда вас нет',
    roles: null, landscape: true,
    rules: [
      'Нажимай на клетки: пустая — <b>посадить</b>, росток — <b>полить</b> 💧, созревшее — <b>собрать</b> 🧺.',
      'Выполняйте <b>задания</b> 📜 — за них искры ✦ и опыт. Остров растёт до 10 уровня и открывает новые растения, украшения и зверьков.',
      'Ночью прилетают зверьки 🦊🦉 и падают звёзды ⭐ — угощайте гостей и ловите звёзды!',
      'Сад сохраняется и растёт, пока вас нет. Без спешки — просто болтайте и садовничайте ✦',
    ],
    info() { const s = Store.get('garden', null); return s ? `ур. ${s.lvl || 1} · зверьков ${s.creatures.length} · ✦ ${s.sparks}` : 'уютный общий остров'; },
    create(ctx) { return new Garden(ctx); },
  };

  function freshState() {
    const tiles = Array.from({ length: N * N }, () => ({ p: null, d: null }));
    tiles[3 * N + 3].p = { type: 'bell', g: 0.4, w: 0 };
    tiles[4 * N + 3].p = { type: 'berry', g: 0.15, w: 0 };
    const zero = () => Object.fromEntries(Object.keys(PLANTS).map((k) => [k, 0]));
    return { v: 2, tiles, seeds: { ...zero(), bell: 4, berry: 3, pumpkin: 1 }, fruit: zero(), decor: {}, sparks: 5, creatures: [], visitors: [], fstars: [], quests: [], lvl: 1, xp: 0, day: 1, tod: 0.12, rain: 0, saved: Date.now(), harvests: 0, id: 1 };
  }
  function migrate(S) {
    if (!S) return freshState();
    if (S.v === 1) {
      for (const k of Object.keys(PLANTS)) { S.seeds[k] = S.seeds[k] || 0; S.fruit[k] = S.fruit[k] || 0; }
      Object.assign(S, { v: 2, fstars: [], quests: [], lvl: 1, xp: 0, day: 1 });
    }
    return S.v === 2 ? S : freshState();
  }

  class Garden {
    constructor(ctx) {
      this.ctx = ctx;
      this.st = new Stage(ctx.canvas, W, H);
      this.parts = new Particles();
      this.S = null; this.seed = 'bell'; this.mode = 'garden'; this.decorPick = null; this.floats = [];
      this.me = { x: 800, y: 500, tx: 800, ty: 500 }; this.peer = { x: 760, y: 520, tx: 760, ty: 520 };
      this.cr = {};
      this.grass = Array.from({ length: N * N }, (_, k) => { const r = RNG(k * 97 + 3); return Array.from({ length: 7 }, () => [r.range(-0.36, 0.36), r.range(-0.36, 0.36), r.range(6, 13), r()]); });
      this.flies = Array.from({ length: 34 }, () => ({ x: rand(400, 1200), y: rand(250, 700), ph: rand(0, TAU), sp: rand(0.3, 0.8) }));
      this.clouds = Array.from({ length: 6 }, () => ({ x: rand(-200, W), y: rand(40, 260), s: rand(0.6, 1.4), v: rand(8, 20) }));
      this.skyStars = Array.from({ length: 140 }, () => ({ x: rand(0, W), y: rand(0, H * 0.75), r: rand(0.6, 2), ph: rand(0, TAU) }));
      this.rainDrops = Array.from({ length: 160 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(0.7, 1.3) }));
      this.streaks = [];
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) { this.S = this.loadLocal(); this.hostTimer = 0; this.saveT = 0; this.fillQuests(); }
      else ctx.send({ a: 'mine', S: Store.get('garden', null) });
      ctx.loop((dt, t) => this.frame(dt, t));
      if (ctx.isHost) setTimeout(() => this.push(), 200);
    }

    loadLocal() {
      const S = migrate(Store.get('garden', null));
      this.loadedSaved = S.saved || 0;
      this.catchUp(S);
      return S;
    }
    catchUp(S) {
      const el = (Date.now() - (S.saved || Date.now())) / 1000;
      if (el > 30) {
        let grown = 0;
        for (const t of S.tiles) if (t.p && t.p.g < 1) { t.p.g = Math.min(1, t.p.g + el / PLANTS[t.p.type].time); if (t.p.g >= 1) grown++; }
        S.visitors = []; S.fstars = [];
        if (grown) this.offlineMsg = `Пока вас не было, созрело растений: ${grown} 🌱`;
      }
      S.saved = Date.now();
    }
    save() { if (this.S) { this.S.saved = Date.now(); Store.set('garden', this.S); } }
    push(fx) { this.ctx.send({ a: 'S', S: this.S, fx }); if (fx) this.runFx(fx); this.updateUI(); }
    has(type) { return this.S.creatures.some((c) => c.type === type); }
    unlocked(k) { return PLANTS[k].lvl <= this.S.lvl; }

    // ============ Хост: задания и опыт ============
    fillQuests() {
      const S = this.S;
      while (S.quests.length < 3) S.quests.push(this.makeQuest());
    }
    makeQuest() {
      const S = this.S, r = Math.random;
      const plants = Object.keys(PLANTS).filter((k) => this.unlocked(k));
      const untamed = Object.keys(CREATURES).filter((k) => !this.has(k) && this.unlocked(CREATURES[k].want));
      const kinds = ['harvest', 'harvest', 'harvestAny', 'plant', 'water', 'star', 'decor'];
      if (untamed.length) kinds.push('tame', 'tame');
      let kind = pick(kinds);
      if (S.quests.some((q) => q.kind === kind && kind !== 'harvest')) kind = 'harvestAny';
      const lv = S.lvl, q = { id: S.id++, kind, have: 0 };
      switch (kind) {
        case 'harvest': q.target = pick(plants); q.n = 2 + Math.floor(r() * 3) + Math.floor(lv / 3); q.text = `Собрать ${PLANTS[q.target].icon} ${PLANTS[q.target].fruit}`; break;
        case 'harvestAny': q.n = 4 + Math.floor(r() * 4) + lv; q.text = 'Собрать любой урожай'; break;
        case 'plant': q.n = 3 + Math.floor(r() * 4); q.text = 'Посадить семена'; break;
        case 'water': q.n = 4 + Math.floor(r() * 5); q.text = 'Полить ростки 💧'; break;
        case 'star': q.n = 2 + Math.floor(r() * 2); q.text = 'Поймать падающие звёзды ⭐'; break;
        case 'decor': q.n = 1; q.text = 'Поставить украшение 🏮'; break;
        case 'tame': q.target = pick(untamed); q.n = 1; q.text = `Приручить: ${CREATURES[q.target].n}`; break;
      }
      q.reward = 8 + Math.floor(r() * 8) + lv * 2 + (this.has('deer') ? 6 : 0);
      q.xp = 15 + lv * 3;
      return q;
    }
    progress(kind, target, n = 1) {
      for (const q of this.S.quests) {
        if (q.done) continue;
        if (q.kind === kind && (!q.target || q.target === target)) q.have = Math.min(q.n, q.have + n);
        if (kind === 'harvest' && q.kind === 'harvestAny') q.have = Math.min(q.n, q.have + n);
        if (q.have >= q.n && !q.done) {
          q.done = true;
          this.S.sparks += q.reward;
          this.fx({ t: 'quest', text: q.text, reward: q.reward });
          this.addXp(q.xp);
          setTimeout(() => { if (!this.S) return; this.S.quests = this.S.quests.filter((x) => x !== q); this.fillQuests(); this.push(); }, 1800);
        }
      }
    }
    addXp(n) {
      const S = this.S; if (S.lvl >= MAX_LVL) return;
      S.xp += n;
      while (S.lvl < MAX_LVL && S.xp >= xpNeed(S.lvl)) {
        S.xp -= xpNeed(S.lvl); S.lvl++;
        const bonus = S.lvl * 5; S.sparks += bonus;
        const newP = Object.keys(PLANTS).filter((k) => PLANTS[k].lvl === S.lvl);
        const newD = Object.keys(DECOR).filter((k) => DECOR[k].lvl === S.lvl);
        newP.forEach((k) => (S.seeds[k] += 2));
        this.fx({ t: 'lvl', lvl: S.lvl, bonus, unlocks: [...newP.map((k) => `${PLANTS[k].icon} ${PLANTS[k].n}`), ...newD.map((k) => `${DECOR[k].icon} ${DECOR[k].n}`)] });
      }
    }

    // ============ Хост: мир ============
    hostTick(dt) {
      const S = this.S;
      const owl = this.has('owl');
      const prevTod = S.tod;
      S.tod = (S.tod + dt / CYCLE) % 1;
      if (S.tod < prevTod) { S.day++; this.fx({ t: 'day', day: S.day }); }
      if (S.rain > 0) S.rain = Math.max(0, S.rain - dt);
      else if (Math.random() < dt / 300) { S.rain = 25; this.fx({ t: 'rain' }); }
      for (const t of S.tiles) {
        if (!t.p || t.p.g >= 1) continue;
        if (S.rain > 0) t.p.w = Math.max(t.p.w, 20);
        const sp = (t.p.w > 0 ? 2.5 : 1) * (owl ? 1.25 : 1);
        const was = t.p.g;
        t.p.g = Math.min(1, t.p.g + (dt * sp) / PLANTS[t.p.type].time);
        if (t.p.w > 0) t.p.w = Math.max(0, t.p.w - dt);
        if (was < 1 && t.p.g >= 1) this.dirty = true;
      }
      const night = nightAmt(S.tod) > 0.6;
      if (night && S.visitors.length < 2 && Math.random() < dt / 20) {
        const free = Object.keys(CREATURES).filter((k) => !this.has(k) && this.unlocked(CREATURES[k].want) && !S.visitors.some((v) => v.type === k));
        const spot = this.freeTile();
        if (free.length && spot >= 0) { const type = pick(free); S.visitors.push({ id: S.id++, type, idx: spot }); this.fx({ t: 'visit', type, idx: spot }); this.dirty = true; }
      }
      // падающие звёзды
      if (night && S.fstars.length < 3 && Math.random() < dt / (this.has('cat') ? 7 : 13)) {
        const spot = this.freeTile();
        if (spot >= 0) { S.fstars.push({ id: S.id++, idx: spot }); this.fx({ t: 'fall', idx: spot }); this.dirty = true; }
      }
      if (nightAmt(S.tod) === 0 && (S.visitors.length || S.fstars.length)) { S.visitors = []; S.fstars = []; this.dirty = true; }
      this.walkT = (this.walkT || 0) + dt;
      if (this.walkT > 3.5) {
        this.walkT = 0;
        for (const c of S.creatures) if (Math.random() < 0.5) { const n = this.neighborFree(c.idx); if (n >= 0) c.idx = n; }
        if (this.has('jelly') && Math.random() < 0.12) { const p = S.tiles.map((t, i) => (t.p && t.p.g < 1 ? i : -1)).filter((i) => i >= 0); if (p.length) { const i = pick(p); S.tiles[i].p.w = 40; this.fx({ t: 'water', idx: i }); } }
        if (this.has('dragon') && Math.random() < 0.05) { const k = pick(Object.keys(PLANTS).filter((x) => this.unlocked(x))); S.seeds[k]++; this.fx({ t: 'gift', seed: k }); }
        this.dirty = true;
      }
      this.hostTimer += dt;
      if (this.dirty || this.hostTimer > 2) { this.dirty = false; this.hostTimer = 0; this.push(); }
      this.saveT += dt; if (this.saveT > 5) { this.saveT = 0; this.save(); }
    }
    fx(f) { this.ctx.send({ a: 'fx', f }); this.runFx([f]); }
    occupied(i) { const S = this.S; return S.visitors.some((v) => v.idx === i) || S.creatures.some((c) => c.idx === i) || S.fstars.some((s) => s.idx === i); }
    freeTile() {
      const S = this.S, free = [];
      S.tiles.forEach((t, i) => { if (!t.p && !t.d && !WATER.has(i) && !this.occupied(i)) free.push(i); });
      return free.length ? pick(free) : -1;
    }
    neighborFree(idx) {
      const S = this.S, i = idx % N, j = Math.floor(idx / N), opts = [];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        const k = nj * N + ni, t = S.tiles[k];
        if (!WATER.has(k) && !t.d && !S.creatures.some((c) => c.idx === k)) opts.push(k);
      }
      return opts.length ? pick(opts) : -1;
    }
    hostAct(m, who) {
      const S = this.S; if (!S) return;
      if (m.a === 'tap') {
        const idx = m.idx, t = S.tiles[idx]; if (!t) return;
        const star = S.fstars.find((s) => s.idx === idx);
        if (star) { S.fstars = S.fstars.filter((s) => s !== star); S.sparks += 3; this.fx({ t: 'star', idx, who }); this.addXp(4); this.progress('star'); return this.push(); }
        if (m.mode === 'decor') {
          if (t.d) { S.decor[t.d] = (S.decor[t.d] || 0) + 1; this.fx({ t: 'unplace', idx, who }); t.d = null; }
          else if (!t.p && !WATER.has(idx) && m.decor && (S.decor[m.decor] || 0) > 0) { S.decor[m.decor]--; t.d = m.decor; this.fx({ t: 'place', idx, who }); this.addXp(3); this.progress('decor'); }
          return this.push();
        }
        const v = S.visitors.find((x) => x.idx === idx);
        if (v) {
          const want = CREATURES[v.type].want;
          if (S.fruit[want] > 0) { S.fruit[want]--; S.visitors = S.visitors.filter((x) => x !== v); S.creatures.push({ type: v.type, idx }); this.fx({ t: 'tame', type: v.type, idx, who }); this.addXp(20); this.progress('tame', v.type); }
          else this.fx({ t: 'need', fruit: want, who });
          return this.push();
        }
        if (WATER.has(idx)) { this.fx({ t: 'splash', idx }); return; }
        if (t.p) {
          if (t.p.g >= 1) {
            const P = PLANTS[t.p.type], type = t.p.type;
            const n = 2 + (Math.random() < 0.4 ? 1 : 0) + (this.has('bunny') ? 1 : 0);
            const sp = P.spark * n + (this.has('fox') ? 1 : 0);
            S.fruit[type] += n; S.sparks += sp; S.seeds[type] += Math.random() < 0.35 ? 2 : 1; S.harvests++;
            this.fx({ t: 'harvest', idx, type, n, sp, who });
            t.p = null;
            this.addXp(2 + P.spark);
            this.progress('harvest', type, n);
          } else if (t.p.w > 0) { this.fx({ t: 'wet', idx, who }); }
          else { t.p.w = 45; this.fx({ t: 'water', idx, who }); this.addXp(1); this.progress('water'); }
          return this.push();
        }
        if (t.d) { this.fx({ t: 'boop', idx }); return; }
        const seed = m.seed;
        if (seed && S.seeds[seed] > 0) { S.seeds[seed]--; t.p = { type: seed, g: 0, w: 0 }; this.fx({ t: 'plant', idx, who }); this.addXp(1); this.progress('plant'); }
        else this.fx({ t: 'noseed', who });
        return this.push();
      }
      if (m.a === 'buy') {
        if (m.kind === 'decor') { const D = DECOR[m.id]; if (S.sparks >= D.price && D.lvl <= S.lvl) { S.sparks -= D.price; S.decor[m.id] = (S.decor[m.id] || 0) + 1; this.fx({ t: 'bought', name: D.n, who }); } }
        else { const p = SEED_PRICE[m.id]; if (S.sparks >= p && this.unlocked(m.id)) { S.sparks -= p; S.seeds[m.id]++; this.fx({ t: 'bought', name: `семечко «${PLANTS[m.id].n}»`, who }); } }
        this.push(); this.save();
      }
    }

    // ============ Сообщения ============
    onMsg(d) {
      switch (d.a) {
        case 'mine':
          if (this.ctx.isHost && d.S && (d.S.saved || 0) > (this.loadedSaved || 0) + 1000) { this.S = migrate(d.S); this.catchUp(this.S); this.fillQuests(); this.push(); }
          if (this.offlineMsg) { this.fx({ t: 'msg', text: this.offlineMsg }); this.offlineMsg = null; }
          break;
        case 'S': this.S = d.S; if (!this.ctx.isHost) Store.set('garden', d.S); if (d.fx) this.runFx(d.fx); this.updateUI(); break;
        case 'fx': this.runFx([d.f]); break;
        case 'act': if (this.ctx.isHost) this.hostAct(d.m, 'peer'); break;
        case 'sp': this.peer.tx = d.x; this.peer.ty = d.y; break;
      }
    }
    act(m) { if (this.ctx.isHost) this.hostAct(m, 'me'); else this.ctx.send({ a: 'act', m }); }

    runFx(list) {
      for (const f of list) {
        const p = f.idx != null ? tileC(f.idx) : null;
        const mine = (f.who === 'me') === this.ctx.isHost;
        switch (f.t) {
          case 'plant': SFX.play('pop'); this.parts.emit(p.x, p.y, { n: 10, speed: 70, life: 0.7, size: 5, color: '#8a5a3a', glow: false, gravity: 200 }); this.parts.emit(p.x, p.y - 10, { n: 8, speed: 60, life: 0.9, size: 8, color: '#a8ffb0' }); break;
          case 'water': SFX.play('water'); for (let k = 0; k < 12; k++) this.parts.emit(p.x + rand(-20, 20), p.y - 60, { n: 1, angle: Math.PI / 2, spread: 0.2, speed: 160, life: 0.5, size: 4, color: '#9fdcff', glow: false, gravity: 400 }); break;
          case 'wet': if (mine) { SFX.play('click'); this.floats.push({ x: p.x, y: p.y - 50, text: 'уже полито 💧', t: 0, small: true }); } break;
          case 'harvest': SFX.play('coin'); SFX.play('grow'); this.parts.emit(p.x, p.y - 20, { n: 26, speed: 180, life: 1.2, size: 10, color: [PLANTS[f.type].col, '#ffe7a6', '#fff'] }); this.floats.push({ x: p.x, y: p.y - 40, text: `+${f.n} ${PLANTS[f.type].icon}  +${f.sp} ✦`, t: 0 }); break;
          case 'tame': SFX.play('win'); this.parts.emit(p.x, p.y - 20, { n: 60, speed: 240, life: 1.6, size: 12, color: ['#ffe7a6', '#ffb3d6', '#b8f5ff'] }); this.ctx.toast(`💛 ${CREATURES[f.type].n} теперь живёт на острове!<br><span style="font-size:12px;color:#cfc8f0">${CREATURES[f.type].bonus}</span>`, 4500); break;
          case 'need': if (mine) { SFX.play('fail'); this.ctx.toast(`Нужно угощение: ${PLANTS[f.fruit].icon} ${PLANTS[f.fruit].fruit}`); } break;
          case 'noseed': if (mine) { SFX.play('fail'); this.ctx.toast('Нет таких семян — загляни в Лавку 🛒'); } break;
          case 'visit': SFX.play('magic'); this.ctx.toast(`✨ На остров прилетел гость: ${CREATURES[f.type].n}`); this.parts.emit(p.x, p.y - 30, { n: 30, speed: 120, life: 1.2, size: 9, color: '#e8ff9a' }); break;
          case 'fall': this.streaks.push({ x: p.x + 500, y: p.y - 600, tx: p.x, ty: p.y - 40, t: 0 }); SFX.play('whoosh'); break;
          case 'star': SFX.play('chime'); this.parts.emit(p.x, p.y - 40, { n: 40, speed: 220, life: 1.2, size: 10, color: ['#fff3c4', '#ffd27a', '#cfe0ff'] }); this.floats.push({ x: p.x, y: p.y - 60, text: '+3 ✦', t: 0 }); break;
          case 'place': SFX.play('pop'); this.parts.emit(p.x, p.y, { n: 20, speed: 120, life: 0.8, size: 8, color: '#ffe7a6' }); break;
          case 'unplace': SFX.play('whoosh'); break;
          case 'bought': if (mine) { SFX.play('chime'); this.ctx.toast(`Куплено: ${f.name}`); } break;
          case 'rain': this.ctx.toast('🌧 Пошёл тёплый дождик — растения пьют'); break;
          case 'gift': this.ctx.toast(`🐉 Дракончик принёс семечко: ${PLANTS[f.seed].n}`); SFX.play('chime'); break;
          case 'splash': SFX.play('splash'); this.parts.emit(p.x, p.y, { n: 16, angle: -Math.PI / 2, spread: 0.8, speed: 200, life: 0.6, size: 5, color: '#bfeaff', glow: false, gravity: 600 }); break;
          case 'boop': SFX.play('click'); this.parts.emit(p.x, p.y - 30, { n: 6, speed: 60, life: 0.6, size: 7, color: '#ffe7a6' }); break;
          case 'quest': SFX.play('chime'); this.ctx.toast(`📜 Задание выполнено: ${f.text}<br><b style="color:#ffe7a6">+${f.reward} ✦</b>`, 3500); break;
          case 'lvl': {
            SFX.play('win');
            for (let i = 0; i < 5; i++) setTimeout(() => this.parts.emit(rand(500, 1100), rand(200, 500), { n: 40, speed: 280, life: 1.5, size: 11, color: ['#ffe7a6', '#a8ffb0', '#ffb3d6', '#b8f5ff'] }), i * 250);
            this.ctx.toast(`🌟 Остров вырос до ${f.lvl} уровня! +${f.bonus} ✦${f.unlocks.length ? `<br><span style="font-size:13px">Открыто: ${f.unlocks.join(', ')}</span>` : ''}`, 5500);
            break;
          }
          case 'day': this.ctx.toast(`☀️ Новый день — день ${f.day}`); break;
          case 'msg': this.ctx.toast(f.text, 4500); break;
        }
      }
    }

    // ============ Ввод ============
    hitTile(p) {
      const u = (p.x - OX) / (TW / 2), v = (p.y - OY) / (TH / 2);
      const i = Math.floor((u + v) / 2), j = Math.floor((v - u) / 2);
      if (i < 0 || j < 0 || i >= N || j >= N) return -1;
      return j * N + i;
    }
    bindInput() {
      const c = this.ctx.canvas;
      c.addEventListener('pointermove', (e) => { this.hoverIdx = this.hitTile(this.st.pt(e)); });
      c.addEventListener('pointerdown', (e) => {
        if (!this.S) return;
        const p = this.st.pt(e);
        let idx = this.hitTile(p);
        const up = this.hitTile({ x: p.x, y: p.y + 40 });
        if (up >= 0 && (this.S.visitors.some((v) => v.idx === up) || this.S.fstars.some((s) => s.idx === up))) idx = up;
        if (idx < 0) return;
        const cp = tileC(idx);
        this.me.tx = cp.x; this.me.ty = cp.y - 50;
        this.ctx.send({ a: 'sp', x: Math.round(this.me.tx), y: Math.round(this.me.ty) });
        this.act({ a: 'tap', idx, seed: this.seed, mode: this.mode, decor: this.decorPick });
      });
    }

    // ============ Интерфейс ============
    buildUI() {
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div style="position:absolute;top:12px;right:12px;display:flex;gap:8px;align-items:center">
          <div class="g-panel" id="gdInv" style="font-size:14px;display:flex;gap:12px;padding:8px 14px;flex-wrap:wrap;max-width:46vw"></div>
          <button class="iconbtn" id="gdShop" title="Лавка" style="margin:0">🛒</button>
        </div>
        <div style="position:absolute;top:60px;left:12px;width:min(250px,38vw)">
          <div class="g-panel" style="padding:10px 12px">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px"><b id="gdLvl"></b><span id="gdClock" style="color:#d8d0ff"></span></div>
            <div style="height:6px;border-radius:4px;background:rgba(255,255,255,.1);margin:6px 0 8px;overflow:hidden"><div id="gdXp" style="height:100%;width:0;background:linear-gradient(90deg,#a8ffb0,#ffe7a6);transition:width .5s"></div></div>
            <div id="gdQhead" style="font-size:12px;color:var(--muted);cursor:pointer;user-select:none">📜 Задания ▾</div>
            <div id="gdQuests"></div>
          </div>
        </div>
        <div id="gdBar" style="position:absolute;left:50%;bottom:12px;transform:translateX(-50%);max-width:96vw"></div>
      </div>`);
      this.ctx.ui.appendChild(this.el);
      $('#gdShop', this.el).onclick = () => this.openShop();
      this.qOpen = !this.ctx.me.touch || innerWidth > 900;
      $('#gdQhead', this.el).onclick = () => { this.qOpen = !this.qOpen; this.updateUI(); };
    }
    updateUI() {
      const S = this.S; if (!S) return;
      const inv = Object.keys(PLANTS).filter((k) => S.fruit[k] > 0).map((k) => `<span title="${PLANTS[k].fruit}">${PLANTS[k].icon}${S.fruit[k]}</span>`).join('');
      $('#gdInv', this.el).innerHTML = `${inv}<b style="color:#ffe7a6">✦ ${S.sparks}</b>`;
      $('#gdLvl', this.el).textContent = `🏝 Остров · ур. ${S.lvl}${S.lvl >= MAX_LVL ? ' (макс)' : ''}`;
      $('#gdXp', this.el).style.width = S.lvl >= MAX_LVL ? '100%' : `${(S.xp / xpNeed(S.lvl)) * 100}%`;
      $('#gdQhead', this.el).textContent = `📜 Задания ${this.qOpen ? '▾' : '▸'}`;
      $('#gdQuests', this.el).innerHTML = this.qOpen ? S.quests.map((q) => `<div style="margin-top:8px;font-size:12.5px;${q.done ? 'color:#a8ffb0' : ''}">${q.done ? '✓ ' : ''}${esc(q.text)} <span style="float:right;color:#ffe7a6">+${q.reward}✦</span>
        <div style="height:4px;border-radius:3px;background:rgba(255,255,255,.08);margin-top:4px;overflow:hidden"><div style="height:100%;width:${(q.have / q.n) * 100}%;background:${q.done ? '#a8ffb0' : '#ffcf7a'}"></div></div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${q.have} / ${q.n}</div></div>`).join('') : '';
      const bar = $('#gdBar', this.el);
      const seedsHtml = Object.keys(PLANTS).filter((k) => this.unlocked(k) && (S.seeds[k] > 0 || k === this.seed)).map((k) => `<button class="gdb ${this.mode === 'garden' && this.seed === k ? 'on' : ''}" data-seed="${k}" title="${PLANTS[k].n}"><span>${PLANTS[k].icon}</span><small>${S.seeds[k]}</small></button>`).join('');
      const decHtml = Object.keys(DECOR).filter((k) => (S.decor[k] || 0) > 0).map((k) => `<button class="gdb ${this.mode === 'decor' && this.decorPick === k ? 'on' : ''}" data-decor="${k}" title="${DECOR[k].n}"><span>${DECOR[k].icon}</span><small>${S.decor[k]}</small></button>`).join('');
      const key = seedsHtml + decHtml + this.mode;
      if (bar._key === key) return; bar._key = key;
      bar.innerHTML = `<div class="g-panel gd-bar" style="display:flex;gap:6px;align-items:center;justify-content:center">
        <span class="gd-lbl" style="font-size:12px;color:var(--muted);margin-right:4px">семена</span>${seedsHtml}
        <span style="width:1px;height:30px;background:var(--line);margin:0 6px"></span>
        <button class="gdb ${this.mode === 'decor' && !this.decorPick ? 'on' : ''}" data-mode="decor" title="Режим украшений"><span>🏮</span><small>укр.</small></button>${decHtml}
      </div>`;
      bar.querySelectorAll('[data-seed]').forEach((b) => (b.onclick = () => { this.seed = b.dataset.seed; this.mode = 'garden'; this.decorPick = null; SFX.play('click'); this.updateUI(); }));
      bar.querySelectorAll('[data-decor]').forEach((b) => (b.onclick = () => { this.mode = 'decor'; this.decorPick = b.dataset.decor; SFX.play('click'); this.updateUI(); }));
      bar.querySelector('[data-mode]').onclick = () => { this.mode = this.mode === 'decor' ? 'garden' : 'decor'; this.decorPick = null; SFX.play('click'); this.updateUI(); if (this.mode === 'decor') this.ctx.toast('Режим украшений: выбери украшение и нажми на клетку. Нажми на украшение, чтобы убрать.', 3500); };
    }
    openShop() {
      const S = this.S; if (!S) return;
      const back = h(`<div class="modal-back"><div class="panel" style="max-width:600px;max-height:88vh;display:flex;flex-direction:column">
        <h2 style="font-family:var(--script);font-weight:400;font-size:44px;margin:0">Лавка</h2>
        <p style="margin:0 0 10px">У вас <b style="color:#ffe7a6">✦ ${S.sparks}</b> · остров ${S.lvl} ур.</p>
        <div class="scroll-y" style="flex:1;min-height:0">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px" id="items"></div>
          <div style="margin-top:14px;font-size:12.5px;color:var(--muted);text-align:left;line-height:1.7" id="zoo"></div>
        </div>
        <button class="btn ghost" id="close">Закрыть</button></div></div>`);
      const items = $('#items', back);
      const add = (kind, id, icon, name, price, lvl) => {
        const locked = lvl > S.lvl, poor = S.sparks < price;
        const el = h(`<button class="role" style="cursor:pointer;text-align:center;color:inherit;font:inherit;${locked || poor ? 'opacity:.45' : ''}"><div style="font-size:30px">${locked ? '🔒' : icon}</div><div style="font-size:13px;margin:4px 0">${name}</div><b style="color:#ffe7a6">${locked ? `ур. ${lvl}` : `✦ ${price}`}</b></button>`);
        el.onclick = () => { if (locked || poor) { SFX.play('fail'); return; } this.act({ a: 'buy', kind, id }); back.remove(); };
        items.appendChild(el);
      };
      for (const k of Object.keys(PLANTS)) add('seed', k, PLANTS[k].icon, `Семечко: ${PLANTS[k].n}`, SEED_PRICE[k], PLANTS[k].lvl);
      for (const k of Object.keys(DECOR)) add('decor', k, DECOR[k].icon, DECOR[k].n, DECOR[k].price, DECOR[k].lvl);
      $('#zoo', back).innerHTML = '<b>Ночные гости:</b><br>' + Object.entries(CREATURES).map(([k, c]) => `${this.has(k) ? '💛' : this.unlocked(c.want) ? '·' : '🔒'} ${c.n} — любит ${PLANTS[c.want].icon} ${PLANTS[c.want].fruit}${this.has(k) ? ` <span style="color:#a8ffb0">(${c.bonus})</span>` : ''}`).join('<br>');
      $('#close', back).onclick = () => back.remove();
      document.body.appendChild(back);
    }

    // ============ Кадр ============
    frame(dt, t) {
      if (this.ctx.isHost && this.S) this.hostTick(dt);
      else if (this.S) this.S.tod = (this.S.tod + dt / CYCLE) % 1;
      this.parts.update(dt);
      for (const s of [this.me, this.peer]) { s.x = lerp(s.x, s.tx, Math.min(1, dt * 3)); s.y = lerp(s.y, s.ty, Math.min(1, dt * 3)); }
      const clock = $('#gdClock', this.el);
      if (clock && this.S) { const n = nightAmt(this.S.tod); const txt = `${n > 0.6 ? '🌙' : n > 0 ? (this.S.tod > 0.8 ? '🌅' : '🌇') : '☀️'} день ${this.S.day || 1}`; if (clock.textContent !== txt) clock.textContent = txt; }
      this.render(dt, t);
    }

    render(dt, t) {
      const st = this.st, g = st.g, S = this.S;
      const night = S ? nightAmt(S.tod) : 0;
      st.screen(); g.fillStyle = '#000'; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      const x0 = st.x0, y0 = st.y0, x1 = st.x1, y1 = st.y1;
      const day = ['#7fc8ff', '#c6e6ff', '#ffe7cf'], nightC = ['#070a26', '#141542', '#2c1d4f'], dusk = ['#5a4a9a', '#ff9a8b', '#ffc78a'];
      const mid = Math.sin(night * Math.PI);
      const col = (i) => (night < 0.5 ? mixColor(day[i], dusk[i], Math.min(1, mid)) : mixColor(nightC[i], dusk[i], Math.min(1, mid)));
      const sky = g.createLinearGradient(0, y0, 0, y1);
      sky.addColorStop(0, col(0)); sky.addColorStop(0.55, col(1)); sky.addColorStop(1, col(2));
      g.fillStyle = sky; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (night > 0) { for (const s of this.skyStars) { g.globalAlpha = night * (0.5 + Math.sin(t * 2 + s.ph) * 0.4); g.fillStyle = '#fff'; g.fillRect(s.x, s.y, s.r, s.r); } g.globalAlpha = 1; }
      if (S) {
        const a = S.tod * TAU - Math.PI / 2;
        const sx = W / 2 + Math.cos(a - Math.PI / 2) * 700, sy = 620 + Math.sin(a - Math.PI / 2) * 520;
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, sx, sy, 160, '#ffd27a', 0.6 * (1 - night)); Glow.draw(g, sx, sy, 40, '#fff6d0', 1 - night);
        const mx = W / 2 - Math.cos(a - Math.PI / 2) * 700, my = 620 - Math.sin(a - Math.PI / 2) * 520;
        Glow.draw(g, mx, my, 120, '#b8c8ff', 0.5 * night);
        g.globalCompositeOperation = 'source-over';
        if (night > 0) { g.globalAlpha = night; g.fillStyle = '#f2f0ff'; g.beginPath(); g.arc(mx, my, 26, 0, TAU); g.fill(); g.fillStyle = mixColor('#141542', '#2c1d4f', 0.5); g.beginPath(); g.arc(mx + 10, my - 6, 22, 0, TAU); g.fill(); g.globalAlpha = 1; }
      }
      for (const c of this.clouds) {
        c.x += c.v * dt; if (c.x > W + 300) c.x = -300;
        g.globalAlpha = 0.55 * (1 - night * 0.7);
        g.fillStyle = night > 0.5 ? '#6c6aa0' : '#ffffff';
        for (const [dx, dy, r] of [[0, 0, 40], [40, -14, 46], [84, 0, 38], [42, 12, 40]]) { g.beginPath(); g.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
      }
      if (!S) return;
      this.drawIsland(g, t, night);
      if (night > 0) { g.fillStyle = `rgba(12,10,48,${0.42 * night})`; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
      g.save(); g.globalCompositeOperation = 'lighter';
      S.tiles.forEach((tl, idx) => {
        const c = tileC(idx);
        if (tl.p && tl.p.g >= 1) Glow.draw(g, c.x, c.y - 30, 50 + Math.sin(t * 3 + idx) * 6, PLANTS[tl.p.type].col, 0.25 + night * 0.45);
        if (tl.d === 'lantern') Glow.draw(g, c.x, c.y - 62, 100, '#ffb84d', 0.12 + night * 0.4);
        if (tl.d === 'mushrooms') Glow.draw(g, c.x, c.y - 10, 70, '#7dffd8', 0.2 + night * 0.6);
        if (tl.d === 'arch') Glow.draw(g, c.x, c.y - 70, 60, '#ffb3d6', night * 0.5);
        if (tl.d === 'starlamp') Glow.draw(g, c.x, c.y - 70, 130, '#cfe0ff', 0.2 + night * 0.6);
      });
      for (const s of S.fstars) { const c = tileC(s.idx), bob = Math.sin(t * 3 + s.id) * 6; Glow.draw(g, c.x, c.y - 44 + bob, 46, '#ffe7a6', 0.9); Glow.draw(g, c.x, c.y - 44 + bob, 16, '#ffffff', 1); }
      if (night > 0.2) for (const f of this.flies) { f.ph += dt * f.sp; const fx = f.x + Math.sin(f.ph) * 40, fy = f.y + Math.cos(f.ph * 1.3) * 26; Glow.draw(g, fx, fy, 12, '#e8ff9a', night * (0.5 + Math.sin(t * 5 + f.ph * 3) * 0.5)); }
      for (let i = this.streaks.length - 1; i >= 0; i--) {
        const s = this.streaks[i]; s.t += dt * 1.6;
        if (s.t >= 1) { this.streaks.splice(i, 1); this.parts.emit(s.tx, s.ty, { n: 24, speed: 160, life: 0.9, size: 9, color: ['#fff3c4', '#ffd27a'] }); continue; }
        const x = lerp(s.x, s.tx, s.t), y = lerp(s.y, s.ty, s.t);
        Glow.draw(g, x, y, 30, '#fff3c4', 1);
        g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (s.x - s.tx) * 0.15, y + (s.y - s.ty) * 0.15); g.stroke();
      }
      for (const [s, c] of [[this.peer, '#ff9ccd'], [this.me, '#ffd27a']]) {
        const bob = Math.sin(t * 3 + c.length) * 6;
        Glow.draw(g, s.x, s.y + bob, 46, c, 0.9); Glow.draw(g, s.x, s.y + bob, 14, '#ffffff', 1);
        if (Math.random() < 0.4) this.parts.emit(s.x, s.y + bob, { n: 1, speed: 20, life: 0.9, size: 6, color: c, vy: 20 });
      }
      g.restore();
      for (const s of S.fstars) { const c = tileC(s.idx), bob = Math.sin(t * 3 + s.id) * 6; g.save(); g.translate(c.x, c.y - 44 + bob); g.rotate(t * 0.8); drawGlyph(g, 'star', 0, 0, 30, '#fff8dc', 3); g.restore(); }
      for (const [s, name] of [[this.peer, this.ctx.peer.name], [this.me, this.ctx.me.name]]) { g.font = '600 13px Comfortaa'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText(name, s.x, s.y - 26); }
      this.parts.draw(g);
      if (S.rain > 0) {
        g.strokeStyle = 'rgba(200,225,255,0.35)'; g.lineWidth = 1.2; g.beginPath();
        for (const r of this.rainDrops) { r.y += dt * 700 * r.s; r.x -= dt * 80; if (r.y > H) { r.y = -20; r.x = rand(0, W + 100); } g.moveTo(r.x, r.y); g.lineTo(r.x - 3, r.y + 18 * r.s); }
        g.stroke();
      }
      g.textAlign = 'center';
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i]; f.t += dt; if (f.t > 1.8) { this.floats.splice(i, 1); continue; }
        g.globalAlpha = Math.min(1, (1.8 - f.t) * 2); g.font = f.small ? '600 18px Comfortaa' : '700 24px Comfortaa';
        g.lineWidth = 5; g.strokeStyle = 'rgba(30,20,60,0.6)'; g.strokeText(f.text, f.x, f.y - f.t * 40);
        g.fillStyle = '#fff6d6'; g.fillText(f.text, f.x, f.y - f.t * 40); g.globalAlpha = 1;
      }
    }

    drawIsland(g, t) {
      const S = this.S;
      const L = tileTop(0, N), R = tileTop(N, 0), B = tileTop(N, N);
      g.save();
      const rock = g.createLinearGradient(0, B.y, 0, B.y + 300);
      rock.addColorStop(0, '#6b4f7a'); rock.addColorStop(0.5, '#3b2a52'); rock.addColorStop(1, '#1a1230');
      g.fillStyle = rock; g.beginPath();
      g.moveTo(L.x, L.y); g.lineTo(L.x, L.y + DEPTH);
      [[L.x + 60, L.y + 120], [L.x + 170, L.y + 200], [B.x - 160, B.y + 230], [B.x - 40, B.y + 330], [B.x + 30, B.y + 260], [B.x + 150, B.y + 210], [R.x - 120, R.y + 150], [R.x - 20, R.y + 80]].forEach(([x, y]) => g.lineTo(x, y));
      g.lineTo(R.x, R.y + DEPTH); g.lineTo(R.x, R.y); g.lineTo(B.x, B.y); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2;
      for (let k = 1; k <= 4; k++) { g.beginPath(); g.moveTo(L.x + k * 40, L.y + DEPTH + k * 30); g.quadraticCurveTo(B.x, B.y + DEPTH + k * 45, R.x - k * 40, R.y + DEPTH + k * 30); g.stroke(); }
      g.globalCompositeOperation = 'lighter';
      Glow.draw(g, B.x - 40, B.y + 320, 50, '#9f8bff', 0.6 + Math.sin(t * 2) * 0.3);
      if (S.lvl >= 5) for (let k = 0; k < 4; k++) Glow.draw(g, B.x - 140 + k * 70, B.y + 150 + (k % 2) * 40, 24, k % 2 ? '#b8f5ff' : '#d9b8ff', 0.5 + Math.sin(t * 2 + k) * 0.3);
      g.globalCompositeOperation = 'source-over';
      const side = (ax, ay, bx, by, c1, c2) => { const gr = g.createLinearGradient(0, ay, 0, ay + DEPTH); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(bx, by + DEPTH); g.lineTo(ax, ay + DEPTH); g.closePath(); g.fill(); };
      side(L.x, L.y, B.x, B.y, '#8a5f43', '#5b3b2b');
      side(B.x, B.y, R.x, R.y, '#6e4a35', '#432a1f');
      g.fillStyle = '#4fae66'; g.beginPath(); g.moveTo(L.x, L.y); g.lineTo(B.x, B.y); g.lineTo(R.x, R.y); g.lineTo(R.x, R.y + 8); g.lineTo(B.x, B.y + 8); g.lineTo(L.x, L.y + 8); g.closePath(); g.fill();
      // лианы растут с уровнем
      g.strokeStyle = '#3f9a52'; g.lineWidth = 3;
      for (let k = 0; k < Math.min(8, S.lvl); k++) { const f = (k + 0.5) / 8, ax = lerp(L.x, B.x, f), ay = lerp(L.y, B.y, f) + DEPTH; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + Math.sin(t + k) * 8, ay + 30, ax + Math.sin(t * 0.8 + k) * 4, ay + 40 + (k % 3) * 22); g.stroke(); }
      g.restore();
      const wf = tileTop(N, N);
      const wg = g.createLinearGradient(0, wf.y, 0, wf.y + 380);
      wg.addColorStop(0, 'rgba(160,220,255,0.85)'); wg.addColorStop(1, 'rgba(160,220,255,0)');
      g.fillStyle = wg; g.fillRect(wf.x - 54, wf.y - 2, 40, 380);
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) { const yy = wf.y + ((t * 160 + k * 70) % 360); g.beginPath(); g.moveTo(wf.x - 50 + k * 7, yy); g.lineTo(wf.x - 50 + k * 7, yy + 26); g.stroke(); }
      const sorted = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sorted.push([i, j]);
      sorted.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
      for (const [i, j] of sorted) {
        const idx = j * N + i, p = tileTop(i, j), tl = S.tiles[idx];
        const water = WATER.has(idx);
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + TW / 2, p.y + TH / 2); g.lineTo(p.x, p.y + TH); g.lineTo(p.x - TW / 2, p.y + TH / 2); g.closePath();
        if (water) {
          const wgr = g.createLinearGradient(p.x, p.y, p.x, p.y + TH); wgr.addColorStop(0, '#5fc6e8'); wgr.addColorStop(1, '#2f87b8');
          g.fillStyle = wgr; g.fill();
          g.strokeStyle = `rgba(255,255,255,${0.25 + Math.sin(t * 2 + idx) * 0.15})`; g.lineWidth = 1.5;
          g.beginPath(); g.ellipse(p.x + Math.sin(t + idx) * 10, p.y + TH / 2, 18 + Math.sin(t * 2 + idx) * 4, 5, 0, 0, TAU); g.stroke();
          if (S.lvl >= 3 && idx === 6 * N + 6) { g.fillStyle = '#5cc96b'; g.beginPath(); g.ellipse(p.x - 14, p.y + TH / 2 + 4, 14, 6, 0, 0.3, TAU - 0.3); g.fill(); g.fillStyle = '#ffb3d6'; g.beginPath(); g.arc(p.x - 14, p.y + TH / 2, 4, 0, TAU); g.fill(); }
        } else {
          const base = (i + j) % 2 ? '#6fd07d' : '#64c573';
          g.fillStyle = tl.p ? (tl.p.w > 0 ? '#5a4a3e' : '#7a5c44') : base; g.fill();
          if (tl.p) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(p.x - TW / 2 + k * TW / 8, p.y + TH / 2 - k * TH / 8); g.lineTo(p.x + k * TW / 8, p.y + TH - k * TH / 8); g.stroke(); } }
          g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.stroke();
          if (!tl.p) {
            g.strokeStyle = '#4fae63'; g.lineWidth = 2; g.lineCap = 'round';
            for (const [gx, gy, gl, gp] of this.grass[idx]) { const bx = p.x + gx * TW * 0.9, by = p.y + TH / 2 + gy * TH * 0.9, sw = Math.sin(t * 2 + gp * 6 + i) * 3; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + sw * 0.5, by - gl / 2, bx + sw, by - gl); g.stroke(); }
            if (S.lvl >= 2 && this.grass[idx][0][3] > 0.75) { const [gx, gy] = this.grass[idx][1]; g.fillStyle = ['#ffb3d6', '#fff2a8', '#c9b8ff'][idx % 3]; g.beginPath(); g.arc(p.x + gx * TW * 0.8, p.y + TH / 2 + gy * TH * 0.8 - 6, 3.5, 0, TAU); g.fill(); }
          }
        }
        if (this.hoverIdx === idx && !this.ctx.me.touch) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + TW / 2, p.y + TH / 2); g.lineTo(p.x, p.y + TH); g.lineTo(p.x - TW / 2, p.y + TH / 2); g.closePath(); g.fill(); }
        const c = { x: p.x, y: p.y + TH / 2 };
        if (tl.p) this.drawPlant(g, c.x, c.y, tl.p, t, idx);
        if (tl.d) this.drawDecor(g, c.x, c.y, tl.d, t);
        for (const cr of S.creatures) if (cr.idx === idx) this.drawCreatureAt(g, cr, t, false);
        for (const v of S.visitors) if (v.idx === idx) this.drawCreatureAt(g, v, t, true);
      }
    }

    drawCreatureAt(g, cr, t, visitor) {
      const key = visitor ? 'v' + cr.id : cr.type;
      const c = tileC(cr.idx);
      const s = this.cr[key] ||= { x: c.x, y: c.y };
      s.x = lerp(s.x, c.x, 0.04); s.y = lerp(s.y, c.y, 0.04);
      drawCreature(g, cr.type, s.x, s.y, t, s.x < c.x - 1);
      if (visitor) {
        const want = CREATURES[cr.type].want, bx = s.x + 30, by = s.y - 100 + Math.sin(t * 2) * 4;
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.ellipse(bx, by, 26, 22, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(bx - 16, by + 22, 5, 0, TAU); g.fill(); g.beginPath(); g.arc(bx - 22, by + 31, 3, 0, TAU); g.fill();
        g.font = '24px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(PLANTS[want].icon, bx, by + 1); g.textBaseline = 'alphabetic';
      }
    }

    drawPlant(g, x, y, p, t, idx) {
      const P = PLANTS[p.type], gr = clamp(p.g, 0, 1), sw = Math.sin(t * 1.8 + idx) * 2;
      const stage = gr >= 1 ? 3 : gr > 0.6 ? 2 : gr > 0.25 ? 1 : 0;
      g.save(); g.translate(x, y); g.scale(1.3, 1.3);
      if (p.w > 0) { g.fillStyle = 'rgba(120,190,255,0.25)'; g.beginPath(); g.ellipse(0, 4, 30, 12, 0, 0, TAU); g.fill(); }
      const leaf = (lx, ly, a, s, c = '#5cc96b') => { g.save(); g.translate(lx, ly); g.rotate(a); g.fillStyle = c; g.beginPath(); g.ellipse(s * 0.6, 0, s * 0.6, s * 0.24, 0, 0, TAU); g.fill(); g.restore(); };
      if (stage === 0) { leaf(0, 0, -2.4 + sw * 0.02, 12); leaf(0, 0, -0.7 + sw * 0.02, 12); g.restore(); return; }
      const hgt = stage === 1 ? 22 : stage === 2 ? 36 : 44;
      if (p.type === 'pumpkin') {
        leaf(-6, -2, -2.8, 18, '#4ea85a'); leaf(6, -2, -0.3, 18, '#4ea85a');
        const s = stage === 1 ? 0.35 : stage === 2 ? 0.65 : 1;
        g.fillStyle = '#ff9a2e';
        for (const dx of [-10, 0, 10]) { g.beginPath(); g.ellipse(dx * s, -12 * s, 12 * s, 14 * s, 0, 0, TAU); g.fill(); }
        g.fillStyle = '#4f8a3a'; g.fillRect(-2, -30 * s, 4, 8 * s);
        if (stage === 3) drawGlyph(g, 'star', 0, -12, 14, '#fff3c4', 2);
      } else {
        const h2 = p.type === 'sun' ? hgt * 1.35 : hgt;
        g.strokeStyle = '#3f9a52'; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sw, -h2 / 2, sw * 1.5, -h2); g.stroke();
        leaf(0, -h2 * 0.3, -2.6, 14); leaf(0, -h2 * 0.45, -0.5, 14);
        const tx = sw * 1.5, ty = -h2;
        if (stage === 2) { g.fillStyle = mixColor(P.col, '#3f9a52', 0.5); g.beginPath(); g.ellipse(tx, ty, 6, 8, 0, 0, TAU); g.fill(); }
        if (stage === 3) {
          if (p.type === 'bell') for (const [bx, by] of [[-9, 4], [0, -2], [9, 4]]) { g.fillStyle = '#9fc4ff'; g.beginPath(); g.moveTo(tx + bx - 6, ty + by + 8); g.quadraticCurveTo(tx + bx, ty + by - 10, tx + bx + 6, ty + by + 8); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(tx + bx, ty + by + 9, 1.8, 0, TAU); g.fill(); }
          if (p.type === 'berry') for (const [bx, by] of [[-8, 2], [6, -4], [2, 8], [10, 6], [-3, -8]]) { g.fillStyle = '#ff6fa8'; g.beginPath(); g.arc(tx + bx, ty + by, 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(tx + bx - 1.5, ty + by - 1.5, 1.5, 0, TAU); g.fill(); }
          if (p.type === 'cotton') for (const [bx, by, r] of [[-7, 0, 8], [6, -3, 9], [0, -10, 8], [2, 6, 7]]) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(tx + bx, ty + by, r, 0, TAU); g.fill(); }
          if (p.type === 'fire') { for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + t; g.fillStyle = k % 2 ? '#ff5a3d' : '#ffb23d'; g.beginPath(); g.ellipse(tx + Math.cos(a) * 7, ty + Math.sin(a) * 7, 7, 4, a, 0, TAU); g.fill(); } g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(tx, ty, 4, 0, TAU); g.fill(); }
          if (p.type === 'sun') { for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + Math.sin(t) * 0.1; g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(tx + Math.cos(a) * 12, ty + Math.sin(a) * 12, 7, 3.5, a, 0, TAU); g.fill(); } g.fillStyle = '#8a5a2a'; g.beginPath(); g.arc(tx, ty, 8, 0, TAU); g.fill(); }
          if (p.type === 'crystal') { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.45; g.save(); g.translate(tx, ty + 6); g.rotate(a + Math.PI / 2); const cg = g.createLinearGradient(-5, 0, 5, 0); cg.addColorStop(0, '#8a68c8'); cg.addColorStop(0.5, '#e8d8ff'); cg.addColorStop(1, '#a88be8'); g.fillStyle = cg; g.beginPath(); g.moveTo(-5, 0); g.lineTo(-5, -14 - (k % 2) * 6); g.lineTo(0, -22 - (k % 2) * 6); g.lineTo(5, -14 - (k % 2) * 6); g.lineTo(5, 0); g.fill(); g.restore(); } }
        }
      }
      if (stage === 3) { const sp = (t * 2 + idx) % 1; g.globalCompositeOperation = 'lighter'; Glow.draw(g, Math.sin(idx + t) * 10, -hgt - 10 - sp * 20, 6, '#fff6c0', 1 - sp); g.globalCompositeOperation = 'source-over'; }
      g.restore();
    }

    drawDecor(g, x, y, d, t) {
      const night = nightAmt(this.S.tod);
      g.save(); g.translate(x, y);
      switch (d) {
        case 'lantern':
          g.strokeStyle = '#3a2e3e'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -56); g.quadraticCurveTo(0, -66, 10, -66); g.stroke();
          g.fillStyle = '#ffcf7a'; roundRect(g, 4, -66, 14, 18, 4); g.fill();
          g.fillStyle = '#c84a3e'; g.beginPath(); g.moveTo(2, -66); g.lineTo(11, -74); g.lineTo(20, -66); g.fill();
          break;
        case 'mushrooms':
          for (const [mx, s, c] of [[-14, 1, '#7dffd8'], [6, 1.3, '#a88bff'], [18, 0.8, '#7dffd8']]) {
            g.fillStyle = '#f2ead8'; g.fillRect(mx - 2 * s, -12 * s, 4 * s, 12 * s);
            g.fillStyle = c; g.beginPath(); g.ellipse(mx, -12 * s, 9 * s, 6 * s, 0, Math.PI, 0); g.fill();
            g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(mx - 3 * s, -15 * s, 1.5 * s, 0, TAU); g.fill();
          }
          break;
        case 'bench':
          g.fillStyle = '#8a5a3a'; g.fillRect(-26, -16, 52, 7); g.fillRect(-26, -30, 52, 5);
          g.fillStyle = '#5e3b26'; g.fillRect(-22, -9, 4, 10); g.fillRect(18, -9, 4, 10); g.fillRect(-22, -30, 3, 16); g.fillRect(19, -30, 3, 16);
          break;
        case 'arch':
          g.strokeStyle = '#7a5a8a'; g.lineWidth = 5; g.beginPath(); g.moveTo(-28, 0); g.lineTo(-28, -50); g.arc(0, -50, 28, Math.PI, 0); g.lineTo(28, 0); g.stroke();
          for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI; g.fillStyle = k % 2 ? '#ffb3d6' : '#fff0f6'; g.beginPath(); g.arc(Math.cos(a) * 28, -50 + Math.sin(a) * 28, 5, 0, TAU); g.fill(); }
          for (const yy of [-10, -28]) for (const xx of [-28, 28]) { g.fillStyle = '#ffb3d6'; g.beginPath(); g.arc(xx, yy, 4, 0, TAU); g.fill(); }
          break;
        case 'swing': {
          g.strokeStyle = '#6b4a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-22, -70); g.lineTo(22, -70); g.lineTo(30, 0); g.stroke();
          const a = Math.sin(t * 1.6) * 0.35;
          g.save(); g.translate(0, -70); g.rotate(a);
          g.strokeStyle = '#d8c8a8'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-10, 0); g.lineTo(-10, 50); g.moveTo(10, 0); g.lineTo(10, 50); g.stroke();
          g.fillStyle = '#c94850'; g.fillRect(-14, 48, 28, 6); g.restore();
          break;
        }
        case 'telescope':
          g.strokeStyle = '#4a3e5a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, 0); g.lineTo(0, -26); g.lineTo(12, 0); g.moveTo(0, -26); g.lineTo(0, 0); g.stroke();
          g.save(); g.translate(0, -30); g.rotate(-0.6 + Math.sin(t * 0.3) * 0.1);
          g.fillStyle = '#c9a65a'; roundRect(g, -20, -6, 44, 12, 4); g.fill(); g.fillStyle = '#8a6a2a'; g.fillRect(20, -8, 6, 16);
          g.restore();
          if (night > 0.5) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 40, -70, 20, '#cfe0ff', night * (0.5 + Math.sin(t * 4) * 0.5)); g.globalCompositeOperation = 'source-over'; }
          break;
        case 'starlamp':
          g.strokeStyle = '#5a5a8a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -60); g.stroke();
          g.save(); g.translate(0, -72); g.rotate(t * 0.5); drawGlyph(g, 'star', 0, 0, 30, '#fff3c4', 3); g.restore();
          break;
      }
      g.restore();
    }

    resync() { if (this.S) this.push(); }
    destroy() { this.st.destroy(); if (this.ctx.isHost) this.save(); }
  }

  function drawCreature(g, type, x, y, t, flip) {
    g.save(); g.translate(x, y); g.scale(flip ? -1.35 : 1.35, 1.35);
    const hop = Math.abs(Math.sin(t * 3)) * 3;
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, 2, 18, 6, 0, 0, TAU); g.fill();
    g.translate(0, -hop);
    const eye = (ex, ey, r = 2.4) => { g.fillStyle = '#1b1430'; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 0.8, ey - 0.8, r * 0.35, 0, TAU); g.fill(); };
    const blush = (bx, by) => { g.fillStyle = 'rgba(255,120,160,0.45)'; g.beginPath(); g.ellipse(bx, by, 3.5, 2, 0, 0, TAU); g.fill(); };
    switch (type) {
      case 'fox':
        g.fillStyle = '#ff9a4a'; g.beginPath(); g.ellipse(-16, -12, 14, 7, -0.6 + Math.sin(t * 4) * 0.2, 0, TAU); g.fill();
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, -26, -20, 14, '#ffe7a6', 0.9); g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#ff8a3d'; g.beginPath(); g.ellipse(0, -12, 13, 10, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(8, -26, 10, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(2, -32); g.lineTo(4, -44); g.lineTo(10, -34); g.moveTo(10, -34); g.lineTo(15, -44); g.lineTo(17, -31); g.fill();
        g.fillStyle = '#fff3e6'; g.beginPath(); g.ellipse(12, -22, 6, 4, 0, 0, TAU); g.fill();
        eye(10, -28); blush(15, -24);
        break;
      case 'owl':
        g.fillStyle = '#9b86c9'; g.beginPath(); g.ellipse(0, -18, 14, 18, 0, 0, TAU); g.fill();
        g.fillStyle = '#d9cdf5'; g.beginPath(); g.ellipse(0, -13, 9, 11, 0, 0, TAU); g.fill();
        g.fillStyle = '#9b86c9'; g.beginPath(); g.moveTo(-12, -30); g.lineTo(-10, -40); g.lineTo(-4, -33); g.moveTo(12, -30); g.lineTo(10, -40); g.lineTo(4, -33); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -26, 5, 0, TAU); g.arc(5, -26, 5, 0, TAU); g.fill();
        eye(-5, -26, 2.8); eye(5, -26, 2.8);
        g.fillStyle = '#ffb35c'; g.beginPath(); g.moveTo(-2, -21); g.lineTo(2, -21); g.lineTo(0, -17); g.fill();
        break;
      case 'bunny':
        g.fillStyle = '#fbf6ff'; g.beginPath(); g.ellipse(0, -12, 12, 11, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(4, -24, 9, 0, TAU); g.fill();
        for (const ex of [0, 7]) { g.fillStyle = '#fbf6ff'; g.beginPath(); g.ellipse(ex, -42, 3.5, 11, ex ? 0.2 : -0.1, 0, TAU); g.fill(); g.fillStyle = '#ffc2d8'; g.beginPath(); g.ellipse(ex, -42, 1.6, 8, ex ? 0.2 : -0.1, 0, TAU); g.fill(); }
        eye(7, -25); blush(10, -21);
        g.globalCompositeOperation = 'lighter'; drawGlyph(g, 'star', -10, -16, 8, '#ffe7a6', 1.5); g.globalCompositeOperation = 'source-over';
        break;
      case 'jelly': {
        g.translate(0, -14 + Math.sin(t * 2) * 6);
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, -10, 34, '#b8f5ff', 0.5); g.globalCompositeOperation = 'source-over';
        g.strokeStyle = 'rgba(200,240,255,0.7)'; g.lineWidth = 2;
        for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 5, -4); g.quadraticCurveTo(k * 5 + Math.sin(t * 3 + k) * 5, 8, k * 5, 18); g.stroke(); }
        g.fillStyle = 'rgba(225,248,255,0.85)'; g.beginPath(); g.ellipse(0, -8, 16, 14, 0, Math.PI, 0); g.closePath(); g.fill();
        eye(-5, -10); eye(5, -10); blush(-9, -6); blush(9, -6);
        break;
      }
      case 'dragon':
        g.fillStyle = '#4fc9a8';
        g.beginPath(); g.ellipse(-14, -10, 10, 4, -0.4, 0, TAU); g.fill();
        g.save(); g.translate(-2, -24); g.rotate(-0.5 + Math.sin(t * 6) * 0.3); g.fillStyle = '#8ff0d4'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-16, -12); g.lineTo(-6, 2); g.fill(); g.restore();
        g.fillStyle = '#4fc9a8'; g.beginPath(); g.ellipse(0, -14, 12, 10, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(9, -26, 9, 0, TAU); g.fill();
        g.fillStyle = '#ffe7a6'; g.beginPath(); g.moveTo(6, -34); g.lineTo(8, -40); g.lineTo(10, -34); g.fill();
        eye(12, -28); blush(15, -23);
        if (Math.sin(t * 1.3) > 0.85) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 24, -24, 12, '#ff9a4a', 1); g.globalCompositeOperation = 'source-over'; }
        break;
      case 'deer':
        g.strokeStyle = '#8a6a4a'; g.lineWidth = 3; g.lineCap = 'round';
        for (const lx of [-8, -3, 4, 9]) { g.beginPath(); g.moveTo(lx, -10); g.lineTo(lx + Math.sin(t * 3 + lx) * 1.5, 0); g.stroke(); }
        g.fillStyle = '#c8a07a'; g.beginPath(); g.ellipse(0, -16, 14, 8, 0, 0, TAU); g.fill();
        g.fillStyle = '#fff6e8'; for (const [sx, sy] of [[-6, -18], [0, -20], [5, -17]]) { g.beginPath(); g.arc(sx, sy, 1.6, 0, TAU); g.fill(); }
        g.fillStyle = '#c8a07a'; g.beginPath(); g.moveTo(8, -20); g.lineTo(12, -32); g.lineTo(16, -30); g.lineTo(14, -18); g.fill();
        g.beginPath(); g.ellipse(15, -34, 7, 6, 0.3, 0, TAU); g.fill();
        g.strokeStyle = '#e8e0ff'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(13, -39); g.lineTo(10, -50); g.moveTo(11, -45); g.lineTo(6, -48); g.moveTo(17, -39); g.lineTo(20, -50); g.moveTo(19, -45); g.lineTo(24, -47); g.stroke();
        g.globalCompositeOperation = 'lighter'; Glow.draw(g, 15, -48, 14, '#cfe0ff', 0.6 + Math.sin(t * 2) * 0.3); g.globalCompositeOperation = 'source-over';
        eye(17, -35, 2); blush(20, -31);
        break;
      case 'cat':
        g.strokeStyle = '#3a3460'; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-12, -8); g.quadraticCurveTo(-24, -14 + Math.sin(t * 3) * 4, -20, -30); g.stroke();
        g.fillStyle = '#3a3460'; g.beginPath(); g.ellipse(0, -12, 12, 10, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(6, -26, 10, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(-1, -32); g.lineTo(0, -42); g.lineTo(6, -35); g.moveTo(8, -35); g.lineTo(13, -42); g.lineTo(14, -31); g.fill();
        g.fillStyle = '#ffe7a6'; g.beginPath(); g.arc(3, -27, 2.4, 0, TAU); g.arc(10, -27, 2.4, 0, TAU); g.fill();
        g.globalCompositeOperation = 'lighter';
        for (const [sx, sy] of [[-4, -14], [4, -10], [-6, -6]]) Glow.draw(g, sx, sy, 5, '#cfe0ff', 0.6 + Math.sin(t * 4 + sx) * 0.4);
        g.globalCompositeOperation = 'source-over';
        blush(12, -22);
        break;
    }
    g.restore();
  }

  const css = document.createElement('style');
  css.textContent = `.gdb{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font:inherit;padding:0}
  .gdb span{font-size:22px;line-height:1}.gdb small{font-size:11px;color:#d8d0ff;margin-top:2px}
  .gdb.on{background:rgba(255,210,140,.25);border-color:#ffd27a;box-shadow:0 0 16px rgba(255,200,120,.35)}
  .gd-bar{flex-wrap:nowrap;overflow-x:auto;max-width:94vw}
  @media (max-height:520px){.gdb{width:40px;height:40px;border-radius:11px;flex:none}.gdb span{font-size:17px}.gdb small{font-size:10px}.gd-lbl{display:none}.gd-bar{padding:6px 8px!important}}`;
  document.head.appendChild(css);
})();
