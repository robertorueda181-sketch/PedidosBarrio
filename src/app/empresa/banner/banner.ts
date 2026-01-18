import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';

interface BannerConfig {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaAction: string; // ID of the section or URL
}

@Component({
    selector: 'app-banner',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, DialogModule],
    template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Banner de Inicio (Hero)</h1>
          <p class="text-gray-500 font-medium">Configura el mensaje principal y la imagen de portada</p>
        </div>
        <div class="flex gap-3">
          <button (click)="showFullPreview = true"
            class="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all flex items-center gap-2">
            <i class="pi pi-eye"></i>
            Previsualizar Todo
          </button>
          <button (click)="saveBanner()" [disabled]="isLoading"
            class="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2">
            <i class="pi" [ngClass]="isLoading ? 'pi-spin pi-spinner' : 'pi-save'"></i>
            Guardar Cambios
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form -->
        <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
          <h2 class="text-lg font-black text-gray-800 flex items-center gap-2 border-b pb-4">
            <i class="pi pi-pencil text-cyan-600"></i> Editor de Contenido
          </h2>
          
          <div class="space-y-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Título Principal</label>
            <input type="text" [(ngModel)]="banner.title" class="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 focus:ring-2 focus:ring-cyan-500 outline-none font-bold text-lg" />
          </div>
          
          <div class="space-y-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Eslogan / Subtítulo</label>
            <textarea [(ngModel)]="banner.subtitle" rows="3" class="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 focus:ring-2 focus:ring-cyan-500 outline-none text-gray-600"></textarea>
          </div>

          <!-- Image Picker instead of URL -->
          <div class="space-y-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Imagen de Fondo</label>
            <button (click)="showImageModal.set(true)"
                class="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all group">
                <div class="flex items-center gap-4">
                    <img [src]="banner.imageUrl" class="w-16 h-10 rounded bg-white shadow-sm object-cover">
                    <span class="text-sm font-bold text-gray-700">Cambiar Imagen de Portada</span>
                </div>
                <i class="pi pi-images text-cyan-600 group-hover:scale-110 transition-transform text-xl"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Texto del Botón</label>
              <input type="text" [(ngModel)]="banner.ctaText" class="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none font-black" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Acción al Clic</label>
              <p-select [options]="sections" [(ngModel)]="banner.ctaAction" styleClass="w-full bg-gray-50" [editable]="true" placeholder="Elegir..."></p-select>
            </div>
          </div>
        </div>

        <!-- Sticky Preview -->
        <div class="space-y-4">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex justify-between">
            Vista Previa Desktop 
            <span class="text-cyan-600">En vivo</span>
          </h3>
          <div class="relative h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group sticky top-8">
            <img [src]="banner.imageUrl" class="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
            <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col items-start justify-center p-16 text-left">
              <span class="text-cyan-400 uppercase tracking-[0.4em] font-medium mb-4 animate-fade-in text-sm">{{ banner.subtitle }}</span>
              <h2 class="text-5xl font-black text-white leading-[1.1] mb-8 max-w-md animate-slide-up">{{ banner.title }}</h2>
              <button class="bg-cyan-500 text-white px-10 py-4 font-black uppercase tracking-widest rounded-xl shadow-xl transform active:scale-95 transition-all text-sm">
                {{ banner.ctaText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- IMAGE PICKER MODAL -->
    <p-dialog [visible]="showImageModal()" [modal]="true" header="Seleccionar Imagen de Portada"
        [style]="{width: '90vw', maxWidth: '600px'}" [dismissableMask]="true" (onHide)="showImageModal.set(false)">
        <div class="space-y-6">
            <div class="flex border-b">
                <button (click)="activeTab = 'upload'"
                    class="flex-1 py-3 font-black uppercase tracking-widest text-xs transition-all border-b-2"
                    [ngClass]="activeTab === 'upload' ? 'border-cyan-600 text-cyan-600 bg-cyan-50' : 'border-transparent text-gray-400'">
                    <i class="pi pi-upload mr-2"></i> Subir Archivo
                </button>
                <button (click)="activeTab = 'stock'"
                    class="flex-1 py-3 font-black uppercase tracking-widest text-xs transition-all border-b-2"
                    [ngClass]="activeTab === 'stock' ? 'border-cyan-600 text-cyan-600 bg-cyan-50' : 'border-transparent text-gray-400'">
                    <i class="pi pi-images mr-2"></i> Librería Repositorio
                </button>
            </div>

            <div class="min-h-[300px]">
                @if(activeTab === 'upload') {
                    <div class="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 group hover:border-cyan-400 transition-all cursor-pointer relative">
                        <input type="file" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                        <i class="pi pi-cloud-upload text-5xl text-cyan-600 mb-4 group-hover:scale-110 transition-transform"></i>
                        <p class="font-bold text-gray-700">Haz clic para buscar en tu equipo</p>
                    </div>
                } @else {
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        @for(img of stockImages; track img) {
                            <div (click)="selectStockImage(img)" class="aspect-video rounded-xl overflow-hidden cursor-pointer hover:ring-4 ring-cyan-500 transition-all">
                                <img [src]="img" class="w-full h-full object-cover">
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    </p-dialog>

    <!-- FULL PREVIEW MODAL -->
    <p-dialog [(visible)]="showFullPreview" [modal]="true" [showHeader]="false" [dismissableMask]="true"
        [style]="{width: '100vw', height: '100vh', margin: '0', padding: '0'}">
        <div class="relative w-full h-full bg-white flex flex-col pt-16">
            <button (click)="showFullPreview = false" class="fixed top-8 right-8 z-[100] bg-black text-white px-6 py-2 rounded-full font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-2xl">
                <i class="pi pi-times"></i> Salir de Vista Previa
            </button>
            <div class="relative w-full flex-1 overflow-hidden">
                <img [src]="banner.imageUrl" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-20">
                    <span class="text-cyan-300 uppercase tracking-[0.5em] font-light mb-6 text-2xl">{{ banner.subtitle }}</span>
                    <h2 class="text-7xl font-black text-white leading-tight mb-12 max-w-4xl drop-shadow-2xl">{{ banner.title }}</h2>
                    <button class="bg-cyan-500 hover:bg-cyan-600 text-white px-12 py-5 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all">
                        {{ banner.ctaText }}
                    </button>
                </div>
            </div>
        </div>
    </p-dialog>
  `,
    styles: [`
    :host ::ng-deep .p-select { width: 100%; border-radius: 0.75rem; border: 1px solid #f3f4f6; background: #f9fafb; font-weight: 700; height: 52px; display: flex; align-items: center; }
    .animate-slide-up { animation: slideUp 1s cubic-bezier(0.23, 1, 0.32, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class Banner implements OnInit {
    private toastr = inject(ToastrService);
    isLoading = false;
    showFullPreview = false;
    showImageModal = signal(false);
    activeTab: 'upload' | 'stock' = 'upload';

    banner: BannerConfig = {
        title: 'Sabor & Tradición en cada bocado',
        subtitle: 'NUESTRA PASIÓN ES LA COCINA',
        imageUrl: 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1600',
        ctaText: 'Ver Mi Menú',
        ctaAction: 'productos'
    };

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
        const saved = localStorage.getItem('hero_banner_config');
        if (saved) {
            this.banner = JSON.parse(saved);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
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
            await new Promise(resolve => setTimeout(resolve, 800));
            localStorage.setItem('hero_banner_config', JSON.stringify(this.banner));
            this.toastr.success('Banner actualizado', 'Éxito');
        } catch (e) {
            this.toastr.error('No se pudo guardar', 'Error');
        } finally {
            this.isLoading = false;
        }
    }
}
