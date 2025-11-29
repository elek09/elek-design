import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Category } from '../../../../models/category.model';
import { Slide } from '../../../../models/slide.model';
import { CarouselComponent } from '../../../ui/carousel/carousel.component';
import { normalizeSubcategories } from '../../../../utils/category.utils';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './category-section.component.html',
  styleUrls: ['./category-section.component.scss'],
})
export class CategorySectionComponent {
  @Input({ required: true }) sectionType!: string;
  @Input({ required: true }) categories$!: Observable<Category[]>;
  @Input({ required: true }) slides$!: Observable<Slide[]>;

  @ViewChildren('carousel') carousels!: QueryList<CarouselComponent>;
  selectedSubId: string | null = null;

  onMenuClick(key: string) {
    this.selectedSubId = key;
    // Megkeressük azt a carousel-t, amelyik tartalmazza ezt az alkategóriát
    const carouselsArray = this.carousels?.toArray() ?? [];
    for (const carousel of carouselsArray) {
      const slides = carousel.slides();
      // Összehasonlítás id vagy category (slug) alapján
      const found = slides.some(
        (s) =>
          String(s.id) === String(key) || String(s.category) === String(key),
      );
      if (found) {
        carousel.goToById(key);
        break;
      }
    }
  }

  onSlideChanged(slideId: string) {
    history.replaceState(null, '', `#${slideId}`);
    this.selectedSubId = slideId;
  }

  // Közös segédfüggvény használata
  readonly normalizeSubcategories = normalizeSubcategories;
}
