import { FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Material ErrorStateMatcher ami csak akkor mutat hibát, ha a mező dirty vagy touched
 */
export class NoSubmitErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

/**
 * Checkout form hiba üzenetek generálása
 */
export function getCheckoutErrorMessage(
  field: string,
  errors: Record<string, any>,
): string {
  if (errors['required']) {
    switch (field) {
      case 'customer_name':
        return 'A név mező kötelező';
      case 'customer_email':
        return 'Az email mező kötelező';
      case 'customer_phone':
        return 'A telefonszám mező kötelező';
      default:
        return 'Ez a mező kötelező';
    }
  }
  if (errors['email']) return 'Érvényes email címet adjon meg';
  if (errors['minlength']) {
    const required = errors['minlength'].requiredLength;
    return `Minimum ${required} karakter szükséges`;
  }
  if (errors['maxlength']) {
    const required = errors['maxlength'].requiredLength;
    return `Maximum ${required} karakter engedélyezett`;
  }
  return 'Érvénytelen mező';
}
