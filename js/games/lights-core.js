'use strict';
// Ядро «Света двух миров»: расчёт лучей через зеркала, фильтры, расщепители и порталы между мирами.
// Используется и в игре, и в генераторе уровней (tools/gen-lights.js).
(function (root) {
  const D = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // восток, юг, запад, север
  const SLASH = [3, 2, 1, 0], BACK = [1, 0, 3, 2]; // «/» и «\»
  // уровень: { W, H, o: [[мир, x, y, тип, ...]] }
  // типы: s — источник [d, цвет], m — зеркало [ориентация, закреплено, нужно, решение], w — стена,
  //       f — фильтр [цвет], p — портал [номер], t — кристалл [цвет], x — расщепитель [ориентация]
  function build(L) {
    const g = [new Map(), new Map()];
    for (const o of L.o) g[o[0]].set(o[1] + ',' + o[2], o);
    return g;
  }
  function trace(L, grid, mir) {
    const segs = [], hits = new Map(), seen = new Set(), portIn = new Map();
    const q = [];
    for (const o of L.o) if (o[3] === 's') q.push([o[0], o[1], o[2], o[4], o[5]]);
    let guard = 0;
    while (q.length && guard++ < 400) {
      let [w, x, y, d, c] = q.shift();
      let sx = x, sy = y;
      for (let step = 0; step < 300; step++) {
        const nx = x + D[d][0], ny = y + D[d][1];
        if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) { segs.push([w, sx, sy, nx, ny, c, 1]); break; }
        x = nx; y = ny;
        const sk = w + ',' + x + ',' + y + ',' + d + ',' + c;
        if (seen.has(sk)) { segs.push([w, sx, sy, x, y, c, 0]); break; }
        seen.add(sk);
        const o = grid[w].get(x + ',' + y);
        if (!o) continue;
        const t = o[3], k = w + ',' + x + ',' + y;
        if (t === 'w' || t === 's') { segs.push([w, sx, sy, x, y, c, 2]); break; }
        segs.push([w, sx, sy, x, y, c, 0]);
        if (t === 't') { hits.set(k, (hits.get(k) || 0) | c); break; }
        if (t === 'm') { const or = mir && mir.has(k) ? mir.get(k) : o[4]; d = or === 0 ? SLASH[d] : BACK[d]; }
        else if (t === 'x') { q.push([w, x, y, o[4] === 0 ? SLASH[d] : BACK[d], c]); }
        else if (t === 'f') { c &= o[4]; if (!c) break; }
        else if (t === 'p') {
          const other = L.o.find((p) => p[3] === 'p' && p[4] === o[4] && p[0] !== w);
          portIn.set(k, (portIn.get(k) || 0) | c);
          if (!other) break;
          w = other[0]; x = other[1]; y = other[2];
          portIn.set(w + ',' + x + ',' + y, (portIn.get(w + ',' + x + ',' + y) || 0) | c);
        }
        sx = x; sy = y;
      }
    }
    return { segs, hits, portIn };
  }
  function solvedWorld(L, hits, w) {
    for (const o of L.o) if (o[3] === 't' && (w == null || o[0] === w) && (hits.get(o[0] + ',' + o[1] + ',' + o[2]) || 0) !== o[4]) return false;
    return true;
  }
  root.LightCore = { D, SLASH, BACK, build, trace, solvedWorld };
})(typeof window !== 'undefined' ? window : global);
