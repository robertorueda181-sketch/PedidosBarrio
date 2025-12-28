import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  available: boolean;
  rating: number;
}

@Component({
  selector: 'app-oficios',
  imports: [CommonModule],
  templateUrl: './oficios.html',
  styleUrl: './oficios.css',
})
export class Oficios {
  services: Service[] = [
    {
      id: 1,
      name: 'Reparación de Plomería',
      category: 'Plomería',
      description: 'Servicio completo de reparación y mantenimiento de tuberías, grifos y sistemas de agua.',
      price: 50,
      duration: '2-4 horas',
      available: true,
      rating: 4.5
    }


  ];

  getStarRating(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }
}
