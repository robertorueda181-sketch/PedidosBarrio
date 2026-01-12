import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TableModule } from 'primeng/table';
import { EditorModule } from 'primeng/editor';
import { SelectButtonModule } from 'primeng/selectbutton';

interface AdModuleSection {
    id: string;
    type: 'text' | 'image' | 'mixed';
    content?: string;
    imageUrl?: string;
    layout?: 'text-left' | 'text-right';
}

interface AdImage {
    url: string;
    shape: 'circle' | 'square';
    size: 'sm' | 'md' | 'lg';
}

interface AdConfig {
    id?: string;
    name: string;
    headerChoice: 'none' | 'title' | 'image';
    title: string;
    imageUrl: string;
    subtitle: string;
    showSubtitle: boolean;
    mainContent: string;
    showMainContent: boolean;
    showWhatsAppBadge: boolean;
    moduleSections: AdModuleSection[];
    footerImage: string;
    footerImageConfig?: AdImage;
    startDate: string;
    endDate: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
    cardColor: string;
    extraImages: string[];
    extraImagesConfig?: AdImage[];
    createdAt?: string;
    isActive?: boolean;
}

@Component({
    selector: 'app-promociones',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        CheckboxModule,
        RadioButtonModule,
        ButtonModule,
        ColorPickerModule,
        TableModule,
        EditorModule,
        SelectButtonModule
    ],
    templateUrl: './publicidad.html',
    styleUrl: './publicidad.css'
})
export class Promociones implements OnInit {
    private messageService = inject(MessageService);

    // States
    isLoading = false;
    viewState: 'list' | 'edit' = 'list';
    showPreview = signal(false);
    showImageModal = signal(false);
    activeImageTab: 'upload' | 'stock' = 'upload';
    imageTarget: { type: 'main' | 'footer' | 'extra' | 'section', sectionId?: string, index?: number } | null = null;
    whatsappPhoneNumber: string = '51954121196';

    headerOptions = [
        { label: 'Ninguno', value: 'none' },
        { label: 'Título', value: 'title' },
        { label: 'Imagen/Flyer', value: 'image' }
    ];

    stockImages = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=400',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
        'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400'
    ];

    // Data
    promociones: AdConfig[] = [];

    adConfig: AdConfig = this.getDefaultConfig();

    ngOnInit() {
        this.loadPromociones();
    }

    getDefaultConfig(): AdConfig {
        return {
            name: '',
            headerChoice: 'title',
            title: 'NUEVA PROMO',
            subtitle: 'Descripción breve de la oferta',
            showSubtitle: true,
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            mainContent: '<p>Explica aquí los detalles de tu promoción...</p>',
            showMainContent: true,
            showWhatsAppBadge: true,
            moduleSections: [],
            footerImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
            footerImageConfig: {
                url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
                shape: 'circle',
                size: 'md'
            },
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            bgColor: '#ffffff',
            textColor: '#1f2937',
            accentColor: '#0891b2',
            cardColor: '#ffffff',
            extraImages: [],
            extraImagesConfig: [],
            isActive: false
        };
    }

    loadPromociones() {
        const saved = localStorage.getItem('ads_history');
        if (saved) {
            let data = JSON.parse(saved);
            // Migrate old data if needed
            data = data.map((p: any) => {
                if (p.sections && !p.moduleSections) {
                    p.moduleSections = p.sections.map((s: any) => ({
                        id: Date.now().toString() + Math.random(),
                        type: 'text',
                        content: `<h3>${s.title}</h3><ul>` + s.items.map((it: any) => `<li>${it.label}: ${it.value}</li>`).join('') + `</ul>`
                    }));
                    p.headerChoice = p.type === 'image' ? 'image' : 'title';
                    p.showSubtitle = true;
                    p.showMainContent = false;
                    p.showWhatsAppBadge = true;
                }
                return p;
            });
            this.promociones = data;
        } else {
            this.promociones = [];
        }
    }

    createNew() {
        this.adConfig = this.getDefaultConfig();
        this.viewState = 'edit';
    }

    editPromocion(promo: AdConfig) {
        this.adConfig = JSON.parse(JSON.stringify(promo)); // Deep copy
        this.viewState = 'edit';
    }

    addModuleSection(type: 'text' | 'image' | 'mixed') {
        const newSection: AdModuleSection = {
            id: Date.now().toString(),
            type: type,
            content: type !== 'image' ? '<p>Contenido de la sección...</p>' : '',
            imageUrl: type !== 'text' ? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' : '',
            layout: 'text-left'
        };
        this.adConfig.moduleSections.push(newSection);
    }

    removeModuleSection(id: string) {
        this.adConfig.moduleSections = this.adConfig.moduleSections.filter(s => s.id !== id);
    }

    addImage() {
        if (!this.adConfig.extraImagesConfig) this.adConfig.extraImagesConfig = [];
        this.adConfig.extraImagesConfig.push({
            url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
            shape: 'circle',
            size: 'sm'
        });
    }

    removeImage(index: number) {
        this.adConfig.extraImagesConfig?.splice(index, 1);
    }

    async saveConfig() {
        if (!this.adConfig.name) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Por favor, ingresa un nombre para la promoción' });
            return;
        }

        this.isLoading = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (!this.adConfig.id) {
                this.adConfig.id = Date.now().toString();
                this.adConfig.createdAt = new Date().toISOString().split('T')[0];
                this.promociones.unshift(this.adConfig);
            } else {
                const index = this.promociones.findIndex(p => p.id === this.adConfig.id);
                if (index !== -1) this.promociones[index] = this.adConfig;
            }

            // If active, save to global current config
            if (this.adConfig.isActive) {
                // Deactivate others
                this.promociones.forEach(p => {
                    if (p.id !== this.adConfig.id) p.isActive = false;
                });
                localStorage.setItem('ad_config', JSON.stringify(this.adConfig));
            }

            localStorage.setItem('ads_history', JSON.stringify(this.promociones));

            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Promoción guardada' });
            this.viewState = 'list';
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        } finally {
            this.isLoading = false;
        }
    }

    toggleActive(promo: AdConfig) {
        this.promociones.forEach(p => p.isActive = (p.id === promo.id));
        localStorage.setItem('ads_history', JSON.stringify(this.promociones));

        if (promo.isActive) {
            localStorage.setItem('ad_config', JSON.stringify(promo));
            this.messageService.add({ severity: 'success', summary: 'Activada', detail: `${promo.name} ahora es la promoción actual` });
        } else {
            localStorage.removeItem('ad_config');
        }
    }

    deletePromocion(index: number) {
        const p = this.promociones[index];
        if (p.isActive) localStorage.removeItem('ad_config');
        this.promociones.splice(index, 1);
        localStorage.setItem('ads_history', JSON.stringify(this.promociones));
    }

    cancel() {
        this.viewState = 'list';
    }

    togglePreview() {
        this.showPreview.update(v => !v);
    }

    openImageModal(type: 'main' | 'footer' | 'extra' | 'section', index?: number, sectionId?: string) {
        this.imageTarget = { type, index, sectionId };
        this.showImageModal.set(true);
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.applyImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    selectStockImage(url: string) {
        this.applyImage(url);
    }

    private applyImage(url: string) {
        if (!this.imageTarget) return;

        if (this.imageTarget.type === 'main') this.adConfig.imageUrl = url;
        else if (this.imageTarget.type === 'footer') {
            if (!this.adConfig.footerImageConfig) {
                this.adConfig.footerImageConfig = { url: '', shape: 'circle', size: 'md' };
            }
            this.adConfig.footerImageConfig.url = url;
            this.adConfig.footerImage = url;
        }
        else if (this.imageTarget.type === 'extra' && this.imageTarget.index !== undefined) {
            if (this.adConfig.extraImagesConfig?.[this.imageTarget.index]) {
                this.adConfig.extraImagesConfig[this.imageTarget.index].url = url;
            }
        }
        else if (this.imageTarget.type === 'section' && this.imageTarget.sectionId) {
            const section = this.adConfig.moduleSections.find(s => s.id === this.imageTarget?.sectionId);
            if (section) section.imageUrl = url;
        }

        this.showImageModal.set(false);
        this.messageService.add({ severity: 'info', summary: 'Imagen actualizada', detail: 'Se ha cargado la nueva imagen' });
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
}
