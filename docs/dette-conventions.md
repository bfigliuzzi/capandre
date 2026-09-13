# Dette de conventions

Écarts entre les règles écrites (`CLAUDE.md`, skills `capandre-*`) et l'état réel du
codebase, relevés au moment de la mise en place du cycle AI-native.

Le hook `.claude/hooks/garde-conventions.mjs` **signale** ces règles sans bloquer,
précisément parce que la dette existe. Règle de conduite : **ne pas aggraver**.
Tout nouveau code respecte la politique. La résorption passe par un `intent.md` dédié.

## 1. Emoji dans l'interface

**Règle** : pas d'emoji dans l'interface, toujours `lucide-react`.
**État** : 21 emoji distincts dans 10 fichiers, dont des usages structurants
(`components/tables/session-summary.tsx` porte un champ `emoji` dans ses données,
`app/(app)/page.tsx` passe `icon="📝"` à ses cartes de module).

| Fichier | Nature |
|---------|--------|
| `app/(app)/page.tsx` | Icônes de cartes de module |
| `app/(app)/dictee/page.tsx`, `app/(app)/poesie/page.tsx`, `app/(app)/poesie/[id]/page.tsx` | Icônes d'écran |
| `components/onboarding-message.tsx` | Message d'accueil |
| `components/dictee-correction.tsx`, `components/unsaved-changes-banner.tsx` | Retours visuels |
| `components/tables/session-summary.tsx`, `streak-badge.tsx`, `difficulty-cards.tsx` | Récompenses et paliers |

**Note** : la règle mérite peut-être d'être révisée plutôt que la dette résorbée. Les emoji
de récompense s'adressent à des enfants de 6 à 11 ans et `session-summary.tsx` les marque
déjà `aria-hidden="true"`. C'est une décision produit — elle passe par un `intent.md`,
pas par une correction silencieuse.

## 2. Couleurs en dur

**Règle** : couleurs via les tokens de `app/globals.css`, pas de littéral.
**État** : littéraux hexadécimaux dans 5 fichiers.

| Fichier | Valeurs |
|---------|---------|
| `app/layout.tsx:22-23` | `#ffffff`, `#1e1e2e` (metadata `theme-color`) |
| `components/dictee-correction.tsx:133-134` | `#10B981`, `#EF4444`, `#FEF2F2`, un `oklch()` littéral |
| `components/unsaved-changes-banner.tsx:9` | `#FEF3C7`, `#F59E0B`, `#92400E` |
| `components/dictee-exercise.tsx:280,347` | `#FEF3C7`, `#F59E0B`, `#92400E` |
| `components/dictation-form.tsx:246` | `#FEF3C7`, `#F59E0B`, `#92400E` |

Le trio `#FEF3C7` / `#F59E0B` / `#92400E` revient dans trois fichiers : c'est un token
« avertissement » qui manque à `app/globals.css`. Résorption la plus rentable.

## 3. Playwright annoncé, absent

`docs/tech-stack.md` liste Playwright pour les tests end-to-end. Aucun test e2e n'existe,
la dépendance n'est pas installée. Soit on l'ajoute, soit on retire la ligne — pas d'entre-deux.
