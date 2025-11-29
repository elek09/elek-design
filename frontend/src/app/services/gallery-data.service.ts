import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { Slide } from '../models/slide.model';
import { ApiImageItem } from '../models/gallery.model';
import { PaginatedResponse } from '../models/api.model';
import { API_BASE_URL } from '../app.tokens';
import { BootstrapService } from './bootstrap.service';
import { getOrigin, joinUrl } from '../utils/url.utils';
import { convertToSlide } from '../utils/gallery.utils';
import { unwrapResponse } from '../utils/api.utils';

@Injectable({ providedIn: 'root' })
export class GalleryDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly galleryApiUrl = `${this.baseUrl}/api/v1/gallery`;
  private readonly apiOrigin = getOrigin(this.baseUrl);
  private readonly bootstrap = inject(BootstrapService);
  private readonly sectionCache = new Map<string, Observable<Slide[]>>();

  getFeaturedSlides$() {
    return this.bootstrap.getFeaturedSlides$();
  }

  getSlidesByCategory$(section: string) {
    const key = section.toLowerCase();
    if (!this.sectionCache.has(key)) {
      const url = joinUrl(this.galleryApiUrl, `/section/${key}`);
      const sectionSlides$ = this.http
        .get<ApiImageItem[] | PaginatedResponse<ApiImageItem>>(url)
        .pipe(
          map((response) =>
            unwrapResponse(response)
              .map((item) => convertToSlide(item, this.apiOrigin, key))
              .filter(
                (slide): slide is Slide => !!slide && (slide.is_active ?? true),
              ),
          ),
          catchError(() => of<Slide[]>([])),
          shareReplay(1),
        );
      this.sectionCache.set(key, sectionSlides$);
    }
    return this.sectionCache.get(key)!;
  }
}
