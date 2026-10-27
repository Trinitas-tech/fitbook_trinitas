import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Activity,
  CoachCard,
  CoachDetail,
  CourseDetail,
  GymCard,
  GymDetail,
  Paginated,
  SearchParams,
  SearchResult,
  Session,
} from '../models';
import { toIsoDate } from '../utils/date.utils';
import { buildParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  search(params: SearchParams): Observable<SearchResult> {
    return this.http.get<SearchResult>(`${this.base}/search`, {
      params: buildParams({ ...params }),
    });
  }

  activities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.base}/activities`);
  }

  gyms(options: { city?: string; page?: number; limit?: number } = {}): Observable<Paginated<GymCard>> {
    return this.http.get<Paginated<GymCard>>(`${this.base}/gyms`, { params: buildParams(options) });
  }

  gym(id: number): Observable<GymDetail> {
    return this.http.get<GymDetail>(`${this.base}/gyms/${id}`);
  }

  gymSessions(id: number, from: Date, to: Date): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/gyms/${id}/sessions`, {
      params: buildParams({ from: toIsoDate(from), to: toIsoDate(to) }),
    });
  }

  coaches(
    options: { city?: string; specialty?: string; page?: number; limit?: number } = {},
  ): Observable<Paginated<CoachCard>> {
    return this.http.get<Paginated<CoachCard>>(`${this.base}/coaches`, {
      params: buildParams(options),
    });
  }

  coach(id: number): Observable<CoachDetail> {
    return this.http.get<CoachDetail>(`${this.base}/coaches/${id}`);
  }

  course(id: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.base}/courses/${id}`);
  }

  session(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.base}/sessions/${id}`);
  }
}
