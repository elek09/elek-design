import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Slide } from '../../../models/slide.model';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { CarouselComponent } from '../../ui/carousel/carousel.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly galleryDataService = inject(GalleryDataService);

  protected topCarouselSlides$!: Observable<Slide[]>;

  ngOnInit(): void {
    this.topCarouselSlides$ = this.galleryDataService.getFeaturedSlides$();
  }
}
