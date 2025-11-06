import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { GalleryItem, User } from '../../../models/admin.models';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { LoadingOverlayComponent } from '../../shared/loading-overlay/loading-overlay.component';
import { formatDateTime } from '../../../utils/date.utils';
import { normalizeSubcategories } from '../../../utils/category.utils';

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
  private readonly categoryService = inject(CategoryService);

  currentUser: User | null = null;
  galleryItems: GalleryItem[] = [];
  categories: Category[] = [];
  stats = {
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    featuredItems: 0,
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
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats || [];
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
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories.';
        this.isLoading = false;
      },
    });
  }

  private calculateStats(): void {
    if (!this.categories) return;

    this.stats.totalItems = this.galleryItems.length;
    this.stats.activeItems = this.galleryItems.filter(
      (item) => item.is_active
    ).length;
    this.stats.inactiveItems = this.stats.totalItems - this.stats.activeItems;
    this.stats.featuredItems = this.galleryItems.filter(
      (item) => !!item.is_featured
    ).length;

    // Reset and initialize category counts from the config
    this.stats.byCategory = {};
    this.categories.forEach((cat) => {
      this.stats.byCategory[cat.type] = 0;
      normalizeSubcategories(cat.subcategories).forEach((sub) => {
        this.stats.byCategory[sub.id] = 0;
      });
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
    if (!this.categories) return key;

    for (const cat of this.categories) {
      if (cat.type === key) return cat.name;
      const sub = normalizeSubcategories(cat.subcategories).find(
        (s: { id: string; name: string }) => s.id === key
      );
      if (sub) return sub.name;
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

  readonly formatDateTime = formatDateTime;

  // normalization moved to utils/category.utils
}
