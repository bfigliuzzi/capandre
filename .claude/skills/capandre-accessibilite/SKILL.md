---
name: capandre-accessibilite
description: Politique d'accessibilité de Capandre — WCAG AA plus les contraintes propres au public enfant (CP-CM2). À charger avant d'écrire ou de modifier un composant d'interface, un formulaire, une navigation, un état de chargement ou un message d'erreur.
---

# Accessibilité Capandre

Public principal : enfants de 6 à 11 ans, sur mobile et tablette, souvent en autonomie.
L'accessibilité ici couvre les lecteurs d'écran **et** la lisibilité, la taille des cibles
et la clarté du vocabulaire.

## Non négociable

| Règle | Mise en œuvre |
|-------|---------------|
| HTML sémantique d'abord | `button`, `nav`, `main`, `ul`. ARIA uniquement quand le natif ne suffit pas. |
| Titres sans saut de niveau | `h1` → `h2` → `h3`. Un seul `h1` par page. |
| Clavier complet | Tout interactif est focusable, focus visible. Radiogroups : `hooks/use-roving-tabindex`. |
| Erreurs de formulaire | `aria-invalid` + `aria-describedby` + `role="alert"` sur le message. |
| Champs libellés | Un `label` associé par champ, jamais un placeholder seul. |
| Zones dynamiques | `role="status"` sur spinners, bannières, résultats qui apparaissent. |
| Navigation SPA | `document.title` mis à jour, focus déplacé sur le nouveau contenu. |
| Contraste | 4.5:1 minimum. La couleur n'est **jamais** seule porteuse d'information. |
| Cibles tactiles | 44 × 44 px minimum. |
| Taille de texte | Base 16px (`text-base`), annotations 14px (`text-sm`). Jamais `text-xs`. |
| Langue | Tous les textes destinés aux technologies d'assistance sont **en français**. |

## Nom accessible des contrôles

Le nom d'un `button`, d'un `role="radio"` ou d'un lien est calculé **à partir de son
contenu**. Tout ce qui porte un nom accessible à l'intérieur y entre.

- **`role="img"` avec `aria-label` à l'intérieur d'un contrôle : interdit.** Envelopper
  dans `aria-hidden="true"`, sinon le libellé est annoncé deux fois.
  `StarRating` est le cas typique : il impose un `label`, donc chaque appelant doit
  trancher. Dans un radio de difficulté, les étoiles sont décoratives — le nom vient
  du libellé visible.
- Vérifier le nom calculé, pas seulement la présence d'un `aria-label` : un contrôle
  qui s'annonce « Découverte : 1 étoile sur 3 Découverte » a un défaut, pas une amélioration.
- Une icône purement décorative est toujours `aria-hidden`. Une icône qui porte seule
  l'information a un nom accessible — et alors rien d'autre ne doit le répéter.

## Spécifique enfant

- **Vocabulaire** : mots du programme CP–CM2. Pas de terme technique dans l'interface enfant
  (« Recommencer », pas « Réinitialiser la session »).
- **Pas de mot négatif** dans les retours d'exercice. Les messages d'encouragement de
  `lib/multiplication/messages.ts` tiennent cette règle — la respecter pour tout nouveau module.
- **Feedback immédiat** : une action produit une réaction visible tout de suite, pas après
  un chargement silencieux.
- **Erreur ≠ échec** : une mauvaise réponse propose de réessayer, elle ne sanctionne pas.
- **Mouvement** : respecter `hooks/use-reduced-motion` pour toute animation.

## Vérification

Le subagent `verificateur-a11y` passe cette liste sur un écran donné.
La passe 4 de `REVIEW.md` la reprend en revue de PR.
