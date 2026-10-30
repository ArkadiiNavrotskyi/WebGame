// Поднимает номер версии перед выкладкой: телефоны сразу подхватят обновление, а не возьмут старое из кэша.
// Запуск: node tools/bump-version.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const vf = path.join(root, 'version.json');
const v = JSON.parse(fs.readFileSync(vf, 'utf8')).v + 1;
fs.writeFileSync(vf, JSON.stringify({ v }) + '\n');
const idx = path.join(root, 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace(/\?v=\d+/g, `?v=${v}`));
const cfg = path.join(root, 'js', 'config.js');
fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/version: \d+/, `version: ${v}`));
console.log('version', v);
