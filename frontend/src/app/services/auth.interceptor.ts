import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = inject(API_BASE_URL);
  const authService = inject(AuthService);

  const handleError = (error: any) => {
    if (error.status === 401) {
      authService.handleUnauthorized();
    }
    return throwError(() => error);
  };

  if (!req.url.startsWith(apiBase)) {
    return next(req).pipe(catchError(handleError));
  }

  // XSRF token kinyerése cookie-ból
  let xsrfToken: string | undefined;
  try {
    const cookie = typeof document !== 'undefined' ? document.cookie : '';
    const match = cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
    if (match) {
      xsrfToken = decodeURIComponent(match.split('=')[1] || '');
    }
  } catch {}

  // Request klónozása cookie-alapú autentikációhoz
  const clonedReq = req.clone({
    withCredentials: true,
    // Ha van XSRF token, akkor azt is hozzáadjuk headerként
    ...(xsrfToken && { setHeaders: { 'X-XSRF-TOKEN': xsrfToken } }),
  });

  return next(clonedReq).pipe(catchError(handleError));
};
