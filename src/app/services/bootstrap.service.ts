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
import { GalleryItemResource } from '../models/gallery.model';
import { getOrigin, resolveToAbsolute } from '../utils/url.utils';

interface BootstrapPayload {
  header?: {
    items?: any[]; // raw items from backend; HeaderService normalizes
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
          .get<BootstrapPayload | { data: BootstrapPayload }>(this.url)
          .pipe(
            map((res) => ('data' in res ? res.data : res)),
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
    // Pass through raw header items; HeaderService will extract logo and routes
    return this.data$.pipe(
      map((d) =>
        d?.header
          ? ({
              logoUrl: '',
              items: (d.header.items ?? []) as HeaderNavItem[],
            } as HeaderConfig)
          : (null as HeaderConfig | null),
      ),
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

  private toSlide(item: GalleryItemResource): Slide | null {
    const imageUrl = resolveToAbsolute(this.apiOrigin, item.url || '');
    if (!imageUrl) return null;
    const section = item.category?.type || undefined;
    const subSlug = item.subcategory?.slug || undefined;
    return {
      id: String(item.id),
      imageUrl,
      thumbUrl: resolveToAbsolute(this.apiOrigin, item.thumb_url || ''),
      title: item.title,
      category: subSlug, // use backend slug for matching
      section,
      is_active: item.is_active ?? true,
      is_featured: item.is_featured ?? false,
    };
  }
}
