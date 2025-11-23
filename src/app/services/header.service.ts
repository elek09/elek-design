import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BootstrapService } from './bootstrap.service';
import { HeaderConfig } from '../models/header.model';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private readonly bootstrap = inject(BootstrapService);
  private readonly headerConfig$: Observable<HeaderConfig> = this.bootstrap
    .getHeader$()
    .pipe(
      map((cfg) =>
        this.normalizeConfig(
          (cfg as HeaderConfig) ?? {
            logoUrl: '',
            items: [],
          },
        ),
      ),
      shareReplay(1),
    );

  getHeaderConfig(): Observable<HeaderConfig> {
    return this.headerConfig$;
  }

  private normalizeConfig(cfg: HeaderConfig): HeaderConfig {
    const mappedItems = (cfg.items || []).map((item: any) => {
      // Prefer semantic section paths (e.g., '/eletter', '/uzletter')
      const rawRoute: string = (item.route ?? '').toString().trim();
      const section: string = (item.section ?? '').toString().trim();
      let routerLink = '/';
      if (section) {
        routerLink = this.ensureLeadingSlash(section);
      } else if (rawRoute) {
        routerLink = this.ensureLeadingSlash(rawRoute);
      }

      const fragment = item.fragment
        ? item.fragment.toString().trim()
        : undefined;
      return { ...item, routerLink, fragment };
    });

    const logoItem = mappedItems.find(
      (i: any) => i?.is_logo || i?.id === 'logo',
    );
    const logoUrl = (logoItem?.image_url ?? '').toString().trim();
    const items = mappedItems.filter(
      (i: any) => !(i?.is_logo || i?.id === 'logo'),
    );
    return { ...cfg, logoUrl, items };
  }

  private ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
