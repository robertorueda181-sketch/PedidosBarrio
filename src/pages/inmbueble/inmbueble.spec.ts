import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inmbueble } from './inmbueble';

describe('Inmbueble', () => {
  let component: Inmbueble;
  let fixture: ComponentFixture<Inmbueble>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inmbueble]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inmbueble);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
