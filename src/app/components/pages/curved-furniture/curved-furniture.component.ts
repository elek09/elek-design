import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';

@Component({
  selector: 'app-curved-furniture',
  imports: [CommonModule, CarouselComponent],
  templateUrl: './curved-furniture.component.html',
  styleUrl: './curved-furniture.component.scss'
})
export class CurvedFurnitureComponent implements OnInit {
  protected topCarouselSlides$!: ReturnType<GalleryDataService['getTopCarouselSlides$']>;
  protected curvedFurnitureSlides$!: ReturnType<GalleryDataService['getCurvedFurnitureSlides$']>;

  constructor(private galleryData: GalleryDataService) {}

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryData.getTopCarouselSlides$();
    this.curvedFurnitureSlides$ = this.galleryData.getCurvedFurnitureSlides$();
  }
}