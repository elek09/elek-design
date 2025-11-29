import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { BootstrapService } from '../../../services/bootstrap.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, AdminNavComponent],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
})
export class AdminHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;

  private readonly bootstrap = inject(BootstrapService);

  readonly isRefreshing$: Observable<boolean> = this.bootstrap.loading$;
}
