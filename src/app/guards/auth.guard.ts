import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Auth guard checking authentication...');
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('Current user:', authService.getUser());

  if (authService.isAuthenticated()) {
    console.log('Auth guard allowing access to:', state.url);
    return true;
  } else {
    console.log('Auth guard denying access, redirecting to login');
    router.navigate(['/admin/login']);
    return false;
  }
};
