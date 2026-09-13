# Dette de conventions

Écarts entre les règles écrites (`CLAUDE.md`, skills `capandre-*`) et l'état réel du
codebase.

Une règle n'entre en mode **bloquant** dans `.claude/hooks/garde-conventions.mjs` que
lorsque le codebase la respecte intégralement. Une règle listée ici est donc une règle
qui n'est pas encore tenue — et c'est une anomalie à résorber, pas un état acceptable.

## Résorbé

| Règle | Résorbée par | Statut |
|---|---|---|
| Pas d'emoji dans l'interface | `intent/DETTE-01-conventions/` | **bloquante** |
| Pas de couleur en dur | `intent/DETTE-01-conventions/` | **bloquante** |
| Pas de `text-xs` | jamais violée | **bloquante** |

DETTE-01 a remplacé 35 emoji répartis dans 17 fichiers par des icônes `lucide-react`,
et sorti 37 couleurs littérales vers les tokens de `app/globals.css` — dont 18 qui se
trouvaient **dans `globals.css` lui-même**, hors blocs de tokens, et que la première passe
avait manquées parce que l'exemption portait sur le fichier entier. Au passage :

- `lib/multiplication/badges.ts` stocke désormais un `BadgeIconName` sémantique
  (`"crown"`, `"sprout"`…) au lieu d'un emoji. La couche pure reste sans dépendance React ;
  `components/tables/badge-tile.tsx` résout le nom en composant.
- `.correction-score--*` et `.correction-letter--*` étaient documentées dans `globals.css`
  comme cassées en mode sombre. Passées en `color-mix` sur les tokens sémantiques, elles
  s'adaptent seules : les overrides `.dark` ont disparu.
- Le trio ambre dupliqué dans 4 composants est devenu une classe `.callout-warning`.
- Trois régressions de contraste en mode sombre corrigées, causées par des valeurs claires
  figées : lettres saisies de l'exercice de dictée **2,88 → 5,49:1**, libellé du bouton
  « écouter » **3,15 → 6,65:1**. Et une en mode clair : « Niveau : … » sur le dégradé de
  score, **3,63 → 12,37:1**.
- Tous les couples mesurés sont tabulés dans `intent/DETTE-01-conventions/plan.md`
  § Preuve. Une fourchette globale n'est pas une preuve vérifiable : c'est une règle
  désormais inscrite dans `intent/_templates/plan.md`.

### Exception en vigueur

`app/layout.tsx` — les metadata `theme-color` partent dans une balise `<meta>` lue par le
navigateur, hors CSS : elles ne peuvent pas être des variables. La ligne porte un marqueur
motivé `// couleur-en-dur: …`, seule forme d'exception acceptée par le hook.

Dans `app/globals.css`, seuls `@theme`, `:root` et `.dark` peuvent porter un littéral :
c'est là que les tokens sont **définis**. Partout ailleurs dans le fichier, un littéral fige
la valeur d'un seul thème — c'est précisément ce qui cassait le mode sombre.

## Reste à traiter

### Playwright annoncé, absent

`docs/tech-stack.md` liste Playwright pour les tests end-to-end. Aucun test e2e n'existe,
la dépendance n'est pas installée. Soit on l'ajoute, soit on retire la ligne — pas d'entre-deux.
Aucune règle ni aucun hook ne dépend de ce point.
