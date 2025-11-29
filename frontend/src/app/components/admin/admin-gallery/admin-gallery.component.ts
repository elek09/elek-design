import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApiService } from '../../../services/admin-api.service';
import { AuthService } from '../../../services/auth.service';
import {
  GalleryItem,
  GalleryCreateRequest,
  GalleryFilterParams,
} from '../../../models/admin.models';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Category } from '../../../models/category.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { LoadingOverlayComponent } from '../../shared/loading-overlay/loading-overlay.component';
import { formatDateTime } from '../../../utils/date.utils';
import { parseBackendErrors } from '../../../utils/api.utils';
import {
  buildGalleryConfig,
  getCategoryLabel,
} from '../../../utils/category.utils';
import {
  GalleryConfig,
  GallerySubCategory,
} from '../../../models/gallery.model';

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
    LoadingOverlayComponent,
  ],
  templateUrl: './admin-gallery.component.html',
  styleUrls: ['./admin-gallery.component.scss'],
})
export class AdminGalleryComponent implements OnInit, OnDestroy {
  private adminApiService = inject(AdminApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  galleryConfig: GalleryConfig | null = null;
  showUploadForm = false;
  uploadForm = {
    title: '',
    mainCategoryId: '' as string,
    subCategoryId: '' as string,
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

  currentPage = 1;
  lastPage = 1;
  totalItems = 0;
  perPage = 0;

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
    this.adminApiService
      .getCategories(true)
      .pipe(
        map((categories: Category[]) => buildGalleryConfig(categories)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (config: GalleryConfig) => {
          this.galleryConfig = config;
          this.initializeFormFromQueryParams();
          this.loadGalleryItems();
        },
        error: (error: any) => {
          console.error('Kategóriák betöltési hiba:', error);
          this.error = 'Galéria konfiguráció betöltése sikertelen.';
          this.isLoading = false;
        },
      });
  }

  // Feltöltő form inicializálása: első kategória kiválasztása alapértelmezettként
  private initializeFormFromQueryParams(): void {
    if (!this.galleryConfig?.categories.length) return;

    this.uploadForm.mainCategoryId = this.galleryConfig.categories[0].value;
    this.onMainCategoryChange();
  }

  // Kiválasztott főkategóriához tartozó alkategoriák listája
  get availableSubcategories(): GallerySubCategory[] {
    if (!this.galleryConfig) return [];
    const selectedMain = this.galleryConfig.categories.find(
      (c) => c.value === this.uploadForm.mainCategoryId,
    );
    return selectedMain?.subcategories || [];
  }

  onMainCategoryChange(): void {
    const subcategories = this.availableSubcategories;
    this.uploadForm.subCategoryId =
      subcategories.length > 0 ? subcategories[0].value : '';
  }

  // Galéria elemek betöltése szűrőkkel
  loadGalleryItems(): void {
    this.isLoading = true;
    const filters = this.buildFilters();

    this.adminApiService.getGalleryItemsFiltered(filters).subscribe({
      next: (resp) => {
        const meta = resp.meta || resp.pagination;
        this.galleryItems = resp.data || [];

        if (meta) {
          this.currentPage = meta.current_page;
          this.lastPage = meta.last_page;
          this.totalItems = meta.total;
          this.perPage = meta.per_page;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Galéria elemek betöltési hiba:', err);
        this.error = 'Galéria elemek betöltése sikertelen';
        this.isLoading = false;
      },
    });
  }

  // Szűrő paraméterek összeállítása az aktuális kiválasztások alapján
  private buildFilters(): GalleryFilterParams {
    const filters: GalleryFilterParams = { page: this.currentPage };

    if (this.selectedStatus !== 'all') {
      filters.status = this.selectedStatus;
    }

    if (this.selectedCategory !== 'all') {
      const isMain = this.selectedCategory.startsWith('cat-');
      const isSub = this.selectedCategory.startsWith('sub-');
      const rawId = this.selectedCategory.replace(/^(cat-|sub-)/, '');

      if (isMain) filters.category_id = rawId;
      else if (isSub) filters.subcategory_id = rawId;
    }

    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    return filters;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) return;
    this.currentPage = page;
    this.loadGalleryItems();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadGalleryItems();
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

  // Kép feltöltés validációval és hibakezeléssel
  onUpload(): void {
    const validationError = this.validateUploadForm();
    if (validationError) {
      this.uploadError = validationError;
      return;
    }

    this.isUploading = true;
    this.uploadError = null;
    const wasFormVisible = this.showUploadForm;
    this.showUploadForm = false;

    const formValue = this.uploadForm;
    const categoryId = Number(formValue.mainCategoryId);
    const subId = formValue.subCategoryId
      ? Number(formValue.subCategoryId)
      : undefined;
    const request: GalleryCreateRequest = {
      title: formValue.title.trim(),
      category_id: categoryId,
      subcategory_id: subId,
      description: formValue.description.trim() || undefined,
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
        console.error('Kép feltöltési hiba:', error);
        this.uploadError = parseBackendErrors(error);
        this.isUploading = false;
        if (wasFormVisible) {
          this.showUploadForm = true;
        }
      },
    });
  }

  // Feltöltő form validációja: kötelező mezők és kategória konzisztencia ellenőrzése
  private validateUploadForm(): string | null {
    if (!this.uploadForm.title.trim()) return 'Kérlek adj meg egy címet.';
    if (!this.uploadForm.mainCategoryId)
      return 'Kérlek válassz ki egy főkategóriát.';

    const subs = this.availableSubcategories;
    if (subs.length > 0 && !this.uploadForm.subCategoryId) {
      return 'Kérlek válassz ki egy alkategóriát a kiválasztott főkategóriában.';
    }
    if (
      this.uploadForm.subCategoryId &&
      subs.length > 0 &&
      !subs.some((s) => s.value === this.uploadForm.subCategoryId)
    ) {
      return 'A kiválasztott alkategória nem érvényes a választott főkategóriához.';
    }
    if (!this.uploadForm.image)
      return 'Kérlek válassz ki egy képet a feltöltéshez.';

    return null;
  }

  resetUploadForm(): void {
    this.uploadForm = {
      title: '',
      mainCategoryId: this.galleryConfig?.categories[0]?.value || '',
      subCategoryId: '',
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
            'A státusz frissítési válasz nem tartalmazta a galéria elem adatokat.',
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `A(z) "${item.title}" elem státuszának frissítése sikertelen. Kérlek próbáld újra.`,
        );
        console.error('Elem státusz frissítési hiba:', err);
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
            'A kiemelt státusz frissítési válasz nem tartalmazta a galéria elem adatokat.',
          );
        }
      },
      error: (err) => {
        this.handleUpdateError(
          item,
          `A(z) "${item.title}" elem kiemelt státuszának frissítése sikertelen. Kérlek próbáld újra.`,
        );
        console.error('Elem kiemelt státusz frissítési hiba:', err);
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
        'Biztosan törölni szeretnéd ezt az elemet? Ez a művelet nem vonható vissza.',
      )
    ) {
      this.adminApiService.deleteGalleryItem(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadGalleryItems();
          }
        },
        error: (error) => {
          console.error('Elem törlési hiba:', error);
          alert('Az elem törlése sikertelen. Kérlek próbáld újra.');
        },
      });
    }
  }

  getThumbOrImage(item: GalleryItem): string {
    return item.thumb_url || item.url || '';
  }

  readonly formatDateTime = formatDateTime;
  readonly getCategoryLabel = (value: string) =>
    getCategoryLabel(this.galleryConfig, value);

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}
