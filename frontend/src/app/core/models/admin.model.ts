import { Role } from './user.model';

export interface AdminUserPayload {
  roles: Role[];
  isActive: boolean;
  firstName: string;
  lastName: string;
}

export interface AdminStats {
  users: number;
  bookings: number;
  sessions: number;
  fillRate: number;
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
