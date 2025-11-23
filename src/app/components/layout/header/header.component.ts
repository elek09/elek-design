import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { HeaderConfig } from '../../../models/header.model';
import { HeaderService } from '../../../services/header.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private headerService = inject(HeaderService);

  isMenuOpen = false;
  headerConfig$!: Observable<HeaderConfig>;
  constructor() {
    this.headerConfig$ = this.headerService.getHeaderConfig();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // TrackBy for header items to avoid unnecessary DOM updates
  trackByNavItem = (_: number, item: { id?: string; label?: string }) =>
    item?.id ?? item?.label ?? _;
}
