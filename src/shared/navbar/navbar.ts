import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.html',
    imports: [RouterModule,RouterLink],
})
export class Navbar {
    constructor(private router: Router) { }
    goToRegistro() {
        this.router.navigate(['/registro-negocio']);
    }
}
