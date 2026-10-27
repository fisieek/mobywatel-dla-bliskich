// Scena 2 · OCHRONA — „Tylko Ty zaczynasz”.
// 2a: dzwoni „policjant”, Krystyna sprawdza w aplikacji, kto dzwoni, i słyszy: rozłącz się. Anna dostaje ostrzeżenie.
// 2b: oszust próbuje dalej — przychodzi prośba o logowanie, której Krystyna nie zaczęła. Można ją tylko odrzucić.
// Wersja pozytywna: dzwoni naprawdę Zakład Ubezpieczeń Społecznych — aplikacja pokazuje urzędniczkę i kod do porównania.
import { store, go, home, notify, patch, addHistory } from '../store.js';
import { icon } from '../icons.js';
import { speak, stopSpeaking } from '../speech.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';

// Po rozłączeniu oszust próbuje dalej: prośba o logowanie przychodzi po chwili
const PUSH_DELAY_MS = 2500;

const callers = {
  scam: {
    number: 'Nieznany numer',
    label: 'policja',
    lines: [
      'Dzień dobry, komisarz Adam Nowicki, Komenda Policji.',
      'Pani wnuczek spowodował wypadek. Żeby nie trafił do aresztu, potrzebna jest kaucja.',
      'Za chwilę dostanie Pani powiadomienie z mObywatela. Proszę je zatwierdzić — to potwierdzenie Pani tożsamości.',
    ],
  },
  zus: {
    number: '+48 58 000 00 00',
    label: 'Zakład Ubezpieczeń Społecznych',
    lines: [
      'Dzień dobry, Magdalena Wiśniewska, Zakład Ubezpieczeń Społecznych w Gdyni.',
      'Dzwonię w sprawie wniosku, który złożyła Pani w zeszłym tygodniu.',
      'Może Pani sprawdzić w mObywatelu, że to naprawdę ja.',
    ],
  },
};

// Instytucje, które użytkownik może wybrać. W prototypie „zgłoszone połączenie” ma tylko Zakład Ubezpieczeń Społecznych.
const institutions = [
  { id: 'police', title: 'Policja', from: 'z policji', iconName: 'shield' },
  { id: 'bank', title: 'Bank', from: 'z banku', iconName: 'building' },
  { id: 'office', title: 'Urząd', desc: 'np. gmina, urząd skarbowy', from: 'z urzędu', iconName: 'building' },
  { id: 'zus', title: 'Zakład Ubezpieczeń Społecznych', from: 'z Zakładu Ubezpieczeń Społecznych', iconName: 'building' },
  { id: 'other', title: 'Ktoś inny', from: '', iconName: 'call' },
];

const realCaller = { name: 'Magdalena Wiśniewska', unit: 'Oddział w Gdyni', matter: 'Twój wniosek z zeszłego tygodnia', code: '4719' };

const guardianAlerts = (state) => state.guardian === 'active' && state.guardianScope.alerts;

// ---------- Wywołanie połączeń z przewodnika ----------

export function startScamCall() {
  stopSpeaking();
  patch({ call: { caller: 'scam', status: 'ringing', minimized: false, since: Date.now() }, callCheck: null });
}

export function startRealCall() {
  stopSpeaking();
  patch({ call: { caller: 'zus', status: 'ringing', minimized: false, since: Date.now() }, callCheck: null });
}

function hangUp() {
  const state = store.get();
  const wasScam = state.call?.caller === 'scam';
  stopSpeaking();
  patch({ call: null });
  // Oszust się nie poddaje: po rozłączeniu przychodzi prośba o logowanie, której Krystyna nie zaczęła
  if (wasScam && state.protection.push === 'none') {
    store.update((s) => {
      s.protection.push = 'queued';
      return s;
    });
    setTimeout(sendLoginRequest, PUSH_DELAY_MS);
  }
}

function sendLoginRequest() {
  if (store.get().protection.push !== 'queued') return;
  store.update((s) => {
    s.protection.push = 'pending';
    return s;
  });
  notify('krystyna', {
    title: 'Prośba o zatwierdzenie logowania',
    body: 'Ktoś chce zalogować się na Twoje konto.',
    tone: 'danger',
    action: { label: 'Sprawdź', go: 'loginRequest' },
  });
}

// Przyciski na ekranie połączenia (data-call)
export function callAction(persona, kind) {
  const state = store.get();
  if (!state.call) return;
  if (kind === 'answer') {
    store.update((s) => {
      s.call.status = 'talking';
      s.call.since = Date.now();
      return s;
    });
    // Głos rozmówcy — syntezator mowy przeglądarki
    speak(callers[state.call.caller].lines.join(' '));
    return;
  }
  if (kind === 'minimize' || kind === 'expand') {
    store.update((s) => {
      s.call.minimized = kind === 'minimize';
      return s;
    });
    if (kind === 'minimize') home(persona);
    return;
  }
  if (kind === 'decline' || kind === 'hangup') hangUp();
}

// ---------- Ekran połączenia (jak w iOS) ----------

const LINE_DELAY_MS = 1400;

export function callOverlay(state, persona) {
  const call = state.call;
  if (persona !== 'krystyna' || !call || call.minimized) return '';
  const caller = callers[call.caller];
  // Ekran połączenia wjeżdża tylko wtedy, gdy telefon zaczyna dzwonić
  const isNew = Date.now() - call.since < 400 ? 'call-screen-new' : '';

  if (call.status === 'ringing') {
    return `
      <div class="call-screen ${isNew}" role="dialog" aria-label="Połączenie przychodzące">
        <div class="call-head">
          <p class="call-kind">Połączenie przychodzące</p>
          <p class="call-number">${caller.number}</p>
          <p class="call-sub">telefon komórkowy</p>
        </div>
        <div class="call-answer-row">
          <button class="call-round call-decline" data-call="decline" aria-label="Odrzuć">${icon('call', { size: 30 })}</button>
          <button class="call-round call-accept" data-call="answer" aria-label="Odbierz">${icon('call', { size: 30 })}</button>
        </div>
        <div class="call-answer-labels"><span>Odrzuć</span><span>Odbierz</span></div>
      </div>`;
  }

  // Napisy: kolejne zdania rozmówcy pojawiają się po kolei; ujemne opóźnienie = już widoczne po przerysowaniu
  const elapsed = Date.now() - call.since;
  const bubbles = caller.lines
    .map((line, i) => `<p class="call-line" style="animation-delay:${i * LINE_DELAY_MS - elapsed}ms">${line}</p>`)
    .join('');

  return `
    <div class="call-screen" role="dialog" aria-label="Rozmowa telefoniczna">
      <div class="call-head">
        <p class="call-number">${caller.number}</p>
        <p class="call-sub">rozmowa trwa</p>
      </div>
      <div class="call-transcript" aria-live="polite">
        <p class="call-transcript-label">Rozmówca mówi:</p>
        ${bubbles}
      </div>
      <div class="call-grid">
        <span class="call-tool">${icon('mic', { size: 26 })}<i>wycisz</i></span>
        <span class="call-tool">${icon('keypad', { size: 26 })}<i>klawiatura</i></span>
        <span class="call-tool">${icon('speaker', { size: 26 })}<i>głośnik</i></span>
      </div>
      <button class="call-to-app" data-call="minimize">
        <span class="banner-app" aria-hidden="true">m</span> Przejdź do mObywatela — rozmowa trwa dalej
      </button>
      <button class="call-round call-decline call-end" data-call="hangup" aria-label="Rozłącz">${icon('call', { size: 30 })}</button>
    </div>`;
}

// Zielona pigułka w miejscu godziny, gdy rozmowa trwa w tle
export function callPill(state, persona) {
  if (persona !== 'krystyna' || !state.call || !state.call.minimized) return '';
  return `<button class="call-pill" data-call="expand" aria-label="Wróć do rozmowy">${icon('call', { size: 13 })} Rozmowa</button>`;
}

// Zdanie na górze ekranu głównego w trybie prostym
export function protectionStatus(state) {
  if (state.protection.push === 'pending') return { text: 'Ktoś chce zalogować się na Twoje konto. Niczego nie zatwierdzaj.', tone: 'danger' };
  if (state.call?.status === 'talking') return { text: 'Rozmawiasz przez telefon. Nie wiesz, kto dzwoni? Dotknij „Ktoś do mnie dzwoni?”.', tone: 'attention' };
  return null;
}

// ---------- Ekrany ----------

function checkSpeech(check) {
  if (!check) return null;
  if (check.verified) {
    const code = realCaller.code.split('').join(' ');
    return `Tak, dzwoni do Ciebie naprawdę Zakład Ubezpieczeń Społecznych. Rozmawia z Tobą ${realCaller.name}. Poproś ją o kod. Powinna podać: ${code}. Jeśli poda inny, rozłącz się.`;
  }
  return 'Żadna instytucja nie dzwoni teraz do Ciebie. To prawie na pewno oszustwo. Rozłącz się. Nikomu nie przekazuj pieniędzy ani kodów.';
}

function scamResult(state, check) {
  const onCall = Boolean(state.call);
  const other = state.call?.caller === 'zus' && check.institution !== 'zus' ? infoBox('Teraz dzwoni do Ciebie tylko <strong>Zakład Ubezpieczeń Społecznych</strong>. Wybierz go, żeby sprawdzić rozmówcę.') : '';
  const annaInfo = guardianAlerts(state)
    ? infoBox('<strong>Anna już wie.</strong> Wysłaliśmy jej ostrzeżenie. Zaraz może do Ciebie zadzwonić.')
    : infoBox('Gdy pozwolisz bliskiej osobie pomagać, dostanie w takiej chwili ostrzeżenie.');
  return `
    <div class="alert-full alert-danger" role="alert">
      <span class="alert-icon">${icon('warning', { size: 40 })}</span>
      <h2>Żadna instytucja nie dzwoni teraz do Ciebie</h2>
      <p>To prawie na pewno <strong>oszustwo</strong>.</p>
      <p class="alert-do">Rozłącz się. Nikomu nie przekazuj pieniędzy ani kodów.</p>
    </div>
    ${other}
    ${onCall ? '<button class="btn btn-danger" data-action="hangup">Rozłącz się</button>' : ''}
    ${annaInfo}
    <p class="footnote">Policja, bank ani urząd nigdy nie proszą przez telefon o pieniądze, kaucję, numer karty ani kod z SMS-a.</p>
    ${onCall ? '' : '<button class="btn btn-primary" data-home>Gotowe</button>'}`;
}

function verifiedResult(state) {
  return `
    <div class="alert-full alert-ok" role="status">
      <span class="alert-icon">${icon('checkCircle', { size: 40 })}</span>
      <h2>Tak, dzwoni naprawdę Zakład Ubezpieczeń Społecznych</h2>
    </div>
    ${list([
      row({ iconName: 'people', tint: 'green', title: realCaller.name, desc: realCaller.unit, trailing: '' }),
      row({ iconName: 'letter', tint: 'blue', title: 'W sprawie', desc: realCaller.matter, trailing: '' }),
    ])}
    <div class="verify-code">
      <p class="ai-label">Kod do porównania</p>
      <p class="verify-digits">${realCaller.code.split('').map((d) => `<span>${d}</span>`).join('')}</p>
      <p>Poproś rozmówczynię, żeby go podała. Ma go na swoim ekranie. <strong>Jeśli poda inny — rozłącz się.</strong></p>
    </div>
    <p class="footnote">Nawet prawdziwy urząd nie poprosi Cię o pieniądze, PIN ani kod z SMS-a.</p>
    ${state.call ? '<button class="btn btn-secondary" data-action="hangup">Zakończ rozmowę</button>' : ''}
    <button class="btn btn-primary" data-home>Gotowe</button>`;
}

export const protectScreens = {
  whoIsCalling: {
    kind: 'inner',
    title: 'Ktoś do mnie dzwoni?',
    speech: () => 'Ktoś do Ciebie dzwoni? Nie rozłączaj się. Wybierz, kto się przedstawił: policja, bank, urząd, Zakład Ubezpieczeń Społecznych albo ktoś inny. Sprawdzę, czy to prawda.',
    render: () => `
      ${serviceHeader({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', desc: 'Sprawdź w sekundę, czy policja, bank albo urząd naprawdę się z Tobą kontaktuje. Nie musisz się rozłączać.', badge: newBadge() })}
      ${sectionTitle('Kto się przedstawił?')}
      ${list(institutions.map((i) => row({ iconName: i.iconName, tint: 'violet', title: i.title, desc: i.desc ?? '', action: 'check', id: i.id })))}`,
    actions: {
      check: (el, persona) => {
        const state = store.get();
        const institution = el.dataset.id;
        const verified = state.call?.caller === 'zus' && institution === 'zus';
        const { from } = institutions.find((i) => i.id === institution);
        const fromText = from ? ` „${from}”` : '';
        patch({ callCheck: { institution, verified } });

        if (verified) {
          if (state.realCall !== 'verified') {
            patch({ realCall: 'verified' });
            addHistory({ persona, actor: 'institution', who: 'Zakład Ubezpieczeń Społecznych', text: 'Zadzwonił w sprawie Twojego wniosku. Sprawdziłaś w aplikacji, że to prawda' });
          }
        } else if (state.call?.caller !== 'zus') {
          // Nikt nie zgłosił połączenia — to prawie na pewno oszustwo
          if (!state.protection.checked) {
            store.update((s) => {
              s.protection.checked = true;
              return s;
            });
            addHistory({ persona, text: `Sprawdziłaś podejrzany telefon${fromText}. Żadna instytucja do Ciebie nie dzwoniła` });
          }
          if (guardianAlerts(state)) {
            notify('anna', {
              title: `Mama sprawdza podejrzany telefon${fromText}`,
              body: 'Aplikacja kazała jej się rozłączyć. Zadzwoń do niej.',
              tone: 'danger',
              action: { label: 'Zadzwoń do mamy', go: 'callContact' },
            });
          }
        }
        go(persona, 'callResult');
        if (store.get().simpleMode[persona]) speak(checkSpeech(store.get().callCheck));
      },
    },
  },

  callResult: {
    kind: 'inner',
    title: 'Ktoś do mnie dzwoni?',
    speech: (state) => checkSpeech(state.callCheck),
    render: (state) => {
      const check = state.callCheck;
      if (!check) return infoBox('Wybierz najpierw, kto się przedstawił.');
      return check.verified ? verifiedResult(state) : scamResult(state, check);
    },
    actions: {
      hangup: () => hangUp(),
    },
  },

  // 2b: prośba o logowanie, której Krystyna nie zaczęła
  loginRequest: {
    kind: 'inner',
    title: 'Prośba o logowanie',
    speech: (state) =>
      state.protection.push === 'blocked'
        ? 'Zablokowane. Nikt nie zalogował się na Twoje konto.'
        : 'Uwaga. Ktoś chce zalogować się na Twoje konto z innego urządzenia. Nie zaczynałaś logowania? To może być oszust. Odrzuć tę prośbę.',
    render: (state) => {
      if (state.protection.push === 'blocked') {
        return `
          <div class="success">
            <span class="success-icon">${icon('shieldLock', { size: 40 })}</span>
            <h2 class="service-title">Zablokowane</h2>
            <p class="service-desc">Nikt nie zalogował się na Twoje konto.${guardianAlerts(state) ? ' Anna dostała ostrzeżenie.' : ''}</p>
          </div>
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.protection.push !== 'pending') return infoBox('Nie masz próśb o zatwierdzenie.');
      return `
        <div class="alert-full alert-danger" role="alert">
          <span class="alert-icon">${icon('warning', { size: 40 })}</span>
          <h2>Nie zaczynałaś logowania?</h2>
          <p class="alert-do">To może być oszust. Odrzuć tę prośbę.</p>
        </div>
        ${list([
          row({ iconName: 'globe', tint: 'red', title: 'Kto prosi', desc: 'Nieznana strona', trailing: '' }),
          row({ iconName: 'idCheck', tint: 'red', title: 'Skąd', desc: 'Inne urządzenie, przeglądarka w Warszawie', trailing: '' }),
          row({ iconName: 'shieldLock', tint: 'red', title: 'O co', desc: 'Dostęp do Twoich dokumentów i spraw', trailing: '' }),
        ])}
        ${infoBox(`<strong>Dlaczego nie ma przycisku „Zatwierdź”?</strong> ${newBadge()}<br>Logowanie zaczyna się zawsze od Ciebie: od zeskanowania kodu QR na stronie albo w tej aplikacji. Ta prośba przyszła sama — więc nie Ty ją zaczęłaś.`)}
        <button class="btn btn-danger" data-action="reject">Odrzuć prośbę</button>
        <p class="footnote">Gdy sama zaczniesz logowanie, zobaczysz tu, kto prosi, o co dokładnie i kod do porównania z ekranem, na którym zaczęłaś.</p>`;
    },
    actions: {
      reject: (el, persona) => {
        const state = store.get();
        store.update((s) => {
          s.protection.push = 'blocked';
          return s;
        });
        addHistory({ persona, actor: 'blocked', text: 'Ktoś próbował zalogować się na Twoje konto z innego urządzenia. Prośbę odrzuciłaś' });
        if (guardianAlerts(state)) {
          // Nowe ostrzeżenie zastępuje poprzednie, żeby nie zasłaniały ekranu Anny
          store.update((s) => {
            s.notifications.anna = s.notifications.anna.filter((n) => n.tone !== 'danger');
            return s;
          });
          notify('anna', {
            title: 'Ktoś próbował zalogować się na konto mamy',
            body: 'Prośba została zablokowana. Mama ją odrzuciła.',
            tone: 'danger',
            action: { label: 'Zadzwoń do mamy', go: 'callContact' },
          });
        }
        if (store.get().simpleMode[persona]) speak('Zablokowane. Nikt nie zalogował się na Twoje konto.');
      },
    },
  },
};
