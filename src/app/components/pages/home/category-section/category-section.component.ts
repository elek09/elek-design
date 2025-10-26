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

  onMenuClick(key: string) {
    this.carousel?.goToById(key);
  }

  onSlideChanged(slideId: string) {
    // preserve hash navigation like the original component
    history.replaceState(null, '', `#${slideId}`);
  }

  // Normalize subcategories so template bindings are safe
  normalizeSubcategories(
    subs: Array<any> | undefined | null
  ): Array<{ id: string; name: string }> {
    if (!Array.isArray(subs)) return [];
    return subs.map((s: any) => {
      if (typeof s === 'string') {
        return { id: this.slugify(s), name: s };
      }
      const name = s?.name ?? String(s?.id ?? '');
      const rawId = s?.id ?? name;
      const id = this.slugify(String(rawId));
      return { id, name };
    });
  }

  private slugify(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
