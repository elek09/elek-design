import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BootstrapService } from '../../../services/bootstrap.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AdminNavComponent,
  ],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
})
export class AdminHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() backLink?: string | string[];

  private readonly bootstrap = inject(BootstrapService);

  // Show spinner when bootstrap is refreshing
  readonly isRefreshing$: Observable<boolean> = this.bootstrap.loading$;
}
