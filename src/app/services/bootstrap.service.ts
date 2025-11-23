import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  defer,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  merge,
  distinctUntilChanged,
} from 'rxjs';
import { API_BASE_URL } from '../app.tokens';
import { HeaderConfig, HeaderNavItem } from '../models/header.model';
import { Category } from '../models/category.model';
import { Slide } from '../models/slide.model';
import { getOrigin, resolveToAbsolute } from '../utils/url.utils';

// Backend bootstrap response shape
interface GalleryItemResource {
  id: string | number;
  title?: string;
  slug?: string;
  section?: string; // Hungarian section id, e.g. 'eletter'
  subcategory?: string | null; // Hungarian id or null
  category?: string | null;
  url?: string; // full image url
  thumb_url?: string | null;
  order?: number | null;
  is_featured?: boolean;
  is_active?: boolean;
}

interface BootstrapPayload {
  header?: {
    items?: HeaderNavItem[];
    logoUrl?: string;
  };
  categories?: Category[];
  featured_gallery?: GalleryItemResource[];
}

@Injectable({ providedIn: 'root' })
export class BootstrapService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly url: string = `${this.baseUrl}/api/v1/bootstrap`;
  private readonly apiOrigin: string = getOrigin(this.baseUrl);
  private readonly refresh$ = new Subject<void>();
  private readonly data$: Observable<BootstrapPayload> = this.refresh$.pipe(
    startWith(void 0),
    switchMap(() =>
      defer(() =>
        this.http
          .get<
            BootstrapPayload | { success?: boolean; data?: BootstrapPayload }
          >(this.url)
          .pipe(
            map(
              (res: any) =>
                (res && typeof res === 'object' && 'data' in res
                  ? res.data
                  : res) as BootstrapPayload,
            ),
            catchError(() => of<BootstrapPayload>({})),
          ),
      ),
    ),
    shareReplay(1),
  );
  /** Emits true while a refresh HTTP request is in-flight, else false. */
  readonly loading$: Observable<boolean> = merge(
    this.refresh$.pipe(map(() => true)),
    this.data$.pipe(map(() => false)),
  ).pipe(startWith(false), distinctUntilChanged(), shareReplay(1));

  getBootstrap$(): Observable<BootstrapPayload> {
    return this.data$;
  }

  refresh(): void {
    this.refresh$.next();
  }

  getHeader$(): Observable<HeaderConfig | null> {
    return this.data$.pipe(
      map((d) => {
        if (!d?.header) return null;
        const logo = d.header.logoUrl
          ? resolveToAbsolute(this.apiOrigin, d.header.logoUrl)
          : '';
        return {
          logoUrl: logo,
          items: d.header.items ?? [],
        } satisfies HeaderConfig;
      }),
    );
  }

  getCategories$(): Observable<Category[]> {
    return this.data$.pipe(map((d) => d.categories ?? []));
  }

  getFeaturedSlides$(): Observable<Slide[]> {
    return this.data$.pipe(
      map((d) =>
        (d.featured_gallery ?? [])
          .map((g) => this.toSlide(g))
          .filter((s): s is Slide => !!s),
      ),
    );
  }

  // --- helpers ---
  private isPayload(obj: any): obj is BootstrapPayload {
    return obj && typeof obj === 'object';
  }

  private toSlide(item: GalleryItemResource): Slide | null {
    const imageUrl = resolveToAbsolute(this.apiOrigin, item.url || '');
    if (!imageUrl) return null;
    return {
      id: String(item.slug || item.id),
      imageUrl,
      thumbUrl: resolveToAbsolute(this.apiOrigin, item.thumb_url || ''),
      title: item.title,
      category: item.subcategory || undefined,
      section: item.section,
      is_active: item.is_active ?? true,
      is_featured: item.is_featured ?? false,
    };
  }
}
