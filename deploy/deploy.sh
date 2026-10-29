#!/usr/bin/env bash
# FitBook – déploiement sur alwaysdata (hébergement mutualisé, PHP 8.3 + MySQL).
#
# Usage (depuis la racine du dépôt, Git Bash sous Windows) :
#   deploy/deploy.sh                 # build Angular + envoi backend/public + composer + migrations
#   deploy/deploy.sh --no-build      # réutilise frontend/dist existant
#
# Variables (modifiables par l'environnement) :
#   ALWAYSDATA_ACCOUNT  nom du compte alwaysdata (défaut : trinitasnt)
#   REMOTE_DIR          dossier distant du projet (défaut : www/fitbook)
#
# Pré-requis : accès SSH activé dans l'administration alwaysdata (Accès distant > SSH),
# rsync disponible côté client (Git for Windows : installer rsync, ou utiliser scp -r).
set -euo pipefail

ACCOUNT="${ALWAYSDATA_ACCOUNT:-trinitasnt}"
HOST="ssh-${ACCOUNT}.alwaysdata.net"
REMOTE="${ACCOUNT}@${HOST}"
REMOTE_DIR="${REMOTE_DIR:-www/fitbook}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" != "--no-build" ]]; then
  echo "▶ Build Angular (production, apiUrl=/api)"
  (cd "$ROOT/frontend" && npm ci --no-audit --no-fund && npx ng build --configuration production)
fi

echo "▶ Envoi du backend Symfony vers $REMOTE:$REMOTE_DIR/backend"
ssh "$REMOTE" "mkdir -p $REMOTE_DIR/backend"
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete \
    --exclude 'vendor/' --exclude 'var/' --exclude '.env.local' --exclude '.env.*.local' \
    --exclude 'config/jwt/' --exclude '.phpunit.cache/' --exclude 'tests/' \
    --exclude 'public/*.js' --exclude 'public/*.css' --exclude 'public/index.html' --exclude 'public/leaflet/' \
    "$ROOT/backend/" "$REMOTE:$REMOTE_DIR/backend/"
  echo "▶ Envoi du build Angular vers public/"
  rsync -az "$ROOT/frontend/dist/frontend/browser/" "$REMOTE:$REMOTE_DIR/backend/public/"
else
  echo "rsync absent : envoi par scp (plus lent)"
  tar -C "$ROOT" --exclude='backend/vendor' --exclude='backend/var' --exclude='backend/.env.local' \
      --exclude='backend/config/jwt' --exclude='backend/tests' --exclude='backend/.phpunit.cache' -czf /tmp/fitbook-backend.tgz backend
  scp /tmp/fitbook-backend.tgz "$REMOTE:$REMOTE_DIR/"
  ssh "$REMOTE" "cd $REMOTE_DIR && tar -xzf fitbook-backend.tgz && rm fitbook-backend.tgz"
  scp -r "$ROOT/frontend/dist/frontend/browser/." "$REMOTE:$REMOTE_DIR/backend/public/"
fi

echo "▶ Installation côté serveur (composer, clés JWT, migrations, cache)"
ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_SCRIPT'
set -euo pipefail
cd "$1/backend"
if [[ ! -f .env.local ]]; then
  echo "✖ backend/.env.local absent sur le serveur : copier .env.prod.example et le compléter." >&2
  exit 1
fi
export APP_ENV=prod APP_DEBUG=0
composer install --no-dev --optimize-autoloader --no-interaction --no-progress
if [[ ! -f config/jwt/private.pem ]]; then
  php bin/console lexik:jwt:generate-keypair --no-interaction
fi
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
php bin/console cache:clear --no-interaction
php bin/console cache:warmup --no-interaction
echo "✔ Déploiement terminé"
REMOTE_SCRIPT

echo "▶ Vérification HTTP"
BASE="https://fitbook.${ACCOUNT}.alwaysdata.net"
curl -s -o /dev/null -w "GET $BASE/            -> %{http_code}\n" "$BASE/"
curl -s -o /dev/null -w "GET $BASE/api/activities -> %{http_code}\n" "$BASE/api/activities"
