import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookingWithUser,
  CourseDetail,
  CoursePayload,
  GymDetail,
  GymPayload,
  GymReviews,
  GymStats,
  OpeningHour,
  PlanSessionsPayload,
  Session,
} from '../models';
import { toIsoDate } from '../utils/date.utils';
import { buildParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class ManagerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/manager`;

  gyms(): Observable<GymDetail[]> {
    return this.http.get<GymDetail[]>(`${this.base}/gyms`);
  }

  createGym(payload: GymPayload): Observable<GymDetail> {
    return this.http.post<GymDetail>(`${this.base}/gyms`, payload);
  }

  updateGym(id: number, payload: GymPayload): Observable<GymDetail> {
    return this.http.put<GymDetail>(`${this.base}/gyms/${id}`, payload);
  }

  saveOpeningHours(gymId: number, hours: OpeningHour[]): Observable<OpeningHour[]> {
    return this.http.put<OpeningHour[]>(`${this.base}/gyms/${gymId}/opening-hours`, hours);
  }

  createCourse(gymId: number, payload: CoursePayload): Observable<CourseDetail> {
    return this.http.post<CourseDetail>(`${this.base}/gyms/${gymId}/courses`, payload);
  }

  updateCourse(id: number, payload: CoursePayload): Observable<CourseDetail> {
    return this.http.put<CourseDetail>(`${this.base}/courses/${id}`, payload);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/courses/${id}`);
  }

  planSessions(courseId: number, payload: PlanSessionsPayload): Observable<Session[]> {
    return this.http.post<Session[]>(`${this.base}/courses/${courseId}/sessions`, payload);
  }

  gymSessions(
    gymId: number,
    from: Date,
    to: Date,
    courseId?: number | null,
  ): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/gyms/${gymId}/sessions`, {
      params: buildParams({ from: toIsoDate(from), to: toIsoDate(to), courseId }),
    });
  }

  gymBookings(
    gymId: number,
    options: { from?: Date; to?: Date; courseId?: number | null; status?: string } = {},
  ): Observable<BookingWithUser[]> {
    return this.http.get<BookingWithUser[]>(`${this.base}/gyms/${gymId}/bookings`, {
      params: buildParams({
        from: options.from ? toIsoDate(options.from) : undefined,
        to: options.to ? toIsoDate(options.to) : undefined,
        courseId: options.courseId,
        status: options.status,
      }),
    });
  }

  cancelSession(id: number): Observable<Session> {
    return this.http.patch<Session>(`${this.base}/sessions/${id}/cancel`, {});
  }

  gymReviews(gymId: number): Observable<GymReviews> {
    return this.http.get<GymReviews>(`${this.base}/gyms/${gymId}/reviews`);
  }

  gymStats(gymId: number): Observable<GymStats> {
    return this.http.get<GymStats>(`${this.base}/gyms/${gymId}/stats`);
  }

  /**
   * US-44 : export CSV des réservations d'une salle (mêmes filtres que la liste).
   * Réponse complète (`observe: 'response'`) pour lire l'en-tête `Content-Disposition`.
   */
  exportGymBookingsCsv(
    gymId: number,
    options: { from?: Date; to?: Date; courseId?: number | null; status?: string } = {},
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/gyms/${gymId}/bookings/export`, {
      params: buildParams({
        from: options.from ? toIsoDate(options.from) : undefined,
        to: options.to ? toIsoDate(options.to) : undefined,
        courseId: options.courseId,
        status: options.status,
      }),
      responseType: 'blob',
      observe: 'response',
    });
  }
}
