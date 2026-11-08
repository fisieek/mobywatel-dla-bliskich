// Prolog przed telefonami: ekran startowy z trzema bohaterkami, ich przedstawienie się
// i wprowadzenie przed każdym scenariuszem. Postacie są w 3D (js/postacie/scena.js).
//
// Zasady:
// - wprowadzenie do scenariusza trzeba obejrzeć do końca za pierwszym razem; potem można je pominąć,
// - mówi bohaterka scenariusza, osoby, które w nim też występują, kiwają głową, pozostałe patrzą na mówiącą,
// - w pokazie automatycznym wprowadzenie ma jedno zdanie i samo przechodzi dalej,
// - adres z ?prolog=0 wyłącza prolog (np. nagrywanie filmu narzędziem narzedzia/nagraj-film.mjs).
import { people, personById, intros, episodesOf } from './historie.js';
import { readingTime } from './mowa.js';

const SEEN_KEY = 'mobywatel-dla-bliskich:prolog-v1';
const NARROW = '(max-width: 860px)';
const ACCUSATIVE = { krystyna: 'Krystynę', anna: 'Annę', zosia: 'Zosię' };
const GENITIVE = { krystyna: 'Krystyny', anna: 'Anny', zosia: 'Zosi' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY));
    return { people: raw?.people ?? [], episodes: raw?.episodes ?? [] };
  } catch {
    return { people: [], episodes: [] };
  }
}

function writeSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // tryb prywatny albo zablokowane dane strony — wprowadzenia po prostu nie zapamiętają się
  }
}

export const prologEnabled = new URLSearchParams(location.search).get('prolog') !== '0';

// Zastępstwo postaci, gdy przeglądarka nie obsługuje 3D: dymki z napisami bez animacji
class TextOnlyCharacter {
  constructor(person) {
    Object.assign(this, { id: person.id, x: person.x });
  }
  wave() {
    return sleep(400);
  }
  say(text) {
    this.cancel?.();
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), readingTime(text));
      this.cancel = () => {
        clearTimeout(timer);
        resolve(false);
      };
    });
  }
  stopSpeaking() {
    this.cancel?.();
  }
  listen() {}
  idle() {}
  lookAt() {}
}

class Prolog {
  constructor({ episodes, openEpisode, currentEpisode, nextEpisode, openSummary }) {
    this.episodes = episodes;
    this.openEpisode = openEpisode;
    this.currentEpisode = currentEpisode;
    this.nextEpisode = nextEpisode;
    this.openSummary = openSummary;
    this.seen = readSeen();
    this.token = 0;
    this.mode = 'hidden';
    this.characters = {};
    this.pending = null;
    this.build();
    this.ready = this.loadScene();
  }

  build() {
    const el = document.createElement('section');
    el.className = 'prolog';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'prolog-title');
    el.innerHTML = `
      <div class="prolog-canvas" data-prolog-canvas></div>
      <header class="prolog-head">
        <p class="prolog-eyebrow">Prototyp koncepcyjny · mObywatel Challenge 2026</p>
        <h1 class="prolog-title" id="prolog-title">mObywatel dla bliskich</h1>
        <p class="prolog-lead">Trzy osoby z jednej rodziny. Każda opowie o swoim kłopocie ze sprawami urzędowymi, a potem na telefonach zobaczysz, jak rozwiązuje go mObywatel.</p>
      </header>
      <p class="prolog-chip" data-prolog-chip></p>
      <button class="prolog-close" data-prolog-action="start">✕ Wróć do bohaterek</button>
      <div class="prolog-bubble" data-prolog-bubble aria-live="polite"><strong data-prolog-speaker></strong><span data-prolog-line></span></div>
      <ul class="prolog-cards" data-prolog-cards>
        ${people
          .map(
            (p) => `
          <li class="prolog-card" data-prolog-card="${p.id}">
            <p class="prolog-card-name">${p.name}, ${p.age}</p>
            <p class="prolog-card-role">${p.role}</p>
            <p class="prolog-card-problem">${p.problem}</p>
            <button class="btn btn-primary btn-small" data-prolog-meet="${p.id}">Poznaj ${ACCUSATIVE[p.id]}</button>
          </li>`,
          )
          .join('')}
      </ul>
      <div class="prolog-actions" data-prolog-actions></div>
      <p class="prolog-loading" data-prolog-loading role="status">Wczytuję bohaterki…</p>`;
    document.body.appendChild(el);
    this.el = el;
    this.bubble = el.querySelector('[data-prolog-bubble]');
    this.actions = el.querySelector('[data-prolog-actions]');
    this.chip = el.querySelector('[data-prolog-chip]');
    this.loading = el.querySelector('[data-prolog-loading]');
    el.addEventListener('click', (e) => this.onClick(e));
  }

  async loadScene() {
    const canvas = this.el.querySelector('[data-prolog-canvas]');
    try {
      const { Stage, Character } = await import('./scena.js');
      this.stage = new Stage(canvas);
      const progress = {};
      const report = () => {
        const values = Object.values(progress);
        const percent = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / people.length) * 100) : 0;
        this.loading.textContent = `Wczytuję bohaterki… ${percent}%`;
      };
      await Promise.all(
        people.map(async (p) => {
          const c = new Character({ id: p.id, folder: p.folder, materials: p.materials, x: p.x });
          await c.load((e) => {
            if (e.total) progress[p.id] = e.loaded / e.total;
            report();
          });
          this.stage.add(c);
          this.characters[p.id] = c;
        }),
      );
      this.stage.onFrame = () => this.place();
      this.stage.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
      this.stage.renderer.domElement.addEventListener('pointermove', (e) => this.onCanvasHover(e));
      this.frame();
    } catch (error) {
      console.warn('Prolog bez 3D:', error);
      this.stage?.dispose();
      this.stage = null;
      this.el.classList.add('prolog-text-only');
      for (const p of people) this.characters[p.id] = new TextOnlyCharacter(p);
    }
    this.loading.remove();
    this.el.classList.add('prolog-ready');
  }

  // --- tryby -------------------------------------------------------------------------------------

  begin(mode) {
    this.token += 1;
    this.mode = mode;
    this.skipping = false;
    if (this.pending) {
      this.pending(false);
      this.pending = null;
    }
    for (const c of Object.values(this.characters)) c.stopSpeaking();
    this.el.dataset.mode = mode;
    delete this.el.dataset.auto;
    this.setBubble(null);
    this.show();
    return this.token;
  }

  show() {
    if (!this.el.hidden) return;
    this.el.hidden = false;
    document.body.classList.add('prolog-open');
    this.stage?.renderer.setAnimationLoop(() => this.stage.tick());
  }

  hide() {
    this.token += 1;
    this.mode = 'hidden';
    for (const c of Object.values(this.characters)) c.stopSpeaking();
    this.el.hidden = true;
    document.body.classList.remove('prolog-open');
    this.stage?.renderer.setAnimationLoop(null);
  }

  // Ekran startowy: trzy bohaterki stoją przodem, pod każdą jej problem
  async showStart() {
    const token = this.begin('start');
    this.chip.textContent = '';
    this.renderStartActions();
    await this.ready;
    if (token !== this.token) return;
    for (const c of Object.values(this.characters)) {
      c.lookAt(null);
      c.idle();
    }
    this.stage?.highlight(null);
    this.focusId = null;
    this.frame();
    this.actions.querySelector('.btn-primary')?.focus({ preventScroll: true });
  }

  // Główna akcja: następny nieobejrzany scenariusz po kolei. Rozpoczęty, a niedokończony — „Kontynuuj”.
  // Gdy wszystkie obejrzane — podsumowanie. Lista scenariuszy i pokaz automatyczny zawsze pod spodem.
  renderStartActions() {
    const open = this.currentEpisode();
    const next = this.nextEpisode();
    const label = (i) => `Scenariusz ${i + 1} „${this.episodes[i].name}”`;
    let main;
    if (next === null) main = '<p class="prolog-done">Wszystkie scenariusze obejrzane ✓</p><button class="btn btn-primary" data-prolog-action="summary">Podsumowanie: dziś i po zmianie</button>';
    else if (open === next) main = `<button class="btn btn-primary" data-prolog-action="back-to-phones">Kontynuuj: ${label(next)}</button>`;
    else main = `<button class="btn btn-primary" data-prolog-action="episode" data-index="${next}">Rozpocznij: ${label(next)}</button>`;
    const resume = open !== null && open !== next ? `<button class="btn btn-secondary btn-small" data-prolog-action="back-to-phones">Wróć do: ${label(open)}</button>` : '';
    this.actions.innerHTML = `
      ${main}
      <button class="btn btn-secondary btn-small" data-prolog-action="list">Lista scenariuszy</button>
      ${resume}
      <button class="btn btn-secondary btn-small" data-autoplay="highlights">▶ Pokaz automatyczny (ok. 2,5 min)</button>`;
  }

  // Bohaterka macha i przedstawia się, a potem pokazuje swoje scenariusze
  async meet(id) {
    const token = this.begin('person');
    const person = personById(id);
    this.chip.textContent = `${person.name}, ${person.age}`;
    // Przedstawienie się można zawsze pominąć (obowiązkowe są tylko wprowadzenia do scenariuszy)
    this.actions.innerHTML = '<button class="btn btn-secondary btn-small" data-prolog-action="skip">Pomiń przedstawienie</button>';
    await this.ready;
    if (token !== this.token) return;
    const speaker = this.characters[id];
    this.cast(id, []);
    await speaker.wave();
    if (token !== this.token) return;
    await this.speak(token, id, person.hello);
    if (token !== this.token) return;
    this.markSeen('people', id);
    this.setBubble(null);
    speaker.idle();
    this.actions.innerHTML = `
      <p class="prolog-actions-title">O czym opowie ${person.name}</p>
      <div class="prolog-episodes">
        ${episodesOf(id)
          .map(
            (i) => `
          <button class="prolog-episode" data-prolog-action="episode" data-index="${i}">
            <span class="prolog-episode-name">${i + 1}. ${this.episodes[i].name}</span>
            <span class="prolog-episode-tagline">${this.episodes[i].tagline}</span>
          </button>`,
          )
          .join('')}
      </div>`;
    this.actions.querySelector('.prolog-episode')?.focus({ preventScroll: true });
  }

  // Wprowadzenie do scenariusza. Zwraca true, gdy można pokazać telefony, false — gdy ktoś wrócił do bohaterek.
  // short — jedno zdanie (pokaz automatyczny); auto — bez przycisków na końcu, samo przechodzi dalej
  async introduce(index, { short = false, auto = false } = {}) {
    const token = this.begin('episode');
    const intro = intros[index];
    const person = personById(intro.speaker);
    const seen = this.seen.episodes.includes(index);
    this.chip.textContent = `Scenariusz ${index + 1} · ${this.episodes[index].name}`;
    // W pokazie automatycznym zamiast „Wróć do bohaterek” jest „Zakończ pokaz”
    if (auto) this.el.dataset.auto = '';
    this.actions.innerHTML = auto
      ? '<button class="btn btn-secondary btn-small" data-autoplay="stop">Zakończ pokaz</button>'
      : seen
        ? '<button class="btn btn-secondary btn-small" data-prolog-action="skip">Pomiń wprowadzenie</button>'
        : '';
    await this.ready;
    if (token !== this.token) return false;

    this.cast(intro.speaker, intro.listeners);
    // Kto jeszcze nie przedstawił się w tej przeglądarce, najpierw macha i mówi, kim jest
    const lines = short ? [intro.short] : this.seen.people.includes(intro.speaker) ? intro.lines : [person.hello[0], ...intro.lines];
    if (!short && !this.seen.people.includes(intro.speaker)) {
      await this.characters[intro.speaker].wave();
      if (token !== this.token) return false;
    }
    await this.speak(token, intro.speaker, lines);
    if (token !== this.token) return false;
    this.markSeen('episodes', index);
    if (!short) this.markSeen('people', intro.speaker);

    if (auto || this.skipping) {
      this.hide();
      return true;
    }
    this.setBubble(null);
    this.characters[intro.speaker].idle();
    this.actions.innerHTML = `
      <button class="btn btn-primary" data-prolog-action="go">Przejdź do telefonów ▶</button>
      <button class="btn btn-secondary btn-small" data-prolog-action="again">Posłuchaj jeszcze raz</button>`;
    this.actions.querySelector('[data-prolog-action="go"]')?.focus({ preventScroll: true });
    const choice = await new Promise((resolve) => {
      this.pending = resolve;
    });
    this.pending = null;
    if (choice === 'go') {
      this.hide();
      return true;
    }
    if (choice === 'again') return this.introduce(index, { short, auto });
    return false;
  }

  introSeen(index) {
    return this.seen.episodes.includes(index);
  }

  // Wprowadzenie, a po nim scenariusz na telefonach
  async request(index) {
    if (await this.introduce(index)) this.openEpisode(index);
  }

  // --- wspólne -----------------------------------------------------------------------------------

  // Kto mówi, kto kiwa głową, kto tylko patrzy
  cast(speakerId, listeners) {
    const speaker = this.characters[speakerId];
    for (const c of Object.values(this.characters)) {
      if (c === speaker) {
        c.lookAt(null);
        continue;
      }
      c.lookAt(speaker.x);
      if (listeners.includes(c.id)) c.listen();
      else c.idle();
    }
    this.stage?.highlight(speaker);
    this.focusId = speakerId;
    this.frame();
  }

  async speak(token, id, lines) {
    const c = this.characters[id];
    for (const line of lines) {
      if (token !== this.token || this.skipping) return;
      this.setBubble(id, line);
      await c.say(line);
      if (token !== this.token || this.skipping) return;
      await sleep(320);
    }
  }

  skip() {
    this.skipping = true;
    for (const c of Object.values(this.characters)) c.stopSpeaking();
  }

  setBubble(id, line) {
    this.speakerId = id;
    this.bubble.classList.toggle('on', Boolean(id));
    if (!id) return;
    this.bubble.querySelector('[data-prolog-speaker]').textContent = personById(id).name;
    this.bubble.querySelector('[data-prolog-line]').textContent = line;
    this.place();
  }

  markSeen(kind, value) {
    if (this.seen[kind].includes(value)) return;
    this.seen[kind].push(value);
    writeSeen(this.seen);
  }

  // Kadr: na ekranie startowym cała trójka; gdy ktoś mówi, kamera przesuwa się na tę osobę i ją przybliża
  // (na środku ekranu, pozostałe stoją obok). Na komputerze nad głową zostaje miejsce na dymek.
  frame(focusId = this.focusId) {
    if (!this.stage) return;
    const narrow = window.matchMedia(NARROW).matches;
    const focus = this.mode !== 'start' && focusId ? this.characters[focusId] : null;
    if (narrow && focus) this.stage.frame({ centerX: focus.x, halfWidth: 55, bottom: focus.height * 0.3, top: focus.height + 22 });
    else if (narrow) this.stage.frame({ centerX: 0, halfWidth: 185, bottom: -10, top: 200 });
    else if (focus) this.stage.frame({ centerX: focus.x, halfWidth: 80, bottom: focus.height * 0.18, top: focus.height + 78 });
    else this.stage.frame({ centerX: 0, halfWidth: 200, bottom: -125, top: 245 });
  }

  // Dymek nad głową mówiącej i podpisy pod stopami (na komputerze); na wąskim ekranie układ jest w CSS
  place() {
    if (!this.stage || window.matchMedia(NARROW).matches) return;
    const { camera, width, height } = this.stage;
    if (this.mode === 'start') {
      for (const p of people) {
        const card = this.el.querySelector(`[data-prolog-card="${p.id}"]`);
        const pt = this.characters[p.id].screenPoint(camera, width, height, 'feet');
        card.style.left = `${pt.x}px`;
        card.style.top = `${pt.y + 10}px`;
      }
    }
    if (this.speakerId) {
      const pt = this.characters[this.speakerId].screenPoint(camera, width, height, 'head');
      const w = this.bubble.offsetWidth;
      const h = this.bubble.offsetHeight;
      const left = Math.min(Math.max(pt.x, w / 2 + 16), width - w / 2 - 16);
      this.bubble.style.left = `${left}px`;
      this.bubble.style.top = `${Math.max(pt.y, h + 76)}px`;
      this.bubble.style.setProperty('--tail', `${pt.x - left}px`);
    }
  }

  onCanvasClick(e) {
    if (this.mode !== 'start') return;
    const c = this.stage.pick(e);
    if (c) this.meet(c.id);
  }

  onCanvasHover(e) {
    const c = this.mode === 'start' ? this.stage.pick(e) : null;
    this.stage.renderer.domElement.style.cursor = c ? 'pointer' : '';
    this.el.querySelectorAll('[data-prolog-card]').forEach((card) => card.classList.toggle('prolog-card-hover', card.dataset.prologCard === c?.id));
  }

  onClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.prologMeet) return this.meet(btn.dataset.prologMeet);
    // „Zakończ pokaz” obsługuje strona z telefonami; tu tylko zamykamy prolog
    if (btn.dataset.autoplay === 'stop') return this.hide();
    const action = btn.dataset.prologAction;
    if (!action) return;
    if (action === 'skip') return this.skip();
    if (action === 'start') return this.showStart();
    if (action === 'list') return this.hide();
    if (action === 'back-to-phones') return this.hide();
    if (action === 'summary') {
      this.hide();
      return this.openSummary?.();
    }
    if (action === 'episode') return this.request(Number(btn.dataset.index));
    if (this.pending && (action === 'go' || action === 'again')) this.pending(action);
  }
}

let instance = null;

// openEpisode(i) — otwiera scenariusz na telefonach; currentEpisode() — numer otwartego scenariusza albo null
export function initProlog(options) {
  if (!prologEnabled) return null;
  instance = new Prolog(options);
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-prolog-open]')) instance.showStart();
  });
  window.addEventListener('resize', () => instance.frame());
  // Esc: wyjście z przedstawienia albo wprowadzenia do ekranu z bohaterkami
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !instance.el.hidden && instance.mode !== 'start' && !('auto' in instance.el.dataset)) instance.showStart();
  });
  instance.showStart();
  return instance;
}

export const prolog = () => instance;
