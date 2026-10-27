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
