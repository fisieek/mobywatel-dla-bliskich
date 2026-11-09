// Scena 1 · POMOC — „Pomóż mi, bez oddawania telefonu”.
// 1a: Krystyna daje Annie pozwolenie, Anna je przyjmuje.
// 1b: Krystyna fotografuje papierowe pismo, asystent wyjaśnia je po ludzku, Krystyna prosi Annę o pomoc.
// 1c: Anna przygotowuje odpowiedź, Krystyna podpisuje ją PIN-em podpisu.
import { store, replace, notify, patch, addHistory, withBiometric } from '../store.js';
import { icon } from '../icons.js';
import { speak } from '../speech.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';
import { contactName, contactCase, fullName } from '../personas.js';
import { explanation as sampleExplanation, explanationSpeech, paperHtml } from '../letter.js';
import { explainLetter, draftReply } from '../assistant.js';
import { mamaSummary, childrenSection } from './care.js';
import { shortDate, monthsFromToday } from '../dates.js';

// Pozwolenie jest ważne 12 miesięcy od dnia pokazu
export const GUARDIAN_UNTIL = shortDate(monthsFromToday(12));


// Jak kto kogo widzi w aplikacji („Anna Nowak, Córka”, „Mama”) i ta sama nazwa w odmianie
const annaFor = (state) => contactName(state, 'krystyna', 'anna'); // na telefonie Krystyny
const mamaFor = (state) => contactName(state, 'anna', 'krystyna'); // na telefonie Anny
const annaCase = (state, kase) => contactCase(state, 'krystyna', 'anna', kase);
const mamaCase = (state, kase) => contactCase(state, 'anna', 'krystyna', kase);

const currentExplanation = (state) => state.explanation ?? sampleExplanation;
const officeName = (state) => currentExplanation(state).from || 'urzędu';
const deadlineText = (state) => currentExplanation(state).when;
// „Do 20 listopada” w środku zdania: „(do 20 listopada)”
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

// title — jak widzi to Krystyna, forAnna — jak to samo czyta Anna
const scopeItems = [
  { key: 'letters', title: 'Widzi moje pisma i terminy', forAnna: 'Wgląd w jej pisma i terminy' },
  { key: 'replies', title: 'Przygotowuje odpowiedzi do urzędu', forAnna: 'Przygotowywanie odpowiedzi do urzędu' },
  { key: 'alerts', title: 'Dostaje ostrzeżenie, gdy ktoś podejrzany do mnie dzwoni', forAnna: 'Ostrzeżenie, gdy ktoś podejrzany do niej dzwoni' },
  { key: 'send', title: 'Wysyła i podpisuje w moim imieniu', forAnna: 'Wysyłanie i podpisywanie w jej imieniu', locked: 'Wysłać i podpisać możesz tylko Ty' },
  { key: 'health', title: 'Widzi moje dane zdrowotne', forAnna: 'Wgląd w jej dane zdrowotne' },
];

const LETTER_ORDER = ['none', 'reading', 'explained', 'requested', 'opened', 'drafting', 'drafted', 'awaiting', 'signed'];
const letterAtLeast = (state, status) => LETTER_ORDER.indexOf(state.letter) >= LETTER_ORDER.indexOf(status);

function toggle(on, locked) {
  return `<span class="toggle ${on ? 'toggle-on' : ''} ${locked ? 'toggle-locked' : ''}" aria-hidden="true"><span></span></span>`;
}

function scopeSummary(state, persona = 'krystyna') {
  return list(
    scopeItems.map((item) => {
      const on = state.guardianScope[item.key];
      return `
        <div class="row row-static">
          <span class="row-icon ${on ? 'tint-green' : 'tint-red'}">${icon(on ? 'check' : 'close', { size: 18 })}</span>
          <span class="row-text"><span class="row-title">${persona === 'anna' ? item.forAnna : item.title}</span></span>
        </div>`;
    }),
  );
}

function scopeSpeech(state) {
  const allowed = scopeItems.filter((i) => state.guardianScope[i.key]).map((i) => i.title.toLowerCase());
  return `${annaFor(store.get())}. Będzie mogła: ${allowed.join(', ')}. Niczego nie wyśle ani nie podpisze bez Ciebie. Pozwolenie jest ważne 12 miesięcy. Możesz je odwołać w każdej chwili jednym przyciskiem.`;
}

// Na telefonie prosta prośba o sprawdzenie. Że odpowiedzi są przykładowe, mówi panel obok telefonów (guide.js).
const SOURCE_NOTES = {
  explain: 'Wyjaśnienie przygotował Wirtualny asystent. Sprawdź je z treścią pisma.',
  draft: 'Szkic przygotował Wirtualny asystent. Sprawdź go przed wysłaniem.',
};

function explanationBlocks(state, persona) {
  const base = currentExplanation(state);
  // Anna nie jest stroną sprawy: czyta wersję bez „podałaś” i „musisz”
  const e = persona === 'anna' && base.forHelper ? { ...base, ...base.forHelper } : base;
  return `
    ${state.ownPhoto ? infoBox('W prototypie asystent wyjaśnia zawsze przykładowe pismo. Twojego zdjęcia nie odczytujemy ani nie zapisujemy.') : ''}
    <div class="ai-blocks">
      <div class="ai-block"><p class="ai-label">O co chodzi</p><p>${escapeHtml(e.what)}</p></div>
      <div class="ai-block"><p class="ai-label">${persona === 'anna' ? 'Co trzeba zrobić' : 'Co musisz zrobić'}</p><p>${escapeHtml(e.todo)}</p></div>
      <div class="ai-block ai-block-deadline">
        <p class="ai-label">Do kiedy</p><p class="ai-deadline">${escapeHtml(e.when)}</p>
        ${state.reminders[persona]
          ? `<span class="pill pill-done" role="status">${icon('check', { size: 16 })} Przypomnimy 3 dni przed terminem</span>`
          : '<button class="pill" data-action="remind">Przypomnij mi</button>'}
      </div>
      ${e.warning ? `<p class="ai-warning">${escapeHtml(e.warning)}</p>` : ''}
    </div>
    <p class="ai-source">${icon('assistant', { size: 16 })} ${SOURCE_NOTES.explain}</p>`;
}

// Odczyt pisma: asystent zawsze wyjaśnia przykładowe pismo, także gdy ktoś wybierze własne zdjęcie.
// Zdjęcia nie odczytujemy ani nie zapisujemy.
async function readLetter(persona, ownPhoto) {
  patch({ letter: 'reading', ownPhoto });
  replace(persona, 'letterExplained');
  const explained = await explainLetter();
  if (store.get().letter !== 'reading') return;
  patch({ letter: 'explained', explanation: explained });
  if (store.get().simpleMode.krystyna) speak(explanationSpeech(explained));
}

export function onPhotoSelected(persona, file) {
  if (file) readLetter(persona, true);
}

function setReminder(persona) {
  store.update((s) => {
    s.reminders[persona] = true;
    return s;
  });
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
  patch({ guardian: 'none' });
  const state = store.get();
  addHistory({ persona: 'krystyna', text: `Odwołałaś pomoc: ${annaFor(state)}` });
  notify('anna', { title: mamaFor(state), body: 'Odwołała Twoją pomoc. Nie widzisz już jej pism.' });
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
    title: annaFor(state),
    desc: state.guardian === 'pending' ? 'Czeka na przyjęcie prośby' : `Pomaga Ci do ${GUARDIAN_UNTIL}`,
    go: 'helpersScopeView',
  });
  return `
    ${sectionTitle('Kto Ci pomaga')}
    ${list([annaRow])}
    ${state.guardian === 'active' ? `<button class="btn btn-secondary btn-danger-text" data-action="revoke">Odwołaj pomoc: ${annaFor(state)}</button>` : ''}`;
}

function helpersForAnna(state) {
  const children = childrenSection(state);
  if (state.guardian === 'pending') {
    return `${sectionTitle('Prośby o pomoc')}${list([row({ iconName: 'people', tint: 'green', title: mamaFor(state), desc: 'Prosi Cię o pomoc w sprawach urzędowych', go: 'helpersInvite' })])}${children}`;
  }
  if (state.guardian === 'active') {
    const summary = mamaSummary(state);
    // Anna może zaproponować tryb prosty, ale włącza go tylko mama
    const offer = state.simpleMode.krystyna
      ? ''
      : `<button class="btn btn-secondary" data-action="offerSimple">Zaproponuj tryb prosty: ${mamaFor(state)}</button>`;
    return `${sectionTitle('Komu pomagasz')}${list([row({ iconName: 'people', tint: summary.tint, title: mamaFor(state), desc: summary.desc, go: 'care-krystyna' })])}${offer}${children}`;
  }
  return `${infoBox('Nikt nie poprosił Cię jeszcze o pomoc. Gdy bliska osoba da Ci pozwolenie, zobaczysz to tutaj.')}${children}`;
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
        desc:
          persona === 'krystyna'
            ? 'Pozwól zaufanej osobie widzieć Twoje pisma i przygotowywać odpowiedzi. Ty decydujesz, w czym pomaga i do kiedy.'
            : 'Sprawy osób, którym pomagasz, i Twoich dzieci w jednym miejscu. Działasz pod własnym imieniem, a każdy krok jest w historii.',
        badge: newBadge(),
      })}
      ${persona === 'krystyna' ? helpersForKrystyna(state) : helpersForAnna(state)}`,
    actions: {
      revoke: () => revokeGuardian(),
      offerSimple: () => {
        patch({ simpleOffered: true });
        notify('krystyna', {
          title: annaFor(store.get()),
          body: 'Proponuje Ci tryb prosty: większe litery, mniej przycisków, czytanie na głos.',
          action: { label: 'Zobacz', go: 'simpleOffer' },
        });
        notify('anna', { title: 'Propozycja wysłana', body: `Tryb prosty włączy tylko: ${mamaFor(store.get())}.` });
      },
    },
  },

  helpersChoose: {
    kind: 'inner',
    title: 'Kto ma Ci pomagać?',
    render: () => `
      <p class="service-desc">Osoby z Twojej rodziny według rejestru stanu cywilnego. Nie musisz wpisywać numeru PESEL.</p>
      ${list([
        row({ iconName: 'people', tint: 'green', title: fullName('anna'), desc: 'Córka', go: 'helpersScope' }),
        row({ iconName: 'people', tint: 'blue', title: 'Inna osoba', desc: 'Podaj jej numer PESEL', go: 'helpersOther' }),
      ])}`,
  },

  helpersOther: {
    kind: 'inner',
    title: 'Inna osoba',
    render: () => `
      ${infoBox('W prototypie pokazujemy pomoc córki. Osobę spoza rodziny dodasz tak samo: po numerze PESEL, z tym samym wyborem zakresu i terminu.')}
      <button class="btn btn-primary" data-back>Wróć</button>`,
  },

  helpersScope: {
    kind: 'inner',
    title: 'Zakres pomocy',
    hideReadAloud: true,
    speech: (state) => scopeSpeech(state),
    render: (state) => `
      <h2 class="service-title">${annaFor(state)}</h2>
      <p class="service-desc">W czym może Ci pomagać?</p>
      ${list(
        scopeItems.map((item) =>
          row({
            title: item.title,
            desc: item.locked ?? '',
            action: item.locked ? undefined : 'toggleScope',
            id: item.key,
            trailing: toggle(state.guardianScope[item.key], Boolean(item.locked)),
            // Czytnik ekranu słyszy „przełącznik, włączony / wyłączony”; zablokowany jest niedostępny
            attrs: `role="switch" aria-checked="${Boolean(state.guardianScope[item.key])}"${item.locked ? ' aria-disabled="true"' : ''}`,
          }),
        ),
      )}
      ${list([row({ iconName: 'history', title: 'Ważne 12 miesięcy', desc: `Do ${GUARDIAN_UNTIL}. Możesz to odwołać w każdej chwili, jednym przyciskiem.`, trailing: '' })])}
      ${infoBox('Po każdym jej działaniu dostaniesz powiadomienie. Wszystko zobaczysz też w historii.')}
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
          patch({ guardian: 'pending', guardianDeclined: false });
          const state = store.get();
          addHistory({ persona: 'krystyna', text: `Poprosiłaś o pomoc w sprawach urzędowych: ${annaFor(state)}` });
          notify('anna', {
            title: mamaFor(state),
            body: 'Prosi Cię o pomoc w sprawach urzędowych.',
            action: { label: 'Zobacz', go: 'helpersInvite' },
          });
          replace(persona, 'helpersSent');
        }),
    },
  },

  helpersScopeView: {
    kind: 'inner',
    title: (state) => annaFor(state),
    render: (state) => `
      <h2 class="service-title">W czym Ci pomaga</h2>
      ${scopeSummary(state)}
      <p class="footnote">Ważne do ${GUARDIAN_UNTIL}.</p>`,
  },

  helpersSent: {
    kind: 'inner',
    title: 'Pomoc bliskich',
    render: (state) =>
      state.guardian === 'active'
        ? `${successBlock(annaFor(state), 'Może Ci teraz pomagać. Niczego nie wyśle ani nie podpisze bez Ciebie.')}<button class="btn btn-primary" data-home>Gotowe</button>`
        : `${successBlock('Prośba wysłana', `Do: ${annaFor(state)}. Gdy ją przyjmie, dostaniesz powiadomienie.`)}<button class="btn btn-primary" data-home>Gotowe</button>`,
  },

  helpersInvite: {
    kind: 'inner',
    title: 'Prośba o pomoc',
    render: (state) => {
      if (state.guardian === 'active') {
        return `${successBlock(`Pomagasz: ${mamaFor(state)}`, `Sprawy ${mamaCase(state, 'gen')} znajdziesz w Usługach → „Pomoc bliskich”. Gdy poprosi Cię o pomoc z pismem, dostaniesz powiadomienie.`)}<button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.guardianDeclined) return infoBox(`Prośba odrzucona. Informację dostała: ${mamaFor(state)}.`);
      if (state.guardian !== 'pending') return infoBox('Ta prośba nie jest już aktualna.');
      return `
        <h2 class="service-title">${mamaFor(state)}</h2>
        <p class="service-desc">Prosi Cię o pomoc w sprawach urzędowych do ${GUARDIAN_UNTIL}.</p>
        ${scopeSummary(state, 'anna')}
        ${infoBox(`Po każdym Twoim działaniu ${mamaFor(state)} dostanie powiadomienie. Może odwołać pomoc w każdej chwili, a Ty możesz z niej zrezygnować.`)}
        <button class="btn btn-primary" data-action="accept">Przyjmuję</button>
        <button class="btn btn-secondary" data-action="decline">Odrzuć</button>`;
    },
    actions: {
      decline: () => {
        patch({ guardian: 'none', guardianDeclined: true });
        addHistory({ persona: 'krystyna', actor: 'anna', text: 'Odrzuciła prośbę o pomoc' });
        notify('krystyna', { title: annaFor(store.get()), body: 'Nie przyjęła prośby o pomoc. Możesz poprosić kogoś innego.' });
      },
      accept: (el, persona) =>
        withBiometric(persona, () => {
          patch({ guardian: 'active' });
          addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przyjęła prośbę i może Ci pomagać' });
          notify('krystyna', {
            title: annaFor(store.get()),
            body: 'Może Ci teraz pomagać. Niczego nie wyśle ani nie podpisze bez Ciebie.',
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
      ${infoBox('Przycisk na środku robi zdjęcie przykładowego pisma. Możesz też wybrać zdjęcie własnego, ale w prototypie asystent i tak wyjaśni przykładowe pismo. Twojego zdjęcia nie odczytujemy ani nie zapisujemy.')}
      <label class="btn btn-secondary">
        <input type="file" accept="image/*" capture="environment" data-photo hidden>
        ${icon('camera', { size: 20 })} Zdjęcie własnego pisma
      </label>`,
    actions: {
      shoot: (el, persona) => {
        readLetter(persona, false);
      },
    },
  },

  letterExplained: {
    kind: 'inner',
    title: 'Pismo z urzędu',
    speech: (state) => explanationSpeech(currentExplanation(state)),
    render: (state, persona) => {
      if (state.letter === 'reading') return thinking('Czytam pismo…');
      return `
        <p class="letter-from">${icon('letter', { size: 18 })} ${escapeHtml(officeName(state))}</p>
        ${explanationBlocks(state, persona)}
        ${letterActionsForKrystyna(state)}`;
    },
    actions: {
      remind: () => {
        const state = store.get();
        setReminder('krystyna');
        notify('krystyna', { title: 'Przypomnienie ustawione', body: `Przypomnimy Ci 3 dni przed terminem (${lowerFirst(deadlineText(state))}).` });
        // Bliska osoba, która widzi pisma i terminy, też dostaje przypomnienie — i widzi je przy piśmie
        if (state.guardian === 'active' && state.guardianScope.letters) {
          setReminder('anna');
          notify('anna', { title: mamaFor(state), body: `Ustawiła przypomnienie o terminie pisma (${lowerFirst(deadlineText(state))}). Przypomnimy też Tobie.` });
        }
      },
      requestHelp: () => {
        const state = store.get();
        patch({ letter: 'requested' });
        addHistory({ persona: 'krystyna', text: `Poprosiłaś o pomoc z pismem z urzędu: ${annaFor(state)}` });
        notify('anna', {
          title: mamaFor(state),
          body: `Prosi o pomoc z pismem: ${officeName(state)}. ${deadlineText(state)}.`,
          action: { label: 'Otwórz', go: 'mamaLetter' },
        });
      },
    },
  },

  // ---------- 1c: odpowiedź i podpis ----------

  replyReview: {
    kind: 'inner',
    title: 'Odpowiedź do urzędu',
    hideReadAloud: true,
    speech: (state) => `Odpowiedź do urzędu przygotowała: ${annaFor(state)}. Oto ona. ${state.reply.replace(/\n+/g, ' ')}`,
    render: (state) => {
      if (state.letter === 'signed') return `${successBlock('Wysłane', 'Urząd otrzymał Twoją odpowiedź.')}<button class="btn btn-primary" data-home>Gotowe</button>`;
      return `
        <h2 class="service-title">Odpowiedź jest gotowa</h2>
        <p class="service-desc">Przygotowała: ${annaFor(state)}. Przeczytaj ją albo posłuchaj. Wyślesz ją tylko Ty.</p>
        <button class="btn btn-secondary" data-speak>${icon('speaker', { size: 20 })} Przeczytaj mi na głos</button>
        <div class="reply-paper">${escapeHtml(state.reply)}</div>
        <button class="btn btn-primary" data-go="signPin">Zgadzam się, podpisz i wyślij</button>
        <button class="btn btn-secondary" data-go="callContact">Mam pytanie — zadzwoń do ${annaCase(state, 'gen')}</button>`;
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
            addHistory({ persona: 'krystyna', text: 'Podpisałaś i wysłałaś odpowiedź do urzędu' });
            notify('anna', { title: mamaFor(store.get()), body: `Podpisała i wysłała odpowiedź ✓ Odbiorca: ${officeName(store.get())}.` });
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
      ${successBlock('Wysłane', `Odbiorca: ${escapeHtml(officeName(state))}. Potwierdzenie zobaczysz przy piśmie w „Moje pisma” i w historii.`)}
      ${list([
        row({ iconName: 'people', tint: 'green', title: annaFor(state), desc: 'Przygotowała odpowiedź', trailing: '' }),
        row({ iconName: 'signature', tint: 'blue', title: 'Ty podpisałaś i wysłałaś', desc: nowLabel(), trailing: '' }),
      ])}
      <button class="btn btn-primary" data-home>Gotowe</button>`,
  },

  // Telefon Anny: pismo mamy
  mamaLetter: {
    kind: 'inner',
    title: 'Pismo z urzędu',
    helping: 'krystyna',
    onEnter: (state) => {
      if (state.letter === 'requested') {
        patch({ letter: 'opened' });
        addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przeczytała pismo z urzędu' });
        notify('krystyna', { title: annaFor(state), body: `Otworzyła Twoje pismo: ${officeName(state)}.` });
      }
    },
    render: (state, persona) => {
      if (state.guardian !== 'active') return infoBox(`${mamaFor(state)}: brak pozwolenia na pomoc.`);
      if (!letterAtLeast(state, 'requested')) return infoBox(`${mamaFor(state)}: brak pism, przy których prosi o pomoc.`);
      return `
        <p class="letter-from">${icon('letter', { size: 18 })} ${escapeHtml(officeName(state))}</p>
        <details class="paper-details"><summary>Zobacz zdjęcie pisma</summary>${paperHtml({ compact: true })}</details>
        ${explanationBlocks(state, persona)}
        ${replySectionForAnna(state)}`;
    },
    actions: {
      remind: () => {
        setReminder('anna');
        notify('anna', { title: 'Przypomnienie ustawione', body: `Przed terminem (${lowerFirst(deadlineText(store.get()))}) przypomnimy Tobie i ${mamaCase(store.get(), 'dat')}.` });
      },
      draft: () => {
        patch({ letter: 'drafting' });
        draftReply().then((reply) => {
          if (store.get().letter === 'drafting') patch({ letter: 'drafted', reply });
        });
      },
      sendToMama: (el, persona) => {
        const text = document.querySelector(`[data-persona="${persona}"] [data-draft]`)?.value ?? store.get().reply;
        patch({ letter: 'awaiting', reply: text });
        addHistory({ persona: 'krystyna', actor: 'anna', text: 'Przygotowała odpowiedź do urzędu' });
        notify('krystyna', {
          title: annaFor(store.get()),
          body: 'Przygotowała odpowiedź do urzędu. Przeczytać Ci?',
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
      return `Poprosiłaś o pomoc: ${annaFor(state)}`;
    case 'opened':
    case 'drafting':
    case 'drafted':
      return `Odpowiedź przygotowuje: ${annaFor(state)}`;
    case 'awaiting':
      return 'Odpowiedź jest gotowa — przeczytaj ją';
    case 'signed':
      return 'Wysłane ✓';
    default:
      return '';
  }
}

function letterActionsForKrystyna(state) {
  if (state.letter === 'awaiting') {
    return `
      ${infoBox(`<strong>Odpowiedź jest gotowa.</strong> Przygotowała: ${annaFor(state)}. Wyślesz ją tylko Ty.`)}
      <button class="btn btn-primary" data-go="replyReview">Przeczytaj odpowiedź</button>`;
  }
  if (state.letter === 'signed') return infoBox('<strong>Wysłane ✓</strong> Urząd ma Twoją odpowiedź. Wpis znajdziesz też w historii.');
  if (letterAtLeast(state, 'requested')) {
    return infoBox(`<strong>${letterStatusForKrystyna(state)}.</strong> Dostaniesz powiadomienie, gdy odpowiedź będzie gotowa.`);
  }
  const askAnna =
    state.guardian === 'active'
      ? `<button class="btn btn-primary" data-action="requestHelp">Poproś o pomoc: ${annaFor(state)}</button>`
      : `${infoBox('Chcesz, żeby pomogła Ci bliska osoba? Najpierw daj jej pozwolenie w usłudze Pomoc bliskich.')}<button class="btn btn-secondary" data-go="helpers">Pomoc bliskich</button>`;
  return askAnna;
}

function replySectionForAnna(state) {
  switch (state.letter) {
    case 'requested':
    case 'opened':
      return `
        ${sectionTitle('Co trzeba wyjaśnić w odpowiedzi?')}
        <textarea class="facts" data-facts data-keep-focus aria-label="Co trzeba wyjaśnić w odpowiedzi">${escapeHtml(state.replyFacts)}</textarea>
        <p class="footnote">W prototypie szkic jest przykładowy i nie zmienia się po wpisaniu innych faktów. Poprawisz go w następnym kroku.</p>
        <button class="btn btn-primary" data-action="draft">${icon('assistant', { size: 20 })} Przygotuj odpowiedź z asystentem</button>`;
    case 'drafting':
      return thinking('Asystent przygotowuje szkic odpowiedzi…');
    case 'drafted':
      return `
        ${sectionTitle('Szkic odpowiedzi')}
        <textarea class="draft" data-draft data-keep-focus aria-label="Szkic odpowiedzi">${escapeHtml(state.reply)}</textarea>
        <p class="ai-source">${icon('assistant', { size: 16 })} ${SOURCE_NOTES.draft}</p>
        ${infoBox(`Sprawdź i popraw. Zanim cokolwiek trafi do urzędu, odpowiedź przeczyta i zatwierdzi: ${mamaFor(state)}.`)}
        <button class="btn btn-primary" data-action="sendToMama">Wyślij do zatwierdzenia: ${mamaFor(state)}</button>`;
    case 'awaiting':
      return infoBox(`<strong>Czeka na podpis: ${mamaFor(state)}.</strong> Bez podpisu odpowiedź nie trafi do urzędu.`);
    case 'signed':
      return successBlock('Wysłane ✓', `Ty przygotowałaś odpowiedź. Podpisała i wysłała: ${mamaFor(state)}.`);
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

