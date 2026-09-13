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
- **Pas d'emoji dans l'interface** : toujours `lucide-react`.
- Couleurs, typo et radius via les tokens de `app/globals.css`. Pas de valeur en dur.
- Accessibilité WCAG AA : HTML sémantique, `aria-invalid` + `aria-describedby` + `role="alert"`
  sur les erreurs, roving tabindex sur les radiogroups, `role="status"` sur les zones dynamiques,
  `document.title` mis à jour à la navigation, textes AT en français.
- Tests : `__tests__/[nom].test.ts` à côté de la source, `describe`/`it` en français,
  80 % de couverture sur la logique métier, suite complète sous 30 s.

## Erreurs déjà commises (ne pas recommencer)

> Règle de tenue : quand Claude fait deux fois la même erreur, la correction arrive ici.

- Écrire du code Next.js de mémoire au lieu de lire `node_modules/next/dist/docs/`.
- Utiliser `text-xs` — interdit partout, un hook le bloque.
- Mettre un emoji dans un composant au lieu d'une icône `lucide-react`.
- Découper les mots de dictée par espaces : `parseWords` découpe par **virgule ou retour
  ligne uniquement** (« le coq, les oies » → `["le coq", "les oies"]`).
- Importer React ou `lib/db` depuis `lib/multiplication/` : ce moteur est du TypeScript pur.

## Garde-fous automatiques

`.claude/settings.json` branche des hooks déterministes (`.claude/hooks/`) : chemins protégés,
conventions typographiques, rappel de vérification. Un hook qui bloque explique pourquoi.
Les skills `capandre-*` de `.claude/skills/` portent les politiques (a11y, tokens, logique métier).
