import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  // URL for public, read-only operations
  private publicApiUrl: string;
  // URL for admin, write operations
  private adminApiUrl: string;
  // Shared observable cache and refresh trigger
  private refresh$ = new Subject<void>();
  private categories$!: Observable<Category[]>;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string
  ) {
    // Set up both URLs
    this.publicApiUrl = `${this.baseUrl}/api/v1/categories`;
    this.adminApiUrl = `${this.baseUrl}/api/v1/admin/categories`;

    // Build cached categories stream similar to gallery items approach
    this.categories$ = this.refresh$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.http
          .get<Category[] | { data: Category[] }>(this.publicApiUrl)
          .pipe(
            map((res) => (Array.isArray(res) ? res : res?.data ?? [])),
            catchError(() => of([] as Category[]))
          )
      ),
      shareReplay(1)
    );
  }

  // Uses the PUBLIC URL
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  // Uses the ADMIN URL
  saveCategory(category: Category): Observable<Category> {
    if (category._id) {
      // Update existing category
      return this.http
        .put<Category>(`${this.adminApiUrl}/${category._id}`, category)
        .pipe(tap(() => this.refresh$.next()));
    } else {
      // Create new category
      return this.http
        .post<Category>(this.adminApiUrl, category)
        .pipe(tap(() => this.refresh$.next()));
    }
  }

  // Uses the ADMIN URL
  deleteCategory(id: string | number): Observable<any> {
    return this.http
      .delete(`${this.adminApiUrl}/${id}`)
      .pipe(tap(() => this.refresh$.next()));
  }
}
