import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallCladdingComponent } from './wall-cladding.component';

describe('WallCladdingComponent', () => {
  let component: WallCladdingComponent;
  let fixture: ComponentFixture<WallCladdingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WallCladdingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WallCladdingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
