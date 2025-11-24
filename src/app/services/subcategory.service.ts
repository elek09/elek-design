import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../app.tokens';
import { Subcategory } from '../models/category.model';
import { BootstrapService } from './bootstrap.service';
import { CategoryService } from './category.service';

@Injectable({ providedIn: 'root' })
export class SubcategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly bootstrap = inject(BootstrapService);
  private readonly categoryService = inject(CategoryService);

  private readonly adminUrl = `${this.baseUrl}/api/v1/admin/subcategories`;

  list(): Observable<Subcategory[]> {
    return this.http
      .get<Subcategory[] | { data: Subcategory[] }>(this.adminUrl)
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  listByCategory(categoryId: number | string): Observable<Subcategory[]> {
    return this.list().pipe(
      map((subs) =>
        subs.filter((s) => String(s.category_id) === String(categoryId)),
      ),
    );
  }

  get(id: number | string): Observable<Subcategory> {
    return this.http
      .get<any>(`${this.adminUrl}/${id}`)
      .pipe(map((res) => (res?.data ?? res) as Subcategory));
  }

  create(payload: {
    category_id: number | string;
    name: string;
    slug?: string;
    nav_order?: number;
  }): Observable<Subcategory> {
    return this.http.post<any>(this.adminUrl, payload).pipe(
      map((res) => (res?.data ?? res) as Subcategory),
      tap(() => this.invalidate()),
    );
  }

  update(
    id: number | string,
    payload: {
      name?: string;
      slug?: string;
      nav_order?: number;
      category_id?: number | string;
    },
  ): Observable<Subcategory> {
    return this.http.put<any>(`${this.adminUrl}/${id}`, payload).pipe(
      map((res) => (res?.data ?? res) as Subcategory),
      tap(() => this.invalidate()),
    );
  }

  delete(id: number | string): Observable<{ message?: string }> {
    return this.http
      .delete<{ message?: string }>(`${this.adminUrl}/${id}`)
      .pipe(tap(() => this.invalidate()));
  }

  // Bulk update nav_order sequentially (for now N PUT hívás)
  updateOrder(subs: Subcategory[]): Observable<Subcategory[]> {
    const calls = subs.map((s, idx) =>
      this.update(s.id!, { nav_order: idx + 1 }),
    );
    return forkJoin(calls);
  }

  // Bulk reorder using backend endpoint POST /subcategories/reorder
  reorder(subs: Subcategory[]): Observable<Subcategory[]> {
    const orders = subs
      .filter((s) => s.id != null)
      .map((s, idx) => ({ id: s.id, nav_order: idx + 1 }));
    return this.http.post<any>(`${this.adminUrl}/reorder`, { orders }).pipe(
      map(
        (res) =>
          (Array.isArray(res?.data)
            ? res.data
            : (res?.data ?? res)) as Subcategory[],
      ),
      tap(() => this.invalidate()),
    );
  }

  private invalidate(): void {
    // Frissítjük a kategória listát, mert subcategory változhat a bootstrap cache-ben
    this.bootstrap.refresh();
  }
}
