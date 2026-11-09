// Scena 2 · OCHRONA — „Tylko Ty zaczynasz”.
// 2a: dzwoni „policjant”, Krystyna sprawdza w aplikacji, kto dzwoni, i słyszy: rozłącz się. Anna dostaje ostrzeżenie.
// 2b: oszust próbuje dalej — przychodzi prośba o logowanie, której Krystyna nie zaczęła. Można ją tylko odrzucić.
// Wersja pozytywna: dzwoni naprawdę Zakład Ubezpieczeń Społecznych — aplikacja pokazuje urzędniczkę i kod do porównania.
import { store, go, home, replace, notify, patch, addHistory, withBiometric, openTab } from '../store.js';
import { icon } from '../icons.js';
import { speak, stopSpeaking } from '../speech.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';
import { contactName, contactCase } from '../personas.js';
import { clock } from '../dates.js';
import { qrSvg } from './control.js';

// Imiona bez odmiany: „Anna Nowak, Córka” na telefonie Krystyny, „Mama” na telefonie Anny
const annaFor = (state) => contactName(state, 'krystyna', 'anna');
const mamaFor = (state) => contactName(state, 'anna', 'krystyna');
const mamaGen = (state) => contactCase(state, 'anna', 'krystyna', 'gen');

// Po rozłączeniu oszust próbuje dalej: prośba o logowanie przychodzi po chwili
const PUSH_DELAY_MS = 2500;

const callers = {
  scam: {
    number: 'Nieznany numer',
    label: 'policja',
    // Podpis numeru od mObywatela, widoczny już przy dzwonieniu (iOS 18: Live Caller ID Lookup, Android: filtrowanie połączeń)
    callerId: { text: 'Numer niepotwierdzony przez żadną instytucję', tone: 'warn' },
    lines: [
      'Dzień dobry, komisarz Adam Nowicki, Komenda Policji.',
      'Pani wnuczek spowodował wypadek. Żeby nie trafił do aresztu, potrzebna jest kaucja.',
      'Za chwilę dostanie Pani powiadomienie z mObywatela. Proszę je zatwierdzić — to potwierdzenie Pani tożsamości.',
    ],
  },
  zus: {
    number: '+48 58 000 00 00',
    label: 'Zakład Ubezpieczeń Społecznych',
    callerId: { text: 'Zakład Ubezpieczeń Społecznych · numer sprawdzony', tone: 'ok' },
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

// Logowanie, które zaczyna sama Krystyna: na komputerze strona eZUS z kodem QR i liczbą do porównania
const loginSite = { name: 'eZUS', owner: 'Zakład Ubezpieczeń Społecznych', number: '72', choices: ['38', '72', '15'] };

export function startLogin() {
  stopSpeaking();
  patch({ login: 'scanning' });
  openTab('krystyna', 'documents');
  go('krystyna', 'loginScan');
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
          ${callerIdLabel(caller)}
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
        ${callerIdLabel(caller)}
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
      <button class="call-round call-decline call-end" data-call="hangup" aria-label="Rozłącz">${icon('call', { size: 30 })}</button>
      <button class="call-swipe" data-call="minimize">
        <span class="call-swipe-bar" aria-hidden="true"></span>
        Przesuń w górę, żeby wyjść z ekranu rozmowy. Rozmowa trwa dalej.
      </button>
    </div>`;
}

// Aplikacja nie może dodać przycisków do systemowego ekranu rozmowy, ale może podpisać numer.
// Taki podpis pokazują dziś aplikacje do rozpoznawania numerów; tu podpisuje mObywatel.
function callerIdLabel(caller) {
  return `
    <p class="call-id call-id-${caller.callerId.tone}">${icon(caller.callerId.tone === 'ok' ? 'checkCircle' : 'warning', { size: 16 })} ${caller.callerId.text}</p>
    <p class="call-id-source">Podpis numeru: mObywatel</p>`;
}

// Zielona pigułka w miejscu godziny, gdy rozmowa trwa w tle
export function callPill(state, persona) {
  if (persona !== 'krystyna' || !state.call || !state.call.minimized) return '';
  return `<button class="call-pill" data-call="expand" aria-label="Wróć do rozmowy">${icon('call', { size: 13 })} Rozmowa</button>`;
}

// Zdanie na górze ekranu głównego w trybie prostym. Karta z „go” jest przyciskiem do następnej czynności.
export function protectionStatus(state) {
  if (state.protection.push === 'pending') {
    return { text: 'Ktoś chce zalogować się na Twoje konto. Niczego nie zatwierdzaj.', tone: 'danger', go: 'loginRequest', cta: 'Sprawdź i odrzuć' };
  }
  if (state.call?.status === 'talking') {
    return { text: 'Rozmawiasz przez telefon. Nie wiesz, kto dzwoni?', tone: 'attention', go: 'whoIsCalling', cta: 'Sprawdź, kto dzwoni' };
  }
  return null;
}

// Po zablokowanym ataku ekran główny mówi o tym do końca dnia, zamiast „wszystko w porządku”
export function blockedToday(state) {
  const at = state.protection.blockedAt;
  return Boolean(at) && new Date(at).toDateString() === new Date().toDateString();
}

export function blockedStatus(state) {
  if (!blockedToday(state)) return null;
  const who = guardianAlerts(state) ? ` Ostrzeżenie dostała: ${annaFor(state)}.` : '';
  return { text: `Dziś o ${clock(state.protection.blockedAt)} zablokowaliśmy próbę oszustwa. Jesteś bezpieczna.${who}`, tone: 'ok', go: 'myData', cta: 'Zobacz szczegóły' };
}

// ---------- Ekrany ----------

function checkSpeech(check) {
  if (!check) return null;
  if (check.mismatch) return 'Ta instytucja nie dzwoni teraz do Ciebie. Teraz dzwoni do Ciebie Zakład Ubezpieczeń Społecznych. Wybierz go, żeby sprawdzić rozmówcę.';
  if (check.verified) {
    const code = realCaller.code.split('').join(' ');
    return `Tak, dzwoni do Ciebie naprawdę Zakład Ubezpieczeń Społecznych. Rozmawia z Tobą ${realCaller.name}. Poproś ją o kod. Powinna podać: ${code}. Jeśli poda inny, rozłącz się.`;
  }
  return 'Żadna instytucja nie dzwoni teraz do Ciebie. To prawie na pewno oszustwo. Rozłącz się. Nikomu nie przekazuj pieniędzy ani kodów.';
}

// Podczas prawdziwej rozmowy z ZUS wybrano inną instytucję — bez alarmu i bez ostrzeżenia dla Anny
function mismatchResult(check) {
  const { title } = institutions.find((i) => i.id === check.institution);
  return `
    <div class="alert-full alert-info" role="status">
      <h2>${title}: nie dzwoni teraz do Ciebie</h2>
      <p>Teraz dzwoni do Ciebie <strong>Zakład Ubezpieczeń Społecznych</strong>. Wybierz go, żeby sprawdzić rozmówcę.</p>
    </div>
    <button class="btn btn-primary" data-back>Wybierz jeszcze raz</button>`;
}

function scamResult(state, check) {
  const onCall = Boolean(state.call);
  const annaInfo = guardianAlerts(state)
    ? infoBox(`<strong>Ostrzeżenie dostała: ${annaFor(state)}.</strong> Zaraz może do Ciebie zadzwonić.`)
    : infoBox('Gdy pozwolisz bliskiej osobie pomagać, dostanie w takiej chwili ostrzeżenie.');
  return `
    <div class="alert-full alert-danger" role="alert">
      <span class="alert-icon">${icon('warning', { size: 40 })}</span>
      <h2>Żadna instytucja nie dzwoni teraz do Ciebie</h2>
      <p>To prawie na pewno <strong>oszustwo</strong>.</p>
      <p class="alert-do">Rozłącz się. Nikomu nie przekazuj pieniędzy ani kodów.</p>
    </div>
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
        // Trwa prawdziwa rozmowa z ZUS, a wybrano inną instytucję: to nie oszustwo, tylko pomyłka w wyborze
        const mismatch = state.call?.caller === 'zus' && institution !== 'zus';
        const { from } = institutions.find((i) => i.id === institution);
        const fromText = from ? ` „${from}”` : '';
        patch({ callCheck: { institution, verified, mismatch } });

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
              title: mamaFor(state),
              body: `Sprawdza podejrzany telefon${fromText}. Aplikacja kazała jej się rozłączyć. Zadzwoń do niej.`,
              tone: 'danger',
              action: { label: `Zadzwoń do ${mamaGen(state)}`, go: 'callContact' },
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
      if (check.mismatch) return mismatchResult(check);
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
            <p class="service-desc">Nikt nie zalogował się na Twoje konto.${guardianAlerts(state) ? ` Ostrzeżenie dostała: ${annaFor(state)}.` : ''}</p>
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
          s.protection.blockedAt = new Date().toISOString();
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
            title: mamaFor(state),
            body: 'Ktoś próbował zalogować się na jej konto. Prośba została odrzucona i zablokowana.',
            tone: 'danger',
            action: { label: `Zadzwoń do ${mamaGen(state)}`, go: 'callContact' },
          });
        }
        if (store.get().simpleMode[persona]) speak('Zablokowane. Nikt nie zalogował się na Twoje konto.');
      },
    },
  },

  // Wersja pozytywna logowania: Krystyna sama skanuje kod na komputerze i porównuje liczbę
  loginScan: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Zaloguj się',
    speech: () => `Na komputerze otworzyłaś stronę ${loginSite.name}. Skieruj aparat na kod QR na ekranie komputera i dotknij przycisku Zeskanuj kod.`,
    render: () => `
      <p class="service-desc">Na komputerze otwarta jest strona ${loginSite.name} z kodem QR. Logowanie zaczynasz Ty: skanujesz kod.</p>
      <div class="viewfinder viewfinder-qr">
        <button class="counter-card login-screen" data-action="scanLogin" aria-label="Zeskanuj kod QR ze strony ${loginSite.name}">
          <span class="counter-brand">${icon('building', { size: 18 })} ${loginSite.name} · Zaloguj się</span>
          ${qrSvg(120)}
          <span class="login-number">${loginSite.number}</span>
          <span class="counter-sub">Liczba na ekranie komputera</span>
        </button>
        <span class="viewfinder-frame" aria-hidden="true"></span>
        <span class="scan-line" aria-hidden="true"></span>
      </div>
      <button class="btn btn-primary" data-action="scanLogin">${icon('qr', { size: 20 })} Zeskanuj kod</button>`,
    actions: {
      scanLogin: (el, persona) => {
        patch({ login: 'matching' });
        replace(persona, 'loginConfirm');
      },
    },
  },

  loginConfirm: {
    kind: 'inner',
    title: 'Zaloguj się',
    speech: (state) =>
      state.login === 'wrong'
        ? 'Ta liczba się nie zgadza. Nie loguj się.'
        : `Logujesz się do ${loginSite.name}. To logowanie zaczęłaś Ty. Jaką liczbę widzisz na ekranie komputera? Wybierz: ${loginSite.choices.join(', ')}.`,
    render: (state) => {
      if (state.login === 'wrong') {
        return `
          <div class="alert-full alert-danger" role="alert">
            <span class="alert-icon">${icon('warning', { size: 40 })}</span>
            <h2>Ta liczba się nie zgadza</h2>
            <p class="alert-do">Nie loguj się. Ktoś mógł podmienić stronę.</p>
          </div>
          <p class="footnote">Zamknij stronę na komputerze i wpisz adres sama albo poproś o pomoc bliską osobę.</p>
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.login === 'done') {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">Zalogowano</h2>
            <p class="service-desc">Jesteś zalogowana do ${loginSite.name} na komputerze. Logowanie zaczęłaś Ty i liczba się zgadzała.</p>
          </div>
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      return `
        <div class="requester">
          <span class="service-icon tint-violet">${icon('building', { size: 26 })}</span>
          <div>
            <h2 class="requester-name">Logujesz się do ${loginSite.name}</h2>
            <p class="verified">${icon('checkCircle', { size: 16 })} ${loginSite.owner} · zweryfikowany</p>
          </div>
        </div>
        ${infoBox(`<strong>To logowanie zaczęłaś Ty</strong> — zeskanowałaś kod na ekranie komputera. ${newBadge()}`)}
        <h2 class="service-title">Jaką liczbę widzisz na ekranie komputera?</h2>
        <div class="number-choices">
          ${loginSite.choices.map((n) => `<button class="number-choice" data-action="pick" data-id="${n}">${n}</button>`).join('')}
        </div>
        <p class="footnote">Jeśli żadna się nie zgadza, nie loguj się.</p>
        <button class="btn btn-secondary" data-home>Nie loguj</button>`;
    },
    actions: {
      pick: (el, persona) => {
        if (el.dataset.id !== loginSite.number) {
          patch({ login: 'wrong' });
          addHistory({ persona, actor: 'blocked', text: `Logowanie do ${loginSite.name} przerwane: liczba na komputerze się nie zgadzała` });
          if (store.get().simpleMode[persona]) speak('Ta liczba się nie zgadza. Nie loguj się.');
          return;
        }
        withBiometric(persona, () => {
          patch({ login: 'done' });
          addHistory({ persona, text: `Zalogowałaś się do ${loginSite.name} na komputerze. Logowanie zaczęłaś Ty, liczba się zgadzała` });
          if (store.get().simpleMode[persona]) speak(`Zalogowano do ${loginSite.name}.`);
        });
      },
    },
  },
};
