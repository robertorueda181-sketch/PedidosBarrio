import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stacion64 } from './stacion64';

describe('Stacion64', () => {
  let component: Stacion64;
  let fixture: ComponentFixture<Stacion64>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stacion64]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stacion64);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
