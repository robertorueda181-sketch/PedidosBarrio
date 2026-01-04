import { Routes } from '@angular/router';
import { App } from './app';
import { Register } from '../pages/register/register';
import { RegisterInmueble } from '../pages/register-inmueble/register-inmueble';
import { Login } from '../pages/login/login';
import { Main } from '../shared/main/main';
import { Layout } from '../shared/Layout/layout';
import { Inmbueble } from '../pages/inmbueble/inmbueble';
import { Company } from '../pages/company/company';
import { Amanro } from '../pages/companies/amanro/amanro';
import { Stacion64 } from '../pages/companies/stacion64/stacion64';
import { authGuard } from '../shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'login', component: Login },
      { path: 'registro-negocio', component: Register, canActivate: [authGuard] },
      { path: 'registro-inmueble', component: RegisterInmueble, canActivate: [authGuard] },
      { path: 'inmueble', component: Inmbueble },
      { path: 'inmueble/:id', loadComponent: () => import('./pages/inmueble-detalle/inmueble-detalle').then(m => m.InmuebleDetalle) },
      { path: 'company', component: Company },
    ]
  },
  {
    path: 'empresa',
    loadComponent: () => import('./empresa/layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./empresa/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'productos', loadComponent: () => import('./empresa/productos/productos').then(m => m.ProductosComponent) },
      { path: 'inmuebles', loadComponent: () => import('./empresa/inmuebles/inmuebles').then(m => m.Inmuebles) },
      { path: 'oficios', loadComponent: () => import('./empresa/oficios/oficios').then(m => m.Oficios) },
      { path: 'suscripcion', loadComponent: () => import('./empresa/suscripcion/suscripcion').then(m => m.Suscripcion) },
      { path: 'perfil', loadComponent: () => import('./empresa/perfil/perfil').then(m => m.Perfil) },
      { path: 'sitio', loadComponent: () => import('./empresa/sitio-web/sitio-web').then(m => m.SitioWeb) }
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
      { path: 'inmueble', component: Inmbueble },
    ]
  },
  { path: 'amanro', component: Amanro },
  { path: 'stacion64', component: Stacion64 },
  { path: '**', redirectTo: '' }
];