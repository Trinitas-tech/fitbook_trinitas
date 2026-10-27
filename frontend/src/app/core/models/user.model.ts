export type Role = 'ROLE_USER' | 'ROLE_COACH' | 'ROLE_MANAGER' | 'ROLE_ADMIN';

export type RegisterRole = 'user' | 'coach' | 'manager';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: Role[];
  isVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  coach?: { id: number; isValidated: boolean } | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RegisterRole;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_USER: 'Sportif',
  ROLE_COACH: 'Coach',
  ROLE_MANAGER: 'Gestionnaire',
  ROLE_ADMIN: 'Administrateur',
};
