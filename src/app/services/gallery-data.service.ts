import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { Slide } from '../models/slide.model';
import { API_BASE_URL, GALLERY_API_BASE_URL } from '../app.tokens';
import {
  eletterCategories,
  uzletterCategories,
} from '../models/gallery-categories';

type ApiImageItem = {
  id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  imageUrl?: string;
  url?: string;
  image?: string;
  category?: string;
  section?: string;
  is_active?: boolean;
  is_featured?: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  // ...other pagination fields we ignore
};

@Injectable({ providedIn: 'root' })
export class GalleryDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly galleryApiUrl = inject(GALLERY_API_BASE_URL);
  private readonly apiOrigin = this.getOrigin(this.baseUrl);

  private slides$: Observable<Slide[]> = this.fetchAndProcessSlides$().pipe(
    shareReplay(1)
  );

  getFeaturedSlides$() {
    return this.slides$.pipe(
      map((slides) => slides.filter((s) => s.is_featured))
    );
  }

  getSlidesByCategory$(category: string) {
    return this.slides$.pipe(
      map((slides) => slides.filter((s) => s.section === category))
    );
  }

  // --- internals ---

  private fetchAndProcessSlides$() {
    const url = this.joinUrl(this.galleryApiUrl, '');
    return this.http
      .get<ApiImageItem[] | PaginatedResponse<ApiImageItem>>(url)
      .pipe(
        map((resp) =>
          this.unwrap(resp)
            .map((i) => this.toSlide(i))
            .filter((s): s is Slide => !!s)
            .filter((slide) => slide.is_active)
            .sort((a, b) => this.sortSlides(a, b))
        ),
        catchError(() => of<Slide[]>([])) // no local fallback
      );
  }

  private unwrap(
    resp: ApiImageItem[] | PaginatedResponse<ApiImageItem> | unknown
  ): ApiImageItem[] {
    if (Array.isArray(resp)) return resp;
    if (
      resp &&
      typeof resp === 'object' &&
      'data' in (resp as any) &&
      Array.isArray((resp as any).data)
    ) {
      return (resp as PaginatedResponse<ApiImageItem>).data;
    }
    return [];
  }

  private toSlide(item: ApiImageItem): Slide | null {
    const imageUrl = this.resolveImageUrl(item);
    if (!imageUrl) return null;

    const id =
      (item.slug && this.slugify(item.slug)) ||
      this.slugify(item.title ?? item.name) ||
      (item.id != null ? String(item.id) : undefined);

    return {
      id,
      imageUrl,
      title: item.title ?? item.name,
      category: item.category,
      section: item.section,
      is_active: item.is_active,
      is_featured: item.is_featured,
    };
  }

  // Create a slug from title (handles accents, spaces, etc.)
  private slugify(value?: string): string | undefined {
    if (!value) return undefined;
    return value
      .normalize('NFD') // split accents
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // non-alnum -> hyphen
      .replace(/^-+|-+$/g, '') // trim hyphens
      .replace(/-/g, ''); // optional: remove hyphens to match menu keys
  }

  // Sort slides to group by category (title) and then by filename
  private sortSlides(a: Slide, b: Slide): number {
    const categoryOrder = [
      ...eletterCategories.map((c) => c.id),
      ...uzletterCategories.map((c) => c.id),
    ];

    const getOrder = (category?: string) => {
      const index = category ? categoryOrder.indexOf(category) : -1;
      return index === -1 ? Infinity : index;
    };

    const orderA = getOrder(a.category);
    const orderB = getOrder(b.category);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const titleA = a.title?.toLowerCase() || '';
    const titleB = b.title?.toLowerCase() || '';
    if (titleA !== titleB) {
      return titleA.localeCompare(titleB);
    }

    return a.imageUrl.localeCompare(b.imageUrl);
  }

  private resolveImageUrl(item: ApiImageItem): string | null {
    const raw = item.imageUrl ?? item.url ?? item.image ?? null;
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw; // absolute
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return this.apiOrigin ? `${this.apiOrigin}${path}` : path;
  }

  private joinUrl(base: string, path: string): string {
    const b = base?.endsWith('/') ? base.slice(0, -1) : base;
    const p = path?.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  private getOrigin(base: string): string {
    try {
      const u = new URL(base);
      return `${u.protocol}//${u.host}`;
    } catch {
      return '';
    }
  }
}
