// Zakładka „Dokumenty” — ekran główny mObywatela. Są tu tylko dokumenty, jak w aplikacji.
// Wyjątek to tryb prosty: nie ma w nim zakładek, a ten sam ekran staje się ekranem startowym.
import { notify } from '../store.js';
import { people, contactName, contactCase, fullName } from '../personas.js';
import { docStack, list, row, newBadge, sectionTitle, infoBox } from '../ui.js';
import { protectionStatus, blockedStatus } from '../scenes/protect.js';
import { medsStatus } from '../scenes/meds.js';
import { pickupStatus } from '../scenes/pickup.js';

// „Anna Nowak, Córka” albo nadana nazwa, np. „Mama”; contactGen — „do Anny Nowak”, „do Mamy”
const contactFor = (state, persona) => contactName(state, persona, people[persona].contact);
const contactGen = (state, persona) => contactCase(state, persona, people[persona].contact, 'gen');

function standardHome(persona) {
  return `
    ${persona === 'zosia' ? '' : '<div class="title-links"><button class="link" data-go="customize">Dostosuj</button><button class="link" data-go="addDocument">Dodaj</button></div>'}
    ${docStack(people[persona].documents)}`;
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
  const family = persona === 'krystyna' ? pickupStatus(state) ?? medsStatus(state) : null;
  if (family) return family;
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
    row({ iconName: 'pill', tint: 'red', title: 'Moje leki', go: 'meds' }),
    row({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', go: 'whoIsCalling' }),
    row({ iconName: 'qr', title: 'Zeskanuj kod QR', desc: 'W hotelu, w urzędzie, przy logowaniu', go: 'qrScan' }),
    row({ iconName: 'eye', tint: 'green', title: 'Kto widział moje dane', go: 'myData' }),
    row({ iconName: 'bell', title: 'Powiadomienia', desc: unread ? `Nowe: ${unread}` : 'Brak nowych', go: 'notifications' }),
    row({ iconName: 'call', tint: 'blue', title: `Zadzwoń do ${contactGen(state, persona)}`, go: 'callContact' }),
  ].filter(Boolean);
}

function simpleHome(persona, state) {
  const status = simpleStatus(persona, state);
  return `
    ${statusCard(status)}
    ${list(simpleRows(persona, state))}
    ${sectionTitle('Moje dokumenty')}
    ${docStack(people[persona].documents)}
    <button class="btn btn-secondary" data-tab="services">Wszystkie usługi</button>
    <button class="btn btn-secondary" data-tab="more">Więcej opcji</button>`;
}

export const documentsScreen = {
  kind: 'tab',
  title: (state, persona) => (state.simpleMode[persona] ? `Dzień dobry, ${fullName(persona)}` : 'Dokumenty'),
  titleBadge: (state, persona) => {
    if (persona === 'zosia') return newBadge('mObywatel Junior');
    return state.simpleMode[persona] ? newBadge('Tryb prosty') : '';
  },
  speech: (state, persona) => {
    if (!state.simpleMode[persona]) return null;
    const choices = simpleRows(persona, state).map((html) => html.match(/class="row-title">([^<]*)/)?.[1]).filter(Boolean);
    return `Dzień dobry, ${fullName(persona)}. ${simpleStatus(persona, state).text} Możesz wybrać: ${choices.join(', ')}.`;
  },
  render: (state, persona) => (state.simpleMode[persona] ? simpleHome(persona, state) : standardHome(persona)),
};

// Zwykłe połączenie telefoniczne. mObywatel tylko je otwiera, więc w prototypie rozmowy nie łączymy.
// „Wróć” prowadzi tam, skąd dzwoniono.
export function phoneCallView(name, detail = '') {
  return `
    <div class="calling">
      <div class="avatar avatar-large" aria-hidden="true">${name[0]}</div>
      <p class="calling-name">${name}</p>
      ${detail ? `<p class="muted">${detail}</p>` : ''}
    </div>
    ${infoBox('W prawdziwej aplikacji otworzy się zwykłe połączenie telefoniczne. W prototypie rozmowy nie łączymy.')}
    <button class="btn btn-primary" data-back>Wróć</button>`;
}

// Połączenie z bliską osobą. Na drugim telefonie dzwoniący jest podpisany tak, jak widzi go odbiorca.
export function callScreenFor(contactId) {
  return {
    kind: 'inner',
    title: 'Połączenie',
    onEnter: (state, persona) => {
      const callee = contactId ?? people[persona].contact;
      notify(callee, { title: contactName(state, callee, persona), body: 'Próbuje się do Ciebie dodzwonić.' });
    },
    render: (state, persona) => phoneCallView(contactName(state, persona, contactId ?? people[persona].contact)),
  };
}

export const callContactScreen = callScreenFor(null);
