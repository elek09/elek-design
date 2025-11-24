import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { GalleryItem } from '../../../models/admin.models';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
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
  private readonly categoryService = inject(CategoryService);

  currentUser: User | null = null;
  galleryItems: GalleryItem[] = [];
  categories: Category[] = [];
  stats = {
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    featuredItems: 0,
    byCategory: {} as Record<string, number>,
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
    // Load categories first then all pages of gallery items for full stats
    const categories$ = fresh
      ? this.categoryService.getCategoriesFresh()
      : this.categoryService.getCategories();
    categories$.subscribe({
      next: (cats) => {
        this.categories = cats || [];
        this.adminApiService.getAllGalleryItems().subscribe({
          next: (allItems) => {
            this.galleryItems = allItems;
            this.calculateStats();
            this.lastRefreshAt = new Date();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading all gallery items:', err);
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
      (item) => item.is_active,
    ).length;
    this.stats.inactiveItems = this.stats.totalItems - this.stats.activeItems;
    this.stats.featuredItems = this.galleryItems.filter(
      (item) => !!item.is_featured,
    ).length;

    // Initialize counts: main categories + subcategories
    this.stats.byCategory = {};
    this.categories.forEach((cat) => {
      this.stats.byCategory[cat.type] = 0;
      (cat.subcategories || []).forEach((sub) => {
        const subId = String((sub as any).id); // ensure string key
        if (subId) this.stats.byCategory[subId] = 0;
      });
    });

    // Count occurrences for each gallery item
    this.galleryItems.forEach((item) => {
      const catType =
        typeof item.category === 'string' ? item.category : item.category?.type;
      if (catType && this.stats.byCategory[catType] !== undefined) {
        this.stats.byCategory[catType]++;
      }
      const sub = item.subcategory;
      if (sub && this.stats.byCategory[String(sub.id)] !== undefined) {
        this.stats.byCategory[String(sub.id)]++;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getCategoryKeys(): string[] {
    // Return main categories first in original order, then subcategories
    const main = this.categories.map((c) => c.type);
    const subs: string[] = [];
    this.categories.forEach((c) => {
      (c.subcategories || []).forEach((s: any) => subs.push(String(s.id)));
    });
    return [
      ...main,
      ...subs.filter((id) => this.stats.byCategory[id] !== undefined),
    ];
  }

  getCategoryLabel(key: string): string {
    if (!this.categories) return key;
    const cat = this.categories.find((c) => c.type === key);
    if (cat) return cat.name;
    for (const c of this.categories) {
      const sub = (c.subcategories || []).find(
        (s: any) => typeof s === 'object' && String(s.id) === key,
      );
      if (sub) {
        if (typeof sub === 'object' && 'name' in sub) return (sub as any).name;
      }
    }
    return key;
  }

  isSubCategoryKey(key: string): boolean {
    return !this.categories.some((c) => c.type === key);
  }

  navigateToGallery(): void {
    this.router.navigate(['/admin/gallery']);
  }

  getRecentItems(): GalleryItem[] {
    // Backend ordering is trusted; just take first 5
    return this.galleryItems.slice(0, 5);
  }

  getCategoryName(item: GalleryItem): string {
    if (!item.category) return '—';
    if (typeof item.category === 'string') return item.category;
    return item.category.name || item.category.type || '—';
  }

  readonly formatDateTime = formatDateTime;

  // normalization moved to utils/category.utils
}
