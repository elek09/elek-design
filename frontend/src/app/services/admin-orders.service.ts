import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { Order, OrderStatus, OrderUpdatePayload } from '../models/order.model';
import { ApiListResponse, ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly adminApi = `${this.baseUrl}/api/v1/admin`;

  getOrder(orderId: number) {
    return this.http
      .get<ApiResponse<Order> | Order>(`${this.adminApi}/orders/${orderId}`)
      .pipe(map((response) => ((response as any)?.data ?? response) as Order));
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
      .pipe(
        map((response) =>
          Array.isArray(response) ? response : response.data || [],
        ),
      );
  }

  updateStatus(
    orderId: number,
    status: OrderStatus,
  ): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${this.adminApi}/orders/${orderId}/status`,
      { status },
    );
  }

  updateOrder(
    orderId: number,
    payload: OrderUpdatePayload,
  ): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
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

  rejectQuote(orderId: number): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${this.adminApi}/orders/${orderId}/status`,
      { status: 'rejected' },
    );
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApi}/orders/${orderId}`);
  }
}
