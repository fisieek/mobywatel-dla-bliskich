// „Pokaż sam”: przewodnik klika za jury, krok po kroku, z podświetleniem dotykanego miejsca.
// Kroki to te same przyciski, których dotyka człowiek — pokaz nie ma osobnej logiki aplikacji.

const K = 'krystyna';
const A = 'anna';
const Z = 'zosia';

// Przerwa po kroku, żeby było widać, co się stało
const STEP_PAUSE_MS = 1400;
// Jak długo widać podświetlenie przed dotknięciem
const HIGHLIGHT_MS = 900;
// Najdłużej czekamy na przycisk, np. gdy asystent myśli (do 8 s) albo przychodzi powiadomienie
const WAIT_LIMIT_MS = 15000;

// Krok: [telefon albo null dla przewodnika, selektor, przerwa po kroku w ms].
// `scene` to numer sceny w przewodniku (od 0), żeby przewodnik podświetlał to, co właśnie widać.
const scenes = [
  {
    name: 'Tryb prosty',
    scene: 0,
    group: 'core',
    steps: [
      [K, '[data-tab="more"]'],
      [K, '.row[data-go="simpleOffer"]', 1800],
      [K, '[data-action="enable"]', 2600],
    ],
  },
  {
    name: 'Pomoc',
    scene: 1,
    group: 'core',
    steps: [
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
    scene: 2,
    group: 'core',
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
    scene: 3,
    group: 'core',
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
    scene: 4,
    group: 'family',
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
    name: 'Upoważnienie',
    scene: 5,
    group: 'family',
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
    scene: 6,
    group: 'family',
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
    scene: 7,
    group: 'family',
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

const stepsFor = (group) =>
  scenes
    .filter((scene) => group === 'all' || scene.group === group)
    .flatMap((scene) => scene.steps.map((step) => ({ scene: scene.name, sceneIndex: scene.scene, step })));

// Bieżący pokaz: null albo { index, total, scene, sceneIndex, failed }
let run = null;
let runId = 0;
const listeners = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emit() {
  listeners.forEach((fn) => fn(run));
}

export const autoplayState = () => run;

export function onAutoplayChange(fn) {
  listeners.add(fn);
}

const fullSelector = (persona, selector) => (persona ? `[data-persona="${persona}"] ${selector}` : selector);

async function waitFor(selector, id) {
  const until = Date.now() + WAIT_LIMIT_MS;
  while (Date.now() < until) {
    if (id !== runId) return null;
    const el = document.querySelector(selector);
    if (el && !el.disabled) return el;
    await sleep(200);
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
  document.querySelectorAll('.demo-tap').forEach((el) => el.classList.remove('demo-tap'));
  emit();
}

// group — 'core' (tryb prosty i trzy filary), 'family' (cała rodzina) albo 'all'.
// reset — zaczyna demo od nowa; prepare — ustawia stan początkowy części; showPersona — pokazuje telefon, którego dotyczy krok
export async function startAutoplay({ group = 'core', reset, prepare, showPersona }) {
  stopAutoplay();
  const id = ++runId;
  const allSteps = stepsFor(group);
  run = { index: 0, total: allSteps.length, scene: allSteps[0].scene, sceneIndex: allSteps[0].sceneIndex, failed: false };
  emit();
  reset();
  prepare?.();
  await sleep(800);

  for (let i = 0; i < allSteps.length; i++) {
    if (id !== runId) return;
    const { scene, sceneIndex, step } = allSteps[i];
    const [persona, selector, pause = STEP_PAUSE_MS] = step;
    run = { ...run, index: i + 1, scene, sceneIndex };
    emit();
    if (persona) showPersona(persona);

    const full = fullSelector(persona, selector);
    const el = await waitFor(full, id);
    if (id !== runId) return;
    if (!el) {
      // Coś poszło inaczej niż w scenariuszu — przerywamy i oddajemy stery
      run = { ...run, failed: true };
      emit();
      return;
    }
    bringIntoView(el);
    el.classList.add('demo-tap');
    await sleep(HIGHLIGHT_MS);
    if (id !== runId) return;
    // Ekran mógł się w międzyczasie przerysować — dotykamy aktualnego przycisku
    const target = el.isConnected ? el : document.querySelector(full);
    target?.click();
    await sleep(pause);
  }
  if (id !== runId) return;
  run = null;
  emit();
}
