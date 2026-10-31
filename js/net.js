'use strict';
// Соединение двух браузеров напрямую (WebRTC DataChannel).
// Знакомство устройств — через публичные MQTT-серверы (сразу несколько: сработает любой доступный).
// peerjs.com в России заблокирован, поэтому он больше не используется.
// Режим ?local=1 — две вкладки на одном компьютере через BroadcastChannel (для проверки без интернета).

const ROOM_WORDS = ['ЛИС', 'КОТ', 'СОВА', 'ЛУНА', 'ЗВЕЗДА', 'МОРЕ', 'ЁЖ', 'ВОЛНА', 'ОБЛАКО', 'КЛЁН', 'ЯГОДА', 'ПЕРО',
  'МАЯК', 'СНЕГ', 'ЛЕС', 'ЗАРЯ', 'МЁД', 'ВЕТЕР', 'КИТ', 'ОЛЕНЬ', 'ЧАЙ', 'ЛОТОС', 'ИСКРА', 'ПРИЧАЛ',
  'ФЕЯ', 'ГНОМ', 'ТЫКВА', 'РОЗА', 'ДОЖДЬ', 'КОМЕТА', 'ПАНДА', 'ЗАЙКА'];

const RoomCode = {
  make() {
    const w = Math.floor(Math.random() * ROOM_WORDS.length), n = 10 + Math.floor(Math.random() * 90);
    return { text: `${ROOM_WORDS[w]}-${n}`, id: `${w}-${n}` };
  },
  // «лис 27», «Лис-27», «ЛИС27» → { text, id }
  parse(str) {
    const s = String(str || '').toUpperCase().trim();
    const m = s.match(/([А-ЯЁA-Z]+)\s*[-_ ]?\s*(\d{2})/);
    if (!m) return null;
    const norm = (x) => x.replace(/Ё/g, 'Е');
    const w = ROOM_WORDS.findIndex((x) => norm(x) === norm(m[1]));
    if (w < 0) return null;
    return { text: `${ROOM_WORDS[w]}-${m[2]}`, id: `${w}-${m[2]}` };
  },
};

// ---------- Маленький MQTT 3.1.1 клиент поверх WebSocket (только то, что нужно: подписка и публикация) ----------
class MqttWs {
  constructor(url, onReady, onMsg) {
    this.url = url; this.onReady = onReady; this.onMsg = onMsg;
    this.ready = false; this.closed = false; this.buf = new Uint8Array(0); this.pid = 1; this.subs = new Set();
    this.connect();
  }
  connect() {
    if (this.closed) return;
    let ws;
    try { ws = new WebSocket(this.url, 'mqtt'); } catch (e) { this.retry(); return; }
    ws.binaryType = 'arraybuffer'; this.ws = ws;
    ws.onopen = () => {
      const id = 'nn' + Math.random().toString(36).slice(2, 12);
      const body = [...MqttWs.str('MQTT'), 4, 0x02, 0, 30, ...MqttWs.str(id)];
      ws.send(MqttWs.packet(0x10, body));
    };
    ws.onmessage = (e) => { const d = new Uint8Array(e.data); const b = new Uint8Array(this.buf.length + d.length); b.set(this.buf); b.set(d, this.buf.length); this.buf = b; this.parse(); };
    ws.onclose = ws.onerror = () => { if (this.ws !== ws) return; this.ws = null; this.ready = false; clearInterval(this.pingT); this.retry(); };
  }
  retry() { if (this.closed) return; this.drops = (this.drops || 0) + 1; this.wait = Math.min(5000, (this.wait || 500) * 1.6); setTimeout(() => this.connect(), this.wait); }
  static str(s) { const b = new TextEncoder().encode(s); return [b.length >> 8, b.length & 255, ...b]; }
  static packet(type, body) {
    const len = []; let n = body.length;
    do { let x = n % 128; n = Math.floor(n / 128); if (n > 0) x |= 128; len.push(x); } while (n > 0);
    return new Uint8Array([type, ...len, ...body]);
  }
  parse() {
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      let mul = 1, len = 0, i = 1, byte;
      do { if (i >= b.length) return; byte = b[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128);
      if (b.length < i + len) return;
      const type = b[0] >> 4, body = b.subarray(i, i + len);
      this.buf = b.slice(i + len);
      if (type === 2) { // CONNACK
        if (body[1] !== 0) { this.ws && this.ws.close(); continue; }
        this.ready = true; this.wait = 0;
        for (const t of this.subs) this._sub(t);
        this.pingT = setInterval(() => { try { this.ws.send(new Uint8Array([0xc0, 0])); } catch (e) {} }, 20000);
        this.onReady && this.onReady(this);
      } else if (type === 3) { // PUBLISH (QoS 0)
        const tl = (body[0] << 8) | body[1];
        const topic = new TextDecoder().decode(body.subarray(2, 2 + tl));
        let off = 2 + tl; if ((b[0] >> 1) & 3) off += 2;
        try { this.onMsg(topic, new TextDecoder().decode(body.subarray(off))); } catch (e) { console.warn(e); }
      }
    }
  }
  _sub(t) { const p = this.pid++ & 0xffff || 1; this.ws.send(MqttWs.packet(0x82, [p >> 8, p & 255, ...MqttWs.str(t), 0])); }
  sub(t) { this.subs.add(t); if (this.ready) this._sub(t); }
  pub(t, s) { if (!this.ready) return; this.ws.send(MqttWs.packet(0x30, [...MqttWs.str(t), ...new TextEncoder().encode(s)])); }
  close() { this.closed = true; clearInterval(this.pingT); try { this.ws && this.ws.close(); } catch (e) {} }
}

// Несколько брокеров сразу: публикуем во все доступные, повторы отбрасываем.
class Signal {
  constructor(onMsg) {
    this.onMsg = onMsg; this.seen = new Set(); this.waiters = [];
    this.clients = CONFIG.signalServers.map((u) => new MqttWs(u, () => { this.waiters.splice(0).forEach((f) => f()); }, (t, s) => this._got(t, s)));
  }
  get ready() { return this.clients.some((c) => c.ready); }
  whenReady(ms) {
    if (this.ready) return Promise.resolve();
    return new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('server')), ms); this.waiters.push(() => { clearTimeout(to); res(); }); });
  }
  _got(topic, s) {
    let m; try { m = JSON.parse(s); } catch (e) { return; }
    if (!m || !m._i || this.seen.has(m._i)) return;
    this.seen.add(m._i); if (this.seen.size > 500) this.seen = new Set([...this.seen].slice(-200));
    this.onMsg(topic, m);
  }
  sub(t) { this.clients.forEach((c) => c.sub(t)); }
  pub(t, m) { m._i = Math.random().toString(36).slice(2) + Date.now().toString(36); const s = JSON.stringify(m); this.clients.forEach((c) => c.pub(t, s)); }
  close() { this.clients.forEach((c) => c.close()); }
}

const waitIce = (pc) => new Promise((res) => {
  if (pc.iceGatheringState === 'complete') return res();
  const to = setTimeout(res, 3000);
  pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(to); res(); } });
});

class Net {
  constructor() {
    this.handlers = {};
    this.local = new URLSearchParams(location.search).has('local');
    this.isHost = false; this.connected = false;
    this.sig = null; this.pc = null; this.dc = null; this.bc = null;
    this.code = null; this.rtt = 0; this.lastSeen = 0;
    this._retry = 0;
    this.st = { sd: 0, sr: 0, rd: 0, rr: 0, last: 0, hellos: 0, racks: 0 };
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); }
  emit(ev, ...a) { (this.handlers[ev] || []).forEach((f) => f(...a)); }
  topic(x) { return `${CONFIG.peerPrefix}${this.code.id}/${x}`; }
  get direct() { return !!(this.dc && this.dc.readyState === 'open'); }

  send(obj) {
    if (!this.connected) return;
    try {
      if (this.local) this.bc.postMessage({ from: this.isHost ? 'h' : 'g', data: obj });
      else if (this.dc && this.dc.readyState === 'open') { this.dc.send(JSON.stringify(obj)); this.st.sd++; }
      else if (this.sig && this.relayTo && this.rel) {
        const R = this.rel;
        if (obj && obj.t === 'cur') R.cur = obj; // курсор — только последний, без гарантии
        else { R.out.push({ s: ++R.seq, d: obj, sent: 0 }); if (R.out.length > 400) R.out.shift(); }
      }
    } catch (e) { console.warn('send failed', e); }
  }

  _gotData(data) {
    this.lastSeen = this.st.last = performance.now();
    if (data && data.t === '_ping') { this.send({ t: '_pong', ts: data.ts }); return; }
    if (data && data.t === '_pong') { this.rtt = Math.round(performance.now() - data.ts); this.emit('rtt', this.rtt); return; }
    this.emit('msg', data);
  }
  _setConnected(v) {
    if (this.connected === v) return;
    this.connected = v;
    if (v) {
      if (this._closeT) { clearTimeout(this._closeT); this._closeT = null; } // вернулись быстро — никто и не заметил
      else this.emit('open');
    } else if (this.local) this.emit('close');
    else { clearTimeout(this._closeT); this._closeT = setTimeout(() => { this._closeT = null; if (!this.connected) this.emit('close'); }, 4000); }
    clearInterval(this._pingT);
    if (v) {
      this.lastSeen = performance.now();
      this._pingT = setInterval(() => {
        this.send({ t: '_ping', ts: performance.now() });
        if (!this.local && !this.isHost && this.sig && performance.now() - this.lastSeen > 5000) { this.sig.pub(this.topic('h'), { k: 'hello', gid: this.gid, j: this._joinId }); }
        // обрыв не всегда заметен (телефон уснул), поэтому следим по тишине
        if (performance.now() - this.lastSeen > (this.local ? 7000 : this.direct ? 10000 : 16000)) {
          if (this.local) this._setConnected(false);
          else { this._closePc(); this._lost(); if (this.isHost) this.lastSeen = performance.now(); }
        }
      }, 2000);
    }
  }
  _newPc() {
    this._closePc();
    const pc = new RTCPeerConnection({ iceServers: CONFIG.iceServers });
    this.pc = pc;
    pc.onconnectionstatechange = () => { if (this.pc === pc && pc.connectionState === 'failed') this._closePc(); };
    return pc;
  }
  _closePc() { const pc = this.pc, dc = this.dc; this.pc = null; this.dc = null; try { dc && dc.close(); } catch (e) {} try { pc && pc.close(); } catch (e) {} }
  _bindDc(dc) {
    this.dc = dc;
    dc.onopen = () => { if (this.dc !== dc) return; this._retry = 0; this._setConnected(true); this.emit('rtt', this.rtt); };
    dc.onmessage = (e) => { if (this.dc !== dc) return; this.st.rd++; let d; try { d = JSON.parse(e.data); } catch (er) { return; } this._gotData(d); };
    dc.onclose = () => { if (this.dc === dc) this.dc = null; };
  }

  // ---------- Надёжная доставка через сервер ----------
  _newRel(j) {
    this.rel = { j, seq: 0, out: [], exp: 1, buf: new Map(), cur: null, ackSent: -1, lastSend: 0 };
    if (!this._flushT) this._flushT = setInterval(() => this._flush(), 100);
  }
  _flush() {
    const R = this.rel; if (!R || !this.sig || !this.relayTo || this.direct) return;
    const now = performance.now(), items = [];
    for (const o of R.out) { if (items.length >= 30) break; if (!o.sent || now - o.sent > 450) { items.push([o.s, o.d]); o.sent = now; } }
    const ack = R.exp - 1;
    if (!items.length && !R.cur && ack === R.ackSent && now - R.lastSend < 1000) return;
    this.sig.pub(this.relayTo, { k: 'b', j: R.j, g: this.gid, a: ack, m: items, c: R.cur || undefined });
    this.st.sr++; R.cur = null; R.ackSent = ack; R.lastSend = now;
  }
  _gotBatch(m) {
    const R = this.rel; if (!R || m.j !== R.j) { this.st.foreign = (this.st.foreign || 0) + 1; return; }
    if (this.direct) this._closePc();
    this.lastSeen = performance.now();
    if (typeof m.a === 'number') R.out = R.out.filter((o) => o.s > m.a);
    for (const [sq, d] of m.m || []) if (sq >= R.exp) R.buf.set(sq, d);
    while (R.buf.has(R.exp)) { const d = R.buf.get(R.exp); R.buf.delete(R.exp); R.exp++; this.st.rr++; this._gotData(d); }
    if (m.c) this._gotData(m.c);
  }

  debugInfo() {
    const ago = this.st.last ? Math.round((performance.now() - this.st.last) / 1000) + ' с назад' : '—';
    const br = this.sig ? this.sig.clients.map((c) => `${c.url.split('//')[1].split('.')[1]} ${c.ready ? '✓' : '✗'}${c.drops ? ' обрывов ' + c.drops : ''}`).join(' · ') : 'нет';
    return [`роль: ${this.isHost ? 'хост' : 'гость'} · связь: ${this.connected ? 'есть' : 'нет'} · ${this.direct ? 'напрямую' : 'через сервер'}`, `серверы: ${br}`, `отправлено: напрямую ${this.st.sd}, пачек через сервер ${this.st.sr}`, `получено: напрямую ${this.st.rd}, через сервер ${this.st.rr}${this.st.foreign ? ', чужих ' + this.st.foreign : ''}`, `последнее сообщение: ${ago} · привет ${this.st.hellos} · ответов ${this.st.racks}`, `пинг: ${this.rtt} мс · ждут подтверждения: ${this.rel ? this.rel.out.length : 0} · версия ${CONFIG.version}`].join('\n');
  }

  // ---------- Хост ----------
  async host(code) {
    this.isHost = true; this.code = code;
    if (this.local) return this._localHost();
    this.emit('status', 'Открываю комнату…');
    this.sig = new Signal((t, m) => this._hostSig(m));
    this.sig.sub(this.topic('h'));
    await this.sig.whenReady(12000);
    this.emit('status', 'Комната открыта');
  }
  async _hostSig(m) {
    if (m.k === 'b') { if (m.g === this.gid) this._gotBatch(m); return; }
    if (m.k === 'hello') {
      this.st.hellos++;
      this.relayTo = this.topic('g/' + m.gid);
      this.sig.pub(this.relayTo, { k: 'rack' });
      // повтор того же «привет» — просто шлём уже готовое предложение ещё раз
      if (m.j && m.j === this.joinId) { if (this.lastOffer) this.sig.pub(this.topic('g/' + m.gid), this.lastOffer); return; }
      // гость (новый или вернувшийся) — заводим свежее соединение
      this.joinId = m.j; this.lastOffer = null; this._newRel(m.j);
      this.gid = m.gid; this._retry = 0;
      this._setConnected(true);
      this.lastSeen = performance.now();
      const sid = Math.random().toString(36).slice(2);
      this.sid = sid; this.gid = m.gid;
      const pc = this._newPc();
      this._bindDc(pc.createDataChannel('nn', { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await waitIce(pc);
      if (this.pc !== pc) return;
      this.lastOffer = { k: 'offer', sid, sdp: pc.localDescription.sdp };
      this.sig.pub(this.topic('g/' + m.gid), this.lastOffer);
    }
    if (m.k === 'answer' && m.sid === this.sid && this.pc && this.pc.signalingState === 'have-local-offer') {
      try { await this.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); } catch (e) { console.warn(e); }
    }
  }

  // ---------- Гость ----------
  join(code) {
    this.isHost = false; this.code = code;
    if (this.local) return this._localJoin();
    return new Promise(async (resolve, reject) => {
      this.emit('status', 'Ищу комнату…');
      if (!this.gid) this.gid = Math.random().toString(36).slice(2, 10);
      let offered = false, done = false, hello = null;
      const joinId = Math.random().toString(36).slice(2, 10); this._joinId = joinId; this._newRel(joinId);
      const fail = (e) => { if (!done) { done = true; clearInterval(hello); reject(new Error(e)); } };
      if (!this.sig) {
        this.sig = new Signal((t, m) => this._guestSig(m));
        this.sig.sub(this.topic('g/' + this.gid));
      }
      this._onOffer = () => { offered = true; };
      this.relayTo = null;
      this._onOpen = () => { if (!done) { done = true; clearInterval(hello); resolve(); } };
      try { await this.sig.whenReady(12000); } catch (e) { return fail('server'); }
      const say = () => { if (!offered && !this.connected && !done) this.sig.pub(this.topic('h'), { k: 'hello', gid: this.gid, j: joinId }); };
      say();
      hello = setInterval(say, 2000);
      setTimeout(() => { if (!this.connected) fail('notfound'); }, 12000);
    });
  }
  async _guestSig(m) {
    if (m.k === 'b') { this._gotBatch(m); return; }
    if (m.k === 'rack' || m.k === 'offer') {
      this.st.racks++;
      this.relayTo = this.topic('h');
      if (!this.connected) { this._retry = 0; this._setConnected(true); }
      this._onOpen && this._onOpen();
    }
    if (m.k !== 'offer' || m.sid === this.sid) return;
    this.sid = m.sid;
    this._onOffer && this._onOffer();
    const pc = this._newPc();
    pc.ondatachannel = (e) => this._bindDc(e.channel);
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await waitIce(pc);
      if (this.pc !== pc) return;
      this.sig.pub(this.topic('h'), { k: 'answer', sid: m.sid, sdp: pc.localDescription.sdp });
    } catch (e) { console.warn(e); }
  }

  _lost() {
    this._setConnected(false);
    if (!this.isHost) this._autoRejoin();
  }

  _autoRejoin() {
    if (this._rejoinT) return;
    if (this._retry > 40) { this.emit('status', 'Не удаётся переподключиться'); return; }
    this._retry++;
    this.emit('status', 'Переподключаюсь…');
    this._rejoinT = setTimeout(() => {
      this._rejoinT = null;
      if (this.connected) return;
      this.sid = null;
      this.join(this.code).catch(() => this._autoRejoin());
    }, 2000);
  }

  // ---------- Локальный режим (две вкладки) ----------
  _localHost() {
    this.bc = new BroadcastChannel('nn-local-' + this.code.id);
    this.bc.onmessage = (e) => {
      const m = e.data; if (m.from !== 'g') return;
      if (m.data && m.data.t === '_hello') { this.bc.postMessage({ from: 'h', data: { t: '_welcome' } }); this._setConnected(true); return; }
      if (!this.connected) this._setConnected(true);
      this._gotData(m.data);
    };
    return Promise.resolve();
  }
  _localJoin() {
    return new Promise((resolve, reject) => {
      this.bc = new BroadcastChannel('nn-local-' + this.code.id);
      let ok = false;
      this.bc.onmessage = (e) => {
        const m = e.data; if (m.from !== 'h') return;
        if (m.data && m.data.t === '_welcome') { if (!ok) { ok = true; resolve(); } this._setConnected(true); return; }
        if (!this.connected) this._setConnected(true);
        this._gotData(m.data);
      };
      const hello = () => { if (!this.connected) this.bc.postMessage({ from: 'g', data: { t: '_hello' } }); };
      hello();
      const iv = setInterval(() => { if (ok) clearInterval(iv); else hello(); }, 700);
      setTimeout(() => { if (!ok) { clearInterval(iv); reject(new Error('notfound')); } }, 8000);
    });
  }
}
