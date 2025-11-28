import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderService } from '../../../services/header.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private readonly headerService = inject(HeaderService);

  readonly isMenuOpen = signal(false);
  readonly headerConfig = this.headerService.headerConfig;

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  // TrackBy for header items to avoid unnecessary DOM updates
  trackByNavItem = (_: number, item: { id?: string; label?: string }) =>
    item?.id ?? item?.label ?? _;
}
