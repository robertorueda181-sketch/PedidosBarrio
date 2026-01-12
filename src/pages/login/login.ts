import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, GoogleSigninButtonModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        effect(() => {
            if (this.authService.loggedIn()) {
                const userType = localStorage.getItem('userType');
                if (userType) {
                    this.router.navigate(['/empresa/inicio']);
                } else {
                    this.router.navigate(['/selection']);
                }
            }
        });
    }
}
