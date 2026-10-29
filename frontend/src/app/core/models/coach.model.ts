import { Availability, CoachDetail, Review } from './catalog.model';

export interface CoachProfile extends CoachDetail {
  isValidated: boolean;
  isComplete: boolean;
}

export interface CoachProfilePayload {
  specialty: string;
  bio: string;
  hourlyRate: number;
  city: string;
  avatarUrl: string | null;
}

export interface CoachSessionPayload {
  startAt: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  price: number;
}

export interface CoachReviews {
  averageRating: number | null;
  reviews: Review[];
}

export type AvailabilityPayload = Availability[];

/** US-36 : statistiques du tableau de bord coach (`GET /coach/stats`). */
export interface CoachStats {
  sessionsGiven: number;
  upcomingSessions: number;
  totalParticipants: number;
  /** Taux de remplissage en pourcentage (0-100). */
  fillRate: number;
  averageRating: number | null;
  reviewCount: number;
}
