import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  throwError,
  switchMap,
  of,
} from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/admin.models';
import { ADMIN_API_BASE_URL, API_BASE_URL } from '../app.tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly adminUrl = inject(ADMIN_API_BASE_URL);
  private readonly apiBase = inject(API_BASE_URL);

  private readonly USER_KEY = 'admin_user';

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // 1) Get CSRF cookie, 2) POST login using cookie-based session
    return this.http
      .get<void>(`${this.apiBase}/sanctum/csrf-cookie`, {
        withCredentials: true,
      })
      .pipe(
        switchMap(() =>
          this.http.post<LoginResponse>(
            `${this.apiBase}/api/v1/auth/login`,
            credentials,
            { withCredentials: true }
          )
        ),
        tap((response: LoginResponse) => {
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                this.USER_KEY,
                JSON.stringify(response.user)
              );
            }
          }
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
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

  getUser(): User | null {
    return this.currentUserSubject.value;
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
