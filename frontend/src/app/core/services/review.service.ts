import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReviewPayload, Review } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reviews`;

  create(payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<Review>(this.base, payload);
  }

  update(id: number, payload: { rating: number; comment: string }): Observable<Review> {
    return this.http.put<Review>(`${this.base}/${id}`, payload);
  }
}
