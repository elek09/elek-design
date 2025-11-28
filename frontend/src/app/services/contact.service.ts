import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { joinUrl } from '../utils/url.utils';

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly apiV1 = joinUrl(this.base, '/api/v1');

  sendMessage(
    payload: ContactMessagePayload,
  ): Observable<{ success: boolean }> {
    const url = joinUrl(this.apiV1, '/contact');
    return this.http.post<{ success: boolean }>(url, payload);
  }
}
