import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { NegocioDetalle, NegocioService } from '../../../shared/services/negocio.service';
import { PaginasService } from '../../../shared/services/paginas.service';
import { TEMPLATE_THREE_STATIC_CONTENT, TemplateThreePageData } from '../templates/template3/template3-content';
import { CompanyCartItem } from '../interfaces/company-template.interface';

interface SiteBuilderDraft {
  pageData: typeof TEMPLATE_THREE_STATIC_CONTENT;
  business: NegocioDetalle;
  savedAt: string | null;
}

interface CompanyProductsTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textLight: string;
  surface: string;
  surfaceBorder: string;
  mutedText: string;
}

@Component({
  selector: 'app-company-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-products-page.html',
  styleUrl: './company-products-page.css'
})
export class CompanyProductsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly negocioService = inject(NegocioService);
  private readonly paginasService = inject(PaginasService);
  private readonly storageKey = 'empresa_mi_sitio_template3';

  readonly business = signal<NegocioDetalle | null>(null);
  readonly publishedPageData = signal<TemplateThreePageData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly cartItems = signal<CompanyCartItem[]>([]);
  readonly isCartOpen = signal(false);
  readonly theme = signal<CompanyProductsTheme>(this.buildTheme());

  readonly isPreview = computed(() => this.router.url.includes('/preview'));
  readonly businessSlug = computed(() => this.route.snapshot.paramMap.get('codigoempresa') || '');
  readonly brandName = computed(() => this.business()?.nombre || 'Mi catálogo');
  readonly logoUrl = computed(() => this.publishedPageData()?.branding?.logoUrl
    || this.business()?.logoUrl
    || (this.business() as any)?.urlLogo
    || '');
  readonly pageTitle = computed(() => `Productos de ${this.brandName()}`);
  readonly pageDescription = computed(() => this.business()?.descripcion || 'Explora todos los productos disponibles y encuentra lo que buscas rápidamente.');

  readonly categories = computed(() => {
    const categories = this.business()?.categorias || [];
    return categories.filter(category => this.productsForCategory(category).length > 0);
  });

  readonly visibleProducts = computed(() => {
    const products = this.business()?.productos || [];
    const activeCategory = this.selectedCategory();
    const term = this.searchTerm().trim().toLowerCase();

    return products.filter(product => {
      const categoryMatches = activeCategory === 'all' || this.productCategoryKey(product) === activeCategory;
      if (!categoryMatches) {
        return false;
      }

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
    });
  });

  readonly backUrl = computed(() => this.isPreview()
    ? '/empresa/sitio/preview'
    : `/negocio/${this.businessSlug()}`);

  
  readonly cartTotal = computed(() => this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0));
  readonly cartCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  constructor() {
    effect(() => {
      const business = this.business();
      if (!business?.nombre || typeof window === 'undefined') {
        return;
      }

      const saved = localStorage.getItem(`cart_${business.nombre}`);
      if (saved) {
        try {
          this.cartItems.set(JSON.parse(saved));
        } catch {
          this.cartItems.set([]);
        }
      } else {
        this.cartItems.set([]);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const business = this.business();
      if (!business?.nombre || typeof window === 'undefined') {
        return;
      }

      localStorage.setItem(`cart_${business.nombre}`, JSON.stringify(this.cartItems()));
    });
  }

  ngOnInit() {
    this.loadBusiness();
  }

  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  setActiveCategory(category: string) {
    this.selectedCategory.set(category);
  }

  addToCart(product: any) {
    this.cartItems.update(items => {
      const existingItem = items.find(item => item.id === product.productoID);
      if (existingItem) {
        return items.map(item => item.id === product.productoID ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...items, {
        id: product.productoID,
        name: product.nombre,
        price: product.precio,
        quantity: 1,
        image: product.urlImagen || this.fallbackProductImage()
      }];
    });

    this.isCartOpen.set(true);
  }

  removeFromCart(itemId: number) {
    this.cartItems.update(items => items.filter(item => item.id !== itemId));
  }

  updateQuantity(itemId: number, change: number) {
    this.cartItems.update(items => items
      .map(item => item.id === itemId ? { ...item, quantity: item.quantity + change } : item)
      .filter(item => item.quantity > 0));
  }

  toggleCart() {
    this.isCartOpen.update(value => !value);
  }

  checkout() {
    const business = this.business();
    if (!business?.whatsapp || this.cartItems().length === 0) {
      return;
    }

    let message = `Hola *${business.nombre}*, me gustaría realizar el siguiente pedido:%0A%0A`;

    this.cartItems().forEach(item => {
      message += `• ${item.quantity}x ${item.name} - S/${(item.price * item.quantity).toFixed(2)}%0A`;
    });

    message += `%0A*Total: S/${this.cartTotal().toFixed(2)}*`;
    message += `%0A%0AMuchas gracias!`;

    window.open(`https://wa.me/${business.whatsapp}?text=${message}`, '_blank');
  }

  categoryKey(category: any): string {
    return `${category?.categoriaID ?? category?.id ?? category?.codigo ?? category?.descripcion ?? 'general'}`;
  }

  productKey(product: any): string {
    return `${product?.productoID ?? product?.id ?? product?.nombre ?? Math.random()}`;
  }

  productCategoryKey(product: any): string {
    return `${product?.categoriaID ?? product?.categoria?.categoriaID ?? product?.categoria?.id ?? product?.categoria?.codigo ?? 'general'}`;
  }

  productCategoryLabel(product: any): string {
    return product?.categoria?.descripcion
      || this.categories().find(category => this.categoryKey(category) === this.productCategoryKey(product))?.descripcion
      || 'Especialidad';
  }

  productsForCategory(category: any): any[] {
    return (this.business()?.productos || []).filter(product => this.productCategoryKey(product) === this.categoryKey(category));
  }

  fallbackProductImage(): string {
    return '/assets/image-default.webp';
  }

  private loadBusiness() {
    if (this.isPreview()) {
      this.loadPreviewBusiness();
      return;
    }

    const slug = this.businessSlug();
    if (!slug) {
      this.error.set('No se pudo identificar el negocio para mostrar sus productos.');
      return;
    }

    this.loading.set(true);
    this.publishedPageData.set(null);

    forkJoin({
      negocio: this.negocioService.getNegocioPorNombre(slug),
      pagina: this.paginasService.getPaginaPorCodigo(slug).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ negocio, pagina }) => {
        const pageData = this.parsePageData(pagina?.contenido);
        this.publishedPageData.set(pageData);
        this.business.set(this.mergeBusinessWithPublishedBranding(negocio, pageData));
        this.theme.set(this.buildTheme(pageData?.theme?.colors));
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading products page:', error);
        this.error.set('No se pudieron cargar los productos de este negocio.');
        this.loading.set(false);
      }
    });
  }

  private loadPreviewBusiness() {
    if (typeof window === 'undefined') {
      this.error.set('La previsualización no está disponible en este entorno.');
      return;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      this.error.set('No encontramos un borrador guardado para mostrar los productos.');
      return;
    }

    try {
      const draft = JSON.parse(raw) as SiteBuilderDraft;
      this.publishedPageData.set(draft.pageData || null);
      this.business.set(draft.business || null);
      this.theme.set(this.buildTheme(draft.pageData?.theme?.colors));
    } catch {
      this.error.set('No se pudo leer el borrador de la vista previa.');
    }
  }

  private parsePageData(contenido?: string | null): TemplateThreePageData | null {
    if (!contenido) {
      return null;
    }

    try {
      return JSON.parse(contenido) as TemplateThreePageData;
    } catch {
      return null;
    }
  }

  private mergeBusinessWithPublishedBranding(
    business: NegocioDetalle,
    pageData: TemplateThreePageData | null
  ): NegocioDetalle {
    if (!pageData?.branding) {
      return business;
    }

    return {
      ...business,
      urlBanner: pageData.branding.urlBanner || business.urlBanner,
      logoUrl: pageData.branding.logoUrl || business.logoUrl
    };
  }

  private buildTheme(colors?: typeof TEMPLATE_THREE_STATIC_CONTENT.theme.colors): CompanyProductsTheme {
    const palette = colors || TEMPLATE_THREE_STATIC_CONTENT.theme.colors;
    const text = palette.text_main || '#2b211d';
    const background = palette.background || '#f6f0e6';

    return {
      primary: palette.primary || '#4a2f27',
      secondary: palette.secondary || '#c2a06b',
      background,
      text,
      textLight: palette.text_light || '#ffffff',
      surface: '#ffffff',
      surfaceBorder: this.hexToRgba(text, 0.08),
      mutedText: this.hexToRgba(text, 0.72)
    };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return `rgba(43, 33, 29, ${alpha})`;
    }

    const value = parseInt(normalized, 16);
    const r = value >> 16;
    const g = (value >> 8) & 0x00ff;
    const b = value & 0x0000ff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}