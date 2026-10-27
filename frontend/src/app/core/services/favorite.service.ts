import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoritesResponse } from '../models';

export type FavoriteType = 'gym' | 'coach';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/favorites`;

  mine(): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(`${this.base}/me`);
  }

  add(type: FavoriteType, id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${this.segment(type)}/${id}`, {});
  }

  remove(type: FavoriteType, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${this.segment(type)}/${id}`);
  }

  private segment(type: FavoriteType): string {
    return type === 'gym' ? 'gyms' : 'coaches';
  }
}
