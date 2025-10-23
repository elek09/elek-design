import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-wall-cladding',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './wall-cladding.component.html',
  styleUrls: ['./wall-cladding.component.scss'],
})
export class WallCladdingComponent implements OnInit {
  private readonly galleryDataService = inject(GalleryDataService);

  protected topCarouselSlides$!: Observable<Slide[]>;
  protected wallCladdingSlides$!: Observable<Slide[]>;

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
    this.wallCladdingSlides$ =
      this.galleryDataService.getSlidesByCategory$('wall-cladding');
  }
}
