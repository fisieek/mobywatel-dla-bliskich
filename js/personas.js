// Fikcyjne osoby i ich dane. Numery PESEL są wymyślone.

export const people = {
  krystyna: {
    firstName: 'Krystyna',
    lastName: 'Nowak',
    vocative: 'Krystyno',
    // Forma gramatyczna, w której asystent zwraca się do osoby („podałaś”)
    grammaticalForm: 'female',
    born: '12.03.1955',
    pesel: '55031200000',
    documents: ['mdowod', 'emeryt'],
    // Do kogo „Zadzwoń do…” w trybie prostym
    contact: { persona: 'anna', label: 'Anny', name: 'Anna' },
  },
  anna: {
    firstName: 'Anna',
    lastName: 'Nowak',
    vocative: 'Anno',
    grammaticalForm: 'female',
    born: '04.09.1992',
    pesel: '92090400000',
    documents: ['mdowod', 'prawoJazdy', 'pojazdy'],
    contact: { persona: 'krystyna', label: 'mamy', name: 'Mama' },
  },
};

// Za kogo może działać Anna (przełącznik „Działam jako”)
export const actingAsOptions = {
  ja: { short: 'Ja', full: 'Anna Nowak', relation: '' },
  mama: { short: 'Mama', full: 'Krystyna Nowak', relation: 'mama' },
  antek: { short: 'Antek', full: 'Antoni Nowak', relation: 'syn, 4 miesiące' },
};
