import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');
const port = Number(process.env.PORT) || 8080;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

const sendFile = (response, filePath) => {
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
};

createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filePath = normalize(join(root, requestPath));

    if (!filePath.startsWith(root + sep) && filePath !== join(root, 'index.html')) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileInfo = await stat(filePath).catch(() => null);
    if (fileInfo?.isFile()) {
      sendFile(response, filePath);
      return;
    }

    // A rota é controlada pelo Alpine.js; o servidor precisa entregar a SPA
    // para que o navegador possa resolver a URL após um refresh.
    sendFile(response, join(root, 'index.html'));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, () => {
  console.log(`Faytor disponível em http://localhost:${port}`);
});
