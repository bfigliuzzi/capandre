# Plan — Module Dictionnaire

Produit en lecture seule à partir de [`spec.md`](./spec.md). Approuvé par le développeur avant la
première ligne de code.

- **Statut** : approuvé

## Fichiers qui changent

### Outillage de test (prérequis du testing trophy)

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `package.json` | modification | dev : `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `fake-indexeddb`, `tsx` (versions exactes, comme le reste). Script `dictionnaire:build`. |
| `vitest.config.ts` | modification | `include` étendu à `*.test.tsx` ; `jsdom` pour ces fichiers seulement, `node` pour le reste ; fichier de setup. |
| `test/setup-dom.ts` | création | `jest-dom`, `fake-indexeddb/auto`, nettoyage entre tests, `matchMedia` simulé (pour `prefers-reduced-motion` et les largeurs). |
| `test/render-app.tsx` | création | Rend un écran avec ses providers (header, base en mémoire déjà remplie avec le dictionnaire de test). Un seul point d'entrée pour tous les tests d'écran. |

### Logique métier — `lib/dictionnaire/`

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `types.ts`, `constants.ts`, `index.ts` | création | Types de la spec ; `ARTICLES_PAR_PAGE = 8`, `QUESTIONS_PAR_ENTRAINEMENT = 10`, seuils d'étoiles, `DICTIONARY_DATA_VERSION = 1`, abréviations. |
| `collation.ts` | création | Ordre alphabétique d'un dictionnaire français (R4). |
| `pagination.ts` | création | Pages et mots repères (R2, R3), partagée avec le script. |
| `navigation.ts` | création | Première page d'une lettre, page d'un mot, bornes de « aller à la page ». |
| `questions.ts` | création | Un générateur par compétence, avec éligibilité et mauvaises propositions (R16–R22). |
| `training.ts` | création | `createTraining`, `checkAnswer`, `starsFor` (R15, R25). |
| `training-ui.ts` | création | Réducteur pur de l'écran d'entraînement, pages tournées comptées, bouton « Je n'y arrive pas ». |
| `validate.ts` | création | Contrôle de forme du fichier téléchargé. |
| `__tests__/fixtures.ts` | création | Dictionnaire de test : ~40 articles, 5 par page, choisis pour couvrir les cas (accents, plusieurs sens, sans synonyme…). Sert aussi aux tests d'écran. |
| `__tests__/collation.test.ts`, `pagination.test.ts`, `questions.test.ts`, `training.test.ts` | création | Les seuls tests unitaires prévus par la spec. |

### Persistance — `lib/db/`

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `schema.ts` | modification | `ModuleType` + `"dictionary"` ; store `dictionaryPages` ; `AppSettings.dictionaryVersion?`. |
| `database.ts` | modification | `DB_VERSION = 5`, bloc `oldVersion < 5` qui crée le store avec garde `contains`. |
| `seed.ts` | modification | `mod-dictionary`, sans niveau. |
| `dictionary-operations.ts` | création | `installDictionary(db, file)` (vidage + remplissage en une transaction, version notée dans `settings`), `getPage`, `getPageCount`, `findHeadwordPage`, `loadDictionary`. |
| `dictionary-hooks.ts` | création | `useDictionary()` : état `chargement` / `erreur-reseau` / `pret`, déclenche le `fetch` si version absente ou périmée. |
| `index.ts` | modification | Exports. |

### Interface

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `app/(app)/dictionnaire/page.tsx` | création | Accueil du module. |
| `app/(app)/dictionnaire/livre/page.tsx` | création | Le dictionnaire. |
| `app/(app)/dictionnaire/entrainement/page.tsx` | création | Choix des compétences. |
| `app/(app)/dictionnaire/entrainement/session/page.tsx` | création | Les 10 questions et le résumé. |
| `app/(app)/dictionnaire/a-propos/page.tsx` | création | Sources et licence. |
| `components/dictionnaire/*.tsx` | création | `DictionaryLoader`, `DictionaryBook`, `DictionaryPage`, `ArticleView`, `LetterTabs`, `GoToPage`, `SkillPicker`, `TrainingSession`, `OrderWords`, `ChoiceQuestion`, `TrainingSummary`. |
| `components/dictionnaire/__tests__/*.test.tsx` | création | Tests d'intégration : `livre`, `entrainement`, `chargement`, `a-propos`. |
| `app/(app)/page.tsx` | modification | `ModuleCard` Dictionnaire. |
| `components/layout/app-sidebar.tsx` | modification | Entrée de menu. |
| `app/globals.css` | modification | Animation de page tournée (tokens existants, coupée par `prefers-reduced-motion`). |

### Données

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `scripts/dictionnaire/build.ts` | création | Orchestration : télécharger, extraire, filtrer, fusionner, paginer, écrire, afficher les mesures. |
| `scripts/dictionnaire/sources/manulex.ts`, `dicoado.ts`, `wiktionnaire.ts` | création | Une lecture par source, chacune vers le type `Article`. |
| `scripts/dictionnaire/filters.ts`, `merge.ts` | création | Filtres (R28) et fusion (R29), fonctions pures. |
| `scripts/dictionnaire/__tests__/filters.test.ts`, `merge.test.ts` | création | Sur de petits extraits de sources écrits à la main. |
| `scripts/dictionnaire/exclusions.txt` | création | Liste d'exclusion versionnée. |
| `public/dictionnaire/dictionnaire-v1.json` | création | Le fichier livré (CC BY-SA 4.0), produit par le script. |
| `public/dictionnaire/LICENCE.md` | création | Attribution et licence à côté du fichier. |
| `.gitignore` | modification | `/.cache/`. |

### Documentation

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `CLAUDE.md` | modification | Convention de tests : tests d'écran `*.test.tsx` en `jsdom`, testing trophy ; commande `dictionnaire:build`. |
| `.claude/skills/capandre-logique-metier/SKILL.md` | modification | Même chose, § Tests. |
| `docs/architecture.md` | modification | Module dictionnaire, store `dictionaryPages`, dossier `scripts/dictionnaire/`. |

## Ordre des travaux

Les étapes 2 et 3 sont indépendantes et peuvent se faire en parallèle.

1. **Outillage de test.** Installer, configurer, écrire un premier test d'écran trivial sur un
   composant existant (`StarRating`) pour prouver que `jsdom` + `fake-indexeddb` tournent et que
   la suite reste sous 30 s. Rien d'autre ne commence avant.
2. **Logique pure, en TDD.** `types` → `collation` → `pagination` → `navigation` → `questions` →
   `training` → `training-ui` → `validate`. Le dictionnaire de test (`fixtures.ts`) est écrit au
   début de l'étape.
3. **Script de données.** Lecture des trois sources, filtres et fusion en TDD, puis un vrai
   passage complet. **Point d'arrêt** : le script affiche ses mesures (articles, pages, mots
   éligibles par compétence, taille compressée) et je les présente avant de commiter le fichier.
4. **Persistance.** Schéma, migration v5, seed, opérations, hook. Tests via les écrans de
   l'étape 5, pas de test unitaire de la base.
5. **Interface, écran par écran, test d'écran d'abord** : chargement → livre (couverture,
   pages, onglets, aller à la page, animation) → choix des compétences → session (une
   compétence à la fois, dans l'ordre de la spec) → résumé → à propos → accueil et menu.
   Chaque route lit `node_modules/next/dist/docs/` concerné avant d'être écrite.
6. **Accessibilité** : `verificateur-a11y` sur le livre et la session ; corrections.
7. **Prototype du réglage de page** : lancer `pnpm dev`, mesurer sur téléphone (375 px),
   tablette (1024 px paysage) et ordinateur avec les vraies données. Si 8 articles par page ne
   convient pas, changer la constante, relancer le script : rien d'autre ne bouge.
8. **Documentation**, puis `pnpm verify`, puis `revue-code`.

## Risques

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Le dump kaikki fait 392 Mo compressé : téléchargement long, mémoire si on le charge d'un bloc. | forte | Lecture en flux ligne à ligne ; on ne garde que les lemmes de la liste Manulex. Cache local non versionné. |
| L'API du Dico des Ados limite le débit ou change de format. | moyenne | Requêtes par lots avec pause, cache local ; ses données ne sont téléchargées qu'une fois par passage du script. |
| Manulex n'est plus téléchargeable directement (site ancien). | moyenne | Vérifié en début d'étape 3 ; à défaut, je m'arrête et je demande, car changer de liste remet en cause Q15. |
| Trop peu de mots éligibles aux questions de sens (2 sens avec `quizExample`). | moyenne | Mesuré au point d'arrêt de l'étape 3. Si moins de ~100 mots, je le signale avant d'aller plus loin. |
| Fichier livré plus lourd que prévu (> 3 Mo compressé). | faible | Réduire les synonymes à 3, couper les exemples longs ; mesuré au même point d'arrêt. |
| `Intl.Collator("fr")` ne départage pas *cote / côte / coté / côté* dans l'ordre des dictionnaires (accent final d'abord). | moyenne | Départage écrit à la main, couvert par un test unitaire dédié. |
| `jsdom` alourdit la suite au-delà de 30 s. | faible | Environnement réservé aux `*.test.tsx` ; dictionnaire de test de 40 articles. |
| Migration v5 sur une base existante. | faible | Création de store seulement, garde `contains`, comme la v4. Testé en ouvrant une base v4 remplie avec `fake-indexeddb`. |
| `public/` est servi avec `Cache-Control: max-age=0` (doc locale `public-folder.md`). | faible | Sans effet : le fichier n'est lu qu'une fois puis copié en base ; le numéro de version est dans son nom. |

## Preuve

- [x] `pnpm verify` au vert, suite complète sous 30 s (≈ 5 s).
- [x] Tests unitaires : `collation` (*cote, côte, coté, côté* ; *pomme, pomme de terre* ; trait
      d'union ; majuscule), `pagination` (dernière page incomplète, mots repères, page à un seul
      article), `questions` (chaque compétence : éligibilité, mauvaises propositions, R22),
      `training` (10 questions, pas de doublon de mot, répartition, étoiles aux seuils 4/5/6/7/8/9/10),
      `filters` et `merge` du script (R28–R30).
- [x] Tests d'écran : ouvrir le livre, onglet M, page suivante au bouton et à la flèche, aller
      à la page hors bornes, lecture d'un article complet ; entraînement complet de bout en bout
      avec RNG fixé, une question de chaque compétence, correction, étoiles ; chargement
      (succès, absence de réseau, deuxième ouverture sans `fetch`) ; migration depuis une base v4.
- [x] Mesures du script présentées et acceptées au point d'arrêt de l'étape 3 (D1–D3, 2026-10-11).
- [x] `verificateur-a11y` sans constat bloquant sur le livre et la session (2 bloquants corrigés).
- [ ] Vérification manuelle par le demandeur : téléphone, tablette en paysage (deux pages),
      ordinateur ; glissement du doigt ; animation coupée par la préférence système.
- [x] Le travail ne touche aucune couleur nouvelle : uniquement les tokens existants, donc pas
      de tableau de contraste. Si l'étape 5 en ajoute une, le tableau sera ajouté ici.

## Écart à la spec repéré en lisant le code

La spec cite `tables-loader.tsx` comme modèle de `DictionaryLoader`. Ce composant n'est qu'un
indicateur de chargement : `DictionaryLoader` reprend son balisage pour l'état « chargement » et
ajoute lui-même les états « erreur réseau » et « prêt ». Rien ne change dans les exigences.

## Ce qui a été livré, par rapport au plan

- **Décisions au point d'arrêt** : 6 000 articles, 8 par page ; sens du Wiktionnaire gardés tels
  quels ; phrases de question limitées aux vraies phrases (4 mots, ponctuation finale), soit
  306 mots éligibles aux questions de sens. Fichier livré : 630 Ko compressé.
- **Ajouts** : `format.ts` (textes d'un article et d'une page), `skills-param.ts` (compétences
  dans l'URL), `hooks/use-media-query.ts`, `dictionary-routes.tsx`, `dictionary-about.tsx`,
  `test/match-media.ts`. Bouton « Réessayer » sur les erreurs de chargement.
- **Remplacés** : `getPage`, `getPageCount`, `findHeadwordPage` par `loadDictionary`, qui charge
  les 750 pages en mémoire (33 ms mesurées).
- **Outillage** : passage à pnpm 11 (`pnpm-workspace.yaml`, `allowBuilds`) ;
  `@testing-library/dom` et `xlsx` (SheetJS, CDN officiel) en plus des dépendances prévues.
- **Revue** : `revue-code` sans bloquant ; les 6 constats importants corrigés (homographe à cheval
  sur deux pages, synonyme réciproque, R22 sur tout l'article, erreur réseau mal classée, tests
  manquants, fonctions de plus de 30 lignes).

## Approbation

- [x] Développeur — bfigliuzzi, 2026-10-11 (approbation en séance)
