// Fikcyjne osoby i ich dane. Numery PESEL są wymyślone.

export const people = {
  krystyna: {
    firstName: 'Krystyna',
    lastName: 'Nowak',
    // Forma gramatyczna, w której asystent zwraca się do osoby („podałaś”)
    grammaticalForm: 'female',
    born: '12.03.1955',
    pesel: '55031200000',
    documents: ['mdowod', 'emeryt'],
    // Kto jest pod „Zadzwoń do…” w trybie prostym
    contact: 'anna',
  },
  anna: {
    firstName: 'Anna',
    lastName: 'Nowak',
    grammaticalForm: 'female',
    born: '04.09.1992',
    pesel: '92090400000',
    documents: ['mdowod', 'prawoJazdy', 'pojazdy'],
    contact: 'krystyna',
  },
  antek: {
    firstName: 'Antoni',
    lastName: 'Nowak',
    born: '18.06.2026',
    documents: [],
  },
  // Córka Anny, 11 lat, 5 klasa. Ma mObywatela Junior z legitymacją szkolną.
  zosia: {
    firstName: 'Zofia',
    lastName: 'Nowak',
    born: '14.05.2015',
    pesel: '15251400000',
    documents: ['legitymacja'],
    contact: 'anna',
  },
};

// Bliscy każdej osoby według rejestru stanu cywilnego. Relacja jest opisana z punktu widzenia właściciela telefonu.
export const family = {
  krystyna: [
    { id: 'anna', relation: 'Córka' },
    { id: 'zosia', relation: 'Wnuczka' },
    { id: 'antek', relation: 'Wnuk' },
  ],
  anna: [
    { id: 'krystyna', relation: 'Matka' },
    { id: 'zosia', relation: 'Córka' },
    { id: 'antek', relation: 'Syn' },
  ],
  zosia: [
    { id: 'anna', relation: 'Matka' },
    { id: 'krystyna', relation: 'Babcia' },
  ],
};

// Nazwy, które użytkownik sam nadał bliskim (ekran „Moi bliscy”). Pusta nazwa = imię, nazwisko i relacja.
export const defaultNicknames = {
  krystyna: { anna: '', zosia: '', antek: '' },
  anna: { krystyna: 'Mama', zosia: 'Zosia', antek: 'Antek' },
  zosia: { anna: 'Mama', krystyna: 'Babcia' },
};

export const fullName = (id) => `${people[id].firstName} ${people[id].lastName}`;

export const relationOf = (owner, id) => family[owner]?.find((f) => f.id === id)?.relation ?? '';

// Jak właściciel telefonu widzi bliską osobę. Imion NIGDY nie odmieniamy:
// zawsze „Anna Nowak, Córka” albo nadana nazwa („Mama”) — w tej samej formie w każdym zdaniu.
export function contactName(state, owner, id) {
  const nickname = state.nicknames?.[owner]?.[id]?.trim();
  if (nickname) return nickname;
  const relation = relationOf(owner, id);
  return relation ? `${fullName(id)}, ${relation}` : fullName(id);
}

// Za kogo może działać Anna (przełącznik „Działam jako”): identyfikator w stanie → osoba
export const actingAsPeople = { ja: 'anna', mama: 'krystyna', zosia: 'zosia', antek: 'antek' };

export function actingAsLabel(state, id) {
  return id === 'ja' ? 'Ja' : contactName(state, 'anna', actingAsPeople[id]);
}
