import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InmuebleDetalle } from './inmueble-detalle';

describe('InmuebleDetalle', () => {
  let component: InmuebleDetalle;
  let fixture: ComponentFixture<InmuebleDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InmuebleDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InmuebleDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
