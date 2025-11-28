import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  throwError,
  shareReplay,
  Subject,
  tap,
  switchMap,
  startWith,
  merge,
  map,
  distinctUntilChanged,
} from 'rxjs';
import { AuthService } from './auth.service';
import {
  GalleryItem,
  GalleryCreateRequest,
  GalleryUpdateRequest,
  DashboardStats,
  GalleryFilterParams,
} from '../models/admin.models';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../app.tokens';
import { GalleryConfig } from '../models/gallery.model';
import { ApiResponse, PaginatedApiResponse } from '../models/api.model';
import { Category, Subcategory } from '../models/category.model';
import { BootstrapService } from './bootstrap.service';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly bootstrap = inject(BootstrapService);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly adminApiUrl = inject(ADMIN_API_BASE_URL);

  private readonly categoriesAdminUrl = `${this.baseUrl}/api/v1/admin/categories`;
  private readonly subcategoriesAdminUrl = `${this.baseUrl}/api/v1/admin/subcategories`;
  
  private refresh$ = new Subject<void>();

  /** Emits true while gallery operations are in-flight, else false. */
  readonly loading$: Observable<boolean> = merge(
    this.refresh$.pipe(map(() => true)),
  ).pipe(startWith(false), distinctUntilChanged(), shareReplay(1));

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.adminApiUrl}/dashboard/stats`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Gallery with filters (optimized backend endpoint)
  getGalleryItemsFiltered(
    filters: GalleryFilterParams,
  ): Observable<PaginatedApiResponse<GalleryItem>> {
    let params: any = {};
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.category_id) {
      params.category_id = filters.category_id;
    }
    if (filters.subcategory_id) {
      params.subcategory_id = filters.subcategory_id;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.page) {
      params.page = filters.page;
    }
    return this.http
      .get<PaginatedApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery`, {
        params,
      })
      .pipe(catchError(this.handleError));
  }

  getGalleryItem(id: number): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .get<ApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery/${id}`)
      .pipe(catchError(this.handleError));
  }

  getGalleryConfig(): Observable<ApiResponse<GalleryConfig>> {
    return this.http
      .get<ApiResponse<GalleryConfig>>(`${this.adminApiUrl}/gallery/config`)
      .pipe(catchError(this.handleError));
  }

  createGalleryItem(
    item: GalleryCreateRequest,
  ): Observable<ApiResponse<GalleryItem>> {
    const formData = this.buildCreateFormData(item);
    return this.http
      .post<ApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery`, formData)
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError),
      );
  }

  updateGalleryItem(
    id: number,
    item: GalleryUpdateRequest,
  ): Observable<ApiResponse<GalleryItem>> {
    const formData = this.buildUpdateFormData(item);
    return this.http
      .post<
        ApiResponse<GalleryItem>
      >(`${this.adminApiUrl}/gallery/${id}`, formData)
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError),
      );
  }

  updateGalleryItemStatus(
    id: number,
    isActive: boolean,
  ): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .put<
        ApiResponse<GalleryItem>
      >(`${this.adminApiUrl}/gallery/${id}/status`, { is_active: isActive ? '1' : '0' })
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError),
      );
  }

  updateFeaturedStatus(
    id: number,
    isFeatured: boolean,
  ): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .put<
        ApiResponse<GalleryItem>
      >(`${this.adminApiUrl}/gallery/${id}/featured`, { is_featured: isFeatured ? '1' : '0' })
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError),
      );
  }

  deleteGalleryItem(id: number): Observable<ApiResponse<{ message?: string }>> {
    return this.http
      .delete<
        ApiResponse<{ message?: string }>
      >(`${this.adminApiUrl}/gallery/${id}`)
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError),
      );
  }

  // Utility method to get full image URL
  getImageUrl(imagePath: string): string {
    return `${this.baseUrl}/storage/${imagePath}`;
  }

  private handleError = (error: any) => {
    console.error('API Error:', error);

    // If unauthorized, logout user
    if (error.status === 401) {
      this.authService.logout();
    }

    return throwError(() => error);
  };

  // --- FormData helpers ---
  private buildCreateFormData(item: GalleryCreateRequest): FormData {
    const fd = new FormData();
    fd.append('title', item.title);
    fd.append('category_id', String(item.category_id));
    if (item.subcategory_id !== undefined) {
      fd.append('subcategory_id', String(item.subcategory_id));
    }
    fd.append('is_active', item.is_active ? '1' : '0');
    fd.append('is_featured', item.is_featured ? '1' : '0');
    if (item.description) fd.append('description', item.description);
    if (item.image) fd.append('image', item.image);
    return fd;
  }

  private buildUpdateFormData(item: GalleryUpdateRequest): FormData {
    const fd = new FormData();
    if (item.title !== undefined) fd.append('title', item.title);
    if (item.category_id !== undefined)
      fd.append('category_id', String(item.category_id));
    if (item.subcategory_id !== undefined)
      fd.append('subcategory_id', String(item.subcategory_id));
    if (item.description !== undefined)
      fd.append('description', item.description || '');
    if (item.is_active !== undefined)
      fd.append('is_active', item.is_active ? '1' : '0');
    if (item.is_featured !== undefined)
      fd.append('is_featured', item.is_featured ? '1' : '0');
    if (item.image) fd.append('image', item.image);
    fd.append('_method', 'PUT');
    return fd;
  }

  // ========== CATEGORY & SUBCATEGORY ADMIN OPERATIONS ==========

  // Get categories (optionally fresh from server)
  getCategories(fresh: boolean = false): Observable<Category[]> {
    if (fresh) {
      return this.getCategoriesFresh();
    }
    return this.bootstrap.getCategories$();
  }

  // Get all categories (admin with nav_order)
  getCategoriesFresh(): Observable<Category[]> {
    return this.http
      .get<{
        data?: { categories?: Category[] };
        categories?: Category[];
      }>(`${this.baseUrl}/api/v1/admin/bootstrap?fresh=1`)
      .pipe(
        map((res) => res.data?.categories ?? res.categories ?? []),
        catchError(() => this.bootstrap.getCategories$()),
      );
  }

  getAdminCategories(): Observable<Category[]> {
    return this.http
      .get<Category[] | { data: Category[] }>(this.categoriesAdminUrl)
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res?.data ?? []))),
        catchError(() => this.bootstrap.getCategories$()),
      );
  }

  // Category CRUD
  saveCategory(category: Category): Observable<Category> {
    if (category._id) {
      return this.http
        .put<Category>(`${this.categoriesAdminUrl}/${category._id}`, category)
        .pipe(tap(() => this.bootstrap.refresh()));
    } else {
      return this.http.post<Category>(this.categoriesAdminUrl, category).pipe(
        tap(() => this.bootstrap.refresh()),
      );
    }
  }

  patchCategory(
    id: number | string,
    payload: Partial<Category>,
  ): Observable<Category> {
    return this.http
      .patch<Category>(`${this.categoriesAdminUrl}/${id}`, payload)
      .pipe(tap(() => this.bootstrap.refresh()));
  }

  deleteCategory(id: string | number): Observable<any> {
    return this.http
      .delete(`${this.categoriesAdminUrl}/${id}`)
      .pipe(tap(() => this.bootstrap.refresh()));
  }

  reorderCategories(categories: Category[]): Observable<Category[]> {
    const orders = categories
      .filter((c) => (c.id ?? c._id) != null)
      .map((c, idx) => ({ id: c.id ?? c._id, nav_order: idx + 1 }));
    return this.http
      .post<any>(`${this.categoriesAdminUrl}/reorder`, { orders })
      .pipe(
        map((res) => {
          const data = Array.isArray(res?.data)
            ? res.data
            : (res?.data ?? res);
          return (Array.isArray(data) ? data : []) as Category[];
        }),
        tap(() => this.bootstrap.refresh()),
      );
  }

  // Subcategory CRUD
  getSubcategories(): Observable<Subcategory[]> {
    return this.http
      .get<Subcategory[] | { data: Subcategory[] }>(
        this.subcategoriesAdminUrl,
      )
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getSubcategoriesByCategory(
    categoryId: number | string,
  ): Observable<Subcategory[]> {
    return this.http
      .get<Subcategory[] | { data: Subcategory[] }>(
        `${this.baseUrl}/api/v1/categories/${categoryId}/subcategories`,
      )
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getSubcategory(id: number | string): Observable<Subcategory> {
    return this.http.get<Subcategory>(`${this.subcategoriesAdminUrl}/${id}`);
  }

  createSubcategory(payload: {
    category_id: number | string;
    name: string;
    slug?: string;
    nav_order?: number;
  }): Observable<Subcategory> {
    return this.http
      .post<Subcategory>(this.subcategoriesAdminUrl, payload)
      .pipe(tap(() => this.bootstrap.refresh()));
  }

  updateSubcategory(
    id: number | string,
    payload: { name?: string; slug?: string; nav_order?: number },
  ): Observable<Subcategory> {
    return this.http
      .put<Subcategory>(`${this.subcategoriesAdminUrl}/${id}`, payload)
      .pipe(tap(() => this.bootstrap.refresh()));
  }

  deleteSubcategory(id: number | string): Observable<{ message?: string }> {
    return this.http
      .delete<{ message?: string }>(`${this.subcategoriesAdminUrl}/${id}`)
      .pipe(tap(() => this.bootstrap.refresh()));
  }
}
