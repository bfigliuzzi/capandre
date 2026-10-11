# Spec — Module Dictionnaire

Découle de [`intent.md`](./intent.md). Produite par Claude, relue par le demandeur.
Vocabulaire : [`CONTEXT.md`](../../CONTEXT.md). Décision structurante :
[ADR 0001](../../docs/adr/0001-dictionnaire-fige-dans-le-depot.md).

- **Statut** : approuvée

## Exigences

### Le dictionnaire

| # | Exigence | Origine | Vérifiable par |
|---|----------|---------|----------------|
| R1 | Le dictionnaire s'ouvre sur sa couverture : titre, nombre total de pages, rappel des sources. | récits 1, 3, 30 | test d'intégration |
| R2 | Chaque page contient `ARTICLES_PAR_PAGE` articles entiers (la dernière page peut en contenir moins). Un article n'est jamais coupé. | intent § Décisions | test unitaire de la pagination |
| R3 | Les mots repères d'une page sont le mot d'entrée de son premier et de son dernier article. | `CONTEXT.md` | test unitaire |
| R4 | Les articles sont rangés dans l'ordre alphabétique d'un dictionnaire français : accents, majuscules et traits d'union ignorés au premier passage, puis départagés (*cote, côte, coté, côté*). | fiche « ranger » | test unitaire |
| R5 | Les numéros de page et les mots repères sont identiques sur tous les appareils et ne dépendent pas de la taille d'écran. | récit 11 | test d'intégration (deux largeurs) |
| R6 | Un onglet par lettre ouvre la première page de cette lettre. Une lettre sans article a un onglet désactivé. | récit 2 | test d'intégration |
| R7 | « Aller à la page » accepte un numéro de 1 au nombre total ; un numéro hors bornes affiche une erreur sans changer de page. | récit 3 | test d'intégration |
| R8 | On tourne les pages par des boutons, par glissement horizontal sur écran tactile et par les flèches gauche et droite du clavier. | récits 4, 15 | test d'intégration (boutons, clavier) ; glissement vérifié à la main |
| R9 | La page tourne avec une animation, absente quand `prefers-reduced-motion` est actif. | récits 7, 8 | test d'intégration (préférence simulée) |
| R10 | À partir de la largeur `lg` en paysage, deux pages se font face (paire à gauche, impaire à droite) ; en dessous, une page à la fois. | récits 9, 10 | vérification manuelle |
| R11 | Sur téléphone, la page s'affiche en une colonne qu'on fait défiler ; numéro et mots repères restent visibles en haut. Texte jamais sous 16 px. | récit 10 | vérification manuelle + `verificateur-a11y` |
| R12 | Un article affiche : mot d'entrée en gras, nature et genre en abrégé (*n. m.*, *v.*, *adj.*…), sens numérotés, un exemple en italique par sens quand il existe, synonymes et contraires. | récit 12, fiche « lire un article » | test d'intégration |
| R13 | Il n'y a aucune recherche par saisie. Seuls les mots d'entrée figurent dans le dictionnaire. | récits 13, 14 | relecture |

### L'entraînement

| # | Exigence | Origine | Vérifiable par |
|---|----------|---------|----------------|
| R14 | Avant de commencer, l'enfant coche les compétences voulues, toutes cochées par défaut. Il en faut au moins une pour commencer. | récit 16 | test d'intégration |
| R15 | Un entraînement compte 10 questions tirées au hasard parmi les compétences cochées, réparties aussi également que possible. Deux questions ne portent pas sur le même mot. | intent § Résultat attendu | test unitaire (RNG injecté) |
| R16 | **Ranger** : 4 ou 5 mots à remettre dans l'ordre, par glisser-déposer ou boutons « monter » et « descendre ». Les mots partagent leurs premières lettres (1 à 3 lettres communes). | récit 17 | unitaire (génération) + intégration (réponse au clavier) |
| R17 | **Chercher** : le dictionnaire s'ouvre sur la couverture ; l'enfant touche l'article demandé. Le nombre de pages tournées est affiché, sans effet sur la note. | récits 18, 19 | test d'intégration |
| R18 | **Lire une page** : sur une page donnée par son numéro, choisir ses mots repères parmi 4 paires, ou dire si un mot s'y trouve (oui / non). Les mauvaises propositions viennent des pages voisines. | récit 20 | unitaire + intégration |
| R19 | **Lire un article** : après avoir trouvé le mot, choisir sa nature, son genre, son nombre de sens, un synonyme, un contraire, ou l'exemple d'un sens donné. | récit 21 | unitaire + intégration |
| R20 | **Sens grâce au contexte** : une phrase est donnée ; après avoir trouvé le mot, l'enfant choisit le numéro du sens qui correspond. | récit 22 | unitaire + intégration |
| R21 | **Utiliser les sens** : après avoir trouvé le mot, l'enfant choisit parmi les phrases celle où le mot a le sens demandé. | récit 23 | unitaire + intégration |
| R22 | Une phrase de question (R20, R21) n'est jamais l'exemple affiché dans l'article. | récit 24 | test unitaire |
| R23 | Toutes les réponses se donnent en touchant l'écran ; aucune saisie de texte. | récit 25 | relecture |
| R24 | La correction s'affiche après chaque question, avec la bonne réponse. Pour « Chercher », le bon article est montré sur sa page. | récit 26 | test d'intégration |
| R25 | À la fin : 3 étoiles à partir de 9 sur 10, 2 à partir de 7, 1 à partir de 5, sinon 0. Pas de chronomètre. | récit 27 | test unitaire |
| R26 | Rien n'est enregistré à la fin d'un entraînement. | intent § Décisions | test d'intégration (base inchangée) |

### Les données

| # | Exigence | Origine | Vérifiable par |
|---|----------|---------|----------------|
| R27 | Un script produit le fichier du dictionnaire à partir de Manulex, du Dico des Ados et du Wiktionnaire (kaikki.org). Le fichier est versionné dans le dépôt. | ADR 0001 | exécution du script + relecture du diff |
| R28 | Le script garde environ 6 000 lemmes Manulex par fréquence ; retire noms propres, mots sans définition, sens marqués vulgaires, vieillis ou argotiques, et les mots d'une liste d'exclusion. 3 sens au plus par article. | intent § Décisions | test unitaire des filtres |
| R29 | Le Dico des Ados est préféré ; le Wiktionnaire ne sert que pour les mots qu'il n'a pas. | intent § Décisions | test unitaire de la fusion |
| R30 | Aucune donnée de Manulex n'est présente dans le fichier livré. | intent § Contraintes | test unitaire (forme du fichier) |
| R31 | Le fichier est téléchargé à la première ouverture du module et copié dans IndexedDB ; ensuite tout marche sans réseau. | récit 28 | test d'intégration (fetch simulé une seule fois) |
| R32 | Pendant la copie, un message « Préparation du dictionnaire… » est annoncé (`role="status"`). Sans réseau à la première ouverture, un message explique qu'il faut être connecté une fois. | récits 28, 29 | test d'intégration |
| R33 | Une page « À propos » cite le Dico des Ados, le Wiktionnaire, Manulex et la licence CC BY-SA 4.0 des données. | récit 30 | test d'intégration |
| R34 | Le module apparaît sur la page d'accueil et dans le menu. | intent § Utilisateurs | test d'intégration |

## Hors périmètre

Repris de `intent.md`, sans ajout :

- Service worker et cache de l'app (M1-13).
- Dictionnaire CP-CE1 plus simple, niveau scolaire par mot.
- Réécriture ou relecture humaine des définitions et des exemples.
- Recherche par saisie, renvoi des formes conjuguées ou accordées.
- Historique des entraînements, badges, suivi parent.
- Prononciation et audio.

## Conception

### Modèle de données

**Le fichier livré** : `public/dictionnaire/dictionnaire-v1.json`, sous CC BY-SA 4.0. Le numéro
de version est dans le nom : changer le contenu, c'est créer `v2` et monter la constante côté
app. Forme :

```ts
interface DictionaryFile {
  readonly version: number;
  readonly articlesPerPage: number;
  readonly pages: readonly DictionaryPage[];
}

interface DictionaryPage {
  readonly number: number;                  // 1, 2, 3…
  readonly guideWords: readonly [string, string];   // mots repères
  readonly articles: readonly Article[];
}

interface Article {
  readonly headword: string;                // mot d'entrée
  readonly nature: Nature;                  // "nom" | "verbe" | "adjectif" | "adverbe" | …
  readonly gender?: "masculin" | "féminin"; // noms seulement
  readonly senses: readonly Sense[];        // 1 à 3
  readonly synonyms: readonly string[];
  readonly antonyms: readonly string[];     // contraires
  readonly source: "dicoado" | "wiktionnaire";
}

interface Sense {
  readonly definition: string;
  readonly example?: string;      // affiché dans l'article
  readonly quizExample?: string;  // réservé aux questions de sens, jamais affiché
}
```

Le découpage en pages est dans le fichier, pas recalculé par l'app : c'est ce qui garantit R5.

**IndexedDB — migration version 5**, non destructive (aucun store existant touché) :

| Store | Clé | Index | Contenu |
|---|---|---|---|
| `dictionaryPages` | `number` | `by-headword` (multiEntry sur les mots d'entrée) | une page par enregistrement |

La version chargée est notée dans l'enregistrement `settings` (`dictionaryVersion`). Si elle
diffère de la constante attendue, la copie est refaite : le store est vidé puis rempli dans une
seule transaction.

**Seed** : `ModuleType` gagne `"dictionary"`, `MODULES` gagne `mod-dictionary`, sans niveau.

### Logique métier — `lib/dictionnaire/`

TypeScript pur, sans React ni `lib/db`, sur le modèle de `lib/multiplication/`. Le RNG est passé
en paramètre.

| Fichier | Rôle |
|---|---|
| `types.ts` | Types ci-dessus, `Skill`, `Question` (union par compétence), `Answer`, `Outcome`. |
| `constants.ts` | `ARTICLES_PAR_PAGE`, `QUESTIONS_PAR_ENTRAINEMENT = 10`, seuils d'étoiles, `DICTIONARY_DATA_VERSION`, abréviations des natures. |
| `collation.ts` | `compareHeadwords(a, b)` : ordre d'un dictionnaire français (R4), via `Intl.Collator("fr")` avec départage explicite. |
| `pagination.ts` | `paginate(articles, perPage)` → pages numérotées avec mots repères (R2, R3). Utilisée par le script ; testée ici. |
| `navigation.ts` | `firstPageOfLetter(pages, letter)`, `pageOfHeadword`, bornes de « aller à la page ». |
| `questions.ts` | Un générateur par compétence, chacun avec sa règle d'éligibilité (ex. « au moins 2 sens avec `quizExample` »). |
| `training.ts` | `createTraining(dictionary, skills, rng)` → 10 questions ; `checkAnswer(question, answer)` → `Outcome` ; `starsFor(score)`. |
| `training-ui.ts` | Réducteur pur de l'écran d'entraînement (phase « chercher », phase « répondre », correction, fin), comme `lib/multiplication/session-ui.ts`. Compte les pages tournées. |
| `validate.ts` | Contrôle la forme du fichier téléchargé avant copie en base. |
| `index.ts` | Barrel d'export. |

**Les compétences** :

| `Skill` | Question | Éligibilité | Mauvaises propositions |
|---|---|---|---|
| `ranger` | 4 ou 5 mots à ordonner | — | — |
| `chercher` | « Trouve *renard* » | tout article | — |
| `lire-page` | mots repères de la page N, ou « *X* est-il sur cette page ? » | toute page sauf la dernière | paires et mots des pages N−1 et N+1 |
| `lire-article` | nature, genre, nombre de sens, synonyme, contraire, exemple du sens k | selon le champ demandé (synonyme seulement si l'article en a…) | natures voisines ; mots d'autres articles de même nature |
| `sens-contexte` | phrase = `quizExample` du sens k ; choisir k | ≥ 2 sens ayant un `quizExample` | les autres numéros de sens |
| `utiliser-sens` | choisir la phrase où le mot a le sens k | idem | `quizExample` des autres sens |

Pour `lire-article`, `sens-contexte` et `utiliser-sens`, la question commence par une phase
« chercher » (Q10 du cadrage), puis l'article trouvé reste affiché pendant la réponse.

**Le script** : `scripts/dictionnaire/`, lancé à la main (`pnpm dictionnaire:build`). Il télécharge
les sources dans un cache non versionné (`.cache/dictionnaire/`, ignoré par git), extrait, filtre,
fusionne, appelle `paginate` de `lib/dictionnaire/`, puis écrit le fichier livré. Il mesure et
affiche : nombre d'articles, de pages, d'articles éligibles par compétence. La liste d'exclusion
de mots est un fichier texte versionné à côté du script.

### Interface

Routes dans `app/(app)/dictionnaire/`, toutes `"use client"` avec `useSetHeader()`, composants
dans `components/dictionnaire/`. Chaque route lit le Next.js 16 local avant d'être écrite.

| Route | Écran |
|---|---|
| `/dictionnaire` | Accueil du module : « Ouvrir le dictionnaire », « M'entraîner », « À propos ». |
| `/dictionnaire/livre` | Le dictionnaire, ouvert sur la couverture. |
| `/dictionnaire/entrainement` | Choix des compétences (cases à cocher), bouton « Commencer ». |
| `/dictionnaire/entrainement/session` | Les 10 questions, puis le résumé avec étoiles. |
| `/dictionnaire/a-propos` | Sources et licence. |

**États** : chargement (copie en cours), erreur réseau à la première ouverture, prêt. Un
composant `DictionaryLoader` les gère pour toutes les routes du module, comme `tables-loader.tsx`.

**Composants** : `DictionaryBook` (couverture, pages, onglets, aller à la page, animation),
`DictionaryPage`, `ArticleView`, `LetterTabs`, `GoToPage`, `SkillPicker`, `TrainingSession`,
`OrderWords` (ranger), `ChoiceQuestion`, `TrainingSummary`.

**Réutilisés** : `StarRating` (résumé), `ModuleCard` (accueil), `usePrefersReducedMotion`,
`hooks/use-roving-tabindex` (choix de réponse), le RNG de test de `lib/multiplication/`.

**Onglets sur téléphone** : 26 onglets de 44 px ne tiennent pas sur la tranche. Sous `md`, un
bouton « Lettres » ouvre une grille des 26 lettres ; à partir de `md`, les onglets sont sur le
bord de la page.

### Accessibilité

- **Titres** : `h1` « Dictionnaire » ; chaque page affichée est une `section` avec un `h2`
  « Page 42, de *mouton* à *moutarde* » ; chaque article a un `h3` (le mot d'entrée). On
  navigue ainsi d'article en article au lecteur d'écran.
- **Abréviations** : affichées telles quelles (c'est ce qu'on apprend à lire), doublées d'un texte
  réservé aux lecteurs d'écran (« nom masculin »).
- **Tourner la page** : boutons « Page précédente » / « Page suivante » nommés, flèches du clavier.
  Après chaque changement, `role="status"` annonce « Page 43 sur 750, de *moutarde* à *moyen* »
  et `document.title` suit.
- **Aller à la page** : champ libellé, `aria-invalid` + `aria-describedby` + `role="alert"` hors
  bornes.
- **Onglets** : `nav` « Lettres », boutons nommés « Lettre M » ; onglet sans article
  `aria-disabled`.
- **Ranger** : liste ordonnée ; chaque mot a « Monter *balle* » / « Descendre *balle* » ; chaque
  déplacement est annoncé (« *balle* en position 2 sur 5 »). Le glisser-déposer n'est qu'un
  raccourci.
- **Choix de réponse** : `radiogroup` avec roving tabindex, bouton « Valider ».
- **Correction** : `role="status"`, jamais la couleur seule (icône + texte « Bonne réponse » /
  « La bonne réponse était… »).
- **Étoiles** : `StarRating` avec un `label` en français.
- **Animation** : coupée par `prefers-reduced-motion`.

### Tests — testing trophy

« Write tests. Not too many. Mostly integration. » Répartition :

| Couche | Contenu | Outils |
|---|---|---|
| Statique | `tsc` strict, ESLint ; `validate.ts` contrôle le seul fichier venu de l'extérieur. | existants |
| **Intégration** (l'essentiel) | Les écrans du module rendus avec une base IndexedDB en mémoire et un petit dictionnaire de test (~40 articles, 5 par page). On agit comme l'enfant : onglet, page suivante, aller à la page, toucher un article, cocher des compétences, répondre, voir la correction, lire les étoiles. Couvre R1, R5–R9, R12, R14, R16–R21, R24, R26, R31–R34. | `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fake-indexeddb` (nouvelles dépendances de dev) |
| Unitaire (peu) | Seulement les règles qu'un test d'écran laisserait passer : ordre alphabétique (R4), pagination et mots repères (R2, R3), éligibilité et mauvaises propositions (R15, R18–R22), étoiles (R25), filtres et fusion du script (R28–R30). | Vitest, `test-rng.ts` |
| Bout en bout | Aucun dans cette unité : utile quand M1-13 rendra l'app entière hors ligne. | — |

Les tests d'écran tournent dans `jsdom` (fichiers `*.test.tsx`), les tests de logique restent en
`node`. La suite complète doit rester sous 30 s. `CLAUDE.md` et la skill
`capandre-logique-metier` sont mis à jour pour décrire les tests d'écran.

## Points signalés

| Point | Risque | Décide |
|---|---|---|
| **Une colonne par page, et non deux.** Deux pages côte à côte en deux colonnes chacune font 4 colonnes d'environ 230 px sur une tablette de 1024 px : illisible en 16 px. Je propose une colonne par page, deux pages côte à côte. | Moins fidèle au papier | Demandeur |
| **`ARTICLES_PAR_PAGE = 8`**, soit environ 750 pages pour 6 000 mots. Un article fait 3 à 10 lignes : une page n'a donc pas une hauteur fixe et peut défiler, y compris sur ordinateur. Valeur à confirmer sur un prototype avec les vraies données. | Pages trop longues ou trop courtes | Demandeur, sur prototype |
| **Mauvais article touché pendant « chercher »** : « Ce n'est pas *renard*, continue à chercher. » L'enfant peut réessayer sans limite. Un bouton « Je n'y arrive pas » montre le bon article et compte la question fausse. Pour les questions en deux temps, la partie « répondre » se joue ensuite normalement. | Une question jamais terminée si pas de bouton d'abandon | Demandeur |
| **Contenu non relu** (choix MVP) : le filtrage par marques du Wiktionnaire ne retire pas tout ce qui est inadapté à un enfant. La liste d'exclusion se complète à la main au fil des signalements. | Définition choquante ou incompréhensible affichée à un enfant | Demandeur |
| **Migration IndexedDB v5** : création d'un store, aucune donnée existante modifiée. Le sdlc demande une validation explicite pour tout changement de modèle de données. | Faible | Demandeur |
| **Nouvelles dépendances de dev** (4) et changement de la convention de tests dans `CLAUDE.md`. | Suite plus lente | Demandeur |
| **Première ouverture en ligne obligatoire** (~2 Mo compressés à confirmer par le script). | Module vide sans réseau à la première ouverture | Accepté au cadrage (Q14) |

## Approbation

- [x] Demandeur — bfigliuzzi, 2026-10-11 (approbation en séance, recommandations des 5 points signalés retenues)
