# Spec — Résorber la dette de conventions

Découle de `intent.md`. Statut : **approuvée**.

## Exigences

| # | Exigence | Origine | Vérifiable par |
|---|----------|---------|----------------|
| R1 | Aucun emoji dans `app/`, `components/`, `hooks/`, `lib/` | intent § Résultat attendu | `garde-conventions.mjs` bloquant + grep |
| R2 | Aucune couleur littérale hors définition de token | intent § Résultat attendu | `garde-conventions.mjs` bloquant + grep |
| R3 | Les icônes viennent de `lucide-react` | Règle projet, skill `capandre-design-tokens` | revue |
| R4 | Les icônes décoratives restent `aria-hidden` | Skill `capandre-accessibilite` | subagent `verificateur-a11y` |
| R5 | Le mode sombre est correct sur tout ce qui est retouché | intent § Contraintes | vérification manuelle light + dark |
| R6 | Une exception légitime est explicite et motivée dans le code | intent § Questions ouvertes | présence du marqueur, revue |
| R7 | `pnpm verify` au vert | CLAUDE.md règle 4 | la commande |

## Hors périmètre

- Extraire un composant `Callout` partagé pour les 4 encarts d'avertissement dupliqués.
  La duplication est réelle mais c'est un refactor distinct : cette spec remplace les
  couleurs sur place, sans changer la structure.
- Réviser la règle « pas d'emoji » elle-même. Le demandeur l'a confirmée.
- Tout changement de libellé, de parcours ou de contenu pédagogique.

## Conception

### Deux natures d'emoji

**Structurants** — l'emoji est une donnée : champ d'objet ou valeur de prop typée `string`.
Le type change, pas seulement la valeur.

| Emplacement | Aujourd'hui | Devient |
|---|---|---|
| `components/module-card.tsx` | `icon: string` | `icon: LucideIcon` |
| `components/content-item.tsx` | `icon: string` | `icon: LucideIcon` |
| `components/dictee-correction.tsx` | `{ icon: "🏆" }` | `{ Icon: Trophy }` |
| `components/tables/session-summary.tsx` | `{ emoji: "🏆" }` | `{ Icon: Trophy }` |
| `components/tables/difficulty-cards.tsx` | `{ emoji: "🐢" }` | `{ Icon: Turtle }` |
| `components/difficulty-selector.tsx`, `components/dictee-exercise.tsx` | `stars: "⭐⭐"` | `stars: 2` rendu en `<Star>` répétés |

Le cas `stars` mérite une note : une chaîne d'étoiles n'est pas une icône, c'est un **compte**.
Le remplacer par un nombre rend la donnée juste et le rendu dérivé.

**Illustratifs** — l'emoji est écrit en clair dans le JSX, purement décoratif.
Remplacement sur place par le composant d'icône, `aria-hidden` conservé.

### Correspondance des icônes

| Emoji | Icône | Emoji | Icône |
|---|---|---|---|
| 📝 | `NotebookPen` | ⚠️ ⚠ | `TriangleAlert` |
| 📖 | `BookOpen` | ✅ | `CircleCheck` |
| 🔢 | `Calculator` | ❌ | `CircleX` |
| 📚 | `Library` | 👁️ | `Eye` |
| 🎯 | `Target` | 👋 | `Hand` |
| 🏆 | `Trophy` | 🤔 | `CircleHelp` |
| 🎉 | `PartyPopper` | 🔍 | `Search` |
| 💪 | `TrendingUp` | 🔥 | `Flame` |
| 🌱 | `Sprout` | 🐢 | `Turtle` |
| 🤗 | `HeartHandshake` | ⏱️ | `Timer` |
| ⭐ | `Star` | ⚡ | `Zap` |

Toutes vérifiées présentes dans `lucide-react` 1.7.0.

### Couleurs

Les tokens `--success`, `--warning`, `--info`, `--destructive` existent déjà en clair **et**
en sombre dans `app/globals.css`. `.session-score--*` montre déjà le motif à suivre :
`color-mix(in oklab, var(--token) N%, var(--card))`.

| Emplacement | Aujourd'hui | Devient |
|---|---|---|
| `unsaved-changes-banner.tsx`, `dictee-exercise.tsx` ×2, `dictation-form.tsx` | `bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]` | classe `.callout-warning` basée sur `var(--warning)` |
| `dictee-correction.tsx:133-134` | `border-l-[#10B981]` / `border-l-[#EF4444]` + fond hex | `border-l-success` / `border-l-destructive` + `bg-destructive/5` |
| `globals.css` `.correction-score--*` | dégradés hex clairs | `color-mix` sur tokens, comme `.session-score--*` |
| `globals.css` `.correction-letter` | 8 hex, clair et sombre séparés | `color-mix` sur `--success` / `--destructive` |

Le trio ambre revient 4 fois : il devient **une** classe dans `app/globals.css`, ce qui
supprime la duplication sans extraire de composant React.

### Exception explicite

`app/layout.tsx` déclare `theme-color` dans les metadata Next.js : la valeur part dans une
balise `<meta>` lue par le navigateur, elle ne peut pas être une variable CSS.

Le hook accepte un marqueur en commentaire sur la ligne ou juste au-dessus :

```ts
// couleur-en-dur: metadata theme-color, lue par le navigateur hors CSS
"theme-color-light": "#ffffff",
```

Sans marqueur, le hook bloque. Le marqueur exige une raison écrite — il rend l'exception
visible en revue au lieu de la cacher dans une liste d'exclusion.

### Accessibilité

- Toute icône décorative garde `aria-hidden`.
- `dictee-correction.tsx:138` affiche ✅ ou ❌ : la couleur ne doit pas devenir seule
  porteuse de l'information juste/faux. La forme de l'icône (`CircleCheck` vs `CircleX`)
  porte déjà la distinction ; le texte alternatif existant est conservé.
- Les icônes reprennent la taille visuelle des emoji remplacés (`size-*` équivalent aux
  `text-4xl`, `text-5xl`, `text-2xl` actuels).

## Points signalés

| Point | Risque | Décide |
|-------|--------|--------|
| Perte de chaleur visuelle pour un public 6-11 ans : une icône tracée monochrome est plus froide qu'un emoji couleur | Moindre engagement | Demandeur — a tranché : icônes |
| `.correction-score--*` réécrit en tokens change l'apparence en mode clair, pas seulement en sombre | Écart visuel avec les maquettes | Demandeur, à la relecture |

## Approbation

- [x] Demandeur — bfigliuzzi, 2026-09-13
