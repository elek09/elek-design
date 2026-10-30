import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Category } from '../../../../models/category.model';
import { Slide } from '../../../../models/slide.model';
import {
  GalleryLightboxComponent,
  GalleryLightboxGroup,
} from '../../../ui/gallery-lightbox/gallery-lightbox.component';
import { normalizeSubcategories } from '../../../../utils/category.utils';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, GalleryLightboxComponent],
  templateUrl: './category-section.component.html',
  styleUrls: ['./category-section.component.scss'],
})
export class CategorySectionComponent {
  @Input({ required: true }) sectionType!: string;
  @Input({ required: true }) categories$!: Observable<Category[]>;
  @Input({ required: true }) slides$!: Observable<Slide[]>;

  lightboxOpen = false;
  lightboxGroups: GalleryLightboxGroup[] = [];
  activeGroupSlug = '';

  openLightbox(groups: GalleryLightboxGroup[], slug: string): void {
    this.lightboxGroups = groups;
    this.activeGroupSlug = slug;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  buildGroups(category: Category, slides: Slide[]): GalleryLightboxGroup[] {
    const subcategories = normalizeSubcategories(category.subcategories);
    if (!subcategories.length) {
      return slides.length
        ? [{ slug: category.type, name: category.name, slides }]
        : [];
    }

    return subcategories
      .map((sub) => ({
        slug: sub.slug,
        name: sub.name,
        slides: slides.filter((slide) => slide.category === sub.slug),
      }))
      .filter((group) => group.slides.length > 0);
  }
}
