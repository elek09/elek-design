import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { GalleryDataService } from './gallery-data.service';
import { API_BASE_URL, GALLERY_API_BASE_URL } from '../app.tokens';

describe('GalleryDataService', () => {
  let service: GalleryDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        { provide: API_BASE_URL, useValue: 'http://127.0.0.1:8000' },
        {
          provide: GALLERY_API_BASE_URL,
          useValue: 'http://127.0.0.1:8000/api/v1/gallery',
        },
      ],
    });
    service = TestBed.inject(GalleryDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
