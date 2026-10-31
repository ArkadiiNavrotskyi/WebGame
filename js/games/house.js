'use strict';
// «Вереск» — хоррор-детектив на двоих. Один наверху, другой в подвале. 3D-комнаты с фонарём,
// осмотр в духе The Room, улики разделены между игроками, предметы передаются кухонным лифтом.
(() => {
  const HA = window.HouseArt, HC = window.HouseContent;
  const { ITEMS, DOCS, IMG, ACT, HINTS, BOOKS, DOLLS, DROOMS, RING, PITCH, LULLABY } = HC;
  const ROOM_NAME = { hall: 'Холл', study: 'Кабинет доктора', nursery: 'Детская', attic: 'Чердак', boiler: 'Котельная', laundry: 'Прачечная', chapel: 'Часовня', crypt: 'Склеп', passage: 'Тайный ход', quiet: 'Тихая комната' };
  const AREA = { up: ['hall', 'study', 'nursery', 'attic'], down: ['boiler', 'laundry', 'chapel', 'crypt', 'passage'] };
  const OPEN = { hall: () => true, boiler: () => true, study: (S) => S.f.study, laundry: (S) => S.f.laundry, nursery: (S) => S.f.nursery, chapel: (S) => S.f.chapel, attic: (S) => S.f.attic, crypt: (S) => S.f.crypt, passage: (S) => S.f.passage };
  const CH_NAMES = ['', 'Глава I. Пансион', 'Глава II. Доктор', 'Глава III. Лиза', 'Глава IV. Тихая комната'];

  // ================= История =================
  const INTRO = [
    ['road', 'Ноябрь 1996 года. Туманный Лог — городок, которого нет на новых картах. Туман здесь не рассеивается семнадцатый год.'],
    ['letter', 'Вам пришло письмо без обратного адреса: «Пансион „Вереск“. Приезжайте вдвоём. Одному здесь нельзя. Она всё ещё ждёт. — М.»'],
    ['house', 'Пансион закрыт с 1979 года. Хозяин, доктор Гордеев, исчез. Его жена умерла. Их дочь Лиза пропала — её так и не нашли. Дверь была не заперта.'],
    ['fall', 'Едва вы шагнули в холл, гнилой пол провалился. {down} рухнул(а) в подвал. {up} остался(ась) наверху. За спиной с грохотом захлопнулась входная дверь.'],
    ['split', 'Вы слышите друг друга сквозь доски пола — и больше ничего. Наверху и внизу разные комнаты, разные улики. Ни одна загадка здесь не решается в одиночку.'],
  ];
  const OUTRO = [
    ['quiet', 'Два ключа повернулись разом. Дверь, которой нет ни на одном плане дома, отворилась — с двух сторон сразу.'],
    ['quiet', 'В тихой комнате не было ничего страшного. Узкая кровать. Рисунки на стенах. Музыкальная шкатулка — открытая, как будто её только что завели.'],
    ['quiet', 'Шкатулка заиграла сама. Ту самую колыбельную. И на миг вам обоим показалось, что кто-то маленький прошёл между вами — легко, как сквозняк, — и сказал: «Спасибо, что пришли вдвоём».'],
    ['dawn', 'Туман над Туманным Логом рассеялся впервые за семнадцать лет. Входная дверь пансиона стояла открытой. Вы вышли вместе — так же, как вошли.'],
    ['end', ''],
  ];


  const ART = (g, w, hh, key, K) => {
    const { fog, sky, house } = K;
    switch (key) {
      case 'house': case 'road':
        sky('#1a2024', '#0a0c0e'); fog();
        g.fillStyle = '#0c0e10'; g.beginPath(); g.moveTo(0, hh); g.lineTo(0, hh * 0.78); for (let x = 0; x <= w; x += 20) g.lineTo(x, hh * 0.78 - Math.sin(x * 0.01) * 12); g.lineTo(w, hh); g.fill();
        house(w * (key === 'road' ? 0.72 : 0.5), hh * 0.8, hh * (key === 'road' ? 0.42 : 0.62), true);
        if (key === 'road') { g.strokeStyle = '#2a2e30'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.18, hh); g.lineTo(w * 0.18, hh * 0.35); g.lineTo(w * 0.24, hh * 0.35); g.stroke(); const gr = g.createRadialGradient(w * 0.24, hh * 0.37, 0, w * 0.24, hh * 0.37, 120); gr.addColorStop(0, 'rgba(255,200,120,0.4)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }
        for (let i = 0; i < 7; i++) { g.strokeStyle = '#06070a'; g.lineWidth = 3 + i % 3; const x = w * (0.05 + i * 0.15); g.beginPath(); g.moveTo(x, hh); g.lineTo(x + 10, hh * 0.55); for (let k = 0; k < 4; k++) { g.moveTo(x + 8, hh * (0.6 + k * 0.08)); g.lineTo(x + 8 + (k % 2 ? 40 : -40), hh * (0.55 + k * 0.08)); } g.stroke(); }
        fog(); break;
      case 'letter':
        sky('#14100c', '#0a0806');
        g.save(); g.translate(w / 2, hh / 2); g.rotate(-0.06);
        g.fillStyle = '#c8b898'; g.fillRect(-w * 0.3, -hh * 0.38, w * 0.6, hh * 0.76);
        g.fillStyle = 'rgba(80,50,20,0.25)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc((Math.random() - 0.5) * w * 0.5, (Math.random() - 0.5) * hh * 0.6, Math.random() * 40, 0, TAU); g.fill(); }
        g.fillStyle = '#2a1e14'; g.font = `${hh * 0.07}px 'Marck Script', cursive`; g.textAlign = 'center';
        ['Приезжайте вдвоём.', 'Одному здесь нельзя.', 'Она всё ещё ждёт.', '— М.'].forEach((l, i) => g.fillText(l, 0, -hh * 0.18 + i * hh * 0.12));
        g.restore();
        const gr = g.createRadialGradient(w / 2, hh / 2, hh * 0.2, w / 2, hh / 2, w * 0.6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
        break;
      case 'fall':
        sky('#0a0908', '#020202');
        g.fillStyle = '#2a1c12'; for (let i = 0; i < 9; i++) g.fillRect(i * w / 9, hh * 0.3, w / 9 - 4, hh * 0.08);
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(w / 2, hh * 0.36, w * 0.18, hh * 0.08, 0, 0, TAU); g.fill();
        for (let i = 0; i < 12; i++) { g.save(); g.translate(w / 2 + (Math.random() - 0.5) * w * 0.3, hh * (0.45 + Math.random() * 0.45)); g.rotate(Math.random() * 3); g.fillStyle = '#3a2618'; g.fillRect(-30, -5, 60, 10); g.restore(); }
        HA.figure(g, w / 2, hh * 0.7, hh * 0.12, '#000', '#3a3630');
        break;
      case 'split':
        sky('#0c0c0e', '#050506');
        g.fillStyle = '#2a1c12'; g.fillRect(0, hh * 0.48, w, hh * 0.06);
        const lamp = (x, y, c) => { const gr2 = g.createRadialGradient(x, y, 0, x, y, 160); gr2.addColorStop(0, c); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(0, 0, w, hh); };
        lamp(w * 0.35, hh * 0.25, 'rgba(255,190,110,0.35)'); lamp(w * 0.62, hh * 0.78, 'rgba(150,180,200,0.3)');
        HA.figure(g, w * 0.35, hh * 0.22, hh * 0.12, '#000', '#2a2620'); HA.figure(g, w * 0.62, hh * 0.72, hh * 0.12, '#000', '#2a2620');
        break;
      case 'quiet':
        sky('#0c0a10', '#040306');
        { const gr2 = g.createRadialGradient(w / 2, hh * 0.55, 0, w / 2, hh * 0.55, w * 0.4); gr2.addColorStop(0, 'rgba(220,210,255,0.35)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(0, 0, w, hh); }
        g.fillStyle = '#1a1620'; g.fillRect(w * 0.3, hh * 0.62, w * 0.4, hh * 0.12);
        g.globalAlpha = 0.5; HA.figure(g, w / 2, hh * 0.42, hh * 0.13, 'rgba(230,225,255,0.4)', 'rgba(240,235,255,0.7)'); g.globalAlpha = 1;
        break;
      case 'dawn':
        sky('#6a7480', '#d8b088');
        { const gr2 = g.createRadialGradient(w * 0.7, hh * 0.7, 0, w * 0.7, hh * 0.7, w * 0.5); gr2.addColorStop(0, 'rgba(255,220,160,0.7)'); gr2.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr2; g.fillRect(0, 0, w, hh); }
        g.fillStyle = '#20242a'; g.beginPath(); g.moveTo(0, hh); for (let x = 0; x <= w; x += 20) g.lineTo(x, hh * 0.8 - Math.sin(x * 0.01) * 10); g.lineTo(w, hh); g.fill();
        house(w * 0.3, hh * 0.82, hh * 0.5, false);
        HA.stick(g, w * 0.6, hh * 0.84, hh * 0.05, '#20242a'); HA.stick(g, w * 0.64, hh * 0.84, hh * 0.05, '#20242a');
        break;
    }
  };

  // ================= Комнаты =================
  const lightOn = (l, on, val) => { l.userData.on = on; l.intensity = on ? val : 0; };
  let _lit = null; const litMat = () => _lit || (_lit = new THREE.MeshBasicMaterial({ color: '#ffd8a0' }));
  const ROOMS = {
    hall: {
      size: [7, 3.4, 7], wall: 'damask_green', floor: 'wood_floor', fog: 0.075, amb: ['#2a3a44', '#0e0a06', 0.32], yaw: 0, cam: [0, 0.6],
      build(R, A, T) {
        const front = new T.Group(); const d1 = A.door(1.05, 2.5), d2 = A.door(1.05, 2.5); d1.position.x = -0.55; d2.position.x = 0.55; d2.scale.x = -1; front.add(d1, d2);
        for (let i = 0; i < 9; i++) { const l = new T.Mesh(new T.TorusGeometry(0.045, 0.011, 6, 12), A.mat('iron')); l.position.set(-0.4 + i * 0.1, 1.25 + Math.sin(i * 0.8) * 0.02, 0.1); l.rotation.y = i % 2 ? Math.PI / 2 : 0; front.add(l); }
        R.hot('h_front', R.put(front, 'n', 0, 0.06));
        R.hot('h_window', R.put(A.window(1.0, 1.6), 'n', -2.4, 0.04)); R.put(A.window(1.0, 1.6), 'n', 2.4, 0.04);
        const fig = A.glow('#000000', 1.2, 0); fig.material.blending = T.NormalBlending; fig.material.color.set('#020202'); fig.scale.set(0.45, 1.3, 1); fig.position.set(-2.4, 1.8, -3.9); R.g.add(fig); R.o.fig = fig;
        const clock = A.clock(HA.clockFace(9, 15)); R.o.clock = clock; R.hot('h_clock', R.put(clock, 'w', -1.5, 0.25));
        const dw = A.dumbwaiter(); R.o.dw = dw; R.hot('h_dw', R.put(dw, 'w', 1.2, 0.02));
        const stand = new T.Group(); stand.add(A.C(0.025, 0.03, 1.8, A.mat('wood'), 0, 0.9, 0, 8), A.C(0.2, 0.22, 0.04, A.mat('wood'), 0, 0.02, 0, 12)); for (let i = 0; i < 4; i++) { const hk = A.B(0.18, 0.025, 0.025, A.mat('brass'), 0.08, 1.7, 0); hk.rotation.y = i * 1.57; hk.position.set(Math.cos(i * 1.57) * 0.08, 1.7, Math.sin(i * 1.57) * 0.08); stand.add(hk); } R.put(stand, 'w', -2.8, 0.35);
        const coat = A.B(0.4, 0.9, 0.18, A.mat('black'), 0, 1.3, 0.12); stand.add(coat);
        const cane = new T.Group(); cane.add(A.C(0.013, 0.013, 0.95, A.mat('black'), 0, 0.47, 0, 6)); const hk = new T.Mesh(new T.TorusGeometry(0.05, 0.013, 6, 12, Math.PI), A.mat('porcelain')); hk.position.set(0.05, 0.95, 0); cane.add(hk); cane.rotation.z = 0.15;
        R.o.cane = R.hot('h_cane', R.put(cane, 'w', -2.35, 0.2));
        const sd = A.door(1.0, 2.2); R.o.studyDoor = sd; R.hot('h_door_study', R.put(sd, 'e', -0.9, 0.06));
        const kp = new T.Group(); kp.add(A.B(0.18, 0.26, 0.05, A.mat('iron'))); const led = new T.Mesh(new T.SphereGeometry(0.016, 8, 8), new T.MeshBasicMaterial({ color: '#301010' })); led.position.set(0.05, 0.09, 0.03); kp.add(led);
        for (let i = 0; i < 9; i++) kp.add(A.B(0.035, 0.03, 0.01, A.mat('brass'), -0.04 + (i % 3) * 0.04, -0.06 + Math.floor(i / 3) * 0.045 - 0.02, 0.03));
        R.o.led = led; R.hot('h_keypad', R.put(kp, 'e', 0.05, 0.03, 1.35));
        R.hot('h_portrait', R.put(A.painting(1.5, 1.1, A.familyPortrait), 's', -0.6, 0.04, 1.9));
        const desk = A.desk(1.8, true); R.put(desk, 's', 2.0, 0.6);
        const book = new T.Group(); book.add(A.B(0.36, 0.06, 0.26, A.mat('red'), 0, 0.03, 0)); const pages = A.paperOn(0.3, 0.22, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a1a'; for (let i = 0; i < 12; i++) g.fillRect(w * 0.1, h * 0.1 + i * h * 0.065, w * (0.5 + Math.random() * 0.35), 2); }); pages.rotation.x = -Math.PI / 2; pages.position.y = 0.065; book.add(pages);
        R.hot('h_guestbook', R.put(book, 's', 1.8, 0.55, 0.79));
        const hole = new T.Group(); const hm = new T.Mesh(new T.CircleGeometry(0.75, 10), new T.MeshBasicMaterial({ color: '#000000' })); hm.rotation.x = -Math.PI / 2; hm.position.y = 0.006; hm.scale.set(1.3, 1, 1); hole.add(hm);
        for (let i = 0; i < 7; i++) { const p = A.B(0.7, 0.05, 0.12, A.mat('wood'), Math.cos(i) * 0.9, 0.03, Math.sin(i) * 0.7); p.rotation.set(0.3 * Math.sin(i), i, 0.4); hole.add(p); }
        R.hot('h_hole', R.at(hole, -1.6, 0, 2.0));
        const rug = new T.Mesh(new T.PlaneGeometry(2.6, 1.8), new T.MeshStandardMaterial({ map: A.canvasTex(256, 180, (g, w, h) => { g.fillStyle = '#3a1418'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5a2a'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24); g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52); for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w / 2, h / 2, 10 + i * 12, 0, TAU); g.stroke(); } }), roughness: 1 }));
        rug.rotation.x = -Math.PI / 2; rug.position.set(0.6, 0.008, -0.8); rug.receiveShadow = true; R.g.add(rug);
        const ch = A.chandelier(); ch.position.set(0, 3.4, 0); R.g.add(ch);
        R.put(A.sheeted(1.4, 0.8, 0.7), 'e', 2.2, 0.5);
      },
      update(R, S, G) {
        const f = S.f, c = R.o.clock;
        c.userData.door.rotation.y = f.clock ? -1.7 : 0;
        if (f.clock && !R.o.clockSet) { R.o.clockSet = 1; const cv = c.userData.face.userData.c; HA.clockFace(3, 40)(cv.getContext('2d'), cv.width); c.userData.face.needsUpdate = true; }
        R.o.cane.visible = !f.t_cane;
        R.o.dw.userData.cab.visible = S.dw.pos === 'up' && f.crank;
        R.o.dw.userData.cab.position.y = S.dw.pos === 'up' ? 0.91 : 2.2;
        R.o.led.material.color.set(f.study ? '#30ff60' : f.power ? '#ffa020' : '#301010');
        R.o.studyDoor.userData.leaf.rotation.y = f.study ? -1.2 : 0;
      },
      tick(R, G, dt, t) {
        const S = G.S; if (!S || !S.f) return;
        // фигура в окне: один раз, когда дали ток
        if (S.f.power && !R.o.figShown && Math.abs(angDiff(G.yaw, 0.55)) < 0.35) { R.o.figShown = t; G.snd('sting'); }
        const k = R.o.figShown ? t - R.o.figShown : -1;
        R.o.fig.material.opacity = k >= 0 && k < 0.7 ? 0.85 : 0;
      },
    },
    boiler: {
      size: [7, 3, 6], wall: 'bricks', floor: 'concrete', ceil: 'concrete', fog: 0.09, amb: ['#1a2a30', '#080606', 0.16], yaw: 0, cam: [0, 0.4], trim: false,
      build(R, A, T) {
        const b = A.boiler(); R.o.boiler = b; R.hot('b_gauges', R.put(b, 'n', 0, 1.0));
        for (const [x, z] of [[-3.3, -1], [-1, -2.7], [2, -2.7]]) { const p = A.C(0.07, 0.07, 6.6, A.mat('pipe'), 0, 2.75, z, 10); p.rotation.z = Math.PI / 2; R.g.add(p); }
        for (const x of [-2.6, 2.8]) R.g.add(A.C(0.06, 0.06, 3, A.mat('pipe'), x, 1.5, -2.85, 10));
        const fb = A.fusebox(); R.o.fb = fb; R.hot('b_fuses', R.put(fb, 'e', -1.5, 0.1));
        const ld = A.door(1.0, 2.1); const pl = A.B(0.08, 0.1, 0.04, A.mat('brass'), 0.4, 1.0, 0.07); ld.userData.leaf.add(pl); R.o.ldoor = ld; R.hot('b_door_laundry', R.put(ld, 'e', 1.2, 0.06));
        const wb = A.workbench(); R.o.wb = wb; R.hot('b_drawer', R.put(wb, 'w', -1.2, 0.4));
        const wc = new T.Group(); const face = new T.Mesh(new T.CircleGeometry(0.22, 24), new T.MeshStandardMaterial({ map: A.canvasTex(256, 256, HA.clockFace(3, 40)), roughness: 0.5 })); wc.add(face); const rim = new T.Mesh(new T.TorusGeometry(0.23, 0.025, 8, 24), A.mat('iron')); wc.add(rim);
        R.hot('b_wallclock', R.put(wc, 'w', -1.2, 0.03, 2.05));
        const dw = A.dumbwaiter(); R.o.dw = dw; R.hot('b_dw', R.put(dw, 'w', 1.6, 0.02));
        const rub = new T.Group(); rub.add(A.rubble()); const st = A.stairsBroken(); st.position.set(0, -0.6, 0.6); rub.add(st); R.hot('b_rubble', R.put(rub, 's', 0.6, 0.9));
        const note = A.paperOn(0.24, 0.32, (g, w, h) => { g.fillStyle = '#cfc2a2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1e14'; g.font = `${h * 0.08}px 'Marck Script', cursive`; ['Не включайте', 'котёл после', 'полуночи...'].forEach((l, i) => g.fillText(l, w * 0.08, h * 0.25 + i * h * 0.13)); });
        note.rotation.x = -Math.PI / 2; note.rotation.z = 0.4; R.hot('b_note', R.at(note, 1.2, 0.012, 1.0));
        R.o.bulbs = [A.bulb(), A.bulb()]; R.at(R.o.bulbs[0], -1.5, 3, 0); R.at(R.o.bulbs[1], 1.6, 3, 0.4);
        R.put(A.sheeted(0.9, 0.7, 0.7), 'e', 2.4, 0.5); R.put(A.box(0.6, 0.5, 0.6), 's', -2.4, 0.5);
      },
      update(R, S) {
        const f = S.f;
        R.o.wb.userData.drawer.position.z = f.drawer ? 0.3 : 0.02;
        for (const b of R.o.bulbs) { b.userData.b.material = f.power ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = f.power ? 0.8 : 0; lightOn(b.userData.l, !!f.power, 1.6); }
        R.o.fb.userData.led.material.color.set(f.power ? '#30ff60' : '#401010');
        R.o.boiler.userData.fire.material.opacity = f.power ? 0.7 : 0;
        [2, 7, 5, 1].forEach((v, i) => { R.o.boiler.userData.gauges[i].rotation.z = f.power ? -(Math.PI * 0.75 - (v / 9) * Math.PI * 1.5) + Math.PI : 2.3; });
        R.o.ldoor.userData.leaf.rotation.y = f.laundry ? -1.3 : 0;
        R.o.dw.userData.cab.visible = S.dw.pos === 'down';
        R.o.dw.userData.handle.visible = !!f.crank;
      },
    },
    study: {
      size: [6, 3.2, 6], wall: 'damask_red', floor: 'wood_floor', fog: 0.07, amb: ['#3a2a2a', '#0a0606', 0.28], yaw: 0, cam: [0, 0.3],
      build(R, A, T) {
        const bs = A.bookshelf(2.4, 2.5, BOOKS.map((b) => ({ id: b.id, c: b.c }))); R.o.bs = bs; R.hot('s_books', R.put(bs, 'n', -0.4, 0.22));
        R.put(A.window(0.9, 1.4), 'n', 2.0, 0.04);
        const desk = A.desk(1.5, true); R.o.desk = desk; R.hot('s_desk', R.put(desk, 'e', 0.4, 0.5));
        const chair = new T.Group(); chair.add(A.B(0.45, 0.05, 0.45, A.mat('red'), 0, 0.48, 0), A.B(0.45, 0.6, 0.05, A.mat('wood'), 0, 0.8, -0.22)); for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) chair.add(A.B(0.04, 0.48, 0.04, A.mat('wood'), x, 0.24, z)); R.put(chair, 'e', 0.4, 1.15);
        const ph = A.phonograph(); R.o.ph = ph; R.hot('s_phono', R.put(ph, 'e', -1.9, 0.4));
        const sf = A.safe(A.doctorPortrait); R.o.sf = sf; R.hot('s_safe', R.put(sf, 'w', -0.3, 0.06, 1.75));
        const fp = A.fireplace(); R.hot('s_fire', R.put(fp, 'w', 1.7, 0.2));
        const dh = A.door(1.0, 2.2); R.hot('s_door_hall', R.put(dh, 's', -1.5, 0.06));
        const dn = A.door(1.0, 2.2); R.o.ndoor = dn; R.hot('s_door_nursery', R.put(dn, 's', 1.5, 0.06));
        const sign = A.paperOn(0.3, 0.1, (g, w, h) => { g.fillStyle = '#c9a36b'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a0a'; g.font = `${h * 0.55}px Georgia`; g.textAlign = 'center'; g.fillText('Детская', w / 2, h * 0.7); }); sign.position.set(0.5, 1.7, 0.08); dn.add(sign);
        const rug = new T.Mesh(new T.PlaneGeometry(2.2, 1.6), new T.MeshStandardMaterial({ color: '#2a1416', roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.008, 0); R.g.add(rug);
      },
      update(R, S) {
        const f = S.f;
        R.o.sf.userData.hinge.rotation.y = f.painting ? 1.6 : 0;
        R.o.sf.userData.sdoor.rotation.y = f.safe ? 1.9 : 0;
        R.o.desk.userData.drawer.position.z = f.desk ? 0.32 : 0.02;
        R.o.ph.userData.disc.visible = !!f.phono;
        R.o.ndoor.userData.leaf.rotation.y = f.nursery ? -1.2 : 0;
        R.o.bs.userData.books.forEach((b) => (b.position.z = f.books ? 0.14 : 0.02));
      },
      tick(R, G, dt) { if (G.S.f.phono) R.o.ph.userData.disc.rotation.y += dt * 3.5; },
    },
    laundry: {
      size: [6, 3, 6], wall: 'tiles', floor: 'concrete', ceil: 'concrete', fog: 0.085, amb: ['#2a3a3a', '#060808', 0.2], yaw: 0, cam: [0, 1.0], trim: false,
      build(R, A, T) {
        const cd = A.ironDoor(); R.o.cd = cd; R.hot('l_door_chapel', R.put(cd, 'n', 0, 0.08));
        const lines = new T.Group(); for (const z of [-0.8]) { const l = A.C(0.006, 0.006, 5.6, A.mat('cloth'), 0, 2.3, z, 4); l.rotation.z = Math.PI / 2; lines.add(l); }
        R.o.sheets = [];
        [['#c9a03a', 'Л', 3], ['#a02a2a', 'С', 1], ['#2a4aa0', 'А', 4], ['#2a8a4a', 'М', 2]].forEach(([c, l, n], i) => { const s = A.sheet(0.95, 1.4, { c, l, n }); s.position.set(-1.9 + i * 1.25, 1.6, -0.8); lines.add(s); R.o.sheets.push(s); });
        R.hot('l_sheets', R.at(lines, 0, 0, 0));
        const rack = new T.Group(); rack.add(A.C(0.015, 0.015, 1.9, A.mat('iron'), 0, 1.85, 0, 6)); rack.children[0].rotation.x = Math.PI / 2;
        for (const z of [-0.95, 0.95]) rack.add(A.C(0.015, 0.015, 1.85, A.mat('iron'), 0, 0.92, z, 6));
        for (let i = 0; i < 4; i++) { const gw = new T.Mesh(new T.PlaneGeometry(0.5, 1.0), new T.MeshStandardMaterial({ color: '#8a9898', side: T.DoubleSide, roughness: 0.95 })); gw.position.set(0, 1.32, -0.7 + i * 0.46); gw.rotation.y = Math.PI / 2; rack.add(gw); const tag = A.B(0.02, 0.08, 0.16, A.mat('paper'), 0.01, 1.55, -0.7 + i * 0.46); rack.add(tag); }
        R.hot('l_gowns', R.put(rack, 'e', 0.2, 0.5));
        const tub = A.tub(); R.o.tub = tub; R.hot('l_tub', R.put(tub, 'w', 0.3, 0.6));
        const bd = A.door(1.0, 2.1); R.hot('l_door_boiler', R.put(bd, 's', -1.6, 0.06));
        const shelf = A.B(0.8, 0.04, 0.3, A.mat('woodMid'), 0, 1.1, 0); const sg = new T.Group(); sg.add(shelf); const rad = A.radio(); rad.position.y = 1.12; sg.add(rad);
        R.hot('l_radio', R.put(sg, 's', 1.4, 0.2));
        const b = A.bulb(); R.o.bulb = b; R.at(b, 0, 3, 0.6);
      },
      update(R, S) {
        const f = S.f;
        R.o.tub.userData.water.position.y = f.tub ? 0.16 : 0.55;
        R.o.cd.userData.leaf.position.x = f.chapel ? 1.25 : 0; R.o.cd.userData.med.visible = !!f.chapel;
        const b = R.o.bulb; b.userData.b.material = f.power ? litMat() : HA.mat('bulbOff'); b.userData.gl.material.opacity = f.power ? 0.7 : 0; lightOn(b.userData.l, !!f.power, 1.3);
      },
      tick(R, G, dt, t) { R.o.sheets.forEach((s, i) => (s.rotation.y = Math.sin(t * 0.7 + i) * 0.08)); },
    },
    nursery: {
      size: [5, 3, 5], wall: 'damask_nursery', floor: 'wood_floor', fog: 0.08, amb: ['#3a3450', '#0a0808', 0.26], yaw: 0, cam: [0, 0.3],
      build(R, A, T) {
        R.put(A.window(0.9, 1.3, '#6a7a98'), 'n', -0.8, 0.04);
        const tbl = new T.Group(); tbl.add(A.B(0.9, 0.05, 0.55, A.mat('woodMid'), 0, 0.6, 0)); for (const x of [-0.4, 0.4]) for (const z of [-0.22, 0.22]) tbl.add(A.B(0.04, 0.6, 0.04, A.mat('woodMid'), x, 0.3, z));
        const dh = A.dollhouse(); dh.position.set(0, 0.62, -0.1); tbl.add(dh); R.o.dh = dh;
        R.hot('n_dollhouse', R.put(tbl, 'n', 1.2, 0.35));
        const bed = A.bed(0.9, 1.6, true); R.hot('n_bed', R.put(bed, 'w', -0.5, 0.9));
        const dr = new T.Group(); [[-0.35, 0.1, 0], [0.3, 0, 0.1], [0, 0.6, -0.05]].forEach(([x, y, r], i) => { const p = A.paperOn(0.42, 0.32, (g, w, h) => A.childDrawing(g, w, h, i + 2)); p.position.set(x, y, 0); p.rotation.z = r; dr.add(p); });
        R.hot('n_drawings', R.put(dr, 'w', -0.6, 0.02, 1.6));
        const wd = A.wardrobe(); R.o.wd = wd; R.hot('n_wardrobe', R.put(wd, 'e', 0.7, 0.35));
        const ns = new T.Group(); ns.add(A.B(0.4, 0.55, 0.36, A.mat('woodMid'), 0, 0.275, 0)); const mb = A.musicbox(); mb.position.y = 0.55; ns.add(mb); R.o.mb = mb;
        const nl = new T.PointLight('#8a90ff', 0.5, 3, 2); nl.position.set(0, 0.8, 0.2); ns.add(nl);
        R.hot('n_musicbox', R.put(ns, 'e', -1.5, 0.3));
        const hz = A.rockingHorse(); R.o.horse = hz; R.hot('n_horse', R.put(hz, 's', -1.2, 0.9));
        const d = A.door(1.0, 2.2); R.hot('n_door_study', R.put(d, 's', 1.3, 0.06));
        const hatch = A.hatch(0.8); R.o.hatch = hatch; R.hot('n_hatch', R.at(hatch, 0.4, 2.98, 1.0));
      },
      update(R, S) {
        const f = S.f;
        R.o.dh.userData.roof.position.y = f.dollhouse ? 0.95 : 0.75;
        R.o.mb.userData.lid.rotation.x = f.music ? -1.9 : 0; R.o.mb.userData.dancer.visible = !!f.music;
        R.o.wd.userData.dl.rotation.y = f.wardrobe ? -1.2 : 0; R.o.wd.userData.dl.position.x = f.wardrobe ? -0.55 : -0.3;
        R.o.wd.userData.dr.rotation.y = f.wardrobe ? 1.2 : 0; R.o.wd.userData.dr.position.x = f.wardrobe ? 0.55 : 0.3;
        R.o.hatch.userData.lid.rotation.x = f.attic ? -1.3 : 0;
      },
      tick(R, G, dt, t) { R.o.horse.userData.rock.rotation.z = Math.sin(t * 1.3) * 0.12; if (G.S.f.music) R.o.mb.userData.dancer.rotation.y += dt * 2; },
    },
    attic: {
      size: [7, 2.8, 6], wall: 'wood_attic', floor: 'wood_attic', ceil: 'wood_attic', fog: 0.1, amb: ['#2a2a34', '#080604', 0.2], yaw: 0, cam: [0, 1.2],
      build(R, A, T) {
        for (let i = -3; i <= 3; i++) { const b = A.B(0.16, 0.16, 6, A.mat('wood'), i, 2.65, 0); R.g.add(b); }
        for (const z of [-1.5, 1.2]) { const b = A.B(7, 0.18, 0.18, A.mat('wood'), 0, 2.2, z); R.g.add(b); }
        const tally = A.paperOn(1.0, 0.18, (g, w, h) => IMG.tally(g, w, h)); R.hot('a_tally', R.at(tally, 0.2, 2.2, -1.4));
        const win = new T.Mesh(new T.CircleGeometry(0.4, 24), new T.MeshBasicMaterial({ color: '#6a7a84' })); const wg = new T.Group(); wg.add(win); const wl = new T.PointLight('#8fa8b8', 0.8, 5, 2); wl.position.z = 0.6; wg.add(wl); R.put(wg, 'n', 1.6, 0.02, 1.6);
        const ch = A.chest(); R.o.chest = ch; R.hot('a_rings', R.at(ch, -1.4, 0, -1.9, 0.2));
        const mq = A.mannequin(); R.o.mq = mq; R.o.mqHome = new T.Vector3(2.6, 0, -1.6); R.hot('a_mannequin', R.at(mq, 2.6, 0, -1.6, -0.8));
        R.at(A.sheeted(1.2, 0.9, 0.6), -2.6, 0, 0.6, 0.3); R.at(A.sheeted(0.6, 1.4, 0.6), 2.8, 0, 1.6, 0); R.at(A.box(0.6, 0.45, 0.5), -2.8, 0, -2.3, 0.4);
        const td = A.hatch(0.9); td.rotation.x = Math.PI; R.o.td = td; R.hot('a_trapdoor', R.at(td, 1.3, 0.02, 0.9));
        const back = A.hatch(0.8); back.rotation.x = Math.PI; R.hot('a_hatch', R.at(back, -1.6, 0.02, 2.2));
        const lamp = new T.Group(); lamp.add(A.C(0.005, 0.005, 0.5, A.mat('black'), 0, -0.25, 0, 4)); const gl = A.glow('#ffb060', 0.5, 0.7); gl.position.y = -0.55; lamp.add(gl); const ll = new T.PointLight('#ffa050', 1.0, 5, 2); ll.position.y = -0.6; lamp.add(ll); R.at(lamp, -0.6, 2.55, -0.6);
      },
      update(R, S) { R.o.chest.userData.lid.rotation.x = S.f.rings ? -1.6 : 0; R.o.td.userData.lid.rotation.x = S.f.insA ? 0.3 : 0; },
      tick(R, G, dt, t) {
        // манекен подбирается ближе, пока на него не смотрят
        const mq = R.o.mq, cam = G.cam.position;
        const toM = Math.atan2(-(mq.position.x - cam.x), -(mq.position.z - cam.z));
        const away = Math.abs(angDiff(G.yaw, toM)) > 1.6;
        R.o.mqT = (R.o.mqT || 0) + dt;
        if (away && R.o.mqT > 6) {
          R.o.mqT = 0;
          const d = new THREE.Vector3(cam.x - mq.position.x, 0, cam.z - mq.position.z);
          if (d.length() > 1.4) { mq.position.addScaledVector(d.normalize(), 0.35); mq.rotation.y = Math.atan2(cam.x - mq.position.x, cam.z - mq.position.z); }
        }
      },
      enter(G) { const R = G.rooms.attic; if (R && R.o.mqHome) R.o.mq.position.copy(R.o.mqHome); },
    },
    chapel: {
      size: [6, 4.5, 8], wall: 'stone', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.075, amb: ['#2a2a3a', '#060606', 0.18], yaw: 0, cam: [0, 2.2], trim: false,
      build(R, A, T) {
        const al = A.altar(); R.o.al = al; R.hot('c_candles', R.put(al, 'n', 0, 0.6));
        const sg = A.stainedGlass((g, w, h) => IMG.glass(g, w, h, { f: {} })); R.o.sg = sg; R.hot('c_glass', R.put(sg, 'n', 0, 0.02, 1.7));
        const gl = new T.PointLight('#9a7aff', 0.3, 6, 2); gl.position.set(0, 2.6, -3.3); R.g.add(gl); R.o.glassLight = gl;
        const org = A.organ(); R.hot('c_organ', R.put(org, 'e', -0.8, 0.5));
        const gate = A.grate(1.1, 2.1); R.o.gate = gate; R.hot('c_gate', R.put(gate, 'w', -1.0, 0.05));
        const arch = new T.Mesh(new T.PlaneGeometry(1.1, 2.1), A.mat('black')); R.put(arch, 'w', -1.0, 0.01, 1.05);
        const pews = new T.Group(); for (const z of [-0.4, 0.9]) for (const x of [-1.3, 1.3]) { const p = A.pew(); p.scale.set(0.6, 1, 1); p.position.set(x, 0, z); pews.add(p); }
        R.hot('c_pews', R.at(pews, 0, 0, 0));
        const dp = A.paperOn(0.22, 0.3, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3a8a'; g.font = `${h * 0.07}px Comfortaa`; ['Мой домик.', 'Папу я...', 'Маму —', 'Марфу —', 'А себя...'].forEach((l, i) => g.fillText(l, w * 0.08, h * 0.2 + i * h * 0.15)); });
        dp.rotation.x = -Math.PI / 2 + 0.1; dp.rotation.z = 0.3; R.hot('c_diary', R.at(dp, 1.1, 0.48, -0.45));
        const dd = A.door(1.0, 2.2); R.hot('c_door_laundry', R.put(dd, 's', 0, 0.06));
        for (const [x, z] of [[-2.5, -3.5], [2.5, -3.5], [-2.5, 3.5], [2.5, 3.5]]) { const c = A.candles(4, 0.15, false); R.at(c, x, 0, z); }
        const cl = new T.PointLight('#ff9040', 0.7, 5, 2); cl.position.set(-2.4, 0.5, 3.2); R.g.add(cl);
      },
      update(R, S) {
        const f = S.f;
        R.o.al.userData.cand.forEach((c) => c.userData.flames.forEach((m) => (m.visible = !!f.candles)));
        lightOn(R.o.al.userData.light, !!f.candles, 1.6);
        if (R.o.litState !== !!f.candles) { R.o.litState = !!f.candles; const tx = R.o.sg.userData.tex, cv = tx.userData.c; IMG.glass(cv.getContext('2d'), cv.width, cv.height, S); tx.needsUpdate = true; R.o.glassLight.intensity = f.candles ? 1.2 : 0.3; }
        R.o.gate.userData.leaf.position.y = f.crypt ? 1.9 : 0;
      },
    },
    crypt: {
      size: [5, 2.8, 6], wall: 'stone_dark', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.11, amb: ['#1a2224', '#040404', 0.14], yaw: 0, cam: [0, 1.6], trim: false,
      build(R, A, T) {
        R.hot('k_niches', R.put(A.niches(), 'n', 0, 0.2));
        const m = A.mosaic((g, w, h) => IMG.mosaic(g, w, h)); m.position.set(0, 0.012, -0.4); R.hot('k_mosaic', R.at((() => { const gg = new T.Group(); gg.add(m); return gg; })(), 0, 0, 0));
        const gr = A.grate(1.0, 2.0); R.o.gr = gr; R.hot('k_grate', R.put(gr, 'e', 0.3, 0.05));
        const hole = new T.Mesh(new T.PlaneGeometry(1.0, 2.0), A.mat('black')); R.put(hole, 'e', 0.3, 0.01, 1.0);
        const back = new T.Group(); for (let i = 0; i < 6; i++) back.add(A.B(1.2, 0.18, 0.3, new T.MeshStandardMaterial({ map: A.surf('stone', [1, 1]) }), 0, 0.09 + i * 0.18, -i * 0.3));
        R.hot('k_back', R.put(back, 's', -1.4, 0.2));
        for (const [x, z] of [[-2, -2.4], [2, -2.4], [-2, 2.2]]) R.at(A.candles(3, 0.12, true), x, 0, z);
      },
      update(R, S) { R.o.gr.userData.leaf.rotation.y = S.f.passage ? -1.4 : 0; },
    },
    passage: {
      size: [3, 3.2, 6], wall: 'stone', floor: 'stone_dark', ceil: 'stone_dark', fog: 0.12, amb: ['#1a1e20', '#040404', 0.12], yaw: 0, cam: [0, 1.4], trim: false,
      build(R, A, T) {
        const lad = new T.Group(); lad.add(A.ladder(3.2)); const tdoor = A.B(1.0, 0.1, 1.0, A.mat('iron'), 0, 3.15, 0.3); lad.add(tdoor); R.hot('p_ladder', R.put(lad, 'n', 0, 0.3));
        const lv = A.levers(); R.o.lv = lv; R.hot('p_levers', R.put(lv, 'w', -0.6, 0.05));
        const back = A.grate(1.0, 2.0); back.userData.leaf.rotation.y = -1.4; R.hot('p_back', R.put(back, 's', 0, 0.05));
        R.at(A.candles(3, 0.1, true), 1.1, 0, 1.6);
      },
      update(R, S) { R.o.lv.userData.arms.forEach((a, i) => (a.rotation.z = S.f.levers ? -0.5 : 0.5)); },
    },
    quiet: {
      size: [4, 2.6, 4], wall: 'damask_nursery', floor: 'wood_floor', fog: 0.06, amb: ['#6a6488', '#141018', 0.5], yaw: 0, cam: [0, 1.2],
      build(R, A, T) {
        R.put(A.bed(0.8, 1.5, true), 'n', 0, 0.85);
        const mb = A.musicbox(); mb.userData.lid.rotation.x = -1.9; mb.userData.dancer.visible = true; R.o.mb = mb; R.at(mb, 0.9, 0.5, -1.2);
        R.at(A.box(0.4, 0.5, 0.36, 'woodMid'), 0.9, 0, -1.2);
        const dr = new T.Group(); for (let i = 0; i < 4; i++) { const p = A.paperOn(0.4, 0.3, (g, w, h) => A.childDrawing(g, w, h, i + 7)); p.position.set(-0.9 + i * 0.6, 0, 0); p.rotation.z = (i % 2 ? 0.1 : -0.08); dr.add(p); } R.put(dr, 'w', 0, 0.02, 1.6);
        const ghost = A.glow('#d8d0ff', 1.6, 0.0); ghost.position.set(0, 1.1, -0.6); ghost.scale.set(0.7, 1.6, 1); R.g.add(ghost); R.o.ghost = ghost;
        const gl = new T.PointLight('#c8c0ff', 1.4, 5, 2); gl.position.set(0, 1.2, -0.6); R.g.add(gl);
        R.hot('q_any', mb);
      },
      tick(R, G, dt, t) { R.o.mb.userData.dancer.rotation.y += dt * 1.5; R.o.ghost.material.opacity = 0.25 + Math.sin(t * 0.8) * 0.15; G.tyaw += dt * 0.05; },
    },
  };

  StoryEngine.define({
    id: 'house', title: 'Вереск', icon: '🕯️', color: '#c9a36b',
    tagline: 'Хоррор-детектив на двоих: один наверху, другой в подвале',
    infoDefault: 'хоррор-детектив · 3D',
    roles: [
      { id: 'up', name: 'Наверху', icon: '🕯️', desc: 'Остаёшься в холле пансиона. Кабинет доктора, детская, чердак. Видишь то, чего не видно снизу.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
      { id: 'down', name: 'Внизу', icon: '🔦', desc: 'Падаешь в подвал. Котельная, прачечная, часовня, склеп. Только фонарь и голос сверху.', ctrl: { pc: 'зажми мышь и веди — осмотреться, клик — изучить', touch: 'веди пальцем — осмотреться, касание — изучить' } },
    ],
    rules: [
      'Мрачная история на 1–2 часа. Лучше в наушниках, с выключенным светом.',
      'Вы в разных частях дома. Улики разделены: код от твоего замка может быть написан в комнате у другого. Говорите обо всём, что видите.',
      'Предметы передаются кухонным лифтом между холлом и котельной.',
      'Прогресс сохраняется — можно продолжить в другой вечер. Застряли — кнопка 💡.',
    ],
    sub: 'хоррор-детектив для двоих · 4 главы',
    warn: 'Играйте в наушниках и в темноте. Говорите обо всём, что видите — вы в разных частях дома.',
    roleLabel: { up: '🕯️ Ты — <b>наверху</b>', down: '🔦 Ты — <b>внизу</b>' },
    enterLabel: 'Войти в дом', menuArt: 'house', endArt: 'dawn', endSub: 'раскрыли тайну «Вереска»', finalRoom: 'quiet', introSound: { 3: 'crash' },
    chapters: CH_NAMES, ITEMS, DOCS, IMG, ACT, HINTS, TAKE: HC.TAKE, chapterOf: HC.chapterOf, drawIcon: HC.drawIcon,
    ROOM_NAME, AREA, OPEN, INTRO, OUTRO, ROOMS, art: ART,
    dw: {
      name: 'Кухонный лифт', cabin: 'Кабина', called: 'Кабина лифта поднялась к вам.', call: 'Вызвать кабину', send: { up: 'вниз ↓', down: 'наверх ↑' },
      room: { up: 'hall', down: 'boiler' }, need: 'crank',
      broken: { up: 'Деревянная шахта уходит вниз, в темноту. Кабина здесь, но тросы провисли — механизм внизу без рукояти.', down: 'Шахта кухонного лифта. Тросы уходят наверх. У механизма нет рукояти — только квадратное гнездо.' },
      install: { role: 'down', item: 'crank', act: 'crank', label: 'Вставить рукоять' },
    },
    final: {
      title: 'Тихая комната', flag: { up: 'insA', down: 'insB' }, key: { up: 'key_a', down: 'key_b' },
      text: { up: 'Люк в полу чердака. Под ним — узкая дверь, вмурованная прямо в перекрытие, между этажами. На двери две скважины: одна с этой стороны, другая — с той.', down: 'Лестница упирается в дверь в потолке — она вмурована в перекрытие между этажами. На двери две скважины: одна с этой стороны, другая — с той.' },
    },
    hot(G, { use, bindUse, P }) {
    return {
      // ---------- Холл ----------
      h_front: (o) => { G.snd('chain'); G.say('Входная дверь', 'Заперто. Цепь натянута с той стороны так, будто её держат.\nСквозь щель тянет холодом и туманом.'); G.focusOn(o); },
      h_window: (o) => { G.say('Окно', 'За мутным стеклом — только туман. Иногда кажется, что в нём кто-то стоит и смотрит на дом.'); G.focusOn(o); },
      h_portrait: (o) => G.doc('portrait', o),
      h_guestbook: (o) => G.doc('guestbook', o),
      h_hole: (o) => { G.say('Провал', `Доски проломлены. Внизу темно и пахнет сыростью.\n${G.nm('down')} где-то там.`); G.focusOn(o); },
      h_cane: (o, S, f) => P(() => ({ t: 'Вешалка', html: f.t_cane ? '<p class="hs-txt">Пустая вешалка. Крючки похожи на пальцы.</p>' : `<p class="hs-txt">На вешалке висит трость с загнутой ручкой-крюком.</p>${G.takeHtml(['cane'])}` }), o),
      h_clock: (o, S, f) => P(() => {
        if (f.clock) return { t: 'Напольные часы', html: `<p class="hs-txt">Дверца корпуса открыта. Маятник неподвижен. ${G.takeHtml(['fuse2', 'key_laundry']) ? 'Внутри что-то лежит.' : 'Внутри пусто.'}</p>${G.takeHtml(['fuse2', 'key_laundry'])}` };
        const p = G.ps; if (p.h == null) { p.h = 9; p.m = 15; }
        return { t: 'Напольные часы', html: `<p class="hs-txt">Часы стоят. Дверца корпуса заперта — замок связан с механизмом. Может, они откроются, если выставить правильное время?</p><canvas class="hs-clock" width="300" height="300"></canvas>
          <div class="hs-row"><button data-k="h-">− час</button><button data-k="h+">+ час</button><button data-k="m-">− 5 мин</button><button data-k="m+">+ 5 мин</button></div><button class="hs-btn" id="hsGo">Качнуть маятник</button>`,
        bind: (el) => {
          HA.clockFace(p.h, p.m)($('.hs-clock', el).getContext('2d'), 300);
          el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { const k = b.dataset.k; if (k === 'h-') p.h = (p.h + 11) % 12 || 12; if (k === 'h+') p.h = (p.h % 12) + 1; if (k === 'm-') p.m = (p.m + 55) % 60; if (k === 'm+') p.m = (p.m + 5) % 60; SFX.play('tick'); G.renderPanel(); }));
          $('#hsGo', el).onclick = () => G.act('clock', { h: p.h % 12 === 0 ? 12 : p.h, m: p.m });
        } };
      }, o),
      h_dw: (o) => P(() => G.dwPanel(), o),
      h_keypad: (o, S, f) => P(() => {
        if (!f.power) return { t: 'Кодовая панель', html: '<p class="hs-txt">Электрический замок на двери кабинета. Кнопки мёртвые — в доме нет тока.</p>' };
        if (f.study) return { t: 'Кодовая панель', html: '<p class="hs-txt">Лампочка горит зелёным. Дверь в кабинет открыта.</p>' };
        const p = G.ps; p.code = p.code || '';
        const syms = ['✝', '☀', '✋', '☾'];
        return { t: 'Кодовая панель', html: `<p class="hs-txt">Над четырьмя ячейками выбиты символы.</p><div class="hs-code">${syms.map((s, i) => `<div><small>${s}</small><b>${p.code[i] || '·'}</b></div>`).join('')}</div>
          <div class="hs-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>`,
        bind: (el) => el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { const k = b.dataset.k; SFX.play('tick'); if (k === '⌫') p.code = p.code.slice(0, -1); else if (k === '✓') { if (p.code.length === 4) G.act('keypad', p.code); p.code = ''; } else if (p.code.length < 4) p.code += k; G.renderPanel(); })) };
      }, o),
      h_door_study: (o, S, f) => { if (f.study) G.go('study'); else { G.say('Дверь кабинета', 'Заперто электрическим замком. Рядом на стене — кодовая панель.'); G.focusOn(o); } },
      // ---------- Кабинет ----------
      s_door_hall: () => G.go('hall'),
      s_door_nursery: (o, S, f) => { if (f.nursery) return G.go('nursery'); P(() => ({ t: 'Дверь с табличкой «Детская»', html: `<p class="hs-txt">Заперта. Из-под двери тянет холодом. На миг показалось — за ней кто-то тихо дышит.</p>${use('key_nursery', 'Отпереть ключом «Детская»', 'unlock', 'nursery')}`, bind: bindUse }), o); },
      s_books: (o, S, f) => P(() => {
        if (f.books) return { t: 'Книжный шкаф', html: `<p class="hs-txt">За сдвинутыми книгами — тайник в задней стенке.</p>${G.takeHtml(['desk_key']) || '<p class="hs-cap">Тайник пуст.</p>'}` };
        const p = G.ps; p.seq = p.seq || [];
        return { t: 'Книжный шкаф', html: `<p class="hs-txt">На средней полке восемь книг в цветных переплётах стоят чуть иначе, чем остальные. Некоторые подаются, если их потянуть. Может, нужен порядок?</p>
          <div class="hs-books">${BOOKS.map((b) => `<button data-b="${b.id}" class="${p.seq.includes(b.id) ? 'out' : ''}" style="--c:${b.c}"><span>${b.n}</span></button>`).join('')}</div><p class="hs-cap">Вытянуто: ${p.seq.length} из 4</p>`,
        bind: (el) => el.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => { if (p.seq.includes(b.dataset.b)) return; p.seq.push(b.dataset.b); G.snd('book'); if (p.seq.length === 4) { G.act('books', p.seq.slice()); } G.renderPanel(); })) };
      }, o),
      s_desk: (o, S, f) => P(() => f.desk
        ? { t: 'Письменный стол', html: `<p class="hs-txt">В ящике — журнал в кожаной обложке и коробок спичек.</p><button class="hs-btn ghost" data-doc="journal">Читать журнал</button>${G.takeHtml(['matches'])}` }
        : { t: 'Письменный стол', html: `<p class="hs-txt">Массивный стол доктора. Ящик заперт на маленький замок. На столе — пепельница с окурками и засохшая чернильница.</p>${use('desk_key', 'Открыть маленьким ключом', 'desk')}`, bind: bindUse }, o),
      s_safe: (o, S, f) => {
        if (!f.painting) return P(() => ({ t: 'Портрет доктора', html: '<p class="hs-txt">Доктор Гордеев. Глаза на портрете выцарапаны чем-то острым. Рама висит криво — будто её часто отодвигали.</p><button class="hs-btn" id="hsMove">Отодвинуть портрет</button>', bind: (el) => ($('#hsMove', el).onclick = () => G.act('painting')) }), o);
        if (f.safe) return P(() => ({ t: 'Сейф', html: `<p class="hs-txt">Сейф открыт. Внутри — письмо, ${G.takeHtml(['medal_a', 'key_nursery']) ? 'и ещё кое-что.' : 'больше ничего.'}</p><button class="hs-btn ghost" data-doc="anna">Читать письмо</button>${G.takeHtml(['medal_a', 'key_nursery'])}` }), o);
        P(() => G.wheelsPanel({ t: 'Сейф', desc: 'Стальной сейф с четырьмя колёсиками цифр. Рядом нацарапано: «по порядку сеансов».', n: 4, chars: '0123456789', act: 'safe' }), o);
      },
      s_phono: (o, S, f) => P(() => f.phono
        ? { t: 'Граммофон', html: `<p class="hs-txt">Пластинка на диске. На конверте — надпись и знаки.</p><button class="hs-btn ghost" data-doc="sleeve">Конверт пластинки</button><button class="hs-btn" id="hsPlay">Проиграть ещё раз</button>`, bind: (el) => ($('#hsPlay', el).onclick = () => G.act('replay')) }
        : { t: 'Граммофон', html: `<p class="hs-txt">Старый граммофон с медным раструбом. Пластинки нет.</p>${use('record', 'Поставить пластинку', 'phono')}`, bind: bindUse }, o),
      s_fire: (o) => { G.say('Камин', 'В золе — обгоревшие страницы. Можно разобрать обрывки: «...полная тишина...», «...между этажами...», «...ключей два...».'); G.focusOn(o); },
      // ---------- Детская ----------
      n_door_study: () => G.go('study'),
      n_dollhouse: (o, S, f) => P(() => {
        if (f.dollhouse) return { t: 'Кукольный домик', html: `<p class="hs-txt">Крыша домика приподнята. Под ней — тайник.</p>${G.takeHtml(['winding_key']) || '<p class="hs-cap">Тайник пуст.</p>'}` };
        const p = G.ps; p.place = p.place || {}; const placed = Object.values(p.place);
        return { t: 'Кукольный домик', html: `<p class="hs-txt">Копия этого дома, только меньше. Четыре комнаты и четыре тряпичные куклы. Выбери куклу, потом комнату.</p>
          <div class="hs-dolls">${DOLLS.map((d) => `<button data-d="${d.id}" class="${p.sel === d.id ? 'sel' : ''} ${placed.includes(d.id) ? 'used' : ''}">${d.n}</button>`).join('')}</div>
          <div class="hs-dh">${DROOMS.map((r) => `<button data-r="${r.id}" class="r${r.y}"><small>${r.n}</small><b>${p.place[r.id] ? DOLLS.find((d) => d.id === p.place[r.id]).n : '—'}</b></button>`).join('')}</div>
          <button class="hs-btn" id="hsGo" ${placed.length < 4 ? 'disabled' : ''}>Закрыть домик</button>`,
        bind: (el) => {
          el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { p.sel = b.dataset.d; SFX.play('tick'); G.renderPanel(); }));
          el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { if (!p.sel) return; for (const k in p.place) if (p.place[k] === p.sel) delete p.place[k]; p.place[b.dataset.r] = p.sel; p.sel = null; G.snd('book'); G.renderPanel(); }));
          $('#hsGo', el).onclick = () => G.act('dollhouse', { ...p.place });
        } };
      }, o),
      n_musicbox: (o, S, f) => P(() => f.music
        ? { t: 'Музыкальная шкатулка', html: `<p class="hs-txt">Балерина медленно кружится. Выдвинулось потайное дно.</p>${G.takeHtml(['crypt_key']) || ''}<button class="hs-btn ghost" id="hsPlay">Послушать ещё раз</button>`, bind: (el) => ($('#hsPlay', el).onclick = () => G.playBox(1)) }
        : { t: 'Музыкальная шкатулка', html: `<p class="hs-txt">Красная шкатулка с балериной. Сбоку — отверстие для заводного ключа.</p>${use('winding_key', 'Завести ключиком', 'music')}`, bind: bindUse }, o),
      n_wardrobe: (o, S, f) => P(() => {
        if (f.wardrobe) return { t: 'Шкаф', html: `<button class="hs-btn ghost" data-doc="wardrobe">Осмотреть стенки</button>${G.takeHtml(['attic_key'])}` };
        const p = G.ps; p.l = p.l || '';
        const AB = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';
        return { t: 'Шкаф', html: `<p class="hs-txt">Шкаф заперт на кодовый замок из четырёх букв. Изнутри доносится тихое царапанье — или показалось.</p><div class="hs-code">${[0, 1, 2, 3].map((i) => `<div><b>${p.l[i] || '·'}</b></div>`).join('')}</div>
          <div class="hs-abc">${[...AB].map((c) => `<button data-c="${c}">${c}</button>`).join('')}<button data-c="⌫">⌫</button></div><button class="hs-btn" id="hsGo">Открыть</button>`,
        bind: (el) => { el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { SFX.play('tick'); if (b.dataset.c === '⌫') p.l = p.l.slice(0, -1); else if (p.l.length < 4) p.l += b.dataset.c; G.renderPanel(); })); $('#hsGo', el).onclick = () => { G.act('wardrobe', p.l); p.l = ''; }; } };
      }, o),
      n_drawings: (o) => G.doc('drawings', o),
      n_bed: (o) => { G.say('Кровать', 'Маленькая кровать. Простыня холодная — как будто с неё только что встали. На подушке вмятина.'); G.focusOn(o); },
      n_horse: (o) => { G.snd('creak'); G.say('Лошадка-качалка', 'Качается. Сама. Медленно-медленно.'); G.focusOn(o); },
      n_hatch: (o, S, f) => { if (f.attic) return G.go('attic'); P(() => ({ t: 'Люк в потолке', html: `<p class="hs-txt">Люк на чердак, запертый висячим замком. Сверху иногда слышны шаги.</p>${use('attic_key', 'Отпереть ключом', 'unlock', 'attic')}`, bind: bindUse }), o); },
      // ---------- Чердак ----------
      a_hatch: () => G.go('nursery'),
      a_rings: (o, S, f) => P(() => {
        if (f.rings) return { t: 'Сундук', html: `<p class="hs-txt">Крышка откинута. Внутри — последние записи доктора и резной ключ.</p><button class="hs-btn ghost" data-doc="confession">Читать</button>${G.takeHtml(['key_a'])}` };
        const p = G.ps; p.r = p.r || [0, 0, 0];
        const names = ['Внешнее', 'Среднее', 'Внутреннее'];
        return { t: 'Сундук с кольцами', html: `<p class="hs-txt">Замок из трёх латунных колец с символами. Над ними — вырезанная стрелка.</p><canvas class="hs-rings" width="360" height="360"></canvas>
          <div class="hs-ringbtn">${names.map((n, i) => `<div><span>${n}</span><button data-r="${i}" data-d="-1">⟲</button><button data-r="${i}" data-d="1">⟳</button></div>`).join('')}</div><button class="hs-btn" id="hsGo">Повернуть ручку</button>`,
        bind: (el) => {
          const g = $('.hs-rings', el).getContext('2d'), W = 360, cx = W / 2, cy = W / 2 + 10, R = 160;
          g.fillStyle = '#1a140e'; g.fillRect(0, 0, W, W);
          RING.forEach((ring, ri) => { const r0 = R * (1 - ri * 0.3), r1 = r0 - R * 0.27; const gr = g.createRadialGradient(cx, cy, r1, cx, cy, r0); gr.addColorStop(0, '#5a4214'); gr.addColorStop(0.5, '#c8a050'); gr.addColorStop(1, '#5a4214'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r0, 0, TAU); g.arc(cx, cy, r1, 0, TAU, true); g.fill();
            ring.forEach((sym, k) => { const a = -Math.PI / 2 + ((k - p.r[ri]) / 6) * TAU, rr = (r0 + r1) / 2; g.fillStyle = '#1a1208'; g.font = `${R * 0.14}px Georgia`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }); });
          g.fillStyle = '#8a1e1e'; g.beginPath(); g.moveTo(cx, cy - R - 2); g.lineTo(cx - 10, cy - R - 18); g.lineTo(cx + 10, cy - R - 18); g.fill();
          el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { const i = +b.dataset.r; p.r[i] = (p.r[i] + 6 + +b.dataset.d) % 6; G.snd('tick2'); G.renderPanel(); }));
          $('#hsGo', el).onclick = () => G.act('rings', p.r.slice());
        } };
      }, o),
      a_tally: (o) => G.doc('tally', o),
      a_mannequin: (o) => { G.snd('sting'); G.say('Манекен', 'Портновский манекен. Когда ты отворачиваешься, он как будто оказывается ближе.'); G.focusOn(o); },
      a_trapdoor: (o) => P(() => G.finalPanel(), o),
      // ---------- Котельная ----------
      b_rubble: (o) => { G.say('Обломки', `Обломки пола и лестницы. Наверх отсюда не выбраться.\nСверху доносится голос: ${G.nm('up')}.`); G.focusOn(o); },
      b_note: (o) => G.doc('note_m', o),
      b_wallclock: (o) => G.doc('wallclock', o),
      b_drawer: (o, S, f) => {
        if (f.drawer) return P(() => ({ t: 'Ящик верстака', html: `<p class="hs-txt">Ящик выдвинут. ${G.takeHtml(['fuse1', 'crank']) ? 'Среди ржавых гвоздей — полезное.' : 'Только ржавые гвозди.'}</p>${G.takeHtml(['fuse1', 'crank'])}` }), o);
        P(() => G.wheelsPanel({ t: 'Ящик верстака', desc: 'Кодовый замок на три цифры. На латуни выгравировано: «Л. — год рождения. Три последние цифры.»', n: 3, chars: '0123456789', act: 'drawer' }), o);
      },
      b_dw: (o) => P(() => G.dwPanel(), o),
      b_fuses: (o, S, f) => P(() => {
        const slot = (on, n) => `<div class="hs-fuse ${on ? 'on' : ''}"><span>${n}</span>${on ? '<i></i>' : ''}</div>`;
        return { t: 'Щиток', html: `<p class="hs-txt">${f.power ? 'Щиток гудит. Все три предохранителя на месте, лампочка горит зелёным.' : 'Электрощиток. Три гнезда для предохранителей — заполнено только одно.'}</p>
          <div class="hs-fuses">${slot(true, 'I')}${slot(f.fs_fuse1, 'II')}${slot(f.fs_fuse2, 'III')}</div>${f.power ? '' : use('fuse1', 'Вставить предохранитель', 'fuse', 'fuse1') + use('fuse2', 'Вставить второй предохранитель', 'fuse', 'fuse2')}`, bind: bindUse };
      }, o),
      b_gauges: (o, S, f) => (f.power ? G.doc('gauges', o) : (G.say('Котёл', 'Холодный котёл. Четыре манометра — стрелки лежат на нуле. Под каждым выбит символ. Котёл не работает без электричества.'), G.focusOn(o))),
      b_door_laundry: (o, S, f) => { if (f.laundry) return G.go('laundry'); P(() => ({ t: 'Дверь «Прачечная»', html: `<p class="hs-txt">Дверь заперта на висячий замок. Под ней — полоска мутного света. И капает вода.</p>${use('key_laundry', 'Отпереть ключом «Прачечная»', 'unlock', 'laundry')}`, bind: bindUse }), o); },
      // ---------- Прачечная ----------
      l_door_boiler: () => G.go('boiler'),
      l_sheets: (o) => G.doc('sheets', o),
      l_gowns: (o) => G.doc('gowns', o),
      l_radio: (o) => { G.snd('static'); G.doc('radio', o); },
      l_tub: (o, S, f) => P(() => f.tub
        ? { t: 'Ванна', html: `<p class="hs-txt">Вода ушла. На дне остался ил и то, что в нём лежало.</p>${G.takeHtml(['record', 'medal_b']) || '<p class="hs-cap">Больше ничего.</p>'}` }
        : { t: 'Ванна', html: `<p class="hs-txt">Ванна полна чёрной стоячей воды. На дне что-то блестит. Цепочка пробки уходит глубоко — рукой не достать, и опускать руку туда совсем не хочется.</p>${use('cane', 'Подцепить цепочку тростью', 'tub')}`, bind: bindUse }, o),
      l_door_chapel: (o, S, f) => { if (f.chapel) return G.go('chapel'); P(() => ({ t: 'Железная дверь', html: `<p class="hs-txt">Тяжёлая железная дверь. В центре — углубление в форме овального медальона. За дверью — эхо, как в церкви.</p>${use('medal', 'Вставить медальон', 'chapel')}${G.has('medal_a') || G.has('medal_b') ? '<p class="hs-cap">Половинку медальона сначала нужно соединить со второй — нажми на предмет внизу.</p>' : ''}`, bind: bindUse }), o); },
      // ---------- Часовня ----------
      c_door_laundry: () => G.go('laundry'),
      c_candles: (o, S, f) => P(() => ({ t: 'Алтарь', html: f.candles ? '<p class="hs-txt">Свечи горят ровно, без треска. Пламя не колышется — воздух здесь совсем неподвижен.</p>' : `<p class="hs-txt">Алтарь с огарками свечей. Над ним — тёмный витраж.</p>${use('matches', 'Зажечь свечи спичками', 'candles')}`, bind: bindUse }), o),
      c_glass: (o) => G.doc('glass', o),
      c_diary: (o) => G.doc('diary', o),
      c_pews: (o) => { G.say('Скамьи', 'На спинке передней скамьи вырезано детской рукой: «Лиза была здесь». И ниже, другим почерком: «и есть».'); G.focusOn(o); },
      c_organ: (o, S, f) => P(() => {
        if (f.crypt) return { t: 'Орган', html: '<p class="hs-txt">Орган молчит. Решётка склепа поднята.</p>' };
        const p = G.ps; p.seq = p.seq || [];
        const keys = ['☀', '☾', '✦', '✿', '✝'];
        return { t: 'Орган', html: `<p class="hs-txt">Маленький орган. Пять клавиш с символами. Механизм тянется к решётке склепа.</p><div class="hs-organ">${keys.map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div><div class="hs-seq">${p.seq.map((s) => `<i>${s}</i>`).join('') || '<span>…</span>'}</div><button class="hs-btn ghost small" id="hsClr">Сначала</button>`,
        bind: (el) => {
          el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { const k = b.dataset.k; G.note(PITCH[k], 'organ', 1); p.seq.push(k); if (p.seq.length === LULLABY.length) { const v = p.seq.slice(); setTimeout(() => G.act('organ', v), 500); } else if (p.seq.length > LULLABY.length) p.seq = [k]; G.renderPanel(); }));
          $('#hsClr', el).onclick = () => { p.seq = []; G.renderPanel(); };
        } };
      }, o),
      c_gate: (o, S, f) => { if (f.crypt) return G.go('crypt'); G.say('Решётка склепа', 'Тяжёлая решётка опущена. Цепи от неё уходят к органу.'); G.focusOn(o); },
      // ---------- Склеп ----------
      k_back: () => G.go('chapel'),
      k_niches: (o) => G.doc('niches', o),
      k_mosaic: (o) => G.doc('mosaic', o),
      k_grate: (o, S, f) => { if (f.passage) return G.go('passage'); P(() => ({ t: 'Ржавая решётка', html: `<p class="hs-txt">За решёткой — узкий ход, уходящий вверх, внутрь стен дома.</p>${use('crypt_key', 'Отпереть железным ключом', 'unlock', 'passage')}`, bind: bindUse }), o); },
      // ---------- Тайный ход ----------
      p_back: () => G.go('crypt'),
      p_levers: (o, S, f) => P(() => {
        if (f.levers) return { t: 'Рычаги', html: `<p class="hs-txt">В стене открылась ниша.</p>${G.takeHtml(['key_b']) || '<p class="hs-cap">Ниша пуста.</p>'}` };
        const p = G.ps; p.seq = p.seq || [];
        return { t: 'Рычаги', html: `<p class="hs-txt">Четыре ржавых рычага с римскими цифрами. Если тянуть в неправильном порядке, они с лязгом возвращаются.</p><div class="hs-levers">${[1, 2, 3, 4].map((n) => `<button data-l="${n}" class="${p.seq.includes(n) ? 'down' : ''}"><i></i><span>${['I', 'II', 'III', 'IV'][n - 1]}</span></button>`).join('')}</div>`,
        bind: (el) => el.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { const n = +b.dataset.l; if (p.seq.includes(n)) return; p.seq.push(n); G.snd('lever'); if (p.seq.length === 4) G.act('levers', p.seq.slice()); G.renderPanel(); })) };
      }, o),
      p_ladder: (o) => P(() => G.finalPanel(), o),
      q_any: (o) => { G.say('Тихая комната', 'Здесь тихо. Совсем тихо. Но уже не страшно.'); },
    };
    },
    onEvent(G, e, me) {
      switch (e.a) {
        case 'crank': if (me) { G.snd('mech'); G.toast('Рукоять встала в механизм. Тросы лифта натянулись.'); } else G.toast('Где-то в стене скрипнули тросы кухонного лифта.'); break;
        case 'power': G.snd('power'); G.toast(G.role === 'down' ? 'Щиток загудел. Под потолком вспыхнули лампы. Котёл ожил.' : 'Снизу донёсся гул котла. По дому прошёл щелчок электричества.', 4200); break;
        case 'lullaby': G.playLullaby(me ? 1 : 0.25); if (me) G.toast('Игла зашипела. Из раструба поплыла колыбельная…'); else G.toast('Сквозь пол еле слышно играет колыбельная…'); break;
        case 'organ': G.playLullaby(me ? 1 : 0.3, 'organ'); G.snd('mech'); if (me) G.toast('Орган откликнулся. Решётка склепа с лязгом поползла вверх.', 4000); else G.toast('Из-под пола — гулкие органные ноты.'); break;
        case 'musicbox': G.playBox(me ? 1 : 0.2); if (me) G.toast('Шкатулка заиграла. Дно выдвинулось — там что-то лежит.'); break;
      }
    },
    methods: {
      playLullaby(vol, kind = 'box') {
        if (kind === 'box') SFX.noise(4.5, { vol: 0.05 * vol, freq: 3000, type: 'bandpass', q: 0.4 });
        const durs = [0.6, 0.6, 0.9, 0.6, 0.6, 1.2];
        let tt = 0.3; LULLABY.forEach((s, i) => { this.note(PITCH[s] * (kind === 'organ' ? 0.5 : 1), kind === 'organ' ? 'organ' : 'box', vol, tt); tt += durs[i]; });
      },
      playBox(vol) { const tune = [880, 784, 659, 587, 659, 523, 587, 494]; tune.forEach((f, i) => this.note(f, 'box', vol * 0.8, 0.2 + i * 0.42)); },
    },
  });
})();
