import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Inmueble, InmuebleService } from '../../shared/services/inmueble.service';

@Component({
  selector: 'app-inmueble',
  imports: [CommonModule],
  templateUrl: './inmueble.html',
  styleUrl: './inmueble.css',
})
export class InmuebleComponent implements OnInit {
  private inmuebleService = inject(InmuebleService);
  private router = inject(Router);

  filtros = {
    tipo: 'Todos los tipos',
    operacion: 'Todas',
    distrito: 'Todos los distritos',
    precio: 'Sin límite',
  };

  tipos = ['Todos los tipos', 'Departamento', 'Casa', 'Local Comercial'];
  operaciones = ['Todas', 'Alquiler', 'Venta'];
  distritos = ['Todos los distritos', 'San Isidro', 'Miraflores', 'San Miguel'];
  precios = ['Sin límite', 'S/ 1,000', 'S/ 3,000', 'S/ 5,000'];

  inmuebles = signal<Inmueble[]>([]);

  ngOnInit() {
    this.loadInmuebles();
  }

  loadInmuebles() {
    this.inmuebleService.getInmuebles().subscribe({
      next: (data) => {
        this.inmuebles.set(data);
        console.log('Inmuebles loaded:', this.inmuebles());
      },
      error: (err) => console.error('Error loading inmuebles', err)
    });
  }

  filtrarInmuebles(): Inmueble[] {
    return this.inmuebles().filter(inmueble => {
      const cumpleTipo = this.filtros.tipo === 'Todos los tipos' || inmueble.tipo === this.filtros.tipo;
      const cumpleOperacion = this.filtros.operacion === 'Todas' || inmueble.operacion === this.filtros.operacion;
      // Note: API returns 'ubicacion', filter uses 'distrito'. We might need to adjust logic or data.
      // For now, checking if ubicacion includes the distrito string or if it matches exactly if we had strict districts.
      // Since API returns full address in ubicacion, we might check inclusion.
      const cumpleDistrito = this.filtros.distrito === 'Todos los distritos' || inmueble.ubicacion.includes(this.filtros.distrito);

      return cumpleTipo && cumpleOperacion && cumpleDistrito;
    });
  }

  navigateToDetail(id: number) {
    this.router.navigate(['/inmueble', id]);
  }
}