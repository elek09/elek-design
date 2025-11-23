// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { ContactComponent } from './components/pages/contact/contact.component';
import { WallCladdingComponent } from './components/pages/wall-cladding/wall-cladding.component';
import { CurvedFurnitureComponent } from './components/pages/curved-furniture/curved-furniture.component';
import { WebshopComponent } from './components/pages/webshop/webshop.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  // Hungarian section routes now have dedicated paths
  { path: 'eletter', component: HomeComponent },
  { path: 'uzletter', component: HomeComponent },
  { path: 'kapcsolat', component: ContactComponent },
  { path: '3d-falboritas', component: WallCladdingComponent },
  { path: 'ives-butorok', component: CurvedFurnitureComponent },
  { path: 'webshop', component: WebshopComponent },

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
