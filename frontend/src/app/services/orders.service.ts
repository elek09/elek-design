import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { joinUrl } from '../utils/url.utils';
import { OrderRequest, SubmitOrderRequest } from '../models/shop.model';
import { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly apiV1 = joinUrl(this.base, '/api/v1');

  createQuote(payload: OrderRequest): Observable<ApiResponse> {
    const url = joinUrl(this.apiV1, '/orders');
    return this.http.post<ApiResponse>(url, payload);
  }

  // Publikus végpont rendeléshez és ajánlatkéréshez (ajánlott)
  submitPublicOrder(payload: SubmitOrderRequest): Observable<ApiResponse> {
    const url = joinUrl(this.apiV1, '/orders/submit');
    return this.http.post<ApiResponse>(url, payload);
  }
}
