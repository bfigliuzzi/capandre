# Spec — <titre>

Découle de `intent.md`. Produite par Claude, relue par le demandeur.

- **Statut** : brouillon | relue | approuvée

## Exigences

| # | Exigence | Origine | Vérifiable par |
|---|----------|---------|----------------|
| R1 | <comportement attendu> | intent.md § Résultat attendu | <test / vérification manuelle> |

## Hors périmètre

- <Ce qui est explicitement exclu, pour éviter l'élargissement silencieux>

## Conception

### Modèle de données

<Nouveaux types, changements de `lib/db/schema.ts`, migration de version nécessaire ?>

### Logique métier

<Ce qui va dans `lib/`, en TypeScript pur. Ce qui est injecté (RNG, horloge, base).>

### Interface

<Écrans, navigation, états (vide, chargement, erreur, succès). Composants réutilisés
plutôt que créés.>

### Accessibilité

<Structure de titres, navigation clavier, annonces `role="status"` / `role="alert"`,
textes destinés aux technologies d'assistance — en français.>

## Points signalés

> Ce que Claude n'a pas tranché seul. Chaque point nomme qui décide.

| Point | Risque | Décide |
|-------|--------|--------|
| <ex. migration destructive du store> | <perte de données existantes> | <demandeur> |

## Approbation

- [ ] Demandeur — <nom>, <date>
