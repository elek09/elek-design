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
} from 'rxjs';
import { AuthService } from './auth.service';
import {
  GalleryItem,
  ApiResponse,
  GalleryCreateRequest,
  GalleryUpdateRequest,
  GalleryConfig,
} from '../models/admin.models';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../app.tokens';

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

  constructor() {
    this.galleryItems$ = this.refresh$.pipe(
      startWith(null), // Trigger initial fetch
      switchMap(() =>
        this.http.get<ApiResponse<GalleryItem[]>>(
          `${this.adminApiUrl}/gallery`,
          {
            headers: this.authService.getAuthHeaders(),
          }
        )
      ),
      shareReplay(1) // Cache the result
    );
  }

  // Gallery Management
  getGalleryItems(): Observable<ApiResponse<GalleryItem[]>> {
    return this.galleryItems$;
  }

  getGalleryItem(id: number): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .get<ApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery/${id}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getGalleryConfig(): Observable<ApiResponse<GalleryConfig>> {
    return this.http
      .get<ApiResponse<GalleryConfig>>(`${this.adminApiUrl}/gallery/config`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  createGalleryItem(
    item: GalleryCreateRequest
  ): Observable<ApiResponse<GalleryItem>> {
    const formData = new FormData();
    formData.append('title', item.title);
    formData.append('category', item.category);
    formData.append('is_active', item.is_active ? '1' : '0');
    formData.append('is_featured', item.is_featured ? '1' : '0');

    if (item.description) {
      formData.append('description', item.description);
    }

    if (item.image) {
      formData.append('image', item.image);
    }

    return this.http
      .post<ApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery`, formData, {
        headers: this.authService.getAuthHeadersForFormData(),
      })
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError)
      );
  }

  updateGalleryItem(
    id: number,
    item: GalleryUpdateRequest
  ): Observable<ApiResponse<GalleryItem>> {
    const formData = new FormData();

    if (item.title !== undefined) {
      formData.append('title', item.title);
    }
    if (item.category !== undefined) {
      formData.append('category', item.category);
    }
    if (item.description !== undefined) {
      formData.append('description', item.description || '');
    }
    if (item.is_active !== undefined) {
      formData.append('is_active', item.is_active ? '1' : '0');
    }
    if (item.is_featured !== undefined) {
      formData.append('is_featured', item.is_featured ? '1' : '0');
    }
    if (item.image) {
      formData.append('image', item.image);
    }

    // Note: PUT doesn't work with FormData for updates in Laravel without special handling.
    // Using POST with a _method field is a common workaround.
    formData.append('_method', 'PUT');

    return this.http
      .post<ApiResponse<GalleryItem>>(
        `${this.adminApiUrl}/gallery/${id}`,
        formData,
        { headers: this.authService.getAuthHeadersForFormData() }
      )
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError)
      );
  }

  updateGalleryItemStatus(
    id: number,
    isActive: boolean
  ): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .put<ApiResponse<GalleryItem>>(
        `${this.adminApiUrl}/gallery/${id}/status`,
        { is_active: isActive ? '1' : '0' },
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError)
      );
  }

  updateFeaturedStatus(
    id: number,
    isFeatured: boolean
  ): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .put<ApiResponse<GalleryItem>>(
        `${this.adminApiUrl}/gallery/${id}/featured`,
        { is_featured: isFeatured ? '1' : '0' },
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError)
      );
  }

  deleteGalleryItem(id: number): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(`${this.adminApiUrl}/gallery/${id}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(() => this.refresh$.next()), // Refresh the cache
        catchError(this.handleError)
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
}
