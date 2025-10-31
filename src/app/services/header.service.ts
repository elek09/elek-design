import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../app.tokens';
import { HeaderConfig } from '../models/header.model';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private readonly publicUrl: string;
  private readonly refresh$ = new Subject<void>();
  private readonly headerConfig$: Observable<HeaderConfig>;
  private readonly apiOrigin: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string
  ) {
    this.publicUrl = `${this.baseUrl}/api/v1/header`;
    this.apiOrigin = this.getOrigin(this.baseUrl);
    this.headerConfig$ = this.refresh$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.http
          .get<HeaderConfig | { data: HeaderConfig }>(this.publicUrl)
          .pipe(
            map((res) => (this.isHeaderConfig(res) ? res : (res as any)?.data)),
            map((cfg) => this.normalizeConfig(cfg))
          )
      ),
      shareReplay(1)
    );
  }

  getHeaderConfig(): Observable<HeaderConfig> {
    return this.headerConfig$;
  }

  refresh(): void {
    this.refresh$.next();
  }

  private isHeaderConfig(obj: any): obj is HeaderConfig {
    return obj && typeof obj === 'object' && Array.isArray(obj.items);
  }

  private normalizeConfig(cfg: HeaderConfig): HeaderConfig {
    const items = (cfg.items || []).map((item: any) => {
      // Prefer explicit externalUrl; if absent, detect absolute URLs in `route`/`routerLink`
      const givenExternal: string | undefined =
        item.externalUrl?.trim() || undefined;
      const rawRoute: string | undefined = (
        item.route ?? item.routerLink
      )?.toString();

      const isAbsoluteUrl = (url?: string) =>
        !!url && /^(https?:)?\/\//i.test(url);

      let externalUrl: string | undefined = givenExternal;
      let routerLink: string | undefined = undefined;

      if (!externalUrl) {
        if (isAbsoluteUrl(rawRoute)) {
          externalUrl = rawRoute;
        } else if (rawRoute && rawRoute.trim() !== '') {
          routerLink = this.ensureLeadingSlash(rawRoute.trim());
        }
      } else {
        // External URL provided explicitly; keep it and ignore routerLink
        routerLink = undefined;
      }

      const fragment =
        item.fragment && item.fragment.toString().trim() !== ''
          ? item.fragment.toString().trim()
          : undefined;
      const cls =
        item.class && item.class.toString().trim() !== ''
          ? item.class.toString().trim()
          : undefined;

      return { ...item, routerLink, externalUrl, fragment, class: cls };
    });

    const logoRouterLink =
      cfg.logoRouterLink && cfg.logoRouterLink.trim() !== ''
        ? this.ensureLeadingSlash(cfg.logoRouterLink)
        : '/';

    // Prefer logo image from the dedicated logo item if present
    const logoItem = items.find((i: any) => i?.is_logo || i?.id === 'logo');
    const logoFromItem = this.resolveResourceUrl(
      logoItem?.image_url?.toString().trim()
    );

    const cfgLogo =
      cfg.logoUrl && cfg.logoUrl.toString().trim() !== ''
        ? this.resolveResourceUrl(cfg.logoUrl.toString().trim())
        : '';

    const logoUrl = logoFromItem || cfgLogo;
    return { ...cfg, logoRouterLink, logoUrl, items };
  }

  private ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }

  private getOrigin(base: string): string {
    try {
      const u = new URL(base);
      return `${u.protocol}//${u.host}`;
    } catch {
      return '';
    }
  }

  private resolveResourceUrl(raw?: string): string | '' {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return this.apiOrigin ? `${this.apiOrigin}${path}` : path;
  }
}
