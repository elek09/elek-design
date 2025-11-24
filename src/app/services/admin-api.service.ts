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
  of,
  forkJoin,
} from 'rxjs';
import { AuthService } from './auth.service';
import {
  GalleryItem,
  GalleryCreateRequest,
  GalleryUpdateRequest,
} from '../models/admin.models';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../app.tokens';
import { GalleryConfig } from '../models/gallery.model';
import { ApiResponse, PaginatedApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly adminApiUrl = inject(ADMIN_API_BASE_URL);

  private refresh$ = new Subject<void>();

  private galleryItems$: Observable<ApiResponse<GalleryItem[]>>;
  /** Emits true while gallery list refresh request is in-flight, else false. */
  readonly loading$: Observable<boolean>;

  constructor() {
    this.galleryItems$ = this.refresh$.pipe(
      startWith(null), // Trigger initial fetch
      switchMap(() =>
        this.http.get<ApiResponse<GalleryItem[]>>(
          `${this.adminApiUrl}/gallery`,
        ),
      ),
      shareReplay(1), // Cache the result
    );

    // loading$ toggles true on refresh trigger and false when galleryItems$ emits
    this.loading$ = merge(
      this.refresh$.pipe(map(() => true)),
      this.galleryItems$.pipe(map(() => false)),
    ).pipe(startWith(false), distinctUntilChanged(), shareReplay(1));
  }

  // Gallery Management
  getGalleryItems(): Observable<ApiResponse<GalleryItem[]>> {
    return this.galleryItems$;
  }

  /** Fetch a specific page of gallery items (1-based page index). */
  getGalleryItemsPage(
    page: number,
  ): Observable<PaginatedApiResponse<GalleryItem>> {
    const url = `${this.adminApiUrl}/gallery?page=${page}`;
    return this.http
      .get<PaginatedApiResponse<GalleryItem>>(url)
      .pipe(catchError(this.handleError));
  }

  /** Load all pages and merge items (for small total counts). */
  getAllGalleryItems(): Observable<GalleryItem[]> {
    return this.getGalleryItemsPage(1).pipe(
      switchMap((first) => {
        const meta = first.meta || first.pagination;
        const initial = first.data || [];
        if (!meta || meta.last_page <= 1) {
          return of(initial);
        }
        const requests: Observable<PaginatedApiResponse<GalleryItem>>[] = [];
        for (let p = 2; p <= meta.last_page; p++) {
          requests.push(this.getGalleryItemsPage(p));
        }
        return forkJoin(requests).pipe(
          map((responses) => {
            const merged = [...initial];
            for (const resp of responses) {
              for (const it of resp.data || []) {
                if (!merged.some((m) => m.id === it.id)) merged.push(it);
              }
            }
            return merged;
          }),
          catchError(() => of(initial)),
        );
      }),
      catchError(() => of([])),
    );
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
}
