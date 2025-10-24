import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Slide } from '../../../models/slide.model';
import { Observable } from 'rxjs';
import {
  eletterCategories,
  uzletterCategories,
} from '../../../models/gallery-categories';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  @ViewChild('eletterCarousel') eletterCarousel!: CarouselComponent;
  @ViewChild('uzletterCarousel') uzletterCarousel!: CarouselComponent;

  private readonly galleryDataService = inject(GalleryDataService);

  topCarouselSlides$!: Observable<Slide[]>;
  eletterSlides$!: Observable<Slide[]>;
  uzletterSlides$!: Observable<Slide[]>;

  public readonly eletterCategories = eletterCategories;
  public readonly uzletterCategories = uzletterCategories;

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
    this.eletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('eletter');
    this.uzletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('uzletter');
  }

  onMenuClick(section: 'eletter' | 'uzletter', key: string) {
    const target =
      section === 'eletter' ? this.eletterCarousel : this.uzletterCarousel;
    target?.goToById(key);
  }

  onSlideChanged(slideId: string) {
    history.replaceState(null, '', `#${slideId}`);
  }
}
