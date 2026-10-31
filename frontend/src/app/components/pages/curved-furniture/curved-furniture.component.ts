import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { GalleryMosaicComponent } from '../../ui/gallery-mosaic/gallery-mosaic.component';

@Component({
  selector: 'app-curved-furniture',
  standalone: true,
  imports: [CommonModule, GalleryMosaicComponent],
  templateUrl: './curved-furniture.component.html',
  styleUrl: './curved-furniture.component.scss',
})
export class CurvedFurnitureComponent {
  private readonly galleryDataService = inject(GalleryDataService);

  protected readonly curvedFurnitureSlides$ =
    this.galleryDataService.getSlidesByCategory$('ives-butorok');
}
