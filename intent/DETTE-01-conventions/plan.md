# Plan — Résorber la dette de conventions

Produit à partir de `spec.md`. Statut : **approuvé**.

## Fichiers qui changent

| Fichier | Nature | Pourquoi |
|---|---|---|
| `app/globals.css` | modification | `.callout-warning` ajoutée ; `.correction-score--*` et `.correction-letter` repassées sur tokens |
| `app/layout.tsx` | modification | marqueur d'exception sur `theme-color` |
| `app/(app)/page.tsx` | modification | props `icon` → `LucideIcon` |
| `app/(app)/dictee/page.tsx` | modification | emoji illustratif + prop `icon` |
| `app/(app)/poesie/page.tsx`, `app/(app)/poesie/[id]/page.tsx` | modification | idem |
| `components/module-card.tsx`, `components/content-item.tsx` | modification | type de prop `icon` |
| `components/dictee-correction.tsx` | modification | icônes de score, ✅/❌, 🔍, couleurs de bordure |
| `components/dictee-exercise.tsx` | modification | `stars` → nombre, ⚠️ ×3, 📝, encarts ambre |
| `components/difficulty-selector.tsx` | modification | `stars` → nombre |
| `components/dictation-form.tsx`, `components/poem-form.tsx` | modification | ⚠️ 👁️ ❌ + encart ambre |
| `components/unsaved-changes-banner.tsx` | modification | ⚠️ + encart ambre |
| `components/onboarding-message.tsx`, `components/word-preview.tsx` | modification | 👋, ⚠ |
| `components/tables/session-summary.tsx`, `difficulty-cards.tsx`, `streak-badge.tsx`, `quit-session-dialog.tsx`, `tables-home.tsx` | modification | emoji structurants et illustratifs |
| `.claude/hooks/garde-conventions.mjs` | modification | règles bloquantes, plage emoji élargie, marqueur d'exception |
| `docs/dette-conventions.md` | modification | les deux dettes sortent de la liste |
| `CLAUDE.md` | modification | la ligne « emoji » quitte les erreurs déjà commises pour devenir une règle tenue |

## Ordre des travaux

1. **`app/globals.css` d'abord** — `.callout-warning`, `.correction-score--*`,
   `.correction-letter`. Les composants s'appuieront dessus.
2. **Composants structurants** — types de props, puis leurs appelants. Le typecheck
   guide : un appelant oublié ne compile pas.
3. **Emoji illustratifs** — remplacement sur place, `aria-hidden` conservé.
4. **`app/layout.tsx`** — marqueur d'exception.
5. **Hook bloquant en dernier** — une fois le codebase propre, sinon il bloque les
   corrections elles-mêmes.
6. **Documentation** — `docs/dette-conventions.md`, `CLAUDE.md`.
7. **`pnpm verify`** puis relecture light + dark.

## Risques

| Risque | Probabilité | Mitigation |
|---|---|---|
| Le hook bloquant empêche les corrections si activé trop tôt | forte | Étape 5 en dernier, c'est l'objet de l'ordre ci-dessus |
| Un appelant de `icon` oublié | moyenne | `pnpm typecheck` : le passage `string` → `LucideIcon` casse à la compilation |
| Contraste insuffisant après passage aux tokens | moyenne | Vérifier chaque couleur retouchée, light et dark, avant de conclure |
| `.correction-score--*` change d'aspect en mode clair | forte | Signalé dans la spec, à la relecture du demandeur |
| La plage emoji du hook rate des caractères (ex. `⏱` U+23F1) | avérée | Élargir la plage et revérifier par grep sur tout le codebase |

## Preuve

- [x] `pnpm verify` au vert — lint, typecheck, 306 tests, build
- [x] `grep` emoji sur `app components hooks lib` : aucun résultat
- [x] `grep` couleur littérale hors `globals.css` : seul `app/layout.tsx`, marqué en exception
- [x] Le hook bloque `text-xs`, emoji simple, `⏱` (U+23F1), `⭐` (U+2B50), hex, `oklch()`, `rgb()`
- [x] Le hook laisse passer les deux lignes `theme-color` marquées
- [x] Contrastes recalculés : 7,34:1 à 8,56:1 en clair et en sombre (AA exige 4,5:1)
- [ ] Relecture visuelle mode clair et mode sombre — **à faire par le demandeur**

## Écarts au plan

- `lib/multiplication/badges.ts` n'était pas dans la liste initiale : 14 emoji y étaient
  stockés comme données de domaine. Traité par un type `BadgeIconName` résolu en composant
  dans `components/tables/badge-tile.tsx`, pour ne pas faire dépendre `lib/` de React.
- `components/tables/star-rating.tsx` existait déjà et a été remonté en
  `components/star-rating.tsx` : il sert maintenant dictée, poésie et tables. La première
  version de ce travail en dupliquait le rendu, ce qui était une régression de réutilisation.
- La plage emoji du hook a dû être élargie à U+2300–U+23FF et U+1F000–U+1FAFF : la version
  initiale ratait `⏱` et les plans emoji bas.

## Approbation

- [x] Développeur — bfigliuzzi, 2026-09-13
