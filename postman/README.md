# Tests API – Postman / Newman

Collection `FitBook.postman_collection.json` + environnement `FitBook.local.postman_environment.json`.

## Scénario (18 requêtes, chacune avec ses tests)

| # | Requête | Variables d'environnement |
|---|---------|---------------------------|
| 01 | Liste des salles – **OK** (200, pagination) | |
| 02 | Liste des utilisateurs sans jeton – **KO** (401) | |
| 03 | Connexion avec erreur (401, message générique) | |
| 04 | Connexion administrateur | `admin_token` ← |
| 05 | Création d'un coach (`POST /auth/register`) | `user_email` ←, `user_id` ← |
| 06 | Connexion du coach avant confirmation e-mail (403 attendu) | |
| 07 | Admin : vérification du compte (`PUT /admin/users/{{user_id}}`) | |
| 08 | Connexion du coach avec l'identifiant sauvegardé | `user_token` ← |
| 09 | Profil coach (liste nécessitant une connexion) | `coach_id` ← |
| 10 | Mes réservations (liste nécessitant une connexion) | |
| 11 | Coach : compléter le profil | |
| 12 | Coach : disponibilités hebdomadaires | |
| 13 | **Création d'une séance** de sport | `session_id` ←, `session_start` ← |
| 14 | **Modification** de la séance (`{{session_id}}`) | |
| 15 | **Suppression** de la séance (`{{session_id}}`) | `session_id`, `session_start` ✖ supprimées |
| 16 | Vérification : la séance renvoie 404 | |
| 17 | Admin : **suppression de l'utilisateur** créé (`{{user_id}}`) | `user_id`, `user_email`, `user_token`, `coach_id` ✖ supprimées |
| 18 | Vérification : l'utilisateur renvoie 404 | `admin_token` ✖ supprimée |

Variables fixes de l'environnement : `base_url`, `admin_email`, `admin_password` (compte des fixtures), `user_password`.

## Prérequis

```bash
cd backend
php bin/console doctrine:fixtures:load -n     # compte admin@fitbook.fr / Password123!
symfony server:start --port=8000 --no-tls      # ou : php -S 127.0.0.1:8000 -t public
```

## Exécution avec Newman

```bash
npm install -g newman            # une seule fois
newman run postman/FitBook.postman_collection.json -e postman/FitBook.local.postman_environment.json
```

Rapport HTML (optionnel) : `npm i -g newman-reporter-htmlextra` puis ajouter `-r cli,htmlextra`.

La collection est rejouable : l'e-mail du coach est généré à chaque exécution (`coach.newman.<timestamp>@fitbook.test`)
et toutes les données créées sont supprimées à la fin.
