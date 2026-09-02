# Capandre — Tech Stack

## Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js** | 16.2.2 | Framework React, SSR/SSG, routing |
| **React** | 19.2.4 | Bibliothèque UI |
| **TypeScript** | ^5 | Typage statique |
| **Tailwind CSS** | ^4 | Styling utility-first |
| **shadcn/ui** | latest | Composants UI accessibles (Radix UI) |
| **lucide-react** | ^1.7 | Icônes SVG |
| **Nunito** | Google Fonts | Police titres (ronde, chaleureuse) |
| **Nunito Sans** | Google Fonts | Police corps (lisible) |

## Backend / Services

| Technologie | Rôle |
|-------------|------|
| **Firebase Auth** | Authentification facultative (Google, email) |
| **Firestore** | Base de données NoSQL pour la synchronisation multi-appareils |

> L'authentification et Firestore ne sont pas requis pour le fonctionnement de base. L'app est conçue offline-first avec stockage local.

## Stockage local

| Technologie | Rôle |
|-------------|------|
| **IndexedDB** (via wrapper) | Persistence des données en local pour le mode offline |
| **Service Worker** | Cache des assets et fonctionnement PWA hors-ligne |

## Audio

| Technologie | Rôle |
|-------------|------|
| **Web Speech API (SpeechSynthesis)** | TTS navigateur pour le module Dictée |

## Tests

| Technologie | Rôle |
|-------------|------|
| **Vitest** | Tests unitaires et d'intégration |
| **Playwright** | Tests end-to-end |

## Outils de développement

| Technologie | Rôle |
|-------------|------|
| **pnpm** | Gestionnaire de paquets |
| **ESLint** | Linting (config Next.js) |
| **PostCSS** | Pipeline CSS (plugin Tailwind) |

## Contraintes techniques

- **Offline-first** : toute fonctionnalité doit fonctionner sans connexion réseau
- **Mobile-first** : responsive design optimisé pour smartphones et tablettes
- **PWA** : installable sur l'écran d'accueil, service worker pour le cache
- **Auth facultative** : l'app est utilisable sans inscription ni connexion
- **Synchro optionnelle** : la synchronisation Firestore n'est activée qu'en mode connecté avec un compte
