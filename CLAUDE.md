# CLAUDE.md

## Projet

Capandre — boîte à outils numérique offline-first pour les enfants d'école élémentaire
en France (dictées, poésies, tables de multiplication ; à venir : conjugaison, grammaire).

## Règles non négociables

1. **Ce n'est PAS le Next.js que tu connais.** Next.js 16 a des breaking changes par rapport
   aux données d'entraînement. Lis le guide concerné dans `node_modules/next/dist/docs/`
   avant d'écrire du code Next. Tiens compte des avis de dépréciation.
2. **Tout le contenu généré (docs, rapports, commentaires de revue) est en français.**
   Les termes techniques, noms de variables, chemins et noms de patterns restent en anglais.
3. **Aucun code n'est écrit sans `plan.md` approuvé** — voir `docs/sdlc.md`.
4. **La boucle de vérification passe avant tout push** : `pnpm verify`.
5. **`intent/ETAT.md` se lit en ouverture de session, et se met à jour en fin de session
   *s'il y a une unité de travail ouverte*.** Hors feature — configuration, outillage,
   documentation — il n'y a rien à y noter. Détail ci-dessous.

## Commandes

```bash
pnpm dev            # Serveur de développement (WATCHPACK_POLLING=true)
pnpm build          # Build de production
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit (strict, pas de any)
pnpm test           # Vitest, une passe
pnpm test:watch     # Vitest en watch
pnpm verify         # lint + typecheck + test + build — la boucle de feedback
pnpm exec vitest run lib/multiplication/__tests__/session.test.ts   # Un seul fichier
```

## Cycle de développement

`intent.md` → `spec.md` → `plan.md` → code → `pnpm verify` → revue (`REVIEW.md`) → merge.
Détail complet : `docs/sdlc.md`. Modèles : `intent/_templates/`.
L'agent écrit, l'humain approuve — jamais le même acteur pour les deux.

### Avancement — `intent/ETAT.md`

Une ligne par unité de travail : étape, dernière action, date, prochaine étape.
Il indexe, il ne duplique pas — le détail vit dans `intent/<id>/`.

**En ouverture de session**, le lire avant toute autre chose, puis :

1. Annoncer l'état **en une ligne**. Ne pas explorer le codebase pour reconstituer
   ce que le fichier dit déjà.
2. **Proposer** de reprendre la prochaine étape. Ne jamais la commencer sans accord —
   la règle « l'agent écrit, l'humain approuve » vaut aussi pour la reprise.
3. Signaler toute dérive entre le tableau et le contenu réel de `intent/`.

**En fin de session**, mettre à jour la ligne concernée **si une unité est ouverte**.
`ETAT.md` suit les features, pas les commits : un travail de configuration ou d'outillage
n'y crée pas de ligne. Ce qu'une ligne contient : ce qui vient d'être fait en une phrase,
et ce qui vient après. Ni la liste des fichiers, ni le raisonnement — ils sont dans
`plan.md` et dans git.

**Unité terminée** : `git mv intent/<id> intent/DONE-<id>`, puis passer la ligne à
`terminée`. Un `ls intent/` suffit alors à voir ce qui reste ouvert. Le renommage casse
les liens vers l'ancien chemin : vérifier au `grep` avant de commiter.

## Architecture (résumé)

Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Base UI + shadcn (base-nova),
persistance IndexedDB via `idb`.

- `app/(app)/` — routes, toutes `"use client"`, configurées via `useSetHeader()`
- `components/ui/` primitives · `components/layout/` shell · `components/` domaine
- `lib/` logique métier pure · `lib/db/` persistance · `hooks/` hooks partagés
- **Sens des dépendances** : `app`/`components` → `lib` → `lib/db`.
  La logique métier ne dépend ni de React ni d'IndexedDB.
- **Injection** : RNG, horloge et base sont passés en paramètre, jamais importés en dur
  dans la logique métier.

Détail complet : `docs/architecture.md`.

## Conventions de code

- Fonctions < 30 lignes, une responsabilité, early returns (3 niveaux d'imbrication max).
- Immutabilité par défaut (`const`, `readonly`), fonctions pures dès que possible.
- Types explicites sur les API publiques. Pas d'état global ni d'effet de bord caché.
- Pas de code commenté : l'historique git suffit.
- Texte de base 16px (`text-base`), annotations 14px (`text-sm`). **Jamais `text-xs`.**
- Labels de formulaire : `font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider`.
- **Pas d'emoji dans l'interface** : toujours `lucide-react`. Si l'icône est une donnée de
  domaine, `lib/` stocke un nom sémantique (voir `BadgeIconName`) et la couche présentation
  le résout en composant — `lib/` ne dépend pas de React.
- Couleurs, typo et radius via les tokens de `app/globals.css`. Pas de valeur en dur.
- Accessibilité WCAG AA : HTML sémantique, `aria-invalid` + `aria-describedby` + `role="alert"`
  sur les erreurs, roving tabindex sur les radiogroups, `role="status"` sur les zones dynamiques,
  `document.title` mis à jour à la navigation, textes AT en français.
- Tests : `__tests__/[nom].test.ts` à côté de la source, `describe`/`it` en français,
  80 % de couverture sur la logique métier, suite complète sous 30 s.

## Erreurs déjà commises (ne pas recommencer)

> Règle de tenue : quand Claude fait deux fois la même erreur, la correction arrive ici.

- Écrire du code Next.js de mémoire au lieu de lire `node_modules/next/dist/docs/`.
- Dupliquer un composant qui existe déjà : `StarRating` (`components/star-rating.tsx`) rend
  les étoiles pleines **et** vides avec `role="img"` — ne pas réécrire un rendu d'étoiles.
- Découper les mots de dictée par espaces : `parseWords` découpe par **virgule ou retour
  ligne uniquement** (« le coq, les oies » → `["le coq", "les oies"]`).
- Importer React ou `lib/db` depuis `lib/multiplication/` : ce moteur est du TypeScript pur.

## Garde-fous automatiques

`.claude/settings.json` branche des hooks déterministes (`.claude/hooks/`) : chemins protégés,
conventions, rappel de vérification. Un hook qui bloque explique pourquoi.

`etat-session.mjs` (`SessionStart`) injecte l'avancement dans le contexte d'ouverture :
la règle 5 ne dépend donc pas de la bonne volonté de la session. `rappel-verification.mjs`
(`Stop`) rappelle `pnpm verify` et la tenue de `intent/ETAT.md`.

`garde-conventions.mjs` **bloque** `text-xs`, les emoji et les couleurs littérales dans
`app/`, `components/`, `hooks/` et `lib/`. Une exception vraiment justifiée se marque sur
le paragraphe concerné — `// couleur-en-dur: <raison>` ou `// emoji-ui: <raison>` — ce qui
la rend visible en revue. Sans raison écrite, pas d'exception.
Les skills `capandre-*` de `.claude/skills/` portent les politiques (a11y, tokens, logique métier).

## Skills

Deux origines, deux statuts :

- **`capandre-*`** — écrites pour le projet, versionnées dans `.claude/skills/`. Elles font
  autorité : en cas de contradiction avec une skill tierce, c'est elle qui tranche.
- **Tierces** — vendorisées dans `.agents/skills/`, symlinkées, verrouillées par
  `skills-lock.json`. Elles ne s'éditent pas à la main (un hook le bloque).

Une skill tierce n'est gardée que si **(1)** elle fait quelque chose que le cycle du projet
ne fait pas déjà, et **(2)** elle n'écrit pas dans la configuration du projet. C'est à cette
règle qu'on a élagué de 44 à 21 : tout ce qui doublonnait `intent/` → `spec` → `plan`, ou
voulait réécrire `.claude/settings.json`, est sorti.

**Avant de retirer une skill, lire son `SKILL.md`.** Certaines sont des composites de
quelques lignes qui en appellent d'autres : `grill-with-docs` appelle `grilling` et
`domain-modeling`. Retirer une dépendance casse le composite en silence — la description
seule ne le dit pas.

### Frictions connues

Trois skills tierces supposent des conventions que le projet n'a pas. Aucune n'est
bloquante, mais chacune se contourne de la même façon : **le projet fait autorité**.

| Skill | Suppose | Chez nous |
|---|---|---|
| `domain-modeling`, `tdd`, `improve-codebase-architecture` | un `CONTEXT.md` et des ADR dans `docs/adr/` | `docs/domain-model.md` et `docs/architecture.md` |
| `to-*`, `code-review` (retirées) | un issue tracker configuré | `intent/` et `REVIEW.md` |
| `setup-ts-deep-modules` (retirée) | un monorepo `src/packages/` | une app unique |

Quand une skill demande un `CONTEXT.md` absent, lui donner `docs/domain-model.md` et
`docs/architecture.md` — ne pas créer un second glossaire.

### Ce qui a été écarté, et pourquoi

Le chaînage `to-spec` → `to-tickets` → `implement-spec` est un cycle SDLC complet et
fonctionnel, y compris sans issue tracker (il retombe sur un tracker markdown local). Il
apporte une chose que notre cycle n'a pas : des subagents implémenteurs en parallèle sur un
graphe de tickets, chacun dans son worktree. Il est écarté quand même, parce qu'il remplace
`intent/spec/plan` par son propre format : deux formats concurrents, et `intent/ETAT.md`
cesse de dire la vérité. **Un seul cycle.** Si le parallélisme devient nécessaire, il
s'ajoute à `plan.md`, il ne se sous-traite pas à un second cycle.

```bash
npx skills@latest experimental_install   # restaurer l'état exact du lock
npx skills@latest list                   # ce qui est installé
npx skills@latest remove <skill>         # retirer (met le lock à jour)
```

`skills-lock.json` est la source de vérité : un clone neuf se remet à niveau avec
`experimental_install`. Ajouter un paquet entier (`add <owner>/<repo>`) ramène tout son
contenu — repasser la règle ci-dessus et élaguer dans la foulée.
