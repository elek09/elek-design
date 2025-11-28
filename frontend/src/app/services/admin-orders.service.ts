import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { Order, OrderStatus, OrderUpdatePayload } from '../models/order.model';

export interface ApiListResponse<T> {
  data: T[];
}
export interface ApiItemResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly adminApi = `${this.baseUrl}/api/v1/admin`;

  getOrder(orderId: number) {
    return this.http
      .get<ApiItemResponse<Order> | Order>(`${this.adminApi}/orders/${orderId}`)
      .pipe(map((resp) => ((resp as any)?.data ?? resp) as Order));
  }

  listOrders(status?: OrderStatus | 'all'): Observable<Order[]> {
    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    return this.http
      .get<ApiListResponse<Order> | Order[]>(`${this.adminApi}/orders`, {
        params,
      })
      .pipe(map((resp) => (Array.isArray(resp) ? resp : resp.data || [])));
  }

  updateStatus(
    orderId: number,
    status: OrderStatus,
  ): Observable<ApiItemResponse<Order>> {
    return this.http.put<ApiItemResponse<Order>>(
      `${this.adminApi}/orders/${orderId}/status`,
      { status },
    );
  }

  updateOrder(
    orderId: number,
    payload: OrderUpdatePayload,
  ): Observable<ApiItemResponse<Order>> {
    return this.http.put<ApiItemResponse<Order>>(
      `${this.adminApi}/orders/${orderId}`,
      payload,
    );
  }

  sendConfirmation(orderId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.adminApi}/orders/${orderId}/confirm`,
      {},
    );
  }
}
