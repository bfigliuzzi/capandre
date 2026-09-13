#!/usr/bin/env bash
# La boucle de feedback de Capandre : ce qu'une session lance pour vérifier son propre
# travail avant toute relecture humaine. Voir docs/sdlc.md § 4.
set -uo pipefail

cd "$(dirname "$0")/.."

echecs=()

etape() {
  local nom="$1"; shift
  printf '\n\033[1m▸ %s\033[0m\n' "$nom"
  if "$@"; then
    printf '\033[32m  ✓ %s\033[0m\n' "$nom"
  else
    printf '\033[31m  ✗ %s\033[0m\n' "$nom"
    echecs+=("$nom")
  fi
}

etape "lint"      pnpm lint
etape "typecheck" pnpm exec tsc --noEmit
etape "tests"     pnpm exec vitest run
etape "build"     pnpm build

printf '\n'
if [ ${#echecs[@]} -eq 0 ]; then
  printf '\033[32mVérification complète au vert.\033[0m\n'
  exit 0
fi

printf '\033[31mÉchecs : %s\033[0m\n' "${echecs[*]}"
printf 'Corrige avant de pousser. Ne conclus pas au vert sans avoir revu cette sortie.\n'
exit 1
