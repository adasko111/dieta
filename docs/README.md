# Dokumentacja

Materiały pomocnicze. Kontekst potrzebny do pracy nad kodem jest
w `CLAUDE.md` w katalogu głównym — nie tutaj.

| Plik | Co zawiera |
| --- | --- |
| `prompt-nowy-czat.md` | Gotowy prompt na start nowej sesji: skąd pobrać kod i jak z nim pracować. |
| `historia-sesji.md` | Czytelny zapis rozmowy, w której powstała aplikacja — same wypowiedzi, bez wywołań narzędzi. |
| `historia-sesji.jsonl` | Pełny, surowy zapis tej samej sesji w wewnętrznym formacie Claude Code (~2,9 MB). |

## O zapisie sesji

`historia-sesji.jsonl` to archiwum, nie plik do zaimportowania. Nie da się
go „wgrać” do nowej sesji, żeby wznowić rozmowę — format jest wewnętrzny,
a wznawianie sesji na innej maszynie i innym koncie nie jest przewidziane.

Rolę przenośnika kontekstu pełni `CLAUDE.md`. Zapis rozmowy przydaje się
wtedy, gdy trzeba odtworzyć, **dlaczego** coś zostało zrobione tak, a nie
inaczej — na przykład czemu węglowodany w bazie są przyswajalne albo skąd
wzięła się premia za gęstość białka w generatorze planu.
