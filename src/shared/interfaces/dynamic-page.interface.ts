// =============================================
// INTERFACES PARA SISTEMA DE PÁGINA DINÁMICA AVANZADO
// =============================================

// Configuración de tema/branding
export interface ThemeConfig {
    colors: {
        primary: string;      // Color principal (ej: "#1A365D")
        secondary: string;    // Color secundario
        accent: string;       // Color de acento
        background: string;   // Color de fondo
        text: string;         // Color de texto principal
        textLight: string;    // Color de texto secundario
    };
    fonts: {
        heading: string;      // Fuente para títulos (ej: "Outfit")
        body: string;         // Fuente para texto (ej: "Inter")
    };
    borderRadius: string;     // Radio de bordes (ej: "2rem", "1rem")
}

// Tipos de secciones disponibles
export type SectionType =
    | 'hero'
    | 'stats'
    | 'text-image'
    | 'video-gallery'
    | 'testimonials'
    | 'cta'
    | 'features'
    | 'gallery'
    | 'contact-form'
    | 'custom-html';

// Configuración base para cualquier sección
export interface BaseSection {
    id: string;
    type: SectionType;
    order: number;
    visible: boolean;
    backgroundColor?: string;
    padding?: {
        top: string;
        bottom: string;
    };
    customClass?: string;
}

// Sección Hero/Banner
export interface HeroSection extends BaseSection {
    type: 'hero';
    data: {
        imageUrl: string;
        title: string;
        subtitle: string;
        badge?: {
            text: string;
            color: string;
        };
        buttons: Array<{
            text: string;
            style: 'primary' | 'secondary' | 'outline';
            action?: string;
        }>;
        height?: string; // ej: "80vh", "500px"
        overlay?: {
            enabled: boolean;
            color: string;
            opacity: number;
        };
    };
}

// Sección de Estadísticas
export interface StatsSection extends BaseSection {
    type: 'stats';
    data: {
        title?: string;
        stats: Array<{
            label: string;
            value: string;
            icon?: string;
        }>;
        columns: number; // 2, 3, 4, etc.
        style: 'cards' | 'minimal' | 'bordered';
    };
}

// Sección Texto + Imagen
export interface TextImageSection extends BaseSection {
    type: 'text-image';
    data: {
        title: string;
        description: string;
        imageUrl: string;
        imagePosition: 'left' | 'right';
        features?: string[];
        button?: {
            text: string;
            action?: string;
        };
    };
}

// Sección de Videos
export interface VideoGallerySection extends BaseSection {
    type: 'video-gallery';
    data: {
        title: string;
        description?: string;
        videos: Array<{
            title: string;
            url: string;
            description: string;
            thumbnail?: string;
        }>;
        columns: number;
    };
}

// Sección de Testimonios
export interface TestimonialsSection extends BaseSection {
    type: 'testimonials';
    data: {
        title: string;
        testimonials: Array<{
            name: string;
            role: string;
            photo?: string;
            text: string;
            rating?: number;
        }>;
        style: 'cards' | 'carousel' | 'grid';
    };
}

// Sección Call to Action
export interface CTASection extends BaseSection {
    type: 'cta';
    data: {
        title: string;
        description: string;
        button: {
            text: string;
            action?: string;
        };
        backgroundImage?: string;
        style: 'centered' | 'split';
    };
}

// Sección de Características/Features
export interface FeaturesSection extends BaseSection {
    type: 'features';
    data: {
        title: string;
        description?: string;
        features: Array<{
            icon: string;
            title: string;
            description: string;
        }>;
        columns: number;
        style: 'cards' | 'list' | 'icons';
    };
}

// Galería de Imágenes
export interface GallerySection extends BaseSection {
    type: 'gallery';
    data: {
        title?: string;
        images: Array<{
            url: string;
            caption?: string;
            alt: string;
        }>;
        columns: number;
        style: 'grid' | 'masonry' | 'carousel';
    };
}

// Formulario de Contacto
export interface ContactFormSection extends BaseSection {
    type: 'contact-form';
    data: {
        title: string;
        description?: string;
        fields: Array<{
            name: string;
            type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
            label: string;
            required: boolean;
            placeholder?: string;
            options?: string[]; // Para select
        }>;
        submitText: string;
        apiEndpoint?: string;
    };
}

// HTML Personalizado
export interface CustomHTMLSection extends BaseSection {
    type: 'custom-html';
    data: {
        html: string;
        css?: string;
    };
}

// Union type de todas las secciones
export type DynamicSection =
    | HeroSection
    | StatsSection
    | TextImageSection
    | VideoGallerySection
    | TestimonialsSection
    | CTASection
    | FeaturesSection
    | GallerySection
    | ContactFormSection
    | CustomHTMLSection;

// Estructura completa de la página dinámica
export interface DynamicPageData {
    // Información básica
    pageInfo: {
        slug: string;
        title: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };

    // Configuración de tema
    theme: ThemeConfig;

    // Secciones dinámicas (ordenadas)
    sections: DynamicSection[];
}
