# Capandre

Boîte à outils numérique **offline-first** permettant aux enfants d'école élémentaire
en France (CP à CM2) de travailler leurs devoirs et leurs leçons de manière ludique
et autonome, sur mobile comme sur tablette.

## Modules

| Module | État | Description |
|--------|------|-------------|
| **Dictée** | Livré | L'adulte saisit des mots ou un texte. L'enfant les réécrit avec des lettres masquées selon le niveau, avec synthèse vocale et correction automatique. |
| **Poésie** | Livré | L'adulte saisit le poème. L'enfant l'apprend par cœur avec masquage progressif des mots et des jokers pour en révéler un. |
| **Tables de multiplication** | Livré | Révision des tables et exercices (De base, Cadencé, Défi) avec étoiles, badges et reprises espacées. |
| Conjugaison, grammaire, langues vivantes | À venir | Voir la [roadmap](docs/roadmap.md). |

## Principes

- **Offline-first** — toute fonctionnalité marche sans réseau.
- **Mobile-first** — pensé pour le tactile, gros boutons, feedback immédiat.
- **Progressif** — trois niveaux de difficulté par module.
- **Extensible** — architecture modulaire pour ajouter de nouveaux modules.
- **Sans inscription** — l'application est utilisable immédiatement.

## Démarrage

```bash
pnpm install
pnpm dev
```

L'application est disponible sur http://localhost:3000.

## Commandes

```bash
pnpm dev                 # Serveur de développement
pnpm build               # Build de production
pnpm lint                # ESLint
pnpm exec vitest run     # Tests unitaires
pnpm exec vitest --watch # Tests en mode watch
npx tsc --noEmit         # Vérification des types
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI + shadcn/ui,
stockage local IndexedDB via `idb`, tests avec Vitest.
Détail complet dans [docs/tech-stack.md](docs/tech-stack.md).

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/mission.md](docs/mission.md) | Vision, problème, utilisateurs, principes directeurs |
| [docs/domain-model.md](docs/domain-model.md) | Concepts métier et leurs relations |
| [docs/tech-stack.md](docs/tech-stack.md) | Technologies et contraintes techniques |
| [docs/roadmap.md](docs/roadmap.md) | Milestones et features planifiées |
| [docs/backlog.md](docs/backlog.md) | Features non encore planifiées |
| [docs/conventions.md](docs/conventions.md) | Conventions de développement et qualité |
| [docs/design-tokens.md](docs/design-tokens.md) | Identité visuelle, couleurs, typographie |
