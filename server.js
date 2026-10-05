const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = parseInt(process.env.PORT || '3000', 10);
const ttsCache = new Map();

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
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg'
};

function getGeminiKeys() {
  const defaultKeys = [];
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/GEMINI_API_KEY=(.+)/);
      if (m && m[1]) {
        const parsed = m[1].split(',').map(s => s.trim()).filter(Boolean);
        if (parsed.length) return parsed;
      }
    }
  } catch (e) {}
  return defaultKeys;
}

function handleRequest(req, res) {
  let reqPath = req.url.split('?')[0];

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // API nội bộ: cấp key Gemini cho client fallback (chỉ chạy localhost, không deploy công khai)
  if (reqPath === '/api/config') {
    const keys = getGeminiKeys();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ success: true, geminiKeys: keys }));
  }

  // API Chat AI Proxy cho Trợ lý Y tế CareProtocol
  if (reqPath === '/api/chat') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    }

    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const userMsg = body.message || 'Xin chào';
        const protocol = body.protocol || 'acl';
        const history = body.history || [];
        const attachedImage = body.image || null;

        const protoNames = {
          acl: "Chấn thương dây chằng gối (Khớp gối)",
          stroke: "Phục hồi sau đột quỵ (Chi trên & Vận động)",
          csection: "Sinh mổ C-section (Sản khoa & Vết mổ thành bụng)",
          laparoscopy: "Mổ nội soi tiêu hoá (Ổ bụng & Ngừa huyết khối tĩnh mạch)",
          spine: "Thoát vị đĩa đệm cột sống (Thắt lưng & Thần kinh toạ)",
        };
        const currentProto = protoNames[protocol] || "Chăm sóc phục hồi sau phẫu thuật";

        const sysPrompt = `Bạn là Trợ lý AI Y tế CareProtocol - đồng hành hỗ trợ theo dõi và phục hồi chức năng sau phẫu thuật.
Bệnh nhân hiện đang theo dõi phác đồ: ${currentProto}.
TÔNG GIỌNG VÀ PHONG CÁCH TƯ VẤN (NGHIÊM TÚC, CHUẨN MỰC Y KHOA & TEXT-BY-TEXT):
1. VĂN PHONG VÀ XƯNG HÔ: Xưng là "Trợ lý AI" (hoặc "tôi"), gọi người dùng là "bạn". Tuyệt đối KHÔNG xưng là "Bác sĩ" hay "Bác sĩ Trưởng".
2. Giữ giọng văn nghiêm túc, điềm đạm, ân cần, chuẩn mực y tế.
3. ĐỘ DÀI: Mỗi tin nhắn chỉ từ 2 đến 4 câu ngắn gọn, trao đổi từng bước tự nhiên (text-by-text).
4. ĐỐI VỚI HÌNH ẢNH: Quan sát vết mổ / đơn thuốc, đưa ra nhận xét lâm sàng sơ bộ và nhắc nhở không thay thế thăm khám trực tiếp.`;

        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
          history.slice(-8).forEach(h => {
            const parts = [];
            if (h.image && h.image.data) {
              parts.push({
                inlineData: {
                  mimeType: h.image.mimeType || "image/jpeg",
                  data: h.image.data
                }
              });
            }
            parts.push({ text: h.text || h.message || "" });
            contents.push({ role: h.role === "assistant" || h.role === "model" ? "model" : "user", parts });
          });
        }

        const curParts = [];
        if (attachedImage && attachedImage.data) {
          curParts.push({
            inlineData: {
              mimeType: attachedImage.mimeType || "image/jpeg",
              data: attachedImage.data
            }
          });
        }
        curParts.push({ text: userMsg });
        contents.push({ role: "user", parts: curParts });

        const keys = getGeminiKeys();
        const models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"];

        let aiAnswer = null;

        keyLoop: for (const m of models) {
          for (const k of keys) {
            try {
              const payload = JSON.stringify({
                system_instruction: { parts: [{ text: sysPrompt }] },
                contents: contents,
                generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
              });

              const gRes = await new Promise((resolve, reject) => {
                const gReq = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                  },
                  timeout: 10000
                }, (response) => {
                  let resChunks = '';
                  response.on('data', c => resChunks += c);
                  response.on('end', () => resolve({ status: response.statusCode, data: resChunks }));
                });
                gReq.on('error', reject);
                gReq.on('timeout', () => { gReq.destroy(); reject(new Error('Timeout')); });
                gReq.write(payload);
                gReq.end();
              });

              if (gRes.status === 200) {
                const parsed = JSON.parse(gRes.data);
                const txt = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (txt) {
                  aiAnswer = txt;
                  break keyLoop;
                }
              }
            } catch (err) {
              console.warn(`[Chat Proxy] Model ${m} failed:`, err.message);
            }
          }
        }

        if (!aiAnswer) {
          aiAnswer = "Chào bạn! Tôi là Trợ lý AI Y tế CareProtocol. Tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc về quá trình hồi phục, vết mổ và chế độ tập luyện của bạn. Bạn hãy mô tả rõ hơn cảm giác hiện tại hoặc gửi ảnh vết thương để tôi hỗ trợ nhé!";
        }

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true, answer: aiAnswer, sources: [] }));
      } catch (err) {
        console.error('[Chat API Error]:', err);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          success: true,
          answer: "Chào bạn, Trợ lý AI CareProtocol đã ghi nhận triệu chứng của bạn. Bạn hãy tiếp tục nghỉ ngơi hợp lý, theo dõi nhiệt độ cơ thể và vết mổ. Nếu có dấu hiệu sốt cao hoặc đau nhức dữ dội, hãy báo ngay cho bác sĩ phụ trách nhé!",
          sources: []
        }));
      }
    });
    return;
  }

  // API TTS Proxy: Chuyển tiếp âm thanh chất lượng cao Google Neural Voice cho client
  if (reqPath === '/api/tts') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('text') || '';
    if (!q.trim()) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Thiếu tham số chữ "q"');
    }
    const cleanQ = q.trim();
    if (ttsCache.has(cleanQ)) {
      const cached = ttsCache.get(cleanQ);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': cached.length,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(cached);
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanQ)}&tl=vi&client=tw-ob`;
    https.get(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (googleRes) => {
      if (googleRes.statusCode !== 200) {
        res.writeHead(googleRes.statusCode, { 'Content-Type': 'text/plain' });
        return res.end('Google TTS returned status: ' + googleRes.statusCode);
      }
      const chunks = [];
      googleRes.on('data', chunk => chunks.push(chunk));
      googleRes.on('end', () => {
        const fullBuf = Buffer.concat(chunks);
        ttsCache.set(cleanQ, fullBuf);
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': fullBuf.length,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        });
        res.end(fullBuf);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Lỗi TTS Proxy: ' + err.message);
    });
    return;
  }

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
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(finalFile).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + reqPath);
  }
}

let opened = false;

function createAndListen(portToTry) {
  const srv = http.createServer(handleRequest);

  srv.listen(portToTry, () => {
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

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Cổng ${portToTry} đang bận, đang tự động thử cổng ${portToTry + 1}...`);
      try { srv.close(); } catch (_) {}
      createAndListen(portToTry + 1);
    } else {
      console.error('Lỗi khởi động máy chủ:', err);
    }
  });
}

createAndListen(PORT);

