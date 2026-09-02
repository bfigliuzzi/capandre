# Capandre — Roadmap

## Milestones

### M1 — MVP : Dictée & Poésie

> Objectif : une app fonctionnelle offline avec les deux premiers modules de révision.

| ID | Feature | Description | Priorité |
|----|---------|-------------|----------|
| M1-01 | Structure app | Layout principal, navigation entre modules, écran d'accueil | Critique |
| M1-02 | Stockage local | Persistence des données en local (IndexedDB / localStorage) | Critique |
| M1-03 | Gestion du contenu (parent) | Interface pour ajouter/modifier/supprimer des mots de dictée et des poésies | Critique |
| M1-04 | Module Dictée — Découverte | Exercice avec quelques lettres manquantes | Critique |
| M1-05 | Module Dictée — Apprentissage | Exercice avec 3/4 des lettres manquantes | Critique |
| M1-06 | Module Dictée — Maîtrise | Exercice avec toutes les lettres manquantes | Critique |
| M1-07 | Module Dictée — TTS | Synthèse vocale navigateur pour écouter le mot | Critique |
| M1-08 | Module Dictée — Correction | Correction automatique avec retour visuel sur les erreurs | Critique |
| M1-09 | Module Poésie — Découverte | Texte avec quelques mots masqués | Critique |
| M1-10 | Module Poésie — Apprentissage | Texte avec la majorité des mots masqués | Critique |
| M1-11 | Module Poésie — Maîtrise | Texte entièrement masqué | Critique |
| M1-12 | Module Poésie — Jokers | Révéler un mot en appuyant dessus | Critique |
| M1-13 | PWA / Offline | Service worker, manifest, fonctionnement hors-ligne complet | Critique |
| M1-14 | UI ludique | Design coloré et engageant adapté aux enfants | Important |

**M1-01 à M1-08 :** ✅ Livrés.

### M2 — Maths & Français

> Objectif : enrichir la boîte à outils avec de nouveaux modules éducatifs.

| ID | Feature | Description | Priorité |
|----|---------|-------------|----------|
| M2-01 | Module Tables de multiplication | Révision des tables + exercices (De base / Cadencé / Défi) avec étoiles, badges et reprises espacées | Important |
| M2-02 | Module Conjugaison | Révision des conjugaisons par temps et groupe | Important |
| M2-03 | Firebase Auth | Authentification facultative (Google, email) | Important |
| M2-04 | Synchro multi-appareils | Synchronisation Firestore quand connecté | Important |

**M2-01 :** ✅ Livré — moteur `lib/multiplication/`, routes `app/(app)/tables/`.

### M3 — Langues & Grammaire

> Objectif : étendre aux langues vivantes et à la grammaire.

| ID | Feature | Description | Priorité |
|----|---------|-------------|----------|
| M3-01 | Module Grammaire | Exercices de grammaire française | Normal |
| M3-02 | Module Langues — Anglais | Vocabulaire et exercices en anglais | Normal |
| M3-03 | Module Langues — Allemand | Vocabulaire et exercices en allemand | Normal |
| M3-04 | Module Langues — Portugais | Vocabulaire et exercices en portugais | Normal |
