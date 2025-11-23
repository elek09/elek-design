import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Category } from '../models/category.model';
import { API_BASE_URL } from '../app.tokens';
import {
  catchError,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { BootstrapService } from './bootstrap.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly bootstrap = inject(BootstrapService);
  // URL for admin, write operations
  private readonly adminApiUrl = `${this.baseUrl}/api/v1/admin/categories`;
  // Shared observable cache and refresh trigger
  private readonly refresh$ = new Subject<void>();
  private readonly categories$: Observable<Category[]> = this.refresh$.pipe(
    startWith(void 0),
    switchMap(() => this.bootstrap.getCategories$()),
    shareReplay(1),
  );

  // Uses the PUBLIC URL
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  // Uses the ADMIN URL - includes admin-only fields like nav_order
  getAdminCategories(): Observable<Category[]> {
    return this.http
      .get<Category[] | { data: Category[] }>(this.adminApiUrl)
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res?.data ?? []))),
        // If GET is not allowed on admin endpoint (405) or any error, fall back to public categories
        catchError(() => this.getCategories()),
      );
  }

  // Uses the ADMIN URL
  saveCategory(category: Category): Observable<Category> {
    if (category._id) {
      // Update existing category
      return this.http
        .put<Category>(`${this.adminApiUrl}/${category._id}`, category)
        .pipe(
          tap(() => {
            this.refresh$.next();
            this.bootstrap.refresh();
          }),
        );
    } else {
      // Create new category
      return this.http.post<Category>(this.adminApiUrl, category).pipe(
        tap(() => {
          this.refresh$.next();
          this.bootstrap.refresh();
        }),
      );
    }
  }

  // Bulk persist nav_order for a list of categories (PUT full objects to be safe)
  saveCategoryOrder(categories: Category[]): Observable<any> {
    const calls = categories
      .filter((c) => c._id != null)
      .map((c) => this.http.put(`${this.adminApiUrl}/${c._id}`, c));
    return forkJoin(calls).pipe(
      tap(() => {
        this.refresh$.next();
        this.bootstrap.refresh();
      }),
    );
  }

  // Uses the ADMIN URL
  deleteCategory(id: string | number): Observable<any> {
    return this.http.delete(`${this.adminApiUrl}/${id}`).pipe(
      tap(() => {
        this.refresh$.next();
        this.bootstrap.refresh();
      }),
    );
  }
}
