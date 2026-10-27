import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fitbook_token';

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  set token(value: string | null) {
    try {
      if (value) {
        localStorage.setItem(TOKEN_KEY, value);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // stockage indisponible (navigation privée…) : on ignore
    }
  }

  clear(): void {
    this.token = null;
  }

  /** Décode le payload du JWT (uniquement pour lire l'expiration côté client). */
  decode(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload || typeof payload.exp !== 'number') {
      return false;
    }
    return payload.exp * 1000 <= Date.now();
  }

  hasValidToken(): boolean {
    const token = this.token;
    return !!token && !this.isExpired(token);
  }
}
