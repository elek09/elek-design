import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApiService } from '../../../services/admin-api.service';
import { AuthService } from '../../../services/auth.service';
import {
  GalleryItem,
  GalleryConfig,
  GallerySubCategory,
  GalleryCreateRequest,
} from '../../../models/admin.models';
import { ADMIN_API_BASE_URL, GALLERY_API_BASE_URL } from '../../../app.tokens';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    AdminHeaderComponent,
  ],
  templateUrl: './admin-gallery.component.html',
  styleUrls: ['./admin-gallery.component.scss'],
})
export class AdminGalleryComponent implements OnInit, OnDestroy {
  galleryConfig: GalleryConfig | null = null;
  showUploadForm = false;
  uploadForm = {
    title: '',
    mainCategory: '',
    subCategory: '',
    description: '',
    image: null as File | null,
    is_active: true,
    is_featured: false,
  };
  isUploading = false;
  uploadError: string | null = null;

  galleryItems: GalleryItem[] = [];
  filteredItems: GalleryItem[] = [];
  isLoading = true;
  error: string | null = null;

  // Filtering and sorting
  selectedCategory: string | 'all' = 'all';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private adminApiService: AdminApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    @Inject(ADMIN_API_BASE_URL) private adminApiBaseUrl: string,
    @Inject(GALLERY_API_BASE_URL) private galleryApiBaseUrl: string
  ) {}

  ngOnInit(): void {
    this.loadConfigAndItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfigAndItems(): void {
    this.isLoading = true;
    // Build gallery config dynamically from CategoryService to reflect latest admin-managed categories
    this.categoryService
      .getCategories()
      .pipe(
        map((categories: Category[]) => this.buildGalleryConfig(categories)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (config) => {
          this.galleryConfig = config;
          // Initialize from query params if provided
          const qp = this.route.snapshot.queryParamMap;
          const main = qp.get('mainCategory') || qp.get('main') || '';
          const sub = qp.get('subCategory') || qp.get('sub') || '';

          // Set main category
          const mainExists = !!this.galleryConfig.categories.find(
            (c) => c.value === main
          );
          this.uploadForm.mainCategory = mainExists
            ? main!
            : this.galleryConfig.categories[0]?.value || '';

          // Initialize subcategory default first
          this.onMainCategoryChange();

          // If subcategory in params and exists under selected main, set it
          const subExists = !!this.availableSubcategories.find(
            (s) => s.value === sub
          );
          if (sub && subExists) {
            this.uploadForm.subCategory = sub;
          }

          // If any param provided, open the upload form automatically
          if (mainExists || subExists) {
            this.showUploadForm = true;
          }

          this.loadGalleryItems();
        },
        error: (error) => {
          console.error('Error loading categories for config:', error);
          this.error = 'Failed to load gallery configuration.';
          this.isLoading = false;
        },
      });
  }

  private buildGalleryConfig(categories: Category[]): GalleryConfig {
    const mapped = (categories || []).map((c) => ({
      label: c.name,
      value: String(c.type),
      subcategories: this.normalizeSubcategories(c.subcategories).map((s) => ({
        label: s.name,
        value: s.id,
      })),
    }));
    return { categories: mapped };
  }

  private normalizeSubcategories(
    subs: Category['subcategories']
  ): Array<{ id: string; name: string }> {
    if (!Array.isArray(subs)) return [];
    const arr = (subs as any[])
      .map((s: any) => {
        if (typeof s === 'string') return { id: s, name: s, nav_order: 0 };
        const name = s?.name ?? String(s?.id ?? '');
        const id = String(s?.id ?? '').trim();
        const nav_order = typeof s?.nav_order === 'number' ? s.nav_order : 0;
        return { id, name, nav_order } as {
          id: string;
          name: string;
          nav_order?: number;
        };
      })
      .sort(
        (a, b) =>
          (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
          (b.nav_order ?? Number.MAX_SAFE_INTEGER)
      );
    return arr.map(({ id, name }) => ({ id, name }));
  }

  objectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  get availableSubcategories(): GallerySubCategory[] {
    if (!this.galleryConfig) return [];

    const selectedMain = this.galleryConfig.categories.find(
      (c) => c.value === this.uploadForm.mainCategory
    );

    return selectedMain?.subcategories || [];
  }

  onMainCategoryChange(): void {
    const subcategories = this.availableSubcategories;
    this.uploadForm.subCategory =
      subcategories.length > 0 ? subcategories[0].value : '';
  }

  getCategoryLabel(categoryValue: string): string {
    if (!this.galleryConfig) return categoryValue;

    for (const category of this.galleryConfig.categories) {
      if (category.value === categoryValue) {
        return category.label;
      }
      if (category.subcategories) {
        for (const sub of category.subcategories) {
          if (sub.value === categoryValue) {
            return sub.label;
          }
        }
      }
    }
    return categoryValue;
  }

  loadGalleryItems(): void {
    this.isLoading = true;
    this.adminApiService.getGalleryItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.galleryItems = response.data;
          this.onFilterChange(); // Use onFilterChange to apply filters
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

  onFilterChange(): void {
    let items = [...this.galleryItems];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      const isActive = this.selectedStatus === 'active';
      items = items.filter((item) => item.is_active === isActive);
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      const selectedCatValue = this.selectedCategory;
      const mainCategory = this.galleryConfig?.categories.find(
        (c) => c.value === selectedCatValue
      );

      items = items.filter((item) => {
        // Direct match
        if (item.category === selectedCatValue) return true;

        // Check if item's category is a subcategory of the selected main category
        if (mainCategory && mainCategory.subcategories) {
          return mainCategory.subcategories.some(
            (sub) => sub.value === item.category
          );
        }

        return false;
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTermLower) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTermLower))
      );
    }

    this.filteredItems = items;
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.resetUploadForm();
    }
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.uploadForm.image = fileList[0];
    }
  }

  onUpload(): void {
    // Basic client-side validation aligned with common backend rules
    if (!this.uploadForm.title.trim()) {
      this.uploadError = 'Please enter a title.';
      return;
    }
    // Require a subcategory when available for the selected main category
    const subs = this.availableSubcategories;
    if (!this.uploadForm.mainCategory) {
      this.uploadError = 'Please select a main category.';
      return;
    }
    if (subs.length > 0 && !this.uploadForm.subCategory) {
      this.uploadError =
        'Please select a subcategory under the chosen main category.';
      return;
    }
    // Validate the chosen subcategory actually belongs to the selected main category
    if (
      this.uploadForm.subCategory &&
      subs.length > 0 &&
      !subs.some((s) => s.value === this.uploadForm.subCategory)
    ) {
      this.uploadError =
        'The selected subcategory is not valid for the chosen main category.';
      return;
    }
    if (!this.uploadForm.image) {
      this.uploadError = 'Please select an image to upload.';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    const formValue = this.uploadForm;
    const categoryValue = formValue.subCategory || formValue.mainCategory;
    const normalizedCategory = categoryValue; // already canonical from backend config
    const request: GalleryCreateRequest = {
      title: formValue.title.trim(),
      category: normalizedCategory,
      description: formValue.description.trim(),
      image: formValue.image!,
      is_active: formValue.is_active,
      is_featured: formValue.is_featured,
    };

    this.adminApiService.createGalleryItem(request).subscribe({
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
        if (error?.error) {
          console.error('Upload error details:', error.error);
        }
        // Prefer detailed backend validation errors when present
        const backendErrors = error?.error?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          const messages = Object.entries(backendErrors)
            .flatMap(([field, errs]) =>
              Array.isArray(errs)
                ? errs.map((e) => `${field}: ${e}`)
                : [`${field}: ${String(errs)}`]
            )
            .join('\n');
          this.uploadError =
            messages ||
            error.error?.message ||
            'Failed to upload image. Please try again.';
        } else {
          this.uploadError =
            error.error?.message || 'Failed to upload image. Please try again.';
        }
        this.isUploading = false;
      },
    });
  }

  resetUploadForm(): void {
    this.uploadForm = {
      title: '',
      mainCategory: this.galleryConfig?.categories[0]?.value || '',
      subCategory: '',
      description: '',
      image: null,
      is_active: true,
      is_featured: false,
    };
    this.uploadError = null;
    this.onMainCategoryChange(); // To populate subcategories
  }

  updateItemStatus(item: GalleryItem): void {
    const newStatus = !item.is_active;
    this.adminApiService.updateGalleryItemStatus(item.id, newStatus).subscribe({
      next: (response) => {
        const updatedItem = response.data;

        if (updatedItem) {
          this.updateLocalItem(item.id, updatedItem);
          console.log(
            `Item ${item.id} status updated to ${updatedItem.is_active}`
          );
        } else {
          this.handleUpdateError(
            item,
            'Status update response did not contain gallery item data.'
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `Failed to update status for item "${item.title}". Please try again.`
        );
        console.error('Failed to update item status', err);
      },
    });
  }

  updateFeaturedStatus(item: GalleryItem): void {
    const newStatus = !item.is_featured;
    this.adminApiService.updateFeaturedStatus(item.id, newStatus).subscribe({
      next: (response) => {
        const updatedItem = response.data;
        if (updatedItem) {
          this.updateLocalItem(item.id, updatedItem);
          console.log(
            `Item ${item.id} featured status updated to ${updatedItem.is_featured}`
          );
        } else {
          this.handleUpdateError(
            item,
            'Featured status update response did not contain gallery item data.'
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `Failed to update featured status for item "${item.title}". Please try again.`
        );
        console.error('Failed to update featured status', err);
      },
    });
  }

  private updateLocalItem(id: number, updatedItem: GalleryItem): void {
    const index = this.galleryItems.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.galleryItems[index] = updatedItem;
    }

    const filteredIndex = this.filteredItems.findIndex((i) => i.id === id);
    if (filteredIndex !== -1) {
      this.filteredItems[filteredIndex] = updatedItem;
    }
  }

  private handleUpdateError(item: GalleryItem, message: string): void {
    console.error(message);
    this.error = message;
    // Optional: Revert UI changes if needed, though it's better to rely on the updated data from server
  }

  deleteItem(id: number): void {
    if (
      confirm(
        'Are you sure you want to delete this item? This action cannot be undone.'
      )
    ) {
      this.adminApiService.deleteGalleryItem(id).subscribe({
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
