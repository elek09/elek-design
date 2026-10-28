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
import { HeaderConfig } from '../models/header.model';
import { Category } from '../models/category.model';
import { Slide } from '../models/slide.model';
import { BootstrapPayload } from '../models/bootstrap.model';
import { getOrigin } from '../utils/url.utils';
import { convertToSlide } from '../utils/gallery.utils';

@Injectable({ providedIn: 'root' })
export class BootstrapService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly url: string = `${this.baseUrl}/api/v1/bootstrap`;
  private readonly apiOrigin: string = getOrigin(this.baseUrl);

  private readonly refresh$ = new Subject<void>();

  // Cache-elt bootstrap adat stream
  // - startWith: azonnal indul az első betöltéssel
  // - switchMap + defer: refresh() hívásakor új HTTP kérés indul
  // - shareReplay(1): cache-eli az utolsó eredményt
  private readonly data$: Observable<BootstrapPayload> = this.refresh$.pipe(
    startWith(void 0),
    switchMap(() =>
      defer(() =>
        this.http
          .get<BootstrapPayload | { data: BootstrapPayload }>(this.url)
          .pipe(
            map((response) => ('data' in response ? response.data : response)),
            catchError(() => of<BootstrapPayload>({})),
          ),
      ),
    ),
    shareReplay(1),
  );

  // loading spinnerhez
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
      map((data) =>
        data?.header
          ? ({
              logoUrl: '',
              items: data.header.items ?? [],
            } as HeaderConfig)
          : null,
      ),
    );
  }

  getCategories$(): Observable<Category[]> {
    return this.data$.pipe(map((data) => data.categories ?? []));
  }

  getFeaturedSlides$(): Observable<Slide[]> {
    return this.data$.pipe(
      map((data) =>
        (data.featured_gallery ?? [])
          .map((galleryItem) => convertToSlide(galleryItem, this.apiOrigin))
          .filter((slide): slide is Slide => !!slide),
      ),
    );
  }
}
