# REVIEW.md — passes de revue Capandre

Toutes les PR passent le même jeu de passes, dans cet ordre, avec les mêmes seuils.
Constats rédigés en français, ancrés sur `fichier:ligne`, triés du plus grave au moins grave.

## Passes

| # | Passe | Ce qu'on cherche |
|---|-------|------------------|
| 1 | **Correction** | Le code fait-il ce que `spec.md` demande ? Cas limites : liste vide, doublons, texte très long, absence de synthèse vocale, base absente ou migrée. |
| 2 | **Contrat de couches** | `lib/` n'importe ni React ni `lib/db`. `lib/multiplication/` reste du TypeScript pur. RNG, horloge et base injectés, jamais importés en dur. |
| 3 | **Données** | Changement de `lib/db/schema.ts` accompagné d'une migration versionnée. Aucune migration destructive d'une base existante sans décision explicite du demandeur. |
| 4 | **Accessibilité** | HTML sémantique, navigation clavier complète avec focus visible, `aria-invalid` + `aria-describedby` + `role="alert"` sur les erreurs, `role="status"` sur les zones dynamiques, structure de titres sans saut, contraste 4.5:1, textes AT en français. |
| 5 | **Design system** | Tokens de `app/globals.css` uniquement, pas de couleur ni de radius en dur. Pas de `text-xs`. Pas d'emoji dans l'interface : `lucide-react`. Cibles tactiles ≥ 44 px. |
| 6 | **Offline-first** | La fonctionnalité marche sans réseau. Aucun appel réseau sur un chemin critique. |
| 7 | **Contenu enfant** | Messages d'encouragement sans mot négatif, vocabulaire adapté CP–CM2, aucune donnée personnelle collectée ni transmise. |
| 8 | **Tests** | Chaque fonction publique de `lib/` a un cas nominal et un cas d'erreur. `describe`/`it` en français. Correction de bug = test qui échoue écrit en premier. |
| 9 | **Sécurité** | Aucun secret dans le diff. Entrées utilisateur assainies avant affichage. Pas de dépendance ajoutée sans justification dans `plan.md`. |

## Sévérités

- **Bloquant** — casse un comportement existant, perd des données utilisateur, rompt le
  contrat de couches, introduit une régression d'accessibilité, ou expose un secret.
  La PR ne part pas tant que ce n'est pas corrigé.
- **Important** — s'écarte d'une règle écrite de `CLAUDE.md`, de `REVIEW.md` ou d'une skill
  `capandre-*`, sans casser le comportement. À corriger dans cette PR, sauf accord explicite
  pour un suivi tracé.
- **Nit** — préférence de style ou de lisibilité, sans règle écrite derrière.
  **Plafond : 5 nits par revue.** Au-delà, on ne les rapporte pas : c'est le signe qu'il faut
  une règle dans `CLAUDE.md`, pas une liste de remarques.

## Ce qu'on ne rapporte pas

- Le style que le linter ou le formateur gère déjà.
- Le code non touché par le diff, sauf si le diff en révèle un bug actif.
- Des réécritures d'architecture alternatives quand l'approche retenue est approuvée dans
  `plan.md` : si l'approche est contestée, le sujet remonte à la spec, pas à la revue.
- Des suggestions de tests sur du code purement présentationnel sans logique.
- La même remarque plusieurs fois : un constat par cause racine, avec les occurrences listées.

## Boucle

Un constat qui revient sur plusieurs PR n'est pas un constat de revue : c'est une règle
manquante. Elle part dans `CLAUDE.md` (si c'est un rappel) ou dans une skill `capandre-*`
(si c'est une politique), et un hook la rend déterministe quand c'est mécaniquement vérifiable.
