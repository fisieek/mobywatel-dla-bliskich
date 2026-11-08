// Pokaz automatyczny: panel klika za oglądającego, krok po kroku, z podświetleniem dotykanego miejsca.
// Kroki to te same przyciski, których dotyka człowiek — pokaz nie ma osobnej logiki aplikacji.
// Pokaz można wstrzymać i wznowić; w czasie pauzy powiadomienia na telefonach nie znikają.
import { holdNotifications } from './store.js';

const K = 'krystyna';
const A = 'anna';
const Z = 'zosia';

// Tempo pokazu: przerwy zapisane przy krokach mnożymy przez TEMPO, żeby oglądający nadążał
const TEMPO = 1.6;
// Przerwa po kroku, żeby było widać, co się stało
const STEP_PAUSE_MS = 1400;
// Jak długo widać podświetlenie przed dotknięciem
const HIGHLIGHT_MS = 1300;
// Na początku każdej sceny: czas na przeczytanie, jaki to problem i kogo dotyczy (pasek u góry panelu)
const SCENE_INTRO_MS = 6000;
// Po wprowadzeniu bohaterki: chwila, żeby zobaczyć telefony przed pierwszym dotknięciem
const AFTER_INTRO_MS = 1500;
// Najdłużej czekamy na przycisk, np. gdy przychodzi powiadomienie
const WAIT_LIMIT_MS = 15000;

// Krok: [telefon albo null dla przewodnika, selektor, przerwa po kroku w ms].
// `scene` to numer scenariusza w panelu (od 0).
const scenes = [
  {
    name: 'Pomoc',
    scene: 0,
    steps: [
      [K, '[data-tab="more"]'],
      [K, '.row[data-go="simpleOffer"]', 1800],
      [K, '[data-action="enable"]', 2600],
      [K, '.row[data-go="helpers"]'],
      [K, 'button[data-go="helpersChoose"]'],
      [K, '.row[data-go="helpersScope"]'],
      [K, '[data-action="confirm"]', 2200],
      [A, '[data-notification-go="helpersInvite"]'],
      [A, '[data-action="accept"]', 2200],
      [A, '.btn[data-home]'],
      [K, '.btn[data-home]'],
      [K, '.row[data-go="letters"]'],
      [K, 'button[data-go="camera"]'],
      [K, '[data-action="shoot"]'],
      [K, '[data-action="requestHelp"]', 1800],
      [A, '[data-notification-go="mamaLetter"]'],
      [A, '[data-action="draft"]'],
      [A, '[data-action="sendToMama"]', 1800],
      [K, '[data-notification-go="replyReview"]', 2200],
      [K, '[data-go="signPin"]'],
      [K, '[data-action="key"][data-id="1"]', 300],
      [K, '[data-action="key"][data-id="9"]', 300],
      [K, '[data-action="key"][data-id="5"]', 300],
      [K, '[data-action="key"][data-id="5"]', 1800],
      [K, '.btn[data-home]'],
      [A, '[data-tab="documents"]', 2000],
    ],
  },
  {
    name: 'Ochrona',
    scene: 1,
    steps: [
      [null, '[data-guide-action="scamCall"]', 1800],
      [K, '[data-call="answer"]', 5000],
      [K, '[data-call="minimize"]'],
      [K, '.simple-status-tap'],
      [K, '[data-id="police"]', 2600],
      [K, '[data-action="hangup"]'],
      [K, '[data-notification-go="loginRequest"]', 1800],
      [K, '[data-action="reject"]', 2200],
      [K, '.btn[data-home]', 2200],
    ],
  },
  {
    name: 'Kontrola',
    scene: 2,
    steps: [
      [A, '[data-tab="qr"]'],
      [A, '.row[data-go="qrScan"]'],
      [A, '.btn[data-action="scan"]', 1800],
      [A, '[data-action="share"]', 2400],
      [A, '[data-go="myData"]'],
      [K, '.row[data-go="myData"]', 3000],
    ],
  },
  {
    name: 'Moje leki',
    scene: 3,
    steps: [
      [null, '[data-guide-action="medsLow"]', 1800],
      [K, '[data-notification-go="meds"]'],
      [K, '[data-action="refill"]'],
      [K, '[data-action="askAnnaMeds"]', 1800],
      [A, '[data-notification-go="mamaMeds"]', 1800],
      [A, '[data-action="orderRx"]', 4200],
      [K, '[data-notification-go="medsPharmacy"]', 3000],
      [K, '.btn[data-home]'],
      [A, '[data-tab="documents"]'],
    ],
  },
  {
    name: 'Odbiór dziecka ze szkoły',
    scene: 4,
    steps: [
      [A, '[data-tab="services"]'],
      [A, '.row[data-go="authorize"]', 1800],
      [A, '[data-action="authorizeConfirm"]', 2400],
      [K, '[data-notification-go="pickupPass"]', 2000],
      [K, '[data-action="teacherScan"]', 3200],
      [K, '.btn[data-home]'],
      [A, '[data-tab="documents"]', 1800],
    ],
  },
  {
    name: 'Ktoś do mnie pisze?',
    scene: 5,
    steps: [
      [null, '[data-guide-action="strangerChat"]', 5000],
      [Z, '[data-chat="minimize"]'],
      [Z, '[data-tab="services"]'],
      [Z, '.row[data-go="whoIsWriting"]'],
      [Z, '[data-action="situation"][data-id="threat"]', 3200],
      [Z, '[data-action="tellMom"]', 2400],
      [A, '[data-notification-go="call-zosia"]', 2600],
      [A, '.btn[data-home]'],
    ],
  },
  {
    name: 'Zgoda dla szkoły',
    scene: 6,
    steps: [
      [Z, '[data-tab="services"]'],
      [Z, '.row[data-go="schoolConsentScan"]'],
      [Z, '.btn[data-action="scanSchool"]', 1600],
      [Z, '[data-action="askConsent"]', 1800],
      [A, '[data-notification-go="schoolConsentReview"]', 1800],
      [A, '[data-action="signConsent"]', 3000],
    ],
  },
];

// Krótki pokaz dla jury: trzy filary bez kroków, które nie są istotą sceny.
// Pomoc zaczyna od chwili, gdy Krystyna ma już tryb prosty i pozwoliła Annie pomagać (stan `quickStart`).
const highlightScenes = [
  {
    name: 'Pomoc',
    scene: 0,
    steps: [
      [K, '.row[data-go="letters"]'],
      [K, 'button[data-go="camera"]'],
      [K, '[data-action="shoot"]', 2200],
      [K, '[data-action="requestHelp"]', 1600],
      [A, '[data-notification-go="mamaLetter"]'],
      [A, '[data-action="draft"]', 1800],
      [A, '[data-action="sendToMama"]', 1600],
      [K, '[data-notification-go="replyReview"]', 2000],
      [K, '[data-go="signPin"]', 1000],
      [K, '[data-action="key"][data-id="1"]', 200],
      [K, '[data-action="key"][data-id="9"]', 200],
      [K, '[data-action="key"][data-id="5"]', 200],
      [K, '[data-action="key"][data-id="5"]', 2000],
    ],
  },
  {
    name: 'Ochrona',
    scene: 1,
    steps: [
      [null, '[data-guide-action="scamCall"]', 1500],
      [K, '[data-call="answer"]', 3800],
      [K, '[data-call="minimize"]', 1000],
      [K, '.simple-status-tap', 1200],
      [K, '[data-id="police"]', 2400],
      [K, '[data-action="hangup"]', 1200],
      [K, '[data-notification-go="loginRequest"]', 1600],
      [K, '[data-action="reject"]', 2400],
    ],
  },
  {
    name: 'Kontrola',
    scene: 2,
    steps: [
      [A, '[data-tab="qr"]', 1000],
      [A, '.row[data-go="qrScan"]', 1000],
      [A, '.btn[data-action="scan"]', 1600],
      [A, '[data-action="share"]', 2200],
      [K, '.row[data-go="myData"]', 3200],
    ],
  },
];

const stepsFor = (indices, list) => {
  const chosen = list.filter((scene) => indices.includes(scene.scene));
  return chosen.flatMap((scene, number) =>
    scene.steps.map((step, i) => ({ scene: scene.name, sceneIndex: scene.scene, sceneNumber: number + 1, sceneCount: chosen.length, step, first: i === 0 })),
  );
};

// Bieżący pokaz: null albo { index, total, scene, sceneIndex, sceneNumber, sceneCount, highlights, paused, failed }
let run = null;
let runId = 0;
const listeners = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isPaused = () => Boolean(run?.paused);

// Czekanie, które stoi w miejscu w czasie pauzy. Zwraca false, gdy pokaz zakończono.
async function wait(ms, id) {
  let left = ms;
  while (left > 0) {
    if (id !== runId) return false;
    const chunk = Math.min(100, left);
    await sleep(chunk);
    if (!isPaused()) left -= chunk;
  }
  return id === runId;
}

function emit() {
  listeners.forEach((fn) => fn(run));
}

export const autoplayState = () => run;

export function onAutoplayChange(fn) {
  listeners.add(fn);
}

const fullSelector = (persona, selector) => (persona ? `[data-persona="${persona}"] ${selector}` : selector);

// Czeka na przycisk; w czasie pauzy limit czekania się nie wyczerpuje
async function waitFor(selector, id) {
  let left = WAIT_LIMIT_MS;
  while (left > 0) {
    if (id !== runId) return null;
    const el = document.querySelector(selector);
    if (el && !el.disabled && !isPaused()) return el;
    await sleep(200);
    if (!isPaused()) left -= 200;
  }
  return null;
}

// Przewija treść aplikacji (nie całą stronę), żeby dotykany przycisk był na środku ekranu telefonu
function bringIntoView(el) {
  const content = el.closest('.app-content');
  if (!content) return;
  const box = el.getBoundingClientRect();
  const frame = content.getBoundingClientRect();
  content.scrollTop += box.top - frame.top - frame.height / 2 + box.height / 2;
}

export function stopAutoplay() {
  if (!run) return;
  runId += 1;
  run = null;
  holdNotifications(false);
  document.querySelectorAll('.demo-tap').forEach((el) => el.classList.remove('demo-tap'));
  emit();
}

export function pauseAutoplay() {
  if (!run || run.failed || run.paused) return;
  run = { ...run, paused: true };
  holdNotifications(true);
  emit();
}

export function resumeAutoplay() {
  if (!run || !run.paused) return;
  run = { ...run, paused: false };
  holdNotifications(false);
  emit();
}

// indices — które scenariusze pokazać; highlights — krótka wersja dla jury;
// prepare(i, { quick }) ustawia stan startowy scenariusza; showPersona — pokazuje telefon, którego dotyczy krok
// introduce(i) — opcjonalne wprowadzenie bohaterki przed sceną (Promise); bez niego pasek z problemem przez SCENE_INTRO_MS
export async function startAutoplay({ indices, highlights = false, prepare, showPersona, introduce = null }) {
  stopAutoplay();
  const id = ++runId;
  const allSteps = stepsFor(indices, highlights ? highlightScenes : scenes);
  const first = allSteps[0];
  run = { index: 0, total: allSteps.length, scene: first.scene, sceneIndex: first.sceneIndex, sceneNumber: 1, sceneCount: first.sceneCount, highlights, paused: false, failed: false };
  emit();

  for (let i = 0; i < allSteps.length; i++) {
    if (id !== runId) return;
    const { scene, sceneIndex, sceneNumber, step, first: firstOfScene } = allSteps[i];
    const [persona, selector, pause = STEP_PAUSE_MS] = step;
    run = { ...run, index: i + 1, scene, sceneIndex, sceneNumber, intro: firstOfScene };
    if (firstOfScene) {
      prepare(sceneIndex, { quick: highlights });
      emit();
      // Najpierw bohaterka mówi, o co chodzi (albo chwila na przeczytanie problemu w pasku pokazu), dopiero potem pierwsze dotknięcie
      if (introduce) {
        await introduce(sceneIndex);
        if (id !== runId) return;
        if (!(await wait(AFTER_INTRO_MS, id))) return;
      } else if (!(await wait(SCENE_INTRO_MS, id))) return;
      run = { ...run, intro: false };
    }
    emit();
    if (persona) showPersona(persona);

    const full = fullSelector(persona, selector);
    const el = await waitFor(full, id);
    if (id !== runId) return;
    if (!el) {
      // Coś poszło inaczej niż w scenariuszu — przerywamy i oddajemy stery
      holdNotifications(false);
      run = { ...run, failed: true, paused: false };
      emit();
      return;
    }
    bringIntoView(el);
    el.classList.add('demo-tap');
    if (!(await wait(HIGHLIGHT_MS, id))) return;
    // Ekran mógł się w międzyczasie przerysować — dotykamy aktualnego przycisku
    const target = el.isConnected ? el : document.querySelector(full);
    target?.click();
    if (!(await wait(pause * TEMPO, id))) return;
  }
  if (id !== runId) return;
  run = null;
  emit();
}
