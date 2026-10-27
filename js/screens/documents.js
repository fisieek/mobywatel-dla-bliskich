// Zakładka „Dokumenty” — ekran główny mObywatela.
// Zwykły tryb wygląda jak w aplikacji; nowe są: tryb prosty i przełącznik „Działam jako”.
import { store, notify } from '../store.js';
import { people, actingAsOptions } from '../personas.js';
import { docStack, list, row, newBadge, sectionTitle, infoBox } from '../ui.js';
import { protectionStatus } from '../scenes/protect.js';

function setActingAs(id) {
  store.update((s) => {
    s.actingAs = id;
    return s;
  });
}

function actingAsSwitcher(state) {
  const chip = (id) => {
    const disabled = id === 'mama' && state.guardian !== 'active';
    const selected = state.actingAs === id;
    return `
      <button class="segment ${selected ? 'segment-selected' : ''}" data-action="actAs" data-id="${id}"
        aria-pressed="${selected}" ${disabled ? 'disabled title="Mama jeszcze nie dała Ci pozwolenia na pomoc"' : ''}>
        ${actingAsOptions[id].short}
      </button>`;
  };
  return `
    <div class="acting-as">
      <p class="acting-as-label">Działam jako ${newBadge()}</p>
      <div class="segmented" role="group" aria-label="Działam jako">${chip('ja')}${chip('mama')}${chip('antek')}</div>
      ${state.guardian === 'active' ? '' : '<p class="hint">Mama pojawi się tu, gdy da Ci pozwolenie na pomoc.</p>'}
    </div>`;
}

function mamaLettersStatus(state) {
  if (['requested', 'opened'].includes(state.letter)) return 'Mama prosi o pomoc z 1 pismem';
  if (['drafting', 'drafted'].includes(state.letter)) return 'Przygotowujesz odpowiedź';
  if (state.letter === 'awaiting') return 'Czeka na podpis mamy';
  if (state.letter === 'signed') return 'Wysłane ✓';
  return 'Brak pism, przy których mama prosi o pomoc';
}

function annaContent(state) {
  if (state.actingAs === 'mama') {
    return `
      ${list([row({ iconName: 'letter', title: 'Pisma mamy', desc: mamaLettersStatus(state), go: 'mamaLetter', badge: newBadge() })])}
      ${sectionTitle('Dokumenty mamy')}
      ${docStack(people.krystyna.documents, 'Krystyna Nowak')}`;
  }
  if (state.actingAs === 'antek') {
    return infoBox(
      'Antek nie ma jeszcze dokumentów w aplikacji. Jako mama działasz w jego imieniu bez osobnego pełnomocnictwa: widzisz jego recepty, numer PESEL i sprawy.',
    );
  }
  const mamaRow = state.guardian === 'active'
    ? list([row({ iconName: 'people', tint: 'green', title: 'Mama — wszystko w porządku', desc: 'Brak nowych pism i terminów', action: 'actAs', id: 'mama' })])
    : '';
  return `
    ${mamaRow}
    ${docStack(people.anna.documents)}
    ${list([row({ iconName: 'eye', tint: 'violet', title: 'Moja historia', desc: 'Kto i kiedy widział Twoje dane', go: 'myData', badge: newBadge() })])}`;
}

function standardHome(persona, state) {
  const actingForSomeone = persona === 'anna' && state.actingAs !== 'ja';
  return `
    ${actingForSomeone ? '' : '<div class="title-links"><button class="link" data-go="customize">Dostosuj</button><button class="link" data-go="addDocument">Dodaj</button></div>'}
    ${persona === 'anna' ? actingAsSwitcher(state) : ''}
    ${persona === 'anna' ? annaContent(state) : docStack(people[persona].documents)}`;
}

function simpleStatus(persona, state) {
  const protection = persona === 'krystyna' ? protectionStatus(state) : null;
  if (protection) return protection;
  if (persona === 'krystyna' && state.letter === 'awaiting') {
    return { text: 'Anna przygotowała odpowiedź na Twoje pismo. Przeczytaj ją w „Moje pisma”.', tone: 'attention' };
  }
  return state.notifications[persona].length > 0
    ? { text: 'Masz nową wiadomość. Pomogę Ci ją przeczytać.', tone: 'attention' }
    : { text: 'Wszystko w porządku. Nic nie musisz dziś robić.', tone: 'ok' };
}

function simpleHome(persona, state) {
  const contact = people[persona].contact;
  const status = simpleStatus(persona, state);
  return `
    <p class="simple-status simple-status-${status.tone}" role="status">${status.text}</p>
    ${list([
      row({ iconName: 'letter', title: 'Moje pisma', go: 'letters' }),
      row({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', go: 'whoIsCalling' }),
      row({ iconName: 'eye', tint: 'green', title: 'Kto widział moje dane', go: 'myData' }),
      row({ iconName: 'call', tint: 'blue', title: `Zadzwoń do ${contact.label}`, go: 'callContact' }),
    ])}
    ${sectionTitle('Moje dokumenty')}
    ${docStack(people[persona].documents)}`;
}

export const documentsScreen = {
  kind: 'tab',
  title: (state, persona) =>
    state.simpleMode[persona] ? `Dzień dobry, ${people[persona].vocative}` : 'Dokumenty',
  titleBadge: (state, persona) => (state.simpleMode[persona] ? newBadge('Tryb prosty') : ''),
  speech: (state, persona) => {
    if (!state.simpleMode[persona]) return null;
    return `Dzień dobry, ${people[persona].vocative}. ${simpleStatus(persona, state).text} Możesz wybrać: Moje pisma, Ktoś do mnie dzwoni, Kto widział moje dane albo Zadzwoń do ${people[persona].contact.label}.`;
  },
  render: (state, persona) => (state.simpleMode[persona] ? simpleHome(persona, state) : standardHome(persona, state)),
  actions: {
    actAs: (el) => setActingAs(el.dataset.id),
  },
};

export const callContactScreen = {
  kind: 'inner',
  title: (state, persona) => `Dzwonię do ${people[persona].contact.label}`,
  onEnter: (state, persona) => {
    const me = people[persona];
    notify(me.contact.persona, {
      title: persona === 'krystyna' ? 'Mama dzwoni' : 'Anna dzwoni',
      body: `${me.firstName} ${me.lastName} dzwoni do Ciebie.`,
    });
  },
  render: (state, persona) => `
    <div class="calling">
      <div class="avatar avatar-large" aria-hidden="true">${people[persona].contact.name[0]}</div>
      <p class="calling-name">${people[persona].contact.name}</p>
      <p class="muted">Łączę…</p>
    </div>
    <button class="btn btn-danger" data-home>Rozłącz</button>`,
};
