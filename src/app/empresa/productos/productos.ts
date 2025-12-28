import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  active: boolean;
}

@Component({
  selector: 'app-productos',
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosComponent {
  products: Product[] = [
    {
      id: 1,
      name: 'Producto 1',
      description: 'Descripción del producto 1',
      category: 'Electrónica',
      price: 99.99,
      active: true
    },
    {
      id: 2,
      name: 'Producto 2',
      description: 'Descripción del producto 2',
      category: 'Ropa',
      price: 49.99,
      active: true
    },
    {
      id: 3,
      name: 'Producto 3',
      description: 'Descripción del producto 3',
      category: 'Hogar',
      price: 149.99,
      active: false
    }
  ];
}
