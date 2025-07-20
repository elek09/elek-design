import { Component, OnInit } from '@angular/core';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';

@Component({
  selector: 'app-wall-cladding',
  standalone: true,
  imports: [CarouselComponent],
  templateUrl: './wall-cladding.component.html',
  styleUrls: ['./wall-cladding.component.scss']
})
export class WallCladdingComponent implements OnInit {
  protected topCarouselSlides: Slide[] = [];
  protected wallCladdingSlides: Slide[] = [];

  constructor(private galleryData: GalleryDataService) {}

  ngOnInit(): void {
    this.topCarouselSlides = this.galleryData.getTopCarouselSlides();
    this.wallCladdingSlides = this.galleryData.getWallCladdingSlides();
  }
}