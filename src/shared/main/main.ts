import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Inmueble, InmuebleService } from '../services/inmueble.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.html',
})
export class Main implements OnInit {
  private inmuebleService = inject(InmuebleService);
  private router = inject(Router);

  inmuebles = signal<Inmueble[]>([]);

  ngOnInit() {
    this.loadFeaturedInmuebles();
  }

  loadFeaturedInmuebles() {
    this.inmuebleService.getInmuebles().subscribe({
      next: (data) => {
        // Mostrar solo los primeros 4 inmuebles
        this.inmuebles.set(data.slice(0, 4));
      },
      error: (err) => console.error('Error loading inmuebles', err)
    });
  }

  navigateToInmuebles() {
    this.router.navigate(['/inmueble']);
  }

  navigateToDetail(id: number) {
    this.router.navigate(['/inmueble', id]);
  }
}
