import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TemplateThreeComponent } from '../../../pages/company/templates/template3/template3';
import { TEMPLATE_THREE_STATIC_CONTENT, TemplateThreePageData } from '../../../pages/company/templates/template3/template3-content';
import { EmpresaService } from '../../../shared/services/empresa.service';
import { NegocioDetalle } from '../../../shared/services/negocio.service';
import { ProductoService } from '../../../shared/services/producto.service';

interface SiteBuilderDraft {
  pageData: TemplateThreePageData;
  business: NegocioDetalle;
  savedAt: string | null;
}

@Component({
  selector: 'app-sitio-web-preview',
  standalone: true,
  imports: [CommonModule, TemplateThreeComponent],
  templateUrl: './sitio-web-preview.html',
  styleUrl: './sitio-web-preview.css'
})
export class SitioWebPreview {
  private readonly storageKey = 'empresa_mi_sitio_template3';
  private readonly empresaService = inject(EmpresaService);
  private readonly productoService = inject(ProductoService);
  private readonly draft = this.loadDraft();

  readonly pageData = signal<TemplateThreePageData>(this.draft.pageData);
  readonly previewBusiness = signal<NegocioDetalle>(this.draft.business);

  readonly previewStyles = computed(() => ({
    bannerColor: this.pageData().theme.colors.primary,
    textColor: this.pageData().theme.colors.text_main,
    fontFamily: this.pageData().theme.typography.font_family_body,
    mutedTextColor: this.pageData().theme.colors.text_main
  }));

  readonly previewConfig = computed(() => ({
    brandName: this.previewBusiness().nombre,
    logoUrl: this.previewBusiness().logoUrl || (this.previewBusiness() as any)?.urlLogo,
    productsPageUrl: this.buildHashUrl('/empresa/sitio/preview/productos'),
    heroImageUrl: this.previewBusiness().urlBanner,
    reservationPhone: this.previewBusiness().whatsapp || this.previewBusiness().telefono || '+51 999 999 999'
  }));

  readonly previewWhatsappUrl = computed(() => {
    const whatsapp = this.previewBusiness().whatsapp?.replace(/\D/g, '');
    return whatsapp ? `https://wa.me/${whatsapp}` : null;
  });

  ngOnInit() {
    this.loadConfiguredBusinessData();
  }

  private loadDraft(): SiteBuilderDraft {
    if (typeof window === 'undefined') {
      return this.buildFallbackDraft();
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return this.buildFallbackDraft();
    }

    try {
      const draft = JSON.parse(raw) as SiteBuilderDraft;
      return {
        pageData: draft.pageData || TEMPLATE_THREE_STATIC_CONTENT,
        business: this.normalizeBusiness(draft.business || this.buildFallbackDraft().business),
        savedAt: draft.savedAt || null
      };
    } catch {
      return this.buildFallbackDraft();
    }
  }

  private buildFallbackDraft(): SiteBuilderDraft {
    return {
      pageData: TEMPLATE_THREE_STATIC_CONTENT,
      business: this.normalizeBusiness({
        empresaID: 'preview-demo',
        nombre: 'Mi Restobar Demo',
        descripcion: 'Vista previa web del template 3.',
        email: 'hola@misitio.com',
        telefono: '987654321',
        direccion: 'Av. Principal 456, Lima',
        referencia: 'Frente al parque central',
        whatsapp: '51987654321',
        productos: [],
        categorias: []
      }),
      savedAt: null
    };
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
            this.previewBusiness.set(this.mergeDraftWithConfiguredBusiness(this.previewBusiness(), configuredBusiness));
          },
          error: error => {
            console.error('No se pudo sincronizar productos de la vista previa:', error);
          }
        });
      },
      error: error => {
        console.error('No se pudo sincronizar la vista previa con el negocio configurado:', error);
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
        urlImagen: producto.imagenPrincipal || producto.urlImagen || '/assets/image-default.webp',
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

  private buildHashUrl(route: string): string {
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;

    if (typeof window === 'undefined') {
      return `#${normalizedRoute}`;
    }

    return `${window.location.origin}${window.location.pathname}#${normalizedRoute}`;
  }

  private slugify(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
}
