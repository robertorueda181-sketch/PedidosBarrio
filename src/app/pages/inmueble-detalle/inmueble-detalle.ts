import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Inmueble, InmuebleService } from '../../../shared/services/inmueble.service';
import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import * as L from 'leaflet';

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
  showMap = signal<boolean>(false);
  showScrollButton = signal<boolean>(false);

  private map: L.Map | null = null;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showScrollButton.set(scrollOffset > 300);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

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
        console.log('Inmueble data received:', data);
        this.inmueble.set(data);

        // Transform imagenes array to Galleria format
        if (data.imagenes && data.imagenes.length > 0) {
          const galleryImages = data.imagenes.map(img => ({
            itemImageSrc: img.urlImagen,
            thumbnailImageSrc: img.urlImagen,
            alt: img.descripcion || data.titulo || 'Imagen del inmueble',
            title: img.descripcion
          }));
          console.log('Gallery images created:', galleryImages);
          this.images.set(galleryImages);
        } else if (data.urlImagen) {
          // Fallback to single image if imagenes array is empty
          console.log('Using fallback single image');
          this.images.set([{
            itemImageSrc: data.urlImagen,
            thumbnailImageSrc: data.urlImagen,
            alt: data.titulo || 'Imagen del inmueble',
            title: 'Imagen principal'
          }]);
        }

        console.log('Final images array:', this.images());
      },
      error: (err) => console.error('Error loading inmueble details', err)
    });
  }

  toggleMap() {
    this.showMap.update(val => !val);
    if (this.showMap()) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  private initMap() {
    if (this.map) {
      this.map.remove();
    }

    const inmueble = this.inmueble();
    if (!inmueble) return;

    // Usar coordenadas del inmueble o coordenadas por defecto (Lima centro)
    const lat = inmueble.latitud ? parseFloat(inmueble.latitud) : -12.0464;
    const lng = inmueble.longitud ? parseFloat(inmueble.longitud) : -77.0428;
    const inmuebleCoords: L.LatLngExpression = [lat, lng];

    this.map = L.map('map').setView(inmuebleCoords, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Marcador del inmueble
    const inmuebleIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker(inmuebleCoords, { icon: inmuebleIcon })
      .addTo(this.map)
      .bindPopup(`<strong>${inmueble.titulo || 'Inmueble'}</strong><br>${inmueble.ubicacion}`)
      .openPopup();
  }
}
