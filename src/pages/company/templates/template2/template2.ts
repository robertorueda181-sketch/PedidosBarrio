import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { NegocioDetalle } from '../../../../shared/services/negocio.service';
import {
  CompanyBannerSection,
  CompanyCartItem,
  CompanyImageSection,
  CompanyTemplateStyles,
  CompanyVideoSection
} from '../../interfaces/company-template.interface';

@Component({
  selector: 'app-company-template-two',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template2.html',
  styleUrl: './template2.css'
})
export class TemplateTwoComponent {
  business = input<NegocioDetalle | null>(null);
  styles = input<CompanyTemplateStyles>({
    bannerColor: '#312e81',
    textColor: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    mutedTextColor: '#475569'
  });
  filteredCategories = input<any[]>([]);
  whatsappUrl = input<string | null>(null);
  bannerSection = input<CompanyBannerSection | null>(null);
  heroTitle = input('');
  heroSubtitle = input('');
  searchTerm = input('');
  hasFilteredProducts = input(false);
  imageSections = input<CompanyImageSection[]>([]);
  videoSections = input<CompanyVideoSection[]>([]);
  cartItems = input<CompanyCartItem[]>([]);
  isCartOpen = input(false);
  cartCount = input(0);
  cartTotal = input(0);
  currentYear = input(new Date().getFullYear());
  getProductsByCategory = input<(category: any) => any[]>(() => []);
  updateSearchTerm = input<(value: string) => void>(() => undefined);
  scrollToSection = input<(sectionId: string) => void>(() => undefined);
  addToCart = input<(product: any) => void>(() => undefined);
  toggleCart = input<() => void>(() => undefined);
  updateQuantity = input<(itemId: number, change: number) => void>(() => undefined);
  checkout = input<() => void>(() => undefined);

  onScrollToSection(sectionId: string) {
    this.scrollToSection()(sectionId);
  }

  onUpdateSearchTerm(value: string) {
    this.updateSearchTerm()(value);
  }

  onGetProductsByCategory(category: any) {
    return this.getProductsByCategory()(category);
  }

  onAddToCart(product: any) {
    this.addToCart()(product);
  }

  onToggleCart() {
    this.toggleCart()();
  }

  onUpdateQuantity(itemId: number, change: number) {
    this.updateQuantity()(itemId, change);
  }

  onCheckout() {
    this.checkout()();
  }
}
