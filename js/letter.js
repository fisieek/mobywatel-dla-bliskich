// Fikcyjne papierowe pismo do sceny Pomoc i gotowe odpowiedzi asystenta.
// Pismo ma znak wodny „pismo fikcyjne”, żeby nikt nie wziął go za prawdziwe.

export const letter = {
  office: 'Urząd Miejski w Wejherowie',
  officeShort: 'Urząd Miejski',
  department: 'Wydział Finansowy',
  sign: 'FN.3120.412.2026',
  date: '20.11.2026',
  deadline: '8 grudnia 2026',
  title: 'WEZWANIE',
  body: [
    'Na podstawie przepisów ustawy – Ordynacja podatkowa wzywam do złożenia wyjaśnień dotyczących informacji o nieruchomościach i obiektach budowlanych (IN-1) złożonej dla nieruchomości położonej przy ul. Klonowej 7 w Wejherowie.',
    'W toku czynności sprawdzających stwierdzono rozbieżność pomiędzy wykazaną w informacji powierzchnią użytkową budynku mieszkalnego (98,00 m²) a powierzchnią wynikającą z ewidencji gruntów i budynków (120,40 m²).',
    'Wyjaśnienia należy złożyć w terminie 14 dni od dnia doręczenia niniejszego wezwania. Niezłożenie wyjaśnień w wyznaczonym terminie może skutkować wszczęciem postępowania podatkowego w celu określenia wysokości zobowiązania.',
  ],
};

// Wyjaśnienie prostym językiem (trzy bloki: o co chodzi / co zrobić / do kiedy)
export const explanation = {
  from: letter.office,
  what: 'Urząd pyta, dlaczego w informacji o podatku od domu podałaś 98 m², a w urzędowej ewidencji dom ma 120 m². Chce wiedzieć, skąd ta różnica.',
  todo: 'Napisz krótkie wyjaśnienie i wyślij je do urzędu. Nic nie płacisz.',
  when: `Do ${letter.deadline}`,
  warning: 'Jeśli nie odpowiesz, urząd może sam ustalić podatek — możliwe, że wyższy.',
};

export function explanationSpeech(e = explanation) {
  return `${e.from ? `Pismo: ${e.from}. ` : ''}O co chodzi: ${e.what} Co musisz zrobić: ${e.todo} Do kiedy: ${e.when}. ${e.warning ?? ''}`;
}

// Tekst przykładowego pisma — tak, jak odczytałby go odczyt tekstu ze zdjęcia
export function sampleLetterText() {
  return [
    `${letter.office}, ${letter.department}`,
    `Wejherowo, ${letter.date}`,
    `Znak: ${letter.sign}`,
    'Pani Krystyna Nowak, ul. Klonowa 7, 84-200 Wejherowo',
    letter.title,
    ...letter.body,
  ].join('\n');
}

// Szkic odpowiedzi, który asystent przygotowuje dla Anny
export const replyDraft = `Wejherowo, 26.11.2026

Krystyna Nowak
ul. Klonowa 7, 84-200 Wejherowo

${letter.office}
${letter.department}

Dotyczy: wezwania z ${letter.date}, znak ${letter.sign}

W odpowiedzi na wezwanie wyjaśniam, że różnica między powierzchnią podaną w informacji IN-1 (98,00 m²) a powierzchnią z ewidencji (120,40 m²) wynika z poddasza o wysokości poniżej 1,40 m (ok. 22,4 m²). Zgodnie z art. 4 ust. 2 ustawy o podatkach i opłatach lokalnych powierzchnię o wysokości poniżej 1,40 m pomija się przy ustalaniu powierzchni użytkowej.

Z poważaniem
Krystyna Nowak`;

export function paperHtml({ compact = false } = {}) {
  return `
    <div class="paper ${compact ? 'paper-compact' : ''}" aria-label="Zdjęcie papierowego pisma">
      <span class="paper-watermark" aria-hidden="true">PISMO FIKCYJNE · PROTOTYP</span>
      <div class="paper-head">
        <p><strong>${letter.office}</strong><br>${letter.department}</p>
        <p>Wejherowo, ${letter.date}</p>
      </div>
      <p class="paper-sign">Znak: ${letter.sign}</p>
      <p class="paper-to">Pani<br>Krystyna Nowak<br>ul. Klonowa 7<br>84-200 Wejherowo</p>
      <p class="paper-title">${letter.title}</p>
      ${letter.body.map((p) => `<p>${p}</p>`).join('')}
    </div>`;
}
