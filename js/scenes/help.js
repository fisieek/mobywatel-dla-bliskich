// Scena 1 · POMOC — „Pomóż mi, bez oddawania telefonu”.
// 1a: Krystyna daje Annie pozwolenie, Anna je przyjmuje.
// 1b: Krystyna fotografuje papierowe pismo, asystent wyjaśnia je po ludzku, Krystyna prosi Annę o pomoc.
// 1c: Anna (jako „Mama”) przygotowuje odpowiedź, Krystyna podpisuje ją PIN-em podpisu.
import { store, replace, notify, patch, addHistory, withBiometric } from '../store.js';
import { icon } from '../icons.js';
import { speak } from '../speech.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';
import { people } from '../personas.js';
import { explanation as sampleExplanation, explanationSpeech, paperHtml, sampleLetterText } from '../letter.js';
import { explainLetter, draftReply } from '../assistant.js';
import { readTextFromPhoto } from '../ocr.js';

export const GUARDIAN_UNTIL = '27.10.2027';
// Poniżej tej długości odczyt zdjęcia uznajemy za nieudany
const MIN_OCR_CHARS = 150;

const recipient = { name: 'Krystyna Nowak', form: people.krystyna.grammaticalForm };

// Zdjęcie zrobione przez użytkownika — tylko w pamięci strony, nie zapisujemy go nigdzie
let photoUrl = null;

const currentExplanation = (state) => state.explanation ?? sampleExplanation;
const officeName = (state) => currentExplanation(state).from || 'urzędu';
const deadlineText = (state) => currentExplanation(state).when;

const scopeItems = [
  { key: 'letters', title: 'Widzi moje pisma i terminy' },
  { key: 'replies', title: 'Przygotowuje odpowiedzi do urzędu' },
  { key: 'alerts', title: 'Dostaje ostrzeżenie, gdy ktoś podejrzany do mnie dzwoni' },
  { key: 'send', title: 'Wysyła i podpisuje w moim imieniu', locked: 'Wysłać i podpisać możesz tylko Ty' },
  { key: 'health', title: 'Widzi moje dane zdrowotne' },
];

const LETTER_ORDER = ['none', 'reading', 'explained', 'requested', 'opened', 'drafting', 'drafted', 'awaiting', 'signed'];
const letterAtLeast = (state, status) => LETTER_ORDER.indexOf(state.letter) >= LETTER_ORDER.indexOf(status);

function toggle(on, locked) {
  return `<span class="toggle ${on ? 'toggle-on' : ''} ${locked ? 'toggle-locked' : ''}" aria-hidden="true"><span></span></span>`;
}

function scopeSummary(state) {
  return list(
    scopeItems.map((item) => {
      const on = state.guardianScope[item.key];
      return `
        <div class="row row-static">
          <span class="row-icon ${on ? 'tint-green' : 'tint-red'}">${icon(on ? 'check' : 'close', { size: 18 })}</span>
          <span class="row-text"><span class="row-title">${item.title}</span></span>
        </div>`;
    }),
  );
}

function scopeSpeech(state) {
  const allowed = scopeItems.filter((i) => state.guardianScope[i.key]).map((i) => i.title.toLowerCase());
  return `Anna będzie mogła: ${allowed.join(', ')}. Niczego nie wyśle ani nie podpisze bez Ciebie. Pozwolenie jest ważne 12 miesięcy. Możesz je odwołać w każdej chwili jednym przyciskiem.`;
}

const SOURCE_NOTES = {
  explain: {
    live: 'Wyjaśnienie przygotował na żywo Wirtualny Asystent na polskim modelu PLLuM. Sprawdź treść pisma.',
    scripted: 'Wyjaśnienie przygotowane wcześniej — tryb awaryjny, bez połączenia z PLLuM. Sprawdź treść pisma.',
  },
  draft: {
    live: 'Szkic przygotował na żywo Wirtualny Asystent na polskim modelu PLLuM. Sprawdź go przed wysłaniem.',
    scripted: 'Szkic przygotowany wcześniej — tryb awaryjny, bez połączenia z PLLuM. Sprawdź go przed wysłaniem.',
  },
};

const sourceNote = (kind, source) => SOURCE_NOTES[kind][source === 'live' ? 'live' : 'scripted'];

function explanationBlocks(state) {
  const e = currentExplanation(state);
  return `
    ${state.usedSample && state.aiSource.explain === 'scripted' && photoUrl ? infoBox('Asystent jest teraz niedostępny, więc pokazujemy przykładowe pismo.') : ''}
    <div class="ai-blocks">
      <div class="ai-block"><p class="ai-label">O co chodzi</p><p>${escapeHtml(e.what)}</p></div>
      <div class="ai-block"><p class="ai-label">Co musisz zrobić</p><p>${escapeHtml(e.todo)}</p></div>
      <div class="ai-block ai-block-deadline">
        <p class="ai-label">Do kiedy</p><p class="ai-deadline">${escapeHtml(e.when)}</p>
        <button class="pill" data-action="remind">Przypomnij mi</button>
      </div>
      ${e.warning ? `<p class="ai-warning">${escapeHtml(e.warning)}</p>` : ''}
    </div>
    <p class="ai-source">${icon('assistant', { size: 16 })} ${sourceNote('explain', state.aiSource.explain)}</p>`;
}

// Odczyt pisma: tekst ze zdjęcia (albo przykładowy) → PLLuM → trzy bloki
async function readLetter(persona, getText) {
  patch({ letter: 'reading' });
  replace(persona, 'letterExplained');
  let letterText = sampleLetterText();
  let usedSample = true;
  try {
    const text = await getText();
    if (text && text.length >= MIN_OCR_CHARS) {
      letterText = text;
      usedSample = false;
    }
  } catch {
    // odczyt się nie udał — zostaje przykładowe pismo
  }
  const result = await explainLetter({ letterText, recipient });
  if (store.get().letter !== 'reading') return;
  const fellBack = result.source === 'scripted' && !usedSample;
  store.update((s) => {
    s.letter = 'explained';
    s.letterText = fellBack ? sampleLetterText() : letterText;
    s.usedSample = usedSample || fellBack;
    s.explanation = result.explanation;
    s.aiSource.explain = result.source;
    return s;
  });
  if (store.get().simpleMode.krystyna) speak(explanationSpeech(result.explanation));
}

export function onPhotoSelected(persona, file) {
  if (!file) return;
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  readLetter(persona, () => readTextFromPhoto(file));
}

function letterPhoto(state) {
  return photoUrl && !state.usedSample
    ? `<img class="letter-photo" src="${photoUrl}" alt="Zdjęcie pisma">`
    : paperHtml({ compact: true });
}

function thinking(text) {
  return `<div class="thinking" role="status"><span class="spinner" aria-hidden="true"></span><p>${text}</p></div>`;
}

function successBlock(title, body) {
  return `
    <div class="success">
      <span class="success-icon">${icon('check', { size: 40 })}</span>
      <h2 class="service-title">${title}</h2>
      <p class="service-desc">${body}</p>
    </div>`;
}

// ---------- 1a: pozwolenie ----------

export function revokeGuardian() {
  patch({ guardian: 'none', actingAs: 'ja' });
  addHistory({ persona: 'krystyna', text: 'Odwołałaś pomoc Anny' });
  notify('anna', { title: 'Mama odwołała Twoją pomoc', body: 'Nie widzisz już jej pism.' });
}

function helpersForKrystyna(state) {
  if (state.guardian === 'none') {
    return `
      ${infoBox('Dziś bliska osoba może pomóc Ci w mObywatelu tylko przy receptach. Tutaj pozwolisz jej pomagać we wszystkich sprawach urzędowych — w zakresie, który sama wybierzesz.')}
      <button class="btn btn-primary" data-go="helpersChoose">Pozwól bliskiej osobie mi pomagać</button>`;
  }
  const annaRow = row({
    iconName: 'people',
    tint: 'green',
    title: 'Anna Nowak (córka)',
    desc: state.guardian === 'pending' ? 'Czeka, aż Anna przyjmie prośbę' : `Pomaga Ci do ${GUARDIAN_UNTIL}`,
    go: 'helpersScopeView',
  });
  return `
    ${sectionTitle('Kto Ci pomaga')}
    ${list([annaRow])}
    ${state.guardian === 'active' ? '<button class="btn btn-secondary btn-danger-text" data-action="revoke">Odwołaj pomoc Anny</button>' : ''}`;
}

function helpersForAnna(state) {
  if (state.guardian === 'pending') {
    return `${sectionTitle('Prośby o pomoc')}${list([row({ iconName: 'people', tint: 'green', title: 'Mama prosi Cię o pomoc', desc: 'Krystyna Nowak', go: 'helpersInvite' })])}`;
  }
  if (state.guardian === 'active') {
    return `${sectionTitle('Komu pomagasz')}${list([row({ iconName: 'people', tint: 'green', title: 'Mama — Krystyna Nowak', desc: `Do ${GUARDIAN_UNTIL} · pisma, odpowiedzi, ostrzeżenia`, go: 'mamaLetter' })])}`;
  }
  return infoBox('Nikt nie poprosił Cię jeszcze o pomoc. Gdy mama da Ci pozwolenie, zobaczysz to tutaj.');
}

export const helpScreens = {
  helpers: {
    kind: 'inner',
    title: 'Pomoc bliskich',
    render: (state, persona) => `
      ${serviceHeader({
        iconName: 'people',
        tint: 'green',
        title: 'Pomoc bliskich',
        desc: 'Pozwól zaufanej osobie widzieć Twoje pisma i przygotowywać odpowiedzi. Ty decydujesz, w czym pomaga i do kiedy.',
        badge: newBadge(),
      })}
      ${persona === 'krystyna' ? helpersForKrystyna(state) : helpersForAnna(state)}`,
    actions: {
      revoke: () => revokeGuardian(),
    },
  },

  helpersChoose: {
    kind: 'inner',
    title: 'Kto ma Ci pomagać?',
    render: () => `
      <p class="service-desc">Osoby z Twojej rodziny według rejestru stanu cywilnego. Nie musisz wpisywać numeru PESEL.</p>
      ${list([
        row({ iconName: 'people', tint: 'green', title: 'Anna Nowak', desc: 'córka', go: 'helpersScope' }),
        row({ iconName: 'people', tint: 'blue', title: 'Inna osoba', desc: 'Podaj jej numer PESEL', go: 'coreService' }),
      ])}`,
  },

  helpersScope: {
    kind: 'inner',
    title: 'Zakres pomocy',
    speech: (state) => scopeSpeech(state),
    render: (state) => `
      <h2 class="service-title">W czym Anna może Ci pomagać?</h2>
      ${list(
        scopeItems.map((item) =>
          row({
            title: item.title,
            desc: item.locked ?? '',
            action: item.locked ? undefined : 'toggleScope',
            id: item.key,
            trailing: toggle(state.guardianScope[item.key], Boolean(item.locked)),
          }),
        ),
      )}
      ${list([row({ iconName: 'history', title: 'Ważne 12 miesięcy', desc: `Do ${GUARDIAN_UNTIL}. Możesz to odwołać w każdej chwili, jednym przyciskiem.`, trailing: '' })])}
      ${infoBox('Po każdym działaniu Anny dostaniesz powiadomienie. Wszystko zobaczysz też w historii.')}
      <button class="btn btn-secondary" data-speak>${icon('speaker', { size: 20 })} Przeczytaj mi to</button>
      <button class="btn btn-primary" data-action="confirm">Potwierdź</button>`,
    actions: {
      toggleScope: (el) =>
        store.update((s) => {
          s.guardianScope[el.dataset.id] = !s.guardianScope[el.dataset.id];
          return s;
        }),
      confirm: (el, persona) =>
        withBiometric(persona, () => {
          patch({ guardian: 'pending' });
          addHistory({ persona: 'krystyna', text: 'Poprosiłaś Annę o pomoc w sprawach urzędowych' });
          notify('anna', {
            title: 'Mama prosi Cię o pomoc',
            body: 'Krystyna Nowak chce, żebyś pomagała jej w sprawach urzędowych.',
            action: { label: 'Zobacz', go: 'helpersInvite' },
          });
          replace(persona, 'helpersSent');
        }),
    },
  },

  helpersScopeView: {
    kind: 'inner',
    title: 'Anna Nowak',
    render: (state) => `
      <h2 class="service-title">W czym pomaga Anna</h2>
      ${scopeSummary(state)}
      <p class="footnote">Ważne do ${GUARDIAN_UNTIL}.</p>`,
  },

  helpersSent: {
    kind: 'inner',
    title: 'Pomoc bliskich',
    render: (state) =>
      state.guardian === 'active'
        ? `${successBlock('Anna może Ci pomagać', 'Niczego nie wyśle ani nie podpisze bez Ciebie.')}<button class="btn btn-primary" data-home>Gotowe</button>`
        : `${successBlock('Wysłaliśmy prośbę do Anny', 'Gdy ją przyjmie, dostaniesz powiadomienie.')}<button class="btn btn-primary" data-home>Gotowe</button>`,
  },

  helpersInvite: {
    kind: 'inner',
    title: 'Prośba o pomoc',
    render: (state) => {
      if (state.guardian === 'active') {
        return `${successBlock('Pomagasz mamie', 'Przełącz się na „Mama” na ekranie Dokumenty, żeby zobaczyć jej pisma.')}<button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.guardian !== 'pending') return infoBox('Ta prośba nie jest już aktualna.');
      return `
        <h2 class="service-title">Mama prosi Cię o pomoc</h2>
        <p class="service-desc">Krystyna Nowak chce, żebyś pomagała jej w sprawach urzędowych do ${GUARDIAN_UNTIL}.</p>
        ${scopeSummary(state)}
        ${infoBox('Mama dostanie powiadomienie po każdym Twoim działaniu. Może odwołać pomoc w każdej chwili.')}
        <button class="btn btn-primary" data-action="accept">Przyjmuję</button>`;
    },
    actions: {
      accept: (el, persona) =>
        withBiometric(persona, () => {
          patch({ guardian: 'active' });
          addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przyjęła prośbę i może Ci pomagać' });
          notify('krystyna', {
            title: 'Anna może Ci teraz pomagać',
            body: 'Niczego nie wyśle ani nie podpisze bez Ciebie.',
          });
        }),
    },
  },

  // ---------- 1b: papierowe pismo ----------

  letters: {
    kind: 'inner',
    title: 'Moje pisma',
    speech: (state) =>
      state.letter === 'none'
        ? 'Moje pisma. Dostałaś papierowe pismo? Dotknij przycisku Sfotografuj papierowe pismo, a wyjaśnię Ci, o co w nim chodzi.'
        : null,
    render: (state) => {
      const letterRow =
        state.letter === 'none'
          ? infoBox('Nie masz nowych pism w aplikacji.')
          : list([
              row({
                iconName: 'letter',
                title: `Pismo — ${escapeHtml(officeName(state))}`,
                desc: letterStatusForKrystyna(state),
                go: state.letter === 'awaiting' ? 'replyReview' : 'letterExplained',
              }),
            ]);
      return `
        ${letterRow}
        <button class="btn btn-primary btn-camera" data-go="camera">${icon('camera', { size: 22 })} Sfotografuj papierowe pismo ${newBadge()}</button>`;
    },
  },

  camera: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Zrób zdjęcie pisma',
    render: () => `
      <div class="viewfinder">
        ${paperHtml({ compact: true })}
        <span class="viewfinder-frame" aria-hidden="true"></span>
      </div>
      <p class="footnote center">Połóż pismo na stole i zmieść całą kartkę w ramce.</p>
      <button class="shutter" data-action="shoot" aria-label="Zrób zdjęcie przykładowego pisma"><span></span></button>
      <label class="btn btn-secondary">
        <input type="file" accept="image/*" capture="environment" data-photo hidden>
        ${icon('camera', { size: 20 })} Zdjęcie własnego pisma
      </label>
      <p class="footnote center">Przycisk na środku robi zdjęcie przykładowego pisma. Własne pismo odczytamy w telefonie — zdjęcie nigdzie nie jest wysyłane.</p>`,
    actions: {
      shoot: (el, persona) => {
        photoUrl = null;
        readLetter(persona, async () => sampleLetterText());
      },
    },
  },

  letterExplained: {
    kind: 'inner',
    title: 'Pismo z urzędu',
    speech: (state) => explanationSpeech(currentExplanation(state)),
    render: (state) => {
      if (state.letter === 'reading') return thinking('Czytam pismo…');
      return `
        <p class="letter-from">${icon('letter', { size: 18 })} ${escapeHtml(officeName(state))}</p>
        ${explanationBlocks(state)}
        ${letterActionsForKrystyna(state)}`;
    },
    actions: {
      remind: () => notify('krystyna', { title: 'Przypomnienie ustawione', body: `Przypomnimy Ci 3 dni przed terminem (${deadlineText(store.get())}).` }),
      requestHelp: () => {
        const state = store.get();
        patch({ letter: 'requested' });
        addHistory({ persona: 'krystyna', text: 'Poprosiłaś Annę o pomoc z pismem z urzędu' });
        notify('anna', {
          title: 'Mama prosi o pomoc z pismem',
          body: `${officeName(state)}. ${deadlineText(state)}.`,
          action: { label: 'Otwórz', go: 'mamaLetter' },
        });
      },
    },
  },

  // ---------- 1c: odpowiedź i podpis ----------

  replyReview: {
    kind: 'inner',
    title: 'Odpowiedź do urzędu',
    speech: (state) => `Anna przygotowała odpowiedź do urzędu. Oto ona. ${state.reply.replace(/\n+/g, ' ')}`,
    render: (state) => {
      if (state.letter === 'signed') return `${successBlock('Wysłane', 'Urząd otrzymał Twoją odpowiedź.')}<button class="btn btn-primary" data-home>Gotowe</button>`;
      return `
        <h2 class="service-title">Anna przygotowała odpowiedź</h2>
        <p class="service-desc">Przeczytaj ją albo posłuchaj. Wyślesz ją tylko Ty.</p>
        <button class="btn btn-secondary" data-speak>${icon('speaker', { size: 20 })} Przeczytaj mi na głos</button>
        <div class="reply-paper">${escapeHtml(state.reply)}</div>
        <button class="btn btn-primary" data-go="signPin">Zgadzam się, podpisz i wyślij</button>
        <button class="btn btn-secondary" data-go="callContact">Mam pytanie — zadzwoń do Anny</button>`;
    },
  },

  signPin: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Podpis',
    render: (state) => `
      <div class="pin-head">
        <h2 class="service-title">Wpisz PIN podpisu ${newBadge()}</h2>
        <p class="service-desc">Bez przykładania dowodu do telefonu. Ten PIN znasz tylko Ty.</p>
      </div>
      <div class="pin-dots" aria-label="Wpisano ${state.pin.length} z 4 cyfr">
        ${[0, 1, 2, 3].map((i) => `<span class="${i < state.pin.length ? 'on' : ''}"></span>`).join('')}
      </div>
      <div class="keypad">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
          .map((k) => (k ? `<button data-action="key" data-id="${k}" aria-label="${k === '⌫' ? 'Usuń' : k}">${k}</button>` : '<span></span>'))
          .join('')}
      </div>
      <p class="footnote center">W prototypie wpisz dowolne 4 cyfry.</p>`,
    actions: {
      key: (el, persona) => {
        const k = el.dataset.id;
        const pin = k === '⌫' ? store.get().pin.slice(0, -1) : (store.get().pin + k).slice(0, 4);
        patch({ pin });
        if (pin.length === 4) {
          setTimeout(() => {
            patch({ letter: 'signed', pin: '' });
            addHistory({ persona: 'krystyna', text: 'Podpisałaś i wysłałaś odpowiedź przygotowaną przez Annę' });
            notify('anna', { title: 'Mama podpisała i wysłała ✓', body: `Odpowiedź trafiła do: ${officeName(store.get())}.` });
            replace(persona, 'signDone');
          }, 350);
        }
      },
    },
  },

  signDone: {
    kind: 'inner',
    title: 'Wysłane',
    speech: () => 'Gotowe. Twoja odpowiedź trafiła do urzędu. Potwierdzenie znajdziesz w skrzynce.',
    render: (state) => `
      ${successBlock('Wysłane', `Odpowiedź trafiła do: ${escapeHtml(officeName(state))}. Potwierdzenie znajdziesz w Skrzynce.`)}
      ${list([
        row({ iconName: 'people', tint: 'green', title: 'Anna przygotowała', trailing: '' }),
        row({ iconName: 'signature', tint: 'blue', title: 'Ty podpisałaś i wysłałaś', desc: nowLabel(), trailing: '' }),
      ])}
      <button class="btn btn-primary" data-home>Gotowe</button>`,
  },

  // Telefon Anny: pismo mamy
  mamaLetter: {
    kind: 'inner',
    title: 'Pismo mamy',
    onEnter: (state) => {
      if (state.actingAs !== 'mama' && state.guardian === 'active') patch({ actingAs: 'mama' });
      if (state.letter === 'requested') {
        patch({ letter: 'opened' });
        addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przeczytała pismo z urzędu' });
        notify('krystyna', { title: 'Anna otworzyła Twoje pismo', body: `${officeName(state)}.` });
      }
    },
    render: (state) => {
      if (state.guardian !== 'active') return infoBox('Mama nie dała Ci jeszcze pozwolenia na pomoc.');
      if (!letterAtLeast(state, 'requested')) return infoBox('Mama nie prosiła jeszcze o pomoc z żadnym pismem.');
      return `
        <p class="letter-from">${icon('letter', { size: 18 })} ${escapeHtml(officeName(state))}</p>
        <details class="paper-details"><summary>Zobacz zdjęcie pisma</summary>${letterPhoto(state)}</details>
        ${explanationBlocks(state)}
        ${replySectionForAnna(state)}`;
    },
    actions: {
      remind: () => notify('anna', { title: 'Przypomnienie ustawione', body: `Przypomnimy Ci i mamie przed terminem (${deadlineText(store.get())}).` }),
      draft: () => {
        const state = store.get();
        patch({ letter: 'drafting' });
        draftReply({ letterText: state.letterText, recipient, facts: state.replyFacts, isSample: state.usedSample }).then(({ reply, source }) => {
          if (store.get().letter !== 'drafting') return;
          store.update((s) => {
            s.letter = 'drafted';
            s.reply = reply;
            s.aiSource.draft = source;
            return s;
          });
        });
      },
      sendToMama: (el, persona) => {
        const text = document.querySelector(`[data-persona="${persona}"] [data-draft]`)?.value ?? store.get().reply;
        patch({ letter: 'awaiting', reply: text });
        addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przygotowała odpowiedź do urzędu' });
        notify('krystyna', {
          title: 'Anna przygotowała odpowiedź',
          body: 'Przeczytać Ci?',
          action: { label: 'Przeczytaj', go: 'replyReview' },
        });
      },
    },
  },
};

function letterStatusForKrystyna(state) {
  switch (state.letter) {
    case 'reading':
    case 'explained':
      return deadlineText(state);
    case 'requested':
      return 'Poprosiłaś Annę o pomoc';
    case 'opened':
    case 'drafting':
    case 'drafted':
      return 'Anna przygotowuje odpowiedź';
    case 'awaiting':
      return 'Anna przygotowała odpowiedź — przeczytaj ją';
    case 'signed':
      return 'Wysłane ✓';
    default:
      return '';
  }
}

function letterActionsForKrystyna(state) {
  if (letterAtLeast(state, 'requested')) {
    return `
      ${infoBox(`<strong>${letterStatusForKrystyna(state)}.</strong> Dostaniesz powiadomienie, gdy odpowiedź będzie gotowa.`)}
      ${state.letter === 'awaiting' ? '<button class="btn btn-primary" data-go="replyReview">Przeczytaj odpowiedź</button>' : ''}`;
  }
  const askAnna =
    state.guardian === 'active'
      ? '<button class="btn btn-primary" data-action="requestHelp">Poproś Annę o pomoc</button>'
      : `${infoBox('Chcesz, żeby pomogła Ci Anna? Najpierw daj jej pozwolenie w usłudze Pomoc bliskich.')}<button class="btn btn-secondary" data-go="helpers">Pomoc bliskich</button>`;
  return `
    ${askAnna}
    <button class="btn btn-secondary" data-go="assistant">Załatw to ze mną</button>`;
}

function replySectionForAnna(state) {
  switch (state.letter) {
    case 'requested':
    case 'opened':
      return `
        ${sectionTitle('Co mama chce wyjaśnić?')}
        <textarea class="facts" data-facts data-keep-focus aria-label="Co mama chce wyjaśnić">${escapeHtml(state.replyFacts)}</textarea>
        <p class="footnote">Asystent użyje tylko tego, co tu wpiszesz, i treści pisma. Niczego nie wymyśli.</p>
        <button class="btn btn-primary" data-action="draft">${icon('assistant', { size: 20 })} Przygotuj odpowiedź z asystentem</button>`;
    case 'drafting':
      return thinking('Asystent przygotowuje szkic odpowiedzi…');
    case 'drafted':
      return `
        ${sectionTitle('Szkic odpowiedzi')}
        <textarea class="draft" data-draft data-keep-focus aria-label="Szkic odpowiedzi">${escapeHtml(state.reply)}</textarea>
        <p class="ai-source">${icon('assistant', { size: 16 })} ${sourceNote('draft', state.aiSource.draft)}</p>
        ${infoBox('Sprawdź i popraw. Mama zobaczy odpowiedź i sama zdecyduje, czy ją wysłać.')}
        <button class="btn btn-primary" data-action="sendToMama">Wyślij mamie do zatwierdzenia</button>`;
    case 'awaiting':
      return infoBox('<strong>Czeka na mamę.</strong> Bez jej podpisu odpowiedź nie trafi do urzędu.');
    case 'signed':
      return successBlock('Mama wysłała ✓', 'Ty przygotowałaś, mama podpisała i wysłała.');
    default:
      return '';
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nowLabel() {
  return new Date().toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

