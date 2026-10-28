import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { DashboardStats } from '../../../models/admin.models';
import { Category } from '../../../models/category.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { LoadingOverlayComponent } from '../../shared/loading-overlay/loading-overlay.component';
import { formatDateTime } from '../../../utils/date.utils';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AdminHeaderComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminApiService = inject(AdminApiService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  categories: Category[] = [];
  stats: DashboardStats = {
    gallery: {
      total: 0,
      active: 0,
      inactive: 0,
      featured: 0,
      byCategory: {},
      recent: [],
    },
    orders: {
      total: 0,
      byStatus: {},
      recent: [],
    },
  };
  isLoading = true;
  error = '';
  lastRefreshAt: Date | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(fresh: boolean = false): void {
    this.isLoading = true;
    const categories$ = this.adminApiService.getCategories(fresh);

    categories$.subscribe({
      next: (cats: Category[]) => {
        this.categories = cats || [];

        this.adminApiService.getDashboardStats().subscribe({
          next: (stats) => {
            this.stats = stats;
            this.lastRefreshAt = new Date();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading stats:', err);
            this.error = 'Failed to load dashboard stats.';
            this.isLoading = false;
          },
        });
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories.';
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getCategoryKeys(): string[] {
    if (!this.stats?.gallery?.byCategory) return [];
    return Object.keys(this.stats.gallery.byCategory);
  }

  getCategoryLabel(key: string): string {
    return key;
  }

  isSubCategoryKey(key: string): boolean {
    const isMainCategory = this.categories.some((c) => c.name === key);
    return !isMainCategory;
  }

  navigateToGallery(): void {
    this.router.navigate(['/admin/gallery']);
  }

  getRecentItems() {
    return this.stats.gallery.recent || [];
  }

  getCategoryName(item: any): string {
    if (!item.category) return '—';
    if (typeof item.category === 'string') return item.category;
    return item.category.name || item.category.type || '—';
  }

  readonly formatDateTime = formatDateTime;
}
