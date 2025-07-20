import { Injectable } from '@angular/core';
import { Slide } from '../models/slide.model';

@Injectable({
  providedIn: 'root'
})
export class GalleryDataService {

  getTopCarouselSlides(): Slide[] {
    return [
      { imageUrl: 'assets/images/fokepek/nappali.jpg', title: 'Nappali' },
      { imageUrl: 'assets/images/fokepek/konyha.jpg', title: 'Konyha' },
      { imageUrl: 'assets/images/fokepek/3Dfal.jpg', title: '3D fal' },
      { imageUrl: 'assets/images/fokepek/gardrob.jpg', title: 'Gardrób' },
      { imageUrl: 'assets/images/fokepek/lepcso.jpg', title: 'Lépcső' },
      { imageUrl: 'assets/images/fokepek/uzlet.jpg', title: 'Üzlet' }
    ];
  }

  getEletterSlides(): Slide[] {
    return [
      { id: 'konyha1', imageUrl: 'assets/images/kepek/konyha(1).jpg' },
      { id: 'konyha2', imageUrl: 'assets/images/kepek/konyha(2).jpg' },
      { id: 'konyha3', imageUrl: 'assets/images/kepek/konyha(3).jpg' },
      { id: 'nappali1', imageUrl: 'assets/images/kepek/nappali(1).jpg' },
      { id: 'nappali2', imageUrl: 'assets/images/kepek/nappali(2).jpg' },
      { id: 'nappali3', imageUrl: 'assets/images/kepek/nappali(3).jpg' },
      { id: 'furdoszoba1', imageUrl: 'assets/images/kepek/furdoszoba(1).jpg' },
      { id: 'haloszoba1', imageUrl: 'assets/images/kepek/haloszoba(1).jpg' },
      { id: 'gardrob1', imageUrl: 'assets/images/kepek/gardrob(1).jpg' },
      { id: 'lepcso1', imageUrl: 'assets/images/kepek/lepcso(1).jpg' }
    ];
  }

  getUzletterSlides(): Slide[] {
    return [
      { id: 'iroda1', imageUrl: 'assets/images/kepek/iroda.jpg' },
      { id: 'iroda2', imageUrl: 'assets/images/kepek/iroda(2).jpg' },
      { id: 'uzlet1', imageUrl: 'assets/images/kepek/uzlet.jpg' },
      { id: 'kiallitasibutorok1', imageUrl: 'assets/images/kepek/kiallitasibutorok.jpg' }
    ];
  }

  getWallCladdingSlides(): Slide[] {
    return [
        { id: '3Dfalborítás1', imageUrl: 'assets/images/kepek/3Dfal.jpg'},
        { id: '3Dfalborítás2', imageUrl: 'assets/images/kepek/3d(1).jpg'}
    ];
  }

  getCurvedFurnitureSlides(): Slide[] {
    return [
      { id: 'curvedFurniture1', imageUrl: 'assets/images/kepek/ivesbutorok(1).jpg' },
      { id: 'curvedFurniture2', imageUrl: 'assets/images/kepek/ivesbutorok(2).jpg' },
    ];
  }
}