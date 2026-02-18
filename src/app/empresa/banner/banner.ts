import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { BannerService } from '../services/banner.service';

interface BannerConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: string; // ID of the section or URL
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
  id?: string;
  link?: string;
}

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, DialogModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css'
})
export class Banner implements OnInit {
  private toastr = inject(ToastrService);
  private bannerService = inject(BannerService);
  isLoading = false;
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
    this.isLoading = true;
    this.bannerService.obtenerBanners().subscribe({
      next: (data) => {
        // Mapear desde API al formato de BannerConfig
        const mappedBanners = data.map(b => ({
          id: b.id || b.bannerID, // Ajustar según respuesta API
          title: b.titulo,
          subtitle: b.descripcion,
          imageUrl: b.imagenUrl || 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1600', // URL imagen
          ctaText: b.textoBoton,
          ctaAction: b.redireccion,
          startDate: b.fechaInicio?.split('T')[0],
          endDate: b.fechaFin?.split('T')[0],
          expirationDate: b.fechaExpiracion?.split('T')[0],
          link: b.link
        }));
        this.banners.set(mappedBanners);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Error al cargar banners');
        // Fallback a local storage si falla API? O dejar vacío
        const saved = localStorage.getItem('hero_banners_list');
        if (saved) this.banners.set(JSON.parse(saved));
      },
      complete: () => this.isLoading = false
    });
  }

  getEmptyBanner(): BannerConfig {
    return {
      id: crypto.randomUUID(),
      title: '',
      subtitle: '',
      imageUrl: 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1600',
      ctaText: 'Ver Más',
      ctaAction: 'productos',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      expirationDate: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0],
      link: ''
    };
  }

  isActive(b: BannerConfig): boolean {
    if (!b.startDate || !b.endDate) return false;
    const now = new Date();
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
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
    
    this.isLoading = true;
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
        this.isLoading = false;
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
        this.banner.imageUrl = e.target.result;
        this.showImageModal.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  selectStockImage(url: string) {
    this.banner.imageUrl = url;
    this.showImageModal.set(false);
  }

  async saveBanner() {
    this.isLoading = true;
    try {
      if(this.viewMode() === 'edit') {
         // Create banner using service
         const bannerData = {
           titulo: this.banner.title,
           descripcion: this.banner.subtitle,
           textoBoton: this.banner.ctaText,
           link: this.banner.link,
           redireccion: this.banner.ctaAction,
           fechaInicio: new Date(this.banner.startDate || new Date()),
           fechaFin: new Date(this.banner.endDate || new Date()),
           fechaExpiracion: new Date(this.banner.expirationDate || new Date()),
           imagen: this.selectedFile || undefined
         };
         
         this.bannerService.crearBanner(bannerData).subscribe({
            next: (response) => {
              this.toastr.success('Banner enviado correctamente', 'Éxito');
              // Optionally refresh list or handle response
              this.viewMode.set('list');
              
              // Recargar desde API
              this.cargarBanners();
            },
            error: (err) => {
               console.error(err);
               this.toastr.error('Error al enviar banner', 'Error');
            },
            complete: () => {
              this.isLoading = false;
            }
         });
         return; // async logic handled in subscription
      }
      
      this.updateLocalList();
      this.toastr.success('Banner guardado localmente', 'Éxito');
      this.viewMode.set('list');
    } catch (e) {
      this.toastr.error('No se pudo guardar', 'Error');
    } finally {
      if(this.viewMode() !== 'edit')
        this.isLoading = false;
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
