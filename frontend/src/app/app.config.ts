import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideZoneChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { API_BASE_URL } from './app.tokens';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { BootstrapService } from './services/bootstrap.service';
import { catchError, firstValueFrom, of, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([authInterceptor]),
    ),
    // Fetch CSRF cookie once at app startup for Sanctum
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [HttpClient, API_BASE_URL],
      useFactory: (http: HttpClient, base: string) => () =>
        firstValueFrom(
          http
            .get(`${base}/sanctum/csrf-cookie`, { withCredentials: true })
            .pipe(catchError(() => of(null))),
        ),
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [BootstrapService],
      useFactory: (bootstrap: BootstrapService) => () =>
        firstValueFrom(bootstrap.getBootstrap$().pipe(take(1))),
    },
    { provide: API_BASE_URL, useValue: 'http://localhost:8000' },
    { provide: LOCALE_ID, useValue: 'hu-HU' },
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
  ],
};
