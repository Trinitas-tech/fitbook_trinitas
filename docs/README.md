# FitBook – Livrables de l'étape 1 (à faire valider)

Projet : plateforme de réservation de salles, de cours et de coachs sportifs.
Stack prévue : Angular 21 + Symfony (API) + MySQL. Durée : 140 h.

| Livrable | Où le trouver |
|----------|---------------|
| User stories (42, 4 rôles + système) | [01-user-stories.md](01-user-stories.md) |
| MCD + MLD (Merise) | [02-mcd-mld.md](02-mcd-mld.md) |
| Script SQL du MLD (création MySQL + import JMerise par rétro-conception) | [fitbook.sql](fitbook.sql) |
| MCD – diagramme FigJam | https://www.figma.com/board/VhYQ5m25lANl7sED0Ap9jP |
| MCD, MLD, cas d'utilisation (include/extend), classes – PNG/SVG + sources PlantUML | [03-diagrammes-uml.md](03-diagrammes-uml.md), dossier `diagrammes/` |
| Wireframes + maquettes Figma | https://www.figma.com/design/3zUgXqVLVCvrWmTGebKzxF |
| Tableau Trello | https://trello.com/b/t2CAAITw/fitbook |
| Dépôt GitHub (GitFlow main / develop) | https://github.com/Trinitas-tech/fitbook_trinitas |

## Contenu du fichier Figma

Page **01 Wireframes (basse fidélité)** – 4 écrans, chacun en desktop 1440 px et mobile 390 px :

1. Accueil & recherche (barre de recherche, filtres avancés, cartes de résultats, favoris)
2. Fiche cours & réservation (calendrier semaine, créneaux avec places restantes, avis)
3. Espace gestionnaire (tableau de bord, KPI, calendrier des séances, réservations)
4. Inscription & connexion (choix du rôle, confirmation e-mail)

Page **02 Maquettes (haute fidélité)** – les 3 écrans principaux (1 à 3) en desktop + mobile,
avec la charte : orange `#F97316` (actions), bleu nuit `#0F172A` (textes), fond `#F8FAFC`,
police Inter.

## Points à valider avec le formateur

- User stories : périmètre « Must » (35 stories) réalisable en 140 h ? Les bonus (carte,
  QR code, statistiques, rappel) restent en « Could ».
- MCD : voir la section 5 de `02-mcd-mld.md` (compte unique avec rôles, séance liée à un
  cours OU à un coach, avis sur salle/coach uniquement, table notification).
- Maquettes : navigation mobile par barre d'onglets en bas, espace gestionnaire avec
  barre latérale, bouton « Réserver » fixe en bas de la fiche sur mobile.

## Suite (après validation) – état au 29/10/2026

1. Fichiers natifs : les deux diagrammes UML sont fournis en StarUML (`diagrammes/fitbook.mdj`). Le MCD JMerise
   reste à produire à la main par rétro-conception de `docs/fitbook.sql` (section 6 de `02-mcd-mld.md`, format binaire).
2. Angular 21, Symfony et MySQL (utilisateur dédié, InnoDB forcé) : fait, voir le README racine.
3. Fonctionnalités : 42 user stories réalisées (35 Must, 2 Should, 5 Could/bonus).
4. Cahier des charges intégrant l'analyse et la modélisation : [00-cahier-des-charges.md](00-cahier-des-charges.md).
5. Tests unitaires, d'intégration, Newman, vérification Mailtrap : [06-tests.md](06-tests.md).
6. Sauvegardes MySQL : [sauvegardes/](sauvegardes/). Déploiement alwaysdata : [05-deploiement.md](05-deploiement.md).
7. Présentation finale : [07-presentation.md](07-presentation.md).
