// Ruch ust po polsku bez nagrania: tekst → kolejka kształtów ust (wizemy Oculus, które mają postacie Rocketbox).
// Polska pisownia jest prawie fonetyczna, więc wystarczy zamiana liter i dwuznaków na kształty ust.

const VOWELS = { a: 'aa', ą: 'O', e: 'E', ę: 'E', i: 'I', y: 'I', o: 'O', ó: 'U', u: 'U' };
const DIGRAPHS = { sz: 'CH', cz: 'CH', rz: 'CH', dż: 'CH', dź: 'CH', dz: 'SS', ch: 'kk', ci: 'CH', si: 'CH', zi: 'CH', ni: 'nn' };
const CONSONANTS = {
  p: 'PP', b: 'PP', m: 'PP',
  f: 'FF', w: 'FF',
  t: 'DD', d: 'DD',
  n: 'nn', ń: 'nn', l: 'nn',
  ł: 'U',
  k: 'kk', g: 'kk', h: 'kk',
  s: 'SS', z: 'SS', c: 'SS',
  ś: 'CH', ź: 'CH', ż: 'CH', ć: 'CH',
  r: 'RR',
  j: 'I',
};

// Względna długość: samogłoski trwają dłużej, przecinek i kropka to pauza z zamkniętymi ustami
const LENGTH = { vowel: 1.7, consonant: 1, space: 0.6, comma: 3.5, stop: 5 };
// Siła kształtu ust: samogłoski otwierają usta mocniej niż spółgłoski
const STRENGTH = { vowel: 0.85, consonant: 0.55 };

function tokenize(text) {
  const t = text.toLowerCase();
  const out = [];
  for (let i = 0; i < t.length; ) {
    const two = t.slice(i, i + 2);
    const ch = t[i];
    if (DIGRAPHS[two]) {
      out.push({ viseme: DIGRAPHS[two], kind: 'consonant' });
      i += 2;
      // „ci”, „si”, „ni” zmiękczają, ale „i” zostaje samogłoską, gdy po nim nie ma innej samogłoski
      if (two.endsWith('i') && !VOWELS[t[i]]) out.push({ viseme: 'I', kind: 'vowel' });
      continue;
    }
    if (VOWELS[ch]) out.push({ viseme: VOWELS[ch], kind: 'vowel' });
    else if (CONSONANTS[ch]) out.push({ viseme: CONSONANTS[ch], kind: 'consonant' });
    else if (ch === ',' || ch === ';' || ch === ':' || ch === '–' || ch === '—') out.push({ viseme: null, kind: 'comma' });
    else if (ch === '.' || ch === '!' || ch === '?') out.push({ viseme: null, kind: 'stop' });
    else if (/\s/.test(ch)) out.push({ viseme: null, kind: 'space' });
    i += 1;
  }
  return out;
}

// Czas czytania napisu: ok. 14 znaków na sekundę, ale nie krócej niż 1,6 s
export const readingTime = (text) => Math.max(1600, (text.length / 14) * 1000);

// Oś czasu: [{ start, end, viseme, strength }], długość w ms dopasowana do czasu czytania napisu
export function visemeTimeline(text, durationMs = readingTime(text)) {
  const tokens = tokenize(text);
  const total = tokens.reduce((sum, tok) => sum + LENGTH[tok.kind], 0) || 1;
  const unit = durationMs / total;
  let at = 0;
  return tokens.map((tok) => {
    const start = at;
    at += LENGTH[tok.kind] * unit;
    return { start, end: at, viseme: tok.viseme, strength: STRENGTH[tok.kind] ?? 0 };
  });
}
