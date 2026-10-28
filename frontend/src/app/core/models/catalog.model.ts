export interface Activity {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface GymCard {
  id: number;
  name: string;
  city: string;
  postalCode: string;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  activities: string[];
  isFavorite: boolean;
}

export interface OpeningHour {
  dayOfWeek: number; // 1 = lundi … 7 = dimanche
  opensAt: string; // "08:00"
  closesAt: string; // "22:00"
}

export interface GymDetail extends GymCard {
  description: string | null;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  totalCapacity: number;
  openingHours: OpeningHour[];
  courses: CourseCard[];
  reviews: Review[];
  manager: { id: number; firstName: string; lastName: string } | null;
}

export interface CoachCard {
  id: number;
  firstName: string;
  lastName: string;
  specialty: string | null;
  city: string | null;
  hourlyRate: number | null;
  avatarUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  isFavorite: boolean;
}

export interface Availability {
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
}

export interface CoachDetail extends CoachCard {
  bio: string | null;
  availabilities: Availability[];
  sessions: Session[];
  reviews: Review[];
}

export type CourseLevel = 'debutant' | 'intermediaire' | 'avance' | 'tous_niveaux' | string;

export interface CourseCard {
  id: number;
  title: string;
  level: CourseLevel;
  durationMinutes: number;
  price: number;
  capacity: number;
  imageUrl: string | null;
  activity: Activity;
  gym: { id: number; name: string; city: string };
  coach: CoachCard | null;
  nextSessionAt: string | null;
}

export interface CourseDetail extends CourseCard {
  description: string | null;
  sessions: Session[];
}

export type SessionStatus = 'planifiee' | 'complete' | 'annulee' | 'terminee';

export interface Session {
  id: number;
  startAt: string;
  endAt: string;
  capacity: number;
  remainingSeats: number;
  price: number;
  status: SessionStatus;
  location: string | null;
  course: { id: number; title: string; gym: { id: number; name: string } } | null;
  coach: CoachCard | null;
  isBookable: boolean;
  myBookingId: number | null;
  /** Présent sur les routes coach / gestionnaire. */
  bookingCount?: number;
}

export type ReviewStatus = 'approuve' | 'masque' | 'en_attente' | string;

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  status: ReviewStatus;
  author: { id: number; firstName: string; lastName: string };
  gym: { id: number; name: string } | null;
  coach: { id: number; firstName: string; lastName: string } | null;
}

export interface SearchResult {
  gyms: GymCard[];
  coaches: CoachCard[];
  courses: CourseCard[];
  total: number;
}

export type SearchType = 'gym' | 'coach' | 'course';

export interface SearchParams {
  q?: string;
  city?: string;
  activity?: string;
  level?: string;
  priceMax?: string;
  date?: string;
  ratingMin?: string;
  type?: SearchType | '';
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planifiee: 'Planifiée',
  complete: 'Complète',
  annulee: 'Annulée',
  terminee: 'Terminée',
};

export const SESSION_STATUS_BADGES: Record<SessionStatus, string> = {
  planifiee: 'badge-info',
  complete: 'badge-warning',
  annulee: 'badge-danger',
  terminee: 'badge',
};

export const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  tous_niveaux: 'Tous niveaux',
};

export const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'tous_niveaux', label: 'Tous niveaux' },
];

export const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAY_SHORT_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  approuve: 'Approuvé',
  masque: 'Masqué',
  en_attente: 'En attente',
};
