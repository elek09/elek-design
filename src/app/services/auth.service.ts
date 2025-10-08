import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/admin.models';
import { ADMIN_API_BASE_URL } from '../app.tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly adminUrl = inject(ADMIN_API_BASE_URL);

  private readonly TOKEN_KEY = 'admin_token';
  private readonly USER_KEY = 'admin_user';

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if token is expired on service initialization
    this.checkTokenExpiry();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.adminUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.token) {
            this.setSession(response.token, response.user);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('Checking authentication - token:', token);

    if (!token) {
      console.log('No token found');
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('Token is expired, logging out');
      this.logout();
      return false;
    }

    console.log('User is authenticated');
    return true;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getAuthHeadersForFormData(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - let browser set it with boundary
    });
  }

  private setSession(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
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

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    // Laravel Sanctum tokens don't have expiry built-in like JWT
    // They are in format: {id}|{token}
    // For now, we'll assume tokens are valid until the backend returns 401
    // You could implement a token validation endpoint if needed

    if (token.includes('|')) {
      // This is a Laravel Sanctum token, assume it's valid
      // The backend will return 401 if it's actually expired
      return false;
    }

    // If it's a JWT token, check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      // If we can't decode, assume it's a simple token (like Sanctum) and let backend validate
      return false;
    }
  }

  private checkTokenExpiry(): void {
    if (this.getToken() && this.isTokenExpired()) {
      this.logout();
    }
  }
}
