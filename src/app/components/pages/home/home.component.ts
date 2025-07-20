import { Component, ViewChild, OnInit } from '@angular/core';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service'; // Import the service
import { CarouselComponent } from '../../ui/carousel/carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  @ViewChild('eletterCarousel') eletterCarousel!: CarouselComponent;
  @ViewChild('uzletterCarousel') uzletterCarousel!: CarouselComponent;

  // Declare empty arrays
  topCarouselSlides: Slide[] = [];
  eletterSlides: Slide[] = [];
  uzletterSlides: Slide[] = [];

  // Inject the service in the constructor
  constructor(private galleryData: GalleryDataService) {}

  ngOnInit(): void {
    this.topCarouselSlides = this.galleryData.getTopCarouselSlides();
    this.eletterSlides = this.galleryData.getEletterSlides();
    this.uzletterSlides = this.galleryData.getUzletterSlides();
  }

  onMenuClick(carousel: 'eletter' | 'uzletter', slideId: string) {
    if (carousel === 'eletter') {
      this.eletterCarousel.goToSlideById(slideId);
    } else {
      this.uzletterCarousel.goToSlideById(slideId);
    }
    history.replaceState(null, '', `#${slideId}`);
  }

  onSlideChanged(slideId: string) {
    history.replaceState(null, '', `#${slideId}`);
  }
}