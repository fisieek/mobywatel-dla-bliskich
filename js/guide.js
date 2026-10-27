// Przewodnik dla jury: podpowiada następny krok, a po scenie pokazuje „Kto już to robi” i licznik.

function helpSceneStep(state) {
  if (state.guardian === 'none') return { phone: 'Telefon Krystyny', text: 'Otwórz Usługi → Pomoc bliskich i pozwól Annie pomagać.' };
  if (state.guardian === 'pending') return { phone: 'Telefon Anny', text: 'Otwórz powiadomienie od mamy i przyjmij prośbę.' };
  switch (state.letter) {
    case 'none':
    case 'reading':
      return { phone: 'Telefon Krystyny', text: 'Krystyna dostała papierowe pismo. Na ekranie głównym dotknij „Moje pisma” i sfotografuj je.' };
    case 'explained':
      return { phone: 'Telefon Krystyny', text: 'Posłuchaj wyjaśnienia i dotknij „Poproś Annę o pomoc”.' };
    case 'requested':
    case 'opened':
    case 'drafting':
      return { phone: 'Telefon Anny', text: 'Otwórz pismo mamy i przygotuj odpowiedź z asystentem.' };
    case 'drafted':
      return { phone: 'Telefon Anny', text: 'Popraw szkic, jeśli chcesz, i wyślij go mamie do zatwierdzenia.' };
    case 'awaiting':
      return { phone: 'Telefon Krystyny', text: 'Przeczytaj odpowiedź i podpisz ją PIN-em podpisu.' };
    default:
      return null;
  }
}

function helpSceneDone() {
  return `
    <div class="guide-card">
      <p class="guide-card-title">Kto już to robi</p>
      <p><strong>Finlandia, Suomi.fi:</strong> pełnomocnictwa z zakresem, terminem i historią użycia. 75% korzystających jest z nich zadowolonych.</p>
      <p><strong>Estonia, Smart-ID:</strong> podpis osobnym PIN-em, bez dokumentu przy telefonie.</p>
    </div>
    <div class="guide-card guide-counter">
      <p class="guide-card-title">Dziś vs w mObywatelu dla bliskich</p>
      <div class="counter-row"><span>Dziś</span><p>Wizyta w urzędzie z mamą albo jej PIN w cudzym telefonie. Pomoc bliskiej osoby w mObywatelu tylko przy receptach.</p></div>
      <div class="counter-row counter-new"><span>U nas</span><p>1 zgoda, 1 podpis PIN-em, każdy krok w historii.</p></div>
    </div>`;
}

export function renderGuide(state) {
  const step = helpSceneStep(state);
  const scene1 = step
    ? `<p class="scene-status scene-status-active">Teraz · ${step.phone}</p><p class="scene-step">${step.text}</p>`
    : `<p class="scene-status scene-status-done">Gotowe ✓</p>${helpSceneDone()}`;

  return `
    <h2 class="guide-title">Trzy sceny</h2>
    <ol class="scenes">
      <li class="scene ${step ? 'scene-current' : ''}">
        <span class="scene-number">1</span>
        <div>
          <p class="scene-name">Pomoc</p>
          <p class="scene-desc">Anna pomaga mamie z pismem z urzędu, bez jej telefonu i PIN-u.</p>
          ${scene1}
        </div>
      </li>
      <li class="scene">
        <span class="scene-number">2</span>
        <div>
          <p class="scene-name">Ochrona</p>
          <p class="scene-desc">Dzwoni „policjant”. Aplikacja mówi: rozłącz się. Anna dostaje ostrzeżenie.</p>
          <p class="scene-status">W budowie</p>
        </div>
      </li>
      <li class="scene">
        <span class="scene-number">3</span>
        <div>
          <p class="scene-name">Kontrola</p>
          <p class="scene-desc">Wypożyczalnia dostaje tylko to, czego potrzebuje. Wszystko widać w historii.</p>
          <p class="scene-status">W budowie</p>
        </div>
      </li>
    </ol>
    <button class="btn btn-secondary" data-reset>Zacznij od nowa</button>`;
}
