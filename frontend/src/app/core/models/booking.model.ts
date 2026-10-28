import { CoachCard, GymCard, Session } from './catalog.model';

export type BookingStatus = 'confirmee' | 'annulee' | 'terminee';

export interface Booking {
  id: number;
  bookedAt: string;
  status: BookingStatus;
  seats: number;
  qrCode: string | null;
  /** US-22 : image SVG du QR code en data URI (`data:image/svg+xml;base64,...`), contenu = `qrCode`. */
  qrCodeDataUri?: string | null;
  session: Session;
  canBeCancelled: boolean;
}

export interface BookingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface BookingWithUser extends Booking {
  user: BookingUser;
}

export interface SessionParticipant {
  id: number;
  seats: number;
  status: BookingStatus;
  user: BookingUser;
}

export interface CreateBookingPayload {
  sessionId: number;
  seats: number;
}

export interface FavoritesResponse {
  gyms: GymCard[];
  coaches: CoachCard[];
}

export interface CreateReviewPayload {
  gymId?: number;
  coachId?: number;
  rating: number;
  comment: string;
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  terminee: 'Terminée',
};

export const BOOKING_STATUS_BADGES: Record<BookingStatus, string> = {
  confirmee: 'badge-success',
  annulee: 'badge-danger',
  terminee: 'badge',
};
