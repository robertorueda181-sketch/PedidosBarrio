import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TemplateThreeComponent } from '../../../pages/company/templates/template3/template3';
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
} from '../../../pages/company/templates/template3/template3-content';
import { EmpresaService } from '../../../shared/services/empresa.service';
import { NegocioDetalle } from '../../../shared/services/negocio.service';
import { ProductoService } from '../../../shared/services/producto.service';

type EditableOptionalSection = 'menu' | 'gallery' | 'videos' | 'testimonials' | 'reservation' | 'contact';
type EditorSectionKey = 'branding' | TemplateThreeSectionData['type'];

interface PreviewStyles {
  bannerColor: string;
  textColor: string;
  fontFamily: string;
  mutedTextColor?: string;
}

interface SiteBuilderDraft {
  pageData: TemplateThreePageData;
  business: NegocioDetalle;
  savedAt: string | null;
}

interface EditorSectionOption {
  key: EditorSectionKey;
  label: string;
  description: string;
  toggleable: boolean;
}

@Component({
  selector: 'app-sitio-web',
  imports: [CommonModule, FormsModule, TemplateThreeComponent],
  templateUrl: './sitio-web.html',
  styleUrl: './sitio-web.css'
})
export class SitioWeb {
  private readonly storageKey = 'empresa_mi_sitio_template3';
  private readonly inlinePreviewMinWidth = 1600;
  private readonly mobilePreviewMaxWidth = 767;
  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);
  private readonly productoService = inject(ProductoService);
  private readonly sectionOrder: TemplateThreeSectionData['type'][] = [
    'hero',
    'about_us',
    'menu',
    'gallery',
    'videos',
    'testimonials',
    'reservation',
    'contact',
    'footer'
  ];

  private readonly initialDraft = this.loadDraft();

  readonly isMobilePreviewOpen = signal(false);
  readonly selectedEditorSection = signal<EditorSectionKey>('branding');
  readonly pageData = signal<TemplateThreePageData>(this.initialDraft.pageData);
  readonly previewBusiness = signal<NegocioDetalle>(this.initialDraft.business);
  readonly lastSavedAt = signal<string | null>(this.initialDraft.savedAt);
  readonly viewportWidth = signal(typeof window !== 'undefined' ? window.innerWidth : this.inlinePreviewMinWidth);

  readonly sectionOptions: Array<{ type: EditableOptionalSection; label: string; description: string }> = [
    { type: 'menu', label: 'Productos', description: 'Muestra la carta y categorías del negocio.' },
    { type: 'gallery', label: 'Galería', description: 'Agrega o quita imágenes destacadas.' },
    { type: 'videos', label: 'Videos', description: 'Inserta videos de YouTube o Vimeo.' },
    { type: 'testimonials', label: 'Testimonios', description: 'Comparte reseñas de clientes.' },
    { type: 'reservation', label: 'Reservas', description: 'Permite reservar desde la landing.' },
    { type: 'contact', label: 'Contacto', description: 'Muestra datos de contacto y mapa.' }
  ];

  readonly editorSections: EditorSectionOption[] = [
    { key: 'branding', label: 'General', description: 'Marca, colores y datos principales.', toggleable: false },
    { key: 'hero', label: 'Hero', description: 'Primera sección, CTAs y métricas.', toggleable: false },
    { key: 'about_us', label: 'Sobre nosotros', description: 'Historia, beneficios e imagen destacada.', toggleable: false },
    { key: 'menu', label: 'Productos', description: 'Carta, categorías y botón de pedido.', toggleable: true },
    { key: 'gallery', label: 'Galería', description: 'Fotos destacadas del negocio.', toggleable: true },
    { key: 'videos', label: 'Videos', description: 'Clips promocionales o testimoniales.', toggleable: true },
    { key: 'testimonials', label: 'Testimonios', description: 'Reseñas y puntuaciones de clientes.', toggleable: true },
    { key: 'reservation', label: 'Reservas', description: 'Formulario y opciones del booking.', toggleable: true },
    { key: 'contact', label: 'Contacto', description: 'Datos, horarios y textos auxiliares.', toggleable: true },
    { key: 'footer', label: 'Footer', description: 'Cierre del sitio y textos finales.', toggleable: false }
  ];

  readonly selectedEditorMeta = computed(() => this.editorSections.find(section => section.key === this.selectedEditorSection()) || this.editorSections[0]);
  readonly isInlinePreviewVisible = computed(() => this.viewportWidth() >= this.inlinePreviewMinWidth);
  readonly shouldOpenPreviewInNewTab = computed(() => this.viewportWidth() <= this.mobilePreviewMaxWidth);
  readonly shouldUsePreviewPopup = computed(() => !this.isInlinePreviewVisible() && !this.shouldOpenPreviewInNewTab());
  readonly mobilePreviewActionLabel = computed(() => this.shouldOpenPreviewInNewTab() ? 'Abrir preview' : 'Ver mobile');

  readonly heroSection = computed(() => this.findSection('hero') as TemplateThreeHeroSection | null);
  readonly aboutSection = computed(() => this.findSection('about_us') as TemplateThreeAboutSection | null);
  readonly menuSection = computed(() => this.findSection('menu') as TemplateThreeMenuSection | null);
  readonly gallerySection = computed(() => this.findSection('gallery') as TemplateThreeGallerySection | null);
  readonly videoSection = computed(() => this.findSection('videos') as TemplateThreeVideoSection | null);
  readonly testimonialsSection = computed(() => this.findSection('testimonials') as TemplateThreeTestimonialsSection | null);
  readonly reservationSection = computed(() => this.findSection('reservation') as TemplateThreeReservationSection | null);
  readonly contactSection = computed(() => this.findSection('contact') as TemplateThreeContactSection | null);
  readonly footerSection = computed(() => this.findSection('footer') as TemplateThreeFooterSection | null);

  readonly previewStyles = computed<PreviewStyles>(() => ({
    bannerColor: this.pageData().theme.colors.primary,
    textColor: this.pageData().theme.colors.text_main,
    fontFamily: this.pageData().theme.typography.font_family_body,
    mutedTextColor: this.pageData().theme.colors.text_main
  }));

  readonly previewConfig = computed(() => ({
    brandName: this.previewBusiness().nombre,
    logoUrl: this.previewBusiness().logoUrl || (this.previewBusiness() as any)?.urlLogo,
    productsPageUrl: this.previewProductsUrl(),
    reservationPhone: this.previewBusiness().whatsapp || this.previewBusiness().telefono || '+51 999 999 999',
    openingHours: this.contactSection()?.content.hours || []
  }));

  readonly previewWhatsappUrl = computed(() => {
    const whatsapp = this.previewBusiness().whatsapp?.replace(/\D/g, '');
    return whatsapp ? `https://wa.me/${whatsapp}` : null;
  });

  readonly previewProductsUrl = computed(() => this.buildHashUrl('/empresa/sitio/preview/productos'));

  readonly previewWebUrl = computed(() => this.buildHashUrl('/empresa/sitio/preview'));

  ngOnInit() {
    this.loadConfiguredBusinessData();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (typeof window === 'undefined') {
      return;
    }

    this.viewportWidth.set(window.innerWidth);

    if ((this.isInlinePreviewVisible() || this.shouldOpenPreviewInNewTab()) && this.isMobilePreviewOpen()) {
      this.closeMobilePreview();
    }
  }

  openMobilePreview() {
    this.persistDraft();

    if (this.shouldOpenPreviewInNewTab()) {
      this.openWebPreview();
      return;
    }

    if (this.isInlinePreviewVisible()) {
      this.scrollToInlinePreview();
      return;
    }

    this.isMobilePreviewOpen.set(true);
  }

  closeMobilePreview() {
    this.isMobilePreviewOpen.set(false);
  }

  scrollToInlinePreview() {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById('mi-sitio-inline-preview')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  openWebPreview() {
    this.persistDraft();

    if (typeof window === 'undefined') {
      return;
    }

    const link = document.createElement('a');
    link.href = this.previewWebUrl();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  saveDraft() {
    this.persistDraft();
  }

  openProductsManager(mode: 'new' | 'edit' | 'list' = 'list', product?: any) {
    this.persistDraft();

    const queryParams: Record<string, string | number> = {};

    if (mode === 'new') {
      queryParams['openNew'] = 'true';

      if (this.previewBusiness().categorias?.length) {
        queryParams['categoryId'] = this.previewBusiness().categorias[0].categoriaID;
      }
    }

    if (mode === 'edit' && product?.productoID) {
      queryParams['editProductId'] = product.productoID;

      if (product?.categoriaID) {
        queryParams['categoryId'] = product.categoriaID;
      }
    }

    this.router.navigate(['/empresa', 'productos'], { queryParams });
  }

  selectEditorSection(key: EditorSectionKey) {
    if (!this.isEditorSectionEnabled(key)) {
      return;
    }

    this.selectedEditorSection.set(key);
  }

  isEditorSectionEnabled(key: EditorSectionKey): boolean {
    if (key === 'branding' || key === 'hero' || key === 'about_us' || key === 'footer') {
      return true;
    }

    return this.hasSection(key as EditableOptionalSection);
  }

  isEditorSectionSelected(key: EditorSectionKey): boolean {
    return this.selectedEditorSection() === key;
  }

  private persistDraft() {
    if (typeof window === 'undefined') {
      return;
    }

    const savedAt = new Date().toISOString();
    const payload: SiteBuilderDraft = {
      pageData: this.pageData(),
      business: this.previewBusiness(),
      savedAt
    };

    localStorage.setItem(this.storageKey, JSON.stringify(payload));
    this.lastSavedAt.set(savedAt);
  }

  resetDraft() {
    const draft = this.buildDefaultDraft();
    this.pageData.set(draft.pageData);
    this.previewBusiness.set(draft.business);
    this.lastSavedAt.set(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  hasSection(type: EditableOptionalSection): boolean {
    return !!this.findSection(type);
  }

  toggleSection(type: EditableOptionalSection, enabled: boolean) {
    const exists = this.hasSection(type);
    if (enabled === exists) {
      return;
    }

    this.patchPageData(draft => {
      if (enabled) {
        const newSection = this.createSection(type);
        const targetOrder = this.sectionOrder.indexOf(type);
        const insertAt = draft.sections.findIndex(section => this.sectionOrder.indexOf(section.type) > targetOrder);

        if (insertAt === -1) {
          draft.sections.push(newSection);
        } else {
          draft.sections.splice(insertAt, 0, newSection);
        }
        return;
      }

      draft.sections = draft.sections.filter(section => section.type !== type);
    });

    if (enabled) {
      this.selectedEditorSection.set(type);
      return;
    }

    if (this.selectedEditorSection() === type) {
      this.selectedEditorSection.set('branding');
    }
  }

  updateThemeColor(colorKey: keyof TemplateThreePageData['theme']['colors'], value: string) {
    this.patchPageData(draft => {
      draft.theme.colors[colorKey] = value;
    });
  }

  updateBusinessField(field: keyof NegocioDetalle, value: string) {
    this.patchBusiness(draft => {
      (draft[field] as any) = value;
    });
  }

  async uploadBusinessImage(event: Event, field: 'urlBanner' | 'logoUrl') {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    const dataUrl = await this.optimizeImageFile(file, field);
    this.updateBusinessField(field, dataUrl);

    if (input) {
      input.value = '';
    }
  }

  clearBusinessImage(field: 'urlBanner' | 'logoUrl') {
    this.updateBusinessField(field, '');
  }

  async uploadAboutHighlightImage(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    const dataUrl = await this.optimizeImageFile(file, 'aboutImage');
    this.updateAboutHighlight('url', dataUrl);

    if (input) {
      input.value = '';
    }
  }

  clearAboutHighlightImage() {
    this.updateAboutHighlight('url', '');
  }

  updateHeroField(field: 'title' | 'subtitle' | 'overline', value: string) {
    this.patchSection('hero', section => {
      section.content[field] = value;
    });
  }

  updateAboutField(field: 'title' | 'description' | 'secondary_description' | 'overline', value: string) {
    this.patchSection('about_us', section => {
      section.content[field] = value;
    });
  }

  updateHeroCta(cta: 'primary_cta' | 'secondary_cta', field: 'text' | 'link', value: string) {
    this.patchSection('hero', section => {
      section.content[cta][field] = value;
    });
  }

  updateHeroStat(index: number, field: 'value' | 'label', value: string) {
    this.patchSection('hero', section => {
      section.content.stats[index][field] = value;
    });
  }

  addHeroStat() {
    this.patchSection('hero', section => {
      section.content.stats.push({ value: '0', label: 'Nueva métrica' });
    });
  }

  removeHeroStat(index: number) {
    this.patchSection('hero', section => {
      section.content.stats.splice(index, 1);
    });
  }

  updateAboutFeature(index: number, field: 'label' | 'detail', value: string) {
    this.patchSection('about_us', section => {
      section.content.features[index][field] = value;
    });
  }

  addAboutFeature() {
    this.patchSection('about_us', section => {
      section.content.features.push({ label: 'Nuevo valor', detail: 'Describe este diferencial' });
    });
  }

  removeAboutFeature(index: number) {
    this.patchSection('about_us', section => {
      section.content.features.splice(index, 1);
    });
  }

  updateAboutHighlight(field: 'url' | 'badge_text', value: string) {
    this.patchSection('about_us', section => {
      section.content.image_highlight[field] = value;
    });
  }

  updateAboutHighlightRating(value: string) {
    this.patchSection('about_us', section => {
      section.content.image_highlight.rating = Number(value) || 0;
    });
  }

  updateAboutCta(field: 'text' | 'link', value: string) {
    this.patchSection('about_us', section => {
      section.content.cta[field] = value;
    });
  }

  updateMenuField(field: keyof TemplateThreeMenuSection['content'], value: string) {
    this.patchSection('menu', section => {
      (section.content[field] as any) = value;
    });
  }

  updateContactHour(index: number, value: string) {
    this.patchSection('contact', section => {
      section.content.hours[index] = value;
    });
  }

  addContactHour() {
    this.patchSection('contact', section => {
      section.content.hours.push('Nuevo horario');
    });
  }

  removeContactHour(index: number) {
    this.patchSection('contact', section => {
      section.content.hours.splice(index, 1);
    });
  }

  addGalleryItem() {
    this.patchSection('gallery', section => {
      section.content.items.push({
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
        alt: 'Nueva imagen',
        caption: 'Agrega una descripción atractiva'
      });
    });
  }

  updateGalleryItem(index: number, field: 'url' | 'alt' | 'caption', value: string) {
    this.patchSection('gallery', section => {
      (section.content.items[index][field] as any) = value;
    });
  }

  updateGalleryField(field: 'title' | 'description' | 'overline', value: string) {
    this.patchSection('gallery', section => {
      section.content[field] = value;
    });
  }

  removeGalleryItem(index: number) {
    this.patchSection('gallery', section => {
      section.content.items.splice(index, 1);
    });
  }

  addVideoItem() {
    this.patchSection('videos', section => {
      section.content.items.push({
        url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
        title: 'Nuevo video',
        description: 'Describe qué verá tu cliente en este video.'
      });
    });
  }

  updateVideoItem(index: number, field: 'url' | 'title' | 'description', value: string) {
    this.patchSection('videos', section => {
      (section.content.items[index][field] as any) = value;
    });
  }

  updateVideoField(field: 'title' | 'description' | 'overline', value: string) {
    this.patchSection('videos', section => {
      section.content[field] = value;
    });
  }

  removeVideoItem(index: number) {
    this.patchSection('videos', section => {
      section.content.items.splice(index, 1);
    });
  }

  updateTestimonialsField(field: 'title' | 'summary_text' | 'overline', value: string) {
    this.patchSection('testimonials', section => {
      section.content[field] = value;
    });
  }

  addTestimonial() {
    this.patchSection('testimonials', section => {
      section.content.items.push({
        name: 'Nuevo cliente',
        role: 'Cliente satisfecho',
        text: 'Comparte aquí una experiencia memorable.',
        rating: 5
      });
    });
  }

  updateTestimonialItem(index: number, field: 'name' | 'role' | 'text', value: string) {
    this.patchSection('testimonials', section => {
      section.content.items[index][field] = value;
    });
  }

  updateTestimonialRating(index: number, value: string) {
    this.patchSection('testimonials', section => {
      section.content.items[index].rating = Number(value) || 0;
    });
  }

  removeTestimonial(index: number) {
    this.patchSection('testimonials', section => {
      section.content.items.splice(index, 1);
    });
  }

  updateReservationField(
    field:
      | 'title'
      | 'description'
      | 'overline'
      | 'name_placeholder'
      | 'phone_placeholder'
      | 'guests_placeholder'
      | 'occasion_placeholder'
      | 'notes_placeholder'
      | 'submit_text'
      | 'success_text'
      | 'help_text',
    value: string
  ) {
    this.patchSection('reservation', section => {
      section.content[field] = value;
    });
  }

  updateReservationOption(list: 'guest_options' | 'occasion_options', index: number, value: string) {
    this.patchSection('reservation', section => {
      section.content[list][index] = value;
    });
  }

  addReservationOption(list: 'guest_options' | 'occasion_options', value: string) {
    this.patchSection('reservation', section => {
      section.content[list].push(value);
    });
  }

  removeReservationOption(list: 'guest_options' | 'occasion_options', index: number) {
    this.patchSection('reservation', section => {
      section.content[list].splice(index, 1);
    });
  }

  updateContactField(
    field:
      | 'title'
      | 'overline'
      | 'social_title'
      | 'address_label'
      | 'phone_label'
      | 'email_label'
      | 'hours_label'
      | 'map_fallback_text'
      | 'default_address'
      | 'default_phone'
      | 'default_email',
    value: string
  ) {
    this.patchSection('contact', section => {
      section.content[field] = value;
    });
  }

  updateFooterField(
    field:
      | 'navigation_title'
      | 'hours_title'
      | 'contact_title'
      | 'description'
      | 'reservation_text'
      | 'copyright_text'
      | 'credit_text',
    value: string
  ) {
    this.patchSection('footer', section => {
      section.content[field] = value;
    });
  }

  addProduct() {
    this.patchBusiness(draft => {
      const nextId = Math.max(0, ...draft.productos.map((product: any) => Number(product.productoID) || 0)) + 1;
      draft.productos.push({
        productoID: nextId,
        categoriaID: 1,
        nombre: 'Nuevo producto',
        descripcion: 'Describe aquí tu producto estrella.',
        precio: 25,
        stock: 20,
        urlImagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        categoria: {
          categoriaID: 1,
          descripcion: 'Especialidades',
          codigo: 'especialidades'
        }
      });
      return this.normalizeBusiness(draft);
    });
  }

  updateProductField(index: number, field: 'nombre' | 'descripcion' | 'urlImagen', value: string) {
    this.patchBusiness(draft => {
      draft.productos[index][field] = value;
      return this.normalizeBusiness(draft);
    });
  }

  updateProductPrice(index: number, value: string) {
    this.patchBusiness(draft => {
      draft.productos[index].precio = Number(value) || 0;
      return this.normalizeBusiness(draft);
    });
  }

  updateProductCategory(index: number, value: string) {
    this.patchBusiness(draft => {
      draft.productos[index].categoria = {
        ...(draft.productos[index].categoria || {}),
        descripcion: value
      };
      return this.normalizeBusiness(draft);
    });
  }

  removeProduct(index: number) {
    this.patchBusiness(draft => {
      draft.productos.splice(index, 1);
      return this.normalizeBusiness(draft);
    });
  }

  private loadDraft(): SiteBuilderDraft {
    if (typeof window === 'undefined') {
      return this.buildDefaultDraft();
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return this.buildDefaultDraft();
    }

    try {
      const draft = JSON.parse(raw) as SiteBuilderDraft;
      return {
        pageData: draft.pageData || this.deepClone(TEMPLATE_THREE_STATIC_CONTENT),
        business: this.normalizeBusiness(draft.business || this.buildDefaultBusiness()),
        savedAt: draft.savedAt || null
      };
    } catch {
      return this.buildDefaultDraft();
    }
  }

  private buildDefaultDraft(): SiteBuilderDraft {
    return {
      pageData: this.deepClone(TEMPLATE_THREE_STATIC_CONTENT),
      business: this.buildDefaultBusiness(),
      savedAt: null
    };
  }

  private buildDefaultBusiness(): NegocioDetalle {
    return this.normalizeBusiness({
      empresaID: 'preview-demo',
      nombre: 'Mi Restobar Demo',
      descripcion: 'Personaliza tu template 3 desde el panel admin y mira los cambios en vivo.',
      email: 'hola@misitio.com',
      telefono: '987654321',
      direccion: 'Av. Principal 456, Lima',
      referencia: 'Frente al parque central',
      urlBanner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80',
      logoUrl: 'https://dummyimage.com/240x240/111827/ffffff&text=LOGO',
      facebook: 'https://facebook.com/misitio.demo',
      instagram: 'https://instagram.com/misitio.demo',
      twitter: 'https://x.com/misitio_demo',
      tiktok: 'https://tiktok.com/@misitio.demo',
      whatsapp: '51987654321',
      productos: [
        {
          productoID: 1,
          categoriaID: 1,
          nombre: 'Lomo saltado de la casa',
          descripcion: 'Corte jugoso salteado al wok con papas crocantes.',
          precio: 36,
          stock: 20,
          urlImagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
          categoria: { categoriaID: 1, descripcion: 'Fondos', codigo: 'fondos' }
        },
        {
          productoID: 2,
          categoriaID: 2,
          nombre: 'Ceviche clásico',
          descripcion: 'Pescado fresco, leche de tigre y cancha crocante.',
          precio: 34,
          stock: 20,
          urlImagen: 'https://images.unsplash.com/photo-1604908554007-93bb2d8d0c1f?w=800&q=80',
          categoria: { categoriaID: 2, descripcion: 'Entradas', codigo: 'entradas' }
        },
        {
          productoID: 3,
          categoriaID: 3,
          nombre: 'Cheesecake de frutos rojos',
          descripcion: 'Postre cremoso con base crocante y topping natural.',
          precio: 19,
          stock: 20,
          urlImagen: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
          categoria: { categoriaID: 3, descripcion: 'Postres', codigo: 'postres' }
        }
      ],
      categorias: []
    });
  }

  private patchPageData(mutator: (draft: TemplateThreePageData) => void) {
    const draft = this.deepClone(this.pageData());
    mutator(draft);
    this.pageData.set(draft);
  }

  private patchBusiness(mutator: (draft: NegocioDetalle) => NegocioDetalle | void) {
    const draft = this.deepClone(this.previewBusiness());
    const result = mutator(draft);
    this.previewBusiness.set(result || draft);
  }

  private patchSection(type: TemplateThreeSectionData['type'], mutator: (section: any) => void) {
    this.patchPageData(draft => {
      const section = draft.sections.find(item => item.type === type);
      if (!section) {
        return;
      }
      mutator(section as any);
    });
  }

  private findSection(type: TemplateThreeSectionData['type']): TemplateThreeSectionData | null {
    return this.pageData().sections.find(section => section.type === type) || null;
  }

  private createSection(type: EditableOptionalSection): TemplateThreeSectionData {
    const section = TEMPLATE_THREE_STATIC_CONTENT.sections.find(item => item.type === type);
    if (section) {
      return this.deepClone(section);
    }

    throw new Error(`No default section found for ${type}`);
  }

  private normalizeBusiness(business: NegocioDetalle): NegocioDetalle {
    const categoryMap = new Map<string, number>();
    const categorias: any[] = [];

    const productos = (business.productos || []).map((product: any, index: number) => {
      const categoryName = product?.categoria?.descripcion || `Categoría ${index + 1}`;
      const normalizedCategoryName = String(categoryName).trim() || 'Especialidades';

      if (!categoryMap.has(normalizedCategoryName)) {
        const categoryId = categoryMap.size + 1;
        categoryMap.set(normalizedCategoryName, categoryId);
        categorias.push({
          categoriaID: categoryId,
          descripcion: normalizedCategoryName,
          codigo: this.slugify(normalizedCategoryName),
          mostrar: true
        });
      }

      const categoryId = categoryMap.get(normalizedCategoryName)!;

      return {
        ...product,
        productoID: product.productoID || index + 1,
        categoriaID: categoryId,
        categoria: {
          categoriaID: categoryId,
          descripcion: normalizedCategoryName,
          codigo: this.slugify(normalizedCategoryName)
        }
      };
    });

    return {
      ...business,
      productos,
      categorias
    };
  }

  private loadConfiguredBusinessData() {
    this.empresaService.getSede().subscribe({
      next: profile => {
        const empresaID = profile?.empresaID || this.previewBusiness().empresaID;

        if (!empresaID) {
          return;
        }

        forkJoin({
          catalog: this.productoService.getCategoriasConProductos(),
          products: this.productoService.getProductosByEmpresa(empresaID)
        }).subscribe({
          next: ({ catalog, products }) => {
            const configuredBusiness = this.mapConfiguredBusiness(profile, catalog, products);
            const merged = this.mergeDraftWithConfiguredBusiness(this.previewBusiness(), configuredBusiness);
            this.previewBusiness.set(merged);
            this.persistDraft();
          },
          error: error => {
            console.error('No se pudo sincronizar productos de Mi Sitio:', error);
          }
        });
      },
      error: error => {
        console.error('No se pudo sincronizar Mi Sitio con la configuración del negocio:', error);
      }
    });
  }

  private mapConfiguredBusiness(profile: any, catalog: any, products: any[]): NegocioDetalle {
    const usedCategoryIds = new Set((products || []).map((producto: any) => producto.categoriaID).filter((id: any) => id != null));
    const categorias = (catalog?.categorias || [])
      .filter((categoria: any) => usedCategoryIds.size === 0 || usedCategoryIds.has(categoria.categoriaID))
      .map((categoria: any) => ({
        categoriaID: categoria.categoriaID,
        descripcion: categoria.descripcion,
        codigo: categoria.codigo || this.slugify(categoria.descripcion || 'categoria'),
        mostrar: categoria.mostrar ?? categoria.activo ?? true
      }));

    const categoryMap = new Map<number, any>(categorias.map((categoria: any) => [categoria.categoriaID, categoria]));

    const productos = (products || []).map((producto: any, index: number) => {
      const categoria = categoryMap.get(producto.categoriaID) || {
        categoriaID: producto.categoriaID || index + 1,
        descripcion: producto.categoria || 'Especialidades',
        codigo: this.slugify(producto.categoria || 'especialidades'),
        mostrar: true
      };

      return {
        productoID: producto.productoID,
        categoriaID: categoria.categoriaID,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precioActual || producto.precio || 0,
        stock: producto.stock || 0,
        urlImagen: producto.imagenPrincipal || producto.urlImagen || this.fallbackProductImage(),
        categoria
      };
    });

    return this.normalizeBusiness({
      empresaID: profile?.empresaID || this.previewBusiness().empresaID || 'preview-demo',
      nombre: profile?.nombre || this.previewBusiness().nombre,
      descripcion: profile?.descripcion || this.previewBusiness().descripcion,
      email: profile?.email || this.previewBusiness().email,
      telefono: (profile?.telefonoPrincipal || profile?.telefono || this.previewBusiness().telefono || '').toString().trim(),
      direccion: profile?.direccion || this.previewBusiness().direccion,
      referencia: profile?.referencia || this.previewBusiness().referencia,
      urlBanner: profile?.urlBanner || this.previewBusiness().urlBanner,
      logoUrl: profile?.logoUrl || profile?.urlLogo || this.previewBusiness().logoUrl,
      facebook: profile?.facebook || this.previewBusiness().facebook,
      instagram: profile?.instagram || this.previewBusiness().instagram,
      twitter: profile?.twitter || this.previewBusiness().twitter,
      tiktok: profile?.tiktok || this.previewBusiness().tiktok,
      whatsapp: (profile?.whatsapp || this.previewBusiness().whatsapp || '').toString().trim(),
      productos,
      categorias,
      imagenes: this.previewBusiness().imagenes || [],
      videos: this.previewBusiness().videos || [],
      secciones: this.previewBusiness().secciones || []
    });
  }

  private mergeDraftWithConfiguredBusiness(draftBusiness: NegocioDetalle, configuredBusiness: NegocioDetalle): NegocioDetalle {
    return this.normalizeBusiness({
      ...configuredBusiness,
      ...draftBusiness,
      productos: configuredBusiness.productos,
      categorias: configuredBusiness.categorias,
      urlBanner: draftBusiness.urlBanner || configuredBusiness.urlBanner,
      logoUrl: draftBusiness.logoUrl || configuredBusiness.logoUrl
    });
  }

  private fallbackProductImage(): string {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  }

  private buildHashUrl(route: string): string {
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;

    if (typeof window === 'undefined') {
      return `#${normalizedRoute}`;
    }

    return `${window.location.origin}${window.location.pathname}#${normalizedRoute}`;
  }

  private deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));

      reader.readAsDataURL(file);
    });
  }

  private async optimizeImageFile(file: File, field: 'urlBanner' | 'logoUrl' | 'aboutImage'): Promise<string> {
    const maxSize = field === 'urlBanner'
      ? { width: 1600, height: 900, quality: 0.82 }
      : field === 'aboutImage'
        ? { width: 1200, height: 1200, quality: 0.86 }
        : { width: 600, height: 600, quality: 0.9 };

    const source = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(source);
    const ratio = Math.min(maxSize.width / image.width, maxSize.height / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return source;
    }

    context.drawImage(image, 0, 0, width, height);

    const optimized = canvas.toDataURL('image/webp', maxSize.quality);
    return optimized || source;
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      image.src = source;
    });
  }

  private slugify(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
}
