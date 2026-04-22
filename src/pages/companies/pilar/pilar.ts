import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { SchoolPageData } from '../../../shared/interfaces/school-page.interface';

@Component({
    selector: 'app-pilar',
    standalone: true,
    imports: [CommonModule, RouterModule, SafeUrlPipe],
    templateUrl: './pilar.html',
    styleUrls: ['./pilar.css']
})
export class PilarComponent implements OnInit {
    // Datos dinámicos de la página - esto se puede cargar desde la base de datos
    pageData: SchoolPageData = {
        theme: {
            colors: {
                primary: 'black',
                secondary: '#2C5282',
                accent: '#2C5282',
                background: 'white',
                text: '#2C5282',
                textLight: '#718096'
            },
            fonts: {
                heading: 'Outfit',
                body: 'Inter'
            },
            borderRadius: '2rem'
        },
        hero: {
            imageUrl: 'assets/pilar_hero.png',
            title: 'Colegio Nuestra Señora del Pilar',
            subtitle: 'Formando líderes con valores y excelencia académica desde 1999.',
            admissionYear: '2026',
            buttons: {
                primary: 'Solicitar Información',
                secondary: 'Ver Video Institucional'
            }
        },
        stats: [
            { label: 'Años de Experiencia', value: '25+' },
            { label: 'Docentes Calificados', value: '50+' },
            { label: 'Estudiantes Felices', value: '800+' },
            { label: 'Talleres Extracurriculares', value: '12' }
        ],
        sections: [
            {
                id: 'inicial',
                type: 'text-image',
                order: 1,
                title: 'Educación Inicial',
                description: 'Un espacio lleno de color y alegría donde los más pequeños descubren el mundo a través del juego y la exploración.',
                imageUrl: 'assets/pilar_inicial.png',
                imagePosition: 'right',
                features: ['Ambientes seguros', 'Aprendizaje lúdico', 'Docentes especializadas']
            },
            {
                id: 'primaria',
                type: 'text-image',
                order: 2,
                title: 'Educación Primaria',
                description: 'Fomentamos la curiosidad y el pensamiento crítico, sentando las bases sólidas para un futuro académico exitoso.',
                imageUrl: 'assets/pilar_primaria.png',
                imagePosition: 'left',
                features: ['Pensamiento lógico', 'Plan lector', 'Proyectos colaborativos']
            },
            {
                id: 'secundaria',
                type: 'text-image',
                order: 3,
                title: 'Educación Secundaria',
                description: 'Preparamos a nuestros jóvenes para los retos de la vida universitaria y profesional con una formación integral y tecnológica.',
                imageUrl: 'assets/pilar_secundaria.png',
                imagePosition: 'right',
                features: ['Orientación vocacional', 'Laboratorios modernos', 'Inglés intensivo']
            },
            {
                id: 'videos',
                type: 'video-gallery',
                order: 4,
                title: 'Vive Nuestra Pasión por la Educación',
                description: 'Explora más sobre nuestro día a día, eventos y la metodología que nos hace únicos.',
                videos: [
                    {
                        title: 'Nuestra Propuesta Educativa',
                        url: 'https://www.youtube.com/watch?v=7Ufr_RHsHhI',
                        description: 'Conoce más sobre nuestro método de enseñanza y valores.'
                    },
                    {
                        title: 'Vida Estudiantil',
                        url: 'https://www.youtube.com/watch?v=KAxh9D1JWwg',
                        description: 'Un recorrido por las actividades y talleres de nuestros alumnos.'
                    }
                ]
            },
            {
                id: 'galeria',
                type: 'image-gallery',
                order: 5,
                title: 'Momentos Inolvidables',
                description: 'Descubre la vida cotidiana en nuestro colegio a través de estas imágenes.',
                images: [
                    {
                        url: 'assets/pilar_inicial.png',
                        alt: 'Estudiantes en clase',
                        caption: 'Aprendizaje activo en el aula'
                    },
                    {
                        url: 'assets/pilar_inicial.png',
                        alt: 'Actividades deportivas',
                        caption: 'Deporte y compañerismo'
                    },
                    {
                        url: 'assets/pilar_inicial.png',
                        alt: 'Eventos culturales',
                        caption: 'Celebrando nuestra cultura'
                    },
                    {
                        url: 'assets/pilar_inicial.png',
                        alt: 'Laboratorios modernos',
                        caption: 'Ciencia y experimentación'
                    }
                ]
            },
            {
                id: 'cta',
                type: 'cta',
                order: 5,
                title: '¿Listo para formar parte de la Familia Pilarina?',
                description: 'Las inscripciones para el año escolar 2026 ya están abiertas. Cupos limitados.',
                buttonText: 'Empieza tu Proceso de Admisión'
            }
        ]
    };

    // Propiedades para el modal de galería
    isModalOpen = false;
    currentImageIndex = 0;
    currentGalleryImages: Array<{ url: string; alt: string; caption?: string }> = [];
    
    // Año actual para el footer
    currentYear = new Date().getFullYear();

    // Horarios de atención (esto vendría de tu BD)
    // Puedes tener múltiples rangos horarios por día (para breaks)
    scheduleFromDB = [
        { day: 'Lunes', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Martes', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Miércoles', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Jueves', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Viernes', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Sábado', ranges: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { day: 'Domingo', ranges: [{ start: '09:00', end: '13:00' }] }
    ];

    // Getter para agrupar horarios
    get scheduleGrouped(): Array<{ days: string; hours: string }> {
        const groups: Array<{ days: string[]; hours: string }> = [];
        
        this.scheduleFromDB.forEach((schedule) => {
            // Formatear los rangos horarios
            const hours = schedule.ranges
                .map(range => `${range.start} - ${range.end}`)
                .join(' / ');
            
            const existingGroup = groups.find(g => g.hours === hours);
            
            if (existingGroup) {
                existingGroup.days.push(schedule.day);
            } else {
                groups.push({ days: [schedule.day], hours });
            }
        });

        // Formatear los días agrupados
        return groups.map(group => ({
            days: this.formatDayRange(group.days),
            hours: group.hours
        }));
    }

    private formatDayRange(days: string[]): string {
        if (days.length === 1) {
            return days[0];
        }
        
        // Si son días consecutivos
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const indices = days.map(d => dayOrder.indexOf(d)).sort((a, b) => a - b);
        
        const isConsecutive = indices.every((val, i, arr) => 
            i === 0 || val === arr[i - 1] + 1
        );
        
        if (isConsecutive && days.length > 2) {
            return `${days[0]} a ${days[days.length - 1]}`;
        }
        
        // Si no son consecutivos o son solo 2 días
        if (days.length === 2) {
            return days.join(' y ');
        }
        
        return days.slice(0, -1).join(', ') + ' y ' + days[days.length - 1];
    }

    ngOnInit() {
        // Aplicar tema dinámico
        if (this.pageData.theme) {
            this.applyTheme(this.pageData.theme);
        }

        // Convertir URLs de videos a formato embed
        this.pageData.sections.forEach(section => {
            if (section.type === 'video-gallery') {
                const videoSection = section as any;
                videoSection.videos = videoSection.videos.map((video: any) => ({
                    ...video,
                    url: this.convertToEmbedUrl(video.url)
                }));
            }
        });
    }

    // Aplicar tema dinámico usando CSS Variables
    private applyTheme(theme: NonNullable<SchoolPageData['theme']>) {
        const root = document.documentElement;

        // Aplicar colores
        root.style.setProperty('--color-primary', theme.colors.primary);
        root.style.setProperty('--color-secondary', theme.colors.secondary);
        root.style.setProperty('--color-accent', theme.colors.accent);
        root.style.setProperty('--color-background', theme.colors.background);
        root.style.setProperty('--color-text', theme.colors.text);
        root.style.setProperty('--color-text-light', theme.colors.textLight);

        // Aplicar fuentes
        if (theme.fonts) {
            root.style.setProperty('--font-heading', theme.fonts.heading);
            root.style.setProperty('--font-body', theme.fonts.body);
        }

        // Aplicar radio de bordes
        if (theme.borderRadius) {
            root.style.setProperty('--border-radius', theme.borderRadius);
        }
    }

    // Método helper para convertir URLs de YouTube a formato embed
    private convertToEmbedUrl(url: string): string {
        // Si ya es una URL embed, devolverla tal cual
        if (url.includes('/embed/')) {
            return url;
        }

        // Extraer el ID del video de diferentes formatos de URL
        let videoId = '';

        // Formato: https://www.youtube.com/watch?v=VIDEO_ID
        if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        }
        // Formato: https://youtu.be/VIDEO_ID
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    // Métodos para el modal de galería
    openModal(images: Array<{ url: string; alt: string; caption?: string }>, startIndex: number = 0) {
        this.currentGalleryImages = images;
        this.currentImageIndex = startIndex;
        this.isModalOpen = true;
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentGalleryImages = [];
        this.currentImageIndex = 0;
        document.body.style.overflow = 'auto'; // Restaurar scroll del body
    }

    nextImage() {
        if (this.currentGalleryImages.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.currentGalleryImages.length;
        }
    }

    previousImage() {
        if (this.currentGalleryImages.length > 0) {
            this.currentImageIndex = this.currentImageIndex === 0
                ? this.currentGalleryImages.length - 1
                : this.currentImageIndex - 1;
        }
    }

    goToImage(index: number) {
        if (index >= 0 && index < this.currentGalleryImages.length) {
            this.currentImageIndex = index;
        }
    }

    // Manejar teclas de navegación
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.isModalOpen) return;

        switch (event.key) {
            case 'Escape':
                this.closeModal();
                break;
            case 'ArrowRight':
                this.nextImage();
                break;
            case 'ArrowLeft':
                this.previousImage();
                break;
        }
    }
}
