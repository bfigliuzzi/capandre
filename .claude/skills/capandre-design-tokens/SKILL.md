---
name: capandre-design-tokens
description: Politique de styling de Capandre — tokens Tailwind 4, typographie, iconographie. À charger avant d'écrire du CSS, d'ajouter une classe Tailwind portant une couleur, un radius ou une taille de texte, ou d'ajouter une icône.
---

# Design tokens Capandre

Source de vérité : `app/globals.css` (`@theme inline`, couleurs en oklch, mode sombre via
la classe `.dark`). Spécification lisible : `docs/design-tokens.md`, `docs/design-tokens.css`.

## Règles

1. **Une seule méthodologie** : Tailwind, partout. Pas de CSS module, pas de style inline
   pour ce qu'une utilitaire fait.
2. **Aucune valeur de couleur en dur.** Ni `#RRGGBB`, ni `oklch(...)`, ni `rgb(...)` dans
   un composant. On passe par les tokens (`bg-card`, `text-muted-foreground`, `border-border`).
   Une couleur qui manque s'ajoute comme token dans `app/globals.css`, pas en littéral.
3. **Radius et typographie** : par les tokens également.
4. **Tailles de texte** : `text-base` (16px) pour le corps, `text-sm` (14px) pour les
   annotations, aides et méta. **`text-xs` est interdit** — un hook le bloque.
5. **Labels de formulaire** : toujours
   `font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider`.
6. **Icônes** : `lucide-react` uniquement. Pas d'emoji dans l'interface.
7. **CSS custom minimal** : privilégier les utilitaires plutôt que des overrides.

## Application

Ces règles sont **bloquantes** : `.claude/hooks/garde-conventions.mjs` refuse une écriture
qui introduit un `text-xs`, un emoji ou une couleur littérale dans `app/`, `components/`,
`hooks/` ou `lib/`. Le codebase les respecte intégralement depuis `intent/DETTE-01-conventions/`.

Une exception réellement justifiée — une valeur qui sort du pipeline CSS, comme les metadata
`theme-color` — se marque sur le paragraphe concerné :

```ts
// couleur-en-dur: metadata theme-color, lue par le navigateur hors CSS
"theme-color-light": "#ffffff",
```

Le marqueur exige une raison écrite. Sans raison, pas d'exception.

## Icône comme donnée de domaine

Quand l'icône est portée par le modèle et non par le composant, `lib/` stocke un **nom
sémantique** et la couche présentation le résout. `BadgeIconName` dans
`lib/multiplication/badges.ts` est la référence : `lib/` reste du TypeScript pur, sans
dépendance React, et le catalogue d'icônes vit dans `components/tables/badge-tile.tsx`.

## Composants existants

Avant d'écrire un rendu, vérifier qu'il n'existe pas : `StarRating`
(`components/star-rating.tsx`) rend des étoiles pleines et vides avec `role="img"` et un
libellé complet — jamais la couleur seule.

## Responsive

Mobile-first : partir du mobile, enrichir vers les grands écrans. Largeurs relatives plutôt
que tailles fixes, `rem`/`em` plutôt que des pixels, cibles tactiles 44 × 44 px minimum.
