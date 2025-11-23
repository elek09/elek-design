import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
import { formatDateTime } from '../../../utils/date.utils';
import { normalizeSubcategories } from '../../../utils/category.utils';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [
    CommonModule,
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
  private adminApiService = inject(AdminApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);

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
  error: string | null = null;
  isLoading = true;

  galleryItems: GalleryItem[] = [];
  filteredItems: GalleryItem[] = [];

  selectedCategory: string | 'all' = 'all';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadConfigAndItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfigAndItems(): void {
    this.isLoading = true;
    this.categoryService
      .getCategories()
      .pipe(
        map((categories: Category[]) => this.buildGalleryConfig(categories)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (config) => {
          this.galleryConfig = config;
          const qp = this.route.snapshot.queryParamMap;
          const main = qp.get('mainCategory') || qp.get('main') || '';
          const sub = qp.get('subCategory') || qp.get('sub') || '';

          const mainExists = !!this.galleryConfig.categories.find(
            (c) => c.value === main,
          );
          this.uploadForm.mainCategory = mainExists
            ? main!
            : this.galleryConfig.categories[0]?.value || '';

          this.onMainCategoryChange();

          const subExists = !!this.availableSubcategories.find(
            (s) => s.value === sub,
          );
          if (sub && subExists) {
            this.uploadForm.subCategory = sub;
          }

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
      subcategories: normalizeSubcategories(c.subcategories).map((s) => ({
        label: s.name,
        value: s.id,
      })),
    }));
    return { categories: mapped };
  }

  objectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  get availableSubcategories(): GallerySubCategory[] {
    if (!this.galleryConfig) return [];
    const selectedMain = this.galleryConfig.categories.find(
      (c) => c.value === this.uploadForm.mainCategory,
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
          this.onFilterChange();
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
    this.filteredItems = filterGalleryItems(
      this.galleryItems,
      this.galleryConfig,
      this.selectedCategory,
      this.selectedStatus,
      this.searchTerm,
    );
  }

  trackById(_index: number, item: GalleryItem): number | undefined {
    return item.id;
  }
  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.resetUploadForm();
    }
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList) {
      this.uploadForm.image = fileList[0];
    }
  }

  onUpload(): void {
    if (!this.uploadForm.title.trim()) {
      this.uploadError = 'Please enter a title.';
      return;
    }
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
    const normalizedCategory = categoryValue;
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
          this.loadGalleryItems();
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
        const backendErrors = error?.error?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          const messages = Object.entries(backendErrors)
            .flatMap(([field, errs]) =>
              Array.isArray(errs)
                ? errs.map((e) => `${field}: ${e}`)
                : [`${field}: ${String(errs)}`],
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
    this.onMainCategoryChange();
  }

  updateItemStatus(item: GalleryItem): void {
    const newStatus = !item.is_active;
    this.adminApiService.updateGalleryItemStatus(item.id, newStatus).subscribe({
      next: (response) => {
        const updatedItem = response.data;
        if (updatedItem) {
          this.updateLocalItem(item.id, updatedItem);
        } else {
          this.handleUpdateError(
            item,
            'Status update response did not contain gallery item data.',
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `Failed to update status for item "${item.title}". Please try again.`,
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
        } else {
          this.handleUpdateError(
            item,
            'Featured status update response did not contain gallery item data.',
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `Failed to update featured status for item "${item.title}". Please try again.`,
        );
        console.error('Failed to update item featured status', err);
      },
    });
  }

  private updateLocalItem(id: number, updatedItem: GalleryItem): void {
    const index = this.galleryItems.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.galleryItems[index] = updatedItem;
    }
  }

  private handleUpdateError(item: GalleryItem, message: string): void {
    console.error(message);
    this.error = message;
  }

  deleteItem(id: number): void {
    if (
      confirm(
        'Are you sure you want to delete this item? This action cannot be undone.',
      )
    ) {
      this.adminApiService.deleteGalleryItem(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadGalleryItems();
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

  readonly formatDateTime = formatDateTime;

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}

// Pure filtering function kept outside the component class for easier unit testing and future migration to signals
function filterGalleryItems(
  items: GalleryItem[],
  cfg: GalleryConfig | null,
  selectedCategory: string | 'all',
  selectedStatus: 'all' | 'active' | 'inactive',
  searchTerm: string,
): GalleryItem[] {
  let out = [...items];

  if (selectedStatus !== 'all') {
    const isActive = selectedStatus === 'active';
    out = out.filter((i) => i.is_active === isActive);
  }

  if (selectedCategory !== 'all' && cfg) {
    const main = cfg.categories.find((c) => c.value === selectedCategory);
    out = out.filter((item) => {
      if (item.category === selectedCategory) return true;
      if (main && main.subcategories) {
        return main.subcategories.some((s) => s.value === item.category);
      }
      return false;
    });
  }

  if (searchTerm.trim()) {
    const lower = searchTerm.toLowerCase();
    out = out.filter(
      (i) =>
        i.title.toLowerCase().includes(lower) ||
        (i.description?.toLowerCase().includes(lower) ?? false),
    );
  }

  return out;
}
