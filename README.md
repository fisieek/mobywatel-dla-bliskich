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

- Asystent korzysta z przygotowanych odpowiedzi do przykładowego pisma i nie łączy się z żadnym modelem językowym (decyzja z 2.11.2026). Mówi o tym panel obok telefonów.

## Budowa
Wygląd odwzorowuje aktualną aplikację mObywatel na podstawie publicznych zrzutów ekranu. Dokładamy tylko nowe funkcje i oznaczamy je etykietą „Nowość”.

- `index.html` — scena: dwa telefony obok siebie + przewodnik. Poniżej 860 px jeden telefon i przełącznik u góry.
- `styles/devices.css` + `js/device.js` — realistyczne telefony w prawdziwych wymiarach: iPhone 18 Pro (402 × 874 pt, Dynamic Island) i składany iPhone Duo — złożony (466 × 678 pt) i rozłożony (890 × 626 pt, boczne menu zamiast dolnego paska). Przełącznik „Pokaż na” w nagłówku, jedna skala dla wszystkich urządzeń.
- `styles/tokens.css` — kolory i kształty mObywatela (odczytane ze zrzutów, przybliżone).
- `styles/app.css` — szkielet aplikacji (nagłówek, karty dokumentów, listy, dolny pasek) i tryb prosty.
- `js/store.js` — wspólny stan obu telefonów: nawigacja, powiadomienia między telefonami, tryb prosty, historia. Zapis w `sessionStorage`.
- `js/ui.js` — klocki interfejsu mObywatela (stos kart, wiersz listy, nagłówek usługi, ramka informacyjna, etykieta „Nowość”).
- `js/personas.js` — fikcyjne osoby, ich dokumenty i bliscy (`family`), nazwy nadane bliskim i `contactName` — jedyne miejsce, które decyduje, jak pokazujemy bliską osobę.
- `js/dates.js` — daty liczone od dnia pokazu (pismo, termin, ważność pozwolenia).
- `js/catalog.js` — pełne listy usług (37) i dokumentów (32) z info.mobywatel.gov.pl plus nasze nowe usługi; szukanie.
- `js/screens/documents.js` — zakładka Dokumenty (tylko dokumenty) i ekran startowy trybu prostego.
- `js/screens/common.js` — Usługi, Kod QR, Szukaj, Więcej, szczegóły dokumentu, ślepe uliczki `core:Nazwa`, ekrany nowych usług.
- `js/scenes/care.js` — sprawy bliskich na telefonie Anny (Usługi → Pomoc bliskich → osoba).
- `js/scenes/help.js` — scena Pomoc (pozwolenie, pismo, odpowiedź, podpis PIN-em).
- `js/scenes/protect.js` — scena Ochrona (telefon od „policjanta” z podpisem numeru, „Ktoś do mnie dzwoni?”, zablokowana prośba o logowanie, prawdziwy telefon z Zakładu Ubezpieczeń Społecznych z kodem do porównania, logowanie kodem QR z liczbą do porównania).
- `js/scenes/meds.js`, `js/scenes/pickup.js`, `js/scenes/junior.js` — sceny „Cała rodzina”: Moje leki, Upoważnij babcię, Ktoś do mnie pisze? i Zgoda dla szkoły.
- `js/scenes/control.js` — scena Kontrola (kod QR wypożyczalni, ekran zgody z trzema poziomami danych, historia „Kto widział moje dane”).
- `js/letter.js` — fikcyjne pismo, wyjaśnienie i szkic odpowiedzi.
- `js/assistant.js` — asystent: przygotowane odpowiedzi z `js/letter.js`.
- `js/ocr.js` — odczyt tekstu ze zdjęcia. Nieużywany od 2.11.2026, zostawiony na później.
- `api/assistant.js` + `api/_lib/pllum.js` — funkcja na serwerze do łączenia z PLLuM. Strona jej nie wywołuje (decyzja z 2.11.2026), kod został na później.
- `dev-server.mjs` — lokalny serwer: pliki + `/api/assistant`.
- `js/episodes.js` — scenariusze jako odcinki: problem, grupa docelowa, reprezentanci, kroki i stan startowy każdego. Najpierw trzy filary (Pomoc, Ochrona, Kontrola), potem grupa „Cała rodzina”. `quickStart` to stan startowy w krótkim pokazie.
- `js/guide.js` — panel „Scenariusze” obok telefonów: karta „W skrócie” (teza, trzy momenty, porównanie z prototypem referencyjnym), rozwijane odcinki jak FAQ, po jednym naraz.
- `js/autoplay.js` — pokaz automatyczny, który klika te same przyciski co człowiek, z podświetleniem dotknięcia: „Najważniejsze” (trzy filary, ok. 2 min) i „Wszystkie” (7 scen, ok. 6 min). Na początku każdej sceny chwila na przeczytanie problemu; pauza i wznowienie (w pauzie powiadomienia nie znikają). Tempo ustawia stała `TEMPO`.
- `narzedzia/nagraj-film.mjs` + `narzedzia/napisy.mjs` — nagrywa film z pokazu „Najważniejsze” w 1920 × 1080 z napisami w pasku pod obrazem i osobnym plikiem .srt (Playwright i ffmpeg z libass). Napisy są przypięte do kroków pokazu, nie do sekund. Nie trafia na serwer.
- `.github/workflows/sprawdz-link.yml` — codziennie sprawdza, czy wersja dla jury otwiera się bez logowania.
- `js/speech.js` — „Przeczytaj na głos” w trybie prostym.
- `js/icons.js` + `js/official-icons.js` + `assets/ikony/` — oficjalne ikony z systemu projektowego mObywatela (licencja MIT Centralnego Ośrodka Informatyki, `assets/ikony/LICENCJA.txt`) i kilka własnych tam, gdzie oficjalnych nie ma. Bez godła i logo dokumentów.

## Stan (27.10.2026, tydzień 1: fundament)
- ✅ Szkielet aktualnego mObywatela: nagłówek z ikonami, stos kart, dolny pasek z 5 zakładkami, ekrany wewnętrzne z „Wróć”.
- ✅ Nowe: tryb prosty (Więcej → Tryb prosty), nowe usługi w zakładce Usługi, powiadomienia między telefonami, czytanie na głos.
- ✅ Istniejące usługi mObywatela prowadzą do ekranu „Ta usługa działa już w prawdziwym mObywatelu”.
- ✅ **Scena Pomoc** (27.10.2026), cała na dwóch telefonach:
  - Krystyna daje Annie pozwolenie z zakresem i Face ID, Anna je przyjmuje,
  - Krystyna fotografuje papierowe pismo, asystent wyjaśnia je w trzech blokach i czyta na głos,
  - Krystyna prosi Annę o pomoc, Anna przygotowuje odpowiedź z asystentem i może ją poprawić,
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
- ✅ **Poprawki P3: pokaz dla jury** (28.10.2026):
  - w przewodniku jedno „Teraz” — kolejne sceny są przygaszone jako „Potem”, a karty „Kto już to robi” po scenie zwinięte (rozwinięta tylko ostatnio skończona),
  - „▶ Pokaż sam (ok. 2 min)”: pokaz wszystkich trzech scen od nowa, z podświetleniem każdego dotknięcia; dotknięcie człowieka albo „Zatrzymaj pokaz” oddaje stery,
  - na telefonie (poniżej 860 px) pasek „Teraz · Telefon Anny: …” nad aplikacją, który sam przełącza telefon, gdy krok przechodzi na drugą osobę, z przyciskiem „Pokaż sam”,
  - podsumowanie po trzech scenach: dziś vs u nas dla pisma, telefonu od oszusta, wynajmu auta i historii (z liczbą wpisów z sesji).
- ✅ **Tryb prosty jako scena i „Cała rodzina”** (28.10.2026):
  - **Tryb prosty** to pierwsza scena: Krystyna zaczyna w zwykłym mObywatelu i włącza go z karty „Wolisz większe litery i mniej przycisków?”,
  - **Moje leki** (Krystyna): leki z e-recept opisane po ludzku, ostrzeżenie 5 dni przed końcem tabletek, prośba do Anny, Anna prosi przychodnię o receptę i widzi tylko ten jeden lek, kod do apteki na jednym ekranie,
  - **Upoważnij babcię** (Anna): upoważnienie mamy do odbioru Zosi ze szkoły (i wizyty Antka u lekarza) z terminem, kod QR u Krystyny, szkoła widzi tylko to, co potrzebne, Anna wie o odbiorze w tej samej chwili,
  - **Ktoś do mnie pisze?** (Zosia, mObywatel Junior): obcy pisze do Zosi w Wiadomościach, chce zdjęć i straszy, trzy duże przyciski, rada po dziecięcemu, Zosia sama wybiera: 116 111, „Powiedz: Mama” albo Dyżurnet.pl; mama nie dostaje nic bez jej zgody,
  - **Zgoda dla szkoły** (Zosia → Anna): Zosia skanuje kod z kartki od wychowawczyni, Anna podpisuje zgodę w pracy,
  - trzeci telefon (Zosia, mObywatel Junior z trzema zakładkami); na komputerze w scenach Zosi zastępuje telefon Krystyny, przełącznik nad telefonem,
  - „Pokaż sam” w dwóch częściach: „Tryb prosty i trzy filary” i „Cała rodzina” (po ok. 2 min). Od 2.11.2026 zastąpione przez „Najważniejsze” i „Wszystkie”.
- ✅ **Aktualny mObywatel i porządek w strukturze** (2.11.2026):
  - zakładka Dokumenty ma tylko dokumenty; zamiast przełącznika „Działam jako” jest Usługi → Pomoc bliskich,
  - pełne listy usług i dokumentów, działające Szukaj, Więcej według prawdziwej aplikacji, oficjalne ikony,
  - strona dla urzędników: panel „Scenariusze” przewija się osobno, telefony stoją w miejscu.
  - scenariusze jako niezależne odcinki w rozwijanym panelu: problem, grupa docelowa, reprezentanci i kroki po kolei; każdy można otworzyć, zacząć od nowa i pokazać automatycznie,
  - upoważnienie jak cyfrowa kartka: czyja sprawa, kilka podpowiedzi i „Inna sprawa” opisana własnymi słowami,
  - telefon Zosi pojawia się sam przy jej scenariuszach, bez ręcznego przełącznika (na wąskim ekranie zostają zakładki Krystyna · Anna · Zosia),
  - asystent bez modelu językowego: przygotowane odpowiedzi do przykładowego pisma.
- ✅ **Poprawki P0 po przeglądzie pod kątem konkursu** (2.11.2026):
  - karta „W skrócie” na górze panelu: teza (sprawy załatwia się w rodzinie, referencja prowadzi jedną osobę), trzy momenty i przycisk „Pokaż najważniejsze”; na telefonie ten sam przycisk w pasku u góry,
  - „Prototyp referencyjny i my”: trzy sprawy porównane z wersją pod linkiem na mobywatel.ai (tryb skryptowy). Pytania o sprawy mamy i telefon od oszusta sprawdzone w routerze referencji (kopia MIT w publicznym repozytorium innego zgłoszenia), bez żadnych liczb z drugiej ręki,
  - kolejność: Pomoc, Ochrona, Kontrola, potem „Cała rodzina: kolejne pomysły”; Tryb prosty jest pierwszym krokiem Pomocy,
  - pokaz „Najważniejsze”: ok. 70 s zamiast ok. 3,5 min, licznik „scena 2 z 3” zamiast „krok 24 z 71”, pasek postępu,
  - telefon, którego nie dotyczy bieżący krok, przygasa (chyba że właśnie dostał powiadomienie),
  - na laptopie zwarty nagłówek i stopka w jednej linii: przy 1280 × 720 podpisy zakładek w telefonie mają 9,0 px zamiast 7,7 px, przy 1440 × 900 11,9 px zamiast 10,6 px,
  - codzienne sprawdzanie linku dla jury i instrukcja zamrożenia wersji (niżej).
- ✅ **Pokaz, za którym da się nadążyć** (2.11.2026, po pierwszym oglądaniu):
  - scenariusze widać od razu pod krótką kartą „W skrócie”, każdy z jednym zdaniem, co się w nim dzieje,
  - pokaz wolniejszy: „Najważniejsze” ok. 2 min, „Wszystkie” ok. 6 min; przed pierwszym dotknięciem w każdej scenie 6 s na przeczytanie,
  - „Pauza” i „Wznów” obok „Zakończ”, także w pasku na telefonie,
  - w pasku pokazu (nie przewija się) nazwa sceny, problem i to, kogo dotyczy.
- ✅ Film z pokazu „Najważniejsze” z polskimi napisami (`node narzedzia/nagraj-film.mjs`). Do decyzji: głos lektora.

## Zgłoszenie: link i zamrożenie wersji
Wymóg konkursu: link działa bez logowania do ogłoszenia wyników.

- W formularzu podajemy tylko https://mobywatel-dla-bliskich-prototyp.vercel.app. Adresy konkretnych wdrożeń i gałęzi (`…-git-…`, `…-xxxxxxxx.vercel.app`) są za logowaniem Vercela (ochrona „Standard Protection”).
- Przed wysłaniem: otworzyć link w oknie prywatnym, bez zalogowanego Vercela, na komputerze i na telefonie.
- Po wysłaniu zamrozić wersję dla jury:
  1. oznaczyć zgłoszony commit: `git tag zgloszenie-2026-11 && git push origin zgloszenie-2026-11`,
  2. wyłączyć automatyczną publikację z `main`, dopisując do `vercel.json`: `"git": { "deploymentEnabled": { "main": false } }` (dalsza praca na gałęziach, a produkcję promujemy ręcznie w panelu Vercela).
- Workflow „Sprawdź link dla jury” sprawdza link codziennie. Gdy przestanie działać, GitHub wyśle powiadomienie o nieudanym przebiegu.

## Zasady
- **Imion nigdy nie odmieniamy.** Bliską osobę pokazujemy zawsze jako „Imię Nazwisko, Relacja” (np. „Anna Nowak, Córka”) albo pod nazwą nadaną na ekranie Więcej → Moi bliscy (np. „Mama”) — w tej samej formie w każdym zdaniu: „Zadzwoń do Mama”, „Poproś o pomoc: Anna Nowak, Córka”. Zdania budujemy tak, żeby imię stało w mianowniku (podmiot, etykieta po dwukropku albo tytuł powiadomienia). Wszystko idzie przez `contactName` w `js/personas.js`.
- Bez godła oraz bez oznaczeń i zdjęć z prototypu Cieszyńskiego. Dane i osoby fikcyjne.
- Bez bibliotek i bez kroku budowania, żeby prototyp działał stabilnie bez logowania przez cały czas oceny.
- Niewidoczny w wyszukiwarkach i bez śledzenia: `noindex` w `index.html` i w nagłówku `X-Robots-Tag` (`vercel.json`), bez analityki i bez Google Fonts (czcionki systemowe). Jedyne zewnętrzne zapytanie z przeglądarki to biblioteka odczytu tekstu z cdn.jsdelivr.net, i to dopiero przy zdjęciu własnego pisma.
