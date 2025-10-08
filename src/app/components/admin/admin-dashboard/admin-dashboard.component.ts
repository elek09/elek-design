import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { GalleryItem, User } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminApiService = inject(AdminApiService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  galleryItems: GalleryItem[] = [];
  stats = {
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    byCategory: {
      featured: 0,
      work: 0,
      ui: 0,
      misc: 0,
    },
  };
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.adminApiService.getGalleryItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.galleryItems = response.data;
          this.calculateStats();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data';
        this.isLoading = false;
      },
    });
  }

  private calculateStats(): void {
    this.stats.totalItems = this.galleryItems.length;
    this.stats.activeItems = this.galleryItems.filter(
      (item) => item.active
    ).length;
    this.stats.inactiveItems = this.stats.totalItems - this.stats.activeItems;

    // Reset category counts
    this.stats.byCategory = { featured: 0, work: 0, ui: 0, misc: 0 };

    // Count by category
    this.galleryItems.forEach((item) => {
      this.stats.byCategory[item.category]++;
    });
  }

  logout(): void {
    this.authService.logout();
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
