import { Injectable, inject, signal } from '@angular/core';
import { SocialAuthService, SocialUser, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';
import { RegisterService } from './register.service';
import { RegisterRequest } from '../interfaces/register.interface';
import { LoginRequest } from '../interfaces/login.interface';
import { ToastrService } from 'ngx-toastr';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private socialAuthService = inject(SocialAuthService);
    private router = inject(Router);
    private registerService = inject(RegisterService);
    private toastr = inject(ToastrService);

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_data';

    user = signal<SocialUser | null>(null);
    loggedIn = signal<boolean>(false);
    autoRegisterSocial = true; // Control if we register immediately or wait for more data

    constructor() {
        // Check for existing session on app start
        this.checkExistingSession();

        this.socialAuthService.authState.subscribe((user) => {
            this.user.set(user);
            this.loggedIn.set(user != null);
            if (user) {
                console.log('User logged in:', user);
                if (this.autoRegisterSocial) {
                    this.registerSocialUser(user);
                }
            } else {
                // User logged out
                this.clearSession();
            }
        });
    }

    login(credentials: LoginRequest): Observable<any> {
        return this.registerService.login(credentials).pipe(
            tap(response => {
                if (response.token) {
                    const mockSocialUser = {
                        email: credentials.email,
                        firstName: response.user?.nombre || '',
                        lastName: response.user?.apellido || '',
                        id: credentials.googleId || '',
                        provider: credentials.provider || 'LOCAL'
                    } as SocialUser;
                    this.saveSession(response.token, mockSocialUser);
                    this.loggedIn.set(true);
                    this.user.set(mockSocialUser);
                }
            })
        );
    }

    signOut() {
        this.socialAuthService.signOut();
        this.clearSession();
        this.router.navigate(['/business-auth']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            return Date.now() < expiry;
        } catch {
            return false;
        }
    }

    private checkExistingSession() {
        const token = this.getToken();
        const userData = localStorage.getItem(this.USER_KEY);

        if (token && userData && this.isAuthenticated()) {
            try {
                const user = JSON.parse(userData);
                this.user.set(user);
                this.loggedIn.set(true);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearSession();
            }
        }
    }

    public saveSession(token: string, user: SocialUser) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    private clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.user.set(null);
        this.loggedIn.set(false);
    }

    public registerSocialUser(user: SocialUser) {
        // Only register if we have the required data
        if (!user.id || !user.email) {
            console.error('User data incomplete:', user);
            return;
        }

        const userData: RegisterRequest = {
            email: user.email,
            nombre: user.firstName || '',
            apellido: user.lastName || '',
            nombreUsuario: user.email.split('@')[0],
            contrasena: 'GoogleAuth123*',
            nombreEmpresa: '',
            tipoEmpresa: 1,
            categoria: '',
            telefono: '',
            descripcion: '',
            direccion: '',
            referencia: '',
            provider: 'google',
            socialId: user.id,
            idToken: user.idToken || ''
        };

    //     this.registerService.registerSocialUser(userData).subscribe({
    //         next: (response: any) => {
    //             console.log('User registered/authenticated successfully:', response);

    //             // Assuming the backend returns { token: string, user: object }
    //             if (response.token) {
    //                 this.saveSession(response.token, user);
    //                 console.log('Session saved successfully');
    //             } else {
    //                 console.warn('No token received from backend');
    //             }
    //         },
    //         error: (error: any) => {
    //             console.error('Error registering/authenticating user:', error);
    //             const errorMessage = error.error?.message || error.error || 'Error local al autenticar con Google';
    //             this.toastr.error(
    //                 typeof errorMessage === 'string' ? errorMessage : 'Error en la respuesta del servidor (400)',
    //                 'Error de Autenticación'
    //             );
    //         }
    //     });
     }
}
