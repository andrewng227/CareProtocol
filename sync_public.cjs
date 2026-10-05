const fs = require('fs');
const path = require('path');

const root = __dirname;
const copies = [
  { src: 'CareProtocol_GiaoDien.html', dst: ['public/CareProtocol_GiaoDien.html', 'public/index.html'] },
  { src: 'google_female_voice_pack.js', dst: ['public/google_female_voice_pack.js'] },
  { src: 'logo.png', dst: ['public/logo.png'] },
];

let changed = 0;
for (const { src, dst } of copies) {
  const srcPath = path.join(root, src);
  if (!fs.existsSync(srcPath)) {
    console.error('THIEU nguon:', src);
    process.exit(1);
  }
  const content = fs.readFileSync(srcPath);
  for (const d of dst) {
    const dstPath = path.join(root, d);
    let same = false;
    try { same = fs.existsSync(dstPath) && fs.readFileSync(dstPath).equals(content); } catch (_) {}
    if (!same) {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.writeFileSync(dstPath, content);
      console.log('CAP NHAT:', d, '(' + (content.length / 1024 / 1024).toFixed(2) + ' MB)');
      changed++;
    }
  }
}

if (changed === 0) {
  console.log('Cac ban copy da dong bo, khong can cap nhat.');
} else {
  console.log('Hoan tat: ' + changed + ' file duoc cap nhat tu nguon goc.');
}
