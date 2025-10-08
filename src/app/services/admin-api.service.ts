import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import {
  GalleryItem,
  ApiResponse,
  GalleryCreateRequest,
  GalleryUpdateRequest,
  GalleryCategory,
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

  // Gallery Management
  getGalleryItems(): Observable<ApiResponse<GalleryItem[]>> {
    return this.http
      .get<ApiResponse<GalleryItem[]>>(`${this.adminApiUrl}/gallery`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getGalleryItem(id: number): Observable<ApiResponse<GalleryItem>> {
    return this.http
      .get<ApiResponse<GalleryItem>>(`${this.adminApiUrl}/gallery/${id}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getAvailableCategories(): Observable<ApiResponse<GalleryCategory[]>> {
    return this.http
      .get<ApiResponse<GalleryCategory[]>>(
        `${this.adminApiUrl}/gallery/create`,
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(catchError(this.handleError));
  }

  createGalleryItem(
    item: GalleryCreateRequest
  ): Observable<ApiResponse<GalleryItem>> {
    const formData = new FormData();
    formData.append('title', item.title);
    formData.append('category', item.category);
    formData.append('active', item.active.toString());

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
      .pipe(catchError(this.handleError));
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
    if (item.active !== undefined) {
      formData.append('active', item.active.toString());
    }
    if (item.image) {
      formData.append('image', item.image);
    }

    return this.http
      .put<ApiResponse<GalleryItem>>(
        `${this.adminApiUrl}/gallery/${id}`,
        formData,
        { headers: this.authService.getAuthHeadersForFormData() }
      )
      .pipe(catchError(this.handleError));
  }

  deleteGalleryItem(id: number): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(`${this.adminApiUrl}/gallery/${id}`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
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
