import { Routes } from '@angular/router';
import { App } from './app';
import { Register } from '../pages/register/register';
import { Main } from '../shared/main/main';
import { Layout } from '../shared/Layout/layout';
import { Inmbueble } from '../pages/inmbueble/inmbueble';
import { Company } from '../pages/company/company';
import { Amanro } from '../pages/companies/amanro/amanro';
import { Stacion64 } from '../pages/companies/stacion64/stacion64';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'registro-negocio', component: Register },
      { path: 'inmueble', component: Inmbueble },
      { path: 'company', component: Company },
    ]
  },
  {
    path: 'companies',
    component: Layout,
    children: [
      { path: '', component: Main },
      { path: 'registro-negocio', component: Register },
      { path: 'inmueble', component: Inmbueble },
    ]
  },
  { path: 'amanro', component: Amanro },
  { path: 'stacion64', component: Stacion64 },
  { path: '**', redirectTo: '' }
];