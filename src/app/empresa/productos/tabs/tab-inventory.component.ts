import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';

interface InventoryMovement {
  id: number;
  date: Date;
  type: 'entry' | 'exit';
  quantity: number;
  reason: string;
  finalStock: number;
}

@Component({
  selector: 'app-tab-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ChipModule
  ],
  templateUrl: './tab-inventory.component.html'
})
export class TabInventoryComponent {
  @Input() productForm: any;

  inventoryMovements: InventoryMovement[] = [
    {
      id: 1,
      date: new Date('2026-01-15T10:30:00'),
      type: 'entry',
      quantity: 50,
      reason: 'Compra a proveedor',
      finalStock: 50
    },
    {
      id: 2,
      date: new Date('2026-01-16T15:20:00'),
      type: 'exit',
      quantity: 15,
      reason: 'Venta online',
      finalStock: 35
    },
    {
      id: 3,
      date: new Date('2026-01-17T09:00:00'),
      type: 'entry',
      quantity: 25,
      reason: 'Reposición de stock',
      finalStock: 60
    }
  ];
}
