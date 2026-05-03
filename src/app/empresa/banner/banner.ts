import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { BannerService } from '../shared/services/banner.service';
import { DatePickerModule } from 'primeng/datepicker';

interface BannerConfig {
  title: string;
  subtitle: string;
  urlImagen: string;
  ctaText: string;
  ctaAction: string; // ID of the section or URL
  startDate?: Date;
  endDate?: Date;
  expirationDate?: Date;
  id?: string;
  link?: string;
}

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, SelectModule, DialogModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css'
})
export class Banner implements OnInit {
  private toastr = inject(ToastrService);
  private bannerService = inject(BannerService);
  isLoading = signal(false);
  showFullPreview = false;
  showImageModal = signal(false);
  activeTab: 'upload' | 'stock' = 'upload';
  viewMode = signal<'list' | 'edit'>('list');
  banners = signal<BannerConfig[]>([]);
  selectedFile: File | null = null;

  banner: BannerConfig = this.getEmptyBanner();

  sections = [
    { label: 'Ir a Mis Productos', value: 'productos' },
    { label: 'Ver Promociones', value: 'promociones' },
    { label: 'Sección de Contacto', value: 'contacto' },
    { label: 'Enlace a Maps', value: 'https://maps.google.com' }
  ];

  stockImages = [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600',
    'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1600',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600'
  ];

  ngOnInit() {
    this.cargarBanners();
  }

  cargarBanners() {
    this.isLoading.set(true);
    this.bannerService.obtenerBanners().subscribe({
      next: (data: any[]) => { // Added type any[] to avoid implicit any errors if strict
        // Mapear desde API al formato de BannerConfig
        console.log('Banners obtenidos:', data);
        const mappedBanners: BannerConfig[] = data.map(b => ({
          id: b.bannerID,
          title: b.titulo,
          subtitle: b.descripcion,
          urlImagen: b.urlImagen || '/assets/image-default.webp', // URL imagen
          ctaText: b.textoBoton,
          ctaAction: b.redireccion,
          startDate: b.fechaInicio ? new Date(b.fechaInicio) : undefined,
          endDate: b.fechaExpiracion ? new Date(b.fechaExpiracion) : undefined,
          expirationDate: b.fechaExpiracion ? new Date(b.fechaExpiracion) : undefined,
          link: b.link
        }));
        this.banners.set(mappedBanners);
      },
      error: (err) => {
        // Si es 404, simplemente no hay banners
        if (err.status === 404) {
          this.banners.set([]);
          this.isLoading.set(false); // Fixed: need to stop loading even on 404
          return;
        }

        console.error(err);
        this.toastr.error('Error al cargar banners');
        this.isLoading.set(false);


      },
      complete: () => this.isLoading.set(false)
    });
  }

  getEmptyBanner(): BannerConfig {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 30);
    const exp = new Date();
    exp.setDate(now.getDate() + 60);

    return {
      id: '',
      title: '',
      subtitle: '',
      urlImagen: '/assets/image-default.webp',
      ctaText: 'Ver Más',
      ctaAction: 'productos',
      startDate: now,
      endDate: end,
      expirationDate: exp,
      link: ''
    };
  }

  isActive(b: BannerConfig): boolean {
    if (!b.startDate || !b.endDate) return false;
    const now = new Date();
    // Ensure they are Date objects (API mapping should guarantee this, but good for safety if types are loose)
    const start = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
    const end = b.endDate instanceof Date ? b.endDate : new Date(b.endDate);
    return now >= start && now <= end;
  }

  createBanner() {
    this.banner = this.getEmptyBanner();
    this.viewMode.set('edit');
  }

  editBanner(b: BannerConfig) {
    this.banner = { ...b };
    this.viewMode.set('edit');
  }

  deleteBanner(id: string) {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;

    this.isLoading.set(true);
    // Asegurarse de que el ID es válido
    if (!id || id.length < 5) return;

    this.bannerService.eliminarBanner(id).subscribe({
      next: () => {
        this.toastr.success('Banner eliminado correctamente');
        this.cargarBanners();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Error al eliminar banner');
        this.isLoading.set(false);
      }
    });
  }

  cancelEdit() {
    this.viewMode.set('list');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.banner.urlImagen = e.target.result;
        this.showImageModal.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  selectStockImage(url: string) {
    this.banner.urlImagen = url;
    this.showImageModal.set(false);
  }

  async saveBanner() {
    this.isLoading.set(true);
    try {
      const bannerData: any = {
        titulo: this.banner.title,
        descripcion: this.banner.subtitle,
        textoBoton: this.banner.ctaText,
        link: this.banner.link,
        redireccion: this.banner.ctaAction,
        fechaInicio: this.banner.startDate ? new Date(this.banner.startDate) : new Date(),
        fechaFin: this.banner.endDate ? new Date(this.banner.endDate) : new Date(),
        fechaExpiracion: this.banner.expirationDate ? new Date(this.banner.expirationDate) : new Date(),
      };

      if (this.selectedFile) {
        bannerData['imagen'] = this.selectedFile;
      } else if (this.banner.urlImagen && !this.banner.urlImagen.startsWith('data:')) {
        bannerData['urlImagen'] = this.banner.urlImagen;
      }
      console.log('Datos a enviar:', bannerData);
      let request$;
      if (this.banner.id) {
        request$ = this.bannerService.actualizarBanner(this.banner.id, bannerData);
      } else {
        request$ = this.bannerService.crearBanner(bannerData);
      }

      request$.subscribe({
        next: (response) => {
          this.toastr.success(this.banner.id ? 'Banner actualizado correctamente' : 'Banner creado correctamente', 'Éxito');
          this.viewMode.set('list');
          this.cargarBanners();
          this.isLoading.set(false);
          this.selectedFile = null; // Reset file input after successful upload
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error(err);
          this.toastr.error('Error al guardar banner', 'Error');
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    } catch (e) {
      this.toastr.error('No se pudo guardar', 'Error');
      this.isLoading.set(false);
    }
  }

  private updateLocalList() {
    this.banners.update(list => {
      const index = list.findIndex(b => b.id === this.banner.id);
      if (index >= 0) {
        const newList = [...list];
        newList[index] = this.banner;
        return newList;
      }
      return [...list, this.banner];
    });
    this.saveList();
  }

  private saveList() {
    localStorage.setItem('hero_banners_list', JSON.stringify(this.banners()));
  }
}
