import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Slide } from '../../../models/slide.model';
import { combineLatest, firstValueFrom, take } from 'rxjs';
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
  private readonly galleryDataService = inject(GalleryDataService);
  private readonly bootstrapService = inject(BootstrapService);
  private readonly headerService = inject(HeaderService);

  readonly topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
  readonly eletterSlides$ =
    this.galleryDataService.getSlidesByCategory$('eletter');
  readonly uzletterSlides$ =
    this.galleryDataService.getSlidesByCategory$('uzletter');

  readonly eletterCategories$ = this.bootstrapService
    .getCategories$()
    .pipe(
      map((cats: Category[]) =>
        cats.filter((c) => String(c.type) === 'eletter'),
      ),
    );
  readonly uzletterCategories$ = this.bootstrapService
    .getCategories$()
    .pipe(
      map((cats: Category[]) =>
        cats.filter((c) => String(c.type) === 'uzletter'),
      ),
    );

  loading = true;
  readonly headerLogoUrl = this.headerService.headerConfig().logoUrl;

  ngOnInit(): void {
    void this.whenSlidesReadyAndPreloaded();
  }

  private async whenSlidesReadyAndPreloaded() {
    try {
      const [top, eletter, uzletter] = await firstValueFrom(
        combineLatest([
          this.topCarouselSlides$,
          this.eletterSlides$,
          this.uzletterSlides$,
        ]).pipe(take(1)),
      );

      const urls = this.unique([
        ...this.toUrls(top),
        ...this.toUrls(eletter),
        ...this.toUrls(uzletter),
      ]);

      await this.preloadImages(urls);
    } catch {
      // Hiba esetén ne blokkoljuk a UI-t
    } finally {
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
        img.onerror = done;
        img.src = url;
      });
    });
  }
}
