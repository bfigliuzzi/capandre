# Intent — Résorber la dette de conventions pour rendre les règles bloquantes

- **Identifiant** : DETTE-01
- **Demandeur** : bfigliuzzi
- **Date** : 2026-09-13
- **Statut** : approuvé

## Problème

Deux règles écrites du projet — pas d'emoji dans l'interface, pas de couleur en dur — sont
violées par le codebase. À la mise en place du cycle AI-native, les hooks correspondants ont
donc été posés en mode « signalé » plutôt que bloquant, pour ne pas rendre inutilisable
l'édition de 16 fichiers existants.

C'est le mauvais arbitrage. Les règles sont justes ; c'est la codebase qui est en défaut.
Une règle signalée mais non bloquante se re-viole à la session suivante.

## Résultat attendu

Les deux règles sont **bloquantes** dans `.claude/hooks/garde-conventions.mjs`, et le
codebase les respecte intégralement, donc rien de légitime n'est bloqué.

`docs/dette-conventions.md` ne liste plus ces deux dettes.

## Utilisateurs et systèmes concernés

- **Enfant** : l'interface change visuellement — les emoji deviennent des icônes tracées.
  Le sens porté doit rester lisible pour un enfant de 6 à 11 ans.
- **Parent / adulte** : mêmes écrans, mêmes libellés.
- **Modules touchés** : dictée, poésie, tables — 16 fichiers plus `app/globals.css`.
- **Données touchées** : aucune. Aucune migration.

## Contraintes

- Offline-first : inchangé, `lucide-react` est déjà une dépendance et est empaqueté.
- Accessibilité WCAG AA : les emoji actuels sont `aria-hidden` ; les icônes doivent l'être
  aussi. La couleur ne doit jamais devenir seule porteuse d'information.
- Le passage aux tokens doit **corriger** le mode sombre, pas seulement déplacer le problème :
  `app/globals.css` documente déjà `.correction-score--*` comme cassé en dark mode.
- Contraste 4.5:1 à revérifier sur chaque couleur remplacée.

## Questions ouvertes

- [x] Emoji illustratifs et emoji structurants se traitent-ils pareil ?
      → Non : les illustratifs se remplacent sur place, les structurants demandent de changer
      le type de la prop (`string` → `LucideIcon`). Tranché par le demandeur.
- [x] `app/layout.tsx` metadata `theme-color` : hex obligatoire, hors système Tailwind.
      → Exception légitime, à rendre explicite plutôt que silencieuse.

## Approbation

- [x] Demandeur — bfigliuzzi, 2026-09-13
