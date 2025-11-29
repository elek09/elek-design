import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    // Átirányítás ha már be van jelentkezve
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (user) => {
          if (user) {
            this.router.navigate(['/admin/dashboard']).then((success) => {
              if (!success) {
                console.error('Navigáció sikertelen');
                this.errorMessage =
                  'Belépés sikeres, de az átirányítás nem sikerült.';
              }
            });
          } else {
            this.errorMessage = 'Sikertelen belépés. Ellenőrizd az adatokat.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Bejelentkezési hiba:', error);
          this.errorMessage =
            error.error?.message || 'Belépés sikertelen. Próbáld újra.';
          this.isLoading = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldNames: Record<string, string> = {
          email: 'Email',
          password: 'Jelszó',
          remember: 'Emlékezz rám',
        };
        return `${fieldNames[fieldName] || fieldName} kötelező`;
      }
      if (field.errors['email']) {
        return 'Kérlek adj meg egy érvényes email címet';
      }
      if (field.errors['minlength']) {
        return `A jelszónak legalább ${field.errors['minlength'].requiredLength} karakter hosszúnak kell lennie`;
      }
    }
    return '';
  }
}
