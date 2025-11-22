import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Observable } from 'rxjs';
import { ContactService } from '../../../services/contact.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    CarouselComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly galleryDataService = inject(GalleryDataService);
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly toastr = inject(ToastrService);

  protected topCarouselSlides$!: Observable<Slide[]>;
  protected form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });
  protected sending = false;
  protected sent = false;
  // Custom matcher: do not show errors just because form was submitted.
  protected errorMatcher = new NoSubmitErrorStateMatcher();

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
  }

  protected submit(): void {
    if (this.form.invalid || this.sending) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending = true;
    this.contactService.sendMessage(this.form.getRawValue()).subscribe({
      next: (resp) => {
        this.sending = false;
        this.sent = !!resp?.success;
        if (this.sent) {
          this.toastr.success('Üzenet elküldve');
          // Reset form and ensure pristine/untouched so fields are not red.
          this.form.reset();
          this.form.markAsPristine();
          this.form.markAsUntouched();
        } else {
          this.toastr.error('Nem sikerült elküldeni az üzenetet.');
        }
      },
      error: () => {
        this.sending = false;
        this.toastr.error('Hiba az üzenet küldésekor');
      },
    });
  }

  protected onFieldBlur(field: keyof typeof this.form.controls): void {
    const control = this.form.get(field);
    if (!control) return;
    // Mark as touched so mat-error still works
    control.markAsTouched();
    if (control.invalid) {
      const msg = this.composeErrorMessage(field, control.errors || {});
      if (msg) this.toastr.warning(msg, 'Hibás mező');
    }
  }

  private composeErrorMessage(
    field: string,
    errors: Record<string, any>
  ): string {
    if (errors['required']) {
      switch (field) {
        case 'name':
          return 'A név mező kötelező.';
        case 'email':
          return 'Az email mező kötelező.';
        case 'subject':
          return 'A tárgy mező kötelező.';
        case 'message':
          return 'Az üzenet mező kötelező.';
      }
    }
    if (errors['email']) return 'Érvényes email címet adjon meg.';
    if (errors['minlength']) {
      const req = errors['minlength'].requiredLength;
      return `Legalább ${req} karakter szükséges.`;
    }
    return 'Érvénytelen mező.';
  }
}

class NoSubmitErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
