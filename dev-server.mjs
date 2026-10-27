// Lokalny serwer: pliki prototypu + /api/assistant (ta sama logika co na Vercelu).
// Uruchomienie: node projects/mobywatel-challenge/prototyp/dev-server.mjs
// Klucz API czyta z prototyp/.env.local (szablon: .env.example). Bez klucza działa tryb awaryjny.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAssistant } from './api/_lib/pllum.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

async function loadEnv() {
  const env = { ...process.env };
  try {
    const text = await readFile(join(ROOT, '.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // brak pliku .env.local — działamy w trybie awaryjnym
  }
  return env;
}

const env = await loadEnv();

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/assistant' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let input = null;
    try {
      input = JSON.parse(raw);
    } catch {
      // zostaje null → 400
    }
    const { status, body } = await handleAssistant(input, env);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
    return;
  }

  const path = normalize(url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname));
  if (path.includes('..') || path.startsWith('/api/') || path.includes('.env')) {
    res.writeHead(404).end();
    return;
  }
  try {
    const file = await readFile(join(ROOT, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(file);
  } catch {
    res.writeHead(404).end();
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Prototyp: http://localhost:${PORT} · PLLuM: ${env.FEATHERLESS_API_KEY ? 'klucz wczytany' : 'brak klucza, tryb awaryjny'}`);
});
