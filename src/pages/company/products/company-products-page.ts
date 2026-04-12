import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NegocioDetalle, NegocioService } from '../../../shared/services/negocio.service';
import { TEMPLATE_THREE_STATIC_CONTENT } from '../templates/template3/template3-content';
import { CompanyCartItem } from '../interfaces/company-template.interface';

interface SiteBuilderDraft {
  pageData: typeof TEMPLATE_THREE_STATIC_CONTENT;
  business: NegocioDetalle;
  savedAt: string | null;
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
  private readonly storageKey = 'empresa_mi_sitio_template3';

  readonly business = signal<NegocioDetalle | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly cartItems = signal<CompanyCartItem[]>([]);
  readonly isCartOpen = signal(false);

  readonly isPreview = computed(() => this.router.url.includes('/preview'));
  readonly businessSlug = computed(() => this.route.snapshot.paramMap.get('codigoempresa') || '');
  readonly brandName = computed(() => this.business()?.nombre || 'Mi catálogo');
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
    ? '/empresa/mi-sitio/preview'
    : `/negocio/${this.businessSlug()}`);

  readonly menuSectionLabels = computed(() => {
    const menuSection = TEMPLATE_THREE_STATIC_CONTENT.sections.find(section => section.type === 'menu');
    return {
      allCategoriesLabel: menuSection?.content.all_categories_label || 'Todas',
      orderButtonText: menuSection?.content.order_button_text || 'Pedir'
    };
  });
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
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
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
    this.negocioService.getNegocioPorNombre(slug).subscribe({
      next: business => {
        this.business.set(business);
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
      this.business.set(draft.business || null);
    } catch {
      this.error.set('No se pudo leer el borrador de la vista previa.');
    }
  }
}