# intent/

Un dossier par unité de travail, nommé `<id>-<slug>` où `<id>` reprend l'identifiant de
`docs/roadmap.md` ou `docs/backlog.md` quand il existe (`M2-02-conjugaison`, `BP-05-export`).

```text
intent/<id>-<slug>/
  intent.md   Étape 1 — le problème, écrit avec le demandeur
  spec.md     Étape 2 — exigences et conception, produites par Claude
  plan.md     Étape 3 — plan d'implémentation, produit en plan mode
```

Les trois fichiers sont versionnés : le commit qui les ajoute est la trace de l'approbation.
Aucun code n'est écrit avant que `plan.md` soit approuvé.

`ETAT.md` tient l'index : une ligne par unité, la dernière action menée. Il est lu à
l'ouverture de session et mis à jour en fin de session de travail. Une unité terminée voit
son dossier renommé `DONE-<id>`, si bien qu'un `ls intent/` suffit à voir ce qui reste ouvert.

Modèles dans `_templates/`. Cycle complet : `docs/sdlc.md`.

```bash
id=M2-02-conjugaison
mkdir -p "intent/$id" && cp intent/_templates/*.md "intent/$id/"
```
