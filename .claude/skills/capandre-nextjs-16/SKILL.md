---
name: capandre-nextjs-16
description: Rappel et méthode pour écrire du code Next.js 16 dans Capandre, dont les APIs diffèrent des données d'entraînement. À charger avant de créer ou modifier un layout, une page, un route handler, la configuration next.config.ts, ou d'utiliser une API du framework.
---

# Next.js 16 — ce n'est pas le Next.js que tu connais

Le projet tourne sur **Next.js 16.2.2** avec React 19. Cette version a des breaking changes
par rapport aux données d'entraînement des modèles : APIs, conventions et structure de
fichiers peuvent toutes différer.

## Méthode, à chaque fois

1. **Lis le guide concerné dans `node_modules/next/dist/docs/` avant d'écrire.**
   Pas après, pas « si ça casse ». Avant.
2. Tiens compte des avis de dépréciation affichés au build ou au dev : ils décrivent
   l'API réelle de cette version.
3. Si la doc locale contredit ton souvenir, la doc locale a raison.

## Ce que le projet utilise déjà

- **App Router** — `app/layout.tsx` racine (`lang="fr"`, polices, skip link),
  `app/(app)/layout.tsx` applicatif (client, init de la base, AppShell).
- **Toutes les pages sont `"use client"`** et configurent le header via `useSetHeader()`.
  L'application est offline-first : il n'y a pas de rendu serveur de données.
- **View Transitions** — activées par `experimental.viewTransition` dans `next.config.ts`.
  Recettes CSS dans `app/globals.css`, `<PageTransition>` enveloppe le contenu de page.
  Glissements directionnels pour la navigation hiérarchique
  (`transitionTypes={["nav-forward"]}`), pas d'animation pour la navigation latérale.

## Pièges déjà rencontrés

- Écrire une API de mémoire au lieu de lire la doc locale : c'est l'erreur la plus fréquente
  du projet, elle est en tête de `CLAUDE.md`.
- Supposer un rendu serveur : les données vivent dans IndexedDB, côté client uniquement.
