import { Role } from './user.model';

export interface AdminUserPayload {
  roles: Role[];
  isActive: boolean;
  firstName: string;
  lastName: string;
}

export interface MonthCount {
  /** Mois au format "AAAA-MM". */
  month: string;
  count: number;
}

export interface MonthBookings {
  month: string;
  confirmed: number;
  cancelled: number;
}

export interface BookingsByStatus {
  confirmee: number;
  annulee: number;
  terminee: number;
}

export interface TopItem {
  name: string;
  bookings: number;
}

export interface AdminStats {
  users: number;
  bookings: number;
  sessions: number;
  fillRate: number;
  /** US-54 : séries des 6 derniers mois et classements (optionnels : tolérance si l'API ne les renvoie pas encore). */
  registrationsByMonth?: MonthCount[];
  bookingsByMonth?: MonthBookings[];
  bookingsByStatus?: BookingsByStatus;
  topActivities?: TopItem[];
  topGyms?: TopItem[];
}

export interface ActivityPayload {
  name: string;
  description: string;
  icon: string;
}

export interface AdminBookingFilters {
  status?: string;
  date?: string;
  userId?: string;
  page?: number;
}
