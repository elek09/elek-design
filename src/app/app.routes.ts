// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { ContactComponent } from './components/pages/contact/contact.component';
import { WallCladdingComponent } from './components/pages/wall-cladding/wall-cladding.component';
import { CurvedFurnitureComponent } from './components/pages/curved-furniture/curved-furniture.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'kapcsolat', component: ContactComponent },
  { path: '3d-falboritas', component: WallCladdingComponent },
  { path: 'ives-butorok', component: CurvedFurnitureComponent },
  
  // Redirect any other route to the home page
  { path: '**', redirectTo: '' }
];