import { InjectionToken } from '@angular/core';

// Base URL for backend API endpoints
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const ADMIN_API_BASE_URL = new InjectionToken<string>(
  'ADMIN_API_BASE_URL',
);
export const GALLERY_API_BASE_URL = new InjectionToken<string>(
  'GALLERY_API_BASE_URL',
);
