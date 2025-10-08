import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  API_BASE_URL,
  ADMIN_API_BASE_URL,
  GALLERY_API_BASE_URL,
} from './app.tokens';

import { routes } from './app.routes';

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
    provideHttpClient(withFetch()),
    { provide: API_BASE_URL, useValue: 'http://127.0.0.1:8000' },
    {
      provide: ADMIN_API_BASE_URL,
      useValue: 'http://127.0.0.1:8000/api/v1/admin',
    },
    {
      provide: GALLERY_API_BASE_URL,
      useValue: 'http://127.0.0.1:8000/api/v1/gallery',
    },
  ],
};
