import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavItem } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './admin-nav.component.html',
  styleUrls: ['./admin-nav.component.scss'],
})
export class AdminNavComponent {
  readonly navItems = signal<NavItem[]>([
    {
      route: '/admin/dashboard',
      icon: 'dashboard',
      label: 'Vezérlőpult',
      exact: true,
    },
    { route: '/admin/gallery', icon: 'photo_library', label: 'Galéria' },
    { route: '/admin/category-manager', icon: 'category', label: 'Kategóriák' },
    { route: '/admin/orders', icon: 'receipt_long', label: 'Árajánlatkérések' },
  ]);
}
