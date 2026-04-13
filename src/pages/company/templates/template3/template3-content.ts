export interface TemplateThreeThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text_main: string;
    text_light: string;
  };
  typography: {
    font_family_headings: string;
    font_family_body: string;
    base_size: string;
  };
}

export interface TemplateThreeStatItem {
  value: string;
  label: string;
}

export interface TemplateThreeAboutFeature {
  label: string;
  detail: string;
}

export interface TemplateThreeHeroSection {
  type: 'hero';
  id: string;
  content: {
    overline: string;
    title: string;
    subtitle: string;
    primary_cta: {
      text: string;
      link: string;
    };
    secondary_cta: {
      text: string;
      link: string;
    };
    stats: TemplateThreeStatItem[];
  };
}

export interface TemplateThreeAboutSection {
  type: 'about_us';
  id: string;
  content: {
    overline: string;
    title: string;
    description: string;
    secondary_description: string;
    features: TemplateThreeAboutFeature[];
    image_highlight: {
      url: string;
      rating: number;
    };
  };
}

export interface TemplateThreeMenuSection {
  type: 'menu';
  id: string;
  content: {
    overline: string;
    title: string;
    description: string;
    all_categories_label: string;
  };
}

export interface TemplateThreeGallerySection {
  type: 'gallery';
  id: string;
  content: {
    overline: string;
    title: string;
    description: string;
    items: Array<{
      type: 'image';
      url: string;
      caption?: string;
    }>;
  };
}

export interface TemplateThreeVideoItem {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface TemplateThreeVideoSection {
  type: 'videos';
  id: string;
  content: {
    overline: string;
    title: string;
    description: string;
    items: TemplateThreeVideoItem[];
  };
}

export interface TemplateThreeTestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface TemplateThreeTestimonialsSection {
  type: 'testimonials';
  id: string;
  content: {
    overline: string;
    title: string;
    summary_text: string;
    items: TemplateThreeTestimonialItem[];
  };
}

export interface TemplateThreeReservationSection {
  type: 'reservation';
  id: string;
  content: {
    overline: string;
    title: string;
    description: string;
    name_placeholder: string;
    phone_placeholder: string;
    guests_placeholder: string;
    guest_options: string[];
    occasion_placeholder: string;
    occasion_options: string[];
    notes_placeholder: string;
    submit_text: string;
    success_text: string;
    help_text: string;
  };
}

export interface TemplateThreeContactSection {
  type: 'contact';
  id: string;
  content: {
    social_title: string;
    address_label: string;
    phone_label: string;
    email_label: string;
    hours_label: string;
    map_fallback_text: string;
    default_address: string;
    default_phone: string;
    default_email: string;
    hours: string[];
  };
}

export interface TemplateThreeFooterSection {
  type: 'footer';
  id: string;
  content: {
    description: string;
  };
}

export type TemplateThreeSectionData =
  | TemplateThreeHeroSection
  | TemplateThreeAboutSection
  | TemplateThreeMenuSection
  | TemplateThreeGallerySection
  | TemplateThreeVideoSection
  | TemplateThreeTestimonialsSection
  | TemplateThreeReservationSection
  | TemplateThreeContactSection
  | TemplateThreeFooterSection;

export interface TemplateThreePageData {
  theme: TemplateThreeThemeConfig;
  sections: TemplateThreeSectionData[];
}

export const TEMPLATE_THREE_STATIC_CONTENT: TemplateThreePageData = {
  theme: {
    colors: {
      primary: '#2D2A70',
      secondary: '#C59D5F',
      background: '#FFFEF2',
      text_main: '#333333',
      text_light: '#FFFFFF'
    },
    typography: {
      font_family_headings: 'Playfair Display, serif',
      font_family_body: 'Montserrat, sans-serif',
      base_size: '16px'
    }
  },
  sections: [
    {
      type: 'hero',
      id: 'inicio',
      content: {
        overline: 'EXPERIENCIA GASTRONÓMICA',
        title: 'Sabores que convierten una salida en un recuerdo',
        subtitle: 'Cocina con personalidad, ambiente cálido y una propuesta pensada para compartir grandes momentos.',
        primary_cta: {
          text: 'Reservar',
          link: '#reservas'
        },
        secondary_cta: {
          text: 'Ver nuestro menú',
          link: '#menu'
        },
        stats: [
          { value: '12+', label: 'Especialidades destacadas' },
          { value: '4.8', label: 'Valoración promedio' },
          { value: '500+', label: 'Clientes satisfechos' }
        ]
      }
    },
    {
      type: 'about_us',
      id: 'sobre-nosotros',
      content: {
        overline: 'NUESTRA HISTORIA',
        title: 'Sobre Nosotros',
        description: 'Nuestro objetivo es que cada visita se convierta en una experiencia memorable, tanto por el servicio como por la calidad de nuestros productos.',
        secondary_description: 'Aqui escriba una descripcion secundaria que hable un poco mas de la historia del negocio, sus valores, su propuesta unica y lo que lo hace especial. Este texto es importante para conectar con los clientes y transmitir la personalidad de la marca de manera mas profunda.',
        features: [
          { label: 'Ingredientes frescos', detail: 'Seleccionados a diario' },
          { label: 'Ambiente único', detail: 'Un espacio con carácter propio' },
          { label: 'Cocina auténtica', detail: 'Sabores con identidad' },
          { label: 'Servicio excepcional', detail: 'Atención personalizada' }
        ],
        image_highlight: {
          url: '/assets/image-default.webp',
          rating: 4.8
        }
      }
    },
    {
      type: 'menu',
      id: 'menu',
      content: {
        overline: 'LO QUE OFRECEMOS',
        title: 'Nuestro Menú',
        description: 'Explora una selección de productos y categorías que representan lo mejor de nuestra propuesta.',
        all_categories_label: 'Todas'
      }
    },
    {
      type: 'gallery',
      id: 'galeria',
      content: {
        overline: 'MOMENTOS Y SABORES',
        title: 'Galería',
        description: 'Una selección visual de los platos, espacios y momentos que hacen única tu marca.',
        items: [
          { type: 'image', url: '/assets/image-default.webp', caption: 'Momentos con estilo' },
          { type: 'image', url: '/assets/image-default.webp',caption: 'Sabores peruanos' },
          { type: 'image', url: '/assets/image-default.webp', caption: 'Detalles que enamoran' },
          { type: 'image', url: '/assets/image-default.webp', caption: 'Presentación impecable' }
        ]
      }
    },
    {
      type: 'videos',
      id: 'videos',
      content: {
        overline: 'VIVE LA EXPERIENCIA',
        title: 'Videos',
        description: 'Muestra el ambiente, la cocina y la personalidad de tu marca con contenido audiovisual.',
        items: [
          {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Conoce nuestro ambiente',
            description: 'Un recorrido por la experiencia que vive cada cliente en el local.'
          },
          {
            url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
            title: 'Preparación de especialidades',
            description: 'Descubre cómo preparamos algunos de nuestros platos más pedidos.'
          }
        ]
      }
    },
    {
      type: 'testimonials',
      id: 'testimonios',
      content: {
        overline: 'LO QUE DICEN NUESTROS CLIENTES',
        title: 'Testimonios',
        summary_text: 'Calificación promedio basada en reseñas de clientes frecuentes.',
        items: [
          {
            name: 'María González',
            role: 'Cliente frecuente · Lima',
            text: 'La comida, el ambiente y la atención hacen que siempre quiera volver.',
            rating: 5
          },
          {
            name: 'Carlos Ríos',
            role: 'Gastronómico local · Miraflores',
            text: 'Una propuesta con personalidad propia y platos que realmente destacan.',
            rating: 5
          },
          {
            name: 'Diego Morales',
            role: 'Visita especial · San Isidro',
            text: 'Celebramos una fecha importante y la experiencia fue excelente de inicio a fin.',
            rating: 4.5
          }
        ]
      }
    },
    {
      type: 'reservation',
      id: 'reservas',
      content: {
        overline: 'ASEGURA TU LUGAR',
        title: 'Reserva tu Mesa',
        description: 'Completa el formulario y nos comunicaremos contigo para confirmar.',
        name_placeholder: 'Tu nombre completo',
        phone_placeholder: 'WhatsApp / Teléfono',
        guests_placeholder: 'Número de personas',
        guest_options: [
          '1 persona',
          '2 personas',
          '3-4 personas',
          '5-6 personas',
          '7-10 personas',
          '10+ personas (evento)'
        ],
        occasion_placeholder: 'Ocasión especial (opcional)',
        occasion_options: [
          'Cumpleaños',
          'Aniversario',
          'Reunión de negocios',
          'Cena romántica',
          'Reunión familiar',
          'Otra celebración'
        ],
        notes_placeholder: 'Comentarios o peticiones especiales...',
        submit_text: 'Solicitar Reserva',
        success_text: '✓ Solicitud enviada — te contactaremos pronto',
        help_text: 'También puedes escribirnos por WhatsApp para confirmar tu reserva.'
      }
    },
    {
      type: 'contact',
      id: 'contacto',
      content: {
        social_title: 'Síguenos en redes sociales',
        address_label: 'Dirección',
        phone_label: 'Teléfono / WhatsApp',
        email_label: 'Correo electrónico',
        hours_label: 'Horario de atención',
        map_fallback_text: 'Ubicación disponible próximamente',
        default_address: 'Dirección disponible próximamente',
        default_phone: 'Número disponible próximamente',
        default_email: 'Correo disponible próximamente',
        hours: [
          'Lun–Jue: 12:00 – 22:00',
          'Vie–Sáb: 12:00 – 00:00',
          'Dom: 12:00 – 20:00'
        ]
      }
    },
    {
      type: 'footer',
      id: 'footer',
      content: {
        description: 'Una experiencia gastronómica pensada para disfrutarse con todos los sentidos.',
      }
    }
  ]
};
