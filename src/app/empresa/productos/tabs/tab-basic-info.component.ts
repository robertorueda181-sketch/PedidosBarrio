import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-tab-basic-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    ToggleSwitchModule,
    InputNumberModule,
    TooltipModule
  ],
  templateUrl: './tab-basic-info.component.html'
})
export class TabBasicInfoComponent {
  @Input({ required: true }) productForm!: any;
  @Input() categories: any[] = [];
  @Input() kitchenAreas: string[] = [];
  @Output() openImageModal = new EventEmitter<void>();
  @Output() deleteImage = new EventEmitter<void>();
  @Output() showStockInfo = new EventEmitter<void>();
}
