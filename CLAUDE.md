# Planer diety — kontekst projektu

Prywatna aplikacja webowa do planowania jedzenia. W całości statyczna:
React + TypeScript + Vite, bez backendu i bez bazy danych. Cały stan
użytkownika siedzi w `localStorage` przeglądarki.

## Polecenia

```bash
npm run dev        # serwer deweloperski, http://localhost:5173
npm test           # Vitest, 61 testów — uruchamiaj przed każdym commitem
npm run build      # tsc -b && vite build → dist/
npm run typecheck  # same typy
npm run preview    # podgląd produkcyjnego builda
```

Zanim uznasz zmianę za skończoną: `npm test && npm run build`. Build zawiera
sprawdzenie typów, więc łapie więcej niż same testy.

## Architektura

Logika jest celowo oddzielona od Reacta — wszystko, co da się policzyć bez
interfejsu, leży w `src/lib/` jako czyste funkcje i jest otestowane.

```
src/
├── data/ingredients.ts   # ~120 składników: kcal i makro
├── data/recipes.ts       # 42 przepisy
├── lib/
│   ├── nutrition.ts      # BMR (Mifflin-St Jeor), zapotrzebowanie, cel, makro
│   ├── planner.ts        # generowanie planu, porcje, skalowanie do celu
│   ├── preferences.ts    # filtrowanie przepisów pod preferencje
│   ├── shopping.ts       # sumowanie składników → lista zakupów
│   ├── storage.ts        # localStorage, wartości domyślne, eksport/import
│   └── format.ts         # liczby, jednostki, polska odmiana
├── state/store.tsx       # reducer + dane wyliczane (useMemo)
├── components/           # widoki
└── types.ts              # wspólny model danych i słowniki etykiet
```

Stan płynie w jedną stronę: `store.tsx` trzyma `AppState`, wystawia `dispatch`
oraz `derived` (mapy składników i przepisów, cel kaloryczny, lista zakupów).
Komponenty nie liczą nic samodzielnie poza układem widoku.

## Pułapki, o które łatwo się potknąć

Te rzeczy już raz kosztowały błąd — warto ich nie odkrywać drugi raz.

**Ilości w przepisach są na JEDNĄ PORCJĘ.** Skalowanie kaloryczności to
zwykłe mnożenie przez `portions`. Nie ma pola „ile porcji wychodzi z przepisu”.

**Wartości odżywcze składnika odnoszą się do `baseAmount(unit)`** — 100 dla
`g` i `ml`, 1 dla jednostek policzalnych (`szt`, `łyżka`, `ząbek`). Zawsze
przeliczaj przez `ingredientMacros()`, nigdy ręcznie.

**Węglowodany w bazie są przyswajalne, czyli bez błonnika.** Inaczej kalorie
nie zgadzają się z sumą makroskładników. Pilnuje tego test w `data.test.ts`
— jego górna granica (makro nie może tłumaczyć więcej energii niż deklarowane
kcal) łapie realne błędy, dolna jest luźna, bo błonnik z definicji nie jest
ujęty w makro.

**Własne przepisy i składniki nadpisują bazowe po tym samym `id`** — patrz
filtrowanie w `store.tsx`. Jeśli dodasz je bez tego filtra, pozycja pojawi się
w liście dwa razy.

**Reguła `input[type='number'] { width: 100% }` ma wyższą specyficzność niż
klasa.** Dlatego `.portion-input` jest zapisane jako `input.portion-input`.
Zmiana tego rozjeżdża wiersze planu — to był prawdziwy błąd, widoczny dopiero
na zrzucie ekranu.

**Jednostki odmieniaj przez `formatAmount()` / `unitLabel()`**, nigdy przez
sklejanie liczby z nazwą jednostki. Polskie formy są nieregularne
(1 ząbek / 2 ząbki / 11 ząbków / 1,5 ząbka).

**`mergeState()` scala wczytany stan z domyślnym.** Dodając nowe pole do
`AppState` nie trzeba pisać migracji — ale trzeba dopisać jego wartość
domyślną w `defaultState()`, inaczej istniejący użytkownicy dostaną `undefined`.

**`vite.config.ts` ma `base: './'`** — ścieżki w buildzie są względne, dzięki
czemu aplikacja działa też z podkatalogu. Nie zmieniaj bez potrzeby.

**API schowka wymaga bezpiecznego kontekstu.** `ShoppingView` ma zejście do
`execCommand` i okno z tekstem do ręcznego skopiowania — to potrzebne przy
dostępie po HTTP w sieci lokalnej.

## Konwencje

- Interfejs i komentarze po polsku. Nazwy w kodzie po angielsku, poza polami
  modelu dziedzinowego, gdzie polski jest czytelniejszy (`sniadanie`, `przekaska`).
- Komentarze wyjaśniają *dlaczego*, nie *co*. Kod, który tylko powtarza swoją
  treść słowami, jest gorszy od kodu bez komentarza.
- TypeScript w trybie strict, `verbatimModuleSyntax` — typy importuj przez
  `import type`. Brak enumów (`erasableSyntaxOnly`).
- Nowa logika w `src/lib/` idzie z testem. Testy interfejsu nie są wymagane.
- `dist/` i `node_modules/` nie trafiają do repozytorium.

## Wdrożenie

Szczegóły w `README.md`. W skrócie trzy drogi:

- **Docker** — `docker compose up -d --build`, port 8080. Build w Node,
  serwowanie przez nginx, bez Node'a w finalnym obrazie.
- **nginx wprost na serwerze** — `deploy/dieta.conf` do
  `/etc/nginx/sites-available/`, pliki w `/var/www/dieta`.
- **Build lokalnie + rsync** — `./deploy/deploy.sh uzytkownik@serwer`.

Konfiguracje nginx serwują SPA (`try_files … /index.html`), cache'ują
`/assets/` na rok (nazwy mają hash) i wyłączają cache dla `index.html`.

## Znane ograniczenia

Warto o nich pamiętać przy zmianach, zamiast odkrywać je jako „błędy”.

**Brak synchronizacji między urządzeniami.** Dane są w `localStorage`, więc
plan z laptopa nie pojawi się na telefonie. Przenoszenie odbywa się przez
eksport i import JSON w zakładce „Profil”. Prawdziwa synchronizacja wymaga
backendu z kontem użytkownika — świadomie tego nie ma.

**Białko trafia w około 80% celu.** Generator ma premię dla przepisów o
wysokiej gęstości białka (`proteinFit` w `planner.ts`), która poprawiła wynik
z 76% na 81%, ale pula 42 przepisów nie ma dość dań o takiej gęstości, żeby
dowieźć 187 g przy 2337 kcal. Widok dnia pokazuje makro względem celu, więc
niedobór jest widoczny. Realne rozwiązanie to dopisanie wysokobiałkowych
przepisów do `data/recipes.ts`, a nie mocniejsze kręcenie wagami — przy zbyt
silnej premii plan schodzi do samego twarogu i piersi z kurczaka.

**Kaloryczność planu trafia w cel z błędem około 2%** — mierzone na 60
losowaniach. To wystarcza; nie ma potrzeby optymalizować dalej.
