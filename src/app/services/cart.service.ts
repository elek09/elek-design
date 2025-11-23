import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { concatMap, last, mapTo } from 'rxjs/operators';
import { API_BASE_URL } from '../app.tokens';
import {
  ApiResponse,
  CartItemRequest,
  CheckoutRequest,
} from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly apiV1 = this.joinUrl(this.base, '/api/v1');

  addItem(payload: CartItemRequest): Observable<ApiResponse> {
    const url = this.joinUrl(this.apiV1, '/cart/items');
    return this.http.post<ApiResponse>(url, payload);
  }

  checkout(payload: CheckoutRequest): Observable<ApiResponse> {
    const url = this.joinUrl(this.apiV1, '/cart/checkout');
    return this.http.post<ApiResponse>(url, payload);
  }

  // Add a batch of items sequentially (used only at checkout time)
  addItemsBatch(items: CartItemRequest[]): Observable<void> {
    if (!items.length) return of(void 0);
    const url = this.joinUrl(this.apiV1, '/cart/items');
    return from(items).pipe(
      concatMap((item) => this.http.post<ApiResponse>(url, item)),
      last(),
      mapTo(void 0),
    );
  }

  private joinUrl(base: string, path: string): string {
    const b = base?.endsWith('/') ? base.slice(0, -1) : base;
    const p = path?.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }
}
