import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-tab-modifiers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    ChipModule,
    TooltipModule
  ],
  templateUrl: './tab-modifiers.component.html'
})
export class TabModifiersComponent {
  @Input() productForm: any;
  @Input() newModifier: { name: string; options: string; required: boolean } = { name: '', options: '', required: false };
  @Output() addModifier = new EventEmitter<void>();
  @Output() removeModifier = new EventEmitter<string>();
}
