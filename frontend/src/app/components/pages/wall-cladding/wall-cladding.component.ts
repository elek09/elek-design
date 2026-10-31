import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { GalleryMosaicComponent } from '../../ui/gallery-mosaic/gallery-mosaic.component';

@Component({
  selector: 'app-wall-cladding',
  standalone: true,
  imports: [CommonModule, GalleryMosaicComponent],
  templateUrl: './wall-cladding.component.html',
  styleUrls: ['./wall-cladding.component.scss'],
})
export class WallCladdingComponent {
  private readonly galleryDataService = inject(GalleryDataService);

  protected readonly wallCladdingSlides$ =
    this.galleryDataService.getSlidesByCategory$('3d-falboritas');
}
