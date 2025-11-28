import { Component, inject } from '@angular/core';
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
export class CurvedFurnitureComponent {
  private readonly galleryDataService = inject(GalleryDataService);

  protected readonly topCarouselSlides$ =
    this.galleryDataService.getFeaturedSlides$();
  protected readonly curvedFurnitureSlides$ =
    this.galleryDataService.getSlidesByCategory$('ives-butorok');
}
