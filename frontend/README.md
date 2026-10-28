# FitBook – Frontend Angular 21

Interface web de FitBook (réservation de salles, cours et coachs sportifs).
Angular 21, composants standalone, zoneless, signals, SCSS, Vitest.

## Lancement

```bash
npm install
npm start          # http://localhost:4200 (rechargement à chaud)
npm run build      # build de production dans dist/frontend
npm test           # tests unitaires (Vitest)
```

L'API Symfony doit tourner sur `http://localhost:8000/api` (voir `src/environments/environment.ts`).
Le backend gère le CORS : aucun proxy n'est nécessaire.

## Structure

```
src/
├── environments/environment.ts   # apiUrl
├── styles.scss                   # charte (variables CSS, boutons, cartes, formulaires, grille…)
└── app/
    ├── app.config.ts             # routeur, HttpClient + intercepteurs, locale fr-FR, APP_INITIALIZER
    ├── app.routes.ts             # routes lazy (loadComponent) + guards + titres
    ├── core/
    │   ├── models/               # interfaces TypeScript du contrat API (docs/04-api.md)
    │   ├── services/             # auth, catalog, booking, favorite, review, coach, manager, admin, toast
    │   ├── interceptors/         # auth (Bearer), error (messages lisibles, 401 → /connexion)
    │   ├── guards/               # authGuard, roleGuard(...roles)
    │   └── utils/date.utils.ts   # semaines, plages calendrier, datetime-local
    ├── shared/components/        # navbar, bottom-tabs, sidebar-layout, gym/coach/course-card,
    │                             # session-list, week-calendar, rating-stars, favorite-button,
    │                             # review-form/list, book-session-dialog, confirm-dialog, alert, loader,
    │                             # empty-state, pagination, status-badge, toasts
    └── features/
        ├── home, search, gym-detail, coach-detail, course-detail   # public
        ├── auth/                 # inscription, vérification e-mail, connexion, mot de passe oublié/reset
        ├── user/                 # mes réservations, mes favoris, profil
        ├── coach/                # espace coach (barre latérale)
        ├── manager/              # espace gestionnaire (barre latérale)
        └── admin/                # administration (barre latérale)
```

## Routes principales

| Route | Accès |
|-------|-------|
| `/`, `/recherche`, `/salles/:id`, `/coachs/:id`, `/cours/:id` | public |
| `/inscription`, `/connexion`, `/verification-email`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` | public |
| `/mes-reservations`, `/mes-favoris`, `/profil` | connecté |
| `/coach/**` | `ROLE_COACH` |
| `/gestionnaire/**` | `ROLE_MANAGER` |
| `/admin/**` | `ROLE_ADMIN` |

## Conventions

- État asynchrone dans des **signals** (`signal`, `computed`, `linkedSignal`) – obligatoire en zoneless.
- Formulaires réactifs typés (`FormBuilder.nonNullable`) avec messages d'erreur en français.
- Chaque liste a un état « chargement », « vide » et « erreur ».
- Le JWT est stocké dans `localStorage` (`fitbook_token`) ; seul `exp` est décodé côté client,
  l'utilisateur courant est rechargé via `GET /auth/me` au démarrage.

## Bonus (US-21, US-22, US-36, US-44, US-54)

| US | Fonctionnalité | Où |
|----|----------------|----|
| US-21 | **Carte + distance** : bascule « Liste / Carte » sur `/recherche`, carte Leaflet (tuiles OpenStreetMap) avec un marqueur orange par salle géolocalisée (popup : nom, ville, note, lien vers la fiche), bouton « Autour de moi » (`navigator.geolocation` → query params `lat`/`lng`, conservés lors des changements de filtres), marqueur distinct pour la position, bouton « Retirer la position », distance (« à 2,3 km ») sur les cartes de salles, ordre de l'API respecté (tri par distance). Refus de géolocalisation = message d'avertissement. Carte mono-salle sur `/salles/:id`. | `shared/components/gym-map`, `features/search`, `features/gym-detail`, `gym-card` |
| US-22 | **QR code** : sur `/mes-reservations`, image du QR (`Booking.qrCodeDataUri`, data URI SVG) affichée pour les réservations confirmées ; clic → modale « À présenter à l'entrée » (QR 300 px + code texte, fermeture par Échap). | `features/user/my-bookings` |
| US-36 | **Statistiques coach** : `GET /coach/stats` → 6 tuiles (séances données, séances à venir, participants accueillis, taux de remplissage avec barre, note moyenne avec étoiles + nombre d'avis, statut du profil). | `core/services/coach.service.ts` (`stats()`), `features/coach/dashboard` |
| US-44 | **Export CSV** : bouton « Exporter en CSV » sur `/gestionnaire/salles/:id/reservations`, appelle `GET /manager/gyms/{id}/bookings/export` (mêmes filtres que la liste : `from`, `to`, `courseId`, `status`) en `responseType: 'blob'`, téléchargement via `URL.createObjectURL`, nom tiré de `Content-Disposition` sinon `reservations-<salle>-<AAAA-MM-JJ>.csv`, état « Export en cours… », toast succès/erreur. Un filtre « Statut » a été ajouté à la page (partagé liste + export). | `manager.service.ts` (`exportGymBookingsCsv()`), `core/utils/download.utils.ts`, `features/manager/gym-bookings` |
| US-54 | **Graphiques admin** sans librairie : `bar-chart` (SVG inline, 1 ou 2 séries groupées/empilées, vertical ou horizontal, axes, `<title>` au survol, couleurs par variables CSS, largeur du `viewBox` calée sur le conteneur via `ResizeObserver`) et `donut-chart` (anneau + légende). Tableau de bord `/admin` : inscriptions par mois, réservations confirmées vs annulées par mois, répartition par statut, top activités, top salles. Mois en français abrégé (« mai 26 », `formatMonthShort`). | `shared/components/bar-chart`, `shared/components/donut-chart`, `features/admin/dashboard` |

Notes techniques :

- `leaflet` + `@types/leaflet` sont installés ; `angular.json` charge `leaflet.css`, copie les images de marqueurs dans `leaflet/` et déclare `leaflet` en dépendance CommonJS autorisée. Les marqueurs sont des `L.divIcon` CSS (styles dans `styles.scss`, section « Carte Leaflet »), la carte est créée dans `afterNextRender`, détruite dans `ngOnDestroy`, et `invalidateSize()` est appelé après affichage (bascule Liste/Carte).
- Angular n'autorise pas `data:image/svg+xml` dans `[src]` : la data URI du QR code (émise par notre API) est marquée sûre via `DomSanitizer.bypassSecurityTrustUrl`.
- Les nouveaux champs d'`AdminStats` sont optionnels côté modèle : les graphiques affichent un état vide si l'API ne les renvoie pas encore.
