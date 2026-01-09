import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Inmueble, InmuebleService } from '../services/inmueble.service';
import { Negocio, NegocioService } from '../services/negocio.service';
import { Servicio, ServicioService } from '../services/servicio.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.html',
})
export class Main implements OnInit {
  private inmuebleService = inject(InmuebleService);
  private negocioService = inject(NegocioService);
  private servicioService = inject(ServicioService);
  private router = inject(Router);

  inmuebles = signal<Inmueble[]>([]);
  negocios = signal<Negocio[]>([]);
  servicios = signal<Servicio[]>([]);

  ngOnInit() {
    this.loadFeaturedInmuebles();
    this.loadNegocios();
    this.loadServicios();
  }

  loadFeaturedInmuebles() {
    this.inmuebleService.getInmuebles().subscribe({
      next: (data) => {
        // Mostrar solo los primeros 4 inmuebles
        this.inmuebles.set(data.slice(0, 4));
        console.log(data);
      },
      error: (err) => console.error('Error loading inmuebles', err)
    });
  }

  loadNegocios() {
    this.negocioService.getNegocios().subscribe({
      next: (data) => {
        this.negocios.set(data);
        console.log(data);

      },
      error: (err) => console.error('Error loading negocios', err)
    });
  }

  loadServicios() {
    this.servicioService.getServicios().subscribe({
      next: (data) => {
        // Mostrar solo los primeros 4 servicios
        this.servicios.set(data.slice(0, 4));
      },
      error: (err) => console.error('Error loading servicios', err)
    });
  }

  navigateToInmuebles() {
    this.router.navigate(['/inmueble']);
  }

  navigateToNegocios() {
    this.router.navigate(['/negocios']);
  }

  navigateToServicios() {
    this.router.navigate(['/servicios']);
  }

  navigateToInmuebleDetail(id: number) {
    this.router.navigate(['/inmueble', id]);
  }

  navigateToServicioDetail(id: number) {
    this.router.navigate(['/servicio', id]);
  }

  goToNegocio(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
