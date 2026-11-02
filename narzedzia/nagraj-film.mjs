// Nagrywa film z pokazu „Najważniejsze” (trzy filary, ok. 75 s) w rozdzielczości 1920 × 1080.
// Wymaga Playwright z Chromium i ffmpeg. Uruchomienie (przy działającym `node dev-server.mjs`):
//   node narzedzia/nagraj-film.mjs [adres] [plik.mp4]
// Domyślnie http://localhost:4173 i mobywatel-dla-bliskich-najwazniejsze.mp4 w bieżącym katalogu.
// Klatki to zrzuty ekranu z czasem wykonania, więc film trwa tyle, co prawdziwy pokaz.
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// require, a nie import: tak znajdzie też Playwright zainstalowany globalnie
const { chromium } = createRequire(import.meta.url)('playwright');

const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? 'mobywatel-dla-bliskich-najwazniejsze.mp4';
// Ile widać kartę „W 60 sekund” przed pokazem i ostatni ekran po nim
const INTRO_MS = 4000;
const OUTRO_MS = 3500;
const LIMIT_MS = 150000;

const dir = await mkdtemp(join(tmpdir(), 'film-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const frames = [];
const start = Date.now();
const grab = async () => {
  const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  frames.push([file, Date.now()]);
};

while (Date.now() - start < INTRO_MS) await grab();
await page.locator('.intro [data-autoplay="highlights"]').click();
let ended = 0;
while (Date.now() - start < LIMIT_MS) {
  await grab();
  const running = await page.evaluate(() => Boolean(document.querySelector('.autoplay-running')));
  if (!running && !ended) ended = Date.now();
  if (ended && Date.now() - ended > OUTRO_MS) break;
}
await browser.close();

// Lista klatek z czasem trwania każdej dla ffmpeg (demuxer concat)
const list = frames
  .map(([file, at], i) => `file '${file}'\nduration ${(((frames[i + 1]?.[1] ?? at + 100) - at) / 1000).toFixed(3)}`)
  .join('\n');
await writeFile(join(dir, 'frames.txt'), `${list}\nfile '${frames.at(-1)[0]}'\n`);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'),
  '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-movflags', '+faststart', out]);
await rm(dir, { recursive: true, force: true });
console.log(`Gotowe: ${out} (${((frames.at(-1)[1] - frames[0][1]) / 1000).toFixed(0)} s)`);
