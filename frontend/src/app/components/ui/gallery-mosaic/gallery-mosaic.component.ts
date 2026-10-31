import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import {
  GalleryLightboxComponent,
  GalleryLightboxGroup,
} from '../gallery-lightbox/gallery-lightbox.component';

@Component({
  selector: 'app-gallery-mosaic',
  standalone: true,
  imports: [CommonModule, GalleryLightboxComponent],
  templateUrl: './gallery-mosaic.component.html',
  styleUrl: './gallery-mosaic.component.scss',
})
export class GalleryMosaicComponent {
  @Input({ required: true }) slides: Slide[] = [];
  @Input() groupName = 'Galéria';
  @Input() groupSlug = 'gallery';

  lightboxOpen = false;

  get group(): GalleryLightboxGroup {
    return {
      slug: this.groupSlug,
      name: this.groupName,
      slides: this.slides,
    };
  }

  hasDescription(slide: Slide): boolean {
    return !!slide.description && !slide.description.startsWith('Automatikus leírás:');
  }

  openLightbox(): void {
    if (this.slides.length) this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
