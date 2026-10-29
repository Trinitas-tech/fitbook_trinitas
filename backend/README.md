# FitBook – Backend (Symfony 7.4, API REST)

## Installation

```bash
composer install
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:migrate -n
php bin/console doctrine:fixtures:load -n
symfony server:start --port=8000 --no-tls   # ou php -S localhost:8000 -t public
```

Connexion MySQL dans `.env` (`DATABASE_URL`, utilisateur dédié `fitbook`). Surcharger dans `.env.local`.
Le moteur InnoDB est forcé dans `config/packages/doctrine.yaml` (`default_table_options`).

## Organisation du code

| Dossier | Contenu |
|---------|---------|
| `src/Entity/` | 13 entités Doctrine = tables du MLD (`utilisateur`, `coach`, `salle`, `activite`, `cours`, `seance`, `horaire`, `disponibilite`, `reservation`, `avis`, `notification`, `favori_salle`, `favori_coach`) |
| `src/Enum/` | `Level`, `SessionStatus`, `BookingStatus`, `ReviewStatus` |
| `src/Repository/` | Requêtes DQL (recherche, filtres, verrou pessimiste pour la réservation) |
| `src/Controller/Api/` | `Auth`, `Catalog` (public), `Booking`, `Favorite`, `Review` (sportif), `Coach`, `Manager`, `Admin` |
| `src/Security/` | `UserChecker` (compte vérifié / actif), `LoginFailureHandler`, `Voter/` (Gym, Course, Session, Booking, Review) |
| `src/Service/` | `BookingService` (transaction + verrou, US-60), `SessionService` (planification, annulation), `MailerService` (e-mails Twig FR), `Presenter` (JSON), `QrCodeGenerator` (QR code SVG, US-22) |
| `src/Command/` | `app:sessions:close` – clôture des séances passées (US-63) ; `app:bookings:remind` – rappel e-mail 24 h avant (US-20). À planifier toutes les heures |
| `src/DataFixtures/` | Jeu de démonstration (12 comptes, 4 salles, 12 cours, ~150 séances) |
| `src/Migrations/` | Schéma + contraintes CHECK XOR (`seance`, `avis`) |
| `templates/emails/` | Confirmation d'inscription, réinitialisation, réservation, annulations |

Contrat complet des routes : [`../docs/04-api.md`](../docs/04-api.md). Erreurs JSON uniformes
`{ message, errors? }` via `ApiExceptionListener` (400 validation, 401, 403 Voter, 404, 409 métier).

## Sécurité

- JWT (LexikJWTAuthenticationBundle, 8 h), `POST /api/auth/login` (json_login).
- `access_control` par préfixe (`/api/admin`, `/api/manager`, `/api/coach/`) + Voters sur les objets
  (un coach ne modifie que ses séances, un gestionnaire que ses salles, un sportif que ses réservations).
- Mots de passe hashés (auto), e-mail de confirmation obligatoire (lien 24 h), compte désactivable.

## Commandes utiles

```bash
php bin/console doctrine:schema:validate       # mapping ↔ base
php bin/console app:sessions:close             # clôture des séances terminées
php bin/console debug:router | findstr api     # liste des 76 routes
```

## Tâches planifiées (production)

Les deux commandes sont à lancer toutes les heures, par exemple avec cron :

```
0 * * * * cd /var/www/fitbook/backend && php bin/console app:sessions:close && php bin/console app:bookings:remind
```

Sous Windows, le Planificateur de tâches peut exécuter `php bin/console app:bookings:remind` avec la même fréquence.

## Bonus « Could »

- US-20 rappel 24 h : commande ci-dessus, e-mail `templates/emails/booking_reminder.html.twig`, trace `notification.type = rappel` (pas de doublon).
- US-21 distance : `GET /gyms` et `/search` acceptent `lat`/`lng` et renvoient `distanceKm` (Haversine), tri par distance.
- US-22 QR code : `Booking.qrCodeDataUri` (SVG, bibliothèque endroid/qr-code) sur les routes du sportif.
- US-36 : `GET /coach/stats`. US-44 : `GET /manager/gyms/{id}/bookings/export` (CSV). US-54 : séries mensuelles dans `GET /admin/stats`.
