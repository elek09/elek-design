import { Component, Input } from '@angular/core';
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
  @Input() label: string | null = null;
  // Optional logo above the spinner
  @Input() logoUrl: string | null | undefined = null;
  @Input() logoAlt: string = 'Elek Design';
}
