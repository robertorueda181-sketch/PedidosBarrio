import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NegocioService, NegocioDetalle, NegocioImagen, NegocioSeccion, NegocioVideo } from '../../shared/services/negocio.service';
import { AnalyticsService } from '../../shared/services/analytics.service';
import {
  CompanyBannerSection,
  CompanyCartItem,
  CompanyGalleryImage,
  CompanyImageSection,
  CompanyTemplateStyles,
  CompanyVideoCard,
  CompanyVideoSection
} from './interfaces/company-template.interface';
import { TemplateOneComponent } from './templates/template1/template1';
import { TemplateTwoComponent } from './templates/template2/template2';
import { TemplateThreeComponent } from './templates/template3/template3';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, TemplateOneComponent, TemplateTwoComponent, TemplateThreeComponent],
  templateUrl: './company.html',
  styleUrl: './company.css',
})
export class Company implements OnInit {
  private route = inject(ActivatedRoute);
  private negocioService = inject(NegocioService);
  private analyticsService = inject(AnalyticsService);
  private sanitizer = inject(DomSanitizer);
  
  codigoempresa: string | null = null;
  company = signal<NegocioDetalle | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Cart State
  cartItems = signal<CompanyCartItem[]>([]);
  isCartOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  previewTemplate = signal<1 | 2 | 3 | null>(null);
  currentYear = new Date().getFullYear();

  templateType = computed<1 | 2 | 3>(() => {
    const business = this.company() as (NegocioDetalle & { templateType?: number | string }) | null;
    const rawTemplate = business?.tipoPlantilla ?? business?.templateType;
    const previewTemplate = this.previewTemplate();

    if (previewTemplate) {
      return previewTemplate;
    }

    const template = Number(rawTemplate);
    return [1, 2, 3].includes(template) ? template as 1 | 2 | 3 : 3;
  });

  templateStyles = computed<CompanyTemplateStyles>(() => {
    const business = this.company() as (NegocioDetalle & {
      bannerColor?: string;
      textColor?: string;
      fontFamily?: string;
    }) | null;

    return {
      bannerColor: business?.colorBanner || business?.bannerColor || '#312e81',
      textColor: business?.colorTexto || business?.textColor || '#0f172a',
      fontFamily: business?.estiloLetra || business?.fontFamily || 'Inter, sans-serif',
      mutedTextColor: business?.colorTexto || business?.textColor || '#475569'
    };
  });

  bannerSection = computed<CompanyBannerSection | null>(() => {
    const business = this.company();
    if (!business) {
      return null;
    }

    const rawBannerSection = this.getRawSections(business)
      .find(section => this.resolveSectionType(section.tipo ?? section.type) === 1);

    const imageUrl = rawBannerSection?.urlBanner
      || rawBannerSection?.imageUrl
      || rawBannerSection?.urlImagen
      || rawBannerSection?.imagenes?.[0]?.urlImagen
      || business.urlBanner
      || business.urlImagen
      || business.logoUrl
      || '';

    return {
      id: `${rawBannerSection?.id ?? 'banner-principal'}`,
      title: rawBannerSection?.titulo || rawBannerSection?.title || business.nombre,
      description: rawBannerSection?.descripcion
        || rawBannerSection?.subtitle
        || business.descripcion
        || `Bienvenido a ${business.nombre}`,
      imageUrl,
      badge: business.categorias?.length > 0
        ? business.categorias[0].descripcion
        : 'Negocio local'
    };
  });

  imageSections = computed<CompanyImageSection[]>(() => {
    const business = this.company();
    if (!business) {
      return [];
    }

    const rawSections = this.getRawSections(business)
      .filter(section => this.resolveSectionType(section.tipo ?? section.type) === 2);

    const mappedSections = rawSections
      .map((section, index) => this.mapImageSection(section, business, index))
      .filter((section): section is CompanyImageSection => section !== null);

    if (mappedSections.length > 0) {
      return mappedSections;
    }

    const fallbackImages = this.normalizeImages(business.imagenes || [], business.nombre);
    if (fallbackImages.length === 0) {
      return [];
    }

    return [{
      id: 'galeria-principal',
      title: 'Galería del negocio',
      description: 'Conoce más de nuestro espacio a través de estas imágenes.',
      images: fallbackImages
    }];
  });

  videoSections = computed<CompanyVideoSection[]>(() => {
    const business = this.company();
    if (!business) {
      return [];
    }

    const rawSections = this.getRawSections(business)
      .filter(section => this.resolveSectionType(section.tipo ?? section.type) === 3);

    const mappedSections = rawSections
      .map((section, index) => this.mapVideoSection(section, business, index))
      .filter((section): section is CompanyVideoSection => section !== null);

    if (mappedSections.length > 0) {
      return mappedSections;
    }

    const fallbackVideos = this.normalizeVideos(business.videos || []);
    if (fallbackVideos.length === 0) {
      return [];
    }

    return [{
      id: 'videos-principales',
      title: 'Videos del negocio',
      description: 'Mira nuestro contenido destacado.',
      videos: fallbackVideos
    }];
  });

  whatsappUrl = computed(() => {
    const whatsapp = this.company()?.whatsapp?.replace(/\D/g, '');
    return whatsapp ? `https://wa.me/${whatsapp}` : null;
  });

  filteredCategories = computed(() => {
    const business = this.company();
    if (!business?.categorias) {
      return [];
    }

    return business.categorias.filter(category => this.getProductsByCategory(category).length > 0);
  });

  hasFilteredProducts = computed(() => {
    const business = this.company();
    if (!business?.productos) {
      return false;
    }

    return business.productos.some(product => this.matchesSearch(product));
  });

  heroTitle = computed(() => {
    const business = this.company();
    if (!business) {
      return '';
    }

    return this.bannerSection()?.title || `${business.nombre}: sabor y tradición`;
  });

  heroSubtitle = computed(() => {
    const business = this.company();
    if (!business) {
      return '';
    }

    return this.bannerSection()?.description
      || business.descripcion
      || `Descubre la experiencia de ${business.nombre}`;
  });

  templateThreeConfig = computed(() => {
    const business = this.company();
    if (!business) {
      return null;
    }

    return {
      brandName: business.nombre,
      productsPageUrl: this.codigoempresa ? `/negocio/${this.codigoempresa}/productos` : '',
      heroTitle: business.nombre,
      heroSubtitle: business.descripcion || `Sabor, ambiente y buenos momentos en ${business.nombre}.`,
      heroImageUrl: this.bannerSection()?.imageUrl || business.urlBanner || business.urlImagen || business.logoUrl,
      aboutText: business.descripcion || `En ${business.nombre} creemos en una experiencia que combina buena atención, una propuesta clara y mucha personalidad.`,
      aboutSecondaryText: 'Nuestro objetivo es que cada visita se convierta en una experiencia memorable, tanto por el servicio como por la calidad de nuestros productos.',
      aboutImageUrl: business.imagenes?.[0]?.urlImagen || this.bannerSection()?.imageUrl || business.urlImagen,
      menuIntro: 'Explora una carta dinámica construida con los productos reales del negocio.',
      footerDescription: business.descripcion || `Visita ${business.nombre} y descubre una propuesta hecha para destacar.`,
      reservationPhone: business.whatsapp || business.telefono || '+51 999 999 999'
    };
  });
  
  mapUrl = computed(() => {
    const business = this.company();
    if (business && business.latitud && business.longitud) {
      const url = `https://maps.google.com/maps?q=${business.latitud},${business.longitud}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return null;
  });

  cartTotal = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0);
  });

  cartCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  constructor() {
    // Effect to load cart when company is loaded
    effect(() => {
      const currentCompany = this.company();
      if (currentCompany && currentCompany.nombre) {
        const savedCart = localStorage.getItem(`cart_${currentCompany.nombre}`);
        if (savedCart) {
          try {
            this.cartItems.set(JSON.parse(savedCart));
          } catch (e) {
            console.error('Error parsing cart', e);
          }
        } else {
             this.cartItems.set([]); 
        }
      }
    }, { allowSignalWrites: true });

    // Effect to save cart when items change
    effect(() => {
        const currentCompany = this.company();
        const items = this.cartItems();
        if (currentCompany && currentCompany.nombre) {
            localStorage.setItem(`cart_${currentCompany.nombre}`, JSON.stringify(items));
        }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const newCode = params.get('codigoempresa');
      if (newCode && newCode !== this.codigoempresa) {
        this.codigoempresa = newCode;
        this.loadCompany(this.codigoempresa);
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const template = Number(params.get('template'));
      this.previewTemplate.set([1, 2, 3].includes(template) ? template as 1 | 2 | 3 : null);
    });
  }

  loadCompany(nombre: string) {
    this.loading.set(true);
    this.error.set(null);
    this.negocioService.getNegocioPorNombre(nombre).subscribe({
      next: (data) => {
        this.company.set(data);
        this.loading.set(false);
        if (data.empresaID) {
          this.analyticsService.trackCompanyView(data.nombre);
        }
      },
      error: (err) => {
        console.error('Error loading company:', err);
        this.error.set('No se pudo cargar la información del negocio.');
        this.loading.set(false);
      }
    });
  }

  addToCart(product: any) {
    this.cartItems.update(items => {
      const existingItem = items.find(i => i.id === product.productoID);
      if (existingItem) {
        return items.map(i => 
          i.id === product.productoID ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...items, {
        id: product.productoID,
        name: product.nombre,
        price: product.precio,
        quantity: 1,
        image: product.urlImagen
      }];
    });
    this.isCartOpen.set(true);
  }

  removeFromCart(itemId: number) {
    this.cartItems.update(items => items.filter(i => i.id !== itemId));
  }

  updateQuantity(itemId: number, change: number) {
    this.cartItems.update(items => {
        return items.map(item => {
            if (item.id === itemId) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        });
    });
  }

  toggleCart() {
    this.isCartOpen.update(v => !v);
  }

  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  checkout() {
    const business = this.company();
    console.log('Checkout initiated with items:', this.company());
    if (!business || !business.whatsapp) return;

    let message = `Hola *${business.nombre}*, me gustaría realizar el siguiente pedido:%0A%0A`;
    
    this.cartItems().forEach(item => {
        message += `• ${item.quantity}x ${item.name} - S/${(item.price * item.quantity).toFixed(2)}%0A`;
    });

    message += `%0A*Total: S/${this.cartTotal().toFixed(2)}*`;
    message += `%0A%0AMuchas gracias!`;

    const url = `https://wa.me/${business.whatsapp}?text=${message}`;
    window.open(url, '_blank');
  }

  private getRawSections(business: NegocioDetalle): NegocioSeccion[] {
    const businessWithAltSections = business as NegocioDetalle & { sections?: NegocioSeccion[] };
    const rawSections = business.secciones || businessWithAltSections.sections || [];

    return Array.isArray(rawSections) ? rawSections : [];
  }

  private resolveSectionType(rawType: unknown): 1 | 2 | 3 | null {
    const normalizedType = `${rawType ?? ''}`.trim().toLowerCase();

    if (normalizedType === '1' || normalizedType === 'banner' || normalizedType === 'hero') {
      return 1;
    }

    if (
      normalizedType === '2'
      || normalizedType === 'imagenes'
      || normalizedType === 'imágenes'
      || normalizedType === 'images'
      || normalizedType === 'gallery'
      || normalizedType === 'image-gallery'
    ) {
      return 2;
    }

    if (
      normalizedType === '3'
      || normalizedType === 'videos'
      || normalizedType === 'video'
      || normalizedType === 'video-gallery'
    ) {
      return 3;
    }

    return null;
  }

  private mapImageSection(
    section: NegocioSeccion,
    business: NegocioDetalle,
    index: number
  ): CompanyImageSection | null {
    const images = this.normalizeImages(
      section.imagenes || section.images || [],
      business.nombre
    );

    if (images.length === 0) {
      return null;
    }

    return {
      id: `${section.id ?? `galeria-${index + 1}`}`,
      title: section.titulo || section.title || `Galería ${index + 1}`,
      description: section.descripcion,
      images
    };
  }

  private mapVideoSection(
    section: NegocioSeccion,
    business: NegocioDetalle,
    index: number
  ): CompanyVideoSection | null {
    const videos = this.normalizeVideos(section.videos || []);

    if (videos.length === 0) {
      return null;
    }

    return {
      id: `${section.id ?? `videos-${index + 1}`}`,
      title: section.titulo || section.title || `Videos de ${business.nombre}`,
      description: section.descripcion,
      videos
    };
  }

  private normalizeImages(images: Array<NegocioImagen | {
    url?: string;
    imageUrl?: string;
    alt?: string;
    caption?: string;
    descripcion?: string;
  }>, fallbackAlt: string): CompanyGalleryImage[] {
    if (!Array.isArray(images)) {
      return [];
    }

    return images
      .map((image, index) => {
        const normalizedImage = image as NegocioImagen & {
          url?: string;
          imageUrl?: string;
          alt?: string;
          caption?: string;
        };

        return {
          url: normalizedImage.urlImagen || normalizedImage.url || normalizedImage.imageUrl || '',
          alt: normalizedImage.descripcion || normalizedImage.alt || `${fallbackAlt} ${index + 1}`,
          caption: normalizedImage.descripcion || normalizedImage.caption || ''
        };
      })
      .filter(image => !!image.url);
  }

  private normalizeVideos(videos: NegocioVideo[]): CompanyVideoCard[] {
    if (!Array.isArray(videos)) {
      return [];
    }

    return videos
      .map((video, index) => {
        const rawUrl = video.url || video.urlVideo || '';
        if (!rawUrl) {
          return null;
        }

        return {
          title: video.titulo || video.title || `Video ${index + 1}`,
          description: video.descripcion || '',
          rawUrl,
          safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(this.convertToEmbedUrl(rawUrl)),
          thumbnail: video.thumbnail
        };
      })
      .filter((video): video is NonNullable<typeof video> => video !== null);
  }

  private convertToEmbedUrl(url: string): string {
    if (url.includes('/embed/')) {
      return url;
    }

    if (url.includes('watch?v=')) {
      return `https://www.youtube.com/embed/${url.split('watch?v=')[1].split('&')[0]}`;
    }

    if (url.includes('youtu.be/')) {
      return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;
    }

    if (url.includes('vimeo.com/')) {
      return `https://player.vimeo.com/video/${url.split('vimeo.com/')[1].split('?')[0]}`;
    }

    return url;
  }

  private getCategoryId(category: any): number | string | null {
    return category?.categoriaID ?? category?.id ?? category?.codigo ?? null;
  }

  getProductsByCategory(category: any): any[] {
    const business = this.company();
    if (!business?.productos?.length) {
      return [];
    }

    const categoryId = this.getCategoryId(category);
    return business.productos.filter(product => {
      const productCategoryId = product?.categoriaID ?? product?.categoria?.categoriaID ?? product?.categoria?.id ?? null;
      return productCategoryId === categoryId && this.matchesSearch(product);
    });
  }

  private matchesSearch(product: any): boolean {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return true;
    }

    const searchableText = [
      product?.nombre,
      product?.descripcion,
      product?.categoria?.descripcion
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(term);
  }
}

