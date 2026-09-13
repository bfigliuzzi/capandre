# Capandre — Architecture

Référence détaillée. Le résumé opérationnel est dans `CLAUDE.md`.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI + shadcn (style
base-nova), stockage IndexedDB via `idb`, tests Vitest.

> Next.js 16 a des breaking changes par rapport aux données d'entraînement des modèles.
> Lire `node_modules/next/dist/docs/` avant d'écrire du code Next.

## Couches et sens des dépendances

```text
app/ , components/          Présentation  (React, "use client")
        ↓
lib/                        Logique métier (TypeScript pur)
        ↓
lib/db/                     Persistance   (IndexedDB)
```

- La logique métier ne dépend ni de React ni d'IndexedDB.
- Les détails d'infrastructure (RNG, horloge, base) sont **injectés en paramètre**,
  jamais importés en dur dans la logique métier.
- Le moteur `lib/multiplication/` est testable sans navigateur.

## Routing

```text
app/layout.tsx              Layout racine (lang="fr", polices, skip link)
app/(app)/layout.tsx        Layout applicatif (client — init DB, AppShell)
app/(app)/page.tsx          Accueil
app/(app)/dictee/           Module Dictée (list, new, [id], [id]/edit, [id]/correction)
app/(app)/poesie/           Module Poésie (list, new, [id], [id]/edit)
app/(app)/tables/           Tables de multiplication (list, revision, exercice,
                            exercice/session, trophees)
```

Tous les composants de page sont `"use client"` et configurent le header via `useSetHeader()`
(titre + lien retour).

## Couches de composants

| Dossier | Rôle |
|---------|------|
| `components/ui/` | Primitives Base UI / shadcn (Button, Input, Textarea, Sidebar, Sheet, AlertDialog…) |
| `components/layout/` | Shell applicatif (AppShell, AppHeader, AppSidebar, HeaderContext) |
| `components/` | Composants de domaine (DictationForm, PoemForm, ContentItem, DifficultySelector, WordPreview, StanzaPreview…) |
| `components/tables/` | Module tables (TablesHome, RevisionView, TablesSetup, MultiplicationSession, BadgeGrid, SessionSummary…) |
| `hooks/` | Hooks partagés (use-countdown, use-document-visibility, use-reduced-motion, use-roving-tabindex, use-sound…) |

### Règles de composants

- Responsabilité unique, composabilité, props explicites avec valeurs par défaut sensées.
  Beaucoup de props = envisager un découpage.
- État local au plus près, remonté seulement s'il est partagé.

## Base de données (IndexedDB via `idb`)

```text
lib/db/schema.ts                     Types : Module, Level, Dictation, Poem, Word, Verse,
                                     Stanza, MultiplicationDifficulty, MultiplicationFactProgress,
                                     MultiplicationSessionRecord, UnlockedBadge, AppSettings
lib/db/database.ts                   getDB() singleton, migrations versionnées (v4)
lib/db/operations.ts                 CRUD : getAll, getAllByIndex, getById, create, update, remove
lib/db/hooks.ts                      useDictations, usePoems, useDictation, usePoem,
                                     useDictationMutations, usePoemMutations, useHasContent
lib/db/seed.ts                       Seed initial (idempotent par enregistrement)
lib/db/multiplication-operations.ts  getFactProgress, getRecentSessions, getUnlockedBadges,
                                     getSettings/putSettings, recordSession (transaction unique)
lib/db/multiplication-hooks.ts       useMultiplicationProgress, useMultiplicationSessions,
                                     useUnlockedBadges, useSettings, useMultiplicationMutations
```

Stores : `modules`, `levels`, `dictations`, `poems`, `multiplicationFacts` (index `by-table`),
`multiplicationSessions` (index `by-date`, `by-difficulty`), `multiplicationBadges`, `settings`.
Indexés par `by-module` là où c'est pertinent.

## Moteur multiplication (`lib/multiplication/`)

Couche de logique pure : ni React, ni IndexedDB.

```text
types.ts           SessionConfig, Question, SessionState, SessionSummary, AnswerOutcome
constants.ts       TABLES, DIFFICULTIES, TIME_LIMITS_MS, MISSING_FACTOR_SHARE, STAR_MEAN_THRESHOLDS
facts.ts           factKey, buildFacts, buildTable, formatFact, factsForTable
random.ts          shuffleWithRng, pickWeightedIndex, randomInt
progress.ts        factWeight, updateProgress, computeTableStars, computeAllTableStars
messages.ts        CORRECT_MESSAGES, STREAK_MESSAGES, SUMMARY_MESSAGES, pickMessage,
                   streakMessage (aucun mot négatif)
session.ts         generateSession, answerQuestion, scheduleRetry, computeSummary, toSessionRecord
session-ui.ts      SessionUiState, SessionAction, sessionUiReducer, mapKeyToAction (clavier)
config-params.ts   parseSessionConfig, encodeSessionConfig (sérialisation des params d'URL)
badges.ts          BadgeDefinition, BADGES (14 badges, jamais révoqués), getBadge, evaluateBadges
index.ts           Exports barrel
__tests__/         describe/it en français, helper test-rng.ts
```

## Parsing (`lib/parsing.ts`)

- `parseWords(text)` — découpe par **virgule ou retour ligne uniquement** (pas par espaces),
  passe en minuscules. « le coq, les oies » → `["le coq", "les oies"]`
- `stripArticle(entry)` — retire les articles français (le, la, l', les, un, une, des, du,
  de la, de l') pour la comparaison de doublons
- `findDuplicates(words, normalize?)` — détecte les doublons avec normaliseur optionnel,
  marque **toutes** les occurrences
- `parseFullText(text)` — découpe par ponctuation française et espaces (mode « texte » de la dictée)
- `parseStanzas(text)` — découpe un poème en strophes sur double retour ligne

## View Transitions

Activées via `next.config.ts` (`experimental.viewTransition`). Recettes CSS dans
`app/globals.css`. `<PageTransition>` enveloppe le contenu de page : glissements
directionnels pour la navigation hiérarchique (`transitionTypes={["nav-forward"]}`),
pas d'animation pour la navigation latérale.

## Styling

Tailwind 4 avec `@theme inline` dans `app/globals.css`. Couleurs en oklch. Mode sombre via
la classe `.dark`. Spécification des tokens : `docs/design-tokens.md` et `docs/design-tokens.css`.

**Typographie**

- Texte de base : 16px (`text-base`)
- Annotations, aides, méta uniquement : 14px (`text-sm`)
- Aucun `text-xs` dans le codebase

**Labels de formulaire**
`font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider`

## Contraintes transverses

- **Offline-first** — toute fonctionnalité marche sans réseau.
- **Mobile-first** — layouts fluides, unités relatives, cibles tactiles 44 × 44 px minimum.
- **Accessibilité WCAG AA** — contraste 4.5:1, navigation clavier complète, structure de
  titres sans saut de niveau, ARIA uniquement quand le HTML sémantique ne suffit pas,
  textes destinés aux technologies d'assistance en français.
- **Performance** — Lighthouse > 90, FCP < 1,5 s, TTI < 3 s, CLS < 0,1, code splitting
  par route, images optimisées, handlers de saisie debouncés.
- **Sécurité** — secrets en variables d'environnement, fichiers `.env` gitignorés,
  `pnpm audit` avant chaque release, entrées utilisateur assainies avant affichage.
