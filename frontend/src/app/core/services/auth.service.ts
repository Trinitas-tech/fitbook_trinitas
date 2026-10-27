import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  Role,
  UpdateProfilePayload,
  User,
} from '../models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);
  private readonly base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly roles = computed<Role[]>(() => this.currentUser()?.roles ?? []);
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly isManager = computed(() => this.hasRole('ROLE_MANAGER'));
  readonly isCoach = computed(() => this.hasRole('ROLE_COACH'));
  readonly initials = computed(() => {
    const u = this.currentUser();
    if (!u) {
      return '';
    }
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  /** Chargé au démarrage de l'application (APP_INITIALIZER). */
  async init(): Promise<void> {
    if (!this.storage.hasValidToken()) {
      this.storage.clear();
      return;
    }
    try {
      const user = await firstValueFrom(this.http.get<User>(`${this.base}/me`));
      this.currentUser.set(user);
    } catch {
      this.clearSession();
    }
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<{ token: string }>(`${this.base}/login`, payload).pipe(
      tap((res) => (this.storage.token = res.token)),
      switchMap(() => this.http.get<User>(`${this.base}/me`)),
      tap((user) => this.currentUser.set(user)),
    );
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) {
      this.router.navigate(['/']);
    }
  }

  clearSession(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  register(payload: RegisterPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/register`, payload);
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.base}/verify-email`, { params: { token } });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/reset-password`, { token, password });
  }

  refreshMe(): Observable<User | null> {
    if (!this.storage.hasValidToken()) {
      return of(null);
    }
    return this.http.get<User>(`${this.base}/me`).pipe(tap((u) => this.currentUser.set(u)));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    return this.http
      .put<User>(`${this.base}/me`, payload)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Page d'accueil de l'espace correspondant au rôle principal. */
  homeFor(user: User | null): string {
    const roles = user?.roles ?? [];
    if (roles.includes('ROLE_ADMIN')) {
      return '/admin';
    }
    if (roles.includes('ROLE_MANAGER')) {
      return '/gestionnaire';
    }
    if (roles.includes('ROLE_COACH')) {
      return '/coach';
    }
    return '/mes-reservations';
  }
}
