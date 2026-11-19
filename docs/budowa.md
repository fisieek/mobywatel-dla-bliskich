# Jak zbudowany jest prototyp

Szczegółowy opis plików i zasad dla osób, które chcą czytać albo rozwijać kod. Ogólny opis projektu jest w [README](../README.md).

## Pliki
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
- `js/postacie/` + `styles/prolog.css` — prolog z bohaterkami 3D przed telefonami (od 8.11.2026): ekran startowy z Krystyną, Anną i Zosią, powitanie i przedstawienie się po wybraniu osoby, wprowadzenie przed każdym scenariuszem (za pierwszym razem do końca, potem „Pomiń”; w pokazie automatycznym jedno zdanie). Mówi bohaterka scenariusza, osoby z tego scenariusza kiwają głową, pozostałe patrzą na mówiącą. Napisy w dymku i ruch ust z polskiego tekstu, bez dźwięku. `historie.js` — teksty, `scena.js` — scena 3D, `mowa.js` — ruch ust, `prolog.js` — przebieg. Adres z `?prolog=0` wyłącza prolog (tak nagrywa `narzedzia/nagraj-film.mjs`). Obejrzane wprowadzenia pamięta `localStorage`.
- `assets/postacie/` — postacie i animacje z biblioteki Microsoft Rocketbox (licencja MIT, `assets/postacie/LICENCJA-Rocketbox.txt`): Krystyna = Business_Female_02 (siwe włosy), Anna = Female_Adult_14, Zosia = Female_Child_01 (bluzka w kolorze morskim). Tekstury i animacje przygotowują `narzedzia/postacie/tekstury.py` (Pillow) i `narzedzia/postacie/animacje.mjs`. Bez Blendera.
- `vendor/three/` — three.js 0.170 (licencja MIT) do sceny 3D, wczytywany z naszego serwera, bez zewnętrznych adresów.
- `js/icons.js` + `js/official-icons.js` + `assets/ikony/` — oficjalne ikony z systemu projektowego mObywatela (licencja MIT Centralnego Ośrodka Informatyki, `assets/ikony/LICENCJA.txt`) i kilka własnych tam, gdzie oficjalnych nie ma. Bez godła i logo dokumentów.

## Zasady
- **Imion nigdy nie odmieniamy.** Bliską osobę pokazujemy zawsze jako „Imię Nazwisko, Relacja” (np. „Anna Nowak, Córka”) albo pod nazwą nadaną na ekranie Więcej → Moi bliscy (np. „Mama”) — w tej samej formie w każdym zdaniu: „Zadzwoń do Mama”, „Poproś o pomoc: Anna Nowak, Córka”. Zdania budujemy tak, żeby imię stało w mianowniku (podmiot, etykieta po dwukropku albo tytuł powiadomienia). Wszystko idzie przez `contactName` w `js/personas.js`.
- Bez godła oraz bez oznaczeń i zdjęć z prototypu Cieszyńskiego. Dane i osoby fikcyjne.
- Bez bibliotek i bez kroku budowania, żeby prototyp działał stabilnie bez logowania przez cały czas oceny.
- Niewidoczny w wyszukiwarkach i bez śledzenia: `noindex` w `index.html` i w nagłówku `X-Robots-Tag` (`vercel.json`), bez analityki i bez Google Fonts (czcionki systemowe). Jedyne zewnętrzne zapytanie z przeglądarki to biblioteka odczytu tekstu z cdn.jsdelivr.net, i to dopiero przy zdjęciu własnego pisma.
