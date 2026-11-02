// Napisy do filmu z pokazu „Najważniejsze”. Każdy napis zaczyna się, gdy pokaz dochodzi do kroku `step`
// (numeracja od 1, w kolejności kroków z `highlightScenes` w js/autoplay.js), i trwa do następnego napisu.
// `step: 0` to karta „W skrócie” przed pokazem, `step: 'end'` to ostatni ekran po pokazie.
// Po zmianie kroków w js/autoplay.js trzeba sprawdzić numery poniżej.
// Tempo: najwyżej ok. 15 znaków na sekundę czasu na ekranie (skrypt nagrywania ostrzega, gdy napis jest za krótko).
export const cues = [
  { step: 0, text: 'mObywatel dla bliskich: rodzina pomaga sobie w sprawach urzędowych.' },
  // Pomoc: kroki 1–13
  { step: 1, text: 'Pomoc. Krystyna, 71 lat, robi zdjęcie pisma z urzędu. Asystent wyjaśnia je prosto.' },
  { step: 4, text: 'Krystyna prosi o pomoc córkę. Anna przygotowuje odpowiedź na swoim telefonie.' },
  { step: 7, text: 'Odpowiedź wraca do mamy. Bez jej podpisu nic nie trafi do urzędu.' },
  { step: 9, text: 'Krystyna podpisuje ją PIN-em podpisu. Anna od razu wie, że pismo poszło.' },
  // Ochrona: kroki 14–21
  { step: 14, text: 'Ochrona. Dzwoni fałszywy policjant. Pod numerem widać: niepotwierdzony.' },
  { step: 16, text: 'Krystyna sprawdza w aplikacji, kto dzwoni. Żadna instytucja, więc się rozłącza. Anna dostaje ostrzeżenie.' },
  { step: 20, text: 'Oszust próbuje zalogować się na jej konto. Tę prośbę można tylko odrzucić.' },
  // Kontrola: kroki 22–26
  { step: 22, text: 'Kontrola. Anna wynajmuje auto. Wypożyczalnia dostaje 2 dane zamiast całego dowodu.' },
  { step: 26, text: 'Krystyna widzi wszystko w „Kto widział moje dane”.' },
  { step: 'end', text: 'Pomoc, ochrona i kontrola dla całej rodziny. Osoby i dane są fikcyjne.' },
];
