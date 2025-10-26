import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Slide } from '../../../models/slide.model';
import { Observable } from 'rxjs';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { map } from 'rxjs/operators';
import { CategorySectionComponent } from './category-section/category-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarouselComponent, CategorySectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  @ViewChild('eletterCarousel') eletterCarousel!: CarouselComponent;
  @ViewChild('uzletterCarousel') uzletterCarousel!: CarouselComponent;

  private readonly galleryDataService = inject(GalleryDataService);
  private readonly categoryService = inject(CategoryService);

  topCarouselSlides$!: Observable<Slide[]>;
  eletterSlides$!: Observable<Slide[]>;
  uzletterSlides$!: Observable<Slide[]>;

  eletterCategories$!: Observable<Category[]>;
  uzletterCategories$!: Observable<Category[]>;

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
    this.eletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('eletter');
    this.uzletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('uzletter');

    const categories$ = this.categoryService.getCategories();
    this.eletterCategories$ = categories$.pipe(
      map((categories) => categories.filter((c) => c.type === 'eletter'))
    );
    this.uzletterCategories$ = categories$.pipe(
      map((categories) => categories.filter((c) => c.type === 'uzletter'))
    );
  }
}
