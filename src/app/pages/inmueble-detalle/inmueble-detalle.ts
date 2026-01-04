import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Inmueble, InmuebleService } from '../../../shared/services/inmueble.service';
import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-inmueble-detalle',
  standalone: true,
  imports: [CommonModule, GalleriaModule, TagModule, ButtonModule],
  templateUrl: './inmueble-detalle.html',
  styleUrl: './inmueble-detalle.css'
})
export class InmuebleDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private inmuebleService = inject(InmuebleService);

  inmueble = signal<Inmueble | null>(null);
  images = signal<any[]>([]);

  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 5
    },
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadInmueble(id);
      }
    });
  }

  loadInmueble(id: number) {
    this.inmuebleService.getInmuebleById(id).subscribe({
      next: (data) => {
        this.inmueble.set(data);
        // Mocking multiple images for the galleria since API returns one
        if (data.urlImagen) {
          this.images.set([
            { itemImageSrc: data.urlImagen, thumbnailImageSrc: data.urlImagen, alt: data.titulo },
            { itemImageSrc: 'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=800&q=60', thumbnailImageSrc: 'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=100&q=60', alt: 'Imagen 2' },
            { itemImageSrc: 'https://images.unsplash.com/photo-1501183638714-8adaf9bfeaa3?auto=format&fit=crop&w=800&q=60', thumbnailImageSrc: 'https://images.unsplash.com/photo-1501183638714-8adaf9bfeaa3?auto=format&fit=crop&w=100&q=60', alt: 'Imagen 3' }
          ]);
        }
      },
      error: (err) => console.error('Error loading inmueble details', err)
    });
  }
}
