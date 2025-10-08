// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { ContactComponent } from './components/pages/contact/contact.component';
import { WallCladdingComponent } from './components/pages/wall-cladding/wall-cladding.component';
import { CurvedFurnitureComponent } from './components/pages/curved-furniture/curved-furniture.component';
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminGalleryComponent } from './components/admin/admin-gallery/admin-gallery.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'kapcsolat', component: ContactComponent },
  { path: '3d-falboritas', component: WallCladdingComponent },
  { path: 'ives-butorok', component: CurvedFurnitureComponent },

  // Admin routes
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/gallery',
    component: AdminGalleryComponent,
    canActivate: [authGuard],
  },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // Redirect any other route to the home page
  { path: '**', redirectTo: '' },
];
