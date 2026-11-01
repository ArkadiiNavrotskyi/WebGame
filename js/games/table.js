'use strict';
// «Карточный стол» — 3D-стол под лампой: Дурак, Очко (21) и Хлопушка с заданиями. Хост ведёт правила.
(() => {
  let threeP = null;
  const loadThree = () => { if (window.THREE) return Promise.resolve(); if (!threeP) threeP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = `lib/three.min.js?v=${CONFIG.version}`; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); return threeP; };

  const SUITS = ['S', 'C', 'D', 'H'];
  const SUIT_CH = { S: '♠', C: '♣', D: '♦', H: '♥' };
  const SUIT_N = { S: 'пики', C: 'трефы', D: 'бубны', H: 'черви' };
  const RED = { D: 1, H: 1 };
  const RANKS = ['6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];
  const PTS = { 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 'В': 2, 'Д': 3, 'К': 4, 'Т': 11 };
  const ALL = SUITS.flatMap((s) => RANKS.map((r) => s + r));
  const sOf = (c) => c[0], rOf = (c) => c.slice(1), rv = (c) => RANKS.indexOf(rOf(c));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sum21 = (h) => { if (h.length === 2 && h.every((c) => rOf(c) === 'Т')) return 21; return h.reduce((s, c) => s + PTS[rOf(c)], 0); };
  const TASKS = [
    'Изобрази животное — второй угадывает за 3 попытки', 'Скажи три комплимента за 10 секунд', 'Спой строчку любой песни', 'Расскажи самый смешной случай из детства',
    'Покажи лучшую смешную рожицу в камеру', 'Признайся в одной странной привычке', 'Назови 5 вещей, которые любишь во втором', 'Говори следующие 2 минуты голосом мультяшки',
    'Придумай второму смешное прозвище', 'Расскажи, что тебе снилось недавно', 'Опиши ваше идеальное свидание за 20 секунд', 'Станцуй 10 секунд под воображаемую музыку',
    'Сделай вид, что ты ведущий новостей, и объяви новость про вас', 'Назови своё самое неловкое воспоминание', 'Пришли второму самый смешной стикер, который есть', 'Расскажи анекдот (можно плохой)',
    'Повтори скороговорку «Шла Саша по шоссе» три раза быстро', 'Изобрази второго — как он(а) просыпается', 'Скажи «я тебя люблю» на трёх языках', 'Признайся, что ты ел(а) последним',
    'Придумай тост в честь второго', 'Назови фильм, который хочешь посмотреть вместе', 'Обещай что-то милое на следующую встречу', 'Опиши второго тремя эмодзи — вслух',
    'Расскажи секрет, который никто не знает (маленький!)', 'Покажи предмет рядом с собой и придумай ему историю', 'Сделай второму виртуальный массаж словами 😄', 'Пой «С днём рождения», даже если не день рождения',
  ];

  GAMES.table = {
    id: 'table', title: 'Карточный стол', icon: '🎴', color: '#e05a6a',
    tagline: 'Дурак, Очко и Хлопушка за 3D-столом',
    roles: null, landscape: true,
    rules: [
      '<b>Дурак</b> (подкидной, 36 карт): ходи, отбивайся старшей картой той же масти или козырем. Не можешь — «Беру». Кто остался с картами — дурак 😄',
      '<b>Очко</b>: набери ближе к 21, но не больше. Валет 2, дама 3, король 4, туз 11. Два туза — «золотое очко». Играем до 5 побед.',
      '<b>Хлопушка</b>: по очереди дёргайте шнурок. В одном из шести гнёзд — конфетти! Кому хлопнуло — выполняет смешное задание.',
      'Нажми на карту в руке, чтобы сыграть. Говорите в Discord — блефовать вслух интереснее!',
    ],
    info() { const s = Store.get('table_score', null); return s ? `дурак ${s.w}:${s.l}` : '3D · дурак, очко, хлопушка'; },
    create(ctx) { return new Table(ctx); },
  };

  class Table {
    constructor(ctx) {
      this.ctx = ctx; this.me = ctx.isHost ? 'h' : 'g'; this.op = ctx.isHost ? 'g' : 'h';
      this.S = null; this.sel = null; this.ready = false; this.t = 0;
      this.buildUI();
      loadThree().then(() => this.init3d()).catch(() => { this.loadEl.textContent = 'Не удалось загрузить 3D 😿 Проверь интернет'; });
      if (ctx.isHost) { this.S = { mode: 'menu', wins: { durak: { h: 0, g: 0 }, p21: { h: 0, g: 0 }, pop: { h: 0, g: 0 } } }; this.broadcast(); }
      ctx.loop((dt, t) => this.frame(dt, t));
    }

    // ================= Хост: правила =================
    broadcast() { this.ctx.send({ a: 'S', S: this.S }); this.apply(this.S); }
    ev(e) { this.ctx.send({ a: 'ev', e }); this.onEv(e); }
    startMode(mode) {
      const S = this.S; S.mode = mode;
      if (mode === 'durak') {
        const deck = shuffle([...ALL]);
        const D = { deck, trump: deck[0], hands: { h: [], g: [] }, table: [], out: 0, att: null, winner: null, took: null };
        for (let i = 0; i < 6; i++) { D.hands.h.push(deck.pop()); D.hands.g.push(deck.pop()); }
        const ts = sOf(D.trump), low = (s) => Math.min(...D.hands[s].filter((c) => sOf(c) === ts).map(rv), 99);
        D.att = low('h') < low('g') ? 'h' : low('g') < low('h') ? 'g' : Math.random() < 0.5 ? 'h' : 'g';
        D.defN = 6;
        S.D = D;
      }
      if (mode === 'p21') { S.B = { pts: { h: 0, g: 0 }, round: 0 }; this.round21(); return; }
      if (mode === 'pop') S.Pp = { ch: Math.floor(Math.random() * 6), pos: 0, turn: Math.random() < 0.5 ? 'h' : 'g', boom: null, task: null, cnt: { h: 0, g: 0 } };
      this.broadcast();
      this.ev({ a: 'deal' });
    }
    round21() {
      const B = this.S.B; B.deck = shuffle([...ALL]); B.hands = { h: [B.deck.pop(), B.deck.pop()], g: [B.deck.pop(), B.deck.pop()] }; B.stood = { h: false, g: false }; B.res = null; B.round++;
      this.broadcast(); this.ev({ a: 'deal' });
    }
    beats(d, a, ts) { return (sOf(d) === sOf(a) && rv(d) > rv(a)) || (sOf(d) === ts && sOf(a) !== ts); }
    refill(D) { for (const s of [D.att, D.att === 'h' ? 'g' : 'h']) while (D.hands[s].length < 6 && D.deck.length) D.hands[s].push(D.deck.pop()); }
    checkEnd(D) {
      if (D.deck.length) return false;
      const eh = !D.hands.h.length, eg = !D.hands.g.length;
      if (!eh && !eg) return false;
      D.winner = eh && eg ? 'draw' : eh ? 'h' : 'g';
      if (D.winner !== 'draw') this.S.wins.durak[D.winner]++;
      this.ev({ a: 'end', w: D.winner });
      return true;
    }
    act(side, m) {
      const S = this.S;
      if (m.a === 'mode') return this.startMode(m.mode);
      if (m.a === 'menu') { S.mode = 'menu'; return this.broadcast(); }
      if (S.mode === 'durak') {
        const D = S.D; if (!D || D.winner) { if (m.a === 'again') this.startMode('durak'); return; }
        const def = D.att === 'h' ? 'g' : 'h', ts = sOf(D.trump);
        const hand = D.hands[side], hi = hand.indexOf(m.c);
        if (m.a === 'play' && side === D.att) {
          if (hi < 0) return;
          const ranks = new Set(D.table.flatMap((p) => [p.a, p.d]).filter(Boolean).map(rOf));
          const unbeaten = D.table.filter((p) => !p.d).length;
          if (D.table.length && !ranks.has(rOf(m.c))) return this.ev({ a: 'no', side, msg: 'Подкидывать можно только карты тех же достоинств, что на столе' });
          if (D.table.length >= 6 || unbeaten >= D.hands[def].length) return this.ev({ a: 'no', side, msg: 'Больше подкинуть нельзя' });
          if (!D.table.length) D.defN = D.hands[def].length;
          hand.splice(hi, 1); D.table.push({ a: m.c, d: null });
          this.ev({ a: 'card' });
        } else if (m.a === 'play' && side === def) {
          if (hi < 0) return;
          let idx = m.i != null ? m.i : D.table.findIndex((p) => !p.d && this.beats(m.c, p.a, ts));
          const p = D.table[idx];
          if (!p || p.d || !this.beats(m.c, p.a, ts)) return this.ev({ a: 'no', side, msg: 'Этой картой не побить' });
          hand.splice(hi, 1); p.d = m.c; this.ev({ a: 'card' });
          if (!D.deck.length && !hand.length && D.table.every((q) => q.d)) { D.out += D.table.length * 2; D.table = []; D.att = def; this.checkEnd(D); }
        } else if (m.a === 'bito' && side === D.att) {
          if (!D.table.length || D.table.some((p) => !p.d)) return;
          D.out += D.table.length * 2; D.table = []; this.refill(D); D.att = def; this.ev({ a: 'bito' });
          this.checkEnd(D);
        } else if (m.a === 'take' && side === def) {
          if (!D.table.some((p) => !p.d)) return;
          for (const p of D.table) { hand.push(p.a); if (p.d) hand.push(p.d); }
          D.table = []; this.refill(D); this.ev({ a: 'take', side });
          this.checkEnd(D);
        } else return;
        if (!D.winner && !D.deck.length && !D.hands[D.att].length && !D.table.length) this.checkEnd(D);
        return this.broadcast();
      }
      if (S.mode === 'p21') {
        const B = S.B;
        if (m.a === 'next' && B.res && !B.res.match) return this.round21();
        if (m.a === 'again' && B.res && B.res.match) return this.startMode('p21');
        if (B.res || B.stood[side]) return;
        if (m.a === 'hit') { B.hands[side].push(B.deck.pop()); if (sum21(B.hands[side]) >= 21) B.stood[side] = true; this.ev({ a: 'card' }); }
        if (m.a === 'stand') B.stood[side] = true;
        if (B.stood.h && B.stood.g) {
          const v = { h: sum21(B.hands.h), g: sum21(B.hands.g) }, bust = (x) => x > 21;
          let w = 'draw';
          if (bust(v.h) && !bust(v.g)) w = 'g'; else if (bust(v.g) && !bust(v.h)) w = 'h'; else if (!bust(v.h) && v.h !== v.g) w = v.h > v.g ? 'h' : 'g';
          if (w !== 'draw') B.pts[w]++;
          const match = B.pts.h >= 5 || B.pts.g >= 5;
          if (match) S.wins.p21[B.pts.h >= 5 ? 'h' : 'g']++;
          B.res = { v, w, match };
          this.ev({ a: 'reveal', w });
        }
        return this.broadcast();
      }
      if (S.mode === 'pop') {
        const Pp = S.Pp;
        if (m.a === 'next' && Pp.boom) { Pp.boom = null; Pp.task = null; return this.broadcast(); }
        if (m.a !== 'pull' || Pp.boom || side !== Pp.turn) return;
        if (Pp.pos === Pp.ch) {
          Pp.boom = side; Pp.cnt[side]++; Pp.task = pick(TASKS); Pp.ch = Math.floor(Math.random() * 6); Pp.pos = 0;
          this.ev({ a: 'boom', side });
        } else { Pp.pos++; this.ev({ a: 'click' }); }
        Pp.turn = side === 'h' ? 'g' : 'h';
        return this.broadcast();
      }
    }
    onMsg(d) {
      if (d.a === 'S') this.apply(d.S);
      else if (d.a === 'ev') this.onEv(d.e);
      else if (d.a === 'act' && this.ctx.isHost) this.act('g', d.m);
    }
    send(m) { if (this.ctx.isHost) this.act('h', m); else this.ctx.send({ a: 'act', m }); }
    onEv(e) {
      if (e.a === 'card') SFX.play('card');
      if (e.a === 'deal') { for (let i = 0; i < 5; i++) setTimeout(() => SFX.play('card'), i * 90); }
      if (e.a === 'bito') { SFX.play('whoosh'); this.toast('Бито ✦'); }
      if (e.a === 'take') { SFX.play('fail'); this.toast(e.side === this.me ? 'Ты берёшь карты' : `${this.ctx.peer.name} берёт карты 😏`); }
      if (e.a === 'no' && e.side === this.me) { SFX.play('fail'); this.toast(e.msg); }
      if (e.a === 'end') { const win = e.w === this.me; SFX.play(e.w === 'draw' ? 'chime' : win ? 'win' : 'fail'); if (e.w !== 'draw') { const s = Store.get('table_score', { w: 0, l: 0 }); win ? s.w++ : s.l++; Store.set('table_score', s); } }
      if (e.a === 'reveal') { SFX.play(e.w === this.me ? 'win' : e.w === 'draw' ? 'chime' : 'fail'); }
      if (e.a === 'click') { SFX.tone(900, 0.05, { type: 'square', vol: 0.08 }); SFX.tone(300, 0.08, { type: 'square', vol: 0.05, when: 0.05 }); this.drumKick = 1; }
      if (e.a === 'boom') { SFX.noise(0.6, { vol: 0.6, freq: 1800, sweep: 0.2 }); SFX.play('win'); this.confetti(); }
    }
    toast(s) { this.ctx.toast(s, 2200); }

    // ================= Состояние → вид =================
    apply(S) { this.S = S; this.sel = null; this.renderHUD(); this.layout(); }

    // ================= Интерфейс =================
    buildUI() {
      this.el = h(`<div class="passthru" style="position:absolute;inset:0">
        <div class="tb-load" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted)">Расставляю стол…</div>
        <div class="g-top"><div class="g-panel" id="tbTop" style="font-size:14px;white-space:nowrap"></div></div>
        <div id="tbMsg" style="position:absolute;left:50%;top:62px;transform:translateX(-50%);font-size:15px;color:#ffe7a6;text-shadow:0 2px 6px #000;text-align:center;width:92%;pointer-events:none"></div>
        <div id="tbBtns" style="position:absolute;right:14px;bottom:14px;display:flex;flex-direction:column;gap:8px;align-items:flex-end"></div>
        <div id="tbOv"></div>
      </div>`);
      this.loadEl = $('.tb-load', this.el);
      this.ctx.ui.appendChild(this.el);
    }
    btns(list) {
      const box = $('#tbBtns', this.el); const key = list.map((b) => b[0] + b[1]).join('|'); if (box._k === key) return; box._k = key;
      box.innerHTML = list.map(([id, label, ghost]) => `<button class="btn ${ghost ? 'ghost' : ''}" data-b="${id}" style="min-width:140px;padding:14px 18px">${label}</button>`).join('');
      box.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.send({ a: b.dataset.b }); }));
    }
    overlay(html) {
      const o = $('#tbOv', this.el); if (o._h === html) return; o._h = html;
      o.innerHTML = html ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(6,4,14,.45);padding:60px 12px 12px">${html}</div>` : '';
      o.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.send({ a: 'mode', mode: b.dataset.m }); }));
      o.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.send({ a: b.dataset.b }); }));
    }
    renderHUD() {
      const S = this.S; if (!S) return;
      const top = $('#tbTop', this.el), msg = $('#tbMsg', this.el), pn = esc(this.ctx.peer.name);
      if (S.mode === 'menu') {
        top.textContent = '🎴 Карточный стол'; msg.textContent = ''; this.btns([]);
        const w = S.wins;
        this.overlay(`<div class="panel" style="max-width:640px;text-align:center"><h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:46px">Во что сыграем?</h2>
          <div class="roles" style="margin-top:12px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
            <div class="role" data-m="durak" style="cursor:pointer"><div class="ico">🃏</div><h3>Дурак</h3><p>Подкидной, 36 карт, козыри.</p><p style="color:#ffe7a6;font-size:12px">${w.durak[this.me]} : ${w.durak[this.op]}</p></div>
            <div class="role" data-m="p21" style="cursor:pointer"><div class="ico">🎴</div><h3>Очко</h3><p>Ближе к 21. До 5 побед.</p><p style="color:#ffe7a6;font-size:12px">${w.p21[this.me]} : ${w.p21[this.op]}</p></div>
            <div class="role" data-m="pop" style="cursor:pointer"><div class="ico">🎉</div><h3>Хлопушка</h3><p>Кому хлопнет — тот выполняет задание!</p><p style="color:#ffe7a6;font-size:12px">хлопков: ${S.Pp ? S.Pp.cnt[this.me] + ' : ' + S.Pp.cnt[this.op] : '0 : 0'}</p></div>
          </div><p style="font-size:12.5px;color:var(--muted)">Счёт: ты : ${pn}</p></div>`);
        return;
      }
      const menuBtn = ['menu', '☰ Меню', true];
      if (S.mode === 'durak') {
        const D = S.D, ts = sOf(D.trump), mine = D.att === this.me, unb = D.table.some((p) => !p.d);
        top.innerHTML = `Козырь: <b style="color:${RED[ts] ? '#ff8a8a' : '#e8e8ff'}">${SUIT_CH[ts]} ${SUIT_N[ts]}</b> · колода ${D.deck.length} · у ${pn}: ${D.hands[this.op].length}`;
        if (D.winner) {
          const win = D.winner === this.me;
          msg.textContent = '';
          this.btns([]);
          this.overlay(`<div class="panel" style="max-width:380px;text-align:center"><div style="font-size:60px">${D.winner === 'draw' ? '🤝' : win ? '👑' : '🤡'}</div><h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:46px">${D.winner === 'draw' ? 'Ничья!' : win ? 'Ты не дурак!' : 'Ты — дурак 😄'}</h2>
            <p>Счёт в «Дурака»: <b>${S.wins.durak[this.me]} : ${S.wins.durak[this.op]}</b></p><button class="btn" data-b="again">Ещё партию</button><button class="btn ghost" data-b="menu">В меню</button></div>`);
          return;
        }
        this.overlay('');
        msg.textContent = mine ? (!D.table.length ? 'Твой ход — положи любую карту' : unb ? `${this.ctx.peer.name} отбивается…` : 'Подкинь карту того же достоинства или скажи «Бито»') : (!D.table.length ? `Ходит ${this.ctx.peer.name}…` : unb ? 'Отбивайся: старшая той же масти или козырь. Или «Беру»' : `Ждём: подкинет ${this.ctx.peer.name} или скажет «Бито»`);
        const b = [menuBtn];
        if (mine && D.table.length && !unb) b.unshift(['bito', 'Бито ✓']);
        if (!mine && unb) b.unshift(['take', 'Беру 🫴']);
        this.btns(b);
      }
      if (S.mode === 'p21') {
        const B = S.B, my = sum21(B.hands[this.me]);
        top.innerHTML = `Очко · раунд ${B.round} · ты <b>${B.pts[this.me]}</b> : <b>${B.pts[this.op]}</b> ${pn} · до 5`;
        if (B.res) {
          const r = B.res, win = r.w === this.me;
          msg.textContent = '';
          this.btns([menuBtn]);
          this.overlay(`<div class="panel" style="max-width:380px;text-align:center"><div style="font-size:54px">${r.w === 'draw' ? '🤝' : win ? '✨' : '💔'}</div>
            <h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:42px">${r.match ? (win ? 'Ты выиграл(а) матч!' : `${pn} выигрывает матч`) : r.w === 'draw' ? 'Ничья' : win ? 'Раунд твой!' : `Раунд за ${pn}`}</h2>
            <p>У тебя <b>${r.v[this.me]}</b>${r.v[this.me] > 21 ? ' (перебор)' : ''} · у ${pn} <b>${r.v[this.op]}</b>${r.v[this.op] > 21 ? ' (перебор)' : ''}</p>
            <button class="btn" data-b="${r.match ? 'again' : 'next'}">${r.match ? 'Новый матч' : 'Следующий раунд →'}</button></div>`);
          return;
        }
        this.overlay('');
        const st = B.stood[this.me];
        msg.textContent = st ? (my > 21 ? `Перебор (${my})… ждём ${this.ctx.peer.name}` : `У тебя ${my}. Ждём ${this.ctx.peer.name}…`) : `У тебя ${my} очков. Ещё карту или хватит?`;
        this.btns(st ? [menuBtn] : [['hit', 'Ещё карту 🂠'], ['stand', 'Хватит ✋'], menuBtn]);
      }
      if (S.mode === 'pop') {
        const Pp = S.Pp, mine = Pp.turn === this.me;
        top.innerHTML = `🎉 Хлопушка · хлопков: ты <b>${Pp.cnt[this.me]}</b> : <b>${Pp.cnt[this.op]}</b> ${pn} · щёлкнуло ${Pp.pos} из 6`;
        if (Pp.boom) {
          const me = Pp.boom === this.me;
          msg.textContent = '';
          this.btns([menuBtn]);
          this.overlay(`<div class="panel" style="max-width:420px;text-align:center"><div style="font-size:56px">🎉</div><h2 style="margin:0;font-family:var(--script);font-weight:400;font-size:42px">${me ? 'Хлопнуло у тебя!' : `Хлопнуло у ${pn}!`}</h2>
            <p style="font-size:13px;color:var(--muted)">${me ? 'Твоё задание' : `Задание для ${pn}`}:</p><p style="font-size:20px;color:#ffe7a6">${esc(Pp.task)}</p>
            <button class="btn" data-b="next">Выполнено ✦</button></div>`);
          return;
        }
        this.overlay('');
        msg.textContent = mine ? 'Твоя очередь — дёргай шнурок… если не страшно 😏' : `${this.ctx.peer.name} тянет шнурок…`;
        this.btns(mine ? [['pull', 'Дёрнуть 🎉'], menuBtn] : [menuBtn]);
      }
    }

    // ================= 3D =================
    init3d() {
      const T = THREE;
      if (T.ColorManagement) T.ColorManagement.legacyMode = false;
      const r = (this.renderer = new T.WebGLRenderer({ canvas: this.ctx.canvas, antialias: true }));
      r.setPixelRatio(Math.min(devicePixelRatio || 1, this.ctx.me.touch ? 1.5 : 2));
      r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      const sc = (this.scene = new T.Scene()); sc.background = new T.Color('#0b0710'); sc.fog = new T.Fog('#0b0710', 9, 18);
      this.cam = new T.PerspectiveCamera(45, 1, 0.1, 50);
      sc.add(new T.HemisphereLight('#ffe8d0', '#201018', 0.55));
      const lamp = new T.SpotLight('#ffd9a0', 2.4, 16, 0.75, 0.45, 1.2); lamp.position.set(0, 7, 0.6); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005; sc.add(lamp, lamp.target);
      // лампа над столом
      const shade = new T.Mesh(new T.ConeGeometry(0.9, 0.6, 24, 1, true), new T.MeshStandardMaterial({ color: '#2a5a3a', side: T.DoubleSide, roughness: 0.6 })); shade.position.set(0, 6.4, 0.6); sc.add(shade);
      const bulb = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), new T.MeshBasicMaterial({ color: '#fff2c8' })); bulb.position.set(0, 6.15, 0.6); sc.add(bulb);
      // стол: сукно и бортик
      const felt = this.canvasTex(512, 512, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 20, w / 2, w / 2, w / 2); gr.addColorStop(0, '#1f7a4a'); gr.addColorStop(1, '#0d3a22'); g.fillStyle = gr; g.fillRect(0, 0, w, w); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},0.04)`; g.fillRect(Math.random() * w, Math.random() * w, 1.5, 1.5); } g.strokeStyle = 'rgba(255,230,160,0.18)'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, w / 2, w * 0.36, 0, TAU); g.stroke(); });
      const top = new T.Mesh(new T.CylinderGeometry(3.6, 3.6, 0.12, 64), [new T.MeshStandardMaterial({ color: '#3a1e10', roughness: 0.6 }), new T.MeshStandardMaterial({ map: felt, roughness: 0.95 }), new T.MeshStandardMaterial({ color: '#3a1e10' })]);
      top.position.y = -0.06; top.receiveShadow = true; sc.add(top);
      const rim = new T.Mesh(new T.TorusGeometry(3.65, 0.16, 12, 80), new T.MeshStandardMaterial({ color: '#5a2e16', roughness: 0.45, metalness: 0.1 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; sc.add(rim);
      const leg = new T.Mesh(new T.CylinderGeometry(0.5, 0.9, 3, 16), new T.MeshStandardMaterial({ color: '#2a160c' })); leg.position.y = -1.6; sc.add(leg);
      const floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshStandardMaterial({ color: '#160c10', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3; sc.add(floor);
      // мелочи на столе: свеча и бокалы
      const candle = new T.Group(); candle.add(new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.4, 12), new T.MeshStandardMaterial({ color: '#f0e6d0' }))); candle.children[0].position.y = 0.2;
      const fl = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: '#ffcc66' })); fl.position.y = 0.46; candle.add(fl); this.flame = fl;
      const cl = new T.PointLight('#ffb050', 0.8, 4, 2); cl.position.y = 0.6; candle.add(cl); this.candleL = cl; candle.position.set(2.7, 0, -1.6); sc.add(candle);
      // карты
      this.cardGeo = new T.PlaneGeometry(0.66, 0.96);
      this.backTex = this.canvasTex(256, 372, (g, w, hh) => { g.fillStyle = '#f4ece0'; this.rr(g, 0, 0, w, hh, 22); g.fill(); g.fillStyle = '#8a1e2e'; this.rr(g, 12, 12, w - 24, hh - 24, 16); g.fill(); g.strokeStyle = 'rgba(255,220,180,0.55)'; g.lineWidth = 3; for (let i = -hh; i < w; i += 18) { g.beginPath(); g.moveTo(i, 12); g.lineTo(i + hh, hh - 12); g.stroke(); g.beginPath(); g.moveTo(i + hh, 12); g.lineTo(i, hh - 12); g.stroke(); } g.fillStyle = '#f4ece0'; g.beginPath(); g.arc(w / 2, hh / 2, 38, 0, TAU); g.fill(); g.fillStyle = '#8a1e2e'; g.font = '700 46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', w / 2, hh / 2 + 2); });
      this.cards = {};
      for (const c of ALL) this.cards[c] = this.makeCard(c);
      // хлопушка-барабан
      this.drum = this.makeDrum(); sc.add(this.drum);
      this.conf = [];
      this.ray = new T.Raycaster(); this.mouse = new T.Vector2();
      this.bindInput();
      this._resize = () => { this.resize(); this.layout(); }; addEventListener('resize', this._resize); this.resize();
      this.ready = true; this.loadEl.remove();
      this.layout(true);
    }
    rr(g, x, y, w, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    canvasTex(w, hh, fn) { const c = document.createElement('canvas'); c.width = w; c.height = hh; fn(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
    makeCard(c) {
      const T = THREE, s = sOf(c), r = rOf(c), col = RED[s] ? '#c8202e' : '#1a1a24';
      const face = this.canvasTex(256, 372, (g, w, hh) => {
        g.fillStyle = '#fbf6ec'; this.rr(g, 0, 0, w, hh, 22); g.fill(); g.strokeStyle = '#d8ccb8'; g.lineWidth = 3; this.rr(g, 6, 6, w - 12, hh - 12, 18); g.stroke();
        g.fillStyle = col; g.textAlign = 'center';
        g.font = '700 50px Georgia, serif'; g.fillText(r, 40, 58); g.font = '44px serif'; g.fillText(SUIT_CH[s], 40, 102);
        g.save(); g.translate(w, hh); g.rotate(Math.PI); g.font = '700 50px Georgia, serif'; g.fillText(r, 40, 58); g.font = '44px serif'; g.fillText(SUIT_CH[s], 40, 102); g.restore();
        g.textBaseline = 'middle';
        if ('ВДК'.includes(r)) { g.fillStyle = RED[s] ? 'rgba(200,32,46,0.1)' : 'rgba(26,26,36,0.08)'; this.rr(g, 62, 80, w - 124, hh - 160, 14); g.fill(); g.fillStyle = col; g.font = '700 110px Georgia, serif'; g.fillText(r, w / 2, hh / 2 - 18); g.font = '60px serif'; g.fillText(SUIT_CH[s], w / 2, hh / 2 + 70); }
        else if (r === 'Т') { g.font = '170px serif'; g.fillText(SUIT_CH[s], w / 2, hh / 2 + 8); }
        else { const n = +r, cols = n > 7 ? 2 : 2, rows = Math.ceil(n / 2); g.font = '46px serif'; for (let i = 0; i < n; i++) { const cx = n % 2 && i === n - 1 ? w / 2 : w / 2 + (i % 2 ? 42 : -42), cy = 98 + Math.floor(i / 2) * ((hh - 196) / Math.max(1, rows - 1)); g.fillText(SUIT_CH[s], cx, rows === 1 ? hh / 2 : cy); } }
      });
      const grp = new T.Group();
      const f = new T.Mesh(this.cardGeo, new T.MeshStandardMaterial({ map: face, roughness: 0.6 })); f.castShadow = true;
      const b = new T.Mesh(this.cardGeo, new T.MeshStandardMaterial({ map: this.backTex, roughness: 0.6 })); b.rotation.y = Math.PI; b.position.z = -0.002;
      grp.add(f, b); grp.userData = { id: c, tp: new T.Vector3(0, 0.02, -0.4), tr: new T.Euler(-Math.PI / 2, 0, 0), front: f };
      grp.position.set(-2.5, 0.02, -0.4); grp.rotation.set(Math.PI / 2, 0, 0); grp.visible = false;
      this.scene.add(grp);
      return grp;
    }
    makeDrum() {
      const T = THREE, g = new T.Group();
      const body = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.7, 32), new T.MeshStandardMaterial({ color: '#c8a050', metalness: 0.7, roughness: 0.3 })); body.castShadow = true; g.add(body);
      const holes = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const hl = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.72, 16), new T.MeshStandardMaterial({ color: '#1a1014' })); hl.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55); g.add(hl); holes.push(hl); }
      const cap = new T.Mesh(new T.ConeGeometry(0.5, 0.5, 24), new T.MeshStandardMaterial({ color: '#e05a6a', roughness: 0.4 })); cap.position.y = 0.6; g.add(cap);
      const str = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.8, 6), new T.MeshStandardMaterial({ color: '#f0e0c0' })); str.position.set(0, 1.2, 0); g.add(str);
      const knob = new T.Mesh(new T.SphereGeometry(0.1, 12, 8), new T.MeshStandardMaterial({ color: '#ffd27a' })); knob.position.set(0, 1.6, 0); g.add(knob);
      g.position.set(0, 0.36, 0); g.visible = false; g.userData = { holes, knob };
      return g;
    }
    confetti() {
      if (!this.ready) return; const T = THREE;
      for (let i = 0; i < 160; i++) {
        const m = new T.Mesh(new T.PlaneGeometry(0.07, 0.11), new T.MeshBasicMaterial({ color: pick(['#ff6b8a', '#ffd27a', '#7dffb5', '#9fd8ff', '#c9a6ff', '#ffffff']), side: T.DoubleSide }));
        m.position.set(0, 1.0, 0); const a = Math.random() * TAU, sp = 1.5 + Math.random() * 3.5;
        m.userData = { v: new T.Vector3(Math.cos(a) * sp, 3 + Math.random() * 4, Math.sin(a) * sp), r: new T.Vector3(Math.random() * 8, Math.random() * 8, 0), life: 3 + Math.random() };
        this.scene.add(m); this.conf.push(m);
      }
    }
    resize() { if (!this.renderer) return; const w = innerWidth, hh = innerHeight; this.renderer.setSize(w, hh, false); this.cam.aspect = w / hh; const portrait = hh > w, short = !portrait && hh < 520; this.short = short; this.cam.fov = portrait ? 70 : short ? 54 : 45; this.cam.position.set(0, portrait ? 7.6 : short ? 5.6 : 5.6, portrait ? 6.4 : short ? 3.3 : 5.2); this.cam.lookAt(0, 0, short ? 0.2 : 0.5); this.cam.updateProjectionMatrix(); }

    // раскладка карт по состоянию
    place(c, x, y, z, rx, ry, rz, show = true) { const m = this.cards[c]; if (!m) return; m.visible = show; m.userData.tp.set(x, y, z); m.userData.tr.set(rx, ry, rz); }
    layout(instant) {
      if (!this.ready || !this.S) return;
      const S = this.S, FU = -Math.PI / 2, FD = Math.PI / 2;
      for (const c of ALL) this.cards[c].visible = false;
      this.drum.visible = S.mode === 'pop';
      this.handMeshes = []; this.tableMeshes = [];
      const hand = (list, mine, faceUp) => {
        const n = list.length, sp = Math.min(0.55, (mine ? 4.6 : 3.4) / Math.max(1, n));
        list.forEach((c, i) => {
          const x = (i - (n - 1) / 2) * sp;
          if (mine) { const sel = this.sel === c; this.place(c, x, 0.5 + i * 0.004 + (sel ? 0.25 : 0), (this.short ? 2.15 : 2.55) - (sel ? 0.25 : 0), FU + (this.short ? 0.75 : 0.95), 0, -x * 0.06); this.handMeshes.push(this.cards[c]); }
          else this.place(c, x * 0.8, 0.03 + i * 0.004, -2.55, faceUp ? FU : FD, 0, Math.PI + x * 0.05);
        });
      };
      if (S.mode === 'durak' && S.D) {
        const D = S.D;
        hand(D.hands[this.me], true); hand(D.hands[this.op], false, false);
        D.deck.forEach((c, i) => { if (c === D.trump) this.place(c, -2.35, 0.012, -0.25, FU, 0, Math.PI / 2); else this.place(c, -2.55, 0.03 + i * 0.006, -0.3, FD, 0, 0.05); });
        const n = D.table.length, gap = 0.9;
        D.table.forEach((p, i) => {
          const col = i % 3, row = Math.floor(i / 3), x = (col - Math.min(2, n - 1) / 2) * gap, z = -0.55 + row * 1.15;
          this.place(p.a, x, 0.02, z, FU, 0, 0.04); this.tableMeshes.push({ m: this.cards[p.a], i });
          if (p.d) this.place(p.d, x + 0.14, 0.04, z + 0.2, FU, 0, -0.18);
        });
        // бито — стопка справа (без конкретных карт: просто рубашки из сыгранных)
        const gone = ALL.filter((c) => !D.deck.includes(c) && !D.hands.h.includes(c) && !D.hands.g.includes(c) && !D.table.some((p) => p.a === c || p.d === c));
        gone.forEach((c, i) => this.place(c, 2.5, 0.02 + i * 0.004, -0.3, FD, 0, 0.3 + (i % 5) * 0.08));
      }
      if (S.mode === 'p21' && S.B && S.B.hands) {
        const B = S.B, reveal = !!B.res;
        const row = (list, mine) => { const n = list.length; list.forEach((c, i) => { const x = (i - (n - 1) / 2) * 0.72; this.place(c, x, 0.02 + i * 0.003, mine ? 1.35 : -1.35, mine || reveal ? FU : FD, 0, mine ? 0 : Math.PI); }); };
        row(B.hands[this.me], true); row(B.hands[this.op], false);
        B.deck.slice(-8).forEach((c, i) => this.place(c, -2.5, 0.03 + i * 0.008, -0.2, FD, 0, 0.05));
      }
      if (instant) for (const c of ALL) { const m = this.cards[c]; m.position.copy(m.userData.tp); m.rotation.copy(m.userData.tr); }
    }
    bindInput() {
      const c = this.ctx.canvas;
      const pickAt = (e) => {
        const r = c.getBoundingClientRect(); this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        this.ray.setFromCamera(this.mouse, this.cam);
        return this.ray;
      };
      c.addEventListener('pointerdown', (e) => {
        const S = this.S; if (!S || !this.ready) return;
        SFX.unlock();
        const ray = pickAt(e);
        if (S.mode === 'pop') { const hit = ray.intersectObject(this.drum, true); if (hit.length && S.Pp && S.Pp.turn === this.me && !S.Pp.boom) this.send({ a: 'pull' }); return; }
        if (S.mode !== 'durak' || !S.D || S.D.winner) return;
        const D = S.D;
        const hand = ray.intersectObjects(this.handMeshes, true);
        if (hand.length) {
          let o = hand[0].object; while (o && !o.userData.id) o = o.parent;
          const id = o.userData.id, ts = sOf(D.trump), def = D.att !== this.me;
          if (def) {
            const opts = D.table.map((p, i) => (!p.d && this.beats(id, p.a, ts) ? i : -1)).filter((i) => i >= 0);
            if (opts.length > 1 && this.sel !== id) { this.sel = id; SFX.play('click'); this.ctx.toast('Нажми на карту на столе, которую бьёшь', 1800); this.layout(); return; }
            this.send({ a: 'play', c: id, i: opts.length === 1 ? opts[0] : undefined });
          } else this.send({ a: 'play', c: id });
          this.sel = null; return;
        }
        if (this.sel) {
          const tb = ray.intersectObjects(this.tableMeshes.map((t) => t.m), true);
          if (tb.length) { let o = tb[0].object; while (o && !o.userData.id) o = o.parent; const t = this.tableMeshes.find((q) => q.m === o); if (t) this.send({ a: 'play', c: this.sel, i: t.i }); }
          this.sel = null; this.layout();
        }
      });
    }
    beats(d, a, ts) { return (sOf(d) === sOf(a) && rv(d) > rv(a)) || (sOf(d) === ts && sOf(a) !== ts); }

    frame(dt, t) {
      this.t = t;
      if (!this.ready) return;
      const k = 1 - Math.exp(-dt * 10);
      for (const c of ALL) {
        const m = this.cards[c]; if (!m.visible) continue;
        m.position.lerp(m.userData.tp, k);
        m.rotation.x += (m.userData.tr.x - m.rotation.x) * k; m.rotation.y += (m.userData.tr.y - m.rotation.y) * k; m.rotation.z += (m.userData.tr.z - m.rotation.z) * k;
      }
      // подсветка возможных карт
      if (this.S && this.S.mode === 'durak' && this.S.D) {
        const D = this.S.D, ts = sOf(D.trump), myAtt = D.att === this.me;
        const ranks = new Set(D.table.flatMap((p) => [p.a, p.d]).filter(Boolean).map(rOf));
        for (const m of this.handMeshes || []) {
          const id = m.userData.id;
          const ok = !D.winner && (myAtt ? (!D.table.length || ranks.has(rOf(id))) && !D.table.some((p) => !p.d && false) : D.table.some((p) => !p.d && this.beats(id, p.a, ts)));
          m.userData.front.material.emissive && m.userData.front.material.emissive.set(ok ? (this.sel === id ? '#5a4a10' : '#2a2208') : '#000');
        }
      }
      // барабан
      if (this.drum.visible) { this.drumKick = Math.max(0, (this.drumKick || 0) - dt * 3); this.drum.rotation.y += dt * 0.3 + this.drumKick * dt * 6; this.drum.userData.knob.position.y = 1.6 - this.drumKick * 0.3; }
      for (let i = this.conf.length - 1; i >= 0; i--) { const m = this.conf[i], u = m.userData; u.life -= dt; u.v.y -= 6 * dt; u.v.multiplyScalar(0.985); m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt; if (m.position.y < 0.02) { m.position.y = 0.02; u.v.set(0, 0, 0); } if (u.life <= 0) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); this.conf.splice(i, 1); } }
      this.flame.scale.setScalar(1 + Math.sin(t * 13) * 0.12); this.candleL.intensity = 0.7 + Math.sin(t * 11) * 0.1 + Math.random() * 0.08;
      this.renderer.render(this.scene, this.cam);
    }
    resync() { if (this.ctx.isHost && this.S) this.broadcast(); }
    destroy() {
      if (this._resize) removeEventListener('resize', this._resize);
      if (this.renderer) { this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }); this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    }
  }
})();
