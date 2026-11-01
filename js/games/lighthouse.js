'use strict';
// «Маяк» — Капитан ведёт лодку сквозь шторм в темноте, Смотритель освещает путь лучом маяка.
// Кампания из 5 ночей с новыми угрозами, улучшения между ночами, потом — бесконечный шторм.
(() => {
  const W = 1600, H = 900;
  const LH = { x: 210, y: 450 };
  const HARBOR = 190;

  const NIGHTS = [
    { name: 'Тихая ночь', goal: 3, feats: [], desc: 'Скалы прячутся в темноте. Спасите 3 лодки.' },
    { name: 'Ледяной дрейф', goal: 4, feats: ['ice'], desc: 'С севера плывут льдины. Спасите 4 лодки.' },
    { name: 'Водовороты', goal: 4, feats: ['ice', 'whirl'], desc: 'Море закручивается в воронки — не подплывайте к центру!' },
    { name: 'Щупальца глубин', goal: 5, feats: ['ice', 'whirl', 'tent'], desc: 'Где пузырится вода — скоро поднимется щупальце…' },
    { name: 'Туман', goal: 5, feats: ['ice', 'whirl', 'tent', 'fog'], desc: 'Туман скрывает море даже от Смотрителя.' },
  ];
  const ENDLESS = { name: 'Вечный шторм', goal: Infinity, feats: ['ice', 'whirl', 'tent'], desc: 'Шторм больше не кончится. Как долго вы продержитесь?' };
  const UPGRADES = {
    lantern: { icon: '🏮', name: 'Яркий фонарь', desc: 'Лодка освещает больше вокруг себя' },
    hull: { icon: '🛡️', name: 'Крепкий корпус', desc: '+1 жизнь лодке' },
    engine: { icon: '⚙️', name: 'Мощный мотор', desc: 'Лодка плывёт на 15% быстрее' },
    lens: { icon: '🔆', name: 'Линзы маяка', desc: 'Луч тратит на 30% меньше энергии' },
    wide: { icon: '📐', name: 'Широкий луч', desc: 'Луч маяка на 30% шире' },
    bell: { icon: '🔔', name: 'Большой колокол', desc: 'Колокол успокаивает море дольше' },
    net: { icon: '🪢', name: 'Длинный канат', desc: 'Лодки цепляются издалека' },
  };
  const nightDef = (n) => (n <= NIGHTS.length ? NIGHTS[n - 1] : ENDLESS);

  GAMES.lighthouse = {
    id: 'lighthouse', title: 'Маяк', icon: '🌊', color: '#5fe0d2',
    tagline: 'Пять штормовых ночей и один луч света на двоих',
    landscape: true,
    roles: [
      { id: 'captain', name: 'Капитан', icon: '⛵', desc: 'Ведёшь лодку сквозь ночной шторм. Почти ничего не видно — только то, что освещает маяк.', ctrl: { pc: 'стрелки или WASD — куда плыть (лодка сама развернётся), или зажми мышь — плыть к курсору', touch: 'джойстик слева — куда плыть' } },
      { id: 'keeper', name: 'Смотритель', icon: '🗼', desc: 'Видишь всё море сверху, но тускло. Ведёшь луч маяка, предупреждаешь о скалах, воронках и щупальцах.', ctrl: { pc: 'зажми мышь — светить лучом, Пробел — колокол', touch: 'держи палец — светить лучом, кнопка 🔔 — колокол' } },
    ],
    rules: [
      '5 ночей, у каждой своя опасность: льдины, водовороты, щупальца, туман. Спасите нужное число лодок — и ночь пройдена.',
      'Подплыви к потерявшейся лодке — она поплывёт следом. Доставь к маяку: чем больше лодок за раз, тем больше очков.',
      'Между ночами выбирайте улучшения: фонарь, мотор, линзы, канат…',
      'После пятой ночи — Вечный шторм на рекорд. Говорите в Discord — без слов Капитан слеп!',
    ],
    info() { const b = Store.get('lh_best', 0), n = Store.get('lh_night', 0); return b ? `рекорд ${b}${n ? ` · ночь ${n}` : ''}` : 'кооператив · 5 ночей'; },
    create(ctx) { return new Lighthouse(ctx); },
  };

  class Lighthouse {
    constructor(ctx) {
      this.ctx = ctx;
      this.cap = ctx.role === 'captain';
      this.st = new Stage(ctx.canvas, W, H);
      this.dark = document.createElement('canvas'); this.dg = this.dark.getContext('2d');
      this.parts = new Particles(); this.foam = new Particles();
      this.keys = new Keys();
      this.rocksNight = 0; this.genRocks(1);
      this.glints = Array.from({ length: 260 }, () => ({ x: rand(0, W), y: rand(0, H), l: rand(10, 34), ph: rand(0, TAU) }));
      this.rain = Array.from({ length: 140 }, () => ({ x: rand(-200, W), y: rand(0, H), s: rand(0.7, 1.3) }));
      this.fogBlobs = Array.from({ length: 14 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(160, 300), v: rand(8, 22) }));
      this.boat = this.newBoat();
      this.rBoat = { ...this.boat };
      this.beam = { ang: 0, on: false, energy: 1, lock: false };
      this.rBeam = { ang: 0, on: false };
      this.flashT = 0; this.shake = 0; this.sendT = 0; this.wT = 0;
      this.pointer = null;
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) this.newGame();
      ctx.loop((dt, t) => this.frame(dt, t));
    }
    newBoat() { return { x: 380, y: 450, a: 0, vx: 0, vy: 0, inv: 2 }; }
    up(k) { return (this.W && this.W.up && this.W.up[k]) || 0; }

    genRocks(night) {
      if (this.rocksNight === night) return;
      this.rocksNight = night;
      const r = RNG(this.ctx.seed + night * 101); this.rocks = [];
      const want = Math.min(28, 16 + night * 2);
      let tries = 0;
      while (this.rocks.length < want && tries++ < 800) {
        const x = r.range(80, W - 60), y = r.range(60, H - 60), rad = r.range(22, 50);
        if (dist(x, y, LH.x, LH.y) < HARBOR + rad + 30) continue;
        if (dist(x, y, 380, 450) < 140) continue;
        if (this.rocks.some((o) => dist(o.x, o.y, x, y) < o.r + rad + 70)) continue;
        const n = r.int(7, 10), poly = [];
        for (let i = 0; i < n; i++) poly.push(r.range(0.75, 1.15));
        this.rocks.push({ x, y, r: rad, poly, ph: r.range(0, TAU) });
      }
    }

    // ================= Хост: мир =================
    newGame() {
      this.W = { night: 1, score: 0, up: {}, phase: 'play', id: 1, offers: [] };
      this.startNight(1);
    }
    startNight(n) {
      const Wd = this.W, def = nightDef(n);
      Object.assign(Wd, { night: n, phase: 'play', level: 1, levelT: 45, nextWave: 8, nextTent: 6, slow: 0, lights: [], lost: [], ice: [], waves: [], whirl: [], tent: [], nr: 0, goal: def.goal, rescued: Wd.rescued || 0 });
      Wd.maxHull = 3 + (Wd.up.hull || 0); Wd.hull = Wd.maxHull;
      this.genRocks(n);
      for (let i = 0; i < 9; i++) this.spawnLight();
      for (let i = 0; i < 3; i++) this.spawnLost();
      if (def.feats.includes('ice')) for (let i = 0; i < 2; i++) this.spawnIce();
      if (def.feats.includes('whirl')) { const k = n >= 6 ? 3 : 2; for (let i = 0; i < k; i++) { const p = this.freeSpot(140); Wd.whirl.push({ id: Wd.id++, x: p.x, y: p.y, r: rand(70, 100) }); } }
      Store.set('lh_night', Math.max(Store.get('lh_night', 0), Math.min(n, 5)));
      this.event({ a: 'night', n });
      this.sendWorld();
    }
    freeSpot(minR = 40) {
      for (let k = 0; k < 60; k++) {
        const x = rand(420, W - 80), y = rand(80, H - 80);
        if (dist(x, y, LH.x, LH.y) < HARBOR + 60) continue;
        if (this.rocks.some((o) => dist(o.x, o.y, x, y) < o.r + minR)) continue;
        if ((this.W.whirl || []).some((o) => dist(o.x, o.y, x, y) < o.r * 2 + 40)) continue;
        return { x, y };
      }
      return { x: W / 2, y: H / 2 };
    }
    spawnLight() { const p = this.freeSpot(); this.W.lights.push({ id: this.W.id++, x: p.x, y: p.y }); }
    spawnLost() { const p = this.freeSpot(60); this.W.lost.push({ id: this.W.id++, x: p.x, y: p.y, f: 0 }); }
    spawnIce() {
      const fromTop = Math.random() < 0.5;
      this.W.ice.push({ id: this.W.id++, x: rand(500, W - 100), y: fromTop ? -40 : H + 40, vx: rand(-25, 25), vy: (fromTop ? 1 : -1) * rand(25, 55), r: rand(20, 34), rot: rand(0, TAU) });
    }

    hostUpdate(dt) {
      const Wd = this.W; if (Wd.phase !== 'play') return;
      const def = nightDef(Wd.night), feats = def.feats;
      const k = Wd.slow > 0 ? 0.25 : 1;
      Wd.slow = Math.max(0, Wd.slow - dt);
      Wd.levelT -= dt;
      if (Wd.levelT <= 0) { Wd.levelT = 45; Wd.level++; this.event({ a: 'level', l: Wd.level }); }
      const lvl = Wd.level + (Wd.night - 1) * 0.5;
      if (feats.includes('ice')) {
        if (Wd.ice.length < Math.min(1 + lvl, 9) && Math.random() < dt * 0.5) this.spawnIce();
      }
      for (let i = Wd.ice.length - 1; i >= 0; i--) {
        const o = Wd.ice[i]; o.x += o.vx * dt * k; o.y += o.vy * dt * k; o.rot += dt * 0.2 * k;
        if (o.y < -80 || o.y > H + 80 || o.x < -80 || o.x > W + 80) Wd.ice.splice(i, 1);
      }
      Wd.nextWave -= dt;
      if (Wd.nextWave <= 0) { Wd.nextWave = Math.max(5, 15 - lvl * 2) + rand(0, 4); Wd.waves.push({ id: Wd.id++, x: W + 60, sp: 110 + lvl * 12 }); }
      for (let i = Wd.waves.length - 1; i >= 0; i--) { const w = Wd.waves[i]; w.x -= w.sp * dt * k; if (w.x < -80) Wd.waves.splice(i, 1); }
      for (const o of Wd.whirl) o.rot = (o.rot || 0) + dt * 1.6 * k;
      // щупальца
      if (feats.includes('tent')) {
        Wd.nextTent -= dt;
        if (Wd.nextTent <= 0) { Wd.nextTent = Math.max(4, 10 - lvl) + rand(0, 3); const p = this.freeSpot(70); Wd.tent.push({ id: Wd.id++, x: p.x, y: p.y, t: 0, a: rand(0, TAU) }); }
        for (let i = Wd.tent.length - 1; i >= 0; i--) { const o = Wd.tent[i]; o.t += dt * k; if (o.t > 6.5) Wd.tent.splice(i, 1); }
      }
      if (Math.random() < dt * (0.03 + lvl * 0.015 + (feats.includes('fog') ? 0.03 : 0))) this.event({ a: 'flash' });
      const b = this.cap ? this.boat : this.rBoat;
      for (let i = Wd.lights.length - 1; i >= 0; i--) {
        const L = Wd.lights[i];
        if (dist(L.x, L.y, b.x, b.y) < 40) { Wd.lights.splice(i, 1); Wd.score += 10; this.event({ a: 'pick', x: L.x, y: L.y }); setTimeout(() => this.W && this.W.phase === 'play' && this.spawnLight(), 2500); }
      }
      const hookR = 46 + (Wd.up.net || 0) * 30;
      let prev = b, chainN = 0;
      for (const L of Wd.lost) if (!L.f && dist(L.x, L.y, b.x, b.y) < hookR) { L.f = 1; this.event({ a: 'hook', x: L.x, y: L.y }); }
      for (const L of Wd.lost) {
        if (!L.f) continue;
        chainN++;
        const d = dist(L.x, L.y, prev.x, prev.y), want = 44;
        if (d > want) { const m = (d - want) / d; L.x += (prev.x - L.x) * m * Math.min(1, dt * 6); L.y += (prev.y - L.y) * m * Math.min(1, dt * 6); }
        L.a = Math.atan2(prev.y - L.y, prev.x - L.x);
        prev = L;
      }
      if (chainN && dist(b.x, b.y, LH.x, LH.y) < HARBOR) {
        const n = chainN, pts = 50 * n * n;
        Wd.score += pts; Wd.rescued += n; Wd.nr += n;
        Wd.lost = Wd.lost.filter((L) => !L.f);
        this.event({ a: 'saved', n, pts });
        for (let i = 0; i < n; i++) setTimeout(() => this.W && this.W.phase === 'play' && this.spawnLost(), 2500 + i * 1800);
        if (Wd.nr >= Wd.goal) this.nightWon();
      }
      this.wT += dt;
      if (this.wT > 1 / 15) { this.wT = 0; this.sendWorld(); }
    }
    nightWon() {
      const Wd = this.W;
      Wd.score += 100 * Wd.night;
      if (Wd.night >= NIGHTS.length) { Wd.phase = 'won'; this.sendWorld(); this.event({ a: 'won' }); return; }
      Wd.phase = 'upgrade';
      Wd.offers = RNG(Date.now()).shuffle(Object.keys(UPGRADES)).slice(0, 3);
      this.sendWorld();
      this.event({ a: 'upgrade' });
    }
    pickUpgrade(id, who) {
      const Wd = this.W; if (Wd.phase !== 'upgrade' || !Wd.offers.includes(id)) return;
      Wd.up[id] = (Wd.up[id] || 0) + 1;
      Wd.phase = 'between';
      this.event({ a: 'picked', id, who });
      setTimeout(() => this.startNight(Wd.night + 1), 1400);
    }
    sendWorld() {
      const Wd = this.W, r = (v) => Math.round(v);
      this.ctx.send({
        a: 'w', s: Wd.score, h: Wd.hull, mh: Wd.maxHull, l: Wd.level, n: Wd.night, ph: Wd.phase, sl: +Wd.slow.toFixed(1), rs: Wd.rescued, nr: Wd.nr, gl: Wd.goal === Infinity ? -1 : Wd.goal, up: Wd.up, of: Wd.offers,
        L: Wd.lights.map((o) => [o.id, r(o.x), r(o.y)]),
        B: Wd.lost.map((o) => [o.id, r(o.x), r(o.y), o.f, +(o.a || 0).toFixed(2)]),
        I: Wd.ice.map((o) => [o.id, r(o.x), r(o.y), r(o.r), +o.rot.toFixed(2)]),
        V: Wd.waves.map((o) => [o.id, r(o.x)]),
        Q: Wd.whirl.map((o) => [o.id, r(o.x), r(o.y), r(o.r), +(o.rot || 0).toFixed(2)]),
        T: Wd.tent.map((o) => [o.id, r(o.x), r(o.y), +o.t.toFixed(2), +o.a.toFixed(2)]),
      });
    }
    event(e) { this.ctx.send({ a: 'ev', e }); this.onEvent(e); }
    onEvent(e) {
      switch (e.a) {
        case 'flash': this.flashT = 1; setTimeout(() => SFX.play('thunder'), 300 + Math.random() * 600); break;
        case 'pick': SFX.play('coin'); this.parts.emit(e.x, e.y, { n: 16, speed: 140, life: 0.9, size: 10, color: ['#ffe7a6', '#ffc35c'] }); break;
        case 'hook': SFX.play('pop'); this.parts.emit(e.x, e.y, { n: 10, speed: 90, life: 0.8, size: 8, color: '#9fe7ff' }); break;
        case 'saved': SFX.play('win'); this.parts.emit(LH.x, LH.y, { n: 50, speed: 260, life: 1.6, size: 12, color: ['#ffe7a6', '#9fe7ff', '#ffb3d6'] }); this.ctx.toast(`⛵ Спасено: ${e.n} · +${e.pts}`); break;
        case 'level': SFX.play('bellLow'); this.ctx.toast(`🌩 Шторм усиливается — сила ${e.l}`); break;
        case 'hit': SFX.play('hit'); this.shake = 0.5; break;
        case 'bell': SFX.play('bell'); this.bellFx = 1; break;
        case 'night': this.onNight(e.n); break;
        case 'upgrade': SFX.play('win'); this.showUpgrade(); break;
        case 'picked': SFX.play('chime'); this.hideUpgrade(); this.ctx.toast(`${UPGRADES[e.id].icon} ${UPGRADES[e.id].name}!`); break;
        case 'won': this.showWon(); break;
        case 'over': this.gameOver(); break;
      }
    }
    hostHit() {
      const Wd = this.W; if (Wd.phase !== 'play') return;
      Wd.hull--;
      this.event({ a: 'hit' });
      if (Wd.hull <= 0) { Wd.phase = 'over'; this.sendWorld(); this.event({ a: 'over' }); }
    }
    hostBell() { if (this.W.slow > 0 || this.W.phase !== 'play') return; this.W.slow = 4 + (this.W.up.bell || 0) * 2.5; this.event({ a: 'bell' }); }

    // ================= Сообщения =================
    onMsg(d) {
      switch (d.a) {
        case 'b': Object.assign(this.rBoat, d.b); break;
        case 'k': this.rBeam.ang = d.ang; this.rBeam.on = d.on; break;
        case 'w': this.applyWorld(d); break;
        case 'ev': this.onEvent(d.e); break;
        case 'hit': if (this.ctx.isHost) this.hostHit(); break;
        case 'bell': if (this.ctx.isHost) this.hostBell(); break;
        case 'pickup': if (this.ctx.isHost) this.pickUpgrade(d.id, 'peer'); break;
        case 'again': if (this.ctx.isHost) this.restart(); break;
        case 'endless': if (this.ctx.isHost) this.goEndless(); break;
      }
    }
    applyWorld(d) {
      this.W = this.W || {};
      Object.assign(this.W, { score: d.s, hull: d.h, maxHull: d.mh, level: d.l, night: d.n, phase: d.ph, slow: d.sl, rescued: d.rs, nr: d.nr, goal: d.gl < 0 ? Infinity : d.gl, up: d.up, offers: d.of });
      this.genRocks(d.n);
      this.W.lights = d.L.map(([id, x, y]) => ({ id, x, y }));
      this.W.lost = d.B.map(([id, x, y, f, a]) => ({ id, x, y, f, a }));
      this.W.ice = d.I.map(([id, x, y, r, rot]) => ({ id, x, y, r, rot }));
      this.W.waves = d.V.map(([id, x]) => ({ id, x }));
      this.W.whirl = d.Q.map(([id, x, y, r, rot]) => ({ id, x, y, r, rot }));
      this.W.tent = d.T.map(([id, x, y, t, a]) => ({ id, x, y, t, a }));
    }
    restart() { this.W.rescued = 0; this.W.score = 0; this.W.up = {}; this.startNight(1); }
    goEndless() { if (this.W.phase === 'won') this.startNight(6); }

    onNight(n) {
      const def = nightDef(n);
      this.overShown = false; this.wonShown = false;
      this.el.querySelector('#lhOver')?.remove(); this.el.querySelector('#lhWon')?.remove(); this.hideUpgrade();
      this.boat = this.newBoat(); this.beam.energy = 1;
      SFX.play('bellLow');
      const intro = $('#lhIntro', this.el);
      intro.innerHTML = `<div style="font-size:15px;color:#bfe9ff;letter-spacing:2px">${n <= NIGHTS.length ? `НОЧЬ ${n} ИЗ ${NIGHTS.length}` : 'ПОСЛЕ ПЯТОЙ НОЧИ'}</div>
        <div style="font-family:var(--script);font-size:60px;text-shadow:0 0 30px #5fe0d2">${def.name}</div>
        <div style="color:#cfe;font-size:15px;max-width:520px;margin:0 auto">${def.desc}</div>
        ${n === 1 ? `<div style="color:#ffe7a6;font-size:13px;margin-top:10px">${this.cap ? 'Ты — Капитан: слушай Смотрителя' : (this.ctx.me.touch ? 'Ты — Смотритель: держи палец на экране, чтобы светить' : 'Ты — Смотритель: зажми мышь, чтобы светить')}</div>` : ''}`;
      intro.style.opacity = 1; this.introT = 0;
    }
    showUpgrade() {
      this.hideUpgrade();
      const of = this.W.offers || [];
      const p = h(`<div id="lhUp" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,8,20,.55)"><div class="panel" style="max-width:720px;text-align:center">
        <div style="font-size:14px;color:#bfe9ff;letter-spacing:2px">НОЧЬ ${this.W.night} ПРОЙДЕНА ✦ +${100 * this.W.night}</div>
        <h2 style="margin:4px 0 6px;font-family:var(--script);font-weight:400;font-size:46px">Рассвет. Выберите улучшение</h2>
        <p style="color:var(--muted);margin:0 0 14px">Договоритесь в Discord — выбирает тот, кто нажмёт первым</p>
        <div class="roles" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${of.map((id) => `<div class="role" data-up="${id}" style="cursor:pointer"><div class="ico">${UPGRADES[id].icon}</div><h3>${UPGRADES[id].name}</h3><p>${UPGRADES[id].desc}${this.up(id) ? ` <b style="color:#ffe7a6">(уже ×${this.up(id)})</b>` : ''}</p></div>`).join('')}</div>
      </div></div>`);
      p.querySelectorAll('[data-up]').forEach((el) => (el.onclick = () => { SFX.play('click'); if (this.ctx.isHost) this.pickUpgrade(el.dataset.up, 'me'); else this.ctx.send({ a: 'pickup', id: el.dataset.up }); }));
      this.el.appendChild(p);
    }
    hideUpgrade() { this.el.querySelector('#lhUp')?.remove(); }
    showWon() {
      if (this.wonShown) return; this.wonShown = true;
      SFX.play('win'); setTimeout(() => SFX.play('chime'), 900);
      const sc = this.W.score, best = Store.get('lh_best', 0);
      if (sc > best) Store.set('lh_best', sc);
      for (let i = 0; i < 6; i++) setTimeout(() => this.parts.emit(rand(300, 1300), rand(200, 600), { n: 40, speed: 300, life: 1.6, size: 12, color: ['#ffe7a6', '#9fe7ff', '#ffb3d6'] }), i * 300);
      const p = h(`<div id="lhWon" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,16,.45)"><div class="panel" style="max-width:420px;text-align:center">
        <div style="font-size:54px">🌅</div>
        <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:48px">Все пять ночей позади!</h2>
        <p style="color:var(--muted)">Маяк выстоял. Вы спасли ${this.W.rescued} лодок.</p>
        <div style="font:700 46px Comfortaa;color:#ffe7a6;text-shadow:0 0 24px #ffc35c">${sc}</div>
        <button class="btn" id="endless">Вечный шторм ⛈ (на рекорд)</button><button class="btn ghost" id="again">Начать заново</button></div></div>`);
      $('#endless', p).onclick = () => (this.ctx.isHost ? this.goEndless() : this.ctx.send({ a: 'endless' }));
      $('#again', p).onclick = () => (this.ctx.isHost ? this.restart() : this.ctx.send({ a: 'again' }));
      this.el.appendChild(p);
    }
    gameOver() {
      if (this.overShown) return; this.overShown = true;
      SFX.play('fail');
      const sc = this.W.score, best = Store.get('lh_best', 0), isRec = sc > best;
      if (isRec) Store.set('lh_best', sc);
      const p = h(`<div id="lhOver" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,16,.5)"><div class="panel" style="max-width:380px;text-align:center">
        <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:46px">Шторм победил…</h2>
        <p style="color:var(--muted);margin:6px 0">${this.W.night <= NIGHTS.length ? `ночь ${this.W.night} из ${NIGHTS.length}` : 'Вечный шторм'} · но вы держались вместе</p>
        <div style="font:700 50px Comfortaa;color:#ffe7a6;text-shadow:0 0 24px #ffc35c">${sc}</div>
        <p style="color:var(--muted)">спасено лодок: ${this.W.rescued || 0}${isRec ? '<br><b style="color:#7dffb5">✦ Новый рекорд! ✦</b>' : `<br>рекорд: ${best}`}</p>
        <button class="btn" id="again">Ещё раз с первой ночи</button></div></div>`);
      $('#again', p).onclick = () => (this.ctx.isHost ? this.restart() : this.ctx.send({ a: 'again' }));
      this.el.appendChild(p);
    }

    // ================= Ввод =================
    bindInput() {
      const c = this.ctx.canvas;
      if (this.cap) {
        // Капитан: зажатая мышь — плыть к курсору
        const set = (e) => { if (this.steer) this.steer = this.st.pt(e); };
        c.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; c.setPointerCapture(e.pointerId); this.steer = this.st.pt(e); });
        c.addEventListener('pointermove', set);
        const up = () => { this.steer = null; };
        c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      } else {
        const set = (e) => { this.pointer = this.st.pt(e); };
        c.addEventListener('pointerdown', (e) => { c.setPointerCapture(e.pointerId); set(e); this.holding = true; });
        c.addEventListener('pointermove', set);
        const up = () => { this.holding = false; };
        c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      }
    }
    buildUI() {
      const touch = this.ctx.me.touch;
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel" style="display:flex;gap:16px;font-size:14px;align-items:center;white-space:nowrap">
          <span id="lhNight" style="color:#bfe9ff"></span><span id="lhGoal"></span><span id="lhHull"></span><span id="lhScore" style="font-weight:700;color:#ffe7a6"></span>
        </div></div>
        ${this.cap ? '' : `<div style="position:absolute;right:16px;bottom:16px;display:flex;flex-direction:column;align-items:flex-end;gap:10px">
          <button class="tp-btn" id="bell" style="width:78px;height:78px;cursor:pointer">🔔</button>
          <div class="g-panel" style="width:180px;padding:8px 12px"><div style="font-size:11px;color:var(--muted);margin-bottom:5px">энергия луча</div><div style="height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden"><div id="lhEn" style="height:100%;width:100%;background:linear-gradient(90deg,#ffcf7a,#fff3c4);box-shadow:0 0 10px #ffd27a"></div></div></div>
        </div>`}
        <div id="lhIntro" style="position:absolute;left:50%;top:20%;transform:translateX(-50%);text-align:center;pointer-events:none;transition:opacity 1s;width:90%"></div>
      </div>`);
      this.ctx.ui.appendChild(this.el);
      if (!this.cap) $('#bell', this.el).onclick = () => this.ringBell();
      if (this.cap && touch) this.pad = new TouchPad(this.ctx.ui, []);
    }
    ringBell() { if (this.ctx.isHost) this.hostBell(); else this.ctx.send({ a: 'bell' }); }

    // ================= Кадр =================
    frame(dt, t) {
      const Wd = this.W;
      this.introT = (this.introT || 0) + dt;
      const intro = $('#lhIntro', this.el); if (intro && this.introT > 4.5) intro.style.opacity = 0;
      if (this.ctx.isHost && Wd) this.hostUpdate(dt);
      const playing = Wd && Wd.phase === 'play';
      if (playing) { if (this.cap) this.updateBoat(dt, t); else this.updateBeam(dt); }
      this.sendT += dt;
      if (this.sendT > 1 / 30) {
        this.sendT = 0;
        if (this.cap) { const b = this.boat; this.ctx.send({ a: 'b', b: { x: Math.round(b.x), y: Math.round(b.y), a: +b.a.toFixed(2), sp: Math.round(Math.hypot(b.vx, b.vy)) } }); }
        else this.ctx.send({ a: 'k', ang: +this.beam.ang.toFixed(3), on: this.beam.on });
      }
      if (!this.cap) { const sb = this.sBoat ||= { ...this.rBoat }; sb.x = lerp(sb.x, this.rBoat.x, 0.3); sb.y = lerp(sb.y, this.rBoat.y, 0.3); sb.a += angDiff(sb.a, this.rBoat.a) * 0.3; }
      else this.sBeamAng = (this.sBeamAng ?? this.rBeam.ang) + angDiff(this.sBeamAng ?? this.rBeam.ang, this.rBeam.ang) * 0.3;
      this.flashT = Math.max(0, this.flashT - dt * 2.5);
      this.shake = Math.max(0, this.shake - dt);
      this.bellFx = Math.max(0, (this.bellFx || 0) - dt * 0.6);
      this.parts.update(dt); this.foam.update(dt);
      if (Wd && Wd.phase === 'over' && !this.overShown) this.gameOver();
      if (Wd && Wd.phase === 'won' && !this.wonShown) this.showWon();
      if (Wd && Wd.phase === 'upgrade' && !$('#lhUp', this.el)) this.showUpgrade();
      this.updateHUD();
      this.render(dt, t);
    }

    updateBoat(dt) {
      const b = this.boat, k = this.keys, pad = this.pad, Wd = this.W;
      // простое управление: куда показываешь — туда и плывёт, лодка разворачивается сама
      let dx = 0, dy = 0;
      if (k.any('KeyW', 'ArrowUp')) dy -= 1;
      if (k.any('KeyS', 'ArrowDown')) dy += 1;
      if (k.any('KeyA', 'ArrowLeft')) dx -= 1;
      if (k.any('KeyD', 'ArrowRight')) dx += 1;
      if (pad && (pad.ax || pad.ay)) { dx = pad.ax; dy = pad.ay; }
      if (this.steer) { const sx = this.steer.x - b.x, sy = this.steer.y - b.y, sd = Math.hypot(sx, sy); if (sd > 24) { dx = sx / sd * Math.min(1, sd / 120); dy = sy / sd * Math.min(1, sd / 120); } }
      const mag = Math.min(1, Math.hypot(dx, dy));
      let thrust = 0;
      if (mag > 0.15) { const want = Math.atan2(dy, dx); b.a += angDiff(b.a, want) * Math.min(1, dt * 7); thrust = mag * (Math.abs(angDiff(b.a, want)) < 1.2 ? 1 : 0.35); }
      const eng = 1 + this.up('engine') * 0.15, maxSp = 220 * eng;
      b.vx += Math.cos(b.a) * thrust * 520 * eng * dt; b.vy += Math.sin(b.a) * thrust * 520 * eng * dt;
      const calm = Wd.slow > 0 ? 0.3 : 1;
      for (const w of Wd.waves || []) {
        const wx = w.x + Math.sin(b.y * 0.012 + w.id) * 40;
        if (Math.abs(b.x - wx) < 34) { const p = calm * 520 * dt; b.vx -= p; b.vy += Math.sin(b.y * 0.02) * p * 0.3; }
      }
      for (const o of Wd.whirl || []) {
        const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy), R = o.r * 2.2;
        if (d < R && d > 1) {
          const f = (1 - d / R) * 420 * calm * dt;
          b.vx += (dx / d) * f + (-dy / d) * f * 0.9; b.vy += (dy / d) * f + (dx / d) * f * 0.9;
          if (d < 26 && b.inv <= 0) { b.vx = (-dx / d) * 420; b.vy = (-dy / d) * 420; this.boatHit(); }
        }
      }
      for (const o of Wd.tent || []) {
        if (o.t < 2 || o.t > 5.6) continue;
        for (const p of tentPoints(o)) if (dist(b.x, b.y, p[0], p[1]) < p[2] + 14 && b.inv <= 0) { b.vx += (b.x - o.x) * 2; b.vy += (b.y - o.y) * 2; this.boatHit(); break; }
      }
      const drag = Math.exp((thrust ? -1.9 : -3.2) * dt); b.vx *= drag; b.vy *= drag;
      const sp = Math.hypot(b.vx, b.vy); if (sp > maxSp) { const m = Math.max(maxSp, sp * 0.96) / sp; b.vx *= m; b.vy *= m; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.x = clamp(b.x, 20, W - 20); b.y = clamp(b.y, 20, H - 20);
      b.inv = Math.max(0, b.inv - dt);
      const hit = (ox, oy, or) => {
        const d = dist(b.x, b.y, ox, oy), min = or + 16;
        if (d >= min) return;
        const nx = (b.x - ox) / (d || 1), ny = (b.y - oy) / (d || 1);
        b.x = ox + nx * min; b.y = oy + ny * min;
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; }
        if (-vn > 50 && b.inv <= 0) { this.parts.emit(b.x - nx * 16, b.y - ny * 16, { n: 18, speed: 160, life: 0.7, size: 5, color: '#e8f6ff', glow: false }); this.boatHit(); }
      };
      for (const r of this.rocks) hit(r.x, r.y, r.r * 0.95);
      for (const o of Wd.ice || []) hit(o.x, o.y, o.r);
      hit(LH.x, LH.y, 72);
      if (sp > 40 && Math.random() < dt * 30) this.foam.emit(b.x - Math.cos(b.a) * 20, b.y - Math.sin(b.a) * 20, { n: 1, speed: 20, life: 1.2, size: 6, color: 'rgba(220,240,255,0.5)', glow: false });
    }
    boatHit() {
      const b = this.boat; b.inv = 1.6; this.shake = 0.5;
      if (this.ctx.isHost) this.hostHit(); else { this.ctx.send({ a: 'hit' }); SFX.play('hit'); }
    }

    updateBeam(dt) {
      const bm = this.beam, k = this.keys;
      if (this.pointer) { const want = Math.atan2(this.pointer.y - LH.y, this.pointer.x - LH.x); bm.ang += angDiff(bm.ang, want) * Math.min(1, dt * 12); }
      const want = this.holding || k.any('ShiftLeft');
      if (bm.energy <= 0) bm.lock = true;
      if (bm.lock && bm.energy > 0.25) bm.lock = false;
      bm.on = want && !bm.lock;
      const drain = 0.16 * Math.pow(0.7, this.up('lens'));
      bm.energy = clamp(bm.energy + (bm.on ? -drain : 0.11) * dt, 0, 1);
      if (k.once('Space')) this.ringBell();
    }

    updateHUD() {
      const Wd = this.W; if (!Wd) return;
      const set = (id, s) => { const el = $(id, this.el); if (el && el.textContent !== s) el.textContent = s; };
      set('#lhNight', Wd.night <= NIGHTS.length ? `ночь ${Wd.night}/${NIGHTS.length}` : 'вечный шторм');
      set('#lhGoal', Wd.goal === Infinity ? `⛵ ${Wd.rescued}` : `⛵ ${Wd.nr}/${Wd.goal}`);
      set('#lhHull', '❤'.repeat(Math.max(0, Wd.hull)) + '♡'.repeat(Math.max(0, (Wd.maxHull || 3) - Wd.hull)));
      set('#lhScore', `✦ ${Wd.score}`);
      if (!this.cap) {
        const en = $('#lhEn', this.el); en.style.width = `${this.beam.energy * 100}%`; en.style.opacity = this.beam.lock ? 0.4 : 1;
        $('#bell', this.el).style.opacity = Wd.slow > 0 ? 0.4 : 1;
      }
    }

    // ================= Отрисовка =================
    render(dt, t) {
      const st = this.st, g = st.g, Wd = this.W || { lights: [], lost: [], ice: [], waves: [], whirl: [], tent: [] };
      const boat = this.cap ? this.boat : (this.sBoat || this.rBoat);
      const beamAng = this.cap ? (this.sBeamAng ?? 0) : this.beam.ang;
      const beamOn = this.cap ? this.rBeam.on : this.beam.on;
      const fog = nightDef(Wd.night || 1).feats.includes('fog');
      st.screen();
      g.fillStyle = '#020a10'; g.fillRect(0, 0, st.vw, st.vh);
      st.begin();
      if (this.shake > 0) g.translate(rand(-1, 1) * this.shake * 14, rand(-1, 1) * this.shake * 14);
      const x0 = st.x0, y0 = st.y0, x1 = st.x1, y1 = st.y1;
      const sea = g.createLinearGradient(0, y0, 0, y1);
      sea.addColorStop(0, '#0b3442'); sea.addColorStop(0.5, '#08283a'); sea.addColorStop(1, '#061b2a');
      g.fillStyle = sea; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.lineCap = 'round';
      for (const gl of this.glints) {
        const a = 0.5 + Math.sin(t * 1.5 + gl.ph) * 0.5;
        const gx = (gl.x - t * 18) % W, xx = gx < 0 ? gx + W : gx;
        g.strokeStyle = `rgba(150,220,235,${0.05 + a * 0.12})`; g.lineWidth = 2;
        g.beginPath(); g.moveTo(xx, gl.y); g.quadraticCurveTo(xx + gl.l / 2, gl.y - 5, xx + gl.l, gl.y); g.stroke();
      }
      this.foam.draw(g);
      g.strokeStyle = `rgba(255,230,160,${0.12 + Math.sin(t * 2) * 0.05})`; g.setLineDash([10, 14]); g.lineWidth = 2;
      g.beginPath(); g.arc(LH.x, LH.y, HARBOR, 0, TAU); g.stroke(); g.setLineDash([]);
      // водовороты
      for (const o of Wd.whirl || []) {
        const gr = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 1.4);
        gr.addColorStop(0, 'rgba(0,8,14,0.95)'); gr.addColorStop(0.5, 'rgba(10,50,70,0.5)'); gr.addColorStop(1, 'rgba(10,50,70,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(o.x, o.y, o.r * 1.4, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(190,240,255,0.35)'; g.lineWidth = 2.5;
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          for (let s = 0; s <= 30; s++) { const f = s / 30, a = (o.rot || 0) * -1 + k * (TAU / 4) + f * 5, r = o.r * 1.35 * (1 - f) + 6; const px = o.x + Math.cos(a) * r, py = o.y + Math.sin(a) * r; s ? g.lineTo(px, py) : g.moveTo(px, py); }
          g.stroke();
        }
      }
      for (const w of Wd.waves) {
        g.strokeStyle = 'rgba(210,245,255,0.5)'; g.lineWidth = 6;
        g.beginPath();
        for (let y = -20; y <= H + 20; y += 20) { const wx = w.x + Math.sin(y * 0.012 + w.id) * 40; y === -20 ? g.moveTo(wx, y) : g.lineTo(wx, y); }
        g.stroke();
        g.strokeStyle = 'rgba(120,200,230,0.25)'; g.lineWidth = 22; g.stroke();
      }
      for (const r of this.rocks) this.drawRock(g, r, t);
      for (const o of Wd.ice) {
        g.save(); g.translate(o.x, o.y); g.rotate(o.rot);
        const gr = g.createLinearGradient(-o.r, -o.r, o.r, o.r); gr.addColorStop(0, '#f0fbff'); gr.addColorStop(1, '#8fc4dc');
        g.fillStyle = gr; g.beginPath();
        for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, rr = o.r * (0.8 + ((i * 37) % 5) / 12); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.stroke();
        g.restore();
      }
      // щупальца
      for (const o of Wd.tent || []) this.drawTentacle(g, o, t);
      this.drawLighthouse(g, t);
      let prev = boat;
      g.strokeStyle = 'rgba(230,210,170,0.6)'; g.lineWidth = 2;
      for (const L of Wd.lost) { if (!L.f) continue; g.beginPath(); g.moveTo(prev.x, prev.y); g.quadraticCurveTo((prev.x + L.x) / 2, (prev.y + L.y) / 2 + 8, L.x, L.y); g.stroke(); prev = L; }
      for (const L of Wd.lost) this.drawBoat(g, L.x, L.y, L.a || 0, 0.7, '#6f86a3');
      if (!(boat.inv > 0 && Math.floor(t * 12) % 2)) this.drawBoat(g, boat.x, boat.y, boat.a, 1, '#9a5d3b');
      this.parts.draw(g);

      // темнота
      const dark = this.dark, dg = this.dg;
      if (dark.width !== this.ctx.canvas.width || dark.height !== this.ctx.canvas.height) { dark.width = this.ctx.canvas.width; dark.height = this.ctx.canvas.height; }
      dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over';
      dg.clearRect(0, 0, dark.width, dark.height);
      const darkA = this.cap ? 0.965 : fog ? 0.86 : 0.6;
      dg.fillStyle = `rgba(1,4,10,${darkA * (1 - this.flashT * 0.85)})`; dg.fillRect(0, 0, dark.width, dark.height);
      const s = st.dpr * st.scale; dg.setTransform(s, 0, 0, s, st.dpr * st.ox, st.dpr * st.oy);
      dg.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a = 1) => { const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.7})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.beginPath(); dg.arc(x, y, r, 0, TAU); dg.fill(); };
      hole(boat.x, boat.y, 105 + this.up('lantern') * 40);
      hole(LH.x, LH.y, 150, 0.9);
      for (const L of Wd.lost) hole(L.x, L.y, 26, 0.5);
      const spread = 1 + this.up('wide') * 0.3;
      if (beamOn) this.beamPath(dg, beamAng, spread, (gr) => { dg.fillStyle = gr; dg.fill(); }, 'rgba(0,0,0,');
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dark, 0, 0); g.restore();

      g.save(); g.globalCompositeOperation = 'lighter';
      if (beamOn) this.beamPath(g, beamAng, spread, (gr) => { g.fillStyle = gr; g.fill(); }, 'rgba(255,236,170,', 0.13);
      for (const L of Wd.lights) { const bob = Math.sin(t * 2 + L.id) * 4; Glow.draw(g, L.x, L.y + bob, 30, '#ffd27a', this.cap ? 0.75 : 0.95); g.fillStyle = '#fff7da'; g.beginPath(); g.arc(L.x, L.y + bob, 3.5, 0, TAU); g.fill(); }
      for (const L of Wd.lost) Glow.draw(g, L.x, L.y, 18, '#ffae5c', 0.4 + Math.max(0, Math.sin(t * 4 + L.id)) * 0.6);
      // предупреждение о щупальце — пузыри видны и Капитану
      for (const o of Wd.tent || []) if (o.t < 2) for (let k = 0; k < 3; k++) Glow.draw(g, o.x + Math.sin(t * 5 + k * 2) * 18, o.y + Math.cos(t * 4 + k) * 14, 10, '#9fe7ff', 0.35 * Math.sin((o.t / 2) * Math.PI));
      Glow.draw(g, boat.x + Math.cos(boat.a) * 14, boat.y + Math.sin(boat.a) * 14, 34, '#ffd89a', 0.9);
      Glow.draw(g, LH.x, LH.y - 6, 70, '#fff1b8', 0.8 + Math.sin(t * 3) * 0.1);
      if (this.bellFx > 0) { g.strokeStyle = `rgba(255,240,200,${this.bellFx * 0.6})`; g.lineWidth = 4; g.beginPath(); g.arc(LH.x, LH.y, (1 - this.bellFx) * 900, 0, TAU); g.stroke(); }
      g.restore();
      // туман
      if (fog) {
        for (const f of this.fogBlobs) {
          f.x += f.v * dt; if (f.x - f.r > W) f.x = -f.r;
          const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); gr.addColorStop(0, 'rgba(160,190,210,0.16)'); gr.addColorStop(1, 'rgba(160,190,210,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, f.r, 0, TAU); g.fill();
        }
      }
      g.strokeStyle = 'rgba(170,210,235,0.22)'; g.lineWidth = 1.3;
      g.beginPath();
      for (const r of this.rain) {
        r.y += dt * 900 * r.s; r.x -= dt * 260 * r.s;
        if (r.y > H + 20) { r.y = -20; r.x = rand(0, W + 300); }
        g.moveTo(r.x, r.y); g.lineTo(r.x - 9 * r.s, r.y + 30 * r.s);
      }
      g.stroke();
      if (this.flashT > 0.6) { g.fillStyle = `rgba(230,240,255,${(this.flashT - 0.6) * 0.8})`; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
    }

    drawTentacle(g, o, t) {
      if (o.t < 2) {
        g.strokeStyle = `rgba(160,230,255,${0.3 * Math.sin((o.t / 2) * Math.PI)})`; g.lineWidth = 2;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(o.x, o.y, 10 + ((t * 30 + k * 15) % 45), 0, TAU); g.stroke(); }
        return;
      }
      const pts = tentPoints(o);
      g.fillStyle = 'rgba(0,10,20,0.4)'; g.beginPath(); g.ellipse(o.x, o.y, 34, 22, 0, 0, TAU); g.fill();
      for (let i = pts.length - 1; i >= 0; i--) {
        const [x, y, r] = pts[i];
        const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
        gr.addColorStop(0, '#9a5aa8'); gr.addColorStop(1, '#4a1f5a');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        if (i % 2 === 0 && r > 6) { g.fillStyle = '#e8b8f0'; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.3, r * 0.25, 0, TAU); g.fill(); }
      }
    }

    beamPath(c, ang, spreadMul, fill, rgba, mul = 1) {
      for (const [spread, a] of [[0.26, 0.35], [0.19, 0.6], [0.12, 1]]) {
        const L = 1500, sp = spread * spreadMul;
        const gr = c.createRadialGradient(LH.x, LH.y, 0, LH.x, LH.y, L);
        gr.addColorStop(0, `${rgba}${a * mul})`); gr.addColorStop(0.5, `${rgba}${a * 0.8 * mul})`); gr.addColorStop(1, `${rgba}0)`);
        c.beginPath(); c.moveTo(LH.x, LH.y); c.arc(LH.x, LH.y, L, ang - sp, ang + sp); c.closePath();
        fill(gr);
      }
    }
    drawRock(g, r, t) {
      g.strokeStyle = `rgba(220,245,255,${0.18 + Math.sin(t * 2 + r.ph) * 0.08})`; g.lineWidth = 3;
      g.setLineDash([6, 10]); g.lineDashOffset = -t * 10;
      g.beginPath(); g.arc(r.x, r.y, r.r * 1.15 + Math.sin(t * 1.5 + r.ph) * 3, 0, TAU); g.stroke(); g.setLineDash([]);
      const gr = g.createLinearGradient(r.x - r.r, r.y - r.r, r.x + r.r, r.y + r.r);
      gr.addColorStop(0, '#59636f'); gr.addColorStop(0.5, '#2c333d'); gr.addColorStop(1, '#14181e');
      g.fillStyle = gr; g.beginPath();
      r.poly.forEach((k, i) => { const a = (i / r.poly.length) * TAU; const px = r.x + Math.cos(a) * r.r * k, py = r.y + Math.sin(a) * r.r * k; i ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,180,200,0.25)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.arc(r.x - r.r * 0.3, r.y - r.r * 0.3, r.r * 0.35, 0, TAU); g.fill();
    }
    drawLighthouse(g, t) {
      const { x, y } = LH;
      const gr = g.createRadialGradient(x - 20, y - 20, 10, x, y, 100);
      gr.addColorStop(0, '#7d7464'); gr.addColorStop(0.7, '#3f3a33'); gr.addColorStop(1, '#22201c');
      g.fillStyle = gr; g.beginPath();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, rr = 82 + Math.sin(i * 2.3) * 10; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.strokeStyle = `rgba(220,245,255,${0.25 + Math.sin(t * 2) * 0.1})`; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#6b4a32'; g.fillRect(x + 60, y - 8, 70, 16);
      for (let i = 0; i < 4; i++) { g.fillStyle = '#4a3222'; g.fillRect(x + 66 + i * 18, y - 12, 5, 24); }
      for (const [rr, c] of [[36, '#c94850'], [30, '#f2efe6'], [24, '#c94850'], [18, '#2b2a35'], [13, '#fff4c4']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y - 6, rr, 0, TAU); g.fill(); }
    }
    drawBoat(g, x, y, a, sc, col) {
      g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(2, 4, 26, 13, 0, 0, TAU); g.fill();
      const gr = g.createLinearGradient(0, -12, 0, 12); gr.addColorStop(0, mixColor(col, '#ffffff', 0.25)); gr.addColorStop(1, mixColor(col, '#000000', 0.35));
      g.fillStyle = gr; g.beginPath();
      g.moveTo(28, 0); g.quadraticCurveTo(14, -14, -20, -11); g.lineTo(-22, 11); g.quadraticCurveTo(14, 14, 28, 0); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = 'rgba(255,240,215,0.85)'; g.fillRect(-12, -6, 14, 12);
      g.fillStyle = '#c94850'; g.fillRect(-12, -6, 14, 3);
      g.restore();
    }

    resync() { if (this.W) this.sendWorld(); }
    destroy() { this.st.destroy(); this.keys.destroy(); this.pad && this.pad.destroy(); }
  }

  // точки-сегменты щупальца [x, y, радиус]
  function tentPoints(o) {
    const life = o.t < 2.6 ? (o.t - 2) / 0.6 : o.t > 5.5 ? Math.max(0, 1 - (o.t - 5.5)) : 1;
    const len = 190 * clamp(life, 0, 1), pts = [];
    const sweep = o.a + Math.sin(o.t * 1.3) * 1.3;
    for (let i = 0; i <= 12; i++) {
      const f = i / 12, a = sweep + Math.sin(o.t * 3 + f * 4) * 0.35 * f;
      pts.push([o.x + Math.cos(a) * len * f, o.y + Math.sin(a) * len * f, lerp(20, 5, f)]);
    }
    return pts;
  }
})();
