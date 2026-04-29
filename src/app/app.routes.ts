import { Routes } from '@angular/router';
import { BusinessRegisterComponent } from '../pages/auth/business-register/business-register';
import { RegisterInmueble } from '../pages/register-inmueble/register-inmueble';
import { Main } from '../shared/main/main';
import { Layout } from '../shared/Layout/layout';
import { InmuebleComponent } from '../pages/inmueble/inmueble';
import { Company } from '../pages/company/company';
import { CompanyTemplatesPage } from '../pages/company/templates/templates-page';
import { Amanro } from '../pages/companies/amanro/amanro';
import { Stacion64 } from '../pages/companies/stacion64/stacion64';
import { PilarComponent } from '../pages/companies/pilar/pilar';
import { authGuard } from '../shared/guards/auth.guard';
import { unsavedChangesGuard } from '../shared/guards/unsaved-changes.guard';


export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'ingreso', loadComponent: () => import('../pages/auth/client-auth/client-auth').then(m => m.ClientAuthComponent) },
      { path: 'mi-perfil', loadComponent: () => import('../pages/client/profile/profile').then(m => m.ClientProfileComponent), canActivate: [authGuard] },
      { path: 'registro-inmueble', component: RegisterInmueble, canActivate: [authGuard] },
      { path: 'inmueble', component: InmuebleComponent },
      { path: 'negocios', loadComponent: () => import('../pages/negocios/negocios').then(m => m.NegociosComponent) },
      { path: 'servicios', loadComponent: () => import('../pages/servicios/servicios').then(m => m.ServiciosComponent) },
      { path: 'servicio/:id', loadComponent: () => import('../pages/servicio-detalle/servicio-detalle').then(m => m.ServicioDetalleComponent) },
      { path: 'buscar', loadComponent: () => import('../pages/search-results/search-results.component').then(m => m.SearchResultsComponent) },
    ]
  },
  { path: 'negocio/:codigoempresa', component: Company },
  { path: 'negocio/:codigoempresa/productos', loadComponent: () => import('../pages/company/products/company-products-page').then(m => m.CompanyProductsPage) },
  { path: 'negocio/:codigoempresa/plantillas', component: CompanyTemplatesPage },
  { path: 'empresa/sitio/preview', loadComponent: () => import('./empresa/sitio-web/sitio-web-preview').then(m => m.SitioWebPreview) },
  { path: 'empresa/sitio/preview/productos', loadComponent: () => import('../pages/company/products/company-products-page').then(m => m.CompanyProductsPage) },
  { path: 'business-register', component: BusinessRegisterComponent },
  {
    path: 'empresa',
    loadComponent: () => import('./empresa/layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('./empresa/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'pasos-iniciales', loadComponent: () => import('./empresa/pasos-iniciales/pasos-iniciales').then(m => m.PasosIniciales) },
      { path: 'productos', loadComponent: () => import('./empresa/productos/productos').then(m => m.ProductosComponent) },
      { path: 'productos/nuevo', loadComponent: () => import('./empresa/productos/producto-editor').then(m => m.ProductoEditorComponent) },
      { path: 'productos/:id/editar', loadComponent: () => import('./empresa/productos/producto-editor').then(m => m.ProductoEditorComponent) },
      { path: 'inmuebles', loadComponent: () => import('./empresa/inmuebles/inmuebles').then(m => m.Inmuebles) },
      { path: 'oficios', loadComponent: () => import('./empresa/oficios/oficios').then(m => m.Oficios) },
      { path: 'suscripcion', loadComponent: () => import('./empresa/suscripcion/suscripcion').then(m => m.Suscripcion) },
      { path: 'perfil', loadComponent: () => import('./empresa/perfil/perfil').then(m => m.Perfil) },
      { path: 'sitio', loadComponent: () => import('./empresa/sitio-web/sitio-web').then(m => m.SitioWeb), canDeactivate: [unsavedChangesGuard] },
      { path: 'mi-sitio', redirectTo: 'sitio', pathMatch: 'full' },
      { path: 'promociones', loadComponent: () => import('./empresa/promociones/promociones').then(m => m.Promociones) },
      { path: 'banner', loadComponent: () => import('./empresa/banner/banner').then(m => m.Banner) },
      { path: 'actividad', loadComponent: () => import('./empresa/analytics/analytics-dashboard').then(m => m.AnalyticsDashboardComponent) },
      { path: 'pedidos', loadComponent: () => import('./empresa/pedidos/pedidos').then(m => m.PedidosComponent) },
    ]
  },
  {
    path: 'inicio',
    component: Layout,
  },
 
  { path: 'business-auth', loadComponent: () => import('../pages/auth/business-auth/business-auth').then(m => m.BusinessAuth) },
  { path: 'amanro', component: Amanro },
  { path: 'stacion-64', component: Stacion64 },
  { path: 'pilar', component: PilarComponent },
  { path: '**', redirectTo: '' }
];