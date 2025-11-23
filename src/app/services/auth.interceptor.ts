import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  API_BASE_URL,
  ADMIN_API_BASE_URL,
  GALLERY_API_BASE_URL,
} from '../app.tokens';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(API_BASE_URL);
  const adminApi = inject(ADMIN_API_BASE_URL);
  const galleryApi = inject(GALLERY_API_BASE_URL);
  const authService = inject(AuthService);

  const url = req.url;
  const shouldAttach =
    url.startsWith(api) ||
    url.startsWith(adminApi) ||
    url.startsWith(galleryApi);

  if (!shouldAttach) {
    return next(req).pipe(
      catchError((err) => {
        if (err.status === 401) {
          authService.handleUnauthorized();
        }
        return throwError(() => err);
      }),
    );
  }

  // Add withCredentials and XSRF header from cookie for cross-origin API calls
  try {
    const cookie = typeof document !== 'undefined' ? document.cookie : '';
    const match = cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
    if (match) {
      const xsrf = decodeURIComponent(match.split('=')[1] || '');
      if (xsrf) {
        return next(
          req.clone({
            withCredentials: true,
            setHeaders: { 'X-XSRF-TOKEN': xsrf },
          }),
        ).pipe(
          catchError((err) => {
            if (err.status === 401) {
              authService.handleUnauthorized();
            }
            return throwError(() => err);
          }),
        );
      }
    }
  } catch {}

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authService.handleUnauthorized();
      }
      return throwError(() => err);
    }),
  );
};
