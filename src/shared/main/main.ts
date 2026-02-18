import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Inmueble, InmuebleService } from '../services/inmueble.service';
import { Negocio, NegocioService } from '../services/negocio.service';
import { Servicio, ServicioService } from '../services/servicio.service';
import { TipoService, TipoValor } from '../services/tipo.service';
import { CarouselModule } from 'primeng/carousel';

import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, CarouselModule],
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
  searchQuery = signal<string>('');
  currentSlide = signal<number>(1); // Empieza en el primero real
  isTransitioning = signal<boolean>(false);
  showAllCategories = signal<boolean>(false);
  banners = [
    { url: 'assets/banner1.avif', title: 'Descubre lo mejor de tu barrio', subtitle: 'Apoya a los negocios locales y encuentra todo lo que necesitas.' },
    { url: 'assets/banner.avif', title: 'Servicios a tu alcance', subtitle: 'Encuentra profesionales calificados para cada necesidad.' },
    { url: 'assets/fondo.avif', title: 'Tu próximo hogar te espera', subtitle: 'Explora nuestra selección exclusiva de inmuebles.' }
  ];

  responsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 4 },
    { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
  ];

  private iconMapping: { [key: string]: string } = {};

  ngOnInit() {
    this.loadFeaturedInmuebles();
    this.loadNegocios();
    this.loadServicios();
    this.loadCategorias();
    this.startAutoSlide();
  }

  toggleCategories() {
    this.showAllCategories.update(v => !v);
  }

  get visibleCategorias() {
    if (this.showAllCategories()) {
      return this.categorias();
    }
    // Mostramos 6 en móvil (2 filas de 3) y 6 en desktop
    return this.categorias().slice(0, 6);
  }

  get infiniteBanners() {
    // Clona el último al inicio y el primero al final
    return [this.banners[this.banners.length - 1], ...this.banners, this.banners[0]];
  }

  startAutoSlide() {
    setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    if (this.isTransitioning()) return;
    this.isTransitioning.set(true);
    this.currentSlide.update(prev => prev + 1);
    setTimeout(() => {
      if (this.currentSlide() === this.banners.length + 1) {
        // Sin transición, vuelve al primero real
        this.isTransitioning.set(false);
        this.currentSlide.set(1);
      } else {
        this.isTransitioning.set(false);
      }
    }, 700); // igual a la duración de la transición
  }

  prevSlide() {
    if (this.isTransitioning()) return;
    this.isTransitioning.set(true);
    this.currentSlide.update(prev => prev - 1);
    setTimeout(() => {
      if (this.currentSlide() === 0) {
        // Sin transición, vuelve al último real
        this.isTransitioning.set(false);
        this.currentSlide.set(this.banners.length);
      } else {
        this.isTransitioning.set(false);
      }
    }, 700);
  }

  setSlide(index: number) {
    this.currentSlide.set(index + 1);
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

  onSearch() {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/buscar'], { queryParams: { q: this.searchQuery() } });
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
        this.inmuebles.set(data);
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
