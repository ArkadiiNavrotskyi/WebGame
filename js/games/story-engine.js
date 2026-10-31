'use strict';
// Движок мрачных 3D-историй на двоих (по образцу «Вереска»): комнаты с фонарём, осмотр, инвентарь,
// записи, подсказки, передача предметов, сохранение и финал вдвоём. Каждая история — свой файл с StoryEngine.define(story).
window.StoryEngine = (() => {
  const HA = window.HouseArt;
  let threeP = null;
  const loadThree = () => { if (window.THREE) return Promise.resolve(); if (!threeP) threeP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = `lib/three.min.js?v=${CONFIG.version}`; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); return threeP; };

  // Общие действия: взять предмет, передача предметов между игроками.
  function baseAct(story) {
    const has = (S, who, it) => S.inv[who].includes(it);
    const rm = (S, who, it) => { const i = S.inv[who].indexOf(it); if (i >= 0) S.inv[who].splice(i, 1); };
    const need = story.dw.need;
    return {
      take(S, who, it) { const T = story.TAKE; if (!T[it] || S.f['t_' + it] || !T[it](S)) return null; S.f['t_' + it] = 1; S.inv[who].push(it); return { a: 'take', who, it }; },
      dw_put(S, who, it) { if (need && !S.f[need]) return null; if (S.dw.pos !== who || !has(S, who, it)) return null; rm(S, who, it); S.dw.items.push(it); return { a: 'dwput', who }; },
      dw_take(S, who, it) { if (S.dw.pos !== who || !S.dw.items.includes(it)) return null; S.dw.items.splice(S.dw.items.indexOf(it), 1); S.inv[who].push(it); return { a: 'take', who, it }; },
      dw_send(S, who) { if ((need && !S.f[need]) || S.dw.pos !== who) return null; S.dw.pos = who === 'up' ? 'down' : 'up'; return { a: 'dw', to: S.dw.pos, n: S.dw.items.length }; },
      dw_call(S, who) { if ((need && !S.f[need]) || S.dw.pos === who) return null; S.dw.pos = who; return { a: 'dw', to: who, n: S.dw.items.length, called: true }; },
      insert(S, who) { const F = story.final, k = F.key[who], f = F.flag[who]; if (S.f[f] || !has(S, who, k)) return null; rm(S, who, k); S.f[f] = 1; return { a: 'ok', who, msg: 'Ключ вошёл в скважину до упора.', snd: 'click' }; },
    };
  }

  function define(story) {
    const { ITEMS, DOCS, IMG, ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS } = story;
    const CH_NAMES = story.chapters, HINTS = story.HINTS;
    const ACT = Object.assign(baseAct(story), story.ACT);
    const SAVE = story.id + '_save', NOTES = story.id + '_notes';
    if (!story.finalReady) story.finalReady = (S) => S.f[story.final.flag.up] && S.f[story.final.flag.down];
    GAMES[story.id] = {
      id: story.id, title: story.title, icon: story.icon, color: story.color, tagline: story.tagline, roles: story.roles, rules: story.rules,
      info() { const s = Store.get(SAVE, null); return s && s.f && s.f.final ? 'история раскрыта ✦' : s && s.ch ? `глава ${s.ch} из ${CH_NAMES.length - 1} · сохранено` : story.infoDefault || 'история · 3D'; },
      create(ctx) { return new House(ctx); },
    };

    class House {
      constructor(ctx) {
        this.ctx = ctx; this.role = ctx.role; this.other = this.role === 'up' ? 'down' : 'up';
        this.names = { [this.role]: ctx.me.name, [this.other]: ctx.peer.name };
        this.S = null; this.rooms = {}; this.room = null; this.peerRoom = null;
        this.yaw = 0; this.pitch = 0; this.tyaw = 0; this.tpitch = 0; this.fov = 70;
        this.notes = new Set(Store.get(NOTES, [])); this.ps = {}; this.panelFn = null;
        this.ready = false; this.turnT = {}; this.iconCache = {};
        this.buildUI();
        loadThree().then(() => this.init3d()).catch(() => { this.loadEl.innerHTML = 'Не удалось загрузить 3D 😿<br>Проверь интернет и зайди снова'; });
        if (ctx.isHost) { this.S = this.menuState(); this.broadcast(); }
        ctx.loop((dt, t) => this.frame(dt, t));
      }
      nm(r) { return esc(this.names[r] || (r === 'up' ? 'Наверху' : 'Внизу')); }
      has(it) { return this.S && this.S.inv && this.S.inv[this.role].includes(it); }

      // ================= Хост =================
      broadcast() {
        const S = this.S;
        if (S.phase === 'play' || S.phase === 'outro' || S.phase === 'done') Store.set(SAVE, S);
        this.ctx.send({ a: 'S', S }); this.apply(S);
      }
      event(e) { this.ctx.send({ a: 'ev', e }); this.onEvent(e); }
      menuState() { const sv = Store.get(SAVE, null); return { phase: 'menu', saveCh: sv && sv.f && !sv.f.final && sv.phase !== 'done' ? sv.ch || 1 : 0 }; }
      fresh() { return { phase: 'intro', page: 0, ch: 1, f: {}, inv: { up: [], down: [] }, dw: { pos: 'up', items: [] } }; }
      hostAct(who, id, v) {
        const S = this.S; if (!S || S.phase !== 'play') return;
        if (id === 'turn') return this.hostTurn(who);
        const fn = ACT[id]; if (!fn) return;
        const ev = fn(S, who, v); if (!ev) return;
        const ch = story.chapterOf(S);
        this.event(ev);
        if (ch > S.ch) { S.ch = ch; this.event({ a: 'chapter', n: ch }); }
        this.broadcast();
      }
      hostTurn(who) {
        const S = this.S; if (!story.finalReady(S) || S.f.final) return;
        const now = Date.now(), other = who === 'up' ? 'down' : 'up';
        this.turnT[who] = now;
        if (this.turnT[other] && now - this.turnT[other] < 2600) { S.f.final = 1; S.phase = 'outro'; S.page = 0; this.event({ a: 'final' }); this.broadcast(); return; }
        this.event({ a: 'turned', who });
        setTimeout(() => { if (!S.f.final && this.turnT[who] === now) { this.turnT[who] = 0; this.event({ a: 'turnfail' }); } }, 2700);
      }

      // ================= Сообщения =================
      onMsg(d) {
        const host = this.ctx.isHost, S = this.S;
        switch (d.a) {
          case 'S': this.apply(d.S); break;
          case 'ev': this.onEvent(d.e); break;
          case 'room': this.peerRoom = d.r; this.updateHud(); break;
          case 'act': if (host) this.hostAct(d.who, d.id, d.v); break;
          case 'new': if (host && (S.phase === 'menu' || S.phase === 'done')) { this.S = this.fresh(); this.broadcast(); } break;
          case 'cont': if (host && S.phase === 'menu') { const sv = Store.get(SAVE, null); if (sv && sv.f) { this.S = sv; if (sv.phase === 'done' || sv.f.final) { this.S = this.fresh(); } else this.S.phase = 'play'; this.broadcast(); } } break;
          case 'next':
            if (!host) break;
            if (S.phase === 'intro') { if (S.page + 1 < INTRO.length) S.page++; else { S.phase = 'play'; this.event({ a: 'chapter', n: 1 }); } this.broadcast(); }
            else if (S.phase === 'outro') { if (S.page + 1 < OUTRO.length) S.page++; else S.phase = 'done'; this.broadcast(); }
            break;
          case 'menu': if (host) { this.S = this.menuState(); this.broadcast(); } break;
        }
      }
      act(id, v) { const m = { a: 'act', who: this.role, id, v }; if (this.ctx.isHost) this.onMsg(m); else this.ctx.send(m); }
      toHost(a) { if (this.ctx.isHost) this.onMsg({ a }); else this.ctx.send({ a }); }

      apply(S) {
        const prevPhase = this._ph, prevPage = this._pg;
        this.S = S; this._ph = S.phase; this._pg = S.page;
        if (S.phase !== prevPhase || S.page !== prevPage) this.onPhase(prevPhase);
        if (S.phase === 'play' && this.ready) {
          if (!this.room) this.go(AREA[this.role][0], true);
          for (const id in this.rooms) this.updateRoom(id);
        }
        const ph = this.panelHot;
        if (this.panelFn && ph && ph.fn === this.panelFn && ph.f !== JSON.stringify(S.f) && S.phase === 'play') this.runHot(ph.id, ph.obj, true);
        else if (this.panelFn) this.renderPanel();
        this.renderInv(); this.updateHud();
      }
      onEvent(e) {
        const me = e.who === this.role;
        switch (e.a) {
          case 'wrong': if (me) { this.snd('wrong'); this.shake(); this.ps.seq = []; this.renderPanelSoon(); } break;
          case 'ok': if (me || e.who == null) { this.snd(e.snd || 'open'); if (e.msg && me) this.toast(e.msg); } break;
          case 'take': if (me) { this.snd('take'); this.toast(`Взято: ${ITEMS[e.it].n}`); } break;
          case 'dw': this.snd('rope'); if (e.to === this.role) { setTimeout(() => this.snd('bell'), 900); this.toast(e.called ? story.dw.called : `🔔 ${story.dw.name} — пришло${e.n ? ` (${e.n} предм.)` : ''}`, 3500); } break;
          case 'dwput': if (me) this.snd('take'); break;
          case 'chapter': this.chapterCard(e.n); break;
          case 'turned': if (!me) this.toast(`${this.nm(e.who)} повернул(а) ключ — но одной стороны мало. Вместе! На счёт три!`, 3000); else this.toast('Ключ поддался… и упёрся. С той стороны тоже должны повернуть.', 3000); this.snd('click'); break;
          case 'turnfail': this.toast('Ключи с щелчком вернулись назад. Нужно одновременно: «три, два, один — сейчас!»', 4000); this.snd('wrong'); break;
          case 'final': this.snd('sting2'); break;
          default: story.onEvent && story.onEvent(this, e, me);
        }
      }

      // ================= Фазы =================
      onPhase(prev) {
        const S = this.S;
        this.overlay(null);
        if (S.phase !== 'play') this.closePanel();
        this.ui.classList.toggle('playing', S.phase === 'play');
        if (S.phase === 'menu') this.showMenu();
        if (S.phase === 'intro') { if (S.page === 0) { this.notes = new Set(); Store.set(NOTES, []); } this.showStory(INTRO, S.page, 'intro'); }
        if (S.phase === 'outro') { if (this.ready) { this.go(story.finalRoom, true); } this.showStory(OUTRO, S.page, 'outro'); }
        if (S.phase === 'done') this.showStory(OUTRO, OUTRO.length - 1, 'outro');
        if (S.phase === 'play' && prev !== 'play' && this.ready) { this.room = null; this.go(AREA[this.role][0], true); this.startAmbient(); }
      }
      overlay(html, cls = '') {
        const o = this.ui.querySelector('.hs-ov'); if (o) o.remove();
        if (!html) return null;
        const el = h(`<div class="hs-ov ${cls}">${html}</div>`);
        el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.toHost(b.dataset.a); }));
        this.ui.appendChild(el); return el;
      }
      showMenu() {
        const saveCh = this.S.saveCh || 0, canCont = saveCh > 0;
        const el = this.overlay(`<div class="hs-title">
          <canvas class="hs-art" width="900" height="420"></canvas>
          <div class="hs-logo">${story.title}</div>
          <div class="hs-sub">${story.sub}</div>
          <div class="hs-warn">${story.warn}</div>
          <div class="hs-role">${story.roleLabel[this.role]}</div>
          <div class="hs-btns">${canCont ? `<button class="hs-btn" data-a="cont">Продолжить · глава ${saveCh}</button>` : ''}
          <button class="hs-btn ${canCont ? 'ghost' : ''}" data-a="new">${canCont ? 'Начать заново' : story.enterLabel}</button></div>
          <div class="hs-note">Сохранение хранится у того, кто создал комнату.</div></div>`, 'menu');
        this.drawArt($('.hs-art', el), story.menuArt);
      }
      showStory(pages, i, kind) {
        const [art, txt] = pages[i];
        const fill = (s) => s.replace('{up}', this.nm('up')).replace('{down}', this.nm('down'));
        if (art === 'end') {
          this.overlay(`<div class="hs-title end"><canvas class="hs-art" width="900" height="420"></canvas>
            <div class="hs-logo">Конец</div><div class="hs-sub">${this.nm('up')} и ${this.nm('down')} ${story.endSub}</div>
            <div class="hs-final">${esc(CONFIG.finalMessage).replace(/\n/g, '<br>')}</div>
            <div class="hs-btns"><button class="hs-btn" data-a="new">Пройти ещё раз</button></div></div>`, 'menu');
          this.drawArt($('.hs-art', this.ui), story.endArt);
          this.stopAmbient();
          return;
        }
        const el = this.overlay(`<div class="hs-story"><canvas class="hs-art" width="900" height="420"></canvas>
          <div class="hs-stext"></div><div class="hs-srow"><span class="hs-dots">${pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>
          <button class="hs-btn small" data-a="next">${i + 1 < pages.length ? 'Дальше' : kind === 'intro' ? 'Войти ✦' : 'Дальше'}</button></div></div>`, 'story');
        this.drawArt($('.hs-art', el), art);
        this.type($('.hs-stext', el), fill(txt));
        if (kind === 'intro' && story.introSound && story.introSound[i]) this.snd(story.introSound[i]);
      }
      type(el, text) {
        let k = 0; clearInterval(this._typeT);
        this._typeT = setInterval(() => { k += 2; el.textContent = text.slice(0, k); if (k >= text.length) clearInterval(this._typeT); }, 28);
        el.onclick = () => { clearInterval(this._typeT); el.textContent = text; };
      }
      chapterCard(n) {
        const c = h(`<div class="hs-chapter"><div>${CH_NAMES[n]}</div></div>`);
        this.ui.appendChild(c); this.snd('sting');
        setTimeout(() => c.classList.add('out'), 3200); setTimeout(() => c.remove(), 4400);
      }
      drawArt(cv, key) {
        if (!cv) return;
        const g = cv.getContext('2d'), w = cv.width, hh = cv.height;
        const fog = () => { for (let i = 0; i < 9; i++) { const y = hh * (0.4 + Math.random() * 0.6), fx = Math.random() * w, gr = g.createRadialGradient(fx, y, 0, fx, y, w * 0.4); gr.addColorStop(0, 'rgba(150,165,160,0.18)'); gr.addColorStop(1, 'rgba(150,165,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); } };
        const sky = (a, b) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, hh); };
        const house = (x, y, s, lit) => {
          g.fillStyle = '#07080a';
          g.fillRect(x - s * 0.5, y - s * 0.55, s, s * 0.55); g.beginPath(); g.moveTo(x - s * 0.58, y - s * 0.55); g.lineTo(x, y - s * 0.95); g.lineTo(x + s * 0.58, y - s * 0.55); g.fill();
          g.fillRect(x + s * 0.2, y - s * 1.05, s * 0.08, s * 0.25); g.fillRect(x - s * 0.62, y - s * 0.7, s * 0.24, s * 0.7); g.beginPath(); g.moveTo(x - s * 0.66, y - s * 0.7); g.lineTo(x - s * 0.5, y - s * 0.9); g.lineTo(x - s * 0.34, y - s * 0.7); g.fill();
          for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const on = lit && (i + j * 3) % 4 === 1; g.fillStyle = on ? '#c9a05a' : '#14181a'; g.fillRect(x - s * 0.4 + i * s * 0.22, y - s * 0.48 + j * s * 0.22, s * 0.1, s * 0.13); }
        };
        story.art(g, w, hh, key, { fog, sky, house, HA });
        // зерно
        const id = g.getImageData(0, 0, w, hh), d = id.data;
        for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
        g.putImageData(id, 0, 0);
      }

      // ================= Интерфейс =================
      buildUI() {
        this.ui = h(`<div class="hs-root">
          <div class="hs-load" id="hsLoad"><div class="orbit"><i></i><i></i></div>Дом скрипит…</div>
          <div class="hs-grain"></div><div class="hs-vig"></div><div class="hs-fade"></div>
          <div class="hs-hud"><div class="hs-room" id="hsRoom"></div><div class="hs-peer" id="hsPeer"></div></div>
          <div class="hs-tools"><button class="hs-ib" id="hsMap" title="Комнаты">🚪</button><button class="hs-ib" id="hsNotes" title="Записи">📜</button><button class="hs-ib" id="hsHint" title="Подсказка">💡</button></div>
          <div class="hs-inv" id="hsInv"></div>
          <div class="hs-look">${this.ctx.me.touch ? 'веди пальцем — осмотреться · коснись — изучить' : 'зажми и веди мышью — осмотреться · клик — изучить'}</div>
          <div class="hs-panelwrap" id="hsPanel"></div>
        </div>`);
        this.ctx.ui.appendChild(this.ui);
        this.loadEl = $('#hsLoad', this.ui); this.fadeEl = $('.hs-fade', this.ui); this.panelEl = $('#hsPanel', this.ui);
        $('#hsMap', this.ui).onclick = () => this.openPanel(() => this.mapPanel());
        $('#hsNotes', this.ui).onclick = () => this.openPanel(() => this.notesPanel());
        $('#hsHint', this.ui).onclick = () => this.openPanel(() => this.hintPanel());
        // зерно плёнки
        const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'), im = g.createImageData(160, 160);
        for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
        g.putImageData(im, 0, 0);
        $('.hs-grain', this.ui).style.backgroundImage = `url(${c.toDataURL()})`;
      }
      updateHud() {
        if (!this.ui || !this.S) return;
        $('#hsRoom', this.ui).textContent = this.room ? ROOM_NAME[this.room] : '';
        $('#hsPeer', this.ui).innerHTML = this.peerRoom ? `${this.nm(this.other)}: ${ROOM_NAME[this.peerRoom] || '…'}` : '';
      }
      toast(s, ms = 3000) { this.ctx.toast(s, ms); }
      shake() { const p = this.panelEl.firstElementChild; if (p) { p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); } }
      renderInv() {
        const el = $('#hsInv', this.ui); if (!el || !this.S || !this.S.inv) return;
        const inv = this.S.inv[this.role];
        const key = inv.join();
        if (key === this._invKey) return; this._invKey = key;
        el.innerHTML = inv.map((it) => `<button class="hs-it" data-it="${it}" title="${esc(ITEMS[it].n)}"><img src="${this.icon(it)}" alt=""><span>${esc(ITEMS[it].n)}</span></button>`).join('') || '<span class="hs-empty">карманы пусты</span>';
        el.querySelectorAll('[data-it]').forEach((b) => (b.onclick = () => { SFX.play('click'); this.openPanel(() => this.itemPanel(b.dataset.it)); }));
      }
      icon(it) {
        if (this.iconCache[it]) return this.iconCache[it];
        const c = document.createElement('canvas'); c.width = c.height = 96; story.drawIcon(c.getContext('2d'), it, 96);
        return (this.iconCache[it] = c.toDataURL());
      }

      // ---------- Панели осмотра ----------
      openPanel(fn, focus) {
        this.panelFn = fn; this.ps = {}; this.renderPanel();
        if (focus) this.focusOn(focus);
      }
      renderPanelSoon() { clearTimeout(this._rp); this._rp = setTimeout(() => this.panelFn && this.renderPanel(), 650); }
      renderPanel() {
        const spec = this.panelFn && this.panelFn(); if (!spec) return this.closePanel();
        this.panelEl.innerHTML = `<div class="hs-panel ${spec.cls || ''}"><div class="hs-ph"><h3>${spec.t}</h3><button class="hs-x" aria-label="Закрыть">✕</button></div><div class="hs-pb">${spec.html}</div></div>`;
        this.panelEl.classList.add('on');
        $('.hs-x', this.panelEl).onclick = () => { SFX.play('click'); this.closePanel(); };
        this.panelEl.onclick = (e) => { if (e.target === this.panelEl) this.closePanel(); };
        this.panelEl.querySelectorAll('[data-take]').forEach((b) => (b.onclick = () => this.act('take', b.dataset.take)));
        this.panelEl.querySelectorAll('[data-doc]').forEach((b) => (b.onclick = () => this.doc(b.dataset.doc)));
        this.panelEl.querySelectorAll('canvas[data-img]').forEach((cv) => { const r = cv.getBoundingClientRect(); cv.width = Math.round(Math.max(300, r.width) * 1.5); cv.height = Math.round(cv.width * (+cv.dataset.ratio || 0.55)); IMG[cv.dataset.img](cv.getContext('2d'), cv.width, cv.height, this.S); });
        spec.bind && spec.bind(this.panelEl);
      }
      closePanel() { this.panelFn = null; this.panelEl.classList.remove('on'); this.panelEl.innerHTML = ''; this.fov = 70; }
      focusOn(obj) {
        if (!this.ready || !obj) return;
        const T = THREE, c = new T.Box3().setFromObject(obj).getCenter(new T.Vector3());
        const d = c.sub(this.cam.position);
        this.tyaw = Math.atan2(-d.x, -d.z); this.tpitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.9, 0.6);
        this.fov = 46;
      }
      takeHtml(list) { return list.filter((it) => !this.S.f['t_' + it]).map((it) => `<button class="hs-take" data-take="${it}"><img src="${this.icon(it)}" alt="">Взять: ${esc(ITEMS[it].n)}</button>`).join(''); }
      say(t, text, extra = '') { this.openPanel(() => ({ t, html: `<p class="hs-txt">${esc(text).replace(/\n/g, '<br>')}</p>${extra}` })); }
      docHtml(id) {
        const d = DOCS[id];
        if (d.k === 'img') return `<canvas class="hs-img" data-img="${d.img}" data-ratio="${d.ratio || 0.55}"></canvas>${d.cap ? `<p class="hs-cap">${esc(d.cap).replace(/\n/g, '<br>')}</p>` : ''}`;
        const txt = typeof d.text === 'function' ? d.text(this) : d.text;
        return `<div class="hs-doc ${d.k}">${esc(txt).replace(/\n/g, '<br>')}</div>`;
      }
      doc(id, focus) {
        if (!this.notes.has(id)) { this.notes.add(id); Store.set(NOTES, [...this.notes]); }
        SFX.play('card');
        this.openPanel(() => ({ t: DOCS[id].t, html: this.docHtml(id) }), focus);
      }
      itemPanel(it) {
        const both = this.has('medal_a') && this.has('medal_b') && (it === 'medal_a' || it === 'medal_b');
        return { t: ITEMS[it].n, html: `<div class="hs-item"><img src="${this.icon(it)}" alt=""><p class="hs-txt">${esc(ITEMS[it].d)}</p></div>${both ? '<button class="hs-btn" id="hsComb">Соединить половинки</button>' : ''}`, bind: (el) => { const b = $('#hsComb', el); if (b) b.onclick = () => this.act('combine'); } };
      }
      mapPanel() {
        const list = AREA[this.role].filter((r) => OPEN[r](this.S));
        return { t: 'Комнаты', html: `<div class="hs-map">${list.map((r) => `<button class="hs-btn ${r === this.room ? 'ghost' : ''}" data-go="${r}">${ROOM_NAME[r]}${r === this.room ? ' · ты здесь' : ''}</button>`).join('')}</div><p class="hs-cap">${story.dw.name}: ${ROOM_NAME[story.dw.room[this.role]]}.</p>`, bind: (el) => el.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { this.closePanel(); this.go(b.dataset.go); })) };
      }
      notesPanel() {
        const ids = [...this.notes].filter((id) => DOCS[id]);
        return { t: 'Записи', html: ids.length ? `<div class="hs-map">${ids.map((id) => `<button class="hs-btn ghost" data-doc="${id}">${esc(DOCS[id].t)}</button>`).join('')}</div>` : '<p class="hs-txt">Пока ничего. Всё прочитанное и увиденное будет здесь.</p>' };
      }
      hintPanel() {
        const S = this.S, hnt = HINTS.find(([c]) => c(S));
        return { t: 'Подсказка', html: `<p class="hs-txt">${esc(hnt[this.role === 'up' ? 1 : 2])}</p><p class="hs-cap">Глава ${S.ch} из 4.</p>` };
      }

      // ---------- Общие головоломки ----------
      wheelsPanel({ t, desc, n, chars, act, label = 'Открыть', top }) {
        const P = this.ps; if (!P.w) P.w = Array(n).fill(0);
        const html = `${desc ? `<p class="hs-txt">${desc}</p>` : ''}<div class="hs-wheels">${P.w.map((v, i) => `<div class="hs-wheel">${top ? `<div class="hs-wtop">${top[i]}</div>` : ''}<button data-u="${i}">▲</button><div class="hs-wv">${chars[v]}</div><button data-d="${i}">▼</button></div>`).join('')}</div><button class="hs-btn" id="hsGo">${label}</button>`;
        return { t, html, bind: (el) => {
          el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = () => { P.w[+b.dataset.u] = (P.w[+b.dataset.u] + 1) % chars.length; SFX.play('tick'); this.renderPanel(); }));
          el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { P.w[+b.dataset.d] = (P.w[+b.dataset.d] + chars.length - 1) % chars.length; SFX.play('tick'); this.renderPanel(); }));
          $('#hsGo', el).onclick = () => { this.snd('click'); this.act(act, P.w.map((v) => chars[v]).join('')); };
        } };
      }
      finalPanel() {
        const S = this.S, F = story.final, mine = F.flag[this.role], theirs = F.flag[this.other], key = F.key[this.role];
        let html = `<p class="hs-txt">${F.text[this.role]}</p>`;
        html += `<div class="hs-keys"><div class="${S.f[mine] ? 'on' : ''}">Твой ключ: ${S.f[mine] ? 'вставлен ✦' : 'нет'}</div><div class="${S.f[theirs] ? 'on' : ''}">С той стороны: ${S.f[theirs] ? 'вставлен ✦' : 'нет'}</div></div>`;
        if (!S.f[mine]) html += this.has(key) ? `<button class="hs-btn" id="hsIns">Вставить ${esc(ITEMS[key].n.toLowerCase())}</button>` : '<p class="hs-cap">Нужен ключ.</p>';
        else if (S.f[theirs]) html += '<p class="hs-txt">Оба ключа вставлены. Повернуть нужно одновременно — считайте вслух.</p><button class="hs-btn big" id="hsTurn">Повернуть ключ</button>';
        return { t: F.title, html, bind: (el) => { const a = $('#hsIns', el); if (a) a.onclick = () => this.act('insert'); const b = $('#hsTurn', el); if (b) b.onclick = () => { b.classList.add('pressed'); this.act('turn'); }; } };
      }
      dwPanel() {
        const S = this.S, here = S.dw.pos === this.role;
        const D = story.dw;
        if (D.need && !S.f[D.need]) return { t: D.name, html: `<p class="hs-txt">${D.broken[this.role]}</p>${D.install && D.install.role === this.role && this.has(D.install.item) ? `<button class="hs-btn" id="hsCrank">${D.install.label}</button>` : ''}`, bind: (el) => { const b = $('#hsCrank', el); if (b) b.onclick = () => this.act(D.install.act); } };
        const inv = S.inv[this.role];
        const html = `<p class="hs-txt">${D.cabin}: ${here ? '<b>у тебя</b>' : 'у другого'}. ${here ? 'Положи предметы и отправь.' : 'Можно вызвать к себе.'}</p>
          ${here ? `<div class="hs-dwbox">${S.dw.items.length ? S.dw.items.map((it) => `<button class="hs-take" data-dwt="${it}"><img src="${this.icon(it)}" alt="">Забрать: ${esc(ITEMS[it].n)}</button>`).join('') : `<span class="hs-cap">${D.empty || 'в кабине пусто'}</span>`}</div>
            ${inv.length ? `<p class="hs-cap">${D.putIn || 'Положить в кабину:'}</p><div class="hs-dwbox">${inv.map((it) => `<button class="hs-take" data-dwp="${it}"><img src="${this.icon(it)}" alt="">${esc(ITEMS[it].n)}</button>`).join('')}</div>` : ''}
            <button class="hs-btn" id="hsSend">Отправить ${D.send[this.role]}</button>` : `<button class="hs-btn" id="hsCall">${D.call}</button>`}`;
        return { t: D.name, html, bind: (el) => {
          el.querySelectorAll('[data-dwt]').forEach((b) => (b.onclick = () => this.act('dw_take', b.dataset.dwt)));
          el.querySelectorAll('[data-dwp]').forEach((b) => (b.onclick = () => this.act('dw_put', b.dataset.dwp)));
          const s = $('#hsSend', el); if (s) s.onclick = () => this.act('dw_send');
          const c = $('#hsCall', el); if (c) c.onclick = () => this.act('dw_call');
        } };
      }

      // ================= Точки интереса =================
      hot(id, obj) {
        const H = this.HOT || (this.HOT = this.hotTable());
        if (!H[id]) return;
        SFX.play('click');
        this.runHot(id, obj);
      }
      // Панель точки интереса пересобирается целиком, когда меняются флаги (загадка решена, предмет взят)
      runHot(id, obj, keep) {
        const S = this.S, ps = this.ps; this.panelHot = null;
        this.HOT[id](obj, S, S.f);
        if (keep && this.panelFn) { this.ps = ps; this.renderPanel(); }
        if (this.panelFn) this.panelHot = { id, obj, fn: this.panelFn, f: JSON.stringify(S.f) };
      }
      hotTable() {
        const G = this;
        const use = (it, label, act, v) => (G.has(it) ? `<button class="hs-btn" data-use="${act}" data-v="${v || ''}">${label}</button>` : '');
        const bindUse = (el) => el.querySelectorAll('[data-use]').forEach((b) => (b.onclick = () => G.act(b.dataset.use, b.dataset.v || undefined)));
        const P = (fn, o) => G.openPanel(fn, o);
        return story.hot(G, { use, bindUse, P });
      }

      // ================= 3D =================
      init3d() {
        const T = THREE; HA.init();
        if (T.ColorManagement) T.ColorManagement.legacyMode = false;
        const r = (this.renderer = new T.WebGLRenderer({ canvas: this.ctx.canvas, antialias: true, powerPreference: 'high-performance' }));
        r.setPixelRatio(Math.min(devicePixelRatio || 1, this.ctx.me.touch ? 1.4 : 1.75));
        r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 0.95;
        r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
        this.scene = new T.Scene(); this.scene.background = new T.Color('#050607');
        this.scene.fog = new T.FogExp2('#06080a', 0.07);
        this.cam = new T.PerspectiveCamera(70, 1, 0.05, 60); this.cam.rotation.order = 'YXZ'; this.scene.add(this.cam);
        // фонарь
        const fl = (this.flash = new T.SpotLight('#ffe9c8', 2.8, 15, 0.48, 0.65, 1.4));
        fl.position.set(0.18, -0.12, 0.1); fl.castShadow = true; fl.shadow.mapSize.set(512, 512); fl.shadow.bias = -0.0006; fl.shadow.camera.near = 0.2;
        this.cam.add(fl); const tg = new T.Object3D(); tg.position.set(0, -0.15, -2); this.cam.add(tg); fl.target = tg;
        
        
        // пыль
        const N = 260, pos = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 6;
        const dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(pos, 3));
        this.dust = new T.Points(dg, new T.PointsMaterial({ color: '#d8c8a8', size: 0.018, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
        this.scene.add(this.dust);
        this.ray = new T.Raycaster();
        this._resize = () => { const w = innerWidth, hh = innerHeight; r.setSize(w, hh, false); this.cam.aspect = w / hh; this.cam.updateProjectionMatrix(); };
        addEventListener('resize', this._resize); this._resize();
        this.bindInput();
        this.ready = true; this.loadEl.remove();
        if (this.S && this.S.phase === 'play') { this.go(AREA[this.role][0], true); this.startAmbient(); }
        if (this.S && this.S.phase === 'outro') this.go(story.finalRoom, true);
      }
      bindInput() {
        const c = this.ctx.canvas; let d = null;
        c.addEventListener('pointerdown', (e) => { d = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId }; try { c.setPointerCapture(e.pointerId); } catch (er) {} SFX.unlock(); });
        c.addEventListener('pointermove', (e) => {
          if (d && d.id === e.pointerId) {
            const dx = e.clientX - d.x, dy = e.clientY - d.y; d.moved += Math.abs(dx) + Math.abs(dy); d.x = e.clientX; d.y = e.clientY;
            const k = this.ctx.me.touch ? 0.0065 : 0.0045;
            this.tyaw += dx * k; this.tpitch = clamp(this.tpitch + dy * k * 0.8, -1.0, 0.75);
            if (this.panelFn && d.moved > 20) this.closePanel();
          } else if (!this.ctx.me.touch) { this.mouse = { x: e.clientX, y: e.clientY }; }
        });
        const up = (e) => { if (!d || d.id !== e.pointerId) return; const tap = d.moved < 10 && performance.now() - d.t < 450; d = null; if (tap) this.tap(e.clientX, e.clientY); };
        c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => (d = null));
        this.keys = new Keys();
      }
      pick(x, y) {
        const R = this.rooms[this.room]; if (!R) return null;
        const v = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
        this.ray.setFromCamera(v, this.cam);
        const hits = this.ray.intersectObjects(R.hots.map((q) => q.obj), true);
        for (const hit of hits) { let o = hit.object; while (o && !o.userData.hot) o = o.parent; if (o && o.visible !== false) return o; }
        return null;
      }
      tap(x, y) {
        if (!this.S || this.S.phase !== 'play' || this.fading) return;
        if (this.panelFn) { this.closePanel(); return; }
        const o = this.pick(x, y);
        if (o) this.hot(o.userData.hot, o);
      }
      go(id, instant) {
        if (!this.ready) return;
        if (this.room === id && !instant) return;
        const doIt = () => {
          if (!this.rooms[id]) this.rooms[id] = this.buildRoom(id);
          for (const k in this.rooms) this.rooms[k].g.visible = k === id;
          this.room = id; const R = this.rooms[id];
          this.cam.position.set(R.cam[0], 1.62, R.cam[1]);
          this.yaw = this.tyaw = R.yaw; this.pitch = this.tpitch = -0.05;
          this.scene.fog.density = R.fogD;
          this.updateRoom(id);
          this.updateHud();
          this.ctx.send({ a: 'room', r: id });
          if (ROOMS[id].enter) ROOMS[id].enter(this);
        };
        if (instant) { doIt(); return; }
        this.closePanel();
        this.fading = true; this.fadeEl.classList.add('on'); this.snd('step');
        setTimeout(() => { doIt(); setTimeout(() => { this.fadeEl.classList.remove('on'); this.fading = false; }, 120); }, 420);
      }

      // ---------- Сборка комнат ----------
      buildRoom(id) {
        const T = THREE, A = HA, def = ROOMS[id];
        const [W, H, D] = def.size, g = new T.Group(); this.scene.add(g);
        const R = { id, W, H, D, g, hots: [], o: {}, cam: def.cam || [0, 0], yaw: def.yaw || 0, fogD: def.fog || 0.07, flames: [], prac: [] };
        const wm = (rep) => new T.MeshStandardMaterial({ map: A.surf(def.wall, rep), roughness: 0.92 });
        const wall = (w, hgt, mat, x, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, hgt), mat); m.position.set(x, hgt / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); };
        wall(W, H, wm([W / 2.4, H / 2.4]), 0, -D / 2, 0); wall(W, H, wm([W / 2.4, H / 2.4]), 0, D / 2, Math.PI);
        wall(D, H, wm([D / 2.4, H / 2.4]), -W / 2, 0, Math.PI / 2); wall(D, H, wm([D / 2.4, H / 2.4]), W / 2, 0, -Math.PI / 2);
        const fl = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: A.surf(def.floor, [W / 2.2, D / 2.2]), roughness: 0.8 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
        const ce = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: A.surf(def.ceil || 'plaster', [W / 2.5, D / 2.5]), roughness: 0.95 })); ce.rotation.x = Math.PI / 2; ce.position.y = H; g.add(ce);
        if (def.trim !== false) { const tm = A.mat('wood'); for (const [w, x, z, ry] of [[W, 0, -D / 2 + 0.02, 0], [W, 0, D / 2 - 0.02, 0], [D, -W / 2 + 0.02, 0, Math.PI / 2], [D, W / 2 - 0.02, 0, Math.PI / 2]]) { const b = A.B(w, 0.16, 0.03, tm, x, 0.08, z); b.rotation.y = ry; g.add(b); } }
        g.add(new T.HemisphereLight(def.amb[0], def.amb[1], def.amb[2]));
        R.put = (obj, side, along, out = 0, y = 0) => {
          if (side === 'n') { obj.position.set(along, y, -D / 2 + out); obj.rotation.y = 0; }
          if (side === 's') { obj.position.set(along, y, D / 2 - out); obj.rotation.y = Math.PI; }
          if (side === 'w') { obj.position.set(-W / 2 + out, y, along); obj.rotation.y = Math.PI / 2; }
          if (side === 'e') { obj.position.set(W / 2 - out, y, along); obj.rotation.y = -Math.PI / 2; }
          g.add(obj); return obj;
        };
        R.at = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; g.add(obj); return obj; };
        R.hot = (hid, obj) => { obj.userData.hot = hid; R.hots.push({ id: hid, obj }); return obj; };
        def.build(R, A, T, this);
        g.traverse((o) => { if (o.userData.flames) R.flames.push(...o.userData.flames); if (o.isPointLight) R.prac.push({ l: o, base: o.intensity, ph: Math.random() * 10 }); });
        // искорки у точек интереса
        for (const q of R.hots) {
          const box = new T.Box3().setFromObject(q.obj), c = box.getCenter(new T.Vector3());
          if (!isFinite(c.x)) continue;
          const s = A.glow('#ffe2b0', 0.16, 0); s.position.copy(c); s.position.y = Math.min(box.max.y, c.y + 0.15); g.add(s); q.glint = s; q.ph = Math.random() * 6;
        }
        return R;
      }
      updateRoom(id) {
        const R = this.rooms[id], def = ROOMS[id]; if (!R || !this.S || !this.S.f) return;
        def.update && def.update(R, this.S, this);
        for (const q of R.hots) if (q.glint) q.glint.userData.done = q.obj.visible === false;
      }

      // ================= Кадр =================
      frame(dt, t) {
        if (!this.ready || !this.room) return;
        const R = this.rooms[this.room];
        const k = this.keys;
        if (k && this.S && this.S.phase === 'play' && !this.panelFn) { if (k.any('ArrowLeft', 'KeyA')) this.tyaw += dt * 1.6; if (k.any('ArrowRight', 'KeyD')) this.tyaw -= dt * 1.6; if (k.any('ArrowUp', 'KeyW')) this.tpitch = Math.min(0.75, this.tpitch + dt); if (k.any('ArrowDown', 'KeyS')) this.tpitch = Math.max(-1, this.tpitch - dt); }
        const sm = 1 - Math.exp(-dt * 10);
        this.yaw += angDiff(this.yaw, this.tyaw) * sm; this.pitch = lerp(this.pitch, this.tpitch, sm);
        // лёгкое «дыхание» камеры
        this.cam.rotation.set(this.pitch + Math.sin(t * 0.9) * 0.006, this.yaw + Math.sin(t * 0.6) * 0.004, 0);
        const port = innerHeight > innerWidth, fovT = this.panelFn ? this.fov : port ? 82 : 70;
        if (Math.abs(this.cam.fov - fovT) > 0.1) { this.cam.fov = lerp(this.cam.fov, fovT, 1 - Math.exp(-dt * 5)); this.cam.updateProjectionMatrix(); }
        // мерцание огня и ламп
        for (const f of R.flames) { f.scale.y = 1 + Math.sin(t * 17 + f.id) * 0.12 + Math.random() * 0.05; }
        for (const p of R.prac) { if (p.base > 0 && p.l.userData.on !== false) p.l.intensity = p.base * (0.86 + Math.sin(t * 8 + p.ph) * 0.06 + Math.random() * 0.08) * (Math.random() < 0.004 ? 0.2 : 1); }
        this.flash.intensity = 2.8 * (Math.random() < 0.002 ? 0.15 : 1);
        // искорки
        const pulse = this.ctx.me.touch ? 0.55 : 0.4;
        let hov = null; if (this.mouse && !this.panelFn && ((this._hT = (this._hT || 0) + dt) > 0.08)) { this._hT = 0; hov = this.pick(this.mouse.x, this.mouse.y); this.ctx.canvas.style.cursor = hov ? 'pointer' : 'grab'; this._hov = hov; }
        for (const q of R.hots) if (q.glint) { const on = !q.glint.userData.done; const hv = this._hov === q.obj; q.glint.material.opacity = on ? (hv ? 0.95 : (0.15 + Math.sin(t * 2 + q.ph) * 0.12) * pulse * 2) : 0; q.glint.scale.setScalar(hv ? 0.32 : 0.16); }
        // пыль
        const dp = this.dust.geometry.attributes.position.array;
        for (let i = 0; i < dp.length; i += 3) { dp[i + 1] -= dt * 0.03; dp[i] += Math.sin(t + i) * dt * 0.02; if (dp[i + 1] < -3) dp[i + 1] = 3; }
        this.dust.geometry.attributes.position.needsUpdate = true; this.dust.position.copy(this.cam.position);
        const def = ROOMS[this.room]; def.tick && def.tick(R, this, dt, t);
        // шёпот
        if ((this._wT = (this._wT || rand(50, 90)) - dt) <= 0) { this._wT = rand(70, 140); if (this.S && this.S.phase === 'play') this.snd('whisper'); }
        this.renderer.render(this.scene, this.cam);
      }

      // ================= Звук =================
      startAmbient() {
        const ac = SFX.ac; if (!ac || this.amb) return;
        const out = ac.createGain(); out.gain.value = 0.0001; out.connect(SFX.master);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.connect(out);
        const base = this.role === 'up' ? 55 : 46.2;
        const oscs = [base, base * 1.012, base * 1.5].map((f, i) => { const o = ac.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f; const gg = ac.createGain(); gg.gain.value = i === 2 ? 0.15 : 0.5; o.connect(gg); gg.connect(lp); o.start(); return o; });
        const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), dd = buf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 140; const ng = ac.createGain(); ng.gain.value = 0.9; src.connect(bp); bp.connect(ng); ng.connect(out); src.start();
        out.gain.exponentialRampToValueAtTime(SFX.muted ? 0.0001 : 0.12, ac.currentTime + 4);
        this.amb = { out, nodes: [...oscs, src] };
      }
      stopAmbient() { if (!this.amb) return; const ac = SFX.ac; try { this.amb.out.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.5); const n = this.amb.nodes; setTimeout(() => n.forEach((o) => { try { o.stop(); } catch (e) {} }), 1700); } catch (e) {} this.amb = null; }
      note(f, kind, vol = 1, when = 0) {
        const ac = SFX.ac; if (!ac || SFX.muted) return;
        const t0 = ac.currentTime + when, g = ac.createGain(); g.connect(SFX.master);
        if (kind === 'organ') {
          const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(g);
          [1, 0.5, 2].forEach((m, i) => { const o = ac.createOscillator(); o.type = i === 1 ? 'square' : 'sawtooth'; o.frequency.value = f * m; const gg = ac.createGain(); gg.gain.value = [0.5, 0.25, 0.12][i]; o.connect(gg); gg.connect(lp); o.start(t0); o.stop(t0 + 1.3); });
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09 * vol, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.25);
        } else {
          [1, 2.01, 3.98].forEach((m, i) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * m; const gg = ac.createGain(); gg.gain.value = [0.6, 0.25, 0.08][i]; o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + 1.8); });
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16 * vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
        }
      }
      snd(n) {
        switch (n) {
          case 'open': SFX.noise(0.5, { vol: 0.2, freq: 500, sweep: 0.5 }); break;
          case 'click': SFX.tone(1800, 0.04, { type: 'square', vol: 0.06 }); SFX.tone(900, 0.06, { type: 'square', vol: 0.04, when: 0.05 }); break;
          case 'drawer': SFX.noise(0.35, { vol: 0.3, freq: 700, type: 'bandpass', q: 1.2 }); break;
          case 'door': SFX.play('door'); SFX.tone(180, 0.9, { type: 'sawtooth', vol: 0.04, slide: 1.4 }); break;
          case 'creak': SFX.tone(220, 0.8, { type: 'sawtooth', vol: 0.05, slide: 1.6 }); SFX.tone(260, 0.6, { type: 'sawtooth', vol: 0.03, slide: 0.7, when: 0.3 }); break;
          case 'mech': SFX.noise(0.6, { vol: 0.35, freq: 300, sweep: 0.4 }); SFX.tone(70, 0.6, { vol: 0.2 }); SFX.tone(1200, 0.05, { type: 'square', vol: 0.05, when: 0.5 }); break;
          case 'chime': SFX.tone(392, 2.5, { vol: 0.18 }); SFX.tone(392 * 2.76, 1.5, { vol: 0.05 }); break;
          case 'drain': SFX.noise(2.2, { vol: 0.35, freq: 600, sweep: 0.3 }); for (let i = 0; i < 6; i++) SFX.tone(rand(200, 500), 0.12, { vol: 0.08, when: i * 0.25, slide: 1.8 }); break;
          case 'fire': SFX.noise(1.0, { vol: 0.3, freq: 2000, sweep: 0.3 }); break;
          case 'wrong': SFX.tone(110, 0.35, { type: 'square', vol: 0.08 }); SFX.tone(104, 0.35, { type: 'square', vol: 0.08 }); break;
          case 'take': SFX.tone(660, 0.12, { type: 'triangle', vol: 0.1 }); SFX.tone(990, 0.2, { type: 'triangle', vol: 0.07, when: 0.08 }); break;
          case 'rope': SFX.noise(1.6, { vol: 0.25, freq: 900, type: 'bandpass', q: 3 }); SFX.tone(140, 1.4, { type: 'sawtooth', vol: 0.03, slide: 1.3 }); break;
          case 'bell': SFX.tone(1318, 1.2, { vol: 0.12 }); SFX.tone(1318 * 2.7, 0.6, { vol: 0.03 }); break;
          case 'power': SFX.noise(0.3, { vol: 0.5, freq: 3000, type: 'highpass' }); SFX.tone(50, 3, { type: 'sawtooth', vol: 0.06 }); SFX.tone(100, 3, { vol: 0.08, when: 0.2 }); break;
          case 'whisper': SFX.noise(1.8, { vol: 0.07, freq: 1800, type: 'bandpass', q: 6, sweep: 0.6 }); SFX.noise(1.4, { vol: 0.05, freq: 2600, type: 'bandpass', q: 8, sweep: 1.5, when: 0.6 }); break;
          case 'sting': SFX.tone(233, 1.6, { type: 'sawtooth', vol: 0.05 }); SFX.tone(247, 1.6, { type: 'sawtooth', vol: 0.05 }); SFX.noise(0.4, { vol: 0.15, freq: 1200, sweep: 0.2 }); break;
          case 'sting2': [196, 233, 277, 330].forEach((f, i) => SFX.tone(f, 3, { vol: 0.06, when: i * 0.12 })); break;
          case 'step': for (let i = 0; i < 3; i++) SFX.noise(0.09, { vol: 0.18, freq: 280, when: i * 0.16 }); SFX.tone(150, 0.5, { type: 'sawtooth', vol: 0.025, slide: 1.3, when: 0.1 }); break;
          case 'crash': SFX.noise(1.6, { vol: 0.7, freq: 500, sweep: 0.15 }); SFX.tone(60, 1.2, { vol: 0.35, slide: 0.5 }); break;
          case 'chain': for (let i = 0; i < 4; i++) SFX.tone(rand(1800, 2600), 0.08, { type: 'square', vol: 0.03, when: i * 0.07 }); break;
          case 'book': SFX.noise(0.18, { vol: 0.2, freq: 1500, type: 'bandpass', q: 1 }); break;
          case 'tick2': SFX.tone(700, 0.05, { type: 'square', vol: 0.05 }); break;
          case 'lever': SFX.noise(0.4, { vol: 0.35, freq: 400, sweep: 0.5 }); SFX.tone(90, 0.3, { vol: 0.15 }); break;
          case 'wind': SFX.noise(2.8, { vol: 0.18, freq: 500, type: 'bandpass', q: 0.7, sweep: 1.6 }); break;
          case 'static': SFX.noise(2.5, { vol: 0.12, freq: 3500, type: 'bandpass', q: 0.5 }); break;
        }
      }

      resync() { if (this.ctx.isHost && this.S) this.broadcast(); if (this.room) this.ctx.send({ a: 'room', r: this.room }); }
      destroy() {
        clearInterval(this._typeT); this.stopAmbient(); this.keys && this.keys.destroy();
        if (this._resize) removeEventListener('resize', this._resize);
        if (this.renderer) { this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.dispose(); }); }); this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
      }
    }

    if (story.methods) Object.assign(House.prototype, story.methods);
  }
  return { define, baseAct };
})();
