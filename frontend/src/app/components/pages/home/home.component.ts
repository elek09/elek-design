import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Category } from '../../../models/category.model';
import { BootstrapService } from '../../../services/bootstrap.service';
import { map } from 'rxjs/operators';
import { CategorySectionComponent } from './category-section/category-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarouselComponent, CategorySectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly galleryDataService = inject(GalleryDataService);
  private readonly bootstrapService = inject(BootstrapService);

  readonly topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
  readonly eletterSlides$ =
    this.galleryDataService.getSlidesByCategory$('eletter');
  readonly uzletterSlides$ =
    this.galleryDataService.getSlidesByCategory$('uzletter');
  readonly eletterCategories$ = this.bootstrapService
    .getCategories$()
    .pipe(
      map((cats: Category[]) =>
        cats.filter((c) => String(c.type) === 'eletter'),
      ),
    );
  readonly uzletterCategories$ = this.bootstrapService
    .getCategories$()
    .pipe(
      map((cats: Category[]) =>
        cats.filter((c) => String(c.type) === 'uzletter'),
      ),
    );
}
