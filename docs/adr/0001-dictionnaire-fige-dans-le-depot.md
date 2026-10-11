# Les données du dictionnaire sont figées dans le dépôt

Le contenu du dictionnaire (articles et découpage en pages) est produit une fois par un script
à partir du Dico des Ados, du Wiktionnaire (via kaikki.org) et de la liste de mots Manulex, puis
versionné dans le dépôt et copié dans IndexedDB au premier lancement. L'app n'interroge aucune
API de dictionnaire à l'exécution : elle doit marcher hors ligne, et les numéros de page et les
mots repères doivent rester identiques d'un appareil et d'un jour à l'autre, faute de quoi les
questions d'entraînement (« page 42 ») perdent leur sens.

## Conséquences

- Mettre à jour le dictionnaire, c'est relancer le script et commiter le résultat : un
  changement de découpage décale les numéros de page.
- Le fichier distribué est sous CC BY-SA 4.0 et l'app affiche une page de crédits.
