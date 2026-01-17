import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-tab-basic-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    TooltipModule,
    ToggleSwitchModule,
    InputNumberModule
  ],
  templateUrl: './tab-basic-info.component.html'
})
export class TabBasicInfoComponent {
  @Input() productForm: any;
  @Input() categories: Category[] = [];
  @Input() kitchenAreas: string[] = [];
  @Output() openImageModal = new EventEmitter<void>();
  @Output() deleteImage = new EventEmitter<void>();
  @Output() showStockInfo = new EventEmitter<void>();
}
