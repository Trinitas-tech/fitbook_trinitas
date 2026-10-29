# FitBook – Jeux de tests et résultats des vérifications

Exigences du cahier des charges (A.9) : tests unitaires, tests d'intégration, tests d'API Postman / Newman,
validation des formulaires, permissions, capacités, protection des données d'authentification, sauvegardes,
vérification après déploiement.

## 1. Tests unitaires – PHPUnit (`backend/tests/Unit`)

```bash
cd backend && php bin/phpunit tests/Unit
```

| Classe | Ce qui est vérifié | US |
|--------|--------------------|----|
| `Entity/GymTest` | distance Haversine Lyon → Paris ≈ 392 km, 0 km au même point, `null` sans coordonnées | US-21 |
| `Entity/SessionTest` | places restantes (réservations annulées ignorées, jamais négatif), bascule `planifiee` ⇄ `complete`, séance annulée ou passée non réservable, titre du coaching privé | US-60 |
| `Entity/BookingTest` | annulation possible > 2 h avant, refusée < 2 h ou déjà annulée ; format `FB-XXXXXXXXXXXX` et renouvellement du QR code | US-17, US-22 |
| `Service/BookingServiceTest` | 1 à 5 places, séance introuvable (404), confirmation + e-mail, « Séance complète » (409), doublon refusé, réactivation d'une réservation annulée, séance passée / annulée refusée, annulation libère la place + e-mail, annulation forcée par l'admin | US-15, US-17, US-52, US-60, US-61 |

Résultat du 29/10/2026 : **22 tests, 55 assertions, OK**.

## 2. Tests d'intégration – PHPUnit `WebTestCase` (`backend/tests/Functional`)

Base dédiée `fitbook_test` (suffixe `_test` ajouté par Doctrine en environnement `test`), schéma recréé et fixtures
chargées une fois par exécution (`ApiTestCase`). Requêtes HTTP réelles sur le noyau Symfony, JWT obtenu par `POST /api/auth/login`.

```bash
mysql -u root -e "CREATE DATABASE fitbook_test; GRANT ALL ON fitbook_test.* TO 'fitbook'@'localhost';"   # une fois
cd backend && php bin/phpunit tests/Functional
```

| Classe | Scénarios | US |
|--------|-----------|----|
| `AuthTest` | erreurs de validation (400 + liste), inscription → mot de passe hashé → e-mail tracé → connexion refusée (403) → lien invalide (400) → confirmation → connexion → `/auth/me` ; doublon d'e-mail (409) ; mauvais mot de passe = 401 générique ; `/auth/me` anonyme = 401 ; mise à jour du profil | US-01 à US-05 |
| `CatalogTest` | activités publiques, recherche insensible à la casse, filtres ville + type, tri par distance avec `lat`/`lng`, fiche salle (horaires, cours, avis approuvés seulement), 404, coach non validé masqué | US-10 à US-14, US-21, US-51, US-53 |
| `BookingTest` | 401 anonyme ; réservation (201, QR code, places décrémentées) → doublon 409 → historique → annulation 200 → 2ᵉ annulation 409 → e-mails tracés ; **surréservation refusée** sur une séance à 1 place (409 « Séance complète », statut `complete`, 0 place) ; validation des places (400) ; séance inconnue (404) ; réservation d'un autre utilisateur invisible / non annulable (403) | US-15 à US-17, US-22, US-60, US-61 |
| `PermissionsTest` | 401 anonyme sur `/admin`, `/manager`, `/coach`, `/favorites` ; sportif → 403 ; coach / gestionnaire → 403 sur `/admin` ; un gestionnaire ne voit ni ne modifie la salle d'un autre (Voter) ; un coach ne modifie / supprime pas la séance d'un autre ; compte désactivé → connexion 403 | US-06, US-50 |

Résultat du 29/10/2026 : **26 tests, 153 assertions, OK** (9 s).

## 3. Tests d'API – Postman / Newman (`postman/`)

```bash
newman run postman/FitBook.postman_collection.json -e postman/FitBook.local.postman_environment.json
```

18 requêtes enchaînées (listes OK / KO, connexion KO / OK, création d'un coach, séance créée / modifiée / supprimée,
suppression de l'utilisateur par l'admin). Résultat du 29/10/2026 (branche bonus) : **18 requêtes, 35 assertions, 0 échec**.
Détail : [`postman/README.md`](../postman/README.md).

## 4. Tests frontend – Vitest

```bash
cd frontend && npm test -- --watch=false
```

Résultat du 29/10/2026 : 1 fichier, 2 tests OK.

## 5. Vérification des e-mails – Mailtrap (29/10/2026)

- `backend/.env.local` : `MAILER_DSN=smtp://…@sandbox.smtp.mailtrap.io:2525` (boîte de test Mailtrap).
- `POST /api/auth/register` (`mailtrap.test1@fitbook.fr`) → 201, e-mail « Confirmez votre adresse e-mail – FitBook »
  envoyé par `MailerService::sendVerification`, trace `notification` n° 54 (type `info`).
- Envoi direct par le transport Symfony : réponse SMTP `250` (message accepté par Mailtrap, identifiant `queued`).
- Le plan gratuit Mailtrap limite le débit : un envoi trop rapproché renvoie `550 5.7.0 Too many emails per second`
  (l'échec est journalisé, l'action métier n'est pas bloquée).

## 6. Sauvegardes

Dumps MySQL dans [`sauvegardes/`](sauvegardes/) (`mysqldump --single-transaction`), voir le README du dossier.

## 7. Vérification après déploiement

Liste de contrôle dans [05-deploiement.md](05-deploiement.md) (section 4) : site en ligne, `GET /api/activities`
(connexion à la base), deep links Angular, JWT derrière Apache, e-mail d'inscription dans Mailtrap, permissions,
capacité, Newman contre l'URL de production.
