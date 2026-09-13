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

## Dette existante

Le codebase porte encore des couleurs en dur et des emoji d'interface, hérités d'avant
cette politique — inventaire dans `docs/dette-conventions.md`. Le hook
`garde-conventions.mjs` les signale sans bloquer. Règle de conduite : **ne pas aggraver**.
Tout nouveau code respecte la politique ; la résorption de la dette passe par un `intent.md`.

## Responsive

Mobile-first : partir du mobile, enrichir vers les grands écrans. Largeurs relatives plutôt
que tailles fixes, `rem`/`em` plutôt que des pixels, cibles tactiles 44 × 44 px minimum.
