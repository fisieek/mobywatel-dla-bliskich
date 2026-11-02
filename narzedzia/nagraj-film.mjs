// Nagrywa film z pokazu „Najważniejsze” (trzy filary, ok. 75 s) w 1920 × 1080, z napisami.
// Wymaga Playwright z Chromium i ffmpeg z libass. Uruchomienie (przy działającym `node dev-server.mjs`):
//   node narzedzia/nagraj-film.mjs [adres] [plik.mp4]
// Domyślnie http://localhost:4173 i mobywatel-dla-bliskich-najwazniejsze.mp4 w bieżącym katalogu.
// Obok filmu powstaje plik .srt z tymi samymi napisami (np. do YouTube albo odtwarzacza z wyłączanymi napisami).
//
// Klatki to zrzuty ekranu z czasem wykonania, więc film trwa tyle, co prawdziwy pokaz.
// Napisy (narzedzia/napisy.mjs) są przypięte do kroków pokazu, a nie do sekund, więc nie rozjadą się,
// gdy pokaz przyspieszy albo zwolni. Obraz jest lekko pomniejszony, a napisy stoją w pasku pod nim,
// żeby nie zasłaniały telefonów.
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { cues } from './napisy.mjs';

// require, a nie import: tak znajdzie też Playwright zainstalowany globalnie
const { chromium } = createRequire(import.meta.url)('playwright');

const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? 'mobywatel-dla-bliskich-najwazniejsze.mp4';
const srtOut = out.replace(/\.mp4$/i, '') + '.srt';

// Ile widać kartę „W skrócie” przed pokazem i ostatni ekran po nim (napisy na starcie i na końcu potrzebują czasu)
const INTRO_MS = 5000;
const OUTRO_MS = 5000;
const LIMIT_MS = 240000;

// Układ klatki: obraz strony 90% (1728 × 972) u góry, pasek na napisy pod nim
const W = 1920;
const H = 1080;
const VIDEO_W = 1728;
const VIDEO_H = 972;
const BAND = '0x141824';

const dir = await mkdtemp(join(tmpdir(), 'film-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const frames = [];
// Kiedy (ms od początku filmu) pokaz doszedł do danego kroku; 0 — karta przed pokazem, 'end' — koniec pokazu
const stepAt = { 0: 0 };
let start = 0;
const grab = async () => {
  const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
  const now = Date.now();
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  if (!start) start = now;
  frames.push([file, now]);
  return now - start;
};

while (!start || Date.now() - start < INTRO_MS) await grab();
await page.locator('.intro [data-autoplay="highlights"]').click();
let ended = 0;
while (Date.now() - start < LIMIT_MS) {
  const at = await grab();
  const step = await page.evaluate(() => document.querySelector('.autoplay-running')?.dataset.step ?? null);
  if (step && !(step in stepAt)) stepAt[step] = at;
  if (!step && Object.keys(stepAt).length > 1 && !ended) {
    ended = Date.now();
    stepAt.end = at;
  }
  if (ended && Date.now() - ended > OUTRO_MS) break;
}
await browser.close();
const total = frames.at(-1)[1] - start;

// Napisy: każdy od swojego kroku do początku następnego (ostatni do końca filmu)
const timed = cues
  .map((cue) => ({ ...cue, from: stepAt[cue.step] }))
  .filter((cue) => {
    if (cue.from === undefined) console.warn(`Uwaga: pokaz nie doszedł do kroku ${cue.step}, napis pominięty: ${cue.text}`);
    return cue.from !== undefined;
  })
  .sort((a, b) => a.from - b.from)
  .map((cue, i, all) => ({ ...cue, to: i + 1 < all.length ? all[i + 1].from : total }));

const pad = (n, size = 2) => String(n).padStart(size, '0');
const srtTime = (ms) => `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(Math.round(ms % 1000), 3)}`;
const assTime = (ms) => `${Math.floor(ms / 3600000)}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(Math.floor((ms % 1000) / 10))}`;

const srt = timed.map((cue, i) => `${i + 1}\n${srtTime(cue.from)} --> ${srtTime(cue.to)}\n${cue.text}\n`).join('\n');
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Napis,Inter,36,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,60,60,${Math.round((H - VIDEO_H - 36 * 1.25) / 2)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${timed.map((cue) => `Dialogue: 0,${assTime(cue.from)},${assTime(cue.to)},Napis,,0,0,0,,${cue.text}`).join('\n')}
`;
await writeFile(srtOut, srt);
await writeFile(join(dir, 'napisy.ass'), ass);

// Lista klatek z czasem trwania każdej dla ffmpeg (demuxer concat)
const list = frames
  .map(([file, at], i) => `file '${file}'\nduration ${(((frames[i + 1]?.[1] ?? at + 100) - at) / 1000).toFixed(3)}`)
  .join('\n');
await writeFile(join(dir, 'frames.txt'), `${list}\nfile '${frames.at(-1)[0]}'\n`);
const filters = [
  'fps=30',
  `scale=${VIDEO_W}:${VIDEO_H}:flags=lanczos`,
  `pad=${W}:${H}:${(W - VIDEO_W) / 2}:0:color=${BAND}`,
  `ass=${join(dir, 'napisy.ass')}`,
  'format=yuv420p',
].join(',');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'),
  '-vf', filters, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', out]);
await rm(dir, { recursive: true, force: true });

// Czy napisy da się przeczytać: ok. 15 znaków na sekundę to wygodne tempo
for (const cue of timed) {
  const seconds = (cue.to - cue.from) / 1000;
  const rate = cue.text.length / seconds;
  if (rate > 17) console.warn(`Uwaga: napis za krótko na ekranie (${seconds.toFixed(1)} s, ${rate.toFixed(0)} znaków/s): ${cue.text}`);
}
console.log(`Gotowe: ${out} (${(total / 1000).toFixed(0)} s) i ${srtOut} (${timed.length} napisów)`);
