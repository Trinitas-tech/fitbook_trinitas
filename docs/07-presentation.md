# FitBook – Présentation finale (support de soutenance)

Livrable demandé par le cahier des charges (A.11) : « Présentation finale du projet (PowerPoint, Canva, Figma ou
équivalent) : technologies, fonctionnalités, organisation, tests et résultats ».

- Fichier : [`presentation/FitBook-presentation.pptx`](presentation/FitBook-presentation.pptx) (PowerPoint, 16:9, 15 diapositives, en français).
- Charte : orange `#F97316` (accents), bleu nuit `#0F172A` (titres, diapositives de titre et de conclusion), fond clair `#F8FAFC`, police Calibri.
- Chaque diapositive contient des notes du présentateur (volet « Notes » de PowerPoint).
- Sources du contenu : [00-cahier-des-charges.md](00-cahier-des-charges.md), [01-user-stories.md](01-user-stories.md),
  [05-deploiement.md](05-deploiement.md), [06-tests.md](06-tests.md), README racine, `backend/README.md`, `frontend/README.md` ;
  images de `diagrammes/`.

## Sommaire des diapositives

| N° | Diapositive | Contenu |
|----|-------------|---------|
| 1 | Titre | FitBook, plateforme de réservation de salles, de cours et de coachs sportifs – Trinitas Mudeyi, Cfitech, octobre 2026. |
| 2 | Contexte et objectifs | Le besoin (sportifs et professionnels), le projet (140 h, stack imposée) et les 4 objectifs du cahier : interface responsive, recherche rapide, gestion des séances, accès sécurisé. |
| 3 | Quatre rôles, un espace pour chacun | Sportif, coach, gestionnaire, administrateur : fonctionnalités de chaque rôle, code Symfony (`ROLE_*`) et espace Angular ; rappel des fonctions transversales (inscription, confirmation e-mail, permissions). |
| 4 | Technologies | Frontend (Angular 21, SCSS, Leaflet, Vitest), backend (Symfony 7.4 / PHP 8.3, JWT, Validator, Mailer, Doctrine), données (MySQL, utilisateur dédié, InnoDB, CHECK), qualité et hébergement (PHPUnit 12, Postman / Newman, Mailtrap, alwaysdata) ; outils et charte graphique. |
| 5 | Analyse et conception | 42 user stories (35 Must, 2 Should, 5 Could) avec graphique par rôle et priorité, 4 wireframes + 3 maquettes Figma, 13 tables ; validation par le formateur le 27/10/2026. |
| 6 | MCD – modèle conceptuel de données | Image `diagrammes/mcd.png` et choix de modélisation Merise (compte unique avec rôle, séance liée à un cours ou à un coach, avis sur salle ou coach, notification). |
| 7 | MLD – modèle logique et base MySQL | Image `diagrammes/mld.png`, liste des 13 tables, clés étrangères, InnoDB, contraintes CHECK « XOR », script `fitbook.sql`, migrations et fixtures. |
| 8 | Diagramme de cas d'utilisation | Image `diagrammes/use-cases.png` : acteurs, relations include / extend, correspondance avec les user stories, fichier StarUML. |
| 9 | Diagramme de classes | Image `diagrammes/classes.png` : 13 entités Doctrine, énumérations, méthodes métier, services du backend. |
| 10 | Architecture API REST et sécurité | Chaîne Angular → API Symfony (76 routes JSON) → MySQL, puis six piliers : JWT, Voters et `access_control`, validation serveur (400), contrôle de capacité en transaction avec verrou (409), protection des comptes, secrets hors dépôt. |
| 11 | Fonctionnalités réalisées | Les exigences obligatoires réalisées (42 / 42 user stories) et les cinq bonus : carte et distance, QR code, rappel 24 h, statistiques, export CSV. |
| 12 | Organisation du projet | Les 4 étapes du cahier (préparation, structure technique, fonctionnalités, validation), Trello, GitHub et GitFlow (branches, pull requests), rythme de commits. |
| 13 | Tests et résultats | Résultats du 29/10/2026 : 23 tests unitaires / 64 assertions, 26 tests d'intégration / 153 assertions, Newman 18 requêtes / 35 assertions sans échec, 2 tests Vitest ; ce que vérifient les tests ; e-mails vérifiés dans Mailtrap (SMTP 250). |
| 14 | Déploiement alwaysdata et sauvegardes | Même origine Apache + PHP 8.3 + MySQL, arborescence `backend/public`, script `deploy/deploy.sh` en 4 étapes, tâche planifiée, vérifications après mise en ligne, sauvegardes MySQL (étapes 2 et 4, production). |
| 15 | Bilan et perspectives | Bilan chiffré (42 / 42, 48 tests PHPUnit + 18 requêtes Newman, en ligne), apprentissages et perspectives (Newman en production, MCD JMerise natif, SMTP réel, tests Vitest, idées d'évolution) ; remerciements. |

## Regénérer le fichier

Le `.pptx` a été produit avec `pptxgenjs` (script Node) à partir des documents ci-dessus, puis vérifié
(validation du paquet OOXML, export PNG de chaque diapositive avec PowerPoint pour contrôler les débordements).
Pour le modifier, ouvrir simplement le fichier dans PowerPoint : les textes sont des zones de texte et le graphique
de la diapositive 5 est un graphique natif modifiable.
