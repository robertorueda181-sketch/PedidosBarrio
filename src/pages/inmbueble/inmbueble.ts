import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
interface Inmueble {
  tipo: string;
  operacion: string;
  titulo: string;
  precio: string;
  distrito?: string;
  habitaciones?: number;
  banios?: number;
  area?: string;
  imagen: string;
}

@Component({
  selector: 'app-inmbueble',
  imports: [CommonModule],
  templateUrl: './inmbueble.html',
  styleUrl: './inmbueble.css',
})
export class Inmbueble {
      filtros = {
    tipo: 'Todos los tipos',
    operacion: 'Todas',
    distrito: 'Todos los distritos',
    precio: 'Sin límite',
  };

  tipos = ['Todos los tipos', 'Departamento', 'Casa', 'Local Comercial'];
  operaciones = ['Todas', 'Alquiler', 'Venta'];
  distritos = ['Todos los distritos', 'San Isidro', 'Miraflores', 'San Miguel'];
  precios = ['Sin límite', 'S/ 1,000', 'S/ 3,000', 'S/ 5,000'];

  inmuebles: Inmueble[] = [
    {
      tipo: 'Departamento',
      operacion: 'Alquiler',
      titulo: 'Departamento Moderno en San Isidro',
      precio: 'S/ 2,800',
      distrito: 'San Isidro',
      habitaciones: 3,
      banios: 2,
      area: '90m²',
      imagen: 'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Casa',
      operacion: 'Alquiler',
      titulo: 'Casa Familiar en Miraflores',
      precio: 'S/ 4,500',
      distrito: 'Miraflores',
      habitaciones: 4,
      banios: 3,
      area: '150m²',
      imagen: 'https://images.unsplash.com/photo-1501183638714-8adaf9bfeaa3?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Local Comercial',
      operacion: 'Alquiler',
      titulo: 'Local Comercial en San Miguel',
      precio: 'S/ 3,200',
      distrito: 'San Miguel',
      habitaciones: 0,
      banios: 1,
      area: '80m²',
      imagen: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Local Comercial',
      operacion: 'Alquiler',
      titulo: 'Local Comercial en San Miguel',
      precio: 'S/ 3,200',
      distrito: 'San Miguel',
      habitaciones: 0,
      banios: 1,
      area: '80m²',
      imagen: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Local Comercial',
      operacion: 'Alquiler',
      titulo: 'Local Comercial en San Miguel',
      precio: 'S/ 3,200',
      distrito: 'San Miguel',
      habitaciones: 0,
      banios: 1,
      area: '80m²',
      imagen: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Local Comercial',
      operacion: 'Alquiler',
      titulo: 'Local Comercial en San Miguel',
      precio: 'S/ 3,200',
      distrito: 'San Miguel',
      habitaciones: 0,
      banios: 1,
      imagen: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
    },
    {
      tipo: 'Local Comercial',
      operacion: 'Alquiler',
      titulo: 'Local Comercial en San Miguel',
      precio: 'S/ 3,200',
      distrito: 'San Miguel',
      habitaciones: 0,
      banios: 1,
      area: '80m²',
      imagen: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
    },
  ];

  filtrarInmuebles(): Inmueble[] {
    return this.inmuebles.filter(inmueble => {
      return (this.filtros.tipo === 'Todos los tipos' || inmueble.tipo === this.filtros.tipo) &&
             (this.filtros.operacion === 'Todas' || inmueble.operacion === this.filtros.operacion) &&
             (this.filtros.distrito === 'Todos los distritos' || inmueble.distrito === this.filtros.distrito);
      // Para precio se puede añadir lógica más compleja si es necesario
    });
  }
}