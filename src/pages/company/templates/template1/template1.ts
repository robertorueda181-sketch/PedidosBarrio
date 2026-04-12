import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NegocioDetalle } from '../../../../shared/services/negocio.service';
import { CompanyCartItem } from '../../interfaces/company-template.interface';

@Component({
  selector: 'app-company-template-one',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template1.html',
  styleUrl: './template1.css'
})
export class TemplateOneComponent {
  business = input<NegocioDetalle | null>(null);
  mapUrl = input<SafeResourceUrl | null>(null);
  cartItems = input<CompanyCartItem[]>([]);
  isCartOpen = input(false);
  cartCount = input(0);
  cartTotal = input(0);
  addToCart = input<(product: any) => void>(() => undefined);
  removeFromCart = input<(itemId: number) => void>(() => undefined);
  updateQuantity = input<(itemId: number, change: number) => void>(() => undefined);
  toggleCart = input<() => void>(() => undefined);
  checkout = input<() => void>(() => undefined);

  onAddToCart(product: any) {
    this.addToCart()(product);
  }

  onRemoveFromCart(itemId: number) {
    this.removeFromCart()(itemId);
  }

  onUpdateQuantity(itemId: number, change: number) {
    this.updateQuantity()(itemId, change);
  }

  onToggleCart() {
    this.toggleCart()();
  }

  onCheckout() {
    this.checkout()();
  }
}
