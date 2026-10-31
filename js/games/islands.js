'use strict';
// «Два огонька» — 3D-приключение на парящих островах (Three.js). Солнышко растапливает лёд и зажигает костры,
// Луна замораживает воду. Вместе толкают ящики, держат кнопки и доходят до своих пьедесталов.
(() => {
  const LV = window.ISLAND_LEVELS;
  const SKY = {
    day: { top: '#6fb8ff', bot: '#ffe3ee', fog: '#d6e9ff', hemi: ['#ffffff', '#7a6a5a', 0.95], dir: 1.35, dirC: '#fff2dd', grass: ['#86de8f', '#72cf80', '#97e8a0'], dirt: '#9a6a48', water: '#4fb6e8' },
    sunset: { top: '#4a3c9c', bot: '#ffb08a', fog: '#e8a8b4', hemi: ['#ffd9c0', '#5a3a5a', 0.85], dir: 1.15, dirC: '#ffc89a', grass: ['#9bd47a', '#86c46e', '#acdf88'], dirt: '#8a5040', water: '#6a8ee8' },
    night: { top: '#050a26', bot: '#3a2a70', fog: '#26285a', hemi: ['#8fa8ff', '#1a1430', 0.55], dir: 0.55, dirC: '#b9c8ff', grass: ['#4f8f8a', '#457f7c', '#5a9f98'], dirt: '#4a3a5a', water: '#3a5ac8' },
  };
  const DOORC = { '!': '#ff8fb8', '@': '#8fd0ff', '#': '#b9f28a', '%': '#ffb347' };
  const PLATEC = { 1: '#ff8fb8', 2: '#8fd0ff', 3: '#b9f28a' };
  const DOOR_OF = { '!': '1', '@': '2', '#': '3' };
  const R = 0.27, SPEED = 3.3, GRAV = 22, JUMP = 7.4;
  const key = (x, z) => x + ',' + z;

  let threeP = null;
  const loadThree = () => {
    if (window.THREE) return Promise.resolve();
    if (!threeP) threeP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = `lib/three.min.js?v=${CONFIG.version}`; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return threeP;
  };

  function parse(lv) {
    const L = LV[lv], H = L.h.length, W = L.h[0].length;
    const P = { L, W, H, plates: {}, doors: {}, braziers: [], stars: [], crates: [], start: {}, ped: {} };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const c = L.o[z][x];
      if (c === 'S') P.start.sun = [x, z]; if (c === 'M') P.start.moon = [x, z];
      if (c === 's') P.ped.sun = [x, z]; if (c === 'm') P.ped.moon = [x, z];
      if ('123'.includes(c)) (P.plates[c] = P.plates[c] || []).push([x, z]);
      if (c in DOORC) (P.doors[c] = P.doors[c] || []).push([x, z]);
      if (c === 'B') P.braziers.push([x, z]);
      if (c === '*') P.stars.push([x, z]);
      if (c === 'C') P.crates.push([x, z]);
    }
    return P;
  }

  GAMES.islands = {
    id: 'islands', title: 'Два огонька', icon: '🏝️', color: '#9fe7c4',
    tagline: '3D-приключение на парящих островах для двоих',
    roles: [
      { id: 'sun', name: 'Солнышко', icon: '☀️', desc: 'Тёплый огонёк. Растапливает ледяные стены и зажигает костры. Проходит через золотые врата.', ctrl: { pc: 'WASD — идти, Пробел — прыжок, E — тепло', touch: 'джойстик, ⤒ — прыжок, ✨ — тепло' } },
      { id: 'moon', name: 'Лунный огонёк', icon: '🌙', desc: 'Холодный огонёк. Замораживает воду в ледяные мостики. Проходит через голубые врата.', ctrl: { pc: 'WASD — идти, Пробел — прыжок, E — мороз', touch: 'джойстик, ⤒ — прыжок, ✨ — мороз' } },
    ],
    rules: [
      'Два огонька на парящих островах. Цель — встать каждому на свой пьедестал (золотой и голубой).',
      'Солнышко растапливает лёд и зажигает костры. Луна замораживает воду — получаются мостики.',
      'Кнопки держат двери открытыми, пока на них кто-то стоит (или ящик). Ящик, столкнутый в воду, становится мостом.',
      'Соберите по 3 звезды на каждом острове. 8 островов, последний — «Встреча».',
      'Застряли? Кнопка ↺ начинает остров заново.',
    ],
    info() { const m = Store.get('is_max', 1); return m > LV.length ? 'все острова пройдены ✦' : `остров ${m} из ${LV.length} · 3D`; },
    create(ctx) { return new Islands(ctx); },
  };

  class Islands {
    constructor(ctx) {
      this.ctx = ctx;
      this.role = ctx.role; this.peerRole = ctx.peerRole;
      this.keys = new Keys();
      this.S = null; this.P = null; this.lvKey = '';
      this.me = { x: 0, z: 0, y: 0, vy: 0, f: -Math.PI / 2, ground: true, walk: 0 };
      this.rp = null; this.rv = null;
      this.ready = false; this.pushT = 0; this.sendT = 0; this.starsGot = new Set();
      this.buildUI();
      loadThree().then(() => this.init3d()).catch(() => { this.loadEl.textContent = 'Не удалось загрузить 3D 😿 Проверь интернет и зайди снова'; });
      if (ctx.isHost) {
        this.S = { phase: 'menu', lv: 0, att: -1, max: Store.get('is_max', 1), frozen: {}, melted: {}, lit: {}, crates: [], stars: [], frost: -1, open: {} };
        this.hostT = setInterval(() => this.hostTick(), 100);
        this.broadcast();
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ================= Хост =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.apply(this.S); }
    event(e) { this.ctx.send({ a: 'ev', e }); this.onEvent(e); }
    startLevel(lv) {
      const S = this.S, P = parse(lv);
      S.att = lv === S.lv ? S.att + 1 : 0; S.lv = lv;
      Object.assign(S, { phase: 'intro', cd: 2.6, frozen: {}, melted: {}, lit: {}, crates: P.crates.map(([x, z]) => [x, z, 0]), stars: [], frost: P.L.frost ?? -1, open: {} });
      this.broadcast();
    }
    posOf(role) { return role === this.role ? this.me : this.rp; }
    onTile(p, x, z) { return p && Math.round(p.x) === x && Math.round(p.z) === z && Math.abs(p.y - this.surfBase(x, z)) < 0.4; }
    hostTick() {
      const S = this.S; if (!S || !this.P) return;
      if (S.phase === 'intro') { S.cd -= 0.1; if (S.cd <= 0) { S.phase = 'play'; this.broadcast(); } return; }
      if (S.phase !== 'play') return;
      const P = this.P, players = [this.posOf('sun'), this.posOf('moon')];
      let changed = false;
      const pressed = (id) => (P.plates[id] || []).some(([x, z]) => players.some((p) => this.onTile(p, x, z)) || S.crates.some((c) => !c[2] && c[0] === x && c[1] === z));
      for (const d of ['!', '@', '#']) {
        if (!P.doors[d]) continue;
        const want = pressed(DOOR_OF[d]);
        const was = !!S.open[d];
        if (want === was) continue;
        // дверь не закрывается, пока в проёме кто-то стоит
        if (!want && P.doors[d].some(([x, z]) => players.some((p) => p && Math.hypot(p.x - x, p.z - z) < 0.75))) continue;
        S.open[d] = want; changed = true;
        this.event({ a: want ? 'open' : 'close' });
      }
      if (P.braziers.length && !S.open['%'] && P.braziers.every(([x, z]) => S.lit[key(x, z)])) { S.open['%'] = true; changed = true; this.event({ a: 'open' }); }
      // победа: оба на своих пьедесталах
      const ok = ['sun', 'moon'].every((r) => this.onTile(this.posOf(r), P.ped[r][0], P.ped[r][1]));
      this.winHold = ok ? (this.winHold || 0) + 0.1 : 0;
      if (this.winHold > 0.5) {
        S.phase = 'win'; changed = true;
        S.max = Math.max(S.max, S.lv + 2);
        Store.set('is_max', Math.max(Store.get('is_max', 1), S.lv + 2));
      }
      if (changed) this.broadcast();
    }
    hostPush(d) {
      const S = this.S; if (S.phase !== 'play') return;
      const c = S.crates.find((q) => !q[2] && q[0] === d.x && q[1] === d.z); if (!c) return;
      const nx = c[0] + d.dx, nz = c[1] + d.dz, P = this.P;
      if (nx < 0 || nz < 0 || nx >= P.W || nz >= P.H) return;
      const hc = P.L.h[nz][nx]; if (hc === ' ') return;
      const base = this.surfBase(c[0], c[1]);
      const k = key(nx, nz);
      const water = hc === '~' && !S.frozen[k] && !S.crates.some((q) => q[2] && q[0] === nx && q[1] === nz);
      if (!water) {
        if (this.surfBase(nx, nz) !== base) return;
        if (this.solidAt(nx, nz, null)) return;
        if (S.crates.some((q) => !q[2] && q[0] === nx && q[1] === nz)) return;
        if (['sun', 'moon'].some((r) => { const p = this.posOf(r); return p && Math.hypot(p.x - nx, p.z - nz) < 0.7; })) return;
      }
      c[0] = nx; c[1] = nz;
      if (water) { c[2] = 1; this.event({ a: 'sink', x: nx, z: nz }); } else this.event({ a: 'push' });
      this.broadcast();
    }
    hostAct(d) {
      const S = this.S; if (S.phase !== 'play') return;
      const P = this.P, k = key(d.x, d.z);
      if (d.x < 0 || d.z < 0 || d.x >= P.W || d.z >= P.H) return;
      const c = P.L.o[d.z][d.x], hc = P.L.h[d.z][d.x];
      if (d.who === 'sun') {
        if (c === 'I' && !S.melted[k]) { S.melted[k] = 1; this.event({ a: 'melt', x: d.x, z: d.z }); }
        else if (c === 'B' && !S.lit[k]) { S.lit[k] = 1; this.event({ a: 'lit', x: d.x, z: d.z }); }
        else return;
      } else {
        if (hc !== '~' || S.frozen[k] || S.crates.some((q) => q[2] && q[0] === d.x && q[1] === d.z)) return;
        if (S.frost === 0) { this.event({ a: 'nofrost' }); return; }
        S.frozen[k] = 1; if (S.frost > 0) S.frost--;
        this.event({ a: 'freeze', x: d.x, z: d.z });
      }
      this.broadcast();
    }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost, S = this.S;
      switch (d.a) {
        case 'S': this.apply(d.S); break;
        case 'ev': this.onEvent(d.e); break;
        case 'p': this.rp = d; break;
        case 'push': if (host) this.hostPush(d); break;
        case 'act': if (host) this.hostAct(d); break;
        case 'star': if (host && S.phase === 'play' && !S.stars.includes(d.i)) { S.stars.push(d.i); this.event({ a: 'star', i: d.i }); this.broadcast(); } break;
        case 'lvl': if (host && d.lv < LV.length && d.lv + 1 <= S.max && S.phase !== 'play') this.startLevel(d.lv); break;
        case 'retry': case 'restart': if (host && S.phase !== 'menu') this.startLevel(S.lv); break;
        case 'next': if (host && S.phase === 'win') { if (S.lv + 1 < LV.length) this.startLevel(S.lv + 1); else { S.phase = 'menu'; this.broadcast(); } } break;
        case 'menu': if (host) { S.phase = 'menu'; this.broadcast(); } break;
      }
    }
    toHost(d) { if (this.ctx.isHost) this.onMsg(d); else this.ctx.send(d); }
    apply(S) {
      const prev = this._pk;
      this.S = S;
      if (S.max > Store.get('is_max', 1)) Store.set('is_max', S.max);
      const k = `${S.lv}:${S.att}`;
      if (S.phase !== 'menu' && k !== this.lvKey) {
        this.lvKey = k; this.P = parse(S.lv);
        const [sx, sz] = this.P.start[this.role];
        Object.assign(this.me, { x: sx, z: sz, y: this.surfBase(sx, sz), vy: 0, ground: true });
        this.rp = null; this.rv = null; this.winHold = 0;
        if (this.ready) this.buildLevel();
      }
      this._pk = `${k}:${S.phase}`;
      if (prev !== this._pk) this.onPhase(S.phase);
      if (this.ready && this.P) this.syncObjects();
      this.updateHud();
    }
    onEvent(e) {
      const at = (x, z, y = 0.5) => this.ready && new THREE.Vector3(x, y + this.surfBase(x, z), z);
      if (e.a === 'open') SFX.play('door');
      if (e.a === 'close') SFX.tone(160, 0.3, { vol: 0.15, slide: 0.6 });
      if (e.a === 'push') SFX.noise(0.18, { vol: 0.25, freq: 300 });
      if (e.a === 'sink') { SFX.play('splash'); if (this.ready) this.burst(at(e.x, e.z, 0), '#bfe9ff', 24); }
      if (e.a === 'melt') { SFX.play('water'); if (this.ready) this.burst(at(e.x, e.z), '#bff2ff', 30); }
      if (e.a === 'lit') { SFX.play('whoosh'); SFX.play('magic'); if (this.ready) this.burst(at(e.x, e.z, 1), '#ffb347', 30); }
      if (e.a === 'freeze') { SFX.tone(1400, 0.3, { vol: 0.1, slide: 1.6 }); SFX.play('chime'); if (this.ready) this.burst(at(e.x, e.z, 0), '#dff6ff', 26); }
      if (e.a === 'nofrost') this.ctx.toast('❄ Мороз закончился. Если застряли — ↺ начнёт остров заново');
      if (e.a === 'star') { SFX.play('coin'); SFX.play('chime'); const s = this.P && this.P.stars[e.i]; if (s && this.ready) this.burst(at(s[0], s[1], 0.7), '#ffe27a', 30); }
    }

    // ================= Экраны =================
    onPhase(ph) {
      const S = this.S;
      this.overlay(null);
      if (ph === 'menu') this.showMenu();
      if (ph === 'intro') {
        SFX.play('whoosh');
        const L = LV[S.lv];
        this.overlay(`<div class="lv-intro"><div class="lv-k">ОСТРОВ ${S.lv + 1} ИЗ ${LV.length}</div><div class="lv-n">${L.name}</div>
          <div class="lv-k2">${L.desc}</div><div class="lv-k2" style="color:#ffe7a6">${this.role === 'sun' ? '☀ Ты — Солнышко: тепло растапливает лёд и зажигает костры' : '🌙 Ты — Лунный огонёк: мороз превращает воду в лёд'}</div><div class="lv-cd"></div></div>`, true);
      }
      if (ph === 'play') SFX.play('bellLow');
      if (ph === 'win') {
        SFX.play('win'); setTimeout(() => SFX.play('chime'), 800);
        this.fireworks = 4;
        const st = S.stars.length, fin = !!LV[S.lv].final;
        setTimeout(() => {
          if (this.S.phase !== 'win') return;
          this.overlay(`<div class="panel lv-end"><div class="mz-stars">${[0, 1, 2].map((i) => `<span class="${i < st ? 'on' : ''}">★</span>`).join('')}</div>
            <h2>${fin ? 'Встреча!' : 'Остров пройден!'}</h2>
            <p>${fin ? `Два огонька наконец вместе.<br><span style="color:#fff3dc">${esc(CONFIG.finalMessage).replace(/\n/g, '<br>')}</span>` : `Звёзд: ${st}/3`}</p>
            <button class="btn" data-a="next">${fin ? 'К островам ✦' : 'Следующий остров →'}</button><button class="btn ghost" data-a="retry">Ещё раз (за звёздами)</button>${fin ? '' : '<button class="btn ghost" data-a="menu">Все острова</button>'}</div>`);
        }, fin ? 2200 : 1200);
      }
    }
    overlay(html, passive) {
      const o = this.ui.querySelector('.lv-ov'); if (o) o.remove();
      if (!html) return;
      const el = h(`<div class="lv-ov ${passive ? 'passive' : ''}">${html}</div>`);
      el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: b.dataset.a }); }));
      el.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: 'lvl', lv: +b.dataset.l }); }));
      this.ui.appendChild(el);
    }
    showMenu() {
      const max = this.S.max;
      const tiles = LV.map((L, i) => { const open = i + 1 <= max; return `<button class="lv-tile ${open ? '' : 'locked'} ${i + 1 < max ? 'done' : ''}" ${open ? `data-l="${i}"` : 'disabled'}><span class="n">${i + 1}</span><span class="t">${L.name}</span><span class="m">${open ? { day: '☀ день', sunset: '🌅 закат', night: '🌙 ночь' }[L.sky] : '🔒'}</span></button>`; }).join('');
      this.overlay(`<div class="panel lv-menu"><h2>🏝️ Два огонька</h2>
        <p class="sub">${this.role === 'sun' ? 'Ты — <b>Солнышко</b> ☀' : 'Ты — <b>Лунный огонёк</b> 🌙'} · выберите остров</p>
        <div class="lv-grid">${tiles}</div></div>`);
    }
    buildUI() {
      const touch = this.ctx.me.touch;
      this.ui = h(`<div class="passthru is-root" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel is-hud"><span id="isLvl"></span><span id="isStars"></span><span id="isFrost"></span></div></div>
        <div class="is-tools"><button class="iconbtn" id="isRestart" title="Начать остров заново">↺</button><button class="iconbtn" id="isHelp" title="Управление">?</button></div>
        <div class="is-hint" id="isHint"></div>
        <div class="is-load" id="isLoad"><div class="orbit"><i></i><i></i></div>Строим острова…</div>
      </div>`);
      this.ctx.ui.appendChild(this.ui);
      this.loadEl = $('#isLoad', this.ui);
      $('#isRestart', this.ui).onclick = () => this.ctx.modal({ title: 'Начать остров заново?', text: 'Для вас обоих — ящики, лёд и костры вернутся на места.', buttons: [{ label: 'Заново ↺', onClick: () => this.toHost({ a: 'restart' }) }, { label: 'Отмена', ghost: true }] });
      $('#isHelp', this.ui).onclick = () => this.ctx.modal({
        title: 'Как играть', buttons: [{ label: 'Понятно ✦' }],
        text: `<div class="lt-legend"><div><b>Движение:</b> ${touch ? 'джойстик слева' : 'WASD или стрелки'}</div><div><b>Прыжок:</b> ${touch ? 'кнопка ⤒' : 'Пробел'} — на одну ступеньку</div>
          <div><b>${this.role === 'sun' ? 'Тепло' : 'Мороз'}:</b> ${touch ? 'кнопка ✨' : 'E'} — смотри на предмет перед собой</div>
          <div>☀ Солнышко растапливает 🧊 ледяные стены и зажигает 🔥 костры. 🌙 Луна замораживает 💧 воду.</div>
          <div>Ящик толкается, если идти в него. В воде он становится мостом, а ещё на него можно запрыгнуть.</div>
          <div>Кнопка держит дверь своего цвета открытой. Золотые врата — только для Солнышка, голубые — только для Луны.</div></div>`,
      });
      if (touch) this.pad = new TouchPad(this.ctx.ui, [{ id: 'jump', label: '⤒' }, { id: 'act', label: '✨' }]);
    }
    updateHud() {
      const S = this.S; if (!S || !this.ui) return;
      const play = S.phase !== 'menu';
      $('.is-hud', this.ui).style.visibility = play ? '' : 'hidden';
      this.ui.querySelector('.is-tools').style.visibility = play ? '' : 'hidden';
      if (this.pad) this.pad.root.style.visibility = play ? '' : 'hidden';
      if (!play) return;
      $('#isLvl', this.ui).textContent = `${S.lv + 1}. ${LV[S.lv].name}`;
      $('#isStars', this.ui).textContent = `★ ${S.stars.length}/3`;
      $('#isFrost', this.ui).textContent = S.frost >= 0 ? `❄ ${S.frost}` : '';
    }

    // ================= Мир: высоты и препятствия =================
    crateAt(x, z) { return this.S.crates.find((c) => !c[2] && c[0] === x && c[1] === z); }
    surfBase(x, z) {
      const P = this.P; if (!P || x < 0 || z < 0 || x >= P.W || z >= P.H) return -99;
      const hc = P.L.h[z][x]; if (hc === ' ') return -99;
      if (hc === '~') { const k = key(x, z); return this.S.frozen[k] || this.S.crates.some((c) => c[2] && c[0] === x && c[1] === z) ? 0 : -0.7; }
      return +hc;
    }
    solidAt(x, z, who) {
      const S = this.S, c = this.P.L.o[z][x], k = key(x, z);
      if (c in DOORC) return !S.open[c];
      if (c === 'I') return !S.melted[k];
      if (c === 'B' || c === 'T') return true;
      if (c === 'G') return who !== 'sun';
      if (c === 'g') return who !== 'moon';
      return false;
    }
    surf(x, z, who) {
      const b = this.surfBase(x, z); if (b <= -99) return b;
      if (this.solidAt(x, z, who)) return b + 6;
      if (this.crateAt(x, z)) return b + 1;
      return b;
    }

    // ================= Своё движение =================
    controls(dt) {
      const S = this.S, me = this.me;
      if (!S || !this.P || S.phase !== 'play') return;
      const k = this.keys, pad = this.pad;
      let ix = 0, iz = 0;
      if (k.any('KeyA', 'ArrowLeft')) ix -= 1; if (k.any('KeyD', 'ArrowRight')) ix += 1;
      if (k.any('KeyW', 'ArrowUp')) iz -= 1; if (k.any('KeyS', 'ArrowDown')) iz += 1;
      if (pad) { ix += pad.ax; iz += pad.ay; }
      const m = Math.hypot(ix, iz);
      if (m > 1) { ix /= m; iz /= m; }
      const moving = m > 0.15;
      if (moving) {
        const target = Math.atan2(iz, ix);
        me.f += angDiff(me.f, target) * Math.min(1, dt * 14);
        me.walk += dt * 10 * Math.min(1, m);
      }
      const blockedAt = (px, pz) => {
        for (const [ox, oz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
          const tx = Math.round(px + ox), tz = Math.round(pz + oz);
          if (this.surf(tx, tz, this.role) > me.y + 0.3) return [tx, tz];
        }
        return null;
      };
      const step = SPEED * dt;
      if (Math.abs(ix) > 0.05) {
        const nx = me.x + ix * step, b = blockedAt(nx, me.z);
        if (!b) me.x = nx; else this.tryPush(b, Math.sign(ix), 0);
      }
      if (Math.abs(iz) > 0.05) {
        const nz = me.z + iz * step, b = blockedAt(me.x, nz);
        if (!b) me.z = nz; else this.tryPush(b, 0, Math.sign(iz));
      }
      // прыжок и падение
      const gx = Math.round(me.x), gz = Math.round(me.z);
      let gnd = this.surf(gx, gz, this.role);
      if (gnd > me.y + 0.3) gnd = me.y; // на краю — не проваливаемся в стену
      const jump = k.once('Space') || (pad && pad.once('jump'));
      if (jump && me.ground) { me.vy = JUMP; me.ground = false; SFX.tone(420, 0.15, { type: 'triangle', vol: 0.12, slide: 1.8 }); }
      me.vy -= GRAV * dt; me.y += me.vy * dt;
      if (me.y <= gnd && me.vy <= 0) { if (!me.ground && me.vy < -6) SFX.tone(140, 0.08, { vol: 0.12 }); me.y = gnd; me.vy = 0; me.ground = true; }
      else if (me.y > gnd + 0.02) me.ground = false;
      const water = this.P.L.h[gz] && this.P.L.h[gz][gx] === '~' && gnd < -0.5;
      if (me.y < -4 || (water && me.y < -0.35)) this.respawn(water);
      // действие
      const act = k.once('KeyE', 'KeyF', 'Enter', 'ShiftLeft') || (pad && pad.once('act'));
      const ft = this.facingTile();
      this.hint = this.actionHint(ft);
      if (act) {
        if (this.hint) this.toHost({ a: 'act', who: this.role, x: ft[0], z: ft[1] });
        else SFX.tone(220, 0.1, { vol: 0.08 });
        this.castFx = 0.4;
      }
      // звёзды
      this.P.stars.forEach(([sx, sz], i) => {
        if (S.stars.includes(i) || this.starsGot.has(this.lvKey + i)) return;
        if (Math.hypot(me.x - sx, me.z - sz) < 0.5 && Math.abs(me.y - this.surfBase(sx, sz)) < 1.2) { this.starsGot.add(this.lvKey + i); this.toHost({ a: 'star', i }); }
      });
      this.moving = moving;
    }
    facingTile() {
      const me = this.me, a = Math.round(me.f / (Math.PI / 2)) * (Math.PI / 2);
      return [Math.round(me.x + Math.cos(a) * 0.9), Math.round(me.z + Math.sin(a) * 0.9)];
    }
    actionHint([x, z]) {
      const P = this.P, S = this.S;
      if (x < 0 || z < 0 || x >= P.W || z >= P.H) return '';
      const c = P.L.o[z][x], k = key(x, z), btn = this.pad ? '✨' : 'E';
      if (this.role === 'sun') {
        if (c === 'I' && !S.melted[k]) return `${btn} — растопить лёд`;
        if (c === 'B' && !S.lit[k]) return `${btn} — зажечь костёр`;
      } else if (P.L.h[z][x] === '~' && !S.frozen[k] && !S.crates.some((q) => q[2] && q[0] === x && q[1] === z)) {
        return S.frost === 0 ? '❄ мороз закончился' : `${btn} — заморозить воду${S.frost > 0 ? ` (❄ ${S.frost})` : ''}`;
      }
      return '';
    }
    tryPush([tx, tz], dx, dz) {
      const me = this.me;
      if (!me.ground || this.pushT > 0 || !this.crateAt(tx, tz)) return;
      if (Math.abs(this.surfBase(tx, tz) - me.y) > 0.3) return;
      this.pushT = 0.35;
      this.toHost({ a: 'push', x: tx, z: tz, dx, dz });
    }
    respawn(water) {
      const [sx, sz] = this.P.start[this.role];
      if (water) { SFX.play('splash'); if (this.ready) this.burst(new THREE.Vector3(this.me.x, -0.3, this.me.z), '#9fe0ff', 26); }
      else SFX.play('fail');
      Object.assign(this.me, { x: sx, z: sz, y: this.surfBase(sx, sz) + 2, vy: 0, ground: false });
    }

    // ================= 3D =================
    init3d() {
      const T = THREE;
      // цвета в sRGB → правильные, не выцветшие
      if (T.ColorManagement) T.ColorManagement.legacyMode = false;
      const r = (this.renderer = new T.WebGLRenderer({ canvas: this.ctx.canvas, antialias: true, powerPreference: 'high-performance' }));
      r.setPixelRatio(Math.min(devicePixelRatio || 1, this.ctx.me.touch ? 1.5 : 2));
      r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      this.scene = new T.Scene();
      this.cam = new T.PerspectiveCamera(42, 1, 0.1, 120);
      this.hemi = new T.HemisphereLight('#fff', '#666', 0.9); this.scene.add(this.hemi);
      this.sun = new T.DirectionalLight('#fff', 1.2);
      this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.bias = -0.0008;
      this.scene.add(this.sun); this.scene.add(this.sun.target);
      this.world = new T.Group(); this.scene.add(this.world);
      this.glowTex = this.makeGlowTex();
      this.fx = []; for (let i = 0; i < 90; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: '#fff', transparent: true, blending: T.AdditiveBlending, depthWrite: false })); s.visible = false; this.scene.add(s); this.fx.push({ s, v: new T.Vector3(), life: 0, t: 0 }); }
      this.chars = { sun: this.makeChar('sun'), moon: this.makeChar('moon') };
      this.scene.add(this.chars.sun.g, this.chars.moon.g);
      this._resize = () => { const w = innerWidth, hh = innerHeight; r.setSize(w, hh, false); this.cam.aspect = w / hh; this.cam.updateProjectionMatrix(); };
      addEventListener('resize', this._resize); this._resize();
      this.ready = true;
      this.loadEl.remove();
      if (this.P) this.buildLevel();
      if (this.S) this.syncObjects();
    }
    makeGlowTex() {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o }); }
    makeChar(role) {
      const T = THREE, g = new T.Group(), body = new T.Group(); g.add(body);
      const sun = role === 'sun';
      const core = new T.Mesh(new T.IcosahedronGeometry(0.3, 2), this.mat(sun ? '#ffd36b' : '#e4ebff', { emissive: sun ? '#ff9a2e' : '#5f7cff', emissiveIntensity: sun ? 0.75 : 0.45, roughness: 0.5 }));
      core.castShadow = true; core.position.y = 0.36; body.add(core);
      const eyeM = new T.MeshBasicMaterial({ color: '#2a1a30' });
      for (const sx of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.045, 8, 8), eyeM); e.position.set(0.25, 0.42, sx * 0.1); body.add(e); }
      const blush = new T.MeshBasicMaterial({ color: '#ff8fb0', transparent: true, opacity: 0.7 });
      for (const sx of [-1, 1]) { const b = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), blush); b.scale.set(0.5, 0.6, 1.2); b.position.set(0.25, 0.33, sx * 0.19); body.add(b); }
      const deco = new T.Group(); deco.position.y = 0.36; body.add(deco);
      if (sun) {
        const rm = this.mat('#ffb347', { emissive: '#ff8a1e', emissiveIntensity: 0.9 });
        for (let i = 0; i < 8; i++) { const c = new T.Mesh(new T.ConeGeometry(0.06, 0.16, 5), rm); const a = (i / 8) * Math.PI * 2; c.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0); c.rotation.z = a - Math.PI / 2; deco.add(c); }
      } else {
        const st = new T.Mesh(new T.OctahedronGeometry(0.07), this.mat('#ffffff', { emissive: '#9fc4ff', emissiveIntensity: 1 }));
        st.position.set(0.45, 0.1, 0); deco.add(st);
        const ring = new T.Mesh(new T.TorusGeometry(0.42, 0.015, 6, 40), new T.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.6 }));
        ring.rotation.x = Math.PI / 2.4; deco.add(ring);
      }
      const halo = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: sun ? '#ffb347' : '#8fb0ff', transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
      halo.scale.set(1.6, 1.6, 1); halo.position.y = 0.36; g.add(halo);
      const light = new T.PointLight(sun ? '#ffb347' : '#8fb0ff', sun ? 1.3 : 1.1, 4.5, 2); light.position.y = 0.6; g.add(light);
      return { g, body, deco, core, halo };
    }
    buildLevel() {
      const T = THREE, P = this.P, L = P.L, sky = SKY[L.sky];
      // очистка
      this.world.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material._shared) o.material.dispose(); });
      this.world.clear();
      this.dyn = {};
      // небо
      const c = document.createElement('canvas'); c.width = 4; c.height = 256;
      const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, sky.top); gr.addColorStop(1, sky.bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
      if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
      this.scene.background = new T.CanvasTexture(c); this.scene.background.encoding = T.sRGBEncoding;
      this.scene.fog = new T.Fog(sky.fog, 16, 42);
      this.hemi.color.set(sky.hemi[0]); this.hemi.groundColor.set(sky.hemi[1]); this.hemi.intensity = sky.hemi[2];
      this.sun.color.set(sky.dirC); this.sun.intensity = sky.dir;
      const cx = (P.W - 1) / 2, cz = (P.H - 1) / 2, ext = Math.max(P.W, P.H) * 0.75 + 2;
      this.sun.position.set(cx - 6, 14, cz + 7); this.sun.target.position.set(cx, 0, cz);
      Object.assign(this.sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 50 }); this.sun.shadow.camera.updateProjectionMatrix();
      if (L.sky === 'night') {
        const pts = new Float32Array(600 * 3); const rr = RNG(7);
        for (let i = 0; i < 600; i++) { const a = rr() * Math.PI * 2, b = rr() * 0.9 + 0.1, d = 50; pts[i * 3] = cx + Math.cos(a) * Math.cos(b) * d; pts[i * 3 + 1] = Math.sin(b) * d - 5; pts[i * 3 + 2] = cz + Math.sin(a) * Math.cos(b) * d; }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pts, 3));
        const stars = new T.Points(geo, new T.PointsMaterial({ color: '#ffffff', size: 0.35, fog: false }));
        this.world.add(stars);
      }
      // клетки
      const cells = [], water = [];
      for (let z = 0; z < P.H; z++) for (let x = 0; x < P.W; x++) { const hc = L.h[z][x]; if (hc === ' ') continue; if (hc === '~') water.push([x, z]); else cells.push([x, z, +hc]); }
      const rnd = RNG(P.W * 31 + P.H * 7 + this.S.lv);
      const dummy = new T.Object3D();
      const grass = new T.InstancedMesh(new T.BoxGeometry(1, 0.26, 1), this.mat('#ffffff'), cells.length);
      const dirt = new T.InstancedMesh(new T.BoxGeometry(0.96, 1, 0.96), this.mat(sky.dirt), cells.length + water.length);
      const col = new T.Color();
      cells.forEach(([x, z, hh], i) => {
        dummy.position.set(x, hh - 0.13, z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
        col.set(sky.grass[Math.floor(rnd() * 3)]); grass.setColorAt(i, col);
        const dh = hh + 1.1; dummy.position.set(x, hh - 0.26 - dh / 2, z); dummy.scale.set(1, dh, 1); dummy.updateMatrix(); dirt.setMatrixAt(i, dummy.matrix);
      });
      water.forEach(([x, z], i) => { const dh = 0.6; dummy.position.set(x, -1.0 - dh / 2 + 0.2, z); dummy.scale.set(1, dh, 1); dummy.updateMatrix(); dirt.setMatrixAt(cells.length + i, dummy.matrix); });
      grass.receiveShadow = true; grass.castShadow = true; dirt.receiveShadow = true; dirt.castShadow = true;
      this.world.add(grass, dirt);
      // корни-сталактиты под островом
      const all = cells.concat(water.map(([x, z]) => [x, z, 0]));
      const rocks = new T.InstancedMesh(new T.ConeGeometry(0.5, 1, 5), this.mat(mixColor(sky.dirt, '#000000', 0.35)), all.length);
      all.forEach(([x, z], i) => { const l = 0.6 + rnd() * 2.4; dummy.position.set(x + (rnd() - 0.5) * 0.2, -1.1 - l / 2, z + (rnd() - 0.5) * 0.2); dummy.scale.set(0.9 + rnd() * 0.3, l, 0.9 + rnd() * 0.3); dummy.rotation.set(Math.PI, rnd() * 3, 0); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); });
      this.world.add(rocks);
      // вода
      if (water.length) {
        this.waterMat = new T.MeshStandardMaterial({ color: sky.water, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.1, emissive: sky.water, emissiveIntensity: 0.15 });
        const wm = new T.InstancedMesh(new T.BoxGeometry(1, 0.12, 1), this.waterMat, water.length);
        water.forEach(([x, z], i) => { dummy.position.set(x, -0.42, z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); wm.setMatrixAt(i, dummy.matrix); });
        wm.receiveShadow = true; this.world.add(wm);
      }
      // цветы
      const free = cells.filter(([x, z]) => L.o[z][x] === '.');
      const fl = new T.InstancedMesh(new T.IcosahedronGeometry(0.06, 0), this.mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.15 }), Math.min(free.length * 2, 160));
      const fcols = L.sky === 'night' ? ['#9fb8ff', '#c9a6ff', '#7ae0ff'] : ['#ff8fb8', '#ffd36b', '#ffffff', '#c9a6ff'];
      for (let i = 0; i < fl.count; i++) { const [x, z, hh] = free[Math.floor(rnd() * free.length)]; dummy.position.set(x + (rnd() - 0.5) * 0.8, hh + 0.05, z + (rnd() - 0.5) * 0.8); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); fl.setMatrixAt(i, dummy.matrix); col.set(fcols[Math.floor(rnd() * fcols.length)]); fl.setColorAt(i, col); }
      this.world.add(fl);
      // предметы
      for (let z = 0; z < P.H; z++) for (let x = 0; x < P.W; x++) {
        const ch = L.o[z][x], hh = this.surfBase(x, z) <= -99 ? 0 : Math.max(0, +L.h[z][x] || 0), k = key(x, z);
        let m = null;
        if (ch === 'T') {
          m = new T.Group();
          const tr = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 0.5, 6), this.mat('#7a5236')); tr.position.y = 0.25; m.add(tr);
          const lc = L.sky === 'night' ? '#3f7f7a' : '#5fc27a';
          for (const [yy, s] of [[0.65, 0.42], [0.95, 0.3]]) { const f = new T.Mesh(new T.IcosahedronGeometry(s, 0), this.mat(lc)); f.position.y = yy; f.castShadow = true; m.add(f); }
          m.rotation.y = rnd() * 3; m.scale.setScalar(0.9 + rnd() * 0.3);
        }
        if (ch === 'I') { m = new T.Mesh(new T.BoxGeometry(0.94, 1.3, 0.94), this.mat('#c8f3ff', { transparent: true, opacity: 0.78, roughness: 0.1, emissive: '#6fd0ff', emissiveIntensity: 0.25 })); m.position.y = 0.65; m.castShadow = true; }
        if (ch === 'B') {
          m = new T.Group();
          const base = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 0.5, 8), this.mat('#6a5a6a')); base.position.y = 0.25; base.castShadow = true; m.add(base);
          const bowl = new T.Mesh(new T.CylinderGeometry(0.34, 0.2, 0.18, 8), this.mat('#8a7a8a')); bowl.position.y = 0.58; m.add(bowl);
          const flame = new T.Mesh(new T.ConeGeometry(0.2, 0.55, 7), new T.MeshBasicMaterial({ color: '#ffb347' })); flame.position.y = 0.92; flame.visible = false; m.add(flame);
          const glow = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: '#ff9a3a', transparent: true, blending: T.AdditiveBlending, depthWrite: false })); glow.scale.set(2, 2, 1); glow.position.y = 0.9; glow.visible = false; m.add(glow);
          m.userData = { flame, glow };
        }
        if (ch in DOORC) {
          m = new T.Group();
          const d = new T.Mesh(new T.BoxGeometry(0.96, 1.5, 0.96), this.mat(DOORC[ch], { emissive: DOORC[ch], emissiveIntensity: 0.25, roughness: 0.6 }));
          d.position.y = 0.75; d.castShadow = true; m.add(d);
          const sym = new T.Mesh(new T.TorusGeometry(0.22, 0.04, 6, 24), new T.MeshBasicMaterial({ color: '#ffffff' })); sym.position.set(0, 0.8, 0.49); m.add(sym);
          const sym2 = sym.clone(); sym2.position.z = -0.49; m.add(sym2);
          m.userData = { door: d, sym, sym2, open: 0 };
        }
        if ('123'.includes(ch)) {
          m = new T.Group();
          const p = new T.Mesh(new T.CylinderGeometry(0.36, 0.4, 0.1, 20), this.mat(PLATEC[ch], { emissive: PLATEC[ch], emissiveIntensity: 0.2 })); p.position.y = 0.05; p.receiveShadow = true; m.add(p);
          m.userData = { p };
        }
        if (ch === 's' || ch === 'm') {
          const c2 = ch === 's' ? '#ffcf6b' : '#9fc4ff';
          m = new T.Group();
          const base = new T.Mesh(new T.CylinderGeometry(0.44, 0.48, 0.16, 24), this.mat('#f4efe6', { roughness: 0.5 })); base.position.y = 0.08; base.receiveShadow = true; m.add(base);
          const ring = new T.Mesh(new T.TorusGeometry(0.36, 0.04, 8, 32), new T.MeshBasicMaterial({ color: c2 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.17; m.add(ring);
          const beam = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 3, 20, 1, true), new T.MeshBasicMaterial({ color: c2, transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); beam.position.y = 1.6; m.add(beam);
          m.userData = { ring, beam };
        }
        if (ch === 'G' || ch === 'g') {
          const c2 = ch === 'G' ? '#ffcf6b' : '#8fc4ff';
          m = new T.Mesh(new T.BoxGeometry(0.92, 1.4, 0.92), new T.MeshStandardMaterial({ color: c2, transparent: true, opacity: 0.38, emissive: c2, emissiveIntensity: 0.6, depthWrite: false }));
          m.position.y = 0.7;
        }
        if (ch === '*') {
          const sh = new T.Shape();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? 0.1 : 0.24; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          m = new T.Group();
          const st = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }), this.mat('#ffd84d', { emissive: '#ffb31a', emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.3 }));
          st.position.z = -0.04; st.castShadow = true; m.add(st);
          const gl = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: '#ffd36b', transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.set(1.1, 1.1, 1); m.add(gl);
          m.position.y = 0.55;
          m.userData = { star: P.stars.findIndex(([sx, sz]) => sx === x && sz === z) };
        }
        if (m) { m.position.x = x; m.position.z = z; m.position.y += hh; this.world.add(m); this.dyn[k] = m; }
      }
      // ящики и лёд создаются по состоянию
      this.crateMeshes = []; this.iceMeshes = {};
      this.crateTex = this.crateTex || this.makeCrateTex();
      // камера сразу к игроку
      this.camPos = null;
    }
    makeCrateTex() {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      g.fillStyle = '#c98a4a'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#b07438'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 16 + 7, 64, 2);
      g.strokeStyle = '#7a4a22'; g.lineWidth = 6; g.strokeRect(3, 3, 58, 58); g.beginPath(); g.moveTo(6, 6); g.lineTo(58, 58); g.stroke();
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    syncObjects() {
      const T = THREE, S = this.S, P = this.P;
      if (!this.dyn) return;
      // ящики
      while (this.crateMeshes.length < S.crates.length) {
        const m = new T.Mesh(new T.BoxGeometry(0.9, 0.9, 0.9), new T.MeshStandardMaterial({ map: this.crateTex, roughness: 0.8 }));
        m.castShadow = true; m.receiveShadow = true; this.world.add(m); this.crateMeshes.push(m);
      }
      S.crates.forEach((c, i) => { const m = this.crateMeshes[i]; m.userData.tx = c[0]; m.userData.tz = c[1]; m.userData.ty = c[2] ? -0.47 : this.surfBase(c[0], c[1]) + 0.45; if (m.userData.ix == null) { m.position.set(c[0], m.userData.ty, c[1]); m.userData.ix = 1; } });
      // замёрзшая вода
      for (const k in S.frozen) {
        if (this.iceMeshes[k]) continue;
        const [x, z] = k.split(',').map(Number);
        const m = new T.Mesh(new T.BoxGeometry(1, 0.3, 1), this.mat('#dff6ff', { roughness: 0.15, emissive: '#9fe0ff', emissiveIntensity: 0.25, transparent: true, opacity: 0.92 }));
        m.position.set(x, -0.15, z); m.scale.set(0.01, 1, 0.01); m.receiveShadow = true; this.world.add(m); this.iceMeshes[k] = m;
      }
      for (const k in this.iceMeshes) if (!S.frozen[k]) { this.world.remove(this.iceMeshes[k]); delete this.iceMeshes[k]; }
    }
    burst(pos, color, n = 20) {
      if (!pos) return;
      let k = 0;
      for (const p of this.fx) {
        if (p.life > 0) continue;
        p.s.visible = true; p.s.position.copy(pos); p.s.material.color.set(color);
        p.v.set((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3);
        p.life = 0.7 + Math.random() * 0.6; p.t = 0; p.sz = 0.2 + Math.random() * 0.25;
        if (++k >= n) break;
      }
    }

    // ================= Кадр =================
    frame(dt, t) {
      const S = this.S;
      if (S && S.phase === 'intro') { const o = this.ui.querySelector('.lv-cd'); if (o) o.textContent = Math.max(1, Math.ceil(S.cd)); }
      this.pushT -= dt; this.castFx = Math.max(0, (this.castFx || 0) - dt);
      this.controls(dt);
      const hEl = $('#isHint', this.ui);
      if (hEl) { const v = S && S.phase === 'play' ? this.hint || '' : ''; if (hEl.textContent !== v) hEl.textContent = v; hEl.classList.toggle('on', !!v); }
      // отправка своей позиции
      if (S && this.P && (this.sendT -= dt) <= 0) {
        this.sendT = 1 / 15;
        const me = this.me;
        this.ctx.send({ a: 'p', x: +me.x.toFixed(3), z: +me.z.toFixed(3), y: +me.y.toFixed(3), f: +me.f.toFixed(2), w: this.moving ? 1 : 0 });
      }
      if (!this.ready || !this.P || !S || S.phase === 'menu') { if (this.ready && S && S.phase === 'menu') this.renderMenu(t); return; }
      this.updateWorld(dt, t);
      this.renderer.render(this.scene, this.cam);
    }
    renderMenu(t) {
      // в меню — тихо вращаем последний остров
      if (!this.dyn) { this.renderer.setClearColor('#1a1440'); this.renderer.clear(); return; }
      const P = this.P, cx = (P.W - 1) / 2, cz = (P.H - 1) / 2, d = Math.max(P.W, P.H) * 1.2;
      this.cam.position.set(cx + Math.cos(t * 0.2) * d, d * 0.8, cz + Math.sin(t * 0.2) * d); this.cam.lookAt(cx, 0, cz);
      this.renderer.render(this.scene, this.cam);
    }
    updateWorld(dt, t) {
      const T = THREE, S = this.S, P = this.P;
      const k = 1 - Math.exp(-dt * 12);
      // персонажи
      const place = (role, p, walking) => {
        const c = this.chars[role]; if (!p) { c.g.visible = false; return; }
        c.g.visible = true;
        c.g.position.set(p.x, p.y, p.z);
        c.body.rotation.y = -p.f;
        const bob = walking ? Math.abs(Math.sin(t * 10)) * 0.08 : Math.sin(t * 2.5) * 0.03;
        c.body.position.y = bob;
        const sq = p.vy != null && Math.abs(p.vy) > 0.5 ? 1 + Math.min(0.2, Math.abs(p.vy) * 0.02) : 1;
        c.core.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        c.deco.rotation.z = role === 'sun' ? t * 1.2 : 0; if (role === 'moon') c.deco.rotation.y = t * 1.5;
        c.halo.material.opacity = 0.55 + Math.sin(t * 3) * 0.1 + (role === this.role ? this.castFx : 0);
      };
      place(this.role, this.me, this.moving);
      if (this.rp) {
        if (!this.rv) this.rv = { ...this.rp };
        for (const q of ['x', 'y', 'z']) this.rv[q] = lerp(this.rv[q], this.rp[q], k);
        this.rv.f += angDiff(this.rv.f, this.rp.f) * k;
        place(this.peerRole, this.rv, this.rp.w);
      } else this.chars[this.peerRole].g.visible = false;
      // камера за своим огоньком
      const port = innerHeight > innerWidth;
      const dist = port ? 11.5 : 8.2;
      const tgt = new T.Vector3(this.me.x, Math.max(0, this.me.y) * 0.7, this.me.z - (port ? 1.2 : 0.4));
      const want = new T.Vector3(tgt.x, tgt.y + dist * 1.08, tgt.z + dist * 0.62);
      if (!this.camPos) this.camPos = want.clone();
      this.camPos.lerp(want, 1 - Math.exp(-dt * 4));
      this.cam.position.copy(this.camPos); this.cam.lookAt(tgt);
      // предметы
      for (const kk in this.dyn) {
        const m = this.dyn[kk], [x, z] = kk.split(',').map(Number), ch = P.L.o[z][x];
        if (ch in DOORC) { const u = m.userData, want2 = S.open[ch] ? 1 : 0; u.open = lerp(u.open, want2, 1 - Math.exp(-dt * 5)); u.door.position.y = 0.75 - u.open * 1.52; u.sym.visible = u.sym2.visible = u.open < 0.5; }
        if ('123'.includes(ch)) { const on = (P.doors[{ 1: '!', 2: '@', 3: '#' }[ch]] || []).length && S.open[{ 1: '!', 2: '@', 3: '#' }[ch]]; m.userData.p.material.emissiveIntensity = on ? 0.9 : 0.2; m.userData.p.position.y = on ? 0.02 : 0.05; }
        if (ch === 'I') { const melt = S.melted[kk]; if (melt) { m.scale.y = Math.max(0.001, m.scale.y - dt * 1.5); m.position.y = (+P.L.h[z][x]) + 0.65 * m.scale.y; m.visible = m.scale.y > 0.01; } }
        if (ch === 'B') { const lit = S.lit[kk]; m.userData.flame.visible = m.userData.glow.visible = !!lit; if (lit) { m.userData.flame.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9) * 0.15, 1); m.userData.glow.material.opacity = 0.7 + Math.sin(t * 11) * 0.15; } }
        if (ch === 's' || ch === 'm') { const r = ch === 's' ? 'sun' : 'moon'; const on = this.onTile(r === this.role ? this.me : this.rp, x, z); m.userData.beam.material.opacity = on ? 0.35 + Math.sin(t * 5) * 0.08 : 0.1; m.userData.ring.rotation.z = t; }
        if (ch === '*') { const got = S.stars.includes(m.userData.star); m.visible = !got; m.rotation.y = t * 2; m.position.y = +P.L.h[z][x] + 0.55 + Math.sin(t * 2.5 + x) * 0.08; }
      }
      for (const m of this.crateMeshes) { const u = m.userData; m.position.x = lerp(m.position.x, u.tx, k); m.position.z = lerp(m.position.z, u.tz, k); m.position.y = lerp(m.position.y, u.ty, k * 0.7); }
      for (const kk in this.iceMeshes) { const m = this.iceMeshes[kk]; if (m.scale.x < 1) { const s = Math.min(1, m.scale.x + dt * 4); m.scale.set(s, 1, s); } }
      if (this.waterMat) this.waterMat.emissiveIntensity = 0.12 + Math.sin(t * 2) * 0.05;
      // искры
      for (const p of this.fx) {
        if (p.life <= 0) continue;
        p.t += dt; if (p.t >= p.life) { p.life = 0; p.s.visible = false; continue; }
        p.v.y -= 4 * dt; p.s.position.addScaledVector(p.v, dt);
        const a = 1 - p.t / p.life; p.s.material.opacity = a; p.s.scale.setScalar(p.sz * (0.5 + a));
      }
      if (S.phase === 'win' && this.fireworks > 0 && Math.random() < dt * 4) {
        const cols = ['#ffd36b', '#9fc4ff', '#ff8fb8', '#b9f28a'];
        this.burst(new T.Vector3(this.me.x + (Math.random() - 0.5) * 6, 2 + Math.random() * 3, this.me.z - 2 + (Math.random() - 0.5) * 4), pick(cols), 18);
        this.fireworks -= dt * 0.5;
        if (Math.random() < 0.3) SFX.play('pop');
      }
    }

    resync() { if (this.ctx.isHost && this.S) this.broadcast(); }
    destroy() {
      clearInterval(this.hostT); this.keys.destroy(); this.pad && this.pad.destroy();
      if (this._resize) removeEventListener('resize', this._resize);
      if (this.renderer) {
        this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
        this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss();
      }
    }
  }
})();
