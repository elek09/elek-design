import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  OnDestroy,
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
export class CarouselComponent implements OnDestroy {
  // --- INPUT PARAMÉTEREK: Konfigurálás kívülről ---
  readonly slides = input<Slide[]>([]);
  readonly showManualControls = input(true);
  readonly autoPlay = input(false);
  readonly autoPlayInterval = input(3000);
  readonly hasTextOverlay = input(false);
  readonly prioritizeFirstImage = input(false);
  readonly displayMode = input<'responsive' | 'desktop' | 'mobile'>(
    'responsive',
  );
  readonly slideChanged = output<string>();

  // --- BELSŐ ÁLLAPOT ---
  readonly currentSlideIndex = signal(0);
  readonly transformValue = computed(
    () => `translateX(-${this.currentSlideIndex() * 100}%)`,
  );
  private intervalId?: number;
  private touchStartX: number | null = null;
  private touchStartY: number | null = null;

  constructor() {
    // Autoplay automatikus indítása amikor engedélyezve van
    effect(() => {
      if (this.autoPlay()) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    });

    // Slide-ok változására reagálás
    effect(() => {
      const slides = this.slides();
      if (slides.length > 0 && this.currentSlideIndex() >= slides.length) {
        this.currentSlideIndex.set(0);
      }
    });
  }

  // --- ESEMÉNYKEZELŐK ---
  // --- PUBLIKUS METÓDUSOK ---
  nextSlide(): void {
    const slides = this.slides();
    if (slides.length === 0) return;
    this.currentSlideIndex.update((idx) => (idx + 1) % slides.length);
    this.emitSlideChanged();
    this.resetAutoPlayTimer();
  }

  previousSlide(): void {
    const slides = this.slides();
    if (slides.length === 0) return;
    this.currentSlideIndex.update(
      (idx) => (idx - 1 + slides.length) % slides.length,
    );
    this.emitSlideChanged();
    this.resetAutoPlayTimer();
  }

  // Szülő komponensből hívható metódus (pl. oldalsó menü)
  public goToById(id: string) {
    const slides = this.slides();
    if (!slides?.length) return;
    const idx = slides.findIndex(
      (s) => String(s.id) === String(id) || String(s.category) === String(id),
    );
    if (idx >= 0) {
      this.currentSlideIndex.set(idx);
      this.emitSlideChanged();
      this.resetAutoPlayTimer();
    }
  }

  private emitSlideChanged(): void {
    const slides = this.slides();
    const currentSlide = slides[this.currentSlideIndex()];
    if (currentSlide) {
      // Alkategória id kibocsátása, hogy a szülő menük szinkronban maradjanak
      const key = currentSlide.category || currentSlide.id || '';
      this.slideChanged.emit(String(key));
    }
  }

  // --- EGÉR HOVER AUTOPLAY-HEZ ---
  onMouseEnter(): void {
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    this.startAutoPlay();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
    this.touchStartY = event.changedTouches[0]?.clientY ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null || this.touchStartY === null) return;

    const touch = event.changedTouches[0];
    const deltaX = (touch?.clientX ?? 0) - this.touchStartX;
    const deltaY = (touch?.clientY ?? 0) - this.touchStartY;
    this.touchStartX = null;
    this.touchStartY = null;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      this.nextSlide();
    } else {
      this.previousSlide();
    }
  }

  // --- PRIVÁT SEGÉDFÜGGVÉNYEK ---
  private startAutoPlay(): void {
    this.stopAutoPlay(); // Meglévő interval törlése
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

  private resetAutoPlayTimer(): void {
    if (this.autoPlay()) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }
}
