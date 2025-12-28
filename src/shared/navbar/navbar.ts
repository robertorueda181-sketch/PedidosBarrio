import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.html',
    styleUrl: './navbar.css',
    imports: [RouterModule, RouterLink, CommonModule],
})
export class Navbar {
    isSubmenuOpen = false;

    constructor(private router: Router) { }

    toggleSubmenu() {
        this.isSubmenuOpen = !this.isSubmenuOpen;
    }

    navigateToRegistro(type: string) {
        this.isSubmenuOpen = false; // Cerrar el submenú después de seleccionar

        if (type === 'empresa') {
            this.router.navigate(['/registro-negocio']);
        } else if (type === 'cliente') {
            this.router.navigate(['/register-inmueble']);
        }
    }

    // Cerrar el submenú cuando se hace click fuera (opcional)
    closeSubmenu() {
        this.isSubmenuOpen = false;
    }
}
