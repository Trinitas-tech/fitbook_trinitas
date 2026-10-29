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

Les e-mails (confirmation d'inscription, réservations…) sont envoyés par Symfony Mailer ; par défaut
`MAILER_DSN=null://null` (aucun envoi réel, trace en table `notification`). Pour les recevoir dans la boîte
de test **Mailtrap**, mettre dans `backend/.env.local` :
`MAILER_DSN=smtp://IDENTIFIANT:MOT_DE_PASSE@sandbox.smtp.mailtrap.io:2525` (Email Testing > Inbox > SMTP Settings).

## Tests

```bash
# Unitaires + intégration (PHPUnit) – base fitbook_test créée une fois :
#   mysql -u root -e "CREATE DATABASE fitbook_test; GRANT ALL ON fitbook_test.* TO 'fitbook'@'localhost';"
cd backend && php bin/phpunit                 # 48 tests (22 unitaires, 26 d'intégration API)

# API (Postman / Newman) – serveur backend lancé, fixtures chargées
npm install -g newman
newman run postman/FitBook.postman_collection.json -e postman/FitBook.local.postman_environment.json

# Frontend (Vitest)
cd frontend && npm test -- --watch=false
```

Scénario Newman de 18 requêtes (listes OK/KO, connexion KO/OK, création d'un coach, séance créée /
modifiée / supprimée, suppression de l'utilisateur par l'admin) – voir [`postman/README.md`](postman/README.md).
Détail des jeux de tests et résultats : [`docs/06-tests.md`](docs/06-tests.md).

## Déploiement (alwaysdata)

Frontend et API sur la même origine `https://fitbook.trinitasnt.alwaysdata.net` (Apache + PHP 8.3 + MySQL) :

```bash
deploy/deploy.sh      # build Angular prod, envoi SSH, composer --no-dev, clés JWT, migrations, cache, vérification HTTP
```

Procédure complète, variables de production et liste de vérification après mise en ligne :
[`docs/05-deploiement.md`](docs/05-deploiement.md). Sauvegardes MySQL : [`docs/sauvegardes/`](docs/sauvegardes/).

## Documentation

| Document | Fichier |
|----------|---------|
| Cahier des charges (texte d'origine + analyse, modélisation, état de réalisation) | [`docs/00-cahier-des-charges.md`](docs/00-cahier-des-charges.md) |
| User stories (42) | [`docs/01-user-stories.md`](docs/01-user-stories.md) |
| MCD / MLD (Merise) | [`docs/02-mcd-mld.md`](docs/02-mcd-mld.md) |
| Diagrammes UML (PlantUML, PNG/SVG) | [`docs/03-diagrammes-uml.md`](docs/03-diagrammes-uml.md) |
| Contrat de l'API REST | [`docs/04-api.md`](docs/04-api.md) |
| Script SQL du MLD (import JMerise) | [`docs/fitbook.sql`](docs/fitbook.sql) |
| Déploiement alwaysdata | [`docs/05-deploiement.md`](docs/05-deploiement.md) |
| Jeux de tests et résultats | [`docs/06-tests.md`](docs/06-tests.md) |
| Présentation finale | [`docs/07-presentation.md`](docs/07-presentation.md) |
| Sauvegardes MySQL | [`docs/sauvegardes/`](docs/sauvegardes/) |
| Maquettes Figma, Trello | [`docs/README.md`](docs/README.md) |

## Workflow

GitFlow : `main` (versions livrées), `develop` (intégration), `feature/*`, `release/*`, `hotfix/*`.
Au moins 3 commits par jour de travail et une pull request tous les 3 jours.
Suivi des tâches : tableau Trello FitBook.
