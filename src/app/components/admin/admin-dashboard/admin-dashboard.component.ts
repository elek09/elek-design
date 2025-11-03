import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import {
  GalleryItem,
  User,
  GalleryConfig,
  GalleryCategory,
} from '../../../models/admin.models';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminApiService = inject(AdminApiService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  galleryItems: GalleryItem[] = [];
  galleryConfig: GalleryConfig | null = null;
  stats = {
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    byCategory: {} as { [key: string]: number },
  };
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.adminApiService.getGalleryConfig().subscribe({
      next: (configResponse) => {
        if (configResponse.success && configResponse.data) {
          this.galleryConfig = configResponse.data;
          this.adminApiService.getGalleryItems().subscribe({
            next: (itemsResponse) => {
              if (itemsResponse.success && itemsResponse.data) {
                this.galleryItems = itemsResponse.data;
                this.calculateStats();
              }
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error loading gallery items:', err);
              this.error = 'Failed to load gallery items.';
              this.isLoading = false;
            },
          });
        } else {
          this.error = 'Failed to load gallery configuration.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading gallery config:', err);
        this.error = 'Failed to load gallery configuration.';
        this.isLoading = false;
      },
    });
  }

  private calculateStats(): void {
    if (!this.galleryConfig) return;

    this.stats.totalItems = this.galleryItems.length;
    this.stats.activeItems = this.galleryItems.filter(
      (item) => item.is_active
    ).length;
    this.stats.inactiveItems = this.stats.totalItems - this.stats.activeItems;

    // Reset and initialize category counts from the config
    this.stats.byCategory = {};
    this.galleryConfig.categories.forEach((cat) => {
      this.stats.byCategory[cat.value] = 0;
      if (cat.subcategories) {
        cat.subcategories.forEach((sub) => {
          this.stats.byCategory[sub.value] = 0;
        });
      }
    });

    // Count by category
    this.galleryItems.forEach((item) => {
      if (this.stats.byCategory.hasOwnProperty(item.category)) {
        this.stats.byCategory[item.category]++;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getCategoryKeys(): string[] {
    return Object.keys(this.stats.byCategory);
  }

  getCategoryLabel(key: string): string {
    if (!this.galleryConfig) return key;

    for (const cat of this.galleryConfig.categories) {
      if (cat.value === key) return cat.label;
      if (cat.subcategories) {
        const sub = cat.subcategories.find((s) => s.value === key);
        if (sub) return sub.label;
      }
    }
    return key;
  }

  navigateToGallery(): void {
    this.router.navigate(['/admin/gallery']);
  }

  getRecentItems(): GalleryItem[] {
    return this.galleryItems
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }

  getImageUrl(imagePath: string): string {
    return this.adminApiService.getImageUrl(imagePath);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
