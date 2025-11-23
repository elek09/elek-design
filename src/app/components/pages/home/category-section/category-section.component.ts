import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Category } from '../../../../models/category.model';
import { Slide } from '../../../../models/slide.model';
import { CarouselComponent } from '../../../ui/carousel/carousel.component';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './category-section.component.html',
  styleUrls: ['./category-section.component.scss'],
})
export class CategorySectionComponent {
  @Input() sectionType!: string; // 'eletter' | 'uzletter' | custom
  @Input() categories$!: Observable<Category[]>;
  @Input() slides$!: Observable<Slide[]>;

  @ViewChild('carousel') carousel!: CarouselComponent;
  selectedSubId: string | null = null;

  onMenuClick(key: string) {
    this.selectedSubId = key;
    this.carousel?.goToById(key);
  }

  onSlideChanged(slideId: string) {
    // preserve hash navigation like the original component
    history.replaceState(null, '', `#${slideId}`);
    this.selectedSubId = slideId;
  }

  // Normalize subcategories so template bindings are safe
  normalizeSubcategories(
    subs: any[] | undefined | null,
  ): { id: string; name: string }[] {
    if (!Array.isArray(subs)) return [];
    return subs.map((s: any) => {
      if (typeof s === 'string') {
        return { id: s, name: s };
      }
      const name = s?.name ?? String(s?.id ?? '');
      const id = String(s?.id ?? '').trim();
      return { id, name };
    });
  }
}
