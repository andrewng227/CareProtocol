const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = parseInt(process.env.PORT || '3000', 10);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Resolve normalized file path inside workspace
  let cleanPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  if (cleanPath === '.' || cleanPath === '/' || cleanPath === '\\' || cleanPath === '') {
    cleanPath = 'CareProtocol_GiaoDien.html';
  }

  const findFile = (relPath) => {
    // 1. Check direct path in root
    let p = path.join(__dirname, relPath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;

    // 2. Check direct path in public
    p = path.join(__dirname, 'public', relPath);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;

    // 3. Try with .html extension
    if (!path.extname(relPath)) {
      p = path.join(__dirname, relPath + '.html');
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;

      p = path.join(__dirname, 'public', relPath + '.html');
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }

    // 4. Default fallback: CareProtocol_GiaoDien.html
    const fallbackRoot = path.join(__dirname, 'CareProtocol_GiaoDien.html');
    if (fs.existsSync(fallbackRoot)) return fallbackRoot;

    const fallbackPublic = path.join(__dirname, 'public', 'CareProtocol_GiaoDien.html');
    if (fs.existsSync(fallbackPublic)) return fallbackPublic;

    return null;
  };

  const finalFile = findFile(cleanPath);

  if (finalFile) {
    const ext = path.extname(finalFile).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    fs.createReadStream(finalFile).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + reqPath);
  }
});

let opened = false;
function startServer(portToTry) {
  server.listen(portToTry, () => {
    const url = `http://localhost:${portToTry}/CareProtocol_GiaoDien.html`;
    console.log('======================================================================');
    console.log(`   CAREPROTOCOL - LOCAL SERVER ĐANG CHẠY`);
    console.log(`   👉 Đường dẫn: ${url}`);
    console.log('======================================================================');
    console.log('💡 Đang tự động mở trình duyệt web cho anh...');
    console.log('💡 Giữ cửa sổ này để máy chủ tiếp tục hoạt động. (Nhấn Ctrl+C để tắt)');

    if (!opened) {
      opened = true;
      const startCmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
      exec(startCmd, (err) => {
        if (err) console.log('Không thể tự mở trình duyệt, hãy click link trên thủ công nhé!');
      });
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Cổng ${portToTry} đang bận, đang tự động thử cổng ${portToTry + 1}...`);
      server.close();
      startServer(portToTry + 1);
    } else {
      console.error('Lỗi khởi động máy chủ:', err);
    }
  });
}

startServer(PORT);
