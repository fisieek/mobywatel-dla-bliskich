// Telefon Anny: pomoc bliskim. Anna nie „zamienia się” w mamę ani w dziecko — działa dalej jako ona sama,
// a sprawy bliskiej osoby ma w jednym miejscu: Usługi → Pomoc bliskich → wybrana osoba.
import { list, row, newBadge, sectionTitle, infoBox, docStack } from '../ui.js';
import { people, contactName, fullName } from '../personas.js';
import { blockedToday } from './protect.js';
import { clock } from '../dates.js';
import { pickupSummary } from './pickup.js';

const nameFor = (state, id) => contactName(state, 'anna', id);

function mamaLettersStatus(state) {
  if (['requested', 'opened'].includes(state.letter)) return 'Prośba o pomoc z 1 pismem';
  if (['drafting', 'drafted'].includes(state.letter)) return 'Przygotowujesz odpowiedź';
  if (state.letter === 'awaiting') return 'Czeka na podpis';
  if (state.letter === 'signed') return 'Wysłane ✓';
  return 'Brak pism, przy których prosi o pomoc';
}

// Wiersz mamy mówi, co się dziś wydarzyło — nie zawsze „wszystko w porządku”
export function mamaSummary(state) {
  if (state.protection.push === 'pending') return { desc: 'Teraz: ktoś próbuje zalogować się na to konto', tint: 'red' };
  if (blockedToday(state)) return { desc: `Dziś ${clock(state.protection.blockedAt)} · zablokowana próba logowania`, tint: 'red' };
  if (['requested', 'opened'].includes(state.letter)) return { desc: 'Prosi o pomoc z pismem z urzędu', tint: 'amber' };
  if (state.letter === 'awaiting') return { desc: 'Odpowiedź czeka na podpis', tint: 'amber' };
  if (state.meds === 'requested') return { desc: 'Prosi o pomoc z receptą', tint: 'amber' };
  const pickup = pickupSummary(state);
  if (pickup) return pickup;
  if (state.letter === 'signed') return { desc: 'Odpowiedź do urzędu wysłana ✓', tint: 'green' };
  return { desc: 'Wszystko w porządku · brak nowych pism i terminów', tint: 'green' };
}

// Część ekranu „Pomoc bliskich”: dzieci są tu od razu, bo rejestr zna relację rodzic–dziecko
export function childrenSection(state) {
  return `
    ${sectionTitle('Twoje dzieci')}
    ${list([
      row({ iconName: 'people', tint: 'blue', title: nameFor(state, 'zosia'), desc: fullName('zosia'), go: 'care-zosia' }),
      row({ iconName: 'people', tint: 'blue', title: nameFor(state, 'antek'), desc: fullName('antek'), go: 'care-antek' }),
    ])}`;
}

export const careScreens = {
  'care-krystyna': {
    kind: 'inner',
    title: (state) => nameFor(state, 'krystyna'),
    helping: 'krystyna',
    render: (state) => {
      if (state.guardian !== 'active') return infoBox(`${nameFor(state, 'krystyna')}: brak pozwolenia na pomoc.`);
      return `
        ${list([
          row({ iconName: 'letter', title: 'Pisma', desc: mamaLettersStatus(state), go: 'mamaLetter', badge: newBadge() }),
          state.meds !== 'ok' ? row({ iconName: 'pill', tint: 'red', title: 'Leki', desc: 'Tylko to, co Ci pokazano', go: 'mamaMeds', badge: newBadge() }) : '',
        ])}
        ${infoBox('Dokumentów bliskiej osoby tu nie ma: mDowód może pokazać tylko jego właściciel. Działasz pod własnym imieniem, a każdy krok trafia do historii tej osoby.')}`;
    },
  },

  'care-zosia': {
    kind: 'inner',
    title: (state) => nameFor(state, 'zosia'),
    helping: 'zosia',
    render: () => `
      ${sectionTitle('Dokumenty')}
      ${docStack(people.zosia.documents, { id: 'zosia', name: fullName('zosia') })}
      ${infoBox('Legitymację szkolną dziecka rodzic może dodać do swojego mObywatela już dziś (mObywatel Junior).')}`,
  },

  'care-antek': {
    kind: 'inner',
    title: (state) => nameFor(state, 'antek'),
    helping: 'antek',
    render: (state) =>
      infoBox(
        `${nameFor(state, 'antek')}: brak dokumentów w aplikacji. Już dziś rodzic może dodać do swojego mObywatela legitymację szkolną dziecka (mObywatel Junior). <strong>Nowość:</strong> to samo dla młodszych dzieci — sprawy i dokumenty dziecka w jednym miejscu, bez osobnego pełnomocnictwa, bo rejestr zna relację rodzic–dziecko.`,
      ),
  },
};
