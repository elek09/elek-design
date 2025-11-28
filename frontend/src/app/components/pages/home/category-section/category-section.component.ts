import { Component, Input, ViewChild } from '@angular/core';
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

  @ViewChild('carousel') carousel!: CarouselComponent;
  selectedSubId: string | null = null;

  onMenuClick(key: string) {
    this.selectedSubId = key;
    this.carousel?.goToById(key);
  }

  onSlideChanged(slideId: string) {
    history.replaceState(null, '', `#${slideId}`);
    this.selectedSubId = slideId;
  }

  // Use shared utility function
  readonly normalizeSubcategories = normalizeSubcategories;
}
