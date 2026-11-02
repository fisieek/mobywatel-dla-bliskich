// Co dziś jest w mObywatelu: pełne listy usług i dokumentów z info.mobywatel.gov.pl (stan: 2.11.2026)
// oraz nasze nowe usługi, wpięte w te same kategorie. Istniejące usługi to ślepe uliczki (ekran core:Nazwa).

// Kolorowa ikona usługi z oficjalnego systemu projektowego; usługi bez niej (nowsze niż publikacja kodu) mają ikonę obrysową
const brands = {
  'Bezpiecznie w sieci': 'IC010_bezpieczenstwo_w_sieci',
  'Sprawdź PESEL': 'IC012_sprawdz_PESEL',
  'Zastrzeż dokument': 'IC029_zastrzez_dokument',
  'Zastrzeż PESEL': 'IC013_zastrzez_PESEL',
  Recepty: 'IC001_recepty',
  'E-wizyta w ZUS': 'IC015_e-wizytwa_w_ZUS',
  'Księgi wieczyste': 'IC022_ksiegi_wieczyste',
  'Podpis kwalifikowany': 'IC003_podpisz_wniosek',
  'Twoje sprawy': 'IC021_twoje_sprawy',
  Wybory: 'IC011_wybory',
  'Załatw sprawę': 'IC020_zloz_dokument',
  'Historia pojazdu': 'IC006_historia_pojazdu',
  mStłuczka: 'IC023_stluczka',
  'Punkty karne': 'IC004_punkty_karne',
  'Uprawnienia kierowcy': 'IC024_uprawnienia_kierowcy',
  ePłatności: 'IC014_ePlatnosci',
  Mandaty: 'IC005_mandaty',
  'Dane w KRS': 'IC026_pozostale',
  Firma: 'IC002_firma',
  'Alert powodziowy': 'IC009_alert_powodziowy',
  'Jakość powietrza': 'IC008_jakosc_powietrza',
  'Naruszenie środowiskowe': 'IC007_naruszenie_srodowiskowe',
  'Bezpieczny autobus': 'IC016_bezpieczny_autobus',
  Bilkom: 'IC017_bilkom',
  'Małopolska Karta Aglomeracyjna': 'IC018_karta_MKA',
  Odyseusz: 'IC019_polak_za_granica',
  'Dostęp do internetu': 'IC025_internet_gov_pl',
};

const core = (title, iconName, about) => ({ title, iconName, brand: brands[title], about, go: `core:${title}` });

// Nowa usługa: `only` ogranicza ją do wybranych telefonów
const ours = (title, iconName, go, desc, only) => ({ title, iconName, go, desc, only, isNew: true });

export const serviceCategories = [
  {
    name: 'Rodzina i bliscy',
    tint: 'green',
    isNew: true,
    rows: [
      ours('Pomoc bliskich', 'people', 'helpers', 'Kto Ci pomaga i komu pomagasz'),
      ours('Upoważnij bliską osobę', 'people', 'authorize', 'Odbiór dziecka, przesyłki i inne codzienne sprawy', ['anna']),
      ours('Moi bliscy', 'people', 'contacts', 'Nazwy, pod którymi widzisz bliskie osoby'),
    ],
  },
  {
    name: 'Ochrona danych',
    tint: 'violet',
    rows: [
      core('Bezpiecznie w sieci', 'globe', 'Zgłaszaj podejrzane wiadomości i strony, czytaj ostrzeżenia o cyberatakach.'),
      ours('Ktoś do mnie dzwoni?', 'phoneQuestion', 'whoIsCalling', 'Sprawdź, czy dzwoni naprawdę policja, bank albo urząd'),
      ours('Kto widział moje dane', 'eye', 'myData', 'Logowania, udostępnienia i podpisy w Historii aktywności'),
      core('Sprawdź dowód', 'idCheck', 'Sprawdź po serii i numerze, czy dowód osobisty jest unieważniony lub zawieszony.'),
      core('Sprawdź PESEL', 'shield', 'Dowiedz się, czy numer PESEL drugiej osoby jest zastrzeżony.'),
      core('Zastrzeż dokument', 'ban', 'Zastrzeż dowód, paszport lub prawo jazdy przez całą dobę.'),
      core('Zastrzeż PESEL', 'shieldLock', 'Zabezpiecz się przed wyłudzeniami i kredytem wziętym na Twoje dane.'),
    ],
  },
  {
    name: 'Bezpieczeństwo',
    tint: 'red',
    rows: [
      core('Poradnik bezpieczeństwa', 'book', 'Wskazówki, jak reagować w sytuacjach zagrożenia i kryzysu.'),
      core('Szkolenia obronne', 'shield', 'Zapisz się na szkolenie obronne w wybranym miejscu w Polsce.'),
    ],
  },
  {
    name: 'Zdrowie',
    tint: 'red',
    rows: [
      ours('Moje leki', 'pill', 'meds', 'Ile zostało tabletek i nowa recepta', ['krystyna']),
      core('Recepty', 'pill', 'Pobieraj recepty i realizuj je w aptece bez podawania numeru PESEL.'),
      core('Zagrożenia zdrowia publicznego', 'warning', 'Zgłoszenie trafi do Państwowej Inspekcji Sanitarnej.'),
    ],
  },
  {
    name: 'Sprawy urzędowe',
    tint: 'blue',
    rows: [
      ours('Moje pisma', 'letter', 'letters', 'Sfotografuj pismo, a asystent wyjaśni je po ludzku', ['krystyna']),
      core('E-wizyta w ZUS', 'folder', 'Umów się na wideorozmowę z pracownikiem ZUS.'),
      core('Księgi wieczyste', 'book', 'Informacje z ksiąg wieczystych, odpisy, wyciągi i zaświadczenia.'),
      core('Podpis kwalifikowany', 'signature', 'Podpisz bezpłatnie 5 dokumentów w miesiącu w sprawach prywatnych.'),
      core('Odbiór dowodu', 'idCheck', 'Sprawdź po numerze wniosku, czy dowód jest gotowy do odbioru.'),
      core('Odbiór paszportu', 'idCheck', 'Sprawdź po numerze wniosku, czy paszport jest gotowy do odbioru.'),
      core('Podpis osobisty', 'signature', 'Podpisuj dokumenty PDF e-dowodem za pomocą telefonu.'),
      core('Twoje sprawy', 'folder', 'Sprawdź status złożonych spraw i wniosków urzędowych.'),
      core('Wybory', 'checkCircle', 'Dowiedz się, kiedy i gdzie głosujesz.'),
      core('Załatw sprawę', 'folder', 'Katalog usług, między innymi zawieszanie i unieważnianie dowodu.'),
    ],
  },
  {
    name: 'Kierowca i pojazdy',
    tint: 'amber',
    tags: 'auto samochód',
    rows: [
      core('Historia pojazdu', 'car', 'Sprawdź poprzednich właścicieli i ostatni stan licznika.'),
      core('mStłuczka', 'car', 'Spisz wspólne oświadczenie o zdarzeniu drogowym i zgłoś szkodę.'),
      core('Punkty karne', 'car', 'Zobacz swoje wykroczenia i stan punktów karnych.'),
      core('Sprawdź OC', 'carCheck', 'Sprawdź, czy ubezpieczenie OC pojazdu jest aktualne.'),
      core('Uprawnienia kierowcy', 'idCheck', 'Sprawdź dane i status prawa jazdy.'),
    ],
  },
  {
    name: 'Opłaty i podatki',
    tint: 'blue',
    rows: [
      core('ePłatności', 'wallet', 'Powiadomienia o zobowiązaniach urzędowych i płatność w aplikacji.'),
      core('Mandaty', 'receipt', 'Szczegóły mandatów i informacja, czy są opłacone.'),
    ],
  },
  {
    name: 'Przedsiębiorca',
    tint: 'blue',
    rows: [
      core('Dane w KRS', 'building', 'Informacje o podmiotach, które reprezentujesz.'),
      core('Firma', 'building', 'Dane jednoosobowej działalności i zaświadczenie z CEIDG.'),
    ],
  },
  {
    name: 'Środowisko',
    tint: 'green',
    rows: [
      core('Alert powodziowy', 'info', 'Aktualne ostrzeżenia hydrologiczne i mapa zagrożonych obszarów.'),
      core('Jakość powietrza', 'info', 'Stan powietrza w Twojej okolicy.'),
      core('Naruszenie środowiskowe', 'info', 'Zgłoś porzucone śmieci lub inne zanieczyszczenia.'),
    ],
  },
  {
    name: 'Podróż',
    tint: 'amber',
    rows: [
      core('Bezpieczny autobus', 'car', 'Sprawdź dane techniczne autobusu przed podróżą.'),
      core('Bilkom', 'car', 'Bilety na pociąg do okazania na ekranie telefonu.'),
      core('Małopolska Karta Aglomeracyjna', 'car', 'Bilety na pociąg, tramwaj, autobus i parking w Małopolsce.'),
      core('Odyseusz', 'globe', 'Zgłoś zagraniczną podróż i dostawaj ostrzeżenia Ministerstwa Spraw Zagranicznych.'),
    ],
  },
  {
    name: 'Inne',
    tint: 'blue',
    rows: [
      core('Dostęp do internetu', 'globe', 'Zgłoś, że potrzebujesz szybkiego internetu.'),
      core('Skrzynka osobista', 'envelope', 'Skrzynki e-Doręczeń i ePUAP w aplikacji.'),
      { title: 'Wirtualny asystent', iconName: 'assistant', go: 'assistant' },
    ],
  },
];

// Pełna lista dokumentów; `own` łączy pozycję z kartą, którą ktoś może mieć w telefonie
export const documentCatalog = [
  { title: 'mDowód', card: 'mdowod', own: 'mdowod' },
  { title: 'mPrawo jazdy', card: 'prawo-jazdy', own: 'prawoJazdy' },
  { title: 'Moje pojazdy', card: 'pojazdy', own: 'pojazdy', tags: 'auto samochód' },
  { title: 'Legitymacja emeryta-rencisty', card: 'emeryt', own: 'emeryt' },
  { title: 'Legitymacja szkolna', card: 'legitymacja', own: 'legitymacja' },
  ...[
    'mDyplomy',
    'Karta Dużej Rodziny',
    'Dokument ochrony czasowej',
    'Identyfikator komornika sądowego',
    'Legitymacja adwokacka',
    'Legitymacja aplikanta radcowskiego',
    'Legitymacja biegłego rewidenta',
    'Legitymacja doktoranta',
    'Legitymacja doradcy podatkowego',
    'Legitymacja inżyniera budownictwa',
    'Legitymacja NSZZ Solidarność',
    'Legitymacja osoby niepełnosprawnej',
    'Legitymacja Polskiego Związku Strzelectwa Sportowego',
    'Legitymacja poselska',
    'Legitymacja radcy prawnego',
    'Legitymacja ratownika i pracownika TOPR',
    'Legitymacja senatorska',
    'Legitymacja służbowa nauczyciela',
    'Legitymacja studencka',
    'Legitymacja Ulgowych Usług Transportowych',
    'Prawo wykonywania zawodu diagnosty laboratoryjnego',
    'Prawo wykonywania zawodu farmaceuty',
    'Prawo wykonywania zawodu fizjoterapeuty',
    'Prawo wykonywania zawodu lekarza',
    'Prawo wykonywania zawodu lekarza dentysty',
    'Prawo wykonywania zawodu pielęgniarki',
    'Prawo wykonywania zawodu położnej',
  ].map((title) => ({ title, card: title.startsWith('Prawo') ? 'emeryt' : 'legitymacja' })),
];

export const servicesFor = (persona) =>
  serviceCategories
    .map((category) => ({ ...category, rows: category.rows.filter((r) => !r.only || r.only.includes(persona)) }))
    .filter((category) => category.rows.length > 0);

export function findService(title) {
  for (const category of serviceCategories) {
    const found = category.rows.find((r) => r.title === title);
    if (found) return { ...found, tint: category.tint };
  }
  return null;
}

// Szukanie jak w aplikacji: bez wielkości liter i polskich znaków, także po fragmencie słowa
const plain = (text) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');

export function searchCatalog(query, persona, ownedDocuments) {
  const q = plain(query.trim());
  if (!q) return [];
  const services = servicesFor(persona).flatMap((category) =>
    category.rows
      .filter((r) => plain(`${r.title} ${category.tags ?? ''}`).includes(q))
      .map((r) => ({ title: r.title, kind: 'Usługa', brand: r.brand, iconName: r.iconName, tint: category.tint, go: r.go, isNew: r.isNew })),
  );
  const docs = documentCatalog
    .filter((d) => plain(`${d.title} ${d.tags ?? ''}`).includes(q))
    .map((d) => ({ title: d.title, kind: 'Dokument', card: d.card, go: ownedDocuments.includes(d.own) ? `doc-${d.own}` : `core:${d.title}` }));
  return [...services, ...docs];
}
