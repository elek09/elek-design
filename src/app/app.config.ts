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
} from '@angular/common/http';
import {
  API_BASE_URL,
  ADMIN_API_BASE_URL,
  GALLERY_API_BASE_URL,
} from './app.tokens';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { BootstrapService } from './services/bootstrap.service';
import { firstValueFrom, take } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [BootstrapService],
      useFactory: (bootstrap: BootstrapService) => () =>
        firstValueFrom(bootstrap.getBootstrap$().pipe(take(1))),
    },
    { provide: API_BASE_URL, useValue: 'http://127.0.0.1:8000' },
    {
      provide: ADMIN_API_BASE_URL,
      useValue: 'http://127.0.0.1:8000/api/v1/admin',
    },
    {
      provide: GALLERY_API_BASE_URL,
      useValue: 'http://127.0.0.1:8000/api/v1/gallery',
    },
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
