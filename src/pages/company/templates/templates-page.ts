import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NegocioDetalle, NegocioService } from '../../../shared/services/negocio.service';

interface PublicTemplateCard {
  id: 1 | 2 | 3;
  name: string;
  description: string;
  accent: string;
  sampleTitle: string;
  sampleSubtitle: string;
}

@Component({
  selector: 'app-company-templates-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './templates-page.html',
  styleUrl: './templates-page.css'
})
export class CompanyTemplatesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private negocioService = inject(NegocioService);

  company = signal<NegocioDetalle | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  codigoempresa = signal('');

  templates: PublicTemplateCard[] = [
    {
      id: 1,
      name: 'Template 1 · Clásico',
      description: 'Diseño limpio tipo catálogo con foco en productos y contacto lateral.',
      accent: '#4f46e5',
      sampleTitle: 'Negocio local con catálogo',
      sampleSubtitle: 'Ideal para mostrar productos de forma directa.'
    },
    {
      id: 2,
      name: 'Template 2 · Restaurante',
      description: 'Hero elegante con navegación, buscador y categorías estilo carta.',
      accent: '#7c2d12',
      sampleTitle: 'Experiencia visual tipo menú',
      sampleSubtitle: 'Pensado para restobares, cafés y marcas gastronómicas.'
    },
    {
      id: 3,
      name: 'Template 3 · Premium',
      description: 'Landing completa con hero, menú filtrable, galería, testimonios y reservas.',
      accent: '#7a1a1a',
      sampleTitle: 'Template dinámico de alto impacto',
      sampleSubtitle: 'Recibe parámetros y se adapta a la información del negocio.'
    }
  ];

  currentTemplate = computed(() => {
    const raw = Number(this.company()?.tipoPlantilla);
    return [1, 2, 3].includes(raw) ? raw as 1 | 2 | 3 : 2;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const code = params.get('codigoempresa') || '';
      this.codigoempresa.set(code);
      if (code) {
        this.loadCompany(code);
      }
    });
  }

  private loadCompany(code: string) {
    this.loading.set(true);
    this.error.set(null);

    this.negocioService.getNegocioPorNombre(code).subscribe({
      next: (data) => {
        this.company.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las plantillas del negocio.');
        this.loading.set(false);
      }
    });
  }
}
