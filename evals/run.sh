#!/usr/bin/env bash
# Collecte les réponses de la CLI claude sur les cas de evals/cases.json.
# Le script COLLECTE, il ne note pas : le jugement contre le champ « attendu » reste humain.
set -uo pipefail

cd "$(dirname "$0")/.."

if ! command -v claude >/dev/null 2>&1; then
  echo "La CLI 'claude' est introuvable. Installe-la ou lance les cas à la main." >&2
  exit 127
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq est requis pour lire evals/cases.json." >&2
  exit 127
fi

filtre="${1:-}"
horodatage="$(date +%Y%m%d-%H%M%S)"
sortie="evals/sorties/$horodatage"
mkdir -p "$sortie"

total=0
while IFS= read -r cas; do
  id="$(jq -r '.id' <<<"$cas")"
  [ -n "$filtre" ] && [ "$id" != "$filtre" ] && continue

  prompt="$(jq -r '.prompt' <<<"$cas")"
  printf '\n\033[1m▸ %s\033[0m\n  %s\n' "$id" "$prompt"

  {
    printf '# Cas : %s\n\n## Prompt\n\n%s\n\n## Attendu\n\n' "$id" "$prompt"
    jq -r '.attendu[] | "- " + .' <<<"$cas"
    printf '\n## Origine\n\n%s\n\n## Réponse\n\n' "$(jq -r '.origine' <<<"$cas")"
  } > "$sortie/$id.md"

  # Plan mode : la session ne doit rien écrire pendant une eval.
  claude -p "$prompt" --permission-mode plan >> "$sortie/$id.md" 2>&1 \
    || printf '\n[la CLI a retourné une erreur, voir ci-dessus]\n' >> "$sortie/$id.md"

  total=$((total + 1))
done < <(jq -c '.[]' evals/cases.json)

if [ "$total" -eq 0 ]; then
  echo "Aucun cas ne correspond à « $filtre »." >&2
  rmdir "$sortie" 2>/dev/null
  exit 1
fi

printf '\n%d cas collecté(s) dans %s\n' "$total" "$sortie"
printf 'Relis chaque sortie contre son champ « Attendu ». Le script ne juge pas.\n'
