'use strict';
// Общие инструменты: математика, случайность, частицы, свечение, символы, звук, сенсорное управление.

window.GAMES = window.GAMES || {};
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const Ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};

// Детерминированный генератор: одинаковый seed → одинаковый мир у обоих игроков.
function RNG(seed) {
  let a = seed >>> 0;
  const f = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + f() * (hi - lo);
  f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return f;
}

// Хранилище с защитой от приватного режима.
const Store = {
  get(k, d) { try { const v = localStorage.getItem('nn_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nn_' + k, JSON.stringify(v)); } catch (e) {} },
};

// ---------- Свечение: заранее нарисованные радиальные градиенты (быстро на телефонах) ----------
const Glow = {
  cache: new Map(),
  get(color, soft = 0.5) {
    const key = color + soft;
    let c = this.cache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.12, color);
    gr.addColorStop(soft, hexA(color, 0.25));
    gr.addColorStop(1, hexA(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    this.cache.set(key, c);
    return c;
  },
  draw(g, x, y, r, color, alpha = 1, soft) {
    if (alpha <= 0) return;
    const pa = g.globalAlpha;
    g.globalAlpha = pa * alpha;
    g.drawImage(this.get(color, soft), x - r, y - r, r * 2, r * 2);
    g.globalAlpha = pa;
  },
};

function hexA(hex, a) {
  if (hex.startsWith('rgb')) return hex.replace(/rgba?\(([^)]+)\)/, (m, p) => { const s = p.split(',').slice(0, 3); return `rgba(${s.join(',')},${a})`; });
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mixColor(c1, c2, t) {
  const p = (h) => { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const a = p(c1), b = p(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------- Частицы ----------
class Particles {
  constructor() { this.list = []; }
  emit(x, y, o = {}) {
    const n = o.n ?? 12;
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rand(-(o.spread ?? 0.5), o.spread ?? 0.5) : rand(0, TAU);
      const sp = rand((o.speed ?? 120) * (o.minSpeed ?? 0.3), o.speed ?? 120);
      const life = rand((o.life ?? 1) * 0.6, o.life ?? 1);
      this.list.push({
        x: x + rand(-(o.jitter ?? 0), o.jitter ?? 0), y: y + rand(-(o.jitter ?? 0), o.jitter ?? 0),
        vx: Math.cos(a) * sp + (o.vx ?? 0), vy: Math.sin(a) * sp + (o.vy ?? 0),
        t: 0, life, size: rand((o.size ?? 6) * 0.5, o.size ?? 6),
        color: Array.isArray(o.color) ? pick(o.color) : o.color ?? '#ffe9a8',
        g: o.gravity ?? 0, drag: o.drag ?? 1.2, glow: o.glow !== false, shape: o.shape || 'dot',
        rot: rand(0, TAU), vr: rand(-4, 4), fade: o.fade ?? 'out',
      });
    }
  }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) { L[i] = L[L.length - 1]; L.pop(); continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }
  draw(g) {
    g.save();
    for (const p of this.list) {
      const k = p.t / p.life;
      const a = p.fade === 'inout' ? Math.sin(k * Math.PI) : 1 - k;
      if (p.glow) {
        g.globalCompositeOperation = 'lighter';
        Glow.draw(g, p.x, p.y, p.size * 2.2, p.color, a);
      } else {
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = a;
        g.fillStyle = p.color;
        if (p.shape === 'rect') {
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore();
        } else { g.beginPath(); g.arc(p.x, p.y, p.size / 2, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
      }
    }
    g.restore();
  }
}

// ---------- Сцена с логическим размером мира (масштаб под любой экран) ----------
class Stage {
  constructor(canvas, W, H) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.W = W; this.H = H;
    this._r = () => this.resize();
    addEventListener('resize', this._r);
    this.resize();
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = this.c.clientWidth || innerWidth, h = this.c.clientHeight || innerHeight;
    this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
    this.dpr = dpr; this.vw = w; this.vh = h;
    this.scale = Math.min(w / this.W, h / this.H);
    this.ox = (w - this.W * this.scale) / 2; this.oy = (h - this.H * this.scale) / 2;
    // видимая область в координатах мира (включая поля по краям)
    this.x0 = -this.ox / this.scale; this.y0 = -this.oy / this.scale;
    this.x1 = this.W + this.ox / this.scale; this.y1 = this.H + this.oy / this.scale;
  }
  begin() { const s = this.dpr * this.scale; this.g.setTransform(s, 0, 0, s, this.dpr * this.ox, this.dpr * this.oy); }
  screen() { this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
  pt(e) { const r = this.c.getBoundingClientRect(); return { x: (e.clientX - r.left - this.ox) / this.scale, y: (e.clientY - r.top - this.oy) / this.scale }; }
  destroy() { removeEventListener('resize', this._r); }
}

// ---------- Ночное небо (фон сайта и некоторых игр) ----------
class Sky {
  constructor(opts = {}) { this.w = 0; this.h = 0; this.shooting = []; this.density = opts.density ?? 1; this.palette = opts.palette; }
  resize(w, h) {
    if (Math.abs(w - this.w) < 2 && Math.abs(h - this.h) < 2) return;
    this.w = w; this.h = h;
    const n = Math.round((w * h) / 2600 * this.density);
    const colors = ['#ffffff', '#ffffff', '#ffe9c4', '#cfe0ff', '#ffd6f0'];
    this.stars = [];
    for (let i = 0; i < n; i++) this.stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.pow(Math.random(), 3) * 1.8 + 0.3, ph: rand(0, TAU), sp: rand(0.5, 2.5), c: pick(colors) });
    // туманности рисуем один раз в маленький холст
    const nc = document.createElement('canvas');
    nc.width = Math.max(64, Math.round(w / 4)); nc.height = Math.max(64, Math.round(h / 4));
    const ng = nc.getContext('2d');
    const cols = this.palette || ['#6a3dbd', '#2a5bd7', '#c2408f', '#1e8f9e'];
    const rr = RNG(Math.round(w * 7 + h));
    for (let i = 0; i < 7; i++) {
      const x = rr() * nc.width, y = rr() * nc.height, r = rr.range(0.25, 0.6) * Math.max(nc.width, nc.height);
      const gr = ng.createRadialGradient(x, y, 0, x, y, r);
      const c = cols[i % cols.length];
      gr.addColorStop(0, hexA(c, 0.32)); gr.addColorStop(0.5, hexA(c, 0.1)); gr.addColorStop(1, hexA(c, 0));
      ng.fillStyle = gr; ng.fillRect(0, 0, nc.width, nc.height);
    }
    this.neb = nc;
  }
  draw(g, t, dt, x = 0, y = 0) {
    const { w, h } = this;
    const bg = g.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, '#04051a'); bg.addColorStop(0.55, '#0d0f33'); bg.addColorStop(1, '#25143f');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.globalAlpha = 0.9 + Math.sin(t * 0.2) * 0.1;
    g.drawImage(this.neb, x, y, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const a = 0.45 + 0.55 * Math.sin(t * s.sp + s.ph);
      if (s.r > 1.2) Glow.draw(g, x + s.x, y + s.y, s.r * 5, s.c, a * 0.5);
      g.globalAlpha = a; g.fillStyle = s.c;
      g.fillRect(x + s.x - s.r / 2, y + s.y - s.r / 2, s.r, s.r);
    }
    g.globalAlpha = 1;
    // падающие звёзды
    if (Math.random() < dt * 0.12) this.shooting.push({ x: rand(0, w), y: rand(0, h * 0.5), vx: rand(300, 600) * (Math.random() < 0.5 ? -1 : 1), vy: rand(120, 260), t: 0, life: rand(0.7, 1.3) });
    for (let i = this.shooting.length - 1; i >= 0; i--) {
      const s = this.shooting[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.t > s.life) { this.shooting.splice(i, 1); continue; }
      const a = Math.sin((s.t / s.life) * Math.PI);
      const gr = g.createLinearGradient(x + s.x, y + s.y, x + s.x - s.vx * 0.25, y + s.y - s.vy * 0.25);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = gr; g.lineWidth = 2; g.beginPath();
      g.moveTo(x + s.x, y + s.y); g.lineTo(x + s.x - s.vx * 0.25, y + s.y - s.vy * 0.25); g.stroke();
      Glow.draw(g, x + s.x, y + s.y, 10, '#cfe0ff', a);
    }
    g.globalCompositeOperation = 'source-over';
  }
}

// ---------- Древние символы (для «Двух ключей» и карт) ----------
const GLYPHS = ['moon', 'sun', 'eye', 'snake', 'star', 'fish', 'key', 'tree', 'wave', 'crown', 'flame', 'bird'];
const GLYPH_NAMES = { moon: 'Луна', sun: 'Солнце', eye: 'Глаз', snake: 'Змея', star: 'Звезда', fish: 'Рыба', key: 'Ключ', tree: 'Дерево', wave: 'Волна', crown: 'Корона', flame: 'Пламя', bird: 'Птица' };

function drawGlyph(g, name, x, y, size, color = '#fff', lw) {
  const s = size / 2;
  g.save();
  g.translate(x, y);
  g.strokeStyle = color; g.fillStyle = color;
  g.lineWidth = lw ?? Math.max(1.5, size * 0.08);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  switch (name) {
    case 'moon':
      g.arc(0, 0, s * 0.8, Math.PI * 0.35, Math.PI * 1.65);
      g.arc(s * 0.35, 0, s * 0.62, Math.PI * 1.45, Math.PI * 0.55, true);
      g.closePath(); g.stroke(); break;
    case 'sun':
      g.arc(0, 0, s * 0.38, 0, TAU); g.stroke(); g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.moveTo(Math.cos(a) * s * 0.58, Math.sin(a) * s * 0.58); g.lineTo(Math.cos(a) * s * 0.88, Math.sin(a) * s * 0.88); }
      g.stroke(); break;
    case 'eye':
      g.moveTo(-s * 0.9, 0); g.quadraticCurveTo(0, -s * 0.85, s * 0.9, 0); g.quadraticCurveTo(0, s * 0.85, -s * 0.9, 0); g.stroke();
      g.beginPath(); g.arc(0, 0, s * 0.24, 0, TAU); g.fill(); break;
    case 'snake':
      g.moveTo(-s * 0.85, s * 0.45);
      g.bezierCurveTo(-s * 0.5, -s * 0.5, -s * 0.1, s * 0.9, s * 0.25, 0);
      g.bezierCurveTo(s * 0.45, -s * 0.45, s * 0.6, -s * 0.55, s * 0.75, -s * 0.35); g.stroke();
      g.beginPath(); g.arc(s * 0.75, -s * 0.38, s * 0.14, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(s * 0.88, -s * 0.38); g.lineTo(s * 1.0, -s * 0.3); g.stroke(); break;
    case 'star':
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? s * 0.38 : s * 0.9; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.stroke(); break;
    case 'fish':
      g.moveTo(s * 0.7, 0); g.quadraticCurveTo(0, -s * 0.65, -s * 0.45, 0); g.quadraticCurveTo(0, s * 0.65, s * 0.7, 0);
      g.moveTo(-s * 0.45, 0); g.lineTo(-s * 0.9, -s * 0.4); g.lineTo(-s * 0.9, s * 0.4); g.closePath(); g.stroke();
      g.beginPath(); g.arc(s * 0.35, -s * 0.08, s * 0.08, 0, TAU); g.fill(); break;
    case 'key':
      g.arc(-s * 0.45, 0, s * 0.32, 0, TAU); g.moveTo(-s * 0.13, 0); g.lineTo(s * 0.88, 0);
      g.moveTo(s * 0.6, 0); g.lineTo(s * 0.6, s * 0.32); g.moveTo(s * 0.82, 0); g.lineTo(s * 0.82, s * 0.25); g.stroke(); break;
    case 'tree':
      g.moveTo(0, s * 0.9); g.lineTo(0, -s * 0.2);
      g.moveTo(0, s * 0.2); g.lineTo(-s * 0.45, -s * 0.25); g.moveTo(0, s * 0.05); g.lineTo(s * 0.45, -s * 0.35); g.stroke();
      g.beginPath(); g.arc(0, -s * 0.45, s * 0.42, 0, TAU); g.stroke(); break;
    case 'wave':
      for (let k = -1; k <= 1; k += 2) {
        for (let i = 0; i <= 24; i++) {
          const px = -s * 0.9 + (i / 24) * s * 1.8, py = k * s * 0.3 + Math.sin((i / 24) * TAU * 1.5) * s * 0.22;
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
      }
      g.stroke(); break;
    case 'crown':
      g.moveTo(-s * 0.8, s * 0.55); g.lineTo(-s * 0.8, -s * 0.35); g.lineTo(-s * 0.4, s * 0.05); g.lineTo(0, -s * 0.6);
      g.lineTo(s * 0.4, s * 0.05); g.lineTo(s * 0.8, -s * 0.35); g.lineTo(s * 0.8, s * 0.55); g.closePath(); g.stroke(); break;
    case 'flame':
      g.moveTo(0, s * 0.9);
      g.bezierCurveTo(-s * 0.8, s * 0.7, -s * 0.6, -s * 0.1, 0, -s * 0.9);
      g.bezierCurveTo(s * 0.15, -s * 0.35, s * 0.75, -s * 0.1, s * 0.55, s * 0.4);
      g.bezierCurveTo(s * 0.45, s * 0.75, s * 0.2, s * 0.9, 0, s * 0.9); g.stroke();
      g.beginPath(); g.moveTo(0, s * 0.65); g.quadraticCurveTo(-s * 0.3, s * 0.3, 0, -s * 0.1); g.quadraticCurveTo(s * 0.25, s * 0.35, 0, s * 0.65); g.stroke(); break;
    case 'bird':
      g.moveTo(-s * 0.9, -s * 0.1); g.quadraticCurveTo(-s * 0.45, -s * 0.6, 0, s * 0.15); g.quadraticCurveTo(s * 0.45, -s * 0.6, s * 0.9, -s * 0.1); g.stroke();
      g.beginPath(); g.arc(0, s * 0.25, s * 0.12, 0, TAU); g.fill(); break;
  }
  g.restore();
}

// ---------- Звук: маленький синтезатор, без файлов ----------
const SFX = {
  ac: null, master: null, muted: Store.get('mute', false),
  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ac.destination);
    } catch (e) { this.ac = null; }
  },
  setMute(m) { this.muted = m; Store.set('mute', m); },
  tone(f, dur, { type = 'sine', vol = 0.3, when = 0, slide = 0, attack = 0.01 } = {}) {
    const ac = this.ac; if (!ac || this.muted) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + attack);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, { vol = 0.3, freq = 1200, when = 0, q = 0.8, type = 'lowpass', sweep = 0 } = {}) {
    const ac = this.ac; if (!ac || this.muted) return;
    const t = ac.currentTime + when;
    const len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
    const gn = ac.createGain();
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gn); gn.connect(this.master); src.start(t);
  },
  play(name) {
    if (!this.ac || this.muted) return;
    const P = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
    switch (name) {
      case 'click': this.tone(880, 0.08, { type: 'triangle', vol: 0.15 }); break;
      case 'pop': this.tone(600, 0.12, { type: 'sine', vol: 0.25, slide: 1.8 }); break;
      case 'chime': [0, 2, 4, 5].forEach((n, i) => this.tone(P[n], 0.6, { vol: 0.18, when: i * 0.07 })); break;
      case 'win': [0, 2, 4, 5, 7, 5, 7].forEach((n, i) => this.tone(P[n], 0.9, { vol: 0.16, when: i * 0.09, type: i % 2 ? 'sine' : 'triangle' })); break;
      case 'bell': this.tone(659, 1.6, { vol: 0.25 }); this.tone(659 * 2.76, 1.0, { vol: 0.07 }); this.tone(659 * 5.4, 0.5, { vol: 0.03 }); break;
      case 'bellLow': this.tone(330, 2, { vol: 0.3 }); this.tone(330 * 2.76, 1.2, { vol: 0.08 }); break;
      case 'coin': this.tone(988, 0.08, { type: 'square', vol: 0.06 }); this.tone(1319, 0.25, { type: 'square', vol: 0.06, when: 0.07 }); break;
      case 'hit': this.noise(0.25, { vol: 0.5, freq: 900, sweep: 0.2 }); this.tone(120, 0.25, { type: 'sine', vol: 0.4, slide: 0.5 }); break;
      case 'fail': this.tone(392, 0.3, { type: 'triangle', vol: 0.2, slide: 0.7 }); this.tone(330, 0.5, { type: 'triangle', vol: 0.2, when: 0.18, slide: 0.6 }); break;
      case 'whoosh': this.noise(0.4, { vol: 0.25, freq: 400, type: 'bandpass', sweep: 6, q: 1.5 }); break;
      case 'splash': this.noise(0.6, { vol: 0.35, freq: 2500, sweep: 0.15 }); break;
      case 'thunder': this.noise(2.2, { vol: 0.7, freq: 300, sweep: 0.3 }); this.tone(55, 1.8, { vol: 0.3, slide: 0.6 }); break;
      case 'card': this.noise(0.12, { vol: 0.25, freq: 3000, type: 'highpass' }); break;
      case 'magic': for (let i = 0; i < 6; i++) this.tone(P[Math.floor(Math.random() * 8)] * 2, 0.4, { vol: 0.06, when: i * 0.05 }); break;
      case 'door': this.noise(1.2, { vol: 0.4, freq: 180, sweep: 0.5 }); this.tone(70, 1.2, { vol: 0.25, slide: 0.8 }); break;
      case 'grow': this.tone(400, 0.35, { vol: 0.15, slide: 2.2 }); break;
      case 'water': for (let i = 0; i < 4; i++) this.tone(rand(900, 1600), 0.08, { vol: 0.08, when: i * 0.05, slide: 1.5 }); break;
      case 'tick': this.tone(1400, 0.04, { type: 'square', vol: 0.04 }); break;
    }
  },
};
addEventListener('pointerdown', () => SFX.unlock(), { capture: true });
addEventListener('keydown', () => SFX.unlock(), { capture: true });

// ---------- Сенсорное управление: джойстик и кнопки ----------
class TouchPad {
  constructor(container, buttons = [], opts = {}) {
    this.ax = 0; this.ay = 0; this.btn = {}; this.pressedOnce = {};
    const root = document.createElement('div');
    root.className = 'touchpad';
    root.innerHTML = `<div class="tp-stick"><div class="tp-knob"></div></div><div class="tp-btns"></div>`;
    container.appendChild(root);
    this.root = root;
    const stick = root.querySelector('.tp-stick'), knob = root.querySelector('.tp-knob');
    if (opts.horizontalOnly) stick.classList.add('h');
    let sid = null, cx = 0, cy = 0;
    const R = 50;
    stick.addEventListener('pointerdown', (e) => {
      sid = e.pointerId; stick.setPointerCapture(sid);
      const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e);
    });
    const move = (e) => {
      if (e.pointerId !== sid) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const l = Math.hypot(dx, dy); if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
      if (opts.horizontalOnly) dy = 0;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.ax = dx / R; this.ay = dy / R;
    };
    const up = (e) => { if (e.pointerId !== sid) return; sid = null; this.ax = this.ay = 0; knob.style.transform = ''; };
    stick.addEventListener('pointermove', move);
    stick.addEventListener('pointerup', up); stick.addEventListener('pointercancel', up);
    const bw = root.querySelector('.tp-btns');
    for (const b of buttons) {
      const el = document.createElement('div');
      el.className = 'tp-btn'; el.textContent = b.label;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.btn[b.id] = true; this.pressedOnce[b.id] = true; el.classList.add('on'); });
      const off = () => { this.btn[b.id] = false; el.classList.remove('on'); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
      bw.appendChild(el);
    }
  }
  once(id) { const v = this.pressedOnce[id]; this.pressedOnce[id] = false; return !!v; }
  destroy() { this.root.remove(); }
}

// Клавиатура: состояние зажатых клавиш + «нажато один раз»
class Keys {
  constructor() {
    this.down = {}; this.hit = {};
    this._d = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (!this.down[e.code]) this.hit[e.code] = true;
      this.down[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    };
    this._u = (e) => { this.down[e.code] = false; };
    addEventListener('keydown', this._d); addEventListener('keyup', this._u);
  }
  any(...codes) { return codes.some((c) => this.down[c]); }
  once(...codes) { let r = false; for (const c of codes) if (this.hit[c]) { r = true; this.hit[c] = false; } return r; }
  destroy() { removeEventListener('keydown', this._d); removeEventListener('keyup', this._u); }
}

// Текст с переносом по ширине
function wrapText(g, text, x, y, maxW, lh) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    lines.push(line);
  }
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
  return lines.length * lh;
}
