# evals/

Cas de non-régression **du workflow lui-même**, pas du produit. Ils répondent à une
question : est-ce qu'une session Claude, avec le `CLAUDE.md`, les skills et les hooks
actuels, fait ce qu'on attend ?

## Quand les lancer

À chaque modification de `CLAUDE.md`, d'une skill `capandre-*`, d'un hook ou de `REVIEW.md`.
Une configuration qui fait régresser la suite ne se merge pas.

## Alimenter la suite

Chaque incident réel donne un cas, écrit par qui a vécu l'incident. Un cas décrit une
situation vraie du projet, pas un scénario théorique.

## Format

`cases.json` — un tableau d'objets :

| Champ | Rôle |
|-------|------|
| `id` | Identifiant stable |
| `prompt` | Ce qu'on demande à la session |
| `attendu` | Critères d'acceptation, en français, vérifiables à la lecture de la réponse |
| `origine` | D'où vient le cas : incident, revue, règle de `CLAUDE.md` |

## Lancer

```bash
bash evals/run.sh              # tous les cas
bash evals/run.sh nextjs-doc   # un seul cas
```

Le script appelle la CLI `claude` en mode non interactif et écrit les réponses dans
`evals/sorties/`. **Le jugement reste humain** : le script collecte, il ne note pas.
Relire les sorties contre le champ `attendu`.

> Non câblé en CI : ce dépôt n'a pas encore de GitHub Actions. La suite se lance à la main
> avant de merger un changement de configuration.
