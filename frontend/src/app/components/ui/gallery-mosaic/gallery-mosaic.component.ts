import { Component, Input, OnChanges } from '@angular/core';
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
export class GalleryMosaicComponent implements OnChanges {
  @Input({ required: true }) slides: Slide[] = [];
  @Input() groupName = 'Galéria';
  @Input() groupSlug = 'gallery';
  @Input() showCardTitle = true;

  lightboxOpen = false;
  initialIndex = 0;

  private readonly group: GalleryLightboxGroup = {
    slug: this.groupSlug,
    name: this.groupName,
    slides: this.slides,
  };
  readonly groups: GalleryLightboxGroup[] = [this.group];

  ngOnChanges(): void {
    this.group.slug = this.groupSlug;
    this.group.name = this.groupName;
    this.group.slides = this.slides;
  }

  hasDescription(slide: Slide): boolean {
    return !!slide.description && !slide.description.startsWith('Automatikus leírás:');
  }

  openLightbox(index: number): void {
    if (this.slides.length) {
      this.initialIndex = index;
      this.lightboxOpen = true;
    }
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
