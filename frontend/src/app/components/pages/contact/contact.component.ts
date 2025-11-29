import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ContactService } from '../../../services/contact.service';
import { ToastrService } from 'ngx-toastr';
import { parseBackendErrors } from '../../../utils/api.utils';
import {
  NoSubmitErrorStateMatcher,
  getCheckoutErrorMessage,
} from '../../../utils/form.utils';

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
export class ContactComponent {
  private readonly galleryDataService = inject(GalleryDataService);
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly toastr = inject(ToastrService);

  protected readonly topCarouselSlides$ =
    this.galleryDataService.getFeaturedSlides$();
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });
  protected sending = false;
  protected sent = false;
  protected readonly errorMatcher = new NoSubmitErrorStateMatcher();

  protected submit(): void {
    if (this.form.invalid || this.sending) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending = true;
    this.sent = false;
    this.contactService.sendMessage(this.form.getRawValue()).subscribe({
      next: (resp) => {
        this.sending = false;
        if (resp?.success) {
          this.sent = true;
          this.toastr.success('Üzenet sikeresen elküldve');
          this.form.reset();
          this.form.markAsPristine();
          this.form.markAsUntouched();
        } else {
          this.toastr.error('Nem sikerült elküldeni az üzenetet');
        }
      },
      error: (err) => {
        this.sending = false;
        const errorMsg = parseBackendErrors(err);
        this.toastr.error(errorMsg || 'Hiba az üzenet küldésekor');
      },
    });
  }

  protected onFieldBlur(field: keyof typeof this.form.controls): void {
    const control = this.form.get(field);
    if (!control) return;

    control.markAsTouched();
    if (control.invalid) {
      const message = getCheckoutErrorMessage(field, control.errors || {});
      this.toastr.warning(message, 'Hibás mező');
    }
  }
}
