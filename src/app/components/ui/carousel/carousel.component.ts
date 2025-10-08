import { Component, Input, OnInit, OnDestroy, HostListener, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';

import { Slide } from '../../../models/slide.model';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent implements OnInit, OnDestroy, OnChanges{
  // --- INPUTS: How we configure the carousel from the outside ---
  @Input() slides: Slide[] = [];
  @Input() showManualControls: boolean = true;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 3000;
  @Input() hasTextOverlay: boolean = false;
  @Output() slideChanged = new EventEmitter<string>();

  // --- INTERNAL STATE ---
  currentSlideIndex = 0;
  transformValue: string = 'translateX(0px)';
  private intervalId?: number;

  // --- LIFECYCLE HOOKS ---
  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If slides data changes, recalculate the transform
    if (changes['slides']) {
      this.updateTransform();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  // --- EVENT LISTENERS ---
  @HostListener('window:resize')
  onResize(): void {
    // Recalculate transform on window resize to keep it responsive
    this.updateTransform();
  }

  // --- PUBLIC METHODS ---
  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    this.updateTransform();
    this.emitSlideChanged();
  }

  previousSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.updateTransform();
    this.emitSlideChanged();
  }

  // Method to be called from a parent component (e.g., side menu)
  public goToById(id: string) {
    if (!this.slides?.length) return;
    const idx = this.slides.findIndex(s =>
      s.id === id ||
      (s.title && this.slugify(s.title) === id)
    );
    if (idx >= 0) {
      this.currentSlideIndex = idx;
      this.updateTransform();
      this.emitSlideChanged();
    }
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }
  
  private emitSlideChanged(): void {
    const currentSlide = this.slides[this.currentSlideIndex];
    if (currentSlide && currentSlide.id) {
      this.slideChanged.emit(currentSlide.id);
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
  private updateTransform(): void {
    this.transformValue = `translateX(-${this.currentSlideIndex * 100}%)`;
  }

  private startAutoPlay(): void {
    if (this.autoPlay && !this.intervalId) {
      this.intervalId = window.setInterval(() => this.nextSlide(), this.autoPlayInterval);
    }
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
