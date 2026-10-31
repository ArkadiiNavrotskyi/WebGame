'use strict';
// Главный контроллер: стартовый экран, комната, хаб с островами, выбор ролей, запуск игр.

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

window.GAMES = window.GAMES || {};
const HUB_ORDER = ['constellation', 'lighthouse', 'keys', 'garden', 'cards', 'bomb', 'starfall', 'usquiz', 'maze', 'cats', 'lights', 'islands', 'house'];

const App = {
  net: new Net(),
  me: { name: Store.get('name', ''), touch: matchMedia('(pointer: coarse)').matches },
  peer: null,
  screen: null,
  game: null, gameDef: null, loops: [],
  rs: null, // состояние выбора ролей
  hub: { islands: [], hover: -1, remote: null, remoteTarget: null, parts: new Particles(), lastSend: 0, tapFx: [], scroll: 0, maxScroll: 0, vel: 0, drag: null },

  init() {
    this.ui = $('#ui'); this.gui = $('#gameui');
    this.bg = $('#bg'); this.bgg = this.bg.getContext('2d');
    this.sky = new Sky();
    document.title = CONFIG.siteTitle;
    this.startBg();
    this.bindNet();
    this.bindHubInput();
    $('#rotate .skip').onclick = () => document.body.classList.add('rot-skip');
    const qp = new URLSearchParams(location.search);
    if (qp.get('test')) this.showTest(); else if (qp.get('diag')) this.showDiag(); else this.showStart();
    this.checkVersion();
  },

  // если на сайте уже новая версия, а телефон показал старую из кэша — перезагружаемся
  async checkVersion() {
    if (location.protocol === 'file:') return;
    try {
      const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      const { v } = await r.json();
      const p = new URLSearchParams(location.search);
      if (v > (CONFIG.version || 0) && p.get('u') !== String(v) && (this.screen === 'start' || this.screen === 'diag')) {
        p.set('u', v);
        location.replace(`${location.pathname}?${p}`);
      }
    } catch (e) {}
  },

  // ---------- Фоновое небо + хаб ----------
  startBg() {
    let last = performance.now(), t = 0;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (!document.body.classList.contains('playing')) {
        const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, hh = innerHeight;
        if (this.bg.width !== Math.round(w * dpr) || this.bg.height !== Math.round(hh * dpr)) { this.bg.width = Math.round(w * dpr); this.bg.height = Math.round(hh * dpr); }
        const g = this.bgg;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.sky.resize(w, hh);
        this.sky.draw(g, t, dt);
        if (this.screen === 'hub') this.drawHub(g, w, hh, t, dt);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  // острова в два ряда (на телефоне вертикально — по два); если не влезает — хаб прокручивается
  hubLayout(w, hh) {
    const L = [];
    let titleY, contentH;
    if (w > hh * 1.15) {
      const r = Math.max(Math.min(w / 10, hh / 9.5), Math.min(w / 14, 55));
      titleY = Math.max(hh * 0.13, 64);
      const y1 = titleY + r * 1.35 + 50, rows = Math.ceil(HUB_ORDER.length / 4);
      const xs = [0.14, 0.38, 0.62, 0.86];
      HUB_ORDER.forEach((id, i) => {
        const row = Math.floor(i / 4), inRow = Math.min(4, HUB_ORDER.length - row * 4);
        // неполный последний ряд — по центру
        const x = inRow === 4 ? xs[i % 4] : 0.5 + ((i % 4) - (inRow - 1) / 2) * 0.24;
        L.push({ id, x: w * x, y: y1 + row * r * 3.75 + (i % 2 ? -0.2 : 0.2) * r, r });
      });
      contentH = y1 + (rows - 1) * r * 3.75 + r * 2.4;
    } else {
      const r = Math.min(w / 5.4, hh / 11.5, 82);
      titleY = Math.max(hh * 0.11, 84);
      const y1 = titleY + r * 1.35 + 56;
      HUB_ORDER.forEach((id, i) => L.push({ id, x: w * (i % 2 ? 0.73 : 0.27), y: y1 + Math.floor(i / 2) * r * 3.7 + (i % 2 ? r * 0.35 : 0), r }));
      contentH = y1 + (Math.ceil(HUB_ORDER.length / 2) - 1) * r * 3.7 + r * 0.35 + r * 2.4;
    }
    return { L, titleY, contentH };
  },

  drawHub(g, w, hh, t, dt) {
    const H = this.hub;
    const lay = this.hubLayout(w, hh);
    H.islands = lay.L;
    H.maxScroll = Math.max(0, lay.contentH - hh);
    // прокрутка по инерции
    if (!H.drag) { H.scroll += H.vel * dt; H.vel *= Math.exp(-dt * 5); if (Math.abs(H.vel) < 5) H.vel = 0; }
    H.scroll = clamp(H.scroll, 0, H.maxScroll);
    H.parts.update(dt);
    g.save();
    g.translate(0, -H.scroll);
    // заголовок
    g.save();
    g.textAlign = 'center';
    g.font = `${Math.min(64, w / 9, hh / 6)}px 'Marck Script', cursive`;
    g.fillStyle = '#fff';
    g.globalAlpha = 0.95;
    const names = `${this.me.name || 'Я'}  ✦  ${this.peer ? this.peer.name : '…'}`;
    const ty = lay.titleY;
    Glow.draw(g, w / 2, ty - 14, Math.min(260, w / 3), '#b28cff', 0.25);
    g.fillText(CONFIG.siteTitle, w / 2, ty);
    g.font = `600 ${Math.min(16, w / 26)}px Comfortaa, sans-serif`;
    g.fillStyle = '#d9cffc';
    g.fillText(names, w / 2, ty + Math.min(34, w / 16));
    g.restore();

    H.islands.forEach((isl, i) => {
      const def = GAMES[isl.id];
      if (!def) return;
      drawIsland(g, isl.x, isl.y, isl.r, t, isl.id, H.hover === i, def.color);
      // подпись
      g.save(); g.textAlign = 'center';
      const by = isl.y + isl.r * 1.62 + Math.sin(t * 1.2 + isl.x * 0.01) * isl.r * 0.06;
      g.font = `700 ${Math.max(13, isl.r * 0.2)}px Comfortaa, sans-serif`;
      g.fillStyle = '#fff'; g.fillText(def.title, isl.x, by);
      const info = def.info ? def.info() : def.tagline;
      if (info) { g.font = `400 ${Math.max(11, isl.r * 0.15)}px Comfortaa, sans-serif`; g.fillStyle = '#bfb5e8'; g.fillText(info, isl.x, by + Math.max(16, isl.r * 0.22)); }
      g.restore();
    });

    // вспышки от касаний
    for (let i = H.tapFx.length - 1; i >= 0; i--) {
      const f = H.tapFx[i]; f.t += dt;
      if (f.t > 0.6) { H.tapFx.splice(i, 1); continue; }
      g.strokeStyle = `rgba(255,220,240,${1 - f.t / 0.6})`; g.lineWidth = 2;
      g.beginPath(); g.arc(f.x, f.y, 10 + f.t * 60, 0, TAU); g.stroke();
    }

    // курсор второго игрока
    if (H.remoteTarget && this.peer) {
      const isl = H.islands[H.remoteTarget.i];
      if (isl) {
        const tx = isl.x + H.remoteTarget.dx * isl.r, ty2 = isl.y + H.remoteTarget.dy * isl.r;
        if (!H.remote) H.remote = { x: tx, y: ty2 };
        H.remote.x = lerp(H.remote.x, tx, 0.2); H.remote.y = lerp(H.remote.y, ty2, 0.2);
        if (Math.random() < 0.5) H.parts.emit(H.remote.x, H.remote.y, { n: 1, speed: 20, life: 0.8, size: 5, color: ['#ffd0ea', '#ffe7a6'] });
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, H.remote.x, H.remote.y, 26, '#ff9ccd', 0.9);
        g.globalCompositeOperation = 'source-over';
        drawGlyph(g, 'star', H.remote.x, H.remote.y, 14, '#fff', 2);
        g.font = '600 12px Comfortaa'; g.fillStyle = '#ffd6ea'; g.textAlign = 'left';
        g.fillText(this.peer.name, H.remote.x + 12, H.remote.y + 18);
      }
    }
    H.parts.draw(g);
    g.restore();
    // подсказка: ниже есть ещё игры
    if (H.maxScroll > 10 && H.scroll < H.maxScroll - 30) {
      const a = Math.min(1, (H.maxScroll - 30 - H.scroll) / 80);
      const by = hh - 26 + Math.sin(t * 3) * 5;
      g.save(); g.globalAlpha = a * 0.9; g.textAlign = 'center';
      g.font = '700 13px Comfortaa, sans-serif'; g.fillStyle = '#ffe7a6';
      g.fillText('листай вниз — ещё игры', w / 2, by - 18);
      g.strokeStyle = '#ffe7a6'; g.lineWidth = 2.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w / 2 - 9, by - 6); g.lineTo(w / 2, by + 3); g.lineTo(w / 2 + 9, by - 6); g.stroke();
      g.restore();
    }
  },

  bindHubInput() {
    const H = this.hub;
    const hit = (x, y) => { y += H.scroll; return H.islands.findIndex((s) => Math.hypot((x - s.x) / s.r, (y - s.y - s.r * 0.35) / (s.r * 1.1)) < 1.15); };
    this.bg.addEventListener('pointermove', (e) => {
      if (this.screen !== 'hub') return;
      const D = H.drag;
      if (D && D.id === e.pointerId) {
        const dy = e.clientY - D.y;
        if (Math.abs(dy) > 8) D.moved = true;
        if (D.moved) {
          const now = performance.now();
          H.scroll = clamp(D.s0 - dy, 0, H.maxScroll);
          H.vel = (D.ly - e.clientY) / Math.max(0.016, (now - D.lt) / 1000); D.ly = e.clientY; D.lt = now;
          return;
        }
      }
      H.hover = hit(e.clientX, e.clientY);
      this.bg.style.cursor = H.hover >= 0 ? 'pointer' : 'default';
      this.sendCursor(e.clientX, e.clientY);
    });
    this.bg.addEventListener('pointerdown', (e) => {
      if (this.screen !== 'hub') return;
      H.vel = 0;
      H.drag = { id: e.pointerId, y: e.clientY, s0: H.scroll, moved: false, ly: e.clientY, lt: performance.now() };
      try { this.bg.setPointerCapture(e.pointerId); } catch (er) {}
    });
    const up = (e) => {
      const D = H.drag; if (!D || D.id !== e.pointerId) return;
      H.drag = null;
      if (this.screen !== 'hub') return;
      if (D.moved) { if (performance.now() - D.lt > 80) H.vel = 0; return; }
      H.vel = 0;
      H.tapFx.push({ x: e.clientX, y: e.clientY + H.scroll, t: 0 });
      this.sendCursor(e.clientX, e.clientY, true);
      const i = hit(e.clientX, e.clientY);
      if (i >= 0) { H.hover = i; SFX.play('pop'); this.propose(H.islands[i].id); }
    };
    this.bg.addEventListener('pointerup', up);
    this.bg.addEventListener('pointercancel', (e) => { if (H.drag && H.drag.id === e.pointerId) H.drag = null; });
    this.bg.addEventListener('wheel', (e) => { if (this.screen !== 'hub') return; H.vel = 0; H.scroll = clamp(H.scroll + e.deltaY, 0, H.maxScroll); }, { passive: true });
  },

  sendCursor(x, y, force) {
    const H = this.hub, now = performance.now();
    if (!this.net.connected || (!force && now - H.lastSend < 50) || !H.islands.length) return;
    H.lastSend = now;
    y += H.scroll;
    let best = 0, bd = 1e9;
    H.islands.forEach((s, i) => { const d = Math.hypot(x - s.x, y - s.y); if (d < bd) { bd = d; best = i; } });
    const s = H.islands[best];
    this.net.send({ t: 'cur', i: best, dx: +((x - s.x) / s.r).toFixed(3), dy: +((y - s.y) / s.r).toFixed(3) });
  },

  // ---------- Сеть ----------
  bindNet() {
    const net = this.net;
    net.on('open', () => {
      net.send({ t: 'hello', name: this.me.name, touch: this.me.touch, inGame: this.gameDef ? this.gameDef.id : null });
      this.updateBar();
      if (this.game) this.showLost(false);
    });
    net.on('close', () => {
      this.updateBar();
      // игру не закрываем: ждём переподключения и продолжаем с того же места
      if (this.game) this.showLost(true);
      else if (this.screen === 'roles') { this.showHub(); }
      this.closeModal();
    });
    net.on('status', (s) => { const el = $('#status'); if (el) el.textContent = s; this.updateBar(s); });
    net.on('rtt', () => this.updateBar());
    net.on('msg', (m) => this.onMsg(m));
    net.on('version', (v) => {
      if (this._verWarned === v) return; this._verWarned = v;
      const mine = CONFIG.version, old = v < mine;
      this.modal({ title: 'Разные версии сайта', text: `У тебя версия <b>${mine}</b>, у второго игрока — <b>${v || 'старая'}</b>. Так соединение не заработает.<br><br>${old ? 'Второму игроку' : 'Тебе'} нужно обновить страницу. Лучше открыть сайт в Safari или Chrome (не внутри ВКонтакте/Telegram) по ссылке:<br><b>arkadiinavrotskyi.github.io/WebGame/?u=${Math.max(mine, v)}</b>`, buttons: [{ label: old ? 'Понятно' : 'Обновить сейчас', onClick: () => { if (!old) location.href = location.pathname + '?u=' + v + '&t=' + Date.now(); } }] });
    });
  },

  onMsg(m) {
    if (!m || !m.t) return;
    switch (m.t) {
      case 'tinfo': case 'tping': case 'tpong': case 'tres': if (this._test) this._test(m); break;
      case 'hello': {
        const first = !this.peer;
        this.peer = { name: (m.name || 'Гость').slice(0, 16), touch: !!m.touch };
        // отвечаем приветствием, чтобы после переподключения обе стороны знали имена
        if (!m.ack) this.net.send({ t: 'hello', ack: true, name: this.me.name, touch: this.me.touch, inGame: this.gameDef ? this.gameDef.id : null });
        if (this.screen === 'waiting' || this.screen === 'joining' || this.screen === 'start') {
          SFX.play('chime');
          this.showHub();
          this.toast(`✦ ${esc(this.peer.name)} ${first ? 'здесь!' : 'снова здесь'}`);
        }
        // второй игрок вернулся, а мы в игре: возвращаем его в ту же игру и присылаем текущее состояние
        if (this.net.isHost && this.game && this.curStart && !m.ack) {
          if (m.inGame !== this.curStart.game) this.net.send(this.curStart);
          setTimeout(() => { if (this.game && this.game.resync) this.game.resync(); }, 500);
          this.toast(`✦ ${esc(this.peer.name)} снова в игре`);
        }
        this.updateBar();
        break;
      }
      case 'cur': this.hub.remoteTarget = m; break;
      case 'propose': this.onPropose(m.game); break;
      case 'answer':
        this.closeModal();
        if (m.cancel) this.toast('Предложение отменено');
        else if (m.yes) { SFX.play('chime'); if (this.net.isHost) this.openRoles(m.game); }
        else this.toast(`${esc(this.peer?.name || '')}: «давай в другой раз» 🙈`);
        break;
      case 'rs': this.rs = m.rs; this.showRoles(); break;
      case 'rswap': if (this.net.isHost && this.rs) { this.rs.assign = 1 - this.rs.assign; this.rs.ready = { h: false, g: false }; this.pushRoles(); } break;
      case 'rready': if (this.net.isHost && this.rs) { this.rs.ready.g = !!m.v; this.pushRoles(); } break;
      case 'rcancel': this.rs = null; this.showHub(); this.toast('Выбор игры отменён'); break;
      case 'start': this.startGame(m.game, m.seed, m.assign); break;
      case 'exit':
        if (this.game) { this.stopGame(); this.showHub(); this.toast(`${esc(this.peer?.name || '')} открывает хаб — игра закрыта`); }
        break;
      case 'g': if (this.game && this.game.onMsg) { try { this.game.onMsg(m.d); } catch (e) { console.error(e); } } break;
    }
  },

  // ---------- Экраны ----------
  setUI(el) { this.ui.innerHTML = ''; if (el) this.ui.appendChild(el); },

  showStart(errText) {
    this.screen = 'start';
    this.removeBar();
    const params = new URLSearchParams(location.search);
    const room = RoomCode.parse(params.get('room') || '');
    const local = this.net.local;
    const el = h(`
      <div class="panel">
        <h1 class="title">${esc(CONFIG.siteTitle)}</h1>
        <p class="subtitle">тринадцать игр для двоих · на разных концах карты</p>
        <label class="lbl">Как тебя зовут?</label>
        <input class="inp" id="name" maxlength="16" placeholder="Твоё имя" value="${esc(this.me.name)}" autocomplete="off">
        ${room ? `
          <button class="btn" id="joinLink">✦ Войти в комнату ${esc(room.text)}</button>
        ` : `
          <button class="btn" id="create">✦ Создать комнату</button>
          <label class="lbl">или войти по коду</label>
          <div class="row"><input class="inp code" id="code" maxlength="12" placeholder="ЛИС-27" autocomplete="off"><button class="btn ghost" id="join" style="margin-top:0;flex:0 0 110px">Войти</button></div>
        `}
        <div class="err" id="err">${errText || ''}</div>
        <div class="hint">${local
          ? '🧪 Тестовый режим: открой вторую вкладку с этим же адресом и войди по коду.<br><a id="online">вернуться в обычный режим</a>'
          : 'Проверить на одном компьютере: <a id="localtest">тест в двух вкладках</a><br><a href="?diag=1">проверка связи</a> · <a href="?test=1">тест связи вдвоём</a>'}</div>
      </div>`);
    this.setUI(el);
    const nameIn = $('#name', el);
    const getName = () => {
      const n = nameIn.value.trim();
      if (!n) { $('#err', el).textContent = 'Напиши своё имя ✦'; nameIn.focus(); return null; }
      this.me.name = n; Store.set('name', n); return n;
    };
    if ($('#create', el)) $('#create', el).onclick = () => { if (getName()) this.createRoom(); };
    if ($('#join', el)) {
      const go = () => {
        if (!getName()) return;
        const c = RoomCode.parse($('#code', el).value);
        if (!c) { $('#err', el).textContent = 'Код выглядит как «ЛИС-27»'; return; }
        this.joinRoom(c);
      };
      $('#join', el).onclick = go;
      $('#code', el).onkeydown = (e) => { if (e.key === 'Enter') go(); };
    }
    if ($('#joinLink', el)) $('#joinLink', el).onclick = () => { if (getName()) this.joinRoom(room); };
    if ($('#localtest', el)) $('#localtest', el).onclick = () => { location.search = '?local=1'; };
    if ($('#online', el)) $('#online', el).onclick = () => { location.search = ''; };
  },

  // ---------- Проверка связи: что именно блокируется ----------
  async showDiag() {
    this.screen = 'diag';
    const el = h(`<div class="panel"><h2 style="margin:0 0 6px;text-align:center">Проверка связи</h2>
      <p class="hint" style="margin:0 0 12px">Проверка идёт ~20 секунд. Пришли скриншот результата.</p><div id="dg"></div>
      <button class="btn ghost" id="dgBack">← назад</button></div>`);
    this.setUI(el);
    $('#dgBack', el).onclick = () => { location.search = ''; };
    const box = $('#dg', el);
    const row = (name) => { const r = h(`<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px"><span>${name}</span><b>…</b></div>`); box.appendChild(r); return (ok, txt) => { const b = $('b', r); b.textContent = txt || (ok ? '✓' : '✗'); b.style.color = ok ? '#7dffb5' : '#ff8a8a'; }; };
    const withT = (p, ms) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms))]);
    row('Сайт')(true);
    // серверы знакомства — проверяем все параллельно
    const sigs = CONFIG.signalServers.map((u) => {
      const f = row('Связь: ' + u.split('//')[1].split(/[:/]/)[0]);
      return withT(new Promise((res) => { const c = new MqttWs(u, () => { res(); c.close(); }, () => {}); }), 8000).then(() => (f(true), 1), () => (f(false), 0));
    });
    const okSig = (await Promise.all(sigs)).reduce((x, y) => x + y, 0);
    const stun = async (url) => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: url }] });
      pc.createDataChannel('x');
      let found = false;
      pc.onicecandidate = (ev) => { if (ev.candidate && / srflx /.test(ev.candidate.candidate)) found = true; };
      await pc.setLocalDescription(await pc.createOffer());
      await new Promise((r) => setTimeout(r, 4000));
      pc.close(); return found;
    };
    for (const s of CONFIG.iceServers) {
      const u = Array.isArray(s.urls) ? s.urls[0] : s.urls;
      const f = row(u.replace(/^(stun|turns?):/, '') + (u.startsWith('turn') ? ' (TURN)' : ''));
      try { f(await stun(u)); } catch (e) { f(false); }
    }
    box.appendChild(h(`<p class="hint">${okSig ? '✓ хотя бы один сервер связи доступен' : '✗ ни один сервер связи не доступен'}. Нужен ✓ хотя бы у одной «Связи» и одного STUN — тогда работает без VPN.</p>`));
  },

  // ---------- Тест связи вдвоём: обе стороны проверяют всё и показывают итог ----------
  async showTest() {
    this.screen = 'test';
    const qp = new URLSearchParams(location.search), given = RoomCode.parse(qp.get('test') === '1' ? '' : qp.get('test'));
    const host = !given, code = given || RoomCode.make();
    const link = location.origin + location.pathname + '?test=' + encodeURIComponent(code.text) + '&u=' + CONFIG.version;
    const ua = navigator.userAgent;
    const inApp = /VKClient|vkontakte|Telegram|FBAN|FBAV|Instagram|OKApp/i.test(ua) ? (/VK/i.test(ua) ? 'ВКонтакте' : /Telegram/i.test(ua) ? 'Telegram' : 'приложения') : '';
    const browser = inApp ? 'внутри ' + inApp + ' ⚠' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'браузер';
    const ROWS = [['ver', 'Версия сайта'], ['br', 'Браузер'], ['srv', 'Серверы связи'], ['peer', 'Нашли друг друга'], ['msg', 'Сообщения дошли'], ['rtt', 'Задержка'], ['dir', 'Прямой канал']];
    const el = h('<div class="panel" style="max-width:560px"><h2 style="margin:0 0 6px;text-align:center">Тест связи вдвоём</h2>' +
      (host ? '<p class="hint" style="margin:0 0 8px">Отправь эту ссылку второму игроку (пусть откроет в Safari или Chrome, не внутри ВК):</p><input class="inp" id="tLink" readonly value="' + esc(link) + '" style="font-size:13px"><button class="btn small" id="tCopy" style="margin:8px auto 4px;display:block">📋 Скопировать ссылку</button>' : '<p class="hint" style="margin:0 0 8px">Подключаюсь к тесту…</p>') +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="color:var(--muted)"><td></td><td style="text-align:center">Ты</td><td style="text-align:center">Партнёр</td></tr>' +
      ROWS.map(([id, n]) => '<tr style="border-top:1px solid var(--line)"><td style="padding:8px 4px">' + n + '</td><td id="t_' + id + '_me" style="text-align:center">…</td><td id="t_' + id + '_peer" style="text-align:center">…</td></tr>').join('') +
      '</table><div id="tVerdict" class="hint" style="font-size:14px;line-height:1.5;margin-top:12px;color:var(--ink)">Ждём второго игрока…</div><button class="btn ghost" id="tBack">← на сайт</button></div>');
    this.setUI(el);
    $('#tBack', el).onclick = () => { location.href = location.pathname; };
    if (host) $('#tCopy', el).onclick = async () => { try { await navigator.clipboard.writeText(link); this.toast('Ссылка скопирована ✦'); } catch (e) { $('#tLink', el).select(); } };
    const set = (id, side, ok, txt) => { const c = $('#t_' + id + '_' + side, el); if (!c) return; c.textContent = txt; c.style.color = ok === true ? '#7dffb5' : ok === false ? '#ff8a8a' : 'var(--ink)'; };
    const me = { v: CONFIG.version, br: browser, inApp: !!inApp };
    set('ver', 'me', null, String(me.v)); set('br', 'me', !inApp, browser);
    const R = { peerInfo: null, sent: 0, got: 0, rtts: [], peerRes: null, myRes: null, srvOk: false };
    const verdict = () => {
      const v = [], P = R.peerInfo;
      if (P && P.v !== me.v) v.push('❗ Разные версии (' + me.v + ' и ' + P.v + '). Тому, у кого меньше, — закрыть вкладку и открыть ссылку заново (Ctrl+F5 на компьютере).');
      if (me.inApp || (P && P.inApp)) v.push('⚠ Сайт открыт внутри приложения (ВК/Telegram) — оно держит старые версии. Откройте в Safari или Chrome.');
      if (!R.srvOk) v.push('❗ У тебя не доступен ни один сервер связи — нужен VPN или другая сеть.');
      if (P && !P.srvOk) v.push('❗ У партнёра не доступен ни один сервер связи.');
      if (R.myRes && R.peerRes) {
        if (R.myRes.got < R.myRes.sent || R.peerRes.got < R.peerRes.sent) v.push('⚠ Часть тестовых сообщений не дошла за 12 секунд — связь очень нестабильная.');
        if (!v.length) v.push('✓ Всё в порядке! Связь ' + (R.myRes.dir ? 'напрямую' : 'через сервер') + ', задержка ~' + R.myRes.rtt + ' мс. Можно играть.');
      }
      $('#tVerdict', el).innerHTML = v.join('<br>') || 'Проверяю…';
    };
    const brokersText = () => (this.net.sig ? this.net.sig.clients.map((c) => (c.ready ? '✓' : '✗') + c.url.split('//')[1].split('.')[1]).join(' ') : '—');
    const checkSrv = () => { const ok = !!(this.net.sig && this.net.sig.ready); R.srvOk = ok; set('srv', 'me', ok, brokersText()); };
    setTimeout(checkSrv, 5000); setInterval(checkSrv, 3000);
    this._test = (m) => {
      if (m.t === 'tinfo') { R.peerInfo = m; set('ver', 'peer', m.v === me.v, String(m.v)); set('br', 'peer', !m.inApp, m.br); set('srv', 'peer', m.srvOk, m.srv); verdict(); }
      if (m.t === 'tping') this.net.send({ t: 'tpong', n: m.n, ts: m.ts });
      if (m.t === 'tpong') { R.got++; R.rtts.push(performance.now() - m.ts); }
      if (m.t === 'tres') { R.peerRes = m; set('msg', 'peer', m.got === m.sent, m.got + '/' + m.sent); set('rtt', 'peer', m.rtt < 800, m.rtt + ' мс'); set('dir', 'peer', null, m.dir ? 'да' : 'нет, через сервер'); verdict(); }
    };
    let started = false;
    this.net.on('open', () => {
      set('peer', 'me', true, '✓'); set('peer', 'peer', true, '✓');
      if (started) return; started = true;
      $('#tVerdict', el).textContent = 'Нашли друг друга! Гоняю тестовые сообщения ~12 секунд…';
      const info = () => this.net.send({ t: 'tinfo', v: me.v, br: me.br, inApp: me.inApp, srvOk: !!(this.net.sig && this.net.sig.ready), srv: brokersText() });
      info(); setTimeout(info, 3000);
      let n = 0;
      const iv = setInterval(() => { if (n >= 25) return clearInterval(iv); R.sent++; this.net.send({ t: 'tping', n: n++, ts: performance.now() }); }, 150);
      setTimeout(() => {
        const rtt = R.rtts.length ? Math.round(R.rtts.reduce((x, y) => x + y, 0) / R.rtts.length) : 0;
        R.myRes = { sent: R.sent, got: R.got, rtt, dir: this.net.direct };
        set('msg', 'me', R.got === R.sent, R.got + '/' + R.sent); set('rtt', 'me', rtt < 800, rtt + ' мс'); set('dir', 'me', null, this.net.direct ? 'да' : 'нет, через сервер');
        this.net.send({ t: 'tres', sent: R.myRes.sent, got: R.myRes.got, rtt: R.myRes.rtt, dir: R.myRes.dir }); verdict();
      }, 12000);
    });
    try {
      if (host) { await this.net.host(code); $('#tVerdict', el).textContent = 'Тест открыт. Ждём второго игрока по ссылке…'; }
      else await this.net.join(code);
    } catch (e) {
      set('peer', 'me', false, '✗');
      $('#tVerdict', el).innerHTML = e.message === 'server' ? '❗ Не удалось подключиться ни к одному серверу связи. Попробуй VPN или другую сеть.' : e.message === 'notfound' ? '❗ Тест не найден. Проверь, что у первого игрока открыта эта же ссылка и страница не закрыта.' : '❗ Ошибка: ' + esc(e.message);
    }
  },

  async createRoom(attempt = 0) {
    const code = RoomCode.make();
    this.screen = 'waiting';
    const base = location.origin + location.pathname;
    const link = `${base}?${this.net.local ? 'local=1&' : ''}room=${encodeURIComponent(code.text)}`;
    const el = h(`
      <div class="panel" style="text-align:center">
        <div style="color:var(--muted);font-size:14px">Код комнаты</div>
        <div class="bigcode">${esc(code.text)}</div>
        <div style="color:var(--muted);font-size:13px">продиктуй его в Discord — или отправь ссылку</div>
        <div class="orbit"><i></i><i></i></div>
        <div id="status" style="font-size:14px">Открываю комнату…</div>
        <button class="btn" id="copy">🔗 Скопировать ссылку-приглашение</button>
        <button class="btn ghost" id="cancel">Назад</button>
      </div>`);
    this.setUI(el);
    $('#copy', el).onclick = async () => {
      try { await navigator.clipboard.writeText(link); this.toast('Ссылка скопирована — вставь её в Discord ✦'); }
      catch (e) { prompt('Скопируй ссылку:', link); }
    };
    $('#cancel', el).onclick = () => location.reload();
    try {
      await this.net.host(code);
      const st = $('#status'); if (st) st.textContent = 'Ждём второго игрока…';
    } catch (e) {
      if (e.message === 'busy' && attempt < 3) return this.createRoom(attempt + 1);
      this.showStart('Не удалось открыть комнату. Проверь интернет и попробуй ещё раз.');
    }
  },

  async joinRoom(code) {
    this.screen = 'joining';
    const el = h(`
      <div class="panel" style="text-align:center">
        <div class="bigcode">${esc(code.text)}</div>
        <div class="orbit"><i></i><i></i></div>
        <div id="status">Ищу комнату…</div>
        <button class="btn ghost" id="cancel">Назад</button>
      </div>`);
    this.setUI(el);
    $('#cancel', el).onclick = () => location.reload();
    try { await this.net.join(code); }
    catch (e) {
      const msg = e.message === 'notfound' ? 'Комната не найдена. Проверь код — и что комната создана.'
        : e.message === 'server' ? 'Сервер связи недоступен (возможно, блокировка). <a href="?diag=1">Проверка связи</a>'
        : 'Соединение не пробилось. Попробуй ещё раз. <a href="?diag=1">Проверка связи</a>';
      this.net = new Net(); this.bindNet();
      this.showStart(msg);
    }
  },

  showHub() {
    this.screen = 'hub';
    this.rs = null;
    this.setUI(null);
    this.ensureBar();
  },

  ensureBar() {
    if ($('.hubbar')) return this.updateBar();
    const bar = h(`<div class="hubbar">
      <div class="chip" id="conn"><span class="dot"></span><span id="connText"></span></div>
      <div><button class="iconbtn" id="inst" title="Установить как приложение" style="display:none">📲</button><button class="iconbtn" id="snd" title="Звук"></button><button class="iconbtn" id="fs" title="На весь экран">⛶</button></div>
    </div>`);
    document.body.appendChild(bar);
    // нажатие на плашку связи — окно отладки (для скриншота)
    $('#conn', bar).onclick = () => {
      const old = $('#netdbg'); if (old) { old.remove(); clearInterval(this._dbgT); return; }
      const box = h('<pre id="netdbg" style="position:fixed;left:10px;right:10px;top:70px;z-index:40;margin:0;padding:12px;border-radius:14px;background:rgba(5,5,20,.92);border:1px solid var(--line);color:#cfe;font:12px/1.5 monospace;white-space:pre-wrap"></pre>');
      document.body.appendChild(box);
      const upd = () => { box.textContent = this.net.debugInfo() + '\n(нажми на плашку ещё раз, чтобы закрыть)'; };
      upd(); this._dbgT = setInterval(upd, 1000);
    };
    $('#conn', bar).style.cursor = 'pointer';
    const snd = $('#snd', bar);
    const setSnd = () => { snd.textContent = SFX.muted ? '🔇' : '🔊'; };
    setSnd();
    snd.onclick = () => { SFX.setMute(!SFX.muted); setSnd(); SFX.play('click'); };
    const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) $('#fs', bar).style.display = 'none';
    if (this.me.touch && !standalone) { $('#inst', bar).style.display = ''; $('#inst', bar).onclick = () => this.installHelp(ios); }
    $('#fs', bar).onclick = () => {
      const d = document;
      if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement);
      else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    };
    this.updateBar();
  },
  installHelp(ios) {
    if (window._installPrompt) { window._installPrompt.prompt(); window._installPrompt = null; return; }
    this.modal({
      title: '📲 Наше небо — как приложение',
      text: ios
        ? 'В Safari нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой внизу экрана) → <b>«На экран „Домой“»</b>.<br><br>Появится иконка со звездой — игры будут открываться на весь экран, без адресной строки.'
        : 'Нажми <b>⋮</b> в углу браузера → <b>«Добавить на главный экран»</b> или <b>«Установить приложение»</b>.<br><br>Появится иконка со звездой — игры будут открываться на весь экран.',
      buttons: [{ label: 'Понятно ✦' }],
    });
  },
  removeBar() { const b = $('.hubbar'); if (b) b.remove(); },
  updateBar(status) {
    const t = $('#connText'); if (!t) return;
    const on = this.net.connected;
    $('#conn .dot').classList.toggle('off', !on);
    t.textContent = on ? `${this.peer ? this.peer.name : ''} · ${this.net.rtt || '—'} мс${this.net.local || this.net.direct ? '' : ' · через сервер'}` : (typeof status === 'string' ? status : (this.net.isHost ? 'ждём второго игрока…' : 'переподключение…'));
  },

  // ---------- Предложить игру ----------
  propose(id) {
    const def = GAMES[id];
    if (!this.net.connected || !this.peer) { this.toast('Сначала дождись второго игрока ✦'); return; }
    this.net.send({ t: 'propose', game: id });
    this.modal({
      title: `${def.icon} ${def.title}`,
      text: `Ждём ответа от ${esc(this.peer.name)}…`,
      buttons: [{ label: 'Отменить', ghost: true, onClick: () => this.net.send({ t: 'answer', game: id, yes: false, cancel: true }) }],
    });
  },
  onPropose(id) {
    const def = GAMES[id]; if (!def) return;
    SFX.play('bell');
    this.closeModal();
    this.modal({
      title: `${def.icon} ${def.title}`,
      text: `${esc(this.peer?.name || '')} предлагает сыграть!<br><span style="font-size:13px">${esc(def.tagline)}</span>`,
      buttons: [
        { label: 'Играем! ✦', onClick: () => { this.net.send({ t: 'answer', game: id, yes: true }); if (this.net.isHost) this.openRoles(id); } },
        { label: 'Не сейчас', ghost: true, onClick: () => this.net.send({ t: 'answer', game: id, yes: false }) },
      ],
    });
  },

  // ---------- Выбор ролей (общий экран, им управляет хост) ----------
  openRoles(id) {
    const def = GAMES[id];
    let assign = 0;
    if (def.roles) {
      // роль[0] — для клавиатуры, отдаём тому, кто за компьютером
      if (this.me.touch && !this.peer.touch) assign = 1;
    }
    this.rs = { game: id, assign, ready: { h: false, g: false } };
    this.pushRoles();
  },
  pushRoles() {
    this.net.send({ t: 'rs', rs: this.rs });
    this.showRoles();
    if (this.rs.ready.h && this.rs.ready.g) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const m = { t: 'start', game: this.rs.game, seed, assign: this.rs.assign };
      setTimeout(() => { this.net.send(m); this.startGame(m.game, m.seed, m.assign); }, 450);
    }
  },
  showRoles() {
    const rs = this.rs; if (!rs) return;
    const def = GAMES[rs.game];
    this.closeModal();
    this.screen = 'roles';
    const host = this.net.isHost;
    const myIdx = host ? rs.assign : 1 - rs.assign;
    const myReady = host ? rs.ready.h : rs.ready.g, peerReady = host ? rs.ready.g : rs.ready.h;
    const ctrlText = (r, touch) => (touch ? r.ctrl.touch : r.ctrl.pc);
    const rolesHtml = def.roles ? `<div class="roles">${def.roles.map((r, i) => {
      const mine = i === myIdx;
      const touch = mine ? this.me.touch : this.peer?.touch;
      return `<div class="role ${mine ? 'mine' : ''}"><span class="who">${mine ? 'Ты' : esc(this.peer?.name || '')}</span>
        <div class="ico">${r.icon}</div><h3>${esc(r.name)}</h3><p>${r.desc}</p>
        <div class="ctrl">🎮 ${ctrlText(r, touch)}</div></div>`;
    }).join('')}</div>` : '';
    const el = h(`
      <div class="panel rolewrap">
        <h2>${def.icon} ${esc(def.title)}</h2>
        <div class="desc">${esc(def.tagline)}</div>
        ${rolesHtml}
        <div class="readyline"><span>Ты: ${myReady ? '<b>готов(а) ✓</b>' : 'не готов(а)'}</span><span>${esc(this.peer?.name || '')}: ${peerReady ? '<b>готов(а) ✓</b>' : 'выбирает…'}</span></div>
        <div class="row" style="margin-top:6px">
          ${def.roles ? '<button class="btn ghost" id="swap">⇄ Поменяться</button>' : ''}
          <button class="btn" id="ready">${myReady ? 'Жду…' : 'Готов(а)! ✦'}</button>
        </div>
        <div class="rules" style="margin-top:14px"><ul style="margin:0;padding-left:18px">${def.rules.map((r) => `<li>${r}</li>`).join('')}</ul></div>
        <button class="btn ghost small" id="back" style="margin:12px auto 0;display:block">← назад в хаб</button>
      </div>`);
    this.setUI(el);
    if ($('#swap', el)) $('#swap', el).onclick = () => {
      SFX.play('whoosh');
      if (host) { rs.assign = 1 - rs.assign; rs.ready = { h: false, g: false }; this.pushRoles(); } else this.net.send({ t: 'rswap' });
    };
    $('#ready', el).onclick = () => {
      SFX.play('click');
      if (host) { rs.ready.h = !rs.ready.h; this.pushRoles(); } else this.net.send({ t: 'rready', v: !rs.ready.g });
    };
    $('#back', el).onclick = () => { this.net.send({ t: 'rcancel' }); this.showHub(); };
  },

  // ---------- Запуск игры ----------
  startGame(id, seed, assign) {
    const def = GAMES[id];
    if (!def) return;
    this.closeModal();
    this.stopGame();
    this.setUI(null);
    this.removeBar();
    this.screen = 'game';
    this.gameDef = def;
    this.curStart = { t: 'start', game: id, seed, assign };
    document.body.classList.add('playing');
    document.body.classList.toggle('landscape', !!def.landscape);
    document.body.classList.remove('rot-skip');
    const canvas = $('#game');
    this.gui.innerHTML = '';
    const back = h('<button class="iconbtn g-back" title="В хаб">←</button>');
    back.onclick = () => this.modal({
      title: 'Вернуться в хаб?', text: 'Игра закончится для вас обоих.',
      buttons: [{ label: 'Да, в хаб', onClick: () => { this.net.send({ t: 'exit' }); this.stopGame(); this.showHub(); } }, { label: 'Остаться', ghost: true }],
    });
    this.gui.appendChild(back);
    const host = this.net.isHost;
    const myIdx = host ? assign : 1 - assign;
    const ctx = {
      canvas, ui: this.gui, isHost: host, seed,
      role: def.roles ? def.roles[myIdx].id : null,
      peerRole: def.roles ? def.roles[1 - myIdx].id : null,
      me: this.me, peer: this.peer || { name: 'Друг', touch: false },
      send: (d) => this.net.send({ t: 'g', d }),
      toast: (s, ms) => this.toast(s, ms),
      modal: (o) => this.modal(o),
      exit: () => { this.net.send({ t: 'exit' }); this.stopGame(); this.showHub(); },
      loop: (fn) => this.addLoop(fn),
    };
    try { this.game = def.create(ctx); }
    catch (e) { console.error(e); this.toast('Ошибка запуска игры 😿'); this.stopGame(); this.showHub(); }
  },

  addLoop(fn) {
    const L = { alive: true, t: 0 };
    let last = performance.now(), errs = 0;
    const step = (now) => {
      if (!L.alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; L.t += dt;
      try { fn(dt, L.t); } catch (e) { if (errs++ < 3) console.error(e); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    this.loops.push(L);
    return L;
  },

  stopGame() {
    this.loops.forEach((l) => (l.alive = false)); this.loops = [];
    if (this.game && this.game.destroy) { try { this.game.destroy(); } catch (e) { console.error(e); } }
    this.game = null; this.gameDef = null; this.curStart = null;
    this.showLost(false);
    this.gui.innerHTML = '';
    document.body.classList.remove('playing', 'landscape');
    const c = $('#game');
    // новый холст, чтобы старые обработчики событий не мешали
    const nc = c.cloneNode(false); c.replaceWith(nc);
  },

  // плашка «связь прервалась» поверх игры
  showLost(on) {
    clearTimeout(this._lostT);
    const old = $('#lostOverlay'); if (old) old.remove();
    if (!on) return;
    const el = h(`<div id="lostOverlay" class="modal-back" style="z-index:40"><div class="panel" style="text-align:center;max-width:380px">
      <div class="orbit"><i></i><i></i></div>
      <h2>Связь прервалась</h2><p>${this.net.isHost ? 'Ждём, когда второй игрок вернётся — игра продолжится с того же места.' : 'Переподключаемся… Игра продолжится с того же места.'}</p>
      <button class="btn ghost" id="lostHub">Выйти в хаб</button></div></div>`);
    $('#lostHub', el).onclick = () => { this.stopGame(); this.showHub(); };
    document.body.appendChild(el);
    this._lostT = setTimeout(() => { if (this.game && !this.net.connected) { this.stopGame(); this.showHub(); this.toast('Не удалось переподключиться за 2 минуты'); } }, 120000);
  },

  // ---------- Уведомления и модальные окна ----------
  toast(html, ms = 2800) {
    const t = h(`<div class="toast">${html}</div>`);
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  },
  modal({ title, text, buttons = [] }) {
    this.closeModal();
    const back = h(`<div class="modal-back"><div class="panel"><h2>${title}</h2><p>${text || ''}</p><div class="mbtns"></div></div></div>`);
    const wrap = $('.mbtns', back);
    buttons.forEach((b) => {
      const el = h(`<button class="btn ${b.ghost ? 'ghost' : ''}">${b.label}</button>`);
      el.onclick = () => { SFX.play('click'); this.closeModal(); b.onClick && b.onClick(); };
      wrap.appendChild(el);
    });
    document.body.appendChild(back);
    this._modal = back;
    return () => this.closeModal();
  },
  closeModal() { if (this._modal) { this._modal.remove(); this._modal = null; } },
};

// ---------- Рисунок парящего острова для хаба ----------
const ISLAND_ROCK = [[-1, 0], [-0.88, 0.22], [-0.7, 0.42], [-0.55, 0.62], [-0.32, 0.78], [-0.18, 1.08], [-0.02, 1.38], [0.12, 1.05], [0.3, 0.86], [0.5, 0.66], [0.68, 0.46], [0.86, 0.24], [1, 0]];
const ISLAND_TOP = {
  constellation: ['#a58bff', '#5a3fb0'], lighthouse: ['#f1d9a4', '#c49a5c'], keys: ['#6cc9b4', '#2f7f78'], garden: ['#86e39a', '#3b9a5e'], cards: ['#f3c76b', '#b0782c'],
  bomb: ['#f2a07a', '#a3453a'], starfall: ['#9fb8ff', '#4a5cc0'], usquiz: ['#ffb3d1', '#c0507e'],
  islands: ['#9fe7c4', '#3f9a7a'],
  house: ['#5a5048', '#1e1a16'],
  maze: ['#8a7aa8', '#3d3258'], cats: ['#ffcf9a', '#c9783a'], lights: ['#ffe9a8', '#5a6ad6'],
};

function drawIsland(g, x, y, r, t, id, hover, color) {
  y += Math.sin(t * 1.2 + x * 0.01) * r * 0.06;
  const s = hover ? 1.06 : 1;
  g.save();
  g.translate(x, y); g.scale(s, s);
  g.globalCompositeOperation = 'lighter';
  Glow.draw(g, 0, r * 0.3, r * 2.1, color, hover ? 0.45 : 0.22);
  g.globalCompositeOperation = 'source-over';
  // скала
  const rg = g.createLinearGradient(0, 0, 0, r * 1.4);
  rg.addColorStop(0, '#5a4682'); rg.addColorStop(0.5, '#33264f'); rg.addColorStop(1, '#140f26');
  g.fillStyle = rg; g.beginPath();
  ISLAND_ROCK.forEach(([px, py], i) => (i ? g.lineTo(px * r, py * r) : g.moveTo(px * r, py * r)));
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.5;
  for (let k = 1; k <= 3; k++) { g.beginPath(); g.moveTo(-r * (1 - k * 0.22), r * k * 0.22); g.quadraticCurveTo(0, r * k * 0.3, r * (1 - k * 0.2), r * k * 0.2); g.stroke(); }
  // кристаллы снизу
  g.globalCompositeOperation = 'lighter';
  Glow.draw(g, -r * 0.02, r * 1.34, r * 0.25, color, 0.7 + Math.sin(t * 3 + x) * 0.3);
  g.globalCompositeOperation = 'source-over';
  // верх
  const [c1, c2] = ISLAND_TOP[id];
  const tg = g.createLinearGradient(0, -r * 0.3, 0, r * 0.3);
  tg.addColorStop(0, c1); tg.addColorStop(1, c2);
  g.fillStyle = tg; g.beginPath(); g.ellipse(0, 0, r, r * 0.3, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5;
  g.beginPath(); g.ellipse(0, 0, r, r * 0.3, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  MINI[id] && MINI[id](g, r, t, color);
  g.restore();
}

const MINI = {
  constellation(g, r, t, color) {
    const P = [[-0.55, -0.9], [-0.25, -1.25], [0.08, -1.0], [0.35, -1.35], [0.6, -0.95], [0.15, -0.6]];
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(200,180,255,${0.45 + Math.sin(t * 2) * 0.2})`; g.lineWidth = 1.5;
    g.beginPath(); P.forEach(([px, py], i) => (i ? g.lineTo(px * r, py * r) : g.moveTo(px * r, py * r))); g.lineTo(P[2][0] * r, P[2][1] * r); g.stroke();
    P.forEach(([px, py], i) => { Glow.draw(g, px * r, py * r, r * 0.18, i % 2 ? '#ffd9f2' : '#cbbcff', 0.6 + Math.sin(t * 3 + i) * 0.4); });
    g.globalCompositeOperation = 'source-over';
    // кристалл
    g.fillStyle = '#d8ccff'; g.beginPath(); g.moveTo(0, -r * 0.45); g.lineTo(r * 0.12, -r * 0.1); g.lineTo(0, r * 0.05); g.lineTo(-r * 0.12, -r * 0.1); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,90,220,0.6)'; g.beginPath(); g.moveTo(0, -r * 0.45); g.lineTo(r * 0.12, -r * 0.1); g.lineTo(0, r * 0.05); g.closePath(); g.fill();
  },
  lighthouse(g, r, t) {
    const a = t * 1.1;
    g.globalCompositeOperation = 'lighter';
    const lx = 0, ly = -r * 0.98;
    for (const d of [0, Math.PI]) {
      const ang = a + d, sp = 0.22, L = r * 1.8;
      const gr = g.createRadialGradient(lx, ly, 0, lx, ly, L);
      gr.addColorStop(0, 'rgba(255,240,180,0.55)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(lx, ly);
      g.lineTo(lx + Math.cos(ang - sp) * L, ly + Math.sin(ang - sp) * L * 0.45); g.lineTo(lx + Math.cos(ang + sp) * L, ly + Math.sin(ang + sp) * L * 0.45); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // башня
    const bw = r * 0.2, tw = r * 0.13, base = -r * 0.05, top = -r * 0.85;
    g.save(); g.beginPath(); g.moveTo(-bw, base); g.lineTo(-tw, top); g.lineTo(tw, top); g.lineTo(bw, base); g.closePath(); g.clip();
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f4f1ea' : '#e0505b'; g.fillRect(-bw, base - (i + 1) * (base - top) / 5, bw * 2, (base - top) / 5 + 1); }
    g.restore();
    g.fillStyle = '#2b2440'; g.fillRect(-tw * 1.2, top - r * 0.04, tw * 2.4, r * 0.05);
    g.fillStyle = '#fff6c9'; g.fillRect(-tw * 0.8, top - r * 0.2, tw * 1.6, r * 0.16);
    g.fillStyle = '#e0505b'; g.beginPath(); g.moveTo(-tw, top - r * 0.2); g.lineTo(0, top - r * 0.34); g.lineTo(tw, top - r * 0.2); g.fill();
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, lx, ly, r * 0.5, '#ffe9a0', 0.9); g.globalCompositeOperation = 'source-over';
  },
  keys(g, r, t, color) {
    // арка храма
    g.fillStyle = '#3d5d6b';
    g.fillRect(-r * 0.45, -r * 0.75, r * 0.18, r * 0.72); g.fillRect(r * 0.27, -r * 0.75, r * 0.18, r * 0.72);
    g.beginPath(); g.arc(0, -r * 0.75, r * 0.45, Math.PI, 0); g.lineTo(r * 0.27, -r * 0.75); g.arc(0, -r * 0.75, r * 0.27, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = '#1a2b38'; g.beginPath(); g.moveTo(-r * 0.27, -r * 0.03); g.lineTo(-r * 0.27, -r * 0.75); g.arc(0, -r * 0.75, r * 0.27, Math.PI, 0); g.lineTo(r * 0.27, -r * 0.03); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,230,255,0.25)'; g.lineWidth = 1; g.strokeRect(-r * 0.45, -r * 0.75, r * 0.18, r * 0.72); g.strokeRect(r * 0.27, -r * 0.75, r * 0.18, r * 0.72);
    g.globalCompositeOperation = 'lighter';
    const p = 0.6 + Math.sin(t * 2.5) * 0.4;
    Glow.draw(g, 0, -r * 0.55, r * 0.5, color, p);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#d6fbff'; g.beginPath(); g.arc(0, -r * 0.6, r * 0.07, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-r * 0.04, -r * 0.58); g.lineTo(-r * 0.07, -r * 0.4); g.lineTo(r * 0.07, -r * 0.4); g.lineTo(r * 0.04, -r * 0.58); g.fill();
    for (let i = 0; i < 2; i++) {
      const a = t * 0.9 + i * Math.PI;
      g.save(); g.translate(Math.cos(a) * r * 0.75, -r * 0.95 + Math.sin(a) * r * 0.18); g.rotate(a * 0.6);
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, r * 0.22, i ? '#ffd27a' : '#8fe3ff', 0.7); g.globalCompositeOperation = 'source-over';
      drawGlyph(g, 'key', 0, 0, r * 0.3, i ? '#ffe7a6' : '#d8f6ff', 2.2);
      g.restore();
    }
  },
  garden(g, r, t) {
    g.strokeStyle = '#6b4a3a'; g.lineWidth = r * 0.09; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r * 0.05, 0); g.quadraticCurveTo(-r * 0.08, -r * 0.35, r * 0.02, -r * 0.62); g.stroke();
    const blobs = [[-0.3, -0.75, 0.3], [0.25, -0.8, 0.32], [0, -1.05, 0.34], [-0.05, -0.7, 0.28]];
    blobs.forEach(([bx, by, br], i) => {
      const gr = g.createRadialGradient(bx * r - br * r * 0.3, by * r - br * r * 0.3, 0, bx * r, by * r, br * r);
      gr.addColorStop(0, '#9af0a4'); gr.addColorStop(1, '#2e8a55');
      g.fillStyle = gr; g.beginPath(); g.arc(bx * r + Math.sin(t + i) * r * 0.01, by * r, br * r, 0, TAU); g.fill();
    });
    g.globalCompositeOperation = 'lighter';
    [[-0.3, -0.85], [0.2, -0.95], [0.05, -0.7], [0.32, -0.7], [-0.15, -1.1]].forEach(([fx, fy], i) => Glow.draw(g, fx * r, fy * r, r * 0.12, i % 2 ? '#ff9ccd' : '#ffd27a', 0.7 + Math.sin(t * 2 + i) * 0.3));
    for (let i = 0; i < 4; i++) { const a = t * 0.7 + i * 1.6; Glow.draw(g, Math.cos(a) * r * 0.85, -r * 0.6 + Math.sin(a * 1.3) * r * 0.35, r * 0.07, '#e8ff9a', 0.8); }
    g.globalCompositeOperation = 'source-over';
    // маленькие цветы
    [[-0.6, -0.04, '#ffb3d1'], [0.55, 0.02, '#c9b8ff'], [-0.35, 0.1, '#fff2a8'], [0.7, -0.08, '#ffb3d1']].forEach(([fx, fy, c]) => { g.fillStyle = c; g.beginPath(); g.arc(fx * r, fy * r, r * 0.04, 0, TAU); g.fill(); });
  },
  cards(g, r, t) {
    const card = (ang, ox, glyph, c1, c2, gc) => {
      g.save(); g.translate(ox * r, -r * 0.42); g.rotate(ang + Math.sin(t * 1.4 + ox * 5) * 0.04);
      const w = r * 0.42, hh = r * 0.62;
      const gr = g.createLinearGradient(0, -hh / 2, 0, hh / 2); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; roundRect(g, -w / 2, -hh / 2, w, hh, r * 0.05); g.fill();
      g.strokeStyle = '#ffe2a0'; g.lineWidth = 2; roundRect(g, -w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6, r * 0.04); g.stroke();
      g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, 0, r * 0.3, gc, 0.6); g.globalCompositeOperation = 'source-over';
      drawGlyph(g, glyph, 0, 0, r * 0.26, '#fff6dc', 2);
      g.restore();
    };
    card(-0.28, -0.2, 'moon', '#3f3a8f', '#1d1a4a', '#8fa8ff');
    card(0.24, 0.2, 'sun', '#b5562f', '#5e2318', '#ffb35c');
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; Glow.draw(g, Math.sin(i * 2.1) * r * 0.5, -r * 0.6 - k * r * 0.8, r * 0.06, '#ffe7a6', Math.sin(k * Math.PI)); }
    g.globalCompositeOperation = 'source-over';
  },
  bomb(g, r, t) {
    // круглая бомба с горящим фитилём
    const cx = 0, cy = -r * 0.5, R = r * 0.42;
    const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    gr.addColorStop(0, '#6b6488'); gr.addColorStop(1, '#17141f');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.fillStyle = '#2b2636'; g.fillRect(cx - R * 0.25, cy - R * 1.12, R * 0.5, R * 0.25);
    g.strokeStyle = '#c9a77a'; g.lineWidth = r * 0.04; g.lineCap = 'round';
    const fx = cx + R * 0.55 + Math.sin(t * 2) * r * 0.03, fy = cy - R * 1.45;
    g.beginPath(); g.moveTo(cx, cy - R * 1.1); g.quadraticCurveTo(cx + R * 0.1, cy - R * 1.5, fx, fy); g.stroke();
    // табло таймера
    g.fillStyle = '#0b0a10'; roundRect(g, cx - R * 0.55, cy - R * 0.1, R * 1.1, R * 0.45, R * 0.08); g.fill();
    g.fillStyle = Math.floor(t * 2) % 2 ? '#ff5c5c' : '#ff8a6e'; g.font = `700 ${R * 0.36}px "Courier New", monospace`; g.textAlign = 'center';
    g.fillText('0:0' + (9 - Math.floor(t) % 10), cx, cy + R * 0.25);
    g.globalCompositeOperation = 'lighter';
    Glow.draw(g, fx, fy, r * 0.32, '#ffb347', 0.8 + Math.sin(t * 20) * 0.2);
    for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i / 3) % 1; Glow.draw(g, fx + Math.sin(i * 2 + t * 3) * r * 0.15 * k, fy - k * r * 0.3, r * 0.06, '#ffe27a', 1 - k); }
    Glow.draw(g, cx - R * 0.35, cy - R * 0.4, R * 0.5, '#ffffff', 0.15);
    g.globalCompositeOperation = 'source-over';
  },
  starfall(g, r, t) {
    // башенка из светящихся блоков и падающая фигура
    const c = r * 0.2;
    const cells = [[-2, 0, '#ff8fc3'], [-1, 0, '#ff8fc3'], [0, 0, '#6bd6ff'], [1, 0, '#6bd6ff'], [-1, -1, '#ffd36b'], [0, -1, '#8f9dff'], [1, -1, '#8f9dff'], [0, -2, '#8f9dff'], [-2, -1, '#ffd36b']];
    const box = (x, y, col) => {
      const gr = g.createLinearGradient(x, y, x + c, y + c); gr.addColorStop(0, mixColor(col, '#ffffff', 0.4)); gr.addColorStop(1, mixColor(col, '#1a1030', 0.3));
      g.fillStyle = gr; roundRect(g, x + 1, y + 1, c - 2, c - 2, c * 0.2); g.fill();
    };
    cells.forEach(([x, y, col]) => box(x * c, y * c - c * 1.1, col));
    const k = (t * 0.45) % 1, fy = -r * 1.5 + k * r * 0.55;
    g.globalAlpha = Math.min(1, (1 - k) * 4);
    [[0, 0], [1, 0], [1, -1], [2, -1]].forEach(([x, y]) => box((x - 1) * c + c * 0.5, fy + y * c, '#ffb3e0'));
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    Glow.draw(g, 0, -r * 0.55, r * 0.7, '#8fb8ff', 0.3);
    const sx = r * 0.6 - ((t * 0.7) % 1) * r * 1.2, sy = -r * 1.35 + ((t * 0.7) % 1) * r * 0.4;
    Glow.draw(g, sx, sy, r * 0.12, '#fff3c4', 0.9);
    g.globalCompositeOperation = 'source-over';
  },
  usquiz(g, r, t) {
    // две звезды кружат вокруг сердца
    const cy = -r * 0.6;
    const s = r * 0.24 * (1 + Math.sin(t * 4) * 0.06);
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, 0, cy, r * 0.65, '#ff8fb8', 0.45); g.globalCompositeOperation = 'source-over';
    const hg = g.createRadialGradient(-s * 0.4, cy - s * 0.4, 1, 0, cy, s * 1.4); hg.addColorStop(0, '#ffd6e8'); hg.addColorStop(1, '#e0457e');
    g.fillStyle = hg; g.beginPath(); g.moveTo(0, cy + s * 0.95);
    g.bezierCurveTo(-s * 1.4, cy + s * 0.1, -s * 1.05, cy - s * 1.05, 0, cy - s * 0.4);
    g.bezierCurveTo(s * 1.05, cy - s * 1.05, s * 1.4, cy + s * 0.1, 0, cy + s * 0.95); g.fill();
    const a = t * 1.3;
    g.globalCompositeOperation = 'lighter';
    for (const [d, col] of [[0, '#ffb36b'], [Math.PI, '#8fb8ff']]) {
      const x = Math.cos(a + d) * r * 0.62, y = cy + Math.sin(a + d) * r * 0.22;
      Glow.draw(g, x, y, r * 0.22, col, 0.9);
    }
    g.globalCompositeOperation = 'source-over';
  },
  maze(g, r, t) {
    // каменные стенки лабиринта и огонёк
    g.fillStyle = '#4a3f66';
    const W = [[-0.7, -0.5, 0.15, 0.5], [-0.7, -0.5, 0.9, 0.12], [0.45, -0.5, 0.15, 0.55], [-0.25, -0.2, 0.15, 0.3], [-0.25, -0.2, 0.5, 0.12]];
    for (const [x, y, w, h] of W) { g.fillRect(x * r, y * r - r * 0.25, w * r, h * r); g.fillStyle = '#5c4f80'; g.fillRect(x * r, y * r - r * 0.25, w * r, r * 0.04); g.fillStyle = '#4a3f66'; }
    const fx = Math.cos(t * 0.8) * r * 0.25, fy = -r * 0.62 + Math.sin(t * 1.6) * r * 0.08;
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, fx, fy, r * 0.6, '#ffc46b', 0.9); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(fx, fy, r * 0.06, 0, TAU); g.fill();
    g.globalAlpha = 0.5 + Math.sin(t * 2) * 0.2; g.fillStyle = '#e6dcff';
    const gx = r * 0.55, gy = -r * 1.05 + Math.sin(t * 2.5) * r * 0.05;
    g.beginPath(); g.arc(gx, gy, r * 0.13, Math.PI, 0); g.lineTo(gx + r * 0.13, gy + r * 0.15); g.lineTo(gx - r * 0.13, gy + r * 0.15); g.fill(); g.globalAlpha = 1;
  },
  cats(g, r, t) {
    // две карты и кошачьи ушки
    const card = (ang, ox, col) => {
      g.save(); g.translate(ox * r, -r * 0.5); g.rotate(ang + Math.sin(t * 1.3 + ox * 4) * 0.04);
      const w = r * 0.45, hh = r * 0.64;
      g.fillStyle = col; roundRect(g, -w / 2, -hh / 2, w, hh, r * 0.06); g.fill();
      g.strokeStyle = '#fff3c4'; g.lineWidth = 2; roundRect(g, -w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6, r * 0.05); g.stroke();
      g.fillStyle = '#f4c99d'; g.beginPath(); g.arc(0, hh * 0.05, w * 0.28, 0, TAU); g.fill();
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * w * 0.26, -hh * 0.02); g.lineTo(sx * w * 0.2, -hh * 0.22); g.lineTo(sx * w * 0.06, -hh * 0.12); g.fill(); }
      g.fillStyle = '#2a1a30'; g.beginPath(); g.arc(-w * 0.1, hh * 0.04, w * 0.04, 0, TAU); g.arc(w * 0.1, hh * 0.04, w * 0.04, 0, TAU); g.fill();
      g.restore();
    };
    card(-0.3, -0.22, '#8a6fcb'); card(0.25, 0.22, '#e8a15a');
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; Glow.draw(g, Math.sin(i * 2.3) * r * 0.5, -r * 0.7 - k * r * 0.7, r * 0.07, '#ffd27a', Math.sin(k * Math.PI)); }
    g.globalCompositeOperation = 'source-over';
  },
  lights(g, r, t) {
    // солнце и луна, луч между ними
    const a = Math.sin(t * 0.7) * 0.1;
    const sx = -r * 0.45, mx = r * 0.45, y = -r * 0.75;
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = r * 0.05;
    g.beginPath(); g.moveTo(sx, y); g.lineTo(0, y + r * 0.35 + a * r); g.lineTo(mx, y); g.stroke();
    Glow.draw(g, sx, y, r * 0.55, '#ffcf6b', 0.9); Glow.draw(g, mx, y, r * 0.5, '#9fc4ff', 0.9);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(sx, y, r * 0.17, 0, TAU); g.fill();
    g.fillStyle = '#e6ecff'; g.beginPath(); g.arc(mx, y, r * 0.16, Math.PI * 0.3, Math.PI * 1.7); g.arc(mx + r * 0.08, y, r * 0.13, Math.PI * 1.55, Math.PI * 0.45, true); g.fill();
    g.save(); g.translate(0, y + r * 0.35 + a * r); g.rotate(Math.PI / 4); g.fillStyle = '#f4f8ff'; g.fillRect(-r * 0.03, -r * 0.14, r * 0.06, r * 0.28); g.restore();
  },
  islands(g, r, t) {
    // маленький островок с деревцем и двумя огоньками
    g.fillStyle = '#9a6a48'; g.beginPath(); g.moveTo(-r * 0.45, -r * 0.55); g.lineTo(r * 0.45, -r * 0.55); g.lineTo(0, -r * 0.1); g.fill();
    g.fillStyle = '#86de8f'; g.beginPath(); g.ellipse(0, -r * 0.58, r * 0.48, r * 0.14, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a5236'; g.fillRect(-r * 0.04, -r * 0.95, r * 0.08, r * 0.38);
    g.fillStyle = '#5fc27a'; g.beginPath(); g.arc(0, -r * 1.02, r * 0.2, 0, TAU); g.arc(-r * 0.12, -r * 0.9, r * 0.14, 0, TAU); g.arc(r * 0.13, -r * 0.92, r * 0.14, 0, TAU); g.fill();
    const a = t * 1.4;
    g.globalCompositeOperation = 'lighter';
    for (const [d, c] of [[0, '#ffb347'], [Math.PI, '#8fb0ff']]) Glow.draw(g, Math.cos(a + d) * r * 0.7, -r * 0.75 + Math.sin(a + d) * r * 0.18, r * 0.3, c, 0.95);
    g.globalCompositeOperation = 'source-over';
  },
  house(g, r, t) {
    // мрачный дом в тумане с одним горящим окном
    g.fillStyle = '#0c0a0c';
    g.fillRect(-r * 0.42, -r * 0.62, r * 0.84, r * 0.6);
    g.beginPath(); g.moveTo(-r * 0.5, -r * 0.62); g.lineTo(0, -r * 1.05); g.lineTo(r * 0.5, -r * 0.62); g.fill();
    g.fillRect(r * 0.18, -r * 1.12, r * 0.08, r * 0.3);
    const flick = 0.75 + Math.sin(t * 9) * 0.1 + (Math.random() < 0.03 ? -0.5 : 0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const on = i === 1 && j === 0; g.fillStyle = on ? `rgba(220,170,90,${flick})` : '#1a1a20'; g.fillRect(-r * 0.32 + i * r * 0.24, -r * 0.54 + j * r * 0.24, r * 0.12, r * 0.14); }
    g.globalCompositeOperation = 'lighter'; Glow.draw(g, -r * 0.02, -r * 0.47, r * 0.35, '#ffb060', 0.35 * flick); g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) { const k = (t * 0.15 + i / 3) % 1; g.fillStyle = `rgba(180,190,190,${0.18 * Math.sin(k * Math.PI)})`; g.beginPath(); g.ellipse(-r + k * r * 2, -r * 0.15 - i * r * 0.12, r * 0.5, r * 0.08, 0, 0, TAU); g.fill(); }
  },
};

addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window._installPrompt = e; });
addEventListener('DOMContentLoaded', () => App.init());
