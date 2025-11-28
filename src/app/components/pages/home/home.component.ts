import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Slide } from '../../../models/slide.model';
import { Observable, combineLatest, firstValueFrom, take } from 'rxjs';
import { Category } from '../../../models/category.model';
import { BootstrapService } from '../../../services/bootstrap.service';
import { map } from 'rxjs/operators';
import { CategorySectionComponent } from './category-section/category-section.component';
import { HeaderService } from '../../../services/header.service';
import { LoadingOverlayComponent } from '../../shared/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CarouselComponent,
    CategorySectionComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  @ViewChild('eletterCarousel') eletterCarousel!: CarouselComponent;
  @ViewChild('uzletterCarousel') uzletterCarousel!: CarouselComponent;

  private readonly galleryDataService = inject(GalleryDataService);
  private readonly bootstrapService = inject(BootstrapService);

  topCarouselSlides$!: Observable<Slide[]>;
  eletterSlides$!: Observable<Slide[]>;
  uzletterSlides$!: Observable<Slide[]>;

  eletterCategories$!: Observable<Category[]>;
  uzletterCategories$!: Observable<Category[]>;

  // Page loading state: show spinner until all slider images are preloaded
  loading = true;

  // Header logo for the loader
  headerLogoUrl$!: Observable<string>;
  private readonly headerService = inject(HeaderService);

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
    this.eletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('eletter');
    this.uzletterSlides$ =
      this.galleryDataService.getSlidesByCategory$('uzletter');

    // Use backend categories as-is; filter by section type
    this.eletterCategories$ = this.bootstrapService
      .getCategories$()
      .pipe(map((cats: Category[]) => cats.filter((c) => String(c.type) === 'eletter')));
    this.uzletterCategories$ = this.bootstrapService
      .getCategories$()
      .pipe(map((cats: Category[]) => cats.filter((c) => String(c.type) === 'uzletter')));

    // Wait for the first emission of all slide streams, then preload images
    void this.whenSlidesReadyAndPreloaded();

    // Get header logo for overlay
    this.headerLogoUrl$ = this.headerService
      .getHeaderConfig()
      .pipe(map((cfg) => cfg.logoUrl));
  }

  private async whenSlidesReadyAndPreloaded() {
    try {
      const [top, el, uz] = await firstValueFrom(
        combineLatest([
          this.topCarouselSlides$,
          this.eletterSlides$,
          this.uzletterSlides$,
        ]).pipe(take(1)),
      );

      const urls = this.unique([
        ...this.toUrls(top),
        ...this.toUrls(el),
        ...this.toUrls(uz),
      ]);

      await this.preloadImages(urls);
    } catch {
      // On any failure, don't block the UI
    } finally {
      // Preload done: hide overlay and show content immediately
      this.loading = false;
    }
  }

  private toUrls(slides: Slide[] | null | undefined): string[] {
    return (slides || [])
      .map((s) => s?.imageUrl)
      .filter((u): u is string => !!u);
  }

  private unique(arr: string[]): string[] {
    return Array.from(new Set(arr));
  }

  private preloadImages(urls: string[]): Promise<void> {
    if (!urls.length) return Promise.resolve();
    return new Promise((resolve) => {
      let remaining = urls.length;

      const done = () => {
        remaining--;
        if (remaining <= 0) resolve();
      };

      urls.forEach((url) => {
        const img = new Image();
        img.onload = done;
        img.onerror = done; // treat errors as done to avoid blocking forever
        img.src = url;
      });
    });
  }
}
