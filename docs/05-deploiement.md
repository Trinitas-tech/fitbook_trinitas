# FitBook – Déploiement sur alwaysdata

Hébergement mutualisé alwaysdata (compte `trinitasnt`) : Apache + PHP 8.3 + MySQL. Le frontend Angular et l'API
Symfony sont servis par **la même origine** (`https://fitbook.trinitasnt.alwaysdata.net`) :

```
/www/fitbook/backend/public/        <- racine du site alwaysdata
├── index.php                      <- contrôleur frontal Symfony (toutes les URL /api/...)
├── index.html, chunk-*.js, *.css  <- build Angular (ng build --configuration production, apiUrl = /api)
├── leaflet/, favicon.ico, ...
└── .htaccess                      <- API -> index.php, fichiers existants, sinon -> index.html (routes Angular)
```

## 1. Préparer l'hébergement (administration alwaysdata, une seule fois)

1. **Bases de données > MySQL > Ajouter une base** : `trinitasnt_fitbook`.
2. **Bases de données > MySQL > Utilisateurs > Ajouter** : `trinitasnt_fitbook`, mot de passe fort, tous les droits sur
   la base (utilisateur dédié, jamais le compte principal). Noter la version du serveur affichée (ex. `8.0.x` ou `10.11.x-MariaDB`).
3. **Web > Sites > Ajouter un site** :
   - Adresses : `fitbook.trinitasnt.alwaysdata.net`
   - Type : *PHP* – version **8.3**
   - Répertoire racine : `/www/fitbook/backend/public`
4. **Accès distant > SSH** : activer l'utilisateur SSH (mot de passe ou clé publique `~/.ssh/id_ed25519.pub`).
5. **Planificateur de tâches > Ajouter** (toutes les heures) :
   `cd ~/www/fitbook/backend && php bin/console app:sessions:close && php bin/console app:bookings:remind`

## 2. Variables de production

Sur le serveur, créer `~/www/fitbook/backend/.env.local` à partir de [`backend/.env.prod.example`](../backend/.env.prod.example) :

| Variable | Valeur |
|----------|--------|
| `APP_ENV` / `APP_DEBUG` | `prod` / `0` |
| `APP_SECRET` | chaîne aléatoire (ex. `php -r "echo bin2hex(random_bytes(16));"`) |
| `DATABASE_URL` | `mysql://trinitasnt_fitbook:MOT_DE_PASSE@mysql-trinitasnt.alwaysdata.net:3306/trinitasnt_fitbook?serverVersion=8.0.36&charset=utf8mb4` |
| `DEFAULT_URI`, `FRONTEND_URL` | `https://fitbook.trinitasnt.alwaysdata.net` |
| `CORS_ALLOW_ORIGIN` | `'^https://fitbook\.trinitasnt\.alwaysdata\.net$'` |
| `JWT_PASSPHRASE` | passphrase des clés générées sur le serveur |
| `MAILER_DSN` | `smtp://IDENTIFIANT:MOT_DE_PASSE@sandbox.smtp.mailtrap.io:2525` (boîte Mailtrap) |
| `MAILER_FROM` | `no-reply@fitbook.fr` |

Les secrets ne sont jamais versionnés (`.gitignore` : `.env.local`, `config/jwt/`).

## 3. Déployer

Depuis la racine du dépôt (Git Bash) :

```bash
deploy/deploy.sh            # build Angular + envoi + composer --no-dev + clés JWT + migrations + cache
deploy/deploy.sh --no-build # sans reconstruire le frontend
```

Le script :

1. `ng build --configuration production` (remplace `environment.ts` par `environment.prod.ts`, `apiUrl = /api`) ;
2. envoie `backend/` (sans `vendor/`, `var/`, `.env.local`, `config/jwt/`, `tests/`) et le contenu de
   `frontend/dist/frontend/browser/` dans `~/www/fitbook/backend/public/` ;
3. exécute côté serveur `composer install --no-dev --optimize-autoloader`, `lexik:jwt:generate-keypair` (si absent),
   `doctrine:migrations:migrate`, `cache:clear`, `cache:warmup` ;
4. vérifie `GET /` (200, page Angular) et `GET /api/activities` (200, JSON – prouve la connexion à la base).

Premier déploiement : charger ensuite les données de démonstration
`php bin/console doctrine:fixtures:load -n --env=prod` (ou importer `docs/sauvegardes/fitbook_dev_2026-10-29.sql`
dans phpMyAdmin), puis prendre une sauvegarde (section 5).

## 4. Vérifications après déploiement (cahier des charges A.9)

| Vérification | Comment | Attendu |
|--------------|---------|---------|
| Site en ligne | `https://fitbook.trinitasnt.alwaysdata.net/` | page d'accueil Angular, recherche |
| Connexion à la base | `GET /api/activities`, `GET /api/search?q=yoga` | JSON 200 avec les 10 activités / résultats |
| Routes Angular (deep link) | ouvrir `/recherche?city=Lyon` puis F5 | la page se recharge (règle `.htaccess`) |
| Authentification JWT derrière Apache | connexion `user1@fitbook.fr` puis « Mes réservations » | 200 (en-tête `Authorization` transmis) |
| E-mails | inscription d'un nouveau compte | e-mail « Confirmez votre adresse e-mail » dans la boîte Mailtrap |
| Permissions | sportif → `/admin` | redirection / 403 |
| Capacité | réserver une séance complète | message « Séance complète » |
| Newman en production | `newman run postman/FitBook.postman_collection.json -e postman/FitBook.local.postman_environment.json --env-var base_url=https://fitbook.trinitasnt.alwaysdata.net/api` | 18 requêtes OK |

## 5. Sauvegardes de la base de données

Voir [sauvegardes/README.md](sauvegardes/README.md). En production :

```bash
ssh trinitasnt@ssh-trinitasnt.alwaysdata.net \
  "mysqldump -h mysql-trinitasnt.alwaysdata.net -u trinitasnt_fitbook -p trinitasnt_fitbook" \
  > docs/sauvegardes/fitbook_prod_$(date +%F).sql
```

## 6. Dépannage

| Problème | Piste |
|----------|-------|
| 500 sur `/api/...` | `var/log/prod.log` ; `DATABASE_URL` (mot de passe, `serverVersion`) ; `php bin/console cache:clear` |
| 401 systématique après connexion | règle `Authorization` du `.htaccess` absente, ou clés JWT non générées |
| Page blanche sur `/` | build Angular non copié dans `public/`, ou racine du site qui ne pointe pas sur `backend/public` |
| 404 au rafraîchissement d'une route Angular | module `mod_rewrite` / `.htaccess` non pris en compte |
| E-mails absents | `MAILER_DSN` sur le serveur ; quota Mailtrap (plan gratuit : limite d'envois par seconde) |
