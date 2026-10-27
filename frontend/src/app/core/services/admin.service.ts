import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Activity,
  ActivityPayload,
  AdminBookingFilters,
  AdminStats,
  AdminUserPayload,
  BookingWithUser,
  CoachDetail,
  GymDetail,
  Paginated,
  Review,
  User,
} from '../models';
import { buildParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  users(options: { q?: string; role?: string; page?: number; limit?: number }): Observable<Paginated<User>> {
    return this.http.get<Paginated<User>>(`${this.base}/users`, { params: buildParams(options) });
  }

  updateUser(id: number, payload: AdminUserPayload): Observable<User> {
    return this.http.put<User>(`${this.base}/users/${id}`, payload);
  }

  coaches(validated?: boolean): Observable<CoachDetail[]> {
    return this.http.get<CoachDetail[]>(`${this.base}/coaches`, {
      params: buildParams({ validated: validated === undefined ? undefined : String(validated) }),
    });
  }

  validateCoach(id: number, isValidated: boolean): Observable<CoachDetail> {
    return this.http.patch<CoachDetail>(`${this.base}/coaches/${id}/validate`, { isValidated });
  }

  activities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.base}/activities`);
  }

  createActivity(payload: ActivityPayload): Observable<Activity> {
    return this.http.post<Activity>(`${this.base}/activities`, payload);
  }

  updateActivity(id: number, payload: ActivityPayload): Observable<Activity> {
    return this.http.put<Activity>(`${this.base}/activities/${id}`, payload);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/activities/${id}`);
  }

  gyms(): Observable<GymDetail[]> {
    return this.http.get<GymDetail[]>(`${this.base}/gyms`);
  }

  deleteGym(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/gyms/${id}`);
  }

  bookings(filters: AdminBookingFilters): Observable<Paginated<BookingWithUser>> {
    return this.http.get<Paginated<BookingWithUser>>(`${this.base}/bookings`, {
      params: buildParams({ ...filters }),
    });
  }

  cancelBooking(id: number): Observable<BookingWithUser> {
    return this.http.patch<BookingWithUser>(`${this.base}/bookings/${id}/cancel`, {});
  }

  reviews(options: { status?: string; page?: number }): Observable<Paginated<Review>> {
    return this.http.get<Paginated<Review>>(`${this.base}/reviews`, { params: buildParams(options) });
  }

  moderateReview(id: number, status: 'approuve' | 'masque'): Observable<Review> {
    return this.http.patch<Review>(`${this.base}/reviews/${id}`, { status });
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reviews/${id}`);
  }
}
