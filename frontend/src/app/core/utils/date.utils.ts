export type CalendarView = 'week' | 'month';

/** Lundi (00:00) de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Format YYYY-MM-DD (date locale). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format YYYY-MM-DDTHH:mm pour un input datetime-local. */
export function toDateTimeLocal(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${toIsoDate(date)}T${h}:${min}`;
}

/** Convertit une valeur de datetime-local en ISO 8601 pour l'API. */
export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

/** Plage [from, to] couverte par une vue calendrier à partir d'un curseur. */
export function calendarRange(cursor: Date, view: CalendarView): { from: Date; to: Date } {
  if (view === 'month') {
    const from = startOfWeek(startOfMonth(cursor));
    const to = addDays(startOfWeek(endOfMonth(cursor)), 7);
    return { from, to };
  }
  const from = startOfWeek(cursor);
  return { from, to: addDays(from, 7) };
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Durée en minutes entre deux dates ISO. */
export function durationMinutes(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}
