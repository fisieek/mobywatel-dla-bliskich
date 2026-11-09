// Bohaterki prototypu i to, co mówią: przedstawienie się i wprowadzenie do każdego scenariusza.
// Mówi zawsze bohaterka scenariusza. Osoby, które w nim też występują (`listeners`), kiwają głową,
// a pozostałe stoją i patrzą na mówiącą.
// Numery scenariuszy jak w js/episodes.js: 0 Pomoc, 1 Ochrona, 2 Kontrola, 3 Moje leki,
// 4 Odbiór dziecka ze szkoły, 5 Ktoś do mnie pisze?, 6 Zgoda dla szkoły.

export const people = [
  {
    id: 'krystyna',
    name: 'Krystyna',
    age: '71 lat',
    role: 'Emerytka z Wejherowa',
    problem: 'Boi się, że coś zepsuje w telefonie, a pisma z urzędu są dla niej niezrozumiałe.',
    x: -125,
    folder: 'krystyna',
    materials: {
      f015_body: { map: 'cialo.webp' },
      f015_head: { map: 'glowa.webp', normal: 'glowa_normal.webp', roughness: 0.62 },
      f015_opacity: { map: 'wlosy.webp', cutout: 0.35, roughness: 0.85 },
      f015_glasses: { map: 'okulary.webp', transparent: true, roughness: 0.2 },
    },
    hello: [
      'Dzień dobry! Jestem Krystyna, mam 71 lat i mieszkam sama w Wejherowie.',
      'Telefon mam, ale boję się, że coś w nim zepsuję.',
      'Na szczęście mam córkę i wnuczkę. Opowiem, w czym mi pomagają.',
    ],
  },
  {
    id: 'anna',
    name: 'Anna',
    age: '34 lata',
    role: 'Córka Krystyny, mama Zosi',
    problem: 'Pomaga mamie na odległość i sama wychowuje córkę. Wszystko załatwia w biegu.',
    x: 0,
    folder: 'anna',
    materials: {
      f017_body: { map: 'cialo.webp' },
      f017_head: { map: 'glowa.webp', normal: 'glowa_normal.webp', roughness: 0.6 },
      f017_opacity: { map: 'wlosy.webp', cutout: 0.35, roughness: 0.85 },
    },
    hello: [
      'Cześć, jestem Anna, córka Krystyny. Mam 34 lata i pracuję na etacie.',
      'Sama wychowuję Zosię, a mamie pomagam na odległość.',
      'Sprawy urzędowe załatwiam w biegu, najczęściej przez telefon.',
    ],
  },
  {
    id: 'zosia',
    name: 'Zosia',
    age: '11 lat',
    role: 'Córka Anny, uczennica 5 klasy',
    problem: 'Ma mObywatela Junior. W szkole i w sieci czasem nie wie, do kogo się zwrócić.',
    x: 125,
    folder: 'zosia',
    materials: {
      cf001_body: { map: 'cialo.webp', roughness: 0.8 },
      cf001_head: { map: 'glowa.webp', normal: 'glowa_normal.webp', roughness: 0.6 },
    },
    hello: [
      'Hej! Jestem Zosia, mam 11 lat i chodzę do piątej klasy.',
      'W telefonie mam mObywatela Junior z legitymacją szkolną.',
      'Dużo czasu spędzam w grach i na czatach z koleżankami.',
    ],
  },
];

export const personById = (id) => people.find((p) => p.id === id);

// lines — pełne wprowadzenie; short — jedno zdanie do pokazu automatycznego
export const intros = {
  0: {
    speaker: 'krystyna',
    listeners: ['anna'],
    lines: [
      'Dostałam pismo z urzędu o podatku od domu i nic z niego nie rozumiem.',
      'Anna by pomogła, ale mieszka daleko. Musiałabym jej podać swój PIN, a tego się boję.',
      'Zobaczcie, jak Anna pomaga mi bezpiecznie, a podpisuję zawsze ja.',
    ],
    short: 'Dostałam pismo z urzędu i nic z niego nie rozumiem. Zobaczcie, jak pomaga mi Anna.',
  },
  1: {
    speaker: 'krystyna',
    listeners: ['anna'],
    lines: [
      'Moją sąsiadkę oszukał fałszywy policjant. Straszył ją i kazał coś zatwierdzić w telefonie.',
      'Boję się, że kiedyś zadzwoni też do mnie.',
      'Zobaczcie, jak mObywatel mówi mi, że to oszust, a Anna od razu o tym wie.',
    ],
    short: 'Do seniorów dzwonią fałszywi policjanci. Zobaczcie, jak mObywatel mnie ostrzega.',
  },
  2: {
    speaker: 'anna',
    listeners: ['krystyna'],
    lines: [
      'Kiedy wynajmuję auto albo hotel, chcą mój cały dowód, a czasem robią kserokopię.',
      'I nigdzie nie widzę, kto i jakie moje dane dostał.',
      'Zobaczcie, jak pokazuję tylko dwie dane, a wszystko zostaje w historii.',
    ],
    short: 'Wypożyczalnia chce mój cały dowód. Zobaczcie, jak pokazuję tylko dwie dane.',
  },
  3: {
    speaker: 'krystyna',
    listeners: ['anna'],
    lines: [
      'Biorę leki na ciśnienie i zawsze kończą się w najgorszym momencie.',
      'Recepta jest już nieważna, a do przychodni trudno się dodzwonić.',
      'Zobaczcie, jak Anna prosi przychodnię o receptę, a kod do apteki mam od razu w telefonie.',
    ],
    short: 'Kończy mi się lek na ciśnienie. Zobaczcie, jak Anna zamawia receptę.',
  },
  4: {
    speaker: 'anna',
    listeners: ['krystyna', 'zosia'],
    lines: [
      'Utknęłam w pracy, a lekcje Zosi zaraz się kończą.',
      'Odbierze ją mama, ale szkoła dostaje ode mnie tylko kartkę, której nie ma jak sprawdzić.',
      'Zobaczcie, jak upoważniam mamę w telefonie, a nauczycielka sprawdza kod.',
    ],
    short: 'Utknęłam w pracy, a Zosię odbiera babcia. Zobaczcie, jak szkoła to sprawdza.',
  },
  5: {
    speaker: 'zosia',
    listeners: ['anna'],
    lines: [
      'W grze poznałam kogoś, kto teraz pisze do mnie dziwne wiadomości.',
      'Trochę się boję i trochę wstydzę. Nie wiem, komu o tym powiedzieć.',
      'Zobaczcie, gdzie w mObywatelu znajduję pomoc.',
    ],
    short: 'Obca osoba pisze do mnie dziwne wiadomości. Zobaczcie, gdzie znajduję pomoc.',
  },
  6: {
    speaker: 'zosia',
    listeners: ['anna'],
    lines: [
      'Pani rozdała kartki ze zgodą na wycieczkę. Moja zawsze ginie w plecaku.',
      'A mama podpisuje ją wieczorem, dzień przed terminem.',
      'Zobaczcie, jak skanuję kartkę, a mama zgadza się w pracy.',
    ],
    short: 'Kartka ze zgodą na wycieczkę znowu zginęła. Zobaczcie, jak mama zgadza się w telefonie.',
  },
};

// Scenariusze, w których dana osoba mówi (lista po jej przedstawieniu się)
export const episodesOf = (id) =>
  Object.entries(intros)
    .filter(([, intro]) => intro.speaker === id)
    .map(([index]) => Number(index));
