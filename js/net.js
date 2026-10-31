'use strict';
// Соединение двух браузеров напрямую (WebRTC через PeerJS).
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

class Net {
  constructor() {
    this.handlers = {};
    this.local = new URLSearchParams(location.search).has('local');
    this.isHost = false; this.connected = false;
    this.peer = null; this.conn = null; this.bc = null;
    this.code = null; this.rtt = 0; this.lastSeen = 0;
    this._retry = 0;
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); }
  emit(ev, ...a) { (this.handlers[ev] || []).forEach((f) => f(...a)); }

  send(obj) {
    if (!this.connected) return;
    try {
      if (this.local) this.bc.postMessage({ from: this.isHost ? 'h' : 'g', data: obj });
      else if (this.conn && this.conn.open) this.conn.send(obj);
    } catch (e) { console.warn('send failed', e); }
  }

  _gotData(data) {
    this.lastSeen = performance.now();
    if (data && data.t === '_ping') { this.send({ t: '_pong', ts: data.ts }); return; }
    if (data && data.t === '_pong') { this.rtt = Math.round(performance.now() - data.ts); this.emit('rtt', this.rtt); return; }
    this.emit('msg', data);
  }
  _setConnected(v) {
    if (this.connected === v) return;
    this.connected = v;
    this.emit(v ? 'open' : 'close');
    clearInterval(this._pingT);
    if (v) {
      this.lastSeen = performance.now();
      this._pingT = setInterval(() => {
        this.send({ t: '_ping', ts: performance.now() });
        // обрыв не всегда заметен (телефон уснул), поэтому следим по тишине
        if (performance.now() - this.lastSeen > (this.local ? 7000 : 10000)) {
          if (this.local) this._setConnected(false);
          else { const c = this.conn; this.conn = null; try { c && c.close(); } catch (e) {} this._lost(); }
        }
      }, 2000);
    }
  }

  // ---------- Хост ----------
  host(code) {
    this.isHost = true; this.code = code;
    if (this.local) return this._localHost();
    return new Promise((resolve, reject) => {
      this.emit('status', 'Открываю комнату…');
      const peer = new Peer(CONFIG.peerPrefix + code.id, { debug: 1, config: { iceServers: CONFIG.iceServers } });
      this.peer = peer;
      let done = false;
      peer.on('open', () => { done = true; this.emit('status', 'Комната открыта'); resolve(); });
      peer.on('connection', (c) => {
        if (this.conn && this.conn.open) this.conn.close();
        this._bindConn(c);
      });
      peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.reconnect(), 1500); });
      peer.on('error', (err) => {
        console.warn('peer error', err.type, err);
        if (!done) {
          if (err.type === 'unavailable-id') reject(new Error('busy'));
          else reject(new Error(['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type) ? 'server' : err.type || 'p2p'));
        }
      });
    });
  }

  // ---------- Гость ----------
  join(code) {
    this.isHost = false; this.code = code;
    if (this.local) return this._localJoin();
    return new Promise((resolve, reject) => {
      this.emit('status', 'Ищу комнату…');
      const start = () => {
        const conn = this.peer.connect(CONFIG.peerPrefix + code.id, { reliable: true, serialization: 'json' });
        let ok = false;
        const to = setTimeout(() => { if (!ok) reject(new Error('p2p')); }, 15000);
        conn.on('open', () => { ok = true; clearTimeout(to); resolve(); });
        this._bindConn(conn);
      };
      if (this.peer && !this.peer.destroyed && this.peer.open) return start();
      const peer = new Peer(undefined, { debug: 1, config: { iceServers: CONFIG.iceServers } });
      this.peer = peer;
      peer.on('open', start);
      peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.reconnect(), 1500); });
      peer.on('error', (err) => {
        console.warn('peer error', err.type, err);
        if (err.type === 'peer-unavailable') reject(new Error('notfound'));
        else if (!this.connected) reject(new Error(['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type) ? 'server' : 'p2p'));
      });
    });
  }

  _bindConn(c) {
    this.conn = c;
    c.on('open', () => { this._retry = 0; this._setConnected(true); });
    c.on('data', (d) => this._gotData(d));
    c.on('close', () => { if (this.conn === c) this._lost(); });
    c.on('error', () => { if (this.conn === c) this._lost(); });
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
