# Capandre — Design Tokens

## Identité visuelle

**Ambiance** : Playful & Accessible — chaleureuse, douce, invitante, adaptée aux enfants (6-11 ans) sans être tape-à-l'œil.

**Priorité** : Accessibilité WCAG AA sur tous les modes (light et dark).

**Stack** : Tailwind CSS 4 + shadcn/ui + lucide-react. Tokens définis comme CSS custom properties au format OKLCH dans `app/globals.css`, consommés nativement via les classes utilitaires Tailwind (`bg-primary`, `text-muted-foreground`, etc.).

## Couleurs

| Rôle | Couleur | HEX (référence) | Usage |
|------|---------|------------------|-------|
| Primary | Indigo doux | `#5A69BF` | Boutons principaux, liens, focus ring |
| Secondary | Corail chaud | `#E57343` | CTA secondaires, accents chaleureux |
| Neutral | Gris-bleu | `#686F7D` | Texte, bordures, fonds |
| Destructive | Rouge | `#C93B3B` | Erreurs, suppression |
| Success | Vert | `#2D8A4E` | Validation, réussite |
| Warning | Ambre | `#C2850C` | Avertissements |
| Info | Bleu | `#3B82C9` | Informations |

Chaque couleur primary et secondary est déclinée en 5 nuances (100, 300, 500, 700, 900) via calcul OKLCH.

## Typographie

| Usage | Police | Variable CSS | Classes Tailwind |
|-------|--------|-------------|-----------------|
| Titres | Nunito (800/700/600) | `--font-heading` | `font-heading` |
| Corps | Nunito Sans (400/600/700) | `--font-sans` | `font-sans` |

Source : Google Fonts via `next/font/google`.

## Spacing & Radius

| Token | Valeur | Classes Tailwind |
|-------|--------|-----------------|
| Radius base | `1rem` | `rounded-lg` (= `var(--radius)`) |
| Radius arrondi | Scales via `--radius` | `rounded-sm` à `rounded-4xl` |

Espacement géré nativement par les utilitaires Tailwind (`p-4`, `gap-3`, etc.).

## Vérification WCAG AA

**18 combinaisons testées — 18/18 PASS** (light et dark mode).

Ratios clés en light mode :
- Texte principal sur fond : 17.2:1 (seuil 4.5:1)
- Texte secondaire sur fond : 7.3:1 (seuil 4.5:1)
- Primary sur fond blanc (UI) : 5.0:1 (seuil 3:1)
- Blanc sur bouton primary : 5.0:1 (seuil 4.5:1)

## Fichiers

| Fichier | Rôle |
|---------|------|
| `app/globals.css` | Source de vérité — tokens shadcn/ui en OKLCH, light + dark mode |
| `docs/design-tokens.css` | Référence palette brute (HEX) pour documentation |
| `docs/design-preview.html` | Preview interactive standalone |
| `docs/design-tokens.json` | Format Style Dictionary |

## Utilisation dans le code

Les tokens sont consommés via les classes utilitaires Tailwind/shadcn :

```tsx
// Couleurs sémantiques
<Button>Valider</Button>                    // bg-primary text-primary-foreground
<Button variant="secondary">Annuler</Button> // bg-secondary text-secondary-foreground
<p className="text-muted-foreground">...</p> // texte atténué

// Typographie
<h1 className="font-heading text-2xl font-extrabold">Titre</h1>
<p className="font-sans">Corps de texte</p>

// Bordures et radius
<div className="rounded-lg border bg-card">...</div>
```

Aucun CSS custom, override ou style inline n'est nécessaire.
