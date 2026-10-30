'use strict';
// «Созвездие» — рисуем звёздами на ночном небе, второй угадывает.
(() => {
  const WORDS = [
    'кот', 'собака', 'луна', 'солнце', 'дом', 'дерево', 'цветок', 'рыба', 'птица', 'сердце', 'звезда', 'облако', 'дождь', 'радуга', 'гора',
    'море', 'корабль', 'самолёт', 'машина', 'велосипед', 'поезд', 'ракета', 'зонт', 'очки', 'шляпа', 'корона', 'ключ', 'замок', 'свеча', 'лампа',
    'книга', 'гитара', 'пианино', 'барабан', 'микрофон', 'телефон', 'компьютер', 'часы', 'будильник', 'чашка', 'чайник', 'торт', 'пицца', 'мороженое', 'яблоко',
    'банан', 'вишня', 'арбуз', 'клубника', 'морковь', 'гриб', 'кактус', 'роза', 'подсолнух', 'ёлка', 'снеговик', 'снежинка', 'подарок', 'шарик', 'воздушный змей',
    'слон', 'жираф', 'лев', 'тигр', 'медведь', 'панда', 'заяц', 'лиса', 'волк', 'ёж', 'черепаха', 'улитка', 'бабочка', 'пчела', 'паук',
    'змея', 'дракон', 'единорог', 'русалка', 'привидение', 'робот', 'инопланетянин', 'принцесса', 'пират', 'ведьма', 'волшебник', 'рыцарь', 'ангел', 'вампир', 'зомби',
    'кит', 'дельфин', 'акула', 'осьминог', 'краб', 'медуза', 'пингвин', 'сова', 'утка', 'лебедь', 'попугай', 'фламинго', 'курица', 'корова', 'свинья',
    'лошадь', 'овца', 'мышь', 'хомяк', 'лягушка', 'динозавр', 'маяк', 'мост', 'башня', 'церковь', 'палатка', 'костёр', 'остров', 'вулкан', 'пустыня',
    'водопад', 'река', 'озеро', 'лес', 'пляж', 'пальма', 'парус', 'якорь', 'компас', 'карта', 'сундук', 'монета', 'алмаз', 'кольцо', 'бант',
    'платье', 'носок', 'ботинок', 'перчатка', 'шарф', 'рюкзак', 'чемодан', 'кровать', 'диван', 'стул', 'стол', 'окно', 'дверь', 'лестница', 'зеркало',
    'ножницы', 'карандаш', 'кисточка', 'молоток', 'пила', 'лопата', 'ведро', 'метла', 'пылесос', 'холодильник', 'телевизор', 'фотоаппарат', 'наушники', 'джойстик', 'мяч',
    'футбол', 'теннис', 'лыжи', 'коньки', 'скейт', 'бассейн', 'качели', 'карусель', 'цирк', 'клоун', 'фокусник', 'кино', 'театр', 'музей', 'парк',
    'поцелуй', 'обнимашки', 'свидание', 'сон', 'улыбка', 'слёзы', 'смех', 'танец', 'песня', 'письмо', 'конверт', 'марка', 'почтальон', 'полицейский', 'пожарный',
    'врач', 'повар', 'художник', 'космонавт', 'балерина', 'футболист', 'рыбак', 'фермер', 'учитель', 'спящий кот', 'ленивец', 'енот', 'бегемот', 'кенгуру', 'верблюд',
    'комета', 'планета', 'сатурн', 'чёрная дыра', 'северное сияние', 'молния', 'торнадо', 'снег', 'туман', 'гроза', 'листопад', 'весна', 'лето', 'осень', 'зима',
    'Новый год', 'день рождения', 'свадьба', 'пикник', 'шашлык', 'пельмени', 'блины', 'суши', 'бургер', 'кофе', 'чай', 'шоколад', 'конфета', 'печенье', 'попкорн',
  ];
  const COLORS = ['#ffe7a6', '#bcd4ff', '#ffb3d6', '#c8b3ff', '#a8ffe0', '#ffb38a'];
  const MODES = {
    classic: { name: 'Угадайка', icon: '✨', desc: '6 раундов по 90 секунд', total: 6, time: 90 },
    long: { name: 'Длинная партия', icon: '🌌', desc: '12 раундов — на весь вечер', total: 12, time: 90 },
    blitz: { name: 'Блиц', icon: '⚡', desc: '8 быстрых раундов по 45 секунд', total: 8, time: 45 },
    together: { name: 'Рисуем вместе', icon: '🤝', desc: 'Одна тема, одно небо — рисуете оба сразу', total: 4, time: 150 },
  };
  const THEMES = ['Наш дом мечты', 'Где мы встретимся', 'Космический зоопарк', 'Подводное царство', 'Портрет друг друга', 'Наше идеальное свидание', 'Город будущего', 'Сказочный лес', 'Что мы съедим вместе', 'Путешествие на поезде', 'Наш питомец', 'Остров сокровищ', 'Зимний вечер', 'Концерт под звёздами', 'Самый смешной сон', 'Пикник на Луне', 'Замок из облаков', 'Наше утро', 'Праздник фонариков', 'Дракон-хранитель', 'Карта нашего мира', 'Сад на крыше'];
  const BRUSHES = { line: { icon: '✦', name: 'созвездие', gap: 58 }, stars: { icon: '⋆', name: 'звёздная пыль', gap: 18 }, nebula: { icon: '☁', name: 'туманность', gap: 22 } };
  const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const W = 1200, H = 800;
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

  GAMES.constellation = {
    id: 'constellation', title: 'Созвездие', icon: '✨', color: '#a58bff',
    tagline: 'Рисуйте звёздами — угадывайте друг друга',
    roles: null, landscape: false,
    rules: [
      'По очереди: один рисует слово звёздами на небе, второй угадывает.',
      'Угадывать можно текстом в поле внизу — или просто голосом в Discord: тогда художник жмёт «✓ Угадали».',
      'Чем быстрее угадали — тем больше звёзд (до ★3). Режимы: классика, длинная партия, блиц — и «Рисуем вместе», где вы рисуете одну картину вдвоём.',
      'Три кисти: линии-созвездия, звёздная пыль и туманность.',
      'Каждое угаданное созвездие навсегда остаётся в вашем <b>альбоме неба</b>.',
    ],
    info() { const a = Store.get('album', []); return a.length ? `в альбоме: ${a.length}` : 'рисовалка-угадайка'; },
    create(ctx) { return new Constellation(ctx); },
  };

  class Constellation {
    constructor(ctx) {
      this.ctx = ctx;
      this.me = ctx.isHost ? 'h' : 'g';
      this.st = new Stage(ctx.canvas, W, H);
      this.sky = new Sky({ density: 1.4, palette: ['#5b3dbd', '#2a5bd7', '#b8407f', '#1e8f9e'] });
      this.parts = new Particles();
      this.strokes = []; this.bubbles = []; this.color = COLORS[0]; this.brush = 'line';
      this.cur = null; this.pending = []; this.flushT = 0; this.sid = 0;
      this.S = null; this.revealT = 0; this.savedRound = -1;
      this.buildUI();
      this.bindInput();
      if (ctx.isHost) {
        this.used = new Set();
        this.S = { round: 0, total: 6, drawer: 'h', phase: 'menu', stars: 0 };
        setTimeout(() => this.broadcast(), 300);
        let last = performance.now();
        this._iv = setInterval(() => { const now = performance.now(); this.hostTick((now - last) / 1000); last = now; }, 200);
      }
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ---------- Хост: логика раундов ----------
    broadcast() { this.ctx.send({ a: 'st', S: this.S }); this.applyState(this.S); }
    setMode(m) {
      const M = MODES[m]; if (!M || this.S.phase !== 'menu') return;
      Object.assign(this.S, { mode: m, total: M.total, time: M.time, round: 0, stars: 0 });
      this.themes = RNG(Date.now()).shuffle([...THEMES]);
      this.nextRound();
    }
    nextRound() {
      const S = this.S;
      S.round++;
      if (S.round > S.total) { S.phase = 'end'; return this.broadcast(); }
      if (S.mode === 'together') {
        Object.assign(S, { drawer: 'both', word: this.themes[(S.round - 1) % this.themes.length], hint: '', phase: 'draw', left: S.time, ok: false, gain: 0 });
        return this.broadcast();
      }
      S.drawer = S.round % 2 === 1 ? 'g' : 'h';
      const pool = [...WORDS, ...(CONFIG.customWords || []), ...(CONFIG.customWords || [])].filter((w) => !this.used.has(w));
      const opts = [];
      while (opts.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); opts.push(pool.splice(i, 1)[0]); }
      S.options = opts; S.word = ''; S.hint = ''; S.phase = 'choose'; S.ok = false; S.gain = 0;
      this.broadcast();
    }
    pick(i) {
      const S = this.S; if (S.phase !== 'choose') return;
      S.word = S.options[i]; this.used.add(S.word);
      S.phase = 'draw'; S.left = S.time;
      const idx = [...S.word].map((c, k) => k).filter((k) => S.word[k] !== ' ');
      this.revealOrder = RNG(Date.now()).shuffle(idx);
      this.shown = 0;
      S.hint = this.makeHint();
      this.broadcast();
    }
    makeHint() {
      const show = new Set(this.revealOrder.slice(0, this.shown));
      return [...this.S.word].map((c, k) => (c === ' ' ? ' ' : show.has(k) ? c : '_')).join('');
    }
    checkGuess(text, fromMe) {
      const S = this.S; if (S.phase !== 'draw') return;
      if (norm(text) && norm(text) === norm(S.word)) return this.reveal(true);
      if (!fromMe) this.addBubble(text);
      else this.ctx.send({ a: 'bub', text });
    }
    reveal(ok) {
      const S = this.S; if (S.phase !== 'draw') return;
      S.phase = 'reveal'; S.ok = ok;
      S.gain = ok && S.mode !== 'together' ? (S.left > S.time * 0.66 ? 3 : S.left > S.time * 0.33 ? 2 : 1) : 0;
      S.stars += S.gain;
      this.broadcast();
      clearTimeout(this._nt);
      this._nt = setTimeout(() => this.nextRound(), 5600);
    }
    hostTick(dt) {
      const S = this.S; if (!S || S.phase !== 'draw') return;
      const before = Math.ceil(S.left);
      S.left -= dt;
      const p = 1 - S.left / S.time;
      const want = S.mode === 'together' ? 0 : Math.min(Math.floor(this.revealOrder.length * 0.5), p > 0.75 ? 2 : p > 0.45 ? 1 : 0);
      if (want > this.shown) { this.shown = want; S.hint = this.makeHint(); this.broadcast(); }
      else if (Math.ceil(S.left) !== before) this.ctx.send({ a: 'st', S });
      if (S.left <= 0) this.reveal(S.mode === 'together');
    }
    restart() { this.S = { round: 0, total: 6, drawer: 'h', phase: 'menu', stars: 0 }; this.broadcast(); }

    // ---------- Сообщения ----------
    onMsg(d) {
      const host = this.ctx.isHost;
      switch (d.a) {
        case 'st': this.applyState(d.S); break;
        case 'pick': if (host) this.pick(d.i); break;
        case 'guess': if (host) this.checkGuess(d.text, false); break;
        case 'voice': if (host) this.reveal(true); break;
        case 'skip': if (host) this.reveal(false); break;
        case 'again': if (host) this.restart(); break;
        case 'mode': if (host) this.setMode(d.m); break;
        case 's0': this.strokes.push({ id: d.id, c: d.c, b: d.b || 'line', p: [], stars: [], acc: 0 }); break;
        case 'sp': { const s = this.strokes.find((x) => x.id === d.id); if (s) for (let i = 0; i < d.p.length; i += 2) this.addPoint(s, d.p[i], d.p[i + 1]); break; }
        case 'undo': { const i = this.strokes.map((x) => x.id[0]).lastIndexOf(d.who || ''); if (i >= 0) this.strokes.splice(i, 1); else this.strokes.pop(); break; }
        case 'clear': this.strokes = []; break;
        case 'bub': this.addBubble(d.text); break;
      }
    }

    applyState(S) {
      const prev = this.S ? this.S.phase : null;
      const prevRound = this.S ? this.S.round : -1;
      this.S = S;
      if ((S.phase === 'choose' || S.phase === 'menu' || (S.phase === 'draw' && S.mode === 'together')) && (prev !== S.phase || prevRound !== S.round)) { this.strokes = []; this.bubbles = []; }
      if (S.phase === 'draw' && prev !== 'draw') SFX.play('whoosh');
      if (S.phase === 'reveal' && prev !== 'reveal') {
        this.revealT = 0;
        if (S.ok) {
          SFX.play('win');
          for (const s of this.strokes) for (const p of s.stars) this.parts.emit(p[0], p[1], { n: 6, speed: 160, life: 1.3, size: 9, color: [s.c, '#ffffff'] });
          if (this.savedRound !== S.round && this.strokes.length) {
            this.savedRound = S.round;
            const album = Store.get('album', []);
            album.unshift({ w: S.word, d: Date.now(), s: this.strokes.map((s) => ({ c: s.c, b: s.b, p: s.p.map((v) => Math.round(v)) })) });
            Store.set('album', album.slice(0, 48));
          }
        } else SFX.play('fail');
      }
      if (S.phase === 'end' && prev !== 'end') SFX.play('chime');
      this.updateUI();
    }

    // ---------- Рисование ----------
    addPoint(s, x, y) {
      const n0 = s.p.length;
      // при быстром движении кисти добавляем промежуточные точки
      if (n0 && s.b && s.b !== 'line') { const px = s.p[n0 - 2], py = s.p[n0 - 1], d = dist(px, py, x, y), step = BRUSHES[s.b].gap * 0.8; if (d > step * 1.5) { const k = Math.floor(d / step); for (let i = 1; i < k; i++) this._addRaw(s, lerp(px, x, i / k), lerp(py, y, i / k)); } }
      return this._addRaw(s, x, y);
    }
    _addRaw(s, x, y) {
      const n = s.p.length;
      if (n) { const d = dist(s.p[n - 2], s.p[n - 1], x, y); s.acc += d; }
      const gap = BRUSHES[s.b || 'line'].gap;
      if (!n || s.acc >= gap) {
        const k = s.stars.length + n;
        if (s.b === 'stars') s.stars.push([x + (hash(k) - 0.5) * 34, y + (hash(k + 7) - 0.5) * 34, hash(k + 3) * TAU, 0.35 + hash(k + 5) * 0.6]);
        else s.stars.push([x, y, hash(k) * TAU, 0.8 + hash(k + 1) * 0.6]);
        s.acc = 0;
      }
      s.p.push(x, y);
    }
    iDraw() { return this.S && this.S.phase === 'draw' && (this.S.drawer === this.me || this.S.drawer === 'both'); }

    bindInput() {
      const c = this.ctx.canvas;
      c.addEventListener('pointerdown', (e) => {
        if (!this.iDraw()) return;
        c.setPointerCapture(e.pointerId);
        const p = this.st.pt(e);
        const id = this.me + ++this.sid;
        this.cur = { id, c: this.color, b: this.brush, p: [], stars: [], acc: 0 };
        this.strokes.push(this.cur);
        this.ctx.send({ a: 's0', id, c: this.color, b: this.brush });
        this.addPoint(this.cur, clamp(p.x, 0, W), clamp(p.y, 0, H));
        this.pending.push(Math.round(p.x), Math.round(p.y));
        SFX.play('tick');
      });
      c.addEventListener('pointermove', (e) => {
        if (!this.cur) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs) {
          const p = this.st.pt(ev), s = this.cur, n = s.p.length;
          const x = clamp(p.x, 0, W), y = clamp(p.y, 0, H);
          if (n && dist(s.p[n - 2], s.p[n - 1], x, y) < 5) continue;
          const had = s.stars.length;
          this.addPoint(s, x, y);
          if (s.stars.length > had) { SFX.play('tick'); this.parts.emit(x, y, { n: 3, speed: 50, life: 0.7, size: 6, color: s.c }); }
          this.pending.push(Math.round(x), Math.round(y));
        }
      });
      const end = () => { if (this.cur) { this.flush(); const s = this.cur; const n = s.p.length; if (n > 2 && s.b === 'line') s.stars.push([s.p[n - 2], s.p[n - 1], 0, 1]); this.cur = null; } };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    }
    flush() { if (this.cur && this.pending.length) { this.ctx.send({ a: 'sp', id: this.cur.id, p: this.pending }); this.pending = []; } }

    addBubble(text) {
      text = String(text).slice(0, 24);
      this.bubbles.push({ text, x: rand(220, W - 220), y: H - 120, t: 0 });
      SFX.play('pop');
    }

    // ---------- Интерфейс ----------
    buildUI() {
      const ui = this.ctx.ui;
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div class="g-top" style="flex-direction:column;gap:6px;top:10px">
          <div class="g-panel" style="display:flex;gap:14px;align-items:center;font-size:14px">
            <span id="cRound"></span><span id="cWord" style="font:700 20px Comfortaa;letter-spacing:3px"></span><span id="cTime" style="min-width:42px;text-align:right"></span>
          </div>
          <div id="cSub" style="font-size:13px;color:#d6ccff;text-shadow:0 2px 8px #000"></div>
        </div>
        <div style="position:absolute;top:12px;right:12px;display:flex;gap:8px;align-items:center">
          <div class="g-panel" id="cStars" style="padding:8px 14px;font-weight:700;color:#ffe7a6"></div>
          <button class="iconbtn" id="cAlbum" title="Альбом неба" style="margin:0">🌌</button>
        </div>
        <div id="cBottom" style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(620px,94vw)"></div>
        <div id="cCenter" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"></div>
      </div>`);
      ui.appendChild(this.el);
      $('#cAlbum', this.el).onclick = () => this.openAlbum();
    }

    updateUI() {
      const S = this.S, el = this.el; if (!S) return;
      const iDraw = S.drawer === this.me || S.drawer === 'both';
      const together = S.mode === 'together';
      $('#cRound', el).textContent = S.phase === 'end' ? 'Финал' : S.phase === 'menu' ? 'Созвездие' : `${together ? 'Тема' : 'Раунд'} ${S.round}/${S.total}`;
      $('#cStars', el).textContent = together ? '🤝 вместе' : `★ ${S.stars}`;
      const word = $('#cWord', el), sub = $('#cSub', el), bottom = $('#cBottom', el), center = $('#cCenter', el);
      // перестраиваем кнопки только при смене фазы — иначе поле ввода теряет текст
      const key = [S.phase, S.round, S.drawer, S.mode, this.color, this.brush].join('|');
      const rebuild = key !== this._key; this._key = key;
      if (rebuild) { center.innerHTML = ''; bottom.innerHTML = ''; }
      if (S.phase === 'menu') {
        word.textContent = '✦'; sub.textContent = 'Выберите режим — нажать может любой из вас';
        if (rebuild) {
          const p = h(`<div class="panel" style="max-width:520px;text-align:center;pointer-events:auto">
            <h2 style="margin:0 0 10px;font-family:var(--script);font-weight:400;font-size:46px">Во что играем?</h2>
            <div class="roles" style="grid-template-columns:1fr 1fr" id="modes"></div>
            <button class="btn ghost" id="alb" style="margin-top:12px">🌌 Альбом неба</button></div>`);
          for (const [id, M] of Object.entries(MODES)) {
            const c = h(`<div class="role" style="cursor:pointer;text-align:left"><div class="ico" style="font-size:28px">${M.icon}</div><h3>${M.name}</h3><p>${M.desc}</p></div>`);
            c.onclick = () => { SFX.play('click'); this.ctx.isHost ? this.setMode(id) : this.ctx.send({ a: 'mode', m: id }); };
            $('#modes', p).appendChild(c);
          }
          $('#alb', p).onclick = () => this.openAlbum();
          center.appendChild(p);
        }
      } else if (S.phase === 'choose') {
        word.textContent = '…'; sub.textContent = iDraw ? 'Выбери слово' : `${this.ctx.peer.name} выбирает слово…`;
        if (iDraw && rebuild) {
          const p = h(`<div class="panel" style="max-width:380px;text-align:center;pointer-events:auto"><h2 style="margin:0 0 6px;font-family:var(--script);font-weight:400;font-size:40px">Что нарисуешь?</h2><div id="opts"></div></div>`);
          S.options.forEach((w, i) => { const b2 = h(`<button class="btn ${i ? 'ghost' : ''}">${esc(w)}</button>`); b2.onclick = () => { SFX.play('click'); this.ctx.isHost ? this.pick(i) : this.ctx.send({ a: 'pick', i }); }; $('#opts', p).appendChild(b2); });
          center.appendChild(p);
        }
      } else if (S.phase === 'draw') {
        word.textContent = iDraw ? S.word : S.hint.replace(/_/g, '_\u2009');
        sub.textContent = together ? `Рисуете вместе с ${this.ctx.peer.name} — одна картина на двоих` : iDraw ? `Рисуй! ${this.ctx.peer.name} угадывает` : `Угадай, что рисует ${this.ctx.peer.name}`;
        if (iDraw && rebuild) {
          const bar = h(`<div class="g-panel" style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap">
            <div id="cols" style="display:flex;gap:7px"></div>
            <div id="brs" style="display:flex;gap:4px"></div>
            <button class="btn ghost small" id="undo">↶</button><button class="btn ghost small" id="clr">✕</button>
            ${together ? '<button class="btn small" id="voice">✓ Готово</button>' : '<button class="btn small" id="voice">✓ Угадали</button><button class="btn ghost small" id="skip">Сдаюсь</button>'}</div>`);
          COLORS.forEach((c) => {
            const d = h(`<div style="width:28px;height:28px;border-radius:50%;cursor:pointer;background:radial-gradient(circle,#fff 0 20%,${c} 50%,transparent 72%);box-shadow:${c === this.color ? `0 0 0 2px #fff, 0 0 14px ${c}` : 'none'}"></div>`);
            d.onclick = () => { this.color = c; SFX.play('click'); this.updateUI(); };
            $('#cols', bar).appendChild(d);
          });
          for (const [id, B] of Object.entries(BRUSHES)) {
            const d = h(`<button class="btn ${this.brush === id ? '' : 'ghost'} small" title="${B.name}" style="padding:8px 11px;font-size:16px">${B.icon}</button>`);
            d.onclick = () => { this.brush = id; SFX.play('click'); this.updateUI(); };
            $('#brs', bar).appendChild(d);
          }
          $('#undo', bar).onclick = () => { const i = this.strokes.map((x) => x.id[0]).lastIndexOf(this.me); if (i >= 0) this.strokes.splice(i, 1); this.ctx.send({ a: 'undo', who: this.me }); SFX.play('click'); };
          $('#clr', bar).onclick = () => { this.strokes = []; this.ctx.send({ a: 'clear' }); SFX.play('whoosh'); };
          $('#voice', bar).onclick = () => (this.ctx.isHost ? this.reveal(true) : this.ctx.send({ a: 'voice' }));
          if ($('#skip', bar)) $('#skip', bar).onclick = () => (this.ctx.isHost ? this.reveal(false) : this.ctx.send({ a: 'skip' }));
          bottom.appendChild(bar);
        } else if (!iDraw && rebuild) {
          const fm = h(`<div class="g-panel" style="display:flex;gap:8px"><input class="inp" id="gIn" placeholder="Твой вариант…" maxlength="30" autocomplete="off" style="padding:12px 14px"><button class="btn small" id="gGo">→</button></div>`);
          const go = () => {
            const v = $('#gIn', fm).value.trim(); if (!v) return;
            $('#gIn', fm).value = '';
            this.addBubble(v);
            if (this.ctx.isHost) this.checkGuess(v, true); else this.ctx.send({ a: 'guess', text: v });
          };
          $('#gGo', fm).onclick = go; $('#gIn', fm).onkeydown = (e) => { if (e.key === 'Enter') go(); };
          bottom.appendChild(fm);
          if (!this.ctx.me.touch) setTimeout(() => $('#gIn', fm)?.focus(), 50);
        }
      } else if (S.phase === 'reveal') {
        word.textContent = S.word;
        sub.textContent = together ? 'Картина сохранена в альбом неба ✦' : S.ok ? `Угадано! +${'★'.repeat(S.gain)}` : 'Не угадали — но красиво!';
      } else if (S.phase === 'end') {
        word.textContent = '✦'; sub.textContent = '';
        if (rebuild) {
          const p = h(`<div class="panel" style="max-width:400px;text-align:center;pointer-events:auto">
            <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:46px">Ваше небо</h2>
            ${together ? '<p style="color:var(--muted)">Все картины — в альбоме неба</p><div style="font-size:54px">🤝</div>' : `<p style="color:var(--muted)">Вместе вы зажгли</p><div style="font:700 54px Comfortaa;color:#ffe7a6;text-shadow:0 0 30px #ffc96b">★ ${S.stars}</div>`}
            <button class="btn" id="again">Ещё партия</button><button class="btn ghost" id="alb">🌌 Открыть альбом</button></div>`);
          $('#again', p).onclick = () => (this.ctx.isHost ? this.restart() : this.ctx.send({ a: 'again' }));
          $('#alb', p).onclick = () => this.openAlbum();
          center.appendChild(p);
        }
      }
    }

    openAlbum() {
      const album = Store.get('album', []);
      const back = h(`<div class="modal-back"><div class="panel" style="max-width:860px;max-height:86vh;display:flex;flex-direction:column">
        <h2 style="font-family:var(--script);font-weight:400;font-size:44px;margin:0 0 4px">Альбом неба</h2>
        <p style="margin:0 0 12px">${album.length ? 'Все созвездия, которые вы угадали вместе' : 'Пока пусто — угадайте первое созвездие ✦'}</p>
        <div class="scroll-y" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:4px" id="grid"></div>
        <button class="btn ghost" id="close">Закрыть</button></div></div>`);
      const grid = $('#grid', back);
      album.forEach((it) => {
        const cell = h(`<div style="border-radius:16px;overflow:hidden;background:#0a0b26;border:1px solid var(--line);cursor:pointer"><canvas width="300" height="200" style="width:100%;display:block"></canvas><div style="padding:6px 10px;font-size:13px;text-align:center">${esc(it.w)}</div></div>`);
        const cv = $('canvas', cell), g = cv.getContext('2d');
        drawThumb(g, it, 300, 200);
        cell.onclick = () => {
          const big = h(`<div class="modal-back" style="z-index:25"><div style="text-align:center"><canvas width="1200" height="800" style="width:min(92vw,900px);border-radius:20px;border:1px solid var(--line)"></canvas><div style="font-family:var(--script);font-size:46px;margin-top:8px">${esc(it.w)}</div><div style="color:var(--muted);font-size:13px">${new Date(it.d).toLocaleDateString('ru-RU')}</div></div></div>`);
          drawThumb($('canvas', big).getContext('2d'), it, 1200, 800);
          big.onclick = () => big.remove();
          document.body.appendChild(big);
        };
        grid.appendChild(cell);
      });
      $('#close', back).onclick = () => back.remove();
      document.body.appendChild(back);
    }

    // ---------- Кадр ----------
    frame(dt, t) {
      const S = this.S, st = this.st, g = st.g;
      if (S && S.phase === 'draw') {
        const left = Math.max(0, Math.ceil(S.left));
        const el = $('#cTime', this.el);
        if (el) { el.textContent = `⏱ ${left}`; el.style.color = left <= 10 ? '#ff9c9c' : ''; }
        if (!this.ctx.isHost) S.left -= dt;
      } else { const el = $('#cTime', this.el); if (el) el.textContent = ''; }

      this.flushT += dt;
      if (this.flushT > 0.04) { this.flushT = 0; this.flush(); }
      this.parts.update(dt);
      this.revealT += dt;

      // фон
      st.screen();
      this.sky.resize(st.vw, st.vh);
      this.sky.draw(g, t, dt);
      st.begin();
      // мягкая рамка холста
      g.strokeStyle = 'rgba(200,180,255,0.08)'; g.lineWidth = 2;
      roundRect(g, 8, 8, W - 16, H - 16, 30); g.stroke();

      let k = 1, sc = 1, ox = 0, oy = 0, alpha = 1;
      if (S && S.phase === 'reveal' && S.ok) {
        const rt = this.revealT;
        k = 1 + Math.max(0, 1 - Math.abs(rt - 0.4) * 2) * 1.5;
        if (rt > 3.4) { const q = Ease.inOutSine(Math.min(1, (rt - 3.4) / 1.6)); sc = 1 - q * 0.8; ox = q * W * 0.38; oy = -q * H * 0.42; alpha = 1 - q * 0.6; }
      }
      g.save();
      g.translate(W / 2 + ox, H / 2 + oy); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
      g.globalAlpha = alpha;
      drawStrokes(g, this.strokes, t, k);
      g.restore();
      this.parts.draw(g);

      // название созвездия
      if (S && S.phase === 'reveal') {
        const rt = this.revealT, a = Math.min(1, rt * 2) * (rt > 4.6 ? Math.max(0, 1 - (rt - 4.6) * 2) : 1);
        g.save(); g.globalAlpha = a; g.textAlign = 'center';
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, W / 2, H / 2, 300, S.ok ? '#c8a8ff' : '#6a6a9a', 0.35 * a);
        g.globalCompositeOperation = 'source-over';
        g.font = `${90 + Ease.outBack(Math.min(1, rt * 1.5)) * 10}px 'Marck Script', cursive`;
        g.fillStyle = '#fff'; g.shadowColor = '#d9b8ff'; g.shadowBlur = 30;
        g.fillText(S.word, W / 2, H / 2 + 30);
        g.shadowBlur = 0;
        g.font = '700 30px Comfortaa'; g.fillStyle = S.ok ? '#ffe7a6' : '#c9c3e8';
        g.fillText(S.ok ? '★'.repeat(S.gain) : 'созвездие осталось загадкой', W / 2, H / 2 + 90);
        g.restore();
      }

      // всплывающие догадки
      g.textAlign = 'center';
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i]; b.t += dt; b.y -= dt * 40;
        if (b.t > 3.5) { this.bubbles.splice(i, 1); continue; }
        const a = Math.min(1, b.t * 4) * Math.min(1, (3.5 - b.t) * 1.5);
        g.globalAlpha = a; g.font = '600 26px Comfortaa';
        const w = g.measureText(b.text).width + 34;
        g.fillStyle = 'rgba(40,30,90,0.7)'; roundRect(g, b.x - w / 2, b.y - 26, w, 42, 21); g.fill();
        g.fillStyle = '#fff'; g.fillText(b.text + '?', b.x, b.y + 4);
        g.globalAlpha = 1;
      }
    }

    resync() { if (this.S) this.broadcast(); }
    destroy() { this.st.destroy(); clearTimeout(this._nt); clearInterval(this._iv); }
  }

  function drawStrokes(g, strokes, t, k = 1) {
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalCompositeOperation = 'lighter';
    for (const s of strokes) {
      const p = s.p; if (p.length < 2) continue;
      if (s.b === 'nebula') {
        for (const st of s.stars) { Glow.draw(g, st[0], st[1], 62 * st[3], s.c, 0.24 * Math.min(1.5, k), 0.7); Glow.draw(g, st[0] + Math.cos(st[2]) * 14, st[1] + Math.sin(st[2]) * 14, 3, '#ffffff', 0.5 + Math.sin(t * 2 + st[2]) * 0.3); }
        continue;
      }
      if (s.b === 'stars') {
        for (const st of s.stars) { const tw = 0.6 + Math.sin(t * 4 + st[2] * 7) * 0.4; Glow.draw(g, st[0], st[1], 18 * st[3], s.c, tw * Math.min(1, k)); g.fillStyle = '#fff'; g.fillRect(st[0] - 1, st[1] - 1, 2, 2); }
        continue;
      }
      const path = () => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); };
      path(); g.strokeStyle = hexA(s.c, 0.07 * k); g.lineWidth = 16; g.stroke();
      path(); g.strokeStyle = hexA(s.c, 0.22 * k); g.lineWidth = 6; g.stroke();
      path(); g.strokeStyle = hexA(s.c, Math.min(1, 0.65 * k)); g.lineWidth = 1.6; g.stroke();
      for (const st of s.stars || []) {
        const tw = 0.7 + Math.sin(t * 3 + st[2] * 5) * 0.3;
        Glow.draw(g, st[0], st[1], 22 * st[3] * (0.8 + k * 0.2), s.c, tw * Math.min(1, k));
        g.fillStyle = '#fff'; g.beginPath(); g.arc(st[0], st[1], 2.4 * st[3], 0, TAU); g.fill();
        // лучики
        g.strokeStyle = hexA('#ffffff', 0.5 * tw); g.lineWidth = 1;
        const L = 9 * st[3] * tw;
        g.beginPath(); g.moveTo(st[0] - L, st[1]); g.lineTo(st[0] + L, st[1]); g.moveTo(st[0], st[1] - L); g.lineTo(st[0], st[1] + L); g.stroke();
      }
    }
    g.restore();
  }

  function drawThumb(g, it, w, hh) {
    const bg = g.createLinearGradient(0, 0, 0, hh); bg.addColorStop(0, '#05061a'); bg.addColorStop(1, '#1d1240');
    g.fillStyle = bg; g.fillRect(0, 0, w, hh);
    const r = RNG(it.d);
    for (let i = 0; i < (w * hh) / 1500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.6})`; g.fillRect(r() * w, r() * hh, 1, 1); }
    g.save(); g.scale(w / W, hh / H);
    const strokes = it.s.map((s) => { const o = { c: s.c, b: s.b || 'line', p: [], stars: [], acc: 0 }; for (let i = 0; i < s.p.length; i += 2) Constellation.prototype.addPoint(o, s.p[i], s.p[i + 1]); return o; });
    drawStrokes(g, strokes, 0, 1.2);
    g.restore();
  }
})();
