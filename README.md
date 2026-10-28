# Prototyp „mObywatel dla bliskich” — NASZ kod

Prototyp koncepcyjny na mObywatel Challenge 2026: aktualny mObywatel z nowymi funkcjami — pomoc, ochrona, kontrola.
To nie jest kod prototypu Janusza Cieszyńskiego ani aplikacji mObywatel. Osoby i dane są fikcyjne.

- Wersja dla jury: https://mobywatel-dla-bliskich-prototyp.vercel.app (publikuje się sama po każdym pushu na `main`).
- Scenariusz demo, strategia i wytyczne wyglądu są w dokumentacji projektu (poza tym repozytorium).

## Jak uruchomić
Lokalny serwer bez instalowania czegokolwiek (wymaga tylko Node.js):

```bash
node dev-server.mjs
```

Potem otwórz http://localhost:4173. W aplikacji Claude: podgląd `mobywatel-prototyp` z `.claude/launch.json`.

- **Bez klucza API** asystent działa w trybie awaryjnym (przygotowane odpowiedzi), a pod wyjaśnieniem jest napis „tryb awaryjny”.
- **Z PLLuM:** skopiuj `.env.example` do `.env.local` i wpisz klucz z featherless.ai. Plik `.env.local` jest w `.gitignore`. Na Vercelu klucz ustawia się w panelu projektu jako zmienną `FEATHERLESS_API_KEY`.

## Budowa
Wygląd odwzorowuje aktualną aplikację mObywatel na podstawie publicznych zrzutów ekranu. Dokładamy tylko nowe funkcje i oznaczamy je etykietą „Nowość”.

- `index.html` — scena: dwa telefony obok siebie + przewodnik. Poniżej 860 px jeden telefon i przełącznik u góry.
- `styles/devices.css` + `js/device.js` — realistyczne telefony w prawdziwych wymiarach: iPhone 18 Pro (402 × 874 pt, Dynamic Island) i składany iPhone Duo — złożony (466 × 678 pt) i rozłożony (890 × 626 pt, boczne menu zamiast dolnego paska). Przełącznik „Pokaż na” w nagłówku, jedna skala dla wszystkich urządzeń.
- `styles/tokens.css` — kolory i kształty mObywatela (odczytane ze zrzutów, przybliżone).
- `styles/app.css` — szkielet aplikacji (nagłówek, karty dokumentów, listy, dolny pasek) i tryb prosty.
- `js/store.js` — wspólny stan obu telefonów: nawigacja, powiadomienia między telefonami, tryb prosty, „Działam jako”, historia. Zapis w `sessionStorage`.
- `js/ui.js` — klocki interfejsu mObywatela (stos kart, wiersz listy, nagłówek usługi, ramka informacyjna, etykieta „Nowość”).
- `js/personas.js` — fikcyjne osoby, ich dokumenty i bliscy (`family`), nazwy nadane bliskim i `contactName` — jedyne miejsce, które decyduje, jak pokazujemy bliską osobę.
- `js/dates.js` — daty liczone od dnia pokazu (pismo, termin, ważność pozwolenia).
- `js/screens/documents.js` — zakładka Dokumenty (zwykła, tryb prosty, „Działam jako”).
- `js/screens/common.js` — Usługi, Kod QR, Szukaj, Więcej, szczegóły dokumentu, ekrany nowych usług.
- `js/scenes/help.js` — scena Pomoc (pozwolenie, pismo, odpowiedź, podpis PIN-em).
- `js/scenes/protect.js` — scena Ochrona (telefon od „policjanta” z podpisem numeru, „Ktoś do mnie dzwoni?”, zablokowana prośba o logowanie, prawdziwy telefon z Zakładu Ubezpieczeń Społecznych z kodem do porównania, logowanie kodem QR z liczbą do porównania).
- `js/scenes/control.js` — scena Kontrola (kod QR wypożyczalni, ekran zgody z trzema poziomami danych, historia „Kto widział moje dane”).
- `js/letter.js` — fikcyjne pismo, wyjaśnienie i szkic odpowiedzi.
- `js/assistant.js` — asystent w przeglądarce: pyta `/api/assistant`, a po 8 sekundach bez odpowiedzi przechodzi na przygotowane odpowiedzi.
- `js/ocr.js` — odczyt tekstu ze zdjęcia (Tesseract.js, polski słownik, w przeglądarce).
- `api/assistant.js` + `api/_lib/pllum.js` — funkcja na serwerze: PLLuM-12B-instruct-2512 przez Featherless (klucz tylko na serwerze, limit długości, pamięć podręczna).
- `dev-server.mjs` — lokalny serwer: pliki + `/api/assistant`.
- `js/guide.js` — przewodnik dla jury (następny krok, karty po scenie).
- `js/speech.js` — „Przeczytaj na głos” w trybie prostym.
- `js/icons.js` — własne ikony obrysowe (bez plików z aplikacji).

## Stan (27.10.2026, tydzień 1: fundament)
- ✅ Szkielet aktualnego mObywatela: nagłówek z ikonami, stos kart, dolny pasek z 5 zakładkami, ekrany wewnętrzne z „Wróć”.
- ✅ Nowe: tryb prosty (przełącznik w Więcej), „Działam jako: Ja · Mama · Antek”, nowe usługi w zakładce Usługi, powiadomienia między telefonami, czytanie na głos.
- ✅ Istniejące usługi mObywatela prowadzą do ekranu „Ta usługa działa już w prawdziwym mObywatelu”.
- ✅ **Scena Pomoc** (27.10.2026), cała na dwóch telefonach:
  - Krystyna daje Annie pozwolenie z zakresem i Face ID, Anna je przyjmuje,
  - Krystyna fotografuje papierowe pismo, asystent wyjaśnia je w trzech blokach i czyta na głos,
  - Krystyna prosi Annę o pomoc, Anna (jako „Mama”) przygotowuje odpowiedź z asystentem i może ją poprawić,
  - Krystyna czyta albo słucha odpowiedzi i podpisuje ją PIN-em podpisu, Anna dostaje „Mama wysłała ✓”.
  - Przewodnik pokazuje następny krok, a na końcu karty „Kto już to robi” i „Dziś vs u nas”.
- ✅ Połączenie z PLLuM gotowe w kodzie: wyjaśnienie pisma (JSON w 3 blokach) i szkic odpowiedzi z faktami od Anny. Sprawdzone na udawanym serwerze zgodnym z OpenAI. **Czeka na klucz API od Filipa.**
- ✅ Odczyt tekstu z prawdziwego zdjęcia (Tesseract.js), sprawdzony na obrazku z polskim tekstem.
- ✅ Pod każdą odpowiedzią AI uczciwa informacja: „na żywo: PLLuM” albo „tryb awaryjny”.
- ✅ **Scena Ochrona** (27.10.2026):
  - przycisk w przewodniku uruchamia telefon od „policjanta” na telefonie Krystyny (ekran połączenia z napisami i głosem),
  - Krystyna, nie rozłączając się, sprawdza w „Ktoś do mnie dzwoni?”, czy dzwoni policja → „Żadna instytucja nie dzwoni teraz do Ciebie. Rozłącz się”, Anna dostaje ostrzeżenie,
  - po rozłączeniu oszust wysyła prośbę o logowanie, której Krystyna nie zaczęła — nie ma przycisku „Zatwierdź”, można ją tylko odrzucić,
  - wersja pozytywna: dzwoni naprawdę Zakład Ubezpieczeń Społecznych → aplikacja pokazuje urzędniczkę, sprawę i kod do porównania.
- ✅ **Scena Kontrola** (27.10.2026):
  - Anna skanuje kod QR wypożyczalni (fikcyjne AutoMorze), wybiera jeden z trzech poziomów danych (domyślnie „Dane podstawowe”, bo wystarczą) i widzi, czego nie przekaże,
  - to samo u Krystyny: zameldowanie w fikcyjnym Hotelu Przystań bez numeru PESEL i adresu,
  - wpis w historii z „Cofnij zgodę” i „Zgłoś”,
  - u Krystyny „Kto widział moje dane” zbiera wszystkie trzy sceny: co zrobiła Anna, zablokowane próby, udostępnienia, oraz „Odwołaj pomoc Anny”.
- ✅ **Poprawki P0 po przeglądzie** (28.10.2026):
  - „Przeczytaj na głos” to stały pasek nad dolnym menu (nie zasłania treści) i zmienia się w „Zatrzymaj czytanie”; spokojniejsze tempo,
  - koniec sprzecznego „Odpowiedź gotowa… dostaniesz powiadomienie, gdy będzie gotowa”,
  - po zablokowanym ataku ekran Krystyny mówi o tym do końca dnia, a wiersz mamy u Anny pokazuje godzinę blokady,
  - karta stanu w trybie prostym jest przyciskiem do następnej czynności („Sprawdź, kto dzwoni”, „Przeczytaj odpowiedź”, „Sprawdź i odrzuć”),
  - na ekranie najwyżej jedno powiadomienie; po 7–10 s przechodzi do Powiadomień (dzwonek z kropką), razem z przyciskiem,
  - informacja „na żywo: PLLuM” / „tryb awaryjny” jest w przewodniku, a na telefonie tylko „Sprawdź z treścią pisma”,
  - daty pisma, terminu i pozwolenia liczone od dnia pokazu,
  - Anna po wyjściu z pisma mamy sama wraca do „Działam jako: Ja”,
  - imiona bez odmiany i nowy ekran Więcej → Moi bliscy (nazwy bliskich).
- ✅ **Poprawki P1: prostota dla Krystyny** (28.10.2026):
  - w trybie prostym zamiast pięciu małych zakładek i ikon bez podpisów: dwa duże przyciski na dole — „Start” i „Nie wiem, co zrobić”,
  - „Nie wiem, co zrobić” na każdym ekranie: zadzwoń do bliskiej osoby, daj jej znać, na jakim ekranie utknęłaś, albo wróć na start,
  - ekran główny trybu prostego ma wszystko jako duże wiersze: „Pozwól bliskiej osobie Ci pomagać” (gdy nikt jeszcze nie pomaga), pisma, „Ktoś do mnie dzwoni?”, „Zeskanuj kod QR”, historia, Powiadomienia, telefon, „Więcej opcji”,
  - karta stanu mówi też o nowych powiadomieniach — nigdy „wszystko w porządku”, gdy coś czeka,
  - zgoda w hotelu w trybie prostym to jedna decyzja: „Pokaż tylko to” albo „Nie pokazuj”; trzy poziomy pod „Inne możliwości”,
  - „Przypomnij mi” zostawia widoczne „✓ Przypomnimy 3 dni przed terminem” i informuje Annę, jeśli widzi pisma i terminy,
  - Anna może zaproponować mamie tryb prosty (Usługi → Pomoc bliskich); włącza go tylko mama,
  - ciemniejszy szary tekst (kontrast ok. 5,3:1 zamiast 3,0:1) i większe przypisy w trybie prostym.
- ✅ **Poprawki P2: wiarygodność** (28.10.2026):
  - ekran rozmowy bez przycisku mObywatela (aplikacja nie może go dodać do systemowego ekranu rozmowy); zamiast tego podpis numeru już przy dzwonieniu — „Numer niepotwierdzony przez żadną instytucję” albo „Zakład Ubezpieczeń Społecznych · numer sprawdzony” (na iPhonie od iOS 18: Live Caller ID Lookup, na Androidzie: filtrowanie połączeń) — i systemowy gest „Przesuń w górę”,
  - nowa wersja pozytywna logowania: Krystyna skanuje kod QR na stronie eZUS i wybiera liczbę widoczną na komputerze; zła liczba = brak logowania i wpis w historii,
  - Antek: opis oparty na tym, co istnieje (mObywatel Junior), z wyraźnym „Nowość” dla młodszych dzieci,
  - szkic odpowiedzi w trybie awaryjnym bez numeru przepisu, zgodnie z zasadą dla PLLuM (numer tylko, gdy jest w piśmie albo w faktach od Anny),
  - „Nie rozpoznajesz? Zgłoś” mówi, dokąd trafia zgłoszenie (inspektor ochrony danych, CERT Polska, a przy działaniu Anny — pytanie do niej i „Odwołaj pomoc”).
- ⏳ Przewodnik: podsumowanie liczników na końcu i porównanie z pierwowzorem.

## Zasady
- **Imion nigdy nie odmieniamy.** Bliską osobę pokazujemy zawsze jako „Imię Nazwisko, Relacja” (np. „Anna Nowak, Córka”) albo pod nazwą nadaną na ekranie Więcej → Moi bliscy (np. „Mama”) — w tej samej formie w każdym zdaniu: „Zadzwoń do Mama”, „Poproś o pomoc: Anna Nowak, Córka”. Zdania budujemy tak, żeby imię stało w mianowniku (podmiot, etykieta po dwukropku albo tytuł powiadomienia). Wszystko idzie przez `contactName` w `js/personas.js`.
- Bez godła, oznaczeń i zdjęć z prototypu Cieszyńskiego. Dane i osoby fikcyjne.
- Bez bibliotek i bez kroku budowania, żeby prototyp działał stabilnie bez logowania przez cały czas oceny.
- Niewidoczny w wyszukiwarkach i bez śledzenia: `noindex` w `index.html` i w nagłówku `X-Robots-Tag` (`vercel.json`), bez analityki i bez Google Fonts (czcionki systemowe). Jedyne zewnętrzne zapytanie z przeglądarki to biblioteka odczytu tekstu z cdn.jsdelivr.net, i to dopiero przy zdjęciu własnego pisma.
