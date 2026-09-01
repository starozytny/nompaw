#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="xubm6823"
REMOTE_HOST="moule.o2switch.net"
REMOTE_PORT=22
REMOTE_PATH="/home/xubm6823/nompaw.fr"
BUILD_ARCHIVE="build.tar.gz"
SSH_KEY="$HOME/.ssh/nompaw_deploy"

BOLD_CYAN="\033[1;36m"
RESET="\033[0m"

step() {
  echo ""
  echo -e "${BOLD_CYAN}==> $1${RESET}"
  echo ""
}

# Filtre le bruit "perl: warning: Setting locale failed..." émis par le shell
# jailé de cPanel sur o2switch (locale C.UTF-8 non installée côté serveur,
# on n'a pas les droits root pour la corriger).
filter_locale_noise() {
  grep -v -E "^perl: warning|LANGUAGE = |LC_ALL = |LANG = |are supported and installed|Falling back to the standard locale" || true
}

SKIP_BUILD=false
RUN_COMPOSER=false
RUN_YARN=false
for arg in "$@"; do
  case "$arg" in
    --no-build) SKIP_BUILD=true ;;
    --composer) RUN_COMPOSER=true ;;
    --yarn) RUN_YARN=true ;;
    *)
      echo "Option inconnue: $arg" >&2
      echo "Usage: $0 [--no-build] [--composer] [--yarn]" >&2
      exit 1
      ;;
  esac
done

if [ "$SKIP_BUILD" = false ]; then
  step "Build des assets (docker)"
  docker-compose exec node yarn build

  step "Compression du build"
  tar czf "$BUILD_ARCHIVE" -C public build

  step "Envoi vers la production"
  scp -i "$SSH_KEY" -P "$REMOTE_PORT" "$BUILD_ARCHIVE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/$BUILD_ARCHIVE" 2>&1 | filter_locale_noise
  rm -f "$BUILD_ARCHIVE"
else
  step "--no-build : build/envoi des assets ignorés"
fi

step "Déploiement côté serveur"
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" bash -s <<REMOTE_SCRIPT 2>&1 | filter_locale_noise
set -e
export LC_ALL=C LANG=C
BOLD_CYAN="\033[1;36m"
RESET="\033[0m"
step() {
  echo ""
  echo -e "\${BOLD_CYAN}--> \$1\${RESET}"
  echo ""
}
cd "$REMOTE_PATH"
if [ "$SKIP_BUILD" = false ]; then
  step "Décompression du build"
  tar xzf "$BUILD_ARCHIVE" -C public
  rm -f "$BUILD_ARCHIVE"
fi
step "Vidage du cache"
php bin/console cache:clear --env=prod --no-debug --ansi
step "git pull"
git -c color.ui=always pull origin deploy
if [ "$RUN_COMPOSER" = true ]; then
  step "composer install"
  composer install --no-dev --optimize-autoloader --no-interaction --ansi
fi
if [ "$RUN_YARN" = true ]; then
  step "yarn install"
  yarn install --frozen-lockfile
fi
step "Migrations Doctrine"
php bin/console doctrine:migrations:migrate --no-interaction --env=prod --ansi
step "Dump des routes JS"
php bin/console fos:js-routing:dump --format=json --target=public/js/fos_js_routes.json --env=prod --ansi
step "Réchauffement du cache"
php bin/console cache:warmup --env=prod --ansi
REMOTE_SCRIPT

step "Terminé."
