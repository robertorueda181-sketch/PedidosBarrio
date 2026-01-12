import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NegocioService, NegocioDetalle, ProductoDetalle } from '../../../shared/services/negocio.service';

export interface CartItem extends ProductoDetalle {
  cantidad: number;
}

import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

interface BannerConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: string;
}

interface AdModuleSection {
  id: string;
  type: 'text' | 'image' | 'mixed';
  content?: string;
  imageUrl?: string;
  layout?: 'text-left' | 'text-right';
}

interface AdImage {
  url: string;
  shape: 'circle' | 'square';
  size: 'sm' | 'md' | 'lg';
}

interface AdConfig {
  id?: string;
  name: string;
  headerChoice: 'none' | 'title' | 'image';
  title: string;
  imageUrl: string;
  subtitle: string;
  showSubtitle: boolean;
  mainContent: string;
  showMainContent: boolean;
  showWhatsAppBadge: boolean;
  moduleSections: AdModuleSection[];
  footerImage: string;
  footerImageConfig?: AdImage;
  startDate: string;
  endDate: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  cardColor: string;
  extraImages: string[];
  extraImagesConfig?: AdImage[];
  isActive?: boolean;
}

@Component({
  selector: 'app-amanro',
  standalone: true,
  imports: [CommonModule, DrawerModule, DialogModule, CheckboxModule, FormsModule],
  templateUrl: './amanro.html',
  styleUrls: ['./amanro.css']
})
export class Amanro implements OnInit {
  private negocioService = inject(NegocioService);

  negocio = signal<NegocioDetalle | null>(null);
  loading = signal<boolean>(true);
  selectedProducto = signal<ProductoDetalle | null>(null);
  cart = signal<CartItem[]>([]);
  isCartOpen = signal<boolean>(false);
  drawerVisible = signal<boolean>(false);
  showPromo = false;
  dontShowAgain = false;

  bannerConfig: BannerConfig = {
    title: 'Amanro: Sabor & Tradición',
    subtitle: 'Bienvenidos a la mejor experiencia gourmet',
    imageUrl: 'assets/restaurante.jpg',
    ctaText: 'Explorar Menú',
    ctaAction: 'productos'
  };

  adConfig: AdConfig | null = null;

  whatsappPhoneNumber: string = '51954121196';

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.cantidad, 0));
  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.precio * item.cantidad), 0));

  ngOnInit() {
    this.loadData('amanro');
    this.loadConfigs();
  }

  loadConfigs() {
    // Load Banner
    const savedBanner = localStorage.getItem('hero_banner_config');
    if (savedBanner) this.bannerConfig = JSON.parse(savedBanner);

    // Load Ad
    const savedAd = localStorage.getItem('ad_config');
    if (savedAd) {
      const config = JSON.parse(savedAd);

      // Migration for old structure
      if (config.sections && !config.moduleSections) {
        config.moduleSections = config.sections.map((s: any) => ({
          id: Date.now().toString() + Math.random(),
          type: 'text',
          content: `<h3>${s.title}</h3><ul>` + s.items.map((it: any) => `<li>${it.label}: ${it.value}</li>`).join('') + `</ul>`
        }));
        config.headerChoice = config.type === 'image' ? 'image' : 'title';
        config.showSubtitle = true;
        config.showMainContent = false;
        config.showWhatsAppBadge = true;
      }

      if (!config.footerImageConfig && config.footerImage) {
        config.footerImageConfig = {
          url: config.footerImage,
          shape: 'circle',
          size: 'md'
        };
      }

      if (!config.extraImagesConfig && config.extraImages) {
        config.extraImagesConfig = config.extraImages.map((img: string) => ({
          url: img,
          shape: 'circle',
          size: 'sm'
        }));
      }

      this.adConfig = config;
      this.checkPopups();
    }
  }

  checkPopups() {
    const promoHidden = localStorage.getItem('hideAmanroPromo');
    if (!this.adConfig || promoHidden) return;

    const now = new Date();
    if (this.adConfig.endDate) {
      const end = new Date(this.adConfig.endDate);
      end.setHours(23, 59, 59, 999);
      if (now > end) return;
    }

    setTimeout(() => {
      this.showPromo = true;
    }, 1500);
  }

  closePromo() {
    if (this.dontShowAgain) {
      localStorage.setItem('hideAmanroPromo', 'true');
    }
    this.showPromo = false;
  }

  loadData(codigo: string) {
    this.negocioService.getNegocioByCodigo(codigo).subscribe({
      next: (data: NegocioDetalle) => {
        this.negocio.set(data);
        this.loading.set(false);
        console.log(data);
      },
      error: (err: any) => {
        console.error('Error loading negocio detail', err);
        this.loading.set(false);
      }
    });
  }

  sendWhatsAppOrder() {
    if (this.cart().length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    let orderMessage = `*Nuevo Pedido - ${this.negocio()?.nombre}*\n\n`;
    this.cart().forEach(item => {
      orderMessage += `• ${item.cantidad}x ${item.nombre} - S/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
    });
    orderMessage += `\n*Total: S/ ${this.cartTotal().toFixed(2)}*\n\n¡Espero su confirmación!`;

    const encodedMessage = encodeURIComponent(orderMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openProducto(producto: ProductoDetalle) {
    this.selectedProducto.set(producto);
    this.drawerVisible.set(true);
  }

  closeProducto() {
    this.drawerVisible.set(false);
    // Timeout to clear selection after animation if desired, or just keep it
    setTimeout(() => {
      this.selectedProducto.set(null);
    }, 300);
  }

  addToCart(producto: ProductoDetalle) {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.productoID === producto.productoID);

    if (existingItem) {
      this.cart.set(currentCart.map(item =>
        item.productoID === producto.productoID
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      this.cart.set([...currentCart, { ...producto, cantidad: 1 }]);
    }
  }

  removeFromCart(productoID: number) {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.productoID === productoID);

    if (existingItem && existingItem.cantidad > 1) {
      this.cart.set(currentCart.map(item =>
        item.productoID === productoID
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      ));
    } else {
      this.cart.set(currentCart.filter(item => item.productoID !== productoID));
    }
  }

  toggleCart() {
    this.isCartOpen.update(v => !v);
    if (this.isCartOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  getProductosByCategory(categoriaID: number): ProductoDetalle[] {
    return this.negocio()?.productos.filter((p: ProductoDetalle) => p.categoriaID === categoriaID) || [];
  }
}
