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

// Jak właściciel telefonu widzi bliską osobę: „Anna Nowak, Córka” albo nadana nazwa („Mama”).
// To forma do nagłówków, list i zdań, w których nazwa stoi w mianowniku.
export function contactName(state, owner, id) {
  const nickname = state.nicknames?.[owner]?.[id]?.trim();
  if (nickname) return nickname;
  const relation = relationOf(owner, id);
  return relation ? `${fullName(id)}, ${relation}` : fullName(id);
}

// ---------- Odmiana ----------
// gen — dopełniacz (do kogo? „Zadzwoń do Mamy”), dat — celownik (komu? „przypomnimy Mamie”),
// acc — biernik (kogo? „zapytamy Annę Nowak”).

const knownForms = {
  Mama: { gen: 'Mamy', dat: 'Mamie', acc: 'Mamę' },
  Babcia: { gen: 'Babci', dat: 'Babci', acc: 'Babcię' },
  Zosia: { gen: 'Zosi', dat: 'Zosi', acc: 'Zosię' },
  Antek: { gen: 'Antka', dat: 'Antkowi', acc: 'Antka' },
  Anna: { gen: 'Anny', dat: 'Annie', acc: 'Annę' },
  Krystyna: { gen: 'Krystyny', dat: 'Krystynie', acc: 'Krystynę' },
  Zofia: { gen: 'Zofii', dat: 'Zofii', acc: 'Zofię' },
  Antoni: { gen: 'Antoniego', dat: 'Antoniemu', acc: 'Antoniego' },
};

// Końcówki dla imion na -a: Kasia → Kasi, Maja → Mai, Ola → Oli, Ewa → Ewy / Ewie, Marta → Marty / Marcie
const genEndings = [['ia', 'i'], ['ja', 'i'], ['la', 'li'], ['ka', 'ki'], ['ga', 'gi'], ['a', 'y']];
const datEndings = [
  ['ia', 'i'], ['ja', 'i'], ['la', 'li'], ['ka', 'ce'], ['ga', 'dze'], ['cha', 'sze'], ['ta', 'cie'], ['da', 'dzie'],
  ['ra', 'rze'], ['sa', 'sie'], ['za', 'zie'], ['na', 'nie'], ['ma', 'mie'], ['wa', 'wie'], ['ba', 'bie'], ['pa', 'pie'],
];

// Jedno słowo. Imion spoza listy, które nie kończą się na -a, nie zgadujemy — zostają w mianowniku.
function inflectWord(word, kase) {
  if (knownForms[word]) return knownForms[word][kase];
  if (!/^\p{L}+a$/u.test(word)) return word;
  if (kase === 'acc') return `${word.slice(0, -1)}ę`;
  const ending = (kase === 'gen' ? genEndings : datEndings).find(([end]) => word.endsWith(end));
  return ending ? word.slice(0, -ending[0].length) + ending[1] : word;
}

// Bliska osoba w wybranym przypadku. Nazwę nadaną przez użytkownika odmieniamy, gdy to jedno słowo;
// bez nadanej nazwy — imię i nazwisko („do Anny Nowak”), bez relacji.
export function contactCase(state, owner, id, kase) {
  const nickname = state.nicknames?.[owner]?.[id]?.trim();
  if (nickname) return /\s/.test(nickname) ? nickname : inflectWord(nickname, kase);
  const { firstName, lastName, grammaticalForm } = people[id];
  const female = grammaticalForm === 'female' || firstName.endsWith('a');
  const last = female ? lastName : { gen: `${lastName}a`, dat: `${lastName}owi`, acc: `${lastName}a` }[kase];
  return `${inflectWord(firstName, kase)} ${last}`;
}
