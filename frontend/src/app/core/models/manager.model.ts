import { Review } from './catalog.model';

export interface GymPayload {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  imageUrl: string | null;
  totalCapacity: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CoursePayload {
  title: string;
  description: string;
  activityId: number;
  level: string;
  durationMinutes: number;
  price: number;
  capacity: number;
  imageUrl: string | null;
  coachId?: number | null;
}

export interface PlanSessionsPayload {
  startAt: string;
  capacity?: number;
  price?: number;
  repeatWeeks?: number;
}

export interface GymStats {
  upcomingSessions: number;
  bookingsThisWeek: number;
  fillRate: number;
  averageRating: number | null;
}

export interface GymReviews {
  averageRating: number | null;
  reviews: Review[];
}
