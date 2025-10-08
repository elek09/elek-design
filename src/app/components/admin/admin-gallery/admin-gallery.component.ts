import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../../services/admin-api.service';
import { AuthService } from '../../../services/auth.service';
import { GalleryItem, GalleryCategory } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-gallery.component.html',
  styleUrl: './admin-gallery.component.scss',
})
export class AdminGalleryComponent implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  galleryItems: GalleryItem[] = [];
  filteredItems: GalleryItem[] = [];
  availableCategories: GalleryCategory[] = [];

  // Filters
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';
  searchTerm: string = '';

  // States
  isLoading = true;
  error = '';

  // Upload form
  showUploadForm = false;
  uploadForm = {
    title: '',
    category: 'featured' as GalleryCategory,
    description: '',
    active: true,
    image: null as File | null,
  };
  isUploading = false;
  uploadError = '';

  ngOnInit(): void {
    this.loadGalleryItems();
    this.loadCategories();
  }

  loadGalleryItems(): void {
    this.isLoading = true;
    this.adminApiService.getGalleryItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.galleryItems = response.data;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading gallery items:', error);
        this.error = 'Failed to load gallery items';
        this.isLoading = false;
      },
    });
  }

  loadCategories(): void {
    this.adminApiService.getAvailableCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableCategories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  applyFilters(): void {
    this.filteredItems = this.galleryItems.filter((item) => {
      const matchesCategory =
        this.selectedCategory === 'all' ||
        item.category === this.selectedCategory;
      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && item.active) ||
        (this.selectedStatus === 'inactive' && !item.active);
      const matchesSearch =
        !this.searchTerm ||
        item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.description &&
          item.description
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.resetUploadForm();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadForm.image = input.files[0];
    }
  }

  onUpload(): void {
    if (!this.uploadForm.image || !this.uploadForm.title.trim()) {
      this.uploadError =
        'Please fill in all required fields and select an image.';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    const uploadData = {
      title: this.uploadForm.title.trim(),
      category: this.uploadForm.category,
      description: this.uploadForm.description.trim() || undefined,
      active: this.uploadForm.active,
      image: this.uploadForm.image,
    };

    this.adminApiService.createGalleryItem(uploadData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGalleryItems(); // Refresh the list
          this.resetUploadForm();
          this.showUploadForm = false;
        }
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadError =
          error.error?.message || 'Failed to upload image. Please try again.';
        this.isUploading = false;
      },
    });
  }

  resetUploadForm(): void {
    this.uploadForm = {
      title: '',
      category: 'featured',
      description: '',
      active: true,
      image: null,
    };
    this.uploadError = '';
  }

  toggleItemStatus(item: GalleryItem): void {
    const updateData = { active: !item.active };

    this.adminApiService.updateGalleryItem(item.id, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          item.active = !item.active;
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error updating item status:', error);
        alert('Failed to update item status');
      },
    });
  }

  deleteItem(item: GalleryItem): void {
    if (
      confirm(
        `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
      )
    ) {
      this.adminApiService.deleteGalleryItem(item.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadGalleryItems(); // Refresh the list
          }
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          alert('Failed to delete item. Please try again.');
        },
      });
    }
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

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}
