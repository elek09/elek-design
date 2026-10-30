import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Slide } from '../../../models/slide.model';

export interface GalleryLightboxGroup {
  slug: string;
  name: string;
  slides: Slide[];
}

@Component({
  selector: 'app-gallery-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-lightbox.component.html',
  styleUrls: ['./gallery-lightbox.component.scss'],
})
export class GalleryLightboxComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) groups: GalleryLightboxGroup[] = [];
  @Input() activeGroupSlug = '';
  @Output() closed = new EventEmitter<void>();

  selectedGroupSlug = '';
  currentIndex = 0;
  private touchStartX: number | null = null;

  constructor(private readonly router: Router) {}

  ngOnChanges(): void {
    if (!this.groups.length) return;
    const active = this.groups.find(
      (group) => group.slug === this.activeGroupSlug,
    );
    this.selectedGroupSlug = active?.slug ?? this.groups[0].slug;
    this.currentIndex = 0;
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  get activeGroup(): GalleryLightboxGroup | undefined {
    return this.groups.find((group) => group.slug === this.selectedGroupSlug);
  }

  get currentSlide(): Slide | undefined {
    return this.activeGroup?.slides[this.currentIndex];
  }

  selectGroup(slug: string): void {
    this.selectedGroupSlug = slug;
    this.currentIndex = 0;
  }

  next(): void {
    const count = this.activeGroup?.slides.length ?? 0;
    if (count) this.currentIndex = (this.currentIndex + 1) % count;
  }

  previous(): void {
    const count = this.activeGroup?.slides.length ?? 0;
    if (count) this.currentIndex = (this.currentIndex - 1 + count) % count;
  }

  close(): void {
    this.closed.emit();
  }

  goToQuote(): void {
    this.close();
    void this.router.navigate(['/webshop']);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.screenX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const deltaX = (event.changedTouches[0]?.screenX ?? 0) - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        this.next();
      } else {
        this.previous();
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.previous();
  }
}
