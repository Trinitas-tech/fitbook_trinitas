# FitBook

Plateforme web de réservation de salles, de cours et de coachs sportifs.
Projet Cfitech (140 h) – Trinitas Mudeyi.

## Stack

- Frontend : Angular 21 (dossier `frontend/`) – composants standalone, signals, SCSS, charte Figma
- Backend : Symfony 7.4 (API REST JSON + JWT, dossier `backend/`) – Doctrine ORM, Voters, Mailer
- Base de données : MySQL 9 (utilisateur dédié `fitbook`, moteur InnoDB forcé)
- Tests API : Postman / Newman (dossier `postman/`)

## Démarrage rapide

```bash
# 1. Base de données (une seule fois, en root MySQL)
mysql -u root -e "CREATE DATABASE fitbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'fitbook'@'localhost' IDENTIFIED BY 'FitBook2026!';
  GRANT ALL PRIVILEGES ON fitbook.* TO 'fitbook'@'localhost';"

# 2. Backend (http://localhost:8000)
cd backend
composer install
php bin/console lexik:jwt:generate-keypair        # clés JWT (config/jwt/, non versionnées)
php bin/console doctrine:migrations:migrate -n    # schéma MLD (13 tables InnoDB)
php bin/console doctrine:fixtures:load -n         # données de démonstration
symfony server:start --port=8000 --no-tls         # ou : php -S localhost:8000 -t public

# 3. Frontend (http://localhost:4200)
cd ../frontend
npm install
npm start
```

Comptes de démonstration (mot de passe `Password123!`) : `admin@fitbook.fr`, `manager@fitbook.fr`,
`coach1@fitbook.fr`, `user1@fitbook.fr` (voir `backend/src/DataFixtures/AppFixtures.php`).

Les e-mails (confirmation d'inscription, réservations…) sont envoyés par Symfony Mailer ; en dev
`MAILER_DSN=null://null` (aucun envoi réel, trace en table `notification`). Pour les voir, lancer
Mailpit et mettre `MAILER_DSN=smtp://localhost:1025` dans `backend/.env.local`.

## Tests API (Postman / Newman)

```bash
npm install -g newman
newman run postman/FitBook.postman_collection.json -e postman/FitBook.local.postman_environment.json
```

Scénario de 18 requêtes (listes OK/KO, connexion KO/OK, création d'un coach, séance créée /
modifiée / supprimée, suppression de l'utilisateur par l'admin) – voir [`postman/README.md`](postman/README.md).

## Documentation

| Document | Fichier |
|----------|---------|
| User stories (42) | [`docs/01-user-stories.md`](docs/01-user-stories.md) |
| MCD / MLD (Merise) | [`docs/02-mcd-mld.md`](docs/02-mcd-mld.md) |
| Diagrammes UML (PlantUML, PNG/SVG) | [`docs/03-diagrammes-uml.md`](docs/03-diagrammes-uml.md) |
| Contrat de l'API REST | [`docs/04-api.md`](docs/04-api.md) |
| Script SQL du MLD (import JMerise) | [`docs/fitbook.sql`](docs/fitbook.sql) |
| Maquettes Figma, Trello | [`docs/README.md`](docs/README.md) |

## Workflow

GitFlow : `main` (versions livrées), `develop` (intégration), `feature/*`, `release/*`, `hotfix/*`.
Au moins 3 commits par jour de travail et une pull request tous les 3 jours.
Suivi des tâches : tableau Trello FitBook.
