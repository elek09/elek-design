import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  // Hungarian section routes now have dedicated paths
  {
    path: 'eletter',
    component: HomeComponent,
  },
  {
    path: 'uzletter',
    component: HomeComponent,
  },
  {
    path: 'kapcsolat',
    loadComponent: () =>
      import('./components/pages/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
  },
  {
    path: '3d-falboritas',
    loadComponent: () =>
      import('./components/pages/wall-cladding/wall-cladding.component').then(
        (m) => m.WallCladdingComponent,
      ),
  },
  {
    path: 'ives-butorok',
    loadComponent: () =>
      import('./components/pages/curved-furniture/curved-furniture.component').then(
        (m) => m.CurvedFurnitureComponent,
      ),
  },
  {
    path: 'webshop',
    loadComponent: () =>
      import('./components/pages/webshop/webshop.component').then(
        (m) => m.WebshopComponent,
      ),
  },

  // Admin routes
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./components/admin/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import(
        './components/admin/admin-dashboard/admin-dashboard.component'
      ).then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/gallery',
    loadComponent: () =>
      import('./components/admin/admin-gallery/admin-gallery.component').then(
        (m) => m.AdminGalleryComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin/category-manager',
    loadComponent: () =>
      import(
        './components/admin/category-manager/category-manager.component'
      ).then((m) => m.CategoryManagerComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import(
        './components/admin/orders/orders-list/orders-list.component'
      ).then((m) => m.OrdersListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/orders/:id',
    loadComponent: () =>
      import(
        './components/admin/orders/order-detail/order-detail.component'
      ).then((m) => m.OrderDetailComponent),
    canActivate: [authGuard],
  },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // Redirect any other route to the home page
  { path: '**', redirectTo: '' },
];
