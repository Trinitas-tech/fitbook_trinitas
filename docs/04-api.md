# FitBook – Contrat de l'API REST (Symfony)

Base URL (dev) : `http://localhost:8000/api`. Toutes les réponses sont en JSON.
Authentification : JWT (`Authorization: Bearer <token>`). Les routes marquées 🔒 exigent un token,
celles marquées 🔒`ROLE_X` exigent en plus ce rôle (sinon 403 via Voter).

Format d'erreur commun :
```json
{ "message": "Texte lisible", "errors": { "champ": "détail" } }
```
Codes : 400 (validation), 401 (non connecté), 403 (interdit), 404, 409 (conflit métier : séance complète, doublon...).

Pagination (listes) : `?page=1&limit=20` → `{ "items": [...], "total": 57, "page": 1, "limit": 20 }`.

## 1. Authentification (`/auth`)

| Méthode | Route | Corps / Params | Réponse | US |
|---------|-------|----------------|---------|----|
| POST | `/auth/register` | `{ email, password, firstName, lastName, role: "user"\|"coach"\|"manager" }` | 201 `{ message }` + e-mail de confirmation | US-01 |
| GET | `/auth/verify-email?token=` | | 200 `{ message }` / 400 si expiré (24 h) | US-02 |
| POST | `/auth/login` | `{ email, password }` | 200 `{ token }` ; 401 générique ; 403 si non vérifié / désactivé | US-03 |
| GET 🔒 | `/auth/me` | | `User` | US-03 |
| PUT 🔒 | `/auth/me` | `{ firstName, lastName, phone, avatarUrl, currentPassword?, newPassword? }` | `User` | US-05 |
| POST | `/auth/forgot-password` | `{ email }` | 200 toujours | US-04 |
| POST | `/auth/reset-password` | `{ token, password }` | 200 / 400 | US-04 |

Objet `User` :
```json
{ "id": 1, "email": "a@b.fr", "firstName": "Ana", "lastName": "Dupont", "phone": null,
  "avatarUrl": null, "roles": ["ROLE_USER"], "isVerified": true, "createdAt": "2026-10-27T10:00:00+00:00",
  "coach": { "id": 3, "isValidated": true } }
```

## 2. Catalogue public

| Méthode | Route | Params | Réponse | US |
|---------|-------|--------|---------|----|
| GET | `/search` | `q, city, activity (id), level, priceMax, date (YYYY-MM-DD), ratingMin, type (gym\|coach\|course)` | `{ gyms: [GymCard], coaches: [CoachCard], courses: [CourseCard], total }` | US-10, US-11 |
| GET | `/activities` | | `[Activity]` | |
| GET | `/gyms` | `city, page, limit` | pagination de `GymCard` | US-12 |
| GET | `/gyms/{id}` | | `GymDetail` (horaires, cours, avis approuvés, note moyenne) | US-12 |
| GET | `/gyms/{id}/sessions` | `from, to` | `[Session]` | US-12 |
| GET | `/coaches` | `city, specialty, page, limit` | pagination de `CoachCard` (coachs validés + profil complet) | US-13 |
| GET | `/coaches/{id}` | | `CoachDetail` (disponibilités, séances à venir, avis, note) | US-13 |
| GET | `/courses/{id}` | | `CourseDetail` (séances à venir avec places restantes) | US-14 |
| GET | `/sessions/{id}` | | `Session` | US-14 |

Objets :
```json
GymCard   { id, name, city, postalCode, imageUrl, averageRating, reviewCount, activities: ["Yoga"], isFavorite }
GymDetail { ...GymCard, description, address, phone, latitude, longitude, totalCapacity,
            openingHours: [{ dayOfWeek: 1..7, opensAt: "08:00", closesAt: "22:00" }],
            courses: [CourseCard], reviews: [Review], manager: { id, firstName, lastName } }
CoachCard { id, firstName, lastName, specialty, city, hourlyRate, avatarUrl, averageRating, reviewCount, isFavorite }
CoachDetail { ...CoachCard, bio, availabilities: [{ dayOfWeek, startsAt, endsAt }], sessions: [Session], reviews: [Review] }
CourseCard { id, title, level, durationMinutes, price, capacity, imageUrl, activity: Activity, gym: { id, name, city }, coach: CoachCard|null, nextSessionAt }
CourseDetail { ...CourseCard, description, sessions: [Session] }
Activity  { id, name, description, icon }
Session   { id, title, startAt, endAt, capacity, remainingSeats, price, status: "planifiee"|"complete"|"annulee"|"terminee",
            location, course: { id, title, level, activity, gym: { id, name, city } }|null, coach: CoachCard|null, isBookable, myBookingId,
            bookingCount (routes coach/manager uniquement) }
Review    { id, rating: 1..5, comment, createdAt, status, author: { id, firstName, lastName }, gym: {id,name}|null, coach: {id,firstName,lastName}|null }
```

## 3. Sportif (🔒 `ROLE_USER`)

| Méthode | Route | Corps | Réponse | US |
|---------|-------|-------|---------|----|
| POST | `/bookings` | `{ sessionId, seats: 1 }` | 201 `Booking` ; 409 si complète / passée / déjà réservée | US-15, US-60 |
| GET | `/bookings/me` | `?scope=upcoming\|past` | `[Booking]` | US-16 |
| PATCH | `/bookings/{id}/cancel` | | `Booking` ; 409 si < 2 h avant | US-17 |
| GET | `/favorites/me` | | `{ gyms: [GymCard], coaches: [CoachCard] }` | US-18 |
| POST / DELETE | `/favorites/gyms/{id}` | | 204 | US-18 |
| POST / DELETE | `/favorites/coaches/{id}` | | 204 | US-18 |
| POST | `/reviews` | `{ gymId?, coachId?, rating, comment }` | 201 `Review` ; 403 si aucune réservation terminée ; 409 si doublon | US-19 |
| PUT | `/reviews/{id}` | `{ rating, comment }` | `Review` (auteur seulement) | US-19 |

```json
Booking { id, bookedAt, status: "confirmee"|"annulee"|"terminee", seats, qrCode, session: Session, canBeCancelled }
```

## 4. Coach (🔒 `ROLE_COACH`, préfixe `/coach`)

| Méthode | Route | Corps | Réponse | US |
|---------|-------|-------|---------|----|
| GET | `/coach/profile` | | `CoachDetail` + `isValidated, isComplete` | US-30 |
| PUT | `/coach/profile` | `{ specialty, bio, hourlyRate, city, avatarUrl }` | `CoachDetail` | US-30 |
| GET | `/coach/sessions` | `from, to` | `[Session]` (+ `bookingCount`) | US-33 |
| POST | `/coach/sessions` | `{ startAt, durationMinutes, location, capacity, price }` | 201 `Session` ; 409 si hors disponibilité | US-31, US-32 |
| PUT | `/coach/sessions/{id}` | idem | `Session` | US-31 |
| DELETE | `/coach/sessions/{id}` | | 204 ; 409 si réservations confirmées | US-31 |
| PATCH | `/coach/sessions/{id}/cancel` | | `Session` (réservations annulées + e-mails) | US-31 |
| GET | `/coach/sessions/{id}/bookings` | | `[{ id, seats, status, user: { id, firstName, lastName, email } }]` | US-34 |
| GET / PUT | `/coach/availabilities` | `[{ dayOfWeek, startsAt, endsAt }]` (remplace tout) | liste | US-32 |
| GET | `/coach/reviews` | | `{ averageRating, reviews: [Review] }` | US-35 |

## 5. Gestionnaire (🔒 `ROLE_MANAGER`, préfixe `/manager`)

| Méthode | Route | Corps | Réponse | US |
|---------|-------|-------|---------|----|
| GET | `/manager/gyms` | | `[GymDetail]` (mes salles) | US-40 |
| POST | `/manager/gyms` | `{ name, description, address, city, postalCode, phone, imageUrl, totalCapacity, latitude?, longitude? }` | 201 `GymDetail` | US-40 |
| PUT | `/manager/gyms/{id}` | idem | `GymDetail` | US-40 |
| PUT | `/manager/gyms/{id}/opening-hours` | `[{ dayOfWeek, opensAt, closesAt }]` (jours absents = fermés) | liste | US-41 |
| POST | `/manager/gyms/{id}/courses` | `{ title, description, activityId, level, durationMinutes, price, capacity, imageUrl, coachId? }` | 201 `CourseDetail` | US-42 |
| PUT / DELETE | `/manager/courses/{id}` | idem | `CourseDetail` / 204 | US-42 |
| POST | `/manager/courses/{id}/sessions` | `{ startAt, capacity?, price?, repeatWeeks?: 0..12 }` | 201 `[Session]` ; 400 si capacité > salle | US-43 |
| GET | `/manager/gyms/{id}/sessions` | `from, to, courseId` | `[Session]` (+ `bookingCount`) | US-44 |
| GET | `/manager/gyms/{id}/bookings` | `from, to, courseId, status` | `[Booking + user]` | US-44 |
| PATCH | `/manager/sessions/{id}/cancel` | | `Session` (réservations annulées + e-mails) | US-45 |
| GET | `/manager/gyms/{id}/reviews` | | `{ averageRating, reviews }` | US-46 |
| PUT | `/manager/sessions/{id}` | `{ startAt?, capacity?, price? }` | `Session` ; DELETE → 204 (409 si réservations confirmées) | US-43 |
| GET | `/manager/gyms/{id}/stats` | | `{ upcomingSessions, bookingsThisWeek, fillRate (0-100), averageRating, reviewCount, courseCount }` | tableau de bord |

## 6. Administrateur (🔒 `ROLE_ADMIN`, préfixe `/admin`)

| Méthode | Route | Corps | Réponse | US |
|---------|-------|-------|---------|----|
| GET | `/admin/users` | `q, role, page, limit` | pagination `User` | US-50 |
| PUT | `/admin/users/{id}` | `{ roles, isActive, isVerified, firstName, lastName }` | `User` | US-50 |
| DELETE | `/admin/users/{id}` | | 204 ; 409 si l'utilisateur gère des salles | US-50 |
| GET | `/admin/coaches` | `validated=false` | `[CoachDetail + email]` (`isValidated`, `isComplete` inclus) | US-51 |
| PATCH | `/admin/coaches/{id}/validate` | `{ isValidated }` | `CoachDetail` | US-51 |
| GET / POST | `/admin/activities` ; PUT / DELETE `/admin/activities/{id}` | `{ name, description, icon }` | `Activity` | US-51 |
| GET | `/admin/gyms` ; PUT / DELETE `/admin/gyms/{id}` | | `GymDetail` | US-51 |
| GET | `/admin/bookings` | `status, date, userId, page` | pagination `Booking + user` | US-52 |
| PATCH | `/admin/bookings/{id}/cancel` | | `Booking` | US-52 |
| GET | `/admin/reviews` | `status, page` | pagination `Review` | US-53 |
| PATCH | `/admin/reviews/{id}` | `{ status: "approuve"\|"masque" }` | `Review` ; DELETE → 204 | US-53 |
| GET | `/admin/stats` | | `{ users, coaches, pendingCoaches, gyms, sessions, bookings, confirmedBookings, cancelledBookings, pendingReviews, fillRate (0-100) }` | US-54 |

Comptes de démonstration (fixtures, mot de passe `Password123!`) : `admin@fitbook.fr`, `manager@fitbook.fr`, `manager2@fitbook.fr`,
`coach1@fitbook.fr` à `coach3@fitbook.fr` (validés), `coach4@fitbook.fr` (en attente), `user1@fitbook.fr` à `user5@fitbook.fr`.
Un sportif qui re-réserve une séance qu'il avait annulée voit sa réservation réactivée (même `id`, nouveau code).

## 7. Règles métier côté API (US-60 à US-63)

- Réservation : transaction + verrou `SELECT ... FOR UPDATE` sur la séance ; `SUM(seats) + seats ≤ capacity`
  sinon 409 « Séance complète ». Une séance passe en `complete` quand elle est pleine.
- E-mails (Mailer, templates Twig en français) : confirmation d'inscription, confirmation de réservation,
  annulation de réservation, annulation de séance, réinitialisation de mot de passe.
- Note moyenne : calculée sur les avis `approuve` (arrondie à 1 décimale), exposée dans `averageRating`.
- Commande `app:sessions:close` : passe en `terminee` les séances dont `endAt < now()` et leurs réservations.
