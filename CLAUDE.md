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
5. **`intent/ETAT.md` se lit en ouverture de session et se met à jour en fin de session.**
   C'est ce qui évite de redécouvrir où on en est. Détail ci-dessous.

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

**En fin de session de travail**, mettre à jour la ligne concernée avant de commiter.
Ce qu'elle contient : ce qui vient d'être fait en une phrase, et ce qui vient après.
Ni la liste des fichiers, ni le raisonnement — ils sont dans `plan.md` et dans git.

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
