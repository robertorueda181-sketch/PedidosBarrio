import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Servicio, ServicioService } from '../../shared/services/servicio.service';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicios.html',
})
export class ServiciosComponent implements OnInit {
  private servicioService = inject(ServicioService);
  private router = inject(Router);

  servicios = signal<Servicio[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadServicios();
  }

  loadServicios() {
    this.servicioService.getServicios().subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading servicios', err);
        this.loading.set(false);
      }
    });
  }

  navigateToDetail(id: number) {
    this.router.navigate(['/servicio', id]);
  }
}
