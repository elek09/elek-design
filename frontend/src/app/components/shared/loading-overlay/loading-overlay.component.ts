import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent {
  // Optional label under the spinner
  readonly label = input<string | null>(null);
  // Optional logo above the spinner
  readonly logoUrl = input<string | null | undefined>(null);
  readonly logoAlt = input('Elek Design');
}
