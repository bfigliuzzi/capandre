# Capandre — Mission

## Vision

Capandre est une boîte à outils numérique permettant aux enfants d'école élémentaire en France de travailler leurs devoirs et leurs leçons de manière ludique et autonome. L'application est conçue pour fonctionner sur mobile, hors-ligne, et offrir une expérience adaptée aux jeunes utilisateurs.

## Problème

Les enfants du primaire doivent réviser régulièrement leurs dictées, poésies et autres leçons. Les outils existants sont souvent génériques, nécessitent une connexion internet permanente, ou ne sont pas adaptés à un usage autonome par de jeunes enfants. Les parents manquent d'outils simples pour accompagner ces révisions au quotidien.

## Proposition de valeur

- **Offline-first** : l'application fonctionne sans connexion internet
- **Mobile-first** : conçue pour être utilisée sur smartphone et tablette
- **Ludique** : UI colorée et engageante adaptée aux enfants
- **Progressive** : 3 niveaux de difficulté (Découverte, Apprentissage, Maîtrise) pour chaque module
- **Simple** : les parents configurent le contenu, les enfants révisent en autonomie

## Utilisateurs

### Enfant (utilisateur principal)

- Élève d'école élémentaire (CP à CM2, 6-11 ans)
- Utilise les modules de révision de manière autonome
- Interagit avec une UI tactile, ludique et encourageante

### Parent / Adulte (rôle de configuration)

- Saisit le contenu à réviser (mots de dictée, textes de poésie)
- Aide l'enfant à prendre en main l'application au démarrage
- Pas de tableau de bord ni de suivi de progression dans le MVP

## Modules

### MVP

| Module | Description |
|--------|-------------|
| **Dictée** | L'adulte ajoute des mots ou textes. L'enfant les réécrit avec des lettres manquantes selon le niveau. TTS navigateur pour écouter le mot. Correction automatique. |
| **Poésie** | L'adulte saisit le poème. L'enfant apprend par cœur avec masquage progressif des mots. Jokers pour révéler un mot. |
| **Tables de multiplication** | Révision des tables et exercices (De base, Cadencé, Défi) avec étoiles, badges et reprises espacées. |

### Modules futurs

- Conjugaison
- Grammaire
- Langues vivantes (allemand, anglais, portugais)

## Principes directeurs

1. **Offline-first** — Toute fonctionnalité doit marcher sans réseau. La connexion ne sert qu'à synchroniser entre appareils.
2. **Adapté aux enfants** — Gros boutons, feedback visuel immédiat, encouragements, pas de texte complexe.
3. **Progressif** — 3 niveaux de difficulté systématiques (Découverte, Apprentissage, Maîtrise).
4. **Extensible** — Architecture modulaire permettant d'ajouter facilement de nouveaux modules éducatifs.
5. **Authentification facultative** — L'app est utilisable immédiatement, sans inscription.
