import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Availability,
  CoachDetail,
  CoachProfile,
  CoachProfilePayload,
  CoachReviews,
  CoachSessionPayload,
  CoachStats,
  Session,
  SessionParticipant,
} from '../models';
import { toIsoDate } from '../utils/date.utils';
import { buildParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/coach`;

  profile(): Observable<CoachProfile> {
    return this.http.get<CoachProfile>(`${this.base}/profile`);
  }

  updateProfile(payload: CoachProfilePayload): Observable<CoachDetail> {
    return this.http.put<CoachDetail>(`${this.base}/profile`, payload);
  }

  sessions(from: Date, to: Date): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/sessions`, {
      params: buildParams({ from: toIsoDate(from), to: toIsoDate(to) }),
    });
  }

  createSession(payload: CoachSessionPayload): Observable<Session> {
    return this.http.post<Session>(`${this.base}/sessions`, payload);
  }

  updateSession(id: number, payload: CoachSessionPayload): Observable<Session> {
    return this.http.put<Session>(`${this.base}/sessions/${id}`, payload);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessions/${id}`);
  }

  cancelSession(id: number): Observable<Session> {
    return this.http.patch<Session>(`${this.base}/sessions/${id}/cancel`, {});
  }

  sessionBookings(id: number): Observable<SessionParticipant[]> {
    return this.http.get<SessionParticipant[]>(`${this.base}/sessions/${id}/bookings`);
  }

  availabilities(): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.base}/availabilities`);
  }

  saveAvailabilities(payload: Availability[]): Observable<Availability[]> {
    return this.http.put<Availability[]>(`${this.base}/availabilities`, payload);
  }

  reviews(): Observable<CoachReviews> {
    return this.http.get<CoachReviews>(`${this.base}/reviews`);
  }

  /** US-36 : statistiques du tableau de bord coach. */
  stats(): Observable<CoachStats> {
    return this.http.get<CoachStats>(`${this.base}/stats`);
  }
}
