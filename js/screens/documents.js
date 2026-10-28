// Zakładka „Dokumenty” — ekran główny mObywatela.
// Zwykły tryb wygląda jak w aplikacji; nowe są: tryb prosty i przełącznik „Działam jako”.
import { store, notify } from '../store.js';
import { people, contactName, fullName, actingAsLabel } from '../personas.js';
import { docStack, list, row, newBadge, sectionTitle, infoBox } from '../ui.js';
import { protectionStatus, blockedStatus, blockedToday } from '../scenes/protect.js';
import { clock } from '../dates.js';

// Imiona bez odmiany: „Anna Nowak, Córka” albo nadana nazwa, np. „Mama”
const mamaFor = (state) => contactName(state, 'anna', 'krystyna');
const contactFor = (state, persona) => contactName(state, persona, people[persona].contact);

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
        aria-pressed="${selected}" ${disabled ? `disabled title="${mamaFor(state)}: brak pozwolenia na pomoc"` : ''}>
        ${actingAsLabel(state, id)}
      </button>`;
  };
  return `
    <div class="acting-as">
      <p class="acting-as-label">Działam jako ${newBadge()}</p>
      <div class="segmented" role="group" aria-label="Działam jako">${chip('ja')}${chip('mama')}${chip('antek')}</div>
      ${state.guardian === 'active' ? '' : `<p class="hint">„${mamaFor(state)}” pojawi się tu po udzieleniu pozwolenia na pomoc.</p>`}
    </div>`;
}

function mamaLettersStatus(state) {
  if (['requested', 'opened'].includes(state.letter)) return 'Prośba o pomoc z 1 pismem';
  if (['drafting', 'drafted'].includes(state.letter)) return 'Przygotowujesz odpowiedź';
  if (state.letter === 'awaiting') return 'Czeka na podpis';
  if (state.letter === 'signed') return 'Wysłane ✓';
  return 'Brak pism, przy których prosi o pomoc';
}

// Wiersz mamy na ekranie Anny mówi, co się dziś wydarzyło — nie zawsze „wszystko w porządku”
function mamaSummary(state) {
  if (state.protection.push === 'pending') return { desc: 'Teraz: ktoś próbuje zalogować się na to konto', tint: 'red' };
  if (blockedToday(state)) return { desc: `Dziś ${clock(state.protection.blockedAt)} · zablokowana próba logowania`, tint: 'red' };
  if (['requested', 'opened'].includes(state.letter)) return { desc: 'Prosi o pomoc z pismem z urzędu', tint: 'amber' };
  if (state.letter === 'awaiting') return { desc: 'Odpowiedź czeka na podpis', tint: 'amber' };
  if (state.letter === 'signed') return { desc: 'Odpowiedź do urzędu wysłana ✓', tint: 'green' };
  return { desc: 'Wszystko w porządku · brak nowych pism i terminów', tint: 'green' };
}

function annaContent(state) {
  if (state.actingAs === 'mama') {
    return `
      ${list([row({ iconName: 'letter', title: 'Pisma', desc: mamaLettersStatus(state), go: 'mamaLetter', badge: newBadge() })])}
      ${sectionTitle('Dokumenty')}
      ${docStack(people.krystyna.documents, 'Krystyna Nowak')}`;
  }
  if (state.actingAs === 'antek') {
    return infoBox(
      `${actingAsLabel(state, 'antek')}: brak dokumentów w aplikacji. Jako rodzic działasz w imieniu dziecka bez osobnego pełnomocnictwa: widzisz jego recepty, numer PESEL i sprawy.`,
    );
  }
  const summary = mamaSummary(state);
  const mamaRow = state.guardian === 'active'
    ? list([row({ iconName: 'people', tint: summary.tint, title: mamaFor(state), desc: summary.desc, action: 'actAs', id: 'mama' })])
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
    return {
      text: `Odpowiedź na Twoje pismo jest gotowa. Przygotowała: ${contactFor(state, persona)}.`,
      tone: 'attention',
      go: 'replyReview',
      cta: 'Przeczytaj odpowiedź',
    };
  }
  const blocked = persona === 'krystyna' ? blockedStatus(state) : null;
  if (blocked) return blocked;
  const unread = state.notificationLog[persona].filter((n) => n.unread).length;
  if (unread) return { text: `Masz nowe powiadomienia: ${unread}.`, tone: 'attention', go: 'notifications', cta: 'Przeczytaj' };
  return { text: 'Wszystko w porządku. Nic nie musisz dziś robić.', tone: 'ok' };
}

// Karta stanu: gdy jest coś do zrobienia, cała karta jest przyciskiem do tej jednej czynności
function statusCard(status) {
  if (!status.go) return `<p class="simple-status simple-status-${status.tone}" role="status">${status.text}</p>`;
  return `
    <button class="simple-status simple-status-${status.tone} simple-status-tap" data-go="${status.go}">
      <span>${status.text}</span>
      <span class="simple-status-cta">${status.cta}</span>
    </button>`;
}

// Ekran główny trybu prostego: jedna karta stanu i duże wiersze. Wszystko, co było w zakładkach
// i ikonach nagłówka, jest tu jako wiersz z podpisem.
function simpleRows(persona, state) {
  const unread = state.notificationLog[persona].filter((n) => n.unread).length;
  return [
    persona === 'krystyna' && state.guardian === 'none'
      ? row({ iconName: 'people', tint: 'green', title: 'Pozwól bliskiej osobie Ci pomagać', go: 'helpers', badge: newBadge() })
      : '',
    row({ iconName: 'letter', title: 'Moje pisma', go: 'letters' }),
    row({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', go: 'whoIsCalling' }),
    row({ iconName: 'qr', title: 'Zeskanuj kod QR', desc: 'W hotelu, w urzędzie, przy logowaniu', go: 'qrScan' }),
    row({ iconName: 'eye', tint: 'green', title: 'Kto widział moje dane', go: 'myData' }),
    row({ iconName: 'bell', title: 'Powiadomienia', desc: unread ? `Nowe: ${unread}` : 'Brak nowych', go: 'notifications' }),
    row({ iconName: 'call', tint: 'blue', title: `Zadzwoń do ${contactFor(state, persona)}`, go: 'callContact' }),
  ].filter(Boolean);
}

function simpleHome(persona, state) {
  const status = simpleStatus(persona, state);
  return `
    ${statusCard(status)}
    ${list(simpleRows(persona, state))}
    ${sectionTitle('Moje dokumenty')}
    ${docStack(people[persona].documents)}
    <button class="btn btn-secondary" data-tab="more">Więcej opcji</button>`;
}

export const documentsScreen = {
  kind: 'tab',
  title: (state, persona) =>
    state.simpleMode[persona] ? `Dzień dobry, ${fullName(persona)}` : 'Dokumenty',
  titleBadge: (state, persona) => (state.simpleMode[persona] ? newBadge('Tryb prosty') : ''),
  speech: (state, persona) => {
    if (!state.simpleMode[persona]) return null;
    const choices = simpleRows(persona, state).map((html) => html.match(/class="row-title">([^<]*)/)?.[1]).filter(Boolean);
    return `Dzień dobry, ${fullName(persona)}. ${simpleStatus(persona, state).text} Możesz wybrać: ${choices.join(', ')}.`;
  },
  render: (state, persona) => (state.simpleMode[persona] ? simpleHome(persona, state) : standardHome(persona, state)),
  actions: {
    actAs: (el) => setActingAs(el.dataset.id),
  },
};

export const callContactScreen = {
  kind: 'inner',
  title: 'Połączenie',
  onEnter: (state, persona) => {
    const callee = people[persona].contact;
    // Na drugim telefonie dzwoniący jest podpisany tak, jak widzi go odbiorca
    notify(callee, { title: contactName(state, callee, persona), body: 'Dzwoni do Ciebie.' });
  },
  render: (state, persona) => {
    const name = contactFor(state, persona);
    return `
    <div class="calling">
      <div class="avatar avatar-large" aria-hidden="true">${name[0]}</div>
      <p class="calling-name">${name}</p>
      <p class="muted">Łączę…</p>
    </div>
    <button class="btn btn-danger" data-home>Rozłącz</button>`;
  },
};
