// Interface para la estructura de datos de la página del colegio
export interface SchoolPageData {
    // Configuración de tema
    theme?: {
        colors: {
            primary: string;      // Color principal (ej: "#1A365D")
            secondary: string;    // Color secundario
            accent: string;       // Color de acento
            background: string;   // Color de fondo
            text: string;         // Color de texto principal
            textLight: string;    // Color de texto secundario
        };
        fonts?: {
            heading: string;      // Fuente para títulos (ej: "Outfit")
            body: string;         // Fuente para texto (ej: "Inter")
        };
        borderRadius?: string;    // Radio de bordes (ej: "2rem", "1rem")
    };

    // Información del Hero/Banner
    hero: {
        imageUrl: string;
        title: string;
        subtitle: string;
        admissionYear: string;
        buttons: {
            primary: string;
            secondary: string;
        };
    };

    // Estadísticas
    stats: Array<{
        label: string;
        value: string;
    }>;

    // Secciones dinámicas
    sections: Array<TextImageSection | VideoGallerySection | ImageGallerySection | CTASection>;
}

// Tipos de secciones
export type SectionType = 'text-image' | 'video-gallery' | 'cta' | 'features' | 'testimonials' | 'image-gallery';

// Sección base
export interface Section {
    id: string;
    type: SectionType;
    order: number;
}

// Sección de Texto + Imagen
export interface TextImageSection extends Section {
    type: 'text-image';
    title: string;
    description: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
    features?: string[];
}

// Sección de Galería de Videos
export interface VideoGallerySection extends Section {
    type: 'video-gallery';
    title: string;
    description?: string;
    videos: Array<{
        title: string;
        url: string;
        description: string;
    }>;
}

// Sección de Galería de Imágenes
export interface ImageGallerySection extends Section {
    type: 'image-gallery';
    title: string;
    description?: string;
    images: Array<{
        url: string;
        alt: string;
        caption?: string;
    }>;
}

// Sección Call to Action
export interface CTASection extends Section {
    type: 'cta';
    title: string;
    description: string;
    buttonText: string;
}
