const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8767);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    let target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(`${root}${path.sep}`) && target !== root) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    const stat = fs.statSync(target);
    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeTypes[path.extname(target).toLowerCase()] || 'application/octet-stream'
    };
    const match = request.headers.range?.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      response.writeHead(206, {
        ...headers,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`
      });
      fs.createReadStream(target, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, { ...headers, 'Content-Length': stat.size });
    fs.createReadStream(target).pipe(response);
  } catch (error) {
    response.writeHead(500).end('Internal server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`OBB-Few preview: http://127.0.0.1:${port}/index.html`);
});
