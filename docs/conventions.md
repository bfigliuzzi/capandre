# Capandre — Conventions de développement

Règles de qualité applicables au projet. Elles complètent le guide agent
(`CLAUDE.md`) et les règles produit (`docs/mission.md`).

## Architecture

- **Couches** : Présentation (`app/`, `components/`) → Logique métier (`lib/`) → Persistance (`lib/db/`).
- **Sens des dépendances** : la logique métier ne dépend ni de React ni d'IndexedDB.
  Le moteur `lib/multiplication/` est du TypeScript pur, testable sans navigateur.
- **Injection** : les détails d'infrastructure (RNG, horloge, base) sont passés en paramètre,
  jamais importés en dur dans la logique métier.

## Qualité de code

**Lisibilité**

- Noms de variables et de fonctions explicites, qui révèlent l'intention.
- Fonctions de moins de 30 lignes, une seule responsabilité.
- Early returns pour limiter l'imbrication (3 niveaux maximum).
- Constantes nommées plutôt que des valeurs magiques.
- Pas de code commenté : l'historique git suffit.

**Patterns**

- Composition plutôt qu'héritage.
- Fonctions pures dès que possible.
- Immutabilité par défaut (`const`, `readonly`).
- Types explicites plutôt qu'inférence implicite sur les API publiques.
- Pas d'état global ni d'effet de bord caché.

## Composants UI

- **Responsabilité unique** : un objectif clair par composant.
- **Composabilité** : construire les écrans à partir de petits composants.
- **Props explicites** : interface claire, valeurs par défaut sensées.
  Beaucoup de props = envisager un découpage ou de la composition.
- **État local** : garder l'état au plus près, le remonter seulement s'il est partagé.
- **Pas d'emoji dans l'interface** : toujours passer par `lucide-react`.

## CSS

- **Une seule méthodologie** : Tailwind, partout.
- **Design tokens** : couleurs, typographie et radius via les tokens de `app/globals.css`
  (voir `docs/design-tokens.md`). Pas de valeur en dur.
- **CSS custom minimal** : privilégier les utilitaires plutôt que des overrides.

## Responsive

- **Mobile-first** : partir du mobile, enrichir vers les grands écrans.
- **Layouts fluides** : largeurs relatives plutôt que tailles fixes.
- **Unités relatives** : `rem` / `em` plutôt que des pixels.
- **Cibles tactiles** : 44 × 44 px minimum.

## Accessibilité (WCAG AA)

- **HTML sémantique** : éléments natifs (`button`, `nav`, `main`) plutôt que des `div` avec rôle.
- **Navigation clavier** : tout élément interactif est focusable, avec indicateur de focus visible.
- **Contraste** : 4.5:1 minimum pour le texte, jamais la couleur seule comme porteuse d'information.
- **Libellés de formulaire** : chaque champ a un label associé.
- **Structure de titres** : `h1`–`h6` dans l'ordre, sans saut de niveau.
- **Gestion du focus** : modales, contenu dynamique, navigation SPA.
- **ARIA** : uniquement quand le HTML sémantique ne suffit pas.
- **Textes destinés aux technologies d'assistance** : en français.

## Gestion des erreurs

- **Messages utilisateur** : clairs et actionnables, sans détail technique.
- **Fail fast** : vérifier les préconditions tôt.
- **Types d'erreur spécifiques** plutôt qu'un `catch` générique.
- **Traitement centralisé** aux frontières, pas éparpillé.
- **Dégradation gracieuse** : un échec non critique ne casse pas l'application.
- Jamais de `catch` vide ni d'échec silencieux.

## Validation

- **Valider tôt**, avant traitement.
- **Messages spécifiques au champ**, actionnables.
- **Allowlist plutôt que blocklist**.
- **Règles identiques** partout : formulaires, imports, seed.

## Tests

**Pendant le développement**

- Tester les chemins critiques et la logique métier.
- Pas de test sur chaque changement intermédiaire.

**À la complétion d'une feature**

- 80 % de couverture sur la logique métier.
- Chaque fonction publique testée : cas nominal et cas d'erreur.

**Conventions**

- Unitaires : `__tests__/[nom].test.ts` à côté de la source.
- `describe` / `it` rédigés en français.
- Suite unitaire complète sous 30 s.

## Performance

- Score Lighthouse Performance > 90.
- First Contentful Paint < 1,5 s, Time to Interactive < 3 s, CLS < 0,1.
- Code splitting par route, lazy loading sous la ligne de flottaison.
- Images optimisées, handlers de saisie debouncés.

## Sécurité

- **Secrets** en variables d'environnement, jamais dans le code.
- Fichiers `.env` gitignorés pour le développement local.
- `pnpm audit` avant chaque release, dépendances de sécurité mises à jour rapidement.
- Toute entrée utilisateur assainie avant affichage.

## Documentation

**Hiérarchie** : code auto-documenté > commentaires > documentation externe.

- Commentaires réservés à la logique métier non évidente, aux contournements
  (avec référence) et aux algorithmes non triviaux.
- `README.md` à la racine : ce que c'est, comment installer, comment lancer.
- Ne pas documenter l'évident, ne pas tenir de changelog en commentaire.

## Git & CI locale

- **Branches courtes**, descriptions de PR explicites.
- **Messages de commit** : le quoi et le pourquoi.
- **Avant chaque push**, en local :
  1. `pnpm lint` — aucune erreur
  2. `npx tsc --noEmit` — mode strict, pas de `any`
  3. `pnpm exec vitest run` — tous les tests au vert
  4. `pnpm build` — build réussi
