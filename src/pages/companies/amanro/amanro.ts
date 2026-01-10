import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NegocioService, NegocioDetalle, ProductoDetalle } from '../../../shared/services/negocio.service';

export interface CartItem extends ProductoDetalle {
  cantidad: number;
}

@Component({
  selector: 'app-amanro',
  standalone: true,
  imports: [CommonModule],
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

  whatsappPhoneNumber: string = '51954121196';

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.cantidad, 0));
  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.precio * item.cantidad), 0));

  ngOnInit() {
    this.loadData('amanro');
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
    document.body.style.overflow = 'hidden';
  }

  closeProducto() {
    this.selectedProducto.set(null);
    document.body.style.overflow = 'auto';
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
