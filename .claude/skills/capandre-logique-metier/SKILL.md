---
name: capandre-logique-metier
description: Contrat des couches de Capandre — ce qui va dans lib/, ce qui va dans lib/db/, ce qui reste dans les composants, et comment tester la logique métier. À charger avant d'ajouter un module éducatif, un moteur d'exercice, une opération de persistance ou une migration IndexedDB.
---

# Logique métier Capandre

## Contrat des couches

```text
app/ , components/     Présentation    React, "use client"
        ↓
lib/                   Logique métier  TypeScript pur
        ↓
lib/db/                Persistance     IndexedDB via idb
```

- `lib/` **n'importe jamais** React ni `lib/db`. Un module de `lib/` doit pouvoir tourner
  dans un test Node sans navigateur.
- Les détails d'infrastructure — RNG, horloge, base — sont **passés en paramètre**.
  Jamais `Math.random()` ni `Date.now()` en dur dans la logique métier.
- Un composant ne calcule pas : il appelle `lib/` et affiche. S'il y a une règle métier
  dans un `.tsx`, elle est au mauvais endroit.

Le moteur `lib/multiplication/` est la référence de ce que doit être un module :
types, constantes, fonctions pures, réducteur d'UI séparé, barrel d'export, tests à côté.

## Ajouter un module éducatif

1. `lib/<module>/types.ts` — les types du domaine avant tout le reste.
2. `lib/<module>/constants.ts` — aucune valeur magique ailleurs.
3. Fonctions pures : génération d'exercice, évaluation de réponse, progression.
4. `lib/<module>/index.ts` — barrel d'export.
5. `lib/db/schema.ts` + migration versionnée dans `lib/db/database.ts` si de nouveaux
   stores sont nécessaires. **Une migration ne détruit jamais de données existantes**
   sans décision explicite écrite dans `spec.md`.
6. `lib/db/<module>-operations.ts` puis `<module>-hooks.ts` — les écritures multiples
   passent par une transaction unique.
7. Composants dans `components/<module>/`, routes dans `app/(app)/<module>/`.

## Offline-first

Toute fonctionnalité marche sans réseau. Un appel réseau sur un chemin critique est un
constat bloquant en revue. La connexion ne sert qu'à synchroniser entre appareils.

## Tests

- `__tests__/[nom].test.ts` à côté de la source, `describe`/`it` en français.
- Chaque fonction publique : cas nominal + cas d'erreur ou limite.
- Injecter le RNG (`lib/multiplication/__tests__/test-rng.ts`) plutôt que mocker.
- 80 % de couverture sur `lib/`, suite complète sous 30 s.
- Correction de bug : le test qui échoue s'écrit **en premier**.
