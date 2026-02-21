import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NegocioService, NegocioDetalle } from '../../shared/services/negocio.service';
import { AnalyticsService } from '../../shared/services/analytics.service';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule],
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
  cartItems = signal<CartItem[]>([]);
  isCartOpen = signal<boolean>(false);
  
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
      this.codigoempresa = params.get('codigoempresa');
      if (this.codigoempresa) {
        this.loadCompany(this.codigoempresa);
      }
    });

    // Initial load if param is already present (though subscribe handles it too, good for safety)
    const initialCode = this.route.snapshot.paramMap.get('codigoempresa');
    if (initialCode && !this.company()) {
        this.loadCompany(initialCode);
    }
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
}

