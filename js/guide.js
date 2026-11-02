// Panel obok telefonów: scenariusze jako rozwijane odcinki, po jednym naraz.
import { episodes, episodeDone, stepIndex } from './episodes.js';

const cardsFor = [
  () => simpleSceneDone(),
  () => helpSceneDone(),
  (state) => protectSceneDone(state),
  (state) => controlSceneDone(state),
  () => medsSceneDone(),
  () => pickupSceneDone(),
  () => writingSceneDone(),
  () => schoolSceneDone(),
];

function counter(today, ours) {
  return `
    <div class="guide-card guide-counter">
      <p class="guide-card-title">Dziś i po zmianie</p>
      <div class="counter-row"><span>Dziś</span><p>${today}</p></div>
      <div class="counter-row counter-new"><span>Po zmianie</span><p>${ours}</p></div>
    </div>`;
}

function whoDoesIt(items) {
  return `
    <div class="guide-card">
      <p class="guide-card-title">Podobne rozwiązania</p>
      ${items.map(([who, what]) => `<p><strong>${who}:</strong> ${what}</p>`).join('')}
    </div>`;
}

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
            <p><strong>Wariant:</strong> dzwoni prawdziwy urząd.</p>
            <button class="btn btn-secondary btn-small" data-guide-action="realCall">Zasymuluj telefon z Zakładu Ubezpieczeń Społecznych</button>
          </div>`;
  const login =
    state.login === 'done'
      ? '<p class="guide-try">✓ Logowanie, które zaczyna Krystyna: kod QR na komputerze i liczba do porównania.</p>'
      : loginStep(state)
        ? activeStep(loginStep(state))
        : `<div class="guide-try">
            <p><strong>${state.login === 'wrong' ? 'Zła liczba = brak logowania.' : 'Wariant:'}</strong> ${state.login === 'wrong' ? 'Spróbuj jeszcze raz i wybierz 72.' : 'logowanie, które Krystyna zaczyna sama.'}</p>
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
      : '<p class="guide-try"><strong>Wariant:</strong> Krystyna melduje się w hotelu. Na jej telefonie: „Zeskanuj kod QR” na ekranie głównym.</p>';
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

function simpleSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Wielka Brytania, GOV.UK', 'prosty język i jedna rzecz na stronę to zasada dla wszystkich usług publicznych.'],
        ['Apple i Samsung', 'uproszczony tryb całego telefonu (Assistive Access, tryb łatwy). My robimy to samo w mObywatelu.'],
      ])}
      ${counter('Pięć zakładek, ikony bez podpisów, drobny tekst.', 'Jedna karta z tym, co ważne dziś, duże przyciski, czytanie na głos i „Nie wiem, co zrobić”.')}`,
  };
}

function medsSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Dania, Fælles Medicinkort', 'jedna lista leków pacjenta, wspólna dla lekarza, apteki i pacjenta.'],
        ['Polska, Internetowe Konto Pacjenta', 'już dziś pokazuje recepty i pozwala upoważnić bliską osobę do danych medycznych.'],
      ])}
      ${counter('Tabletki kończą się nagle. Recepta wygasła, telefon do przychodni w godzinach pracy.', '5 dni zapasu, prośba do córki jednym dotknięciem, kod do apteki na ekranie.')}
      <p class="guide-note">Przypomnienie liczymy z daty wykupienia i dawkowania z e-recepty. Córka widzi tylko ten jeden lek, bo tak zdecydowała mama.</p>`,
  };
}

function pickupSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Finlandia, Suomi.fi', 'pełnomocnictwa z zakresem i terminem. U nas to samo w stronę dziecka i szkoły.'],
        ['Szkoły w Polsce dziś', 'papierowe upoważnienie na druku szkoły, którego nauczyciel nie ma jak sprawdzić.'],
      ])}
      ${counter('Kartka pisana na kolanie. Szkoła nie wie, czy jest prawdziwa.', '1 minuta w telefonie, kod QR, mama wie o odbiorze w tej samej chwili.')}`,
  };
}

function writingSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Wielka Brytania, Report Remove', 'nastolatek sam zgłasza swoje zdjęcie do usunięcia z internetu (Childline i Internet Watch Foundation).'],
        ['Polska, 116 111 i Dyżurnet.pl', 'pomoc już istnieje. Brakuje drogi do niej w telefonie dziecka.'],
      ])}
      ${counter('Wstyd, skasowane wiadomości, dziecko zostaje z tym samo.', '3 duże przyciski, rada po dziecięcemu, pomoc na wyciągnięcie ręki. Mama wie tylko tyle, ile Zosia zechce.')}
      <p class="guide-note">Rodzic nigdy nie dostaje powiadomienia automatycznie. Krzywdzić może też ktoś bliski, a dziecko, które wie, że mama zobaczy, nie zgłosi.</p>`,
  };
}

function schoolSceneDone() {
  return {
    tries: '',
    cards: `
      ${whoDoesIt([
        ['Polska, mObywatel Junior', 'legitymacja szkolna już łączy ucznia ze szkołą. Zgoda rodzica to kolejny krok.'],
        ['Polska, e-dzienniki', 'wysyłają wiadomości do rodziców, ale zgoda z podpisem wciąż wraca na papierze.'],
      ])}
      ${counter('Kartka gubi się w plecaku, podpis wieczorem dzień przed terminem.', 'Zosia skanuje kod, mama podpisuje w pracy, wychowawczyni widzi od razu.')}`,
  };
}


function summary() {
  const rows = [
    ['Pismo z urzędu', 'Wizyta w urzędzie z mamą albo jej PIN w cudzym telefonie', '1 zgoda i 1 podpis PIN-em. Mama nie wychodzi z domu'],
    ['Telefon od „policjanta”', 'Decyzja w stresie, sam na sam z oszustem', 'Numer podpisany od razu, prośbę da się tylko odrzucić, córka wie'],
    ['Wynajem auta', '7 danych z dowodu, często kserokopia', '2 dane i wpis w historii z „Cofnij zgodę”'],
    ['Aplikacja dla 71-latki', 'Pięć zakładek, drobny tekst, ikony bez podpisów', 'Tryb prosty: duże przyciski, czytanie na głos, „Nie wiem, co zrobić”'],
    ['Kończą się leki', 'Tabletki kończą się nagle', '5 dni zapasu, córka pomaga, kod do apteki na ekranie'],
    ['Odbiór dziecka ze szkoły', 'Kartka, której szkoła nie sprawdzi', 'Kod QR i informacja dla mamy w tej samej chwili'],
    ['Obcy pisze do dziecka', 'Dziecko zostaje z tym samo', 'Rada po dziecięcemu i pomoc, którą dziecko samo wybiera'],
    ['Zgoda na wycieczkę', 'Kartka gubi się w plecaku', 'Mama podpisuje w pracy, szkoła widzi od razu'],
    ['Kto widział dane', 'Nie wiadomo', 'Jedna historia z „Cofnij zgodę”'],
  ];
  return `
    <div class="guide-summary">
      
      ${rows
        .map(
          ([what, today, ours]) => `
          <div class="summary-row">
            <p class="summary-what">${what}</p>
            <div class="counter-row"><span>Dziś</span><p>${today}</p></div>
            <div class="counter-row counter-new"><span>Po zmianie</span><p>${ours}</p></div>
          </div>`,
        )
        .join('')}
      <p><strong>Pomoc · ochrona · kontrola.</strong> To ten sam mObywatel — dodaliśmy tylko to, czego brakuje rodzinie.</p>
    </div>`;
}

function autoplayBar(run) {
  if (!run) return '';
  if (run.failed) {
    return `
      <div class="autoplay autoplay-running" role="status">
        <p>Pokaz zatrzymał się na kroku ${run.index} z ${run.total}. Można kontynuować ręcznie.</p>
        <button class="btn btn-secondary btn-small" data-autoplay="stop">Zamknij</button>
      </div>`;
  }
  return `
    <div class="autoplay autoplay-running" role="status">
      <p>Pokaz trwa · ${run.scene} · krok ${run.index} z ${run.total}</p>
      <button class="btn btn-secondary btn-small" data-autoplay="stop">Zatrzymaj pokaz</button>
    </div>`;
}

function stepList(state, index) {
  const current = stepIndex(state, index);
  return `
    <ol class="ep-steps">
      ${episodes[index].steps
        .map((step, i) => {
          const status = current === -1 || i < current ? 'done' : i === current ? 'now' : 'next';
          return `
          <li class="ep-step ep-step-${status}">
            <span class="ep-step-mark" aria-hidden="true">${status === 'done' ? '✓' : i + 1}</span>
            <div>
              ${step.phone ? `<p class="ep-step-phone">${step.phone}</p>` : ''}
              <p>${step.text}</p>
              ${status === 'now' && step.button ? `<button class="btn btn-primary btn-small" data-guide-action="${step.button.action}">${step.button.label}</button>` : ''}
            </div>
          </li>`;
        })
        .join('')}
    </ol>`;
}

function episodeBody(state, index, run) {
  const episode = episodes[index];
  const done = episodeDone(state, index);
  const cards = cardsFor[index](state);
  const running = Boolean(run && !run.failed);
  const next = episodes[index + 1];
  return `
    <div class="ep-body">
      <dl class="ep-facts">
        <dt>Problem</dt><dd>${episode.problem}</dd>
        <dt>Dla kogo</dt><dd>${episode.audience}</dd>
        <dt>${episode.people.length > 1 ? 'Reprezentanci grupy' : 'Reprezentantka grupy'}</dt>
        <dd>${episode.people.map((p) => `<p><strong>${p.name}.</strong> ${p.desc}</p>`).join('')}</dd>
      </dl>
      <h3 class="ep-heading">Co po kolei</h3>
      ${stepList(state, index)}
      ${episode.note ? `<p class="guide-note">${episode.note}</p>` : ''}
      ${done ? cards.tries : ''}
      ${running ? '' : `
      <div class="ep-actions">
        ${done && next ? `<button class="btn btn-primary btn-small" data-episode="${index + 1}">Następny: ${next.name}</button>` : ''}
        <button class="btn ${done ? 'btn-secondary' : 'btn-primary'} btn-small" data-autoplay="episode" data-scene="${index}">▶ Pokaż automatycznie</button>
        <button class="btn btn-secondary btn-small" data-episode-restart="${index}">Zacznij od nowa</button>
      </div>`}
      <details class="guide-details">
        <summary>Podobne rozwiązania i porównanie</summary>
        ${cards.cards}
      </details>
    </div>`;
}

function episodeItem(state, index, run) {
  const open = state.episodeOpen && state.episode === index;
  const seen = state.seenEpisodes.includes(index);
  return `
    <li class="ep ${open ? 'ep-open' : ''}">
      <button class="ep-head" data-episode="${index}" aria-expanded="${open}">
        <span class="ep-number ${seen ? 'ep-number-seen' : ''}" aria-hidden="true">${seen ? '✓' : index + 1}</span>
        <span class="ep-name">${episodes[index].name}</span>
        <span class="ep-chevron" aria-hidden="true"></span>
      </button>
      ${open ? episodeBody(state, index, run) : ''}
    </li>`;
}

export function renderGuide(state, run = null) {
  return `
    <div class="guide-head">
      <div class="guide-title-row">
        <h2 class="guide-title">Scenariusze</h2>
        <span class="guide-progress">Obejrzane: ${state.seenEpisodes.length} z ${episodes.length}</span>
      </div>
      ${autoplayBar(run)}
    </div>
    <div class="guide-body" data-guide-body>
      <ol class="eps">
        ${episodes.map((_, i) => episodeItem(state, i, run)).join('')}
        <li class="ep ${state.summaryOpen ? 'ep-open' : ''}">
          <button class="ep-head" data-summary aria-expanded="${state.summaryOpen}">
            <span class="ep-number ep-number-summary" aria-hidden="true">Σ</span>
            <span class="ep-name">Podsumowanie: dziś i po zmianie</span>
            <span class="ep-chevron" aria-hidden="true"></span>
          </button>
          ${state.summaryOpen ? `<div class="ep-body">${summary()}</div>` : ''}
        </li>
      </ol>
    </div>
    <div class="guide-foot">
      <button class="btn btn-secondary btn-small" data-autoplay="all">▶ Pokaż wszystkie po kolei</button>
      <button class="btn btn-secondary btn-small" data-reset>Zacznij od początku</button>
    </div>`;
}
