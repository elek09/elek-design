import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { Slide } from '../models/slide.model';
import { ApiImageItem } from '../models/gallery.model';
import { PaginatedResponse } from '../models/api.model';
import { API_BASE_URL, GALLERY_API_BASE_URL } from '../app.tokens';
import { BootstrapService } from './bootstrap.service';
import { getOrigin, resolveToAbsolute, joinUrl } from '../utils/url.utils';

@Injectable({ providedIn: 'root' })
export class GalleryDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly galleryApiUrl = inject(GALLERY_API_BASE_URL);
  private readonly apiOrigin = getOrigin(this.baseUrl);
  private readonly bootstrap = inject(BootstrapService);
  private sectionCache = new Map<string, Observable<Slide[]>>();

  getFeaturedSlides$() {
    return this.bootstrap.getFeaturedSlides$();
  }

  getSlidesByCategory$(section: string) {
    // Cache per-section HTTP to align with backend endpoint /section/{section}
    const key = section.toLowerCase();
    if (!this.sectionCache.has(key)) {
      const url = joinUrl(this.galleryApiUrl, `/section/${key}`);
      const section$ = this.http
        .get<ApiImageItem[] | PaginatedResponse<ApiImageItem>>(url)
        .pipe(
          map((resp) =>
            // Preserve backend ordering exactly (remove global order sort)
            this.unwrap(resp)
              .map((i) => this.toSlide(i, key))
              .filter((s): s is Slide => !!s)
              .filter((slide) => slide.is_active),
          ),
          catchError(() => of<Slide[]>([])),
          shareReplay(1),
        );
      this.sectionCache.set(key, section$);
    }
    return this.sectionCache.get(key)!;
  }

  private unwrap(
    resp: ApiImageItem[] | PaginatedResponse<ApiImageItem>,
  ): ApiImageItem[] {
    if (Array.isArray(resp)) return resp;
    return resp.data ?? [];
  }

  private toSlide(item: ApiImageItem, sectionKey?: string): Slide | null {
    const imageUrl = this.absoluteUrl(
      item.url || (item as any).imageUrl || item.image || '',
    );
    if (!imageUrl) return null;
    const id = item.id != null ? String(item.id) : undefined;
    // Use backend subcategory slug for matching
    const subcategorySlug = item.subcategory?.slug?.toString().trim();
    const section = item.category?.type?.toString().trim() || sectionKey;
    return {
      id,
      imageUrl,
      thumbUrl: this.absoluteUrl((item as any).thumb_url || undefined),
      title: item.title,
      category: subcategorySlug, // slug used for stable matching
      section,
      is_active: item.is_active,
      is_featured: item.is_featured,
    };
  }

  private absoluteUrl(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    return resolveToAbsolute(this.apiOrigin, raw);
  }
}
