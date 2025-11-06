import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  combineLatest,
} from 'rxjs';
import { Slide } from '../models/slide.model';
import { API_BASE_URL, GALLERY_API_BASE_URL } from '../app.tokens';
// Static category lists are no longer used for ordering; we sort by dynamic CategoryService data
import { CategoryService } from './category.service';
import { Category } from '../models/category.model';
import { BootstrapService } from './bootstrap.service';
import { getOrigin, resolveToAbsolute, joinUrl } from '../utils/url.utils';
import { slugify } from '../utils/slug.utils';

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
  private readonly apiOrigin = getOrigin(this.baseUrl);
  private readonly bootstrap = inject(BootstrapService);
  private readonly categoryService = inject(CategoryService);
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
            this.unwrap(resp)
              .map((i) => this.toSlide({ ...i, section: key }))
              .filter((s): s is Slide => !!s)
              .filter((slide) => slide.is_active)
          ),
          catchError(() => of<Slide[]>([])),
          shareReplay(1)
        );
      this.sectionCache.set(key, section$);
    }

    return combineLatest([
      this.sectionCache.get(key)!,
      this.categoryService.getCategories(),
    ]).pipe(
      map(([slides, categories]) =>
        this.sortByDynamicSubcategoryOrder(slides, categories, key)
      )
    );
  }

  private sortByDynamicSubcategoryOrder(
    slides: Slide[],
    categories: Category[],
    section: string
  ): Slide[] {
    const sectionCategory = (categories || []).find(
      (c) => String(c.type) === section
    );
    const subOrder: string[] = Array.isArray(sectionCategory?.subcategories)
      ? (sectionCategory!.subcategories as any[]).map((sc) => {
          // Prefer backend-provided id; fall back to slugify only for legacy string entries
          if (typeof sc === 'string') return slugify(sc)!;
          return String(sc?.id ?? '').trim();
        })
      : [];

    const orderIndex = (cat?: string) => {
      if (!cat) return Number.POSITIVE_INFINITY;
      const idx = subOrder.indexOf(cat);
      return idx === -1 ? Number.POSITIVE_INFINITY : idx;
    };

    return [...slides].sort((a, b) => {
      const ai = orderIndex(a.category);
      const bi = orderIndex(b.category);
      if (ai !== bi) return ai - bi;
      const at = a.title?.toLowerCase() || '';
      const bt = b.title?.toLowerCase() || '';
      if (at !== bt) return at.localeCompare(bt);
      return a.imageUrl.localeCompare(b.imageUrl);
    });
  }

  // --- internals ---

  // removed root gallery fetch; we rely on per-section endpoints and bootstrap featured

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

    // Prefer backend-provided slug/id/category as-is; only fallback to slugify(title) for legacy data
    const id =
      item.slug?.toString().trim() ||
      undefined ||
      (item.id != null ? String(item.id) : undefined) ||
      (item.title || item.name ? slugify(item.title ?? item.name)! : undefined);

    const categoryId = item.category?.toString().trim() || undefined;

    return {
      id,
      imageUrl,
      thumbUrl: this.resolveThumbUrl(item),
      title: item.title ?? item.name,
      category: categoryId,
      section: item.section, // may be undefined; we'll derive it if needed
      is_active: item.is_active,
      is_featured: item.is_featured,
    };
  }

  // Sorting now happens in getSlidesByCategory$ using dynamic category order

  // Previously had a buildSectionResolver; no longer needed with canonical ids from backend

  private resolveImageUrl(item: ApiImageItem): string | null {
    const raw = item.url ?? (item as any).imageUrl ?? item.image ?? null;
    if (!raw) return null;
    return resolveToAbsolute(this.apiOrigin, raw);
  }
  private resolveThumbUrl(item: ApiImageItem): string | undefined {
    const raw = (item as any).thumb_url as string | undefined;
    if (!raw) return undefined;
    const abs = resolveToAbsolute(this.apiOrigin, raw);
    return abs || undefined;
  }

  // origin helper moved to utils
}
