# État d'avancement

**Une ligne par unité de travail. La dernière action menée, pas le détail.**

Ce fichier est lu à l'ouverture de session — c'est ce qui évite de redécouvrir où on en est.
Il indexe, il ne duplique pas : le détail vit dans `intent/<id>/`.

Un dossier préfixé `DONE-` est terminé. `ls intent/` suffit donc à voir l'état général.

| Unité | Étape | Dernière action | Le | Prochaine étape |
|---|---|---|---|---|
| `DONE-DETTE-01-conventions` | terminée | Constats de revue corrigés ; 0 emoji et 0 couleur littérale, hook bloquant | 2026-09-13 | Relecture visuelle clair/sombre par le demandeur |

> Le cycle lui-même (artefacts, hooks, skills, subagents, evals) a été posé le 2026-09-13,
> avant que la convention `intent/` existe : il n'a donc pas de dossier. Voir `docs/sdlc.md`.

## Étapes

`intent` → `spec` → `plan` → `code` → `verify` → `revue` → `terminée`

Elles suivent `docs/sdlc.md`. Une unité bloquée porte `bloquée` et la raison en dernière action.

## Tenue

Mise à jour **à la fin de chaque session de travail**, par Claude, avant le commit.
Le hook `Stop` le rappelle quand des sources ont changé sans que ce fichier soit touché.

Ce qu'une bonne ligne contient : ce qui vient d'être fait, en une phrase, et ce qui vient
après. Pas la liste des fichiers, pas le raisonnement — ils sont dans `plan.md` et dans git.

## Terminer une unité

```bash
git mv intent/M2-02-conjugaison intent/DONE-M2-02-conjugaison
```

Puis passer la ligne à `terminée` ici. Le renommage casse les liens pointant vers l'ancien
chemin : vérifier d'un `grep -rn "M2-02-conjugaison" --include=*.md .` avant de commiter.
