# Plan — <titre>

Produit en **plan mode** (lecture seule) à partir de `spec.md`.
Approuvé par le développeur avant la première ligne de code.

- **Statut** : proposé | approuvé | exécuté

## Fichiers qui changent

| Fichier | Nature | Pourquoi |
|---------|--------|----------|
| `lib/<...>.ts` | création | <...> |
| `app/(app)/<...>/page.tsx` | modification | <...> |

## Ordre des travaux

1. <Logique métier pure + ses tests — d'abord, elle ne dépend de rien>
2. <Persistance et migration>
3. <Interface>
4. <Vérification complète>

## Risques

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| <ex. migration IndexedDB sur base existante> | <faible/moyenne/forte> | <...> |

## Preuve

Ce qui démontrera que le plan est réalisé :

- [ ] `pnpm verify` au vert
- [ ] <tests unitaires nommés, couvrant cas nominal et cas d'erreur>
- [ ] <vérification manuelle : parcours, écran, appareil>

Si le travail touche des couleurs, la preuve de contraste **nomme les couples mesurés** :
une fourchette globale n'est pas vérifiable en revue et masque les sélecteurs oubliés.

| Sélecteur / composant | Texte sur fond | Clair | Sombre | Seuil |
|---|---|---|---|---|
| `<ex. .callout-warning>` | `<texte sur fond>` | `<x:1>` | `<x:1>` | `<4,5:1 ou 3:1>` |

## Approbation

- [ ] Développeur — <nom>, <date>
