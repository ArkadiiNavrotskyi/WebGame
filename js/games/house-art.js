'use strict';
// Арт «Вереска»: рисованные текстуры (обои, доски, кирпич, камень), мебель и предметы из простых форм,
// картины и иллюстрации улик. Всё рисуется кодом — без файлов.
window.HouseArt = (() => {
  const A = {};
  let T = null;
  A.init = () => { T = window.THREE; };

  // ---------- Мазки и грязь: «живописный» вид ----------
  function strokes(g, s, cols, n, len, alpha, wid = 2) {
    const r = RNG(n * 7 + len);
    for (let i = 0; i < n; i++) {
      const x = r() * s, y = r() * s, a = r() * Math.PI, l = len * (0.4 + r());
      g.strokeStyle = cols[Math.floor(r() * cols.length)]; g.globalAlpha = alpha * (0.4 + r() * 0.6); g.lineWidth = wid * (0.5 + r());
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.globalAlpha = 1;
  }
  function grime(g, s, k = 1, seed = 1) {
    const r = RNG(seed * 131);
    for (let i = 0; i < 26 * k; i++) {
      const x = r() * s, y = r() * s, rad = s * (0.05 + r() * 0.22);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(10,8,6,${0.18 * k})`); gr.addColorStop(1, 'rgba(10,8,6,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 14 * k; i++) { // потёки
      const x = r() * s, y0 = r() * s * 0.3, l = s * (0.2 + r() * 0.7);
      const gr = g.createLinearGradient(0, y0, 0, y0 + l); gr.addColorStop(0, `rgba(20,14,8,${0.22 * k})`); gr.addColorStop(1, 'rgba(20,14,8,0)');
      g.fillStyle = gr; g.fillRect(x, y0, 1 + r() * 3, l);
    }
    const gr = g.createLinearGradient(0, s * 0.7, 0, s); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(8,6,4,${0.35 * k})`);
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }
  const cache = new Map();
  A.tex = (key, fn, rep = [1, 1], size = 512) => {
    let base = cache.get(key);
    if (!base) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      fn(c.getContext('2d'), size);
      base = new T.CanvasTexture(c); base.encoding = T.sRGBEncoding; base.anisotropy = 4;
      cache.set(key, base);
    }
    const t = base.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.needsUpdate = true;
    return t;
  };
  A.canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; t.userData = { c }; return t; };

  // ---------- Текстуры поверхностей ----------
  const SURF = {
    damask_green: (g, s) => damask(g, s, '#24372f', '#4d6a55', 3),
    damask_red: (g, s) => damask(g, s, '#3d1a1e', '#6e3036', 5),
    damask_nursery: (g, s) => damask(g, s, '#5a5468', '#8f8aa6', 7),
    wood_floor: (g, s) => planks(g, s, '#3b2618', 11),
    wood_attic: (g, s) => planks(g, s, '#4a3826', 13),
    bricks: (g, s) => bricks(g, s, 17),
    stone: (g, s) => stone(g, s, '#3c4038', 19),
    stone_dark: (g, s) => stone(g, s, '#2b2e2c', 23),
    tiles: (g, s) => tiles(g, s, 29),
    concrete: (g, s) => { g.fillStyle = '#3a3836'; g.fillRect(0, 0, s, s); strokes(g, s, ['#4a4744', '#2c2a28', '#55504a'], 500, 30, 0.35, 3); grime(g, s, 1.2, 31); cracks(g, s, 37); },
    plaster: (g, s) => { g.fillStyle = '#4a4640'; g.fillRect(0, 0, s, s); strokes(g, s, ['#57524a', '#3a3632', '#615b52'], 400, 40, 0.3, 4); grime(g, s, 0.8, 41); cracks(g, s, 43); },
    cloth: (g, s) => { g.fillStyle = '#b8b2a2'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 3) { g.fillStyle = `rgba(0,0,0,${0.04 + (i % 6 ? 0 : 0.03)})`; g.fillRect(0, i, s, 1); g.fillRect(i, 0, 1, s); } grime(g, s, 0.9, 47); },
    damask_blue: (g, s) => damask(g, s, '#1e2a3a', '#45607a', 37),
    metal_plate: (g, s) => { g.fillStyle = '#3a4038'; g.fillRect(0, 0, s, s); strokes(g, s, ['#4a5048', '#2a2e28', '#5a6058'], 400, 60, 0.3, 3); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; g.strokeRect(x * s / 2 + 2, y * s / 2 + 2, s / 2 - 4, s / 2 - 4); g.fillStyle = '#6a7068'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x * s / 2 + 10 + i * (s / 2 - 20) / 5, y * s / 2 + 10, 3, 0, TAU); g.fill(); g.beginPath(); g.arc(x * s / 2 + 10 + i * (s / 2 - 20) / 5, y * s / 2 + s / 2 - 10, 3, 0, TAU); g.fill(); } } grime(g, s, 1.3, 89); },
    lino: (g, s) => { g.fillStyle = '#4a3a2a'; g.fillRect(0, 0, s, s); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#5a4632' : '#3e3022'; g.fillRect(x * s / 4, y * s / 4, s / 4, s / 4); } strokes(g, s, ['#000000', '#6a5440'], 300, 30, 0.12, 2); grime(g, s, 1.2, 97); },
    train_wall: (g, s) => { g.fillStyle = '#5a4a30'; g.fillRect(0, 0, s, s); grain(g, s, '#4a3a22', '#6a5638', 101); g.fillStyle = '#2a3a2e'; g.fillRect(0, s * 0.55, s, s * 0.45); strokes(g, s, ['#1a2a1e', '#3a4a3e'], 200, 30, 0.2, 3); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, s * 0.55, s, 5); g.fillStyle = '#8a7a50'; g.fillRect(0, s * 0.55 - 6, s, 4); grime(g, s, 0.9, 103); },
    wood_panel: (g, s) => { g.fillStyle = '#3a2618'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4; i++) { g.save(); g.beginPath(); g.rect(i * s / 4, 0, s / 4, s); g.clip(); grain(g, s, '#24160c', '#4e3420', 71 + i); g.restore(); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(i * s / 4, 0, 3, s); g.fillStyle = 'rgba(255,220,180,0.08)'; g.fillRect(i * s / 4 + 3, 0, 2, s); } g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, s * 0.62, s, 6); grime(g, s, 0.8, 73); },
    ice: (g, s) => { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, '#9ab8c8'); gr.addColorStop(1, '#4a6878'); g.fillStyle = gr; g.fillRect(0, 0, s, s); strokes(g, s, ['#e8f6ff', '#7a98a8', '#c8e0ee'], 500, 40, 0.35, 2); cracks(g, s, 79); g.globalAlpha = 0.5; cracks(g, s, 83); g.globalAlpha = 1; },
    snow: (g, s) => { g.fillStyle = '#c8d4dc'; g.fillRect(0, 0, s, s); strokes(g, s, ['#ffffff', '#a8b8c4', '#e0e8ee'], 600, 30, 0.4, 4); },
    wood_dark: (g, s) => { g.fillStyle = '#2e1d12'; g.fillRect(0, 0, s, s); grain(g, s, '#1e120a', '#3d2818', 53); },
    wood_mid: (g, s) => { g.fillStyle = '#3e2818'; g.fillRect(0, 0, s, s); grain(g, s, '#24160c', '#52361f', 59); grime(g, s, 0.7, 61); },
  };
  A.surf = (name, rep) => A.tex(name, SURF[name], rep);
  function damask(g, s, base, ink, seed) {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    strokes(g, s, [ink, base, '#000000'], 300, 50, 0.12, 6);
    g.fillStyle = ink; g.globalAlpha = 0.5;
    for (let x = 0; x < s; x += s / 8) { g.fillRect(x, 0, 2, s); }
    const motif = (cx, cy, k) => {
      g.save(); g.translate(cx, cy); g.scale(k, k);
      for (const sx of [-1, 1]) {
        g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(sx * 22, -26, sx * 26, -6, sx * 8, 4); g.bezierCurveTo(sx * 24, 10, sx * 18, 30, 0, 34); g.fill();
        g.beginPath(); g.arc(sx * 18, -18, 4, 0, TAU); g.fill();
      }
      g.beginPath(); g.moveTo(0, -42); g.lineTo(5, -30); g.lineTo(-5, -30); g.fill();
      g.restore();
    };
    for (let y = 0; y < s + 64; y += s / 4) for (let x = 0; x < s + 64; x += s / 4) { motif(x, y, s / 512); motif(x + s / 8, y + s / 8, s / 700); }
    g.globalAlpha = 1;
    // отставшие обои
    const r = RNG(seed);
    for (let i = 0; i < 5; i++) { const x = r() * s, y = r() * s, w = 20 + r() * 50, h = 30 + r() * 90; g.fillStyle = 'rgba(160,140,110,0.18)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + r() * 10); g.lineTo(x + w * 0.7, y + h); g.lineTo(x + r() * 10, y + h * 0.8); g.fill(); }
    grime(g, s, 1.1, seed);
  }
  function grain(g, s, dark, light, seed) {
    const r = RNG(seed);
    for (let i = 0; i < 160; i++) { const y = r() * s; g.strokeStyle = r() < 0.5 ? dark : light; g.globalAlpha = 0.3 + r() * 0.4; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); g.stroke(); }
    g.globalAlpha = 1;
  }
  function planks(g, s, base, seed) {
    const r = RNG(seed); const n = 6, h = s / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = mixColor(base, r() < 0.5 ? '#000000' : '#6a4a30', r() * 0.3); g.fillRect(0, i * h, s, h);
      g.save(); g.beginPath(); g.rect(0, i * h, s, h); g.clip(); grain(g, s, mixColor(base, '#000000', 0.4), mixColor(base, '#ffffff', 0.12), seed + i); g.restore();
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, i * h, s, 2);
      const cut = r() * s; g.fillRect(cut, i * h, 2, h);
    }
    grime(g, s, 0.9, seed);
  }
  function bricks(g, s, seed) {
    const r = RNG(seed); const rows = 10, bh = s / rows, bw = s / 4;
    g.fillStyle = '#2a2420'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2;
      g.fillStyle = mixColor('#6a3a2a', r() < 0.5 ? '#2a1a14' : '#8a5a3a', r() * 0.5);
      g.fillRect(x * bw + ox + 2, y * bh + 2, bw - 4, bh - 4);
    }
    strokes(g, s, ['#000000', '#8a6a5a'], 300, 20, 0.15, 2);
    grime(g, s, 1.4, seed);
  }
  function stone(g, s, base, seed) {
    const r = RNG(seed);
    g.fillStyle = '#1a1c1a'; g.fillRect(0, 0, s, s);
    let y = 0;
    while (y < s) {
      const h = s / 6 + r() * s / 10; let x = -r() * 40;
      while (x < s) { const w = s / 4 + r() * s / 5; g.fillStyle = mixColor(base, r() < 0.5 ? '#000000' : '#6a7a60', r() * 0.35); roundRect(g, x + 3, y + 3, w - 6, h - 6, 8); g.fill(); x += w; }
      y += h;
    }
    strokes(g, s, ['#000000', '#5a6a50', '#3a4a3a'], 400, 25, 0.18, 3);
    grime(g, s, 1.3, seed);
  }
  function tiles(g, s, seed) {
    const n = 8, t = s / n, r = RNG(seed);
    g.fillStyle = '#3a3a36'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = mixColor('#a8a69a', '#5a5a50', r() * 0.35); g.fillRect(x * t + 2, y * t + 2, t - 4, t - 4); }
    for (let i = 0; i < 18; i++) { const x = r() * s, y = r() * s * 0.6, l = 40 + r() * 200; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(110,60,30,0.45)'); gr.addColorStop(1, 'rgba(110,60,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 5, l); }
    grime(g, s, 1.2, seed);
  }
  function cracks(g, s, seed) {
    const r = RNG(seed); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 40; y += (r() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); }
  }

  // ---------- Материалы ----------
  const mats = {};
  A.mat = (name) => {
    if (mats[name]) return mats[name];
    const S = (o) => new T.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
    const m = {
      wood: () => S({ map: A.surf('wood_dark', [1, 1]), roughness: 0.7 }),
      woodMid: () => S({ map: A.surf('wood_mid', [1, 1]), roughness: 0.75 }),
      brass: () => S({ color: '#b08a3a', metalness: 0.75, roughness: 0.35 }),
      iron: () => S({ color: '#3a3a3e', metalness: 0.6, roughness: 0.55 }),
      rust: () => S({ color: '#3a2219', metalness: 0.35, roughness: 0.75 }),
      black: () => S({ color: '#121012', roughness: 0.6 }),
      porcelain: () => S({ color: '#cfc8b8', roughness: 0.35 }),
      cloth: () => S({ map: A.surf('cloth', [1, 1]), side: T.DoubleSide }),
      wax: () => S({ color: '#e8dcc0', roughness: 0.6, emissive: '#3a2a10', emissiveIntensity: 0.3 }),
      paper: () => S({ color: '#d8ccb0', roughness: 0.9 }),
      red: () => S({ color: '#5a1a1e', roughness: 0.6 }),
      green: () => S({ color: '#1e3a2c', roughness: 0.6 }),
      pipe: () => S({ color: '#4a4440', metalness: 0.5, roughness: 0.6 }),
      flame: () => new T.MeshBasicMaterial({ color: '#ffb35a' }),
      bulbOff: () => S({ color: '#6a6458', roughness: 0.3 }),
    }[name];
    mats[name] = m();
    return mats[name];
  };

  // ---------- Строители ----------
  const B = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const C = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 16) => { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  A.B = B; A.C = C;
  const glowTex = () => A.tex('glow', (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, [1, 1], 64);
  A.glow = (color, size, op = 0.8) => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false })); s.scale.set(size, size, 1); return s; };

  // Свечи: возвращает группу, огоньки мерцают через userData.flames
  A.candles = (n = 3, spread = 0.18, light = true) => {
    const g = new T.Group(), r = RNG(n * 3 + spread * 100); g.userData.flames = [];
    for (let i = 0; i < n; i++) {
      const h = 0.12 + r() * 0.18, x = (r() - 0.5) * spread * 2, z = (r() - 0.5) * spread;
      g.add(C(0.025, 0.028, h, A.mat('wax'), x, h / 2, z, 8));
      const f = new T.Mesh(new T.ConeGeometry(0.014, 0.05, 6), A.mat('flame')); f.position.set(x, h + 0.03, z); g.add(f);
      const gl = A.glow('#ffb35a', 0.22, 0.7); gl.position.copy(f.position); g.add(gl);
      g.userData.flames.push(f, gl);
    }
    if (light) { const p = new T.PointLight('#ffa040', 1.4, 5, 2); p.position.y = 0.4; g.add(p); g.userData.light = p; }
    return g;
  };

  A.door = (w = 1.05, h = 2.2, mat = A.mat('wood'), metal = A.mat('brass')) => {
    const g = new T.Group();
    g.add(B(w + 0.2, 0.12, 0.12, mat, 0, h + 0.06, 0), B(0.1, h, 0.12, mat, -w / 2 - 0.05, h / 2, 0), B(0.1, h, 0.12, mat, w / 2 + 0.05, h / 2, 0));
    const leaf = new T.Group(); leaf.position.x = -w / 2;
    leaf.add(B(w, h, 0.06, mat, w / 2, h / 2, 0));
    for (const yy of [h * 0.28, h * 0.7]) leaf.add(B(w * 0.7, h * 0.3, 0.02, A.mat('woodMid'), w / 2, yy, 0.035));
    const knob = new T.Mesh(new T.SphereGeometry(0.04, 12, 10), metal); knob.position.set(w * 0.85, h * 0.47, 0.07); leaf.add(knob);
    g.add(leaf); g.userData.leaf = leaf;
    return g;
  };
  A.window = (w = 1.1, h = 1.5, tint = '#5e6e76') => {
    const g = new T.Group(), fm = A.mat('wood');
    const fog = new T.MeshBasicMaterial({ map: A.tex('fogwin', (gg, s) => { const gr = gg.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#9fb4bc'); gr.addColorStop(1, '#4a5e66'); gg.fillStyle = gr; gg.fillRect(0, 0, s, s); strokes(gg, s, ['#cfdde2', '#6a8088'], 200, 80, 0.25, 8); for (let i = 0; i < 40; i++) { gg.fillStyle = 'rgba(30,40,45,0.25)'; gg.fillRect(Math.random() * s, s * 0.6 + Math.random() * s * 0.4, 2, -Math.random() * 120); } }), color: tint });
    const glass = new T.Mesh(new T.PlaneGeometry(w, h), fog); glass.position.set(0, 1.0 + h / 2, -0.02); g.add(glass);
    g.add(B(w + 0.16, 0.08, 0.14, fm, 0, 1.0, 0), B(w + 0.16, 0.08, 0.14, fm, 0, 1.0 + h, 0), B(0.08, h, 0.14, fm, -w / 2 - 0.04, 1.0 + h / 2, 0), B(0.08, h, 0.14, fm, w / 2 + 0.04, 1.0 + h / 2, 0));
    g.add(B(0.04, h, 0.06, fm, 0, 1.0 + h / 2, 0), B(w, 0.04, 0.06, fm, 0, 1.0 + h * 0.55, 0));
    const l = new T.PointLight('#8fb0c0', 0.9, 6, 2); l.position.set(0, 1.0 + h / 2, 0.5); g.add(l);
    g.userData.glass = glass;
    return g;
  };
  A.painting = (w, h, draw, frame = A.mat('brass')) => {
    const g = new T.Group();
    const tx = A.canvasTex(Math.round(w * 400), Math.round(h * 400), draw);
    const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx, roughness: 0.75 })); pic.position.z = 0.03; g.add(pic);
    const t = 0.08;
    g.add(B(w + t * 2, t, 0.06, frame, 0, h / 2 + t / 2, 0), B(w + t * 2, t, 0.06, frame, 0, -h / 2 - t / 2, 0), B(t, h, 0.06, frame, -w / 2 - t / 2, 0, 0), B(t, h, 0.06, frame, w / 2 + t / 2, 0, 0));
    g.userData.pic = pic;
    return g;
  };
  A.clock = (faceDraw) => {
    const g = new T.Group(), m = A.mat('wood');
    g.add(B(0.62, 0.3, 0.42, m, 0, 0.15, 0), B(0.48, 1.3, 0.34, m, 0, 0.95, 0), B(0.64, 0.62, 0.44, m, 0, 1.9, 0));
    g.add(B(0.7, 0.1, 0.48, m, 0, 2.25, 0));
    const face = A.canvasTex(256, 256, faceDraw);
    const fm = new T.Mesh(new T.CircleGeometry(0.22, 32), new T.MeshStandardMaterial({ map: face, roughness: 0.5 })); fm.position.set(0, 1.92, 0.225); g.add(fm);
    const door = new T.Group(); door.position.set(-0.17, 0.95, 0.175);
    door.add(B(0.34, 1.0, 0.03, A.mat('woodMid'), 0.17, 0, 0));
    const glass = new T.Mesh(new T.PlaneGeometry(0.2, 0.6), new T.MeshStandardMaterial({ color: '#203030', transparent: true, opacity: 0.6, roughness: 0.1 })); glass.position.set(0.17, 0.1, 0.02); door.add(glass);
    g.add(door);
    const pend = C(0.07, 0.07, 0.02, A.mat('brass'), 0, 0.7, 0.12); pend.rotation.x = Math.PI / 2; g.add(pend);
    g.userData = { face, faceMesh: fm, door, pend };
    return g;
  };
  A.desk = (w = 1.4, lamp = true) => {
    const g = new T.Group(), m = A.mat('wood');
    g.add(B(w, 0.06, 0.7, m, 0, 0.76, 0), B(0.38, 0.73, 0.64, m, -w / 2 + 0.2, 0.365, 0), B(0.38, 0.73, 0.64, m, w / 2 - 0.2, 0.365, 0));
    const drawer = B(w - 0.84, 0.14, 0.62, A.mat('woodMid'), 0, 0.66, 0.02); g.add(drawer);
    const k = new T.Mesh(new T.SphereGeometry(0.025, 8, 8), A.mat('brass')); k.position.set(0, 0.66, 0.34); g.add(k);
    if (lamp) {
      g.add(C(0.06, 0.08, 0.03, A.mat('brass'), w / 2 - 0.25, 0.8, -0.15), C(0.012, 0.012, 0.3, A.mat('brass'), w / 2 - 0.25, 0.95, -0.15));
      const sh = new T.Mesh(new T.CylinderGeometry(0.06, 0.16, 0.12, 16, 1, true), new T.MeshStandardMaterial({ color: '#1e4a2e', side: T.DoubleSide, roughness: 0.4, emissive: '#0a2a10', emissiveIntensity: 0.6 }));
      sh.position.set(w / 2 - 0.25, 1.12, -0.15); g.add(sh);
      const l = new T.PointLight('#ffc070', 1.2, 4.5, 2); l.position.set(w / 2 - 0.25, 1.02, -0.1); g.add(l); g.userData.light = l;
      const gl = A.glow('#ffc070', 0.6, 0.6); gl.position.set(w / 2 - 0.25, 1.05, -0.15); g.add(gl);
    }
    g.userData.drawer = drawer;
    return g;
  };
  A.bookshelf = (w = 2.2, h = 2.4, special) => {
    const g = new T.Group(), m = A.mat('wood'), r = RNG(w * 100 + h);
    g.add(B(w, h, 0.05, m, 0, h / 2, -0.17), B(0.06, h, 0.38, m, -w / 2, h / 2, 0), B(0.06, h, 0.38, m, w / 2, h / 2, 0));
    const shelves = 5, sh = h / shelves;
    g.userData.books = [];
    for (let i = 0; i <= shelves; i++) g.add(B(w, 0.04, 0.38, m, 0, i * sh + 0.02, 0));
    const pal = ['#3a1a14', '#1e2a24', '#2a2030', '#4a3a24', '#1a1a1e', '#3a2a1a', '#2a3438'];
    for (let i = 0; i < shelves; i++) {
      let x = -w / 2 + 0.06;
      const isSpecial = special && i === 2;
      let si = 0;
      while (x < w / 2 - 0.12) {
        const bw = 0.04 + r() * 0.05, bh = sh * (0.6 + r() * 0.3);
        let col = pal[Math.floor(r() * pal.length)];
        if (isSpecial && x > -w / 2 + 0.3 && si < special.length && r() < 0.5) { col = special[si].c; }
        const b = B(bw, bh, 0.26, new T.MeshStandardMaterial({ color: col, roughness: 0.8 }), x + bw / 2, i * sh + 0.04 + bh / 2, 0.02);
        if (isSpecial && col === (special[si] || {}).c) { b.userData.book = special[si].id; g.userData.books.push(b); si++; }
        if (r() < 0.06) b.rotation.z = 0.2;
        g.add(b); x += bw + 0.005;
      }
    }
    return g;
  };
  A.bed = (w = 1.0, l = 1.9, child = false) => {
    const g = new T.Group(), m = A.mat('wood');
    g.add(B(w, 0.3, l, m, 0, 0.25, 0), B(w + 0.06, child ? 0.9 : 1.1, 0.06, m, 0, child ? 0.45 : 0.55, -l / 2));
    g.add(B(w - 0.06, 0.16, l - 0.1, A.mat('cloth'), 0, 0.48, 0.02));
    g.add(B(w * 0.6, 0.1, 0.32, A.mat('cloth'), 0, 0.6, -l / 2 + 0.25));
    const bl = B(w + 0.04, 0.05, l * 0.6, new T.MeshStandardMaterial({ color: child ? '#6a5a7a' : '#4a3a3a', roughness: 0.9 }), 0, 0.58, l * 0.18); g.add(bl);
    return g;
  };
  A.wardrobe = () => {
    const g = new T.Group(), m = A.mat('wood');
    g.add(B(1.2, 2.1, 0.6, m, 0, 1.05, 0), B(1.3, 0.1, 0.66, m, 0, 2.15, 0));
    const dl = B(0.58, 1.9, 0.04, A.mat('woodMid'), -0.3, 1.05, 0.31), dr = B(0.58, 1.9, 0.04, A.mat('woodMid'), 0.3, 1.05, 0.31);
    g.add(dl, dr);
    const lock = B(0.1, 0.14, 0.05, A.mat('brass'), 0, 1.05, 0.35); g.add(lock);
    g.userData = { dl, dr, lock };
    return g;
  };
  A.chandelier = () => {
    const g = new T.Group();
    g.add(C(0.01, 0.01, 0.7, A.mat('iron'), 0, -0.35, 0, 6));
    const ring = new T.Mesh(new T.TorusGeometry(0.4, 0.02, 6, 24), A.mat('brass')); ring.rotation.x = Math.PI / 2; ring.position.y = -0.7; g.add(ring);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const c = A.candles(1, 0, false); c.position.set(Math.cos(a) * 0.4, -0.7, Math.sin(a) * 0.4); g.add(c); g.userData.flames = (g.userData.flames || []).concat(c.userData.flames); }
    const l = new T.PointLight('#ffb060', 1.3, 8, 2); l.position.y = -0.8; g.add(l); g.userData.light = l;
    return g;
  };
  A.bulb = () => {
    const g = new T.Group();
    g.add(C(0.006, 0.006, 0.6, A.mat('black'), 0, -0.3, 0, 4));
    const b = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), A.mat('bulbOff')); b.position.y = -0.63; g.add(b);
    const gl = A.glow('#ffc070', 0.9, 0); gl.position.y = -0.63; g.add(gl);
    const l = new T.PointLight('#ffb870', 0, 7, 2); l.position.y = -0.7; g.add(l);
    g.userData = { b, gl, l };
    return g;
  };
  A.boiler = () => {
    const g = new T.Group();
    const body = C(0.7, 0.7, 2.0, A.mat('rust'), 0, 1.0, 0, 24); g.add(body);
    for (const y of [0.3, 1.0, 1.7]) g.add(C(0.72, 0.72, 0.06, A.mat('iron'), 0, y, 0, 24));
    const door = B(0.42, 0.42, 0.06, A.mat('iron'), 0, 0.55, 0.69); g.add(door);
    const fire = A.glow('#ff6a20', 0.7, 0.0); fire.position.set(0, 0.55, 0.75); g.add(fire);
    g.add(C(0.12, 0.12, 1.6, A.mat('pipe'), 0.45, 2.6, -0.2, 10));
    const gauges = [];
    for (let i = 0; i < 4; i++) {
      const gg = new T.Group(); gg.position.set(-0.36 + i * 0.24, 1.35, 0.68);
      gg.add(C(0.09, 0.09, 0.04, A.mat('brass'), 0, 0, 0, 16)); gg.children[0].rotation.x = Math.PI / 2;
      const face = new T.Mesh(new T.CircleGeometry(0.075, 20), A.mat('porcelain')); face.position.z = 0.025; gg.add(face);
      const needle = B(0.008, 0.06, 0.004, A.mat('red'), 0, 0.02, 0.03); gg.add(needle);
      g.add(gg); gauges.push(needle);
    }
    g.userData = { fire, gauges };
    return g;
  };
  A.box = (w, h, d, matName = 'wood') => { const g = new T.Group(); g.add(B(w, h, d, A.mat(matName), 0, h / 2, 0)); return g; };
  A.workbench = () => {
    const g = new T.Group(), m = A.mat('woodMid');
    g.add(B(1.6, 0.08, 0.7, m, 0, 0.9, 0));
    for (const x of [-0.75, 0.75]) for (const z of [-0.3, 0.3]) g.add(B(0.07, 0.9, 0.07, m, x, 0.45, z));
    const drawer = B(0.5, 0.16, 0.6, A.mat('wood'), 0.4, 0.78, 0.02); g.add(drawer);
    const lock = B(0.12, 0.06, 0.03, A.mat('brass'), 0.4, 0.78, 0.33); g.add(lock);
    g.add(B(0.3, 0.12, 0.14, A.mat('iron'), -0.5, 1.0, -0.1), C(0.02, 0.02, 0.3, A.mat('woodMid'), -0.2, 0.96, 0.1, 6));
    g.userData = { drawer };
    return g;
  };
  A.fusebox = () => {
    const g = new T.Group();
    g.add(B(0.5, 0.7, 0.16, A.mat('iron'), 0, 1.5, 0));
    const door = B(0.46, 0.66, 0.02, A.mat('pipe'), 0, 1.5, 0.09); g.add(door);
    const led = new T.Mesh(new T.SphereGeometry(0.02, 8, 8), new T.MeshBasicMaterial({ color: '#401010' })); led.position.set(0.17, 1.78, 0.1); g.add(led);
    g.add(C(0.015, 0.015, 1.2, A.mat('pipe'), 0.1, 2.4, 0, 6));
    g.userData = { led };
    return g;
  };
  A.dumbwaiter = () => {
    const g = new T.Group(), m = A.mat('wood');
    g.add(B(0.9, 0.08, 0.2, m, 0, 1.75, 0), B(0.9, 0.08, 0.2, m, 0, 0.85, 0), B(0.08, 0.98, 0.2, m, -0.45, 1.3, 0), B(0.08, 0.98, 0.2, m, 0.45, 1.3, 0));
    const hole = new T.Mesh(new T.PlaneGeometry(0.82, 0.82), new T.MeshBasicMaterial({ color: '#050404' })); hole.position.set(0, 1.3, -0.08); g.add(hole);
    const cab = new T.Group(); cab.add(B(0.76, 0.04, 0.5, A.mat('woodMid'), 0, 0, -0.25)); cab.add(B(0.76, 0.4, 0.04, A.mat('woodMid'), 0, 0.2, -0.48)); cab.position.y = 0.91; g.add(cab);
    for (const x of [-0.2, 0.2]) g.add(C(0.008, 0.008, 1.0, A.mat('cloth'), x, 1.4, -0.3, 4));
    const crank = new T.Group(); crank.position.set(0.6, 1.3, 0); crank.add(C(0.07, 0.07, 0.05, A.mat('iron'), 0, 0, 0, 12)); crank.children[0].rotation.x = Math.PI / 2;
    const handle = B(0.03, 0.22, 0.03, A.mat('iron'), 0, 0.1, 0.04); crank.add(handle); handle.visible = false; g.add(crank);
    g.userData = { cab, handle, crank };
    return g;
  };
  A.phonograph = () => {
    const g = new T.Group();
    g.add(B(0.6, 0.7, 0.5, A.mat('wood'), 0, 0.35, 0), B(0.5, 0.18, 0.42, A.mat('woodMid'), 0, 0.79, 0));
    const disc = C(0.17, 0.17, 0.01, A.mat('black'), 0, 0.885, 0, 24); disc.visible = false; g.add(disc);
    g.add(C(0.18, 0.18, 0.01, A.mat('iron'), 0, 0.88, 0, 24));
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new T.Vector2(0.02 + Math.pow(t, 2.4) * 0.32, t * 0.55)); }
    const horn = new T.Mesh(new T.LatheGeometry(pts, 20), new T.MeshStandardMaterial({ color: '#7a5a30', metalness: 0.6, roughness: 0.35, side: T.DoubleSide }));
    horn.position.set(0.12, 0.95, -0.1); horn.rotation.z = -0.9; horn.rotation.y = 0.3; g.add(horn);
    g.userData = { disc };
    return g;
  };
  A.safe = (paintDraw) => {
    const g = new T.Group();
    const safe = new T.Group(); safe.add(B(0.6, 0.6, 0.1, A.mat('iron'), 0, 0, -0.02));
    const sdoor = new T.Group(); sdoor.position.set(-0.26, 0, 0.04); sdoor.add(B(0.52, 0.52, 0.04, A.mat('iron'), 0.26, 0, 0));
    const dial = C(0.07, 0.07, 0.03, A.mat('brass'), 0.26, 0, 0.03, 20); dial.rotation.x = Math.PI / 2; sdoor.add(dial);
    safe.add(sdoor); g.add(safe);
    const p = A.painting(0.8, 1.0, paintDraw);
    const hinge = new T.Group(); hinge.position.set(-0.45, 0, 0.08); p.position.x = 0.45; hinge.add(p); g.add(hinge);
    g.userData = { hinge, sdoor };
    return g;
  };
  A.fireplace = () => {
    const g = new T.Group(), st = new T.MeshStandardMaterial({ map: A.surf('stone_dark', [1, 1]), roughness: 0.9 });
    g.add(B(1.6, 0.14, 0.5, st, 0, 1.25, 0), B(0.3, 1.2, 0.4, st, -0.65, 0.6, 0), B(0.3, 1.2, 0.4, st, 0.65, 0.6, 0));
    const back = new T.Mesh(new T.PlaneGeometry(1.0, 1.1), A.mat('black')); back.position.set(0, 0.55, -0.15); g.add(back);
    const ash = A.glow('#ff5a20', 0.5, 0.25); ash.position.set(0, 0.1, 0); g.add(ash);
    g.userData.ash = ash;
    return g;
  };
  A.sheet = (w, h, col) => {
    const geo = new T.PlaneGeometry(w, h, 6, 6);
    const tx = A.canvasTex(256, 320, (g, W, H) => { g.drawImage(A.tex('cloth', SURF.cloth).image, 0, 0, W, H); if (col) { g.strokeStyle = col.c; g.lineWidth = 6; g.font = 'italic 700 90px Georgia'; g.fillStyle = col.c; g.fillText(col.l, W / 2 - 30, H * 0.55); for (let i = 0; i < col.n; i++) { g.beginPath(); g.arc(W / 2 - (col.n - 1) * 12 + i * 24, H * 0.75, 6, 0, TAU); g.fill(); } } });
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tx, side: T.DoubleSide, roughness: 0.95 }));
    m.castShadow = true; m.userData.base = geo.attributes.position.array.slice();
    return m;
  };
  A.tub = () => {
    const g = new T.Group();
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector2(0.38 + Math.sin(t * Math.PI / 2) * 0.06, t * 0.55)); }
    const body = new T.Mesh(new T.LatheGeometry(pts, 24), new T.MeshStandardMaterial({ color: '#b8b0a0', roughness: 0.4, side: T.DoubleSide }));
    body.scale.set(1, 1, 2.1); body.position.y = 0.12; body.castShadow = true; g.add(body);
    const water = new T.Mesh(new T.CircleGeometry(0.42, 24), new T.MeshStandardMaterial({ color: '#0a0806', roughness: 0.05, metalness: 0.3 }));
    water.rotation.x = -Math.PI / 2; water.scale.set(1, 2.05, 1); water.position.y = 0.55; g.add(water);
    for (const x of [-0.3, 0.3]) for (const z of [-0.65, 0.65]) g.add(C(0.04, 0.02, 0.14, A.mat('brass'), x, 0.07, z, 8));
    g.userData = { water };
    return g;
  };
  A.ironDoor = (w = 1.3, h = 2.3) => {
    const g = new T.Group(), m = A.mat('iron');
    g.add(B(w + 0.3, 0.2, 0.2, A.mat('rust'), 0, h + 0.1, 0));
    const leaf = new T.Group(); leaf.add(B(w, h, 0.1, m, 0, h / 2, 0));
    for (let i = 0; i < 5; i++) leaf.add(B(w, 0.05, 0.13, A.mat('rust'), 0, 0.3 + i * 0.45, 0));
    const rec = new T.Mesh(new T.TorusGeometry(0.12, 0.03, 8, 24), A.mat('brass')); rec.position.set(0, 1.3, 0.07); leaf.add(rec);
    const med = C(0.1, 0.1, 0.03, A.mat('brass'), 0, 1.3, 0.07, 20); med.rotation.x = Math.PI / 2; med.visible = false; leaf.add(med);
    g.add(leaf); g.userData = { leaf, med };
    return g;
  };
  A.radio = () => { const g = new T.Group(); g.add(B(0.4, 0.26, 0.2, A.mat('woodMid'), 0, 0.13, 0)); const sp = new T.Mesh(new T.CircleGeometry(0.07, 16), A.mat('cloth')); sp.position.set(-0.08, 0.14, 0.101); g.add(sp); g.add(C(0.02, 0.02, 0.02, A.mat('brass'), 0.1, 0.14, 0.11, 10)); return g; };
  A.dollhouse = () => {
    const g = new T.Group(), m = A.mat('woodMid');
    g.add(B(0.8, 0.75, 0.04, A.mat('wood'), 0, 0.375, 0), B(0.9, 0.04, 0.5, m, 0, 0, 0.2));
    for (const y of [0.25, 0.5]) g.add(B(0.8, 0.02, 0.4, m, 0, y, 0.2));
    g.add(B(0.02, 0.75, 0.4, m, 0, 0.375, 0.2), B(0.02, 0.75, 0.4, m, -0.4, 0.375, 0.2), B(0.02, 0.75, 0.4, m, 0.4, 0.375, 0.2));
    const roof = new T.Group(); roof.position.set(0, 0.75, 0.2);
    const r1 = B(0.6, 0.02, 0.44, A.mat('red'), -0.21, 0.15, 0); r1.rotation.z = 0.55; const r2 = r1.clone(); r2.position.x = 0.21; r2.rotation.z = -0.55; roof.add(r1, r2);
    g.add(roof);
    const r = RNG(5); for (let i = 0; i < 6; i++) g.add(B(0.08, 0.08, 0.08, new T.MeshStandardMaterial({ color: ['#6a3a3a', '#3a4a6a', '#6a6a4a'][i % 3] }), -0.3 + (i % 3) * 0.3 + r() * 0.05, 0.07 + Math.floor(i / 3) * 0.25, 0.25));
    g.userData = { roof };
    return g;
  };
  A.musicbox = () => {
    const g = new T.Group();
    g.add(B(0.3, 0.14, 0.2, A.mat('red'), 0, 0.07, 0));
    const lid = new T.Group(); lid.position.set(0, 0.14, -0.1); lid.add(B(0.31, 0.03, 0.21, A.mat('red'), 0, 0.015, 0.1)); g.add(lid);
    const dancer = new T.Group(); dancer.add(C(0.005, 0.005, 0.08, A.mat('brass'), 0, 0.04, 0, 4)); const s = new T.Mesh(new T.ConeGeometry(0.03, 0.05, 10), A.mat('porcelain')); s.position.y = 0.08; dancer.add(s); const hd = new T.Mesh(new T.SphereGeometry(0.012, 8, 8), A.mat('porcelain')); hd.position.y = 0.115; dancer.add(hd);
    dancer.position.y = 0.14; dancer.visible = false; g.add(dancer);
    g.userData = { lid, dancer };
    return g;
  };
  A.rockingHorse = () => {
    const g = new T.Group(), rock = new T.Group(), m = A.mat('woodMid');
    const arc = new T.Mesh(new T.TorusGeometry(0.5, 0.025, 6, 20, 1.2), m); arc.rotation.z = Math.PI + 0.97; arc.position.y = 0.5; rock.add(arc);
    rock.add(B(0.5, 0.18, 0.16, m, 0, 0.4, 0), B(0.14, 0.28, 0.12, m, 0.24, 0.6, 0), B(0.22, 0.1, 0.1, m, 0.34, 0.7, 0));
    for (const x of [-0.18, 0.18]) for (const z of [-0.05, 0.05]) rock.add(B(0.03, 0.2, 0.03, m, x, 0.22, z));
    g.add(rock); g.userData.rock = rock;
    return g;
  };
  A.altar = () => {
    const g = new T.Group(), st = new T.MeshStandardMaterial({ map: A.surf('stone', [1, 1]), roughness: 0.9 });
    g.add(B(1.6, 0.95, 0.7, st, 0, 0.475, 0), B(1.75, 0.08, 0.8, st, 0, 0.99, 0));
    const cloth = B(1.2, 0.02, 0.82, A.mat('red'), 0, 1.04, 0); g.add(cloth);
    const cross = new T.Group(); cross.add(B(0.04, 0.5, 0.04, A.mat('brass'), 0, 1.3, -0.25), B(0.24, 0.04, 0.04, A.mat('brass'), 0, 1.42, -0.25)); g.add(cross);
    const cand = [];
    for (const x of [-0.6, -0.3, 0.3, 0.6]) { const c = A.candles(2, 0.06, false); c.position.set(x, 1.03, 0); g.add(c); cand.push(c); }
    const l = new T.PointLight('#ffa040', 0, 6, 2); l.position.set(0, 1.5, 0.3); g.add(l);
    g.userData = { cand, light: l };
    return g;
  };
  A.stainedGlass = (draw) => {
    const g = new T.Group();
    const tx = A.canvasTex(300, 500, draw);
    const shape = new T.Shape(); shape.moveTo(-0.6, 0); shape.lineTo(0.6, 0); shape.lineTo(0.6, 1.4); shape.absarc(0, 1.4, 0.6, 0, Math.PI, false); shape.lineTo(-0.6, 0);
    const geo = new T.ShapeGeometry(shape, 24);
    geo.computeBoundingBox(); const uv = geo.attributes.uv, p = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 0.6) / 1.2, p.getY(i) / 2.0);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tx, transparent: true }));
    g.add(m); g.userData = { tex: tx, mesh: m };
    return g;
  };
  A.organ = () => {
    const g = new T.Group();
    g.add(B(1.6, 1.0, 0.7, A.mat('wood'), 0, 0.5, 0), B(1.4, 0.06, 0.25, A.mat('porcelain'), 0, 0.95, 0.3));
    for (let i = 0; i < 9; i++) { const hh = 1.2 + Math.sin(i / 8 * Math.PI) * 1.0; g.add(C(0.06, 0.06, hh, A.mat('brass'), -0.6 + i * 0.15, 1.0 + hh / 2, -0.2, 12)); }
    return g;
  };
  A.pew = () => { const g = new T.Group(), m = A.mat('wood'); g.add(B(2.0, 0.06, 0.45, m, 0, 0.45, 0), B(2.0, 0.6, 0.05, m, 0, 0.75, -0.2), B(0.06, 0.45, 0.45, m, -0.97, 0.22, 0), B(0.06, 0.45, 0.45, m, 0.97, 0.22, 0)); return g; };
  A.grate = (w = 1.0, h = 2.0) => {
    const g = new T.Group(); const leaf = new T.Group();
    for (let i = 0; i < 7; i++) leaf.add(C(0.02, 0.02, h, A.mat('rust'), -w / 2 + 0.08 + i * (w - 0.16) / 6, h / 2, 0, 6));
    for (const y of [0.2, h / 2, h - 0.2]) leaf.add(B(w, 0.05, 0.05, A.mat('rust'), 0, y, 0));
    g.add(leaf); g.userData.leaf = leaf;
    return g;
  };
  A.niches = () => {
    const g = new T.Group(), st = new T.MeshStandardMaterial({ map: A.surf('stone_dark', [1, 1]), roughness: 0.9 });
    g.add(B(3.2, 2.2, 0.3, st, 0, 1.1, -0.1));
    for (let i = 0; i < 4; i++) {
      const x = -1.15 + i * 0.77;
      const hole = new T.Mesh(new T.PlaneGeometry(0.6, 0.4), A.mat('black')); hole.position.set(x, 1.4, 0.06); g.add(hole);
      const pl = new T.Mesh(new T.PlaneGeometry(0.5, 0.16), A.mat('brass')); pl.position.set(x, 1.05, 0.07); g.add(pl);
      if (i < 3) { const sk = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), A.mat('porcelain')); sk.position.set(x, 1.32, 0.0); sk.scale.set(1, 0.9, 1); g.add(sk); }
    }
    return g;
  };
  A.mosaic = (draw) => { const tx = A.canvasTex(512, 512, draw); const m = new T.Mesh(new T.CircleGeometry(1.0, 40), new T.MeshStandardMaterial({ map: tx, roughness: 0.6 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.01; m.receiveShadow = true; return m; };
  A.chest = () => {
    const g = new T.Group();
    g.add(B(1.0, 0.5, 0.55, A.mat('wood'), 0, 0.25, 0));
    for (const x of [-0.4, 0.4]) g.add(B(0.05, 0.52, 0.57, A.mat('iron'), x, 0.25, 0));
    const lid = new T.Group(); lid.position.set(0, 0.5, -0.275); lid.add(B(1.02, 0.12, 0.57, A.mat('wood'), 0, 0.06, 0.275)); g.add(lid);
    const rings = new T.Group(); rings.position.set(0, 0.28, 0.29);
    for (const r of [0.06, 0.1, 0.14]) { const t = new T.Mesh(new T.TorusGeometry(r, 0.012, 6, 28), A.mat('brass')); rings.add(t); }
    g.add(rings);
    g.userData = { lid, rings };
    return g;
  };
  A.mannequin = () => {
    const g = new T.Group(), m = new T.MeshStandardMaterial({ color: '#b8ab96', roughness: 0.6 });
    g.add(C(0.02, 0.02, 1.0, A.mat('black'), 0, 0.5, 0, 6), C(0.16, 0.12, 0.08, A.mat('black'), 0, 0.04, 0, 12));
    const torso = C(0.17, 0.12, 0.6, m, 0, 1.25, 0, 14); torso.scale.z = 0.7; g.add(torso);
    const head = new T.Mesh(new T.SphereGeometry(0.11, 14, 12), m); head.position.y = 1.7; head.scale.set(0.9, 1.15, 0.95); g.add(head);
    g.add(C(0.04, 0.05, 0.1, m, 0, 1.58, 0, 8));
    return g;
  };
  A.levers = () => {
    const g = new T.Group(), arms = [];
    g.add(B(1.4, 0.5, 0.12, A.mat('iron'), 0, 1.2, 0));
    for (let i = 0; i < 4; i++) {
      const piv = new T.Group(); piv.position.set(-0.5 + i * 0.33, 1.2, 0.08);
      piv.add(B(0.04, 0.4, 0.04, A.mat('rust'), 0, 0.2, 0)); const kn = new T.Mesh(new T.SphereGeometry(0.04, 8, 8), A.mat('black')); kn.position.y = 0.4; piv.add(kn);
      piv.rotation.z = 0.5; g.add(piv); arms.push(piv);
    }
    g.userData = { arms };
    return g;
  };
  A.ladder = (h = 2.6) => { const g = new T.Group(), m = A.mat('woodMid'); g.add(B(0.05, h, 0.05, m, -0.25, h / 2, 0), B(0.05, h, 0.05, m, 0.25, h / 2, 0)); for (let y = 0.3; y < h; y += 0.32) g.add(B(0.5, 0.04, 0.04, m, 0, y, 0)); return g; };
  A.hatch = (w = 0.9) => { const g = new T.Group(); g.add(B(w + 0.1, 0.04, w + 0.1, A.mat('wood'), 0, 0, 0)); const lid = B(w, 0.03, w, A.mat('woodMid'), 0, -0.02, 0); g.add(lid); g.add(B(0.1, 0.12, 0.06, A.mat('iron'), 0, -0.08, w / 2 - 0.1)); g.userData.lid = lid; return g; };
  A.sheeted = (w, h, d) => { const g = new T.Group(); const m = B(w, h, d, A.mat('cloth'), 0, h / 2, 0); g.add(m); const top = new T.Mesh(new T.SphereGeometry(Math.max(w, d) * 0.6, 10, 6, 0, TAU, 0, Math.PI / 2), A.mat('cloth')); top.scale.y = 0.25; top.position.y = h; g.add(top); return g; };
  A.rubble = () => { const g = new T.Group(), r = RNG(9); for (let i = 0; i < 14; i++) { const b = B(0.2 + r() * 0.6, 0.06 + r() * 0.2, 0.15 + r() * 0.5, A.mat(r() < 0.5 ? 'wood' : 'woodMid'), (r() - 0.5) * 1.6, r() * 0.8, (r() - 0.5) * 0.8); b.rotation.set(r() - 0.5, r() * 3, r() - 0.5); g.add(b); } return g; };
  A.stairsBroken = () => { const g = new T.Group(), m = A.mat('wood'); for (let i = 0; i < 8; i++) { const s = B(1.2, 0.08, 0.32, m, 0, 0.9 + i * 0.25, -i * 0.3); if (i === 2 || i === 3) s.visible = false; g.add(s); } return g; };
  A.paperOn = (w, h, draw) => { const tx = A.canvasTex(Math.round(w * 500), Math.round(h * 500), draw); const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx, roughness: 0.95, side: T.DoubleSide })); m.receiveShadow = true; return m; };

  // ---------- Картины и иллюстрации (2D) ----------
  A.paintDark = (g, w, h, base = '#1a1612') => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    strokes(g, Math.max(w, h), ['#2a221a', '#0e0b08', '#3a2e22'], 260, 60, 0.4, 8);
  };
  A.figure = (g, x, y, s, body = '#1a1410', face = '#cbbca0', blank = true) => {
    g.fillStyle = body; g.beginPath(); g.moveTo(x - s * 0.55, y + s * 1.6); g.quadraticCurveTo(x - s * 0.6, y + s * 0.5, x, y + s * 0.45); g.quadraticCurveTo(x + s * 0.6, y + s * 0.5, x + s * 0.55, y + s * 1.6); g.fill();
    g.fillStyle = face; g.beginPath(); g.ellipse(x, y, s * 0.24, s * 0.3, 0, 0, TAU); g.fill();
    if (!blank) { g.fillStyle = '#1a1410'; g.fillRect(x - s * 0.12, y - s * 0.04, s * 0.06, s * 0.03); g.fillRect(x + s * 0.06, y - s * 0.04, s * 0.06, s * 0.03); }
  };
  A.familyPortrait = (g, w, h) => {
    A.paintDark(g, w, h, '#1c1a14');
    const gr = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.5, w * 0.7); gr.addColorStop(0, 'rgba(120,90,50,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = h * 0.18;
    A.figure(g, w * 0.32, h * 0.32, s * 1.1, '#141010'); A.figure(g, w * 0.66, h * 0.36, s, '#2a1418');
    A.figure(g, w * 0.5, h * 0.55, s * 0.7, '#3a3040', '#d8cbb0');
    A.figure(g, w * 0.85, h * 0.48, s * 0.8, '#1e1a16');
    g.strokeStyle = 'rgba(140,20,20,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.45, h * 0.52); g.lineTo(w * 0.55, h * 0.58); g.moveTo(w * 0.55, h * 0.52); g.lineTo(w * 0.45, h * 0.58); g.stroke();
  };
  A.doctorPortrait = (g, w, h) => {
    A.paintDark(g, w, h, '#16120e');
    A.figure(g, w / 2, h * 0.38, h * 0.32, '#0e0c0a', '#c8b898', false);
    g.strokeStyle = '#8a7a50'; g.lineWidth = 3; for (const sx of [-1, 1]) { g.beginPath(); g.arc(w / 2 + sx * h * 0.045, h * 0.37, h * 0.035, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(20,10,10,0.9)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w / 2 - h * 0.09 + Math.random() * 6, h * 0.34 + i * 3); g.lineTo(w / 2 + h * 0.09, h * 0.4 - i * 2); g.stroke(); }
  };
  A.foggyLandscape = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a5450'); gr.addColorStop(1, '#1e2220'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#121614'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 10) g.lineTo(x, h * 0.7 - Math.sin(x * 0.02) * 10 - (x > w * 0.4 && x < w * 0.6 ? 40 : 0)); g.lineTo(w, h); g.fill();
    strokes(g, Math.max(w, h), ['#6a7470', '#3a4440'], 120, 90, 0.2, 10);
  };
  A.childDrawing = (g, w, h, seed = 1) => {
    g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h);
    const r = RNG(seed);
    g.lineWidth = 3; g.strokeStyle = '#3a3a8a';
    g.strokeRect(w * 0.2, h * 0.3, w * 0.6, h * 0.55); g.beginPath(); g.moveTo(w * 0.15, h * 0.32); g.lineTo(w * 0.5, h * 0.1); g.lineTo(w * 0.85, h * 0.32); g.stroke();
    g.fillStyle = '#111'; g.fillRect(w * 0.3, h * 0.52, w * 0.4, h * 0.1);
    g.fillStyle = '#c03030'; g.font = `700 ${h * 0.08}px Comfortaa`; g.textAlign = 'center'; g.fillText('ТАМ ТИХО', w / 2, h * 0.95);
    A.stick(g, w * 0.5, h * 0.57, h * 0.04, '#ffffff');
    for (let i = 0; i < 20; i++) { g.strokeStyle = `rgba(${r() * 120},${r() * 60},${r() * 60},0.3)`; g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); }
  };
  A.stick = (g, x, y, s, c) => { g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x, y - s * 1.6, s * 0.5, 0, TAU); g.moveTo(x, y - s * 1.1); g.lineTo(x, y); g.lineTo(x - s * 0.5, y + s); g.moveTo(x, y); g.lineTo(x + s * 0.5, y + s); g.moveTo(x - s * 0.7, y - s * 0.6); g.lineTo(x + s * 0.7, y - s * 0.6); g.stroke(); };
  A.clockFace = (h, m) => (g, W) => {
    g.fillStyle = '#d6cbb0'; g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(80,60,30,0.25)'; g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, TAU); g.fill();
    g.fillStyle = '#2a2018'; g.font = `700 ${W * 0.09}px Georgia`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    R.forEach((t, i) => { const a = (i / 12) * TAU - Math.PI / 2; g.fillText(t, W / 2 + Math.cos(a) * W * 0.38, W / 2 + Math.sin(a) * W * 0.38); });
    const hand = (a, l, wd) => { g.strokeStyle = '#1a1410'; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2, W / 2); g.lineTo(W / 2 + Math.cos(a) * l, W / 2 + Math.sin(a) * l); g.stroke(); };
    hand(((h % 12) / 12 + m / 720) * TAU - Math.PI / 2, W * 0.22, W * 0.035);
    hand((m / 60) * TAU - Math.PI / 2, W * 0.34, W * 0.02);
    g.fillStyle = '#1a1410'; g.beginPath(); g.arc(W / 2, W / 2, W * 0.03, 0, TAU); g.fill();
    g.textBaseline = 'alphabetic';
  };
  return A;
})();
