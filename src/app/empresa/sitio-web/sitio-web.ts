import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: string;
  sections: WebsiteSection[];
}

interface WebsiteSection {
  id: string;
  type: 'hero' | 'about' | 'services' | 'gallery' | 'contact' | 'text';
  title: string;
  content: string;
  images?: string[];
  settings: any;
}

@Component({
  selector: 'app-sitio-web',
  imports: [CommonModule, FormsModule, NgxEditorModule],
  templateUrl: './sitio-web.html',
  styleUrl: './sitio-web.css',
})
export class SitioWeb implements OnInit, OnDestroy {
  editor: Editor = new Editor();
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  selectedTemplate: WebsiteTemplate | null = null;
  currentSection: WebsiteSection | null = null;
  hoveredSection: WebsiteSection | null = null;
  isSaving = false;
  viewMode: 'desktop' | 'mobile' = 'desktop';

  templates: WebsiteTemplate[] = [
    {
      id: 'business-basic',
      name: 'Negocio Básico',
      description: 'Plantilla simple y elegante para pequeños negocios',
      preview: '/assets/templates/business-basic.jpg',
      category: 'Negocios',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Bienvenido a Nuestra Empresa',
          content: '<h1>Bienvenido a Nuestra Empresa</h1><p>Somos líderes en nuestro sector ofreciendo servicios de calidad.</p>',
          settings: { backgroundColor: '#667eea', textColor: '#ffffff' }
        },
        {
          id: 'about',
          type: 'about',
          title: 'Sobre Nosotros',
          content: '<h2>Sobre Nosotros</h2><p>Con años de experiencia en el mercado, nos dedicamos a...</p>',
          settings: {}
        },
        {
          id: 'services',
          type: 'services',
          title: 'Nuestros Servicios',
          content: '<h2>Nuestros Servicios</h2><p>Ofrecemos una amplia gama de servicios...</p>',
          settings: {}
        },
        {
          id: 'contact',
          type: 'contact',
          title: 'Contáctanos',
          content: '<h2>Contáctanos</h2><p>Estamos aquí para ayudarte</p>',
          settings: {}
        }
      ]
    },
    {
      id: 'restaurant',
      name: 'Restaurante',
      description: 'Diseño atractivo para restaurantes y comida',
      preview: '/assets/templates/restaurant.jpg',
      category: 'Restaurantes',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Deliciosa Comida Casera',
          content: '<h1>Deliciosa Comida Casera</h1><p>Disfruta de los mejores platos preparados con amor</p>',
          settings: { backgroundImage: '/assets/food-hero.jpg' }
        },
        {
          id: 'menu',
          type: 'text',
          title: 'Nuestro Menú',
          content: '<h2>Nuestro Menú</h2><p>Platos tradicionales y modernos</p>',
          settings: {}
        },
        {
          id: 'gallery',
          type: 'gallery',
          title: 'Galería',
          content: '',
          images: ['/assets/food1.jpg', '/assets/food2.jpg', '/assets/food3.jpg'],
          settings: {}
        }
      ]
    },
    {
      id: 'professional-services',
      name: 'Servicios Profesionales',
      description: 'Ideal para consultores, abogados y profesionales',
      preview: '/assets/templates/professional.jpg',
      category: 'Profesional',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Excelencia Profesional',
          content: '<h1>Excelencia Profesional</h1><p>Más de 10 años de experiencia en el sector</p>',
          settings: { backgroundColor: '#2d3748', textColor: '#ffffff' }
        },
        {
          id: 'expertise',
          type: 'text',
          title: 'Nuestra Experiencia',
          content: '<h2>Nuestra Experiencia</h2><p>Especialistas en...</p>',
          settings: {}
        },
        {
          id: 'testimonials',
          type: 'text',
          title: 'Testimonios',
          content: '<h2>Lo que dicen nuestros clientes</h2>',
          settings: {}
        }
      ]
    }
  ];

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    // Initialize editor
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  selectTemplate(template: WebsiteTemplate | null) {
    if (template === null) {
      this.selectedTemplate = null;
      this.currentSection = null;
      return;
    }
    this.selectedTemplate = { ...template };
    this.currentSection = null;
  }

  selectSection(section: WebsiteSection) {
    this.currentSection = section;
  }

  setHoveredSection(section: WebsiteSection | null) {
    this.hoveredSection = section;
  }

  addSection(type: string) {
    if (!this.selectedTemplate) return;

    const newSection: WebsiteSection = {
      id: `section-${Date.now()}`,
      type: type as any,
      title: `Nueva Sección ${type}`,
      content: `<h2>Nueva Sección ${type}</h2><p>Contenido de la sección...</p>`,
      settings: {}
    };

    this.selectedTemplate.sections.push(newSection);
    this.selectSection(newSection);
  }

  removeSection(sectionId: string) {
    if (!this.selectedTemplate) return;
    this.selectedTemplate.sections = this.selectedTemplate.sections.filter(s => s.id !== sectionId);
    if (this.currentSection?.id === sectionId) {
      this.currentSection = null;
    }
  }

  moveSection(sectionId: string, direction: 'up' | 'down') {
    if (!this.selectedTemplate) return;

    const index = this.selectedTemplate.sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.selectedTemplate.sections.length) return;

    const section = this.selectedTemplate.sections.splice(index, 1)[0];
    this.selectedTemplate.sections.splice(newIndex, 0, section);
  }

  async saveWebsite() {
    this.isSaving = true;
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Sitio web guardado exitosamente');
    } catch (error) {
      alert('Error al guardar el sitio web');
    } finally {
      this.isSaving = false;
    }
  }

  previewWebsite() {
    if (!this.selectedTemplate) return;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Por favor, permite las ventanas emergentes para ver la previsualización.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Previsualización - ${this.selectedTemplate.name}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
          .section-hero { padding: 4rem 0; }
          .section-text { padding: 2rem 0; }
          .section-gallery { padding: 2rem 0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${this.selectedTemplate.sections.map(section => `
          <div class="${this.getSectionClass(section)}" style="background-color: ${section.settings.backgroundColor || 'transparent'}; color: ${section.settings.textColor || 'inherit'}; padding: 4rem 0;">
            <div class="container mx-auto px-4">
              ${section.content}
              ${section.type === 'gallery' && section.images ? `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  ${section.images.map(img => `<img src="${img}" class="w-full h-64 object-cover rounded-lg shadow-md">`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }

  publishWebsite() {
    if (confirm('¿Estás seguro de que quieres publicar los cambios? Esto hará que tu sitio web sea visible para todos.')) {
      alert('Sitio web publicado exitosamente');
    }
  }

  onImageUpload(event: any, section: WebsiteSection) {
    const file = event.target.files[0];
    if (file) {
      // Aquí iría la lógica para subir la imagen
      console.log('Imagen seleccionada:', file);
      // Simular URL de imagen subida
      const imageUrl = URL.createObjectURL(file);
      if (!section.images) section.images = [];
      section.images.push(imageUrl);
    }
  }

  onEditorImageUpload(event: any) {
    const file = event.target.files[0];
    if (file && this.currentSection) {
      const imageUrl = URL.createObjectURL(file);
      // Append image to content
      this.currentSection.content += `<img src="${imageUrl}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" />`;
    }
  }

  removeImage(section: WebsiteSection, imageIndex: number) {
    if (section.images) {
      section.images.splice(imageIndex, 1);
    }
  }
  getSectionClass(section: WebsiteSection): string {
    switch (section.type) {
      case 'hero':
        return 'section-hero';
      case 'text':
        return 'section-text';
      case 'gallery':
        return 'section-gallery';
      default:
        return 'section-text';
    }
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
