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

  // Aktuális bejelentkezett felhasználó állapota
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage(),
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(
        `${this.apiBase}/api/v1/auth/login`,
        {
          email: credentials.email,
          password: credentials.password,
          remember: !!credentials.remember,
        },
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          const user = response.data?.user;
          if (response.success && user) {
            // Felhasználó állapot frissítése és localStorage-ba mentés
            this.currentUserSubject.next(user);
            if (typeof window !== 'undefined') {
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            }
            return user;
          }
          throw new Error('Bejelentkezés sikertelen');
        }),
        catchError((error) => {
          console.error('Bejelentkezési hiba:', error);
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    // Ha nincs bejelentkezett felhasználó, csak töröljük a session-t
    if (!this.currentUserSubject.value) {
      this.clearSession();
      this.router.navigate(['/admin/login']);
      return;
    }

    // Kijelentkezés a szerverről
    this.http
      .post(`${this.apiBase}/api/v1/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.currentUserSubject.next(null);
        this.clearSession();
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

  // 401-es hiba esetén hívódik meg (lejárt session, érvénytelen token)
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

  // LocalStorage-ból tölti be a felhasználót (SSR-kompatibilis)
  private getUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;

    const storedUser = localStorage.getItem(this.USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  }
}
