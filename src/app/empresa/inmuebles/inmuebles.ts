import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  available: boolean;
}

@Component({
  selector: 'app-inmuebles',
  imports: [CommonModule],
  templateUrl: './inmuebles.html',
  styleUrl: './inmuebles.css',
})
export class Inmuebles {
  properties: Property[] = [
    {
      id: 1,
      title: 'Apartamento Centro',
      address: 'Calle Principal 123, Centro',
      price: 150000,
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      available: true
    }
  ];
}
