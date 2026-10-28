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
};

// Bliscy każdej osoby według rejestru stanu cywilnego. Relacja jest opisana z punktu widzenia właściciela telefonu.
export const family = {
  krystyna: [{ id: 'anna', relation: 'Córka' }],
  anna: [
    { id: 'krystyna', relation: 'Matka' },
    { id: 'antek', relation: 'Syn' },
  ],
};

// Nazwy, które użytkownik sam nadał bliskim (ekran „Moi bliscy”). Pusta nazwa = imię, nazwisko i relacja.
export const defaultNicknames = {
  krystyna: { anna: '' },
  anna: { krystyna: 'Mama', antek: 'Antek' },
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
export const actingAsPeople = { ja: 'anna', mama: 'krystyna', antek: 'antek' };

export function actingAsLabel(state, id) {
  return id === 'ja' ? 'Ja' : contactName(state, 'anna', actingAsPeople[id]);
}
