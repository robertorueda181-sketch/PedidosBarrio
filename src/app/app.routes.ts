import { Routes } from '@angular/router';
import { Register } from '../pages/register/register';
import { RegisterInmueble } from '../pages/register-inmueble/register-inmueble';
import { Main } from '../shared/main/main';
import { Layout } from '../shared/Layout/layout';
import { InmuebleComponent } from '../pages/inmueble/inmueble';
import { Company } from '../pages/company/company';
import { Amanro } from '../pages/companies/amanro/amanro';
import { Stacion64 } from '../pages/companies/stacion64/stacion64';
import { PilarComponent } from '../pages/companies/pilar/pilar';
import { authGuard } from '../shared/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'registro-negocio', component: Register },
      { path: 'registro-inmueble', component: RegisterInmueble, canActivate: [authGuard] },
      { path: 'inmueble', component: InmuebleComponent },
      { path: 'inmueble/:id', loadComponent: () => import('./pages/inmueble-detalle/inmueble-detalle').then(m => m.InmuebleDetalle) },
      { path: 'negocios', loadComponent: () => import('../pages/negocios/negocios').then(m => m.NegociosComponent) },
      { path: 'servicios', loadComponent: () => import('../pages/servicios/servicios').then(m => m.ServiciosComponent) },
      { path: 'servicio/:id', loadComponent: () => import('../pages/servicio-detalle/servicio-detalle').then(m => m.ServicioDetalleComponent) },
      { path: 'buscar', loadComponent: () => import('../pages/search-results/search-results.component').then(m => m.SearchResultsComponent) },
      { path: 'company', component: Company },
    ]
  },
  {
    path: 'empresa',
    loadComponent: () => import('./empresa/layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('./empresa/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'productos', loadComponent: () => import('./empresa/productos/productos').then(m => m.ProductosComponent) },
      { path: 'inmuebles', loadComponent: () => import('./empresa/inmuebles/inmuebles').then(m => m.Inmuebles) },
      { path: 'oficios', loadComponent: () => import('./empresa/oficios/oficios').then(m => m.Oficios) },
      { path: 'suscripcion', loadComponent: () => import('./empresa/suscripcion/suscripcion').then(m => m.Suscripcion) },
      { path: 'perfil', loadComponent: () => import('./empresa/perfil/perfil').then(m => m.Perfil) },
      { path: 'sitio', loadComponent: () => import('./empresa/sitio-web/sitio-web').then(m => m.SitioWeb) },
      { path: 'promociones', loadComponent: () => import('./empresa/promociones/promociones').then(m => m.Promociones) },
      { path: 'banner', loadComponent: () => import('./empresa/banner/banner').then(m => m.Banner) },
      { path: 'actividad', loadComponent: () => import('./empresa/analytics/analytics-dashboard').then(m => m.AnalyticsDashboardComponent) }
    ]
  },
  {
    path: 'inicio',
    component: Layout,
  },
  {
    path: 'companies',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'registro-negocio', component: Register, canActivate: [authGuard] },
      { path: 'registro-inmueble', component: RegisterInmueble, canActivate: [authGuard] },
      { path: 'inmueble', component: InmuebleComponent },
    ]
  },
  { path: 'business-auth', loadComponent: () => import('../pages/auth/business-auth/business-auth').then(m => m.BusinessAuth) },
  { path: 'amanro', component: Amanro },
  { path: 'stacion64', component: Stacion64 },
  { path: 'pilar', component: PilarComponent },
  { path: '**', redirectTo: '' }
];