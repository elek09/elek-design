import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurvedFurnitureComponent } from './curved-furniture.component';

describe('CurvedFurnitureComponent', () => {
  let component: CurvedFurnitureComponent;
  let fixture: ComponentFixture<CurvedFurnitureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurvedFurnitureComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurvedFurnitureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
