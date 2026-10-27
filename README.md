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
- `styles/tokens.css` — kolory i kształty mObywatela (odczytane ze zrzutów, przybliżone).
- `styles/app.css` — szkielet aplikacji (nagłówek, karty dokumentów, listy, dolny pasek) i tryb prosty.
- `js/store.js` — wspólny stan obu telefonów: nawigacja, powiadomienia między telefonami, tryb prosty, „Działam jako”, historia. Zapis w `sessionStorage`.
- `js/ui.js` — klocki interfejsu mObywatela (stos kart, wiersz listy, nagłówek usługi, ramka informacyjna, etykieta „Nowość”).
- `js/personas.js` — fikcyjne osoby i ich dokumenty.
- `js/screens/documents.js` — zakładka Dokumenty (zwykła, tryb prosty, „Działam jako”).
- `js/screens/common.js` — Usługi, Kod QR, Szukaj, Więcej, szczegóły dokumentu, ekrany nowych usług.
- `js/scenes/help.js` — scena Pomoc (pozwolenie, pismo, odpowiedź, podpis PIN-em).
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
- ⏳ Sceny Ochrona i Kontrola — ekrany zastępcze.

## Zasady
- Bez godła, oznaczeń i zdjęć z prototypu Cieszyńskiego. Dane i osoby fikcyjne.
- Bez bibliotek i bez kroku budowania, żeby prototyp działał stabilnie bez logowania przez cały czas oceny.
