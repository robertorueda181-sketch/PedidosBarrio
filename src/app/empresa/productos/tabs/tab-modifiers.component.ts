import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-tab-modifiers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    ChipModule,
    TooltipModule,
    DialogModule
  ],
  templateUrl: './tab-modifiers.component.html'
})
export class TabModifiersComponent {
  @Input() productForm: any;
  @Input() newModifier: { name: string; options: string; required: boolean; maxSelections: number } = { name: '', options: '', required: false, maxSelections: 1 };
  @Output() addModifier = new EventEmitter<any>();
  @Output() removeModifier = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();
  
  showModifierDialog = false;
  localModifier = { name: '', options: '', required: false, maxSelections: 1 };

  openModifierDialog() {
    this.localModifier = { name: '', options: '', required: false, maxSelections: 1 };
    this.showModifierDialog = true;
  }

  closeModifierDialog() {
    this.showModifierDialog = false;
  }

  saveModifier() {
    // Validar nombre
    if (!this.localModifier.name.trim()) {
      this.validationError.emit('Ingresa un nombre para la categoría de modificadores');
      return;
    }

    // Validar opciones
    const options = this.localModifier.options
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (options.length === 0) {
      this.validationError.emit('Ingresa al menos una opción (separadas por comas)');
      return;
    }

    // Crear el modificador completo
    const modifier = {
      id: Date.now().toString(),
      name: this.localModifier.name,
      options: options,
      required: this.localModifier.required,
      maxSelections: this.localModifier.maxSelections
    };

    // Emitir el modificador completo al padre
    this.addModifier.emit(modifier);
    this.showModifierDialog = false;
  }
}
