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
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm lint         # ESLint
pnpm typecheck    # Vérification des types
pnpm test         # Tests unitaires
pnpm test:watch   # Tests en mode watch
pnpm verify       # lint + typecheck + test + build — à lancer avant tout push
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI + shadcn/ui,
stockage local IndexedDB via `idb`, tests avec Vitest.
Détail complet dans [docs/tech-stack.md](docs/tech-stack.md).

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/sdlc.md](docs/sdlc.md) | Cycle de développement AI-native : les 6 étapes et leurs artefacts |
| [CLAUDE.md](CLAUDE.md) | Connaissance institutionnelle : conventions, commandes, erreurs déjà commises |
| [REVIEW.md](REVIEW.md) | Passes de revue, sévérités, ce qu'on ne rapporte pas |
| [docs/architecture.md](docs/architecture.md) | Couches, routing, base de données, moteurs, parsing |
| [docs/mission.md](docs/mission.md) | Vision, problème, utilisateurs, principes directeurs |
| [docs/domain-model.md](docs/domain-model.md) | Concepts métier et leurs relations |
| [docs/tech-stack.md](docs/tech-stack.md) | Technologies et contraintes techniques |
| [docs/roadmap.md](docs/roadmap.md) | Milestones et features planifiées |
| [docs/backlog.md](docs/backlog.md) | Features non encore planifiées |
| [docs/design-tokens.md](docs/design-tokens.md) | Identité visuelle, couleurs, typographie |
| [docs/dette-conventions.md](docs/dette-conventions.md) | Écarts connus entre les règles et le codebase |

## Contribuer

Le projet suit un cycle AI-native décrit dans [docs/sdlc.md](docs/sdlc.md) :

```text
intent.md → spec.md → plan.md → code → pnpm verify → revue → merge
```

Aucun code n'est écrit avant qu'un `plan.md` soit approuvé. Les modèles sont dans
[intent/_templates/](intent/_templates/). L'agent écrit, l'humain approuve.
