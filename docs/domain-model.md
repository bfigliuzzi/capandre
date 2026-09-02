# Modèle de domaine

Ce document décrit les concepts métier de Capandre et leurs relations. Il est destiné à être compris par toute personne impliquée dans le projet, technique ou non.

---

## Entités

### Module

Un type de révision disponible dans l'application (ex. Dictée, Poésie, Tables de multiplication). C'est le point d'entrée de chaque discipline scolaire.

- has many Dictée
- has many Poème
- has many Niveau

---

### Dictée

Une série de mots à réviser, saisie par le parent pour une session de travail donnée.

- belongs to Module
- has many Mot

---

### Mot

Un mot individuel appartenant à une Dictée, que l'enfant doit retrouver ou recopier selon le niveau de difficulté.

- belongs to Dictée

---

### Poème

Un texte poétique à apprendre par cœur, saisi par le parent. Structuré en strophes et vers.

- belongs to Module
- has many Strophe

---

### Strophe

Un groupe de vers formant une unité dans un poème.

- belongs to Poème
- has many Vers

---

### Vers

Une ligne individuelle d'une strophe dans un poème. Unité de base pour le masquage progressif lors de l'apprentissage.

- belongs to Strophe

---

### Niveau

Un degré de difficulté applicable à un exercice (ex. Découverte, Apprentissage, Maîtrise). Modélisé comme entité à part entière pour permettre la personnalisation par module à l'avenir.

- belongs to Module
