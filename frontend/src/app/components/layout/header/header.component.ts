import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderService } from '../../../services/header.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);

  readonly isMenuOpen = signal(false);
  readonly headerConfig = this.headerService.headerConfig;
  readonly activeItemId = signal<string | null>(null);

  @HostListener('window:hashchange')
  onHashChange() {
    this.updateActiveItem();
  }

  constructor() {
    this.updateActiveItem();
  }

  private updateActiveItem() {
    const hash = window.location.hash.substring(1);
    const currentPath = this.router.url.split('#')[0];

    const items = this.headerConfig().items;
    const activeItem = items.find((item) => {
      if (item.fragment && currentPath === item.routerLink) {
        return item.fragment === hash;
      }
      return item.routerLink === currentPath && !hash;
    });

    this.activeItemId.set(activeItem?.id || null);
  }

  onNavItemClick(item: { id?: string }) {
    this.activeItemId.set(item.id || null);
  }

  isItemActive(item: { id?: string }): boolean {
    return this.activeItemId() === item.id;
  }

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  trackByNavItem = (_: number, item: { id?: string; label?: string }) =>
    item?.id ?? item?.label ?? _;
}
