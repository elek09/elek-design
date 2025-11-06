import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BootstrapService } from '../../../services/bootstrap.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { Observable, combineLatest, map, startWith } from 'rxjs';

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
  @Input() backLink?: string | any[];

  private readonly bootstrap = inject(BootstrapService);
  private readonly adminApi = inject(AdminApiService);

  // Show spinner when either bootstrap or gallery list is refreshing
  readonly isRefreshing$: Observable<boolean> = combineLatest([
    this.bootstrap.loading$,
    this.adminApi.loading$,
  ]).pipe(map(([a, b]) => !!a || !!b));
}
