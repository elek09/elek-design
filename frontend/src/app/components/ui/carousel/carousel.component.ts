import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  HostListener,
} from '@angular/core';

import { Slide } from '../../../models/slide.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent {
  // --- INPUTS: How we configure the carousel from the outside ---
  readonly slides = input<Slide[]>([]);
  readonly showManualControls = input(true);
  readonly autoPlay = input(false);
  readonly autoPlayInterval = input(3000);
  readonly hasTextOverlay = input(false);
  readonly slideChanged = output<string>();

  // --- INTERNAL STATE ---
  readonly currentSlideIndex = signal(0);
  readonly transformValue = computed(
    () => `translateX(-${this.currentSlideIndex() * 100}%)`,
  );
  private intervalId?: number;

  constructor() {
    // Auto-start autoplay when enabled
    effect(() => {
      if (this.autoPlay()) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    });

    // React to slides changes
    effect(() => {
      const slides = this.slides();
      if (slides.length > 0 && this.currentSlideIndex() >= slides.length) {
        this.currentSlideIndex.set(0);
      }
    });
  }

  // --- EVENT LISTENERS ---
  @HostListener('window:resize')
  onResize(): void {
    // Transform is computed, will auto-update
  }

  // --- PUBLIC METHODS ---
  nextSlide(): void {
    const slides = this.slides();
    if (slides.length === 0) return;
    this.currentSlideIndex.update((idx) => (idx + 1) % slides.length);
    this.emitSlideChanged();
  }

  previousSlide(): void {
    const slides = this.slides();
    if (slides.length === 0) return;
    this.currentSlideIndex.update(
      (idx) => (idx - 1 + slides.length) % slides.length,
    );
    this.emitSlideChanged();
  }

  // Method to be called from a parent component (e.g., side menu)
  public goToById(id: string) {
    const slides = this.slides();
    if (!slides?.length) return;
    const idx = slides.findIndex((s) => s.id === id || s.category === id);
    if (idx >= 0) {
      this.currentSlideIndex.set(idx);
      this.emitSlideChanged();
    }
  }

  private emitSlideChanged(): void {
    const slides = this.slides();
    const currentSlide = slides[this.currentSlideIndex()];
    if (currentSlide) {
      // Emit subcategory id when available so parent menus can stay in sync
      const key = currentSlide.category || currentSlide.id || '';
      this.slideChanged.emit(String(key));
    }
  }

  // --- MOUSE HOVER FOR AUTOPLAY ---
  onMouseEnter(): void {
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    this.startAutoPlay();
  }

  // --- PRIVATE HELPERS ---
  private startAutoPlay(): void {
    this.stopAutoPlay(); // Clear any existing interval
    if (this.autoPlay() && !this.intervalId) {
      this.intervalId = window.setInterval(
        () => this.nextSlide(),
        this.autoPlayInterval(),
      );
    }
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
