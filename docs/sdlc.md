# Capandre — Cycle de développement AI-native

Adaptation du [AI-native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook)
au projet. Le cycle remplace les enchaînements linéaires par une boucle dont chaque étape
produit un artefact versionné.

**Principe de gouvernance** : l'agent écrit, l'humain approuve. Jamais le même acteur pour
les deux. Les portes déterministes (hooks, `pnpm verify`) passent avant l'autonomie.

## Vue d'ensemble

| Étape | Artefact | Produit par | Approuvé par |
|-------|----------|-------------|--------------|
| 1. Plan | `intent/<id>/intent.md` | Demandeur + Claude | Demandeur |
| 2. Design | `intent/<id>/spec.md` | Claude, contraint par les skills | Demandeur |
| 3. Build | `intent/<id>/plan.md` puis le code | Claude en plan mode | Développeur |
| 4. Test | tests + `pnpm verify` au vert | Claude | La commande, pas un humain |
| 5. Deploy | diff relu selon `REVIEW.md` | Claude relit, l'humain tranche | Développeur |
| 6. Maintain | nouveau `intent.md` | Scan récurrent | Demandeur |

## 1. Plan — capturer l'intention

Le demandeur décrit le problème avec ses mots ; Claude le restitue en `intent.md`
(problème, résultat attendu, utilisateurs et systèmes concernés, contraintes, questions
ouvertes). L'artefact est versionné, lisible par un humain comme par une machine.

```bash
mkdir -p intent/M2-02-conjugaison
cp intent/_templates/intent.md intent/M2-02-conjugaison/intent.md
```

L'identifiant reprend celui de `docs/roadmap.md` ou de `docs/backlog.md` quand il existe.
Rien ne démarre avant que le demandeur ait approuvé l'`intent.md` (commit ou mention
explicite dans le fichier).

## 2. Design — exigences et conception

Claude produit `spec.md` à partir de l'`intent.md`, contraint par les skills `capandre-*`
qui portent les politiques du projet (accessibilité enfant, design tokens, pureté de la
logique métier, Next.js 16). Les points sensibles sont **signalés explicitement** dans la
spec plutôt que tranchés en silence.

Exigences et conception se font dans une seule session. Le demandeur relit ; tout ce qui
touche au modèle de données, à la vie privée de l'enfant ou au fonctionnement hors-ligne
demande une validation explicite.

## 3. Build — plan mode d'abord

Le travail commence toujours par un plan écrit, produit en **plan mode** (lecture seule) :
`plan.md` liste les fichiers qui changent, l'ordre des travaux, les risques, et la preuve
qui sera apportée. Le développeur approuve le plan avant la première ligne de code.

Ce qui encadre la phase :

- **`CLAUDE.md`** — conventions, commandes, architecture, erreurs déjà commises. Tenu sous
  une page. Règle de tenue : quand Claude fait deux fois la même erreur, la correction y entre.
- **Skills** (`.claude/skills/capandre-*/SKILL.md`) — politique appliquée uniformément d'une
  session à l'autre. On modifie la skill, pas chaque prompt.
- **Hooks** (`.claude/settings.json` + `.claude/hooks/`) — contrôle déterministe. Les skills
  conseillent, les hooks bloquent.
- **Subagents** (`.claude/agents/`) — assistants au contexte et aux outils restreints
  (revue, accessibilité, tests).
- **Sessions parallèles** — un git worktree par tâche indépendante.

## 4. Test — donner une boucle de feedback

Une session doit pouvoir **vérifier son propre travail** avant toute relecture humaine.
La boucle est une seule commande :

```bash
pnpm verify     # lint + typecheck + test + build
```

Règles :

- Pour une correction de bug, **le test qui échoue s'écrit en premier**.
- Un hook rappelle la vérification quand des sources ont changé.
- `evals/` contient les cas de non-régression du workflow lui-même : les modifications de
  `CLAUDE.md`, des skills ou des hooks se valident contre cette suite (`evals/README.md`).
  Chaque incident de production donne lieu à un cas d'eval supplémentaire.

## 5. Deploy — revue et portes d'approbation

Toute PR passe le même jeu de passes de revue, défini dans `REVIEW.md` : mêmes passes, mêmes
seuils de sévérité, mêmes exclusions, pour toutes les PR. Claude relit les PR ; un humain
relit celles de Claude. Les constats récurrents remontent dans `CLAUDE.md` ou dans une skill.

Les hooks servent aussi de portes : conditions versionnées, appliquées à chaque fois pour
tout le monde, avec une explication en cas de refus.

> Non couvert pour l'instant : intégration CI/CD (GitHub Actions, revue automatisée de PR,
> déploiement gaté par environnement). Le reste du cycle fonctionne sans.

## 6. Maintain — refermer la boucle

La détection est **déterministe**, le modèle n'intervient qu'après un seuil :

| Signal | 1σ | 2σ | 3σ |
|--------|----|----|-----|
| Taux d'échec de la suite de tests | journaliser | diagnostiquer (lecture seule) | proposer un correctif |
| Régression Lighthouse / budget de bundle | journaliser | diagnostiquer | proposer un correctif |
| Erreurs de migration IndexedDB | journaliser | diagnostiquer | proposer un correctif |

Un scan récurrent du codebase (sécurité, dépendances, dette) valide ses constats avant de
les rapporter, avec un niveau de confiance. Un petit correctif part en PR ; un constat large
redevient un `intent.md` et repart à l'étape 1. L'historique des scans est la trace d'audit.

## Reprendre entre deux sessions

Une session Claude ne se souvient de rien ; le dépôt, si. `intent/ETAT.md` porte donc
l'état d'avancement — une ligne par unité de travail, la dernière action menée.

Le hook `SessionStart` (`.claude/hooks/etat-session.mjs`) l'injecte dans le contexte
d'ouverture et signale les dérives entre le tableau et le contenu réel de `intent/`.
C'est le même partage que partout ailleurs : `CLAUDE.md` énonce la règle, le hook fait
qu'elle tienne.

Le hook informe ; il ne décide pas. Reprendre le travail reste une proposition que
l'humain accepte — sinon une session pourrait se remettre à écrire du code sans que
personne l'ait demandé, ce que tout le reste du cycle cherche à empêcher.

Le hook `Stop` rappelle la mise à jour quand du travail a eu lieu sans que `ETAT.md` ait
été touché — mais seulement si une unité est ouverte. `ETAT.md` suit les features, pas les
commits : hors feature, il n'y a rien à noter et le rappel ne serait que du bruit.

## Arborescence du workflow

```text
CLAUDE.md                     Connaissance institutionnelle, tenue sous une page
REVIEW.md                     Passes de revue, sévérités, ce qu'on ne rapporte pas
docs/sdlc.md                  Ce document
docs/architecture.md          Architecture détaillée
intent/
  ETAT.md                     Index d'avancement, lu à l'ouverture de session
  _templates/                 Modèles intent.md, spec.md, plan.md
  <id>-<slug>/                Un dossier par unité de travail en cours
    intent.md  spec.md  plan.md
  DONE-<id>-<slug>/           Unité terminée
.claude/
  settings.json               Permissions et hooks
  hooks/                      Scripts de garde-fous déterministes
  agents/                     Subagents (revue, a11y, tests)
  skills/capandre-*/          Politiques du projet
  skills/vercel-*             Skills externes (symlinks vers .agents/skills/)
evals/                        Cas de non-régression du workflow
scripts/verify.sh             La boucle de feedback
```
