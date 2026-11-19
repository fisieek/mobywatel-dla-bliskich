// Głosy bohaterek: nagrania przygotowane wcześniej w ElevenLabs (assets/postacie/glosy/), bez połączenia
// z żadną usługą w czasie pokazu. Spis nagrań: glosy.json — tekst kwestii → { plik, ms, tempo }.
// tempo > 1 podnosi ton (Zosia: dorosły głos brzmi młodziej), a kwestia trwa wtedy krócej.
// Napisy w dymku są zawsze. Głos można wyciszyć; wybór zapamiętuje localStorage.
// Przeglądarka odtwarza dźwięk dopiero po pierwszym kliknięciu na stronie, a prolog zaczyna mówić właśnie po kliknięciu.
// Gdy nagrania brak albo głos jest wyciszony, play() zwraca null i postać mówi tylko napisem, jak dawniej.

const DIR = 'assets/postacie/glosy/';
const KEY = 'mobywatel-dla-bliskich:glos';

function readOn() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

class Voice {
  constructor() {
    this.on = readOn();
    this.list = {};
    this.audio = {};
    this.playing = null;
    this.ready = fetch(`${DIR}glosy.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((list) => {
        this.list = list;
        // Kwestie są krótkie (razem ok. 1,5 MB), więc wczytujemy je od razu, żeby głos ruszał bez opóźnienia
        for (const [text, entry] of Object.entries(list)) {
          const a = new Audio(DIR + entry.plik);
          a.preload = 'auto';
          a.preservesPitch = false;
          this.audio[text] = a;
        }
      })
      .catch(() => {});
  }

  has(text) {
    return Boolean(this.list[text]);
  }

  // Zwraca { duration, stop } albo null (wyciszone lub brak nagrania)
  play(text) {
    this.stop();
    const entry = this.list[text];
    const a = this.audio[text];
    if (!this.on || !entry || !a) return null;
    const rate = entry.tempo ?? 1;
    a.playbackRate = rate;
    a.currentTime = 0;
    a.play().catch(() => {});
    this.playing = a;
    return { duration: entry.ms / rate, stop: () => this.stop(a) };
  }

  stop(a = this.playing) {
    if (!a) return;
    a.pause();
    if (this.playing === a) this.playing = null;
  }

  toggle() {
    this.on = !this.on;
    if (!this.on) this.stop();
    try {
      localStorage.setItem(KEY, this.on ? 'on' : 'off');
    } catch {
      // tryb prywatny — wybór działa do zamknięcia strony
    }
    return this.on;
  }
}

export const voice = new Voice();
