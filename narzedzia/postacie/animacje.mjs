// Animacje Rocketbox (FBX, 1–5 MB każda) → małe pliki JSON dla prototypu.
// Zostają tylko obroty kości ciała (bez twarzy i bez przesunięć), 20 klatek na sekundę, 4 miejsca po przecinku.
// Machanie jest przycięte: ręka idzie w górę i macha, opuszczenie robi płynne przejście do stania.
//
// Uruchomienie (bez instalowania paczek, korzysta z three.js z vendor/):
//   node narzedzia/postacie/animacje.mjs <folder z plikami FBX z Rocketbox>
// Źródło: github.com/microsoft/Microsoft-Rocketbox, Assets/Animations/all_animations_max_motextr_static (licencja MIT).
import { register } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// „three” wskazuje na kopię w vendor/, tak jak mapa importów na stronie
const threeUrl = new URL('../../vendor/three/build/three.module.min.js', import.meta.url).href;
register(
  `data:text/javascript,${encodeURIComponent(
    `export async function resolve(s, c, n) { return s === 'three' ? { url: ${JSON.stringify(threeUrl)}, shortCircuit: true } : n(s, c); }`,
  )}`,
);
const THREE = await import('three');
const { FBXLoader } = await import('../../vendor/three/examples/jsm/loaders/FBXLoader.js');

// [nazwa w prototypie, plik Rocketbox, przycięcie w sekundach]
const CLIPS = [
  ['idle', 'f_idle_neutral_01'],
  ['wave', 'f_wave_01', [0, 3.4]],
  ['talk', 'f_gestic_talk_relaxed_01'],
  ['listen', 'f_gestic_listen_accept_02'],
];

const FPS = 20;
const FACE_BONE = /(Eye|Mouth|Lip|lip|Jaw|Tongue|Masseter|Caninus|Cheek|Eyebrow|Nose|Nub)/;
const OUT = new URL('../../assets/postacie/animacje/', import.meta.url);
const round = (v) => Math.round(v * 1e4) / 1e4;

const src = process.argv[2];
if (!src) {
  console.error('Podaj folder z plikami FBX animacji Rocketbox.');
  process.exit(1);
}
console.warn = () => {};

for (const [name, file, trim] of CLIPS) {
  const buf = readFileSync(join(src, `${file}.max.fbx`));
  const clip = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '').animations[0];
  const [from, to] = trim ?? [0, clip.duration];
  const times = [];
  for (let t = from; t <= to + 1e-6; t += 1 / FPS) times.push(t);

  const tracks = [];
  for (const track of clip.tracks) {
    const [bone, prop] = track.name.split('.');
    if (prop !== 'quaternion' || FACE_BONE.test(bone)) continue;
    const interp = track.createInterpolant();
    const values = [];
    for (const t of times) values.push(...[...interp.evaluate(t)].map(round));
    // Kość, która się nie rusza, dostaje jedną klatkę
    const q0 = new THREE.Quaternion().fromArray(values, 0);
    const still = times.every((_, i) => q0.angleTo(new THREE.Quaternion().fromArray(values, i * 4)) < 0.002);
    tracks.push({
      name: track.name,
      type: 'quaternion',
      times: still ? [0] : times.map((t) => round(t - from)),
      values: still ? values.slice(0, 4) : values,
    });
  }
  const json = { name, duration: round(to - from), tracks };
  const out = new URL(`${name}.json`, OUT);
  writeFileSync(out, JSON.stringify(json));
  console.log(`${name}: ${file}, ${json.duration} s, ${tracks.length} kości, ${(JSON.stringify(json).length / 1024).toFixed(0)} KB`);
}
