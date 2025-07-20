import { Component, OnInit } from '@angular/core';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';

@Component({
  selector: 'app-contact',
  imports: [CarouselComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  protected topCarouselSlides: Slide[] = [];

  constructor(private galleryData: GalleryDataService) {}

  ngOnInit(): void {
    this.topCarouselSlides = this.galleryData.getTopCarouselSlides();
  }
}