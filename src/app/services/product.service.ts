import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { joinUrl } from '../utils/url.utils';
import {
  ApiItemResponse,
  ApiListResponse,
  Product,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly apiV1 = joinUrl(this.base, '/api/v1');

  getProducts$(): Observable<Product[]> {
    const url = joinUrl(this.apiV1, '/products');
    return this.http.get<ApiListResponse<Product> | Product[]>(url).pipe(
      map((resp) => (Array.isArray(resp) ? resp : resp.data || [])),
      catchError(() => of<Product[]>([])),
      shareReplay(1),
    );
  }

  getProductBySlug$(slug: string): Observable<Product | null> {
    const url = joinUrl(this.apiV1, `/products/${encodeURIComponent(slug)}`);
    return this.http.get<ApiItemResponse<Product> | Product>(url).pipe(
      map(
        (resp) =>
          (resp as ApiItemResponse<Product>)?.data ?? (resp as Product) ?? null,
      ),
      catchError(() => of<Product | null>(null)),
    );
  }

  // --- helpers ---
}
