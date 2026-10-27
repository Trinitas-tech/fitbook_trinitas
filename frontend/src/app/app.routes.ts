import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ---------- Public ----------
  {
    path: '',
    title: 'Accueil',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'recherche',
    title: 'Recherche',
    loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'salles/:id',
    title: 'Fiche salle',
    loadComponent: () =>
      import('./features/gym-detail/gym-detail.component').then((m) => m.GymDetailComponent),
  },
  {
    path: 'coachs/:id',
    title: 'Fiche coach',
    loadComponent: () =>
      import('./features/coach-detail/coach-detail.component').then((m) => m.CoachDetailComponent),
  },
  {
    path: 'cours/:id',
    title: 'Fiche cours',
    loadComponent: () =>
      import('./features/course-detail/course-detail.component').then((m) => m.CourseDetailComponent),
  },

  // ---------- Authentification ----------
  {
    path: 'inscription',
    title: 'Inscription',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'verification-email',
    title: 'Vérification de l’e-mail',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'connexion',
    title: 'Connexion',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oublié',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reinitialiser-mot-de-passe',
    title: 'Réinitialiser le mot de passe',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },

  // ---------- Sportif (connecté) ----------
  {
    path: 'mes-reservations',
    title: 'Mes réservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/my-bookings/my-bookings.component').then((m) => m.MyBookingsComponent),
  },
  {
    path: 'mes-favoris',
    title: 'Mes favoris',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/my-favorites/my-favorites.component').then((m) => m.MyFavoritesComponent),
  },
  {
    path: 'profil',
    title: 'Mon profil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/profile/profile.component').then((m) => m.ProfileComponent),
  },

  // ---------- Coach ----------
  {
    path: 'coach',
    canActivate: [roleGuard('ROLE_COACH')],
    loadComponent: () => import('./features/coach/coach-layout.component').then((m) => m.CoachLayoutComponent),
    children: [
      {
        path: '',
        title: 'Tableau de bord coach',
        loadComponent: () =>
          import('./features/coach/dashboard/coach-dashboard.component').then((m) => m.CoachDashboardComponent),
      },
      {
        path: 'profil',
        title: 'Profil professionnel',
        loadComponent: () =>
          import('./features/coach/profile/coach-profile.component').then((m) => m.CoachProfileComponent),
      },
      {
        path: 'disponibilites',
        title: 'Mes disponibilités',
        loadComponent: () =>
          import('./features/coach/availabilities/coach-availabilities.component').then(
            (m) => m.CoachAvailabilitiesComponent,
          ),
      },
      {
        path: 'seances',
        title: 'Mes séances',
        loadComponent: () =>
          import('./features/coach/sessions/coach-sessions.component').then((m) => m.CoachSessionsComponent),
      },
      {
        path: 'seances/nouvelle',
        title: 'Nouvelle séance',
        loadComponent: () =>
          import('./features/coach/session-form/coach-session-form.component').then(
            (m) => m.CoachSessionFormComponent,
          ),
      },
      {
        path: 'seances/:id',
        title: 'Détail de la séance',
        loadComponent: () =>
          import('./features/coach/session-detail/coach-session-detail.component').then(
            (m) => m.CoachSessionDetailComponent,
          ),
      },
      {
        path: 'avis',
        title: 'Mes avis',
        loadComponent: () =>
          import('./features/coach/reviews/coach-reviews.component').then((m) => m.CoachReviewsComponent),
      },
    ],
  },

  // ---------- Gestionnaire ----------
  {
    path: 'gestionnaire',
    canActivate: [roleGuard('ROLE_MANAGER')],
    loadComponent: () =>
      import('./features/manager/manager-layout.component').then((m) => m.ManagerLayoutComponent),
    children: [
      {
        path: '',
        title: 'Tableau de bord',
        loadComponent: () =>
          import('./features/manager/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'salles',
        title: 'Mes salles',
        loadComponent: () =>
          import('./features/manager/gyms/manager-gyms.component').then((m) => m.ManagerGymsComponent),
      },
      {
        path: 'salles/nouvelle',
        title: 'Nouvelle salle',
        loadComponent: () =>
          import('./features/manager/gym-form/manager-gym-form.component').then((m) => m.ManagerGymFormComponent),
      },
      {
        path: 'salles/:id',
        title: 'Fiche salle',
        loadComponent: () =>
          import('./features/manager/gym-form/manager-gym-form.component').then((m) => m.ManagerGymFormComponent),
      },
      {
        path: 'salles/:id/cours',
        title: 'Cours de la salle',
        loadComponent: () =>
          import('./features/manager/gym-courses/manager-gym-courses.component').then(
            (m) => m.ManagerGymCoursesComponent,
          ),
      },
      {
        path: 'salles/:id/reservations',
        title: 'Réservations de la salle',
        loadComponent: () =>
          import('./features/manager/gym-bookings/manager-gym-bookings.component').then(
            (m) => m.ManagerGymBookingsComponent,
          ),
      },
      {
        path: 'salles/:id/avis',
        title: 'Avis de la salle',
        loadComponent: () =>
          import('./features/manager/gym-reviews/manager-gym-reviews.component').then(
            (m) => m.ManagerGymReviewsComponent,
          ),
      },
    ],
  },

  // ---------- Administrateur ----------
  {
    path: 'admin',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () => import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        title: 'Administration',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'utilisateurs',
        title: 'Utilisateurs',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'coachs',
        title: 'Validation des coachs',
        loadComponent: () =>
          import('./features/admin/coaches/admin-coaches.component').then((m) => m.AdminCoachesComponent),
      },
      {
        path: 'activites',
        title: 'Activités',
        loadComponent: () =>
          import('./features/admin/activities/admin-activities.component').then((m) => m.AdminActivitiesComponent),
      },
      {
        path: 'salles',
        title: 'Salles',
        loadComponent: () => import('./features/admin/gyms/admin-gyms.component').then((m) => m.AdminGymsComponent),
      },
      {
        path: 'reservations',
        title: 'Réservations',
        loadComponent: () =>
          import('./features/admin/bookings/admin-bookings.component').then((m) => m.AdminBookingsComponent),
      },
      {
        path: 'avis',
        title: 'Modération des avis',
        loadComponent: () =>
          import('./features/admin/reviews/admin-reviews.component').then((m) => m.AdminReviewsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
