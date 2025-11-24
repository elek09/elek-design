import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  throwError,
  of,
  map,
} from 'rxjs';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../app.tokens';
import { LoginRequest, User } from '../models/user.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = inject(API_BASE_URL);

  private readonly USER_KEY = 'admin_user';

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage(),
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  // Removed empty constructor (not needed with inject()).

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<
        ApiResponse<{ user: User }>
      >(`${this.apiBase}/api/v1/auth/login`, credentials, { withCredentials: true })
      .pipe(
        map((response) => {
          const user = response.data?.user;
          if (response.success && user) {
            this.currentUserSubject.next(user);
            if (typeof window !== 'undefined') {
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            }
            return user;
          }
          throw new Error('Login failed');
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    // If not logged in, just ensure local cleanup and redirect
    if (!this.currentUserSubject.value) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.USER_KEY);
      }
      this.router.navigate(['/admin/login']);
      return;
    }

    // Call backend to invalidate session; ignore errors/401
    this.http
      .post(`${this.apiBase}/api/v1/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.currentUserSubject.next(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.USER_KEY);
        }
        this.router.navigate(['/admin/login']);
      });
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return !!this.currentUserSubject.value?.admin;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Called when backend returns 401 for a protected resource
  handleUnauthorized(): void {
    if (this.currentUserSubject.value) {
      this.currentUserSubject.next(null);
    }
    this.clearSession();
    if (this.router.url !== '/admin/login') {
      this.router.navigate(['/admin/login']);
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // In cookie-based auth, token expiry is handled server-side.
}
