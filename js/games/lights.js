'use strict';
// «Свет двух миров» — головоломка с историей. Солнце в Дневном мире, Луна в Ночном.
// Каждый крутит зеркала в своём мире, лучи переходят между мирами через порталы. 5 глав, 20 уровней, финал.
(() => {
  const { D, build, trace, solvedWorld } = window.LightCore;
  const LV = window.LIGHT_LEVELS;
  const COL = { 1: '#ff5a6e', 2: '#5dff9a', 4: '#5aa8ff', 3: '#ffe15a', 5: '#d77aff', 6: '#5ef0f0', 7: '#fffbe8' };
  const CNAME = { 1: 'красный', 2: 'зелёный', 4: 'синий', 3: 'жёлтый', 5: 'фиолетовый', 6: 'бирюзовый', 7: 'белый' };

  // ---------- Главы и история ----------
  const CH = [
    {
      name: 'Утренний сад', lv: [0, 1, 2, 3],
      sky: [['#8fc8ff', '#ffc4d6', '#ffe2b0'], ['#0a1235', '#1c2766', '#3a2c6e']], land: [['#8fd49a', '#5fb57a'], ['#1f3b5a', '#152a45']],
      story: [
        ['narr', 'Давным-давно Солнце и Луна светили на одном небе. Днём и ночью их свет сплетался в один — тёплый и серебряный.'],
        ['narr', 'Но однажды пришла Тень и разбила небо пополам. Солнце осталось в Дневном мире. Луна — в Ночном.'],
        ['sun', 'Где ты? Я тебя не вижу… Но я чувствую — ты где-то совсем рядом, за тонкой стеной.'],
        ['moon', 'Я здесь! Между нашими мирами есть порталы. Сквозь них может пройти только свет.'],
        ['both', 'Давай зажжём кристаллы — и найдём дорогу друг к другу. Крути зеркала в своём мире, а я — в своём.'],
      ],
    },
    {
      name: 'Пустыня зеркал', lv: [4, 5, 6, 7],
      sky: [['#7fb8ff', '#ffd29a', '#ffb06b'], ['#120a2e', '#2b1d55', '#4a2a5a']], land: [['#e8b06a', '#c98a45'], ['#3a2a55', '#2a1d40']],
      story: [
        ['narr', 'Сад зацвёл, и тёплый луч впервые прошёл сквозь портал. Луна почувствовала его — как прикосновение к руке.'],
        ['moon', 'Это ты! Я видела твой свет! Но дальше пустыня — там зеркала разбросаны повсюду.'],
        ['sun', 'Не каждое зеркало нам нужно. Некоторые просто стоят и ждут, чтобы нас запутать.'],
        ['both', 'Порталов станет больше. Говори мне номер портала — и я найду, куда пришёл твой свет.'],
      ],
    },
    {
      name: 'Витражи', lv: [8, 9, 10, 11],
      sky: [['#ffd6a0', '#ff9ec0', '#b07ad6'], ['#0a0820', '#24143f', '#3d1f4a']], land: [['#7a4a8a', '#5a3a6a'], ['#1a1030', '#120c24']],
      story: [
        ['narr', 'За пустыней стоит старый храм. Его окна — цветные витражи, и белый свет, проходя сквозь них, распадается на цвета.'],
        ['sun', 'Смотри: стекло пропускает только свой цвет. Красное оставит красный, синее — синий.'],
        ['moon', 'А кристаллы теперь разные. Каждый ждёт свой цвет — не больше и не меньше.'],
        ['both', 'Цвет кристалла видно по его краям. Если горит не тем цветом — значит, свет пришёл не тот.'],
      ],
    },
    {
      name: 'Ледяные пещеры', lv: [12, 13, 14, 15],
      sky: [['#bfefff', '#8fd4f0', '#d9f6ff'], ['#03142a', '#0a2a4a', '#123a5a']], land: [['#a8e4ff', '#6fc0e8'], ['#1d5a80', '#0f3a5a']],
      story: [
        ['narr', 'Под храмом — пещеры изо льда. Здесь холодно, и даже свету нужно держаться вместе.'],
        ['moon', 'Ледяные призмы делят луч надвое: одна половина идёт прямо, другая — в сторону.'],
        ['sun', 'Значит, один луч может зажечь сразу два кристалла. Как будто мы делимся светом.'],
        ['both', 'Мы уже так близко. Я почти слышу, как ты смеёшься.'],
      ],
    },
    {
      name: 'Затмение', lv: [16, 17, 18, 19],
      sky: [['#ff9e6b', '#c0507e', '#3a1f4a'], ['#05030d', '#1a0f2e', '#3a1840']], land: [['#4a2a4a', '#2a1630'], ['#1a0c20', '#0d0612']],
      story: [
        ['narr', 'На краю неба их ждала Тень. Она думала, что свет, разделённый надвое, слабее.'],
        ['sun', 'Она ошиблась. Вдвоём мы сильнее, чем каждый по отдельности.'],
        ['moon', 'Здесь всё сразу: цвета, порталы, лёд. Последние кристаллы — и мы встретимся.'],
        ['both', 'Держи мой свет. Я держу твой.'],
      ],
    },
  ];
  const FINALE = [
    ['narr', 'Последний кристалл вспыхнул — и небо снова стало целым.'],
    ['both', 'Солнце и Луна встретились. Совсем ненадолго — на одно затмение. Но этого хватило, чтобы всё вокруг засияло.'],
    ['narr', 'Говорят, с тех пор каждый раз, когда двое далеко друг от друга смотрят на одно небо, свет находит дорогу.'],
    ['final', ''],
  ];
  const chOf = (lv) => CH.findIndex((c) => c.lv.includes(lv));
  const mkey = (w, x, y) => w + ',' + x + ',' + y;

  // ---------- Персонажи ----------
  function drawSunChar(g, x, y, r, t, happy = 1) {
    g.save(); g.translate(x, y);
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, r * 3, '#ffb347', 0.55); g.globalCompositeOperation = 'source-over';
    g.rotate(t * 0.2);
    g.fillStyle = '#ffd36b';
    for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(r * 1.05, -r * 0.14); g.lineTo(r * (1.45 + Math.sin(t * 3 + i) * 0.06), 0); g.lineTo(r * 1.05, r * 0.14); g.fill(); }
    g.rotate(-t * 0.2);
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#fff6c4'); gr.addColorStop(1, '#ffb83a');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = '#8a4a1a'; g.lineWidth = r * 0.07; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.35, -r * 0.08, r * 0.14, Math.PI + 0.3, -0.3); g.stroke(); }
    g.beginPath(); g.arc(0, r * 0.18, r * 0.25 * happy, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = 'rgba(255,120,120,0.45)'; g.beginPath(); g.ellipse(-r * 0.6, r * 0.2, r * 0.16, r * 0.1, 0, 0, TAU); g.ellipse(r * 0.6, r * 0.2, r * 0.16, r * 0.1, 0, 0, TAU); g.fill();
    g.restore();
  }
  function drawMoonChar(g, x, y, r, t) {
    g.save(); g.translate(x, y);
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, r * 2.8, '#9fc4ff', 0.5); g.globalCompositeOperation = 'source-over';
    g.rotate(Math.sin(t * 0.8) * 0.08);
    const gr = g.createRadialGradient(-r * 0.4, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b9c8ff');
    g.fillStyle = gr; g.beginPath();
    g.arc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7);
    g.arc(r * 0.45, -r * 0.05, r * 0.82, Math.PI * 1.55, Math.PI * 0.45, true);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(150,160,220,0.35)'; g.beginPath(); g.arc(-r * 0.55, r * 0.35, r * 0.12, 0, TAU); g.arc(-r * 0.7, -r * 0.3, r * 0.08, 0, TAU); g.fill();
    g.strokeStyle = '#4a4a8a'; g.lineWidth = r * 0.07; g.lineCap = 'round';
    g.beginPath(); g.arc(-r * 0.42, -r * 0.12, r * 0.13, Math.PI + 0.3, -0.3); g.stroke();
    g.beginPath(); g.arc(-r * 0.38, r * 0.25, r * 0.15, 0.3, Math.PI - 0.6); g.stroke();
    g.fillStyle = 'rgba(255,140,180,0.5)'; g.beginPath(); g.ellipse(-r * 0.66, r * 0.12, r * 0.12, r * 0.08, 0, 0, TAU); g.fill();
    g.restore();
  }

  // ---------- Пейзаж главы (рисуется в кэш) ----------
  function drawLand(g, w, h, ci, wd) {
    const C = CH[ci], sky = C.sky[wd], land = C.land[wd];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, sky[0]); gr.addColorStop(0.55, sky[1]); gr.addColorStop(1, sky[2]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = RNG(ci * 31 + wd * 7 + 3);
    if (wd === 1) for (let i = 0; i < (w * h) / 1800; i++) { g.fillStyle = `rgba(255,255,255,${r.range(0.2, 0.9)})`; const s = Math.pow(r(), 3) * 2 + 0.4; g.fillRect(r() * w, r() * h * 0.75, s, s); }
    else for (let i = 0; i < 6; i++) { const cx = r() * w, cy = r.range(0.08, 0.4) * h, s = r.range(40, 90) * Math.max(1, w / 1200); g.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(cx + (k - 2) * s * 0.45, cy + Math.sin(k * 2) * s * 0.12, s * 0.5, s * 0.3, 0, 0, TAU); g.fill(); } }
    const hill = (base, amp, col, seed) => {
      const rr = RNG(seed); const ph = [rr() * 6, rr() * 6, rr() * 6];
      g.fillStyle = col; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - Math.sin(x / w * 5 + ph[0]) * amp * h - Math.sin(x / w * 11 + ph[1]) * amp * h * 0.4);
      g.lineTo(w, h); g.closePath(); g.fill();
    };
    if (ci === 0) {
      hill(0.74, 0.04, land[1], 11 + wd); hill(0.84, 0.03, land[0], 17 + wd);
      for (let i = 0; i < 9; i++) { const x = r() * w, y = h * r.range(0.72, 0.86), s = r.range(14, 30) * Math.max(1, w / 1200); g.fillStyle = mixColor(land[1], '#000000', 0.25); g.fillRect(x - s * 0.1, y, s * 0.2, s * 0.9); g.fillStyle = land[0]; g.beginPath(); g.arc(x, y, s * 0.7, 0, TAU); g.fill(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = r.pick(wd ? ['#9fb8ff', '#c9a6ff', '#7ae0ff'] : ['#ff8fb8', '#ffd36b', '#ffffff']); g.beginPath(); g.arc(r() * w, h * r.range(0.86, 1), r.range(2, 4), 0, TAU); g.fill(); }
    } else if (ci === 1) {
      hill(0.7, 0.05, land[1], 23 + wd); hill(0.82, 0.04, land[0], 29 + wd);
      for (let i = 0; i < 6; i++) { const x = r() * w, y = h * r.range(0.66, 0.8), s = r.range(30, 70); g.fillStyle = wd ? 'rgba(170,190,255,0.35)' : 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.25, y - s); g.lineTo(x + s * 0.5, y); g.closePath(); g.fill(); }
    } else if (ci === 2) {
      hill(0.86, 0.015, land[0], 41 + wd);
      const cx = w / 2, by = h * 0.86, tw = Math.min(w * 0.5, 520);
      g.fillStyle = land[1];
      g.fillRect(cx - tw / 2, by - h * 0.32, tw, h * 0.32);
      g.beginPath(); g.moveTo(cx - tw * 0.18, by - h * 0.32); g.lineTo(cx, by - h * 0.5); g.lineTo(cx + tw * 0.18, by - h * 0.32); g.fill();
      for (const sx of [-1, 1]) { g.fillRect(cx + sx * tw * 0.42 - tw * 0.06, by - h * 0.44, tw * 0.12, h * 0.44); g.beginPath(); g.moveTo(cx + sx * tw * 0.42 - tw * 0.07, by - h * 0.44); g.lineTo(cx + sx * tw * 0.42, by - h * 0.54); g.lineTo(cx + sx * tw * 0.42 + tw * 0.07, by - h * 0.44); g.fill(); }
      const rc = [COL[1], COL[4], COL[3], COL[5], COL[2], COL[6]];
      for (let i = 0; i < 12; i++) { g.fillStyle = hexA(rc[i % 6], 0.55); g.beginPath(); g.moveTo(cx, by - h * 0.24); g.arc(cx, by - h * 0.24, tw * 0.09, (i / 12) * TAU, ((i + 1) / 12) * TAU); g.fill(); }
    } else if (ci === 3) {
      for (let i = 0; i < 18; i++) { const x = (i + r()) * w / 18, l = r.range(0.06, 0.2) * h; g.fillStyle = hexA(land[0], 0.8); g.beginPath(); g.moveTo(x - 14, 0); g.lineTo(x, l); g.lineTo(x + 14, 0); g.fill(); }
      hill(0.86, 0.02, land[1], 53 + wd);
      for (let i = 0; i < 10; i++) { const x = r() * w, y = h * r.range(0.84, 0.95), s = r.range(20, 50); g.fillStyle = hexA(land[0], 0.85); g.beginPath(); g.moveTo(x - s * 0.2, y); g.lineTo(x, y - s); g.lineTo(x + s * 0.2, y); g.closePath(); g.fill(); }
    } else {
      hill(0.8, 0.03, land[0], 61 + wd); hill(0.9, 0.02, land[1], 67 + wd);
      for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h * 0.7, s = r.range(6, 16); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.6, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.6, y); g.fill(); }
    }
  }
  const landCache = new Map();
  function landImg(ci, wd, w, h) {
    const key = `${ci}:${wd}:${w}:${h}`;
    if (landCache.has(key)) return landCache.get(key);
    if (landCache.size > 12) landCache.clear();
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    drawLand(c.getContext('2d'), c.width, c.height, ci, wd);
    landCache.set(key, c); return c;
  }

  GAMES.lights = {
    id: 'lights', title: 'Свет двух миров', icon: '🌗', color: '#ffcf7a',
    tagline: 'Головоломка-история: Солнце и Луна ищут друг друга',
    roles: [
      { id: 'sun', name: 'Солнце', icon: '☀️', desc: 'Твой мир — Дневной. Крутишь зеркала в нём и отправляешь свет в Ночной мир через порталы.', ctrl: { pc: 'клик по зеркалу — повернуть', touch: 'касание зеркала — повернуть' } },
      { id: 'moon', name: 'Луна', icon: '🌙', desc: 'Твой мир — Ночной. Ловишь свет из порталов и ведёшь его к кристаллам. Без тебя Солнцу не справиться.', ctrl: { pc: 'клик по зеркалу — повернуть', touch: 'касание зеркала — повернуть' } },
    ],
    rules: [
      'Вы видите разные миры: Дневной и Ночной. Каждый поворачивает зеркала только в своём мире.',
      'Свет идёт от фонарей, отражается от зеркал и проходит через порталы с одинаковыми номерами — из одного мира в другой.',
      'Зажгите все кристаллы в обоих мирах — каждый своим цветом. Цвет кристалла — по его краю.',
      'Рассказывайте друг другу: «мой луч ушёл в портал 2», «у меня кристалл ждёт синий». 5 глав, 20 уровней и финал истории.',
      'Застряли? Кнопка 💡 подсветит одно неправильное зеркало в твоём мире.',
    ],
    info() { const p = Store.get('lt_prog', 0); return p >= LV.length ? 'история пройдена ✦' : `глава ${chOf(Math.min(p, LV.length - 1)) + 1} · уровень ${p + 1}/${LV.length}`; },
    create(ctx) { return new Lights(ctx); },
  };

  class Lights {
    constructor(ctx) {
      this.ctx = ctx;
      this.wd = ctx.role === 'sun' ? 0 : 1;
      this.names = { 0: ctx.role === 'sun' ? ctx.me.name : ctx.peer.name, 1: ctx.role === 'moon' ? ctx.me.name : ctx.peer.name };
      this.g = ctx.canvas.getContext('2d');
      this.parts = new Particles();
      this.ang = new Map(); this.flash = null; this.taps = []; this.typed = 0;
      this.hintsLeft = 3;
      this.ui = h(`<div class="passthru lt-root" style="position:absolute;inset:0">
        <div class="g-top"><div class="g-panel lt-hud"><span id="ltTitle"></span><span id="ltPeer"></span></div></div>
        <div class="lt-tools"><button class="iconbtn" id="ltHint" title="Подсказка">💡</button><button class="iconbtn" id="ltReset" title="Вернуть зеркала">↺</button><button class="iconbtn" id="ltHelp" title="Что есть что">?</button></div>
      </div>`);
      ctx.ui.appendChild(this.ui);
      $('#ltHint', this.ui).onclick = () => this.hint();
      $('#ltReset', this.ui).onclick = () => { SFX.play('whoosh'); this.toHost({ a: 'reset', w: this.wd }); };
      $('#ltHelp', this.ui).onclick = () => this.legend();
      this.bindInput();
      if (ctx.isHost) {
        this.S = { phase: 'menu', lv: 0, prog: Store.get('lt_prog', 0), mir: {}, page: 0, story: null };
        this.broadcast();
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }
    toHost(d) { if (this.ctx.isHost) this.onMsg(d); else this.ctx.send(d); }

    // ================= Хост =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.apply(this.S); }
    startLevel(lv) {
      const S = this.S, L = LV[lv];
      S.lv = lv; S.mir = {};
      for (const o of L.o) if (o[3] === 'm' && !o[5]) S.mir[mkey(o[0], o[1], o[2])] = o[4];
      S.phase = 'play'; S.story = null;
      this.broadcast();
    }
    openLevel(lv) {
      const S = this.S, ci = chOf(lv);
      // в начале главы — сначала история
      if (CH[ci].lv[0] === lv) { S.lv = lv; S.phase = 'story'; S.story = 'ch' + ci; S.page = 0; this.broadcast(); }
      else this.startLevel(lv);
    }
    checkWin() {
      const S = this.S, L = LV[S.lv];
      const tr = trace(L, this.grid, this.mirMap(S));
      if (!solvedWorld(L, tr.hits)) return;
      S.phase = 'clear';
      S.prog = Math.max(S.prog, S.lv + 1);
      Store.set('lt_prog', Math.max(Store.get('lt_prog', 0), S.lv + 1));
    }
    nextAfterClear() {
      const S = this.S;
      if (S.lv + 1 >= LV.length) { S.phase = 'story'; S.story = 'fin'; S.page = 0; return this.broadcast(); }
      this.openLevel(S.lv + 1);
    }

    // ================= Сообщения =================
    onMsg(d) {
      const host = this.ctx.isHost, S = this.S;
      switch (d.a) {
        case 'S': this.apply(d.S); break;
        case 'rot':
          if (host && S.phase === 'play' && d.k in S.mir) { S.mir[d.k] ^= 1; this.checkWin(); this.broadcast(); }
          break;
        case 'reset':
          if (host && S.phase === 'play') { for (const o of LV[S.lv].o) if (o[3] === 'm' && !o[5] && o[0] === d.w) S.mir[mkey(o[0], o[1], o[2])] = o[4]; this.broadcast(); }
          break;
        case 'next':
          if (!host) break;
          if (S.phase === 'story') {
            const pages = S.story === 'fin' ? FINALE : CH[+S.story.slice(2)].story;
            if (S.page + 1 < pages.length) { S.page++; this.broadcast(); }
            else if (S.story === 'fin') { S.phase = 'menu'; this.broadcast(); }
            else this.startLevel(S.lv);
          } else if (S.phase === 'clear') this.nextAfterClear();
          break;
        case 'go': if (host && d.lv <= S.prog && d.lv < LV.length) this.openLevel(d.lv); break;
        case 'fin': if (host && S.prog >= LV.length) { S.phase = 'story'; S.story = 'fin'; S.page = 0; this.broadcast(); } break;
        case 'menu': if (host) { S.phase = 'menu'; this.broadcast(); } break;
        case 'ping': this.peerPing = { k: d.k, t: 0 }; break;
      }
    }
    mirMap(S) { return new Map(Object.entries(S.mir)); }
    apply(S) {
      const prevPhase = this._ph, prevLv = this._lv, prevPage = this._pg;
      this.S = S;
      if (S.prog > Store.get('lt_prog', 0)) Store.set('lt_prog', S.prog);
      const L = LV[S.lv];
      if (prevLv !== S.lv || !this.grid) { this.grid = build(L); this.ang = new Map(); this.hintsLeft = 3; this.flash = null; }
      this.tr = trace(L, this.grid, this.mirMap(S));
      this._ph = S.phase; this._lv = S.lv; this._pg = S.page;
      if (S.phase !== prevPhase || S.lv !== prevLv || S.page !== prevPage) this.onPhase(prevPhase);
      this.updateHud();
    }
    onPhase(prev) {
      const S = this.S;
      this.overlay(null);
      this.ui.classList.toggle('playing', S.phase === 'play' || S.phase === 'clear');
      if (S.phase === 'menu') this.showMenu();
      if (S.phase === 'story') { this.typed = 0; this.showStory(); SFX.play('chime'); }
      if (S.phase === 'play' && prev !== 'play') { SFX.play('bellLow'); if (S.lv === 0) setTimeout(() => this.ctx.toast('Нажми на зеркало с кружком — оно повернётся ✦', 4500), 600); }
      if (S.phase === 'clear') {
        SFX.play('win'); setTimeout(() => SFX.play('chime'), 700);
        const lay = this.lay;
        if (lay) for (const o of LV[S.lv].o) if (o[3] === 't' && o[0] === this.wd) this.parts.emit(lay.ox + (o[1] + 0.5) * lay.ts, lay.oy + (o[2] + 0.5) * lay.ts, { n: 40, speed: 260, life: 1.4, size: 12, color: [COL[o[4]], '#fff'] });
        const ci = chOf(S.lv), last = CH[ci].lv[3] === S.lv;
        setTimeout(() => {
          if (this.S.phase !== 'clear') return;
          this.overlay(`<div class="panel lv-end lt-clear"><div class="lt-k">${CH[ci].name.toUpperCase()} · ${CH[ci].lv.indexOf(S.lv) + 1} / 4</div>
            <h2>${last ? 'Глава пройдена!' : 'Свет прошёл!'}</h2><p>${last ? 'Солнце и Луна стали ещё ближе ✦' : 'Все кристаллы горят.'}</p>
            <button class="btn" data-a="next">${S.lv + 1 >= LV.length ? 'Финал истории →' : last ? 'Следующая глава →' : 'Дальше →'}</button><button class="btn ghost" data-a="menu">Карта путешествия</button></div>`);
        }, 1600);
      }
    }
    overlay(html) {
      const o = this.ui.querySelector('.lv-ov'); if (o) o.remove();
      if (!html) return;
      const el = h(`<div class="lv-ov lt-ov">${html}</div>`);
      el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: b.dataset.a }); }));
      el.querySelectorAll('[data-lv]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost({ a: 'go', lv: +b.dataset.lv }); }));
      this.ui.appendChild(el);
      return el;
    }
    showMenu() {
      const p = this.S.prog;
      const chs = CH.map((c, ci) => {
        const open = c.lv[0] <= p;
        return `<div class="lt-ch ${open ? '' : 'locked'}"><div class="lt-chn"><span>${ci + 1}</span>${c.name}</div>
          <div class="lt-nodes">${c.lv.map((lv, i) => `<button class="lt-node ${lv < p ? 'done' : lv === p ? 'cur' : ''}" ${lv <= p ? `data-lv="${lv}"` : 'disabled'}>${lv < p ? '✦' : i + 1}</button>`).join('<i></i>')}</div></div>`;
      }).join('');
      const next = Math.min(p, LV.length - 1);
      this.overlay(`<div class="panel lt-menu"><h2>🌗 Свет двух миров</h2>
        <p class="sub">${this.wd === 0 ? `Ты — <b>Солнце</b>, твой мир Дневной` : `Ты — <b>Луна</b>, твой мир Ночной`}. ${p >= LV.length ? 'История пройдена — можно переиграть любой уровень.' : 'Путешествие продолжается.'}</p>
        <div class="lt-chs">${chs}</div>
        ${p < LV.length ? `<button class="btn" data-lv="${next}">${p ? 'Продолжить' : 'Начать историю'} ✦</button>` : '<button class="btn" data-a="fin">Посмотреть финал снова ✦</button>'}</div>`);
    }
    storyPages() { const S = this.S; return S.story === 'fin' ? FINALE : CH[+S.story.slice(2)].story; }
    showStory() {
      const S = this.S, pages = this.storyPages(), [who, text] = pages[S.page];
      const nm = { sun: `☀ ${esc(this.names[0])}`, moon: `🌙 ${esc(this.names[1])}`, both: '☀ & 🌙', narr: '' }[who] || '';
      const title = S.story === 'fin' ? 'Финал' : `Глава ${+S.story.slice(2) + 1} · ${CH[+S.story.slice(2)].name}`;
      if (who === 'final') {
        this.overlay(`<div class="panel lt-final"><div class="lt-k">КОНЕЦ ИСТОРИИ</div>
          <h2>${esc(this.names[0])} ✦ ${esc(this.names[1])}</h2>
          <p class="lt-msg">${esc(CONFIG.finalMessage).replace(/\n/g, '<br>')}</p>
          <button class="btn" data-a="next">Вернуться к карте</button></div>`);
        return;
      }
      const el = this.overlay(`<div class="lt-story"><div class="lt-k">${title}</div>${nm ? `<div class="lt-who ${who}">${nm}</div>` : ''}
        <div class="lt-text" data-full="${esc(text)}"></div>
        <div class="lt-row"><span class="lt-dots">${pages.map((_, i) => `<i class="${i === S.page ? 'on' : ''}"></i>`).join('')}</span><button class="btn small" data-a="next">${S.page + 1 < pages.length ? 'Дальше →' : S.story === 'fin' ? 'Дальше →' : 'Начать ✦'}</button></div></div>`);
      el.classList.add('lt-story-ov');
      this.storyEl = $('.lt-text', el); this.typed = 0;
      // первое нажатие — дописать текст, второе — дальше
      $('[data-a="next"]', el).onclick = () => {
        SFX.play('click');
        const full = this.storyEl.dataset.full;
        if (this.typed < full.length) { this.typed = full.length; this.storyEl.textContent = full; return; }
        this.toHost({ a: 'next' });
      };
    }
    legend() {
      SFX.play('click');
      this.ctx.modal({
        title: 'Что есть что',
        text: `<div class="lt-legend">
          <div><b>🏮 Фонарь</b> — источник света. Цвет луча = цвет фонаря.</div>
          <div><b>◩ Зеркало с кружком</b> — нажми, чтобы повернуть. Зеркало с болтами — закреплено.</div>
          <div><b>🌀 Портал</b> — свет уходит в портал с тем же номером в другом мире.</div>
          <div><b>💎 Кристалл</b> — должен гореть ровно своим цветом (цвет по краю).</div>
          <div><b>🟥 Цветное стекло</b> — пропускает только свой цвет: белый → красный.</div>
          <div><b>❄ Ледяная призма</b> — делит луч на два: прямо и в сторону.</div>
          <div><b>🧱 Камень</b> — свет не проходит.</div>
          <div style="margin-top:8px">Цвета: белый = красный + зелёный + синий; жёлтый = красный + зелёный; фиолетовый = красный + синий; бирюзовый = зелёный + синий.</div></div>`,
        buttons: [{ label: 'Понятно ✦' }],
      });
    }
    updateHud() {
      const S = this.S; if (!S) return;
      const L = LV[S.lv], ci = chOf(S.lv);
      $('#ltTitle', this.ui).textContent = `${this.wd === 0 ? '☀ Дневной мир' : '🌙 Ночной мир'} · гл. ${ci + 1} · ${CH[ci].lv.indexOf(S.lv) + 1}/4`;
      const pw = 1 - this.wd, ts = L.o.filter((o) => o[3] === 't' && o[0] === pw);
      const lit = ts.filter((o) => (this.tr.hits.get(mkey(o[0], o[1], o[2])) || 0) === o[4]).length;
      $('#ltPeer', this.ui).innerHTML = ts.length ? `у ${esc(this.names[pw])}: 💎 <b>${lit}/${ts.length}</b>` : `у ${esc(this.names[pw])} кристаллов нет`;
      $('#ltHint', this.ui).dataset.n = this.hintsLeft;
    }
    hint() {
      const S = this.S; if (!S || S.phase !== 'play') return;
      if (this.hintsLeft <= 0) { this.ctx.toast('Подсказки на этом уровне закончились 💡'); return; }
      const wrong = LV[S.lv].o.find((o) => o[3] === 'm' && !o[5] && o[6] && o[0] === this.wd && S.mir[mkey(o[0], o[1], o[2])] !== o[7]);
      if (!wrong) { this.ctx.toast(`В твоём мире всё верно ✦ Дело за ${esc(this.names[1 - this.wd])}`); return; }
      this.hintsLeft--; SFX.play('magic');
      this.flash = { k: mkey(wrong[0], wrong[1], wrong[2]), t: 0 };
      this.ctx.toast(`💡 Поверни подсвеченное зеркало (осталось подсказок: ${this.hintsLeft})`);
      this.updateHud();
    }

    // ================= Ввод =================
    bindInput() {
      this.ctx.canvas.addEventListener('pointerdown', (e) => {
        const S = this.S; if (!S || S.phase !== 'play' || !this.lay) return;
        const { ts, ox, oy } = this.lay;
        const x = Math.floor((e.clientX - ox) / ts), y = Math.floor((e.clientY - oy) / ts);
        const k = mkey(this.wd, x, y);
        this.taps.push({ x: e.clientX, y: e.clientY, t: 0 });
        if (k in S.mir) {
          SFX.tone(660 + Math.random() * 120, 0.12, { type: 'triangle', vol: 0.12 });
          if (this.flash && this.flash.k === k) this.flash = null;
          this.toHost({ a: 'rot', k });
        } else {
          const o = this.grid[this.wd].get(x + ',' + y);
          if (o && o[3] === 'm') { SFX.tone(140, 0.1, { vol: 0.12 }); this.ctx.toast('Это зеркало закреплено 🔩'); }
        }
      });
    }

    // ================= Кадр =================
    frame(dt, t) {
      const g = this.g, cv = this.ctx.canvas, dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const S = this.S;
      this.parts.update(dt);
      if (!S) return;
      if (S.phase === 'story' || S.phase === 'menu') this.drawStory(g, w, hh, t);
      else this.drawWorld(g, w, hh, t, dt);
      this.parts.draw(g);
      // печатная машинка для истории
      if (this.storyEl && this.storyEl.isConnected) {
        const full = this.storyEl.dataset.full;
        if (this.typed < full.length) { this.typed = Math.min(full.length, this.typed + dt * 38); this.storyEl.textContent = full.slice(0, Math.floor(this.typed)); if (Math.random() < 0.3) SFX.play('tick'); }
      }
    }

    drawStory(g, w, hh, t) {
      const S = this.S;
      const ci = S.story === 'fin' ? 4 : S.story ? +S.story.slice(2) : chOf(Math.min(S.prog, LV.length - 1));
      const fin = S.story === 'fin';
      // два мира бок о бок, между ними трещина
      const half = w / 2;
      const meet = fin ? Math.min(1, (S.page + 1) / 3) : ci / 5;
      g.drawImage(landImg(ci, 0, w, hh), 0, 0, w, hh, 0, 0, w, hh);
      g.save(); g.beginPath(); g.rect(half, 0, w - half, hh); g.clip();
      g.drawImage(landImg(ci, 1, w, hh), 0, 0); g.restore();
      // трещина
      const crackA = fin ? 1 - meet : 1;
      if (crackA > 0) {
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = `rgba(255,240,220,${0.6 * crackA})`; g.lineWidth = 3; g.beginPath();
        for (let y = 0; y <= hh; y += 20) g.lineTo(half + Math.sin(y * 0.05 + t) * 6 + (RNG(y)() - 0.5) * 10, y);
        g.stroke();
        for (let y = 0; y < hh; y += 60) Glow.draw(g, half, y + (t * 40) % 60, 40, '#fff1d6', 0.25 * crackA);
        g.globalCompositeOperation = 'source-over';
      }
      const r = Math.min(w, hh) * 0.1;
      const gap = lerp(w * 0.28, r * 0.6, meet);
      const cy = hh * (hh > w ? 0.3 : 0.32) + Math.sin(t) * 6;
      drawSunChar(g, half - gap, cy, r, t);
      drawMoonChar(g, half + gap, cy + Math.cos(t) * 6, r * 0.95, t);
      if (fin && S.page >= 1) {
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, half, cy, r * 5, '#ffe7c4', 0.4 + Math.sin(t * 2) * 0.1);
        g.globalCompositeOperation = 'source-over';
        if (Math.random() < 0.15) this.parts.emit(half + rand(-r, r), cy + rand(-r, r), { n: 2, speed: 80, life: 2, size: 8, color: ['#ffd36b', '#b9c8ff', '#ffb3d6'] });
      }
    }

    drawWorld(g, w, hh, t, dt) {
      const S = this.S, L = LV[S.lv], ci = chOf(S.lv), wd = this.wd;
      g.drawImage(landImg(ci, wd, w, hh), 0, 0);
      // небесное тело
      if (wd === 0) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, w * 0.88, hh * 0.13, Math.min(w, hh) * 0.25, '#ffd36b', 0.5); g.globalCompositeOperation = 'source-over'; }
      else { g.globalCompositeOperation = 'lighter'; Glow.draw(g, w * 0.88, hh * 0.13, Math.min(w, hh) * 0.2, '#b9c8ff', 0.45); g.globalCompositeOperation = 'source-over'; }
      const short = hh < 500, top = short ? 56 : 64, bot = short ? 14 : 70;
      const ts = Math.floor(Math.min((w - 24) / L.W, (hh - top - bot) / L.H, 110));
      const ox = Math.round((w - ts * L.W) / 2), oy = Math.round(top + (hh - top - bot - ts * L.H) / 2);
      this.lay = { ts, ox, oy };
      // доска
      g.fillStyle = wd === 0 ? 'rgba(74,40,52,0.62)' : 'rgba(10,14,40,0.62)';
      roundRect(g, ox - 10, oy - 10, ts * L.W + 20, ts * L.H + 20, 18); g.fill();
      g.strokeStyle = wd === 0 ? 'rgba(255,210,150,0.55)' : 'rgba(170,190,255,0.35)'; g.lineWidth = 2; roundRect(g, ox - 10, oy - 10, ts * L.W + 20, ts * L.H + 20, 18); g.stroke();
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
        g.fillStyle = (x + y) % 2 ? (wd === 0 ? 'rgba(255,200,150,0.14)' : 'rgba(90,110,200,0.12)') : (wd === 0 ? 'rgba(255,220,180,0.07)' : 'rgba(60,80,170,0.08)');
        roundRect(g, ox + x * ts + 2, oy + y * ts + 2, ts - 4, ts - 4, ts * 0.12); g.fill();
      }
      const cx = (x) => ox + (x + 0.5) * ts, cy = (y) => oy + (y + 0.5) * ts;
      const tr = this.tr;
      // лучи
      g.globalCompositeOperation = 'lighter';
      for (const s of tr.segs) {
        if (s[0] !== wd) continue;
        let [, x1, y1, x2, y2, c, fl] = s;
        let ex = cx(x2), ey = cy(y2);
        if (fl) { const ddx = Math.sign(x2 - x1), ddy = Math.sign(y2 - y1); ex -= ddx * ts * 0.5; ey -= ddy * ts * 0.5; }
        const sx = cx(x1), sy = cy(y1), col = COL[c];
        g.lineCap = 'round';
        g.strokeStyle = hexA(col, 0.18); g.lineWidth = ts * 0.42; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        g.strokeStyle = hexA(col, 0.55); g.lineWidth = ts * 0.13; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(1.5, ts * 0.035); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        const len = Math.hypot(ex - sx, ey - sy);
        for (let d = ((t * ts * 2.2) % (ts * 0.8)); d < len; d += ts * 0.8) Glow.draw(g, sx + (ex - sx) * d / len, sy + (ey - sy) * d / len, ts * 0.14, col, 0.9);
      }
      g.globalCompositeOperation = 'source-over';
      // предметы
      for (const o of L.o) {
        if (o[0] !== wd) continue;
        const x = cx(o[1]), y = cy(o[2]), k = mkey(o[0], o[1], o[2]), tp = o[3];
        if (tp === 'w') {
          const gr = g.createLinearGradient(0, y - ts / 2, 0, y + ts / 2);
          if (wd === 0) { gr.addColorStop(0, '#d9b98a'); gr.addColorStop(1, '#9a7448'); } else { gr.addColorStop(0, '#3b3f6a'); gr.addColorStop(1, '#1d1f3a'); }
          g.fillStyle = gr; roundRect(g, x - ts * 0.44, y - ts * 0.44, ts * 0.88, ts * 0.88, ts * 0.12); g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - ts * 0.44, y); g.lineTo(x + ts * 0.44, y); g.moveTo(x, y - ts * 0.44); g.lineTo(x, y); g.moveTo(x - ts * 0.2, y); g.lineTo(x - ts * 0.2, y + ts * 0.44); g.stroke();
        } else if (tp === 's') {
          const col = COL[o[5]];
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, x, y, ts * 0.9, col, 0.8 + Math.sin(t * 3) * 0.1); g.globalCompositeOperation = 'source-over';
          g.fillStyle = wd === 0 ? '#7a4a2a' : '#2a2a5a'; roundRect(g, x - ts * 0.3, y - ts * 0.3, ts * 0.6, ts * 0.6, ts * 0.16); g.fill();
          g.fillStyle = col; g.beginPath(); g.arc(x, y, ts * 0.2, 0, TAU); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(x - ts * 0.06, y - ts * 0.06, ts * 0.07, 0, TAU); g.fill();
          const [ddx, ddy] = D[o[4]];
          g.fillStyle = hexA(col, 0.9); g.beginPath(); g.moveTo(x + ddx * ts * 0.46, y + ddy * ts * 0.46); g.lineTo(x + ddx * ts * 0.3 - ddy * ts * 0.12, y + ddy * ts * 0.3 + ddx * ts * 0.12); g.lineTo(x + ddx * ts * 0.3 + ddy * ts * 0.12, y + ddy * ts * 0.3 - ddx * ts * 0.12); g.fill();
        } else if (tp === 'm') {
          const mov = k in S.mir, or = mov ? S.mir[k] : o[4];
          const target = or === 0 ? -Math.PI / 4 : Math.PI / 4;
          const cur = this.ang.has(k) ? this.ang.get(k) : target;
          const na = lerp(cur, target, 1 - Math.exp(-dt * 14)); this.ang.set(k, na);
          if (mov) {
            g.fillStyle = wd === 0 ? 'rgba(255,210,160,0.18)' : 'rgba(150,170,255,0.2)'; g.beginPath(); g.arc(x, y, ts * 0.4, 0, TAU); g.fill();
            g.strokeStyle = wd === 0 ? 'rgba(255,210,150,0.6)' : 'rgba(180,200,255,0.5)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(x, y, ts * 0.4, t * 0.5, t * 0.5 + TAU); g.stroke(); g.setLineDash([]);
          }
          g.save(); g.translate(x, y); g.rotate(na);
          const mg = g.createLinearGradient(-ts * 0.08, 0, ts * 0.08, 0);
          mg.addColorStop(0, '#6a6a8a'); mg.addColorStop(0.45, '#f4f8ff'); mg.addColorStop(0.55, '#bcd0ff'); mg.addColorStop(1, '#4a4a6a');
          g.fillStyle = mg; roundRect(g, -ts * 0.07, -ts * 0.44, ts * 0.14, ts * 0.88, ts * 0.05); g.fill();
          g.strokeStyle = o[5] ? '#3a2a1a' : (wd === 0 ? '#b07a3a' : '#8fa8ff'); g.lineWidth = 2; roundRect(g, -ts * 0.07, -ts * 0.44, ts * 0.14, ts * 0.88, ts * 0.05); g.stroke();
          g.restore();
          if (o[5]) { g.fillStyle = '#5a4a3a'; for (const s2 of [-1, 1]) { g.beginPath(); g.arc(x + s2 * ts * 0.3, y + s2 * ts * 0.3 * (or === 0 ? -1 : 1), ts * 0.06, 0, TAU); g.fill(); } }
          if (this.flash && this.flash.k === k) {
            this.flash.t += dt;
            const a = 0.5 + Math.sin(this.flash.t * 8) * 0.5;
            g.strokeStyle = `rgba(255,230,120,${a})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, ts * 0.46, 0, TAU); g.stroke();
            if (this.flash.t > 6) this.flash = null;
          }
        } else if (tp === 'p') {
          const inc = tr.portIn.get(k) || 0;
          const col = inc ? COL[inc] : (wd === 0 ? '#b07ad6' : '#8fa8ff');
          g.save(); g.translate(x, y);
          g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, ts * 0.75, col, inc ? 0.8 : 0.4); g.globalCompositeOperation = 'source-over';
          for (let i = 0; i < 3; i++) { g.rotate(t * (1.2 + i * 0.5)); g.strokeStyle = hexA(col, 0.9 - i * 0.2); g.lineWidth = Math.max(2, ts * 0.05); g.beginPath(); g.arc(0, 0, ts * (0.2 + i * 0.08), 0, Math.PI * 1.4); g.stroke(); }
          g.restore();
          g.fillStyle = '#fff'; g.font = `700 ${Math.max(11, ts * 0.3)}px Comfortaa`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(o[4], x, y + 1); g.textBaseline = 'alphabetic';
        } else if (tp === 'f') {
          const col = COL[o[4]];
          g.fillStyle = hexA(col, 0.45); roundRect(g, x - ts * 0.36, y - ts * 0.36, ts * 0.72, ts * 0.72, ts * 0.1); g.fill();
          g.strokeStyle = hexA(col, 0.95); g.lineWidth = 3; roundRect(g, x - ts * 0.36, y - ts * 0.36, ts * 0.72, ts * 0.72, ts * 0.1); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - ts * 0.22, y - ts * 0.1); g.lineTo(x - ts * 0.1, y - ts * 0.22); g.stroke();
        } else if (tp === 'x') {
          g.save(); g.translate(x, y); g.rotate(o[4] === 0 ? -Math.PI / 4 : Math.PI / 4);
          g.fillStyle = 'rgba(200,240,255,0.55)'; g.beginPath(); g.moveTo(0, -ts * 0.46); g.lineTo(ts * 0.12, 0); g.lineTo(0, ts * 0.46); g.lineTo(-ts * 0.12, 0); g.closePath(); g.fill();
          g.strokeStyle = '#e8fbff'; g.lineWidth = 2; g.stroke();
          g.restore();
        } else if (tp === 't') {
          const got = tr.hits.get(k) || 0, ok = got === o[4], col = COL[o[4]];
          g.save(); g.translate(x, y + Math.sin(t * 2 + o[1]) * ts * 0.03);
          if (ok) { g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, ts * 1.2, col, 0.9); g.globalCompositeOperation = 'source-over'; g.rotate(t * 0.3); g.strokeStyle = hexA(col, 0.6); g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.beginPath(); g.moveTo(ts * 0.38, 0); g.lineTo(ts * 0.52, 0); g.stroke(); } g.rotate(-t * 0.3); }
          const s = ts * 0.32;
          g.beginPath(); g.moveTo(0, -s * 1.2); g.lineTo(s * 0.85, -s * 0.3); g.lineTo(s * 0.55, s); g.lineTo(-s * 0.55, s); g.lineTo(-s * 0.85, -s * 0.3); g.closePath();
          const fillC = ok ? col : got ? COL[got] : (wd === 0 ? '#3a2438' : '#1a1d3a');
          const gg = g.createLinearGradient(0, -s, 0, s); gg.addColorStop(0, mixColor(fillC.length === 7 ? fillC : '#888888', '#ffffff', 0.5)); gg.addColorStop(1, fillC);
          g.fillStyle = gg; g.globalAlpha = ok ? 1 : got ? 0.6 + Math.sin(t * 12) * 0.2 : 0.75; g.fill(); g.globalAlpha = 1;
          g.strokeStyle = col; g.lineWidth = Math.max(2.5, ts * 0.07); g.stroke();
          g.restore();
        }
      }
      // всплеск от касаний
      for (let i = this.taps.length - 1; i >= 0; i--) {
        const f = this.taps[i]; f.t += dt; if (f.t > 0.4) { this.taps.splice(i, 1); continue; }
        g.strokeStyle = `rgba(255,240,200,${1 - f.t / 0.4})`; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, 6 + f.t * 60, 0, TAU); g.stroke();
      }
      // маленький персонаж в углу радуется, когда всё горит
      const mine = L.o.filter((o) => o[3] === 't' && o[0] === wd);
      const happy = mine.length ? mine.filter((o) => (tr.hits.get(mkey(o[0], o[1], o[2])) || 0) === o[4]).length / mine.length : 1;
      const mr = Math.min(34, ts * 0.45), mx = 14 + mr * 1.3, my = hh - 14 - mr * 1.3;
      if (wd === 0) drawSunChar(g, mx, my, mr, t, 0.4 + happy * 0.6); else drawMoonChar(g, mx, my, mr, t);
      if (S.phase === 'clear') { g.globalCompositeOperation = 'lighter'; Glow.draw(g, w / 2, hh / 2, Math.max(w, hh) * 0.5, wd === 0 ? '#ffd36b' : '#9fc4ff', 0.25 + Math.sin(t * 4) * 0.08); g.globalCompositeOperation = 'source-over'; }
    }

    resync() { if (this.ctx.isHost && this.S) this.broadcast(); }
    destroy() {}
  }
})();
