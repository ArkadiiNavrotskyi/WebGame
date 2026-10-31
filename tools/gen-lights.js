// Генератор уровней «Света двух миров». Строит путь луча от решения назад к головоломке,
// проверяет решение ядром и сохраняет уровни в js/games/lights-levels.js.
// Запуск: node tools/gen-lights.js
const fs = require('fs');
const path = require('path');
global.window = undefined;
require(path.join(__dirname, '..', 'js', 'games', 'lights-core.js'));
const { D, SLASH, BACK, build, trace, solvedWorld } = global.LightCore;

function RNG(seed) {
  let a = seed >>> 0;
  const f = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  return f;
}

// s: источники { w, c, turns, portals, filters, splits }
const SPECS = [
  // Глава 1 — Утренний сад: зеркала и первый портал
  { W: 6, H: 4, s: [{ w: 0, turns: 1 }, { w: 1, turns: 1 }] },
  { W: 6, H: 5, s: [{ w: 0, turns: 2, portals: 1 }, { w: 1, turns: 1 }] },
  { W: 7, H: 5, s: [{ w: 0, turns: 2, portals: 1 }, { w: 1, turns: 2, portals: 1 }], decoys: 2 },
  { W: 7, H: 5, s: [{ w: 0, turns: 3, portals: 1 }, { w: 1, turns: 3, portals: 1 }], decoys: 3, walls: 2 },
  // Глава 2 — Пустыня зеркал: много порталов и стен
  { W: 8, H: 5, s: [{ w: 0, turns: 3, portals: 2 }, { w: 1, turns: 3, portals: 2 }], decoys: 3, walls: 3 },
  { W: 8, H: 6, s: [{ w: 0, turns: 3, portals: 2 }, { w: 1, turns: 3, portals: 1 }, { w: 0, turns: 2, portals: 1 }], decoys: 4, walls: 3 },
  { W: 8, H: 6, s: [{ w: 0, turns: 4, portals: 2 }, { w: 1, turns: 4, portals: 2 }, { w: 1, turns: 2, portals: 1 }], decoys: 4, walls: 3, fixed: 2 },
  { W: 8, H: 6, s: [{ w: 0, turns: 4, portals: 3 }, { w: 1, turns: 4, portals: 2 }, { w: 0, turns: 3, portals: 1 }], decoys: 5, walls: 4, fixed: 2 },
  // Глава 3 — Витражи: цвета и фильтры
  { W: 8, H: 5, s: [{ w: 0, c: 7, turns: 2, portals: 1, filters: 1 }, { w: 1, c: 4, turns: 2, portals: 1 }], decoys: 2, walls: 2 },
  { W: 8, H: 6, s: [{ w: 0, c: 7, turns: 3, portals: 1, filters: 1 }, { w: 1, c: 7, turns: 3, portals: 1, filters: 1 }], decoys: 3, walls: 3 },
  { W: 8, H: 6, s: [{ w: 0, c: 1, turns: 3, portals: 1 }, { w: 1, c: 4, turns: 3, portals: 1 }, { w: 0, c: 7, turns: 2, portals: 1, filters: 1 }], decoys: 4, walls: 3 },
  { W: 8, H: 6, s: [{ w: 0, c: 7, turns: 3, portals: 2, filters: 2 }, { w: 1, c: 7, turns: 3, portals: 2, filters: 1 }, { w: 1, c: 2, turns: 2, portals: 1 }], decoys: 5, walls: 3, fixed: 2 },
  // Глава 4 — Ледяные пещеры: расщепители
  { W: 8, H: 5, s: [{ w: 0, turns: 3, portals: 1, splits: 1 }, { w: 1, turns: 2 }], decoys: 2, walls: 2 },
  { W: 8, H: 6, s: [{ w: 0, turns: 3, portals: 1, splits: 1 }, { w: 1, turns: 3, portals: 1, splits: 1 }], decoys: 3, walls: 3 },
  { W: 8, H: 6, s: [{ w: 0, c: 7, turns: 3, portals: 2, splits: 1, filters: 1 }, { w: 1, c: 7, turns: 3, portals: 1, splits: 1 }], decoys: 4, walls: 3 },
  { W: 9, H: 6, s: [{ w: 0, turns: 4, portals: 2, splits: 1 }, { w: 1, turns: 3, portals: 2, splits: 1 }, { w: 0, turns: 2, portals: 1 }], decoys: 5, walls: 4, fixed: 2 },
  // Глава 5 — Затмение: всё вместе
  { W: 9, H: 6, s: [{ w: 0, c: 7, turns: 4, portals: 2, filters: 1, splits: 1 }, { w: 1, c: 7, turns: 4, portals: 2, filters: 1 }], decoys: 5, walls: 4, fixed: 2 },
  { W: 9, H: 6, s: [{ w: 0, c: 5, turns: 4, portals: 2, filters: 1 }, { w: 1, c: 3, turns: 4, portals: 2, filters: 1, splits: 1 }, { w: 0, turns: 2, portals: 1 }], decoys: 5, walls: 4, fixed: 2 },
  { W: 9, H: 7, s: [{ w: 0, c: 7, turns: 4, portals: 2, splits: 1, filters: 1 }, { w: 1, c: 7, turns: 4, portals: 2, splits: 1, filters: 1 }, { w: 1, c: 1, turns: 3, portals: 1 }], decoys: 6, walls: 5, fixed: 3 },
  { W: 10, H: 7, s: [{ w: 0, c: 7, turns: 5, portals: 2, splits: 1, filters: 1 }, { w: 1, c: 7, turns: 5, portals: 2, splits: 1, filters: 1 }, { w: 0, c: 4, turns: 3, portals: 1 }, { w: 1, c: 1, turns: 3, portals: 1 }], decoys: 7, walls: 5, fixed: 3 },
];

function tryGen(spec, r) {
  const { W, H } = spec;
  const occ = [new Map(), new Map()], beam = [new Set(), new Set()];
  const o = [];
  let pid = 0;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const free = (w, x, y) => inb(x, y) && !occ[w].has(x + ',' + y);
  const put = (w, x, y, arr) => { const ob = [w, x, y, ...arr]; occ[w].set(x + ',' + y, ob); o.push(ob); return ob; };
  const nearEdge = (x, y) => x === 0 || y === 0 || x === W - 1 || y === H - 1;
  // одна ветка луча; возвращает false, если зашли в тупик
  const walk = (w, x, y, d, c, b, depth) => {
    let steps = 0;
    for (let guard = 0; guard < 60; guard++) {
      const nx = x + D[d][0], ny = y + D[d][1];
      if (!free(w, nx, ny)) return false;
      x = nx; y = ny; steps++;
      const k = x + ',' + y, crossing = beam[w].has(k);
      beam[w].add(k);
      if (crossing || steps < 1) continue;
      const opts = [];
      const ahead = free(w, x + D[d][0], y + D[d][1]);
      if (b.turns > 0) opts.push(['m', 5]);
      if (b.portals > 0 && steps >= 1) opts.push(['p', 4]);
      if (b.filters > 0 && (c & (c - 1))) opts.push(['f', 3]);
      if (b.splits > 0 && depth === 0) opts.push(['x', 3]);
      if (ahead) opts.push(['.', b.turns + b.portals + b.filters + b.splits > 0 ? 2 : 1]);
      if (b.turns + b.portals + b.filters + b.splits === 0 && steps >= 1) opts.push(['t', 6]);
      if (!opts.length) return false;
      let tot = opts.reduce((s, q) => s + q[1], 0), roll = r() * tot, act = opts[0][0];
      for (const [a, wgt] of opts) { roll -= wgt; if (roll <= 0) { act = a; break; } }
      if (act === '.') continue;
      if (act === 't') { put(w, x, y, ['t', 0]); return true; }
      if (act === 'm') {
        const or = r() < 0.5 ? 0 : 1, nd = or === 0 ? SLASH[d] : BACK[d];
        if (!free(w, x + D[nd][0], y + D[nd][1])) { const o2 = 1 - or, nd2 = o2 === 0 ? SLASH[d] : BACK[d]; if (!free(w, x + D[nd2][0], y + D[nd2][1])) return false; put(w, x, y, ['m', o2, 0, 1, o2]); d = nd2; }
        else { put(w, x, y, ['m', or, 0, 1, or]); d = nd; }
        b.turns--; steps = 0; continue;
      }
      if (act === 'f') {
        const subs = [1, 2, 4, 3, 5, 6].filter((f) => (c & f) && (c & f) !== c);
        const f = r.pick(subs); put(w, x, y, ['f', f]); c &= f; b.filters--; continue;
      }
      if (act === 'x') {
        const or = r() < 0.5 ? 0 : 1, bd = or === 0 ? SLASH[d] : BACK[d];
        if (!free(w, x + D[bd][0], y + D[bd][1])) return false;
        put(w, x, y, ['x', or]); b.splits--;
        const nb = { turns: Math.max(1, Math.floor(b.turns / 2)), portals: b.portals > 1 ? 1 : 0, filters: 0, splits: 0 };
        b.turns -= nb.turns > 0 && b.turns > 1 ? nb.turns : 0; b.portals -= nb.portals;
        if (!walk(w, x, y, bd, c, nb, depth + 1)) return false;
        continue;
      }
      if (act === 'p') {
        const ow = 1 - w;
        const cand = [];
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (free(ow, xx, yy) && !beam[ow].has(xx + ',' + yy) && free(ow, xx + D[d][0], yy + D[d][1])) cand.push([xx, yy]);
        if (!cand.length) return false;
        const [px, py] = r.pick(cand);
        pid++;
        put(w, x, y, ['p', pid]); put(ow, px, py, ['p', pid]);
        beam[ow].add(px + ',' + py);
        w = ow; x = px; y = py; b.portals--; steps = 0;
        continue;
      }
    }
    return false;
  };
  for (const s of spec.s) {
    const c = s.c || 7;
    // источник у края, луч внутрь
    const cand = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!free(s.w, x, y) || beam[s.w].has(x + ',' + y) || !nearEdge(x, y)) continue;
      for (let d = 0; d < 4; d++) if (free(s.w, x + D[d][0], y + D[d][1]) && free(s.w, x + 2 * D[d][0], y + 2 * D[d][1])) cand.push([x, y, d]);
    }
    if (!cand.length) return null;
    const [x, y, d] = r.pick(cand);
    put(s.w, x, y, ['s', d, c]); beam[s.w].add(x + ',' + y);
    if (!walk(s.w, x, y, d, c, { turns: s.turns || 0, portals: s.portals || 0, filters: s.filters || 0, splits: s.splits || 0 }, 0)) return null;
  }
  const L = { W, H, o };
  // цвета кристаллов — по решению
  const sol = new Map();
  for (const ob of o) if (ob[3] === 'm') sol.set(ob[0] + ',' + ob[1] + ',' + ob[2], ob[4]);
  let grid = build(L);
  let tr = trace(L, grid, sol);
  for (const ob of o) if (ob[3] === 't') ob[4] = tr.hits.get(ob[0] + ',' + ob[1] + ',' + ob[2]) || 0;
  if (o.some((ob) => ob[3] === 't' && !ob[4])) return null;
  // лишние зеркала и стены — только вне путей решения
  const empties = (w) => { const a = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (free(w, x, y) && !beam[w].has(x + ',' + y)) a.push([x, y]); return a; };
  for (let i = 0; i < (spec.decoys || 0); i++) { const w = i % 2, e = empties(w); if (!e.length) continue; const [x, y] = r.pick(e); put(w, x, y, ['m', r() < 0.5 ? 0 : 1, 0, 0, 0]); }
  for (let i = 0; i < (spec.walls || 0); i++) { const w = i % 2, e = empties(w); if (!e.length) continue; const [x, y] = r.pick(e); put(w, x, y, ['w']); }
  // часть нужных зеркал закрепляем — подсказка-якорь
  const rel = o.filter((ob) => ob[3] === 'm' && ob[6] === 1);
  for (let i = 0; i < (spec.fixed || 0) && rel.length > 2; i++) { const m = rel.splice(Math.floor(r() * rel.length), 1)[0]; m[5] = 1; }
  // перемешиваем
  const movable = o.filter((ob) => ob[3] === 'm' && !ob[5]);
  for (const m of movable) m[4] = r() < 0.5 ? 0 : 1;
  const relMov = movable.filter((m) => m[6]);
  const wrong = relMov.filter((m) => m[4] !== m[7]);
  while (wrong.length < Math.ceil(relMov.length * 0.6)) { const m = relMov.find((q) => q[4] === q[7]); if (!m) break; m[4] = 1 - m[4]; wrong.push(m); }
  // проверки: решение работает, начальное состояние — нет, у каждого мира есть что крутить
  grid = build(L);
  const solMap = new Map(o.filter((ob) => ob[3] === 'm').map((m) => [m[0] + ',' + m[1] + ',' + m[2], m[6] ? m[7] : m[4]]));
  if (!solvedWorld(L, trace(L, grid, solMap).hits)) return null;
  if (solvedWorld(L, trace(L, grid, null).hits)) return null;
  for (const w of [0, 1]) if (movable.filter((m) => m[0] === w).length < 1) return null;
  return L;
}

const out = [];
SPECS.forEach((spec, i) => {
  let L = null, seed = 1000 + i * 97;
  for (let tries = 0; tries < 20000 && !L; tries++) L = tryGen(spec, RNG(seed + tries * 13));
  if (!L) throw new Error('не получилось сгенерировать уровень ' + (i + 1));
  out.push(L);
  const cnt = (t) => L.o.filter((o) => o[3] === t).length;
  console.log(`уровень ${i + 1}: ${L.W}×${L.H}, зеркал ${cnt('m')}, порталов ${cnt('p') / 2}, кристаллов ${cnt('t')}, фильтров ${cnt('f')}, расщепителей ${cnt('x')}`);
});
fs.writeFileSync(path.join(__dirname, '..', 'js', 'games', 'lights-levels.js'),
  `// Сгенерировано tools/gen-lights.js — не править вручную.\nwindow.LIGHT_LEVELS = ${JSON.stringify(out)};\n`);
console.log('готово');
