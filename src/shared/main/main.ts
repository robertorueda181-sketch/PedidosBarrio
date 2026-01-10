import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Inmueble, InmuebleService } from '../services/inmueble.service';
import { Negocio, NegocioService } from '../services/negocio.service';
import { Servicio, ServicioService } from '../services/servicio.service';
import { TipoService, TipoValor } from '../services/tipo.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class Main implements OnInit {
  private inmuebleService = inject(InmuebleService);
  private negocioService = inject(NegocioService);
  private servicioService = inject(ServicioService);
  private tipoService = inject(TipoService);
  private router = inject(Router);

  inmuebles = signal<Inmueble[]>([]);
  negocios = signal<Negocio[]>([]);
  servicios = signal<Servicio[]>([]);
  categorias = signal<any[]>([]);
  currentSlide = signal<number>(0);
  banners = [
    { url: 'assets/banner1.png', title: 'Descubre lo mejor de tu barrio', subtitle: 'Apoya a los negocios locales y encuentra todo lo que necesitas.' },
    { url: 'assets/banner.png', title: 'Servicios a tu alcance', subtitle: 'Encuentra profesionales calificados para cada necesidad.' },
    { url: 'assets/fondo.jpg', title: 'Tu próximo hogar te espera', subtitle: 'Explora nuestra selección exclusiva de inmuebles.' }
  ];

  private iconMapping: { [key: string]: string } = {};

  ngOnInit() {
    this.loadFeaturedInmuebles();
    this.loadNegocios();
    this.loadServicios();
    this.loadCategorias();
    this.startAutoSlide();
  }

  startAutoSlide() {
    setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.currentSlide.update(prev => (prev + 1) % this.banners.length);
  }

  prevSlide() {
    this.currentSlide.update(prev => (prev - 1 + this.banners.length) % this.banners.length);
  }

  setSlide(index: number) {
    this.currentSlide.set(index);
  }

  private startX: number = 0;
  private endX: number = 0;

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    this.endX = event.touches[0].clientX;
  }

  onTouchEnd() {
    const threshold = 50;
    const diff = this.startX - this.endX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  loadCategorias() {
    this.tipoService.getTiposValores().subscribe({
      next: (data: TipoValor[]) => {
        this.categorias.set(data);
      },
      error: (err) => console.error('Error loading categorias', err)
    });
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
