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
    isMenuOpen = false;

    constructor(private router: Router) { }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleSubmenu() {
        this.isSubmenuOpen = !this.isSubmenuOpen;
    }

    navigateToRegistro(type: string) {
        this.isSubmenuOpen = false;

        if (type === 'empresa') {
            this.router.navigate(['/business-auth']);
        } else {
            this.router.navigate(['/login']);
        }
    }

    // Cerrar el submenú cuando se hace click fuera (opcional)
    closeSubmenu() {
        this.isSubmenuOpen = false;
    }
}
