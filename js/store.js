// Wspólny stan obu telefonów. Oba telefony działają na jednej stronie,
// więc to, co zrobi Anna, od razu widzi Krystyna (i odwrotnie).
import { defaultNicknames } from './personas.js';

const STORAGE_KEY = 'mobywatel-dla-bliskich:v7';

function initialState() {
  return {
    // Pozwolenie Krystyny dla Anny (scena 1a): 'none' | 'pending' | 'active'
    guardian: 'none',
    // Zakres pozwolenia — przełączniki na ekranie zakresu
    guardianScope: { letters: true, replies: true, alerts: true, send: false, health: false },
    // Papierowe pismo Krystyny (scena 1b–1c):
    // 'none' → 'reading' → 'explained' → 'requested' → 'opened' → 'drafting' → 'drafted' → 'awaiting' → 'signed'
    letter: 'none',
    // Tekst pisma (odczytany ze zdjęcia albo przykładowy) i wyjaśnienie asystenta
    letterText: '',
    explanation: null,
    // Co mama chce wyjaśnić w odpowiedzi — Anna wpisuje to przed szkicem
    replyFacts: 'Różnica to niskie poddasze, poniżej 1,40 m (ok. 22 m²).',
    // Treść odpowiedzi przygotowanej przez Annę
    reply: '',
    // Skąd odpowiedź asystenta: 'live' (PLLuM) | 'scripted' (tryb awaryjny)
    aiSource: { explain: null, draft: null },
    // Czy zamiast zdjęcia użytkownika pokazujemy przykładowe pismo (gdy asystent jest niedostępny)
    usedSample: true,
    // Cyfry wpisane w PIN podpisu
    pin: '',
    // Chwilowa nakładka na telefonie (np. Face ID): { krystyna: null, anna: null }
    overlay: { krystyna: null, anna: null },
    // Za kogo działa Anna: 'ja' | 'mama' | 'antek'
    actingAs: 'ja',
    // Czy Anna przełączyła się na mamę sama (przez przełącznik), czy zrobiła to aplikacja przy otwarciu pisma.
    // W tym drugim wypadku po wyjściu z pisma wraca do siebie.
    autoActing: false,
    // Nazwy nadane bliskim na ekranie „Moi bliscy” (bez odmiany, np. „Mama”)
    nicknames: structuredClone(defaultNicknames),
    // Nazwa wpisywana, ale jeszcze niezapisana: { 'krystyna:anna': 'Ania' }
    nicknameDrafts: {},
    // Tryb prosty (nowa opcja w Więcej): Krystyna ma go włączonego
    simpleMode: { krystyna: true, anna: false },
    // Stos ekranów osobno dla każdego telefonu; pierwszy element to aktywna zakładka
    nav: { krystyna: ['documents'], anna: ['documents'] },
    // Powiadomienia wyświetlane teraz na danym telefonie (na ekranie najwyżej jedno, najnowsze)
    notifications: { krystyna: [], anna: [] },
    // Wszystkie powiadomienia z sesji — zostają w Powiadomieniach (dzwonek), gdy znikną z ekranu
    notificationLog: { krystyna: [], anna: [] },
    // Połączenie telefoniczne na telefonie Krystyny (scena 2):
    // null | { caller: 'scam' | 'zus', status: 'ringing' | 'talking', minimized, since }
    call: null,
    // Scena 2: czy Krystyna sprawdziła telefon, co z prośbą o logowanie, której nie zaczęła
    // push: 'none' → 'queued' → 'pending' → 'blocked'; blockedAt — kiedy Krystyna odrzuciła prośbę
    protection: { checked: false, push: 'none', blockedAt: null },
    // Wynik ostatniego sprawdzenia „Ktoś do mnie dzwoni?”: { institution, verified }
    callCheck: null,
    // Wersja pozytywna sceny 2: dzwoni naprawdę Zakład Ubezpieczeń Społecznych: 'none' | 'verified'
    realCall: 'none',
    // Scena 3: prośba o dane po zeskanowaniu kodu QR (Anna — wypożyczalnia, Krystyna — hotel):
    // 'none' → 'scanned' → 'shared'
    consent: { krystyna: 'none', anna: 'none' },
    // Poziom danych na ekranie zgody: 'confirm' | 'basic' | 'full'
    consentLevel: { krystyna: 'basic', anna: 'basic' },
    // Czy Krystyna obejrzała historię po udostępnieniu danych przez Annę (koniec sceny 3)
    historySeen: false,
    // Historia „jak w banku” (scena 3), wspólna dla obu osób.
    // Wpis: { id, at, persona, actor: 'self' | 'anna' | 'blocked' | 'institution' | 'shared', who, text, consent, revoked }
    history: [],
  };
}

function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (saved) return { ...initialState(), ...saved };
  } catch {
    // brak dostępu do pamięci przeglądarki — zaczynamy od zera
  }
  return initialState();
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // tryb prywatny lub zablokowana pamięć — prototyp działa dalej bez zapisu
  }
}

function emit() {
  persist();
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,

  update(fn) {
    state = fn(structuredClone(state));
    emit();
  },

  // Zmiana bez przerysowania ekranu (np. pisanie w polu tekstowym)
  quietly(fn) {
    fn(state);
    persist();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  reset() {
    state = initialState();
    emit();
  },
};

// Nawigacja

// Anna wraca do siebie, gdy wychodzi z pisma mamy, które aplikacja otworzyła jej „jako mama”
function leaveAutoActing(s, persona) {
  const top = s.nav[persona][s.nav[persona].length - 1];
  if (persona !== 'anna' || !s.autoActing || top === 'mamaLetter') return false;
  s.autoActing = false;
  s.actingAs = 'ja';
  return true;
}

function navigate(persona, change) {
  let returned = false;
  store.update((s) => {
    change(s);
    returned = leaveAutoActing(s, persona);
    return s;
  });
  if (returned) notify('anna', { title: 'Wróciłaś do swojego konta', body: 'Działasz teraz jako Ty.' });
}

export function go(persona, screen) {
  navigate(persona, (s) => {
    s.nav[persona].push(screen);
  });
}

// Zamienia bieżący ekran na inny (bez możliwości powrotu do poprzedniego kroku)
export function replace(persona, screen) {
  navigate(persona, (s) => {
    s.nav[persona].pop();
    s.nav[persona].push(screen);
  });
}

export function back(persona) {
  navigate(persona, (s) => {
    if (s.nav[persona].length > 1) s.nav[persona].pop();
  });
}

export function home(persona) {
  navigate(persona, (s) => {
    s.nav[persona] = [s.nav[persona][0]];
  });
}

export function openTab(persona, tab) {
  navigate(persona, (s) => {
    s.nav[persona] = [tab];
  });
}

export function currentScreen(persona) {
  const stack = state.nav[persona];
  return stack[stack.length - 1];
}

// Powiadomienia między telefonami

let nextId = 1;

const AUTO_HIDE_MS = 7000;
// Powiadomienie z przyciskiem zostaje dłużej, potem przechodzi do Powiadomień (dzwonek z kropką)
const AUTO_HIDE_ACTION_MS = 10000;

export function notify(persona, { title, body, tone = 'info', action = null }) {
  const id = `${Date.now()}-${nextId++}`;
  store.update((s) => {
    s.notifications[persona].push({ id, title, body, tone, action });
    s.notificationLog[persona].unshift({ id, title, body, tone, action, at: new Date().toISOString(), unread: true });
    return s;
  });
  setTimeout(() => dismissNotification(persona, id), action ? AUTO_HIDE_ACTION_MS : AUTO_HIDE_MS);
}

export function markNotificationsRead(persona) {
  if (!state.notificationLog[persona].some((n) => n.unread)) return;
  store.update((s) => {
    s.notificationLog[persona].forEach((n) => {
      n.unread = false;
    });
    return s;
  });
}

export function dismissNotification(persona, id) {
  store.update((s) => {
    s.notifications[persona] = s.notifications[persona].filter((n) => n.id !== id);
    return s;
  });
}

// Historia

export function addHistory(entry) {
  store.update((s) => {
    s.history.unshift({ id: `h-${Date.now()}-${nextId++}`, at: new Date().toISOString(), actor: 'self', ...entry });
    return s;
  });
}

// Skrót: zmiana kilku pól stanu naraz
export function patch(fields) {
  store.update((s) => Object.assign(s, fields));
}

// Nakładka biometrii: pokazuje się na chwilę, potem wykonuje dalszy krok
export function withBiometric(persona, then) {
  store.update((s) => {
    s.overlay[persona] = 'faceid';
    return s;
  });
  setTimeout(() => {
    store.update((s) => {
      s.overlay[persona] = 'faceid-ok';
      return s;
    });
  }, 900);
  setTimeout(() => {
    store.update((s) => {
      s.overlay[persona] = null;
      return s;
    });
    then();
  }, 1500);
}
