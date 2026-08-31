#!/usr/bin/env bash
#
# Buduje aplikację lokalnie i wysyła gotowe pliki na serwer.
# Nic nie kompiluje się po stronie serwera — leci tam sam katalog dist/.
#
# Użycie:
#   ./deploy/deploy.sh uzytkownik@serwer [katalog-docelowy]
#
# Przykład:
#   ./deploy/deploy.sh adam@192.168.1.10 /var/www/dieta

set -euo pipefail

TARGET="${1:-}"
REMOTE_DIR="${2:-/var/www/dieta}"

if [[ -z "$TARGET" ]]; then
    echo "Użycie: $0 uzytkownik@serwer [katalog-docelowy]" >&2
    exit 1
fi

cd "$(dirname "$0")/.."

echo "▸ Testy"
npm test

echo "▸ Budowanie"
npm run build

echo "▸ Wysyłka na ${TARGET}:${REMOTE_DIR}"
# --delete usuwa ze zdalnego katalogu pliki po starych wdrożeniach.
# Ukośnik po dist/ jest istotny: kopiujemy zawartość, a nie sam katalog.
rsync -avz --delete dist/ "${TARGET}:${REMOTE_DIR}/"

echo "▸ Gotowe. Sprawdź w przeglądarce."
