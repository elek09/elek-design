import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  EventEmitter,
  SimpleChanges,
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
  @Input() initialIndex = 0;
  @Output() closed = new EventEmitter<void>();

  selectedGroupSlug = '';
  currentIndex = 0;
  private touchStartX = 0;
  private initialized = false;

  constructor(private readonly router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.groups.length) return;

    const isOpening = !this.initialized;
    const groupChanged = changes['activeGroupSlug'] !== undefined;
    const indexChanged = changes['initialIndex'] !== undefined;

    if (isOpening || groupChanged) {
      const active = this.groups.find(
        (group) => group.slug === this.activeGroupSlug,
      );
      this.selectedGroupSlug = active?.slug ?? this.groups[0].slug;
    }

    if (isOpening || groupChanged || indexChanged) {
      this.currentIndex = this.initialIndex;
    }

    if (isOpening) document.body.style.overflow = 'hidden';
    this.initialized = true;
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

  get trackTransform(): string {
    return `translateX(-${this.currentIndex * 100}%)`;
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

  // Csak a tiszta swipe logikát tartjuk meg a lapozáshoz
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].screenX - this.touchStartX;
    if (Math.abs(deltaX) > 50 && (this.activeGroup?.slides.length ?? 0) > 1) {
      deltaX < 0 ? this.next() : this.previous();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.previous();
  }
}
