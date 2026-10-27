export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export interface MessageResponse {
  message: string;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    typeof (value as ApiError).message === 'string'
  );
}

/** Extrait un message lisible depuis une erreur quelconque. */
export function errorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (isApiError(err)) {
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
