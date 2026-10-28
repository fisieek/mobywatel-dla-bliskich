// Przewodnik dla jury: podpowiada następny krok, a po scenie pokazuje „Kto już to robi” i licznik.
import { contactName } from './personas.js';

function helpSceneStep(state) {
  if (state.guardian === 'none') return { phone: 'Telefon Krystyny', text: 'Otwórz Usługi → Pomoc bliskich i pozwól Annie pomagać.' };
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
    if (call.status === 'ringing') return { phone: 'Telefon Krystyny', text: 'Dzwoni „policjant”. Odbierz połączenie.' };
    if (!protection.checked) {
      return { phone: 'Telefon Krystyny', text: 'Nie rozłączaj się. Przejdź do mObywatela, dotknij „Sprawdź, kto dzwoni” i wybierz „Policja”.' };
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
      return { phone: 'Telefon Krystyny', text: 'Przejdź do mObywatela, dotknij „Ktoś do mnie dzwoni?” i wybierz „Zakład Ubezpieczeń Społecznych”.' };
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

function helpSceneDone() {
  return `
    ${whoDoesIt([
      ['Finlandia, Suomi.fi', 'pełnomocnictwa z zakresem, terminem i historią użycia. 75% korzystających jest z nich zadowolonych.'],
      ['Estonia, Smart-ID', 'podpis osobnym PIN-em, bez dokumentu przy telefonie.'],
    ])}
    ${counter(
      'Wizyta w urzędzie z mamą albo jej PIN w cudzym telefonie. Pomoc bliskiej osoby w mObywatelu tylko przy receptach.',
      '1 zgoda, 1 podpis PIN-em, każdy krok w historii.',
    )}`;
}

function protectSceneDone(state) {
  const real = realCallStep(state);
  const extra =
    state.realCall === 'verified'
      ? '<p class="guide-try">✓ Wersja pozytywna: prawdziwy urząd da się sprawdzić — imię urzędniczki i kod do porównania.</p>'
      : real
        ? `<p class="scene-status scene-status-active">Teraz · ${real.phone}</p><p class="scene-step">${real.text}</p>`
        : `<div class="guide-try">
            <p><strong>Zobacz też:</strong> a gdyby dzwonił naprawdę urząd?</p>
            <button class="btn btn-secondary btn-small" data-guide-action="realCall">Zadzwoń jako Zakład Ubezpieczeń Społecznych</button>
          </div>`;
  return `
    ${extra}
    ${whoDoesIt([
      ['Estonia, Smart-ID+', 'każde logowanie zaczyna użytkownik, a telefon jest powiązany z sesją.'],
      ['Dania, MitID', 'kod QR albo przejście prosto do aplikacji zamiast ogólnego powiadomienia — wprowadzone na prośbę użytkowników.'],
    ])}
    ${counter('Decyzja w stresie, sam na sam z oszustem.', '1 dotknięcie, odpowiedź w sekundę, bliska osoba wie od razu.')}
    <p class="guide-note">Sprawdzanie połączeń wymaga, żeby instytucje zgłaszały swoje telefony do obywateli. To kierunek, nie gotowa usługa. Blokada próśb, których użytkownik nie zaczął, działa już w Estonii i Danii.</p>`;
}

function controlSceneDone(state) {
  const hotel =
    state.consent.krystyna === 'shared'
      ? '<p class="guide-try">✓ Krystyna zameldowała się w hotelu bez podawania numeru PESEL i adresu.</p>'
      : '<p class="guide-try"><strong>Zobacz też:</strong> Krystyna melduje się w hotelu. Na jej telefonie: Kod QR → Zeskanuj kod QR.</p>';
  return `
    ${hotel}
    ${whoDoesIt([
      ['Hiszpania, MiDNI', 'trzy poziomy pokazania dowodu i krótko ważny kod QR.'],
      ['Australia, Trust Exchange', 'zapis, komu i jakie dane przekazano.'],
      ['Singapur, Singpass Myinfo', 'ekran zgody przed przekazaniem danych, w ponad 1000 usług.'],
    ])}
    ${counter('Kserokopia dowodu albo cały dokument w obcych rękach. Brak śladu.', '2 dane zamiast całego dokumentu i wpis w historii z „Cofnij zgodę”.')}
    <p class="guide-note">Kierunek, który państwo już obrało (weryfikacja wieku, Europejski Portfel Tożsamości Cyfrowej), rozszerzamy poza sam wiek.</p>`;
}

// Czy asystent odpowiadał na żywo (PLLuM), czy z przygotowanych odpowiedzi — uczciwie, ale w przewodniku, nie na telefonie
function aiSourceNote(state) {
  const sources = [state.aiSource.explain, state.aiSource.draft].filter(Boolean);
  if (!sources.length) return '';
  return sources.every((source) => source === 'live')
    ? '<p class="guide-note">Asystent: odpowiedzi na żywo z polskiego modelu PLLuM ✓</p>'
    : '<p class="guide-note">Asystent: tryb awaryjny — przygotowane wcześniej odpowiedzi, bez połączenia z PLLuM.</p>';
}

function sceneItem({ number, name, desc, step, current, done, note = '' }) {
  let status;
  if (step) {
    status = `
      ${step.phone ? `<p class="scene-status scene-status-active">Teraz · ${step.phone}</p>` : ''}
      <p class="scene-step">${step.text}</p>
      ${step.button ? `<button class="btn btn-primary btn-small" data-guide-action="${step.button.action}">${step.button.label}</button>` : ''}`;
  } else {
    status = `<p class="scene-status scene-status-done">Gotowe ✓</p>${done}`;
  }
  return `
    <li class="scene ${current ? 'scene-current' : ''}">
      <span class="scene-number">${number}</span>
      <div>
        <p class="scene-name">${name}</p>
        <p class="scene-desc">${desc}</p>
        ${status}
        ${note}
      </div>
    </li>`;
}

export function renderGuide(state) {
  const steps = [helpSceneStep(state), protectSceneStep(state), controlSceneStep(state)];
  // Bieżąca scena: ta, w której coś się dzieje (np. dzwoni telefon), a jeśli nic — pierwsza niezakończona
  const inProgress = state.call || ['queued', 'pending'].includes(state.protection.push) ? 1 : state.consent.anna === 'scanned' ? 2 : -1;
  const current = inProgress >= 0 ? inProgress : steps.findIndex(Boolean);
  const allDone = current === -1;

  return `
    <h2 class="guide-title">Trzy sceny</h2>
    <ol class="scenes">
      ${sceneItem({
        number: 1,
        name: 'Pomoc',
        desc: 'Anna pomaga mamie z pismem z urzędu, bez jej telefonu i PIN-u.',
        step: steps[0],
        current: current === 0,
        done: helpSceneDone(),
        note: aiSourceNote(state),
      })}
      ${sceneItem({
        number: 2,
        name: 'Ochrona',
        desc: 'Dzwoni „policjant”. Aplikacja mówi: rozłącz się. Prośbę oszusta da się tylko odrzucić. Anna dostaje ostrzeżenie.',
        step: steps[1],
        current: current === 1,
        done: protectSceneDone(state),
      })}
      ${sceneItem({
        number: 3,
        name: 'Kontrola',
        desc: 'Wypożyczalnia dostaje tylko to, czego potrzebuje. Wszystko widać w historii.',
        step: steps[2],
        current: current === 2,
        done: controlSceneDone(state),
      })}
    </ol>
    ${allDone ? '<p class="guide-try"><strong>Pomoc · ochrona · kontrola.</strong> To ten sam mObywatel — dodaliśmy tylko to, czego brakuje rodzinie.</p>' : ''}
    <button class="btn btn-secondary" data-reset>Zacznij od nowa</button>`;
}
