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
  private readonly categoryService = inject(CategoryService);

  private slides$: Observable<Slide[]> = this.fetchAndProcessSlides$().pipe(
    shareReplay(1)
  );

  getFeaturedSlides$() {
    return this.slides$.pipe(
      map((slides) => slides.filter((s) => s.is_featured))
    );
  }

  getSlidesByCategory$(section: string) {
    return combineLatest([
      this.slides$,
      this.categoryService.getCategories(),
    ]).pipe(
      map(([slides, categories]) => {
        const sectionOf = this.buildSectionResolver(categories);
        const normalized = slides
          .map((s) => ({ ...s, section: s.section || sectionOf(s.category) }))
          .filter((s) => s.section === section);

        // Build dynamic order for this section from backend categories' subcategory order
        const sectionCategory = (categories || []).find(
          (c) => String(c.type) === section
        );
        const subOrder: string[] = Array.isArray(sectionCategory?.subcategories)
          ? (sectionCategory!.subcategories as any[]).map((sc) => {
              if (typeof sc === 'string') return this.slugify(sc)!;
              const name = sc?.name ?? String(sc?.id ?? '');
              const rawId = sc?.id ?? name;
              return this.slugify(String(rawId))!;
            })
          : [];

        const orderIndex = (cat?: string) => {
          if (!cat) return Number.POSITIVE_INFINITY;
          const idx = subOrder.indexOf(cat);
          return idx === -1 ? Number.POSITIVE_INFINITY : idx;
        };

        return normalized.sort((a, b) => {
          const ai = orderIndex(a.category);
          const bi = orderIndex(b.category);
          if (ai !== bi) return ai - bi;
          const at = a.title?.toLowerCase() || '';
          const bt = b.title?.toLowerCase() || '';
          if (at !== bt) return at.localeCompare(bt);
          return a.imageUrl.localeCompare(b.imageUrl);
        });
      })
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

    const categoryId = item.category ? this.slugify(item.category) : undefined;

    return {
      id,
      imageUrl,
      title: item.title ?? item.name,
      category: categoryId,
      section: item.section, // may be undefined; we'll derive it if needed
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
      .replace(/^-+|-+$/g, ''); // trim hyphens
  }

  // Sorting now happens in getSlidesByCategory$ using dynamic category order

  // Build a resolver that maps a slide.category (subcategory id or main type)
  // to its parent section (e.g., 'eletter' | 'uzletter' | custom type)
  private buildSectionResolver(categories: Category[]) {
    const subToType = new Map<string, string>();
    const typeSet = new Set<string>();
    for (const c of categories || []) {
      const type = String(c.type);
      typeSet.add(type);
      const subs = Array.isArray(c.subcategories)
        ? (c.subcategories as any[])
        : [];
      for (const s of subs) {
        const name = typeof s === 'string' ? s : s?.name ?? String(s?.id ?? '');
        const id =
          (typeof s === 'string' ? this.slugify(name) : s?.id) ||
          this.slugify(name);
        if (id) subToType.set(id, type);
      }
    }
    return (categoryId?: string) => {
      if (!categoryId) return undefined;
      const key = this.slugify(categoryId) || categoryId;
      if (typeSet.has(key)) return key; // already a main type
      return subToType.get(key);
    };
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
