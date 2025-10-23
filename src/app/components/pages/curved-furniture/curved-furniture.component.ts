import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-curved-furniture',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './curved-furniture.component.html',
  styleUrl: './curved-furniture.component.scss',
})
export class CurvedFurnitureComponent implements OnInit {
  private readonly galleryDataService = inject(GalleryDataService);

  protected topCarouselSlides$!: Observable<Slide[]>;
  protected curvedFurnitureSlides$!: Observable<Slide[]>;

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
    this.curvedFurnitureSlides$ =
      this.galleryDataService.getSlidesByCategory$('curved-furniture');
  }
}
