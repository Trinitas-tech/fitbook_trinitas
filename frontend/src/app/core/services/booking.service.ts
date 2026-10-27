import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, CreateBookingPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings`;

  create(payload: CreateBookingPayload): Observable<Booking> {
    return this.http.post<Booking>(this.base, payload);
  }

  mine(scope: 'upcoming' | 'past'): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/me`, { params: { scope } });
  }

  cancel(id: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/${id}/cancel`, {});
  }
}
