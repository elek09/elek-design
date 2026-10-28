import { Injectable, inject, signal, computed } from '@angular/core';
import { BootstrapService } from './bootstrap.service';
import { HeaderConfig, HeaderNavItem } from '../models/header.model';
import { ensureLeadingSlash } from '../utils/url.utils';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private readonly bootstrap = inject(BootstrapService);
  private readonly rawConfig = signal<HeaderConfig | null>(null);

  readonly headerConfig = computed(() =>
    this.normalizeConfig(this.rawConfig() ?? { logoUrl: '', items: [] }),
  );

  constructor() {
    this.bootstrap.getHeader$().subscribe((config) => {
      this.rawConfig.set(config);
    });
  }

  // route-ok generálása és rendezés, logó URL kinyerése
  private normalizeConfig(config: HeaderConfig): HeaderConfig {
    const logoItem = (config.items || []).find((item) => item.id === 'logo');
    const logoUrl = (logoItem as any)?.image_url || config.logoUrl || '';

    const items = (config.items || [])
      .filter((item) => item.id !== 'logo')
      .map((item) => this.normalizeNavItem(item))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return { ...config, logoUrl, items };
  }

  private normalizeNavItem(item: HeaderNavItem): HeaderNavItem {
    const rawRoute = item.routerLink || (item as any).route || '';
    const section = item.section || '';
    const fragment =
      (item as any).fragment?.trim() || item.fragment?.trim() || undefined;

    if (rawRoute && rawRoute !== '/') {
      return {
        ...item,
        routerLink: ensureLeadingSlash(rawRoute),
        fragment: undefined,
      };
    }

    if (section && rawRoute === '/') {
      return {
        ...item,
        routerLink: '/',
        fragment: fragment || section,
      };
    }

    // Alapértelmezett: főoldal
    return {
      ...item,
      routerLink: '/',
      fragment,
    };
  }
}
