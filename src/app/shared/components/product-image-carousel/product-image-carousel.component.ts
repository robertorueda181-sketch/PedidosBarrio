import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-product-image-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-image-carousel.component.html',
  styleUrls: ['./product-image-carousel.component.css']
})
export class ProductImageCarouselComponent {
  @Input() images: string[] = [];
  
  currentIndex = signal(0);

  next(): void {
    if (this.images.length === 0) return;
    this.currentIndex.set((this.currentIndex() + 1) % this.images.length);
  }

  prev(): void {
    if (this.images.length === 0) return;
    this.currentIndex.set((this.currentIndex() - 1 + this.images.length) % this.images.length);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }
}
