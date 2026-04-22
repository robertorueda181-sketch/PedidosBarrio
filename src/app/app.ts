import { Component, signal, inject, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';


import { ToastrService } from 'ngx-toastr';
import { AnalyticsService } from '../shared/services/analytics.service';
import { CookieConsentComponent } from '../shared/components/cookie-consent/cookie-consent';
import { LoaderComponent } from '../shared/components/loader/loader';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CookieConsentComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private toastr = inject(ToastrService);
  private analyticsService = inject(AnalyticsService);

  constructor(private router: Router) {
    // Mostrar loader por 0.5 segundos al iniciar
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  protected readonly title = signal('Espacio Online');
  searchQuery = '';
  isLoading = signal(true);
  
  onSearch() {
    // Aquí puedes agregar la lógica para buscar negocios según searchQuery
    this.toastr.info(`Buscando: ${this.searchQuery}`, 'Búsqueda');
  }

  /**
   * Obtiene el nombre de la página según la ruta
   */
  private getPageName(url: string): string {
    const routes: Record<string, string> = {
      '/': 'Inicio',
      '/negocios': 'Negocios',
      '/servicios': 'Servicios',
      '/inmuebles': 'Inmuebles',
      '/register': 'Registro',
      '/register-inmueble': 'Registro Inmueble',
      '/empresa/dashboard': 'Dashboard Empresa',
      '/empresa/productos': 'Productos',
      '/empresa/perfil': 'Perfil Empresa',
    };

    // Buscar coincidencias exactas
    if (routes[url]) {
      return routes[url];
    }

    // Buscar patrones
    if (url.includes('/company/')) return 'Detalle Negocio';
    if (url.includes('/inmueble/')) return 'Detalle Inmueble';
    if (url.includes('/servicio/')) return 'Detalle Servicio';
    if (url.includes('/search-results')) return 'Resultados de Búsqueda';

    return url;
  }

}
