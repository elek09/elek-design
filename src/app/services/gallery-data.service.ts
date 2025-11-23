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

interface ApiImageItem {
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
}

interface PaginatedResponse<T> {
  data: T[];
  // ...other pagination fields we ignore
}

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
              .filter((slide) => slide.is_active),
          ),
          catchError(() => of<Slide[]>([])),
          shareReplay(1),
        );
      this.sectionCache.set(key, section$);
    }

    return combineLatest([
      this.sectionCache.get(key)!,
      this.categoryService.getCategories(),
    ]).pipe(
      map(([slides, categories]) =>
        this.sortByDynamicSubcategoryOrder(slides, categories, key),
      ),
    );
  }

  private sortByDynamicSubcategoryOrder(
    slides: Slide[],
    categories: Category[],
    section: string,
  ): Slide[] {
    const sectionCategory = categories.find((c) => String(c.type) === section);
    const rawSubs = sectionCategory?.subcategories ?? [];
    const subOrder: string[] = rawSubs.map((sc) => {
      if (typeof sc === 'string') return slugify(sc)!;
      return String(sc.id ?? '').trim();
    });

    const orderIndex = (cat?: string) => {
      if (!cat) return Number.POSITIVE_INFINITY;
      const idx = subOrder.indexOf(cat);
      return idx === -1 ? Number.POSITIVE_INFINITY : idx;
    };

    return [...slides].sort((a, b) => this.compareSlides(a, b, orderIndex));
  }

  private compareSlides(
    a: Slide,
    b: Slide,
    orderIndex: (cat?: string) => number,
  ): number {
    const ai = orderIndex(a.category);
    const bi = orderIndex(b.category);
    if (ai !== bi) return ai - bi;
    const at = a.title?.toLowerCase() || '';
    const bt = b.title?.toLowerCase() || '';
    if (at !== bt) return at.localeCompare(bt);
    return a.imageUrl.localeCompare(b.imageUrl);
  }

  // --- internals ---

  // removed root gallery fetch; we rely on per-section endpoints and bootstrap featured

  private unwrap(
    resp: ApiImageItem[] | PaginatedResponse<ApiImageItem>,
  ): ApiImageItem[] {
    if (Array.isArray(resp)) return resp;
    return resp.data ?? [];
  }

  private toSlide(item: ApiImageItem): Slide | null {
    const imageUrl = this.absoluteUrl(
      item.url || (item as any).imageUrl || item.image || '',
    );
    if (!imageUrl) return null;
    const id =
      item.slug?.toString().trim() ||
      (item.id != null ? String(item.id) : '') ||
      (item.title || item.name ? slugify(item.title ?? item.name)! : '');
    const categoryId = item.category?.toString().trim() || undefined;
    return {
      id: id || undefined,
      imageUrl,
      thumbUrl: this.absoluteUrl((item as any).thumb_url || undefined),
      title: item.title ?? item.name,
      category: categoryId,
      section: item.section,
      is_active: item.is_active,
      is_featured: item.is_featured,
    };
  }

  // Sorting now happens in getSlidesByCategory$ using dynamic category order

  // Previously had a buildSectionResolver; no longer needed with canonical ids from backend

  private absoluteUrl(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    return resolveToAbsolute(this.apiOrigin, raw);
  }

  // origin helper moved to utils
}
