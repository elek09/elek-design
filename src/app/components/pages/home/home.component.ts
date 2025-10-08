import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service'; // Import the service
import { CarouselComponent } from '../../ui/carousel/carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  @ViewChild('eletterCarousel') eletterCarousel!: CarouselComponent;
  @ViewChild('uzletterCarousel') uzletterCarousel!: CarouselComponent;

  // Declare empty arrays
  topCarouselSlides$!: ReturnType<GalleryDataService['getTopCarouselSlides$']>;
  eletterSlides$!: ReturnType<GalleryDataService['getEletterSlides$']>;
  uzletterSlides$!: ReturnType<GalleryDataService['getUzletterSlides$']>;

  // Inject the service in the constructor
  constructor(private galleryData: GalleryDataService) {}

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryData.getTopCarouselSlides$();
    this.eletterSlides$ = this.galleryData.getEletterSlides$();
    this.uzletterSlides$ = this.galleryData.getUzletterSlides$();
  }

  onMenuClick(section: 'eletter' | 'uzletter', key: string) {
    const target = section === 'eletter' ? this.eletterCarousel : this.uzletterCarousel;
    target?.goToById(key);
  }

  onSlideChanged(slideId: string) {
    history.replaceState(null, '', `#${slideId}`);
  }
}