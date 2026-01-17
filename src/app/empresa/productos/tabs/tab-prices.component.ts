import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-tab-prices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ChipModule,
    TabsModule
  ],
  templateUrl: './tab-prices.component.html'
})
export class TabPricesComponent {
  @Input() productForm: any;
  @Input() newVariant: { name: string; price: number } = { name: '', price: 0 };
  @Output() addVariant = new EventEmitter<void>();
  @Output() removeVariant = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();

  activeTab = 'simple';
  variantMessage = '';

  validatePrice(): boolean {
    if (this.activeTab === 'simple') {
      // Validar precio simple
      if (!this.productForm.price || this.productForm.price <= 0) {
        this.validationError.emit('Por favor ingresa un precio válido para el producto');
        return false;
      }
    } else {
      // Validar variantes
      if (!this.productForm.variants || this.productForm.variants.length === 0) {
        this.validationError.emit('Por favor agrega al menos una variante con su precio');
        return false;
      }
      
      // Verificar que todas las variantes tengan precio
      const invalidVariant = this.productForm.variants.find((v: any) => !v.price || v.price <= 0);
      if (invalidVariant) {
        this.validationError.emit('Todas las variantes deben tener un precio válido');
        return false;
      }
    }
    return true;
  }
}
