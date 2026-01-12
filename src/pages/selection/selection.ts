import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './selection.html',
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class Selection {
    private router = inject(Router);

    selectType(type: 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE') {
        localStorage.setItem('userType', type);
        this.router.navigate(['/empresa/dashboard']);
    }
}
