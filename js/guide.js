// Przewodnik dla jury: podpowiada następny krok, a po scenie pokazuje „Kto już to robi” i licznik.
import { contactName } from './personas.js';

function helpSceneStep(state) {
  if (state.guardian === 'none') return { phone: 'Telefon Krystyny', text: 'Na ekranie głównym dotknij „Pozwól bliskiej osobie Ci pomagać” i pozwól Annie pomagać.' };
  if (state.guardian === 'pending') return { phone: 'Telefon Anny', text: 'Otwórz powiadomienie od mamy (albo dzwonek u góry) i przyjmij prośbę.' };
  switch (state.letter) {
    case 'none':
    case 'reading':
      return { phone: 'Telefon Krystyny', text: 'Krystyna dostała papierowe pismo. Na ekranie głównym dotknij „Moje pisma” i sfotografuj je.' };
    case 'explained':
      return { phone: 'Telefon Krystyny', text: `Posłuchaj wyjaśnienia i dotknij „Poproś o pomoc: ${contactName(state, 'krystyna', 'anna')}”.` };
    case 'requested':
    case 'opened':
    case 'drafting':
      return { phone: 'Telefon Anny', text: 'Otwórz pismo mamy i przygotuj odpowiedź z asystentem.' };
    case 'drafted':
      return { phone: 'Telefon Anny', text: 'Popraw szkic, jeśli chcesz, i wyślij go mamie do zatwierdzenia.' };
    case 'awaiting':
      return { phone: 'Telefon Krystyny', text: 'Dotknij „Przeczytaj odpowiedź” na ekranie głównym i podpisz ją PIN-em podpisu.' };
    default:
      return null;
  }
}

function protectSceneStep(state) {
  const { call, protection } = state;
  if (call?.caller === 'scam') {
    if (call.status === 'ringing') return { phone: 'Telefon Krystyny', text: 'Dzwoni „policjant”. Już pod numerem widać podpis od mObywatela: „Numer niepotwierdzony przez żadną instytucję”. Odbierz połączenie.' };
    if (!protection.checked) {
      return { phone: 'Telefon Krystyny', text: 'Nie rozłączaj się. Wyjdź z ekranu rozmowy (pasek „Przesuń w górę” na dole), w mObywatelu dotknij „Sprawdź, kto dzwoni” i wybierz „Policja”.' };
    }
    return { phone: 'Telefon Krystyny', text: 'Aplikacja mówi: rozłącz się. Dotknij „Rozłącz się”. Anna dostała już ostrzeżenie.' };
  }
  if (protection.push === 'queued') return { phone: 'Telefon Krystyny', text: 'Oszust się nie poddaje… Poczekaj chwilę.' };
  if (protection.push === 'pending') return { phone: 'Telefon Krystyny', text: 'Przyszła prośba o logowanie, której Krystyna nie zaczęła. Otwórz ją z powiadomienia albo z czerwonej karty na ekranie głównym.' };
  if (protection.push === 'none' && !protection.checked) {
    return { text: 'Zobacz, co się dzieje, gdy do Krystyny dzwoni oszust.', button: { action: 'scamCall', label: 'Zadzwoń do Krystyny jako „policjant”' } };
  }
  if (!protection.checked) return { phone: 'Telefon Krystyny', text: 'Dotknij „Ktoś do mnie dzwoni?” i wybierz „Policja”.' };
  if (protection.push === 'none') return { text: 'Zadzwoń jeszcze raz, żeby zobaczyć, co oszust zrobi dalej.', button: { action: 'scamCall', label: 'Zadzwoń jako „policjant”' } };
  return null;
}

function realCallStep(state) {
  const { call } = state;
  if (call?.caller === 'zus') {
    if (call.status === 'ringing') return { phone: 'Telefon Krystyny', text: 'Dzwoni Zakład Ubezpieczeń Społecznych. Odbierz.' };
    if (state.realCall !== 'verified') {
      return { phone: 'Telefon Krystyny', text: 'Wyjdź z ekranu rozmowy, w mObywatelu dotknij „Sprawdź, kto dzwoni” i wybierz „Zakład Ubezpieczeń Społecznych”.' };
    }
  }
  return null;
}

function controlSceneStep(state) {
  if (state.consent.anna === 'none') {
    const prefix = state.actingAs === 'ja' ? '' : 'Wróć do siebie („Działam jako: Ja”). ';
    return { phone: 'Telefon Anny', text: `${prefix}Anna wynajmuje auto. Otwórz zakładkę „Kod QR” → „Zeskanuj kod QR” i dotknij „Zeskanuj kod”.` };
  }
  if (state.consent.anna === 'scanned') return { phone: 'Telefon Anny', text: 'Wybierz, ile danych pokazać wypożyczalni, i udostępnij.' };
  if (!state.historySeen) {
    return { phone: 'Telefon Krystyny', text: 'Na ekranie głównym dotknij „Kto widział moje dane”. Widać tam pomoc Anny, zablokowany atak i wszystkie udostępnienia.' };
  }
  return null;
}

function counter(today, ours) {
  return `
    <div class="guide-card guide-counter">
      <p class="guide-card-title">Dziś vs w mObywatelu dla bliskich</p>
      <div class="counter-row"><span>Dziś</span><p>${today}</p></div>
      <div class="counter-row counter-new"><span>U nas</span><p>${ours}</p></div>
    </div>`;
}

function whoDoesIt(items) {
  return `
    <div class="guide-card">
      <p class="guide-card-title">Kto już to robi</p>
      ${items.map(([who, what]) => `<p><strong>${who}:</strong> ${what}</p>`).join('')}
    </div>`;
}

// Po scenie: „Zobacz też” (do kliknięcia) zostaje na wierzchu, karty „Kto już to robi” i „Dziś vs u nas” są zwinięte
function helpSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Finlandia, Suomi.fi', 'pełnomocnictwa z zakresem, terminem i historią użycia. 75% korzystających jest z nich zadowolonych.'],
        ['Estonia, Smart-ID', 'podpis osobnym PIN-em, bez dokumentu przy telefonie.'],
      ])}
      ${counter(
        'Wizyta w urzędzie z mamą albo jej PIN w cudzym telefonie. Pomoc bliskiej osoby w mObywatelu tylko przy receptach.',
        '1 zgoda, 1 podpis PIN-em, każdy krok w historii.',
      )}`,
  };
}

function loginStep(state) {
  if (!['scanning', 'matching'].includes(state.login)) return null;
  return { phone: 'Telefon Krystyny', text: 'Zeskanuj kod z ekranu komputera i wybierz liczbę, którą na nim widać (72).' };
}

const activeStep = (step) => `<p class="scene-status scene-status-active">Teraz · ${step.phone}</p><p class="scene-step">${step.text}</p>`;

function protectSceneDone(state) {
  const real = realCallStep(state);
  const realCall =
    state.realCall === 'verified'
      ? '<p class="guide-try">✓ Wersja pozytywna: prawdziwy urząd da się sprawdzić — imię urzędniczki i kod do porównania.</p>'
      : real
        ? activeStep(real)
        : `<div class="guide-try">
            <p><strong>Zobacz też:</strong> a gdyby dzwonił naprawdę urząd?</p>
            <button class="btn btn-secondary btn-small" data-guide-action="realCall">Zadzwoń jako Zakład Ubezpieczeń Społecznych</button>
          </div>`;
  const login =
    state.login === 'done'
      ? '<p class="guide-try">✓ Logowanie, które zaczyna Krystyna: kod QR na komputerze i liczba do porównania.</p>'
      : loginStep(state)
        ? activeStep(loginStep(state))
        : `<div class="guide-try">
            <p><strong>${state.login === 'wrong' ? 'Zła liczba = brak logowania.' : 'Zobacz też:'}</strong> ${state.login === 'wrong' ? 'Spróbuj jeszcze raz i wybierz 72.' : 'jak wygląda logowanie, które Krystyna zaczyna sama?'}</p>
            <button class="btn btn-secondary btn-small" data-guide-action="login">Zaloguj Krystynę do eZUS kodem QR</button>
          </div>`;
  return {
    tries: `${realCall}${login}`,
    cards: `
      ${whoDoesIt([
        ['Estonia, Smart-ID+', 'każde logowanie zaczyna użytkownik, a telefon jest powiązany z sesją.'],
        ['Dania, MitID', 'kod QR albo przejście prosto do aplikacji zamiast ogólnego powiadomienia — wprowadzone na prośbę użytkowników.'],
      ])}
      ${counter('Decyzja w stresie, sam na sam z oszustem.', '1 dotknięcie, odpowiedź w sekundę, bliska osoba wie od razu.')}
      <p class="guide-note">Sprawdzanie połączeń wymaga, żeby instytucje zgłaszały swoje telefony do obywateli. To kierunek, nie gotowa usługa. Blokada próśb, których użytkownik nie zaczął, działa już w Estonii i Danii.</p>
      <p class="guide-note">Podpis numeru przy dzwonieniu da się zrobić już dziś: na iPhonie od iOS 18 aplikacja może sprawdzić przychodzący numer na swoim serwerze (Live Caller ID Lookup), na Androidzie służy do tego usługa filtrowania połączeń. Aplikacja nie może za to dodać przycisków do systemowego ekranu rozmowy — dlatego Krystyna wychodzi z rozmowy sama. W prototypie od razu otwiera się mObywatel.</p>`,
  };
}

function controlSceneDone(state) {
  const hotel =
    state.consent.krystyna === 'shared'
      ? '<p class="guide-try">✓ Krystyna zameldowała się w hotelu bez podawania numeru PESEL i adresu.</p>'
      : '<p class="guide-try"><strong>Zobacz też:</strong> Krystyna melduje się w hotelu. Na jej telefonie: „Zeskanuj kod QR” na ekranie głównym.</p>';
  return {
    tries: hotel,
    cards: `
      ${whoDoesIt([
        ['Hiszpania, MiDNI', 'trzy poziomy pokazania dowodu i krótko ważny kod QR.'],
        ['Australia, Trust Exchange', 'zapis, komu i jakie dane przekazano.'],
        ['Singapur, Singpass Myinfo', 'ekran zgody przed przekazaniem danych, w ponad 1000 usług.'],
      ])}
      ${counter('Kserokopia dowodu albo cały dokument w obcych rękach. Brak śladu.', '2 dane zamiast całego dokumentu i wpis w historii z „Cofnij zgodę”.')}
      <p class="guide-note">Kierunek, który państwo już obrało (weryfikacja wieku, Europejski Portfel Tożsamości Cyfrowej), rozszerzamy poza sam wiek.</p>`,
  };
}

// Czy asystent odpowiadał na żywo (PLLuM), czy z przygotowanych odpowiedzi — uczciwie, ale w przewodniku, nie na telefonie
function aiSourceNote(state) {
  const sources = [state.aiSource.explain, state.aiSource.draft].filter(Boolean);
  if (!sources.length) return '';
  return sources.every((source) => source === 'live')
    ? '<p class="guide-note">Asystent: odpowiedzi na żywo z polskiego modelu PLLuM ✓</p>'
    : '<p class="guide-note">Asystent: tryb awaryjny — przygotowane wcześniej odpowiedzi, bez połączenia z PLLuM.</p>';
}

// Jedno „Teraz” naraz: bieżąca scena ma krok, następne tylko „Potem”, skończone — „Gotowe ✓” i zwinięte karty
function sceneItem({ number, name, desc, step, current, done, openCards, note = '' }) {
  let status;
  if (step && current) {
    status = `
      ${step.phone ? `<p class="scene-status scene-status-active">Teraz · ${step.phone}</p>` : ''}
      <p class="scene-step">${step.text}</p>
      ${step.button ? `<button class="btn btn-primary btn-small" data-guide-action="${step.button.action}">${step.button.label}</button>` : ''}`;
  } else if (step) {
    // Scena na później: bez kroku, ale z przyciskiem startu, jeśli scena się nim zaczyna (np. telefon od „policjanta”)
    status = `
      <p class="scene-status">Potem</p>
      ${step.button && !step.phone ? `<button class="btn btn-secondary btn-small" data-guide-action="${step.button.action}">${step.button.label}</button>` : ''}`;
  } else {
    status = `
      <p class="scene-status scene-status-done">Gotowe ✓</p>
      ${done.tries}
      <details class="guide-details" ${openCards ? 'open' : ''}>
        <summary>Kto już to robi i co się zmienia</summary>
        ${done.cards}
      </details>`;
  }
  return `
    <li class="scene ${current ? 'scene-current' : ''} ${step && !current ? 'scene-later' : ''}">
      <span class="scene-number">${number}</span>
      <div>
        <p class="scene-name">${name}</p>
        <p class="scene-desc">${desc}</p>
        ${status}
        ${note}
      </div>
    </li>`;
}

// Bieżąca scena: ta, w której coś się dzieje (np. dzwoni telefon), a jeśli nic — pierwsza niezakończona
function progress(state) {
  const steps = [helpSceneStep(state), protectSceneStep(state), controlSceneStep(state)];
  const inProgress = state.call || ['queued', 'pending'].includes(state.protection.push) ? 1 : state.consent.anna === 'scanned' ? 2 : -1;
  const current = inProgress >= 0 ? inProgress : steps.findIndex(Boolean);
  return { steps, current };
}

const phonePersona = { 'Telefon Krystyny': 'krystyna', 'Telefon Anny': 'anna' };

// Krok „Teraz” dla paska na wąskim ekranie: { phone, text, persona } albo null
export function currentStep(state) {
  const { steps, current } = progress(state);
  const step = (current >= 0 ? steps[current] : null) ?? realCallStep(state) ?? loginStep(state);
  if (!step?.phone) return step ? { ...step, persona: null } : null;
  return { ...step, persona: phonePersona[step.phone] ?? null };
}

// Podsumowanie po wszystkich scenach: dziś vs u nas w jednej karcie
function summary(state) {
  const entries = state.history.filter((h) => h.persona === 'krystyna' && !h.revokes).length;
  const rows = [
    ['Pismo z urzędu', 'Wizyta w urzędzie z mamą albo jej PIN w cudzym telefonie', '1 zgoda i 1 podpis PIN-em. Mama nie wychodzi z domu'],
    ['Telefon od „policjanta”', 'Decyzja w stresie, sam na sam z oszustem', 'Numer podpisany od razu, prośbę da się tylko odrzucić, córka wie'],
    ['Wynajem auta', '7 danych z dowodu, często kserokopia', '2 dane i wpis w historii z „Cofnij zgodę”'],
    ['Kto widział dane', 'Nie wiadomo', `${entries} ${entries === 1 ? 'wpis' : entries % 10 >= 2 && entries % 10 <= 4 && (entries % 100 < 12 || entries % 100 > 14) ? 'wpisy' : 'wpisów'} w historii Krystyny z tej sesji`],
  ];
  return `
    <div class="guide-summary">
      <p class="guide-card-title">Cała historia: dziś vs w mObywatelu dla bliskich</p>
      ${rows
        .map(
          ([what, today, ours]) => `
          <div class="summary-row">
            <p class="summary-what">${what}</p>
            <div class="counter-row"><span>Dziś</span><p>${today}</p></div>
            <div class="counter-row counter-new"><span>U nas</span><p>${ours}</p></div>
          </div>`,
        )
        .join('')}
      <p><strong>Pomoc · ochrona · kontrola.</strong> To ten sam mObywatel — dodaliśmy tylko to, czego brakuje rodzinie.</p>
    </div>`;
}

function autoplayControls(run) {
  if (!run) {
    return `
      <div class="autoplay">
        <button class="btn btn-primary btn-small" data-autoplay="start">▶ Pokaż sam (ok. 2 min)</button>
        <p class="guide-note">Zaczyna od nowa i klika za Ciebie, z podświetleniem każdego dotknięcia. Możesz przerwać w każdej chwili.</p>
      </div>`;
  }
  if (run.failed) {
    return `
      <div class="autoplay autoplay-running" role="status">
        <p>Pokaz zatrzymał się na kroku ${run.index} z ${run.total}. Dalej możesz klikać sam.</p>
        <button class="btn btn-secondary btn-small" data-autoplay="stop">Zamknij</button>
      </div>`;
  }
  return `
    <div class="autoplay autoplay-running" role="status">
      <p>Pokaz trwa · scena ${run.scene} · krok ${run.index} z ${run.total}</p>
      <button class="btn btn-secondary btn-small" data-autoplay="stop">Zatrzymaj pokaz</button>
    </div>`;
}

export function renderGuide(state, run = null) {
  const { steps, current } = progress(state);
  const allDone = current === -1;
  // Rozwinięte karty ma tylko scena skończona jako ostatnia przed bieżącą
  const doneBefore = steps.map((step, i) => (!step && i < current ? i : -1)).filter((i) => i >= 0);
  const openIndex = allDone ? -1 : doneBefore.at(-1) ?? -1;
  const scenes = [
    { name: 'Pomoc', desc: 'Anna pomaga mamie z pismem z urzędu, bez jej telefonu i PIN-u.', done: helpSceneDone(), note: aiSourceNote(state) },
    { name: 'Ochrona', desc: 'Dzwoni „policjant”. Aplikacja mówi: rozłącz się. Prośbę oszusta da się tylko odrzucić. Anna dostaje ostrzeżenie.', done: protectSceneDone(state) },
    { name: 'Kontrola', desc: 'Wypożyczalnia dostaje tylko to, czego potrzebuje. Wszystko widać w historii.', done: controlSceneDone(state) },
  ];

  return `
    <h2 class="guide-title">Trzy sceny</h2>
    ${autoplayControls(run)}
    <ol class="scenes">
      ${scenes
        .map((scene, i) =>
          sceneItem({ number: i + 1, ...scene, step: steps[i], current: current === i, openCards: openIndex === i }),
        )
        .join('')}
    </ol>
    ${allDone ? summary(state) : ''}
    <button class="btn btn-secondary" data-reset>Zacznij od nowa</button>`;
}
