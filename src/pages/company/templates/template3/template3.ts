import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NegocioDetalle } from '../../../../shared/services/negocio.service';
import { CompanyCartItem } from '../../interfaces/company-template.interface';
import {
  TEMPLATE_THREE_STATIC_CONTENT,
  TemplateThreeAboutSection,
  TemplateThreeContactSection,
  TemplateThreeFooterSection,
  TemplateThreeGallerySection,
  TemplateThreeHeroSection,
  TemplateThreeMenuSection,
  TemplateThreePageData,
  TemplateThreeReservationSection,
  TemplateThreeSectionData,
  TemplateThreeTestimonialsSection,
  TemplateThreeVideoSection
} from './template3-content';

interface TemplateThreeStyles {
  bannerColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor: string;
  fontFamily: string;
  mutedTextColor?: string;
}

interface TemplateThreeStat {
  value: string;
  label: string;
}

interface TemplateThreeFeature {
  title: string;
  description: string;
}

interface TemplateThreeTestimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface TemplateThreeGalleryItem {
  url: string;
  alt: string;
  caption?: string;
}

interface TemplateThreeConfig {
  brandName?: string;
  logoUrl?: string;
  productsPageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutSecondaryText?: string;
  aboutImageUrl?: string;
  menuIntro?: string;
  footerDescription?: string;
  reservationPhone?: string;
  openingHours?: string[];
  stats?: TemplateThreeStat[];
  features?: TemplateThreeFeature[];
  testimonials?: TemplateThreeTestimonial[];
  galleryImages?: TemplateThreeGalleryItem[];
}

interface ReservationFormState {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  occasion: string;
  notes: string;
}

@Component({
  selector: 'app-company-template-three',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template3.html',
  styleUrl: './template3.css'
})
export class TemplateThreeComponent {
  private sanitizer = inject(DomSanitizer);
  private hostElement = inject(ElementRef<HTMLElement>);
  business = input<NegocioDetalle | null>(null);
  styles = input<TemplateThreeStyles>({
    bannerColor: '#4a2f27',
    primaryColor: '#4a2f27',
    secondaryColor: '#c2a06b',
    backgroundColor: '#f6f0e6',
    textColor: '#2b211d',
    fontFamily: 'Inter, sans-serif',
    mutedTextColor: '#6f6258'
  });
  pageData = input<TemplateThreePageData | null>(null);
  config = input<TemplateThreeConfig | null>(null);
  mapUrl = input<SafeResourceUrl | null>(null);
  whatsappUrl = input<string | null>(null);
  previewMode = input<'default' | 'embedded-mobile'>('default');
  cartItems = input<CompanyCartItem[]>([]);
  isCartOpen = input(false);
  cartCount = input(0);
  cartTotal = input(0);
  addToCart = input<(product: any) => void>(() => undefined);
  removeFromCart = input<(itemId: number) => void>(() => undefined);
  updateQuantity = input<(itemId: number, change: number) => void>(() => undefined);
  toggleCart = input<() => void>(() => undefined);
  checkout = input<() => void>(() => undefined);

  activeCategory = signal<string>('all');
  isMobileMenuOpen = signal(false);
  reservationSubmitted = signal(false);
  navScrolled = signal(false);
  reservationForm = signal<ReservationFormState>({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '',
    occasion: '',
    notes: ''
  });

  currentYear = new Date().getFullYear();
  pageContent = computed<TemplateThreePageData>(() => this.pageData() || TEMPLATE_THREE_STATIC_CONTENT);
  sections = computed(() => this.pageContent().sections || []);
  heroSection = computed(() => this.sections().find(section => section.type === 'hero') as TemplateThreeHeroSection | undefined);
  aboutSection = computed(() => this.sections().find(section => section.type === 'about_us') as TemplateThreeAboutSection | undefined);
  menuSection = computed(() => this.sections().find(section => section.type === 'menu') as TemplateThreeMenuSection | undefined);
  gallerySection = computed(() => this.sections().find(section => section.type === 'gallery') as TemplateThreeGallerySection | undefined);
  videoSection = computed(() => this.sections().find(section => section.type === 'videos') as TemplateThreeVideoSection | undefined);
  testimonialsSection = computed(() => this.sections().find(section => section.type === 'testimonials') as TemplateThreeTestimonialsSection | undefined);
  reservationSection = computed(() => this.sections().find(section => section.type === 'reservation') as TemplateThreeReservationSection | undefined);
  contactSection = computed(() => this.sections().find(section => section.type === 'contact') as TemplateThreeContactSection | undefined);
  footerSection = computed(() => this.sections().find(section => section.type === 'footer') as TemplateThreeFooterSection | undefined);
  navigableSections = computed(() => this.sections().filter(section => section.type !== 'footer'));
  isEmbeddedMobile = computed(() => this.previewMode() === 'embedded-mobile');

  theme = computed(() => {
    const styles = this.styles();
    const theme = this.pageContent().theme;
    const primary = styles.primaryColor || styles.bannerColor || theme.colors.primary || '#4a2f27';
    const secondary = styles.secondaryColor || theme.colors.secondary || '#c2a06b';
    const background = styles.backgroundColor || theme.colors.background || '#f6f0e6';
    const textColor = styles.textColor || theme.colors.text_main || '#2b211d';
    const mutedTextColor = styles.mutedTextColor || this.adjustColor(textColor, 70);

    return {
      primary,
      primaryDark: this.adjustColor(primary, -24),
      primaryLight: this.adjustColor(primary, 18),
      primaryRgb: this.hexToRgb(primary),
      secondary,
      secondaryDark: this.adjustColor(secondary, -18),
      secondaryLight: this.adjustColor(secondary, 18),
      secondaryRgb: this.hexToRgb(secondary),
      background,
      backgroundDark: this.adjustColor(background, -14),
      backgroundLight: this.adjustColor(background, 4),
      textColor,
      mutedTextColor,
      textLight: theme.colors.text_light || '#ffffff',
      fontFamily: styles.fontFamily || theme.typography.font_family_body || 'Inter, sans-serif',
      headingFontFamily: theme.typography.font_family_headings || 'Playfair Display, serif',
      baseSize: theme.typography.base_size || '16px'
    };
  });

  brandName = computed(() => this.config()?.brandName || this.business()?.nombre || 'Stacion 64');
  logoImageUrl = computed(() => this.config()?.logoUrl
    || this.business()?.logoUrl
    || (this.business() as any)?.urlLogo
    || '');
  heroTitle = computed(() => this.config()?.heroTitle || this.heroSection()?.content.title || `${this.brandName()}: sabor que te cautiva`);
  heroSubtitle = computed(() => this.config()?.heroSubtitle
    || this.heroSection()?.content.subtitle
    || this.business()?.descripcion
    || `Donde la gastronomía y el ambiente se fusionan para crear una experiencia única en ${this.brandName()}.`);
  heroImageUrl = computed(() => this.config()?.heroImageUrl
    || this.business()?.urlBanner
    || this.business()?.urlImagen
    || this.business()?.imagenes?.[0]?.urlImagen
    || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85');

  aboutOverline = computed(() => this.aboutSection()?.content.overline || 'Nuestra historia');
  aboutTitle = computed(() => this.config()?.aboutTitle || this.aboutSection()?.content.title || 'Sobre Nosotros');
  aboutText = computed(() => this.config()?.aboutText
    || this.aboutSection()?.content.description
    || this.business()?.descripcion
    || `${this.brandName()} nació con una visión clara: crear un espacio donde el sabor, la atención y el ambiente convivan en perfecta armonía.`);
  aboutSecondaryText = computed(() => this.config()?.aboutSecondaryText
    || this.aboutSection()?.content.secondary_description
    || `Nuestro equipo trabaja con ingredientes frescos y una propuesta pensada para sorprender a cada cliente en cada visita.`);
  menuIntro = computed(() => this.config()?.menuIntro
    || this.menuSection()?.content.description
    || 'Platos preparados con pasión, usando los mejores ingredientes frescos y una propuesta diseñada para compartir buenos momentos.');
  footerDescription = computed(() => this.config()?.footerDescription
    || this.footerSection()?.content.description
    || `Un espacio donde el sabor y el buen ambiente se encuentran. Visítanos y descubre la esencia de ${this.brandName()}.`);
  aboutImageUrl = computed(() => this.config()?.aboutImageUrl
    || this.aboutSection()?.content.image_highlight.url
    || this.business()?.imagenes?.[1]?.urlImagen
    || this.heroImageUrl());
  aboutCtaText = computed(() => this.aboutSection()?.content.cta.text || 'Reserva tu experiencia');
  aboutCtaLink = computed(() => this.aboutSection()?.content.cta.link || '#reservas');
  galleryOverline = computed(() => this.gallerySection()?.content.overline || 'Momentos y sabores');
  galleryTitle = computed(() => this.gallerySection()?.content.title || 'Galería');

  categories = computed(() => {
    const categories = this.business()?.categorias || [];
    return categories.filter(category => this.productsForCategory(category).length > 0);
  });

  visibleProducts = computed(() => {
    const products = this.business()?.productos || [];
    const active = this.activeCategory();

    if (active === 'all') {
      return products;
    }

    return products.filter(product => this.productCategoryKey(product) === active);
  });
  productsPageUrl = computed(() => this.config()?.productsPageUrl || '');
  shouldShowProductsPageLink = computed(() => !!this.productsPageUrl());

  heroStats = computed<TemplateThreeStat[]>(() => {
    const customStats = this.config()?.stats;
    if (customStats?.length) {
      return customStats;
    }

    const sectionStats = this.heroSection()?.content.stats;
    if (sectionStats?.length) {
      return sectionStats;
    }

    return [
      { value: `${Math.max(1, this.categories().length)}+`, label: 'Categorías destacadas' },
      { value: `${Math.max(1, this.business()?.productos?.length || 0)}+`, label: 'Platos en carta' },
      { value: `★ ${this.averageRating()}`, label: 'Valoración promedio' },
      { value: '500+', label: 'Clientes satisfechos' }
    ];
  });

  aboutFeatures = computed<TemplateThreeFeature[]>(() => {
    const customFeatures = this.config()?.features;
    if (customFeatures?.length) {
      return customFeatures;
    }

    const sectionFeatures = this.aboutSection()?.content.features;
    if (sectionFeatures?.length) {
      return sectionFeatures.map(feature => ({
        title: feature.label,
        description: feature.detail
      }));
    }

    return [
      { title: 'Ingredientes frescos', description: 'Seleccionados a diario' },
      { title: 'Ambiente único', description: 'Un espacio con carácter propio' },
      { title: 'Cocina auténtica', description: 'Sabores con identidad' },
      { title: 'Servicio excepcional', description: 'Atención personalizada' }
    ];
  });

  testimonials = computed<TemplateThreeTestimonial[]>(() => {
    const customTestimonials = this.config()?.testimonials;
    if (customTestimonials?.length) {
      return customTestimonials;
    }

    const sectionTestimonials = this.testimonialsSection()?.content.items;
    if (sectionTestimonials?.length) {
      return sectionTestimonials;
    }

    const businessName = this.brandName();
    return [
      {
        name: 'María González',
        role: 'Cliente frecuente · Lima',
        text: `La mejor experiencia que he tenido en un restobar en Lima. ${businessName} tiene platos increíbles y un ambiente muy acogedor.`,
        rating: 5
      },
      {
        name: 'Carlos Ríos',
        role: 'Gastronómico local · Miraflores',
        text: `El sabor y la atención hacen que ${businessName} sea un lugar al que siempre quiero volver.`,
        rating: 5
      },
      {
        name: 'Diego Morales',
        role: 'Visita especial · San Isidro',
        text: `Celebramos una ocasión especial y todo salió perfecto. La comida y la experiencia superaron nuestras expectativas.`,
        rating: 4.5
      }
    ];
  });

  galleryImages = computed<TemplateThreeGalleryItem[]>(() => {
    const customGallery = this.config()?.galleryImages;
    if (customGallery?.length) {
      return customGallery;
    }

    const sectionGallery = this.gallerySection()?.content.items;
    if (sectionGallery?.length) {
      return sectionGallery.map(image => ({
        url: image.url,
        alt: image.alt,
        caption: image.caption || image.alt
      }));
    }

    const businessImages = this.business()?.imagenes?.map((image, index) => ({
      url: image.urlImagen,
      alt: image.descripcion || `${this.brandName()} ${index + 1}`,
      caption: image.descripcion || 'Momentos y sabores'
    })) || [];

    if (businessImages.length > 0) {
      return businessImages.slice(0, 8);
    }

    return (this.business()?.productos || []).slice(0, 8).map((product, index) => ({
      url: product.urlImagen || this.fallbackProductImage(),
      alt: product.nombre || `${this.brandName()} ${index + 1}`,
      caption: product.nombre || 'Especialidad de la casa'
    }));
  });

  socialLinks = computed(() => {
    const business = this.business();
    return [
      { label: 'Instagram', url: business?.instagram, icon: '📷', meta: business?.instagram || '@negocio' },
      { label: 'Facebook', url: business?.facebook, icon: '👥', meta: business?.facebook || this.brandName() },
      { label: 'TikTok', url: business?.tiktok, icon: '🎵', meta: business?.tiktok || `@${this.slugify(this.brandName())}` },
      { label: 'Twitter', url: business?.twitter, icon: '🐦', meta: business?.twitter || '@negocio' }
    ].filter(link => !!link.url);
  });

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.isEmbeddedMobile()) {
      return;
    }

    this.navScrolled.set(window.scrollY > 50);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (window.innerWidth > 768 && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  setActiveCategory(category: string) {
    this.activeCategory.set(category);
  }

  updateReservationField(field: keyof ReservationFormState, value: string) {
    this.reservationForm.update(current => ({ ...current, [field]: value }));
  }

  handleReservation() {
    this.reservationSubmitted.set(true);
    setTimeout(() => {
      this.reservationSubmitted.set(false);
    }, 4000);
  }

  asHeroSection(section: TemplateThreeSectionData): TemplateThreeHeroSection | null {
    return section.type === 'hero' ? section : null;
  }

  asAboutSection(section: TemplateThreeSectionData): TemplateThreeAboutSection | null {
    return section.type === 'about_us' ? section : null;
  }

  asMenuSection(section: TemplateThreeSectionData): TemplateThreeMenuSection | null {
    return section.type === 'menu' ? section : null;
  }

  asGallerySection(section: TemplateThreeSectionData): TemplateThreeGallerySection | null {
    return section.type === 'gallery' ? section : null;
  }

  asVideoSection(section: TemplateThreeSectionData): TemplateThreeVideoSection | null {
    return section.type === 'videos' ? section : null;
  }

  asTestimonialsSection(section: TemplateThreeSectionData): TemplateThreeTestimonialsSection | null {
    return section.type === 'testimonials' ? section : null;
  }

  asReservationSection(section: TemplateThreeSectionData): TemplateThreeReservationSection | null {
    return section.type === 'reservation' ? section : null;
  }

  asContactSection(section: TemplateThreeSectionData): TemplateThreeContactSection | null {
    return section.type === 'contact' ? section : null;
  }

  asFooterSection(section: TemplateThreeSectionData): TemplateThreeFooterSection | null {
    return section.type === 'footer' ? section : null;
  }

  sectionAnchorId(section: TemplateThreeSectionData, index: number): string {
    return section.id || `section-${index}`;
  }

  sectionHref(section: TemplateThreeSectionData): string {
    const index = this.sections().findIndex(item => item === section);
    return `#${this.sectionAnchorId(section, index >= 0 ? index : 0)}`;
  }

  sectionHrefByType(type: TemplateThreeSectionData['type']): string {
    const index = this.sections().findIndex(section => section.type === type);
    if (index < 0) {
      return '#';
    }

    return `#${this.sectionAnchorId(this.sections()[index], index)}`;
  }

  navigateToHash(hash: string, event?: Event): void {
    if (!hash.startsWith('#')) {
      return;
    }

    event?.preventDefault();
    this.closeMobileMenu();

    const targetId = decodeURIComponent(hash.slice(1));
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
      return;
    }

    if (this.isEmbeddedMobile()) {
      const scrollContainer = this.hostElement.nativeElement.closest('.mi-sitio-preview-phone-screen') as HTMLElement | null;

      if (scrollContainer) {
        const headerOffset = 64;
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const targetPosition = targetRect.top - containerRect.top + scrollContainer.scrollTop - headerOffset;

        scrollContainer.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        return;
      }
    }

    const headerOffset = 88;
    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    window.history.replaceState(null, '', hash);
  }

  navigateToSection(section: TemplateThreeSectionData, event?: Event): void {
    this.navigateToHash(this.sectionHref(section), event);
  }

  navigateToSectionByType(type: TemplateThreeSectionData['type'], event?: Event): void {
    this.navigateToHash(this.sectionHrefByType(type), event);
  }

  sectionNavLabel(section: TemplateThreeSectionData): string {
    switch (section.type) {
      case 'hero':
        return 'Inicio';
      case 'about_us':
        return section.content.title;
      case 'menu':
        return section.content.title;
      case 'gallery':
        return section.content.title;
      case 'videos':
        return section.content.title;
      case 'testimonials':
        return section.content.title;
      case 'reservation':
        return section.content.title;
      case 'contact':
        return section.content.title;
      case 'footer':
        return 'Footer';
    }
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
    return product?.categoria?.descripcion || this.categories().find(category => this.categoryKey(category) === this.productCategoryKey(product))?.descripcion || 'Especialidad';
  }

  productsForCategory(category: any): any[] {
    return (this.business()?.productos || []).filter(product => this.productCategoryKey(product) === this.categoryKey(category));
  }

  fallbackProductImage(): string {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
  }

  menuItemFallbackDescription(): string {
    return 'Preparado con los mejores ingredientes de la casa.';
  }

  experienceCardValue(): string {
    return this.aboutSection()?.content.image_highlight.badge_text || this.heroStats()[0]?.value || '5+';
  }

  experienceCardLabel(): string {
    return this.heroStats()[0]?.label || 'Años de experiencia';
  }

  ratingCardValue(): string {
    return `★ ${this.aboutSection()?.content.image_highlight.rating?.toFixed(1) || this.averageRating()}`;
  }

  ratingCardLabel(): string {
    return 'Valoración';
  }

  averageRating(): string {
    const items = this.testimonials();
    if (!items.length) {
      return '4.8';
    }

    const average = items.reduce((acc, item) => acc + item.rating, 0) / items.length;
    return average.toFixed(1);
  }

  ratingSummaryText(): string {
    return this.testimonialsSection()?.content.summary_text || `Calificación promedio basada en ${Math.max(50, this.testimonials().length * 50)} reseñas`;
  }

  starsFor(value: number | string): string {
    const numericValue = Number(value);
    const rounded = Math.round(numericValue);
    return '★'.repeat(Math.min(5, Math.max(1, rounded)));
  }

  initialsFor(name: string): string {
    return name.split(' ').slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  }

  openingHoursLines(): string[] {
    return this.contactSection()?.content.hours || this.config()?.openingHours || [
      'Lun–Jue: 12:00 – 22:00',
      'Vie–Sáb: 12:00 – 00:00',
      'Dom: 12:00 – 20:00'
    ];
  }

  openingHoursText(): string {
    return this.openingHoursLines().join(' · ');
  }

  whatsappProductLink(product: any): string {
    const whatsapp = this.whatsappUrl();
    if (!whatsapp) {
      return '#';
    }

    const message = encodeURIComponent(`Hola, quiero pedir ${product?.nombre || 'este producto'} en ${this.brandName()}.`);
    return `${whatsapp}?text=${message}`;
  }

  productsPageTarget(): '_blank' | '_self' {
    return this.isEmbeddedMobile() ? '_blank' : '_self';
  }

  canUseCart(): boolean {
    return !this.isEmbeddedMobile() && !!this.addToCart();
  }

  onAddToCart(product: any) {
    this.addToCart()?.(product);
  }

  onRemoveFromCart(itemId: number) {
    this.removeFromCart()?.(itemId);
  }

  onUpdateQuantity(itemId: number, change: number) {
    this.updateQuantity()?.(itemId, change);
  }

  onToggleCart() {
    this.toggleCart()?.();
  }

  onCheckout() {
    this.checkout()?.();
  }

  safeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.toVideoEmbedUrl(url));
  }

  private adjustColor(hex: string, amount: number): string {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return hex;
    }

    const num = parseInt(normalized, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  private hexToRgb(hex: string): string {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return '74, 47, 39';
    }

    const num = parseInt(normalized, 16);
    const r = num >> 16;
    const g = (num >> 8) & 0x00ff;
    const b = num & 0x0000ff;
    return `${r}, ${g}, ${b}`;
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '').trim() || 'negocio';
  }

  private toVideoEmbedUrl(url: string): string {
    if (!url) {
      return '';
    }

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
}
