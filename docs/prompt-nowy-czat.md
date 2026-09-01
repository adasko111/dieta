# Prompt na start nowej sesji

Historia rozmowy nie przenosi się między maszynami ani między czatami —
kontekst niesie `CLAUDE.md`, który Claude Code wczytuje automatycznie po
uruchomieniu w katalogu repozytorium. Poniższy prompt służy do tego, żeby
świeża sesja od razu wiedziała, gdzie jest kod i jak z nim pracować.

## Pierwsze uruchomienie na nowej maszynie

Skopiuj to do nowego czatu, podmieniając ostatnią linijkę na swoje zadanie:

```text
Pracujesz nad aplikacją „Planer diety" — prywatnym planerem posiłków
z generowaniem listy zakupów. React + TypeScript + Vite, aplikacja
w całości statyczna, dane użytkownika w localStorage przeglądarki.

Kod jest w prywatnym repozytorium https://github.com/adasko111/dieta
Jeśli nie masz go jeszcze lokalnie, pobierz i przygotuj:

    git clone https://github.com/adasko111/dieta.git
    cd dieta
    npm ci
    npm test

Zanim cokolwiek zmienisz, przeczytaj w repozytorium:

- CLAUDE.md — architektura, konwencje i pułapki projektu. Wczytuje się
  automatycznie, ale potwierdź, że go widzisz. Sekcja „Pułapki, o które
  łatwo się potknąć" opisuje błędy, które już raz zostały popełnione.
- README.md — sposoby wdrożenia i praca bezpośrednio na serwerze.
- docs/historia-sesji.md — zapis rozmowy, w której aplikacja powstała.
  Zaglądaj tam tylko wtedy, gdy potrzebujesz uzasadnienia konkretnej
  decyzji projektowej; na co dzień wystarczy CLAUDE.md.

Zasady pracy:
- Zanim uznasz zmianę za skończoną: npm test && npm run build
- Pracuj na gałęzi i commituj małymi krokami.
- Nie edytuj ręcznie katalogu serwowanego przez nginx — trafia tam
  wyłącznie wynik npm run build.
- Jeśli podejmiemy trwałą decyzję (nowa konwencja, świadome
  ograniczenie), dopisz ją do CLAUDE.md, żeby kolejna sesja ją znała.

Zadanie: ZASTĄP TĘ LINIJKĘ TYM, CO MA ZOSTAĆ ZROBIONE
```

## Kolejne sesje na tej samej maszynie

Gdy repozytorium już jest na miejscu, wystarczy uruchomić Claude Code
w jego katalogu — `CLAUDE.md` wczyta się sam:

```bash
cd ~/dieta && claude
```

Wtedy prompt może być zwyczajny, na przykład:

```text
Dodaj do bazy dziesięć wysokobiałkowych przepisów obiadowych.
Trzymaj się konwencji z CLAUDE.md i pilnuj, żeby testy przechodziły.
```

## Co warto sprawdzić na starcie

Jeśli sesja zachowuje się tak, jakby nie znała projektu, prawie zawsze
znaczy to, że została uruchomiona poza katalogiem repozytorium i nie
wczytała `CLAUDE.md`. Szybka weryfikacja:

```bash
pwd            # powinno kończyć się na /dieta
ls CLAUDE.md   # plik musi być widoczny
```
