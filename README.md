# Planer diety

Prywatna aplikacja do planowania jedzenia: kreator ustala cel kaloryczny i
preferencje, generator układa plan tygodnia z przepisów, a lista zakupów
zlicza się sama i można ją odhaczać w sklepie.

Aplikacja jest w całości statyczna — nie ma backendu ani bazy danych.

## Co potrafi

- **Kreator startowy** — 8 kroków: dane, aktywność, cel i tempo, liczba
  posiłków, sposób odżywiania, czego nie jadasz, co lubisz, podsumowanie.
- **Cel kaloryczny** liczony wzorem Mifflina-St Jeora: BMR → zapotrzebowanie
  z aktywnością → korekta na tempo chudnięcia lub budowy masy. Da się też
  wpisać własną liczbę. Wynik nie schodzi poniżej bezpiecznego minimum.
- **Plan tygodnia** — 7 dni × 3–5 posiłków. Generator dobiera przepisy pasujące
  do preferencji i ustawia liczbę porcji tak, by trafić w kaloryczność.
  Można przelosować pojedynczy dzień, zmienić porcje ręcznie albo kliknąć
  „Dopasuj do celu”.
- **Lista zakupów** — składniki ze wskazanych dni, zsumowane, pogrupowane
  działami sklepu, z odhaczaniem, dopisywaniem własnych pozycji, kopiowaniem
  i drukiem.
- **Przepisy** — 42 pozycje w bazie, wyszukiwanie, filtry, oznaczanie
  ulubionych i odrzuconych, dodawanie oraz edycja własnych.
- **Kopia zapasowa** — eksport i import całego stanu do pliku JSON.

## Gdzie są dane — przeczytaj przed wdrożeniem

Wszystko (profil, preferencje, plan, odhaczone zakupy, własne przepisy) siedzi
w `localStorage` **przeglądarki**, a nie na serwerze. Wynikają z tego trzy
rzeczy, o których łatwo zapomnieć:

1. **Postawienie tego na serwerze nie synchronizuje danych między urządzeniami.**
   Plan ułożony na laptopie nie pojawi się na telefonie. Do przeniesienia służy
   eksport i import pliku JSON w zakładce „Profil”.
2. Wyczyszczenie danych witryny w przeglądarce kasuje plan. Warto od czasu do
   czasu pobrać kopię.
3. Serwer nie widzi Twoich danych — nic nigdzie nie jest wysyłane.

Jeśli synchronizacja między urządzeniami okaże się potrzebna, będzie to
wymagało dorobienia backendu z kontem użytkownika — obecna wersja tego nie ma.

## Uruchomienie lokalne

Wymagany Node.js 20.19+ albo 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Pozostałe polecenia:

```bash
npm run build      # sprawdzenie typów + produkcyjny build do dist/
npm run preview    # podgląd zbudowanej wersji
npm test           # testy jednostkowe (Vitest)
npm run typecheck  # same typy
```

## Wdrożenie na serwer Linux

Aplikacja kompiluje się do zwykłych plików statycznych w `dist/`. Wystarczy
je czymkolwiek serwować. Poniżej trzy warianty — wybierz jeden.

### Wariant A: Docker (najprościej)

Na serwerze potrzebny Docker i wtyczka Compose.

```bash
git clone https://github.com/adasko111/dieta.git
cd dieta
docker compose up -d --build
```

Aplikacja słucha na porcie **8080**: `http://adres-serwera:8080`.

Obraz jest dwuetapowy — Node buduje pliki, a finalny obraz to samo nginx
z `dist/` w środku (kilkadziesiąt megabajtów, bez Node'a w produkcji).

Aktualizacja po zmianach w repozytorium:

```bash
git pull
docker compose up -d --build
```

Port zmienisz w `docker-compose.yml` w sekcji `ports`.

### Wariant B: nginx bezpośrednio na serwerze

Bez Dockera. Build wykonuje się na serwerze.

```bash
# Zależności
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Build
git clone https://github.com/adasko111/dieta.git
cd dieta
npm ci
npm run build

# Publikacja plików
sudo mkdir -p /var/www/dieta
sudo cp -r dist/. /var/www/dieta/
sudo chown -R www-data:www-data /var/www/dieta

# Konfiguracja serwera
sudo cp deploy/dieta.conf /etc/nginx/sites-available/dieta
sudo nano /etc/nginx/sites-available/dieta      # ustaw server_name
sudo ln -s /etc/nginx/sites-available/dieta /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Aktualizacja: `git pull && npm ci && npm run build && sudo cp -r dist/. /var/www/dieta/`

### Wariant C: build lokalnie, wysyłka przez rsync

Serwer nie musi mieć Node'a — dostaje gotowe pliki. Wymaga jednorazowego
przygotowania nginx według wariantu B (kroki „Konfiguracja serwera”).

```bash
./deploy/deploy.sh adam@192.168.1.10 /var/www/dieta
```

Skrypt uruchamia testy, buduje i synchronizuje `dist/` na serwer.

### HTTPS

Przy własnej domenie warto dołożyć certyfikat — jest darmowy i zajmuje minutę:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dieta.example.com
```

Certbot sam dopisze sekcję SSL do konfiguracji i ustawi odnawianie.

To nie jest wyłącznie kosmetyka: przycisk „Kopiuj” na liście zakupów korzysta
z API schowka, które przeglądarki udostępniają tylko przez HTTPS albo na
`localhost`. Bez certyfikatu aplikacja pokaże wtedy okno z tekstem do ręcznego
skopiowania — działa, ale mniej wygodnie.

### Dostęp tylko z sieci domowej

Jeśli aplikacja ma być widoczna wyłącznie z LAN-u, dopisz w konfiguracji nginx
wewnątrz bloku `server`:

```nginx
allow 192.168.0.0/16;
allow 10.0.0.0/8;
deny all;
```

## Struktura projektu

```
src/
├── data/          # bazy: składniki (kcal i makro) oraz przepisy
├── lib/           # logika bez Reacta — łatwa do testowania
│   ├── nutrition.ts   # BMR, zapotrzebowanie, cel kaloryczny, makro
│   ├── planner.ts     # generowanie planu, porcje, skalowanie do celu
│   ├── preferences.ts # filtrowanie przepisów wg preferencji
│   ├── shopping.ts    # sumowanie składników w listę zakupów
│   ├── storage.ts     # localStorage, eksport i import
│   └── format.ts      # liczby, jednostki, polska odmiana
├── state/store.tsx    # reducer i wyliczane dane
├── components/        # widoki i elementy interfejsu
└── types.ts           # wspólny model danych
```

## Testy

```bash
npm test
```

Pokrywają liczenie kalorii i makro, generator planu (trafianie w cel,
respektowanie wykluczeń i diety, brak powtórek dzień po dniu), sumowanie listy
zakupów oraz spójność samej bazy — czy przepisy odwołują się do istniejących
składników i czy kalorie zgadzają się z makroskładnikami.

## Uwagi merytoryczne

Wyliczenia są szacunkowe. Wzór Mifflina-St Jeora podaje przybliżenie, a nie
pomiar — realne zapotrzebowanie potrafi się różnić o kilkaset kalorii i najlepiej
skorygować je po dwóch–trzech tygodniach obserwacji wagi.

Wartości odżywcze składników pochodzą z tabel i są zaokrąglone; węglowodany
podane są jako przyswajalne, czyli bez błonnika. Przy konkretnym produkcie
z półki warto zerknąć na etykietę.

Przy chorobach przewlekłych, ciąży lub karmieniu dietę warto skonsultować
z lekarzem albo dietetykiem.
