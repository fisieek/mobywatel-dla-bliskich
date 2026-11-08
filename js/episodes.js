// Scenariusze jako osobne odcinki. Każdy ma problem, grupę docelową, reprezentanta tej grupy i kroki po kolei.
// Najpierw trzy filary (`group: 'main'`), potem kolejne pomysły dla całej rodziny (`group: 'family'`).
// Tryb prosty jest pierwszym krokiem Pomocy, a nie osobnym odcinkiem.
// Każdy zaczyna się od własnego stanu (`start`), więc można otworzyć dowolny bez przechodzenia poprzednich.
// Problemy i grupy dla pierwszych czterech: context/docs/strategia-priorytety.md, sekcja 3.

const K = 'Telefon Krystyny';
const A = 'Telefon Anny';
const Z = 'Telefon Zosi';

const krystyna = { name: 'Krystyna Nowak, 71 lat', desc: 'Emerytka z Wejherowa, mieszka sama. Telefon ma, ale boi się, że coś zepsuje.' };
const anna = { name: 'Anna Nowak, 34 lata', desc: 'Córka Krystyny, pracuje na etacie, sama wychowuje Zosię. Pomaga mamie na odległość.' };
const zosia = { name: 'Zosia Nowak, 11 lat', desc: 'Córka Anny, chodzi do 5 klasy. Ma mObywatela Junior z legitymacją szkolną.' };

const LETTER_ORDER = ['none', 'reading', 'explained', 'requested', 'opened', 'drafting', 'drafted', 'awaiting', 'signed'];
const letterAtLeast = (state, status) => LETTER_ORDER.indexOf(state.letter) >= LETTER_ORDER.indexOf(status);

const simpleOn = (s) => {
  s.simpleMode.krystyna = true;
};
const familyReady = (s) => {
  simpleOn(s);
  s.guardian = 'active';
};

// Kontrola pokazuje historię z całej rodziny, więc startuje z tym, co wydarzyłoby się we wcześniejszych scenariuszach
function controlStart(s) {
  familyReady(s);
  const at = new Date().toISOString();
  s.letter = 'signed';
  s.protection = { checked: true, push: 'blocked', blockedAt: at };
  s.history = [
    { id: 'seed-1', at, persona: 'krystyna', actor: 'blocked', text: 'Ktoś próbował zalogować się na Twoje konto z innego urządzenia. Prośbę odrzuciłaś' },
    { id: 'seed-2', at, persona: 'krystyna', actor: 'self', text: 'Podpisałaś i wysłałaś odpowiedź do urzędu' },
    { id: 'seed-3', at, persona: 'krystyna', actor: 'anna', text: 'Przygotowała odpowiedź do urzędu' },
    { id: 'seed-4', at, persona: 'krystyna', actor: 'anna', text: 'Przeczytała pismo z urzędu' },
  ];
}

export const episodes = [
  {
    name: 'Pomoc',
    // Jedno zdanie o problemie (pasek pokazu) i o tym, co się dzieje w scenariuszu (lista w panelu)
    brief: 'Bliskiej osobie nie da się dziś bezpiecznie pomóc w sprawach urzędowych. Pomaga się na jej telefonie, z jej PIN-em.',
    tagline: 'Krystyna rozumie pismo z urzędu, Anna przygotowuje odpowiedź, a Krystyna ją podpisuje.',
    group: 'main',
    problem: 'Bliskiej osobie nie da się dziś legalnie i bezpiecznie pomóc w sprawach urzędowych. Pomaga się na telefonie mamy, z jej PIN-em. Pisma urzędowe są trudne do zrozumienia, a aplikacja wygląda tak samo dla 20-latka i dla 71-latki.',
    audience: 'Seniorzy i ich dorosłe dzieci, rodzice dzieci z niepełnosprawnością, opiekunowie.',
    people: [krystyna, anna],
    start: () => {},
    // Krótki pokaz zaczyna od chwili, gdy Krystyna ma już tryb prosty i pomoc Anny
    quickStart: familyReady,
    note: 'Odpowiedzi asystenta są w prototypie przykładowe.',
    steps: [
      { phone: K, text: 'Krystyna woli większe litery i mniej przycisków. Otwórz zakładkę Więcej → „Tryb prosty” i dotknij „Włącz tryb prosty”.', done: (s) => s.simpleMode.krystyna },
      { phone: K, text: 'Na ekranie głównym dotknij „Pozwól bliskiej osobie Ci pomagać”, wybierz Annę i potwierdź zakres pomocy.', done: (s) => s.guardian !== 'none' },
      { phone: A, text: 'Otwórz powiadomienie od mamy i przyjmij prośbę.', done: (s) => s.guardian === 'active' },
      { phone: K, text: 'Krystyna dostała papierowe pismo. Dotknij „Moje pisma” i sfotografuj je. Asystent wyjaśni je prostym językiem.', done: (s) => letterAtLeast(s, 'explained') },
      { phone: K, text: 'Dotknij „Poproś o pomoc”.', done: (s) => letterAtLeast(s, 'requested') },
      { phone: A, text: 'Otwórz powiadomienie, przygotuj odpowiedź z asystentem i wyślij ją mamie do zatwierdzenia.', done: (s) => letterAtLeast(s, 'awaiting') },
      { phone: K, text: 'Dotknij „Przeczytaj odpowiedź” i podpisz ją PIN-em podpisu.', done: (s) => s.letter === 'signed' },
    ],
  },
  {
    name: 'Ochrona',
    brief: 'Oszuści dzwonią „z policji” i namawiają do zatwierdzenia czegoś, czego senior sam nie zaczął.',
    tagline: 'Dzwoni fałszywy policjant. Aplikacja mówi: rozłącz się, a Anna dostaje ostrzeżenie.',
    group: 'main',
    problem: 'Oszuści dzwonią „z policji” albo „z banku” i namawiają do zatwierdzenia czegoś, czego użytkownik sam nie zaczął. Decyzja zapada w stresie, sam na sam z oszustem.',
    audience: 'Wszyscy użytkownicy, a szczególnie seniorzy.',
    people: [krystyna],
    start: familyReady,
    steps: [
      { text: 'Do Krystyny dzwoni oszust podający się za policjanta.', button: { action: 'scamCall', label: 'Zasymuluj telefon' }, done: (s) => Boolean(s.call) || s.protection.checked },
      { phone: K, text: 'Odbierz. Już pod numerem widać podpis: „Numer niepotwierdzony przez żadną instytucję”.', done: (s) => s.call?.status === 'talking' || s.protection.checked },
      { phone: K, text: 'Nie rozłączaj się. Wyjdź z ekranu rozmowy (pasek „Przesuń w górę”), dotknij „Sprawdź, kto dzwoni” i wybierz „Policja”.', done: (s) => s.protection.checked },
      { phone: K, text: 'Aplikacja mówi: rozłącz się. Dotknij „Rozłącz się”. Anna dostaje ostrzeżenie.', done: (s) => s.protection.checked && !s.call },
      { phone: K, text: 'Przychodzi prośba o logowanie, której Krystyna nie zaczęła. Otwórz ją i odrzuć. Nie da się jej zatwierdzić.', done: (s) => s.protection.push === 'blocked' },
    ],
  },
  {
    name: 'Kontrola',
    brief: 'Hotel czy wypożyczalnia widzą cały dowód, a nigdzie nie widać, kto jakie dane dostał.',
    tagline: 'Wypożyczalnia dostaje 2 dane zamiast całego dowodu, a wszystko widać w historii.',
    group: 'main',
    problem: 'Hotel, wypożyczalnia czy operator widzą cały dokument, a często robią kserokopię. Nie ma jednego miejsca, które pokazuje, kto i jakie dane dostał.',
    audience: 'Wszyscy użytkownicy.',
    people: [anna, krystyna],
    start: controlStart,
    steps: [
      { phone: A, text: 'Anna wynajmuje auto. Otwórz zakładkę Kod QR → „Zeskanuj kod QR” i dotknij „Zeskanuj kod”.', done: (s) => s.consent.anna !== 'none' },
      { phone: A, text: 'Wybierz, ile danych pokazać wypożyczalni, i udostępnij je.', done: (s) => s.consent.anna === 'shared' },
      { phone: K, text: 'Dotknij „Kto widział moje dane”. Widać tam pomoc Anny, zablokowaną próbę oszustwa i wszystkie udostępnienia.', done: (s) => s.historySeen },
    ],
  },
  {
    name: 'Moje leki',
    brief: 'Tabletki kończą się nagle, recepta jest nieważna, a przychodnia odbiera telefon tylko w godzinach pracy.',
    tagline: 'Kończy się lek. Anna prosi przychodnię o receptę, a kod do apteki jest na ekranie.',
    group: 'family',
    problem: 'Tabletki kończą się nagle, recepta jest już nieważna, a do przychodni można zadzwonić tylko w godzinach pracy.',
    audience: 'Osoby przyjmujące leki na stałe, głównie seniorzy, i ich bliscy.',
    people: [krystyna, anna],
    start: familyReady,
    steps: [
      { text: 'Mija kilka tygodni. Krystynie kończy się lek na ciśnienie.', button: { action: 'medsLow', label: 'Przejdź kilka tygodni dalej' }, done: (s) => s.meds !== 'ok' },
      { phone: K, text: 'Otwórz powiadomienie, dotknij „Poproś o nową receptę” i poproś o pomoc Annę.', done: (s) => ['requested', 'ordered', 'refilled'].includes(s.meds) },
      { phone: A, text: 'Otwórz powiadomienie od mamy i dotknij „Poproś przychodnię o receptę”. Anna widzi tylko ten jeden lek.', done: (s) => ['ordered', 'refilled'].includes(s.meds) },
      { text: 'Przychodnia wystawia receptę. Poczekaj chwilę.', done: (s) => s.meds === 'refilled' },
      { phone: K, text: 'Recepta przyszła na telefon Krystyny. Dotknij „Pokaż w aptece”.', done: (s) => s.medsShown },
    ],
  },
  {
    name: 'Odbiór dziecka ze szkoły',
    brief: 'Gdy dziecko odbiera babcia, szkoła dostaje kartkę, której nie ma jak sprawdzić.',
    tagline: 'Anna upoważnia babcię do odbioru Zosi, a nauczycielka sprawdza kod QR.',
    group: 'family',
    problem: 'Gdy dziecko odbiera ktoś inny niż rodzic, szkoła dostaje kartkę, której nie ma jak sprawdzić.',
    audience: 'Rodzice uczniów i bliscy, którzy pomagają w opiece, oraz szkoły.',
    people: [anna, krystyna],
    start: familyReady,
    steps: [
      { phone: A, text: 'Anna utknęła w pracy, a lekcje Zosi kończą się o 13:30. Otwórz Usługi → „Upoważnij bliską osobę” i dotknij „Upoważnij”.', done: (s) => Boolean(s.pickup) },
      { phone: K, text: 'Krystyna jest pod szkołą. Otwórz powiadomienie, a potem dotknij „Nauczycielka skanuje kod”.', done: (s) => s.pickup?.status === 'used' },
    ],
  },
  {
    name: 'Ktoś do mnie pisze?',
    brief: 'Obca osoba pisze do dziecka, straszy je albo chce zdjęć, a dziecko zostaje z tym samo.',
    tagline: 'Obcy pisze do Zosi. Zosia dostaje radę i sama wybiera, komu powiedzieć.',
    group: 'family',
    problem: 'Obca osoba pisze do dziecka: obraża je, straszy albo chce zdjęć. Dziecko się wstydzi, kasuje wiadomości i zostaje z tym samo.',
    audience: 'Dzieci i nastolatki oraz ich rodzice.',
    people: [zosia],
    start: familyReady,
    steps: [
      { text: 'Do Zosi pisze obca osoba, która poznała ją w grze.', button: { action: 'strangerChat', label: 'Zasymuluj wiadomość' }, done: (s) => Boolean(s.chat) },
      { phone: Z, text: 'Przeczytaj wiadomości. Potem wyjdź z aplikacji Wiadomości (pasek „Przesuń w górę”).', done: (s) => Boolean(s.chat) && !s.chat.open },
      { phone: Z, text: 'Otwórz Usługi → „Ktoś do mnie pisze?” i wybierz, co się dzieje.', done: (s) => Boolean(s.writing.situation) },
      { phone: Z, text: 'Zosia dostaje radę i sama wybiera, komu powiedzieć. Dotknij „Powiedz: Mama” albo „Zadzwoń: 116 111”.', done: (s) => s.writing.told || s.writing.called },
    ],
  },
  {
    name: 'Zgoda dla szkoły',
    brief: 'Kartka ze zgodą gubi się w plecaku, a rodzic podpisuje ją w ostatniej chwili.',
    tagline: 'Zosia skanuje kartkę od wychowawczyni, a Anna podpisuje zgodę w pracy.',
    group: 'family',
    problem: 'Kartka ze zgodą na wycieczkę gubi się w plecaku, a rodzic podpisuje ją wieczorem dzień przed terminem.',
    audience: 'Rodzice uczniów i szkoły.',
    people: [zosia, anna],
    start: familyReady,
    steps: [
      { phone: Z, text: 'Wychowawczyni rozdała kartki. Otwórz Usługi → „Zgoda dla szkoły” i zeskanuj kod z kartki.', done: (s) => s.school !== 'none' },
      { phone: Z, text: 'Dotknij „Poproś o zgodę: Mama”.', done: (s) => ['requested', 'signed', 'declined'].includes(s.school) },
      { phone: A, text: 'Anna jest w pracy. Otwórz powiadomienie od Zosi i dotknij „Zgadzam się”.', done: (s) => ['signed', 'declined'].includes(s.school) },
    ],
  },
];

// Scenariusze dziejące się na telefonie Zosi: wtedy jej telefon stoi zamiast telefonu Krystyny
export const ZOSIA_EPISODES = [5, 6];

// Krótki pokaz dla jury: trzy filary (Pomoc, Ochrona, Kontrola)
export const HIGHLIGHTS = [0, 1, 2];

export const episodeDone = (state, index) => episodes[index].steps.every((step) => step.done(state));

export const stepIndex = (state, index) => episodes[index].steps.findIndex((step) => !step.done(state));

const phonePersona = { [K]: 'krystyna', [A]: 'anna', [Z]: 'zosia' };

// Bieżący krok otwartego scenariusza: { phone, text, persona } albo null
export function currentStep(state) {
  const steps = episodes[state.episode].steps;
  const step = steps[stepIndex(state, state.episode)];
  return step ? { ...step, persona: phonePersona[step.phone] ?? null } : null;
}
