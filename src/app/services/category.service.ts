import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Category } from '../models/category.model';
import { Subcategory } from '../models/category.model';
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
  private readonly subcategoriesAdminApiUrl = `${this.baseUrl}/api/v1/admin/subcategories`;
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

  // Admin fresh bootstrap: always bypass cache, fetch latest categories & subcategories
  getCategoriesFresh(): Observable<Category[]> {
    return this.http
      .get<{
        data?: { categories?: Category[] };
        categories?: Category[];
      }>(`${this.baseUrl}/api/v1/admin/bootstrap?fresh=1`)
      .pipe(
        map((res) => res.data?.categories ?? res.categories ?? []),
        catchError(() => this.getCategories()), // fallback to cached if fresh fails
      );
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
  // PATCH minimal fields of existing category
  patchCategory(
    id: number | string,
    payload: Partial<Category>,
  ): Observable<Category> {
    return this.http.patch<Category>(`${this.adminApiUrl}/${id}`, payload).pipe(
      tap(() => {
        this.refresh$.next();
        this.bootstrap.refresh();
      }),
    );
  }

  // --- Subcategory CRUD (új admin endpointok) ---
  getSubcategories(): Observable<Subcategory[]> {
    return this.http
      .get<
        Subcategory[] | { data: Subcategory[] }
      >(this.subcategoriesAdminApiUrl)
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getSubcategory(id: number | string): Observable<Subcategory> {
    return this.http.get<Subcategory>(`${this.subcategoriesAdminApiUrl}/${id}`);
  }

  createSubcategory(payload: {
    category_id: number | string;
    name: string;
    slug?: string;
    nav_order?: number;
  }): Observable<Subcategory> {
    // slug optional – backend generálja ha nincs
    return this.http
      .post<Subcategory>(this.subcategoriesAdminApiUrl, payload)
      .pipe(
        tap(() => {
          this.refresh$.next(); // kategória cache frissítés (alcímek változhatnak)
          this.bootstrap.refresh();
        }),
      );
  }

  updateSubcategory(
    id: number | string,
    payload: { name?: string; slug?: string; nav_order?: number },
  ): Observable<Subcategory> {
    return this.http
      .put<Subcategory>(`${this.subcategoriesAdminApiUrl}/${id}`, payload)
      .pipe(
        tap(() => {
          this.refresh$.next();
          this.bootstrap.refresh();
        }),
      );
  }

  deleteSubcategory(id: number | string): Observable<{ message?: string }> {
    return this.http
      .delete<{ message?: string }>(`${this.subcategoriesAdminApiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.refresh$.next();
          this.bootstrap.refresh();
        }),
      );
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

  // Bulk reorder categories via POST /categories/reorder
  reorderCategories(categories: Category[]): Observable<Category[]> {
    const orders = categories
      .filter((c) => (c.id ?? c._id) != null)
      .map((c, idx) => ({ id: c.id ?? c._id, nav_order: idx + 1 }));
    return this.http.post<any>(`${this.adminApiUrl}/reorder`, { orders }).pipe(
      map((res) => {
        const data = Array.isArray(res?.data) ? res.data : (res?.data ?? res);
        return (Array.isArray(data) ? data : []) as Category[];
      }),
      tap(() => {
        this.refresh$.next();
        this.bootstrap.refresh();
      }),
    );
  }
}
