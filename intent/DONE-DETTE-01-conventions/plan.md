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
- [x] Contrastes mesurés, couple par couple :

| Sélecteur | Texte sur fond | Clair | Sombre | Seuil |
|---|---|---|---|---|
| `.callout-warning` | texte sur fond teinté 18 % | 7,34:1 | 8,56:1 | 4,5:1 |
| `.correction-letter--correct` | lettre sur fond teinté 18 % | 7,44:1 | 7,56:1 | 4,5:1 |
| `.correction-letter--wrong` | lettre sur fond teinté 18 % | 7,80:1 | 8,20:1 | 4,5:1 |
| `.correction-score--*` | « Niveau : … » sur dégradé | 12,37:1 | 11,87:1 | 4,5:1 |
| `.letter-input` | lettre saisie sur `--muted` | 4,54:1 | 5,49:1 | 3:1 (24px gras) |
| `.tts-btn` | libellé sur fond teinté 10 % | 5,03:1 | 6,65:1 | 4,5:1 |
| `.tts-btn:hover` | `--primary-foreground` sur `--primary` | 5,00:1 | 7,21:1 | 4,5:1 |
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

## Constats de revue, corrigés après coup

La revue (`revue-code`) a remonté trois constats *Important* que la première passe avait
manqués. Tous trois vérifiés puis corrigés :

1. **`aria-hidden` perdu sur les étoiles** (`difficulty-selector`, `dictee-exercise`).
   `StarRating` porte `role="img"` + `aria-label`, qui entre dans le nom accessible du
   bouton radio : il s'annonçait « Découverte : 1 étoile sur 3 Découverte ». C'était le
   seul point du diff qui contredisait R4 de sa propre spec. Enveloppe `aria-hidden`
   restaurée, préfixe redondant retiré du `label`.
2. **L'exemption du hook portait sur tout `app/globals.css`**, pas sur les blocs de
   définition de tokens. Il y restait **18 couleurs littérales** — la valeur *claire* de
   `--primary`, `--success` et `--warning` figée hors thème. Conséquence mesurée : les
   lettres saisies dans l'exercice de dictée tombaient à **2,88:1** en mode sombre
   (seuil 3:1) et le libellé du bouton « écouter » à **3,15:1** (seuil 4,5:1).
   L'affirmation « le codebase respecte intégralement les règles » était donc fausse, et
   l'exemption garantissait que rien ne le signalerait. Les 18 littéraux sont passés aux
   tokens, l'exemption est restreinte à `@theme`, `:root` et `.dark`.
3. **La preuve de contraste ne couvrait pas les sélecteurs réécrits les plus visibles.**
   « Niveau : Découverte » sur le dégradé de score était à **3,63:1** — sous AA, et
   dégradé par le diff tout en étant déclaré conforme. Passé en `text-foreground`
   (12,37:1). Le tableau ci-dessus nomme désormais chaque couple mesuré.

Nits corrigés : regex couleur du hook élargie (`#fff`, `#aabbccdd`, `hsl()`, `lab()`
passaient au travers), `Percent` remplacé par `Medal` pour le trophée « Cinq cents »,
icônes de `ModuleCard` et `ContentItem` reprenant la teinte de leur variante, classes
inertes retirées de `word-preview`, commentaire devenu faux supprimé de `globals.css` et
sélecteurs `.correction-score--*` / `.session-score--*` fusionnés — ils étaient devenus
identiques à l'octet près.

Deux constats étaient des règles manquantes plutôt que des remarques ; elles sont entrées
dans `.claude/skills/capandre-accessibilite/SKILL.md` (nom accessible des contrôles) et
`intent/_templates/plan.md` (une preuve de contraste nomme ses couples).

## Approbation

- [x] Développeur — bfigliuzzi, 2026-09-13
